---
name: morecheese-internal-comms
description: Generates the International Cheese Federation (ICF / More Cheese) INTERNAL staff corpus for one week or one event — memos, CSV spreadsheets, slide-deck outlines and email threads — filed under vault/internal/<type>/YYYY/ for the Dropbox account that Knowledge Hub ingests. USE THIS SKILL WHENEVER anyone asks to write, draft, produce, generate, backfill, extend or check ICF internal comms, More Cheese internal documents, staff documents, internal memo, staff memo, internal email, email thread, staff email history, internal spreadsheet, CSV, membership close, board packet, policy doc, slide deck, deck outline, presentation, PowerPoint, QBR, internal docs for Dropbox, Knowledge Hub corpus, "the internal side", "what staff were saying that week", "behind the scenes documents", or an internal bundle for a given week or event — for any week or event in 2019 through 2025. Also use it when asked to verify internal artifacts' filenames, frontmatter, fiction headers, or coherence with the same week's public blog. Do not hand-write ICF internal documents without loading this skill.
---

# ICF / More Cheese — internal comms generation

You are producing the **internal** working record of the **International Cheese Federation
(ICF)** — a fictitious mid-sized trade association in the More Cheese demonstration environment
for MemberJunction. These files go to a read-only Dropbox account that Knowledge Hub ingests.

**One invocation = one week, or one event.** Never batch.

Read [`content/VAULT-DESIGN.md`](../../../content/VAULT-DESIGN.md) first. It governs; this skill
implements it. §2.2 (layout), §3 (metadata), §4.4 (the coherence contract), §5 (cast), §6.2
(fiction header), §7 (do-not), §8 (numbers), Appendix A (queries).

---

## 1. Establish the scope

**Week mode.** Snap the caller's date back to that week's **Monday**; the bundle covers Monday–
Sunday. Write down the seven dates.

**Event mode.** Take the event's `EventDate` from `generated/events`. A pre-event bundle sits in
the week 2–8 weeks before; a post-event bundle sits in the week containing the event.

Either way, the year must be **2019–2025**. Outside that, stop and report — do not invent an era.

## 2. Read the public half FIRST (required — this is the whole point)

Before writing a single internal file:

1. Read `content/blog/<year>/` for every post dated inside the window. Note their subjects, their
   numbers, their category, and the day of week each landed.
2. Read any `content/press-releases/<year>/` or `content/annual-reports/` item touching the window.
3. Then build the internal bundle so it reads as **the same organisation writing privately**:
   - At least one internal artifact must reference something in a public artifact from the same
     window — a number, a course, an event, a decision — without contradicting it.
   - Internal artifacts may carry a **preliminary** version of a public figure, provided they are
     dated *before* the public artifact and say so ("subject to the January close").
   - No internal artifact may state a fact the same window's public artifact denies.
   - The internal record should show the *seams*: someone chasing a number, a deadline moved, a
     caveat that never made the blog. That texture is what makes a Knowledge Hub demo land.

If the window has no public content yet, say so and generate the internal bundle anyway, noting
in your report that coherence could not be checked.

## 3. Compute the week's facts

Run Appendix A of `content/VAULT-DESIGN.md`: A.0 (loader) then **A.10** (the one-week snapshot),
plus A.2/A.3 for a membership close, A.4 for event registrations, A.5 for revenue, A.6 for
education, A.9 for governance — whatever the bundle actually talks about.

