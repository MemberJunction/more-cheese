// Committees — targets bizapps-committees' real shapes (slice: Type/Committee/Term/Role/
// Membership/Meeting/Attendance). Engaged members volunteer (theta arrow via childOutcome);
// chairs are deterministic (pinned heroes first, else the longest-tenured member of the
// committee-term); meetings run quarterly and attendance is a calibrated outcome over the
// ACTUAL roster of each meeting's term.
//
// Hero seats come from heroes.json `committees:[{committee, role, terms}]` — declared facts,
// never drawn (Gwen chairs Food Safety; Elena sits on Standards).

import { rng } from '../../engine/rng.mjs';
import { childOutcome } from '../../engine/patterns.mjs';
import { iso, parseDate } from '../../engine/dates.mjs';

export function buildCommittees(cfg, people, periods) {
  const { R, seed, release } = cfg;
  const C = R.committees;

  const coveredOn = memberCoverage(periods);

  // ---------- fixtures: types, roles, committees, terms (authored, not drawn) ----------
  const types = C.types.map((t) => ({ TypeKey: t.name, Name: t.name, IsStandards: t.isStandards, DefaultTermMonths: t.termMonths, IsSharedDemo: true }));
  const roles = C.roles.map((r) => ({ RoleKey: r.name, Name: r.name, IsOfficer: r.isOfficer, IsVotingRole: r.isVoting, Sequence: r.sequence, IsSharedDemo: true }));
  const committees = C.list.map((c) => ({ CommitteeKey: c.name, Name: c.name, TypeKey: c.type, MissionStatement: c.mission, Status: 'Active', FormationDate: c.formed, IsSharedDemo: true }));
  const terms = [];
  for (const c of C.list) for (const t of C.terms) {
    terms.push({ TermKey: `${c.name}:${t.start}`, CommitteeKey: c.name, Name: t.name, StartDate: t.start, EndDate: t.end, Status: t.end < iso(release) ? 'Completed' : 'Active', IsSharedDemo: true });
  }

  // ---------- memberships: per term, engaged members volunteer ----------
  const memberships = [];
  const rosterByTerm = new Map(); // `${committee}:${termStart}` → [person]
  for (const t of C.terms) {
    const eligible = people.filter((p) => !p._hero && coveredOn(p.MemberNumber, t.start));
    childOutcome({
      seed,
      items: eligible,
      scoreOf: (p) => C.participation.arrows.engagement.beta * (p._thetaPath?.[parseDate(t.start).getUTCFullYear()] ?? p._theta),
      target: C.participation.shareOfEligible,
      streamKey: (p) => `committee-serve:${p.MemberNumber}:${t.start}`,
      decide: (p, prob, r) => {
        if (!r.bernoulli(prob)) return;
        const committee = r.pick(C.list).name; // which committee: the member's own dice
        pushMembership(p, committee, t, 'Member');
      },
    });
  }
  // hero seats: declared facts (roles included), placed after the crowd draw
  for (const h of R.heroes) {
    for (const seat of h.committees ?? []) {
      for (const termName of seat.terms) {
        const t = C.terms.find((x) => x.name === termName);
        const p = people.find((x) => x.MemberNumber === h.memberNumber);
        if (t && p) pushMembership(p, seat.committee, t, seat.role);
      }
    }
  }
  // officers: any committee-term without a pinned Chair/Vice Chair promotes its
  // longest-standing members (deterministic: lowest member number = earliest joiner block)
  for (const [key, roster] of rosterByTerm) {
    for (const role of ['Chair', 'Vice Chair']) {
      if (roster.some((m) => m.row.RoleKey === role)) continue;
      // hero roles are DECLARED facts — never promoted past them
      const candidate = roster.filter((m) => m.row.RoleKey === 'Member' && !m.p._hero).sort((a, b) => a.row.MemberNumber < b.row.MemberNumber ? -1 : 1)[0];
      if (candidate) candidate.row.RoleKey = role;
    }
  }

  function pushMembership(p, committee, t, role) {
    const key = `${committee}:${t.start}`;
    const row = {
      MembershipKey: `${p.MemberNumber}:${key}`, MemberNumber: p.MemberNumber, CommitteeKey: committee,
      TermKey: key, RoleKey: role, StartDate: t.start, EndDate: t.end,
      Status: t.end < iso(release) ? 'Ended' : 'Active', IsSharedDemo: true,
    };
    memberships.push(row);
    if (!rosterByTerm.has(key)) rosterByTerm.set(key, []);
    rosterByTerm.get(key).push({ p, row });
  }

  // ---------- meetings: quarterly per committee; attendance over the term's actual roster ----------
  const meetings = [];
  const attendance = [];
  const attByMeeting = new Map(); // MeetingKey → [{membership row, status}] — votes stay consistent with attendance
  const releaseIso = iso(release);
  for (const c of C.list) {
    for (let y = C.meetings.startYear; y <= release.getUTCFullYear(); y++) {
      for (let q = 0; q < C.meetings.cadencePerYear; q++) {
        const month = q * 3 + 1; // Jan/Apr/Jul/Oct
        const dt = `${y}-${String(month).padStart(2, '0')}-${String(C.meetings.dayOfMonth).padStart(2, '0')}`;
        if (dt > releaseIso) continue;
        const term = C.terms.find((t) => t.start <= dt && dt <= t.end);
        if (!term) continue;
        const meeting = {
          MeetingKey: `${c.name}:${dt}`, CommitteeKey: c.name, Name: `${c.name} — Q${q + 1} ${y} meeting`,
          StartDateTime: `${dt}T${String(C.meetings.hourUTC).padStart(2, '0')}:00:00Z`,
          LocationType: 'Virtual', Status: 'Completed', IsSharedDemo: true,
        };
        meetings.push(meeting);
        const roster = (rosterByTerm.get(`${c.name}:${term.start}`) ?? []);
        if (!roster.length) continue;
        const A = C.meetings.attendance;
        childOutcome({
          seed,
          items: roster,
          scoreOf: (m) => A.arrows.engagement.beta * (m.p._thetaPath?.[y] ?? m.p._theta),
          target: A.presentTarget,
          streamKey: (m) => `committee-att:${m.p.MemberNumber}:${meeting.MeetingKey}`,
          decide: (m, prob, r) => {
            // hero attendance pin (Gwen: "high meeting attendance") is a fact, not a draw
            const present = m.p._hero && seatPinned(m.p.MemberNumber, c.name) ? true : r.bernoulli(prob);
            const status = present ? 'Present' : r.bernoulli(A.excusedShareOfAbsent) ? 'Excused' : 'Absent';
            attendance.push({ AttendanceKey: `${m.p.MemberNumber}:${meeting.MeetingKey}`, MeetingKey: meeting.MeetingKey, MemberNumber: m.p.MemberNumber, AttendanceStatus: status, IsSharedDemo: true });
            if (!attByMeeting.has(meeting.MeetingKey)) attByMeeting.set(meeting.MeetingKey, []);
            attByMeeting.get(meeting.MeetingKey).push({ membership: m.row, status });
          },
        });
      }
    }
  }

  function seatPinned(memberNumber, committee) {
    const h = R.heroes.find((x) => x.memberNumber === memberNumber);
    return (h?.committees ?? []).some((s) => s.committee === committee);
  }

  // ---------- meeting CONTENT: agenda items, and sometimes a motion with real votes ----------
  // Votes are CONSISTENT with attendance by construction: members absent from the meeting
  // vote 'Absent' — a data-quality property no independent roll could guarantee.
  const agendaItems = [];
  const motions = [];
  const votes = [];
  const AG = C.meetings.agenda;
  const MO = C.meetings.motions;
  for (const meeting of meetings) {
    const roster = attByMeeting.get(meeting.MeetingKey) ?? [];
    if (!roster.length) continue;
    const chair = roster.find((x) => x.membership.RoleKey === 'Chair') ?? roster[0];
    AG.standingItems.forEach((item, i) => agendaItems.push({
      AgendaKey: `${meeting.MeetingKey}:${i + 1}`, MeetingKey: meeting.MeetingKey, Sequence: i + 1,
      Name: item.name, ItemType: item.type, DurationMinutes: item.minutes,
      PresenterMemberNumber: chair.membership.MemberNumber, Status: 'Completed', IsSharedDemo: true,
    }));
    const r = rng(seed, `motion:${meeting.MeetingKey}`);
    const present = roster.filter((x) => x.status === 'Present');
    if (!r.bernoulli(MO.ratePerMeeting) || present.length < 2) continue;
    const topic = r.pick(MO.topics);
    const moverIdx = r.int(0, present.length - 1);
    let secondIdx = r.int(0, present.length - 2);
    if (secondIdx >= moverIdx) secondIdx += 1;
    const agendaKey = `${meeting.MeetingKey}:${AG.standingItems.length + 1}`;
    agendaItems.push({
      AgendaKey: agendaKey, MeetingKey: meeting.MeetingKey, Sequence: AG.standingItems.length + 1,
      Name: `Motion: ${topic}`, ItemType: 'Vote', DurationMinutes: 10,
      PresenterMemberNumber: present[moverIdx].membership.MemberNumber, Status: 'Completed', IsSharedDemo: true,
    });
    let yes = 0, no = 0, abstain = 0;
    const motionKey = `${meeting.MeetingKey}:m1`;
    for (const x of roster) {
      let value;
      if (x.status !== 'Present') value = 'Absent';
      else {
        const vr = rng(seed, `vote:${motionKey}:${x.membership.MembershipKey}`);
        value = vr.pickWeighted([['Yes', MO.voteSplit.yes], ['No', MO.voteSplit.no], ['Abstain', MO.voteSplit.abstain]]);
      }
      if (value === 'Yes') yes++; else if (value === 'No') no++; else if (value === 'Abstain') abstain++;
      votes.push({ VoteKey: `${motionKey}:${x.membership.MembershipKey}`, MotionKey: motionKey, MembershipKey: x.membership.MembershipKey, VoteValue: value, IsSharedDemo: true });
    }
    motions.push({
      MotionKey: motionKey, MeetingKey: meeting.MeetingKey, AgendaKey: agendaKey, Sequence: 1,
      Name: topic, MovedByMembershipKey: present[moverIdx].membership.MembershipKey,
      SecondedByMembershipKey: present[secondIdx].membership.MembershipKey,
      Result: yes > no ? 'Passed' : 'Failed', ResultSummary: `${yes}–${no}, ${abstain} abstaining`,
      YesCount: yes, NoCount: no, AbstainCount: abstain, IsSharedDemo: true,
    });
  }

  return { types, roles, committees, terms, memberships, meetings, attendance, agendaItems, motions, votes };
}

/** membership-period coverage lookup (same rule the events module uses) */
function memberCoverage(periods) {
  const byMember = new Map();
  for (const per of periods) {
    if (!byMember.has(per.MemberNumber)) byMember.set(per.MemberNumber, []);
    byMember.get(per.MemberNumber).push(per);
  }
  return (memberNumber, dateIso) => (byMember.get(memberNumber) ?? []).some((per) => per.StartDate <= dateIso && dateIso <= per.EndDate);
}
