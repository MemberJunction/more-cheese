# Ruleset Specification v0.1 (DRAFT)

**What this is:** the executable contract for the MoreCheese data generator — step 3 of the
build sequence in [DESIGN-REVIEW.md](DESIGN-REVIEW.md) §7, commissioned by the 2026-07-08
review (FEEDBACK §4.3). It defines the ruleset file format, how effects combine, the texture
model, determinism, packs, windowing, and the validation harness. The walking-skeleton
implementation lives in [`/datagen/`](../../datagen/README.md); the plain-language companion
(causality, calibration, β, trainability — for non-statisticians) is
[`/datagen/HOW-IT-WORKS.md`](../../datagen/HOW-IT-WORKS.md).

**Status: DRAFT** — authored ahead of the reconciliation/workshop so their outputs slot into
a defined shape. Items marked **⏳session** are placeholders those sessions fill; items
marked **ASSUMPTION** are provisional shapes the prototype uses until confirmed.

---

## 1. Artifacts

| Artifact | Form | Role |
|---|---|---|
| **Ruleset** (`ruleset-vX.Y.json`) | JSON, semver'd, in git | The world description: nodes, arrows, targets, texture, regimes, heroes. Authored by AI **once**, reviewed like code. |
| **Template library** | JSON/text files, in git | All generated text (bios, tasting notes, posts): slot-filling templates with variation banks. Authored once; **no model calls at generation time** (hard rule, DESIGN-REVIEW §5). |
| **Generator** | deterministic code | Executes the ruleset. Inputs: `(ruleset, seed, scale, releaseDate)`. Same inputs → byte-identical output. |
| **Benchmark file** | `research/benchmarks-draft.json` (canonical) | Targets + tolerances + variance floors. Holdout-flagged entries are **stripped** from anything the ruleset-authoring AI reads; the named holdout list lives with the validator. |
| **Validator** | deterministic code | §7. Runs after every generation; failing it fails the build. |

## 2. The probability model (composition semantics)

Every generated fact is drawn from a distribution whose parameters combine the causal
inputs. One mechanism per outcome type — no bespoke math per arrow:

- **Binary outcomes** (renews?, attends?, opens?): logistic.
  `P = sigmoid(β₀ + Σ βᵢ·xᵢ + Σ interaction terms)` — effects add on the log-odds scale.
- **Counts** (registrations/yr, posts/yr): negative binomial with log link — effects
  multiply the expected rate; NegBin dispersion gives the over-dispersion (top-decile
  concentration) for free.
- **Amounts** (gifts, spend): mixtures (e.g., zero-inflated log-normal) — never clean
  unimodal shapes.
- **Categorical** (tier, topic): softmax over CHECK-constraint value lists only.

**Calibration rule (how targets are hit):** the intercepts β₀ are *solved*, not authored —
the executor root-finds each β₀ so the population aggregate hits the benchmark target given
the driver distribution. Authors control *who differs and by how much* (the βᵢ);
the benchmarks control *the level*. This is what lets signs/strengths and targets coexist
without hand-tuning.

**Effect-size vocabulary** (the causal map's weak/med/strong, quantified — per 1 SD of the
driver, log-odds scale; count/log-link uses the same bands):

| Label | \|β\| range |
|---|---|
| weak | 0.15 – 0.40 |
| med | 0.40 – 0.90 |
| strong | 0.90 – 1.80 |

**Authoring vocabulary (added 2026-07-10 — prototyped in the skeleton):** rules can be
authored in three forms, all compiled to β before execution:

| Form | Example | Who writes it |
|---|---|---|
| Expert | `"beta": 0.55` | the AI author |
| Qualitative | `"strength": "med", "sign": "+"` | the workshop (band midpoint) |
| **Human** | `"liftPts": 12` or `"groupTarget": 0.65` | anyone — "+12 points" / "this group lands at 65%" |

Human forms are **solved, not guessed**: an analytic first pass, then an **empirical
refinement loop** that runs the real generator on a fixed reference world and adjusts the β
until the stated effect is what the data measurably shows (deterministic — fixed refine
seed, so compiled βs are stable across releases). A companion renderer (`explain.mjs`)
emits `RULESET.md` — the whole recipe in plain English with every effect stated in
percentage points — so the readable form and the executable form can never drift.

These same bands are the pilot's **magnitude gates**: a recovered effect must have the
authored sign AND land within [0.5×, 2×] of the authored β (⏳session — workshop may adjust
the tolerance factor).

