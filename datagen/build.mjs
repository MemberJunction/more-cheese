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

const HERE = dirname(fileURLToPath(import.meta.url));
const STAGING = 'out-staging';
const FAILED = 'out-failed';
const FINAL = 'out';

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

console.log('▸ generate → staging');
rmSync(join(HERE, STAGING), { recursive: true, force: true });
console.log(run('generate.mjs', [...fwd, '--out', STAGING]).trim());

console.log('▸ validate (staging)');
let report, green;
try {
  report = run('validate.mjs', ['--out', STAGING]);
  green = true;
} catch (e) {
  report = e.stdout ?? String(e);
  green = false;
}
console.log(report.trim());

if (!green) {
  rmSync(join(HERE, FAILED), { recursive: true, force: true });
  renameSync(join(HERE, STAGING), join(HERE, FAILED));
  writeFileSync(join(HERE, FAILED, 'validation-report.txt'), report);
  console.error(`\n✋ RED — nothing promoted. Last good build untouched in ${FINAL}/; failing output parked in ${FAILED}/ (report inside).`);
  process.exit(1);
}

writeFileSync(join(HERE, STAGING, 'validation-report.txt'), report);
rmSync(join(HERE, FINAL), { recursive: true, force: true });
renameSync(join(HERE, STAGING), join(HERE, FINAL));
if (existsSync(join(HERE, FAILED))) rmSync(join(HERE, FAILED), { recursive: true, force: true });
console.log(`\n✔ GREEN — promoted to ${FINAL}/ (validation report included).`);

if (wantDemo) {
  console.log('▸ inspector');
  console.log(run('demo.mjs', ['--out', FINAL]).trim());
}
