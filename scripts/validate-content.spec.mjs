/**
 * Fixtures for validate-content.mjs — specifically for the two ways it has failed its CONSUMERS
 * rather than its content.
 *
 * `build-site.mjs` and `publish-wordpress.mjs` both run this script with `--json` and capture
 * stdout, so the thing that has to hold is not only "does it judge a post correctly" but "does the
 * report survive the pipe, and does the corpus it reports on exclude the files that are not corpus".
 * Neither is visible from a terminal run, where stdout is a TTY and the report is small enough not
 * to matter — which is exactly why both defects lived so long:
 *
 *   • `process.exit()` after printing a ~320 KB report truncated it to one 64 KB pipe buffer,
 *     because writes to a pipe are asynchronous. Every consumer died inside its own JSON.parse
 *     on "Unterminated string in JSON", blaming itself. It truncated on exit(0) exactly as on
 *     exit(1), so a fully passing corpus was just as unreadable as a failing one.
 *   • the skip list named `VAULT-DESIGN.md` but not `CONTENT-CALENDAR.md`, so a planning document
 *     with no frontmatter by design failed every run and took the whole gate's exit status with it.
 *
 * The pipe case is built from generated fixtures rather than the real corpus: it has to stay true
 * when the corpus is large AND prove the specific 64 KB boundary, and a test that depends on
 * content/ staying above some size stops testing anything the day someone prunes it.
 *
 * ⚠️ What this does NOT establish: that any individual content rule is correct. Those are exercised
 * by running the validator over the corpus, not here.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, rmSync, mkdirSync, cpSync, readFileSync, readdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.join(HERE, '..');
const VALIDATOR = path.join(HERE, 'validate-content.mjs');

/** One 64 KB pipe buffer: the exact amount a `process.exit()` after an async write delivers. */
const PIPE_BUFFER = 64 * 1024;

/** Run the validator with stdout as a PIPE — the shape both consumers use, and the only shape
 *  under which the truncation appears. Returns the captured stdout whether it exits 0 or 1. */
function runJson(args) {
    try {
        return execFileSync(process.execPath, [VALIDATOR, '--json', ...args],
            { cwd: REPO_ROOT, encoding: 'utf8', maxBuffer: 256 * 1024 * 1024, stdio: ['ignore', 'pipe', 'ignore'] });
    } catch (error) {
        // Non-zero exit is expected whenever any file fails; the report is still on stdout.
        if (error.stdout === undefined || error.stdout === null) throw error;
        return error.stdout;
    }
}

/** Enough failing markdown files that the JSON report must exceed one pipe buffer. */
function makeOversizedCorpus() {
    const dir = mkdtempSync(path.join(tmpdir(), 'vc-spec-'));
    mkdirSync(path.join(dir, 'blog'), { recursive: true });
    const files = [];
    for (let i = 0; i < 400; i++) {
        const f = path.join(dir, 'blog', `2019-01-01-fixture-post-number-${String(i).padStart(4, '0')}.md`);
        writeFileSync(f, `# fixture ${i}\n\nno frontmatter, no disclaimer — deliberately failing.\n`);
        files.push(f);
    }
    return { dir, files };
}

test('--json report survives a pipe when it exceeds one 64 KB buffer', () => {
    const { dir, files } = makeOversizedCorpus();
    try {
        const raw = runJson(files);

        assert.ok(raw.length > PIPE_BUFFER,
            `fixture corpus produced only ${raw.length} bytes; it must exceed ${PIPE_BUFFER} for this test to mean anything`);
        assert.notEqual(raw.length, PIPE_BUFFER,
            'report is exactly one pipe buffer — process.exit() is truncating it again');

        // The actual regression: this throws "Unterminated string in JSON" when the report is cut.
        const report = JSON.parse(raw);
        assert.equal(report.files.length, files.length,
            'every file passed on the command line must appear in the report');
    } finally {
        rmSync(dir, { recursive: true, force: true });
    }
});

