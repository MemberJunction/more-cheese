# Getting started — filling in the template

This repository is a **working, minimal Open App** that doubles as a template.
Everything runs as-is (schema `sample_app`, packages `@mj-sample-app/*`), so you
can try the whole loop first and rename after — or rename first. `TODO(template)`
comments mark every fill-in point.

## 1. The rename checklist

| What | Where | Notes |
|---|---|---|
| App id / display name / description / icon | `mj-app.json` (`name`, `displayName`, `description`, `icon`, `color`) | `name` is the permanent unique id |
| Publisher + repository URL | `mj-app.json`, every `packages/*/package.json` `repository.url`, root `package.json` | CI validates `repository.url` (npm provenance) |
| npm scope `@mj-sample-app/*` | all `packages/*/package.json` names + cross-deps, `mj-app.json` `packages` block, root `package.json` `build:packages`/`test` filters, `.changeset/config.json` `fixed`, `.github/workflows/*` + `.github/scripts/*` greps, `ci/merge_main_and_update_lock.mjs`, `mj.config.cjs` `entityPackageName` | `grep -r "mj-sample-app" .` finds them all |
| Schema `sample_app` | `mj-app.json` `schema.name`, `mj.config.cjs` (`NameRulesBySchema`, `SQLOutput.schemaPlaceholders`), root `package.json` `mj:migrate`/`mj:migrate:convert`, `metadata/schema-info/.schema-info.json` | Lowercase + underscores. `__`-prefixed names are reserved for first-party MJ apps |
| Entity name prefix `Sample App: ` | `mj.config.cjs` + `metadata/schema-info/.schema-info.json` `EntityNamePrefix` | Prevents entity-name collisions across apps |
| Bootstrap exports `LoadSampleAppServer` / `LoadSampleAppClient` | `mj-app.json` `startupExport`s ↔ `packages/Server/src/index.ts` / `packages/Angular/src/public-api.ts` | Must match exactly — this is how MJAPI/MJExplorer load your code |
| `mjVersionRange` | `mj-app.json` | Set to the MJ major you build against; the publish workflow re-derives it from your `@memberjunction/core` peer dep |

## 2. Decide which blocks you keep

Every capability block is optional (see `mj-app.reference.jsonc`). Delete what
you don't need — a manifest-only app is valid:

- No database tables? Delete `schema` + `migrations` blocks, `migrations/`, and the DB steps below.
- No server code? Delete `packages.server`, `packages/Server`, `packages/CoreEntitiesServer`, `packages/Actions`.
- No UI? Delete `packages.client` + `packages/Angular`.
- No seeded metadata? Delete the `metadata` block + `metadata/`.

## 3. First dev loop

Development happens **inside a MemberJunction checkout** — follow
[linking-to-mj.md](linking-to-mj.md) to wire this repo in. Once linked:

```sh
# from the MJ repo root
npx mj migrate --schema sample_app --dir packages/dev-apps/mj-sample-open-app/migrations   # apply app migrations
npx mj codegen                                                                             # generate entities/resolvers/forms
npx turbo build --filter="@mj-sample-app/*"                                                # build the app packages
# then start MJ's API + Explorer and your app is live
```

After codegen, commit the generated code together with its migration —
that convention is the backbone of the whole system:
[codegen-and-metadata-migrations.md](codegen-and-metadata-migrations.md).

## 4. Standalone build (no MJ checkout, no DB)

`npm install && npm run build:packages` works in a bare clone — the stub
packages compile without a database. Use it as a CI smoke check; real
development needs the linked setup above.
