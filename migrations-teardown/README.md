# `migrations-teardown/`

What `mj app remove` runs to retire MoreCheese from a host, beyond what MJ retires by itself.

One file, `V001__Retire_MoreCheese_Core_Rows.sql`, **generated** by `scripts/generate-teardown.mjs`
(`npm run generate:teardown`). Do not hand-edit it: `scripts/generate-teardown.spec.mjs` compares the
checked-in file byte-for-byte against a fresh run, so an edit fails CI.

---

## Why this directory exists

`mj app remove` is not doing nothing. MJ's install orchestrator walks the foreign-key graph out from
`__mj.Entity` rows whose `SchemaName` is this app's, retires app-owned `Application` rows and
`SchemaInfo`, and drops that schema.

**It operates on one schema — and MoreCheese has three.**

`mj-app.json` declares `schema.name: "morecheese_members"`. The baseline migration
`B202607141200__v1.0.0_MoreCheese_Baseline.sql` additionally creates `morecheese_events` and
`morecheese_learning`, as *literal* schema names (`mj.config.cjs` maps placeholders only for
`morecheese_members` and `__mj`, so those two have no placeholder and never will). MJ has never heard
of them.

So without this directory, a remove leaves behind:

| Survives a `mj app remove` | Count |
|---|---|
| `morecheese_events` + `morecheese_learning` schemas — tables, views, CRUD procs, triggers, rows | 2 schemas, 7 tables |
| `__mj.Entity` rows for those two schemas' entities, and every `EntityField` / `EntityPermission` / `EntityRelationship` / `EntitySetting` / `EntityFieldValue` / `ApplicationEntity` row hanging off them | 7 entities |
| Everything `config/` seeds — none of it descends from an `Entity` row, so MJ's root predicate cannot reach it | 410 records |

Every one of those carries a **fixed UUID**. The next install re-inserts the same ids and collides on
the primary key — which is why, without this, every re-test after the first starts dirty.

---

## What the teardown removes

1. **The application configuration `config/` seeds** — 410 records across 36 directories: users, user
   roles, user applications, user views, dashboards and dashboard categories, queries and query
   categories, projects, conversations and conversation artifacts, resource permissions, credentials
   and credential types, file-storage accounts/providers/permissions, content sources and types, AI
   vendors / models / model-vendors, vector indexes, and the Sonar scoring configuration.

   Each is seeded as an **(entity name, id)** pair and resolved to a table through the host's own
   `__mj.Entity` at apply time. Nothing here hardcodes a table name, so a sibling app that installed
   itself into a different schema still resolves — and the generator does not need to know that
   `MJ_BizApps_Sonar: Factors` lives in `__mj_BizAppsSonar.Factor`.

2. **All 12 `__mj.Entity` rows the baseline creates**, across all three schemas (5 in
   `morecheese_members`, 3 in `morecheese_events`, 4 in `morecheese_learning`).

   The 5 in the declared schema are retired by `mj app remove` too. Repeating them is deliberate: the
   entire subject here is that MJ's remove is single-schema, and a teardown whose correctness depends
   on guessing which schema MJ got to first is one nobody can reason about. Both deletes are
   idempotent — whichever runs second finds nothing.

3. **The `__mj.Application` row** the baseline creates (`3C46B3A5-…`).

4. **Everything the foreign-key graph says depends on the above**, discovered at apply time.

5. **The `morecheese_events` and `morecheese_learning` schemas**, and every object in them —
   enumerated from `sys.objects` on the host, not from a list written into the file, so a table added
   to either schema by a later migration is torn down with nothing to keep in step.

---

## What it deliberately leaves

### The 121,661 demo records under `generated/` — **the open question on this file**

`generated/` is world data for **nine sibling apps' schemas**: orders, forms, tasks, issues, common,
accounting, committees, secure-messaging, plus MoreCheese's own. Rows in MoreCheese's own three
schemas go away with those schemas. **Rows in the sibling schemas do not, and this file does not
remove them.**

That is a scope decision, and it is a real gap rather than a settled one:

- Those records carry **deterministic UUIDs** from a seeded generator, so the same PK collision that
  motivates this whole file applies to them on a re-install.
- But they are rows in **other apps' tables**. Deleting them is the ownership question caliber's `#219`
  is about, from the other side — and unlike the config records, there are 121,661 of them, which is
  a different engineering problem (seeding a doomed set with 122k literal GUIDs, batched under T-SQL's
  1000-row `VALUES` cap, inside a single transaction).

**This needs a decision before v1 ships.** See the report for options.

### Other deliberate omissions

- **Any row a nullable foreign key points at ours with.** That row belongs to the customer and merely
  *references* ours; the reference is released (`SET NULL`) and the row kept. Deleting a host's action
  execution log because they ran our query would destroy data that is not ours to destroy.
