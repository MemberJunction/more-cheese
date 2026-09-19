#!/usr/bin/env node
/**
 * Can a release be cut from this checkout — and, with `--apply`, the LOCAL half of cutting one.
 *
 * ── WHY THIS IS A SCRIPT AND NOT INLINE WORKFLOW BASH ──────────────────────────────────────────
 * The version decision lived as `jq` inside `publish.yml`, which means the only way to exercise it
 * was to cut a real release. Six red publish runs went by without producing a diagnosis, because
 * every one of them was the first execution of the code that failed. A decision that can only run
 * inside a release can never be proven by running a release. Moving it here makes `--plan` something
 * a developer runs on a laptop, against the real repository, with nothing at stake — and makes every
 * branch of the decision reachable from a fixture in `release-prep.spec.mjs`.
 *
 * ── THE SPLIT THAT MAKES THAT POSSIBLE ─────────────────────────────────────────────────────────
 * This script decides, and mutates the WORKING TREE. It performs no push, no GitHub API call and no
 * network write of any kind. `release-prep.yml` creates the branch, holds every credential, and does
 * every remote write. Keeping the two apart is what lets the interesting half run anywhere.
 *
 * ── WHERE THE THREE RELEASE SCRIPTS DIVIDE ─────────────────────────────────────────────────────
 *   release-prep.mjs   (here)              before the bump — may we cut one, and what version is it?
 *   sync-app-version.mjs                   during the bump — mj-app.json's derived fields.
 *   release-plan.mjs                       after the merge — is publishing or tagging still owed?
 *   .github/scripts/determine-next-version.mjs   the bump RULE itself, which this calls rather than
 *                                          re-deriving: it is the one piece that already knows the
 *                                          difference between "never released" and "tag missing",
 *                                          and this repo is in the first of those states.
 *
 * Plain Node, stdlib only: `changes.yml` runs no `npm ci`, so a gate that guards the release must
 * run without installing anything.
 */
import { readdirSync, readFileSync, appendFileSync } from 'node:fs';
import { execFileSync, spawnSync } from 'node:child_process';
import { join, dirname, delimiter } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { publishablePackages } from './release-plan.mjs';
import { planNextVersion } from '../.github/scripts/determine-next-version.mjs';

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

/** The package whose version is the group's, matching sync-app-version.mjs's anchor. */
const VERSION_ANCHOR = join('packages', 'Entities', 'package.json');

/**
 * The release-readiness gates, and what a failure of each one MEANS. The prose matters as much as
 * the exit code: these run at the one moment nobody wants to read a stack trace, and "exit 1" from a
 * script the reader has never opened is not an instruction.
 *
 * Running them HERE moves all four before the release branch even exists, where the fix is a commit
 * rather than a red publish run over an already-merged promotion.
 */
const GATE_MEANINGS = Object.freeze({
    'check:release-seed': 'a record declared under generated/ or config/ carries a primaryKey that no shipped migration names, so the release would ship a record no host ever receives. The gate names the IDs; migrations/README.md has the consolidated-seed recipe.',
    'check:seed-cadence': 'the ONE consolidated Metadata_Sync generation this release owes is missing, incomplete (a PartNofM gap), or split across two generations. generated/ or config/ moving with no seed ships none of it; two generations is the per-PR cadence MJ abolished.',
    'lint:migrations': 'migrations/ is out of order — a regenerated migration sorts before one that has already shipped, so a host would apply the chain in a different order than this repo did, and the later DROP/CREATE would silently undo the earlier one. The gate names the file.',
    'lint:distribution': 'shipped SQL carries a hazard that only fails on SOMEBODY ELSE\'S database: an unknown ${...} placeholder Skyway leaves as a literal, a core-metadata insert with no guard, a schema sync reaching a schema this app does not own. The gate names the file and the rule.',
});

/** The gate names, in the order a reader should see them. */
const GATE_SCRIPTS = Object.freeze(Object.keys(GATE_MEANINGS));

/** Changeset bump levels, weakest first. `major` wins every tie-break. */
const BUMP_RANK = Object.freeze({ patch: 1, minor: 2, major: 3 });

/**
 * Flyway versioned (V) and baseline (B) migrations — the files whose arrival forces a minor.
 *
 * This is the same shape `.github/scripts/determine-next-version.mjs` matches, duplicated because
 * that module keeps its file listing PRIVATE and takes `listNewMigrations` as an injected
 * dependency instead. What is not duplicated is the rule (major changeset → major, new migrations →
 * minor, otherwise patch); that is imported and called, so the number this script predicts and the
 * number CI predicts come from one place.
 */
const MIGRATION_FILE = /^[VB]\d{12}__.*\.sql$/;

