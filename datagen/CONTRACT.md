# How to change the data

Read this page. You'll be able to make a real change by the end of it.

Longer reads, only if you want them: [TOUR.md](TOUR.md) explains what this system is.
[AUTHORING.md](AUTHORING.md) has more recipes. Neither is required to start.

---

## Your first change

Say committees should meet six times a year instead of four.

Open `projects/morecheese/ruleset/modules/committees.mjs` and find the number:

```js
params: {
  meetingsPerYear: 4,     // Jan / Apr / Jul / Oct
}
```

Change it to `6`. Then run:

```sh
node cli/build.mjs --n 500 --seed 42 --release 2026-07-31
```

One of three things happens:

**It passes.** You're done. More meetings now exist, with attendance and votes.

**It complains in about two seconds, naming your line.** You typo'd. Fix and rerun.

**A check fails.** Your number now contradicts something else that was written down on
purpose. Read the message before you change anything else — it is usually right. In this
case it might tell you attendance dropped below its expected range, because six meetings a
year is more than these members turn up for.

That's the whole loop. Change a number, run one command, believe the message.

---

## What's in a file

Four parts. Same four in most files, and nothing else:

```js
export default {
  committees: {
    catalog: { ... },   // things that exist
    params:  { ... },   // numbers
    effects: { ... },   // groups that behave differently from average
    mixes:   { ... },   // options with odds
  },
};
```

To know where something goes, ask what kind of thing it is:

| you have | put it in | for example |
|---|---|---|
| a thing | `catalog` | the six committees, the roles, the meeting agenda |
| a number | `params` | how many meetings a year, the minimum roster size |
| "this group does more of it" | `effects` | keen members volunteer more |
| choices with odds | `mixes` | votes go 80% yes, 10% no, 10% abstain |

**A file only uses the parts it needs.** `platform` has no dice in it at all — nothing there
is decided at random — so it has `catalog` and `params` and simply leaves the other two out.
That's normal, not a shortcut.

Some files skip the shape entirely. `heroes` is a plain list of the named people the demos talk
about — there is nothing to put in three of the four parts. `forms` and `core` are left alone
too, for reasons given at the end of this page. **Not every file has to fit**, and forcing one
that doesn't is worse than leaving it.

**If something fits none of the four, ask someone.** Don't add a fifth part on your own. That
sounds like a small thing; it is how this file got hard to read in the first place.

---

## The one thing that isn't obvious

In `params`, look at the shape of the value:

```js
params: {
  meetingsPerYear: 4,                                 // just a setting
  attendPresent: { target: 0.75, tolerance: 0.06 },   // a promise
}
```

A plain number is a setting. Nothing checks what comes out. (Settings don't have to be
numbers — `params` also holds things like an email domain and on/off switches. A parameter is
anything you set, not only anything you count.)

A `target` with a `tolerance` is a **promise**: the generator aims for 75%, and afterwards
something checks the real data and **fails the build** if it came out below 69% or above 81%.
That's what `tolerance` means — how far off is still acceptable.

So you can see which of your numbers are being enforced just by looking at them. You never
have to go read the checking code to find out.

When you add a number that should be enforced, write it as a pair. Never set `tolerance` to
zero — it will fail on completely normal variation.

All shares are fractions, not percentages: `0.75`, not `75`.

---

## Making one group behave differently

This is the only part that needs a paragraph of explanation, so here it is.

You have an average — say 75% of people show up to meetings. Now you want to say keen members
show up more. You don't say *how many* keen members there are, or rewrite the 75%. You just
say how much more, in plain percentage points:

```js
effects: {
  'attendance.keenness': {
    liftPts: 9,
    share: 0.3,
    note: 'keen members treat the seat as a commitment',
    evidence: 'ESTIMATE — no published figure for this',
  },
}
```

- **the key** is `<what happens>.<what causes it>` — attendance, caused by keenness
- **`liftPts: 9`** — this group turns up 9 percentage points more than average
- **`share: 0.3`** — about 30% of people are in this group
- **`note`** — why this is true at all
- **`evidence`** — where the number came from. Write `ESTIMATE` when you made it up. That's
  allowed and normal; pretending otherwise isn't.

The overall 75% still holds. The system works out the maths so the group is higher, the rest
are slightly lower, and the average lands where you said.

`note` or `evidence` is **required**. A rule about how people behave, with no reason attached,
is just a number somebody typed. Writing this rule down found three of them already in here.

