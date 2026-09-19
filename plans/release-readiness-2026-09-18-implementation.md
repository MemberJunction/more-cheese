# Release Readiness Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make this repo able to cut its first release correctly — nothing pushes to a protected branch, every release decision is testable outside a release, and the repo stops violating its own documented rules.

**Architecture:** Port the bizapps-forms release model (decision engine in a testable script, credentials and remote writes in the workflow) adapted to npm + a three-package fixed group. The back-merge differs deliberately: `publish.yml` opens *and merges* it unattended, because `next-protect` requires a PR but zero approvals.

**Tech Stack:** Node ≥18 stdlib only (no dependencies in any gate), npm workspaces, changesets, GitHub Actions, `actions/create-github-app-token@v2`, `gh` CLI.

**Spec:** [`plans/release-readiness-2026-09-18.md`](release-readiness-2026-09-18.md)

## Global Constraints

Copied verbatim from the spec. Every task's requirements implicitly include these.

- **Gates are plain Node, stdlib only.** "A gate that guards the release must run in CI without installing anything." `changes.yml` runs no `npm ci`; any script it calls that imports a dependency breaks CI.
- **Every gate carries its own test.** `.claude/rules/repo-gates.md` — "🚨 Every gate carries its own test." New `.mjs` gates get a `.spec.mjs` added to the `test:gates` script.
- **Nothing pushes to `main` or `next`.** Not from a workflow, not from a script. The App writes only to `release/*` and `chore/backmerge-*`.
- **The App is never a ruleset bypass.** Do not add bypass actors to `next-protect` (id 18797049). Do not change repo settings.
- **`publish.yml` must never declare an `environment:`.** npm trusted publishing is bootstrapped with the environment field blank for all three packages; adding one breaks the OIDC match. There is no `NPM_TOKEN`.
- **App credentials:** `vars.APP_CLIENT_ID` and `secrets.APP_PRIVATE_KEY`, both org-level and visible to this repo. Mint tokens **late** — installation tokens live one hour.
- **`actions/checkout` must set `persist-credentials: false`** in any job that pushes as the App. The persisted `extraheader` outranks URL credentials and the push goes as `github-actions[bot]` → 403.
- **Never use `on: paths:`** for a workflow that is or may become a required check. Filter in a job/step `if:`.
- **"Could not determine" must never read as "fine."** Unreachable npm, unresolvable refs, and `git merge-base` exit codes other than 0/1 all block.
- **Version anchor is `packages/Entities/package.json`.** All three packages are one changesets `fixed` group and carry the identical version.
- **Do not edit an applied migration. Do not touch `migrations/`, `generated/`, `config/`, or `content/` in this work.**
- **Package manager is npm** with `package-lock.json`. The source repo (bizapps-forms) is pnpm — every `pnpm` invocation must be translated, and `pnpm install --lockfile-only` becomes `npm install --package-lock-only`.
- **Commit discipline:** each task ends in exactly one commit. Do not commit anything a task did not produce.

**Reference source (read-only, never modify):** `/Users/sohamdesai/Projects/mj-dev/bizapps-forms`

---

### Task 1: `sync-app-version.mjs` — derive `mj-app.json` from the anchor

Closes B4. Smallest piece, and Task 4 depends on it.

**Files:**
- Create: `scripts/sync-app-version.mjs`
- Create: `scripts/sync-app-version.spec.mjs`
- Modify: `package.json` (add `sync:app-version` script; add spec to `test:gates`)
- Reference: `/Users/sohamdesai/Projects/mj-dev/bizapps-forms/scripts/sync-app-version.mjs` (91 lines), `.../scripts/sync-app-version.spec.mjs`

**Interfaces:**
- Produces: `computeAppVersionFields(entitiesPkg) -> { version: string, mjVersionRange: string }`, exported. `version` is `entitiesPkg.version` verbatim. `mjVersionRange` is `` `>=${min} <${nextMajor}.0.0` `` where `min` is the `@memberjunction/core` range from `peerDependencies` (falling back to `dependencies`) with any leading `^`/`~`/`>=` stripped, and `nextMajor` is `major(min) + 1`. Prerelease suffixes are **kept**: `^6.1.0-edge.6` yields `>=6.1.0-edge.6 <7.0.0`.
- Produces: CLI `node scripts/sync-app-version.mjs` (writes `mj-app.json`) and `--check` (exit 1 on drift, writes nothing).
- Consumed by: Task 4 (`release-prep.mjs` calls `--check` as a postcondition), Task 6 (`publish.yml` calls `--check`).

**Why one function serves both:** a separate checker would be a second copy of the derivation rule and would drift from it. Write and check must call the same function.

- [ ] **Step 1: Write the failing spec**

Create `scripts/sync-app-version.spec.mjs`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { computeAppVersionFields } from './sync-app-version.mjs';

test('version is copied verbatim from the anchor package', () => {
  const out = computeAppVersionFields({
    version: '1.2.0',
    peerDependencies: { '@memberjunction/core': '^6.1.2' },
  });
  assert.equal(out.version, '1.2.0');
});

test('mjVersionRange spans from the peer floor to the next major', () => {
  const out = computeAppVersionFields({
    version: '1.2.0',
    peerDependencies: { '@memberjunction/core': '^6.1.2' },
  });
  assert.equal(out.mjVersionRange, '>=6.1.2 <7.0.0');
});

test('a prerelease floor keeps its suffix', () => {
  const out = computeAppVersionFields({
    version: '1.2.0',
    peerDependencies: { '@memberjunction/core': '^6.1.0-edge.6' },
  });
  assert.equal(out.mjVersionRange, '>=6.1.0-edge.6 <7.0.0');
});

test('falls back to dependencies when core is not a peer', () => {
  const out = computeAppVersionFields({
    version: '2.0.0',
    dependencies: { '@memberjunction/core': '~7.3.1' },
  });
  assert.equal(out.mjVersionRange, '>=7.3.1 <8.0.0');
});

test('a package with no @memberjunction/core anywhere throws', () => {
  assert.throws(
    () => computeAppVersionFields({ version: '1.0.0', peerDependencies: {} }),
    /@memberjunction\/core/,
  );
});

test('an unparseable core range throws rather than guessing', () => {
  assert.throws(
    () => computeAppVersionFields({
      version: '1.0.0',
      peerDependencies: { '@memberjunction/core': 'workspace:*' },
    }),
    /workspace:\*/,
  );
});
```

- [ ] **Step 2: Run it and confirm it fails**

Run: `node --test scripts/sync-app-version.spec.mjs`
Expected: FAIL — `Cannot find module './sync-app-version.mjs'`.

- [ ] **Step 3: Implement `scripts/sync-app-version.mjs`**

Read the forms original first: `/Users/sohamdesai/Projects/mj-dev/bizapps-forms/scripts/sync-app-version.mjs`. Keep its structure. Adaptations required for this repo:

1. Anchor path is `packages/Entities/package.json` (same as forms — verify, do not assume).
2. Manifest path is `mj-app.json` at the repo root.
3. Preserve the existing key order and two-space indentation of `mj-app.json` when writing, and keep the trailing newline. A reordering diff makes the release PR unreviewable.
4. `--check` prints both the expected and actual values on failure and exits 1. Exit 0 and print nothing on success.
5. Export `computeAppVersionFields` so the spec can import it. Guard the CLI half behind an `import.meta.url === pathToFileURL(process.argv[1]).href` check so importing it runs nothing.
6. Throw — never default — on a missing or unparseable `@memberjunction/core` range.

- [ ] **Step 4: Run the spec and confirm it passes**

Run: `node --test scripts/sync-app-version.spec.mjs`
Expected: PASS, 6/6.

- [ ] **Step 5: Confirm the repo is currently in sync**

Run: `node scripts/sync-app-version.mjs --check`
Expected: exit 0. `mj-app.json` is `1.1.0` / `>=6.1.2 <7.0.0`; Entities is `1.1.0` with peer `^6.1.2`. If this fails, the derivation is wrong — fix it, do not edit `mj-app.json`.

- [ ] **Step 6: Prove `--check` actually fires**

```bash
node -e "const f='mj-app.json';const j=JSON.parse(require('fs').readFileSync(f));j.version='9.9.9';require('fs').writeFileSync(f,JSON.stringify(j,null,2)+'\n')"
node scripts/sync-app-version.mjs --check; echo "exit=$?"   # expect exit=1
git checkout mj-app.json   # ONLY this file, which this step just planted
node scripts/sync-app-version.mjs --check; echo "exit=$?"   # expect exit=0
```

Expected: 1 then 0. A checker nobody has watched fail is indistinguishable from one that returns pass unconditionally.

- [ ] **Step 7: Wire the scripts**

In `package.json`, add to `scripts`:

```json
"sync:app-version": "node scripts/sync-app-version.mjs",
```

and append `scripts/sync-app-version.spec.mjs` to the existing `test:gates` list.

- [ ] **Step 8: Run the full gate suite**

Run: `npm run test:gates`
Expected: PASS, including the new spec.

- [ ] **Step 9: Commit**

```bash
git add scripts/sync-app-version.mjs scripts/sync-app-version.spec.mjs package.json
git commit -m "Derive mj-app.json's version and MJ range from the anchor package

