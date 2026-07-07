# R3 — v1 Cheese-Association Demo: Implied Targets, Chosen Distributions, and Bug Inventory

**Source mined:** `MJ-morecheese/Demos/AssociationDB/` — 108 golden-query `.sql` files under `metadata/queries/SQL/`, seed scripts `data/00_parameters.sql` … `data/11_legislative_tracking_data.sql`, schema `schema/V001–V008`, `MASTER_BUILD_AssociationDB.sql`.

**How to read this:** Section 1 is what the queries *assume* the data exhibits. Section 2 is what the seed scripts *actually* generate. The gap between the two is Section 4 (bugs/degeneracies). Section 5 consolidates targets for v2.

**Keep/drop legend (Section 1):**
- **keep** — v2 schema (per `research-plan-and-schema-proposal.md` Part 2) has the tables; query ports with renames.
- **adjust** — the *question* survives but the v2 shape differs (e.g. EngagementScore moves to `sonar.Score`; Invoices move to the `orders`/`payments` BizApps; committees move to the composed committees app; awards derive from `JudgeScore`).
- **drop** — references a table v2 kills outright (PostTag, MemberFollow, PostAttachment, ForumModeration, ResourceRating, ResourceVersion, ResourceTag, EmailClick, CampaignMember, Certificate, CertificationRenewal, ContinuingEducation¹, CertificationRequirement, AccreditingBody-as-table, BoardPosition/BoardMember, ProductAward², RegulatoryComment).

¹ replaced by `learning.CECredit` (exclusive-arc) — CE *questions* survive, marked adjust where the question matters.
² replaced by `awards.Award` keyed to CompetitionEntry + JudgeScore — award questions survive as adjust.

---

## Section 1 — Query table (one row per query, grouped by domain)

### 1.1 Membership & member engagement

| Query | Metric | Implied data pattern/target | v2 |
|---|---|---|---|
| Membership Renewal Rate By Type | Per type, of memberships past EndDate: renewed vs lapsed vs cancelled | Renewal rate must **vary by type** (Student low, Corporate high); RenewalDate populated on renewals; past-EndDate rows must exist | **keep** (MembershipPeriod) |
| Active Memberships By Type | Count Active by type | Non-uniform type mix with a dominant tier | **keep** |
| Membership Cancellation Rates By Type | Cancelled/total per type + ranked CancellationReason strings | Cancelled rows need populated, *repeating* CancellationReason values; cancellation rate varies by type | **keep** — v1 never seeds CancellationReason (see §4.2) |
| Highly Engaged Non-Active Members | Members with EngagementScore ≥ threshold whose membership isn't Active | Deliberate paradox segment: high engagement + lapsed/cancelled — a churn-risk story | **adjust** (engagement → sonar.Score) |
| Member Retention Rate By Industry | Of ≥5-yr-tenure members per Industry: % with LastActivityDate in last yr | Join dates ≥5 yrs back; LastActivityDate split so retention varies by industry | **adjust** (LastActivityDate → derivable/Sonar recency; Industry → Segment/Discipline) |
| Organizations With Populated Engagement Scores | Per org: member count + avg/min/max EngagementScore | Members linked to orgs (85%); scores >0 and varying within/across orgs | **adjust** (sonar.Score) |
| Member Engagement By Certification Status | Avg engagement by cert Status incl. no-cert bucket | Certified members should out-engage uncertified; multiple cert statuses | **adjust** (sonar.Score) |
| Member Engagement By Course Completion | Engagement stats: completers vs non-completers, 75/50 buckets | Completion should correlate with engagement; scores must span thresholds | **adjust** (sonar.Score) |
| Member Engagement By Event Attendance | Engagement stats: attended-last-yr vs not (avg/stdev) | Attendees should out-engage non-attendees; recent Attended rows needed | **adjust** (sonar.Score) |

### 1.2 Chapters, committees & board

| Query | Metric | Implied data pattern/target | v2 |
|---|---|---|---|
| Chapter Officer Turnover Analysis | Officer starts/ends per chapter in last 12 mo | Officer churn **within the last year** — some seated, some departed, varying by chapter | **keep** (ChapterOfficer TermStart/TermEnd) — v1 has zero turnover (§4.6) |
| Average Officers Per Active Chapter By Region | Active officers ÷ active chapters per Region | Several regions; uneven officer distribution | **keep** |
| Most Active Chapters By Member Count | Active chapter-membership count per chapter | Clear big-vs-small chapter skew | **keep** (ChapterID on MemberProfile replaces ChapterMembership) |
| Chapter Membership Growth By Type | New joins in last yr per ChapterType | Recent chapter-join activity across Geographic vs Special Interest | **keep/adjust** |
| Active Committees By Member Count | Active members per active committee | Varying committee sizes | **adjust** (BizApps committees app) |
| Active Committees By Type | Committee count by CommitteeType | Standing vs Ad Hoc vs Task Force mix | **adjust** (committees app) |
| Committees At Or Over Capacity | Committees where active members ≥ MaxMembers | Deliberate over-subscription of a few committees | **adjust** (committees app; keep the "some at cap" target) |
| Committees By Average Member Engagement | Per committee: avg member EngagementScore | Committee members carry varied engagement | **adjust** (committees + sonar). NB: v1 query references `vwCommitteeMembership` (singular) — likely broken as shipped |
| Active Board Members With Details | Current board roster w/ tenure | 9 positions filled, PositionOrder sort, ElectionDate set | **drop** (no board tables in v2; fold into committees app if needed) |
| Board Position Turnover Analysis | Terms per position in last 5 yrs, actual vs typical term length | Repeat fills + incumbents; term deviations | **drop** |

### 1.3 Certification & CE

| Query | Metric | Implied data pattern/target | v2 |
|---|---|---|---|
| Certification Programs Pass Rates | Per cert type: Active vs Expired/Suspended/Revoked | Both healthy and unhealthy statuses per type; DateEarned spread | **keep** (CertificationRecord) |
| Certification Renewal Performance Analysis | CE-credit gap vs expiry proximity → risk tiers | Certs expiring soon at varying distances; CECreditsEarned sometimes **below** required → all risk tiers populated | **adjust** (credits derive from CECredit rows) |
| Top Members By CE Credits | Σ CreditsEarned per member from CE records | CE activity skewed toward a few leaders | **adjust** (CECredit) |
| Certification Renewal Window Analysis | Days between LastRenewalDate and DateExpires for RenewalCount ≥ N | RenewalCount ≥2 on some certs; plausible renewal windows | **adjust** (RenewalCount on CertificationRecord) — v1 never seeds RenewalCount (§4.7) |
| Certifications Expiring Soon | Active certs with DateExpires in next N days | Future expiry dates seeded relative to "now" | **keep** |
| Certifications Expiring Without Renewal | Expiring certs with NO renewal row (anti-join) | Renewal-pipeline gap: some expiring certs lack renewals, others have them | **adjust** (no CertificationRenewal table; reframe on RenewalCount/status) |
| CE Credits and Renewals by Certification Type | Renewal counts + CECreditsApplied per type | Mixed renewal statuses; credits vary by type | **adjust** |
| Certification Programs By Accrediting Body | Cost/exam/practical stats per accrediting body | Multiple bodies, varied CostUSD, mixed flags | **adjust** (AccreditingBody becomes CHECK value on Certification) |
| Certification Rigor Assessment By Level | Exam/practical flag combos per Level | 5 levels × all 4 flag combos represented | **adjust** (v2 has Level but not exam/practical flags — decide) |
| Common Certification Requirements | Requirement usage across programs | Shared RequirementType values, mixed IsRequired | **drop** (no CertificationRequirement) |
| High Cost Certifications Requiring CE | Cost per renewal-month ranking | CECreditsRequired>0, varied cost/period ratios | **keep/adjust** (ExamFee + RequiredCECredits + ValidYears) |

