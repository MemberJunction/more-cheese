# What changed since you handed this over — 2026-07-05/06

Hey the workstream lead — the schema owner here (via my agent, with your edit approval). Quick map of everything
that changed in your package over the last two days, so nothing surprises you. Bottom line:
**your structure, methodology, and numbers survived almost entirely intact** — we aligned a
few inconsistencies, filled the open holes, and got the package to sales-review-ready.

## New files (all in this folder)
| File | What it is |
|---|---|
| `gaps-to-fill.md` | The gap register (GAP-1..10) — every hole vs. the Q&A-updated master plan, each now FILLED / DECIDED / BACKLOGGED with the reasoning. Start here. |
| `DATA-SUMMARY.md` | The sales-review doc: what we'll generate, how structure is controlled, requirements + demo features. This is what goes to the sales team for final approval. |
| `DEMO-BACKLOG.md` | Deliberately deferred work (BL-1: HubSpot/Higher Logic integration modeling — the schema owner dropped it for this demo; BL-2: your 990 spot-check caveat; BL-3: EU variant; BL-4: committee/staff size curves). |
| `research/candidate-sources/` | Four sourced packets, now **finalized as research deliverables R10–R12** (payment timing / support topics / size attenuation) + the backlogged HubSpot–Higher Logic survey. the schema owner reviewed each: every source carries a verdict (✅ primary · 🟡 secondary · ❌ removed-as-evidence), adopted numbers are mirrored at the bottom of each doc, and they're indexed in your `research/README.md` table alongside R1–R9. |
| `HANDOFF-CHANGES.md` | This doc. |

## `benchmarks-draft.json`: v0.7 → **v0.9** (see `$v08`/`$v08b`/`$v09` changelogs)
- **Consistency fixes:** large preset = **15,000** everywhere (cheese-domain said 10k); query
  count = **108** everywhere (two docs said 60+); acquisition re-derived at 87% (was on the
  team's 89); `status_mix` now has a Pending-Renewal slice (78/15/5/2); your
  "team answers override" note replaced with a formal precedence rule — evidence may overturn
  a team prior but every overturn goes back for sign-off (87-vs-89 and 35-vs-25 still pending
  with the domain lead, exactly as you left them — nothing silently adopted).
- **New `payments_timing` section** (the domain lead's Q&A ask): a 3-part mixture — card-at-checkout
  mass for individual non-dues invoices, an auto-pay due-date spike for dues, and a sourced
  B2B late curve for net-terms invoices (Atradius + Credit Research Foundation primary;
  Xero/QuickBooks secondary — the schema owner weighted official sources over the software vendors).
- **New `support` section** (the domain lead's ask): topic mix, non-member share (~15%), seasonal
  spikes. Estimate-led by the schema owner's ruling — only Gartner (login share) and HDI/MetricNet
  (volume bound) count as anchors; no association-native data exists (Izzy ruled out for
  confidentiality).
- **New `scalingLaws.sizeAttenuation`** — the big one. Linear scaling broke at 15k (35%
  conference × 15k ≈ 5,250 attendees — implausible). Fitted on real member-conference
  associations (ACF 14k → ~9–14%, SNA 50k → ~12.5%, AND 112k → ~9%, vs our 2.3k anchor at
  35%; trade-expo orgs IFT/SCA excluded): participation α ≈ 0.55 → at 15k the flagship runs
  **~13% of members (~1,950)** and revenue ≈ **$4M** (ACF's real 990). Citations in
  `research/candidate-sources/gap5-size-attenuation-sources.md`. Data points only — no
  subject matter from those orgs enters the demo.
- **Merch slice** added (2.5% of revenue, ESTIMATE) and **donations' home decided** (the domain lead's
  ruling: donations ride Orders as *post-install configuration* — we ship the donation
  products/categories/GL wiring as demo seed config; no Fundraising app).

## `hero-personas-draft.md`: 16 → **17 personas** + a new §0
- New **§0 script-anchor table** at the top: every demo scenario → its anchor persona, with a
  column tracing the superseded 8-persona stub so no script anchor was lost. Your doc is now
  formally the **single roster of record** (the old stub in `mj/plans/` is banner-superseded)
  and the marketing team's entry point for demo data.
- **Anna Brown carried over** (the schema owner's rule: team-named personas always carry — she's
  the domain lead's "let's look at Anna Brown's profile" example). Story revamped to your causal
  pinned-facts style (Northgate folded its specialty program in 2023 → title change in the
  Employment row → dues budget line died → lapse past grace). She covers the *post-lapse
  diagnosis* flow; your Bob (save-before-churn) and Danielle (win-back) stay — three distinct
  pitch flows, deliberately.
- **One pin corrected on Danielle:** her "no CancellationDate" contradicted the team's Q&A
  ruling (lapse past grace ⟹ termination date set) — she now has
  `CancellationDate = EndDate + 2mo` with the "never chose to leave" nuance in
  `CancellationReason`.
- Still ❌ in §0 for the next tranche: event-ROI organizer, staff personas, suspended member,
  dedicated top-LTV VIP.

## Prose docs — small superseded markers only
- `research/README.md` + `research-plan-and-schema-proposal.md`: status banners pointing at
  the gap register and DATA-SUMMARY.
- `research/industry-benchmarks.md`: a "further superseded" warning on the 82%-era table so
  nobody lifts stale numbers past the JSON.
- `research/finance-ops-benchmarks.md`: anniversary-renewal row marked superseded by your own
  calendar-year decision. `research/cheese-domain.md`: large anchor 10k → 15k.

## Where it stands / what's on you
Everything is closed, decided, or backlogged except the **team sign-offs** (renewal 87 vs 89,
conference 35 vs 25 — your evidence, presented as FYI; grace 2mo; org count 625; default
hosted preset). the schema owner is routing those. Next human steps are unchanged from your plan: the
Part-2 schema reconciliation (your 🔴 interface asks) and the R5 causal-map workshop, then
ruleset v0.1 → N≈500 pilot. If you disagree with any ruling in `gaps-to-fill.md`, flag it
before the sales review — that doc is the audit trail for every change above.

---

*2026-07-07 correction footnote (the workstream lead, after review + primary-source verification — details in
`benchmarks-draft.json` `$v091`): (1) the "~13% of members (~1,950)" conference-at-large figure
quoted above was superseded the same day by the schema owner's real-turnouts revision — canonical is
~2,000 ± 500 total registrants (~1,400 member attendees ≈ 9%); prose docs now aligned. (2) The
R9 "Cider individual = $175" corroboration was a tier mix-up (their individual rate is $75) and
is retracted; ACS's $175 was verified directly at source. (3) The BBGA decline is five down
years at −3.6%/yr, not six. (4) The hero roster has since grown past the "16 → 17" described
above — it now holds 20 members + 2 staff (the tranche-2 personas landed). (5) The GAP-9 990
spot-check deferred above is now DONE for all load-bearing figures — everything exact.*
