---
"@mj-biz-apps/more-cheese-entities": minor
"@mj-biz-apps/more-cheese-server": minor
"@mj-biz-apps/more-cheese-ng": minor
---

Adds the six named ICF staff as MJ sign-in users with the `UI` role: Marguerite Ashdown (Chief Executive Officer), Desmond Oyelaran (VP, Membership), Ingrid Halloway (VP, Marketing), Ruben Castellanos (Events Director), Wei-Lin Tsai (Membership Operations Analyst) and Noor Rahimi (Communications Manager). Their sign-ins are `@morecheese.example` addresses. They are staff only, with no Person record, membership, orders or committee seats, and the teardown migration retires the six users and their role assignments. Adds three staff team Spaces (ICF Staff, Membership Team, Events & Communications), loaded by `scripts/load-spaces.mjs` from `data/spaces/`. Depends on the `UI` role that MJ core seeds.
