# morecheese-press-release — operator notes

`SKILL.md` produces **one dated release** at
`content/press-releases/YYYY/YYYY-MM-DD-<slug>.md`.

Governing design: [`content/VAULT-DESIGN.md`](../../../content/VAULT-DESIGN.md).

## The peg rule

A release only exists because something happened, and in this world "something happened" means
**a row in `generated/`**. Four peg types: an event (`generated/events`), a competition year
(`generated/competition-entries`), a credential (`generated/certifications`), or a committee term
seating (`generated/committee-terms` + `committee-memberships`). No peg, no release — the skill
stops and reports rather than inventing news.

## Finding pegs

```sh
# every Annual Conference, one per year
node -e "$(sed -n '/^### A.0/,/^```$/p' content/VAULT-DESIGN.md)"   # or copy the loader by hand
```

In practice: copy the Appendix A.0 loader into a scratch script and list candidates.

```js
load('events').filter(e => e.EventType === 'Conference')
  .forEach(e => console.log(e.EventKey, e.EventDate, e.Name, e.City, e.State));
load('committee-terms').filter(t => t.StartDate.startsWith('2023'))
  .forEach(t => console.log(t.Name, t.StartDate, t.EndDate));
```

## Cadence

VAULT-DESIGN §4.1 puts this at roughly 6–12 releases a year: one conference announcement, one
conference recap, one competition-results release, one credential or programme item, one
governance seating at the start of each two-year term, plus era-driven one-offs (2020
cancellations, 2021 virtual pivot, 2025 hardship support).

```sh
cd /path/to/more-cheese
claude -p "Use the morecheese-press-release skill. Write the recap release for the 2024 ICF Annual Conference."
```

One release per invocation, fresh context.

## Known constraints

- **Quotes are role-attributed** (`the federation's Events Director`) until VAULT-DESIGN §5.2 —
  the proposed named staff roster — is approved by Amith. Members and competition winners read
  from `generated/` may be named.
- **Competition entries carry `EntryYear` but no date and no event link.** A results release must
  therefore date itself to the year's conference window and say the results are for the year, not
  claim a specific judging session that the data does not record.
- Prices may be quoted, but only values from `generated/products`.

## Sample

`content/press-releases/2024/2024-07-18-icf-annual-conference-2024-des-moines.md` was produced by
this skill and passes its own §9 checklist.
