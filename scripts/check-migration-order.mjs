#!/usr/bin/env node
/**
 * Migration ordering gate — catch the ways a regenerated migration silently undoes the one before it.
 *
 * Ported from `bizapps-forms/scripts/check-migration-order.mjs`. `migrations/` is the only thing that
 * ships, and its files are applied in version order on a database nobody here has seen. Every defect
 * this gate looks for is invisible on the box that authored it, because that box already ran the
 * statements by hand — which is exactly how both of the defects that motivated the forms original
 * reached a pull request.
 *
 * The failure mode is always the same shape: CodeGen is re-run against a database in state N, its
 * output is appended to a migration that will apply at state N+1, and the difference between the two
 * states is a column somebody added an hour earlier. SQL Server does not complain — the later
 * DROP/CREATE wins, the column keeps existing, and the entity metadata keeps pointing at a parameter
 * the procedure no longer has. The first person to notice is a user whose save fails.
 *
 * ── WHAT THE PORT CHANGED, AND WHY ────────────────────────────────────────────────────────────
 * Forms is single-schema: its regexes spell the app schema as `[${flyway:defaultSchema}]` or
 * `[__mj_<Something>]`, always bracketed. more-cheese is a deliberate THREE-schema app —
 * `morecheese_members` (the declared one, written `${flyway:defaultSchema}`) plus `morecheese_events`
 * and `morecheese_learning`, created by the baseline — and its baseline writes schema and table names
 * BARE as often as bracketed (`CREATE TABLE morecheese_events.Event (`,
 * `CREATE TABLE ${flyway:defaultSchema}.OrganizationProfile (`). Under the forms patterns, which
 * require brackets, every one of those twelve tables is invisible: the gate would pass because it
 * could not see the code, which is worse than no gate. {@link SCHEMA_REF} is the one place that
 * spelling lives.
 *
 * ── WHAT THE PORT ADDED: CHECK 4 ──────────────────────────────────────────────────────────────
 * Every map below is keyed on BASE TABLE NAME, because that is what CodeGen names a procedure after
 * (`spCreateEvent`, not `spCreateEventsEvent`) — it has no schema to key on. In a single-schema app
 * that is exact. Here it is exact only because the twelve base tables happen to be distinct across
 * the three schemas. CHECK 4 asserts that coincidence rather than relying on it: the day
 * `morecheese_events.Course` joins `morecheese_learning.Course`, every check in this file starts
 * silently conflating two tables, and CodeGen's own procedure names become ambiguous too.
 *
 * Plain Node, stdlib only, matching `check-distribution-seed.mjs` and `check-peer-ranges.mjs`: a
 * gate that guards the shipping artifact must be runnable in CI without installing anything.
 */
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

/**
 * Every spelling a schema reference takes in this repo's shipped SQL, as regex source.
 *
 * Six shapes, all of them present in `B202607141200`: the app-schema placeholder bracketed and bare,
 * a literal sibling schema bracketed and bare, and the core schema as `[${mjSchema}]` or a literal
 * `[__mj…]`. Requiring brackets — which is all the forms original needed — hides the entire baseline.
 *
 * Deliberately not `\w+` for the literal case: a pattern that matched ANY identifier would read
 * `dbo.SomeHostTable` or a sibling Open App's schema as ours, and CHECK 1 would then demand that a
 * procedure this repo does not own carry a parameter for a column this repo does not own.
 */
const SCHEMA_REF = '(?:\\[\\$\\{flyway:defaultSchema\\}\\]|\\$\\{flyway:defaultSchema\\}|\\[morecheese_\\w+\\]|morecheese_\\w+|\\[\\$\\{mjSchema\\}\\]|\\[?__mj\\w*\\]?)';

/** The app's own schemas, as shipped SQL spells them — used by CHECK 4's collision report. */
function schemaOf(reference) {
    return reference.replace(/^\[|\]$/g, '');
}

/**
 * The timestamp columns CodeGen adds to every entity table.
 *
 * Migrations must never hand-add these, which means a migration that *references* one is depending
 * on a CodeGen block in some other file — and the ordering between the two is the thing nobody checks.
 */
