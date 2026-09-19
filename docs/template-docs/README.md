# Documentation index

Read in this order when starting from the template:

| Doc | What it covers |
|---|---|
| [init-script.md](init-script.md) | The setup script (`npm run init`): what it does, every option, and what each should be |
| [getting-started.md](getting-started.md) | The fill-in checklist: everything to rename, and your first dev loop |
| [repo-setup.md](repo-setup.md) | Creating your repo from the template + setting up the `next`/`main` branches |
| [linking-to-mj.md](linking-to-mj.md) | **Developing the app inside a MemberJunction checkout** (worktree linking) + when you need a database |
| [codegen-and-metadata-migrations.md](codegen-and-metadata-migrations.md) | The CodeGen + migrations convention: what to run and commit after every schema/metadata change |
| [metadata.md](metadata.md) | Authoring metadata: file formats, `@file`/`@lookup` references, worked examples, the push→capture workflow |
| [branching.md](branching.md) | The `next` → `main` branch model and feature-branch rules |
| [versioning-and-peer-deps.md](versioning-and-peer-deps.md) | How package versions and peer dependencies work (with the examples in this repo) |
| [publishing.md](publishing.md) | The npm trusted-publishing bootstrap record; the no-breaking-changes policy |
| [../release.md](../release.md) | **Cutting a release**: the four steps, the `release:plan` preflight, and what to do when a run goes red |

The **MemberJunction development guide** (critical rules, entity/data
patterns, CodeGen + migration authoring, Angular, style, testing — adapted
from MJ's own `CLAUDE.md` into topic docs) is **[../claude/](../claude/README.md)**.

The **inventory of what a finished app contains** (required vs optional) is
[`plans/complete/TEMPLATE-SPEC.md`](../../plans/complete/TEMPLATE-SPEC.md).
