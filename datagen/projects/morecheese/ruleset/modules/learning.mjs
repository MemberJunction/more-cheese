// LEARNING — courses, who enrols, and who finishes.
//
// ─── THE SHAPE ─────────────────────────────────────────────────────────────────────────────
//   catalog   the course tracks and the topic bank
//   params    how many courses a year, and the two rates that are enforced
//   effects   keen members enrol more, and finish more of what they start
//
// See datagen/CONTRACT.md. Values only — no clock, no randomness, no I/O, no functions.

export default {
  learning: {
    catalog: {
      // The six course tracks. Every topic belongs to one.
      tracks: [
        {
          key: "craft",
          name: "Cheesemaking Craft"
        },
        {
          key: "affinage",
          name: "Affinage & Maturation"
        },
        {
          key: "safety",
          name: "Food Safety & Compliance"
        },
        {
          key: "sensory",
          name: "Sensory & Evaluation"
        },
        {
          key: "business",
          name: "Retail & Business"
        },
        {
          key: "science",
          name: "Dairy Science"
        }
      ],
      // Thirty-eight course titles. Enough that a year of courses does not repeat.
      topics: [
        {
          name: "Affinage Fundamentals",
          track: "affinage"
        },
        {
          name: "Cave Management",
          track: "affinage"
        },
        {
          name: "Rind Development & Washing",
          track: "affinage"
        },
        {
          name: "Humidity & Airflow Control",
          track: "affinage"
        },
        {
          name: "Maturation Planning for Small Rooms",
          track: "affinage"
        },
        {
          name: "Cheese Chemistry",
          track: "science"
        },
        {
          name: "Dairy Microbiology",
          track: "science"
        },
        {
          name: "Starter Cultures & Coagulants",
          track: "science"
        },
        {
          name: "Milk Quality & Herd Health",
          track: "science"
        },
        {
          name: "pH, Moisture & Make-Sheet Fundamentals",
          track: "science"
        },
        {
          name: "Raw Milk Practices",
          track: "craft"
        },
        {
          name: "Pasta Filata Techniques",
          track: "craft"
        },
        {
          name: "Bloomy Rind Production",
          track: "craft"
        },
        {
          name: "Blue Cheese Production",
          track: "craft"
        },
        {
          name: "Alpine & Cooked-Curd Styles",
          track: "craft"
        },
        {
          name: "Fresh & Lactic Cheeses",
          track: "craft"
        },
        {
          name: "Washed-Curd & Dutch Styles",
          track: "craft"
        },
        {
          name: "Goat & Sheep Milk Cheesemaking",
          track: "craft"
        },
        {
          name: "Cheddaring & Territorial Styles",
          track: "craft"
        },
        {
          name: "Food Safety & HACCP",
          track: "safety"
        },
        {
          name: "Environmental Monitoring Programmes",
          track: "safety"
        },
        {
          name: "Listeria Control in Small Creameries",
          track: "safety"
        },
        {
          name: "Labelling Law & Compliance",
          track: "safety"
        },
        {
          name: "Allergen Management",
          track: "safety"
        },
        {
          name: "Export Documentation Essentials",
          track: "safety"
        },
        {
          name: "Sensory Foundations",
          track: "sensory"
        },
        {
          name: "Advanced Sensory Evaluation",
          track: "sensory"
        },
        {
          name: "Defect Identification & Diagnosis",
          track: "sensory"
        },
        {
          name: "Building a Tasting Vocabulary",
          track: "sensory"
        },
        {
          name: "Judging & Competition Preparation",
          track: "sensory"
        },
        {
          name: "Counter Culture: Retailing",
          track: "business"
        },
        {
          name: "Cut & Wrap Fundamentals",
          track: "business"
        },
        {
          name: "Building a Cheese Counter",
          track: "business"
        },
        {
          name: "Pricing & Margin for Specialty Cheese",
          track: "business"
        },
        {
          name: "Wholesale & Distribution Basics",
          track: "business"
        },
        {
          name: "Direct-to-Consumer & Farmers' Markets",
          track: "business"
        },
        {
          name: "Costing a Make: From Milk to Margin",
          track: "business"
        },
        {
          name: "Storytelling & Provenance in Marketing",
          track: "business"
        }
      ]
    },
    params: {
      coursesPerYear: 8,
      // Share of members who take at least one course. Enforced.
      // (Was called `participation`, which said nothing about who or what.)
      enrollment: {
        target: 0.5,
        tolerance: 0.06
      },
      // Share of enrolments that reach completion. Enforced. Measured over people who
      // actually enrolled — a self-selected group, so this is higher than it would be
      // across the whole membership.
      completion: {
        target: 0.72,
        tolerance: 0.06
      },
      extraEnrollmentShare: 0.35
    },
    effects: {
      // Keen members enrol more.
      "enroll.engagement": {
        beta: 0.6,
        label: "med",
        note: "engaged members take courses"
      },
      // And they finish more of what they start — slightly weaker, because finishing is
      // mostly about time, not enthusiasm.
      "completion.engagement": {
        beta: 0.55,
        label: "med",
        note: "disengaged learners stall (causal map 3.4, softened: completion is less θ-driven than enrollment)"
      }
    }
  },
};
