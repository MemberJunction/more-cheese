# R8: Food & Craft-Sector Association Benchmarks

> **Provenance**: LLM-researched (Claude, web search + IRS Form 990 data via ProPublica Nonprofit Explorer), 2026-07-02.
> **Spot-check note**: Figures marked **[990]** come directly from ProPublica Form 990 summaries and are the most reliable data in this document. Figures marked **[web]** come from org websites / trade press retrieved during research. Figures marked **[recall — verify]** are LLM-recalled or inferred and should be spot-checked before load-bearing use. All dollar figures USD.
>
> **Purpose**: Test whether food/beverage/craft associations behave differently from generic professional societies, to calibrate the synthetic-data generator for a ~2,500-member cheese professional society (benchmarks-draft.json v0.6).
>
> **2026-07-07 VERIFICATION (see benchmarks-draft.json `$v091`)**: the ACS FY2024 row below was checked against the e-filed 990 — revenue, expenses, net assets and the 77.8%/19.5% shares all confirmed (program service revenue = $1,329,798). The ACS dues lattice (§ Dues) re-verified line-by-line on cheesesociety.org. ACS conference "1,000 cheese professionals" (2023) and ~2,300 membership re-confirmed at source.

---

## 1. Per-Organization Profiles

### 1.1 American Cheese Society (ACS) — the direct analog

- **Legal**: 501(c)(6) business league, EIN 04-2900272, Centennial/Englewood CO, tax-exempt since 1993 (founded 1983). **[990]**
- **IRS Form 990 financials (ProPublica)** **[990]**:

| FY | Total revenue | Expenses | Net assets | Program services % | Contributions % |
|---|---|---|---|---|---|
| 2024 | $1,710,264 | $1,438,329 | $1,278,512 | **77.8%** | 19.5% |
| 2023 | $1,565,546 | $1,367,665 | $989,927 | 77.4% | 21.7% |
| 2022 | $1,608,338 | $1,497,504 | $792,046 | 82.2% | 17.6% |
| 2021 | $747,562 | $745,231 | $681,212 | 49.9% | 49.2% |
| 2020 | $564,356 | $1,163,413 | $638,482 | 43.2% | 53.6% |
| 2019 | $1,926,774 | $1,833,051 | $1,210,977 | 76.0% | 18.2% |

  - **Reading the mix**: "Program services" for ACS = conference registration + Judging & Competition entry fees + certification exam fees. The ProPublica "contributions" bucket (Part VIII line 1h) includes the membership-dues-reported-as-contributions line (1b) *plus* sponsorships/grants, so **dues are at most ~20% of revenue and likely less** — ACS is an **events-and-programs-funded** org, not a dues-funded one. COVID years (2020–21) show what happens when the conference disappears: revenue collapses ~65–70% and contributions become the majority — dues + emergency support were roughly $280–370K/yr, a floor consistent with dues being ~$300K/yr of a normal ~$1.7M year (**~18–22%**).
  - Board/officers all $0 compensation (association-management-company model). 2020 loss of ~$600K absorbed by reserves; recovered to record net assets by 2024. **[990]**
- **Dues (2025–26 website)** **[web — cheesesociety.org/membership/membership-levels]**:
  - Individual (professional): **$175**
  - Enthusiast (associate, non-voting): **$150**; Student: **$75**
  - Small Business: $225 (1 seat) / $400 (2) / $600 (3)
  - Corporate: $800 (4) / $1,000 (5) / $1,250 (unlimited) / $3,000 Corporate Sustaining
  - Calendar-year membership (join anytime, expires Dec 31 — i.e., a *calendar-year renewal spike*, relevant for synthetic renewal-date modeling).
