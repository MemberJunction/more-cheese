#!/usr/bin/env node
/**
 * Derive the uninstall from the install.
 *
 * Ported from `bizapps-caliber/scripts/generate-teardown.mjs`, which is one of the two siblings that
 * GENERATE their teardown rather than hand-maintaining it — so the delete list matches the insert
 * list by construction. (bizapps-ats is named in more-cheese #48 as the better-maintained of the two;
 * that repository does not exist under the MemberJunction org today, so caliber's is what this is
 * built from. See the report's open questions.)
 *
 * ── WHAT MJ ALREADY DOES, AND WHAT IT CANNOT REACH ────────────────────────────────────────────
 * `mj app remove` is not doing nothing. `install-orchestrator` runs `RunFkGraphTeardown` with a root
 * predicate of "`__mj.Entity` rows whose SchemaName is this app's", walks the foreign-key graph out
 * from there, retires app-owned `Application` rows and `SchemaInfo`, and drops that schema.
 *
 * ⚠️ "THIS APP'S SCHEMA" IS ONE SCHEMA, AND more-cheese HAS THREE. This is the gap no sibling covers
 * and the reason this file is not a mechanical port. `mj app remove` operates on
 * `existingApp.SchemaName` — the single `schema.name` in `mj-app.json`, `morecheese_members`. It
 * calls `RemoveAppEntityMetadata(existingApp.SchemaName, …)` and drops that schema alone. But the
 * baseline `B202607141200` creates `morecheese_events` and `morecheese_learning` as well, as LITERAL
 * schema names — `mj.config.cjs` maps placeholders only for `morecheese_members` and `__mj`, so the
 * other two have no placeholder and never will. On a remove, therefore:
 *
 *   • `morecheese_events` and `morecheese_learning` SURVIVE — schemas, tables, views, CRUD
 *     procedures, triggers, and every row in them;
 *   • the `__mj.Entity` rows for their seven entities survive, and with them every `EntityField`,
 *     `EntityPermission`, `EntityRelationship`, `EntitySetting`, `EntityFieldValue` and
 *     `ApplicationEntity` row hanging off those seven;
 *   • so the NEXT install re-inserts the same fixed UUIDs and collides on the primary key.
 *
 * ── WHY THE OTHER HALF IS NEEDED TOO ──────────────────────────────────────────────────────────
 * MJ's root predicate is "descended from an `__mj.Entity` row of this app". `config/` records are
 * not: users, user roles, user applications, user views, dashboards and their categories, queries and
 * query categories, projects, conversations and their artifacts, resource permissions, credentials,
 * file-storage accounts and providers, content sources and types, AI vendors/models/model-vendors,
 * vector indexes, and the Sonar scoring configuration. None of them descends from an Entity row, so
 * none of them is reachable from that predicate, and all of them survive a remove.
 *
 * ── WHY THE FIRST VERSION OF THIS ENGINE WAS WRONG (caliber's lesson, inherited) ───────────────
 * Caliber's first version emitted a flat list of `DELETE … WHERE ID IN (…)` in REVERSE SEED ORDER, on
 * the reasoning that the seed inserts parents before children, so its reverse deletes children before
 * parents. That is true of the rows the SEED created and false of everything else. A real install
 * accumulates RUNTIME children the seed never wrote: prompt runs, action execution logs,
 * user-application grants, dashboard state, conversation details, scheduled-job runs. Measured on a
 * used database, 11 of the deletes failed on foreign keys — while passing cleanly on a pristine
 * canary, which is the blind spot a canary exists to remove. MJ rolls the teardown back on any error
 * and DROPS THE APP SCHEMA ANYWAY, so the customer outcome was: schema gone, every targeted core row
 * still present, app marked `Error`.
 *
 * So nothing here orders anything by hand. The emitted script seeds a DOOMED SET and lets a generic
 * engine discover dependents from `sys.foreign_keys` AT APPLY TIME:
 *
 *   • NULLABLE foreign key  → SET NULL. The child is a customer's row that merely REFERENCES ours.
 *     Deleting their execution log because they ran our query would destroy data that is not ours to
 *     destroy; releasing the reference is enough.
 *   • NOT NULL foreign key  → DELETE, and the child joins the doomed set so its own dependents are
 *     handled too. A row that cannot exist without its parent is meaningless once the parent is gone.
 *
 * ── WHERE THIS DIVERGES FROM CALIBER, AND WHY ─────────────────────────────────────────────────
 *
 * 1. THE ENGINE IS NOT ANCHORED TO THE CORE SCHEMA. Caliber's cursor filters
 *    `WHERE SCHEMA_NAME(rt.schema_id) = '<core>'`, because every row it dooms is a core-schema row.
 *    Ours are not: the doomed set spans `__mj`, `__mj_BizAppsSonar` (the Sonar scoring config) and
 *    whatever schema each `config/` entity resolves to. The filter is therefore on the DOOMED SET
 *    ITSELF — `rt` must be a (schema, table) pair already in `#MoreCheeseDoomed` — which is strictly
 *    more general and reduces to caliber's behaviour when every doomed row is in one schema.
 *
 * 2. SEED ROWS ARE (ENTITY NAME, ID), RESOLVED TO A TABLE AT APPLY TIME. Caliber reads its seed
 *    migration's `IF NOT EXISTS` guards, which state the core TABLE directly. This repo has no seed
 *    migration yet — #30 dropped them, and they return only when the build engineer cuts the release
 *    seed — so the ids come from `config/` JSON, which states the mj-sync ENTITY NAME (`MJ: User
 *    Views`, `MJ_BizApps_Sonar: Factors`) and not a table. Rather than carry a hand-written
 *    entity-name-to-table map that would rot, the emitted SQL resolves each name through
 *    `__mj.Entity` on the host. That is the same "resolve by natural key, never by a literal a
 *    developer's database happened to hold" discipline `scripts/check-distribution-seed.mjs` enforces
 *    on migrations, and it is what makes the Sonar rows work without this script knowing that
 *    `MJ_BizApps_Sonar: Factors` lives in `__mj_BizAppsSonar.Factor`.
 *
 * 3. AN UNRESOLVED ENTITY NAME IS REPORTED AND SKIPPED, NOT A THROW. If `__mj.Entity` has no row for
 *    `MJ_BizApps_Sonar: Factors`, the Sonar app has already been removed and took its schema with it
 *    — there is no table left to delete those rows from. Skipping is the correct answer and throwing
 *    would block a teardown for a condition that is normal on a host that removes apps in any order.
 *    It is announced so that a name that fails to resolve for a DIFFERENT reason is still visible.
 *
 * 4. THE SCHEMA DDL IS ENUMERATED FROM THE CATALOG, NOT FROM THE BASELINE. The two surviving schemas
 *    are dropped by querying `sys.objects` at apply time rather than by listing the objects this
 *    script can see in `B202607141200`. A later migration that adds a table, view or procedure to
 *    `morecheese_events` is then torn down too, with nothing to keep in step — and `DROP SCHEMA`
 *    fails outright if anything is left behind, so a stale hand-written list is a teardown that
 *    half-finishes and rolls back.
 *
 * ── THE RUNTIME CONTRACT ──────────────────────────────────────────────────────────────────────
 * `HandleTeardown` reads `.sql` files from the manifest's `migrations.teardownDirectory`, sorted by
 * filename, and executes each as ONE statement inside ONE transaction, rolling everything back on
 * error. Three consequences: no `GO` (there is no batch splitter); exactly one placeholder is
 * substituted, `${mjSchema}` — which is why `morecheese_events`, `morecheese_learning` and
 * `morecheese_members` appear here as literals and must; and a `VALUES` table constructor is capped
 * at 1000 rows, so the seed is emitted in batches.
 *
 * ⚠️ POSTGRESQL IS NOT EMITTED. It would need the same engine against `information_schema`, and
 * shipping an untested PostgreSQL teardown is a mistake this estate has already made once with
 * migrations themselves. `migrations-pg/` is not checked in here, so a PG host cannot install
 * more-cheese today and a PG teardown would have nothing to tear down.
 *
 * Usage: node scripts/generate-teardown.mjs [--out migrations-teardown/V001__Retire_MoreCheese_Core_Rows.sql]
 */
