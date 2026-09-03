# MoreCheese Synthetic Universe — Loom Data Project

This directory (`data/`) contains the declarative specification for generating the **MoreCheese / International Cheese Federation (ICF)** synthetic data universe using **[Loom](https://github.com/MemberJunction/loom)** (`@memberjunction/loom`).

---

## 🏛️ Architecture & Separation of Concerns

MemberJunction data generation follows a strict **downstream configuration model**:

```
┌────────────────────────────────────────────────────────┐
│                   MemberJunction / Loom                 │
│  (Independent causal engine, identity, accumulation,   │
│   topological SQL migration emitter, validation gates)  │
└───────────────────────────┬────────────────────────────┘
                            │ Reads project via CLI
                            ▼
┌────────────────────────────────────────────────────────┐
│                 MoreCheese / data/                      │
│  • project.json        (Project manifest & outputs)    │
│  • domain.json         (17 entities across 5 packs)    │
│  • ruleset/common.json (Empirical factor contracts)    │
│  • banks/              (Authentic artisan names)       │
└───────────────────────────┬────────────────────────────┘
                            │ Emits
              ┌─────────────┴─────────────┐
              ▼                           ▼
      ../metadata/*.json          ../migrations/*.sql
    (MJ Sync JSON entities)     (Skyway DB migrations)
```

- **Loom is domain-agnostic**: The Loom engine has zero knowledge of cheese, creameries, or ICF.
- **MoreCheese owns its universe**: All entity definitions, foreign key DAGs, business keys, factor benchmarks, and authentic name banks reside here in `/data`.

---

## 📁 Directory Structure

```
data/
├── project.json            # Project manifest: name, UUID namespace, ruleset & output paths
├── domain.json             # Declarative schema for all 17 MoreCheese entities & FK DAG
├── ruleset/
│   └── common.json         # Calibrated empirical benchmarks & factor contracts
├── banks/
│   ├── orgs.json           # Safety-cleared artisan creameries, dairies, and cooperatives
│   └── people.json         # Safety-cleared cheesemaker personas, affineurs, and judges
└── README.md               # This documentation
```

---

## 🧩 Domain Entity Schema (17 Entities across 5 Packs)

MoreCheese declares 17 entities organized into 5 dependency packs:

| Pack | Entity | Target Table | Business Key | Dependencies |
| :--- | :--- | :--- | :--- | :--- |
| **`core`** | `Organization` | `Organization` | `["Name"]` | _None (Tier 0)_ |
| **`core`** | `Person` | `Person` | `["Email"]` | `Organization` |
| **`core`** | `OrganizationProfile` | `OrganizationProfile` | `["OrganizationID"]` | `Organization` |
| **`core`** | `MemberProfile` | `MemberProfile` | `["PersonID"]` | `Person` |
| **`core`** | `MembershipPeriod` | `MembershipPeriod` | `["PersonID", "StartDate"]` | `Person` |
| **`advocacy`** | `AdvocacyAction` | `AdvocacyAction` | `["PersonID", "CampaignName"]` | `Person` |
| **`events`** | `Event` | `Event` | `["Name", "StartDate"]` | _None (Tier 0)_ |
| **`events`** | `EventRegistration` | `EventRegistration` | `["EventID", "PersonID"]` | `Event`, `Person` |
| **`events`** | `CompetitionEntry` | `CompetitionEntry` | `["EventID", "OrganizationID", "CheeseName"]` | `Event`, `Organization` |
| **`learning`** | `Course` | `Course` | `["CourseCode"]` | _None (Tier 0)_ |
| **`learning`** | `CourseEnrollment` | `CourseEnrollment` | `["CourseID", "PersonID"]` | `Course`, `Person` |
| **`learning`** | `Certification` | `Certification` | `["Code"]` | _None (Tier 0)_ |
| **`learning`** | `MemberCertification` | `MemberCertification` | `["CertificationID", "PersonID"]` | `Certification`, `Person` |
| **`commerce`** | `Product` | `Product` | `["SKU"]` | _None (Tier 0)_ |
| **`commerce`** | `Order` (Immutable) | `Order` | `["OrderNumber"]` | `Person` |
| **`commerce`** | `OrderLine` (Immutable) | `OrderLine` | `["OrderID", "ProductID"]` | `Order`, `Product` |
| **`commerce`** | `Payment` (Immutable) | `Payment` | `["OrderID", "PaymentDate"]` | `Order` |

---

## 🎯 Empirical Factor Calibration

The ruleset in `ruleset/common.json` binds the simulation to verified real-world association benchmarks:

1. **Member Retention (`factor-membership-renewal`)**:
   - **Target**: `82% ± 8%`
   - **Evidence**: ICF Annual Member Benchmark. Ensures churn rates match actual specialty food trade associations.
2. **Auto-Renewal Enrollment (`factor-autorenew-rate`)**:
   - **Target**: `70% ± 10%`
   - **Evidence**: Association Recurring Revenue Study. Balances automated annual renewals against manual invoice renewals.

---

## 🚀 Running Loom for MoreCheese

### Prerequisites
Ensure `@memberjunction/loom-cli` is installed globally or accessible within the workspace:

```bash
# In the M5 mega-workspace root:
pnpm --filter @memberjunction/loom-cli build
```

### 1. Generate Baseline Universe
Generates the initial world from a deterministic seed, writing metadata to `../metadata` and emitting the baseline migration `V*__Baseline_morecheese.sql` to `../migrations`:

```bash
loom build --project ./data --seed 42
```

### 2. Time-Warp Accumulation (Weekly Simulation Advances)
Advances the simulation by 1 or more weeks, adding new members, event registrations, course completions, and orders while strictly preserving earlier transaction records:

```bash
loom accumulate --project ./data --prior-state ../metadata --weeks 1 --seed 42
```

### 3. Verify Universe Integrity & Factor Tolerances
Rigorously checks all 17 primary key uniqueness constraints, 17 foreign key referential closure relationships, and statistical factor contracts:

```bash
loom validate --project ./data --data ../metadata
```

---

## 🔒 Determinism & Identity Stability

- **Deterministic UUIDs**: Identities are minted via Loom's `IdentityService` using the project's namespace (`e4d8f1e2-5a7c-4f9b-8d3e-2b1a0c9f8e7d`) and declared business keys (e.g. `Person.Email`, `OrderLine.[OrderID, ProductID]`).
- **No Stale ID Leaks**: Re-running builds with seed `42` produces 100% byte-for-byte identical output across metadata JSON and SQL migrations.
- **Deep Immutability**: Historical financial orders, line items, and payment transactions are never mutated during accumulation cycles.
