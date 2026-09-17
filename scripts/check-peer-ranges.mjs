#!/usr/bin/env node
/**
 * Peer-range gate — refuse a peer range that cannot hold on a host we do not own.
 *
 * Ported from `bizapps-forms/scripts/check-peer-ranges.mjs`, which is the only sibling with peer-range
 * enforcement at all. Two rules here: the one forms ships, and one this repo needs that forms does not.
 *
 * ── RULE 1 — NO EXACT VERSION IN ANY `peerDependencies` ────────────────────────────────────────
 * A peer range is a compatibility CLAIM — "this package works against anything in here". An exact
 * peer claims the package works against one patch release and no other, and npm enforces that claim
 * against the host's installed tree. `@mj-biz-apps/forms-ng` declared `"@angular/cdk": "21.1.3"`, so
 * `mj app install` on a stock host — which ships a `@angular/cdk` on a version line that moves
 * independently of `@angular/core` — died with ERESOLVE, and the CLI finalized the app as `Disabled`
 * while telling the operator to fix their npm auth and `.npmrc`. Neither was involved (forms #211).
 *
 * That is not a forms-only hazard, it is the estate's live one: `bizapps-committees` pins
 * `@angular/core` and four siblings EXACTLY in `committees-ng`, MJExplorer ships `21.2.22`, and the
 * two cannot coexist — which is one of the two blockers on the v1 install (more-cheese #48).
 *
 * Nothing local ever puts a peer range under load, which is why this needs a gate rather than a test.
 * The `@angular/*` anchors in `devDependencies` are what actually installs here, and an anchor
 * satisfies the exact peer and the caret alike, so no resolver in this repo can tell the two
 * spellings apart. A host has no anchor — it brings its own — so the consuming resolver is the first
 * one the claim is ever tested against, and by then the app is installed and Disabled.
 *
 * ── RULE 2 — EVERY `@memberjunction/*` PEER AGREES WITH `mj-app.json`'s FLOOR ──────────────────
 * ADDED HERE, not ported: forms has no equivalent, and this repo has a mechanism forms does not.
 * `.github/workflows/publish.yml` (the "Sync mj-app.json version and MJ version range" step) does
 * not READ `mjVersionRange` — it RE-DERIVES it, from the `@memberjunction/core` peer in
 * `packages/Entities/package.json`, as `>=<that version> <next-major>`, and overwrites the manifest
 * with the result on every publish.
 *
 * So a peer range that drifts BELOW the manifest does not produce a mismatch anyone can see in the
 * repo. It produces a manifest that is silently rewritten DOWNWARD at publish time, undoing the
 * version bump in the published artifact while the committed file still reads correctly. The reverse
 * drift is worse in the other direction: a manifest floor below what the peers demand admits a host
 * that passes MJ's install gate and then fails npm resolution — and `mj app install` runs a bare
 * `npm install`, records the app, and leaves it Disabled rather than erroring.
 *
 * The rule is therefore EQUALITY, not compatibility: every `@memberjunction/*` peer must be exactly
 * `^<floor>` where `<floor>` is the `>=` floor of `mjVersionRange`. That is the only shape under
 * which the re-derivation is a no-op.
 *
 * ── WHAT WAS DROPPED FROM THE FORMS ORIGINAL ──────────────────────────────────────────────────
 * `SCANNED_DIRS` loses `apps/` — this repo has no `apps/` tree, and scanning a directory that cannot
 * exist is a line that reads as coverage while providing none. `ALLOWED_EXACT_PEERS` is retained as
 * the mechanism but ships EMPTY: forms' one entry is `forms-server -> type-graphql@2.0.0-beta.3`,
 * a package this repo does not depend on. The stale-allowance rule is kept, so an entry added here
 * and later orphaned fails rather than lingering as a considered decision about something gone.
 *
 * Plain Node, stdlib only, matching `check-migration-order.mjs` and `check-distribution-seed.mjs`:
 * a gate that guards the distribution must run in CI without installing anything.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

/**
 * Where publishable manifests live.
 *
 * `packages` only. Forms also scans `apps/`, so that a peer block added to a deployable is never
 * unguarded; this repo has no such tree, and a directory that cannot exist is not coverage.
 */
