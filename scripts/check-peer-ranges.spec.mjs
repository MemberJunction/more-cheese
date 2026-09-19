/**
 * Spec for the peer-range gate.
 *
 * Adapted from `bizapps-forms/scripts/check-peer-ranges.spec.mjs`. The `isExactVersion` cases come
 * across unchanged — they pin npm's spelling rules, which are not repo-specific. The fixture cases
 * are rewritten around THIS repo's shape (`packages/` only, no `apps/`, an empty allowlist) and a
 * new block covers rule 2, the `mj-app.json` floor agreement, which forms has no equivalent of.
 *
 * Every fixture builds a throwaway repo root in a temp directory, so no case can pass or fail
 * because of what happens to be checked in here today.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { spawnSync } from 'node:child_process';
import {
    ALLOWED_EXACT_PEERS,
    SCANNED_DIRS,
    isExactVersion,
    findExactPeers,
    manifestFloor,
    findManifestFloorDrift,
    runCheck,
} from './check-peer-ranges.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.join(HERE, '..');

/** A throwaway repo root: a manifest, plus `packages/<name>/package.json` for each entry. */
function fixture({ mjVersionRange = '>=6.1.2 <7.0.0', packages = {} } = {}) {
    const root = mkdtempSync(path.join(tmpdir(), 'peer-ranges-'));
    writeFileSync(path.join(root, 'mj-app.json'), JSON.stringify({ mjVersionRange }, null, 2));
    for (const [dir, manifest] of Object.entries(packages)) {
        mkdirSync(path.join(root, 'packages', dir), { recursive: true });
        writeFileSync(path.join(root, 'packages', dir, 'package.json'), JSON.stringify(manifest, null, 2));
    }
    return root;
}

// ── What counts as an exact version ─────────────────────────────────────────────────────────────

test('a bare version is exact', () => {
    assert.equal(isExactVersion('21.2.22'), true);
});

test('a prerelease version is exact', () => {
    assert.equal(isExactVersion('6.1.0-edge.4'), true);
});

test('a build-metadata version is exact', () => {
    assert.equal(isExactVersion('1.2.3+build.7'), true);
});

// npm treats a leading `=` as "exactly this", so it is the same hazard written differently.
test('an explicitly-equal version is exact', () => {
    assert.equal(isExactVersion('=21.2.22'), true);
});

test('surrounding whitespace does not hide an exact version', () => {
    assert.equal(isExactVersion('  21.2.22  '), true);
});

// npm normalises a leading `v` away, so `v21.2.22` is the same pin written like a git tag.
test('a v-prefixed version is exact', () => {
    assert.equal(isExactVersion('v21.2.22'), true);
});

// ── What must NOT be reported as exact ──────────────────────────────────────────────────────────

test('a caret range is not exact', () => {
    assert.equal(isExactVersion('^6.1.2'), false);
});

test('a tilde range is not exact', () => {
    assert.equal(isExactVersion('~6.1.2'), false);
});

test("this repo's Angular peer shape is not exact", () => {
    assert.equal(isExactVersion('>=21.0.0 <22.0.0'), false);
});

test('an or-range is not exact', () => {
    assert.equal(isExactVersion('^21.0.0 || ^22.0.0'), false);
});

test('a hyphen range is not exact', () => {
    assert.equal(isExactVersion('21.1.3 - 21.9.9'), false);
});

test('a wildcard is not exact', () => {
    assert.equal(isExactVersion('*'), false);
});

test('a workspace protocol is not exact', () => {
    assert.equal(isExactVersion('workspace:*'), false);
});

test('a dist-tag is not exact', () => {
    assert.equal(isExactVersion('latest'), false);
});

test('a non-string is not exact', () => {
    assert.equal(isExactVersion(undefined), false);
});

// ── findExactPeers ──────────────────────────────────────────────────────────────────────────────

