// mj-sync emitter: converts the JSON packs into an MJ metadata tree.
// Usage: node emit-mjsync.mjs [--out out] [--metadata-out <dir>]   (run build.mjs first)
//   --metadata-out points the tree anywhere — e.g. the app's `metadata/` so a
//   `mj sync push` over that dir picks it up. Resolved against the CWD; default is the
//   disposable out/metadata/. Only THIS emitter's own entity folders are cleared on
//   regeneration — sibling content in the target dir (e.g. schema-info/) is left alone.
//
// Format per docs/template-docs/metadata.md: root .mj-sync.json with directoryOrder
// (parents before children — the push pyramid), one folder per ENTITY with its own
// .mj-sync.json, records as dot-prefixed JSON arrays. Every record pins its primaryKey
// with our deterministic UUID (engine/ids.mjs), so `mj sync push` is a stable upsert.
//
// THE MAPPING LIVES IN engine/seed-mapping.mjs — one entry per table, rendered to BOTH
// delivery paths (SQL literals for the INSERT emitters, raw values + '@lookup:' references
// here, via renderRecord()). This file used to carry its own 59-entry duplicate of that
// mapping; the duplication is where 'MJ: Entities' was once misspelled and 3,191 records
// failed at push. What legitimately stays here is delivery-specific: the PUSH ORDER below
// (FK-safe for the entity SPs — it interleaves packs and is NOT the SQL install order),
// file chunking, and the tree's on-disk layout.
//
// ⚠ `mj sync push` is a FULL RECONCILE per entity scope — it can DELETE rows that exist
//   in the DB but not in these files. Dev databases only; never over real data.