- **`morecheese_members` itself.** MJ drops it. A second `DROP SCHEMA` would fail on a condition that
  is not an error, and MJ rolls the whole teardown back on any error.
- **PostgreSQL.** No `migrations-pg/` is checked in, so a PG host cannot install MoreCheese and a PG
  teardown would have nothing to tear down. Shipping an untested one is a mistake this estate has
  already made once.

---

## How it orders its deletes: it does not

This is the lesson inherited from `bizapps-caliber`, and it is the reason the file looks the way it
does rather than being a list of `DELETE … WHERE ID IN (…)`.

Caliber shipped the naive version first: a flat delete list in **reverse seed order**, reasoning that
the seed inserts parents before children so the reverse deletes children before parents. That is true
of the rows the *seed* created and false of everything else. A real installation also holds **runtime
children** the seed never wrote — action execution logs, prompt and agent runs, user-application
grants, dashboard state, conversation details, scheduled-job runs.

**11 of caliber's deletes were blocked on foreign keys on a used database, while passing cleanly on a
pristine canary** — the blind spot a canary exists to remove. MJ rolls the teardown back on any error
and **drops the app schema anyway**, so the customer outcome was: schema gone, every targeted row
still present, app marked `Error`.

So this file orders nothing by hand. It seeds a doomed set and lets a generic engine discover
dependents from `sys.foreign_keys` **at apply time**:

- a **nullable** reference is `SET NULL` — the row is the customer's and merely points at ours;
- a **NOT NULL** reference is deleted and **joins the doomed set**, so its own dependents are handled
  too.

Deletes then run in a real topological order computed from the FK graph (discovery depth is *not* a
topological order), deepest first, keyed on **schema + table** rather than table name alone. Both
loops are bounded and `THROW` rather than half-finishing. The plan is printed before anything is
destroyed, the way MJ's own `ReportTeardownPlan` does.

### Where this diverges from caliber

Caliber's engine filters dependent discovery to parents **in the core schema**, because every row it
dooms is a core-schema row. Ours are not — the doomed set spans `__mj`, `__mj_BizAppsSonar`, and
whatever schema each `config/` entity resolves to. The filter here is on **the doomed set itself**,
which is strictly more general and reduces to caliber's behaviour when every doomed row is in one
schema.

---

## Runtime contract

MJ's `HandleTeardown` reads `.sql` files from this directory, sorted by filename, and executes **each
as one statement inside one transaction**, rolling everything back on error. Consequences:

- **No `GO`.** There is no batch splitter; a `GO` is a syntax error, not a separator.
- **Exactly one placeholder is substituted: `${mjSchema}`.** Skyway is not involved, so
  `${flyway:defaultSchema}` would ship as a literal string. This is why `morecheese_events` and
  `morecheese_learning` appear as literals — and it is enforced by
  `scripts/check-distribution-seed.mjs`, which allows only `${mjSchema}` in this directory.
- **`VALUES` is capped at 1000 rows**, so the seed is emitted in batches of 500.

---

## Regenerating

```sh
npm run generate:teardown    # rewrites V001__Retire_MoreCheese_Core_Rows.sql
npm run test:teardown        # DB-free structural check; fails if the file is stale or hand-edited
```

Regenerate whenever **`config/`** gains or loses a record, or the **baseline** gains an entity. The
generator reads:

| Source | What it takes |
|---|---|
| `config/*/.mj-sync.json` | the mj-sync entity name for each directory |
| `config/*/.*.json` | every `primaryKey.ID`, at any nesting depth |
| `migrations/B*.sql` | the 12 `__mj.Entity` ids and the `__mj.Application` id |

It does **not** read a seed migration, unlike caliber's generator — there is none yet
(more-cheese #30 dropped them; they return when the build engineer cuts the release seed). Reading
`config/` directly means the teardown is correct *before* the seed exists, and stays correct when it
lands, because both are derived from the same records.

A directory whose `.mj-sync.json` is missing or declares no `entity` is a **hard error**, not a skip:
a skipped directory is a set of rows stranded on every host's uninstall, silently.

---

## ⚠️ This has never been run against a database

It was generated and reviewed statically. `npm run test:teardown` checks structure only — no `GO`,
only `${mjSchema}`, bounded loops, `XACT_ABORT ON`, nullable-vs-NOT-NULL handling, schema+table
keying, drop ordering, and that the checked-in file matches a fresh generation. It **cannot** prove
the SQL runs, that the FK engine converges on real data, or that the drop order survives inbound
references nobody here has seen.

**Before v1 ships it must be applied against a *used* database** — one with runtime history, not a
pristine canary. That distinction is the entire caliber lesson: the naive version passed on a canary
and failed on 11 deletes in production.
