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
 *
 * `when` exists for POLYMORPHIC references — one column whose parent table depends on a sibling
 * discriminator column, which is how audit rows, favourites, list members and task links all work
 * here (`RefKind: 'issue' | 'task' | 'period' | …`). Without it those could not be declared at all
 * and stayed a hand-written switch in the validator: five parent sets built by hand, one conditional
 * chain, and a `: false` fallback that silently FAILED CLOSED on any kind nobody added to the chain.
 *
 * `when` is DATA — `{ RefKind: 'issue' }`, or `{ RefKind: ['memberprofile', 'person'] }` — and not a
 * predicate function, which is what makes the real check possible. A predicate is opaque: all you can
 * ask is whether it matched anything, and "matched nothing" cannot distinguish a renamed discriminator
 * from a kind that is simply rare at this seed. Measured: requiring a non-empty subset failed 3 of 7
 * seeds, because at N=500 some seeds have no billing issue sourced from an order at all.
 *
 * Stated as data, the discriminator column and its values are both known, so the question inverts
 * into one with no false positives — see runDiscriminatorChecks: every value PRESENT in the data must
 * be covered by some declared edge. A renamed kind appears as a value nobody declared; a rare kind
 * simply has no rows, which is not a defect.
 *
 * @typedef {{ from: [pack: string, table: string, column: string],
 *             to:   [pack: string, table: string, column: string],
 *             when?: Record<string, string | readonly string[]>,
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
    const all = rowsOf(ref.from);
    const child = ref.when ? all.filter((r) => matchesWhen(r, ref.when)) : all;
    const parentKeys = new Set(rowsOf(ref.to).map((r) => r[ref.to[2]]));
    const bad = child.filter((r) => {
      const v = r[ref.from[2]];
      return v != null && !parentKeys.has(v);
    });
    const label = ref.when ? ` [${Object.entries(ref.when).map(([k, v]) => `${k}=${[v].flat().join('|')}`).join(' ')}]` : '';
    const name = `ref: ${ref.from[1]}.${ref.from[2]}${label} → ${ref.to[1]}.${ref.to[2]}`;
    // An empty subset is NOT failed here. A rare discriminator value legitimately has no rows at a
    // given seed and scale; the renamed-value case is caught by runDiscriminatorChecks instead,
    // which asks the question that has no false positives.
    check(name, bad.length === 0, bad.length ? `${bad.length} dangling of ${child.length}` : `${child.length} rows`);
  }
}

/** Does a row match a declared `when`? Values may be a single value or a list. */
function matchesWhen(row, when) {
  return Object.entries(when).every(([col, want]) => [want].flat().includes(row[col]));
}

/**
 * EVERY POLYMORPHIC KIND IS HANDLED — the question that replaced "did this subset match anything".
 *
 * A polymorphic reference column has a sibling discriminator, and each of its values needs its own
 * declared edge. The failure that matters is a value PRESENT IN THE DATA that no edge covers: a kind
 * renamed, or a new kind added by a generator and never declared. Its rows then point at nothing
 * anybody checks, which is precisely what the validator's old `: false` fallback did — silently.
 *
 * This direction has no false positives, which the obvious direction did: requiring each declared
 * subset to be non-empty failed 3 of 7 seeds on issues sourced from an order, a kind that is real but
 * rare enough to be absent at N=500. Absence of rows is not a defect; an unclaimed value is.
 *
 * @param {readonly Ref[]} refs
 * @param {(pack: string, table: string) => any[]} load
 * @param {(name: string, ok: boolean, detail?: string) => void} check
 */
export function runDiscriminatorChecks(refs, load, check) {
  // (pack.table.discriminatorColumn) → the values some declared edge claims
  const claimed = new Map();
  for (const ref of refs) {
    if (!ref.when) continue;
    for (const [col, want] of Object.entries(ref.when)) {
      const key = `${ref.from[0]}.${ref.from[1]}.${col}`;
      if (!claimed.has(key)) claimed.set(key, new Set());
      for (const v of [want].flat()) claimed.get(key).add(v);
    }
  }
  for (const [key, values] of claimed) {
    const [pack, table, col] = key.split('.');
    const present = new Set(load(pack, table).map((r) => r[col]).filter((v) => v != null));
    const unclaimed = [...present].filter((v) => !values.has(v));
    check(
      `every ${table}.${col} value has a declared reference (${values.size} declared)`,
      unclaimed.length === 0,
      unclaimed.length
        ? `UNDECLARED: ${unclaimed.join(', ')} — rows with this value reference nothing that is checked`
        : `${present.size} in use of ${values.size} declared`,
    );
  }
}

