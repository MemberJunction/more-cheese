---
paths:
  - "**/*.ts"
---

# MemberJunction data access & performance

Reading and writing MJ data: entity objects, `RunView`, save/delete semantics,
caching, and the performance choices that matter.

## Create entity objects through `Metadata` — never `new`

`new EntityClass()` bypasses MJ's class factory and any registered subclass
overrides.

```typescript
const md = new Metadata();
const person = await md.GetEntityObject<PersonEntity>('Person', contextUser);
```

Use the generic parameter for full typing (`GetEntityObject<T>`, `RunView<T>`,
`Load<T>`).

**Server-side code always passes `contextUser`** — to `GetEntityObject` *and*
`RunView`. The server serves many users; omitting it breaks isolation and
auditing. Client-side Angular may omit it (context is ambient).

## `RunView` does not throw

```typescript
const rv = new RunView();
const result = await rv.RunView<PersonEntity>({
    EntityName: 'Person',
    ExtraFilter: `LastName='Smith'`,
    OrderBy: 'FirstName ASC',
    ResultType: 'entity_object'
}, contextUser);
if (result.Success) { const people = result.Results ?? []; }
else { LogError(result.ErrorMessage); }
```

Check `result.Success` / `result.ErrorMessage`. A try/catch around `RunView`
catches nothing.

- Batch independent queries with **`RunViews`** (plural) — one round trip, not N.
- Never call `RunView` inside a loop. Load the range once, bucket client-side.
- Prefer the view's denormalized fields (`run.Model`) over a second lookup by ID
  (`run.ModelID` → query).

## `Save()` / `Delete()` return booleans

They do **not** throw on logical failures — validation, permissions, FK
violations all come back as `false`. Check the return value, and read the error
from `entity.LatestResult?.CompleteMessage` (not `.Message`; `CompleteMessage`
combines everything).

## The spread-operator trap

`BaseEntity` fields are getters, and spread skips getters. `{ ...entity }`
silently yields an object with **no** field values. Use `{ ...entity.GetAll() }`.

## Looking up entity definitions

`md.EntityByName(name)` — case-insensitive, trimmed, O(1). Never
`md.Entities.find(e => e.Name === …)`, a case-sensitive scan that silently
misses. Guard the `undefined` return. Iterate `md.Entities` only when you
genuinely need all of them.

## Entity naming — the `MJ: ` prefix

Newer MJ core entities carry an `MJ: ` prefix (`'MJ: AI Agent Runs'`, not
`'AI Agent Runs'`); older ones do not. An unprefixed name throws
`Entity ... not found in metadata`. Verify against the generated
`entity_subclasses.ts` — the `@RegisterClass` JSDoc shows each entity's exact
name.

This app's own entities take the `MoreCheese: ` prefix via
`SchemaInfo.EntityNamePrefix` plus `mj.config.cjs` `NameRulesBySchema`. That
prefix is what prevents cross-app collisions.

## Provider awareness

`new Metadata()` resolves to the process-global provider. Inside a class that
owns a provider (`ProviderBase`, `BaseEngine`, `BaseEntity`) use `this` /
`this.ProviderToUse`. In helpers, accept an optional
`provider?: IMetadataProvider` and fall back to the global explicitly. Global is
fine in single-provider apps, CLI scripts, and bootstrap code.

## Record Changes — don't build your own versioning

MJ tracks all record changes automatically unless disabled per-entity. Query the
Record Changes entities instead of writing a custom audit trail.

## User preferences live in `UserInfoEngine`, not `localStorage`

`localStorage` is per-browser — preferences die on a new machine.
`UserInfoEngine.Instance` (from `@memberjunction/core-entities`) writes to
`MJ: User Settings`: per-user, server-side, cached in memory so reads are
synchronous. Key convention `mj.<feature>.<prefName>`, JSON-serialized, with a
`v1` suffix when the shape may evolve. `localStorage` is acceptable only for
auth-provider tokens and genuinely throwaway state.

## Performance

### `entity_object` vs `simple` — the biggest easy win

| Use | When | Notes |
|---|---|---|
| `ResultType: 'entity_object'` | You will **mutate and save** the records | Full `BaseEntity` instances. `Fields` is **ignored** — all fields load, by design; entities must be whole |
| `ResultType: 'simple'` + `Fields: [...]` | Read/display only | Plain objects, much faster. `Fields` narrows the query — use it to skip large text/JSON columns |

Anti-pattern: loading `entity_object` only to `.map(r => r.ID)`.

### Deep pagination — keyset, not offset

Background jobs iterating a whole entity use `RunViewParams.AfterKey`
(keyset/seek, O(log N) per page at any depth), not `StartRow`, where each page
re-scans everything it skipped. Single-column-PK entities only; UI grids can stay
on `StartRow`.

```typescript
let last: CompositeKey | undefined;
while (true) {
  const r = await rv.RunView({ EntityName: 'X', AfterKey: last, MaxRows: 500, ResultType: 'entity_object' }, user);
  if (!r.Success || r.Results.length === 0) break;
  /* process */
  if (r.Results.length < 500) break;
  last = CompositeKey.FromID(r.Results[r.Results.length - 1].ID);
}
```

### Reactive caches — `BaseEngine` + `ObserveProperty`

Before building a "reload after mutation" loop in Angular, check whether a
`BaseEngine` subclass already caches the entity, and subscribe to
`engine.ObserveProperty<E>('propName')` — it re-emits on save, delete, and remote
invalidation. Small entity sets (dozens of rows) that you own are worth a new
engine: declare `Configs` entries and invalidation comes free. Lazy-load with
`await MyEngine.Instance.Config(false, user, provider)` at every entry point.
Don't bulk-cache entities with huge columns — use targeted `RunView` filters.

### Server-side caching

MJAPI trusts its local cache completely (BaseEntity events invalidate it), and
small unfiltered results are auto-cached. The per-query escape hatch, when you
need true DB state after out-of-band SQL, is `BypassCache: true`. Before
bulk-loading an entity a loaded engine may already hold, ask
`BaseEngineRegistry.Instance.TryGetCachedRecords<T>(name, { unfilteredOnly: true })`
— read the returned array, never mutate it. Full doctrine: MJ's
`guides/CACHING_AND_PUBSUB_GUIDE.md`.
