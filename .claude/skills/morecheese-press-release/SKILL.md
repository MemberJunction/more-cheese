---
name: morecheese-press-release
description: Generates a dated International Cheese Federation (ICF / More Cheese) press release for a real event, competition, credential launch or governance change that exists in generated/, filed at content/press-releases/YYYY/YYYY-MM-DD-<slug>.md. USE THIS SKILL WHENEVER anyone asks to write, draft, produce, generate, backfill, issue, put out, or check an ICF press release, More Cheese press release, media release, news release, press announcement, statement to the press, media advisory, PR, announcement post, "announce the conference", "announce the competition results", "announce the new board", "write a release for the 2024 conference", morecheese.org newsroom or press-room content — for any single dated announcement in 2019 through 2025, and whether they say "press release", "media release", "announcement", "newsroom item", or just "announce X" in a More Cheese context. Also use it when asked to verify an existing ICF press release's dateline, structure, numbers, or disclaimer. Do not hand-write an ICF press release without loading this skill.
---

# ICF / More Cheese — press release generation

You are the media-relations desk of the **International Cheese Federation (ICF)**, a
**fictitious** mid-sized international cheese trade association, in the More Cheese demonstration
environment for MemberJunction.

**One invocation = one release.** Never batch.

Read [`content/VAULT-DESIGN.md`](../../../content/VAULT-DESIGN.md) first. It governs; this skill
implements it. §4.3 (cast), §7 (do-not list), §8 (consistency), Appendix A (queries).

---

## 1. Find a real peg — a release must announce something in `generated/`

**Every release announces a fact that exists in the data.** No invented news. Four legitimate pegs:

| Peg | Source | Typical release |
|---|---|---|
| **An event** | `generated/events` — `EventKey`, `Name`, `EventDate`, `EventType`, `IsVirtual`, `City`, `State` | Conference announcement (dated ~90 days before), or a post-event recap (dated 1–3 days after) with registered/attended counts from `generated/event-registrations` |
| **A competition year** | `generated/competition-entries` — `EntryYear`, `Category`, `ProductName`, `Result`, plus `PersonID`/`OrganizationID` | Results announcement naming the Gold, Silver and Bronze cheeses and the organisations that made them |
| **A credential** | `generated/certifications` (the seven) + `generated/member-certifications` | A credential pathway announcement, or a milestone in credential activity |
| **Governance** | `generated/committee-terms` + `generated/committee-memberships` | New committee term seating, chairs and vice chairs announced at term start (terms run 2-year, `YYYY-01-01` to `YYYY+1-12-31`) |

If the caller names a date or a subject with no peg in the data, **stop and report it.** Do not
invent an event, a winner, a credential, or an officer.

**Dating rules.** The release date must be plausible relative to its peg:
- Event announcement: 60–120 days before `EventDate`.
- Event recap: `EventDate` + 1 to +3 days. Recaps may quote attendance; announcements may not.
- Competition results: the same window as the year's Annual Conference, or shortly after.
- Term seating: within the first three weeks of the term's `StartDate`.

The release year must be **2019–2025**. Outside that, stop and report.

## 2. Compute the numbers before you write

Run Appendix A of `content/VAULT-DESIGN.md`: A.0 (loader), then A.4 for the event,
A.7 for competition medals, A.6 for credentials, A.9 for governance, A.1/A.2 if you cite a
membership figure. Write the fact-sheet first, draft second.

A 300–500-word release should carry **three to six** hard numbers. Every one must come from a
snippet. Round honestly ("more than 330" for 337 is fine; "about 350" is not).

## 3. Continuity

| File | What you take from it |
|---|---|
| `data/ruleset/eras.json` | The `eraKey` for the release's cycle — sets tone (VAULT-DESIGN §4.2). |
| `content/VAULT-DESIGN.md` §4.3 | Hero eligibility and arc constraints. |
| `content/blog/<year>/` | Any post covering the same event — the release must agree with it. |
| `generated/organizations`, `data/banks/organizations.json` | The only legitimate organisation names. |

Tone follows the era. A 2020 release announcing a cancellation or a virtual replacement is
apologetic and practical; a 2023 release is confident; a 2025 release is measured.

## 4. Structure — AP-style, 300–500 words

In this order:

1. **`FOR IMMEDIATE RELEASE`** — on its own line, first line of the body.
2. **Headline** — an `##` heading. Sentence case, present tense, under 12 words, states the news.
   No colon-subtitle sprawl.
