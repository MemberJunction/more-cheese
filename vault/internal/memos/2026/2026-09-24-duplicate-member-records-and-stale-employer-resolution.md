---
title: "Duplicate member records and stale employer resolution for Fernholt Dairy"
date: 2026-09-24
doc_type: memo
visibility: internal
org: "International Cheese Federation"
era: "era-stabilization-2026"
fiscal_year: 2026
fictional: true
from_role: "Membership Operations"
to_roles:
  - "Communications"
  - "Office of the Chief Executive"
subject: "Duplicate member records and stale employer resolution for Fernholt Dairy"
week_of: "2026-09-21"
tags:
  - membership
  - data-quality
  - duplicate-records
  - employer-records
data_sources:
  - generated/organizations
  - generated/people
---

> **FICTIONAL DEMONSTRATION DOCUMENT** — International Cheese Federation (ICF), a fictitious trade association created for the MemberJunction More Cheese demonstration environment. All names, figures, events, and decisions are invented.

**To:** Communications; Office of the Chief Executive
**From:** Membership Operations
**Date:** 24 September 2026
**Subject:** Duplicate member records and stale employer resolution for Fernholt Dairy

This memo records our review of a recurring data-quality issue in the member database: duplicate profiles linked to stale employer names, specifically involving the duplicate entries under Fernholt Dairy and its associated personnel. During our weekly review ending 27 September 2026, we identified that conflicting employer affiliations and duplicate accounts continue to generate bounced notification addresses and mismatched renewal notices. While our total membership reached 1691 by the end of the week, unresolved profile discrepancies create friction in our outreach and threaten the reliability of our directory data.

## The scope of the problem

Duplicate profiles typically arise when members renew under a variant spelling or when an employer acquisition splits a single organization into multiple legacy accounts. In the case of Fernholt Dairy, two distinct records currently point to overlapping contacts and outdated affiliations. One profile lists an inactive mailing address, while the other reflects a current active membership purchase. When communications staff pull mailing lists for announcements or newsletter distributions, these duplicate pairs result in bounced mail and conflicting dues tracking.

This is not an isolated incident. As creamery closures slow and transition into succession and consolidation stories, more operations are renaming, splitting, or merging. Our database currently lacks an automated reconciliation trigger when a member updates their corporate affiliation, leaving operations analysts to catch the divergence manually during renewal cycles.

## Impact on communications and advocacy

Data discrepancies directly interfere with our public messaging and advocacy outreach. When our communications team publishes updates on industry developments—such as our recent coverage of dry whey prices and butter softening—bounced email notifications from stale accounts obscure our actual reach. Furthermore, advocacy actions regarding raw-milk aging rules and labeling standards require clean organizational records to ensure committee lists and petition signatures accurately represent our active base.

If we continue to permit duplicate accounts to linger through renewal grace windows, our reported first-time member counts (17 first-time purchases out of 30 total membership purchases this week) will be distorted by returning members who accidentally created a second profile rather than renewing their existing one.

## Proposed remediation steps

To resolve these discrepancies before the Q4 event schedule begins—including the upcoming Curd Food Safety workshop in Boise—we must institute a strict profile-merging protocol. Membership operations will cross-reference all incoming renewal payments against existing organization keys in `generated/organizations` before posting credits.

## What we need

- Communications: flag any bounced notification addresses originating from Fernholt Dairy or similar accounts immediately so we can merge the underlying records.
- Office of the Chief Executive: approve a formal data-cleanup window in October to purge confirmed duplicate pairs before year-end reporting.
- Membership Operations: complete the manual merge of the Fernholt Dairy duplicate profiles by 30 September 2026.

*Membership Operations*
