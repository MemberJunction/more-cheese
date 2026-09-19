---
paths:
  - "generated/**"
  - "config/**"
---

# Metadata & mj-sync

Loads when you open anything under `generated/` (the Loom-simulated world) or
`config/` (administrative configuration). These two trees are ~385 JSON files
and they are where this repo's most expensive mistakes have happened — every
footgun below has already cost someone a debugging session.

Authoring guide with worked examples:
[`docs/template-docs/metadata.md`](../../docs/template-docs/metadata.md).
Capture flow (metadata → `V*_Metadata_Sync.sql`):
[`docs/template-docs/codegen-and-metadata-migrations.md`](../../docs/template-docs/codegen-and-metadata-migrations.md).

## 🚨 `mj sync push` runs from the MJ repo cwd — never from here

World data **must** be pushed from the **MJ repo root** with the local CLI, so
the host's `dynamicPackages.server` loads the Common / Accounting / Orders
entity servers. Confirmed orders book subscriptions and journal entries **only**
on that path.

```sh
# from the MJ repo root — never `cd` into more-cheese for this push
MJCLI=packages/MJCLI/bin/run.js
CHEESE=/Users/amith/Dropbox/develop/M5/more-cheese

NODE_OPTIONS="--max-old-space-size=16384" \
  node "$MJCLI" sync push --dir "$CHEESE/generated" --ci --no-interactive
NODE_OPTIONS="--max-old-space-size=16384" \
  node "$MJCLI" sync push --dir "$CHEESE/config" --ci --no-interactive
```

### NEVER pass `--no-app-packages`

It forces `GetEntityObject` to fall back to generic `BaseEntity`, bypassing
`OrderEntityServer` entirely. Journal Entries and Subscriptions are **runtime
side-effects** of `OrderEntityServer.Save()` booking a confirmed order — Loom
does not, and should never, emit static JSON for them. Push with
`--no-app-packages` and confirmed orders land with neither. The push reports
success.

### Heap

Set `NODE_OPTIONS="--max-old-space-size=16384"` for `generated/` (15k+ orders
with deeply nested lines). Without it V8 exhausts the heap mid-sync.

### Geocoding

People and Organizations `.mj-sync.json` set `"push": { "skipGeoCoding": true }`
— their geo is **display-only** (virtual `PrimaryAddress*`). Addresses carry
real `Latitude`/`Longitude` in their JSON, so do **not** skip geo on addresses:
coordinates are already set, which means the provider is never called anyway.
Never author `RecordGeoCode` JSON or SHA hashes by hand.

`--parallel-batch-size` defaults to **10**. Each record saves on an independent
provider (shared connection pool, own transaction stack), exactly like MJAPI
per-request providers. Do not drop it to 1 to work around a shared provider.
Durable AfterCreate (`Common.LogActivity`) defers until that provider's
transaction depth hits 0 — fire-and-forget, not nested inside `Person.Save`.

## 🚨 `RecurrenceMonths: null` is load-bearing — never "tidy" it away

Four annual-membership rows in
[`generated/product-prices/.product-prices.json`](../../generated/product-prices/.product-prices.json)
carry an explicit `"RecurrenceMonths": null`:

```
0FD77933-317D-4BA9-9837-F30A37FE8F76   488480D6-4B47-470B-9BFD-F3EA1FBB9A1F
D5156F09-228F-4731-882C-0FC077A4E768   FF98075B-2C62-45E8-BB3B-5333230EBA99
```

`mj sync push` only applies fields **present** in a record
(`PushService.ts:1163`), so deleting the key does not write `null` — it leaves
the pre-fix `'12'` in any database already pushed. `RecurrenceMonths` is
calendar-month *applicability*, not duration: `'12'` meant "December only" and
rejected list-price rules for the other eleven months. Enforced by an assertion
in [`scripts/check-metadata-closure.mjs`](../../scripts/check-metadata-closure.mjs).

## ICF accounting seed

Lives in `generated/companies` (with `extension` for
`AccountingCompanyProfile`), `gl-accounts`, `gl-account-links`, and
`journal-entry-sequences`. Company-level `GLAccountLink` rows are **required**
for order confirm (AR / Sales / Deferred Revenue / Cash / …) — without them the
booking lifecycle fails.

## Composition axes

All of these persist cleanly through a single-save `mj sync push`, with zero raw
SQL inserts:

- **Event products** — first-class `extension` composition on `generated/products`.
- **Orders** — nested `collections.Lines` on `generated/orders`, with `PersonID`
  on `EventOrderLine` extensions.
- **Payments** — nested `collections.Lines` on `generated/payments`.
- **Committee meetings** — nested `collections`: `AgendaItems`, `Attendance`,
  and `Motions` with `Votes`.

## File organization

- One subdirectory per entity: `.mj-sync.json` (entity name + push/pull options)
  plus `.<records>.json` (an array of `{ "fields": {...} }` objects).
- New records **omit `primaryKey` and `sync`** — mj-sync writes them back on
  first push. Re-pushing is safe (upsert semantics).
- List folders in the root `.mj-sync.json` `directoryOrder` so dependencies push
  in order.
- **Externalize complex JSON** with `@file:` references
  (`"FieldSchema": "@file:schemas/api-key.schema.json"`) rather than escaped
  JSON strings; keep them in typed subfolders (`schemas/`, `templates/`).
- Cross-record references resolve via `@lookup:`, `@parent:`, `@template:`, `@root:`.

In `mj-app.json`, `metadata.directory` is `"generated"` for OpenApp packaging;
`config/` keeps an independent sync and `sqlLogging` root for Explorer-authored
configuration.

## Seeding lookup tables

Never hand-write raw `INSERT`s **as the source of truth**. Author records as
metadata files — version-controlled, readable, upsertable, `@lookup:`-resolvable
— and let the sync→migration capture produce the SQL that ships.

## Applications & nav items

An `Applications` record gives the app UI presence in Explorer. Every
`DefaultNavItems` entry with `ResourceType: "Custom"` needs a `DriverClass` that
exactly matches an `@RegisterClass(BaseResourceComponent, '<DriverClass>')`
component in the Angular package, plus a tree-shaking-prevention export. Exactly
one `isDefault: true` per app.

## Remember what sync is

`mj sync push` is a **single-author, dev-time** tool. Teammates and installs
receive metadata through migrations — never by running sync themselves.
