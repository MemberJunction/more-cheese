# metadata/

MJ metadata authored as files and pushed with `mj sync` — the dev-time source
of truth (installs receive it as `V*_Metadata_Sync.sql` migrations instead).

**How to format and write metadata records:**
[`docs/template-docs/metadata.md`](../docs/template-docs/metadata.md).

⚠️ **`schema-info/` requires fill-out before it does anything**: it ships as
an inert `.template` file with TODO placeholders that `mj sync` cannot see.
Follow `schema-info/README.md` (copy → `.schema-info.json`, fill the TODOs,
generate a stable UUID) to register your schema — until then a sync pushes
nothing for it and your entity-name prefix isn't applied. Keep the folder
either way (the sync loop needs at least one entity folder listed in
`directoryOrder`).

Only dot-prefixed `.json` files inside folders listed in `.mj-sync.json`
`directoryOrder` are treated as records — don't park drafts in this tree.

## `demo-data/` — the generated MoreCheese dataset (mj-sync form)

The full canonical demo dataset (seed 42 · 2,500 members · ~90k records) emitted by
`datagen/cli/emit-mjsync.mjs --metadata-out metadata/demo-data`. It is a **self-contained
sync root** and is deliberately NOT listed in this folder's `directoryOrder` — a routine
`mj sync push --dir=metadata` will never touch it. Load it explicitly, dev DBs only:

    npx mj sync push --dir=metadata/demo-data

⚠ push is a FULL RECONCILE per entity scope (can delete rows) — never over real data.
⚠ entities must exist first (apps installed + CodeGen run) — see datagen/INTEGRATION-RUNBOOK.md.
App-seeded lookups (committee Roles, issue Statuses) are referenced BY NAME (`@lookup:`),
so this tree loads correctly on real app installs AND playgrounds — no caveats.
Regenerate any time — pinned IDs make a re-push a stable upsert of the same records.
