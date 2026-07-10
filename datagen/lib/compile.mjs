// The ruleset compiler: humans (and the workshop) author effects in HUMAN units;
// this translates them into the β the math needs. Three authoring vocabularies:
//
//   "beta": 0.55                      — expert form: log-odds per 1 SD (used as-is)
//   "strength": "med", "sign": "+"   — qualitative form: band midpoint (spec §2 bands)
//   "liftPts": 12                     — human form: "+12 percentage points vs the others"
//   "groupTarget": 0.65               — human form: "this group lands at 65%"
//
// The human forms are SOLVED, not guessed: we simulate a synthetic population with the
// same latent structure, and bisect the β until the group difference (or group level)
// comes out right AFTER the calibrator re-levels the baseline — the exact negotiation
// that made hand-sizing painful (β −1.4 gave 76%, not 65%, because the solver lifts
// everyone to hold the overall target). Deterministic: fixed compile seed.

import { rng, sigmoid, calibrateIntercept, logit } from './rng.mjs';
import { buildOrgs, buildPeople } from './world.mjs';
import { runRenewalUnroll } from './membership.mjs';
import { parseDate } from './dates.mjs';

const BAND_MIDPOINT = { weak: 0.28, med: 0.65, strong: 1.35 };

// which population feature each membership arrow reads (the solver's world model)
const FEATURE = { tenure: 'tenureZ', engagement: 'theta', autoRenew: 'autoRenew', employerEvent: 'employerEvent', enthusiastTier: 'enthusiast' };

export function compileRuleset(R) {
  const C = structuredClone(R);
  const arrows = C.membership.arrows;

  // pass 1: direct forms
  for (const a of Object.values(arrows)) {
    if (a.beta != null) { a.compiledFrom = 'beta (authored directly)'; continue; }
    if (a.logitShift != null) { a.compiledFrom = 'logitShift (regime gate)'; continue; }
    if (a.strength) { a.beta = (a.sign === '-' ? -1 : 1) * BAND_MIDPOINT[a.strength]; a.compiledFrom = `strength:${a.strength} → band midpoint`; }
  }

  // synthetic population mirroring the generator's latent structure (seeded — deterministic)
  const effAutoShare = C.cohorts.anniversaryShare * 0.8 + (1 - C.cohorts.anniversaryShare) * (C.cohorts.autoRenewShare * 0.5);
  const r = rng('compile', 'population');
  const N = 20000;
  const pop = Array.from({ length: N }, () => ({
    theta: r.normal(), tenureZ: r.normal(),
    autoRenew: r.bernoulli(effAutoShare) ? 1 : 0,
    employerEvent: r.bernoulli(0.03) ? 1 : 0,
    enthusiast: r.bernoulli(arrows.enthusiastTier?.share ?? 0.15) ? 1 : 0,
  }));
  const target = C.membership.renewalTarget;
  const scoreOf = (p, betas) => Object.entries(FEATURE).reduce((s, [k, f]) => s + (betas[k] ?? 0) * p[f], 0);

  // weighted calibration (weights = probability the member is still around)
  const calibrateWeighted = (scores, w, t) => {
    let lo = -12, hi = 12;
    for (let i = 0; i < 50; i++) {
      const mid = (lo + hi) / 2;
      let m = 0, wsum = 0;
      for (let j = 0; j < scores.length; j++) { m += w[j] * sigmoid(mid + scores[j]); wsum += w[j]; }
      if (m / wsum < t) lo = mid; else hi = mid;
    }
    return (lo + hi) / 2;
  };

  // measure group rates the way the VALIDATOR does: over multi-year renewal DECISIONS with
  // survivor selection (non-renewers drop out, so later cohorts skew high-θ). A one-shot
  // population undershoots group gaps by ~7pt — this expectation-based 6-round survival
  // simulation closes that gap.
  const evalGroups = (betas, f) => {
    const scores = pop.map((p) => scoreOf(p, betas));
    const w = new Float64Array(N).fill(1);
    let g = 0, gn = 0, rest = 0, rn = 0;
    for (let round = 0; round < 6; round++) {
      const b0 = calibrateWeighted(scores, w, target);
      for (let j = 0; j < N; j++) {
        const pr = sigmoid(b0 + scores[j]);
        if (pop[j][f]) { g += w[j] * pr; gn += w[j]; } else { rest += w[j] * pr; rn += w[j]; }
        w[j] *= pr; // survival: this member's weight in future cohorts
      }
    }
    return { group: g / gn, rest: rest / rn };
  };

  // pass 2: solve the human forms (two sweeps so solved arrows see each other)
  for (let sweep = 0; sweep < 2; sweep++) {
    for (const [k, a] of Object.entries(arrows)) {
      if (a.liftPts == null && a.groupTarget == null) continue;
      const f = FEATURE[k];
      let lo = -6, hi = 6;
      for (let i = 0; i < 30; i++) {
        const mid = (lo + hi) / 2;
        const betas = Object.fromEntries(Object.entries(arrows).map(([k2, a2]) => [k2, k2 === k ? mid : (a2.beta ?? 0)]));
        const { group, rest } = evalGroups(betas, f);
        const got = a.groupTarget != null ? group : group - rest;
        const want = a.groupTarget != null ? a.groupTarget : a.liftPts / 100;
        if (got < want) lo = mid; else hi = mid;
      }
      a.beta = +(((lo + hi) / 2).toFixed(3));
      a.compiledFrom = a.groupTarget != null ? `solved from groupTarget ${a.groupTarget}` : `solved from liftPts +${a.liftPts}`;
    }
  }

  // pass 3: EMPIRICAL REFINEMENT — the analytic solve can't see the generator's full
  // dynamics (tenure evolves, enthusiasts churn early so their decision pool skews
  // low-tenure, COVID years drag). So: run the real renewal unroll on a fixed reference
  // world, measure the group rates the way the validator will, and nudge each solved β by
  // the logit gap. Deterministic (fixed refine seed/date), independent of run args — so
  // compiled βs are stable across releases.
  const refineCfg = () => ({ seed: 'compile-refine', n: 3000, release: parseDate('2026-12-31'), releaseYear: 2026, R: C });
  const measure = () => {
    const cfg = refineCfg();
    const orgs = buildOrgs(cfg);
    const ppl = buildPeople(cfg, orgs);
    const { renewalEvents } = runRenewalUnroll(cfg, ppl, orgs);
    const rate = (rows) => rows.reduce((s, e) => s + e.renewed, 0) / rows.length;
    return {
      enthusiastTier: { group: rate(renewalEvents.filter((e) => e.enthusiast)), rest: rate(renewalEvents.filter((e) => !e.enthusiast)) },
      autoRenew: { group: rate(renewalEvents.filter((e) => e.autoRenew)), rest: rate(renewalEvents.filter((e) => !e.autoRenew)) },
    };
  };
  const solved = Object.entries(arrows).filter(([, a]) => a.liftPts != null || a.groupTarget != null);
  for (let iter = 0; iter < 4 && solved.length; iter++) {
    const m = measure();
    let worst = 0;
    for (const [k, a] of solved) {
      const got = a.groupTarget != null ? m[k].group : m[k].group - m[k].rest;
      const want = a.groupTarget != null ? a.groupTarget : a.liftPts / 100;
      const err = want - got;
      worst = Math.max(worst, Math.abs(err));
      if (a.groupTarget != null) a.beta = +((a.beta + 0.8 * (logit(clamp01(want)) - logit(clamp01(got)))).toFixed(3));
      else a.beta = +((a.beta + 0.8 * err / 0.10).toFixed(3)); // ~0.10 rate-per-logit near the ceiling
    }
    if (worst < 0.015) break; // within 1.5pt — good enough; the validator gates the rest
  }
  for (const [, a] of solved) a.compiledFrom += ' + empirical refinement (spec: author → measure → adjust, automated)';
  return C;
}