/**
 * WHY A STALE `main` BLOCKS THE *NEXT* RELEASE AND NOT ITS OWN — the one precondition here that
 * nothing else in this repo can tell you about.
 *
 * A release PR merges `next` → `main` and leaves a merge commit on `main` that `next` does not
 * contain; the back-merge PR is what carries it home. Skipping that step costs the release that
 * skipped it NOTHING — it has already merged, published and tagged. The bill arrives at the
 * FOLLOWING release, whose PR cannot merge because its base has moved on, and it arrives mid-release,
 * after the bump is committed and the branch is pushed.
 *
 * Asking the question here turns that surprise into a precondition, answered before a branch exists.
 */
const STALE_MAIN_BLOCKER =
    'main is not contained in next — main carries commit(s) next does not have. The release PR ' +
    'merges next into main, so GitHub will refuse it until next contains everything main has. This ' +
    'is almost always the PREVIOUS release\'s back-merge PR never having landed: that release shipped ' +
    'fine and the cost lands here, on this one. Open `chore/backmerge-v<previous>` from origin/main ' +
    'into next, merge it, and re-run.';

// ── The decision (pure; no fs, no git, no network) ──────────────────────────────────────────────

/**
 * The strongest bump the changesets ask for, or `null` when none of them asks for one.
 *
 * `null` is a real state, not an error: a changeset with empty frontmatter is how changesets records
 * "this landed, it releases nothing". A level this function cannot READ is a different matter and
 * throws — a typo'd level that got skipped here would silently under-bump the version that actually
 * publishes, and `major` quietly becoming `patch` is the one mistake no downstream gate can see.
 */
export function maxBumpLevel(changesets) {
    if (!Array.isArray(changesets)) {
        throw new Error(`release-prep: maxBumpLevel takes an array of changesets, got ${typeof changesets}`);
    }
    let strongest = null;
    for (const changeset of changesets) {
        const level = changeset?.level;
        if (level === null || level === undefined) {
            continue;
        }
        if (typeof level !== 'string' || !Object.hasOwn(BUMP_RANK, level)) {
            throw new Error(
                `release-prep: ${JSON.stringify(level)} is not a changeset bump level (patch, minor, major). ` +
                    'A level this script cannot read must stop the release, never be skipped.',
            );
        }
        if (strongest === null || BUMP_RANK[level] > BUMP_RANK[strongest]) {
            strongest = level;
        }
    }
    return strongest;
}

/**
 * Do these facts even describe a checkout? A separate question from what they mean, and answered
 * first: a blocker list derived from a malformed fact is worse than no answer, because it looks
 * exactly like an answer.
 *
 * Two inputs accept `null`, and it means "could not be determined" rather than "fine":
 * `publishedVersions` when the registry was unreachable, and `mainReachedNext` when neither branch
 * ref resolves. `assessRelease` blocks on both. Every other malformed shape throws, here.
 */
function assertStateIsWellFormed(state) {
    if (state === null || typeof state !== 'object') {
        throw new Error(`release-prep: assessRelease takes a state object, got ${typeof state}`);
    }
    const { treeClean, changesets, gateResults, currentVersion, predictedVersion, tags, publishedVersions, mainReachedNext } =
        state;

    if (typeof treeClean !== 'boolean') {
        throw new Error(`release-prep: treeClean must be a boolean, got ${JSON.stringify(treeClean)}`);
    }
    if (!Array.isArray(changesets) || changesets.some((entry) => entry === null || typeof entry !== 'object')) {
        throw new Error('release-prep: changesets must be an array of { file, level } entries');
    }
    if (typeof currentVersion !== 'string' || currentVersion === '') {
        throw new Error(`release-prep: currentVersion must be a version string, got ${JSON.stringify(currentVersion)}`);
    }
    if (predictedVersion !== null && (typeof predictedVersion !== 'string' || predictedVersion === '')) {
        throw new Error(
            `release-prep: predictedVersion must be a version string or null, got ${JSON.stringify(predictedVersion)}`,
        );
    }
    if (!Array.isArray(tags)) {
        throw new Error(`release-prep: tags must be an array, got ${typeof tags}`);
    }
    if (publishedVersions !== null && (typeof publishedVersions !== 'object' || Array.isArray(publishedVersions))) {
        throw new Error(
            'release-prep: publishedVersions must be a { package: versions[] } map, or null for an unreachable registry',
        );
    }
    if (mainReachedNext !== null && typeof mainReachedNext !== 'boolean') {
        throw new Error(
            `release-prep: mainReachedNext must be a boolean or null (refs unavailable), got ${JSON.stringify(mainReachedNext)}`,
        );
    }
    if (gateResults === null || typeof gateResults !== 'object') {
        throw new Error(`release-prep: gateResults must be an object of exit codes, got ${typeof gateResults}`);
    }
    for (const gate of GATE_SCRIPTS) {
        // A gate with no exit code did not run, and a gate that did not run must never read as one
        // that passed. This throws rather than blocking because it is a defect in the CALLER, not a
        // fact about the release.
        if (!Number.isInteger(gateResults[gate])) {
            throw new Error(
                `release-prep: gateResults carries no exit code for \`${gate}\`. A gate that did not run ` +
                    'must not be read as a gate that passed.',
            );
        }
    }
}

