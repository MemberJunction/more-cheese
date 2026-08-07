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
// ONE cli file is PROJECT-OWNED and allowlisted below, down from three. demo.mjs (an inspector
// written against MoreCheese's tables and personas) and emit-schema.mjs (a dev shim listing
// MoreCheese's schemas) moved to projects/morecheese/ on 2026-08-05, and build.mjs resolves both
// project-locally the way it already resolved the validator.
//
// cli/validate.mjs stays, and the reason is cost rather than principle: 1,545 lines referenced from
// seven documents and forty call sites, and it BLOCKS NOTHING — a new project writes
// projects/<name>/validate.mjs and declares it, which the fixture does. Moving it would be tidiness
// paid for in churn. Recorded here so the next person decides on facts rather than discovering it.
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
];

/**
 * Strip a `//` line comment — but only when the `//` is genuinely outside a string.
 *
 * The naive `line.replace(/\/\/.*$/, '')` cuts a URL in half (`'https://…'` → `'https:`), which
 * both discards the rest of the line unscanned and leaves an unterminated literal for the
 * substring rule below. A leak hiding after a URL on the same line would have been invisible.
 */
function stripLineComment(line) {
  let quote = null;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (quote) {
      if (c === '\\') { i++; continue; }
      if (c === quote) quote = null;
    } else if (c === "'" || c === '"' || c === '`') {
      quote = c;
    } else if (c === '/' && line[i + 1] === '/') {
      return line.slice(0, i);
    }
  }
  return line;
}

/** Does `name` appear in `value` as a whole segment — delimited by _ - / \ . or the string ends?
 *  `morecheese_members` yes, `projects/morecheese/banks` yes, `fixtures` no. */
function isSegment(value, name) {
  const DELIM = /[_\-/\\.]/;
  for (let i = value.indexOf(name); i !== -1; i = value.indexOf(name, i + 1)) {
    const before = i === 0 ? '' : value[i - 1];
    const after = value[i + name.length] ?? '';
    if ((before === '' || DELIM.test(before)) && (after === '' || DELIM.test(after))) return true;
  }
  return false;
}

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
    const code = stripLineComment(line);
    if (!code.trim()) return;

    // (1) a static import of project code
    if (/^\s*import\s[^(]*from\s+['"][^'"]*projects\//.test(code)) {
      hard.push(`${at}: static import from projects/ — the engine must never depend on a project existing.\n`
        + '      A dynamic, parameterised import is the correct shape: import(`../projects/${project}/index.mjs`)');
    }

    // (2) a project NAME used as a literal — the data-shaped leak.
    //
    // The original rule matched the name only as a WHOLE quoted token (`'morecheese'`), and that
    // is how it missed the exact leak the header above credits it with catching:
    // emit-data-migration.mjs held `'morecheese_members'` — the name glued to a suffix — and
    // `'projects/morecheese/banks'` walked past it too. Both were found by sweeping by hand,
    // twice, which is what a checker exists to make unnecessary. A project name is a leak
    // wherever it sits in a value: suffixed, prefixed, or as a path segment. Each one is an edit
    // the engine would need in order to gain a second consumer, which is the claim being defended.
    //
    // The rule is deliberately two-part, because the loose version does not survive contact with
    // a project named after an ordinary word. Plain substring matching flagged `'fixtures'` (a
    // section name in the generator contract) and the sentence "a fixture has no dice" — noise,
    // and noise is how a checker gets ignored. So a hit requires BOTH:
    //
    //   a. the literal is a VALUE, not a message — no whitespace in it. Identifiers, schema
    //      names and paths have none; error text and usage strings do.
    //   b. the name sits at a SEGMENT boundary inside that value — delimited by _ - / \ . or by
    //      the ends of the literal. So `morecheese_members` and `projects/morecheese/banks` hit,
    //      while `fixtures` does not, because `fixture` there is a word with a suffix.
    //
    // KNOWN LIMIT, stated rather than discovered later: a name buried in a message with spaces
    // ('table morecheese_members is missing') is not flagged. That is prose, not a value that
    // drives behaviour, and widening to catch it costs more in false positives than it earns.
    //
    // A parameterised path is correctly NOT a hit: the literal's text is `../projects/${project}/…`
    // and the name never appears in it. That is the distinction this whole rule exists to draw.
    const literals = [...code.matchAll(/'([^'\\]*(?:\\.[^'\\]*)*)'|"([^"\\]*(?:\\.[^"\\]*)*)"|`([^`\\]*(?:\\.[^`\\]*)*)`/g)]
      .map((m) => m[1] ?? m[2] ?? m[3] ?? '');
    for (const p of projects) {
      const inLiteral = literals.some((s) => !/\s/.test(s) && isSegment(s, p));
      const asKey = new RegExp(`\\b${p}\\s*:`).test(code);
      if (!inLiteral && !asKey) continue;
      if (ALLOWED.some((a) => f === a.file && a.needle && code.includes(a.needle))) continue;
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
