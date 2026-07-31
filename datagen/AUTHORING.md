# Authoring MoreCheese data — the cookbook

> Struggling to picture the system at all? Read [`TOUR.md`](TOUR.md) first — the same
> material as a plain-English factory tour, with the protections and a slow worked example.

The other docs explain what this system **is** (FRAMEWORK, HOW-IT-WORKS) and how it
**ships** (DELIVERY, INTEGRATION-RUNBOOK). This one explains how to **change the data** —
the thing you actually came here to do.

Every recipe below was executed for real at least once; the gotchas are things that
actually bit, not things that might.

## The one rule that keeps you safe

| layer | policy |
|---|---|
| `projects/morecheese/ruleset/modules/*.json` | **safe to edit** — this is the authoring surface |
| `projects/morecheese/*.mjs` | **copy an existing module** — never invent idiom |
| `engine/` | **don't touch** — the causal machinery (calibration, rng, compile) is the hard part and no data change needs it |

And the verification ladder, in increasing order of truth:

1. `node cli/build.mjs --n 500 --seed 42 --release 2026-07-31` — gates green?
2. `node test.mjs` — all 7 seeds + determinism + N=2500 + emitters + contract?
3. `mj sync push` into a dev DB — **the only step that resolves `@lookup:` references**
4. Open the app UIs over the pushed data — **the only step that catches "looks wrong"**

Steps 1–2 said the data was fine on the day a push failed with 3,191 lookup errors and a
grid full of "Calle Mill" street names. Do not skip 3 and 4 for anything user-visible.

---

## Recipe 1 — tune a number

*Examples: renewal share, event volume, a price, a severity mix.*

1. Find the number in `ruleset/modules/*.json`. Every constant has a `$note` sibling
   saying what it means; estimates are marked `ESTIMATE`.
2. Change it. Keep the `$note` honest — if you replace an estimate with a sourced figure,
   say where it came from.
3. Rebuild (`build.mjs`). If a gate goes red, **read the gate before loosening it** — the
   bands encode team rulings (renewal 87%±2, statusMix, variance floors). A red gate
   usually means your number contradicts an authored fact elsewhere.

That's it. No code. This tier is safe for anyone — and a typo'd edit (a share of 15
instead of 0.15, a broken bracket) now fails at LOAD time with the offending path or file
named, not mid-generation with a stack trace.

**Gotcha — calibrated shares:** many shares (committee participation, certification
pursuit) pass through `childOutcome`, which *calibrates to the target over the eligible
pool*. Raising a count elsewhere can silently thin what this share fills. Real case:
adding committees without raising `participation.shareOfEligible` produced committees of
one — the same volunteers spread thinner.

## Recipe 2 — extend an existing domain

*Examples: a new committee, product, event type, course, notification, saved view.*

1. Add the entry to the module's list in the ruleset, in the file's own style. Authored
   content (names, missions, SQL, message text) is content — write it like a human, not
   a template.
2. Check the **dependents**: does anything derive from this list?
   - committees → terms, seats, meetings, votes all scale with it (see Recipe 1 gotcha)
   - products → the money chain prices by `ProductType`, which is CHECK-constrained
   - saved views/queries → **run the SQL against a real DB before committing.** A query
     is text to every gate; `vwEvents.Year` shipped as a column that didn't exist and
     only running it caught that.
3. Rebuild; fix any gate that correctly notices the world changed (counts, mixes).
4. If the entry references an app-seeded lookup (committee Role, IssueStatus, ContactType,
   AddressType): **reference by NAME, never by an ID you mint** (finding F6), and check
   the exact seeded string in `contract/schema-contract.json` — the real names are
   `Mobile Phone` and `Work Phone`, *with spaces*, and the gate 6d contract check exists
   because guessing them wrong once cost a 13-minute failed install.

**Gotcha — statuses and categories:** if you add a *value* (a new period status, a new
severity), grep the validator for every gate that partitions by that field, and add a
**presence floor** (`count >= 1`), not just a share band. Share-with-tolerance gates pass
happily on zero — `Critical: 0.0% vs 1.7% ±12.2 ✅` was green while the bucket was empty.

## Recipe 3 — add a new domain (the full loop)

*Examples that exist to copy: `contacts.mjs` (projection domain), `prospects.mjs`
(population domain), `funnel.mjs` (history-backfill domain), `programs.mjs` (multi-table).*

This is the tier that today needs care. The checklist, in order:

1. **Ruleset block** — a new key in the right module (or a new module registered in
   `index.json`), constants marked `ESTIMATE`, one `$note` per constant.
2. **Generator module** — copy the closest existing one. House idioms that are load-bearing:
   - one rng stream per decision, keyed by business key: `rng(seed, 'thing:' + key)`
   - `pick`/`pickWeighted`/`bernoulli`/`int` cost **one draw each regardless of list size**;
     never make draw COUNT depend on data, or every seed downstream shifts
   - engagement-driven participation goes through `childOutcome` (it calibrates the share)
   - internal fields start with `_` — they're stripped before emit
   - business keys are strings with a stable format; they become UUIDs via
     `uuidFor(prefix, key)` — register the prefix in DATA-CONTRACT.md's table
