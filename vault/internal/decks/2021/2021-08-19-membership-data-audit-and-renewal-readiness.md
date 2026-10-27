---
title: "Membership data audit and renewal readiness"
date: 2021-08-19
doc_type: deck
visibility: internal
org: "International Cheese Federation"
era: "era-virtual-pivot-2021"
fiscal_year: 2021
fictional: true
deck_for: "Membership Operations weekly sync, 19 August 2021"
slide_count: 7
presenter_role: "Membership Operations"
week_of: "2021-08-16"
tags:
  - membership
  - data-quality
  - renewals
  - operations
data_sources:
  - generated/people
  - generated/organizations
  - generated/orders
---

> **FICTIONAL DEMONSTRATION DOCUMENT** — International Cheese Federation (ICF), a fictitious trade association created for the MemberJunction More Cheese demonstration environment. All names, figures, events, and decisions are invented.

Query: `node scripts/vault-facts.mjs week 2021-08-16`

## Membership data audit and renewal readiness

- Membership Operations weekly sync
- 19 August 2021
- Addressing duplicate records, stale employers, and billing alignment

> notes: Ten minutes. The focus is data hygiene ahead of the fall renewal push. FICTIONAL DEMONSTRATION DOCUMENT — International Cheese Federation (ICF), a fictitious trade association created for the MemberJunction More Cheese demonstration environment. All names, figures, events, and decisions are invented.

---

## Current week baseline

- 468 current members at week end
- 7 membership purchases booked this week
- 1,968 USD gross membership sales so far
- 984 USD cash captured during the week window

> notes: Preliminary figures pulled mid-week. The week ends Sunday August 22.

---

## The data quality problem

- Duplicate profiles causing split payment histories
- Stale employer records breaking renewal notices
- Bounced email addresses on recent broadcast lists
- Payment tiers occasionally mismatched with active dues

> notes: These issues directly impact small creameries attempting to renew during their busy production season.

---

## Specific record anomalies

- Duplicate pairs identified in the individual tier
- Outdated employer affiliations on corporate accounts
- Unresolved contact updates from regional members
- Manual verification required before grace-window notices ship

> notes: We cannot run automated bulk notices until these specific profile conflicts are resolved.

---

## Coordination with Communications

- Public blog posts drive inbound inquiries to our team
- Inquiries highlight broken profile links immediately
- Shared mailing lists require clean employer data
- Coordination prevents embarrassing bounce notifications

> notes: Communications must be kept informed of record freezes during reconciliation.

---

## Recommended remediation steps

- Freeze automated renewal notices for flagged duplicate accounts
- Contact affected members directly to verify current employer data
- Merge verified duplicate profiles manually in the database
- Re-issue correct invoices before grace-window expiration

> notes: Manual review takes time but prevents permanent loss of member history.

---

## Decisions we need

- Approve temporary pause on automated notices for flagged accounts
- Assign additional administrative support for manual profile merging
- Agree on escalation path for unresolved stale employer records

> notes: We need agreement from leadership before altering the automated notice schedule.
