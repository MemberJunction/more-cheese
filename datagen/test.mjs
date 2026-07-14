// The regression suite, as one command: node test.mjs [--quick]
//
// Runs everything we've been doing by hand: a multi-seed validation sweep at pilot scale,
// the byte-identical determinism check, one default-scale (2,500) build through the full
// staging pipeline, and a scenario build if scenarios exist. Exit 0 = everything green.
// This is what CI runs when datagen graduates to a package.

import { execFileSync } from 'node:child_process';
import { rmSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const QUICK = process.argv.includes('--quick');
const SEEDS = QUICK ? ['42', '7'] : ['7', '42', '99', '2026', '555', '13', '88'];
const RELEASE = '2026-07-31';

let failures = 0;
const CLI = join(HERE, 'cli');
const run = (script, args) => execFileSync(process.execPath, [join(CLI, script), ...args], { encoding: 'utf8' });
const step = (name, fn) => {
  try { fn(); console.log(`✅ ${name}`); }
  catch (e) { failures++; console.log(`❌ ${name}`); console.log((e.stdout ?? String(e)).split('\n').filter((l) => l.startsWith('❌')).join('\n')); }
};

console.log(`datagen regression suite ${QUICK ? '(quick)' : ''}\n`);

// 1. multi-seed validation sweep at pilot scale
for (const s of SEEDS) {
  step(`seed ${s} @ N=500: generate + validate`, () => {
    run('generate.mjs', ['--n', '500', '--seed', s, '--release', RELEASE, '--out', 'out-test']);
    run('validate.mjs', ['--out', 'out-test']);
  });
}

// 2. determinism: same inputs → byte-identical packs
step('determinism: byte-identical regeneration', () => {
  run('generate.mjs', ['--n', '500', '--seed', '42', '--release', RELEASE, '--out', 'out-test']);
  run('generate.mjs', ['--n', '500', '--seed', '42', '--release', RELEASE, '--out', 'out-test2']);
  execFileSync('diff', ['-r', join(HERE, 'out-test'), join(HERE, 'out-test2')]);
});

// 3. windowing: an October re-bake keeps Marcus pending
step('windowing: Marcus still PendingRenewal at an October release', () => {
  run('generate.mjs', ['--n', '500', '--seed', '42', '--release', '2026-10-31', '--out', 'out-test']);
  const out = run('validate.mjs', ['--out', 'out-test']);
  if (!/hero Marcus: PendingRenewal/.test(out) || !out.includes('✅ hero Marcus')) throw new Error(out);
});

// 4. default scale through the full staging pipeline
if (!QUICK) {
  step('N=2500 through build.mjs (stage → validate → promote)', () => {
    run('build.mjs', ['--n', '2500', '--seed', '42', '--release', RELEASE]);
  });
}

// 5. scenario overlay: same causal model, different world, its own gates
step('scenario: decliningOrg builds and validates against its own targets', () => {
  run('generate.mjs', ['--n', '500', '--seed', '42', '--release', RELEASE, '--scenario', 'decliningOrg', '--out', 'out-test']);
  run('validate.mjs', ['--out', 'out-test']);
});

// 6. emitters run and agree
step('emitters: sql + schema + mjsync + explain', () => {
  if (QUICK) run('build.mjs', ['--n', '500', '--seed', '42', '--release', RELEASE]);
  run('emit-sql.mjs', []);
  run('emit-schema.mjs', []);
  run('emit-mjsync.mjs', []);
  run('explain.mjs', []);
});

// 6b. schema/insert drift guard: every column an INSERT writes must exist in the CREATE TABLE
// (the provisional DDL and the seed INSERTs share assumed shapes — they must never disagree)
step('schema DDL covers every INSERT column', () => {
  const sqlDir = join(HERE, 'out', 'sql');
  const ddl = readFileSync(join(sqlDir, '00_schema.sql'), 'utf8');
  // CREATE TABLE [schema].[Table] ( ... ) → map "schema.Table" → Set(columns)
  const created = {};
  for (const m of ddl.matchAll(/CREATE TABLE \[(\w+)\]\.\[(\w+)\] \(([\s\S]*?)\n\);/g)) {
    const cols = [...m[3].matchAll(/^\s{2}\[(\w+)\]/gm)].map((x) => x[1]); // leading "  [Col]" defs (not FK/PK lines)
    created[`${m[1]}.${m[2]}`] = new Set(cols);
  }
  const missing = [];
  for (const f of ['01_common', '02_membership', '03_events', '04_learning', '05_orders', '06_committees', '07_forms']) {
    let sql; try { sql = readFileSync(join(sqlDir, `${f}.sql`), 'utf8'); } catch { continue; }
    for (const m of sql.matchAll(/INSERT INTO \[(\w+)\]\.\[(\w+)\] \(([^)]*)\)/g)) {
      const key = `${m[1]}.${m[2]}`;
      const cols = m[3].match(/\[(\w+)\]/g).map((x) => x.slice(1, -1));
      if (!created[key]) { missing.push(`no CREATE TABLE for ${key}`); continue; }
      for (const col of cols) if (!created[key].has(col)) missing.push(`${key}.${col} inserted but not in DDL`);
    }
  }
  if (missing.length) throw new Error('❌ schema/insert drift:\n' + missing.map((x) => '  ' + x).join('\n'));
});

for (const d of ['out-test', 'out-test2']) rmSync(join(HERE, d), { recursive: true, force: true });
console.log(`\n${failures === 0 ? '✔ ALL GREEN' : `✋ ${failures} step(s) failed`}`);
process.exit(failures ? 1 : 0);