- **Membership size**: not published on current site; historically reported "~2,000+ members" in trade press **[recall — verify]**.
- **Conference**: 2023 Des Moines press release: "**1,000 cheese professionals** from the U.S. and beyond" **[web — ACS media room]**. 4-day July event; 2026 Louisville. Judging & Competition runs alongside (~1,600 entries in 2025 **[web — Instagram]**).
- **Certification**: ACS CCP® exam (since 2012) — roughly **1,000 people total had passed** as of ~2023 (**~90/yr average**) **[web — Saputo Foodservice article]**. Second credential (CCSE®, sensory) added 2018. Exam offered once/year at the conference; recertification every 3 years.
- **Foundation/scholarships**: conference scholarships + a separate American Cheese Education Foundation 501(c)(3) **[web]**. ACS-the-c6's own contributions line is dominated by sponsorship, not member donations.

### 1.2 American Culinary Federation (ACF) — certification-rich professional society

- **Legal**: 501(c)(6), EIN 13-1605933, Jacksonville FL, exempt since 1965. **[990]**
- **990 financials** **[990]**:

| FY | Revenue | Expenses | Net assets |
|---|---|---|---|
| 2024 | $3,806,003 | $3,772,676 | **−$505,288** |
| 2023 | $3,785,991 | $4,491,922 | −$538,615 |
| 2022 | $3,514,792 | $3,471,168 | $167,316 |
| 2021 | $3,913,751 | $3,226,610 | $150,194 |
| 2020 | $2,720,415 | $2,632,607 | −$536,948 |
| 2019 | $4,465,146 | $4,771,476 | −$624,756 |

  - FY2024 revenue mix: program services 48.7%, **contributions 35.6%** (this bucket includes the membership-dues line for a c6 — i.e., **dues ≈ one-third of revenue**), other 13.7%. **[990]**
  - **Warning sign**: net assets negative for most of 2019–2024 — a 15,000-member, certification-rich food society running at breakeven-to-deficit. Food-sector societies are not financially cushy.
- **Membership**: "more than **15,000 members** in 150+ chapters" **[web — ACF chapter sites, 2024–25]** (one prep site claims 17,000+ **[web, low confidence]**).
- **Dues**: national + chapter combined (Minneapolis chapter example): Culinarian **$113**, Student $87, Junior $71 **[web]**; student associate national fee $50 **[web — acfchefs.org]**. Professional-with-chapter all-in lands roughly **$100–230** depending on chapter.
- **Certification**: 13 levels (CC → CMC). ACF reported **10,000 people certified over 25 years** (2006) → **~400 new certs/yr** against ~15,000 members ≈ **~2.5–3% of members/yr earning a new credential** **[web — ALA-APA 2006]**.
- **Foundation**: ACF Education Foundation 501(c)(3), EIN 38-2172192. FY2024 revenue $1.47M — **82% program services (accreditation fees), only 3.6% contributions** **[990]**. Even the "foundation" is fee-funded, not donation-funded. Exec Director comp $171,634 (2024). Net assets $3.2M and growing.

### 1.3 IACP — the cautionary retention data point

- **Legal**: 501(c)(6), EIN 52-1170829, now Alpharetta GA. Founded 1978 (Julia Child era). **[990]**
- **990 trajectory — an 87% revenue collapse** **[990]**:

| FY | Revenue | Net assets |
|---|---|---|
| ~2012 (peak) | ~$1.5M | — |
| 2018 | $928,194 | −$127,024 |
| 2019 | $635,860 | −$91,769 |
| 2020 | $94,768 | −$185,569 |
| 2022 | $454,692 | −$92,245 |
| 2023 | $179,661 | −$64,233 |
| 2025 | $202,847 | −$64,486 |

  - Negative net assets since at least 2014; 2025 revenue is 87.7% program services (mostly awards program fees), contributions 3%. **[990]**
  - Claimed "more than 3,000 active members" as late as 2021 **[web — Alabama NewsCenter]**; peak era ~3,000–4,000 members with a major annual conference **[recall — verify]**. Today effectively an awards administrator with governance turmoil (2024–25 director exits reported) **[web — Caper Media]**.
- **Lesson for the generator**: professional food-media societies *can* enter a decade-long death spiral (~15–20%/yr net member/revenue shrink) when their value proposition (conference + networking) erodes. A "declining org" scenario is realistic, not hypothetical.

### 1.4 Institute of Food Technologists (IFT) — large science-professional