test('a failing corpus still signals failure through the exit status', () => {
    const { dir, files } = makeOversizedCorpus();
    try {
        let exitCode = 0;
        try {
            execFileSync(process.execPath, [VALIDATOR, '--json', ...files],
                { cwd: REPO_ROOT, encoding: 'utf8', maxBuffer: 256 * 1024 * 1024, stdio: ['ignore', 'pipe', 'ignore'] });
        } catch (error) {
            exitCode = error.status;
        }
        assert.equal(exitCode, 1, 'fixtures have no frontmatter, so the run must exit 1');
        assert.equal(JSON.parse(runJson(files)).ok, false, 'and the report must say ok:false');
    } finally {
        rmSync(dir, { recursive: true, force: true });
    }
});

test('planning documents are not validated as corpus', () => {
    const report = JSON.parse(runJson([path.join(REPO_ROOT, 'content')]));
    const reported = new Set(report.files.map((f) => f.rel));
    for (const doc of ['content/VAULT-DESIGN.md', 'content/CONTENT-CALENDAR.md']) {
        assert.equal(reported.has(doc), false,
            `${doc} is repo documentation, not publishable content — validating it fails it forever`);
    }
});

test('the real corpus passes, so consumers publish from a clean report', () => {
    const report = JSON.parse(runJson([path.join(REPO_ROOT, 'content')]));
    const failing = report.files.filter((f) => f.fails.length).map((f) => `${f.rel}: ${f.fails.join('; ')}`);
    assert.deepEqual(failing, [], 'content/ must validate clean');
});

// ── --internal-week: one internal bundle (morecheese-internal-comms §4, §10) ──
// Headless backfill runs grade themselves with this mode, so the bundle rules have to fail on the
// mistakes a run actually makes. Each case copies the checked-in 2019-02-04 sample bundle into a
// throwaway root (with the world-model files the validator reads) and breaks one thing.
const SAMPLE_WEEK = '2019-02-04';
const SAMPLE_THREAD = 'vault/internal/email/2019/2019-02-04-thread-january-close-numbers-for-friday-post';

