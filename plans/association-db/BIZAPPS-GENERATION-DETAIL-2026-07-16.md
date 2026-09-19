# How BizApps Data & Schema Generation Works — and how OpenApp integration ties it together

Companion to `SCHEMA-BRIEF-2026-07-16.md`. This is the mechanics document: exactly how the
generator produces data *for schemas it doesn't own*, how those schemas come to exist in
each kind of environment, and what the MJ OpenApp machinery contributes. Everything stated
was verified on live databases (2026-07-13 → 07-15).

---

## 1. The core principle: we generate DATA for their schemas, never their schemas

For every dependency app (bizapps-common, -committees, -forms, -tasks, -issues) there is
exactly one source of truth for table shapes: **that app's own baseline migration** in its
public repo. The generator's emit layer holds a *mapping* — pack row → their table &
columns — hand-built by reading those baselines, and three mechanisms keep that mapping
honest rather than hopeful:

1. **Shape fidelity** — the emit mapping's columns/types were copied from their migration
   files (each cited in `datagen/BIZAPPS-COVERAGE.md`), and our emitted values were
   verified against *their* CHECK constraints (15/15 conformant) — so our rows satisfy
   their tables' rules even before those rules are enforced.
2. **Name fidelity** — entity names we assume ("Committees: Attendances",
   "MJ_BizApps_Forms: Form Responses"…) were verified to match what CodeGen actually
   mints under each app's own naming config — all 27+ exact.
3. **Identity fidelity** — every row ID is `uuidv5(namespace, "prefix:businessKey")`,
   so our Person row and every FK to it (from any pack, any app) derive the same UUID
   independently. Cross-app joins are correct by construction.

## 2. How the bizapps SCHEMAS exist — two modes, deliberately

**Real mode (the OpenApp path — what integration uses).** Schemas come from *installing
the apps*. `mj install` reads each app's `mj-app.json`: creates its schema
(`createIfNotExists`), applies its migrations in order (tables, constraints, extended
properties, its Explorer Application record), including its **metadata-sync migrations**,
which register the app's entities in `__mj.Entity` *with pinned IDs* and seed its lookup
tables (committees' 8 Roles, issues' 7 Statuses, common's 14 RelationshipTypes). Nothing
of ours is involved. Proven: all 21 real dependency migrations applied green on a
v5.45-core database.

**Playground mode (the dev shim — no app installs).** `datagen/cli/emit-schema.mjs`
produces `00_schema.sql`: IF-guarded stand-in tables using the apps' REAL column shapes,
plus their RelationshipType seed rows (their pinned IDs, `IF NOT EXISTS`). The guards make
the whole file inert wherever a real app is installed — the same seed packs load either
way. This mode exists so anyone can stand up a throwaway demo DB in minutes; it never
ships and is drift-guarded in the test suite.

The one asymmetry between modes: **CodeGen scope.** In playground mode our CodeGen run
registers the dependency entities too (config name-rules mirror each app's own prefix).
In real mode those entities already exist from the apps' metadata-syncs, so dependency
schemas must be *excluded* from our CodeGen run — their apps own their registrations.
(Formalizing these as two config profiles is a known TODO from the integration spike.)

## 3. How the bizapps DATA is generated — one world, partitioned late

The generator never "generates for an app." It generates **one causally-consistent world**
(people with hidden engagement/affluence dials, orgs with lifecycle events, a decade of
renewals/events/learning/money, calibrated to sourced benchmarks and validated by ~73
gates) — and only at the **last step** deals the finished rows into 9 app-shaped packs
(the D9 "cook once, portion last" rule). That's why one person is consistent everywhere:
the same underlying record becomes a bizapps-common Person, a MemberProfile, committee
memberships, survey answers, tasks, and tickets.

Per-app derivations (what drives what):
- **common** — identity fields split off each person/org at emit (name, title, RFC-2606
  email, org Status mapping Dissolved→their CHECK value); Relationship edges derive from
  employment (+ authored story links: mentorship, the dedup ground truth, the acquisition).
- **committees** — engaged members volunteer (the engagement dial); meetings run
  quarterly; attendance is calibrated; motions carry per-membership votes that are
  attendance-consistent *by construction* (absent members vote Absent).
- **forms** — attendees answer the post-conference survey at a calibrated rate; answer
  values ride the same engagement dial as renewal, so NPS↔churn correlation *emerges*
  (lapsed respondents mean 6.14 vs renewed 7.34 — never authored directly).
- **tasks** — completed meetings spawn action items (their design's own replacement for
  committee ActionItems); every PendingRenewal member gets an outreach task.
- **issues** — tickets derive from real facts: overdue orders, employer lifecycle events,
  paid no-shows, plus the authored duplicate-record report.

Two load-time rules protect their ownership:
- **App-seeded lookup rows are referenced BY NAME** (their Chair role, their New/Resolved
  statuses) — we FK to *their* IDs and insert only lookup rows they don't ship.
- **Polymorphic references** (task assignees, issue sources) carry an entity NAME +
  record UUID; the load resolves the name to *that database's* `__mj.Entity` ID
  (DECLARE preamble in SQL packs, `@lookup:` in mj-sync) — entity IDs are never hardcoded
  across installs.

`IsSharedDemo` marks every row in OUR schemas; it never goes on their tables (not ours to
alter) — demo people are identified through the MemberProfile join.

## 4. The OpenApp tie-in — what the manifest machinery contributes

MoreCheese is itself an MJ Open App (`mj-app.json`: id `more-cheese-demo`, home schema
`morecheese_members`), and the OpenApp system is what turns the pieces above into one
installable unit:

1. **Dependencies with version ranges** — the manifest declares `mj-bizapps-common`,
   `mj-committees`, `mj-bizapps-forms` (same syntax the bizapps use among themselves).
   The installer resolves and installs them FIRST, so every cross-schema FK target and
   seeded lookup row exists before our migration runs. Consumer apps (Sonar) need nothing
   from us — they're someone's dependency, never datagen's concern.
2. **Version discipline** — each app pins an MJ core range; the environment must satisfy
   the *newest* requirement (spike finding: committees' latest metadata-sync needs
   v5.45+ core). Within a published major, app schema changes are additive-only, so our
   emit mappings can't be silently broken by a dependency patch.
3. **Our own install** — home schema from the manifest, then our frozen baseline
   migration (the one-time generator→migration conversion; MJ conventions throughout),
   then CodeGen registers our 27 entities and attaches them to our Explorer app record
   (`SchemaAutoAddNewEntities` claims all four morecheese schemas).
4. **Data is a post-install step, not an install artifact** — demo rows never ship as
   migrations (they'd replay on every consumer install). The packs load explicitly:
   SQL scripts 01→09, or the mj-sync tree for metadata-style loading — both paths write
   identical rows thanks to the pinned IDs.
5. **What the apps bring that we don't generate** — their Explorer UIs and nav
   (Application records from their migrations), their views/procs over our rows (verified:
   our data renders through *their* `vwAttendances`), and Sonar's scoring engine, which
   consumes the engagement signals we deliberately threaded through every domain.

**The full install sequence, end to end:**
`MJ core (≥ v5.45)` → `mj install` deps (schemas + migrations + entity registrations +
lookup seeds) → `mj install` MoreCheese (schema + baseline migration + CodeGen) →
load packs 01→07 → packs 08–09 (they resolve entity names, so after CodeGen) →
*(optional)* Sonar scores the world.

Working proof of the whole chain: `MC_Integration` on the dev SQL Server;
step-by-step commands and the 7 gotchas in `datagen/INTEGRATION-RUNBOOK.md`.
