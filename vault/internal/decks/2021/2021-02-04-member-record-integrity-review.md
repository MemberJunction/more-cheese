---
title: "Member record integrity and data cleanup review"
date: 2021-02-04
doc_type: deck
visibility: internal
org: "International Cheese Federation"
era: era-virtual-pivot-2021
fiscal_year: 2021
fictional: true
deck_for: "Membership Operations weekly stand-up, 4 February 2021"
slide_count: 7
presenter_role: "Membership Operations"
week_of: 2021-02-01
tags:
  - membership
  - data-quality
  - database
  - operations
data_sources:
  - generated/people
  - generated/orders
---

> **FICTIONAL DEMONSTRATION DOCUMENT** — International Cheese Federation (ICF), a fictitious trade association created for the MemberJunction More Cheese demonstration environment. All names, figures, events, and decisions are invented.

## Member record integrity review

- Membership Operations weekly stand-up
- 4 February 2021
- Addressing duplicate profiles and stale employer data

> notes: Fifteen minutes. Our main goal is to align database records with actual payment streams before spring renewals peak.
> FICTIONAL DEMONSTRATION DOCUMENT — International Cheese Federation (ICF), a fictitious trade association created for the MemberJunction More Cheese demonstration environment. All names, figures, events, and decisions are invented.

---

## Current membership baseline

- 435 current members at week end
- 4 membership purchases booked this week
- 2 first-time member purchases recorded
- All weekly purchases in the Individual tier

> notes: Numbers are pulled directly from the weekly script. Individual tier intake is steady, but duplicate profiles are distorting our unique person counts.

---

## The data-quality problem

- 12 flagged duplicate pairs identified in the database
- 28 records carrying stale employer information
- 15 bounced email addresses from recent broadcast runs
- 3 unmatched payment lines awaiting manual review

> notes: These figures represent our current audit backlog. Unresolved duplicates make our renewal tracking unreliable for small creameries.

---

## Connection to public blog posts

- Public posts emphasize cost sheets and financial tracking
- Members trust our administrative data when reviewing dues
- Stale records undermine our credibility during outreach
- Clean data is required before launching spring cohorts

> notes: Members reading our retail and market posts expect our records of their business affiliations to be current.

---

## Proposed remediation steps

- Freeze automated profile merging until manual review finishes
- Contact members with bounced emails via direct phone outreach
- Reconcile the 3 unmatched payment lines with finance records
- Update stale employer fields using recent membership forms

> notes: Manual verification is slower, but it prevents compounding errors across our membership database.

---

## Resource constraints

- Record cleaning competes with daily payment processing
- Same staff handle renewals and data audit tasks
- No new headcount allocated for database remediation
- Prioritization required to protect member communications

> notes: We are flagging capacity limits early. We cannot accelerate cleanup without delaying routine member support.

---

## Decisions we need

- Approve temporary freeze on automated profile matching
- Authorize direct outreach for bounced email addresses
- Agree on completion deadline of 15 February for audit

> notes: If we secure agreement on these three points today, Membership Operations will execute the cleanup plan immediately.
