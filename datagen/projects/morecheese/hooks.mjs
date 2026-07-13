// The MoreCheese domain hooks: everything the domain-blind core needs to know about THIS
// application. A second domain (accounting, forms, …) supplies its own version of this
// file — that's the framework contract (FRAMEWORK.md rung 2).

import { parseDate } from '../../core/dates.mjs';
import { buildOrgs, buildPeople } from './world.mjs';
import { runRenewalUnroll } from './membership.mjs';

export const morecheeseHooks = {
  compile: {
    // the arrows the compiler solves, and the target they negotiate with
    arrowsOf: (C) => C.membership.arrows,
    overallTarget: (C) => C.membership.renewalTarget,

    // arrow name → synthetic-population feature
    features: { tenure: 'tenureZ', engagement: 'theta', autoRenew: 'autoRenew', employerEvent: 'employerEvent', enthusiastTier: 'enthusiast' },

    // the solver's world model — draw order is part of the determinism contract
    syntheticPop(C, r, n) {
      const arrows = C.membership.arrows;
      const effAutoShare = C.cohorts.anniversaryShare * 0.8 + (1 - C.cohorts.anniversaryShare) * (C.cohorts.autoRenewShare * 0.5);
      return Array.from({ length: n }, () => ({
        theta: r.normal(), tenureZ: r.normal(),
        autoRenew: r.bernoulli(effAutoShare) ? 1 : 0,
        employerEvent: r.bernoulli(0.03) ? 1 : 0,
        enthusiast: r.bernoulli(arrows.enthusiastTier?.share ?? 0.15) ? 1 : 0,
      }));
    },

    // empirical refinement: run the REAL renewal machinery on a fixed reference world and
    // measure the human-form arrows' group rates the way the validator will
    refineMeasure(C) {
      const cfg = { seed: 'compile-refine', n: 3000, release: parseDate('2026-12-31'), releaseYear: 2026, R: C };
      const orgs = buildOrgs(cfg);
      const ppl = buildPeople(cfg, orgs);
      const { renewalEvents } = runRenewalUnroll(cfg, ppl, orgs);
      const rate = (rows) => rows.reduce((s, e) => s + e.renewed, 0) / rows.length;
      return {
        enthusiastTier: { group: rate(renewalEvents.filter((e) => e.enthusiastTier)), rest: rate(renewalEvents.filter((e) => !e.enthusiastTier)) },
        autoRenew: { group: rate(renewalEvents.filter((e) => e.autoRenew)), rest: rate(renewalEvents.filter((e) => !e.autoRenew)) },
      };
    },
  },

  // domain-specific ruleset lint (core lint handles arrows/overlays/holdouts generically)
  domainLint(R) {
    const problems = [];
    if (R.membership?.tiers) {
      for (const t of R.membership.tiers.list ?? []) {
        if (!t.name || typeof t.dues !== 'number') problems.push(`membership.tiers: entry ${JSON.stringify(t)} needs name + numeric dues`);
      }
    }
    for (const [path, v] of [
      ['membership.renewalTolerance', R.membership?.renewalTolerance],
      ['learning.participation.tolerance', R.learning?.participation?.tolerance],
      ['learning.completion.tolerance', R.learning?.completion?.tolerance],
    ]) {
      if (v == null) problems.push(`${path}: missing tolerance — the validator can't gate a target without one`);
    }
    return problems;
  },
};
