// Issues — targets bizapps-issues (slice: IssueType/IssueStatus/Issue/IssueNumberSequence).
//
// Tickets DERIVE from real facts, so support volume correlates with real problems:
// overdue orders → billing tickets, employer lifecycle events → data-correction requests,
// paid no-shows → refund questions — plus the authored Kate/Kathy duplicate report (the
// dedup demo's paper trail). Status rides recency: old issues resolved, fresh ones open.
// Source references use the polymorphic pattern (entity NAME + record UUID, resolved at load).

import { rng } from '../../engine/rng.mjs';
import { iso, addDays, parseDate } from '../../engine/dates.mjs';

// severity mixes are keyed by ticket type with spaces removed ('Data Correction' →
// severityDataCorrection), so each mix stays a flat map of level → weight
const severityKey = (type) => 'severity' + String(type).replace(/\s+/g, '');

export function buildIssues(cfg, people, orgs, events, registrations, money, committees) {
  const { R, seed, release } = cfg;
  const I = R.issues;
  const releaseIso = iso(release);
  const orgByKey = new Map(orgs.map((o) => [o.OrgKey, o]));
  const typeDefault = new Map(I.catalog.types.map((t) => [t.name, t.priority]));

  const issueTypes = I.catalog.types.map((t) => ({ TypeKey: t.name, Name: t.name, Description: t.description, DefaultPriority: t.priority, IsActive: true, IsSharedDemo: true }));
  const issueStatuses = I.catalog.statuses.map((s) => ({ StatusKey: s.name, Name: s.name, Sequence: s.sequence, IsDefault: s.isDefault, IsTerminal: s.isTerminal, ColorCode: s.color, IsSharedDemo: true }));

  const drafts = []; // { key, type, title, reporter, sourceEntityName, sourceRefKind, sourceRefKey, created, priority }

  // Titles rotate through per-kind phrasings (a board that is 68% one repeated template
  // reads as generated in seconds); descriptions carry the reported date + specifics —
  // the Issue table has no created-date column, so the date lives in the narrative text
  // and in the platform pack's RecordChange backfill.
  const titleOf = (r, kind, x) => r.pick({
    billing: [
      `Overdue dues question — order ${x.order}`, `Dues invoice ${x.order} still showing unpaid`,
      `Payment not reflected on order ${x.order}`, `Question about a past-due balance (${x.order})`,
    ],
    datafix: [
      `Employer record out of date — ${x.org}`, `Please update my employer — ${x.org} no longer current`,
      `Change of employment: profile still lists ${x.org}`, `Directory shows the wrong employer (${x.org})`,
      `Employer listing needs correction after changes at ${x.org}`,
    ],
    refund: [
      `Refund request — ${x.event}`, `Couldn't attend ${x.event} — refund options?`,
      `Missed ${x.event}; is a credit possible?`, `No-show refund policy question (${x.event})`,
    ],
    general: [
      'Question about membership benefits', 'Directory listing update request',
      'Trouble logging into the member portal', 'Newsletter not arriving',
      'How do I access past webinar recordings?', 'Certificate download link broken',
    ],
  }[kind]);
  const descOf = (kind, x, created) => ({
    billing: `Reported ${created} via the member portal. Member asks about order ${x.order}, which was due ${x.due} and is showing past due. Wants to confirm the balance and whether a payment already sent has been applied.`,
    datafix: `Reported ${created}. Member's profile still lists ${x.org} as employer; the organization record had a ${x.evKind ?? 'lifecycle'} event in ${x.evYear}. Requesting the employment record be corrected.`,
    refund: `Reported ${created}. Member registered for ${x.event} (${x.evDate}) but did not attend, and asks whether a refund or credit toward a future event is available under the no-show policy.`,
    general: `Reported ${created} via the member portal. ${x.detail}`,
  }[kind]);

  // billing: members with an overdue order sometimes file a ticket
  const overdueByMember = new Map();
  for (const o of money.orders) {
    if (o.PaymentStatus === 'Overdue' && !overdueByMember.has(o.MemberNumber)) overdueByMember.set(o.MemberNumber, o);
  }
  for (const [memberNumber, order] of [...overdueByMember.entries()].sort()) {
    const r = rng(seed, `issue-billing:${memberNumber}`);
    if (!r.bernoulli(I.params.billingSharePerOverdueMember)) continue;
    const created = iso(addDays(parseDate(order.DueDate), r.int(3, 20)));
    drafts.push({
      key: `billing:${memberNumber}`, type: 'Billing', priority: 'High',
      title: titleOf(r, 'billing', { order: order.OrderKey }),
      description: descOf('billing', { order: order.OrderKey, due: order.DueDate }, created),
      reporter: memberNumber, sourceEntityName: 'MoreCheese: Orders', sourceRefKind: 'order', sourceRefKey: order.OrderKey,
      created,
    });
  }

  // data corrections: employer had a lifecycle event while the member was around
  for (const p of people) {
    const ev = p.OrgKey ? orgByKey.get(p.OrgKey)?.LifecycleEvent : null;
    if (!ev) continue;
    const r = rng(seed, `issue-datafix:${p.MemberNumber}`);
    if (!r.bernoulli(0.25)) continue;
    const created = iso(addDays(new Date(Date.UTC(ev.year, 11, 31)), -r.int(0, 120)));
    const org = orgByKey.get(p.OrgKey).Name;
    drafts.push({
      key: `datafix:${p.MemberNumber}`, type: 'Data Correction', priority: 'Medium',
      title: titleOf(r, 'datafix', { org }),
      description: descOf('datafix', { org, evKind: ev.kind, evYear: ev.year }, created),
      reporter: p.MemberNumber, sourceEntityName: 'MJ_BizApps_Common: Organizations', sourceRefKind: 'org', sourceRefKey: p.OrgKey,
      created,
    });
  }

  // refunds: paid-event no-shows occasionally ask
  const eventByKey = new Map(events.map((e) => [e.EventKey, e]));
  for (const reg of registrations) {
    const ev = eventByKey.get(reg.EventKey);
    if (reg.Attended !== false || !ev?.IsPaid) continue;
    const r = rng(seed, `issue-refund:${reg.RegKey}`);
    if (!r.bernoulli(I.params.refundSharePerPaidNoShow)) continue;
    const created = iso(addDays(parseDate(ev.Date), r.int(1, 10)));
    drafts.push({
      key: `refund:${reg.RegKey}`, type: 'Events', priority: 'Medium',
      title: titleOf(r, 'refund', { event: ev.Name }),
      description: descOf('refund', { event: ev.Name, evDate: ev.Date }, created),
      reporter: reg.MemberNumber, sourceEntityName: 'MoreCheese: Event Registrations', sourceRefKind: 'reg', sourceRefKey: reg.RegKey,
      created,
    });
  }

  // general inquiries: a thin, fact-free stream every real support queue has — portal
  // logins, newsletters, directory updates. Small share of members, anywhere in coverage.
  const generalDetails = [
    'Member asks which benefits apply at their tier and whether webinar recordings are included.',
    'Member requests an update to how their name appears in the public directory.',
    'Member cannot sign in to the portal; password reset email reportedly never arrives.',
    'Member reports the monthly newsletter stopped arriving after an email change.',
    'Member asks where to find recordings of past webinars they registered for.',
    'Member reports the certificate download link on their profile returns an error.',
  ];
  for (const p of people) {
    if (p._hero) continue;
    const r = rng(seed, `issue-general:${p.MemberNumber}`);
    if (!r.bernoulli(I.params.generalSharePerMember)) continue;
    const daysBack = r.int(10, 1400);
    const created = iso(addDays(release, -daysBack));
    if (created < p.JoinDate) continue;
    const idx = r.int(0, generalDetails.length - 1);
    drafts.push({
      key: `general:${p.MemberNumber}`, type: 'General', priority: 'Low',
      title: titleOf(r, 'general', {}),
      description: descOf('general', { detail: generalDetails[idx] }, created),
      reporter: p.MemberNumber, sourceEntityName: 'MJ_BizApps_Common: People', sourceRefKind: 'person', sourceRefKey: p.MemberNumber,
      created,
    });
  }

  // authored: the dedup paper trail (Kate reports the duplicate; source = the dup record)
  const dedupCreated = iso(addDays(release, -21));
  drafts.push({
    key: 'dedup:ICF-000111', type: 'Data Correction', priority: 'Medium',
    title: "Duplicate member records — Kate O'Leary appears twice",
    description: `Reported ${dedupCreated}. Member reports two records under variants of her name (Kate / Kathy O'Leary), causing duplicate mailings and a split event history. Requesting the records be merged and the surviving record verified.`,
    reporter: 'ICF-000111', sourceEntityName: 'MJ_BizApps_Common: People', sourceRefKind: 'person', sourceRefKey: 'ICF-000287',
    created: dedupCreated,
  });

  // authored: flagship-hero issues (cross-app footprint) — declared facts, like Kate's report
  for (const h of R.heroes) {
    (h.issues ?? []).forEach((it, i) => {
      const created = iso(addDays(release, -it.daysBeforeRelease));
      drafts.push({
        key: `hero:${h.memberNumber}:${i}`, type: it.type, priority: typeDefault.get(it.type) ?? 'Medium',
        title: it.title,
        description: `Reported ${created} by ${h.firstName ?? 'the member'} via the member portal. ${it.detail ?? it.title}`,
        reporter: h.memberNumber, sourceEntityName: 'MJ_BizApps_Common: People', sourceRefKind: 'person', sourceRefKey: h.memberNumber,
        created,
      });
    });
  }

  // triage inputs: the severity/priority ladder and the assignable-officer pool.
  // Assignees follow the renewal-outreach precedent: issues route to committee OFFICERS
  // (active-term Chairs/Vice-Chairs) — no invented staff records.
  const LADDER = ['Low', 'Medium', 'High', 'Critical'];
  const clampRung = (i) => LADDER[Math.max(0, Math.min(LADDER.length - 1, i))];
  // TERM-AWARE officer pool: an issue is routed to someone who was actually serving when
  // it was filed. Drawing from the current term only put 2015 tickets on officers who
  // hadn't joined yet (26 issues resolved before their assignee's JoinDate).
  const joinOf = new Map(people.map((p) => [p.MemberNumber, p.JoinDate]));
  const termByKey = new Map((committees.terms ?? []).map((t) => [t.TermKey, t]));
  const allOfficers = committees.memberships
    .filter((m) => ['Chair', 'Vice Chair'].includes(m.RoleKey))
    .sort((a, b) => a.MembershipKey < b.MembershipKey ? -1 : 1);
  const officersOn = (dateIso) => {
    const serving = allOfficers.filter((m) => {
      const t = termByKey.get(m.TermKey);
      if (!t) return false;
      if (!(t.StartDate <= dateIso && dateIso <= t.EndDate)) return false;
      return (joinOf.get(m.MemberNumber) ?? '9999') <= dateIso;
    });
    // before the first term (early history) fall back to anyone already a member then
    return serving.length ? serving : allOfficers.filter((m) => (joinOf.get(m.MemberNumber) ?? '9999') <= dateIso);
  };
  const assignShareByStatus = { New: 0.4, 'In Progress': 0.95, Resolved: 0.77, Closed: 0.77 };

  // number + status: deterministic order (created, then key), recency drives openness
  drafts.sort((a, b) => (a.created + a.key) < (b.created + b.key) ? -1 : 1);
  const openCut = iso(addDays(release, -I.params.recencyOpenDays));
  const issues = drafts.map((d, i) => {
    const r = rng(seed, `issue-status:${d.key}`);
    const recent = d.created >= openCut;
    const status = recent ? (r.bernoulli(0.55) ? 'New' : 'In Progress') : (r.bernoulli(0.7) ? 'Resolved' : 'Closed');
    const terminal = status === 'Resolved' || status === 'Closed';

    // severity = IMPACT (weighted per type); priority = URGENCY (type default, bumped by
    // severity, occasionally mis-triaged down) — decoupled, own stream so status draws
    // stay byte-identical per key
    const rt = rng(seed, `issue-sevprio:${d.key}`);
    const severity = rt.pickWeighted(Object.entries(I.mixes[severityKey(d.type)]));
    let rung = LADDER.indexOf(d.priority);
    if (LADDER.indexOf(severity) >= LADDER.indexOf(I.params.priorityBumpIfSeverityAtLeast)) rung += 1;
    if (rt.bernoulli(I.params.priorityNoiseDownShare)) rung -= 1;
    const priority = clampRung(rung);

    // assignment: New issues often still sit unassigned; worked/terminal ones mostly routed.
    // Pool is the officers serving on the day the ticket was filed.
    const ra = rng(seed, `issue-assign:${d.key}`);
    const pool = officersOn(d.created);
    const assignee = pool.length && ra.bernoulli(assignShareByStatus[status] ?? 0.75)
      ? pool[ra.int(0, pool.length - 1)] : null;

    // resolution time is heavy-tailed, not a uniform 3–21 block: a large same/next-day
    // mass, a few-day median, and a thin tail that sits for months. Urgent tickets move
    // faster (severity actually matters). Times of day spread across the workday.
    const sevRush = { Critical: 0.35, High: 0.55, Medium: 1, Low: 1.6 }[severity] ?? 1;
    const band = r.pickWeighted([['same', 0.22], ['fast', 0.38], ['normal', 0.28], ['slow', 0.10], ['stale', 0.02]]);
    const rawDays = band === 'same' ? 0 : band === 'fast' ? r.int(1, 4) : band === 'normal' ? r.int(5, 18) : band === 'slow' ? r.int(19, 60) : r.int(61, 220);
    const resolveDays = Math.max(0, Math.round(rawDays * sevRush));
    const workHour = (rr) => `${String(rr.int(8, 17)).padStart(2, '0')}:${String(rr.int(0, 59)).padStart(2, '0')}:00Z`;

    return {
      IssueKey: d.key, IssueNumber: `${I.params.numberPrefix}-${String(i + 1).padStart(4, '0')}`,
      Title: d.title, Description: d.description ?? null, TypeKey: d.type, StatusKey: status,
      Severity: severity, Priority: priority,
      ReporterMemberNumber: d.reporter,
      AssigneeEntityName: assignee ? 'MJ_BizApps_Common: People' : null,
      AssigneeMemberNumber: assignee ? assignee.MemberNumber : null,
      SourceEntityName: d.sourceEntityName, SourceRefKind: d.sourceRefKind, SourceRefKey: d.sourceRefKey,
      ResolvedAt: terminal ? `${iso(addDays(parseDate(d.created), resolveDays))}T${workHour(r)}` : null,
      ClosedAt: status === 'Closed' ? `${iso(addDays(parseDate(d.created), resolveDays + r.int(1, 30)))}T${workHour(r)}` : null,
      IsSharedDemo: true,
    };
  });

  // ---------- presence floor: Critical must exist ----------
  // Critical is rare by design and lives only on Billing and Events. At demo scale the Billing
  // population is ~5 tickets, so 10% Critical means the DRAW yields none about half the time —
  // and the severity gate's tolerance band happily passes on zero, so nobody notices that a
  // support demo has no critical ticket in it. Promote the highest-impact eligible ticket
  // instead: deterministic, consumes no randomness, and only fires when the draws came up dry.
  {
    const want = I.params.severityCriticalFloor;
    const have = issues.filter((x) => x.Severity === 'Critical').length;
    if (want > have) {
      const eligible = issues
        .filter((x) => ((I.mixes[severityKey(x.TypeKey)] ?? {}).Critical ?? 0) > 0)
        .filter((x) => x.Severity !== 'Critical')
        // worst first: highest severity already assigned, then oldest (a long-running
        // escalation is the believable candidate), then key for a total order
        .sort((a, b) => (LADDER.indexOf(b.Severity) - LADDER.indexOf(a.Severity))
          || String(a.IssueNumber).localeCompare(String(b.IssueNumber)));
      for (const row of eligible.slice(0, want - have)) {
        row.Severity = 'Critical';
        if (LADDER.indexOf(row.Priority) < LADDER.indexOf('High')) row.Priority = 'High';
      }
    }
  }

  // ---------- comments: the activity feed every ticket lacked ----------
  // Derived from the ticket's own state, so a resolved ticket reads like one. The table has
  // no author-settable timestamp (only the system __mj_CreatedAt, which the entity SPs
  // re-stamp), so each body opens with its own date — the same workaround Description uses.
  const issueComments = [];
  const CM = I.catalog;
  if (CM) {
    for (const x of issues) {
      const d = drafts.find((y) => y.key === x.IssueKey);
      if (!d) continue;
      const r = rng(seed, `issuecomment:${x.IssueKey}`);
      if (!r.bernoulli(I.params.commentSharePerIssue)) continue;
      const worked = x.StatusKey !== 'New';
      const terminal = x.StatusKey === 'Resolved' || x.StatusKey === 'Closed';
      const at = (days) => iso(addDays(parseDate(d.created), days));
      let n = 0;
      // the feed must read forward: each entry is at least as late as the one before it
      let clock = 0;
      const push = (body, source, day) => { clock = Math.max(clock, day); return issueComments.push({
        CommentKey: `${x.IssueKey}:c${n}`, IssueKey: x.IssueKey, Sequence: n++,
        Body: `[${at(clock)}] ${body}`, Source: source,
        AuthorMemberNumber: source === 'inbound' ? x.ReporterMemberNumber : (x.AssigneeMemberNumber ?? null),
        IsSharedDemo: true,
      }); };
      if (worked) push(r.pick(CM.commentTriage), 'outbound', r.int(0, 2));
      if (worked && r.bernoulli(0.7)) push(r.pick(CM.commentInternal), 'internal', r.int(1, 5));
      if (worked && r.bernoulli(0.55)) push(r.pick(CM.commentMemberReply), 'inbound', r.int(2, 9));
      if (terminal) {
        const resolvedDay = x.ResolvedAt ? Math.round((parseDate(x.ResolvedAt.slice(0, 10)) - parseDate(d.created)) / 86400000) : 6;
        push(r.pick(CM.commentResolution), 'outbound', Math.max(clock + 1, resolvedDay));
      }
    }
  }

  const issueSequences = [{ ScopeCode: I.params.numberPrefix, NextSequenceNumber: issues.length + 1, IsSharedDemo: true }];
  return { issueTypes, issueStatuses, issues, issueSequences, issueComments };
}
