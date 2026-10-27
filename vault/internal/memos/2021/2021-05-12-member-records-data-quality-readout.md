---
title: "Member records data quality — duplicate accounts, stale employers, and bounced addresses"
date: 2021-05-12
doc_type: memo
visibility: internal
org: "International Cheese Federation"
era: era-virtual-pivot-2021
fiscal_year: 2021
fictional: true
from_role: "Membership Operations"
to_roles:
  - "Communications"
  - "Events Team"
  - "Education & Credentialing"
subject: "Member records data quality — duplicate accounts, stale employers, and bounced addresses"
week_of: 2021-05-10
tags:
  - data-quality
  - member-records
  - duplicates
  - bounced-mail
data_sources:
  - generated/people
  - generated/organizations
  - generated/orders
---

> **FICTIONAL DEMONSTRATION DOCUMENT** — International Cheese Federation (ICF), a fictitious trade association created for the MemberJunction More Cheese demonstration environment. All names, figures, events, and decisions are invented.

**To:** Communications; Events Team; Education & Credentialing
**From:** Membership Operations
**Date:** 12 May 2021
**Subject:** Member records data quality — duplicate accounts, stale employers, and bounced addresses

As we prepare for the summer events and course cohorts starting next month, a review of our database reveals persistent data-quality issues in member records. These errors are not merely administrative flaws; they disrupt course enrollment verifications, bounce our email updates, and split member payment histories across duplicate accounts. This memo outlines the specific categories of unclean data currently sitting in our systems and details the steps required to clean them before the annual conference registration volume peaks later this summer.

## Duplicate accounts and merged identities

The most acute data-quality failure involves duplicate records for individual members whose profiles were created twice under slightly different name variations or personal email addresses. The most prominent example in our active database involves Kate O'Leary and Kathy O'Leary, who currently appear as two distinct individuals in our people records despite sharing an identical historical membership timeline and organizational affiliation. When a member exists twice, their course completions, certification credits, and purchase orders are fragmented, making it impossible to run accurate retention analytics or verify prerequisites before an exam. Membership Operations is currently auditing all duplicate pairs flagged by the system, but we need program leads to verify whether any certificate holders have completed requirements under a secondary profile before we execute the merge.

## Stale employer associations and mismatched profiles

Beyond outright duplicates, our corporate and small-business member records contain numerous stale employer assignments. Members who shifted creameries or changed their primary production facility during last year's operational shifts still appear tied to their previous organizations in our database. Aisha Bell's record provides a clear illustration of this friction: her profile currently reflects a stale employer record rather than her active association with Fernholt Creamery. When a member's employment record is out of date, our regional committee assignments and advocacy mailing lists target the wrong entities. This creates confusion during coalition meetings and leaves small-producer members out of communications regarding regional milk pricing shifts or raw-milk aging rule updates.

## Bounced addresses and unverified communication channels

Our communication streams suffer from an escalating rate of hard bounces on renewal notices and course updates. While direct-to-consumer online sales and virtual course enrollments have surged during the pandemic pivot, our physical mailing addresses and contact emails have decayed because members update their shop pages without notifying our database administrators. A bounced renewal notice looks like an unreturned lapse to our reporting tools, even when the member intends to renew. We cannot run an effective retention strategy on stale contact vectors.

## What we need

- Communications: flag any bounced subscriber emails immediately rather than letting them retry silently across weekly campaign cycles.
- Education & Credentialing: cross-reference your course roster against the flagged duplicate identity list before certifying any completion credits this spring.
- Events Team: verify attendee organization names against our master organization list before printing badges for the Lark defect diagnosis workshop or the annual conference.
- Everyone: cease creating manual member profiles from event registrations without first searching the existing database by email and full name.

*Membership Operations*
