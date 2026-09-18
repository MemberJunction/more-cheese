/**
 * Spec for the release seed cadence gate.
 *
 * Adapted from `bizapps-forms/scripts/check-release-seed-cadence.spec.mjs`. The semver-ordering cases
 * come across as they are — they pin semver §11, not a repo fact. Everything else is rewritten around
 * the two adaptations the port makes, because those are where the new logic lives and an untested
 * rewrite of a gate is a gate nobody should trust:
 *
 *   1. "one seed" is one GENERATION, which may be several `_PartNofM` files;
 *   2. this repo has no `v*` tag, so rule 1 must work without one and rule 2 must not fail for it.
 *
 * Every case injects a stub `readState`, so none of them needs a git repository and none can pass or
 * fail because of what happens to be tagged here today. The two cases at the end run against the real
 * repo and the real CLI.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import {
    parseSeedName,
    findUnconsolidatedSeedDeltas,
    findUnshippedMetadataDrift,
} from './check-release-seed-cadence.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.join(HERE, '..');

const BASELINE = 'B202607141200__v1.0.0_MoreCheese_Baseline.sql';

/** A stub git boundary. `tag: null` models this repo as it stands today. */
const state = ({ tag = null, released = [BASELINE], current = [BASELINE], syncChanged = [] } = {}) =>
    () => ({ tag, released, current, syncChanged });

// `base` is the GENERATION stamp; part N's own stamp is base + (N − 1) minutes, as the assembler writes
// them (Skyway refuses two files with one version, so parts cannot share a stamp).
const plusMinutes = (stamp, n) => {
    const t = new Date(
        Date.UTC(+stamp.slice(0, 4), +stamp.slice(4, 6) - 1, +stamp.slice(6, 8), +stamp.slice(8, 10), +stamp.slice(10, 12)) +
            n * 60_000,
    );
    const pad = (x) => String(x).padStart(2, '0');
    return `${t.getUTCFullYear()}${pad(t.getUTCMonth() + 1)}${pad(t.getUTCDate())}${pad(t.getUTCHours())}${pad(t.getUTCMinutes())}`;
};
const part = (n, m, base = '202609180900') => `V${plusMinutes(base, n - 1)}__v1.2.0__Metadata_Sync_Part${n}of${m}.sql`;

// ── parseSeedName ───────────────────────────────────────────────────────────────────────────────

test('a parted seed name yields its generation stamp and its place in it', () => {
    assert.deepEqual(parseSeedName(part(2, 4)), {
        file: part(2, 4),
        stamp: '202609180901',
        part: 2,
        of: 4,
        generation: '202609180900',
    });
});

test('an unparted seed name yields a stamp and no part', () => {
    const p = parseSeedName('V202609180900__v1.2.0__Metadata_Sync.sql');
    assert.equal(p.stamp, '202609180900');
    assert.equal(p.part, null);
});

// The label carries the app version, and two parts of one run can legitimately disagree about it if
// the release version is bumped between writing them. The STAMP is the generation key.
test('the label is not part of the generation key', () => {
    assert.equal(parseSeedName('V202609180900__v1.2.0__Metadata_Sync_Part1of2.sql').generation, '202609180900');
    assert.equal(parseSeedName('V202609180901__v1.2.1__Metadata_Sync_Part2of2.sql').generation, '202609180900');
});

test('a part offset across a day boundary still folds back to its generation', () => {
    assert.equal(parseSeedName('V202609190001__v1.2.0__Metadata_Sync_Part3of3.sql').generation, '202609182359');
});

test('a name this gate cannot order reports as unreadable rather than guessing', () => {
    assert.equal(parseSeedName('Metadata_Sync.sql').stamp, null);
});

// ── Rule 1, with no release tag — this repo's state today ───────────────────────────────────────

test('no seed files at all is clean: nothing has been generated yet', () => {
    const { problems } = findUnconsolidatedSeedDeltas('/x', state());
    assert.deepEqual(problems, []);
});

test('one complete four-part generation is clean, which forms\' rule would have failed', () => {
    const files = [BASELINE, part(1, 4), part(2, 4), part(3, 4), part(4, 4)];
    const { problems, unreleased } = findUnconsolidatedSeedDeltas('/x', state({ current: files }));
    assert.deepEqual(problems, [], problems.join('\n'));
    assert.equal(unreleased.length, 4);
});

test('a single unparted seed is clean', () => {
    const files = [BASELINE, 'V202609180900__v1.2.0__Metadata_Sync.sql'];
    assert.deepEqual(findUnconsolidatedSeedDeltas('/x', state({ current: files })).problems, []);
});

