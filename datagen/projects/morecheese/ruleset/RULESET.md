# The MoreCheese Ruleset, in plain English

> **Auto-generated** from `ruleset/modules/` by `explain.mjs` — do not edit by hand.
> Ruleset v0.0.2. Effects below are shown in **percentage points**, computed from the
> compiled effect sizes over a reference population. The JSON stays the executable truth;
> this page is its readable rendering.

## The world

- **2500 members** (the demo scope; tests run a 500-member pilot via --n), history from 2013, flagship conference every July 15.
- Geography: 60% NA · 25% EU · 15% RoW — members cluster in real dairy-belt cities with real coordinates.
- Organizations: about 1 per 4 members; 45% are producers; each year ~2% of orgs hit a lifecycle event (dissolved / acquired / program cut) — the fuel for employer-driven churn stories.
- Renewal cycles: 70% calendar-year (everyone expires Dec 31) + 30% anniversary cohort *(D6 assumption, pending ratification)*.
- Two **hidden dials** per member — engagement and affluence, correlated 0.4 — never stored; everything visible flows from them. Engagement **drifts**: a stable anchor (60% of the variance) plus a slow yearly wander, so members rise and fade — and decline precedes lapse.
- Eras: COVID (2020/2021) dents renewal by -0.25 on the dial, halves event volume, and makes the conference virtual — applied to the baseline (tide, not boats), so it can't be calibrated away.
- Membership tiers (the affluence dial made visible): Enthusiast $150 · Individual $175 · SmallBusiness $400 · Corporate $1000 — org-backed members climb tiers as affluence rises.

## The renewal rules

The population averages **87% renewal** (±2pt check tolerance), wandering the 84%–90% band year to year — on purpose (real data is lumpy; too-smooth fails the build). The grace period is 2 months; a lapse past grace gets a termination date.

Who differs, and by how much:

| Rule | Effect (percentage points) | Authored as | Evidence |
|---|---|---|---|
| Longer-tenured members renew more | **+4.1pt** per extra “standard deviation” of tenure | β 0.55 (expert form) → compiled β 0.55 | per 1 SD of tenure at decision |
| Engaged members renew more | **+7.0pt** per step of the hidden engagement dial | β 1.1 (expert form) → compiled β 1.1 | latent theta; validated via behavioral proxy (attenuated) |
| Auto-renew members stick around | **+12.1pt** vs members who renew by hand (the group lands at ~95%) | "+12 points" (human form) → compiled β 1.721 | MGI: +10-15pt |
| Employer trouble drives churn | **-8.6pt** when a member’s employer dissolves / is acquired / cuts the program (causal arrow 1.15) (the group lands at ~79%) | β -0.9 (expert form) → compiled β -0.9 | arrow 1.15 — dissolution/acquisition in the decision year. BUILT-IN driver (computed: org lifecycle × decision-year window) — richer than feature grammar v1; migrates when the grammar earns cross-entity time windows |
| The enthusiast tier churns hardest | **-23.2pt** hobbyists vs professional tiers (the group lands at ~67%) | "lands at 65%" (human form) → compiled β -1.948 | hobbyist churn is real (AHA analog); benchmarks renewal_rate_enthusiast_tier |

## The event rules

- ~5 workshops + 6 webinars a year, plus the flagship conference (**35% of members attend**; virtual in 2020/2021).
- Registration volume rides the engagement dial (over-dispersed — a vocal minority does most of it); COVID years run at 50% volume.
- No-shows: **8%** on paid in-person, **55%** on free webinars — engaged members ghost less.
- International members attend the flagship less (the distance arrow).

## The money rules

