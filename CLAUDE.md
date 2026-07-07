# <Your App> — development guide (template)

This repository is a **MemberJunction Open App** built from the
mj-sample-open-app template. It is developed **linked inside a MemberJunction
checkout** — see `docs/template-docs/linking-to-mj.md`. TODO(template): replace the
placeholders in this file when you rename the app.

## Repository structure

```
mj-app.json            - MJ Open App manifest (the source of truth for the app)
migrations/            - Skyway migrations for the app schema (starts empty)
metadata/              - mj-sync metadata (dev-time; seeds ship as migrations)
packages/
  Entities/            - @mj-more-cheese-demo/entities   (CodeGen entity subclasses)
  CoreEntitiesServer/  - @mj-more-cheese-demo/core-entities-server (server-side entity overrides)
  Actions/             - @mj-more-cheese-demo/actions    (MJ Actions)
  Server/              - @mj-more-cheese-demo/server     (server bootstrap -> MJAPI)
  Angular/             - @mj-more-cheese-demo/ng         (client bootstrap -> MJExplorer)
docs/                  - how this repo works (branching, publishing, codegen, linking)
docs/claude/           - the MemberJunction development guide (topic-split, with TOC)
```

## 📖 The MemberJunction development guide → [`docs/claude/`](docs/claude/README.md)

The MJ coding rulebook — critical rules, entity/data patterns, performance,
CodeGen + migration authoring, Angular conventions, code style, metadata
authoring, testing — lives in **[docs/claude/](docs/claude/README.md)** as a
set of topic docs with a table of contents (adapted from MemberJunction's own
`CLAUDE.md`; MJ's copy remains authoritative for MJ-core work and anything not
covered there). Read the relevant topic before working in its area:

| Topic | Doc |
|---|---|
| Critical rules (non-negotiable) | [docs/claude/01-critical-rules.md](docs/claude/01-critical-rules.md) |
| Git & branches | [docs/claude/02-git-and-branches.md](docs/claude/02-git-and-branches.md) |
| Entities & data access | [docs/claude/03-entities-and-data.md](docs/claude/03-entities-and-data.md) |
| Performance | [docs/claude/04-performance.md](docs/claude/04-performance.md) |
| CodeGen & migrations | [docs/claude/05-codegen-and-migrations.md](docs/claude/05-codegen-and-migrations.md) |
| Angular | [docs/claude/06-angular.md](docs/claude/06-angular.md) |
| Code style | [docs/claude/07-code-style.md](docs/claude/07-code-style.md) |
| Metadata & mj-sync | [docs/claude/08-metadata-and-sync.md](docs/claude/08-metadata-and-sync.md) |
| Testing | [docs/claude/09-testing.md](docs/claude/09-testing.md) |

## The rules that matter most in THIS repo

1. **No commits without explicit approval** — never run `git commit` unless
   the user asked for that commit; commit only what is staged.
2. **Never edit `src/generated/`** in any package — CodeGen overwrites it.
   After schema/metadata changes run codegen and **commit the regenerated code
   together with its migration** (`docs/template-docs/codegen-and-metadata-migrations.md`).
3. **Never edit an applied migration** — add a new `V*` file. Additive-only
   within a published major version.
4. **Branch rules** — feature branches cut from `next`, tracking
   `origin/<same-name>` only; PRs target `next`; a PR adding a migration must
   include a changeset (≥ minor). See `docs/template-docs/branching.md`.
5. **Single-copy invariant** — `@memberjunction/*` are peerDependencies; never
   hard-depend on them, never `npm install` inside subfolders of a linked MJ
   workspace (`docs/template-docs/versioning-and-peer-deps.md`).
6. **When linked into MJ**: the wiring edits in the MJ repo (root
   `package.json`, `mj.config.cjs`, MJAPI/MJExplorer `package.json`, bootstrap
   import, lockfile) are local-only — never commit them to MJ.

## Build & dev commands

```sh
# linked (from the MJ repo root — the normal mode):
npx turbo build --filter="@mj-more-cheese-demo/*"
npx mj migrate --schema sample_app --dir packages/dev-apps/mj-sample-open-app/migrations
npx mj codegen

# standalone smoke build (no DB):
npm install && npm run build:packages
```

The full development workflow (where to add code, capturing codegen +
metadata-sync migrations, releasing) is in the README's "Development
workflow" table.
