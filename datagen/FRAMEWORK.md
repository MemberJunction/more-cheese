# The Datagen Framework — Plan & Progress

**The idea:** what MoreCheese proved as one application becomes a reusable engine — any
MJ app team gets calibrated, causal, deterministic demo data by *authoring ruleset modules*,
not by writing generators. The formula is the generative-data lead's `Generate(X, S, seed, scale)`; MoreCheese
is the running proof of the bottom half.

**The test that defines "framework":** can a second project be added with ruleset declarations +
minimal hooks, no new pipeline code?

> ## ✅ ANSWERED 2026-08-04 — and the answer cost thirteen fixes
>
> `projects/fixture/` is that second project: ~120 lines, one decision, CI-only, never shipped. It
> now runs the WHOLE pipeline — generate → validate (its own validator) → promote → SQL →
> MetadataSync → a scenario overlay — and the suite builds it on every run, so the claim cannot
> quietly rot.
>
> **Standing it up failed thirteen times**, eight of them engine bugs invisible from inside
> MoreCheese because from inside MoreCheese each was simply true: the documented
> `build.mjs --project <name>` could not run at all; output dirs were global, so building it
> destroyed MoreCheese's promoted build; an emitter held a hardcoded list of 59 MoreCheese
> directories. The full account, including what did NOT break (the five patterns, row templates,
> derived checks and the pack contract all worked unchanged on first use), is
> [`projects/fixture/FINDINGS.md`](projects/fixture/FINDINGS.md).
>
> **What "framework" is now true of**, all machine-checked: the engine names no project and imports
> none (`cli/check-engine-boundary.mjs`); a second project needs zero engine edits (the suite);
> declarations earn their own gates. **What it is not true of, and never will be:** the ~175 bespoke
> validator gates carrying domain knowledge no declaration can state, and the ~45% of generator code
> that is irreducible judgement. Both are documented where they live.
>
> The rungs below are kept as the record of how it got here. Read them as history, not as a plan.

---

## The ladder

| Rung | What | Status |
|---|---|---|
| 1 | Engine + one hand-built domain (walking skeleton) | ✅ done (`datagen-walking-skeleton`) |
| 2 | **Extraction**: `engine/` (domain-blind framework) vs `projects/morecheese/` (a project) vs `cli/` (the commands) | ✅ this branch — byte-identical proof; hardened into the engine/projects/cli layout (one directory per generated universe, `--project` on every command) |
| 3 | **Declarative patterns**: domains declare generation patterns; a generic executor interprets them | ✅ this branch: all five patterns live and every instance migrated — learning, tier assignment, the renewal unroll, the money chain, conference attendance, and event no-show (each byte-identical). Only genuinely non-pattern code stays hand-written (NegBin volume, event fixtures, hero pinning) |
| 4 | **Schema-driven (`S`)**: read MJ `EntityInfo` for entities/FKs/value lists; emitters self-configure | ⬜ needs the reconciliation + CodeGen (real entities) |
| 5 | **Authoring loop**: AI drafts modules from `S` + benchmarks, builds, reads gates, iterates | ⬜ the containment (gates, holdout view, lint) already exists |

## What lives where (rungs 2–3): engine / projects / cli

Three roles, three directories — the layout IS the architecture. The engine is the reusable
framework; a project plugs in by exporting `hooks` + `buildWorld`; the cli drives it.

