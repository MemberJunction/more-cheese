// Spec §5 steps 1–2: the world and its drivers.
//
// Builds organizations (with lifecycle events — the fuel for causal arrow 1.15,
// "employer trouble → churn risk") and people (with the two hidden dials, θ engagement and
// φ affluence, drawn from a correlated copula). Heroes are PINNED: their facts come from
// the ruleset, not from dice — they overwrite the first crowd slots and their employers are
// appended as extra orgs. Every entity draws from its own substream (spec §4), so adding a
// person never reshuffles anyone else.

import { rng } from './rng.mjs';
import { iso, addDays, addYears } from './dates.mjs';
import { FIRST, LAST, CHEESE_WORDS, ORG_SUFFIX, CITIES, SEGMENTS } from './banks.mjs';

export function buildOrgs(cfg) {
  const { R, seed, releaseYear } = cfg;
  const orgs = [];
  const nOrgs = Math.round(cfg.n * R.orgs.ratioToMembers);
  for (let i = 0; i < nOrgs; i++) {
    const r = rng(seed, `org:${i}`);
    const region = r.pickWeighted(R.geography.mix);
    const [city, state, lat, lon] = r.pickWeighted(CITIES[region].map((c) => [c, c[4]]));
    const type = r.pickWeighted([['Producer', R.orgs.producerShare], ['Retailer', 0.30], ['Supplier', 0.15], ['Educator', 0.10]]);
    const name = `${r.pick(CHEESE_WORDS)} ${r.pick(CHEESE_WORDS)} ${r.pick(ORG_SUFFIX[type])}`;
    // small chance per history year of a dissolution/acquisition/program-cut
    let event = null;
    for (let y = R.history.startYear + 2; y <= releaseYear; y++) {
      if (r.bernoulli(R.orgs.lifecycleEventRatePerYear)) {
        event = { year: y, kind: r.pick(['Dissolved', 'Acquired', 'ProgramCut']) };
        break;
      }
    }
    orgs.push({ OrgKey: `ORG-${String(i + 1).padStart(4, '0')}`, Name: name, Type: type, Region: region, City: city, State: state, Latitude: lat, Longitude: lon, LifecycleEvent: event, IsSharedDemo: true });
  }
  return orgs;
}

/** Join dates: growth-weighted intake (~15%/yr) — attrition then builds the tenure pyramid honestly. */
function joinDateFor(r, cfg) {
  const { R, releaseYear } = cfg;
  const weights = [];
  for (let y = R.history.startYear; y <= releaseYear; y++) weights.push([y, Math.pow(1.15, y - R.history.startYear)]);
  const y = r.pickWeighted(weights);
  const d = new Date(Date.UTC(y, r.int(0, 11), r.int(1, 28)));
  return d > cfg.release ? addYears(d, -1) : d;
}

/**
 * Engagement is a PROCESS, not a constant (core.json latents.engagementDrift): a stable
 * personal anchor + a persistent yearly wander. Variance splits so total stays ~1 (β sizes
 * keep their meaning). Returns { anchor, path: {year: theta_y} } from its own substream —
 * a member's drift never depends on anyone else.
 */
function thetaProcess(cfg, key, anchorZ) {
  const { R, seed, releaseYear } = cfg;
  const d = R.latents.engagementDrift;
  const anchor = Math.sqrt(d.anchorShare) * anchorZ;
  const wanderSd = Math.sqrt(1 - d.anchorShare);
  const years = releaseYear - R.history.startYear + 2; // through the forward window
  const wander = rng(seed, `theta-drift:${key}`).ar1(years, d.yearRho, wanderSd * Math.sqrt(1 - d.yearRho * d.yearRho));
  const path = {};
  for (let i = 0; i < years; i++) path[R.history.startYear + i] = anchor + wander[i];
  return { anchor, path };
}

export function buildPeople(cfg, orgs) {
  const { R, seed } = cfg;
  const people = [];
  for (let i = 0; i < cfg.n; i++) {
    const key = `ICF-${String(100001 + i)}`;
    const r = rng(seed, `person:${key}`);
    const region = r.pickWeighted(R.geography.mix);
    const [city, state, lat, lon] = r.pickWeighted(CITIES[region].map((c) => [c, c[4]]));
    const [thetaZ, phi] = r.copulaPair(R.latents.copulaRho);
    const { anchor: theta, path: thetaPath } = thetaProcess(cfg, key, thetaZ);
    const org = r.bernoulli(0.8) ? orgs[r.int(0, orgs.length - 1)] : null;
    const anniversary = r.bernoulli(R.cohorts.anniversaryShare); // ASSUMPTION: D6 pending
    people.push({
      MemberNumber: key, FirstName: r.pick(FIRST), LastName: r.pick(LAST),
      Segment: r.pickWeighted(SEGMENTS), Region: region, City: city, State: state, Latitude: lat, Longitude: lon,
      OrgKey: org?.OrgKey ?? null, JoinDate: iso(joinDateFor(r, cfg)),
      _theta: theta, _thetaPath: thetaPath, _phi: phi, // latents: generator-internal, stripped before emit
      CycleType: anniversary ? 'anniversary' : 'calendar',
      AutoRenew: anniversary ? r.bernoulli(0.8) : r.bernoulli(R.cohorts.autoRenewShare * 0.5),
      IsSharedDemo: true,
    });
  }
  // heroes overwrite the first slots with pinned facts (their employers become extra orgs)
  for (const h of R.heroes) {
    const joinDate = h.joinDate ?? iso(addDays(addYears(cfg.release, -h.joinYearsAgo), h.anniversaryOffsetDays));
    const heroOrg = { OrgKey: `ORG-H${h.memberNumber.slice(-3)}`, Name: h.employerName, Type: h.segment === 'Producer' ? 'Producer' : 'Retailer', Region: h.region, City: h.city, State: h.state, Latitude: h.lat, Longitude: h.lon, LifecycleEvent: null, IsSharedDemo: true };
    orgs.push(heroOrg);
    const idx = R.heroes.indexOf(h);
    people[idx] = {
      MemberNumber: h.memberNumber, FirstName: h.first, LastName: h.last,
      Segment: h.segment, Region: h.region, City: h.city, State: h.state, Latitude: h.lat, Longitude: h.lon,
      OrgKey: heroOrg.OrgKey, JoinDate: joinDate, _theta: h.theta, _thetaPath: null, _phi: h.phi, // heroes: pinned level, no drift (their arcs are pinned facts)
      CycleType: h.cycleType, AutoRenew: h.autoRenew, IsSharedDemo: true, _hero: true,
    };
  }
  return people;
}