**Latents:** each person draws `(engagement θ, affluence φ)` from a Gaussian copula,
ρ = +0.4 (med) — **⏳session** (workshop confirms ρ and whether `expertise ε` earns a slot).
Latents are generator-internal only: never stored, expressed only through behavior.
**θ is a process, not a constant** (2026-07-10): a stable anchor (≈60% of variance,
copula-correlated with φ) plus a persistent AR(1) yearly wander (ρ≈0.75), total variance 1 so
β sizes keep their meaning. This is what makes decline *precede* lapse in the crowd — the
substrate Sonar trends and churn early-warning train on — and it's gated (§7): lapsers'
final-year activity must sit below their own within-person baseline. Two harness notes that
came with it: arrow refits include the anchor and prior-year θ as nuisance covariates
(selection acts on θ *history*, and omitting it attenuates neighbors), and magnitude gates
carry a 3·SE small-sample allowance (the multiple-comparisons budget across validation checks).

**Regime gates:** era and seasonal effects are multiplicative modifiers with calendar
anchors (COVID: event volume ×0.5, entries ×0 in 2020–21; December renewal season;
July conference). Anchors are dates-in-the-year, not offsets — see §6.

## 3. Texture (the anti-smoothness model)

Per JSON `$texture` (v0.9.2). All noise is **seeded** — part of the deterministic draw.

1. **Yearly wobble:** each (year, headline-rate) gets an AR(1) multiplier on the logit
   (ρ ≈ 0.5, σ sized so yearly renewal lands in the 84–90% band ~95% of the time —
   calibrated against the real 990 YoY jitter).
2. **Monthly wobble:** activity intensities carry AR(1) month-to-month noise on top of
   seasonal curves (never iid, never flat).
3. **Lumpiness:** amounts are mixtures; counts are NegBin; no perfectly round aggregates.
4. **Timestamp texture:** weekday-skew for staff actions, evening/weekend skew for member
   browsing, holiday dips.

**Amplitude co-design rule:** for every benchmark, `noise σ` must satisfy
`P(annual aggregate outside tolerance) < 5%` — noise and tolerance are set together, or
builds fail randomly. And texture must not wash out signal: authored βs must still pass the
§7 magnitude gates *with* texture on.

## 4. Determinism & substreams

- Master seed → per-entity substream: `rng(hash(seed, entityType, businessKey))`.
  Content-addressing means adding one member never reshuffles everyone else's draws —
  minimal diffs between releases.
- **Heroes are pinned business keys** (`ICF-000101`…): the generator conditions on their
  pinned facts (latent levels, milestones) and draws everything else normally.
- Hard rule restated: **no model calls, no wall-clock reads, no unordered iteration**
  anywhere in the generator.

## 5. Execution order

Topological, so every draw's inputs already exist:

1. World & drivers: orgs (with lifecycle events — dissolutions/acquisitions, arrow 1.15),
   people, employment, geography (pre-baked coordinates), chapters
