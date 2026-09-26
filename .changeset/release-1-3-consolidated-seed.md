---
"@mj-biz-apps/more-cheese-demo": minor
---

Consolidated v1.3.x release seed: one Metadata_Sync migration carrying the Knowledge Hub content (tags, content items, chunks, item tags) and the person seniority levels and job functions, replacing the per-change delta. Requires bizapps-common >= 5.46.0. Also raises the bizapps-common floor to 5.46.0 and restores the bizapps-accounting range to <1.0.0: 0.13.0 installs cleanly on a fresh database and the seed applies to it with identical data to 0.9.0.
