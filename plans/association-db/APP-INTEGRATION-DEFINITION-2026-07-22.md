# What "integration with the other apps" actually means — definitions, status, open questions

**Date:** 2026-07-22 · **Author:** datagen workstream (Barnatt + Claude)
**Why this doc:** "integration" has been used in this workstream to mean at least five
different things, and plans built on an overloaded word can't be binary. This pins down the
levels, the evidence standard for each ("done" must be checkable, not vibes), where
MoreCheese stands today, and the questions that still need team answers.

---

## The five integration levels (a ladder — each builds on the one below)

### L1 — Schema-level: the tables coexist
**Definition:** MoreCheese's schema and every dependency app's schema install into one
database without collision; cross-schema references resolve.
**Evidence standard:** all apps' migrations apply green on one DB; FKs and soft references
resolve; CHECK constraints hold under our data.
**Status: ✅ DONE, proven twice** (2026-07-15 spike, 2026-07-17 re-run on `MC_Integration_V2`):
21 dependency migrations + ours apply green; our rows satisfy their constraints.
**Not included:** anything running — this is purely "the furniture fits."

### L2 — Data-level: our data flows through THEIR machinery
**Definition:** the dependency apps' *own generated layer* (views, stored procedures,
entities, lookups) serves MoreCheese rows correctly — not raw table reads.
**Evidence standard:** query their generated views / entity API and get our rows back with
their computed columns, their seeded lookups (F6 name resolution), their FK trust intact.
**Status: ✅ DONE, proven** — e.g. Gwen's attendance renders through committees'
`vwAttendances` with THEIR DisplayName computed column and THEIR seeded Chair role; issue
statuses resolve by name into their workflow; verified again through a **live MJAPI**
(their resolvers, not SQL) on 2026-07-17.
**Not included:** UIs, install reproducibility.

### L3 — Install-level: one reproducible command
**Definition:** a fresh environment reaches L1+L2 through the *supported tooling* — no
hand-applied SQL, no bespoke clone.
**Evidence standard:** `mj app install <MoreCheese repo>` on a clean MJ host pulls the
dependency apps **leaf-first** (mj-app.json `dependencies`, incl. `mj-secure-messaging`),
applies schema + CodeGen + the 10 seed data migrations, and the world is queryable — with
exact row counts, no manual steps.
**Status: ✅ ARCHITECTED AND VALIDATED** on `morecheese-datagen-install` (now the branch of
record): data ships as Skyway seed migrations (`Seed_01..10`), CodeGen is a captured
migration, install is migrations-only (colleague's run: 14 migrations, 69s, exact counts —
pre-messaging; the 10-seed set re-emitted 2026-07-22 has not yet had a from-scratch install
run → see Q1).
**Not included:** the UIs and the AI features.

