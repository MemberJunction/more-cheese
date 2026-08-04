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

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const argv = process.argv;
const project = argv.includes('--project') ? argv[argv.indexOf('--project') + 1] : 'morecheese';
const DIR = join(ROOT, 'projects', project);

// Files that are not domain generators: shared banks, the pipeline itself, declarations.
const NOT_A_GENERATOR = new Set([
  'index.mjs', 'hooks.mjs', 'banks.mjs', 'identity.mjs',
  'refs.mjs', 'presence.mjs', 'measurements.mjs', 'pipeline.mjs', 'seed-mapping.mjs',
]);
const SECTIONS = ['inputs', 'fixtures', 'decisions', 'shape'];

const files = readdirSync(DIR).filter((f) => f.endsWith('.mjs') && !NOT_A_GENERATOR.has(f));
const hard = [];
const soft = [];

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

  // 2. it returns named tables, not a bare array
  for (const m of src.matchAll(/export function ((?:build|run|apply)[A-Za-z]+)[\s\S]{0,4000}?\n  return ([^;]+);/g)) {
    const [, fn, ret] = m;
    if (ret.trim().startsWith('[')) {
      hard.push(`${f}: ${fn} returns a bare array — return { <tableName>: rows } so the pack map and the reader both know what it is.`);
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

console.log(`generator contract — ${files.length} generators in '${project}'\n`);
if (hard.length) {
  console.log('❌ contract violations:\n');
  for (const h of hard) console.log(`  ${h}`);
} else {
  console.log(`✅ every generator takes (cfg, deps) with deps as an object, and returns named tables`);
}
if (soft.length) {
  console.log(`\n○ ${soft.length} of ${files.length} generators lack the section headers (advisory — the readable`);
  console.log('  half of the contract; new ones get them from cli/new-domain.mjs):');
  for (const s of soft.slice(0, 8)) console.log(`    ${s}`);
  if (soft.length > 8) console.log(`    … and ${soft.length - 8} more`);
}
process.exit(hard.length ? 1 : 0);
