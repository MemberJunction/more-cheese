---
paths:
  - "**/*.ts"
---

# TypeScript rules

Typing, class design, naming, and decomposition for all TypeScript in this repo.

## 🚨 No `any` — ever

No `: any`, `as any`, `<any>`, or `unknown`-as-a-shortcut. MJ is strongly typed
end to end; there is a proper type for everything. If you think you need one that
doesn't exist, ask rather than widening.

Two corollaries:

- **Never use `BaseEntity.Get('Field')` / `.Set('Field', v)`** where a generated
  typed property exists. They are the `any` of the entity world — no IntelliSense,
  and a typo fails silently at runtime. If the types don't exist yet because
  CodeGen hasn't run, run the migration and CodeGen **first**, then write the code.
- **Never hand-copy a value-list union.** Derive it from the entity:
  `MyEntity['Status']`, not `'Active' | 'Inactive'` retyped by hand. Hand copies
  drift silently the moment a migration widens the CHECK constraint.

## No re-exports between packages

Import types and classes from the package that defines them. A package's
`index.ts` / `public-api.ts` exports only what that package itself defines.
Re-exports obscure the true source and break tree-shaking. The one sanctioned
pattern: re-exporting your **own** generated module from your own public API.

## No dynamic `import()` unless narrowly justified

Static imports at the top of the file. Dynamic import hides the dependency from
npm and the bundler — this shipped a real `ERR_MODULE_NOT_FOUND` production crash
in MJ once. The only accepted reasons: Angular lazy routes, optional peer
dependencies (cloud SDKs), measured bundle-size deferral, breaking a genuinely
untangleable cycle, and runtime plugin discovery. Even then, still declare the
package in `dependencies` and comment which category applies.

## Use `BaseSingleton` for singletons

Never the manual `static _instance` pattern — bundler code-splitting can load a
module twice and hand you two "singletons" with divergent state.
`BaseSingleton<T>` (from `@memberjunction/global`) uses the global object store,
which survives duplication.

```typescript
export class MyEngine extends BaseSingleton<MyEngine> {
    protected constructor() { super(); }
    public static get Instance(): MyEngine { return MyEngine.getInstance<MyEngine>(); }
}
```

## Naming — MJ's signature convention

- **PascalCase for ALL public class members** — properties, methods,
  `@Input()`/`@Output()`: `public IsLoading`, `public LoadData()`,
  `@Input() QueryId`. This is deliberate MJ style, not standard TypeScript.
- **camelCase for private/protected members**: `private destroy$`,
  `protected applyVisualConfig()`.
- camelCase for locals and parameters; PascalCase for classes and interfaces.
- Descriptive names, no abbreviations.
- Prefer **union types over enums** (`type Status = 'active' | 'inactive'`) —
  friendlier package exports.
- Null-check with `!= null`, which catches both `null` and `undefined`.

## Functional decomposition

Decompose when a chunk is a genuine, separately-nameable sub-abstraction: you'd
need a comment to explain a section, nesting exceeds two levels, the name would
need an "And" to be accurate, or a logic pattern repeats. Each function has one
clear purpose, and well-named helpers beat inline blocks for readability,
testability, and honest stack traces.

Treat ~30–40 lines as a smell worth investigating, never a rule that forces a
split. A cohesive deep function beats several shallow helpers you have to read
together.

## DRY and OO design

- Three or more classes with similar structure ⇒ a base class. Repeated parameter
  validation, error handling, or entity helpers ⇒ shared utilities.
- **Actions are boundaries** — for agents, workflows, and low-code surfaces —
  never a code-to-code call mechanism. Internal code imports the underlying
  classes directly: type safety, no metadata overhead, honest stack traces. Keep
  actions thin and delegate to service classes.

## Errors

try/catch with meaningful messages that carry context — what was being done, for
which record. Never swallow: every catch logs, rethrows, or returns a failure
result. But remember that `RunView`, `Save`, and `Delete` signal failure through
**return values**, not exceptions — see [`mj-data-access.md`](mj-data-access.md).

## Miscellany

- Group imports: external, internal, relative.
- TSDoc on public APIs.
