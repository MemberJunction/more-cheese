// The regression suite, as one command: node test.mjs [--quick]
//
// Runs everything we've been doing by hand: a multi-seed validation sweep at pilot scale,
// the byte-identical determinism check, one default-scale (2,500) build through the full
// staging pipeline, and a scenario build if scenarios exist. Exit 0 = everything green.
// This is what CI runs when datagen graduates to a package.

import { execFileSync } from 'node:child_process';
import { rmSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { extractClaims, checkClaims } from './engine/contract.mjs';


const HERE = dirname(fileURLToPath(import.meta.url));
const QUICK = process.argv.includes('--quick');
const SEEDS = QUICK ? ['42', '7'] : ['7', '42', '99', '2026', '555', '13', '88'];
const RELEASE = '2026-07-31';

let failures = 0;
const pending = [];
const CLI = join(HERE, 'cli');
const run = (script, args) => execFileSync(process.execPath, [join(CLI, script), ...args], { encoding: 'utf8' });
/** Any error shape → printable lines. A Buffer stdout used to make the reporter itself throw,
 *  which killed the run instead of reporting the failure it was handed. */
const detail = (e) => {
  const raw = e?.stdout != null ? String(e.stdout) : String(e?.message ?? e);
  const flagged = raw.split('\n').filter((l) => l.startsWith('❌'));
  return (flagged.length ? flagged : raw.split('\n').slice(0, 4)).join('\n');
};

const step = (name, fn) => {
  try { const r = fn(); if (r?.then) { pending.push(r.then(() => console.log(`✅ ${name}`)).catch((e) => { failures++; console.log(`❌ ${name}`); console.log(String(e.message ?? e).split('\n').slice(0, 4).join('\n')); })); return; } console.log(`✅ ${name}`); }
  catch (e) { failures++; console.log(`❌ ${name}`); console.log(detail(e)); }
};

console.log(`datagen regression suite ${QUICK ? '(quick)' : ''}\n`);

// 0. the ruleset lint catches what a human editing JSON actually breaks — negative-tested
// (a lint that only ever passes is decoration). Synthetic rulesets, no generation needed.
step('ruleset lint catches planted typos (share, weight, cross-refs) and stays quiet on clean input', async () => {
  const { lintRuleset } = await import('./engine/lint.mjs');
  const { morecheeseHooks } = await import('./projects/morecheese/hooks.mjs');
  const expectCatch = (R, mustMention) => {
    try { lintRuleset(R, morecheeseHooks.domainLint); }
    catch (e) {
      if (!String(e.message).includes(mustMention)) throw new Error(`lint fired but without "${mustMention}": ${e.message.split('\n')[1] ?? e.message}`);
      return;
    }
    throw new Error(`lint MISSED a planted defect (expected mention of "${mustMention}")`);
  };
  const tol = { membership: { renewalTolerance: 0.02 }, learning: { participation: { tolerance: 0.05 }, completion: { tolerance: 0.05 } } };
  expectCatch({ ...tol, world: { attendShare: 1.4 } }, 'attendShare');                                      // a share of 140%
  expectCatch({ ...tol, events: { mix: [['Conference', 0.5], ['Webinar', -0.2]] } }, 'weight -0.2');        // a negative weight
  expectCatch({ ...tol, funnel: { tolerance: 0 } }, 'tolerance');                                           // a tolerance of zero
  // four-part shape: catalogs live under `catalog`, so the cross-reference checks look there
  expectCatch({ ...tol, committees: { catalog: { committees: [{ name: 'Standards Committee' }] } },
    heroes: [{ memberNumber: 'ICF-000101', committees: [{ committee: 'Standrads Committee', terms: [] }] }] }, 'Standrads');  // the classic transposition
  expectCatch({ ...tol, programs: { catalog: { certifications: [{ key: 'ccp', prerequisite: 'ccp-basic' }] } } }, 'prerequisite');
  // a target with no tolerance, caught by SHAPE at any depth — no path list to maintain
  expectCatch({ ...tol, anyNewDomain: { params: { whatever: { target: 0.7 } } } }, 'target but no tolerance');
  lintRuleset({ ...tol, world: { attendShare: 0.6, mix: [['a', 1]] } }, morecheeseHooks.domainLint);        // and clean input passes
});


// 0b. gate helpers: each must catch its planted defect and stay quiet on clean input
step('gate helpers catch planted defects (fk, share, presence, distinct) and pass clean input', async () => {
  const { makeGateHelpers } = await import('./engine/gates.mjs');
  const results = [];
  const h = makeGateHelpers((name, ok, detail) => results.push({ name, ok, detail }));
  const failed = () => results.splice(0).filter((r) => !r.ok);

  if (h.dangling([{ k: 'A' }, { k: 'MISSING' }], (r) => r.k, new Set(['A'])) !== 1) throw new Error('dangling missed a broken ref');
  if (h.dangling([{ k: 'A' }, { k: null }], (r) => r.k, new Set(['A'])) !== 0) throw new Error('dangling must allow null keys (optional FKs)');

  h.shareBand('share', 0.50, { target: 0.10, tolerance: 0.05 });
  if (failed().length !== 1) throw new Error('shareBand missed a wildly off share');
  h.shareBand('share', 0.12, { target: 0.10, tolerance: 0.05 });
  if (failed().length !== 0) throw new Error('shareBand false-positived inside tolerance');

  h.presenceFloor('floor', { Critical: 0, High: 17 });
  if (failed().length !== 1) throw new Error('presenceFloor missed an empty bucket');
  h.presenceFloor('floor', { Critical: 2, High: 17 });
  if (failed().length !== 0) throw new Error('presenceFloor false-positived');

  h.distinctAtLeast('distinct', ['a', 'a', 'a'], 3);
  if (failed().length !== 1) throw new Error('distinctAtLeast missed visible repetition');
  h.distinctAtLeast('distinct', ['a', 'b', 'c'], 3);
  if (failed().length !== 0) throw new Error('distinctAtLeast false-positived');
});

// 0c. the ruleset schema — the one the editor shows authors — must agree with every real
// module AND catch planted mistakes. A schema nobody executes drifts from reality, and then
// the editor promises one thing while the build enforces another.
step('ruleset schema matches every JSON module', () => run('check-ruleset-schema.mjs', []));

// 0c-ii. .mjs ruleset modules buy comments and references — and the ability to misbehave.
// They must stay DATA: no wall clock, no unseeded randomness, no I/O, no functions.
step('.mjs ruleset modules are pure data (no clock, randomness, I/O or behaviour)', () => {
  run('check-ruleset.mjs', []);
  const probe = join(HERE, 'projects/morecheese/ruleset/modules/zz-probe.mjs');
  const hazards = [
    ['new Date()', 'export default { zz: { numbers: { y: new Date().getFullYear() } } };'],
    ['Math.random', 'export default { zz: { numbers: { y: Math.random() } } };'],
    ['I/O', "import { readFileSync } from 'node:fs';\nexport default { zz: { catalog: readFileSync('a') } };"],
    ['process.env', 'export default { zz: { numbers: { y: process.env.N } } };'],
    ['a function', 'export function build() { return 1; }\nexport default { zz: {} };'],
    ['a code import', "import { rng } from '../../../../engine/rng.mjs';\nexport default { zz: {} };"],
  ];
  try {
    for (const [what, src] of hazards) {
      writeFileSync(probe, src);
      let caught = false;
      try { run('check-ruleset.mjs', []); } catch { caught = true; }
      if (!caught) throw new Error(`the data-only guard MISSED ${what} in a ruleset module`);
    }
  } finally { rmSync(probe, { force: true }); }
});

step('ruleset schema catches planted mistakes (share, unit, arrow form, mix, hero key)', async () => {
  const { validate } = await import('./engine/schema-check.mjs');
  const schema = JSON.parse(readFileSync(join(HERE, 'engine/ruleset.schema.json'), 'utf8'));
  const expectCatch = (doc, mustMention) => {
    const errs = validate(doc, schema);
    if (!errs.length) throw new Error(`schema MISSED a planted defect (expected mention of "${mustMention}")`);
    if (!errs.join('\n').includes(mustMention)) throw new Error(`schema fired but without "${mustMention}": ${errs[0]}`);
  };
  expectCatch({ events: { attendShare: 45 } }, 'attendShare');                             // a percentage where a share belongs
  expectCatch({ membership: { renewalTolerance: 0 } }, 'renewalTolerance');                // a tolerance of zero
  expectCatch({ events: { noticeDays: 'two weeks' } }, 'noticeDays');                      // prose where a number belongs
  expectCatch({ programs: { medalWeights: { Gold: -0.2 } } }, 'medalWeights');             // a negative weight
  expectCatch({ membership: { arrows: { a: { note: 'x' } } } }, 'exactly one of');         // an arrow with no effect declared
  expectCatch({ membership: { arrows: { a: { beta: 0.5, liftPts: 4, note: 'x' } } } }, 'mutually exclusive');
  expectCatch({ membership: { arrows: { a: { beta: 0.5 } } } }, 'note');                   // an arrow with no evidence
  expectCatch({ heroes: [{ first: 'A', last: 'B' }] }, 'memberNumber');                    // a hero with no identity
  expectCatch({ heroes: [{ memberNumber: 'ICF-1', first: 'A', last: 'B', cycleType: 'monthly' }] }, 'cycleType');
  expectCatch({ 'scale ': { members: 10 } }, 'legal property name');                       // a trailing space in a key

  // and clean input stays quiet
  const clean = {
    scale: { members: 2500 },
    history: { startYear: 2013, conferenceMonth: 6, conferenceDay: 12 },
    statusMix: { target: [0.78, 0.15], tolerance: 0.08 },
    events: { attendShare: 0.45, noticeDays: [7, 45], mix: [['Conference', 0.5]] },
    programs: { medalWeights: { Gold: 0.05, $note: 'rare on purpose' } },
    membership: { arrows: { a: { liftPts: 4, share: 0.2, evidence: 'ESTIMATE' } } },
    heroes: [{ memberNumber: 'ICF-000101', first: 'A', last: 'B', title: null, cycleType: 'calendar' }],
    $comment: 'commentary is always allowed',
  };
  const errs = validate(clean, schema);
  if (errs.length) throw new Error(`schema false-positived on clean input: ${errs.join('; ')}`);
});

// 0d. the type declarations must describe the ENGINE THAT EXISTS, and must actually reach a
// call site (a .d.ts that lies is worse than none). Needs a TypeScript compiler, which
// datagen does not depend on — skipped, loudly, when there isn't one.
step('engine/types.d.ts matches the engine and surfaces at call sites (needs tsc)', () => {
  const tsc = (args) => {
    try { return { out: execFileSync('npx', ['--no-install', 'tsc', ...args], { cwd: HERE, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }), code: 0 }; }
    catch (e) { if (e.code === 'ENOENT' || /not found|could not determine/i.test(String(e.stderr ?? ''))) return null; return { out: String(e.stdout ?? '') + String(e.stderr ?? ''), code: 1 }; }
  };
  if (tsc(['--version']) === null) { console.log('   ⚠️  no tsc available — type declarations NOT verified this run'); return; }

  // (a) the declarations are self-consistent and agree with the engine they annotate
  const decl = tsc(['-p', 'jsconfig.json', '--noEmit']);
  if (decl.code !== 0) throw new Error(`types.d.ts does not typecheck:\n${decl.out.split('\n').slice(0, 6).join('\n')}`);

  // (b) a probe of DELIBERATE misuse — each line must be rejected, or the types aren't reaching
  // authors' editors at all. Written and removed here so the repo holds no broken-on-purpose file.
  const probe = join(HERE, '.types-probe.mjs');
  writeFileSync(probe, [
    '// @ts-check',
    "import { childOutcome } from './engine/patterns.mjs';",
    "import { rng } from './engine/rng.mjs';",
    "import { loadConfig } from './engine/config.mjs';",
    "const r = rng('42', 'probe');",
    "r.pickWeighted([['Gold', 0.05]]);",         // legal — must NOT error
    'r.weighted({ Gold: 0.05 });',                // no such method
    'r.int(1);',                                  // needs two args
    "childOutcome({ seed: '42', items: [], scoreOf: () => 0, target: 'most', streamKey: () => 'k', decide: () => {} });",
    "childOutcome({ seed: '42', items: [], scoreOf: () => 0, streamKey: () => 'k', decide: () => {} });",
    'const cfg = await loadConfig([]);',
    'cfg.relaseYear;',                            // typo
  ].join('\n'));
  try {
    const res = tsc(['--noEmit', '--allowJs', '--checkJs', '--target', 'es2022', '--module', 'es2022',
      '--moduleResolution', 'bundler', '--strict', 'false', '.types-probe.mjs']);
    const lines = res.out.split('\n').filter((l) => l.includes('.types-probe.mjs'));
    const caught = (frag) => lines.some((l) => l.includes(frag));
    const expected = [
      ["Property 'weighted' does not exist", 'an rng method that does not exist'],
      ['Expected 2 arguments', 'a wrong-arity dice call'],
      ["Type 'string' is not assignable to type 'number'", 'prose where a probability belongs'],
      ["Property 'target' is missing", 'a pattern option bag missing a required option'],
      ["Did you mean 'releaseYear'", 'a typo on the config object'],
    ];
    const missed = expected.filter(([frag]) => !caught(frag)).map(([, what]) => what);
    if (missed.length) throw new Error(`types did NOT reach the call site — missed: ${missed.join('; ')}`);
    const spurious = lines.filter((l) => l.includes('(6,'));  // the legal pickWeighted line
    if (spurious.length) throw new Error(`types false-positived on legal code: ${spurious[0]}`);
  } finally { rmSync(probe, { force: true }); }
});

// 0e. checks DERIVED from declarations must actually catch a planted defect, and must run in the
// RIGHT PHASE. The reference gates are generated from projects/<name>/refs.mjs; when they were
// first wired in after the validator's FK-first bailout, a dangling reference stopped the run
// before they ever executed — they reported green on a broken world by never running at all.
step('derived reference gates catch a planted dangling ref (and run before the FK-first bailout)', () => {
  run('generate.mjs', ['--n', '500', '--seed', '42', '--release', RELEASE, '--out', 'out-test']);
  const f = join(HERE, 'out-test/packs/committees/committee_memberships.json');
  const rows = JSON.parse(readFileSync(f, 'utf8'));
  const original = rows[3].TermKey;
  rows[3].TermKey = 'BOGUS:1999-01-01';   // a term that was never emitted
  writeFileSync(f, JSON.stringify(rows, null, 1));
  let out = '';
  try { run('validate.mjs', ['--out', 'out-test']); }
  catch (e) { out = String(e.stdout ?? ''); }
  finally { rows[3].TermKey = original; writeFileSync(f, JSON.stringify(rows, null, 1)); }
  if (!out.includes('ref: committee_memberships.TermKey → committee_terms.TermKey')) {
    throw new Error('the DERIVED reference gate did not fire — check it runs inside the referential phase');
  }
});

// 0e-ii. POLYMORPHIC reference edges — one column whose parent table depends on a sibling
// discriminator. These could not be declared at all before `when`, so they stayed as a hand-written
// switch in the validator whose last branch was `: false`: a RefKind nobody added to the chain
// failed closed as an unnamed dangling count. Two things must hold now, and both are planted here.
//
// The second plant is the one that taught me something. My first version required each declared
// subset to be NON-EMPTY, reasoning that a subset matching nothing meant its discriminator had been
// renamed. That failed 3 of 7 seeds: at N=500 some seeds have no billing issue sourced from an order,
// a kind that is real but rare. Absence of rows is not a defect. Asking the inverse — is every value
// PRESENT in the data claimed by some declared edge — catches the rename, catches a brand-new kind a
// generator starts emitting, and has no false positives. That is only possible because `when` is
// data; a predicate function can only tell you whether it matched.
step('polymorphic reference edges catch a bad parent AND an undeclared discriminator value', () => {
  run('generate.mjs', ['--n', '400', '--seed', '42', '--release', RELEASE, '--out', 'out-test']);
  const f = join(HERE, 'out-test/packs/platform/record_changes.json');
  const original = readFileSync(f, 'utf8');
  const fire = (mutate, expect, what) => {
    const rows = JSON.parse(original);
    mutate(rows);
    writeFileSync(f, JSON.stringify(rows, null, 1));
    let out = '';
    try { run('check-declared.mjs', ['--out', 'out-test']); } catch (e) { out = String(e.stdout ?? ''); }
    if (!out.includes(expect)) throw new Error(`${what} was NOT caught. Looked for: ${expect}`);
  };
  try {
    // (a) an audit row pointing at an issue that does not exist
    fire((rows) => { rows[rows.findIndex((r) => r.RefKind === 'issue')].RefKey = 'ISS-NOPE'; },
      'ref: record_changes.RefKey [RefKind=issue] → issues.IssueKey', 'a dangling polymorphic ref');
    // (b) a discriminator value nobody declared — whether renamed or newly emitted. These rows
    // reference something no gate looks at, which is exactly what the old `: false` fallback did.
    fire((rows) => { for (const r of rows) if (r.RefKind === 'task') r.RefKind = 'taskItem'; },
      'UNDECLARED: taskItem', 'a renamed discriminator value');
    fire((rows) => { rows[0].RefKind = 'invoice'; },
      'UNDECLARED: invoice', 'a brand-new discriminator value');
  } finally { writeFileSync(f, original); }
});

// 0e-iii. A DERIVED target band must catch a broken share. Six of these were hand-written bands in
// the validator until their measurements moved into the project; the migration was verified by
// running derived and bespoke side by side and matching every digit, but a gate that has never been
// seen to fail is still unproven, so one gets its data broken here.
step('a derived target band catches a broken share', () => {
  run('generate.mjs', ['--n', '400', '--seed', '42', '--release', RELEASE, '--out', 'out-test']);
  const f = join(HERE, 'out-test/packs/issues/issues.json');
  const original = readFileSync(f, 'utf8');
  try {
    const rows = JSON.parse(original);
    for (const r of rows) delete r.AssigneeMemberNumber;   // 0% assigned against a declared 75%
    writeFileSync(f, JSON.stringify(rows, null, 1));
    let out = '';
    try { run('check-declared.mjs', ['--out', 'out-test']); } catch (e) { out = String(e.stdout ?? ''); }
    if (!/issues\.params\.assignment: 0\.0% vs 75\.0%/.test(out)) {
      throw new Error(`the derived target gate did not fire on a 0% share. Got: ${out.slice(0, 300)}`);
    }
  } finally { writeFileSync(f, original); }
});

// 0f. the derived PRESENCE floors must catch the failure that motivated them: Critical-severity
// tickets sat at zero for weeks while every gate stayed green, because a category whose expected
// share is 0.5% passes a ±6-point band at exactly zero rows. Reproduce it exactly.
step('derived presence floors catch a missing category (the Critical-severity failure)', () => {
  run('generate.mjs', ['--n', '500', '--seed', '42', '--release', RELEASE, '--out', 'out-test']);
  const f = join(HERE, 'out-test/packs/issues/issues.json');
  const rows = JSON.parse(readFileSync(f, 'utf8'));
  const original = rows.map((r) => r.Severity);
  for (const r of rows) if (r.Severity === 'Critical') r.Severity = 'High';
  writeFileSync(f, JSON.stringify(rows, null, 1));
  let out = '';
  try { run('validate.mjs', ['--out', 'out-test']); }
  catch (e) { out = String(e.stdout ?? ''); }
  finally { rows.forEach((r, i) => { r.Severity = original[i]; }); writeFileSync(f, JSON.stringify(rows, null, 1)); }
  if (!out.includes('MISSING: Critical')) {
    throw new Error('the derived presence floor did not name the missing category');
  }
});

// 0g. THE new-domain trap. A human-form effect (liftPts/groupTarget/strength) is only solved for
// the block hooks.compile.arrowsOf points at. Authored anywhere else it keeps beta: undefined,
// every score goes NaN, every draw is false, and the domain generates ZERO ROWS with all gates
// green. That is what happened the first time someone added a domain by following the docs.
step('a human-form effect outside the compiled block fails loudly (not silently at zero rows)', async () => {
  const { compileRuleset } = await import('./engine/compile.mjs');
  const hooks = {
    compile: {
      arrowsOf: (C) => C.membership.effects,
      overallTarget: () => 0.87,
      features: { 'renewal.x': 'x' },
      syntheticPop: (C, r, n) => Array.from({ length: n }, () => ({ x: r.normal() })),
    },
  };
  const C = {
    membership: { effects: { 'renewal.x': { beta: 0.5 } } },
    // a second domain, authored the way CONTRACT.md recommends — and never solved
    speakers: { effects: { 'speak.engagement': { liftPts: 9, share: 0.2, note: 'x' } } },
  };
  try {
    compileRuleset(C, hooks);
    throw new Error('compile ACCEPTED an unsolved human-form effect — the zero-rows trap is open again');
  } catch (e) {
    const m = String(e.message);
    if (m.includes('trap is open')) throw e;
    if (!m.includes('speakers.effects.speak.engagement')) {
      throw new Error(`compile failed, but did not name the offending effect: ${m.split('\n')[0]}`);
    }
  }
});

// 0h. THE PIPELINE GRAPH. Most stage ordering is self-enforcing — you cannot consume what does not
// exist. The dangerous edges are the ones where a stage MUTATES something a later stage reads: the
// argument lists look identical either way, so swapping two calls compiles, runs, and quietly
// produces different data. Verified: swapping applyMotifs and runRenewalUnroll changes committee
// memberships, attendance and motions. Those edges are declared, and checked here.
step('pipeline: declared ordering edges hold, and a violation is caught', async () => {
  const { extractPipeline, checkPipeline } = await import('./engine/pipeline.mjs');
  const { mustPrecede } = await import('./projects/morecheese/pipeline.mjs');
  const stages = extractPipeline(readFileSync(join(HERE, 'projects/morecheese/index.mjs'), 'utf8'));
  if (stages.length < 20) throw new Error(`extracted only ${stages.length} stages — the parser has drifted from buildWorld`);

  const fails = [];
  checkPipeline(stages, mustPrecede, (name, ok) => { if (!ok) fails.push(name); });
  if (fails.length) throw new Error(`declared ordering edge(s) violated: ${fails.join('; ')}`);

  // and the check must actually catch a violation — swap the first declared edge's two stages
  const edge = mustPrecede[0];
  const a = stages.findIndex((s) => s.name === edge.before);
  const b = stages.findIndex((s) => s.name === edge.after);
  const swapped = stages.map((s, i) => ({ ...s, order: i === a ? stages[b].order : i === b ? stages[a].order : s.order }));
  let caught = false;
  checkPipeline(swapped, [edge], (name, ok) => { if (!ok) caught = true; });
  if (!caught) throw new Error('checkPipeline MISSED a violated ordering edge');
});

step('PIPELINE.md matches the code', () => run('emit-pipeline.mjs', ['--check']));

// 0i. NO DEFENSIVE READS OF THE RULESET. `P.someShare ?? 0` on a declared value is dead code that
// becomes a silent bug the moment the key moves. That happened four times in one day — 146
// relationship edges gone, every cancellation reason collapsed, every organisation's legal
// structure nulled, every optional-purchase rate zeroed — and no gate, lint, schema or type check
// caught any of them.
step('no defensive reads of declared ruleset values (and a planted one is caught)', () => {
  run('check-reads.mjs', []);
  const f = join(HERE, 'projects/morecheese/committees.mjs');
  const original = readFileSync(f, 'utf8');
  try {
    writeFileSync(f, original.replace('const min = P.minRosterPerTerm;', 'const min = P.minRosterPerTerm ?? 0;'));
    let caught = false;
    try { run('check-reads.mjs', []); } catch { caught = true; }
    if (!caught) throw new Error('check-reads MISSED a planted `?? 0` on a declared param');
  } finally { writeFileSync(f, original); }
});

// 0j. The derived checks must run STANDALONE, for any project. That is the difference between a
// framework and one project's validator: cli/validate.mjs is 1,600 lines of MoreCheese and runs
// nowhere else, so until now a second project inherited no gates at all.
step('derived checks run standalone (and its exit code reflects failures)', () => {
  run('generate.mjs', ['--n', '500', '--seed', '42', '--release', RELEASE, '--out', 'out-test']);
  const out = run('check-declared.mjs', ['--out', 'out-test']);
  for (const kind of ['references', 'presence floors', 'targets']) {
    if (!out.includes(kind)) throw new Error(`standalone runner did not report the ${kind} kind`);
  }
  // and a broken world must make it exit non-zero, not merely print a red line
  const f = join(HERE, 'out-test/packs/issues/issues.json');
  const rows = JSON.parse(readFileSync(f, 'utf8'));
  const original = rows.map((r) => r.Severity);
  for (const r of rows) if (r.Severity === 'Critical') r.Severity = 'High';
  writeFileSync(f, JSON.stringify(rows, null, 1));
  let exited = 0;
  try { run('check-declared.mjs', ['--out', 'out-test']); }
  catch { exited = 1; }
  finally { rows.forEach((r, i) => { r.Severity = original[i]; }); writeFileSync(f, JSON.stringify(rows, null, 1)); }
  if (!exited) throw new Error('check-declared printed a failure but exited 0 — a green exit on a broken world');
});

// 0k. THE GENERATOR CONTRACT. The ruleset got a named shape that is documented and checked; the
// generators had no shape at all — 21 entry signatures, no two alike, up to seven positional
// parameters. Two same-typed arrays transposed is silent wrong data with no error.
step('generator contract holds (and a positional signature is caught)', () => {
  run('check-generators.mjs', []);
  const f = join(HERE, 'projects/morecheese/tasks.mjs');
  const original = readFileSync(f, 'utf8');
  try {
    writeFileSync(f, original.replace('export function buildTasks(cfg, { people, periods, committees })', 'export function buildTasks(cfg, people, periods, committees)'));
    let caught = false;
    try { run('check-generators.mjs', []); } catch { caught = true; }
    if (!caught) throw new Error('check-generators MISSED a positional dependency list');
  } finally { writeFileSync(f, original); }
});

// 0l. THE PACK CONTRACT — the third and last coupling point to get a named shape.
//
// A pack declares what ships and what must install first. Both claims were unchecked, and both
// were measured wrong-and-green before this existed:
//
//   * a domain wired into buildWorld but left out of the pack map generated rows and shipped
//     NOTHING, with 257 of 257 gates passing. It is the last of three wiring steps and it was the
//     only one nothing chased you about.
//   * dependsOn could say anything. The one gate on it asserted Array.isArray(). Deleting a real
//     dependency was green, and the failure lands at install time on a foreign key.
step('pack contract holds (an unshipped table and a lying dependsOn are both caught)', () => {
  const f = join(HERE, 'projects/morecheese/index.mjs');
  const original = readFileSync(f, 'utf8');
  const gen = () => run('generate.mjs', ['--n', '300', '--seed', '42', '--release', RELEASE, '--out', 'out-test']);
  try {
    // (a) a whole domain left out of the pack map
    const from = original.indexOf('    messaging: {\n      dependsOn:');
    const to = original.indexOf('    platform: {\n      dependsOn:');
    if (from < 0 || to < 0) throw new Error('pack map anchors moved — this negative test is now vacuous');
    writeFileSync(f, original.slice(0, from) + original.slice(to));
    let out = '';
    try { gen(); } catch (e) { out = String(e.stdout ?? '') + String(e.stderr ?? '') + String(e.message ?? ''); }
    if (!/ship NOWHERE/.test(out) || !/messaging\.messages/.test(out)) {
      throw new Error(`emitPacks MISSED a domain that ships nowhere. Got: ${out.slice(0, 400)}`);
    }

    // (b) dependsOn omitting a dependency the reference graph proves is real
    writeFileSync(f, original.replace("    membership: {\n      dependsOn: ['common'],", '    membership: {\n      dependsOn: [],'));
    gen();
    let caught = false;
    try { run('check-declared.mjs', ['--out', 'out-test']); } catch { caught = true; }
    if (!caught) throw new Error('the install-order gate MISSED a dependsOn that omits a real dependency');
  } finally { writeFileSync(f, original); }
});

// 0m. ONE DICE STREAM PER DECISION. Two decisions sharing a stream become correlated, and the data
// stays plausible while they are — no distribution gate can see it. Held perfectly today (49,603
// distinct streams, none from two call sites), so the negative test is the only proof the checker
// works: it plants a key that another site genuinely produces.
step('every dice stream belongs to one decision (and a shared stream is caught)', () => {
  run('check-streams.mjs', ['--n', '400', '--seed', '42', '--release', RELEASE]);
  const f = join(HERE, 'projects/morecheese/messaging.mjs');
  const original = readFileSync(f, 'utf8');
  try {
    const planted = original.replace('rng(seed, `msgthread:${issue.IssueKey}`)', 'rng(seed, `person:ICF-100001`)');
    if (planted === original) throw new Error('stream plant anchor moved — this negative test is now vacuous');
    writeFileSync(f, planted);
    let caught = false;
    try { run('check-streams.mjs', ['--n', '400', '--seed', '42', '--release', RELEASE]); } catch { caught = true; }
    if (!caught) throw new Error('check-streams MISSED two decisions drawing from one stream');
  } finally { writeFileSync(f, original); }
});

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
  execFileSync('diff', ['-r', join(HERE, 'out-test'), join(HERE, 'out-test2')], { encoding: 'utf8' });
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
// (the provisional DDL and the seed INSERTs share assumed shapes — they must never disagree).
// SCOPE: only the playground packs (01–10) have stand-in DDL in emit-schema's shim. The
// platform (11) + sonar (12) packs write to real __mj core / __mj_BizAppsSonar tables the
// shim deliberately does NOT stand in (integration-grade, real-install only) — those are
// covered by the schema-contract gate (6d), which checks the REAL captured schema.
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
  for (const f of ['01_common', '02_membership', '03_events', '04_learning', '05_orders', '06_committees', '07_forms', '08_tasks', '09_issues', '10_messaging']) {
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

// 6c. migration ↔ generator drift guard: the frozen baseline migration OWNS the morecheese
// shapes; the generator's emit-schema (a dev shim) must keep matching it exactly
step('frozen migration matches generator shapes (morecheese tables)', () => {
  const migDir = join(HERE, '..', 'migrations');
  const mig = readdirSync(migDir).filter((f) => /^[BV]\d+__.*\.sql$/.test(f)).sort()
    .map((f) => readFileSync(join(migDir, f), 'utf8')).join('\n');
  const shim = readFileSync(join(HERE, 'out', 'sql', '00_schema.sql'), 'utf8');
  const cols = (body) => new Set([...body.matchAll(/^\s+\[?(\w+)\]? /gm)].map((x) => x[1]).filter((c) => c !== 'CONSTRAINT'));
  // Migrations are IMMUTABLE once applied, so a new column arrives as `ALTER TABLE … ADD`
  // in a follow-on V* file, never as an edit to the original CREATE. Parsing only CREATE
  // made every such column invisible here and the gate then reported it as "in shim, not
  // in migration" — i.e. the drift guard blocked the very change it was meant to police.
  const parse = (sql, resolve) => {
    const out = {};
    for (const m of sql.matchAll(/CREATE TABLE (\S+?)\.(\[?\w+\]?) \(([\s\S]*?)\n\);/g)) {
      const schema = resolve(m[1].replace(/[\[\]]/g, ''));
      out[`${schema}.${m[2].replace(/[\[\]]/g, '')}`] = cols(m[3]);
    }
    // then fold in later ADDs/DROPs, in file order, so the set reflects the CURRENT shape
    for (const m of sql.matchAll(/ALTER TABLE\s+(\S+?)\.(\[?\w+\]?)\s+ADD\s+([\s\S]*?);/gi)) {
      const key = `${resolve(m[1].replace(/[\[\]]/g, ''))}.${m[2].replace(/[\[\]]/g, '')}`;
      if (!out[key]) continue; // ALTER on a table we don't track (dependency schema)
      for (const part of m[3].split(',')) {
        const name = part.trim().match(/^\[?(\w+)\]?\s+\w/);           // "Col TYPE …"
        // skip constraints, and skip CodeGen's own audit columns: the baseline adds
        // __mj_CreatedAt/__mj_UpdatedAt by ALTER, but the shim deliberately models none
        // of what CodeGen owns, so folding them in would report drift that isn't real
        if (name && !/^CONSTRAINT$/i.test(name[1]) && !name[1].startsWith('__mj_')) out[key].add(name[1]);
      }
    }
    for (const m of sql.matchAll(/ALTER TABLE\s+(\S+?)\.(\[?\w+\]?)\s+DROP COLUMN\s+\[?(\w+)\]?/gi)) {
      const key = `${resolve(m[1].replace(/[\[\]]/g, ''))}.${m[2].replace(/[\[\]]/g, '')}`;
      out[key]?.delete(m[3]);
    }
    return out;
  };
  const migT = parse(mig, (s2) => s2 === '${flyway:defaultSchema}' ? 'morecheese_members' : s2);
  const shimT = parse(shim, (s2) => s2);
  const problems = [];
  for (const [t, mcols] of Object.entries(migT)) {
    if (!shimT[t]) { problems.push(`migration table ${t} missing from generator shim`); continue; }
    for (const c of mcols) if (!shimT[t].has(c)) problems.push(`${t}.${c} in migration, not in shim`);
    for (const c of shimT[t]) if (!mcols.has(c)) problems.push(`${t}.${c} in shim, not in migration`);
  }
  for (const t of Object.keys(shimT).filter((x) => x.startsWith('morecheese'))) {
    if (!migT[t]) problems.push(`generator table ${t} has no frozen migration (write a V* file!)`);
  }
  if (problems.length) throw new Error('❌ migration/shim drift:\n' + problems.map((x) => '  ' + x).join('\n'));
});

// 6d. schema-contract gate: our assumptions about tables we DON'T own (__mj core,
// __mj_BizApps*) checked against a captured snapshot of the real schema. Catches a moved
// column, a new required column, a tightened CHECK, or a renamed lookup — in milliseconds,
// instead of at a 13-minute install. Refresh the snapshot on a dependency bump:
//   MJ_SA_PASSWORD=… node cli/capture-contract.mjs --db <reference-install>
// See datagen/SCHEMA-CONTRACT.md.
step('seed assumptions match the dependency-schema contract', async () => {
  const { MAPPING, PREAMBLE } = await import('./projects/morecheese/seed-mapping.mjs');
  const contract = JSON.parse(readFileSync(join(HERE, 'contract', 'schema-contract.json'), 'utf8'));
  const load = (pack, table) => JSON.parse(readFileSync(join(HERE, 'out', 'packs', pack, `${table}.json`), 'utf8'));
  const claims = extractClaims({ MAPPING, PREAMBLE, load });
  const problems = checkClaims(claims, contract);
  if (problems.length) throw new Error(`❌ schema-contract drift (snapshot captured ${contract.capturedAt} from ${contract.database}):\n` + problems.map((x) => '  ' + x).join('\n') + '\n  → if a dependency was bumped, re-capture: MJ_SA_PASSWORD=… node cli/capture-contract.mjs --db <install>');
});

for (const d of ['out-test', 'out-test2']) rmSync(join(HERE, d), { recursive: true, force: true });
await Promise.all(pending);
console.log(`\n${failures === 0 ? '✔ ALL GREEN' : `✋ ${failures} step(s) failed`}`);
process.exit(failures ? 1 : 0);