/**
 * The whole release decision, as a pure function of facts the caller gathered. `gatherState` does
 * the git, npm and `npm run` work; keeping it out of here is what lets the spec drive every branch
 * with no repository, no network and no gates to stand up.
 *
 * Every blocker is collected rather than returned one at a time: cutting a release is a slow loop,
 * and finding the second problem only after fixing the first is how a release takes an afternoon.
 */
export function assessRelease(state) {
    assertStateIsWellFormed(state);
    const { treeClean, changesets, gateResults, currentVersion, predictedVersion, tags, publishedVersions, mainReachedNext } =
        state;

    const bumpLevel = maxBumpLevel(changesets);
    const version = predictedVersion;
    const blockers = [];

    if (!treeClean) {
        blockers.push(
            'the working tree is not clean. The release commit is `git add -A`, so anything uncommitted ' +
                'here would ride along inside it — including files no reviewer of the release PR expects ' +
                'to see. Commit or stash first, then re-run.',
        );
    }

    if (changesets.length === 0) {
        blockers.push(
            'no changesets in .changeset/, so there is nothing to release. Either nothing has landed ' +
                `since v${currentVersion}, or \`npm run version\` has already consumed them on this branch — ` +
                'in which case the bump is already made and this step is done.',
        );
    } else {
        const unlevelled = changesets.filter((entry) => entry.level === null || entry.level === undefined);
        if (unlevelled.length > 0) {
            const files = [...new Set(unlevelled.map((entry) => entry.file ?? '<unnamed changeset>'))];
            blockers.push(
                `${files.length} changeset(s) declare no bump level: ${files.join(', ')}. A changeset with ` +
                    'empty frontmatter releases nothing, so it is either a mistake or a file that should not ' +
                    'be here; name a package and a level (`.claude/rules/changesets.md`) or delete it.',
            );
        }
    }

    for (const gate of GATE_SCRIPTS) {
        if (gateResults[gate] !== 0) {
            blockers.push(`\`npm run ${gate}\` failed (exit ${gateResults[gate]}): ${GATE_MEANINGS[gate]}`);
        }
    }

    if (version === null) {
        blockers.push(
            'the next version could not be determined, so there is nothing to name a release branch after. ' +
                'The reason is above — .github/scripts/determine-next-version.mjs derives it.',
        );
    } else {
        if (tags.includes(`v${version}`)) {
            blockers.push(
                `v${version} is already a git tag, so the version this bump would produce has already been ` +
                    'released. Either a release was cut and its changesets were never removed, or the tag ' +
                    'belongs to a version this branch has not caught up with — `git fetch origin --tags` and ' +
                    `look at what v${version} points at before cutting anything.`,
            );
        }
        if (publishedVersions === null) {
            blockers.push(
                `the npm registry could not be reached, so whether v${version} is already published is ` +
                    'unknown (the error is on stderr above). Publishing over a released version is not ' +
                    'something to guess at, and "unknown" must never read as "the version is free" — re-run ' +
                    'with the registry reachable.',
            );
        } else {
            const taken = Object.entries(publishedVersions)
                .filter(([, versions]) => (versions ?? []).includes(version))
                .map(([name]) => name);
            if (taken.length > 0) {
                blockers.push(
                    `v${version} is already on npm for ${taken.join(', ')}. A partially published release is a ` +
                        'state `changeset publish` produces BY DESIGN and expects a RE-RUN of publish.yml to ' +
                        'finish (scripts/release-plan.mjs asks that question) — finish that release rather than ' +
                        'cutting a second one over it.',
                );
            }
        }
    }

    if (mainReachedNext === null) {
        blockers.push(
            'whether main is contained in next could not be determined — neither `origin/main`/`origin/next` ' +
                'nor local `main`/`next` resolve in this checkout. Run `git fetch origin main next`. This ' +
                'blocks rather than passes because the answer decides whether the release PR can merge at all.',
        );
    } else if (!mainReachedNext) {
        blockers.push(STALE_MAIN_BLOCKER);
    }

    return {
        ready: blockers.length === 0,
        blockers,
        version,
        branch: version === null ? null : `release/v${version}`,
        currentVersion,
        bumpLevel,
        changesetCount: changesets.length,
        // Surfaced separately from the gate blocker because its fix — generate the ONE consolidated
        // seed — is release work rather than a code change, so a caller can route it without having
        // to read blocker prose.
        seedOwed: gateResults['check:seed-cadence'] !== 0,
    };
}

