// THE HANDWRITING HELPERS — the setup every generator writes before it can start.
//
// The five patterns cover the DECISIONS. They do not cover the scaffolding around a decision, and
// that scaffolding is where a new domain actually stalls: a years loop, an eligibility lookup, and
// stripping the internal fields before rows ship.
//
// Measured before writing this: the years loop appears verbatim in 4 generators, an
// eligibility/coverage scan in 5. And the good coverage implementation — indexed by key, so lookups
// are constant time — was PRIVATE to committees.mjs. Writing two new domains today, I reinvented it
// twice as a naive linear scan, slower and subtly different, having written the documentation
// myself. That is the handwriting problem in miniature: the right version exists, nobody can find
// it, everyone rebuilds it worse.
//
// Nothing here is required. A generator that wants its own loop writes its own loop.

/**
 * The years this world covers, inclusive of the release year.
 * Every generator that walks history needs exactly this, and four of them wrote it out.
 * @param {{ R: any, releaseYear: number }} cfg
 * @returns {number[]}
 */
export function yearsOf(cfg) {
  const out = [];
  for (let y = cfg.R.history.startYear; y <= cfg.releaseYear; y++) out.push(y);
  return out;
}

/**
 * Index rows by a key column — `indexBy(people, 'MemberNumber').get('ICF-000101')`.
 *
 * Measured before writing this: fifteen generators built exactly this Map inline, and the same
 * index was spelled two different ways — `personByKey` in four files and `personByNum` in two.
 * Two names for one thing is how a reader loses the thread, and `orgByKey` appeared five times.
 *
 * This is NOT derived from refs.mjs, and that was a deliberate reversal of the plan. The
 * reference graph declares which columns are parent keys, so a registry of every parent index
 * COULD be generated — but of the 44 index sites in this project, 29 build domain-specific
 * groupings (a roster by committee-term, attendance by meeting, overdue counts by member) that
 * encode judgement and cannot be derived at all. The remaining 15 are one clear line each.
 * Replacing a clear line with a lookup into a 30-entry generated registry trades clarity for
 * indirection and makes handwriting harder, which is the opposite of the goal. Naming the
 * operation is the whole win; the registry would have been abstraction for its own sake.
 *
 * @template T
 * @param {readonly T[]} rows
 * @param {string} key the column to key on — last row wins on a duplicate, as an inline Map did
 * @returns {Map<any, T>}
 */
export function indexBy(rows, key) {
  const out = new Map();
  for (const row of rows) out.set(row[key], row);
  return out;
}

/**
 * A person's engagement level IN A GIVEN YEAR.
 *
 * This is the most-written expression in the whole project. Fifteen sites, all spelled out by hand:
 *
 *   scoreOf: (p, y) => E.effects['x.engagement'].beta * (p._thetaPath?.[y] ?? p._theta)
 *
 * It appears inside `scoreOf`, which is the one callback every pattern takes and therefore the line
 * every author writes. Three things were wrong with leaving it spelled out:
 *
 *   1. It does not say what it means. `_thetaPath?.[y] ?? _theta` is mechanism; "how engaged this
 *      person was in 2019" is the idea, and the idea is what an author is reasoning about.
 *   2. It is an optional chain with a numeric fallback — the exact shape that produced four separate
 *      silent corruptions in this codebase. Here the fallback is LOAD-BEARING (a hero with no pinned
 *      arc has `_thetaPath: null`), so it cannot simply be deleted, which is precisely why it wants
 *      to be written once, correctly, where the reason can be recorded.
 *   3. Spelled out fifteen times, it is fifteen chances to write `?.[y]` against the wrong year
 *      variable — and using last year's engagement instead of this year's is a plausible number in
 *      the right range, which no gate can catch.
 *
 * @param {{ _theta: number, _thetaPath?: Record<number, number> | null }} person
 * @param {number} year
 * @returns {number} the pinned arc's value for that year, or the person's fixed level
 */
export function thetaAt(person, year) {
  return person._thetaPath?.[year] ?? person._theta;
}

/**
 * An INDEXED "was this entity covered on this date" lookup, built once from interval rows.
 *
 * The naive version — `rows.some(r => r.key === k && r.start <= d && d <= r.end)` — is a full scan
 * per call, and a generator asking it once per member per year does that thousands of times. This
 * groups first, so each lookup touches only that entity's own intervals.
 *
 * Field names are options because a project's intervals are its own: membership periods here,
 * enrolments or leases elsewhere.
 *
 * @param {readonly any[]} rows
 * @param {{ key?: string, start?: string, end?: string }} [fields]
 * @returns {(key: string, dateIso: string) => boolean}
 */
export function coverageOf(rows, fields = {}) {
  const { key = 'MemberNumber', start = 'StartDate', end = 'EndDate' } = fields;
  const byKey = new Map();
  for (const r of rows) {
    const k = r[key];
    if (!byKey.has(k)) byKey.set(k, []);
    byKey.get(k).push(r);
  }
  return (k, dateIso) => (byKey.get(k) ?? []).some((r) => r[start] <= dateIso && dateIso <= r[end]);
}

/**
 * Drop generator-internal fields (anything `_`-prefixed) from rows before they ship.
 *
 * Internals are how a generator carries a person or a latent alongside a row while it works. They
 * must not reach a pack: they are not columns, and one leaking through is a row that fails to load
 * with a message about an unknown field. Doing it in one place beats remembering a `delete` per
 * field per module — which is the current arrangement, and it has already missed some.
 *
 * @template T
 * @param {readonly T[]} rows
 * @returns {T[]} the same rows, mutated in place and returned for chaining
 */
export function stripInternals(rows) {
  for (const row of rows) {
    for (const k of Object.keys(row)) if (k.startsWith('_')) delete row[k];
  }
  return rows;
}
