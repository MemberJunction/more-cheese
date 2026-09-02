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
| bizapps-orders | **In Transition** — `morecheese_orders` stand-in being retired; real `bizapps-orders` schema is solid in M5 and targeted directly |
| bizapps-accounting | **Targeted** — Solid in M5; GL accounts, JEs, and batching wired directly from orders |

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
| **D1** | **Loom is created as its own repo** (`MemberJunction/loom`) in the MemberJunction org. Early in the project, we take a fresh look at the architecture: while keeping the good bones (causal dials, factor contracts, deterministic seeds, acyclic pipeline), gut and rebuild it to be completely metadata- and configuration-based, vastly more flexible, and smarter about its inputs. More Cheese becomes a consumer; `fixture` becomes the second. | new |
| **D2** | **Accumulation is first-class in the structured data layer.** Generated data is never thrown away. Each run reads committed prior state and mints only what is new. | Supersedes `DATA-VERSIONING-CHECKPOINTS-2026-07-23.md` Option A (repeatable wipe-and-reseed migrations) |
| **D3** | **Full BizApps stack is in scope immediately**, specifically including bizapps-orders and bizapps-accounting. Both apps are solid in the M5 workspace; stand-ins are retired. | Reverses the 2026-07-22 workstream ruling eliminating accounting and real orders |
| **D4** | **Knowledge Hub takes Option B** — a generated document corpus, not fattened prose fields. | Reverses the standing Option A recommendation in `KNOWLEDGE-HUB-ONE-PAGER-2026-07-16.md` |
| **D5** | **Single delivery path & simple one-time baseline fix.** `platform` moves onto the metadata path. For the initial 5-year baseline history, back-dating `__mj_CreatedAt` and `RecordChange.ChangedAt` is handled by emitting a simple, one-time SQL script that fixes dates—no big deal, no architectural change needed. Ongoing accumulation writes near wall-clock time so back-dating is not needed ongoing. | Supersedes `DELIVERY.md`'s permanent `platform: 'insert'` pin |
| **D6** | **Weekly generator runs, monthly/quarterly OpenApp releases.** State is committed weekly; releases are tags on a continuously advancing stream. | new — also resolves the aging problem in §2.7 |
| **D7** | **Narrative is the canonical artifact**, versioned in the repo, evolved monthly, and generated *before* the data each cycle. | new |
| **D8** | **History extends back ~10 years to founding**, through the pandemic, into the AI era. | Extends the current five-year window |
| **D9** | **In-app operational artifacts authored in UI, captured via `mj sync pull`.** Dashboards, persona conversation histories, saved views, and lists are created natively in the running application by developers/demo-authors. Running `mj sync pull` extracts those records cleanly into `/metadata/**`, which commit to the repo and become standard versioned metadata migrations for releases. Zero synthetic JSON guesswork. | new |
| **D10** | **Weekly simulation agent skill.** The weekly accumulation cycle is driven by a specialized Agent Skill equipped with explicit rules, CLI/MJ tool bindings, deterministic/LLM validation gates, and Playwright browser inspection to visually verify the system before committing. | new |

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

**The In-App Authoring & Metadata Workflow:**
In-app artifacts are **not fabricated as synthetic JSON blobs in code**. Instead, demo authors and developers log into the running application directly, build genuine dashboards in MJExplorer, have real conversations with agents, save views, and configure lists. 

Then, running **`mj sync pull`** cleanly extracts those records from the database into `/metadata/**`. They are committed to git as standard metadata files, which CodeGen and the Open App packaging pipeline automatically compile into versioned migrations (`V*__Metadata_Sync.sql`) for each release. This makes operational residue visual, human-verified, and zero-guesswork.

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

## 6. Workstream A — Build Loom (Rebuilding the Generator Engine)

**Goal:** a standalone repository in the MemberJunction org (`MemberJunction/loom`), domain-blind, with More Cheese and fixture as consumers.

### A1. Re-architecting Loom: Flexible, Metadata-Driven, Smarter Inputs
Rather than doing a naive lift-and-shift of the legacy datagen code, we take a fresh look at the architecture early on:
- **Gut and rebuild the generation core** to be vastly more flexible and completely metadata- and configuration-driven.
- **Smarter inputs:** Loom accepts rich narrative context, prior state, and declarative metadata configs rather than rigid, hardcoded procedural routines.
- **Keep the proven bones:** preserve the causal dials ($\theta, \phi$), factor contracts (`{ effect, feature, evidence }`), deterministic identity (`uuidFor`), and acyclic pipeline structure.
- Move `datagen/projects/fixture/` into Loom as the universal CI validation project. `projects/morecheese/` stays with More Cheese as the flagship consumer.