Every billable fact becomes an **order** (one renewal order per membership cycle — the posted order IS the bill, no invoices, per bizapps-orders' design) and usually a **payment**, timed by the DECLARED payment profiles (orders.paymentProfiles):

- Event registrations: **card at checkout** — paid the same day, always.
- Auto-pay dues: land **on the due date** (a ~3% failed-card tail retries a few days late).
- Manual dues: most pay early or on time; ~25% pay late inside the grace window.
- Business tiers pay on **net-30 terms**: ~45% pay late (median ~12 days — the sourced Atradius/CRF curve, thin tail).
- A payment dated after release day *hasn't happened yet* — those orders sit Unpaid or Overdue (real A/R aging), and every pending-renewal member carries an **open renewal order** (the outreach queue).

## Scenarios

A scenario is a **parameter overlay on the same causal model** (`ruleset/scenarios/`): `--scenario decliningOrg` rebuilds the whole world at ~78% renewal with hobbyists bleeding hardest — calibrated to real craft-food decline curves. The compiler re-solves every human-authored effect against the scenario's targets; the validator judges against them too. Same machinery, different universe, deterministic.

## The pinned people (heroes)

- **Elena Rodriguez** (`ICF-000101`) — Producer, Petaluma. Pins: {"status":"Active","minRegistrationsPerYear":2,"committeeSeat":"Standards Committee","issueMin":1,"formResponse":true}.
- **Marcus Chen** (`ICF-000102`) — Retailer, Seattle. Pins: {"status":"PendingRenewal","endDateWithinDaysOfRelease":[14,28]}.
- **Danielle Okafor** (`ICF-000103`) — Producer, Brattleboro. Pins: {"status":"Lapsed","employerDissolved":2025,"cancellationReasonContains":"employer"}.
- **Priya Natarajan** (`ICF-000104`) — Producer, Madison. Pins: {"status":"Active"}.
- **Bob Kowalski** (`ICF-000105`) — Supplier, Chicago. Pins: {"status":"Active","employerAcquired":2023,"issueMin":1,"formResponse":true}.
- **Henri Dubois** (`ICF-000107`) — Producer, Poligny. Pins: {"status":"Active","tier":"Corporate","competitionGold":2025}.
- **Kate O'Leary** (`ICF-000111`) — Retailer, Madison. Pins: {"status":"Active","duplicateOf":null}.
- **Kathy OLeary** (`ICF-000287`) — Retailer, Madison. Pins: {"status":"Active","duplicateOf":"ICF-000111"}.
- **Jamie Fuller** (`ICF-000113`) — Enthusiast, Portland. Pins: {"status":"Active","tier":"Enthusiast"}.
- **Victor Sandoval** (`ICF-000114`) — Supplier, Austin. Pins: {"status":"Active","tier":"Corporate"}.
- **Nia Thompson** (`ICF-000115`) — Retailer, Brooklyn. Pins: {"status":"Active","joinedDaysBeforeRelease":14}.
- **Charlie Mason** (`ICF-000116`) — Producer, Hobart. Pins: {"status":"Active","tier":"SmallBusiness"}.
- **Gwen Whitfield** (`ICF-000108`) — Educator, Chicago. Pins: {"status":"Active","committeeSeat":"Food Safety Committee","committeeRole":"Chair","issueMin":1,"formResponse":true}.
- **Sofia Marchetti** (`ICF-000106`) — Retailer, Brooklyn. Pins: {"status":"Active","certStatus":"InProgress"}.
- **Tom Reyes** (`ICF-000109`) — Producer, Ithaca. Pins: {"status":"Active","advocacyMin":30,"testimonies":2,"issueMin":1,"formResponse":true}.
- **Aisha Bell** (`ICF-000110`) — Producer, Petaluma. Pins: {"status":"Active","defect":"StaleEmployer"}.

## How to author a rule (the three vocabularies)

```jsonc
"autoRenew":      { "liftPts": 12 }          // human: "+12 points vs the others"
"enthusiastTier": { "groupTarget": 0.65 }    // human: "this group lands at 65%"
"someArrow":      { "strength": "med", "sign": "+" }  // workshop: qualitative band
"tenure":         { "beta": 0.55 }           // expert: log-odds per 1 SD
```

The compiler solves human forms into βs — including an **empirical refinement pass** that
runs the real generator on a reference world and adjusts until the stated effect is what
the data actually shows. You write the sentence; the machine makes it true.
