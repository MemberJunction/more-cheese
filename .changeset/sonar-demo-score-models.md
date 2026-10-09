---
"@mj-biz-apps/more-cheese-entities": minor
"@mj-biz-apps/more-cheese-server": minor
"@mj-biz-apps/more-cheese-ng": minor
---

Sonar score models that compute on a fresh install. Config metadata only (`config/sonar-*`, new `config/scheduled-jobs`); it reaches hosts through the next release's `Metadata_Sync` seed.

- **Member Engagement Score repaired.** Event Participation and Event Recency read `RegisteredOn`, which is not a column on `MJ_BizApps_Orders: Event Order Lines`, and Member Spend summed `Order Headers` (two People foreign keys, which Sonar rejects). Each of these failed every recompute. Event Participation now counts non-cancelled registrations. Event Recency becomes Event Attendance (checked-in registrations). Member Spend sums `Payment Headers.Amount` over 24 months of `PaymentDate`. Membership Tenure now scores longer tenure higher.
- **Members only.** The four People models set `PopulationFilter` to `{ relatedEntity: "MoreCheese: Member Profiles", operator: "exists" }`, so they score the 2,109 members and ignore the 962 non-member contacts. Without the filter those contacts score 0 and crowd the at-risk bands. Company Member Health (Organizations) has no filter.
- **Four new models.** Member Renewal Health (People, 7 factors), Professional Development (People, 6), Volunteer & Governance Leadership (People, 6) and Company Member Health (Organizations, 5), each with its own band set. Band cut-offs were tuned against the demo data so no band holds most members.
- **Scores exist after install.** Sonar has no scheduler, so a published model holds no scores until something recomputes it. Five `MJ: Scheduled Jobs` (one per model, nightly, `RunImmediatelyIfNeverRun`) drive the existing `Sonar: Recompute Model` action through `ActionScheduledJobDriver`, so the first scoring happens on the host scheduler's first poll after install. This needs `scheduledJobs.enabled`, which is MJServer's default.
- **Version rows.** The hand-authored v1 `ScoreModelVersion` used a snapshot shape the version-history UI cannot parse. Its deferred `CurrentVersionID` lookup also re-pointed the model at it after the activation publish, which left two `IsCurrent` rows. Config no longer authors versions: the Draft→Active publish snapshots them. The v1 row and the released v2 snapshot (`A5C9A67E…`) carry `deleteRecord`.

Depends on the mj-bizapps-sonar release carrying MemberJunction/bizapps-sonar#84 (related-record population filters; older Sonar fails these four models' recompute on the filter), plus its `Sonar: Recompute Model` action (`5044A100-0002-…`), and mj-bizapps-forms and mj-committees (factor sources).
