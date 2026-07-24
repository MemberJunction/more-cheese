# Non-bizapp integrations — what they mean for MoreCheese, precisely

**Date:** 2026-07-22 · **Revised:** 2026-07-23 · **Author:** datagen workstream
**Scope of this doc:** everything *except* the bizapps. Bizapp integration (schemas, data
through their views, install, their UIs) is defined and tracked elsewhere
(`datagen/BIZAPPS-COVERAGE.md`, `datagen/INTEGRATION-RUNBOOK.md`) and is essentially done.
This doc is about the layer above: **the Blue Cypress SaaS products and MJ core's own
intelligence features consuming MoreCheese data.**

> **SCOPE RULING (2026-07-23): only Skip (§1) and Betty (§2) are in scope.**
> Everything else in this doc — Predictive Studio, Knowledge Hub, Record Set Processing,
> rasa.io, Izzy, the prose-corpus question — is **descoped** for MoreCheese. Those sections
> are retained below as reference (the analysis is done and correct), not as work items.

---

## §0 — What "integration" means in MJ, and then in MoreCheese (read this first)

Traditional integration is point-to-point: N systems × M connections, ETL jobs, webhooks,
sync pipelines. **MJ's architecture deliberately replaces that with a hub: the shared
metadata graph.** Nothing in MJ integrates *with* anything else — everything plugs *into*
one database + entity-metadata layer and gets everything else for free. Integration in MJ
is therefore **participation in that graph**, at four depths:

1. **Tables in the database** — the data physically coexists.
2. **Entities registered in metadata** (`__mj.Entity` + generated views/APIs) — the magic
   moment: once registered, every metadata-driven consumer sees the data — Explorer,
   RunView, dashboards, search, agents, Skip — none of which know "MoreCheese" exists.
3. **Linked into the shared graph** — FKs into the common spine (Person, Organization), so
   one identity threads across every app's data.
4. **Semantics supplied** — descriptions, value lists, relationships — so *machine*
   consumers (LLMs, Skip agents, Predictive Studio feature assembly) understand what
   columns MEAN, not just that they exist.

**The operational test** that resolves every fuzzy integration conversation:

> **Does the product read MJ metadata? → integration is CONFIGURATION (keys, org IDs,
> pointing it at the instance). Does it not? → integration is a CONNECTOR, and that
> connector is the product team's asset to build/own — never MoreCheese's.**

Metadata-native (config-only): Skip, Predictive Studio, Knowledge Hub, Sonar, MJ agents/
search/dashboards. Outside the fabric (connector question, owned by their teams): Betty,
rasa.io, Izzy.

**And what MoreCheese adds on top** — the workstream's actual thesis: being *in* the graph
makes data **visible**; it doesn't make it **credible**. A fully-registered dataset can
still be demo garbage (flat distributions, no causality, nothing for a model to find). So:

> **MoreCheese integration = full citizenship in the metadata graph (depths 1–4 — DONE)
> + engineered signal in the data so everything consuming the graph produces TRUE results
> (done, but unproven per product — hence the proof runs below).**

This is also why the MJ-native ruling (2026-07-14 — data born in MJ, no external
ingestion) shapes everything: we never build pipes; we make the data worth pointing things
at. Every remaining "integration task" in this doc reduces to one of three shapes:
**a config/keys exercise** (metadata-native products), **a question to a product team**
(external products), or **a proof run** (witnessing the engineered signal perform).

---

## 1. Skip — the AI data analyst

**What integration means here:** Skip converses over MJ entities/queries (via MJAPI — the
`ASK_SKIP_*` wiring, Skip-Client-Open-App). Integration = Skip answering real analytical
questions about the federation and being *right*, because the answers are discoverably in
the data.

**What the data already provides:** the whole causal engine. "Who looks like churn risk
and why?" has a real, multi-signal answer (Bob: NPS 7→7→5, "not returning," declining
registrations, an open billing dispute, an unanswered secure-message thread). Engagement,
revenue, and satisfaction all ride one hidden dial, so correlations Skip surfaces are
genuine, not coincidental.

**Evidence standard (binary):** a captured Skip conversation transcript where it (a)
identifies at-risk members and names the right ones, (b) explains *why* using signals we
engineered, (c) aggregates correctly (renewal rates by year/segment match our gates).

**Gaps / questions:**
- Team ruling: "not really any extra work" — agreed on data. The open item is purely
  the **proof run** (nobody has asked Skip these questions yet) and whether we should
  author a few **saved queries / data contexts** to make Skip's entry points demo-smooth.
- Which MJAPI instance is Skip pointed at for the demo (the environment-of-record question)?

