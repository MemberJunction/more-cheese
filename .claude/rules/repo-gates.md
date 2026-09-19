---
paths:
  - "scripts/*.mjs"
  - ".github/scripts/**"
  - ".github/workflows/**"
---

# Release gates & testing

Loads when you open a gate script or a workflow. This repo has no Vitest suite —
its automated checks **are** the gates, and they are held to a high standard
because they are the only thing standing between a bad seed and a stranger's
database.

## What a gate is here

A gate is a zero-dependency Node script that reads the repo and exits non-zero on
a violation. **No database, no network, no `npm install`** — that is why every one
of them can sit at the top of `changes.yml` and fail fast for free.

## 🚨 Every gate carries its own test

Either a `--self-test` mode (`.github/scripts/*.mjs`) or a sibling
`scripts/<name>.spec.mjs` run by `node --test`. This is not optional:

> a gate whose spec has gone red is one whose green means nothing.

`npm run test:gates` runs the specs, and `changes.yml` runs it **FIRST**, before
any gate it validates. When you add a gate, add it to the `test:gates` script
list in `package.json` in the same commit.

## Spec conventions

Follow [`check-release-seed-coverage.spec.mjs`](../../scripts/check-release-seed-coverage.spec.mjs):

- Build a **throwaway repo root** in a temp dir (`mkdtempSync`) per case, so no
  case depends on what happens to be checked in today. This matters here — the
  real tree is ~90 MB.
- Import the gate's pure functions directly and also exercise the CLI via
  `spawnSync`, so the exit status is covered, not just the logic.
- Cover the violation, the clean case, **and** the "nothing to check yet" state.
- `import { test } from 'node:test'` and `assert from 'node:assert/strict'`.

## Script conventions

Follow [`check-peer-ranges.mjs`](../../scripts/check-peer-ranges.mjs):

- `#!/usr/bin/env node`, then a header comment that explains **why the gate
  exists** — the incident, the issue number, what failed and how it misreported
  itself. These headers are the most valuable prose in the repo; a gate whose
  rationale is lost gets deleted by the next person who finds it inconvenient.
- Name and separate each rule (`── RULE 1 — … ──`).
- Say plainly what is ported from a sibling repo (usually `bizapps-forms`) and
  what is new here, so the next port knows what it is taking.
- Export the pure logic so the spec can call it without a subprocess.

## Skipping must be visible

When a gate cannot run, detect the condition explicitly and announce it —
`echo "::notice::…"` with the reason and issue number. See the
`Detect Metadata_Sync seed migrations` step in
[`changes.yml`](../../.github/workflows/changes.yml). A silently skipped gate is
worse than a missing one: it reports green.

## Running them

```sh
npm run test:gates          # the gates' own specs — run these first
npm run lint:peer-ranges    # peer ranges match the manifest floor, no exact versions
npm run lint:migrations     # migration ordering is consistent across the chain
npm run lint:distribution   # shipped SQL installs on a stranger's database
npm run check:seed-cadence
npm run check:release-seed
npm run check:ownership
npm run check:claude-md     # instruction-file budget, links, routing, rule globs
node scripts/check-metadata-closure.mjs
```

## `npm test` is currently vacuous — know this

All three packages ship `"test": "echo \"No tests configured yet\""`. `npm test`
therefore passes without asserting anything. **A stubbed test passing vacuously
is a latent failure wearing a green light** — never cite `npm test` as evidence
that a change is safe. If you add real TypeScript to a package, add a real suite
with it (Vitest is MJ's standard; Jest is deprecated) and replace the stub in the
same commit.

## Reporting

Report pass/fail/skip counts honestly, and say what was **not** run and why.
