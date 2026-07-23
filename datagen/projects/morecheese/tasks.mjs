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

const PEOPLE_ENTITY = 'MJ_BizApps_Common: People';
const MEETINGS_ENTITY = 'Committees: Meetings';

export function buildTasks(cfg, people, periods, committees) {
  const { R, seed, release } = cfg;
  const T = R.tasks;
  const releaseIso = iso(release);
  const personByNum = new Map(people.map((p) => [p.MemberNumber, p]));

  const taskTypes = T.types.map((t) => ({
    TypeKey: t.name, Name: t.name, Description: t.description, DefaultPriority: t.priority, IsActive: true, IsSharedDemo: true,
  }));

  // roster lookup: committee-term key → membership rows
  const rosterByTerm = new Map();
  for (const m of committees.memberships) {
    if (!rosterByTerm.has(m.TermKey)) rosterByTerm.set(m.TermKey, []);
    rosterByTerm.get(m.TermKey).push(m);
  }
  const termOf = (dt) => R.committees.terms.find((t) => t.start <= dt && dt <= t.end);

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

  // ---------- committee action items: spawned by completed meetings ----------
  const CA = T.committeeActions;
  const actionTasks = [];
  for (const meeting of committees.meetings) {
    const dt = meeting.StartDateTime.slice(0, 10);
    const term = termOf(dt);
    const roster = term ? (rosterByTerm.get(`${meeting.CommitteeKey}:${term.start}`) ?? []) : [];
    if (!roster.length) continue;
    const r = rng(seed, `ctask:${meeting.MeetingKey}`);
    const n = r.bernoulli(CA.ratePerMeeting) ? 1 + (r.bernoulli(0.3) ? 1 : 0) : 0;
    for (let i = 0; i < Math.min(n, CA.maxPerMeeting); i++) {
      const assignee = r.pick(roster);
      const due = addDays(parseDate(dt), CA.dueDays);
      const task = pushTask({
        TaskKey: `ctask:${meeting.MeetingKey}:${i}`, Name: r.pick(CA.actionBank),
        TypeKey: 'Committee Action Item', Priority: 'Medium',
        DueAt: `${iso(due)}T17:00:00Z`, _created: `${dt}T17:00:00Z`,
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
    scoreOf: (t) => CA.completion.arrows.engagement.beta * (personByNum.get(t._assignee)?._theta ?? 0),
    target: CA.completion.target,
    streamKey: (t) => `ctask-done:${t.TaskKey}`,
    decide: (t, prob, r) => {
      if (r.bernoulli(prob)) {
        t.Status = 'Completed'; t.PercentComplete = 100;
        t.CompletedAt = `${iso(addDays(parseDate(t._dueIso), -r.int(0, 10)))}T17:00:00Z`;
      } else {
        t.Status = r.bernoulli(0.5) ? 'InProgress' : 'Open'; // past due and unfinished — genuinely overdue rows
        t.PercentComplete = t.Status === 'InProgress' ? 50 : 0;
      }
    },
  });
  for (const t of actionTasks) {
    if (!t.Status) { const r = rng(seed, `ctask-open:${t.TaskKey}`); t.Status = r.bernoulli(0.5) ? 'InProgress' : 'Open'; t.PercentComplete = t.Status === 'InProgress' ? 50 : 0; }
    assign(t, t._assignee, t.Status === 'Completed' ? 'Completed' : 'InProgress');
  }

  // ---------- renewal outreach: the PendingRenewal queue, assigned to the M&O chair ----------
  const lastPeriod = new Map();
  for (const per of periods) lastPeriod.set(per.MemberNumber, per);
  const activeTerm = R.committees.terms[R.committees.terms.length - 1];
  const moChair = (rosterByTerm.get(`Membership & Outreach Committee:${activeTerm.start}`) ?? []).find((m) => m.RoleKey === 'Chair');
  for (const [memberNumber, per] of [...lastPeriod.entries()].sort()) {
    if (per.Status !== 'PendingRenewal') continue;
    const p = personByNum.get(memberNumber);
    const r = rng(seed, `otask:${memberNumber}`);
    const task = pushTask({
      TaskKey: `otask:${memberNumber}`, Name: `Renewal outreach — ${p.FirstName} ${p.LastName} (${memberNumber})`,
      TypeKey: 'Renewal Outreach', Priority: 'High',
      Status: r.bernoulli(0.4) ? 'InProgress' : 'Open',
      DueAt: `${per.EndDate}T17:00:00Z`, _created: `${releaseIso}T09:00:00Z`,
      CreatedByMemberNumber: null, IsSharedDemo: true,
    });
    task.PercentComplete = task.Status === 'InProgress' ? 25 : 0;
    if (moChair) assign(task, moChair.MemberNumber, 'InProgress');
    link(task, PEOPLE_ENTITY, 'person', memberNumber);
  }

  for (const t of tasks) { delete t._assignee; delete t._dueIso; delete t._created; }
  return { taskTypes, tasks, taskAssignments, taskLinks };
}