**Readiness: 🟢 data ready · ⬜ proof run not executed**

---

## 2. Betty — the knowledge assistant

**What integration means here:** Betty answers members' questions from association
knowledge. Team ruling (2026-07-22): Betty is already built and requires **zero extra
work** from MoreCheese.

**The one thing to pin down (Q — the only open Betty question):** what does Betty *ingest*
in this demo?
- If Betty answers over **entity data / configured content Betty-side** → truly zero work;
  close the question and write that here.
- If Betty needs **documents** (handbooks, FAQs, policies) → the prose-corpus question
  returns (see §7) — MoreCheese generates rows, not prose, and no corpus exists anywhere.

**Evidence standard (binary):** a captured Betty session answering member-plausible
questions in the demo environment.

**Readiness: 🟢 per ruling (zero work) · ⚠ contingent on the ingestion answer**

---

## 3. Predictive Studio — train retention models on the members *(DESCOPED 2026-07-23)*

**What integration means here:** MJ core's train-models-on-your-data feature (member
retention/lapse scoring) pointed at MoreCheese members. This is the **deepest engineered
fit in the entire dataset**: the generator's central design goal was honest trainability —
hidden engagement dial, causal arrows with recoverable sign AND size, realistic fog
(proxies, omitted variables), and explicit trainability gates (rank-ordering lift).

**What the data already provides:** 2,500 members with renewal histories, behavioral
features (registrations, enrollments, committee service, advocacy, certs, payments, NPS),
and ground truth the validator already trains against. A renewal-risk model *should*
converge, calibrate, and rank Bob (declining, high-value) above Victor (auto-renewing
ghost) — that exact contrast is authored into the world.

**Evidence standard (binary):** a Predictive Studio training run on the demo DB — feature
assembly over our entities, holdout metrics recorded, and a scored member list whose top
decile contains the engineered at-risk personas. Screenshot/metrics captured in `plans/`.

**Gaps / questions:**
- Nobody has run it. This is the highest-value unexecuted proof in the workstream — it
  converts our core marketing claim ("a model trained on this data works") from a gated
  prediction into a witnessed fact.
- Point-in-time correctness: Predictive Studio's as-of feature assembly should be fed
  renewal decisions with pre-decision features only — our data supports this (periods,
  dated events), but the feature-definition session hasn't happened. Who defines the
  feature set, and who runs it?

**Readiness: 🟢 data purpose-built · ⬜ never executed (highest-leverage proof to run)**

---

## 4. Knowledge Hub — two very different halves *(DESCOPED 2026-07-23)*

**What integration means here:** MJ core's AI/RAG + classification suite. Critically, KH
splits into halves with opposite readiness:

**4a. The row-based half — ready today.**
- **Duplicates tab / dedup:** our `DataQualityLabel` answer sheet (25 duplicate-person
  labels incl. injected dup records, stale employers, typo emails) exists *specifically*
  so dedup can be demonstrated AND graded. Evidence standard: KH (or a Record Set
  Processing cleanup — §5) finds the dups, and the result is scored against the labels.
