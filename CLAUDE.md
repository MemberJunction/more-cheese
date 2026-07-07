# <Your App> — development guide (template)

This repository is a **MemberJunction Open App** built from the
mj-sample-open-app template. It is developed **linked inside a MemberJunction
checkout** — see `docs/linking-to-mj.md`. TODO(template): replace the
placeholders in this file when you rename the app.

## Repository structure

```
mj-app.json            - MJ Open App manifest (the source of truth for the app)
migrations/            - Skyway migrations for the app schema (sample_app)
metadata/              - mj-sync metadata (dev-time; seeds ship as migrations)
packages/
  Entities/            - @mj-more-cheese-demo/entities   (CodeGen entity subclasses)
  CoreEntitiesServer/  - @mj-more-cheese-demo/core-entities-server (server-side entity overrides)
  Actions/             - @mj-more-cheese-demo/actions    (MJ Actions)
  Server/              - @mj-more-cheese-demo/server     (server bootstrap -> MJAPI)
  Angular/             - @mj-more-cheese-demo/ng         (client bootstrap -> MJExplorer)
docs/                  - how this repo works (branching, publishing, codegen, linking)
```

## Critical rules

1. **No commits without explicit approval** — never run `git commit` unless
   the user asked for that commit; commit only what is staged.
2. **No `any` types, ever** (including `as any` / `unknown` shortcuts) — MJ is
   strongly typed throughout; ask for a proper typing solution instead.
3. **Never edit `src/generated/`** in any package — CodeGen overwrites it.
   After schema/metadata changes run codegen and **commit the regenerated code
   together with its migration** (`docs/codegen-and-metadata-migrations.md`).
4. **Never edit an applied migration** — add a new `V*` file (checksum drift
   breaks every install). Additive-only within a published major version.
5. **Branch rules** — feature branches cut from `next`, tracking
   `origin/<same-name>` only (never `next`/`main`); PRs target `next`; a PR
   adding a migration must include a changeset (≥ minor). See `docs/branching.md`.
6. **Single-copy invariant** — `@memberjunction/*` are peerDependencies; never
   hard-depend on them, never `npm install` inside subfolders of a linked MJ
   workspace (`docs/versioning-and-peer-deps.md`).
7. **When linked into MJ**: the wiring edits in the MJ repo (root
   `package.json`, `mj.config.cjs`, MJAPI/MJExplorer `package.json`, bootstrap
   import, lockfile) are local-only — never commit them to MJ.

## MemberJunction coding patterns (the essentials)

- Create entities via `md.GetEntityObject<T>('Entity Name')` — never `new EntityClass()`.
- Load collections via `RunView<T>` with `ResultType: 'entity_object'`; check
  `result.Success` (RunView does not throw). `Save()`/`Delete()` return
  booleans — check them; read errors from `LatestResult?.CompleteMessage`.
- Server-side code always passes `contextUser`.
- PascalCase public class members, camelCase private/protected.
- Prefer `RunViews` (plural) for batched queries; never query in loops.
- Angular: standalone components for new leaf components (`standalone: false`
  explicitly when module-declared); `@if/@for` template syntax; `inject()` DI.

For everything not covered here, **MemberJunction's own CLAUDE.md (in the MJ
repo) is the authoritative reference** — when this app is linked into an MJ
checkout you'll find it at the checkout root.

## Build & dev commands

```sh
# linked (from the MJ repo root — the normal mode):
npx turbo build --filter="@mj-more-cheese-demo/*"
npx mj migrate --schema sample_app --dir packages/dev-apps/mj-sample-open-app/migrations
npx mj codegen

# standalone smoke build (no DB):
npm install && npm run build:packages
```
