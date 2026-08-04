# Adding a domain

The path for the biggest thing you can do here: teach the generator a kind of behaviour it
doesn't have yet — support tickets, or speakers, or book loans.

Tuning numbers is [CONTRACT.md](CONTRACT.md). This is the other job, and it is the one that used
to require somebody who already knew the whole system. It doesn't, but only if you follow the
order below. **The order is the whole trick.** Every step exists because doing it later costs
more than doing it now.

This path was walked end to end before it was written down. Where it says something breaks, it
broke.

---

## Step 0 — Is it a domain?

If your thing is *more rows of something that already exists*, it isn't a domain. Add to a
catalog and stop — you're in `CONTRACT.md` territory and you're done in ten minutes.

It's a domain when it makes its **own decisions**. Support tickets are a domain: something decides
who files one, how severe it is, who picks it up. A new committee is not: the committee machinery
already exists.

## Step 1 — Write down every decision, in a sentence each

Do this before touching a file. On paper.

> *Some members file a ticket each year. Its severity depends on what it's about. Most tickets get
> assigned to an officer. Tickets get resolved, or don't.*

Four decisions. This list is the design, and the next step turns it into code almost mechanically.

**Why first:** each decision maps to exactly one of five patterns. If you write the generator
before you have this list, you'll invent machinery that already exists — which is what every
hand-written domain here did before the patterns were extracted.

## Step 2 — Match each decision to a pattern

**This is the vocabulary.** The engine knows five behaviours and no others:

| your sentence sounds like | pattern | already used for |
|---|---|---|
| "each year, some of a pool take part — and those who do create rows" | `annualParticipation` | course enrolment, conference attendance |
| "each cycle, they decide yes or no, and their **state changes**" | `recurringDecision` | the renewal unroll |
| "each row that exists gets an outcome" | `childOutcome` | course completion, event no-show |
| "each fact spawns a **timed** money-ish child" | `derivedTransaction` | invoice → payment |
| "pick a category from ordered rules, **no dice**" | `staticAssignment` | membership tier from segment |

The four ticket decisions: file-a-ticket is `annualParticipation`; severity is a **mix** (a plain
weighted draw, no pattern needed); assignment is a mix over a pool; resolution is `childOutcome`.

**If a decision fits none of the five, stop and ask.** That is a real signal — either it reduces
to one of these, or the engine needs a sixth, which is an engine change and a conversation, not
something to work around. Working around it is how you end up with a domain nobody else can read.

**Every pattern's target has a denominator, and you must know which:**

- `annualParticipation` — **per year**, share of *that year's* pool. Not lifetime. Over eight
  years a 62% annual rate makes nearly everyone participate once, so a lifetime measurement reads
  ~96% and looks broken when it's correct. This mistake has been made twice here, once by the
  person who wrote these docs.
- `recurringDecision` — per cycle, share of the cohort deciding *that* cycle.
- `childOutcome` — over the **items you passed in**, selection effect included.

## Step 3 — Write the ruleset block

Four sections, per `CONTRACT.md`. Your decision list tells you what goes where:

```js
export default {
  tickets: {
    catalog: { types: [...], statuses: [...] },        // the things
    params:  { filedShare: { target: 0.3, tolerance: 0.05 } },   // the numbers
    // beta, NOT liftPts — see the trap at the bottom of this page
    effects: { 'file.engagement': { beta: 0.5, label: 'med', note: '…', evidence: 'ESTIMATE' } },
    mixes:   { severityBilling: { High: 0.5, Medium: 0.4, Low: 0.1 } },
  },
};
```

Add it to `ruleset/modules/index.json` and run the build.

**Two things happen, and the second is the useful one.**

The build **passes**. Your block is inert — nothing reads it yet, so nothing generates. Don't read
that as progress.

Then run the validator, and it **fails, telling you what you still owe**:

```
❌ every declared mix has a landing site  — NO LANDING: speakers.mixes.track
```

Declaring a mix or a target pair is a promise that something checks it, so the build chases you
until you keep the promise. That is the closest thing here to a to-do list, and it is generated
from what you wrote rather than remembered.

**Write `beta:` for your effects, not `liftPts:`.** See the trap at the bottom of this page — it is
the single most expensive mistake available to you, and the reason this document exists.

## Step 4 — Register a UUID namespace *(new projects only)*

Skip if you're adding a domain to MoreCheese. If this is a whole new project, `uuidgen` once, strip
the dashes, and export it from your project's `index.mjs`:

```js
export const UUID_NAMESPACE = '…32 hex chars…';   // frozen forever
```

