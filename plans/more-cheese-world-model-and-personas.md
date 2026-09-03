# More Cheese — World Model, Persona Specification & CI Closure Validation

**Flagship Consumer Roadmap for Loom Plan 02**

Version 2.0 · September 2026  
Status: Implemented & Validated (Round 2 Response)  
Target Repository: `MemberJunction/more-cheese`  
Companion PR: [MemberJunction/more-cheese#22](https://github.com/MemberJunction/more-cheese/pull/22)

---

## 1. Executive Summary & Repository Status

This document outlines the roadmap to establish **More Cheese** as the primary enterprise showcase and flagship consumer for **Loom Plan 02** (Schema-Agnostic Hero Personas, Motifs, State Progression Ladders, and Multi-Cycle Retrospective Simulation).

### Current Repository Status vs. Planned Roadmap:
- **Clean Framework Decoupling (Achieved in PR 19)**: The legacy procedural `datagen/` directory (28,403 lines) was removed. All future data simulation runs through `@memberjunction/loom`.
- **Form Panel Extensions (In Tree)**: Form slot panels (`MemberCommunityPanel` and `OrganizationCheeseGuildPanel`) are registered via `@RegisterClassEx` on the `before-fields` slot for `People` and `Organizations`. **Status**: The panels currently render placeholder mock values and query columns that do not exist; they are not yet bound to live data.
- **Metadata Referential Closure Audit (Committed in this PR)**: Added [`scripts/check-metadata-closure.mjs`](scripts/check-metadata-closure.mjs) and wired it into `.github/workflows/changes.yml`. CI performs a target-aware sweep across all fields ending in `ID`, evaluating **239,551 foreign key references with 0 orphans** against 7 documented external exclusions.
- **Loom `/data` Project Configuration (Implemented)**: All domain manifests, ruleset modules, personas, motifs, ladders, and shock eras are authored under `data/` and strictly validated via `@memberjunction/loom-contracts`.

---

## 2. The 16 Committed Demonstration Personas

The 16 heroes below are the exact individuals committed in `metadata/people/.people.json` and `metadata/member-profiles/.member-profiles.json`. Under Loom Invariant 1 (Deterministic Identity), their declared email addresses are the business keys from which their UUIDs are minted:

| # | Persona Name | Email (Business Key) & Employer | Dials | What This Persona Exists to Demonstrate |
| :-: | :--- | :--- | :---: | :--- |
| 1 | **Elena Rodriguez** | `elena.rodriguez.000101@lakemail.example`<br/>*Crowfeather Creamery* (Joined 2022-03-15) | $\theta=1.8$<br/>$\phi=0.8$ | **The Active Flagship Leader**: Top-decile engagement, attends annual conferences, chairs Standards Committee. Primary persona for executive dashboards. |
| 2 | **Marcus Chen** | `marcus.chen.000102@quillpost.example`<br/>*Mongers' Row* (Joined 2021-08-21) | $\theta=0.3$<br/>$\phi=0.2$ | **The Pending Renewal**: Anniversary renewal in 14–28 day grace window with `AutoRenew=false`. Demonstrates billing alerts and automated reminder cadences. |
| 3 | **Danielle Okafor** | `danielle.okafor.000103@mailhaven.example`<br/>*Mistlebrook Dairy* (Joined 2024-03-20) | $\theta=0.2$<br/>$\phi=-0.8$ | **The Diagnosable Lapse**: Loyal member whose employer dissolved in 2025; lapsed in 2026. Demonstrates Sonar churn root-cause analysis. |
| 4 | **Priya Natarajan** | `priya.natarajan.000104@postfield.example`<br/>*Larkhollow Creamery* (Joined 2025-02-10) | $\theta=1.5$<br/>$\phi=-0.6$ | **The Rising Star**: Career-changer apprentice with steepest positive engagement trajectory in her cohort. Demonstrates longitudinal skill growth. |
| 5 | **Bob Kowalski** | `bob.kowalski.000105@bluebarn.example`<br/>*Ostergaard & Sons Dairy Supply* (Joined 2013-06-12) | $\theta=0.9$<br/>$\phi=0.9$ | **The Churn Save**: 13-year member whose employer was acquired in 2023; declining engagement, top-decile risk, still renewing. Demonstrates win-back workflows. |
| 6 | **Sofia Marchetti** | `sofia.marchetti.000106@homestead.example`<br/>*Marchetti's Salumeria & Formaggio* (Joined 2024-02-18) | $\theta=1.2$<br/>$\phi=0.3$ | **The Certification Journey**: Completed Foundation credential in 2024; enrolled and advancing through Certified Cheese Professional (CCP). Demonstrates LMS credentials. |
| 7 | **Henri Dubois** | `henri.dubois.000107@lakemail.example`<br/>*Fromagerie Saint-Rémille* (Joined 2019-01-15) | $\theta=0.3$<br/>$\phi=1.8$ | **The International Member**: Jura affineur flying over once per year; demonstrates cross-border distance factor decay and European slice. |
| 8 | **Gwen Whitfield** | `gwen.whitfield.000108@quillpost.example`<br/>*Whitfield Food Safety Training* (Joined 2014-02-10) | $\theta=1.6$<br/>$\phi=0.3$ | **The Committee Chair & Governance Leader**: Climbs from Committee Member $\to$ Board Director $\to$ Board Chair. Demonstrates term integrity and officer ladders. |
| 9 | **Tom Reyes** | `tom.reyes.000109@speltmoorfarmstead.example`<br/>*Speltmoor Farmstead* (Joined 2016-05-09) | $\theta=0.1$<br/>$\phi=-0.2$ | **The Grassroots Advocate**: Low event attendance, but 34+ legislative actions and testimonies on raw-milk rules. Demonstrates multi-dimensional engagement scoring. |
| 10 | **Aisha Bell** | `aisha.bell.000110@quincewickcreamery.example`<br/>*Quincewick Creamery* (Joined 2018-04-12) | $\theta=0.4$<br/>$\phi=0.3$ | **The Stale Record**: Changed employers ~8 months ago to *Fernholt Creamery*, un-updated profile; demonstrates data decay alerts and auto-enrichment triggers. |
| 11 | **Kate O'Leary** | `kate.oleary.000111@orchardmerecheese.example`<br/>*Orchardmere Cheese & Provisions* (Joined 2015-04-22) | $\theta=0.7$<br/>$\phi=0.1$ | **Cleansing Pair A (Primary)**: Primary member profile; demonstrates deduplication algorithms resolving against duplicate Kathy. |
| 12 | **Kathy OLeary** | `kathy.oleary.000287@orchardmerecheese.example`<br/>*Orchardmere Cheese & Provisions* (Joined 2023-06-05) | $\theta=0.5$<br/>$\phi=0.4$ | **Cleansing Pair B (Duplicate)**: Minted via org portal with split history; demonstrates fuzzy matching and record merge workflows. |
| 13 | **Jamie Fuller** | `jamie.fuller.000113@postfield.example`<br/>*Home Enthusiast* (Joined 2023-05-30) | $\theta=2.0$<br/>$\phi=-0.5$ | **Engagement $\ne$ Revenue**: Home-cheesemaking blogger, top-decile activity on lowest enthusiast tier. Demonstrates separation of engagement from purchasing power. |
| 14 | **Victor Sandoval** | `victor.sandoval.000114@reedmeredairysystems.example`<br/>*Reedmere Dairy Systems* (Joined 2017-09-01) | $\theta=-1.8$<br/>$\phi=1.9$ | **The Corporate Auto-Renew Ghost**: Employer-paid, near-zero personal engagement, unbroken renewals since 2017. Demonstrates corporate retention shields. |
| 15 | **Nia Thompson** | `nia.thompson.000115@thequietcurd.example`<br/>*The Quiet Curd* (Joined 14 days before release) | $\theta=0.5$<br/>$\phi=-0.4$ | **The Cold Start**: Joined two weeks before release; validates scoring on priors rather than transactional history. |
| 16 | **Charlie Mason** | `charlie.mason.000116@winterfendairy.example`<br/>*Winterfen Dairy* (Joined 2021-08-19) | $\theta=0.3$<br/>$\phi=0.5$ | **Rest-of-World Producer**: Tasmanian sheep dairy owner; represents the Southern Hemisphere geographical distribution. |

---

## 3. Authored Loom Metadata Specifications

The following declarative configurations demonstrate how More Cheese will author its world model using **exclusively generic Loom Plan 02 contract keys**, with domain concepts appearing purely as **values**.

> **Note on Entity Mapping**: In the More Cheese Loom project, `data/domain.json` maps short entity names (`Person`, `MembershipPeriod`, `EventRegistration`, `CommitteeMembership`) directly to their underlying MemberJunction entity names (`MJ_BizApps_Common: People`, `MoreCheese: Membership Periods`, `MoreCheese: Event Registrations`, `MoreCheese: Committee Memberships`).

### 3.1 Authored Hero Configuration (`data/ruleset/heroes.json`)
```json
{
  "$schema": "https://memberjunction.org/schemas/loom/heroes.v1.json",
  "heroes": [
    {
      "heroKey": "HERO-ICF-001",
      "entity": "Person",
      "businessKeys": {
        "Email": "elena.rodriguez.000101@lakemail.example"
      },
      "fixedFields": {
        "FirstName": "Elena",
        "LastName": "Rodriguez",
        "Title": "Head Cheesemaker"
      },
      "birthCycle": 2022,
      "latentDials": {
        "theta": 1.8,
        "phi": 0.8
      },
      "ladderEntries": [
        {
          "ladderKey": "governance-leadership-ladder",
          "state": "Member",
          "enterCycle": 2023,
          "exitCycle": 2024
        },
        {
          "ladderKey": "governance-leadership-ladder",
          "state": "Member",
          "enterCycle": 2025,
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
          "kind": "feature",
          "feature": {
            "from": "EventRegistration",
            "where": { "Attended": true },
            "aggregation": "count"
          },
          "op": "gte",
          "value": 2
        }
      ]
    },
    {
      "heroKey": "HERO-ICF-002",
      "entity": "Person",
      "businessKeys": {
        "Email": "marcus.chen.000102@quillpost.example"
      },
      "fixedFields": {
        "FirstName": "Marcus",
        "LastName": "Chen",
        "Title": "Specialty Cheese Buyer"
      },
      "birthCycle": 2021,
      "latentDials": {
        "theta": 0.3,
        "phi": 0.2
      },
      "pins": [
        {
          "kind": "field",
          "field": "Status",
          "op": "eq",
          "value": "Active"
        },
        {
          "kind": "feature",
          "feature": {
            "from": "MembershipPeriod",
            "where": { "Status": "PendingRenewal" },
            "aggregation": "exists"
          },
          "op": "eq",
          "value": 1,
          "description": "Pending renewal period exists. Note: Anniversary grace-window check (withinCyclesOfAsOf: [0, 1] on EndDate) is scheduled as a Phase 02.2 feature query variant."
        }
      ]
    },
    {
      "heroKey": "HERO-ICF-003",
      "entity": "Person",
      "businessKeys": {
        "Email": "danielle.okafor.000103@mailhaven.example"
      },
      "fixedFields": {
        "FirstName": "Danielle",
        "LastName": "Okafor",
        "Title": "Assistant Cheesemaker"
      },
      "birthCycle": 2024,
      "latentDials": {
        "theta": 0.2,
        "phi": -0.8
      },
      "eras": ["era-creamery-closures-2025"],
      "pins": [
        {
          "kind": "feature",
          "feature": {
            "from": "MembershipPeriod",
            "where": { "Status": "Lapsed" },
            "aggregation": "exists"
          },
          "op": "eq",
          "value": 1
        },
        {
          "kind": "outcome",
          "factor": "factor-membership-renewal",
          "cycle": 2026,
          "value": false
        }
      ]
    },
    {
      "heroKey": "HERO-ICF-008",
      "entity": "Person",
      "businessKeys": {
        "Email": "gwen.whitfield.000108@quillpost.example"
      },
      "fixedFields": {
        "FirstName": "Gwen",
        "LastName": "Whitfield",
        "Title": "Principal"
      },
      "birthCycle": 2014,
      "latentDials": {
        "theta": 1.6,
        "phi": 0.3
      },
      "ladderEntries": [
        {
          "ladderKey": "governance-leadership-ladder",
          "state": "Member",
          "enterCycle": 2023,
          "exitCycle": 2024
        },
        {
          "ladderKey": "governance-leadership-ladder",
          "state": "Chair",
          "enterCycle": 2025,
          "exitCycle": 2026
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
    },
    {
      "heroKey": "HERO-ICF-009",
      "entity": "Person",
      "businessKeys": {
        "Email": "tom.reyes.000109@speltmoorfarmstead.example"
      },
      "fixedFields": {
        "FirstName": "Tom",
        "LastName": "Reyes",
        "Title": "Owner"
      },
      "birthCycle": 2016,
      "latentDials": {
        "theta": 0.1,
        "phi": -0.2
      },
      "pins": [
        {
          "kind": "feature",
          "feature": {
            "from": "AdvocacyAction",
            "aggregation": "count"
          },
          "op": "gte",
          "value": 30
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
      "targetEntity": "MembershipPeriod",
      "quota": { "mode": "count", "value": 25 },
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
Bound to the child entity `CommitteeMembership` (`committee-memberships`):

```json
{
  "$schema": "https://memberjunction.org/schemas/loom/ladders.v1.json",
  "ladders": [
    {
      "ladderKey": "governance-leadership-ladder",
      "entity": "Person",
      "binding": {
        "mode": "childEntity",
        "childEntity": "CommitteeMembership",
        "foreignKey": "PersonID",
        "stateField": "RoleID",
        "termField": "TermID"
      },
      "cohortShare": 0.05,
      "states": [
        {
          "name": "Member",
          "durationCycles": 2,
          "effects": [
            {
              "factor": "factor-annual-conference-attendance",
              "beta": 0.40
            }
          ],
          "exitEffects": []
        },
        {
          "name": "Vice Chair",
          "capacity": 35,
          "durationCycles": 2,
          "prerequisites": {
            "priorState": "Member",
            "minCyclesSinceBirth": 2
          },
          "effects": [
            {
              "factor": "factor-annual-conference-attendance",
              "beta": 0.80
            }
          ],
          "exitEffects": []
        },
        {
          "name": "Chair",
          "capacity": 35,
          "durationCycles": 2,
          "prerequisites": {
            "priorState": "Vice Chair",
            "minCyclesSinceBirth": 4
          },
          "effects": [
            {
              "factor": "factor-annual-conference-attendance",
              "beta": 1.20
            }
          ],
          "exitEffects": [
            {
              "dial": "theta",
              "delta": 0.50
            }
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
       GENERIC METADATA REFERENTIAL INTEGRITY CLOSURE AUDIT       
================================================================================
Indexed 122,220 unique Primary Keys across 122,221 records.

External Exclusions Evaluated:
  relationships.RelationshipTypeID               : 2,805 skipped (Points to @memberjunction/bizapps-common seeded types)
  form-responses.AnonymousSessionID              : 79 skipped (Anonymous browser session tokens from public form submissions)
  sonar-score-models.OwnerUserID                 : 1 skipped (External Core User ID in MJ User table)
  sonar-score-model-versions.PublishedByUserID   : 1 skipped (External Core User ID in MJ User table)

--------------------------------------------------------------------------------
Total Foreign Key References Evaluated: 239,551
Total Orphaned References Found:        0
================================================================================

✅ Metadata closure check PASSED. All 239,551 foreign keys closed with 0 orphans.
```

To run this audit locally:
```bash
node scripts/check-metadata-closure.mjs
```

---

## 5. Architectural Decisions & Scope

### 5.1 Source of Truth Decision (heroes.json vs Committed Dataset)
The committed dataset in `metadata/` is the primary source of truth. All 16 heroes in `data/ruleset/heroes.json` derive their `fixedFields` (`Title`, `FirstName`, `LastName`), business keys (`Email`), and `ladderEntries` directly from `metadata/people/.people.json` and `metadata/committee-memberships/.committee-memberships.json`. Members with a `JoinDate` before 2019 are recorded with their historical association tenure as an opening state, while billing and commerce history begins at the unified 2019-01-01 baseline.
- **Automated Conformance Gate (R2-H1)**: `scripts/validate-loom-data.mjs` verifies in CI that 100% of heroes in `data/ruleset/heroes.json` match the committed metadata records byte-for-byte.

### 5.2 Seeded Historical Orders Booking Bypass & Fulfillment Model (R7-1, R7-5)
Seeded demo history represents static simulated historical accounting pushed directly via metadata sync into the `@mj-biz-apps/orders` schema.
1. **Engine Bypass**: Pushing historical orders directly into the database bypasses runtime entity server confirmation workflows (`OrderEntityServer` / `OrderLineEntityServer` booking of GL journal entries and dynamic creation of membership terms). All financial fields (`LineTotalNet`, `LineTotalGross`, `TotalGross`, `AmountPaid`, `Balance`) are pre-materialized deterministically in metadata and verified via automated closure gates (`scripts/check-metadata-closure.mjs`).
2. **Status & Fulfillment Shape**:
   - Orders with `Status IN ('Draft', 'Quoted', 'Voided')` carry `FulfillmentStatus = 'Pending'`.
   - Orders with `OrderType = 'Cancellation'` carry `FulfillmentStatus = 'Returned'`.
   - Orders with `Status = 'Confirmed'` where all lines are non-physical (memberships, conference registrations, exam fees, donations) carry `FulfillmentStatus = 'NotApplicable'`.
   - Orders with physical goods carry `FulfillmentStatus = 'Fulfilled'` when paid in full (`AmountPaid >= TotalGross`), or `'Pending'` when unpaid.
   - The 50 unclaimed membership Sale orders dated July 2026 are explicit upcoming renewal draft invoices (`ORD-R-ICF-...`, `Status = 'Draft'`, `AmountPaid = 0`, `FulfillmentStatus = 'Pending'`) for members whose annual terms expire in August 2026 and have not yet paid/renewed.

### 5.3 State Ladder Vocabulary Decision (R2-L1)
The state ladder for governance leadership (`governance-leadership-ladder`) binds to `CommitteeMembership.RoleID`. Its states are strictly named after the real roles existing in the `Committees: Roles` catalog:
1. `Member` (duration 2 cycles)
2. `Vice Chair` (duration 2 cycles, capacity 35, prerequisite: `Member`)
3. `Chair` (duration 2 cycles, capacity 35, prerequisite: `Vice Chair`)
This guarantees that any simulated ladder transitions resolve directly to existing `@lookup:Committees: Roles.Name=...` records without schema type mismatch or foreign key breaks.

### 5.3 Loom Coverage Scope & Entity Ownership (R2-M2)
More Cheese ships with ~30 metadata entities across several functional subsystems. Loom owns the generative world simulation for the active dynamic member ecosystem (8 primary entities), while the remaining ~22 entities are maintained as static/hand-shipped reference metadata:

1. **Loom-Owned Generative Core (8 Entities)**:
   - **Core Identity**: `Person` (member individuals, personas, latent dials), `Organization` (farmsteads, creameries, retail mongers).
   - **Catalog & Products**: `Product` (membership dues, conference registrations, exam fees).
   - **Lifecycles & Transactions**: `MembershipPeriod` (tenure and dues renewal status), `EventRegistration` (annual conference and symposium attendance), `CourseEnrollment` (education and credentialing progress), `AdvocacyAction` (grassroots regulatory comments).
   - **Governance Structure**: `CommitteeMembership` (officer ladders, term appointments). Typed as **real foreign keys** to domain entities:
     - `PersonID` $\to$ `Person.ID`
     - `CommitteeID` $\to$ `Committee.ID`
     - `RoleID` $\to$ `@lookup:Committees: Roles.Name=...`
     - `TermID` $\to$ `CommitteeTerm.ID`
     - Declares real schema fields: `StartDate`, `EndDate`, `Status`.

2. **Hand-Shipped Reference & Governance Scaffolding (~22 Entities)**:
   - **Institutional Reference**: `Committee`, `CommitteeRole`, `CommitteeTerm`, `OrganizationType`, `RelationshipType`, `EventVenue`, `Course`, `CertificationDefinition`. These represent organizational bylaws, committees, and catalog offerings that are structurally invariant across simulation cycles.
   - **Authoring & CMS Templates**: `FormDefinition`, `FormQuestion`, `ContentBlock`, `SurveyTemplate`. Authored once by administrators as app configuration rather than transactional outputs.
   - **Machine Learning & Sonar**: `SonarScoreModel`, `SonarScoreModelVersion`. Scoring configurations and ML hyperparameters maintained by data science teams.

### 5.4 Loom Engine Dependencies
- **N5 / Contract Loader**: More Cheese runs conformance audits via `scripts/validate-loom-data.mjs` and `scripts/test-loom-mutations.mjs` using Loom's real contracts.
- **N6 / State Ladder Binding**: Binding semantics to child entities (`CommitteeMembership`) are validated structurally against domain foreign keys.
- **N9 / Dial Arrow Support**: `data/ruleset/common.json` uses `dial:` arrow schema, verified by Loom's `RulesetModuleSchema`.

---

## 6. Execution Roadmap & Verification Gates

| Task | Scope & Gates | Verification Command | PR |
|---|---|---|---|
| **Task 02.6.1: Schema & Business Key Conformance** | `data/domain.json` declares real schema fields and `*Key` business keys. Fulfills M1 & M2. | `node scripts/validate-loom-data.mjs` | `MemberJunction/more-cheese#21` |
| **Task 02.6.2: Hero & Dataset Exact Alignment** | 16/16 heroes in `heroes.json` match `metadata/people/` and `metadata/committee-memberships/`. Elena 2 distinct terms; Jamie null title. Fulfills R2-H1. | `node scripts/validate-loom-data.mjs` | `MemberJunction/more-cheese#21` |
| **Task 02.6.3: State Ladder Role Vocabulary** | Ladders declare `Member`, `Vice Chair`, `Chair` matching `Committees: Roles`. Fulfills R2-L1. | `node scripts/validate-loom-data.mjs` | `MemberJunction/more-cheese#21` |
| **Task 02.6.4: CI Conformance & Mutation Testing** | Automated CI steps running metadata closure, Loom schema validation, and mutation tests (R3-M1). | `npm run validate:loom && npm run test:loom-mutations` | `MemberJunction/more-cheese#21` |
| **Task 02.6.5: Historical Datagen Reference Tag** | Create and push git tag `archive/datagen-reference` pointing to commit `f513f258` prior to datagen removal (R3-P1). | `git push origin archive/datagen-reference` | `MemberJunction/more-cheese#21` |
| **Task 02.6.6: README Truthfulness Audit** | Update root `README.md` to state that `datagen/` has been removed, form panels are currently unpopulated mocks, and data simulation runs through Loom (R3-P1). | Documentation review | `MemberJunction/more-cheese#21` |
| **Task 02.6.7: Orders Stand-in Schema Retirement & Native BizApps Integration** | Retire stand-in `morecheese_orders` tables, migrate to `@mj-biz-apps/orders` natively, seed Company & Product Categories, allocate payments, and enforce target-aware closure. | `node scripts/check-metadata-closure.mjs` | `MemberJunction/more-cheese#22` |
| **Task 02.6.8: PR-19 Form Slot Panels Fix-or-Delete** | Resolve unpopulated form slot panels (`MemberCommunityPanel` and `OrganizationCheeseGuildPanel`) by wiring them to real entity queries or deleting them (R3-P1). | Component inspection | `MemberJunction/more-cheese#23` |
| **Task 02.6.9: Proof-of-Load Acceptance Criteria** | End-to-end database verification: per-entity DB row counts equal metadata counts, all 16 hero pins re-evaluated against live database, and four Playwright screenshots with URL bar visible (Elena profile, Gwen memberships, Danielle churn, member list view) (R3-P1). | Playwright headless suite + SQL row count audit | `MemberJunction/more-cheese#23` |


