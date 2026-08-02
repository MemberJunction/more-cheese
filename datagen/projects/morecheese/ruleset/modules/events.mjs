// EVENTS — the annual conference, plus workshops and webinars through the year.
//
// ─── THE SHAPE ─────────────────────────────────────────────────────────────────────────────
//   catalog   the topic banks, and the cities the conference has been held in
//   params    how many of each event, and the attendance rates that are enforced
//   effects   who turns up more, and who fails to turn up after registering
//
// Two of the effects below used to be loose numbers among the settings — see the note on
// them. No mixes: event type is chosen by count, not by weighted draw.
//
// See datagen/CONTRACT.md. Values only — no clock, no randomness, no I/O, no functions.

export default {
  events: {
    catalog: {
      webinarTopics: [
        "Raw Milk Rules",
        "Cave Management",
        "Counter Culture",
        "Label Law",
        "Listeria Control",
        "Export Paperwork",
        "Starter Culture Basics",
        "Costing a Make",
        "Farmers' Market Sales",
        "Cut & Wrap Efficiency",
        "Whey Management",
        "Herd Health & Milk Quality",
        "Allergen Labelling",
        "Environmental Monitoring",
        "Judging Standards",
        "Cheese Photography",
        "Small-Room Affinage",
        "Cheese & Cider Pairing",
        "Wholesale Negotiation",
        "Packaging Sustainability",
        "Seasonal Milk Variation",
        "Recall Readiness",
        "Insurance for Creameries",
        "Farm Shop Design",
        "Digital Storefronts",
        "Apprenticeship Programmes",
        "Water Activity & Shelf Life",
        "Rennet Alternatives",
        "Regenerative Dairy",
        "Cheese Tourism"
      ],
      workshopSubjects: [
        "Affinage",
        "Food Safety",
        "Retailing",
        "Sensory",
        "Cheesemaking",
        "Blue Styles",
        "Alpine Styles",
        "Bloomy Rinds",
        "Pasta Filata",
        "Goat & Sheep Milk",
        "Cut & Wrap",
        "Cave Design",
        "Defect Diagnosis",
        "Competition Prep",
        "Costing",
        "Packaging",
        "Milk Handling",
        "Rind Washing",
        "Export Readiness",
        "Farm Shop Retail"
      ],
      // Where the conference has been held. Coordinates are real, so a map renders.
      conferenceCities: [
        {
          city: "Louisville",
          state: "KY",
          lat: 38.2527,
          lon: -85.7585
        },
        {
          city: "Des Moines",
          state: "IA",
          lat: 41.5868,
          lon: -93.625
        },
        {
          city: "Sacramento",
          state: "CA",
          lat: 38.5816,
          lon: -121.4944
        },
        {
          city: "Madison",
          state: "WI",
          lat: 43.0731,
          lon: -89.4012
        },
        {
          city: "Portland",
          state: "OR",
          lat: 45.5152,
          lon: -122.6784
        },
        {
          city: "Burlington",
          state: "VT",
          lat: 44.4759,
          lon: -73.2121
        },
        {
          city: "Asheville",
          state: "NC",
          lat: 35.5951,
          lon: -82.5515
        }
      ]
    },
    params: {
      // Workshops and webinars per year. The conference is once a year by definition.
      workshopsPerYear: 5,
      webinarsPerYear: 6,
      // Share of members who attend the annual conference. Enforced.
      // (Was `conference.memberAttendanceTarget` with a `tolerance` beside it.)
      conferenceAttendance: {
        target: 0.35,
        tolerance: 0.1
      },
      // Average event registrations per member per year.
      registrationsPerYear: 1.7,
      // How unevenly registrations spread. Low values mean a few people attend a great
      // deal and most attend almost nothing, which is how event attendance really looks.
      registrationDispersionK: 1.4,
      // Share of paid in-person registrations that do not turn up. Enforced.
      // `holdout: true` means this figure is hidden from anything that authors data, so it
      // stays an honest test rather than a target to hit.
      noShowPaidInPerson: {
        target: 0.08,
        tolerance: 0.04,
        holdout: true
      },
      // Free webinars are a different world: registering costs nothing, so most people who
      // register never appear. Enforced.
      noShowFreeWebinar: {
        target: 0.55,
        tolerance: 0.08
      }
    },
    effects: {
      "conferenceAttendance.engagement": {
        beta: 1,
        label: "strong",
        note: "engaged members show up (causal map 2.1); strong per the R7 attendance analysis"
      },
      "conferenceAttendance.international": {
        beta: -0.6,
        label: "med",
        note: "distance arrow 2.10, binary form"
      },
      // Keen members register for more events per year.
      // This was a bare `engagementBeta` sitting among the settings — a causal rule that no
      // check could see, because nothing marked it as one. Value unchanged.
      "registrations.engagement": {
        beta: 0.6,
        label: "med",
        note: "per 1 SD of latent engagement: keen members register for more events per year. Was authored as a bare engagementBeta sitting among the settings, where no check could recognise it as a causal rule; the value is unchanged.",
        evidence: "ESTIMATE — no benchmark for registrations-per-member by engagement"
      },
      // Keen members are less likely to no-show after registering (hence negative).
      // Also previously a bare number among the settings. Value unchanged.
      "noShow.engagement": {
        beta: -0.4,
        label: "med",
        note: "per 1 SD of latent engagement, and NEGATIVE: keen members are less likely to no-show once registered. Same history as the registration effect — previously a bare number among the settings. Value unchanged.",
        evidence: "ESTIMATE — the no-show rates themselves are authored per channel; this spread within them is not"
      }
    }
  },
};
