# datagen — walking-skeleton generator (prototype)

**What this is:** the prototype implementation of
[ruleset-spec.md](../plans/association-db/ruleset-spec.md), covering the vertical slice (member → membership periods → event registrations → orders → payments). It exists to prove the architecture —
calibrated causal generation, deterministic substreams, texture with variance floors,
per-app pack emission, and the validation harness — **before** the reconciliation and
causal-map sessions, so their outputs land in a running machine instead of a document.

**What this is NOT:** production code. Zero dependencies, plain Node (≥ 20), deliberately
outside `packages/*` (no workspace/publishing ceremony while the design moves). The
`morecheese_*` shapes are FROZEN into the app's baseline migration (2026-07-14); the
bizapps dependencies are declared in `mj-app.json`.

**Structure (framework rungs 2–3 — see [FRAMEWORK.md](FRAMEWORK.md)):** three roles, three
directories.

```
datagen/
  engine/               the framework — domain-blind, knows nothing about cheese
                        (dice, calibration, the five pattern executors, compiler,
                        linter, pack machinery, IDs, project loading)
  projects/morecheese/  a PROJECT built on the engine — one generated universe:
                        its domain modules, name banks, and ruleset/. A second
                        universe is just a second projects/<name>/ directory.
  cli/                  the commands (generate, build, validate, demo, explain,
                        emit-sql, emit-schema, emit-mjsync) — each takes --project
  test.mjs              the regression suite
```

The engine is the reusable part; a project plugs into it by exporting two things
(`hooks` + `buildWorld`) from its `index.mjs`, and the commands drive the whole thing.
**Every calibrated decision runs through the five declarative patterns in
`engine/patterns.mjs`** (annualParticipation, childOutcome, recurringDecision,
staticAssignment, derivedTransaction) — each migration proven byte-identical to the
hand-written version it replaced. Only genuinely non-pattern code stays hand-written in the
project (NegBin volume, event fixtures, hero pinning).

## New here? The 30-minute path

1. **Run it first** (the build command, below) — watching the full gate battery go green beats reading.
2. **Read the recipe in English:** [`projects/morecheese/ruleset/RULESET.md`](projects/morecheese/ruleset/RULESET.md) — every rule as
   a sentence with its effect in percentage points. Then the concepts:
   [`HOW-IT-WORKS.md`](HOW-IT-WORKS.md) — causality, calibration, β, the baseline, and what
   "trainable" honestly means, in plain language.
3. **Open the inspector** (`out/dashboard.html`): click a member, see their whole life;
   the Causal tab shows the hidden dials expressing in behavior.
4. **Read one module deeply:** [`projects/morecheese/membership.mjs`](projects/morecheese/membership.mjs) — the renewal
   unroll is the heart; its header comment explains score → calibrate → draw, and it shows
   the core/domain split: the pattern (`recurringDecision`) owns calibration, pinning, and
   dice; the domain owns eligibility, scoring, and the state machine.
5. **Then the contract:** [`../plans/association-db/ruleset-spec.md`](../plans/association-db/ruleset-spec.md)
   — why it's built this way (calibration rule, determinism, texture, the gates).
6. Everything else via the code map below, in order.

## Run

```sh
node datagen/cli/build.mjs --n 500 --seed 42 --release 2026-07-31 --demo   # the normal path
```

`build.mjs` is the pipeline: generate into staging → validate there → **promote to `out/`
only on green** (a red run leaves the last good build untouched and parks the failing output
in `out-failed/` with its report). `--demo` also rebuilds the inspector. The pieces run
individually too:

```sh
node datagen/cli/generate.mjs --n 500 --seed 42 --release 2026-07-31
node datagen/cli/validate.mjs      # exit 0 = all gates pass
node datagen/cli/demo.mjs          # → out/dashboard.html (self-contained, works offline)
```

Same `--seed` + `--release` → byte-identical output (`out/` is git-ignored).

## Code map (read in this order)

