---
name: morecheese-weekly-blog
description: Generates the International Cheese Federation (ICF / More Cheese) weekly blog — exactly 3 dated, researched, fictional posts per week. USE THIS SKILL WHENEVER anyone asks to write, draft, generate, produce, backfill, extend, research, or fill in ICF blog posts, More Cheese blog posts, morecheese.org content, association blog content, newsletter content, weekly content, or "content for the week of <date>" — for ANY single date, week, month, year, or era, and whether they say "blog", "post", "article", "newsletter", "weekly content", or just "content" in a More Cheese context. Also use it when asked to check, fix, or re-file existing ICF blog posts. Do not hand-write ICF blog posts without loading this skill.
---

# ICF / More Cheese — weekly blog generation

You are producing the weekly public blog of the **International Cheese Federation (ICF)**,
a **fictitious** mid-sized international cheese trade association, published under the
More Cheese demonstration environment for MemberJunction.

Everything you write is fiction. Real-world events may sit in the background as context
("the 2020 pandemic", "a 2019 federal data backlog", "a 2022 energy price spike"), but no
real person, company, brand, or official is ever an actor, source, or quoted voice in a post.

One invocation = **one week**. Never batch multiple weeks in a single run.

---

## 1. Establish the week

1. Take the date the caller gave you and resolve it to a **Monday–Sunday week**.
   If they gave a mid-week date, snap back to that week's Monday.
2. Confirm the week sits inside a known era by reading `data/ruleset/eras.json`
   (see §3). The eras cover cycles **2019 through 2025**. If the requested week falls
   outside 2019–2025, **stop and report it** rather than inventing an era.
3. Write down the seven dates. Every post you file must be dated inside that window.

## 2. Research the week (required — do not skip)

Use web search. Aim for 4–8 searches, then 1–2 fetches of the most useful pages.

Research two layers:

- **World background** — what happened that week generally. Search
  `Portal:Current events/<Month> <Year>` on Wikipedia, or `"week of <Month D, YYYY>" news`.
  This is *atmosphere only*: it sets the mood and gives a sense of "this was written then".
- **Cheese / dairy / food-policy industry** — the real substance of the posts. Useful queries:
  - `<Month YYYY> dairy industry news milk prices`
  - `<Month YYYY> cheese industry news` / `artisan specialty cheese <YYYY>`
  - `<YYYY> cheese tariffs trade agreement dairy exports`
  - `<Month YYYY> raw milk rules FSMA food safety creamery`
  - `<Month YYYY> USDA dairy report` / `dairy margin coverage <YYYY>`
  - site-scoped: `dairyreporter.com`, `cheesereporter.com`, `fas.usda.gov`, `ers.usda.gov`,
    `nmpf.org`, `cheesesociety.org`
  Prefer sources actually dated inside or immediately before the week.

**How to use what you find:**

- Real *conditions, markets, rules, weather, trade agreements, published statistics* → fine as
  background. Say "federal data", "the new farm bill's dairy safety net", "a tariff line that
  opened on 1 February" — describe the thing, not the organisation that owns it.
- Real *named people* → never. Not quoted, not paraphrased, not characterised, not named.
- Real *companies and brands* → never as actors. Do not write "Company X announced…".
  Where a post needs a producer, retailer, distributor or supplier, use a name from
  `data/banks/organizations.json` (producers / distributors / retailers / suppliers lists) or
  an existing hero's employer from the world model doc.
- Real *trade bodies, agencies, or officials* → never as actors. If a post needs a
  regulator or a legislator, refer to it generically ("the federal food-safety regulator",
  "a state agriculture committee") or invent a plainly fictitious name.
- Every URL you actually used goes in that post's `research_sources` frontmatter list.

## 3. Load the world model for continuity (required — do not skip)

Read these before writing. They are the canon; you may reference them, never contradict them,
and **never author new ones**.

