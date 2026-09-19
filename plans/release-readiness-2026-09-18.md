# Release readiness — conforming to the MJ and BizApps release rules

**Status:** design, approved 2026-09-18. Supersedes nothing; it is the first
release-engineering design this repo has had.

This repo has never published. Six `publish.yml` runs, six failures, no `v*`
tag. The content is ready — all nine gates pass and the version computes
cleanly to `1.2.0`, matching the `v1.2.x` seed stamps. What is not ready is the
machinery, and one part of it is guaranteed to fail *after* npm has the
packages.

This document records what is wrong, why the chosen fix is the one the rest of
the family already converged on, and what deliberately stays out of scope.

---

## 1. The finding that drives everything

`publish.yml`'s last step is:

```yaml
git checkout next && npm run mergemain:update-lock
```

which ends in `git push origin HEAD:next` (`ci/merge_main_and_update_lock.mjs`).

`next` is protected. Ruleset `next-protect` (id 18797049) is **active**, targets
`~DEFAULT_BRANCH`, requires a pull request, lists **no bypass actors**, and
reports `current_user_can_bypass: never`. The push is refused.

The step runs **after** `changeset publish` and **after** the tag push. So the
first release that gets that far publishes to npm, tags `v1.2.0`, and then goes
red with `next` never updated and no record of the outstanding merge.

`main`, by contrast, has **no ruleset at all**, which is why
`ci/commit_push.mjs`'s `push origin HEAD:main` works today. That is not a
reassurance: it means the release depends on `main` staying unprotected, and the
moment anyone protects it — as both sibling repos have — the release breaks in
the same place, past the point of no return.

The six historical failures were **not** this. They died earlier, at three
different steps: `actions/setup-node@v4` (run 33826635502),
`validate-npm-packages.sh` (33818674317), and `Update version` (30135360397).
None reached publish. The push-to-`next` defect is latent and certain, not the
recorded cause.

### Why this is a design problem and not a bug

bizapps-common hit this and rewrote its pipeline around it: *"versioning and
publishing are separate, and neither writes to a protected branch."*
bizapps-forms reached the same conclusion from the other direction — GitHub
does not start workflow runs from `GITHUB_TOKEN`-authored events, so a branch
the default token creates can never satisfy a required check. Its runbook states
the constraint as the shape of the design rather than an obstacle:

> Nothing is ever pushed to `main` or `next` — not by you, not by a workflow.

Both siblings arrived at: **a workflow proposes, a human merges.** This repo is
the only one still pushing.

---

## 2. Gaps

Every row was verified against the repo, not inferred from the sibling.

### Blocking

| # | Gap | Evidence |
|---|---|---|
| B1 | `publish.yml` pushes to protected `next` after publishing | §1 |
| B2 | No release preflight — nothing answers "is a release due, what blocks it?" | no `release:plan` equivalent exists |
| B3 | Version decision lives in inline workflow bash | `determine-next-version.mjs` is tested, but the mismatch assertion and the `mj-app.json` version + `mjVersionRange` sync are inline `jq`, unreachable outside a release |
| B4 | `mj-app.json` version drift is not checkable at PR time | root `package.json` is `1.0.0`; packages are `1.1.0`; manifest is `1.1.0` |

### Invariant violations

| # | Gap | Rule it breaks |
|---|---|---|
| V1 | Sibling deps at `^1.1.0` | family invariant *and* this repo's own `versioning-and-peer-deps.md`: sibling in-app packages take an **exact** pin |
| V2 | `TODO(template)` in all three published package descriptions | ships to npm on first publish |
| V3 | Five gates carry no spec | this repo's own `repo-gates.md`: "🚨 Every gate carries its own test" — `check-distribution-seed`, `check-migration-order`, `check-metadata-closure`, `check-ownership`, `check-sync-id-parity` |
| V4 | Nothing holds `files` + `publishConfig` | bizapps-common CI-gates this (`validate-package-files.sh`); the fields are correct here but unguarded |
| V5 | `build.yml` uses `on: paths:` | a required check filtered by `on: paths:` creates no check run and hangs the PR on "Expected". Latent today (no required checks configured), certain the moment any are |

### Documentation drift

