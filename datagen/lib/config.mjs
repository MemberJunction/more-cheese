// Shared plumbing: CLI args, the ruleset, and date arithmetic.
// Everything downstream receives one `cfg` object — no globals, no wall clock.

import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { compileRuleset } from './compile.mjs';

export const DATAGEN_DIR = dirname(dirname(fileURLToPath(import.meta.url)));
export { DAY, iso, addDays, addYears, endOfYear, parseDate } from './dates.mjs';
import { parseDate } from './dates.mjs';

/** Deep-merge: objects merge recursively; arrays and scalars replace. */
function deepMerge(base, overlay) {
  for (const [k, v] of Object.entries(overlay)) {
    if (v && typeof v === 'object' && !Array.isArray(v) && base[k] && typeof base[k] === 'object' && !Array.isArray(base[k])) deepMerge(base[k], v);
    else base[k] = v;
  }
  return base;
}

/**
 * Compose the ruleset from its modules (ruleset/modules/index.json declares the order).
 * One module per app domain, mirroring the D9 pack pyramid: core (shared substrate) →
 * world → membership → events → orders → heroes. Adding a new app = one module in the index.
 *
 * A SCENARIO is a parameter overlay on the same causal model (ruleset/scenarios/<name>.json)
 * — deep-merged after composition, before compilation, so the compiler re-solves every
 * human-authored effect against the scenario's targets. Same machinery, different world;
 * each scenario build is its own deterministic universe.
 */
export function loadRuleset(scenario) {
  const dir = join(DATAGEN_DIR, 'ruleset/modules');
  const index = JSON.parse(readFileSync(join(dir, 'index.json'), 'utf8'));
  const ruleset = {};
  for (const name of index.modules) {
    const mod = JSON.parse(readFileSync(join(dir, `${name}.json`), 'utf8'));
    delete mod.$comment; // module-level commentary isn't part of the composed recipe
    Object.assign(ruleset, mod);
  }
  if (scenario) {
    const overlay = JSON.parse(readFileSync(join(DATAGEN_DIR, `ruleset/scenarios/${scenario}.json`), 'utf8'));
    delete overlay.$comment;
    deepMerge(ruleset, overlay);
  }
  // compile: human-authored effect forms (liftPts / groupTarget / strength) → solved βs
  return compileRuleset(ruleset);
}

/** Parse `--flag value` pairs; returns the run configuration + the composed ruleset. */
export function loadConfig(argv) {
  const args = Object.fromEntries(
    argv.map((a, i, all) => (a.startsWith('--') ? [a.slice(2), all[i + 1]] : null)).filter(Boolean)
  );
  const ruleset = loadRuleset(args.scenario);
  const release = parseDate(args.release ?? '2026-07-31');
  return {
    seed: args.seed ?? '42',
    n: Number(args.n ?? ruleset.scale.members),
    release,
    releaseYear: release.getUTCFullYear(),
    outDir: join(DATAGEN_DIR, args.out ?? 'out'),
    scenario: args.scenario ?? null,
    R: ruleset,
  };
}
