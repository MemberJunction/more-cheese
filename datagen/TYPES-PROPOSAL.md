# Proposal: a type vocabulary for the ruleset

**Status: PROPOSAL — awaiting review.** Nothing here is implemented; the point of this
document is to be vetoed. Evidence comes from a full census of the composed ruleset
(29 blocks, 1,777 scalar leaves) joined with a call-site survey of how every value is
consumed across the 23 generator modules, the engine, and the validator.

## The problem, in one sentence

Looking at a key in a ruleset module, you cannot tell whether it is **framework
vocabulary** (means something everywhere, tooling understands it) or **domain dialect**
(private to one module) — and that unpredictability is why the ruleset can't be authored
without reading generator source, i.e. why "only AI can author it."

Today the framework vocabulary is ~7 words (`$note`, `arrows`, `tolerance`, `holdout`,
`heroes`, the `[[v,w]]` shape, the `*Share` range rule). Everything else — `types`,
`roles`, `list`, `meetings`, all of it — is dialect. Nineteen modules, nineteen dialects.

## What the census actually found

The same small set of concepts recurs everywhere — **unnamed, and therefore spelled
inconsistently**. The five worst cases:

1. **One concept, seven names.** The "calibrated target share" (the number fed to
   `childOutcome`/`recurringDecision`) is spelled `target`, `renewalTarget`,
   `memberAttendanceTarget`, `rateTarget`, `shareOfEligible`, `presentTarget`,
   `pursuitShareOfCompleters`, `advocateShare` across 11 read sites.
2. **One concept, three syntaxes.** The weighted mix appears as a pair-array
   (`[["A", 0.5], …]`), as an object map (`medalWeights: {Gold: 0.05, …}`), and as a
   named-field object (`voteSplit: {yes: 0.8, no: 0.1, abstain: 0.1}`). Only the first
   is lint-checked; the other two would accept a negative weight silently.
3. **Catalogs have four key conventions**: `key` (products, factors), `name`-as-key
   (committees, tiers, issue types), `memberNumber` (heroes), and *no key at all*
   (notifications, standing agenda items). Cross-references between them are by string
   and mostly unlinted — 9 reference families, 2 linted.
4. **Arrows without clothes.** 7 coefficients (`engagementBeta`, `incumbencyBeta`, …)
   are semantically arrows but written as bare scalars, so they escape the lint's
   "exactly one authoring form + evidence" rule. Worse: the lint only walks *top-level*
   `arrows` blocks, so even proper arrow objects nested deeper
   (`committees.participation.arrows`, `forms.response.arrows`, four more) are
   **unlinted today** — a live gap found by this survey.
5. **The rot the absence of types already caused** (all verified at file:line in the
   consumption survey):
   - declared and never read: `learning.tracks`, `committees.meetings.dayOfMonth`/
     `.hourUTC`, `regimes.covid.committeesVirtual`, `membership.lateRenewalShare`,
     `sonar.factors[].relationshipPath`/`.windowMonths`, hero pins `committeeSeat`/
     `committeeRole` (dead pins — asserted by nothing);
   - read and never declared: `heroes[].firstName` (issues.mjs reads a field that does
     not exist and always falls back), `pins.certKey`, `arrows[].logitShift`/`strength`
     (compiler accepts them; zero arrows use them);
   - values duplicated inside the ruleset because no shared reference exists:
     `orders.gates.netTermsLate.target` == `paymentProfiles.netTerms.lateShare`,
     `enthusiastRenewal.target` == `arrows.enthusiastTier.groupTarget`, the Employee
     type UUID declared in `relationships.seededTypeIDs` *and* hardcoded in defects.mjs;
   - two hero pins addressed **by array index** (`R.heroes[0]`, `R.heroes[1]`) in the
     validator, against a roster documented as append-only;
   - `issues.recencyOpenDays` consumed by two modules with two different meanings.

None of this is anyone's sloppiness — it is exactly what happens when a vocabulary
exists in people's heads instead of in a schema.

## Design constraints

1. **Predictability** — the status of every key must be knowable at a glance: core type,
   or explicitly domain-private. That is the whole point.
2. **Portability** — datagen is meant to generate believable data for *any* project
   ("a second project = a second directory", FRAMEWORK.md). Type names must be
   domain-free: nothing about cheese, members, or associations may appear in the type
   layer. The cheese lives in values, never in types.
3. **Non-breaking, provable migration** — the generator is deterministic, so every
   canonicalisation step must reproduce byte-identical output (the discipline used for
   the 2026-07-31 mapping consolidation). Renames change keys, not values.
4. **Prose stays** — `$note`/`ESTIMATE`/evidence conventions are part of the contract,
   not casualties of it.

## The proposed vocabulary

### Core types (twelve)

