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
import { mkdtempSync, writeFileSync, rmSync, mkdirSync } from 'node:fs';
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
