// Spec §5 steps 1–2: the world and its drivers.
//
// Builds organizations (with lifecycle events — the fuel for causal arrow 1.15,
// "employer trouble → churn risk") and people (with the two hidden dials, θ engagement and
// φ affluence, drawn from a correlated copula). Heroes are PINNED: their facts come from
// the ruleset, not from dice — they overwrite the first crowd slots and their employers are
// appended as extra orgs. Every entity draws from its own substream (spec §4), so adding a
// person never reshuffles anyone else.

import { rng } from '../../engine/rng.mjs';
import { staticAssignment } from '../../engine/patterns.mjs';
import { iso, addDays, addYears } from '../../engine/dates.mjs';
import { orgNameDealer, personNameFor, CITIES, SEGMENTS } from './banks.mjs';

export function buildOrgs(cfg) {
  const { R, seed, releaseYear } = cfg;
  const orgs = [];
  const nOrgs = Math.round(cfg.n * R.orgs.ratioToMembers);
  // AUTHORED names, dealt without replacement from the bank's own dice streams —
  // dice assign names, they never compose them (the mad-libs lesson)
  const dealName = orgNameDealer(seed);
  for (let i = 0; i < nOrgs; i++) {
    const r = rng(seed, `org:${i}`);
    const region = r.pickWeighted(R.geography.mix);
    const [city, state, lat, lon] = r.pickWeighted(CITIES[region].map((c) => [c, c[4]]));
    const type = r.pickWeighted([['Producer', R.orgs.producerShare], ['Retailer', 0.30], ['Supplier', 0.15], ['Educator', 0.10]]);
    const name = dealName(type);
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
    const segment = r.pickWeighted(SEGMENTS);
    // tier assignment: DECLARED rules (ruleset membership.tiers.assign) via core staticAssignment
    const tier = staticAssignment(R.membership.tiers.assign, { Segment: segment, hasOrganization: !!org, phi });
    // origin-consistent authored name from the member's own name stream (region-weighted buckets)
    const nm = personNameFor(seed, key, region);
    people.push({
      MemberNumber: key, FirstName: nm.first, LastName: nm.last,
      Segment: segment, MembershipTier: tier, Region: region, City: city, State: state, Latitude: lat, Longitude: lon,
      OrgKey: org?.OrgKey ?? null, JoinDate: iso(joinDateFor(r, cfg)),
      _theta: theta, _thetaPath: thetaPath, _phi: phi, // latents: generator-internal, stripped before emit
      CycleType: anniversary ? 'anniversary' : 'calendar',
      AutoRenew: anniversary ? r.bernoulli(0.8) : r.bernoulli(R.cohorts.autoRenewShare * 0.5),
      IsSharedDemo: true,
    });
  }
  // heroes overwrite the first slots with pinned facts (their employers become extra orgs).
  // Pinnable per hero: joinDate | joinYearsAgo+anniversaryOffsetDays | joinDaysBeforeRelease
  // (release-relative — Nia's cold start survives any release date); employerEvent
  // ({year, kind} — Danielle's dissolution, Bob's acquisition); thetaByYear (a pinned arc,
  // e.g. Bob's 3-year decline); lapseYear (a pinned NO at that renewal); employerName null
  // → no org (Jamie the enthusiast).
  const ORG_TYPE = { Producer: 'Producer', Retailer: 'Retailer', Supplier: 'Supplier', Educator: 'Educator' };
  for (const h of R.heroes) {
    const joinDate = h.joinDate
      ?? (h.joinDaysBeforeRelease != null ? iso(addDays(cfg.release, -h.joinDaysBeforeRelease))
        : iso(addDays(addYears(cfg.release, -h.joinYearsAgo), h.anniversaryOffsetDays)));
    let heroOrg = null;
    if (h.employerName) {
      heroOrg = { OrgKey: `ORG-H${h.memberNumber.slice(-3)}`, Name: h.employerName, Type: ORG_TYPE[h.segment] ?? 'Retailer', Region: h.region, City: h.city, State: h.state, Latitude: h.lat, Longitude: h.lon, LifecycleEvent: h.employerEvent ?? null, IsSharedDemo: true };
      orgs.push(heroOrg);
    }
    const idx = R.heroes.indexOf(h);
    people[idx] = {
      MemberNumber: h.memberNumber, FirstName: h.first, LastName: h.last,
      Segment: h.segment, MembershipTier: h.tier ?? 'Individual', Region: h.region, City: h.city, State: h.state, Latitude: h.lat, Longitude: h.lon,
      OrgKey: heroOrg?.OrgKey ?? null, JoinDate: joinDate,
      _theta: h.theta, _thetaPath: h.thetaByYear ?? null, _phi: h.phi, // pinned level — or a pinned ARC (thetaByYear); never drawn drift
      _lapseYear: h.lapseYear ?? null,
      CycleType: h.cycleType, AutoRenew: h.autoRenew, IsSharedDemo: true, _hero: true,
    };
  }
  return people;
}