export const CODEGEN_TIMESTAMP_COLUMNS = ['__mj_CreatedAt', '__mj_UpdatedAt'];

/** Migration files in the order Flyway will apply them. */
export function readMigrations(root) {
    const dir = join(root, 'migrations');
    if (!existsSync(dir)) {
        return [];
    }
    // Baseline (`B…`) files count. In forms, excluding them left ten of thirteen tables outside every
    // check below; here it would leave ALL TWELVE outside, because `B202607141200` is the only
    // migration this repo has.
    return readdirSync(dir)
        .filter((f) => /^[BV]\d+__.*\.sql$/.test(f))
        // Flyway applies the baseline first, then versioned migrations in version order.
        .sort((a, b) => (a[0] === b[0] ? a.localeCompare(b) : a[0] === 'B' ? -1 : 1))
        .map((file) => ({
            file,
            version: file.slice(1, file.indexOf('__')),
            sql: readFileSync(join(dir, file), 'utf8'),
        }));
}

/**
 * Business columns a migration adds to a table, as `{ schema, table, column }` triples.
 *
 * Deliberately ignores `__mj_*`: those are CodeGen's, they are checked separately, and treating them
 * as business columns would demand a `@__mj_CreatedAt` parameter that no procedure has.
 */
export function findColumnsAdded(sql) {
    const found = [];
    for (const [, schema, table, body] of sql.matchAll(
        new RegExp(`CREATE TABLE\\s+(${SCHEMA_REF})\\.\\[?(\\w+)\\]?\\s*\\(([\\s\\S]*?)\\n\\s*\\);`, 'g'),
    )) {
        for (const column of columnNamesFromBody(body)) {
            found.push({ schema: schemaOf(schema), table, column });
        }
    }
    for (const [, schema, table, body] of sql.matchAll(
        new RegExp(`ALTER TABLE\\s+(${SCHEMA_REF})\\.\\[?(\\w+)\\]?\\s+ADD\\b([\\s\\S]*?);`, 'g'),
    )) {
        for (const column of columnNamesFromBody(body)) {
            found.push({ schema: schemaOf(schema), table, column });
        }
    }
    return found;
}

/**
 * Column names from a `CREATE TABLE` or `ALTER TABLE … ADD` body.
 *
 * One parser for both: in forms they were separate copies of the same line-by-line rules, which is
 * how the two of them came to disagree about which lines to skip.
 */
function columnNamesFromBody(body) {
    const names = [];
    for (const rawLine of body.split('\n')) {
        const line = rawLine.trim().replace(/^,/, '').trim();
        // Table-level constraints, and the continuation lines that belong to them. Without `ON` and
        // friends, `ON DELETE CASCADE;` parses as a column named `ON` and the gate fails a perfectly
        // good foreign-key migration with a nonsense message. This repo's baseline ends every table
        // with a `CONSTRAINT PK_…`/`UQ_…`/`CK_…` block, so these are load-bearing on the first run.
        if (
            line === '' ||
            line.startsWith('--') ||
            /^(CONSTRAINT|PRIMARY|FOREIGN|UNIQUE|CHECK|INDEX|ON|WITH|REFERENCES|DEFAULT)\b/i.test(line)
        ) {
            continue;
        }
        // A computed column (`Total AS (Price * Qty)`) is not writable, so CodeGen never gives it a
        // parameter — demanding one would fail correct output.
        if (/^\[?\w+\]?\s+AS\b/i.test(line)) {
            continue;
        }
        const match = line.match(/^\[?(\w+)\]?\s+\w/);
        if (match && !match[1].startsWith('__mj_')) {
            names.push(match[1]);
        }
    }
    return names;
}

/**
 * Every `CREATE PROCEDURE` in a migration, as `{ name, params }`.
 *
 * The parameter list is everything between the procedure name and the `AS` that opens its body.
 */