### L4 — UI-level: their apps render our data
**Definition:** the dependency apps' *actual Explorer UIs* (not the generic entity browser)
run in one Explorer over the shared DB and render MoreCheese data sensibly.
**Evidence standard:** mount the app's published `-ng` package (npm install +
`dynamicPackages.client` + Explorer rebuild), open its screens, and the data reads as a
living system — no empty flagship tabs, no nonsense values.
**Status: 🟡 PROVEN FOR ONE APP (committees), method established.** The committees UI
mounted cleanly via published npm packages (2026-07-17) and directly drove two data
enrichments (upcoming meetings, failing motions). Forms/tasks/issues/secure-messaging UIs
have **not** been mounted yet; the *data-side* gaps their UIs would expose were addressed
proactively (anonymous intake, triage matrix, assignees, message threads) but not
visually confirmed. Note: bizapps-forms' UI currently **crashes MJAPI at boot** when
dev-linked (manifest generator pulls the Angular client into Node — stopgap PR
MemberJunction/bizapps-forms#9 open; durable fix belongs in MJ's manifest generator).
**Not included:** AI/analytical features.

### L5 — Feature-level: the platform's intelligence runs on the data
**Definition:** MJ core features and the Blue Cypress SaaS family *operate* on MoreCheese
data and produce credible results — the dataset powers capability demos, not just CRUD.
**Evidence standard (per feature, binary):**
- **Sonar** scores our members and the component breakdown reflects the engineered signals
  (advocacy/committees/certs/attendance) — *a scoring run has actually executed*.
- **Skip** answers analytical questions ("who looks like churn risk and why?") with the
  discoverable answers (Bob's NPS trail) — *a real conversation transcript exists*.
- **Predictive Studio** trains a renewal-risk model that converges and rank-orders risk
  (Bob above Victor) — *a training run with holdout metrics exists*. This is the deepest
  fit: the dataset's trainability gates were built for exactly this claim.
- **Record Set Processing / dedup** fixes defects and is *graded against DataQualityLabel*
  (the answer sheet exists precisely for this).
- **Betty / Knowledge Hub** answer from association knowledge — blocked on the prose
  corpus question (see Q4), unless Betty truly needs nothing (per Barnatt 2026-07-22).
**Status: 🔴 ENGINEERED-FOR BUT UNPROVEN.** The data was *designed* to pass every one of
these (hidden engagement dial, causal arrows, labeled defects, trainability gates), but no
feature-level run has actually been executed against it. Every L5 claim is currently a
well-founded prediction, not evidence.

### Orthogonal axis — cross-app narrative
Not a level but a quality bar that cuts across L2–L5: can one persona be walked through
*every* app? **✅ DONE and gated** for the four flagship heroes (Elena, Bob, Gwen, Tom):
membership → events → learning → orders → committees → forms → issues → secure messaging,
enforced by `pins.issueMin`/`pins.formResponse` + the messaging hero-thread gate. (Tasks
footprint for Bob/Tom deferred — needs a third task derivation.)

---

## Per-app status matrix

| App | L1 schema | L2 data | L3 install | L4 UI | Notes |
|---|---|---|---|---|---|
| bizapps-common | ✅ | ✅ | ✅ | — (no bespoke UI beyond widgets) | identity backbone |
| bizapps-committees | ✅ | ✅ | ✅ | ✅ proven 07-17 | the L4 method-setter |
| bizapps-forms | ✅ | ✅ | ✅ | ⬜ blocked-ish (PR #9 boot fix) | anonymous intake data ready |
| bizapps-tasks | ✅ | ✅ | ✅ | ⬜ not mounted | data already healthy |
| bizapps-issues | ✅ | ✅ | ✅ | ⬜ not mounted (near-headless anyway) | triage matrix + assignees ready |
| bizapps-secure-messaging | ✅ | ✅ (soft refs land) | ✅ (Seed_10) | ⬜ not mounted | in scope per 2026-07-22 ruling |
| bizapps-sonar | ✅ coexists | n/a (consumer) | ✅ | ✅ has own UI | L5 scoring run not yet executed |
| bizapps-orders / -accounting | — | — | — | — | **ELIMINATED** (2026-07-22 ruling; stand-in stays) |
| bizapps-caliber | — | — | — | — | repo live 2026-07-22, **zero migrations** — out until baseline ships |

## The SaaS family (what "integration" means per product)

| Product | Integration = | Readiness | Owner of proof |
|---|---|---|---|
| **Skip** | consumes MJ entities/queries as AI analyst | data ready; "no extra work" (Barnatt) — but see Q2 | ? |
| **Sonar** | scores members from engagement components | data engineered for it; run not executed | ? |
| **Betty** | answers from association knowledge | "already built, zero extra work" (Barnatt) — see Q4 | ? |
| **Predictive Studio** | trains retention models on our members | strongest engineered fit; never run | ? |
| **rasa.io** | newsletter personalization from members+interests | deprioritized; would want a content-engagement stream | deferred |
| **Izzy** | unknown data shape | deprioritized; needs definition | deferred |
| **Caliber** | intake conversations + assessments | blocked upstream (no schema) | their team |

---

## Open questions (the ones that decide what "integrated" means for July 31)

**Q1 — Has the 10-seed install been run from scratch?** The colleague validated the 9-seed
set (69s, exact counts). The re-emitted 10-seed set (renamed band `2341..2350` +
Seed_10_messaging + enriched forms/issues) has **not** had a clean-DB install run. Also:
instances built from the old seed filenames (e.g. `morecheese-fullsize`) need a
wipe-and-remigrate — who coordinates that?

**Q2 — Is L5 in the July-31 definition of done, and who runs the proofs?** The dataset's
whole premise is that Sonar/Skip/Predictive Studio work on it — but nobody has pressed the
button. Each proof is probably an hour, not a project. If the demo script includes "Sonar
flags Bob," someone must have *seen* Sonar flag Bob first. Proposed: one proof session per
feature, results captured as transcripts/screenshots in `plans/`.

**Q3 — What Explorer configuration is the demo-of-record?** L4 requires choosing which
`-ng` packages are mounted in the demo Explorer (committees proven; forms blocked on the
boot fix; sonar's own?). Who owns the demo environment (host, DB, ports), and is it built
via `mj app install` (L3) so it's reproducible?

**Q4 — Betty's knowledge source.** Ruling says zero extra work — confirm what Betty
actually ingests in this demo. If it consumes documents, the prose-corpus question returns
(one corpus would serve Betty + Knowledge Hub + future Caliber conversations). If it works
over entity data as-is, say so explicitly and close the question.

**Q5 — Seed immutability at first publish.** Pre-release we rewrite seed files freely.
The moment MoreCheese publishes a version, the PUBLISH_NO_BREAK policy applies — data
changes then ship as *new* migrations under the next version. Decide the cut point and
whether CI should enforce the "emit + fail-on-diff" check (designed for, not wired).

**Q6 — The forms boot fix.** L4 for forms depends on either merging the stopgap
(bizapps-forms PR #9) or the durable MJ manifest-generator fix. Who picks it up, and does
forms' UI make the July-31 demo or not?

**Q7 — Caliber trigger.** When their baseline migration ships, MoreCheese owes a standard
new-pack pass (~one session, per the committees/forms/issues/messaging track record). Who
watches for it, and is it in scope the moment it exists or explicitly next-release?

---

## The binary integration checklist (proposed)

"MoreCheese is integrated" for July 31 **iff**:
1. ✅ L1–L3 hold (they do — pending the Q1 from-scratch 10-seed run to re-confirm L3).
2. ⬜ L4 for the demo's chosen app set (minimum: committees ✅ + whichever of
   forms/sonar the script needs — Q3/Q6).
3. ⬜ L5 proof runs executed for the features the demo script claims (Q2) — each captured
   as evidence, not asserted.
4. ✅ Cross-app narrative gates green (they are).

Everything else (rasa/Izzy streams, Caliber, prose corpus, accounting/orders) is
*explicitly out*, by ruling — listed here so the boundary is inspectable.
