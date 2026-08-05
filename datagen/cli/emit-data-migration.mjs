// Data-migration emitter: converts the JSON packs into Skyway data migrations for the app's
// migrations/ folder — the SHIPPABLE seed (compact multi-row INSERTs). This is what installs on the
// real Open App path; the mj-sync metadata route is dead (a ~100-240 MB per-record file exceeds
// GitHub's 100 MB blob-fetch ceiling). One .sql per pack, in dependency order; deterministic.
//
// Usage:
//   node emit-data-migration.mjs [--out out] [--version 1.0.0] [--migrations-out ../migrations]
//   --version       the app version this seed belongs to (default: mj-app.json version). CI passes
//                   the package/manifest version; overriding lets you (re)emit a specific version.
//   --migrations-out target dir (default: the app's migrations/). Point elsewhere to preview safely.
//
// Design (see scratchpad/DATA-MIGRATION-PLAN.md):
//  - DATA ONLY. Never emits schema DDL (baseline/emit-schema owns that) or __mj entity-definition
//    rows (CodeGen owns those) — so it can't change codegen output. Business + __mj application data.
//  - Ordered LAST: deterministic filename timestamp = <releaseDate>23:5N (reserved late band, sorts
//    after the release's baseline + codegen + hand V* migrations, before the next release).
//  - Home schema (morecheese_members) → ${flyway:defaultSchema}; all other schemas literal (matches
//    the codegen migration's SQLOutput.schemaPlaceholders).
//  - Deterministic: same seed + release + version → byte-identical (so the CI "emit + fail-on-diff"
//    check is stable).

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { packSqlLines } from '../engine/seed-render.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..');                 // datagen/
const APP_ROOT = join(ROOT, '..');             // the app repo root
const args = Object.fromEntries(process.argv.slice(2).map((a, i, all) => (a.startsWith('--') ? [a.slice(2), all[i + 1]] : null)).filter(Boolean));
const OUT = join(ROOT, args.out ?? 'out');
const load = (pack, table) => JSON.parse(readFileSync(join(OUT, 'packs', pack, `${table}.json`), 'utf8'));
const run = JSON.parse(readFileSync(join(OUT, 'run.json'), 'utf8'));
// The MAPPING is the PROJECT's, not the engine's — loaded by name so this command knows no domain.
// IDs are minted from business keys here, and nothing has composed a ruleset — bind the
// project's own UUID namespace explicitly (see engine/config.mjs bindNamespace).
const { bindNamespace } = await import('../engine/config.mjs');
await bindNamespace(run.project);
const { MAPPING, INSTALL_ORDER, PREAMBLE, POSTAMBLE, deliveryOf, DISPLAY_NAME, HOME_SCHEMA } = await import(`../projects/${run.project}/seed-mapping.mjs`);

// version: explicit --version, else the app's mj-app.json version (the shipped version of record).
const manifestVersion = (() => {
  try { return JSON.parse(readFileSync(join(APP_ROOT, 'mj-app.json'), 'utf8')).version; } catch { return undefined; }
})();
const version = args.version ?? manifestVersion ?? '0.0.0';

const MIGRATIONS_DIR = args['migrations-out'] ? resolve(args['migrations-out']) : join(APP_ROOT, 'migrations');

// Home schema → Flyway default-schema placeholder (only morecheese_members; the rest stay literal).
// the project's OWN schema, declared by the project: a data migration rewrites it to the Flyway
// placeholder so the same file installs into any target schema, and leaves dependency schemas alone.
// This was hardcoded here, which meant a second project's migration would rewrite nothing.
if (!HOME_SCHEMA) throw new Error(`projects/${run.project}/seed-mapping.mjs must export HOME_SCHEMA — the project's own schema, rewritten to \${flyway:defaultSchema} in the migration.`);
const toPlaceholder = (tableRef) => tableRef.replace(`[${HOME_SCHEMA}]`, '[${flyway:defaultSchema}]');

// Deterministic, sort-last timestamp: <releaseYYYYMMDD>23<40+packIndex>. Reserved late band so
// a release's data always applies AFTER that release's baseline + codegen + hand V* migrations.
// (Band starts at :41 so two-digit minutes survive past pack 9 — the old `235${i}` scheme
// produced a 13-digit version at pack 10.)
const ymd = String(run.releaseDate).replace(/-/g, '');           // 2026-07-31 -> 20260731
const seedTs = (packIndex) => `${ymd}23${40 + packIndex}`;        // packIndex 1..19 -> ...2341..2359

mkdirSync(MIGRATIONS_DIR, { recursive: true });
const summary = [];
const written = [];
for (let i = 0; i < INSTALL_ORDER.length; i++) {
  const pack = INSTALL_ORDER[i];
  if (deliveryOf(pack) !== 'insert') continue; // 'metadata' packs ship via the MetadataSync emitter, not here
  // Seed number/band comes from the pack's FIXED position in INSTALL_ORDER (not a running
  // count of emitted packs) — so a pack's migration name is stable regardless of which other
  // packs are metadata-skipped (e.g. platform stays Seed_11 even when it's the only insert pack).
  const packIndex = i + 1;
  const header = [
    `-- ================================================================================`,
    `-- GENERATED — do not edit. ${DISPLAY_NAME ?? run.project} demo seed DATA migration.`,
    `-- pack: ${pack} (install order ${packIndex}) · version ${version}`,
    `-- Generated by datagen/cli/emit-data-migration.mjs · seed ${run.seed} · release ${run.releaseDate} · ruleset v${run.ruleset}`,
    `-- Deterministic: same seed + release + version regenerates this file byte-identically.`,
    `-- Regenerate: npm run datagen:build && npm run datagen:emit-migrations`,
    `-- DATA ONLY — no schema DDL (baseline owns it), no __mj entity-definition rows (CodeGen owns them).`,
    `-- ================================================================================`,
    '',
    ...(PREAMBLE[pack] ?? []),
    ...(PREAMBLE[pack] ? [''] : []),
  ];
  const { lines: bodyLines, summary: packSummary } = packSqlLines(MAPPING, pack, load, { transformTable: toPlaceholder });
  for (const s of packSummary) summary.push({ pack, ...s });
  const fname = `V${seedTs(packIndex)}__v${version}_Seed_${String(packIndex).padStart(2, '0')}_${pack}.sql`;
  writeFileSync(join(MIGRATIONS_DIR, fname), header.concat(bodyLines, POSTAMBLE[pack] ?? []).join('\n'));
  written.push(fname);
}

for (const s of summary) console.log(`${s.pack.padEnd(11)} ${s.table.padEnd(46)} ${String(s.rows).padStart(6)} rows`);
console.log(`\n${written.length} data migration(s) → ${MIGRATIONS_DIR}`);
for (const f of written) console.log(`  ${f}`);
