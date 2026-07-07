# R5 — Causal Map Draft (pre-workshop)

**Status: DRAFT for the R5 workshop.** Every arrow needs human review (Marcelo, Madhav, Robert). Strength values marked `TBD-R1`/`TBD-R3` get filled from the research deliverables; the *signs* and *justifications* are the reviewable content — a sign flip in the pilot run is a hard reject, so get them right here.

Format per arrow: `from → to` | sign | strength (weak/med/strong) | mechanism (one line).

---

## 0. Nodes

**Exogenous drivers (real columns):**
`time` (era regimes), `region` (Person address / Chapter), `segment` (Producer/Retailer/Supplier/Educator/Enthusiast), `discipline` (shared list), `orgSize`, `careerStage` (YearsInProfession), `tenure` (derived from JoinDate — deterministic, treated as driver per cycle)

**Latents (no columns; copula-correlated per Person):**
`affluence` (φ), `engagement` (θ), `expertise` (ε — optional third latent, drives cert/competition success)
Proposed copula: φ↔θ **+med**, φ↔ε **+weak**, θ↔ε **+med**

**Sinks (computed last, never inputs):**
`sonar.Score`, all 7 predictive-model outputs, any denormalized aggregate

---

## 1. Identity & membership chain

| # | Arrow | Sign | Strength | Mechanism |
|---|---|---|---|---|
| 1.1 | affluence → orgSize | + | med | wealthier people cluster at larger firms |
| 1.2 | region → orgSize | ± | weak | regional industry structure (e.g. WI/CA larger producers) |
| 1.3 | segment → membershipType eligibility | gate | strong | corporate tiers only for org-backed segments |
| 1.4 | affluence → membershipTier | + | strong | tier is the primary affluence readout |
| 1.5 | orgSize → membershipTier | + | med | bigger employer, bigger tier (often employer-paid) |
| 1.6 | membershipTier → duesAmount | + | strong | monotone by construction (constraint, not just prior) |
| 1.7 | time(regime: duesInflation) → duesAmount | + | weak | ~2-4%/yr drift |
| 1.8 | engagement → renewed? | + | strong | THE headline arrow; disengaged members lapse |
| 1.9 | tenure → renewed? | + | med | concave: year-1 renewal ≪ tenured renewal (curve from R1) |
| 1.10 | autoRenew → renewed? | + | med | friction removal (lift from R1/Robert) |
| 1.11 | affluence → renewed? | + | weak | budget-driven non-renewal (R1 reason rankings) |
| 1.12 | time(regime: covid) → renewed? | − | med | 2020-21 retention dip |

## 2. Events chain (the homophily showcase)

| # | Arrow | Sign | Strength | Mechanism |
|---|---|---|---|---|
| 2.1 | engagement → #registrations/yr | + | strong | engaged members show up |
| 2.2 | region-match(member,event) → P(register) | + | strong | people attend nearby events |
| 2.3 | discipline-match(member, event.track) → P(register) | + | strong | producers go to producer content |
| 2.4 | event.capacity/type (popularity) → P(register) | + | med | big conferences draw disproportionately |
| 2.5 | isVirtual → P(register) | + | weak | lowers barrier; era-dependent (covid ×) |
| 2.6 | engagement → attended vs no-show | + | med | no-show is an (in)engagement signal |
| 2.7 | paidPrice → no-show | − | med | paid registrations show up more (R1) |
| 2.8 | attendance → CEUAwarded | gate | strong | by construction (CHECK) |
| 2.9 | time(regime: covid) → eventVolume, isVirtual mix | −/+ | strong | ×0.5 events, virtual spike |

## 3. Learning & certification chain

| # | Arrow | Sign | Strength | Mechanism |
|---|---|---|---|---|
| 3.1 | engagement → #enrollments | + | med | |
| 3.2 | careerStage(early) → #enrollments | + | med | early-career upskilling |
| 3.3 | discipline → course category | match | strong | homophily on content |
| 3.4 | engagement → completion? | + | strong | disengaged learners stall |
| 3.5 | expertise → exam score | + | strong | |
| 3.6 | course level vs careerStage mismatch → completion | − | weak | in over their head |
| 3.7 | completions → certificationRecord | gate | strong | prerequisite chain by construction |
| 3.8 | engagement → CE credits/yr → cert renewal | + | med | the compliance loop |