// The per-PR cadence returning, in this repo's shape.
test('two generations fail even when each is internally complete', () => {
    const files = [BASELINE, part(1, 2, '202609180900'), part(2, 2, '202609180900'), part(1, 1, '202609190900')];
    const { problems } = findUnconsolidatedSeedDeltas('/x', state({ current: files }));
    assert.equal(problems.length, 1);
    assert.match(problems[0], /2 distinct seed GENERATIONS/);
});

// The failure this repo is most exposed to: a ~100 MB part lost to a .gitignore rule or a push limit.
test('a missing part is named, with its number', () => {
    const files = [BASELINE, part(1, 4), part(2, 4), part(4, 4)];
    const { problems } = findUnconsolidatedSeedDeltas('/x', state({ current: files }));
    assert.equal(problems.length, 1);
    assert.match(problems[0], /part\(s\) 3 are not in/);
});

test('several missing parts are all named', () => {
    const { problems } = findUnconsolidatedSeedDeltas('/x', state({ current: [BASELINE, part(2, 5)] }));
    assert.match(problems[0], /part\(s\) 1, 3, 4, 5/);
});

test('two files sharing one version stamp fail, because Skyway refuses the set', () => {
    const files = [
        BASELINE,
        'V202609180900__v1.2.0__Metadata_Sync_Part1of2.sql',
        'V202609180900__v1.2.1__Metadata_Sync_Part1of2.sql',
        part(2, 2),
    ];
    const { problems } = findUnconsolidatedSeedDeltas('/x', state({ current: files }));
    assert.equal(problems.length, 1);
    assert.match(problems[0], /2 seed files share the version stamp 202609180900/);
});

test('parts disagreeing about the total fail', () => {
    const files = [BASELINE, part(1, 3), 'V202609180901__v1.2.0__Metadata_Sync_Part2of4.sql'];
    const { problems } = findUnconsolidatedSeedDeltas('/x', state({ current: files }));
    assert.equal(problems.length, 1);
    assert.match(problems[0], /disagrees about how many parts/);
});

// Without PartNofM on every file, "how many parts should there be" has no answer, so a missing one
// is undetectable — which is the property the whole rule rests on.
test('mixing a parted and an unparted file in one generation fails', () => {
    // Part2of2 stamped 0901 folds back to generation 0900, where the unparted file sits under its own stamp.
    const files = [BASELINE, part(2, 2), 'V202609180900__v1.2.0__Metadata_Sync.sql'];
    const { problems } = findUnconsolidatedSeedDeltas('/x', state({ current: files }));
    assert.equal(problems.length, 1);
    assert.match(problems[0], /mixes parted and unparted/);
});

test('two unparted files under one stamp fail', () => {
    const files = [
        BASELINE,
        'V202609180900__v1.2.0__Metadata_Sync.sql',
        'V202609180900__v1.2.1__Metadata_Sync.sql',
    ];
    const { problems } = findUnconsolidatedSeedDeltas('/x', state({ current: files }));
    assert.equal(problems.length, 1);
    assert.match(problems[0], /2 seed files share the version stamp 202609180900/);
});

/**
 * The likeliest real naming slip, pinned because the behaviour is deliberate and looks harsh.
 *
 * The release plan calls for "a config part last", and the reflex is to name it after what it holds:
 * `…__Metadata_Sync_Config.sql`. That file IS a seed — the broad `SEED_PATTERN` matches it, so it is
 * counted — but it carries no `PartNofM`, and a generation with one such file in it can no longer say
 * how many parts it should have, which is the single property that makes a LOST part detectable. So
 * it is reported as unreadable rather than quietly accepted. The config part is `Part<M>of<M>`.
 */
test('a descriptively-suffixed seed is refused, because it defeats part accounting', () => {
    // `Part1of1` so the parted set is itself complete: the ONLY thing wrong here is the config file's
    // name, and the assertion on the problem count is what proves that.
    const files = [BASELINE, part(1, 1), 'V202609180900__v1.2.0__Metadata_Sync_Config.sql'];
    const { problems } = findUnconsolidatedSeedDeltas('/x', state({ current: files }));
    assert.equal(problems.length, 1);
    assert.match(problems[0], /do not match/);
    assert.match(problems[0], /Metadata_Sync_Config\.sql/);
});

test('a seed file whose name cannot be ordered is reported', () => {
    const { problems } = findUnconsolidatedSeedDeltas('/x', state({ current: [BASELINE, 'Metadata_Sync_oops.sql'] }));
    assert.equal(problems.length, 1);
    assert.match(problems[0], /do not match/);
});

