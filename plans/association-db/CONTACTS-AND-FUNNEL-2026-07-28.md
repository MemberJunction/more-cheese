# Contacts, non-members and the membership funnel (2026-07-28)

What shipped on `morecheese-datagen-contacts`, why, and what was deliberately left out.
Companion to the identity/catalogue plan of 2026-07-27; same rules, same suite.

## Why this work

Mounting the real BizApps UIs over the data showed **25 tables owned by installed apps sitting
at zero rows** — screens those apps ship, rendering empty. Three of them were ours to fill
immediately, because we were already generating the facts and putting them somewhere else.

Separately, the dataset claimed **100% of the people the federation knows are paying members**,
which no association anywhere can say.

## 1. Contact methods and addresses (commit 1)

bizapps-common owns the contact/address domain and ships the UI that reads it. We were writing
the same facts into `MemberProfile` columns and leaving `ContactMethod`, `Address` and
`AddressLink` empty — against the ownership rule in BIZAPPS-COVERAGE.md, which says the system
of record is the app that owns the domain.

- 2,377 addresses + links, 6,736 contact methods at n=2500.
- Addresses are a **pure projection** of fields the identity pass already wrote — no draws, so
  nothing upstream moved. Only the second phone and the LinkedIn handle consume randomness.
- `ContactType`/`AddressType` are app-seeded (F6): referenced by name through preamble
  DECLAREs on the INSERT path and `@lookup` on the metadata path; the playground shim seeds
  its own copies so standalone builds still load.
- `MemberProfile` keeps its denormalised copy for segmentation.

**The schema contract earned its keep here.** The seeded names are `Mobile Phone` and
`Work Phone` — with spaces — not the `MobilePhone`/`WorkPhone` assumed from a mangled terminal
reading. Every gate passed and the packs looked perfect; it would have failed at install on a
lookup returning NULL against a NOT NULL column, thirteen minutes into an apply.

## 2. Non-members (commit 2)

A non-member is a **Person with no MemberProfile** — the v2 identity/membership split already
modelled this, so no schema change was needed. Both emitters gained an `only:` row filter.

- 949 non-members against 2,109 members at n=2500.
- The validator names the populations apart **at load**: `people`/`regs` still mean MEMBERS,
  exactly as all existing gates were written; non-members are `prospects`/`prospectRegs`. No
  existing gate changed meaning.
- The platform pack stays member-facing — its lists and the seeded Skip transcript quote
  membership counts, and the transcript gate caught it the moment that wasn't true.

## 3. The funnel (commit 3)

Non-members on their own were inert. What gives them purpose is a conversion rate.

**The move that made it free:** do not convert prospects into new members. Give *recent
joiners* the history they would have had — a free webinar or two before their start date, a
named application on the way in. The roster does not change by one row, so every membership
benchmark holds, and the funnel becomes queryable:

> of everyone who attended a free webinar, **24%** were members within the window
> (184 joined, 585 did not)

First tuning produced **72%**, which would have meant the webinar list *was* the member list.
The gate now bands the rate 3–35% so it cannot drift back.

Also fixed here, all found by reviewing the previous commit rather than by a gate:

| Defect | Before | After |
|---|---|---|
| Employer reached the database nowhere (Person has no org column; members use a Relationship edge) | 0 edges | 487 |
| Every non-member had a null job title — a blank column correlating perfectly with membership | 0 titles | 806 |
| Voluntary self-ID treated a webinar signup like a ten-year member | 481/550 with gender | 52/949 |

## Gates

204/204, full suite green (7 seeds, determinism, n=2500, scenario, emitters, DDL drift, frozen
migration, schema contract). Four existing gates were **rescoped, not weakened**:

- membership-window: exempts free **pre-join** webinars only; paid seats and anything after the
  join date stay strictly inside a period;
- application shape: anonymous intake **or** named-on-the-way-in, never both, never neither
  (stricter than the rule it replaced);
- application volume: measures the public intake trickle;
- employment edges: counts both populations.

Nine new gates cover the contact/address rows and the funnel, including the conversion rate.

The declining-org scenario caught the final bug: prospects were sized off the requested `n`, so
a world that archives members away made non-members a larger share of a smaller association.
Sized off the shipped roster now.

## Deliberately not modelled

- **Conversion of a prospect into a NEW member** — moves every retention, revenue and
  engagement benchmark; needs its own pass with funnel gates to match.
- **Paid non-member ticket pricing** — needs the money chain to price a non-member seat. Today
  non-members attend free webinars only, which is at least honest about the funnel.
- **Prospect scoring** — the natural home for a second Sonar model (conversion likelihood), and
  the first one whose population is genuinely not a rollup of the member score.

## Still open

The install seed (`MetadataSync_p01/p02`) predates all three commits. Re-capture is the
documented ~20-minute loop in INTEGRATION-RUNBOOK.md (addendum 2026-07-28); worth batching with
the next enrichment rather than running per commit.
