# Claude instruction architecture

How this repo's agent instructions are organized, why they are organized that
way, and what stops the arrangement from decaying. Written alongside the change
that introduced it.

## The problem

Before this change the repo had two instruction surfaces:

| Surface | Size | When it loaded |
|---|---|---|
| `CLAUDE.md` | 133 lines | every session, always |
| `docs/claude/01..09` | 512 lines across 9 files | **only if an agent chose to read it** |

`docs/claude/` was a curated snapshot of MemberJunction's pre-refactor
`CLAUDE.md`, copied in when this repo was scaffolded from `mj-sample-open-app`.
Eight of its ten files were still byte-identical to that template. It is
ordinary documentation in an ordinary folder: nothing loads it, nothing checks
it, and nothing tells an agent editing `generated/products/.products.json` that
it exists.

Meanwhile `CLAUDE.md` carried the opposite problem. Rules 7 through 10 are four
of the hardest-won facts in this repo — `--no-app-packages` silently dropping
Journal Entries, the 16 GB heap ceiling, `skipGeoCoding` belonging to
People/Organizations but not Addresses, and `RecurrenceMonths: null` being
load-bearing. Every one of them is about `generated/`. All four were paid for on
every single task, and loaded for none of the 344 files they protect.

So the repo was spending context on guidance where it did not apply, and
spending nothing on guidance where it did.

## The mechanism

Claude Code supports [`.claude/rules/`](https://code.claude.com/docs/en/memory):
markdown files with YAML frontmatter that scope them to file globs.

```markdown
---
paths:
  - "generated/**"
---
```

A rule with `paths` loads **when Claude reads a matching file** — it costs
nothing on the tasks it does not apply to. A rule **without** `paths` loads
unconditionally at launch, at the same priority as `CLAUDE.md`. That asymmetry
is a footgun: omitting `paths` does not disable a rule, it makes it permanent.
The gate checks for it.

This is the same arrangement MemberJunction adopted when it took its own root
`CLAUDE.md` from 2,256 lines to 226, and the same one `bizapps-forms` uses —
already this repo's donor for the release gates (#48).

## The taxonomy

Rules are derived from **this repo's** file mass and footguns, not copied from
MJ's. The repo is 1,151 markdown files and 33 `.mjs` gate scripts, against 21
TypeScript files — 15 of which are generated, leaving 6 hand-written, and three
of those are barrel files.

| Rule | `paths` | Matches | Absorbed from |
|---|---|---|---|
| `metadata-sync.md` | `generated/**`, `config/**` | 344 JSON | `08` + root rules 7, 8, 9, 10 |
| `migrations.md` | `migrations/**`, `migrations-teardown/**` | 7 SQL | `05` + root rule 3 |
| `generated-code.md` | `packages/*/src/generated/**` | 15 TS, 12 HTML | root rule 2 |
| `mj-data-access.md` | `**/*.ts` | 21 TS | `03` + `04` |
| `typescript-style.md` | `**/*.ts` | 21 TS | `07` + typing half of `01` |
| `angular.md` | `packages/Angular/**` | Angular package | `06` |
| `repo-gates.md` | `scripts/*.mjs`, `.github/scripts/**` | 31 MJS | `09`, retargeted |
| `changesets.md` | `.changeset/**` | 8 MD | changeset half of root rule 4 |

`metadata-sync.md` is the load-bearing one. It is the largest rule, it covers
the largest body of files, and it holds every footgun that has already cost
someone a debugging session.

### Two rules deliberately not created

MJ's rule set includes `testing.md` on `**/*.test.ts` and `design-tokens.md` on
`**/*.scss`. **Both match zero files here.** This repo has no Vitest suite — its
tests are `scripts/*.spec.mjs` under `node --test` — and no SCSS at all; the
three `.css` files are a static marketing site under `website/assets/`.

Copying them would have produced two rules that can never fire, which is worse
than not having them: they look like coverage. The gate's RULES check would have
caught both anyway — it fails a glob matching nothing on disk.

The content still lands somewhere. Design-token guidance folds into
`angular.md`, scoped to `packages/Angular/**` so it cannot fire on the website's
static CSS. `09`'s durable parts retarget onto the runner this repo actually uses
(`repo-gates.md`). Only one section is genuinely dropped — `09`'s "Writing",
which describes a Vitest layout, `vi` mocking, and `@memberjunction/test-utils`
helpers for a suite that does not exist. That deletion is recorded in the
manifest with its reason; keeping it would have shipped two contradictory testing
conventions, and the one describing nothing would have been indistinguishable
from the one describing the gates.

## What stays in the root file

Two questions, borrowed from MJ, decide it:

1. **Unrecoverable if violated?** — destroys work, bypasses review, pollutes
   another repo. It must survive `/compact`, so it stays.
2. **True on literally every task?** — it stays.

Anything else routes out. That leaves the root file with: no-commits-without-
approval, no-destructive-git, branch tracking, the single-copy invariant, the
linked-into-MJ local-only rule, repository structure, and build commands — plus
a routing table and the decision procedure above, so the next person with
something to add has somewhere to put it other than the bottom of this file.

`docs/claude/README.md` survives as a human-facing router. `01`–`09` are gone;
the manifest says where each of their 45 sections went.

## What keeps it from decaying

`scripts/check-claude-md.mjs` (`npm run check:claude-md`), with
`check-claude-md.spec.mjs` beside it in `test:gates` — the convention every
other gate in this repo follows, because a gate whose own spec has gone red is
one whose green means nothing.

| Check | Fails when |
|---|---|
| COMPLETENESS | a manifest section has no destination, names one that does not exist, or is deleted without a reason |
| BUDGET | root `CLAUDE.md` exceeds its committed line/byte ceiling |
| REFERENCES | a markdown link or backticked path in any instruction file does not resolve |
| ROUTING | a rule or nested `CLAUDE.md` exists on disk but is missing from the root routing table |
| RULES | frontmatter does not parse, `paths` is absent, or a glob matches nothing tracked |
| SKILLS | a `.claude/skills/*/SKILL.md` is missing from the routing table |

The budget is the point. The root file did not reach 2,256 lines in MJ through
carelessness; it got there one reasonable-seeming addition at a time, each of
which was individually defensible. A committed ceiling converts "keep it small"
from an intention into a property of the repo.

The manifest is the review artifact. Relocating 45 sections is not reviewable by
reading a diff — the content moves between files, so every line shows as both a
deletion and an addition. The manifest states where each section went, and
COMPLETENESS proves the claim is not aspirational.

## Deliberately out of scope

- **The MJ claude-pack.** MJ ships `templates/claude-pack` and an
  `mj update:claude` command that would replace hand-maintained copies with a
  managed block. Its `dist/` is `v5` at PACK_VERSION 5.1.0; MJ is 6.1.0. It is
  the right long-term answer and the wrong thing to adopt today.
- **Nested `CLAUDE.md` files.** The routing table and the gate both support
  them. None is warranted yet — path-scoped rules cover every subtree that
  currently has guidance.
- **The other app repos.** `bizapps-issues`, `bizapps-tasks`, and
  `bizapps-secure-messaging` each carry a ~2,010-line `CLAUDE.md`: the exact
  failure this change addresses. Each is its own repo, its own `next`, and its
  own PR.