import { readFileSync, readdirSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const REPO_ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

const UUID = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

/**
 * The app's schemas that `mj app remove` does NOT drop.
 *
 * `morecheese_members` is deliberately absent: it is `schema.name` in `mj-app.json`, so MJ drops it
 * itself, and a second `DROP SCHEMA` on a schema MJ has already removed is a teardown that fails on
 * a condition that is not an error. These two have no placeholder and never will.
 */
export const UNDROPPED_SCHEMAS = Object.freeze(['morecheese_events', 'morecheese_learning']);

/** `.mj-sync.json` and generator state are not records; `.backups`/`sql_logging`/`codegen` are push
 *  by-products. Matches `scripts/check-release-seed-coverage.mjs` exactly, deliberately: the two
 *  scripts must agree about what a record is, or the teardown's delete list and the coverage gate's
 *  insert list are answering different questions. */
const NOT_A_RECORD_FILE = new Set(['.mj-sync.json', 'checkpoint.json']);
const IGNORED_DIRS = new Set(['sql_logging', '.backups', 'codegen']);

function collectRecordFiles(dir, acc = []) {
    for (const entry of readdirSync(dir, { withFileTypes: true }).sort((a, b) => (a.name < b.name ? -1 : 1))) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            if (!IGNORED_DIRS.has(entry.name)) collectRecordFiles(full, acc);
        } else if (entry.name.endsWith('.json') && !NOT_A_RECORD_FILE.has(entry.name)) {
            acc.push(full);
        }
    }
    return acc;
}

/** Every `primaryKey.ID` in a parsed record tree, at any nesting depth. */
function collectIds(node, acc) {
    if (Array.isArray(node)) {
        for (const item of node) collectIds(item, acc);
        return;
    }
    if (!node || typeof node !== 'object') return;
    const pk = node.primaryKey;
    if (pk && typeof pk.ID === 'string' && UUID.test(pk.ID.trim())) acc.push(pk.ID.trim().toUpperCase());
    for (const value of Object.values(node)) collectIds(value, acc);
}

/**
 * The seed rows `config/` declares, as `{ entity, id, why }`.
 *
 * The mj-sync ENTITY NAME comes from each directory's `.mj-sync.json`, which is the only place the
 * repo states it — and it is stated once per directory, so a directory whose `.mj-sync.json` is
 * missing or nameless is a hard error rather than a silent skip. A directory this cannot read is a
 * set of rows that would be stranded on every host's uninstall, which is exactly the "permanent
 * orphan" failure caliber's generator refuses to allow.
 *
 * ⚠️ `generated/` IS NOT READ, and that is a scope decision rather than an oversight. See the
 * emitted file's header and `migrations-teardown/README.md`: those 121,661 records are demo rows in
 * NINE SIBLING APPS' schemas, and retiring them is a different problem with a different owner.
 */
export function readConfigSeed(repoRoot = REPO_ROOT) {
    const configRoot = path.join(repoRoot, 'config');
    const rows = [];
    const problems = [];
    for (const entry of readdirSync(configRoot, { withFileTypes: true }).sort((a, b) => (a.name < b.name ? -1 : 1))) {
        if (!entry.isDirectory() || IGNORED_DIRS.has(entry.name)) continue;
        const dir = path.join(configRoot, entry.name);
        const syncPath = path.join(dir, '.mj-sync.json');
        if (!existsSync(syncPath)) {
            problems.push(`config/${entry.name} has no .mj-sync.json, so the entity its records belong to is unknown.`);
            continue;
        }
        const entity = JSON.parse(readFileSync(syncPath, 'utf8')).entity;
        if (typeof entity !== 'string' || entity.trim() === '') {
            problems.push(`config/${entry.name}/.mj-sync.json declares no "entity", so its records cannot be resolved to a table.`);
            continue;
        }
        const ids = [];
        for (const file of collectRecordFiles(dir)) {
            collectIds(JSON.parse(readFileSync(file, 'utf8').replace(/^﻿/, '')), ids);
        }
        for (const id of new Set(ids)) {
            rows.push({ entity: entity.trim(), id, why: `config/${entry.name}` });
        }
    }
    if (problems.length > 0) {
        throw new Error(`cannot derive the teardown from config/:\n  - ${problems.join('\n  - ')}`);
    }
    return rows;
}

