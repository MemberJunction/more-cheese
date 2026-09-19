---
"@mj-biz-apps/more-cheese-entities": patch
"@mj-biz-apps/more-cheese-server": patch
"@mj-biz-apps/more-cheese-ng": patch
---

Pin the sibling entities package exactly rather than by caret range, and
replace the template placeholder text in all three package descriptions.

The three packages move as one fixed changesets group, so a caret range
between them was a compatibility claim that is never true. The descriptions
still carried `TODO(template)` and would have shipped to npm on the first
publish.
