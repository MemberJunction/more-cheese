// COMMITTEES — governance: who serves, when they meet, what they decide.
//
// Targets bizapps-committees' real shapes (migrations/B202602151200, schema
// __mj_BizAppsCommittees, entity prefix 'Committees: '). Slice v1 covers
// Type/Committee/Term/Role/Membership/Meeting/Attendance; ballots, minutes and artifacts are
// out of scope until a demo needs them. Unlocks the Gwen Whitfield persona (ICF-000108) and
// Elena's Standards-seat pin.
//
// ─── THE SHAPE ────────────────────────────────────────────────────────────────────────────
// Four sections, the same four in every behavioural block, nothing else:
//
//   catalog   what EXISTS          lists of things
//   params    every SCALAR         a bare number is used; { target, tolerance } is ENFORCED
//   effects   who DIFFERS          <decision>.<driver>, each with a magnitude and a reason
//   mixes     weighted OPTIONS     one dice roll each
//
// If something fits none of the four, that is a signal — ask before inventing a fifth.
//
// ─── THIS IS DATA ─────────────────────────────────────────────────────────────────────────
// Literals and local constants only. No imports beyond types, no I/O, no Date.now(), no
// Math.random(). Same spec + same seed must always produce byte-identical output, and
// `node cli/check-ruleset.mjs` fails the build if this file can do anything else.

/** @typedef {import('../../../../engine/types.js').CommitteeBlock} CommitteeBlock */

// Committee types. Referenced below by identity, not by re-typing the name — a typo becomes
// a crash at load instead of a committee that silently never gets seats.
const STANDING = { name: 'Standing', isStandards: false, termMonths: 24 };
const TECHNICAL = { name: 'Technical Standards', isStandards: true, termMonths: 24 };

// Roles. `sequence` orders them in the app's roster UI; Member sits at 100 so officer roles
// can be inserted above it later without renumbering.
const CHAIR = { name: 'Chair', isOfficer: true, isVoting: true, sequence: 1 };
const VICE_CHAIR = { name: 'Vice Chair', isOfficer: true, isVoting: true, sequence: 2 };
const MEMBER = { name: 'Member', isOfficer: false, isVoting: true, sequence: 100 };