The loader reads it from your project and **fails loudly** if it's missing or malformed, because two
projects sharing a namespace mint identical UUIDs for overlapping keys. It lives in your project, not
the engine — see [engine/README.md](engine/README.md) for the full list of what a project owes the
engine and what it gets back.

## Step 5 — Write the generator

One file, `projects/<project>/tickets.mjs`.

**THE GENERATOR CONTRACT.** The ruleset has four named sections; a generator has four too, and the
same reason: you always know where to look. `node cli/check-generators.mjs` enforces the
structural half.

| | |
|---|---|
| **signature** | `build<Domain>(cfg, deps)` — deps is ALWAYS an object, never positional |
| **inputs** | bind the ruleset sections and the upstream data |
| **fixtures** | catalog → rows. No dice |
| **decisions** | one pattern call per decision, in causal order |
| **shape** | assemble, strip internals |
| **return** | `{ <tableName>: rows }` — named tables, nothing else |

The object signature is not style. `buildIssues` took seven positional parameters, four of them
arrays of rows: transpose two and you get confidently wrong data, no error, and a call site that
tells you nothing about what it passes. All nineteen generators were normalised in one pass with
byte-identical output.

All nineteen generators carry these four headers, so the shape is something you can rely on when
reading an unfamiliar one — not just advice for new files.

The house shape:

```js
import { yearsOf, thetaAt, stripInternals } from '../../engine/authoring.mjs';

export function buildTickets(cfg, { people, periods }) {
  const { R, seed, release } = cfg;
  // ── inputs ──
  const T = R.tickets;
  const P = T.params;                       // scalars behind one alias

  // ── decisions ── one pattern call per decision from Step 1, in causal order
  const tickets = annualParticipation({
    seed, years: yearsOf(cfg),
    poolOf: (y) => people.filter(…),
    scoreOf: (p, y) => T.effects['file.engagement'].beta * thetaAt(p, y),
    target: P.filedShare.target,
    streamKey: (p, y) => `ticket:${p.MemberNumber}:${y}`,   // unique per decision
    spawn: (r, p, y) => ({ … }),            // draws happen here, in a fixed order
  });

  // ── shape ──
  stripInternals(tickets);
  return { tickets };
}
```

Read paths say what kind of thing they are, which is the point: `T.catalog.` is authored content,
`P.` is a tuned scalar, `T.effects[…]` is a causal claim, `T.mixes.` is a weighted draw.

**Use the helpers in `engine/authoring.mjs` — they are the setup, not the decisions:**

| | |
|---|---|
| `yearsOf(cfg)` | the years this world covers. Four generators wrote the loop out |
| `thetaAt(p, y)` | how engaged this person was in year `y`. **The most-written expression here** — sixteen sites spelled it `p._thetaPath?.[y] ?? p._theta`, which is mechanism, not meaning, and one chance per site to reference the wrong year |
| `coverageOf(rows)` | an indexed "was this member covered on this date" lookup |
| `stripInternals(rows)` | drop every `_`-prefixed field before returning. The emitter **refuses** any that survive, so you cannot ship one by forgetting a `delete` |

**Two rules that are not style:**

**One dice stream per decision**, named for it. `rng(seed, 'ticket:ICF-000101:2019')`. Streams are
why the same seed reproduces the same world; sharing one between two decisions couples them
invisibly — both get plausible numbers, and the two decisions silently become correlated, which no
distribution gate can see. `node cli/check-streams.mjs` now catches it and names both call sites.
Reach for an obvious prefix (`renewal:`, `order:`) and it will tell you if it is taken.

**Never reorder draws inside a stream.** Adding a draw in the middle re-rolls everything after it,
which surfaces as a diff in data you didn't touch.

Then wire it into `buildWorld` and the pack map in `projects/<project>/index.mjs`. Where in the
order? [PIPELINE.md](PIPELINE.md) shows the 22 stages as a graph — put yours after everything it
reads.

**THE PACK CONTRACT.** The pack map is how rows become installable folders. Each entry declares
two things, and each is a claim:

| | |
|---|---|
| `dependsOn` | the packs an installer must load first — **checked** against `refs.mjs`, transitively, and for cycles |
| `tables` | table name → the rows that ship. One table per line |
| `NOT_SHIPPED` | anything generated that deliberately ships nowhere, **with a reason per entry** |

**This step used to be the easiest one to skip and the most expensive.** A domain wired into
`buildWorld` but left out of the pack map generates its rows and ships **nothing** — measured: 257
of 257 gates passed and the output was empty. It is the last of three wiring steps and it was the
only one nothing chased you about. Now the build stops and names the tables.