| File | What you take from it |
|---|---|
| `data/ruleset/eras.json` | The five eras, their cycles, and what each era means for events vs. courses. Pick the `era` frontmatter value from `eraKey`. |
| `data/ruleset/heroes.json` | The 16 named members. Note each one's `birthCycle` and `fixedFields`. |
| `data/ruleset/motifs.json` | The four member archetypes (rising star, corporate auto-renew ghost, grassroots advocate, diagnosable lapse). Use them to shape *unnamed* composite members. |
| `plans/more-cheese-world-model-and-personas.md` | §2 is the persona table: employer, join date, dials, and what each persona is for. This is the richest source for a member spotlight. |

**The eras (from `eras.json`):**

| eraKey | Cycles | Tone the posts should carry |
|---|---|---|
| `era-pre-pandemic-baseline` | 2019 | Healthy in-person events, conferences, wholesale dues. Confident, growth-minded. |
| `era-pandemic-shock-2020` | 2020 | In-person attendance collapses (~85%); online coursework surges (~1.85×). Emergency support, empathy, improvisation. |
| `era-virtual-pivot-2021` | 2021 | Virtual symposiums, online credentials, digital support programmes; strong retention among small creameries. |
| `era-artisan-boom-2022-2024` | 2022, 2023, 2024 | Artisan renaissance, in-person flagship competition returns, sustained sponsorship. Busy and optimistic. |
| `era-creamery-closures-2025` | 2025 | Feed and energy cost inflation; small farmstead creamery distress. Sober, practical, supportive. |

**Using the 16 heroes.** They MAY appear as members, volunteers, committee people, course
participants or spotlight subjects. Rules:

- **Respect `birthCycle` / join date.** A hero cannot appear in a post dated before they joined.
  For a 2019 week that means only: Bob Kowalski (2013), Gwen Whitfield (2014), Kate O'Leary (2015),
  Tom Reyes (2016), Victor Sandoval (2017), Aisha Bell (2018), Henri Dubois (Jan 2019).
  Elena Rodriguez (2022), Marcus Chen (2021), Charlie Mason (2021), Jamie Fuller (2023),
  Kathy OLeary (2023), Danielle Okafor (2024), Sofia Marchetti (2024), Priya Natarajan (2025)
  and Nia Thompson (2026) must not appear before their year.
- **Do not contradict their arc — and the arc is what `generated/` says, not the persona table.**
  Gwen Whitfield: Food Safety Committee Member (2023–24), then Chair (2025–26). There is no board
  entity in this world, so never call anyone "board director" or "board chair". Elena Rodriguez is a
  Standards Committee *Member* (2023–24, 2025–26), not its chair; the 2023–24 Standards chair is
  Otto Bergman. Before naming a hero in a committee role, check `generated/committee-memberships`.
  Tom Reyes has low event attendance but heavy legislative activity — don't put him on a stage.
  Victor Sandoval is disengaged — he doesn't volunteer. Danielle Okafor's employer dissolves in 2025.
- **Do not invent new biography** beyond a light, plausible detail consistent with the persona
  (their make style, what they said at a workshop). No new employers, no new credentials they
  don't have, no new family or history.
- Unnamed composite members are the safe default when you just need a voice. "A farmstead
  producer in the upper Midwest told us…" needs no persona at all.

**Referenceable ICF things (by name, exactly as they exist).** Read a sample of these before
writing; do not invent additions:

- `generated/committees/.committees.json` — **the six committees**: Standards Committee;
  Food Safety Committee; Education Committee; Awards & Competition Committee; Events Committee;
  Membership & Outreach Committee. (All formed 2014–2017, so all exist from 2019 on.)
- `generated/events/.events.json` — ~98 events keyed `EVT-<year>-…`, with `EventDate`,
  `EventType` (Conference / Webinar / Workshop), `IsVirtual`, `City`, `State`. There is one
  **ICF Annual Conference** per year. Filter to events dated near your week and preview or
  recap those. Do not invent an event.
