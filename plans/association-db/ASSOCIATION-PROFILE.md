# The International Cheese Federation — Association Profile

**What this is:** the fact sheet for the fictional association behind the MoreCheese demo.
If you're entering demo data, prepping a pitch, or checking whether a number "sounds right,"
this is the single document that describes the world.

Every figure traces to `research/benchmarks-draft.json` v0.9.2 (the canonical numbers file —
where any document disagrees with it, the JSON wins). Load-bearing figures were verified
against real IRS filings and primary sources on 2026-07-07. Figures the research could not
source are tagged **(estimate)**.

> ### ⚠ Pending decisions — read before treating this profile as final
>
> Four headline numbers below are **evidence-backed recommendations still awaiting team
> sign-off**, marked ⚠ where they appear. The formal decision list — with owners,
> recommendations, and evidence — is **[DESIGN-REVIEW.md](DESIGN-REVIEW.md) §1**:
>
> 1. **Renewal 87%** (§3) — vs the team's 89% prior *(D1)*
> 2. **Flagship attendance 35% of members** (§6) — vs the 25% prior *(D2)*
> 3. **Grace period = 2 months** (§3) *(D3)*
> 4. **~625 organizations** (§2) — a deviation from the master plan's ~25 *(D4)*
>
> **One known open item (GAP-12 / D6):** §3's calendar-year rule conflicts with three hero
> storylines pinned to *release-relative* renewal dates (Marcus, Danielle, Anna — marked ⚠ in
> §7). **Proposed resolution (pending the domain lead/the demo lead sign-off):** calendar-year stays dominant,
> plus a ~25–30% anniversary cohort — auto-pay members bill on their join anniversary, with an
> optional grandfathered cohort from a 2022 policy switch. Details: DESIGN-REVIEW D6.
>
> Also still ahead: the schema reconciliation with the schema owner
> ([RECONCILIATION-ASKS.md](RECONCILIATION-ASKS.md)) and the causal-map workshop. Everything
> else in this profile is settled.

---

## 1. Who they are

The **International Cheese Federation** (ICF) is a professional society for people who make,
age, sell, and champion artisan cheese. **Individuals are the members** — cheesemakers,
affineurs, cheesemongers and retail buyers, distributors, QA and food-safety managers,
educators, and a tail of serious enthusiasts.

- A US-based nonprofit professional society, US-majority with a real international minority
- Single currency (USD); online at **morecheese.org**; one US-hosted flagship conference
- Character: small, warm, events-driven — dues keep the lights on, but the **July flagship
  conference and the annual cheese competition are the beating heart**, financially and
  culturally
- Modeled closely on the real American Cheese Society (~2,300 members, the near-perfect
  analog), calibrated against eight other real craft-food societies
- The demo generates **five years of dated history**, shaped by real-world eras (§5)

## 2. The members

| Fact | Value | Grounding |
|---|---|---|
| Members (default scale) | ~2,500 (presets: small ~500, large ~15,000 — §8) | scale presets |
| Geography | 60% North America · 25% Europe · 15% rest of world | team decision |
| Segments | Producer, Retailer, Supplier, Educator, Enthusiast | schema value list |
| Disciplines | cheesemaking, affinage, mongering/retail, QA/food safety, education, distribution | persona/schema lists |
| Employer organizations | ~625 ⚠ *pending sign-off (D4)* — mostly small creameries and shops; ~280 producers, ~210 of them enter the competition | competition math |
| Chapters | 15 regional chapters (NA-East, NA-Central, NA-West, EU, APAC, Other) | plan + schema |
| Engagement mix | 50% engaged / 40% casual / 10% ghost | team ground truth (the domain lead) |
| Member status mix | 78% Active · 15% Lapsed · 5% Cancelled · 2% Pending-Renewal (seasonal — peaks Nov–Jan) | v1 intent, revised v0.8 |

**Membership tiers** (annual dues — the real ACS lattice, verified at source):

| Tier | Dues | Notes |
|---|---|---|
| Individual (professional) | **$175** | the core tier |
| Student | $75 | associate, non-voting |
| Enthusiast | $150 | associate; ~10% of individual members; renews at only ~65% |
| Small Business 1 / 2 / 3 | $225 / $400 / $600 | 1–3 seats |
| Corporate 4 / 5 / Plus | $800 / $1,000 / $1,250 | 4, 5, unlimited seats |
| Corporate Sustaining | $3,000 | unlimited + logo recognition |

## 3. Membership mechanics (the renewal machine)

