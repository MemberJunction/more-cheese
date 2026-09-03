# More Cheese — World Model, Persona Specification & CI Closure Validation

**Flagship Consumer Roadmap for Loom Plan 02**

Version 2.0 · September 2026  
Status: Proposed (Round 1 Review Incorporated)  
Target Repository: `MemberJunction/more-cheese`  
Companion PR: [MemberJunction/loom#5](https://github.com/MemberJunction/loom/pull/5)

---

## 1. Executive Summary & Repository Status

This document outlines the roadmap to position **More Cheese** as the primary enterprise showcase and flagship consumer for **Loom Plan 02** (Schema-Agnostic Hero Personas, Motifs, State Progression Ladders, and Multi-Cycle Retrospective Simulation).

### Current Status vs. Planned Roadmap:
- **Clean Framework Decoupling (Achieved in PR 19)**: The legacy procedural `datagen/` directory (28,403 lines) was excised from More Cheese. All future data simulation will run through `@memberjunction/loom`.
- **Form Panel Extensions (In Tree)**: Form slot panels (`MemberCommunityPanel` and `OrganizationCheeseGuildPanel`) are declared and registered via `@RegisterClassEx` on the `after-fields` slot for `People` and `Organizations`. (Wiring live backend fields is scheduled for the data migration phase).
- **Metadata Referential Closure Audit (Committed in this PR)**: Added [`scripts/check-metadata-closure.mjs`](scripts/check-metadata-closure.mjs) and wired into GitHub Actions (`.github/workflows/changes.yml`). CI now evaluates **134,518 foreign key references across 122,220 primary keys with 0 orphans**.
- **Loom `/data` Project Configuration (Planned for Phase 02.6)**: Migration of domain manifests, factor contracts, and authentic name banks into `data/` will occur once Loom Plan 02 contracts land.

---

## 2. The 16 Demonstration Personas

To deliver compelling product demonstrations and validate MemberJunction capabilities (Sonar churn prediction, deduplication, governance ladders, LMS tracking), More Cheese authors a curated roster of **16 demo personas**:

| # | Persona Name | Role & Organization | Dials | What This Persona Exists to Demonstrate |
| :-: | :--- | :--- | :---: | :--- |
| 1 | **Elena Rodriguez** | Head Cheesemaker, *Crowfeather Creamery* | $\theta=1.8, \phi=0.8$ | **The Active Flagship Leader**: High-engagement member, attends annual conferences, chairs Sensory Committee. Primary persona for executive dashboards. |
| 2 | **Marcus Chen** | Specialty Buyer, *Mongers' Row* | $\theta=0.3, \phi=0.2$ | **The Pending Renewal**: Anniversary renewal falling inside 14-day grace window with `AutoRenew=false`. Demonstrates billing alerts and automated win-back workflows. |
| 3 | **Danielle Okafor** | Production Specialist, *Mistlebrook Dairy* | $\theta=0.2, \phi=-0.8$ | **The Diagnosable Lapse**: Loyal 4-year member whose employer ceased operations in 2025; lapsed with her paycheck. Demonstrates Sonar churn root-cause analysis. |
| 4 | **Gwen Whitfield** | Principal, *Whitfield Food Safety Training* | $\theta=1.6, \phi=0.3$ | **The Governance Ladder**: Climbed from Committee Member (2022) $\to$ Board Director (2024) $\to$ Chair-Elect (2025) $\to$ Board Chair (2026). Validates term limits and officer tracks. |
| 5 | **Sofia Marchetti** | Monger, *Marchetti's Salumeria & Formaggio* | $\theta=1.2, \phi=0.3$ | **The Certification Journey**: Completed Foundation Certificate; enrolled and advancing through Certified Cheese Professional (CCP). Demonstrates LMS credentials. |
| 6 | **Tom Reyes** | Owner, *Speltmoor Farmstead* | $\theta=0.1, \phi=-0.2$ | **The Grassroots Advocate**: Minimal conference attendance, but 34+ legislative actions on raw-milk regulations. Demonstrates non-event engagement scoring. |
| 7 | **Kate O'Leary** | Cheesemaker, *Clover Valley Artisans* | $\theta=0.7, \phi=0.1$ | **Cleansing Pair A**: Near-duplicate member record (alternate spelling, same phone/org). Validates data deduplication algorithms. |
| 8 | **Kathy OLeary** | Cheesemaker, *Clover Valley Artisans* | $\theta=0.7, \phi=0.1$ | **Cleansing Pair B**: Resolves to same individual as Kate O'Leary for merge and deduplication demonstrations. |
| 9 | **Aisha Bell** | Lead Affineur, *Gilded Wheel Caves* | $\theta=0.9, \phi=0.0$ | **Stale Employer Cleansing**: Profile lists prior employer that closed in 2024; demonstrates data decay alerts and auto-enrichment triggers. |
| 10 | **Bob Kowalski** | Plant Manager, *Heritage Dairy Co.* | $\theta=0.5, \phi=0.4$ | **M&A Employer Casualty**: Organization acquired by conglomerate; demonstrates account hierarchy reconciliation and corporate parent linking. |
| 11 | **Mei-Ling Zhou** | Corporate Director, *Artisan Distribution Group* | $\theta=-1.5, \phi=2.0$ | **Corporate Ghost Auto-Renewer**: Low personal engagement, unbroken 8-year renewals funded by corporate parent. Validates B2B membership models. |
| 12 | **Jean-Luc Dupont** | Master Affineur, *Dupont & Fils* | $\theta=1.4, \phi=0.9$ | **Past Chair & Senior Alumni**: Completed 2-year Board Chair term in 2024; demonstrates post-service "alumni halo" ($\Delta \theta = +0.5$) and 95%+ retention. |
| 13 | **Chloe Tremblay** | Apprentice Monger, *Fromagerie de l'Est* | $\theta=0.4 \to 1.5$ | **The Rising Star**: Engagement increases $+0.35$/year; completes 3 courses and advances toward Sensory Judge credential. Demonstrates longitudinal growth. |
| 14 | **Liam Vance** | Consultant, *Independent Dairy Advisory* | $\theta=0.6, \phi=-0.2$ | **Reactivation Candidate**: Dormant for 2 cycles following career break; reactivates after attending regional webinar. Validates reactivation factors. |
| 15 | **Priya Patel** | Head of Quality, *Valley Gold Creamery* | $\theta=1.5, \phi=0.6$ | **Speaker & Competition Winner**: Submits 3 award-winning cheeses and presents technical workshops. Demonstrates event speaker and competition tracking. |
| 16 | **Carlos Mendoza** | General Manager, *Border Dairy Supplies* | $\theta=-0.8, \phi=-0.5$ | **One-Off Webinar Lapsed**: Registered for a single 2023 virtual workshop and never renewed. Demonstrates low-intent churn profile. |

---

## 3. Authored Loom Metadata Specifications

The following declarative configurations demonstrate how More Cheese will author its world model using **exclusively generic Loom Plan 02 contract keys**, with association concepts appearing purely as **values**.

### 3.1 Authored Hero Configuration (`data/ruleset/heroes.json`)
```json
{
  "$schema": "https://memberjunction.org/schemas/loom/heroes.v1.json",
  "heroes": [
    {
      "heroKey": "HERO-ICF-001",
      "entity": "Person",
      "businessKeys": {
        "Email": "elena.rodriguez@crowfeathercreamery.example.com"
      },
      "fixedFields": {
        "FirstName": "Elena",
        "LastName": "Rodriguez",
        "Title": "Head Cheesemaker",
        "Status": "Active"
      },
      "birthCycle": 2021,
      "latentDials": {
        "theta": 1.8,
        "phi": 0.8
      },
      "ladderEntries": [
        {
          "ladderKey": "icf-governance-ladder",
          "state": "CommitteeMember",
          "enterCycle": 2022,
          "exitCycle": 2024
        },
        {
          "ladderKey": "icf-governance-ladder",
          "state": "BoardDirector",
          "enterCycle": 2024,
          "exitCycle": 2026
        }
      ],
      "pins": [
        {
          "kind": "field",
          "field": "Status",
          "op": "eq",
          "value": "Active"
        },
        {
          "kind": "outcome",
          "factor": "factor-membership-renewal",
          "cycle": 2025,
          "value": true
        }
      ]
    },
    {
      "heroKey": "HERO-ICF-003",
      "entity": "Person",
      "businessKeys": {
        "Email": "danielle.okafor@mistlebrook.example.com"
      },
      "fixedFields": {
        "FirstName": "Danielle",
        "LastName": "Okafor",
        "Title": "Dairy Operations Specialist",
        "Status": "Lapsed"
      },
      "birthCycle": 2021,
      "latentDials": {
        "theta": 0.2,
        "phi": -0.8
      },
      "eras": ["era-creamery-closures-2025"],
      "pins": [
        {
          "kind": "field",
          "field": "Status",
          "op": "eq",
          "value": "Lapsed"
        },
        {
          "kind": "outcome",
          "factor": "factor-membership-renewal",
          "cycle": 2025,
          "value": false
        }
      ]
    },
    {
      "heroKey": "HERO-ICF-004",
      "entity": "Person",
      "businessKeys": {
        "Email": "gwen.whitfield@whitfieldsafety.example.com"
      },
      "fixedFields": {
        "FirstName": "Gwen",
        "LastName": "Whitfield",
        "Title": "Principal",
        "Status": "Active"
      },
      "birthCycle": 2020,
      "latentDials": {
        "theta": 1.6,
        "phi": 0.3
      },
      "ladderEntries": [
        {
          "ladderKey": "icf-governance-ladder",
          "state": "CommitteeMember",
          "enterCycle": 2022,
          "exitCycle": 2024
        },
        {
          "ladderKey": "icf-governance-ladder",
          "state": "BoardDirector",
          "enterCycle": 2024,
          "exitCycle": 2025
        },
        {
          "ladderKey": "icf-governance-ladder",
          "state": "ChairElect",
          "enterCycle": 2025,
          "exitCycle": 2026
        },
        {
          "ladderKey": "icf-governance-ladder",
          "state": "BoardChair",
          "enterCycle": 2026,
          "exitCycle": 2028
        }
      ],
      "pins": [
        {
          "kind": "field",
          "field": "Status",
          "op": "eq",
          "value": "Active"
        }
      ]
    }
  ]
}
```

### 3.2 Authored Motifs Configuration (`data/ruleset/motifs.json`)
```json
{
  "$schema": "https://memberjunction.org/schemas/loom/motifs.v1.json",
  "motifs": [
    {
      "motifKey": "rising-star-cheesemaker",
      "targetEntity": "Person",
      "quota": { "mode": "percentage", "value": 0.05, "rounding": "round" },
      "latentTrajectory": {
        "dial": "theta",
        "deltaPerCycle": 0.35
      },
      "childRates": [
        {
          "entity": "CourseEnrollment",
          "perCycle": { "min": 1, "max": 3 }
        }
      ]
    },
    {
      "motifKey": "corporate-ghost-autorenew",
      "targetEntity": "Person",
      "quota": { "mode": "count", "value": 25 },
      "latentConstraints": {
        "theta": { "min": -2.0, "max": -0.8 },
        "phi": { "min": 1.0, "max": 2.5 }
      },
      "fixedFields": {
        "AutoRenew": true
      },
      "factorOverrides": [
        {
          "factor": "factor-membership-renewal",
          "probability": 0.98
        }
      ]
    }
  ]
}
```

### 3.3 Authored Governance Ladder (`data/ruleset/ladders.json`)
```json
{
  "$schema": "https://memberjunction.org/schemas/loom/ladders.v1.json",
  "ladders": [
    {
      "ladderKey": "icf-governance-ladder",
      "entity": "Person",
      "binding": {
        "mode": "field",
        "field": "GovernanceRole"
      },
      "cohortShare": 0.5,
      "states": [
        {
          "name": "CommitteeMember",
          "capacity": 60,
          "durationCycles": 2,
          "prerequisites": {
            "minCyclesSinceBirth": 1,
            "dials": { "theta": { "min": 0.8 } }
          },
          "effects": [
            { "factor": "factor-membership-renewal", "beta": 1.2 }
          ]
        },
        {
          "name": "BoardDirector",
          "capacity": 12,
          "durationCycles": 2,
          "prerequisites": {
            "priorState": "CommitteeMember",
            "dials": { "theta": { "min": 1.2 } }
          },
          "effects": [
            { "factor": "factor-membership-renewal", "beta": 3.0 }
          ]
        },
        {
          "name": "ChairElect",
          "capacity": 1,
          "durationCycles": 1,
          "prerequisites": {
            "priorState": "BoardDirector"
          },
          "effects": [
            { "factor": "factor-membership-renewal", "beta": 4.0 }
          ]
        },
        {
          "name": "BoardChair",
          "capacity": 1,
          "durationCycles": 2,
          "prerequisites": {
            "priorState": "ChairElect"
          },
          "effects": [
            { "factor": "factor-membership-renewal", "beta": 4.5 }
          ]
        },
        {
          "name": "ImmediatePastChair",
          "capacity": 1,
          "durationCycles": 2,
          "prerequisites": {
            "priorState": "BoardChair"
          },
          "effects": [
            { "factor": "factor-membership-renewal", "beta": 2.5 }
          ],
          "exitEffects": [
            { "dial": "theta", "delta": 0.5 }
          ]
        }
      ]
    }
  ]
}
```

---

## 4. Metadata Referential Integrity Closure Verification

Verification of the committed metadata dataset is automated via [`scripts/check-metadata-closure.mjs`](scripts/check-metadata-closure.mjs), executed by CI on every pull request to `next` and `main`:

```
================================================================================
           METADATA REFERENTIAL INTEGRITY CLOSURE AUDIT           
================================================================================
Indexed 122,220 unique Primary Keys across 62 metadata collections.

  organization-profiles -> Organizations (OrganizationID) : PASSED     [641 checked]
  member-profiles -> People (PersonID)                 : PASSED     [2,109 checked]
  membership-periods -> People (PersonID)              : PASSED     [8,024 checked]
  event-registrations -> Events (EventID)              : PASSED     [19,124 checked]
  event-registrations -> People (PersonID)             : PASSED     [19,124 checked]
  competition-entries -> Events (EventID)              : PASSED     [0 checked]
  enrollments -> Courses (CourseID)                    : PASSED     [4,855 checked]
  enrollments -> People (PersonID)                     : PASSED     [4,855 checked]
  orders -> People (PersonID)                          : PASSED     [17,555 checked]
  order-lines -> Orders (OrderID)                      : PASSED     [19,461 checked]
  order-lines -> Products (ProductID)                  : PASSED     [19,461 checked]
  payments -> Orders (OrderID)                         : PASSED     [18,056 checked]
  advocacy-actions -> People (PersonID)                : PASSED     [1,007 checked]
  member-certifications -> People (PersonID)           : PASSED     [123 checked]
  member-certifications -> Certifications (CertificationID) : PASSED     [123 checked]
--------------------------------------------------------------------------------
Total Foreign Keys Evaluated: 134,518
Total Referential Orphans:    0
================================================================================

✅ Metadata closure check PASSED. All relationships closed with 0 orphans.
```

To run this audit locally:
```bash
node scripts/check-metadata-closure.mjs
```
