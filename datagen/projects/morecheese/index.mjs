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
import { buildCommittees } from './committees.mjs';
import { buildForms } from './forms.mjs';

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

  // composed bizapps slices: committees (governance) + forms (the D10 optional survey pack)
  const committees = buildCommittees(cfg, people, periods);
  const forms = buildForms(cfg, people, events, registrations);

  return { people, orgs, periods, events, registrations, renewalEvents, money, learning, committees, forms };
}

/** The pack map (D9: cook once, portion last) — the project owns what ships where. */
export function buildPacks(world) {
  const { people, orgs, periods, events, registrations, money, learning, committees, forms } = world;
  const strip = (rows, keys) => rows.map((r) => { const c = { ...r }; for (const k of keys) delete c[k]; return c; });
  return {
    common: { dependsOn: [], tables: { people: strip(people, ['_theta', '_thetaPath', '_phi', '_hero', '_lapseYear', 'CycleType', 'AutoRenew', 'MembershipTier']), organizations: orgs } },
    membership: { dependsOn: ['common'], tables: { membership_periods: periods } },
    events: { dependsOn: ['common', 'membership'], tables: { events, event_registrations: strip(registrations, ['_class', '_theta']) } },
    learning: { dependsOn: ['common', 'membership'], tables: { courses: learning.courses, enrollments: strip(learning.enrollments, ['_theta', '_endBase', '_weeks']) } },
    orders: { dependsOn: ['common', 'membership', 'events'], tables: { products: money.products, orders: money.orders, order_lines: money.orderLines, payments: money.payments } },
    committees: { dependsOn: ['common', 'membership'], tables: { committee_types: committees.types, committee_roles: committees.roles, committees: committees.committees, committee_terms: committees.terms, committee_memberships: committees.memberships, committee_meetings: committees.meetings, committee_attendance: committees.attendance } },
    forms: { dependsOn: ['common', 'events'], tables: { forms: forms.forms, form_versions: forms.formVersions, form_pages: forms.formPages, form_questions: forms.formQuestions, form_distributions: forms.formDistributions, form_responses: forms.formResponses, form_answers: forms.formAnswers } },
  };
}
