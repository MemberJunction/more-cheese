// Spec §5 step 3: the renewal unroll — the heart of the slice.
//
// Year by year, every member whose period ends that year faces a renewal decision:
//   1. Score each member: the causal arrows push their log-odds up or down
//      (tenure +, engagement +, auto-renew +, employer trouble −, enthusiast tier −, COVID −).
//   2. CALIBRATE: solve the shared baseline so the cohort averages exactly the target
//      (87%, wobbled by the year's texture). Arrows decide WHO differs; targets set the LEVEL.
//   3. Draw each decision from the member's own dice. Heroes don't roll — pinned outcomes
//      are facts (spec §4), so Marcus can't accidentally lapse in 2023.
// The mechanics encode the team's rules: renewals back-date (no gaps), a lapse past the
// 2-month grace gets a CancellationDate, and member status is always derived, never stored.

import { rng, sigmoid, calibrateIntercept } from '../../engine/rng.mjs';
import { recurringDecision } from '../../engine/patterns.mjs';
import { iso, addDays, addYears, endOfYear, parseDate, DAY } from '../../engine/dates.mjs';
import { yearsOf } from '../../engine/authoring.mjs';
import { featureArrows } from '../../engine/features.mjs';

export function runRenewalUnroll(cfg, { people, orgs }) {
  const { R, seed, release, releaseYear } = cfg;
  const M = R.membership;
  const orgByKey = new Map(orgs.map((o) => [o.OrgKey, o]));

  const years = yearsOf(cfg);

  // texture: each year's renewal target wobbles (AR(1) on the logit) — real data is lumpy
  const wobble = rng(seed, 'texture:renewal-yoy').ar1(years.length, R.texture.yearlyLogitWobble.rho, R.texture.yearlyLogitWobble.sigma);
  const yearWobble = new Map(years.map((y, i) => [y, wobble[i]]));

  const periods = [];
  const renewalEvents = []; // validator-private: carries the latents for arrow recovery
  const state = new Map();
  for (const p of people) {
    const join = parseDate(p.JoinDate);
    const firstEnd = p.CycleType === 'calendar' ? endOfYear(join.getUTCFullYear()) : addYears(join, 1);
    state.set(p.MemberNumber, { start: join, end: firstEnd, n: 0, alive: true });
  }

  const duesOf = new Map(M.catalog.tiers.map((t) => [t.name, t.dues]));

  function pushPeriod(p, start, end, status, cancellationDate, reason) {
    const st = state.get(p.MemberNumber);
    st.n += 1;
    periods.push({
      PeriodKey: `${p.MemberNumber}-P${st.n}`, MemberNumber: p.MemberNumber,
      MembershipTier: p.MembershipTier, DuesAmount: duesOf.get(p.MembershipTier),
      StartDate: iso(start), EndDate: iso(end), RenewalDate: iso(end),
      Status: status, CancellationDate: cancellationDate ? iso(cancellationDate) : null,
      CancellationReason: reason ?? null, AutoRenew: p.AutoRenew, IsSharedDemo: true,
    });
  }

  // The unroll, expressed through core's recurringDecision pattern: core owns the universal
  // mechanics (per-cohort calibration, tide-not-boats baseline shifts, hero conditioning,
  // named dice); this domain owns eligibility, scoring inputs, the state machine, and the
  // event record. BUILT-IN drivers (standardized tenure, the drifting latent, the employer-
  // event window) + DECLARED-FEATURE factors read straight from the ruleset.
  const declared = featureArrows(M.effects);
  recurringDecision({
    seed, years,
    streamKey: (c, y) => `renew:${c.p.MemberNumber}:${y}`,
    // pin conditioning: outcomes are facts — a declared lapseYear (hero story OR stamped
    // motif) renews until that year then lapses; heroes without one always renew
    pinnedDecision: (c, y) => (c.p._lapseYear != null ? y < c.p._lapseYear : (c.p._hero || c.p._renewAlways ? true : undefined)),
    target: Math.min(0.97, Math.max(0.5, M.params.renewal.target)),
    // regime shifts and texture apply AFTER calibration — tide, not boats (a shared shift
    // inside the calibrated scores gets solved away, erasing the dip)
    baselineShift: (y) => (yearWobble.get(y) ?? 0) + (R.regimes.covid.years.includes(y) ? R.regimes.covid.renewalLogitShift : 0),

    cohortOf: (y) => {
      const cohort = [];
      for (const p of people) {
        const st = state.get(p.MemberNumber);
        if (!st.alive || st.end.getUTCFullYear() !== y || st.end > release) continue;
        const tenureYrs = (st.end - parseDate(p.JoinDate)) / (365.25 * DAY);
        const org = p.OrgKey ? orgByKey.get(p.OrgKey) : null;
        // employer shock hits the decision in the event year and the one after (dissolutions persist)
        const ev = org?.LifecycleEvent;
        const employerEvent = ev && (ev.year === y || ev.year === y - 1 || (ev.kind === 'Dissolved' && ev.year < y)) ? 1 : 0;
        cohort.push({ p, st, tenureYrs, employerEvent });
      }
      return cohort;
    },
    prepare: (cohort) => {
      const meanT = cohort.reduce((s, c) => s + c.tenureYrs, 0) / cohort.length;
      const sdT = Math.sqrt(cohort.reduce((s, c) => s + (c.tenureYrs - meanT) ** 2, 0) / cohort.length) || 1;
      return { meanT, sdT };
    },
    scoreOf: (c, y, { meanT, sdT }) =>
      M.effects['renewal.tenure'].beta * ((c.tenureYrs - meanT) / sdT) +
      M.effects['renewal.engagement'].beta * (c.p._thetaPath?.[y] ?? c.p._theta) + // THIS year's engagement (drifting; heroes pinned)
      M.effects['renewal.employerEvent'].beta * c.employerEvent +
      declared.reduce((s, fa) => s + fa.beta * fa.fn(c.p), 0),

    record: (c, y, { meanT, sdT }, renewed) => {
      if (c.p._hero || c.p._lapseYear != null || c.p._renewAlways) return; // pinned outcomes never train the arrows
      renewalEvents.push({
        year: y, tenureZ: (c.tenureYrs - meanT) / sdT,
        theta: c.p._thetaPath?.[y] ?? c.p._theta, prevTheta: c.p._thetaPath?.[y - 1] ?? c.p._theta, anchor: c.p._theta,
        employerEvent: c.employerEvent,
        // Declared-feature factors record under their DRIVER name — the part of the effect key
        // after the dot. The validator and the compiler's refinement step both read these
        // fields (e.autoRenew, e.enthusiastTier), so the recorded name must stay the driver
        // even though the effect is now keyed 'renewal.autoRenew'. Getting this wrong is
        // silent: the group filters simply match nothing and every solved effect goes NaN.
        ...Object.fromEntries(declared.map((fa) => [fa.name.split('.').pop(), fa.fn(c.p)])),
        renewed: renewed ? 1 : 0,
      });
    },
    onYes: (c, y) => {
      pushPeriod(c.p, c.st.start, c.st.end, 'Renewed', null, null);
      const nextEnd = c.p.CycleType === 'calendar' ? endOfYear(y + 1) : addYears(c.st.end, 1);
      c.st.start = addDays(c.st.end, 1); // late renewals back-date: no gap (team rule)
      c.st.end = nextEnd;
    },
    onNo: (c) => {
      const cancellation = addDays(c.st.end, Math.round(M.params.gracePeriodMonths * 30.44));
      // employer-event lapses keep their DERIVED reason; the rest draw from the declared
      // churn mix (every lapse used to read "non-payment", so the reason column was
      // useless for the why-are-we-losing-members demo)
      const CV = R.regimes.covid;
      const lapseYear = c.st.end.getUTCFullYear(); // st.end is already a Date — parseDate() would yield NaN
      const rReason = rng(seed, `churnreason:${c.p.MemberNumber}:${c.st.end}`);
      let reason;
      if (c.employerEvent) reason = 'non-payment — employer event';
      // No default on the weight: an era that declares a churn reason MUST say how often it
      // applies. `?? 0` would mean the reason is declared and never used — a silent no-op.
      else if (CV.years.includes(lapseYear) && CV.churnReason && rReason.bernoulli(CV.churnReasonWeight)) {
        // era-specific reason, so the churn breakdown shows WHY 2020-21 differs rather
        // than just showing more of the usual
        reason = CV.churnReason;
      } else reason = rReason.pickWeighted(Object.entries(M.mixes.churnReason));
      // LAPSE vs CANCELLATION: a lapse is silence (the renewal never gets paid, grace runs out,
      // staff infer the reason later). A cancellation is a member who TOLD us mid-term — the churn
      // a retention team could have worked. Only active-decision reasons qualify; nobody phones in
      // to announce a non-payment. Heroes are excluded so their pinned statuses hold.
      const activeDecision = !M.catalog.cancellationPassiveReasons.includes(reason);
      const toldUs = activeDecision && !c.p._hero && rReason.bernoulli(M.params.cancellationToldUsShareOfActiveReasons);
      if (toldUs) {
        const [lo, hi] = M.params.cancellationNoticeDaysBeforeEnd;
        const notice = addDays(c.st.end, -rReason.int(lo, hi));
        // notice cannot predate the term it cancels
        const noticeDate = notice < c.st.start ? c.st.start : notice;
        pushPeriod(c.p, c.st.start, c.st.end, 'Cancelled', noticeDate, reason);
      } else {
        pushPeriod(c.p, c.st.start, c.st.end, 'Lapsed', cancellation, reason);
      }
      c.st.alive = false;
    },
  });

  // close out the in-flight period for members still alive at release
  for (const p of people) {
    const st = state.get(p.MemberNumber);
    if (!st.alive) continue;
    const daysToEnd = (st.end - release) / DAY;
    const status = daysToEnd < 0 ? 'Lapsed' : daysToEnd <= 30 ? 'PendingRenewal' : 'Active';
    pushPeriod(p, st.start, st.end, status, null, null);
  }

  return { periods, renewalEvents };
}

