// HOW TO MEASURE A DECLARED TARGET — the one thing an engine cannot work out for itself.
//
// A `{ target, tolerance }` pair in the ruleset says "a check enforces this". The engine finds every
// such pair by shape and derives the band, the standard-error cushion and the message. What it
// cannot know is what the number MEANS in the generated data: "attendance" is not a concept an
// emitter has.
//
// Each measurement returns { observed, of, detail } — `of` being the denominator size, which is what
// enables the small-sample cushion. Returning null means "not applicable to this build" and is
// skipped rather than failed.
//
// SELF-CONTAINED ON PURPOSE. These take only `load`, and derive everything else themselves, so the
// same measurements run from cli/validate.mjs and from cli/check-declared.mjs. Closing over a
// validator's local variables is what made these un-runnable anywhere else.
//
// THE DENOMINATOR IS THE WHOLE JOB. Match the generator exactly. Guessing is how a correct
// calibration gets called broken — measuring an annual participation rate over a member's lifetime
// reads 96% against a 62% target and looks like a bug when nothing is wrong.

/**
 * Targets gated by the BESPOKE checks in cli/validate.mjs, which say more than a band can.
 *
 * This list was 15. Twelve have migrated, and the three left are not leftovers — each compares
 * against something the derived runner cannot express, and the reason is recorded so nobody spends
 * a morning rediscovering it:
 *
 *   statusMix                     the target is a VECTOR and the gate compares the observed
 *                                 active share against target[0] + 0.02, a deliberate offset
 *                                 (the documented world counts a grace-period member as
 *                                 "active-ish"). The runner compares to target[0] exactly.
 *   membership.params.renewal     the band is tolerance + 2 × (stdev of the YEARLY rates / √years)
 *                                 — a standard error of a mean across years, not the binomial SE
 *                                 of one pooled share. Different statistic, so a migration would
 *                                 silently widen or narrow the gate.
 *   membership.params.enthusiastRenewal
 *                                 the target is COMPOSITION-ADJUSTED before comparison: the gate
 *                                 shifts it in logit space by the effect betas times the enthusiast
 *                                 cohort's mean difference in tenure, engagement and employer
 *                                 events, because that cohort genuinely differs on the drivers.
 *                                 Comparing to the raw declared target would be wrong, not just
 *                                 imprecise. That adjustment IS the knowledge the gate carries.
 *
 * If a fourth ever joins them, it needs a paragraph here too. A list of paths with no reasons is
 * how "temporarily bespoke" becomes permanent.
 */
export const gatedElsewhere = new Set([
  'statusMix',
  'membership.params.renewal',
  'membership.params.enthusiastRenewal',
]);

