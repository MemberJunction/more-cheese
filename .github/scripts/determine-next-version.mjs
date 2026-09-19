#!/usr/bin/env node
/**
 * determine-next-version.mjs
 *
 * Decide the version `publish.yml` EXPECTS `changeset version` to produce, so a
 * disagreement between the two fails the release instead of publishing a number
 * nobody intended.
 *
 * ── WHY THIS IS A SCRIPT AND NOT SIX LINES OF INLINE BASH ───────────────────────
 * This decision has been wrong twice, and both times it was wrong in CI, on the
 * release commit, where it is most expensive to discover:
 *
 *   1. With a `git rev-parse` guard (the shape the sibling BizApps still carry), a
 *      missing tag read as "no new migrations" and the step quietly expected a PATCH
 *      bump. The first release computed 1.1.1 against changesets that said 1.2.0 and
 *      died at the mismatch check with a message that named neither the tag nor why.
 *   2. Without the guard, the bare `git diff v<current>` exits 128 (`fatal: bad
 *      revision`) — loud, but it fires on the FIRST release too, where no `v*` tag
 *      can possibly exist yet. That is the state this repo is in: nothing has ever
 *      been published (#48), so every release attempt died here before publishing.
 *
 * Both shapes conflate two different states that happen to look alike from inside a
 * single `git diff`: "this repo has never released" and "this repo has released, but
 * the tag for the current version is gone". The first is normal and has an obvious
 * answer; the second is a release-setup error that must stop the run. Keeping them
 * apart is the whole job of this file, and `--self-test` is what keeps it honest —
 * the same bargain `check-migration-no-prune.mjs` and
 * `check-migration-entityfield-sequence.mjs` make, and the reason `changes.yml` runs
 * gate self-tests before the gates themselves.
 *
 * `scripts/check-release-seed-cadence.mjs` already models "no `v*` tag" as this
 * repo's true state rather than a broken checkout; this script agrees with it.
 *
 * ── THE RULE ────────────────────────────────────────────────────────────────────
 *   major changeset present            → major bump
 *   otherwise, migrations are new      → minor bump   (docs/template-docs/branching.md:
 *                                                      minor is the FLOOR for a migration)
 *   otherwise                          → patch bump
 *
 * "New" is measured against the tag of the current version. On the first release
 * there is no such tag and no baseline to measure against, so every migration the
 * tree carries is new by definition.
 *
 * Usage (from any directory inside the repository):
 *   node determine-next-version.mjs <current-version> <head-sha>   # CI form
 *   node determine-next-version.mjs --self-test                    # fixtures
 *
 * Prints the expected version to stdout. Appends EXPECTED_NEXT_VERSION=<v> to
 * $GITHUB_OUTPUT when that variable is set. Exits non-zero, with a message naming
 * the fix, on any state it cannot decide.
 */