/**
 * Archive rule: lapsed members terminated > 3 years ago drop out of the demo DB (real AMS
 * hygiene; keeps the status mix near the documented ~78% active). Heroes never archive.
 * Archived members' renewal events STAY in the validation set — history stats are unaffected.
 */
export function applyArchiveRule(cfg, { people, periods }) {
  const lastPer = new Map();
  for (const per of periods) lastPer.set(per.MemberNumber, per);
  const cutoff = iso(addYears(cfg.release, -3));
  const archived = new Set();
  for (const [m, per] of lastPer) {
    if ((per.Status === 'Lapsed' || per.Status === 'Cancelled') && per.CancellationDate && per.CancellationDate < cutoff) archived.add(m);
  }
  for (const h of cfg.R.heroes) archived.delete(h.memberNumber);
  // stamped motif members are pointable stories — they must survive in the DB, like heroes
  for (const p of people) if (p._motif) archived.delete(p.MemberNumber);
  // COVID-era churn is a pointable story too. Archiving swallowed the entire 2020-21
  // lapse cohort, so the pandemic's effect on RETENTION — the most consequential thing it
  // did to this federation — left no trace a viewer could find: the renewal dip existed
  // only in the validator's private event log. A retained share (not all of them, or the
  // era would look artificially over-represented against every other year) keeps the
  // cohort and its era-specific cancellation reasons visible.
  const CV = cfg.R.regimes?.covid;
  if (CV?.retainLapsedShare) {
    for (const [m, per] of lastPer) {
      if (!archived.has(m)) continue;
      if (!CV.years.includes(parseDate(per.EndDate).getUTCFullYear())) continue;
      if (rng(cfg.seed, `covid-retain:${m}`).bernoulli(CV.retainLapsedShare)) archived.delete(m);
    }
  }
  return {
    people: people.filter((p) => !archived.has(p.MemberNumber)),
    periods: periods.filter((x) => !archived.has(x.MemberNumber)),
  };
}