/**
 * What must be true after `changeset version` has run, as a pure function so each clause is testable.
 *
 * These exist because the version this script PREDICTS and the version changesets PRODUCES are
 * derived by two different pieces of code. They agree today; this is what notices the day they stop —
 * loudly, with both numbers — instead of pushing a branch named for one version that contains another.
 *
 * @param before `{ packages: string[], changesetCount: number }` captured before the bump
 * @param after  `{ packages: string[], versions: string[], changesetCount: number, predicted: string,
 *               appVersionInSync: boolean }` observed after it
 * @returns every unmet expectation; empty when the bump produced what was predicted
 */
export function checkPostconditions(before, after) {
    if (before === null || typeof before !== 'object' || after === null || typeof after !== 'object') {
        throw new Error('release-prep: checkPostconditions takes the before and after states as objects');
    }
    if (!Array.isArray(before.packages) || !Array.isArray(after.packages) || !Array.isArray(after.versions)) {
        throw new Error('release-prep: checkPostconditions needs before.packages, after.packages and after.versions');
    }

    const problems = [];
    const expected = [...before.packages].sort();
    const found = [...after.packages].sort();

    if (found.length === 0) {
        problems.push('no publishable packages are discoverable after the bump — the release has nothing in it');
    } else if (found.join(',') !== expected.join(',')) {
        problems.push(
            `the publishable package set changed across the bump: before [${expected.join(', ')}], ` +
                `after [${found.join(', ')}]`,
        );
    }

    const versions = [...new Set(after.versions)];
    if (versions.length > 1) {
        problems.push(
            `the packages disagree about the version after the bump (${versions.join(', ')}). They are one ` +
                '`fixed` group in .changeset/config.json and must move together; there is no single version to tag.',
        );
    } else if (versions.length === 1 && versions[0] !== after.predicted) {
        problems.push(
            `changeset version produced ${versions[0]}, but this run predicted ${after.predicted} and the ` +
                'release branch is named for the prediction. Do not push: work out which is right first ' +
                '(the prediction comes from .github/scripts/determine-next-version.mjs).',
        );
    }

    if (after.appVersionInSync !== true) {
        problems.push(
            '`node scripts/sync-app-version.mjs --check` is failing: mj-app.json\'s version or mjVersionRange ' +
                'is no longer derived from packages/Entities. `npm run version` is `changeset version && npm run ' +
                'sync:app-version`, so a failure here means the sync half did not run or its write was reverted.',
        );
    }

    if (after.changesetCount !== 0) {
        problems.push(
            `${after.changesetCount} changeset file(s) survived the bump (${before.changesetCount} went in). ` +
                'publish.yml refuses to publish while any remain, because their presence means the version ' +
                'was never consumed.',
        );
    }
    return problems;
}

/**
 * The bump levels one changeset file asks for, as `{ file, level }` entries — one per frontmatter
 * line, plus a single `level: null` entry for a file whose frontmatter names nothing.
 *
 * An unreadable frontmatter line THROWS rather than being skipped. See `maxBumpLevel` for why: a
 * level this parser silently dropped would under-bump the version that publishes, and nothing
 * downstream can see it happen.
 */
export function parseChangesetFile(text, file) {
    const frontmatter = /^---\r?\n([\s\S]*?)\r?\n?---/.exec(String(text ?? ''));
    if (!frontmatter) {
        throw new Error(`release-prep: ${file} has no \`---\` frontmatter block — it is not a changeset`);
    }
    const levels = frontmatter[1]
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean)
        .map((line) => {
            // `"@scope/pkg": minor` and `'@scope/pkg': minor` both occur in changeset files.
            const entry = /^(['"]?)([^'"]+)\1\s*:\s*(\S+)$/.exec(line);
            if (!entry) {
                throw new Error(`release-prep: ${file} frontmatter line is not a \`"package": level\` entry: ${line}`);
            }
            return entry[3];
        });
    return levels.length === 0 ? [{ file, level: null }] : levels.map((level) => ({ file, level }));
}

// ── Fact gathering (impure; everything above is not) ────────────────────────────────────────────

/**
 * `JSON.parse` with the subject of the parse attached to the failure.
 *
 * A bare parse reports `Unexpected token '<'` and nothing else — not which file, not which package,
 * not what was being done. The three things this script parses fail in ways that read identically
 * from that message alone, and the likeliest of them is a registry or proxy answering `npm view`
 * with an HTML error page, where the payload is the whole diagnosis.
 *
 * @param source what was being parsed, as a reader would name it (a path, or the command that
 *               produced the text)
 */
function parseJson(text, source) {
    try {
        return JSON.parse(text);
    } catch (error) {
        const preview = String(text ?? '').trim().slice(0, 200);
        throw new Error(
            `release-prep could not parse ${source} as JSON: ${error.message}. ` +
                `First ${preview.length} character(s) received: ${JSON.stringify(preview)}`,
            { cause: error },
        );
    }
}

/** git, with the failure turned into something a reader can act on. */
function git(root, args) {
    try {
        return execFileSync('git', args, {
            cwd: root,
            encoding: 'utf8',
            maxBuffer: 64 * 1024 * 1024,
            stdio: ['ignore', 'pipe', 'pipe'],
        });
    } catch (error) {
        throw new Error(
            `release-prep: \`git ${args.join(' ')}\` failed: ${String(error.stderr ?? '').trim() || error.message}`,
            { cause: error },
        );
    }
}

/** `{ clean, paths }` for the working tree, untracked files included — `git add -A` takes those too. */
function readWorkingTree(root) {
    const paths = git(root, ['status', '--porcelain'])
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean);
    return { clean: paths.length === 0, paths };
}