- **Vectors/clustering over entity records** (EntityDocument → per-record text snapshots):
  configurable over existing entities; embeddings must be computed live by the pipeline
  (never pre-generated — they're model-specific).

**4b. The prose half — blocked on the corpus question.**
Classify, semantic search, RAG all operate on real text (`ContentItem.Text`). MoreCheese
has no corpus, and lorem-ipsum would classify/cluster meaninglessly. Options from the
2026-07-16 one-pager (`KNOWLEDGE-HUB-ONE-PAGER-2026-07-16.md`):
- **Option A (cheap):** fatten 3–4 existing prose fields (issue bodies, event/course
  descriptions) so KH's Entity source has real text — config-only demo after that.
- **Option B (richer):** generate a 100–300-doc corpus (handbook chapters, guidance,
  minutes, FAQs) — a new asset class for the generator (text-as-checked-in-data, like the
  name banks).

**Readiness: 4a 🟢 ready (proof run pending) · 4b 🔴 blocked on Option A/B decision (§7)**

---

## 5. Record Set Processing / data-quality operations *(DESCOPED 2026-07-23)*

**What integration means here:** MJ's bulk-operations substrate (Record Processes) running
a *graded* cleanup demo: a process that fixes stale employers or merges duplicates, scored
against `DataQualityLabel` — "the demo where the platform cleans data and we can prove it
got the right answers," which no hand-waved demo dataset can do.

**Evidence standard (binary):** one Record Process executed on the demo DB with a
before/after diff scored against the answer sheet (e.g. 10/11 stale employers corrected,
0 false positives).

**Readiness: 🟢 answer sheet purpose-built · ⬜ no process authored/run yet**

---

## 6. rasa.io — half-built already *(DESCOPED 2026-07-23; analysis retained)*

Earlier drafts said "no visible wiring" — **wrong on the rasa side.** Findings from the
local rasa workspace checkout:

**What integration means for rasa:** MJ becomes the **26th system in rasa's existing
`integrations-runner` connector fleet** — the exact seat iMIS/Impexium (the other AMSes)
occupy. Bidirectional by design:
- **MJ → rasa:** members → contacts/subscriptions (Email, First/Last, Status, MemberID as
  external_id) via rasa's standard 11-method connector contract.
- **rasa → MJ (the interesting half):** rasa's reconcile loop pushes **engagement
  analytics back to the source system** — last_open, last_click, unique opens/clicks,
  deliveries, topics, LLM-generated interest summaries, plus subscription/unsubscribe
  status. That is precisely the member-engagement stream MoreCheese doesn't generate —
  arriving as real data instead, consumable by Sonar and Predictive Studio as retention
  signal.

**What already exists on rasa's side:** campaigns backend has MJ config endpoints
(`campaigns/apps/backend/src/system/memberjunction/`) AND an MJ GraphQL client wrapper,
and spark_streaming has an MJ embedding loader. **What's missing:** the
`integrations-runner` connector itself — est. 300–400 lines of Python against the standard
`ISubscriberSynchronizerTarget` contract (Mailchimp connector is the template), plus DB
registration rows. All of it lives in rasa's repo; **MoreCheese contributes zero code**.

**MoreCheese-side items (small):**
1. ✅ Email realism — emails now vary across org-domain work addresses and invented
   consumer providers, all on the RFC-2606-reserved `.example` TLD (never deliverable —
   a rasa demo still requires test/suppression mode, by design).
2. ⬜ A landing place for the pushed-back analytics (e.g. `LastEmailOpenDate`/
   `LastEmailClickDate` on MemberProfile) — a small additive migration + CodeGen
   re-capture, only worth doing when a rasa connector actually exists to fill it.

**Status: deprioritized per ruling, but the cost picture changed** — rasa integration is
one connector in their repo away, not a greenfield project.

- **Izzy:** data shape unknown to this workstream. **Deprioritized; needs a definition
  from the Izzy team before anything can be said.**

---

## 7. The one shared asset the AI products keep pointing at: a prose corpus *(DESCOPED — revives only if Betty's ingestion answer is "documents")*

Betty (if document-fed), Knowledge Hub's classify/search/RAG, and eventually Caliber's
conversations all consume **generated text** — the single asset class MoreCheese doesn't
produce. One well-built corpus (KH Option B) would serve all of them at once; Option A
(fatten existing fields) unlocks only the entity-sourced subset.

**This is a strategic build-or-don't decision, not a July-31 item** — parked unless Betty's
ingestion answer (§2) forces it.

---

## Summary matrix

| Integration | In scope? | Data readiness | Proof run executed? | Blocking question |
|---|---|---|---|---|
| Skip | ✅ | 🟢 purpose-fit | ⬜ | env-of-record; saved queries? |
| Betty | ✅ | 🟢 per ruling | ⬜ | what does it ingest? |
| Predictive Studio | ❌ descoped | 🟢 purpose-built | — | — |
| KH — dedup/vectors | ❌ descoped | 🟢 answer sheet ready | — | — |
| KH — prose/RAG | ❌ descoped | 🔴 no corpus | — | — |
| Record Processes (graded cleanup) | ❌ descoped | 🟢 | — | — |
| rasa.io | ❌ descoped | 🟡 members yes, engagement stream no | — | — |
| Izzy | ❌ descoped | ❓ | — | — |

Descoped rows lose nothing permanent: the data readiness they'd rely on (trainability
gates, DataQualityLabel answer sheet, email realism) ships regardless, so any of them can
be revived later as a config/proof session with zero rework.

## Remaining work (binary, per the 2026-07-23 ruling)

1. **Skip proof run** — a captured transcript against the demo DB meeting §1's evidence
   standard (right members, right reasons, right aggregates). Optionally author 2–3 saved
   queries/data contexts for demo smoothness. Pin the env-of-record.
2. **Betty ingestion question** — one ask to the Betty team: entity data / Betty-side
   content (→ zero work, close it) or documents (→ decision needed, see §7). Then a
   captured Betty session as evidence.

That is the entire non-bizapp integration surface. Done = both captures exist in
`plans/association-db/proofs/`.