- **Legal**: 501(c)(3), EIN 36-2136957, Chicago. **[990]**
- **990**: FY2024 revenue **$27.3M**, expenses $28.5M, net assets **$43.9M**. Revenue mix: **program services 90.5%**, investment 4.1%, royalties 3.5%, **contributions 2.3%**. CEO comp $920K. FY2021 (no in-person event) revenue fell to $9.6M — again showing event-dependence. **[990]**
- **Membership**: ~11,000–12,000 currently (down from ~17,000+ in the 2010s) **[recall — verify]**. Note: for a c3, dues sit inside program service revenue; IFT's dues share of revenue is small (roughly 10–15% **[recall — verify]**) — the annual event + journals dominate.
- **Conference**: IFT FIRST 2024 — "**more than 17,000 participants**, 1,000+ exhibitors" **[web — exhibitor recap]**; 2025 expected "15,500+ attendees" **[web — iftevent.org]**. Attendance ≫ membership because it's an industry expo — member-attendance ratios are meaningless for expo-model orgs.
- **Dues**: Premier individual membership ~$199/yr **[recall — verify]**; non-member IFT FIRST registration $1,145 **[web]** (the classic "membership pays for itself at the conference" pricing wedge).

### 1.5 American Homebrewers Association (AHA) — the pure-enthusiast benchmark

- **Membership trajectory (best food-sector churn series available)**:
  - 2019: ~46,000 **[web — secondary/Facebook citation of AHA figures; verify]**
  - 2021: 38,000 **[web — Brewbound, citing AHA]**
  - 2023: "over 30,000" **[web — AHA site via Brewbound]**
  - Jan 2025: **23,000** **[web — Brewbound / AHA press release]**
  - ⇒ **net decline ~13–16%/yr sustained over 4+ years** in a hobbyist org whose hobby is ebbing. Implied gross renewal for a $49 enthusiast membership plausibly **60–70%** (net = renewal − ~stalled acquisition).
- **Dues**: **$49/yr** print, $4.99/mo digital (monthly option sunset Feb 2026) **[web — Brewbound + AHA join page]**.
- **Revenue**: AHA membership revenue **$975,231 in 2024**, −15.4% YoY **[web — Brewbound from BA annual report]** ($975K / $49 ≈ 20K paying units — sanity-checks the 23K claim).
- **Conference**: Homebrew Con ~**1,300 registrants** (2022 and 2023) vs 30–38K members ⇒ **~4% attendance**; event put on hiatus 2024, folded into GABF, org spun out of Brewers Association as independent 501(c) in 2025. National Homebrew Competition: ~4,000 entries (2024). **[web — AHA midyear update, Brewbound]**
- **Lesson**: enthusiast members are cheap, numerous, low-attendance, and high-churn. Do not model an enthusiast tier with professional-tier behavior.

### 1.6 Brewers Association (BA) + Craft Brewers Conference — craft trade analog

- **2024 annual report** **[web — Brewbound]**: total revenue **$20.97M** (−8.5%). Mix: events **$12.33M (59%)**, professional membership dues **$3.04M (14.5%)**, advertising/sponsorship $2.92M (13.9%), AHA membership $975K (4.6%), books/merch $502K (2.4%), other $1.21M. Operating loss −$2.17M; reserve $24.2M.
- **Members**: "more than 5,600" brewery members (2025). **CBC attendance ~10,000 expected** (2025) — i.e., ~1.8 attendees per member company; trade-org conference attendance is per-company, not per-person. **[web — Brewbound]**
- **Lesson**: even healthy craft-sector trade orgs are **~15% dues / ~60% events** by revenue, and events revenue is volatile.

### 1.7 Specialty Food Association (SFA) — trade

- **Members**: "4,000+ member companies" **[web — SFA Instagram bio, 2025]**; founded 1952.
- **Summer Fancy Food Show 2025**: ~**13,000 registrants** (+14% YoY), ~8,100 buyers (+9%) **[web — SFA post-show release]**. Trade-show attendance ≫ membership (expo model). 850+ media at 2024 show.
- Dues are per-company (tiered by revenue, roughly $400–1,500 **[recall — verify]**).

