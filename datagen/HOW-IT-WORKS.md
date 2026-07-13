# How the Generator Works, in Plain Language

The concepts behind `datagen/`, written for anyone on the team — no statistics background
assumed. The executable truth lives in [the ruleset](projects/morecheese/ruleset/RULESET.md) and
[ruleset-spec.md](../plans/association-db/ruleset-spec.md); this is the companion that
explains *why the machine is shaped this way*. (Distilled from the design discussions,
2026-07-09/10.)

---

## 1. The big picture: a recipe, a kitchen, and a food inspector

- **The recipe** (`projects/<p>/ruleset/modules/*.json`): a readable file describing how association life
  works — target numbers ("renewal averages 87%"), cause-and-effect rules ("employer trouble
  drives churn"), world facts (geography, cohorts, seasons), and the pinned heroes. **The AI
  is only ever allowed in the recipe-writing room.** It authors this file once; the file is
  reviewed in git like code.
- **The kitchen** (`generate.mjs` + `core/` + `projects/<p>/`): plain, deterministic code that executes the
  recipe. No AI calls, no network, no clock. Same seed → byte-identical world, forever.
- **The inspector** (`validate.mjs`): re-measures the finished data against the recipe and
  **fails the build** on any miss — including data that's *too smooth* to be believable.
  `build.mjs` stages every run and promotes to `out/` only when the inspector says green.

## 2. Causality: facts are drawn in the order the world happens

v1's disease was facts rolled independently — status *and* end-date *and* medal *and* score,
each from its own dice, free to disagree. Here, two mechanisms make contradictions
impossible rather than unlikely:

1. **Dependency order.** The pipeline runs world → people → hidden dials → memberships →
   events → money → text → computed scores. When a renewal is drawn, its causes (tenure,
   engagement, the employer's fate) already exist and are *inputs to the draw*. An effect
   cannot precede its cause, because the cause is an argument to the function.
2. **Correlations come from shared causes, never from painting.** Nobody writes "make
   low-activity members churn." One hidden dial — engagement θ — feeds *both* the activity
   draw *and* the renewal draw, so the correlation **emerges**, the way it does in reality.
   Slice the data any way you like and the relationships hold, because they're consequences
   of structure, not decorations on the surface.

Every member carries two hidden dials, drawn correlated: **engagement (θ)** and **affluence
(φ)**. They are never stored in any table — everything visible is a downstream consequence.
(The validator keeps a private copy to verify the machinery; it never ships.)

**Engagement is a process, not a personality** (added 2026-07-10 after review): θ = a stable
personal anchor + a slow, persistent year-to-year wander. Most members are roughly themselves
each year, but some genuinely rise and some fade — and the faders are who lapses. That's what
makes Sonar's score *trends* and churn *early-warning* real for the whole crowd rather than
only for pinned heroes: a validation gate now requires that lapsers' final-year activity sits
measurably below their own earlier baseline (decline precedes lapse, ~71% in practice).
Heroes keep pinned constant levels — their arcs are authored facts.

## 3. What β means — the strength of a cause, NOT a tolerance

Every yes/no outcome is decided by a **dial**. Each cause gets a β saying how hard it pushes:

```
renewal dial = baseline
             + 0.55 × tenure          ← moderate push up
             + 1.10 × engagement      ← hard push up
             − 0.90 × employer-died   ← hard shove down
```

- β's **sign** = the causal arrow's direction; β's **size** = its strength (the causal map's
  weak/med/strong, quantified: ~0.15–0.4 / 0.4–0.9 / 0.9–1.8 per step of the cause).
- β **never sets the level** — turn every β to zero and renewal still averages 87%, but it's
  the same coin-flip for everyone and nothing is predictable. βs decide *who* differs.
- Don't confuse β with the variability knobs: **tolerance** (how far a measured number may
  miss before the build fails), **texture** (how much the yearly numbers wander on purpose),
  **dispersion** (how lumpy individual behavior is). β = how much a cause matters; the
  others = how much wobble is permitted and required.

Rules can be authored in human units and compiled to β: `"liftPts": 12` ("+12 points"),
`"groupTarget": 0.65` ("this group lands at 65%"), `"strength": "med"`. The compiler solves
the β — including an empirical pass that runs the real generator and adjusts until the
stated effect is what the data measurably shows.

## 4. The baseline: the tide, not the boats

The baseline is **everything about renewing that isn't about you** — how attractive
membership *is*, this year, period (dues value, conference quality, the economy, the
reminder cadence). Personal scores are how high each boat rides; the baseline is the water
level. Calibration adjusts the tide until the fleet averages 87% — it never touches the
differences between boats, which is why the causal structure survives it.

It's legitimate to *solve* the baseline rather than author it: the 87% benchmark is an
org-level fact from the real world (verified 990s), and org-level facts belong in the one
org-level knob. Shared shocks (a good year, COVID) move the tide; personal shocks (your
employer died) move your boat.

