#!/usr/bin/env node
/**
 * What work does a release of this repo still have to do?
 *
 * Ported from `mj-dev/bizapps-forms`'s `scripts/release-plan.mjs`, written for that repo's own
 * #177/#187: the step it replaced asked ONE question — is the version-anchor package on npm? — and
 * hung both remaining actions off the answer. `changeset publish` publishes the unpublished set with
 * `Promise.all`, so one package landing while a sibling fails is a state it produces BY DESIGN and
 * expects a retry to finish (already-published packages are skipped, not re-published). A single
 * yes/no question reads that partial state as "done" — the retry then skips publish AND tag and
 * reports success, leaving packages unpublished and no `v<version>` tag for the next release's
 * cadence check to find.
 *
 * So this asks the two facts separately, and each gates its own step:
 *
 *   publish — is ANY publishable package missing this version from npm?
 *   tag     — is the `v<version>` tag absent?
 *
 * A run is a no-op only when both are false, which makes a retry after ANY partial failure finish
 * the job.
 *
 * It is a script rather than inline bash for the reason `sync-app-version.mjs` is: a decision that
 * only ever runs inside a release cannot be proven by running a release. Plain Node, stdlib only —
 * `changes.yml` runs no `npm ci`.
 */
import { readdirSync, readFileSync, appendFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

/**
 * The workspace packages a release actually publishes: every directory under `packages/` whose
 * manifest is not `private: true`. Derived rather than listed, so a fourth package joins the release
 * the moment it exists, with no second place to remember to edit.
 */
export function publishablePackages(rootDir = REPO_ROOT) {
    const packagesDir = join(rootDir, 'packages');
    return readdirSync(packagesDir, { withFileTypes: true })
        .filter((entry) => entry.isDirectory())
        .flatMap((entry) => {
            const dir = join(packagesDir, entry.name);
            const manifestPath = join(dir, 'package.json');
            let manifest;
            try {
                manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
            } catch (error) {
                if (error.code === 'ENOENT') {
                    return [];
                }
                throw new Error(`release-plan cannot read ${manifestPath}: ${error.message}`, { cause: error });
            }
            return manifest.private === true ? [] : [{ name: manifest.name, version: manifest.version, dir }];
        });
}

/**
 * The plan, as a pure function of facts the caller gathered — no network, no git, so the spec can
 * drive every state directly.
 *
 * `publishedVersions` maps a package name to the versions npm reports for it; a name absent from the
 * map has none. `tags` is every `v*` tag that exists.
 */
export function planRelease({ packages, publishedVersions, tags }) {
    if (!Array.isArray(packages) || packages.length === 0) {
        throw new Error('release-plan found no publishable packages — refusing to decide a release blind');
    }
    for (const pkg of packages) {
        if (!pkg?.name || !pkg?.version) {
            throw new Error(`release-plan: ${JSON.stringify(pkg)} has no name or no version`);
        }
    }

    // `fixed` in .changeset/config.json moves all three @mj-biz-apps packages together, so
    // divergent versions mean the bump did not happen as a unit — and there is no single version
    // to tag.
    const versions = [...new Set(packages.map((p) => p.version))];
    if (versions.length > 1) {
        throw new Error(
            `release-plan: packages disagree about the version (${versions.join(', ')}). ` +
                'They are one `fixed` group — run `npm run version` on the release branch.',
        );
    }

    const version = versions[0];
    const unpublished = packages
        .filter((p) => !(publishedVersions[p.name] ?? []).includes(p.version))
        .map((p) => p.name);
    const publish = unpublished.length > 0;
    const tag = !tags.includes(`v${version}`);
    return { version, unpublished, publish, tag, work: publish || tag };
}

/** Versions npm reports for `name`. Throws when the registry cannot be reached. */
function publishedVersionsFor(name) {
    let raw;
    try {
        raw = execFileSync('npm', ['view', name, 'versions', '--json'], {
            encoding: 'utf8',
            stdio: ['ignore', 'pipe', 'pipe'],
        });
    } catch (error) {
        // npm exits non-zero both for a package that has never been published and for a registry
        // it cannot reach. The two must not be conflated: reading an outage as "nothing is
        // published" would tell a retry to republish a version that is already live. E404 is the
        // only refusal that means "not there" — everything else throws.
        const stderr = String(error.stderr ?? '');
        if (/E404|404 Not Found/.test(stderr)) {
            return [];
        }
        throw new Error(
            `release-plan could not reach the npm registry to ask about ${name}: ${stderr.trim() || error.message}`,
            { cause: error },
        );
    }
    const parsed = JSON.parse(raw);
    // npm returns a bare JSON string, not an array, for a package with exactly one version.
    return Array.isArray(parsed) ? parsed : [parsed];
}

/** Every `v*` tag that exists locally. The job checks out with `fetch-tags: true`. */
function existingTags() {
    const raw = execFileSync('git', ['tag', '--list', 'v*'], { encoding: 'utf8' });
    return raw.split('\n').map((line) => line.trim()).filter(Boolean);
}

/** CLI entry point: gather the facts, print the plan, write it to `$GITHUB_OUTPUT`. */
function main() {
    const packages = publishablePackages();
    const publishedVersions = Object.fromEntries(packages.map((p) => [p.name, publishedVersionsFor(p.name)]));
    const tags = existingTags();
    const plan = planRelease({ packages, publishedVersions, tags });

    console.log(`Releasing v${plan.version}`);
    console.log(plan.publish ? `  to publish: ${plan.unpublished.join(', ')}` : '  all packages are already on npm');
    console.log(plan.tag ? `  to tag: v${plan.version}` : `  v${plan.version} is already tagged`);
    if (!plan.work) {
        console.log(`Nothing to do — v${plan.version} is fully released.`);
    }

    if (process.env.GITHUB_OUTPUT) {
        appendFileSync(
            process.env.GITHUB_OUTPUT,
            `VERSION=${plan.version}\npublish=${plan.publish}\ntag=${plan.tag}\nwork=${plan.work}\n`,
        );
    }
    if (process.env.GITHUB_STEP_SUMMARY && !plan.work) {
        appendFileSync(
            process.env.GITHUB_STEP_SUMMARY,
            `## Nothing to release — v${plan.version} is already published and tagged\n`,
        );
    }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
    main();
}
