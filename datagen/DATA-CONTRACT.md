# MoreCheese Data Contract — what is generated, where it lands, how it works

The integration-facing reference: everything another team needs to consume, join against,
or reload the generated dataset **without reading the generator's code**. Facts below are
extracted from the live emitters and the canonical build (seed 42 · 2,500 members ·
release 2026-07-31). Companion docs: [`INTEGRATION-RUNBOOK.md`](INTEGRATION-RUNBOOK.md) (install
sequence + findings), [`BIZAPPS-COVERAGE.md`](BIZAPPS-COVERAGE.md) (verification evidence),
[`SCHEMA-CONTRACT.md`](SCHEMA-CONTRACT.md) (the shapes we depend on and how they are captured).

---

> Delivery: how these rows reach a database — the metadata-first ruling, the pinned `platform`
> exception, and which artefacts are generated vs captured — is in [`DELIVERY.md`](DELIVERY.md).

## 1. The generation model, in four sentences

Generation is a **pure function of (ruleset, seed, scale, releaseDate)** — no clock, no
network, no AI at generation time; the same inputs regenerate **byte-identical** output.
A causal model (hidden engagement/affluence dials + declared effect arrows) draws every
fact in dependency order, calibrated so cohort averages land exactly on sourced benchmarks.
A **335-gate** validator re-measures the finished data (benchmarks, variance floors,
causal-arrow recovery, hero pins, referential closure) and the build fails on any miss.
The output is dealt into **12 per-app packs** (JSON), then emitted as SQL seed scripts and
an mj-sync metadata tree — both load paths produce **identical rows**.

## 2. The identity contract (how every ID derives — compute any row's ID yourself)

```
ID = uuidv5( namespace = 9b1dcbf2c05341e8a2f4d40e11ce66a1,
             name      = "<entityPrefix>:<businessKey>" )
```

Same entity → same ID in every build, every database, forever. FKs are derived
**independently** by parent and child — referential integrity by construction, and
reloads are stable upserts. The namespace is MoreCheese's own (frozen; a second demo app
must mint its own).