/** @type {{ committees: CommitteeBlock }} */
export default {
  committees: {
    catalog: {
      types: [STANDING, TECHNICAL],
      roles: [CHAIR, VICE_CHAIR, MEMBER],

      // Six committees. `formed` is load-bearing: a committee gets no terms and no meetings
      // before it existed, which is why the earliest formation (2014) predates the first
      // term (2015) rather than the reverse.
      committees: [
        {
          name: 'Standards Committee',
          type: TECHNICAL,
          formed: '2015-03-01',
          mission: 'Aging, labeling, and raw-milk production standards for member producers.',
        },
        {
          name: 'Food Safety Committee',
          type: STANDING,
          formed: '2014-06-01',
          mission: 'FSMA compliance guidance, recall readiness, and the quarterly food-safety webinar series.',
        },
        {
          name: 'Education Committee',
          type: STANDING,
          formed: '2016-01-15',
          mission: 'Course catalog, certification pathways, and the conference workshop program.',
        },
        {
          name: 'Awards & Competition Committee',
          type: STANDING,
          formed: '2015-01-01',
          mission: 'Judging protocol, category definitions, and stewardship of the annual cheese competition.',
        },
        {
          name: 'Events Committee',
          type: STANDING,
          formed: '2016-09-01',
          mission: 'Annual conference program, regional workshops, and the webinar calendar.',
        },
        {
          name: 'Membership & Outreach Committee',
          type: STANDING,
          formed: '2017-09-01',
          mission: 'Recruitment, retention programs, and chapter development.',
        },
      ],

      // Biennial terms. Governance used to start in 2023 while committees claimed formation
      // dates from 2014-2017 — eight years of missing history, so every roster looked newly
      // minted and no committee had a past. Each term owns its own per-person dice stream
      // (committee-serve:<member>:<termStart>) and its own meeting slots, so back-filling
      // earlier terms is ADDITIVE: it cannot disturb the later ones.
      terms: [
        { name: '2015–16 Term', start: '2015-01-01', end: '2016-12-31' },
        { name: '2017–18 Term', start: '2017-01-01', end: '2018-12-31' },
        { name: '2019–20 Term', start: '2019-01-01', end: '2020-12-31' },
        { name: '2021–22 Term', start: '2021-01-01', end: '2022-12-31' },
        { name: '2023–24 Term', start: '2023-01-01', end: '2024-12-31' },
        { name: '2025–26 Term', start: '2025-01-01', end: '2026-12-31' },
      ],

      // Every meeting opens with these four items, in this order, before any motion.
      standingAgenda: [
        { name: 'Call to order & minutes approval', type: 'Information', minutes: 5 },
        { name: "Chair's report", type: 'Report', minutes: 15 },
        { name: 'Old business', type: 'Discussion', minutes: 20 },
        { name: 'New business', type: 'Discussion', minutes: 15 },
      ],

      // Motion text is drawn from this bank. Deliberately mundane: real governance motions
      // are procedural, and dramatic ones read as invented.
      motionTopics: [
        'Adopt the revised charter language',
        'Approve the quarterly budget request',
        'Publish the draft guidance document',
        'Form a working group on member feedback',
        'Endorse the proposed program changes',
        'Approve co-hosting the regional workshop',
        'Adopt the updated meeting cadence',
        'Approve the speaker honorarium policy',
      ],
    },

    params: {
      // Share of term-start-covered members who serve on a committee.
      // ESTIMATE, low confidence (researched 2026-07-16). No direct published benchmark
      // exists. Consistent with the ASAE Foundation's Decision to Volunteer study
      // (Gazley & Dignam 2008, n=26,305), which found 30% of members have EVER volunteered in
      // any capacity — current committee service is a small subset of that. MGI benchmarking
      // reports publish no members-on-committees share at all.
      volunteerShare: { target: 0.105, tolerance: 0.02 },

      // Committees are CONSTITUTED, not merely volunteered for: bylaws set a floor, and a
      // chair does not run a committee of one. The volunteer draw alone left 7 of 35
      // committee-terms below three members — the early years and newly-formed committees,
      // where the eligible pool was smallest. Short terms are topped up from the most engaged
      // eligible members not already serving, which strengthens the engagement effect rather
      // than diluting it.
      minRosterPerTerm: 3,

      // A returning member usually returns to the SAME committee. Rosters used to be wiped
      // clean every term — 4% carryover, where real committees run 50-70% with staggered
      // seats. Calibration is still to volunteerShare, so this changes WHO fills seats, never
      // how many. ESTIMATE, low confidence: no published association committee-continuity
      // benchmark found.
      sameCommitteeShare: 0.85,

      meetingsStartYear: 2015,
      meetingsPerYear: 4, // Jan / Apr / Jul / Oct

      // Committees schedule ahead, so each carries this many future (Status: Scheduled)
      // meetings past the release date — otherwise the app's "upcoming meetings" view is
      // empty, which is the first governance screen anyone opens. Future meetings have no
      // attendance or motions yet.
      upcomingPerCommittee: 2,

      // SOURCED 2026-07-16, medium-high confidence. Governance-industry bands put >80% =
      // strong, 70-80% = moderate, <70% = a problem (kpidepot.com board-meeting-attendance-
      // rate; boardeffect.com attendance trends). The SEC/public-company norm is directors
      // attending >=75% of board and committee meetings (lexology.com 75%-attendance-test).
      // 75% ±6 spans the moderate band up to the strong threshold.
      attendPresent: { target: 0.75, tolerance: 0.06 },

      excusedShareOfAbsent: 0.4, // of those absent, this share are formally Excused

      motionsPerMeeting: 0.35,

      // A share of motions are contentious — see mixes.voteContentious for the tighter split
      // that lets some genuinely FAIL. Outcome stays derived from the tally (yes > no), never
      // forced; this exists so governance doesn't read as a rubber stamp.
      contentiousShare: 0.35,
    },

    // WHO DIFFERS from the average. Flat <decision>.<driver> keys, so every effect in the
    // domain is visible at once instead of buried inside the decision it modifies.
    // `beta` is log-odds per 1 SD of the driver.
    effects: {
      'volunteer.engagement': {
        beta: 0.9,
        label: 'med-strong',
        note: 'volunteering is an engagement behaviour',
      },
      'volunteer.incumbency': {
        beta: 3.8,
        label: 'strong',
        note: 'already serving in the previous term. Deliberately the strongest effect in the domain: committee seats are sticky in a way no other association behaviour is, and this is what lifts term-over-term carryover into the realistic 45-65% band.',
        evidence: 'ESTIMATE, low confidence — no published association committee-continuity benchmark found; chosen to land carryover in the 45-65% band',
      },
      'attendance.engagement': {
        beta: 0.6,
        label: 'med',
        note: 'Deliberately the weakest of the three governance effects (volunteering is 0.9): by the time someone holds a seat, self-selection has already happened, and turning up is driven more by the obligation of the seat than by enthusiasm. A stronger effect here would double-count the selection already applied at volunteering.',
        evidence: 'ESTIMATE — the attendPresent band is sourced, the by-engagement spread within it is not',
      },
    },

    // Weighted options, one dice roll each. The KEYS are the values that land in the data —
    // they used to be lowercase while the generator hardcoded `Yes`/`No`/`Abstain`, so this mix
    // looked like it declared the options when it only supplied their weights.
    // Votes stay CONSISTENT with attendance by
    // construction: a member absent from the meeting votes 'Absent', never one of these.
    mixes: {
      vote: { Yes: 0.8, No: 0.1, Abstain: 0.1 },
      voteContentious: { Yes: 0.25, No: 0.6, Abstain: 0.15 },
    },
  },
};