export const SCANNED_DIRS = Object.freeze(['packages']);

/**
 * Exact peers that are correct, each with the reason it is correct.
 *
 * EMPTY, and the machinery is kept anyway. An entry is matched on package, peer AND version —
 * matching the version is the point: if the upstream value an entry tracks ever moves and we follow
 * it, the exception expires and has to be re-argued here rather than silently inherited by a value
 * nobody checked.
 *
 * @type {ReadonlyArray<{package: string, peer: string, version: string, reason: string}>}
 */
export const ALLOWED_EXACT_PEERS = Object.freeze([]);

/**
 * True when `spec` names one concrete version rather than a set of them.
 *
 * Everything npm accepts as a range — `^`, `~`, comparators, `||`, hyphen ranges, x-ranges, `*`,
 * `workspace:`, a tag, a URL — is a claim about a set and is therefore fine. Only a bare semver,
 * optionally written `=1.2.3` or with a leading `v` the way a git tag is (`v1.2.3`, or both:
 * `=v1.2.3`), pins the host to a single build — npm normalises the `v` away, so it is the same pin
 * written like a tag. Prerelease and build metadata are part of a concrete version
 * (`2.0.0-beta.3` is exactly one release), so they match.
 */
export function isExactVersion(spec) {
    if (typeof spec !== 'string') {
        return false;
    }
    return /^=?v?\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/.test(spec.trim());
}

/** True when this package/peer/version triple is a documented, still-current exception. */
function isAllowed(packageName, peer, version) {
    return ALLOWED_EXACT_PEERS.some(
        (a) => a.package === packageName && a.peer === peer && a.version === version.trim(),
    );
}

/**
 * The documented allowance for this package/peer pair, regardless of version — used to tell an
 * expired allowance (the pin moved, but ALLOWED_EXACT_PEERS was not updated to follow it) apart from
 * an ordinary, never-allowlisted violation. Undefined when no allowance names this pair.
 */
function allowanceFor(packageName, peer) {
    return ALLOWED_EXACT_PEERS.find((a) => a.package === packageName && a.peer === peer);
}

/**
 * Every exact, non-allowlisted entry in one manifest's `peerDependencies`.
 *
 * @param {{name?: string, peerDependencies?: Record<string, string>}} manifest parsed package.json
 * @param {string} relPath path reported in the violation, relative to the repo root
 */
export function findExactPeers(manifest, relPath) {
    if (manifest === null || typeof manifest !== 'object') {
        throw new TypeError(`check-peer-ranges: ${relPath} did not parse to an object`);
    }
    const peers = manifest.peerDependencies;
    if (peers === undefined) {
        return [];
    }
    const packageName = manifest.name ?? relPath;
    const found = [];
    for (const [peer, version] of Object.entries(peers)) {
        if (isExactVersion(version) && !isAllowed(packageName, peer, version)) {
            found.push({ package: packageName, peer, version: version.trim(), file: relPath });
        }
    }
    return found;
}

/**
 * The `>=` floor of an `mjVersionRange`, or null when it is not written in the shape publish.yml
 * produces.
 *
 * Null is a VIOLATION at the call site rather than a skip. The publish workflow parses this field
 * by stripping the range prefix off the `@memberjunction/core` peer and writing `>=X <Y+1.0.0`; a manifest
 * in some other shape is one nobody has checked against that, and reporting "I could not read it"
 * is the only honest answer.
 */
