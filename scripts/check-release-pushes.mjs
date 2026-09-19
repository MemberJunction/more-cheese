#!/usr/bin/env node
/**
 * Release-push gate — refuse any push to a protected branch (`main`, `next`) from anywhere in this
 * repo's release automation.
 *
 * This repo had never published, and three scripts pushed straight to a protected branch:
 * `ci/commit_push.mjs` pushed `HEAD:main`, and `ci/merge_main_and_update_lock.mjs` and
 * `ci/merge_main.mjs` each pushed `HEAD:next`. `next` is the default branch and carries the
 * `next-protect` ruleset (id 18797049, `~DEFAULT_BRANCH`, a `pull_request` rule, no bypass actors),
 * which refuses a direct push outright. `publish.yml` ran the last of those pushes AFTER `changeset
 * publish` and AFTER the tag push, so the first release to get that far would have published to
 * npm, tagged, and then gone red with `next` never updated.
 *
 * This gate was deliberately written, and landed, BEFORE those three scripts were removed — it
 * failed loudly on landing, naming exactly those three files, and went green the moment
 * `publish.yml` was rewritten to back-merge through a pull request instead. That is what it is for
 * now: keeping the pushes from coming back, including if `ci/` itself is ever reintroduced (`ci`
 * stays in `SCANNED_DIRS` although the directory no longer exists).
 *
 * Ported from `mj-dev/bizapps-forms`'s `scripts/check-release-pushes.mjs`, which exists because of
 * that repo's own #177/#187: two scripts pushed straight to protected branches, both rulesets grew
 * required checks, and every release started failing at the version-bump step. Adapted here to
 * more-cheese's npm tooling and to the `findReleasePushes(rootDir)` interface this repo's release-
 * readiness task calls for: one function, one array of `{ file, line, text }` hits, rootDir supplied
 * so a test fixture and the real repo run the identical code path.
 *
 * Tag pushes are deliberately allowed: both rulesets are `target: branch`, scoped to
 * `refs/heads/main` and `refs/heads/next`, so `refs/tags/*` is untouched and a release can still tag
 * itself — see the `PROTECTED_TARGET` comment below for why a tag push never reaches the branch
 * test at all, rather than being carved out as a second, separate rule.
 *
 * Plain Node, stdlib only — `changes.yml` runs no `npm ci`, so a gate that guards the release path
 * must be runnable without installing anything.
 */
