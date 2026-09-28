# 🧀 Predictive Studio Integration in MoreCheese

This document details how **MoreCheese** (the International Cheese Federation reference implementation) integrates **MemberJunction Predictive Studio** to deliver real-time renewal risk intelligence, feature impact analysis, and bidirectional drill-down capabilities.

---

## 1. Architectural Overview & Transactional Foundation

In enterprise associations and trade organizations, member lifecycle state and churn risk are derived from actual commercial engagement rather than isolated static status fields. 

### Retirement of Synthetic `Membership Periods`
MoreCheese previously modeled membership spans using an intermediate synthetic table (`morecheesemembers_MembershipPeriod`). To align with canonical MemberJunction BizApps patterns:
1. **Entity Retirement**: The `morecheesemembers_MembershipPeriod` table and entity metadata were retired via migration `V202609200930__v1.2.x__Retire_Membership_Periods_Entity.sql`.
2. **Canonical Data Pipeline**: Member status, continuous tenure, expiration milestones, and renewal risk are derived directly from canonical BizApps transactions:
   - `MJ_BizApps_Orders: Orders` & `Order Lines` (Membership dues, recurring subscriptions, product purchases)
   - `morecheese_events: Event Registrations` (Symposiums, World Cheese Cup entries)
   - `morecheese_learning: Certifications & Course Enrollments` (Master cheesemaker credentials)
   - `MJ: Activities` (Inquiries, committee participation, portal sessions)

---

## 2. Person Membership Panel (`PersonMembershipPanel`)

The `PersonMembershipPanel` in `packages/Angular/src/lib/custom/form-panels/` decorates the canonical `Person` entity record form with an association-specific intelligence cockpit:

- **Membership Status & Expiration**: Computes active vs. lapsed membership dynamically by querying the person's paid order lines for membership product SKUs.
- **Renewal Risk Metric Card**: Integrates with Predictive Studio's ML scoring pipeline to display:
  - **Risk Tier**: `Low`, `Medium`, `High`, or `Critical` with semantic badge coloring.
  - **Churn Probability**: Precise calibrated probability score (e.g., `82%`).
  - **Confidence Bounds**: Estimated confidence interval around the score.
- **Key Risk & Retention Drivers**: Breaks down the top positive factors (e.g., active committee service, recent event attendance) and negative factors (e.g., declining purchase cadence, overdue renewal notice) that influenced the model.
- **Two-Way Navigation**: Direct deep link to open the full Predictive Studio model cockpit for the current member.

---

## 3. Two-Way Deep Linking & Origin Tracking

MoreCheese fully leverages MemberJunction's bidirectional navigation and origin crumb architecture:

1. **Record Form → Predictive Studio**:
   - Operators inspecting a high-risk member can click the **Predictive Studio** icon in the membership panel to launch the model cockpit with that model pre-selected.
2. **Predictive Studio → Record Form**:
   - In Predictive Studio, inspecting evaluation rows or predictions provides a 1-click drilldown to open the target entity record (e.g., `Person` or `Order`).
   - The record tab opens displaying the record's user-friendly name (e.g., "ORD-00042") rather than raw database keys.
   - An **Origin Crumb** sits at the top of the record pane showing:
     - `Back to Predictive Studio › Model Name`
     - Clicking the crumb restores the exact studio view and grid position without state loss.

---

## 4. Verification & Testing

Unit tests in `packages/Angular/src/lib/custom/form-panels/person-membership-renewal-risk.test.ts` verify:
- Accurate membership determination from orders and line items.
- Grace period and lapse status calculations.
- Extraction and normalization of Predictive Studio feature impacts and risk tiers.
- Resilience when no prior prediction or orders exist for a newly created contact.
