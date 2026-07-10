// Spec §5 step 4b: learning — courses, enrollments, completions.
//
// FIRST DECLARATIVE DOMAIN MODULE (FRAMEWORK.md rung 3): the generation logic lives in
// core/patterns.mjs (annualParticipation + childOutcome); this file supplies only the
// domain's data shapes — the course catalog, the child-row format, the completion
// semantics. Migration gate: this re-expression reproduces the hand-written module's
// output byte-identically (same stream keys, same draw order).

import { annualParticipation, childOutcome } from '../../core/patterns.mjs';
import { rng } from '../../core/rng.mjs';
import { iso, addDays, parseDate } from '../../core/dates.mjs';
import { CHEESE_WORDS } from './banks.mjs';

const TOPICS = ['Affinage Fundamentals', 'Cheese Chemistry', 'Sensory Foundations', 'Food Safety & HACCP', 'Counter Culture: Retailing', 'Raw Milk Practices', 'Cave Management', 'Dairy Microbiology'];

export function buildLearning(cfg, people, periods) {
  const { R, seed, release, releaseYear } = cfg;
  const L = R.learning;

  // domain data shape: the course catalog (a stable set per year)
  const courses = [];
  const years = [];
  for (let y = R.history.startYear; y <= releaseYear; y++) {
    years.push(y);
    const rC = rng(seed, `courses:${y}`);
    for (let i = 0; i < L.coursesPerYear; i++) {
      const start = new Date(Date.UTC(y, rC.int(0, 10), rC.int(1, 28)));
      if (start > release) continue;
      courses.push({ CourseKey: `CRS-${y}-${i + 1}`, Name: `${rC.pick(TOPICS)} (${rC.pick(CHEESE_WORDS)} cohort)`, Year: y, StartDate: iso(start), DurationWeeks: rC.int(4, 10), IsSharedDemo: true });
    }
  }
  const coursesByYear = new Map();
  for (const c of courses) { (coursesByYear.get(c.Year) ?? coursesByYear.set(c.Year, []).get(c.Year)).push(c); }

  const memberPeriods = new Map();
  for (const per of periods) { (memberPeriods.get(per.MemberNumber) ?? memberPeriods.set(per.MemberNumber, []).get(per.MemberNumber)).push(per); }
  const coveredOn = (m, dateIso) => (memberPeriods.get(m) ?? []).some((per) => per.StartDate <= dateIso && dateIso <= per.EndDate);

  // pattern 1: who enrolls each year — core owns the calibration; we own the shapes
  const enrollments = annualParticipation({
    seed, years,
    poolOf: (y) => coursesByYear.get(y)?.length ? people.filter((p) => coveredOn(p.MemberNumber, iso(new Date(Date.UTC(y, 5, 15))))) : null,
    scoreOf: (p, y) => L.arrows.enrollEngagement.beta * (p._thetaPath?.[y] ?? p._theta),
    target: L.participation.target,
    streamKey: (p, y) => `learn:${p.MemberNumber}:${y}`,
    spawn: (r, p, y) => {
      const pool = coursesByYear.get(y);
      const out = [];
      const n = 1 + (r.bernoulli(L.extraEnrollmentShare) ? 1 : 0);
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
    scoreOf: (e) => L.arrows.completionEngagement.beta * e._theta,
    target: L.completion.target,
    streamKey: (e) => `complete:${e.EnrollKey}`,
    decide: (e, p, r) => {
      const courseEnd = addDays(parseDate(e._endBase), e._weeks * 7);
      if (courseEnd > release) { e.Status = 'InProgress'; }
      else if (r.bernoulli(p)) { e.Status = 'Completed'; e.CompletedOn = iso(courseEnd); }
      else { e.Status = 'Dropped'; }
    },
  });

  return { courses, enrollments };
}