### 1.4 Learning (courses, enrollments, course certificates)

| Query | Metric | Implied data pattern/target | v2 |
|---|---|---|---|
| Course Completion Rates and Scores | Per course: completion rate, avg FinalScore, pass rate | Rates must **vary by course/difficulty**; scores on completers only | **keep** (CourseEnrollment; CHECKs make score↔status consistent) |
| Course Completion Rates By Category | Enrollment + completion mix per Category | Volume and completion differ by category | **keep** |
| Prerequisite Chain Time Impact On Enrollment | Recursive prereq chains × enrollment outcomes | Real PrerequisiteCourseID chains depth 2–3+; Withdrawn/Failed rows exist | **keep** — v1 never seeds Withdrawn/Failed (§4.3) |
| Course Completion Efficiency and Certification Rate | Days-to-complete + certificate issuance for last 6 mo | Recent completions; cert issuance < 100% | **adjust** (Certificate table gone; reframe on CertificationRecord or drop cert half) |
| Certificates Expiring Within Period | Course certificates expiring in next N days | Future ExpirationDate on course certificates | **drop** (no Certificate table) |

### 1.5 Events

| Query | Metric | Implied data pattern/target | v2 |
|---|---|---|---|
| Event No-Show Rate Analysis | Per completed event: no-show/checked-in/cancelled splits | No-show ratio varies by event type (webinars worst); CheckIn consistent with status | **keep** — v1's check-in is random noise (§4.1) |
| Members With No-Show Event Registrations | Repeat no-show members + missed CEUs | No-shows concentrated on repeat offenders; CEUAwarded=0 on no-shows | **keep** |
| CEU Credits Awarded Summary | Attended + checked-in + CEU-awarded rollup | CEU awarded to a subset of attendees only | **keep** (v2 CHECK: CEU only for Attended) |
| Total CEU Credits By Published Event | Σ session CEUCredits per published event | EventSessions with CEU values exist | **keep** — v1 seeds **zero** EventSession rows (§4.9) |
| Virtual Events With Capacity-Limited Sessions | Sessions of virtual events with Capacity set | IsVirtual + VirtualPlatform + capacity-limited sessions | **keep** (needs session seeding) |

### 1.6 Finance

| Query | Metric | Implied data pattern/target | v2 |
|---|---|---|---|
| Revenue By Line Item Type | Revenue per ItemType on Paid/Partial invoices | Dues vs event vs course revenue skew (dues dominant) | **adjust** (orders/payments BizApps) |
| Overdue Invoices With Balance | Balance>0 + past DueDate, days-overdue spread | Genuinely overdue invoices at varying ages; partial payments enrich | **adjust** — v1 has no partials, overdue only via Cancelled memberships (§4.4) |
| Total Outstanding Invoice Balance | Σ balance for Partial/Sent/Overdue | Non-trivial unpaid population across statuses | **adjust** — v1 never generates 'Partial' |
| Payment Method Failure Analysis | Failed vs completed per PaymentMethod | ~3% failures spread across methods; failure rate should vary by method | **adjust** (payments app) |
| Members With Highest Outstanding Balances | Σ balance per member, overdue/current split | Unpaid invoices concentrated on some members; due dates straddle today | **adjust** |
| Average Invoice Total By Organization | Invoice totals rolled to organization | Members→orgs→invoices linkage; totals vary by org | **adjust** |

### 1.7 Marketing & email

| Query | Metric | Implied data pattern/target | v2 |
|---|---|---|---|
| Campaign Conversion Rates and ROI | Converted/targeted + (value−cost)/cost per completed campaign | CampaignMembers with Converted status, ConversionValue + ActualCost → winners and losers | **drop/adjust** — no CampaignMember in v2 (and v1 never seeds it, §4.8); conversion story must be re-designed via EmailSend→Order attribution |
| Campaign Opt-Outs By Type | Opted-Out members per CampaignType | Opt-out rows across campaign types | **drop/adjust** (UnsubscribedAt on EmailSend replaces it) |
| Email Engagement Rate By Campaign Type | sent→delivered→opened→clicked funnel per type | Realistic funnel with per-type variance | **keep** (EmailSend) |
| Campaign ROI By Delivery Success | ActualCost ÷ delivered emails | Cost-per-delivery varies by campaign | **adjust** (Budget/cost fields TBD in v2 Campaign) |
| Campaign Conversion Rates By Segment | Conversions + value per segment | Per-segment conversion variance | **drop/adjust** (no CampaignMember) |
| Conversion Value By Active Segment | Σ/avg ConversionValue per segment | Value skew across segments | **drop/adjust** |
| Email Template Performance Analysis | Open rate per template (≥ minSends) | Open rate must vary by template (renewal ≠ newsletter) | **keep** |
| Email Negative Response Rate | Unsubscribes + spam reports in last 30 days | Small non-zero UnsubscribedDate/SpamReportedDate population | **keep** (UnsubscribedAt) — v1 never seeds either (§4.8) |
| Email Engagement Funnel Metrics | Windowed one-row funnel + click events | Consistent stage timestamps; click rows joinable | **keep** (funnel CHECKs) |
| Email Template Click Performance Analysis | Clicks per template × URL/LinkName | Repeated URLs, hot links per template | **drop** (no EmailClick table; single ClickedAt) |

### 1.8 Community / forum

| Query | Metric | Implied data pattern/target | v2 |
|---|---|---|---|
| Forum Category Engagement Analysis | Parent vs subcategory thread/post counts | Real category hierarchy; denormalized counters populated | **adjust** (v2 drops denormalized counters — compute) |
| Most Popular Forum Threads Recent | Weighted ViewCount + 3×ReplyCount, recent window | Recent activity + skewed view/reply counts | **adjust** (ViewCount gone in v2; reframe on posts/reactions) |
| Most Active Forum Threads | Top 10 by replies+views, last 30 days | Recent hot threads | **adjust** |
| Members With Highest Accepted Answer Rates | Accepted answers ÷ posts per author | Accepted-answer *rates* vary (not all-or-nothing) | **adjust** (IsAcceptedAnswer not in v2 ForumPost — decide; likely add) |
| Most Helpful Forum Members | Count of accepted answers per member | Identifiable expert members | **adjust** (same) |
| Top Forum Posts By Engagement | LikeCount + HelpfulCount ranking | A few viral posts (skew) | **adjust** (counts → ForumReaction rows) |
| Reaction Types on Accepted Answer Posts | Reactions by type on accepted answers | Reactions concentrated on good answers | **keep/adjust** (ForumReaction) |
| Forum Posts With Most Attachments | Attachment count/size/downloads per post | Some posts with multiple attachments | **drop** (PostAttachment killed) |
| Member Storage Usage by Attachments | Σ FileSizeBytes per uploader | Upload skew | **drop** |
| Most Popular Forum Tags | Tag frequency | Power-law tag distribution | **drop** (PostTag killed) |
| Thread Engagement Depth Analysis | Recursive reply-depth of accepted/helpful posts | Reply trees of depth 0/1/2+ | **keep** (ReplyToPostID) — v1 trees exist but chronology is inverted (§4.5) |
| Forum Reply Depth Analysis With Active Members | Avg/max reply depth + per-member nested-reply counts | Deep chains; members posting repeatedly at depth | **keep** |
| Most Flagged Forum Posts | Repeat-flagged posts + reasons | Multiple reports on the same posts | **drop** (ForumModeration killed) |
| Moderation Outcomes By Action | Resolved moderations by Action (Removed/Dismissed) | Resolved cases across actions | **drop** — also degenerate in v1: seeded Action values never include 'Removed'/'Dismissed' (§4.10) |

