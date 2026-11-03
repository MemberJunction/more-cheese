---
title: "Membership data quality and record reconciliation review"
date: 2024-04-26
doc_type: deck
visibility: internal
org: "International Cheese Federation"
era: era-artisan-boom-2022-2024
fiscal_year: 2024
fictional: true
deck_for: "Membership Operations weekly sync, 26 April 2024"
slide_count: 7
presenter_role: "Membership Operations"
week_of: 2024-04-22
tags:
  - member-records
  - data-quality
  - duplicate-records
  - audit
data_sources:
  - generated/people
  - generated/organizations
  - generated/orders
---

> **FICTIONAL DEMONSTRATION DOCUMENT** — International Cheese Federation (ICF), a fictitious trade association created for the MemberJunction More Cheese demonstration environment. All names, figures, events, and decisions are invented.

## Membership data quality review

- Membership Operations weekly sync
- 26 April 2024
- Addressing duplicate records, stale employers, and payment mismatches

> notes: Ten minutes. The core issue is database hygiene affecting our 933 current members and weekly order processing.
> FICTIONAL DEMONSTRATION DOCUMENT — International Cheese Federation (ICF), a fictitious trade association created for the MemberJunction More Cheese demonstration environment. All names, figures, events, and decisions are invented.

---

## The week by the numbers

- 933 current members at week end
- 13 membership purchases booked this week
- 6 first-time members added to the roster
- 22 confirmed orders totaling 6,818 USD

> notes: Strong intake pace, but volume is masking underlying data defects in our member profiles and renewal tracking.

---

## Identified record defects

- Duplicate pairs splitting credential histories
- Stale employer affiliations following creamery acquisitions
- Bounced administrative emails disrupting notifications
- Tier mismatches between profile tags and payment logs

> notes: Examples include split histories for credential holders like Kate O'Leary and outdated affiliations for members at Fernholt Creamery.

---

## Operational impact

- Communications cannot verify member spotlight backgrounds
- Advocacy teams lack accurate small-producer mapping
- Staff waste hours reconciling manual tier upgrades
- Public blog references risk database contradictions

> notes: Public posts celebrating spring membership milestones depend on clean data that our current duplicate rate undermines.

---

## Conference registration overlap

- 9 new registrations taken for ICF Annual Conference 2024
- Total registered remains well below final capacity
- Registration profiles require immediate employer validation
- Avoid importing unverified duplicate attendee records

> notes: The Des Moines conference is drawing steady interest, but we must ensure badge and roster imports tie directly to unique member IDs.

---

## Proposed cleanup protocol

- Pause manual profile edits by non-operations staff
- Run automated deduplication script on member name pairs
- Verify active employer records against organizational directory
- Reconcile all pending payment tier discrepancies by Friday

> notes: A temporary two-week freeze will let us stabilize the database without blocking urgent membership purchases.

---

## Decisions we need

- Approve the two-week administrative edit freeze
- Authorize direct outreach to members with bounced addresses
- Set deadline for tier payment reconciliation

> notes: Once these three steps are agreed, Membership Operations will execute the merge and publish a clean roster.