3. **Subhead** *(optional)* — one italic line adding the second most important fact.
4. **Dateline + lede** — `**DES MOINES, IOWA — July 18, 2024 —**` then the lede sentence in the
   same paragraph. The lede is one sentence, under 40 words, and contains the who/what/when/where
   and the single biggest number. Dateline city comes from the event's `City`/`State`; for a
   release with no physical location use the federation's convention `**MADISON, WISCONSIN —**`
   (the 2019 conference city, used as the federation's nominal home) or a virtual dateline of
   `**ONLINE —**`.
5. **Body — 3 to 5 short paragraphs**, inverted pyramid: most newsworthy first, background last.
   Paragraph 2 supports the lede with detail and numbers. Paragraph 3 widens to context (the
   programme, the year, the category). Paragraph 4 gives the practical next step.
6. **One or two quotes**, attributed **by role only** — e.g.
   `"…," said the federation's Events Director.` or `said a spokesperson for ICF Media Relations.`
   Never a named person (see §6). A quote should say something a metric cannot: a judgement, a
   thank-you, an intention. Two sentences maximum each.
7. **`### About the International Cheese Federation`** — the standing boilerplate, 2–3 sentences.
   Keep it identical across releases so it reads like real boilerplate.
8. **`### Media contact`** — role and mailbox only:
   `ICF Media Relations · press@morecheese.example`. Never a phone number, never a name.
9. **`###`** on its own line — the traditional end-of-release mark.
10. The `---` rule and the verbatim disclaimer (§7).

## 5. Output

```
content/press-releases/YYYY/YYYY-MM-DD-<slug>.md
```

`YYYY-MM-DD` is the release date and must equal the `date` and `release_date` frontmatter.
`<slug>` is lowercase, hyphenated, 3–7 words, **no date inside the slug**.

Frontmatter (YAML, all fields required, in this order):

```yaml
---
title: "ICF Annual Conference draws 337 members to Des Moines"
date: 2024-07-18
slug: icf-annual-conference-2024-des-moines
doc_type: press-release
visibility: public
org: "International Cheese Federation"
release_date: 2024-07-18
dateline: "DES MOINES, IOWA"
contact_role: "ICF Media Relations"
event_key: EVT-2024-CONF        # or competition_year: 2024 — at least one peg field required
era: era-artisan-boom-2022-2024
fiscal_year: 2024
fictional: true
tags:
  - press-release
  - annual-conference
  - competition
data_sources:
  - generated/events
  - generated/event-registrations
  - generated/competition-entries
  - generated/organizations
---
```

Peg field rules: use `event_key` for an event release, `competition_year` for a results release,
`certification_key` for a credential release, `committee_term` for a governance release. Include
every peg field that applies; at least one is mandatory and its value must exist in `generated/`.

Body: 300–500 words. Do not repeat the title as an `#` heading — the `##` headline is the title.

## 6. Spokespeople

No named ICF staff exist in the world model. **All quotes are attributed by role**, using the
bylines in VAULT-DESIGN §5.1: `Office of the Chief Executive`, `Membership Operations`,
`Events Team` / `the federation's Events Director`, `Education & Credentialing`,
`Advocacy & Standards`, `ICF Media Relations`.

Members **may** be quoted by name when they are heroes eligible for that year, or generated people
who actually appear in the peg data (a competition winner, a seated committee chair). Check
VAULT-DESIGN §4.3 first. When in doubt, quote a role or an unnamed composite.

Do not invent a named CEO, president, director, or press officer. If VAULT-DESIGN §5.2 has been
marked approved by Amith, use that roster and only that roster.

## 7. The mandatory disclaimer

Final line of the file, italicised, preceded by a `---` rule, **verbatim**:

```
*The International Cheese Federation (ICF) and More Cheese are entirely fictional. This post is demonstration content created for MemberJunction. All people, organizations, events, courses, certifications, figures, and quotations in it are invented, and nothing here represents a real association, a real business, a real person, or real professional advice.*
```

Do not reword, shorten, or relocate it.

## 8. Do not

Everything in VAULT-DESIGN §7 applies. The ones that bite hardest here:

- **No invented news.** Every release has a peg row in `generated/`.
- **No real people, brands, agencies, trade bodies, or media outlets as actors, sources, quoted
  voices, sponsors, or partners.** Real cities as datelines are fine — they are in the events data.
- **No named ICF staff** until VAULT-DESIGN §5.2 is approved. Role attributions only.
- **No invented winners.** Product names and organisations come from the entry rows.
- **No attendance claim on a pre-event announcement** — the registrations are not in yet, narratively.
- **No pricing that contradicts `generated/products`** (Conference Registration $450, Workshop
  Registration $150, exam fee $425, competition entry $65, …). Quoting a price is allowed here,
  unlike blog posts, but only a real one.
- **No medical, veterinary, legal, or tax claims.** Food safety is described as what the rules
  require and what the federation teaches.
- **No hero out of period**, no contradiction of an arc.
- **No batching** — one release per invocation.
- **No writes outside `content/`.**

## 9. Completion checklist — run this and report each line

1. **Files created** — exactly one, full path, at `content/press-releases/YYYY/YYYY-MM-DD-<slug>.md`.
2. **Filename matches the date** — the filename's `YYYY-MM-DD` equals both `date` and
   `release_date`; the folder year equals that year; the slug equals the `slug` field. State them.
3. **Peg verified** — name the peg row and show the value you read from `generated/`
   (e.g. `EVT-2024-CONF · ICF Annual Conference 2024 · 2024-07-16 · Des Moines, IA`). Confirm the
   release date sits in the allowed window from §1.
4. **Frontmatter valid** — parse the YAML. All fields present, in order; `doc_type: press-release`;
   `visibility: public`; `fictional: true`; `era` matches `eras.json`; at least one peg field.
5. **Disclaimer present** — grep for the exact §7 string; confirm it is the final line.
6. **No real named people** — list every proper name of a person in the release and classify each
   as (a) an eligible hero, (b) a name read from `generated/people`, or (c) a role attribution.
   Confirm every quote is attributed by role or to a verified data person.
7. **Numbers traceable** — table every figure with the Appendix A snippet that produced it.
8. **AP structure present** — confirm, in order: `FOR IMMEDIATE RELEASE`, `##` headline, dateline
   + one-sentence lede, 3–5 body paragraphs, at least one role-attributed quote, About boilerplate,
   Media contact, `###` end mark.
9. **Word count** — report the body word count; confirm 300–500.
10. **No world-model inventions** — every event, competition category, product, organisation,
    certification and committee named exists in `generated/` or `data/banks/organizations.json`.

If any line fails, fix it before reporting.
