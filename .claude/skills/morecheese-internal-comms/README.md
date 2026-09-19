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

One week per invocation, fresh context, Mondays only — same loop shape as the blog skill:

```sh
cd /path/to/more-cheese
while read -r wk; do
  claude -p "Use the morecheese-internal-comms skill. Generate the ICF internal bundle for the week of Monday $wk."
done < /tmp/mc-weeks.txt
```

Generate the **public** week first. The skill reads `content/blog/<year>/` for the window and
cross-references it; running internal-first loses the coherence that makes the corpus worth having.

Weekly internal comms for 2019–2025 is ~365 bundles ≈ 1,400 files. That is a budget decision, not
a default — see VAULT-DESIGN §9 decision 4. No bulk runs without sign-off.

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