Internal numbers are held to the same standard as public ones with one exception: a document may
show a *preliminary* number if it is explicitly labelled preliminary and a later document (or the
week's blog post) carries the settled figure. Never present an unlabelled invented number.

Also note the era (`data/ruleset/eras.json`) — it sets what staff are worried about
(VAULT-DESIGN §4.2).

## 4. What a bundle contains

Default **week bundle** — four artifacts:

| # | Type | What it is |
|---|---|---|
| 1 | **memo** (`memo`) | 400–700 words. One functional team writing to another or to the whole staff. A readout, a decision, a recommendation. Has a `Subject:` header block, a short summary, 2–4 `##` sections, and a "what we need" close. |
| 2 | **spreadsheet** (`spreadsheet`, CSV) | One table, 5–25 data rows, 4–8 columns. Real figures from Appendix A. Prefer a table that a person would actually build: a monthly close, a registration roster summary, a lapse-risk list, a category tally. |
| 3 | **deck** (`deck`) | 6–12 slides as a Markdown outline. For a committee prep, a QBR, an event walk-through, a board pre-read. |
| 4 | **email thread** (`email`) | 3–5 messages in a folder, alternating between two or three role mailboxes, showing a real exchange: a request, a reply with a caveat, a decision. |

**Substitutions.** A month-end week may swap the deck for a `board-packet`; a policy-setting week
may swap the memo for a `policy`. Never produce more than five artifacts in one invocation.

### 4a. Memo format

```
vault/internal/memos/YYYY/YYYY-MM-DD-<slug>.md
```

Frontmatter, then the §6.2 fiction header line, then:

```
**To:** Communications; Events Team
**From:** Membership Operations
**Date:** 4 February 2019
**Subject:** January close — what the numbers say and what they don't
```

Then a one-paragraph summary, 2–4 `##` sections, and a final `## What we need` with 2–4 bullets.

### 4b. Spreadsheet format (CSV)

```
vault/internal/spreadsheets/YYYY/YYYY-MM-DD-<slug>.csv
```

`#`-comment metadata block per VAULT-DESIGN §3.4 (including the `# notice:` fiction label), a bare
`#` line, then the header row, then data. Numeric columns are unformatted numbers — no `$`, no
thousands separators, no percent signs; put the unit in the column name
(`dues_billed_usd`, `renewal_rate_pct`). Column names are `lower_snake_case`. A trailing
`# source:` line naming the Appendix A snippet is encouraged.

### 4c. Deck outline format

```
vault/internal/decks/YYYY/YYYY-MM-DD-<slug>.md
```

Frontmatter, fiction header, then slides separated by `---`. Per slide: a `## ` title, `-` bullets
(max 5, max ~12 words each), and an optional `> notes:` speaker-note block. Slide 1 is the title
slide and its notes end with the fiction header sentence (VAULT-DESIGN §6.2). Last slide is a
`## Decisions we need` or `## Next steps`. Do not write paragraphs on slides — bullets only.

### 4d. Email thread format

```
vault/internal/email/YYYY/YYYY-MM-DD-thread-<slug>/
  01-YYYY-MM-DD-HHMM-<from-role>-to-<to-role>.md
  02-…
```

Folder is dated to the **first** message. One file per message, numbered in send order. Each file:
frontmatter with `from`, `to`, `cc`, `subject`, `sent`, `thread_id`, `message_id`, `in_reply_to`
(null on the first); then a rendered header block; then the fiction header line; then the body.

- All mailboxes are role mailboxes at `.example`: `comms@`, `membership.ops@`, `events@`,
  `education@`, `advocacy@`, `exec@`, `press@`, all `@morecheese.example`.
- `subject` uses `Re:` on replies and stays identical otherwise.
- `message_id` convention: `mc-YYYY-MM-DD-HHMM-<fromrole>-<torole>`.
- Message **bodies** are short — 60–200 words, counted excluding the frontmatter, the rendered
  header block and the fiction header line. Real internal mail is short. Sign off with the role name.
- Threads must resolve something: a number supplied, a deadline agreed, a decision made.

## 5. Cast — roles, not names

The world model defines **16 members and zero staff**. Until VAULT-DESIGN §5.2 is approved by
Amith, every internal artifact is written by and to a **role**:

`Office of the Chief Executive` · `Membership Operations` · `Communications` · `Events Team` ·
`Education & Credentialing` · `Advocacy & Standards` · `ICF Media Relations`

Do not invent a named staffer, not even a first name in a sign-off. If §5.2 is marked approved,
use that roster and only that roster, and respect its tenure start dates.

**Members** may be named in internal documents when they are heroes eligible for that year
(VAULT-DESIGN §4.3) or generated people who appear in the relevant rows. Internal documents are
the *right* place for data-quality narratives — the Kate O'Leary / Kathy OLeary duplicate pair,
Aisha Bell's stale employer record, Marcus Chen's grace window — because those are the demo's
point. Do not use those narratives in public content.

## 6. Voice

Internal, not published. Concretely:

- Blunt and functional. No marketing language, no "we are thrilled".
- Numbers stated with their caveats attached ("this excludes the 14 periods still processing").
- People disagree, mildly and professionally. Someone pushes a deadline; someone asks for a
  clarification; someone says "I think this is a data problem, not a churn problem".
- Short. A memo is 400–700 words; an email is 60–200; a slide bullet is under 12 words.
- Era-appropriate anxiety: 2020 is a scramble; 2022–24 is capacity strain; 2025 is hardship.
- Never AI-flavoured ("delve", "landscape", "in today's fast-paced", "game-changer", "leverage").

## 7. Frontmatter

Common fields per VAULT-DESIGN §3.1 (`title`, `date`, `doc_type`, `visibility: internal`, `org`,
`era`, `fiscal_year`, `fictional: true`, `tags`, `data_sources`) plus the type-specific fields in
§3.3 (`from_role`/`to_roles`/`subject`/`week_of` for memos; `deck_for`/`slide_count`/
`presenter_role` for decks; the email header set for messages). CSVs carry theirs in the `#` block.

`week_of` is the bundle's Monday, ISO. Every artifact in one bundle carries the same `week_of`.

## 8. The fiction header

Internal Markdown artifacts open with this line immediately after the frontmatter, before any
other body content — **verbatim**:

```
> **FICTIONAL DEMONSTRATION DOCUMENT** — International Cheese Federation (ICF), a fictitious trade association created for the MemberJunction More Cheese demonstration environment. All names, figures, events, and decisions are invented.
```

CSVs carry it as the `# notice:` key (VAULT-DESIGN §3.4). Deck slide 1 carries it in the header
position **and** at the end of slide 1's speaker notes. Email messages carry it after the rendered
header block, before the message body.

Internal artifacts do **not** carry the public verbatim disclaimer — that is for `content/` only.

## 9. Do not

Everything in VAULT-DESIGN §7 applies. The ones that bite hardest here:

- **No named ICF staff** until §5.2 is approved. Roles and role mailboxes only.
- **No `@morecheese.org` addresses.** `.example` only.
- **No real people, brands, agencies, trade bodies, or software vendors as actors.** An internal
  memo naming a real SaaS product is still a real brand as an actor. Describe the function.
- **No invented world-model objects** — committees, events, courses, certifications, competition
  categories, member organisations, eras.
- **No hero out of period**, no contradiction of an arc.
- **No unlabelled invented numbers.** Preliminary is allowed; fabricated is not.
- **No contradiction of the same window's public content.**
- **No medical, veterinary, legal, or tax advice** — even internally.
- **No pricing that contradicts `generated/products`.**
- **No binary files.** CSV and Markdown only; `.xlsx`/`.pptx` rendering is a separate seed-time
  step (VAULT-DESIGN §2.4).
- **No batching** — one week or one event per invocation.
- **No writes outside `vault/`.** `content/`, `data/`, `generated/`, `config/`, `migrations/`,
  `packages/` are read-only to this skill.

## 10. Completion checklist — run this and report each line

1. **Files created** — list every full path. Confirm the bundle shape (memo, CSV, deck, email
   thread of 3–5 messages) and that no more than five artifacts were produced.
2. **Filenames match dates** — every filename's `YYYY-MM-DD` equals its `date` (or `sent` date for
   emails), sits inside the stated Monday–Sunday window, and its parent year folder matches. State
   the window. Email files are ordinal-numbered in send order and the thread folder is dated to
   message 01.
