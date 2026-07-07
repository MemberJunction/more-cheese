# Cheese-Industry Association Domain Facts (Workstream R2)

> **Purpose**: Domain-fact reference to parameterize the synthetic-data generator for the fictional
> **International Cheese Federation (ICF)** demo, modeled primarily on the **American Cheese Society (ACS)**.
>
> **Citation caveat**: Facts below were LLM-researched via live web search (July 2026) from the sources
> listed. Spot-check any number before publishing externally. Numbers are for **demo-scale calibration**,
> not journalism — where sources disagreed slightly, the most recent/official figure was preferred.

---

## 1. American Cheese Society (ACS) — Primary Analog

### Membership
| Fact | Value | Source / Year |
|---|---|---|
| Membership size | **~2,300–2,400 members** ("more than 2,300 members strong" on membership page; "more than 2,400 individuals" on industry-data page) | cheesesociety.org/membership, /resources/industry-data (2025–26) |
| Founded | 1983 (first conference: 150 attendees) | cheesesociety.org/resources/industry-data |

**Membership levels & dues** (cheesesociety.org/membership/membership-levels, 2026):

| Level | Dues | Notes |
|---|---|---|
| Individual (Professional) | $175 | Industry professionals |
| Small Business 1 / 2 / 3 | $225 / $400 / $600 | 1 / 2 / 3 named members |
| Corporate 4 / 5 | $800 / $1,000 | 4 / 5 named members |
| Corporate Plus | $1,250 | Unlimited members |
| Corporate Sustaining | $3,000 | Unlimited members + logo recognition |
| Student (Associate) | $75 | Enrolled in higher ed |
| Enthusiast (Associate) | $150 | Non-industry; no vote / no board eligibility |

Key structural fact: **only ACS organizational members may enter the Judging & Competition** (Cheese Reporter, Jan 2025) — a nice referential constraint for the demo (CompetitionEntry.Organization must have active org-level membership).

### Certified Cheese Professional (CCP) Exam
| Fact | Value | Source / Year |
|---|---|---|
| Format | 150 multiple-choice questions, max 3 hours | cheesesociety.org CCP page (2026) |
| Administration | In-person (day before annual conference), live remote proctoring, or Prometric centers | 2026 |
| Eligibility | Minimum **4,000 hours** of paid/unpaid cheese-industry work experience **within the past 6 years** (education/training hours can count) | saputousafoodservice.com summary of ACS rules (2024) |
| Fee (2026) | **$535 members / $685 non-members** (application + exam combined) | cheesesociety.org/certification/deadlines-and-fees |
| Retake rule | Retakes allowed; after **3 failures**, must document additional coursework | ACS CCP page (2026) |
| Cumulative CCPs | ~**900 by 2017** ("ACS CCPs now total nearly 900"); safe to model **1,200–1,500+ cumulative by mid-2020s** | culturecheesemag.com (2017) |
| Candidates/year | First exam 2012; e.g. **155 passed in 2016** exam sitting. Model **150–250 candidates/year** | cheesesociety.org media room (2016) |
| Pass rate | Not officially published; anecdotal reporting suggests roughly **~70–80%**. Treat as unverified; use ~75% in generator | LLM inference — spot-check |
| Recertification | Every **3 years**; **$75 fee, waived if attended one of the last 3 annual conferences**; continuing-education points from conferences/courses | cheesesociety.org deadlines-and-fees (2026) |
| Largest CCP employer | Whole Foods Market (recurring headline after each exam class) | perishablenews.com (2023) |
| Second credential | **ACS Certified Cheese Sensory Evaluator (CCSE)**, launched 2018; in-person only; same fee schedule as CCP in 2026 | cheesesociety.org/certification (2026) |

### ACS Judging & Competition (J&C)
| Fact | Value | Source / Year |
|---|---|---|
| 2024 | **1,596 entries, 122 categories, 383 medals** | cheesereporter.com (Jan 2025); ACS industry calendar |
| 2025 | **1,588–1,592 entries from 211 companies** (US, Canada, Mexico), **123 categories, 407 medals** | ACS industry calendar; ACS Instagram (2025) |
| Peak years | Pre-COVID peaks over **2,000 entries** ("grown to over 2,000 entries") | ACS industry-data page |
| Origin | **89 entries in 1985** | ACS industry-data page |
| Medal structure | **1st / 2nd / 3rd place per subcategory (ties permitted)**; category winners ("Best of Class" style) feed a **Best of Show** round with Best of Show + runners-up | cheesesociety.org/competition/judging-process |
| Judging model | Judge pairs: one **Technical** judge + one **Aesthetic** judge; scored out of 100 (technical deductions + aesthetic points) | cheesesociety.org judging-process |
| Cadence & timing | Annual; historically judged alongside the summer conference; since 2022 judged separately in **May**, winners announced at the July conference (2026 J&C: May 18–22) | ACS call-for-entries (2026) |
| COVID gap | **Canceled 2020 and 2021** | ACS media room (2020, 2021) |