| # | Gap |
|---|---|
| D1 | `versioning-and-peer-deps.md` names the old `@more-cheese-demo/*` scope, claims exact sibling pins (actual: caret), and describes a root `overrides` block that does not exist; MJ peer example is `^5.44.0` against an actual `^6.1.2` |
| D2 | README's package table lists `CoreEntitiesServer` and `Actions`, neither of which exists |
| D3 | CLAUDE.md points at "the README's Development workflow **table**"; that section is prose |
| D4 | `docs/template-docs/README.md` links `mj-app.reference.jsonc` (absent) and reaches TEMPLATE-SPEC.md through a broken relative path |
| D5 | `mj-app.json` says ISC; every `package.json` says MIT |
| D6 | Node floor stated three ways: `engines >=18`, README `≥ 20`, CI `24` |
| D7 | `ci/merge_main.mjs` is dead code — no workflow calls it |
| D8 | No release runbook. `publishing.md` has a 5-line checklist and no failure modes |

---

## 3. The design

Port the bizapps-forms model, adapted to this repo's npm/`package-lock.json`
toolchain (forms is pnpm) and its three-package fixed group (forms has five).

```
Step 0  you    prep the seed (needs a database, so no workflow can do it)
Step 1  you    dispatch "Prepare a release"
               -> cuts release/vX.Y.Z from next, bumps, opens PR into main
Step 2  you    review and merge that PR          <- the only human gate
Step 3  CI     publish.yml: build, npm, tag,
               then open AND merge the back-merge into next, unattended
```

There is no step 4. The back-merge is automatic.

### Why the back-merge is a self-merged PR rather than a push

The requirement is that nobody opens a pull request and nobody clicks merge.
The constraint is that `next` is protected and the App must not become a bypass
actor. Both are satisfiable at once, because `next-protect` requires a pull
request but **zero approving reviews**:

`publish.yml` opens `chore/backmerge-vX.Y.Z` as the App and immediately merges
it in the same run. The developer does nothing. The ruleset is satisfied rather
than circumvented, and the merge keeps an audit trail.

This deliberately differs from forms, which leaves the back-merge for a human.
Forms' reason is that skipping it silently blocks the *next* release; merging it
automatically removes that failure mode entirely rather than guarding against it.

Two things this depends on, both handled explicitly:

- `allow_auto_merge` is `false` on this repo, so the workflow merges the PR
  directly rather than arming GitHub's auto-merge. No repo setting changes.
- `require_extra_approval_for_unattributed_changes` is `true`, which may refuse
  an App-authored merge. If the merge is refused, the step **fails red and names
  the open pull request**. A back-merge that did not happen must never read as
  one that did.

The rejected alternative is adding the App to `next-protect`'s `bypass_actors`
and pushing directly. It is less code and it is the one thing the family
explicitly forbids: *"The App is never a bypass."* A bypass actor also weakens
the branch for every future use, not just this one.

Preflight, at any time, from any checkout, writing nothing:

```sh
npm run release:plan
```

### The split that makes it testable

The load-bearing separation, taken from forms verbatim:

- **`scripts/release-prep.mjs` decides and mutates the working tree only.** No
  push, no GitHub API, no network write. It can therefore be run locally and
  tested with fixtures.
- **`.github/workflows/release-prep.yml` owns every credential and every remote
  write.** It mints the App token late (installation tokens live one hour) and
  pushes through a separate `app-push` remote rather than re-pointing `origin`.

The reason this matters more than tidiness: *a decision that only ever runs
inside a release cannot be proven by running a release.* Today's version logic
is inline `jq` in `publish.yml` — there is no way to exercise it short of
cutting a real release, which is exactly the situation that produced six red
runs and no diagnosis.

### Blockers `release-prep.mjs` collects

All of them, together, rather than failing on the first:

1. working tree not clean (`git add -A` would sweep it into the release commit)
2. zero changesets, or a changeset with no bump level
3. any of the release gates non-zero — a gate that produced **no exit code
   throws**, because a gate that did not run must not read as a gate that passed
4. `v<version>` is already a git tag
5. npm unreachable, **or** `v<version>` already published for any package —
   unreachable blocks rather than being assumed free
6. `main ⊄ next` — the previous release's back-merge never landed

### Credentials

Org-level `APP_CLIENT_ID` (variable) and `APP_PRIVATE_KEY` (secret) are visible
to this repo, so the App model is available without new infrastructure.

