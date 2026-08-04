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
  'committees.params.volunteerShare',
  'committees.params.attendPresent',
  'issues.params.assignment',
  'programs.params.certificationPursuit',
  'programs.params.advocateShare',
  'messaging.params.threadSharePerIssue',
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
};
