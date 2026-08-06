# Schema contract — catching dependency drift before install

## The problem

The generator inserts into tables it **does not own**: MJ core (`__mj.*`) and the composed
BizApps (`__mj_BizApps*`). Our `projects/<p>/seed-mapping.mjs` quietly *assumes* their shape —
which columns exist, which values a CHECK allows, which seeded lookup names resolve. When
one of those apps changes its data model, our assumptions rot **silently**: the suite stays
green and only a real ~13-minute install fails. That's exactly how the `FormDistribution.Status='Open'`
bug (runbook F9) reached an install before anyone noticed.

The schema contract makes those assumptions **explicit and checkable in milliseconds.**

## How it works — three pieces

**1. Extract our claims** (`engine/contract.mjs → extractClaims`) — automatic, from the
mapping itself. Running each `MAPPING[pack][t].columns(row)` over the emitted rows yields:
the exact columns we INSERT into (union across rows — some are conditional), and the
distinct string literals we write into each column. `PREAMBLE` is parsed for the
`WHERE Name = N'…'` lookups we depend on. Nothing is hand-maintained.

**2. Capture the truth** (`cli/capture-contract.mjs`) — introspects a real reference
install and writes `contract/schema-contract.json`: per table, every column's
nullability / has-default / is-computed; per enum CHECK, its allowed value set; the seeded
lookup names we reference. It records the dependency versions it was captured at. Think of
it as a **lockfile for the dependency schema.**

**3. Compare, every build** (`test.mjs` gate *"seed assumptions match the dependency-schema
contract"* → `checkClaims`) — pure, no DB, runs in the normal suite. It fails on:
- a column we emit that the real table no longer has;
- a column that's NOT NULL / no-default / not-computed that we don't supply (a new required
  column app-side → our insert would fail);
- a literal we emit into a CHECK column that isn't in the allowed set (the `'Open'` bug);
- a lookup name our preamble needs that doesn't exist (a renamed Role/IssueStatus/Entity).

## The refresh ritual — the only manual step

Re-capture **only when you deliberately bump a dependency version**. The git diff on
`schema-contract.json` *is* the drift report:

```sh
MJ_SA_PASSWORD=… node cli/capture-contract.mjs --db <a-fresh-install-at-the-new-versions>
git diff datagen/contract/schema-contract.json    # ← read this: it's exactly what changed
```

Then adapt `seed-mapping.mjs` to match and commit both together. The reference install
must have the full stack applied (all dependency migrations + our seed migrations), and a
build's `out/packs` must exist (it defines which tables to introspect). `MJ_SA_PASSWORD`
comes from the environment — never hard-code it.

## Scope & limits (honest)

- **This is defense-in-depth, not a replacement for the install.** The contract is only as
  fresh as the last capture; the version pins in `mj-app.json` plus capture-on-bump keep it
  synced, and a full install remains the ultimate backstop. What the contract buys is making
  the *common* case fail fast and the *changes* reviewable.
- **CHECK parsing** handles the OR-equality / IN enum form these apps use; a range/function
  CHECK doesn't reduce to a value set and simply isn't represented (that column is skipped).
- **Value-checking only covers values we actually emit.** A value the app removes that we
  never write is a harmless blind spot; any new value a future scenario emits gets checked
  the moment it appears (the gate runs on every build).
- **Computed columns** (e.g. `Person.DisplayName`) are captured as `computed:true` and
  excluded from the required-column check — we must not insert into them.

## Relationship to the other drift guards

| Guard (in `test.mjs`) | Checks | Against |
|---|---|---|
| `schema DDL covers every INSERT column` (6b) | playground packs 01–10 self-consistency | our own `emit-schema` stand-in DDL |
| `frozen migration matches generator shapes` (6c) | `morecheese_*` tables we own | our frozen baseline migration |
| `seed assumptions match the dependency-schema contract` (6d) | **all packs' dependency + core tables** | **the real captured schema** |

6b/6c check the generator against *itself* / *our* migration. 6d is the only one that
checks against the **real external schema**, and it's the only guard covering the
`platform` (11) and `sonar` (12) packs, which write to real `__mj` / `__mj_BizAppsSonar`
tables the shim deliberately doesn't stand in.
