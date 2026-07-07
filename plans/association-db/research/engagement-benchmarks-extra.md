# Engagement Benchmarks — Extra (R7: remaining ENGAGEMENT-side unknowns)

> **Provenance**: LLM-researched via live web search (Firecrawl), 2026-07-02. All figures were pulled from
> public sources cited inline; a few clearly-marked items are from model knowledge and flagged **MEMORY —
> VERIFY**. Spot-check the primary sources before treating any single number as authoritative — press
> releases round aggressively, and "attendees" almost never equals "member attendees."
>
> Scope: synthetic-data generator for a ~2,500-member US professional society (cheese industry, modeled
> loosely on the American Cheese Society). Companion to `industry-benchmarks.md` / `v1-implied-targets.md`.

---

## 1. Annual conference attendance as % of membership

The internal conflict: one answer said **25%**, the ACS analog computes to **~50%**. Data points gathered
(ratio = total registrants ÷ total members — a *naive* ratio, see caveats below):

| Org | Members | Conference attendees | Naive ratio | Source | Year |
|---|---|---|---|---|---|
| American Cheese Society (the direct analog) | 2,400 | 1,200+ | **~50%** | Richmond Magazine conference recap ("Attendees: Over 1,200. American Cheese Society members: 2,400") — richmondmagazine.com/restaurants-in-richmond/food-news/lessons-from-cheese-camp/ | ~2019 |
| American Sociological Association | 9,412 (2025, excl. lifetime); ~10–11k historically | 4,802 (2023); ASA markets "5,000 attendees" | **~45–50%** | asanet.org data dashboard (Current Membership 2025); Wikipedia/ASA (2023 attendance); asanet.org annual-meeting overview | 2023–2025 |
| American Historical Association | 11,000+ | ~3,000 | **~27%** | AHA24 exhibitor prospectus ("The AHA has more than 11,000 members… 3,000 historians attended") | 2024 |
| ASAE (association executives) | ~48,000 individual members | ~5,100 (incl. exhibitors/speakers/partners) | **~10%** | asaecenter.org 2024 news release (Cleveland annual meeting) | 2024 |
| SHRM | ~340,000 | ~26,000 (record) | **~8%** | shrm.org press room, SHRM24 record-attendance releases | 2024 |
| American Homebrewers Association (hobbyist) | ~30–46k over the era | ~2,000–3,000 peak | **≤8%** ("the conference never had more than 8% of the membership in attendance" — community estimate) | reddit.com/r/Homebrewing thread on AHA 501(c) filing; Homebrew Con is members-only, so this ratio is member-pure | ~2015–2024 |
| American Academy of Dermatology | 20,000+ members | 20,000+ attendees | **~100% naive — heavily inflated** (large international non-member + industry contingent) | AAD Facebook/press ("over 20,000 attendees at #AAD2026… AAD has over 20,000 members") | 2026 |
| Brewers Association / Craft Brewers Conference (trade) | 4,000+ brewery members + allied trade (~5,500 total) | ~8,000 | **~150% naive — trade show** (multiple staff per member company, 61 countries, non-member exhibitors) | brewersassociation.org membership page + CBC 2025 recap | 2025 |
| Specialty Food Association / Fancy Food Show (trade) | ~3,000+ member companies | "tens of thousands" | **not comparable — buyer-driven trade show**; most attendees are non-member retail buyers/media | specialtyfood.com Summer Fancy Food Show pages | 2024–2026 |

### Characterizing the distribution

- **Hobbyist/consumer associations and very large professional societies: ~5–10%** of members attend
  (SHRM 8%, AHA homebrewers ≤8%, ASAE ~10%). Size dilutes: travel cost per member is the same but the
  marginal professional necessity is lower.
- **Mid-size academic/professional societies: ~25–50%** (AHA historians 27%, ASA ~45–50%). Where the
  meeting is the discipline's job market / presentation venue, ratios push toward the top.
- **Small craft/industry societies whose conference IS the industry's flagship event (+ competition):
  ~40–60% naive ratio** (ACS ~50%). These are the most "conference-centric" — the annual meeting bundles
  the judging competition, the trade contacts, and the education for a geographically dispersed craft.
- **Trade associations (company members): naive ratios are meaningless** (>100%) because attendance is
  counted in people while membership is counted in companies, and shows draw non-member buyers.

**Critical caveat**: total registrants ≠ member attendees. Registrant mixes typically include
non-member speakers, press, sponsors/exhibitor staff, and non-member industry walk-ups. For a
conference-centric society like ACS, a reasonable decomposition of "1,200 attendees / 2,400 members" is
~800–900 member attendees + ~300–400 non-member registrants, i.e. **member attendance ≈ 33–38% of
membership** even though attendees/members ≈ 50%.

