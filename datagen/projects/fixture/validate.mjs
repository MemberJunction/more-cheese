#!/usr/bin/env node
// THE FIXTURE'S OWN VALIDATOR — proof that a project can own its validation without the engine
// holding it.
//
// cli/validate.mjs is 1,600 lines of MoreCheese sitting in engine space, and it sits there because
// cli/build.mjs used to resolve validators only against cli/. A project could DECLARE a validator
// and not own one. This file is the same arrangement done correctly: it lives in the project, it is
// declared by the project, and it calls the ENGINE's generic runner for everything derivable.
//
// The pattern any second project should copy:
//   1. run every gate that derives from declarations (references, install order, presence, targets)
//   2. add only what a declaration cannot state
//
//   node projects/fixture/validate.mjs --out out-fixture
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { runDerivedChecks } from '../../engine/derived-checks.mjs';
import { loadRuleset } from '../../engine/config.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..', '..');
const args = Object.fromEntries(process.argv.slice(2).map((a, i, all) => (a.startsWith('--') ? [a.slice(2), all[i + 1]] : null)).filter(Boolean));
const OUT = join(ROOT, args.out ?? 'out-fixture');
const load = (pack, table) => JSON.parse(readFileSync(join(OUT, 'packs', pack, `${table}.json`), 'utf8'));
const PACK_NAMES = readdirSync(join(OUT, 'packs'), { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name);
const run = JSON.parse(readFileSync(join(OUT, 'run.json'), 'utf8'));
const R = await loadRuleset(run.scenario, 'fixture');

let failures = 0;
const check = (name, ok, detail) => {
  console.log(`${ok ? '✅' : '❌'} ${name}${detail ? `  — ${detail}` : ''}`);
  if (!ok) failures++;
};

// 1. everything derivable, from the engine
const ctx = { project: 'fixture', R, load, check, packs: PACK_NAMES, run };
const ref = await runDerivedChecks(ctx, 'referential');
if (!failures) await runDerivedChecks(ctx, 'final');
else console.log('✋ referential gates failed — target gates not run (they would measure a broken world)');

// 2. THE BESPOKE GATE — what no declaration can state. A reference edge says the member exists; a
// target band says how many went. Neither can say a member cannot attend before they joined.
const members = new Map(load('circle', 'members').map((m) => [m.MemberNumber, m]));
const early = load('circle', 'outings').filter((o) => o.Year < members.get(o.MemberNumber).JoinYear);
check('no outing predates its member\'s join year', early.length === 0,
  early.length ? `${early.length} impossible outings, e.g. ${early[0].OutingKey}` : `${members.size} members`);

console.log(`\n${failures ? `✋ ${failures} gate(s) failed` : `all gates pass  [${ref.kinds.join(', ')}, + 1 bespoke]`}`);
process.exit(failures ? 1 : 0);
