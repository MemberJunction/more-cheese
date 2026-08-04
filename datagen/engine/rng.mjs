// Deterministic RNG with content-addressed substreams (ruleset-spec §4).
// Zero dependencies. Same (seed, streamKey) → identical draw sequence, always.

function xmur3(str) {
  let h = 1779033703 ^ str.length;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return () => {
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return (h ^= h >>> 16) >>> 0;
  };
}

function sfc32(a, b, c, d) {
  return () => {
    a >>>= 0; b >>>= 0; c >>>= 0; d >>>= 0;
    const t = (a + b) | 0;
    a = b ^ (b >>> 9);
    b = (c + (c << 3)) | 0;
    c = (c << 21) | (c >>> 11);
    d = (d + 1) | 0;
    const r = (t + d) | 0;
    c = (c + r) | 0;
    return (r >>> 0) / 4294967296;
  };
}

// STREAM AUDIT — off unless a caller turns it on, because it captures a stack per call and a pilot
// build asks for ~50,000 streams. "One dice stream per decision" is a load-bearing rule that
// nothing could check: sharing a stream between two decisions couples them invisibly, and the
// coupling shows up as plausible data. cli/check-streams.mjs turns this on and reports violations.
//
// Switched by a function rather than an env var on purpose: reading `process` here put an untyped
// global into the engine's most-imported module, which broke type inference for the whole file and
// silently stopped the misuse probe from catching anything. The suite's type step caught it.
//
// This block sits ABOVE rng's doc comment, not between it and the function. Putting it in between
// detached `@returns {Rng}` from what it annotates, rng's return type went to inferred, and the two
// rng misuse probes stopped firing — a type surface that quietly stopped typing anything.
let AUDIT = false;
/** @type {Map<string, Set<string>>} stream key → the call sites that asked for it */
export const streamAudit = new Map();
/** Turn the stream audit on. Call before generating; costs a stack capture per stream. */
export function enableStreamAudit() { AUDIT = true; }

/**
 * A substream keyed by (masterSeed, streamKey) — e.g. rng(seed, 'person:ICF-000101').
 * @returns {import('./types.js').Rng}
 */
export function rng(masterSeed, streamKey) {
  if (AUDIT) {
    const site = (new Error().stack.split('\n')[2] ?? '').trim().replace(/.*\/(projects|engine)\//, '$1/');
    if (!streamAudit.has(streamKey)) streamAudit.set(streamKey, new Set());
    streamAudit.get(streamKey).add(site);
  }
  const h = xmur3(`${masterSeed}::${streamKey}`);
  const next = sfc32(h(), h(), h(), h());
  for (let i = 0; i < 12; i++) next(); // warm up
  let spare = null;

  const r = {
    uniform: () => next(),
    int: (lo, hi) => lo + Math.floor(next() * (hi - lo + 1)),
    pick: (arr) => arr[Math.floor(next() * arr.length)],
    pickWeighted(pairs) { // [[value, weight], ...]
      const total = pairs.reduce((s, [, w]) => s + w, 0);
      let x = next() * total;
      for (const [v, w] of pairs) { x -= w; if (x <= 0) return v; }
      return pairs[pairs.length - 1][0];
    },
    bernoulli: (p) => next() < p,
    shuffle(arr) { // Fisher–Yates on a copy — deterministic bank dealing (sample without replacement)
      const a = arr.slice();
      for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(next() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
      }
      return a;
    },
    normal(mean = 0, sd = 1) {
      if (spare !== null) { const z = spare; spare = null; return mean + sd * z; }
      let u, v, s;
      do { u = next() * 2 - 1; v = next() * 2 - 1; s = u * u + v * v; } while (s >= 1 || s === 0);
      const m = Math.sqrt((-2 * Math.log(s)) / s);
      spare = v * m;
      return mean + sd * u * m;
    },
    lognormal: (mu, sigma) => Math.exp(r.normal(mu, sigma)),
    poisson(lambda) {
      if (lambda <= 0) return 0;
      if (lambda > 30) return Math.max(0, Math.round(r.normal(lambda, Math.sqrt(lambda))));
      const L = Math.exp(-lambda);
      let k = 0, p = 1;
      do { k++; p *= next(); } while (p > L);
      return k - 1;
    },
    /** Negative binomial via gamma-poisson mixture; dispersion k (smaller = lumpier). */
    negbin(mean, k) {
      const g = r.gamma(k, mean / k);
      return r.poisson(g);
    },
    gamma(shape, scale) {
      if (shape < 1) {
        const u = next();
        return r.gamma(1 + shape, scale) * Math.pow(u, 1 / shape);
      }
      const d = shape - 1 / 3, c = 1 / Math.sqrt(9 * d);
      for (;;) {
        let x, v;
        do { x = r.normal(); v = 1 + c * x; } while (v <= 0);
        v = v * v * v;
        const u = next();
        if (u < 1 - 0.0331 * x * x * x * x) return d * v * scale;
        if (Math.log(u) < 0.5 * x * x + d * (1 - v + Math.log(v))) return d * v * scale;
      }
    },
    /** Correlated standard-normal pair (Gaussian copula) — the two latent dials. */
    copulaPair(rho) {
      const z1 = r.normal(), z2 = r.normal();
      return [z1, rho * z1 + Math.sqrt(1 - rho * rho) * z2];
    },
    /** AR(1) series of length n on the given stream (yearly/monthly texture). */
    ar1(n, rho, sigma) {
      const out = [];
      let x = r.normal(0, sigma / Math.sqrt(1 - rho * rho));
      for (let i = 0; i < n; i++) { out.push(x); x = rho * x + r.normal(0, sigma); }
      return out;
    },
  };
  return r;
}

export const sigmoid = (x) => 1 / (1 + Math.exp(-x));
export const logit = (p) => Math.log(p / (1 - p));

/** Solve intercept b0 so mean(sigmoid(b0 + score_i)) === target (ruleset-spec §2 calibration rule). */
export function calibrateIntercept(scores, target) {
  let lo = -12, hi = 12;
  for (let i = 0; i < 60; i++) {
    const mid = (lo + hi) / 2;
    let m = 0;
    for (const s of scores) m += sigmoid(mid + s);
    m /= scores.length;
    if (m < target) lo = mid; else hi = mid;
  }
  return (lo + hi) / 2;
}
