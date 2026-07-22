// Issues — targets bizapps-issues (slice: IssueType/IssueStatus/Issue/IssueNumberSequence).
//
// Tickets DERIVE from real facts, so support volume correlates with real problems:
// overdue orders → billing tickets, employer lifecycle events → data-correction requests,
// paid no-shows → refund questions — plus the authored Kate/Kathy duplicate report (the
// dedup demo's paper trail). Status rides recency: old issues resolved, fresh ones open.
// Source references use the polymorphic pattern (entity NAME + record UUID, resolved at load).

import { rng } from '../../engine/rng.mjs';
import { iso, addDays, parseDate } from '../../engine/dates.mjs';

export function buildIssues(cfg, people, orgs, events, registrations, money, committees) {
  const { R, seed, release } = cfg;
  const I = R.issues;
  const releaseIso = iso(release);
  const orgByKey = new Map(orgs.map((o) => [o.OrgKey, o]));
  const typeDefault = new Map(I.types.map((t) => [t.name, t.priority]));

  const issueTypes = I.types.map((t) => ({ TypeKey: t.name, Name: t.name, Description: t.description, DefaultPriority: t.priority, IsActive: true, IsSharedDemo: true }));
  const issueStatuses = I.statuses.map((s) => ({ StatusKey: s.name, Name: s.name, Sequence: s.sequence, IsDefault: s.isDefault, IsTerminal: s.isTerminal, ColorCode: s.color, IsSharedDemo: true }));

  const drafts = []; // { key, type, title, reporter, sourceEntityName, sourceRefKind, sourceRefKey, created, priority }

  // billing: members with an overdue order sometimes file a ticket
  const overdueByMember = new Map();
  for (const o of money.orders) {
    if (o.PaymentStatus === 'Overdue' && !overdueByMember.has(o.MemberNumber)) overdueByMember.set(o.MemberNumber, o);
  }
  for (const [memberNumber, order] of [...overdueByMember.entries()].sort()) {
    const r = rng(seed, `issue-billing:${memberNumber}`);
    if (!r.bernoulli(I.billing.sharePerOverdueMember)) continue;
    drafts.push({
      key: `billing:${memberNumber}`, type: 'Billing', priority: 'High',
      title: `Overdue dues question — order ${order.OrderKey}`,
      reporter: memberNumber, sourceEntityName: 'MoreCheese: Orders', sourceRefKind: 'order', sourceRefKey: order.OrderKey,
      created: iso(addDays(parseDate(order.DueDate), r.int(3, 20))),
    });
  }

  // data corrections: employer had a lifecycle event while the member was around
  for (const p of people) {
    const ev = p.OrgKey ? orgByKey.get(p.OrgKey)?.LifecycleEvent : null;
    if (!ev) continue;
    const r = rng(seed, `issue-datafix:${p.MemberNumber}`);
    if (!r.bernoulli(0.25)) continue;
    drafts.push({
      key: `datafix:${p.MemberNumber}`, type: 'Data Correction', priority: 'Medium',
      title: `Employer record out of date — ${orgByKey.get(p.OrgKey).Name}`,
      reporter: p.MemberNumber, sourceEntityName: 'MJ_BizApps_Common: Organizations', sourceRefKind: 'org', sourceRefKey: p.OrgKey,
      created: iso(addDays(new Date(Date.UTC(ev.year, 11, 31)), -r.int(0, 120))),
    });
  }

  // refunds: paid-event no-shows occasionally ask
  const eventByKey = new Map(events.map((e) => [e.EventKey, e]));
  for (const reg of registrations) {
    const ev = eventByKey.get(reg.EventKey);
    if (reg.Attended !== false || !ev?.IsPaid) continue;
    const r = rng(seed, `issue-refund:${reg.RegKey}`);
    if (!r.bernoulli(I.refunds.sharePerPaidNoShow)) continue;
    drafts.push({
      key: `refund:${reg.RegKey}`, type: 'Events', priority: 'Medium',
      title: `Refund request — ${ev.Name}`,
      reporter: reg.MemberNumber, sourceEntityName: 'MoreCheese: Event Registrations', sourceRefKind: 'reg', sourceRefKey: reg.RegKey,
      created: iso(addDays(parseDate(ev.Date), r.int(1, 10))),
    });
  }

  // authored: the dedup paper trail (Kate reports the duplicate; source = the dup record)
  drafts.push({
    key: 'dedup:ICF-000111', type: 'Data Correction', priority: 'Medium',
    title: "Duplicate member records — Kate O'Leary appears twice",
    reporter: 'ICF-000111', sourceEntityName: 'MJ_BizApps_Common: People', sourceRefKind: 'person', sourceRefKey: 'ICF-000287',
    created: iso(addDays(release, -21)),
  });

  // authored: flagship-hero issues (cross-app footprint) — declared facts, like Kate's report
  for (const h of R.heroes) {
    (h.issues ?? []).forEach((it, i) => {
      drafts.push({
        key: `hero:${h.memberNumber}:${i}`, type: it.type, priority: typeDefault.get(it.type) ?? 'Medium',
        title: it.title,
        reporter: h.memberNumber, sourceEntityName: 'MJ_BizApps_Common: People', sourceRefKind: 'person', sourceRefKey: h.memberNumber,
        created: iso(addDays(release, -it.daysBeforeRelease)),
      });
    });
  }

  // triage inputs: the severity/priority ladder and the assignable-officer pool.
  // Assignees follow the renewal-outreach precedent: issues route to committee OFFICERS
  // (active-term Chairs/Vice-Chairs) — no invented staff records.
  const LADDER = ['Low', 'Medium', 'High', 'Critical'];
  const clampRung = (i) => LADDER[Math.max(0, Math.min(LADDER.length - 1, i))];
  const activeTerm = R.committees.terms.at(-1);
  const officers = committees.memberships
    .filter((m) => m.TermKey.endsWith(`:${activeTerm.start}`) && ['Chair', 'Vice Chair'].includes(m.RoleKey))
    .sort((a, b) => a.MembershipKey < b.MembershipKey ? -1 : 1);
  const assignShareByStatus = { New: 0.4, 'In Progress': 0.95, Resolved: 0.77, Closed: 0.77 };

  // number + status: deterministic order (created, then key), recency drives openness
  drafts.sort((a, b) => (a.created + a.key) < (b.created + b.key) ? -1 : 1);
  const openCut = iso(addDays(release, -I.recencyOpenDays));
  const issues = drafts.map((d, i) => {
    const r = rng(seed, `issue-status:${d.key}`);
    const recent = d.created >= openCut;
    const status = recent ? (r.bernoulli(0.55) ? 'New' : 'In Progress') : (r.bernoulli(0.7) ? 'Resolved' : 'Closed');
    const terminal = status === 'Resolved' || status === 'Closed';

    // severity = IMPACT (weighted per type); priority = URGENCY (type default, bumped by
    // severity, occasionally mis-triaged down) — decoupled, own stream so status draws
    // stay byte-identical per key
    const rt = rng(seed, `issue-sevprio:${d.key}`);
    const severity = rt.pickWeighted(I.severity.byType[d.type]);
    let rung = LADDER.indexOf(d.priority);
    if (LADDER.indexOf(severity) >= LADDER.indexOf(I.priorityRule.bumpIfSeverityAtLeast)) rung += 1;
    if (rt.bernoulli(I.priorityRule.noiseDownShare)) rung -= 1;
    const priority = clampRung(rung);

    // assignment: New issues often still sit unassigned; worked/terminal ones mostly routed
    const ra = rng(seed, `issue-assign:${d.key}`);
    const assignee = officers.length && ra.bernoulli(assignShareByStatus[status] ?? 0.75)
      ? officers[ra.int(0, officers.length - 1)] : null;

    return {
      IssueKey: d.key, IssueNumber: `${I.numberPrefix}-${String(i + 1).padStart(4, '0')}`,
      Title: d.title, TypeKey: d.type, StatusKey: status,
      Severity: severity, Priority: priority,
      ReporterMemberNumber: d.reporter,
      AssigneeEntityName: assignee ? 'MJ_BizApps_Common: People' : null,
      AssigneeMemberNumber: assignee ? assignee.MemberNumber : null,
      SourceEntityName: d.sourceEntityName, SourceRefKind: d.sourceRefKind, SourceRefKey: d.sourceRefKey,
      ResolvedAt: terminal ? `${iso(addDays(parseDate(d.created), r.int(3, 21)))}T15:00:00Z` : null,
      ClosedAt: status === 'Closed' ? `${iso(addDays(parseDate(d.created), r.int(21, 45)))}T15:00:00Z` : null,
      IsSharedDemo: true,
    };
  });

  const issueSequences = [{ ScopeCode: I.numberPrefix, NextSequenceNumber: issues.length + 1, IsSharedDemo: true }];
  return { issueTypes, issueStatuses, issues, issueSequences };
}
