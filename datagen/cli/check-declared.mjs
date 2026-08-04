#!/usr/bin/env node
// EVERY DECLARATION-DERIVED CHECK, FOR ANY PROJECT.
//
// This is what a new project gets on day one. cli/validate.mjs is 1,600 lines of MoreCheese and will
// not run anywhere else; this command knows no domain. It reads a build's packs, loads whatever
// declarations the project has, and runs the checks that follow from them:
//
//   refs.mjs          → a dangling-reference gate per edge
//   presence.mjs      → every option of every mix must actually appear
//   measurements.mjs  → every { target, tolerance } pair, banded and cushioned
//
// All three are optional. Declare nothing and you get told what you are missing — which is the right
// first message for a project on day one, and considerably better than the nothing it got before.
//
//   node cli/check-declared.mjs --out out [--project morecheese]
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadRuleset } from '../engine/config.mjs';
import { runDerivedChecks } from '../engine/derived-checks.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const argv = process.argv;
const arg = (flag, dflt) => (argv.includes(flag) ? argv[argv.indexOf(flag) + 1] : dflt);
const OUT = join(ROOT, arg('--out', 'out'));

const run = JSON.parse(readFileSync(join(OUT, 'run.json'), 'utf8'));
const project = arg('--project', run.project);
const R = await loadRuleset(run.scenario, project);
const load = (pack, table) => JSON.parse(readFileSync(join(OUT, 'packs', pack, `${table}.json`), 'utf8'));

const results = [];
const check = (name, ok, detail) => results.push({ name, ok, detail });

// Referential first, and stop if it fails: a broken reference graph makes every measurement below
// meaningless, and reporting fifty red gates when the real problem is one missing key wastes the
// reader's time.
const ref = await runDerivedChecks({ project, R, load, check }, 'referential');
const refBroken = results.some((r) => !r.ok);
const fin = refBroken ? { kinds: [], counts: {} } : await runDerivedChecks({ project, R, load, check }, 'final');

let failed = 0;
for (const r of results) {
  console.log(`${r.ok ? '✅' : '❌'} ${r.name}${r.detail ? `  — ${r.detail}` : ''}`);
  if (!r.ok) failed++;
}

const kinds = [...ref.kinds, ...fin.kinds];
console.log();
if (!kinds.length) {
  console.log(`project '${project}' declares nothing yet, so there is nothing to derive.`);
  console.log('Add any of: refs.mjs (reference graph), presence.mjs (where mixes land),');
  console.log('measurements.mjs (how to measure a target). Each one earns you gates for free.');
} else {
  if (refBroken) console.log('✋ referential gates failed — target gates not run (they would measure a broken world)');
  console.log(`${results.length - failed}/${results.length} derived gates pass  [${kinds.join(', ')}]`);
}

// The exit code reflects FAILURES, always — including in the nothing-declared case above, where a
// build with unmeasured targets is exactly the thing a newcomer needs to fail on. The first version
// of this file printed that guidance and then exited 0, which would have told a project with
// seventeen unchecked targets that it had passed. That is the fourth "green while broken" found
// today; this one was self-inflicted, and found only by checking the exit code rather than the
// output.
process.exit(failed ? 1 : 0);
