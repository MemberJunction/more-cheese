// Tasks — targets bizapps-tasks (slice: TaskType/Task/TaskAssignment/TaskLink).
//
// Two derivations: completed committee meetings spawn ACTION ITEMS (bizapps-committees'
// own migration replaced its ActionItem table with these Tasks — we generate what their
// design intends), and every PendingRenewal member gets a RENEWAL OUTREACH task assigned
// to the Membership & Outreach chair (the outreach queue, in task form — Marcus gets one).
//
// Assignees/links use the POLYMORPHIC pattern: rows carry an ENTITY NAME + record UUID;
// the emitters resolve names → __mj.Entity IDs at load time (entity IDs differ per install,
// so they can never be hardcoded).

import { rng } from '../../engine/rng.mjs';
import { childOutcome } from '../../engine/patterns.mjs';
import { iso, addDays, parseDate } from '../../engine/dates.mjs';
import { stripInternals } from '../../engine/authoring.mjs';

const PEOPLE_ENTITY = 'MJ_BizApps_Common: People';
const MEETINGS_ENTITY = 'Committees: Meetings';

/** a time inside the working day — staff don't file everything at exactly 17:00Z */
const workTime = (r) => `${String(r.int(8, 17)).padStart(2, '0')}:${String(r.int(0, 59)).padStart(2, '0')}:00Z`;