### 1.8 American Dairy Science Association (ADSA) — science-professional, dairy-adjacent

- **Dues** **[web — adsa.org join page]**: Professional **$125**, Post-doc (reduced), Grad student **$15**, Undergrad **$10** — science societies subsidize students heavily.
- **Membership**: ~4,500 **[recall — verify]**.
- **Annual meeting**: 2024 West Palm Beach — 707 posters + 431 oral presentations + 34 symposia **[web — AgProud]**; total attendance typically ~1,800 **[recall — verify]** ⇒ **~40% of members** (inflated by presenters being quasi-obligated + non-member attendees).
- Member registration ~$100+ cheaper than non-member ($250 vs $300 one-day, 2026) **[web]**.

### 1.9 Court of Master Sommeliers / WSET — certification-centric analogs

- **WSET**: record **108,529 exam candidates** in FY2018/19; ~121,600 in 2020/21 (+12% on 2019/20); US market 17,416 candidates in 2019 **[web — wsetglobal.com]**. Pure credential business — no "membership" denominator; demand scales with career value of the credential, not with an org's member base.
- **CMS-Americas**: ~170–180 Master Sommeliers ever inducted; thousands sit Intro/Certified exams annually **[recall — verify]**.
- **Lesson**: certification volume is driven by the *industry workforce*, not the member roster — a cheese society's CCP-style exam draws non-members too.

### 1.10 Slow Food USA — enthusiast chapters

- "**Over 70** Slow Food USA chapters" (2025 site) vs "**over 100** chapters" (2022 annual report) **[web — slowfoodusa.org]** — ~30% chapter contraction in 3 years. Another data point that food-enthusiast affiliation is shrinking post-COVID.

### 1.11 Guild-type micro-orgs (Oldways Cheese Coalition, cheesemonger guilds, American Butter Institute)

- Oldways Cheese Coalition: a program of Oldways (c3), not independently financialized **[web]**. Regional cheesemonger guilds (SF, NYC, etc.): volunteer-run, dues ~$25–75, tens-to-hundreds of members **[recall — verify]**. American Butter Institute: processor trade group managed alongside NMPF, ~a dozen corporate members **[recall — verify]**. These are too small/irregular to benchmark against; model them only as "affiliate org" texture.

### Cross-cutting: MGI 2024 Membership Marketing Benchmarking Report (all-sector baseline)

- Median renewal rate **85%** (steady); associations with *declining* membership are significantly more likely to have overall renewal **<80%** and first-year renewal **<60%**; only 21% of ~700 surveyed orgs reported declines. **[web — MGI 2024 report/blog]**

---

## 2. VERDICTS vs Current Targets