### Annual Conference
| Fact | Value | Source / Year |
|---|---|---|
| Attendance | **~1,400 industry professionals** in recent years (150 in 1983) | ACS industry-data page (2025–26) |
| Timing | **Late July** (2025: July 23–26 Sacramento; 2026: July 7–10 Louisville) | cheesesociety.org/conference |
| COVID | 2020 Portland conference canceled → virtual 37th; 2021 virtual 38th | ACS media room |
| Includes | Educational sessions, Festival of Cheese, awards ceremony, CCP/CCSE exam day immediately before | ACS conference pages |

---

## 2. Other Competitions (Volume Calibration)

| Competition | Organizer | Cadence | Scale | Source / Year |
|---|---|---|---|---|
| **World Championship Cheese Contest (WCCC)** | Wisconsin Cheese Makers Association (WCMA), Madison WI | **Biennial, even years, March** (2026 = 36th) | **3,375 entries (2026)** from ~25+ countries; ~140+ classes; gold/silver/bronze per class + Top 20 championship round → World Champion | wischeesemakersassn.org, worldchampioncheese.org (2026) |
| **U.S. Championship Cheese Contest** | WCMA | **Biennial, odd years, March** (Green Bay) | **2,414 entries from 31 states (2025), 117 classes**; gold/silver/bronze per class + championship round → U.S. Champion | uschampioncheese.org, cheesereporter.com (2025) |
| **Good Food Awards (Cheese category)** | Good Food Foundation | Annual (entries late summer, winners Jan/spring) | ~2,000 entries across 18 food categories total; cheese subcategories: **Fresh, Semi-Soft, Semi-Hard, Hard, Yogurt**; max 4 entries/company/category; sustainability/sourcing criteria in addition to taste | goodfoodfdn.org (2025–26) |
| **ACS J&C** | ACS | Annual, May (see §1) | ~1,600 entries / ~210 companies / ~123 categories / ~400 medals | see §1 |

Rule of thumb: an entrant company submits **5–8 entries** on average (ACS 2025: 1,588 entries ÷ 211 companies ≈ 7.5).

---

## 3. Industry Structure

| Fact | Value | Source / Year |
|---|---|---|
| US artisan/farmstead/specialty cheesemakers | **~900 (2016 ACS survey)** → **~1,000 (2018 ACS survey)** | ACS State of the Industry surveys via delimarketnews.com (2017), ACS industry-data (2018) |
| Concentration | Wisconsin alone claims ~half of US artisan production; ~350+ specialty/artisan/farmstead producers in WI | Food & Wine via WI dairy sources |
| Size distribution (for Organization table) | Heavy small tail: most artisan creameries are **micro (<5 employees, <50k lbs/yr)**; a middle band of regional creameries (5–50 employees); a few large specialty producers (100+ employees). Suggested generator mix: **60% micro / 25% small / 12% medium / 3% large** | LLM synthesis of ACS survey framing — spot-check |
| COVID-2020 impact | ACS member survey (May 2020, ~1,000 respondents): **58% overall sales decrease**, 71% sought financial relief, 30% laid off/furloughed staff, 48% cut hours, 51% saw e-commerce sales rise | cheesesociety.org media room (2020) |
| Counter-trend | Retail/grocery cheese sales **spiked** in 2020 while foodservice collapsed; direct-to-consumer/e-commerce channels grew | ACS 2020 survey |

**Major cheese regions** (see VALUE LISTS §Regions): US — Wisconsin, Vermont, California, Oregon, New York, Pacific Northwest, Upper Midwest, Northeast, Mountain West, Southeast. International — France, Italy, Switzerland, Spain, England, Netherlands, Quebec/Canada, Mexico.

---

## 4. Certifications & Credentials Landscape

| Credential | Body | Notes |
|---|---|---|
| ACS Certified Cheese Professional (ACS CCP) | ACS | Since 2012; flagship retail/monger/industry credential |
| ACS Certified Cheese Sensory Evaluator (ACS CCSE) | ACS | Since 2018; sensory/judging skills; in-person practical |
| Cheesemaker licensure (WI) | Wisconsin DATCP | Wisconsin uniquely licenses cheesemakers; Master Cheesemaker program |
| Wisconsin Master Cheesemaker | Center for Dairy Research / WCMA / WMMB | 3-year advanced program, per-variety certification, requires 10 yrs licensed experience |
| Academy of Cheese (UK) Levels 1–4 | Academy of Cheese | International tiered program ("Associate" → "Master of Cheese") |
| Certified Cheese Grader | State/industry programs (e.g., WI/USDA grading) | Commodity grading credential |
| PCQI (Preventive Controls Qualified Individual) | FSPCA / FDA FSMA | Food-safety credential every creamery needs post-FSMA |
| HACCP Certification | Various accredited providers | Food-safety plan credential |
| ServSafe | National Restaurant Association | Retail/foodservice food-handling |
| Fromager / Garde et Jury (France, e.g. Concours) | Various French bodies | For international flavor in the demo |