/** Every changeset entry in `.changeset/`. `README.md` is documentation, not a changeset. */
function readChangesets(root) {
    const dir = join(root, '.changeset');
    let entries;
    try {
        entries = readdirSync(dir);
    } catch (error) {
        // Not "zero changesets": a checkout with no .changeset/ is not one a release can be cut
        // from, and reporting "nothing to release" over it would be a lie with the shape of a truth.
        throw new Error(`release-prep cannot read ${dir}: ${error.message}`, { cause: error });
    }
    const files = entries.filter((name) => name.endsWith('.md') && name !== 'README.md').sort();
    const changesets = files.flatMap((name) =>
        parseChangesetFile(readFileSync(join(dir, name), 'utf8'), `.changeset/${name}`),
    );
    return { files, changesets };
}

/** The version the group is at now. The same anchor sync-app-version.mjs derives mj-app.json from. */
function readCurrentVersion(root) {
    const path = join(root, VERSION_ANCHOR);
    const manifest = parseJson(readFileSync(path, 'utf8'), path);
    if (typeof manifest.version !== 'string' || manifest.version === '') {
        throw new Error(`release-prep: ${VERSION_ANCHOR} has no version — there is nothing to increment`);
    }
    return manifest.version;
}

/** Every `v*` tag in this checkout. */
function readTags(root) {
    return git(root, ['tag', '--list', 'v*'])
        .split('\n')
        .map((tag) => tag.trim())
        .filter(Boolean);
}

/**
 * The migration files that are new relative to `baseline`, or — when `baseline` is `null`, meaning
 * this repo has never released — every migration the tree carries.
 *
 * Supplied TO `planNextVersion` rather than decided here: which files count as new is a fact about
 * this checkout, and that module takes it as an injected dependency precisely so the rule it applies
 * to the answer stays in one place.
 */
function listNewMigrations(root, headSha, baseline) {
    const raw =
        baseline === null
            ? git(root, ['ls-tree', '--name-only', '-r', headSha, '--', 'migrations/'])
            : git(root, ['--no-pager', 'diff', '--name-only', baseline, headSha, '--', 'migrations/']);
    return raw
        .split('\n')
        .map((line) => line.trim())
        .filter((file) => MIGRATION_FILE.test(file.split('/').pop() ?? ''));
}

/**
 * Versions npm already has, per publishable package, or `null` for the whole map when the registry
 * could not be answered.
 *
 * Asked per package rather than of the anchor alone: `changeset publish` publishes concurrently, so
 * one package carrying a version its siblings do not is a state it produces BY DESIGN, and in that
 * state the anchor alone reports the version free when it is not.
 *
 * The E404 rule is a second copy of release-plan.mjs's, which does not export its helper. It is
 * duplicated knowingly rather than by accident: npm exits non-zero both for a package that has never
 * been published and for a registry it cannot reach, and conflating the two would republish a
 * released version. If a third caller ever needs it, lift it into a shared module then.
 */
function readPublishedVersions(packages) {
    const published = {};
    for (const pkg of packages) {
        let raw;
        try {
            raw = execFileSync('npm', ['view', pkg.name, 'versions', '--json'], {
                encoding: 'utf8',
                stdio: ['ignore', 'pipe', 'pipe'],
            });
        } catch (error) {
            const stderr = String(error.stderr ?? '');
            if (/E404|404 Not Found/.test(stderr)) {
                published[pkg.name] = [];
                continue;
            }
            return {
                published: null,
                error: `could not ask the npm registry about ${pkg.name}: ${stderr.trim() || error.message}`,
            };
        }
        const parsed = parseJson(raw, `\`npm view ${pkg.name} versions --json\` output`);
        // npm returns a bare string, not an array, for a package with exactly one version.
        published[pkg.name] = Array.isArray(parsed) ? parsed : [parsed];
    }
    return { published, error: null };
}

