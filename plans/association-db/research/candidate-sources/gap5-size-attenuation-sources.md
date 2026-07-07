# R12 — Size attenuation for the large (15k) preset · was GAP-5 candidate sources

**Status: ✅ REVIEWED & FITTED (Marcelo, 2026-07-06).** Ruling: *"All sources from actual
associations are within the realm of acceptable. I leave it to you to select the applicable and
accurate ones"* — selection below, relevance-weighted (ACF highest: food-craft domain, right
size band). Fitted results live in `benchmarks-draft.json` v0.9 `scalingLaws.sizeAttenuation`
(canonical): participation α = 0.55 ± 0.10 → large conference ≈ 13% of members (~1,950);
revenue-at-large ≈ $4M (ACF's real 990).
**Standing constraint (Marcelo): DATA POINTS ONLY — none of these orgs' subject matter
(programs, topics, industry content) enters the cheese demo. Numbers in; domains out.**

## The data points (member-conference orgs) — fit verdicts
✅ USED IN FIT: ACS anchor + ACF (highest weight) + SNA + AND. ❌ REMOVED: AIHA & ASA
(inflation confounds — retained only as upper-bound brackets), IFT & SCA (trade expos —
different mechanism, see below).

| Verdict | Org | Members (src) | Flagship conf. attendance (src) | Attend/members | Fit quality |
|---|---|---|---|---|---|
| ✅ ANCHOR | *(anchor)* American Cheese Society | ~2,300 | ~1,000–1,300 | **~35%** | anchor (already canonical) |
| ✅ **USED — highest weight** | American Culinary Federation | 14,000+ ([acfchefs.org](https://www.acfchefs.org/ACF/Partnerships/Partners/ACF/Partnerships/Industry-Partners/Opportunities/)) | >1,200 (2017, [cafemeetingplace](https://cafemeetingplace.com/gmc-breaking-news/item/2017-american-culinary-federation-announces-award-winners-at-national-convention)); "~2,000" 2026 (Instagram — weak, verify) | **~9–14%** | best structural analog (food-craft, right size band); revenue $3.81M FY2024 ([990](https://projects.propublica.org/nonprofits/organizations/131605933)) |
| ✅ USED | School Nutrition Association | ~50,000 ([schoolnutrition.org](https://schoolnutrition.org/about-us/)) | 6,000–6,500 ([ANC official](https://anc.schoolnutrition.org/about/)) | **~12–13%** | clean far point (incl. some exhibitors) |
| ✅ USED | Academy of Nutrition & Dietetics | ~112,000 (official boilerplate) | 10,000+ registered ([FNCE](https://www.eatrightpro.org/events/fnce/expo)) | **~9%** | clean far point |
| ❌ **REMOVED from fit** (upper-bound bracket only) | AIHA | ~8,500 ([press boilerplate](https://www.aiha.org/press/aiha-announces-sponsors-for-aihce-exp-2023-conference)) | ~4,000 ([est.](https://vendelux.com/insights/aiha-connect-2026-attendee-list)) | ~47% ⚠ | inflated — attendance includes non-member pros/exhibitors |
| ❌ **REMOVED from fit** (upper-bound bracket only) | American Statistical Association | ~19,000 ([ref](https://serc.carleton.edu/issues/profiles/77272.html)) | ~5,000–6,000 JSM ([amstat](https://www.amstat.org/meetings), [Wikipedia](https://en.wikipedia.org/wiki/Joint_Statistical_Meetings)) | ~26–32% ⚠ | inflated — JSM is a JOINT meeting of several societies |

## Excluded from the member-participation fit (different mechanism: trade expos)

| Org | Members | Expo attendance | Why excluded |
|---|---|---|---|
| Institute of Food Technologists | ~11–12,000 ([IFT press](https://www.ift.org/about-us/press/press-releases/ift-and-peakbridge-to-partner-on-startup-pavilion); Wikipedia's 17k is stale) | 15,500–17,000 (IFT FIRST) | attendance ≈ **130–150% of members** — expo population (exhibitors + non-members) decouples from membership; revenue $27.3M ([990](https://projects.propublica.org/nonprofits/organizations/362136957)) |
| Specialty Coffee Association | no verified member count (claimed ~10k+ — weak) | 12,000 (2023) → 17,000+ (2025) ([SCA press](https://sca.coffee/press)) | same expo inversion; revenue $21.4M FY2024 |

## Shape observed (fit hint — NOT adopted numbers)

Among clean member-conference points, attendance-%-of-members falls with size. Power-law
`attendance ≈ k·members^α` pairwise vs the ACS anchor gives **α ≈ 0.4–0.7** (ACF ≈ 0.4;
SNA/AND ≈ 0.65–0.67; AIHA/ASA sit above but carry known inflation). Implication either way:
a 15k-member preset's flagship conference lands around **1,500–2,600 attendees** (≈10–17% of
members), NOT 5,250 (35% linear). Trade-expo behavior is a different mechanism and should not
be modeled as member participation.

## Gaps in this pass
Committee counts and staff FTE not reliably findable from ProPublica summaries — needs full
990 XML pulls (ACF/SNA/ASA/AIHA) if we want size curves for committees/staff too. Optional.

## 2026-07-06 REVISION — conference sizing switched from α-scaling to REAL turnouts (Marcelo)

Marcelo's ruling: *"don't use scaling for conferences — use real data on conference size /
reported turnouts for organizations of similar sizes."* New real data points gathered
(main-level search, 2026-07-06):

| Verdict | Org | Members | Flagship turnout | Source |
|---|---|---|---|---|
| ✅ USED | American Translators Assn | ~8,500 ([atanet.org](https://www.atanet.org/ata-events/annual-conference/)) | ~1,100–1,300 ([ATA63](https://ata63.org/), [Slator 2023](https://slator.com/american-translators-association-annual-conference-2023-spotlights-tech-education/)) | ~13–15% |
| ✅ USED (highest weight) | American Culinary Federation | 14,000+ | ~1,200–2,000 (as above) | ~9–14% |
| 🟡 STRUCTURE ONLY | NSTA | ~35–40,000 ([Wikipedia](https://en.wikipedia.org/wiki/National_Science_Teaching_Association), [nsta.org](https://www.nsta.org/membership)) | ~30k/yr ACROSS all events; runs **2 national conferences/yr** + areas ([nsta.org](https://www.nsta.org/conferences-and-events)) | validates the multi-conference portfolio at scale, not a single-flagship % |
| ❌ NEAR-ZERO weight | American Choral Directors Assn | ~22,000 ([acda.org](https://acda.org/)) | "~10,000" ([10times](https://10times.com/acda-national-conference-dallas) — low-quality aggregator; heavily inflated by honor-choir performers + families) | unusable as member % |

**Adopted (replaces the α-derived conference number):** at 15,000 members the flagship runs
**~2,000 ± 500 total registrants** (member attendees ~1,400 ± 400, ≈9% ± 3; non-member share
~30% holds). α is retained ONLY for non-conference participation rates (posts, downloads,
non-flagship event regs). NSTA's 2-conferences-a-year pattern backs the regional/multi-event
portfolio at large.

## What was adopted earlier (α fit — now scoped to non-conference rates)
- participation α = **0.55 ± 0.10** (ACF pulls ~0.35–0.4; SNA/AND ~0.65–0.67; ACF weighted up
  for domain relevance) — applies to conference %, event regs/member, posts/member, download
  participation
- large (15k) flagship: **0.13 ± 0.03** member attendance (~1,950 ± 450) + ~32% non-member
  registrants; regional-event portfolio absorbs participation (regs/member ~1.6–1.8 at large)
- revenue at large: **$4M ± 1.5M** (ACF's real $3.81M FY2024 990 — revenue/member falls with size)
- governance at large: committees ~12 / seats ~90 / volunteer share ~1.5% (ESTIMATE, α≈0.2;
  hardening = DEMO-BACKLOG BL-4)
