// HOW THIS PROJECT'S PACKS BECOME SQL — the install path, and the second half of the framework test.
//
// The fixture had no seed mapping, which meant Phase 5 proved the GENERATION path generalises and
// said nothing about installation. Everything below exists to find out whether the emitters are as
// project-blind as the generators turned out to be.
//
// Deliberately minimal and INVENTED: `[fixture_circle]` is not a real schema and these rows are
// never installed anywhere. The mapping's job here is to exercise the emitter surface — deterministic
// IDs, a polymorphic entity reference, an install order, a preamble — not to load.

import { uuidFor } from '../../engine/ids.mjs';
import { sqlStr, sqlNum, sqlBit, sqlDate, sqlId } from '../../engine/seed-render.mjs';

/** Entity-name → SQL variable, resolved by the PREAMBLE at install time. Entity IDs differ per
 *  install, so they can never be hardcoded — the same rule MoreCheese's mapping follows. */
/** How this project is named in generated artifacts (the directory slug is 'fixture'). */
export const DISPLAY_NAME = 'Fixture Circle';

export const MJ_ENTITY_VAR = {
  'Fixture: Members': '@E_Members',
};

/** RefKind → uuidFor() entity prefix, for polymorphic references. This project has none, but the
 *  export must exist: cli/validate.mjs-style consumers read it, and an absent one reads as "no
 *  kinds are mapped" rather than "this project has no polymorphic refs". */
export const RECORD_PREFIX = { member: 'member' };

export const MAPPING = {
  circle: [
    {
      json: 'members', dir: 'members', entity: 'Fixture: Members', table: '[fixture_circle].[Member]',
      columns: (r) => ({
        ID: sqlId(uuidFor('member', r.MemberNumber)),
        MemberNumber: sqlStr(r.MemberNumber),
        FirstName: sqlStr(r.FirstName),
        LastName: sqlStr(r.LastName),
        JoinYear: sqlNum(r.JoinYear),
        PreferredKind: sqlStr(r.Kind),
        IsFixture: sqlBit(r.IsFixture),
      }),
    },
    {
      json: 'outings', dir: 'outings', entity: 'Fixture: Outings', table: '[fixture_circle].[Outing]',
      columns: (r) => ({
        ID: sqlId(uuidFor('outing', r.OutingKey)),
        // the FK is DERIVED, not looked up: same business key → same uuid, in both directions
        MemberID: sqlId(uuidFor('member', r.MemberNumber)),
        OutingKey: sqlStr(r.OutingKey),
        Year: sqlNum(r.Year),
        KindKey: sqlStr(r.KindKey),
        WentOn: sqlDate(r.WentOn),
        IsFixture: sqlBit(r.IsFixture),
      }),
    },
  ],
};

/** The pack pyramid — one pack here, so one entry. */
export const INSTALL_ORDER = ['circle'];

/** Per-pack SQL that must run BEFORE the inserts: resolving entity names to their install's IDs. */
export const PREAMBLE = {
  circle: [
    "DECLARE @E_Members UNIQUEIDENTIFIER = (SELECT ID FROM [__mj].[Entity] WHERE Name = 'Fixture: Members');",
  ],
};

/** Nothing to run after. Declared empty rather than omitted, so a reader can see it was considered. */
export const POSTAMBLE = {};

/** PUSH ORDER for MetadataSync: every parent before its children. Members own outings, so members
 *  push first. This is a statement about THIS project's foreign keys — it is deliberately separate
 *  from INSTALL_ORDER (which is per-pack) because the sync path pushes per DIRECTORY and can
 *  interleave packs. */
export const PUSH_ORDER = ['members', 'outings'];