### Recommendation on the 25%-vs-50% conflict

**Both numbers are "right" for different metrics; use ~35% for the metric the generator actually needs.**

- If the generator metric is **"% of members with a conference-registration record in a given year"**:
  target **35% ± 10pp** (i.e., ~875 of 2,500 members). 25% is too low for an ACS-style
  conference-centric craft society (it's the mid-pack professional-society number); 50% is the
  *attendees ÷ members* ratio, which double-counts non-member registrants as if they were members.
- Additionally generate **non-member registrants ≈ 25–35% of total conference registrations** so the
  event totals reconcile to the observed ~50% naive ratio (≈1,200–1,300 total registrants for a
  2,500-member society — matching ACS almost exactly).
- Year-over-year: individual members' attendance should be sticky (a "conference-goer" segment attending
  most years) rather than i.i.d. — the 35% is dominated by repeaters.

---

## 2. Association foundation giving (% of members donating per year)

This was the thinnest target — associations almost never publish donor counts alongside membership.
What the record supports:

| Org / program | Members (parent) | Value found | Implied participation | Source | Year |
|---|---|---|---|---|---|
| American Bar Foundation — Fellows | lawyer population per jurisdiction | Fellows capped at **1% of lawyers** per jurisdiction, by bylaw; invitation-only donor-recognition program | ~1% (structural ceiling for the *major-donor* tier, not total giving) | americanbarfoundation.org/abf-fellows/awards/bylaws/ | current |
| AAFP Foundation | ~127,000 AAFP members | **$6.58M total contributions** (2023); donor count not disclosed in annual report | ≈ $52/member/yr; participation undisclosed | AAFP Foundation 2023 Annual Report (aafp.org PDF) | 2023 |
| NAR — RPAC (PAC, not foundation, but the closest "members giving to an affiliated fund" analog) | ~1.4M REALTORS | RPAC "Hall of Fame" = 2,500 of 1.4M members; state associations commonly report participation goals in the 30–40% range for small "fair-share" ($20+) asks | ~30–40% for tiny suggested-with-dues asks; <0.2% for major-donor tiers | nar.realtor/rpac; realtorparty.realtor election cycle report; participation-% figure **MEMORY — VERIFY** | 2024 |
| University alumni annual giving (best-documented member-like giving analog) | — | average alumni giving participation **~8% and declining** (was ~12–13% a decade prior) | ~8% | CASE / US News alumni-giving datasets — **MEMORY — VERIFY** | ~2018–2023 |
| M+R Benchmarks (nonprofit sector-wide, not member-based) | — | context only: giving concentrated in small donor fractions of email lists | — | mrbenchmarks.com | 2026 |

**Pattern**: voluntary giving to an affiliated foundation, absent a with-dues checkbox, lands in the
low single digits of membership. Participation jumps an order of magnitude (to 25–40%) only when the ask
is a small suggested add-on collected on the dues invoice (the RPAC/fair-share model).

### Proposed generator target

- **3–6% of members make a foundation/scholarship-fund gift in a given year** — **ESTIMATE (thin
  evidence)**; anchor at **4%** (~100 donors/yr for 2,500 members).
- Gift distribution: log-normal-ish; median gift $50–$100, a handful of $1,000+ board/Fellows-tier gifts
  making up 40–60% of dollars (ABF-style "1% elite tier" ≈ 20–25 people).
- If the society is modeled as putting a **donation checkbox on the dues renewal form**, participation
  can plausibly be raised to 15–25% with tiny average gifts — pick one model and stay consistent.
- Donor overlap: foundation donors should be drawn overwhelmingly from high-tenure, high-engagement
  members (conference-goers, volunteers).

---

## 3. Certification renewal / recertification compliance

PMI, HRCI, SHRM, (ISC)², AWS, CompTIA do **not** publish recertification rates. Medical boards do, and
they define the compliant upper bound:

