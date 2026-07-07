# Schema Reconciliation — Consolidated Walk-List (Barnatt ↔ Marcelo)

**Created 2026-07-07.** Single-page agenda for the Part-2 schema reconciliation. The asks below
were scattered across the schema proposal, the gap register, the JSON `$demo_alignment`, and
individual hero pins — this consolidates them so nothing gets dropped in the session. Deep
context: `research-plan-and-schema-proposal.md` Part 2 (walk §2.1–§2.10 as the spine) and
`generative-schema-findings.md` §6–§7.

## 🔴 Blocking (the vertical slice cannot be designed without these)

| # | Ask | What we need from Marcelo | Source |
|---|---|---|---|
| A1 | **`subscriptions.Subscription` shape** | Status value list; StartDate/EndDate/CancellationDate columns; tier-change history; can our `MembershipPeriod` take a hard FK to it? If it already carries status+dates, MembershipPeriod slims to the association-semantics overlay (no duplicated status) | schema proposal §2.1, §2.9 |
| A2 | **Order-line shape** (orders app) | Line-item typing (can a line be a dues renewal / event reg / enrollment / entry fee / product / **donation**?), FK-ability from our activity rows, invoice/due-date fields (feeds `payments_timing`) | schema proposal §2.9; GAP-7 |
| A3 | **Org size / region home** | Where does organization size + region live — bizapps-common `Organization` or our overlay? Both are causal DRIVERS (G1); the generator needs them as real columns | schema proposal §2.9 |
| A4 | **Org count ~625 at medium** | Sign-off as a deviation from the v2 plan's ~25: the ACS-calibrated competition chain needs ~210 entrant companies (members × 0.25 ≈ 625 orgs) | JSON scalingLaws; GAP-10 |

## 🟡 Schema asks accumulated since the proposal was written

| # | Ask | Detail | Source |
|---|---|---|---|
| B1 | **Event venue city/state + coordinates** | The proposal's Event has Region only; the live demo shows events on maps | GAP-11(b), JSON `$demo_alignment` |
| B2 | **Pre-baked lat/long on people + orgs** | ⚠ cross-app ask: `Address` lives in **bizapps-common** — adding geocode columns (or a side table) touches Marcelo's shared app, not our cheese schemas. Member map is the demo's first visual; no live geocoding at install | GAP-11(a) |
| B3 | **'Suspended' in the membership status value list** | Currently Active·Lapsed·Cancelled·PendingRenewal; Gary Toth (chargeback/suspension hero) needs the state + its CHECK semantics (renewal blocked while suspended) | hero roster, Gary Toth pins |
| B4 | **Donation order-line typing + seed config** | Per Robert's GAP-7 ruling: donations ride Orders as POST-INSTALL config — demo ships donation ProductCategory/products/GL wiring as seed data. Confirm the orders/accounting schemas accept that shape | GAP-7, JSON `$donations_home` |
| B5 | **Cross-schema FKs must be declared constraints** | Every `PersonID` etc. as a real FK (SQL Server allows cross-schema) so `EntityInfo` carries the join graph the DAG-authoring prompt consumes; "documented-only" links blind the generator | generative-schema-findings §4/§6-B |
| B6 | **`IsSharedDemo` on every generated table** | Schema-wide column, needed now not retrofitted (morecheese.org runs real prod data alongside demo rows) | generative-schema-findings §7.6 |
| B7 | **Competition eligibility gate** | `CompetitionEntry → entering org must hold org-level membership` as a hard referential constraint (real ACS rule; arrow 6.5) | causal map 6.5 |

## 🟢 Confirm-only (decided elsewhere; reconcile the mechanics)

- **Sonar**: we depend on its *engine contract*, not its (unfrozen v0.1) tables — MoreCheese ScoreModel/Factors ship as metadata; Sonar recompute runs at release (rec. D). Confirm no objection.
- **Readiness dates** for the other 8 composed apps' schema freezes (OQ-11) — Marcelo's survey answers this; the whole timeline hangs on it.
- **GAP-12** (calendar-year renewals vs release-relative hero pins) — decision may land here or at the R5 workshop, wherever Robert is in the room; see `gaps-to-fill.md` GAP-12 for the three options.

## Inputs to bring

- `research-plan-and-schema-proposal.md` Part 2 (column-level proposal, the spine of the walk)
- `generative-schema-findings.md` (the generation-angle requirements G1–G14 + recommendations A–J)
- `benchmarks-draft.json` **v0.9.1** (canonical numbers; `$v091` = verification log)
- Marcelo's BizApps schema survey (his half — not in this repo as of 2026-07-07)
