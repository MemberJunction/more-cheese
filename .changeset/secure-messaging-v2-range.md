---
"@mj-biz-apps/more-cheese-entities": patch
"@mj-biz-apps/more-cheese-server": patch
"@mj-biz-apps/more-cheese-ng": patch
---

Accept `bizapps-secure-messaging` 2.x

`mj-app.json`'s `mj-secure-messaging` dependency moves from `>=1.0.0 <2.0.0` to
`>=2.0.0 <3.0.0`.

**Why the old cap became wrong.** `<2.0.0` was correct when written — ordinary major-pinning
against a 1.x app. It went stale the moment secure-messaging released `v2.0.0`. The cap does not
announce that a newer major exists: `ResolveDependencyVersion`
(`install-orchestrator.ts:1552`) resolves with `semver.maxSatisfying`, and because the range is
still *satisfiable* it returns `1.1.0` — the newest tag beneath the cap — rather than the
"no published version satisfies" error that an unsatisfiable range would raise. `v1.1.0`
declares `mjVersionRange: ">=5.45.0 <6.0.0"`, so when `InstallDependencies` recurses into it the
host gate at `install-orchestrator.ts:247` fails and the **entire `mj app install` of
more-cheese aborts** with `Failed to install dependency: MJ version 6.1.2 does not satisfy the
required range '>=5.45.0 <6.0.0'`. The failure is loud, but the message names neither
secure-messaging nor the existence of `v2.0.0`, so it does not point at its own fix.

**Why 2.x is safe to accept.** The major was driven by the MJ floor move and package-level
security fixes, not by anything more-cheese couples to. Between `v1.1.0` and `v2.0.0` the
manifest differs in exactly one field, `mjVersionRange`: the schema name
(`__mj_BizAppsSecureMessaging`), all six package names, their roles and startup exports, and the
`mj-bizapps-common` dependency are unchanged. Both tags carry the same single migration,
`V202607201423__v1.0.0__Baseline_Schema.sql`, so the schema is identical, and the three entity
names this repo's `generated/` pushes into — `MJ_BizApps_SecureMessaging: Secure Messages`,
`Secure Threads` and `Portal Sessions` — are all still present at `v2.0.0`.

With this change all ten declared dependencies resolve to their newest published tag and all ten
pass the MJ 6.1.2 host gate.

Patch rather than minor: no migration is added (`docs/template-docs/branching.md` — minor is the
floor for a migration, not for a dependency move).
