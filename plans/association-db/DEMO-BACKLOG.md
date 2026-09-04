# Demo Backlog — deferred work (circle back after the current release)

**Created 2026-07-06 (Marcelo's call).** Items deliberately dropped from the current demo
scope. Each has enough context to pick up cold. Raise BL-1 in a team meeting when the time
comes.

## BL-1 — Real-system integration modeling (was GAP-3): HubSpot / Higher Logic schema calibration
- **Decision (Marcelo, 2026-07-06):** dropped for this demo — "integration modeling isn't
  super important" yet. The marketing + community schemas ship as the **simple baseline** in
  `research-plan-and-schema-proposal.md` §2.4/§2.7 (no HubSpot-style email event log, no
  Community container / Libraries / Announcements).
- **What's parked and ready when we return:** the public-docs object-model survey at
  `research/candidate-sources/gap3-hubspot-higherlogic-docs.md` (official dev docs; 13 HubSpot
  email event types + bounce/drop enums; Higher Logic's 236-endpoint object inventory) with a
  "minimum credible set" recommendation; plus a drafted ask to the Q&A-thread author who
  offered "we can share" schema exports (author unconfirmed — trace before sending).
- **❓ RAISE IN MEETING:** do we want the demo's marketing/community schemas to visibly mimic
  real products (HubSpot/Higher Logic) in a later release, and can whoever offered the schema
  exports share them?

## BL-2 — 990 transcription spot-check (was GAP-9)
- Barnatt's own caveat: the IRS-990 figures behind renewal-87% and dues-share-22% are
  LLM-transcribed from ProPublica. Deferred by Marcelo (2026-07-06) — not pre-sales work.
  Verify the load-bearing figures before the ruleset FREEZES; log verdicts in
  `benchmarks-draft.json` `$verification`.

## BL-3 — EU/international demo variant
- The full international research track (`research/international-domain.md`: World Cheese
  Awards volumes, Guilde, EU regulatory topics) was shelved by the US-lean decision but
  retained. If a future demo wants an EU-flavored variant, it starts there.

## BL-4 — Committee/staff size curves from full 990 XMLs (GAP-5 extension)
- The GAP-5 pass fitted conference-attendance attenuation only; committee counts + staff FTE
  for the large preset are ESTIMATE (α≈0.2 assumption). Optional hardening: pull full 990
  XMLs for ACF / SNA / ASA / AIHA and fit governance/staff curves on real data.
