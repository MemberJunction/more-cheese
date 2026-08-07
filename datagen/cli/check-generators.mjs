#!/usr/bin/env node
// THE GENERATOR CONTRACT, ENFORCED.
//
// The ruleset got a named shape — catalog / params / effects / mixes — documented and checked, and
// that is the change people noticed. The generators got a scaffold that quietly embodied a shape
// nobody had declared, applied to none of the existing files and enforced nowhere. Same problem,
// half the treatment.
//
// This is the other half. A generator has a shape:
//
//   export function build<Domain>(cfg, deps) {     deps is ALWAYS an object
//     // ── inputs ──      bind the ruleset sections and the upstream data
//     // ── fixtures ──    catalog → rows. No dice.
//     // ── decisions ──   one pattern call per decision, in causal order
//     // ── shape ──       assemble, strip internals
//     return { <table>: rows, … };                 named tables, nothing else
//   }
//
// WHY THE OBJECT MATTERS, concretely: buildIssues took seven positional parameters, four of them
// arrays of rows. Transpose two and you get confidently wrong data, no error, and a call site that
// says nothing about what it is passing. Fourteen signatures were normalised in one pass and the
// output was byte-identical, which is what "mechanical" should mean.
//
// Sections are reported but not required. They are the readable half of the contract and worth
// having; failing a build over a comment header would be theatre.
//
//   node cli/check-generators.mjs [--project morecheese]
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { argvProject } from '../engine/config.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const argv = process.argv;
const project = argvProject(process.argv);
const DIR = join(ROOT, 'projects', project);

// Files that are not domain generators: shared banks, the pipeline itself, declarations.
const NOT_A_GENERATOR = new Set([
  'index.mjs', 'hooks.mjs', 'banks.mjs', 'identity.mjs',
  'refs.mjs', 'presence.mjs', 'measurements.mjs', 'pipeline.mjs', 'seed-mapping.mjs',
  // PROJECT-OWNED TOOLING is not a generator, and this list has now been bitten twice by the same
  // shape: the fixture's validator read as 40 lines of generator code (ratio 1.57 → 0.91), then
  // demo.mjs + emit-schema.mjs moved into morecheese and read as 581 lines of it (1.41 → 1.08) —
  // both times the framework "went backwards" because a project gained a tool. If a third kind of
  // project-owned tool ever appears, it belongs here, not in the generator count.
  'validate.mjs', 'demo.mjs', 'emit-schema.mjs', 'explain.mjs',
]);
const SECTIONS = ['inputs', 'fixtures', 'decisions', 'shape'];

const files = readdirSync(DIR).filter((f) => f.endsWith('.mjs') && !NOT_A_GENERATOR.has(f));
// ── A SMALL, HONEST SCANNER ───────────────────────────────────────────────────────────────────
// Not a parser. acorn is declared in the root package.json for exactly this kind of job, but
// datagen deliberately carries no node_modules of its own, so anything that must FAIL A BUILD has
// to work without it. What these three functions buy over a regex is the one property the regex
// lacked: they either find the construct or say they could not, and never quietly match nothing.

/**
 * A per-character map of "this index is CODE" — false inside strings, template literals, line
 * comments, block comments and regex literals. Brace counting without this is how a `}` inside an
 * error message ends a function eighty lines early.
 */
