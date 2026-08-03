// CORE: the ruleset compiler — humans author effects in HUMAN units; this solves the β.
//
//   "beta": 0.55                      — expert form (used as-is)
//   "strength": "med", "sign": "+"   — qualitative form: band midpoint (spec §2 bands)
//   "liftPts": 12                     — human form: "+12 points vs the others"
//   "groupTarget": 0.65               — human form: "this group lands at 65%"
//
// Human forms are SOLVED against the calibrated baseline (analytic survival-weighted pass),
// then EMPIRICALLY REFINED by running the real generator and nudging until the stated effect
// is what the data measurably shows. Deterministic: fixed compile seed.
//
// DOMAIN-BLIND: everything this file knows about the application arrives through `hooks`
// (injected by the domain, see projects/<name>/hooks.mjs):
//   hooks.compile.arrowsOf(C)       → the arrow map being compiled
//   hooks.compile.overallTarget(C)  → the calibration target those arrows negotiate with
//   hooks.compile.features          → arrow name → synthetic-population feature name
//   hooks.compile.syntheticPop(C,r,n) → rows carrying those features (exact draw order matters)
//   hooks.compile.refineMeasure(C)  → run the real generator, return {arrow: {group, rest}}

import { rng, sigmoid, calibrateIntercept, logit } from './rng.mjs';

const BAND_MIDPOINT = { weak: 0.28, med: 0.65, strong: 1.35 };
const clamp01 = (x) => Math.min(0.995, Math.max(0.005, x));