```
datagen/
  engine/               ← THE FRAMEWORK: NOTHING in here knows about cheese
    rng.mjs             dice, distributions, the calibration solver
    dates.mjs           date arithmetic
    stats.mjs           logistic recovery with SEs
    compile.mjs         human forms → β (takes PROJECT HOOKS: feature map + refine-measure)
    lint.mjs            structural ruleset checks + overlay typo protection + holdout stripping
    patterns.mjs        rung 3: the declarative pattern executor (the five patterns)
    features.mjs        the factor contract's feature grammar
    ids.mjs             deterministic UUIDv5 from business keys (shared by both emitters)
    packs.mjs           pack emission machinery (the project supplies the pack map)
    config.mjs          CLI args, project loading, ruleset compose + compile
  projects/morecheese/  ← A PROJECT = one generated universe (a second = a sibling dir)
    index.mjs           the project's two exports: hooks + buildWorld(cfg) (the pipeline)
    banks.mjs           bank dealing (authored banks/*.json) + cities + segment mix
    banks/              AUTHORED name banks: cleared components, composed by real morphology
    world.mjs           orgs + people + latents (drift process) + hero pinning
    membership.mjs      the renewal unroll + archive rule
    events.mjs          events + registrations + no-show pass
    learning.mjs        courses, enrollments, completions (declarative via patterns)
    money.mjs           the order/payment chain
    hooks.mjs           what the engine needs from the project: compile feature map,
                        refinement measure, pack assembly
    ruleset/            the project's authored content (modules, scenarios, RULESET.md)
  cli/                  ← THE COMMANDS (project-generic; --project, default morecheese)
    generate.mjs build.mjs validate.mjs
    emit-sql.mjs emit-schema.mjs emit-mjsync.mjs
  test.mjs              ← the regression suite (drives the cli)
```

The **plugin contract** is **three** exports from a project's `index.mjs`:

| export | what it is |
|---|---|
| `hooks` | what the engine's compiler and linter need — see the table below |
| `buildWorld(cfg)` | the causal pipeline: what exists, in what order. Returns a world object |
| `buildPacks(world)` | the pack map: `{ <packName>: { tables: { <tableName>: rows[] }, dependsOn: [] } }` |

`hooks` must supply:

| hook | required | purpose |
|---|---|---|
| `compile.arrowsOf(C)` | yes | the effects map the compiler solves |
| `compile.overallTarget(C)` | yes | the target those effects negotiate with |
| `compile.features` | yes | effect key → synthetic-population field name |
| `compile.syntheticPop(C, r, n)` | yes | the solver's world model. Draw order is part of the determinism contract |
| `compile.refineMeasure(C)` | only if any effect uses a human form (`liftPts` / `groupTarget`) | runs the real machinery and reports measured group rates |
| `domainLint(R)` | yes | checks the generic lint cannot know about |

No command and no engine file names a project — `cli/*` loads `projects/<--project>/index.mjs`
dynamically.

> **This section was wrong until 2026-08-03.** It claimed "exactly two exports" and did not
> mention `buildPacks` or the pack-map shape at all, so a newcomer following the documentation
> got a `TypeError` from inside the engine. The tables above were written by building a throwaway
> second project against this file and recording every place it lied.

**The extraction rule:** if a file mentions cheese, members, renewal, or any table name, it
goes in `projects/<name>/`. If it would survive unchanged in an accounting-demo world, it goes in
`engine/`. `compile.mjs` was the one genuine tangle — its feature map and empirical-refinement
world were domain knowledge embedded in engine code; rung 2 inverts that into injected hooks.

**The namespace rule (identity safety):** deterministic UUIDs are minted as
`uuidv5(namespace, "entity:businessKey")`. Accidental collision is a non-issue (~10⁻²⁴);
the real hazard is a cloned domain reusing a namespace with overlapping keys — same UUIDs
by construction. So: **every project registers its own namespace constant** (uuidgen once,
frozen forever) in the `NAMESPACES` map in `engine/ids.mjs`. The loader binds it from the project
name before anything can mint an ID, so a project cannot forget to do it and cannot borrow
another project's space. A project with no registered namespace **fails loudly at load** with
instructions, rather than silently minting someone else's IDs.

> **This rule was unenforceable until 2026-08-03.** The text said a second domain "passes its own
> (a hooks field)" — but the namespace was a single module-level const and `uuidFor()` took no
> namespace argument. There was no way to pass one. A second project would have silently minted
> MoreCheese's ID space: precisely the hazard this paragraph warns about, in the file warning
> about it. Now the promise and the code agree, and MoreCheese's IDs are unchanged.

