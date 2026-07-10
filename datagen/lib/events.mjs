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

import { rng, sigmoid, calibrateIntercept } from './rng.mjs';
import { iso, addDays, parseDate } from './dates.mjs';
import { CHEESE_WORDS, CITIES } from './banks.mjs';

export function buildEvents(cfg) {
  const { R, seed, release, releaseYear } = cfg;
  const E = R.events;
  const events = [];
  for (let y = R.history.startYear; y <= releaseYear; y++) {
    const covid = R.regimes.covid.years.includes(y) && R.regimes.covid.virtualConference;
    const confDate = new Date(Date.UTC(y, R.history.conferenceMonth - 1, R.history.conferenceDay));
    if (confDate <= addDays(release, 365)) {
      const [city, state_, lat, lon] = y % 3 === 0 ? ['Louisville', 'KY', 38.2527, -85.7585] : y % 3 === 1 ? ['Des Moines', 'IA', 41.5868, -93.625] : ['Sacramento', 'CA', 38.5816, -121.4944];
      events.push({ EventKey: `EVT-${y}-CONF`, Name: `ICF Annual Conference ${y}`, EventType: 'Conference', Year: y, Date: iso(confDate), IsVirtual: covid, IsPaid: true, City: city, State: state_, Latitude: lat, Longitude: lon, IsSharedDemo: true });
    }
    const rEv = rng(seed, `events:${y}`);
    const nW = covid ? Math.round(E.perYear.workshops * R.regimes.covid.eventVolumeMultiplier) : E.perYear.workshops;
    for (let i = 0; i < nW; i++) {
      const region = rEv.pickWeighted(cfg.R.geography.mix.map(([k, w]) => [k, k === 'NA' ? w * 2 : w]));
      const [city, state_, lat, lon] = rEv.pickWeighted(CITIES[region].map((c) => [c, c[4]]));
      const d = new Date(Date.UTC(y, rEv.int(0, 11), rEv.int(1, 28)));
      if (d > addDays(release, 365)) continue;
      events.push({ EventKey: `EVT-${y}-W${i + 1}`, Name: `Workshop: ${rEv.pick(CHEESE_WORDS)} ${rEv.pick(['Affinage', 'Food Safety', 'Retailing', 'Sensory'])}`, EventType: 'Workshop', Year: y, Date: iso(d), IsVirtual: false, IsPaid: true, City: city, State: state_, Latitude: lat, Longitude: lon, IsSharedDemo: true });
    }
    for (let i = 0; i < E.perYear.webinars; i++) {
      const d = new Date(Date.UTC(y, rEv.int(0, 11), rEv.int(1, 28)));
      if (d > addDays(release, 365)) continue;
      events.push({ EventKey: `EVT-${y}-WEB${i + 1}`, Name: `Webinar: ${rEv.pick(['Raw Milk Rules', 'Cave Management', 'Counter Culture', 'Label Law'])} ${y}`, EventType: 'Webinar', Year: y, Date: iso(d), IsVirtual: true, IsPaid: false, City: null, State: null, Latitude: null, Longitude: null, IsSharedDemo: true });
    }
  }
  return events;
}

export function buildRegistrations(cfg, people, periods, events) {
  const { R, seed, release, releaseYear } = cfg;
  const E = R.events;
  const registrations = [];

  const years = [];
  for (let y = R.history.startYear; y <= releaseYear; y++) years.push(y);
  const eventsByYear = new Map(years.map((y) => [y, events.filter((e) => e.Year === y && parseDate(e.Date) <= release)]));

  const memberPeriods = new Map();
  for (const per of periods) {
    if (!memberPeriods.has(per.MemberNumber)) memberPeriods.set(per.MemberNumber, []);
    memberPeriods.get(per.MemberNumber).push(per);
  }
  const coveredOn = (memberNumber, dateIso) => (memberPeriods.get(memberNumber) ?? []).some((per) => per.StartDate <= dateIso && dateIso <= per.EndDate);
  const clampToJoin = (p, d) => iso(new Date(Math.max(d.getTime(), parseDate(p.JoinDate).getTime())));

  for (const y of years) {
    const conf = eventsByYear.get(y).find((e) => e.EventType === 'Conference');
    const activeThisYear = people.filter((p) => coveredOn(p.MemberNumber, iso(new Date(Date.UTC(y, 6, 1)))));

    // flagship: calibrated so ~35% of members attend; engagement pulls in, distance pushes out
    if (conf && activeThisYear.length > 5) {
      const scores = activeThisYear.map((p) => E.arrows.conferenceEngagement.beta * (p._thetaPath?.[y] ?? p._theta) + E.arrows.conferenceInternational.beta * (p.Region === 'NA' ? 0 : 1));
      const b0 = calibrateIntercept(scores, E.conference.memberAttendanceTarget);
      activeThisYear.forEach((p, i) => {
        const r = rng(seed, `conf:${p.MemberNumber}:${y}`);
        if (!r.bernoulli(sigmoid(b0 + scores[i]))) return;
        if (!coveredOn(p.MemberNumber, conf.Date)) return; // active July 1 ≠ covered July 15 — anniversary lapses in the gap
        registrations.push({ RegKey: `REG-${p.MemberNumber}-${conf.EventKey}`, MemberNumber: p.MemberNumber, EventKey: conf.EventKey, RegisteredOn: clampToJoin(p, addDays(parseDate(conf.Date), -45)), Attended: null, _class: 'paid', _theta: p._thetaPath?.[y] ?? p._theta, IsSharedDemo: true });
      });
    }

    // the rest: engagement-driven NegBin volume over the year's workshop/webinar pool
    for (const p of activeThisYear) {
      const r = rng(seed, `regs:${p.MemberNumber}:${y}`);
      const covid = R.regimes.covid.years.includes(y) ? R.regimes.covid.eventVolumeMultiplier : 1;
      const mean = E.registrationRatePerYear.base * Math.exp(E.registrationRatePerYear.engagementBeta * (p._thetaPath?.[y] ?? p._theta)) * covid;
      const k = r.negbin(mean, E.registrationRatePerYear.dispersionK);
      const pool = eventsByYear.get(y).filter((e) => e.EventType !== 'Conference');
      for (let i = 0; i < Math.min(k, pool.length * 2); i++) {
        const ev = r.pick(pool);
        if (!ev || !coveredOn(p.MemberNumber, ev.Date)) continue;
        registrations.push({ RegKey: `REG-${p.MemberNumber}-${ev.EventKey}-${i}`, MemberNumber: p.MemberNumber, EventKey: ev.EventKey, RegisteredOn: clampToJoin(p, addDays(parseDate(ev.Date), -14)), Attended: null, _class: ev.EventType === 'Webinar' ? 'webinar' : 'paid', _theta: p._thetaPath?.[y] ?? p._theta, IsSharedDemo: true });
      }
    }
  }

  // attendance pass: calibrate no-show intercepts over the actual registrant pool
  for (const cls of ['paid', 'webinar']) {
    const pool = registrations.filter((x) => x._class === cls);
    if (!pool.length) continue;
    const target = cls === 'paid' ? E.noShow.paidInPerson.target : E.noShow.freeWebinar.target;
    const scores = pool.map((x) => E.noShow.engagementBeta * x._theta);
    const b0 = calibrateIntercept(scores, target);
    pool.forEach((x, i) => {
      const r = rng(seed, `noshow:${x.RegKey}`);
      x.Attended = !r.bernoulli(sigmoid(b0 + scores[i]));
    });
  }

  return registrations;
}
