# Knowledge Hub × MoreCheese — one-pager (research findings, 2026-07-16)

Meeting feedback asked about "Knowledge hub / data that is also working with MJ features."
Nobody was sure what it consumes, so we researched it before building anything. Findings
below; decision ask at the bottom.

## What Knowledge Hub is

A **core MJ Explorer application** (ships in the MemberJunction repo, not a bizapp): the
AI/RAG + content-classification suite. App definition:
`metadata/applications/.knowledge-hub-application.json` — "Unified knowledge management:
semantic search, vector management, duplicate detection, content classification, and AI
assistant." Tabs: Classify (default), Tags, Visualize, Duplicates, Feature Pipelines,
Analytics, Vectors, Configuration. Engines live in `packages/AI/Knowledge/` (TagEngine,
Pipeline) plus content-autotagging, ClusteringEngine, SearchEngine.

## What it consumes

Two pipelines, both schema'd in MJ core migrations (v5.24 / v5.38 / v5.40):

1. **Content ingestion / Classify**: `ContentSource` (drivers: **Entity**, Cloud Storage,
   Local File System, RSS, Website) → `ContentItem` — the atomic unit, whose **`Text`
   column holds the actual prose**. LLM tagging produces `ContentItemTag` → resolved into
   a formal `Tag` taxonomy (hierarchical, with synonyms, co-occurrence, audit).
   `ContentItemDuplicate` backs the Duplicates tab.
2. **Vectors / search**: `EntityDocument` (a render template per entity) →
   `EntityRecordDocument` (per-record text snapshot + embedding) → clustering, semantic
   search, Search Scopes/RAG+ with `MJSearchExecutionLog` driving Analytics.

**There is no existing KH demo/sample data anywhere to imitate** — only the seeded
ContentSourceType lookup rows.

## What this means for the generator

Everything KH does (embedding, tag resolution, clustering, duplicate similarity, RAG)
operates on **real prose**. Lorem-ipsum bodies would tag and cluster meaninglessly. So a
KH demo needs genuine text generation — a different kind of asset than our row generators.

Two options, ascending effort:

- **Option A — Entity source, near-zero datagen work (recommended first step).** KH's
  flagship source type is *Entity*: point it at MoreCheese entities that carry prose.
  Today our text fields are thin (names, titles, one-line notes). If we fatten a few
  fields we already generate — issue bodies, event/course descriptions, meeting agenda
  items — to 1–3 paragraphs of coherent cheese-world prose, KH becomes demoable with
  **configuration only** (one ContentSource + EntityDocument); its pipeline generates
  ContentItems/tags/embeddings live. Embeddings must NOT be pre-generated (model-specific;
  leave the pipeline to compute them).
- **Option B — a document corpus (the richer demo).** Generate ~100–300 `ContentItem`
  rows with real 200–800-word bodies: certification handbook chapters, food-safety
  guidance, board minutes, FAQs, newsletter articles — plus a curated 2-level `Tag`
  taxonomy and 2–3 planted near-duplicate document pairs so the Duplicates tab has
  content. This is real authored/LLM-generated text, checked into the ruleset like our
  name banks (determinism preserved: text is data, not dice).

Caveat either way: run-lineage artifacts (ContentProcessRun, cluster layouts) should be
produced by **running the KH pipeline once** against the demo DB, not fabricated —
fabricated lineage rows would carry dangling AIPromptRun FKs.

## Decision ask

Option A is cheap and rides existing tables; Option B is a contained new "corpus bank"
(authored text assets + one emitter for ContentSource/ContentItem/Tag). Recommend: do A
now (fatten 3–4 prose fields), scope B only if KH is a July-31 demo target.