| Prefix | Business key format | Example key | Lands in |
|---|---|---|---|
| `person` | MemberNumber (members) \| `NM-2xxxxx` (non-members) | `ICF-100217`, `NM-200042` | `__mj_BizAppsCommon.Person` |
| `org` | OrgKey | `ORG-0042` (heroes: `ORG-H101`) | `__mj_BizAppsCommon.Organization` |
| `rel` | `emp:<member>` \| `story:<type>:<from>` | `emp:ICF-100217` | `__mj_BizAppsCommon.Relationship` |
| `reltype` | demo type name | `Mentor` | `__mj_BizAppsCommon.RelationshipType` (demo-owned rows only) |
| `address` | `person:<member>` \| `org:<orgKey>` | `person:ICF-100217` | `__mj_BizAppsCommon.Address` |
| `addresslink` | same key as its address | `org:ORG-0042` | `__mj_BizAppsCommon.AddressLink` (polymorphic owner) |
| `contactmethod` | `<owner>:<ContactType name>` | `person:ICF-100217:Mobile Phone` | `__mj_BizAppsCommon.ContactMethod` |
| `memberprofile` | MemberNumber | `ICF-100217` | `morecheese_members.MemberProfile` |
| `orgprofile` | OrgKey | `ORG-0042` | `morecheese_members.OrganizationProfile` |
| `period` | PeriodKey `<member>-P<n>` | `ICF-100217-P3` | `morecheese_members.MembershipPeriod` |
| `event` | EventKey | `EVT-2025-CONF` | `morecheese_events.Event` |
| `reg` | RegKey `REG-<member>-<event>[-i]` | `REG-ICF-100217-EVT-2025-CONF` | `morecheese_events.EventRegistration` |
| `course` / `enroll` | CourseKey / EnrollKey | — | `morecheese_learning.*` |
| `product` / `order` / `line` / `payment` | ProductKey / OrderKey / LineKey / PaymentKey | orders: `ORD-D-<period>` dues, `ORD-R-<member>` open renewal, `ORD-E-<reg>` event | `morecheese_orders.*` |
| `ctype` / `crole` | name | `Chair` (see §5 — app-seeded roles are referenced by NAME, not by this ID) | `__mj_BizAppsCommittees.Type/Role` |
| `committee` | committee name | `Standards Committee` | `…Committee` |
| `cterm` | `<committee>:<termStart>` | `Standards Committee:2025-01-01` | `…Term` |
| `cmembership` | `<member>:<committee>:<termStart>` | — | `…Membership` |
| `meeting` | `<committee>:<date>` | `Food Safety Committee:2025-10-15` | `…Meeting` |
| `att` / `agenda` / `motion` / `vote` | `<member>:<meeting>` / `<meeting>:<seq>` / `<meeting>:m1` / `<motion>:<membership>` | — | `…Attendance/AgendaItem/Motion/Vote` |
| `form` / `formver` / `formpage` / `formq` | `post-conf-survey` (+`:1`, `:p1`, `:<qkey>`) | `post-conf-survey:nps` | `__mj_BizAppsForms.*` |
| `formdist` / `formresp` / `formans` | `post-conf-survey:<year>` / `<dist>:<member>` / `<resp>:<qkey>` | — | `…FormDistribution/Response/ResponseAnswer` |
| `tasktype` / `task` | name / `ctask:<meeting>:<i>` \| `otask:<member>` | `otask:ICF-000102` (Marcus) | `__mj_BizAppsTasks.TaskType/Task` |
| `taskassign` / `tasklink` | `<task>:<member>` / `<task>:link` | — | `…TaskAssignment/TaskLink` |
| `issuetype` / `issuestatus` | name | `Billing` (statuses: see §5) | `__mj_BizAppsIssues.IssueType/IssueStatus` |
| `issue` | `billing:<member>` \| `datafix:<member>` \| `refund:<reg>` \| `dedup:<member>` | `dedup:ICF-000111` | `…Issue` |
| `issuecomment` | `<issue>:c<n>` | `datafix:ICF-100371:c0` | `…IssueComment` |
| `advocacy` | `<member>:<year>:<n>` | `ICF-100019:2017:0` | `morecheese_members.AdvocacyAction` |
| `dqlabel` | `<defectKind>:<key>` | `dup:ICF-D00467` | `morecheese_members.DataQualityLabel` |
| `compentry` | `<member>:<year>:<n>` | `ICF-000104:2026:0` | `morecheese_events.CompetitionEntry` |
| `cert` / `membercert` | CertKey / `<member>:<cert>` | `CERT-FOUNDATION`, `ICF-101750:CERT-FOUNDATION` | `morecheese_learning.*` |
| `formqopt` | `<form>:<qkey>:<n>` | `membership-application:segment:0` | `__mj_BizAppsForms.FormQuestionOption` |
| `thread` / `secmsg` / `psession` | `thread:<issue>` / `<thread>:<n>` / `<thread>` | `thread:datafix:ICF-101132` | `morecheese_members.SecureThread/SecureMessage/PortalSession` |
| `mjuser` / `mjuserrole` | staff key / `<staff>:<role>` | `membership-director`, `membership-director:UI` | `__mj.User/UserRole` |
| `uview` / `list` / `listitem` | view name / list name / `<list>:<member>` | `pending-renewals`, `renewal-outreach:ICF-000102` | `__mj.UserView/List/ListDetail` |
| `fav` / `notif` / `query` | `fav:<staff>:<key>` / `notif:<n>` / query name | `fav:membership-director:ICF-000101` | `__mj.UserFavorite/UserNotification/Query` |
| `conv` / `convmsg` | conversation name / `<conv>:<n>` | `at-risk-review:0` | `__mj.Conversation/ConversationDetail` |
| `recchg` | `rc:<entity>:<key>:<what>` | `rc:issue:datafix:ICF-100371:resolved` | `__mj.RecordChange` |
| `sonarmodel` / `sonarver` | model name / `<model>:<n>` | `morecheese-engagement:1` | Sonar `ScoreModel/ScoreModelVersion` |
| `sonarfactor` / `sonarmf` | factor name / `<model>:<factor>` | `morecheese-engagement:event-attendance` | Sonar `Factor/ModelFactor` |
| `sonarmre` | `<model>:<relatedEntity>` | `morecheese-engagement:registrations` | Sonar `ModelRelatedEntity` |
| `sonarband` / `sonarbandset` | band name / band-set name | `at-risk`, `engagement-bands` | Sonar `ScoreBand/ScoreBandSet` |
| `sonarwindow` | window code | `w12m` | Sonar `TimeWindow` |

