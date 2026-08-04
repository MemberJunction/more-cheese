# What standing up the second project found

This project exists to answer one question: **can a new project be built without editing the
engine?** The answer was no, six times. Each `no` was a MoreCheese-shaped assumption that nobody
could have seen from inside MoreCheese, because from inside MoreCheese it was simply true.

The findings are the deliverable. The project is the instrument.

Method: build a project by following [engine/README.md](../../engine/README.md) literally, writing
nothing the document did not say to write, and record every error. Fix each on the correct side of
the boundary — an unreasonable engine demand is an engine bug; a reasonable one that was never
written down is a documentation bug.

---

## The six

| # | what happened | side | fix |
|---|---|---|---|
| 1 | `cfg.n` silently defaults to `ruleset.scale.members`, and `yearsOf` needs `history.startYear`. Two required ruleset keys, documented nowhere. | docs | named in engine/README.md |
| 2 | `domainLint` **must return an array** — the engine spreads it. A no-op returning nothing dies as `domainLint(...) is not iterable`. | docs | contract stated; fixture returns `[]` |
| 3 | `compileRuleset` called `syntheticPop`, `overallTarget`, `features` **unconditionally**, so a project with no human-authored effect forms had to supply the entire calibration machinery to get past one line. | **engine** | early return when there is nothing to solve |
| 4 | The emitter refused `_keenness` on a shipped row — correctly. But it taught the ordering: an internal the *next* decision reads must survive generation and die before emission. | neither | fixture strips after the decision, not before |
| 5 | `emitPacks` wrote `validation-events.json` from `renewalEvents`, `validation-latents.json` from `_theta`/`_phi`/`_hero`, and `covidYears` into `run.json` — all three unconditional. First surfaced as `JSON.stringify(undefined)` reaching `writeFileSync`, a spectacularly unhelpful error for *"your project has no renewals"*. | **engine** | all three optional; the projection and the run extras are now project exports |
| 6 | The run summary in `cli/generate.mjs` destructured `people, orgs, periods, events, registrations, renewalEvents` and printed a status mix and a renewal curve. The fixture crashed on `periods is not iterable` before printing anything. | **engine** | `SUMMARY_OF(world)` is the project's; the engine falls back to counting rows |

Three engine bugs, two documentation gaps, one case of a gate correctly teaching something.

## What that means

**The five patterns, the row templates, the derived checks and the pack contract all worked
unchanged.** The fixture uses `annualParticipation`, two row templates, `refs.mjs`,
`presence.mjs` and `measurements.mjs`, and every one of them behaved as documented on first use.
Those are the parts that were genuinely extracted.

**Everything that broke was at the edges** — configuration defaults, harness-private output files,
and the run summary. All three are places where MoreCheese's shape had leaked into the engine
*after* the abstractions were designed, and none would have been found by inspection. Finding 5 is
the clearest: three separate MoreCheese concepts in one twelve-line block, each individually
reasonable-looking.

**Nothing found here was a design flaw in the patterns.** That is the useful result, and it is only
credible because it was tested rather than asserted.

## The invariant this project now protects

Every change to `engine/` must keep two things true:

1. `node cli/build.mjs --project fixture --n 50 --seed 42 --release 2026-07-31` still works.
2. MoreCheese's output is byte-identical unless the change intends otherwise.

Both are in the suite. The first is what makes the framework claim falsifiable; before this project
existed, an engine change could quietly re-couple the engine to MoreCheese and nothing would notice.

## What this project deliberately is not

Fifty invented members, one decision, five years. It is **not shipped, not installed, and does not
represent any real organisation** — it is a CI fixture. It has no scenario overlays, no seed mapping,
no emitters and no bespoke gates, because each of those is a separate claim and this project only
makes one.

If you are looking for the real dataset it is [projects/morecheese/](../morecheese/).
