---
"@mj-more-cheese-demo/entities": minor
"@mj-more-cheese-demo/server": minor
"@mj-more-cheese-demo/ng": minor
---

Convert the demo dataset to the metadata-sync migration model: replace the 10 `Seed_*` data migrations + 3 DDL migrations + separate CodeGen migration with one consolidated schema+CodeGen baseline plus the 97,457-record demo dataset captured via `mj sync push` (split into two migration parts to stay under GitHub's 100 MiB per-file limit; FK-safe order preserved). Also fixes the datagen emitter (`@lookup:MJ: Entities` names + drops phantom LineKey/PaymentKey columns) and regenerates the client `public-api.ts` + codegen output so the app builds. Minor bump per the repo policy that migrations require at least a minor.
