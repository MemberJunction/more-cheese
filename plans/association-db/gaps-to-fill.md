# Gaps To Fill — before ruleset v0.1 freeze

**Created 2026-07-05** (Marcelo's agent, with Barnatt's approval to update this package).
This is the **gap register** for the research/data package, audited against the plan set as
updated by the 2026-07-02 team Q&A (`mj/plans/association-db/PLAN-UPDATES.md`). Each gap says
what's missing, why it matters, and **how it gets filled** — `SOURCES` (needs researched
evidence, Marcelo wants oversight on source-finding), `REQUIREMENTS` (just author the
generation requirement / ruleset parameter), or `BOTH`. Full analysis:
`~/MJDev/reports/morecheese-research-gap-analysis/REPORT.md`.

**Status flow:** OPEN → PROPOSED (suggestion on the table) → DECIDED (team call made) →
FILLED (benchmark/requirement landed in `benchmarks-draft.json` / the schema proposal).

**Sourcing protocol (Marcelo, 2026-07-06):** for every SOURCES item, candidate sources are
found and **cited first, Marcelo reviews them, and only then are numbers pulled** into the
package. Nothing sourced lands in `benchmarks-draft.json` without that review.

| # | Gap | Fill type | Status |
|---|---|---|---|
| GAP-1 | Payment-timing distribution for non-dues invoices (days-to-pay curve + sticky early/late-payer trait) | BOTH | **FILLED 07-06 (v0.9)** — sources APPROVED by Marcelo (official sources — Atradius, CRF — weighted above the software vendors Xero/QuickBooks) + the 3-part mixture model adopted (checkout mass / auto-pay due-date spike / B2B curve for net-terms only). Numbers in `benchmarks-draft.json` payments_timing |
| GAP-2 | Customer-support realism: ticket-topic taxonomy, per-topic shares, seasonal coupling, non-member contact share | BOTH | **FILLED 07-06 (v0.9) as ESTIMATE-LED per Marcelo** — only Gartner (login share) + HDI/MetricNet (volume bound) kept as anchors; ecommerce vendor material demoted to inspiration-only (not empirical evidence); estimates tuned to our demo association. **Izzy data ruled out (confidentiality)** |
| GAP-3 | Real-system schema calibration: HubSpot (marketing) + Higher Logic (community) | SOURCES | **DROPPED → BACKLOGGED 07-06 (Marcelo)** — integration modeling not needed for this demo; simple baseline schemas stay. See `DEMO-BACKLOG.md` BL-1 (incl. the raise-in-meeting question + the parked public-docs survey) |
| GAP-4 | Merchandise / product-sales revenue slice + order-line targets | REQUIREMENTS | **FILLED 07-06** — estimate-only per Marcelo (merch ~2.5% of revenue, ~0.15 orders/member/yr, ESTIMATE) |
| GAP-5 | Size-dependent attenuation for the large (15k) preset — linear scaling laws break at 10k+ | BOTH | **FILLED 07-06 (v0.9)** — sources APPROVED (Marcelo: association sources acceptable, selection delegated). Fit on ACF + SNA + AND + ACS anchor (relevance-weighted: ACF highest — food-craft, right size band); AIHA/ASA excluded (inflation confounds), IFT/SCA excluded (trade expos). Result: participation α ≈ 0.55 ± 0.10 → large conference ≈ 13% of members (~1,950); revenue-at-large anchored on ACF's real $3.81M. `scalingLaws.sizeAttenuation` in the JSON; committee/staff curves stay ESTIMATE (see DEMO-BACKLOG BL-4) |
| GAP-6 | Text templates: bios, tasting notes, forum posts, support conversations | REQUIREMENTS | **DECIDED 07-06** — templates used THROUGHOUT generation with anti-repetition variation (slot-filling + phrasing variants, no verbatim reuse); build core set during the N≈500 pilot, the rest after |
| GAP-7 | Donations' schema home | REQUIREMENTS | **DECIDED 07-06 (Robert's ruling, via Marcelo):** Orders CAN carry donations but NOT as part of the Orders install — it's **post-install configuration**: the association sets up donation Products, Categories and GL Accounts itself. A dedicated Fundraising app may exist someday; out of scope. ⟹ the DEMO ships that configuration as seed data (donation ProductCategory + products + GL wiring) and generates donation order lines against it. |
| GAP-8 | Hero roster: single sheet + script anchors + tranche 2 (event-ROI organizer, staff personas, suspended member, dedicated VIP) | REQUIREMENTS | **DECIDED 07-06, REVISED same day (Marcelo):** team-named personas are ALWAYS carried — familiarity wins in demos. Carried: Elena (Amith's v2-plan) + **Anna Brown** (Robert's thread example, cited in v2-plan §7.0), her story revamped to the causal pinned-facts style; she coexists with Bob/Danielle because the three cover distinct pitch flows (save-before-churn / sympathetic win-back / quiet-disengagement diagnosis). Other stub personas not team-named → not carried. Rule recorded in the roster's conventions. Tranche-2 archetypes still ❌ in §0 |
| GAP-9 | 990 transcription spot-check (Barnatt's own caveat on his LLM-transcribed ProPublica figures) | SOURCES (verify) | **DEFERRED 07-06 (Marcelo)** — not a priority before sales; passive check only if GAP-5 research happens to cross the same filings |
| GAP-10 | Team sign-offs pending: renewal 87 vs 89, conference 35 vs 25 (evidence FYI), grace = 2mo, org count 625 @ medium, default hosted-demo preset (large) | DECISION | OPEN — checklist ready in DATA-SUMMARY §7 |
| GAP-11 | **Live-demo alignment** (from Amith's 2026-04-24 NSTA demo transcript): (a) geocodable addresses + pre-baked lat/long on members & orgs (the member MAP is the demo's first visual); (b) Event venue city/state columns (events shown on maps — schema proposal's Event has Region only); (c) morecheese.org blog/site articles seeded as searchable content items (semantic-search results included blog posts); (d) generator emits topical TAGS per record type (search results display tags); (e) tasting-note/description text varied enough for believable clustering (ties to GAP-6 templates) | REQUIREMENTS | **ADDED 07-06** — requirements recorded (JSON `$demo_alignment`); (b) goes to the schema reconciliation |

## GAP details

### GAP-1 — Payment timing (non-dues invoices)
Robert (Q&A): *payments hit invoices with due dates; some pay early, some late — never all on
the due date.* Package covers dues lateness only (late_renewal_share 0.25, grace 2mo) plus v1's
uniform 0–20-day artifact and partial/overdue/failure targets. Missing: a **days-to-pay
distribution** for event/course/product invoices and a **persistent payer trait** (the same
member pays early or late consistently). Candidate benchmark names:
`payment_days_to_pay_distribution`, `payer_trait_persistence`.

### GAP-2 — Support-ticket realism
Robert (Q&A): contacts are member-linked **or non-member**; conversations on membership,
events, courses, **refunds, registration transfer to another person, can't log in**. Package
has only `member_service_contacts` 0.6/member/yr (ESTIMATE). Missing: topic taxonomy with
per-topic shares, seasonal coupling (renewal-season dues/login spikes, post-event refund
spikes), non-member contact share, resolution-time/status distributions. Feeds `bizapps-issues`
+ `secure-messaging` generation modules.

### GAP-3 — Real-system schema calibration
Robert offered **HubSpot** and **Higher Logic** schema exports. Package's `_Marketing` and
forums shapes are self-designed (only Higher Logic *engagement rates* were used). Action: get
the exports, reconcile shapes, and document each schema's "simulates X" identity per
PLAN-UPDATES §3.5 (AMS / LMS / Marketing≈HubSpot / Event Reg / Community≈Higher Logic /
Support≈Izzy). Izzy conversation-shape reference for support is in-house.

### GAP-4 — Merchandise
Q4 asked about merch revenue share; orders scope includes product purchases. Only datapoint:
Brewers Assn merch = 2.4% of revenue. Needs a small slice target (`merch_revenue_share`,
`merch_orders_per_member_year`) so order-line generation has a target. Low stakes.

### GAP-5 — Size attenuation at large (15k)
Benchmarks are calibrated on a ~2,300-member analog; scaling laws are mostly linear. At 15k:
35% conference ≈ 5,250 attendees — not credible (ACS ≈ 1,000–1,300; even the largest food
societies run < 3,000). Participation rates (conference %, posts/member, committee seats,
forum concentration) must FALL with size; event structure likely changes (regional conferences
appear). Needs: attenuation exponents per rate + possibly a `large`-specific event portfolio.
Robert's "10k+ members" ask makes this **blocking for the flagship demo build**.

### GAP-6 — Text templates workstream
The 4th ruleset content type (G13): bios, tasting notes, forum posts — now plus **support
conversations** (GAP-2) and secure messages. Requirements exist; no authoring plan/owner.
Non-blocking until after the vertical-slice pilot; assign an owner now.

### GAP-7 — Donations' home
Giving has arrows (4.5–4.7) + benchmarks but no table in the schema proposal. Presumed:
donation-type order lines through `orders` (sponsorship as its own stream). Confirm at the
Marcelo reconciliation; if confirmed, add the order-line typing requirement.

### GAP-8 — Hero tranche 2 + roster merge
Missing archetypes: **event-ROI organizer** (own ask #2), staff personas for issues/messaging,
suspended member, Nia's shop owner. Also merge this draft (16) with the plans-folder stub (8)
— overlapping churn archetypes (Anna Brown ↔ Bob Kowalski/Danielle Okafor); one roster of
record. Marketing blesses names → permanent.

### GAP-9 — 990 spot-check
Package's own flag: 990 figures are LLM-transcribed from ProPublica. Spot-check the
load-bearing ones (ACS revenue split, the dues-trend series behind renewal 87%) before ruleset
freeze. Verdicts go in `benchmarks-draft.json` `$verification`.

### GAP-10 — Pending team decisions
Consolidated sign-off list (also PLAN-UPDATES §6): 87 vs 89 renewal + 35 vs 25 conference
(present evidence to Robert as FYI), grace = 2 months, org count 625 @ medium, default hosted
preset (large 15k), hero-name blessing, OQ-7 hero-authoring ownership.
