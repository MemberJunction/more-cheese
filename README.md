# MoreCheese Demo — `more-cheese-demo`

The **MoreCheese demo open app** for
[MemberJunction](https://github.com/MemberJunction/MJ): the fictional
**International Cheese Federation (ICF)** association demo. It composes the
BizApps open-app catalog with custom association-domain schemas — members,
events, learning, forums, resources, awards, legislative, marketing (the
`morecheese_*` schemas; home schema `morecheese_common`) — the
way a real customer environment composes multiple source systems. Dataset
plans, benchmarks, and hero personas live in `plans/association-db/`; the
data generator lives in `datagen/` (engine / projects/morecheese / cli).

Built from the `mj-sample-open-app` template — the template's structure and
docs below still apply.

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
| `metadata/` | mj-sync metadata. `schema-info/` registers your schema and **requires fill-out** (ships as an inert `.template` — see its README). Authoring guide: `docs/template-docs/metadata.md` | Optional |
| `packages/Entities` | CodeGen entity subclasses land here (placeholder until your first codegen) | With a schema |
| `packages/CoreEntitiesServer` | Server-side entity overrides (validation, save hooks) | Optional |
| `packages/Actions` | MJ Actions — agent/workflow integration points | Optional |
| `packages/Server` | Server bootstrap — MJAPI imports it at startup and calls its `startupExport` | With server code |
| `packages/Angular` | Client bootstrap — MJExplorer bundles it; your components + generated forms | With UI |
| `mj.config.cjs` | CodeGen/migrate configuration for this repo | **Required** for codegen |
| `.github/workflows/` | CI: `build`, `changes` (migration + changeset gates), `publish` (npm via OIDC) | Recommended |
| `.changeset/` + `ci/` | Fixed versioning + release pipeline helpers | Recommended |
| `docs/template-docs/` + `plans/TEMPLATE-SPEC.md` | The deep-dive docs + the full required/optional inventory | Recommended |
| `docs/skip-integration.md` | Running **Skip** against this app's data — install, the required registry override, and four undocumented gotchas | If demoing Skip |

Each package is deliberately minimal — a `package.json` (showing the
dependency conventions), a `tsconfig.json`, and one commented source file that
explains what belongs there. All five build out of the box:

```sh
npm install && npm run build:packages     # no MJ checkout or DB needed
```

## Getting started

1. **Setup script — already run.** This repo's identity was set with
   `npm run init` (id `more-cheese-demo`, scope `@mj-more-cheese-demo/*`,
   schema `morecheese_common`, prefix `MoreCheese: `). The script is
   re-runnable if a value must change before first publish — see
   [docs/template-docs/getting-started.md](docs/template-docs/getting-started.md).
2. **Create your repo + branches** — `next` (default, integration) and `main`
   (release): [docs/template-docs/repo-setup.md](docs/template-docs/repo-setup.md).
3. **Link into a MemberJunction checkout** — development happens inside MJ;
   the step-by-step worktree method (and exactly when you need a database) is
   [docs/template-docs/linking-to-mj.md](docs/template-docs/linking-to-mj.md).
4. **Build your app** using the workflow below.

## Development workflow (the loop you'll live in)

All commands run from the **MJ repo root** with this app linked
(see [docs/template-docs/linking-to-mj.md](docs/template-docs/linking-to-mj.md)); `<app>` is this repo's
folder under `packages/dev-apps/`.

| You want to… | Do this | Details |
|---|---|---|
| **Add a table / schema change** | Write `migrations/V<YYYYMMDDHHMM>__v<ver>_<Desc>.sql` (copy the `EXAMPLE_*.sql.example` skeleton), then run migrations + codegen (below) | [migrations/_README.md](migrations/_README.md), [docs/template-docs/codegen-and-metadata-migrations.md](docs/template-docs/codegen-and-metadata-migrations.md) |
| **Run your migrations** | `npx mj migrate --schema morecheese_common --dir packages/dev-apps/<app>/migrations` | [docs/template-docs/linking-to-mj.md](docs/template-docs/linking-to-mj.md) §5 |
| **Run CodeGen** (after every schema/metadata change) | `npx mj codegen` — generates entity classes, resolvers, and forms into `packages/*/src/generated/`; **commit the generated code with its migration** | [docs/template-docs/codegen-and-metadata-migrations.md](docs/template-docs/codegen-and-metadata-migrations.md) |
| **Capture a CodeGen migration** | Fold the SQL CodeGen emitted for YOUR objects (from `migrations/codegen/`, gitignored scratch) into a `V*` migration; never fold the `__mj_*` system plumbing — CodeGen re-applies that everywhere itself | [docs/template-docs/codegen-and-metadata-migrations.md](docs/template-docs/codegen-and-metadata-migrations.md) |
| **Add / change metadata** (apps, nav items, lookup seeds, actions) | Add an entity folder under `metadata/`, `npx mj sync push --dir=<app>/metadata --format=json`, then capture the SQL as a `V*_Metadata_Sync.sql` migration | [docs/template-docs/metadata.md](docs/template-docs/metadata.md) |
| **Add server code** (entity overrides, engines, resolvers) | `packages/CoreEntitiesServer` / `packages/Server` — wire new modules into `Server/src/index.ts` so the bootstrap loads them | comments in those files |
| **Add an Action** | `packages/Actions` — `@RegisterClass(BaseAction, 'MoreCheese Demo: <Name>')` + an action metadata record + migration | comments in `packages/Actions/src/index.ts` |
| **Add UI** (components / dashboards) | `packages/Angular` — components under `src/lib/`, exported from `public-api.ts`; nav items via an application metadata record | comments in `packages/Angular/src/public-api.ts` |
| **Build** | `npx turbo build --filter="@more-cheese-demo/*"` (or `npm run build:packages` standalone) | — |
| **Ship a change** | Changeset (`npx changeset`, ≥ minor if it adds a migration) → PR to `next` | [docs/template-docs/branching.md](docs/template-docs/branching.md) |
| **Release / publish to npm** | Merge the release PR `next` → `main`; the publish workflow does the rest | [docs/template-docs/publishing.md](docs/template-docs/publishing.md) |

**Managing migrations, the rules that matter:** never edit an applied
migration (add a new one); timestamps must increase; no `__mj_*` columns or FK
indexes in your SQL (CodeGen owns those); additive-only within a published
major version. Full rationale: [docs/template-docs/codegen-and-metadata-migrations.md](docs/template-docs/codegen-and-metadata-migrations.md)
and [docs/template-docs/publishing.md](docs/template-docs/publishing.md).

## Documentation index

Everything above in depth: [docs/template-docs/README.md](docs/template-docs/README.md).
The **MemberJunction development guide** — critical rules, entity/data
patterns, CodeGen + migration rules, Angular conventions, style, testing —
is [docs/claude/](docs/claude/README.md) (topic docs with a TOC, referenced
from [CLAUDE.md](CLAUDE.md)). The complete
what-belongs-in-an-app inventory (required vs optional, with the shipped
first-party apps as exemplars): [plans/complete/TEMPLATE-SPEC.md](plans/complete/TEMPLATE-SPEC.md).