### A2. Invert namespace registration
`NAMESPACES` moves to consumer configuration. A consumer project registers its own namespace, and a project with no registered namespace fails loudly at load. More Cheese's existing namespace constant is frozen forever to preserve historical ID stability.

### A3. Plugin & consumer contract
Loom exposes clean CLI and library APIs (`loom build`, `loom accumulate`, `loom validate`). A consumer project provides its narrative bible, ruleset, and entity bindings, while Loom handles causal distribution, dependency graph resolution, delta calculations, and metadata emission.

### A4. Honest framework boundary
The ~175 bespoke validator gates and domain-specific rules stay in More Cheese. Loom owns the causal engine, accumulation logic, and generic relational verification.

### A5. CI suite for Loom & More Cheese
A mandatory GitHub Actions workflow running the full suite: pipeline stages, validation gates, boundary checks, and fixture builds. This prevents the habit-only enforcement of the past.

---

## 7. Workstream B — Accumulation

### B1. Prior-state input
Generation in Loom becomes `(project, seed, release, ruleset, priorState) → newRecords`. The committed `metadata/` sync tree is the natural prior state — it is already JSON, already committed, and already the emitter target.

### B2. Continuity state
An explicit as-of boundary plus the state the next cycle needs: who is active, which committee terms are open, which storylines are mid-arc, which members are in grace. Without this, cycle N+1 contradicts cycle N.

### B3. Delta emission
Loom diffs generated records against prior state and writes only what is new. Determinism plus business-key-derived `uuidFor` guarantees prior IDs are stable by construction.

### B4. Additive migration emission
Each cycle's delta becomes a new versioned Skyway migration (`spCreate`). Retire the repeatable-migration wipe design in `DATA-VERSIONING-CHECKPOINTS-2026-07-23.md`.

### B5. Accumulation vs. regeneration knobs
Full regeneration stays available (for scale presets, clean baseline rebuilds, and the fixture project). Accumulation is the default for More Cheese.

### B6. Version tracking
With LLM-generated narrative in the loop, version state includes the narrative bible commit hash and seed parameters.

---

## 8. Workstream C — Single Delivery Path & Baseline Initialization

### C1. Move `platform` onto the metadata path
Remove the permanent `insert` pin. Deliver all records through standard Open App metadata sync.

### C2. Simple one-time baseline date fix script
For the initial 5-year baseline history, created and updated dates (`__mj_CreatedAt`, `RecordChange.ChangedAt`) are corrected using a **simple, one-time emitted SQL script** that fixes the dates after initial baseline load. This is a straightforward utility script—no complex architectural change required.

After the baseline, weekly generation writes near wall-clock time, completely eliminating the need for ongoing back-dating.

---

## 9. Workstream D — Full BizApps Stack (Orders & Accounting Solid)

BizApps Orders and Accounting are solid now in the M5 workspace. Stand-in tables (`morecheese_orders`) are retired in favor of direct generation into the real Open App schemas.

- **D-1.** Target real `bizapps-orders` schema directly: Product catalog, price books, orders, payments, subscriptions, and dues renewals.
- **D-2.** Wire `bizapps-accounting` directly from the order and payment stream: automated balanced single-company Journal Entries per order line, ratable deferred revenue recognition schedules, role-based GL account resolution, and ERP batching.
- **D-3.** Connect `bizapps-sales` (deals, pipelines, Closed Won orchestration) and `bizapps-contracts` (MSAs, negotiated terms) to complete the revenue loop.
- **D-4.** Deepen existing partial coverage in `bizapps-tasks` and `bizapps-committees` to support full demo scenarios.

---

## 10. Workstream E — Narrative & Content Corpus

### E1. The story bible
A versioned repo artifact. Founding through present, era by era, with organizational consequences.

### E2. Character roster
Expand heroes from 22 toward ~100 volunteer leaders plus historical figures plus current staff.

### E3. Content generation
Blogs, annual reports, financial statements, board minutes, journals, email history, staff pages. Ten years of it, generated in bulk for the baseline, then extended monthly.

### E4. Avatars and media
Cartoonish by design.

### E5. Monthly story evolution
An AI process that advances the narrative, folds in real-world events, and records decisions. Output feeds E6.

### E6. Narrative → rules
An LLM populates Loom configuration/rules from the narrative so structured data reflects the story. Order is strictly: narrative → rules → data → configuration.

### E7. Knowledge Hub (Option B)
Read-only Dropbox account holding the "internal" association corpus, wired into Knowledge Hub — ingest, vectorization, auto-tagging, semantic search.

