// Relationships — targets bizapps-common's Relationship/RelationshipType.
//
// Employment DERIVES from the world: every member with an employer gets an Employee
// relationship (their seeded type UUID, referenced not re-created), ENDED when the employer
// dissolved — Danielle's diagnosis gets a third witness. Story links are AUTHORED in the
// ruleset: Elena mentors Priya, the Kate/Kathy duplicate ground truth, and the 2023
// acquisition connecting Bob's employer to Victor's. Demo-owned types (Mentor, Duplicate Of)
// carry uuidFor-pinned IDs; bizapps-common's own seed types are never emitted by us.

import { rng } from '../../engine/rng.mjs';

export function buildRelationships(cfg, people, orgs) {
  const { R } = cfg;
  const REL = R.relationships;
  const orgByKey = new Map(orgs.map((o) => [o.OrgKey, o]));
  const personByNum = new Map(people.map((p) => [p.MemberNumber, p]));

  const relationshipTypes = REL.demoTypes.map((t) => ({
    TypeKey: t.name, Name: t.name, Category: t.category,
    ForwardLabel: t.forward, ReverseLabel: t.reverse, Description: t.description,
    IsDirectional: true, IsActive: true, IsSharedDemo: true,
  }));

  const relationships = [];

  // employment: derived — one Employee edge per employed member
  for (const p of people) {
    if (!p.OrgKey) continue;
    const org = orgByKey.get(p.OrgKey);
    const dissolved = org?.LifecycleEvent?.kind === 'Dissolved';
    relationships.push({
      RelKey: `emp:${p.MemberNumber}`, TypeKey: null, TypeID: REL.seededTypeIDs.Employee,
      FromMemberNumber: p.MemberNumber, ToOrgKey: p.OrgKey,
      Title: p.Title ?? null, StartDate: p.JoinDate,
      EndDate: dissolved ? `${org.LifecycleEvent.year}-12-31` : null,
      Status: dissolved ? 'Ended' : 'Active',
      IsSharedDemo: true,
    });
  }

  // authored story links (heroes)
  for (const a of REL.authored) {
    const demoType = REL.demoTypes.find((t) => t.name === a.type);
    const row = {
      RelKey: `story:${a.type}:${a.from ?? a.fromOrgOf}`,
      TypeKey: demoType ? a.type : null, TypeID: demoType ? null : REL.seededTypeIDs[a.type],
      StartDate: a.start ?? null, EndDate: null, Status: 'Active', Notes: a.note ?? null,
      IsSharedDemo: true,
    };
    if (a.fromOrgOf) { // org-to-org via the heroes' employers
      row.FromOrgKey = personByNum.get(a.fromOrgOf)?.OrgKey;
      row.ToOrgKey = personByNum.get(a.toOrgOf)?.OrgKey;
    } else {
      row.FromMemberNumber = a.from;
      row.ToMemberNumber = a.to;
    }
    relationships.push(row);
  }

  // ---------- derived demo-owned edges ----------
  // The graph used to be 1,593 employment edges and 3 authored story links, so a
  // relationship viewer had nothing to view. These derive from facts we already have
  // (no new person/org rows, no re-roll: relationships is downstream-terminal).
  const D = REL.derived ?? {};
  const { seed } = cfg;

  // REFERRALS: a joiner was referred by someone who was ALREADY a member on their join
  // date and shares their employer or city — which is how word of mouth actually travels.
  if (D.referral) {
    const byJoin = [...people].filter((p) => !p._dup).sort((a, b) => (a.JoinDate < b.JoinDate ? -1 : a.JoinDate > b.JoinDate ? 1 : a.MemberNumber < b.MemberNumber ? -1 : 1));
    for (let i = 0; i < byJoin.length; i++) {
      const p = byJoin[i];
      const r = rng(seed, `referral:${p.MemberNumber}`);
      if (!r.bernoulli(D.referral.shareOfJoiners)) continue;
      // candidates: earlier joiners at the same employer, else the same city
      const earlier = byJoin.slice(0, i);
      const sameOrg = p.OrgKey ? earlier.filter((q) => q.OrgKey === p.OrgKey) : [];
      const pool = sameOrg.length ? sameOrg : earlier.filter((q) => q.City === p.City);
      if (!pool.length) continue;
      const referrer = pool[r.int(0, pool.length - 1)];
      relationships.push({
        RelKey: `referral:${p.MemberNumber}`, TypeKey: 'Referred By', TypeID: null,
        FromMemberNumber: p.MemberNumber, ToMemberNumber: referrer.MemberNumber,
        Title: null, StartDate: p.JoinDate, EndDate: null, Status: 'Active',
        Notes: sameOrg.length ? 'referred by a colleague at the same organization' : 'referred by another member locally',
        IsSharedDemo: true,
      });
    }
  }

  // SUPPLIER-OF: supplier organizations serve a handful of producer creameries each,
  // preferring their own region so the trade graph reads geographically.
  if (D.supplierOf) {
    const suppliers = orgs.filter((o) => o.Type === 'Supplier');
    const producers = orgs.filter((o) => o.Type === 'Producer');
    for (const s of suppliers) {
      const r = rng(seed, `supplierof:${s.OrgKey}`);
      const local = producers.filter((o) => o.Region === s.Region);
      const pool = local.length >= 3 ? local : producers;
      if (!pool.length) continue;
      const n = r.int(D.supplierOf.edgesPerSupplier.min, D.supplierOf.edgesPerSupplier.max);
      const taken = new Set();
      for (let k = 0; k < n; k++) {
        const pick = pool[r.int(0, pool.length - 1)];
        if (!pick || taken.has(pick.OrgKey)) continue;
        taken.add(pick.OrgKey);
        relationships.push({
          RelKey: `supplies:${s.OrgKey}:${pick.OrgKey}`, TypeKey: 'Supplier Of', TypeID: null,
          FromOrgKey: s.OrgKey, ToOrgKey: pick.OrgKey,
          Title: null, StartDate: null, EndDate: null, Status: 'Active', Notes: null,
          IsSharedDemo: true,
        });
      }
    }
  }

  return { relationshipTypes, relationships };
}
