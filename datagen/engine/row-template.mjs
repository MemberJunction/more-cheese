// ROW TEMPLATES — the declarative form of the 660 lines of object-literal row construction.
//
// A template is PURE DATA describing one row shape: which columns exist, in which order, and
// where each value comes from. The executor renders it against a scope the generator prepares.
// The point is not fewer lines — it is that a row's shape becomes something you read and check
// rather than something you re-derive from code, and that the draw discipline (one stream per
// decision, fixed draw order) is enforced by the executor's structure instead of by care.
//
// THE SHAPE:
//   { let: { name: FieldSpec, … },     // pre-bindings, in DRAW order (optional)
//     row: { Column: FieldSpec, … } }  // columns, in OUTPUT order (which is serialization
//                                      // order in the packs — key order is itself byte identity)
//
// FIELD SPECS — a single-tag union. A spec with two tags is rejected, because two tags would
// make the draw order ambiguous, and draw order is part of the byte-identity contract:
//   'literal' / 42 / true / null          the value itself
//   { const: v }                          the value itself, when it is an object/looks like a tag
//   { from: 'member.MemberNumber' }       copy from scope via dot-path (undefined → throw)
//   { fromOptional: 'item.lengthMonths' } copy, or null when absent — for columns that are
//                                         NULLABLE BY DESIGN (a Rolling window has months or
//                                         days, never both; an address has no Line2)
//   { fmt: 'ENR-{member.MemberNumber}-{k}' }  interpolation; tokens are dot-paths ONLY
//   { pick: 'ctx.pool' }                  r.pick over a scope array               (1 draw)
//   { mix: 'ctx.mixes.kind' }             r.pickWeighted over a declared mix      (1 draw)
//   { chance: 0.25 } / { chance: 'ctx.p' }  r.bernoulli                           (1 draw)
//   { int: [3, 21] }                      r.int, CONSTANT bounds only             (1 draw)
//   { date: { anchor: 'course.StartDate', offset: OffsetSpec, clamp?: 'ctx.release' } }
//   { seq: 'k' }                          sugar for `from` on a caller-scoped counter
//
// OffsetSpec is derivedTransaction's existing vocabulary (patterns.mjs delegates here now —
// ONE interpreter), plus 'mixture':
//   { dist: 'const', days }                                       0 draws
//   { dist: 'uniformDays', min, max, sign? }                      1 draw
//   { dist: 'lognormalDays', medianDays, sigma, minDays?, capDays? }  1+ draws (normal spare!)
//   { dist: 'mixture', bands: [[OffsetSpec, weight], …] }         1 draw, then the band's
//
// DRAW-ORDER GUARANTEES, structural rather than careful:
//   * evaluation is eager and strictly top-to-bottom: `let` entries in declaration order, then
//     `row` entries in declaration order. A draw happens exactly where its spec sits. There is
//     no laziness and no reordering machinery to get wrong.
//   * `let` exists because draw order and column order are two INDEPENDENT byte contracts:
//     where handwritten code drew before building the literal, the draw becomes a `let`.
//   * RENDER, THEN FILTER: a guard that skips a row must run on the rendered row, never before
//     rendering — a skipped iteration still consumed its draws in the handwritten code, and
//     filter-before-render is the classic way to lose byte identity.
//   * projectRows renders with a dice handle that THROWS: a catalog projection cannot silently
//     acquire a draw.
//
// WHAT DOES NOT BELONG HERE (each rejected deliberately — the row stays handwritten instead):
// conditional field logic, draw bounds computed from row data, cross-row state, bank functions.
// The first request for `when:` or arithmetic in `fmt` is answered "that row stays handwritten."
// A template DSL that grows conditionals is the failure mode this comment exists to prevent.

import { iso, addDays, parseDate } from './dates.mjs';

const TAGS = ['const', 'from', 'fromOptional', 'fmt', 'pick', 'mix', 'chance', 'int', 'date', 'seq'];

/** Render one row from a template, consuming draws from `r` in declaration order. */
export function renderRow(r, spec, scope) {
  const s = Object.create(null);
  Object.assign(s, scope);
  for (const [name, fs] of Object.entries(spec.let ?? {})) s[name] = evalField(r, fs, s, `let.${name}`);
  const row = {};
  for (const [col, fs] of Object.entries(spec.row)) row[col] = evalField(r, fs, s, col);
  return row;
}

/** Project a catalog into rows — fixtures. No rng handle exists, so a draw tag is a hard error. */
export function projectRows(spec, items, extra) {
  return items.map((item, i) => renderRow(NO_DICE, spec, { item, i, ...extra }));
}

const NO_DICE = new Proxy({}, {
  get(_, k) {
    throw new Error(`projectRows: template tried to draw ('${String(k)}') — a fixture has no dice. `
      + 'Dice-bearing rows render through renderRow(r, …) inside the decision that owns the stream.');
  },
});