import { readdirSync, readFileSync, statSync, realpathSync } from 'node:fs';
import { join, relative, dirname, sep, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

/**
 * The branches both repository rulesets protect. Pinned here rather than derived from anything
 * live, because the gate is exactly as good as this list.
 */
export const PROTECTED_BRANCHES = Object.freeze(['main', 'next']);

/**
 * Where release automation lives, as whole directories rather than the files that happen to be
 * guilty today — the point is that a *new* file cannot reintroduce the push.
 *
 * `ci/` stays in scope even once its three offending scripts are gone: `filesUnder` returns `[]`
 * for a directory that does not exist, so an absent `ci/` is inert, and the entry is a tripwire for
 * the directory itself coming back.
 */
export const SCANNED_DIRS = Object.freeze(['.github/workflows', '.github/scripts', 'scripts', 'ci']);

/** Only files with one of these extensions are read as text; anything else is skipped untouched. */
const SCANNED_EXTENSIONS = Object.freeze(['.mjs', '.js', '.yml', '.yaml', '.sh']);

/** Directory names never descended into, wherever they appear under a scanned root. */
const SKIPPED_DIR_NAMES = Object.freeze(['node_modules', '.git']);

/**
 * This gate's own source and its spec, excluded by absolute path — not by name relative to some
 * root. They contain the push strings this gate looks for as literal fixture and test data, and
 * would otherwise report themselves. An absolute-path comparison also means the exemption can never
 * accidentally cover a fixture tree's same-named file: a fixture's `check-release-pushes.mjs` is a
 * different file at a different path.
 */
const SELF_FILE = fileURLToPath(import.meta.url);
const SELF_SPEC_FILE = join(dirname(SELF_FILE), 'check-release-pushes.spec.mjs');

const PROTECTED_ALTERNATION = PROTECTED_BRANCHES.join('|');

/**
 * A refspec target naming a protected branch, and nothing else.
 *
 * The trailing boundary `(?![\w./-])` is load-bearing: `mainline` and `next-steps` are ordinary
 * feature branches, not the branches this gate protects. The leading `(?:refs\/heads\/...)?` is
 * optional so a fully-qualified ref (`refs/heads/main`) matches too — but because it names
 * `refs/heads/` specifically, `refs/tags/main` never satisfies it: at that position the text reads
 * `refs/tags/...`, the optional group can only match empty, and the literal `main`/`next` test that
 * follows is then run against a string starting with `r`, not `m`/`n`. A tag push is therefore
 * excluded structurally, before the branch-name alternation is ever reached — not by a second,
 * separate "is this a tag" check that could drift out of sync with this one.
 */
const PROTECTED_TARGET = String.raw`(?:refs\/heads\/['"\`]*)?(${PROTECTED_ALTERNATION})(?![\w./-])`;

/** Where a shelled-out command can begin: line start, or right after a separator character. */
const COMMAND_START = String.raw`(?:^|[\s;&|(\`'"])\s*`;

/**
 * git's global options, between `git` and the subcommand — otherwise a straight bypass, since
 * `git -c user.email=x push origin main` is ordinary CI and not obviously different from a bare
 * `git push origin main` to a static reader who stops at the first non-match.
 */
const GIT_GLOBAL_OPTS =
    String.raw`(?:(?:-[Cc]|--(?:git-dir|work-tree|exec-path|namespace|config-env|attr-source))[=\s]\S+\s+|-\S+\s+)*`;

/** What a refspec may carry before the branch name: quotes, a force marker, a `<local>:` prefix. */
const REFSPEC_PREFIX = String.raw`['"\`]*\+?(?:\S*:)?`;

/** `git push … <protected>` in shell, with or without a `HEAD:` prefix, quoting, or flags. */
const SHELL_PUSH = new RegExp(
    COMMAND_START + String.raw`git\s+` + GIT_GLOBAL_OPTS +
        String.raw`push\b(?:\s+-{1,2}[\w-]+)*\s+\S+\s+` + REFSPEC_PREFIX + PROTECTED_TARGET,
    'i',
);

/** simple-git's method form: `git.push('origin', 'HEAD:main')`, including its array spelling. */
const METHOD_PUSH = new RegExp(
    String.raw`\.push\(\s*\[?\s*['"\`][^'"\`]+['"\`]\s*,\s*['"\`]\+?(?:\S*:)?` + PROTECTED_TARGET + String.raw`['"\`]`,
);

/** True when the line is commented out — history and prose, not an instruction. */
function isCommentary(line) {
    return /^\s*(?:#|\/\/|\*|<!--)/.test(line);
}

/** Whether `file`'s extension is one this gate reads as text. */
function isScannedFile(file) {
    return SCANNED_EXTENSIONS.some((extension) => file.endsWith(extension));
}

/**
 * Every file under `dir`, recursively, skipping `node_modules` and `.git`. Returns `[]` for a
 * directory that does not exist — the expected, correct answer for `ci/` once it is emptied.
 */
function filesUnder(dir) {
    let entries;
    try {
        entries = readdirSync(dir, { withFileTypes: true });
    } catch (error) {
        if (error.code === 'ENOENT') {
            return [];
        }
        // A permission error, or a file where a directory was expected, is a gate that cannot see
        // what it is guarding — that must not pass silently as "nothing to report".
        throw new Error(`check-release-pushes cannot read ${dir}: ${error.message}`, { cause: error });
    }
    return entries.flatMap((entry) => {
        const full = join(dir, entry.name);
        if (entry.isDirectory()) {
            return SKIPPED_DIR_NAMES.includes(entry.name) ? [] : filesUnder(full);
        }
        return statSync(full).isFile() ? [full] : [];
    });
}

/**
 * Every push to a protected branch found under `rootDir`, as `{ file, line, text }`. `file` is
 * relative to `rootDir` (forward-slashed) so a fixture tree and the real repo report the identical
 * shape; `text` is the offending line, trimmed.
 */
export function findReleasePushes(rootDir = REPO_ROOT) {
    const hits = [];
    for (const scannedDir of SCANNED_DIRS) {
        for (const file of filesUnder(join(rootDir, scannedDir))) {
            if (resolve(file) === SELF_FILE || resolve(file) === SELF_SPEC_FILE) {
                continue;
            }
            if (!isScannedFile(file)) {
                continue;
            }
            readFileSync(file, 'utf8')
                .split('\n')
                .forEach((line, index) => {
                    if (isCommentary(line)) {
                        return;
                    }
                    if (SHELL_PUSH.test(line) || METHOD_PUSH.test(line)) {
                        hits.push({
                            file: relative(rootDir, file).split(sep).join('/'),
                            line: index + 1,
                            text: line.trim(),
                        });
                    }
                });
        }
    }
    return hits;
}

/** CLI entry point. */
function main() {
    const hits = findReleasePushes(REPO_ROOT);
    if (hits.length > 0) {
        console.error('Release-push gate FAILED — nothing in this repo may push to a protected branch:\n');
        for (const hit of hits) {
            console.error(`  ✗ ${hit.file}:${hit.line}: ${hit.text}`);
        }
        console.error(
            `\n${hits.length} violation(s). A direct push to a required-status-checks branch is rejected ` +
                `permanently (GH013) because the SHA it introduces has no check run yet. Route the change ` +
                'through a pull request, or push a tag instead.',
        );
        process.exit(1);
    }
    console.log(`Release-push gate passed (${SCANNED_DIRS.join(', ')}).`);
}

/**
 * Is this module the program that was started? `realpathSync` on both sides because a script reached
 * through a SYMLINK arrives as the link in `process.argv[1]` and as its target in `import.meta.url`,
 * so comparing the raw spellings silently answers "no" — the CLI never runs, the step it answers
 * writes no output, and the run goes green having done nothing. A missing `process.argv[1]`
 * (`node -e`) and an unresolvable path are both answered as "not the entry point": in each, nothing
 * started this file. scripts/release-prep.mjs carries the full rationale; all four release scripts
 * must answer this identically or the inconsistency is itself the bug.
 */
const isEntryPoint = () => {
    try {
        return (
            process.argv[1] !== undefined &&
            realpathSync(process.argv[1]) === realpathSync(fileURLToPath(import.meta.url))
        );
    } catch {
        return false;
    }
};

if (isEntryPoint()) {
    main();
}
