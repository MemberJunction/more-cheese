# More Cheese — World Model, Persona Specification & Database Verification

**Flagship Consumer Roadmap for Loom Phase 2**

Version 1.0 · September 2026  
Status: Approved Implementation & Review Document  
Companion PR: [MemberJunction/loom#5](https://github.com/MemberJunction/loom/pull/5)

---

## 1. Executive Summary

This document establishes **More Cheese** as the primary enterprise showcase and flagship consumer for **Loom Phase 2** (Universal Personas, Motifs, Officer Progression Ladders, and Multi-Year Retrospective Simulation).

### Key Milestones Achieved:
1. **Decoupled Downstream Architecture**: The old `datagen/` monolith (28,403 lines) was removed. All configuration was cleanly decoupled into the `/data` folder (`project.json`, `domain.json`, `ruleset/common.json`, authentic artisan banks) using Loom CLI.
2. **Dynamic Forms Integration**: Integrated MemberJunction's dynamic forms architecture via `BaseFormPanel` slot extensions (`MemberCommunityPanel` and `OrganizationCheeseGuildPanel`) registered via `@RegisterClassEx` on the `after-fields` slot for `MJ_BizApps_Common: People` and `MJ_BizApps_Common: Organizations`.
3. **Full Database Migration & CodeGen**: Consolidated MoreCheese baseline migrations applied cleanly to SQL Server (`bizapps_e2e_grok_it6_blind_20260826` on `localhost:1433`). CodeGen refreshed all 16 MoreCheese entities and views.
4. **95,455 Records Pushed & Verified**: Pushed through `mj sync push` with 100% referential closure (11/11 foreign key gates passed with 0 orphans).

---

## 2. More Cheese Personas & Storyline Arcs (Loom Phase 2)

Loom Phase 2 introduces declarative `heroes.json` and `motifs.json` metadata contracts. In More Cheese, these define the flagship demonstration personas and governance structures:

### 2.1 Flagship Demo Heroes (`data/ruleset/heroes.json`)

| Hero Key | Persona Name | Role & Employer | Dials | Pinned Storyline & Demo Purpose |
| :--- | :--- | :--- | :---: | :--- |
| `HERO-ICF-001` | **Elena Rodriguez** | Head Cheesemaker, *Crowfeather Creamery* (Petaluma, CA) | $\theta=1.8$<br/>$\phi=0.8$ | **The Active Flagship Leader**: Sits on Standards Committee, attends 2+ conferences/year. Demonstrates member engagement and committee tracking. |
| `HERO-ICF-002` | **Marcus Chen** | Specialty Cheese Buyer, *Mongers' Row* (Seattle, WA) | $\theta=0.3$<br/>$\phi=0.2$ | **The Pending Renewal**: Anniversary renewal falling in 14 days with `AutoRenew=false`. Demonstrates billing alerts and automated reminder cadences. |
| `HERO-ICF-003` | **Danielle Okafor** | Production Specialist, *Mistlebrook Dairy* (Brattleboro, VT) | $\theta=0.2$<br/>$\phi=-0.8$ | **The Diagnosable Lapse**: Loyal member for 4 years until employer dissolved in 2025; lapsed with her paycheck. Demonstrates churn analysis and win-back campaigns. |
| `HERO-ICF-004` | **Gwen Whitfield** | Principal, *Whitfield Food Safety Training* (Chicago, IL) | $\theta=1.6$<br/>$\phi=0.3$ | **The Board Leader**: Climbed from Food Safety Committee Member (2022) to Chair (2024), to Board Director (2026). Demonstrates governance tracking and officer terms. |
| `HERO-ICF-005` | **Sofia Marchetti** | Monger, *Marchetti's Salumeria & Formaggio* (Brooklyn, NY) | $\theta=1.2$<br/>$\phi=0.3$ | **The Certification Journey**: Earned Foundation Certificate in 2024; enrolled and progressing through Certified Cheese Professional (CCP). Demonstrates LMS credentials. |
| `HERO-ICF-006` | **Tom Reyes** | Owner, *Speltmoor Farmstead* (Ithaca, NY) | $\theta=0.1$<br/>$\phi=-0.2$ | **The Grassroots Advocate**: Low event attendance, but 34+ legislative actions and testimonies on raw-milk aging rules. Demonstrates multi-dimensional engagement scoring. |

---

### 2.2 Storyline Motifs & Governance Ladders (`data/ruleset/motifs.json` & `ladders.json`)

1. **ICF Board Governance Ladder**:
   $$\text{Committee Member (24 mo)} \longrightarrow \text{Board Director (24 mo)} \longrightarrow \text{Chair-Elect (12 mo)} \longrightarrow \text{Board Chair (24 mo)} \longrightarrow \text{Past Chair (24 mo)}$$
   - **Incumbency Bonus**: Board members receive a $\beta_{\text{board}} = +3.5$ renewal shield ($\ge 99.5\%$ retention while in office).
   - **Alumni Halo**: Leaving the board preserves an elevated engagement baseline ($\Delta \theta = +0.5$) and high tenure, maintaining $>92\%$ renewal for 5+ years post-service.
2. **Rising Star Cheesemakers (5% quota)**:
   - Young cheesemakers whose engagement $\theta$ ramps $+0.35$/year, enrolling in cohorts and advancing toward Sensory Judge credentials.
3. **Employer M&A / Dissolution Casualties (25 members)**:
   - Members whose creamery was acquired or closed, creating authentic, labeled data-cleansing and retention test cases.

---

## 3. Verified Database Metrics

Verification executed against `localhost:1433/bizapps_e2e_grok_it6_blind_20260826`:

```
================================================================================
                     MORECHEESE DATABASE RECORD COUNTS                          
================================================================================
  __mj_BizAppsCommon.Organization               |     653 rows | Common Organizations
  __mj_BizAppsCommon.Person                     |    3120 rows | Common People
  morecheese_members.OrganizationProfile        |     641 rows | MoreCheese Organization Profiles
  morecheese_members.MemberProfile              |    2109 rows | MoreCheese Member Profiles
  morecheese_members.MembershipPeriod           |    8024 rows | MoreCheese Membership Periods
  morecheese_members.AdvocacyAction             |    1007 rows | MoreCheese Advocacy Actions
  morecheese_events.Event                       |     170 rows | MoreCheese Events
  morecheese_events.EventRegistration           |   19124 rows | MoreCheese Event Registrations
  morecheese_events.CompetitionEntry            |     423 rows | MoreCheese Competition Entries
  morecheese_learning.Course                    |     111 rows | MoreCheese Courses
  morecheese_learning.CourseEnrollment          |    4855 rows | MoreCheese Course Enrollments
  morecheese_learning.Certification             |       7 rows | MoreCheese Certifications
  morecheese_learning.MemberCertification       |     123 rows | MoreCheese Member Certifications
  morecheese_orders.Product                     |      16 rows | MoreCheese Products
  morecheese_orders.[Order]                     |   17555 rows | MoreCheese Orders
  morecheese_orders.OrderLine                   |   19461 rows | MoreCheese Order Lines
  morecheese_orders.Payment                     |   18056 rows | MoreCheese Payments
--------------------------------------------------------------------------------
  GRAND TOTAL ACROSS VERIFIED TABLES            |   95455 rows
================================================================================

================================================================================
                     REFERENTIAL INTEGRITY CHECKS                               
================================================================================
  OrganizationProfile -> Organization          : PASSED (0 orphans)
  MemberProfile -> Person                      : PASSED (0 orphans)
  MembershipPeriod -> Person                   : PASSED (0 orphans)
  EventRegistration -> Event                   : PASSED (0 orphans)
  EventRegistration -> Person                  : PASSED (0 orphans)
  CourseEnrollment -> Course                   : PASSED (0 orphans)
  CourseEnrollment -> Person                   : PASSED (0 orphans)
  Order -> Person                              : PASSED (0 orphans)
  OrderLine -> Order                           : PASSED (0 orphans)
  OrderLine -> Product                         : PASSED (0 orphans)
  Payment -> Order                             : PASSED (0 orphans)
================================================================================
FK STATUS: ALL 11 FOREIGN KEY INTEGRITY GATES PASSED PERFECTLY!
================================================================================
```

---

## 4. Cross-Repository Reviewer Collaboration

- **Framework PR**: [MemberJunction/loom#5](https://github.com/MemberJunction/loom/pull/5) — Introduces the schema-agnostic engine architecture, hero/motif Zod contracts, and retrospective simulation unroll.
- **Consumer PR**: [MemberJunction/more-cheese#20](https://github.com/MemberJunction/more-cheese/pull/20) — Authoring-time persona specifications, governance ladder definitions, and database verification runbooks.