---

## VALUE LISTS (CHECK-constraint ready)

### CheeseStyle (competition taxonomy)
```
'Fresh Unripened', 'Soft-Ripened', 'Washed Rind', 'Semi-Soft', 'Semi-Hard',
'Hard', 'Blue', 'Cheddar', 'Alpine', 'Pasta Filata', 'Hispanic Style',
'Feta', 'American Original', 'Flavored', 'Smoked', 'Cultured Dairy'
```

### MilkSource
```
'Cow', 'Goat', 'Sheep', 'Water Buffalo', 'Mixed Milk'
```
(Optional attribute: RawMilk bit — see 60-day rule.)

### MemberRole (industry roles / disciplines)
```
'Cheesemaker', 'Affineur', 'Cheesemonger', 'Retailer', 'Distributor',
'Importer', 'Dairy Farmer', 'Educator', 'Food Safety', 'Sensory Evaluator',
'Chef', 'Writer', 'Marketing', 'Supplier', 'Student', 'Enthusiast'
```

### MembershipLevel (modeled on ACS)
```
'Individual', 'Small Business', 'Corporate', 'Corporate Plus',
'Corporate Sustaining', 'Student', 'Enthusiast'
```

### CompetitionCategoryFamily (ACS lettered families, condensed)
```
'Fresh Unripened', 'Soft-Ripened Bloomy Rind', 'American Originals',
'International Style', 'Cheddars', 'Blue Mold', 'Hispanic and Portuguese Style',
'Italian Type', 'Feta', 'Low Fat Low Salt', 'Flavored', 'Smoked',
'Farmstead', 'Goat Milk', 'Sheep Milk', 'Marinated', 'Cultured Milk Products',
'Butters', 'Cheese Spreads', 'Washed Rind'
```
(Real ACS 2026 families A–U; U = 'Consumer-Ready Convenience Cheese' if you want 21.)

### MedalLevel
```
'Best of Show', 'Best of Show Runner-Up', 'First Place', 'Second Place', 'Third Place'
```
(WCMA contests instead use: 'Gold', 'Silver', 'Bronze', 'Champion' — pick one scheme; ACS scheme recommended.)

### Certification
```
'Certified Cheese Professional', 'Certified Cheese Sensory Evaluator',
'Master Cheesemaker', 'Licensed Cheesemaker', 'Academy of Cheese Level 1',
'Academy of Cheese Level 2', 'PCQI', 'HACCP', 'ServSafe', 'Certified Cheese Grader'
```

### CertificationStatus
```
'Candidate', 'Active', 'Lapsed', 'Recertified', 'Revoked'
```

### Region (chapters / member geography)
```
'Northeast', 'Mid-Atlantic', 'Southeast', 'Upper Midwest', 'Mountain West',
'Pacific Northwest', 'California', 'Southwest', 'Canada', 'Mexico',
'Western Europe', 'United Kingdom', 'Oceania'
```

### RegulatoryTopic (see §6 for descriptions)
```
'Raw Milk 60-Day Rule', 'FSMA Compliance', 'Standards of Identity',
'Labeling Requirements', 'Common Name Protection', 'Geographical Indications',
'Tariffs and Trade', 'Listeria and Recalls', 'Interstate Raw Milk Sales',
'Organic Certification', 'Animal Welfare Standards', 'Dairy Pricing Policy'
```

---

## VOLUME ANCHORS → Demo-Scale Presets

Real-world anchors: **~2,350 members**, **~1,600 competition entries / ~210 companies / ~123 categories / ~400 medals**, **~1,400 conference attendees**, **~200 cert candidates/yr**, **~1,000 US producers**.

