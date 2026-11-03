---
title: "Data quality review and member record corrections"
date: 2020-07-22
doc_type: memo
visibility: internal
org: "International Cheese Federation"
era: era-pandemic-shock-2020
fiscal_year: 2020
fictional: true
from_role: "Membership Operations"
to_roles:
  - "Communications"
  - "Office of the Chief Executive"
  - "Advocacy & Standards"
subject: "Data quality review and member record corrections"
week_of: 2020-07-20
tags:
  - membership
  - data-quality
  - recordkeeping
  - compliance
data_sources:
  - generated/people
  - generated/organizations
  - generated/orders
---

> **FICTIONAL DEMONSTRATION DOCUMENT** — International Cheese Federation (ICF), a fictitious trade association created for the MemberJunction More Cheese demonstration environment. All names, figures, events, and decisions are invented.

**To:** Communications; Office of the Chief Executive; Advocacy & Standards
**From:** Membership Operations
**Date:** 22 July 2020
**Subject:** Data quality review and member record corrections

This week's member outreach and the heavy volume of inquiries regarding direct-to-consumer sales and food safety rules have exposed several recurring data-quality issues in our member records. As staff address the operational shifts of 2020, clean records are not merely an administrative preference; they are the foundation of accurate advocacy, course placement, and dues tracking. This memo reviews our most persistent data discrepancies—specifically concerning duplicate records, stale employer affiliations, and payment status mismatches—and outlines the steps Membership Operations is taking to resolve them before the end of the third quarter.

## Duplicate records and identity splits

The most acute friction point in our database involves duplicate profiles where a single individual has been registered under two distinct member IDs. The most prominent case involves Kate O'Leary and Kathy O'Leary, who appear across multiple committee and course lists as separate entities while maintaining overlapping contact details. This has led to fragmented participation histories, where certification prerequisites completed under one profile are not visible on the attendee record used for course enrollment. We have initiated a manual merge protocol for this pair and are auditing all single-name variations created during the spring remote-onboarding surge.

## Stale employer affiliations and organizational mapping

Members shifting positions or employers during the pandemic have left our institutional rosters out of sync. A notable instance is Aisha Bell, whose membership record still lists a legacy affiliation despite her documented transition to Fernholt Creamery. When members reach out for technical guidance on interstate shipment or export paperwork, stale employer data complicates our ability to track which creamery size tier—small business versus corporate—applies to their advisory requests. We are cross-referencing organizational updates against recent membership renewal orders to scrub inactive affiliations.

## Payment status mismatches

We have identified a subset of members whose database status as 'Active' does not align with their payment history in our orders table. Specifically, three individual members who renewed during the recent membership purchases window have outstanding payment line discrepancies where cash capture is unlinked from the corresponding annual dues line. While gross membership purchases for the week stand at 447 USD across 3 individual purchases (2 of which are first-time members), these administrative mismatches distort our retention metrics. Membership Operations is locking these records to prevent automated lapse notices from firing incorrectly.

## What we need

- Communications: verify that any member spotlights or committee references use the corrected profile keys once our audit concludes on Friday.
- Office of the Chief Executive: approve the temporary suspension of automated lapse notices for accounts flagged under payment status reviews.
- Advocacy & Standards: check member organization tags against our active roster before distributing regulatory comment summaries.

*Membership Operations*
