// Forms — targets bizapps-forms' real shapes (slice: Form/FormVersion/FormPage/FormQuestion/
// FormQuestionOption/FormDistribution/FormResponse/FormResponseAnswer). Two authored forms:
//
// 1. The post-conference survey, distributed per conference year; ATTENDEES answer at a
//    calibrated response rate (theta arrow), and their satisfaction answers ride the same
//    engagement dial as renewal — so "NPS predicts churn" demos work because both share
//    the cause. Flagship heroes carry a guaranteed response (cross-app footprint).
// 2. The Membership Application — bizapps-forms' flagship ANONYMOUS story: a public intake
//    whose respondents are prospective members (MemberNumber null, AnonymousSessionID set);
//    applicant identity lives only in answer text, never as Person rows.

import { rng } from '../../engine/rng.mjs';
import { childOutcome } from '../../engine/patterns.mjs';
import { iso, addDays, parseDate } from '../../engine/dates.mjs';
import { personNameFor, TOPONYMS } from './banks.mjs';
import { emailFor } from './world.mjs';
import { stripInternals, thetaAt } from '../../engine/authoring.mjs';
import { projectRows } from '../../engine/row-template.mjs';

/** survey/application submissions cluster in waking hours with a lunchtime and evening
 *  bump — a single 12:00Z stamp made the time-of-day chart one bar */
const submitTime = (r) => {
  const h = r.pickWeighted([[8, 6], [9, 9], [10, 11], [11, 10], [12, 12], [13, 11], [14, 9], [15, 8], [16, 8], [17, 7], [18, 6], [19, 6], [20, 5], [21, 4], [22, 2], [7, 3], [23, 1]]);
  return `${String(h).padStart(2, '0')}:${String(r.int(0, 59)).padStart(2, '0')}:00Z`;
};


// ── row templates ── one template serves BOTH forms: the survey and the application differ only
// in which form/page the questions belong to, which is scope, not shape. formQuestionOptions stays
// handwritten — it is a nested projection over `q.options ?? []`, and that fallback is real.
export const FORM_QUESTION_ROW = { row: {
  QuestionKey: { fmt: '{formKey}:{item.key}' }, FormKey: { from: 'formKey' }, PageKey: { from: 'pageKey' },
  QuestionType: { from: 'item.type' }, Prompt: { from: 'item.prompt' },
  IsRequired: { from: 'item.required' }, DisplayOrder: { from: 'i' }, IsSharedDemo: true,
} };

