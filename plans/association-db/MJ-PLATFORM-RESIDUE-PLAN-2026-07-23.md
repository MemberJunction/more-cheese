# MJ platform "usage residue" — the `platform` pack (plan)

> **Addendum 2026-07-23 (later):** the same team request extended to **Sonar** — a 12th
> pack (`sonar`, seed migration slot 2352) seeds one engagement score model
> (`morecheese-engagement`) over the member spine: 6 weighted factors DERIVED from pack
> facts at quarterly snapshots, bands/transitions/recompute-runs, owner = the staff
> personas below. Rules rendered into `ruleset/RULESET.md` (platform + sonar sections).
> Constraint notes: bizapps-sonar CHECK lists honored from its Initial_Schema;
> `ScoreModel.Slug` is UNIQUE and the Sonar demo DB already owns three engagement slugs;
> the ScoreModel⇄Version circular FK is resolved by a pack POSTAMBLE UPDATE.

**Date:** 2026-07-23 · **Status:** BUILT + VERIFIED 2026-07-23. Suite green (validation
suite at spot / canonical). Verified three ways: (1) fresh full install (all 16 migrations,
row-level audit green); (2) live-stack UI pass — MJAPI served the pack; the reusable
query rendered in Explorer, the Chat app listed + opened the seeded conversation
(saved-view GRID rendering unwitnessed there: the only available Explorer client was
v5.39 against the v5.45 API — client-version skew, not a data issue; record forms need
the app repo's own codegen); (3) two-phase incremental — a DB installed through Seed_10
took Seed_11 alone as an update, 12-point row audit green (309 audit rows, 0 orphaned
FKs, tokens all substituted, outreach list == pending set 50/50). HARDENING from the UI
pass: shared views now ship GridState (sort + column layout; columns verified against
generated views incl. FK display columns) + FilterState, shaped like what Explorer
writes on save; gate requires a parseable layout with ≥3 visible columns.
**Requirement (team, 2026-07-23):** MoreCheese data should also touch MJ core and populate
its features so the instance looks like someone has actually used the platform — the same
move the forms pack made for bizapps-forms, applied to `__mj` itself.

## What the survey established (MJ core, from source)

- The relevant `__mj` tables are plain data: **no integrity hashes, no insert triggers,
  standard FKs** — all safe for data-only seed migrations. (`RecordChange` has a
  convenience sproc but direct INSERT is fine.)
- The line we never cross: `__mj` **application data** (views, conversations, audit rows)
  is fair game; `__mj` **entity-definition** rows stay CodeGen's (existing emitter rule).
- The decisive design axis is **visibility**: some artifacts render for ANY logged-in
  viewer (shared views `IsShared=1`, reusable queries, record-change history on any
  record's detail pane); others are private to the owning `UserID` (conversations,
  favorites, lists, notifications, personal views/dashboards).

## Design

New **`platform` pack — pack 11, last in `INSTALL_ORDER`** (seed slot 2351). Foundation:
**3 staff users** (membership director, events coordinator, membership ops analyst) with
`@morecheesefederation.example` emails (reserved TLD — non-deliverable by construction),
`Type='U'`, `IsActive=1`; roles attached by **name lookup** (F6 pattern, like committee
Roles); Environment + Entity IDs resolved in the pack preamble the same way.

### Tier 1 — visible to every viewer (build first)

1. **`RecordChange` audit backfill** — highest value. Derive from timelines the packs
   already contain, never invent: issue status transitions (New → In Progress → Resolved
   at the generated dates), membership-period renewals, stale-employer corrections, task
   completions. Emit `Create` + `Update` rows with real `ChangesJSON` diffs and
   `FullRecordJSON` computed from pack data at emit time. Every hero record gets a
   history instead of appearing ex nihilo.
2. **Shared saved views** (`UserView`, `IsShared=1`) on our entities — what a real
   membership team would keep: "Lapsed 2025 — win-back", "Open billing issues",
   "Active committee chairs", "Gold award winners 2025". `WhereClause` is plain SQL
   against real generated columns (self-verifying at install).
3. **Reusable saved queries** (`Query`, `Reusable=1`, `SQLDialectID` by lookup) —
   "Renewal rate by year/segment", "NPS by conference". Double payoff: these are also
   **Skip's entry points**, the one open Skip item in
   `APP-INTEGRATION-DEFINITION-2026-07-22.md` §1.

### Tier 2 — per-user private (build ONLY if demos log in as a staff persona)

4. **Conversations + ConversationDetails** — 2–3 Skip-style analysis threads whose
   assistant turns state TRUE facts from the data (at-risk members named correctly, with
   the engineered signals as the stated reasons). Pre-seeded intelligence proof.
5. Favorites, Lists ("Renewal outreach — July" = exactly the members the renewal-outreach
   tasks target), a few unread `UserNotification` rows.

### Tier 3 — deliberately skipped for now

Dashboards / Reports require valid `UIConfigDetails` / `Configuration` JSON; a wrong blob
renders a broken page — worse than absence. If ever wanted: author one real dashboard in
the UI once, capture its JSON as a checked-in fixture (the forms-fixtures move).

## Mechanics (rides existing rails unchanged)

- Deterministic `uuidFor` IDs, new prefixes: `mjuser`, `uview`, `query`, `recchg`,
  `conv`, `convmsg`, `fav`, `list`, `listitem`, `notif`.
- Pack preamble DECLAREs: Role by name, default Environment by name, `__mj.Entity` IDs
  by name (existing polymorphic pattern).
- Emitters: additive `platform:` block in `engine/seed-mapping.mjs` + `INSTALL_ORDER`
  entry — both emitters pick it up for free.
- Gates: FK integrity; every `RecordChange.ChangedAt` falls inside the subject record's
  real date window and its diff matches the pack fact it mirrors; `WhereClause`/query SQL
  columns exist in the frozen schema; user emails on `.example`.
- Byte-surface: packs 1–10 untouched by construction (new streams only).

## Risks / notes

- These are **MJ-core tables** — shapes can drift across MJ versions. The pack inherits
  the app's existing mjVersionRange pin; re-verify columns on any MJ core bump (runbook
  F1/F8 discipline).
- `RecordChange.FullRecordJSON` must match the actual seeded record — compute from the
  same pack row at emit time, never hand-write.
- Conversations seeded as static rows are transcripts, not live Skip sessions — they
  complement, not replace, the Skip proof run.

## Resolved (2026-07-23)

Demos WILL log in as a staff persona (team ruling) → **Tier 2 is in scope**: seeded
conversations, favorites, lists, and notifications hang off the staff users and will be
seen. Build = Tier 1 + Tier 2; Tier 3 stays skipped.
