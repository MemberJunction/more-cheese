# Documentation index

Read in this order when starting from the template:

| Doc | What it covers |
|---|---|
| [getting-started.md](getting-started.md) | The fill-in checklist: everything to rename, and your first dev loop |
| [repo-setup.md](repo-setup.md) | Creating your repo from the template + setting up the `next`/`main` branches |
| [linking-to-mj.md](linking-to-mj.md) | **Developing the app inside a MemberJunction checkout** (worktree linking) + when you need a database |
| [codegen-and-metadata-migrations.md](codegen-and-metadata-migrations.md) | The CodeGen + migrations convention: what to run and commit after every schema/metadata change |
| [branching.md](branching.md) | The `next` → `main` branch model and feature-branch rules |
| [versioning-and-peer-deps.md](versioning-and-peer-deps.md) | How package versions and peer dependencies work (with the examples in this repo) |
| [publishing.md](publishing.md) | Publishing to npm + GitHub releases; first-publish bootstrap; the no-breaking-changes policy |

The **format reference** for the manifest is [`../mj-app.reference.jsonc`](../mj-app.reference.jsonc);
the **inventory of what a finished app contains** (required vs optional) is
[`../plans/TEMPLATE-SPEC.md`](../plans/TEMPLATE-SPEC.md).