## 4. Money chain

| # | Arrow | Sign | Strength | Mechanism |
|---|---|---|---|---|
| 4.1 | membershipPeriod → order(dues line) | 1:1 | strong | by construction |
| 4.2 | registration/enrollment (paid) → order line | 1:1 | strong | by construction |
| 4.3 | order → payment transaction | ~1:1 | strong | small failure/retry rate (dependent: affluence − failures) |
| 4.4 | payment → journal entry (debits=credits) | identity | — | Tier-2 repair rule, not a sampled edge |
| 4.5 | affluence → givingPropensity | + | med | |
| 4.6 | engagement → givingPropensity | + | med | donors are engaged members (R1) |
| 4.7 | givingPropensity → donationAmount | + (zero-inflated, right-skewed) | strong | most give 0; gifts log-normal |

## 5. Community & marketing chains

| # | Arrow | Sign | Strength | Mechanism |
|---|---|---|---|---|
| 5.1 | engagement → #forumPosts | + (over-dispersed) | strong | few members produce most posts |
| 5.2 | discipline → forum category | match | strong | |
| 5.3 | expertise → reactions received (Helpful) | + | med | |
| 5.4 | engagement → emailOpen? | + | strong | densest engagement observable |
| 5.5 | emailOpen → emailClick? | gate + engagement | med | click ⊂ open by CHECK |
| 5.6 | campaignType(renewal) × atRisk → open | interaction | weak | renewal mails to lapsing members underperform |
| 5.7 | engagement(very low) → unsubscribe | + | weak | |
| 5.8 | engagement → resourceDownloads | + | med | |
| 5.9 | engagement → advocacyActions | + | med | advocacy is a high-engagement behavior |

## 6. Awards chain (org-anchored)

