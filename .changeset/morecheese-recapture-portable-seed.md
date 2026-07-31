---
"@mj-more-cheese-demo/entities": minor
"@mj-more-cheese-demo/server": minor
"@mj-more-cheese-demo/ng": minor
---

Install seed re-captured against a database built from the shipped baseline, so the seed
installs on ANY fresh database rather than only on the one it was recorded against. Fixes four
defects that a from-scratch install exposed and no gate could see: the CodeGen migration ran
after the captures that need its regenerated procs; the platform pack used an undeclared
variable; the captures embedded 16 CodeGen-minted entity ids; and the ProductTypes migration
pinned an EntityField id. Sonar factor weights are now fractions of one (they rendered as
200%/300%). Verified end to end: fresh database + 7 dependency apps + these 6 migrations = all
green, row counts exact against the canonical packs.