export function findProcedures(sql) {
    const procs = [];
    for (const match of sql.matchAll(
        new RegExp(`CREATE PROCEDURE\\s+${SCHEMA_REF}\\.\\[?(\\w+)\\]?([\\s\\S]*?)\\nAS\\b`, 'g'),
    )) {
        const [, name, paramBlock] = match;
        procs.push({ name, params: [...paramBlock.matchAll(/@(\w+)/g)].map((p) => p[1]) });
    }
    return procs;
}

/** Tables for which a migration creates the `__mj.Entity` row. */
export function findEntityRowsCreated(sql) {
    const tables = new Set();
    for (const match of sql.matchAll(/INSERT INTO\s+\[\$\{mjSchema\}\]\.\[Entity\]([\s\S]{0,4000})/g)) {
        for (const [, table] of match[1].matchAll(/'(\w+)'/g)) {
            // The BaseTable value is the only bare table name in the VALUES list; matching every
            // quoted token and intersecting with known tables downstream keeps this parser dumb.
            tables.add(table);
        }
    }
    return tables;
}

/** Tables whose `__mj.Entity` row a migration's `EntityField` inserts depend on. */
export function findEntityFieldDependencies(sql) {
    const tables = new Set();
    if (!/INSERT INTO\s+\[\$\{mjSchema\}\]\.\[EntityField\]/.test(sql)) {
        return tables;
    }
    for (const [, table] of sql.matchAll(
        /FROM\s+\[\$\{mjSchema\}\]\.\[Entity\]\s+WHERE\s+\[?BaseTable\]?\s*=\s*'(\w+)'/g,
    )) {
        tables.add(table);
    }
    return tables;
}

/**
 * The four ordering invariants, run over the migration chain in apply order.
 *
 * Returns a list of human-readable violations; empty means the chain is consistent.
 */
export function runChecks(root = REPO_ROOT) {
    const migrations = readMigrations(root);
    const violations = [];

    // Columns present on each table at each point in the chain, and where each came from.
    const columnsByTable = new Map();
    // Which schema(s) each base table name has been created in — CHECK 4's input.
    const schemasByTable = new Map();
    // The last migration to define each procedure, with the parameters it gave it.
    const lastProcDefinition = new Map();
    // Where each table's Entity row and CodeGen timestamp columns first appear.
    const entityRowVersion = new Map();
    const timestampVersion = new Map();

    for (const migration of migrations) {
        for (const { schema, table, column } of findColumnsAdded(migration.sql)) {
            if (!columnsByTable.has(table)) {
                columnsByTable.set(table, new Map());
            }
            columnsByTable.get(table).set(column, migration);
            if (!schemasByTable.has(table)) {
                schemasByTable.set(table, new Map());
            }
            if (!schemasByTable.get(table).has(schema)) {
                schemasByTable.get(table).set(schema, migration);
            }
        }
        for (const proc of findProcedures(migration.sql)) {
            lastProcDefinition.set(proc.name, { proc, migration, columnsThen: snapshotColumns(columnsByTable) });
        }
        for (const table of findEntityRowsCreated(migration.sql)) {
            if (!entityRowVersion.has(table)) {
                entityRowVersion.set(table, migration);
            }
        }
        for (const [, table] of migration.sql.matchAll(
            new RegExp(`ALTER TABLE\\s+${SCHEMA_REF}\\.\\[?(\\w+)\\]?\\s+ADD\\s+\\[__mj_(?:Created|Updated)At\\]`, 'g'),
        )) {
            if (!timestampVersion.has(table)) {
                timestampVersion.set(table, migration);
            }
        }
    }

    violations.push(...checkBaseTableNamesAreUnique(schemasByTable));
    violations.push(...checkProcParity(lastProcDefinition, columnsByTable));
    violations.push(...checkTimestampOrder(migrations, timestampVersion, columnsByTable));
    violations.push(...checkEntityRowOrder(migrations, entityRowVersion, columnsByTable));
    return violations;
}

/** A point-in-time copy of the column map, so a later migration cannot rewrite history. */
function snapshotColumns(columnsByTable) {
    const copy = new Map();
    for (const [table, columns] of columnsByTable) {
        copy.set(table, new Set(columns.keys()));
    }
    return copy;
}