/**
 * The `__mj.Entity` ids and the `__mj.Application` id the baseline creates.
 *
 * Read out of the migration that creates them, so the delete list matches the insert list by
 * construction — the property that makes a generated teardown worth more than a hand-written one.
 *
 * ALL TWELVE entity rows are taken, including the five in `morecheese_members` that `mj app remove`
 * would retire by itself. Repeating those five is deliberate: the whole subject of this file is that
 * MJ's remove is single-schema, and a teardown whose correctness depends on guessing which of the
 * three schemas MJ got to first is a teardown nobody can reason about. Both deletes are idempotent —
 * whichever runs second finds nothing — so the cost of the overlap is zero and the benefit is that
 * this file's behaviour does not depend on MJ's.
 */
export function readBaselineCoreRows(repoRoot = REPO_ROOT) {
    const dir = path.join(repoRoot, 'migrations');
    const baseline = readdirSync(dir).find((f) => /^B\d+__.*\.sql$/.test(f));
    if (baseline === undefined) {
        throw new Error(`no baseline migration (B*.sql) found in ${dir} — the entity ids are read out of it.`);
    }
    const sql = readFileSync(path.join(dir, baseline), 'utf8');

    const entities = [];
    for (const m of sql.matchAll(
        /INSERT INTO \[\$\{mjSchema\}\]\.\[Entity\] \(([\s\S]*?)\)\s*VALUES \(([\s\S]*?)\n\s*\)/g,
    )) {
        const cols = m[1].split(/[,\n]/).map((c) => c.trim().replace(/^\[|\]$/g, '')).filter(Boolean);
        const vals = m[2].split(/,\n/).map((v) => v.trim());
        const row = {};
        cols.forEach((c, i) => (row[c] = vals[i]));
        const id = /^'([0-9a-fA-F-]{36})'$/.exec(row.ID ?? '');
        if (id === null) continue;
        entities.push({
            id: id[1].toUpperCase(),
            name: (row.Name ?? '').replace(/^'|'$/g, ''),
            schema: (row.SchemaName ?? '').replace(/^'|'$/g, ''),
        });
    }
    if (entities.length === 0) {
        throw new Error(
            `${baseline}: no [${'${mjSchema}'}].[Entity] INSERT was readable. The teardown derives what it deletes ` +
                'from these statements, so an unreadable one becomes an entity that is never retired on any host.',
        );
    }

    // The Application row the baseline creates for itself, under an `IF NOT EXISTS` on its own id.
    const app = /IF NOT EXISTS \(SELECT 1 FROM (?:\[?\$\{mjSchema\}\]?|__mj)\.\[?Application\]? WHERE \[?ID\]? = '([0-9a-fA-F-]{36})'\)/i.exec(sql);

    return { baseline, entities, applicationId: app === null ? null : app[1].toUpperCase() };
}

/** T-SQL string literal. Single quotes doubled; entity names are the only free text emitted. */
function quote(text) {
    return `'${String(text).replace(/'/g, "''")}'`;
}

/**
 * `INSERT … VALUES` statements, batched under T-SQL's 1000-row table-constructor cap.
 *
 * 500 rather than 1000: the cap is a hard limit and sitting on it leaves no room for a future record
 * type. `config/` declares 410 rows today, so this is one statement — the batching exists so that
 * growing past the cap is not a defect that appears years from now in a file nobody is looking at.
 */
function batchedInsert(table, columns, rows, renderRow, size = 500) {
    const out = [];
    for (let i = 0; i < rows.length; i += size) {
        const chunk = rows.slice(i, i + size);
        out.push(`INSERT INTO ${table} (${columns}) VALUES\n${chunk.map(renderRow).join(',\n')};`);
    }
    return out.join('\n\n');
}

/**
 * The generic engine, as constant text.
 *
 * The core schema is written as a TOKEN rather than `${mjSchema}` because this is a JS template
 * literal and would otherwise interpolate it away; {@link ENGINE} substitutes the real placeholder
 * back in. The app's other two schemas are LITERALS throughout: MJ substitutes only `${mjSchema}` in
 * a teardown, and these two have no placeholder in `mj.config.cjs` in any case.
 */
const CORE_TOKEN = '@@CORE_SCHEMA@@';

