# More Cheese: Vision & Implementation Plan

**A continuously-running simulated association — narrative-first, incrementally generated, fully configured**

Version 2 · Supersedes the initial vision summary
Working team: Jennifer "Yuri" Lee, Caitlin Tuttle, with support from Madhav Subramaniyam

---

## 0. How to read this document

This is both a vision statement and an implementation brief. Sections 1–5 describe what we're building and why. Sections 6–12 are the plan, written to be actionable by an engineer or an AI agent working directly in the repo. Section 13 records what is still open.

**Grounding note:** everything asserted about current state was verified against `MemberJunction/more-cheese@next`. Where this document contradicts an earlier ruling in the repo, the reversal is called out explicitly with its rationale, because the repo docs are otherwise authoritative and an agent reading both needs to know which wins.

---

## 1. What More Cheese is becoming

More Cheese is the demonstration environment for MemberJunction: the **International Cheese Federation (ICF)**, a fictional professional society for people who make, age, sell, and champion artisan cheese.

Today it is a calibrated synthetic dataset with a configured MJ instance on top. What we are building is different in kind — a **continuously running simulated association** with:

- a **narrative** going back ten years to founding, evolved monthly by an AI process against real-world events
- **structured data** that accumulates incrementally to reflect that narrative, never regenerated from scratch
- a **content corpus** — blogs, financial reports, journals, email history, staff pages, possibly an AI podcast — that makes the association legible as an organization rather than a schema
- a **fully configured MJ environment** that installs with years of accumulated usage residue already in place
- **public-facing surface area** — the morecheese.org website, event registration widgets, guided tours

The organizing idea is Disney's, not a database's. A theme park works because there is a backstory nobody explicitly reads, and everything visible is consistent with it. The narrative is not decoration applied after the data. It is the ground truth the data is generated *from*.

**Everything is transparently fictional.** Avatars are deliberately cartoonish. Staff emails live on a reserved non-deliverable TLD. The fiction is labeled on every public-facing surface. Nobody should ever mistake ICF for a real organization or its people for real people.

---

## 2. Where we actually are (verified state)

The repo is substantially further along than casual description suggests. An agent working here should not assume greenfield.

### 2.1 The generator

`datagen/` is a causal, deterministic, benchmark-calibrated engine. Not a row filler.

- **22 pipeline stages**, dependency-ordered, with the non-obvious mutation edges declared and suite-checked (`PIPELINE.md` is generated from code; the suite fails if they disagree)
- **12 packs**, ~70 tables, **335 validation gates**
- **Five declarative patterns** (`annualParticipation`, `childOutcome`, `recurringDecision`, `derivedTransaction`, `staticAssignment`) interpreted by `engine/patterns.mjs`
- **The factor contract** — every causal claim is authored as `{ effect, feature, evidence }`, with evidence lint-enforced. The executor reads it forward, the validator derives recovery gates backward, RULESET.md renders it in English
- **Deterministic identity** — `uuidv5(namespace, "entity:businessKey")`, per-project namespaces registered in `engine/ids.mjs`
- **Calibrated against real sources** — modeled on the American Cheese Society, verified against IRS filings; every target carries source, confidence, and tolerance

### 2.2 The framework claim is already partly earned

`engine/` names no project and imports none, enforced by `cli/check-engine-boundary.mjs`. `projects/fixture/` is a second project — ~120 lines, CI-only — that runs the whole pipeline and is built by the suite on every run, so the claim cannot silently rot.

What is honestly *not* framework: ~175 bespoke validator gates carrying domain knowledge no declaration can state, and roughly 45% of generator code that is irreducible judgement. Both stay with the consumer project. This boundary must survive extraction.

### 2.3 Current BizApps coverage

| App | Status |
|---|---|
| bizapps-common | 7 of 10 tables — Person, Organization, Relationship, RelationshipType, Address, AddressLink, ContactMethod |
| bizapps-committees | 10 of 17 — incl. AgendaItem, Motion, Vote with attendance-consistent voting |
| bizapps-forms | 7 of 10 — post-conference survey, calibrated 28% response, NPS ≈ +30 |
| bizapps-tasks | 4 of 17 — committee action items, renewal outreach |
| bizapps-issues | 4 of 5 — tickets derived from real facts (overdue orders, employer changes, paid no-shows) |
| bizapps-secure-messaging | 3 of 6 — portal threads riding the issue state machine |
| bizapps-sonar | consumer — scores our data, 12th pack |
| bizapps-orders | **0** — `morecheese_orders` stand-in |
| bizapps-accounting | **0** — out of scope by prior ruling |

