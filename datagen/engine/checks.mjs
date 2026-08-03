// CHECKS DERIVED FROM DECLARATIONS — the other half of the rule language.
//
// A rule in this system is stated once and consumed twice: the generator aims at it, and a
// check verifies the result. Today only ONE rule kind actually works that way — a causal
// effect is declared in `effects`, turned into a score term by the generator, and RECOVERED by
// regression in the validator, which reads the same declaration to know what to expect. Those
// gates have never drifted, because they cannot.
//
// Every other rule kind is said twice, in two languages. A target is declared as
// { target, tolerance } in the ruleset, and then a gate elsewhere re-states the number, invents
// its own error band, and picks its own standard-error cushion by hand. Measured 2026-08-03:
// 171 of 191 checks assert something typed into the validator rather than derived from a
// declaration. Two consequences, both real:
//
//   1. adding an enforced number does not add a check — the pair can ship with nothing
//      verifying it, and nothing notices;
//   2. a second project gets NO checks at all, because they live in one project's validator.
//
// This module closes both. It finds every declared target pair in a ruleset, asks the project
// only for the MEASUREMENT (the one thing an engine cannot know), and derives the rest: the
// band, the cushion, the message. A declared target with no measurement is REPORTED, not
// silently unchecked.

/**
 * Every { target, tolerance } pair in a ruleset, by dotted path.
 * Recognised by SHAPE, not by name, so it covers keys that do not exist yet.
 * @returns {{ path: string, target: number, tolerance: number, n?: number, se?: number }[]}
 */
export function declaredTargets(R) {
  const out = [];
  const walk = (node, path) => {
    if (!node || typeof node !== 'object') return;
    if (Array.isArray(node)) return; // a target pair is never an array element
    if ('target' in node && 'tolerance' in node && typeof node.tolerance === 'number') {
      out.push({ path, target: node.target, tolerance: node.tolerance, n: node.n, se: node.se });
      return; // do not descend into a pair
    }
    for (const [k, v] of Object.entries(node)) {
      if (k.startsWith('$')) continue;
      walk(v, path ? `${path}.${k}` : k);
    }
  };
  walk(R, '');
  return out;
}

/**
 * Run every declared target that the project can measure, and report the ones it cannot.
 *
 * @param {object} R                the composed ruleset
 * @param {Record<string, (ctx: any) => {observed: number, of?: number, detail?: string} | null>} measurements
 *        dotted path → how to measure it. `of` is the denominator size, which enables the
 *        standard-error cushion — a small pilot build must not fail on ordinary sampling noise.
 *        Returning null means "not applicable to this build" (skipped, not failed).
 * @param {(name: string, ok: boolean, detail?: string) => void} check the validator's reporter
 * @param {any} ctx               whatever the measurements need (loaded packs, usually)
 * @returns {{ ran: number, skipped: string[], unmeasured: string[] }}
 */
export function runTargetChecks(R, measurements, check, ctx) {
  const targets = declaredTargets(R);
  const unmeasured = [];
  const skipped = [];
  let ran = 0;

  for (const t of targets) {
    const measure = measurements[t.path];
    if (!measure) { unmeasured.push(t.path); continue; }
    const m = measure(ctx);
    if (m == null) { skipped.push(t.path); continue; }

    // Vector targets (a share per category) are gated on their first entry only, which is the
    // long-standing convention: the rest are indicative. Stated here rather than per-gate.
    const target = Array.isArray(t.target) ? t.target[0] : t.target;
    const n = m.of ?? t.n ?? 0;
    const se = t.se ?? 3;
    const cushion = n > 0 ? se * Math.sqrt((target * (1 - target)) / n) : 0;
    const allow = t.tolerance + cushion;
    const ok = Math.abs(m.observed - target) <= allow;
    check(
      `${t.path}: ${(m.observed * 100).toFixed(1)}% vs ${(target * 100).toFixed(1)}% ±${(allow * 100).toFixed(1)}`,
      ok,
      m.detail ?? (n ? `n=${n}` : undefined),
    );
    ran++;
  }
  return { ran, skipped, unmeasured };
}

/**
 * A declared reference: a child column that must point at an existing parent key.
 * @typedef {{ from: [pack: string, table: string, column: string],
 *             to:   [pack: string, table: string, column: string],
 *             note?: string }} Ref
 */

/**
 * Run every declared reference. The relation is DATA — child column → parent key — so the check
 * is generated rather than written, and a new project declares its graph instead of hand-rolling
 * a dangling counter per edge.
 *
 * Null and undefined child values PASS: an optional reference is not a broken one. That rule
 * lives here once, rather than being remembered at each of a dozen call sites.
 *
 * @param {readonly Ref[]} refs
 * @param {(pack: string, table: string) => any[]} load
 * @param {(name: string, ok: boolean, detail?: string) => void} check
 * @param {Record<string, (rows: any[]) => any[]>} [filters] per-"pack.table" row filter, for the
 *        cases where only a subset participates (e.g. prospects excluded from member references)
 */
export function runRefChecks(refs, load, check, filters = {}) {
  const rowsOf = (spec) => {
    const [pack, table] = spec;
    const key = `${pack}.${table}`;
    const rows = load(pack, table);
    return filters[key] ? filters[key](rows) : rows;
  };
  for (const ref of refs) {
    const child = rowsOf(ref.from);
    const parentKeys = new Set(rowsOf(ref.to).map((r) => r[ref.to[2]]));
    const bad = child.filter((r) => {
      const v = r[ref.from[2]];
      return v != null && !parentKeys.has(v);
    });
    const name = `ref: ${ref.from[1]}.${ref.from[2]} → ${ref.to[1]}.${ref.to[2]}`;
    check(name, bad.length === 0, bad.length ? `${bad.length} dangling of ${child.length}` : `${child.length} rows`);
  }
}