3. **Wire into `index.mjs`** — call in pipeline order (§5 of ruleset-spec: a domain must
   be built after everything it reads), add tables to the pack map.
4. **The mapping — ONE entry in `engine/seed-mapping.mjs`** (consolidated 2026-07-31; the
   same tables were previously mapped again inside emit-mjsync, and the copies drifted —
   one wrong word there once failed 3,191 records at push). Each entry carries:
   - `json`, `table` and a `columns(r)` projection — the formatters are dual-mode, so the
     SAME entry renders SQL literals *and* the MetadataSync record (`renderRecord`)
   - `dir` + `entity` — the MetadataSync folder and entity name (omit both for an
     INSERT-only pack like platform)
   - by-name lookups (F6): the `sqlVar('@X')` you write resolves on the SQL path via a
     PREAMBLE DECLARE and on the sync path via `VAR_TO_LOOKUP` — add your variable to
     BOTH, or the emit throws with the variable's name
   - delivery quirks, spelled on the entry: `syncPk` (non-ID primary key), `syncOmit`
     (SQL-only columns), `syncOverride` (e.g. Sonar's deferred circular FK)
   Then add the new `dir`s to `DIRECTORY_ORDER` in `cli/emit-mjsync.mjs` in FK-safe push
   order — the emitter fails loudly if the list and the mapping disagree.
   `cli/emit-schema.mjs` (the playground shim DDL) is still separate on purpose: it
   carries column types the mapping doesn't, and the DDL-drift gate polices it.
5. **Gates** — minimum set for a new domain, each a one-line helper call from
   `engine/gates.mjs`: `fkResolves` both directions, `shareBand` for anything drawn from a
   weighted list **plus `presenceFloor` for rare categories** (a share band passes happily
   on zero), and one bespoke gate asserting the domain's reason-to-exist (the funnel's
   conversion-rate gate is the model: it asserts the *question the domain answers* is
   answerable).
6. **Contract** — if you touch a dependency app's table, re-capture:
   `MJ_SA_PASSWORD=… node cli/capture-contract.mjs --db <install>`.
7. **Verify up the whole ladder** (build → test.mjs → push → render). Then re-emit what
   ships: `emit-mjsync --metadata-out ../metadata` and `emit-data-migration.mjs`, and
   note that the big MetadataSync p01/p02 migrations are a *captured push*, not generated
   — they go stale silently (INTEGRATION-RUNBOOK, addendum 2026-07-28, has the loop).

**Gotcha — the two populations:** `people` in the validator means MEMBERS; non-members
are `prospects`. New gates must pick the right population or they'll quietly change
meaning — that separation is what kept 200 existing gates honest when non-members landed.

**Gotcha — scenario scale:** size populations off the roster actually shipped, not off
`cfg.n`. The declining-org scenario archives members away; anything pinned to `n` becomes
a too-large share of a smaller world (this failed once, in `test.mjs`, exactly this way).

## Style rules that make the data feel real

- **Deterministic always**: no `Date.now()`, no unkeyed randomness. Same seed = same bytes.
- **Content over templates**: 8 title templates for 108 tickets was spotted in seconds.
  Banks should be big enough that repetition isn't visible on one screen.
- **Blanks correlate with nothing**: a null column that lines up perfectly with some other
  fact (every non-member had a null Title) reads as generated. Voluntary fields should be
  *sparse for a reason* (tenure, never-asked) — see `identityFor`'s `answeredShare`.
- **Localise wholes, not halves**: "Calle Mill" is not a street in any language. If a
  format is per-country (streets, phones, postal codes), the whole value must be.
- **Fake URLs are worse than none**: `PhotoURL` stays null on purpose — broken images
  read worse than blanks.

## Known sharp edges (candidates for the next simplification pass)

1. ~~The emitter mapping exists three times.~~ **Fixed 2026-07-31**: one mapping in
   `seed-mapping.mjs`, rendered to both delivery paths (see Recipe 3 step 4). The refactor
   was proven by byte-diffing the SQL outputs and semantically diffing all 122k metadata
   records against pre-consolidation baselines — and it surfaced two latent bugs on the
   way: a missing `MJ_ENTITY_VAR` entry that had been rendering an EMPTY value slot in the
   sonar SQL, and a root-file rewrite that silently dropped the hand-added Betty dirs from
   the push order.
2. ~~The ruleset has no schema.~~ **Fixed 2026-07-31**: the lint that already ran on every
   load (`engine/lint.mjs`) now also catches the human typo classes — a share of 1.4, a
   negative weight in a weighted list, a zero tolerance, a hero pointing at a committee or
   credential that doesn't exist, and a broken module now names its FILE instead of dying
   with a bare 'Unexpected token'. Negative-tested in `test.mjs`: five planted defects must
   each be caught BY NAME, and the clean ruleset must stay quiet.
3. ~~validate.mjs is 1,600+ lines of bespoke checks.~~ **Fixed 2026-07-31**: the five
   repeating shapes live in `engine/gates.mjs` (`fkResolves`, `shareBand`, `presenceFloor`,
   `distinctAtLeast`, `dangling`), negative-tested in the suite. New gates should be a
   helper call; the six pack-refs FK gates are the converted exemplars (report-identical).
   Existing prose-style gates were deliberately left — their wording carries the story.
