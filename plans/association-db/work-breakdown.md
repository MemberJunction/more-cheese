# demo-morecheese — Work Breakdown

The full plan (`v2-plan.md`) is 1,600 lines. This is the working summary: plain language, but with enough detail to act on each item without re-reading the spec.

---

## What we're building

A fake cheese association — **"MoreCheese"** (the International Cheese Federation) — packaged as **one installable MJ Open App** that demonstrates the entire MJ product suite, and runs live as a real website (`morecheese.org`) by **July 31**.

It ships as **two packages**:
- `@memberjunction/demo-morecheese` — the reusable app: the cheese-specific database tables, AI config, dashboards, onboarding. No fake data.
- `@memberjunction/demo-morecheese-data` — the optional companion: all the fake people, orders, conversations, demo personas, sample PDFs.

Both live in a **new repo**, `demo-morecheese`, separate from the main MJ repo. (Naming rule going forward: `bizapps-*` = real products we sell; `demo-*` = demo properties.)

## Why it's clever (the whole point)

We do NOT build members, orders, payments, accounting, committees, etc. from scratch. We **compose 10 apps we already have** as dependencies and add only the genuinely cheese-specific tables. The composition *is* the demo — it shows prospects "here's what you build from the ecosystem vs. what's truly custom."

The 10 composed apps:
| App | What it provides to the demo |
|---|---|
| biz-apps-common | People, organizations, employment, contact info (the identity layer) |
| tasks | Project/task tracking across committees, events, legislative work |
| committees | Charters, terms, meetings, member assignments |
| issues | Member-service tickets, helpdesk, action items |
| sonar | Engagement scoring — feeds the predictive models |
| secure-messaging | Member/staff/board messaging |
| orders | Event registrations, course enrollments, product purchases, dues |
| payments | Stripe/Chase/Authorize.net abstraction |
| subscriptions | Memberships modeled as recurring subscriptions |
| accounting | GL, chart of accounts, journal entries behind every payment |

What stays **custom** to the cheese demo (8 schemas): Members, Learning/Certifications, Events, Forums, Awards/Competitions, Legislative, Marketing, Resources. These are deliberately split across multiple schemas (not one) to demonstrate MJ unifying data across a realistic, messy customer environment.

## Is it hard?

**Not intellectually — but only if the pieces are ready.** Most of the work is plugging apps together and loading data. The whole project hinges on one question: **are the apps we depend on actually ready?** "Ready" here means *their database tables are frozen and generate clean code* — NOT that every feature works (see "the schema-only rule" below).

