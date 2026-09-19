# Data checkpoints — versioning the generated demo data (design, not yet built)

**Date:** 2026-07-23 · **Status:** DESIGN RECORDED, implementation deferred
**Problem:** the demo data should version like the app — v1, v2, v3 per quarter — and a user
installing v3 gets **only v3's data**. Migrations are cumulative/append-only by nature, so a
naive "append new V-seeds each quarter" stacks every version's data on top of the last.

## Chosen design (Option A): repeatable seed migrations — data version = app release version

Skyway supports Flyway-style **repeatable migrations** (`R__` prefix) — verified in
`@memberjunction/skyway-core` source:

- `R__{description}.sql`; type `repeatable`; **no version number**.
- Runs **after** all versioned migrations (schema always exists first).
- Re-runs **whenever the file's checksum changes**; tracked in history **keyed by
  Description** (so filenames must stay stable across versions — never embed the version
  in the filename).

The mechanism, simply:

1. Convert the 10 seed data migrations (`V<release>2341–2350`) to repeatables:
   `R__Seed_00_Wipe.sql` + `R__Seed_01_common.sql` … `R__Seed_10_messaging.sql`.
2. These files are a **self-replacing snapshot**: wipe deletes all demo data (reverse
   dependency order), seeds re-insert the current version's data. Whatever was there
   before, the DB ends with exactly this version.
3. **New quarter = overwrite the same files in place** (re-run the generator with the new
   release date; `emit-data-migration` rewrites them; checksums change). No file pileup.
   Tag the repo `v3.0.0`.
4. **Installing a version = installing that tag/release.** Fresh install of v3.0.0 → only
   v3's data. An existing v2 install upgrading in place converges to the same state (wipe
   clears v2 first). Both journeys work with zero new machinery.
5. Every seed file embeds a `-- data-version:` header (version, seed, N, release date,
   ruleset) so all checksums change every version, including the wipe file's.

**Where do old versions live?** In git — same place old code lives.
`git show v2.0.0:migrations/R__Seed_01_common.sql` is v2's exact SQL; installing the
v2.0.0 tag is a full v2 database. And determinism regenerates any version from its
parameters — but the **emitted SQL in the tag is the ground truth**, the generator is just
how we write it. If tooling changes between v2 and v3, that can't break v2: installs run
the SQL in the tag, never the generator; re-deriving v2 means checking out the v2 tag and
running **v2's** generator (same commit) — never v3's tooling with v2's parameters.

**`datagen/versions.json` manifest** — one line per version: `(version, repo tag/commit,
seed, N, releaseDate, rulesetVersion)`. Makes explicit that a data version means "these
parameters through THAT commit's generator."

## Wipe-file details worked out (for whoever implements)

- Derive the wipe from `engine/seed-mapping.mjs` MAPPING (no hand-maintained table list):
  reverse `INSTALL_ORDER`, reverse mapping order within each pack → FK-safe delete order.
- **Do NOT blanket-delete shared/dictionary tables** where the owning app seeds its own
  rows (F6 pattern):
  - `[__mj_BizAppsCommon].[RelationshipType]` — we insert our types but also reference
    bizapps-common's seeded Employee type by literal UUID; full DELETE would nuke theirs
    and re-seed can't restore (their migration won't re-run). Wipe by explicit ID list
    (our uuidFor('reltype', TypeKey) IDs — TypeKeys are stable ruleset constants).
  - `[__mj_BizAppsIssues].[IssueNumberSequence]` — no ID column; delete by ScopeCode.
  - Committees Roles / Issues IssueStatuses are never inserted by us (name-lookup only) →
    never wiped. Correct by construction.
- Everything else (incl. bizapps-common Person/Organization, all dep-app data tables):
  full DELETE, under the explicit ruling that **the demo app owns its instance** — do not
  install MoreCheese demo data into a shared MJ instance holding real bizapp data. Put
  this warning in the wipe file header.
- `${flyway:defaultSchema}` placeholder works the same in R files (applied at execution,
  not tied to migration type).

## Open items before building

1. **Ordering of repeatables among themselves** — resolver processes them in discovery
   order and the scanner returns files "unsorted"; NOT yet verified that `Seed_00_Wipe`
   runs before `Seed_01`. Verify (and if needed sort in one place) before trusting the
   00/01 naming. ← the one unverified fact; was mid-check when work was paused.
2. **Smoke test** the whole loop on a scratch DB via real `mj migrate` (not raw sqlcmd):
   R files run on fresh install, re-run after an in-place edit, wipe+reseed converges.
3. **Timing of the V→R conversion**: clean only while nothing has applied the
   V…2341–2350 band (never-edit-applied rule). v1.0.0 hasn't shipped — convert before it
   does, and confirm with the install-branch owner nothing downstream applied that band.
4. Scratchpad `seed-install.sh`-style raw-glob scripts order `R*` before `V*`
   (ASCII) — fine for skyway installs, wrong for raw sqlcmd replays; apply R files last
   by hand there.

## Alternatives considered (rejected)

- **B — wipe-and-reseed in the versioned band** (`V<date>2340` wipe + 10 new seeds per
  quarter): pure append-only, but fresh installs replay every prior version's full data
  (~13 min each, measured; grows forever) and the working tree keeps every version's SQL.
- **C — data as a separate install artifact** (`seeds/vN/` dirs or per-version data
  package + post-migrate step): most flexible, but invents a second install mechanism
  right after mj-sync was deprecated to make migrations the only path.