## The pattern vocabulary (rung 3)

Three repetitions of the same shape across membership, events, and learning earned the
abstraction. The universal move is **score → calibrate → draw**; the patterns are the
contexts it runs in:

| Pattern | Declares | Instances today |
|---|---|---|
| `annualParticipation` | eligible pool per year → calibrated yes/no → spawn child rows | learning enrollment + conference attendance (declarative NOW) |
| `childOutcome` | per parent row → calibrated categorical/binary outcome | course completion + event no-show (declarative NOW) |
| `recurringDecision` | per entity per cycle → calibrated decision with state transition | the renewal unroll (declarative NOW — byte-identical) |
| `derivedTransaction` | per parent fact → child rows with DECLARED timing distributions | the money chain — dues + event checkout (declarative NOW — byte-identical; timing profiles authored in `orders.paymentProfiles`) |
| `staticAssignment` | per entity → ordered rules over drivers | tier assignment (declared in the ruleset NOW — byte-identical) |

A domain entity declares `{ pattern, pool, arrows, target, spawn, streamKey }` in its ruleset
module; `engine/patterns.mjs` interprets. **Stream-key templates are part of the declaration**,
so a declarative re-expression reproduces the hand-written world *byte-identically* — the
proof standard for every migration to declarative form.

## The factor contract (the standardized unit of authoring)

A **factor** is the atom a domain author writes — one cause, its strength, and its why:

```jsonc
"recentLearner": {
  "liftPts": 6,                                       // effect: liftPts | groupTarget | strength | beta
  "feature": { "from": "self", "field": "AutoRenew" },// feature: WHAT fact feeds in (grammar below)
  "evidence": "MGI: education participation ↔ +5-8pt retention"  // lint-enforced
}
```

Everything else is a projection of this artifact: the executor reads it forward (a score
term), the validator reads it backward (an auto-derived recovery gate), the schema layer
reads it sideways (do the referenced fields exist?), RULESET.md renders it in English, and
The AI authoring loop is constrained to writing exactly this shape.

**Feature grammar v1** (deliberately tiny — standardize observed needs, not imagined ones):

| Form | Meaning |
|---|---|
| `{ "from": "self", "field": "F" }` | the entity's own field, coerced to a number (booleans → 0/1) |
| `{ "from": "self", "where": { "F": v, … } }` | 1 if all equalities match, else 0 |
| `{ "from": "<table>", "where": {…}, "as": "hasAny" }` | tier-1 cross-entity lookups (next: requires the ordering rule) |

**Ordering rule:** a factor's `from:` reference creates a dependency edge — the referenced
facts must be generated before the consuming decision. The executor topologically sorts on
these edges; a cycle (facts in year Y consuming facts from year Y) is an error pointing at
the time-stepped-scheduler frontier, not something to fudge.

**Effect-form rule (v1):** feature-declared factors accept `beta`/`strength` forms; the
`liftPts`/`groupTarget` solver currently requires the feature to exist in the compile hooks'
synthetic population — extending the solver to measure declared features empirically is a
known next step, not silently supported.

**Ossification policy:** every admitted field is supported ~forever, so the grammar only
grows when a real domain demonstrates the need in hand-written form first, and every
migration to the contract must reproduce the previous world **byte-identically at the pack
level** (validator-private files may evolve with the harness).

## What stays honest (the hard parts we're NOT claiming yet)

- **Many simultaneously-binding targets** — one calibrated target per outcome today; dense
  overlapping constraints = constrained optimization (rung 5+ research).
- **Cross-entity feedback over time** (attendance → future engagement) — needs a time-stepped
  scheduler; deliberately dodged so far.
- **Full-shape distribution gates**, streaming generation at 5M+ rows, text templates.
- Rung 4 is *blocked on real entities existing* (reconciliation → migrations → CodeGen), not
  on this codebase.