const clamp01 = (x) => Math.min(0.995, Math.max(0.005, x));

/** Human-units rendering of a compiled arrow: percentage-point effect at the calibrated baseline. */
export function describeEffectPts(C, key) {
  const arrows = C.membership.arrows;
  const a = arrows[key];
  if (a.beta == null) return null;
  const r = rng('compile', 'describe');
  const pop = Array.from({ length: 8000 }, () => ({
    theta: r.normal(), tenureZ: r.normal(),
    autoRenew: r.bernoulli(0.345) ? 1 : 0, employerEvent: r.bernoulli(0.03) ? 1 : 0,
    enthusiast: r.bernoulli(arrows.enthusiastTier?.share ?? 0.15) ? 1 : 0,
  }));
  const betas = Object.fromEntries(Object.entries(arrows).map(([k2, a2]) => [k2, a2.beta ?? 0]));
  const scores = pop.map((p) => Object.entries(FEATURE).reduce((s, [k, f]) => s + betas[k] * p[f], 0));
  const b0 = calibrateIntercept(scores, C.membership.renewalTarget);
  const f = FEATURE[key];
  const binary = ['autoRenew', 'employerEvent', 'enthusiastTier'].includes(key);
  if (binary) {
    let g = 0, gn = 0, rest = 0, rn = 0;
    pop.forEach((p, j) => { const pr = sigmoid(b0 + scores[j]); if (p[f]) { g += pr; gn++; } else { rest += pr; rn++; } });
    return { kind: 'group', pts: (g / gn - rest / rn) * 100, groupRate: (g / gn) * 100 };
  }
  // continuous: effect of +1 SD
  let base = 0, up = 0;
  pop.forEach((p, j) => { base += sigmoid(b0 + scores[j]); up += sigmoid(b0 + scores[j] + betas[key]); });
  return { kind: 'perSD', pts: ((up - base) / pop.length) * 100 };
}
