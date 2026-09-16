# Publishing the app

An Open App is **consumed from GitHub + npm**: the manifest and migrations are
fetched from a tagged GitHub release, the packages are installed from npm.
Publishing = making those two things exist for a version. The pipeline is
already wired in `.github/workflows/publish.yml`.

## The release pipeline (what publish.yml does)

Trigger: push to `main` (i.e. merging the release PR from `next`).

1. Validations: lockfile case-sensitivity, migration filenames, every package
   already exists on npm, `repository.url` present (npm provenance).
2. If there are **no pending changesets → no-op** (safe to merge doc-only PRs).
3. `changeset version` — bumps all fixed packages to the next version and
   verifies it against the expected bump (major changeset → major; new
   migrations since the last tag → at least minor; else patch).
4. Syncs `mj-app.json`: `"version"` ← package version; `"mjVersionRange"` ←
   derived from the `@memberjunction/core` peer dep.
5. Builds all packages, then `changeset publish` → **npm**.
6. Tags `vX.Y.Z`, pushes the version-bump commit back to `main`.
7. Merges `main` → `next` and refreshes `package-lock.json` there.

## One-time setup for a new app (first publish bootstrap) — ✅ DONE 2026-09-16

npm refuses OIDC publishing for packages that don't exist yet, and the
validation step fails until they do. So, once per package:

1. **Publish a `0.0.0` placeholder manually** (with a classic npm token or
   `npm login`): minimal `package.json` + `npm publish --access public`.
2. On npmjs.com, under each package → Settings → **Trusted Publisher**, add
   this GitHub repo + the `publish.yml` workflow.
3. From then on the workflow publishes via **OIDC trusted publishing** — there
   is **no `NPM_TOKEN` secret** to create or rotate. (`publish.yml` already
   declares `permissions: id-token: write`.)

**All three packages completed this on 2026-09-16**, via
`npx setup-npm-trusted-publish` for step 1 and the npm web UI for step 2:

| Package | npm | Trusted publisher connection |
|---|---|---|
| `@mj-biz-apps/more-cheese-entities` | `0.0.0`, public | `72f3b2bf-ce33-4552-a1d9-09c9d1151fd6` |
| `@mj-biz-apps/more-cheese-server` | `0.0.0`, public | `5e8f2292-bac8-4883-97d1-992c06b77acf` |
| `@mj-biz-apps/more-cheese-ng` | `0.0.0`, public | `e53cfcb5-888f-4a0a-8769-b0f6612b65aa` |

Every connection reads `file: publish.yml`, `repository: MemberJunction/more-cheese`,
`permissions: publish, stage publish`, environment **blank** — blank because
`publish.yml` declares no `environment:`, and a value npm holds that the workflow
does not claim makes the OIDC match fail.

⚠️ **Leave "Allow `npm publish`" checked**, though npm's UI labels it *"Not
recommended"*. That advice assumes staged publishing; `publish.yml` runs
`npx changeset publish`, which publishes **directly**. Unchecked, only
`npm stage publish` is permitted and the release fails at the OIDC exchange.

⚠️ **A trusted-publisher connection is immutable** — npm fixes the provider and
its required fields at creation. A wrong repo or workflow filename must be
deleted and re-added, not edited.

### Verifying it, and two commands that will lie to you

The honest check — it needs an interactive 2FA prompt, so no script can run it:

```sh
npm trust list @mj-biz-apps/more-cheese-entities
```

- **`npm access get status <pkg>` does NOT prove a package exists.** It never
  404s; it reports a default. Asked about a package name invented on the spot it
  answered `private`, so a `public` from it means nothing. Use `npm view <pkg>
  version`, or the registry directly, to test existence.
- **`.github/scripts/validate-npm-packages.sh` cannot pass on macOS.** It calls
  `timeout`, which macOS does not ship, so the check exits `127` and every
  package is reported missing no matter what is on npm. CI runs `ubuntu-latest`
  where `timeout` exists, so releases are unaffected — but do not trust a local
  run. (MJ's copy of this script guards it with `command -v timeout`; ours does
  not yet.)
- **Expect propagation lag.** A package can 404 for a few minutes after a
  successful publish. A 404 immediately after registering is not a failure.

## GitHub release tags

`mj app install <repo>` resolves versions from **git tags** (`vX.Y.Z`) — the
publish workflow creates them. The manifest version at a tag must equal the
tag (step 4 guarantees it).

## The no-breaking-changes policy (IMPORTANT)

Within a published **major** version, schema changes must be **additive only**:
no dropping tables/columns, no narrowing types, no renames, no new required
parameters. Anything breaking forces a **major** bump. Consult MemberJunction's
`packages/OpenApp/PUBLISH_NO_BREAK_POLICY.md` before authoring any migration
that touches an existing published schema — upgraders run only your NEW
migrations, never a rebuild.

## Publish checklist

- [ ] Changesets on `next` describe everything since the last release
- [ ] Migrations + regenerated code committed together (see codegen doc)
- [ ] `next` is green (build.yml + changes.yml)
- [ ] Release PR `next` → `main` merged
- [ ] Workflow run green; tag exists; packages on npm; `next` got the merge-back
