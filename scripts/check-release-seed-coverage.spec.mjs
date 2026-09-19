/**
 * Spec for the release seed coverage gate.
 *
 * Adapted from `bizapps-forms/scripts/check-release-seed-coverage.spec.mjs`. Each case builds a
 * throwaway repo root in a temp directory, so none of them depends on what is checked in here today —
 * which matters more than usual for this gate, because the real tree is 90 MB and currently has no
 * seed at all.
 *
 * The cases that are NOT in the forms original are the ones covering the port's three changes: two
 * sync trees instead of one, records that are DOTFILES, and the "no seed has been cut yet" state
 * reported as one sentence rather than 122,045 uncovered ids.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { mkdtempSync, mkdirSync, writeFileSync, readdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { spawnSync } from 'node:child_process';
import { SYNC_TREES, findSeedCoverageGaps } from './check-release-seed-coverage.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.join(HERE, '..');

const ID_A = 'AAAAAAAA-1111-2222-3333-444444444444';
const ID_B = 'BBBBBBBB-1111-2222-3333-444444444444';

/**
 * A throwaway repo root.
 *
 * `trees` maps `generated`/`config` to `{ '<dir>/<file>': <json> }`; `migrations` maps filename to
 * SQL text. Both sync trees are created unless explicitly omitted, because a missing tree is itself
 * a reported condition and most cases are not about that.
 */
function fixture({ trees = {}, migrations = {} } = {}) {
    const root = mkdtempSync(path.join(tmpdir(), 'seed-coverage-'));
    for (const tree of SYNC_TREES) {
        mkdirSync(path.join(root, tree), { recursive: true });
        for (const [rel, body] of Object.entries(trees[tree] ?? {})) {
            const full = path.join(root, tree, rel);
            mkdirSync(path.dirname(full), { recursive: true });
            writeFileSync(full, typeof body === 'string' ? body : JSON.stringify(body, null, 2));
        }
    }
    mkdirSync(path.join(root, 'migrations'), { recursive: true });
    for (const [name, sql] of Object.entries(migrations)) {
        writeFileSync(path.join(root, 'migrations', name), sql);
    }
    return root;
}

const record = (id) => ({ fields: { Name: 'x' }, primaryKey: { ID: id } });
const seed = (...ids) => ids.map((i) => `EXEC spCreateThing @ID='${i}'`).join('\n');
const SEED_NAME = 'V202609180900__v1.2.0__Metadata_Sync_Part1of1.sql';
const BASELINE = 'B202607141200__v1.0.0_MoreCheese_Baseline.sql';

// ── The happy path ──────────────────────────────────────────────────────────────────────────────

test('every declared id named by the seed passes', () => {
    const root = fixture({
        trees: {
            generated: { 'people/.people.json': [record(ID_A)] },
            config: { 'users/.7fe3b684.json': record(ID_B) },
        },
        migrations: { [SEED_NAME]: seed(ID_A, ID_B) },
    });
    const { problems, idsChecked, filesRead } = findSeedCoverageGaps(root);
    assert.deepEqual(problems, [], problems.join('\n'));
    assert.equal(idsChecked, 2);
    assert.equal(filesRead, 2);
});

// The ids in shipped SQL are lower-case as often as upper; a host does not care and neither may this.
test('id casing does not decide coverage', () => {
    const root = fixture({
        trees: { generated: { 'people/.people.json': [record(ID_A)] } },
        migrations: { [SEED_NAME]: seed(ID_A.toLowerCase()) },
    });
    assert.deepEqual(findSeedCoverageGaps(root).problems, []);
});

// ── The port's changes ──────────────────────────────────────────────────────────────────────────

// The reflex is to skip dotfiles; every record in this repo is one, so a walker that skipped them
// would read nothing and report perfect coverage of zero records.
test('record files are dotfiles and are read', () => {
    const root = fixture({
        trees: { generated: { 'people/.people.json': [record(ID_A)] } },
        migrations: { [SEED_NAME]: seed() },
    });
    const { problems, idsChecked } = findSeedCoverageGaps(root);
    assert.equal(idsChecked, 1);
    assert.equal(problems.length, 1);
    assert.match(problems[0], new RegExp(ID_A));
});

