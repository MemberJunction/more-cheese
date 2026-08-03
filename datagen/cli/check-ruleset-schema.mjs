#!/usr/bin/env node
// Checks every ruleset module against engine/ruleset.schema.json — the same schema the editor
// reads for autocomplete and hover docs (wired in .vscode/settings.json). Run by test.mjs.
//
//   node cli/check-ruleset-schema.mjs [--project morecheese]
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { validate } from '../engine/schema-check.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const project = process.argv.includes('--project') ? process.argv[process.argv.indexOf('--project') + 1] : 'morecheese';

const schema = JSON.parse(readFileSync(join(ROOT, 'engine/ruleset.schema.json'), 'utf8'));
const modDir = join(ROOT, 'projects', project, 'ruleset/modules');
// index.json is the composition MANIFEST, not a ruleset module — it declares load order and has
// nothing the ruleset schema describes. Validating it would pass vacuously and report a green
// check for work not done, which is worse than reporting nothing.
const files = readdirSync(modDir).filter((f) => f.endsWith('.json') && f !== 'index.json').sort();

if (!files.length) {
  console.log(`no JSON ruleset modules in '${project}' — every module is .mjs, checked instead by`);
  console.log('cli/check-ruleset.mjs (data-only) and `npx tsc -p datagen --noEmit` (types).');
  console.log('\nThis schema still describes the format, and still serves any project that keeps');
  console.log('its modules as JSON.');
  process.exit(0);
}

let failed = 0;
for (const f of files) {
  let doc;
  try { doc = JSON.parse(readFileSync(join(modDir, f), 'utf8')); }
  catch (e) { console.log(`❌ ${f}: not valid JSON — ${e.message}`); failed++; continue; }
  const errs = validate(doc, schema);
  if (!errs.length) { console.log(`✅ ${f}`); continue; }
  failed++;
  console.log(`❌ ${f} (${errs.length} problem${errs.length === 1 ? '' : 's'})`);
  for (const e of errs.slice(0, 12)) console.log(`     ${e}`);
  if (errs.length > 12) console.log(`     … and ${errs.length - 12} more`);
}

console.log(`\n${files.length - failed}/${files.length} modules valid against engine/ruleset.schema.json`);
if (failed) {
  console.log('\nAuthors are shown this schema in their editor. If a module is legitimately right');
  console.log('and the schema is wrong, fix the schema — never leave the two disagreeing.');
  process.exit(1);
}
