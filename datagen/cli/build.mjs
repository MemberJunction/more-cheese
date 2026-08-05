// The release pipeline in miniature: generate → validate → promote ONLY on green.
// Usage: node build.mjs [--project morecheese] [--n 500] [--seed 42] [--release 2026-07-31] [--demo]
//
// Fixes the emit-before-validate gap: generation lands in a STAGING folder, the validator
// runs against staging, and only a fully green run is promoted to out/. A red run leaves
// out/ exactly as it was (the last good build) and parks the failing output in out-failed/
// for debugging. Exit code mirrors the validator: 0 shipped, 1 nothing changed.

import { execFileSync } from 'node:child_process';
import { rmSync, renameSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { argvProject, DEFAULT_PROJECT } from '../engine/config.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const project = argvProject(process.argv);
const ROOT = join(HERE, '..'); // output dirs live at the datagen root, not under cli/
// OUTPUT DIRS ARE PER-PROJECT, and were not. Every project staged into out-staging/ and promoted to
// out/, so building the second project silently REPLACED the first's last good build — the one thing
// this pipeline exists to protect ("a red run leaves out/ exactly as it was"). Found by running the
// documented step 6 for the fixture and watching MoreCheese's promoted output disappear.
//
// The default project keeps the historic paths so every doc, emitter and suite step still works;
// any other project gets its own suffixed set.
const suffix = project === DEFAULT_PROJECT ? '' : `-${project}`;
const STAGING = `out-staging${suffix}`;
const FAILED = `out-failed${suffix}`;
const FINAL = `out${suffix}`;

// forward user args; --out is the pipeline's to control
const fwd = [];
const argv = process.argv.slice(2);
let wantDemo = false;
for (let i = 0; i < argv.length; i++) {
  if (argv[i] === '--demo') { wantDemo = true; continue; }
  if (argv[i] === '--out') { i++; continue; }
  fwd.push(argv[i]);
}

const run = (script, args) => execFileSync(process.execPath, [join(HERE, script), ...args], { encoding: 'utf8' });

// A VALIDATOR MAY BE THE PROJECT'S OWN FILE. This resolved only against cli/ — engine space — which
// is precisely why cli/validate.mjs holds 1,600 lines of MoreCheese: there was nowhere else to put
// it. A project could declare a validator but not own one. Project-local wins, so a new project
// writes projects/<name>/validate.mjs and declares it; naming a cli/ script still works, which is
// how MoreCheese keeps its historic path without a 1,600-line move.
const resolveScript = (name) => {
  const local = join(ROOT, 'projects', project, name);
  return existsSync(local) ? local : join(HERE, name);
};
const runScript = (name, args) => execFileSync(process.execPath, [resolveScript(name), ...args], { encoding: 'utf8' });

// WHICH VALIDATOR? The pipeline (stage → validate → promote) is the engine's; WHAT counts as valid
// is the project's. cli/validate.mjs is 1,600 lines of MoreCheese — it even imports that project's
// seed-mapping.mjs — so running it unconditionally made this command work for exactly one project.
// engine/README.md's own "standing up a new project" step 6 said to run `build.mjs --project <name>`,
// and doing that for the second project died on ERR_MODULE_NOT_FOUND for a seed mapping it has no
// reason to own. A framework's release pipeline cannot be the pipeline of one of its consumers.
//
// So a project DECLARES its validator, and the default is the generic one: check-declared.mjs runs
// every gate that derives from declarations (references, install order, presence floors, target
// bands) and knows no domain. A new project gets real validation on day one without writing any.
const { VALIDATOR } = await import(`../projects/${project}/index.mjs`);
const validator = VALIDATOR ?? 'check-declared.mjs';

console.log('▸ generate → staging');
rmSync(join(ROOT, STAGING), { recursive: true, force: true });
console.log(run('generate.mjs', [...fwd, '--out', STAGING]).trim());

console.log(`▸ validate (staging) — ${validator}`);
let report, green;
try {
  report = runScript(validator, ['--out', STAGING]);
  green = true;
} catch (e) {
  report = e.stdout ?? String(e);
  green = false;
}
console.log(report.trim());

if (!green) {
  rmSync(join(ROOT, FAILED), { recursive: true, force: true });
  renameSync(join(ROOT, STAGING), join(ROOT, FAILED));
  writeFileSync(join(ROOT, FAILED, 'validation-report.txt'), report);
  console.error(`\n✋ RED — nothing promoted. Last good build untouched in ${FINAL}/; failing output parked in ${FAILED}/ (report inside).`);
  process.exit(1);
}

writeFileSync(join(ROOT, STAGING, 'validation-report.txt'), report);
rmSync(join(ROOT, FINAL), { recursive: true, force: true });
renameSync(join(ROOT, STAGING), join(ROOT, FINAL));
if (existsSync(join(ROOT, FAILED))) rmSync(join(ROOT, FAILED), { recursive: true, force: true });
console.log(`\n✔ GREEN — promoted to ${FINAL}/ (validation report included).`);

if (wantDemo) {
  console.log('▸ inspector');
  console.log(run('demo.mjs', ['--out', FINAL]).trim());
}