test('config/ is in scope, not just generated/', () => {
    const root = fixture({
        trees: { config: { 'dashboards/.abc.json': record(ID_B) } },
        migrations: { [SEED_NAME]: seed() },
    });
    const { problems } = findSeedCoverageGaps(root);
    assert.equal(problems.length, 1);
    assert.match(problems[0], /config\/dashboards/);
});

// The state this repo is in today: one sentence with a count, not a dump of every declared id.
test('no seed at all is reported as one finding, whatever the tree holds', () => {
    const root = fixture({
        trees: {
            generated: { 'people/.people.json': [record(ID_A), record(ID_B)] },
            config: { 'users/.u.json': record('CCCCCCCC-1111-2222-3333-444444444444') },
        },
        migrations: { [BASELINE]: '-- schema only' },
    });
    const { problems, idsChecked } = findSeedCoverageGaps(root);
    assert.equal(idsChecked, 3);
    assert.equal(problems.length, 1, problems.join('\n'));
    assert.match(problems[0], /contains NO \*Metadata_Sync\*\.sql/);
    assert.match(problems[0], /3 record IDs/);
    // The point of the special case: the ids themselves are NOT listed.
    assert.ok(!problems[0].includes(ID_A));
});

// `checkpoint.json` is the generator's own state, and the one non-dotfile in the tree — so it is the
// one file `mj sync` itself never pushes. Demanding its ids of the seed would be a gap nobody could close.
test('checkpoint.json is not a record file', () => {
    const root = fixture({
        trees: {
            generated: { 'checkpoint.json': [record(ID_A)], 'people/.people.json': [record(ID_B)] },
        },
        migrations: { [SEED_NAME]: seed(ID_B) },
    });
    const { problems, idsChecked } = findSeedCoverageGaps(root);
    assert.equal(idsChecked, 1);
    assert.deepEqual(problems, []);
});

test('.mj-sync.json is directory configuration, not a record', () => {
    const root = fixture({
        trees: {
            generated: {
                'people/.mj-sync.json': { entity: 'MJ_BizApps_Common: People', primaryKey: { ID: ID_A } },
                'people/.people.json': [record(ID_B)],
            },
        },
        migrations: { [SEED_NAME]: seed(ID_B) },
    });
    assert.deepEqual(findSeedCoverageGaps(root).problems, []);
});

test('push by-product directories are not read', () => {
    const root = fixture({
        trees: { generated: { 'people/.backups/.old.json': [record(ID_A)], 'people/.people.json': [record(ID_B)] } },
        migrations: { [SEED_NAME]: seed(ID_B) },
    });
    assert.deepEqual(findSeedCoverageGaps(root).problems, []);
});

// ── Nesting ─────────────────────────────────────────────────────────────────────────────────────

// A child that ships nowhere is as invisible to a host as a root one. This repo nests heavily —
// order lines, committee meeting agenda items, payment lines.
test('a nested child record is checked too', () => {
    const root = fixture({
        trees: {
            generated: {
                'orders/.orders.json': [{ ...record(ID_A), collections: { Lines: [record(ID_B)] } }],
            },
        },
        migrations: { [SEED_NAME]: seed(ID_A) },
    });
    const { problems, idsChecked } = findSeedCoverageGaps(root);
    assert.equal(idsChecked, 2);
    assert.equal(problems.length, 1);
    assert.match(problems[0], new RegExp(ID_B));
});

test('a relatedEntities child is checked too', () => {
    const root = fixture({
        trees: {
            generated: { 'products/.p.json': [{ ...record(ID_A), relatedEntities: { Prices: [record(ID_B)] } }] },
        },
        migrations: { [SEED_NAME]: seed(ID_A, ID_B) },
    });
    assert.equal(findSeedCoverageGaps(root).idsChecked, 2);
});

// ── Failure reporting ───────────────────────────────────────────────────────────────────────────

// This output IS the pending list; a file that owes twelve records while naming one sends the build
// engineer back to the repo to derive the rest.
test('every uncovered id is listed, not a sample', () => {
    const ids = Array.from({ length: 5 }, (_, i) => `AAAAAAAA-1111-2222-3333-00000000000${i}`);
    const root = fixture({
        trees: { generated: { 'people/.people.json': ids.map(record) } },
        migrations: { [SEED_NAME]: seed() },
    });
    const { problems } = findSeedCoverageGaps(root);
    assert.equal(problems.length, 1);
    for (const id of ids) assert.match(problems[0], new RegExp(id));
});

