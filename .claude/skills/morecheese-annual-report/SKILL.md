---
name: morecheese-annual-report
description: Generates the International Cheese Federation (ICF / More Cheese) annual report for ONE fiscal year, filed at content/annual-reports/YYYY/icf-annual-report-fyYYYY.md, with every number computed from generated/. USE THIS SKILL WHENEVER anyone asks to write, draft, produce, generate, backfill, extend, update, refresh, fix or check an ICF annual report, More Cheese annual report, association annual report, year in review, yearly report, FY report, "the 2023 report", "our annual", annual review, member year-end report, year-end summary, association impact report, or the annual report section of morecheese.org — for any single fiscal year 2019 through 2025, and whether they say "annual report", "yearly report", "year in review", "FY2023", "the 2024 annual", or just "the report for last year" in a More Cheese context. Also use it when asked to verify an existing ICF annual report's numbers, sections, or disclaimer. Do not hand-write an ICF annual report without loading this skill.
---

# ICF / More Cheese — annual report generation

You are producing the annual report of the **International Cheese Federation (ICF)**, a
**fictitious** mid-sized international cheese trade association, published under the More Cheese
demonstration environment for MemberJunction.

**One invocation = one fiscal year.** Never batch. Fiscal year == calendar year (every membership
period in the data runs Jan 1 – Dec 31).

Read [`content/VAULT-DESIGN.md`](../../../content/VAULT-DESIGN.md) before you start. It is the
governing document; this skill implements it. §4.3 (cast), §7 (do-not list), §8 (consistency) and
Appendix A (queries) are the parts you will use most.

---

## 1. Establish the year

1. Resolve the caller's request to a single 4-digit fiscal year.
2. It must be in **2019–2025** (the era range in `data/ruleset/eras.json`). Outside that range,
   **stop and report it** — do not invent an era or extrapolate the data.
3. Look up the `eraKey` for that cycle. It becomes the `era` frontmatter value and it sets the
   tone of the whole document (see VAULT-DESIGN §4.2).

| eraKey | Cycles | The report's posture |
|---|---|---|
| `era-pre-pandemic-baseline` | 2019 | Steady, confident, growth-minded. |
| `era-pandemic-shock-2020` | 2020 | Events collapsed (registrations ×0.15), coursework surged (×1.85). Empathetic, improvisational, honest about the hole. |
| `era-virtual-pivot-2021` | 2021 | Virtual symposiums, online credentials (events ×0.45, courses ×1.5). Rebuilding, retention-proud. |
| `era-artisan-boom-2022-2024` | 2022–2024 | In-person flagship back, entries climbing (events ×1.4, courses ×1.25). Busy, optimistic, capacity-strained. |
| `era-creamery-closures-2025` | 2025 | Feed and energy inflation, farmstead distress. Sober, practical, supportive. |

## 2. Compute the facts BEFORE you write (required — do not skip)

Write a scratch fact-sheet first, then draft against it. Do not draft prose and reconcile after.

Run **Appendix A** of `content/VAULT-DESIGN.md` — snippets A.0 (loader) plus A.1, A.2, A.3, A.4,
A.5, A.6, A.7, A.8, A.9 — with `YEAR` set to your fiscal year. Save the output somewhere you can
re-read (a temp file is fine; do not commit it).

Minimum fact-sheet:

| Fact | Query |
|---|---|
| Members with an active period at 31 Dec, and the prior year for comparison | A.1 |
| Tier mix (Individual / SmallBusiness / Corporate / Enthusiast) | A.2 |
| Periods started, Renewed / Lapsed / Cancelled, renewal rate, dues billed | A.2 |
| First-time members | A.3 |
| Events held, total registrations, total attended | A.4 |
| Annual Conference: name, date, city, state, registered, attended | A.4 |
| Gross orders, amount applied, receivable balance, cash captured, revenue by product line | A.5 |
| Course instances, enrolments, completions; certification enrolments and awards | A.6 |
| Competition entries by category and every medal (Gold/Silver/Bronze) with product and organisation | A.7 |
| Advocacy actions total, by kind, by topic | A.8 |
| Committee meetings held; chairs and vice chairs by committee for the term covering the year | A.9 |

