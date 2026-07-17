// Defects — deliberate, LABELED record corruption ("error generation", feedback 2026-07-16).
//
// Real membership databases rot: duplicates get minted by org portals, people change jobs
// without updating profiles, emails carry typos. The generator injects these defects the
// way they actually occur — and records every injection in DataQualityLabel with the
// correct answer, so dedup/enrichment/cleansing demos are verifiable, never hand-waved.
//
// Runs LAST in the pipeline (after relationships): duplicates are shallow contact records
// (no membership history — how portal dupes are born), stale employers keep the TRUTH in
// the Relationship stream while the profile stays wrong, typos mutate emails in place.

import { rng } from '../../engine/rng.mjs';
import { iso, addDays } from '../../engine/dates.mjs';

const EMPLOYEE_TYPE_ID = '27CFD031-5663-4000-A7AB-8AC87DB88C1D'; // bizapps-common's seeded Employee type

export function buildDefects(cfg, people, orgs, relationships) {
  const { R, seed, release } = cfg;
  const D = R.defects;
  const labels = [];
  const extraPeople = [];
  const crowd = people.filter((p) => !p._hero);
  const pickDistinct = (r, pool, k) => {
    const idx = new Set();
    while (idx.size < Math.min(k, pool.length)) idx.add(r.int(0, pool.length - 1));
    return [...idx].map((i) => pool[i]);
  };

  // ---------- duplicate people: shallow contact records ----------
  const rDup = rng(seed, 'defect:duplicates');
  for (const p of pickDistinct(rDup, crowd.filter((x) => x.Email), D.duplicatePerson.count)) {
    const dupNumber = `ICF-D${p.MemberNumber.slice(-5)}`;
    const first = p.PreferredName ?? p.FirstName; // dupes are often minted under the informal name
    extraPeople.push({
      MemberNumber: dupNumber, FirstName: first, LastName: p.LastName,
      MiddleName: null, PreferredName: null, Title: p.Title,
      Email: `${(first[0] + p.LastName).toLowerCase().replace(/[^a-z0-9]/g, '')}.${p.MemberNumber.replace(/\D/g, '')}@example.com`,
      Segment: p.Segment, Region: p.Region, City: p.City, State: p.State, Latitude: p.Latitude, Longitude: p.Longitude,
      OrgKey: null, JoinDate: iso(addDays(release, -rDup.int(30, 700))), IsSharedDemo: true, _dup: true,
    });
    labels.push({
      LabelKey: `dup:${dupNumber}`, DefectKind: 'DuplicatePerson',
      MemberNumber: dupNumber, RelatedMemberNumber: p.MemberNumber,
      DefectValue: `${first} ${p.LastName} (${dupNumber})`, TruthValue: p.MemberNumber,
      Notes: 'portal-minted contact duplicate — no membership history of its own', IsSharedDemo: true,
    });
  }
  // the deep exemplars (Kate/Kathy: full activity split) declare themselves via pins.duplicateOf
  for (const h of R.heroes) {
    if (!h.pins?.duplicateOf) continue;
    labels.push({
      LabelKey: `dup:${h.memberNumber}`, DefectKind: 'DuplicatePerson',
      MemberNumber: h.memberNumber, RelatedMemberNumber: h.pins.duplicateOf,
      DefectValue: `${h.first} ${h.last} (${h.memberNumber})`, TruthValue: h.pins.duplicateOf,
      Notes: 'the deep duplicate: activity split across both records (persona pair)', IsSharedDemo: true,
    });
  }

  // ---------- stale employers: profile lies, relationships tell the truth ----------
  const orgKeys = orgs.filter((o) => !o.OrgKey.startsWith('ORG-H') && !o.OrgKey.startsWith('ORG-T')).map((o) => o.OrgKey);
  const empRelByMember = new Map(relationships.relationships.filter((x) => x.RelKey.startsWith('emp:')).map((x) => [x.FromMemberNumber, x]));
  const rStale = rng(seed, 'defect:stale-employer');
  const staleCandidates = crowd.filter((p) => p.OrgKey && empRelByMember.get(p.MemberNumber)?.Status === 'Active');
  for (const p of pickDistinct(rStale, staleCandidates, D.staleEmployer.count)) {
    let trueOrgKey = orgKeys[rStale.int(0, orgKeys.length - 1)];
    if (trueOrgKey === p.OrgKey) trueOrgKey = orgKeys[(orgKeys.indexOf(trueOrgKey) + 1) % orgKeys.length];
    applyStale(p, p.OrgKey, trueOrgKey, rStale.int(3, 14));
  }
  // Aisha (declared): her true employer is a NEW org the defect creates
  for (const h of R.heroes) {
    if (!h.staleEmployer) continue;
    const p = people.find((x) => x.MemberNumber === h.memberNumber);
    if (!p) continue;
    const trueOrg = {
      OrgKey: `ORG-T${h.memberNumber.slice(-3)}`, Name: h.staleEmployer.trueEmployerName, Type: 'Producer',
      Region: h.region, City: h.city, State: h.state, Latitude: h.lat, Longitude: h.lon, LifecycleEvent: null, IsSharedDemo: true,
    };
    orgs.push(trueOrg);
    applyStale(p, p.OrgKey, trueOrg.OrgKey, h.staleEmployer.monthsAgo);
  }

  function applyStale(p, staleOrgKey, trueOrgKey, monthsAgo) {
    const switched = iso(addDays(release, -Math.round(monthsAgo * 30.44)));
    const oldRel = empRelByMember.get(p.MemberNumber);
    if (oldRel) { oldRel.Status = 'Ended'; oldRel.EndDate = switched; }
    relationships.relationships.push({
      RelKey: `emp-true:${p.MemberNumber}`, TypeKey: null, TypeID: EMPLOYEE_TYPE_ID,
      FromMemberNumber: p.MemberNumber, ToOrgKey: trueOrgKey, Title: p.Title ?? null,
      StartDate: switched, EndDate: null, Status: 'Active', IsSharedDemo: true,
    });
    const staleName = orgs.find((o) => o.OrgKey === staleOrgKey)?.Name;
    const trueName = orgs.find((o) => o.OrgKey === trueOrgKey)?.Name;
    labels.push({
      LabelKey: `stale:${p.MemberNumber}`, DefectKind: 'StaleEmployer',
      MemberNumber: p.MemberNumber, RelatedOrgKey: trueOrgKey,
      DefectValue: staleName, TruthValue: trueName,
      Notes: `profile still shows ${staleName}; the Relationship stream holds the truth (switched ${switched})`, IsSharedDemo: true,
    });
  }

  // ---------- typo'd emails ----------
  const rTypo = rng(seed, 'defect:typo-email');
  const typoPool = crowd.filter((p) => p.Email && !labels.some((l) => l.MemberNumber === p.MemberNumber));
  for (const p of pickDistinct(rTypo, typoPool, D.typoEmail.count)) {
    const [local, domain] = p.Email.split('@');
    // scan from a drawn start for an adjacent pair that actually differs (a.k.a. 'll' won't transpose)
    const start = rTypo.int(1, Math.max(1, local.length - 2));
    let i = -1;
    for (let k = 0; k < local.length - 1; k++) {
      const j = 1 + ((start - 1 + k) % (local.length - 1));
      if (local[j] !== local[j - 1]) { i = j; break; }
    }
    if (i === -1) continue;
    const typo = local.slice(0, i - 1) + local[i] + local[i - 1] + local.slice(i + 1) + '@' + domain;
    labels.push({
      LabelKey: `typo:${p.MemberNumber}`, DefectKind: 'TypoEmail',
      MemberNumber: p.MemberNumber, DefectValue: typo, TruthValue: p.Email,
      Notes: 'transposed characters in the local part', IsSharedDemo: true,
    });
    p.Email = typo;
  }

  return { labels, extraPeople };
}