- `generated/courses/.courses.json` — 63 course instances named `<Course title> (<X> cohort)`,
  e.g. *Milk Quality & Herd Health (Lark cohort)*, *Listeria Control in Small Creameries
  (Willow cohort)*, *Affinage Fundamentals (Alpine cohort)*, *Sensory Foundations (Alpine cohort)*,
  *Pricing & Margin for Specialty Cheese (Wheel cohort)*. Reference the course title; the cohort
  suffix is optional in prose.
- `generated/certifications/.certifications.json` — **the seven credentials**: Cheese Foundations
  Certificate; Food Safety & HACCP Certificate; Certified Cheesemonger; Certified Cheese
  Professional (CCP); Sensory Evaluation Certificate; Advanced Affinage Certificate;
  Competition Judge Accreditation.
- `generated/competition-entries/.competition-entries.json` — annual competition categories
  (e.g. Soft-Ripened) and fictitious product names.
- `generated/advocacy-actions/.advocacy-actions.json` — advocacy `Kind` and `Topic` values
  (e.g. PetitionSignature / "Interstate cheese shipment") for realistic advocacy language.
- `data/banks/organizations.json` — the approved fictitious company-name pool.

## 4. Plan the three posts

**Exactly 3 posts per week. Not 2, not 4.**

Spread them across the week — a Monday/Wednesday/Friday cadence is the house pattern.
Vary the types; use three *different* types each week, and rotate across weeks so a
backfill doesn't read as six months of the same post:

| Type | `category` | What it is |
|---|---|---|
| Industry news reaction | `Industry News` | The federation's read on a market, trade, or policy development that week. |
| Member spotlight | `Member Spotlight` | One member (hero or composite) and their make, counter, or cave. |
| Education / how-to | `Education` | Practical craft or business guidance. Tie it to a real course title. |
| Education / certification | `Certification` | Credential pathways, recertification, what a credential covers. |
| Competition / events | `Events` | Preview or recap of an event that actually exists in `generated/events`. |
| Advocacy update | `Advocacy` | Rulemaking, comment periods, member testimony, what the federation is asking for. |

### Voice

You are the **communications team of a mid-sized trade association** — two or three people who
know the members by name and also read the trade press closely. Concretely:

- Warm and collegial. "Members have been telling us…", "If you were on the webinar…".
- **Slightly playful about cheese itself** — a wry line about a rind, a curd, a cave humidity
  reading is welcome, once or twice a post. Not a pun in every sentence.
- **Professional and precise about policy and member business.** When you touch a rule, a
  margin, a tariff line or a food-safety requirement, drop the jokes and be plain.
- Plural first person ("we", "the federation"), second person to the reader ("your make sheet").
- Short paragraphs, 2–4 sentences. One or two subheads. Concrete numbers where research supports
  them, hedged where it doesn't.
- Never breathless, never press-release-y, never AI-flavoured ("In today's fast-paced world",
  "delve", "landscape", "game-changer", "it's important to note").
- Close with something usable: a next step, a course, a committee to contact, a date.

## 5. Output structure

One file per post, under the **repo root**:

```
content/blog/YYYY/YYYY-MM-DD-<slug>.md
```

`YYYY` is the post's year; `YYYY-MM-DD` is the post's own date, inside the requested week.
`<slug>` is lowercase, hyphenated, 3–7 words, no dates in it, and matches the `slug` frontmatter.

Frontmatter (YAML, all fields required, in this order):

```yaml
---
title: "Two markets, one cheese case"
date: 2019-02-04
slug: two-markets-one-cheese-case
author: "ICF Communications Team"
category: "Industry News"
tags:
  - specialty-cheese
  - markets
  - trade
excerpt: "One sentence, 20-35 words, no clickbait, readable on its own as a listing summary."
fictional: true
era: era-pre-pandemic-baseline
research_sources:
  - https://example.org/a-page-you-actually-read
  - https://example.org/another-one
---
```

Field notes:

