// CORE: the declarative pattern executor (FRAMEWORK.md rung 3, first cut).
//
// Three hand-written domains revealed that association-shaped generation is a small set of
// patterns around one universal move — score → calibrate → draw. This file is that move,
// packaged. A domain invokes a pattern with a declaration (targets, arrows, stream keys)
// plus small closures for its data shapes; the core owns the calibration mechanics.
//
// DETERMINISM CONTRACT: stream keys and per-item draw ORDER are part of the declaration,
// so re-expressing a hand-written module through a pattern reproduces the identical world
// byte-for-byte. That equality is the migration gate for every module that moves here.

import { rng, sigmoid, calibrateIntercept } from './rng.mjs';

/**
 * annualParticipation — per year: an eligible pool faces a calibrated yes/no; participants
 * spawn child rows. (Instances: course enrollment; conference attendance is next.)
 *
 * opts: {
 *   seed, years: [..],
 *   poolOf(year)        → eligible members for that year (empty/short pools are skipped)
 *   scoreOf(member, y)  → the member's arrow score
 *   target              → participation rate the cohort calibrates to
 *   streamKey(m, y)     → dice stream for this member-year decision
 *   spawn(r, member, y) → called ONLY for participants; does its own draws in declared order
 *   minPool?            → skip years with fewer eligible (default 5)
 * }
 */
export function annualParticipation(opts) {
  const out = [];
  for (const y of opts.years) {
    const pool = opts.poolOf(y);
    if (!pool || pool.length < (opts.minPool ?? 5)) continue;
    const scores = pool.map((p) => opts.scoreOf(p, y));
    const b0 = calibrateIntercept(scores, opts.target);
    pool.forEach((p, i) => {
      const r = rng(opts.seed, opts.streamKey(p, y));
      if (!r.bernoulli(sigmoid(b0 + scores[i]))) return;
      const spawned = opts.spawn(r, p, y);
      if (spawned) out.push(...(Array.isArray(spawned) ? spawned : [spawned]));
    });
  }
  return out;
}

/**
 * staticAssignment — pick a category from ordered rules over a context of drivers.
 * (Instance: membership tier from segment/affluence.) First matching rule wins; a rule
 * with no conditions is the default. Conditions: `when` (equalities) and `whenAbove`
 * (strict numeric >) — both ANDed. No dice: pure function of the context.
 */
export function staticAssignment(rules, ctx) {
  for (const rule of rules) {
    const eq = !rule.when || Object.entries(rule.when).every(([k, v]) => ctx[k] === v);
    const gt = !rule.whenAbove || Object.entries(rule.whenAbove).every(([k, v]) => ctx[k] > v);
    if (eq && gt) return rule.value;
  }
  throw new Error('staticAssignment: no rule matched and no default rule (a rule without conditions) was declared');
}

/**
 * recurringDecision — the richest pattern: per cycle, an eligible cohort faces a calibrated
 * yes/no with state consequences. (Instance: the renewal unroll.) Core owns the universal
 * mechanics — per-cohort calibration, post-calibration baseline shifts (texture/regime:
 * tide, not boats), PINNED entities (hero conditioning: outcomes are facts, not draws),
 * and the named dice. The domain owns eligibility, scoring inputs, state transitions,
 * and event recording.
 *
 * opts: {
 *   seed, years,
 *   cohortOf(y)             → items due to decide this cycle (may be empty)
 *   prepare(cohort, y)      → per-cohort context (e.g. tenure standardization stats)
 *   scoreOf(item, y, ctx)   → arrow score
 *   target                  → the rate the cohort calibrates to
 *   baselineShift(y)        → applied AFTER calibration (texture wobble + regime shifts)
 *   streamKey(item, y)      → dice stream for this decision
 *   isPinned(item)          → pinned entities always decide YES (conditioned, not drawn)
 *   record(item, y, ctx, decided) / onYes(item, y) / onNo(item, y)
 * }
 */
