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

## This is settled

Metadata-first through the entity SPs is the approach, and the capture is how it ships. The
alternative — rendering the SQL ourselves from the packs — was considered and **rejected**: it
would mean this app writing its own version of calls that belong to the dependency apps'
procedures, and drifting the moment those procedures change. The INSERT path stays what it is
today: `platform` only, for state the SPs refuse to forge.

So the capture's cost is accepted rather than engineered away. What that means in practice:

- **~22 minutes, by hand, on a database prepared exactly as described above.** Not runnable in CI.
- **It goes stale silently.** Nothing fails when the generator moves ahead of the shipped seed;
  it has drifted five times, most recently by 19,823 rows. Until a gate compares the capture's
  `Total Statements` footer against the tree's record count, checking currency is a manual step —
  do it before any release PR.
- **Re-capture after any generator change that alters row counts or shapes**, following
  `INTEGRATION-RUNBOOK.md` (addendum 2026-07-28) step by step. Steps 3–5 there — the F6 lookup
  rules, F11's Sonar FK cycle, and enabling `sqlLogging` only AFTER the emit — are the ones that
  bite; all three bit again on 2026-07-30 despite being written down.

## A hazard worth remembering

A migration that hand-creates rows the capture also creates will collide on the pinned ID and
**fail a fresh install** — nothing catches it, because it cannot fail on an existing database.
`MetadataSync_Sonar.sql` did exactly this once Sonar moved to metadata delivery, and was deleted
2026-07-30. Before adding any hand-authored metadata migration, check the capture does not already
carry those rows.