/**
 * CHECK 4 — one base table name may not live in two of this app's schemas.
 *
 * ADDED IN THE PORT; forms, being single-schema, cannot have this problem and does not check for it.
 *
 * Every other check here is keyed on base table NAME, because that is the only key CodeGen's
 * procedure names carry: `spCreateEvent` says nothing about which schema `Event` is in. With twelve
 * distinct base tables across `morecheese_members`, `morecheese_events` and `morecheese_learning`
 * that keying is exact. The moment two schemas share a name it stops being exact and starts being
 * WRONG in the quiet direction: CHECK 1 would union both tables' columns and demand parameters for
 * the other table's, or — worse — accept a procedure that is missing half of one table's columns
 * because the other table's definition supplied them.
 *
 * So the coincidence is asserted rather than assumed. If a collision is ever legitimate, the fix is
 * to key these maps on schema+table and to teach CHECK 1 which schema a procedure was declared in;
 * it is not to delete this check.
 */
function checkBaseTableNamesAreUnique(schemasByTable) {
    const violations = [];
    for (const [table, schemas] of schemasByTable) {
        if (schemas.size < 2) {
            continue;
        }
        const where = [...schemas.entries()].map(([schema, m]) => `${schema} (${m.file})`).join(' and ');
        violations.push(
            `base table \`${table}\` is created in ${schemas.size} schemas — ${where}. This app is deliberately ` +
                'multi-schema, but every check in this gate is keyed on base table NAME, because that is the only ' +
                'key CodeGen\'s procedure names carry: `spCreate' + table + '` does not say which schema it writes. ' +
                'With a collision those checks silently conflate two tables — the parameter-parity check would union ' +
                'both column sets, or accept a procedure missing one table\'s columns because the other supplied ' +
                'them. Rename one of the tables, or key this gate on schema+table and teach the parity check which ' +
                'schema each procedure was declared in.',
        );
    }
    return violations;
}

/**
 * CHECK 1 — the last definition of `spCreateX`/`spUpdateX` must know every column X has.
 *
 * This is forms' SocialLinks defect: `V202608191200` added the column and regenerated the procedures
 * with it, then `V202608191300` — generated an hour earlier against a database without the column —
 * dropped and recreated the same procedures without the parameter. The `EntityField` row survives, so
 * MJ keeps composing an EXEC that passes `@SocialLinks` to a procedure that has no such parameter,
 * and every save of that entity fails.
 */
function checkProcParity(lastProcDefinition, columnsAtEnd) {
    const violations = [];
    for (const [name, { proc, migration, columnsThen }] of lastProcDefinition) {
        const table = name.match(/^sp(?:Create|Update)(\w+)$/)?.[1];
        if (!table || !columnsAtEnd.has(table)) {
            continue;
        }
        const params = new Set(proc.params);
        // Measured against the columns the table has at the END of the chain, not just the ones it had
        // when this procedure was last written. Comparing only against `columnsThen` left the forms
        // gate blind to the commoner half of this defect: a migration that adds a column and never
        // regenerates the procedure at all. `columnsThen` is kept because it distinguishes the two
        // causes in the message.
        const missing = [...columnsAtEnd.get(table).keys()].filter((c) => !params.has(c));
        if (missing.length > 0) {
            const thrownAway = missing.filter((c) => columnsThen.get(table)?.has(c));
            violations.push(
                `${migration.file}: ${name} is the last definition of that procedure but has no parameter for ` +
                    `${missing.map((m) => `[${m}]`).join(', ')} on table ${table}. ` +
                    (thrownAway.length > 0
                        ? `A later migration regenerated it from a database that predated ` +
                          `${thrownAway.map((m) => `[${m}]`).join(', ')}, throwing the parameter away.`
                        : `A later migration adds the column and never regenerates this procedure.`) +
                    ` Either way the column ships with no way to write it, and once its EntityField ` +
                    `row exists every save of the entity fails with "too many arguments specified".`,
            );
        }
    }
    return violations;
}