| Table | Real anchor | Small | Medium (≈real) | Large |
|---|---|---|---|---|
| Members (individuals) | ~2,350 | 500 | 2,500 | 15,000 *(aligned 2026-07-05 to the v2-plan/work-breakdown/JSON large preset; was 10,000 — see gaps-to-fill.md GAP-5: large-scale anchors need size attenuation, not linear ×6)* |
| Organizations | ~900–1,000 producers + retail/dist | 200 | 1,000 | 4,000 |
| Competition entries / year | ~1,600 | 300 | 1,600 | 5,000 |
| Entrant companies / year | ~210 | 50 | 220 | 700 |
| Categories (subcategories) | 122–123 in ~20 families | 40 | 120 | 150 |
| Medals / year | 383–407 (~25% of entries) | ~75 | ~400 | ~1,250 |
| Conference registrations / year | ~1,400 (≈60% of members) | 300 | 1,400 | 5,500 |
| Cert exam candidates / year | ~150–250 | 40 | 200 | 800 |
| Cumulative certificants | ~1,200–1,500 | 250 | 1,400 | 5,000 |
| Dues revenue mix | Individual $175 … Corporate Sustaining $3,000 | same price list at all scales | | |

Derived ratios to preserve at every scale: **entries/company ≈ 7.5**, **medal rate ≈ 25% of entries**, **conference attendance ≈ 55–60% of membership**, **~3 medals per subcategory (ties permitted)**.

---

## REGIMES (named time periods for the generator)

| Regime | Date range | What changes |
|---|---|---|
| **Steady Growth** | 2012-01 → 2020-02 | Baseline: membership +3–5%/yr; entries climbing toward 2,000 peak; CCP program launches 2012 (first cohorts large); conference attendance rising |
| **COVID Shock** | 2020-03 → 2021-12 | Conference virtual (2020, 2021); **J&C canceled both years (zero entries/medals)**; member sales −58%; layoffs/furloughs; dues lapses spike (model 15–25% non-renewal); event revenue ≈ 0; e-commerce member segment grows |
| **Recovery / Restructure** | 2022-01 → 2023-12 | J&C returns 2022 but **decoupled from conference (moves to May)**; entries rebound to ~75–85% of pre-COVID; in-person conference resumes; membership slowly recovers |
| **New Normal** | 2024-01 → present | Entries stabilize ~1,590–1,600; 122–123 categories; ~400 medals; conference ~1,400; remote-proctored cert exams now permanent option |
| **Annual cycle (all regimes)** | — | **Jan–Mar**: competition call-for-entries + cert applications open (close Mar 31); **March (even yrs)** WCCC, **(odd yrs)** US Championship; **May**: ACS J&C judging; **early–late July**: cert exam day + annual conference + awards announced; **Sep–Oct**: American Cheese Month (Oct), recertification cycle; **Nov–Dec**: retail holiday spike (cheese retail sales peak Thanksgiving→New Year; model 2–3× monthly retail activity for retailer/monger members) |

---

## 6. Regulatory / Legislative Themes (with 1-line descriptions)

| Topic | Description |
|---|---|
| **Raw Milk 60-Day Rule** | FDA (21 CFR 133) requires cheese made from unpasteurized milk to be aged ≥60 days at ≥35°F; periodic FDA reviews of the rule are existential news for raw-milk cheesemakers |
| **FSMA Compliance** | Food Safety Modernization Act preventive-controls rules (PCHF); every creamery needs a food-safety plan and a PCQI; inspection and testing burdens fall hardest on small producers |
| **Standards of Identity** | Federal definitions of what may be called "cheddar," "parmesan," etc. (21 CFR 133); modernization debates affect labeling of innovative styles |
| **Labeling Requirements** | Nutrition panels, allergen declarations, "made with raw milk" statements, plant-based "cheese" labeling fights |
| **Common Name Protection** | EU efforts to restrict names like parmesan, feta, asiago, gruyere as GIs; US industry (CCFN — Consortium for Common Food Names) fights to keep them generic; the 2022–23 US "gruyere" trademark ruling is a landmark |
| **Geographical Indications** | Protection frameworks (EU PDO/PGI, US certification marks) in trade agreements; determines what importers/exporters may label |
| **Tariffs and Trade** | Retaliatory tariffs on EU cheeses (e.g., 2019 Airbus/Section 301 25% tariffs), export access for US producers, USMCA dairy quotas with Canada |
| **Listeria and Recalls** | Recurrent Listeria monocytogenes outbreaks/recalls in soft and Hispanic-style cheeses drive testing rules and insurance costs |
| **Interstate Raw Milk Sales** | Federal ban on interstate raw fluid-milk sales; state patchwork; recurring bills (e.g., PRIME Act analogs) tracked by the association |
| **Organic Certification** | USDA NOP dairy rules (origin-of-livestock, pasture rule) affecting organic creameries |
| **Animal Welfare Standards** | Retailer- and state-driven welfare requirements flowing back to dairy suppliers |
| **Dairy Pricing Policy** | Federal Milk Marketing Order reform, Class III pricing — determines milk input costs for every producer member |

---

*Prepared 2026-07 for the ICF association-db synthetic-data generator (workstream R2).*
