// The MoreCheese domain hooks: everything the domain-blind core needs to know about THIS
// application. A second domain (accounting, forms, …) supplies its own version of this
// file — that's the framework contract (FRAMEWORK.md rung 2).

import { parseDate } from '../../engine/dates.mjs';
import { buildOrgs, buildPeople } from './world.mjs';
import { runRenewalUnroll } from './membership.mjs';

export const morecheeseHooks = {
  compile: {
    // the arrows the compiler solves, and the target they negotiate with
    arrowsOf: (C) => C.membership.effects,
    overallTarget: (C) => C.membership.params.renewal.target,

    // arrow name → synthetic-population feature
    features: {
      'renewal.tenure': 'tenureZ',
      'renewal.engagement': 'theta',
      'renewal.autoRenew': 'autoRenew',
      'renewal.employerEvent': 'employerEvent',
      'renewal.enthusiastTier': 'enthusiast',
    },

    // the solver's world model — draw order is part of the determinism contract
    syntheticPop(C, r, n) {
      const arrows = C.membership.effects;
      const effAutoShare = C.cohorts.anniversaryShare * 0.8 + (1 - C.cohorts.anniversaryShare) * (C.cohorts.autoRenewShare * 0.5);
      return Array.from({ length: n }, () => ({
        theta: r.normal(), tenureZ: r.normal(),
        autoRenew: r.bernoulli(effAutoShare) ? 1 : 0,
        employerEvent: r.bernoulli(0.03) ? 1 : 0,
        enthusiast: r.bernoulli(arrows['renewal.enthusiastTier']?.share ?? 0.15) ? 1 : 0,
      }));
    },

    // empirical refinement: run the REAL renewal machinery on a fixed reference world and
    // measure the human-form arrows' group rates the way the validator will
    refineMeasure(C) {
      const cfg = { seed: 'compile-refine', n: 3000, release: parseDate('2026-12-31'), releaseYear: 2026, R: C };
      const orgs = buildOrgs(cfg);
      const ppl = buildPeople(cfg, { orgs });
      const { renewalEvents } = runRenewalUnroll(cfg, { people: ppl, orgs });
      const rate = (rows) => rows.reduce((s, e) => s + e.renewed, 0) / rows.length;
      return {
        'renewal.enthusiastTier': { group: rate(renewalEvents.filter((e) => e.enthusiastTier)), rest: rate(renewalEvents.filter((e) => !e.enthusiastTier)) },
        'renewal.autoRenew': { group: rate(renewalEvents.filter((e) => e.autoRenew)), rest: rate(renewalEvents.filter((e) => !e.autoRenew)) },
      };
    },
  },

  // domain-specific ruleset lint (core lint handles arrows/overlays/holdouts generically)
  domainLint(R) {
    const problems = [];
    if (R.membership?.tiers) {
      for (const t of R.membership.catalog.tiers ?? []) {
        if (!t.name || typeof t.dues !== 'number') problems.push(`membership.tiers: entry ${JSON.stringify(t)} needs name + numeric dues`);
      }
    }
    // (A hardcoded "does this target have a tolerance" list used to live here. It is gone:
    // every target in the ruleset is now a { target, tolerance } pair, so the generic lint
    // recognises them by SHAPE and covers modules that don't exist yet.)
    // CROSS-REFERENCES: authored names must point at things that exist. A typo'd committee
    // or certification key on a hero doesn't error anywhere — the seat or credential just
    // silently never materialises, and a pinned demo fact quietly vanishes.
    {
      const committees = new Set((R.committees?.catalog?.committees ?? []).map((c) => c.name));
      const certs = new Set((R.programs?.catalog?.certifications ?? []).map((c) => c.key));
      for (const h of R.heroes ?? []) {
        for (const seat of h.committees ?? []) {
          if (!committees.has(seat.committee)) problems.push(`heroes.${h.memberNumber}: committee "${seat.committee}" is not in committees.catalog.committees`);
        }
        const declared = h.certifications ?? (h.certification ? [h.certification] : []);
        for (const d of declared) {
          if (!certs.has(d.key)) problems.push(`heroes.${h.memberNumber}: certification "${d.key}" is not in programs.catalog.certifications`);
        }
      }
      // a credential ladder rung must stand on a rung that exists
      for (const c of R.programs?.catalog?.certifications ?? []) {
        if (c.prerequisite && !certs.has(c.prerequisite)) problems.push(`programs.catalog.certifications.${c.key}: prerequisite "${c.prerequisite}" is not in the catalog`);
      }
    }
    return problems;
  },
};
