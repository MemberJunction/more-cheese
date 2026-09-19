# morecheese-annual-report — operator notes

`SKILL.md` produces **one fiscal year's** ICF annual report at
`content/annual-reports/YYYY/icf-annual-report-fyYYYY.md`.

Governing design: [`content/VAULT-DESIGN.md`](../../../content/VAULT-DESIGN.md).

## Scope

- Fiscal year == calendar year. Valid years: **2019–2025** (the era range in
  `data/ruleset/eras.json`). Anything else stops with a report, not an invention.
- 1,500–2,500 words, seven fixed sections.
- **Every number comes from `generated/`** via Appendix A of the design doc. The skill computes a
  fact-sheet before drafting; that ordering is the whole reliability story.

## Running the backfill

Seven invocations, one per year, fresh context each:

```sh
cd /path/to/more-cheese
for y in 2019 2020 2021 2022 2023 2024 2025; do
  claude -p "Use the morecheese-annual-report skill. Generate the ICF annual report for FY$y."
done
```

Run them one at a time and read each before continuing — seven reports is a cheap review and the
narrative arc across the five eras is worth eyeballing as a set.

No web research is required (unlike the blog skill); everything the report needs is in
`generated/`. That makes this skill cheap and offline-safe.

## Known constraints

- `generated/` has orders, order lines, payments and payment lines — **no expense side, no
  ledger, no balance sheet.** The financial section is deliberately revenue-and-cash only and says
  so in the text. Do not "improve" this by inventing expenses.
- Governance names must come from `generated/committee-memberships` joined to
  `generated/committee-terms`. See VAULT-DESIGN §9 decision 1 for a known contradiction between
  those rows and the blog skill's hero prose — the data wins.
- Bylines are role-only until VAULT-DESIGN §5.2 (the proposed staff roster) is approved by Amith.

## Sample

`content/annual-reports/2023/icf-annual-report-fy2023.md` was produced by this skill and passes
its own §9 checklist.
