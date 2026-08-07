// The membership funnel — the BEFORE half of a story we only told the after half of.
//
// Non-members on their own are inert: 550 people who attended a webinar and never appear
// again. What makes them mean something is a conversion rate, and that needs members who
// were once prospects.
//
// The trick that makes this free: do NOT convert prospects into new members. Give a share of
// RECENT JOINERS the history they would have had — a free webinar or two before they joined,
// and a membership application shortly before their start date. The roster doesn't change by
// one row, so every membership benchmark (statusMix, retention, revenue, engagement) stays
// exactly where it was, and the funnel becomes queryable:
//
//   of everyone who attended a 2024 webinar, how many were members within six months?
//
// The prospects who never joined are the denominator. That question is the membership
// director's week, and nothing else in this dataset could answer it.
//
// Also here: the two things that made non-members feel like scenery rather than people —
// their employer (generated, then never emitted anywhere) and their job title.

import { rng } from '../../engine/rng.mjs';
import { titleFor } from './banks.mjs';
import { emailFor } from './world.mjs';
import { iso, addDays, parseDate } from '../../engine/dates.mjs';

export function buildFunnel(cfg, { people, prospects, orgs, events, periods, application }) {
  const { R, seed, release } = cfg;
  const F = R.funnel;
  const releaseIso = iso(release);
  const relYear = release.getUTCFullYear();

  const preRegistrations = [];
  const responses = [];
  const answers = [];
  const employmentEdges = [];

  // first period start per member — the moment they became a member
  const firstStart = new Map();
  for (const per of periods) {
    const cur = firstStart.get(per.MemberNumber);
    if (!cur || per.StartDate < cur) firstStart.set(per.MemberNumber, per.StartDate);
  }

  const freeEvents = events.filter((e) => !e.IsPaid && e.Date <= releaseIso);

  // ---------- A. recent joiners get the history that preceded them ----------
  const recent = people.filter((p) => {
    const start = firstStart.get(p.MemberNumber);
    return start && relYear - parseDate(start).getUTCFullYear() <= F.params.lookbackYears;
  });

  for (const p of recent) {
    const r = rng(seed, `funnel:${p.MemberNumber}`);
    if (!r.bernoulli(F.params.knownBeforeJoiningShare)) continue; // the rest arrived cold
    const start = firstStart.get(p.MemberNumber);

    // webinars they sat in on while still a non-member
    const window = freeEvents.filter((e) => e.Date < start && e.Date >= iso(addDays(parseDate(start), -F.params.priorWindowDays)));
    const wanted = Math.min(r.int(1, F.params.maxPriorWebinars), window.length);
    const taken = new Set();
    for (let i = 0; i < wanted; i++) {
      const ev = r.pick(window);
      if (taken.has(ev.EventKey)) continue;
      taken.add(ev.EventKey);
      preRegistrations.push({
        RegKey: `REG-${p.MemberNumber}-${ev.EventKey}`, MemberNumber: p.MemberNumber, EventKey: ev.EventKey,
        RegisteredOn: iso(addDays(parseDate(ev.Date), -r.int(1, 21))),
        Attended: r.bernoulli(F.params.priorAttendShare), IsSharedDemo: true,
      });
    }

    // and the application they filled in on the way — a NAMED response (the anonymous ones
    // in forms.mjs are the people who applied and never joined, or haven't yet)
    if (!r.bernoulli(F.params.applicationShare)) continue;
    const when = addDays(parseDate(start), -r.int(3, F.params.applicationLeadDays));
    if (iso(when) < `${R.history.startYear}-01-01`) continue;
    const respKey = `${application.formKey}:member:${p.MemberNumber}`;
    responses.push({
      ResponseKey: respKey, FormKey: application.formKey, VersionKey: `${application.formKey}:1`,
      DistributionKey: application.distributionKey, MemberNumber: p.MemberNumber,
      AnonymousSessionID: null,
      SourceMetadata: JSON.stringify({ channel: 'web', referrer: r.pick(application.referrers) }),
      Status: 'Complete',
      StartedAt: `${iso(when)}T${String(r.int(9, 17)).padStart(2, '0')}:${String(r.int(0, 59)).padStart(2, '0')}:00Z`,
      SubmittedAt: `${iso(when)}T${String(r.int(9, 17)).padStart(2, '0')}:${String(r.int(0, 59)).padStart(2, '0')}:00Z`,
      IsSharedDemo: true,
    });
    const push = (qkey, fields) => answers.push({ AnswerKey: `${respKey}:${qkey}`, ResponseKey: respKey, QuestionKey: `${application.formKey}:${qkey}`, ...fields, IsSharedDemo: true });
    push('name', { TextValue: `${p.FirstName} ${p.LastName}` });
    push('email', { TextValue: p.Email });
    push('segment', { TextValue: p.Segment });
    push('newsletter', { BooleanValue: r.bernoulli(0.72) });
  }

  // ---------- B. non-members are people too: employer and title ----------
  // A prospect's OrgKey was generated and then emitted nowhere — Person has no organisation
  // column, so for members employment is a Relationship edge. Non-members get the same edge.
  const orgByKey = new Map(orgs.map((o) => [o.OrgKey, o]));
  for (const p of prospects) {
    if (!p.OrgKey) continue;
    const org = orgByKey.get(p.OrgKey);
    const dissolved = org?.LifecycleEvent?.kind === 'Dissolved';
    employmentEdges.push({
      RelKey: `emp:${p.MemberNumber}`, TypeKey: null, TypeID: R.relationships.params.seededTypeIDs.Employee,
      FromMemberNumber: p.MemberNumber, ToOrgKey: p.OrgKey,
      Title: p.Title ?? null, StartDate: p.JoinDate,
      EndDate: dissolved ? `${org.LifecycleEvent.year}-12-31` : null,
      Status: dissolved ? 'Ended' : 'Active',
      IsSharedDemo: true,
    });
  }

  return { preRegistrations, responses, answers, employmentEdges };
}

/** a non-member's job title — same bank as members, drawn on their own stream */
export function prospectTitle(seed, key, segment) {
  return titleFor(seed, `prospect-title:${key}`, segment);
}

export { emailFor };
