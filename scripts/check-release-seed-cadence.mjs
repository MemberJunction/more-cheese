#!/usr/bin/env node
/**
 * RELEASE CADENCE: ONE seed GENERATION per release — no more, and not zero when the sync trees moved.
 *
 * Ported from `bizapps-forms/scripts/check-release-seed-cadence.mjs`. MJ's release-time model is that
 * a PR carries declarative JSON and the build engineer generates ONE consolidated seed per release.
 * `check-release-seed-coverage.mjs` asks whether the seed carries every declared record. It cannot
 * ask the question THIS file exists for, and the difference is the reason both are needed:
 *
 *   coverage — "is this ID named by some shipped migration?"   Blind to WHICH migration names it.
 *   cadence  — "did we ship one consolidated seed, or a pile of per-PR deltas?"
 *
 * A per-PR delta sitting in `migrations/` satisfies coverage perfectly — the ids ARE in a shipped
 * file — while being exactly the cadence the model abolishes. Coverage would go green over it forever.
 *
 * ── THE BIG ADAPTATION: "ONE SEED" IS SEVERAL FILES HERE ──────────────────────────────────────
 * Forms' rule is literally "at most one unreleased `Metadata_Sync` file". Applied here it would be
 * WRONG IN BOTH DIRECTIONS, because this repo's seed cannot be one file: `generated/` is 88 MB across
 * 53 directories plus a 2 MB `config/`, roughly 400x any sibling's, and the release plan is several
 * `V<stamp>__v1.2.x__Metadata_Sync_PartNofM.sql` parts each under 100 MB, with the `config/` part
 * last. Under forms' rule a correct four-part seed fails on its own second file, and — the direction
 * that actually costs something — a gate that fails on the correct shape is one somebody switches off.
 *
 * So the unit of "one seed" is the GENERATION, not the file. {@link findUnconsolidatedSeedDeltas}
 * groups the unreleased seed files by GENERATION — the base stamp each part's own stamp was offset
 * from (see {@link generationStamp}; Skyway forbids two files with one version) — and asserts:
 *
 *   • exactly one stamp — two stamps are two generations, which IS the per-PR cadence returning;
 *   • the parts of that stamp form a complete `1of M … M of M` run — no gap, no duplicate, no
 *     disagreement about M. A gap is the failure this repo is most exposed to, because a part is a
 *     ~100 MB file and the way it goes missing is a `.gitignore` rule or an LFS/push limit, not a
 *     decision. Coverage would then report the missing part's records as uncovered, thousands of
 *     lines deep; this names the one fact that explains them.
 *   • parted and unparted files are not mixed under one stamp.
 *
 * ── THE OTHER ADAPTATION: THIS REPO HAD NEVER BEEN RELEASED ───────────────────────────────────
 * Forms derives "what has already shipped" from `v*` tags and treats their absence as a broken run.
 * more-cheese had NO `v*` tag at all when this gate was written — six `publish.yml` runs, six
 * failures, nothing ever published (#48) — and that was a true, current, correct state rather than a
 * broken checkout. Before v1 every migration in the tree is unreleased, which is what made the
 * part-set rule above the whole of what could be checked.
 *
 * v1.2.0 shipped on 2026-09-19, so the drift rule below is now ARMED and this repo exercises the
 * tagged path. Both paths stay supported and both stay tested: the untagged one is not dead code,
 * it is what any fork or successor repo hits before its own first release.
 *
 * The two rules therefore degrade differently, and deliberately:
 *
 *   findUnconsolidatedSeedDeltas — needs NO tag. With none, "released" is empty and every seed file
 *                                 in the tree is unreleased, which is exactly right pre-v1.
 *   findUnshippedMetadataDrift   — needs a tag, because "has the tree moved SINCE THE LAST RELEASE?"
 *                                 has no meaning without one. With no tag it reports a NOTICE and
 *                                 checks nothing, rather than failing a repo for not having shipped
 *                                 yet. It arms itself the moment `v1.2.0` exists.
 *
 * WHY THE DRIFT RULE EARNS ITS KEEP once it arms, when coverage already reads the sync trees.
 * Coverage compares declared **ids** against shipped SQL, so it is structurally blind to an EDITED
 * record whose id already ships. In forms that was not hypothetical: a seed shipped a prompt saying
 * `Signature`, `metadata/` had moved on to `Doodle`, the id was identical throughout, and coverage
 * stayed green over it. Drift is the only one of the three checks that sees that class of gap — and
 * this repo regenerates `generated/` wholesale from a seeded generator, so edits-in-place are its
 * normal mode rather than an exception.
 *
 * WHY IT IS NOT A HASH MANIFEST. A manifest stores hashes IN THE REPO, so regenerating them is the
 * way to make the gate quiet — and doing that without regenerating the seed is a silent pass. This
 * stores nothing. The answer is derived from git history, and the only way to make it green is to
 * actually ship a seed or actually revert the change.
 *
 * This needs git (tags and history are the only record of what shipped), which is why it is a
 * SEPARATE command from the coverage check — that one is deliberately pure-fs and runs on any
 * checkout, and folding git into it would break that.
 */
import { execFileSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

/** The machine-generated seed class, matching `check-release-seed-coverage.mjs` and `changes.yml`. */
const SEED_PATTERN = /Metadata[_ -]?Sync.*\.sql$/i;

/** The sync trees a seed is owed for. Both, for the reason coverage gives. */
export const SYNC_TREES = Object.freeze(['generated', 'config']);

function git(repoRoot, args) {
    return execFileSync('git', args, { cwd: repoRoot, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
}

/** `v1.2.0-rc.1` → core [1,2,0] plus the prerelease `rc.1`. A non-numeric core part scores -1 so junk
 *  tags (`v-latest`, `vNEXT`) sort below every real version rather than above them. */
function parseVersion(tag) {
    const raw = tag.replace(/^v/, '');
    const dash = raw.indexOf('-');
    const core = (dash === -1 ? raw : raw.slice(0, dash)).split('.').map((n) => (/^\d+$/.test(n) ? Number(n) : -1));
    return { core, pre: dash === -1 ? null : raw.slice(dash + 1) };
}

/**
 * Semver order, and the prerelease rule is the whole reason this is not a one-liner: `1.2.0-rc.1` is
 * LOWER than `1.2.0` (semver §11). Getting that backwards picks the rc as the release baseline, so
 * everything shipped in the final looks unreleased and the gate fails the release that did everything
 * right. A gate that cries wolf is one somebody switches off. The MJ family tags prereleases
 * (`6.1.0-edge.2`), so this is a shape this repo will meet.
 */
function compareVersions(a, b) {
    const [x, y] = [parseVersion(a), parseVersion(b)];
    for (let i = 0; i < Math.max(x.core.length, y.core.length); i++) {
        const d = (x.core[i] ?? 0) - (y.core[i] ?? 0);
        if (d !== 0) return d;
    }
    if (x.pre === null || y.pre === null) return (x.pre === null ? 1 : 0) - (y.pre === null ? 1 : 0);

    const [xs, ys] = [x.pre.split('.'), y.pre.split('.')];
    for (let i = 0; i < Math.max(xs.length, ys.length); i++) {
        const [p, q] = [xs[i], ys[i]];
        if (p === undefined || q === undefined) return p === undefined ? -1 : 1;
        const bothNumeric = /^\d+$/.test(p) && /^\d+$/.test(q);
        if (bothNumeric) {
            const d = Number(p) - Number(q);
            if (d !== 0) return d;
        } else if (p !== q) {
            return p < q ? -1 : 1;
        }
    }
    return 0;
}

/**
 * The git boundary, and deliberately dumb: it reports which migration files exist at the newest
 * release tag and in the working tree, and which files under the sync trees differ between the two.
 * It decides nothing. Which files count as a SEED, and which count as a RECORD, is domain knowledge
 * that lives in the rules below — a boundary that pre-filtered would make them untestable without a
 * git repository, and would let a stub disagree with production about the definitions the checks
 * turn on.
 */
export function readReleaseState(repoRoot) {
    const migrationsDir = join(repoRoot, 'migrations');
    const current = existsSync(migrationsDir) ? readdirSync(migrationsDir) : [];

    const tags = git(repoRoot, ['tag', '--list', 'v*'])
        .split('\n')
        .map((t) => t.trim())
        .filter(Boolean)
        .sort(compareVersions);
    if (tags.length === 0) {
        // NOT an error here, unlike forms. This repo has never published; `current` is still the
        // honest answer to "what seed files exist", and the part-set rule runs on it alone.
        return { tag: null, released: [], current, syncChanged: [] };
    }

    const tag = tags[tags.length - 1];
    const listMigrations = (ref) =>
        git(repoRoot, ['ls-tree', '--name-only', ref, 'migrations/'])
            .split('\n')
            .map((f) => f.trim().replace(/^migrations\//, ''))
            .filter(Boolean);

    // No `HEAD` argument: `git diff <tag> -- <path>` compares the tag against the WORKING TREE, so an
    // edit the engineer has not committed yet still counts. Untracked files are the one thing this
    // cannot see; a brand-new record with a brand-new id is caught by the coverage check.
    const syncChanged = git(repoRoot, ['diff', '--name-only', tag, '--', ...SYNC_TREES])
        .split('\n')
        .map((f) => f.trim())
        .filter(Boolean);

    return { tag, released: listMigrations(tag), current, syncChanged };
}

/**
 * A seed filename decomposed into the generation it belongs to and its place in that generation.
 *
 * `V<stamp>__<label>__Metadata_Sync[_Part<N>of<M>].sql`. The label is ignored on purpose: it carries
 * the app version (`v1.2.0`), and two parts of one generation can legitimately disagree about it if
 * the release version is bumped between writing them. The STAMP is the generation key, because
 * `mj sync push` produces one run at one moment.
 *
 * Returns `{ stamp: null }` for a name this cannot read, which the rule reports rather than skips:
 * an unreadable seed name is one nothing can order, and Flyway sorts what it cannot parse last.
 */
export function parseSeedName(file) {
    const m = /^[VB](\d{12})__.*?Metadata[_ -]?Sync(?:[_-]?Part(\d+)of(\d+))?\.sql$/i.exec(file);
    if (m === null) return { file, stamp: null, part: null, of: null, generation: null };
    const stamp = m[1];
    const part = m[2] === undefined ? null : Number(m[2]);
    return {
        file,
        stamp,
        part,
        of: m[3] === undefined ? null : Number(m[3]),
        generation: generationStamp(stamp, part),
    };
}

/**
 * The generation a seed file belongs to, derived from its own stamp and part number.
 *
 * Skyway (like Flyway) refuses two migrations with the same version — `Found more than one migration
 * with version …` — so the parts of one split generation CANNOT share a stamp. The assembler
 * (`release-seed.sh`) therefore stamps part N at `<base> + (N − 1)` minutes: `…0305_Part1of5`,
 * `…0306_Part2of5`, … `…0309_Part5of5`. Undoing that offset gives every part of a run the same
 * generation key, which is what the rules below group on. Unparted files are their own generation.
 */
export function generationStamp(stamp, part) {
    if (stamp === null || part === null || part <= 1) return stamp;
    const y = Number(stamp.slice(0, 4));
    const mo = Number(stamp.slice(4, 6)) - 1;
    const d = Number(stamp.slice(6, 8));
    const h = Number(stamp.slice(8, 10));
    const mi = Number(stamp.slice(10, 12));
    const t = new Date(Date.UTC(y, mo, d, h, mi) - (part - 1) * 60_000);
    const pad = (n) => String(n).padStart(2, '0');
    return `${t.getUTCFullYear()}${pad(t.getUTCMonth() + 1)}${pad(t.getUTCDate())}${pad(t.getUTCHours())}${pad(t.getUTCMinutes())}`;
}

/**
 * Rule 1 — the unreleased seed files must be exactly ONE complete generation (or none).
 *
 * Runs with or without a release tag; see the header.
 */
export function findUnconsolidatedSeedDeltas(repoRoot = REPO_ROOT, readState = readReleaseState) {
    let state;
    try {
        state = readState(repoRoot);
    } catch (error) {
        // Never a silent pass: if we cannot read what shipped, we do not know the answer.
        return { problems: [`could not read git history to determine what has been released: ${error.message}`], tag: null, unreleased: [] };
    }

    // SEED_PATTERN is applied HERE, not at the boundary. Ordinary DDL and CodeGen backfills ship per
    // feature by design and are none of this rule's business — and this repo's only migration today,
    // the schema baseline, is exactly such a file.
    const released = new Set(state.released.filter((f) => SEED_PATTERN.test(f)));
    const unreleased = state.current.filter((f) => SEED_PATTERN.test(f) && !released.has(f)).sort();
    const problems = [];
    if (unreleased.length === 0) {
        return { problems, tag: state.tag, unreleased };
    }

    const parsed = unreleased.map(parseSeedName);
    const unreadable = parsed.filter((p) => p.stamp === null);
    if (unreadable.length > 0) {
        problems.push(
            `${unreadable.length} unreleased seed file(s) do not match ` +
                '`V<YYYYMMDDHHMM>__<label>__Metadata_Sync[_Part<N>of<M>].sql`, so this gate cannot tell which ' +
                'generation they belong to and Flyway sorts what it cannot parse LAST:\n' +
                unreadable.map((p) => `      ${p.file}`).join('\n'),
        );
    }

    const readable = parsed.filter((p) => p.stamp !== null);

    // Two files with one version stamp never reach a database: Skyway refuses the set outright
    // ("Found more than one migration with version …"). Report that first and stop — generation
    // accounting on a set the runner will not load is noise on top of the real problem.
    const filesByStamp = new Map();
    for (const p of readable) filesByStamp.set(p.stamp, [...(filesByStamp.get(p.stamp) ?? []), p.file]);
    const sharedStamps = [...filesByStamp.entries()].filter(([, files]) => files.length > 1);
    if (sharedStamps.length > 0) {
        for (const [stamp, files] of sharedStamps) {
            problems.push(
                `${files.length} seed files share the version stamp ${stamp}: ${files.join(', ')}. Skyway refuses ` +
                    'duplicate versions, so this set can never be applied. Parts of one generation are stamped ' +
                    '`<base> + (N − 1)` minutes apart (what the assembler does); regenerate rather than renaming by hand.',
            );
        }
        return { problems, tag: state.tag, unreleased };
    }

    const byStamp = new Map();
    for (const p of readable) {
        if (!byStamp.has(p.generation)) byStamp.set(p.generation, []);
        byStamp.get(p.generation).push(p);
    }

    if (byStamp.size > 1) {
        problems.push(
            `${byStamp.size} distinct seed GENERATIONS are unreleased, but a release ships ONE consolidated seed.\n` +
                [...byStamp.entries()]
                    .sort()
                    .map(([stamp, parts]) => `      ${stamp}: ${parts.map((p) => p.file).join(', ')}`)
                    .join('\n') +
                '\n\n  A generation is one `mj sync push` run, however many Part files it was split into — the split ' +
                'is a file-size concern, not a cadence one.\n' +
                '  Two stamps means two runs, which is the per-PR delta cadence returning under a different shape.\n' +
                '  Fold them into ONE generation and delete the older parts. Generate against the shipped chain at\n' +
                '  HEAD but WITHOUT the files listed above: they are already applied on a plain `mj app install`, and\n' +
                '  a record one of them created matches the sync tree exactly — so the push emits nothing for it, and\n' +
                '  deleting the delta then strands it with no migration naming it.',
        );
    }

    for (const [stamp, parts] of byStamp) {
        const parted = parts.filter((p) => p.part !== null);
        const unparted = parts.filter((p) => p.part === null);

        if (parted.length > 0 && unparted.length > 0) {
            problems.push(
                `generation ${stamp} mixes parted and unparted seed files: ` +
                    `${unparted.map((p) => p.file).join(', ')} carries no PartNofM while ` +
                    `${parted.length} sibling(s) do. Nothing can then say how many parts the generation has, so a ` +
                    'missing one is undetectable. Name every file in a split generation `_Part<N>of<M>`.',
            );
            continue;
        }
        if (parted.length === 0) {
            if (unparted.length > 1) {
                problems.push(
                    `generation ${stamp} has ${unparted.length} unparted seed files with the same stamp: ` +
                        `${unparted.map((p) => p.file).join(', ')}. Without PartNofM there is no way to tell a ` +
                        'complete set from one missing a file. Name them `_Part<N>of<M>`.',
                );
            }
            continue;
        }

        const declaredTotals = [...new Set(parted.map((p) => p.of))];
        if (declaredTotals.length > 1) {
            problems.push(
                `generation ${stamp} disagrees about how many parts it has: ${declaredTotals.sort((a, b) => a - b).join(' and ')} ` +
                    `(${parted.map((p) => p.file).join(', ')}). One of these was renamed or regenerated on its own.`,
            );
            continue;
        }

        const total = declaredTotals[0];
        const seen = new Map();
        for (const p of parted) {
            seen.set(p.part, [...(seen.get(p.part) ?? []), p.file]);
        }
        const duplicates = [...seen.entries()].filter(([, files]) => files.length > 1);
        for (const [part, files] of duplicates) {
            problems.push(`generation ${stamp} has ${files.length} files claiming part ${part} of ${total}: ${files.join(', ')}.`);
        }
        const missingParts = [];
        for (let n = 1; n <= total; n++) {
            if (!seen.has(n)) missingParts.push(n);
        }
        if (missingParts.length > 0) {
            problems.push(
                `generation ${stamp} declares ${total} parts but part(s) ${missingParts.join(', ')} are not in ` +
                    'migrations/. A part is a ~100 MB file, and the way one goes missing is a .gitignore rule or a ' +
                    'push size limit rather than a decision — so this is the likeliest single cause of a coverage ' +
                    'run reporting thousands of uncovered ids. Restore the missing part, or regenerate the whole ' +
                    'generation; do NOT renumber the survivors, which would hide the loss.',
            );
        }
        const beyond = [...seen.keys()].filter((n) => n > total || n < 1);
        if (beyond.length > 0) {
            problems.push(`generation ${stamp} declares ${total} parts but also carries part number(s) ${beyond.sort((a, b) => a - b).join(', ')}.`);
        }
    }

    return { problems, tag: state.tag, unreleased };
}

/**
 * Records only. `README.md` is prose about a directory, not a record in it, and a documentation edit
 * owes no seed — gating on it would teach people that the way to quiet this check is to not write
 * documentation. `.backups/`, `sql_logging/` and `codegen/` are push by-products, and
 * `checkpoint.json` is the generator's own continuity state, ignored for the same reasons
 * `check-release-seed-coverage.mjs` ignores them.
 */
function getRemovalsInfo(repoRoot) {
    const retiredDirs = new Set();
    const allowedRemovals = new Set();
    try {
        const removalsPath = join(repoRoot, 'data', 'pk-removals.json');
        if (existsSync(removalsPath)) {
            const rem = JSON.parse(readFileSync(removalsPath, 'utf8'));
            for (const rd of rem.retiredDirectories || []) {
                if (rd.directory && rd.reason) {
                    retiredDirs.add(rd.directory);
                }
            }
            for (const r of rem.removals || []) {
                if (r.id && r.reason) {
                    allowedRemovals.add(String(r.id).toUpperCase());
                }
            }
        }
    } catch { /* no removals file */ }
    return { retiredDirs, allowedRemovals };
}

/**
 * Checks whether a sync tree file change consists entirely of deliberate removals
 * declared in data/pk-removals.json (e.g. deleted files whose IDs are in allowedRemovals,
 * or multi-record JSON files where only declared removed IDs were deleted with no surviving edits).
 */
export function isAllowedRemovalChange(repoRoot, file, tag, allowedRemovals) {
    if (!allowedRemovals || allowedRemovals.size === 0 || !tag) return false;

    const fullPath = join(repoRoot, file);
    if (!existsSync(fullPath)) {
        try {
            const oldContent = git(repoRoot, ['show', `${tag}:${file}`]);
            const parsed = JSON.parse(oldContent);
            const records = Array.isArray(parsed) ? parsed : [parsed];
            const ids = records
                .map((r) => r?.primaryKey?.ID)
                .filter(Boolean)
                .map((id) => String(id).toUpperCase());
            return ids.length > 0 && ids.every((id) => allowedRemovals.has(id));
        } catch {
            return false;
        }
    }

    try {
        const currentContent = readFileSync(fullPath, 'utf8');
        const currentParsed = JSON.parse(currentContent);
        if (!Array.isArray(currentParsed)) return false;

        const oldContent = git(repoRoot, ['show', `${tag}:${file}`]);
        const oldParsed = JSON.parse(oldContent);
        if (!Array.isArray(oldParsed)) return false;

        const currentMap = new Map();
        for (const r of currentParsed) {
            const id = r?.primaryKey?.ID?.toUpperCase();
            if (!id) return false;
            currentMap.set(id, r);
        }

        const oldMap = new Map();
        for (const r of oldParsed) {
            const id = r?.primaryKey?.ID?.toUpperCase();
            if (!id) return false;
            oldMap.set(id, r);
        }

        for (const id of currentMap.keys()) {
            if (!oldMap.has(id)) return false;
        }

        for (const [id, currentRec] of currentMap.entries()) {
            const oldRec = oldMap.get(id);
            if (JSON.stringify(currentRec) !== JSON.stringify(oldRec)) return false;
        }

        const removedIds = [];
        for (const id of oldMap.keys()) {
            if (!currentMap.has(id)) removedIds.push(id);
        }

        return removedIds.length > 0 && removedIds.every((id) => allowedRemovals.has(id));
    } catch {
        return false;
    }
}

function isRecordPath(file, retiredDirs) {
    if (/(^|\/)README\.md$/i.test(file)) return false;
    if (/(^|\/)\.mj-sync\.json$/.test(file)) return false;
    if (/(^|\/)checkpoint\.json$/.test(file)) return false;
    if (/(^|\/)(\.backups|sql_logging|codegen)(\/|$)/.test(file)) return false;
    if (retiredDirs) {
        for (const dir of retiredDirs) {
            if (file.startsWith(`generated/${dir}/`) || file.startsWith(`config/${dir}/`)) {
                return false;
            }
        }
    }
    return true;
}

/**
 * Rule 2 — the sync trees moved since the last release, so a seed is OWED.
 *
 * Reports a NOTICE rather than a problem when there is no release tag; see the header.
 */
export function findUnshippedMetadataDrift(repoRoot = REPO_ROOT, readState = readReleaseState) {
    let state;
    try {
        state = readState(repoRoot);
    } catch (error) {
        return { problems: [`could not read git history to compare the sync trees against the last release: ${error.message}`], tag: null, changed: [], notices: [] };
    }
    if (state.tag === null) {
        return {
            problems: [],
            tag: null,
            changed: [],
            notices: [
                `no v* release tag exists, so "have ${SYNC_TREES.join('/ or ')}/ moved since the last release?" has ` +
                    'no answer yet and the drift rule checked nothing. That is this repo\'s true state — nothing has ' +
                    'ever been published (#48) — not a broken checkout. This rule arms itself at the first v* tag. ' +
                    '(If you expected a tag, check that the clone is not shallow and that tags were fetched.)',
            ],
        };
    }

    const { retiredDirs, allowedRemovals } = getRemovalsInfo(repoRoot);
    const changed = (state.syncChanged ?? [])
        .filter((f) => isRecordPath(f, retiredDirs))
        .filter((f) => !isAllowedRemovalChange(repoRoot, f, state.tag, allowedRemovals))
        .sort();
    const released = new Set(state.released);
    const unreleasedSeeds = state.current.filter((f) => SEED_PATTERN.test(f) && !released.has(f));
    const problems = [];
    if (changed.length > 0 && unreleasedSeeds.length === 0) {
        problems.push(
            `${changed.length} record file(s) changed since ${state.tag}, but this release ships NO new ` +
                'Metadata_Sync.\n' +
                changed.slice(0, 40).map((f) => `      ${f}`).join('\n') +
                (changed.length > 40 ? `\n      … and ${changed.length - 40} more` : '') +
                '\n\n  Coverage cannot catch this: it compares declared ids against shipped SQL, and an EDITED record\n' +
                '  keeps its id. This repo regenerates generated/ wholesale from a seeded generator, so edit-in-place\n' +
                '  is its normal mode. Generate the consolidated seed — the push emits spUpdate* for edited records by\n' +
                '  construction, which is the half no id check can see.',
        );
    }
    return { problems, tag: state.tag, changed, notices: [] };
}

if (process.argv[1] && process.argv[1].endsWith('check-release-seed-cadence.mjs')) {
    const cadence = findUnconsolidatedSeedDeltas();
    const drift = findUnshippedMetadataDrift();
    const problems = [...cadence.problems, ...drift.problems];
    const notices = [...(drift.notices ?? [])];
    if (problems.length > 0) {
        console.error('\n❌ Release seed cadence failed:\n');
        for (const p of problems) console.error(`  • ${p}\n`);
        process.exit(1);
    }
    for (const n of notices) console.log(`  ℹ ${n}`);
    console.log(
        `✅ Release seed cadence passed — ${cadence.unreleased.length} unreleased Metadata_Sync file(s)` +
            `${cadence.tag === null ? ' (no release tag yet)' : ` since ${cadence.tag}`}, forming ` +
            `${cadence.unreleased.length === 0 ? 'no' : 'exactly one complete'} seed generation.`,
    );
}
