#!/usr/bin/env node
// THE FRAMEWORK METRIC — declarations : code, measured, per domain and total.
//
// The question this answers: "is this a framework yet?" A framework is one where a domain is
// mostly DECLARED (ruleset sections, row templates, reference edges) and only its judgement is
// code. The honest way to track that is a ratio printed by a tool, not a claim in a document.
//
// BASELINE (first run of this tool, 2026-08-04): 1.35 : 1. The 0.91 : 1 quoted during planning
// counted only ruleset modules with a same-named generator; this tool also attributes the
// ruleset-only modules (heroes' authored roster, orders' timing profiles, core), which is the
// more honest accounting — authored data is authored data whether or not a generator shares its
// name. The trend is what matters, and the trend starts at 1.35.
//
// WHAT COUNTS AS WHAT (kept deliberately stable so the trend is comparable):
//   declarations  substantive lines in ruleset/modules/*.mjs, PLUS the lines of exported
//                 *_ROW template specs inside generator files (they are pure data that happens
//                 to live generator-adjacent — see engine/row-template.mjs)
//   code          substantive lines of the domain generator files, MINUS their template specs
// Aux files (hooks, banks, identity, seed-mapping, refs, presence, measurements, pipeline) are
// reported separately and count toward NEITHER — changing their bucket would make the trend
// incomparable with the quoted baseline.
//
//   node cli/measure-framework.mjs [--project morecheese] [--json]
//
// ⚠ AS OF 2026-08-05 THIS RUNS DEGRADED. acorn is declared in the root package.json but has never
// been installed, so every ratio quoted anywhere comes from the fallback line classifier, not the
// AST pass. That is why the tool prints its parser on every run. One `npm install` at the REPO ROOT
// fixes it — never inside datagen/ or any subfolder of a linked MJ workspace (rule 5).
//
// PARSER: uses acorn when it can be found; this repo deliberately has no node_modules of its
// own and rule 5 forbids npm install inside a linked MJ workspace, so resolution is a chain:
// a bare import (works once a root install provides it), then the conventional linked-MJ
// locations. With no parser the tool DEGRADES LOUDLY to a line classifier and says so in its
// output — a silently different measurement would be worse than none.
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { argvProject } from '../engine/config.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const argv = process.argv.slice(2);
const project = argvProject(process.argv);
const asJson = argv.includes('--json');

const NOT_A_GENERATOR = new Set([
  'index.mjs', 'hooks.mjs', 'banks.mjs', 'identity.mjs',
  'refs.mjs', 'presence.mjs', 'measurements.mjs', 'pipeline.mjs', 'seed-mapping.mjs',
  // PROJECT-OWNED TOOLING is not a generator, and this list has now been bitten twice by the same
  // shape: the fixture's validator read as 40 lines of generator code (ratio 1.57 → 0.91), then
  // demo.mjs + emit-schema.mjs moved into morecheese and read as 581 lines of it (1.41 → 1.08) —
  // both times the framework "went backwards" because a project gained a tool. If a third kind of
  // project-owned tool ever appears, it belongs here, not in the generator count.
  'validate.mjs', 'demo.mjs', 'emit-schema.mjs',
]);

// Ruleset module → the generator that consumes it, where the names differ. `money` reads the
// `orders` module (const O = R.orders); `world` reads `core` (history, regimes, population).
// Without this the per-domain rows lie in both directions: money shows 0 data, orders shows no
// code. `heroes` stays its own row on purpose — authored data with no generator IS the point.
const RULESET_ALIAS = { orders: 'money', core: 'world' };

// ---------------------------------------------------------------- parser resolution
async function loadParser() {
  try { return (await import('acorn')).parse; } catch { /* not installed at any root */ }
  for (const candidate of [
    join(ROOT, '..', 'node_modules', 'acorn', 'dist', 'acorn.mjs'),          // repo root install
    join(ROOT, '..', '..', '..', '..', 'node_modules', 'acorn', 'dist', 'acorn.mjs'), // worktree → repo root
    join(ROOT, '..', '..', '..', '..', '..', 'node_modules', 'acorn', 'dist', 'acorn.mjs'), // linked MJ root
  ]) {
    if (existsSync(candidate)) return (await import(pathToFileURL(candidate).href)).parse;
  }
  return null;
}

const substantive = (line) => {
  const t = line.trim();
  return t && !t.startsWith('//') && !t.startsWith('*') && !t.startsWith('/*') && t !== '}' && t !== '};' && t !== '});';
};
const countSubstantive = (src) => src.split('\n').filter(substantive).length;