### 2.4 Platform residue — already built

The "someone has been using this instance" layer exists and is verified: three staff users, RecordChange audit backfill derived from real timelines, shared saved views, reusable queries (also Skip's entry points), seeded conversations, favorites, lists, notifications.

### 2.5 Heroes — already the right shape

A hero is **pinned facts plus generated history**, not hand-written rows. Elena isn't described as engaged; she gets activity that computes to engaged when Sonar scores her. Roster is 22, with believability rules already codified (names match regional dairy demographics, timelines add up, joining has a trigger, every pattern has a discoverable cause).

### 2.6 Delivery today

Metadata-first, ruled 2026-07-24. Generate to `out/packs/*.json` → `emit-mjsync` renders the committed `metadata/` tree (63 entity folders) → `mj sync push` through entity SPs → **capture** the resulting SQL as migrations.

`platform` is pinned to direct `insert` because entity SPs refuse back-dated `__mj_CreatedAt` and RecordChange rows.

### 2.7 The known pain

- The capture is a **photograph of one push against one prepared database**. ~122,000 records, ~22 minutes, by hand, cannot run in CI. It has gone stale silently five times, once by 19,823 rows, with every gate green.
- It ships as two ~68MB SQL files in the repo.
- **CI does not run the datagen suite at all.** 335 gates, the engine-boundary checker, and the fixture build run only when someone remembers to type the command.
- The world is anchored to `--release` with no wall clock, so it **ages** — left alone, "recent" activity drifts into the past.

---

## 3. Decisions made (this supersedes prior rulings)

These were settled in the planning dialog and are binding for implementation.

| # | Decision | Supersedes |
|---|---|---|
| **D1** | **DataGen is extracted to its own repo** in the MemberJunction org. More Cheese becomes a consumer; `fixture` becomes the second. Promotion to an MJ framework primitive stays open for later — extraction is deliberately the reversible step. | new |
| **D2** | **Accumulation is first-class in the structured data layer.** Generated data is never thrown away. Each run reads committed prior state and mints only what is new. | Supersedes `DATA-VERSIONING-CHECKPOINTS-2026-07-23.md` Option A (repeatable wipe-and-reseed migrations) |
| **D3** | **Full BizApps stack is in scope**, including bizapps-orders and bizapps-accounting. | Reverses the 2026-07-22 workstream ruling eliminating accounting and real orders |
| **D4** | **Knowledge Hub takes Option B** — a generated document corpus, not fattened prose fields. | Reverses the standing Option A recommendation in `KNOWLEDGE-HUB-ONE-PAGER-2026-07-16.md` |
| **D5** | **Single delivery path.** `platform` moves onto the metadata path. Back-dating is handled by a generated, one-time SQL script rather than by a permanent second delivery mechanism. | Supersedes `DELIVERY.md`'s permanent `platform: 'insert'` pin |
| **D6** | **Weekly generator runs, monthly/quarterly OpenApp releases.** State is committed weekly; releases are tags on a continuously advancing stream. | new — also resolves the aging problem in §2.7 |
| **D7** | **Narrative is the canonical artifact**, versioned in the repo, evolved monthly, and generated *before* the data each cycle. | new |
| **D8** | **History extends back ~10 years to founding**, through the pandemic, into the AI era. | Extends the current five-year window |

---

## 4. The three layers

### Layer 1 — Narrative (the Disney layer)

This is the new work and the hardest to do well. It is closer to writing a fairytale bible than to writing documentation.

**The founding story.** ICF founded roughly ten years ago. Who convened it, why, what problem it solved that no existing body did, what the first year looked like, what nearly killed it.

**The arc through eras.** Steady growth → COVID shock (events halved, competition canceled two years, producer sales cratered, retail-at-home rose) → recovery (in-person returns, judging decoupled to May) → new normal → the AI era. Each era needs organizational consequences, not just numbers: a policy fight, a staff departure, a bet that paid off, a bet that didn't.

**Character development at three depths:**

- **Founding-era and historical figures** — past presidents, board chairs, the people who shaped the institution. Mostly backstory; they appear in annual reports, hall-of-fame pages, and the memory of current members.
- **~100 key volunteer leaders** — committee chairs, competition judges, chapter leaders, longtime members. Rich profiles, tenure arcs, relationships to each other, reasons they joined and reasons some drifted away.
- **Current leadership and staff** — deep personas with roles, tensions, priorities, and working relationships. These are the accounts demo viewers will log in as.

**Believability rules already codified** (extend, don't reinvent): names follow real regional dairy demographics; timelines are mutually consistent; joining always has a trigger; every data pattern has a legible, discoverable cause.

**Monthly evolution.** An AI process advances the story each month: what happened in the world, what the team decided, how the last event went, who moved on, what broke. The narrative accumulates the same way the data does.

**Artifacts the narrative produces:**
- Staff and volunteer profile pages with cartoonish AI avatars
- Ten years of blog posts on morecheese.org
- Annual reports and financial statements
- Board minutes, journals, internal memos
- Email history between characters
- Possibly *CheeseCast* — AI-generated podcast episodes

### Layer 2 — Structured data (the accumulation layer)

Generated by DataGen from rules that an LLM populates *from the narrative*. The narrative says the Food Safety Committee fought over a labeling standard in 2023; the data shows the motions, the votes, the attendance, the resulting issue tickets, and the members who resigned over it.

Accumulates weekly. Never regenerated. Prior IDs are stable by construction via `uuidFor`.

### Layer 3 — Configured environment (the residue layer)

The MJ instance as it looks after years of real use: saved views, reusable queries, dashboards, conversation history, artifacts, search history, notifications — per persona, so switching accounts doesn't expose seams.

Plus the outward-facing surface: guided tours, public website widgets for event registration, and the read-only Dropbox of "internal" association documents wired into Knowledge Hub.

---

## 5. Why accumulation changes the engineering, not just the fiction

This deserves its own section because it is the load-bearing architectural decision.

Generation today is **stateless**: `(project, seed, release, ruleset) → world`. There is no prior-state input. That statelessness is precisely what forced the versioning design into wipe-and-reseed repeatable migrations — a full regeneration cannot be expressed as an append.

Make accumulation first-class and the whole delivery problem inverts:

- Each cycle emits **only new records**, all of which are `spCreate`
- That is a genuinely **additive migration**, which is exactly what Skyway wants
- No wipe file, no repeatable-migration ordering question, no 136MB rewrite per cycle
- The capture shrinks from ~122,000 records to a delta
- Fresh installs replay a sequence of additive migrations; existing installs take only what's new

Accumulation is not merely truer to how associations work. **It is the thing that makes delivery tractable.**

It also fixes aging. Running weekly against a moving release date means new data is written at roughly the wall-clock time it claims, so "recent activity" stays recent without intervention — and back-dating stops being needed at all after the baseline.

---

## 6. Workstream A — Extract DataGen

**Goal:** a standalone repo in the MemberJunction org, domain-blind, with More Cheese and fixture as consumers.

Naming is open (see §13). This document uses `DataGen`.

### A1. Lift and shift
Move `datagen/engine/`, `datagen/cli/`, and `datagen/projects/fixture/` to the new repo. `projects/morecheese/` stays with More Cheese and is loaded as a consumer project.

The engine/projects/cli split already exists and is machine-checked, so this is genuinely a move rather than a refactor. `cli/check-engine-boundary.mjs` comes with it and must stay green.

### A2. Invert namespace registration
`NAMESPACES` currently lives in `engine/ids.mjs`. A consumer project must register its own namespace, and a project with no registered namespace must still **fail loudly at load** rather than silently minting another project's ID space. More Cheese's existing namespace constant is frozen forever — its IDs must not change.

### A3. Publish the plugin contract
Three exports from a project's `index.mjs`: `hooks`, `buildWorld(cfg)`, `buildPacks(world)`. The `hooks` table (compile.arrowsOf, overallTarget, features, syntheticPop, refineMeasure, domainLint) is already documented and was corrected by building a throwaway project against the docs. Carry that discipline forward — the extraction should be validated by standing up a *third* project from the published docs alone.

### A4. State the honest boundary in the README
The ~175 bespoke validator gates and the ~45% irreducible judgement do not become framework. Say so at the top, so nobody expects a generic validator and files bugs against a promise that was never made.

### A5. Consumer wiring
More Cheese depends on the published DataGen package. Version pinning matters: a data version means "these parameters through *that* commit's generator."

### A6. CI — the gap that undercuts everything
Add a workflow that runs the suite: 37 steps, 335 gates, engine-boundary check, generator contract, fixture build. Roughly 15 minutes. This is currently the single largest gap in the workstream and it applies to both repos.

---

## 7. Workstream B — Accumulation

### B1. Give the generator a prior-state input
Generation becomes `(project, seed, release, ruleset, priorState) → newRecords`. The committed `metadata/` sync tree is the natural prior state — it is already JSON, already committed, already the emitter target.

### B2. Continuity state
An explicit as-of boundary plus the state the next cycle needs: who is active, which committee terms are open, which storylines are mid-arc, which members are in grace. Without this, cycle N+1 contradicts cycle N.

### B3. Delta emission
`emit-mjsync` gains a mode that diffs against prior state and writes only new records. Determinism plus business-key-derived `uuidFor` means prior IDs are stable by construction — but this needs a gate asserting it, not an assumption.

### B4. Additive migration emission
Each cycle's delta becomes a new versioned migration. Retire the repeatable-migration design in `DATA-VERSIONING-CHECKPOINTS-2026-07-23.md` and banner that doc as superseded, including its unresolved question about `R__` ordering — which no longer needs answering.

### B5. Accumulation vs. regeneration knobs
Full regeneration stays available (needed for scale presets, for a clean baseline rebuild, and for the fixture project). Accumulation is the default for More Cheese.

### B6. `versions.json`
Extend beyond parameters. With LLM-generated narrative in the loop, a version is no longer reproducible from `(seed, release, ruleset)` alone — authored and generated content must be recorded as committed artifacts, not as regenerable outputs.

---

## 8. Workstream C — Single delivery path

### C1. Move `platform` onto the metadata path
Remove the permanent `insert` pin. `DELIVERY.md` gets rewritten; most of its reason for existing dissolves.

**Check first, before committing to the collapse:** does pushing ~122k records through the entity SPs *itself* generate RecordChange rows? If so, every record gets an install-time audit trail stamped on top of the carefully derived history that the platform pack exists to create. This is a materially bigger issue than back-dating and should be resolved before C1 lands.

### C2. Generate the back-date script, don't write it
`emit-backdate.mjs`, reading `out/packs/` like every other emitter. It sets `__mj_CreatedAt` and `RecordChange.ChangedAt` to their narrative-true values after the inserts land.

Hand-authoring it would let it drift exactly the way the capture already drifts. Keeping it an emitter preserves the one-source-many-emitters property.

### C3. Ship it as a standing migration
"One time" is true for *authoring*, not for *shipping*. Every fresh OpenApp install replays the baseline history, so the back-date migration ships permanently and runs after MetadataSync in migration order. It only has to be designed once.

After the baseline, weekly generation means new data is written near the wall-clock time it claims, so ongoing back-dating is unnecessary.

---

## 9. Workstream D — Full BizApps stack

Reversing D3 does not by itself unblock orders. Coverage notes that orders decomposition **waits on bizapps-orders shipping Subscription and renewal-Order tables**. Given the Blue Cypress transaction migration is live, the question is sequencing, not scope.

- **D-1.** Confirm bizapps-orders' Subscription and renewal-Order baseline DDL. Until then, `morecheese_orders` remains the sanctioned stand-in.
- **D-2.** Decompose membership period rows into the real orders model once available.
- **D-3.** Add bizapps-accounting as a generation target — GL accounts, journal entries, batching — derived from the order and payment chain rather than invented alongside it.
- **D-4.** Evaluate bizapps-sales and bizapps-contracts. Sales is a natural fit for the prospect and funnel packs that already exist.
- **D-5.** Deepen existing partial coverage where it limits demos — tasks at 4 of 17 and committees at 10 of 17 are the thinnest.

---

## 10. Workstream E — Narrative & content corpus

### E1. The story bible
A versioned repo artifact. Founding through present, era by era, with organizational consequences. This is a writing task first and a generation task second, and it should be genuinely good — the whole approach depends on the story being worth exploring.

### E2. Character roster
Expand heroes from 22 toward ~100 volunteer leaders plus historical figures plus current staff. Preserve the existing mechanism: heroes are **pinned facts**, and the generator grows consistent history around them.

Existing carry-over rules hold — personas the team has named directly are permanent, because renames break demo scripts.

### E3. Content generation
Blogs, annual reports, financial statements, board minutes, journals, email history, staff pages. Ten years of it, generated in bulk for the baseline, then extended monthly.

**Consistency requirement:** content must be generated *from* the narrative bible and *checked against* the structured data. A blog post about a record-attendance conference must match the registration numbers.

### E4. Avatars and media
Cartoonish by design. If *CheeseCast* happens, episodes should reference events that actually occurred in the world.

### E5. Monthly story evolution
An AI process that advances the narrative, folds in real-world events, and records decisions. Output feeds E6.

### E6. Narrative → rules
An LLM populates DataGen ruleset modules from the narrative so the structured data reflects the story. This is rung 5 of the existing ladder — the containment already exists (gates, holdout view, lint), and the factor contract already constrains the AI to writing exactly one shape.

**Order matters and is non-negotiable:** narrative → rules → data → configuration. If the story is written after the data, it decays into decoration.

### E7. Knowledge Hub (Option B)
Read-only Dropbox account holding the "internal" association corpus, wired into Knowledge Hub — ingest, vectorization, auto-tagging, semantic search over a corpus that genuinely rewards searching.

---

## 11. Workstream F — Environment, personas, surface

- **F1.** Expand staff personas beyond the current three toward the full leadership set — CEO, VP Membership, VP Marketing, Sales Director, plus operational staff. Each needs distinct views, queries, conversation history, and notifications.
- **F2.** Revisit dashboards. Currently skipped deliberately because a wrong `UIConfigDetails` blob renders a broken page, which is worse than absence. The proposed path is sound: author one real dashboard in the UI, capture its JSON as a checked-in fixture.
- **F3.** Guided tours.
- **F4.** Public morecheese.org — staff and volunteer pages, blog, event registration widgets, prominent fiction labeling.
- **F5.** Continuously updated MJ Explorer environment for internal staff use.

---

## 12. Operating rhythm

| Cadence | What happens |
|---|---|
| **Weekly** | AI agent run: narrative advances, rules update, generator runs, delta committed, build green |
| **Monthly** | Story evolution pass with real-world events folded in; content corpus extended |
| **Monthly or quarterly** | OpenApp release cut — a tag on the continuously advancing stream |

The consequence worth stating plainly: **accumulated state must be committed on every weekly run, not only at releases.** Otherwise week N+1 has nothing to accumulate from. Releases are tags, not the unit of work.

Which is, appropriately, exactly how a real association's database behaves.

---

## 13. Open questions

1. **DataGen naming and placement.** Standalone repo is decided; the name is not. Candidates: `DataGen` (plain, descriptive), `Loom` (fits the Skip/Skyway/Forge/Sonar/Caliber family; weaving threads deterministically), `Chronicle` (names the accumulation directly). A team member has argued for promotion into core MJ — extraction to a standalone repo is deliberately the reversible choice that keeps that open.
2. **RecordChange on bulk push** (§C1) — must be answered before the delivery collapse.
3. **Ten-year history and calibration.** The current benchmark set and era model cover five years. Extending to founding requires new era definitions and a founding-growth curve that the existing benchmark sources may not cover.
4. **Content volume and cost.** Ten years of blogs, reports, and minutes across ~100 characters is a large generation job. Needs a budget and a model-tier strategy.
5. **Consistency checking between corpus and data.** Gates exist for structured data. Nothing yet checks that a generated blog post agrees with the numbers.
6. **Scale presets under accumulation.** Small/medium/large presets currently imply full regeneration. How they interact with accumulated state is unresolved.
7. **Pending profile decisions.** Four headline numbers in `ASSOCIATION-PROFILE.md` still await sign-off (renewal 87%, flagship attendance 35%, grace period 2 months, ~625 organizations), plus GAP-12 on calendar-year vs anniversary renewal cohorts.

---

## 14. Sequencing recommendation

Rough order, with the reasoning:

1. **CI for the datagen suite** (A6) — everything downstream is enforced by habit until this exists. Cheapest high-value item in the plan.
2. **Answer the RecordChange question** (C1 check) — it gates the delivery design.
3. **Extract DataGen** (A1–A5) — do it before accumulation work lands, so accumulation is built in the right repo.
4. **Accumulation** (B1–B6) — the architectural core. Everything about cadence and delivery depends on it.
5. **Single delivery path + back-date emitter** (C1–C3).
6. **Narrative bible and character roster** (E1–E2) — can run in parallel with 3–5, since it's mostly writing. Should *start* early because it's the long pole and everything creative depends on it.
7. **Content generation and Knowledge Hub** (E3–E7).
8. **Orders/accounting** (D) — paced by bizapps-orders availability.
9. **Personas, dashboards, public surface** (F).

---

## 15. What success looks like

A prospect opens More Cheese and finds an association with a decade of history, people with names and stories, a website with ten years of posts, financial reports that reconcile, committees with real arguments in their minutes, and a staff member's Explorer environment full of the saved views and half-finished analyses of someone who has been doing this job for years.

They ask a hard question. The data answers it, because there is genuinely something there to find.

And next quarter it will all have moved forward, because the world kept running.

---

*The International Cheese Federation is entirely fictitious. All people, organizations, events, financial figures, and content within More Cheese are generated and do not represent real entities. Avatars are intentionally stylized and staff addresses use a reserved non-deliverable domain.*
