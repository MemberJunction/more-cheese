# MoreCheese Demo Data — Design Review Feedback

**What this is:** the reviewer response to [DESIGN-REVIEW.md](DESIGN-REVIEW.md) and its
companions ([ASSOCIATION-PROFILE.md](ASSOCIATION-PROFILE.md),
[PERSONAS-REVIEW.md](PERSONAS-REVIEW.md), [FEATURES-REVIEW.md](FEATURES-REVIEW.md)),
incorporating Amith's 2026-07-07 comments. Structured to match the decision register:
§1 is the verdict, §2 answers D1–D8 one by one, §3 proposes two **new** decisions (D9/D10)
arising from Amith's comments, §4–§8 are the findings — blocking first.

**Status: FEEDBACK FOR DISCUSSION** · Drafted 2026-07-08 (Robert Kihm, with AI-assisted
document/consistency review) · Respond via PR threads on the relevant section, or bring to
the reconciliation / causal-map sessions.

**Review basis:** all four review docs read in full, plus v2-plan.md,
research-plan-and-schema-proposal.md, generative-schema-findings.md, gaps-to-fill.md,
HANDOFF-CHANGES.md, work-breakdown.md, DEMO-BACKLOG.md, RECONCILIATION-ASKS.md,
hero-personas-draft.md, `research/` (all 12 workstreams), and `benchmarks-draft.json`
v0.9.1 — including arithmetic checks on the headline targets.

---

## 1. Verdict

**Conditionally ready — the ideas are sound; settle four things before generating in earnest.**

This is well above the usual bar for demo data. The causal-ruleset approach with hidden
engagement/affluence dials is the right cure for v1's "related facts drawn independently"
disease; the evidence discipline (primary-source verification, tolerances, blind holdouts,
a pilot gate) is genuinely strong; and the arithmetic holds — renewal 87% + 14% acquisition
closes at steady state, the revenue mix sums, and conference 35% + 32% reconciles to the
real ACS's observed registrant counts.

The four conditions:

1. **Ratify D6 (anniversary cohort) and causal arrow 1.15 (employer events) first** — three
   hero pins currently contradict the "settled" calendar-year rule, and the #2 engineered
   feature (findable churn causes) has no generating rule (§4.1).
2. **Write the ruleset specification as the first engineering deliverable** — format,
   composition semantics, the no-live-AI-at-generation-time rule, and now (per Amith) the
   texture/noise model (§4.2, §4.3).
3. **Design the per-app data-pack architecture before the generator is architected** —
   Amith's modular-packs comment is a real architecture change no current document reflects
   (§3, D9).
4. **Name the hero/template owner and formally re-scope the hero count for July 31** — the
   schedule's longest pole is unowned and the current sequence doesn't close (§8).

## 2. Responses to the open decisions (D1–D8)

| # | Decision | Verdict | Notes |
|---|---|---|---|
| D1 | Renewal 87% vs 89% | **Concur** | The 990 evidence is strong and unanimous (five in-domain societies, all flat-to-declining, spot-checked against e-filed originals). Present to Robert as an evidence-backed FYI, not a question. One refinement from Amith's distribution comment: communicate it as a **band** (~84–90% year to year around an 87% mean), not a point — see §5.3. |
| D2 | Flagship 35% + 32% non-member | **Concur** | The decomposition reconciles the old 25% and the raw 50% registrants÷members figure; cluster analogs all run ≥50%. Keep the ~9%/2,000-registrant attenuation caveat attached whenever the 15k preset is discussed (§6.3). |
| D3 | Grace = 2 months | **Concur** | Industry mode, well sourced (MGI n=548). No concerns. |
| D4 | ~625 orgs at default | **Concur** | The competition math genuinely requires it (~210 entrant companies). Note the 0.25 member-to-org ratio is itself an estimate stacked on estimates — acceptable, but document the derivation chain in the JSON so it isn't re-litigated later. |
| D5 | Large (15k) as hosted default | **Concur with conditions** | 15k is the *least-validated* preset: attenuation fitted on few points, committee/staff curves ESTIMATE (BL-4), conference figure self-described upper-mid, and the pilot runs at N≈500. Conditions: (a) budget the data volume — large is on the order of 5M+ email-send rows over 5 years plus pre-computed embeddings; get an install-time/package-size number before sign-off; (b) run at least one large-preset generation before launch, not just the 500-pilot. |
| D6 | Mixed renewal cycle (anniversary cohort) | **Concur — and treat as blocking** | This is not just a nice-to-have: three hero pins (Marcus `release+21d`, Danielle's grace-window timing, Anna's ~17-month arithmetic) are **impossible** under pure calendar-year at most release dates, and Anna's timeline doesn't close either way until re-pinned (§4.1). It's also what makes Amith's "future expiring memberships" windowing ask work year-round (§3, D11 area). Ratify before the pilot, then make the flagged doc/JSON updates immediately. |
| D7 | Bless hero names | **Concur with one gate** | The cast is well-crafted (18/20 fully satisfy their own believability rules; the counter-pattern heroes are the standout). Before names go permanent: run a **name/entity collision check** — heroes and org names (Sierra Vista Creamery, Northgate Market Group, …) against real people/businesses in this small, real industry — and add a resemblance note re: the identifiable ACS calibration (§7.6). |
| D8 | Hero-authoring owner | **Concur — decide now, and re-scope** | 22 of 50–100 with no owner and 3½ weeks to ship is not a plan. Either name the owner *and* formally cut the July-31 target to roughly the current cast (~25), or move the date. Deliberate scoping now beats week-5 triage (§8). |

