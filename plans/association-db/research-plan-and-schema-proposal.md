# Research Plan + Concrete Schema Proposal (Generation Angle)

**Author:** the workstream lead · **Date:** 2026-07-02 · **Updated 2026-07-05** (the schema owner's agent, the workstream lead-approved: Q&A alignment; see below)
**Purpose:** Two deliverables for the reconciliation with the schema owner:
1. A **research plan** for building the generator's ruleset (the `X` artifact — priors, causal map, benchmarks)
2. A **concrete schema proposal** for the cheese-specific tables, annotated for data generation, that the schema owner reconciles against his BizApps findings

> **2026-07-05 status.** R1–R3/R6–R9 are done and consolidated in `research/benchmarks-draft.json`
> **v0.8** (canonical); the R4 team answers are applied throughout (this doc's §2.1 MembershipPeriod
> semantics already encode them). What still stands between here and ruleset v0.1 is the
> **gap register: [gaps-to-fill.md](gaps-to-fill.md)** (GAP-1..10 — payment timing, support
> taxonomy, HubSpot/Higher Logic calibration, merch, large-preset attenuation, text templates,
> donations home, hero tranche 2, 990 spot-check, team sign-offs) plus the two human sessions
> already planned: the Part-2 reconciliation (§2.11) and the R5 causal-map workshop. The
> sales-facing summary of what we will generate is **[DATA-SUMMARY.md](DATA-SUMMARY.md)**.

Companion to [generative-schema-findings.md](generative-schema-findings.md) (the findings + requirements analysis).

---

# Part 1 — Research Plan: how we build the ruleset

The ruleset (`X`) needs four kinds of content: **realistic numbers** (renewal rates, dues, attendance), **causal arrows** (what drives what, with signs), **value lists / regimes** (what categories and time periods exist), and **text templates** (bios, tasting notes, forum posts). Each comes from a different source, so the research splits into five workstreams. R1–R4 are independent — run them in parallel.

## R1 — External industry benchmarks (LLM deep research)

**Question:** what do real association numbers look like?

**Targets to pin down (each becomes a `benchmarks` entry with a tolerance):**
- Membership renewal/retention rate — overall and by type (individual vs. corporate vs. student). Industry reports put trade-association renewal in the mid-80s%; we need the distribution, not just the average.
- Membership tier mix (what % at each tier) and typical dues ranges per tier for a mid-size trade association
- Event attendance: registration-to-member ratios, **no-show rates** (typically 10–20% for free events, lower for paid), virtual vs. in-person split post-2020
- Email engagement: open rates (~20–25% association avg), click rates (~2–3%), unsubscribe rates
- Certification: pass rates, completion rates, renewal compliance rates
- Giving: what % of members donate, typical gift distribution (heavily right-skewed)
- Growth/lapse curves: first-year member retention is famously much lower (~65–75%) than tenured-member retention (~90%+) — this **tenure → renewal** curve is a headline causal shape

**Sources to have the LLM pull and cite:** MGI Membership Marketing Benchmarking Report (annual, the standard reference), ASAE research, Community Brands / Higher Logic engagement studies, event-industry and email-marketing benchmark reports.

**Method:** run as a deep-research task (fan-out searches → verify → cited report). Citations marked *unverified* until spot-checked — per the strategy doc, citations are advisory, and the pilot run is the real gate.

**Deliverable:** `benchmarks-draft.json` + a short memo of the causal shapes found (e.g. "renewal rises with tenure, concave").

## R2 — Cheese-domain specifics

**Question:** what makes this a *cheese* association instead of a generic one?

- Real-world analog: the **American Cheese Society** (~1,500–2,000 members, the Certified Cheese Professional™ exam, an annual competition with ~1,500+ entries and ~250 categories). Also World Championship Cheese Contest (WCMA), Good Food Awards. These calibrate our Awards/Competition and Certification volumes.
- Value lists that must be *real*: cheese types, milk sources, production disciplines (cheesemaking, affinage, retail, distribution, QA/food safety, education), competition categories, relevant legislation themes (raw-milk rules, labeling, FSMA, trade).
- Seasonality: competition season, conference season, holiday retail spike — these become time regimes.

**Deliverable:** domain value lists + volume anchors + seasonal regimes. Feeds directly into the schema CHECK constraints (Part 2), so this workstream also **hardens the schema**, not just the ruleset.

## R3 — Mine the v1 demo (internal, cheap, high yield)

**Question:** what shapes did we already decide the data should have?

- The v1 demo's **60+ saved queries** each encode an intended pattern (renewal rate by type, engagement by attendance, campaign ROI, cert pass rates, officer turnover). Read them all; extract each query's *implied target* — these become benchmarks that keep v2 answering the same demo questions as v1.
- The v1 **seed scripts** encode chosen distributions (80% active / 15% lapsed / 5% cancelled; 21 events over 5 years; 900 enrollments over 60 courses). Harvest the ratios as scaling-law starting points.
- The v1 **bug list** (active-with-expired-date, no-shows without check-in logic, missing CEU awards) becomes the negative test set: rules the new generator must make unrepresentable.

**Deliverable:** `v1-implied-targets.md` — one line per query: metric, implied target, keep/drop for v2.

## R4 — Team ground truth (interviews, short)

**Question:** what do the people who've run/sold to associations actually know?

- the domain lead: the date-semantics rules (EndDate vs RenewalDate — already settled in the v2 plan), plus real-world renewal behavior and what made v1 reports feel wrong.
- the demo lead / leadership: what numbers a *prospect* would sniff-test in a demo (the credibility metrics — if our renewal rate or event sizes look silly, the demo fails regardless of internal consistency).
- Hero personas: collect the 50–100 storylines early (long lead time, release-blocking per the v2 plan). Each hero is a *pinned* row set the generator builds around.

**Deliverable:** ground-truth memo + first-cut hero persona list.

## R5 — Causal map workshop (synthesis; needs R1–R4)

Draft the arrows on the skeleton from the findings doc §5 — for each: direction, predicted sign, strength (weak/med/strong), one-line justification. ~30–50 arrows covers the core:

- affluence → org size → membership tier → dues → order → payment → GL
- engagement + tenure → renewal (the unroll loop)
- engagement + region-match + discipline-match + event popularity → event registration
- engagement + career stage → enrollment → completion → certification → CE credits
- affluence + engagement → giving
- engagement → forum activity; discipline → forum topic
- ALL behavior → Sonar score (sink) → predictive models

Review the ranked arrow list with the schema owner + the generative-data lead (humans review the *map*, never rows).

## Sequencing & validation

| When | What |
|---|---|
| Days 1–3 | R1–R4 in parallel (R1/R2 are LLM deep-research tasks; R3 is a code/reading task; R4 is meetings) |
| Day 4–5 | R5 workshop → ruleset **v0.1** for a vertical slice only: Person / MemberProfile / Subscription / Event / EventRegistration |
| Week 2 | **Pilot**: generate N≈500 from v0.1 → fit the check-model → verify every recovered effect sign matches prediction → human review of the report. Iterate until green. |
| After | Extend ruleset schema-by-schema (learning → giving → forums → marketing → awards → legislative), each addition re-piloted |

**Definition of done for the ruleset v1:** all form gates pass, pilot sign-check passes, benchmarks within tolerance on a small run, and the arrow list + samples reviewed by a human.

---

# Part 2 — Concrete Schema Proposal

**Status: PROPOSAL** — written from the generation angle for the schema owner to reconcile against BizApps reality. Where a composed app owns the table, I specify the **interface we need**, not the table itself.

## Conventions (apply to every table below)

| Convention | Rule | Why (generation) |
|---|---|---|
| PK | `ID UNIQUEIDENTIFIER PK DEFAULT NEWSEQUENTIALID()` | MJ standard; orderable single-column PK → keyset pagination works |
| Business key | Every headline entity gets a human-readable unique key (`MemberNumber`, `Slug`, `CertNumber`…) | Deterministic regeneration + hero-persona pinning |
| Demo flag | `IsSharedDemo BIT NOT NULL DEFAULT 0` on **every** table; generator writes 1 | OQ-14: demo refresh must not touch real morecheese.org rows |
| Enums | Always CHECK constraints — never free text | CodeGen → value lists → the ruleset authoring reads them; generator can't invent categories |
| Status↔date rules | Per-row CHECKs wherever expressible (see each table) | Makes the v1 bug class unrepresentable; seed migration self-verifies on load |
| FKs | Declared always, including cross-schema | The join graph is the generator's map; soft keys blind it |
| Timestamps | No `__mj_*` columns, no FK indexes (CodeGen adds both) | Migration rules |
| Cross-table date rules | NOT CHECK-able per-row (SQL Server limit) → enforced by generation (interval carry-down) + install-time audit | e.g. registration within event window |

**Shared value list (used by 4 schemas — define once, reference everywhere):**
`Discipline`: `Cheesemaking · Affinage · Retail · Distribution · QualitySafety · Education · Enthusiast`
This is the **homophily key** — it must be the *same list* on MemberProfile, EventTrack, ForumCategory, and Resource, or region/discipline matching in generation (and every "members like you" feature) has nothing to join on.

---

## 2.1 `members` schema (core)

### MemberProfile
The association-specific face of a `bizapps-common.Person`. Identity (name, email, address) stays on Person — **do not duplicate it here** (v1's mistake).

| Column | Type | Constraint | Causal role |
|---|---|---|---|
| ID | UNIQUEIDENTIFIER | PK | noise |
| PersonID | UNIQUEIDENTIFIER | FK → common.Person, **UNIQUE** | link |
| MemberNumber | NVARCHAR(20) | NOT NULL UNIQUE | business key |
| MembershipTypeID | UNIQUEIDENTIFIER | FK → MembershipType | **dependent** (← affluence, org size) |
| ChapterID | UNIQUEIDENTIFIER | FK → Chapter, NULL | **dependent** (← geography) |
| Segment | NVARCHAR(20) | CHECK: `Producer·Retailer·Supplier·Educator·Enthusiast` | **driver** |
| Discipline | NVARCHAR(20) | CHECK: shared Discipline list | **driver** (homophily) |
| YearsInProfession | INT | CHECK ≥ 0 | **driver** (career stage) |
| JoinDate | DATE | NOT NULL | **driver** (tenure anchor; opens the validity window) |
| EndDate | DATE | NULL (null = still a member) | dependent; closes the window |
| Bio | NVARCHAR(MAX) | NULL | text (template slots: tier, discipline, joinYear, region) |
| IsSharedDemo | BIT | NOT NULL DEFAULT 0 | — |

CHECK: `EndDate IS NULL OR EndDate >= JoinDate`.
**Every activity row for this person must date inside [JoinDate, EndDate)** — generation carries the window down; install audit verifies.

### MembershipType
`ID · Name UNIQUE · Code UNIQUE · Description · BaseAnnualDues DECIMAL(10,2) CHECK ≥ 0 · IsOrganizational BIT · DisplayOrder INT · IsActive BIT · IsSharedDemo`
Tier ordering matters (dues must be monotone in tier) — encode rank in `DisplayOrder`.

### Chapter
`ID · Name UNIQUE · Slug UNIQUE · ChapterType CHECK(Geographic·SpecialInterest·Industry) · Region CHECK(NA-East·NA-Central·NA-West·EU·APAC·Other) · FoundedDate DATE · IsActive BIT · IsSharedDemo`
`Region` is a **driver** and the second homophily key (member region ↔ event region).

### ChapterOfficer
`ID · ChapterID FK · MemberProfileID FK · Role CHECK(President·VicePresident·Secretary·Treasurer·AtLarge) · TermStart DATE · TermEnd DATE · IsSharedDemo`
CHECKs: `TermEnd > TermStart`. UNIQUE `(ChapterID, Role, TermStart)`. Terms per (chapter, role) must not overlap — generation guarantee + audit.

### MembershipPeriod  ⚠️ *shape depends on the schema owner's subscriptions findings*
One row per membership year/cycle (the renewal unroll — v1's "multiple Membership rows" pattern, kept deliberately). Links to `subscriptions.Subscription` for billing truth.

| Column | Type | Constraint | Causal role |
|---|---|---|---|
| ID | UNIQUEIDENTIFIER | PK | noise |
| MemberProfileID | UNIQUEIDENTIFIER | FK | link |
| SubscriptionID | UNIQUEIDENTIFIER | FK → subscriptions.Subscription (if hard FK possible) | link |
| MembershipTypeID | UNIQUEIDENTIFIER | FK | dependent |
| StartDate / EndDate | DATE | NOT NULL both; `EndDate > StartDate` | interval |
| Status | NVARCHAR(20) | CHECK: `Active·Lapsed·Cancelled·PendingRenewal` | **dependent** (derived from interval + asOf) |
| RenewalDate | DATE | NULL | **next renewal due date — generally = EndDate** (team-confirmed semantics, 2026-07-02) |
| CancellationDate | DATE | NULL | **termination date** — populated when the member *ceased to be a member*, whether by explicit cancel OR by non-payment past the grace period (team-confirmed) |
| CancellationReason | NVARCHAR(500) | NULL | distinguishes explicit-cancel vs lapsed-past-grace |
| DuesAmount | DECIMAL(10,2) | CHECK ≥ 0 | **dependent** (← tier, inflation regime) |
| AutoRenew | BIT | NOT NULL | driver-ish (behavioral trait) |
| IsSharedDemo | BIT | NOT NULL DEFAULT 0 | — |

**The anti-v1-bug CHECKs (per-row, load-time-verifiable) — REVISED per team answers 2026-07-02** (CancellationDate is a *termination* date, set for both `Cancelled` and `Lapsed`; RenewalDate = next due ≈ EndDate):
```sql
CHECK (Status NOT IN ('Cancelled','Lapsed') OR CancellationDate IS NOT NULL)  -- terminated ⟹ has termination date
CHECK (CancellationDate IS NULL OR Status IN ('Cancelled','Lapsed'))          -- termination date ⟹ terminated
CHECK (Status <> 'Active' OR RenewalDate IS NOT NULL)                         -- active ⟹ next-due date set
CHECK (CancellationDate IS NULL OR CancellationDate >= StartDate)
```
The time-relative rules (`Active ⟹ EndDate ≥ today`) can't live in a static CHECK honestly (rows go stale without writes) — they're enforced by generation (status is *computed from* the interval + release date) and re-verified by the install-time integrity check.

**Team-confirmed lifecycle rules (2026-07-02) the generator must encode:**
1. **Late renewal has no gap**: the next period's `StartDate` = the prior period's `RenewalDate`, even when payment arrives late — continuity is back-dated. (Cross-row rule → generation + install audit, not a per-row CHECK.)
2. **Grace period precedes termination**: a lapse's `CancellationDate` falls at `EndDate + grace`, not at `EndDate`; explicit cancels can fall mid-period. Grace length itself is a ruleset parameter (ask pending).
3. **NO static status column on MemberProfile — banned.** Team confirmed this is exactly the v1 bug: a member-level status that drifts out of sync with the membership records ("status says Active while the latest period ended 5/1/2026"). Member-level status is always **derived from the latest MembershipPeriod** (view or computed column, never stored).

**Ask for the schema owner:** does `subscriptions.Subscription` already carry Status/Start/End/CancellationDate? If yes, `MembershipPeriod` slims down to the association-semantics overlay (type, dues, renewal semantics) and status lives *only* in subscriptions — no duplicated status, per the v2 plan.

---

## 2.2 `events` schema

### Event
| Column | Type | Constraint | Causal role |
|---|---|---|---|
| ID / Slug | — | PK / NVARCHAR(80) UNIQUE | noise / business key |
| Name | NVARCHAR(255) | NOT NULL | text-ish |
| EventType | NVARCHAR(30) | CHECK: `Conference·Workshop·Webinar·ChapterMeeting·Competition·Networking` | **driver** (per-type priors) |
| ChapterID | UNIQUEIDENTIFIER | FK, NULL | link |
| Region | NVARCHAR(20) | CHECK: same Region list as Chapter | **driver** (homophily) |
| IsVirtual | BIT | NOT NULL | driver (regime-sensitive: covid era ×) |
| StartAt / EndAt | DATETIME2 | `EndAt > StartAt` | interval |
| RegistrationOpensAt / ClosesAt | DATETIME2 | `ClosesAt > OpensAt AND ClosesAt <= StartAt` | interval (child window) |
| Capacity | INT | NULL, CHECK > 0 | driver (popularity proxy) |
| MemberPrice / NonMemberPrice | DECIMAL(10,2) | CHECK ≥ 0; `NonMemberPrice >= MemberPrice` | dependent |
| CEUCredits | DECIMAL(4,2) | CHECK ≥ 0 | feeds cert chain |
| Status | NVARCHAR(20) | CHECK: `Draft·Published·RegistrationOpen·SoldOut·Completed·Cancelled` | dependent (derived from dates + asOf) |
| Description | NVARCHAR(MAX) | | text |
| IsSharedDemo | BIT | | — |

### EventTrack
`ID · EventID FK · Name · Topic CHECK(shared Discipline list) · IsSharedDemo`
**Topic uses the same Discipline value list as MemberProfile.Discipline** — this is what propensity pairing matches on.

### EventSession
`ID · EventID FK · TrackID FK NULL · Title · StartAt/EndAt (CHECK EndAt > StartAt) · Capacity NULL · IsSharedDemo`
Session times inside the parent event window = generation + audit (cross-table).

### EventSpeaker
`ID · SessionID FK · PersonID FK → common.Person · Role CHECK(Speaker·Panelist·Keynote·Moderator) · UNIQUE(SessionID, PersonID) · IsSharedDemo`

### EventRegistration — *the homophily showcase table*
| Column | Type | Constraint | Causal role |
|---|---|---|---|
| ID | UNIQUEIDENTIFIER | PK | noise |
| EventID | UNIQUEIDENTIFIER | FK | **paired parent 1** |
| PersonID | UNIQUEIDENTIFIER | FK → common.Person | **paired parent 2** |
| MemberProfileID | UNIQUEIDENTIFIER | FK, NULL (null = non-member registrant) | link |
| RegisteredAt | DATETIME2 | NOT NULL | ∈ [event.RegOpens, event.RegCloses] ∩ member window — generation + audit |
| Status | NVARCHAR(20) | CHECK: `Registered·Waitlisted·Cancelled·Attended·NoShow` | **dependent** (← engagement) |
| CheckInAt | DATETIME2 | NULL | — |
| CEUAwarded | DECIMAL(4,2) | NULL, CHECK ≥ 0 | dependent |
| OrderID | UNIQUEIDENTIFIER | FK → orders.Order, NULL | link (money chain) |
| IsSharedDemo | BIT | | — |

CHECKs — kill the v1 no-show inconsistencies:
```sql
CHECK (Status <> 'Attended' OR CheckInAt IS NOT NULL)   -- attended ⟹ checked in
CHECK (Status = 'Attended' OR CheckInAt IS NULL)        -- checked in ⟹ attended
CHECK (Status = 'Attended' OR CEUAwarded IS NULL)       -- CEUs only for attendees
UNIQUE (EventID, PersonID)
```
Generation note: (Person, Event) pairs are sampled from the propensity model (region-match + discipline-match + engagement + popularity), **never** independently — this is what makes cross-tabs and dashboards non-flat.

---

## 2.3 `learning` schema

### Course
`ID · Code UNIQUE · Name · Category CHECK(Cheesemaking·Affinage·FoodSafety·Business·Sensory) · Level CHECK(Beginner·Intermediate·Advanced·Expert) · MemberPrice/NonMemberPrice CHECK ≥ 0 · CEUCredits · PrerequisiteCourseID self-FK NULL · IsActive · IsSharedDemo`
Self-FK = level-by-level generation (prereqs before dependents).

### CourseEnrollment
`ID · CourseID FK · PersonID FK · EnrolledAt DATETIME2 · Status CHECK(Enrolled·InProgress·Completed·Withdrawn·Failed·Expired) · CompletedAt NULL · Score INT NULL CHECK 0–100 · OrderID FK NULL · IsSharedDemo`
```sql
CHECK (Status <> 'Completed' OR CompletedAt IS NOT NULL)
CHECK (CompletedAt IS NULL OR CompletedAt >= EnrolledAt)
CHECK (Status IN ('Completed','Failed') OR Score IS NULL)
UNIQUE (CourseID, PersonID)
```

### Certification (program definition)
`ID · Code UNIQUE · Name · AccreditingBody CHECK(ACS·WCMA·ADSA·FSMA-aligned…from R2) · Level CHECK(Entry·Intermediate·Advanced·Master) · ValidYears INT CHECK > 0 · RequiredCECredits INT CHECK ≥ 0 · ExamFee DECIMAL CHECK ≥ 0 · IsSharedDemo`

### CertificationRecord
`ID · CertificationID FK · PersonID FK · CertNumber NVARCHAR(30) UNIQUE (business key) · EarnedAt DATE · ExpiresAt DATE · Status CHECK(Active·Expired·Revoked·PendingRenewal) · RenewalCount INT DEFAULT 0 · IsSharedDemo`
```sql
CHECK (ExpiresAt > EarnedAt)
```

### CECredit — *the exclusive-arc pattern (typed polymorphism done right)*
`ID · CertificationRecordID FK · SourceType CHECK(Course·Event·External) · CourseEnrollmentID FK NULL · EventRegistrationID FK NULL · ExternalDescription NVARCHAR(500) NULL · Credits DECIMAL(4,2) CHECK > 0 · EarnedAt DATE · IsSharedDemo`
```sql
CHECK (
  (SourceType='Course'   AND CourseEnrollmentID IS NOT NULL AND EventRegistrationID IS NULL AND ExternalDescription IS NULL) OR
  (SourceType='Event'    AND EventRegistrationID IS NOT NULL AND CourseEnrollmentID IS NULL AND ExternalDescription IS NULL) OR
  (SourceType='External' AND ExternalDescription IS NOT NULL AND CourseEnrollmentID IS NULL AND EventRegistrationID IS NULL)
)
```
This replaces v1's untyped `RelatedEntityType + RelatedEntityID` — same flexibility, but with **real FKs** the DB and the generator's gates can verify. **Propose the same pattern anywhere v1 used polymorphic links in the custom schemas.**

---

## 2.4 `forums` schema

- **ForumCategory**: `ID · ParentID self-FK NULL · Name · Topic CHECK(shared Discipline list) · DisplayOrder · IsSharedDemo`
- **ForumThread**: `ID · CategoryID FK · AuthorPersonID FK → common.Person · Title · CreatedAt · IsPinned/IsLocked BIT · IsSharedDemo`
- **ForumPost** *(high-volume — keyset demo table)*: `ID · ThreadID FK · AuthorPersonID FK · ReplyToPostID self-FK NULL · PostedAt · Body NVARCHAR(MAX) (text: templates clustered by Topic × engagement) · IsSharedDemo`
  - Cross-table rule (audit): `PostedAt >= thread.CreatedAt`; reply posted after its parent.
- **ForumReaction**: `ID · PostID FK · PersonID FK · Kind CHECK(Like·Helpful·Thanks) · ReactedAt · UNIQUE(PostID, PersonID, Kind) · IsSharedDemo`

Dropped from v1: PostTag, MemberFollow, PostAttachment, ForumModeration → keep only if a demo script needs them (each is more generation surface for little story value). **Reconcile with the schema owner.**

## 2.5 `awards` schema

- **Product**: `ID · ProducerOrganizationID FK → common.Organization` ← *changed from v1's MemberID: cheeses are made by creameries, not people* `· Name · CheeseType CHECK(from R2 list) · MilkSource CHECK(Cow·Goat·Sheep·Buffalo·Mixed) · AgeMonths INT CHECK ≥ 0 · IsOrganic/IsRawMilk BIT · RetailPrice DECIMAL CHECK ≥ 0 · DateIntroduced DATE · TastingNotes NVARCHAR(MAX) (text; slots: CheeseType, MilkSource, AgeMonths) · IsSharedDemo`
- **Competition**: `ID · Slug UNIQUE · Name · Year INT · HostOrganizationID FK NULL · EntryOpensAt/EntryClosesAt/JudgingAt DATETIME2 (ordered CHECKs) · IsSharedDemo`
- **CompetitionEntry**: `ID · CompetitionID FK · ProductID FK · CategoryEntered NVARCHAR(100) · EnteredAt (∈ entry window — CHECK not possible cross-table; audit) · UNIQUE(CompetitionID, ProductID) · IsSharedDemo`
- **Judge**: `ID · PersonID FK UNIQUE · Credentials NVARCHAR(500) · IsSharedDemo`
- **JudgeScore**: `ID · EntryID FK · JudgeID FK · Aroma/Texture/Flavor/Appearance DECIMAL(4,1) each CHECK 0–25 · UNIQUE(EntryID, JudgeID) · IsSharedDemo` — total is derived, don't store it (or store with arithmetic CHECK)
- **Award**: `ID · EntryID FK · Medal CHECK(Gold·Silver·Bronze·BestInShow) · IsSharedDemo` — awards must be consistent with scores (dependent, generated after JudgeScore)

## 2.6 `legislative` schema (lighter — showcase breadth, not depth)

- **LegislativeBody**: `ID · Name · Level CHECK(Federal·State·Agency·International) · IsSharedDemo`
- **LegislativeIssue**: `ID · BodyID FK · Title · Category CHECK(RawMilk·Labeling·FoodSafety·Trade·Environmental·DairyPricing·Other) · ImpactLevel CHECK(Critical·High·Medium·Low·Monitoring) · Status CHECK(Introduced·InCommittee·Passed·Failed·Monitoring) · IntroducedAt DATE · IsSharedDemo`
- **LegislativePosition**: `ID · IssueID FK · Position CHECK(Support·Oppose·Neutral·Amend) · AdoptedAt DATE · Rationale NVARCHAR(MAX) (text) · IsSharedDemo`
- **GovernmentContact**: `ID · PersonID FK NULL → common.Person · BodyID FK · Role · IsSharedDemo`
- **AdvocacyAction**: `ID · IssueID FK · PersonID FK (the member acting) · ActionType CHECK(Letter·Call·Testimony·Meeting·Petition) · ActionAt DATE · IsSharedDemo` — **dependent** on engagement latent; feeds a Sonar factor

## 2.7 `marketing` schema

- **Segment**: `ID · Name · DefinitionJSON NVARCHAR(MAX) · IsSharedDemo`
- **Campaign**: `ID · Name · CampaignType CHECK(Newsletter·EventPromotion·Renewal·CourseLaunch·DonationDrive) · SegmentID FK NULL · StartAt/EndAt (ordered) · IsSharedDemo`
- **EmailTemplate**: `ID · CampaignID FK NULL · Name · Subject · BodyTemplate NVARCHAR(MAX) · IsSharedDemo`
- **EmailSend** *(highest-volume table in the system — the keyset-pagination star)*:
  `ID · CampaignID FK · TemplateID FK · PersonID FK · SentAt · OpenedAt NULL · ClickedAt NULL · UnsubscribedAt NULL · IsSharedDemo`
  ```sql
  CHECK (OpenedAt IS NULL OR OpenedAt >= SentAt)
  CHECK (ClickedAt IS NULL OR (OpenedAt IS NOT NULL AND ClickedAt >= OpenedAt))  -- can't click unopened
  CHECK (UnsubscribedAt IS NULL OR UnsubscribedAt >= SentAt)
  ```
  Open/click are **dependents of engagement** — this is where the engagement latent gets its densest observable signal.

## 2.8 `resources` schema

- **ResourceCategory**: `ID · ParentID self-FK NULL · Name · IsSharedDemo`
- **Resource**: `ID · CategoryID FK · Title · ResourceType CHECK(PDF·Video·Article·Template·Link) · Topic CHECK(shared Discipline list) · PublishedAt · IsSharedDemo`
- **ResourceDownload** *(high-volume)*: `ID · ResourceID FK · PersonID FK · DownloadedAt · IsSharedDemo` — engagement observable
- **ResourceBookmark**: `ID · ResourceID FK · PersonID FK · UNIQUE(ResourceID, PersonID) · IsSharedDemo`

---

## 2.9 Interface contracts with the composed apps (asks, not our tables)

We don't design these — but generation needs specific things *from* them. This is the checklist for the schema owner's BizApps survey:

| App | What generation needs | Blocking? |
|---|---|---|
| **bizapps-common** | `Person` (have it: name, email, status, DOB), `Organization` (have it: type, parent hierarchy) — **need**: where do org *size* and *region* live? (Both are top-level causal drivers. Employment/Relationship rows? An org attribute? Address via AddressLink?) | 🔴 yes — affluence chain starts here |
| **subscriptions** | `Subscription` shape: Status value list, StartDate/EndDate/CancellationDate, tier-change history, FK-ability from our `MembershipPeriod` | 🔴 yes — renewal unroll |
| **orders** | `Order` + line-item shape; how a line references what was bought (typed FK or polymorphic? if polymorphic → exclusive-arc ask, or accept audit-only) | 🔴 yes — money chain |
| **payments** | `Transaction` → Order linkage; status values; refund shape | 🟡 |
| **accounting** | `JournalEntry` + lines; the payment→GL posting shape (needed for accounting-identity repair rules: debits = credits) | 🟡 |
| **sonar** | **No table asks.** We author `ScoreModel` + `Factor` + `TimeWindow` metadata and run Sonar's recompute at release → it emits `Score`/`ScoreHistory`. Depend on the engine contract, not the (unfrozen) tables. Need: confirmation Sonar's recompute is runnable headless at release-build time. | 🟡 |
| **committees / tasks / issues / secure-messaging** | Headline tables + FK-to-Person shape; committee membership needs Term start/end dates (interval) | 🟢 later |

## 2.10 What the generator computes but does NOT store on base rows

Explicitly *absent* from the schema above (v1 stored these; v2 must not):

| v1 column | v2 home |
|---|---|
| `Member.EngagementScore` | `sonar.Score` (computed by Sonar recompute at release) |
| `Member.LastActivityDate` | derivable; or a Sonar Recency factor |
| `Product.AwardCount` | derivable from `Award`; store only with an arithmetic CHECK if a demo needs it denormalized |
| `Invoice.AmountPaid/Balance` | owned by orders/payments apps; if they store it, they own the arithmetic CHECK |

---

## 2.11 Reconciliation protocol (the working session with the schema owner)

Go table-by-table through Part 2 and mark each: **✅ agree · ✏️ amend (BizApps already covers it / different shape) · ❌ drop · ➕ missing**. Specifically:

1. **Ownership calls** — for each proposed table: custom cheese schema, or does a composed app already own it? (e.g. does `orders` cover event pricing? does `committees` make ChapterOfficer redundant?)
2. **The 🔴 interface asks** (§2.9) — org size/region home, Subscription shape, Order line shape. These block the ruleset's vertical slice.
3. **Value lists** — merge my CHECK lists (drafted from v1 + R2) with what BizApps apps already define; one source of truth per list.
4. **The shared Discipline/Region lists** — confirm all four schemas will reference the same lists (the homophily requirement).
5. **Naming** — schema prefix convention (OQ-3) and table-name collisions with composed apps.
6. **v1 mapping** — fold agreed tables into `V1_TO_V2_ENTITY_MAPPING.md` (v2 plan Phase 1.1 deliverable).

**Output of reconciliation:** the agreed table list → actual migration drafts + the ruleset vertical slice (R5) can start against real column names.
