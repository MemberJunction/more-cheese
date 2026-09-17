---
"@mj-biz-apps/more-cheese-entities": minor
"@mj-biz-apps/more-cheese-server": minor
"@mj-biz-apps/more-cheese-ng": minor
---

Publish under `@mj-biz-apps`

The three packages were scoped `@mj-more-cheese-demo/*`, inherited from the
`mj-sample-open-app` template's `@mj-sample-app/*` placeholder. Neither scope was ever
created on npm — `npm org ls mj-more-cheese-demo` returns `Scope not found`, and so does
the template's — so the first `npm publish` failed at
`PUT .../@mj-more-cheese-demo%2fentities` before permissions were even evaluated. Nothing
had ever been published from this repo: six `publish.yml` runs, six failures, no `v*` tag.

The fix is the estate's existing convention rather than a fourteenth org. All 78 packages
across the thirteen sibling Open Apps live in one scope, `@mj-biz-apps`, named
`<app>-<role>` — so these become `more-cheese-{entities,server,ng}`. That scope already
exists and needs no new owner. Renaming later would have been the expensive direction: npm
has no rename, so it means republishing under a new name and deprecating the old, plus an
orphan org to dispose of.

Two of the touched places would have failed *silently* rather than loudly, which is why
this lands as one change rather than as fixes applied when things broke:

- `validate-npm-packages.sh` filters on the scope before checking anything. Renamed
  packages with the old filter still in place are skipped, and the gate prints
  `All 0 packages exist on npm` and exits 0 — a green check that has verified nothing.
- `mj-app.json`'s `schema.entityPackage` names the entity package for `mj app install`.
  Left stale it points a host at a package nobody published, and nothing in this repo's
  CI would notice.

The same script also called `timeout`, which ships on Linux but not macOS, so an unguarded
call exited 127 and the loop read that as "package missing" — every local run reported every
package absent regardless of npm, and the retry loop made it look intermittent rather than
broken. CI runs `ubuntu-latest`, so releases were never affected; the check was wrong only
where a human would run it by hand. Now guarded with `command -v timeout`, matching MJ's
copy of the same script.

Thirteen files under `src/generated/` carry the new name too. CodeGen derives that import
specifier from `mj.config.cjs`'s `entityPackageName`, which moves in the same commit, so the
next codegen run reproduces exactly this text rather than reverting it.