2. Latents per person (copula)
3. Membership: type/tier (← φ) → the **renewal unroll** (period rows per member per cycle:
   renew/lapse/cancel, grace mechanics, back-dating; cycle cohort per D6 — **ASSUMPTION:
   calendar-year 70% / anniversary 30%** pending ratification).
   **Target-shape note (2026-07-10, from bizapps-orders' published design):** the flat
   period table is the generator's **intermediate representation**. bizapps-orders models
   memberships as one long-lived `Subscription` per member that **spawns a renewal `Order`
   each cycle** — so each period row decomposes into (renewal Order + payment + subscription
   events), with the current period mirrored onto `Subscription.CurrentPeriodStart/End`.
   Their design has **no Lapsed/PendingRenewal statuses, no grace concept, and no AutoRenew
   flag** (auto-renew = stored payment method + provider billing) — all of those are OUR
   domain rules, expressed through their event stream. Since orders is pre-implementation,
   `MembershipPeriod` is also the July-31 **shipping shape**.
4. Behavior: event registrations (homophily), enrollments, posts, downloads, advocacy,
   email engagement, support tickets
5. Money: orders ← every billable fact → payments (3-part timing mixture) → journal entries
   (identity, not sampled)
6. Text: template instantiation from row facts (consistency rule: text never leaks latents,
   never contradicts behavior)
7. Sinks: Sonar recompute (external engine, release-time), derived caches, then **pack
   emission** (§8)

Validity-interval carry-down applies throughout: child dates ∈ parents' windows.

## 6. Date windowing

`releaseDate` is a generator input; **re-running the generator IS the windowing process**
(the standalone shift script is a labeled mid-quarter emergency tool only). All authored
dates are either calendar anchors (Dec 31 expiry, July conference — these **re-snap**) or
release-relative offsets (Marcus's `EndDate ≈ release+21d`). Forward window is explicit:
upcoming events with pre-registrations, future membership expirations (needs D6), future
committee-term expirations.

## 7. The validation harness

> **Three lessons from the walking skeleton (2026-07-08)**, now part of this spec:
> (1) **Calibration applies at every selection layer** — e.g., no-show intercepts must be
> calibrated over the *registrant pool*, not the population, because engaged members
> register more and skew the pool (a real selection effect the naive base-rate misses).
> (2) **Magnitude recovery must refit WITH the latents** (the harness keeps a private
> latents file that is never installed) — omitting a strong latent attenuates every other
> coefficient (logit non-collapsibility); observables-only fits are reserved for the
> trainability check. (3) **Gates get small-sample allowances that vanish at scale** —
> yearly bands widen by the cohort's binomial SE, magnitude bands by the coefficient's SE,
> so pilot-scale noise doesn't produce false failures while production-scale checks stay
> strict.

Runs after every generation; any failure fails the build. The reference pipeline stages
generation output, validates the staging copy, and **promotes only on green** — a red run
can never overwrite the last good build (prototyped as `datagen/build.mjs`).

1. **Benchmark means** within tolerance (holdouts included — they were never in the
   authoring context, so they're the blind test).
2. **Variance floors** per `$texture` — suspicious smoothness fails like a missed mean.
3. **Sign & magnitude recovery:** for each arrow in scope, refit the effect from the
   generated data (logistic/NegBin regression); require authored sign and [0.5×, 2×]
   magnitude.
4. **Trainability check:** train the churn model on the output; require discriminative lift
   appropriate to N (at pilot scale, rank-ordering sanity, not a hard AUC).
5. **Hero suite:** every hero loads with pinned milestones intact (release blocker).
6. **Referential/temporal integrity:** the §5-order and interval rules re-verified
   (the same checks that run at install time).
7. **Non-degenerate queries:** every shipped query returns ≥ N_floor rows AND non-zero
   variance in its headline column (**⏳session** — floor values per query family; owner
   for the 108-query port still unassigned).
8. **Pack integrity:** each pack's references resolve against its declared dependencies
   only; named bundles install cleanly layer by layer (§8).

## 8. Packs (D9)

- Generation is monolithic; the **emitter** partitions output by owning app/schema into
  `packs/<name>/` folders, each with `manifest.json`: `{ name, version, dependsOn[],
  rowCounts, checksums }`.
- Pack DAG mirrors the app dependency graph; common is the root. Install = topological.
- **Named bundles** (tested): `full`, `ams-core` (common+membership+orders+payments),
  `engagement` (+events+forums+sonar). Anything else: unsupported-but-probably-valid.
- Computed packs (Sonar scores, trained models) depend on *all* behavioral packs — they
  install only with `full` (or are recomputed over what's present).

## 9. Scenarios

`decliningOrg` etc. are parameter overlays on the same causal model. **⏳session:**
composition rule for heroes — recommendation: heroes pin to the healthy baseline; scenario
builds re-verify the hero suite and may relax individual pins explicitly, never silently.

## 10. Open items this spec inherits

| Item | Fills in |
|---|---|
| ~~Subscription / order-line shapes (A1/A2)~~ **design-answered 2026-07-10** (bizapps-orders master plan; see RECONCILIATION-ASKS banner) — session confirms; remaining open: the individual-member customer pattern (their design is B2B-shaped) and the `MembershipProduct` extension fields (we propose) | §5 steps 3, 5 |
| D6 ratification + org-tier cycle *(upstream design models no cycle alignment — unconstrained)* | §5 step 3 cohort split |
| Arrow signs/strengths + ρ + magnitude-gate factor | §2 — workshop |
| Non-degenerate floors + query-port owner | §7.7 |
| Texture amplitudes (final) | §3 — co-design pass after workshop |
| Forms arrows 4.11/4.12 | §5 step 4, if D10 lands |
