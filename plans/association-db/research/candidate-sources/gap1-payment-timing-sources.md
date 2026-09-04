# R10 — Payment timing (days-to-pay vs due date) · was GAP-1 candidate sources

**Status: ✅ REVIEWED & ADOPTED (Marcelo, 2026-07-06).** Sources approved with **official
sources weighted above the two software companies** (Xero/QuickBooks → secondary corroboration
only). The 3-part mixture-model strategy change was approved. Adopted numbers live in
`benchmarks-draft.json` v0.9 `payments_timing` (canonical). Per-source verdicts below.

**2026-07-06 association-specific check (Marcelo's ask): do associations report payment-timing
data? VERDICT: NO.** Checked: MGI Benchmarking Report (covers renewal process — installments
33%, ~3mo grace — but no days-to-pay/aging); ASAE Financial & Operational Performance / former
Operating Ratio Report (Form-990 balance-sheet ratios incl. net AR — levels, not timing); AMS
vendors (Personify, iMIS/ASI, Fonteva, Wild Apricot — features, no behavior datasets);
Nonprofit Finance Fund State of the Sector (government-funder payment delays — wrong payer).
⟹ Per Marcelo's rule, the cross-industry sources below stand as the defensible basis, with the
MGI installment/grace stats and ASAE net-AR ratios available as association-specific context.

| # | Verdict | Source | Publisher / year | Nature | Headline numbers | Access |
|---|---|---|---|---|---|---|
| 1 | ✅ **PRIMARY** | B2B Payment Practices Trends, United States | Atradius (trade-credit insurer), 2024 + 2025 PDF | Survey (~200 firms/market, annual since ~2015) | ~50% of B2B invoiced sales go overdue; overdue paid on avg **20 days past due**; ~8% written off; avg terms 45d | Free · [2024](https://atradius.us/knowledge-and-research/reports/b2b-payment-practices-trends-united-states-2024) · [2025 PDF](https://group.atradius.com/dam/jcr:5609b617-ac29-4e30-8b01-0663a01d94bd/payment-practices-barometer-us-2025-en.pdf) |
| 2 | 🟡 SECONDARY (software co.) | 2025 US Small Business Late Payments Report | Intuit QuickBooks, May 2025 | Survey, n>2,000 | 47% of businesses had invoices >30d overdue; **~1 in 10 invoices 30+ days overdue** | Free · [link](https://quickbooks.intuit.com/r/small-business-data/small-business-late-payments-report-2025/) |
| 3 | 🟡 SECONDARY (software co.) | Small Business Insights — late payments / State of Late Payments | Xero, 2024–25 | **Actual accounting-ledger data** (not survey; large n) | US small biz paid on avg **7.8–9.3 days after due**; avg overdue invoice paid ~**18 days late** | Free · [insights](https://blog.xero.com/data-insights/small-business-insights-data-late-payment-results/) · [guide](https://www.xero.com/us/guides/chasing-outstanding-invoices/) |
| 4 | ✅ **PRIMARY** | National Summary of Domestic Trade Receivables | Credit Research Foundation (industry body), quarterly (Q1 2026) | Practitioner-submitted A/R data, dollar-weighted, large corporates | **87.4% of receivable dollars current**; avg days delinquent 4.85; **0.35% >91 days past due** | Summary free · [link](https://www.crfonline.org/tools/national-summary-of-domestic-trade-receivables-results-summary/) |
| 5 | ⚪ COLOR ONLY (not evidence) | US Household Bill Pay Report / Hidden Costs of Bill Pay | doxo (consumer bill-pay), 2020–26 | Platform data + survey (B2C bills) | **54% of consumers incur ≥1 late fee/yr**; most bills paid on/near due | Free · [2025](https://www.doxo.com/w/insights/2025-us-household-bill-pay-report/) · [2020 PDF](https://fm.cnbc.com/applications/cnbc.com/resources/editorialfiles/2020/07/13/doxoINSIGHTS%20Hidden%20Costs%20of%20Bill%20Pay%20Report.pdf) |
| 6 | ⚪ INSPIRATION ONLY (vendor-grade) | Payment-processing best practices (auto-pay) | i4a (AMS vendor blog), ~2024 | Vendor content, no n — low trust, but association-specific | Auto-pay members renew **88–92% vs 65–75%** manual | Free · [link](https://www.i4a.com/blog/payment-processing-best-practices/) |

## Adopted targets (mirror of the canonical JSON entries)
- `payment_channel_mixture` [0.85, 0.15] checkout vs net-terms (ESTIMATE, approved shape)
- `autopay_dues_cohort` [0.30 on auto-pay, 0.03 failed-card→3–14d retry] (ESTIMATE; #6 inspiration)
- `netterms_late_share` 0.45 ±0.10 count-weighted (#1 primary; #2/#3 corroborate)
- `netterms_days_late_given_late` log-normal median ~12d / mean ~20d / 95% ≤60d (#1 primary; #3 corroborates)
- `netterms_dollar_aging` [0.87 current, 0.004 >91d] (#4 primary — thin-tail bound)
- `payer_trait_persistence` 0.70 (requirement; no published stat — ESTIMATE)

## Strategy flags raised by the run (per Marcelo's "raise it at the end" instruction)

1. **A single days-late curve would mislead — recommend a 3-part mixture.** Most individual
   association payments (event regs, course fees, merch) are card-at-checkout: invoice and
   payment are same-day, well before any due date. B2B lateness stats apply only to
   corporate/org invoices and true net-terms billing. Proposed model: (a) pay-at-checkout mass
   for most individual non-dues invoices; (b) an **auto-pay spike exactly on the due date**
   (+ a few % failed-card retries landing 3–14d late) for dues; (c) the B2B-style curve
   (Atradius/Xero shape) for corporate/org invoices only.
2. **Count-weighted vs dollar-weighted lateness diverge hard** (50% of invoices vs 13% of
   dollars) — pick per metric consumed by the demo's A/R reports.
3. **The late tail is thin**: mean-given-late ≈ 18–20 days; <0.5% of dollars past 90d —
   consistent with the existing dues grace mechanic; do NOT generate a fat 60–90d tail.
4. No credible event-industry registration-payment-timing study exists; FreshBooks/Melio are
   blog anecdotes — excluded.

## If approved, what gets pulled
- Late share + mean-given-late from **Xero (#3)** (ledger data — strongest) cross-checked
  against **Atradius (#1)**; tail cap from **CRF (#4)**; auto-pay cohort behavior from **#6**
  (labeled vendor-grade); B2C sanity from **#5**. `payments_timing` section restructured to the
  3-part mixture above (replaces the current single early/on-time/late split).
