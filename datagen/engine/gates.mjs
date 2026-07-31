// Gate helpers — the five shapes ~200 bespoke validator checks kept re-implementing.
// A helper takes the validator's own check(name, ok, detail) so message formats stay in
// the house style. Negative-tested in test.mjs: each must CATCH its planted defect and
// stay quiet on clean input — an unexercised helper is decoration.

export function makeGateHelpers(check) {
  /** rows whose keyFn(row) is non-null and absent from the parent key set */
  const dangling = (rows, keyFn, parents) => rows.filter((r) => { const k = keyFn(r); return k != null && !parents.has(k); }).length;
  /** one FK gate over one or more relations — detail reads "0+0 dangling" like every other */
  const fkResolves = (name, relations) => {
    const bads = relations.map(([rows, keyFn, parents]) => dangling(rows, keyFn, parents));
    check(name, bads.every((b) => b === 0), `${bads.join('+')} dangling`);
  };
  /** share vs target with tolerance, plus the usual K·SE cushion for a finite draw pool */
  const shareBand = (label, got, { target, tolerance, n = 0, se = 3, detail }) => {
    const allow = tolerance + (n > 0 ? se * Math.sqrt(target * (1 - target) / n) : 0);
    check(`${label}: ${(got * 100).toFixed(1)}% vs ${(target * 100).toFixed(1)}% ±${(allow * 100).toFixed(1)}`,
      Math.abs(got - target) <= allow, detail);
  };
  /** every named category must actually APPEAR — the floor a tolerance band cannot provide
   *  (severity Critical sat at 0 for weeks behind a passing '±12.2' share gate) */
  const presenceFloor = (name, countsByCategory, min = 1) => {
    const missing = Object.entries(countsByCategory).filter(([, n]) => n < min).map(([k, n]) => `${k}=${n}`);
    check(name, missing.length === 0, missing.length ? `below floor ${min}: ${missing.join(', ')}` : Object.entries(countsByCategory).map(([k, n]) => `${k}=${n}`).join(' '));
  };
  /** enough distinct values that repetition isn't visible on one screen */
  const distinctAtLeast = (name, values, min, detail) => {
    const d = new Set(values).size;
    check(`${name} (${d} distinct, floor ${min})`, d >= min, detail ?? `${values.length} values`);
  };
  return { dangling, fkResolves, shareBand, presenceFloor, distinctAtLeast };
}
