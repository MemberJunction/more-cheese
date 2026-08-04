# Handoff

**Read this before anything else in this directory.** The other docs teach you how to use the
system. This one tells you what state it is in, what is half-finished, and what will bite you.

The person who built this workstream is leaving. Everything below is written for whoever picks it
up, on the assumption you cannot ask them.

---

## What this is, in four sentences

`datagen/` manufactures a believable fake association — the International Cheese Federation:
~2,500 members, thirteen years of history, orders, events, committees, support tickets — so that
MemberJunction demos have something real-feeling to show.

It is deterministic: the same spec and the same seed produce byte-identical data, every time. That
one property is the safety net under every change you will make, and it is the thing to protect
above all else.

Data is authored as **declarations** (numbers, lists, causal rules) in `projects/morecheese/ruleset/`;
**generators** turn those into rows; **checks** verify the result against the same declarations.

Start with [CONTRACT.md](CONTRACT.md) to change something, [ADDING-A-DOMAIN.md](ADDING-A-DOMAIN.md)
to add something, [TOUR.md](TOUR.md) if you want the plain-English tour first.

---

## ⚠ The state of the work, and the first thing to do

**28 commits sit unlanded in two branches, and the second is stacked on the first.**

| branch | commits | status |
|---|---|---|
| `morecheese-datagen-simplify` (PR #14) | 13 | open, CI green, **never reviewed** |
| `morecheese-datagen-framework` | 15 | pushed, **no PR**, and it sits on top of PR #14 |

**Merge order is forced: PR #14 first, then the framework branch.** They cannot go in the other
order, and the second will not rebase cleanly onto `next` without the first.

**This is the single biggest risk in the handover.** The work is done, tested and green — and none
of it is landed, so none of it protects anyone yet. Reviewing and merging these two is worth more
than any further improvement to them. If you read one thing and act on one thing, make it this.

Both branches are green: `node test.mjs` runs 33 steps and every one passes.

---

## What is finished and can be trusted

- **The ruleset is one shape.** All 18 modules use four sections — `catalog` (things), `params`
  (numbers), `effects` (who differs), `mixes` (weighted options) — and are `.mjs` with real
  comments instead of prose smuggled into fake JSON keys.
- **Declaring earns you checks.** A `{ target, tolerance }` pair fails the build until you say how
  to measure it. A reference edge, a mix landing, an effect — each generates its own gate.
- **The reference graph is complete and declared.** All 100 edges live in `projects/morecheese/refs.mjs`,
  including the polymorphic ones (`RefKind`/`OwnerKind`), which used to be a hand-written switch whose
  final branch failed closed. Eleven bespoke reference gates are gone; nothing hand-counts a dangling
  reference any more.
- **The traps are loud.** Everything in the list below used to be silent.
- **The engine no longer contains this project.** 19 lines of domain code in `engine/`, down from
  155 in one file.

## What is half-finished, and what to do about it

**`validate.mjs` still holds ~200 bespoke MoreCheese gates.** A second project gets the derived
gates (run `node cli/check-declared.mjs --out out`) and none of the domain wisdom. That is correct
for now — those gates carry real knowledge — but it means "framework" is true of the engine and not
yet of the checking.

**`gatedElsewhere` in `projects/morecheese/measurements.mjs` is down to 3, and that is the floor.**
It began at 15 hand-gated targets; twelve now derive from their declarations. The three that remain
each compare against something a `{ target, tolerance }` band cannot express — a vector target with
a deliberate +0.02 offset, a mean-standard-error across years rather than a binomial one, and a
target that is composition-adjusted in logit space before comparison. Every reason is written out
next to the list. **Do not migrate these to hit zero**; each would silently change the band it
replaces, and the adjustment in the third one IS the knowledge that gate carries.

The migration recipe, if a fourth target ever needs it: add the measurement first and run the
validator, which then prints the derived gate and the bespoke gate side by side over the same
build. The observed value, the ± band and the detail string must match to the digit before you
delete anything. That step is not ceremony — it caught a real defect on the very last batch: the
no-show measurement counted prospect registrations that the bespoke gate excluded, moving the
webinar denominator from 1,702 rows to 1,962. Both numbers passed the band, so a single-gate check
would have looked correct while measuring a different population than the target was set for.

**`TYPES-PROPOSAL.md` is a proposal, not a plan.** It describes a canonical vocabulary — the same
idea is currently spelled `target`, `presentTarget` and `shareOfEligible` in different files.
**Team ruling (2026-07-31): it waits for a second project to exist**, so the vocabulary generalises
from two examples instead of being guessed from one. Do not start it on one project.

**`FRAMEWORK.md` was wrong in three places and is now right.** If you find a fourth claim in it that
the code does not honour, that is a bug in the document, and the fix is to make the code true or the
document honest — not to leave both.

**The BizApps app UIs have never been opened over this data.** Five `@mj-biz-apps/*-ng` client
packages were never bundled. Everything upstream of the database is checked mechanically; everything
downstream is checked by a human noticing. The two worst data defects of the last month — street
names like "Calle Mill", and ZIP codes that did not match their state — passed every gate and a
clean push, and were caught by looking at a rendered grid.

---

## The three coupling points, and the shape each one now has

Everything a new domain has to touch is one of these. Each had the same problem — a shape that
existed in somebody's head and was enforced nowhere — and each now has a named contract:

| you are writing | the shape | enforced by |
|---|---|---|
| a ruleset block | `catalog` · `params` · `effects` · `mixes` | `cli/check-ruleset.mjs`, and declaring earns you gates |
| a generator | `build<Domain>(cfg, deps)`, deps an object; four sections (all 19 carry them); returns named tables | `cli/check-generators.mjs`, `cli/check-streams.mjs` |
| a pack entry | `dependsOn` (true, acyclic) · `tables` · `NOT_SHIPPED` with reasons | `engine/packs.mjs` at emit, plus the install-order gates |

The order they were done in is not the order that mattered. The ruleset came first and is the one
people noticed; the pack map came last and was hiding the most expensive failure of the three.

## The six things that will bite you

Every one of these shipped wrong data with **green gates**. They are why the checks exist in the
shape they do.

**1. A defensive read of a moved key.** `P.someShare ?? 0` looks careful; it is dead code that
becomes silent corruption the moment the key moves. Four separate instances in one day: 146
relationship edges vanished, every cancellation reason collapsed to one value, every organisation
lost its legal structure, and the renewal engine calibrated to `NaN` and produced 0% renewal for
thirteen years. **None was caught by any gate.** `node cli/check-reads.mjs` now forbids the pattern.

**2. `liftPts` outside `membership`.** The human forms for authoring an effect are only converted in
the one block the calibration machinery points at. Anywhere else the coefficient stays undefined,
every draw is false, and the domain generates **zero rows** with a passing build. The build now
stops and names the effect. **Write `beta` in a new domain.**

**3. A wrong denominator.** `annualParticipation`'s target is per YEAR, not per lifetime. Measured
over eight years it reads ~96% against a 62% target and looks broken when nothing is wrong. This
mistake was made twice here, once by the person who wrote the documentation.

**4. A checker that has stopped checking.** Four instances in one day: a schema checker validating
the wrong file after its inputs moved; derived gates wired in *after* a fail-fast bailout so they
never ran; a test reporter that crashed on the failure it was handed; and a command that printed a
failure and exited 0. **When you add a check, plant the defect and require your gate to fire by
name.** A checker that has never caught anything is decoration.

**5. A domain that ships nowhere.** Wire a generator into `buildWorld`, forget the pack entry, and
it produces rows into memory and writes none. Measured: 257 of 257 gates green, output empty. The
pack entry was the last of three wiring steps and the only one nothing chased you about. The
emitter now refuses, naming the tables — and `NOT_SHIPPED` is where a deliberate non-shipper goes,
with a reason, so that it stops looking like forgetting.

**6. Mutation-order dependencies.** Some stages must run before others for reasons no argument list
shows. Swapping two lines compiles, runs, and changes the data — verified. The load-bearing ones are
declared in `projects/morecheese/pipeline.mjs`; see [PIPELINE.md](PIPELINE.md) for the graph.

**The single technique that caught all of the above:** regenerate and diff the bytes.
`node cli/generate.mjs --n 500 --seed 42 --release 2026-07-31 --out out-x` before and after any
change, then `diff -r`. If output moved and you did not mean it to, stop.

---

## Prove you can run it — 30 minutes, do this on day one

Not reading. Doing. If any step surprises you, the documentation is wrong and fixing it is your
first contribution.

1. `node test.mjs` — 33 steps, all green. If not, stop and find out why before anything else.
2. Open `projects/morecheese/ruleset/modules/committees.mjs`, change `meetingsPerYear` from 4 to 6,
   and run `node cli/build.mjs --n 500 --seed 42 --release 2026-07-31`. Read whatever it says.
   Change it back.
3. `node cli/new-domain.mjs trials` — scaffold a domain, follow the three printed wiring steps, and
   generate. It should produce rows on the first run. Then delete the three files and the wiring.
4. Break something on purpose: in any pack under `out/packs/`, change one foreign key to a bogus
   value and run `node cli/check-declared.mjs --out out`. It must name the edge.

If all four work, you can run this system. If step 3 or 4 does not, that is the highest-priority bug
in the repo.

---

## Open questions with no owner

These need a decision from whoever inherits this, and none of them has one:

- **Merge and land the two branches.** See above. Everything else is secondary.
- **Should the ~200 bespoke gates move behind declarations?** Some carry knowledge a generated gate
  cannot express. Some are just old.
- **Does a second project actually exist in the plan?** Several deferred decisions — the canonical
  vocabulary, whether `Regime` generalises, what belongs in the engine — are waiting on it. If the
  answer is no, close them as won't-do rather than leaving them open forever.
- **Who looks at the app UIs?** The data has never been seen rendered in the apps it targets.

---

## What not to do

**Do not edit an applied migration.** Additive only, always. One baseline migration still contains a
colleague's name in a comment; that is not worth rewriting applied history over.

**Do not reorder the `heroes` array.** Position is load-bearing — heroes overwrite crowd slots by
index, so inserting one rewrites unrelated people. Append only.

**Do not add a fifth section to a ruleset block.** If something fits none of the four, that is a
signal worth a conversation. A fifth section in one file is how this format became hard to read the
first time.

**Do not trust a green build for anything user-visible.** Push it and look at it.
