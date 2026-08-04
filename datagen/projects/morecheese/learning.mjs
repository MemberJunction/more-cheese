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
import { thetaAt, yearsOf } from '../../engine/authoring.mjs';
import { renderRow } from '../../engine/row-template.mjs';

// topics + tracks are DECLARED (ruleset/modules/learning.json) — they used to be a flat
// hardcoded 8, which is why 111 courses produced only 81 distinct names

// ── row templates ── the enrollment row. The course PICK stays in the closure, deliberately:
// the handwritten order is pick → coverage guard → date draw, so a filtered-out course consumes
// the pick and NOT the date. A template rendering the whole row would draw the date for rows the
// guard then discards, shifting every later draw on the stream — byte identity is why the draw
// that feeds a guard cannot move into the template.
export const ENROLLMENT_ROW = { row: {
  EnrollKey: { fmt: 'ENR-{member.MemberNumber}-{course.CourseKey}-{k}' },
  MemberNumber: { from: 'member.MemberNumber' },
  CourseKey: { from: 'course.CourseKey' },
  EnrolledOn: { date: { anchor: 'course.StartDate', offset: { dist: 'uniformDays', min: 3, max: 21, sign: -1 } } },
  Status: null,
  CompletedOn: null,
  _theta: { from: 'theta' },
  _endBase: { from: 'course.StartDate' },
  _weeks: { from: 'course.DurationWeeks' },
  IsSharedDemo: true,
} };

export function buildLearning(cfg, { people, periods }) {
  // ── inputs ── the ruleset sections this domain reads, and the upstream rows
  const { R, seed, release, releaseYear } = cfg;
  const L = R.learning;

  // domain data shape: the course catalog (a stable set per year)
  const courses = [];
  const years = [];
  for (const y of yearsOf(cfg)) {
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
  // ── decisions ── one pattern call per decision, in causal order
  const enrollments = annualParticipation({
    seed,
    // lockdown SPIKED online learning — post-calibration regime shift (tide, not boats)
    baselineShift: (y) => (R.regimes.covid.years.includes(y) ? R.regimes.covid.learningLogitBoost : 0), years,
    poolOf: (y) => coursesByYear.get(y)?.length ? people.filter((p) => coveredOn(p.MemberNumber, iso(new Date(Date.UTC(y, 5, 15))))) : null,
    scoreOf: (p, y) => L.effects['enroll.engagement'].beta * thetaAt(p, y),
    target: L.params.enrollment.target,
    streamKey: (p, y) => `learn:${p.MemberNumber}:${y}`,
    spawn: (r, p, y) => {
      const pool = coursesByYear.get(y);
      const out = [];
      const n = 1 + (r.bernoulli(L.params.extraEnrollmentShare) ? 1 : 0);
      for (let k = 0; k < n; k++) {
        const course = r.pick(pool);
        if (!coveredOn(p.MemberNumber, course.StartDate)) continue;
        out.push(renderRow(r, ENROLLMENT_ROW, { member: p, course, k, theta: thetaAt(p, y) }));
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

  // ── shape ── assemble the named tables this domain owns
  return { courses, enrollments };
}
