---
title: "Data-quality remediation in member records — duplicate accounts and stale employment"
date: 2021-11-23
doc_type: memo
visibility: internal
org: "International Cheese Federation"
era: era-virtual-pivot-2021
fiscal_year: 2021
fictional: true
from_role: "Membership Operations"
to_roles:
  - "Office of the Chief Executive"
  - "Communications"
  - "Education & Credentialing"
subject: "Data-quality remediation in member records — duplicate accounts and stale employment"
week_of: 2021-11-22
tags:
  - data-quality
  - membership
  - duplicate-records
  - employer-records
data_sources:
  - generated/people
  - generated/organizations
  - generated/orders
---

> **FICTIONAL DEMONSTRATION DOCUMENT** — International Cheese Federation (ICF), a fictitious trade association created for the MemberJunction More Cheese demonstration environment. All names, figures, events, and decisions are invented.

**To:** Office of the Chief Executive; Communications; Education & Credentialing
**From:** Membership Operations
**Date:** 23 November 2021
**Subject:** Data-quality remediation in member records — duplicate accounts and stale employment

Thanksgiving week is when our member database undergoes its heaviest contact pressure. With retail counters rushing through holiday service and small farmstead creameries placing emergency restock calls, our records are exposed to more inquiries and updates than at almost any other time of the year. It is also the moment when database discrepancies create friction that members notice directly. This memo addresses two persistent data-quality failures currently sitting in our member records: duplicate individual accounts and stale employer associations.

## The duplicate record problem

The most pressing data discrepancy involves duplicate individual profiles. Specifically, our system currently maintains separate records for Kate O'Leary and Kathy O'Leary. These entries share identical or nearly identical credential histories, certification milestones, and historical course enrollments, but sit under separate person keys. When members or employers check recertification status or query course completions, this split creates orphaned records and confusion about continuing education credits. Operating with a duplicate pair means our membership counts are slightly inflated and continuing education records are fractured.

We cannot resolve this by simply merging database keys without verifying payment histories and certification certificates first. However, leaving the duplicate pair active undermines trust when our staff or credentialing committees attempt to verify an individual's active status. Communications must also ensure that public newsletters or blog references do not inadvertently perpetuate the split when citing member achievements.

## Stale employer associations

Beyond duplicate individuals, our records contain numerous stale employer associations. A prominent example is Aisha Bell, whose profile continues to list an outdated and inactive employer rather than her current operating base at Fernholt Creamery. Similar stale affiliations persist across several small-producer accounts where creameries changed names, restructured, or dissolved during the recent economic shifts of the pandemic.

When members call our office for wholesale capacity lists or when committees review advocacy participation, stale employers distort our picture of who is actually active in the industry. During a week when regional distributors and retail buyers are actively searching for suppliers, an outdated employer field means a member misses inbound inquiries or receives communications addressed to an old entity.

## Capacity and clean-up priorities

Membership Operations is currently processing this week's membership purchases — 3 new purchases total, comprising 1 Corporate tier and 2 Individual tiers, with gross order revenue reaching $1553 and cash captured at $809. While processing active revenue is our primary operational task, we cannot let database hygiene slip further without risking our year-end close.

We are dedicating limited analyst hours to isolate the duplicate pair and flag stale employer records before the December rush. Communications and Education must coordinate with us to ensure that any outbound mailings or course rosters reference the corrected entity names.

## What we need

- Office of the Chief Executive: approve a formal 30-day freeze on unverified profile creation to stop new duplicates from entering the database.
- Education & Credentialing: cross-reference all course completion records for Kate O'Leary and Kathy O'Leary against signed certificate logs before the next cohort starts.
- Communications: verify that all member spotlight drafts and email distribution lists check employer affiliations against current organization records.
- Membership Operations: complete the duplicate merge protocol for the O'Leary records and update Aisha Bell's employer association by 3 December.
