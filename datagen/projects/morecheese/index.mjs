// The MoreCheese PROJECT — one generated universe (fake International Cheese Federation).
//
// A project is everything the engine must NOT know: the domain modules, the compile/lint
// hooks, the name banks, and the ruleset (projects/morecheese/ruleset/). The engine calls
// exactly two exports: `hooks` (compile feature map, refinement measure, lint, pack map)
// and `buildWorld(cfg)` (the pipeline, in ruleset-spec §5 order). A second project = a
// second directory shaped like this one — zero engine changes (FRAMEWORK.md's test).

import { buildOrgs, buildPeople } from './world.mjs';
import { runRenewalUnroll, applyArchiveRule } from './membership.mjs';
import { buildEvents, buildRegistrations } from './events.mjs';
import { buildMoney } from './money.mjs';
import { buildLearning } from './learning.mjs';

export { morecheeseHooks as hooks } from './hooks.mjs';

export function buildWorld(cfg) {
  // §5.1–2: the world and its drivers
  const orgs = buildOrgs(cfg);
  let people = buildPeople(cfg, orgs); // note: appends hero employers to orgs

  // §5.3: membership — the renewal unroll, then archive old lapsed records
  const { periods: allPeriods, renewalEvents } = runRenewalUnroll(cfg, people, orgs);
  const archived = applyArchiveRule(cfg, people, allPeriods);
  people = archived.people;
  const periods = archived.periods;

  // §5.4: events + registrations (only ever inside valid membership windows)
  const events = buildEvents(cfg);
  const registrations = buildRegistrations(cfg, people, periods, events);

  // §5.4b: learning — same pattern, third domain
  const learning = buildLearning(cfg, people, periods);

  // §5.5: the money chain — one order per billable fact, timing per declared paymentProfiles
  const money = buildMoney(cfg, people, periods, events, registrations);

  return { people, orgs, periods, events, registrations, renewalEvents, money, learning };
}