/**
 * INSTALL ORDER, derived from the reference graph.
 *
 * Every pack's manifest declares `dependsOn` — the packs an installer must load first. That is a
 * claim, and until now nothing checked it: the only gate asserted `Array.isArray(dependsOn)`, so
 * removing a real dependency (orders → events) passed 257 of 257 gates and shipped a manifest
 * telling the installer the wrong order. The failure lands at install time, on a foreign key, in
 * somebody else's terminal.
 *
 * It does not need a new declaration, because refs.mjs already carries pack membership in every
 * edge: a reference from pack A to pack B IS a dependency of A on B. Transitive counts — `sonar`
 * may reach `common` through `events` — but a cycle does not, because "load bottom-up" stops
 * meaning anything.
 *
 * @param {readonly {from: [string,string,string], to: [string,string,string]}[]} refs
 * @param {(pack: string, table: string) => any} load  called as load(pack, 'manifest')
 * @param {(name: string, ok: boolean, detail?: string) => void} check
 * @param {string[]} [allPacks] every emitted pack name — required for the cycle check to be complete
 */
export function runInstallOrderChecks(refs, load, check, allPacks) {
  // Seed from the packs the reference graph names, then FOLLOW dependsOn to discover the rest.
  // Seeding alone is not enough: a pack with no declared references (platform, sonar) would never
  // have its manifest read, and a cycle running through it reported green — which is exactly what
  // happened when this check was first negative-tested against a planted platform↔messaging cycle.
  const deps = new Map();
  // allPacks, when the caller can enumerate them, is what makes this COMPLETE: a pack nothing
  // points at (platform, sonar are leaves) is otherwise never discovered, and a cycle confined to
  // two such packs stays invisible.
  const queue = allPacks?.length ? [...allPacks] : [...new Set(refs.flatMap((r) => [r.from[0], r.to[0]]))];
  while (queue.length) {
    const p = queue.shift();
    if (deps.has(p)) continue;
    let dependsOn;
    try { dependsOn = load(p, 'manifest').dependsOn ?? []; } catch { continue; } // not emitted; the ref gates say so
    deps.set(p, dependsOn);
    queue.push(...dependsOn);
  }

  const reaches = (from, to, seen = new Set()) => {
    if (seen.has(from)) return false;                       // cycle: stop, and report it separately
    seen.add(from);
    const direct = deps.get(from) ?? [];
    return direct.includes(to) || direct.some((d) => reaches(d, to, seen));
  };

  const cross = refs.filter((r) => r.from[0] !== r.to[0] && deps.has(r.from[0]));
  // report per PACK PAIR, not per edge: three columns in membership pointing at common is one
  // missing dependency, and saying it three times just makes the message harder to read.
  const uncovered = [...new Set(cross.filter((r) => !reaches(r.from[0], r.to[0])).map((r) => `${r.from[0]} → ${r.to[0]}`))];
  check(
    `install order: every cross-pack reference is covered by dependsOn (${cross.length} edges)`,
    uncovered.length === 0,
    uncovered.length
      ? uncovered.map((pair) => `'${pair.split(' → ')[0]}' references '${pair.split(' → ')[1]}' but does not depend on it`).join('; ')
      : `${deps.size} packs, order is honest`,
  );

  const cyclic = [...deps.keys()].filter((p) => reaches(p, p));
  check(
    'install order: dependsOn is acyclic',
    cyclic.length === 0,
    cyclic.length ? `CYCLE through: ${cyclic.join(', ')} — nothing can be installed first` : 'bottom-up load is possible',
  );
}