// A record file this script cannot read is a record it cannot vouch for.
test('an unparseable record file is reported with the parser reason', () => {
    const root = fixture({
        trees: { generated: { 'people/.people.json': '{ not json' } },
        migrations: { [SEED_NAME]: seed() },
    });
    const { problems } = findSeedCoverageGaps(root);
    assert.ok(problems.some((p) => /could not be read as JSON/.test(p)));
});

// JSON.parse rejects a BOM; `mj sync` and every other reader accept it, so failing here would fail a
// file that is not actually wrong.
test('a byte-order mark does not fail a valid record file', () => {
    const root = fixture({
        trees: { generated: { 'people/.people.json': `﻿${JSON.stringify([record(ID_A)])}` } },
        migrations: { [SEED_NAME]: seed(ID_A) },
    });
    assert.deepEqual(findSeedCoverageGaps(root).problems, []);
});

// ── Vacuity: a probe that measures nothing must not report success ──────────────────────────────

test('empty sync trees fail as "measured nothing" rather than passing', () => {
    const root = fixture({ migrations: { [SEED_NAME]: seed() } });
    const { problems, idsChecked } = findSeedCoverageGaps(root);
    assert.equal(idsChecked, 0);
    assert.ok(problems.some((p) => /measured NOTHING/.test(p)));
});

test('records with no primaryKey fail as "measured nothing"', () => {
    const root = fixture({
        trees: { generated: { 'people/.people.json': [{ fields: { Name: 'x' } }] } },
        migrations: { [SEED_NAME]: seed() },
    });
    assert.ok(findSeedCoverageGaps(root).problems.some((p) => /measured NOTHING/.test(p)));
});

test('an empty migrations/ is a broken run, not a finding', () => {
    const root = fixture({ trees: { generated: { 'people/.people.json': [record(ID_A)] } } });
    const { problems } = findSeedCoverageGaps(root);
    assert.equal(problems.length, 1);
    assert.match(problems[0], /broken run, not a finding/);
});

test('a root with neither sync tree is reported as not the repo root', () => {
    const root = mkdtempSync(path.join(tmpdir(), 'seed-coverage-'));
    const { problems } = findSeedCoverageGaps(root);
    assert.equal(problems.length, 1);
    assert.match(problems[0], /not the repo root/);
});

// ── The real repo ───────────────────────────────────────────────────────────────────────────────

// The checked-in repo has two legitimate states and the gate must be right in both: before the first
// seed was cut (one "contains NO *Metadata_Sync*.sql" finding), and after it (every declared id covered,
// zero findings). Which state the tree is in is read from migrations/, not assumed, so this test keeps
// passing as seeds are cut and consolidated — and still fails if a seed lands that misses records.
const repoHasSeed = readdirSync(path.join(REPO_ROOT, 'migrations')).some((f) => /Metadata[_ -]?Sync.*\.sql$/i.test(f));

test('the checked-in repo is measured over a tree it actually read, in whichever seed state it is in', () => {
    const { problems, idsChecked, filesRead, seedFiles } = findSeedCoverageGaps(REPO_ROOT);
    assert.ok(idsChecked > 100000, `expected the real tree to declare >100k ids, got ${idsChecked}`);
    assert.ok(filesRead > 200, `expected >200 record files, got ${filesRead}`);
    if (repoHasSeed) {
        assert.ok(seedFiles.length > 0);
        assert.equal(problems.length, 0, problems.map((p) => p.slice(0, 200)).join('\n'));
    } else {
        assert.deepEqual(seedFiles, []);
        assert.equal(problems.length, 1, problems.map((p) => p.slice(0, 200)).join('\n'));
        assert.match(problems[0], /contains NO \*Metadata_Sync\*\.sql/);
    }
});

test('the CLI exit code follows the repo state: non-zero with no seed, zero with a covering seed', () => {
    const run = spawnSync(process.execPath, [path.join(HERE, 'check-release-seed-coverage.mjs')], { encoding: 'utf8' });
    if (repoHasSeed) {
        assert.equal(run.status, 0, run.stderr.slice(0, 500));
        assert.match(run.stdout + run.stderr, /coverage passed/i);
    } else {
        assert.equal(run.status, 1);
        assert.match(run.stderr, /contains NO \*Metadata_Sync\*\.sql/);
    }
});
