# The datagen system, explained like a factory

This is the no-jargon tour. It exists for the person inheriting this system who wants to
understand what it *is* before reading how to change it (that's [AUTHORING.md](AUTHORING.md))
or how it works mathematically (that's [HOW-IT-WORKS.md](HOW-IT-WORKS.md)).

## The one-paragraph version

This system **manufactures a believable fake association** — the International Cheese
Federation: 2,500 members, 13 years of history, orders, events, committees, support tickets —
so MemberJunction demos have something real-feeling to show. It is a factory: a spec sheet
goes in, data comes out, inspectors check it, and the shipping department packs it for
delivery. Everything below is just naming the stations.

## The five stations

```
 spec sheet          machines              warehouse         shipping           inspectors
 ruleset/*.json  →   projects/*.mjs    →   out/packs/    →   emitters       →   validate.mjs
 (numbers, knobs)    (the generators)      (finished JSON)   (2 box formats)    (219 gates)
```

**1. The spec sheet** — `ruleset/modules/*.json`. Plain JSON files full of numbers and
names: renewal rates, event volumes, committee lists, prices, the heroes' pinned stories.
This is the surface a human edits. No code here.

**2. The machines** — `projects/morecheese/*.mjs`. Code that reads the spec and rolls
(deterministic) dice to manufacture members, orders, meetings. This is where causality is
built — engaged members really do renew more, COVID really did dent 2020. Changing these is
real programming; the rule is *copy an existing machine, don't invent*.

**3. The warehouse** — `out/packs/`. The finished goods: plain JSON arrays, one file per
table. Nobody edits these; they're output.

**4. Shipping** — the emitters. The same goods leave the factory in **two box formats**:
raw SQL (`emit-sql` / `emit-data-migration` — for direct database installs) and a
MetadataSync tree (`emit-mjsync` — for MJ's own sync tool, which loads data through the
app's stored procedures). One warehouse, two kinds of truck. The **packing instructions** —
which JSON field goes in which database column, how IDs are derived — live in ONE place:
`engine/seed-mapping.mjs`.

**5. The inspectors** — `cli/validate.mjs`, 219 gates. Every build is checked before it's
allowed to ship: do all the references point at things that exist, are the percentages
where the spec says, does every category actually appear, do the causal rules show up in
the data they were supposed to shape. A red gate rejects the build.

## The property that makes everything safe

**Same spec + same seed = byte-for-byte identical output. Always.** No wall-clock, no
un-seeded randomness. This "replay" property is the safety net under every change:

- Refactoring the machinery? Snapshot the output, refactor, regenerate, compare. If one
  byte differs, you broke something. (This is exactly how the 2026-07-31 consolidation was
  proven — SQL byte-identical, all 122,221 shipped records semantically identical.)
- Reviewing someone's data PR? The diff of the *output* is the complete, honest story of
  what their change did.

## The three protections (added 2026-07-31, each after a real incident)

**Packing instructions used to exist twice.** The SQL truck and the MetadataSync truck each
had their own copy of the instructions for all 59 tables, and the copies drifted — one
wrong word in the sync copy (`Entities` for `MJ: Entities`) once failed 3,191 records at
load. Now there is **one instruction sheet per table** and both trucks pack from it. If an
instruction references something that has no translation for one of the trucks, the build
*stops and names it* rather than packing a blank.

**The spec sheet is proof-read the moment you hand it in.** Before: a typo like `15` where
`0.15` was meant, or a hero chairing the "Standrads Committee", either crashed the factory
mid-shift with a cryptic error or — worse — produced silently wrong goods (that hero seat
just never materialised, no error anywhere). Now: the build starts by linting the spec and
fails in seconds with the exact location — *"world.attendShare: 1.4 — share values are
probabilities in [0, 1]"*. Broken JSON names its file.

**Inspectors got standard procedures.** Writing a new gate used to be ~30 lines of custom
code; the five recurring question-shapes are now one-line helpers in `engine/gates.mjs`:

| helper | the question it asks |
|---|---|
| `fkResolves` | does every X point at a Y that exists? |
| `shareBand` | is this percentage near its target, within tolerance? |
| `presenceFloor` | does every category actually appear at least once? |
| `distinctAtLeast` | is there enough variety that repetition isn't visible? |

`presenceFloor` carries a scar worth knowing: Critical-severity tickets sat at **zero for
weeks** behind a *passing* percentage gate, because 0% was inside the tolerance band — a
percentage check cannot notice an entirely missing category. The lint and the helpers are
themselves negative-tested in the suite: each must catch a deliberately planted defect, or
the build fails. Checkers that have never seen a defect are decoration.

## Three changes, slowly

### Tier 1 — turn a knob (anyone, five minutes)

Say webinars should be better attended. Find the number in `ruleset/modules/events.json`,
change it, run `node cli/build.mjs --n 500 --seed 42 --release 2026-07-31`. Three outcomes:

- **green** — done; the diff of `out/` shows exactly what moved;
- **lint error in 2 seconds** — you typo'd; it names the path; fix and rerun;
- **a red gate** — your number contradicts an authored fact elsewhere (maybe a hero's
  pinned story, maybe a team-ruled benchmark). *Read the gate before loosening it* — it is
  usually right.

### Tier 2 — add to a list (careful human, an hour)

Add a committee to `committees.json`. The mechanics are Tier 1, plus one habit: **ask what
scales off this list**. Committee seats are drawn from a fixed volunteer share, so more
committees split the same people thinner — the real incident produced committees of one
member until the share was raised and a roster floor added. The gates catch the worst of
it; the habit catches the rest.

### Tier 3 — a new domain (the full loop, a day)

Say the team wants **speakers**. Five steps, in order:

1. **Spec block** in the ruleset — counts, shares, `$note` on every constant, `ESTIMATE`
   where it's a guess. *(Protected by: the lint.)*
2. **A machine** — copy the nearest module (`programs.mjs` is a good template), keep the
   house idioms (one dice-stream per decision, business keys → pinned IDs).
   *(Protected by: determinism — any accidental change to existing data shows up as a
   diff in `out/`.)*
3. **One packing instruction** in `seed-mapping.mjs` — the table, the columns, `dir` +
   `entity` for the sync truck. Add the folder name to the push order in `emit-mjsync.mjs`
   — forget, and the build refuses with a message saying exactly that.
   *(Protected by: the consolidation — there is no second copy to forget.)*
4. **Gates** — three helper one-liners (references resolve, share on target, categories
   present) plus one bespoke gate asserting the *question the domain answers* is
   answerable. *(Protected by: the helpers being pre-tested.)*
5. **Verify up the ladder** — build → full suite (`node test.mjs`) → `mj sync push` into a
   dev database → open the real UI and look. Each rung catches what the one below can't:
   gates check the goods, the push checks the loading dock, only *looking at it* catches
   "reads as fake". ("Calle Mill 204" passed 215 gates and a clean push; one glance at a
   rendered address grid caught it.)

## What stays hard on purpose

The **causal machinery** (`engine/` — calibration, the β solver, the rng discipline) is the
genuinely difficult part, and no data change needs to touch it. The rule of thumb printed
in AUTHORING.md holds: *ruleset = edit freely, project modules = copy one, engine = don't.*
And the judgment work — designing believable cause-and-effect, writing content that doesn't
read as generated — is not automated away by any of this. The 2026-07-31 changes removed
the clerical hazards; they didn't remove the craft.