The sync was inline jq inside publish.yml, so it could not run or be
tested outside a release. One function now serves both the write and
--check, because a separate checker would be a second copy of the rule."
```

---

### Task 2: `check-release-pushes.mjs` — the tripwire

Closes part of B1 by making the invariant enforced rather than remembered. Written **before** the pushes are removed, so it is seen failing on the real offenders.

**Files:**
- Create: `scripts/check-release-pushes.mjs`
- Create: `scripts/check-release-pushes.spec.mjs`
- Modify: `package.json` (add `lint:release-pushes`; add spec to `test:gates`)
- Reference: `/Users/sohamdesai/Projects/mj-dev/bizapps-forms/scripts/check-release-pushes.mjs` (227 lines) and its spec (211 lines)

**Interfaces:**
- Produces: `findReleasePushes(rootDir) -> Array<{ file: string, line: number, text: string }>`, exported.
- Produces: CLI exit 1 with every offender listed when the array is non-empty; exit 0 and a one-line confirmation otherwise.
- Consumed by: Task 6 (verification that the rewrite removed every offender), Task 7 (`build.yml` step).

**Scan scope:** `.github/workflows`, `.github/scripts`, `scripts`, and `ci`. Keep `ci/` in scope even after Task 6 empties it — it is a tripwire for the directory coming back.

**Detect:** `git push` to `main`/`next` in shell (`git push origin HEAD:main`, `git push origin main`, `git push --force origin next`, …) and in `simple-git` form (`.push('origin', 'HEAD:main')`, `.push("origin", "HEAD:next")`). Tag pushes (`refs/tags/...`) are **allowed** — the rulesets are `target: branch`.

- [ ] **Step 1: Write the failing spec**

Create `scripts/check-release-pushes.spec.mjs`. Use `node:fs.mkdtempSync` under `node:os.tmpdir()` to build fixture trees; never write fixtures into the repo.

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { findReleasePushes } from './check-release-pushes.mjs';

function fixture(files) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'relpush-'));
  for (const [rel, body] of Object.entries(files)) {
    const full = path.join(dir, rel);
    fs.mkdirSync(path.dirname(full), { recursive: true });
    fs.writeFileSync(full, body);
  }
  return dir;
}

test('a clean tree reports nothing', () => {
  const dir = fixture({ 'scripts/ok.mjs': "await git.push('origin', 'refs/tags/v1.0.0');\n" });
  assert.deepEqual(findReleasePushes(dir), []);
});

test('shell push to main is caught', () => {
  const dir = fixture({ '.github/workflows/p.yml': 'run: git push origin HEAD:main\n' });
  const hits = findReleasePushes(dir);
  assert.equal(hits.length, 1);
  assert.match(hits[0].text, /HEAD:main/);
});

test('shell push to next is caught', () => {
  const dir = fixture({ '.github/workflows/p.yml': 'run: git push origin HEAD:next\n' });
  assert.equal(findReleasePushes(dir).length, 1);
});

test('simple-git push to main is caught', () => {
  const dir = fixture({ 'ci/commit_push.mjs': "await git.push('origin', 'HEAD:main');\n" });
  assert.equal(findReleasePushes(dir).length, 1);
});

test('a tag push is allowed', () => {
  const dir = fixture({ 'ci/tag.mjs': "await git.push('origin', `refs/tags/${v}`);\n" });
  assert.deepEqual(findReleasePushes(dir), []);
});

test('pushing a release branch is allowed', () => {
  const dir = fixture({ '.github/workflows/r.yml': 'run: git push app-push "HEAD:refs/heads/$BRANCH"\n' });
  assert.deepEqual(findReleasePushes(dir), []);
});

test('a branch merely named in prose is not a push', () => {
  const dir = fixture({ 'scripts/doc.mjs': "// we never push to main or next\n" });
  assert.deepEqual(findReleasePushes(dir), []);
});

test('every offender is reported, not just the first', () => {
  const dir = fixture({
    'ci/a.mjs': "await git.push('origin', 'HEAD:main');\n",
    'ci/b.mjs': "await git.push('origin', 'HEAD:next');\n",
  });
  assert.equal(findReleasePushes(dir).length, 2);
});

test('a reported hit carries a usable file and line', () => {
  const dir = fixture({ 'ci/a.mjs': "// pad\n// pad\nawait git.push('origin', 'HEAD:main');\n" });
  const [hit] = findReleasePushes(dir);
  assert.equal(hit.line, 3);
  assert.match(hit.file, /a\.mjs$/);
});
```

- [ ] **Step 2: Run it and confirm it fails**

Run: `node --test scripts/check-release-pushes.spec.mjs`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement the scanner**

Read `/Users/sohamdesai/Projects/mj-dev/bizapps-forms/scripts/check-release-pushes.mjs` and port it. Adaptations:

1. Scan roots: `.github/workflows`, `.github/scripts`, `scripts`, `ci`. Skip a root that does not exist rather than throwing.
2. Never descend into `node_modules` or `.git`.
3. Take `rootDir` as a parameter defaulting to the repo root, so the spec can point it at a fixture.
4. Skip the scanner's **own** file and its spec by absolute path — they contain the patterns as data and would report themselves.
5. Scan only text files (`.mjs`, `.js`, `.yml`, `.yaml`, `.sh`); skip anything else.
6. Exclude `refs/tags/` matches explicitly, before the branch test.

- [ ] **Step 4: Run the spec**

Run: `node --test scripts/check-release-pushes.spec.mjs`
Expected: PASS, 9/9.

- [ ] **Step 5: Watch it catch the real offenders**

Run: `node scripts/check-release-pushes.mjs; echo "exit=$?"`
Expected: **exit=1**, naming `ci/commit_push.mjs` (`HEAD:main`), `ci/merge_main_and_update_lock.mjs` (`HEAD:next`), and `ci/merge_main.mjs` (`HEAD:next`).

This failure is correct and expected — Task 6 removes the offenders. Record the exact output in the commit message; it is the evidence that the gate fires on real code and not only on fixtures.

- [ ] **Step 6: Wire the script**

Add to `package.json` scripts:

```json
"lint:release-pushes": "node scripts/check-release-pushes.mjs",
```

and append `scripts/check-release-pushes.spec.mjs` to `test:gates`.

**Do not** add `lint:release-pushes` to any workflow yet — it fails until Task 6, and a knowingly-red CI step is worse than no step. Task 7 wires it.

- [ ] **Step 7: Confirm `test:gates` passes**

Run: `npm run test:gates`
Expected: PASS. (The spec passes; the gate itself is not run by `test:gates`.)

- [ ] **Step 8: Commit**

```bash
git add scripts/check-release-pushes.mjs scripts/check-release-pushes.spec.mjs package.json
git commit -m "Tripwire: nothing in this repo may push to main or next

Currently red, and correctly so - it names the three ci/ scripts that
still push to protected branches. Wired into CI once those are gone.
Tag pushes stay allowed; both rulesets target branches only."
```

---

### Task 3: `release-plan.mjs` — publish and tag as independent questions

**Files:**
- Create: `scripts/release-plan.mjs`
- Create: `scripts/release-plan.spec.mjs`
- Modify: `package.json` (add spec to `test:gates`)
- Reference: `/Users/sohamdesai/Projects/mj-dev/bizapps-forms/scripts/release-plan.mjs` (147 lines) and its spec (116 lines)

**Interfaces:**
- Consumes: nothing from earlier tasks.
- Produces: `publishablePackages(rootDir) -> Array<{ name, version, dir }>` — every directory under `packages/` whose `package.json` is not `private: true`. **Derived, never a hardcoded list.**
- Produces: `planRelease({ packages, publishedVersions, tags }) -> { version, publish: boolean, tag: boolean, work: boolean }`. Throws if the packages disagree about their version (they are one `fixed` group).
- Produces: CLI writing `VERSION`, `publish`, `tag`, `work` to `$GITHUB_OUTPUT`.
- Consumed by: Task 6 (`publish.yml`).