export function buildForms(cfg, { people, events, registrations }) {
  // ── inputs ── the ruleset sections this domain reads, and the upstream rows
  const { R, seed, release } = cfg;
  const F = R.forms;
  const S = F.survey;

  // ── fixtures ── authored fixtures: the survey, its version/page/questions
  const forms = [{ FormKey: 'post-conf-survey', Name: S.name, Description: S.description, Status: 'Published', RenderMode: 'Scroll', IsSharedDemo: true }];
  const formVersions = [{ VersionKey: 'post-conf-survey:1', FormKey: 'post-conf-survey', VersionNumber: 1, Status: 'Published', PublishedAt: `${R.history.startYear}-06-01T00:00:00Z`, IsSharedDemo: true }];
  const formPages = [{ PageKey: 'post-conf-survey:p1', FormKey: 'post-conf-survey', Title: S.page, DisplayOrder: 0, IsSharedDemo: true }];
  const formQuestions = projectRows(FORM_QUESTION_ROW, S.questions, { formKey: 'post-conf-survey', pageKey: 'post-conf-survey:p1' });

  // ── fixtures ── authored fixtures: the Membership Application (the anonymous intake)
  const APP = F.application;
  const APP_KEY = 'membership-application';
  forms.push({ FormKey: APP_KEY, Name: APP.name, Description: APP.description, Status: 'Published', RenderMode: 'Scroll', IsSharedDemo: true });
  const appSinceYear = release.getUTCFullYear() - (APP.distribution.sinceYearsBeforeRelease - 1);
  formVersions.push({ VersionKey: `${APP_KEY}:1`, FormKey: APP_KEY, VersionNumber: 1, Status: 'Published', PublishedAt: `${appSinceYear}-01-01T00:00:00Z`, IsSharedDemo: true });
  formPages.push({ PageKey: `${APP_KEY}:p1`, FormKey: APP_KEY, Title: APP.page, DisplayOrder: 0, IsSharedDemo: true });
  const formQuestionOptions = [];
  APP.questions.forEach((q, i) => {
    formQuestions.push(...projectRows(FORM_QUESTION_ROW, [q], { i, formKey: APP_KEY, pageKey: `${APP_KEY}:p1` }));
    (q.options ?? []).forEach((opt, j) => formQuestionOptions.push({
      OptionKey: `${APP_KEY}:${q.key}:${j}`, QuestionKey: `${APP_KEY}:${q.key}`,
      Label: opt, Value: opt, DisplayOrder: j, IsDefault: false, IsSharedDemo: true,
    }));
  });

  const personByKey = new Map(people.map((p) => [p.MemberNumber, p]));
  const confByYear = new Map(events.filter((e) => e.EventType === 'Conference').map((e) => [e.Year, e]));

  // ── decisions ── per conference year: a distribution + attendee responses
  const formDistributions = [];
  const formResponses = [];
  const formAnswers = [];
  const releaseIso = iso(release);

  for (const [year, conf] of [...confByYear.entries()].sort((a, b) => a[0] - b[0])) {
    if (conf.Date > releaseIso) continue;
    const attendees = registrations.filter((x) => x.EventKey === conf.EventKey && x.Attended === true && personByKey.has(x.MemberNumber));
    if (attendees.length < 5) continue;
    const opens = addDays(parseDate(conf.Date), S.distribution.opensDaysAfter);
    const distKey = `post-conf-survey:${year}`;
    const dist = {
      DistributionKey: distKey, FormKey: 'post-conf-survey', Name: `ICF ${year} post-conference survey`,
      ChannelType: S.distribution.channel, Status: 'Closed',
      OpenAt: `${iso(opens)}T09:00:00Z`, CloseAt: `${iso(addDays(parseDate(conf.Date), S.distribution.closesDaysAfter))}T23:59:59Z`,
      ResponseCount: 0, IsSharedDemo: true,
    };
    formDistributions.push(dist);

    const covid = R.regimes.covid.years.includes(year);
    childOutcome({
      seed,
      items: attendees,
      baselineShift: covid ? R.regimes.covid.formsResponseLogitShift : 0, // virtual-year fatigue
      scoreOf: (x) => F.response.arrows.engagement.beta * thetaAt(personByKey.get(x.MemberNumber), year),
      target: F.response.rateTarget,
      streamKey: (x) => `formresp:${x.RegKey}`,
      decide: (x, prob, r) => {
        if (!r.bernoulli(prob)) return;
        const p = personByKey.get(x.MemberNumber);
        const respKey = `${distKey}:${x.MemberNumber}`;
        formResponses.push({
          ResponseKey: respKey, FormKey: 'post-conf-survey', VersionKey: 'post-conf-survey:1',
          DistributionKey: distKey, MemberNumber: x.MemberNumber, Status: 'Complete',
          SubmittedAt: `${iso(addDays(opens, r.int(1, F.response.submitDelayDaysMax)))}T${submitTime(r)}`,
          IsSharedDemo: true, _theta: thetaAt(p, year), _covid: covid,
        });
        dist.ResponseCount += 1;
      },
    });
  }

  // ── decisions ── flagship heroes: a GUARANTEED survey response each (cross-app footprint)
  // Declared facts placed after the crowd draw, like committee seats: anchor to the hero's
  // most recent attended conference; skip if the crowd draw already selected them (same
  // ResponseKey). Never Partial — a flagship demo response must be complete.
  const distByKey = new Map(formDistributions.map((d) => [d.DistributionKey, d]));
  const responseKeys = new Set(formResponses.map((x) => x.ResponseKey));
  for (const h of R.heroes.filter((x) => x.pins?.formResponse)) {
    const distYears = [...confByYear.entries()].sort((a, b) => b[0] - a[0]).filter(([year]) => distByKey.has(`post-conf-survey:${year}`));
    const attended = distYears.find(([, conf]) =>
      registrations.some((x) => x.EventKey === conf.EventKey && x.MemberNumber === h.memberNumber && x.Attended === true));
    // fallback: a hero with no attended conference at this seed still responds to the most
    // recent survey (real email links leak past the attendee list; the metadata says so)
    const [year, conf] = attended ?? distYears[0] ?? [];
    if (!conf) continue; // no distributions at all — gate reports it
    const distKey = `post-conf-survey:${year}`;
    const respKey = `${distKey}:${h.memberNumber}`;
    if (responseKeys.has(respKey)) continue; // crowd draw already selected them
    const p = personByKey.get(h.memberNumber);
    const r = rng(seed, `formresp-hero:${h.memberNumber}`);
    const opens = addDays(parseDate(conf.Date), S.distribution.opensDaysAfter);
    formResponses.push({
      ResponseKey: respKey, FormKey: 'post-conf-survey', VersionKey: 'post-conf-survey:1',
      DistributionKey: distKey, MemberNumber: h.memberNumber, Status: 'Complete',
      SubmittedAt: `${iso(addDays(opens, r.int(1, F.response.submitDelayDaysMax)))}T${submitTime(r)}`,
      ...(attended ? {} : { SourceMetadata: JSON.stringify({ channel: 'email', note: 'responded via forwarded link (not on the attendee list)' }) }),
      IsSharedDemo: true, _theta: thetaAt(p, year), _covid: R.regimes.covid.years.includes(year), _hero: true,
    });
    distByKey.get(distKey).ResponseCount += 1;
  }

  // ── decisions ── answers: SECOND pass over the actual respondent pool
  // Respondents are engagement-selected TWICE (attend, then respond), so the naive base
  // overshoots the target mean — the selection-effect lesson (spec §7 lesson #1). Calibrate
  // the base linearly over the real pool: base' = target − β·mean(θ_respondents). Each
  // response draws its answers from its OWN stream. The pool EXCLUDES hero-guaranteed rows
  // so crowd answer values stay byte-identical to pre-footprint builds.
  const A = F.answers;
  const crowdResponses = formResponses.filter((x) => !x._hero);
  const meanTheta = crowdResponses.length ? crowdResponses.reduce((s2, x) => s2 + x._theta, 0) / crowdResponses.length : 0;
  const npsBase = A.nps.base - A.nps.engagementBeta * meanTheta;
  const overallBase = A.overall.base - A.overall.engagementBeta * meanTheta;
  const clampRound = (v, lo, hi) => Math.max(lo, Math.min(hi, Math.round(v)));
  // a gaussian around the sourced mean never yields a 0-2, so the detractor tail every
  // real survey carries was absent. A small share had a bad experience and score low
  // largely regardless of engagement (low-theta members are likelier to be among them).
  const npsScore = (theta, covidShift, r) => {
    const pBad = A.nps.detractorShare * (theta < 0 ? 1.8 : 0.6);
    if (A.nps.detractorShare && r.bernoulli(Math.min(0.12, pBad))) return r.pickWeighted([[0, 0.2], [1, 0.3], [2, 0.5]]);
    return clampRound(npsBase + covidShift + A.nps.engagementBeta * theta + r.normal(0, A.nps.noiseSd), A.nps.min, A.nps.max);
  };
  for (const resp of formResponses) {
    const r = rng(seed, `formans:${resp.ResponseKey}`);
    const theta = resp._theta;
    // real funnels leak: a slice of responses start but never submit (first answer only) —
    // hero-guaranteed rows are exempt (a flagship footprint response must be Complete)
    if (!resp._hero && r.bernoulli(F.response.partialShare)) {
      resp.Status = 'Partial';
      resp.StartedAt = resp.SubmittedAt; resp.SubmittedAt = null;
      formAnswers.push({ AnswerKey: `${resp.ResponseKey}:nps`, ResponseKey: resp.ResponseKey, QuestionKey: 'post-conf-survey:nps', NumericValue: npsScore(theta, 0, r), IsSharedDemo: true });
      continue;
    }
    formAnswers.push(
      { AnswerKey: `${resp.ResponseKey}:nps`, ResponseKey: resp.ResponseKey, QuestionKey: 'post-conf-survey:nps', NumericValue: npsScore(theta, resp._covid ? R.regimes.covid.npsShift : 0, r), IsSharedDemo: true },
      { AnswerKey: `${resp.ResponseKey}:overall`, ResponseKey: resp.ResponseKey, QuestionKey: 'post-conf-survey:overall', NumericValue: clampRound(overallBase + A.overall.engagementBeta * theta + r.normal(0, A.overall.noiseSd), A.overall.min, A.overall.max), IsSharedDemo: true },
      { AnswerKey: `${resp.ResponseKey}:returning`, ResponseKey: resp.ResponseKey, QuestionKey: 'post-conf-survey:returning', BooleanValue: r.bernoulli(1 / (1 + Math.exp(-(A.returning.baseLogit + A.returning.engagementBeta * theta)))), IsSharedDemo: true },
    );
  }
  stripInternals(formResponses); // latents — never ship; the emitter refuses any that survive

  // ── decisions ── the Membership Application: anonymous public-intake responses
  // Applicants are NOT members: MemberNumber null, AnonymousSessionID set, identity lives
  // only inside answer text (cleared name banks; deterministic example.com emails). One
  // always-open PublicLink distribution; volume is a modest per-year trickle.
  const relYear = release.getUTCFullYear();
  const appDist = {
    DistributionKey: `${APP_KEY}:public`, FormKey: APP_KEY, Name: 'Membership application — public link',
    // 'Active' per their CK_FormDistribution_Status (Draft|Active|Closed) — caught by the
    // 2026-07-22 from-scratch install run; 'Open' is not a legal value in their schema
    ChannelType: APP.distribution.channel, Status: 'Active',
    OpenAt: `${appSinceYear}-01-01T09:00:00Z`, CloseAt: null,
    ResponseCount: 0, IsSharedDemo: true,
  };
  formDistributions.push(appDist);
  const hex = (r, n) => Array.from({ length: n }, () => '0123456789abcdef'[r.int(0, 15)]).join('');
  for (let year = appSinceYear; year <= relYear; year++) {
    const ry = rng(seed, `formapp:${year}`);
    const count = ry.int(APP.volume.perYearMin, APP.volume.perYearMax);
    for (let i = 0; i < count; i++) {
      const key = `formapp:${year}:${i}`;
      const r = rng(seed, key);
      const when = addDays(new Date(Date.UTC(year, 0, 1)), r.int(0, 364));
      if (iso(when) > releaseIso) continue; // current year: only up to the release date
      const respKey = `${APP_KEY}:public:${year}:${i}`;
      const partial = r.bernoulli(APP.volume.partialShare);
      const resp = {
        ResponseKey: respKey, FormKey: APP_KEY, VersionKey: `${APP_KEY}:1`,
        DistributionKey: appDist.DistributionKey, MemberNumber: null,
        AnonymousSessionID: `anon-${hex(r, 16)}`,
        SourceMetadata: JSON.stringify({ channel: 'web', referrer: r.pick(APP.referrers) }),
        Status: partial ? 'Partial' : 'Complete',
        StartedAt: `${iso(when)}T${submitTime(r)}`,
        SubmittedAt: partial ? null : `${iso(when)}T${submitTime(r)}`,
        IsSharedDemo: true,
      };
      formResponses.push(resp);
      appDist.ResponseCount += 1;
      // answers: identity + segment + free text, from the same per-applicant stream
      const nm = personNameFor(seed, key, 'NA');
      const push = (qkey, fields) => formAnswers.push({ AnswerKey: `${respKey}:${qkey}`, ResponseKey: respKey, QuestionKey: `${APP_KEY}:${qkey}`, ...fields, IsSharedDemo: true });
      push('name', { TextValue: `${nm.first} ${nm.last}` });
      if (partial) continue; // leaky funnel: first answer only
      const segment = r.pickWeighted(APP.segmentMix);
      push('email', { TextValue: emailFor(nm.first, nm.last, respKey) });
      push('segment', { TextValue: segment });
      // "a enthusiast" / "a educator" were visible in the answers grid — the article
      // has to agree with the segment word that follows it
      push('operation', {
        TextValue: r.pick(APP.operationTemplates)
          .replace(/\ba (?=\{segment\})/, /^[aeiou]/i.test(segment) ? 'an ' : 'a ')
          .replace('{segment}', segment.toLowerCase())
          .replace('{toponym}', r.pick(TOPONYMS)),
      });
      push('newsletter', { BooleanValue: r.bernoulli(0.6) });
    }
  }

  // ── shape ── assemble the named tables this domain owns
  return { forms, formVersions, formPages, formQuestions, formQuestionOptions, formDistributions, formResponses, formAnswers };
}