// ---------------------------------------------------------------- template spec extraction
// Template specs are `export const <NAME>_ROW = { ... };` — pure data by lint. With a parser we
// take exact node spans; without one we bracket-match from the declaration line (and say so).
function templateSpans(src, parse) {
  const spans = []; // [startLine, endLine] inclusive, 0-based
  if (parse) {
    const ast = parse(src, { ecmaVersion: 2024, sourceType: 'module' });
    for (const node of ast.body) {
      const decl = node.type === 'ExportNamedDeclaration' ? node.declaration : node;
      if (decl?.type !== 'VariableDeclaration') continue;
      for (const d of decl.declarations) {
        if (d.id?.name?.endsWith('_ROW') && d.init?.type === 'ObjectExpression') {
          spans.push([src.slice(0, node.start).split('\n').length - 1, src.slice(0, node.end).split('\n').length - 1]);
        }
      }
    }
    return spans;
  }
  const lines = src.split('\n');
  for (let i = 0; i < lines.length; i++) {
    if (!/^export const \w+_ROW = \{/.test(lines[i])) continue;
    let depth = 0, j = i;
    do {
      depth += (lines[j].match(/\{/g) ?? []).length - (lines[j].match(/\}/g) ?? []).length;
      j++;
    } while (depth > 0 && j < lines.length);
    spans.push([i, j - 1]);
    i = j - 1;
  }
  return spans;
}

// ---------------------------------------------------------------- measure
const parse = await loadParser();
const projDir = join(ROOT, 'projects', project);
const rulesetDir = join(projDir, 'ruleset', 'modules');

const rows = [];
let totData = 0, totCode = 0, totTemplate = 0;

const rulesetLines = {};
for (const f of readdirSync(rulesetDir).filter((x) => x.endsWith('.mjs') || x.endsWith('.json'))) {
  if (f === 'index.json') continue;
  const name = f.replace(/\.(mjs|json)$/, '');
  const key = RULESET_ALIAS[name] ?? name;
  // accumulate: an alias may land on a generator that ALSO has a same-named module (world has
  // its own module and consumes core's) — overwriting silently dropped 47 lines on first run
  rulesetLines[key] = (rulesetLines[key] ?? 0) + countSubstantive(readFileSync(join(rulesetDir, f), 'utf8'));
}

for (const f of readdirSync(projDir).filter((x) => x.endsWith('.mjs') && !NOT_A_GENERATOR.has(x))) {
  const src = readFileSync(join(projDir, f), 'utf8');
  const lines = src.split('\n');
  const spans = templateSpans(src, parse);
  const inTemplate = new Set();
  for (const [a, b] of spans) for (let i = a; i <= b; i++) inTemplate.add(i);
  let code = 0, tmpl = 0;
  lines.forEach((l, i) => {
    if (!substantive(l)) return;
    if (inTemplate.has(i)) tmpl++; else code++;
  });
  const name = f.slice(0, -4);
  const data = rulesetLines[name] ?? 0;
  rows.push({ domain: name, data, template: tmpl, code, ratio: code ? (data + tmpl) / code : null });
  totData += data; totCode += code; totTemplate += tmpl;
}
// ruleset modules with no same-named generator (heroes, geography, regimes…) still count as data
for (const [name, n] of Object.entries(rulesetLines)) {
  if (!rows.some((r) => r.domain === name)) { rows.push({ domain: name + ' (ruleset only)', data: n, template: 0, code: 0, ratio: null }); totData += n; }
}

const ratio = (totData + totTemplate) / totCode;
if (asJson) {
  console.log(JSON.stringify({ project, parser: parse ? 'acorn' : 'degraded-line-classifier', data: totData, template: totTemplate, code: totCode, ratio: +ratio.toFixed(3), domains: rows }, null, 2));
} else {
  console.log(`framework metric — '${project}'  (parser: ${parse ? 'acorn' : 'DEGRADED line classifier — install acorn for exact spans'})\n`);
  console.log('  domain                     data  template   code    ratio');
  for (const r of rows.sort((a, b) => b.code - a.code)) {
    console.log(`  ${r.domain.padEnd(26)}${String(r.data).padStart(5)}${String(r.template).padStart(9)}${String(r.code).padStart(7)}${r.ratio == null ? '        —' : (r.ratio).toFixed(2).padStart(9)}`);
  }
  console.log(`  ${'TOTAL'.padEnd(26)}${String(totData).padStart(5)}${String(totTemplate).padStart(9)}${String(totCode).padStart(7)}${ratio.toFixed(2).padStart(9)}`);
  console.log(`\n  declarations : code = ${ratio.toFixed(2)} : 1   (baseline, first run 2026-08-04: 1.35 : 1)`);
}
