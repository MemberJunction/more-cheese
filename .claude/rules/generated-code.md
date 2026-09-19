---
paths:
  - "packages/*/src/generated/**"
  - "packages/*/src/**/generated/**"
---

# 🚨 Generated code — never hand-edit

You are reading a file CodeGen owns. Any edit here is erased the next time
`npx mj codegen` runs, silently and without conflict.

## What CodeGen generates

From the schema plus metadata:

1. **Entity classes** → `packages/Entities/src/generated/` — typed `BaseEntity`
   subclasses, zod schemas, and value-list unions derived from CHECK constraints.
2. **GraphQL resolvers** → `packages/Server/src/generated/`.
3. **Angular forms** → `packages/Angular/src/lib/generated/`.
4. **Database plumbing** — base views, `spCreate`/`spUpdate`/`spDelete`,
   `__mj_CreatedAt`/`__mj_UpdatedAt` columns and triggers, FK indexes
   (`IDX_AUTO_MJ_FKEY_*`), permissions.

## What to do instead

**Changing a field, type, or value list** — change the schema in a migration,
run migrations, then CodeGen. See [`migrations.md`](migrations.md).

**Overriding behavior** — subclass. For forms, extend the *generated form class*
(not `BaseFormComponent` directly) and register with
`@RegisterClass(BaseFormComponent, '<Entity Name>')`; see [`angular.md`](angular.md).
For server-side entity behavior, subclass the generated entity.

**Needing a type that isn't there yet** — run the migration and CodeGen *first*,
then write code against the result. Never reach for `.Get()`/`.Set()` to paper
over types CodeGen has not produced yet.

## Committing

Commit regenerated output **together with** the migration that caused it — never
in a separate commit, and never a migration without its regenerated code.

The generated ORM is the schema's **source of truth**, not the migration SQL:
migrations are append-only history, the entity classes reflect the net result.
