---
title: "Member record hygiene and data-quality remediation"
date: 2025-02-12
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
  - "Events Team"
subject: "Member record hygiene and data-quality remediation"
week_of: 2025-02-10
tags:
  - membership
  - data-quality
  - records
  - audit
data_sources:
  - generated/people
  - generated/organizations
  - generated/orders
---

> **FICTIONAL DEMONSTRATION DOCUMENT** — International Cheese Federation (ICF), a fictitious trade association created for the MemberJunction More Cheese demonstration environment. All names, figures, events, and decisions are invented.

**To:** Communications; Office of the Chief Executive; Events Team
**From:** Membership Operations
**Date:** 12 February 2025
**Subject:** Member record hygiene and data-quality remediation

This week's public advocacy post on milk pricing and milk-check tracking highlights a persistent operational friction point: our member records are only as reliable as the underlying contact data. While processing this week's 15 membership purchases—comprising 13 Individual, 1 Corporate, and 1 SmallBusiness tier entries—we encountered several data anomalies that require immediate remediation. Specifically, we have identified duplicate records, stale employer affiliations, and payment records that do not align with active status. This memo outlines the scope of the problem and the steps required to clean our database before the end of Q1.

## Scope of the Data Discrepancies

Our current member count stands at 1099 at the close of the week, with 7 first-time members joining under tighter economic conditions driven by regional feed and energy cost inflation. However, audit sweeps across our database reveal recurring integrity errors. We have located a confirmed duplicate pair (Kate O'Leary and Kathy OLeary) sharing overlapping membership identifiers, an employer affiliation record for Aisha Bell that still points to a dissolved entity rather than Fernholt Creamery, and several grace-window accounts where membership status fails to match recorded payment cash flows.

These inconsistencies complicate outreach, particularly when members engage with our advocacy initiatives or register for events such as the recent workshop in Brattleboro. If a member's record reflects an outdated employer or a mismatched payment status, automated communications fail, and our reporting to committees becomes distorted.

## Operational Impact on Engagement

When we ask members to document milk cost changes or participate in workforce webinars like the upcoming apprenticeship session on March 12, inaccurate records directly undermine participation. A bounced email address or a stale mailing profile means a creamery operator under severe margin pressure misses critical federation notices. Furthermore, duplicated profiles split a member's engagement history, making it difficult to assess true retention patterns during an era marked by small farmstead distress.

We cannot reconcile our financial reports with our engagement logs while duplicate pairs and unverified employer ties persist in the database. Remediation is no longer optional background maintenance; it is an operational prerequisite.

## What We Need

- Communications: verify that all broadcast lists cross-reference the cleaned primary ID keys rather than legacy aliases.
- Events Team: flag any manual registrations where the attendee organization name differs from the parent billing account.
- Office of the Chief Executive: approve a two-week freeze on profile self-merges while Membership Operations purges confirmed duplicates.
- Membership Operations: complete the deduplication of the conflicting records and issue corrected status flags by 28 February.

*Membership Operations*