export function buildTasks(cfg, { people, periods, committees }) {
  // ── inputs ── the ruleset sections this domain reads, and the upstream rows
  const { R, seed, release } = cfg;
  const T = R.tasks;
  const releaseIso = iso(release);
  const personByNum = new Map(people.map((p) => [p.MemberNumber, p]));

  const taskTypes = T.catalog.types.map((t) => ({
    TypeKey: t.name, Name: t.name, Description: t.description, DefaultPriority: t.priority, IsActive: true, IsSharedDemo: true,
  }));

  // roster lookup: committee-term key → membership rows
  const rosterByTerm = new Map();
  for (const m of committees.memberships) {
    if (!rosterByTerm.has(m.TermKey)) rosterByTerm.set(m.TermKey, []);
    rosterByTerm.get(m.TermKey).push(m);
  }
  const termOf = (dt) => R.committees.catalog.terms.find((t) => t.start <= dt && dt <= t.end);

  const tasks = [];
  const taskAssignments = [];
  const taskLinks = [];

  const pushTask = (t) => { tasks.push(t); return t; };
  const assign = (task, memberNumber, status) => taskAssignments.push({
    AssignKey: `${task.TaskKey}:${memberNumber}`, TaskKey: task.TaskKey,
    AssigneeEntityName: PEOPLE_ENTITY, AssigneeMemberNumber: memberNumber,
    Status: status, AssignedAt: task._created, IsSharedDemo: true,
  });
  const link = (task, entityName, refKind, refKey) => taskLinks.push({
    LinkKey: `${task.TaskKey}:link`, TaskKey: task.TaskKey,
    EntityName: entityName, RefKind: refKind, RefKey: refKey, IsSharedDemo: true,
  });

  // ── decisions ── committee action items: spawned by completed meetings
  const P = T.params;
  const actionTasks = [];
  for (const meeting of committees.meetings) {
    const dt = meeting.StartDateTime.slice(0, 10);
    const term = termOf(dt);
    const roster = term ? (rosterByTerm.get(`${meeting.CommitteeKey}:${term.start}`) ?? []) : [];
    if (!roster.length) continue;
    const r = rng(seed, `ctask:${meeting.MeetingKey}`);
    const n = r.bernoulli(P.committeeActionRatePerMeeting) ? 1 + (r.bernoulli(0.3) ? 1 : 0) : 0;
    for (let i = 0; i < Math.min(n, P.committeeActionMaxPerMeeting); i++) {
      const assignee = r.pick(roster);
      // due dates vary by the work item (not a fixed +30 for everything)
      const due = addDays(parseDate(dt), P.committeeActionDueDays + r.int(-10, 30));
      const action = r.pick(T.catalog.committeeActionBank);
      const task = pushTask({
        TaskKey: `ctask:${meeting.MeetingKey}:${i}`, Name: `${action} (${meeting.CommitteeKey.replace(' Committee', '')})`,
        Description: `Action item recorded at the ${meeting.CommitteeKey} meeting on ${dt}. ${action}. Owner reports back at the next scheduled meeting.`,
        TypeKey: 'Committee Action Item', Priority: r.pickWeighted([['Low', 0.15], ['Medium', 0.6], ['High', 0.22], ['Critical', 0.03]]),
        HoursEstimated: r.pick([1, 2, 2, 3, 4, 6, 8]),
        DueAt: `${iso(due)}T${workTime(r)}`, _created: `${dt}T${workTime(r)}`,
        CreatedByMemberNumber: roster.find((m) => m.RoleKey === 'Chair')?.MemberNumber ?? null,
        _assignee: assignee.MemberNumber, _dueIso: iso(due), IsSharedDemo: true,
      });
      link(task, MEETINGS_ENTITY, 'meeting', meeting.MeetingKey);
      actionTasks.push(task);
    }
  }
  // completion: calibrated over tasks that are comfortably past due (recent ones stay open)
  const pastDue = actionTasks.filter((t) => t._dueIso < iso(addDays(release, -7)));
  childOutcome({
    seed,
    items: pastDue,
    scoreOf: (t) => T.effects['completion.engagement'].beta * (personByNum.get(t._assignee)?._theta ?? 0),
    target: P.committeeActionCompletion.target,
    streamKey: (t) => `ctask-done:${t.TaskKey}`,
    decide: (t, prob, r) => {
      if (r.bernoulli(prob)) {
        // some finish early, some run past the deadline — and record the hours actually spent
        t.Status = 'Completed'; t.PercentComplete = 100;
        t.CompletedAt = `${iso(addDays(parseDate(t._dueIso), r.int(-14, 12)))}T${workTime(r)}`;
        t.StartedAt = `${iso(addDays(parseDate(t.CompletedAt.slice(0, 10)), -r.int(1, 21)))}T${workTime(r)}`;
        t.HoursActual = Math.max(0.5, Math.round((t.HoursEstimated * (0.6 + r.int(0, 10) / 10)) * 2) / 2);
      } else {
        t.Status = r.bernoulli(0.5) ? 'InProgress' : 'Open'; // past due and unfinished — genuinely overdue rows
        t.PercentComplete = t.Status === 'InProgress' ? r.pick([10, 20, 25, 40, 50, 60, 75, 80, 90]) : 0;
        if (t.Status === 'InProgress') t.StartedAt = `${iso(addDays(parseDate(t._dueIso), -r.int(5, 30)))}T${workTime(r)}`;
      }
    },
  });
  for (const t of actionTasks) {
    if (!t.Status) {
      const r = rng(seed, `ctask-open:${t.TaskKey}`);
      t.Status = r.bernoulli(0.5) ? 'InProgress' : 'Open';
      t.PercentComplete = t.Status === 'InProgress' ? r.pick([10, 25, 40, 50, 60, 75]) : 0;
      if (t.Status === 'InProgress') t.StartedAt = `${iso(addDays(parseDate(t._dueIso), -r.int(5, 25)))}T${workTime(r)}`;
    }
    assign(t, t._assignee, t.Status === 'Completed' ? 'Completed' : 'InProgress');
  }

  // ── decisions ── renewal outreach: the PendingRenewal queue, assigned to the M&O chair
  const lastPeriod = new Map();
  for (const per of periods) lastPeriod.set(per.MemberNumber, per);
  const activeTerm = R.committees.catalog.terms[R.committees.catalog.terms.length - 1];
  // the whole M&O roster works the queue, chair-weighted — not one person holding 51 of 98
  // tasks. Outreach is also staged (calls go out as each renewal approaches), so the
  // created dates spread instead of stacking 50 rows on release day.
  const moRoster = (rosterByTerm.get(`Membership & Outreach Committee:${activeTerm.start}`) ?? []);
  const moChair = moRoster.find((m) => m.RoleKey === 'Chair');
  const outreachPool = moRoster.length ? moRoster : [];
  for (const [memberNumber, per] of [...lastPeriod.entries()].sort()) {
    if (per.Status !== 'PendingRenewal') continue;
    const p = personByNum.get(memberNumber);
    const r = rng(seed, `otask:${memberNumber}`);
    const created = iso(addDays(parseDate(per.EndDate), -r.int(10, 75)));
    const task = pushTask({
      TaskKey: `otask:${memberNumber}`, Name: `Renewal outreach — ${p.FirstName} ${p.LastName} (${memberNumber})`,
      Description: `${p.FirstName} ${p.LastName} (${memberNumber}, ${per.MembershipTier}) is pending renewal with a period ending ${per.EndDate}. Contact by phone or email, confirm intent to renew, and note the outcome.`,
      TypeKey: 'Renewal Outreach', Priority: r.pickWeighted([['Medium', 0.3], ['High', 0.6], ['Critical', 0.1]]),
      Status: r.bernoulli(0.4) ? 'InProgress' : 'Open',
      HoursEstimated: r.pick([0.5, 0.5, 1, 1, 2]),
      DueAt: `${per.EndDate}T${workTime(r)}`,
      _created: `${created > releaseIso ? releaseIso : created}T${workTime(r)}`,
      CreatedByMemberNumber: moChair ? moChair.MemberNumber : null, IsSharedDemo: true,
    });
    task.PercentComplete = task.Status === 'InProgress' ? r.pick([10, 25, 40, 50]) : 0;
    if (task.Status === 'InProgress') task.StartedAt = task._created;
    if (outreachPool.length) {
      // chair carries more of the load, but the committee shares it
      const idx = r.pickWeighted(outreachPool.map((m, i) => [i, m.RoleKey === 'Chair' ? 3 : m.RoleKey === 'Vice Chair' ? 2 : 1]));
      // TaskAssignment.Status CHECK allows only Completed/InProgress/Pending (contract gate)
      assign(task, outreachPool[idx].MemberNumber, task.Status === 'InProgress' ? 'InProgress' : 'Pending');
    }
    link(task, PEOPLE_ENTITY, 'person', memberNumber);
  }

  stripInternals(tasks); // generator-internals — never ship
  // ── shape ── assemble the named tables this domain owns
  return { taskTypes, tasks, taskAssignments, taskLinks };
}
