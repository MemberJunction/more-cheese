# Integration Runbook — MoreCheese on the REAL BizApps (spike results, 2026-07-15)

> STATUS: spike-proven, UNCOMMITTED (deliberately — integration is the team's phase; this
> file is the handoff). The proof environment is `MC_Integration` on `sql_server_dev` —
> the full stack installed from the apps' REAL migrations, our packs loaded into their
> genuine tables, verified through THEIR generated views. No stand-ins anywhere.

## What was proven

- **All 21 real dependency migrations apply green** (bizapps-common 6, tasks 4,
  committees 4, forms 2, issues 5) on a v5.45-core database, including every
  metadata-sync (their entity registrations + lookup seeds land with their pinned IDs).
- **Our baseline migration applies on top** (placeholder resolved), CodeGen registers our
  entities only (527 total), and **all 9 seed packs load into the real tables** — real
  CHECKs, real FKs, their seeded lookups.
- **Their UIs' data layer works over our data**: `Committees: vwAttendances` renders
  "Gwen Whitfield — Food Safety Committee Q4 2025 [Present]" using THEIR view and THEIR
  DisplayName computed column; Gwen's chair seat resolves through THEIR seeded Chair role;
  our dedup ticket (MC-0095) lives in THEIR issue-status workflow. Sonar's 15 tables
  coexist untouched, ready to score.

## The install sequence (what a real `mj install` orchestrates; manual form below)

1. **Start from a database whose `__mj` core satisfies the NEWEST dependency's
   mjVersionRange** — see finding F1. (Spike used a clone of `Sonar_Demo_v545`.)
2. Create each app's schema (`mj-app.json schema.createIfNotExists` does this; raw sqlcmd
   must do it manually — finding F2).
3. Apply each app's migrations **in dependency order, per-app timestamp order**:
   common → tasks → committees → forms → issues → OURS.
   Resolve placeholders: `${flyway:defaultSchema}` → that app's schema, `${mjSchema}` →
   `__mj`, **`${mjBACSchema}` → `__mj_BizAppsCommon`** (committees' custom placeholder —
   finding F3). Always run sqlcmd with **`-I`** (finding F4).
4. Run OUR CodeGen with **dependency schemas excluded** (their metadata-syncs already
   registered their entities — our codegen must not touch them; finding F5):
   `excludeSchemas += ['__mj_BizAppsCommon','__mj_BizAppsCommittees','__mj_BizAppsForms',
   '__mj_BizAppsTasks','__mj_BizAppsIssues','__mj_BizAppsSonar','membership']`
   then `npx mj codegen --skipfiles` with DB_* env pointed at the target.
5. Load seed packs 01→09 in order (08/09 after codegen — their DECLARE preambles resolve
   entity names).

## Findings (each cost real debugging; don't rediscover them)

- **F1 — MJ core version skew.** committees' newest metadata-sync calls
  `spCreateAIAgent @SupportsPlanMode`, absent from older cores. The target DB must satisfy
  the *maximum* of all dependencies' mjVersionRanges. Check before starting:
  `SELECT COUNT(*) FROM sys.parameters WHERE object_id=OBJECT_ID('__mj.spCreateAIAgent') AND name='@SupportsPlanMode'` → must be 1.
- **F2 — schemas aren't created by migrations.** The installer creates them from the
  manifest; manual runs must `CREATE SCHEMA` first or baselines fail with Msg 2760.
- **F3 — apps define custom skyway placeholders** (committees: `${mjBACSchema}`). Grep any
  new app's migrations for `${...}` before applying.
- **F4 — `sqlcmd` needs `-I`** (QUOTED_IDENTIFIER ON). Without it the very first baseline
  fails with Msg 1934 and everything cascades.
- **F5 — never CodeGen a dependency's schema.** Their metadata-syncs own their entity
  registrations (pinned IDs). Our config's NameRules for their schemas exist only for the
  PLAYGROUND mode (stand-ins, no real apps); in real-install mode those schemas go in
  excludeSchemas. These two modes should eventually be first-class config profiles.
- **F6 — app-seeded lookup rows collide by NAME.** committees seeds 8 Roles (Chair, Vice
  Chair, Member…); issues seeds 7 IssueStatuses (New, In Progress, Resolved, Closed…).
  Our packs' parallel seeds violate unique-name constraints, and our FK values point at
  OUR ids, not theirs. **Fix pattern (proven in the spike):** reference app-seeded lookups
  by NAME via DECLAREd variables (`SELECT @Role_Chair = ID FROM Role WHERE Name='Chair'`),
  and only insert lookup rows the app does NOT seed (our 'Standing'/'Technical Standards'
  types and 4 IssueTypes coexist fine — additive rows are OK, name-collisions are not).
  → **TODO for datagen** (first change of the integration phase): teach `emit-sql`/
  `emit-mjsync` the lookup-by-name pattern for Role and IssueStatus (mj-sync side:
  `@lookup:` on those FKs), replacing the direct uuidFor references.
- **F7 — migrations are not idempotent** (correctly — flyway semantics). A failed partial
  apply means wipe and redo; never re-run a file over a dirty database.

## What the spike did NOT cover (the team session's agenda)

- Running MJAPI/MJExplorer against `MC_Integration` and clicking the actual app UIs
  (the data layer is verified; the app processes weren't started).
- Sonar actually computing scores over our members (its schema is present and untouched).
- A real `mj install` of the apps (the spike replayed migrations manually; the installer
  should do F2/F3 itself — verify).
- Whose responsibility the two config modes are (playground vs real-install; F5).

## Verify a fresh environment (quick queries)

```sql
SELECT COUNT(*) FROM __mj_BizAppsCommon.Person;                      -- 1,998
SELECT TOP 5 [Person], [Meeting], AttendanceStatus
FROM __mj_BizAppsCommittees.vwAttendances;                           -- our data, their view
SELECT i.IssueNumber, s.Name FROM __mj_BizAppsIssues.Issue i
JOIN __mj_BizAppsIssues.IssueStatus s ON i.StatusID=s.ID
WHERE i.Title LIKE '%Duplicate%';                                    -- MC-#### in THEIR workflow
```
