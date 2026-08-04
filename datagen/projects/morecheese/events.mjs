// Spec §5 step 4: events and registrations.
//
// Events per year: one July flagship conference (virtual in the COVID era) + workshops +
// webinars, each with venue city/state/coordinates (the events map, GAP-11b).
// Registrations obey the causal arrows: engagement drives volume (NegBin, so a vocal
// minority does most of it), international members skip the conference more (distance
// arrow), and a registration can only exist inside a valid membership window — impossible
// dates are unrepresentable by construction.
//
// Attendance is a TWO-PASS draw: collect all registrations first, then calibrate the
// no-show intercept over the ACTUAL registrant pool. (Selection effect: engaged members
// register more, so the pool skews low-no-show — the naive base rate undershoots the
// target. Spec §7 lesson #1.)

import { rng } from '../../engine/rng.mjs';
import { annualParticipation, childOutcome } from '../../engine/patterns.mjs';
import { iso, addDays, parseDate } from '../../engine/dates.mjs';
import { yearsOf } from '../../engine/authoring.mjs';
import { CHEESE_WORDS, CITIES } from './banks.mjs';

// Calendar realism: draw any day of the month (incl. 29–31), then shape the weekday —
// webinars live on Tue–Thu, workshops mostly weekdays with an occasional Saturday
// intensive, and the flagship conference anchors to a Tuesday near mid-July that
// drifts year to year. Kills the "every event on the 1st–28th, uniform weekdays,
// conference always July 15" generator fingerprints.
function drawEventDate(rEv, y, kind) {
  const m = rEv.int(0, 11);
  const dmax = new Date(Date.UTC(y, m + 1, 0)).getUTCDate();
  let d = new Date(Date.UTC(y, m, rEv.int(1, dmax)));
  const dow = d.getUTCDay();
  if (kind === 'Webinar') {
    // shift weekend/Mon/Fri draws onto Tue–Thu
    if (dow === 0 || dow === 6 || dow === 1 || dow === 5) d = addDays(d, ((2 + rEv.int(0, 2)) - dow + 7) % 7);
  } else if (kind === 'Workshop') {
    // Sunday never; Saturday sticks ~25% of the time (weekend intensives are a thing)
    if (dow === 0 || (dow === 6 && !rEv.bernoulli(0.25))) d = addDays(d, ((1 + rEv.int(0, 3)) - dow + 7) % 7);
  }
  return d;
}

export function buildEvents(cfg) {
  // ── inputs ── the ruleset sections this domain reads, and the upstream rows
  const { R, seed, release, releaseYear } = cfg;
  const E = R.events;
  const events = [];
  for (const y of yearsOf(cfg)) {
    const covidYear = R.regimes.covid.years.includes(y);
    const covid = covidYear && R.regimes.covid.virtualConference;
    // conference drifts around the ruleset anchor day and lands on a Tuesday
    const rConf = rng(seed, `confday:${y}`);
    let confDate = new Date(Date.UTC(y, R.history.conferenceMonth - 1, Math.max(8, Math.min(22, R.history.conferenceDay + rConf.int(-5, 6)))));
    while (confDate.getUTCDay() !== 2) confDate = addDays(confDate, 1);
    if (confDate <= addDays(release, 365)) {
      // host city rotates through the declared list (was a hardcoded 3 on y % 3)
      const hc = E.catalog.conferenceCities[y % E.catalog.conferenceCities.length];
      const [city, state_, lat, lon] = [hc.city, hc.state, hc.lat, hc.lon];
      events.push({ EventKey: `EVT-${y}-CONF`, Name: `ICF Annual Conference ${y}`, EventType: 'Conference', Year: y, Date: iso(confDate), IsVirtual: covid, IsPaid: true, City: city, State: state_, Latitude: lat, Longitude: lon, IsSharedDemo: true });
    }
    const rEv = rng(seed, `events:${y}`);
    const nW = covid ? Math.round(E.params.workshopsPerYear * R.regimes.covid.eventVolumeMultiplier) : E.params.workshopsPerYear;
    for (let i = 0; i < nW; i++) {
      const region = rEv.pickWeighted(Object.entries(cfg.R.geography.mixes.region).map(([k, w]) => [k, k === 'NA' ? w * 2 : w]));
      const [city, state_, lat, lon] = rEv.pickWeighted(CITIES[region].map((c) => [c, c[4]]));
      const d = drawEventDate(rEv, y, 'Workshop');
      if (d > addDays(release, 365)) continue;
      events.push({ EventKey: `EVT-${y}-W${i + 1}`, Name: `Workshop: ${rEv.pick(CHEESE_WORDS)} ${rEv.pick(E.catalog.workshopSubjects)}`, EventType: 'Workshop', Year: y, Date: iso(d), IsVirtual: false, IsPaid: true, City: city, State: state_, Latitude: lat, Longitude: lon, IsSharedDemo: true });
    }
    // the federation pivots its programming online: fewer in-person workshops (above),
    // MORE webinars
    const nWeb = covidYear ? Math.round(E.params.webinarsPerYear * (R.regimes.covid.webinarScheduleMultiplier ?? 1)) : E.params.webinarsPerYear;
    for (let i = 0; i < nWeb; i++) {
      const d = drawEventDate(rEv, y, 'Webinar');
      if (d > addDays(release, 365)) continue;
      events.push({ EventKey: `EVT-${y}-WEB${i + 1}`, Name: `Webinar: ${rEv.pick(E.catalog.webinarTopics)} ${y}`, EventType: 'Webinar', Year: y, Date: iso(d), IsVirtual: true, IsPaid: false, City: null, State: null, Latitude: null, Longitude: null, IsSharedDemo: true });
    }
  }
  // ── shape ── assemble the named tables this domain owns
  return events;
}

