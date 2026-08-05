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

## Then the install path — four more

The first six came from making the project GENERATE. That left the other half of the pipeline
untested, and it was worse:

| # | what happened | side | fix |
|---|---|---|---|
| 7 | `cli/build.mjs` — the stage → validate → promote pipeline — ran `cli/validate.mjs` unconditionally. That file is 1,600 lines of MoreCheese and imports **that project's** seed mapping, so `build.mjs --project fixture` died on `ERR_MODULE_NOT_FOUND`. **engine/README.md's own step 6 documented a command that could not work.** | **engine** | a project declares `VALIDATOR`; the default is the generic `check-declared.mjs`, so a new project gets real validation on day one without writing any |
| 8 | Output directories were global: every project staged into `out-staging/` and promoted to `out/`. Building the fixture **silently replaced MoreCheese's last good build** — the one thing that pipeline exists to protect. | **engine** | per-project dirs; the default project keeps the historic paths so no doc or emitter changes |
| 9 | `emit-mjsync.mjs` held `DIRECTORY_ORDER` — a hardcoded list of 59 MoreCheese directories. The fixture could not run it at all: the assertion correctly reported all 59 missing from its mapping. The check was right; the list was on the wrong side. | **engine** | `PUSH_ORDER` is declared in the project's seed mapping |
| 10 | Every generated SQL file and data migration said "MoreCheese demo seed" regardless of project. | **engine** | `DISPLAY_NAME` declared per project — slugs are for paths, this is for humans |

Plus two more required-and-undocumented ruleset keys found the same way: `version` (written into
every pack manifest and generated header).

**Ten findings, seven of them engine bugs.** The install path was less project-blind than the
generation path by a wide margin — which is exactly what you would expect, since the generation
path is where the abstractions were designed and the install path is where they were assumed.

What did NOT need changing on the install path: `engine/seed-render.mjs` (the SQL value renderers and
`packSqlLines`), `emit-sql.mjs`'s whole body, and `emit-mjsync.mjs`'s record writing. Those worked
first time for a project with a schema they had never seen.

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

1. The fixture still runs the **whole** pipeline: `build.mjs --project fixture` (generate → validate
   → promote), then `emit-sql.mjs` and `emit-mjsync.mjs` against its promoted output.
2. MoreCheese's output is byte-identical unless the change intends otherwise — **packs, SQL,
   MetadataSync and the harness-private files.** Seven of the ten fixes moved content that those
   files' bytes depend on, so checking only the packs would have proved nothing.

Both are in the suite. The first is what makes the framework claim falsifiable; before this project
existed, an engine change could quietly re-couple the engine to MoreCheese and nothing would notice.

## What this project deliberately is not

Fifty invented members, one decision, five years. It is **not shipped, not installed, and does not
represent any real organisation** — it is a CI fixture, and `[fixture_circle]` is an invented schema
that exists nowhere.

It has no scenario overlays and no bespoke gates. Those are the two claims still untested: whether
scenario overlays generalise, and whether a project's own bespoke validator slots in cleanly. It DOES
now have a seed mapping and runs both emitters, because "the generation path generalises" turned out
to be a much weaker statement than it sounded — four of the ten findings were on the install path,
and they were the worst of the set.

If you are looking for the real dataset it is [projects/morecheese/](../morecheese/).
