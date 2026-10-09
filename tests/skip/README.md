# Skip evaluation suite (ICF)

32 MJ Testing Framework **Agent Eval** tests that run the **Skip** agent against the More Cheese
(International Cheese Federation) world, plus the `Skip ICF Evaluation Suite` that sequences them.

This folder is its **own mj-sync root**, deliberately outside `generated/` and `config/`, so it is
never captured into a release `Metadata_Sync` seed. Push it by hand to the database you want to
evaluate.

| Tier | Folder | Tests |
|---|---|---|
| 1 | `tests/tier1-simple` | single aggregation + one drill-down |
| 2 | `tests/tier2-trends` | time series |
| 3 | `tests/tier3-cross-domain` | joins across Orders / Learning / Events / Committees |
| 4 | `tests/tier4-advanced` | 2–3 level drill-downs |
| 5 | `tests/tier5-edge-cases` | named member, weighted scoring, missing data honesty, ambiguous definitions |
| 6 | `tests/tier6-advanced-viz` | dual axis, treemap, sparkline matrix, network graph, gauges, kanban |

Each test: `userMessage` ending in `[NO CHAT]` (Skip skips the clarify/PRD pause),
`trace-no-errors` (0.3) + `llm-judge` (0.7, model `Gemini 3.8 Flash`) scored against
`ExpectedOutcomes.judgeValidationCriteria`. Criteria quote real figures from the seeded world
(e.g. 2,109 members); re-check them if the world is regenerated.

## Push

From the **MJ repo root** (never from this repo):

```sh
DB_DATABASE=<db> node packages/MJCLI/bin/run.js sync push \
  --dir /path/to/more-cheese/tests/skip --ci --no-interactive
```

## Run

From the MJ repo root, CLI only (runs as the `System` user):

```sh
# one test
DB_DATABASE=<db> node packages/MJCLI/bin/run.js test run --name "Skip ICF - Members by Segment"
# whole suite (sequential; each Skip test takes ~5–15 min, so plan for several hours)
DB_DATABASE=<db> node packages/MJCLI/bin/run.js test suite --name "Skip ICF Evaluation Suite"
```

Results land in `MJ: Test Runs` / `MJ: Test Suite Runs`.

Prerequisites: the Skip Client Open App installed (agent `Skip` active), the Skip API reachable
at `ASK_SKIP_CHAT_URL`, and `@askskip/server` resolvable from the MJ root so the CLI can load
`SkipProxyAgent`.

**Fresh-install gotcha:** `SkipProxyAgent` provisions its callback API key lazily on first use.
If that first use is a CLI test process, a running MJAPI (no Redis) never sees the new key
scopes and Skip's data callbacks get `403 requires view:run`. Run one Skip conversation through
Explorer/MJAPI first, or restart MJAPI after the first CLI run.
