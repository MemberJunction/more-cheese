// MJ platform "usage residue" — seeds __mj CORE application data so the instance looks
// actively used (plan: plans/association-db/MJ-PLATFORM-RESIDUE-PLAN-2026-07-23.md).
//
// Two rules govern everything here:
//  1. DERIVE, NEVER INVENT — every RecordChange row mirrors a timeline fact another pack
//     already generated (issue resolutions, task completions, hero profile/period creation,
//     the stale-employer relationship edits). ChangedAt always falls inside the subject
//     record's real dates; ChangesJSON/FullRecordJSON are computed from the same pack row.
//  2. TRUE TRANSCRIPTS — conversation texts carry {N:FACT}/{HERO:memberNumber} tokens the
//     generator substitutes with numbers COMPUTED from this build's world, so every claim
//     a seeded Skip transcript makes is true for the seed that shipped it.
//
// Application data only: users, views, queries, conversations, favorites, lists,
// notifications, record changes. Never __mj entity-definition rows (CodeGen owns those).

import { rng } from '../../engine/rng.mjs';

const ts = (ms) => new Date(ms).toISOString().replace(/\.\d{3}Z$/, 'Z');

export function buildPlatform(cfg, { people, periods, events, registrations, tasks, issues, relationships }) {
  const { R, seed, release } = cfg;
  const P = R.platform;
  const releaseMs = release.getTime();
  const personByKey = new Map(people.map((p) => [p.MemberNumber, p]));
  const fullName = (m) => { const p = personByKey.get(m); return p ? `${p.FirstName} ${p.LastName}` : m; };

  // ---------- staff users (the personas demos log in as) ----------
  const users = P.staff.map((s) => ({
    UserKey: s.key, FirstName: s.first, LastName: s.last, Title: s.title,
    Name: `${s.first} ${s.last}`,
    Email: `${s.first}.${s.last}`.toLowerCase().replace(/[^a-z0-9.]/g, '') + `@${P.emailDomain}`,
  }));
  const userRoles = P.staff.map((s) => ({ RoleKey: `${s.key}:UI`, UserKey: s.key }));

  // ---------- computed facts (the tokens conversations may cite) ----------
  const lastPeriod = new Map();
  for (const per of periods) lastPeriod.set(per.MemberNumber, per);
  const pendingMembers = [...lastPeriod.entries()].filter(([, per]) => per.Status === 'PendingRenewal').map(([m]) => m).sort();
  const openIssue = (i) => i.StatusKey !== 'Resolved' && i.StatusKey !== 'Closed';
  const segCounts = new Map();
  for (const p of people) segCounts.set(p.Segment, (segCounts.get(p.Segment) ?? 0) + 1);
  const topSegment = [...segCounts.entries()].sort((a, b) => b[1] - a[1] || (a[0] < b[0] ? -1 : 1))[0];
  const pastConfs = events.filter((e) => e.EventType === 'Conference' && new Date(e.Date).getTime() < releaseMs).sort((a, b) => (a.Date < b.Date ? 1 : -1));
  const conf = pastConfs[0];
  const confRegs = conf ? registrations.filter((x) => x.EventKey === conf.EventKey) : [];
  const confAttended = confRegs.filter((x) => x.Attended).length;
  const facts = {
    MEMBER_COUNT: people.length,
    PENDING_RENEWALS: pendingMembers.length,
    LAPSED_2025: periods.filter((x) => x.Status === 'Lapsed' && String(x.EndDate).startsWith('2025')).length,
    OPEN_BILLING: issues.issues.filter((i) => i.TypeKey === 'Billing' && openIssue(i)).length,
    TOP_SEGMENT: topSegment[0],
    TOP_SEGMENT_COUNT: topSegment[1],
    CONF_YEAR: conf?.Year ?? '—',
    CONF_REGS: confRegs.length,
    CONF_ATTENDED: confAttended,
    CONF_ATTEND_PCT: confRegs.length ? Math.round((100 * confAttended) / confRegs.length) : 0,
  };
  const substitute = (text) => text
    .replace(/\{N:([A-Z_0-9]+)\}/g, (_, k) => String(facts[k] ?? `{N:${k}}`))
    .replace(/\{HERO:([A-Z0-9-]+)\}/g, (_, m) => fullName(m));

  // ---------- shared views + reusable queries (all-viewer-visible residue) ----------
  // GridState/FilterState mirror what Explorer writes when a user saves a view — a seeded
  // view without them has no column layout. Shapes copied from organic v5.45 rows.
  const views = P.sharedViews.map((v) => ({
    ViewKey: v.key, UserKey: v.owner, EntityName: v.entityName,
    Name: v.name, Description: v.description, WhereClause: v.whereClause,
    GridState: JSON.stringify({
      dataState: { sort: v.sort ? [{ field: v.sort.field, dir: v.sort.dir }] : [], filter: { logic: 'and', filters: [] } },
      columnSettings: v.columns.map((c) => ({ Name: c.name, DisplayName: c.displayName ?? null, width: c.width ?? null, orderIndex: null, hidden: false })),
    }),
    FilterState: JSON.stringify({ logic: 'and', filters: [] }),
  }));
  const queries = P.queries.map((q) => ({
    QueryKey: q.key, Name: q.name, UserQuestion: q.userQuestion, Description: q.description, SQL: q.sql,
  }));

  // ---------- conversations (Skip-style; the assistant only says computed truths) ----------
  const conversations = [];
  const conversationDetails = [];
  for (const c of P.conversations) {
    const r = rng(seed, `platform-conv:${c.key}`);
    let clock = releaseMs - c.daysBeforeRelease * 86400000;
    clock -= clock % 3600000; // top of the hour; per-turn minutes advance below
    conversations.push({ ConvKey: c.key, UserKey: c.owner, Name: c.name, CreatedAtTs: ts(clock) });
    c.turns.forEach((t, i) => {
      conversationDetails.push({
        MsgKey: `${c.key}:${i}`, ConvKey: c.key, Role: t.role,
        UserKey: t.role === 'User' ? c.owner : null,
        Message: substitute(t.text), CreatedAtTs: ts(clock),
      });
      clock += (2 + r.int(0, 4)) * 60000;
    });
  }

  // ---------- favorites + lists (per-staff residue; demos log in as staff) ----------
  const favorites = P.favorites.memberNumbers.map((m) => ({
    FavKey: `fav:${m}`, UserKey: P.favorites.owner,
    EntityName: 'MoreCheese: Member Profiles', RefKind: 'memberprofile', RefKey: m,
  }));
  const lists = [];
  const listDetails = [];
  for (const l of P.lists) {
    lists.push({ ListKey: l.key, UserKey: l.owner, EntityName: l.entityName, Name: l.name, Description: l.description });
    if (l.source === 'renewal-outreach-tasks') {
      pendingMembers.forEach((m, i) => listDetails.push({
        ItemKey: `${l.key}:${m}`, ListKey: l.key, RefKind: 'memberprofile', RefKey: m, Sequence: i + 1,
      }));
    }
  }

  // ---------- notifications ----------
  const notifications = P.notifications.map((n, i) => ({
    NotifKey: `notif:${i}`, UserKey: n.owner, Title: n.title, Message: n.message,
    Unread: n.unread, ReadAt: n.unread ? null : ts(releaseMs - n.daysBeforeRelease * 86400000 + 6 * 3600000),
  }));

  // ---------- RecordChange audit backfill — every row mirrors a generated timeline ----------
  const RC = P.recordChanges;
  const recordChanges = [];
  const staffPick = (key) => P.staff[rng(seed, `platform-attr:${key}`).int(0, P.staff.length - 1)].key;
  const push = (key, entityName, refKind, refKey, type, at, changes, description, fullRecord, staffKey) =>
    recordChanges.push({
      ChangeKey: key, EntityName: entityName, RefKind: refKind, RefKey: refKey,
      UserKey: staffKey ?? staffPick(key), Type: type, ChangedAt: at,
      ChangesJSON: JSON.stringify(changes), ChangesDescription: description,
      FullRecordJSON: JSON.stringify(fullRecord),
    });

  if (RC.issueTransitions) {
    for (const i of issues.issues) {
      const snap = { IssueNumber: i.IssueNumber, Title: i.Title, Severity: i.Severity, Priority: i.Priority };
      if (i.ResolvedAt) push(`rc:issue:${i.IssueKey}:resolved`, 'MJ_BizApps_Issues: Issues', 'issue', i.IssueKey,
        'Update', i.ResolvedAt, { Status: { oldValue: 'In Progress', newValue: 'Resolved' } },
        'Status changed from In Progress to Resolved', { ...snap, Status: 'Resolved' });
      if (i.ClosedAt) push(`rc:issue:${i.IssueKey}:closed`, 'MJ_BizApps_Issues: Issues', 'issue', i.IssueKey,
        'Update', i.ClosedAt, { Status: { oldValue: 'Resolved', newValue: 'Closed' } },
        'Status changed from Resolved to Closed', { ...snap, Status: 'Closed' });
    }
  }
  if (RC.taskCompletions) {
    for (const t of tasks.tasks) {
      if (!t.CompletedAt) continue;
      push(`rc:task:${t.TaskKey}`, 'MJ_BizApps_Tasks: Tasks', 'task', t.TaskKey,
        'Update', t.CompletedAt,
        { Status: { oldValue: 'InProgress', newValue: t.Status }, PercentComplete: { oldValue: 50, newValue: 100 } },
        `Task completed: ${t.Name}`, { Name: t.Name, Status: t.Status, PercentComplete: 100 });
    }
  }
  const heroes = people.filter((p) => p._hero);
  if (RC.heroProfileCreates) {
    for (const h of heroes) {
      push(`rc:profile:${h.MemberNumber}`, 'MoreCheese: Member Profiles', 'memberprofile', h.MemberNumber,
        'Create', `${h.JoinDate}T09:30:00Z`, {},
        `Member profile created for ${h.FirstName} ${h.LastName} (${h.MemberNumber})`,
        { MemberNumber: h.MemberNumber, Segment: h.Segment, Region: h.Region, City: h.City, State: h.State, JoinDate: h.JoinDate });
    }
  }
  if (RC.heroPeriodCreates) {
    const heroNums = new Set(heroes.map((h) => h.MemberNumber));
    for (const per of periods) {
      if (!heroNums.has(per.MemberNumber)) continue;
      push(`rc:period:${per.PeriodKey}`, 'MoreCheese: Membership Periods', 'period', per.PeriodKey,
        'Create', `${per.StartDate}T09:00:00Z`, {},
        `Membership period opened for ${fullName(per.MemberNumber)} (${per.MembershipTier})`,
        { MemberNumber: per.MemberNumber, MembershipTier: per.MembershipTier, StartDate: per.StartDate, EndDate: per.EndDate, Status: 'Active' });
    }
  }
  if (RC.staleEmployerRelEdits) {
    // the defects module ended the old employment edge and opened emp-true: — mirror both
    const rels = relationships.relationships;
    for (const nu of rels.filter((x) => x.RelKey.startsWith('emp-true:'))) {
      const member = nu.RelKey.slice('emp-true:'.length);
      const old = rels.find((x) => x.RelKey.startsWith('emp:') && x.FromMemberNumber === member && x.Status === 'Ended' && x.EndDate === nu.StartDate);
      const analyst = P.staff.find((s) => s.key === 'ops-analyst')?.key;
      if (old) push(`rc:rel:${old.RelKey}`, 'MJ_BizApps_Common: Relationships', 'rel', old.RelKey,
        'Update', `${old.EndDate}T11:00:00Z`,
        { Status: { oldValue: 'Active', newValue: 'Ended' }, EndDate: { oldValue: null, newValue: old.EndDate } },
        'Employment relationship ended', { Status: 'Ended', StartDate: old.StartDate, EndDate: old.EndDate }, analyst);
      push(`rc:rel:${nu.RelKey}`, 'MJ_BizApps_Common: Relationships', 'rel', nu.RelKey,
        'Create', `${nu.StartDate}T11:05:00Z`, {},
        `Employment relationship recorded for ${fullName(member)}`,
        { Status: 'Active', StartDate: nu.StartDate, Title: nu.Title ?? null }, analyst);
    }
  }
  // clamp: audit rows never post-date the release
  for (const rc of recordChanges) if (new Date(rc.ChangedAt).getTime() > releaseMs) rc.ChangedAt = ts(releaseMs - 3600000);

  return { users, userRoles, views, queries, conversations, conversationDetails, favorites, lists, listDetails, notifications, recordChanges };
}