/** @type {Record<string, (ctx: { load: (pack: string, table: string) => any[] }) => {observed: number, of?: number, detail?: string} | null>} */
export const measurements = {
  // The flagship number of the entire dataset, and it was declared with NOTHING checking it.
  //
  // Denominator matched to the generator exactly (see events.mjs): per year, the members covered on
  // 1 July of that year, and years whose eligible pool is under 6 are skipped because the generator
  // skips them too.
  'events.params.conferenceAttendance': ({ load }) => {
    const events = load('events', 'events');
    const periods = load('membership', 'membership_periods');
    const people = load('common', 'people');
    const confs = events.filter((e) => e.EventType === 'Conference');
    if (!confs.length) return null;

    // prospects register for events but are not members, so they are not in the denominator
    const prospectKeys = new Set(people.filter((p) => p.IsProspect).map((p) => p.MemberNumber));
    const regs = load('events', 'event_registrations').filter((r) => !prospectKeys.has(r.MemberNumber));

    const coveredOn = (m, d) => periods.some((p) => p.MemberNumber === m && p.StartDate <= d && d <= p.EndDate);
    const members = [...new Set(periods.map((p) => p.MemberNumber))];

    let pool = 0, attended = 0;
    for (const conf of confs) {
      const july1 = `${conf.Year}-07-01`;
      const eligible = members.filter((m) => coveredOn(m, july1));
      if (eligible.length < 6) continue;
      const registered = new Set(regs.filter((r) => r.EventKey === conf.EventKey).map((r) => r.MemberNumber));
      pool += eligible.length;
      attended += eligible.filter((m) => registered.has(m)).length;
    }
    return pool
      ? { observed: attended / pool, of: pool, detail: `${confs.length} conferences, ${pool} member-years` }
      : null;
  },

  // Also declared and never checked. Action items exist to be finished: let the rate drift and a
  // task board reads either abandoned or implausibly tidy.
  'tasks.params.committeeActionCompletion': ({ load }) => {
    const actions = load('tasks', 'tasks').filter((t) => t.TypeKey === 'Committee Action Item');
    if (!actions.length) return null;
    return {
      observed: actions.filter((t) => t.CompletedAt).length / actions.length,
      of: actions.length,
      detail: `${actions.length} committee action items`,
    };
  },
  // ─────────────────────────────────────────────────────────────────────────────────────────────
  // MIGRATED FROM BESPOKE GATES. Each of these was a hand-written band in cli/validate.mjs that
  // re-stated the declared target, re-derived its own allowance, and picked its own standard-error
  // cushion — six copies of arithmetic the derived runner already does. What only the project knows
  // is the MEASUREMENT: which rows count, and over what pool. That is all that lives here now.
  //
  // The cushions were 1.5×SE or 3×SE depending on the gate. That was a real judgement about how
  // noisy each measure is, buried in a `Math.sqrt` expression; it is now declared as `se` next to
  // the target it belongs to, where an author can see and argue with it.
  // ─────────────────────────────────────────────────────────────────────────────────────────────

  // over the ACTIVE term's eligible crowd — the same pool the generator draws volunteers from
  'committees.params.volunteerShare': ({ load, R }) => {
    const activeTerm = R.committees.catalog.terms[R.committees.catalog.terms.length - 1];
    const memberships = load('committees', 'committee_memberships');
    const periods = load('membership', 'membership_periods');
    const people = load('common', 'people').filter((p) => !p.IsProspect);
    const served = new Set(memberships.filter((m) => m.TermKey.endsWith(activeTerm.start)).map((m) => m.MemberNumber));
    const eligible = people.filter((p) => periods.some((per) => per.MemberNumber === p.MemberNumber
      && per.StartDate <= activeTerm.start && activeTerm.start <= per.EndDate));
    if (!eligible.length) return null;
    const serving = eligible.filter((p) => served.has(p.MemberNumber)).length;
    return { observed: serving / eligible.length, of: eligible.length, detail: `${served.size} serving / ${eligible.length} eligible` };
  },

  'committees.params.attendPresent': ({ load }) => {
    const rows = load('committees', 'committee_attendance');
    if (!rows.length) return null;
    return {
      observed: rows.filter((a) => a.AttendanceStatus === 'Present').length / rows.length,
      of: rows.length,
      detail: `${rows.length} attendance rows`,
    };
  },

  // heroes are excluded from both sides: their certifications are authored facts, not draws
  'programs.params.certificationPursuit': ({ load, R }) => {
    const isHero = (m) => R.heroes.some((h) => h.memberNumber === m);
    const completers = new Set(load('learning', 'enrollments').filter((e) => e.Status === 'Completed').map((e) => e.MemberNumber));
    const crowdCompleters = [...completers].filter((m) => !isHero(m)).length;
    if (!crowdCompleters) return null;
    const crowdCerts = load('learning', 'member_certifications').filter((x) => !isHero(x.MemberNumber)).length;
    return { observed: crowdCerts / crowdCompleters, of: crowdCompleters, detail: `${crowdCerts} certs / ${crowdCompleters} completers` };
  },

  'programs.params.advocateShare': ({ load, R }) => {
    const isHero = (m) => R.heroes.some((h) => h.memberNumber === m);
    const people = load('common', 'people').filter((p) => !p.IsProspect);
    if (!people.length) return null;
    const advocates = new Set(load('membership', 'advocacy_actions').filter((x) => !isHero(x.MemberNumber)).map((x) => x.MemberNumber)).size;
    return { observed: advocates / people.length, of: people.length, detail: `${advocates} advocates` };
  },

  'issues.params.assignment': ({ load }) => {
    const issues = load('issues', 'issues');
    if (!issues.length) return null;
    const assigned = issues.filter((x) => x.AssigneeMemberNumber).length;
    return { observed: assigned / issues.length, of: issues.length, detail: `${assigned}/${issues.length}` };
  },

  // hero issues ALWAYS thread (an authored fact), so they leave both numerator and denominator.
  // The cushion still uses the full issue count, as the bespoke gate did — keeping the band
  // identical rather than quietly tightening it while moving it.
  'messaging.params.threadSharePerIssue': ({ load }) => {
    const issues = load('issues', 'issues');
    const threads = load('messaging', 'secure_threads');
    const heroIssues = issues.filter((x) => x.IssueKey.startsWith('hero:')).length;
    const crowdIssues = issues.length - heroIssues;
    if (crowdIssues <= 0) return null;
    return {
      observed: (threads.length - heroIssues) / crowdIssues,
      of: issues.length,
      detail: `${threads.length} threads / ${issues.length} issues`,
    };
  },
  // ─────────────────────────────────────────────────────────────────────────────────────────────
  // SECOND MIGRATION BATCH. Same recipe as above: add the measurement, run the validator, confirm
  // the derived gate reproduces the bespoke gate's observed value AND its ± band to the digit,
  // then delete the bespoke gate. Each of these matched exactly before its old gate came out.
  // ─────────────────────────────────────────────────────────────────────────────────────────────

  // Participation is per MEMBER-YEAR over the pool the generator calibrates on: members covered
  // at mid-year. Counting raw period-years instead double-counts anniversary members and dilutes
  // with partial years — a measurement artefact, not a data problem. se 1.5 declared in the ruleset.
  'learning.params.enrollment': ({ load, run }) => {
    const enrollments = load('learning', 'enrollments');
    const courseYear = new Map(load('learning', 'courses').map((c) => [c.CourseKey, c.Year]));
    const participated = new Set(enrollments.map((e) => `${e.MemberNumber}:${courseYear.get(e.CourseKey)}`));
    const byMember = new Map();
    for (const per of load('membership', 'membership_periods')) {
      if (!byMember.has(per.MemberNumber)) byMember.set(per.MemberNumber, []);
      byMember.get(per.MemberNumber).push(per);
    }
    const lastYear = +run.releaseDate.slice(0, 4);
    let activeYears = 0, partYears = 0;
    for (const [m, list] of byMember) {
      const seen = new Set();
      for (const per of list) {
        const y0 = +per.StartDate.slice(0, 4), y1 = Math.min(+per.EndDate.slice(0, 4), lastYear);
        for (let y = y0; y <= y1; y++) {
          if (seen.has(y)) continue;
          const mid = `${y}-06-15`;
          if (!list.some((p2) => p2.StartDate <= mid && mid <= p2.EndDate)) continue;
          seen.add(y);
          activeYears++;
          if (participated.has(`${m}:${y}`)) partYears++;
        }
      }
    }
    return activeYears ? { observed: partYears / activeYears, of: activeYears, detail: `${activeYears} member-years` } : null;
  },

  // over TERMINAL enrolments only — an in-progress course has not decided yet
  'learning.params.completion': ({ load }) => {
    const terminal = load('learning', 'enrollments').filter((e) => e.Status !== 'InProgress');
    if (!terminal.length) return null;
    return {
      observed: terminal.filter((e) => e.Status === 'Completed').length / terminal.length,
      of: terminal.length,
      detail: `${terminal.length} terminal enrollments`,
    };
  },

  // The two no-show rates carry NO standard-error cushion — the bespoke gates compared against
  // the bare tolerance, so these return no `of`, which makes the derived cushion exactly zero.
  // Omitting `of` is how a measurement says "this band is a flat tolerance, not a sampling band".
  'events.params.noShowPaidInPerson': ({ load, run }) => noShow(load, run, false),
  'events.params.noShowFreeWebinar': ({ load, run }) => noShow(load, run, true),

  // Dues payment timeliness, split the way the money chain bills: net-terms tiers get an invoice
  // (late = paid after the due date), everyone else pays manually. Auto-pay is checked separately
  // by a bespoke gate — "lands ON the due date" is a floor, not a band, so no target pair exists.
  'orders.params.gateNetTermsLate': ({ load }) => duesLate(load, 'net'),
  'orders.params.gateManualLate': ({ load }) => duesLate(load, 'manual'),
};