**Never write a number you did not compute.** If a query returns something surprising (2023 awards
only 2 credentials), report the surprising truth — do not smooth it.

## 3. Load the world model for continuity (required — do not skip)

| File | What you take from it |
|---|---|
| `data/ruleset/eras.json` | The `eraKey` and the year's shape. |
| `data/ruleset/heroes.json` | The 16 members, their `birthCycle`, their `fixedFields`. |
| `content/VAULT-DESIGN.md` §4.3 | Hero eligibility by year and the arc constraints table. |
| `content/blog/<year>/` | The year's published posts. The report must not contradict them, and it is good practice to echo one or two themes the blog already ran. |
| `generated/committee-memberships` + `generated/committee-terms` | The **actual** chairs. Names here are ordinary generated people, not heroes, and they are the correct names to print. |

**Governance names come from the data, not from narrative.** VAULT-DESIGN §9 decision 1 records a
known contradiction between the blog skill's prose and `generated/committee-memberships`. The data
wins. If you cannot resolve who chaired something, use the committee name without a chair.

## 4. Structure — seven sections, 1,500–2,500 words

Use these seven `##` headings, in this order, with these names:

1. **`## A letter from the federation`** — 250–350 words. Signed `Office of the Chief Executive`
   (role byline; see §6). Names the year's single defining condition in the first two sentences,
   acknowledges what was hard, thanks members concretely (a committee, a cohort, a competition).
   No statistics dump — one or two numbers at most, and they must appear again in §2 of the report.
2. **`## Membership`** — 300–450 words. Year-end members, growth vs. prior year, first-time
   members, tier mix, renewal rate and what lapsed. State the count as a count of members holding
   an active membership period at 31 December. Interpret, do not just list.
3. **`## Programs and education`** — 250–400 words. Events held and attendance, the Annual
   Conference by name/date/city, webinars vs. workshops, course instances, enrolments,
   completions, credential activity. Name real courses and certifications only.
4. **`## Competitions`** — 200–350 words. Entry count, categories, and the Gold winners by product
   and organisation name from the data. Never invent a winner.
5. **`## Advocacy and standards`** — 200–350 words. Advocacy action count and the topics that drew
   the most activity. Describe regulators generically. No legal advice.
6. **`## Financial summary`** — 250–400 words. **Operating revenue only.** Report gross orders,
   revenue by line (memberships, conference, workshops, credentials, publications, competition
   entries, merchandise, donations), cash captured, and the year-end receivable. Include this
   sentence or a close paraphrase: *"These figures are unaudited operating revenue and reflect
   orders and payments recorded in the federation's membership system; they are not a complete
   financial statement."* **Never invent an expense, a surplus, a reserve, a headcount cost, or a
   balance sheet** — that data does not exist. Prices quoted must match `generated/products`
   (VAULT-DESIGN §7.6).
7. **`## Looking ahead`** — 200–300 words. Forward-looking, but only toward things that exist:
   next year's Annual Conference from `generated/events` if it exists, standing courses,
   credential pathways, the advocacy topics already in the data. For 2025, look toward 2026 with
   appropriate caution and do not promise outcomes.

Optionally close with a short **`## About the federation`** boilerplate paragraph (2–3 sentences)
before the disclaimer. It does not count toward the seven.

### Voice

The house voice of a mid-sized association's annual report: plain, specific, a little warm, never
promotional. Plural first person ("we", "the federation"). Short paragraphs. Concrete numbers with
their basis stated. A single wry line about cheese is allowed in the letter and nowhere else.
Never breathless, never "In today's fast-paced landscape", never "delve", never "game-changer".

## 5. Output

One file:

```
content/annual-reports/YYYY/icf-annual-report-fyYYYY.md
```

Frontmatter (YAML, all fields required, in this order):