## 3. New decisions proposed (from Amith's 2026-07-07 comments)

> Proposed in DESIGN-REVIEW §1 format so they can be lifted verbatim if accepted.

| # | Decision | Recommendation | Why (one line) |
|---|---|---|---|
| **D9** | **Per-app data packs** — one installable data pack per composed bizapps app (common → tasks → issues → committees → …), rolling up to the full dataset | Adopt, with the **generate-once / partition-into-packs** principle fixed now | Amith's ask; it's the BizApps-suite sales story — but the causal generator cannot run per-pack (one hidden dial drives a person's registrations *and* posts *and* payments), so generation stays monolithic and packaging becomes a partitioning step. |
| **D10** | **bizapps-forms as composed app #11** — forms + responses (session evaluations, post-event surveys, membership applications, entry forms) | Adopt as an **optional pack**, not a July-31 blocker | It plugs a real hole (Dale Peterson's "great reviews" currently have no table to live in, and event-ROI gains a satisfaction signal) — but an 11th unfrozen dependency 3 weeks before ship is exactly the OQ-11 risk. Pending: Pranav's schema status + freeze date. |

**D9 design consequences (for the reconciliation agenda, alongside A1–A4):**

- **Pack dependency DAG** mirroring app dependencies — common installs first, always; the
  cross-schema-FK ask (B5) becomes an install-*ordering* contract between packs.
- **Partial-install semantics must be defined.** Load common + committees but not orders and
  hero stories, cross-app benchmarks, and many of the 108 queries degrade. State explicitly
  which invariants hold per-pack vs. only at full rollup, and scope the install-time
  integrity check accordingly (per-pack checks + a full-rollup check).
- **Stable business keys (§4 rule 6) are what make this feasible** — packs cross-reference
  deterministically. The modular ask is additive, not a rewrite — but only if decided before
  the generator's output format is designed.
- **IsA vs. overlay needs a ratified pattern.** The schema proposal consistently uses the
  profile/overlay pattern (MemberProfile → Person FK); Amith blesses "IsA when appropriate,
  other ways at other times." The reconciliation session should produce a one-paragraph rule
  for when a MoreCheese table extends core BizApps via IsA vs. FK overlay, applied
  consistently across the 8 custom schemas.
- **Packaging docs to update if adopted:** the two-package model in DESIGN-REVIEW §2,
  work-breakdown "What we're building," and the manifest plan.

## 4. Blocking findings

### 4.1 GAP-12 / D6 is currently a *contradiction*, not just an open decision

DESIGN-REVIEW §6 lists calendar-year as settled ("don't re-open") while three heroes carry
release-relative pins that only work in a Nov–Feb release window:

| Hero | Pin | Problem at (e.g.) a June release |
|---|---|---|
| Marcus Chen | `EndDate ≈ release+21d` | Under pure calendar-year he's ~6 months from renewal — the renewal-outreach demo is empty |
| Danielle Okafor | `EndDate ~4 months past` + 2-mo grace | She's outside the grace window; the "just lapsed" win-back story misfires |
| Anna Brown | last payment ~17 months pre-release | The timeline doesn't close against a calendar-year lapse **under either option** — needs re-pinning when D6 lands |

The proposed anniversary cohort fixes Marcus cleanly (anniversary cohort, auto-renew OFF)
and legitimizes Danielle/Anna's release-relative dates. Ratify it **before** ruleset v0.1,
make the flagged updates (ASSOCIATION-PROFILE §3, DESIGN-REVIEW §6 calendar row, JSON cycle
note), and re-check all three pins' arithmetic as part of the update.

### 4.2 The determinism claim quietly conflicts with the AI-authorship claim

"Same seed → byte-identical output" is asserted; the ruleset is LLM-authored; and the text
templates (bios, tasting notes, forum posts, support threads) have **no specified generation
mechanism**. If any text is produced by live model calls at generation time, byte-identical
rebuilds die — and with them "heroes survive every rebuild with minimal diffs."

**Fix (cheap, but must be written down as a hard rule):** the LLM authors the ruleset and
the template library *once*, both checked into git and reviewed; deterministic code executes
them with seeded slot-filling/variation. No model calls inside the generator. Add this to
the ruleset spec (§4.3) and to §5's determinism paragraph.

### 4.3 The ruleset itself has no specification — and it's the next phase's centerpiece

The causal map is a good edge list; it is not yet an executable artifact. Missing before
ruleset v0.1 can be authored:

- **File format** and versioning for the ruleset.
- **Composition semantics** — how ~50 effects combine on one outcome (additive? logistic?),
  how interactions are expressed (EventType × paid for no-shows is already required by
  arrow 2.7), and how regime gates (COVID, seasons) apply.
- **The texture/noise model** (Amith's distribution comment — §5.3): seeded noise
  distributions, amplitudes, and autocorrelation, co-designed with the benchmark tolerances.
- **Executor design + validation harness**, including how the pilot gate's checks run.

Recommend naming "ruleset spec v0.1" as an explicit deliverable between the causal-map
workshop and ruleset v0.1 in the §7 sequence.

## 5. Validation gaps (the safety nets need three upgrades)

### 5.1 The pilot gate tests sign, not size

"Predictive models that actually predict" is feature #4, but a tenure→renewal correlation of
+0.02 passes a direction-only check while producing an untrainable churn model. Add
**magnitude bands** — the causal map's weak/med/strong labels, quantified into acceptable
effect-size ranges — and one end-to-end check: train the churn model on pilot output and
require a minimum AUC/lift. A flipped sign stays a hard fail; a vanishing effect should fail
too.

### 5.2 The blind holdouts are only blind if the isolation is real

The same research corpus feeds both the benchmark file and the ruleset-authoring AI. State
the mechanism that keeps held-out benchmarks out of the authoring context (separate file the
authoring prompt never loads, named holdout list, verified at pilot). Otherwise "blind" is
aspirational.

### 5.3 Distribution texture — Amith's anti-smoothness ask, made enforceable

Benchmarks currently validate **means**; nothing stops the generator from hitting 87.0%
renewal identically every year, which reads as fake to exactly the knowledgeable prospect
the data is calibrated for. Three additions:

1. **Texture requirements in the ruleset spec:** seeded (deterministic) noise so yearly
   renewal wanders in a band (~84–90% around the 87% mean); autocorrelated month-to-month
   wobble on registrations/sends; mixtures rather than clean unimodal distributions for gift
   sizes and spend; day-of-week and holiday texture on operational timestamps. The era
   regimes provide macro-roughness; this adds the micro-roughness.
2. **Co-design noise amplitude with tolerance width.** The build fails on benchmark miss —
   noise sized independently of tolerances will randomly fail releases.
3. **Enforce it both directions:** add anti-smoothness assertions (variance floors per
   metric, e.g. year-over-year renewal variance above a threshold) to the benchmark checks,
   or the roughness will erode as people tune toward targets.

**Caution:** noise must not wash out the causal signal — size it so the §5.1 magnitude bands
still pass. That's a causal-map-workshop parameter, not an afterthought.

## 6. Technical risks to pin down at reconciliation

1. **Cross-schema FKs (B5) require same-database installs.** SQL Server allows cross-schema
   FKs *within one database only*. If composed apps can ever install into separate databases,
   the FK graph — and the generator's join-graph validation — silently breaks. State the
   same-DB requirement explicitly in the install contract (and it becomes a pack-DAG
   constraint under D9).
2. **"We depend on Sonar's engine, not its tables" needs a written contract.** Headless
   recompute at release-build time, its inputs/outputs, and version pinning are unconfirmed
   against a v0.1 app that's still moving (migration as recent as 2026-06-24). Get the
   engine contract in writing at reconciliation.
3. **The 15k preset needs a volume budget and a dry run** (see D5 conditions): row counts
   (~5M+ email sends over 5 years), package size, mj-sync load time, embedding storage — and
   one full large-preset generation before launch.
4. **`IsSharedDemo` needs an operational story, not just a column.** Once morecheese.org
   runs real production data alongside demo rows, every dashboard, aggregate, search index,
   and Sonar scoring run must filter by it — in both directions. Someone should own the
   filtering discipline and add it to the install-time checks.
5. **Windowing needs one canonical mechanism** (Amith's date-windowing comment). Two
   mechanisms are on the table: *re-run the generator with a new release date* (the docs'
   primary story) vs. *deterministically re-window precompiled data* (Amith's framing, and
   DATA-SUMMARY's date-shift utility). Maintain both as peers and they will drift — data the
   generator can no longer reproduce. **Recommend:** release-date is a generator input and
   re-running *is* the windowing process; the shift script survives only as a clearly-labeled
   mid-quarter emergency tool. Either way, windowing must be **calendar-aware** — naive
   +N-day shifts put the July conference in October, the December crunch in March, and
   weekday meetings on weekends; seasonal anchors must re-snap, not slide.
6. **Extend the forward-looking window checklist.** Amith's list is broader than the docs':
   "upcoming events with pre-registrations" is covered; **future-expiring committee terms**
   and **future membership expirations** are not explicit. Both are cheap now, annoying to
   retrofit — the committee-term one also gives Gwen Whitfield's governance demo a live
   "term ending soon" hook, and the membership one depends on D6.

## 7. Missing items (checklist)

1. **Causal arrow 1.15 (employer event → churn) is load-bearing and unratified.** Without
   generated employer-lifecycle events (dissolution, acquisition, program cuts), Anna's,
   Bob's, and Danielle's churn has no findable cause and feature #2 collapses. Walk it at the
   workshop with the other four DRAFT arrows (4.8–4.10, 5.15) — 1.15 first.
2. **The tenure-cohort distribution is implicit.** The renewal curve (68/82/86/89/92%) only
   averages to 87% if membership skews long-tenured; that skew is stated nowhere. Derive it
   from a steady-state growth model (preferred) or state it explicitly in the JSON.
3. **Text-behavior consistency as a stated rule.** Generated text must not leak the hidden
   dials ("I'm super active!") nor contradict the member's generated behavior. Add to the
   template requirements — which also still need an **owner and authoring plan**.
4. **Two proposed causal arrows for forms (if D10 adopted):** engagement → response rate;
   satisfaction → repeat attendance/renewal.
5. **Scenario-composition rules.** Does the declining-association scenario preserve hero
   pins? If renewal drops to ~78%, do Marcus/Bob/Victor still compute to their stories?
   Undefined.
6. **Name/entity collision check + ACS-resemblance note** before D7 blesses names (see D7).
   The association is closely modeled on the identifiable ACS with its actual FY2024 revenue
   and dues lattice — worth a quick legal/brand sanity pass and a one-line "calibration, not
   depiction" statement.
7. **Define "non-degenerate" for the 108 queries** (row-count floor? variance floor? who
   judges?) and name an owner for the port + verification.
8. **Action item (outside this repo):** confirm bizapps-forms status and schema-freeze date
   with Pranav — Amith hasn't heard in a couple of days; the answer slots into Marcelo's
   OQ-11 survey.

## 8. Schedule

The July-31 sequence doesn't currently close. Still ahead, sequentially: Marcelo's schema
survey → reconciliation session (unscheduled) → causal-map workshop → ruleset spec + v0.1 →
N≈500 pilot → fix loops → full generation → Sonar scoring, embeddings, 7 models, 108 queries
— while hero authoring (22 of 50–100, release-blocking) is unowned and text templates have
neither owner nor plan. D9 (packs) adds packaging work; D10 (forms) adds a dependency.

**Recommendation:** use the work-breakdown's "never cut" list *now*, deliberately — a working
install, the composition story, and a solid ~25-hero core — rather than in week 5. Formally
cut the hero target for this release (D8), keep forms optional (D10), and let the quarterly
refresh absorb the rest.

## 9. Evidence-quality notes (no action needed, for the record)

- **Strong:** renewal 87% (990-verified, unanimous cluster), $175 dues + full tier lattice
  (verified at source), competition 25% medal rate (ACS actuals), email 34%/3% (Higher
  Logic), grace 2-mo (MGI), dues-share 22% (ACS 990), no-show 8%/55% (published bands).
- **Acceptable-thin, correctly labeled:** support topic mix (estimate-led per Marcelo's
  ruling), merch (single datapoint, low-stakes), donor participation (giving is <2% of
  revenue and correctly modeled sponsor-driven), unsub/bounce (estimates, wide ranges).
- **Watch:** payment timing is primary-sourced (Atradius/CRF) but was approved, not
  independently re-verified — URLs are in gaps-to-fill GAP-1 if anyone wants the spot-check.
- **Post-launch:** once morecheese.org generates real support traffic, validate the
  estimate-led support benchmarks against it and adjust in a later release.

## 10. Suggested next steps

1. Ratify **D6** + walk **arrow 1.15** (same session — they intersect on the same heroes).
2. Add **D9/D10** to the decision register; put the pack architecture and the IsA/overlay
   rule on the Marcelo reconciliation agenda alongside A1–A4; get Pranav's forms date.
3. Commission the **ruleset spec** (format, composition semantics, no-live-AI rule, texture
   model, windowing mechanism) as the deliverable between the workshop and ruleset v0.1.
4. Upgrade the **pilot gate** with magnitude bands + one model-training check; document the
   holdout isolation; add variance-floor checks to the benchmark harness.
5. Decide **D8** (hero owner) and the scoped hero count for July 31.