test('an exact peer is reported with its package, peer and version', () => {
    const found = findExactPeers(
        { name: '@mj-biz-apps/more-cheese-ng', peerDependencies: { '@angular/cdk': '21.2.14' } },
        'packages/Angular/package.json',
    );
    assert.deepEqual(found, [
        {
            package: '@mj-biz-apps/more-cheese-ng',
            peer: '@angular/cdk',
            version: '21.2.14',
            file: 'packages/Angular/package.json',
        },
    ]);
});

test('a manifest with no peerDependencies block reports nothing', () => {
    assert.deepEqual(findExactPeers({ name: 'x' }, 'packages/x/package.json'), []);
});

// `dependencies` and `devDependencies` are deliberately out of scope: the `@angular/*` anchors in
// this repo's devDependencies are exact ON PURPOSE — they are what actually installs — and a gate
// that read those blocks would fail this repo on its first run.
test('an exact devDependency is not a peer-range violation', () => {
    const found = findExactPeers(
        { name: 'x', devDependencies: { '@angular/compiler': '21.2.22' } },
        'packages/x/package.json',
    );
    assert.deepEqual(found, []);
});

test('a manifest that does not parse to an object throws rather than passing', () => {
    assert.throws(() => findExactPeers(null, 'packages/x/package.json'), TypeError);
});

// ── manifestFloor ───────────────────────────────────────────────────────────────────────────────

test('the floor is read from the shape publish.yml writes', () => {
    assert.equal(manifestFloor('>=6.1.2 <7.0.0'), '6.1.2');
});

test('a prerelease floor is read, so the caller can refuse it by name', () => {
    assert.equal(manifestFloor('>=6.1.0-edge.4 <7.0.0'), '6.1.0-edge.4');
});

// Skip-Client-Open-App ships `>=5.51.0 || ^6.1.0-edge.4 <6.0.0`, whose second clause is an empty
// set (more-cheese #48). A shape this gate cannot read must report as unreadable, not as fine.
test('a range this gate cannot read yields null rather than a guess', () => {
    assert.equal(manifestFloor('>=5.51.0 || ^6.1.0-edge.4 <6.0.0'), null);
    assert.equal(manifestFloor('^6.1.2'), null);
    assert.equal(manifestFloor(undefined), null);
});

// ── findManifestFloorDrift ──────────────────────────────────────────────────────────────────────

test('a @memberjunction peer matching the floor exactly is clean', () => {
    const found = findManifestFloorDrift(
        { name: 'x', peerDependencies: { '@memberjunction/core': '^6.1.2' } },
        'packages/x/package.json',
        '6.1.2',
    );
    assert.deepEqual(found, []);
});

// The drift publish.yml would silently rewrite the manifest DOWN to match.
test('a @memberjunction peer below the floor is reported', () => {
    const found = findManifestFloorDrift(
        { name: 'x', peerDependencies: { '@memberjunction/core': '^6.1.0' } },
        'packages/x/package.json',
        '6.1.2',
    );
    assert.equal(found.length, 1);
    assert.equal(found[0].expected, '^6.1.2');
});

// The drift that admits a host past MJ's gate and then fails npm resolution.
test('a @memberjunction peer above the floor is reported', () => {
    const found = findManifestFloorDrift(
        { name: 'x', peerDependencies: { '@memberjunction/core': '^6.2.0' } },
        'packages/x/package.json',
        '6.1.2',
    );
    assert.equal(found.length, 1);
});

// A caret is not the only way to satisfy "compatible with 6.1.2" — but it is the only way the
// re-derivation in publish.yml is a no-op, which is what this rule is about.
test('a comparator range equivalent to the floor is still reported', () => {
    const found = findManifestFloorDrift(
        { name: 'x', peerDependencies: { '@memberjunction/core': '>=6.1.2 <7.0.0' } },
        'packages/x/package.json',
        '6.1.2',
    );
    assert.equal(found.length, 1);
});