export function manifestFloor(mjVersionRange) {
    if (typeof mjVersionRange !== 'string') {
        return null;
    }
    // ANCHORED AT BOTH ENDS, and that is the whole difference between reading a floor and guessing
    // one. A looser pattern that merely required `>=<version>` at the start reads `5.51.0` out of
    // `Skip-Client-Open-App`'s `>=5.51.0 || ^6.1.0-edge.4 <6.0.0` — a range whose second clause is an
    // empty set and which passes today only through the unbounded first clause (more-cheese #48).
    // Reporting a confident floor for a range nobody can satisfy as written is worse than reporting
    // that it cannot be read.
    const floor = /^>=\s*(\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?)\s+<\s*\d+\.\d+\.\d+$/.exec(mjVersionRange.trim());
    return floor === null ? null : floor[1];
}

/**
 * Every `@memberjunction/*` peer in one manifest that is not exactly `^<floor>`.
 *
 * Scoped to `@memberjunction/*` deliberately. `@angular/*` peers are ranges the HOST Explorer
 * satisfies and have no manifest field to agree with; `@mj-biz-apps/*` siblings version in lock-step
 * through changesets' `fixed` group, which is a different mechanism with its own enforcement.
 */
export function findManifestFloorDrift(manifest, relPath, floor) {
    const peers = manifest?.peerDependencies ?? {};
    const packageName = manifest?.name ?? relPath;
    const expected = `^${floor}`;
    const found = [];
    for (const [peer, version] of Object.entries(peers)) {
        if (!peer.startsWith('@memberjunction/')) {
            continue;
        }
        if (version.trim() !== expected) {
            found.push({ package: packageName, peer, version: version.trim(), expected, file: relPath });
        }
    }
    return found;
}

/** Immediate subdirectory manifests of `root/dir`; [] when the directory is absent. */
function manifestsUnder(root, dir) {
    let entries;
    try {
        entries = readdirSync(join(root, dir), { withFileTypes: true });
    } catch (err) {
        if (err.code === 'ENOENT') {
            return [];
        }
        throw err;
    }
    const found = [];
    for (const entry of entries) {
        if (!entry.isDirectory()) {
            continue;
        }
        const relPath = `${dir}/${entry.name}/package.json`;
        try {
            statSync(join(root, relPath));
        } catch (err) {
            if (err.code === 'ENOENT') {
                continue;
            }
            throw err;
        }
        found.push(relPath);
    }
    return found.sort();
}

/**
 * Scan the repo. Returns violations (exact peers, and `@memberjunction/*` peers that disagree with
 * the manifest floor) and stale allowances (documented exceptions that no longer match anything on
 * disk). Both fail the gate — a dead exception reads as a considered decision long after the thing
 * it excused is gone.
 */
