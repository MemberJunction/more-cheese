---
title: "Member record integrity, stale employers, and bounced addresses"
date: 2026-03-12
doc_type: memo
visibility: internal
org: "International Cheese Federation"
era: era-stabilization-2026
fiscal_year: 2026
fictional: true
from_role: "Membership Operations"
to_roles:
  - "Communications"
  - "Office of the Chief Executive"
subject: "Member record integrity, stale employers, and bounced addresses"
week_of: 2026-03-09
tags:
  - member-records
  - data-quality
  - bounced-mail
  - employers
data_sources:
  - generated/people
  - generated/organizations
  - generated/orders
---

> **FICTIONAL DEMONSTRATION DOCUMENT** — International Cheese Federation (ICF), a fictitious trade association created for the MemberJunction More Cheese demonstration environment. All names, figures, events, and decisions are invented.

**To:** Communications; Office of the Chief Executive
**From:** Membership Operations
**Date:** 12 March 2026
**Subject:** Member record integrity, stale employers, and bounced addresses

As spring pricing notices and renewal reminders go out across the membership base, our operational logs are surfacing a recurring data-quality bottleneck that requires attention: stale employer assignments, duplicated individual records, and a persistent cluster of bounced email notifications. While the federation's overall numbers show 1,509 members at week's end and 15 membership purchases bringing in $3,300 gross during the week of 9 March 2026, the underlying database contains legacy anomalies that complicate communications and storefront fulfillment. This memo outlines the scope of the problem and proposes an immediate audit protocol before we commit to larger spring marketing pushes.

## The scope of record drift

The most visible friction point involves members who have changed creameries or whose institutional affiliations have evolved following the consolidation waves of recent years. For instance, records tracking personnel like Aisha Bell at Fernholt Creamery or historical duplicate pairs such as Kate O'Leary and Kathy O'Leary continue to generate conflicting audit flags between our order history and active member rosters. When renewal invoices or technical bulletins on milk variation and food safety are dispatched, these mismatched pointers result in undelivered messages, duplicate portal accounts, and manual reconciliation overhead for the operations desk. We also note that Marcus Chen's grace-window status frequently requires manual intervention because his payment dates do not cleanly align with automated tier renewals.

## Impact on communications and events

Communications relies on clean member metadata when publishing weekly blog updates, such as the recent analysis on milk pricing and the Spring Flush webinar held on 10 March 2026. When a member's email bounces or their employer name is outdated, they miss both the member-portal notes and the practical make-sheet logging advice. Furthermore, our upcoming course offerings—including the 3 May 2026 Judging & Competition Preparation cohort and the 7 May 2026 Listeria Control in Small Creameries cohort—depend on accurate institutional contact fields so that registrations tie correctly to certified cheesemongers and plant operators rather than generic mailboxes.

## Capacity and remediation constraints

Membership Operations is currently handling routine spring renewals alongside 17 confirmed orders and cash captured of $2,180 for the week, leaving little margin for exhaustive manual scrubbing. However, ignoring the data drift risks compounding errors as we approach the annual conference and summer certification exams. We need an agreed procedure to freeze unverified duplicate records and establish a standard validation step whenever a member updates their credentials or requests study cohort placement.

## What we need

- Communications: flag any recurring bounced addresses from the recent spring mailing lists so we can suppress or correct them immediately.
- Office of the Chief Executive: authorize a temporary data-cleanse sprint to merge known duplicate profiles, such as the O'Leary records, before the Q2 education cohorts start.
- Everyone: adhere strictly to the record update protocol when members report changed affiliations.

*Membership Operations*