test('non-MJ peers are outside rule 2', () => {
    const found = findManifestFloorDrift(
        {
            name: 'x',
            peerDependencies: { '@angular/core': '>=21.0.0 <22.0.0', '@mj-biz-apps/more-cheese-entities': '^1.1.0' },
        },
        'packages/x/package.json',
        '6.1.2',
    );
    assert.deepEqual(found, []);
});

// ── runCheck over a whole fixture repo ──────────────────────────────────────────────────────────

test('a repo whose peers agree with its manifest passes', () => {
    const root = fixture({
        packages: {
            Entities: { name: '@mj-biz-apps/more-cheese-entities', peerDependencies: { '@memberjunction/core': '^6.1.2' } },
            Angular: {
                name: '@mj-biz-apps/more-cheese-ng',
                peerDependencies: { '@memberjunction/core': '^6.1.2', '@angular/core': '>=21.0.0 <22.0.0' },
            },
        },
    });
    const { violations, stale } = runCheck(root);
    assert.deepEqual(violations, []);
    assert.deepEqual(stale, []);
});

test('an edge floor in the manifest fails, even when every peer agrees with it', () => {
    const root = fixture({
        mjVersionRange: '>=6.1.0-edge.4 <7.0.0',
        packages: {
            Entities: {
                name: '@mj-biz-apps/more-cheese-entities',
                peerDependencies: { '@memberjunction/core': '^6.1.0-edge.4' },
            },
        },
    });
    const { violations } = runCheck(root);
    assert.equal(violations.length, 1);
    assert.match(violations[0], /PRERELEASE/);
});

test('an unreadable mjVersionRange is a violation, not a skip', () => {
    const root = fixture({ mjVersionRange: '^6.1.2', packages: {} });
    const { violations } = runCheck(root);
    assert.equal(violations.length, 1);
    assert.match(violations[0], /publish\.yml/);
});

test('a missing mj-app.json fails rather than silently scanning nothing', () => {
    const root = mkdtempSync(path.join(tmpdir(), 'peer-ranges-'));
    const { violations } = runCheck(root);
    assert.equal(violations.length, 1);
    assert.match(violations[0], /mj-app\.json is missing/);
});

// The forms defect, in this repo's shape: an exact Angular peer that every local resolver accepts
// because the devDependency anchor satisfies it too.
test('an exact Angular peer fails even though the local anchor would satisfy it', () => {
    const root = fixture({
        packages: {
            Angular: {
                name: '@mj-biz-apps/more-cheese-ng',
                peerDependencies: { '@memberjunction/core': '^6.1.2', '@angular/core': '21.2.22' },
                devDependencies: { '@angular/compiler': '21.2.22' },
            },
        },
    });
    const { violations } = runCheck(root);
    assert.equal(violations.length, 1);
    assert.match(violations[0], /ERESOLVE/);
});

test('a package with no peerDependencies at all is fine', () => {
    const root = fixture({ packages: { Entities: { name: '@mj-biz-apps/more-cheese-entities' } } });
    assert.deepEqual(runCheck(root).violations, []);
});

// ── The allowlist mechanism, which ships empty here ─────────────────────────────────────────────

test('this repo documents no exact-peer exceptions', () => {
    assert.deepEqual(ALLOWED_EXACT_PEERS, []);
});

test('only packages/ is scanned — this repo has no apps/ tree', () => {
    assert.deepEqual([...SCANNED_DIRS], ['packages']);
});

// ── The real repo, and the CLI contract ─────────────────────────────────────────────────────────

test('the checked-in repo passes both rules', () => {
    const { violations, stale } = runCheck(REPO_ROOT);
    assert.deepEqual(violations, [], violations.join('\n'));
    assert.deepEqual(stale, []);
});

test('the CLI exits 0 on this repo', () => {
    const run = spawnSync(process.execPath, [path.join(HERE, 'check-peer-ranges.mjs')], { encoding: 'utf8' });
    assert.equal(run.status, 0, run.stderr);
});
