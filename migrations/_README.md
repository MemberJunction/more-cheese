# migrations/ — Skyway (Flyway-compatible) migrations for this app's schema

Applied in filename order against **your app's schema** at install/upgrade and
during development. Once published, a migration is IMMUTABLE — never edit an
applied file; add a new one (see PUBLISH_NO_BREAK policy in docs/template-docs/publishing.md).

## Naming

    V<YYYYMMDDHHMM>__v<app-version>_<Description>.sql     e.g. V202602120001__v1.0.0_Initial_Schema.sql
    B<YYYYMMDDHHMM>__v<app-version>_<Description>.sql     baseline variant (first schema drop of a new app)
    V<YYYYMMDDHHMM>__v<x.y.x>_Metadata_Sync.sql           metadata seeds captured from `mj sync push`

- Timestamps must be strictly increasing (CI enforces this on PRs).
- Use `${flyway:defaultSchema}` for YOUR schema; literal `__mj` for MJ core rows.
- Do NOT add `__mj_CreatedAt`/`__mj_UpdatedAt` columns or FK indexes — CodeGen does.
- A PR that adds a migration MUST carry a changeset with at least a `minor` bump (CI enforces).

This folder starts EMPTY on purpose — the template ships no schema, so your
first migration is genuinely yours. `EXAMPLE_*.sql.example` is an inert
skeleton to copy for new work; for a complete worked example (table + view +
SPs + entity/field registration) see any shipped BizApps app's baseline
migration. Schema registration (`__mj.SchemaInfo`) is handled by
`metadata/schema-info/` in this template — don't duplicate it here.
See docs/template-docs/codegen-and-metadata-migrations.md for the full authoring loop.

## Migration Format

``` sql
-- ============================================================
-- <YourApp>: <what this migration does> (v<X.Y.x>)
-- Copy to: V<YYYYMMDDHHMM>__v<X.Y.x>_<Description>.sql (timestamp = now, UTC)
-- ============================================================

-- Your schema objects (use the placeholder, never a hardcoded schema name):
-- CREATE TABLE ${flyway:defaultSchema}.Widget (
--     ID UNIQUEIDENTIFIER NOT NULL DEFAULT NEWSEQUENTIALID(),
--     Name NVARCHAR(200) NOT NULL,
--     CONSTRAINT PK_Widget PRIMARY KEY (ID)
-- )
-- GO

-- REMEMBER (docs/template-docs/codegen-and-metadata-migrations.md):
--   * no __mj_CreatedAt/__mj_UpdatedAt columns, no FK indexes (CodeGen adds them)
--   * hardcoded UUIDs for any metadata rows (never NEWID())
--   * after this migration: run codegen, commit the regenerated code + the
--     codegen-emitted SQL folded into this (or a follow-up) migration
--   * add a changeset: npx changeset  (>= minor when a migration is added)
```