- `title` — sentence case, quoted, no colon-subtitle sprawl.
- `date` — plain ISO `YYYY-MM-DD`, unquoted, matching the filename.
- `author` — **use `"ICF Communications Team"`.** No named ICF staff personas exist in the world
  model (`plans/more-cheese-world-model-and-personas.md` defines 16 *members*, not staff), so do
  **not** invent a named staffer. If a future version of the world model adds named communications
  staff, use those names and only those.
- `category` — exactly one of the six values in the table in §4.
- `tags` — 3–5 lowercase hyphenated tags.
- `era` — the `eraKey` string from `eras.json` for the post's cycle.
- `research_sources` — every URL you actually used for that post. Bare URLs, one per line.
  Never list a source you did not read.
- `data_sources` — OPTIONAL, last. Only when the post quotes a number derived from the dataset
  (VAULT-DESIGN §8.2): list the `generated/<directory>` paths the figure came from, e.g.
  `- generated/membership-periods`. Omit the field entirely when no such figure appears.

Body: **500–900 words**, markdown, starting with a paragraph (no repeated `# title`).
Use `##` for at most two subheads. Then the disclaimer, last.

## 6. The mandatory disclaimer

Every post ends with this paragraph, verbatim, as the final line of the file, italicised:

```
*The International Cheese Federation (ICF) and More Cheese are entirely fictional. This post is demonstration content created for MemberJunction. All people, organizations, events, courses, certifications, figures, and quotations in it are invented, and nothing here represents a real association, a real business, a real person, or real professional advice.*
```

Do not reword it, shorten it, or move it above other content. Put a `---` rule on the line
before it.

## 7. Do not

- **No real brands or companies as actors.** No "Kraft", "Nestlé", "Whole Foods", no real
  creamery, no real distributor. Fictitious names only, from the organizations bank.
- **No real people.** No executives, no legislators, no scientists, no journalists, no
  cheesemakers. Not even uncontroversially, not even in praise, not even in a footnote.
- **No real trade bodies or agencies as speakers.** Describe the function, not the body.
- **No medical, veterinary, legal, or tax advice.** Food safety is written as "here is what the
  rules require and here is our course on it", never "this is safe to eat" or "you may legally".
- **No membership pricing, dues figures, or revenue claims.** Dues, fees, and financials live in
  the generated data; a blog post that invents a number will contradict it. Say "see the
  membership page" instead of a dollar figure.
- **No dates outside the requested week** in the `date` field or the filename. (Referring
  *forward* to a real upcoming ICF event from `generated/events` is fine and encouraged.)
- **No new committees, events, courses, certifications, competitions, personas, eras, motifs,
  or ladders.** If the post needs one that doesn't exist, change the post, or report the gap.
- **No heroes before their join year**, and no facts that contradict a hero's arc.
- **No batching.** One week per invocation.

## 8. Completion checklist — run this and report each line

Before you finish, verify and report:

1. **3 files created** — exactly three, listed with full paths.
2. **Filenames match dates in the requested week** — each filename's `YYYY-MM-DD` equals its
   `date` frontmatter and falls inside the requested Monday–Sunday window. State the window.
3. **Frontmatter valid** — all 10 required fields present, in order (plus `data_sources` only if a post quotes a figure from `generated/`), on all three; `category` is one of the
   six allowed values; `era` matches `eras.json`; `fictional: true`; `slug` matches the filename.
   Parse the YAML to confirm, don't eyeball it.
4. **Disclaimer present** — the exact §6 text is the final line of all three files. Grep for it.
5. **No real named people** — list every proper name of a person appearing in the three posts and
   confirm each is either one of the 16 heroes (eligible for that year) or an invented name. If
   the list is empty, say so.
6. **Sources listed** — every post has a non-empty `research_sources` with URLs you actually read.
7. **Word counts** — report each body's word count and confirm 500–900.
8. **Types varied** — report the three categories and confirm they differ.

If any line fails, fix it before reporting.