// The baseline is a migration, not a seed, and this rule is none of its business.
test('the schema baseline is not treated as a seed', () => {
    const { unreleased } = findUnconsolidatedSeedDeltas('/x', state({ current: [BASELINE] }));
    assert.deepEqual(unreleased, []);
});

// ── Rule 1, once a release tag exists ───────────────────────────────────────────────────────────

test('a seed already shipped in the tag is not counted as unreleased', () => {
    const shipped = part(1, 1, '202609180900');
    const { problems, unreleased } = findUnconsolidatedSeedDeltas(
        '/x',
        state({ tag: 'v1.2.0', released: [BASELINE, shipped], current: [BASELINE, shipped] }),
    );
    assert.deepEqual(problems, []);
    assert.deepEqual(unreleased, []);
});

test('a released generation plus a new one is clean — the released one is history', () => {
    const shipped = part(1, 1, '202609180900');
    const fresh = part(1, 1, '202610010900');
    const { problems } = findUnconsolidatedSeedDeltas(
        '/x',
        state({ tag: 'v1.2.0', released: [BASELINE, shipped], current: [BASELINE, shipped, fresh] }),
    );
    assert.deepEqual(problems, [], problems.join('\n'));
});

test('a git failure is a problem, never a silent pass', () => {
    const { problems } = findUnconsolidatedSeedDeltas('/x', () => {
        throw new Error('not a git repository');
    });
    assert.equal(problems.length, 1);
    assert.match(problems[0], /could not read git history/);
});

// ── Rule 2 — drift ──────────────────────────────────────────────────────────────────────────────

// The adaptation: no tag is this repo's true state, not a broken run. Forms fails here.
test('no release tag yields a notice and no problem', () => {
    const { problems, notices } = findUnshippedMetadataDrift('/x', state({ syncChanged: [] }));
    assert.deepEqual(problems, []);
    assert.equal(notices.length, 1);
    assert.match(notices[0], /no v\* release tag exists/);
});

test('records changed since the tag with no new seed is a violation', () => {
    const { problems } = findUnshippedMetadataDrift(
        '/x',
        state({ tag: 'v1.2.0', syncChanged: ['generated/people/.people.json', 'config/users/.7fe3b684.json'] }),
    );
    assert.equal(problems.length, 1);
    assert.match(problems[0], /2 record file\(s\) changed since v1\.2\.0/);
});

test('records changed WITH a new unreleased seed is clean', () => {
    const { problems } = findUnshippedMetadataDrift(
        '/x',
        state({
            tag: 'v1.2.0',
            released: [BASELINE],
            current: [BASELINE, part(1, 1, '202610010900')],
            syncChanged: ['generated/people/.people.json'],
        }),
    );
    assert.deepEqual(problems, []);
});

// Gating on documentation would teach people that the way to quiet this check is to not write any.
test('a README edit owes no seed', () => {
    const { problems } = findUnshippedMetadataDrift('/x', state({ tag: 'v1.2.0', syncChanged: ['generated/README.md'] }));
    assert.deepEqual(problems, []);
});

test('directory configuration and push by-products owe no seed', () => {
    const { problems } = findUnshippedMetadataDrift(
        '/x',
        state({
            tag: 'v1.2.0',
            syncChanged: [
                'generated/people/.mj-sync.json',
                'generated/checkpoint.json',
                'generated/people/.backups/x.json',
                'config/queries/sql_logging/y.sql',
            ],
        }),
    );
    assert.deepEqual(problems, []);
});

test('both sync trees are in scope, not just generated/', () => {
    const { problems, changed } = findUnshippedMetadataDrift(
        '/x',
        state({ tag: 'v1.2.0', syncChanged: ['config/dashboards/.abc.json'] }),
    );
    assert.equal(changed.length, 1);
    assert.equal(problems.length, 1);
});

// ── The real repo, and the CLI contract ─────────────────────────────────────────────────────────

test('the checked-in repo passes', () => {
    const problems = [
        ...findUnconsolidatedSeedDeltas(REPO_ROOT).problems,
        ...findUnshippedMetadataDrift(REPO_ROOT).problems,
    ];
    assert.deepEqual(problems, [], problems.join('\n'));
});

test('the CLI exits 0 on this repo and says the drift rule is unarmed', () => {
    const run = spawnSync(process.execPath, [path.join(HERE, 'check-release-seed-cadence.mjs')], { encoding: 'utf8' });
    assert.equal(run.status, 0, run.stderr);
    assert.match(run.stdout, /no v\* release tag exists/);
});
