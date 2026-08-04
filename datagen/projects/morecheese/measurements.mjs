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

/** Targets gated by the BESPOKE checks in cli/validate.mjs, which say more than a band can. */
export const gatedElsewhere = new Set([
  'statusMix',
  'membership.params.renewal',
  'membership.params.enthusiastRenewal',
  'events.params.noShowPaidInPerson',
  'events.params.noShowFreeWebinar',
  'orders.params.gateNetTermsLate',
  'orders.params.gateManualLate',
  'learning.params.enrollment',
  'learning.params.completion',
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
};