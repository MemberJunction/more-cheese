// Spec §8: pack emission — cook once, portion at the end (D9).
//
// The world was generated as one batch (that's what keeps one person consistent across
// systems); this last step deals the finished rows into one folder per composed app, each
// with a manifest declaring what it depends on. Installers load bottom-up: common first,
// always. Latent dials (_theta/_phi) are stripped here — they exist only inside the kitchen;
// the validator gets its own private file (validation-events.json) that is never installed.

import { writeFileSync, mkdirSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { iso } from './dates.mjs';

// ─────────────────────────────────────────────────────────────────────────────────────────────
// THE PACK CONTRACT
//
// A pack declares three things, and each is a claim somebody can be wrong about:
//
//   dependsOn   which packs must be installed first     — checked against the reference graph
//   tables      table name → the rows that ship         — every world table must appear in one
//   notShipped  what deliberately ships nowhere         — with a reason, per entry
//
// The middle claim is the expensive one. A domain can generate rows and be left out of the pack
// map entirely, and then it ships NOTHING — with a green build. Measured, not supposed: a
// scaffolded domain wired into buildWorld but not into the pack map passed 257 of 257 gates and
// wrote zero rows. The pack entry is the last of three wiring steps and it was the only one
// nothing chased you about.
//
// So `notShipped` exists. Not shipping a table is legitimate — validator-private ground truth,
// harness registries, rows folded into another pack's table — but it is a DECISION, and this
// makes you write it down with a reason instead of it being indistinguishable from forgetting.
// ─────────────────────────────────────────────────────────────────────────────────────────────

/** Every array in the world that no pack ships. Read statically from the project's buildPacks,
 * because rows are re-derived on the way out (stripped, concatenated) and identity is lost. */
export function unshippedTables(world, project, notShipped = {}) {
  const src = readFileSync(join(dirname(fileURLToPath(import.meta.url)), '..', 'projects', project, 'index.mjs'), 'utf8');
  // from the `return {` only: buildPacks destructures every world key on one line, so scanning
  // the whole function would match names it never actually ships.
  const fn = src.slice(src.indexOf('export function buildPacks'));
  // `...` first: a spread puts a dot immediately before the name, which would otherwise look
  // like a property access to the lookbehind and hide every table that ships via concatenation.
  const body = fn.slice(fn.indexOf('return {')).replace(/\.\.\./g, ' ');
  const mentions = (path) => new RegExp(`(?<![\\w.])${path.replace('.', '\\.')}\\b`).test(body);
  const missing = [];
  for (const [key, val] of Object.entries(world)) {
    if (notShipped[key]) continue;
    if (Array.isArray(val)) {
      if (!mentions(key)) missing.push(key);
    } else if (val && typeof val === 'object') {
      for (const [sub, rows] of Object.entries(val)) {
        if (!Array.isArray(rows) || !rows.length) continue;
        if (notShipped[`${key}.${sub}`]) continue;
        if (!mentions(`${key}.${sub}`)) missing.push(`${key}.${sub}`);
      }
    }
  }
  return missing;
}

/** Emit the project's packs. The PACK MAP comes from the project (its buildPacks(world)) —
 * the engine only deals rows into folders and writes the harness-private files. */
export function emitPacks(cfg, { packs, world, people, renewalEvents, registries, notShipped }) {
  if (world) {
    const missing = unshippedTables(world, cfg.project, notShipped);
    if (missing.length) {
      throw new Error(
        `${missing.length} table(s) are generated and ship NOWHERE:\n`
        + missing.map((m) => `  ${m}`).join('\n')
        + `\n\nAdd each to a pack's tables in projects/${cfg.project}/index.mjs, or — if it truly`
        + ` should not ship — to NOT_SHIPPED there WITH A REASON.\nRows that ship nowhere are`
        + ` invisible: the build passes, every gate passes, and the data is simply absent.`,
      );
    }
  }
  mkdirSync(join(cfg.outDir, 'packs'), { recursive: true });
  for (const [name, pack] of Object.entries(packs)) {
    const dir = join(cfg.outDir, 'packs', name);
    mkdirSync(dir, { recursive: true });
    const rowCounts = {};
    for (const [table, rows] of Object.entries(pack.tables)) {
      // INTERNALS MUST NOT SHIP. A generator carries `_`-prefixed fields alongside a row while it
      // works — the latent dials, the person a row belongs to — and one leaking through is a row
      // that fails to load, at install, with a message about an unknown column.
      //
      // Nothing checked this. It was held by three hand-maintained field lists in the pack map plus
      // a `delete` per field in two generators: add a fourth internal to a row and you must
      // remember all of it, or it ships. Now the emitter remembers instead of you.
      const leaked = [...new Set(rows.flatMap((r) => (r && typeof r === 'object' ? Object.keys(r).filter((k) => k.startsWith('_')) : [])))];
      if (leaked.length) {
        throw new Error(
          `${name}/${table} would ship generator-internal field(s): ${leaked.join(', ')}\n`
          + 'Strip them before returning — stripInternals(rows) from engine/authoring.mjs drops every\n'
          + '`_`-prefixed field at once, which is safer than a delete per field.',
        );
      }
      writeFileSync(join(dir, `${table}.json`), JSON.stringify(rows, null, 1));
      rowCounts[table] = rows.length;
    }
    writeFileSync(join(dir, 'manifest.json'), JSON.stringify({ name, version: cfg.R.version, seed: cfg.seed, releaseDate: iso(cfg.release), dependsOn: pack.dependsOn, rowCounts }, null, 2));
  }
  writeFileSync(join(cfg.outDir, 'validation-events.json'), JSON.stringify(renewalEvents));
  // harness-private registries (e.g. the motif registry) — ground truth the project wants
  // written next to the packs but never installed
  for (const [name, value] of Object.entries(registries ?? {})) {
    writeFileSync(join(cfg.outDir, `${name}.json`), JSON.stringify(value, null, 1));
  }
  // per-member latents — validator/inspector-private, NEVER installed: lets an engineer
  // verify the hidden dials actually expressed through behavior
  writeFileSync(join(cfg.outDir, 'validation-latents.json'), JSON.stringify(people.map((p) => ({ m: p.MemberNumber, theta: +p._theta.toFixed(4), phi: +p._phi.toFixed(4), tier: p.MembershipTier, hero: !!p._hero }))));
  writeFileSync(join(cfg.outDir, 'run.json'), JSON.stringify({ project: cfg.project, seed: cfg.seed, n: cfg.n, releaseDate: iso(cfg.release), ruleset: cfg.R.version, scenario: cfg.scenario ?? null, covidYears: cfg.R.regimes.covid.years }, null, 2));
}
