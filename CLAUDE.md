# More Cheese — development guide

This repository is the **MoreCheese Demo** MemberJunction Open App: the fictional
International Cheese Federation (ICF) association demo. It was built from the
mj-sample-open-app template and is developed **linked inside a MemberJunction
checkout** — see `docs/template-docs/linking-to-mj.md`.

<!-- This file is deliberately small. Claude Code's own guidance is ~200 lines per CLAUDE.md:
     longer files consume context AND reduce adherence. Everything below is either
     UNRECOVERABLE IF VIOLATED (so it must survive /compact) or TRUE ON EVERY TASK. Detailed
     guidance lives in .claude/rules/, which load only when you open a matching file — see the
     routing table. `npm run check:claude-md` enforces the budget and proves nothing was lost.
     Before adding anything here, read "Where new guidance goes" at the bottom.
     The design rationale is plans/claude-instruction-architecture.md. -->

---

## 🚨 Critical rules — violations are unacceptable

### 1. No commits without explicit approval
Never run `git commit` unless the user asked for **that** commit — each one needs
its own approval. Commit only what is staged; never fold extra work into someone
else's staged changes. Never ask to commit — wait to be asked.

### 2. No destructive git operations without explicit approval
Never `git checkout -- <file>`, `git restore <file>`, or `git reset --hard` to
discard changes without explicit approval — even in bypass permission mode. They
destroy uncommitted work irrecoverably. To undo your own edits, identify them
with `git diff` and reverse them with targeted edits, which preserves everyone
else's in-progress work.

### 3. Feature branches must track their own remote branch
A branch must track `origin/<same-name>` — never `origin/next` or `origin/main`.
If `my-feature` tracks `origin/next`, a plain `git push` sends commits **directly
to `next`**, bypassing review.

```sh
git checkout next && git pull
git checkout -b my-feature        # cut from next, never from main
git push -u origin my-feature     # -u sets the correct upstream

git branch -vv                    # verify: my-feature [origin/my-feature] ✅
git branch --set-upstream-to=origin/<name> <name>   # fix if wrong
```

PRs target `next`. A PR adding a migration must include a changeset (≥ minor).
Full model: [`docs/template-docs/branching.md`](docs/template-docs/branching.md).

### 4. Single-copy invariant
`@memberjunction/*` are **peerDependencies**. Never hard-depend on them, and
never run `npm install` inside a subfolder of a linked MJ workspace — it
duplicates packages and breaks resolution in ways that surface far from the
cause. [`docs/template-docs/versioning-and-peer-deps.md`](docs/template-docs/versioning-and-peer-deps.md).

### 5. When linked into MJ, the wiring edits are local-only
The edits in the **MJ repo** — root `package.json`, `mj.config.cjs`,
MJAPI/MJExplorer `package.json`, the bootstrap import, the lockfile — are local
to your machine. **Never commit them to MJ.**

---

## Repository structure

```
mj-app.json            - MJ Open App manifest (the source of truth for the app)
migrations/            - Skyway migrations: the baseline plus the Metadata_Sync release seed
migrations-teardown/   - generated, never hand-edited (npm run generate:teardown)
generated/             - mj-sync synthetic data & world model (Loom-generated)
config/                - mj-sync application configuration & taxonomies
packages/              - three published packages, version-locked as one changesets group
  Entities/            - @mj-biz-apps/more-cheese-entities (CodeGen entity subclasses)
  Server/              - @mj-biz-apps/more-cheese-server   (server bootstrap -> MJAPI)
  Angular/             - @mj-biz-apps/more-cheese-ng       (client bootstrap -> MJExplorer)
scripts/               - release gates and data tooling; *.spec.mjs run by npm run test:gates
.github/scripts/       - CI gates; the .mjs ones carry a --self-test mode
content/, vault/       - the public blog corpus and the internal staff corpus
website/               - static site built by npm run build:site, deployed from main
docs/                  - how this repo works (branching, publishing, codegen, linking)
plans/                 - design documents and research notes
```

## Build & dev commands

```sh
# linked (from the MJ repo root — the normal mode):
npx turbo build --filter="@mj-biz-apps/*"
npx mj codegen
# --dir is this repo's folder under packages/dev-apps/, which linking-to-mj.md names after
# the repo. From inside this repo, `npm run mj:migrate` carries the right schema and path.
npx mj migrate --schema morecheese_members --dir packages/dev-apps/<this-repo>/migrations

# from this repo:
npm run mj:migrate          # mj migrate --schema morecheese_members --dir ./migrations
npm run mj:codegen

# standalone smoke build (no DB):
npm install && npm run build:packages

# gates — all of these run in CI and none needs a database:
npm run test:gates          # the gates' own specs (they run FIRST in changes.yml)
npm run lint:peer-ranges && npm run lint:migrations && npm run lint:distribution
npm run check:seed-cadence && npm run check:release-seed && npm run check:ownership
npm run check:claude-md     # instruction-file budget, links, routing, rule globs
npm run build:site          # the public site; publish-site.yml runs this on push to main
```

