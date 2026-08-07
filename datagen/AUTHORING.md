# Authoring MoreCheese data — the cookbook

> **This document is the scars.** The other three authoring docs are the paths:
> [`CONTRACT.md`](CONTRACT.md) to change a number or a list,
> [`ADDING-A-DOMAIN.md`](ADDING-A-DOMAIN.md) to add a whole domain,
> [`TOUR.md`](TOUR.md) if you cannot picture the system yet.
>
> What lives *here* and nowhere else: the editor setup that makes the ruleset self-describing,
> the verification ladder and why steps 3 and 4 are not optional, the gotchas each recipe
> actually hit, the delivery steps a new domain owes once it generates, and the style rules that
> decide whether the data reads as real or as generated.

Every recipe below was executed for real at least once; the gotchas are things that
actually bit, not things that might.

## Before you start: let the editor answer your questions

Open the repository at its root in VS Code (or any editor that reads `json.schemas`) and the
ruleset becomes self-describing. You do not have to hold this document in your head:

| what you do | what you get |
|---|---|
| `Ctrl`/`Cmd`+`Space` on a blank line at the top of a module | the list of blocks — `membership`, `events`, `committees`, … each with a one-line description |
| hover any key | what it means, in prose, plus the trap if it has one |
| type `attendShare: 45` | an immediate red squiggle: *45 is above the maximum 1* |
| write an `effects` entry | it insists on exactly one effect form **and** a stated reason |

That comes from [`engine/ruleset.schema.json`](engine/ruleset.schema.json), wired up in
[`.vscode/settings.json`](../.vscode/settings.json). The same schema is **executed** by
`node cli/check-ruleset-schema.mjs` in the suite, so what the editor promises and what the
build enforces cannot drift apart.

The generator side is typed too: hovering `cfg`, `R` or a dice handle inside a
`projects/*/**.mjs` file gives you the real shape, and opening a pattern's options object
lists the options it takes. Those declarations live in
[`engine/types.d.ts`](engine/types.d.ts) and cost nothing at runtime — datagen still ships as
plain `.mjs` with no build step and no dependencies.

Neither of these replaces reading the recipes below. They just mean you can start typing
before you have finished reading.

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

## Recipe 3 — ship a new domain (the delivery half)

> **The generation half is [`ADDING-A-DOMAIN.md`](ADDING-A-DOMAIN.md)** — is it a domain, which of
> the five patterns each decision is, the ruleset block, the generator contract, declaring the
> checks. Walk that document first; it was executed end to end before it was written down.
>
> What follows is what it does not cover: **getting the rows out of the packs and into a
> database.** A domain that generates perfectly and is mapped nowhere is invisible — the build
> passes, every gate passes, and the data simply is not there.

*Examples that exist to copy: `contacts.mjs` (projection domain), `prospects.mjs`
(population domain), `funnel.mjs` (history-backfill domain), `programs.mjs` (multi-table).*

Picking up from ADDING-A-DOMAIN.md's step 7, with your generator written and its gates declared:

1. **Business keys become UUIDs** via `uuidFor(prefix, key)`. Pick a prefix nothing else uses and
   **add it to [`DATA-CONTRACT.md`](DATA-CONTRACT.md)'s identity table** with its key format — that
   table is the promise that an integrator can compute any row's ID without reading this code, and
   a prefix missing from it silently breaks that promise for your whole domain.
2. **The mapping — ONE entry in `projects/<p>/seed-mapping.mjs`** (consolidated 2026-07-31; the
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
   `projects/morecheese/emit-schema.mjs` (the playground shim DDL) is still separate on purpose: it
   carries column types the mapping doesn't, and the DDL-drift gate polices it.
3. **Contract** — if you touch a dependency app's table, re-capture:
   `MJ_SA_PASSWORD=… node cli/capture-contract.mjs --db <install>`.
4. **Verify up the whole ladder** (build → test.mjs → push → render). Then re-emit what
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

## The sharp edge that is still sharp

Four were listed here. Three are fixed and their entries have been removed — a document is not a
changelog, and `git log` keeps that history better than a page of struck-through text does. What
was fixed, briefly, so the names still mean something: the emitter mapping was consolidated into
one `seed-mapping.mjs` entry per table, the ruleset gained a machine-readable editor-wired schema
plus load-time lint, and `validate.mjs`'s five repeating gate shapes moved into `engine/gates.mjs`.

**The vocabulary is still a dialect rather than a standard.** The same idea is spelled `target` /
`presentTarget` / `shareOfEligible` in different blocks, a Mix may be an object map or a pair-array,
`statusMix` is not a Mix at all, and `rng.pickWeighted` accepts only the pair form.
[`engine/ruleset.schema.json`](engine/ruleset.schema.json) *describes* that inconsistency honestly,
traps included, but describing is not removing. Removing it means renaming keys across nineteen
modules — a migration, not a description — proposed with its open decisions in
[`TYPES-PROPOSAL.md`](TYPES-PROPOSAL.md).

**Team ruling (2026-07-31): that migration waits for a second project to exist**, so the vocabulary
is generalised from two data points instead of guessed from one. That precondition is now met —
`projects/fixture/` exists — and **stage 2 (canonicalise) shipped 2026-08-05**. Stage 3 (enforce
the canonical spellings from the schema) remains open, which is why the dialect described above is
still what you will meet in the modules. Current status is tracked in TYPES-PROPOSAL's own status
block, not here, so the two cannot drift.