That is also why `NOT_SHIPPED` exists. Not shipping something is legitimate — validator-private
ground truth, or rows folded into another pack's table — but it is a *decision*, and without
writing it down it looks exactly like forgetting.

**If your stage MUTATES something an existing stage reads** — writing a field onto people, say —
that ordering is invisible in the argument lists and nothing will enforce it. Declare the edge in
`projects/<project>/pipeline.mjs` and the suite will hold it. Swapping two such calls otherwise
compiles, runs, and quietly changes the data: verified, by swapping two lines and watching
committee memberships, attendance and motions all move.

## Step 6 — Declare the checks (don't write them)

Three of the four rule kinds generate their own gates. You write **declarations**, not gates:

| what you declare | where | what you get |
|---|---|---|
| `{ target, tolerance }` in `params` | the ruleset | the build **fails** until you supply a measurement — you can't forget it |
| a reference edge | `refs.mjs` | the dangling-reference gate |
| where a mix lands | `presence.mjs` | every option is required to appear |
| an effect with a reason | the ruleset | the recovery gate that checks the effect is really in the data |

Write bespoke gates only for what a declaration can't say — *"votes are consistent with attendance
by construction"*. Those carry knowledge, and they're worth the lines.

**Declaring a target pair means "a check enforces this."** If you don't want it checked, use a bare
number.

## Step 7 — Verify up the ladder

```sh
node cli/build.mjs --n 500 --seed 42 --release 2026-07-31   # gates
node test.mjs                                              # every seed, full size
mj sync push                                               # does it LOAD?
```
4. **Open the app and look at it.**

Each rung catches what the one below can't. Steps 1–2 passed on the day step 3 failed with 3,191
errors, and again on the day the app rendered the street name "Calle Mill". Don't skip 3 and 4.

---

## The trap that eats a whole afternoon

**Write `beta:` for effects in a new domain. Not `liftPts:`.**

`liftPts` and `groupTarget` are the human forms, and `CONTRACT.md` recommends them — correctly, for
`membership`. They are only *converted into a coefficient* for the one block the calibration
machinery is pointed at (`hooks.compile.arrowsOf`). Anywhere else the coefficient stays undefined,
and then:

```
undefined × keenness  →  NaN  →  every draw is false  →  your domain generates ZERO ROWS
```

with a passing build and every gate green. This is not a hypothetical. Walking this page for the
first time, with an effect written exactly as `CONTRACT.md` teaches, produced **132 talks worth of
nothing** and no complaint from anything.

The build now stops with a message naming the effect and telling you to write `beta` instead. If you
genuinely need a calibrated human form in a new domain, that means extending `arrowsOf` and the
feature map — a real change, worth a conversation.

## The four ways this breaks silently

Every one of these shipped wrong data with **green gates**. They're the reason the order above is
what it is.

**A defensive read on a key you moved.** `if (D.referral)`, `M.churnReasons ? … : fallback`,
`O.addOns?.journalShare ?? 0`, `R?.orgs?.legalStructure?.byType?.[…]` — each turned a rename into
*silently wrong data* rather than a crash. 146 relationship edges vanished; every cancellation
reason collapsed to one value; every organisation lost its legal structure; the renewal engine
calibrated to `NaN` and produced 0% renewal for thirteen years. **None was caught by any gate.**
Only comparing output bytes found them. Don't write `?? 0` on a ruleset value.

**A wrong denominator.** See Step 2. Twice now.

**An effect key used as a field name.** Effects are keyed `<decision>.<driver>`, but the *recorded*
event field is the driver alone. Get it wrong and the group filters match nothing, the solver
divides by zero, and every solved effect becomes `NaN`.

**A check that has stopped checking.** Twice today: a schema checker validating the wrong file
after its inputs moved, and derived gates wired in *after* the validator's fail-fast bailout, so a
broken world stopped the run before they ran. Both reported green. **When you add a check, plant
the defect and require your gate to fire by name.** A checker that has never caught anything is
decoration.

---

## What this does not make easy

Writing a generator is still real programming, and it did not get shorter. Measured before any of
this: only 30 of 185 row-shaping sites were mechanical, and there were 14 pattern calls in 3,763
lines — the five patterns already captured the reusable part, so there was no boilerplate left to
remove and none was invented.

What the path gives you is **not fewer lines, but no invention**: a known order, a fixed vocabulary
of five behaviours, and checks that follow from declarations. The judgement — what makes a rate
believable, what story the data should tell — is yours, and no framework will take it.
