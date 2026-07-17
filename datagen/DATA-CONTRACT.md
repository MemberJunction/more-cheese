# MoreCheese Data Contract — what is generated, where it lands, how it works

The integration-facing reference: everything another team needs to consume, join against,
or reload the generated dataset **without reading the generator's code**. Facts below are
extracted from the live emitters and the canonical build (seed 42 · 2,500 members ·
release 2026-07-31). Companion docs: `INTEGRATION-RUNBOOK.md` (install sequence + findings),
`BIZAPPS-COVERAGE.md` (verification evidence), `SCHEMA-BRIEF-2026-07-16.md` (the one-pager).

---

## 1. The generation model, in four sentences

Generation is a **pure function of (ruleset, seed, scale, releaseDate)** — no clock, no
network, no AI at generation time; the same inputs regenerate **byte-identical** output.
A causal model (hidden engagement/affluence dials + declared effect arrows) draws every
fact in dependency order, calibrated so cohort averages land exactly on sourced benchmarks.
A ~73-gate validator re-measures the finished data (benchmarks, variance floors,
causal-arrow recovery, hero pins, referential closure) and the build fails on any miss.
The output is dealt into **9 per-app packs** (JSON), then emitted as SQL seed scripts and
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
| `person` | MemberNumber | `ICF-100217` | `__mj_BizAppsCommon.Person` |
| `org` | OrgKey | `ORG-0042` (heroes: `ORG-H101`) | `__mj_BizAppsCommon.Organization` |
| `rel` | `emp:<member>` \| `story:<type>:<from>` | `emp:ICF-100217` | `__mj_BizAppsCommon.Relationship` |
| `reltype` | demo type name | `Mentor` | `__mj_BizAppsCommon.RelationshipType` (demo-owned rows only) |
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

## 3. The packs (load order, dependencies, canonical volumes @ seed 42 / n=2500)

| # | Pack | → Target schema(s) | dependsOn | Tables → rows |
|---|---|---|---|---|
| 01 | common | **`__mj_BizAppsCommon`** (Person, Organization, Relationship, RelationshipType) **+ `morecheese_members`** (MemberProfile, OrganizationProfile — the split: one pack, two schemas) | — | people 1,998 · organizations 637 · relationship_types 2 · relationships 1,580 |
| 02 | membership | `morecheese_members` | common | membership_periods 8,009 |
| 03 | events | `morecheese_events` | common, membership | events 164 · event_registrations 17,686 |
| 04 | learning | `morecheese_learning` | common, membership | courses 111 · enrollments 4,750 |
| 05 | orders | `morecheese_orders` (stand-in for bizapps-orders) | common, membership, events | products 6 · orders 17,484 · order_lines 17,484 · payments 17,411 |
| 06 | committees | **`__mj_BizAppsCommittees`** | common, membership | types 2 · roles 3 · committees 4 · terms 8 · memberships 113 · meetings 60 · attendance 837 · agenda_items 260 · motions 20 · votes 287 |
| 07 | forms | **`__mj_BizAppsForms`** | common, events | form 1 · version 1 · page 1 · questions 3 · distributions 14 · responses 830 · answers 2,356 |
| 08 | tasks | **`__mj_BizAppsTasks`** | common, membership, committees | task_types 2 · tasks 96 · assignments 96 · links 96 |
| 09 | issues | **`__mj_BizAppsIssues`** | common, events, orders | issue_types 4 · issue_statuses 4 · issues 105 · sequences 1 |

**Pack ≠ schema:** a pack is an app-shaped *bundle of data* (the D9 install unit); the
schema is where its rows land. Four packs target dependency-app schemas (bold), four
target our `morecheese_*` schemas, and `common` deliberately spans both — that's the
Person/Org identity split. Per-table detail is the "Lands in" column in §2.

Total ≈ **90,000 rows**. One person splits at emit into a bizapps-common `Person`
(identity: name, Title, deterministic `<first>.<last>.<digits>@example.com` email, Status)
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
- **13 hero personas** are pinned facts, not draws (Marcus's pending renewal, Danielle's
  employer-dissolution lapse, Gwen's committee chair, the Kate/Kathy duplicate pair…).
- All rows carry `IsSharedDemo = 1` on OUR tables (never on bizapps-common's — identify
  demo people via the MemberProfile join).

## 5. Load rules (the ones that bite — from the integration spike)

1. **Order matters**: packs 01→09; packs 08/09 only **after** CodeGen has registered
   entities (their preambles resolve entity NAMES → this DB's `__mj.Entity` IDs).
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
