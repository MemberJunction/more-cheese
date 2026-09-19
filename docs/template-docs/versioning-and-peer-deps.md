# Versioning & peer dependencies

## One version for the whole app

All `@mj-biz-apps/*` packages version **together** (fixed versioning): the
`.changeset/config.json` `"fixed": [["@mj-biz-apps/*"]]` entry makes
`changeset version` bump every package to the same number, and `npm run version`
(`changeset version && npm run sync:app-version`) copies that number into
`mj-app.json` `"version"` — which must match the GitHub release tag. One app =
one version, everywhere.

Bump sizes follow the content (CI + the publish workflow enforce/verify):

| Change | Bump |
|---|---|
| New migration (additive schema/metadata) | **minor** (minimum — CI enforces) |
| Breaking change (see publishing.md no-break policy) | **major** |
| Code-only fix, no migration | patch |

Declare the bump in your PR with `npx changeset`. Cutting the release itself is
[`docs/release.md`](../release.md).

## The three kinds of dependency (see the real examples in `packages/*/package.json`)

| Dependency on… | Declare as | Version spec | Why |
|---|---|---|---|
| A **sibling package of this app** (e.g. `@mj-biz-apps/more-cheese-entities` from `Server`) | `dependencies` | **exact** (`1.1.0`) | Siblings ship in lock-step (fixed versioning); an exact pin means an install always gets the matched set. A caret here lets npm resolve a sibling to a *later* release than the one the package was built against |
| **`@memberjunction/*`** | `peerDependencies` | caret range (`^6.1.2`) | The HOST provides MJ exactly once. A hard dep could nest a second copy of `@memberjunction/global`/`core`, which splits MJ's class-factory registry and silently breaks registration — the single-copy invariant |
| **`@angular/*`** | `peerDependencies` | range (`>=21.0.0 <22.0.0`) | Same reasoning; the host Explorer owns the Angular version |
| Ordinary libraries the package truly owns (e.g. `zod`) | `dependencies` | caret | Normal npm semantics |
| Build tooling (`typescript`, `@angular/compiler-cli`) | `devDependencies` | caret/pinned | Never shipped |

`npm run lint:peer-ranges` gates the peer rows: it refuses **any** exact version
in a `peerDependencies` block (an exact peer is a compatibility claim no host can
satisfy), and requires every `@memberjunction/*` peer to be exactly `^<floor>`
where `<floor>` is the `>=` floor of `mj-app.json`'s `mjVersionRange`. The exact
sibling pin in row 1 carries no gate — it is a review rule.

Worked examples in this repo:
- `packages/Entities/package.json` — MJ peers only + `zod`
- `packages/Server/package.json` — exact-pinned sibling dep + MJ peers
- `packages/Angular/package.json` — exact-pinned sibling dep + Angular and MJ peers

## What actually pins the versions

Nothing at the repo root forces a resolution for consumers, and nothing needs
to. Exactly two places carry the versions, and they must agree:

| Where | What it pins | For whom |
|---|---|---|
| Root `package.json` `devDependencies` | the `@memberjunction/*` and `@angular/*` versions a **standalone** `npm install` + `npm run build:packages` resolves | this repo's own build and CI |
| Each `packages/*/package.json` `peerDependencies` | the range a **consumer** (MJAPI / MJExplorer) must satisfy | anyone installing the published packages |

Peers are not installed, so without the root devDependencies nothing here would
compile on its own; and the root devDependencies never reach a consumer, so
without the peer ranges an install could silently sit on the wrong MJ. Bump both
together when you move to a new MJ release.

When the app is **linked inside an MJ checkout** neither of these resolves MJ —
the workspace does, which is the entire point of the single-copy invariant. See
[linking-to-mj.md](linking-to-mj.md).

## `mjVersionRange`

The manifest's `mjVersionRange` declares which MJ versions the app supports.
You set it once; `scripts/sync-app-version.mjs` then **re-derives** it from the
`@memberjunction/core` peer dependency in `packages/Entities/package.json`
(`>=<that version> <next-major>`), so keeping the peer dep honest keeps the
manifest honest. `publish.yml` runs the same script with `--check` and refuses
to publish a manifest that disagrees.

## Upgrading the MJ baseline

1. Bump every `@memberjunction/*` peer dep **and** the matching root
   `devDependencies` to the new version.
2. Re-run the loop (migrate → codegen → build) against an MJ instance of that
   version; commit regenerated code.
3. Changeset: minor (or major if you drop support for an older MJ).