### 1.9 Resource library

| Query | Metric | Implied data pattern/target | v2 |
|---|---|---|---|
| Resource Categories By Average Rating | Weighted vs simple avg rating per category | Rating volume × quality varies by category | **drop** (ResourceRating killed) |
| Resource Engagement by Access Type | Downloads/views by RequiresMembership flag | Gated vs open content behaves differently | **adjust** (flag not in v2 Resource — decide) |
| Resources With Multiple Versions | Version count + current-version info | Some resources with 2–3 versions, one IsCurrent | **drop** (ResourceVersion killed) |
| Resource Version File Size Comparison | File sizes: current vs old versions | Sizes grow across versions | **drop** |
| Resources By Download-to-View Ratio | Download/view conversion per resource | Varied conversion ratios | **adjust** (ViewCount not stored in v2; downloads only) |
| Featured Resource Download Trends And Top Members | Monthly featured-resource downloads + top downloaders | Multi-month time series + heavy-user skew | **keep/adjust** (ResourceDownload; IsFeatured flag TBD) |
| Top Rated Resources With Review Counts | Top N by AverageRating with rating floor | Near-tie high ratings + volume | **drop** |
| Resource Ratings by Category | 1–5 star distribution + text reviews | Full star scale exercised — v1 has no 1–2★ (§4.11) | **drop** |
| Most Popular Resource Tags | Tag frequency across published resources | Shared tag vocabulary, skewed | **drop** (ResourceTag killed) |
| Most Engaging Resources With Tags | Composite downloads + rating×count score | Both terms populated so neither dominates | **drop** |

### 1.10 Product showcase & competitions

| Query | Metric | Implied data pattern/target | v2 |
|---|---|---|---|
| Award-Winning Products By Category | Award winners + Σ AwardCount per category | Winners spread across categories | **adjust** (AwardCount derives from Award) |
| Organic vs Non-Organic Cheese Pricing by Type | Price stats per CheeseType × organic | Both sides populated per type; organic premium visible | **keep** |
| Organic vs Non-Organic Cheese Performance | Scores/rankings/award ladder, organic vs not | Score + ranking + full award ladder on both sides; a performance gap tells the story | **keep/adjust** (scores → JudgeScore) |
| Top Award-Winning Products By Level | Per product: BiS/Gold/Silver/Bronze counts | Repeat winners across tiers | **adjust** (Award/Medal) |
| Average Retail Price by Organic Status | Price of award winners, organic vs not | Winners exist on both sides with prices | **keep** |
| Average Retail Price By Cheese Type And Organic Status | Price stats + DateIntroduced window | DateIntroduced populated; some missing prices | **keep** |
| Competition Participation Metrics | Entries, fees, paid/unpaid, submit-date range per competition | Fee + date spread; ~5% unpaid | **keep** |
| Award Distribution By Product Category | % of entries at each award level per category, incl. No Award | Realistic award **pyramid** — most entries win nothing | **keep/adjust** |
| Competition Entry Metrics by Scope | Int'l vs domestic: fees + entry volumes | Both scopes in the target year; int'l pricier/bigger | **adjust** (IsInternational not in v2 Competition — decide) |
| Products With Most Gold Awards | Repeat gold winners (≥ N golds) | Multiple golds on the same products | **adjust** |
| Average Judging Scores By Competition | Score stats per competition | Score distributions differ by competition (harsh vs lenient juries) | **adjust** (JudgeScore, 4 subscores) |
| Products With Most Competition Awards | Awards via entry→award join per product | Awards linked through CompetitionEntryID | **keep/adjust** (v2 Award is entry-keyed — cleaner) |
| Competition Scoring By Award Level | Score stats: Gold vs Silver/Bronze | **Gold must score higher than Silver/Bronze** — v1 scores are independent of medal (§4.12) | **keep/adjust** — this is the flagship "consistency" query |
| Top Members By Total Awards Won | Σ AwardCount per owning member | Award skew across producers | **adjust** (Product now owned by Organization, not Member) |

### 1.11 Legislative & advocacy

| Query | Metric | Implied data pattern/target | v2 |
|---|---|---|---|
| Legislative Issues By Member Engagement | Actions + unique members per issue | Hot-button issues with many distinct members | **keep** |
| Advocacy Follow-Up Response Time | ActionDate→FollowUpDate gaps, bucketed | FollowUpRequired + FollowUpDate populated across all buckets | **drop** — v2 AdvocacyAction has no follow-up fields (and v1 never seeds them, §4.13) |
| Critical/High Impact Issues with Oppose Position | Critical issues the association formally opposes | Public 'Oppose' positions on Critical/High issues | **keep** (LegislativePosition) |
| Active Issues By Impact Level | Issues per ImpactLevel + position coverage | All 5 impact levels; only a subset has positions | **keep** |
| Top Legislative Issues By Recent Comments | Regulatory comments per issue, last 6 mo | Comment clusters on a few issues | **drop** (RegulatoryComment killed; v1 seeds exactly 1 row anyway) |
| Regulatory Comments By Status | Draft vs Submitted counts | In-progress comment pipeline | **drop** |
| Critical Active Issues By State | Critical issues + state-level body detail | State bodies with BillNumber/dates/URL populated | **keep** |
| Issue Volume and Timeline by Type | Introduced→LastAction days per IssueType (federal) | Both dates populated; timelines vary by type | **keep/adjust** (LastActionDate TBD in v2) |
| Most Contacted Government Officials | Actions per contact | Repeat-target officials | **keep** |
| Active Government Contacts By State And Body Type | Contact counts by state × body type | Contacts spread across states/body types | **keep/adjust** (State on body) |
| Most Contacted Officials By Action Type | Per contact × ActionType breakdown | Same official contacted via multiple channels | **keep** |
| Advocacy Actions Requiring Follow-Up | Follow-ups due in next 30 days | Future-dated FollowUpDate rows | **drop** (no follow-up fields) |
| Member Advocacy Actions This Year | Actions per member, current year | Skew toward highly-active advocates | **keep** |
| Advocacy Actions By Type With Follow-Up Rates | Follow-up fraction per ActionType | Varying follow-up rates by type | **drop** (follow-up half) / keep the by-type volume half |

### 1.12 Cross-cutting requirements the queries impose (independent of any one row)