/** No-show share among registrations for events that have already happened, MEMBERS ONLY.
 *
 *  The prospect filter is not incidental. Free webinars are the top of the funnel, so non-members
 *  register for them in numbers — including them moved the webinar denominator from 1,702 rows to
 *  1,962 and the rate from 55.3% to 54.5%. Both still passed the band, which is the point: the
 *  gate would have been quietly measuring a different population than the one the target was set
 *  for, and only the side-by-side comparison against the bespoke gate caught it. The paid-event
 *  rate was unaffected (prospects cannot buy a seat yet), so a single-gate check would have
 *  looked fine. */
function noShow(load, run, webinars) {
  const events = load('events', 'events');
  const isWebinar = new Set(events.filter((e) => e.EventType === 'Webinar').map((e) => e.EventKey));
  const dateOf = new Map(events.map((e) => [e.EventKey, e.Date]));
  const prospects = new Set(load('common', 'people').filter((p) => p.IsProspect).map((p) => p.MemberNumber));
  const rows = load('events', 'event_registrations').filter((x) => !prospects.has(x.MemberNumber)
    && (dateOf.get(x.EventKey) ?? '') <= run.releaseDate
    && isWebinar.has(x.EventKey) === webinars);
  if (!rows.length) return null;
  return { observed: rows.filter((x) => !x.Attended).length / rows.length, detail: `${rows.length} regs` };
}

/** late-payment share for one dues billing class. The order→period join is a key convention
 *  (ORD-D-<PeriodKey>), which is also why the class lives on the PERIOD row and not the order. */
function duesLate(load, want) {
  const periods = load('membership', 'membership_periods');
  const perByKey = new Map(periods.map((x) => [`ORD-D-${x.PeriodKey}`, x]));
  const paid = new Map(load('orders', 'payments').filter((p) => p.Amount > 0 && p.Status !== 'Refunded').map((p) => [p.OrderKey, p.PaymentDate]));
  const flags = [];
  for (const o of load('orders', 'orders').filter((x) => x.OrderKey.startsWith('ORD-D-'))) {
    if (!paid.has(o.OrderKey)) continue; // unpaid orders age instead of counting as late
    const per = perByKey.get(o.OrderKey);
    const cls = ['SmallBusiness', 'Corporate'].includes(per.MembershipTier) ? 'net' : (per.AutoRenew ? 'auto' : 'manual');
    if (cls === want) flags.push(paid.get(o.OrderKey) > o.DueDate ? 1 : 0);
  }
  if (!flags.length) return null;
  return {
    observed: flags.reduce((a, b) => a + b, 0) / flags.length,
    of: flags.length,
    detail: `${flags.length} ${want}-terms payments`,
  };
}