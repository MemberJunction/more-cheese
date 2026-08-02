// Type declarations for the datagen authoring surface.
//
// Nothing here changes runtime behaviour — datagen ships plain .mjs and has no build step.
// This file exists so an editor can answer the question every new author asks first:
// "what is afforded to me here?" Hover a pattern, open its options object, press
// Ctrl/Cmd+Space, and the answer arrives without reading engine source.
//
// The two halves of the authoring surface are typed in two different places, on purpose:
//   • the ruleset (JSON)  → engine/ruleset.schema.json, live in the editor via .vscode
//   • the generators (JS) → this file, via JSDoc @param annotations in engine/*.mjs
//
// Keep both honest: ruleset.schema.json is executed against all real modules by
// cli/check-ruleset-schema.mjs in the suite. This file is checked by `npx tsc -p datagen`
// if you have TypeScript to hand, but it is documentation first — if you change an engine
// signature, change it here too.

// ─────────────────────────────────────────────────────────────────────────────
// The dice
// ─────────────────────────────────────────────────────────────────────────────

/**
 * A named, seeded dice stream. Every draw in the system comes from one of these, and the
 * stream KEY is what makes output reproducible: `rng(seed, 'renewal:ICF-000101:2019')`
 * always yields the same sequence.
 *
 * The rule that keeps replay working: one stream per decision, and never reorder the draws
 * within a stream. Adding a draw in the middle of an existing stream re-rolls everything
 * after it — which shows up as a diff in unrelated data.
 */
export interface Rng {
  /** Uniform float in [0, 1). The raw draw — prefer a named helper below. */
  uniform(): number;
  /** Integer in [lo, hi], inclusive at both ends. */
  int(lo: number, hi: number): number;
  /** True with probability p. The workhorse: every yes/no in the system is one of these. */
  bernoulli(p: number): boolean;
  /** Uniform choice from a non-empty array. */
  pick<T>(items: readonly T[]): T;
  /**
   * Weighted choice over [value, weight] PAIRS. Note the asymmetry with the ruleset, where a
   * Mix may also be written as an object map — convert at the call site with Object.entries().
   * (Reconciling the two is on the TYPES-PROPOSAL list.)
   */
  pickWeighted<T>(pairs: readonly (readonly [T, number])[]): T;
  /** Fisher–Yates on a copy. Deterministic bank dealing — sampling without replacement. */
  shuffle<T>(items: readonly T[]): T[];
  /** Normal deviate. */
  normal(mean?: number, sd?: number): number;
  /** Lognormal, parameterised in LOG space: lognormal(Math.log(median), sigma). */
  lognormal(mu: number, sigma: number): number;
  /** Poisson count. Switches to a normal approximation above λ=30. */
  poisson(lambda: number): number;
  /** Negative binomial — an over-dispersed count, for 'most people do a few, some do many'. */
  negbin(mean: number, k: number): number;
  gamma(shape: number, scale: number): number;
  /** Two correlated standard normals (always exactly two), for coupling two latent dials. */
  copulaPair(rho: number): number[];
  /** An AR(1) walk of n steps — how a latent dial drifts across years with memory. */
  ar1(n: number, rho: number, sigma: number): number[];
}

// ─────────────────────────────────────────────────────────────────────────────
// The five patterns — the complete set of behaviours the engine knows how to run.
// If a new domain doesn't fit one of these, that is a real signal: either it reduces to
// one of them, or the engine needs a sixth (a genuine engine change, not a data change).
// ─────────────────────────────────────────────────────────────────────────────

/** Per year, an eligible pool faces a calibrated yes/no; participants spawn child rows. */
export interface AnnualParticipationOpts<M = any, R = any> {
  seed: string | number;
  years: readonly number[];
  /** Eligible members for that year. Empty or short pools are skipped, not forced. */
  poolOf(year: number): readonly M[];
  /** This member's arrow score for the year, in log-odds. */
  scoreOf(member: M, year: number): number;
  /** The participation rate the cohort calibrates to (a probability). */
  target: number;
  /** Dice stream for this member-year decision. Must be unique per decision. */
  streamKey(member: M, year: number): string;
  /** Called ONLY for participants. Does its own draws, in a fixed declared order. */
  spawn(r: Rng, member: M, year: number): R | R[] | void;
  /** Skip years with fewer eligible members than this. Default 5. */
  minPool?: number;
  /** Applied AFTER calibration, so a regime cannot be averaged away. The tide, not the boats. */
  baselineShift?(year: number): number;
}

/** One ordered rule in a staticAssignment ladder. First match wins. */
export interface AssignmentRule<V = string> {
  /** Equality conditions, ANDed. */
  when?: Record<string, unknown>;
  /** Strict numeric > conditions, ANDed with `when`. */
  whenAbove?: Record<string, number>;
  value: V;
}

