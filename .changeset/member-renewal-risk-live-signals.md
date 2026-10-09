---
"@mj-biz-apps/more-cheese-entities": minor
"@mj-biz-apps/more-cheese-server": minor
"@mj-biz-apps/more-cheese-ng": minor
---

Member Renewal Risk now trains and scores from live data on any install.

- **New migration `V202610091715__v1.4.x_Member_Renewal_Signals`.**
  - Adds the view `vwMemberRenewalSignals`, registered as the read-only virtual entity **MoreCheese: Member Renewal Signals** (one row per Member Profile).
  - **Label:** `RenewalOutcome` is `Lapsed` when the member's latest confirmed membership-dues order is more than 395 days older than the dataset's latest dues order, and `Renewed` otherwise.
  - **Features:** tier, segment, region, tenure, prior terms, dues, store orders, events attended and courses, all computed as of the member's last membership purchase.
  - No dependency on Subscriptions or Journal Entries.
  - Adds `RenewalProbability`, `RenewalStatus` and `RenewalScoredAt` to Member Profile, where scores are written back.
- **Metadata.**
  - The Member Renewal Risk pipeline now targets the new entity.
  - The three seeded model rows (Published / Validated / Draft, all with no trained artifact) and the People binding are removed.
  - A new scoring Record Process, **MoreCheese: Score Member Renewal Risk**, scores every Member Profile daily and opts in to Predictive Studio auto-train. Its first run trains, publishes and binds the model.
- **Person form.** The membership panel also reads predictions recorded against the person's Member Profile, and the profile now carries the materialized renewal score.
