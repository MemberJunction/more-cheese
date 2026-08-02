// RELATIONSHIPS — the identity graph: who works where, and the authored story edges.
//
// ─── THE SHAPE ─────────────────────────────────────────────────────────────────────────────
//   catalog   the relationship types, and the hand-written edges
//   params    the two platform-seeded type IDs, and how many derived edges to make
//
// No effects or mixes.
//
// See datagen/CONTRACT.md. Values only — no clock, no randomness, no I/O, no functions.

export default {
  relationships: {
    catalog: {
      // Relationship types this project defines. Anything not listed here has to use a
      // platform-seeded type ID from params below.
      demoTypes: [
        {
          name: "Mentor",
          category: "PersonToPerson",
          forward: "mentors",
          reverse: "is mentored by",
          description: "Demo-owned type: structured mentorship pairs"
        },
        {
          name: "Duplicate Of",
          category: "PersonToPerson",
          forward: "is duplicate of",
          reverse: "has duplicate",
          description: "Demo-owned type: labeled ground truth for the dedup demo"
        },
        {
          name: "Referred By",
          category: "PersonToPerson",
          forward: "was referred by",
          reverse: "referred",
          description: "Demo-owned type: member-get-a-member referrals — a real acquisition channel, and the edge a retention team wants to see"
        },
        {
          name: "Supplier Of",
          category: "OrganizationToOrganization",
          forward: "supplies",
          reverse: "is supplied by",
          description: "Demo-owned type: trade relationships between supplier organizations and the creameries they serve"
        }
      ],
      // Hand-written edges a demo script relies on. Never drawn.
      authored: [
        {
          type: "Mentor",
          from: "ICF-000101",
          to: "ICF-000104",
          start: "2025-07-16",
          note: "met at the 2025 conference affinage workshop (persona pin)"
        },
        {
          type: "Duplicate Of",
          from: "ICF-000287",
          to: "ICF-000111",
          note: "org-portal registration minted a second record under the work email"
        },
        {
          type: "Subsidiary",
          fromOrgOf: "ICF-000105",
          toOrgOf: "ICF-000114",
          start: "2023-01-01",
          note: "the 2023 acquisition — connects Bob's employer to Victor's"
        }
      ]
    },
    params: {
      // IDs of relationship types MJ itself ships — referenced here, never created here.
      seededTypeIDs: {
        Employee: "27CFD031-5663-4000-A7AB-8AC87DB88C1D",
        Subsidiary: "39373681-5C70-4845-896B-4BFE4343751F"
      },
      // Share of joiners who arrived through an existing member.
      referralShareOfJoiners: 0.18,
      supplierEdgesPerSupplier: {
        min: 1,
        max: 5
      }
    }
  },
};