### The schema-only rule (important)
For the apps we depend on, we only need:
- ✅ Database tables created, stable, and **frozen** (won't change under us)
- ✅ CodeGen produces clean entity classes from them
- ✅ Published at a pinned version

We do NOT need:
- ❌ Their working business logic (live order fulfillment, real payment charging, GL close automation)
- ❌ Their dashboards/screens

Why this is enough: the demo is **pre-baked**. We load finished data (an already-fulfilled order, an already-posted journal entry) as static metadata. We bake the *results*, not the *process*. And CodeGen gives us the full typed entity layer, search, and AI surface the moment the tables exist — no business logic has to run.

---

## The work, in order

### Critical path (must be sequential)

**1. Set up the foundation** — ✅ can start now
- Create the `demo-morecheese` repo with the workspace layout (the two packages + the website code + the Explorer config).
- Write the `openapp.json` manifests declaring the 10 app dependencies at pinned versions.
- Confirm the installer can resolve the dependency chain and run the install steps end to end.

**2. Map the old demo → new** — ✅ can start now
- Produce `V1_TO_V2_ENTITY_MAPPING.md`: every one of v1's 58 tables → where it goes in v2 (a dependency app, a custom cheese schema, or deprecated).
- Nail down the confusing date fields once and for all: `EndDate` = current paid period ends; `RenewalDate` = last/next renewal action. (v1 got this wrong and broke reports.)
- Get this reviewed before writing any tables.

**3. Build the cheese tables** — ⛔ blocked until dependency schemas freeze
- 8 custom schemas (Members, Learning, Events, Forums, Awards, Legislative, Marketing, Resources).
- Member becomes a *profile* that links to a Person in biz-apps-common, not a standalone record.
- Add cross-schema indexes so unified queries are fast, plus table/column documentation.

**4. Generate the fake data** — ⛔ blocked — **and this is the hardest part**
- Build a deterministic generator that produces realistic, interlinked data for all 10 apps + the cheese schemas, as JSON loaded via mj-sync.
- **Scale presets:** small (~500 people), medium (~2,500, default), large (~15,000 — for big-association credibility).
- **Consistency rules enforced at generation:** e.g. an "Active" member can't have an expired end date; "Canceled" must have a cancellation date; every payment must have a matching accounting entry. (This is the v1 bug class — easy to reintroduce.)
- An install-time **integrity check** fails loudly if any of these rules break.

**5. Run CodeGen** — automatic
- Generates typed entity classes, GraphQL, and forms from the tables. Verify it compiles and forms render.

**6. Turn on the AI** — ⛔ needs the search engine (SVS) confirmed
- Author entity-document templates (turn records into LLM-readable markdown) for the high-value entities.
- **Pre-compute the embeddings at release time** and ship them as data — so install does NOT make live OpenAI calls and needs no external vector database.
- Load them into MJ's Search Vector Service (SVS) at install. Wire up unified search (SQL + vector + documents).

**7. Load the showcase content** — the heaviest content phase
- **~50–100 hand-authored "hero" personas** (e.g. Elena Rodriguez) with stable names + storylines that never change between releases, so demo scripts stay reliable. The generator builds the rest of the population *around* them.
- **7 predictive models** (all fed by Sonar engagement scores): churn, renewal likelihood, event attendance forecast, lifetime value, engagement, cert completion, event ROI.
- Prebuilt Skip dashboards + research reports, each with its **full chat history** visible so users see *how* it was made.
- Plus saved lists, views, queries, scheduled actions, workspaces, custom forms, and the SaaS integrations (Skip, Izzy, Betty, rasa.io).

**8. Go live** — production deployment
- `morecheese.org` — the public website (with Betty as an on-page voice agent answering from live data).
- `app.morecheese.org` — the team login (standard MJ Explorer, same backend).
- Both deploy via the same `mj install`. Then full smoke test + security review + launch.

### Parallel tracks (start anytime — don't wait on the data work)
- **Website redesign** (`morecheese.org`) — a starting mockup already exists in `morecheese-site-mockup/`.
- **Default semantic search** on conversations & artifacts (an MJ-core feature this surfaces).
- **Sage helper tools** — audit every dashboard/form and add context-aware agent tools.

---

## What can start now vs. what's blocked

| ✅ Start immediately | ⛔ Blocked until dependency schemas freeze |
|---|---|
| Create repo + manifests (step 1) | Cheese tables that link into the apps (step 3) |
| Audit whether the SVS search engine exists or needs building | The data generator (step 4) |
| Old → new mapping doc (step 2) | CodeGen on the full schema (step 5) |
| Start writing hero personas (step 7 — long lead time) | Embeddings → SVS (step 6, also needs SVS confirmed) |
| Website, search, Sage-tools tracks (parallel) | |
| Resolve the open questions below | |

---

## The 4 things that could bite us

1. **The data generator (step 4).** Thousands of records that all line up — dates, statuses, payments-to-ledger — is a real engineering problem, not assembly. The v1 "active member with an expired date" bug is exactly this. Build the consistency rules in from the start.
2. **The seams between apps (steps 3–4).** Where one app's tables and another's assumptions don't line up is where time vanishes. The cross-app integrity check is the smoke test that proves the composition actually works.
3. **The search engine might be a build, not a config (step 6).** Pre-computed embeddings need MJ's in-DB SVS provider to exist on both SQL Server and Postgres. SQL Server may need extra work. Confirm in week 1.
4. **Hand-written content can't be rushed (step 7).** Hero personas + curated chats are quality-gated and block the release. Start in week 1.

The shape of the risk: not one hard problem — a **big surface of medium-difficulty integration work where risk compounds at the seams**, under a tight deadline.

---

## Rough timeline to July 31

> Skeleton — firm up once dependency dates are confirmed Monday. Assumes the schema-only rule holds and the search engine already exists.

- **Week 1** — Resolve blockers. Create repo + manifests. Audit the search engine. Start the mapping doc + hero personas. **Get a date for when each dependency app's tables freeze.**
- **Week 2** — Mapping signed off. All cheese tables written. Generator scaffolded (scale presets + hero ingestion). Parallel tracks underway.
- **Week 3** — Full fake data for all 10 apps + cheese schemas; integrity checks green. CodeGen run; entities compile.
- **Week 4** — Entity docs + embeddings → SVS; unified search working. Predictive models, demo chats, lists/views/queries, SaaS integrations. Onboarding. Website + voice progressing.
- **Week 5 (→ July 31)** — Hosting + prod deploy. Full smoke test (visitor → Betty → signup → portal → order → payment). Security review. Docs. Launch + tag the first release.

---

## Open questions to resolve (blocking ones first)

These come from the spec's open-question list (§13.2). The first five block early work:
- **Are the 5 newer apps ready?** issues, sonar, secure-messaging, orders, accounting — production-ready / first-cut / in-dev? (OQ-11)
- **Repo governance:** depend on stable npm releases or live MJ main-branch builds? Who reviews/merges? (OQ-16)
- **Final package names** — `demo-morecheese` / `-data` as proposed? (OQ-3)
- **Search engine:** is the in-DB SVS provider ready on both SQL Server and Postgres, or a build? (OQ-1, OQ-2)
- **Website designer** for the redesign — who, and when can they start? (OQ-13)

Park with a due date: pricing tiers (OQ-4), v1 retirement (OQ-5), who authors the demo chats (OQ-7), release cadence (OQ-8), predictive model count (OQ-9), release ownership (OQ-12), public-site data lifecycle once it's real prod (OQ-14), Betty cost limits on the public site (OQ-15).

---

## If we run out of time, cut in this order
1. Polish on the public website
2. Some of the 7 predictive models
3. Some of the extra dashboards/lists/views

**Never cut:** a working `mj install` + the app-composition story + a handful of solid hero-persona demos. That's the irreducible core.
