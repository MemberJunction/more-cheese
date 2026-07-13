# The Datagen Framework — Plan & Progress

**The idea:** what MoreCheese proved as one application becomes a reusable engine — any
MJ app team gets calibrated, causal, deterministic demo data by *authoring ruleset modules*,
not by writing generators. The formula is Madhav's `Generate(X, S, seed, scale)`; MoreCheese
is the running proof of the bottom half.

**The test that defines "framework":** can a second domain (say, bizapps-accounting demo
data) be added with ruleset declarations + minimal hooks, no new pipeline code? Every rung
below moves toward a "yes."

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
    generate.mjs build.mjs validate.mjs demo.mjs explain.mjs
    emit-sql.mjs emit-schema.mjs emit-mjsync.mjs
  test.mjs              ← the regression suite (drives the cli)
```

The **plugin contract** is exactly two exports from a project's `index.mjs`: `hooks` (what the
engine's compiler/linter/pack-assembler need) and `buildWorld(cfg)` (the causal pipeline). No
command and no engine file names a project — `cli/*` loads `projects/<--project>/index.mjs`
dynamically. That is the whole extension surface.

**The extraction rule:** if a file mentions cheese, members, renewal, or any table name, it
goes in `projects/<name>/`. If it would survive unchanged in an accounting-demo world, it goes in
`engine/`. `compile.mjs` was the one genuine tangle — its feature map and empirical-refinement
world were domain knowledge embedded in engine code; rung 2 inverts that into injected hooks.

**The namespace rule (identity safety):** deterministic UUIDs are minted as
`uuidv5(namespace, "entity:businessKey")`. Accidental collision is a non-issue (~10⁻²⁴);
the real hazard is a cloned domain reusing a namespace with overlapping keys — same UUIDs
by construction. So: **every domain mints its own namespace constant** (uuidgen once,
frozen forever). The `9b1dcbf2…` constant in `engine/ids.mjs` belongs to MoreCheese; a second
domain passes its own (a hooks field, now that projects are directories).

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
the AI authoring loop is constrained to writing exactly this shape.

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

## Migration policy

Hand-written domain code is not debt — it's the reference implementation. Each pattern
migrates to declarative form only when (a) the executor covers it and (b) the re-expression
is byte-identical. No big-bang rewrite; the suite (`test.mjs`) is the referee.
