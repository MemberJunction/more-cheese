# More Cheese — Digital Vault Design

**International Cheese Federation (ICF) content corpus: public site + internal Dropbox**

Status: **DRAFT for review** · Author: content tooling · Repo: `MemberJunction/more-cheese` (`next`)
Implements Workstream E (E3 Content generation, E7 Knowledge Hub) of
[`plans/more-cheese-vision-and-plan.md`](../plans/more-cheese-vision-and-plan.md).

> **This document describes a corpus of fiction.** The International Cheese Federation is an
> invented trade association built as a demonstration environment for MemberJunction. Nothing in
> the vault describes a real organization, a real person, or a real business.

---

## 1. What the vault is

The vault is the *narrative surface* of More Cheese. The structured data in `generated/` says
that 924 members held a period in 2023 and that 337 people walked into a conference hall in Des
Moines. The vault is what that association **wrote down** while it was happening: the blog post,
the annual report, the press release, the memo, the spreadsheet, the deck, and the email thread
where somebody asked why the numbers looked off.

Two consumers, and they are why the vault has two halves:

| Half | Lives at | Consumed by | Written as |
|---|---|---|---|
| **Public** | `content/**` → published to `morecheese.org` | Web visitors; Knowledge Hub public-site crawler | Markdown with YAML frontmatter |
| **Internal** | `vault/internal/**` → synced to a read-only Dropbox account | Knowledge Hub Dropbox connector; staff personas in MJ Explorer | Markdown, CSV, and `.md` deck outlines |

### 1.1 Why they are separated

1. **Different ingestion paths.** Knowledge Hub reads the public site by crawl and the internal
   corpus by Dropbox connector. They produce differently-scoped collections, and a demo that
   shows "what our members can see" versus "what staff can see" needs that boundary to be a
   *directory boundary*, not a metadata flag someone might get wrong.
2. **Different permission stories.** The headline Knowledge Hub demo is asking a question that can
   only be answered from internal documents, and watching the answer cite a board memo that never
   appeared on the website. That demo is worthless if the memo is also on the website.
3. **Different voices.** Public content is edited, hedged, and legally careful. Internal content is
   blunt, has typos-of-thought ("I think this is a data problem, not a churn problem"), quotes
   numbers before they are final, and occasionally disagrees with itself. The split keeps writers
   (human or model) from blurring the two registers.
4. **Different failure modes.** A wrong number in a press release is an embarrassment; a wrong
   number in an internal spreadsheet is *realistic*. The internal half is allowed to contain
   superseded figures **as long as a later document supersedes them explicitly**. The public half
   is never allowed to contradict `generated/`.
5. **Different retention.** The public half is versioned in git forever. The internal half is
   generated into `vault/` and pushed to Dropbox; git tracks it, but Dropbox is the demo's runtime
   source and can be re-seeded.

### 1.2 One organization, two records

The single most important property of the vault: **for any given week, the public and internal
artifacts must read as the same organization.** If the blog on 2019-02-08 says federal data
landed in a heap, the internal memo from 2019-02-04 should show someone planning for it, and the
Thursday email thread should show the comms lead asking membership ops for a number that ends up
in the post. That coherence is what makes a Knowledge Hub demo feel real, and it is the reason
`morecheese-internal-comms` is required to read the same week's `content/blog/` files before it
writes anything.

---

## 2. Folder layout

### 2.1 Public — `content/`

```
content/
  VAULT-DESIGN.md                      # this file (not published)
  blog/
    2019/
      2019-02-04-two-markets-one-cheese-case.md
      ...                              # existing; unchanged, 3/week
  annual-reports/
    2019/  icf-annual-report-fy2019.md
    2023/  icf-annual-report-fy2023.md
    ...                                # one per fiscal year 2019-2025
  press-releases/
    2019/  2019-07-18-icf-annual-conference-2019-madison.md
    2024/  2024-07-18-icf-annual-conference-2024-des-moines.md
    ...
  competition-results/
    2023/  icf-competition-results-2023.md
    2024/  icf-competition-results-2024.md
  committee-minutes/
    2023/  2023-03-14-standards-committee-q1-minutes.md
    ...                                # public committees only (all 6 are IsPublic:true)
  newsletters/
    2023/  2023-03-icf-member-brief.md # monthly digest, links out to that month's blog posts
```

**Why these five public types and no more.** Each one is anchored to a table in `generated/`, so
each one can be fact-checked mechanically:

| Public type | Anchored to | Cadence |
|---|---|---|
| `blog/` | event calendar, courses, advocacy-actions, heroes | 3 / week (existing skill) |
| `annual-reports/` | orders (memberships, event registrations), payments, enrollments, `content/event-calendar.json` | 1 / fiscal year |
| `press-releases/` | event calendar + orders, competition-entries, certifications, committee-terms | ~6-12 / year |
| `competition-results/` | competition-entries (`EntryYear`, `Category`, `Result`) | 1 / year |
| `committee-minutes/` | committee-meetings, committee-agenda-items, committee-motions, committee-votes | 24 / year (6 committees × 4 quarters, 2015→) |
| `newsletters/` | *derived* — links only to already-published blog/press items | 12 / year |