function makeBundleRoot() {
    const dir = mkdtempSync(path.join(tmpdir(), 'vc-bundle-'));
    for (const rel of ['data/ruleset/eras.json', 'data/ruleset/heroes.json', 'data/banks/organizations.json']) {
        mkdirSync(path.join(dir, path.dirname(rel)), { recursive: true });
        cpSync(path.join(REPO_ROOT, rel), path.join(dir, rel));
    }
    // Only the sample week: the backfill filled every other 2019 week, and a fixture that copies the whole
    // year finds bundles in the "empty" week and a different first memo.
    for (const kind of ['memos', 'spreadsheets', 'decks', 'email']) {
        const src = path.join(REPO_ROOT, 'vault/internal', kind, '2019');
        for (const name of readdirSync(src).filter((n) => n.slice(0, 10) >= SAMPLE_WEEK && n.slice(0, 10) <= '2019-02-10')) {
            cpSync(path.join(src, name), path.join(dir, 'vault/internal', kind, '2019', name), { recursive: true });
        }
    }
    return dir;
}
function runBundle(dir, monday = SAMPLE_WEEK) {
    try {
        const out = execFileSync(process.execPath, [VALIDATOR, '--internal-week', monday], { cwd: dir, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
        return { status: 0, out };
    } catch (error) {
        return { status: error.status, out: String(error.stdout ?? '') };
    }
}
function editFile(dir, rel, from, to) {
    const f = path.join(dir, rel);
    const text = readFileSync(f, 'utf8');
    assert.ok(text.includes(from), `fixture ${rel} no longer contains ${from}`);
    writeFileSync(f, text.replace(from, to));
}
function firstFile(dir, sub) {
    return path.join(sub, readdirSync(path.join(dir, sub)).sort()[0]);
}

test('--internal-week passes the checked-in sample bundle', () => {
    const dir = makeBundleRoot();
    try {
        const { status, out } = runBundle(dir);
        assert.equal(status, 0, out);
    } finally {
        rmSync(dir, { recursive: true, force: true });
    }
});

test('--internal-week fails a week with no internal artifacts', () => {
    const dir = makeBundleRoot();
    try {
        const { status, out } = runBundle(dir, '2019-02-11');
        assert.equal(status, 1);
        assert.match(out, /no internal artifacts dated 2019-02-11\.\.2019-02-17/);
    } finally {
        rmSync(dir, { recursive: true, force: true });
    }
});

test('--internal-week fails a bundle missing its deck', () => {
    const dir = makeBundleRoot();
    try {
        rmSync(path.join(dir, 'vault/internal/decks'), { recursive: true, force: true });
        const { status, out } = runBundle(dir);
        assert.equal(status, 1);
        assert.match(out, /no deck or board packet/);
    } finally {
        rmSync(dir, { recursive: true, force: true });
    }
});

test('--internal-week fails a non-role or real-domain mailbox', () => {
    const dir = makeBundleRoot();
    try {
        editFile(dir, firstFile(dir, SAMPLE_THREAD), 'comms@morecheese.example', 'comms@morecheese.org');
        const { status, out } = runBundle(dir);
        assert.equal(status, 1);
        assert.match(out, /comms@morecheese\.org is not a role mailbox/);
    } finally {
        rmSync(dir, { recursive: true, force: true });
    }
});

test('--internal-week fails a week_of that is not the Monday', () => {
    const dir = makeBundleRoot();
    try {
        editFile(dir, firstFile(dir, 'vault/internal/memos/2019'), `week_of: ${SAMPLE_WEEK}`, 'week_of: 2019-02-05');
        const { status, out } = runBundle(dir);
        assert.equal(status, 1);
        assert.match(out, /week_of is 2019-02-05, expected 2019-02-04/);
    } finally {
        rmSync(dir, { recursive: true, force: true });
    }
});

test('--internal-week fails a broken in_reply_to chain', () => {
    const dir = makeBundleRoot();
    try {
        const second = path.join(SAMPLE_THREAD, readdirSync(path.join(dir, SAMPLE_THREAD)).sort()[1]);
        const text = readFileSync(path.join(dir, second), 'utf8');
        const reply = text.match(/^in_reply_to: (.*)$/m)[1];
        editFile(dir, second, `in_reply_to: ${reply}`, 'in_reply_to: mc-not-a-message');
        const { status, out } = runBundle(dir);
        assert.equal(status, 1);
        assert.match(out, /in_reply_to is mc-not-a-message/);
    } finally {
        rmSync(dir, { recursive: true, force: true });
    }
});

test('internal artifacts citing retired generated/ directories are warned about', () => {
    const dir = makeBundleRoot();
    try {
        mkdirSync(path.join(dir, 'generated', 'orders'), { recursive: true });
        const memo = firstFile(dir, 'vault/internal/memos/2019');
        const out = execFileSync(process.execPath, [VALIDATOR, memo], { cwd: dir, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
        assert.match(out, /⚠ data_sources names generated\/membership-periods, which does not exist/);
        assert.doesNotMatch(out, /names generated\/orders/, 'a directory that exists is not flagged');
    } finally {
        rmSync(dir, { recursive: true, force: true });
    }
});

test('internal artifacts missing a §3.1 field fail', () => {
    const dir = makeBundleRoot();
    try {
        const memo = firstFile(dir, 'vault/internal/memos/2019');
        editFile(dir, memo, 'fiscal_year: 2019\n', '');
        const { status, out } = runBundle(dir);
        assert.equal(status, 1);
        assert.match(out, /frontmatter lacks fiscal_year/);
    } finally {
        rmSync(dir, { recursive: true, force: true });
    }
});