*(You will see some effects written with `beta:` instead of `liftPts:`. That's the same idea in
the maths' own units — see the word list at the bottom.)*

**One catch, and it bites hard.** `liftPts` is only converted for the block the calibration
machinery is pointed at — today that is `membership` and nothing else. Written anywhere else it is
never converted, and then every draw that uses it silently produces **nothing**: no rows, no
error, all checks green. That is not hypothetical; it is what happened the first time someone added
a domain by following this page.

The build now stops with a message naming the effect. But the rule is: **outside `membership`,
write `beta:` directly.** Adding a whole new domain? Read
[ADDING-A-DOMAIN.md](ADDING-A-DOMAIN.md) — it exists because of exactly this.

---

## Linking one thing to another

When something refers to something else, point at it — don't retype its name:

```js
const TECHNICAL = { name: 'Technical Standards', termMonths: 24 };

catalog: {
  types: [STANDING, TECHNICAL],
  committees: [
    { name: 'Standards Committee', type: TECHNICAL, formed: '2015-03-01' },
  ],
}
```

Misspell `TECHNICAL` and the file refuses to load and tells you. If you'd typed the name out
as text instead, a misspelling would just quietly do nothing. That has happened here: a person
was assigned to the "Standrads Committee" and simply never got the seat, with no error
anywhere.

---

## One more rule about these files

They hold values only. No reading files, no `new Date()`, no `Math.random()`, no functions.

The reason: the same inputs must always produce exactly the same data, so you can tell what
your change did by comparing before and after. Anything that reads the clock or rolls its own
dice breaks that quietly. `node cli/check-ruleset.mjs` fails the build if a file tries.

---

## Before you show anyone

Four steps, each catching things the one before it can't:

```sh
node cli/build.mjs --n 500 --seed 42 --release 2026-07-31   # 1. the checks
node test.mjs                                              # 2. every seed, full size
mj sync push                                               # 3. does it actually load?
```
4. **Open the app and look at it.**

Steps 1 and 2 both passed on the day step 3 failed with 3,191 errors, and again on the day the
app displayed the street name "Calle Mill". Don't skip 3 and 4 if anyone will see the result.

---

## Words you'll meet in the code

You don't need these to make changes. You'll see them, so here's what they mean.

| word | plain meaning |
|---|---|
| **gate** | a check. "219 gates pass" = 219 checks passed |
| **seed** | the number that decides all the random choices. Same seed, same data, every time |
| **pack** | one output file — all the meetings, all the members |
| **calibrate** | nudge everyone's odds until the overall rate hits the target you asked for |
| **beta** | how strong an effect is, in the maths' own units. `liftPts` gets converted into one |
| **share** | a fraction between 0 and 1 |
| **latent / theta** | a hidden "how keen is this person" score, invented per person, driving lots of their behaviour |
| **hero** | one of the named people the demos tell stories about, whose details are written by hand |
| **deterministic** | same inputs → same output, always. The reason before/after comparison works |

---

## Where things stand

**Every module is now a .mjs file with comments** — all 18 of them. Fifteen also use the four
sections; three keep their own arrangement because the sections would not help them.

Every one was verified the same way: regenerate and confirm the output is **byte-for-byte
identical** to what the old files produced. Nothing about the data changed — only where you
find things.

**Three files keep their own arrangement:**

| file | why |
|---|---|
| `heroes` | a plain list of the named people. Nothing to put in three of the four parts — but each person now opens with a comment saying what they exist to demonstrate, which is the most useful thing in the file |
| `forms` | **the shape does not fit.** A form is one coherent thing — its name, its page, its questions, how it is distributed, how many come in. The four parts would scatter that across three sections and make it harder to read, not easier |
| `core` | **the shape does not apply.** Not a domain: the shared substrate every other file reads (`scale`, `history`, `cohorts`, `regimes`). Already flat, and restructuring it would touch every module for no gain |

Mixed formats still work: the loader takes `.mjs` or `.json` per file. Nothing forces a new
project to use `.mjs`, and `engine/ruleset.schema.json` still describes the JSON form for any
that does — it is just no longer needed by this project.

**Deliberately not done:** tidying up the names across all files (the same idea is currently
called `target`, `presentTarget` and `shareOfEligible` in different places). That waits until
there's a second project to compare against, so the naming is based on two examples rather
than one. Details in [TYPES-PROPOSAL.md](TYPES-PROPOSAL.md).
