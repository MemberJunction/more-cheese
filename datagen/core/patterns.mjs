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
