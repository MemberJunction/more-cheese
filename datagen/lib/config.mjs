// Shared plumbing: CLI args, the ruleset, and date arithmetic.
// Everything downstream receives one `cfg` object — no globals, no wall clock.

import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { compileRuleset } from './compile.mjs';

export const DATAGEN_DIR = dirname(dirname(fileURLToPath(import.meta.url)));
export { DAY, iso, addDays, addYears, endOfYear, parseDate } from './dates.mjs';
import { parseDate } from './dates.mjs';

/**
 * Compose the ruleset from its modules (ruleset/modules/index.json declares the order).
 * One module per app domain, mirroring the D9 pack pyramid: core (shared substrate) →
 * world → membership → events → heroes. Adding a new app = adding one module to the index.
 */
export function loadRuleset() {
  const dir = join(DATAGEN_DIR, 'ruleset/modules');
  const index = JSON.parse(readFileSync(join(dir, 'index.json'), 'utf8'));
  const ruleset = {};
  for (const name of index.modules) {
    const mod = JSON.parse(readFileSync(join(dir, `${name}.json`), 'utf8'));
    delete mod.$comment; // module-level commentary isn't part of the composed recipe
    Object.assign(ruleset, mod);
  }
  // compile: human-authored effect forms (liftPts / groupTarget / strength) → solved βs
  return compileRuleset(ruleset);
}

/** Parse `--flag value` pairs; returns the run configuration + the composed ruleset. */
export function loadConfig(argv) {
  const args = Object.fromEntries(
    argv.map((a, i, all) => (a.startsWith('--') ? [a.slice(2), all[i + 1]] : null)).filter(Boolean)
  );
  const ruleset = loadRuleset();
  const release = parseDate(args.release ?? '2026-07-31');
  return {
    seed: args.seed ?? '42',
    n: Number(args.n ?? ruleset.scale.members),
    release,
    releaseYear: release.getUTCFullYear(),
    outDir: join(DATAGEN_DIR, args.out ?? 'out'),
    R: ruleset,
  };
}
