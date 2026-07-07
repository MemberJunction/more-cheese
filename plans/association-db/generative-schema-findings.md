# Generative-Dataset Schema Findings — Association Data × Causal Generation

**Author:** Barnatt (with Claude) · **Date:** 2026-07-01
**Division of labor:** Marcelo researches the existing data schema with BizApps + existing Cheese Association data. Barnatt works Madhav's *Generative Dataset* (causal, LLM-optimal data generation) document into schema requirements from the generation angle. This doc is the generation-angle half, ready for reconciliation.

**Working setup:** worktree at `/Users/barnattwu/Member Junction Main Repo/MJ-morecheese` on branch `claude/review-associationdb-v2-plan-UTO7v` (the MoreCheese branch — v2 plan + v1 demo DB + morecheese.org mockup).

---

## 1. Where the existing association data actually lives (correction)

**It is NOT in Sonar's database.** Sonar (`bizapps-sonar`, at `/Users/barnattwu/Blue Cypress/Sonar Dev/bizapps-sonar`) contains only the **scoring engine's config + output schema** (`__mj_BizAppsSonar`: `ScoreModel`, `Factor`, `TimeWindow`, `ModelFactor`, `Score`, `ScoreHistory`, `ScoreFactorContribution`, `ScoreBand*`, `ScoreRecomputeRun`, `ScoreBandTransition`, `ScoreModelAuditEvent` — 14 tables). Its metadata seeds are just 3 default score bands and 5 time windows. **Zero association rows.** Sonar *reads* association data from whatever host schema it's pointed at via `ScoreModel.AnchorEntityID` + `ModelRelatedEntity` join paths — it never owns it.

The existing Cheese Association data is the **v1 AssociationDB demo**, on the MoreCheese branch at `Demos/AssociationDB/`:

- **58 tables** in one `AssociationDemo` schema, 13 domains, ~10,000+ rows
- Seeded by hand-written SQL scripts (`data/01_membership_data.sql` … `11_legislative_tracking_data.sql`) with "evergreen" `DATEADD(…, GETDATE())` dates
- ~2,000 Members, 40 Organizations, 21 Events (5 yrs), 60 Courses, 413 Certifications, 110 Products, 45 Campaigns, 50 forum threads, 12 legislative issues
- **108 pre-built analytical queries** in `metadata/queries/` — these define the *signal* the data is supposed to carry (renewal rate by type, engagement by attendance, campaign ROI, cert pass rates, …)

Also relevant and real today:

- **bizapps-common** (`/Users/barnattwu/Blue Cypress/Sonar Dev/bizapps-common`, schema `__mj_BizAppsCommon`): `Person`, `Organization` (self-ref hierarchy), `Relationship` (typed, directional, with Start/EndDate), `ContactMethod`, `Address` + polymorphic `AddressLink`, plus 4 type lookups. Baseline migration + 5 incremental — **fairly stable**.
- **bizapps-sonar** is at **v0.1** (2 migrations, `Factor.DateField` just added 2026-06-24) — **not frozen**.
- The other 8 composed apps (orders, payments, subscriptions, accounting, committees, tasks, issues, secure-messaging) — **repos not present on this machine**; readiness is the v2 plan's OQ-11 and squarely in Marcelo's lane.

---

## 2. The v2 plan in one screen (what we're generating *into*)

Source: `plans/association-db/v2-plan.md` (+ `work-breakdown.md`, `kickoff-agenda.md`).

**MoreCheese = one installable Open App** composing **10 dependency apps** (bizapps-common, tasks, committees, issues, sonar, secure-messaging, orders, payments, subscriptions, accounting) + **8 custom cheese schemas**:

| Schema | Tables (per plan) |
|---|---|
| `…_Members` | MemberProfile (→ Person), MembershipType, Chapter, ChapterOfficer, MembershipSubscription (→ subscriptions.Subscription) |
| `…_Events` | Event, EventSession, EventRegistration (→ Person), EventSpeaker, EventTrack |
| `…_Learning` | Course, CourseEnrollment, Certification, CertificationRecord, CEEvent, CECredit |
| `…_Forums` | ForumCategory, ForumThread, ForumPost, ForumReaction, ForumModeration |
| `…_Resources` | Resource, ResourceCategory, ResourceDownload, ResourceBookmark |
| `…_Awards` | Product, Competition, CompetitionEntry, Judge, JudgeScore |
| `…_Legislative` | LegislativeBody, LegislativeIssue, LegislativePosition, AdvocacyAction, GovernmentContact, AdvocacyEngagement |
| `…_Marketing` | Campaign, Segment, EmailTemplate, EmailSend, EmailEngagement |

