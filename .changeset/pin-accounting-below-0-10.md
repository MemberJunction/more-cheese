---
"@mj-biz-apps/more-cheese-entities": patch
"@mj-biz-apps/more-cheese-server": patch
"@mj-biz-apps/more-cheese-ng": patch
---

Pin `mj-bizapps-accounting` to `>=0.4.0 <0.10.0`. bizapps-accounting 0.10.0 (2026-09-21) adds `V202609202352__v0.10.0__Predictive_Journal_Entry_Anomaly_Fields.sql`, which fails on a fresh database with `Violation of UNIQUE KEY constraint 'UQ_EntityField_EntityID_Sequence'`, so `mj app install more-cheese` — which resolves the newest accounting in range — has been failing for every new consumer since that release. Widen the range again once accounting ships a fix.