## Where this stands + what's left (as of 2026-07-17)

Everything from the 2026-07-16 meeting feedback is landed: names v2, COVID amplification,
the payment lifecycle, the programs domains (certifications/competition/advocacy), the
**defects module** (labeled record corruption → `DataQualityLabel` answer sheet), **motifs
v1** (stamped story templates + `out/motifs.json` registry), FK-first validation phasing,
and benchmark sourcing folded into the rulesets (every target now carries
source + confidence + tolerance; NPS was the one materially wrong number — fixed 7.2 → 8.3).
Full suite green across 7 seeds; 96 gates *(the count at that milestone — this document is a
dated progress record, not a description of today. Current is 335; `node cli/validate.mjs` is
always the authority)*.

Open, in rough effort-to-payoff order (revised 2026-08-06):

| Item | State |
|---|---|
| **CI does not run the datagen suite** | **The largest gap, and it undercuts this document.** No workflow references `datagen` or `test.mjs` — the only check on a PR is `changes_and_migrations`. So 37 suite steps, 335 gates, the engine-boundary checker, the generator contract and the fixture build all run *only when somebody remembers to type the command*. Every claim on this page is enforced by habit. One workflow file; the suite takes ~15 minutes. |
| **Quarterly re-roll** | The world is anchored to `--release` and there is no wall clock, so it ages: left alone, "recent" activity drifts into the past and the demo stops demonstrating recency. Each quarter, regenerate against a new release date, run the full ladder, and re-capture the seed as a NEW additive migration. See HANDOFF's *Keeping it alive*. |
| **Knowledge Hub** | Researched, decision pending — see `plans/association-db/KNOWLEDGE-HUB-ONE-PAGER-2026-07-16.md`. Option A (fatten 3–4 existing prose fields; KH demos with config only) vs Option B (generated document corpus). Recommend A. Needs a decision, not code. |
| **Vocabulary migration — TYPES-PROPOSAL stage 3** | Stage 2 (canonicalise) SHIPPED 2026-08-05; stage 3 (enforce the canonical spellings from the schema) is open. The "wait for a second project" precondition is met. This is the remaining work on the readability goal — `target` / `presentTarget` / `shareOfEligible` are still three spellings of one idea. |
| **Ops** | `setup-playground.sh` (one-command playground rebuild) does not exist. |
| **Orders decomposition** | BLOCKED upstream — waits on bizapps-orders' Subscription/renewal-Order tables. `morecheese_orders` stays the sanctioned stand-in. |
| **Team integration session** | Real installs + their Explorer apps + Sonar over our data. The path is proven (INTEGRATION-RUNBOOK.md, findings F1–F7); needs team time. |
| **Rung 4 / Rung 5** | Parked deliberately — rung 4 blocked on real entities, rung 5 is design work. |

Closed since the July 31 revision of this table:

- ~~**Who looks at the app UIs?**~~ — **2026-08-07**: the data has been loaded and reviewed in the
  apps it targets. The longest-standing hole in the workstream, and the first time rung 4 of the
  verification ladder has been walked. The question is retired; the habit is not — it catches a
  class of defect no gate can, and it has to be repeated per change rather than per project.
- ~~**Second project**~~ — `projects/fixture/` exists (2026-08-04) and the suite builds it every run. It
  also settled the vocabulary decisions that were waiting on it.
- ~~**Dashboard catch-up**~~ — the inspector had drifted further than this table recorded: it carried a
  hand-written list of three packs and eleven tables while the build shipped twelve packs and seventy
  tables. It now derives both from the packs on disk, ordered by the pack pyramid, and a suite step
  asserts every emitted pack is visible.
- **Accounting pack** — removed from this backlog; not part of this workstream.

## Migration policy

Hand-written domain code is not debt — it's the reference implementation. Each pattern
migrates to declarative form only when (a) the executor covers it and (b) the re-expression
is byte-identical. No big-bang rewrite; the suite (`test.mjs`) is the referee.