/** Per cycle, an eligible cohort faces a calibrated yes/no with state consequences. */
export interface RecurringDecisionOpts<T = any, C = any> {
  seed: string | number;
  years: readonly number[];
  /** Items due to decide this cycle. May be empty. */
  cohortOf(year: number): readonly T[];
  /** Per-cohort context computed once (e.g. tenure standardisation stats). */
  prepare?(cohort: readonly T[], year: number): C;
  scoreOf(item: T, year: number, ctx: C): number;
  target: number;
  /** Applied AFTER calibration: texture wobble plus regime shifts. */
  baselineShift?(year: number): number;
  streamKey(item: T, year: number): string;
  /**
   * Hero conditioning. A boolean makes the outcome a FACT rather than a draw — a pinned yes
   * never lapses, a pinned no lapses on schedule. null/undefined means the entity rolls its
   * own dice. This is how an authored story survives a change of seed.
   */
  pinnedDecision?(item: T, year: number): boolean | null | undefined;
  record?(item: T, year: number, ctx: C, decided: boolean): void;
  onYes(item: T, year: number): void;
  onNo(item: T, year: number): void;
}

/** How a derived transaction is timed relative to its due date. Authored in the ruleset. */
export type TimingOffset =
  | { dist: 'const'; days?: number }
  | { dist: 'uniformDays'; min: number; max: number; /** −1 draws EARLY. */ sign?: -1 | 1 }
  | { dist: 'lognormalDays'; medianDays: number; sigma: number; minDays?: number; capDays?: number };

/**
 * A declared timing profile: how this kind of transaction gets paid.
 * Draw order per parent is part of the replay contract — method pick (only when `methods`
 * is used), then the lateShare bernoulli, then the chosen offset draw.
 */
export interface TimingProfile {
  /** A fixed method — no draw. */
  method?: string;
  /** A uniform pick between methods — costs one draw. */
  methods?: readonly string[];
  /** Probability this transaction is late. */
  lateShare?: number;
  late?: TimingOffset;
  onTime?: TimingOffset;
  /** Net-terms billing: due date = anchor + termsDays. */
  termsDays?: number;
}

/** Per parent fact, a child transaction with declared (not hard-coded) timing. */
export interface DerivedTransactionOpts<P = any> {
  seed: string | number;
  parents: readonly P[];
  /** The profile that applies to this parent, or null/undefined to skip it. */
  profileOf(parent: P): TimingProfile | null | undefined;
  streamKey(parent: P): string;
  /** The domain pushes its own rows here. `r` is available for further domain draws. */
  emit(
    parent: P,
    timing: { method: string | null; late: boolean; offsetDays: number; termsDays: number },
    r: Rng,
  ): void;
}

/**
 * Per existing row, a calibrated outcome. Calibration runs over the ACTUAL item pool, so the
 * selection effect is built in: course completers are already a self-selected group, and
 * calibrating over the whole membership would overstate the rate.
 */
