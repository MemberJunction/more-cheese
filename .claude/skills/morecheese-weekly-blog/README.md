# morecheese-weekly-blog — operator notes

`SKILL.md` generates **one week** of ICF blog content: exactly 3 researched, dated,
fictional posts filed at `content/blog/YYYY/YYYY-MM-DD-<slug>.md`.

The skill is deliberately single-week. Volume comes from looping the *invocation*, not from
asking one invocation to do more.

## Running a volume backfill

**Shape of the loop.** One week per invocation, one fresh context per invocation, Mondays only.

```sh
# Mondays from 2019-01-07 through 2026-08-31 (the era range in data/ruleset/eras.json; the world runs to 2026-09-02)
python3 - <<'PY' > /tmp/mc-weeks.txt
import datetime as d
w = d.date(2019, 1, 7)
while w <= d.date(2026, 8, 31):
    print(w.isoformat()); w += d.timedelta(days=7)
PY
wc -l /tmp/mc-weeks.txt   # ~365 weeks
```

### With Claude Code

```sh
cd /path/to/more-cheese
while read -r wk; do
  # skip weeks already written (3 files present for that Monday's week)
  claude -p "Use the morecheese-weekly-blog skill. Generate the ICF weekly blog for the week of Monday $wk."
done < /tmp/mc-weeks.txt
```

Notes:
- Run it in tranches (a quarter or a year at a time) and read the output before continuing.
  Reviewing 12 posts is cheap; reviewing 1,000 is not.
- `-p` gives each week a clean context, which is what you want — cross-week context is supplied
  by the world model files, not by conversation history.
- Web search must be enabled, and the run needs network access. Add the domains the research
  step keeps hitting to `.claude/settings.json` `permissions.allow` as
  `WebFetch(domain:…)` entries so the loop doesn't stall on prompts.
- Parallelism is safe (each week writes distinct filenames), but keep it modest — the research
  step is search-rate-bound, not CPU-bound. 3–4 concurrent weeks is a reasonable ceiling.

### With Antigravity

Same contract, driven from an agent config rather than a shell loop:

1. Point the agent's working directory at the repo root so `content/blog/`, `data/ruleset/`,
   and `generated/` resolve.
2. Make the week list (above) the task queue — one task per Monday, one agent run per task.
3. Task prompt: *"Use the morecheese-weekly-blog skill. Generate the ICF weekly blog for the
   week of Monday YYYY-MM-DD."* Nothing else; the skill carries the rules.
4. Require web search on the task, and require the run to emit the §8 completion checklist.
   Fail the task if the checklist doesn't come back clean, and requeue that single week.
5. Batch by quarter, spot-check 2–3 weeks per quarter by hand before releasing the next batch.

### Resuming / idempotency

Re-running a week **overwrites nothing automatically** — the model will pick its own slugs, so a
second run of the same week produces three *additional* files with different names. Before
re-running a week, delete that week's existing files:

```sh
# clear one week (Mon..Sun) before a re-run
for i in 0 1 2 3 4 5 6; do
  d=$(date -j -v+"$i"d -f %Y-%m-%d "$wk" +%Y-%m-%d)
  rm -f "content/blog/${d:0:4}/${d}-"*.md
done
```

A cheap progress check:

```sh
find content/blog -name '*.md' | wc -l          # expect 3 x weeks completed
ls content/blog                                  # year coverage
```

## Known limits

- **Era range is 2019–2026.** `data/ruleset/eras.json` defines six eras covering cycles
  2019–2026 only. Weeks outside that range have no `era` value; the skill is told to stop and
  report rather than invent one. Extending coverage means extending the world model first —
  which is out of bounds for this skill.
- **Hero availability is thin in early years.** Only 7 of the 16 heroes have joined by 2019, and
  only 2 by 2013. Early-year member spotlights lean on unnamed composites built from
  `data/ruleset/motifs.json`. That is intended, not a defect.
- **No named ICF staff exist.** The world model defines 16 *members*, no communications staff, so
  every byline is `ICF Communications Team`. If named staff are ever added to the world model,
  update §5 of `SKILL.md` — don't let a run invent a staffer.
- **Research quality degrades on old weeks.** Trade-press archives from 2019–2020 are patchy and
  some sources are paywalled or dead. Expect 1–3 usable industry sources per week, sometimes only
  a monthly roundup rather than a same-week story. The skill permits sources dated shortly before
  the week for this reason.
- **Event density is uneven.** ~98 events across 2019–2026 means many weeks have no ICF event
  anywhere near them. Those weeks can't run an `Events` post; the type rotation has to absorb it.
- **Course names repeat across cohorts.** 63 course records are ~25 distinct titles × cohorts.
  A long backfill will re-reference the same titles; vary the framing, not the names.
- **Volume cost.** ~365 weeks × 3 posts ≈ 1,100 posts, each with its own research pass. Budget
  accordingly and pick the model tier deliberately; research is the expensive half.
- **No de-duplication across weeks.** Nothing stops two weeks three months apart from covering
  the same angle. If that matters, feed the previous 4 weeks' titles into the prompt as a
  "don't repeat these" list, or sweep titles afterwards:
  `grep -h '^title:' -r content/blog | sort | uniq -d`.
- **Nothing here writes to a database.** Output is markdown in the working tree only. Loading
  posts into MemberJunction is a separate, later step.
