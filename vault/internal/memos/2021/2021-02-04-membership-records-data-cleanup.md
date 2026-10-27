---
title: "Membership records cleanup and reconciliation of duplicate accounts"
date: 2021-02-04
doc_type: memo
visibility: internal
org: "International Cheese Federation"
era: era-virtual-pivot-2021
fiscal_year: 2021
fictional: true
from_role: "Membership Operations"
to_roles:
  - "Communications"
  - "Office of the Chief Executive"
subject: "Membership records cleanup and reconciliation of duplicate accounts"
week_of: 2021-02-01
tags:
  - membership
  - data-quality
  - duplicate-accounts
  - records
data_sources:
  - generated/people
  - generated/orders
---

> **FICTIONAL DEMONSTRATION DOCUMENT** — International Cheese Federation (ICF), a fictitious trade association created for the MemberJunction More Cheese demonstration environment. All names, figures, events, and decisions are invented.

**To:** Communications; Office of the Chief Executive
**From:** Membership Operations
**Date:** 4 February 2021
**Subject:** Membership records cleanup and reconciliation of duplicate accounts

As we process renewals and intake during our winter operating window, a persistent data-quality issue in our member records requires immediate coordination between our team and Communications. Specifically, we have identified several duplicate accounts, stale employer associations, and a recurring discrepancy between recorded payment status and active member tiers in our database. These discrepancies risk compromising the accuracy of our public reporting and our internal member communications. This memo outlines the scope of the problem, our findings so far, and the steps required to remediate the database before spring programming begins.

## The scope of record discrepancies

A thorough audit of our database reveals that duplicate records remain a primary hurdle. A notable instance involves overlapping entries where separate profiles exist for the same individual under slight variations in spelling or historic email addresses. Furthermore, several employer associations in our small creamery and retail tiers have not been updated following personnel shifts last year, leading to communications being sent to vacant roles or defunct corporate entities.

While our current active membership count at the end of the week stands at 435, and confirmed orders for the week total 4 with gross sales of 686 dollars and total cash captured reaching 13036 dollars, these aggregate figures mask underlying record discrepancies. For instance, payment matching for two individual tier purchases processed this week currently points to secondary profile entries rather than primary member accounts, which inflates our first-time purchaser counts incorrectly if uncorrected.

## Connection to public communications

Our public blog posts this week focus heavily on operational fundamentals, such as retail counter metrics, cost sheet analysis, and navigating firmer federal cheese price benchmarks. Members reading these posts frequently reach out to our team with specific questions regarding their membership tier, dues status, or account history. When a member contacts us and discovers that our system holds a stale employer name or a duplicate history, confidence in our administrative infrastructure drops.

Communications has been referencing general membership growth and engagement trends in recent outreach. However, if our underlying record contains unresolved duplicates or unverified employer links, any targeted outreach based on business size or retail category will misfire. We must ensure that our internal data matches what we communicate externally.

## Remediation and next steps

We cannot resolve these database anomalies overnight, but we can establish a strict protocol for incoming records during February. We are currently freezing unverified profile merges until Membership Operations can manually inspect each flagged duplicate pair. We ask Communications to route any member-reported discrepancies directly to our team rather than attempting quick edits in the live staging environment.

## What we need

- Communications: pause any automated segmentation runs based on employer category until our team clears the stale records on 15 February.
- Office of the Chief Executive: approve a temporary administrative hold on duplicate merging rules so we can execute manual merges without triggering automated validation errors.
- Membership Operations: complete the audit of the flagged duplicate pairs and issue a revised data-quality summary by the end of next week.

*Membership Operations*