### Members and non-members share the Person namespace

A **member** is a Person WITH a `morecheese_members.MemberProfile` row. A **non-member** —
prospect, free-webinar attendee, colleague of a member — is a Person with **no MemberProfile**.
There is no flag and no schema change: the v2 identity/membership split already carries the
distinction, and the emitters honour it with an `only:` filter on the MemberProfile mappings
(`IsProspect` exists only inside the packs, never in a database column).

Consequences worth knowing before writing a query or a gate:

- `Person` count > `MemberProfile` count, always. At the canonical build: 3,058 vs 2,109.
- Non-member person keys are `NM-2xxxxx`, so they never collide with a member number.
- Non-members carry identity (name, email, address, contact methods, an employment
  Relationship edge) and almost no voluntary self-ID — they never filled in a member profile.
- Nothing membership-shaped may reference one: no MembershipPeriod, no order, no paid event
  registration. Free-event registrations are the exception, and they are the funnel.
- The validator names the two populations apart at load (`people`/`regs` mean MEMBERS,
  `prospects`/`prospectRegs` mean non-members) so every membership benchmark keeps its
  original meaning.

## 3. The packs (load order, dependencies, canonical volumes @ seed 42 / n=2500)

Volumes below are the live counts from the canonical build, not remembered ones — regenerate with
`node cli/build.mjs --n 2500 --seed 42 --release 2026-07-31` and they reproduce exactly.

| # | Pack | → Target schema(s) | dependsOn | Tables → rows |
|---|---|---|---|---|
| 01 | common | **`__mj_BizAppsCommon`** (Person, Organization, Relationship, RelationshipType, Address, AddressLink, ContactMethod) **+ `morecheese_members`** (MemberProfile, OrganizationProfile — the split: one pack, two schemas) | — | people 3,058 · organizations 641 · relationships 2,805 · relationship_types 4 · addresses 3,191 · address_links 3,191 · contact_methods 7,623 |
| 02 | membership | `morecheese_members` | common | membership_periods 8,024 · advocacy_actions 1,007 · data_quality_labels 48 |
| 03 | events | `morecheese_events` | common, membership | events 170 · event_registrations 19,124 · competition_entries 423 |
| 04 | learning | `morecheese_learning` | common, membership | courses 111 · enrollments 4,855 · certifications 7 · member_certifications 123 |
| 05 | orders | `morecheese_orders` (stand-in for bizapps-orders) | common, membership, events | products 16 · orders 17,555 · order_lines 19,461 · payments 18,056 |
| 06 | committees | **`__mj_BizAppsCommittees`** | common, membership | types 2 · roles 3 · committees 6 · terms 35 · memberships 287 · meetings 294 · attendance 2,189 · agenda_items 1,191 · motions 95 · votes 741 |
| 07 | forms | **`__mj_BizAppsForms`** | common, events | forms 2 · versions 2 · pages 2 · questions 8 · question_options 5 · distributions 15 · responses 869 · answers 2,760 |
| 08 | tasks | **`__mj_BizAppsTasks`** | common, membership, committees | task_types 2 · tasks 229 · assignments 229 · links 229 |
| 09 | issues | **`__mj_BizAppsIssues`** | common, events, orders | issue_types 4 · issue_statuses 4 · issues 133 · issue_comments 268 · sequences 1 |
| 10 | messaging | `morecheese_members` (portal + secure messaging) | common, issues | secure_threads 50 · secure_messages 238 · portal_sessions 50 |
| 11 | platform | **`__mj`** (core platform records — the one pinned non-metadata-first exception, see [`DELIVERY.md`](DELIVERY.md)) | common, membership, events, tasks, issues | mj_users 3 · mj_user_roles 3 · user_views 8 · user_favorites 9 · user_notifications 8 · lists 3 · list_details 77 · queries 7 · conversations 3 · conversation_details 8 · record_changes 425 |
| 12 | sonar | Sonar scoring metadata | common, events, learning, committees, forms, platform | score_models 1 · score_model_versions 1 · factors 10 · model_factors 10 · model_related_entities 10 · score_bands 4 · score_band_sets 1 · time_windows 2 |

