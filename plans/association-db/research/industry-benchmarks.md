# Association Industry Benchmarks — Research for Synthetic Data Generator (Workstream R1)

**Scope**: Real, citable benchmark numbers for parameterizing a synthetic-data generator simulating a fake trade association (cheese industry, ~2,500 members default scale). Covers membership retention/renewal, dues, events, email, certification, giving, engagement, and growth/lapse dynamics.

**Primary source note**: The single richest source is the **MGI (Marketing General Inc.) 2024 Membership Marketing Benchmarking Report** (16th edition, n=695 associations; full PDF retrieved from aro.org and text-extracted — numbers below quoted directly from the report). MGI 2025 highlights were also captured from Tony Rossell's Membership Marketing blog. Email numbers come from Higher Logic's Association Email Benchmark Reports (2024 and 2025–2026 editions).

> ⚠️ **Citations are LLM-researched (web search + PDF extraction, July 2026). Spot-check before treating any individual number as verified.** In particular, per-column (IMO/Trade/Combination) splits from the MGI PDF tables were extracted from a text-mangled PDF layer — the Total column is reliable; the per-type splits in the non-renewal-reasons table may have row misalignment (flagged inline).

Org-type vocabulary used throughout (MGI's taxonomy):
- **Trade** = companies are the members (closest match for a cheese industry trade association)
- **IMO** = individual membership organization (professionals join personally)
- **Combination** = both corporate and individual member classes (most realistic model for the generator if the fake association has both member companies and individual professional members)

---

## 1. Membership renewal / retention rate

| Metric | Value/Range | Source | Year | Confidence |
|---|---|---|---|---|
| Median overall renewal rate — all associations | **85%** (mean 83%) | MGI Benchmarking Report (n=513) | 2024 | High |
| Median renewal — **Trade associations** | **90%** (mean 89%) — highest of all types | MGI | 2024 | High |
| Median renewal — IMOs | **82%** (mean 79%) | MGI | 2024 | High |
| Median renewal — Combination | **82%** (mean 81%) | MGI | 2024 | High |
| Share of associations with renewal ≥80% | 73% overall; **92% of trade**, 60% of IMOs, 67% of combination | MGI | 2024 | High |
| Median renewal-rate *decline* among decliners | 5% (63% of decliners lost ≤5 pts; none lost >50%) | MGI | 2024 | High |
| Median renewal-rate *increase* among improvers | ≤5 pts for 66% of improvers | MGI | 2024 | High |
| ASAE-cited "average retention goal" | ~75% | ASAE (via First Northern Bank brief) | undated | Low |

**By membership type (individual/corporate/student)**: MGI reports by *organization* type, not member-class within one org. No published corporate-vs-individual renewal split within combination associations was found. ESTIMATE for generator: corporate members renew ~5–8 pts higher than individual members in the same org (corporate dues are employer-paid and budget-line sticky; consistent with trade 90% vs IMO 82%). Student members renew far lower — MGI lists "student memberships do not convert to full memberships" as a distinct churn reason (13% of associations cite it top-3); student→full conversion plausibly 30–50% (ESTIMATE).

## 2. First-year vs tenured renewal (the tenure→renewal curve)

| Metric | Value/Range | Source | Year | Confidence |
|---|---|---|---|---|
| Median **first-year member** renewal — all | **75%** (mean 72%); down from 78% reported 2022 | MGI (n=333) | 2024 | High |
| First-year renewal — **Trade** | **85%** median (mean 82%); 65% of trades report ≥80% | MGI | 2024 | High |
| First-year renewal — IMO | **64%** median (mean 63%); 39% of IMOs report <60% | MGI | 2024 | High |
| First-year renewal — Combination | **74%** median (mean 70%) | MGI | 2024 | High |
| First-year gap vs overall | first-year renews ~**9–10 pts below** overall median (75 vs 85); IMO gap 18 pts (64 vs 82); trade gap 5 pts (85 vs 90) | MGI (derived) | 2024 | High |
| Older/secondary citations of first-year rate | 63% "industry average" first-year (Fonteva, citing older MGI); first-year IMO 63% / trade 85% (re:members/Billhighway) | Fonteva; re:members | ~2023 | Med |
| Implied tenured (2+ yr) renewal | If overall = 85% and yr-1 cohort (~15% of base) renews at 75%, tenured members renew at ~**87%**; long-tenured plateau ~90–93% | Derived | — | Med (derivation) |

**Published points on the curve**: only two (first-year, overall). No public source found giving year-2, year-3, year-5 renewal separately. ESTIMATE curve (anchored so the mix reproduces MGI medians for a trade-leaning combination org): yr1→2 = 72–75%, yr2→3 = 82%, yr3→4 = 86%, yr4→5 = 89%, yr5+ = 91–93% plateau. This monotone-rising, concave shape is the consensus shape practitioners describe ("the longer they stay, the more likely they stay").

Related MGI cross-tabs (2024): associations with overall renewal ≥80% are significantly more likely to also have first-year renewal ≥80%; smaller IMOs (≤1,000 members) and smaller budgets (<$5M) have significantly *higher* first-year renewal.

## 3. Membership tier mix and dues ranges

| Metric | Value/Range | Source | Year | Confidence |
|---|---|---|---|---|
| Individual professional-association dues | **$100–$600+/yr** (typical); community/hobby $25–$100 | Raklet dues guide | 2025 | Med |
| Trade-association org dues (small/mid orgs) | **$500–$5,000+/yr**, tiered by company size/revenue/employees | Raklet; re:members pricing-model guide | 2025 | Med |
| Large national trade assoc corporate dues | can reach $50,000+ (e.g., Sempra's disclosed payments to national trades) | Sempra 2022 trade-association disclosure | 2022 | High (for large orgs; not typical of small/mid) |
| Example individual dues (mid-size professional assoc) | Professional $240, grad student $75 | AIR (airweb.org) | 2026 | High (single example) |
| Dues as % of total revenue | Trade: **45.4%** avg; professional: 30% | ASAE research | 2016 | Med (dated) |
| % associations that raised dues in past year | 49% overall; **trade 59%** | MGI 2025 highlights | 2025 | High |
| Dues-increase policy | 27% raise annually (up from 21% three yrs prior); 38% raise "only as needed" | MGI / Rossell | 2025 | High |
| First-year incentives | 22% offer first-year dues discount; 23% offer monthly/quarterly installment | MGI | 2024 | High |
| Corporate-member org size mix (trade assoc) | Median **489 company members** per trade assoc; 51% of trades have 500+ companies | MGI | 2024 | High |

Tier-mix distribution across an association's own membership is not published. ESTIMATE for a 2,500-member combination cheese association: corporate tiers (by company size) small 55% / medium 30% / large 15%; if individual class exists: regular 75% / young-professional-or-student 15% / retired/emeritus 10%.

## 4. Top reasons for non-renewal (MGI 2024, n=542, execs pick up to 3)

Total-column values (reliable). Per-type splits flagged where narrative and table conflicted in extraction.

| Reason | % citing (Total) | Notes | Confidence |
|---|---|---|---|
| **Lack of engagement with the organization** | **47%** (down from 51% in 2023) | Trade = 64% (significantly higher), IMO 37%, Comb 40% | High |
| Lack of value | 32% | Cited more by declining associations | High |
| Forgot to renew | 29% | IMO-skewed (36%) | High |
| Left the field/industry/profession | 27% | IMO/Comb-skewed | High |
| Employer does not pay dues | 24% | IMO/Comb issue (trade 7%) | High |
| Joined only for conference/meeting discount | 24% | — | High |
| Company closed or merged | 20% | Trade narrative says 42% for trades (table row alignment uncertain) | Med (per-type) |
| Too expensive | 20% | Trade narrative says 32% for trades | Med (per-type) |
| Retirement | 20% | — | Med (per-type) |
| Student memberships don't convert | 13% | — | High |
| Personal/professional needs changed | 7% | — | High |
| Disagree with advocacy position | 4% | — | High |
| Unemployment | 4% | — | High |

For a **trade** association generator, weight: engagement-lapse ≫ company closed/merged > too expensive > left industry; "employer doesn't pay" and "forgot" are near-zero for corporate members.

## 5. Event benchmarks

| Metric | Value/Range | Source | Year | Confidence |
|---|---|---|---|---|
| Webinar/virtual live attendance (of registrants) | **30–50%**; cross-industry median 41.6%; Zoom cites 49% avg live | Umbrex; digitalapplied.com; Zoom webinar stats | 2025–2026 | High |
| Virtual event no-show rate | ~35% (Cvent training figure) | Cvent community | ~2021 | Med |
| **Free** in-person event no-show | **up to ~60%** avg (free-to-attend events) | Gleanin CEO (T. Beck, LinkedIn); event-industry consensus 40–60% | 2025 | Med |
| **Paid** in-person event no-show | **3–10%** (90–97% attend) | Nunify in-person benchmarks | 2025–2026 | Med |
| % associations reporting *increased* in-person conference attendance | **62%** (up from 58% in '23, 26% in '22 — the post-COVID rebound curve) | MGI | 2024 | High |
| % event professionals including hybrid/virtual in programs | 68% (Amex GBT via Cvent); 74.5% of planners adopt hybrid (Remo) | Cvent stats roundup; Remo | 2025–2026 | Med |
| Annual conference attendance as % of membership | **NOT FOUND** as a published benchmark. ESTIMATE: **10–25%** of members attend the annual conference for a national trade assoc (single-digit % for very large IMOs; 25–40% for small, tight-knit trades) | — | — | ESTIMATE |
| Registration-to-member ratio (non-member share of registrants) | NOT FOUND. ESTIMATE: 70–85% of annual-conference registrants are members; webinars skew even more member-heavy (~90%) | — | — | ESTIMATE |
| % associations where paid digital ads deemed most effective promote the annual conference | 52% (largest single use) | MGI | 2024 | High |

## 6. Email benchmarks (association segment)

| Metric | Value/Range | Source | Year | Confidence |
|---|---|---|---|---|
| Avg open rate | **35.64%** (2024 sends; down from 38.18% in 2023) | Higher Logic 2024 Assoc. Email Benchmark Report (1,500+ associations, 2B emails) | 2024 | High |
| Avg open rate (next edition) | **33.54%** | Higher Logic 2025–2026 report | 2025 | High |
| Avg click rate | **3.69%** (2024, up from 2.71% in 2023); 2025–26 edition reports **2.68%** (methodology shift between editions — treat 2.5–3.7% as the band) | Higher Logic | 2024–2026 | High (band), Med (point) |
| Deliverability | 99% (Higher Logic platform) vs 83.1% cited ESP industry avg | Higher Logic | 2024–2025 | Med |
| Unsubscribe rate | NOT FOUND in association-specific sources retrieved. ESTIMATE **0.1–0.3%** per send (general nonprofit/association norms) | — | — | ESTIMATE |
| Bounce rate | NOT FOUND association-specific. ESTIMATE **0.5–2%** per send (aged member lists trend to the low end) | — | — | ESTIMATE |
| Causal note | Smaller, targeted send lists consistently outperform broad blasts; automated + personalized campaigns beat one-time untargeted sends | Higher Logic 2025–26 | 2025 | High (directional) |

## 7. Certification / credentialing

| Metric | Value/Range | Source | Year | Confidence |
|---|---|---|---|---|
| First-attempt exam pass rates (professional certs) | HRCI (as of Dec 2025): aPHR 71%, PHR 72%, SPHR 76%, PHRi 84%, GPHR 56%, PHRca 47%. CHC ~79% first-attempt. Beryl Institute CPXP 77.8–79.2% (2021–2023). CHDA avg 48.4% (range 26–61%) | HRCI.org; HCCA; Beryl Institute; AHIMA study (PMC) | 2021–2025 | High |
| Typical band for association credential exams | **~70–80%** pass for mainstream credentials; harder/analytics exams 45–60% | Synthesis of above; Umbrex cites 70–90% for vendor exams | 2025 | Med |
| Certification program completion rate targets | ≥90–95% completion, ≥90% on-time | Umbrex HR analysis guide | 2025 | Low (targets, not observed) |
| Recertification/renewal compliance | NOT FOUND published. Cycle is typically 3 years (CAE, PMP, CHC). ESTIMATE **70–85%** of certificants recertify on time; ~5–10% lapse and later reinstate; rest drop | — | — | ESTIMATE |
| % associations seeing growth in cert acquisition/maintenance | 56% (up from 47% in 2023) | MGI | 2024 | High |

## 8. Member giving / donations (association foundation)

| Metric | Value/Range | Source | Year | Confidence |
|---|---|---|---|---|
| % of members donating to the association's foundation/PAC | **NOT FOUND** as a published benchmark. ESTIMATE **3–8%** of members give in a year (association foundations are a niche ask; MGI 2013 tracked only directional change) | — | — | ESTIMATE |
| Donor retention rate (nonprofit-wide) | **40–45%** year over year | Fundraising Effectiveness Project (FEP) | 2023–2025 | High |
| Gift-size distribution shape | Heavily right-skewed: donors giving $1–$100 = **57% of all donors** (FEP Q1 2025) yet a small % of dollars; small-donor counts declining ~11% YoY; giving "consolidating" — household participation fell 65%→45% over two decades while total dollars grew | FEP/AFP; philanthropy.org | 2025 | High |
| Practical shape for generator | Log-normal: median gift ~$50–$100; mean ~$250–$500; top 5% of donors contribute 60–75% of dollars | Derived from FEP shape | — | Med (derivation) |

## 9. Engagement distribution

| Metric | Value/Range | Source | Year | Confidence |
|---|---|---|---|---|
| Online-community participation | Classic **90-9-1** (90% lurk, 9% contribute occasionally, 1% drive activity) | Nielsen Norman Group | canonical | High (as a rule of thumb) |
| Refinement | Of contributors: ~90% occasional, ~10% "hyper-contributors" (i.e., ~1% of all users) | Khoros community data | ~2023 | Med |
| Higher Logic's counterpoint | Claims 90-9-1 is "officially outdated" — engaged communities beat it (more like 50–60% lurkers in healthy association communities) | Higher Logic blog | 2024 | Med (vendor) |
| % of member activity captured in AMS | <20% of membership engagement data typically captured | Nucleus Analytics exec brief | 2020 | Low |
| "Highly engaged vs at-risk" published split | NOT FOUND as a standardized benchmark. ESTIMATE: **10–15% highly engaged / 25–30% moderately / 35–40% lightly / 20–25% inactive (at-risk)**. Anchor: 47% of execs blame non-renewal on lack of engagement; lapse rate ~15% ≈ the bottom of the inactive tier churning | Synthesis | — | ESTIMATE |

## 10. Growth / lapse dynamics

| Metric | Value/Range | Source | Year | Confidence |
|---|---|---|---|---|
| % associations reporting membership growth (yr) | 45% (2025) / 47% (2024) / 49% (2023); trade 42% grew, 37% flat | MGI | 2023–2025 | High |
| % reporting growth in *new-member acquisition* | 51% (2024, ≈50% in 2023, 43% in 2022) | MGI | 2024 | High |
| New-member acquisition as % of base | NOT PUBLISHED directly. Derived: at 85–90% renewal, steady state requires new members = **10–15% of base**/yr; growing orgs run 15–20% | Derived from MGI renewal medians | — | Med (derivation) |
| Lapsed-member win-back / reinstatement rate | Targeted win-back campaigns recover **5–15%** of lapsed members | i4a churn guide | 2025–2026 | Med |
| Reinstatement channels | 95% of associations use email for reinstatement; **77% say email is the most effective** channel; phone calls second (and favored by high-renewal orgs) | MGI | 2024 | High |
| Grace period | 48% give 2–3 months' benefit access post-expiry; 19% none; trades most generous (56% give 2–3 mo) | MGI | 2024 | High |
| Renewal billing basis | 47% fixed calendar date vs 49% anniversary; trades 58% fixed-date | MGI | 2024 | High |
| Renewal options offered | Hardship accommodations 44%, auto credit-card renewal 38%, installments 33%, bill-me 20%, multi-year 18%, auto-EFT 18%, lifetime 17%, early-renewal discount 17%, renewal gifts 10% | MGI (n=532) | 2024 | High |
| Association size context | Median paid individual members: 4,998 (IMO 7,900; combination 1,231). Median company members: trade 489, combination 436. Median operating budget $2.33M | MGI | 2024 | High |

---

## Causal shapes found (X → Y quantified relationships)

1. **Tenure → renewal**: first-year members renew at median **75% vs 85% overall** (implied ~87–90% for tenured); gap is largest for IMOs (64 vs 82 = 18 pts) and smallest for trades (85 vs 90 = 5 pts). *(MGI 2024 — the headline causal shape.)*
2. **Auto-renewal → retention**: members on auto-renew retain **10–15 percentage points higher** than non-participants (Membership Corporation & Associates). Case study: offering a monthly auto-renew plan lifted renewals **15%** (≈$350K dues) (re:members/Billhighway).
3. **Engagement → renewal**: lack of engagement is the #1 exec-cited churn cause (47%; **64% for trades**) — engagement level should be the strongest single renewal predictor in the generator (MGI 2024).
4. **Event/PD/cert participation → growth & renewal**: associations with increases in in-person conference attendance, professional-development registrations, and certification activity are significantly more likely to report 1-yr and 5-yr membership growth AND overall renewal-rate increases (MGI 2024). (Member-level "attendees renew at X% vs Y%" is tracked by associations internally but no public number found — ESTIMATE a +8–15 pt renewal premium for members who attended ≥1 event in the year.)
5. **Fixed calendar renewal date → higher renewal**: associations with overall AND first-year renewal ≥80% are significantly more likely to renew on a fixed calendar date; anniversary-date billing correlates with sub-80% rates (MGI 2024).
6. **Grace period → renewal**: 2–3-month grace periods correlate with renewal ≥80%; no/1-month grace correlates with <80% (MGI 2024).
7. **First-year rate ↔ overall rate coupling**: orgs with overall renewal ≥80% are significantly more likely to have first-year renewal ≥80% (MGI 2024).
8. **Size → first-year renewal (inverse)**: smaller IMOs (≤1,000 members) and smaller budgets (<$5M) have significantly *higher* first-year renewal (MGI 2024).
9. **Paid vs free events → attendance**: paid in-person no-show 3–10% vs free events up to ~60%; virtual no-show ~35–58% (live attendance 30–50% of registrants). Payment is the single biggest no-show lever.
10. **Value perception → outcomes**: associations rating their value proposition "very compelling" (only 11% in 2025) are significantly more likely to report growth and renewal ≥80%; decliners cluster at renewal <80% AND first-year <60% (MGI 2024/2025).
11. **Email targeting → engagement**: smaller, targeted lists and automated/personalized campaigns outperform broad one-time blasts (Higher Logic 2025–26; directional).
12. **Win-back decay**: recently lapsed members recover at 5–15% with targeted outreach; recovery odds decay with time since lapse (i4a; direction universal, curve unpublished).
13. **Refreshing programs → growth**: associations that refreshed recruitment/renewal/onboarding campaigns in the past year are more likely to report growth and acquisition increases (MGI 2024; directional).

---

## Proposed benchmark targets for the generator (medium scale, ~2,500 members)

> **REVISED 2026-07-02 — decision applied.** The original draft assumed a "combination-style trade association" (87% renewal). It was **DECIDED (the workstream lead, from the morecheese site) that MoreCheese is a professional society** — individuals are members — so rows 1, 2, 2b, 5a, 9b, and 10a below are re-derived on MGI's individual-membership-org (IMO) numbers. `benchmarks-draft.json` (v0.2+) is the canonical target list; if this table and the JSON disagree, **the JSON wins**.
>
> **⚠ FURTHER SUPERSEDED 2026-07-02/05 (R8/R9 + Q&A alignment).** Several rows below were later re-derived on in-domain IRS-990 evidence and team answers — notably renewal **82% → 87%** (row 1), the tenure curve re-anchored at **68% yr-1 / 92% yr-5+**, conference attendance → **35% of members** (+32% non-member registrants), engagement tiers → the team's **50/40/10** with renewal coupling 95/82/67, and acquisition → **~14%** of base. Do NOT lift numbers from this table without checking `benchmarks-draft.json` (v0.8) first.

Assumed model: a **professional society** — ~2,500 individual members (cheesemakers, mongers, distributors, educators) employed across ~625 organizations (see scaling laws in `benchmarks-draft.json`); organizational memberships exist as a minority class (required for competition entry, per the ACS rule) but individuals are the revenue backbone. Targets below are what the generated data should *reproduce when measured*; tolerance = acceptable deviation for validation.

| # | Metric | Target | Tolerance | Rationale |
|---|---|---|---|---|
| 1 | Overall renewal rate | **82%** | ±2 pts | MGI IMO median (DECIDED: professional society) |
| 2 | First-year renewal rate | **64%** | ±3 pts | MGI IMO — the 18-pt first-year cliff is the professional-society signature |
| 2b | Tenure→renewal curve | yr1 64% → yr2 76% → yr3 82% → yr4 86% → yr5+ 88–90% plateau | ±3 pts/point | Re-anchored to the IMO 64/82 pair; monotone concave |
| 2c | Corporate vs individual renewal | corporate +6 pts over individual (e.g., 91% vs 85%) | ±3 pts | Trade-vs-IMO gap scaled down within one org |
| 3a | Individual dues | median **$250** (range $75 student – $450 premium) | ±$100 | Professional assoc $100–600 band |
| 3b | Corporate dues tiers | small $750 / mid $2,500 / large $7,500 (top tier up to $15K) | ×0.5–2 | Trade $500–$5,000+ band, mid-size org |
| 3c | Tier mix | corporate: 55/30/15 small/mid/large; individual: 75 regular /15 young-prof /10 retired | ±10 pts | ESTIMATE |
| 4 | Non-renewal reason mix (assigned to each lapse) | engagement-lapse 35% / left industry or company closed-merged 22% / budget-too-expensive 15% / forgot-admin 12% / joined-for-event-only 8% / value 5% / other 3% | ±5 pts each | MGI table re-weighted for trade flavor |
| 5a | Annual conference attendance | **50% of members** attend | ±8 pts | DECIDED: follow real ACS data — spot-check verified ~1,000–1,300 attendees on ~2,350 members (the earlier ~1,400 figure overstated) |
| 5b | No-show rate | paid events **8%**; free events/webinars **50%** (live attendance 50% of regs) | ±4 / ±10 pts | Spot-check: published paid band 10–30%, <5% only for priced tickets; 8% reflects our high-fee events. Webinar medians confirmed |
| 5c | Event mix (count) | 55% virtual (webinars) / 40% in-person / 5% hybrid; in-person carries ~80% of event revenue | ±10 pts | Post-2020 consensus |
| 5d | Member share of registrants | conference 80% members; webinars 90% | ±10 pts | ESTIMATE |
| 6 | Email | open **34%**, click **3.0%**, unsub **0.2%**, bounce **1.0%** per send | ±3 / ±0.7 / ±0.1 / ±0.5 pts | Higher Logic 2024–2026 band; unsub/bounce ESTIMATE |
| 7 | Certification | first-attempt pass **75%** (retake pass 60%); program completion 85%; 3-yr recert compliance **78%** | ±5 pts each | HRCI/CHC band; recert ESTIMATE |
| 8 | Giving | **5% of members donate**/yr; log-normal gifts median $100, mean ~$350; top 5% of donors = 65% of dollars; donor-to-donor retention 42% | ±2 pts / ±20% / ±10 pts / ±5 pts | FEP shape + ESTIMATE participation |
| 9 | Engagement tiers | high 12% / moderate 28% / light 38% / inactive-at-risk 22% | ±5 pts each | ESTIMATE anchored to 90-9-1 + churn math |
| 9b | Engagement→renewal coupling | renewal by tier: high 97% / moderate 90% / light 83% / inactive 62% (with the row-9 mix 12/28/38/22 this reproduces **82%** overall) | ±3 pts | Makes causal shape #3 measurable; re-derived for IMO |
| 9c | Event-attendee renewal premium | attendees (≥1 event/yr) renew **+10 pts** vs non-attendees | ±4 pts | ESTIMATE from causal shape #4 |
| 9d | Auto-renew | 30% of individual members enrolled; **+12 pt** renewal lift vs comparable non-enrolled | ±10 / ±3 pts | MGI 38% offer; Membership Corp 10–15 pt lift |
| 10a | New-member acquisition | **19% of base**/yr (~475 new members) → net growth ~+1%/yr | ±3 pts | Steady-state math at 82% renewal (18% attrition + 1% growth) |
| 10b | Reinstatement | 10% of lapsed members reinstate within 24 months, front-loaded (7% in first 12 mo); email the dominant recovery channel | ±4 pts | i4a 5–15% band; MGI channels |
| 10c | Grace-period behavior | 2–3-month grace; ~25% of "renewals" land inside the grace window | ±10 pts | MGI 48% offer 2–3 mo; late-renewal share ESTIMATE |

### Key source URLs
- MGI 2024 Membership Marketing Benchmarking Report (full PDF): https://aro.org/wp-content/uploads/2024/08/The_2024_Membership_Marketing_Benchmarking_Report.pdf
- MGI 2025 highlights: http://membershipmarketing.blogspot.com/2025/06/highlights-from-2025-membership.html
- Higher Logic email benchmarks: https://www.higherlogic.com/blog/email-benchmarks-for-associations-a-guide-to-enhancing-your-membership-marketing-outcomes/ and https://www.higherlogic.com/news/higher-logic-releases-2025-2026-association-email-benchmark-report/
- Auto-renew lift: https://membershipcorp.com/auto-renewal-can-improve-association-membership-retention-rates/ ; https://www.remembers.com/blog/is-auto-renewal-membership-a-good-option-for-you/
- Event no-show/attendance: https://www.nunify.com/blogs/event-attendance-rate ; https://umbrex.com/resources/company-analysis/marketing/event-attendance-rate-analysis/ ; https://www.zoom.com/en/blog/webinar-statistics/ ; https://www.digitalapplied.com/blog/webinar-statistics-2026-attendance-conversion-data
- Win-back: https://www.i4a.com/blog/reduce-membership-churn/
- Certification pass rates: https://www.hrci.org/pass-rates ; https://chcquiz.com/blog/chc-pass-rate-article ; https://theberylinstitute.org/faqs-credentialing-center/ ; https://pmc.ncbi.nlm.nih.gov/articles/PMC8649701/
- Giving: FEP via https://afpglobal.org/news/fundraising-effectiveness-project-data-q1-2025-shows-increases-dollars-raised-declining ; https://4agoodcause.com/the-importance-of-donor-retention-how-to-calculate-and-track/
- Engagement 90-9-1: https://www.nngroup.com/articles/participation-inequality/ ; https://www.higherlogic.com/blog/90-9-1-rule-online-community-engagement-data/
- Dues: https://www.raklet.com/blog/managing-membership-dues-best-practices/ ; https://www.asaecenter.org/resources/articles/an_magazine/2016/november-december/data-membership-dues-arent-the-only-revenue-stream
