# schema-info — intentionally empty (naming rules live in mj.config.cjs)

This app does NOT ship a SchemaInfo metadata record. CodeGen auto-creates the
`__mj.SchemaInfo` row for each schema it meets, and this repo's naming rules
(`mj.config.cjs` `newEntityDefaults.NameRulesBySchema` — the `MoreCheese: `
prefix for every `morecheese_*` schema) take precedence over the DB row, so a
shipped record adds nothing — and it actively breaks dev-linking: the mjdev
link flow runs codegen (which auto-creates the row with a random UUID) before
the first metadata sync, so a shipped record with a pinned UUID then collides
on the SchemaName unique key (`IX_SchemaInfo`).

To set a human-readable `Description` (or per-schema prefix overrides) on the
SchemaInfo rows, do it as an idempotent `UPDATE ... WHERE SchemaName = '...'`
inside a `V*_Metadata_Sync` migration — never as an inserted metadata record.
