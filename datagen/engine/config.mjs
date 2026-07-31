// Shared plumbing: CLI args, the ruleset, and date arithmetic.
// Everything downstream receives one `cfg` object — no globals, no wall clock.

import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { compileRuleset } from './compile.mjs';
import { lintRuleset, findUnknownOverlayKeys, stripHoldouts } from './lint.mjs';

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
const DEFAULT_PROJECT = 'morecheese';

/** A PROJECT is one generated universe: `projects/<name>/` holds its domain modules,
 * hooks, name banks, and ruleset. The engine (`core/`, entrypoints) is shared; everything
 * project-specific loads dynamically from the project directory. */
export function projectDir(project = DEFAULT_PROJECT) {
  return join(DATAGEN_DIR, 'projects', project);
}

/** The project's hooks + pipeline, from its index.mjs (dynamic: no engine file names a project). */
export async function loadProject(project = DEFAULT_PROJECT) {
  return await import(`../projects/${project}/index.mjs`);
}

export async function loadRuleset(scenario, project = DEFAULT_PROJECT) {
  const { hooks } = await loadProject(project);
  const dir = join(projectDir(project), 'ruleset/modules');
  const index = JSON.parse(readFileSync(join(dir, 'index.json'), 'utf8'));
  const ruleset = {};
  for (const name of index.modules) {
    let mod;
    try {
      mod = JSON.parse(readFileSync(join(dir, `${name}.json`), 'utf8'));
    } catch (e) {
      throw new Error(`ruleset module '${name}.json' is not valid JSON: ${e.message}`);
    }
    delete mod.$comment; // module-level commentary isn't part of the composed recipe
    Object.assign(ruleset, mod);
  }
  if (scenario) {
    let overlay;
    try {
      overlay = JSON.parse(readFileSync(join(projectDir(project), `ruleset/scenarios/${scenario}.json`), 'utf8'));
    } catch (e) {
      throw new Error(`scenario '${scenario}.json' is not valid JSON: ${e.message}`);
    }
    delete overlay.$comment;
    // overlays may only override, never invent — a typo'd key would merge silently otherwise
    const unknown = findUnknownOverlayKeys(ruleset, overlay);
    if (unknown.length) throw new Error(`scenario '${scenario}' has keys the base ruleset doesn't: ${unknown.join(', ')}`);
    deepMerge(ruleset, overlay);
  }
  lintRuleset(ruleset, hooks.domainLint); // a malformed recipe never reaches the kitchen
  // compile: human-authored effect forms (liftPts / groupTarget / strength) → solved βs
  return compileRuleset(ruleset, hooks);
}

/** The AUTHORING view: the composed (pre-compile) ruleset with holdout-flagged targets
 * stripped — this is what any AI authoring step is allowed to read (spec §7 blindness). */
export async function loadAuthoringView(scenario, project = DEFAULT_PROJECT) {
  const full = await loadRuleset(scenario, project);
  return stripHoldouts(full);
}

/** Parse `--flag value` pairs; returns the run configuration + the composed ruleset. */
export async function loadConfig(argv) {
  const args = Object.fromEntries(
    argv.map((a, i, all) => (a.startsWith('--') ? [a.slice(2), all[i + 1]] : null)).filter(Boolean)
  );
  const project = args.project ?? DEFAULT_PROJECT;
  const ruleset = await loadRuleset(args.scenario, project);
  const release = parseDate(args.release ?? '2026-07-31');
  return {
    seed: args.seed ?? '42',
    n: Number(args.n ?? ruleset.scale.members),
    release,
    releaseYear: release.getUTCFullYear(),
    outDir: join(DATAGEN_DIR, args.out ?? 'out'),
    scenario: args.scenario ?? null,
    project,
    R: ruleset,
  };
}
