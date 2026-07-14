# BizApps Coverage — what the generator produces per open app

What gets generated into which app's schema, what the shapes are based on, and how each
claim was verified. Updated 2026-07-14 (committees + forms landed).

## The ownership rule (who does what — settled 2026-07-14)

**Apps own schemas. Datagen owns data. The generator wrote our migrations exactly once.**

- Every bizapp's schema comes from installing that app (its own migrations) — declared as
  dependencies in `mj-app.json` (bizapps-common, committees, forms; install order
  guaranteed). Apps we don't generate for (e.g. sonar, a CONSUMER that scores our data)
  are covered by the same mechanism — datagen never needs to know they exist.
- The `morecheese_*` shapes were frozen ONCE into
  `migrations/B202607141200__v1.0.0_MoreCheese_Baseline.sql` — from here on, migrations own
  them (immutable, additive-only, hand-authored `V*` files for every change).
- `emit-schema` is a DEV SHIM for throwaway playgrounds; it never ships. A suite
  drift-guard asserts the generator's shapes still match the frozen migration.

## The rule

Each domain's **system of record** is the bizapps app that owns it; MoreCheese keeps
extension tables for what upstream doesn't model. Where an app has **frozen baseline DDL**
in its public repo, we target its REAL shapes via IF-guarded stand-in tables (a genuine
install wins and the same seed files load into it). Where it doesn't, we keep a sanctioned
`morecheese_*` stand-in until it does.

## Coverage matrix

| App | Schema | Entity prefix | Tables generated | What's in them |
|---|---|---|---|---|
| **bizapps-common** | `__mj_BizAppsCommon` | `MJ_BizApps_Common: ` | **2 of 10** — Person, Organization | 1,998 identity rows (name, deterministic `@example.com` email, Status) + 637 orgs (Name, Status incl. 52 `Dissolved` mapped from lifecycle events) |
| **bizapps-committees** | `__mj_BizAppsCommittees` | `Committees: ` | **7 of 17** — Type, Role, Committee, Term, Membership, Meeting, Attendance | 4 authored committees, 2-year terms, θ-driven volunteering (~6% of members), quarterly meetings, calibrated 75% attendance; Gwen chairs Food Safety |
| **bizapps-forms** | `__mj_BizAppsForms` | `MJ_BizApps_Forms: ` | **7 of 10** — Form, FormVersion, FormPage, FormQuestion, FormDistribution, FormResponse, FormResponseAnswer | The post-conference survey (D10 optional pack): per-year Email distributions, 35% calibrated response rate, NPS/Rating/YesNo answers riding the engagement dial |
| **bizapps-orders** | *(not targeted)* | — | **0** — app is pre-implementation | `morecheese_orders` is the **sanctioned stand-in** (Marcelo memo §2.4): Product/Order/OrderLine/Payment in our shapes until their Subscription + renewal-Order tables exist; then period rows decompose into their model |
| **MoreCheese (ours)** | `morecheese_members/_events/_learning/_orders` | `MoreCheese: ` | 11 tables | MemberProfile + OrganizationProfile (the extension rows carrying everything upstream doesn't model), MembershipPeriod, events, learning, money |

**Not targeted, by design:** bizapps-accounting (design still churning), bizapps-tasks /
-issues (consumption side — they'd reference our people via the polymorphic pattern, out of
scope until those demos compose), bizapps-sonar (a CONSUMER — it scores our data),
-caliber, -secure-messaging.

## Shape sources (the authority for every column)

| Schema | Copied from |
|---|---|
| `__mj_BizAppsCommon` | bizapps-common `migrations/B202602271452__v1.0.x_Schema_and_Tables.sql` (checked out locally) |
| `__mj_BizAppsCommittees` | bizapps-committees `migrations/B202602151200__v1.0__Committees_Baseline.sql` (fetched from the public repo) |
| `__mj_BizAppsForms` | bizapps-forms `migrations/B202606281200__v0.1.x_Schema_and_Tables.sql` (fetched from the public repo) |
| `morecheese_*` | **frozen** — `migrations/B202607141200__v1.0.0_MoreCheese_Baseline.sql` (converted once from the generator's proven shapes, 2026-07-14; migrations own them from here) |

## How "correct" was verified (evidence, not vibes)

1. **Column shapes** — copied verbatim from the baseline migrations above (names, types,
   nullability); stand-ins omit only their FKs to tables we don't stand in (`__mj.User`,
   lookup tables).
2. **Install** — all 7 packs load green onto a cloned real MJ database; **every FK
   constraint reports trusted** (SQL Server validated each row).
3. **CHECK conformance** — our stand-ins don't enforce their CHECK constraints, so this is
   verified out-of-band: all 15 applicable CHECKs (Person/Org/Committee/Term/Membership/
   Meeting/Attendance/Form/Version/Question/Distribution/Response statuses and enums)
   parsed from their migrations and tested against the emitted packs — **15/15 conformant**
   (2026-07-14). Loading into a genuine install would not violate a constraint.
4. **Entity names** — CodeGen (scoped by `mj.config.cjs` name rules matching each app's own
   config) minted **exactly** the names the mj-sync emitter assumes — all 27 entities.
5. **Sync round-trip** — `mj sync push` against the registered entities reconciles the
   emitted metadata tree with the SQL-loaded rows as the same records (pinned uuidv5 IDs).
6. **Statistical gates** — the 68-gate validator covers the new packs: referential closure,
   participation share, one-chair-per-populated-term, attendance rate, response rate, NPS
   mean, hero seat pins.

## Known limits (what "correct" does NOT claim)

- **Stand-ins don't enforce** their CHECKs/DEFAULTs — conformance is verified (above), not
  constrained. A genuine app install is stricter and our data passes it by construction.
- **Unfilled nullable identity fields**: Person Title/Phone/DateOfBirth/Bio/PhotoURL,
  Organization LegalName/Website/Email — empty until there's a demo need (text generation
  is a known non-goal so far).
- **Their lookup/seed tables are not ours to fill** (OrganizationType, FormCategory,
  FormStyle, RelationshipType…) — nullable references left NULL; genuine installs seed
  their own via their metadata-sync migrations.
- **Slices, not full apps**: committees has no motions/votes/ballots/minutes; forms has no
  question options or partial responses. Each grows when a demo story needs it.
- **Schema-level verification only** — not yet exercised through the apps' own UIs or
  entity subclasses at runtime.
- **Committees/forms benchmark targets are labeled ESTIMATEs** in the ruleset (6% serve,
  75% attendance, 35% response) pending real sources — unlike the membership numbers,
  which trace to verified 990s/benchmarks.
