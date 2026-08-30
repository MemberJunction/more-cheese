# @mj-more-cheese-demo/entities

## 1.1.0

### Minor Changes

- b227098: Demo data: close two empty buckets, six committees, a real staff workspace, and addresses that survive being looked at.

  The platform seed migration is re-emitted because the staff workspace grew (8 saved views, 7 queries, 8 notifications). No schema change — the seed carries data only.

- 11a43bb: Install seed re-captured (122,218 records, current with the tree), the duplicate Sonar metadata migration deleted, and the delivery model documented in `datagen/DELIVERY.md`.
- f6d3a45: Identity columns on the member and organization profiles: country, postal address, and voluntary self-identified demographics (race/ethnicity, Hispanic origin, pronouns, primary language). Adds the columns to the baseline schema and folds the CodeGen regeneration — base views, CRUD stored procedures and update triggers for the two changed tables — into a migration, with the regenerated entity subclasses, resolvers and form components.
- MemberJunction 6.1 compatibility. Raises every `@memberjunction/*` peer/dev pin from `^5.43.0` to `^6.1.0-edge.4` and lifts `mj-app.json` `mjVersionRange` to `>=6.1.0-edge.4 <7.0.0`, so the app installs and resolves against an MJ 6.1 host.

  Two dependency fixes the MJ 6 pin change forced. MJ 6.1's `@memberjunction/ng-base-forms` relaxed its Angular peers from exact (`21.1.3`) to caret (`^21.1.3`); with the previously undeclared `@angular/animations` and `@angular/router` free to float, npm resolved them to 21.2.x and then demanded a matching `@angular/core`, conflicting with this repo's pinned 21.1.3. Both are now declared explicitly at 21.1.3 in the root dev dependencies and mirrored as `>=21.0.0 <22.0.0` peers on `@mj-more-cheese-demo/ng`, alongside the existing Angular entries.

  The lockfile is regenerated; it had carried stale `packages/Actions` and `packages/CoreEntitiesServer` workspace entries for directories that no longer exist, which made a clean install unresolvable.

  No source changes — all three packages compile unmodified against 6.1.0-edge.4.

  Also drops a dead `ignore: ["mj_*"]` glob from `.changeset/config.json`. No package in this repo has ever matched it, and changesets treats an unmatched ignore glob as a hard validation error — so `npm run version` (which `publish.yml` calls) failed before it could bump anything. Removing it is what makes the release pipeline runnable.

- 52313cf: More Cheese demo 1.0.0 build. Consolidated prerelease changeset covering: the metadata-sync migration conversion (97,457-record dataset captured as split migrations, replacing the Seed\_\* data migrations), datagen emitter fixes, regenerated public-api + codegen, and the accumulated data enrichment (committees, data-quality-labels, payment-lifecycle, programs).
- dd279f3: Install seed re-captured against a database built from the shipped baseline, so the seed
  installs on ANY fresh database rather than only on the one it was recorded against. Fixes four
  defects that a from-scratch install exposed and no gate could see: the CodeGen migration ran
  after the captures that need its regenerated procs; the platform pack used an undeclared
  variable; the captures embedded 16 CodeGen-minted entity ids; and the ProductTypes migration
  pinned an EntityField id. Sonar factor weights are now fractions of one (they rendered as
  200%/300%). Verified end to end: fresh database + 7 dependency apps + these 6 migrations = all
  green, row counts exact against the canonical packs.
- 76964d8: Sonar ships engagement-model DEFINITIONS instead of pre-computed scores, so Sonar's own FactorCompiler computes them. The factors were previously authored as documentation of derived numbers and were not executable — the app reported "factor has no data source". Rewritten to the shape Sonar's compiler expects (Declarative, a supported aggregation, a linked source-related entity, and an empty relationship path so the FK route resolves automatically), then broadened to 8 factors with rolling windows, a Recency factor and differentiated weights. Verified by running a real recompute: 2,028 members spread 44/23/27/5 across the bands, with the flagship personas landing where their stories say. The sonar data migration drops from 39 MB to 68 KB and captures in seconds rather than minutes.
