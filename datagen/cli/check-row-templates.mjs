#!/usr/bin/env node
// ROW TEMPLATES ARE DATA, AND THIS PROVES IT — the lint half of engine/row-template.mjs.
//
// It ships in the same commit as the executor on purpose. Two of the template rules protect
// byte identity in ways that fail SILENTLY at runtime, so a lint that arrives later is a lint
// that arrives after the corruption:
//
//   * integer-like keys: JS object key order is insertion order EXCEPT integer-like keys,
//     which sort first — a template with a field named "0" reorders columns without any error,
//     and column order is serialization order in the packs;
//   * multi-tag field specs: two tags would draw twice or in an ambiguous order. The executor
//     throws at render time, but only on the code path that renders that field.
//
//   node cli/check-row-templates.mjs [--project morecheese]
//
// Checks, per exported *_ROW template in the project's generator files:
//   1. every field spec carries exactly one tag (or is a bare literal)
//   2. no integer-like keys in `let` or `row`
//   3. `fmt` tokens are plain dot-paths (no expressions, no spaces, no operators)
//   4. no functions anywhere in a spec — templates are pure data
//   5. `int` bounds are constant numbers
//   6. a `mix:` path that points into the ruleset (contains '.mixes.') names a mix that exists
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { argvProject } from '../engine/config.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const argv = process.argv.slice(2);
const project = argvProject(process.argv);
const DIR = join(ROOT, 'projects', project);

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
const TAGS = ['const', 'from', 'fromOptional', 'fmt', 'pick', 'mix', 'chance', 'int', 'date', 'seq'];
const problems = [];
let templates = 0;

// the compiled ruleset, for mix-path resolution (check 6)
const { loadRuleset } = await import('../engine/config.mjs');
const R = await loadRuleset(null, project);

for (const f of readdirSync(DIR).filter((x) => x.endsWith('.mjs') && !NOT_A_GENERATOR.has(x))) {
  const mod = await import(pathToFileURL(join(DIR, f)).href);
  for (const [name, spec] of Object.entries(mod)) {
    if (!name.endsWith('_ROW') || !spec || typeof spec !== 'object') continue;
    templates++;
    const where = `${f} ${name}`;
    for (const [section, fields] of [['let', spec.let ?? {}], ['row', spec.row ?? {}]]) {
      for (const [key, fs] of Object.entries(fields)) {
        const at = `${where} ${section}.${key}`;
        if (String(+key) === key) problems.push(`${at}: integer-like key — JS sorts these FIRST, silently reordering columns (and column order is byte identity)`);
        if (typeof fs === 'function') { problems.push(`${at}: a function — templates are pure data; computed values are prepared in scope by the generator`); continue; }
        if (fs === null || typeof fs !== 'object') continue; // bare literal
        const tags = TAGS.filter((t) => t in fs);
        if (tags.length !== 1) problems.push(`${at}: ${tags.length} tags [${tags.join(', ')}] — exactly one, or the draw order is ambiguous`);
        if ('fmt' in fs) {
          for (const m of fs.fmt.matchAll(/\{([^}]+)\}/g)) {
            if (!/^[A-Za-z_$][\w$]*(\.[A-Za-z_$][\w$]*)*$/.test(m[1])) problems.push(`${at}: fmt token '{${m[1]}}' is not a plain dot-path — expressions in templates are the DSL-creep failure mode`);
          }
        }
        if ('int' in fs && !(Array.isArray(fs.int) && fs.int.length === 2 && fs.int.every((n) => typeof n === 'number'))) {
          problems.push(`${at}: int bounds must be two constant numbers — a computed bound is domain logic and stays handwritten`);
        }
        if ('mix' in fs && fs.mix.includes('.mixes.')) {
          // resolve the ruleset part of the path: everything from the segment after the scope alias
          const ix = fs.mix.indexOf('.mixes.');
          const domain = fs.mix.slice(0, ix).split('.').pop();
          const mixName = fs.mix.slice(ix + '.mixes.'.length);
          const found = Object.values(R).some((block) => block && typeof block === 'object' && block.mixes && mixName in block.mixes);
          if (!found) problems.push(`${at}: mix '${mixName}' (via '${fs.mix}') exists in NO ruleset block — a renamed mix reaching a template as silence is the moved-key trap`);
        }
        for (const v of Object.values(fs)) {
          if (typeof v === 'function') problems.push(`${at}: a function inside the spec — templates are pure data`);
        }
      }
    }
    if (!spec.row || !Object.keys(spec.row).length) problems.push(`${where}: no row section — a template with no columns is not a template`);
  }
}

console.log(`row templates — ${templates} template(s) in '${project}'\n`);
if (problems.length) {
  console.log('❌ template violations:\n');
  for (const p of problems) console.log(`  ${p}`);
  process.exit(1);
}
console.log('✅ every template is single-tag pure data with safe keys and resolvable mixes');
