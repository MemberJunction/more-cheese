---
"@mj-biz-apps/more-cheese-entities": patch
"@mj-biz-apps/more-cheese-server": patch
"@mj-biz-apps/more-cheese-ng": patch
---

Public site deploy fixes so the v1.2.0 site actually publishes: the static build now emits one route per URL (Azure Static Web Apps rejected the v1.2.0 config with "a rule was already processed with a duplicate route /faq/cheese-education"), the routing table lives in a dependency-free module the gates can import, and the deploy trigger watches that module. No app or seed changes.