export function recurringDecision(opts) {
  for (const y of opts.years) {
    const cohort = opts.cohortOf(y);
    if (!cohort.length) continue;
    const ctx = opts.prepare ? opts.prepare(cohort, y) : undefined;
    const scores = cohort.map((c) => opts.scoreOf(c, y, ctx));
    const b0 = calibrateIntercept(scores, opts.target) + (opts.baselineShift?.(y) ?? 0);
    cohort.forEach((c, i) => {
      const r = rng(opts.seed, opts.streamKey(c, y));
      const decided = opts.isPinned?.(c) ? true : r.bernoulli(sigmoid(b0 + scores[i]));
      opts.record?.(c, y, ctx, decided);
      if (decided) opts.onYes(c, y); else opts.onNo(c, y);
    });
  }
}

/**
 * derivedTransaction — per parent fact: a child transaction with DECLARED timing.
 * (Instance: the money chain — dues payments, event checkout.) Core owns the named dice
 * and the timing-mixture interpreter; the domain owns row shapes and which declared
 * profile applies to which parent.
 *
 * A timing PROFILE (authored in the ruleset) declares:
 *   method: "X"  (fixed, no draw)  |  methods: [..] (uniform pick — one draw)
 *   lateShare    → bernoulli branch between the two offset distributions
 *   late/onTime  → day-offset relative to the due date:
 *     { dist: "const", days }                                  (no draw)
 *     { dist: "uniformDays", min, max, sign? }                 (sign −1 = early)
 *     { dist: "lognormalDays", medianDays, sigma, minDays?, capDays? }
 *   termsDays?   → due date = anchor + termsDays (net-terms billing)
 *
 * DRAW ORDER PER PARENT (part of the contract — byte-identity depends on it):
 * method pick (if `methods`), then the lateShare bernoulli, then the chosen offset draw.
 *
 * opts: {
 *   seed, parents,
 *   profileOf(parent)  → a declared profile, or null/undefined to skip the parent
 *   streamKey(parent)  → dice stream for this transaction
 *   emit(parent, { method, late, offsetDays, termsDays }, r) → domain pushes its rows
 * }
 */
export function derivedTransaction(opts) {
  for (const parent of opts.parents) {
    const profile = opts.profileOf(parent);
    if (!profile) continue;
    const r = rng(opts.seed, opts.streamKey(parent));
    const method = profile.methods ? r.pick(profile.methods) : (profile.method ?? null);
    const late = r.bernoulli(profile.lateShare ?? 0);
    const offsetDays = drawOffsetDays(r, late ? profile.late : profile.onTime);
    opts.emit(parent, { method, late, offsetDays, termsDays: profile.termsDays ?? 0 }, r);
  }
}

function drawOffsetDays(r, spec) {
  switch (spec.dist) {
    case 'const':
      return spec.days ?? 0;
    case 'uniformDays':
      return (spec.sign ?? 1) * r.int(spec.min, spec.max);
    case 'lognormalDays': {
      const raw = Math.round(r.lognormal(Math.log(spec.medianDays), spec.sigma));
      return Math.min(spec.capDays ?? Infinity, Math.max(spec.minDays ?? 1, raw));
    }
    default:
      throw new Error(`derivedTransaction: unknown offset dist '${spec.dist}'`);
  }
}

/**
 * childOutcome — per existing row: a calibrated outcome. (Instances: course completion;
 * no-show is next.) The calibration runs over the ACTUAL item pool — the selection-effect
 * lesson (spec §7 lesson #1) is built into the pattern.
 *
 * opts: {
 *   seed, items,
 *   scoreOf(item)       → arrow score
 *   target              → outcome rate over the pool
 *   streamKey(item)     → dice stream per item
 *   decide(item, p, r)  → applies the outcome; receives the calibrated probability and the
 *                         item's dice (branching/extra draws are the domain's, in its order)
 * }
 */
export function childOutcome(opts) {
  const scores = opts.items.map((e) => opts.scoreOf(e));
  const b0 = calibrateIntercept(scores, opts.target);
  opts.items.forEach((e, i) => {
    const r = rng(opts.seed, opts.streamKey(e));
    opts.decide(e, sigmoid(b0 + scores[i]), r);
  });
  return opts.items;
}
