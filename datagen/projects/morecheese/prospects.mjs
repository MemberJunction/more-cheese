// Non-members: the people an association knows but hasn't signed up.
//
// Every real AMS holds far more contacts than members — prospects who enquired, people who
// came to a free webinar, colleagues of members. We modelled only members, so the database
// said 100% of the people the federation knows are paying members, which no association
// anywhere can claim.
//
// How they exist without a schema change: identity lives in bizapps-common's Person, and
// MEMBERSHIP lives in our MemberProfile extension. A non-member is simply a Person with no
// MemberProfile row — the split the v2 plan chose already models this. The emitters skip
// prospect rows when writing MemberProfile (`only:` on the mapping) and include them
// everywhere identity belongs: Person, contact methods, addresses, free-event registrations.
//
// Deliberately NOT modelled yet: conversion to membership (a prospect who joins would move
// every benchmark in the suite — that is its own pass, with the funnel gates to match), and
// paid non-member event pricing (needs the money chain to price a non-member seat).

import { rng } from '../../engine/rng.mjs';
import { CITIES, personNameFor } from './banks.mjs';
import { emailFor } from './world.mjs';
import { iso, addDays } from '../../engine/dates.mjs';

export function buildProspects(cfg, orgs, events) {
  const { R, seed, release } = cfg;
  const P = R.prospects;
  const prospects = [];
  const registrations = [];
  const n = Math.round(cfg.n * P.ratioToMembers);

  for (let i = 0; i < n; i++) {
    const key = `NM-${String(200001 + i)}`;
    const r = rng(seed, `prospect:${key}`);
    const region = r.pickWeighted(R.geography.mix);
    const [city, state, lat, lon, , country, countryName, nameOrigin] = r.pickWeighted(CITIES[region].map((c) => [c, c[4]]));
    // about half work somewhere we already know — a colleague of a member, or a producer
    // whose organisation is already on file
    const org = r.bernoulli(P.orgAffiliatedShare) && orgs.length ? orgs[r.int(0, orgs.length - 1)] : null;
    const nm = personNameFor(seed, key, region, nameOrigin);
    // first contact: when they entered the CRM. Drives nothing but their own timeline.
    const firstSeen = addDays(release, -r.int(30, P.firstSeenMaxDaysAgo));
    prospects.push({
      MemberNumber: key, // the PERSON business key — prospects have no member number of their own
      IsProspect: true,
      FirstName: nm.first, LastName: nm.last, MiddleName: nm.middle, PreferredName: nm.preferred,
      Email: emailFor(nm.first, nm.last, key, org?.Name), Title: null,
      Region: region, Country: country, CountryName: countryName, City: city, State: state,
      Latitude: lat, Longitude: lon, OrgKey: org?.OrgKey ?? null,
      JoinDate: iso(firstSeen), // NOT a membership date — the identity pass reads it for completeness only
      IsSharedDemo: true,
    });
  }

  // Free webinars are the top of every association's funnel: no ticket, no order, and the
  // registration list is where next year's members come from. Paid seats stay members-only
  // until the money chain can price a non-member ticket.
  const releaseIso = iso(release);
  const freeEvents = events.filter((e) => !e.IsPaid && e.Date <= releaseIso);
  for (const p of prospects) {
    // only events since we first heard of them — a contact cannot have attended a webinar
    // that ran before they existed in the CRM
    const open = freeEvents.filter((e) => e.Date >= p.JoinDate);
    if (!open.length) continue;
    const r = rng(seed, `prospectreg:${p.MemberNumber}`);
    const k = Math.min(r.negbin(P.webinarsPerProspectMean, P.dispersionK), P.maxWebinarsPerProspect, open.length);
    const taken = new Set();
    for (let j = 0; j < k; j++) {
      const ev = r.pick(open);
      if (taken.has(ev.EventKey)) continue; // a repeat draw just means one fewer webinar
      taken.add(ev.EventKey);
      registrations.push({
        RegKey: `REG-${p.MemberNumber}-${ev.EventKey}`, MemberNumber: p.MemberNumber, EventKey: ev.EventKey,
        RegisteredOn: iso(addDays(new Date(ev.Date), -r.int(1, 30))),
        Attended: r.bernoulli(P.attendShare), IsSharedDemo: true,
      });
    }
  }

  return { prospects, registrations };
}