| File | What it does |
|---|---|
| `projects/<p>/ruleset/modules/` | **The recipe, modular** — one module per app domain (`core` = shared substrate: latents, cohorts, texture; then one module per domain through `programs`, `defects` — labeled record corruption with a DataQualityLabel answer sheet, `motifs` — stamped story templates, and `heroes`), composed in the order `index.json` declares. Mirrors the D9 pack pyramid: adding a new app (e.g. forms) = adding one module. Rules can be authored in **human units** (`"liftPts": 12`, `"groupTarget": 0.65`), qualitative bands, or raw β; factors can DECLARE their feature (`"feature": {"from": "self", ...}`) and the validator auto-derives their recovery gates; tier rules (`tiers.assign`) and payment timing (`paymentProfiles`) are authored here too, not coded. |
| `projects/<p>/ruleset/RULESET.md` | **The recipe in plain English** — auto-generated by `explain.mjs`; every effect in percentage points with its authored form and evidence. Regenerate after module changes; never hand-edit. |
| `BIZAPPS-COVERAGE.md` | **What ships into which bizapps schema** — the per-app coverage matrix, shape sources (their baseline migrations), verification evidence (install, FK trust, CHECK conformance, entity names, sync round-trip), and the known limits. |
| `HOW-IT-WORKS.md` | **The concepts, explained simply** — causality by construction, the calibration guessing-game, what β and the baseline mean, heroes-as-conditioning, and the recovery-not-discovery honesty about trainability. |
| `engine/compile.mjs` | **The rule compiler** — translates human/qualitative forms into βs: analytic solve + an empirical refinement loop that runs the real generator on a reference world until the stated effect measurably holds. Deterministic. |
| `cli/generate.mjs` | Project-generic entrypoint: loads `projects/<p>/index.mjs`, calls its `buildWorld(cfg)`, emits packs. |
| `projects/morecheese/index.mjs` | The project's pipeline as a table of contents — the causal build order, one module per step; also re-exports the project's hooks. |
| `projects/morecheese/world.mjs` | Step 1–2: orgs (with lifecycle events) + people (with the two hidden dials); heroes pinned. |
| `engine/patterns.mjs` | **The declarative pattern executor (rung 3)** — the five patterns every calibrated decision runs through; core owns calibration, tide-not-boats baseline shifts, hero pinning, and the named dice. |
| `projects/morecheese/membership.mjs` | Step 3: the renewal unroll via `recurringDecision` — score → **calibrate** → draw, year by year; grace/back-dating rules; the archive rule. |
| `projects/morecheese/events.mjs` | Step 4: events + registrations; conference attendance via `annualParticipation`, no-show via `childOutcome` (selection-effect calibration over the actual registrant pool). |
| `projects/morecheese/committees.mjs` / `forms.mjs` | Composed bizapps slices: committee service + meeting attendance, and the post-conference survey (both `childOutcome`), targeting bizapps-committees'/bizapps-forms' REAL shapes — NPS correlates with renewal because both ride the engagement dial. |
| `projects/morecheese/money.mjs` | Step 5: the money chain via `derivedTransaction` — one order per billable fact (order-per-cycle, per bizapps-orders design), payment timing DECLARED in `orders.paymentProfiles`, real A/R aging, the open renewal-order queue. |
| `projects/<p>/ruleset/scenarios/` | **Parameter overlays on the same causal model** — `--scenario decliningOrg` rebuilds the world at ~78% renewal (real craft-food decline curves); compiler and validator re-target automatically. |
| `engine/packs.mjs` | Step 8: deal finished rows into per-app packs with manifests; strip the latents. |
| `cli/validate.mjs` | **The inspector** — seven named gate groups (packs, temporal, benchmarks, arrows, trainability, heroes, status mix). |
| `cli/build.mjs` | **The pipeline** — generate → validate on staging → promote to `out/` only on green; red runs park in `out-failed/`. |
| `cli/emit-sql.mjs` | **SQL seed emitter** — packs → per-pack `.sql` `INSERT`s with **deterministic real UUIDs** (uuidv5 of the business key; FKs derived independently by parent and child). Pure inserts; assumes the tables exist. Table names are ASSUMED shapes until the reconciliation. |
| `cli/emit-schema.mjs` | **Provisional schema emitter** — `CREATE SCHEMA` + `CREATE TABLE` DDL (→ `out/sql/00_schema.sql`, runs before the seed packs) so you can stand up a **standalone throwaway demo DB** without waiting on Marcelo's authoritative migrations. Assumed shapes, clearly labeled; no `__mj_*` columns. A `test.mjs` guard asserts the DDL covers every column `emit-sql` inserts, so the two can't drift. |
| `cli/emit-mjsync.mjs` | **mj-sync emitter** — packs → an MJ metadata tree (per `docs/template-docs/metadata.md`): folder per entity, records with **pinned primaryKeys**, directoryOrder = the pack pyramid. Same UUIDs as the SQL emitter, so either load path fills identical rows. Defaults to `out/metadata/`; **`--metadata-out <dir>`** writes into the repo's live `metadata/` tree (e.g. a dedicated `metadata/demo-data/`) for a real `mj sync` — only its own entity folders are cleared on regen, so a sibling like `schema-info/` is safe. Entity names ASSUMED; ⚠ `mj sync push` full-reconciles — dev DBs only. |
| `engine/ids.mjs` | Deterministic UUIDv5 from business keys — shared by both emitters. |
| `engine/rng.mjs` | The dice: content-addressed substreams, distributions, the intercept solver. |
| `engine/stats.mjs` | The inspector's math: logistic regression with standard errors. |
| `engine/config.mjs` / `projects/morecheese/banks.mjs` | CLI args + project loading + ruleset compose/compile / the AUTHORED name banks (`banks/*.json` — safety-cleared components, dealt without replacement from their own dice streams; see `plans/association-db/research/name-banks-research.md`) + cities + segment mix. |