/**
 * The first of `candidates` that resolves here, or `null` when git ran and resolved none of them.
 *
 * `run.error` — git missing from PATH, or unspawnable — is NOT that answer and must not be folded
 * into it. A `null` from here reaches the reader as the STALE_MAIN_BLOCKER's advice to run
 * `git fetch origin main next`, which cannot possibly help when git itself is what failed. This is
 * the one place in the file where an unknown could become a specific and wrong instruction, so it
 * throws instead.
 */
function resolveRef(root, candidates) {
    for (const ref of candidates) {
        const run = spawnSync('git', ['rev-parse', '--verify', '--quiet', ref], { cwd: root, stdio: 'ignore' });
        if (run.error) {
            throw new Error(
                `release-prep could not execute git to resolve ${ref}: ${run.error.message}. This is git ` +
                    'failing to start, not a ref that is missing — nothing about fetching would help.',
                { cause: run.error },
            );
        }
        if (run.status === 0) {
            return ref;
        }
    }
    return null;
}

/**
 * Is everything on `main` already on `next`? See STALE_MAIN_BLOCKER for why the answer matters.
 *
 * Remote-tracking refs first, because the merge that will refuse is the one GitHub performs against
 * the remote; the local branches are a fallback for a checkout that has them and nothing else.
 *
 * `--is-ancestor` answers with an exit code: 0 yes, 1 no, anything else is git failing to answer.
 * The third case throws — a broken comparison must not be flattened into either answer.
 */
function readMainReachedNext(root) {
    const main = resolveRef(root, ['origin/main', 'main']);
    const next = resolveRef(root, ['origin/next', 'next']);
    if (main === null || next === null) {
        return { value: null, detail: `unknown (main: ${main ?? 'unresolved'}, next: ${next ?? 'unresolved'})` };
    }
    const run = spawnSync('git', ['merge-base', '--is-ancestor', main, next], { cwd: root, encoding: 'utf8' });
    if (run.status === 0) return { value: true, detail: `${main} is contained in ${next}` };
    if (run.status === 1) return { value: false, detail: `${main} has commits ${next} lacks` };
    throw new Error(
        `release-prep could not compare ${main} with ${next}: ${String(run.stderr ?? '').trim() || `exit ${run.status}`}`,
        { cause: run.error },
    );
}

/**
 * Run each gate and keep its exit code and output.
 *
 * The command body comes out of package.json at runtime rather than being re-typed here, so the gate
 * this runs is the gate CI runs by construction; a renamed script fails loudly below instead of
 * silently dropping a check. `node_modules/.bin` joins PATH because that is the one thing an npm
 * script gets that a bare shell does not — a gate that grew a binary dependency would otherwise fail
 * as "not found" and read as a real gate failure.
 */
function runGates(root) {
    const manifestPath = join(root, 'package.json');
    const manifest = parseJson(readFileSync(manifestPath, 'utf8'), manifestPath);
    const scripts = manifest.scripts ?? {};
    const env = { ...process.env, PATH: `${join(root, 'node_modules', '.bin')}${delimiter}${process.env.PATH ?? ''}` };
    const results = {};
    const output = {};
    for (const gate of GATE_SCRIPTS) {
        const command = scripts[gate];
        if (typeof command !== 'string') {
            throw new Error(
                `release-prep: package.json declares no \`${gate}\` script. This list and package.json have ` +
                    'drifted — one of them is wrong, and a release must not be judged with a gate missing.',
            );
        }
        const run = spawnSync(command, { cwd: root, shell: true, encoding: 'utf8', env });
        if (run.error) {
            throw new Error(`release-prep could not run the ${gate} gate (\`${command}\`): ${run.error.message}`, {
                cause: run.error,
            });
        }
        // A null status means a signal killed the gate. Mapping it to 1 here DELIBERATELY pre-empts
        // `assertStateIsWellFormed`'s "a gate that did not run must not be read as a gate that
        // passed" throw, which is therefore unreachable for the signal case from this gatherer. The
        // same fact is decided in two places on purpose, because the two callers know different
        // things: there, a missing exit code means the caller built `gateResults` wrong and there is
        // nothing to report but the defect; here, we watched this gate start and get killed, which
        // is a fact about this run. 1 is the safe answer because both readings of a killed gate —
        // it was failing, or we never found out — are "not a pass", and the release must not proceed
        // on either. It also produces the better message: a named red gate with its meaning, rather
        // than a stack trace. The throw stays as the backstop for any `gateResults` not built here.
        results[gate] = run.status === null ? 1 : run.status;
        output[gate] = `${run.stdout ?? ''}${run.stderr ?? ''}`.trim();
    }
    return { results, output };
}

/**
 * Everything `assessRelease` needs, read off this checkout, plus the detail only the report prints.
 *
 * All of the git, the npm and the `npm run` lives here so that none of it lives in the decision.
 *
 * @returns `{ state, detail }` — `state` is exactly the object `assessRelease` takes.
 */
