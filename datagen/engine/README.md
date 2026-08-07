# The engine — what it is, and what it asks of a project

`engine/` generates data for **any** project. It knows nothing about cheese, associations, or
MoreCheese. That claim is checked, not asserted: `node cli/check-engine-boundary.mjs` fails if any
engine module statically imports project code or names a project in code.

The one exception is `DEFAULT_PROJECT` in `config.mjs` — the project a bare CLI call uses when you
don't pass `--project`. It's a convenience default, not a dependency.

---

## What a project must provide

A project is a directory under `projects/<name>/`. The engine loads it **by name, dynamically**, so
nothing in the engine needs to know it exists.

| required | where | what it is |
|---|---|---|
| `buildWorld(cfg)` | `index.mjs` | the pipeline: build every domain, in causal order, return named bags |
| `buildPacks(world)` | `index.mjs` | the pack map — `dependsOn` + `tables` per installable pack |
| `UUID_NAMESPACE` | `index.mjs` | 32 hex chars, `uuidgen` once, **frozen forever** |
| `hooks` | `index.mjs` | `compile.arrowsOf(C)` (may return `{}`) and `domainLint(R)` — **which must return an ARRAY** of problem strings; returning nothing dies as "not iterable" |
| `scale.members` | any ruleset module | the engine's default for `cfg.n` when `--n` is not passed |
| `history.startYear` | any ruleset module | the first year `yearsOf(cfg)` walks |
| `version` | any ruleset module | written into every pack manifest and generated header |
| `ruleset/modules/*.mjs` + `index.json` | `ruleset/` | the authored declarations: `catalog` · `params` · `effects` · `mixes` |

| optional — each one *earns* checks | where | what you get |
|---|---|---|
| `NOT_SHIPPED` | `index.mjs` | permission for a generated table to ship nowhere, **with a reason** |
| `refs.mjs` | project root | dangling-reference gates, install-order gates, polymorphic-kind coverage |
| `presence.mjs` | project root | a floor per mix option — every declared category must actually appear |
| `measurements.mjs` | project root | derived target bands from `{ target, tolerance }` pairs |
| `pipeline.mjs` | project root | declared mutation-order edges the argument lists can't show |
| `seed-mapping.mjs` | project root | how packs become SQL / MetadataSync. Exports `MAPPING`, `INSTALL_ORDER`, `PREAMBLE`, `POSTAMBLE`, **`PUSH_ORDER`** (directory push order, parents first — separate from INSTALL_ORDER) and **`DISPLAY_NAME`** |
| `VALIDATOR` | `index.mjs` | what `build.mjs` runs to validate. **Resolved in your project directory first**, so write `projects/<name>/validate.mjs` and declare it — see `projects/fixture/validate.mjs` for the pattern (engine's derived gates + only what a declaration cannot say). A `cli/` script name also works. **Default: `check-declared.mjs`**, so you get references, install order, presence floors and target bands without writing a gate |
| `LATENTS_OF(world)` | `index.mjs` | writes `validation-latents.json` — WHICH hidden dials exist is your model, not the engine's |
| `RUN_EXTRAS(cfg)` | `index.mjs` | extra facts recorded in `run.json` (MoreCheese records its covid years) |
| `SUMMARY_OF(world)` | `index.mjs` | the lines printed after a build; without it the engine just counts rows |

A project with none of the optional files still generates and still gets the coverage gates — which
will tell it what it's missing. That's the right first message on day one.

## What the engine gives back

| | |
|---|---|
| `patterns.mjs` | the five decision patterns: `annualParticipation`, `recurringDecision`, `childOutcome`, `derivedTransaction`, `staticAssignment` |
| `row-template.mjs` | declarative row shapes (`renderRow` / `projectRows`) and the one offset interpreter |
| `authoring.mjs` | the setup helpers: `yearsOf`, `thetaAt`, `coverageOf`, `indexBy`, `stripInternals` |
| `rng.mjs` | seeded substreams — one per decision; `enableStreamAudit()` to check that rule |
| `checks.mjs` / `derived-checks.mjs` | gates generated from declarations, in phases |
| `packs.mjs` | pack emission, plus the contract: nothing unshipped, no internals leaked |
| `compile.mjs` | solves human-authored effects into coefficients |
| `ids.mjs`, `dates.mjs`, `lint.mjs`, `gates.mjs`, `schema-check.mjs` | the rest of the surface |

## The run context every generator receives

`cfg` is built once by `loadConfig` and passed to every generator. Eight fields, and the first four
are the determinism contract — same `R` + same `seed` + same `release` → byte-identical output.

| field | what it is |
|---|---|
| `R` | the **composed, compiled** ruleset: modules merged, any scenario overlay applied, human effect forms solved into betas. Conventionally destructured as `R` |
| `seed` | the master seed, a **string** (`'42'`), combined with every stream key |
| `n` | population size — `--n`, else `ruleset.scale.members` |
| `release` | the generated world's "today", as a `Date`. **There is no wall clock anywhere in datagen** — every "days ago" measures from here, which is why last week's build and today's are identical |
| `releaseYear` | `release.getUTCFullYear()`, precomputed because nearly every generator needs it |
| `project` | which project is being built |
| `scenario` | the overlay name, or `null` |
| `outDir` | where output goes. **The emitter's business — no generator should touch it**, and none does |

Full types in `engine/types.d.ts` (`interface Config`).

## The invariants the engine enforces on every project

1. **Determinism.** Same spec + same seed → byte-identical output. Everything else is subordinate.
2. **One dice stream per decision**, and draw order within a stream never changes.
3. **Nothing generated ships nowhere** — unpacked tables are a hard error at emit.
4. **No generator-internal field reaches a pack** — `_`-prefixed fields are refused at emit.
5. **Declaring earns a check.** A `{ target, tolerance }` pair fails the build until measured.
6. **The engine holds no project's values.** Checked by `cli/check-engine-boundary.mjs`.

## Standing up a new project

The honest test of all of the above is whether a second project needs zero engine edits. The
procedure:

1. `mkdir projects/<name>` with an `index.mjs` exporting the five required things.
2. `uuidgen`, strip the dashes, export it as `UUID_NAMESPACE`. Never change it again.
3. Write `ruleset/modules/<domain>.mjs` blocks in the four-section shape, and an `index.json`.
4. Write thin generators: one pattern call per decision, row templates for the shapes.
5. Add declarations as you want the checks: `refs.mjs`, `presence.mjs`, `measurements.mjs`.
6. `node cli/build.mjs --project <name> --n 100 --seed 42 --release <date>` — stages, validates with
   `check-declared.mjs`, promotes to `out-<name>/` (the default project keeps plain `out/`).
7. Optional, to install: add `seed-mapping.mjs`, then `emit-sql.mjs` / `emit-mjsync.mjs --out out-<name>`.
8. Optional: `ruleset/scenarios/<name>.json` overlays, run with `--scenario <name>`. They may only
   OVERRIDE keys the base ruleset already has — a typo is rejected, never merged.

If any step forces an engine change, that's a MoreCheese-shaped assumption in the engine and it is
a bug in the engine — not in your project.

**This has been done.** `projects/fixture/` is a second project built exactly this way, and
[its FINDINGS.md](../projects/fixture/FINDINGS.md) lists the six things that had to change before it
worked: three engine bugs and two documentation gaps, none of which were visible from inside
MoreCheese. The suite now builds it on every run, so an engine change that re-couples the engine to
one project fails immediately instead of silently.
