// CORE: the feature-query interpreter — the "feature" half of the factor contract
// (FRAMEWORK.md §the-factor-contract). A factor's feature declaration compiles to a plain
// function (entity → number); the executor adds β × value to the score. Deliberately tiny
// grammar (v1): standardize what three hand-written domains actually needed; anything
// weirder stays a named domain hook until it earns a grammar entry.

/**
 * compileFeature(decl) → (entity) => number
 *
 *   { from: "self", field: "AutoRenew" }              → entity.AutoRenew coerced to 0/1/number
 *   { from: "self", where: { Segment: "Enthusiast" }} → 1 if all equalities match, else 0
 *
 * Cross-entity forms ({ from: "<table>", … }) arrive with the ordering rule — declared in
 * the contract, not yet admitted here.
 */
export function compileFeature(decl) {
  if (decl.from !== 'self') {
    throw new Error(`feature grammar v1 supports from:"self" only (got "${decl.from}") — cross-entity features need the ordering rule (FRAMEWORK.md)`);
  }
  if (decl.field) {
    const f = decl.field;
    return (e) => {
      const v = e[f];
      return typeof v === 'boolean' ? (v ? 1 : 0) : (v ?? 0);
    };
  }
  if (decl.where) {
    const pairs = Object.entries(decl.where);
    return (e) => (pairs.every(([k, v]) => e[k] === v) ? 1 : 0);
  }
  throw new Error(`feature needs "field" or "where": ${JSON.stringify(decl)}`);
}

/** All of a block's factor arrows that carry feature declarations, compiled and ready:
 *  [{ name, beta, fn }] — the executor's generic score terms. */
export function featureArrows(arrows) {
  return Object.entries(arrows)
    .filter(([, a]) => a.feature)
    .map(([name, a]) => ({ name, beta: a.beta, fn: compileFeature(a.feature) }));
}
