# MoreCheese — Schema & Migrations Brief (meeting, 2026-07-16)

One-page answers first; supporting detail after. Everything here is **verified against a
running database** (`MC_Integration` on the dev SQL Server — the full stack installed from
the apps' real migrations on 2026-07-15), not design intent.

---

## The headline answers

**Q: Can we generate migrations?**
**A: Yes — and we already did, exactly once, on purpose.** The generator's proven table
shapes were converted into the app's baseline migration
(`migrations/B202607141200__v1.0.0_MoreCheese_Baseline.sql`, MJ conventions: CHECK
constraints, UNIQUE business keys, MS_Description on every column, the Explorer app
record). From that moment **migrations own the shapes** — immutable, additive-only,
hand-authored `V*` files for every future change. The generator never emits another
migration; a suite drift-guard fails the build if generator and migration ever disagree.
And we only ever generate migrations for **our own schemas** — every other app ships its
own (that's the MJ convention: schema DDL lives in the owning app's migrations, full stop).

**Q: How many schemas?**
**A: 4 ours + 5 dependencies = 9 app schemas** (plus MJ core `__mj`, plus `__mj_BizAppsSonar`
if Sonar is installed — a consumer, it needs nothing from us).

**Q: What creates what?**
**A: Four creators, strict order:** the app installer creates each app's home schema (from
its manifest) → each app's **migrations** create its tables/constraints/seeds → **CodeGen**
adds the MJ layer (entity registrations, audit columns, views, CRUD procs) → **datagen**
loads the demo rows. Data is the only thing we produce at demo time; everything structural
is installed, not generated.

---

## The 9 schemas, exactly

| # | Schema | Owner | Created by | Contents (demo) |
|---|---|---|---|---|
| 1 | `morecheese_members` | **us** (home schema) | our manifest (`createIfNotExists`) + our baseline migration | MemberProfile, OrganizationProfile (extensions of Person/Org), MembershipPeriod |
| 2 | `morecheese_events` | us | our baseline migration | Event, EventRegistration |
| 3 | `morecheese_learning` | us | our baseline migration | Course, CourseEnrollment |
| 4 | `morecheese_orders` | us | our baseline migration | Product, Order, OrderLine, Payment — **sanctioned stand-in** until bizapps-orders ships its Subscription model |
| 5 | `__mj_BizAppsCommon` | bizapps-common | its install + 6 migrations | Person (identity incl. Title/Email), Organization, Relationship(+Types) — our people/orgs/relationships live HERE |
| 6 | `__mj_BizAppsTasks` | bizapps-tasks | its install + 4 migrations | our committee action items + renewal-outreach tasks (polymorphic assignees) |
| 7 | `__mj_BizAppsCommittees` | bizapps-committees | its install + 4 migrations | committees, terms, memberships, meetings, attendance, agendas, motions, votes |
| 8 | `__mj_BizAppsForms` | bizapps-forms | its install + 2 migrations | the post-conference NPS survey: distributions, responses, answers |
| 9 | `__mj_BizAppsIssues` | bizapps-issues | its install + 5 migrations | support tickets derived from real facts (billing, data fixes, refunds, the dedup report) |

Demo volume across them: **~90,000 rows** at the canonical scale (2,500 members, seed 42),
deterministic — same inputs regenerate byte-identical data.

## The 9 data packs (what loads where, in order)

A **pack** is the install unit — an app-shaped bundle of generated data. Four packs load
into dependency-app schemas, four into ours, and `common` deliberately spans both (the
Person/Org identity split). Canonical volumes at 2,500 members, seed 42:

