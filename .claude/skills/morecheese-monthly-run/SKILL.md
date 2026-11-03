---
name: morecheese-monthly-run
description: The monthly More Cheese extension run — the weekly blog for every finished week, the next Loom data cycle planned by Gemini Argon, the internal staff bundles up to the new data end, every gate, then one pull request into next. USE THIS SKILL WHENEVER asked to run, resume, dry-run or debug the monthly run, the monthly routine, the scheduled More Cheese extension, "extend the dataset for <month>", "catch More Cheese up", or the cloud routine that does this. Not for writing a single blog week or internal week by hand (use morecheese-weekly-blog or morecheese-internal-comms).
---

# More Cheese — the monthly run

One run extends the ICF dataset by everything that has come due: blog weeks that have ended, Loom
cycles whose month has ended, and internal weeks the data now covers. It usually runs as a scheduled
Claude Code cloud routine on the 1st of the month, but it works the same in a local session.

**What the run may do.** Asking for this run is the user's request for **one** commit of its output
on a fresh branch, one push of that branch, and one pull request into `next` with **no reviewer**.
It never merges, never pushes to `next` or `main`, never edits code, config, skills or workflows, and
never commits a Loom checkout, a symlink or a log. If a step fails, it says so in the PR and in its
final message; it does not work around a failing gate.

## 1. Set up

1. **Branch.** From the repo root: `git fetch --unshallow origin 2>/dev/null || git fetch origin`, then
   `git switch --no-track -c claude/monthly-$(date -u +%Y-%m-%d) origin/next`. A cloud clone is shallow and
   some gate specs read older commits, so fetch the history first. The branch tracks its own remote branch
   once pushed (CLAUDE.md rule 3); never `origin/next`.
2. **Loom.** The planner needs the Loom CI validates with: `node scripts/monthly-run.mjs loom-ref` prints
   the commit. In the cloud, the environment's setup script ([`cloud-setup.sh`](cloud-setup.sh), pasted into the
   environment's **Setup script**) has already built it at `/opt/loom` (log:
   `/opt/loom-build.log`); link it with `ln -sfn /opt/loom ../loom`, since `validate:loom` looks for
   `../loom`. Locally, use a checkout at `../loom` built at that commit (`git checkout --detach <ref>`,
   `corepack enable`, `pnpm install --frozen-lockfile`, then `pnpm --filter <pkg> build` for
   `@memberjunction/loom-contracts`, `-engine` and `-cli`). Either way, `git -C ../loom rev-parse HEAD` must
   equal `loom-ref`. If it does not, or `/opt/loom` is missing, **stop before §4**, keep the blog, and say
   that the environment's setup script has to rebuild (any edit to it does). Do not run `pnpm install`
   yourself in a cloud session.
3. **Gemini.** Both Gemini scripts read `GEMINI_API_KEY`, which the routine's cloud environment sets as an
   environment variable. Check it with `test -n "$GEMINI_API_KEY"`, never by printing it; never echo,
   log or write the key anywhere. (Where the key is instead a cloud **network secret** on
   `generativelanguage.googleapis.com`, header `x-goog-api-key`, prefix the commands below with
   `GEMINI_KEY_FROM_PROXY=1` and the session never sees the key.)
4. **Logs.** Write every `--logdir` outside the repo (e.g. `../monthly-logs`).

No `npm install` is needed in this repo: the gates, the planner and the content scripts use Node only.

## 2. What is due

`node scripts/monthly-run.mjs status` (add `--json` to parse it). It lists, in run order, the blog weeks
that have ended, the Loom cycles whose month has ended, and the internal weeks up to the data end. If all
three lists are empty, stop: say so in the final message and open nothing.

## 3. Blog — each due week, oldest first

For each week, load the **morecheese-weekly-blog** skill and generate the week of that Monday, with the
same instructions the backfill used (`scripts/content-backfill-week.sh`): US spelling; read every post
title within four weeks first and repeat no theme or hero; a hero only after their `JoinDate` in
`generated/member-profiles`, and at most one Member Spotlight per hero across the corpus; edit no other
week; finish with the skill's §8 checklist. Then `node scripts/validate-content.mjs --week <Monday>` and
fix until it shows no FAIL and no ⚠.

In the cloud, WebFetch reaches only the environment's allowlist, and some sites on it (Cheese Reporter,
USDA, Dairy Herd) answer every automated fetch with 403. That is the site, not the run: fetch another
result instead, and never cite a page you could not read.

If a week cannot pass, remove that week's new files (`rm content/blog/<year>/<file>.md`), **stop the blog
there** and skip §4: a later week or plan would leave a hole that `status` never asks for again (it
measures from the newest post).

## 4. Plan — each due cycle, oldest first

```sh
node scripts/plan-month-gemini.mjs --month <YYYY-MM> --loom ../loom --logdir ../monthly-logs
```

It takes a few minutes per attempt: run it in the background and wait for it. On PASS it has appended
the cycle to `generated/` and written `data/plans/<YYYY-MM>.plan.json` and `.decisions.json`; on FAIL it
has restored `generated/` and kept nothing — stop planning, keep the blog, and report the problems from
its output. Never hand-edit `generated/` or a plan.

## 5. Internal — each due week, one at a time

Ask `status` again (planning moved the data end), then for each internal week, oldest first:

```sh
node scripts/content-backfill-internal-gemini.mjs --par 1 --logdir ../monthly-logs/internal <Monday>
```

One week per command, so a week that fails stops the sequence (same hole as §3). A failed week leaves
nothing in `vault/internal/`; report it and stop.

## 6. Verify

All of these, from the repo root; every one must pass:

```sh
npm run test:gates
node scripts/check-metadata-closure.mjs
npm run validate:loom
npm run test:loom-mutations
npm run check:ownership
npm run check:claude-md
git add generated/ data/plans/ && npm run generate && git diff --exit-code generated/
git diff --check
```

The `generate` line is CI's determinism check: with the plan's output staged, a second `generate` must
change nothing. Also run `node scripts/validate-content.mjs --week <Monday>` for every blog week and
`--internal-week <Monday>` for every internal week added.

## 7. Commit and open the pull request

1. Stage only what the run wrote: `content/blog/`, `vault/internal/`, `generated/`, `data/plans/`. Check
   `git status --short` shows nothing else changed; if something did, leave it unstaged and say so.
2. Commit: `content+data: monthly run <date> (<cycles>)`, with a body listing the blog weeks, cycles and
   internal weeks, and the attribution trailer this session's instructions give.
3. `git push -u origin <branch>`.
4. Open the PR with the REST API (cloud sessions cannot use `gh pr create`; GraphQL is blocked):
   `gh api repos/MemberJunction/more-cheese/pulls -f title='<title>' -f head='<branch>' -f base=next -F body=@<file>`.
   No reviewer: the user reviews and merges More Cheese PRs.

The PR body: what was due and what was done; each cycle's summary from its `.decisions.json` (joins,
lapses, renewals, registrations); Gemini token counts from the script output; every §6 result; and,
at the top, anything that failed or was skipped and why.

## 8. Final message

The PR link, then the same summary in a few lines. If nothing was due or nothing passed, say exactly
what happened instead.