| Credential body | Value | Notes | Source | Year |
|---|---|---|---|---|
| ABIM — Cardiology | **98.5%** of diplomates with a valid certificate met the MOC assessment requirement | conditional on still holding a valid cert (survivorship) | abim.org Cardiology Diplomate Report 2026 (PDF) | 2026 |
| ABIM — Gastroenterology | **99.5%** met assessment requirement | same conditionality | abim.org Gastroenterology Diplomate Report 2026 (PDF) | 2026 |
| ABIM — Interventional Cardiology | **98.0%** met assessment requirement; but only **70.2%** of physicians hold a valid must-be-maintained ICARD certificate | the 70% figure is the attrition signal — ~30% let the cert lapse over a career | abim.org Interventional Cardiology Diplomate Report 2026 (PDF) | 2026 |
| ABIM — lifetime ("grandfathered") certificate holders | **<1%** voluntarily participate in MOC | shows compliance collapses when recertification is optional | J Community Hosp Intern Med Perspect (tandfonline.com/doi/full/10.3402/jchimp.v2i4.19753) | 2012 |
| NCCPA (PA-C) | 189,907 board-certified PAs (end 2024), +6.3% YoY with 12,400 new certs → implied annual attrition low single digits | no single published recert-by-deadline rate | nccpa.net 2024 Statistical Profile | 2024 |

**Pattern**: when the credential is employment-critical (medicine), per-cycle compliance among active
holders is **97–99.5%**, but *career-long* retention is more like 70–90% (people retire, change roles,
let niche certs lapse). When recertification is voluntary, participation collapses (<1%).

### Proposed generator target

For an ACS CCP-style industry certification (3-year cycle, career-helpful but not license-critical):
- **Recertify by deadline: 80% ± 8pp** per cycle — **ESTIMATE** (interpolated: below the 97–99%
  employment-critical medical bound, far above voluntary-MOC collapse; industry certs with fees and CE
  burden typically shed 15–25% per cycle).
- Of the ~20% who miss the deadline, allow ~⅓ to reinstate within a grace period; the rest lapse
  permanently. Lapse probability should rise for members who also dropped membership (correlated churn).

---

## 4. First-year renewal vs overall renewal (MGI 2024)

Direct hits from the **MGI 2024 Membership Marketing Benchmarking Report** (full PDF publicly mirrored at
aro.org/wp-content/uploads/2024/08/The_2024_Membership_Marketing_Benchmarking_Report.pdf):

| Metric | Value | Source | Year |
|---|---|---|---|
| Median overall membership renewal rate | **85%** | MGI 2024 report | 2024 |
| Median **first-year** member renewal rate | **75%** (unchanged from 2023; down from **78%** reported in 2022) | MGI 2024 report (verbatim: "the median membership renewal rate is 85%… the median renewal rate for first-year members is 75% (down from 78% reported in 2022)") | 2024 |
| Relationship to overall renewal | Associations reporting overall renewal **≥80%** are disproportionately the ones reporting first-year renewal **≥80%**; the two move together | MGI 2024 report (PDF extraction — exact table wording should be spot-checked on p. with renewal analysis) | 2024 |
| Size effect | Smaller individual-membership orgs (**≤1,000 members**) have **significantly higher first-year renewal** than larger ones | MGI 2024 report | 2024 |

**Sanity-check verdict on "78% first-year given 89% overall"**: **PASSES, mildly conservative.**
The medians are 75/85 (a 10-pt gap); an org at 89% overall (top quartile) plausibly runs first-year at
~78–83% (the MGI correlation says high-overall orgs skew ≥80% first-year, and small-org effect pushes the
same direction for a 2,500-member society). **78% is defensible; 80% would be equally defensible.**
Keep the ~11-pt first-year gap — do not shrink it below ~7 pts or the cohort math stops matching MGI.

---

## 5. Email unsubscribe and bounce rates (association-specific)

| Source | Open | Click | Unsubscribe | Bounce / deliverability | Population | Year |
|---|---|---|---|---|---|---|
| Higher Logic 2025–26 Association Email Benchmark Report | **33.54%** avg | **2.68%** avg (rising 2022→2025) | published in the gated report (headline release omits it) | Thrive Marketing avg **deliverability 99%** ⇒ implied bounce ≈ **1%** | ~1,500 associations, 2B+ emails (2025) | 2026 |
| Higher Logic 2024 report (prior ed.) | 38.10% automated vs 33.25% one-time | — | covered in report (gated) | "industry-leading 99% deliverability… vs 83.1% average" | associations | 2024 |
| M+R Benchmarks (nonprofit sector) | — | 0.59% (fundraising emails) | **~0.23% per email**; **12% of list lost to unsubscribes per year** | **4% of list lost to bounces per year** (list churn, not per-send) | large US nonprofits | 2026 |
| GetResponse / ActiveCampaign general benchmarks | — | — | <0.2% = "excellent", <0.5% = good | per-send bounce <1% ideal, >2% = list-quality problem | cross-industry | 2024–2025 |

### Proposed generator targets — your estimates validate