Technically it's the intercept of a logistic model — with the twist that real-world
statistics *estimates* the intercept from existing data, while we *choose* it so the data
about to exist lands on the benchmark. Same object, run in reverse. (Nuance: the baseline is
not "the average member's probability" — the sigmoid's curvature means strugglers drag the
average down harder than stars lift it, so the shared start sits a bit above the target.
That asymmetry is exactly why it's solved numerically instead of computed by formula.)

## 5. The implementation is four small pieces

1. **A score is a sum.** `0.55·tenureZ + 1.10·θ + 0.65·autoRenew − 0.90·employerEvent + covid`
   — one term per arrow, each input an already-drawn fact.
2. **The sigmoid turns dial position into probability.** `1/(1+e^(−x))` — one line.
3. **Calibration is a guessing game.** Binary search on the baseline: guess, compute the
   cohort's implied average, "higher/lower," halve the range, 60 times. Exact to ~15
   decimals in a millisecond. Because it averages over *this year's actual cohort*, it
   adapts to cohort composition automatically.
4. **Personal dice.** Each decision draws from a stream named after it
   (`renew:ICF-100217:2024`), so the same seed replays the same world and adding a member
   never reshuffles anyone else.

The same four-step pattern is reused everywhere: renewal (target 87%), conference attendance
(35%), no-shows (8%/55%, calibrated over the *registrant pool* — engaged people register
more, so the pool is skewed; calibration applies at every selection layer). The compiler
runs the whole pattern in a loop to solve human-authored effects.

Since the framework refactor, "reused" is literal: the four steps live **once**, in
`core/patterns.mjs`, as five declarative patterns (yearly participation, child outcomes,
recurring decisions, static assignment, derived transactions). A domain module supplies
only what's domain-shaped — who's eligible, what feeds the score, what happens on yes/no —
and every migration to this form was proven **byte-identical** to the hand-written code it
replaced (see [FRAMEWORK.md](FRAMEWORK.md)).

## 6. Writing a new rule = one declaration (for most rules)

The original recipe was four edits: declare in the ruleset, add a score term, add validator
gates, run. The **factor contract** collapsed the middle two for any factor whose input the
feature grammar can express (`"feature": {"from": "self", "field": ...}` or a `where` match):
the executor reads the score term from the declaration, and the validator **auto-derives the
recovery gate** from the same declaration. So:

1. Declare the factor in the ruleset (effect in human units, its feature, evidence).
2. Run, and let the gates argue with you.

Factors the grammar can't express yet (e.g. the employer-event window, which needs
cross-entity time logic) stay as built-in score terms with hand-added gates — the grammar
only grows behind hand-written precedent (FRAMEWORK.md's ossification policy).

Case study: "enthusiasts renew at ~65%" first shipped at 76% — because the calibrator
noticed the group dragging the average and **raised the tide for everyone**, enthusiasts
included. Rules and the calibrator negotiate; effects must be sized for the world *after*
that negotiation (this is what the compiler's empirical refinement automates). The failed
gate wasn't a bug — it was the system refusing to ship a rule that didn't do what it said.

## 7. Heroes: conditioned, not drawn

A hero is a small set of **pinned facts** (join date, employer, latent levels, milestones);
the generator grows everything else around them through the same arrows as the crowd. Their
storyline outcomes are facts, not dice rolls — Marcus cannot accidentally lapse in 2023.
That's why hand-written hero stories and emergent crowd stories (Sofia Hartman's employer
cut its program → she lapsed; nobody wrote that) are indistinguishable in kind.

## 8. Trainable, honestly: recovery, not discovery

A model trained on this data **works**: it converges, calibrates, rank-orders churn risk,
and fights realistic fog (it sees registrations, not θ — proxies, omitted variables,
attenuation, like real life). Performance has a built-in realistic ceiling: every outcome is
still a dice roll, so no model can score suspiciously well.

But be precise about the claim: training here is **recovery, not discovery**. The best
possible model re-derives the ruleset; it cannot surface an insight we didn't author. The
saving grace is that the ruleset itself was compiled from the real world (published
benchmarks, verified 990s) — so a trained model is, at the limit, recovering the association
industry's actual statistics:

> real world → published stats → ruleset → generated data → trained model → recovers the stats

**Claim discipline for demos:** ✅ "train a churn model on your data and it works — real
drivers, realistic lift." ❌ "the model discovered something surprising" — there are no
surprises, only authored facts to recover. Any on-stage "discovery" should be an authored
arrow (Anna's employer event, Dale's January workshop) — which is exactly what the hero
stories and arrow 1.15 exist to guarantee. Never use this data to benchmark a technique's
ability to find unknown structure; there is none.

## 9. The closing loop

The generator is a logistic model run **forward** (coefficients → data). The validator runs
it **backward** (data → coefficients) and demands the βs come back — right sign, right size —
while every benchmark lands and the texture stays honestly rough. Cause in, cause out,
average pinned to the real world. That loop, plus byte-identical determinism, is the whole
trust story: *the recipe is readable, the kitchen is auditable, and the inspector is
unbribable.*
