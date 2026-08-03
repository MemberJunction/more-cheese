# MoreCheese Demo Data — What We Will Build (Summary for Sales Review)

**Date:** 2026-07-05 · **Status: FOR REVIEW** — this is the pre-generation approval document.
Once sales signs off (and the open items in §7 are decided), we generate the dataset.
Deep-dive companions: `research-plan-and-schema-proposal.md` (design),
`research/benchmarks-draft.json` v0.9.2 (every target number, primary-source-verified), `hero-personas-draft.md` (the
named characters), `gaps-to-fill.md` (what's still open), and the master plan at
`mj/plans/association-db/v2-plan.md` + `PLAN-UPDATES.md`.

---

## 1. The pitch (one paragraph)

We are building the demo database for **MoreCheese — the International Cheese Federation**, a
fictional but rigorously realistic professional association of artisan-cheese people (~2,500
members at default scale, ~15,000 at large). It is not random filler data: every rate a prospect
might sniff-test (renewal %, conference turnout, email opens, medal rates, revenue mix) is
calibrated to **published industry benchmarks and real IRS-990 filings** of the closest real
associations (American Cheese Society and eight craft-food peers). The same person shows up as
a member, an event attendee, a course-taker, a committee voter, a forum poster, a payer, and an
engagement score — because **cross-system unification is the product demo**. A cast of named
"hero" members with hand-written storylines stays stable release after release, so demo scripts
("let's look at Elena Rodriguez") never break.

## 2. The world

- **Organization:** professional society (individuals are members), US-majority with an
  international minority (60% NA / 25% Europe / 15% rest-of-world), single currency USD,
  calendar-year memberships (December renewal spike), ~$1.7M annual revenue — only ~22% from
  dues; events and programs are the financial engine (exactly like the real ACS).
- **People:** cheesemakers, affineurs, mongers/retail buyers, distributors, QA/food-safety
  managers, educators, enthusiasts — employed across ~625 organizations (mostly small
  creameries and shops), 15 regional chapters.
- **History:** 5 years of activity, shaped by real-world regimes — steady growth → COVID shock
  (events halved, competition canceled) → recovery → today's hybrid normal → the annual cycle
  (spring entry deadlines, May judging, July flagship conference + exam, holiday retail spike,
  December renewals).

## 3. The data we will create (default/medium scale)

| Domain (simulates) | What gets generated | Rough volume |
|---|---|---|
| Identity & orgs (AMS core) | People, organizations, employment, addresses, contacts, relationships — incl. **~50 deliberate duplicate people** and **~100 stale-employer records** (they power the dedup + enrichment demos) | ~2,500 people, ~625 orgs |
| Membership (AMS) | Member profiles, membership periods with real lifecycle (renewals, late renewals inside a 2-month grace, lapses, cancels, pending-renewals), dues | ~7,500 period rows (3 per member) |
| Events (event registration system) | Conferences, workshops, webinars, chapter meetings + sessions, speakers, registrations with realistic no-shows (8% paid in-person, ~55% free webinar) and a non-member registrant share (~32%) | ~15 events/yr × 5 yrs; ~5,500 registrations/yr |
| Learning & certification (LMS) | Courses, enrollments (72% completion), certification programs, cert records, CE credits, exam sittings at the conference | ~1,100 enrollments/yr; ~500 active certs |
| Community (Higher Logic-style) | Forum categories/threads/posts/reactions — heavily skewed to a vocal top decile, like real communities | ~10,000 posts/yr |
| Marketing (HubSpot/rasa-style) | Campaigns, segments, templates, email sends with realistic engagement (34% open / 3% click / 0.2% unsub) | ~190,000 send rows/yr — the big-data table |
| Committees & governance | Committees (8 standing, ~60 seats), terms, meetings, agendas, attendance, motions, votes, minutes | full governance record |
| Support (Izzy-style) | Service tickets from members AND non-members: membership questions, event/course issues, refunds, registration transfers, login problems | ~1,500 tickets/yr (topic mix + renewal-season/post-event spikes per the GAP-2 estimate-led taxonomy) |
| Secure messaging | Member↔staff and board threads | staff-volume calibrated |
| Awards & competition | Products (cheeses), annual competition, entries (~1,575/yr from ~210 member companies), judges, scores, medals (25% medal rate — judged scores and medals actually agree) | ~110 products, 5 competitions |
| Advocacy / legislative | Bodies, issues (raw-milk rules, labeling, FSMA…), positions, member advocacy actions | 12 issues, ~150 actions |
| Money chain (orders → payments → accounting) | Every dues renewal, event registration, enrollment, entry fee, product purchase **and donation** becomes an **order → payment → balanced journal entry**; payments land early/on-time/late against due dates with per-member payer habits — card-at-checkout mass, an auto-pay due-date spike, and a sourced B2B late curve for net-terms invoices (Atradius/CRF-calibrated; module switches on when the orders app ships). Donations ride Orders as **post-install configuration** (donation products/categories/GL accounts shipped as demo seed config, per the domain lead's ruling) | every dollar reconciles |
| Engagement scoring (Sonar) | Signals computed **from the actual generated behavior** (not invented): event, course, forum, committee, advocacy, payment-recency components → composite scores, history, bands (50% engaged / 40% casual / 10% ghost) | 1 score + history per member |
| Analytics | The 108 curated queries ported from v1 — each guaranteed a meaningful, non-degenerate answer | 108 queries |

## 4. Why a prospect will believe it (the credibility layer)

Headline numbers and their evidence — the full list with tolerances is `benchmarks-draft.json`:

| Number | Value | Grounding |
|---|---|---|
| Renewal rate | **87%** overall; **68%** first-year; 92% at 5+ years | IRS-990 dues-trend analysis across 8 real craft-food societies + MGI benchmark — every figure verified against the e-filed 990s (2026-07-07) |
| Flagship conference | **35%** of members attend + ~32% of registrants are non-members | Real ACS attendance (~1,000–1,300 of ~2,300) |
| Individual dues | **$175** | ACS exactly — verified on cheesesociety.org (2026-07-07; full tier lattice matches) |
| Dues share of revenue | **22%** (events/programs ~78%) | ACS FY2024 IRS-990 |
| Email engagement | 34% open / 3% click | Higher Logic association benchmark |
| Competition | ~7.5 entries per entering company, 25% medal rate | ACS 2025 actuals |
| Engagement mix | 50/40/10 engaged/casual/ghost | Team ground truth (the domain lead), coupled to renewal 95/82/67 |

## 5. How we control the structure (why this won't be "random data that looks off")

1. **A causal model, not independent dice.** v1's core flaw was drawing related facts
   independently (members "Active" with expired dates; medals unrelated to judges' scores). v2
   generates from a reviewed **causal map** (~45 signed arrows: tenure→renewal,
   engagement→attendance, affluence→tier→spend…), so cross-tabs, drill-downs and AI analyses
   hold up under scrutiny.
2. **Benchmarks with tolerances, checked by machine.** Every target in §4 is encoded in
   `benchmarks-draft.json`; after generation we *measure the data* and fail the build if it
   misses tolerance. Some benchmarks are held out as blind validation.
3. **Hard rules in the schema itself.** Status↔date consistency, attendance↔check-in,
   CEUs-only-for-attendees, click-requires-open etc. are database CHECK constraints — the v1
   bug class becomes *unrepresentable*. Cross-row rules (late-renewal back-dating, grace-period
   lapse timing) are enforced at generation and re-verified by an **install-time integrity
   check**. Member status is always **derived from the membership records** — never a stored
   column that can drift (the confirmed v1 bug).
4. **Stable heroes, deterministic crowd.** 22 (20 members + 2 staff, growing to 50–100) hand-authored hero members
   with storylines are pinned inputs; the generator builds a consistent history around them.
   Same seed → identical output, so **names and demo scripts survive every rebuild**. Heroes
   are release-blocking: every release re-verifies each one loads with their storyline intact.
5. **Never stale.** All dates are authored relative to release day and baked at each quarterly
   release ("upcoming" events stay upcoming); a date-shift utility covers mid-quarter refreshes.
6. **Demo-safe.** Every generated row is flagged `IsSharedDemo`, so refreshes never touch real
   production records when morecheese.org goes live.

## 6. Requirements & features the data will support

**Requirements (the data must…):**
- REQ-1 Reproduce every §4 benchmark within tolerance at default scale.
- REQ-2 Satisfy all temporal/status invariants (incl. the Q&A rulings: RenewalDate = next due ≈
  EndDate; CancellationDate = termination for cancels AND lapses past 2-mo grace; late renewals
  back-date; no static member status).
- REQ-3 Keep hero identities and storylines stable across releases (release blocker).
- REQ-4 Resolve every cross-system soft key (person appears consistently in all systems).
- REQ-5 Give all 108 shipped queries non-degenerate results.
- REQ-6 Regenerate byte-identically from the committed seed; install never runs the generator.
- REQ-7 Ship small (~500) / medium (~2,500) / large (~15,000) presets — large is the "10k+
  credibility" build (size-attenuated: flagship ≈ 2,000 total registrants, ~1,400 member
  attendees ≈ 9% of members; revenue ≈ $4M — anchored on real turnouts of same-size associations).
- REQ-8 Include labeled dirty data with known-truth answers (duplicates, stale employers).
- REQ-9 Make every dollar reconcile: order → payment → balanced journal entry, with realistic
  payment timing vs due dates (3-part mixture: checkout / auto-pay / net-terms).
- REQ-10 Carry the COVID/recovery/seasonal regimes so time-series charts tell a true story.

**Features/demo scenarios this enables (each anchored by a named hero):**
- Churn diagnosis & win-back, three distinct flavors (**Anna Brown** — the team's named
  "why did she churn?" post-lapse walkthrough; Bob Kowalski — the acquisition-driven decline,
  still savable; Danielle Okafor — the employer-closure lapse, win-back)
- Renewal-at-risk outreach & reminder cadences (Marcus Chen, pending renewal in ~3 weeks)
- Member 360° / "tell me about Elena" semantic search (Elena Rodriguez)
- Duplicate detection & merge (Kate O'Leary ×2) · Data enrichment (Aisha Bell's stale employer)
- Engagement scoring with component breakdowns (Tom Reyes: all-advocacy engagement vs Elena's
  all-rounder profile) + counter-patterns that stress-test naive models (Jamie Fuller: high
  engagement/low revenue; Victor Sandoval: zero engagement/auto-renewing corporate)
- Certification pipeline & completion forecasting (Sofia Marchetti, Priya Natarajan)
- Committee governance: meetings, motions, votes, minutes (Gwen Whitfield)
- International/timezone behavior (Henri Dubois, Lars Vestergaard, Charlie Mason)
- Predictive Studio: churn, renewal likelihood, LTV, attendance forecast, cert completion,
  event ROI (Dale Peterson's mispositioned winter workshop) — all fed by Sonar engagement signals
- Cross-system unification story: AMS + LMS + marketing + community + support + event reg
  joined by soft keys — "one member, six systems, one view"
- New-member conversion story (non-member conference registrants; Nia Thompson cold start)
- Support workflows incl. refunds and registration transfers (estimate-led taxonomy, seasonal spikes)
- Optional **declining-association scenario** for dramatic retention demos (real craft-food
  decline curves)

## 7. Open items before generation (the approval checklist)

> The open decisions — with recommendations and one-line evidence per item — live in
> **[DESIGN-REVIEW.md](DESIGN-REVIEW.md) §1** (the design review). The items below are the
> same asks in summary form.

1. Sign off **renewal 87%** and **conference 35%** (evidence packet vs the domain lead's 89/25 priors).
2. Confirm **grace period = 2 months** and **org count ~625** at medium (deviation from the
   master plan's ~25 — needed for a credible competition).
3. Choose the **default preset for the hosted demo** (recommend large 15k per the "10k+" ask —
   size-attenuation is now in place: at 15k the flagship runs ~2,000 total registrants
   (~1,400 member attendees, ≈9% of members) and revenue ≈ $4M, anchored on real reported
   turnouts of same-size associations).
4. **Bless the hero names** (permanent afterward) + assign hero-authoring ownership.
5. Gap status per `gaps-to-fill.md` — as of 07-06 evening, **all gaps are closed or routed**:
   GAP-1 (payment timing) FILLED with approved sources (Atradius/CRF primary) + the 3-part
   mixture model; GAP-2 (support taxonomy) resolved estimate-led (Gartner + HDI anchors only);
   GAP-3 dropped to `DEMO-BACKLOG.md` (integration modeling deferred — simple baseline schemas
   ship); GAP-4 merch estimate in; GAP-5 (large-preset attenuation) FILLED — anchored on real
   association data (ACF/ATA turnouts + ACS anchor): a 15k org's flagship ≈ 2,000 total
   registrants (~9% member attendance), revenue ≈ $4M; GAP-6/7/8 decided (templates, donations-as-Orders-config, hero roster with
   Anna Brown carried); GAP-9 backlogged. **Remaining before generation: only the GAP-10 team
   sign-offs (item 1–4 above) + the reconciliation and causal-map sessions.**
6. Then: schema reconciliation + causal-map workshop → ruleset v0.1 → **pilot at N≈500** →
   sign-check → full generation.