**Why two questions:** asking "is there work?" as one question makes a re-run after a partial publish report a green no-op. `changeset publish` publishes concurrently and expects a retry; a retry must be able to finish the job.

- [ ] **Step 1: Write the failing spec**

Create `scripts/release-plan.spec.mjs`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { planRelease } from './release-plan.mjs';

const pkgs = (v) => [
  { name: '@mj-biz-apps/more-cheese-entities', version: v },
  { name: '@mj-biz-apps/more-cheese-server', version: v },
  { name: '@mj-biz-apps/more-cheese-ng', version: v },
];

test('nothing published and no tag: publish and tag are both work', () => {
  const p = planRelease({ packages: pkgs('1.2.0'), publishedVersions: {}, tags: [] });
  assert.deepEqual(
    { version: p.version, publish: p.publish, tag: p.tag, work: p.work },
    { version: '1.2.0', publish: true, tag: true, work: true },
  );
});

test('fully published and tagged: nothing to do', () => {
  const published = {
    '@mj-biz-apps/more-cheese-entities': ['1.2.0'],
    '@mj-biz-apps/more-cheese-server': ['1.2.0'],
    '@mj-biz-apps/more-cheese-ng': ['1.2.0'],
  };
  const p = planRelease({ packages: pkgs('1.2.0'), publishedVersions: published, tags: ['v1.2.0'] });
  assert.equal(p.publish, false);
  assert.equal(p.tag, false);
  assert.equal(p.work, false);
});

test('a partial publish still asks to publish', () => {
  const published = {
    '@mj-biz-apps/more-cheese-entities': ['1.2.0'],
    '@mj-biz-apps/more-cheese-server': [],
    '@mj-biz-apps/more-cheese-ng': ['1.2.0'],
  };
  const p = planRelease({ packages: pkgs('1.2.0'), publishedVersions: published, tags: ['v1.2.0'] });
  assert.equal(p.publish, true, 'the missing package must still be published');
  assert.equal(p.tag, false, 'the tag already exists');
  assert.equal(p.work, true);
});

test('published but untagged still asks to tag', () => {
  const published = {
    '@mj-biz-apps/more-cheese-entities': ['1.2.0'],
    '@mj-biz-apps/more-cheese-server': ['1.2.0'],
    '@mj-biz-apps/more-cheese-ng': ['1.2.0'],
  };
  const p = planRelease({ packages: pkgs('1.2.0'), publishedVersions: published, tags: [] });
  assert.equal(p.publish, false);
  assert.equal(p.tag, true);
  assert.equal(p.work, true);
});

test('packages disagreeing about the version throws', () => {
  const bad = [
    { name: '@mj-biz-apps/more-cheese-entities', version: '1.2.0' },
    { name: '@mj-biz-apps/more-cheese-server', version: '1.1.0' },
  ];
  assert.throws(
    () => planRelease({ packages: bad, publishedVersions: {}, tags: [] }),
    /version/i,
  );
});

