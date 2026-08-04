// Spec §5 step 4b: learning — courses, enrollments, completions.
//
// FIRST DECLARATIVE DOMAIN MODULE (FRAMEWORK.md rung 3): the generation logic lives in
// core/patterns.mjs (annualParticipation + childOutcome); this file supplies only the
// domain's data shapes — the course catalog, the child-row format, the completion
// semantics. Migration gate: this re-expression reproduces the hand-written module's
// output byte-identically (same stream keys, same draw order).

import { annualParticipation, childOutcome } from '../../engine/patterns.mjs';
import { rng } from '../../engine/rng.mjs';
import { iso, addDays, parseDate } from '../../engine/dates.mjs';
import { CHEESE_WORDS } from './banks.mjs';

// topics + tracks are DECLARED (ruleset/modules/learning.json) — they used to be a flat
// hardcoded 8, which is why 111 courses produced only 81 distinct names

export function buildLearning(cfg, { people, periods }) {
  const { R, seed, release, releaseYear } = cfg;
  const L = R.learning;

  // domain data shape: the course catalog (a stable set per year)
  const courses = [];
  const years = [];
  for (let y = R.history.startYear; y <= releaseYear; y++) {
    years.push(y);
    const rC = rng(seed, `courses:${y}`);
    for (let i = 0; i < L.params.coursesPerYear; i++) {
      // any month (December included — int(0,10) left a visible hole in the calendar) and
      // any real day of that month, not just the 1st-28th
      const mo = rC.int(0, 11);
      const start = new Date(Date.UTC(y, mo, rC.int(1, new Date(Date.UTC(y, mo + 1, 0)).getUTCDate())));
      if (start > release) continue;
      const topic = rC.pick(L.catalog.topics);
      // Topic/TrackKey ride in the pack but are NOT emitted yet — Course is a table we own
      // and new columns need a migration (planned separately). They already let the gates
      // check track balance, and make that migration a pure emitter change later.
      courses.push({
        CourseKey: `CRS-${y}-${i + 1}`, Name: `${topic.name} (${rC.pick(CHEESE_WORDS)} cohort)`,
        Topic: topic.name, TrackKey: topic.track,
        Year: y, StartDate: iso(start), DurationWeeks: rC.int(4, 10), IsSharedDemo: true,
      });
    }
  }
  const coursesByYear = new Map();
  for (const c of courses) { (coursesByYear.get(c.Year) ?? coursesByYear.set(c.Year, []).get(c.Year)).push(c); }

  const memberPeriods = new Map();
  for (const per of periods) { (memberPeriods.get(per.MemberNumber) ?? memberPeriods.set(per.MemberNumber, []).get(per.MemberNumber)).push(per); }
  const coveredOn = (m, dateIso) => (memberPeriods.get(m) ?? []).some((per) => per.StartDate <= dateIso && dateIso <= per.EndDate);

  // pattern 1: who enrolls each year — core owns the calibration; we own the shapes
  const enrollments = annualParticipation({
    seed,
    // lockdown SPIKED online learning — post-calibration regime shift (tide, not boats)
    baselineShift: (y) => (R.regimes.covid.years.includes(y) ? R.regimes.covid.learningLogitBoost : 0), years,
    poolOf: (y) => coursesByYear.get(y)?.length ? people.filter((p) => coveredOn(p.MemberNumber, iso(new Date(Date.UTC(y, 5, 15))))) : null,
    scoreOf: (p, y) => L.effects['enroll.engagement'].beta * (p._thetaPath?.[y] ?? p._theta),
    target: L.params.enrollment.target,
    streamKey: (p, y) => `learn:${p.MemberNumber}:${y}`,
    spawn: (r, p, y) => {
      const pool = coursesByYear.get(y);
      const out = [];
      const n = 1 + (r.bernoulli(L.params.extraEnrollmentShare) ? 1 : 0);
      for (let k = 0; k < n; k++) {
        const course = r.pick(pool);
        if (!coveredOn(p.MemberNumber, course.StartDate)) continue;
        out.push({
          EnrollKey: `ENR-${p.MemberNumber}-${course.CourseKey}-${k}`, MemberNumber: p.MemberNumber, CourseKey: course.CourseKey,
          EnrolledOn: iso(addDays(parseDate(course.StartDate), -r.int(3, 21))),
          Status: null, CompletedOn: null, _theta: p._thetaPath?.[y] ?? p._theta,
          _endBase: course.StartDate, _weeks: course.DurationWeeks, IsSharedDemo: true,
        });
      }
      return out;
    },
  });

  // pattern 2: does each enrollment finish — calibrated over the ACTUAL enrollee pool
  childOutcome({
    seed, items: enrollments,
    scoreOf: (e) => L.effects['completion.engagement'].beta * e._theta,
    target: L.params.completion.target,
    streamKey: (e) => `complete:${e.EnrollKey}`,
    decide: (e, p, r) => {
      const courseEnd = addDays(parseDate(e._endBase), e._weeks * 7);
      if (courseEnd > release) { e.Status = 'InProgress'; }
      else if (r.bernoulli(p)) {
        // learners finish when they finish: most near the cohort end, some racing ahead,
        // a tail trickling in afterwards. Every completion landing exactly on the course
        // end date collapsed 3,365 completions onto ~100 dates.
        const band = r.pickWeighted([['early', 0.18], ['onTime', 0.5], ['late', 0.32]]);
        const offset = band === 'early' ? -r.int(3, Math.max(4, e._weeks * 3))
          : band === 'onTime' ? r.int(-2, 2) : r.int(3, 45);
        const done = addDays(courseEnd, offset);
        e.Status = 'Completed';
        e.CompletedOn = iso(done > release ? release : done);
      } else { e.Status = 'Dropped'; }
    },
  });

  return { courses, enrollments };
}
