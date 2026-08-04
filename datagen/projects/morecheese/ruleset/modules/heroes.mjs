// HEROES — the pinned people. Facts, not draws.
//
// Everything in here survives every dice roll: a hero's tier, join date, employer, keenness and
// renewal outcomes are AUTHORED, so a demo script can say their story out loud and it stays true
// at any seed and any scale. `pins` are the promises a checker enforces on their generated data.
//
// This file does NOT use the four-part shape. It is one list of people — there is nothing to put
// in three of the four sections.
//
// APPEND-ONLY. Position is load-bearing: heroes overwrite crowd slots by index, so inserting or
// reordering rewrites unrelated people and re-rolls their entire histories. Add at the end.
//
// Each person below opens with what they EXIST TO DEMONSTRATE. That is the reason they are here;
// if you cannot state it in a sentence, the persona is not pulling its weight.
//
// See datagen/CONTRACT.md. Values only — no clock, no randomness, no I/O, no functions.

/** @type {{ heroes: import('../../types.js').Hero[] }} */
export default {
  heroes: [
    // issuesNote: cross-app footprint (2026-07-21): flagship heroes each carry an authored issue + a
    // guaranteed survey response so a persona walks across every app. Tasks footprint deferred — Bob
    // pins Active (no outreach task possible), Tom has no committee.
    {
      memberNumber: "ICF-000101",
      first: "Elena",
      last: "Rodriguez",
      employerName: "Crowfeather Creamery",
      segment: "Producer",
      region: "NA",
      city: "Petaluma",
      state: "US-CA",
      lat: 38.2324,
      lon: -122.6367,
      joinDate: "2022-03-15",
      theta: 1.8,
      phi: 0.8,
      tier: "Individual",
      cycleType: "calendar",
      autoRenew: true,
      pins: {
        status: "Active",
        minRegistrationsPerYear: 2,
        committeeSeat: "Standards Committee",
        issueMin: 1,
        formResponse: true
      },
      issues: [
        {
          type: "Events",
          title: "Session recordings missing from attendee portal",
          daysBeforeRelease: 12
        }
      ],
      committees: [
        {
          committee: "Standards Committee",
          role: "Member",
          terms: [
            "2023–24 Term",
            "2025–26 Term"
          ]
        }
      ],
      title: "Head Cheesemaker"
    },

    // assumption: anniversary cohort with auto-renew OFF per D6 detail
    {
      memberNumber: "ICF-000102",
      first: "Marcus",
      last: "Chen",
      employerName: "Mongers' Row",
      segment: "Retailer",
      region: "NA",
      city: "Seattle",
      state: "US-WA",
      lat: 47.6062,
      lon: -122.3321,
      joinYearsAgo: 5,
      anniversaryOffsetDays: 21,
      theta: 0.3,
      phi: 0.2,
      tier: "Individual",
      cycleType: "anniversary",
      autoRenew: false,
      pins: {
        status: "PendingRenewal",
        endDateWithinDaysOfRelease: [
          14,
          28
        ]
      },
      title: "Specialty Cheese Buyer"
    },

    // the diagnosable lapse — employer folded, membership lapsed with her paycheck; prime win-back
    {
      memberNumber: "ICF-000103",
      first: "Danielle",
      last: "Okafor",
      employerName: "Mistlebrook Dairy",
      segment: "Producer",
      region: "NA",
      city: "Brattleboro",
      state: "US-VT",
      lat: 42.8509,
      lon: -72.5579,
      joinDate: "2024-03-20",
      theta: 0.2,
      phi: -0.8,
      tier: "Individual",
      cycleType: "anniversary",
      autoRenew: false,
      employerEvent: {
        year: 2025,
        kind: "Dissolved"
      },
      lapseYear: 2026,
      pins: {
        status: "Lapsed",
        employerDissolved: 2025,
        cancellationReasonContains: "employer"
      },
      title: "Assistant Cheesemaker"
    },

    // the rising star — career-changer apprentice, steepest positive engagement in her cohort
    {
      memberNumber: "ICF-000104",
      first: "Priya",
      last: "Natarajan",
      employerName: "Larkhollow Creamery",
      segment: "Producer",
      region: "NA",
      city: "Madison",
      state: "US-WI",
      lat: 43.0731,
      lon: -89.4012,
      joinDate: "2025-02-10",
      theta: 1.5,
      phi: -0.6,
      tier: "Individual",
      cycleType: "calendar",
      autoRenew: true,
      pins: {
        status: "Active"
      },
      title: "Affinage Apprentice"
    },

    // the churn save — joined at history start (draft says 2008; clamped to the simulation window);
    // employer acquired 2023, engagement declining 3 years; huge LTV, top-decile risk, still
    // renewing
    {
      memberNumber: "ICF-000105",
      first: "Bob",
      last: "Kowalski",
      employerName: "Ostergaard & Sons Dairy Supply",
      segment: "Supplier",
      region: "NA",
      city: "Chicago",
      state: "US-IL",
      lat: 41.8781,
      lon: -87.6298,
      joinDate: "2013-06-12",
      theta: 0.9,
      phi: 0.9,
      tier: "SmallBusiness",
      cycleType: "calendar",
      autoRenew: false,
      employerEvent: {
        year: 2023,
        kind: "Acquired"
      },
      thetaByYear: {
        "2023": 0.9,
        "2024": 0.4,
        "2025": -0.1,
        "2026": -0.4
      },
      pins: {
        status: "Active",
        employerAcquired: 2023,
        issueMin: 1,
        formResponse: true
      },
      issues: [
        {
          type: "Billing",
          title: "Invoice went to old Ostergaard AP contact after acquisition",
          daysBeforeRelease: 30
        }
      ],
      title: "Regional Sales Director"
    },

    // the international member — Jura affineur, flies over once a year; the distance arrows
    // personified
    {
      memberNumber: "ICF-000107",
      first: "Henri",
      last: "Dubois",
      employerName: "Fromagerie Saint-Rémille",
      segment: "Producer",
      region: "EU",
      city: "Poligny",
      state: "FR-39",
      lat: 46.8367,
      lon: 5.7075,
      joinDate: "2019-01-15",
      theta: 0.3,
      phi: 1.8,
      tier: "Corporate",
      cycleType: "calendar",
      autoRenew: true,
      pins: {
        status: "Active",
        tier: "Corporate",
        competitionGold: 2025
      },
      title: "Affineur & Owner",
      competition: {
        entriesPerYear: 8,
        pinnedResults: {
          "2025": "Gold"
        },
        category: "Alpine Styles",
        productName: "Saint-Rémille Réserve d'Alpage"
      }
    },

    // the dedup pair (original) — 2015 record on her personal email
    {
      memberNumber: "ICF-000111",
      first: "Kate",
      last: "O'Leary",
      employerName: "Orchardmere Cheese & Provisions",
      segment: "Retailer",
      region: "NA",
      city: "Madison",
      state: "US-WI",
      lat: 43.0731,
      lon: -89.4012,
      joinDate: "2015-04-22",
      theta: 0.5,
      phi: 0.4,
      tier: "Individual",
      cycleType: "calendar",
      autoRenew: true,
      pins: {
        status: "Active",
        duplicateOf: null
      },
      title: "Cheese Program Director"
    },

    // the dedup pair (duplicate) — minted 2023 when her assistant registered her via the org portal
    // on her work email; same employer, split history
    {
      memberNumber: "ICF-000287",
      first: "Kathy",
      last: "OLeary",
      employerName: "Orchardmere Cheese & Provisions",
      segment: "Retailer",
      region: "NA",
      city: "Madison",
      state: "US-WI",
      lat: 43.0731,
      lon: -89.4012,
      joinDate: "2023-06-05",
      theta: 0.5,
      phi: 0.4,
      tier: "Individual",
      cycleType: "calendar",
      autoRenew: false,
      pins: {
        status: "Active",
        duplicateOf: "ICF-000111"
      },
      title: "Cheese Program Director"
    },

    // engagement ≠ revenue — home-cheesemaking blogger, top-decile activity, lowest tier, no
    // employer org
    {
      memberNumber: "ICF-000113",
      first: "Jamie",
      last: "Fuller",
      employerName: null,
      segment: "Enthusiast",
      region: "NA",
      city: "Portland",
      state: "US-OR",
      lat: 45.5152,
      lon: -122.6784,
      joinDate: "2023-05-30",
      theta: 2,
      phi: -0.5,
      tier: "Enthusiast",
      cycleType: "calendar",
      autoRenew: true,
      pins: {
        status: "Active",
        tier: "Enthusiast"
      },
      title: null
    },

    // the auto-renewing ghost — employer-paid, near-zero engagement, unbroken renewals since 2017;
    // tests employer-paid + auto-renew as protective factors
    {
      memberNumber: "ICF-000114",
      first: "Victor",
      last: "Sandoval",
      employerName: "Reedmere Dairy Systems",
      segment: "Supplier",
      region: "NA",
      city: "Austin",
      state: "US-TX",
      lat: 30.2672,
      lon: -97.7431,
      joinDate: "2017-09-01",
      theta: -1.8,
      phi: 1.9,
      tier: "Corporate",
      cycleType: "calendar",
      autoRenew: true,
      pins: {
        status: "Active",
        tier: "Corporate"
      },
      title: "VP Procurement"
    },

    // the cold start — joined two weeks before release; models must score her on priors, not history
    {
      memberNumber: "ICF-000115",
      first: "Nia",
      last: "Thompson",
      employerName: "The Quiet Curd",
      segment: "Retailer",
      region: "NA",
      city: "Brooklyn",
      state: "US-NY",
      lat: 40.6782,
      lon: -73.9442,
      joinDaysBeforeRelease: 14,
      theta: 0.5,
      phi: -0.4,
      tier: "Individual",
      cycleType: "anniversary",
      autoRenew: false,
      pins: {
        status: "Active",
        joinedDaysBeforeRelease: 14
      },
      title: "Junior Cheesemonger"
    },

    // rest-of-world — Tasmanian sheep dairy; the RoW slice of the geography mix, given a face
    {
      memberNumber: "ICF-000116",
      first: "Charlie",
      last: "Mason",
      employerName: "Winterfen Dairy",
      segment: "Producer",
      region: "RoW",
      city: "Hobart",
      state: "AU-TAS",
      lat: -42.8821,
      lon: 147.3272,
      joinDate: "2021-08-19",
      theta: 0.3,
      phi: 0.5,
      tier: "SmallBusiness",
      cycleType: "calendar",
      autoRenew: true,
      pins: {
        status: "Active",
        tier: "SmallBusiness"
      },
      title: "Cheesemaker & Co-owner"
    },

    // the committee chair — solo food-safety consultant; the federation is her client pipeline;
    // chairs Food Safety (cleared via web search 2026-07-14: no real 'Whitfield Food Safety'
    // business)
    {
      memberNumber: "ICF-000108",
      first: "Gwen",
      last: "Whitfield",
      employerName: "Whitfield Food Safety Training",
      segment: "Educator",
      region: "NA",
      city: "Chicago",
      state: "US-IL",
      lat: 41.8781,
      lon: -87.6298,
      joinDate: "2014-02-10",
      theta: 1.6,
      phi: 0.3,
      tier: "Individual",
      cycleType: "calendar",
      autoRenew: true,
      committees: [
        {
          committee: "Food Safety Committee",
          role: "Member",
          terms: [
            "2023–24 Term"
          ]
        },
        {
          committee: "Food Safety Committee",
          role: "Chair",
          terms: [
            "2025–26 Term"
          ]
        }
      ],
      pins: {
        status: "Active",
        committeeSeat: "Food Safety Committee",
        committeeRole: "Chair",
        issueMin: 1,
        formResponse: true
      },
      issues: [
        {
          type: "Data Correction",
          title: "Food Safety Committee roster shows outdated affiliation",
          daysBeforeRelease: 18
        }
      ],
      title: "Principal"
    },

    // the certification journey — third-generation cheesemonger; the credential is her counter-move
    // to the chain store four blocks away
    //
    // certNote: The credential ladder gates CCP behind the foundation certificate, so Sofia holds
    // Foundation (awarded 2024) and is now working through CCP — which is the journey the persona is
    // for.
    {
      memberNumber: "ICF-000106",
      first: "Sofia",
      last: "Marchetti",
      employerName: "Marchetti's Salumeria & Formaggio",
      segment: "Retailer",
      region: "NA",
      city: "Brooklyn",
      state: "US-NY",
      lat: 40.6782,
      lon: -73.9442,
      joinDate: "2024-02-18",
      theta: 1.2,
      phi: 0.3,
      tier: "Individual",
      title: "Cheesemonger",
      cycleType: "calendar",
      autoRenew: true,
      certifications: [
        {
          key: "CERT-FOUNDATION",
          status: "Awarded",
          enrolledOn: "2024-02-12",
          awardedOn: "2024-08-20"
        },
        {
          key: "CERT-CCP",
          status: "InProgress",
          enrolledOn: "2025-09-15"
        }
      ],
      pins: {
        status: "Active",
        certStatus: "InProgress"
      }
    },

    // the advocacy champion — raw-milk farmstead owner; ALL his engagement is legislative (Sonar
    // component-breakdown demo). Theta pinned moderate so event/course activity stays low; his
    // advocacy volume is a DECLARED fact, not theta-driven. Employer renamed from the draft's 'Stone
    // Meadow Farmstead' for clearance (cleared toponym compose).
    {
      memberNumber: "ICF-000109",
      first: "Tom",
      last: "Reyes",
      employerName: "Speltmoor Farmstead",
      segment: "Producer",
      region: "NA",
      city: "Ithaca",
      state: "US-NY",
      lat: 42.444,
      lon: -76.5019,
      joinDate: "2016-05-09",
      theta: 0.1,
      phi: -0.2,
      tier: "Individual",
      title: "Owner",
      cycleType: "calendar",
      autoRenew: true,
      advocacy: {
        totalActions: 34,
        testimonies: 2,
        topic: "Raw-milk aging rules"
      },
      issues: [
        {
          type: "General",
          title: "How do I submit written testimony through the federation?",
          daysBeforeRelease: 45
        }
      ],
      pins: {
        status: "Active",
        advocacyMin: 30,
        testimonies: 2,
        issueMin: 1,
        formResponse: true
      }
    },

    // the stale record — changed employers ~8 months ago, never updated her profile; the record says
    // one org, the Relationship truth says another; the enrichment demo has a labeled right answer.
    // Employers are cleared composed names (draft's Curdwell/Golden Gate substituted).
    {
      memberNumber: "ICF-000110",
      first: "Aisha",
      last: "Bell",
      employerName: "Quincewick Creamery",
      segment: "Producer",
      region: "NA",
      city: "Petaluma",
      state: "US-CA",
      lat: 38.2324,
      lon: -122.6367,
      joinDate: "2018-04-12",
      theta: 0.4,
      phi: 0.3,
      tier: "Individual",
      title: "Quality Manager",
      cycleType: "calendar",
      autoRenew: true,
      staleEmployer: {
        trueEmployerName: "Fernholt Creamery",
        monthsAgo: 8
      },
      pins: {
        status: "Active",
        defect: "StaleEmployer"
      }
    },
  ],
};