Anything without a table behind it (staff bios, "about us", job postings) is site furniture, not
vault content, and is out of scope for the generation skills.

### 2.2 Internal — `vault/internal/`

```
vault/
  internal/
    README.md                          # the Dropbox root readme; fiction header + map
    memos/
      2019/  2019-02-04-membership-ops-january-close-readout.md
    spreadsheets/
      2019/  2019-02-04-january-2019-membership-close.csv
    decks/
      2019/  2019-02-05-q1-events-committee-prep-deck.md
    email/
      2019/
        2019-02-04-thread-january-close-numbers-for-friday-post/
          01-2019-02-04-0912-comms-to-membership-ops.md
          02-2019-02-05-0741-membership-ops-to-comms.md
          03-2019-02-05-1620-comms-to-membership-ops.md
          THREAD.md                    # optional index; generated when a thread exceeds 5 messages
    board-packets/
      2023/  2023-11-icf-board-packet.md
    policies/
      2021/  2021-03-remote-event-policy.md
```

**Six internal types.** `memos`, `spreadsheets`, `decks`, `email` are the four the brief calls for.
Two more earn their place because Knowledge Hub demos ask for them constantly:
- `board-packets/` — the document a CEO persona searches for ("what did we tell the board about
  2023 retention?"). Composite: narrative + embedded tables, one per board cycle.
- `policies/` — the document that answers "what is our policy on X?", the single highest-value
  retrieval question in any association knowledge-base demo.

### 2.3 Naming conventions

| Rule | Applies to | Form |
|---|---|---|
| Date-stamped filename | blog, press-releases, committee-minutes, memos, spreadsheets, decks, email | `YYYY-MM-DD-<slug>.<ext>` |
| Period-stamped filename | annual-reports, competition-results | `icf-<type>-<fy|year>.md` |
| Month-stamped filename | newsletters, board-packets | `YYYY-MM-<slug>.md` |
| Year folder | everything dated | parent directory is the 4-digit year of the artifact's own date |
| Slug | everything | lowercase, hyphen-separated, 3-8 words, **no dates inside the slug**, ASCII only |
| Email message file | `email/` | `NN-YYYY-MM-DD-HHMM-<from-role>-to-<to-role>.md`, `NN` zero-padded ordinal within the thread |
| Email thread folder | `email/` | `YYYY-MM-DD-thread-<slug>/`, dated to the **first** message |
| No spaces, no `&`, no uppercase | all filenames | Dropbox + crawler safety |

The date in a filename is always the artifact's own date and must equal its `date` frontmatter
field. This is checked by every skill's completion checklist and is the single most common thing
a generation run gets wrong.

### 2.4 Source format and later rendering

| Vault format | Why | Render to |
|---|---|---|
| Markdown + YAML frontmatter | Diffable, greppable, ingestible as-is by Knowledge Hub | HTML (site), `.docx` via `pandoc -o out.docx in.md` |
| CSV with `#`-comment header block | One file, no binary, human-diffable, still a real table | `.xlsx` via `python -c "import pandas as pd; pd.read_csv(f, comment='#').to_excel(...)"` — the `#` block becomes a `_meta` sheet |
| Markdown deck outline (`---` between slides, `#` = slide title, `-` = bullets, `> notes:` = speaker notes) | Reviewable in a PR; the outline *is* the content, the theme is not | `.pptx` via `pandoc -t pptx --reference-doc=icf-template.pptx` or Marp |

**Do not generate binaries in this repo.** The `.xlsx`/`.pptx`/`.docx` conversion is a separate,
scripted step run at Dropbox-seed time, not part of any content skill. Knowledge Hub can ingest
either; keeping the repo text-only keeps the corpus reviewable.

---

## 3. Metadata standard (Knowledge Hub)

Every Markdown artifact carries YAML frontmatter. Fields marked **KH** are what the ingestion
classifier reads; do not omit them.

### 3.1 Fields common to all artifacts

```yaml
title: "…"                 # KH · sentence case, quoted
date: 2024-07-18           # KH · ISO, unquoted, == the date in the filename
doc_type: press-release    # KH · controlled vocabulary, see §3.2
visibility: public         # KH · public | internal   ← the ingestion routing key
org: "International Cheese Federation"
era: era-artisan-boom-2022-2024   # KH · eraKey from data/ruleset/eras.json
fiscal_year: 2024          # KH · integer; the FY the artifact reports on or belongs to
fictional: true            # KH · always true; never omit
tags: [ … ]                # KH · 3-6 lowercase hyphenated
data_sources:              # KH · which generated/ directories the numbers came from
  - generated/orders       # memberships and event registrations both live on orders
```

### 3.2 `doc_type` controlled vocabulary

`blog-post` · `annual-report` · `press-release` · `competition-results` · `committee-minutes` ·
`newsletter` · `memo` · `spreadsheet` · `deck` · `email` · `board-packet` · `policy`

Nothing outside this list. Adding a value means adding a section to this document first.

### 3.3 Type-specific fields

| doc_type | Additional required fields |
|---|---|
| `blog-post` | `slug`, `author`, `category`, `excerpt`, `research_sources` (as the existing blog skill defines — **unchanged**) |
| `annual-report` | `period_start`, `period_end`, `report_sections` (list) |
| `press-release` | `release_date`, `dateline` (e.g. `"DES MOINES, IOWA"`), `contact_role`, `event_key` or `competition_year` |
| `competition-results` | `competition_year`, `categories` (list) |
| `committee-minutes` | `committee`, `meeting_key`, `term`, `quorum` |
| `newsletter` | `month`, `links` (list of relative paths to already-published items) |
| `memo` | `from_role`, `to_roles` (list), `subject`, `week_of` |
| `spreadsheet` | *(in the `#` comment block, see §3.4)* |
| `deck` | `deck_for` (meeting or event), `slide_count`, `presenter_role` |
| `email` | `from`, `to`, `cc`, `subject`, `thread_id`, `message_id`, `in_reply_to`, `sent` (ISO datetime) |
| `board-packet` | `board_cycle`, `sections` |
| `policy` | `policy_id`, `effective_date`, `supersedes` |

### 3.4 CSV metadata block

CSV files open with a `#`-prefixed block that is valid YAML once the `# ` prefix is stripped,
then a blank `#` line, then the real header row:

```
# title: January 2019 membership close
# date: 2019-02-04
# doc_type: spreadsheet
# visibility: internal
# fictional: true
# fiscal_year: 2019
# data_sources: [generated/orders, generated/payments]
# notice: FICTIONAL DEMONSTRATION DATA — International Cheese Federation, a fictitious
#   association created for the MemberJunction More Cheese demo.
#
tier,periods_started_ytd,dues_billed_usd,…
```

Every downstream reader (`pandas.read_csv(comment='#')`, `csv` with a filter, Knowledge Hub's
text extractor) handles this. A sidecar metadata file was rejected: two files per table doubles
the ways a sync can half-fail.

### 3.5 Email header convention

Emails are Markdown, not RFC-822, because Knowledge Hub extracts Markdown cleanly and a `.eml`
parser is one more thing to get wrong. The frontmatter *is* the header block, and the body opens
with a rendered header so the file reads like an email when a human opens it:

```yaml
---
doc_type: email
visibility: internal
from: "Membership Operations <membership.ops@morecheese.example>"
to: ["Communications <comms@morecheese.example>"]
cc: []
subject: "Re: January close — numbers for Friday's post"
sent: 2019-02-05T07:41:00Z
thread_id: 2019-02-04-january-close-numbers-for-friday-post
message_id: mc-2019-02-05-0741-membops-comms
in_reply_to: mc-2019-02-04-0912-comms-membops
…
---
```

All addresses use the reserved `.example` TLD, matching the convention already used for person
emails in `generated/people`. Never use `@morecheese.org` in a From/To — that domain will be
real once the site ships.

---

## 4. Content calendar model

### 4.1 The cadence

| Cadence | Public | Internal |
|---|---|---|
| **Weekly** | 3 blog posts (Mon/Wed/Fri house pattern) | 1 memo **or** 1 deck outline; 1 email thread (2-4 messages); 1 CSV when the week has a number worth tabling |
| **Monthly** | 1 newsletter (digest of that month's posts) | 1 spreadsheet (monthly membership/revenue close) |
| **Quarterly** | 6 committee minutes (one per committee, from `committee-meetings`) | 1 deck (quarterly business review); 1 board packet in Q4 |
| **Per event** | 1 press release for the Annual Conference; 1 for the competition results | 1 pre-event deck, 1 post-event email thread, 1 registration CSV |
| **Annually** | 1 annual report; 1 competition-results page | 1 board packet; 1 budget CSV |

Target steady-state volume per year: ~156 blog posts, ~12 newsletters, ~24 minutes, ~8 releases,
2 annual pieces on the public side; ~52 memos/decks, ~52 threads, ~20 spreadsheets internally.
Seven fiscal years (2019-2025) is roughly 1,300 public and 900 internal artifacts. **Do not run
that volume without an explicit budget decision — see §9.**

### 4.2 Era beats

The six eras in `data/ruleset/eras.json` set what each year's corpus is *about*. The volume
multipliers are not decoration — they are the plot.

| Era | Cycles | What the public corpus does | What the internal corpus does |
|---|---|---|---|
| `era-pre-pandemic-baseline` | 2019 | Confident growth. Conference previews, wholesale-dues framing, straightforward advocacy. Annual report is a "steady year" report. | Routine ops. Monthly closes, event logistics, a mild argument about workshop pricing. |
| `era-pandemic-shock-2020` | 2020 | Event cancellations, emergency member support, online course pivot. Press releases announce postponement, then virtual replacement. Annual report leads with the `EventRegistration ×0.15` collapse and the `CourseEnrollment ×1.85` surge. | The most interesting internal year. Cancellation decision memos, refund-policy threads, a scramble deck, a revenue-hole spreadsheet. This is where the Knowledge Hub demo should point. |
| `era-virtual-pivot-2021` | 2021 | Virtual symposium recaps, online credential launches, retention wins among small creameries (`EventRegistration ×0.45`, `CourseEnrollment ×1.5`). | Platform-selection memo, virtual-event policy, "are we going back in person" thread. |
| `era-artisan-boom-2022-2024` | 2022-24 | Busy and optimistic. In-person conference returns, competition entries climb, sponsorship holds. Three annual reports of real growth. | Capacity strain: staffing memo, venue-contract thread, a QBR deck with a hiring ask. |
| `era-creamery-closures-2025` | 2025 | Sober and practical. Cost-inflation coverage, hardship-dues framing, closure support. | Hardship-program design memo, a lapse-risk spreadsheet, a board packet that is mostly bad news handled well. |
| `era-stabilization-2026` | 2026 | Costs ease; closures turn into succession and consolidation stories; next-generation makers, raw-milk aging rule modernization, traceability. | Recovery planning: a succession-support memo, a "did the 2025 lapses come back?" spreadsheet, a cautious budget thread. |

**Rule:** an artifact's tone must match its `era`. A 2020 press release that reads like 2019 is a
defect. The skills check `era` against `eras.json` and must refuse a cycle outside 2019-2026, and internal artifacts must not
be dated past the end of the commerce data (`node scripts/vault-facts.mjs series` prints it; §8.1).

### 4.3 Who may appear where

**Heroes.** The 16 personas in `data/ruleset/heroes.json`. A hero may never appear in an artifact
dated before their join date. Eligibility by first year:

| From | Heroes eligible |
|---|---|
| 2013 | Bob Kowalski |
| 2014 | + Gwen Whitfield |
| 2015 | + Kate O'Leary |
| 2016 | + Tom Reyes |
| 2017 | + Victor Sandoval |
| 2018 | + Aisha Bell |
| 2019 | + Henri Dubois (2019-01-15) |
| 2021 | + Marcus Chen, Charlie Mason |
| 2022 | + Elena Rodriguez |
| 2023 | + Jamie Fuller, Kathy OLeary |
| 2024 | + Danielle Okafor, Sofia Marchetti |
| 2025 | + Priya Natarajan |
| 2026 | + Nia Thompson |

Arc constraints, per persona, that content must not contradict:

| Hero | Must not | May |
|---|---|---|
| Elena Rodriguez | Be called Standards Committee **chair** — the data has her as a **Member** for 2023-24 and 2025-26 (see §9, decision 1) | Appear as an engaged conference attendee and Standards Committee member from 2023 |
| Gwen Whitfield | Be "board chair" — no board entity exists; the data has her on **Food Safety**, Member 2023-24, **Chair from 2025** | Be described as a governance-minded volunteer any year from 2014; chair Food Safety from 2025 |
| Tom Reyes | Be put on a stage or credited with event attendance | Be quoted on advocacy — he has heavy legislative activity |
| Victor Sandoval | Volunteer, present, or be thanked for engagement | Appear only as a renewing corporate member, if at all |
| Marcus Chen | Be shown renewing smoothly | Appear in a lapse/grace-window narrative |
| Bob Kowalski | Be shown as a growth story after 2023 | Appear as a long-tenured member; employer acquired 2023 |
| Aisha Bell | Have a correct, current employer on file | Appear with a stale record; changed employers to Fernholt Creamery |
| Danielle Okafor | Appear healthy after her employer dissolves in 2025 | Appear 2024-25; lapse in 2026 |
| Kate O'Leary / Kathy OLeary | Be treated as two unrelated people | Appear as the duplicate pair (internal data-quality docs only) |
| Priya Natarajan | Appear before 2025 | Be a rising-star apprentice from 2025 |
| Jamie Fuller | Be shown as a high-revenue member | Be a high-engagement enthusiast-tier blogger from 2023 |
| Sofia Marchetti | Hold credentials she has not earned | Progress Foundation → CCP from 2024 |
| Charlie Mason | Be placed in North America | Represent a Tasmanian sheep dairy from 2021 |
| Henri Dubois | Attend more than about one event a year | Be the Jura affineur; **Fromagerie Saint-Rémille took 3 medals in 2023** |
| Nia Thompson | Appear before 2026 | — |

Unnamed composite members are always the safer choice. "A farmstead producer in the upper
Midwest" needs no persona and cannot contradict one.

**Committees** — exactly six, all formed 2014-2017 and therefore valid from 2019 on: Standards,
Food Safety, Education, Awards & Competition, Events, Membership & Outreach. All are
`IsPublic: true`, so public minutes are legitimate for all six. Committee **chairs and members**
must be taken from `generated/committee-memberships` joined to `generated/committee-terms` — the
names there are ordinary generated people, not heroes, and they are the correct names to use.

**Events** — 98 events in `content/event-calendar.json`, `EVT-<year>-<key>`, each with name, date,
type and place. One Annual Conference per year. The Events entity was retired in v1.2; paid
registrations now live as Event Order Lines on orders numbered `ORD-E-REG-…-<EventKey>`, and free
webinars carry no registrations at all. Never invent an event; if the week has no event, write
about something else.

**Courses** — 63 instances, `<Title> (<Cohort> cohort)`. Reference the title; the cohort suffix is
optional in prose.

**Certifications** — exactly seven. Cheese Foundations Certificate; Food Safety & HACCP
Certificate; Certified Cheesemonger; Certified Cheese Professional (CCP); Sensory Evaluation
Certificate; Advanced Affinage Certificate; Competition Judge Accreditation.

**Competitions** — six categories: Soft-Ripened, Alpine Styles, Aged Cheddar & Territorials,
Fresh & Pasta Filata, Washed Rind, Blue Veined. Results are `Gold | Silver | Bronze | None`.
Product and organization names come from the entry rows, never invented.

**Organizations** — `data/banks/organizations.json` and `generated/organizations` only.

### 4.4 Weekly coherence contract

For any week W, if both halves are generated:

1. `morecheese-internal-comms` reads `content/blog/YYYY/` for W's three posts **first**.
2. At least one internal artifact in W must reference something in a W post — a number, a course,
   an event, a decision — without contradicting it.
3. Internal artifacts may hold a **preliminary** version of a public number, but must be dated
   *before* the public artifact and must be visibly preliminary ("subject to the January close").
4. No internal artifact may reveal a fact that the public artifact for the same week denies.

---

## 5. Staff cast

### 5.1 Current rule (in force)

The world model defines **16 members and zero staff**. Until that changes, every artifact is
signed by a **role**, never a person:

| Role byline | Used for |
|---|---|
| `ICF Communications Team` | blog posts, newsletters (already the blog skill's rule — unchanged) |
| `Office of the Chief Executive` | annual report leadership letter, board packets |
| `Membership Operations` | membership memos, close spreadsheets |
| `Events Team` | event decks, logistics threads |
| `Education & Credentialing` | course/certification docs |
| `Advocacy & Standards` | policy and comment-letter docs |
| `ICF Media Relations` | press-release contact block |

Email From/To use role mailboxes: `comms@`, `membership.ops@`, `events@`, `education@`,
`advocacy@`, `exec@`, all `@morecheese.example`.

This is genuinely realistic for a mid-sized association — internal mail to shared functional
mailboxes is normal — so the fallback is not a visible compromise.

### 5.2 PROPOSED — requires Amith's approval before use

**Do not use these names in any artifact until this section is marked approved. Do not add this
roster to `data/`.** Named staff make internal comms dramatically better (a thread between two
named people reads real; a thread between two mailboxes reads like a template), so this is worth a
decision. Proposed roster — six people, deliberately small, no overlap with the 16 member heroes
and no overlap with any name in `generated/people` (checked at approval time):

| Role | Proposed name | Mailbox | Tenure | Voice |
|---|---|---|---|---|
| Chief Executive Officer | Marguerite Ashdown | `m.ashdown@morecheese.example` | 2016- | Measured, asks for the second-order effect, writes short. |
| VP, Membership | Desmond Oyelaran | `d.oyelaran@morecheese.example` | 2018- | Numbers-first, allergic to vague retention language. |
| VP, Marketing | Ingrid Halloway | `i.halloway@morecheese.example` | 2019- | Pushes for earlier deadlines; the one who asks "can we say that?" |
| Events Director | Ruben Castellanos | `r.castellanos@morecheese.example` | 2017- | Logistics brain, dry, tracks everything in a spreadsheet. |
| Membership Operations Analyst | Wei-Lin Tsai | `w.tsai@morecheese.example` | 2021- | Careful, flags data-quality caveats before anyone asks. |
| Communications Manager | Noor Rahimi | `n.rahimi@morecheese.example` | 2020- | Writes the blog; chases numbers on Thursdays. |

Notes for the approval decision:
- Tenure start dates matter. Only Ashdown and Castellanos exist for a 2019 artifact; Rahimi and
  Tsai must not appear before 2020 and 2021. A 2019 email thread stays role-only either way.
- If approved, these belong in the world model (`plans/…world-model-and-personas.md` §2 as a staff
  table), **not** in `data/ruleset/heroes.json` — they are not simulated members and must not get
  membership periods, orders, or committee seats.
- If rejected, the role-only fallback in §5.1 stands and nothing else in this design changes.

---

## 6. Fiction labeling standard

### 6.1 Public artifacts — the verbatim disclaimer

Every public artifact ends with a `---` rule and then this paragraph, **verbatim**, italicised, as
the final line of the file:

```
*The International Cheese Federation (ICF) and More Cheese are entirely fictional. This post is demonstration content created for MemberJunction. All people, organizations, events, courses, certifications, figures, and quotations in it are invented, and nothing here represents a real association, a real business, a real person, or real professional advice.*
```

Do not reword, shorten, or relocate it. It says "This post" even in an annual report; that is
deliberate — the instruction is verbatim reuse of the blog skill's paragraph so that a single grep
finds every labeled artifact in the corpus. See §9, decision 2, if a per-type variant is wanted.

### 6.2 Internal artifacts — the header line

Internal Markdown artifacts open with this line **immediately after the frontmatter**, before any
other body content:

```
> **FICTIONAL DEMONSTRATION DOCUMENT** — International Cheese Federation (ICF), a fictitious trade association created for the MemberJunction More Cheese demonstration environment. All names, figures, events, and decisions are invented.
```

Internal CSVs carry it as the `# notice:` key in the comment block (§3.4). Deck outlines carry it
as the last line of slide 1's speaker notes **and** as the header line. Email messages carry it
after the rendered header block, before the message body.

### 6.3 Per-type summary

| doc_type | Label |
|---|---|
| blog-post, annual-report, press-release, competition-results, committee-minutes, newsletter | §6.1 verbatim disclaimer, final line |
| memo, deck, board-packet, policy, email | §6.2 header line, first body line |
| spreadsheet | `# notice:` in the CSV comment block |

---

## 7. The do-not list

1. **No real brands or companies as actors.** Not as buyers, sellers, sponsors, venues, vendors,
   platforms, or examples. Organization names come from `data/banks/organizations.json` and
   `generated/organizations`. (A real *city* as an event location is fine — the events data
   already uses Madison, Louisville, Des Moines, Petaluma, Hobart, Querétaro, Guelph.)
2. **No real people.** No executives, legislators, scientists, journalists, cheesemakers, or
   celebrities — not quoted, not named, not characterised, not in a footnote, not in praise.
3. **No real trade bodies or agencies as speakers.** Describe the function ("the federal
   food-safety regulator", "a state agriculture committee"), never the body.
4. **No real-world event as foreground.** Real conditions, markets, rules, weather, published
   statistics may sit in the background as atmosphere. They may not be the subject with named
   actors attached.
5. **No medical, veterinary, legal, tax, or financial advice.** Food safety is written as "here is
   what the rules require and here is our course on it", never "this is safe to eat" or "you may
   legally ship this".
6. **No pricing that contradicts `generated/products`.** The 16 products and their
   `StandaloneSellingPrice` are canon: Enthusiast $150, Individual $175, SmallBusiness $400,
   Corporate $1,000, Conference Registration $450, Workshop Registration $150, Certification exam
   fee $425, Recertification fee $195, Competition entry $65, Journal $85, Standards handbook $140,
   Exhibitor booth $2,400, Job board posting $250, Federation apron $38, plus a cheese atlas and an
   education-fund donation line. If an artifact quotes a price, it must be one of these — or a
   unit price that actually appears on an order line in `generated/orders` for that product. (Note: the
   Individual membership line carries both $175 and an undocumented $145 rate in the order data;
   quote $175 as the list price and treat $145 as an internal open question, not a published
   figure.) Blog posts keep their existing stricter rule: no prices at all.
7. **No invented world-model objects.** No new committees, events, courses, certifications,
   competition categories, eras, motifs, ladders, heroes, or member organizations. If a piece needs
   one that does not exist, change the piece or report the gap.
8. **No heroes out of period, and no contradiction of an arc** (§4.3).
9. **No named ICF staff** until §5.2 is approved.
10. **No `@morecheese.org` email addresses** anywhere in the corpus — use `.example`.
11. **No batching across periods.** One week, one year, or one release per invocation.
12. **No writes outside `content/` and `vault/`.** `data/`, `generated/`, `config/`,
    `migrations/`, and `packages/` are read-only to every content skill.

---

## 8. Consistency rules — numbers must be derivable

**Every number in a public artifact must be reproducible by running a query from Appendix A
against `generated/`.** Not "approximately consistent" — reproducible. The skills state which
query produced each figure, and the completion checklist requires it.

Rules of practice:

1. **Compute, then write.** Run the aggregation, write the numbers into a scratch fact-sheet, then
   draft prose against the fact-sheet. Never draft first and reconcile after.
2. **Cite the directory.** Each artifact's `data_sources` frontmatter lists the `generated/`
   directories every quoted figure came from.
3. **Round honestly.** "More than 900 members" for 924 is fine. "About 1,000" is not.
4. **Never sum across halves.** Membership counts come from qualifying membership purchases
   (the Membership Status rule: a Confirmed, un-refunded `… Membership (annual)` purchase in the
   last 12 months); revenue comes from order lines; cash comes from `payments`. Do not derive one
   from another.
5. **Financial statements stay at summary altitude.** `generated/` has orders, order lines,
   payments, and payment lines. It has no general ledger, no expense side, no balance sheet.
   Annual reports therefore report **revenue by line, cash collected, and receivable balance** and
   explicitly say the figures are unaudited operating revenue. **Never invent an expense number,
   a surplus, a reserve, or a headcount cost.**
6. **Internal preliminary figures must be labeled.** An internal doc may show a number that later
   changes, but must say it is preliminary and be dated before the final.
7. **Fiscal year == calendar year.** Membership is a rolling 12 months from each purchase, but
   every year-level figure is reported on the calendar year.
8. **The 2019 start of order history is a data artifact — never narrate it as fact.** Billing
   history begins in 2019 (world model §5.1), so every member's first purchase in the data is in
   2019 or later, regardless of when they actually joined. Consequences that are binding on every
   skill:
   - **First-time members (A.3) are meaningless for 2019.** Never publish a 2019 new-member count,
     and never publish a new-vs-renewing or retained-vs-lapsed split for 2019.
   - **Nobody is current on 2018-12-31.** Never make a 2019-vs-2018 comparison.
   - First-time-member counts are valid from **2020 onward**; year-over-year comparisons from
     **2020 vs 2019** onward.
   - This artifact is excellent *internal* material — a membership-ops analyst noticing it and
     refusing to publish the number is exactly the seam the internal corpus should show. It is
     never public material.
9. **Membership counts and membership revenue will not tie.** "Current members" counts people
   whose latest qualifying purchase is within 12 months; membership sales are the purchases booked
   in a window. A member who bought in March of the prior year is current but contributed nothing
   to this year's sales. Report one basis or the other, say which, and never present the
   difference as an error in a public artifact.
10. **The data has an end.** Confirmed orders run to 2026-06-20 and payments to 2026-07-21 (as of
   2026-10). A week after that has no commerce figures to quote; internal artifacts must not be
   dated past it, and public ones must not quote membership, event or revenue figures for it.

### 8.1 Reference figures (from `node scripts/vault-facts.mjs`, 2026-10, committed `generated/`)

These replace the September 2026 figures, which were computed from the retired
`membership-periods`, `events` and `event-registrations` tables. The FY2023 annual report and the
2024 conference press release were written against those tables, so some of their figures no
longer reproduce exactly.

| Figure | 2019 | 2020 | 2021 | 2022 | 2023 | 2024 | 2025 |
|---|---|---|---|---|---|---|---|
| Current members on Dec 31 | 371 | 390 | 483 | 638 | 859 | 1,051 | 1,447 |

FY2023 detail: 859 current on Dec 31 · tier mix 614 Individual / 136 SmallBusiness / 72
Enthusiast / 37 Corporate · 276 first-time members · of 638 current at the end of 2022, 567
retained and 71 lapsed · 998 membership purchases, $227,979 membership sales · 13 events, 1,026
paid registrations, 959 attended · Annual Conference 2023 (Louisville, KY, 2023-07-25) 290
registered / 268 attended · 8 course instances, 506 enrollments, 257 completions · 12
certification enrollments, 2 awards · 47 competition entries across 6 categories · 88 advocacy
actions · 24 committee meetings · 2,106 confirmed orders, $472,294 gross, $462,776 captured
payments.

FY2024 detail: Annual Conference 2024 (Des Moines, IA, 2024-07-16) 351 registered / 328
attended · 65 competition entries · 305 first-time members.

Re-run the script before writing; these are a smoke test, not a substitute.

---|---|---|---|---|---|---|---|
| Members with a period active on Dec 31 | 404 | 474 | 515 | 661 | 924 | 1,125 | 1,545 |

FY2023 detail, all from Appendix A: 924 active periods · tier mix 655 Individual / 148
SmallBusiness / 80 Enthusiast / 41 Corporate · 271 first-time members · 814 Renewed, 84 Lapsed,
26 Cancelled (88.1% renewal) · $209,774 dues billed · 13 events, 2,244 registrations, 1,535
attended · Annual Conference 2023 (Louisville, KY, 2023-07-25) 298 registered / 276 attended ·
8 course instances, 506 enrollments, 257 completions · 12 certification enrollments, 2 awards ·
47 competition entries across 6 categories · 88 advocacy actions · 24 committee meetings ·
$490,358 gross orders, $479,915 applied, $462,776 captured payments.

FY2024 detail: Annual Conference 2024 (Des Moines, IA, 2024-07-16) 362 registered / 337 attended ·
65 competition entries · 311 first-time members.

Re-run Appendix A before writing; these are a smoke test, not a substitute.

---

## 9. Decisions needed from Amith / Robert

| # | Decision | Why it is blocking | Default if unanswered |
|---|---|---|---|
| 1 | **Hero arcs contradict `generated/`.** The blog skill's §3 says Elena Rodriguez "chairs the Standards Committee" and Gwen Whitfield climbs to "board chair". `generated/committee-memberships` has Elena as a Standards Committee **Member** (2023-24, 2025-26) and Gwen on **Food Safety** — Member 2023-24, Chair 2025-26. There is no board entity at all; there are six committees. Per world-model §5.1 the committed dataset is the source of truth. | Any artifact naming a chair will contradict either the data or the blog corpus. | This design follows `generated/`. The blog skill's prose should be corrected — flagged, not edited, per the read-only rule. |
| 2 | **Disclaimer wording.** The mandated paragraph says "This post". Reused verbatim in an annual report it reads oddly. | Verbatim reuse was an explicit instruction; a variant needs sign-off. | Verbatim everywhere, as written in §6.1. |
| 3 | **Named staff roster (§5.2).** | Internal comms are markedly better with named senders; role-only is the safe fallback. | Role-only bylines. |
| 4 | **Volume and budget.** ~2,200 artifacts for 2019-2025 (§4.1). Vision-plan open question 5 already flags model-tier and cost. | Someone must approve the spend and the tranche plan before any bulk run. | No bulk runs. Samples only. |
| 5 | **Dropbox sync mechanism.** Is `vault/internal/` git-tracked and pushed by CI, or generated to a working copy and uploaded manually? Does the binary render step (§2.4) run at seed time? | Determines whether `vault/` belongs in `.gitignore`. | `vault/` is git-tracked, text-only, uploaded manually. |
| 6 | **Public committee minutes.** All six committees are `IsPublic: true`, and `committee-motions`/`committee-votes` exist, so minutes are generatable back to 2015 — earlier than the 2019 era floor. | Pre-2019 content has no era and no commerce data behind it. | Minutes generated for 2019-2025 only. |

---

## Appendix A — aggregation queries

Every figure comes from one read-only script, `scripts/vault-facts.mjs` (plain Node, no
dependencies, run from the repo root; add `--json` for machine-readable output). It encodes the
current data model so writers don't have to:

- **Membership** follows the Membership Status query (`config/queries/SQL/membership-status.sql`):
  a Confirmed, un-refunded `… Membership (annual)` purchase, billed to the person, makes them
  current for 12 months. Tier is the latest purchase's product.
- **Event registrations** are Event Order Lines on Confirmed sale orders numbered
  `ORD-E-REG-…-<EventKey>`; attendance is the line's `AttendanceStatus`. Names, dates and places
  come from `content/event-calendar.json`.
- **Revenue by product** attributes each refund line to the product of the line it reverses
  (`ReversesOrderLineID`). Cancellation orders often name a different product on the refund line
  itself, so summing by the refund line's own product misstates every product line.

The section numbers below are what the skills cite.

| § | Command | Output keys |
|---|---|---|
| A.1 | `node scripts/vault-facts.mjs series` | `currentMembersOnDec31` per year |
| A.2 | `node scripts/vault-facts.mjs year <YYYY>` | `membership.tierMixOnDec31`, `retainedFromPriorYear`, `lapsedFromPriorYear`, `membershipSalesGross` |
| A.3 | `node scripts/vault-facts.mjs year <YYYY>` | `membership.firstTimeMembers` |
| A.4 | `node scripts/vault-facts.mjs year <YYYY>` · `event <EventKey>` | `events[]`: registered, refunded, attendance by status |
| A.5 | `node scripts/vault-facts.mjs year <YYYY>` | `revenue`: orders, gross, applied, receivable, cash captured, net by product |
| A.6 | `node scripts/vault-facts.mjs year <YYYY>` | `education`: course instances, enrollments, completions, certifications |
| A.7 | `node scripts/vault-facts.mjs year <YYYY>` | `competition`: entries, categories, medals |
| A.8 | `node scripts/vault-facts.mjs year <YYYY>` | `advocacy`: totals by kind and topic |
| A.9 | `node scripts/vault-facts.mjs year <YYYY>` | `governance`: meetings, chairs and vice chairs |
| A.10 | `node scripts/vault-facts.mjs week <Monday>` | one week: membership purchases, orders, cash, registrations taken, events this week and next eight, enrollments, certifications, advocacy, committee meetings, `dataEnds` |
| A.11 | `node scripts/vault-facts.mjs prices` | product list prices |

## Appendix B — file inventory of the initial samples

| Path | doc_type | Notes |
|---|---|---|
| `content/annual-reports/2023/icf-annual-report-fy2023.md` | annual-report | FY2023 sample |
| `content/press-releases/2024/2024-07-18-icf-annual-conference-2024-des-moines.md` | press-release | EVT-2024-CONF + 2024 competition medals |
| `vault/internal/README.md` | — | Dropbox root readme |
| `vault/internal/memos/2019/2019-02-04-membership-ops-january-close-readout.md` | memo | week of 2019-02-04 |
| `vault/internal/spreadsheets/2019/2019-02-04-january-2019-membership-close.csv` | spreadsheet | same week |
| `vault/internal/decks/2019/2019-02-05-february-workshop-readiness.md` | deck | same week |
| `vault/internal/email/2019/2019-02-04-thread-january-close-numbers-for-friday-post/*.md` | email | 3-message thread, same week |