Key structural decisions already made by the plan:

- **Member is a profile, not an identity**: `MemberProfile.PersonID → bizapps-common.Person`; membership *status* lives on `subscriptions.Subscription`, not on the member row.
- **Date semantics fixed** (Robert's v1 pain): `EndDate` = contractual end of current paid period; `RenewalDate` = operational renewal action (last/next). Both always meaningful on active rows.
- **Status invariants** enforced at generation + install-time integrity check (`Active ⟹ EndDate ≥ today`, `Canceled ⟹ CancellationDate NOT NULL`, `Completed event ⟹ EndDate < today`, …).
- **Scale presets**: small ~500 / medium ~2,500 (default) / large ~15,000 persons.
- **50–100 hand-authored hero personas** with stable identities + storylines; generator builds the population *around* them; hero integrity is a release blocker.
- **7 predictive models**, all fed by **Sonar scores** (OQ-9 resolved: Sonar is the canonical engagement substrate; models never re-derive engagement from raw SQL).
- **Release-relative dates** (`OFFSET_DAYS_FROM_RELEASE`) resolved at quarterly release-tag time.
- `IsSharedDemo` flag planned so demo seed data and real morecheese.org production data can coexist (OQ-14).

---

## 3. What the Generative Dataset doc demands of a schema

Madhav's doc defines `Generate(X, S, seed, scale)`: the LLM authors a causal program (`X` = priors, DAG, templates), code executes it in the **joined space** in topological order, with constraints reparameterized so violations are unrepresentable. The schema `S` is fed *into* the authoring prompts from `EntityInfo`/`EntityFieldInfo`. That flips the usual relationship: **the schema is an input contract to the generator**, and its quality directly caps generated-data quality. Extracted requirements:

| # | Generator mechanism | What it needs from the schema |
|---|---|---|
| G1 | Causal DAG over columns (driver / dependent / noise roles) | Exogenous **driver dimensions as real columns** — geography/region, org size, segment/discipline, join date/tenure. Not buried in free text or derivable only by joins the LLM can't see. |
| G2 | Piecewise conditionals per dtype | **Typed columns with declared supports**: money as DECIMAL ≥ 0, counts as INT, ordinals as constrained values. |
| G3 | Value lists → softmax categories; gate F3 rejects invented categories | **Every enum as a CHECK constraint** (CodeGen → TS union → `EntityFieldInfo` value list). No free-text status columns. |
| G4 | Natural-join-by-construction; propensity pairing for M:N | Junction tables as **base relations with real FKs both sides** (EventRegistration, CommitteeMember, CampaignMember…), and **homophily feature columns on both parents** (member region/discipline ↔ event track/topic/location). |
| G5 | Validity-interval carry-down (child timestamps ∈ ∩ of parent windows) | **Explicit Start/End interval columns on every lifecycle entity** (Person activity window, Subscription, Event incl. RegistrationOpen/Close, Enrollment, Committee term, Officer term). |
| G6 | Status as a *view* over (interval, asOf) — makes the v1 bug unrepresentable | Status columns must be **derivable from dates** and constrained to agree with them (CHECK or computed). |
| G7 | Latents (affluence, engagement) expressed through observables | Enough **dependent columns for latents to show through**: tier, dues amount, donation amounts, registration counts, post counts, cert attempts. |
| G8 | Derived signals = deterministic f(behavior), strict DAG sinks | Aggregates/caches (engagement score, AwardCount, Invoice.AmountPaid) clearly separated as **computed-last** fields; ideally owned by the consuming engine (Sonar) rather than the base row. |
| G9 | Keyset pagination demo on high-volume tables | **Single-column orderable PK** on high-volume tables (MJ's `NEWSEQUENTIALID()` default is fine; doc suggests UUIDv7 keyed to event time for generated rows). No composite PKs there. |
| G10 | Content-addressed determinism + hero personas | A **stable organic/business key per entity** (MemberNumber, InvoiceNumber, event slug) so RNG substreams and hero rows survive regeneration with minimal diff. |
| G11 | Migration-as-verifier shipping gate | **Per-row logical constraints emitted as DB CHECKs** so the seed migration self-verifies on a scratch DB (invoice arithmetic, date ordering, status/date agreement). |
| G12 | Fidelity benchmarks | External targets — the v1 demo's **108 queries are ready-made `X.benchmarks`** (renewal rate by type, no-show rate, campaign ROI…). |
| G13 | Text-fill with held-out-fact recoverability | Text columns (Bio, TastingNotes, ForumPost.Body) must sit **next to the structured driver columns** their template slots reference. |
| G14 | Anti-requirement | **Polymorphic links** (`RelatedEntityType` + `RecordID`) defeat FK enforcement and the F2/F8 gates — the generator can still copy real keys, but the DB can't verify. Minimize in the generated surface. |

---

## 4. Grading the existing schemas against those requirements

### v1 `AssociationDemo` (58 tables) — surprisingly good bones, four structural sins

**What v1 already gets right** (worth telling Marcelo — much of v1's *shape* is reusable):
- Rich driver columns exist: `Member.City/State/Country`, `Industry`, `JobFunction`, `YearsInProfession`, `JoinDate`; `Organization` type/size implied; `Chapter.Type` (Geographic/Special Interest/Industry).
- CHECK-constraint enums everywhere (Membership.Status, Event.Status, Invoice.Status, Certification.Status…) — exactly what gates F3/F8 want.
- Junctions are real-FK base relations (EventRegistration, ChapterMembership, CommitteeMembership, CampaignMember).
- Renewal history as multiple `Membership` rows per member — a natural event-driven unroll target.
- Hierarchies via self-ref FKs (ForumCategory, ResourceCategory, ProductCategory) — matches the level-by-level generation path.
- The 108-query library = benchmark suite for free.

**The four structural sins (v1 → must not survive into v2):**
1. **Status/date incoherence is representable**: `Membership.Status='Active'` with past `EndDate` shipped as a real bug. Nothing in the schema forbids it. (G6, G11)
2. **`Member.EngagementScore INT DEFAULT 0` on the base row** — a derived signal stored as if it were a driver; no provenance, no history, silently stale. (G8)
3. **Polymorphic `InvoiceLineItem.RelatedEntityType + RelatedEntityID`** — no FK, no inclusion-dependency check, invisible to the DAG's expanded-graph validation. (G14)
4. **Monolithic identity**: Member mixes identity + employment + engagement + membership; no Person substrate, so cross-app coherence (same human in orders, forums, committees) can't exist. (Fixed by v2's profile pattern.)

Also: seed data is hand-written SQL with `GETDATE()` math — non-reproducible, exactly the "step 4 inverted" failure mode the Generative doc warns about.

### v2 composed architecture — a near-perfect fit, with four seams to watch

The v2 plan *independently* arrives at most of what the generator needs (status on Subscription, profile pattern, invariants, stable heroes). The remaining seams, from the generation angle:

1. **Sonar's `Score.AnchorRecordID` is a stringly-typed soft key** (NVARCHAR, no FK — by design, for entity-agnosticism). Fine, but it means score rows are invisible to FK-based join validation → they must be covered by the post-render audit pass, and the generator must emit them **last** (they're sinks).
2. **bizapps-common's `AddressLink`/`ContactMethod` are polymorphic** (EntityID + RecordID). Same treatment: generator copies real keys; audit pass verifies; don't build causal edges *from* them.
3. **Cross-schema FKs**: the deliberate 8-schema split is good demo theater, but every `PersonID` reference must still be a **declared FK constraint** (SQL Server allows cross-schema FKs) so `EntityInfo` carries the join graph the DAG authoring prompt consumes. Soft "documented-only" links would blind the LLM's `S` input.
4. **Sonar isn't frozen** (v0.1, schema still moving). The generator's derived-signal step depends on `Score`/`ScoreHistory` shape. Mitigation below (§6, D).

---

## 5. What makes sense *for an association* (the domain causal model)

The schema must let the true causal story of an association express itself. This is the DAG skeleton the schema needs columns for — pre-work for the `X`-authoring stage:

**Exogenous drivers** (must be first-class columns):
- `time` — join date, event dates, fiscal periods; regimes: pre-digital / growth / covid / current
- `geography` — Person address region, Chapter region, Event location
- `orgSize` / org type — producer, retailer, educator, supplier (segment)
- `career stage` — YearsInProfession, JobFunction

**Latents** (no columns — they exist only in `X`, expressed through observables):
- `affluence` → org size, membership tier, dues amount, giving, competition entries
- `engagement` → registrations, course completions, forum posts, committee seats, advocacy actions, renewal
- correlated ~+0.4, drawn per-Person from the copula, carried down every join

**Core dependent chains** (each needs its columns + intervals):
- affluence + orgSize + time → **MembershipType/tier** → **dues amount** → order → payment → journal entry
- engagement + tenure → **Renewed?** (the event-driven unroll; each cycle = one Subscription period row)
- engagement + region-match + discipline-match + event popularity → **EventRegistration** (propensity-paired M:N — *the* homophily showcase)
- engagement + career stage → enrollment → completion → **CertificationRecord** → CE credits → renewal
- affluence + engagement → giving propensity → donation orders
- engagement → forum posts/reactions; posts cluster by discipline (text templates per cluster)
- everything above → **Sonar Score** (strict sink) → the 7 predictive models

**Why this matters for reconciliation:** any schema field Marcelo finds in BizApps/v1 that doesn't sit on one of these chains is either (a) a driver we should keep, (b) flavor text we template, or (c) dead weight. And any chain above *missing* its columns in v2 is a schema gap to raise.

---

## 6. Recommendations — the schema asks (generation angle)

These are the concrete asks to bring to the reconciliation with Marcelo, ordered by leverage:

**A. Make the v1 bug class unrepresentable, in the schema itself.**
Status columns on lifecycle tables get CHECK constraints binding them to their dates (or become computed). Per the Generative doc's shipping gate, the seed migration then *self-verifies*: `Status='Active' AND EndDate < GETDATE()` simply cannot load. Cheap, and it protects every future data author, not just our generator.

**B. Every enum is a CHECK constraint; every relationship is a declared FK (including cross-schema).**
This is what makes `S` machine-readable: CodeGen → `EntityFieldInfo` value lists + FK graph → fed into the `X`/DAG authoring prompts (gates F2/F3/F8). Free-text statuses or "documented-only" links blind the generator.

**C. Interval columns everywhere, and children reference parents with overlapping windows.**
`StartDate`/`EndDate` (or Open/Close) on Subscription, Event, Enrollment, Committee membership, Officer/Board terms, Employment, Campaign. This enables validity-interval carry-down: a registration dated before the member joined becomes unrepresentable *by construction*, not by test.

**D. Sonar scores are generated by running Sonar, not by faking Score rows.**
Define the MoreCheese `ScoreModel` + `Factor`s as metadata (config-as-data — Sonar's native idiom), generate the *behavioral* data, then run Sonar's recompute at release time to produce `Score`/`ScoreHistory`. This (1) keeps the derived signal a true deterministic f(behavior) per the doc, (2) exercises Sonar itself in the demo, and (3) **insulates us from Sonar's unfrozen schema** — we depend on its engine contract, not its table shape. The 7 predictive models then train on real signal.

**E. Homophily features must exist on both sides of every M:N.**
Member side: region (via Person address / Chapter), discipline/segment (producer/retailer/educator/supplier), career stage. Event side: `EventTrack`/topic, location/region, capacity (popularity proxy). Without these columns, propensity pairing degenerates to a uniform bipartite graph — flat cross-tabs, dead dashboards (the doc's named failure mode). v2's `EventTrack` table is good; make sure Track/topic is also on sessions and that MemberProfile carries segment/discipline.

**F. Organic business keys on every generated entity.**
`MemberNumber`, `InvoiceNumber`, event slug, cert number. These are the content-addressing keys for deterministic regeneration (same member → same substream → minimal diffs between quarterly releases) and the anchor for **hero personas** (heroes are pinned business keys; the generator builds around them). Also give high-volume tables (EmailSend, ForumPost, ScoreHistory, Transaction) single-column orderable PKs for the keyset-pagination showcase.

**G. Quarantine polymorphic links; never build causal edges from them.**
`AddressLink`, `ContactMethod`, any surviving `RelatedEntityType` pattern: the generator copies real keys into them (inclusion dependency 1.0 by construction) but they're excluded from the DAG and covered by the post-render audit pass instead of FK checks. Prefer typed junctions in the *custom* cheese schemas — reserve polymorphism for the bizapps-common substrate where it already exists.

**H. Derived/denormalized fields are sinks, computed in a hard phase order.**
Anything like v1's `Member.EngagementScore`, `Product.AwardCount`, `Invoice.AmountPaid/Balance`: computed after behavioral generation (defects → repairs → caches → signals), never inputs to other columns. Where kept as columns, add the arithmetic CHECKs (`Total = SubTotal + Tax − Discount`, `Balance = Total − AmountPaid`) so the migration gate catches drift.

**I. Adopt the v1 query library as the benchmark suite.**
Port the 108 queries to v2 entity names; they become `X.benchmarks` + the leave-one-out fidelity targets. The old demo's analytical questions are exactly the signal the new data must carry — this is also the natural v1→v2 acceptance test.

**J. Text columns stay adjacent to their structured facts.**
Bio next to JoinDate/segment/tier; TastingNotes next to MilkSource/AgeMonths/IsOrganic; forum post bodies in threads that carry discipline/topic. Templates are authored per cluster and instantiated with row facts — the held-out-fact embedding test depends on this adjacency.

---

## 7. Open questions / gaps (for the reconciliation with Marcelo)

1. **Readiness of the other 8 composed apps** (orders, payments, subscriptions, accounting, committees, tasks, issues, secure-messaging): repos aren't on this machine; only bizapps-common (stable) and bizapps-sonar (v0.1, moving) were inspectable. The v2 plan's whole timeline hangs on OQ-11 — Marcelo's BizApps survey should answer schema-by-schema.
2. **Subscription table shape**: the entire membership-status story now lives on `subscriptions.Subscription`. We need its actual columns (Status values? Start/End/CancellationDate? tier-change history?) before the invariant CHECKs and the renewal unroll can be designed.
3. **Orders/payments/accounting join semantics**: dues → Order → Transaction → JournalEntry is the accounting-identity chain (Tier-2 repair constraints). Need the real FK shapes.
4. **Does generation target v2-composed schemas only, or also refresh v1?** Recommendation: v2 only; v1 is frozen as the benchmark/mapping source (its 58 tables → `V1_TO_V2_ENTITY_MAPPING.md`).
5. **Sonar freeze date** — or explicit agreement that we depend on Sonar's *engine contract* (recommendation D), so its table churn doesn't block us.
6. **`IsSharedDemo` flag (OQ-14)**: needs to be on every generated table if morecheese.org runs real production data alongside demo data — this is a schema-wide column ask that should go in *now*, not retrofitted.
7. **Where the generator lands**: per the Generative doc Part XIV, as a Remote Operation (`RunCausalModel(X, scale, seed)`) with `packages/DataGen/datagen-core` as the first slice. Out of scope for the schema reconciliation but sets what `S` must expose (EntityInfo-complete metadata — which is recommendations B + G).

---

## 8. Source map

| Artifact | Location |
|---|---|
| Generative Dataset strategy (Madhav) | provided doc (this analysis's §3 extracts it) |
| MoreCheese v2 plan | `MJ-morecheese/plans/association-db/v2-plan.md` |
| Work breakdown / kickoff | `MJ/plans/association-db/{work-breakdown,kickoff-agenda}.md` |
| v1 AssociationDB schema | `MJ-morecheese/Demos/AssociationDB/schema/V001–V008*.sql` |
| v1 seed data | `MJ-morecheese/Demos/AssociationDB/data/00–11*.sql` |
| v1 query/benchmark library | `MJ-morecheese/Demos/AssociationDB/metadata/queries/` |
| Sonar schema (14 tables) | `Blue Cypress/Sonar Dev/bizapps-sonar/migrations/V202606121005__v0.1.x_Initial_Schema.sql` (+ `V202606241200__…Factor_DateField.sql`) |
| Sonar architecture | `Blue Cypress/Sonar Dev/bizapps-sonar/plans/plan.md` |
| bizapps-common schema (11 tables) | `Blue Cypress/Sonar Dev/bizapps-common/migrations/B202602271452__v1.0.x_Schema_and_Tables.sql` |
| Earlier association DB plan | `MJ-morecheese/plans/complete/association-sample-database.md` |
