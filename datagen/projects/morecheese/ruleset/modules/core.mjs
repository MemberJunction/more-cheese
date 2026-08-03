// CORE — the shared substrate every other module builds on.
//
// This file does NOT use the four-part shape, and shouldn't: it is not a domain. It holds the
// handful of things everything else reads — how big the world is, what years it covers, the
// hidden per-person dials, and the eras that bend it. Wrapping these in catalog/params would
// add a level of nesting to keys that thirteen other files reference.
//
// It is the smallest file here (36 values) and carries the most explanation, because almost
// every number in it was set for a reason someone had to learn the hard way. Read the comments
// before changing anything: several of these values are load-bearing across every domain.
//
// Targets mirror benchmarks-draft.json v0.9.2 — that file wins if the two disagree. Effect
// sizes use the spec §2 bands: weak 0.15-0.40, med 0.40-0.90, strong 0.90-1.80 per 1 SD.
//
// See datagen/CONTRACT.md. Values only — no clock, no randomness, no I/O, no functions.

export default {
  version: '0.0.2',

  scale: {
    // THE demo scope: a bare build produces the canonical 2,500-member world. The tests pass
    // --n 500 explicitly for speed — explicit beats implicit for the small world, not the
    // shipped one.
    members: 2500,
  },

  history: {
    // The single most-shared value in the ruleset: eight modules read it, so moving it moves
    // thirteen years of every domain at once.
    startYear: 2013,
    conferenceMonth: 7,
    conferenceDay: 15,
  },

  // The hidden per-person dials. EXPERT: changing these re-shapes every downstream behaviour
  // simultaneously, because almost every decision in the system reads one of them.
  latents: {
    // How strongly keenness and affluence move together.
    copulaRho: 0.4,

    // Keenness is a sticky-but-DRIFTING process, not a lifetime constant. Each person's
    // yearly value = a stable anchor (this share of the variance, correlated with affluence)
    // plus a persistent wander (the rest). So members rise and fade across the decade — and
    // the faders are who lapses, which is what makes churn early-warning real for the whole
    // crowd instead of only for the named heroes.
    //
    // Total variance stays 1 on purpose: every effect size in every other file is expressed
    // per 1 SD of a driver, so changing the total would silently rescale all of them.
    engagementDrift: { anchorShare: 0.6, yearRho: 0.75 },
  },

  cohorts: {
    // Calendar-year renewal dominates, with an anniversary minority (auto-pay billed on the
    // join anniversary, plus grandfathered members). Pending ratification.
    anniversaryShare: 0.3,
    autoRenewShare: 0.3,
  },

  // ERAS that bend the world while they are active.
  //
  // The rule that makes them work: an era shift is applied to the calibrated baseline, never
  // inside the calibrated scores. Tide, not boats. A shared shift folded inside a calibrated
  // score gets solved away — the calibration simply cancels it out, and the era vanishes from
  // the data while appearing to be configured. That was learned the hard way.
  //
  // Kept as data so scenarios can override an era, and so a future one (a recession, a
  // membership drive) is one entry here rather than a code change.
  regimes: {
    covid: {
      years: [2020, 2021],

      renewalLogitShift: -0.25,

      // Programming and attendance move in OPPOSITE directions by channel, which is the
      // whole point. In-person workshops all but stop; the federation schedules MORE
      // webinars; online attendance surges. An earlier version scaled the whole registration
      // rate by one multiplier, which made webinar attendance fall in 2020 — the opposite of
      // what actually happened.
      eventVolumeMultiplier: 0.5, // still governs how many in-person workshops get scheduled
      inPersonMultiplier: 0.2,
      virtualMultiplier: 1.7,
      webinarScheduleMultiplier: 1.5,
      virtualConference: true,

      learningLogitBoost: 0.5,
      formsResponseLogitShift: -0.5,
      npsShift: -0.7,
      paymentLateMultiplier: 1.5,

      // Acquisition dips: trade bodies lost their in-person recruiting surface.
      joinRateMultiplier: 0.55,

      // Judging is a physical activity — the 2020 competition was effectively curtailed.
      competitionMultiplier: 0.25,

      // The one thing that goes UP: emergency relief, labour rules, market-access lobbying.
      // The era needs a positive signal too, or it reads as a uniform dip.
      advocacyMultiplier: 2.2,

      // Governance kept meeting, but online.
      committeesVirtual: true,

      // An era-specific lapse reason, so the churn breakdown shows WHY these years differ
      // rather than just showing more of the usual reasons.
      churnReason: 'operations disrupted — reduced trading during the pandemic',
      churnReasonWeight: 0.35,

      // Lapsed members are normally archived after three years — which was swallowing the
      // ENTIRE pandemic lapse cohort. The most consequential thing this era did to the
      // federation left no trace in shipped data at all; the renewal dip existed only in the
      // validator's private log. These lapses are now retained, the same "pointable stories
      // must survive" exemption heroes and stamped motif members get.
      //
      // Not all of them: every retained lapse adds a non-active member to the roster, and
      // keeping the whole cohort pushed active-ish below its documented target. This value
      // keeps the era clearly visible — roughly 30-40 pandemic-attributed lapses at canonical
      // scale, the leading reason in those years — without reshaping the world's headline
      // composition. Tuned against statusMix below; the two are coupled.
      retainLapsedShare: 0.45,
    },
  },

  // Year-to-year wobble, so aggregate series are not machine-smooth. A flat line is the most
  // obvious sign of generated data on any chart.
  //
  // Co-designed with the effect sizes AND the tolerances: sigma went 0.08 → 0.13 when the
  // compiled +12pt auto-renew effect pushed members toward the renewal ceiling, where the
  // curve compresses wobble (a variance-floor check caught it). rho went 0.5 → 0.3 so the
  // multi-year MEAN still averages onto target. At pilot scale, cohort sampling noise adds
  // about 2 points on top of this; re-tune at production scale.
  texture: {
    yearlyLogitWobble: { rho: 0.3, sigma: 0.13 },
  },

  // Target distribution of member statuses at the release date. Validator-only — nothing
  // generates from it.
  //
  // NAME TRAP: despite the -Mix suffix this is a target, not a weighted draw. Only target[0]
  // is actually gated (active-ish = Active + PendingRenewal, allowed target[0] + 0.02); the
  // rest are indicative.
  //
  // The emitted statuses are Renewed / Active / Lapsed / PendingRenewal. There is deliberately
  // no 'Cancelled' status — a lapse carries a cancellation date and reason instead.
  statusMix: {
    target: [0.78, 0.15, 0.05, 0.02],
    tolerance: 0.08,
  },
};