// Registration lead time: a mixture, not a constant. Early-bird block, main wave,
// late deciders, and a walk-up/last-minute mass — heavier last-minute for free
// webinars, longer planning horizon for the conference. (Replaces the fixed
// −45/−14 offsets that made every "registrations over time" chart a comb.)
function leadDaysFor(r, kind) {
  const bands = kind === 'Conference'
    ? [[[60, 120], 0.20], [[14, 59], 0.50], [[3, 13], 0.25], [[0, 2], 0.05]]
    : kind === 'Workshop'
      ? [[[30, 60], 0.10], [[7, 29], 0.55], [[1, 6], 0.25], [[0, 0], 0.10]]
      : [[[21, 45], 0.05], [[7, 20], 0.40], [[1, 6], 0.35], [[0, 0], 0.20]];
  const [lo, hi] = r.pickWeighted(bands);
  return r.int(lo, hi);
}

export function buildRegistrations(cfg, { people, periods, events }) {
  // ── inputs ── the ruleset sections this domain reads, and the upstream rows
  const { R, seed, release, releaseYear } = cfg;
  const E = R.events;
  const registrations = [];

  const years = yearsOf(cfg);
  const eventsByYear = new Map(years.map((y) => [y, events.filter((e) => e.Year === y && parseDate(e.Date) <= release)]));

  const memberPeriods = new Map();
  for (const per of periods) {
    if (!memberPeriods.has(per.MemberNumber)) memberPeriods.set(per.MemberNumber, []);
    memberPeriods.get(per.MemberNumber).push(per);
  }
  const coveredOn = (memberNumber, dateIso) => (memberPeriods.get(memberNumber) ?? []).some((per) => per.StartDate <= dateIso && dateIso <= per.EndDate);
  const clampToJoin = (p, d) => iso(new Date(Math.max(d.getTime(), parseDate(p.JoinDate).getTime())));

  // flagship: core's annualParticipation — calibrated so ~35% of members attend;
  // engagement pulls in, distance pushes out. minPool 6 preserves the original ">5" skip.
  const confOf = (y) => eventsByYear.get(y).find((e) => e.EventType === 'Conference');
  const activeOn = (y) => people.filter((p) => coveredOn(p.MemberNumber, iso(new Date(Date.UTC(y, 6, 1)))));
  // ── decisions ── one pattern call per decision, in causal order
  const confRegs = annualParticipation({
    seed, years, minPool: 6,
    poolOf: (y) => (confOf(y) ? activeOn(y) : []),
    scoreOf: (p, y) => E.effects['conferenceAttendance.engagement'].beta * (p._thetaPath?.[y] ?? p._theta) + E.effects['conferenceAttendance.international'].beta * (p.Region === 'NA' ? 0 : 1),
    target: E.params.conferenceAttendance.target,
    streamKey: (p, y) => `conf:${p.MemberNumber}:${y}`,
    spawn: (r, p, y) => {
      const conf = confOf(y);
      if (!coveredOn(p.MemberNumber, conf.Date)) return null; // active July 1 ≠ covered July 15 — anniversary lapses in the gap
      return { RegKey: `REG-${p.MemberNumber}-${conf.EventKey}`, MemberNumber: p.MemberNumber, EventKey: conf.EventKey, RegisteredOn: clampToJoin(p, addDays(parseDate(conf.Date), -leadDaysFor(r, 'Conference'))), Attended: null, _class: 'paid', _theta: p._thetaPath?.[y] ?? p._theta, IsSharedDemo: true };
    },
  });

  for (const y of years) {
    // registrations interleave year-major (conference first, then volume) — output-order contract
    const activeThisYear = activeOn(y);
    const confKey = confOf(y)?.EventKey;
    if (confKey) registrations.push(...confRegs.filter((x) => x.EventKey === confKey));

    // the rest: engagement-driven NegBin volume over the year's workshop/webinar pool
    // (NOT a calibrated-participation instance — volume is a NegBin count, so it stays hand-written).
    // DISTINCT events per member-year: one person registers for a webinar once. The old
    // with-replacement r.pick() made 17% of the table duplicate member+event pairs — with
    // contradictory Attended flags once the outcome pass rolled each copy separately.
    for (const p of activeThisYear) {
      const r = rng(seed, `regs:${p.MemberNumber}:${y}`);
      // COVID moves the two channels in OPPOSITE directions. The old code multiplied the
      // whole rate by 0.5, which quietly cut webinar attendance in the year everyone went
      // online. Volume now holds roughly steady while the MIX swings hard to virtual.
      const CV = R.regimes.covid;
      const isCovid = CV.years.includes(y);
      const chanW = (ev) => !isCovid ? 1 : (ev.EventType === 'Webinar' ? (CV.virtualMultiplier ?? 1) : (CV.inPersonMultiplier ?? 1));
      const mean = E.params.registrationsPerYear * Math.exp(E.effects['registrations.engagement'].beta * (p._thetaPath?.[y] ?? p._theta));
      const k = r.negbin(mean, E.params.registrationDispersionK);
      const pool = eventsByYear.get(y).filter((e) => e.EventType !== 'Conference');
      const taken = new Set();
      for (let i = 0; i < Math.min(k, pool.length); i++) {
        const avail = pool.filter((e) => !taken.has(e.EventKey));
        if (!avail.length) break;
        const ev = r.pickWeighted(avail.map((e) => [e, chanW(e)]));
        if (!ev) break;
        taken.add(ev.EventKey);
        if (!coveredOn(p.MemberNumber, ev.Date)) continue;
        registrations.push({ RegKey: `REG-${p.MemberNumber}-${ev.EventKey}`, MemberNumber: p.MemberNumber, EventKey: ev.EventKey, RegisteredOn: clampToJoin(p, addDays(parseDate(ev.Date), -leadDaysFor(r, ev.EventType))), Attended: null, _class: ev.EventType === 'Webinar' ? 'webinar' : 'paid', _theta: p._thetaPath?.[y] ?? p._theta, IsSharedDemo: true });
      }
    }
  }

  // upcoming events (release → +120d) already have registrations on the books — early
  // signups whose RegisteredOn falls before the release. Attended stays null (the event
  // hasn't happened); _future exempts them from the no-show outcome pass. Fills the
  // "Upcoming Events grid is empty on demo day one" hole.
  const upcoming = events.filter((e) => parseDate(e.Date) > release && parseDate(e.Date) <= addDays(release, 120));
  for (const ev of upcoming) {
    const daysOut = Math.ceil((parseDate(ev.Date) - release) / 86400000);
    const pBase = ev.EventType === 'Webinar' ? 0.02 : 0.008;
    for (const p of people) {
      // must be covered ON THE EVENT DATE (not merely today) — a period ending before the
      // event would put the registration outside any membership window
      if (!coveredOn(p.MemberNumber, ev.Date) || !coveredOn(p.MemberNumber, iso(release))) continue;
      const r = rng(seed, `upcoming:${p.MemberNumber}:${ev.EventKey}`);
      // the closer the event, the more of its eventual crowd has signed up by now
      const horizon = Math.max(0.15, 1 - daysOut / 150);
      if (!r.bernoulli(pBase * Math.exp(E.effects['registrations.engagement'].beta * (p._thetaPath?.[releaseYear] ?? p._theta)) * horizon)) continue;
      registrations.push({ RegKey: `REG-${p.MemberNumber}-${ev.EventKey}`, MemberNumber: p.MemberNumber, EventKey: ev.EventKey, RegisteredOn: clampToJoin(p, addDays(release, -r.int(0, 30))), Attended: null, _class: ev.EventType === 'Webinar' ? 'webinar' : 'paid', _future: true, _theta: p._thetaPath?.[releaseYear] ?? p._theta, IsSharedDemo: true });
    }
  }

  // attendance pass: core's childOutcome — the no-show intercept calibrates over the
  // ACTUAL registrant pool (the selection-effect lesson is built into the pattern).
  // Future-event registrations stay out: their outcome hasn't happened yet.
  for (const cls of ['paid', 'webinar']) {
    const pool = registrations.filter((x) => x._class === cls && !x._future);
    if (!pool.length) continue;
    childOutcome({
      seed, items: pool,
      scoreOf: (x) => E.effects['noShow.engagement'].beta * x._theta,
      target: cls === 'paid' ? E.params.noShowPaidInPerson.target : E.params.noShowFreeWebinar.target,
      streamKey: (x) => `noshow:${x.RegKey}`,
      decide: (x, p, r) => { x.Attended = !r.bernoulli(p); },
    });
  }

  // ── shape ── assemble the named tables this domain owns
  return registrations;
}