export interface ChildOutcomeOpts<T = any> {
  seed: string | number;
  items: readonly T[];
  scoreOf(item: T): number;
  /** The outcome rate over the pool (a probability). */
  target: number;
  streamKey(item: T): string;
  /** Applies the outcome. `p` is the calibrated probability; `r` is this item's dice. */
  decide(item: T, p: number, r: Rng): void;
  /** Scalar applied AFTER calibration. */
  baselineShift?: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// The gate helpers — the five recurring question shapes an inspector asks.
// ─────────────────────────────────────────────────────────────────────────────

/** A Target: an authored expectation plus the drift the validator will accept. */
export interface Target {
  target: number;
  /** In the target's own units. Never 0 — that fails on ordinary sampling noise. */
  tolerance: number;
}

/** One relation to check: [rows, how to read the key off a row, the set of valid keys]. */
export type FkRelation = [
  rows: readonly any[],
  keyFn: (row: any) => string | null | undefined,
  parents: Set<string>,
];

export interface GateHelpers {
  /**
   * Does every reference point at something that exists? Null keys pass — an optional FK is
   * not a dangling one. Takes several relations at once so one gate can cover a whole pack.
   */
  fkResolves(name: string, relations: readonly FkRelation[]): void;
  /**
   * Is this observed share within tolerance of its target? Pass `n` (the draw pool size) to
   * add an SE cushion, so a small pilot build isn't failed by ordinary sampling noise.
   */
  shareBand(
    label: string,
    got: number,
    spec: Target & { /** Pool size; enables the SE cushion. */ n?: number; /** SE multiples, default 3. */ se?: number; detail?: string },
  ): void;
  /**
   * Does every named category actually APPEAR? A share gate CANNOT answer this — 0% sits
   * inside a tolerance band, which is how Critical-severity tickets stayed at zero for weeks
   * behind a passing '±12.2%' gate.
   */
  presenceFloor(name: string, countsByCategory: Record<string, number>, min?: number): void;
  /** Is there enough variety that repetition isn't visible on one screen? */
  distinctAtLeast(name: string, values: readonly unknown[], min: number, detail?: string): void;
  /** The count of rows whose key is non-null and missing from the parent set. Building block for fkResolves. */
  dangling(rows: readonly any[], keyFn: (row: any) => string | null | undefined, parents: Set<string>): number;
}

// ─────────────────────────────────────────────────────────────────────────────
// The ruleset, as generators see it
// ─────────────────────────────────────────────────────────────────────────────

/**
 * One causal rule: who differs from the population average, and by how much.
 * Declare exactly one effect form. Prefer `liftPts` or `groupTarget` — the compiler solves
 * them into a beta, so authoring in percentage points is the recommended path, not a lesser one.
 */
export interface Arrow {
  /** 'this group is N percentage points higher', at the population base rate. */
  liftPts?: number;
  /** 'this group lands at N%', as a probability. */
  groupTarget?: number;
  strength?: 'weak' | 'med' | 'strong';
  sign?: '+' | '-';
  /** Log-odds per SD of the driver. The expert form. */
  beta?: number;
  logitShift?: number;
  /** Prevalence of the affected group, needed to solve a human form into a beta. */
  share?: number;
  /** Declarative driver: { from: 'self', field } or { from: 'self', where: {…} }. */
  feature?: { from: 'self'; field?: string; where?: Record<string, unknown> };
  /** Why this effect exists and why this size. One of note/evidence/$note is required. */
  note?: string;
  /** Provenance. Say ESTIMATE plainly when it is a guess. */
  evidence?: string;
  /** Plain-language restatement of the magnitude ('med'). Documentation only. */
  label?: string;
}

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

/**
 * A number the VALIDATOR enforces. Writing the pair instead of a bare number is how you say
 * "this is a promise about the output, not just a knob" — and it is visible on the page,
 * rather than knowable only by reading validate.mjs.
 */
export interface TargetPair {
  target: number;
  /** Allowed drift, in the target's own units. Never 0 — that fails on ordinary sampling noise. */
  tolerance: number;
  /** Draw-pool size, which enables the validator's standard-error cushion. */
  n?: number;
  /** How many standard errors of cushion to allow. Default 3. */
  se?: number;
}

/** Weighted options for one dice roll. Weights must be positive; they need not sum to 1. */
export type Mix = Record<string, number>;

/**
 * The four sections every behavioural block uses. Fixture blocks (heroes, platform) are
 * catalogs and do not take this shape.
 */
export interface Block<Catalog = Record<string, unknown[]>, Params = Record<string, number | TargetPair>> {
  /** WHAT EXISTS — lists of things. If it is a thing rather than a quantity, it goes here. */
  catalog: Catalog;
  /** EVERY SCALAR, flat and in one place. Bare number = used but unchecked; TargetPair = enforced. */
  params: Params;
  /** WHO DIFFERS from average. Keys are `<decision>.<driver>`; each needs a magnitude and a reason. */
  effects?: Record<string, Arrow>;
  /** WEIGHTED OPTIONS, one dice roll each. */
  mixes?: Record<string, Mix>;
}

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

/**
 * The composed ruleset: every module merged, `$comment` keys stripped, scenario overrides
 * applied. Blocks are typed loosely here on purpose — a block gains a real type when it
 * migrates to .mjs (see CommitteeBlock). Blocks still written as JSON are described by
 * engine/ruleset.schema.json, which your editor reads while you edit them.
 */
export interface Ruleset {
  version?: string;
  scale?: { members: number };
  history?: { startYear: number; conferenceMonth?: number; conferenceDay?: number };
  heroes?: Hero[];
  statusMix?: Target & { target: number[] };
  [block: string]: any;
}

/** Exactly what loadConfig(argv) hands every generator. */
export interface Config {
  /** The composed ruleset. Conventionally destructured as `R`. */
  R: Ruleset;
  /** Master seed (a string — '42' by default). Combined with every stream key. */
  seed: string;
  /** Population size for this run: --n, else ruleset.scale.members. */
  n: number;
  /**
   * The 'today' of the generated world, as a Date. There is no wall-clock anywhere in
   * datagen — every "days ago" is measured from here, which is why last week's build and
   * today's are byte-identical.
   */
  release: Date;
  /** release.getUTCFullYear(), precomputed because nearly every generator needs it. */
  releaseYear: number;
  /** Absolute path packs are written to. */
  outDir: string;
  /** Named scenario, or null. */
  scenario: string | null;
  project: string;
}
