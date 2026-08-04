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
import { projectRows } from '../../engine/row-template.mjs';

// ── row templates ── strict reads: the old `description ?? null` was dead code (every cert has
// one), and dead fallbacks are how renames become silent nulls — the template read throws instead
export const CERT_ROW = { row: {
  CertKey: { from: 'item.key' }, Name: { from: 'item.name' },
  Description: { from: 'item.description' }, ValidYears: { from: 'item.validYears' }, IsSharedDemo: true,
} };

export function buildPrograms(cfg, { people, periods, learning }) {
  // ── inputs ── the ruleset sections this domain reads, and the upstream rows
  const { R, seed, release } = cfg;
  const PR = R.programs;
  const releaseIso = iso(release);

  // ── fixtures ── certifications
  const certifications = projectRows(CERT_ROW, PR.catalog.certifications);
  const completers = [...new Set(learning.enrollments.filter((e) => e.Status === 'Completed').map((e) => e.MemberNumber))]
    .map((m) => people.find((p) => p.MemberNumber === m)).filter((p) => p && !p._hero);
  const memberCertifications = [];
  childOutcome({
    seed,
    items: completers,
    scoreOf: (p) => PR.effects['certification.engagement'].beta * p._theta,
    target: PR.params.certificationPursuit.target,
    streamKey: (p) => `cert:${p.MemberNumber}`,
    decide: (p, prob, r) => {
      if (!r.bernoulli(prob)) return;
      // credential history spans the whole membership, not just the last 3 years — long
      // tenures produce awards old enough that ValidYears runs out (Expired appears, and
      // with it the recertification story). A smaller share pursue a SECOND credential
      // after the first award — real programs have multi-credential members.
      const daysSinceJoin = Math.max(120, Math.round((release - parseDate(p.JoinDate)) / 86400000) - 30);
      const emitCert = (cert, enrolled) => {
        // the award draw and the eligibility check use the SAME horizon: an award that
        // would land after release means the pursuit is still InProgress (the old guard
        // checked +180d but drew up to +360d — certs got awarded in the future)
        const awardDays = r.int(120, 360);
        const awarded = r.bernoulli(PR.params.certificationAwardShare) && iso(addDays(enrolled, awardDays)) <= releaseIso;
        const awardedOn = awarded ? addDays(enrolled, awardDays) : null;
        const expiresOn = awardedOn ? addYears(awardedOn, cert.validYears) : null;
        const expired = expiresOn && iso(expiresOn) < releaseIso;
        memberCertifications.push({
          MemberCertKey: `${p.MemberNumber}:${cert.key}`, MemberNumber: p.MemberNumber, CertKey: cert.key,
          Status: awarded ? (expired ? 'Expired' : 'Awarded') : 'InProgress',
          EnrolledOn: iso(enrolled), AwardedOn: awardedOn ? iso(awardedOn) : null,
          ExpiresOn: expiresOn ? iso(expiresOn) : null, IsSharedDemo: true,
        });
        return awardedOn;
      };
      // credentials LADDER: the first one pursued is always one with no prerequisite,
      // weighted so foundation credentials dominate. A member who earns one may go on to
      // a credential whose prerequisite they now hold — so an advanced certificate never
      // appears on someone who never earned the rung below it.
      const catalog = PR.catalog.certifications;
      const weightOf = (c) => c.weight ?? 1;
      const openTo = (held) => catalog.filter((c) => !held.has(c.key) && (!c.prerequisite || held.has(c.prerequisite)));
      const held = new Set();
      const entry = openTo(held).filter((c) => !c.prerequisite);
      if (!entry.length) return;
      const first = r.pickWeighted(entry.map((c) => [c, weightOf(c)]));
      const firstAwarded = emitCert(first, addDays(release, -r.int(90, daysSinceJoin)));
      if (!firstAwarded) return;
      held.add(first.key);
      // each further rung is rarer than the last
      let when = firstAwarded;
      for (let step = 0; step < 2; step++) {
        if (!r.bernoulli(step === 0 ? 0.2 : 0.08)) break;
        const next = openTo(held);
        if (!next.length) break;
        const pickNext = r.pickWeighted(next.map((c) => [c, weightOf(c)]));
        const gap = r.int(180, 900);
        if (iso(addDays(when, gap)) >= releaseIso) break;
        const awarded = emitCert(pickNext, addDays(when, gap));
        held.add(pickNext.key);
        if (!awarded) break;
        when = awarded;
      }
    },
  });
  // hero declarations — authored facts. `certifications` (plural) lets a persona carry a
  // whole ladder; the older singular `certification` still works.
  for (const h of R.heroes) {
    const declared = h.certifications ?? (h.certification ? [h.certification] : []);
    for (const d of declared) {
      const cert = PR.catalog.certifications.find((c) => c.key === d.key);
      const awardedOn = d.awardedOn ?? null;
      memberCertifications.push({
        MemberCertKey: `${h.memberNumber}:${d.key}`, MemberNumber: h.memberNumber,
        CertKey: d.key, Status: d.status,
        EnrolledOn: d.enrolledOn, AwardedOn: awardedOn,
        ExpiresOn: awardedOn && cert ? iso(addYears(parseDate(awardedOn), cert.validYears)) : null,
        IsSharedDemo: true,
      });
    }
  }

  // ── decisions ── competition entries (producers with orgs; org membership = eligibility)
  const competitionEntries = [];
  const memberYears = yearsCovered(periods, R.history.startYear, release.getUTCFullYear());
  const productName = (r) => r.pick(PR.catalog.competitionProductForms).replace('{t}', r.pick(TOPONYMS));
  for (const p of people) {
    if (p.Segment !== 'Producer' || !p.OrgKey) continue;
    const pinned = R.heroes.find((h) => h.memberNumber === p.MemberNumber)?.competition;
    for (const y of memberYears.get(p.MemberNumber) ?? []) {
      const r = rng(seed, `compentry:${p.MemberNumber}:${y}`);
      // judging is a physical activity — the pandemic competition was curtailed
      const CV = R.regimes.covid;
      const compRate = PR.params.competitionEntryRatePerYear * (CV.years.includes(y) ? (CV.competitionMultiplier ?? 1) : 1);
      const n = pinned ? pinned.entriesPerYear : (r.bernoulli(compRate) ? 1 + (r.bernoulli(0.25) ? 1 : 0) : 0);
      for (let i = 0; i < Math.min(n, pinned ? n : PR.params.competitionMaxPerYear); i++) {
        let result = r.pickWeighted(Object.entries(PR.mixes.medal));
        if (pinned?.pinnedResults?.[y] && i === 0) result = pinned.pinnedResults[y]; // Henri's Gold is a fact
        competitionEntries.push({
          EntryKey: `${p.MemberNumber}:${y}:${i}`, MemberNumber: p.MemberNumber, OrgKey: p.OrgKey,
          EntryYear: y, Category: pinned?.category && i === 0 ? pinned.category : r.pick(PR.catalog.competitionCategories),
          ProductName: pinned?.productName && i === 0 ? pinned.productName : productName(r),
          Result: result, IsSharedDemo: true,
        });
      }
    }
  }

  // ── decisions ── advocacy actions
  const advocacyActions = [];
  const crowd = people.filter((p) => !p._hero);
  childOutcome({
    seed,
    items: crowd,
    scoreOf: (p) => PR.effects['advocacy.engagement'].beta * p._theta,
    target: PR.params.advocateShare.target,
    streamKey: (p) => `advocate:${p.MemberNumber}`,
    decide: (p, prob, r) => {
      if (!r.bernoulli(prob)) return;
      for (const y of (memberYears.get(p.MemberNumber) ?? [])) {
        // the one thing that goes UP: emergency relief and market-access lobbying, so the
        // era is not a uniform dip
        const CV2 = R.regimes.covid;
        const advMean = PR.params.advocacyActionsPerYearMean * (CV2.years.includes(y) ? (CV2.advocacyMultiplier ?? 1) : 1);
        const k = r.negbin(advMean, PR.params.advocacyDispersionK);
        for (let i = 0; i < k; i++) {
          advocacyActions.push(actionRow(p.MemberNumber, y, i, r.pickWeighted(Object.entries(PR.mixes.advocacyKind)), r.pick(PR.catalog.advocacyTopics), r));
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
    // advocacy is campaign-spiky, not uniform: mass actions (letters, petitions) cluster
    // into a shared per-year-per-topic campaign window — hundreds of members act within
    // days of each other around a vote. Individual acts (testimony, meetings) stay spread.
    let date;
    if (kind === 'LetterCampaign' || kind === 'PetitionSignature') {
      const rc = rng(seed, `campaign:${y}:${topic}`);
      const campaignStart = new Date(Date.UTC(y, rc.int(0, 11), rc.int(1, 25)));
      date = addDays(campaignStart, r.int(0, 4));
    } else {
      date = new Date(Date.UTC(y, r.int(0, 11), r.int(1, 28)));
    }
    return {
      ActionKey: `${member}:${y}:${i}`, MemberNumber: member,
      ActionDate: iso(date),
      Kind: kind, Topic: topic, IsSharedDemo: true,
    };
  }

  // ── shape ── assemble the named tables this domain owns
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
