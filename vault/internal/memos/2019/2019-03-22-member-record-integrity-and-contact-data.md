---
title: "Member record integrity and the data-quality backlog"
date: 2019-03-22
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
subject: "Member record integrity and the data-quality backlog"
week_of: 2019-03-18
tags:
  - membership
  - data-quality
  - record-integrity
data_sources:
  - generated/people
  - generated/organizations
---

> **FICTIONAL DEMONSTRATION DOCUMENT** — International Cheese Federation (ICF), a fictitious trade association created for the MemberJunction More Cheese demonstration environment. All names, figures, events, and decisions are invented.

**To:** Communications; Office of the Chief Executive
**From:** Membership Operations
**Date:** 22 March 2019
**Subject:** Member record integrity and the data-quality backlog

As we close out the week of March 18, our membership count sits at 234 current members, with two membership purchases booked this week—both first-time Individual tier entries totaling 290 USD. While the intake pipeline is moving, a review of our member records highlights persistent data-quality vulnerabilities that require immediate correction before we run next quarter's renewal notices. We are currently tracking duplicate entries, stale employer affiliations, bounced email addresses, and membership statuses that do not reconcile against recent payment ledgers.

## Scope of the record defects

The primary friction in our database stems from unverified member updates submitted through online forms and legacy record migrations. Specifically, we have identified a duplicate person record pair representing the same individual under slight variations in spelling, which artificially fragments membership history and splits engagement tracking across two IDs. Furthermore, several corporate and small-business accounts list employers that underwent acquisition or dissolution during the prior fiscal year, meaning renewal invoices are currently routed to defunct mailboxes.

We also face a cluster of bounced email addresses on our regional mailing lists, which distorts our open-rate metrics and prevents critical advocacy notices—such as the raw-milk aging rules coalition updates—from reaching active producers. Most critically, a subset of member statuses listed as active do not match our confirmed cash capture records. These accounts were granted grace periods that expired without a matching payment line, yet the database still displays them as in good standing.

## Impact on operations and public comms

These discrepancies are not merely administrative paperwork; they directly impact our public-facing communications and federation credibility. When Communications pulls mailing lists or cites member counts in our blog posts and newsletters—such as this week's coverage of steady cheese demand and shrinking milk supplies—we rely on clean database segments. If our active member tally includes lapsed accounts or duplicate records, our baseline data becomes indefensible during an audit or a board review.

Moreover, members who attempt to access member-only portal features or register for upcoming courses like the March 29 Allergen Management cohort encounter login blocks or duplicate profile prompts when their contact details are out of sync.

## What we need

- Communications: hold off on publishing any detailed membership tier breakdowns in regional newsletters until Membership Operations completes the duplicate record merge.
- Office of the Chief Executive: approve a temporary administrative hold on automated renewal notices for accounts flagged with bounced addresses so we can verify phone numbers manually.
- Membership Operations team: execute the record-cleaning protocol outlined in this memo by the end of next week.

*Membership Operations*
