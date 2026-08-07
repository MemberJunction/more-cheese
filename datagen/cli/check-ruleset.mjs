#!/usr/bin/env node
// Guards the one thing that .mjs ruleset modules make possible and must never do: BEHAVE.
//
// Writing the ruleset as .mjs buys real comments, real references between catalogs, and
// editor types with no schema. It also buys the ability to call Date.now(), read a file, or
// roll an unseeded random — any of which would silently destroy the property the whole system
// rests on: same spec + same seed → byte-identical output. A ruleset that can compute is a
// ruleset that can drift, and drift here would surface as an unexplained diff months later.
//
// So: a ruleset module may contain literals, local constants, and a type import. Nothing else.
// JSON modules are checked separately, against engine/ruleset.schema.json.
//
//   node cli/check-ruleset.mjs [--project morecheese]
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { argvProject } from '../engine/config.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const project = argvProject(process.argv);
const modDir = join(ROOT, 'projects', project, 'ruleset/modules');

// Each rule says what is forbidden and, more importantly, WHY — an author who trips one
// should learn the reason, not just the rule.
const FORBIDDEN = [
  [/\bDate\s*\.\s*now\b|\bnew\s+Date\s*\(\s*\)/, 'reads the wall clock — every date must derive from --release, or today\'s build differs from yesterday\'s'],
  [/\bMath\s*\.\s*random\b/, 'unseeded randomness — all dice come from rng(seed, streamKey) so a build can be replayed'],
  [/\b(readFileSync|writeFileSync|readFile|writeFile|fetch|createReadStream)\s*\(/, 'does I/O — a ruleset module is data, and data that reads the world is not reproducible'],
  [/\bprocess\s*\.\s*(env|argv)\b/, 'reads the environment — the same repo must generate the same data on every machine'],
  [/\bimport\s*\(/, 'dynamic import — a ruleset module must be statically readable'],
  [/\bexport\s+(async\s+)?function\b|=>\s*{[^}]*\breturn\b/, 'defines a function — put behaviour in projects/<name>/*.mjs, not in the ruleset'],
];

// A type-only import is the single allowed import: it costs nothing at runtime.
const ALLOWED_IMPORT = /^\s*(\/\/.*|\/\*.*)?$|^\s*import\s+.*['"][^'"]*types(\.js)?['"]\s*;?\s*$/;

const files = readdirSync(modDir).filter((f) => f.endsWith('.mjs')).sort();
if (!files.length) {
  console.log('no .mjs ruleset modules yet — nothing to guard (JSON modules are checked by cli/check-ruleset-schema.mjs)');
  process.exit(0);
}

let failed = 0;
for (const f of files) {
  const src = readFileSync(join(modDir, f), 'utf8');
  const problems = [];

  // strip comments before scanning, so prose describing a hazard isn't mistaken for one
  const code = src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');

  for (const [re, why] of FORBIDDEN) {
    const m = code.match(re);
    if (m) {
      const line = code.slice(0, m.index).split('\n').length;
      problems.push(`line ~${line}: \`${m[0].trim()}\` ${why}`);
    }
  }
  for (const [i, line] of code.split('\n').entries()) {
    if (/^\s*import\b/.test(line) && !ALLOWED_IMPORT.test(line)) {
      problems.push(`line ${i + 1}: imports something other than types — a ruleset module may not depend on code`);
    }
  }

  if (!problems.length) { console.log(`✅ ${f} — data only`); continue; }
  failed++;
  console.log(`❌ ${f}`);
  for (const p of problems) console.log(`     ${p}`);
}

console.log(`\n${files.length - failed}/${files.length} .mjs ruleset modules are pure data`);
if (failed) {
  console.log('\nA ruleset module that can compute is a ruleset that can drift. Move behaviour');
  console.log('into projects/<project>/*.mjs, where determinism is the generator\'s contract.');
  process.exit(1);
}