| Fact | Value | Grounding |
|---|---|---|
| Membership cycle | **Calendar year for most — Dec 31 expiry** → Nov–Jan renewal spike; *proposed (D6, pending sign-off): ~25–30% anniversary cohort (auto-pay + grandfathered members) so renewals also trickle year-round* | real ACS convention + MGI mixed-cycle prevalence |
| Grace period | 2 months (grace runs to ~end of February) ⚠ *pending sign-off (D3)* | industry mode (MGI, n=548) |
| Late renewals | ~25% of renewals arrive after EndDate, inside grace **(estimate)** | MGI contact-persistence data |
| Renewal rate | **87% overall** ⚠ *pending sign-off (D1 — vs the team's 89% prior)* · 68% first-year · ~92% at 5+ years · ~65% enthusiast tier | e-filed 990 dues trends of the closest real analogs, verified 2026-07-07 |
| Why members leave | lack of engagement is the #1 stated reason (~37% of non-renewals) | MGI, IMO split, verified |
| Auto-renew | ~30% of members **(estimate)**; worth +12 points of retention | MGI lift |
| New members | ~14% of the base joins each year | steady-state at 87% |
| Win-backs | ~10% of lapsed members return within 2 years | i4a |
| History depth | ~3 membership periods per member on average (~7,500 period rows) | analytics need |

Rules the data always obeys:

- **Late renewal has no gap** — the next period back-dates to the prior renewal date.
- **A lapse past grace gets a termination date** (`CancellationDate = EndDate + 2 months`),
  whether the member quit or just stopped paying; the reason field tells you which.
- **Nobody is ever "Active" with an expired membership** — status is derived from the
  membership records, never stored (the v1 bug, now impossible).

## 4. Money

**~$1.7M annual revenue** at default scale — the real ACS's actual FY2024 figure. The mix:

| Stream | Share of revenue |
|---|---|
| Events & programs (conference, competition, education fees) | **~60%** — the financial engine |
| Membership dues | only **22%** |
| Education & certification | ~10% |
| Sponsorship | ~5% |
| Merchandise | ~2.5% (~0.15 orders/member/yr) **(estimate)** |
| Individual donations | ≤2% — association giving is sponsor-driven, not member-driven |

**Giving:** ~4% of members donate in a year **(estimate)**; 43% of donors repeat; 57% of gifts
are $100 or less (zero-inflated, right-skewed — a few big sponsors, many small gifts).

**How payments behave** (calibrated to Atradius / Credit Research Foundation data):

- ~85% of individual non-dues purchases (event regs, courses, merch) are **card-at-checkout**
  — paid same-day, before any due date
- Dues auto-payers create a **spike exactly on the due date**; ~3% of cards fail and retry
  3–14 days late
- Corporate/net-terms invoices behave like real B2B: ~45% pay late, typically ~12 days
  (median), with a **thin tail** — under 0.5% of receivable dollars go 90+ days
- Payment timing is a **sticky personal trait** (~70% of a member's payments land in their own
  early/on-time/late class) **(estimate)**
- Every dollar reconciles: **order → payment → balanced journal entry**

## 5. Time (the year, and the five years)

**The annual rhythm:**

1. **Spring** — competition entry deadlines
2. **May** — judging
3. **July** — flagship conference + the once-a-year certification exam
4. **October** — American Cheese Month
5. **Nov–Dec** — holiday retail spike
6. **December** — renewal crunch (grace runs to ~February)

**The five-year story** (era regimes the generated history follows):

| Era | What the data shows |
|---|---|
| Steady growth (…–early 2020) | baseline trends, growing events |
| COVID shock (2020–21) | events halved and virtual-heavy; **competition canceled both years**; renewal dip; producer sales crater |
| Recovery (2022–23) | in-person returns; judging decoupled to May |
| New normal (2024–) | hybrid mix stabilizes; in-person attendance growing again |

One nuance from the real world: **competitions rebound faster than conferences** after a shock
— contest revenue at the real analogs held steady through COVID while conference revenue
whipsawed.

## 6. Programs & activity

### The flagship conference (July, US-hosted)

- **35% of members attend** ⚠ *pending sign-off (D2 — vs the 25% prior)*; ~32% of registrants
  are non-members (a built-in conversion story)
- 8% no-show on paid in-person tickets; registrations grow ~10%/yr (950 → 1,050 arc, ~70%
  repeat attendees)
- Runs the certification exam sitting and anchors sponsor visibility

### Events overall

- **~15 events/yr**: the flagship, workshops, webinars, chapter meetings, networking
- ~2.2 registrations per member per year (~5,500/yr); published events fill to ~82% of capacity
- No-shows are honest: 8% for paid in-person vs **~55% for free webinars** — a 7× spread the
  dashboards can find

### Learning & certification

- **50% of members take a course each year**; ~1,100 enrollments/yr; **72% completion**
- Flagship credential (CCP-style) + a sensory-evaluation credential; ~500 active certifications
- ~4.5% of members sit the once-a-year exam; ~75% pass **(estimate)**; ~80% recertify each
  3-year cycle; **~30% of exam candidates are non-members** (certification sells to the
  periphery — a real growth-lever pattern)
- CE credits only exist for sessions actually attended (hard rule)

### The competition

- Annual; **~1,575 entries from ~210 member companies** (~7.5 entries each); ~110 distinct
  cheeses in the product catalog
- **25% medal rate**, and medals always agree with judges' scores (v1 shipped 51% medals and
  score-blind medals — both fixed)