test('an empty package set throws rather than reporting nothing to do', () => {
  assert.throws(() => planRelease({ packages: [], publishedVersions: {}, tags: [] }));
});
```

- [ ] **Step 2: Run it and confirm it fails**

Run: `node --test scripts/release-plan.spec.mjs`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement**

Port `/Users/sohamdesai/Projects/mj-dev/bizapps-forms/scripts/release-plan.mjs`. Adaptations:

1. `publishablePackages` reads `packages/*/package.json` and filters `private !== true`. Here that is all three.
2. npm queries run via `npm view <pkg> versions --json`. **`E404` is the only non-zero exit that means "not published."** Any other failure throws — a registry outage must not read as "nothing is published."
3. Tags come from `git tag --list 'v*'`.
4. Keep `planRelease` pure: it takes `packages`, `publishedVersions` and `tags` as arguments so the spec drives it without network or git.
5. Guard the CLI half behind the `import.meta.url` check.

- [ ] **Step 4: Run the spec**

Run: `node --test scripts/release-plan.spec.mjs`
Expected: PASS, 6/6.

- [ ] **Step 5: Run the CLI against the real repo**

```bash
GITHUB_OUTPUT=/tmp/rp.txt node scripts/release-plan.mjs; echo "exit=$?"; cat /tmp/rp.txt
```

Expected: exit 0. Packages are at `1.1.0`, nothing is published, no `v*` tag → `publish=true`, `tag=true`, `work=true`, `VERSION=1.1.0`. (`1.1.0` not `1.2.0` is correct here: this script reports what is *in the tree*, not what changesets would compute. Task 4 owns the prediction.)

- [ ] **Step 6: Wire the spec and run the suite**

Append `scripts/release-plan.spec.mjs` to `test:gates`, then run `npm run test:gates`.
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add scripts/release-plan.mjs scripts/release-plan.spec.mjs package.json
git commit -m "Ask publish and tag separately so a retry can finish the job

changeset publish works concurrently and expects a retry. Folding both
into one question makes a re-run after a partial publish report a green
no-op. E404 is the only npm exit that means 'not published'."
```

---

### Task 4: `release-prep.mjs` — the decision engine

Closes B2 and B3. The largest task.

**Files:**
- Create: `scripts/release-prep.mjs`
- Create: `scripts/release-prep.spec.mjs`
- Modify: `package.json` (add `release:plan`; add spec to `test:gates`)
- Reference: `/Users/sohamdesai/Projects/mj-dev/bizapps-forms/scripts/release-prep.mjs` (727 lines) and its spec (344 lines)

**Interfaces:**
- Consumes: `computeAppVersionFields` / the `--check` CLI from Task 1.
- Consumes: `.github/scripts/determine-next-version.mjs` — **call it, do not reimplement its rule.** It exports `bumps()` and `planNextVersion()` and already self-tests.
- Produces: `assessRelease(env) -> { ready: boolean, version: string|null, branch: string|null, blockers: string[], seedOwed: boolean }`. **Collects every blocker** rather than returning the first.
- Produces: `checkPostconditions(before, after) -> string[]` (empty when satisfied).
- Produces: CLI `--plan` (pure read, **always exits 0**, writes `ready`/`version`/`branch` to `$GITHUB_OUTPUT`) and `--apply` (mutates the working tree only).
- Consumed by: Task 5 (`release-prep.yml`).

**The split that matters:** this script performs **no push, no GitHub API call, and no network write**. It mutates the working tree and stops. The workflow owns every credential and remote write. That is what makes the release decision testable without cutting a release.

**Blockers `assessRelease` collects:**

1. working tree not clean — `git add -A` would sweep unrelated work into the release commit
2. zero changesets, **or** a changeset whose frontmatter declares no bump level
3. any release gate non-zero. Gates: `check:release-seed`, `check:seed-cadence`, `lint:migrations`, `lint:distribution`. Read the command bodies **out of `package.json` at runtime** so they cannot drift. A gate that produced **no exit code throws** — "a gate that did not run must not be read as a gate that passed."
4. `v<version>` is already a git tag
5. npm unreachable **or** `v<version>` already published for any package
6. `main ⊄ next` — the previous release's back-merge never landed. `git merge-base --is-ancestor` exit 0 → ok, 1 → blocked, anything else → **throw**.

**`--apply` sequence:** `npm run version` → `npm install --package-lock-only` → `node scripts/sync-app-version.mjs --check` → `checkPostconditions` → `git add -A` → `git commit -m "Release v<version>"`. It creates no branch and pushes nothing. **Postconditions run before the commit** so a failure leaves the bump inspectable in the working tree.

**Postconditions:** the publishable package set is unchanged across the bump; all three packages are at one identical version; `changeset version`'s output **equals the predicted version**; `sync-app-version --check` exits 0; **zero changeset files survive the bump**.

- [ ] **Step 1: Write the failing spec**

Create `scripts/release-prep.spec.mjs`. Every test drives `assessRelease`/`checkPostconditions` through injected state — no network, no git, no `npm run`.

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { assessRelease, checkPostconditions, maxBumpLevel } from './release-prep.mjs';

const clean = {
  treeClean: true,
  changesets: [{ file: 'a.md', level: 'minor' }],
  gateResults: { 'check:release-seed': 0, 'check:seed-cadence': 0, 'lint:migrations': 0, 'lint:distribution': 0 },
  currentVersion: '1.1.0',
  predictedVersion: '1.2.0',
  tags: [],
  publishedVersions: {},
  mainReachedNext: true,
};

test('a clean state is ready', () => {
  const r = assessRelease(clean);
  assert.equal(r.ready, true);
  assert.deepEqual(r.blockers, []);
  assert.equal(r.version, '1.2.0');
  assert.equal(r.branch, 'release/v1.2.0');
});

test('a dirty tree blocks', () => {
  const r = assessRelease({ ...clean, treeClean: false });
  assert.equal(r.ready, false);
  assert.equal(r.blockers.length, 1);
  assert.match(r.blockers[0], /clean/i);
});

test('no changesets blocks', () => {
  const r = assessRelease({ ...clean, changesets: [] });
  assert.equal(r.ready, false);
  assert.match(r.blockers.join(' '), /changeset/i);
});

test('a changeset with no bump level blocks', () => {
  const r = assessRelease({ ...clean, changesets: [{ file: 'a.md', level: null }] });
  assert.equal(r.ready, false);
  assert.match(r.blockers.join(' '), /bump level/i);
});

test('a red gate blocks and names the gate', () => {
  const r = assessRelease({ ...clean, gateResults: { ...clean.gateResults, 'lint:distribution': 1 } });
  assert.equal(r.ready, false);
  assert.match(r.blockers.join(' '), /lint:distribution/);
});

test('a gate with no exit code throws', () => {
  assert.throws(
    () => assessRelease({ ...clean, gateResults: { ...clean.gateResults, 'lint:migrations': null } }),
    /did not run/i,
  );
});

test('an existing tag blocks', () => {
  const r = assessRelease({ ...clean, tags: ['v1.2.0'] });
  assert.equal(r.ready, false);
  assert.match(r.blockers.join(' '), /tag/i);
});

test('a version already on npm blocks', () => {
  const r = assessRelease({
    ...clean,
    publishedVersions: { '@mj-biz-apps/more-cheese-entities': ['1.2.0'] },
  });
  assert.equal(r.ready, false);
  assert.match(r.blockers.join(' '), /npm/i);
});

test('an unreachable npm registry blocks rather than being assumed free', () => {
  const r = assessRelease({ ...clean, publishedVersions: null });
  assert.equal(r.ready, false);
  assert.match(r.blockers.join(' '), /npm|registry|unreachable/i);
});

test('main not reaching next blocks and names the back-merge', () => {
  const r = assessRelease({ ...clean, mainReachedNext: false });
  assert.equal(r.ready, false);
  assert.match(r.blockers.join(' '), /back-merge|main/i);
});

test('an unknown main/next relationship blocks, it does not pass', () => {
  const r = assessRelease({ ...clean, mainReachedNext: null });
  assert.equal(r.ready, false);
});

test('every blocker is collected, not just the first', () => {
  const r = assessRelease({ ...clean, treeClean: false, changesets: [], tags: ['v1.2.0'] });
  assert.ok(r.blockers.length >= 3, `expected 3+ blockers, got ${r.blockers.length}`);
});

test('maxBumpLevel ranks major over minor over patch', () => {
  assert.equal(maxBumpLevel([{ level: 'patch' }, { level: 'minor' }]), 'minor');
  assert.equal(maxBumpLevel([{ level: 'minor' }, { level: 'major' }]), 'major');
  assert.equal(maxBumpLevel([{ level: 'patch' }]), 'patch');
});

test('postconditions pass on a correct bump', () => {
  const issues = checkPostconditions(
    { packages: ['a', 'b', 'c'], changesetCount: 7 },
    { packages: ['a', 'b', 'c'], versions: ['1.2.0', '1.2.0', '1.2.0'], changesetCount: 0, predicted: '1.2.0', appVersionInSync: true },
  );
  assert.deepEqual(issues, []);
});

test('a surviving changeset file fails postconditions', () => {
  const issues = checkPostconditions(
    { packages: ['a'], changesetCount: 7 },
    { packages: ['a'], versions: ['1.2.0'], changesetCount: 1, predicted: '1.2.0', appVersionInSync: true },
  );
  assert.match(issues.join(' '), /changeset/i);
});

test('packages left at different versions fails postconditions', () => {
  const issues = checkPostconditions(
    { packages: ['a', 'b'], changesetCount: 1 },
    { packages: ['a', 'b'], versions: ['1.2.0', '1.1.0'], changesetCount: 0, predicted: '1.2.0', appVersionInSync: true },
  );
  assert.match(issues.join(' '), /version/i);
});

test('a produced version differing from the prediction fails postconditions', () => {
  const issues = checkPostconditions(
    { packages: ['a'], changesetCount: 1 },
    { packages: ['a'], versions: ['1.3.0'], changesetCount: 0, predicted: '1.2.0', appVersionInSync: true },
  );
  assert.match(issues.join(' '), /predict|expect/i);
});

test('a drifted mj-app.json fails postconditions', () => {
  const issues = checkPostconditions(
    { packages: ['a'], changesetCount: 1 },
    { packages: ['a'], versions: ['1.2.0'], changesetCount: 0, predicted: '1.2.0', appVersionInSync: false },
  );
  assert.match(issues.join(' '), /mj-app/i);
});

test('the package set changing across the bump fails postconditions', () => {
  const issues = checkPostconditions(
    { packages: ['a', 'b', 'c'], changesetCount: 1 },
    { packages: ['a', 'b'], versions: ['1.2.0', '1.2.0'], changesetCount: 0, predicted: '1.2.0', appVersionInSync: true },
  );
  assert.match(issues.join(' '), /package/i);
});
```

- [ ] **Step 2: Run it and confirm it fails**

Run: `node --test scripts/release-prep.spec.mjs`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement**

Read `/Users/sohamdesai/Projects/mj-dev/bizapps-forms/scripts/release-prep.mjs` in full and port it. Adaptations:

1. `pnpm run version` → `npm run version`; `pnpm install --lockfile-only` → `npm install --package-lock-only`.
2. Gate list is this repo's four: `check:release-seed`, `check:seed-cadence`, `lint:migrations`, `lint:distribution`. Read their command bodies from `package.json` at runtime.
3. Version prediction delegates to `.github/scripts/determine-next-version.mjs`. Import `planNextVersion`/`bumps` from it rather than recomputing. Its rule already handles "never released" correctly, which matters here — this repo has no `v*` tag.
4. `mj-app.json` sync is Task 1's `--check`, invoked as a child process.
5. Branch name is `release/v<version>`.
6. `assessRelease` takes an injected state object so the spec drives it. Gather the real state in a separate `gatherState()` that does the git/npm/exec work, and have the CLI call `gatherState()` then `assessRelease()`.
7. **An unparseable changeset frontmatter line throws** rather than being skipped — a typo'd level silently under-bumping the published version is the one mistake no downstream gate can see.
8. `--plan` always exits 0, even when blocked. Blocked-ness is reported in `ready`, not the exit code, so the workflow can read it.
9. `seedOwed` is surfaced separately from `check:seed-cadence`, because its fix is release work rather than a code change.
10. Guard the CLI behind the `import.meta.url` check.

- [ ] **Step 4: Run the spec**

Run: `node --test scripts/release-prep.spec.mjs`
Expected: PASS, 19/19.

- [ ] **Step 5: Run `--plan` against the real repo**

Run: `node scripts/release-prep.mjs --plan; echo "exit=$?"`
Expected: **exit 0** (always), reporting current version `1.1.0`, 7 changesets, next version `1.2.0`, all four gates green, and `ready: true`. If a blocker appears, read it — it is probably real.

- [ ] **Step 6: Prove `--plan` writes nothing**

```bash
node scripts/release-prep.mjs --plan >/dev/null
git status --porcelain
```

Expected: **empty output**. A "read-only" command that dirties the tree is a defect.

- [ ] **Step 7: Prove the dirty-tree blocker fires**

```bash
echo "scratch" > /tmp/planted && cp /tmp/planted ./planted-scratch.txt
node scripts/release-prep.mjs --plan | grep -i clean    # expect a blocker line
rm ./planted-scratch.txt
node scripts/release-prep.mjs --plan | grep -ci clean   # expect 0
```

- [ ] **Step 8: Wire the script**

Add to `package.json` scripts:

```json
"release:plan": "node scripts/release-prep.mjs --plan",
```

and append `scripts/release-prep.spec.mjs` to `test:gates`.

- [ ] **Step 9: Run the suite**

Run: `npm run test:gates && npm run release:plan`
Expected: both PASS, `release:plan` reporting ready with version `1.2.0`.

- [ ] **Step 10: Commit**

```bash
git add scripts/release-prep.mjs scripts/release-prep.spec.mjs package.json
git commit -m "Move the release decision out of workflow bash into a tested script

The version logic lived as inline jq in publish.yml, so the only way to
exercise it was to cut a real release - which is how six red runs
produced no diagnosis. assessRelease collects every blocker at once; a
gate that did not run throws rather than reading as a gate that passed.

Prediction still comes from determine-next-version.mjs; this calls it
rather than reimplementing the rule."
```

---

### Task 5: The release-prep and token-verification workflows

**Files:**
- Create: `.github/workflows/release-prep.yml`
- Create: `.github/workflows/verify-release-app-token.yml`
- Reference: `/Users/sohamdesai/Projects/mj-dev/bizapps-forms/.github/workflows/release-prep.yml` (354 lines), `.../verify-release-app-token.yml` (142 lines)

**Interfaces:**
- Consumes: `release:plan` / `--apply` from Task 4.
- Produces: a dispatchable **"Prepare a release"** that cuts `release/vX.Y.Z` and opens the PR into `main`.
- Produces: a dispatchable read-only **"Verify the release App token"**.

**`release-prep.yml` step order** (the ordering is load-bearing):

1. `actions/checkout@v4` — **`ref: next` pinned** (never the dispatch ref), `fetch-depth: 0`, `fetch-tags: true`, **`persist-credentials: false`**.
2. `actions/setup-node@v4` node 24, `cache: npm`.
3. `npm ci`.
4. `node scripts/release-prep.mjs --plan` (id `plan`; outputs `ready`, `version`, `branch`).
5. Inventory the changesets this release consumes — **counted before `--apply`**, because the bump consumes them. Use `find .changeset -name '*.md' -not -name 'README.md'`, the identical expression `publish.yml` uses.
6. **`dry_run` stops here**, writing a summary table.
7. Refuse to cut a release that is not ready: fail if `ready != 'true'`, or `version`/`branch` empty, or `git ls-remote --heads origin refs/heads/$BRANCH` is non-empty. **Capture `ls-remote` by assignment, not inline, and do not use `--exit-code`** — an unreachable remote must not read as "branch absent."
8. Configure git identity as `github-actions[bot]`.
9. `git switch -c "$BRANCH"` then `node scripts/release-prep.mjs --apply`.
10. Compose the PR body: the version, the consolidated `Metadata_Sync` seed, the CHANGELOGs, and "Merge with a **merge commit**."
11. **Mint the App token** — `actions/create-github-app-token@v2`, `app-id: ${{ vars.APP_CLIENT_ID }}`, `private-key: ${{ secrets.APP_PRIVATE_KEY }}`, `permission-contents: write`, `permission-pull-requests: write`. **Minted late on purpose** — installation tokens live one hour.
12. Add a **separate remote `app-push`** carrying the token (never re-point `origin`), `git push app-push "HEAD:refs/heads/$BRANCH"`, then `gh pr create --base main --head "$BRANCH" --title "Release v$VERSION" --body-file …`.
13. Summary.

Top-level: `on: workflow_dispatch` with a boolean `dry_run` input; `permissions: contents: read`; `concurrency: { group: release-prep, cancel-in-progress: false }`; `timeout-minutes: 30`.

- [ ] **Step 1: Write `release-prep.yml`**

Port the forms file with the step order above. Adaptations: drop `pnpm/action-setup`, use `npm ci`; node 24 with `cache: 'npm'` and `cache-dependency-path: 'package-lock.json'`; keep every SHA-pin and `persist-credentials: false` exactly as forms has them.

- [ ] **Step 2: Write `verify-release-app-token.yml`**

Port it. It must: declare `permissions: {}`; mint a token scoped to this repo with `permission-contents: write` + `permission-pull-requests: write`; assert the app slug; and read `repos/$GITHUB_REPOSITORY`. Change the expected slug only if forms' value does not apply — check what forms asserts and keep it unless it is demonstrably wrong for this repo.

- [ ] **Step 3: Validate both files parse as YAML**

```bash
node -e "
const fs=require('fs');
for (const f of ['.github/workflows/release-prep.yml','.github/workflows/verify-release-app-token.yml']) {
  const t=fs.readFileSync(f,'utf8');
  if(!/^on:/m.test(t)) throw new Error(f+': no on: trigger');
  if(/\t/.test(t)) throw new Error(f+': tab character in YAML');
  console.log(f,'ok',t.split('\n').length,'lines');
}"
```

Then, if `actionlint` is available (`command -v actionlint`), run it on both. If it is not installed, skip it and say so — do not install anything.

- [ ] **Step 4: Assert the invariants the spec requires**

```bash
grep -n "persist-credentials" .github/workflows/release-prep.yml   # expect: false
grep -n "ref: next"           .github/workflows/release-prep.yml   # expect present
grep -n "environment:"        .github/workflows/release-prep.yml   # expect NO match
grep -n "app-push"            .github/workflows/release-prep.yml   # expect present
grep -c "HEAD:main\|HEAD:next" .github/workflows/release-prep.yml  # expect 0
```

- [ ] **Step 5: Confirm the tripwire stays quiet on the new files**

Run: `node scripts/check-release-pushes.mjs`
Expected: still exit 1, but naming **only** the three `ci/` scripts. If either new workflow appears, it pushes to a protected branch — fix the workflow.

- [ ] **Step 6: Commit**

```bash
git add .github/workflows/release-prep.yml .github/workflows/verify-release-app-token.yml
git commit -m "Add the Prepare-a-release dispatch and a token probe

The script decides and touches only the working tree; this workflow owns
every credential and every remote write. The token is minted late
because installation tokens live one hour, and pushed through a separate
app-push remote rather than by re-pointing origin - checkout's persisted
extraheader outranks URL credentials and the push would go as
github-actions[bot]."
```

---

### Task 6: Rewrite `publish.yml`, delete the protected-branch pushes

Closes B1. **The highest-risk task in the plan** — this is the file that publishes to npm.

**Files:**
- Modify: `.github/workflows/publish.yml`
- Delete: `ci/commit_push.mjs`, `ci/merge_main.mjs`, `ci/merge_main_and_update_lock.mjs`
- Modify: `package.json` (remove `commitpush`, `mergemain`, `mergemain:update-lock`)
- Reference: `/Users/sohamdesai/Projects/mj-dev/bizapps-forms/.github/workflows/publish.yml` (435 lines)

**Interfaces:**
- Consumes: `release-plan.mjs` (Task 3), `sync-app-version.mjs --check` (Task 1).
- Produces: a `publish.yml` that computes no version, writes to no protected branch, and leaves `next` up to date unattended.

**What is removed and why:** `publish.yml` currently computes the version inline (steps 9–12) — that moved to Task 4, and it now arrives already committed on the release branch. The three `ci/` scripts push to `main` and `next`; both are gone.

**New step order:**

1. `actions/checkout@v4` — `fetch-depth: 0`, `fetch-tags: true`, `token: ${{ secrets.GITHUB_TOKEN }}`. **Credentials persist here**, deliberately, because this job pushes the tag through `origin`.
2. `actions/setup-node@v4` node 24, `cache: npm`.
3. `./.github/scripts/validate-package-lock-case.sh`
4. `./.github/scripts/validate-migration-filenames.sh`
5. `npm ci`
6. `./.github/scripts/validate-npm-packages.sh` — `if: github.ref == 'refs/heads/main'`
7. `./.github/scripts/validate-package-repository.sh`
8. `./.github/scripts/validate-package-files.sh` — **added by Task 7; if Task 7 has not run yet, add this step there instead of here.**
9. Configure git identity as `github-actions[bot]`.
10. **"The bump has to have happened before this branch was merged"** — fail if any `.changeset/*.md` other than `README.md` survives: it means step 1 of the release never ran.
11. **"What is there to release?"** → `node scripts/release-plan.mjs` (id `release_check`; outputs `VERSION`, `publish`, `tag`, `work`).
12. **"mj-app.json agrees with the packages being published"** (`if: work`) → `node scripts/sync-app-version.mjs --check`.
13. **"Enforce schema-change version policy"** (`if: work`, **no ref condition**) — if `migrations/` changed since the last `v*` tag and the bump is only a patch, fail: "A schema change must ship as at least a minor."
14. **Release readiness — coverage** (`if: work`): `node --test scripts/check-release-seed-coverage.spec.mjs` then `npm run check:release-seed`.
15. **Release readiness — cadence** (`if: work`): `node --test scripts/check-release-seed-cadence.spec.mjs` then `npm run check:seed-cadence`. Separate step and separate script: cadence needs git tags, coverage is pure filesystem.
16. `npm run build:packages`
17. **`Publish to npm`** (`if: publish == 'true'`) → `npx changeset publish`
18. **`Tag the release`** (`if: tag == 'true'`, **not** `publish`) → `git tag "v$VERSION"` and `git push origin "refs/tags/v$VERSION"`. Tags sit outside the ruleset (`target: branch`), so this is the one allowed remote write through `origin`.
19. **`Is there anything to back-merge?`** — fetch `origin/main` and `origin/next`, then `git merge-base --is-ancestor main next`. Exit 0 → nothing outstanding; 1 → outstanding; **anything else → hard error.** Not gated on `work`, so a re-run can finish an unopened back-merge.
20. **Mint the App token** (late) — `permission-contents: write`, `permission-pull-requests: write`.
21. **`Open and merge the back-merge`** — this is where this repo deliberately departs from forms:
    - branch `chore/backmerge-v${VERSION}` (version-stamped, never timestamped)
    - push `$MAIN_SHA:refs/heads/$BRANCH` through the `app-push` remote
    - **refuse to force-push** if the branch already exists at a different SHA — someone may have resolved conflicts there
    - `gh pr create --base next --head "$BRANCH" --title "chore: back-merge main into next after v$VERSION"`
    - **then immediately `gh pr merge --merge` that PR.** `next-protect` requires a pull request but zero approvals, so this satisfies the ruleset without the App becoming a bypass actor.
    - **If the merge is refused, fail the step and name the open PR.** `require_extra_approval_for_unattributed_changes` is `true` on this repo and may block an App-authored merge. A back-merge that did not happen must never read as one that did.
22. Summary (`if: always()`).

- [ ] **Step 1: Rewrite `publish.yml`**

Apply the step order above. Keep `permissions: { contents: write, id-token: write }`, `concurrency: { group: publish, cancel-in-progress: false }`, `timeout-minutes: 30`, and `on: { push: { branches: [main] }, workflow_dispatch: }`.

**Remove the `targetVersion` dispatch input** — the version arrives already committed, so there is nothing to override.

**Do not add an `environment:` key.** npm trusted publishing is bootstrapped with the environment field blank for all three packages.

- [ ] **Step 2: Delete the push scripts and their npm entries**

```bash
git rm ci/commit_push.mjs ci/merge_main.mjs ci/merge_main_and_update_lock.mjs
```

Remove `commitpush`, `mergemain`, and `mergemain:update-lock` from `package.json` scripts. If `ci/` is now empty, let `git rm` remove the directory.

Check whether `simple-git` is still used anywhere:

```bash
grep -rn "simple-git" --include=*.mjs --include=*.js --include=*.json . \
  | grep -v node_modules | grep -v package-lock.json
```

If nothing outside `package.json` references it, remove it from `devDependencies` too and note that in the commit.

- [ ] **Step 3: The tripwire must now be green**

Run: `node scripts/check-release-pushes.mjs; echo "exit=$?"`
Expected: **exit=0.** This is the moment Task 2's gate turns green. If it still reports anything, a push to a protected branch survives — find it.

- [ ] **Step 4: Assert the invariants**

```bash
grep -n "environment:"   .github/workflows/publish.yml   # expect NO match
grep -n "targetVersion"  .github/workflows/publish.yml   # expect NO match
grep -c "HEAD:main\|HEAD:next" .github/workflows/publish.yml  # expect 0
grep -n "refs/tags"      .github/workflows/publish.yml   # expect the tag push
grep -n "gh pr merge"    .github/workflows/publish.yml   # expect the back-merge
grep -n "app-push"       .github/workflows/publish.yml   # expect present
grep -rn "commitpush\|mergemain" package.json .github/ ci/ 2>/dev/null  # expect nothing
```

- [ ] **Step 5: Validate the YAML**

```bash
node -e "
const t=require('fs').readFileSync('.github/workflows/publish.yml','utf8');
if(/\t/.test(t)) throw new Error('tab in YAML');
if(!/^on:/m.test(t)) throw new Error('no on: trigger');
console.log('ok',t.split('\n').length,'lines');"
```

Run `actionlint .github/workflows/publish.yml` if it is installed; skip and say so if not.

- [ ] **Step 6: Run the full gate suite**

Run: `npm run test:gates && npm run release:plan`
Expected: both PASS.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "Stop pushing to protected branches; back-merge as a self-merged PR

publish.yml's last step pushed to next, which next-protect forbids (PR
required, no bypass actors). It ran after changeset publish and after
the tag push, so the first release to get that far would have published
to npm, tagged, then gone red with next never updated.

It now opens chore/backmerge-vX.Y.Z as the App and merges it in the same
run: next-protect requires a pull request but zero approvals, so nobody
clicks anything and the App never becomes a bypass actor. A refused
merge fails the step and names the PR rather than going green.

The version bump moved to release-prep.mjs and arrives already
committed, so publish.yml computes no version and the targetVersion
input is gone."
```

---

### Task 7: `validate-package-files.sh`, and stop filtering `build.yml` by path

Closes V4 and V5.

**Files:**
- Create: `.github/scripts/validate-package-files.sh`
- Modify: `.github/workflows/build.yml`
- Modify: `.github/workflows/publish.yml` (add the `validate-package-files.sh` step at position 8, if Task 6 did not)
- Reference: `/Users/sohamdesai/Projects/mj-dev/bizapps-common/.github/scripts/validate-package-files.sh`

**Interfaces:**
- Produces: `.github/scripts/validate-package-files.sh` — exit 1 if any non-private package under `packages/` lacks `files` or `publishConfig.access: "public"`.

**Why:** npm includes *everything* not excluded when a package declares neither a `files` field nor an `.npmignore`. All three packages currently carry both fields correctly; nothing holds them there.

- [ ] **Step 1: Write the script**

Port the bizapps-common original. It must: iterate `packages/*/package.json`; skip `private: true`; require `files` to be a non-empty array and `publishConfig.access` to equal `"public"`; report **every** offender rather than the first; exit 1 if any. Use `node -e` for JSON parsing — do not depend on `jq` being present.

- [ ] **Step 2: Make it executable and run it**

```bash
chmod +x .github/scripts/validate-package-files.sh
./.github/scripts/validate-package-files.sh; echo "exit=$?"
```

Expected: **exit=0** — all three packages already have both fields.

- [ ] **Step 3: Prove it fires**

```bash
node -e "const f='packages/Server/package.json';const fs=require('fs');const j=JSON.parse(fs.readFileSync(f));delete j.files;fs.writeFileSync(f,JSON.stringify(j,null,2)+'\n')"
./.github/scripts/validate-package-files.sh; echo "exit=$?"   # expect 1, naming Server
git checkout packages/Server/package.json                     # ONLY the file just planted
./.github/scripts/validate-package-files.sh; echo "exit=$?"   # expect 0
```

- [ ] **Step 4: Remove `on: paths:` from `build.yml`**

Replace the `on:` block:

```yaml
on:
  workflow_dispatch:
  push:
    branches: [next]
  pull_request:
    branches: [next, main]
