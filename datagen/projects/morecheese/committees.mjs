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
import { coverageOf, yearsOf } from '../../engine/authoring.mjs';

/** tiny deterministic string hash — gives each committee a stable meeting slot of its own */
const hashish = (s) => { let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0; return h; };

export function buildCommittees(cfg, people, periods) {
  const { R, seed, release } = cfg;
  // four-section ruleset shape: C.catalog (what exists) · P (every scalar) · C.effects · C.mixes
  const C = R.committees;
  const P = C.params;

  const coveredOn = coverageOf(periods);

  // ---------- fixtures: types, roles, committees, terms (authored, not drawn) ----------
  const types = C.catalog.types.map((t) => ({ TypeKey: t.name, Name: t.name, IsStandards: t.isStandards, DefaultTermMonths: t.termMonths, IsSharedDemo: true }));
  const roles = C.catalog.roles.map((r) => ({ RoleKey: r.name, Name: r.name, IsOfficer: r.isOfficer, IsVotingRole: r.isVoting, Sequence: r.sequence, IsSharedDemo: true }));
  // c.type is a REFERENCE to a catalog.types entry, not a string to be matched — so a
  // mistyped type is a load-time crash, not a committee that quietly gets no type.
  const committees = C.catalog.committees.map((c) => ({ CommitteeKey: c.name, Name: c.name, TypeKey: c.type.name, MissionStatement: c.mission, Status: 'Active', FormationDate: c.formed, IsSharedDemo: true }));
  const terms = [];
  for (const c of C.catalog.committees) for (const t of C.catalog.terms) {
    // a committee has no term before it existed — the Education Committee (formed 2016)
    // must not appear in the back-filled 2015 term
    if (t.end < c.formed) continue;
    terms.push({ TermKey: `${c.name}:${t.start}`, CommitteeKey: c.name, Name: t.name, StartDate: t.start, EndDate: t.end, Status: t.end < iso(release) ? 'Completed' : 'Active', IsSharedDemo: true });
  }

  // ---------- memberships: per term, engaged members volunteer ----------
  const memberships = [];
  const rosterByTerm = new Map(); // `${committee}:${termStart}` → [person]
  // INCUMBENCY: committees don't re-staff from scratch every two years. A member who
  // served last term is far likelier to serve again, and usually on the SAME committee.
  // The bonus enters the volunteer SCORE, so childOutcome still calibrates to
  // shareOfEligible — total participation is unchanged; only who fills the seats becomes
  // continuous. Without this, back-filling history just produced six terms of total churn.
  let servedLastTerm = new Map(); // MemberNumber → committee name
  for (const t of C.catalog.terms) {
    const eligible = people.filter((p) => !p._hero && coveredOn(p.MemberNumber, t.start));
    const incumbents = servedLastTerm;
    const servingNow = new Map();
    childOutcome({
      seed,
      items: eligible,
      scoreOf: (p) => C.effects['volunteer.engagement'].beta * (p._thetaPath?.[parseDate(t.start).getUTCFullYear()] ?? p._theta)
        + (incumbents.has(p.MemberNumber) ? C.effects['volunteer.incumbency'].beta : 0),
      target: P.volunteerShare.target,
      streamKey: (p) => `committee-serve:${p.MemberNumber}:${t.start}`,
      decide: (p, prob, r) => {
        if (!r.bernoulli(prob)) return;
        const prior = incumbents.get(p.MemberNumber);
        // you can only sit on a committee that exists in this term — the same guard the
        // term list uses. Without it a member could be seated on the Membership &
        // Outreach Committee (formed 2017) in the back-filled 2015 term, and the
        // membership's TermKey then pointed at a term that was never emitted.
        const open = C.catalog.committees.filter((c) => t.end >= c.formed);
        const committee = prior && open.some((c) => c.name === prior) && r.bernoulli(P.sameCommitteeShare)
          ? prior                      // returning members usually keep their seat
          : r.pick(open).name;         // otherwise the member's own dice
        pushMembership(p, committee, t, 'Member');
        servingNow.set(p.MemberNumber, committee);
      },
    });
    servedLastTerm = servingNow;
  }
  // hero seats: declared facts (roles included), placed after the crowd draw
  for (const h of R.heroes) {
    for (const seat of h.committees ?? []) {
      for (const termName of seat.terms) {
        const t = C.catalog.terms.find((x) => x.name === termName);
        const p = people.find((x) => x.MemberNumber === h.memberNumber);
        const c = C.catalog.committees.find((x) => x.name === seat.committee);
        // a declared seat still can't predate the committee (the term wouldn't exist)
        if (t && p && c && t.end >= c.formed) pushMembership(p, seat.committee, t, seat.role);
      }
    }
  }
  // roster floor: a committee-term below the bylaws minimum is topped up from the most engaged
  // eligible members not already serving it. Deterministic (theta order, member number as the
  // tie-break), runs before officers are promoted so a chair always has a real committee.
  {
    const min = P.minRosterPerTerm;
    if (min > 0) {
      for (const t of C.catalog.terms) {
        for (const c of C.catalog.committees) {
          if (t.end < c.formed) continue; // the term does not exist for this committee
          const key = `${c.name}:${t.start}`;
          const roster = rosterByTerm.get(key) ?? [];
          if (roster.length >= min) continue;
          const serving = new Set(roster.map((m) => m.p.MemberNumber));
          const pool = people
            .filter((p) => !p._hero && coveredOn(p.MemberNumber, t.start) && !serving.has(p.MemberNumber))
            .sort((a, b) => (b._theta - a._theta) || (a.MemberNumber < b.MemberNumber ? -1 : 1));
          for (const p of pool.slice(0, min - roster.length)) pushMembership(p, c.name, t, 'Member');
        }
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
  for (const c of C.catalog.committees) {
    let upcoming = 0; // committees schedule a few meetings ahead — populates the app's "upcoming" view
    for (let y = P.meetingsStartYear; y <= release.getUTCFullYear() + 1; y++) {
      for (let q = 0; q < P.meetingsPerYear; q++) {
        const month = q * 3 + 1; // Jan/Apr/Jul/Oct
        // Each committee keeps its own rhythm: a preferred week-of-month and hour, jittered
        // per meeting and nudged onto a weekday. Previously all four committees met on the
        // 15th at 15:00Z forever — identical inter-meeting gaps, one location type, no end
        // times, no minutes. A meeting list is the first governance screen anyone opens.
        const rM = rng(seed, `meetingslot:${c.name}:${y}:${q}`);
        const anchor = 3 + ((hashish(c.name) + q) % 3) * 7; // committee-specific week of the month
        const dmax = new Date(Date.UTC(y, month, 0)).getUTCDate();
        let day = Math.min(dmax, Math.max(1, anchor + rM.int(-2, 3)));
        let dd = new Date(Date.UTC(y, month - 1, day));
        if (dd.getUTCDay() === 0) dd = new Date(dd.getTime() + 86400000);
        if (dd.getUTCDay() === 6) dd = new Date(dd.getTime() + 2 * 86400000);
        const dt = iso(dd);
        const startHour = 13 + (hashish(c.name) % 4) + rM.int(0, 1); // 13:00–17:00Z band, per committee
        const startMin = rM.pick([0, 0, 15, 30]);
        const durationMin = rM.pick([60, 60, 90, 90, 120]);
        const endMs = Date.UTC(y, month - 1, dd.getUTCDate(), startHour, startMin) + durationMin * 60000;
        // most governance is virtual, but quarterly in-person/hybrid sessions happen
        // governance kept meeting through the pandemic, but online — an in-person
        // committee meeting in April 2020 is the kind of detail that breaks a demo
        const covidYear = R.regimes.covid.years.includes(y);
        const locType = covidYear ? 'Virtual' : rM.pickWeighted([['Virtual', 0.68], ['InPerson', 0.2], ['Hybrid', 0.12]]);
        const base = {
          MeetingKey: `${c.name}:${dt}`, CommitteeKey: c.name, Name: `${c.name} — Q${q + 1} ${y} meeting`,
          StartDateTime: `${dt}T${String(startHour).padStart(2, '0')}:${String(startMin).padStart(2, '0')}:00Z`,
          EndDateTime: new Date(endMs).toISOString().replace(/\.\d{3}Z$/, 'Z'),
          TimeZone: 'UTC',
          LocationType: locType,
          LocationText: locType === 'Virtual' ? null : `${'Madison, WI'} — ${rM.pick(['Board Room', 'Conference Room A', 'Guild Hall', 'Annex Room 2'])}`,
          IsSharedDemo: true,
        };
        if (dt > releaseIso) {
          // future meeting: a Scheduled placeholder, capped per committee — no attendance/motions yet
          if (upcoming >= P.upcomingPerCommittee) continue;
          upcoming++;
          meetings.push({ ...base, Status: 'Scheduled' });
          continue;
        }
        const term = C.catalog.terms.find((t) => t.start <= dt && dt <= t.end);
        if (!term) continue;
        const meeting = { ...base, Status: 'Completed' };
        meetings.push(meeting);
        const roster = (rosterByTerm.get(`${c.name}:${term.start}`) ?? []);
        if (!roster.length) continue;
        childOutcome({
          seed,
          items: roster,
          scoreOf: (m) => C.effects['attendance.engagement'].beta * (m.p._thetaPath?.[y] ?? m.p._theta),
          target: P.attendPresent.target,
          streamKey: (m) => `committee-att:${m.p.MemberNumber}:${meeting.MeetingKey}`,
          decide: (m, prob, r) => {
            // hero attendance pin (Gwen: "high meeting attendance") is a fact, not a draw
            const present = m.p._hero && seatPinned(m.p.MemberNumber, c.name) ? true : r.bernoulli(prob);
            const status = present ? 'Present' : r.bernoulli(P.excusedShareOfAbsent) ? 'Excused' : 'Absent';
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
  for (const meeting of meetings) {
    const roster = attByMeeting.get(meeting.MeetingKey) ?? [];
    if (!roster.length) continue;
    const chair = roster.find((x) => x.membership.RoleKey === 'Chair') ?? roster[0];
    C.catalog.standingAgenda.forEach((item, i) => agendaItems.push({
      AgendaKey: `${meeting.MeetingKey}:${i + 1}`, MeetingKey: meeting.MeetingKey, Sequence: i + 1,
      Name: item.name, ItemType: item.type, DurationMinutes: item.minutes,
      PresenterMemberNumber: chair.membership.MemberNumber, Status: 'Completed', IsSharedDemo: true,
    }));
    const r = rng(seed, `motion:${meeting.MeetingKey}`);
    const present = roster.filter((x) => x.status === 'Present');
    if (!r.bernoulli(P.motionsPerMeeting) || present.length < 2) continue;
    // some motions are contentious (tighter/against split → they can FAIL); outcome stays derived from the tally
    const split = r.bernoulli(P.contentiousShare) ? C.mixes.voteContentious : C.mixes.vote;
    const topic = r.pick(C.catalog.motionTopics);
    const moverIdx = r.int(0, present.length - 1);
    let secondIdx = r.int(0, present.length - 2);
    if (secondIdx >= moverIdx) secondIdx += 1;
    const agendaKey = `${meeting.MeetingKey}:${C.catalog.standingAgenda.length + 1}`;
    agendaItems.push({
      AgendaKey: agendaKey, MeetingKey: meeting.MeetingKey, Sequence: C.catalog.standingAgenda.length + 1,
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
        value = vr.pickWeighted(Object.entries(split));
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

