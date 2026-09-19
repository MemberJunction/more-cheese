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

**1. One person, every system — the unification story.**
The same member appears in membership, events, learning, community, marketing, support, and
money data, structured like a real multi-system environment. Every cross-system drill-down
resolves.

**2. Retention stories with discoverable causes.**
Every lapse and decline has a cause findable in the data (Anna's program was cut, Bob's company
was acquired, Danielle's creamery closed) — so an AI can genuinely diagnose "why did she
churn?" live — plus the full renewal machinery (queues, cadences, grace, December spike).

**3. Engagement scoring with receipts.**
Scores are computed from behavior, never painted on: believable component breakdowns
(all-advocacy Tom vs all-rounder Elena), a 50/40/10 mix, and counter-patterns that punish
naive readings (Jamie: engaged but low-revenue; Victor: disengaged but safe).

**4. A predictive-model substrate that actually predicts.**
Churn, renewal, LTV, attendance, cert-completion and event-ROI models are trainable because
the causal relationships are in the data — explanations hold up on the second click.

**5. Numbers that survive a knowledgeable prospect.**
Every sniff-testable rate is calibrated to published benchmarks and real IRS-990s (renewal
87%, dues $175 / 22% of revenue, 25% medal rate) — and the 15k preset is sized on real
same-size associations, so nothing inflates.

**6. Data-quality problems with known-truth answers.**
~50 duplicate people and ~100 stale-employer records with the truth stored as labeled ground
truth — dedup and enrichment demos have a verifiably right answer.

**7. Stable, named heroes — repeatable scripts.**
~20 hand-authored members whose identities never change between releases; "let's look at Anna
Brown" works in every demo, forever. See `PERSONAS-REVIEW.md`.

**8. Time that tells a story.**
Five years of history shaped by real regimes (growth → COVID shock → recovery → annual cycle
with the December renewal spike), and release-time date-baking keeps "upcoming" events upcoming.

**9. Geography that maps well.**
Realistic addresses with pre-baked coordinates on members, orgs, and event venues, clustered
like a real food association — the member map is most demos' opening visual.
**[being added: coordinates + event venue city/state]**

**10. Money that reconciles.**
Everything sellable flows order → payment → balanced journal entry, with realistic payment
timing (checkout, auto-pay spike, sourced late curve). *(Activates when the orders app ships.)*

**11. Text and semantics rich enough for AI.**
Varied, template-driven text so semantic search finds "smelly cheese" without the words,
clustering yields believable families, and records carry topical tags.
**[being added: site articles as searchable content items; tags per record type]**

**12. The unglamorous realism that sells breadth.**
Support tickets (members and non-members, seasonal spikes), staff on the other side of every
queue, governance with motions and votes, advocacy, real no-show rates, and one suspended
member proving the edge cases work.

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
