---
title: "Membership data quality review — duplicate records and contact hygiene"
date: 2019-06-25
doc_type: memo
visibility: internal
org: "International Cheese Federation"
era: era-pre-pandemic-baseline
fiscal_year: 2019
fictional: true
from_role: "Membership Operations"
to_roles:
  - "Communications"
  - "Office of the Chief Executive"
subject: "Membership data quality review — duplicate records and contact hygiene"
week_of: 2019-06-24
tags:
  - membership
  - data-quality
  - duplicates
  - contact-hygiene
data_sources:
  - generated/orders
  - generated/people
  - generated/organizations
---

> **FICTIONAL DEMONSTRATION DOCUMENT** — International Cheese Federation (ICF), a fictitious trade association created for the MemberJunction More Cheese demonstration environment. All names, figures, events, and decisions are invented.

**To:** Communications; Office of the Chief Executive
**From:** Membership Operations
**Date:** 25 June 2019
**Subject:** Membership data quality review — duplicate records and contact hygiene

This memo outlines a recurring data-quality problem in our active roster that requires immediate correction before we run the third-quarter membership outreach. Our current member count sits at 270 at week-end, but routine database maintenance has flagged several persistent anomalies: duplicate profile records under slightly variant spellings, bounced communications, and employer entries that no longer match our members' current affiliations. These errors do not distort our total cash or confirmed order numbers, but they compromise our direct engagement and create confusion when members attempt to register for events or access member-only content.

## Duplicate profiles and name variants

The most pressing data-quality issue involves duplicate person and organization records. We have identified multiple instances where a single individual has accumulated two active profile keys due to alternate name formatting or differing organizational affiliations entered at renewal. Specifically, our audit has flagged duplicate entries for individual members as well as variations of creamery names where cooperative members and independent proprietors have been assigned separate organization keys. When members log in under an unlinked secondary profile, their purchase history splits across records, making it impossible to accurately track retention or prior event participation.

## Stale employer affiliations

Beyond duplicate profiles, a significant portion of our corporate and small-business accounts carry outdated employer names. As small creameries shift ownership, merge, or close, individual members retain their personal accounts but continue to be linked in our database to defunct corporate entities. This discrepancy became particularly evident during recent advocacy actions on raw-milk aging rules, where several letters and petition signatures were filed under former creamery titles rather than the members' current trading names. Left uncorrected, these stale linkages undermine our corporate tier mix reporting and complicate advocacy tracking.

## Bounced communications and contact hygiene

Contact hygiene has also degraded across our mailing lists. While our order confirmation rate remains stable—resulting in 32 confirmed orders and 5,970 dollars in cash captured this week—a growing cluster of email addresses consistently hard-bounce on broadcast announcements, including notices for free webinars such as the Wholesale Negotiation webinar running this Thursday. Members whose addresses bounce miss critical deadline reminders for workshops and conference registrations. We need a standardized verification protocol to cleanse these records before the Madison conference in July.

## What we need

- Communications: pause any blanket email broadcasts to unverified secondary addresses until Membership Operations completes the profile merge.
- Office of the Chief Executive: authorize a dedicated data-cleanup window in July to merge identified duplicate records and update stale employer affiliations.
- Membership Operations: publish a consolidated list of flagged duplicate pairs and outdated employer records for internal review by Friday.

*Membership Operations*