export function gatherState(root = REPO_ROOT) {
    const tree = readWorkingTree(root);
    const { files, changesets } = readChangesets(root);
    const currentVersion = readCurrentVersion(root);
    const tags = readTags(root);
    const packages = publishablePackages(root);
    const npm = readPublishedVersions(packages);
    if (npm.error !== null) {
        // Loud at the moment it happens, because the blocker it produces can only say "unknown".
        console.error(`⚠ release-prep: ${npm.error}`);
    }
    const ancestry = readMainReachedNext(root);
    const gates = runGates(root);

    const headSha = git(root, ['rev-parse', 'HEAD']).trim();
    const prediction = planNextVersion({
        currentVersion,
        releaseTags: tags,
        hasMajorChangeset: maxBumpLevel(changesets) === 'major',
        listNewMigrations: (baseline) => listNewMigrations(root, headSha, baseline),
    });

    return {
        state: {
            treeClean: tree.clean,
            changesets,
            gateResults: gates.results,
            currentVersion,
            predictedVersion: prediction.version,
            tags,
            publishedVersions: npm.published,
            mainReachedNext: ancestry.value,
        },
        detail: {
            dirtyPaths: tree.paths,
            changesetFiles: files,
            packages,
            ancestry,
            gateOutput: gates.output,
            prediction,
        },
    };
}

// ── The mutations (`--apply` only) ──────────────────────────────────────────────────────────────

/** Run a command, inheriting stdio, and turn a non-zero exit into a described failure. */
function runOrThrow(root, command, args) {
    try {
        execFileSync(command, args, { cwd: root, stdio: 'inherit' });
    } catch (error) {
        throw new Error(
            `release-prep: \`${command} ${args.join(' ')}\` failed (exit ${error.status ?? '?'}). ` +
                'The working tree is left as it is — inspect it before re-running.',
            { cause: error },
        );
    }
}

/**
 * The local half of cutting the release: bump, relock, verify, commit.
 *
 * It does not create the branch and it does not push. `release-prep.yml` creates `release/v<version>`
 * before calling this and pushes afterwards, which is what keeps every remote identity — and every
 * credential — outside this file.
 *
 * The postconditions run BEFORE the commit deliberately: a failure then leaves the bump sitting in
 * the working tree, uncommitted, where it can be read and fixed, rather than inside a commit
 * somebody has to unpick.
 */
function applyRelease(root, assessment) {
    const before = {
        packages: publishablePackages(root).map((pkg) => pkg.name),
        changesetCount: readChangesets(root).files.length,
    };

    runOrThrow(root, 'npm', ['run', 'version']);
    // The bumped internal pins have to reach the lockfile in the same commit. `--package-lock-only`
    // rewrites the lockfile from the manifests without touching node_modules, which matters here:
    // @memberjunction/* are peerDependencies and a real install inside a linked MJ workspace
    // duplicates them (CLAUDE.md, single-copy invariant).
    runOrThrow(root, 'npm', ['install', '--package-lock-only']);

    const appSync = spawnSync('node', [join(root, 'scripts', 'sync-app-version.mjs'), '--check'], {
        cwd: root,
        encoding: 'utf8',
        stdio: ['ignore', 'inherit', 'inherit'],
    });
    if (appSync.error) {
        throw new Error(`release-prep could not run sync-app-version.mjs --check: ${appSync.error.message}`, {
            cause: appSync.error,
        });
    }

    const after = publishablePackages(root);
    const problems = checkPostconditions(before, {
        packages: after.map((pkg) => pkg.name),
        versions: after.map((pkg) => pkg.version),
        changesetCount: readChangesets(root).files.length,
        predicted: assessment.version,
        appVersionInSync: appSync.status === 0,
    });
    if (problems.length > 0) {
        throw new Error(
            `release-prep: the bump ran but did not produce what was predicted.\n${problems
                .map((problem) => `  ✗ ${problem}`)
                .join('\n')}\n\nNothing has been committed. The bump is in the working tree.`,
        );
    }

    runOrThrow(root, 'git', ['add', '-A']);
    runOrThrow(root, 'git', ['commit', '-m', `Release v${assessment.version}`]);
    console.log(`\nCommitted Release v${assessment.version}. Nothing has been pushed — that is the workflow's job.`);
}

// ── Reporting ───────────────────────────────────────────────────────────────────────────────────

/**
 * Note for anyone editing these strings: the ready path deliberately does not use the word "clean".
 * The working-tree line reads "no uncommitted paths" so that `--plan | grep -i clean` is empty on a
 * clean checkout and non-empty exactly when the dirty-tree blocker fires — which is how that blocker
 * is proven without cutting a release.
 */
