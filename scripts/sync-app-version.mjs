#!/usr/bin/env node
/**
 * Keep `mj-app.json`'s `version` and `mjVersionRange` derived from `packages/Entities/package.json`,
 * the version anchor for this repo's fixed changesets group.
 *
 * This used to be inline jq inside publish.yml, so it could only run — and only be tested — during
 * an actual release. `--check` is the half that makes it a gate: a hand-edited mj-app.json, or a
 * release PR that forgot to bump the anchor package, fails before anything is published.
 *
 * Both halves call the same function on purpose. A separate checker would be a second copy of the
 * derivation rule, and the two would drift.
 *
 * Plain Node, stdlib only — this runs in CI jobs that do not `npm ci`.
 */
import { readFileSync, writeFileSync, realpathSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const ENTITIES_PKG_PATH = join(REPO_ROOT, 'packages', 'Entities', 'package.json');
const APP_MANIFEST_PATH = join(REPO_ROOT, 'mj-app.json');

/** The MJ package whose pin decides the app's supported MJ version range. */
const MJ_ANCHOR = '@memberjunction/core';

/** An optional `^`/`~`/`>=` prefix followed by a semver (prerelease suffix kept). */
const PIN_PATTERN = /^(?:\^|~|>=)?(\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?)$/;

/**
 * `mj-app.json`'s derived fields, computed from the entities package's own manifest.
 *
 * `mjVersionRange` is `>=<pin> <(major+1).0.0>`: an app supports the MJ line it is built against,
 * up to but not including the next major.
 */
export function computeAppVersionFields(entitiesPkg) {
    const version = entitiesPkg?.version;
    if (!version) {
        throw new Error('packages/Entities/package.json has no version — cannot derive mj-app.json');
    }

    const pin = entitiesPkg?.peerDependencies?.[MJ_ANCHOR] ?? entitiesPkg?.dependencies?.[MJ_ANCHOR];
    if (!pin) {
        throw new Error(
            `packages/Entities/package.json declares no ${MJ_ANCHOR} in peerDependencies or dependencies — ` +
                'mjVersionRange has no input to derive from',
        );
    }

    const match = PIN_PATTERN.exec(pin);
    if (!match) {
        throw new Error(`${MJ_ANCHOR} pin "${pin}" is not a parseable semver range — refusing to guess`);
    }
    const min = match[1];
    const nextMajor = Number(min.split('.')[0]) + 1;

    return { version, mjVersionRange: `>=${min} <${nextMajor}.0.0` };
}

function readJson(path) {
    return JSON.parse(readFileSync(path, 'utf8'));
}

/** CLI entry point: sync (default) or verify (`--check`) `mj-app.json` against the anchor package. */
function main() {
    const check = process.argv.includes('--check');
    const app = readJson(APP_MANIFEST_PATH);
    const expected = computeAppVersionFields(readJson(ENTITIES_PKG_PATH));

    const drift = Object.entries(expected).filter(([field, value]) => app[field] !== value);

    if (drift.length === 0) {
        if (!check) {
            console.log('mj-app.json is already in sync.');
        }
        return;
    }

    if (check) {
        console.error('mj-app.json is out of sync with packages/Entities/package.json:');
        for (const [field, value] of drift) {
            console.error(`  ${field}: expected ${JSON.stringify(value)}, actual ${JSON.stringify(app[field])}`);
        }
        process.exit(1);
    }

    // Spread onto the existing object (not `expected` first) so key order and untouched keys survive.
    writeFileSync(APP_MANIFEST_PATH, JSON.stringify({ ...app, ...expected }, null, 2) + '\n');
    console.log('mj-app.json synced.');
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
