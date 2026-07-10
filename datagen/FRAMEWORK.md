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
| 2 | **Extraction**: `core/` (domain-blind engine) vs `domains/morecheese/` (the app) | ✅ this branch — byte-identical proof |
| 3 | **Declarative patterns**: domains declare generation patterns; a generic executor interprets them | 🟡 first cut this branch (learning re-expressed; byte-identical) |
| 4 | **Schema-driven (`S`)**: read MJ `EntityInfo` for entities/FKs/value lists; emitters self-configure | ⬜ needs the reconciliation + CodeGen (real entities) |
| 5 | **Authoring loop**: AI drafts modules from `S` + benchmarks, builds, reads gates, iterates | ⬜ the containment (gates, holdout view, lint) already exists |

## What lives where (rung 2)

```
datagen/
  core/                 ← the engine: NOTHING in here knows about cheese
    rng.mjs             dice, distributions, the calibration solver
    dates.mjs           date arithmetic
    stats.mjs           logistic recovery with SEs
    compile.mjs         human forms → β (takes DOMAIN HOOKS: feature map + refine-measure)
    lint.mjs            structural ruleset checks + overlay typo protection + holdout stripping
    patterns.mjs        rung 3: the declarative pattern executor
    packs.mjs           pack emission machinery (domain supplies the pack map)
  domains/morecheese/   ← the application
    banks.mjs           names, cities, segment mix (placeholder until template library)
    world.mjs           orgs + people + latents (drift process) + hero pinning
    membership.mjs      the renewal unroll + archive rule
    events.mjs          events + registrations + no-show pass
    money.mjs           the order/payment chain
    hooks.mjs           what the core needs from the domain: compile feature map,
                        refinement measure, pack assembly
  ruleset/              ← authored content (modules, scenarios) — stays at top level
  generate.mjs …        ← entrypoints, unchanged commands
```

**The extraction rule:** if a file mentions cheese, members, renewal, or any table name, it
goes in `domains/`. If it would survive unchanged in an accounting-demo world, it goes in
`core/`. `compile.mjs` was the one genuine tangle — its feature map and empirical-refinement
world were domain knowledge embedded in engine code; rung 2 inverts that into injected hooks.

## The pattern vocabulary (rung 3)

Three repetitions of the same shape across membership, events, and learning earned the
abstraction. The universal move is **score → calibrate → draw**; the patterns are the
contexts it runs in:

| Pattern | Declares | Instances today |
|---|---|---|
| `annualParticipation` | eligible pool per year → calibrated yes/no → spawn child rows | learning enrollment (declarative NOW); conference attendance (next) |
| `childOutcome` | per parent row → calibrated categorical/binary outcome | course completion (declarative NOW); no-show (next) |
| `recurringDecision` | per entity per cycle → calibrated decision with state transition | the renewal unroll (next — the richest; keeps hero conditioning) |
| `derivedTransaction` | per parent fact → child rows with timing distributions | the money chain (next) |
| `staticAssignment` | per entity → thresholds/softmax over drivers | tier assignment (next) |

A domain entity declares `{ pattern, pool, arrows, target, spawn, streamKey }` in its ruleset
module; `core/patterns.mjs` interprets. **Stream-key templates are part of the declaration**,
so a declarative re-expression reproduces the hand-written world *byte-identically* — the
proof standard for every migration to declarative form.

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