function printReport(assessment, gateResults, detail) {
    const gates = GATE_SCRIPTS.map((gate) => `${gate} ${gateResults[gate] === 0 ? '✓' : '✗'}`).join('  ');
    console.log('\nRelease readiness\n');
    console.log(`  current version   v${assessment.currentVersion}`);
    console.log(
        `  changesets        ${detail.changesetFiles.length}` +
            (assessment.bumpLevel === null ? '' : ` (strongest bump: ${assessment.bumpLevel})`),
    );
    console.log(
        `  next version      ${assessment.version === null ? '—' : `v${assessment.version}`}` +
            ` (${detail.prediction.bump} bump${detail.prediction.firstRelease ? ', first release' : ''})`,
    );
    console.log(`  release branch    ${assessment.branch ?? '—'}`);
    console.log(
        `  working tree      ${detail.dirtyPaths.length === 0 ? 'no uncommitted paths' : `${detail.dirtyPaths.length} uncommitted path(s)`}`,
    );
    for (const entry of detail.dirtyPaths.slice(0, 10)) {
        console.log(`                      ${entry}`);
    }
    if (detail.dirtyPaths.length > 10) {
        console.log(`                      … and ${detail.dirtyPaths.length - 10} more`);
    }
    console.log(`  main into next    ${detail.ancestry.detail}`);
    console.log(`  gates             ${gates}`);

    for (const gate of GATE_SCRIPTS) {
        if (gateResults[gate] !== 0 && detail.gateOutput[gate]) {
            const said = detail.gateOutput[gate]
                .split('\n')
                .map((line) => `  ${line}`)
                .join('\n');
            console.log(`\n  ── ${gate} said ──\n${said}`);
        }
    }

    if (assessment.ready) {
        console.log(`\n✅ READY — v${assessment.version} can be cut on ${assessment.branch}.`);
        console.log('   `node scripts/release-prep.mjs --apply` performs the bump, the relock and the commit.');
        return;
    }
    console.log(`\n⛔ NOT READY — ${assessment.blockers.length} blocker(s):\n`);
    for (const blocker of assessment.blockers) {
        console.log(`  ✗ ${blocker}\n`);
    }
}

/** The three facts the workflow needs from this run. Empty rather than absent when unknown. */
function writeGithubOutput({ ready, version, branch }) {
    if (!process.env.GITHUB_OUTPUT) {
        return;
    }
    appendFileSync(process.env.GITHUB_OUTPUT, `ready=${ready}\nversion=${version ?? ''}\nbranch=${branch ?? ''}\n`);
}

// ── CLI ─────────────────────────────────────────────────────────────────────────────────────────

function parseMode(argv) {
    const known = new Set(['--plan', '--apply']);
    const unknown = argv.filter((arg) => !known.has(arg));
    if (unknown.length > 0) {
        throw new Error(
            `release-prep: unrecognised argument(s) ${unknown.join(' ')}. Usage: release-prep.mjs [--plan | --apply]`,
        );
    }
    // `--plan --apply` names both modes at once. Guessing which was meant is guessing about a command
    // that mutates the repository, so it refuses instead.
    if (argv.includes('--plan') && argv.includes('--apply')) {
        throw new Error('release-prep: --plan and --apply are different modes; pass one');
    }
    return argv.includes('--apply') ? 'apply' : 'plan';
}

function main(argv) {
    const mode = parseMode(argv);
    let gathered;
    let assessment;
    try {
        gathered = gatherState(REPO_ROOT);
        assessment = assessRelease(gathered.state);
    } catch (error) {
        console.error(`\n⛔ release-prep could not assess this checkout: ${error.message}`);
        if (error.cause) {
            console.error(`   cause: ${error.cause.message ?? error.cause}`);
        }
        writeGithubOutput({ ready: false, version: null, branch: null });
        // `--plan` is a signal, not a gate: it is meant to run wherever somebody asks "is a release
        // due?", and a checkout it cannot read is not a reason to fail that build. It has already
        // said what went wrong, on stderr, and reported ready=false.
        return mode === 'plan' ? 0 : 1;
    }

    printReport(assessment, gathered.state.gateResults, gathered.detail);
    writeGithubOutput(assessment);

    if (mode === 'plan') {
        // Always 0, even when blocked. Blocked-ness is reported in `ready`, which is what the
        // workflow reads; an exit code would make an honest "not yet" indistinguishable from a
        // crash.
        return 0;
    }
    if (!assessment.ready) {
        // Deliberately not a second derivation of the same decision: --apply asks assessRelease the
        // question --plan asks, and refuses on the same answer.
        console.error('\nRefusing to cut a release with blockers outstanding.');
        return 1;
    }
    applyRelease(REPO_ROOT, assessment);
    return 0;
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
    try {
        process.exitCode = main(process.argv.slice(2));
    } catch (error) {
        console.error(`\n⛔ ${error.message}`);
        if (error.cause) {
            console.error(`   cause: ${error.cause.message ?? error.cause}`);
        }
        process.exitCode = 1;
    }
}
