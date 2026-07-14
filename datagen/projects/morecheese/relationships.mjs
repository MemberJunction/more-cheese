// Relationships — targets bizapps-common's Relationship/RelationshipType.
//
// Employment DERIVES from the world: every member with an employer gets an Employee
// relationship (their seeded type UUID, referenced not re-created), ENDED when the employer
// dissolved — Danielle's diagnosis gets a third witness. Story links are AUTHORED in the
// ruleset: Elena mentors Priya, the Kate/Kathy duplicate ground truth, and the 2023
// acquisition connecting Bob's employer to Victor's. Demo-owned types (Mentor, Duplicate Of)
// carry uuidFor-pinned IDs; bizapps-common's own seed types are never emitted by us.

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

  return { relationshipTypes, relationships };
}
