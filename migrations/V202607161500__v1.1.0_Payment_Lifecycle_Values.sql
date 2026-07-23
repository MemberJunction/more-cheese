-- ============================================================
-- MoreCheese: payment lifecycle status values (v1.1.0)
-- The enrichment batch (2026-07-16) adds Failed/Denied attempt rows and
-- in-flight (InProgress) settlements to the payment stream — a deliberate
-- causal-vs-noise mix (low-affluence card failures + a pure-noise floor).
-- Value-list change per the MJ migration rules: drop + re-add the CHECK;
-- CodeGen regenerates the TypeScript union on next run.
-- ============================================================

ALTER TABLE morecheese_orders.Payment DROP CONSTRAINT CK_Payment_Status;
GO
ALTER TABLE morecheese_orders.Payment ADD CONSTRAINT CK_Payment_Status
    CHECK (Status IN ('Captured', 'InProgress', 'Failed', 'Denied', 'Refunded'));
GO
