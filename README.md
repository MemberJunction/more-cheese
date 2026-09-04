# 🧀 MoreCheese — International Cheese Federation (ICF) Demo

[![MemberJunction OpenApp](https://img.shields.io/badge/MemberJunction-OpenApp-blue.svg)](https://github.com/MemberJunction/MJ)
[![Angular](https://img.shields.io/badge/Angular-21-dd0031.svg)](https://angular.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178c6.svg)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

> **The Definitive OpenApp Reference Implementation for MemberJunction**
>
> MoreCheese models the fictional **International Cheese Federation (ICF)** — a global trade and professional association of artisan cheesemakers, creameries, affineurs, and industry partners. It showcases how domain-specific applications cleanly compose upstream MemberJunction BizApps catalogs (`@mj-biz-apps/*`) with custom association schemas and causally-generated synthetic universes.

---

## 🏛️ Architectural Overview

MoreCheese demonstrates the **OpenApp Composable Architecture**: rather than building monolithic applications or hardcoding forks of core schemas, MoreCheese sits as an independent, additive downstream extension on top of MemberJunction core and BizApps foundations.

```
                           ┌─────────────────────────────────────────┐
                           │      MemberJunction Core Framework      │
                           │  (@memberjunction/core, server, ng)     │
                           └────────────────────┬────────────────────┘
                                                │
                           ┌────────────────────▼────────────────────┐
                           │       Upstream BizApps Foundations      │
                           │  (@mj-biz-apps/common, /orders, etc.)   │
                           │   • People                              │
                           │   • Organizations                       │
                           │   • Invoicing & Line Items              │
                           └────────────────────┬────────────────────┘
                                                │
                 ┌──────────────────────────────┴──────────────────────────────┐
                 │                                                             │
   ┌─────────────▼─────────────┐                                 ┌─────────────▼─────────────┐
   │ Dynamic Form Slot Panels  │                                 │ Downstream Domain Schemas │
   │ (BaseFormPanel Injection) │                                 │ (morecheese_* Schemas)    │
   │  • MemberCommunityPanel   │                                 │  • morecheese_members     │
   │  • OrganizationGuildPanel │                                 │  • morecheese_events      │
   │  (Mounted into Upstream   │                                 │  • morecheese_learning    │
   │   People & Org Forms)     │                                 └───────────────────────────┘
   └───────────────────────────┘                                 
```

### Key Domain Capabilities

- **Artisan Cheesemaker Profiles**: Extends standard CRM persons with primary cheese focus (Alpine, Washed Rind, Farmstead Blue, Bloomy Rind), milk types (Cow, Goat, Sheep, Water Buffalo), and guild certifications.
- **Creamery & Producer Guild Standing**: Extends organizations with facility accreditation (Grade A Artisan Certified), annual production volume, and wholesale distribution tiers.
- **Cheese Competitions & Sensory Scoring**: World Cheese Cup events, entry submissions, blind judging rounds, and medal awards.
- **Continuing Education & Master Certification**: Academy coursework, affineur apprenticeships, and food safety credentials.
- **Advocacy & Legislative Coalitions**: Grassroots dairy campaigns, raw-milk regulation monitoring, and legislative testimonies.

---

## 🧩 Dynamic Forms Architecture (`BaseFormPanel` Slot System)

> [!NOTE]
> **Form Panel Implementation Status**: The `MemberCommunityPanel` and `OrganizationCheeseGuildPanel` form slot panels are registered on the `before-fields` slot for `People` and `Organizations`. They currently render unpopulated UI mockups pending live data query wiring in follow-up integration work.

A premier feature of MemberJunction's UI architecture is the **BaseFormPanel Dynamic Slot System**. In downstream applications like MoreCheese, you frequently need to enrich upstream records (such as `MJ_BizApps_Common: People` or `MJ_BizApps_Common: Organizations`) with downstream domain intelligence without modifying upstream templates or touching core repositories.

MoreCheese implements this via `BaseFormPanel` decorators:

```typescript
import { BaseFormPanel } from '@memberjunction/ng-base-forms';
import { RegisterClassEx } from '@memberjunction/global';

@RegisterClassEx(BaseFormPanel, {
  key: 'more-cheese:member-community-panel',
  skipNullKeyWarning: true,
  metadata: {
    entity: 'MJ_BizApps_Common: People', // Targets upstream BizApps Person entity
    slot: 'after-fields',                // Dynamically injected after primary form fields
    sortKey: 100,
  },
})
@Component({
  selector: 'mj-morecheese-member-community-panel',
  standalone: true,
  template: `...`,
})
export class MemberCommunityPanel extends BaseFormPanel<BaseEntity> {
  // Panel lifecycle, reactive RunView queries, and domain visualization
}
```

### Supported Injection Slots

| Slot Name | Placement | Typical Use Case |
|---|---|---|
| `top-area` | Header banner above form tabs | Critical warning banners, VIP status alerts, accreditation shields |
| `before-fields` | Above standard entity fields | High-level summary metrics, quick KPIs |
| `after-fields` | Below primary fields, above related tabs | Domain community cards, custom attribute grids, specialized meters |
| `after-related` | Below related entity grids | Cross-system audit logs, external CRM timeline feeds |
| `after-everything` | Footer of entire form layout | Regulatory notices, signature stamps |

---

## 🧵 Data Generation & Synthetic Worlds with Loom

> [!NOTE]
> **Loom World Simulation**: The legacy procedural `datagen/` script tree (28,403 lines) was removed in PR #19 and is preserved at git tag `archive/datagen-reference` (commit `f513f258`). All data generation is now defined declaratively in `data/` and driven by **[Loom](https://github.com/MemberJunction/loom)** (`@memberjunction/loom`). Run data project validation locally via `npm run validate:loom` and mutation testing via `npm run test:loom-mutations`.

Synthetic data for MoreCheese is designed and generated using **Loom**, MemberJunction's framework for causal, calibrated, and deterministic synthetic universes:

- **Causally Correlated**: Member join dates, event attendance, certification progress, order amounts, and churn risk are drawn from joint causal graphs, not isolated pseudo-random generators.
- **Referentially Closed**: 100% referential integrity across 4 tiers of foreign keys with guaranteed topological migration ordering.
- **Idempotent & Additive**: Generates initial baseline snapshots with strictly monotonic ID persistence and zero unwanted mutations.

---

## 📦 Monorepo Package Inventory

| Package | Scope | Description |
|---|---|---|
| [`packages/Entities`](packages/Entities) | `@mj-more-cheese-demo/entities` | Strongly-typed TypeScript entity subclasses generated by CodeGen. |
| [`packages/CoreEntitiesServer`](packages/CoreEntitiesServer) | `@mj-more-cheese-demo/core-entities-server` | Server-side entity overrides, business logic validation, and database save pipelines. |
| [`packages/Actions`](packages/Actions) | `@mj-more-cheese-demo/actions` | Deterministic MemberJunction Actions invokable by workflows, agents, and APIs. |
| [`packages/Server`](packages/Server) | `@mj-more-cheese-demo/server` | Server bootstrap package loaded by MJAPI at startup via `startupExport`. |
| [`packages/Angular`](packages/Angular) | `@mj-more-cheese-demo/ng` | Angular client package bundled into MJExplorer; provides generated entity forms. |

---

## 🛠️ Development Workflow

### Prerequisites
- Node.js ≥ 20
- npm ≥ 10
- MemberJunction CLI (`@memberjunction/cli`)

### Setup & Local Builds

```sh
# Install workspace dependencies
npm install

# Build all packages across the monorepo
npm run build:packages

# Run test suites
npm run test
```

### Managing Migrations & Schema Evolution

MoreCheese follows MemberJunction's **Publish-Then-No-Breaking-Changes Policy**:
1. All database migrations live in `migrations/` as timestamped Skyway scripts (`V<YYYYMMDDHHMM>__<description>.sql`).
2. Run migrations against your target database:
   ```sh
   npx mj migrate --schema morecheese_members --dir ./migrations
   ```
3. Regenerate strongly-typed entity classes and Angular forms:
   ```sh
   npx mj codegen
   ```
4. Push application metadata (apps, navigation items, entity permissions):
   ```sh
   npx mj sync push --dir ./metadata --format=json
   ```

---

## 📜 Standards & Guidelines

- **Zero `any` Types**: Strict adherence to complete TypeScript typing; no `any`, `unknown` shortcuts, or dynamic `.Get()`/`.Set()` bypasses.
- **BaseSingleton Architecture**: All singleton services extend `BaseSingleton<T>` to guarantee global isolation across multi-bundle environments.
- **Server-Persisted User Preferences**: UI preferences and state persist via `UserInfoEngine` server-side settings, never ephemeral browser `localStorage`.
- **Modern Angular**: Standalone components, `@if`/`@for`/`@switch` template block syntax, and modern `inject()` dependency injection.

---

## 📄 License

MIT © MemberJunction / Blue Cypress
