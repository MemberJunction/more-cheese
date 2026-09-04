# MoreCheese Demo Data — Feature Review

**Status: FOR REVIEW.** This is the list of capabilities the MoreCheese demo **dataset is
deliberately engineered to show off** — the things that only work in a demo because we built
the data to support them. Section 1 is that list, in priority order. Section 2 maps each one
onto the surfaces of an actual customer demo (walkthrough of 2026-04-24), so it reflects what
actually gets shown in the room. Anything marked **[being added]** is a new data requirement
identified from that walkthrough, now in the build plan.

**What we're asking reviewers to do:** confirm these are the right things for the data to
prioritize, adjust the priority order if it doesn't match what lands with prospects, and flag
anything missing that comes up in real conversations.

---

## 1. What the data is built to show off (priority order)

1. **One person, every system — the unification story.** The same member appears consistently
   in membership, events, learning, community, marketing, support, and money data, structured
   like a real customer environment (multiple schemas/"systems," soft-key joins). This is the
   dataset's #1 engineered feature: every cross-system drill-down resolves, so "reason across
   all your data" is demonstrable, not hypothetical.
2. **Retention stories with discoverable causes.** Churn isn't a random flag — every lapse and
   decline has a cause you can *find in the data*: Anna Brown's employer killed her program
   (title change on record), Bob Kowalski's company was acquired, Danielle Okafor's creamery
   dissolved. Built so an AI agent can genuinely diagnose "why did she churn?" live, plus the
   full renewal machinery around it (pending-renewal queues, reminder cadences, 2-month grace,
   late renewals, December renewal spike).
3. **Engagement scoring with receipts.** Scores are *computed from* generated behavior — never
   painted on. Component breakdowns differ believably (Tom Reyes is all-advocacy; Elena is an
   all-rounder), the 50/40/10 engaged/casual/ghost mix holds, and deliberate counter-patterns
   stress-test naive readings (Jamie: highly engaged, low revenue; Victor: zero engagement,
   zero risk).
4. **A predictive-model substrate that actually predicts.** Churn, renewal likelihood, LTV,
   attendance forecast, certification completion, and event ROI are trainable because the
   causal relationships are IN the data (tenure→renewal, engagement→attendance,
   affluence→spend) — cross-tabs and model explanations hold up under scrutiny instead of
   falling apart on the second click.
5. **Numbers that survive a knowledgeable prospect.** Every sniff-testable rate is calibrated
   to published benchmarks and real IRS-990 filings: renewal 87% (first-year 68%), conference
   at 35% of members, dues $175 and 22% of revenue, 25% medal rate, 34% email opens. At the
   15,000-member preset, sizing follows real same-size associations (flagship ≈ 2,000
   registrants, ~$4M revenue, multi-event portfolio) — nothing inflates.
6. **Data-quality problems with known-truth answers.** ~50 duplicate people with realistic
   origins (Kate O'Leary's split identity) and ~100 stale-employer records with the true
   employer stored as labeled ground truth (Aisha Bell) — so dedup and enrichment demos have a
   verifiably right answer, not a plausible guess.
7. **Stable, named heroes — repeatable scripts.** ~20 hand-authored members whose identities
   and storylines never change between releases ("let's look at Anna Brown" works in every
   demo, forever), each anchoring a specific pitch moment. See `PERSONAS-REVIEW.md`.
8. **Time that tells a story.** Five years of dated history shaped by real regimes — growth,
   the COVID shock (events halved, competition canceled), recovery, hybrid normal, the annual
   cycle (entry deadlines → judging → summer conference + exam → holiday retail → December
   renewals). Timelines and trend charts show a believable arc, and release-time date-baking
   keeps "upcoming" events permanently upcoming.
9. **Geography that maps well.** Realistic addresses with pre-baked coordinates on members,
   organizations, and event venues, clustered the way a real food association clusters
   (dairy-belt density, coastal retail) — because the member map is the first visual most
   demos open with **[being added: coordinates + event venue city/state]**.
10. **Money that reconciles.** Every dues renewal, registration, enrollment, entry fee,
    product purchase and donation flows order → payment → balanced journal entry. Payments
    behave like real payments (card-at-checkout, auto-pay due-date spike, sourced late curve
    for corporate invoices). *(Activates when the orders application ships.)*
11. **Text and semantics rich enough for AI.** Varied tasting notes, bios, forum posts and
    articles (template-driven, anti-repetitive) so semantic search finds "smelly cheese"
    without those words, product clustering yields believable families, and topical tags
    appear on records **[being added: site articles as searchable content items; tags emitted
    per record type]**.
12. **The unglamorous realism that sells breadth.** Support tickets from members AND
    non-members across real topics with seasonal spikes; staff personas on the other side of
    every queue; governance with motions and votes; advocacy actions; no-shows at real rates;
    an edge-case member (suspension, chargeback) proving the corner cases work; competition
    entries gated on membership with scores that agree with medals.

## 2. Where each shows up in a live demo (the walkthrough arc)

How the 2026-04-24 demo surfaces map to the data features above:

| Demo surface (in demo order) | Data features it exposes |
|---|---|
| Universal + semantic search ("cheddar", "smelly cheese", "cheese expert") | #11 text/semantics, #1 unification (results span records, docs, site articles), #7 heroes |
| Member map (choropleth/heat/pins) + events map | #9 geography, #8 time (event seasons) |
| Views: grid / cards / timeline / AI-written filters | #8 time (join-date timeline), #5 credible distributions |
| Drill-anywhere record browsing (event → registrations → member → courses) | #1 unification — every hop resolves |
| Plain-English querying (cross-domain member activity; events + registrants) | #4 substrate, #5 non-degenerate answers (108-query approved catalog as ground truth) |
| AI-built dashboards (membership KPIs, segment/tier filters; events dashboard) | #5 credible numbers, #2 renewal machinery, #8 trends with a story |
| Auto-generated schema docs / ER diagrams | #1's schema breadth + documented date-semantics rules |
| Clustering + tags + vector visuals | #11 semantics, #6 (dup detection rides the same vectors) |
| Permissions / row-level security walkthrough | demo roles + staff personas (#12), approved/"golden" queries (#5) |
| Agent memory ("you didn't sort this") + collections | #4/#5 — saved, approved queries feed the training story |

## Notes for reviewers

- Priority order above is our proposal — reorder freely; #1–#7 are the ones we'd protect.
- Everything listed is backed by planned data (persona or dataset element named inline); the
  three **[being added]** items are committed requirements, not open questions.
- Every number traces to a published benchmark, an IRS-990 filing, or a documented team
  decision — the evidence file ships with the dataset (`research/`).
- Companion document: `PERSONAS-REVIEW.md` (the named cast and the pitch moments each anchors).