---

## 11. Workstream F — Environment, Personas, Surface

- **F1.** Expand staff personas toward the full leadership set — CEO, VP Membership, VP Marketing, Sales Director, plus operational staff.
- **F2.** Author real dashboards and views in the UI, then capture them via `mj sync pull` into `/metadata/**`.
- **F3.** Guided tours.
- **F4.** Public morecheese.org — staff and volunteer pages, blog, event registration widgets, prominent fiction labeling.
- **F5.** Continuously updated MJ Explorer environment for internal staff use.

---

## 12. Operating Rhythm & The Weekly Simulation Agent Skill

| Cadence | What happens |
|---|---|
| **Weekly** | **Weekly Simulation Agent Skill run**: narrative advances, rules update, Loom accumulates delta, validation gates run, Playwright UI check, delta committed |
| **Monthly** | Story evolution pass with real-world events folded in; content corpus extended |
| **Monthly or quarterly** | OpenApp release cut — a tag on the continuously advancing stream |

### 12.1 The Weekly Simulation Agent Skill
A dedicated, autonomous Agent Skill drives the weekly simulation cycle:
1. **Rule Engine & Tool Orchestration:** Knows the precise toolchain (narrative generation, Loom CLI, `mj sync`, testing suite, Playwright).
2. **Deterministic & Statistical Gates:** Validates referential closure, CHECK constraint conformance, and statistical tolerance bands.
3. **LLM-Bound Quality Checks:** Verifies qualitative coherence between story updates and generated data deltas.
4. **End-to-End Browser Verification (Playwright):** Launches the local stack (MJAPI + MJExplorer) and runs Playwright browser scripts to "see" and interact with the application:
   - Verifies dashboard rendering and chart components.
   - Pokes around persona views (CEO, VP Membership) to ensure no runtime GraphQL or rendering errors.
   - Confirms that recent data and activities appear correctly in grids and feeds.
5. **Clean Git Delta Commit:** Once all automated and visual gates are green, commits the weekly accumulated state.

---

## 13. Open Questions (Updated)

1. ~~**DataGen naming and placement.**~~ **Resolved:** Standalone repo named **`Loom`** (`MemberJunction/loom`).
2. ~~**RecordChange on bulk push.**~~ **Resolved:** One-time emitted SQL script handles baseline dates; ongoing accumulation runs at wall-clock time.
3. ~~**Orders & Accounting readiness.**~~ **Resolved:** Both apps are solid in M5 and targeted directly.
4. **Ten-year history and calibration.** Extending back to founding requires new era definitions and a founding-growth curve.
5. **Content volume and cost.** Ten years of blogs, reports, and minutes across ~100 characters needs a budget and model-tier strategy.
6. **Consistency checking between corpus and data.** Templated fact injection from structured rows into narrative prompts to guarantee numeric agreement.
7. **Scale presets under accumulation.** Resolving how small/medium/large presets interact with accumulated state.

---

## 14. Sequencing Recommendation

1. **CI for test suite** (A5) — establish automated gate protection immediately.
2. **Create Loom repo & rebuild engine** (A1–A4) — gut and rebuild Loom to be metadata-driven, flexible, and input-smart.
3. **Target Orders & Accounting in Loom** (D1–D2) — wire direct BizApps generation now that schemas are solid.
4. **Accumulation engine in Loom** (B1–B6) — core stateful delta generation.
5. **Weekly Simulation Agent Skill** (§12.1) — automated weekly run with Playwright visual testing.
6. **One-time baseline date fix script** (C2) — initial 5-year date alignment.
7. **Narrative bible and character roster** (E1–E2) — authoring the 10-year history and persona arcs.
8. **In-app artifacts via UI + `mj sync pull`** (F2) — author dashboards/conversations in Explorer and pull to `/metadata/**`.
9. **Content generation and Knowledge Hub** (E3–E7).
10. **Public website & guided tours** (F3–F4).

---

## 15. What success looks like

A prospect opens More Cheese and finds an association with a decade of history, people with names and stories, a website with ten years of posts, financial reports that reconcile, committees with real arguments in their minutes, and a staff member's Explorer environment full of the saved views and half-finished analyses of someone who has been doing this job for years.

They ask a hard question. The data answers it, because there is genuinely something there to find.

And next quarter it will all have moved forward, because the world kept running.

---

*The International Cheese Federation is entirely fictitious. All people, organizations, events, financial figures, and content within More Cheese are generated and do not represent real entities. Avatars are intentionally stylized and staff addresses use a reserved non-deliverable domain.*
