// MORECHEESE'S OWN TYPES.
//
// Moved out of engine/types.d.ts on 2026-08-03. A type naming committees, member numbers and
// certifications is this project's shape, not the framework's — the same reasoning that moved the
// seed mapping. The generic building blocks (Block, TargetPair, Mix, Arrow, Rng, the pattern
// option bags) stay in the engine and are imported here.

import type { Block, TargetPair, Mix, Arrow } from '../../engine/types.js';

/** A pinned person whose story a demo script can rely on. */
export interface Hero {
  memberNumber: string;
  first: string;
  last: string;
  title?: string | null;
  employerName?: string | null;
  segment?: string;
  region?: string;
  city?: string;
  state?: string;
  lat?: number;
  lon?: number;
  /** Pinned engagement dial — never drawn. */
  theta?: number;
  /** Pinned affluence dial. */
  phi?: number;
  /** A pinned engagement ARC keyed by year, for a story that is a trajectory. */
  thetaByYear?: Record<string, number>;
  tier?: string;
  cycleType?: 'calendar' | 'anniversary';
  autoRenew?: boolean;
  joinDate?: string;
  joinYearsAgo?: number;
  anniversaryOffsetDays?: number;
  joinDaysBeforeRelease?: number;
  lapseYear?: number;
  employerEvent?: { year: number; kind: string };
  committees?: { committee: string; role?: string; terms: readonly string[] }[];
  issues?: { type: string; title: string; daysBeforeRelease: number; detail?: string }[];
  certifications?: { key: string; status: string; enrolledOn?: string; awardedOn?: string }[];
  competition?: Record<string, unknown>;
  advocacy?: Record<string, unknown>;
  staleEmployer?: { trueEmployerName: string; monthsAgo: number };
  /** Assertions the VALIDATOR enforces. Add one for every fact your demo says out loud. */
  pins?: Record<string, unknown>;
  [key: string]: unknown;
}

// ─────────────────────────────────────────────────────────────────────────────
// The four-section shape, for ruleset modules written as .mjs.
//
// This is the framework contract a block author works against. It answers, without reading
// any generator source: what sections exist, what goes in each, which fields a thing must
// have, and which numbers the validator will hold you to.
// ─────────────────────────────────────────────────────────────────────────────

export interface CommitteeType {
  name: string;
  /** Standards bodies get the technical-review treatment in the app. */
  isStandards: boolean;
  termMonths: number;
}

export interface CommitteeRole {
  name: string;
  /** Officers are the pool issues get assigned to. */
  isOfficer: boolean;
  isVotingRole?: boolean;
  isVoting: boolean;
  /** Display order on a roster. Member sits at 100 so officer roles can be added above it. */
  sequence: number;
}

export interface Committee {
  name: string;
  /** A REFERENCE to a catalog.types entry — not a string to be matched. */
  type: CommitteeType;
  /** Load-bearing: a committee gets no terms and no meetings before it existed. */
  formed: string;
  mission: string;
}

export interface Term {
  name: string;
  start: string;
  end: string;
}

export interface AgendaItem {
  name: string;
  type: 'Information' | 'Report' | 'Discussion' | 'Vote';
  minutes: number;
}

/**
 * The platform block — the worked example of a block that uses only TWO of the four parts.
 * Nothing here is decided by dice, so `effects` and `mixes` are simply absent. Note that
 * `params` carries a string and a group of flags: a param is anything you set, not only
 * anything you count.
 */
export type PlatformBlock = Block<
  {
    staff: { key: string; first: string; last: string; title: string }[];
    sharedViews: Record<string, unknown>[];
    queries: Record<string, unknown>[];
    conversations: Record<string, unknown>[];
    /** One entry per staff persona — a demo signs in as one of them. */
    favorites: { owner: string; memberNumbers: string[] }[];
    lists: Record<string, unknown>[];
    notifications: Record<string, unknown>[];
  },
  {
    /** Reserved .example TLD — undeliverable by construction. */
    emailDomain: string;
    /** Which back-dated audit trails to forge. */
    recordChanges: Record<string, boolean>;
  }
>;

/** The committees block — the worked example of the four-section shape. */
export type CommitteeBlock = Block<
  {
    types: CommitteeType[];
    roles: CommitteeRole[];
    committees: Committee[];
    terms: Term[];
    standingAgenda: AgendaItem[];
    motionTopics: string[];
  },
  {
    /** Share of covered members who serve. Enforced. */
    volunteerShare: TargetPair;
    /** Bylaw floor: a chair does not run a committee of one. */
    minRosterPerTerm: number;
    /** A returning member usually returns to the same committee. */
    sameCommitteeShare: number;
    meetingsStartYear: number;
    meetingsPerYear: number;
    /** Future Scheduled meetings per committee, so the app's "upcoming" view isn't empty. */
    upcomingPerCommittee: number;
    /** Meeting attendance rate. Enforced. */
    attendPresent: TargetPair;
    excusedShareOfAbsent: number;
    motionsPerMeeting: number;
    contentiousShare: number;
  }
> & {
  effects: Record<'volunteer.engagement' | 'volunteer.incumbency' | 'attendance.engagement', Arrow>;
  mixes: { vote: Mix; voteContentious: Mix };
};
