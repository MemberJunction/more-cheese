---
title: "Re: Certification record correction and exam fee posting"
date: 2022-02-22
doc_type: email
visibility: internal
org: "International Cheese Federation"
era: era-artisan-boom-2022-2024
fiscal_year: 2022
fictional: true
from: "Membership Operations <membership.ops@morecheese.example>"
to:
  - "Education & Credentialing <education@morecheese.example>"
cc:
  - "Exec <exec@morecheese.example>"
subject: "Re: Certification record correction and exam fee posting"
sent: 2022-02-22T14:30:00Z
thread_id: 2022-02-22-certification-record-correction
message_id: mc-2022-02-22-1430-membops-education
in_reply_to: mc-2022-02-22-1015-education-membops
week_of: 2022-02-21
tags:
  - certifications
  - data-quality
  - exam-fees
data_sources:
  - generated/certifications
  - generated/orders
---

**From:** Membership Operations <membership.ops@morecheese.example>
**To:** Education & Credentialing <education@morecheese.example>
**Cc:** Exec <exec@morecheese.example>
**Sent:** Tuesday, 22 February 2022 14:30
**Subject:** Re: Certification record correction and exam fee posting

> **FICTIONAL DEMONSTRATION DOCUMENT** — International Cheese Federation (ICF), a fictitious trade association created for the MemberJunction More Cheese demonstration environment. All names, figures, events, and decisions are invented.

I checked the order ledger and payment tables. The payment captured successfully and mapped to the right order ID, but the credential linkage table was missed during last week's batch update because the member ID string had an extra trailing space.

It is definitely a data-quality glitch on our end rather than an unpaid fee. I can push a script to clean up the whitespace and relink the credential record by tomorrow morning. You do not need to re-invoice anyone.

*Membership Operations*
