// Programs — certifications (learning), competition entries (events), advocacy actions
// (membership). The 'more tables' enrichment: three thin domains that make the remaining
// persona stories queryable and give Sonar a component-shaped engagement signal.
//
// Causal shape: certification pursuit and advocacy ride the engagement dial (childOutcome);
// competition entry volume is a NegBin count over eligible producer-years; medal results
// are noise-dominant (judging is judging). Hero declarations pin Sofia's in-progress CCP,
// Henri's 8-entries-a-year habit + the 2025 Gold, and Tom's authored advocacy volume.

import { rng } from '../../engine/rng.mjs';
import { childOutcome } from '../../engine/patterns.mjs';
import { TOPONYMS } from './banks.mjs';
import { iso, addDays, addYears, parseDate } from '../../engine/dates.mjs';

export function buildPrograms(cfg, people, periods, learning) {
  const { R, seed, release } = cfg;
  const PR = R.programs;
  const releaseIso = iso(release);

  // ---------- certifications ----------
  const certifications = PR.certifications.catalog.map((c) => ({
    CertKey: c.key, Name: c.name, ValidYears: c.validYears, IsSharedDemo: true,
  }));
  const completers = [...new Set(learning.enrollments.filter((e) => e.Status === 'Completed').map((e) => e.MemberNumber))]
    .map((m) => people.find((p) => p.MemberNumber === m)).filter((p) => p && !p._hero);
  const memberCertifications = [];
  childOutcome({
    seed,
    items: completers,
    scoreOf: (p) => PR.certifications.arrows.engagement.beta * p._theta,
    target: PR.certifications.pursuitShareOfCompleters,
    streamKey: (p) => `cert:${p.MemberNumber}`,
    decide: (p, prob, r) => {
      if (!r.bernoulli(prob)) return;
      const cert = r.pick(PR.certifications.catalog);
      // enrolled sometime in the last ~3 years of their membership
      const enrolled = addDays(release, -r.int(90, 1100));
      if (iso(enrolled) < p.JoinDate) return;
      const awarded = r.bernoulli(PR.certifications.awardShare) && iso(addDays(enrolled, 180)) < releaseIso;
      const awardedOn = awarded ? addDays(enrolled, r.int(120, 360)) : null;
      const expiresOn = awardedOn ? addYears(awardedOn, cert.validYears) : null;
      const expired = expiresOn && iso(expiresOn) < releaseIso;
      memberCertifications.push({
        MemberCertKey: `${p.MemberNumber}:${cert.key}`, MemberNumber: p.MemberNumber, CertKey: cert.key,
        Status: awarded ? (expired ? 'Expired' : 'Awarded') : 'InProgress',
        EnrolledOn: iso(enrolled), AwardedOn: awardedOn ? iso(awardedOn) : null,
        ExpiresOn: expiresOn ? iso(expiresOn) : null, IsSharedDemo: true,
      });
    },
  });
  // hero declarations (Sofia's in-progress CCP)
  for (const h of R.heroes) {
    if (!h.certification) continue;
    const cert = PR.certifications.catalog.find((c) => c.key === h.certification.key);
    memberCertifications.push({
      MemberCertKey: `${h.memberNumber}:${h.certification.key}`, MemberNumber: h.memberNumber,
      CertKey: h.certification.key, Status: h.certification.status,
      EnrolledOn: h.certification.enrolledOn, AwardedOn: null, ExpiresOn: null, IsSharedDemo: true,
    });
  }

  // ---------- competition entries (producers with orgs; org membership = eligibility) ----------
  const competitionEntries = [];
  const memberYears = yearsCovered(periods, R.history.startYear, release.getUTCFullYear());
  const productName = (r) => r.pick(PR.competition.productForms).replace('{t}', r.pick(TOPONYMS));
  for (const p of people) {
    if (p.Segment !== 'Producer' || !p.OrgKey) continue;
    const pinned = R.heroes.find((h) => h.memberNumber === p.MemberNumber)?.competition;
    for (const y of memberYears.get(p.MemberNumber) ?? []) {
      const r = rng(seed, `compentry:${p.MemberNumber}:${y}`);
      const n = pinned ? pinned.entriesPerYear : (r.bernoulli(PR.competition.entryRatePerYear) ? 1 + (r.bernoulli(0.25) ? 1 : 0) : 0);
      for (let i = 0; i < Math.min(n, pinned ? n : PR.competition.maxPerYear); i++) {
        let result = r.pickWeighted(Object.entries(PR.competition.medalWeights));
        if (pinned?.pinnedResults?.[y] && i === 0) result = pinned.pinnedResults[y]; // Henri's Gold is a fact
        competitionEntries.push({
          EntryKey: `${p.MemberNumber}:${y}:${i}`, MemberNumber: p.MemberNumber, OrgKey: p.OrgKey,
          EntryYear: y, Category: pinned?.category && i === 0 ? pinned.category : r.pick(PR.competition.categories),
          ProductName: pinned?.productName && i === 0 ? pinned.productName : productName(r),
          Result: result, IsSharedDemo: true,
        });
      }
    }
  }

  // ---------- advocacy actions ----------
  const advocacyActions = [];
  const crowd = people.filter((p) => !p._hero);
  childOutcome({
    seed,
    items: crowd,
    scoreOf: (p) => PR.advocacy.arrows.engagement.beta * p._theta,
    target: PR.advocacy.advocateShare,
    streamKey: (p) => `advocate:${p.MemberNumber}`,
    decide: (p, prob, r) => {
      if (!r.bernoulli(prob)) return;
      for (const y of (memberYears.get(p.MemberNumber) ?? [])) {
        const k = r.negbin(PR.advocacy.actionsPerYearMean, PR.advocacy.dispersionK);
        for (let i = 0; i < k; i++) {
          advocacyActions.push(actionRow(p.MemberNumber, y, i, r.pickWeighted(Object.entries(PR.advocacy.kindWeights)), r.pick(PR.advocacy.topics), r));
        }
      }
    },
  });
  // Tom: authored advocacy-shaped engagement — a declared volume, not a theta consequence
  for (const h of R.heroes) {
    if (!h.advocacy) continue;
    const r = rng(seed, `advocate:${h.memberNumber}:pinned`);
    const years = memberYears.get(h.memberNumber) ?? [];
    for (let i = 0; i < h.advocacy.totalActions; i++) {
      const y = years[i % Math.max(1, years.length)];
      const kind = i < h.advocacy.testimonies ? 'Testimony' : r.pickWeighted([['LetterCampaign', 0.5], ['PetitionSignature', 0.35], ['CoalitionMeeting', 0.15]]);
      advocacyActions.push(actionRow(h.memberNumber, y, `p${i}`, kind, h.advocacy.topic, r));
    }
  }

  function actionRow(member, y, i, kind, topic, r) {
    return {
      ActionKey: `${member}:${y}:${i}`, MemberNumber: member,
      ActionDate: iso(new Date(Date.UTC(y, r.int(0, 11), r.int(1, 28)))),
      Kind: kind, Topic: topic, IsSharedDemo: true,
    };
  }

  return { certifications, memberCertifications, competitionEntries, advocacyActions };
}

/** member → sorted years with any coverage (bounded to history × release) */
function yearsCovered(periods, startYear, releaseYear) {
  const out = new Map();
  for (const per of periods) {
    const a = Math.max(startYear, parseDate(per.StartDate).getUTCFullYear());
    const b = Math.min(releaseYear, parseDate(per.EndDate).getUTCFullYear());
    if (!out.has(per.MemberNumber)) out.set(per.MemberNumber, new Set());
    for (let y = a; y <= b; y++) out.get(per.MemberNumber).add(y);
  }
  return new Map([...out.entries()].map(([m, s]) => [m, [...s].sort()]));
}