**The App is never a ruleset bypass.** It writes only to `release/*` and
`chore/backmerge-*`, which `next-protect` does not cover (it targets
`~DEFAULT_BRANCH` only). `scripts/check-release-pushes.mjs` is ported as a
standing tripwire that fails any workflow or script pushing to `main` or `next`,
so the property is enforced rather than remembered.

npm trusted publishing is already bootstrapped for all three packages, with the
environment field blank — which means `publish.yml` must continue to declare no
`environment:`, or the OIDC match breaks. Nothing in this design adds one.

### What each new file is for

| File | Role |
|---|---|
| `scripts/release-prep.mjs` | the decision engine; `--plan` (pure read, exit 0) and `--apply` |
| `scripts/release-plan.mjs` | asks *publish* and *tag* as independent questions, so a re-run after a partial publish finishes the job instead of reporting a green no-op |
| `scripts/sync-app-version.mjs` | derives `mj-app.json` `version` + `mjVersionRange` from the anchor package; one function serves both write and `--check`, so the rule cannot drift into two copies |
| `scripts/check-release-pushes.mjs` | tripwire: nothing pushes to `main`/`next` |
| `.github/workflows/release-prep.yml` | step 1, `workflow_dispatch` with `dry_run` |
| `.github/workflows/verify-release-app-token.yml` | read-only credential probe |
| `.github/scripts/validate-package-files.sh` | V4 |
| `docs/release.md` | the runbook, including the failure-mode table |

Each script ships its own `.spec.mjs`, run by `test:gates` — not as ceremony but
because `repo-gates.md` already requires it and V3 is the repo failing its own
rule.

### `determine-next-version.mjs`

Kept, not replaced. Its rule — major changeset wins; else new migrations since
the last `v*` tag mean minor; else patch — is this repo's, is self-tested, and
correctly distinguishes "never released" from "tag missing". `release-prep.mjs`
calls it rather than reimplementing the prediction.

---

## 4. Rejected alternatives

**bizapps-common's `version.yml` model** — a rolling "Version Packages" PR on
`next`, publish-only on `main`, no automated back-merge. It solves B1 equally
well. Rejected because the rolling PR churns on every push to `next`, and
because forms' model keeps the seed-prep step (which needs a database and is
genuinely manual here) visible as step 0 of a numbered runbook. This repo's seed
is five `Metadata_Sync` parts covering ~88k records; that step deserves to be
first-class, not implied.

**Minimal fix** — replace only the push-to-`next` with an App-authored PR, leave
the version logic inline. Rejected: it closes B1 and leaves B2, B3 and B4, which
means the next failed release is diagnosed the same way the last six were, which
is to say not at all.

---

## 5. Out of scope

- **Cutting v1.2.0.** This work ends with `release:plan` reporting ready. The
  first publish from this repo gets a human at the wheel.
- **Protecting `main`.** The design stops depending on `main` being unprotected,
  which is the precondition for protecting it. Doing so is a repo-settings
  change, not a code change, and belongs in its own decision.
- **Required status checks.** Same reasoning. V5 is fixed so that turning them
  on is safe; turning them on is not part of this.
- **`npm test` being vacuous.** All three packages echo a stub. Real package
  tests are a separate body of work; `test:gates` is what actually guards the
  release and it is the thing being extended here.
- **The teardown migrations.** `migrations-teardown/` and `generate:teardown`
  exist only in this repo — no upstream rule governs them, so there is nothing
  to conform to.

---

## 6. Verification

The claim "this repo can now release" is only worth what it is tested against:

1. every new script's spec passes under `test:gates`
2. `check-release-pushes` fails on a planted push-to-`next`, then passes once
   removed — the tripwire is proven to fire, not assumed to
3. `sync-app-version --check` fails on a planted `mj-app.json` drift
4. `release:plan` runs clean on a dirty tree, on a clean tree, and reports
   `1.2.0`
5. `release-prep.yml` dispatched with `dry_run: true` writes nothing
6. all nine pre-existing gates still pass
7. the back-merge step's refusal path is exercised: a merge that GitHub
   declines leaves the run red and the pull request named

Nothing here proves the *publish* half, which cannot be proven without
publishing. That is why step 2 of the runbook is a human merge.
