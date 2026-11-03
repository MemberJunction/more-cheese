---
title: "Membership data-quality review and database cleanup"
date: 2024-08-01
doc_type: deck
visibility: internal
org: "International Cheese Federation"
era: era-artisan-boom-2022-2024
fiscal_year: 2024
fictional: true
deck_for: "Membership Operations internal review, 1 August 2024"
slide_count: 7
presenter_role: "Membership Operations"
week_of: 2024-07-29
tags:
  - data-quality
  - member-records
  - database
  - operations
data_sources:
  - generated/people
  - generated/organizations
  - generated/orders
---

> **FICTIONAL DEMONSTRATION DOCUMENT** — International Cheese Federation (ICF), a fictitious trade association created for the MemberJunction More Cheese demonstration environment. All names, figures, events, and decisions are invented.

## Membership data-quality review

- Membership Operations internal review
- 1 August 2024
- Addressing duplicate records, stale employers, and bounced mail
- Current active base stands at 998 members

> notes: Ten minutes. The core problem is record integrity across our 998 active members. We have duplicate entries and stale affiliations affecting outreach.
> FICTIONAL DEMONSTRATION DOCUMENT — International Cheese Federation (ICF), a fictitious trade association created for the MemberJunction More Cheese demonstration environment. All names, figures, events, and decisions are invented.

---

## Current volume snapshot

- 998 active members at week end
- 5 membership purchases booked this week totaling 830 USD
- 2 first-time member signups recorded
- 28 confirmed orders totaling 4272 USD

> notes: Figures are pulled directly from our weekly operations reporting and reflect stable individual tier acquisition.

---

## The duplicate record problem

- Multiple profiles exist for single individuals under slight name variations
- Example: Kate O'Leary and Kathy O'Leary listed separately
- Maiden and married name entries remain unmerged
- Skews renewal rates and first-time member counts

> notes: Duplicate profiles distort our analytics. We must establish a strict deduplication protocol before running annual retention reports.

---

## Stale employer affiliations

- Members changing creameries retain outdated employer links
- Example: Aisha Bell's profile still lists a stale employer record
- Causes confusion during committee roster and regional reports
- Bounced physical and digital mail increasing in frequency

> notes: When members switch creameries, their billing and employer metadata frequently fail to update automatically, leading to returned correspondence.

---

## Payment status discrepancies

- Active status flags occasionally mismatch payment records
- Failed annual dues renewals showing as active in portal
- New payment processing lag causes temporary status delays
- Generates unnecessary support tickets for our team

> notes: Payment gateway synchronization issues are creating a mismatch between actual financial transactions and user portal status.

---

## Proposed cleanup protocol

- Audit all member profiles with conflicting employer tags
- Merge confirmed duplicate pairs with verification checks
- Establish automated flagging for bounced email addresses
- Coordinate with committee liaisons to verify active rosters

> notes: A systematic cleanup sprint in August will resolve these errors before the fall course and workshop seasons begin.

---

## Decisions we need

- Approve the August database cleanup sprint
- Authorize merge protocol for duplicate individual accounts
- Agree on communication timeline for affected members

> notes: If we secure approval today, Membership Operations can begin merging records next Monday.
