# MJ Sample Open App — the Open App template

A **blank-start template** for building
[MemberJunction](https://github.com/MemberJunction/MJ) Open Apps. Clone it,
rename a handful of identifiers, and start adding your schema, code, and
metadata — every folder and config file is pre-wired to MJ's conventions and
carries comments explaining what goes in it. It ships **no migrations, no
generated code, and no build output**: the structure and guidance are here,
the content is yours.

> **What an Open App is:** its manifest (`mj-app.json`) plus whatever optional
> blocks it declares — a database schema + migrations, mj-sync metadata,
> server packages loaded by MJAPI, and client packages bundled into
> MJExplorer. Everything is additive; a manifest-only app is valid.
>
> **The authoritative format reference** is MemberJunction's own Open App
> README — read it alongside this template:
> - GitHub: <https://github.com/MemberJunction/MJ/blob/next/packages/OpenApp/README.md>
> - In an MJ checkout (current path): `packages/OpenApp/README.md`
>
> The annotated manifest reference is copied into this repo as
> [`mj-app.reference.jsonc`](mj-app.reference.jsonc).

## What's in the box

| Path | Purpose | Required? |
|---|---|---|
| `mj-app.json` | THE app manifest (identity, schema, migrations, packages) | **Required** |
| `mj-app.reference.jsonc` | Fully-annotated manifest reference — every block explained | reference |
| `migrations/` | Skyway migrations for your schema — **starts empty**; inert example skeleton + README inside | With a schema |
| `metadata/` | mj-sync metadata; ships one live folder (`schema-info/`, registers your schema) + inert `_examples/` | Optional |
| `packages/Entities` | CodeGen entity subclasses land here (placeholder until your first codegen) | With a schema |
| `packages/CoreEntitiesServer` | Server-side entity overrides (validation, save hooks) | Optional |
| `packages/Actions` | MJ Actions — agent/workflow integration points | Optional |
| `packages/Server` | Server bootstrap — MJAPI imports it at startup and calls its `startupExport` | With server code |
| `packages/Angular` | Client bootstrap — MJExplorer bundles it; your components + generated forms | With UI |
| `mj.config.cjs` | CodeGen/migrate configuration for this repo | **Required** for codegen |
| `.github/workflows/` | CI: `build`, `changes` (migration + changeset gates), `publish` (npm via OIDC) | Recommended |
| `.changeset/` + `ci/` | Fixed versioning + release pipeline helpers | Recommended |
| `docs/` + `plans/TEMPLATE-SPEC.md` | The deep-dive docs + the full required/optional inventory | Recommended |

Each package is deliberately minimal — a `package.json` (showing the
dependency conventions), a `tsconfig.json`, and one commented source file that
explains what belongs there. All five build out of the box:

```sh
npm install && npm run build:packages     # no MJ checkout or DB needed
```

## Getting started

1. **Rename the template** — follow the checklist in
   [docs/getting-started.md](docs/getting-started.md) (app id, npm scope,
   schema name, bootstrap export names). `grep -r "mj-sample-app" .` finds
   every fill-in point.
2. **Create your repo + branches** — `next` (default, integration) and `main`
   (release): [docs/repo-setup.md](docs/repo-setup.md).
3. **Link into a MemberJunction checkout** — development happens inside MJ;
   the step-by-step worktree method (and exactly when you need a database) is
   [docs/linking-to-mj.md](docs/linking-to-mj.md).
4. **Build your app** using the workflow below.

## Development workflow (the loop you'll live in)

All commands run from the **MJ repo root** with this app linked
(see [docs/linking-to-mj.md](docs/linking-to-mj.md)); `<app>` is this repo's
folder under `packages/dev-apps/`.

| You want to… | Do this | Details |
|---|---|---|
| **Add a table / schema change** | Write `migrations/V<YYYYMMDDHHMM>__v<ver>_<Desc>.sql` (copy the `EXAMPLE_*.sql.example` skeleton), then run migrations + codegen (below) | [migrations/_README.md](migrations/_README.md), [docs/codegen-and-metadata-migrations.md](docs/codegen-and-metadata-migrations.md) |
| **Run your migrations** | `npx mj migrate --schema sample_app --dir packages/dev-apps/<app>/migrations` | [docs/linking-to-mj.md](docs/linking-to-mj.md) §5 |
| **Run CodeGen** (after every schema/metadata change) | `npx mj codegen` — generates entity classes, resolvers, and forms into `packages/*/src/generated/`; **commit the generated code with its migration** | [docs/codegen-and-metadata-migrations.md](docs/codegen-and-metadata-migrations.md) |
| **Capture a CodeGen migration** | Fold the SQL CodeGen emitted for YOUR objects (from `migrations/codegen/`, gitignored scratch) into a `V*` migration; never fold the `__mj_*` system plumbing — CodeGen re-applies that everywhere itself | [docs/codegen-and-metadata-migrations.md](docs/codegen-and-metadata-migrations.md) |
| **Add / change metadata** (apps, nav items, lookup seeds, actions) | Edit `metadata/` (copy an `_examples/` folder to start), `npx mj sync push --dir=<app>/metadata --format=json`, then capture the SQL as a `V*_Metadata_Sync.sql` migration | [metadata/_examples/README.md](metadata/_examples/README.md) |
| **Add server code** (entity overrides, engines, resolvers) | `packages/CoreEntitiesServer` / `packages/Server` — wire new modules into `Server/src/index.ts` so the bootstrap loads them | comments in those files |
| **Add an Action** | `packages/Actions` — `@RegisterClass(BaseAction, '<Your App>: <Name>')` + an action metadata record + migration | comments in `packages/Actions/src/index.ts` |
| **Add UI** (components / dashboards) | `packages/Angular` — components under `src/lib/`, exported from `public-api.ts`; nav items via an application metadata record | comments in `packages/Angular/src/public-api.ts` |
| **Build** | `npx turbo build --filter="@mj-sample-app/*"` (or `npm run build:packages` standalone) | — |
| **Ship a change** | Changeset (`npx changeset`, ≥ minor if it adds a migration) → PR to `next` | [docs/branching.md](docs/branching.md) |
| **Release / publish to npm** | Merge the release PR `next` → `main`; the publish workflow does the rest | [docs/publishing.md](docs/publishing.md) |

**Managing migrations, the rules that matter:** never edit an applied
migration (add a new one); timestamps must increase; no `__mj_*` columns or FK
indexes in your SQL (CodeGen owns those); additive-only within a published
major version. Full rationale: [docs/codegen-and-metadata-migrations.md](docs/codegen-and-metadata-migrations.md)
and [docs/publishing.md](docs/publishing.md).

## Documentation index

Everything above in depth: [docs/README.md](docs/README.md). The complete
what-belongs-in-an-app inventory (required vs optional, with the shipped
first-party apps as exemplars): [plans/TEMPLATE-SPEC.md](plans/TEMPLATE-SPEC.md).
