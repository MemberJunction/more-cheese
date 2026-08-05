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

**37 commits sit unlanded in two branches, and the second is stacked on the first.**

| branch | commits | status |
|---|---|---|
| `morecheese-datagen-simplify` (PR #14) | 13 | open, CI green, **never reviewed** |
| `morecheese-datagen-framework` | 24 | pushed, **no PR**, and it sits on top of PR #14 |

**Merge order is forced: PR #14 first, then the framework branch.** They cannot go in the other
order, and the second will not rebase cleanly onto `next` without the first.

**This is the single biggest risk in the handover.** The work is done, tested and green — and none
of it is landed, so none of it protects anyone yet. Reviewing and merging these two is worth more
than any further improvement to them. If you read one thing and act on one thing, make it this.

Both branches are green: `node test.mjs` runs 37 steps and every one passes.

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
- **The engine no longer contains this project, and that is now CHECKED.**
  `cli/check-engine-boundary.mjs` fails if any engine module statically imports project code or
  names a project in code. It found a real leak when it was written: `engine/ids.mjs` held a table
  of every project's UUID namespace and told new authors to add theirs to it.
- **A SECOND PROJECT EXISTS and the suite builds it.** `projects/fixture/` — 50 invented members,
  one decision, CI-only, never shipped. Standing it up found three engine bugs and two
  documentation gaps ([projects/fixture/FINDINGS.md](projects/fixture/FINDINGS.md)). It is the only
  reason the word "framework" is defensible here, and the suite step is what stops the engine
  quietly re-coupling to MoreCheese.
- **Row shapes can be declared.** `engine/row-template.mjs` renders a row from data; 17 templates
  across 9 generators. Rows that need conditionals, computed keys or cross-row state stay
  handwritten **on purpose** — each refusal is recorded in the code that hit it.
- **There is a metric, and it runs every suite pass.** `cli/measure-framework.mjs` prints
  declarations:code. MoreCheese is 1.41 : 1 (from 1.35); the fixture, built with the framework
  rather than retrofitted into it, is 1.57 : 1.

## What is half-finished, and what to do about it

**`validate.mjs` still holds ~175 bespoke MoreCheese gates.** A second project gets the derived
gates (references, install order, presence floors, target bands — the fixture gets 8 of them) and
none of the domain wisdom. That is correct: those gates carry knowledge a declaration cannot state
(an ordering between engagement quartiles, votes consistent with attendance by construction). But it
means "framework" is true of the engine, the declarations and the checks DERIVED from them — not of
the domain-specific checking, and it never will be.

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

**The framework metric runs DEGRADED, and its number is approximate.** `cli/measure-framework.mjs`
wants `acorn` for exact AST spans. The dependency is declared in the root `package.json` but has never
been installed, so the tool falls back to a line classifier — it says so in its own output every run,
and every ratio quoted anywhere (1.41 : 1 for MoreCheese, 1.59 : 1 for the fixture) comes from the
fallback. One `npm install` at the REPO ROOT fixes it; do not install inside `datagen/` or any
subfolder of a linked MJ workspace (rule 5, the single-copy invariant). Expect the numbers to shift
slightly when it runs properly — the trend is what the tool is for, not the third digit.

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

## The four coupling points, and the shape each one now has

Everything a new domain has to touch is one of these. Each had the same problem — a shape that
existed in somebody's head and was enforced nowhere — and each now has a named contract:

| you are writing | the shape | enforced by |
|---|---|---|
| a ruleset block | `catalog` · `params` · `effects` · `mixes` | `cli/check-ruleset.mjs`, and declaring earns you gates |
| a generator | `build<Domain>(cfg, deps)`, deps an object; four sections (all 19 carry them); returns named tables | `cli/check-generators.mjs`, `cli/check-streams.mjs` |
| a row shape | a template: single-tag field specs, draws in declaration order | `cli/check-row-templates.mjs` |
| a pack entry | `dependsOn` (true, acyclic) · `tables` · `NOT_SHIPPED` with reasons | `engine/packs.mjs` at emit, plus the install-order gates |

The order they were done in is not the order that mattered. The ruleset came first and is the one
people noticed; the pack map came fourth and was hiding the most expensive failure of the set.

**And one boundary, which is the framework claim itself:** the engine may not name a project or
import project code (`cli/check-engine-boundary.mjs`), and a second project must build with zero
engine edits (the `fixture` suite step). Both are checks, not intentions — see
[engine/README.md](engine/README.md) for what a project owes the engine and what it gets back.

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

### Do it against COMMITTED code, and mind the three ways it lies

Three mistakes I made with this technique in one session, each of which produced a green diff that
meant nothing:

**1. Comparing post-change against post-change.** Generate the baseline BEFORE editing, or from
committed code:

```sh
git archive <commit> datagen | tar -x -C /tmp/pre     # a clean pre-change tree
(cd /tmp/pre/datagen && node cli/generate.mjs --n 500 --seed 42 --release 2026-07-31 --out out-ref)
node cli/generate.mjs --n 500 --seed 42 --release 2026-07-31 --out out-now
diff -r /tmp/pre/datagen/out-ref out-now
```

**2. Gating each commit against its own parent, and never end to end.** Two changes can cancel out,
or a late one can drift while every individual diff passed. Whole stacks of work want one final diff
against the commit before the stack. Ten framework commits were verified that way on 2026-08-05:
byte-identical across five seeds (42, 7, 99, 2026, 13) at n=500 AND n=2500, for packs, run.json,
validation-latents, validation-events, motifs, all 12 SQL files, and the whole MetadataSync tree.
Multiple seeds matter — a change can be invisible on one draw sequence.

**3. Diffing only the packs.** `out/` also holds run.json and the validator-private files, and the
install artifacts are produced separately. Anything that touches the emitters or the pack contract
needs `emit-sql.mjs` and `emit-mjsync.mjs` run from both trees and diffed too.

**And the thing it fundamentally cannot see: a change that did not happen.** A stray
`git checkout -- projects/` reverted sixteen `thetaAt` call sites mid-session; the output stayed
byte-identical BECAUSE the code had reverted, the suite stayed green, and a commit message claimed
work the tree did not contain. `node cli/check-generators.mjs` now reports any engine/authoring.mjs
helper that no project's generators call, which is what would have caught it. **A byte-diff proves
you did not break anything. It does not prove you did anything.**

---

## Prove you can run it — 30 minutes, do this on day one

Not reading. Doing. If any step surprises you, the documentation is wrong and fixing it is your
first contribution.

1. `node test.mjs` — 37 steps, all green. If not, stop and find out why before anything else.
2. Open `projects/morecheese/ruleset/modules/committees.mjs`, change `meetingsPerYear` from 4 to 6,
   and run `node cli/build.mjs --n 500 --seed 42 --release 2026-07-31`. Read whatever it says.
   Change it back.
3. `node cli/new-domain.mjs trials` — scaffold a domain, follow the three printed wiring steps, and
   generate. It should produce rows on the first run. Then delete the three files and the wiring.
3b. `node cli/generate.mjs --project fixture --n 50 --seed 42 --release 2026-07-31 --out out-fx`
   then `node cli/check-declared.mjs --out out-fx`. That is the SECOND project — 50 invented
   members, one decision. Read [projects/fixture/FINDINGS.md](projects/fixture/FINDINGS.md) after:
   it is the shortest honest account of where the framework claim holds and where it did not.
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