export function compileRuleset(R, hooks) {
  const H = hooks.compile;
  const C = structuredClone(R);
  const arrows = H.arrowsOf(C);

  // pass 1: direct forms
  for (const a of Object.values(arrows)) {
    if (a.beta != null) { a.compiledFrom = 'beta (authored directly)'; continue; }
    if (a.logitShift != null) { a.compiledFrom = 'logitShift (regime gate)'; continue; }
    if (a.strength) { a.beta = (a.sign === '-' ? -1 : 1) * BAND_MIDPOINT[a.strength]; a.compiledFrom = `strength:${a.strength} → band midpoint`; }
  }

  // synthetic population mirroring the generator's latent structure (seeded — deterministic)
  const r = rng('compile', 'population');
  const N = 20000;
  const pop = H.syntheticPop(C, r, N);
  const target = H.overallTarget(C);
  const scoreOf = (p, betas) => Object.entries(H.features).reduce((s, [k, f]) => s + (betas[k] ?? 0) * p[f], 0);

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

  // group rates the way the validator measures: multi-round survival-weighted decisions
  const evalGroups = (betas, f) => {
    const scores = pop.map((p) => scoreOf(p, betas));
    const w = new Float64Array(N).fill(1);
    let g = 0, gn = 0, rest = 0, rn = 0;
    for (let round = 0; round < 6; round++) {
      const b0 = calibrateWeighted(scores, w, target);
      for (let j = 0; j < N; j++) {
        const pr = sigmoid(b0 + scores[j]);
        if (pop[j][f]) { g += w[j] * pr; gn += w[j]; } else { rest += w[j] * pr; rn += w[j]; }
        w[j] *= pr;
      }
    }
    return { group: g / gn, rest: rest / rn };
  };

  // pass 2: analytic solve (two sweeps so solved arrows see each other)
  for (let sweep = 0; sweep < 2; sweep++) {
    for (const [k, a] of Object.entries(arrows)) {
      if (a.liftPts == null && a.groupTarget == null) continue;
      const f = H.features[k];
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

  // pass 3: empirical refinement — the real generator is the ground truth
  const solved = Object.entries(arrows).filter(([, a]) => a.liftPts != null || a.groupTarget != null);
  for (let iter = 0; iter < 4 && solved.length; iter++) {
    const m = H.refineMeasure(C);
    let worst = 0;
    for (const [k, a] of solved) {
      const got = a.groupTarget != null ? m[k].group : m[k].group - m[k].rest;
      const want = a.groupTarget != null ? a.groupTarget : a.liftPts / 100;
      const err = want - got;
      worst = Math.max(worst, Math.abs(err));
      if (a.groupTarget != null) a.beta = +((a.beta + 0.8 * (logit(clamp01(want)) - logit(clamp01(got)))).toFixed(3));
      else a.beta = +((a.beta + 0.8 * err / 0.10).toFixed(3)); // ~0.10 rate-per-logit near the ceiling
    }
    if (worst < 0.015) break; // within 1.5pt — the validator gates the rest
  }
  for (const [, a] of solved) a.compiledFrom += ' + empirical refinement (spec: author → measure → adjust, automated)';
  // THE TRAP THIS CLOSES. `liftPts` / `groupTarget` / `strength` are the human forms, and the docs
  // rightly recommend them — but only the arrows returned by hooks.compile.arrowsOf get SOLVED into
  // a beta. An effect authored in a human form anywhere else keeps `beta: undefined`, and then:
  //
  //     undefined * theta  →  NaN  →  sigmoid(NaN)  →  bernoulli(NaN) is always false
  //
  // …so the domain silently produces ZERO ROWS, with every gate green. That is exactly what
  // happened the first time someone added a domain by following the documentation: an effect with
  // `liftPts: 9`, a build that passed, and no data at all.
  //
  // Found by walking datagen/ADDING-A-DOMAIN.md as a newcomer would.
  {
    const unsolved = [];
    const walk = (node, path) => {
      if (!node || typeof node !== 'object' || Array.isArray(node)) return;
      for (const [k, v] of Object.entries(node)) {
        if (k.startsWith('$')) continue;
        const p = path ? `${path}.${k}` : k;
        if (k === 'effects' && v && typeof v === 'object') {
          for (const [name, e] of Object.entries(v)) {
            if (name.startsWith('$') || !e || typeof e !== 'object') continue;
            const human = e.liftPts != null || e.groupTarget != null || e.strength != null;
            if (human && e.beta == null) unsolved.push(`${p}.${name}`);
          }
        } else walk(v, p);
      }
    };
    walk(C, '');
    if (unsolved.length) {
      throw new Error(
        `effect(s) authored in a human form but never solved into a beta:\n  - ${unsolved.join('\n  - ')}\n\n`
        + `Only the effects returned by hooks.compile.arrowsOf() are solved. Everywhere else the beta\n`
        + `stays undefined, which makes every score NaN and every draw false — the domain generates\n`
        + `NOTHING, with all gates green.\n\n`
        + `Fix by either (a) authoring \`beta\` directly for these, or (b) extending arrowsOf() and the\n`
        + `feature map to cover this block. (a) is right unless the effect needs calibrating against a\n`
        + `population target.`,
      );
    }
  }

  return C;
}

/** Human-units rendering of a compiled arrow: percentage-point effect at the calibrated baseline. */
export function describeEffectPts(C, key, hooks) {
  const H = hooks.compile;
  const arrows = H.arrowsOf(C);
  const a = arrows[key];
  if (a.beta == null) return null;
  const r = rng('compile', 'describe');
  const pop = H.syntheticPop(C, r, 8000);
  const betas = Object.fromEntries(Object.entries(arrows).map(([k2, a2]) => [k2, a2.beta ?? 0]));
  const scores = pop.map((p) => Object.entries(H.features).reduce((s, [k, f]) => s + betas[k] * p[f], 0));
  const b0 = calibrateIntercept(scores, H.overallTarget(C));
  const f = H.features[key];
  const binary = pop.length && (pop[0][f] === 0 || pop[0][f] === 1);
  if (binary) {
    let g = 0, gn = 0, rest = 0, rn = 0;
    pop.forEach((p, j) => { const pr = sigmoid(b0 + scores[j]); if (p[f]) { g += pr; gn++; } else { rest += pr; rn++; } });
    return { kind: 'group', pts: (g / gn - rest / rn) * 100, groupRate: (g / gn) * 100 };
  }
  let base = 0, up = 0;
  pop.forEach((p, j) => { base += sigmoid(b0 + scores[j]); up += sigmoid(b0 + scores[j] + betas[key]); });
  return { kind: 'perSD', pts: ((up - base) / pop.length) * 100 };
}
