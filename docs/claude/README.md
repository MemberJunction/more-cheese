# MemberJunction development guide (for this app)

**This directory no longer holds the guidance — it points at it.**

Until 2026-09, this folder held nine topic documents (`01-critical-rules.md`
through `09-testing.md`): a curated snapshot of MemberJunction's `CLAUDE.md`,
copied in when this repo was scaffolded from `mj-sample-open-app`. Eight of the
ten files were still byte-identical to that template.

The problem was not the content, it was the delivery. Ordinary markdown in an
ordinary folder does not load. Nothing told an agent editing
`generated/products/.products.json` that a document about `mj sync push` existed
three directories away, and nothing kept the copy in step with its upstream.

That guidance now lives in [`.claude/rules/`](../../.claude/rules/) as
**path-scoped rules**, which Claude Code loads automatically when a matching file
is opened, and in [`CLAUDE.md`](../../CLAUDE.md) for the handful of rules that are
unrecoverable if violated. The rationale, the taxonomy, and what enforces it:
[`plans/claude-instruction-architecture.md`](../../plans/claude-instruction-architecture.md).

## Where each topic went

| Was | Now |
|---|---|
| `01-critical-rules.md` | [`CLAUDE.md`](../../CLAUDE.md) (commits, destructive git) · [`typescript-style.md`](../../.claude/rules/typescript-style.md) (no `any`, re-exports, dynamic import, `BaseSingleton`) · [`mj-data-access.md`](../../.claude/rules/mj-data-access.md) (`UserInfoEngine`) |
| `02-git-and-branches.md` | [`CLAUDE.md`](../../CLAUDE.md) — branch tracking bypasses review, so it stays resident |
| `03-entities-and-data.md` | [`mj-data-access.md`](../../.claude/rules/mj-data-access.md) |
| `04-performance.md` | [`mj-data-access.md`](../../.claude/rules/mj-data-access.md) |
| `05-codegen-and-migrations.md` | [`migrations.md`](../../.claude/rules/migrations.md) · [`generated-code.md`](../../.claude/rules/generated-code.md) |
| `06-angular.md` | [`angular.md`](../../.claude/rules/angular.md) |
| `07-code-style.md` | [`typescript-style.md`](../../.claude/rules/typescript-style.md) |
| `08-metadata-and-sync.md` | [`metadata-sync.md`](../../.claude/rules/metadata-sync.md) |
| `09-testing.md` | [`repo-gates.md`](../../.claude/rules/repo-gates.md), retargeted from Vitest onto the gate suite this repo actually runs |

Section-by-section, with reasons for the two deletions:
[`.claude/claude-md-manifest.json`](../../.claude/claude-md-manifest.json), which
`npm run check:claude-md` verifies.

## Reading MJ's own guide

MJ's [`CLAUDE.md`](https://github.com/MemberJunction/MJ/blob/next/CLAUDE.md) is
authoritative for MJ-core work and for anything not covered here. It has since
been refactored the same way — a small root file plus `.claude/rules/`, nested
`CLAUDE.md` files, and an indexed `guides/` directory — so read its routing table
rather than expecting one large document.

MJ also ships a **Claude pack** (`templates/claude-pack`, applied with
`mj update:claude`) that would replace hand-maintained copies like this one with
a managed, versioned block. Its published `dist/` is `v5`; MJ is currently 6.1.0.
Worth revisiting when a v6 pack ships.