const ENGINE_TEMPLATE = String.raw`
-- MJ's own AtomicBatchScript sets this, and for the same reason: with XACT_ABORT OFF an error inside
-- EXEC sp_executesql does NOT abort the batch, so the loops below would keep issuing destructive
-- statements against an already-doomed transaction. The rollback still happens, but running the
-- remainder of a delete plan after the first failure is not a risk worth taking for one line.
SET XACT_ABORT ON;

-- ── 1. Resolve each seeded record to the table that holds it ──────────────────────────────────
-- By ENTITY NAME, through the host's own __mj.Entity, rather than through a table name this
-- generator baked in. Whatever schema a sibling app installed itself into, the lookup finds it.
INSERT INTO #MoreCheeseDoomed (SchemaName, TableName, RowID, Depth)
SELECT DISTINCT e.[SchemaName], e.[BaseTable], s.RowID, 0
FROM #MoreCheeseSeed s
JOIN [@@CORE_SCHEMA@@].[Entity] e ON e.[Name] = s.EntityName
WHERE NOT EXISTS (
    SELECT 1 FROM #MoreCheeseDoomed d
    WHERE d.SchemaName = e.[SchemaName] AND d.TableName = e.[BaseTable] AND d.RowID = s.RowID
);

-- An entity name that does not resolve means that app has already been removed and took its schema
-- with it, so there is no table left to delete those rows from. Announced rather than thrown: a
-- host may remove apps in any order, and blocking a teardown for a normal condition is how a
-- teardown gets skipped. Announcing it keeps a name that fails to resolve for some OTHER reason
-- visible instead of silent.
DECLARE @unresolved NVARCHAR(MAX) = (
    SELECT STRING_AGG(CONVERT(NVARCHAR(MAX), x.EntityName), ', ')
    FROM (SELECT DISTINCT s.EntityName
          FROM #MoreCheeseSeed s
          WHERE NOT EXISTS (SELECT 1 FROM [@@CORE_SCHEMA@@].[Entity] e WHERE e.[Name] = s.EntityName)) x
);
IF @unresolved IS NOT NULL
    RAISERROR('MoreCheese teardown: no __mj.Entity row for %s - that app is already removed, so its rows are gone with its schema. Skipped.', 0, 1, @unresolved) WITH NOWAIT;

-- ── 2. Discover dependents from the catalog, at apply time ────────────────────────────────────
-- Not from a build-time ordering: the dependent surface is not knowable when this file is written
-- and reaches into sibling schemas. Nullable references are released; non-nullable dependents join
-- the doomed set and are removed with their own dependents. Bounded, and it fails loudly rather
-- than half-finishing.
DECLARE @pass INT = 0;
DECLARE @MAX_PASSES INT = 25;
DECLARE @changed INT = 1;

WHILE @changed > 0 AND @pass < @MAX_PASSES
BEGIN
    SET @pass += 1;
    SET @changed = 0;

    DECLARE @childSchema sysname, @childTable sysname, @childCol sysname,
            @parentSchema sysname, @parentTable sysname, @isNullable BIT, @sql NVARCHAR(MAX);

    -- NOT anchored to the core schema, unlike the caliber original: this app's doomed set spans
    -- __mj, __mj_BizAppsSonar and whatever schema each config/ entity resolves to. The filter is
    -- the doomed set itself, which reduces to caliber's behaviour when every doomed row is in one
    -- schema and is correct when they are not.
    DECLARE fk_cursor CURSOR LOCAL FAST_FORWARD FOR
        SELECT DISTINCT SCHEMA_NAME(pt.schema_id), pt.name, pc.name,
                        SCHEMA_NAME(rt.schema_id), rt.name, pc.is_nullable
        FROM sys.foreign_keys fk
        JOIN sys.foreign_key_columns fkc ON fkc.constraint_object_id = fk.object_id
        JOIN sys.tables  pt ON pt.object_id = fk.parent_object_id
        JOIN sys.columns pc ON pc.object_id = pt.object_id AND pc.column_id = fkc.parent_column_id
        JOIN sys.tables  rt ON rt.object_id = fk.referenced_object_id
        JOIN sys.columns rc ON rc.object_id = rt.object_id AND rc.column_id = fkc.referenced_column_id
        WHERE rc.name = 'ID'
          -- Single-column constraints only. MJ's EnumerateMjEntityFkGraph skips composites for the
          -- same reason: treating one column of a composite key as a standalone edge would null half
          -- a key or match a child on a partial reference.
          AND (SELECT COUNT(*) FROM sys.foreign_key_columns c2
               WHERE c2.constraint_object_id = fk.object_id) = 1
          AND EXISTS (SELECT 1 FROM #MoreCheeseDoomed d
                      WHERE d.SchemaName = SCHEMA_NAME(rt.schema_id) AND d.TableName = rt.name);

    OPEN fk_cursor;
    FETCH NEXT FROM fk_cursor INTO @childSchema, @childTable, @childCol, @parentSchema, @parentTable, @isNullable;
    WHILE @@FETCH_STATUS = 0
    BEGIN
        IF @isNullable = 1
        BEGIN
            -- Someone else's row that merely points at ours. Release the reference, keep the row.
            SET @sql = N'UPDATE c SET c.[' + @childCol + N'] = NULL
                         FROM [' + @childSchema + N'].[' + @childTable + N'] c
                         WHERE c.[' + @childCol + N'] IN (SELECT RowID FROM #MoreCheeseDoomed
                                                          WHERE SchemaName = @ps AND TableName = @pt)';
            EXEC sp_executesql @sql, N'@ps sysname, @pt sysname', @ps = @parentSchema, @pt = @parentTable;
            SET @changed += @@ROWCOUNT;
        END
        ELSE
        BEGIN
            -- Cannot exist without the parent, so it is doomed too.
            SET @sql = N'INSERT INTO #MoreCheeseDoomed (SchemaName, TableName, RowID, Depth)
                         SELECT ''' + @childSchema + N''', ''' + @childTable + N''', c.[ID], @pass
                         FROM [' + @childSchema + N'].[' + @childTable + N'] c
                         WHERE c.[' + @childCol + N'] IN (SELECT RowID FROM #MoreCheeseDoomed
                                                          WHERE SchemaName = @ps AND TableName = @pt)
                           AND NOT EXISTS (SELECT 1 FROM #MoreCheeseDoomed d
                                           WHERE d.SchemaName = ''' + @childSchema + N'''
                                             AND d.TableName = ''' + @childTable + N''' AND d.RowID = c.[ID])';
            EXEC sp_executesql @sql, N'@ps sysname, @pt sysname, @pass INT',
                 @ps = @parentSchema, @pt = @parentTable, @pass = @pass;
            SET @changed += @@ROWCOUNT;
        END

        FETCH NEXT FROM fk_cursor INTO @childSchema, @childTable, @childCol, @parentSchema, @parentTable, @isNullable;
    END
    CLOSE fk_cursor;
    DEALLOCATE fk_cursor;
END

IF @pass >= @MAX_PASSES AND @changed > 0
    THROW 51003, 'MoreCheese teardown did not converge: the dependency graph is deeper than MAX_PASSES. Nothing has been committed.', 1;

-- ── 3. Order the deletes by the FK graph, not by discovery order ──────────────────────────────
-- Discovery depth is NOT a topological order. Two tables can be discovered in the same pass from
-- different parents and still be parent and child of each other. So compute a real level: a table
-- sits one above every doomed table it references, and deletes run highest level first. Relaxation
-- is bounded; a non-nullable cycle would otherwise spin.
--
-- Keyed on SCHEMA + NAME, never on name alone. That is not defensive here, it is required: a live
-- more-cheese database holds __mj.Application beside __mj_BizAppsSonar tables, and this app's own
-- three schemas hold Event, Course and Certification alongside sibling apps' tables of similar name.
CREATE TABLE #MoreCheeseLevel (SchemaName sysname NOT NULL, TableName sysname NOT NULL, Lvl INT NOT NULL, PRIMARY KEY (SchemaName, TableName));

INSERT INTO #MoreCheeseLevel (SchemaName, TableName, Lvl)
SELECT DISTINCT SchemaName, TableName, 0 FROM #MoreCheeseDoomed;

DECLARE @relax INT = 0;
DECLARE @MAX_RELAX INT = 50;
DECLARE @moved INT = 1;

WHILE @moved > 0 AND @relax < @MAX_RELAX
BEGIN
    SET @relax += 1;

    UPDATE child
    SET child.Lvl = parent.Lvl + 1
    FROM #MoreCheeseLevel child
    JOIN (
        SELECT DISTINCT
               SCHEMA_NAME(pt.schema_id) AS ChildSchema, pt.name AS ChildTable,
               SCHEMA_NAME(rt.schema_id) AS ParentSchema, rt.name AS ParentTable
        FROM sys.foreign_keys fk
        JOIN sys.foreign_key_columns fkc ON fkc.constraint_object_id = fk.object_id
        JOIN sys.tables  pt ON pt.object_id = fk.parent_object_id
        JOIN sys.columns pc ON pc.object_id = pt.object_id AND pc.column_id = fkc.parent_column_id
        JOIN sys.tables  rt ON rt.object_id = fk.referenced_object_id
        JOIN sys.columns rc ON rc.object_id = rt.object_id AND rc.column_id = fkc.referenced_column_id
        WHERE rc.name = 'ID'
          AND pc.is_nullable = 0
          AND (SELECT COUNT(*) FROM sys.foreign_key_columns c2
               WHERE c2.constraint_object_id = fk.object_id) = 1
          AND NOT (pt.object_id = rt.object_id)
    ) edge ON edge.ChildTable = child.TableName AND edge.ChildSchema = child.SchemaName
    JOIN #MoreCheeseLevel parent ON parent.TableName = edge.ParentTable AND parent.SchemaName = edge.ParentSchema
    WHERE child.Lvl <= parent.Lvl;

    SET @moved = @@ROWCOUNT;
END

IF @moved > 0
    THROW 51005, 'MoreCheese teardown could not order its deletes within MAX_RELAX passes: either a non-nullable foreign-key CYCLE among the doomed tables, or a dependency chain deeper than the bound. Nothing has been committed.', 1;

-- ── 4. Announce the plan before executing it ──────────────────────────────────────────────────
-- MJ's own teardown calls ReportTeardownPlan and prints 'delete ActionExecutionLog x800' to the
-- operator BEFORE touching anything. On a used database the cascade removes the CUSTOMER's history
-- alongside our rows — conversation details, action execution logs, prompt and agent runs, dashboard
-- state. That is the standard cascade rule and MJ does the same, but an unrecallable delete of "what
-- your system did" should be announced rather than discovered.
DECLARE @planLine NVARCHAR(400);
DECLARE plan_cursor CURSOR LOCAL FAST_FORWARD FOR
    SELECT CONCAT('  delete ', d.SchemaName, '.', d.TableName, ' x', COUNT(*))
    FROM #MoreCheeseDoomed d GROUP BY d.SchemaName, d.TableName ORDER BY COUNT(*) DESC;
RAISERROR('MoreCheese teardown plan (rows to remove from shared schemas):', 0, 1) WITH NOWAIT;
OPEN plan_cursor;
FETCH NEXT FROM plan_cursor INTO @planLine;
WHILE @@FETCH_STATUS = 0
BEGIN
    RAISERROR(@planLine, 0, 1) WITH NOWAIT;
    FETCH NEXT FROM plan_cursor INTO @planLine;
END
CLOSE plan_cursor; DEALLOCATE plan_cursor;

-- ── 5. Delete, deepest level first ────────────────────────────────────────────────────────────
DECLARE @lvl INT = (SELECT MAX(Lvl) FROM #MoreCheeseLevel);
WHILE @lvl >= 0
BEGIN
    DECLARE @delSchema sysname, @delTable sysname, @delSql NVARCHAR(MAX);
    DECLARE del_cursor CURSOR LOCAL FAST_FORWARD FOR
        SELECT SchemaName, TableName FROM #MoreCheeseLevel WHERE Lvl = @lvl;
    OPEN del_cursor;
    FETCH NEXT FROM del_cursor INTO @delSchema, @delTable;
    WHILE @@FETCH_STATUS = 0
    BEGIN
        -- Joined on SchemaName as well as TableName, for the reason the levelling table records.
        SET @delSql = N'DELETE t FROM [' + @delSchema + N'].[' + @delTable + N'] t
                        JOIN #MoreCheeseDoomed d ON d.RowID = t.[ID]
                        WHERE d.TableName = @t AND d.SchemaName = @s';
        EXEC sp_executesql @delSql, N'@t sysname, @s sysname', @t = @delTable, @s = @delSchema;
        FETCH NEXT FROM del_cursor INTO @delSchema, @delTable;
    END
    CLOSE del_cursor;
    DEALLOCATE del_cursor;
    SET @lvl -= 1;
END

-- ── 6. Postcondition on the rows ──────────────────────────────────────────────────────────────
-- A teardown that reports success while leaving rows behind is the failure this design replaced, so
-- it is asserted rather than assumed. Only the SEEDED rows (Depth = 0) are asserted: a discovered
-- dependent that was SET NULL rather than deleted is still present by design.
DECLARE @remaining INT = 0;
DECLARE @chkSchema sysname, @chkTable sysname, @chkSql NVARCHAR(MAX), @chkCount INT;
DECLARE chk_cursor CURSOR LOCAL FAST_FORWARD FOR
    SELECT DISTINCT SchemaName, TableName FROM #MoreCheeseDoomed WHERE Depth = 0;
OPEN chk_cursor;
FETCH NEXT FROM chk_cursor INTO @chkSchema, @chkTable;
WHILE @@FETCH_STATUS = 0
BEGIN
    SET @chkSql = N'SELECT @c = COUNT(*) FROM [' + @chkSchema + N'].[' + @chkTable + N'] t
                    JOIN #MoreCheeseDoomed d ON d.RowID = t.[ID]
                    WHERE d.TableName = @t AND d.SchemaName = @s AND d.Depth = 0';
    EXEC sp_executesql @chkSql, N'@t sysname, @s sysname, @c INT OUTPUT', @t = @chkTable, @s = @chkSchema, @c = @chkCount OUTPUT;
    SET @remaining += ISNULL(@chkCount, 0);
    FETCH NEXT FROM chk_cursor INTO @chkSchema, @chkTable;
END
CLOSE chk_cursor;
DEALLOCATE chk_cursor;

IF @remaining > 0
    THROW 51004, 'MoreCheese teardown finished with seeded rows still present. Nothing has been committed.', 1;

-- ── 7. Drop the two schemas mj app remove does not ────────────────────────────────────────────
-- THE MULTI-SCHEMA HALF. 'mj app remove' drops schema.name from mj-app.json and nothing else, so
-- without this block morecheese_events and morecheese_learning survive an uninstall complete with
-- their tables, views, CRUD procedures, triggers and rows — and the next install collides.
--
-- Enumerated from the catalog rather than from a list written here, so a table added to either
-- schema by a later migration is torn down with nothing to keep in step. Order is forced: inbound
-- foreign keys first (a table in ANY schema may reference these), then views and programmable
-- objects, then tables, then the schema itself. DROP SCHEMA fails if anything remains, which is what
-- makes step 7d a real postcondition rather than a hope.
DECLARE @schemaName sysname, @dropSql NVARCHAR(MAX), @obj NVARCHAR(400);

DECLARE schema_cursor CURSOR LOCAL FAST_FORWARD FOR
    SELECT s.name FROM sys.schemas s WHERE s.name IN (@@UNDROPPED_SCHEMAS@@);
OPEN schema_cursor;
FETCH NEXT FROM schema_cursor INTO @schemaName;
WHILE @@FETCH_STATUS = 0
BEGIN
    RAISERROR('MoreCheese teardown: dropping schema %s (mj app remove drops only the declared schema).', 0, 1, @schemaName) WITH NOWAIT;

    -- 7a. Foreign keys pointing INTO this schema, from anywhere. Today every cross-schema FK this
    -- app declares points OUTWARD (to __mj_BizAppsCommon.Person / .Organization), so this finds
    -- nothing on a stock install; it exists because a host or a later migration can add one, and a
    -- single inbound FK is the difference between a clean DROP TABLE and a rolled-back teardown.
    DECLARE @fkName sysname, @fkSchema sysname, @fkTable sysname;
    DECLARE inbound_fk CURSOR LOCAL FAST_FORWARD FOR
        SELECT fk.name, SCHEMA_NAME(pt.schema_id), pt.name
        FROM sys.foreign_keys fk
        JOIN sys.tables pt ON pt.object_id = fk.parent_object_id
        JOIN sys.tables rt ON rt.object_id = fk.referenced_object_id
        WHERE SCHEMA_NAME(rt.schema_id) = @schemaName
          AND SCHEMA_NAME(pt.schema_id) <> @schemaName;
    OPEN inbound_fk;
    FETCH NEXT FROM inbound_fk INTO @fkName, @fkSchema, @fkTable;
    WHILE @@FETCH_STATUS = 0
    BEGIN
        SET @dropSql = N'ALTER TABLE [' + @fkSchema + N'].[' + @fkTable + N'] DROP CONSTRAINT [' + @fkName + N']';
        EXEC sp_executesql @dropSql;
        FETCH NEXT FROM inbound_fk INTO @fkName, @fkSchema, @fkTable;
    END
    CLOSE inbound_fk; DEALLOCATE inbound_fk;

    -- 7b. Views and programmable objects. Triggers are not listed: they are dropped with the table
    -- they sit on, and dropping one by name first would be a statement that can fail for no gain.
    DECLARE obj_cursor CURSOR LOCAL FAST_FORWARD FOR
        SELECT CASE o.type WHEN 'V' THEN 'VIEW' WHEN 'P' THEN 'PROCEDURE'
                           WHEN 'FN' THEN 'FUNCTION' WHEN 'IF' THEN 'FUNCTION' WHEN 'TF' THEN 'FUNCTION' END
               + ' [' + @schemaName + '].[' + o.name + ']'
        FROM sys.objects o
        WHERE o.schema_id = SCHEMA_ID(@schemaName) AND o.type IN ('V', 'P', 'FN', 'IF', 'TF');
    OPEN obj_cursor;
    FETCH NEXT FROM obj_cursor INTO @obj;
    WHILE @@FETCH_STATUS = 0
    BEGIN
        SET @dropSql = N'DROP ' + @obj;
        EXEC sp_executesql @dropSql;
        FETCH NEXT FROM obj_cursor INTO @obj;
    END
    CLOSE obj_cursor; DEALLOCATE obj_cursor;

    -- 7c. Tables. Intra-schema foreign keys (EventRegistration -> Event, CourseEnrollment -> Course,
    -- MemberCertification -> Certification) are dropped first so table order does not matter.
    DECLARE intra_fk CURSOR LOCAL FAST_FORWARD FOR
        SELECT fk.name, pt.name
        FROM sys.foreign_keys fk
        JOIN sys.tables pt ON pt.object_id = fk.parent_object_id
        WHERE pt.schema_id = SCHEMA_ID(@schemaName);
    OPEN intra_fk;
    FETCH NEXT FROM intra_fk INTO @fkName, @fkTable;
    WHILE @@FETCH_STATUS = 0
    BEGIN
        SET @dropSql = N'ALTER TABLE [' + @schemaName + N'].[' + @fkTable + N'] DROP CONSTRAINT [' + @fkName + N']';
        EXEC sp_executesql @dropSql;
        FETCH NEXT FROM intra_fk INTO @fkName, @fkTable;
    END
    CLOSE intra_fk; DEALLOCATE intra_fk;

    DECLARE tbl_cursor CURSOR LOCAL FAST_FORWARD FOR
        SELECT t.name FROM sys.tables t WHERE t.schema_id = SCHEMA_ID(@schemaName);
    OPEN tbl_cursor;
    FETCH NEXT FROM tbl_cursor INTO @fkTable;
    WHILE @@FETCH_STATUS = 0
    BEGIN
        SET @dropSql = N'DROP TABLE [' + @schemaName + N'].[' + @fkTable + N']';
        EXEC sp_executesql @dropSql;
        FETCH NEXT FROM tbl_cursor INTO @fkTable;
    END
    CLOSE tbl_cursor; DEALLOCATE tbl_cursor;

    -- 7d. The schema itself. Fails if anything above was missed, which is the point.
    SET @dropSql = N'DROP SCHEMA [' + @schemaName + N']';
    EXEC sp_executesql @dropSql;

    -- MJ writes a SchemaInfo row per schema it manages and retires only the declared one.
    DELETE FROM [@@CORE_SCHEMA@@].[SchemaInfo] WHERE [SchemaName] = @schemaName;

    FETCH NEXT FROM schema_cursor INTO @schemaName;
END
CLOSE schema_cursor; DEALLOCATE schema_cursor;

-- Unreachable on the THROW paths above, deliberately: MJ runs this inside a transaction and rolls
-- back on any error, and a ROLLBACK drops temp tables created inside it. Kept for the success path
-- because MJ can run several teardown files on the SAME connection in the SAME transaction.
DROP TABLE #MoreCheeseSeed;
DROP TABLE #MoreCheeseDoomed;
DROP TABLE #MoreCheeseLevel;
`;