```

A required check filtered by `on: paths:` creates **no check run** and hangs the PR on "Expected". A job or step skipped by `if:` reports `skipped`, which counts as passing. Note `main` is added to the PR branches so the release PR gets a build.

- [ ] **Step 5: Add the two new steps to `build.yml`**

After the existing `npm ci`, add:

```yaml
      - name: Nothing may push to main or next
        run: npm run lint:release-pushes

      - name: Every publishable package declares files and publishConfig
        run: ./.github/scripts/validate-package-files.sh
```

`lint:release-pushes` is green as of Task 6, so this is the correct moment to wire it.

- [ ] **Step 6: Add the packaging check to `publish.yml`**

If Task 6 did not already add it, insert after `validate-package-repository.sh`:

```yaml
      - name: Every publishable package declares files and publishConfig
        run: ./.github/scripts/validate-package-files.sh
```

- [ ] **Step 7: Verify**

```bash
grep -n "paths:" .github/workflows/build.yml          # expect NO match
grep -n "lint:release-pushes" .github/workflows/build.yml   # expect present
grep -c "validate-package-files" .github/workflows/*.yml    # expect build + publish
npm run lint:release-pushes && ./.github/scripts/validate-package-files.sh
```

Expected: both exit 0.

- [ ] **Step 8: Commit**

```bash
git add .github/scripts/validate-package-files.sh .github/workflows/build.yml .github/workflows/publish.yml
git commit -m "Gate the packaging fields; stop filtering build.yml by path

npm ships everything not excluded when a package declares neither files
nor .npmignore. All three packages carry the fields correctly and
nothing held them there.

on: paths: on a required check creates no check run at all and hangs the
PR on Expected - a step skipped by if: reports skipped, which passes.
Filtering belongs in an if:, never in the trigger."
```

---

### Task 8: The five gates that carry no test

Closes V3 — the repo failing its own `repo-gates.md` rule.

**Files:**
- Create: `scripts/check-distribution-seed.spec.mjs`
- Create: `scripts/check-migration-order.spec.mjs`
- Create: `scripts/check-metadata-closure.spec.mjs`
- Create: `scripts/check-ownership.spec.mjs`
- Create: `scripts/check-sync-id-parity.spec.mjs`
- Modify: `package.json` (all five appended to `test:gates`)
- Reference: the existing six specs in `scripts/*.spec.mjs` for house style

**Interfaces:**
- Consumes: each gate's exported predicate. **Read each gate first.** If it exports nothing testable, add a named export for its core predicate as part of this task and leave the CLI behaviour unchanged.

**Standard:** from `repo-gates.md` — *"a gate nobody has watched fail is indistinguishable from one that returns pass unconditionally."* Each spec must include **at least one case the gate rejects**, built from a fixture, not from repo state. A spec that only asserts the current repo passes is worthless: it stays green if the gate is replaced by `process.exit(0)`.

Fixtures go in `fs.mkdtempSync(path.join(os.tmpdir(), '<gate>-'))`. Never write fixtures into the repo.

- [ ] **Step 1: Read all five gates and record their seams**

```bash
for f in check-distribution-seed check-migration-order check-metadata-closure check-ownership check-sync-id-parity; do
  echo "═══ $f ═══"
  grep -n "^export\|^function\|^async function\|^const .* = (" scripts/$f.mjs | head -20
done
```

Write down, for each: the exported predicate (or the function that needs exporting), what input it takes, and one concrete input it must reject.

- [ ] **Step 2: Write all five specs, each with a rejection case**

Minimum per gate:

- **`check-distribution-seed`** — accepts SQL using only `${flyway:defaultSchema}` / `${mjSchema}`; **rejects** SQL carrying a third `${...}` placeholder (Skyway leaves an unknown placeholder untouched, so it ships as a literal).
- **`check-migration-order`** — accepts a correctly ordered pair; **rejects** an `EntityField` insert appearing before its `Entity` row.
- **`check-metadata-closure`** — accepts a closed reference set; **rejects** a record referencing a primary key that no file declares.
- **`check-ownership`** — accepts a manifest whose entries all resolve; **rejects** an entity claimed by no owner (or claimed twice — check which the gate actually enforces and test that).
- **`check-sync-id-parity`** — accepts a migration naming exactly the primary keys in its loom directory; **rejects** a directory with a key no migration names.

House style: `node:test` + `node:assert/strict`, one behaviour per `test()`, names that state the behaviour.

- [ ] **Step 3: Run each spec and watch it fail first**

For each of the five, write the spec, run it, and confirm it fails **for the right reason** (missing export, or the gate not yet rejecting), then make it pass. Do not batch — a spec that passed on the first run has not been shown to test anything.

```bash
node --test scripts/check-distribution-seed.spec.mjs
```

- [ ] **Step 4: Wire all five into `test:gates`**

Append all five paths to the `test:gates` script in `package.json`.

- [ ] **Step 5: Run the whole suite**

Run: `npm run test:gates`
Expected: PASS — the original six specs plus Tasks 1–4's four plus these five.

- [ ] **Step 6: Confirm the gates themselves still pass on the real repo**

```bash
npm run lint:distribution && npm run lint:migrations && npm run check:ownership && node scripts/check-metadata-closure.mjs
```

Expected: all exit 0. If adding an export changed behaviour, that is a regression — fix it.

- [ ] **Step 7: Commit**

```bash
git add scripts/*.spec.mjs package.json scripts/check-*.mjs
git commit -m "Give the last five gates their own tests

repo-gates.md requires every gate to carry its own test and these five
did not, so the rule was being enforced everywhere except on itself.
Each spec includes a case the gate rejects: a spec that only asserts the
current repo passes stays green if the gate is replaced by exit(0)."
```

---

### Task 9: The invariant violations in the package manifests

Closes V1, V2, D5, D6.

**Files:**
- Modify: `packages/Entities/package.json`, `packages/Server/package.json`, `packages/Angular/package.json`
- Modify: `mj-app.json`
- Modify: `package.json` (root — `engines`)
- Modify: `README.md` (Node prerequisite line)
- Modify: `package-lock.json` (regenerated, never hand-edited)

**Interfaces:** none — this task changes data, not code.

**Changes, each with its reason:**

1. **V1 — sibling deps to an exact pin.** In `packages/Server/package.json` and `packages/Angular/package.json`, `"@mj-biz-apps/more-cheese-entities": "^1.1.0"` → `"1.1.0"`. The family invariant and this repo's own `versioning-and-peer-deps.md` both require an exact pin for sibling in-app packages; they move as one `fixed` group, so a caret is a claim that is never true.

   **Leave every `@memberjunction/*` peer range alone.** Those are caret ranges by rule — a peer range is a compatibility claim the host resolves.

2. **V2 — strip `TODO(template)` from all three `description` fields.** These ship to npm. Write real descriptions:
   - Entities: `Generated entity subclasses for the MoreCheese (International Cheese Federation) demo schema.`
   - Server: `Server bootstrap for the MoreCheese demo app, loaded by MJAPI at startup via the manifest's startupExport.`
   - Angular: `Angular client bootstrap for the MoreCheese demo app, loaded by MJExplorer.`

   Leave the `TODO(template)` markers in `mj.config.cjs`, `docs/template-docs/getting-started.md` and `packages/Entities/src/index.ts` — those are template scaffolding, not published metadata, and are out of scope.

3. **D5 — license.** `mj-app.json` says `ISC`; all three packages and the root say `MIT`. Set `mj-app.json`'s `license` to `MIT`. (MIT is what four files agree on; ISC is the outlier.)

4. **D6 — Node floor.** CI runs node 24, root `engines` says `>=18.0.0`, README says `≥ 20`. Set `engines.node` to `>=20.0.0` and the README to `Node.js ≥ 20`. Do **not** claim 24: 24 is what CI happens to run, not a tested floor, and raising the floor to it would be an unverified compatibility claim.

- [ ] **Step 1: Apply all four changes**

Edit the six files. Preserve key order and two-space indentation everywhere; a reordering diff makes review harder for no gain.

- [ ] **Step 2: Refresh the lockfile**

```bash
npm install --package-lock-only
git diff --stat package-lock.json
```

Expected: a small diff touching only the `@mj-biz-apps/more-cheese-entities` specifiers. If it is large, stop and read it — something else changed.

- [ ] **Step 3: Verify each change landed**

```bash
grep -n "more-cheese-entities" packages/Server/package.json packages/Angular/package.json   # expect "1.1.0", no caret
grep -rn "TODO(template)" packages/*/package.json                                            # expect NO match
node -e "console.log('manifest license:', require('./mj-app.json').license)"                 # expect MIT
node -e "console.log('engines:', JSON.stringify(require('./package.json').engines))"         # expect >=20.0.0
grep -n "Node.js" README.md                                                                  # expect ≥ 20
```

- [ ] **Step 4: Confirm the peer ranges gate still passes**

Run: `npm run lint:peer-ranges`
Expected: PASS. This gate forbids exact versions in **peerDependencies**; the sibling pin is a `dependencies` entry, so it is unaffected. If it fails, the change touched the wrong field — revert and redo.

- [ ] **Step 5: Confirm the build still works**

Run: `npm run build:packages`
Expected: PASS.

- [ ] **Step 6: Run the gate suite and the packaging check**

Run: `npm run test:gates && ./.github/scripts/validate-package-files.sh && npm run release:plan`
Expected: all PASS.

- [ ] **Step 7: Commit**

```bash
git add packages/*/package.json mj-app.json package.json package-lock.json README.md
git commit -m "Pin siblings exactly, stop shipping TODO(template) to npm

The three packages move as one fixed changesets group, so a caret range
between them is a compatibility claim that is never true - the family
invariant and this repo's own versioning doc both say exact.

The package descriptions still carried template TODOs and would have
gone to npm on the first publish. License was ISC in the manifest and
MIT in four other places; MIT wins. Node floor was three different
numbers; 20 is the one the README already claimed and CI exceeds."
```

---

### Task 10: `docs/release.md` and the stale documentation

Closes D1–D4, D7, D8.

**Files:**
- Create: `docs/release.md`
- Modify: `docs/template-docs/versioning-and-peer-deps.md`
- Modify: `docs/template-docs/publishing.md`
- Modify: `docs/template-docs/README.md`
- Modify: `README.md`
- Modify: `CLAUDE.md`
- Reference: `/Users/sohamdesai/Projects/mj-dev/bizapps-forms/docs/release.md`

**Interfaces:** none.

- [ ] **Step 1: Write `docs/release.md`**

Model it on the forms runbook, describing **this** repo's pipeline. It must contain:

- The step table — 0 prep seed (you), 1 dispatch *Prepare a release* (you), 2 review and merge the release PR (you), 3 publish (CI, including the automatic back-merge). **There is no step 4** here; say so explicitly, and say why (`next-protect` requires a PR but zero approvals, so the workflow opens and merges it).
- An "Is a release even due?" section documenting `npm run release:plan` — read-only, runs on any checkout, always exits 0, and is the same code the workflow runs so it cannot drift.
- A step 0 pointing at `migrations/_README.md` for the seed recipe. Do not duplicate the recipe.
- A note that the first release from this repo is `v1.2.0` and that nothing has ever been published — so `validate-npm-packages.sh` and the "never released" branch of `determine-next-version.mjs` are both load-bearing on the first run.
- A **"When something goes wrong"** table covering at minimum: the App token failing to mint (dispatch *Verify the release App token*); npm's packument being eventually consistent (~3 minutes — trust the `Publish to npm` step output over the registry); a partial publish (re-run the workflow; publish and tag are asked separately so a retry finishes the job); the back-merge merge being refused by `require_extra_approval_for_unattributed_changes` (merge the named PR by hand); and a 403 naming `github-actions[bot]` (checkout's persisted `extraheader` outranks URL credentials).
- The no-breaking-changes policy, cross-referencing MJ's `packages/OpenApp/PUBLISH_NO_BREAK_POLICY.md`.

- [ ] **Step 2: Fix `versioning-and-peer-deps.md` (D1)**

Four corrections, all verified against the tree:
- `@more-cheese-demo/*` → `@mj-biz-apps/*` everywhere, including the quoted `fixed` config.
- Sibling packages: the doc already says exact — as of Task 9 that is now true. Keep the rule, and make the example match (`"1.1.0"`, not `"1.0.0"`).
- **Delete the root-`overrides` section.** The root `package.json` has no `overrides` block. Describe what actually pins: MJ and Angular versions live in root `devDependencies` and in each package's peer ranges.
- MJ peer example `^5.44.0` → `^6.1.2`.

- [ ] **Step 3: Point `publishing.md` at the runbook (D8)**

Keep the npm trusted-publishing bootstrap record and the two commands that lie — that content is accurate and lives nowhere else. Replace the five-line publish checklist with a link to `docs/release.md`, so there is exactly one description of the pipeline.

- [ ] **Step 4: Fix `docs/template-docs/README.md` (D4)**

- Remove the `mj-app.reference.jsonc` link — the file does not exist.
- Fix the TEMPLATE-SPEC.md path. Verify with `ls plans/complete/TEMPLATE-SPEC.md` and make the relative path resolve from `docs/template-docs/`.
- Add `docs/release.md` to the index.

- [ ] **Step 5: Fix `README.md` (D2, D6, D8)**

- Delete the `CoreEntitiesServer` and `Actions` rows from the package inventory table. Only `Entities`, `Server` and `Angular` exist.
- Add a short "Releasing" section pointing at `docs/release.md`.
- Confirm the Node line reads `≥ 20` (Task 9 set this; verify rather than assume).

- [ ] **Step 6: Fix `CLAUDE.md` (D3, D7)**

- The line "The full development workflow … is in the README's 'Development workflow' **table**" points at prose. Say "section", not "table".
- Add `docs/release.md` to the repo-documentation list.
- Check whether the repository-structure block still mentions `ci/` (Task 6 deleted it) and remove it if so.

- [ ] **Step 7: Verify every documentation claim**

```bash
# every markdown link target in the touched docs resolves
node -e "
const fs=require('fs'),path=require('path');
const files=['docs/release.md','docs/template-docs/README.md','docs/template-docs/publishing.md','docs/template-docs/versioning-and-peer-deps.md','README.md','CLAUDE.md'];
let bad=0;
for(const f of files){
  const dir=path.dirname(f);
  for(const m of fs.readFileSync(f,'utf8').matchAll(/\]\(([^)#:]+\.md)[^)]*\)/g)){
    const t=path.resolve(dir,m[1]);
    if(!fs.existsSync(t)){ console.log('BROKEN',f,'->',m[1]); bad++; }
  }
}
console.log(bad?('BROKEN LINKS: '+bad):'all links resolve');
process.exit(bad?1:0)"

grep -rn "more-cheese-demo/\*\|@more-cheese-demo" docs/   # expect NO match
grep -rn "CoreEntitiesServer\|more-cheese-actions" README.md  # expect NO match
grep -n "overrides" docs/template-docs/versioning-and-peer-deps.md  # expect NO match
grep -rn "mj-app.reference.jsonc" docs/                   # expect NO match
grep -rn "ci/commit_push\|mergemain" docs/ README.md CLAUDE.md  # expect NO match
```

- [ ] **Step 8: Run the instruction-file gate**

Run: `npm run check:claude-md`
Expected: PASS. It enforces the CLAUDE.md line/byte budget and that every link resolves — if the CLAUDE.md edits pushed it over budget, shorten them rather than raising the budget.

- [ ] **Step 9: Final full verification**

```bash
npm run test:gates \
  && npm run check:claude-md \
  && npm run lint:peer-ranges \
  && npm run lint:migrations \
  && npm run lint:distribution \
  && npm run lint:release-pushes \
  && npm run test:teardown \
  && npm run check:seed-cadence \
  && npm run check:release-seed \
  && npm run check:ownership \
  && ./.github/scripts/validate-package-files.sh \
  && ./.github/scripts/validate-package-repository.sh \
  && node scripts/sync-app-version.mjs --check \
  && npm run release:plan
```

Expected: every one PASS, and `release:plan` reporting ready at version `1.2.0`.

- [ ] **Step 10: Commit**

```bash
git add docs/ README.md CLAUDE.md
git commit -m "Write the release runbook; correct the docs that describe a different repo

versioning-and-peer-deps.md named the pre-rename scope, and described a
root overrides block this repo does not have. The README's package table
listed two packages that were never built. The docs index linked a file
that does not exist.

docs/release.md is now the single description of the pipeline, including
the failure modes - the old checklist had five lines and no way to
diagnose a red run, which is how six of them went unexplained."
```

---

## Self-Review

**Spec coverage.** B1 → Tasks 2, 6. B2 → Task 4. B3 → Tasks 1, 4. B4 → Task 1. V1, V2 → Task 9. V3 → Task 8. V4 → Task 7. V5 → Task 7. D1–D4, D8 → Task 10. D5, D6 → Task 9. D7 → Task 6 (deletion) and Task 10 (doc). Spec §6's seven verification items → Task 1 Step 6, Task 2 Step 5, Task 4 Steps 6–7, Task 6 Step 3, Task 7 Step 3, Task 8 Step 3, Task 10 Step 9. Spec §3's file table → one task each. No spec requirement is unassigned.

**Placeholder scan.** No "TBD", no "add error handling", no "similar to Task N". The three large ports (Tasks 4, 5, 6) name the source file, the exact adaptations, and the assertions that prove the port landed; they are not "port it and see."

**Type consistency.** `computeAppVersionFields` (Task 1) is used by name in Task 4. `findReleasePushes` (Task 2) is used in Tasks 5–7. `planRelease`/`publishablePackages` (Task 3) are used in Task 6. `assessRelease`/`checkPostconditions`/`maxBumpLevel` (Task 4) are used in Task 5. `$GITHUB_OUTPUT` keys are consistent: `ready`/`version`/`branch` from `release-prep.mjs`, `VERSION`/`publish`/`tag`/`work` from `release-plan.mjs`.

**Ordering constraint.** Task 2's gate is intentionally red between Tasks 2 and 6 and is not wired into CI until Task 7. Task 6 must land before Task 7. Tasks 8, 9 and 10 are independent of each other but all depend on 1–7.