The full development workflow (where to add code, capturing codegen +
metadata-sync migrations) is the README's "Development workflow" section.
Cutting a release is [`docs/release.md`](docs/release.md).

---

## Where the rest of the guidance lives

Loaded **on demand**, so it costs nothing until it's relevant. If you need a rule
you don't currently have, it's here.

### Path-scoped rules (`.claude/rules/`) — load when you open a matching file

| Rule | Loads for | Covers |
|---|---|---|
| [`metadata-sync.md`](.claude/rules/metadata-sync.md) | `generated/**`, `config/**` | 🚨 `mj sync push` from the MJ cwd, never `--no-app-packages`, the heap ceiling, geocoding, `RecurrenceMonths: null`, the ICF accounting seed, composition axes, file organization |
| [`migrations.md`](.claude/rules/migrations.md) | `migrations/**`, `migrations-teardown/**` | 🚨 Never edit an applied migration; naming, `${flyway:defaultSchema}`, hardcoded UUIDs, extended properties, what CodeGen owns |
| [`generated-code.md`](.claude/rules/generated-code.md) | `packages/*/src/generated/**` | 🚨 Never hand-edit; what CodeGen produces and what to do instead |
| [`mj-data-access.md`](.claude/rules/mj-data-access.md) | `**/*.ts` | `Metadata`/`GetEntityObject`, `RunView`/`RunViews`, save/delete booleans, the spread trap, entity naming, `UserInfoEngine`, batching, keyset pagination, caching |
| [`typescript-style.md`](.claude/rules/typescript-style.md) | `**/*.ts` | No `any`, no `.Get()`/`.Set()`, derive field types, no re-exports, no dynamic `import()`, `BaseSingleton`, naming, decomposition |
| [`angular.md`](.claude/rules/angular.md) | `packages/Angular/**` | Standalone vs NgModule, modern syntax, MJ UI components, `NotifyLoadComplete`, custom forms, design tokens |
| [`repo-gates.md`](.claude/rules/repo-gates.md) | `scripts/*.mjs`, `.github/**` | What a gate is here, every gate carries its own test, visible skips, why `npm test` is vacuous today |
| [`changesets.md`](.claude/rules/changesets.md) | `.changeset/**` | The fixed group, bump levels, migration PRs need ≥ minor |

### Skills (`.claude/skills/`) — load only when invoked

| Skill | Use for |
|---|---|
| [`morecheese-weekly-blog`](.claude/skills/morecheese-weekly-blog/SKILL.md) | The weekly ICF blog — 3 dated posts per week, into `content/` |
| [`morecheese-press-release`](.claude/skills/morecheese-press-release/SKILL.md) | A dated ICF press release for a real event in `generated/` |
| [`morecheese-annual-report`](.claude/skills/morecheese-annual-report/SKILL.md) | The ICF annual report for one fiscal year, computed from `generated/` |
| [`morecheese-internal-comms`](.claude/skills/morecheese-internal-comms/SKILL.md) | The internal staff corpus under `vault/internal/` |

Never hand-write ICF content without loading the matching skill — the corpus has
fiction headers, frontmatter, and cross-week coherence these skills own.

### Repo documentation

- [`docs/release.md`](docs/release.md) — the release runbook: the steps, `npm run release:plan`, and what to do when a run goes red
- [`docs/template-docs/`](docs/template-docs/README.md) — branching, publishing, codegen + metadata migrations, linking to MJ, versioning
- [`docs/claude/README.md`](docs/claude/README.md) — how the MJ guidance is organized here
- [`plans/`](plans/_README.md) — design documents, including [the rationale for this arrangement](plans/claude-instruction-architecture.md)

MJ's own [`CLAUDE.md`](https://github.com/MemberJunction/MJ/blob/next/CLAUDE.md)
remains authoritative for MJ-core work and anything not covered here.

---

## Where new guidance goes

Before adding anything to this file, route it:

1. **Unrecoverable if violated?** (destroys work, bypasses review, breaks every
   install) → here, so it survives `/compact`.
2. **True on literally every task?** → here.
3. **Applies to a file type or directory?** → a path-scoped rule in `.claude/rules/`.
4. **A multi-step procedure?** → a skill in `.claude/skills/`.
5. **Does an enforcement script already exist, or could one?** → a gate in
   `scripts/`, not prose. See [`repo-gates.md`](.claude/rules/repo-gates.md).
6. **Explaining *why* a design is the way it is?** → a document in `plans/`.

Anything reaching step 3 or beyond **does not belong in this file**. The test:
*"would removing this line cause a mistake?"* — and then *"on every task, or only
when touching a particular kind of file?"* The second answer routes it out.

A rule with no `paths` frontmatter loads unconditionally at launch, so omitting
`paths` does not scope a rule down — it makes it permanent. `check:claude-md`
fails on a rule missing `paths`, and on a glob that matches nothing.
