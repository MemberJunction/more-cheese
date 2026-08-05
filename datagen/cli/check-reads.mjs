#!/usr/bin/env node
// FORBIDS DEFENSIVE READS OF THE RULESET — the failure family that cost the most.
//
// `P.someShare ?? 0` looks careful. It is the opposite. The key exists, so the default is dead
// code — until someone moves or renames the key, at which point the default silently applies and
// the generator produces confidently wrong data with every gate green.
//
// This happened four times in one day:
//
//   if (D.referral)                        → 146 relationship edges vanished
//   M.churnReasons ? … : fallback          → every cancellation reason collapsed to one value
//   R?.orgs?.legalStructure?.byType?.[…]   → every organisation lost its legal structure
//   O.addOns?.journalShare ?? 0            → every optional purchase rate became zero
//
// None was caught by a gate, a lint, the schema, or the type checker. All four were found by
// comparing output bytes — which only works if someone thinks to look.
//
// THE RULE: no `??` or `?.` on a path rooted at a ruleset section alias (params / catalog /
// effects / mixes). Those values are declared; if one is missing that is a bug and you want the
// crash, at the line that reads it, not a plausible default three hundred rows later.
//
// Genuinely optional ruleset values DO exist — a hero may have no committees, a project may have
// no regimes. Those are listed in ALLOWED below, each with a reason. The point is that an
// exception has to be argued for once, in writing, rather than typed absent-mindedly.
//
//   node cli/check-reads.mjs [--project morecheese]
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { argvProject } from '../engine/config.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const argv = process.argv;
const project = argvProject(process.argv);
const DIR = join(ROOT, 'projects', project);

// Optional BY DESIGN. Each entry is a substring of the offending expression plus why it stands.
const ALLOWED = [
  ['h.committees ??', 'a hero may hold no committee seats'],
  ['h?.committees ??', 'a hero may hold no committee seats'],
  ['R.heroes ??', 'a project need not have pinned heroes at all'],
  ['R.regimes?.covid', 'a project need not model any era'],
  ['CV?.', 'guarded by the regimes-exist check above it'],
  ['CV.virtualMultiplier ??', 'a future era may not touch this channel'],
  ['CV.joinRateMultiplier ??', 'a future era may not touch acquisition'],
  ['CV.competitionMultiplier ??', 'a future era may not touch competitions'],
  ['CV2.advocacyMultiplier ??', 'a future era may not touch advocacy'],
  ['webinarScheduleMultiplier ??', 'a future era may not reschedule webinars'],
  ['M.catalog[b][issue.TypeKey] ??', 'a real fallback: the type-specific wording bank, else the General one'],
  ['M.catalog[b].General ??', 'a real fallback: the General bank, else the bank itself'],
  ['R.membership?.tiers', 'the lint runs against partial synthetic rulesets in the suite'],
  ['R.committees?.catalog?.committees ??', 'the lint runs against partial synthetic rulesets in the suite'],
  ['R.programs?.catalog?.certifications ??', 'the lint runs against partial synthetic rulesets in the suite'],
  ['R.membership.catalog.tiers ??', 'the lint runs against partial synthetic rulesets in the suite'],
  ['pinned?.', 'hero pins are optional per hero'],
];

const files = readdirSync(DIR).filter((f) => f.endsWith('.mjs'));
const violations = [];

for (const f of files) {
  const src = readFileSync(join(DIR, f), 'utf8');
  const lines = src.split('\n');

  // aliases bound to the ruleset in THIS file: const X = R.block, then const Y = X.params, …
  const aliases = new Set(['R', 'cfg']);
  for (const m of src.matchAll(/const\s+(\w+)\s*=\s*(?:cfg\.)?R\.[a-zA-Z]/g)) aliases.add(m[1]);
  for (const m of src.matchAll(/const\s+(\w+)\s*=\s*([A-Za-z]\w*)\.(params|catalog|effects|mixes)\b/g)) {
    if (aliases.has(m[2])) aliases.add(m[1]);
  }

  for (const m of src.matchAll(/([A-Za-z_][\w.[\]'"`${}]*?)\s*(\?\?|\?\.)/g)) {
    const root = m[1].split(/[.[]/)[0];
    if (!aliases.has(root)) continue;                     // reading generated data — fine
    const line = src.slice(0, m.index).split('\n').length;
    const text = lines[line - 1].trim();
    if (ALLOWED.some(([frag]) => text.includes(frag))) continue;
    violations.push({ file: f, line, text: text.slice(0, 100) });
  }
}

if (!violations.length) {
  console.log(`✅ no defensive reads of the ruleset in ${files.length} ${project} files`);
  console.log(`   (${ALLOWED.length} exceptions declared, each with a reason)`);
  process.exit(0);
}

console.log(`❌ ${violations.length} defensive read(s) of declared ruleset values:\n`);
for (const v of violations) console.log(`  ${v.file}:${v.line}\n    ${v.text}\n`);
console.log('A declared value that is missing is a BUG. You want the crash at the line that reads');
console.log('it — not a plausible default, three hundred rows later, with every gate green.');
console.log('\nIf the value is genuinely optional, add it to ALLOWED in this file WITH A REASON.');
process.exit(1);
