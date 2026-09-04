# Ruleset Research — Deliverables Index

Execution of the research plan in [../research-plan-and-schema-proposal.md](../research-plan-and-schema-proposal.md) (Part 1). Status as of 2026-07-02.

> **2026-07-05 — Q&A-alignment + gaps pass applied (Marcelo's agent, Barnatt-approved).**
> `benchmarks-draft.json` is now **v0.8**: internal inconsistencies fixed (large preset = 15,000
> everywhere, 108 queries everywhere, anniversary-renewal superseded marker in R6, acquisition
> re-derived at 87%, Pending-Renewal slice added to status_mix), and the team-answers-vs-evidence
> precedence rule formalized (evidence may overturn a team prior, but every overturn goes back for
> sign-off — 87-vs-89 and 35-vs-25 are pending with Robert). The remaining open holes are
> consolidated in **[../gaps-to-fill.md](../gaps-to-fill.md)** (GAP-1..10) — that register
> supersedes the scattered "open items" below where they overlap. Q&A → master-plan integration:
> `mj/plans/association-db/PLAN-UPDATES.md`. Sales-review summary: [../DATA-SUMMARY.md](../DATA-SUMMARY.md).

| Workstream | Deliverable | Status |
|---|---|---|
| R1 — Industry benchmarks | [industry-benchmarks.md](industry-benchmarks.md) — MGI 2024/25, Higher Logic, FEP; renewal/tenure curve, no-show splits, email, giving | ✅ done (web-researched; spot-check citations before treating as verified) |
| R2 — Cheese domain | [cheese-domain.md](cheese-domain.md) — ACS analog numbers, CHECK-ready value lists, competition volumes, regimes | ✅ done |
| R3 — v1 demo mining | [v1-implied-targets.md](v1-implied-targets.md) — 108 queries → implied targets, seed distributions with file:line refs, bug inventory, v2 targets | ✅ done |
| R4 — Team ground truth | [team-interview-guide.md](team-interview-guide.md) — Robert + Amith scripts, hero persona template | 🟡 prepped — **needs scheduling** (interviews are human work) |
| R5 — Causal map | [causal-map-draft.md](causal-map-draft.md) — ~47 signed arrows, evidence-annotated | 🟡 draft — **needs the workshop** (review signs/strengths with Marcelo, Madhav, Robert) |
| R2b — International domain | [international-domain.md](international-domain.md) — World Cheese Awards volumes (verified 3 yrs), Guilde Internationale des Fromagers as the real international-society analog, EU-side regulatory list, 12-value Region list + proposed 60/20/20 geo mix, 7 open decisions | ✅ done — **decisions pending** (see below) |
| R6 — Finance & ops | [finance-ops-benchmarks.md](finance-ops-benchmarks.md) — revenue mix (ASAE: dues 30% for societies), grace periods (MGI verified), staff ratios (PARN), budget, committees (ASAE 2023) | ✅ done |
| R7 — Engagement extras | [engagement-benchmarks-extra.md](engagement-benchmarks-extra.md) — 9-point conference-attendance dataset + the 25/50 units-error ruling (→35%), first-year validation, recert, giving, email validation | ✅ done |
| R8 — Food-sector calibration | [food-sector-benchmarks.md](food-sector-benchmarks.md) — 11 org profiles + **real IRS 990s** (ACS/ACF/IACP/IFT via ProPublica); verdicts vs every calibration target | ✅ done |
| R9 — Closest-to-cheese cluster | [cheese-cluster-benchmarks.md](cheese-cluster-benchmarks.md) — 8 artisan craft-food societies (Bread Bakers Guild = the size twin, Cider, FCIA, WCMA, cheese guilds…) with **year-by-year 990 dues-trend tables** as retention proxies; settles renewal + conference | ✅ done |
| R10 — Payment timing *(added 2026-07-06, was GAP-1)* | [candidate-sources/gap1-payment-timing-sources.md](candidate-sources/gap1-payment-timing-sources.md) — days-to-pay vs due date; 3-part mixture model (checkout / auto-pay spike / net-terms B2B curve); Atradius + CRF primary, Xero/QB secondary | ✅ reviewed & adopted (Marcelo) |
| R11 — Support topics *(added 2026-07-06, was GAP-2)* | [candidate-sources/gap2-support-topics-sources.md](candidate-sources/gap2-support-topics-sources.md) — ticket taxonomy + volumes; ESTIMATE-LED (no association-native data exists): Gartner + HDI/MetricNet kept, marketing-grade sources removed as evidence | ✅ resolved estimate-led (Marcelo) |
| R12 — Size attenuation *(added 2026-07-06, was GAP-5)* | [candidate-sources/gap5-size-attenuation-sources.md](candidate-sources/gap5-size-attenuation-sources.md) — participation α = 0.55 fitted on ACF/SNA/AND vs the ACS anchor (expo/confounded orgs removed); large = 13% conference, ~$4M revenue | ✅ reviewed & fitted (Marcelo) |
| *(backlogged)* — HubSpot/Higher Logic object models *(was GAP-3)* | [candidate-sources/gap3-hubspot-higherlogic-docs.md](candidate-sources/gap3-hubspot-higherlogic-docs.md) — public dev-doc survey, parked | 📦 backlogged → `../DEMO-BACKLOG.md` BL-1 |
| Synthesis | [benchmarks-draft.json](benchmarks-draft.json) — consolidated targets + tolerances + scaling laws + regimes + scenarios, holdouts marked. **Canonical target list** — where any prose doc disagrees, the JSON wins | ✅ **v0.9-draft** |

## Headline findings

1. **ACS is a near-perfect analog** (~2,300 members vs our 2,500 medium preset) with real volumes: 1,596 competition entries / 122 categories / ~25% medal rate / conference ≈ **50%** of membership (spot-check corrected from 60% — published attendance is ~1,000–1,300, not 1,400).
2. **The tenure→renewal curve is real and published**: yr-1 ~75% vs overall 85% blended (MGI); for individual-member orgs the cliff is steeper (64% vs 82%) — and since MoreCheese is **decided to be a professional society**, the steep IMO curve is the one we generate.
3. **No-show splits ~10× by price/format** (3–10% paid in-person vs 50–60% free webinar) — must be modeled as an interaction, not a flat rate.
4. **v1's bugs are one flaw repeated**: correlated facts drawn independently (Status ⊥ EndDate, Medal ⊥ JudgeScore, …). The causal map is the systematic cure; R3 §4 is the completeness checklist.
5. **Whole v1 query families ran on dead columns** (EngagementScore all zeros, CampaignMember empty). v2 rule: every shipped query gets a benchmark guaranteeing a non-degenerate result.

## Open items (blocking ruleset v0.1)

1. ~~Trade vs professional society~~ **DECIDED 2026-07-02: professional society** (individuals are members, per the morecheese site) → IMO renewal parameters (82% overall, 64% first-year). ~~Conference attendance conflict~~ **DECIDED: follow real ACS data (~60% of membership)**. Both applied in `benchmarks-draft.json` v0.2.
2. ~~R4 interviews~~ **ANSWERS RECEIVED 2026-07-02** (team thread) — applied in v0.4: renewal **89%**, course participation **50%**, engagement mix **50/40/10**. Date semantics confirmed + schema-shaping changes: **CancellationDate = termination date covering BOTH explicit cancels and lapse-past-grace**; late renewals back-date (next StartDate = RenewalDate); **static member-level status is banned** (the confirmed v1 bug).
2b. **R6/R7 second research pass applied in v0.5** — ✅ conference RE-RESOLVED at **35% member attendance + 30% non-member registrants** (units-error diagnosis); grace period 2mo; staff 10 FTE; email unsub/bounce validated; committees 8/60/quarterly.
2c. **R8 food-sector calibration applied in v0.6** (Barnatt's ask: food orgs model us better — confirmed). **Ground truth from real ACS 990s**: dues share 30%→**22%** of revenue (program services 77.8% — event-dependence is the defining finance fact), total revenue $1.71M actual, dues $175 confirmed exactly, **calendar-year membership → December renewal spike** (new regime + schema convention), cert candidates 8%→**4.5%**/yr, giving re-shaped (sponsor-driven; individual donations ≤2% of revenue). Retention adjusted: renewal 87%, first-year 68%, enthusiast 65%.
2d. **R9 closest-to-cheese cluster applied in v0.7** — **both pending flags RESOLVED by in-domain evidence**: renewal **87% confirmed / 89% rejected** (990 dues-trend proxy unanimous across individual-member craft-food analogs — Bread Bakers Guild −3%/yr × 6yrs, Cider −6.7%, FCIA −16%, CA Artisan Cheese Guild 6 down years; only company-dues WCMA grows); conference **35% confirmed, conservative** (flagship craft societies run registrants ≥ membership). Bonus: $175 dues independently re-confirmed (Cider = exactly $175), 22% dues-share re-confirmed, non-member cert candidates 20→30%, staff 10→8 FTE, `decliningOrg` now has in-domain calibration (Mead Makers −78%, CACG). Present the 990 evidence to Robert as an FYI rather than a question — the data is unambiguous. ⚠️ 990 figures are LLM-transcribed from ProPublica; spot-check the load-bearing ones before ruleset freeze.
2b. **Hero personas — draft v0.1 ready for team review**: [../hero-personas-draft.md](../hero-personas-draft.md) — 16 personas covering all required archetypes (NA/EU/RoW ≈ decided 60/25/15), pinned-facts design note, governance rules. Team blesses/edits names (permanent after that) and settles ownership (OQ-7).
3. **Hold the R5 workshop** — walk the arrow list, agree signs, confirm the copula and whether `expertise` stays a third latent.
4. **Marcelo reconciliation** (schema proposal Part 2) — the 🔴 interface asks (org size/region home, Subscription shape, order line shape) block the vertical slice. **NEW ask (2026-07-02): org count.** The v2 plan's ~25 orgs at medium scale can't support the ACS-calibrated competition chain (~210 entrant companies needed); scaling laws now use members × 0.25 ≈ 625 orgs — needs sign-off as a deviation from the v2 plan.
5. Then: assemble ruleset v0.1 (vertical slice: member → subscription → event registration), pilot at N≈500, sign-check.

## Known gaps (non-blocking, unowned — from external review 2026-07-02)

- ~~US bias~~ **RESOLVED 2026-07-02 (Barnatt): customer base is US → lean US metrics.** Kept: ACS competition calibration (~1,600 entries, not WCA's 4,500+), MGI benchmarks at full confidence for the demo audience, fixed US-hosted flagship conference, single-currency USD. **Rejected:** honorific membership grades (Guilde ladder). **Retained from R2b:** the 12-value international Region list (weighted NA-heavy: geo_mix 60% NA / 25% Europe / 15% RoW, fine-tunable in R4), the internationalized regulatory topics viewed from the US side, and the distance/timezone causal arrows (2.10–2.12 — still valid for the international minority). Applied in benchmarks-draft.json **v0.3**. `international-domain.md` stays as reference if a future demo variant wants the EU-flavored version.

- ~~Composed-app volumes~~ **MOSTLY FILLED by R6 (2026-07-02)**: staff ≈ 10 FTE, member-service contacts ≈ 0.6/member/yr (ESTIMATE — no association benchmark exists), 8 standing committees / ~60 seats / quarterly cadence. Still unfindable: internal staff-messaging volume (will have to be a reasoned invention in the ruleset).
- **Donations' schema home is unstated**: giving has arrows (4.5–4.7) and benchmarks but no table in the schema proposal — presumed to flow as donation-type order lines through `orders`; confirm in the Marcelo reconciliation.
- **Text templates have no workstream**: the 4th ruleset content type (bios, tasting notes, forum posts) has requirements in the schema proposal (G13) but no authoring plan yet. Fine until after the vertical-slice pilot; don't lose it.
- ~~Citation spot-check~~ **DONE 2026-07-02** (verdicts logged in `benchmarks-draft.json` `$verification`): MGI IMO 82%/64% and Higher Logic open rates confirmed against primary sources; two corrections applied — paid in-person no-show 6%→8%, conference attendance 58%→50% (ACS published attendance is ~1,000–1,300, not ~1,400). Bonus: MGI's lack-of-engagement reason is 37% for IMOs (47% was the blended figure) — benchmark switched to the IMO split.
