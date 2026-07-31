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

## Addendum 2026-07-22 — from-scratch install of the CURRENT seed set: VERIFIED

Fresh v5.45 clone → 22 dependency migrations (now incl. bizapps-secure-messaging) → our 15
(baseline + 3 hand + CodeGen + 10 seeds): **ALL GREEN in ~12m41s**, every row count exact vs
the canonical packs (Person 2028, periods 8050, meetings 68 w/ 8 Scheduled, responses 727
w/ 79 anonymous, issues 108 w/ 83 assigned, messaging 43/217/43, DataQualityLabel 48).

Two findings:
- **F8 — dependency `main` branches restructure post-publish** (committees' migrations
  briefly appeared missing from a fresh clone). Hand-replayed installs from `main` are
  fragile; use `mj app install` with pinned versions (release artifacts) instead.
- **F9 — their CHECK constraints are the law, and our gates didn't know them.** The
  Membership Application distribution shipped `Status='Open'`; bizapps-forms allows only
  Draft/Active/Closed → seed failed on real DDL only. Fixed to 'Active' and added a
  validation gate asserting distribution Status/ChannelType against their CHECK lists
  (gate #107). Pattern: when generating into a dependency's table, mirror its CHECK value
  lists in a gate.
- **F10 — F9 generalized into an automatic contract (2026-07-24).** Hand-mirroring CHECK
  lists per F9 doesn't scale and can't catch moved/renamed/new-required columns. The
  **schema contract** (`datagen/SCHEMA-CONTRACT.md`) extracts our assumptions from
  `seed-mapping.mjs` automatically and diffs them against a captured snapshot of the real
  schema (`contract/schema-contract.json`, refreshed via `cli/capture-contract.mjs` on a
  dependency bump). Suite gate 6d fails in ms on: a dropped column, a new NOT-NULL/no-default
  column, a value outside a CHECK, or a renamed lookup — the drift classes that previously
  only surfaced at install. It's the fast first line; the full install stays the backstop.
  Capture gotchas learned building it: `sqlcmd -y 0` (needed so long CHECK definitions
  aren't truncated at 256 chars) is incompatible with BOTH `-W` and `-h -1` → use a
  `'ROW'+CHAR(1)` row sentinel and filter in JS; introspect columns via `sys.columns` not
  `INFORMATION_SCHEMA` so computed columns (e.g. `Person.DisplayName`, NOT NULL + no default
  but uninsertable) can be flagged `is_computed` and excluded from the required-column check.

## Addendum 2026-07-28 — re-capturing the MetadataSync data migrations

The two `MetadataSync_p01/p02` migrations are **not generated** — they are the SQL log of a
real `mj sync push`, so they go stale silently whenever the generator changes (they did:
they were a week behind the tree until this capture). The loop:

1. **Rebuild and re-emit** — deterministic, no database:
   ```sh
   node datagen/cli/build.mjs --n 2500 --seed 42 --release 2026-07-31   # must be GREEN
   node datagen/cli/emit-mjsync.mjs --metadata-out ../metadata
   node datagen/cli/emit-data-migration.mjs                             # platform pack (INSERT delivery)
   ```
2. **Dry-run the push first.** `mj sync push --dry-run --ci` from `metadata/` validates every
   entity, field and dependency CHECK against a real database in ~4 minutes and writes nothing.
   It does NOT execute the SPs, so it cannot catch an FK violation — see F12.
3. **The target must be EMPTY of demo data**, or the SPs emit `spUpdate` and the migration
   won't install on a fresh database. Purge in reverse `directoryOrder`, children first, with
   two strategies (the distinction is finding F6):
   - our four `morecheese_*` schemas and the dependency apps' CONTENT tables → delete all;
   - lookup tables the apps seed themselves (`Common.RelationshipType`, `Committees.Type`,
     `Tasks.TaskType`, `Issues.IssueType`, and all of `__mj_BizAppsSonar`, which ships its own
     sample model) → delete ONLY our pinned ids, or you destroy rows their migrations installed.
   - **F11 — Sonar's model tables are circularly referenced.** `ScoreModel.CurrentVersionID` →
     `ScoreModelVersion` → `ScoreModel`, plus `ScoreModel.BandSetID` → `ScoreBandSet`. No delete
     order resolves it: null `CurrentVersionID` first, then version, model, band set. The same
     cycle makes the push defer one `spUpdateScoreModel` — that single update is expected in the
     capture; any other non-create means the target wasn't clean.
4. **Enable SQL logging** in `metadata/.mj-sync.json` (root config only — subdirectories do not
   inherit it), push, then REMOVE the block so ordinary pushes don't write 100+ MB:
   ```json
   "sqlLogging": { "enabled": true, "outputDirectory": "./.sql-log-push", "formatAsMigration": true }
   ```
   Note the emitter rewrites this file, so add the block AFTER `emit-mjsync`, not before.
5. **Split at GO boundaries** into balanced parts under GitHub's 100 MiB blob ceiling, keeping
   the `p01..pNN` filenames and order. Never cut inside a batch — each record is DECLAREs, SETs
   and an EXEC, and a cut would strand the variables. Balance the parts rather than filling the
   first to the ceiling, or the next re-capture overflows while the last file sits half empty.
6. **Verify before committing**: every mutation is an `spCreate` (bar the deferred Sonar update),
   the create count equals the tree's record count, all 56 entity folders appear, and the parts
   rejoin to the capture body exactly.

Budget ~18 minutes for the push (102,395 records; the SPs run one at a time, and orders alone
took 186s). Note the capture targets schemas **literally** — `${flyway:defaultSchema}` never
appears, so the seed is pinned to these schema names. That matches the previously published
p01/p02, so it is the contract rather than a defect, but it is worth knowing before anyone
installs the app under a different schema name.

- **F12 — a dry-run push cannot catch a bad FK.** The 2026-07-28 re-capture failed on
  `FK_Membership_Term`: one committee seat referenced a term that was correctly never emitted,
  because the term guard ("no term before the committee was formed") had no counterpart on seat
  assignment. Packs looked clean, 190 gates passed, and the dry run was green — real DDL caught
  it. The push is one transaction, so the whole 102k-record load rolled back. Two gates now
  cover it (`pack refs: memberships→terms`, `committees: no seat predates its committee
  formation`), and the general lesson is F9's: for every FK we emit, the validator needs the
  same check the database will make.

## Addendum 2026-07-31 — the recapture TARGET is part of the contract (verified end-to-end)

The 2026-07-28 capture installed fine on the database it was recorded against and **nowhere
else**. Root cause: a MetadataSync capture is a SQL *log*, so every `@lookup:` it resolves is
frozen as a literal id. Entity ids for OUR entities are minted by CodeGen, and the shipped
baseline PINS them — so a capture taken against any database whose ids differ embeds ids that
exist on no fresh install. 16 entities diverged (all `MoreCheese: *`); core and dependency ids
matched, because their owners pin them.

Step 3's "target must be EMPTY of demo data" is necessary but **not sufficient**. The target
must also be:

- **built from the shipped migrations** (baseline + CodeGen + platform), so its entity ids ARE
  the pinned ones. A hand-replayed or long-lived playground database will not be — the old
  source also carried 66 entities from unrelated demos.
- **CodeGen'd** (`mj codegen --skipfiles`), or the push fails validation with hundreds of
  `Field "X" does not exist on entity "Y"`. `CodeGen_IdentityColumns` regenerates views and
  procs but deliberately omits the recurring `spUpdateExistingEntityFieldsFromSchema` calls, so
  between `mj migrate` and `mj codegen` the tables carry the identity columns and
  `__mj.EntityField` does not.
- **CodeGen'd with dependency schemas EXCLUDED** (F5). The shipped `mj.config.cjs` is in
  PLAYGROUND mode: `excludeSchemas` omits every `__mj_BizApps*` schema, so a plain run would
  re-register entities whose owners pin their ids. Add them for the duration, then revert.

Three more things the loop does that are easy to miss:

- **The logger writes CORE procs under the app placeholder.** Any core `__mj` entity in the tree
  (the three `ai-*` dirs) is emitted as `EXEC [${flyway:defaultSchema}].spCreateAIVendor`, which
  resolves to the app schema and fails with "Could not find stored procedure". Post-process those
  to `${mjSchema}` after splitting. App schemas are emitted literally and are fine.
- **The push writes back into the tree** — a `sync` block (lastModified + checksum) on all ~122k
  records. Never commit it: discard and re-emit, or use `mj sync file-reset`.
- **One expected non-create.** `Created 122,221 / Updated 1 / Deferred 1` — the single update is
  Sonar's deferred `spUpdateScoreModel` (F11). Any other non-create means the target wasn't clean.

**F13 — anything CodeGen generates must be looked up, never pinned.** F6 said this for
app-seeded lookup rows; it applies one level down to CodeGen's own metadata. The ProductTypes
migration hardcoded an `EntityField.ID` and failed everywhere but its origin database with
`FK_EntityFieldValue_EntityField`. It now resolves the field BY NAME in a single batch (a `GO`
would end the DECLARE's scope) and THROWs if absent.

**Verified 2026-07-31:** fresh database → core (15 migrations) → 7 dependency apps at pinned
versions → our 6 migrations = **ALL GREEN in 96.2s**, 12/12 row counts exact against the
canonical packs, Betty's vendor/model rows present, Sonar weights summing to 1.0000.
Note `mj app install <dep-repo>` installs THAT repo's default-branch version, not the version
your manifest's range resolves to — pin with `--version` when rebuilding a target by hand.
