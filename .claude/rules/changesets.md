---
paths:
  - ".changeset/**"
---

# Changesets

Loads when you open anything under `.changeset/`.

## The three packages move as one

`.changeset/config.json` declares `"fixed": [["@mj-biz-apps/*"]]`. The three
published packages — `more-cheese-entities`, `more-cheese-server`,
`more-cheese-ng` — are version-locked as a single group. **One `minor` anywhere
bumps all three**, so the bump level you pick is a decision about the whole app,
not about one package. List all three in the changeset, at the same level.

## Bump levels

| Level | When |
|---|---|
| **minor** | The PR adds a migration, or changes metadata that ships in a seed. **Required** — a schema or seed change is never a patch. |
| **patch** | Everything else: docs, gates, tooling, content, site. |
| **major** | A breaking change within a published major version. Stop and talk it through first — see the additive-only rule in [`migrations.md`](migrations.md). |

## A migration PR must include a changeset

Minimum minor. This is the rule most often missed, because the migration itself
looks self-contained; it is not — the packages ship against it.

## Write the body for the person doing the install

The house style is specific and verifiable: what was generated, from what, on
what date, against which MJ version, and what it replays cleanly on. Name any
cross-app dependency and its floor (`Depends on bizapps-committees >=1.3.0, whose
SQL Server Metadata_Sync migration seeds the committee roles the membership rows
reference`). The published changelogs are the durable record of that shape — see
[`packages/Entities/CHANGELOG.md`](../../packages/Entities/CHANGELOG.md). Do not point
here at a changeset: they are consumed at release, and the link would die with them.

Avoid a bare "update dependencies" — the changelog is what a host operator reads
when an install fails.

## Commands

```sh
npm run change      # changeset — author one interactively
npm run version     # changeset version — release-time only, not in a feature PR
```

`baseBranch` is `main`, but feature branches cut from and target `next`. See
[`docs/template-docs/branching.md`](../../docs/template-docs/branching.md).
