// WHERE EACH MIX LANDS — the one thing an engine cannot work out for itself.
//
// A mix declares weighted options; this says which column the draw ends up in. From those two
// facts engine/checks.mjs derives the presence floor: every option with positive weight must
// actually APPEAR in the data.
//
// Why a floor and not a share: a category whose expected share is 0.5% passes a ±6-point band at
// exactly ZERO rows. Critical-severity tickets sat at zero for weeks while every gate stayed
// green, because no percentage check can notice an entirely missing category. Declaring the
// landing site makes that class of hole structurally impossible — add an option to a mix and it is
// immediately required to show up.
//
// DENOMINATORS. A mix often applies to a SUBSET of the landing table — the Educator legal
// structures apply only to educator organisations — so each declaration states its own pool.
// An option is required to appear only when weight x pool makes it likely (3 expected, by
// default); rarer ones are reported as too rare at this scale rather than failed. Without this,
// a 12%-weight option over eight eligible rows fails two seeds in seven by luck alone, which is
// how a correct build gets called broken.

/** @type {Record<string, { at: [string, string, string], absentAs?: string[] }>} */
export const mixLandings = {
  // ---- organisations: a legal structure per business type ----
  'orgs.mixes.legalStructureProducer': { at: ['common', 'organizations', 'OrganizationTypeName'],
    poolOf: (rows) => rows.filter((o) => o.Type === 'Producer') },
  'orgs.mixes.legalStructureRetailer': { at: ['common', 'organizations', 'OrganizationTypeName'],
    poolOf: (rows) => rows.filter((o) => o.Type === 'Retailer') },
  'orgs.mixes.legalStructureSupplier': { at: ['common', 'organizations', 'OrganizationTypeName'],
    poolOf: (rows) => rows.filter((o) => o.Type === 'Supplier') },
  'orgs.mixes.legalStructureEducator': { at: ['common', 'organizations', 'OrganizationTypeName'],
    poolOf: (rows) => rows.filter((o) => o.Type === 'Educator') },

  // ---- geography ----
  'geography.mixes.region': { at: ['common', 'people', 'Region'] },

  // ---- why members leave ----
  // Not every reason need appear at pilot scale with only a handful of lapses, but they do at
  // canonical scale — and a reason that NEVER appears is a reason nobody wrote for a demo.
  'membership.mixes.churnReason': { at: ['membership', 'membership_periods', 'CancellationReason'] },

  // ---- governance votes ----
  // The keys here ARE the emitted values, since 2026-08-03: the generator used to hardcode
  // Yes/No/Abstain while the mix said yes/no/abstain, so the declaration only supplied weights.
  'committees.mixes.vote': { at: ['committees', 'committee_votes', 'VoteValue'] },
  'committees.mixes.voteContentious': { at: ['committees', 'committee_votes', 'VoteValue'] },

  // ---- support severity, one mix per ticket type, all landing in one column ----
  'issues.mixes.severityBilling': { at: ['issues', 'issues', 'Severity'] },
  'issues.mixes.severityDataCorrection': { at: ['issues', 'issues', 'Severity'] },
  'issues.mixes.severityEvents': { at: ['issues', 'issues', 'Severity'] },
  'issues.mixes.severityGeneral': { at: ['issues', 'issues', 'Severity'] },

  // ---- programs ----
  // 'None' is modelled as the ABSENCE of a medal, so there is no row carrying it to look for.
  'programs.mixes.medal': { at: ['events', 'competition_entries', 'Result'], absentAs: ['None'] },
  'programs.mixes.advocacyKind': { at: ['membership', 'advocacy_actions', 'Kind'] },
};
