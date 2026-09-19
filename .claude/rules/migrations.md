---
paths:
  - "migrations/**"
  - "migrations-teardown/**"
---

# Migrations

Loads when you open anything under `migrations/` or `migrations-teardown/`.

This repo's loop-level detail — capturing CodeGen SQL, metadata-sync migrations,
what to fold in versus what CodeGen re-applies everywhere —
[`docs/template-docs/codegen-and-metadata-migrations.md`](../../docs/template-docs/codegen-and-metadata-migrations.md).

## 🚨 Never edit an applied migration

Add a new `V*` file instead. Editing one that has been applied or published
changes its checksum and breaks **every** existing install. Within a published
major version, changes are **additive only** — no drops, no renames, no narrowed
types. A breaking change forces a major bump
(MJ's `packages/OpenApp/PUBLISH_NO_BREAK_POLICY.md`).

## `migrations-teardown/` is generated

Never hand-edit it. Regenerate with `npm run generate:teardown`; its structure is
gated by `npm run test:teardown`.

## Order matters

1. Write the migration.
2. Run migrations, **then** CodeGen.
3. **Only then** write TypeScript against the new fields — against generated
   types, never `.Get()`/`.Set()` weak typing.

Commit regenerated code **together with** the migration that caused it.

## Authoring rules

- **Naming**: `V<YYYYMMDDHHMM>__v<app-version>_<Description>.sql`. Timestamps
  strictly increasing — gated by `npm run lint:migrations`.
- **`${flyway:defaultSchema}`** for this app's schema, never a hardcoded schema
  name. Literal `__mj` only for rows inserted into MJ core tables.
- **Hardcoded UUIDs** for metadata rows — never `NEWID()`, which breaks
  reproducibility across installs.
- **Never include what CodeGen owns**: no `__mj_CreatedAt` / `__mj_UpdatedAt`
  columns, no FK indexes (`IDX_AUTO_MJ_FKEY_*`).
- **One `ALTER TABLE` per table** — comma-separate multiple `ADD` clauses rather
  than repeating the statement.
- **`sp_addextendedproperty` (`MS_Description`) for every new column** except PKs
  and FKs. CodeGen turns these into entity-field descriptions:

```sql
EXEC sp_addextendedproperty @name = N'MS_Description', @value = N'What this column means',
  @level0type = N'SCHEMA', @level0name = N'${flyway:defaultSchema}',
  @level1type = N'TABLE',  @level1name = N'MyTable',
  @level2type = N'COLUMN', @level2name = N'MyColumn';
```

- **Value-list changes**: alter the CHECK constraint in a migration (drop then
  re-add); CodeGen regenerates the TypeScript union from it.

## A migration PR needs a changeset

Minimum **minor**. See [`changesets.md`](changesets.md).

## The gates that read this directory

All run without a database, and all run in CI:

```sh
npm run lint:migrations     # ordering is consistent across the chain
npm run lint:distribution   # shipped SQL installs on a stranger's database
npm run test:teardown       # teardown is structurally sound
```