function codeMask(src) {
  const mask = new Array(src.length).fill(false);
  let prev = '';
  for (let i = 0; i < src.length;) {
    const c = src[i], d = src[i + 1];
    if (c === '/' && d === '/') { while (i < src.length && src[i] !== '\n') i++; continue; }
    if (c === '/' && d === '*') { i += 2; while (i < src.length && !(src[i] === '*' && src[i + 1] === '/')) i++; i += 2; continue; }
    if (c === "'" || c === '"' || c === '`') {
      i++;
      while (i < src.length && src[i] !== c) { if (src[i] === '\\') i++; i++; }
      i++; prev = 'x'; continue;
    }
    // a `/` in operand position starts a regex literal; in operator position it is division
    if (c === '/' && /[([{,;:=!&|?+\-*%~^<>]/.test(prev)) {
      i++;
      while (i < src.length && src[i] !== '/') {
        if (src[i] === '\\') i++;
        else if (src[i] === '[') { while (i < src.length && src[i] !== ']') { if (src[i] === '\\') i++; i++; } }
        i++;
      }
      i++; prev = 'x'; continue;
    }
    mask[i] = true;
    if (!/\s/.test(c)) prev = c;
    i++;
  }
  return mask;
}

/** The index of the delimiter matching the one at `from`, or -1 if the source never balances. */
function matchDelim(src, mask, from, open, close) {
  let depth = 0;
  for (let i = from; i < src.length; i++) {
    if (!mask[i]) continue;
    if (src[i] === open) depth++;
    else if (src[i] === close && --depth === 0) return i;
  }
  return -1;
}

/**
 * Every exported `build|run|apply…` in a file, with the span of its body.
 * `start === -1` means the body could not be located — reported, never skipped.
 */
function exportedBuilders(src, mask) {
  const out = [];
  for (const m of src.matchAll(/export function ((?:build|run|apply)[A-Za-z]+)\s*\(/g)) {
    const sigOpen = m.index + m[0].length - 1;                   // the '(' of the parameter list
    const sigClose = matchDelim(src, mask, sigOpen, '(', ')');   // skips destructuring braces
    const bodyOpen = sigClose === -1 ? -1 : src.indexOf('{', sigClose);
    const bodyClose = bodyOpen === -1 ? -1 : matchDelim(src, mask, bodyOpen, '{', '}');
    out.push(bodyClose === -1
      ? { fn: m[1], start: -1, end: -1 }
      : { fn: m[1], start: bodyOpen + 1, end: bodyClose });
  }
  return out;
}

/** The return expressions at the function's own level — not those of nested callbacks, which are
 *  a `spawn:` building one row and say nothing about the generator's shape. */
function topLevelReturns(src, mask, start, end) {
  const out = [];
  let depth = 0;
  for (let i = start; i < end; i++) {
    if (!mask[i]) continue;
    const c = src[i];
    if (c === '{' || c === '(' || c === '[') { depth++; continue; }
    if (c === '}' || c === ')' || c === ']') { depth--; continue; }
    if (depth !== 0 || !src.startsWith('return', i)) continue;
    if (/[\w$]/.test(src[i - 1] ?? '') || /[\w$]/.test(src[i + 6] ?? '')) continue;
    let j = i + 6, inner = 0;
    for (; j < end; j++) {
      if (!mask[j]) continue;
      const k = src[j];
      if (k === '{' || k === '(' || k === '[') inner++;
      else if (k === '}' || k === ')' || k === ']') inner--;
      else if (k === ';' && inner === 0) break;
    }
    out.push(src.slice(i + 6, j).trim());
    i = j;
  }
  return out;
}

const hard = [];
const soft = [];
let analysed = 0;

for (const f of files) {
  const src = readFileSync(join(DIR, f), 'utf8');

  // 1. every exported build/run/apply entry takes (cfg) or (cfg, { … })
  for (const m of src.matchAll(/export function ((?:build|run|apply)[A-Za-z]+)\(([^)]*)\)/g)) {
    const [, fn, sig] = m;
    const rest = sig.replace(/^cfg\s*,?\s*/, '').trim();
    if (rest && !rest.startsWith('{')) {
      hard.push(`${f}: ${fn}(cfg, ${rest}) — dependencies must be ONE OBJECT, not positional. `
        + 'Two same-typed arguments transposed is silent wrong data.');
    }
  }

  // 2. it returns named tables, not a bare array.
  //
  // Found by the function's OWN BODY, matched by brace balance. The first version of this rule
  // scanned `[\s\S]{0,4000}?` forward from the signature to the first `\n  return`, and a
  // generator whose body ran past that window simply produced no match — no error, no mention,
  // just silence. Measured on this project: it covered 8 of 22 exported build functions, and the
  // 14 it skipped were every large one — committees, money, membership's renewal unroll, issues —
  // which are precisely the ones a reader most needs the guarantee for. The checker then printed
  // '✅ every generator … returns named tables', a claim over a population it had never seen.
  // That is the failure mode this repo names elsewhere: reporting green by never running.
  //
  // So coverage is now ACCOUNTED FOR rather than assumed: a function whose body or return cannot
  // be located is reported as unanalysable instead of passing quietly.
  const mask = codeMask(src);
  for (const { fn, start, end } of exportedBuilders(src, mask)) {
    analysed++;
    if (start === -1) {
      hard.push(`${f}: ${fn} — could not locate the function body to check its return shape. `
        + 'Unparseable is not the same as correct; the checker will not pass what it cannot read.');
      continue;
    }
    const returns = topLevelReturns(src, mask, start, end);
    if (!returns.length) {
      hard.push(`${f}: ${fn} — no top-level return found. A generator must return { <tableName>: rows }.`);
      continue;
    }
    for (const ret of returns) {
      if (ret.startsWith('[')) {
        hard.push(`${f}: ${fn} returns a bare array — return { <tableName>: rows } so the pack map and the reader both know what it is.`);
      }
    }
  }

  // 3. the readable half: are the sections there?
  //
  // Reported, never failed — a build that breaks over a comment is theatre. But the report is
  // specific rather than a count: what matters is a generator that MAKES DECISIONS without saying
  // where they are, because that is the part a reader has to find. A pure-fixtures generator with
  // no `decisions` header is correct, not incomplete, and counting headers cannot tell them apart.
  const present = SECTIONS.filter((s) => new RegExp(`──\\s*${s}\\s*──`, 'i').test(src));
  const decides = /\brng\(/.test(src) || /\b(annualParticipation|recurringDecision|childOutcome|derivedTransaction|staticAssignment)\(/.test(src);
  if (present.length < 2) {
    soft.push(`${f}: only ${present.length}/4 sections (${present.join(', ') || 'none'})`);
  } else if (decides && !present.includes('decisions')) {
    soft.push(`${f}: draws or calls a pattern, but has no '── decisions ──' header — the reader has to find them`);
  }
}

// 4. A HANDWRITING HELPER WITH NO USERS is the failure mode this whole file exists to prevent, and
// it has now happened twice. First: coverageOf lived private inside committees.mjs, so writing two
// new domains I reinvented it twice as a slower linear scan. Second, worse: I extracted thetaAt and
// adopted it at 16 sites, then a `git checkout --` while redoing something else silently reverted
// every call site — leaving the helper exported, documented, committed, and called by nothing. The
// suite stayed green and the output stayed byte-identical, because reverting to the original code
// reproduces the original data exactly. Nothing could have caught it except this.
// Scanned across EVERY project, not just the one being checked. A helper is unused when NOBODY
// calls it; a small project not needing indexBy is not a finding, and reporting it as one is how a
// useful check becomes noise people learn to scroll past. This fired on the fixture the moment that
// project existed, naming three helpers it has no reason to want.
const helperSrc = readFileSync(join(ROOT, 'engine', 'authoring.mjs'), 'utf8');
const helpers = [...helperSrc.matchAll(/export function (\w+)/g)].map((m) => m[1]);
const everyGenerator = readdirSync(join(ROOT, 'projects'), { withFileTypes: true })
  .filter((d) => d.isDirectory())
  .flatMap((d) => {
    const dir = join(ROOT, 'projects', d.name);
    return readdirSync(dir).filter((f) => f.endsWith('.mjs') && !NOT_A_GENERATOR.has(f))
      .map((f) => readFileSync(join(dir, f), 'utf8'));
  }).join('\n');
const unused = helpers.filter((h) => !new RegExp(`\\b${h}\\(`).test(everyGenerator));

console.log(`generator contract — ${files.length} generators in '${project}'\n`);
if (unused.length) {
  console.log(`○ engine/authoring.mjs exports ${unused.length} helper(s) NO project's generators call: ${unused.join(', ')}`);
  console.log('  Either adopt them or delete them. An unused helper is one somebody will rebuild worse,');
  console.log('  and a helper whose call sites vanished is a change that never actually landed.\n');
}
if (hard.length) {
  console.log('❌ contract violations:\n');
  for (const h of hard) console.log(`  ${h}`);
} else {
  // The count is part of the claim. '✅ every generator …' over a population the checker never
  // actually visited is how the 4,000-char window hid 14 of 22 functions for as long as it existed.
  console.log(`✅ all ${analysed} exported build functions take (cfg, deps) with deps as an object, and return named tables`);
}
if (soft.length) {
  console.log(`\n○ ${soft.length} of ${files.length} generators lack the section headers (advisory — the readable`);
  console.log('  half of the contract; new ones get them from cli/new-domain.mjs):');
  for (const s of soft.slice(0, 8)) console.log(`    ${s}`);
  if (soft.length > 8) console.log(`    … and ${soft.length - 8} more`);
}
process.exit(hard.length ? 1 : 0);
