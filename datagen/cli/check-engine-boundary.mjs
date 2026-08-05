#!/usr/bin/env node
// THE ENGINE BOUNDARY, ENFORCED — the difference between a framework and a well-organised project.
//
// The claim "engine/ is reusable" is rhetoric until something can falsify it. Two failure modes,
// and this repo has had both:
//
//   1. A STATIC IMPORT of project code into the engine. Then the engine cannot load without that
//      project present, and a second consumer is impossible. (Dynamic, PARAMETERISED imports —
//      `import(\`../projects/${project}/index.mjs\`)` — are the correct shape and are allowed:
//      the engine loads *a* project by name, never *the* project.)
//   2. A PROJECT-SPECIFIC VALUE living in the engine. Softer, and it is what actually happened:
//      engine/ids.mjs held a NAMESPACES table keyed by project name, containing MoreCheese's UUID
//      namespace, and its error message told new authors to add theirs to it. Nothing was broken;
//      standing up a second project simply required editing the engine, which is what a framework
//      is supposed to make unnecessary. An engine carrying a list of its consumers is a library
//      with a hardcoded caller list.
//
// So this checks both directions, and the second is why it exists rather than a lint rule about
// imports: the leak was a data table, not a dependency.
//
// IT NOW SCANS cli/ TOO, and that gap was mine. cli/ is engine space — those are the project-blind
// entry points — and checking only engine/ meant two real leaks sat there untouched for as long as
// this checker existed: emit-data-migration.mjs hardcoded 'morecheese_members' as the schema to
// rewrite, and eight files each spelled out the default project name inline. Found by sweeping by
// hand, which is exactly what a checker is supposed to make unnecessary.
//
// Three cli files are PROJECT-OWNED and allowlisted with reasons below. They are a real wart, not a
// clean result: they live in engine space because history put them there, and each one names what it
// would take to move it.
//
//   node cli/check-engine-boundary.mjs
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const ENGINE = join(ROOT, 'engine');
const CLI = join(ROOT, 'cli');
const projects = readdirSync(join(ROOT, 'projects'), { withFileTypes: true })
  .filter((d) => d.isDirectory()).map((d) => d.name);

// The ONE name the engine is allowed to know: the default project for a bare CLI invocation.
// It is a convenience default, not a dependency — every entry point accepts --project.
const ALLOWED = [
  { file: 'config.mjs', needle: 'DEFAULT_PROJECT', why: 'the ONE literal: the default for a bare CLI call. Every entry point accepts --project, and they all read it through argvProject() rather than repeating the name' },
  // ── project-owned files sitting in engine space. A wart, recorded rather than hidden. ──
  { file: 'validate.mjs', needle: '', why: "MoreCheese's own validator, ~175 bespoke gates. Declared via VALIDATOR. A new project writes projects/<name>/validate.mjs instead (build.mjs resolves project-local first) — moving this one would churn the suite and every doc reference for no behavioural gain" },
  { file: 'emit-schema.mjs', needle: '', why: 'a DEV SHIM that never ships: provisional DDL for throwaway demo databases, listing MoreCheese schemas. Would move to projects/morecheese/ if a second project ever needed standalone DDL' },
  { file: 'demo.mjs', needle: '', why: "the HTML inspector, written against MoreCheese's packs. Project-specific reporting, like SUMMARY_OF" },
];

const hard = [];
// engine/ AND cli/: both are engine space. A project-blind entry point that names a project is the
// same defect as an engine module that does.
const files = [
  ...readdirSync(ENGINE).filter((f) => f.endsWith('.mjs')).map((f) => ({ f, dir: ENGINE, label: `engine/${f}` })),
  ...readdirSync(CLI).filter((f) => f.endsWith('.mjs')).map((f) => ({ f, dir: CLI, label: `cli/${f}` })),
].filter(({ f }) => !ALLOWED.some((a) => a.file === f && a.needle === ''));

for (const { f, dir, label } of files) {
  const src = readFileSync(join(dir, f), 'utf8');
  const lines = src.split('\n');

  lines.forEach((line, i) => {
    const at = `${label}:${i + 1}`;
    // comments may DISCUSS projects/ freely — including JSDoc, which is where this checker first
    // flagged itself: it stripped `//` but not the `*` continuation lines of a block comment, so a
    // doc comment explaining the allowlist counted as a violation of it.
    const t = line.trim();
    if (t.startsWith('*') || t.startsWith('/*') || t.startsWith('*/')) return;
    const code = line.replace(/\/\/.*$/, '');
    if (!code.trim()) return;

    // (1) a static import of project code
    if (/^\s*import\s[^(]*from\s+['"][^'"]*projects\//.test(code)) {
      hard.push(`${at}: static import from projects/ — the engine must never depend on a project existing.\n`
        + '      A dynamic, parameterised import is the correct shape: import(`../projects/${project}/index.mjs`)');
    }

    // (2) a project NAME used as a literal — the data-shaped leak
    for (const p of projects) {
      if (!new RegExp(`['"\`]${p}['"\`]|\\b${p}\\s*:`).test(code)) continue;
      if (ALLOWED.some((a) => f === a.file && code.includes(a.needle))) continue;
      hard.push(`${at}: names the project '${p}' in code — a project-specific value in the engine means `
        + 'standing up another project requires editing the engine.\n'
        + '      Move it to the project and have it declare the value (see UUID_NAMESPACE for the pattern).');
    }
  });
}

const owned = ALLOWED.filter((a) => a.needle === '');
console.log(`engine boundary — ${files.length} engine+cli modules scanned, ${projects.length} project(s) present\n`);
if (owned.length) {
  console.log(`○ ${owned.length} cli file(s) are PROJECT-OWNED and skipped — a wart, not a clean result:`);
  for (const a of owned) console.log(`    ${a.file}: ${a.why}`);
  console.log('');
}
if (hard.length) {
  console.log('❌ boundary violations:\n');
  for (const h of hard) console.log(`  ${h}`);
  process.exit(1);
}
console.log('✅ the engine names no project in code and statically imports none');
console.log('   (projects load dynamically by name; each declares its own UUID_NAMESPACE)');