**Pack ≠ schema:** a pack is an app-shaped *bundle of data* (the D9 install unit); the
schema is where its rows land. Five packs target dependency-app schemas (bold), the rest
target our `morecheese_*` schemas or Sonar's, and `common` deliberately spans both — that's the
Person/Org identity split. Per-table detail is the "Lands in" column in §2.

Total **120,029 rows** at the canonical build. One person splits at emit into a bizapps-common
`Person` (identity: name, Title, deterministic `<first>.<last>.<digits>@example.com` email, Status)
+ a `MemberProfile` (member number, segment, geography, join date) — same story for orgs.

## 4. How each domain's data is derived (so integrators know what correlates with what)

Everything observable descends from two hidden per-member dials — **engagement (θ)** and
**affluence (φ)**, correlated 0.4 — plus declared causal arrows, calibrated so cohort
averages hit sourced targets (renewal 87%, conference attendance 35%, …):

- **Renewals**: yearly per-member decision; tenure/engagement push up, employer lifecycle
  events push down; COVID years dent everyone (2020–21). Lapse > 2mo grace ⇒
  CancellationDate + reason.
- **Events/learning/committees/surveys/tasks**: participation, attendance, completion,
  response, and action-item outcomes all ride θ — so *cross-app engagement signals agree
  about who the engaged members are* (this is what Sonar should recover).
- **Money**: one order per billable fact; payment timing per declared profiles (auto-pay
  on due date, net-30 for business tiers with the sourced late curve). Payments dated
  after the release date don't exist → real Unpaid/Overdue rows.
- **Issues**: derived from real facts (overdue orders, employer events, paid no-shows).
- **16 hero personas** are pinned facts, not draws (Marcus's pending renewal, Danielle's
  employer-dissolution lapse, Gwen's committee chair, the Kate/Kathy duplicate pair…).
- All rows carry `IsSharedDemo = 1` on OUR tables (never on bizapps-common's — identify
  demo people via the MemberProfile join).

## 5. Load rules (the ones that bite — from the integration spike)

1. **Order matters**: packs 01→12, and `_install-order.txt` in every build is the authority —
   the emitters derive it from each pack's declared `dependsOn`, so it cannot drift from the data.
   Packs 08/09 (and `platform`, `sonar`) only **after** CodeGen has registered entities (their
   preambles resolve entity NAMES → this DB's `__mj.Entity` IDs).
2. **Polymorphic references** (task assignees/links, issue sources) always resolve by
   entity name at load — never trust a hardcoded entity ID across databases.
3. **App-seeded lookups are referenced by NAME**: committees seeds its Roles, issues seeds
   its Statuses, common seeds RelationshipTypes. Our packs must not insert name-colliding
   rows and must FK to *their* IDs (lookup-by-name DECLARE pattern; emit-side patch is the
   first integration-phase change). Additive lookup rows (our IssueTypes, committee Types,
   Mentor/Duplicate Of relationship types) are fine.
4. **Reload = wipe-and-recreate or stable upsert** — same IDs every time; mj-sync push
   full-reconciles per entity scope (dev DBs only).
5. **Regenerating with a different seed/scale/date is a different universe** — never mix
   packs from different runs (`run.json` in every output records project/seed/n/release).
