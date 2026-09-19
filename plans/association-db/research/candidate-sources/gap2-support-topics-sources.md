# R11 — Support ticket topics & volumes · was GAP-2 candidate sources

**Status: ✅ REVIEWED — RESOLVED ESTIMATE-LED (the schema owner, 2026-07-06).** Ruling: *"take the
Gartner finding and maybe the HDI/MetricNet finding; the rest seem to be marketing material —
lean heavier on estimating. Draw inspiration, but don't treat them as gold-standard empirical
evidence unless they are."* Verdicts applied below; adopted estimates live in
`benchmarks-draft.json` v0.9 `support` (canonical). Izzy real data ruled out (confidentiality).

**Honest headline stands: no source matches our exact domain.** The distribution is a labeled
association-tuned estimate, anchored only where a source survived review.

| # | Verdict | Source | Publisher / year | Nature | Headline numbers | Access |
|---|---|---|---|---|---|---|
| 1 | ✅ **KEPT (anchor)** | "20–50% of help-desk calls are password resets" | Gartner finding, cited secondhand ([BleepingComputer 2023](https://www.bleepingcomputer.com/news/security/password-reset-calls-are-costing-your-org-big-money/), [Avatier](https://www.avatier.com/blog/hidden-cost-of-password-reset/)); counterpoint [Helpt](https://gethelpt.com/articles/the-password-reset-myth-exposed-why-%E2%80%9Csimple%E2%80%9D-tickets-are-quietly-draining-your-support-capacity): 15–20% even with MFA/SSO | Stylized fact; original paywalled | Login/password = **15–30%** of tickets → our 25% | Free (citing pages) |
| 2 | ✅ **KEPT (volume bound)** | Tickets per User per Month | HDI/MetricNet (Rumburg), ~2012 · [PDF](https://www.thinkhdi.com/~/media/HDICorp/Files/Library-Archive/Insider%20Articles/cost-per-ticket-per-user.pdf) | Benchmark-database (real data), internal IT desks | 0.41–0.99 tickets/seat/**month** (~5–12/user/yr) → sanity bound for our 0.6/member/yr | Free PDF (verify tables by hand) |
| 3 | ❌ **REMOVED as evidence** (inspiration only) | Support tickets per 1,000 orders, DTC benchmark | Eightx, 2026 · [link](https://eightx.co/blog/average-ecommerce-customer-tickets-per-1000-orders-by-vertical-2026) | Self-admitted triangulation — marketing-adjacent | (shape only: status Qs dominate; refunds ~10%) | Free |
| 4 | ❌ **REMOVED as evidence** (inspiration only) | Gorgias ticket-volume benchmarks | Gorgias, 12k+ stores · [link](https://www.gorgias.com/blog/ticket-volume) | Real platform data but wrong vertical + blog-form | (shape only: order-status ≈ 33%) | Free |
| 5 | ❌ **REMOVED** (marketing material) | AMS vendor portal pages (i4a, Glue Up, etc.) | vendor marketing · [i4a](https://www.i4a.com/association-member-portal-software/) · [Glue Up](https://www.glueup.com/blog/self-service-portal-members) | Qualitative marketing | Confirms the topic SET only — zero percentages | Free |
| 6 | ❌ **REMOVED** (repackaged vendor stats) | Event attendance/no-show aggregators (refund proxy) | [Nunify](https://www.nunify.com/blogs/event-attendance-rate), [Remo](https://remo.co/blog/event-industry-statistics), [Umbrex](https://umbrex.com/resources/company-analysis/marketing/event-attendance-rate-analysis/) | Aggregator repackaging | direct refund-request rates not published anyway | Free |

## Adopted estimates (mirror of the canonical JSON entries — ESTIMATE-led per ruling)
- `support_topic_mix` [login .25 (#1 anchor) · membership+billing .25 · events .20 ·
  refunds+transfers .15 · courses+certs .15] with seasonal coupling (dues/login spike Nov–Jan,
  refund/transfer spike post-event, event-Q ramp pre-conference) — association-tuned estimate
- `support_nonmember_contact_share` 0.15 (pure estimate; no source exists either way)
- `support_volume_per_member_year` 0.6 (estimate, #2 as sanity bound)

## Strategy flags

1. **Seasonality > topic precision for demo realism.** Contacts cluster around dues-renewal
   season and event dates (registration surges within 72h of an event). Make renewal-season and
   pre/post-conference peaks first-class; let topic mix SHIFT by season (dues/login peak
   Nov–Jan; refunds/transfers peak around events).
2. **Our refund vs registration-transfer split is finer than any benchmark** — will be an
   invention either way; sources treat cancellation+refund as one driver (~10%).
3. **The 0.6 contacts/member/yr estimate holds up** against internal-IT 5–12/user/yr (members
   are low-touch external users). Keep.
4. **Non-member share (~15%): no data either way** — stays a labeled assumption (skews to
   event + certification questions).
5. Zendesk Benchmark is a dead end for topic mix (publishes channel/CSAT ops KPIs only).

## If approved, what gets pulled
Login/password anchored at 15–30% (**#1**); refunds ~10% of contacts (**#3/#4** analogs);
status-type questions as the plurality (WISMO analog); volume 0.6/member/yr kept (**#2**
bound); seasonal coupling made explicit in the ruleset. All entries stay labeled
SYNTHESIS-FROM-ADJACENT-VERTICALS (not association-native data).