- **Entry requires organization-level membership** — a hard eligibility gate (real ACS rule);
  international members ship wheels across oceans for it
- Canceled 2020–21 (COVID era), back from 2022

### Community & resources

- ~10,000 forum posts/yr (~4 per member) — but the **top tenth of posters writes ~75%**, like
  every real community; threads cluster by discipline
- ~25% of members download resources in a year, ~2–3 downloads each **(estimate)**
- Products carry tasting notes varied enough for believable semantic clustering
  (fresh/creamy, alpine, cheddar families…)

### Marketing & email

- ~75 sends/member/yr (**~190,000 send rows** — the deliberately big table)
- **34% open · 3% click · 0.2% unsub · 1% bounce** (association-sector benchmarks)
- Renewal reminder cadence: 60/30/7/day-of/lapsed, run by the membership director
- Campaigns, segments, and templates ship as first-class data

### Support & messaging

- ~1,500 tickets/yr (~0.6 per member) **(estimate-led)**; **~15% from non-members**
  (prospects, lapsed members, event guests, cert candidates)
- Topic mix **(estimate)**: login/access ~25% · membership & billing ~25% · events ~20% ·
  refunds & transfers ~15% · courses & certs ~15%
- Seasonal by design: dues/login spike Nov–Jan, refund/transfer spike after each big event,
  event questions ramp pre-conference
- Member↔staff and board secure-messaging threads, staffed by named people (§7)

### Governance & staff

- **8 standing committees, ~60 seats**, quarterly cadence; ~5% of members hold a volunteer
  role — with real terms, meetings, agendas, motions, votes, and minutes in the data
- Named committees include Standards and Food Safety (chaired by heroes)
- **8 staff** — lean, like the real craft-food cluster (3–11 FTE)

### Advocacy

- 12 live legislative issues (raw-milk rules, labeling, FSMA; PDO/GI questions for the
  EU minority — advocacy is region-matched), ~150 member actions/yr
- Some members are advocacy-shaped: high engagement expressed almost entirely through
  legislative action (see Tom Reyes)

## 7. The named cast (heroes)

**22 hand-authored people (20 members + 2 staff)** whose names and stories never change
between releases — every demo script anchors on one. Heroes aren't hand-written data: each is
a small set of pinned facts (join date, employer, milestones, latent engagement/affluence
levels) and the generator grows a full consistent history around them. Elena isn't *labeled*
engaged — she earns it when Sonar scores her actual activity.

| Hero | One line |
|---|---|
| Elena Rodriguez | the flagship member — active everywhere; the "tell me about Elena" demo |
| Anna Brown ⚠ | the "why did she churn?" walkthrough — her employer folded the program that paid her dues |
| Bob Kowalski | 15-year member in slow decline since his employer's 2023 acquisition — the save-him play |
| Danielle Okafor ⚠ | lapsed when her creamery closed — never chose to leave; the win-back |
| Marcus Chen ⚠ | solid member, renewal due in three weeks, opened both reminders, clicked neither |
| Kate O'Leary | exists twice (personal + work email) — the dedup demo with a satisfying merge |
| Aisha Bell | changed employers 8 months ago, never updated her profile — the enrichment demo |
| Sofia Marchetti & Priya Natarajan | the certification pipeline and the rising star |
| Gwen Whitfield | Food Safety Committee chair — governance with minutes, motions, votes |
| Tom Reyes | 30+ advocacy actions, near-zero events — same "engaged," completely different shape |
| Jamie Fuller | top-five forum poster who spends almost nothing — engagement ≠ revenue |
| Victor Sandoval | zero engagement, auto-renewing corporate contact — zero risk; the churn model must not flag him |
| Nia Thompson | joined two weeks ago — the cold start and the first-year cliff |
| Henri Dubois, Lars Vestergaard, Charlie Mason | the international minority: one big annual trip, on-demand webinars from 9 time zones out, wheels shipped 9,000 miles |
| Lucia Marchetti | highest lifetime value — corporate dues, sponsor tables, 3 medals, the biggest recurring donation |
| Dale Peterson | beloved January workshop with terrible economics — the event-ROI conversation |
| Gary Toth | suspended after a refund dispute became a chargeback — the edge cases work |
| Maya Delgado & Denise Archer *(staff)* | the support queue and the renewal machine, respectively |