| # | Arrow | Sign | Strength | Mechanism |
|---|---|---|---|---|
| 6.1 | orgSize(producer) → #products | + | med | |
| 6.2 | expertise(org's members) → judgeScores | + | med | quality follows skill |
| 6.3 | judgeScores → award medal | threshold | strong | by construction from scores |
| 6.4 | award → product retailPrice | + | weak | award premium (nice demo query) |

## 7. Sinks (strict — no outgoing arrows into any column above)

| Sink | Function of |
|---|---|
| sonar.Score / ScoreHistory | registrations, completions, posts, reactions, downloads, advocacy, message activity, payment recency — computed by running Sonar's recompute against generated behavior at release |
| churn/renewal/LTV/attendance/certCompletion/eventROI/engagement models | trained on the generated history at release; ship as artifacts |

**Rule check (gate F5):** no arrow may originate from a sink or any aggregate. 6.4 (award → price) is the only arrow fed by a *derived* value — allowed because Award is a generated base row, not an aggregate; flag for workshop confirmation.

---

## Post-research annotations (2026-07-02 — R1/R2/R3 complete)

**Arrows now evidence-backed (strengths confirmed, numbers in `benchmarks-draft.json`):**
- **1.8 engagement → renewed** ✅ "lack of engagement" is the #1 stated non-renewal reason (47% overall, 64% trade — MGI 2024). Keep *strong*.
- **1.9 tenure → renewed** ✅ quantified and SETTLED (v0.7, R9 closest-cluster pass): overall **87%** (confirmed by the unanimous 990 dues-trend proxy across artisan craft-food analogs; team's 89 rejected by in-domain evidence), yr-1 **~68%**, 5+ yrs ~92%, enthusiast tier ~65%. Arrow stays **strong**. Related fact (R8): **calendar-year membership expiry** → renewals cluster Nov–Jan (a seasonality regime on this arrow, and RenewalDate ≈ Dec 31 as the schema convention).
- **1.10 autoRenew → renewed** ✅ +10–15 pts (MGI). Keep *med*, lean strong.
- **2.7 paidPrice → no-show** ✅ dramatic: 3–10% paid in-person vs 50–60% free webinar. Upgrade to **strong**, and model as `EventType × paid` interaction, not a flat rate.
- **2.9 covid regime** ✅ ACS competition entries literally zero 2020–21; conferences virtual (R2). Keep *strong*.
- **4.7 gift distribution** ✅ 57% of gifts ≤ $100 (FEP) — zero-inflated log-normal confirmed.
- **5.1 forum over-dispersion** ✅ v1 deliberately concentrated posting in 20–30 authors of 2,000 (R3) — keep as NegBin with top-decile ≈ 75% of posts.

**New arrows/constraints discovered:**
- **6.5 (NEW, gate):** `CompetitionEntry → Product.Organization must hold an org-level membership` — a real ACS rule (R2). Hard referential constraint; add to schema reconciliation list.
- **6.3 calibration:** medal rate ≈ 25% of entries (ACS). v1 shipped 51% — R3 flags the fix.
- **1.13 (NEW, weak):** fixed-calendar renewal date + 2–3-month grace period correlate with ≥80% renewal (MGI) — decide in workshop whether to model grace-period reinstatement as a distinct transition (R4 Robert Q2).

**The v1 anti-pattern, named (R3's core finding):** nearly every v1 bug is the *same* flaw — correlated business facts sampled as **independent** random draws (Status ⊥ EndDate, NoShow ⊥ CheckIn, Completed ⊥ CompletionDate, Medal ⊥ JudgeScore). The causal map above is precisely the cure: every one of those pairs sits on an arrow or a gate here, so the generator draws them *jointly*. Any column pair that v1 broke must appear in this map — use R3 §4 as the completeness checklist.

**Query-coverage check (R3):** 9+ v1 engagement queries aggregated a dead `EngagementScore` column, and 4 campaign-ROI queries ran on a never-seeded CampaignMember table. Rule for v2: **every shipped query must have a benchmark or arrow here that guarantees its result is non-degenerate** — R3 §1's keep-list is the enumeration.

## International review (2026-07-02 — MoreCheese is an INTERNATIONAL federation, not a US association)

**The bias, stated honestly:** R1/R2 calibrated on US sources (MGI is a US survey; ACS is a US body). Triage of what that actually contaminates:

| Transfers fine (association behavior, not US behavior) | US-contaminated (needs internationalizing) |
|---|---|
| Renewal curves, first-year cliff, engagement→renewal coupling (MGI — downgrade confidence one notch internationally, but keep) | **Region value list** — 3 NA subregions vs 1 "EU" bucket is backwards for an international federation |
| Email open/click, no-show-by-price, giving shape, forum over-dispersion | **Legislative/regulatory topics** — FSMA and the FDA 60-day raw-milk rule are US-only; EU members care about PDO/PGI, and the common-names dispute *flips sides* (EU protects the names the US fights to keep generic) |
| Dues levels (USD-denominated is a defensible demo simplification — see open Q) | **Competition analog** — ACS J&C is national; World Cheese Awards (~4,000+ entries, 40+ countries) is the right calibration for an international federation |
| COVID regime | **Annual-cycle regime** — keyed to the ACS calendar (May judging, July conference, "American Cheese Month") |
| | **Geography mix itself** — no prior exists for what share of members are NA/EU/APAC — it's THE new top-level driver |

R2b research (in flight) fills these: World Cheese Awards volumes, Guilde Internationale des Fromagers as the true international-society analog, EU-side regulatory list, rebalanced regions, and any non-US association benchmarks.

**New driver node:** `geoMix` — the distribution of members over regions (needs a team decision; R2b will propose one). Everything homophily-related keys off it.

**New/revised arrows from the international lens:**

| # | Arrow | Sign | Strength | Mechanism |
|---|---|---|---|---|
| 2.10 | travelDistance(member,event) → P(register in-person) | − | strong | replaces 2.2's binary region-match internationally — a Lyon member doesn't fly to a Vermont chapter meeting; distance is continuous, not same-region/not |
| 2.11 | flagshipWorldEvent × distance | interaction | med | the annual world conference *suspends* much of the distance penalty — it's the one event everyone travels for |
| 2.12 | timezoneOffset(member,event) → live attendance (virtual) | − | med | Europeans don't attend 2pm-Pacific webinars live |
| 5.13 | jurisdictionMatch(member.region, issue.body) → advocacyAction | match | strong | EU members act on PDO/GI issues; US members on FDA issues — advocacy is region-homophilous |

**Genuine gaps found in review (not bias — missing arrows for composed apps):**

| # | Arrow | Sign | Strength | Mechanism |
|---|---|---|---|---|
| 1.14 | activeCertification → renewed? | + | med | credential holders are professionally invested — feeds the cert-upsell story |
| 5.10 | engagement → committeeMembership | + | med | committee seats are a top Sonar signal but had NO generating arrow |
| 5.11 | tenure + careerStage → officer/chair roles | + | med | leadership skews senior |
| 5.12 | engagement → secure-messaging activity | + | med | "message activity" is in Sonar's factor list but nothing generated messages |
| 5.14 | overall activity level → support tickets (issues app) | + | weak | tickets follow usage, not engagement per se |

Also: **1.2's mechanism example ("WI/CA producers") is US-parochial** — rewrite with international examples at workshop; **3.8 bundles two hops** (CE credits → renewal) — split into two arrows when authoring the ruleset.

**Open decisions — RESOLVED 2026-07-02 (Barnatt: customer base is US → lean US metrics):**
1. **Geography mix: 60% NA / 25% Europe / 15% RoW** (US-majority international federation; R2b's 12-value Region list kept for flavor). Arrows 2.10–2.12 stay — they now shape the international *minority*'s behavior.
2. **Currency: single USD** — off Marcelo's blocking list.
3. **Event topology: fixed US-hosted flagship conference** + chapter/regional events. The WCA host-country-bump arrow is NOT adopted.
4. Certification: one global credential (CCP-style) — consistent with US calibration.
5. **Honorific grades: rejected** — MembershipType stays a paid-tier-only dimension.

## 2026-07-07 — post-v0.9 alignment: proposed NEW arrows (benchmarks now exist with no generating arrow; DRAFT for workshop)

The v0.8/v0.9 gap-fill passes added benchmark families this map predates. Each proposed arrow
below cites the benchmark it must reproduce:

| # | Arrow | Sign | Strength | Mechanism / benchmark |
|---|---|---|---|---|
| 4.8 | payerTimingTrait (per-member sticky early/on-time/late) → days-to-pay | trait | med | `payer_trait_persistence` 0.70 — timing is a persistent member trait, not an independent draw; interacts with grace/lapse + back-dated renewals |
| 4.9 | invoiceChannel (card-at-checkout / auto-pay dues / net-terms B2B) → payment-timing shape | gate/mixture | strong | the `payments_timing` 3-part mixture: checkout mass, due-date spike (+3–14d failed-card retries), Atradius/CRF late curve for net-terms only |
| 4.10 | affluence → merch orders | + | weak | `merch_orders_per_member_year` 0.15, `merch_revenue_share` 2.5% — affluence-coupled like other spend |
| 5.15 | season(Nov–Jan renewal window) → support tickets (dues/login topics); post-event window → refund/transfer tickets | + | med | `support_topic_mix` seasonal coupling — seasonality matters more than topic precision (R11 flag) |
| 1.15 | employerEvent (dissolution / acquisition / program-cut) → renewed? | − | med | crowd-level mechanism behind the hero churn stories (Anna/Bob/Danielle all churn via employer events); makes "every lapse has a findable cause" (FEATURES-REVIEW #2) statistical rather than hero-only — requires employer-org lifecycle events in the generated world |

## Workshop protocol
1. Walk arrows ranked by strength (strong first). For each: agree/flip/cut + one-line justification survives into the ruleset as `signPrediction` + `justification`.
2. Fill strengths marked TBD from R1/R3 deliverables.
3. Confirm the copula (φ↔θ +med) and whether `expertise` earns its place as a third latent (cost: every ε arrow) or folds into θ.
4. **Confirm the 2026-07-07 proposed arrows above** (4.8–4.10, 5.15, 1.15) — they carry benchmarks with no other generating mechanism.
5. **Ratify GAP-12** (calendar-year renewals vs release-relative hero pins — see `../gaps-to-fill.md`): Barnatt's proposal (2026-07-07) is option (a) — calendar-year dominant + a ~25–30% anniversary cohort via auto-pay-bills-on-anniversary (+ optional grandfathered legacy cohort from a 2022 policy switch). Confirm with Robert/Amith; if ratified, the renewal-unroll rule gains a cycle-type branch and Marcus Chen moves to the anniversary cohort (auto-renew OFF).
6. Output = `X.correlations` + `CausalDAG.edges` first draft for the vertical slice (arrows 1.1–1.12, 2.1–2.9, 4.1–4.3 + the payments arrows 4.8–4.9 if the money chain is in-slice).
