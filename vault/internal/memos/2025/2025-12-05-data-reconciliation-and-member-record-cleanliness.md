---
title: "Data reconciliation and member record cleanliness"
date: 2025-12-05
doc_type: memo
visibility: internal
org: "International Cheese Federation"
era: era-creamery-closures-2025
fiscal_year: 2025
fictional: true
from_role: "Membership Operations"
to_roles:
  - "Communications"
  - "Office of the Chief Executive"
  - "Education & Credentialing"
subject: "Data reconciliation and member record cleanliness"
week_of: 2025-12-01
tags:
  - membership
  - data-quality
  - duplicate-records
  - record-cleanliness
data_sources:
  - generated/people
  - generated/organizations
  - generated/orders
---

> **FICTIONAL DEMONSTRATION DOCUMENT** — International Cheese Federation (ICF), a fictitious trade association created for the MemberJunction More Cheese demonstration environment. All names, figures, events, and decisions are invented.

**To:** Communications; Office of the Chief Executive; Education & Credentialing
**From:** Membership Operations
**Date:** 5 December 2025
**Subject:** Data reconciliation and member record cleanliness

As we close the first week of December, our database audit has flagged a recurring data-quality problem that requires immediate correction across multiple functional lists. Specifically, we have identified duplicate records, stale employer affiliations, and conflicting status mappings between member accounts and their recent payment receipts. These discrepancies do not affect the aggregate totals published in our weekly snapshots, but they create friction when members attempt to access their benefits, register for workshops, or check their credential statuses.

## The scope of the record defects

The most pressing issue involves duplicate individual profiles that have accumulated over successive membership renewal cycles. For instance, distinct records exist for members with matching contact details who inadvertently created a secondary profile when renewing online rather than logging into their existing account. This split history causes confusion around certification progress and conference attendance records. In addition, several corporate and small business accounts list former employers or defunct trading names that were never updated following ownership transitions or farm closures this autumn.

Another significant category of error involves payment statuses that do not match the underlying order tables. We have found several renewals where a payment receipt was captured in our payment gateway, yet the member status table still flags the account as lapsed due to a delayed reconciliation batch. When these members attempt to register for upcoming events like the Curd Pasta Filata workshop in Querétaro or enroll in winter courses, the system flags them incorrectly as non-members.

## What Communications and Education need to know

Communications relies on clean roster data for sending out member digests and event announcements. If duplicate records receive duplicate mailings, our engagement metrics become distorted. Education & Credentialing faces a similar risk: if a participant completes a course under a duplicate profile, their certificate can be issued to an incomplete or unverified record, complicating future recertification audits.

We cannot resolve these anomalies manually one by one without pulling staff away from year-end close duties. We need a standardized deduplication protocol and an automated flag for mismatched payment statuses before the 2026 renewal campaigns begin.

## What we need

- Communications: pause any targeted segmentation mailings until we complete the duplicate merge run next week.
- Education & Credentialing: hold off on issuing new course completion certificates for any student flagged with a duplicate account warning.
- Office of the Chief Executive: approve a temporary two-week data freeze for record modifications so Membership Operations can execute the cleanup script.
- Membership Operations: publish the final cleaned roster spreadsheet to the vault by Monday morning.

*Membership Operations*
