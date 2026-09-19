/**
 * Spec for the distribution gate's placeholder rule (its CHECK 2).
 *
 * `mj app install` resolves exactly two placeholders — `${flyway:defaultSchema}` and `${mjSchema}` —
 * and Skyway leaves an unknown one UNTOUCHED rather than failing. A third placeholder therefore does
 * not error on the host: it ships as a literal `${...}` inside whatever SQL contained it, and the
 * install breaks somewhere with no mention of the file that caused it. That is invisible from inside
 * this repo, where `mj migrate` builds its placeholder map from OUR `mj.config.cjs` and resolves it
 * fine.
 *
 * Every case builds a throwaway repo root, so none depends on `migrations/` being clean today — and
 * so the rejection cases exist at all, which they could not if the spec only ran the real tree.
 *
 * Scope: CHECK 2 only. The fixtures carry no INSERT, no schema-sync call, no extended property and
 * no entity id, so checks 4 through 7 stay silent and a failure here names one rule.
 */
import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { runChecks } from './check-distribution-seed.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const GATE = path.join(HERE, 'check-distribution-seed.mjs');

const roots = [];
after(() => {
    for (const root of roots) fs.rmSync(root, { recursive: true, force: true });
});

/**
 * A throwaway repo root, keyed `<dir>/<file>` -> SQL.
 *
 * Real-pathed: `os.tmpdir()` is a symlink on macOS, and the gate resolves its own repo root through
 * `import.meta.url`, which Node resolves through the link. Without this the CLI cases below would
 * compare paths that can never be equal.
 */
function fixture(files) {
    const root = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'distribution-seed-')));
    roots.push(root);
    for (const [rel, sql] of Object.entries(files)) {
        const full = path.join(root, rel);
        fs.mkdirSync(path.dirname(full), { recursive: true });
        fs.writeFileSync(full, sql);
    }
    return root;
}

const SEED = 'migrations/V202609190000__v1.2.0__Metadata_Sync_Part1of1.sql';
const TEARDOWN = 'migrations-teardown/V001__Retire.sql';

const createTable = (schema) => `CREATE TABLE ${schema}.[Widget] (
    [ID] uniqueidentifier NOT NULL
);
`;

// ── The rejection this gate exists for ──────────────────────────────────────────────────────────

test('a third placeholder in shipped SQL is a violation', () => {
    const root = fixture({ [SEED]: createTable('${appSchema}') });
    const violations = runChecks(root);
    assert.equal(violations.length, 1, violations.join('\n'));
    assert.match(violations[0], /uses \$\{appSchema\}, which `mj app install` does not supply/);
    assert.match(violations[0], /would ship as a literal string/);
});

test('the violation names the file carrying the placeholder', () => {
    const root = fixture({ [SEED]: createTable('${appSchema}') });
    assert.match(runChecks(root)[0], /Metadata_Sync_Part1of1\.sql/);
});

// One message per unknown name per file, not one per occurrence: a generated seed writes the same
// placeholder hundreds of times, and a report of hundreds of identical lines gets skimmed.
test('a placeholder used many times in one file is reported once', () => {
    const root = fixture({ [SEED]: createTable('${appSchema}').repeat(5) });
    assert.equal(runChecks(root).length, 1);
});

test('each distinct unknown placeholder gets its own violation', () => {
    const root = fixture({ [SEED]: createTable('${appSchema}') + createTable('${otherSchema}') });
    assert.equal(runChecks(root).length, 2);
});

// The teardown path is the non-obvious half of the rule: MJ substitutes ONLY ${mjSchema} there, by
// literal string split with no Skyway involved, so the app schema placeholder that is legal three
// directories away is a defect here.
test('the app schema placeholder is a violation in a teardown script', () => {
    const root = fixture({ [TEARDOWN]: createTable('[${flyway:defaultSchema}]') });
    const violations = runChecks(root);
    assert.equal(violations.length, 1, violations.join('\n'));
    assert.match(violations[0], /uses \$\{flyway:defaultSchema\}/);
    assert.match(violations[0], /it resolves only \$\{mjSchema\}/);
});

// ── What the rule allows ────────────────────────────────────────────────────────────────────────

test('SQL using only the two install-supplied placeholders passes', () => {
    const root = fixture({
        [SEED]: createTable('[${flyway:defaultSchema}]') + createTable('[${mjSchema}]'),
    });
    assert.deepEqual(runChecks(root), []);
});

test('a literal schema name is always allowed', () => {
    const root = fixture({ [SEED]: createTable('morecheese_events'), [TEARDOWN]: createTable('morecheese_learning') });
    assert.deepEqual(runChecks(root), []);
});

test('the core schema placeholder is allowed in a teardown script', () => {
    const root = fixture({ [TEARDOWN]: createTable('[${mjSchema}]') });
    assert.deepEqual(runChecks(root), []);
});

// The mask exists so that the header comments these files carry — which discuss placeholders by name
// at length — are not read as using them.
test('a placeholder named in a comment is not a use of it', () => {
    const root = fixture({ [SEED]: `-- never write \${appSchema} here\n${createTable('[${mjSchema}]')}` });
    assert.deepEqual(runChecks(root), []);
});

// A placeholder inside a string body really would ship unresolved, so the mask must NOT blank it.
test('a placeholder inside a string literal is still a use of it', () => {
    const root = fixture({ [SEED]: `INSERT INTO [\${mjSchema}].[T] ([S]) VALUES (N'\${appSchema}');\n` });
    assert.equal(runChecks(root).length, 1);
});

// ── The "nothing to check yet" state ────────────────────────────────────────────────────────────

test('a repo root with no shipped SQL directories yields no violations', () => {
    const root = fixture({});
    assert.deepEqual(runChecks(root), []);
});

test('a non-SQL file in migrations is not read', () => {
    const root = fixture({ 'migrations/_README.md': 'we do not use ${appSchema} here\n' });
    assert.deepEqual(runChecks(root), []);
});

// ── Exit status ─────────────────────────────────────────────────────────────────────────────────
//
// The gate resolves its repo root from its OWN file location, so the only way to point the CLI at a
// fixture is to run a copy of it from inside one. It is stdlib-only and imports nothing from this
// repo, so the copy behaves identically. This is what covers the exit code — the unit cases above
// cannot reach it, and running the real gate here would only repeat `npm run lint:distribution`.

function runCli(root) {
    fs.mkdirSync(path.join(root, 'scripts'), { recursive: true });
    const copy = path.join(root, 'scripts', 'check-distribution-seed.mjs');
    fs.copyFileSync(GATE, copy);
    return spawnSync(process.execPath, [copy], { encoding: 'utf8' });
}

test('the CLI exits non-zero and prints the violation', () => {
    const run = runCli(fixture({ [SEED]: createTable('${appSchema}') }));
    assert.equal(run.status, 1);
    assert.match(run.stderr, /Distribution gate failed/);
    assert.match(run.stderr, /\$\{appSchema\}/);
});

test('the CLI exits 0 over shipped SQL that only uses install-supplied placeholders', () => {
    const run = runCli(fixture({ [SEED]: createTable('[${flyway:defaultSchema}]') }));
    assert.equal(run.status, 0, run.stderr);
    assert.match(run.stdout, /Distribution gate passed over 1 shipped SQL file/);
});