| # | Current target (v0.5) | Food-sector evidence | Verdict |
|---|---|---|---|
| 1 | Renewal **89%**, first-year **78%** | MGI all-sector median 85%; declining orgs <80% overall / <60% first-year. Food sector skews *worse*, not better: IACP −87% revenue over 13 yrs; AHA net −13–16%/yr for 4 yrs (enthusiast); ACF at breakeven/negative net assets; Slow Food USA −30% chapters. No food org publishes a renewal rate, but nothing supports above-median retention. | **ADJUST**: professional-tier renewal **86–88%**, first-year **65–70%**. Enthusiast-tier renewal **60–70%**. 89/78 is too rosy for this sector. |
| 2 | Individual dues **$175 ±75** | ACS Individual is *literally* **$175** [web]; Enthusiast $150, Student $75; ADSA $125; ACF ~$113–230 all-in; AHA $49 (pure hobbyist); business tiers $225–$3,000. | **CONFIRMS** ($175 center is exactly on-model; keep ±75 spread, put Student ~$75 and Enthusiast ~$100–150 at the low end, and add business/corporate tiers $225–$1,250 if entities exist). |
| 3 | Dues = **30%** of revenue | ACS 990: program services **77–82%**, contributions (incl. dues line) **18–22%** in normal years [990]; ACF dues-bucket 35.6% [990]; IFT contributions 2.3% / programs 90.5% [990]; Brewers Assn dues 14.5%+4.6% [web]. Food societies are **event/competition/certification-funded**. | **ADJUST-TO ~20–25%** dues share for a cheese-sector society; conference + competition + certification (program service revenue) should be **55–70%**, sponsorship ~10–15%. (ACF shows 30–35% is possible for a chapter-based individual society, so 30% isn't absurd — but the direct analog, ACS, sits at ~20%.) |
| 4 | Conference attendance = **35%** of members | ACS: ~1,000 attendees vs ~2,000–2,500 members ⇒ **~40–50%** (some attendees non-members) [web]; ADSA ~40% [web/recall]; ACF convention plausibly ~10% of 15K [recall]; AHA (enthusiast) **~4%**; IFT/SFA expo-model ratios not comparable. | **CONFIRMS** for the professional core (35% is right-to-slightly-conservative for a small, conference-centric society like ACS). Model enthusiast-tier attendance at **~5–10%**. |
| 5 | Engagement mix **50/40/10** engaged/casual/ghost | No food-sector org publishes engagement segmentation. Indirect: ACS conference draws ~40–50% (high engagement); AHA's collapse implies enthusiast ghost-share ≫10%. | **NO-EVIDENCE** (keep 50/40/10 for professionals; for enthusiast tier consider 25/45/30). |
| 6 | Enthusiast tier share of members | ACS explicitly sells an Enthusiast associate tier (non-voting, $150) + Student ($75) [web] — share not published, but associate classes in professional societies are typically small; AHA = 100% hobbyist; Slow Food = 100% enthusiast. | **ADJUST-TO ~8–12%** of members as Enthusiast/Student for a cheese professional society (present but minority; non-voting). |
| 7 | Certification candidates ≈ **8%** of members/yr | ACS CCP: ~1,000 passers over ~11 yrs ≈ 90/yr vs ~2,000 members ⇒ **~4–5%/yr** [web]; ACF: ~400 new certs/yr vs 15,000 members ⇒ **~2.5–3%/yr** [web]; WSET shows candidates also come from *outside* the member base. | **ADJUST-TO ~4–5%** of members/yr sitting the exam (with ~15–25% of candidates being non-members, and a once-a-year exam-at-conference clustering). |
| 8 | Giving: **4%** donor participation | No participation-rate data anywhere in sector. 990s show food-org "contributions" are **sponsor-driven, not member-donation-driven**: ACF Foundation contributions just 3.6% of its revenue [990]; IACP 3%; IFT 2.3%; ACS's 19.5% contributions bucket is dues+sponsorship [990]. | **NO-EVIDENCE** on the 4% rate itself (plausible; keep) — but cap *member-donation revenue* at ~1–3% of total revenue and route large "contributions" through corporate sponsors, not individuals. |

---

## 3. Recommended adjustments for benchmarks-draft.json v0.6

1. **`renewalRate`: 0.89 → 0.87 (professional tiers); add `enthusiastRenewalRate`: 0.65.** Reasoning: MGI all-sector median is 85% and food-sector orgs show below-median health (IACP, ACF finances, AHA churn, Slow Food chapter loss). 87% keeps the org "healthy but food-sector-realistic." AHA's 13–16%/yr net decline is the only hard longitudinal churn series in the sector and it belongs to the hobbyist segment — the enthusiast tier must churn much faster than professionals.
2. **`firstYearRenewalRate`: 0.78 → 0.68.** MGI: most orgs report first-year <80%, declining orgs <60%; 78% would put the cheese society in the top tier of all associations, which nothing in the food sector supports. 68% (±5) is defensible for a niche society with strong conference lock-in.
3. **`dues.individual`: keep $175** (exact match to ACS). Add/confirm tier lattice: Student $75, Enthusiast $125–150, Small Business $225/$400/$600 (1–3 seats), Corporate $800–$1,250, Sustaining $3,000. **Use calendar-year expiry** (Dec 31) rather than anniversary renewal — ACS runs calendar-year, which produces a Q4/Q1 renewal spike in transaction data.
4. **`revenueMix.dues`: 0.30 → 0.22**, with `events+competition+certification` (program service revenue) → **0.60**, `sponsorship/contributions` → **0.13**, `investment/other` → **0.05**. Grounded in ACS's own 990 (77.8% program / 19.5% contributions, FY2024). Optionally add a "COVID-style shock year" scenario: program revenue −80%, contributions share doubles (ACS FY2020 actuals).
5. **`conferenceAttendanceRate`: keep 0.35 for professional members** (ACS evidence ~40–50% of a ~2,000–2,500 member base attends its 1,000-person conference); set **enthusiast-tier attendance 0.05–0.10** (AHA: 4%). Also model ~10–15% of conference attendees as *non-members* paying the higher rate (ACS explicitly sells non-member registration).
6. **`engagementMix`: keep 50/40/10 for professionals; use 25/45/30 for the enthusiast tier** (no direct evidence — labeled assumption; AHA-style decay implies a large ghost segment among hobbyists).
7. **`enthusiastShare` (new): 0.10** (range 0.08–0.12) of individual members on Enthusiast/Student associate tiers, non-voting, lower dues, low event attendance.
8. **`certificationCandidatesPerYear`: 8% → 4.5% of members**, clustered around the annual conference (single exam sitting/yr, like ACS CCP), pass rate ~70–80% [recall — verify], recert every 3 yrs, and **~20% of candidates are non-members**. For a 2,500-member society that's ~110 candidates/yr — right between ACS (~90) and a scaled ACF rate.
9. **`donorParticipation`: keep 0.04**, but constrain individual-donation revenue to **≤2% of total revenue** and add a `sponsorshipRevenue` stream (corporate sponsors ≈ 10–15% of revenue) — food-sector 990s uniformly show contributions are sponsor/fee-driven (ACF Foundation 3.6% contributions, IFT 2.3%, IACP 3.0%).
10. **Add a `decliningOrg` scenario toggle** calibrated to IACP/AHA: net membership −10–15%/yr, events revenue −10%/yr, contributions share rising as programs shrink, net assets going negative. Real food-sector orgs live on both sides of this line; a synthetic generator that can only produce healthy orgs misrepresents the sector.
11. **Financial texture for realism**: ACS-scale (~2,000 members) implies total revenue ~$1.5–1.7M, expenses within ~10% of revenue, net assets ≈ 0.7–0.9× annual revenue, $0 board comp (AMC-managed), and a single dominant revenue event in July. These make good invariants for generated GL/finance records.

### Source index (primary)
- ProPublica Nonprofit Explorer 990s: ACS EIN 04-2900272; ACF EIN 13-1605933; ACF Education Foundation EIN 38-2172192; IACP EIN 52-1170829; IFT EIN 36-2136957.
- cheesesociety.org (membership levels & prices, conference, CCP/CCSE, media room "1,000 cheese professionals" Des Moines release).
- Brewbound: "AHA to Split From Brewers Association" (2025-01-22, membership series 46K→38K→30K→23K, $49 dues, $975K AHA revenue); "Brewers Association Revenue Declined −8.5% in 2024" (2025-03-04, full BA revenue mix, CBC ~10,000).
- homebrewersassociation.org midyear-2024 update (Homebrew Con 1,300 registrants 2022/23; NHC ~4,000 entries).
- acfchefs.org + chapter sites (15,000 members/150 chapters; dues; 13 cert levels); ALA-APA (2006): 10,000 ACF certs over 25 years.
- adsa.org (dues schedule; 2024 meeting program stats); AgProud 2024 ADSA recap.
- specialtyfood.com (SFFS 2025 post-show: ~13,000 registrants, 8,100 buyers); SFA Instagram (4,000+ members).
- wsetglobal.com (candidate records 2018/19–2020/21); slowfoodusa.org (chapter counts 2022 vs 2025).
- Saputo Foodservice: "elite club of 1,000 who have passed the ACS CCP".
- MGI 2024 Membership Marketing Benchmarking Report (median renewal 85%; decliner thresholds <80%/<60%).