> ⚠ **GAP-12 note:** the three marked heroes have renewal/lapse timing pinned *relative to
> release day* — which only works under D6's proposed anniversary cohort (pending sign-off).
> If ratified, Marcus sits in that cohort with auto-renew OFF (his story needs reminder
> emails), and Danielle's/Anna's lapse dates stay release-relative legitimately. See
> [DESIGN-REVIEW.md](DESIGN-REVIEW.md) §1 D6.

Heroes know each other (mentorships, a running forum debate, one corporate acquisition
connecting two trajectories) so drill-downs feel alive. Full roster:
[hero-personas-draft.md](hero-personas-draft.md) · reviewer's guide:
[PERSONAS-REVIEW.md](PERSONAS-REVIEW.md).

## 8. Scale presets

| | Small | **Medium (default)** | Large |
|---|---|---|---|
| Members | ~500 | **~2,500** | ~15,000 |
| Purpose | pilot / fast install | the standard demo | the "10k+ credibility" build |
| Revenue | scaled | ~$1.7M | **~$4M** — *not* 6× medium |
| Flagship | scaled | ~35% of members | **~2,000 total registrants** (~1,400 members ≈ 9%) — real same-size associations, not linear scaling |
| Event portfolio | one flagship + locals | ~15 events/yr | multi-conference portfolio (regionals absorb participation) |
| Governance | scaled | 8 committees / 60 seats | ~12 committees / ~90 seats **(estimate)** |

Participation rates **fall** as associations grow (real-world pattern, fitted on real
associations) — at 15k the per-member activity attenuates rather than multiplying.

## 9. The world by the numbers (default scale)

| Entity | Volume |
|---|---|
| People | ~2,500 (including ~50 deliberate duplicates) |
| Organizations | ~625 (including ~100 stale-employer records) |
| Membership periods | ~7,500 |
| Events | ~15/yr × 5 years, with sessions, tracks, speakers |
| Event registrations | ~5,500/yr |
| Course enrollments | ~1,100/yr |
| Active certifications | ~500 |
| Competition entries | ~1,575/yr from ~210 companies; ~110 products |
| Forum posts | ~10,000/yr |
| Email sends | **~190,000/yr** (the big-data table) |
| Support tickets | ~1,500/yr |
| Committees | 8, ~60 seats, full meeting/motion/vote record |
| Legislative issues | 12, ~150 member actions/yr |
| Curated analytics queries | 108 — each guaranteed a meaningful, non-degenerate answer |

## 10. Deliberate imperfections *(internal note — not for prospect-facing copy)*

The data ships with labeled problems that have known-truth answers:

- **~50 duplicate people** with realistic origins (a second record minted from a work email) —
  powers the dedup demo
- **~100 stale employer records** with the true employer stored as ground truth — powers the
  enrichment demo
- One suspended member with a complete dispute paper trail (registration → no-show →
  refund denied → chargeback → suspension)
- An optional **declining-association scenario** (renewal ~78%, shrinking acquisition),
  calibrated to real craft-food decline curves, for dramatic retention pitches

## 11. Where every number comes from

- **Canonical file:** `research/benchmarks-draft.json` v0.9.2 — every target carries source,
  confidence, and tolerance; estimates are labeled
- **Evidence base:** real IRS 990 filings (verified against the e-filed originals on
  2026-07-07), published association benchmarks (MGI, Higher Logic, ASAE, FEP, Atradius/CRF),
  the real ACS's public rates and attendance, and the team's own ground truth
- **Engagement scores are never invented** — Sonar computes them from the generated behavior
  at release time
- **Full research trail:** [research/README.md](research/README.md) (12 workstreams, R1–R12)