| # | Pack | → Lands in | Rows |
|---|---|---|---|
| 01 | common | `__mj_BizAppsCommon` (Person 1,998 · Organization 637 · Relationships 1,580 + types) **and** `morecheese_members` (Member/Org profiles) | ~4,200 (+2,635 profiles) |
| 02 | membership | `morecheese_members` | 8,009 periods |
| 03 | events | `morecheese_events` | 164 events · 17,686 registrations |
| 04 | learning | `morecheese_learning` | 111 courses · 4,750 enrollments |
| 05 | orders | `morecheese_orders` (orders stand-in) | 17,484 orders + lines · 17,411 payments |
| 06 | committees | `__mj_BizAppsCommittees` | 113 memberships · 60 meetings · 837 attendance · 260 agenda items · 20 motions · 287 votes |
| 07 | forms | `__mj_BizAppsForms` | 1 survey · 14 distributions · 830 responses · 2,356 answers |
| 08 | tasks | `__mj_BizAppsTasks` | 96 tasks + assignments + links |
| 09 | issues | `__mj_BizAppsIssues` | 105 tickets + 4 types · 4 statuses |

Load order = the numbers; packs 08–09 load after CodeGen (they resolve entity names at
load time). Total ≈ **90,000 rows**.

## The interface (how the pieces connect)

- **App manifest (`mj-app.json`)** — the formal contract: our app declares
  `morecheese_members` as home schema and **dependencies** on `mj-bizapps-common`,
  `mj-committees`, `mj-bizapps-forms` with version ranges → install order is guaranteed,
  so every FK target exists before our migration runs.
- **Hard FK constraints into dependency schemas** (the linking ruling): our MemberProfile,
  MembershipPeriod, EventRegistration, CourseEnrollment, Order all FK
  `__mj_BizAppsCommon.Person(ID)` — real constraints, verified trusted at load.
- **Deterministic identity** — every row's UUID is uuidv5 of its business key
  (`person:ICF-100217`), so parent and child derive the same ID independently. This is
  what makes cross-app joins line up by construction and reloads upsert the same rows.
- **Polymorphic references** (tasks assignees, issue sources) — carry an ENTITY NAME +
  record UUID, resolved to that database's `__mj.Entity` ID at load time (never
  hardcoded — entity IDs differ per install).
- **Entity naming** — each app's prefix, verified against CodeGen output: `MoreCheese: `,
  `MJ_BizApps_Common: `, `Committees: `, `MJ_BizApps_Forms: `, `MJ_BizApps_Tasks: `,
  `MJ_BizApps_Issues: `.
- **Lookup rows the apps seed themselves** (committees' Roles, issues' Statuses,
  common's RelationshipTypes): referenced **by name** at load; we insert only lookup rows
  the apps don't ship. Their seeds win — always.

## What our schema needs (prerequisites, verified 2026-07-15)

1. An MJ core new enough for the **newest** dependency (v5.45+ — committees' latest
   metadata-sync requires it; there's a one-line probe query in the runbook).
2. The three dependency apps installed first (manifest guarantees this on a real install).
3. CodeGen run once after our migration (registers our 27 entities; dependency schemas are
   theirs and must be excluded from our run).
4. Then data loads: packs 01→09 in order.

## Status & evidence

- Baseline migration **applied and proven** on a fresh clone: all constraints live, all
  90k rows loaded through them, zero violations.
- Full dependency install proven: **all 21 real app migrations green**, our data verified
  through THEIR generated views (e.g. Gwen Whitfield's committee attendance renders via
  bizapps-committees' own `vwAttendances`).
- Open items: bizapps-orders decomposition (their app is pre-implementation — our orders
  stand-in is the agreed plan of record), the emit lookup-by-name patch (small, designed),
  and running the app UIs/Sonar over the integration DB (the team session).

*Per-table column reference: `PACK-SCHEMAS-2026-07-16.md`; generation mechanics + OpenApp tie-in: `BIZAPPS-GENERATION-DETAIL-2026-07-16.md` (both in this folder). Deep dives: `datagen/BIZAPPS-COVERAGE.md` (per-app matrix + verification),
`datagen/INTEGRATION-RUNBOOK.md` (install sequence + the 7 findings),
`migrations/B202607141200__v1.0.0_MoreCheese_Baseline.sql` (the schema itself).*