Refactors are provably safe here: regenerate with the same seed and `diff -r` the output —
determinism means "byte-identical or you broke something."

## What it produces

`out/packs/{common,membership,events,learning,orders,committees,forms}/` — one folder per app pack (D9: cook once, portion
at the end), each with table JSON files + a `manifest.json` declaring `dependsOn`. The
validator checks referential closure per pack layer, exactly like the future install-time
check.

The emitters turn those packs into loadable artifacts:
- **`out/sql/`** — `00_schema.sql` (provisional `CREATE TABLE` DDL, `emit-schema`) then
  `01…05_<pack>.sql` (`INSERT` seeds, `emit-sql`), plus `_install-order.txt`. Run in order
  against a throwaway SQL Server DB to stand up a full standalone demo database.
- **`out/metadata/`** (or a `--metadata-out` target) — the mj-sync tree (`emit-mjsync`) to
  push into an MJ dev database. Same deterministic UUIDs as the SQL path, so both fill
  identical rows.

## Assumptions carried (swap when the sessions answer)

- **Table shapes are provisional but informed** (2026-07-10: bizapps-orders' public design
  was read — see RECONCILIATION-ASKS' findings banner). `membership_periods` is the
  **July-31 shipping shape** AND the intermediate for the eventual decomposition into
  bizapps-orders' canonical form: one `Subscription` per member spawning a renewal `Order`
  per cycle. Our Lapsed/PendingRenewal statuses, grace mechanics, and AutoRenew flag are
  domain rules their design doesn't model — we layer them, and they later express through
  the `SubscriptionEvent` stream.
- **D6 assumed ratified**: 70% calendar-year / 30% anniversary cohort; Marcus Chen pinned in
  the anniversary cohort with auto-renew off.
- **Effect sizes are the causal-map draft values**, not workshop-agreed ones.
- Latents (`_theta`, `_phi`) are stripped before pack emission; `validation-events.json`
  retains them for the harness only and is never installed.

## What the validator gates (ruleset-spec §7)

Benchmark means + tolerance · yearly-band + **variance floor** (anti-smoothness) · sign AND
magnitude recovery per arrow (logistic refit on observables — note: the engagement arrow is
checked via a behavioral proxy and is attenuated by design) · trainability (rank-ordering
lift at N-appropriate scale) · temporal/referential integrity (grace mechanics, no-gap
back-dating, registrations inside membership windows) · hero pins (Elena, Marcus) · pack
manifests + cross-pack reference closure · status mix.
