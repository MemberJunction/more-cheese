#!/usr/bin/env node
/**
 * Release readiness — is every record declared under `generated/` and `config/` named by the shipped
 * chain?
 *
 * Ported from `bizapps-forms/scripts/check-release-seed-coverage.mjs`. Collects every
 * `primaryKey.ID` UUID declared in this repo's sync trees and checks each appears somewhere in
 * `migrations/*.sql`. No database, no dependencies, runs on any checkout.
 *
 * WHY THIS EXISTS, AND WHAT IT REPLACED (upstream). The gate in forms used to compare the sync tree
 * against a checked-in hash manifest and infer "the seed ships this record" from the PRESENCE OF A
 * MANIFEST KEY. That inference is a silent pass in one direction: regenerate the manifest without
 * regenerating the seed and the gate goes green while the record ships nowhere. bizapps-sales hit
 * exactly that. This checks the property the manifest was a proxy for, and it needs nothing kept up
 * to date — it reproduces the "what is still pending" list from the repo itself.
 *
 * NOT A PR GATE, deliberately. PRs contribute declarative JSON only; the build engineer generates
 * ONE consolidated seed per release from a clean database. Wiring this into every PR would re-impose
 * the per-PR cadence MJ rules out. It runs at the release boundary and by hand when you cut the seed.
 * `lint:distribution` does not invoke it.
 *
 * ── WHAT THE PORT CHANGED ─────────────────────────────────────────────────────────────────────
 *
 * TWO TREES, NOT ONE. forms has `metadata/`. This repo has `generated/` — 88 MB of world data pushed
 * by `mj sync push` — and `config/`, the app configuration (users, roles, views, dashboards, queries,
 * conversations, artifacts, AI models, KH sources). Both reach a host only through `migrations/`, so
 * both are in scope. `data/ownership.json` classifies the directories and is the repo's own account
 * of which is which; this gate deliberately does not read it, because a record that reaches no host
 * is a defect whatever tier it sits in, and a gate that depended on a hand-maintained manifest to
 * decide what to look at would inherit the exact weakness that retired the hash manifest.
 *
 * RECORD FILES ARE DOTFILES. Every `.mj-sync.json` here declares `filePattern: "**‌/.*.json"`, so the
 * records are `.people.json`, `.7fe3b684.json` and so on. A walker that skipped dotfiles — which is
 * the reflex — would read NOTHING and report perfect coverage of zero records. The vacuity guard at
 * the end is what turns that into a failure rather than a green.
 *
 * THE "NO SEED YET" STATE IS REPORTED, NOT DUMPED. forms can assume `migrations/` holds a seed. This
 * repo, today, holds exactly one migration — the schema baseline — and issue #30 dropped the
 * `Metadata_Sync` seeds outright; they return when the build engineer cuts the release seed. Under
 * forms' logic that state prints every declared id in the repo as uncovered, which for 88 MB of
 * `generated/` is hundreds of thousands of lines and is not a report anybody reads. {@link
 * findSeedCoverageGaps} detects "no `*Metadata_Sync*.sql` at all" up front and says so in one
 * sentence with a count, which is the same distinction `.github/workflows/changes.yml` already draws
 * in its "Detect Metadata_Sync seed migrations" step.
 *
 * WHAT A PASS DOES AND DOES NOT MEAN. A pass says every declared record id is named by the shipped
 * SQL — it does not say the seed CREATES it correctly, because a match counts wherever the id
 * appears, including inside a comment. That is deliberate: the id can ship as `'<guid>'`, `N'<guid>'`
 * or either case, and a second SQL parser to distinguish those shapes would be more to own than the
 * question is worth. The proof that a seed installs correctly is a clean install from migrations.
 * `check-sync-id-parity.mjs` is the stronger, narrower instrument: it matches ids to the actual
 * `spCreate`/`spUpdate` arguments, for loom directories only, and it needs the seed to exist.
 *
 * IT CANNOT SEE AN EDITED RECORD. It reads ids, not content: change the body of a record whose id
 * already ships and this stays quiet. What covers edits is the release push itself — `mj sync push`
 * against a clean database diffs the database and emits `spUpdate*` for every changed record by
 * construction — and, before that, `check-release-seed-cadence.mjs`'s drift rule.
 *
 * `migrations/` only, NOT `migrations-pg/`. A record present only in the PostgreSQL twin has not
 * shipped on the chain every host runs; counting it would report coverage this app does not have.
 */
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { dirname, join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

/** The two sync trees whose records must reach a host through `migrations/`. */
export const SYNC_TREES = Object.freeze(['generated', 'config']);

/**
 * Directories under a sync tree that are generator output rather than source.
 *
 * `sql_logging/` is the raw `mj sync push` log that BECOMES a seed — both `.mj-sync.json` roots here
 * point their `sqlLogging.outputDirectory` at `../migrations/codegen/…`, which is gitignored, but a
 * local run can still leave one in-tree. `.backups/` is what a push writes before updating a record
 * in place. Reading either would report ids nobody declared, on the very push that regenerated the
 * seed.
 */
const IGNORED_DIRS = new Set(['sql_logging', '.backups', 'codegen']);

/**
 * Files that live in a sync tree without being records in it.
 *
 * `.mj-sync.json` is directory configuration (entity name, order, push flags). `checkpoint.json` is
 * the generator's own continuity state, written by `scripts/generate.mjs` — and note that it is the
 * ONE file here that is not a dotfile, so it is also the one file `mj sync` itself never reads: every
 * `.mj-sync.json` declares `filePattern: "**‌/.*.json"`, which it does not match. It carries bare
 * GUID strings under `activeEntityIds` rather than `primaryKey` blocks, so it contributes nothing
 * today; excluding it by name means it cannot start contributing if that shape ever changes, since a
 * record demanded of the seed that `mj sync push` never pushes is a gap nobody can close.
 */
const NOT_A_RECORD_FILE = new Set(['.mj-sync.json', 'checkpoint.json']);

/** The machine-generated seed class. The separator is optional because `MetadataSync` is a spelling
 *  someone types, and this repo's own `check-sync-id-parity.mjs` already matches it loosely. */
const SEED_FILE = /Metadata[_ -]?Sync.*\.sql$/i;

const UUID = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
const UUID_ANYWHERE = /[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}/g;

/** Every record file under `dir`, sorted, excluding generator output. */
function collectRecordFiles(dir, acc = []) {
    // `withFileTypes` answers "directory or not?" from the directory entry, with no stat syscall —
    // which is also what stops a DANGLING SYMLINK killing the walk. `statSync` follows the link and
    // throws ENOENT when the target is gone, so the run dies with a node stack trace instead of a
    // verdict, naming nothing. A dangling entry falls through to the reader below and is reported
    // like any other file that cannot be read.
    for (const entry of readdirSync(dir, { withFileTypes: true }).sort((a, b) => (a.name < b.name ? -1 : 1))) {
        const full = join(dir, entry.name);
        if (entry.isDirectory()) {
            if (!IGNORED_DIRS.has(entry.name)) collectRecordFiles(full, acc);
        } else if (entry.name.endsWith('.json') && !NOT_A_RECORD_FILE.has(entry.name)) {
            // NOTE: dotfiles are NOT skipped. Every record in this repo is one.
            acc.push(full);
        }
    }
    return acc;
}

/**
 * Every `primaryKey.ID` in a parsed record file, at any nesting depth.
 *
 * Recursive rather than array-of-records because `@parent` nesting puts child records inside a
 * `relatedEntities` (or `collections`) block — `check-metadata-closure.mjs` walks both by name for
 * the same reason — and a child that ships nowhere is as invisible to a host as a root one.
 */
function collectIds(node, acc) {
    if (Array.isArray(node)) {
        for (const item of node) collectIds(item, acc);
        return;
    }
    if (!node || typeof node !== 'object') return;
    const pk = node.primaryKey;
    if (pk && typeof pk.ID === 'string' && UUID.test(pk.ID.trim())) acc.push(pk.ID.trim().toUpperCase());
    for (const value of Object.values(node)) collectIds(value, acc);
}

/**
 * The shipped SQL as one lower-cased haystack, plus the seed files that contributed to it.
 *
 * Top level only, deliberately: `migrations/` is flat here and `migrations/codegen/` is gitignored
 * intermediate output that ships nothing. If that layout ever changes this fails LOUDLY — every id
 * reports as uncovered — rather than quietly missing the subdirectory that holds the real seed.
 *
 * ALL `.sql` files feed the haystack, not just the seeds: an id named by any shipped migration IS
 * shipped, and the baseline legitimately names the twelve entity ids it creates. The seed list is
 * tracked separately only so the "no seed has been cut yet" state can be reported as itself.
 */
function readShippedSql(migrationsDir) {
    if (!existsSync(migrationsDir)) return null;
    const files = readdirSync(migrationsDir).filter((f) => f.endsWith('.sql'));
    if (files.length === 0) return null;
    // Every UUID named anywhere in the shipped SQL, collected once per file. A substring search of
    // each declared id over the joined SQL (the previous shape) is quadratic: the v1.2.0 seed is
    // 340 MB and this repo declares ~88k ids, which put the gate past an hour. A Set lookup is
    // flat in the number of ids and finishes in seconds; files are read one at a time so the whole
    // seed is never held in memory at once.
    const shippedIds = new Set();
    for (const f of files) {
        for (const m of readFileSync(join(migrationsDir, f), 'utf8').matchAll(UUID_ANYWHERE)) shippedIds.add(m[0].toLowerCase());
    }
    return {
        shippedIds,
        seedFiles: files.filter((f) => SEED_FILE.test(f)).sort(),
    };
}

/**
 * Reports every way this repo's sync trees are not covered by its `migrations/`.
 *
 * A pure read, and every failure is a `problem` string rather than a throw, so one reporting path
 * serves all of them — a missing directory, an unparseable record file, an uncovered id and a run
 * that measured nothing are all things a build engineer needs told in the same breath.
 */
export function findSeedCoverageGaps(repoRoot = REPO_ROOT) {
    const problems = [];
    const trees = SYNC_TREES.map((name) => ({ name, dir: join(repoRoot, name) }));
    const missing = trees.filter((t) => !existsSync(t.dir));
    if (missing.length === trees.length) {
        return {
            problems: [`none of ${SYNC_TREES.join(', ')} exists under ${repoRoot} — this is not the repo root.`],
            filesRead: 0,
            idsChecked: 0,
            seedFiles: [],
        };
    }
    for (const t of missing) {
        problems.push(`${t.name}/ does not exist, so none of its records could be checked.`);
    }

    const shipped = readShippedSql(join(repoRoot, 'migrations'));
    if (shipped === null) {
        return {
            problems: ['migrations/ is missing or contains no .sql files, so nothing could be covered. This is a broken run, not a finding.'],
            filesRead: 0,
            idsChecked: 0,
            seedFiles: [],
        };
    }

    let filesRead = 0;
    const declared = new Set();
    const uncoveredByFile = [];
    for (const { name, dir } of trees.filter((t) => existsSync(t.dir))) {
        for (const file of collectRecordFiles(dir)) {
            const shown = relative(repoRoot, file).split(sep).join('/');
            let parsed;
            try {
                // A leading U+FEFF is stripped: JSON.parse rejects it, `mj sync` and every other
                // reader accept it, so failing here would fail a file that is not actually wrong.
                parsed = JSON.parse(readFileSync(file, 'utf8').replace(/^﻿/, ''));
            } catch (error) {
                // Never skipped, and never collapsed into the vacuity message below: a record file
                // this script cannot read is a record it cannot vouch for, and the parser's reason is
                // the only thing that tells anyone which it is.
                problems.push(`${shown} could not be read as JSON, so its records were not checked: ${error.message}`);
                continue;
            }
            filesRead++;
            const ids = [];
            collectIds(parsed, ids);
            const unique = [...new Set(ids)];
            for (const id of unique) declared.add(id);
            // The parsed tree is dropped here rather than accumulated: `generated/people/.people.json`
            // alone is 22 MB, and holding every tree at once is how this stops being runnable in CI.
            if (shipped.seedFiles.length > 0) {
                const unseen = unique.filter((id) => !shipped.shippedIds.has(id.toLowerCase()));
                if (unseen.length > 0) uncoveredByFile.push({ shown, unseen, total: unique.length });
            }
            void name;
        }
    }

    const idsChecked = declared.size;

    // The state this repo is in TODAY, reported as itself rather than as hundreds of thousands of
    // "uncovered id" lines. #30 dropped the seeds; they return when the build engineer cuts the
    // release seed. `.github/workflows/changes.yml` draws the same distinction before it runs
    // `check:sync-id-parity`, and the workflow step for this gate is guarded the same way.
    if (shipped.seedFiles.length === 0) {
        problems.push(
            `migrations/ contains NO *Metadata_Sync*.sql, so none of the ${idsChecked} record IDs declared across ` +
                `${filesRead} file(s) in ${SYNC_TREES.join('/ and ')}/ reaches a host. MJ's manifest schema is explicit ` +
                "that `metadata.directory` is dev-time only and the install engine never reads it — seeding happens " +
                'exclusively through migrations/. This is the EXPECTED state on `next` until the build engineer ' +
                'generates the release seed (#30, #48 Stage 3): build the generation database from the shipped chain, ' +
                '`mj sync push --dir generated` from the MJ repo cwd, apply the placeholder substitutions, and land the ' +
                'result as migrations/V<stamp>__v1.x__Metadata_Sync_PartNofM.sql. Re-run this then; it is the gate that ' +
                'confirms nothing was left behind.',
        );
    }

    for (const { shown, unseen, total } of uncoveredByFile) {
        // EVERY id, not a count and a sample. This output IS the pending list — the thing that
        // replaced a table someone had to remember to append to — and a file that owes twelve records
        // while naming one sends the build engineer back to the repo to derive the rest, which is the
        // hand-maintenance this check exists to end.
        problems.push(
            `${shown}: ${unseen.length} of ${total} declared IDs appear in NO migration —\n` +
                unseen.map((id) => `      ${id}`).join('\n'),
        );
    }

    /**
     * A probe that measures nothing must not report success. A run that collected no ids at all — a
     * moved directory, a renamed `primaryKey` shape, a dotfile-skipping walk — is a defect wearing
     * this script's name. Appended rather than returned early, so any parse failures that explain it
     * are reported alongside instead of being thrown away.
     */
    if (idsChecked === 0) {
        problems.push(
            `measured NOTHING: ${filesRead} readable record file(s) across ${SYNC_TREES.join('/ and ')}/ declared no ` +
                'primaryKey UUID. Either the sync-tree layout changed under this script or the walk is broken — note ' +
                'that every record file here is a DOTFILE (`filePattern: "**/.*.json"`), so a walker that skips ' +
                'dotfiles reads nothing and reports perfect coverage. A check that examined nothing is not a check ' +
                'that passed.',
        );
    }

    return { problems, filesRead, idsChecked, seedFiles: shipped.seedFiles };
}

if (process.argv[1] && process.argv[1].endsWith('check-release-seed-coverage.mjs')) {
    const { problems, filesRead, idsChecked, seedFiles } = findSeedCoverageGaps();

    if (problems.length > 0) {
        console.error('\n❌ Release seed coverage failed — metadata declared here reaches no host:\n');
        for (const problem of problems) console.error(`  • ${problem}`);
        console.error('');
        process.exit(1);
    }

    console.log(
        `✅ Release seed coverage passed — all ${idsChecked} primaryKey UUIDs across ${filesRead} record file(s) ` +
            `in ${SYNC_TREES.join('/ and ')}/ appear in migrations/ (${seedFiles.length} seed file(s): ` +
            `${seedFiles.join(', ')}).`,
    );
}