function evalField(r, fs, s, at) {
  if (fs === null || typeof fs !== 'object') return fs;                    // bare literal
  const tags = TAGS.filter((t) => t in fs);
  if (tags.length !== 1) {
    throw new Error(`template field '${at}': exactly one tag required, got [${tags.join(', ') || 'none'}] — two tags would make the draw order ambiguous`);
  }
  switch (tags[0]) {
    case 'const': return fs.const;
    case 'from': return resolve(s, fs.from, at);
    // fromOptional is NOT a relaxation of the strict read — it is a DECLARATION that this column
    // is nullable, which is a different statement. `?? null` scattered through code is invisible;
    // a declared-nullable column is greppable, and every one of them can be listed. It stays
    // narrow on purpose: absent → null. It cannot supply a non-null DEFAULT, because a defaulted
    // read (`f.aggregation ?? 'Count'`) is domain judgement, and that row stays handwritten.
    //
    // ONLY THE LAST SEGMENT MAY BE ABSENT, and the prefix must resolve to an object. Declaring a
    // column nullable says "this FIELD is sometimes missing" — it does not say "this path might
    // be nonsense". Without the prefix check, `{ fromOptional: 'itme.lengthMonths' }` returns
    // null for every row, forever, silently: a whole column of nulls that no gate can distinguish
    // from a column legitimately empty. That is the defensive-read trap this codebase bans
    // everywhere else — check-reads.mjs exists to forbid the same shape in the ruleset, and
    // `from` throws on undefined for precisely this reason. A nullable column should still be
    // spelled correctly, and a rename that orphans one should be loud.
    case 'fromOptional': {
      const path = fs.fromOptional.split('.');
      const leaf = path.pop();
      let cursor = s;
      for (const [depth, k] of path.entries()) {
        cursor = cursor?.[k];
        if (cursor === null || typeof cursor !== 'object') {
          throw new Error(`template field '${at}': fromOptional path '${fs.fromOptional}' broke at `
            + `'${path.slice(0, depth + 1).join('.')}' — only the FINAL segment may be absent. `
            + 'A nullable column is a declaration about one field, not permission for the path to be wrong.');
        }
      }
      const v = cursor[leaf];
      return v === undefined ? null : v;
    }
    case 'seq': return resolve(s, fs.seq, at);
    case 'fmt': return fs.fmt.replace(/\{([^}]+)\}/g, (_, p) => String(resolve(s, p, at)));
    case 'pick': return r.pick(resolve(s, fs.pick, at));
    case 'mix': return r.pickWeighted(Object.entries(resolve(s, fs.mix, at)));
    case 'chance': return r.bernoulli(numeric(fs.chance, s, at));
    case 'int': {
      const [lo, hi] = fs.int;
      if (typeof lo !== 'number' || typeof hi !== 'number') {
        throw new Error(`template field '${at}': int bounds must be CONSTANTS — a bound computed from row data is domain logic and stays handwritten`);
      }
      return r.int(lo, hi);
    }
    case 'date': {
      const d = addDays(parseDate(resolve(s, fs.date.anchor, at)), drawOffsetDays(r, fs.date.offset));
      const cap = fs.date.clamp ? resolve(s, fs.date.clamp, at) : null;
      return iso(cap && d > cap ? cap : d);
    }
  }
}

/** The ONE offset interpreter — derivedTransaction (patterns.mjs) delegates here.
 *  Draw sequences are byte-contract: const=0 draws; uniformDays=1; lognormalDays draws via
 *  r.lognormal (which shares the stream's Box–Muller spare state — streams migrate atomically);
 *  mixture = one pickWeighted, then the chosen band's own draws. */
export function drawOffsetDays(r, spec) {
  switch (spec.dist) {
    case 'const':
      return spec.days ?? 0;
    case 'uniformDays':
      return (spec.sign ?? 1) * r.int(spec.min, spec.max);
    case 'lognormalDays': {
      const raw = Math.round(r.lognormal(Math.log(spec.medianDays), spec.sigma));
      return Math.min(spec.capDays ?? Infinity, Math.max(spec.minDays ?? 1, raw));
    }
    case 'mixture':
      return drawOffsetDays(r, r.pickWeighted(spec.bands));
    default:
      throw new Error(`drawOffsetDays: unknown offset dist '${spec.dist}'`);
  }
}

function resolve(s, path, at) {
  const v = path.split('.').reduce((o, k) => o?.[k], s);
  if (v === undefined) {
    throw new Error(`template field '${at}': path '${path}' resolved to undefined — a template read must hit a real value (a rename reaching here as silence is the defensive-read trap all over again)`);
  }
  return v;
}

const numeric = (v, s, at) => (typeof v === 'number' ? v : resolve(s, v, at));
