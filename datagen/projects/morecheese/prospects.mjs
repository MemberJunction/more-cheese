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
import { CITIES, personNameFor, titleFor, SEGMENTS } from './banks.mjs';
import { emailFor } from './world.mjs';
import { iso, addDays } from '../../engine/dates.mjs';
import { renderRow } from '../../engine/row-template.mjs';

// ── row templates ── the free-webinar registration. Two draws, in column order: the lead-day
// offset then the attendance chance — exactly the handwritten order, which is why they can sit
// in the row block rather than needing a `let`. The PROSPECT PERSON row stays handwritten: its
// name, email and title come from bank functions that draw on their own streams.
export const PROSPECT_REG_ROW = { row: {
  RegKey: { fmt: 'REG-{person.MemberNumber}-{ev.EventKey}' },
  MemberNumber: { from: 'person.MemberNumber' },
  EventKey: { from: 'ev.EventKey' },
  RegisteredOn: { date: { anchor: 'ev.Date', offset: { dist: 'uniformDays', min: 1, max: 30, sign: -1 } } },
  Attended: { chance: 'attendShare' },
  IsSharedDemo: true,
} };

export function buildProspects(cfg, { orgs, events, memberCount }) {
  // ── inputs ── the ruleset sections this domain reads, and the upstream rows
  const { R, seed, release } = cfg;
  const P = R.prospects;
  const prospects = [];
  const registrations = [];
  // sized against the roster we ACTUALLY ship, not the requested n: the declining-org
  // scenario archives members away, and a count pinned to cfg.n made non-members a bigger
  // share of a smaller association — the ratio has to hold in every world
  const n = Math.round(memberCount * P.params.ratioToMembers);

  // ── decisions ── build each prospect, then decide which free events they register for
  for (let i = 0; i < n; i++) {
    const key = `NM-${String(200001 + i)}`;
    const r = rng(seed, `prospect:${key}`);
    const region = r.pickWeighted(Object.entries(R.geography.mixes.region));
    const [city, state, lat, lon, , country, countryName, nameOrigin] = r.pickWeighted(CITIES[region].map((c) => [c, c[4]]));
    // about half work somewhere we already know — a colleague of a member, or a producer
    // whose organisation is already on file
    const org = r.bernoulli(P.params.orgAffiliatedShare) && orgs.length ? orgs[r.int(0, orgs.length - 1)] : null;
    const nm = personNameFor(seed, key, region, nameOrigin);
    // first contact: when they entered the CRM. Drives nothing but their own timeline.
    const firstSeen = addDays(release, -r.int(30, P.params.firstSeenMaxDaysAgo));
    prospects.push({
      MemberNumber: key, // the PERSON business key — prospects have no member number of their own
      IsProspect: true,
      FirstName: nm.first, LastName: nm.last, MiddleName: nm.middle, PreferredName: nm.preferred,
      Email: emailFor(nm.first, nm.last, key, org?.Name),
      // a non-member has a job like anyone else — a blank title column that lines up
      // exactly with 'not a member' is an artefact, not a fact about the world
      Title: titleFor(seed, `prospect-title:${key}`, r.pickWeighted(SEGMENTS)),
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
    const k = Math.min(r.negbin(P.params.webinarsPerProspectMean, P.params.dispersionK), P.params.maxWebinarsPerProspect, open.length);
    const taken = new Set();
    for (let j = 0; j < k; j++) {
      const ev = r.pick(open);
      if (taken.has(ev.EventKey)) continue; // a repeat draw just means one fewer webinar
      taken.add(ev.EventKey);
      registrations.push(renderRow(r, PROSPECT_REG_ROW, { person: p, ev, attendShare: P.params.attendShare }));
    }
  }

  // ── shape ── assemble the named tables this domain owns
  return { prospects, registrations };
}
