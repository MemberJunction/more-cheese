#!/usr/bin/env node
// SCAFFOLD A DOMAIN — the answer to the blank page.
//
// Writing a generator is real programming and did not get shorter (measured: only 30 of 185
// row-shaping sites were mechanical). What DOES cost time is recalling a dozen conventions before
// you can write the first useful line: the export shape, which cfg fields to destructure, the
// alias convention, the pattern option bags, how to name a dice stream, which fields to strip, what
// to return, and where to wire it in.
//
// I wrote two new domains today, having written the documentation myself, and still had to open
// existing modules to remember all of it. That is the thing to fix — not the line count.
//
// This emits a ruleset block and a generator that RUN AS WRITTEN, with the conventions already
// correct and TODOs where judgement is needed. Because it is generated from one template, the
// conventions cannot drift from the docs the way a copied file does.
//
//   node cli/new-domain.mjs speakers [--project morecheese]
import { writeFileSync, existsSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const argv = process.argv.slice(2);
const name = argv.find((a) => !a.startsWith('--'));
const project = argvProject(process.argv);

if (!name || !/^[a-z][a-zA-Z]*$/.test(name)) {
  console.log('usage: node cli/new-domain.mjs <domainName> [--project morecheese]');
  console.log('       domainName is lowerCamelCase, singular-or-plural as reads best: speakers, sponsorship');
  process.exit(1);
}
const Cap = name[0].toUpperCase() + name.slice(1);
const DIR = join(ROOT, 'projects', project);
const rulesetPath = join(DIR, 'ruleset/modules', `${name}.mjs`);
const generatorPath = join(DIR, `${name}.mjs`);
for (const p of [rulesetPath, generatorPath]) {
  if (existsSync(p)) { console.log(`refusing to overwrite ${p}`); process.exit(1); }
}

// ---------------------------------------------------------------- the ruleset block
writeFileSync(rulesetPath, `// ${name.toUpperCase()} — TODO: one line on what this domain is.
//
// Decisions (write these BEFORE the numbers — see datagen/ADDING-A-DOMAIN.md step 1):
//   1. TODO                                    → annualParticipation
//   2. TODO                                    → childOutcome
//
// ─── THE SHAPE ─────────────────────────────────────────────────────────────────────────────
//   catalog   things that exist      lists
//   params    every scalar           a { target, tolerance } pair means a check ENFORCES it
//   effects   who differs            <decision>.<driver>, each with a magnitude and a reason
//   mixes     weighted options       one dice roll each
//
// Delete the parts this domain does not need. See datagen/CONTRACT.md.
//
// Values only — no clock, no randomness, no I/O, no functions. cli/check-ruleset.mjs enforces it.

export default {
  ${name}: {
    catalog: {
      // TODO: the things. Lists of authored records.
      kinds: [
        { key: 'first', name: 'First kind' },
        { key: 'second', name: 'Second kind' },
      ],
    },

    params: {
      // A pair means a check enforces it — the build FAILS until you add a measurement in
      // projects/${project}/measurements.mjs. A bare number is used but unchecked.
      participation: { target: 0.2, tolerance: 0.05 },

      // TODO: your other scalars. Every one wants a comment saying why THIS value.
      perParticipantMax: 2,
    },

    effects: {
      // WRITE \`beta\`, NOT \`liftPts\`. The human forms are only solved for the block the
      // calibration machinery points at (membership). Anywhere else they stay undefined, which
      // makes every draw false and generates ZERO ROWS. The build now stops and says so, but do
      // not spend the afternoon finding that out.
      '${name}.engagement': {
        beta: 0.5,
        label: 'med',
        note: 'TODO: why this effect exists at all, and why this size relative to its siblings',
        evidence: 'ESTIMATE — TODO: say what you calibrated against, or that you guessed',
      },
    },

    mixes: {
      // Object maps, positive weights, need not sum to 1. Every option is REQUIRED to appear in
      // the data once you declare where it lands (projects/${project}/presence.mjs).
      kind: { first: 0.6, second: 0.4 },
    },
  },
};
`);

// ---------------------------------------------------------------- the generator
writeFileSync(generatorPath, `// ${Cap} — TODO: one line on what this generates.
//
// Scaffolded by cli/new-domain.mjs. One pattern call per decision, in causal order.

import { rng } from '../../engine/rng.mjs';
import { annualParticipation, childOutcome } from '../../engine/patterns.mjs';
import { yearsOf, thetaAt, coverageOf, stripInternals } from '../../engine/authoring.mjs';
import { iso, addDays, parseDate } from '../../engine/dates.mjs';
import { uuidFor } from '../../engine/ids.mjs';
import { argvProject } from '../engine/config.mjs';

/**
 * @param {import('../../engine/types.js').Config} cfg
 * @param {{ people: any[], periods: any[] }} deps — ALWAYS an object. Positional dependency
 *        lists are how two same-typed arrays get transposed into silently wrong data.
 */
export function build${Cap}(cfg, { people, periods }) {
  // ── inputs ──
  const { R, seed, release } = cfg;
  const D = R.${name};
  const P = D.params;                       // every scalar behind one alias
  const years = yearsOf(cfg);
  const covered = coverageOf(periods);      // indexed: (memberNumber, dateIso) => boolean

  // ── decisions ──
  // decision 1: who takes part, per year
  // target is PER YEAR — the share of THAT year's eligible pool. Not a lifetime share.
  const rows = annualParticipation({
    seed,
    years,
    poolOf: (y) => people.filter((p) => !p._dup && covered(p.MemberNumber, \`\${y}-07-01\`)),
    scoreOf: (p, y) => D.effects['${name}.engagement'].beta * thetaAt(p, y),   // how engaged, that year
    target: P.participation.target,
    // one stream per decision, named for it. NEVER reorder draws inside a stream:
    // adding one in the middle re-rolls everything after it.
    streamKey: (p, y) => \`${name}:\${p.MemberNumber}:\${y}\`,
    spawn: (r, p, y) => {
      const out = [];
      const count = 1 + (r.bernoulli(0.25) ? 1 : 0);
      for (let k = 0; k < Math.min(count, P.perParticipantMax); k++) {
        const key = \`\${p.MemberNumber}:\${y}:\${k}\`;
        out.push({
          ${Cap}Key: key,
          ${Cap}ID: uuidFor('${name}', key),
          MemberNumber: p.MemberNumber,
          KindKey: r.pickWeighted(Object.entries(D.mixes.kind)),
          // TODO: the columns this row actually needs
          IsSharedDemo: true,
          _person: p,                        // internal: stripped before the rows ship
        });
      }
      return out;
    },
  });

  // ---------- decision 2: an outcome per row (delete if this domain has none) ----------
  // TODO: declare a target for this in the ruleset, or remove the block.
  // childOutcome({
  //   seed, items: rows,
  //   scoreOf: (x) => 0,
  //   target: P.someOutcome.target,
  //   streamKey: (x) => \`${name}-outcome:\${x.${name}Key}\`,
  //   decide: (x, prob, r) => { x.Status = r.bernoulli(prob) ? 'Done' : 'NotDone'; },
  // });

  // ── shape ──
  stripInternals(rows);
  return { ${name}: rows };
}
`);

console.log(`→ ${rulesetPath.replace(ROOT + '/', '')}`);
console.log(`→ ${generatorPath.replace(ROOT + '/', '')}`);
console.log(`
Three wiring steps, then it runs:

  1. add '${name}' to projects/${project}/ruleset/modules/index.json
  2. in projects/${project}/index.mjs:
       import { build${Cap} } from './${name}.mjs';
       const ${name} = build${Cap}(cfg, { people, periods });   // deps are ONE OBJECT — the contract
       …return { …, ${name} };
       …and a pack entry, one table per line:
           ${name}: {
             dependsOn: ['common'],          // checked against refs.mjs, so it must be true
             tables: { ${name}: ${name}.${name} },
           },
       Forget the pack entry and the build now STOPS: rows that ship nowhere used to be
       invisible — a green build and no data.
  3. node cli/build.mjs --n 500 --seed 42 --release 2026-07-31

Then the declarations, which is what earns you checks (all optional, each pays):

  projects/${project}/measurements.mjs  how to measure ${name}.params.participation
                                        — the build FAILS until this exists
  projects/${project}/presence.mjs      where ${name}.mixes.kind lands, so every option
                                        is required to actually appear
  projects/${project}/refs.mjs          ${name}.MemberNumber → common.people.MemberNumber
  projects/${project}/pipeline.mjs      only if your stage MUTATES something a later one reads

The order matters and is explained in datagen/ADDING-A-DOMAIN.md.`);