/**
 * Every declared mix (a map of category → positive weight), by dotted path.
 * Recognised by shape and position — anything under a `mixes` key.
 * @returns {{ path: string, categories: string[] }[]}
 */
export function declaredMixes(R) {
  const out = [];
  const walk = (node, path) => {
    if (!node || typeof node !== 'object' || Array.isArray(node)) return;
    for (const [k, v] of Object.entries(node)) {
      if (k.startsWith('$')) continue;
      const p = path ? `${path}.${k}` : k;
      if (k === 'mixes' && v && typeof v === 'object') {
        for (const [name, mix] of Object.entries(v)) {
          if (name.startsWith('$') || !mix || typeof mix !== 'object' || Array.isArray(mix)) continue;
          const opts = Object.entries(mix).filter(([c]) => !c.startsWith('$'));
          out.push({
            path: `${p}.${name}`,
            categories: opts.filter(([, w]) => w > 0).map(([c]) => c),
            weights: Object.fromEntries(opts),
          });
        }
      } else walk(v, p);
    }
  };
  walk(R, '');
  return out;
}

/**
 * PRESENCE FLOORS, derived. Every category a mix gives positive weight must actually APPEAR in
 * the data. A share gate cannot do this job: a category whose expected share is 0.5% passes a
 * ±6-point band at exactly zero rows. That is not hypothetical — Critical-severity tickets sat at
 * zero for weeks while every gate stayed green, because no percentage check can notice an
 * entirely missing category.
 *
 * The project declares only WHERE each mix lands; the categories come from the declaration, so a
 * new option added to a mix is automatically required to appear.
 *
 * @param {object} R
 * @param {Record<string, { at: [pack: string, table: string, column: string], absentAs?: string[] }>} landings
 *        mix path → the column its draw lands in. `absentAs` lists categories modelled as the
 *        ABSENCE of a row or value (e.g. a competition 'None' result), which cannot be looked for.
 * @param {(pack: string, table: string) => any[]} load
 * @param {(name: string, ok: boolean, detail?: string) => void} check
 * @returns {{ ran: number, unlanded: string[] }}
 */
export function runPresenceChecks(R, landings, load, check) {
  const mixes = declaredMixes(R);
  const unlanded = [];
  let ran = 0;
  const seen = new Map();
  const valuesAt = ([pack, table, column]) => {
    const key = `${pack}.${table}.${column}`;
    if (!seen.has(key)) seen.set(key, new Set(load(pack, table).map((r) => r[column])));
    return seen.get(key);
  };

  for (const m of mixes) {
    const landing = landings[m.path];
    if (!landing) { unlanded.push(m.path); continue; }
    const ignore = new Set(landing.absentAs ?? []);
    const present = valuesAt(landing.at);

    // A category can only be REQUIRED to appear when enough rows were drawn for it to be likely.
    // The denominator is the project's to state: a mix often applies to a SUBSET of the landing
    // table (the Educator legal structures apply only to educator organisations), and an engine
    // cannot know which. Without `poolOf` the whole table is used.
    //
    // Same lesson as target denominators, learned the same way: a 12%-weight option over eight
    // eligible rows is expected about once, so demanding it fails two seeds in seven on luck
    // alone — a correct build called broken.
    const rows = load(landing.at[0], landing.at[1]);
    const pool = landing.poolOf ? landing.poolOf(rows).length : rows.length;
    const threshold = landing.expectAtLeast ?? 3;
    const candidates = m.categories.filter((c) => !ignore.has(c));
    const required = candidates.filter((c) => (m.weights?.[c] ?? 0) * pool >= threshold);
    const tooRare = candidates.filter((c) => !required.includes(c));
    const missing = required.filter((c) => !present.has(c));

    const detail = missing.length
      ? `MISSING: ${missing.join(', ')}`
      : `${required.length} required present of ${pool} rows`
        + (tooRare.length ? `; too rare at this scale: ${tooRare.join(', ')}` : '');
    check(
      `presence: every option of ${m.path} appears in ${landing.at[1]}.${landing.at[2]}`,
      missing.length === 0,
      detail,
    );
    ran++;
  }
  return { ran, unlanded };
}
