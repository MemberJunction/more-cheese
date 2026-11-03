---
title: "Re: Exam prerequisite record correction and audit"
date: 2024-01-09
doc_type: email
visibility: internal
org: "International Cheese Federation"
era: era-artisan-boom-2022-2024
fiscal_year: 2024
fictional: true
from: "Membership Operations <membership.ops@morecheese.example>"
to:
  - "Education & Credentialing <education@morecheese.example>"
cc:
  - "Advocacy & Standards <advocacy@morecheese.example>"
subject: "Re: Exam prerequisite record correction and audit"
sent: 2024-01-09T14:15:00Z
thread_id: 2024-01-09-exam-prerequisite-correction
message_id: mc-2024-01-09-1415-membops-edu
in_reply_to: mc-2024-01-09-1030-edu-membops
week_of: 2024-01-08
tags:
  - certification
  - prerequisite
  - audit
  - records
data_sources:
  - generated/certifications
  - generated/member-certifications
---

**From:** Membership Operations <membership.ops@morecheese.example>
**To:** Education & Credentialing <education@morecheese.example>
**Cc:** Advocacy & Standards <advocacy@morecheese.example>
**Sent:** Tuesday, 9 January 2024 14:15
**Subject:** Re: Exam prerequisite record correction and audit

> **FICTIONAL DEMONSTRATION DOCUMENT** — International Cheese Federation (ICF), a fictitious trade association created for the MemberJunction More Cheese demonstration environment. All names, figures, events, and decisions are invented.

I looked at the table linkage. It is not a membership renewal lapse; both accounts are fully current with 872 total members in the system as of this week. However, their member IDs were updated during the database migration last quarter, and the certification mapping table is still pointing to their legacy identifiers.

This is a data-structure issue, not a candidate failure. I can run a manual SQL patch to re-key those two records this afternoon, but it means we need to audit all certification linkages before the next renewal batch runs.

*Membership Operations*