import { readFileSync, writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { renderRecord } from '../engine/seed-render.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const args = Object.fromEntries(process.argv.slice(2).map((a, i, all) => (a.startsWith('--') ? [a.slice(2), all[i + 1]] : null)).filter(Boolean));
const PKG = join(HERE, '..');
const OUT = join(PKG, args.out ?? 'out');
const load = (pack, table) => JSON.parse(readFileSync(join(OUT, 'packs', pack, `${table}.json`), 'utf8'));
const run = JSON.parse(readFileSync(join(OUT, 'run.json'), 'utf8'));
// The MAPPING is the PROJECT's, not the engine's — loaded by name so this command knows no domain.
const { MAPPING } = await import(`../projects/${run.project}/seed-mapping.mjs`);

const CHUNK = 5000; // records per file; big tables split across .part-N.json files

// PUSH ORDER — every parent before its children THROUGH THE ENTITY SPs. This interleaves
// packs (e.g. relationship types push after membership periods) and is deliberately not
// the SQL INSTALL_ORDER. A new domain's dirs must be added here in FK order; the assertion
// below fails the build if a mapped dir is missing or unknown.
const DIRECTORY_ORDER = [
  'organizations', 'organization-profiles', 'people',
  'member-profiles', 'data-quality-labels', 'advocacy-actions',
  'competition-entries', 'certifications', 'member-certifications',
  'membership-periods', 'relationship-types', 'relationships',
  'addresses', 'address-links', 'contact-methods',
  'committee-types', 'committees', 'committee-terms',
  'committee-memberships', 'committee-meetings', 'committee-attendance',
  'committee-agenda-items', 'committee-motions', 'committee-votes',
  'task-types', 'tasks', 'task-assignments',
  'task-links', 'issue-types', 'issues',
  'issue-comments', 'issue-sequences', 'portal-sessions',
  'secure-threads', 'secure-messages', 'forms',
  'form-versions', 'form-pages', 'form-questions',
  'form-question-options', 'form-distributions', 'form-responses',
  'form-answers', 'events', 'event-registrations',
  'courses', 'enrollments', 'products',
  'orders', 'order-lines', 'payments',
  'sonar-score-band-sets', 'sonar-score-bands', 'sonar-time-windows',
  'sonar-score-models', 'sonar-score-model-versions', 'sonar-model-related-entities',
  'sonar-factors', 'sonar-model-factors',];

// resolve the unified entries in push order, loudly
const byDir = new Map(Object.entries(MAPPING).flatMap(([pack, defs]) => defs.filter((e) => e.dir).map((e) => [e.dir, { pack, ...e }])));
const missing = DIRECTORY_ORDER.filter((d) => !byDir.has(d));
const unlisted = [...byDir.keys()].filter((d) => !DIRECTORY_ORDER.includes(d));
if (missing.length || unlisted.length) {
  throw new Error(`push order and mapping disagree — missing from mapping: [${missing}] / mapped but not in DIRECTORY_ORDER: [${unlisted}]`);
}
const ENTRIES = DIRECTORY_ORDER.map((d) => byDir.get(d));

// ---------- emit the tree ----------
// --metadata-out targets any dir (default: disposable out/metadata/). We do NOT wipe the
// whole target — only our own entity folders (below) — so pointing this at a shared
// metadata/ tree can't delete a sibling like schema-info/.
const ROOT = args['metadata-out'] ? resolve(args['metadata-out']) : join(OUT, 'metadata');
mkdirSync(ROOT, { recursive: true });

// The root file is rewritten wholesale, but a shared tree may carry HAND-ADDED entity dirs
// (the Betty ai-vendors/ai-models/ai-model-vendors trio). Dropping them from directoryOrder
// silently removes them from every future push — carry any non-emitter dirs over, in their
// existing order, after ours.
const handAdded = (() => {
  try {
    const prev = JSON.parse(readFileSync(join(ROOT, '.mj-sync.json'), 'utf8'));
    return (prev.directoryOrder ?? []).filter((d) => !DIRECTORY_ORDER.includes(d));
  } catch { return []; }
})();
writeFileSync(join(ROOT, '.mj-sync.json'), JSON.stringify({
  version: '1.0.0',
  push: { autoCreateMissingRecords: true },
  directoryOrder: [...ENTRIES.map((m) => m.dir), ...handAdded], // pack pyramid, then hand-added dirs
}, null, 2));

writeFileSync(join(ROOT, 'README.md'), [
  '# Generated mj-sync metadata (datagen)',
  '',
  `Generated by \`datagen/emit-mjsync.mjs\` · seed ${run.seed} · release ${run.releaseDate} · ruleset v${run.ruleset}.`,
  'Deterministic: same seed + release regenerates this tree byte-identically; primary keys are',
  'pinned (uuidv5 of business keys), so `mj sync push` upserts the same rows every time.',
  '',
  '⚠ Entity names are ASSUMED until the schema reconciliation + CodeGen — verify before pushing.',
  '⚠ `mj sync push` is a full reconcile: it can DELETE rows not present in these files. Dev DBs only.',
].join('\n'));

const summary = [];
for (const m of ENTRIES) {
  const dir = join(ROOT, m.dir);
  rmSync(dir, { recursive: true, force: true }); // clear only OUR entity dir — never siblings
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, '.mj-sync.json'), JSON.stringify({ entity: m.entity, filePattern: '**/.*.json' }, null, 2));
  const rows = load(m.pack, m.json).filter(m.only ?? (() => true)).map((r) => renderRecord(m, r));
  const chunks = [];
  for (let i = 0; i < rows.length; i += CHUNK) chunks.push(rows.slice(i, i + CHUNK));
  chunks.forEach((chunk, i) => {
    const name = chunks.length === 1 ? `.${m.dir}.json` : `.${m.dir}.part-${String(i + 1).padStart(2, '0')}.json`;
    writeFileSync(join(dir, name), JSON.stringify(chunk, null, 2));
  });
  summary.push({ dir: m.dir, entity: m.entity, rows: rows.length, files: chunks.length });
}

for (const s of summary) console.log(`${s.dir.padEnd(22)} → "${s.entity}"  ${String(s.rows).padStart(6)} records in ${s.files} file(s)`);
console.log(`metadata tree → ${ROOT}`);