const ENGINE = ENGINE_TEMPLATE.split(CORE_TOKEN).join('${mjSchema}').split('@@UNDROPPED_SCHEMAS@@').join(
    UNDROPPED_SCHEMAS.map((s) => `'${s}'`).join(', '),
);

/**
 * The declared schema, as the baseline spells it and as a reader needs to see it.
 *
 * The baseline writes `SchemaName` as the placeholder `${flyway:defaultSchema}`, because a regular
 * migration gets that substituted. A TEARDOWN does not: MJ substitutes `${mjSchema}` and nothing
 * else. Emitting the placeholder even into a comment here would put a string in this file that looks
 * like it resolves and never will — and `scripts/check-distribution-seed.mjs` refuses exactly that
 * spelling in `migrations-teardown/`, passing today only because it masks comments before it looks.
 * Relying on that is one edit away from being wrong, so the name is resolved here instead.
 */
const DECLARED_SCHEMA = 'morecheese_members';

function displaySchema(schemaName) {
    return schemaName === '${flyway:defaultSchema}' ? `${DECLARED_SCHEMA} (declared)` : schemaName;
}

/** Build the teardown SQL. */
export function generateTeardown({ configRows, baseline, entities, applicationId }) {
    const CORE = '${mjSchema}';

    const byProvenance = new Map();
    for (const r of configRows) byProvenance.set(r.why, (byProvenance.get(r.why) ?? 0) + 1);
    const summary = [...byProvenance.entries()]
        .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
        .map(([where, n]) => `--   ${String(n).padStart(4)} from ${where}`)
        .join('\n');

    // `#MoreCheeseSeed` is declared PRIMARY KEY (EntityName, RowID) and batchedInsert puts today's
    // rows in ONE VALUES constructor, so a repeated tuple fails the whole statement with Msg 2627 —
    // and because MJ runs the teardown in a single transaction that rolls back on error while
    // `mj app remove` drops the declared schema regardless, one duplicate turns the entire teardown
    // into a no-op at the exact moment it is needed.
    //
    // The duplicates are legitimate declarations, not junk: ids are unique WITHIN a config directory,
    // but two pairs of directories declare the same mj-sync entity over the same records
    // (`conversations` + `conversations-owner`, `sonar-score-models` + `sonar-score-models-activate`).
    // Deduping inside readConfigSeed would be the smaller edit and the wrong one — the provenance
    // header below is built from those same rows, so the second directory of each pair would drop
    // out of the 36-line summary silently. It stays declared there and distinct here.
    const distinctSeedRows = [...new Map(configRows.map((r) => [`${r.entity}|${r.id}`, r])).values()];

    const seedRows = batchedInsert(
        '#MoreCheeseSeed',
        'EntityName, RowID',
        distinctSeedRows,
        (r) => `    (${quote(r.entity)}, '${r.id}')`,
    );

    // The entity rows and the application row are seeded straight into the doomed set: their table is
    // known without a lookup, because this app is what creates them.
    const entityRows = batchedInsert(
        '#MoreCheeseDoomed',
        'SchemaName, TableName, RowID, Depth',
        entities,
        // The label goes on its OWN LINE, above the tuple. Trailing it after the tuple puts the comma
        // that separates one VALUES row from the next INSIDE the `--` comment, which silently
        // un-separates them: SQL Server then sees `(…) (…)` and the statement does not parse. The
        // file still looks right in a diff, and nothing DB-free would catch it — which is why
        // generate-teardown.spec.mjs asserts it directly.
        (e) => `    -- ${e.name} in ${displaySchema(e.schema)}\n    ('${CORE}', 'Entity', '${e.id}', 0)`,
    );
    const appRow =
        applicationId === null
            ? '-- No __mj.Application row is created by the baseline, so none is retired here.'
            : `INSERT INTO #MoreCheeseDoomed (SchemaName, TableName, RowID, Depth) VALUES\n    ('${CORE}', 'Application', '${applicationId}', 0);`;

    const bySchema = new Map();
    for (const e of entities) bySchema.set(displaySchema(e.schema), (bySchema.get(displaySchema(e.schema)) ?? 0) + 1);
    const entitySummary = [...bySchema.entries()]
        .sort()
        .map(([s, n]) => `--   ${String(n).padStart(2)} in ${s}`)
        .join('\n');

    return `-- =============================================================================================
-- MoreCheese teardown — retire this app's rows and its undeclared schemas on \`mj app remove\`
-- =============================================================================================
-- ⚠️ GENERATED — DO NOT HAND-EDIT. Produced by \`scripts/generate-teardown.mjs\` (\`npm run
-- generate:teardown\`). Every id below is read out of the file that creates it — \`config/\` for the
-- application configuration, \`${baseline}\` for the entity and application rows — so the delete list
-- matches the insert list by construction. Regenerate whenever \`config/\` or the baseline changes.
--
-- ── WHY THIS FILE EXISTS AT ALL: more-cheese IS MULTI-SCHEMA ─────────────────────────────────
-- \`mj app remove\` operates on ONE schema: \`existingApp.SchemaName\`, which is \`schema.name\` in
-- mj-app.json — \`morecheese_members\`. It walks the foreign-key graph out from that schema's
-- \`__mj.Entity\` rows, retires app-owned Applications and SchemaInfo, and drops that schema.
--
-- This app creates THREE schemas. \`morecheese_events\` and \`morecheese_learning\` are created by the
-- baseline as literal names, and MJ has never heard of them. Without this file they survive an
-- uninstall — schemas, tables, views, CRUD procedures, triggers, rows — as do the \`__mj.Entity\` rows
-- for their seven entities and everything hanging off those. The next install then re-inserts the
-- same fixed UUIDs and collides on the primary key.
--
-- ── WHAT THIS REMOVES ────────────────────────────────────────────────────────────────────────
--   1. The application configuration \`config/\` seeds, resolved to its tables through the host's own
--      \`__mj.Entity\` by entity NAME — never by a table name baked in here, so a sibling app that
--      installed itself into a different schema still resolves.
--   2. All ${entities.length} \`__mj.Entity\` rows the baseline creates, for all three schemas:
${entitySummary}
--      The ${bySchema.get(`${DECLARED_SCHEMA} (declared)`) ?? 0} in the declared schema are retired by \`mj app remove\` too; repeating them is
--      deliberate, so that this file's correctness does not depend on guessing what MJ already did.
--      Both deletes are idempotent — whichever runs second finds nothing.
--   3. The \`__mj.Application\` row the baseline creates for this app.
--   4. Everything the foreign-key graph says depends on the above, discovered AT APPLY TIME.
--   5. The \`morecheese_events\` and \`morecheese_learning\` schemas and every object in them.
--
-- ── WHAT THIS DELIBERATELY LEAVES ────────────────────────────────────────────────────────────
--   • The 121,661 demo records under \`generated/\`. Those are rows in NINE SIBLING APPS' schemas
--     (orders, forms, tasks, issues, common, accounting, committees, secure-messaging) — not in any
--     schema this app owns. See migrations-teardown/README.md: retiring them is a real and separate
--     question, and this file does not answer it.
--   • Any row a NULLABLE foreign key points at ours with. That row belongs to the customer and
--     merely references ours; the reference is released and the row kept.
--   • \`morecheese_members\` itself. MJ drops it, and a second DROP SCHEMA would fail on a condition
--     that is not an error.
--
-- ── HOW IT ORDERS DELETES ────────────────────────────────────────────────────────────────────
-- It does not. An earlier version of the caliber original this is ported from deleted in reverse
-- seed order, which only orders rows the SEED created — a real install also has runtime children
-- (prompt runs, execution logs, user-application grants, dashboard state, conversation details) that
-- blocked 11 of its deletes on a used database while passing cleanly on a pristine canary. Instead
-- the ids below seed a doomed set, and the engine discovers dependents from \`sys.foreign_keys\` at
-- apply time: a NULLABLE reference is set to NULL, a NOT NULL reference is deleted and joins the
-- doomed set.
--
-- ── RUNTIME ──────────────────────────────────────────────────────────────────────────────────
-- MJ executes this file as ONE statement inside ONE transaction and rolls everything back on error,
-- so there is no \`GO\` here and no partial application. Exactly one placeholder is substituted: the
-- core schema. The app-schema placeholder used by regular migrations is NOT substituted at teardown
-- time and must never appear — which is why the two sibling schemas are written literally.
--
-- ⚠️ NOT TESTED AGAINST A DATABASE. This was generated and reviewed statically;
-- \`scripts/generate-teardown.spec.mjs\` checks its structure DB-free. It must be applied against a
-- used database (not a pristine canary — that is the blind spot caliber's rewrite exists to remove)
-- before the release.
--
-- Seed provenance (${distinctSeedRows.length} distinct records; ${configRows.length} declared across
-- ${byProvenance.size} directories, ${configRows.length - distinctSeedRows.length} of them declared in two directories and inserted once):
${summary}
-- =============================================================================================

CREATE TABLE #MoreCheeseSeed (
    EntityName NVARCHAR(255)     NOT NULL,
    RowID      UNIQUEIDENTIFIER  NOT NULL,
    PRIMARY KEY (EntityName, RowID)
);

CREATE TABLE #MoreCheeseDoomed (
    SchemaName sysname          NOT NULL,
    TableName  sysname          NOT NULL,
    RowID      UNIQUEIDENTIFIER NOT NULL,
    Depth      INT              NOT NULL,
    PRIMARY KEY (SchemaName, TableName, RowID)
);

-- ── The application configuration this app seeds, by entity name ──────────────────────────────
${seedRows}

-- ── The entity metadata this app's baseline creates, for all three schemas ────────────────────
${entityRows}

-- ── The Application row this app's baseline creates ───────────────────────────────────────────
${appRow}
${ENGINE}`;
}

