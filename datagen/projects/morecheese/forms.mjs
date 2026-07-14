// Forms — targets bizapps-forms' real shapes (slice: Form/FormVersion/FormPage/FormQuestion/
// FormDistribution/FormResponse/FormResponseAnswer). One authored post-conference survey,
// distributed per conference year; ATTENDEES answer at a calibrated response rate (theta
// arrow), and their satisfaction answers ride the same engagement dial as renewal — so
// "NPS predicts churn" demos work because both share the cause.

import { rng } from '../../engine/rng.mjs';
import { childOutcome } from '../../engine/patterns.mjs';
import { iso, addDays, parseDate } from '../../engine/dates.mjs';

export function buildForms(cfg, people, events, registrations) {
  const { R, seed, release } = cfg;
  const F = R.forms;
  const S = F.survey;

  // ---------- authored fixtures: the survey, its version/page/questions ----------
  const forms = [{ FormKey: 'post-conf-survey', Name: S.name, Description: S.description, Status: 'Published', RenderMode: 'Scroll', IsSharedDemo: true }];
  const formVersions = [{ VersionKey: 'post-conf-survey:1', FormKey: 'post-conf-survey', VersionNumber: 1, Status: 'Published', PublishedAt: `${R.history.startYear}-06-01T00:00:00Z`, IsSharedDemo: true }];
  const formPages = [{ PageKey: 'post-conf-survey:p1', FormKey: 'post-conf-survey', Title: S.page, DisplayOrder: 0, IsSharedDemo: true }];
  const formQuestions = S.questions.map((q, i) => ({
    QuestionKey: `post-conf-survey:${q.key}`, FormKey: 'post-conf-survey', PageKey: 'post-conf-survey:p1',
    QuestionType: q.type, Prompt: q.prompt, IsRequired: q.required, DisplayOrder: i, IsSharedDemo: true,
  }));

  const personByKey = new Map(people.map((p) => [p.MemberNumber, p]));
  const confByYear = new Map(events.filter((e) => e.EventType === 'Conference').map((e) => [e.Year, e]));

  // ---------- per conference year: a distribution + attendee responses ----------
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

    childOutcome({
      seed,
      items: attendees,
      scoreOf: (x) => F.response.arrows.engagement.beta * (personByKey.get(x.MemberNumber)._thetaPath?.[year] ?? personByKey.get(x.MemberNumber)._theta),
      target: F.response.rateTarget,
      streamKey: (x) => `formresp:${x.RegKey}`,
      decide: (x, prob, r) => {
        if (!r.bernoulli(prob)) return;
        const p = personByKey.get(x.MemberNumber);
        const respKey = `${distKey}:${x.MemberNumber}`;
        formResponses.push({
          ResponseKey: respKey, FormKey: 'post-conf-survey', VersionKey: 'post-conf-survey:1',
          DistributionKey: distKey, MemberNumber: x.MemberNumber, Status: 'Complete',
          SubmittedAt: `${iso(addDays(opens, r.int(1, F.response.submitDelayDaysMax)))}T12:00:00Z`,
          IsSharedDemo: true, _theta: p._thetaPath?.[year] ?? p._theta,
        });
        dist.ResponseCount += 1;
      },
    });
  }

  // ---------- answers: SECOND pass over the actual respondent pool ----------
  // Respondents are engagement-selected TWICE (attend, then respond), so the naive base
  // overshoots the target mean — the selection-effect lesson (spec §7 lesson #1). Calibrate
  // the base linearly over the real pool: base' = target − β·mean(θ_respondents). Each
  // response draws its answers from its OWN stream.
  const A = F.answers;
  const meanTheta = formResponses.length ? formResponses.reduce((s2, x) => s2 + x._theta, 0) / formResponses.length : 0;
  const npsBase = A.nps.base - A.nps.engagementBeta * meanTheta;
  const overallBase = A.overall.base - A.overall.engagementBeta * meanTheta;
  const clampRound = (v, lo, hi) => Math.max(lo, Math.min(hi, Math.round(v)));
  for (const resp of formResponses) {
    const r = rng(seed, `formans:${resp.ResponseKey}`);
    const theta = resp._theta;
    formAnswers.push(
      { AnswerKey: `${resp.ResponseKey}:nps`, ResponseKey: resp.ResponseKey, QuestionKey: 'post-conf-survey:nps', NumericValue: clampRound(npsBase + A.nps.engagementBeta * theta + r.normal(0, A.nps.noiseSd), A.nps.min, A.nps.max), IsSharedDemo: true },
      { AnswerKey: `${resp.ResponseKey}:overall`, ResponseKey: resp.ResponseKey, QuestionKey: 'post-conf-survey:overall', NumericValue: clampRound(overallBase + A.overall.engagementBeta * theta + r.normal(0, A.overall.noiseSd), A.overall.min, A.overall.max), IsSharedDemo: true },
      { AnswerKey: `${resp.ResponseKey}:returning`, ResponseKey: resp.ResponseKey, QuestionKey: 'post-conf-survey:returning', BooleanValue: r.bernoulli(1 / (1 + Math.exp(-(A.returning.baseLogit + A.returning.engagementBeta * theta)))), IsSharedDemo: true },
    );
  }
  for (const resp of formResponses) delete resp._theta; // latent — never ships

  return { forms, formVersions, formPages, formQuestions, formDistributions, formResponses, formAnswers };
}
