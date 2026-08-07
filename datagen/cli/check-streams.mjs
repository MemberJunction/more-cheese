#!/usr/bin/env node
// ONE DICE STREAM PER DECISION — the rule that had no checker.
//
// Streams are why the same seed reproduces the same world. Each decision draws from its own,
// named for it: rng(seed, `ticket:ICF-000101:2019`). Two decisions sharing one stream is the
// failure this catches, and it is invisible three ways over:
//
//   * nothing crashes — both decisions get numbers, in range, from a real generator;
//   * the data stays plausible, so no distribution gate fires;
//   * the two decisions become CORRELATED, which is the actual damage. A member who renews now
//     also always attends, because both read consecutive draws from one sequence.
//
// It is easy to hit by accident: stream keys are hand-built strings, and a new domain reaching for
// an obvious prefix ('renewal:', 'order:') has no way to know it is taken.
//
// Measured when this was written: 49,603 distinct streams, none requested from more than one call
// site. So this is a guard on a rule currently held perfectly, not a fix for a present bug — which
// is why it is negative-tested in the suite. A checker nobody has seen fire is decoration.
//
//   node cli/check-streams.mjs [--project morecheese] [--n 400] [--seed 42]
import { loadConfig, loadProject } from '../engine/config.mjs';
import { streamAudit, enableStreamAudit } from '../engine/rng.mjs';

enableStreamAudit(); // before buildWorld — the audit records only what it sees

const cfg = await loadConfig(process.argv.slice(2));
const { buildWorld } = await loadProject(cfg.project);
buildWorld(cfg);

const shared = [...streamAudit.entries()].filter(([, sites]) => sites.size > 1);
console.log(`dice streams — ${streamAudit.size.toLocaleString()} distinct keys in '${cfg.project}'\n`);
if (shared.length) {
  console.log(`❌ ${shared.length} stream key(s) requested from more than one call site:\n`);
  for (const [key, sites] of shared.slice(0, 12)) {
    console.log(`  ${key}`);
    for (const s of sites) console.log(`      ${s}`);
  }
  if (shared.length > 12) console.log(`  … and ${shared.length - 12} more`);
  console.log('\nGive each decision its own prefix. Two decisions on one stream are correlated, and');
  console.log('the data stays plausible while they are — no gate can see it.');
  process.exit(1);
}
console.log('✅ every dice stream belongs to exactly one decision');
