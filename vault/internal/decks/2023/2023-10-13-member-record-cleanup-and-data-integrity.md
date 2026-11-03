---
title: "Member record cleanup and data integrity review"
date: 2023-10-13
doc_type: deck
visibility: internal
org: "International Cheese Federation"
era: era-artisan-boom-2022-2024
fiscal_year: 2023
fictional: true
deck_for: "Membership Operations weekly review, 13 October 2023"
slide_count: 7
presenter_role: "Membership Operations"
week_of: 2023-10-09
tags:
  - membership-records
  - data-quality
  - database-cleanup
data_sources:
  - generated/people
  - generated/organizations
---

> **FICTIONAL DEMONSTRATION DOCUMENT** — International Cheese Federation (ICF), a fictitious trade association created for the MemberJunction More Cheese demonstration environment. All names, figures, events, and decisions are invented.

## Member record cleanup and data integrity review

- Membership Operations internal review
- 13 October 2023
- Addressing duplicate identities, stale employers, and bounced contacts

> notes: Ten minutes. The focus is database hygiene before Q4 reporting and renewal notices.
> FICTIONAL DEMONSTRATION DOCUMENT — International Cheese Federation (ICF), a fictitious trade association created for the MemberJunction More Cheese demonstration environment. All names, figures, events, and decisions are invented.

---

## Current membership baseline

- 838 total current members at week end
- 7 membership purchases booked this week
- 4 first-time members added to the roster
- Tier mix: 1 Corporate, 5 Individual, 1 Enthusiast

> notes: Baseline figures from our weekly snapshot. Growth is steady, but database errors are compounding.

---

## Identified data anomalies

- 14 duplicate identity pairs requiring manual merging
- 29 profiles carrying stale or incorrect employer affiliations
- 18 bounced email addresses on active member accounts
- 9 payment status mismatches between ledger and profile flags

> notes: These numbers represent our internal audit findings and explain why outreach numbers occasionally drift.

---

## The Kate O'Leary / Kathy O'Leary case

- Duplicate records split across conference and course history
- Different email handles masking a single individual
- Institutional affiliation matches across both entries
- Manual merge required to preserve professional credentials

> notes: This is our most prominent duplicate pair and highlights why self-service profile creation lacks duplicate checking.

---

## Stale employer records

- Aisha Bell profile reflects outdated creamery affiliation
- Multiple corporate contacts changed roles without portal updates
- Regional committee rosters affected by old company names
- Manual verification required with regional representatives

> notes: Stale data creates confusion during committee voting and regional outreach campaigns.

---

## Operational impact

- Bounced emails degrade our communication sender reputation
- Mismatched payment statuses trigger unnecessary reminder notices
- Committee participation tracking is compromised by split profiles
- Administrative time diverted from onboarding to record repair

> notes: Fixing this now prevents much larger reporting errors during annual report preparation.

---

## Decisions we need

- Approve temporary freeze on unverified profile creation
- Assign committee liaisons to verify stale employer records
- Set target completion date for duplicate record merges

> notes: If we secure these three agreements today, database cleanup finishes before the November board packet.