3. **Frontmatter valid** — parse the YAML on every Markdown file, and the `#` block on the CSV.
   All common fields present; `visibility: internal`; `fictional: true`; `doc_type` in the §3.2
   vocabulary; `era` matches `eras.json`; identical `week_of` across the bundle; email
   `in_reply_to` chain is intact (null on 01, each later message pointing at its predecessor).
4. **Fiction header present** — grep the exact §8 line in every Markdown artifact and the
   `# notice:` key in the CSV. Confirm position (first body line).
5. **No real named people** — list every proper name of a person across the bundle and classify
   each as (a) an eligible hero, (b) a name read from `generated/people`, or (c) a role. Anything
   else is a failure. Confirm no named ICF staff appear.
6. **Numbers traceable** — table every figure across the bundle with the Appendix A snippet that
   produced it. Any figure presented as final without a snippet must be removed; any preliminary
   figure must be visibly labelled preliminary.
7. **Public coherence** — name the public artifact(s) in the same window you read, and state the
   specific cross-reference each internal artifact makes. Confirm no contradiction. If there was
   no public content for the window, say so explicitly.
8. **Mailboxes valid** — every From/To/Cc is a role mailbox at `@morecheese.example`. No
   `.org` addresses, no personal names.
9. **Lengths** — memo 400–700 words; each email **body** 60–200 words (excluding frontmatter,
   header block and fiction line); deck 6–12 slides with ≤5 bullets per slide; CSV 5–25 data rows.
   Report each.
10. **No world-model inventions** — confirm every committee, event, course, certification,
    competition category, product, and organisation named exists in `generated/` or
    `data/banks/organizations.json`.

If any line fails, fix it before reporting.