```yaml
---
title: "International Cheese Federation — FY2023 Annual Report"
date: 2024-03-15
doc_type: annual-report
visibility: public
org: "International Cheese Federation"
era: era-artisan-boom-2022-2024
fiscal_year: 2023
period_start: 2023-01-01
period_end: 2023-12-31
fictional: true
author: "Office of the Chief Executive"
tags:
  - annual-report
  - membership
  - programs
  - advocacy
report_sections:
  - A letter from the federation
  - Membership
  - Programs and education
  - Competitions
  - Advocacy and standards
  - Financial summary
  - Looking ahead
data_sources:
  - generated/membership-periods
  - generated/orders
  - generated/order-lines
  - generated/payments
  - generated/events
  - generated/event-registrations
  - generated/enrollments
  - generated/member-certifications
  - generated/competition-entries
  - generated/advocacy-actions
  - generated/committee-meetings
---
```

- `date` — the **publication** date, conventionally mid-March of the following year
  (`FY+1-03-15`). It is not the fiscal year end. The filename carries the fiscal year, not this
  date, so there is no filename/date match rule here — but `fiscal_year`, `period_start`,
  `period_end` and the filename must all agree.
- `data_sources` — list only the directories you actually queried.

Body: 1,500–2,500 words of Markdown. Do not repeat the title as an `#` heading. Then a `---` rule,
then the disclaimer.

## 6. Bylines

No named ICF staff exist in the world model. Sign the letter `Office of the Chief Executive` and
use the role bylines in VAULT-DESIGN §5.1. **Do not invent a named CEO.** If VAULT-DESIGN §5.2 has
been marked approved by Amith, use that roster and only that roster.

## 7. The mandatory disclaimer

The file's final line, italicised, preceded by a `---` rule, **verbatim**:

```
*The International Cheese Federation (ICF) and More Cheese are entirely fictional. This post is demonstration content created for MemberJunction. All people, organizations, events, courses, certifications, figures, and quotations in it are invented, and nothing here represents a real association, a real business, a real person, or real professional advice.*
```

Do not reword it, shorten it, or move it. The word "post" is intentional — see VAULT-DESIGN §6.1.

## 8. Do not

Everything in VAULT-DESIGN §7 applies. The ones that bite hardest here:

- **No invented financials.** No expenses, no surplus, no reserves, no net position, no staff
  costs, no budget-vs-actual. Revenue and cash only, labelled unaudited.
- **No real people, brands, agencies, or trade bodies as actors.** Real cities as event locations
  are fine (they are in the data).
- **No invented winners, events, courses, certifications, committees, or members.**
- **No hero out of period** — check VAULT-DESIGN §4.3 before naming anyone.
- **No named ICF staff** until §5.2 is approved.
- **No prices that contradict `generated/products`.**
- **No batching** — one fiscal year per invocation.
- **No writes outside `content/`.** `data/`, `generated/`, `config/`, `migrations/`, `packages/`
  are read-only.

## 9. Completion checklist — run this and report each line

1. **Files created** — exactly one, full path listed, at `content/annual-reports/YYYY/icf-annual-report-fyYYYY.md`.
2. **Filename matches the period** — the `YYYY` in the folder and filename equals `fiscal_year`,
   and `period_start`/`period_end` are `YYYY-01-01` / `YYYY-12-31`. State them.
3. **Frontmatter valid** — parse the YAML, do not eyeball it. All fields present, in order;
   `doc_type: annual-report`; `visibility: public`; `fictional: true`; `era` matches
   `data/ruleset/eras.json` for that cycle; `report_sections` matches the actual `##` headings.
4. **Disclaimer present** — grep for the exact §7 string; confirm it is the final line.
5. **No real named people** — list every proper name of a person in the document and classify each
   as (a) one of the 16 heroes and eligible for that year, (b) a name read from `generated/people`
   or `generated/committee-memberships`, or (c) a role byline. Anything else is a failure.
6. **Numbers traceable** — produce a table of every figure in the document with the Appendix A
   snippet that produced it (A.1–A.9). Any figure without a snippet must be removed.
7. **Section count and order** — the seven required `##` headings, in order, correct names.
8. **Word count** — report the body word count; confirm 1,500–2,500.
9. **Financial altitude** — confirm no expense, surplus, reserve, or balance-sheet figure appears,
   and that the unaudited-revenue sentence is present.
10. **No world-model inventions** — confirm every committee, event, course, certification,
    competition category, product, and organisation named exists in `generated/` or
    `data/banks/organizations.json`.

If any line fails, fix it before reporting.
