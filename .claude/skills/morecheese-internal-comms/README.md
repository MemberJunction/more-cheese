# morecheese-internal-comms — operator notes

`SKILL.md` produces **one week's** (or one event's) internal bundle under `vault/internal/`:
a memo, a CSV, a slide-deck outline, and a 3–5 message email thread.

Governing design: [`content/VAULT-DESIGN.md`](../../../content/VAULT-DESIGN.md).

## Why this exists

`vault/internal/` is the read-only Dropbox corpus that Knowledge Hub ingests (Workstream E7). The
headline demo is asking a question that can only be answered from an internal document and
watching the answer cite a memo that never appeared on the website. That demo only works if the
internal corpus is (a) genuinely separate from `content/` and (b) obviously the *same
organisation* — which is why §2 of the skill makes reading the same week's blog posts a hard
prerequisite.

## Bundle shape

Four artifacts per week, never more than five:

```
vault/internal/memos/2019/2019-02-04-<slug>.md
vault/internal/spreadsheets/2019/2019-02-04-<slug>.csv
vault/internal/decks/2019/2019-02-05-<slug>.md
vault/internal/email/2019/2019-02-04-thread-<slug>/01-…md 02-…md 03-…md
```

## Running a backfill

Bulk runs use **Gemini 3.5 Flash Lite**, not Claude: Amith's direction on #125 was not to use the
Anthropic API for this workload. One model call per week, Mondays only:

```sh
GEMINI_ENV_FILE=~/Projects/MJ/.env node scripts/content-backfill-internal-gemini.mjs 2020-03-16 2023-07-24
node scripts/content-backfill-internal-gemini.mjs --dry-run 2023-07-24   # print the prompt, call nothing
node scripts/validate-content.mjs --internal-week 2020-03-16            # what each bundle must pass
node scripts/vault-facts.mjs week 2020-03-16                            # the figures a bundle may quote
```

The key is `GEMINI_API_KEY`, or MJ's `AI_VENDOR_API_KEY__GeminiLLM`, from the environment or from the
`.env` that `GEMINI_ENV_FILE` names. A small model cannot run this skill as an agent, so the script does
the agent's legwork: it puts the week's `vault-facts` output, the week's blog posts, recent internal
titles, VAULT-DESIGN and this skill into one prompt, writes the returned bundle, and checks it with
`validate-content.mjs` plus figure traceability, time leaks (attendance quoted before an event),
lengths, banned phrases and US spelling. Problems go back to the model as the next turn; after three
tries the draft is moved to `<logdir>/rejected/` so `vault/internal/` only holds bundles that passed.
`--par N` runs N contiguous lanes; `results.tsv` in the log directory has tokens and cost per week.

`scripts/content-backfill-internal.sh` is the original Claude Code driver, kept for one-off weeks that
need an agent's judgment; it is ~15× the cost per week.

Generate the **public** week first. The bundle cross-references `content/blog/<year>/` for the window;
running internal-first loses the coherence that makes the corpus worth having.

The data has an end: confirmed orders stop at 2026-06-20 (`vault-facts.mjs series` prints the
date). Weeks after it are skipped.

Each week's email thread gets a topic by rotation (`THREAD_TOPICS` in the script: renewals, event
logistics, committees, cohorts, certification, data quality, finance, advocacy, press, member complaints,
the competition, executive reporting, staff capacity, and — one week in fourteen — blog coordination), and
a thread subject may not repeat one already filed. Without that, 228 of 388 threads in the first full run
were about "blog alignment".

Cost (2026-10-27): the full 2019 to mid-2026 backfill, 382 bundles plus reruns, was ~$16 and ~35 min at
`--par 4` — ~$0.04 a week. The Claude driver's pilot was ~$0.51 a week, ~7.5 min.

## Rendering to Office formats

The vault is text-only on purpose. Conversion happens at Dropbox-seed time, not here:

```sh
# CSV -> XLSX (the '#' block becomes a _meta sheet)
python3 -c "import pandas as pd,sys; pd.read_csv(sys.argv[1],comment='#').to_excel(sys.argv[2],index=False)" in.csv out.xlsx
# deck outline -> PPTX
pandoc -t pptx --reference-doc=icf-template.pptx -o out.pptx deck.md
# memo -> DOCX
pandoc -o out.docx memo.md
```

Knowledge Hub can ingest either the Markdown/CSV or the rendered Office files; keeping the repo
text-only keeps the corpus reviewable in a PR.

## Known constraints

- **Role-only senders** until VAULT-DESIGN §5.2 (proposed staff roster) is approved by Amith.
  Named staff would improve these documents substantially — that is the single highest-leverage
  open decision for this skill.
- Emails are Markdown with an `.eml`-style frontmatter header block, not RFC-822 `.eml` files.
  Rationale in VAULT-DESIGN §3.5.
- Members named in internal docs must be era-eligible heroes or people in `generated/people`.
  Internal docs are the right home for the data-quality personas (the O'Leary duplicate pair,
  Aisha Bell's stale employer, Marcus Chen's grace window); those stay out of public content.

## Sample

The week of **2019-02-04** — the same week as the blog dry run — is filed under
`vault/internal/**/2019/` and passes this skill's §10 checklist.
