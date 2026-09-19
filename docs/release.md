# Cutting a release

One pull request, and it is opened for you. Nothing is ever pushed to `main` or `next` — not by
you, not by a workflow. That constraint is not a limitation being worked around; it is the shape of
the design (see [Why it looks like this](#why-it-looks-like-this)).

| Step | Who | What |
|---|---|---|
| 0. Prep the seed | you, once per release | the consolidated `Metadata_Sync` — needs a database, so no workflow can do it |
| 1. Dispatch **Prepare a release** | you, one click | cuts `release/vX.Y.Z` from `next`, bumps, opens the PR into `main` |
| 2. Review and merge that PR | you | the only human gate in the whole pipeline |
| 3. Publish | `publish.yml` | builds, publishes to npm, tags, then **opens and merges** the back-merge into `next` |

**There is no step 4.** The back-merge is automatic, and that is a deliberate difference from
`bizapps-forms`, where a human merges it. `next-protect` requires a pull request but **zero**
approving reviews, so `publish.yml` opens `chore/backmerge-vX.Y.Z` as the App and merges it in the
same run. That *satisfies* the ruleset rather than circumventing it — the App never becomes a bypass
actor — and it removes the failure mode entirely instead of guarding against it, because a skipped
back-merge costs this release nothing and silently blocks the next one.

---

## Is a release even due?

```bash
npm run release:plan
```

Read-only, runs on any checkout, and **always exits 0**. Blocked-ness rides in its output, not in
its exit status — so never wire it into a `&&` chain expecting it to stop one. It reports the
current version, how many changesets are pending and what version they compute to, whether the
working tree is clean, whether `main` has reached `next`, and whether all four release gates pass —
then lists every blocker standing between you and a release, all of them together rather than
failing on the first.

It is the same code the workflow runs (`scripts/release-prep.mjs --plan`; step 1 runs the same file
with `--apply`), so it cannot drift from what actually happens. Run it whenever you want to know
where things stand; it writes nothing.

The blockers it can report: a dirty working tree, zero changesets or a changeset with no bump level,
any of the four release gates non-zero, the computed version already tagged, the computed version
already on npm for any package, npm unreachable, and `main` not contained in `next`.

> **`main` is not contained in `next` is a real, current condition in this repo**, and
> `release:plan` reports it today. It is not a defect in the tooling — it is the tooling correctly
> refusing to cut a release whose PR GitHub would not let you merge. The fix is to merge `main` into
> `next` first (from `origin/main`, through a pull request — `next` is protected), then re-run.

## 0. Prep — the metadata seed

**The one part of a release no workflow will ever do for you.** Generating the consolidated
`Metadata_Sync` needs a database with MJ and this app's schema installed, which no CI runner has.
The recipe is [`migrations/_README.md`](../migrations/_README.md) and the capture loop is
[`codegen-and-metadata-migrations.md`](template-docs/codegen-and-metadata-migrations.md) — read it
there, it is not duplicated here.

This repo's seed is **several files, not one**: `generated/` is ~88 MB, so the seed ships as
`V<stamp>__v1.2.x__Metadata_Sync_PartNofM.sql` parts. `check:seed-cadence` enforces that they form
one complete generation — one stamp, a gapless `1of M … M of M` run — because the way a part goes
missing is a `.gitignore` rule or a push limit, not a decision.

`npm run release:plan` tells you whether a seed is owed: `check:release-seed` and `check:seed-cadence`
both appear in its gate line, and a red one is a blocker that stops step 1 before anything is written.

If it has been a while since the last release, also dispatch **Verify the release App token** once
(Actions → *Verify the release App token*). It is read-only, takes under a minute, and confirms the
credential that steps 1 and 3 depend on is still live — it names the actual App slug when the key
belongs to a different app than expected. A revoked App is otherwise invisible until a release is
half-done.

## 1. Dispatch "Prepare a release"

Actions → **Prepare a release** → *Run workflow*. Set `dry_run: true` first if you want to see the
plan without anything being written — a dry run does the read half and stops: no branch, no commit,
no pull request, nothing on the remote.

It refuses, before writing anything, on any blocker from the list above, and each refusal names what
to do about it. Otherwise it cuts `release/vX.Y.Z` from the tip of `next`, runs `npm run version`
(`changeset version` + `scripts/sync-app-version.mjs`), refreshes `package-lock.json`, verifies that
what came out matches what it predicted, commits, pushes the branch through a separate `app-push`
remote, and opens the pull request into `main` with a body listing the changesets being consumed.

**The version is not yours to choose.** Changesets computes it from the pending changesets and the
workflow asserts the result matches its own prediction. Nothing downstream second-guesses it, so if
the version is wrong the fix is a changeset, not an edit.

> A migration filename's `__v<ver>__` segment is **not** a claim about which release ships it.
> Skyway orders on the `V<timestamp>` prefix and nothing reads the label. Do not infer a version
> from one — see [`migrations/_README.md`](../migrations/_README.md).

## 2. Review and merge the release PR

This is the step that matters: the only point where a human looks at the consolidated seed, the
computed version and the CHANGELOGs before any of it is permanent. The App-authored push is what
starts the checks on it — `GITHUB_TOKEN` could not, which is the whole reason there is an App.

The diff against `main` spans everything since the last release, so review **the bump** instead,
which is the part a human can actually judge:

```bash
git diff --name-only origin/next origin/release/vX.Y.Z
```

That should be the consumed changesets, three `package.json`, three `CHANGELOG.md`, the lockfile and
`mj-app.json` — and **nothing** under `migrations/`, `generated/`, `config/` or any `src/`.

Merge it with a **merge commit**.

## 3. Publishing and the back-merge happen by themselves

The merge pushes to `main`, which triggers `publish.yml` (*Build and Publish*). It validates, builds,
publishes to npm, pushes the `vX.Y.Z` tag, then opens **and merges** the back-merge pull request.

Every gate sits before `Publish to npm`, so a failure there costs a re-run and nothing has been
published. Three are worth knowing by name:

- **`The bump has to have happened before this branch was merged`** fails if any `.changeset/*.md` is
  still present, because that means step 1 never ran and publishing would republish the current
  version. A missing or unreadable `.changeset/` is an error here, never a zero.
- **`What is there to release?`** (`scripts/release-plan.mjs`) asks two questions **separately** — is
  any package missing this version from npm, and is the `vX.Y.Z` tag absent — and each gates its own
  step. So **re-running the workflow after a partial failure finishes the job** rather than reporting
  a green no-op. It does nothing, and says so, only when the version is fully published *and* tagged.
- **`Enforce schema-change version policy`** fails if `migrations/` changed since the last `v*` tag
  but the version only moved by a patch. Fix it by redoing step 1 with a `minor` changeset.

`mj-app.json` is only **verified** here (`sync-app-version.mjs --check`), never derived — the
derivation happened on the release branch in step 1, so a hand-edited manifest stops the release
before anything reaches npm.

**A green run means the whole release landed, back-merge included.** The back-merge step carries no
`continue-on-error`: if the merge is refused it goes red and names the open pull request, because a
back-merge that did not happen must never read as one that did.

## The first release from this repo

Nothing has ever been published here. There is **no `v*` tag**, and all three packages sit on npm at
`0.0.0` as trusted-publishing placeholders. The first release will be **v1.2.0**.

Two pieces of machinery are therefore load-bearing on the first run and on no other:

- `.github/scripts/validate-npm-packages.sh` — npm refuses OIDC publishing for a package that does
  not exist, so this proves all three placeholders are present before the build starts.
- The **"never released"** branch of `.github/scripts/determine-next-version.mjs` — with no tag to
  measure against, every migration in the tree counts as new, which is what makes the bump a minor.
  A *missing* tag in a repo that has released before is a different state and stops the run;
  conflating the two is what kept this repo from ever publishing.

`publish.yml` must continue to declare **no `environment:`**. All three trusted-publisher
connections were registered with the environment field blank, and a value npm holds that the
workflow does not claim makes the OIDC match fail. See
[`publishing.md`](template-docs/publishing.md) for the bootstrap record.

## The no-breaking-changes policy

Within a published **major** version, schema changes must be **additive only**: no dropping
tables or columns, no narrowing types, no renames, no new required parameters. Anything breaking
forces a **major** bump.

Consult MemberJunction's `packages/OpenApp/PUBLISH_NO_BREAK_POLICY.md` before authoring any
migration that touches an already-published schema — upgraders run only your NEW migrations, never a
rebuild. `changes.yml` enforces the "migration ⇒ at least a minor changeset" half on every PR into
`next`; `publish.yml` re-asks it of the artifacts at release time, when the changesets are already
consumed and gone.

---

## Why it looks like this

**Why an App token.** GitHub deliberately does not start workflow runs from `GITHUB_TOKEN`-authored
events. A branch or pull request created by the default token would therefore never have `changes.yml`
or `build.yml` report on it, and a reviewer would be merging a release with no gate signal at all —
so the automation needs an identity that is not `GITHUB_TOKEN`. This repo has no PAT; it has
org-level `vars.APP_CLIENT_ID` + `secrets.APP_PRIVATE_KEY`, already visible here.

**The App is never a bypass.** It writes only to `release/*` and `chore/backmerge-*`. `next-protect`
(id 18797049) is `target: branch` and includes only `~DEFAULT_BRANCH`, so it covers neither of those
— nor `refs/tags/*`, which is why the tag push through `origin` is legitimate.
`npm run lint:release-pushes` (`scripts/check-release-pushes.mjs`) is the standing tripwire that
fails any workflow or script pushing to `main` or `next`, so the property is enforced rather than
remembered.

**Why the App token is minted late.** An installation token lives one hour, and everything ahead of
the back-merge — a cold `npm ci`, a full turbo build, `changeset publish` against npm — routinely
runs for tens of minutes. A token minted at checkout is one that eventually expires at exactly that
step, on a day nobody changed anything. Both workflows mint at the point of use.

**Why the version decision lives in a script.** It used to be inline `jq` in `publish.yml`, which
meant it could only ever be exercised by cutting a real release. Six `publish.yml` runs failed
without a single diagnosis. `scripts/release-prep.mjs` decides and mutates the working tree only —
no push, no GitHub API — so it runs locally, ships a spec, and is the same code the workflow calls.

The full argument, including the rejected alternatives, is in
[`plans/release-readiness-2026-09-18.md`](../plans/release-readiness-2026-09-18.md).

## When something goes wrong

| Symptom | What it means |
|---|---|
| A step fails to mint the App token | Dispatch **Verify the release App token** — read-only, under a minute, and it names the actual App slug when the key belongs to a different app than expected. |
| The back-merge could not be merged; the run is red naming an open `chore/backmerge-v*` PR | `next-protect` sets `require_extra_approval_for_unattributed_changes: true`, which may refuse an App-authored merge. **This is the most likely first-run surprise.** Merge the named pull request by hand. The release itself is published and tagged; only the merge is outstanding. |
| Some packages appear published and others do not, right after a green run | **Wait three minutes and look again before doing anything.** npm's packument is eventually consistent and converges over ~3 minutes. Read the `Publish to npm` step's own output — `changeset publish` names every package it published — and trust that over what the registry serves. |
| Some packages genuinely did not publish (the step's output says so, or they are still absent well after the run) | `changeset publish` works concurrently and **expects a re-run, not a new release**. Re-run `publish.yml`; `release-plan.mjs` asks *publish* and *tag* separately, so the re-run finishes the job instead of reporting a green no-op. Do not cut a second release over a partial one — `release:plan` blocks that too. |
| A push in the release path is refused with a 403 naming `github-actions[bot]` | The push used the ambient token, not the App, whatever its remote URL says — `actions/checkout`'s persisted `extraheader` outranks credentials embedded in a remote URL. `release-prep.yml` does not persist credentials; `publish.yml` must, because it pushes the tag through `origin`. |
| `chore/backmerge-vX.Y.Z exists at <sha>, which is not main's tip … Refusing to force-push over it` | Reachable legitimately: the back-merge PR was already merged, the branch was left behind, `main` has since moved, and the same VERSION was re-dispatched. Someone may have resolved conflicts on that branch, so the workflow will not guess. Delete the branch and re-run, or open and merge the PR by hand. |
| `release:plan` says `main` is not contained in `next` | Merge `main` into `next` first, through a pull request, then re-run. In a repo that has released before this is the previous release's back-merge never having landed. |
| `release:plan` says the seed is owed | Step 0. [`migrations/_README.md`](../migrations/_README.md). |
| `release:plan` exits 0 but says NOT READY | Working as designed. It always exits 0; read the output, not the status. |
