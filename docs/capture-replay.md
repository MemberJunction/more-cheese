# Configuration Capture and Replay Guide

This document describes the design, workflow, and repeatable command sequence for capturing and replaying application configuration in **More Cheese**, separating hand-curated application configuration from synthetically simulated world model data.

---

## 1. Architectural Architecture: Partitioning Config vs. Simulation

More Cheese enforces a strict two-partition repository architecture verified by `scripts/check-ownership.mjs`:

1. **`generated/` (Synthetic World Model Data)**:
   - Synthetic world model dataset representing the International Cheese Foundation (ICF) longitudinal history.
   - 54 entity directories (3,058 People, 641 Organizations, 7,018 Membership Periods, 16,875 Event Registrations, 15,420 Orders, 17,075 Order Lines, etc.).
   - Governed by the 41-entity domain model in `data/domain.json`, ruleset modules in `data/ruleset/*.json`, and validated against 173 validation gates via `npm run validate:loom`.
   - Deterministic profile images and organization logos via Loom `AvatarGenerator` / `LogoGenerator` (declared on `PhotoURL` / `LogoURL` in `data/domain.json`) and verified by `npm run generate`.

2. **`config/` (Application & Platform Configuration)**:
   - Hand-authored or captured from runtime MemberJunction applications.
   - Contains 11 configuration entities cataloged in `data/config-entities.json`.
   - Never overwritten or modified by Loom datagen runs.
   - Checked for referential closure against `generated/` by `scripts/check-metadata-closure.mjs`.

---

## 2. Configuration Entities Catalog (`data/config-entities.json`)

The 11 configuration entities managed under `config/` are:

| Directory | Entity Name | Purpose |
|---|---|---|
| `ai-vendors` | `MJ: AI Vendors` | External AI vendor definitions (Anthropic, OpenAI, etc.) |
| `ai-models` | `MJ: AI Models` | Model definitions and context parameters |
| `ai-model-vendors` | `MJ: AI Model Vendors` | Mappings between AI models and vendors |
| `sonar-score-models` | `MJ_BizApps_Sonar: Score Models` | Sonar churn and engagement score models |
| `sonar-score-model-versions` | `MJ_BizApps_Sonar: Score Model Versions` | Versioned score model specifications |
| `sonar-factors` | `MJ_BizApps_Sonar: Factors` | Scoring factor definitions (Conference Attendance, Dues Recency, etc.) |
| `sonar-model-factors` | `MJ_BizApps_Sonar: Model Factors` | Model-to-factor weightings and coefficients |
| `sonar-time-windows` | `MJ_BizApps_Sonar: Time Windows` | Temporal aggregation windows (Quarterly, Annual) |
| `sonar-score-band-sets` | `MJ_BizApps_Sonar: Score Band Sets` | Risk and engagement tier sets |
| `sonar-score-bands` | `MJ_BizApps_Sonar: Score Bands` | Score thresholds (Low, Medium, High Risk) |
| `sonar-model-related-entities` | `MJ_BizApps_Sonar: Model Related Entities` | Dependent entity traversal bindings |

---

## 3. The Repeatable Capture Loop

When new configuration is authored in a running MemberJunction instance (e.g., new Sonar score models or AI vendor setups), follow this capture procedure:

### Step 1: Export Targeted Configuration
Use MemberJunction Sync CLI to extract only the declared configuration entities from the database:
```bash
# Export the target config entities to a staging location
mj sync pull --entities "MJ_BizApps_Sonar: Score Models,MJ_BizApps_Sonar: Factors,MJ_BizApps_Sonar: Time Windows" --output-dir staging/config
```

### Step 2: Key & Identity Stabilization
1. Ensure all captured records preserve deterministic GUIDs or stable organic keys.
2. Remove developer-specific or ephemeral environment timestamps.
3. Verify that external references (such as `OwnerUserID` or `@lookup` expressions) resolve against standard Core or BizApps catalogs.

### Step 3: Placement in `config/`
Move the verified files into their respective directory under `config/<directory>/.<directory>.json`. Ensure `config/.mj-sync.json` includes every active directory in its `directoryOrder` array.

---

## 4. Replay & Verification Procedure

Any developer or CI runner can verify and replay the configuration against the world model with the following three gates:

```bash
# 1. Verify ownership boundary (asserts config/ is non-empty and unpolluted by Loom)
npm run check:ownership

# 2. Verify referential closure and financial integrity across config/ and generated/
node scripts/check-metadata-closure.mjs

# 3. Verify Loom data project conformance and full dataset gates
npm run validate:loom
```

All three commands must exit `0` with zero orphan foreign keys, zero duplicate primary keys, and complete referential closure.
