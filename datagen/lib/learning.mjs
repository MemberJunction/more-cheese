// Spec §5 step 4b: learning — courses, enrollments, completions.
//
// Third domain, same universal pattern (score → calibrate → draw), twice over:
//   1. participation: does this member enroll at all this year? (calibrated to 50%)
//   2. completion: does each enrollment finish? (calibrated to 72%)
// Engagement pushes both; enrollments only exist inside membership windows (carry-down).
// The deliberate sameness is the point — the third repetition of the pattern is the
// evidence that the pattern IS the framework (see FRAMEWORK plan).

import { rng, sigmoid, calibrateIntercept } from './rng.mjs';
import { iso, addDays, parseDate } from './dates.mjs';
import { CHEESE_WORDS } from './banks.mjs';

const TOPICS = ['Affinage Fundamentals', 'Cheese Chemistry', 'Sensory Foundations', 'Food Safety & HACCP', 'Counter Culture: Retailing', 'Raw Milk Practices', 'Cave Management', 'Dairy Microbiology'];

export function buildLearning(cfg, people, periods) {
  const { R, seed, release, releaseYear } = cfg;
  const L = R.learning;

  // course catalog: a stable set per year
  const courses = [];
  for (let y = R.history.startYear; y <= releaseYear; y++) {
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

  // pass 1: who participates each year (calibrated binary — the universal pattern)
  const enrollments = [];
  for (let y = R.history.startYear; y <= releaseYear; y++) {
    const pool = coursesByYear.get(y);
    if (!pool?.length) continue;
    const active = people.filter((p) => coveredOn(p.MemberNumber, iso(new Date(Date.UTC(y, 5, 15)))));
    if (active.length < 5) continue;
    const scores = active.map((p) => L.arrows.enrollEngagement.beta * (p._thetaPath?.[y] ?? p._theta));
    const b0 = calibrateIntercept(scores, L.participation.target);
    active.forEach((p, i) => {
      const r = rng(seed, `learn:${p.MemberNumber}:${y}`);
      if (!r.bernoulli(sigmoid(b0 + scores[i]))) return;
      const n = 1 + (r.bernoulli(L.extraEnrollmentShare) ? 1 : 0);
      for (let k = 0; k < n; k++) {
        const course = r.pick(pool);
        if (!coveredOn(p.MemberNumber, course.StartDate)) continue;
        enrollments.push({
          EnrollKey: `ENR-${p.MemberNumber}-${course.CourseKey}-${k}`, MemberNumber: p.MemberNumber, CourseKey: course.CourseKey,
          EnrolledOn: iso(addDays(parseDate(course.StartDate), -r.int(3, 21))),
          Status: null, CompletedOn: null, _theta: p._thetaPath?.[y] ?? p._theta,
          _endBase: course.StartDate, _weeks: course.DurationWeeks, IsSharedDemo: true,
        });
      }
    });
  }

  // pass 2: completion, calibrated over the ACTUAL enrollee pool (selection effect, again)
  const scores = enrollments.map((e) => L.arrows.completionEngagement.beta * e._theta);
  const b0c = calibrateIntercept(scores, L.completion.target);
  enrollments.forEach((e, i) => {
    const r = rng(seed, `complete:${e.EnrollKey}`);
    const courseEnd = addDays(parseDate(e._endBase), e._weeks * 7);
    if (courseEnd > release) { e.Status = 'InProgress'; }
    else if (r.bernoulli(sigmoid(b0c + scores[i]))) { e.Status = 'Completed'; e.CompletedOn = iso(courseEnd); }
    else { e.Status = 'Dropped'; }
  });

  return { courses, enrollments };
}