/**
 * CHECK 2 — nothing may reference `__mj_CreatedAt`/`__mj_UpdatedAt` before they are added.
 *
 * SQL Server resolves column names against an existing table at CREATE time, so a trigger that
 * touches a column the table does not have yet is `Msg 207` and a halted migration chain — on a fresh
 * install only, which is the one place nobody tests. This repo's baseline is full of exactly that
 * pairing: `trgUpdateEvent` writes `__mj_UpdatedAt` bare, and an `ALTER TABLE … ADD` earlier in the
 * same file is what creates it.
 */
function checkTimestampOrder(migrations, timestampVersion, columnsByTable) {
    const violations = [];
    for (const migration of migrations) {
        for (const table of columnsByTable.keys()) {
            if (!referencesTimestampColumnOf(migration.sql, table)) {
                continue;
            }
            const adds = timestampVersion.get(table);
            if (adds && adds.version > migration.version) {
                violations.push(
                    `${migration.file}: references a CodeGen timestamp column on ${table}, but ${adds.file} is ` +
                        `what adds it — and that runs later. On a database built only from migrations/ the column ` +
                        `does not exist yet, so this fails with "Invalid column name" and halts the chain.`,
                );
            }
        }
    }
    return violations;
}

/** Whether a migration touches a CodeGen timestamp column in a statement about `table`. */
function referencesTimestampColumnOf(sql, table) {
    for (const column of CODEGEN_TIMESTAMP_COLUMNS) {
        // Brackets optional on the column: CodeGen's own trigger body writes `__mj_UpdatedAt` bare —
        // `trgUpdateEvent` in this repo's baseline does exactly that — and requiring `[...]` is
        // precisely what let the trigger-before-column defect through the first draft of the forms gate.
        const pattern = new RegExp(
            `(?:TRIGGER|UPDATE|SET|SELECT|INSERT)[\\s\\S]{0,600}?\\[?${table}\\]?[\\s\\S]{0,600}?\\[?${column}\\]?`,
            'g',
        );
        // The ALTER that ADDs the column is the definition, not a reference to a missing one.
        const withoutAdds = sql.replace(
            new RegExp(`ALTER TABLE[^;]*?\\[?${table}\\]?[^;]*?ADD\\s+\\[?${column}\\]?[^;]*;`, 'g'),
            '',
        );
        if (pattern.test(withoutAdds)) {
            return true;
        }
    }
    return false;
}

/**
 * CHECK 3 — an `EntityField` insert may not precede the `Entity` row it points at.
 *
 * `EntityField.EntityID` is NOT NULL, and CodeGen writes the id as a subquery against `__mj.Entity`.
 * When the entity row is created by a *later* migration the subquery yields NULL, the `IF NOT EXISTS`
 * guard passes on the NULL comparison, and the insert dies on the NOT NULL constraint — again only on
 * a fresh install.
 */
function checkEntityRowOrder(migrations, entityRowVersion, columnsByTable) {
    const violations = [];
    for (const migration of migrations) {
        for (const table of findEntityFieldDependencies(migration.sql)) {
            if (!columnsByTable.has(table)) {
                continue;
            }
            const creates = entityRowVersion.get(table);
            if (creates && creates.version > migration.version) {
                violations.push(
                    `${migration.file}: inserts an EntityField whose EntityID is looked up from __mj.Entity for ` +
                        `BaseTable '${table}', but ${creates.file} is what creates that Entity row — and it runs ` +
                        `later. On a fresh database the lookup returns NULL and the insert violates ` +
                        `EntityField.EntityID NOT NULL, aborting the install.`,
                );
            }
        }
    }
    return violations;
}

/** CLI entry point. */
function main() {
    const migrations = readMigrations(REPO_ROOT);
    const violations = runChecks();
    if (violations.length > 0) {
        console.error('Migration ordering gate FAILED:\n');
        for (const v of violations) {
            console.error(`  ✗ ${v}\n`);
        }
        console.error(`${violations.length} violation(s).`);
        process.exit(1);
    }
    // The count is printed because "passed" over an empty chain and "passed" over the real one look
    // identical otherwise, and this repo has exactly one migration today — a directory that stopped
    // being read would be indistinguishable from a healthy run.
    console.log(`Migration ordering gate passed (${migrations.length} migration file(s) read).`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
    main();
}