function main(argv) {
    const arg = (flag) => {
        const i = argv.indexOf(flag);
        return i === -1 || i === argv.length - 1 ? null : argv[i + 1];
    };
    const outPath = arg('--out') ?? path.join(REPO_ROOT, 'migrations-teardown', 'V001__Retire_MoreCheese_Core_Rows.sql');

    const configRows = readConfigSeed(REPO_ROOT);
    const { baseline, entities, applicationId } = readBaselineCoreRows(REPO_ROOT);
    const sql = generateTeardown({ configRows, baseline, entities, applicationId });
    // Same key the emitted INSERT is distinct on, so the summary cannot drift from the file.
    const distinctSeed = new Set(configRows.map((r) => `${r.entity}|${r.id}`)).size;

    mkdirSync(path.dirname(outPath), { recursive: true });
    writeFileSync(outPath, sql, 'utf8');

    console.log(
        `Wrote ${path.relative(REPO_ROOT, outPath)} — ${distinctSeed} distinct configuration record(s) ` +
        `from ${configRows.length} declaration(s), ` +
            `${entities.length} entity row(s), ${applicationId === null ? 0 : 1} application row, ` +
            `${UNDROPPED_SCHEMAS.length} schema(s) dropped; dependents resolved at apply time.`,
    );
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url))) {
    main(process.argv.slice(2));
}