1. **"Now"-relative windows everywhere** (~25 queries): last 30 days / 6 mo / 12 mo / 5 yrs AND next 30 / 90 days / 6 mo. Data must have both deep history (5 yrs) and **future-dated** rows (expirations, due dates, upcoming events).
2. **Full status-vocabulary exercise**: every CHECK value list must appear in data, in non-degenerate proportions.
3. **Three self-referencing hierarchies**: ForumPost reply trees (depth ≥2), Course prerequisite chains (depth ≥2), ForumCategory parent/child.
4. **Denormalized counters must reconcile with detail rows** (v1 fails this — §4.11); v2's answer is to not store them.
5. **Group-level variance is the product**: nearly every query GROUP BYs a dimension and is only interesting if the metric *varies* across groups. Independent uniform draws (v1's method) produce flat cross-tabs; v2's propensity model exists precisely to fix this.

---

## Section 2 — Chosen distributions in v1 seed data (per entity, exact numbers)

Anchor: `@EndDate = GETDATE()`, `@StartDate = 5 years back` (`00_parameters.sql:16-17`). All dates are offsets from "today" — the evergreen trick v2 keeps.

### 2.1 Membership (`01_membership_data.sql`)
| Choice | Value | Ref |
|---|---|---|
| Membership types | 8 (Individual $295, Student $95, Corporate $2,500, Lifetime $5,000 one-time, Retired $150, EarlyCareer $195, International $350, Honorary $0) | 01:22-31 |
| Organizations | 200 total: 10 real tech + 5 finance/health + 3 consulting + 22 fictional tech + **160 cheese** (25 producers, 30 dairy farms, 25 distributors, 40 retailers, 40 suppliers/services) | 01:39-… |
| Members | 2,000 (15 hand-authored "key members" + 1,985 generated) | 01:423 |
| Member↔org attach rate | **85%** have OrganizationID (`% 100) < 85`) | 01:466 |
| Org member-weights by size | EmployeeCount >200→20, >100→10, >50→7, >20→3, else 2 | 01:405-416 |
| Join dates | Uniform over past 1,825 days (5 yrs) | 01:479 |
| Membership type mix (intended) | 60% Individual / 10% Student / 15% Corporate / 10% EarlyCareer / 3% Retired / 2% International | 01:526-533 |
| Membership type mix (**actual**, due to independent-draw CASE) | ≈60% / 28% / 10% / 1.2% / … — each WHEN re-rolls, so probabilities compound (see §4.14) | 01:541-548 |
| Status mix (intended) | 80% Active / 15% Lapsed / 5% Cancelled | 01:524 |
| Status mix (**actual**) | ≈80% Active / 19% Lapsed / 1% Cancelled (independent draws) | 01:549-553 |
| EndDate rule | 80%: JoinDate+1yr; 20%: JoinDate+6mo — **independent of Status** (bug §4.1a) | 01:555-558 |
| AutoRenew | 70% | 01:560 |
| Renewal history | key members: 3–5 rows each (17 rows); + TOP 125 extra prior-year rows for random Active members ("25%" per comment — actually 125/2000 ≈ 6%) | 01:493-579 |
| Total memberships | 17 + 1,995 + 125 = **2,137** (header claims 2,500) | 01:9 |
| Never seeded | EngagementScore (defaults 0), LastActivityDate, CancellationDate, CancellationReason | schema V002:90-111 |

### 2.2 Events (`02_events_data.sql`)
| Choice | Value | Ref |
|---|---|---|
| Events | 21: 3 ICF Annual Meetings (3rd Sunday of April, yr−1/yr/yr+1) + 6 symposiums + 4 joint conferences + 8 webinars | 02:6-12 |
| Annual meeting YoY arc | 2024: 950 regs (1,000 cap) → 2025: 1,050 (1,100 cap, **+10.5% growth**) → 2026: 400 so far (registration open) | 02:373 |
| Repeat-attendee design | 2025 = 70% repeats of 2024 attendees (735) + 30% new (315) | 02:408,434-443 |
| Registration lead time | uniform 0–60 days before event (2026: 0–30 days) | 02:381,463 |
| Early Bird rate | 2024: 35%, 2025: 40%, 2026: 60% | 02:382,415,464 |
| Status mix, annual mtgs | 2024: 4% No Show / 3% Registered / 93% Attended; 2025: 3% / 3% / 94% | 02:383-392,416-423 |
| Status mix by event type | Conference: 3% NS / 2% Reg / 95% Att; Workshop: 2% / 2% / 96%; **Webinar: 10% NS / 5% Reg / 85% Att** | 02:489-517 |
| CheckInTime | set for 90% (2024) / 92% (2025) / 85% (other completed) — **independent of Status** (bug §4.1) | 02:393-398,519-523 |
| CEUAwarded | =1 for 90%/92%/85% — independent of Status AND CheckIn (bug §4.1) | 02:398,430,524-527 |
| Fill rates by event status | Completed: 75–90% of capacity; Registration Open: 35–50%; Published: 20–35% (`0.75 + (CHECKSUM % 16)/100` etc.) | 02:531-541 |
| EventSessions | **none seeded** (schema exists) | §4.9 |

### 2.3 Learning (`03_learning_data.sql`)
| Choice | Value | Ref |
|---|---|---|
| Courses | 60 across 7 categories (Cheesemaking 8, Food Safety 10, Dairy Science 10, Production 8, Leadership 10, Marketing 8, Business 6); levels Beginner/Intermediate/Advanced; price $299–$999 (member $199–$749); 16–48 hrs; CEU 4–14 | 03:19-93 |
| Enrollments | TOP 900 random member×course; enrollment date uniform last 500 days | 03:107-111 |
| Status mix (intended) | 72% Completed / 18% In Progress / 10% Enrolled | 03:117-121 |
| Status mix (**actual**) | ≈72% / 25% / 3% (independent draws) | — |
| Completion artifacts | CompletionDate (72% draw), ProgressPercentage (100 vs 30–95 vs 0–25), FinalScore 70–100 (72% draw), Passed (72% draw) — **all five draws independent** (bug §4.3) | 03:113-133 |
| Certificates | issued where Completed ∧ Passed=1 ∧ CompletionDate NOT NULL → intersection of independent 72% draws ≈ **0.72³ ≈ 37% ≈ 335** (header claims 650) | 03:148-162 |
| Certificate expiry | +3 yrs for Food Safety & Cheesemaking categories, else NULL | 03:154-157 |

### 2.4 Finance (`04_finance_data.sql`)
| Choice | Value | Ref |
|---|---|---|
| Invoice sources | 1 per membership (dues) + 1 per event registration with MemberPrice>0 + 1 per enrollment ≈ **2,137 + ~4,500 + 900 ≈ 7,500 invoices** | 04:25-95 |
| Tax | flat 8% everywhere | 04:33 |
| Payment terms | dues: +30 days; events: +14 days; courses: +30 days | 04:31,61,81 |
| Paid/Balance rule (dues) | Active/Lapsed → Paid in full, Balance 0; Cancelled → AmountPaid 0, Balance full, Status **'Overdue'**; 'Pending'→'Sent' (Pending never occurs) | 04:35-48 |
| Paid/Balance rule (events) | Status≠'Cancelled' → Paid; Cancelled → Balance full (but reg status 'Cancelled' never generated → all Paid) | 04:65-67 |
| Paid/Balance rule (courses) | Completed/In Progress → Paid; Withdrawn → Cancelled (never occurs); Enrolled → 'Sent' with full balance | 04:85-91 |
| **No partial payments anywhere** — Balance ∈ {0, Total} | — | §4.4 |
| Payment timing | within 0–20 days of invoice; ProcessedDate = +5 min | 04:174,188 |
| Payment methods | 40% Credit Card / 20% ACH / 20% PayPal / 20% Stripe | 04:176-182 |
| Payment status | **97% Completed / 3% Failed** — but invoice already marked Paid regardless (bug §4.4) | 04:184-187 |

### 2.5 Marketing & email (`05_marketing_email_data.sql`)
| Choice | Value | Ref |
|---|---|---|
| Segments | 10 seeded (header claims 80); MemberCount all 0 | 05:18-29 |
| Campaigns | 5 seeded (header claims 45); budgets $8k–$35k; 1 Active, 4 Completed; **ActualCost never set** | 05:37-48 |
| CampaignMembers | **none seeded** — all conversion/opt-out queries empty | §4.8 |
| Email templates | 5 seeded (header claims 30) | 05:56-67 |
| Send volumes per template | Newsletter 500, Welcome 100, Renewal 300 (×2 templates), other 200 → **1,400 sends total**, spread uniform over last 365 days | 05:89-103 |
| Funnel rates (intended) | 97% delivered; 25% opened; 5% clicked; OpenCount 1–3; ClickCount 1–2 | 05:104-123 |
| Funnel (**actual**) | each timestamp/status/count an independent draw → Status='Clicked' ∧ ClickedDate set ≈ 0.05×0.05 = **0.25% ≈ 3–4 EmailClick rows total** (bug §4.8) | — |
| Click URLs | 3 URLs/link names uniform | 05:141-150 |
| Never seeded | UnsubscribedDate, SpamReportedDate | §4.8 |

### 2.6 Chapters & governance (`06_chapters_governance_data.sql`)
| Choice | Value | Ref |
|---|---|---|
| Chapters | 15 (10 geographic + 5 special interest); founded 2–12 yrs ago; all active | 06:18-49 |
| Chapter memberships | 30–50 per chapter (`30 + CHECKSUM(c.ID)%21`) ≈ 600 rows; join uniform last 5 yrs; **97% Active / 3% Inactive** | 06:58-76 |
| Chapter officers | exactly 3 per chapter (President/VP/Secretary) = 45; **StartDate = chapter FoundedDate, no EndDate, all active** → zero turnover | 06:80-98 |
| Committees | 12 (8 standing, 4 ad hoc/task force); MaxMembers 5–10 | 06:106-119 |
| Committee memberships | 5–8 per committee (Chair/Vice Chair/Member), all IsActive, StartDate = FormedDate | 06:128-145 |
| Board | 9 positions (4 officers, term 2 yrs; 5 directors, term 3 yrs) × 3 terms = 27 BoardMember rows; current term active, 2 historical | 06:153-200 |

### 2.7 Community forum (`07_community_forum_data.sql`)
| Choice | Value | Ref |
|---|---|---|
| Categories | 7 top-level + 6 subcategories | 07:24-49 |
| Threads | 48 hand-titled; created uniform last 180 days; ViewCount uniform 10–509; 3 pinned | 07:60-122 |
| Author pools | 20 thread authors, 30 post authors (deliberate concentration) | 07:57-58,136 |
| Posts | ~48 originals + ~48 first replies (most `IsAcceptedAnswer=1`, else 10%) + 50 second replies + 25 nested (depth-2) replies ≈ **170–200 posts** | 07:180-285 |
| Like/Helpful counts | originals 5–24 / 2–11; replies 3–17 / 1–12; nested 1–8 / 0–3 (uniform) | 07:189-280 |
| Reactions | 300 (40% Like, 20% Helpful, 20% Thanks, 20% Bookmark) | 07:291-306 |
| Post tags | 100 across 15 tag names | 07:312-336 |
| Member follows | 100 (40 thread + 30 category + 30 member); 67% notify | 07:340-380 |
| Attachments | 25, on root posts only; 10KB–5MB; 0–49 downloads | 07:389-411 |
| Moderations | 10; ModerationStatus ⅓ Approved / ⅓ Dismissed / ⅓ Reviewing; Action ∈ {No action, Post edited, Warning sent} | 07:417-441 |
| Counter reconciliation | ReplyCount/LastActivityDate/category counters **recomputed correctly** post-hoc via UPDATE | 07:447-462 |
| Reply chronology | replies dated **before** their parents (bug §4.5) | 07:213,239,255,278 |

### 2.8 Resource library (`08_resource_library_data.sql`) — fully hand-curated
| Choice | Value | Ref |
|---|---|---|
| Categories | 15 (with parent/child) | print block |
| Resources | 100; ViewCount ~150–600, DownloadCount ~50–300, AverageRating 3.9–4.9, RatingCount 5–20 — all hand-typed denormalized values | 08:94-227 |
| Versions | 51 rows; 8–10 resources have 2–3 versions each, one IsCurrent | 08:229-… |
| Downloads | 200, deliberately skewed: 50/40/35/30/25/20 across 6 hero resources; recency tiers 60/45/30/15/25/20 days | 08:302-346 |
| Ratings | 75; distribution ≈ 70% five-star, 27% four-star, **one 3★, zero 1–2★** | 08:352-… |
| Tags | ~150 across ~40 tag names, 3–5 per resource | 08:tail |
| Inconsistency | denormalized RatingCount/DownloadCount ≫ actual child rows (e.g. DownloadCount 156 vs ≤50 rows) | §4.11 |

### 2.9 Certification (`09_certification_data.sql`)
| Choice | Value | Ref |
|---|---|---|
| Accrediting bodies | ~8; certification types ~12, Levels Entry→Master, CostUSD populated | 09:26-167 |
| Certifications | **413 total**: CCP 50, Wisconsin Master 5, Certified Cheesemaker 60, Food Safety Mgr 80, HACCP 35, Grader 25, Affineur 15, Dairy Science 30, Processing Tech 40, Advanced Techniques 20, Cheesemonger 35, Milk Quality 18 | 09:322-560 |
| Status mixes (intended per type) | Active 80–90%, Pending Renewal 8–15%, Expired 3–12% (varies by insert; some types have no Expired) | 09:332,379,398,417,… |
| DateEarned | uniform 0–24/36/60 months back (by type) | 09:330 |
| DateExpires | `@EndDate + (validity − rand(validity))` → **always in the future, independent of DateEarned and of Status** (bug §4.7) | 09:331 |
| Scores | uniform bands per type: 75–100 (CCP), 92–100 (WMC), 76–100 … | 09:335 |
| CECreditsEarned | uniform 0–13…0–34 by type — independent of required credits | 09:340 |
| LastRenewalDate | only on CCP inserts, 50% of rows; RenewalCount **never seeded** | 09:324,336-338 |
| CE records | TOP 85, only for Active certs; 1–8 credits, 2–17 hrs, all 'Approved'; completion last 730 days | 09:571-625 |
| Renewals | TOP 60 'Completed' where LastRenewalDate set ∧ Active (pool ≈ 21 rows → far fewer than 60); fee = 75% of cert cost | 09:630-648 |

### 2.10 Product showcase (`10_product_showcase_data.sql`)
| Choice | Value | Ref |
|---|---|---|
| Products | 110 (Fresh 20, Soft-Ripened 25, Semi-Hard 30, Hard 20, Blue 15); owned by random members-with-orgs | 10:144-370 |
| IsOrganic | 15–30% by category; IsRawMilk 15–30% (aged categories); ~95% Active / 5% Seasonal | 10:178-369 |
| Prices | $8.99–$45 by category band (uniform within) | 10:177 |
| Competitions | 5 (ACS, World Championship, International Awards, Good Food, US Championship) | 10:79 |
| Entries | 200; per-entry competition uniform ⅕ each; submitted 30–210 days back | 10:392-405 |
| Entry Status | 15% Winner / ~13% Finalist / rest Judged (independent draws) | 10:406-409 |
| Score | uniform 70–99.9 — **independent of award level** (bug §4.12) | 10:411 |
| Ranking | 30% get rank 1–10, independent of everything | 10:412-414 |
| AwardLevel | 2% Best in Show; else nested %10: 20% Gold / 20% Silver / 10% Bronze / 10% Honorable Mention / 40% None → ≈ **51% of entries medal** (a generous pyramid) | 10:415-428 |
| Entry fees | {95, 125, 175, 225, 295} uniform | 10:429-434 |
| PaymentStatus | 95% Paid / 5% Unpaid | 10:435 |
| Judges | 50 | 10:456 |
| ProductAwards | 1 per medal entry (BiS/Gold/Silver/Bronze) ≈ 104; AwardCount + IsAwardWinner **recomputed correctly** post-hoc | 10:522-560 |

### 2.11 Legislative (`11_legislative_tracking_data.sql`) — hand-curated
| Choice | Value | Ref |
|---|---|---|
| Bodies | 10 (federal/state/agency) | 11:30 |
| Issues | ~13, all impact levels, real-ish bill numbers | 11:71 |
| Policy positions | 7 (2 Oppose, 3 Support, 2 Support-with-Amendments; priorities Critical/High/Medium; all public) | 11:173-222 |
| Government contacts | 10 | 11:228 |
| Advocacy actions | TOP 150; uniform over 6 issues × 10 contacts × 6 action types (Email/Phone/Letter/Meeting/Social/Testimony); ActionDate last 90 days; 5 outcome flavors | 11:297-355 |
| Regulatory comments | **exactly 1** ('Submitted') | 11:363-374 |
| Never seeded | FollowUpRequired / FollowUpDate on AdvocacyAction | §4.13 |

---

## Section 3 — Scaling-law seeds (per-member ratios)

Base: **2,000 members**, 200 orgs, 5-year history window. "Per member per year" divides by 5 where activity spans the full window, by 1 where the script only generates ~1 year (emails) or ~6 months (forum).

| Metric | v1 absolute | Per member | Per member / yr | Note |
|---|---|---|---|---|
| Memberships (period rows) | 2,137 | 1.07 | — | renewal unroll barely exercised (6% get a 2nd row) |
| Organizations | 200 | 0.1 (10 members/org avg) | — | weights 2–20 by org size |
| Event registrations | ≈ 950+1,050+400 + ~18 events × 75–90% cap ≈ **4,000–4,500** | ≈ 2.1 | ≈ 1.0–1.1 | annual meeting alone = ~50% of all members attend |
| Events held | 21 over ~3 yrs visible | — | ~7–10 events/yr | |
| Course enrollments | 900 | 0.45 | ~0.33 (500-day window) | |
| Course certificates | ~335 | 0.17 | — | |
| Certifications | 413 | 0.21 | — | ~1 in 5 members certified |
| CE activity records | 85 | 0.04 | — | far too thin vs 413 certs (0.2 CE rows per cert) |
| Certification renewals | ≤21 | 0.01 | — | |
| Invoices | ~7,500 | 3.7 | ~0.75–3.7 | dues + events + courses |
| Payments | ~7,100 | 3.5 | — | 97% completed |
| Email sends | 1,400 | **0.7** | 0.7 | absurdly low — a real association sends 50–200/member/yr |
| Email clicks | ~3 | 0.002 | — | degenerate (independent-draw bug) |
| Forum threads | 48 | 0.024 | — | 20 authors → 2.4 threads/author |
| Forum posts | ~190 | 0.095 | — | 30 authors → ~6 posts/author (deliberate concentration) |
| Post reactions | 300 | 0.15 | — | |
| Chapter memberships | ~600 | 0.30 | — | 30–50/chapter |
| Committee seats | ~78 | 0.04 | — | |
| Board seats (ever) | 27 | 0.014 | — | |
| Resources / downloads / ratings | 100 / 200 / 75 | 0.05 / 0.10 / 0.04 | — | downloads skewed 6-hero |
| Products | 110 | 0.055 | — | v2 reassigns to orgs: ≈0.55 products/org |
| Competition entries | 200 | — | 1.8 per product | |
| Product awards | ~104 | — | ~0.95 per product / 0.52 per entry | award rate far too generous |
| Advocacy actions | 150 | 0.075 | 0.075 (90-day window ⇒ 0.3 annualized) | |

**Takeaways for v2 scaling laws:** v1's high-volume tables are *events* and *finance* (~4.5k and ~7.5k rows); everything else is 10²-scale garnish. The comment-vs-actual gaps (2,500→2,137 memberships, 650→335 certificates, 80→10 segments, 45→5 campaigns, 30→5 templates) show v1's stated targets were never reconciled with output. v2's keyset-pagination star tables (EmailSend, ResourceDownload, ForumPost) need 10⁴–10⁵ scale, i.e. **email ≈ 50–100/member/yr, downloads ≈ 5–20/member/yr, posts concentrated on a 5–10% active-poster subpopulation** — all far above v1.

---

## Section 4 — Bug inventory (what v2 must make unrepresentable)

### 4.1 No-Show / CheckIn / CEU independence (the flagship bug)
`02_events_data.sql:383-398` — Status, CheckInTime, and CEUAwarded are three **independent** random draws:
```sql
CASE ABS(CHECKSUM(NEWID()) % 100)
    WHEN 0 THEN 'No Show' ... ELSE 'Attended' END,          -- draw 1: status
CASE WHEN ABS(CHECKSUM(NEWID()) % 100) < 90
    THEN DATEADD(MINUTE, 480 + ..., @ThirdSunday2024) ELSE NULL END,  -- draw 2: check-in
CASE WHEN ABS(CHECKSUM(NEWID()) % 100) < 90 THEN 1 ELSE 0 END        -- draw 3: CEU
```
→ ~90% of 'No Show' rows **have a CheckInTime**, ~90% get **CEUAwarded=1**; ~10% of 'Attended' rows have neither. Every no-show/CEU query returns internally contradictory data. v2 fix: the EventRegistration CHECKs already drafted (`Attended ⟺ CheckInAt NOT NULL`, `CEU ⟹ Attended`).

### 4.1a Active membership with past EndDate (the renewal-rate poison)
`01_membership_data.sql:549-558` — Status and EndDate are independent draws, **and** the "future" EndDate is JoinDate-relative:
```sql
CASE WHEN ABS(CHECKSUM(NEWID()) % 100) < 80 THEN 'Active' ... END,   -- draw 1
m.JoinDate,
CASE WHEN ABS(CHECKSUM(NEWID()) % 100) < 80
     THEN DATEADD(YEAR, 1, m.JoinDate)   -- "Active: future end date"  ← comment is wrong
     ELSE DATEADD(MONTH, 6, m.JoinDate) END
```
JoinDate is uniform over the past 5 years, so JoinDate+1yr is in the **past for ~80% of members**. Net: the vast majority of 'Active' memberships have EndDate < today (and the 125 renewal-history rows are also Status='Active' with past EndDate by design). Status is meaningless relative to the interval. v2 fix: **status computed from the interval + release date** (MembershipPeriod design), plus the cancelled⟺date CHECKs.

### 4.2 Cancelled without CancellationDate/Reason
`01_membership_data.sql` inserts never include CancellationDate/CancellationReason (columns exist, V002:110-111). The cancellation-reasons query degenerates to a single 'No Reason Provided' bucket. v2 CHECK already drafted: `Status <> 'Cancelled' OR CancellationDate IS NOT NULL` (+ converse).

### 4.3 Enrollment field independence (Completed without CompletionDate, scores on non-completers)
`03_learning_data.sql:113-133` — five separate `RAND(CHECKSUM(NEWID())) < 0.72` draws for CompletionDate, Status, ProgressPercentage, FinalScore, Passed:
```sql
CASE WHEN RAND(CHECKSUM(NEWID())) < 0.72 THEN DATEADD(...) END,   -- CompletionDate
CASE WHEN RAND(CHECKSUM(NEWID())) < 0.72 THEN 'Completed' ... END, -- Status
...
CASE WHEN RAND(CHECKSUM(NEWID())) < 0.72 THEN 70 + (RAND(...)*30) END, -- FinalScore
CASE WHEN RAND(CHECKSUM(NEWID())) < 0.72 THEN 1 ELSE 0 END        -- Passed
```
→ ~28% of 'Completed' rows have NULL CompletionDate; 'Enrolled' rows carry FinalScore and Passed=1; certificates only materialize on the ≈37% triple-intersection. Also: CompletionDate can precede StartDate (independent uniform offsets 0–400 vs 0–480 days). v2 CHECKs already drafted on CourseEnrollment.

### 4.4 Balance arithmetic & failed-payments-still-paid
`04_finance_data.sql:184-190` — payment status is drawn **after** the invoice was already marked Paid/Balance=0:
```sql
CASE WHEN RAND(CHECKSUM(NEWID())) < 0.97 THEN 'Completed' ELSE 'Failed' END
...
FROM [AssociationDemo].[Invoice] i WHERE i.Status = 'Paid';
```
→ ~3% of invoices have a *Failed* payment yet AmountPaid=Total, Balance=0, Status='Paid'. Additionally: Balance is only ever 0 or full ('Partial' never occurs); 'Overdue' arises only from the ~1% Cancelled memberships; failed payments still get ProcessedDate. v2 fix: money moves to orders/payments apps which own the arithmetic (`Invoice.AmountPaid/Balance` explicitly not stored per §2.10 of the proposal); accounting-identity repair rules.

### 4.5 Forum replies posted before their parents
`07_community_forum_data.sql:213` (and :239, :255, :278) — reply timestamps are the parent's date **minus** hours:
```sql
DATEADD(HOUR, -ABS(CHECKSUM(NEWID()) % 48),
    (SELECT PostedDate FROM ForumPost p WHERE p.ThreadID = t.ThreadID AND p.ParentPostID IS NULL)),
```
→ every reply predates the post it answers; thread LastActivityDate ends up ≤ original post date. v2 fix: audit rule "reply PostedAt ≥ parent PostedAt; post ≥ thread CreatedAt" (already in the forums schema notes).

### 4.6 Zero officer/board churn where turnover queries expect it
`06_chapters_governance_data.sql:80-98` — all 45 chapter officers get `StartDate = c.FoundedDate` (2–12 years ago), `IsActive=1`, no EndDate. The officer-turnover query (last 12 months) returns nothing. Board terms are mechanically 3 back-to-back terms with identical dates per position — turnover analysis is flat by construction. Also `06:190-200`: the `NOT EXISTS` guard against member reuse across a position's terms is evaluated against the pre-statement (empty) table, so it never constrains anything.

### 4.7 Expired certifications with future expiry dates; RenewalCount never set
`09_certification_data.sql:330-334`:
```sql
DATEADD(MONTH, -ABS(CHECKSUM(NEWID())) % 24, @EndDate),         -- DateEarned
DATEADD(MONTH, 24 - (ABS(CHECKSUM(NEWID())) % 24), @EndDate),   -- DateExpires: ALWAYS future
CASE WHEN (ABS(CHECKSUM(NEWID())) % 100) < 85 THEN 'Active'
     WHEN ... 'Pending Renewal' ELSE 'Expired' END               -- independent draw
```
→ every 'Expired' cert has DateExpires in the future; DateExpires is unrelated to DateEarned (windows can exceed program validity or be days long). CECreditsEarned uniform-random, uncorrelated with the type's CECreditsRequired. RenewalCount never inserted → renewal-window query (RenewalCount ≥ N) empty. v2 fix: `ExpiresAt > EarnedAt` CHECK + status computed from interval; credits derived from CECredit rows.

### 4.8 Marketing: entire query families with zero rows
`05_marketing_email_data.sql` never inserts **CampaignMembers** (conversion, ROI, opt-out, segment-conversion queries all empty), never sets **Campaign.ActualCost**, never sets **UnsubscribedDate/SpamReportedDate** (negative-response query empty). And the funnel fields are independent draws — `Status='Clicked'` co-occurs with `ClickedDate NOT NULL` only 0.25% of the time:
```sql
CASE WHEN RAND(CHECKSUM(NEWID())) < 0.05 THEN DATEADD(...) END,  -- ClickedDate: draw A
CASE WHEN RAND(CHECKSUM(NEWID())) < 0.05 THEN 'Clicked' ... END  -- Status: draw B (independent)
```
→ ~3 EmailClick rows in the whole database; OpenedDate set on 'Bounced' rows; DeliveredDate NULL on 'Opened' rows. v2 fix: funnel monotonicity CHECKs on EmailSend (`ClickedAt ⟹ OpenedAt`, ordered timestamps).

### 4.9 EventSessions never seeded
Schema V001/V002 defines EventSession; no data file inserts any. Both session-based queries (`total-ceu-credits-by-published-event`, `virtual-events-with-capacity-limited-sessions`) return empty. v2 events schema makes sessions first-class (Track/Session/Speaker) — seed them.

### 4.10 Moderation vocabulary mismatch
`07:435-441` seeds `Action ∈ {'No action required','Post edited by author','Warning sent to member'}` and `ModerationStatus ∈ {'Approved','Dismissed','Reviewing'}`, but the golden query filters `Action IN ('Removed','Dismissed')` — guaranteed zero 'Removed'. Also ModeratedByID and ModeratedDate are independent ⅔ draws (dates without moderators and vice versa). Table is dropped in v2; the lesson (query vocab must come from the CHECK list) generalizes.

### 4.11 Denormalized counters that don't reconcile
`08_resource_library_data.sql` hand-types `DownloadCount`/`RatingCount`/`AverageRating` on Resource rows (e.g. DownloadCount 156, RatingCount 9) while seeding at most 50 ResourceDownload and 2–5 ResourceRating child rows per resource. Any drill-down from the counter to the detail contradicts itself. Star distribution is 5/4 only (one 3★, zero 1–2★) → the 1–5 histogram query is degenerate. v2 fix: don't store counters (§2.10); ratings dropped.

### 4.12 Competition scores independent of medals
`10:406-428` — Status ('Winner'/'Finalist'/'Judged'), Score (uniform 70–99.9), Ranking (30% random 1–10), and AwardLevel are four independent draws. 'Judged' entries hold Gold; 'Winner' entries hold 'None'; Gold and Bronze have identical score distributions (≈84.9 mean), so "Competition Scoring By Award Level" shows no separation and the organic-vs-non-organic performance story is noise. v2 fix already drafted: Award is generated **after** JudgeScore and must be consistent with it.

### 4.13 Advocacy follow-up fields never seeded
`11:297-303` inserts AdvocacyAction without FollowUpRequired/FollowUpDate (schema V008:126-127 defines them, default 0/NULL) → all three follow-up queries empty. v2 drops the fields; if follow-up stories are wanted, they need a real column + seeding plan.

### 4.14 The systemic generator flaw: independent `CASE WHEN CHECKSUM(NEWID())` chains
Beyond specific rows, v1 has two structural generation defects:
1. **Re-rolled WHEN clauses** — `CASE WHEN ABS(CHECKSUM(NEWID())%100) < 60 ... WHEN ABS(CHECKSUM(NEWID())%100) < 70 ...` re-draws per WHEN, so intended cumulative distributions (60/10/15/10/3/2) become compounding conditionals (≈60/28/10/1.2/…). Every "weighted" mix in 01/03/05/09/10 is off from its stated target.
2. **Column-independent draws** — correlated business facts (status↔date, status↔score, medal↔score, open↔click) are sampled independently, producing flat cross-tabs and contradictory rows. This is precisely what v2's latent-driver/propensity generation + CHECK/audit gates exist to replace.

---

## Section 5 — Recommended v2 targets

| Metric | v1 value (actual) | v2 recommendation | Note |
|---|---|---|---|
| Members | 2,000 | keep 2,000–5,000 | enough for group variance; scale knob for the generator |
| Member↔org attach | 85% | keep ~85% | org size weights (2–20 members) worked well — keep the size-weighted assignment |
| History window | 5 yrs, anchored to GETDATE() | **keep the evergreen anchor** | v2 equivalent: offsets from release date; must also seed future-dated rows (expiries, upcoming events, due follow-ups) |
| Membership status mix | intended 80/15/5, actual 80/19/1 | **derive from interval**, target ≈ 78–82% Active / 12–15% Lapsed / 5–8% Cancelled *as-of release* | status is computed, not drawn; renewal rate must differ by tier (Student ≪ Corporate) |
| Renewal unroll depth | 1.07 periods/member (only 6% multi-year) | 2.5–4 periods/member for tenured members | needed for renewal-rate, YoY growth, and tenure queries to be non-trivial |
| Type mix | ≈60% Individual dominant | keep a dominant tier + long tail | monotone dues by tier (v2 DisplayOrder rule) |
| CancellationReason | never seeded | 100% of Cancelled rows, from a ~6-value list with repeats | reasons must rank |
| Events/yr | ~7–10, 21 total | keep ~10–15/yr incl. 1 flagship annual | annual-meeting YoY arc (950→1,050→partial-open, ~+10%) is v1's best design — **keep it**, incl. 70% repeat-attendee overlap |
| Registrations/member/yr | ~1.0 | 1–2, engagement-skewed | driven by propensity (region+discipline+engagement), not uniform TOP N |
| No-show rate | 3–4% conf / 2% workshop / 10% webinar | keep this per-type gradient (maybe amplify webinar to 15–25%) | with CHECK-consistent CheckIn/CEU |
| CheckIn/CEU consistency | random noise | CHECK-enforced: Attended ⟺ CheckIn; CEU ⟹ Attended; award CEU to ~85–95% of attendees | the "some attendees didn't claim CEU" gap is a good story — keep it deliberate |
| Event fill rates | 75–90% completed / 35–50% open / 20–35% published | keep exactly | good, simple shape |
| EventSessions | 0 | 3–10 per conference, 1 per webinar; capacities on a subset; virtual platform on virtual events | two queries currently dead |
| Courses | 60 across 7 categories | keep ~40–60; add real prereq chains depth 2–3 | v1 never wired PrerequisiteCourseID either — v2 self-FK plan covers it |
| Enrollments/member | 0.45 | 0.5–1.0, skewed by engagement + discipline match | completion rate must vary by course level |
| Completion rate | intended 72% (actual mix 72/25/3) | 60–75% overall, varying 45–85% by level/category; include Withdrawn (5–10%) and Failed (3–5%) | v1 has zero Withdrawn/Failed — prereq and invoice queries reference them |
| Certificates per completion | ≈52% effective (bug) | 100% of passed completions (or explicit cert-claim rate ~80%) | consistency via CHECK |
| Certifications/member | 0.21 | keep ~0.2, across ~8–12 programs with realistic per-program volumes (5 elite → 80 mainstream) | Wisconsin-Master-style tiny elite cohort is good flavor |
| Cert status vs dates | contradictory | computed from EarnedAt/ExpiresAt + release date; 10–20% expiring within 90 days for the "expiring soon" demos | seed CE-credit gaps so all renewal-risk tiers populate |
| CE records per cert | 0.2 | 2–6 per active cert via CECredit (Course/Event/External arc) | makes top-CE-members and credit-gap queries real |
| Invoices/member | 3.7 (orders in v2) | keep ~3–5 orders/member/yr equivalent | money chain via orders/payments; **must include partials (~5%) and genuine overdue (~5–8%) spread over ages** |
| Payment failure rate | 3% (but inconsistent) | 2–4%, varying by method (e.g. card 3%, ACH 1%) — and failure must leave the order unpaid | method-failure query implies per-method variance |
| Email sends/member/yr | 0.7 | **50–100** | the keyset-pagination star table; v1 is 100× too thin |
| Email funnel | intended 97/25/5, actual broken | delivered ~97%, open 20–35% varying by template/campaign type, click 2–8% of delivered, unsubscribe 0.1–0.5% | monotone timestamps CHECK-enforced; open/click driven by engagement latent |
| Campaign conversion data | zero rows | design conversion as EmailSend→Order attribution (no CampaignMember table) | decide before porting the 4 conversion queries |
| Chapters | 15 (10 geo + 5 SIG) | keep shape; add officer **term history** (TermStart/TermEnd, ~⅓ of chapters with a change in last 12 mo) | turnover query currently dead |
| Chapter membership | 30–50/chapter, 97% active | keep; skew a couple of mega-chapters | |
| Committees/board | 12 committees, 27 board rows | move to BizApps committees app; preserve "some committees at/over capacity" if the app supports MaxMembers | board tables dropped |
| Forum authors | 20/30 of 2,000 (1.5%) | keep concentration: ~5–10% of members ever post; power-law posts/author | matches real communities and makes "most helpful members" meaningful |
| Forum posts | ~190 | 5k–20k (high-volume table) with reply trees depth 0–3 | chronology CHECK/audit (reply after parent) |
| Reactions/post | ~1.6 | 0–30 skewed; concentrated on accepted answers | ForumReaction UNIQUE(Post,Person,Kind) |
| Accepted answers | ~1/thread deterministic | ~60–80% of question threads have one; per-author accepted *rates* varying 10–60% | if IsAcceptedAnswer is kept in v2 (recommend yes) |
| PostTag/Follow/Attachment/Moderation | 100/100/25/10 rows | drop (per v2 plan) unless a demo script claims them | |
| Resources | 100 curated | keep ~100 curated titles (good domain flavor), Topic-tagged for homophily | drop ratings/versions/tags per plan |
| Downloads/member/yr | 0.02 | 5–20, engagement-driven, skewed to hero resources (v1's 6-hero skew is right, just 100× bigger) | high-volume table |
| Products | 110 owned by members | ~100–150 owned by **producer orgs** (≈2–5 per producer) | v2 ownership change |
| Entries/product | 1.8 | 1–3 per product per competition-year; UNIQUE(Competition, Product) | |
| Medal rate | ~51% of entries | **tighten to ~25–30%** (Gold 5–8%, Silver 8–10%, Bronze 10–12%, BiS 1 per competition) | real award pyramids are stingier; makes winners special |
| Score↔medal consistency | none | Award generated from JudgeScore ranking; Gold mean must exceed Silver/Bronze by construction | flagship consistency demo |
| Organic share | 15–30% by category | keep; give organics a small real score/price premium (+3–5%) so the organic-vs-non queries tell a true story | v1's premium is accidental |
| Legislative issues | 13 issues / 10 bodies / 7 positions / 10 contacts | keep this hand-curated scale and quality — best-written v1 content | port narratives nearly verbatim |
| Advocacy actions | 150 in 90 days | 300–600/yr, engagement-dependent (Sonar factor), across 5 action types | drop follow-up unless a column is added |
| Regulatory comments | 1 | drop table (per plan) | |
| EngagementScore | all zeros | **never store** — sonar.Score at release; every engagement query re-targets Sonar | v1's single biggest silent degeneracy: 9+ queries aggregate a column that is 0 for all 2,000 members |
| Stated-vs-actual row counts | headers off by 2–4× | generator must emit a row-count manifest reconciled at install-audit time | prevents the 2,500-vs-2,137 class of drift |

---

*Prepared as workstream R3 of the association-db research plan. Companion sections of `research-plan-and-schema-proposal.md` (Part 2) already encode most of the §4 fixes as CHECKs/audit rules; this document supplies the empirical evidence and the numeric targets.*
