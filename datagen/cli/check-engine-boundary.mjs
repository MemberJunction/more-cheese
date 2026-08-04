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
//   node cli/check-engine-boundary.mjs
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const ENGINE = join(ROOT, 'engine');
const projects = readdirSync(join(ROOT, 'projects'), { withFileTypes: true })
  .filter((d) => d.isDirectory()).map((d) => d.name);

// The ONE name the engine is allowed to know: the default project for a bare CLI invocation.
// It is a convenience default, not a dependency — every entry point accepts --project.
const ALLOWED = [{ file: 'config.mjs', needle: 'DEFAULT_PROJECT', why: 'the default for a bare CLI call; every entry point accepts --project' }];

const hard = [];
const files = readdirSync(ENGINE).filter((f) => f.endsWith('.mjs'));

for (const f of files) {
  const src = readFileSync(join(ENGINE, f), 'utf8');
  const lines = src.split('\n');

  lines.forEach((line, i) => {
    const at = `engine/${f}:${i + 1}`;
    const code = line.replace(/\/\/.*$/, '');        // comments may DISCUSS projects/ freely
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

console.log(`engine boundary — ${files.length} engine modules, ${projects.length} project(s) present\n`);
if (hard.length) {
  console.log('❌ boundary violations:\n');
  for (const h of hard) console.log(`  ${h}`);
  process.exit(1);
}
console.log('✅ the engine names no project in code and statically imports none');
console.log('   (projects load dynamically by name; each declares its own UUID_NAMESPACE)');
