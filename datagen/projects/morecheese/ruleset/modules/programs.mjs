// PROGRAMS — the three things a member can earn or take part in:
// certifications, the annual cheese competition, and advocacy actions.
//
// ─── THE SHAPE ─────────────────────────────────────────────────────────────────────────────
//   catalog   the credential list, the competition categories and product forms, advocacy topics
//   params    the rates, two of them enforced
//   effects   keen members do more of all three
//   mixes     what medal an entry wins, and which kind of advocacy action
//
// Three sub-domains share one block, so names carry their domain as a prefix
// (certificationAwardShare, competitionMaxPerYear, advocacyDispersionK). That is deliberate:
// one flat params list you can read in one go beats three nested groups you have to open.
//
// See datagen/CONTRACT.md. Values only — no clock, no randomness, no I/O, no functions.

export default {
  programs: {
    catalog: {
      // The credential ladder. `weight` decides how likely each is to be pursued;
      // `prerequisite` (where present) must name another key in this same list.
      certifications: [
        {
          key: "CERT-FOUNDATION",
          name: "Cheese Foundations Certificate",
          level: 1,
          track: "craft",
          validYears: 5,
          weight: 0.3,
          description: "Entry-level credential covering milk handling, basic make procedures, hygiene and cheese styles. No prerequisite; the usual first step into the federation's credential ladder."
        },
        {
          key: "CERT-FOODSAFETY",
          name: "Food Safety & HACCP Certificate",
          level: 1,
          track: "safety",
          validYears: 2,
          weight: 0.22,
          description: "Hazard analysis, environmental monitoring and recall readiness for small and mid-sized creameries. Shortest validity in the programme: food-safety practice moves, so holders recertify every two years."
        },
        {
          key: "CERT-MONGER",
          name: "Certified Cheesemonger",
          level: 1,
          track: "business",
          validYears: 4,
          weight: 0.14,
          description: "Counter-side credential: cut and wrap, storage and rotation, customer guidance, and building a balanced case. Popular with retail members."
        },
        {
          key: "CERT-CCP",
          name: "Certified Cheese Professional (CCP)",
          level: 2,
          track: "craft",
          validYears: 3,
          weight: 0.16,
          prerequisite: "CERT-FOUNDATION",
          description: "The federation's flagship professional credential. Requires documented working hours and a foundation certificate, and covers make procedures, affinage, safety and business practice end to end."
        },
        {
          key: "CERT-SENSORY",
          name: "Sensory Evaluation Certificate",
          level: 2,
          track: "sensory",
          validYears: 3,
          weight: 0.1,
          description: "Structured tasting, defect identification and scoring against style standards. The usual route onto a competition judging panel."
        },
        {
          key: "CERT-AFFINAGE",
          name: "Advanced Affinage Certificate",
          level: 3,
          track: "affinage",
          validYears: 3,
          weight: 0.05,
          prerequisite: "CERT-CCP",
          description: "Advanced maturation practice: rind management, cave environment control and maturation planning across styles. Open to CCP holders."
        },
        {
          key: "CERT-JUDGE",
          name: "Competition Judge Accreditation",
          level: 3,
          track: "sensory",
          validYears: 2,
          weight: 0.03,
          prerequisite: "CERT-SENSORY",
          description: "Accreditation to judge federation competitions. Requires the sensory certificate plus supervised panel experience, and lapses quickly without active judging."
        }
      ],
      competitionCategories: [
        "Alpine Styles",
        "Soft-Ripened",
        "Blue Veined",
        "Fresh & Pasta Filata",
        "Washed Rind",
        "Aged Cheddar & Territorials"
      ],
      competitionProductForms: [
        "{t} Reserve",
        "{t} Tomme",
        "{t} Blue",
        "{t} Wheel",
        "Old {t}",
        "{t} Clothbound"
      ],
      advocacyTopics: [
        "Raw-milk aging rules",
        "FSMA small-producer exemptions",
        "Interstate cheese shipment",
        "Labeling standards",
        "Dairy pricing reform"
      ]
    },
    params: {
      // Share of course-completers who go on to pursue a credential. Enforced.
      // (Was `pursuitShareOfCompleters` with a loose `tolerance` beside it.)
      certificationPursuit: {
        target: 0.1,
        tolerance: 0.03
      },
      // Of those who pursue one, the share who are awarded it. The rest are still in progress.
      certificationAwardShare: 0.75,
      // Prose, not a rule the code reads — it records WHY the eligibility filter in the
      // generator looks the way it does.
      competitionEligibility: "producer members with an organization (org membership is the gate — Henri's join trigger)",
      competitionEntryRatePerYear: 0.12,
      competitionMaxPerYear: 3,
      // Share of members who take any advocacy action at all. Enforced — and low on purpose:
      // advocacy is the most self-selecting thing here.
      advocateShare: {
        target: 0.05,
        tolerance: 0.02
      },
      advocacyActionsPerYearMean: 2.2,
      advocacyDispersionK: 1.4
    },
    effects: {
      // Keen members pursue credentials more.
      "certification.engagement": {
        beta: 0.7,
        label: "med",
        note: "per 1 SD of latent engagement: engaged members pursue formal credentials more. Deliberately weaker than the renewal arrow (1.10) — certification costs money and study time, so enthusiasm converts to enrolment less readily than to a renewal click",
        evidence: "ESTIMATE — no benchmark for credential uptake by engagement; magnitude chosen to sit below the renewal arrow"
      },
      // And they are even likelier to take advocacy action — the strongest of the two,
      // because writing to a legislator costs more than sitting an exam.
      "advocacy.engagement": {
        beta: 0.8,
        label: "med-strong",
        note: "per 1 SD of latent engagement: advocacy is the most self-selecting activity in the association — writing to a legislator or testifying costs time and carries personal risk, so it concentrates among the already-committed harder than certification does",
        evidence: "ESTIMATE — chosen above the certification arrow (0.7) to encode that ordering; no external benchmark"
      }
    },
    mixes: {
      // Most entries win nothing. Weighted so Gold stays rare enough to mean something.
      medal: {
        Gold: 0.05,
        Silver: 0.1,
        Bronze: 0.15,
        None: 0.7
      },
      // Signing a petition is easy and common; testifying is hard and rare.
      advocacyKind: {
        LetterCampaign: 0.45,
        PetitionSignature: 0.35,
        CoalitionMeeting: 0.15,
        Testimony: 0.05
      }
    }
  },
};