import { execFileSync } from 'node:child_process';
import { appendFileSync, readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { realpathSync } from 'node:fs';

const RED = '\x1b[0;31m', GREEN = '\x1b[0;32m', YELLOW = '\x1b[0;33m', NC = '\x1b[0m';

/** A release tag this repo would have pushed: `v` + strict three-part semver.
 *  Anything else under `v*` (`v-latest`, `vNEXT`, `v1.2`) is not a release of ours
 *  and must not be mistaken for a baseline to diff against. */
const RELEASE_TAG_RE = /^v(\d+)\.(\d+)\.(\d+)$/;
const SEMVER_RE = /^(\d+)\.(\d+)\.(\d+)$/;

/** Flyway versioned (V) and baseline (B) migrations — the files whose arrival forces
 *  a minor. Matches the scope the other migration gates use. */
const MIGRATION_RE = /^[VB]\d{12}__.*\.sql$/;

export function bumps(currentVersion) {
    const m = SEMVER_RE.exec(currentVersion);
    if (!m) {
        throw new Error(
            `current version "${currentVersion}" is not a three-part semver. ` +
            'It is read from packages/Entities/package.json, which the changesets ' +
            '"fixed" group keeps in step with the other packages — fix it there.',
        );
    }
    const [major, minor, patch] = [Number(m[1]), Number(m[2]), Number(m[3])];
    return {
        major: `${major + 1}.0.0`,
        minor: `${major}.${minor + 1}.0`,
        patch: `${major}.${minor}.${patch + 1}`,
    };
}

/**
 * The whole decision, with git injected so every branch is reachable from a fixture.
 *
 * @param currentVersion      version in packages/Entities/package.json, pre-bump
 * @param releaseTags         every tag in the repo (filtered to release shape here)
 * @param hasMajorChangeset   any pending changeset asking for a major
 * @param listNewMigrations   (baselineTag | null) => string[]; called with null on a
 *                            first release, meaning "every migration in the tree"
 * @returns { version, bump, firstRelease, notices }
 */
export function planNextVersion({ currentVersion, releaseTags, hasMajorChangeset, listNewMigrations }) {
    const next = bumps(currentVersion);
    const notices = [];

    if (hasMajorChangeset) {
        return { version: next.major, bump: 'major', firstRelease: false, notices: ['major changeset found'] };
    }

    const releases = (releaseTags ?? []).filter((t) => RELEASE_TAG_RE.test(t));
    const baseline = `v${currentVersion}`;
    const firstRelease = releases.length === 0;

    if (!firstRelease && !releases.includes(baseline)) {
        // A repo that has released before is missing the tag for the version it claims
        // to be at. That is a release-setup error — NOT a first release — and guessing
        // here is how a wrong number gets published. Stop, and say what to look at.
        throw new Error(
            `packages/Entities/package.json is at ${currentVersion}, but tag ${baseline} does not exist ` +
            `while ${releases.length} other release tag(s) do (newest: ${releases[releases.length - 1]}).\n` +
            'There is no baseline to measure new migrations against, so the expected bump cannot be derived.\n' +
            'Check that the clone is not shallow and that tags were fetched (actions/checkout needs ' +
            'fetch-depth: 0 and fetch-tags: true), then confirm the tag was pushed for that release.',
        );
    }

    if (firstRelease) {
        notices.push(
            'no v* release tag exists, so there is no baseline to measure new migrations against. ' +
            'This is the first release — nothing has ever been published from this repo (#48) — not a ' +
            'broken checkout, so every migration the tree carries counts as new. This rule measures ' +
            'against a tag from the next release onward. (If you expected a tag, check that the clone ' +
            'is not shallow and that tags were fetched.)',
        );
    }

    const newMigrations = listNewMigrations(firstRelease ? null : baseline) ?? [];
    if (newMigrations.length > 0) {
        notices.push(`${newMigrations.length} new migration(s): ${newMigrations.slice(0, 10).join(', ')}`);
        return { version: next.minor, bump: 'minor', firstRelease, notices };
    }
    notices.push('no new migrations');
    return { version: next.patch, bump: 'patch', firstRelease, notices };
}

function git(args, opts = {}) {
    return execFileSync('git', args, { encoding: 'utf8', maxBuffer: 256 * 1024 * 1024, ...opts });
}

const gitRepoRoot = () => git(['rev-parse', '--show-toplevel']).trim();

/** Any pending changeset requesting a major for a package in this repo's scope. */
function hasMajorChangeset(root) {
    const dir = join(root, '.changeset');
    let entries;
    try {
        entries = readdirSync(dir);
    } catch (error) {
        throw new Error(`could not read ${dir} to look for a major changeset: ${error.message}`);
    }
    return entries
        .filter((f) => f.endsWith('.md') && f !== 'README.md')
        .some((f) => /^"@mj-biz-apps\/[^"]*":\s*major\s*$/m.test(readFileSync(join(dir, f), 'utf8')));
}

function runSelfTest() {
    const migrations = ['V202609182025__v1.2.x__Metadata_Sync_Part1of5.sql'];
    const none = () => [];
    const some = () => migrations;
    let failed = 0;

    const check = (name, fn, expected) => {
        let actual;
        try {
            actual = fn();
        } catch (error) {
            actual = `THREW: ${error.message.split('\n')[0]}`;
        }
        if (actual === expected) {
            console.log(`${GREEN}PASS${NC} ${name}`);
        } else {
            console.error(`${RED}FAIL${NC} ${name}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
            failed++;
        }
    };
    const version = (args) => planNextVersion(args).version;

    // THE REGRESSION THIS FILE EXISTS FOR: no tags at all is a first release, not an error.
    check('first release with migrations -> minor', () =>
        version({ currentVersion: '1.1.0', releaseTags: [], hasMajorChangeset: false, listNewMigrations: some }), '1.2.0');
    check('first release without migrations -> patch', () =>
        version({ currentVersion: '1.1.0', releaseTags: [], hasMajorChangeset: false, listNewMigrations: none }), '1.1.1');
    check('first release ignores non-release v* tags', () =>
        version({ currentVersion: '1.1.0', releaseTags: ['v-latest', 'vNEXT', 'v1.2'], hasMajorChangeset: false, listNewMigrations: some }), '1.2.0');
    check('first release measures the whole tree (baseline arg is null)', () =>
        version({ currentVersion: '1.1.0', releaseTags: [], hasMajorChangeset: false,
                  listNewMigrations: (baseline) => (baseline === null ? migrations : []) }), '1.2.0');

    // Established repo: the normal path, unchanged.
    check('released repo, new migrations -> minor', () =>
        version({ currentVersion: '1.2.0', releaseTags: ['v1.1.0', 'v1.2.0'], hasMajorChangeset: false, listNewMigrations: some }), '1.3.0');
    check('released repo, no new migrations -> patch', () =>
        version({ currentVersion: '1.2.0', releaseTags: ['v1.1.0', 'v1.2.0'], hasMajorChangeset: false, listNewMigrations: none }), '1.2.1');
    check('released repo diffs against v<current>', () =>
        version({ currentVersion: '1.2.0', releaseTags: ['v1.1.0', 'v1.2.0'], hasMajorChangeset: false,
                  listNewMigrations: (baseline) => (baseline === 'v1.2.0' ? migrations : []) }), '1.3.0');

    // A missing baseline in a repo that HAS released stays a loud failure.
    check('released repo missing v<current> -> error', () =>
        version({ currentVersion: '1.9.0', releaseTags: ['v1.1.0', 'v1.2.0'], hasMajorChangeset: false, listNewMigrations: none }),
        'THREW: packages/Entities/package.json is at 1.9.0, but tag v1.9.0 does not exist while 2 other release tag(s) do (newest: v1.2.0).');

    // Major wins over everything, and never needs a baseline.
    check('major changeset -> major, first release', () =>
        version({ currentVersion: '1.1.0', releaseTags: [], hasMajorChangeset: true, listNewMigrations: none }), '2.0.0');
    check('major changeset -> major, missing baseline is not consulted', () =>
        version({ currentVersion: '1.9.0', releaseTags: ['v1.1.0'], hasMajorChangeset: true, listNewMigrations: none }), '2.0.0');

    check('non-semver current version -> error', () =>
        version({ currentVersion: '1.2', releaseTags: [], hasMajorChangeset: false, listNewMigrations: none }),
        'THREW: current version "1.2" is not a three-part semver. It is read from packages/Entities/package.json, which the changesets "fixed" group keeps in step with the other packages — fix it there.');

    if (failed > 0) {
        console.error(`\n${RED}Self-test failed: ${failed} fixture(s) failed.${NC}`);
        process.exit(1);
    }
    console.log(`\n${GREEN}Self-test passed: all fixtures behaved as expected.${NC}`);
}

function main() {
    const args = process.argv.slice(2);
    if (args.includes('--self-test')) {
        runSelfTest();
        return;
    }

    const [currentVersion, headSha] = args;
    if (!currentVersion || !headSha) {
        console.error(`${RED}usage: determine-next-version.mjs <current-version> <head-sha>${NC}`);
        process.exit(2);
    }

    const root = gitRepoRoot();
    const releaseTags = git(['tag', '--list', 'v*'], { cwd: root })
        .split('\n').map((t) => t.trim()).filter(Boolean);

    // On a first release there is no baseline commit to diff against, so "which migrations
    // are new" is answered from the tree at HEAD instead of from a range.
    const listNewMigrations = (baseline) =>
        (baseline === null
            ? git(['ls-tree', '--name-only', '-r', headSha, '--', 'migrations/'], { cwd: root })
            : git(['--no-pager', 'diff', '--name-only', baseline, headSha, '--', 'migrations/'], { cwd: root })
        ).split('\n').map((f) => f.trim()).filter((f) => MIGRATION_RE.test(f.split('/').pop() ?? ''));

    let plan;
    try {
        plan = planNextVersion({
            currentVersion,
            releaseTags,
            hasMajorChangeset: hasMajorChangeset(root),
            listNewMigrations,
        });
    } catch (error) {
        console.error(`::error::${error.message.split('\n')[0]}`);
        console.error(`${RED}${error.message}${NC}`);
        process.exit(1);
    }

    // Diagnostics to stderr so stdout carries nothing but the version: the workflow reads
    // GITHUB_OUTPUT, a human reads the log, and `$(determine-next-version.mjs …)` also works.
    for (const notice of plan.notices) console.error(`${YELLOW}ℹ${NC} ${notice}`);
    console.error(`${GREEN}Expected next version: ${plan.version}${NC} (${plan.bump} bump${plan.firstRelease ? ", first release" : ""})`);

    if (process.env.GITHUB_OUTPUT) {
        appendFileSync(process.env.GITHUB_OUTPUT, `EXPECTED_NEXT_VERSION=${plan.version}\n`);
    }
    process.stdout.write(`${plan.version}\n`);
}

const isEntry = () => {
    try {
        return realpathSync(process.argv[1]) === realpathSync(fileURLToPath(import.meta.url));
    } catch {
        return false;
    }
};

if (isEntry()) {
    main();
}
