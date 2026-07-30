---
"@mj-more-cheese-demo/entities": minor
"@mj-more-cheese-demo/server": minor
"@mj-more-cheese-demo/ng": minor
---

Sonar ships engagement-model DEFINITIONS instead of pre-computed scores, so Sonar's own FactorCompiler computes them. The factors were previously authored as documentation of derived numbers and were not executable — the app reported "factor has no data source". Rewritten to the shape Sonar's compiler expects (Declarative, a supported aggregation, a linked source-related entity, and an empty relationship path so the FK route resolves automatically), then broadened to 8 factors with rolling windows, a Recency factor and differentiated weights. Verified by running a real recompute: 2,028 members spread 44/23/27/5 across the bands, with the flagship personas landing where their stories say. The sonar data migration drops from 39 MB to 68 KB and captures in seconds rather than minutes.
