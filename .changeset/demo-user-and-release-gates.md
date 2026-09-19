---
"@mj-biz-apps/more-cheese-entities": patch
"@mj-biz-apps/more-cheese-server": patch
"@mj-biz-apps/more-cheese-ng": patch
---

Ship a generic demo operator instead of a staff account. `config/users` now declares **Demo User** (`demo.user@morecheese.org`, same record ID) and every owner/lookup in `config/` (conversations, artifacts, dashboards, user applications, roles, Home pins) follows it. This also removes the `UQ_User_Email` collision when the person installing More Cheese is the same person whose address the seed carried.

Release gates: `check:release-seed` now collects the shipped ids into a Set instead of substring-searching each declared id over the joined SQL (quadratic — over an hour on the 340 MB v1.2 seed, four seconds now). `check:seed-cadence` derives a part's generation from its stamp minus (N − 1) minutes, matching how the assembler names parts, and refuses two files that share a stamp (Skyway rejects duplicate versions); the previous rule demanded one shared stamp, which no runner would load.
