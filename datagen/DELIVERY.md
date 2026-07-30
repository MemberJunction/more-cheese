# How demo data ships — the delivery model

The ruling is **metadata-first**, decided 2026-07-24, and it lives in code as
`DELIVERY` / `deliveryOf()` in `engine/seed-mapping.mjs`. This document exists because that
ruling was only readable as a comment inside the emitter, which is not where anyone looks when
asking "is the install seed current?".

## Two paths, and only two

| path | ships | why |
|---|---|---|
| **metadata** (the default) | every domain pack + `sonar` | goes through the entity SPs, so the apps' CHECK constraints, FKs and `RecordChange` behave exactly as they would if a person had typed the rows in |
| **insert** (pinned, `platform` only) | `platform` | forges state the entity layer *refuses* to forge |

```js
export const DELIVERY = { platform: 'insert' };
export const deliveryOf = (pack) => DELIVERY[pack] ?? 'metadata';
```

`platform` is pinned to `insert` **permanently**, and for a real reason rather than convenience:
it writes direct `__mj.RecordChange` audit rows and back-dated `Conversation.__mj_CreatedAt`
timestamps. A push through the entity SPs would reject those or re-stamp them "now", destroying
the "someone has been using this instance" effect that is the pack's entire purpose.

**The JSON packs under `out/packs/` are not a delivery path.** They are the generator's
intermediate — the single source every emitter reads from.

## What is generated and what is captured

Everything in this pipeline is deterministic from `(project, seed, release, ruleset)` **except one
step**:

```
ruleset + seed  ──generate──▶  out/packs/*.json          deterministic
out/packs       ──emit-mjsync──▶  metadata/ (mj-sync tree)   deterministic
out/packs       ──emit-data-migration──▶  Seed_11_platform.sql   deterministic
metadata/       ──mj sync push + SQL logging──▶  MetadataSync_p01/p02.sql   ⚠️ CAPTURED
```

That last line is a **photograph of one push against one database**. It is what
`docs/template-docs/codegen-and-metadata-migrations.md` prescribes ("push it to your dev
database, then capture the resulting SQL"), and it is sound advice for the case those docs were
written for: a human hand-editing a few dozen application and lookup records.

We push **~122,000 generated records**, and at that scale the capture is the weakest link:

- it needs a database with the six dependency apps installed and **no demo data**, or the SPs
  emit `spUpdate` instead of `spCreate` and the migration will not install on a fresh database;
- it takes ~20 minutes and cannot run in CI;
- it goes stale silently on every generator change — it has done so five times, most recently
  falling five passes behind while every gate stayed green.

## The loop, in order

```sh
node datagen/cli/build.mjs --n 2500 --seed 42 --release 2026-07-31   # must be GREEN
node datagen/cli/emit-mjsync.mjs --metadata-out ../metadata          # the metadata tree
node datagen/cli/emit-data-migration.mjs                             # platform seed (insert path)
```

Then, only when the shipped seed needs refreshing, the captured step — see
`INTEGRATION-RUNBOOK.md` addendum 2026-07-28 for the full procedure, including the purge rules
(F6 lookups, F11 Sonar's circular model tables) and the GO-boundary split.

## Which artefact answers which question

| question | look at |
|---|---|
| does the data satisfy its own rules? | `cli/validate.mjs` — the gates, run by `build.mjs` |
| will it load into a real database? | a `mj sync push` of `metadata/` — only a push resolves `@lookup:` references |
| does it look right to a human? | render it in Explorer — neither of the above can tell you that "Rue Dairy" is not a street |
| what does a fresh install get? | `migrations/` — the baseline, CodeGen migrations, `MetadataSync_p01/p02`, `Seed_11_platform` |

Those are three genuinely different checks and each has caught what the others could not: the
gates caught a dangling committee term, a push caught 3,191 address links whose entity lookup
was wrong, and rendering caught ISO-prefixed state codes and English street names under Spanish
prefixes.

## Known tension with the template docs

Two documented rules do not fit a generated app, and we knowingly diverge:

- **"Never edit an applied migration."** We overwrite `MetadataSync_p01/p02` and re-emit
  `Seed_11_platform.sql` on every data change. Legitimate only under the team ruling that
  installs are treated as **fresh until 1.0**; after 1.0 each data change must become a new
  additive migration instead.
- **"Push, then capture."** Correct at hand-authored scale, the weakest link at ours.

## Recommended next step

Replace the capture with a **generated** metadata migration — an `emit-metadata-migration.mjs`
that renders the same `spCreate` calls from the packs. That would:

- keep the metadata-first ruling exactly as it is;
- make the shipped seed reproducible in seconds instead of 20 minutes;
- allow CI to verify it with an emit-and-diff check, so it can never silently rot;
- be provable: regenerate the OLD data with it and diff byte-for-byte against the committed
  capture.

Until that exists, the seed's currency has to be checked by hand — which is the single largest
source of process friction in this repo.