export function runCheck(root) {
    const violations = [];
    const seenAllowances = new Set();

    let floor = null;
    try {
        const manifest = JSON.parse(readFileSync(join(root, 'mj-app.json'), 'utf8'));
        floor = manifestFloor(manifest.mjVersionRange);
        if (floor === null) {
            violations.push(
                `mj-app.json: mjVersionRange is ${JSON.stringify(manifest.mjVersionRange)}, which is not the ` +
                    '`>=<floor> <next-major>` shape publish.yml writes. That step re-derives this field from the ' +
                    '@memberjunction/core peer on every publish, so a shape it did not produce is one nobody has ' +
                    'checked against it — and the peers below cannot be compared to a floor that cannot be read.',
            );
        } else if (/-/.test(floor)) {
            violations.push(
                `mj-app.json: mjVersionRange floor is the PRERELEASE ${floor}. MJ coerces a prerelease host to its ` +
                    'base tuple before testing a range, so a floor like this is not the constraint it looks like — ' +
                    'and the estate\'s `edge` tag (6.1.0-edge.7) is OLDER than 6.1.2, which is the version the ' +
                    'nine-app graph actually converges on. Declare a released floor.',
            );
        }
    } catch (err) {
        if (err.code !== 'ENOENT') {
            throw err;
        }
        violations.push('mj-app.json is missing — this is not the repo root, or the manifest was deleted.');
    }

    for (const dir of SCANNED_DIRS) {
        for (const relPath of manifestsUnder(root, dir)) {
            const raw = readFileSync(join(root, relPath), 'utf8');
            let manifest;
            try {
                manifest = JSON.parse(raw);
            } catch (err) {
                throw new SyntaxError(`check-peer-ranges: ${relPath} is not valid JSON — ${err.message}`);
            }
            for (const hit of findExactPeers(manifest, relPath)) {
                const expired = allowanceFor(hit.package, hit.peer);
                if (expired) {
                    // This pair has a documented exception, but at a version that no longer matches — the
                    // allowance's own reasoning is that a RANGE here would be the lie, so "write a range" is
                    // exactly the wrong advice. The pin moved and the exception was not re-argued to follow it.
                    violations.push(
                        `${hit.file}: peerDependencies["${hit.peer}"] is "${hit.version}", but ` +
                            `ALLOWED_EXACT_PEERS documents an exception for ${hit.package} -> ${hit.peer} ` +
                            `only at "${expired.version}". A range would be the lie that exception exists ` +
                            `to avoid — the documented exception has simply expired, and must be re-argued ` +
                            `in ALLOWED_EXACT_PEERS at "${hit.version}" before this can go green again.`,
                    );
                } else {
                    violations.push(
                        `${hit.file}: peerDependencies["${hit.peer}"] is the exact version "${hit.version}". ` +
                            `A peer range is a compatibility claim, and an exact one claims ${hit.package} works ` +
                            `against that single build and no other — so npm fails with ERESOLVE on every host ` +
                            `whose ${hit.peer} differs, 'mj app install' finalizes the app as Disabled, and the ` +
                            `operator is told to fix their npm auth. Write a range: "^${hit.version}".`,
                    );
                }
            }
            if (floor !== null) {
                for (const hit of findManifestFloorDrift(manifest, relPath, floor)) {
                    violations.push(
                        `${hit.file}: peerDependencies["${hit.peer}"] is "${hit.version}", but mj-app.json declares ` +
                            `mjVersionRange floor ${floor}, so it must be exactly "${hit.expected}". These are not two ` +
                            'independent facts: publish.yml RE-DERIVES mjVersionRange from the @memberjunction/core ' +
                            'peer in packages/Entities on every publish. A peer BELOW the floor means the published ' +
                            'manifest is silently rewritten downward while the committed file still reads correctly; a ' +
                            'peer ABOVE it means a host passes MJ\'s install gate and then fails npm resolution, and ' +
                            '`mj app install` leaves such an app Disabled while its output reads as success.',
                    );
                }
            }
            const peers = manifest.peerDependencies ?? {};
            for (const allowance of ALLOWED_EXACT_PEERS) {
                if (manifest.name === allowance.package && peers[allowance.peer]?.trim() === allowance.version) {
                    seenAllowances.add(allowance);
                }
            }
        }
    }

    const stale = ALLOWED_EXACT_PEERS.filter((a) => !seenAllowances.has(a)).map(
        (a) =>
            `ALLOWED_EXACT_PEERS allows ${a.package} -> ${a.peer}@${a.version}, which no longer appears in ` +
            `any manifest. Delete the entry, or correct its version if the pin moved.`,
    );

    return { violations, stale };
}

/** CLI entry point. */
function main() {
    const { violations, stale } = runCheck(REPO_ROOT);
    if (violations.length > 0 || stale.length > 0) {
        console.error('Peer-range gate FAILED:\n');
        for (const v of violations) {
            console.error(`  ✗ ${v}\n`);
        }
        for (const s of stale) {
            console.error(`  ✗ ${s}\n`);
        }
        console.error(`${violations.length} violation(s), ${stale.length} stale allowance(s).`);
        process.exit(1);
    }
    console.log(`Peer-range gate passed (${SCANNED_DIRS.join(', ')}).`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
    main();
}