| type | shape | meaning / invariant | today's count |
|---|---|---|---|
| `Share` | number | population fraction ∈ [0,1]; consumed by `bernoulli` | ~50 |
| `Rate` | number | expected occurrences per opportunity (may exceed 1); feeds count draws | ~8 |
| `Target` | `{target, tolerance, se?}` | a number the VALIDATOR holds the output to; `se` names the cushion multiplier (today it varies 0/1.5/2/3 with no stated reason) | ~28 |
| `Arrow` | existing object | causal rule: exactly one authoring form + evidence. **Absorbs the 7 bare betas**; lint walks *all* depths | 9 blocks + 7 bare |
| `Mix` | `[[value, weight], …]` | weighted options; weights positive finite. **One canonical syntax**; object-map and named-field forms migrate | ~17 |
| `Bank` | `[string, …]` | strings to draw from; optional `{placeholders}` declared next to it (`{t}`, `{segment}`) so templates are checkable | ~33 |
| `Catalog` | `[{key, name?, …}, …]` | named things the generator CREATES; `key` is identity (canonical), `name` is display; cross-refs point at `key` | ~24 |
| `Window` | number + unit-suffixed key (`…Days`, `…Months`, `…Years`) | duration; the unit is the suffix, enforced | ~38 |
| `Volume` | number (`…PerYear`, `…Per<X>`) | how many per period | ~18 |
| `Range` | `{min, max}` | canonical two-bound form; the `[lo, hi]` and sibling-key spellings migrate | ~10 |
| `Regime` | `{years, <name>LogitShift…, <name>Multiplier…, flags}` | an era overlay applied post-calibration (tide, not boats) | 1 (covid) |
| `Ref` | string | a cross-reference to a `Catalog` key or an app-seeded name; **every Ref family is schema-checked** (this is where the 9 unlinted reference families get their lint) | ~15 families |

### Expert types (named, documented, not simplified)

`DistParams` (`{mean, dispersionK}` — negbin; today the mean has three names),
`TimingProfile` (the payment-timing grammar in `orders.paymentProfiles` — already a real
grammar, just undocumented), `RuleTable` (`staticAssignment`'s ordered first-match
rules), `LatentParams` (copula/AR(1) parameters). These stay expert-tier: the schema
documents them, the lint bounds them, no attempt to make them beginner-friendly.

### Project vocabularies (documented as their own pages, not core)

- **Heroes/pins** — 34 fields today, three-way split discovered by the survey: 2 pins
  are *generative*, 12 are *asserted by the validator*, 2 are *dead*. The proposal:
  document the pin vocabulary, delete the dead pins (or implement them), and replace the
  two index-addressed assertions with memberNumber addressing.
- **Scenario overlays** — already sound (override-only, enforced). The schema simply
  re-validates the composed result, so an overlay cannot produce an out-of-type value.

### The dialect rule

Anything not a core type is **domain-private by definition** — legal, but the schema
marks it as such, and the editor shows it (e.g. hover: "domain key — consumed only by
committees.mjs"). Predictability comes not from forbidding dialect but from making its
status visible.

## Enforcement, in three layers

1. **JSON Schema** (`ruleset.schema.json` + `.vscode` wiring) — autocomplete, hover docs
   and red squiggles *while typing* in any `ruleset/modules/*.json`. Core types get
   full validation; dialect keys get shape-level checks (Share ranges, Mix weights).
2. **The load-time lint** (already exists) — gains the type rules so CI enforces exactly
   what the editor shows. Fixes the nested-arrows gap as part of absorbing `Arrow`.
3. **`engine/types.d.ts` + JSDoc** — the same vocabulary as types for module authors:
   `Cfg`, `Rng` (draw-costs documented on hover), `childOutcome` options, `MappingEntry`,
   the gate helpers. The editor becomes the documentation.

## What the schema would flag on day one

Running the proposed rules against today's ruleset (from the census): the 14
declared-never-read keys, the 2 read-never-declared hero fields, the 7 unlinted bare
betas, the 6 unlinted nested arrow blocks, the 9 unchecked Ref families, the 3
duplicated values, and the 2 index-addressed pins. That is the concrete, immediate
payoff — before any new authoring happens.

## Migration (three stages, each independently shippable)

1. **Describe** — schema + d.ts written to match what exists, loose where the dialect is
   inconsistent. Zero ruleset edits, zero output changes. Editor experience arrives here.
2. **Canonicalise** — mechanical renames toward the canonical spellings (7 target names
   → `target`; 3 mix syntaxes → pair-array; range spellings → `{min,max}`; catalogs gain
   `key`), one commit per family, each proven by byte-identical output. The generators'
   reads rename in the same commit; values never change.
3. **Enforce** — the schema tightens from "describe" to "require" once a family is
   canonical; the lint follows. New projects start at stage 3.

## Open questions for review (the veto list)

1. `Mix` canonical syntax: pair-array (proposed) or object-map? Pair-array preserves
   author-controlled order and non-string values; object-map reads better for splits
   like `voteSplit`. Pick one; the other migrates.
2. Rename the 7 target aliases to `target`, or keep the domain flavour
   (`shareOfEligible`) and mark them `Target` by schema annotation instead? Rename is
   proposed (predictability wins), but it touches ~11 generator lines.
3. Catalog identity: require `key` everywhere (proposed), or bless `name`-as-key where
   the name *is* the identity (committees)?
4. Dead pins (`committeeSeat`, `committeeRole`): implement the assertions or delete the
   pins? (Proposed: delete; the facts are already asserted via `h.committees`.)
5. Should `Target.se` (the SE-cushion multiplier) be authored at all, or standardised to
   one value validator-wide? Today's 0/1.5/2/3 spread looks accidental.
6. Does the `Regime` type stay covid-shaped (`years` + shifts + multipliers), or
   generalise now to support a second era in some future project?

## What this does NOT do

It does not make the causal machinery beginner-friendly (expert types stay expert), does
not convert the ruleset to a new format (canonical spellings are chosen from existing
ones), and does not automate the craft — believable values and honest `$note`s remain
the author's job. It makes the *status and shape* of every key knowable without reading
generator source. That is the difference between a pile of conventions and a framework.
