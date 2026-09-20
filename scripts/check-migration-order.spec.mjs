/**
 * Spec for the migration ordering gate.
 *
 * The defect this gate exists for — an `EntityField` insert that runs BEFORE the `__mj.Entity` row
 * its `EntityID` subquery looks up — is invisible on the machine that authored it, because that
 * machine already has the Entity row. So is a gate that has stopped seeing it. Every case below
 * builds a throwaway migration chain in a temp directory rather than reading `migrations/`: the real
 * chain is one 16k-line baseline plus five generated seeds, it is clean today, and a spec that only
 * asserted that would stay green if `runChecks` were replaced by `() => []`.
 *
 * Each fixture exercises CHECK 3 (entity row order) alone — no `CREATE PROCEDURE`, no `__mj_*`
 * timestamp column, no table name reused across schemas — so a failure here names one rule.
 */
import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { runChecks, readMigrations, findEntityRowsCreated, findEntityFieldDependencies } from './check-migration-order.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const GATE = path.join(HERE, 'check-migration-order.mjs');

const roots = [];
after(() => {
    for (const root of roots) fs.rmSync(root, { recursive: true, force: true });
});

/**
 * A throwaway repo root holding only `migrations/`, keyed filename -> SQL.
 *
 * Real-pathed because `os.tmpdir()` is a symlink on macOS (`/var` -> `/private/var`) and the gate's
 * CLI guard compares `process.argv[1]` against `import.meta.url`, which Node resolves through the
 * link. Left unresolved, the two never match, `main()` silently does not run, and every CLI case
 * below passes against a gate that produced no output at all.
 */
function fixture(migrations) {
    const root = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'migration-order-')));
    roots.push(root);
    fs.mkdirSync(path.join(root, 'migrations'));
    for (const [name, sql] of Object.entries(migrations)) {
        fs.writeFileSync(path.join(root, 'migrations', name), sql);
    }
    return root;
}

const EARLY = 'V202601010000__v1.0.0__Early.sql';
const LATE = 'V202602010000__v1.1.0__Late.sql';

const createTable = (table) => `CREATE TABLE \${flyway:defaultSchema}.${table} (
    ID uniqueidentifier NOT NULL,
    Name nvarchar(100) NULL
);
`;

const entityRow = (table) => `INSERT INTO [\${mjSchema}].[Entity] ([ID], [Name], [BaseTable])
VALUES ('11111111-1111-1111-1111-111111111111', '${table}', '${table}');
`;

const entityFieldInsert = (table) => `INSERT INTO [\${mjSchema}].[EntityField] ([ID], [EntityID], [Name])
SELECT '22222222-2222-2222-2222-222222222222',
       (SELECT [ID] FROM [\${mjSchema}].[Entity] WHERE [BaseTable] = '${table}'),
       'Name';
`;

// ── The rejection this gate exists for ──────────────────────────────────────────────────────────

test('an EntityField insert that runs before its Entity row is a violation', () => {
    const root = fixture({
        [EARLY]: createTable('Widget') + entityFieldInsert('Widget'),
        [LATE]: entityRow('Widget'),
    });
    const violations = runChecks(root);
    assert.equal(violations.length, 1, violations.join('\n'));
    assert.match(violations[0], /Early\.sql: inserts an EntityField/);
    assert.match(violations[0], /Late\.sql is what creates that Entity row/);
});

test('the violation names the table whose Entity row is late', () => {
    const root = fixture({
        [EARLY]: createTable('Widget') + entityFieldInsert('Widget'),
        [LATE]: entityRow('Widget'),
    });
    assert.match(runChecks(root)[0], /BaseTable 'Widget'/);
});

// ── The orderings that are correct ──────────────────────────────────────────────────────────────

test('an Entity row created before the EntityField insert passes', () => {
    const root = fixture({
        [EARLY]: createTable('Widget') + entityRow('Widget'),
        [LATE]: entityFieldInsert('Widget'),
    });
    assert.deepEqual(runChecks(root), []);
});

test('an Entity row and its EntityField inserts in one migration pass', () => {
    const root = fixture({
        [EARLY]: createTable('Widget') + entityRow('Widget') + entityFieldInsert('Widget'),
    });
    assert.deepEqual(runChecks(root), []);
});

// A table this repo does not create is some other app's, and its Entity row is not ours to order.
test('an EntityField for a table no migration creates is not our ordering problem', () => {
    const root = fixture({ [EARLY]: entityFieldInsert('SomeoneElsesTable') });
    assert.deepEqual(runChecks(root), []);
});

// ── The "nothing to check yet" state ────────────────────────────────────────────────────────────

test('a repo root with no migrations directory yields no migrations and no violations', () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'migration-order-'));
    roots.push(root);
    assert.deepEqual(readMigrations(root), []);
    assert.deepEqual(runChecks(root), []);
});

// ── The parsers the rule is built on ────────────────────────────────────────────────────────────

test('the baseline sorts ahead of every versioned migration', () => {
    const root = fixture({
        [LATE]: '',
        [EARLY]: '',
        'B202512310000__v0.9.0_Baseline.sql': '',
    });
    assert.deepEqual(
        readMigrations(root).map((m) => m.file),
        ['B202512310000__v0.9.0_Baseline.sql', EARLY, LATE],
    );
});

test('a file that is not a Flyway migration is not read', () => {
    const root = fixture({ [EARLY]: '', '_README.md': 'prose', 'notes.sql': 'SELECT 1;' });
    assert.deepEqual(
        readMigrations(root).map((m) => m.file),
        [EARLY],
    );
});

test('an Entity row insert is reported for the table it names', () => {
    assert.ok(findEntityRowsCreated(entityRow('Widget')).has('Widget'));
});

test('SQL with no EntityField insert declares no Entity dependency', () => {
    assert.equal(findEntityFieldDependencies(createTable('Widget') + entityRow('Widget')).size, 0);
});

// ── Exit status ─────────────────────────────────────────────────────────────────────────────────
//
// The gate reads `migrations/` relative to its OWN file, not to the cwd, so the only way to point
// its CLI at a fixture is to run a copy of it from inside one. It is stdlib-only and imports nothing
// from this repo, so the copy behaves identically — and this is what covers the exit code, which the
// unit cases above cannot reach. Running the real gate here instead would cost ~33s and would only
// repeat what `npm run lint:migrations` already does in CI.

/** Runs the gate's CLI against a fixture root, by way of a copy that resolves its root to it. */
function runCli(root) {
    fs.mkdirSync(path.join(root, 'scripts'), { recursive: true });
    const copy = path.join(root, 'scripts', 'check-migration-order.mjs');
    fs.copyFileSync(GATE, copy);
    return spawnSync(process.execPath, [copy], { encoding: 'utf8' });
}

test('the CLI exits non-zero and names the violation when the order is wrong', () => {
    const root = fixture({
        [EARLY]: createTable('Widget') + entityFieldInsert('Widget'),
        [LATE]: entityRow('Widget'),
    });
    const run = runCli(root);
    assert.equal(run.status, 1);
    assert.match(run.stderr, /Migration ordering gate FAILED/);
    assert.match(run.stderr, /1 violation\(s\)/);
});

test('the CLI exits 0 and reports how many files it read when the order is right', () => {
    const root = fixture({
        [EARLY]: createTable('Widget') + entityRow('Widget'),
        [LATE]: entityFieldInsert('Widget'),
    });
    const run = runCli(root);
    assert.equal(run.status, 0, run.stderr);
    assert.match(run.stdout, /Migration ordering gate passed \(2 migration file\(s\) read\)/);
});