- **Unsubscribe: 0.2% per send ± 0.1pp** — ✅ your 0.2% estimate sits exactly on the M+R 0.23% /
  "excellent <0.2%" line. Member lists unsubscribe *less* than nonprofit acquisition lists; 0.15–0.20% is
  the sweet spot. Also model **annual** list attrition: ~8–12%/yr of addresses go dark (unsub + silent
  disengagement) per M+R churn framing.
- **Bounce: 1% per send ± 0.5pp** — ✅ consistent with Higher Logic's 99% deliverability and the
  cross-industry "<1% ideal" line. Members' dues-linked emails are high quality; use 0.5–1.0% soft+hard
  combined, with occasional 2–4% spikes on stale segments (lapsed members).
- Keep open ~34% / click ~2.7% aligned to Higher Logic 2025–26 if the generator emits those too.

---

## 6. Resource-library engagement (downloads / usage per member)

No public source publishes "downloads per member per year" directly. Closest published anchors:

| Source | Metric | Value | Year |
|---|---|---|---|
| Higher Logic 2023 Association Community Benchmark Report (public PDF mirror: cameonetwork.org/wp-content/uploads/2023/12/2023-Association-Community-Benchmark-Report.pdf) | Share of registered community users who are "active" (any engagement in period) | **~15%** | 2023 |
| same | Monthly login rate | **~6%** of users log in monthly | 2023 |
| same | Share of logged-in users who contribute (post/reply/upload) | **~13%** | 2023 |
| same | Size effect | % active and % contributing **decline as community size grows** | 2023 |
| Higher Logic 2025 Association Community Benchmarks (blog: higherlogic.com/blog/association-community-benchmarks-2025/) | Confirms report covers "logins, contributors, replies, discussion volume, **library usage**, digest email performance" — library-specific numbers are in the gated report | — | 2025 |

**Reading**: association-portal engagement is a steep power law — ~15% of members touch the portal at
all in a year, ~5% monthly, ~1–2% create content. Library *consumption* (views/downloads) is broader
than contribution but still concentrated.

### Proposed generator target — **ESTIMATE (thin evidence)**

- **~25% ± 10pp of members download ≥1 resource per year** (library consumption runs a bit wider than
  the 15% "active in community" figure because downloads don't require participation).
- **Mean ~1.5–3 downloads per member per year overall**, distributed power-law: the top decile of
  members accounts for ~50%+ of downloads; median member downloads 0.
- Tie library usage positively to the same latent engagement factor as conference attendance, committee
  service, and email clicks (these should correlate, not be independent draws).
- Flag for spot-check: if higher fidelity is needed, the gated Higher Logic 2024/2025 Community
  Benchmark Reports contain per-community library-usage distributions.

---

## Proposed generator targets — summary

| Metric | Target | Tolerance | Confidence |
|---|---|---|---|
| Members attending annual conference (per year) | **35%** of members | ±10pp | GOOD (triangulated; resolves 25-vs-50 conflict) |
| Non-member share of conference registrants | **25–35%** of registrations | — | MODERATE (reconciles ACS naive ~50% ratio) |
| Members donating to affiliated foundation (per year) | **4%** | 3–6% | **ESTIMATE — thin**; use with-dues-checkbox model (15–25%) only if explicitly modeled |
| Certification recertify-by-deadline (3-yr cycle) | **80%** | ±8pp | **ESTIMATE** (interpolated between medical 97–99% and voluntary <1%) |
| First-year renewal @ 89% overall | **78%** | 75–83% acceptable | GOOD (MGI 2024: medians 75/85; high-overall orgs skew ≥80 first-year) — keep 78% |
| Email unsubscribe per send | **0.2%** | 0.1–0.3% | GOOD — original estimate validated (M+R 0.23%) |
| Email bounce per send | **1%** | 0.5–1.5% | GOOD — original estimate validated (HL 99% deliverability) |
| Members downloading ≥1 library resource / yr | **25%** | ±10pp | **ESTIMATE** (anchored to HL ~15% community-active) |
| Downloads per member per year (mean) | **~2** | 1.5–3, power-law | **ESTIMATE — thin** |

### The 25% vs 50% conference ruling (explicit)

Adopt **~35% member-attendance** with **~30% non-member registrants**, which simultaneously satisfies:
(a) the ACS observation of ~1,200 attendees against 2,400 members (naive 50%), (b) the reality that
registrant counts include non-members, and (c) the cross-society distribution where conference-centric
small craft societies sit at the very top of the 5–50% member-attendance range. The internal "25%"
answer is the generic professional-society prior and is **too low for this org type**; the "50%" answer
is a **units error** (registrants ÷ members ≠ member-attendance rate).
