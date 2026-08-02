// SONAR — the engagement scoring model: its factors, weights, bands and time windows.
//
// Definitions only. Sonar computes the actual scores itself from this; nothing here
// generates a score.
//
// ─── THE SHAPE ─────────────────────────────────────────────────────────────────────────────
//   catalog   the score bands, the time windows, and the ten factors
//   params    the model record itself
//
// The model is a single authored record rather than a list, so it sits in params as one
// group. Catalog holds lists.
//
// See datagen/CONTRACT.md. Values only — no clock, no randomness, no I/O, no functions.

export default {
  sonar: {
    catalog: {
      // Score ranges and what each one is called, with a severity and colour for the UI.
      bands: [
        {
          key: "at-risk",
          label: "At Risk",
          min: 0,
          max: 22,
          severity: 3,
          color: "#D9534F",
          description: "Disengaged — renewal is in doubt without intervention."
        },
        {
          key: "watch",
          label: "Watch",
          min: 22,
          max: 33,
          severity: 2,
          color: "#F0AD4E",
          description: "Below-average engagement — worth a touchpoint."
        },
        {
          key: "stable",
          label: "Stable",
          min: 33,
          max: 46,
          severity: 1,
          color: "#5BC0DE",
          description: "Healthy, steady participation."
        },
        {
          key: "engaged",
          label: "Engaged",
          min: 46,
          max: 100,
          severity: 0,
          color: "#5CB85C",
          description: "Highly engaged — advocates and volunteers live here."
        }
      ],
      // The periods factors are measured over.
      timeWindows: [
        {
          key: "w12m",
          name: "Trailing 12 Months (MoreCheese)",
          windowType: "Rolling",
          lengthMonths: 12
        },
        {
          key: "w24m",
          name: "Trailing 24 Months (MoreCheese)",
          windowType: "Rolling",
          lengthMonths: 24
        }
      ],
      // The ten inputs to the score. `weight` is a fraction of the whole and they must sum
      // to 1 — there is a check for exactly that.
      factors: [
        {
          key: "event-attendance",
          name: "Event Participation",
          slug: "morecheese-event-participation",
          description: "Events the member registered for in the last 12 months.",
          sourceEntityName: "MoreCheese: Event Registrations",
          alias: "registrations",
          aggregation: "Count",
          dateField: "RegisteredOn",
          windowKey: "w12m",
          weight: 0.18,
          displayLabel: "Event participation (12m)"
        },
        {
          key: "committee-service",
          name: "Committee Service",
          slug: "morecheese-committee-service",
          description: "Committee memberships the member holds.",
          sourceEntityName: "Committees: Memberships",
          alias: "committees",
          aggregation: "Count",
          weight: 0.056,
          displayLabel: "Committee service"
        },
        {
          key: "certifications",
          name: "Certifications",
          slug: "morecheese-certifications",
          description: "Certifications the member has pursued or earned.",
          sourceEntityName: "MoreCheese: Member Certifications",
          alias: "certifications",
          aggregation: "Count",
          weight: 0.056,
          displayLabel: "Certifications"
        },
        {
          key: "learning-activity",
          name: "Learning Activity",
          slug: "morecheese-learning-activity",
          description: "Courses the member enrolled in over the last 12 months.",
          sourceEntityName: "MoreCheese: Course Enrollments",
          alias: "enrollments",
          aggregation: "Count",
          dateField: "EnrolledOn",
          windowKey: "w12m",
          weight: 0.12,
          displayLabel: "Learning activity (12m)"
        },
        {
          key: "advocacy-participation",
          name: "Advocacy Participation",
          slug: "morecheese-advocacy-participation",
          description: "Advocacy actions the member took over the last 24 months.",
          sourceEntityName: "MoreCheese: Advocacy Actions",
          alias: "advocacy",
          aggregation: "Count",
          dateField: "ActionDate",
          windowKey: "w24m",
          weight: 0.056,
          displayLabel: "Advocacy (24m)"
        },
        {
          key: "competition-entries",
          name: "Competition Entries",
          slug: "morecheese-competition-entries",
          description: "Cheese competition entries the member has submitted.",
          sourceEntityName: "MoreCheese: Competition Entries",
          alias: "competitions",
          aggregation: "Count",
          weight: 0.056,
          displayLabel: "Competition entries"
        },
        {
          key: "event-recency",
          name: "Event Recency",
          slug: "morecheese-event-recency",
          description: "How recently the member last attended an event (sooner is better).",
          sourceEntityName: "MoreCheese: Event Registrations",
          alias: "recentEvents",
          aggregation: "Recency",
          aggregateFieldName: "RegisteredOn",
          higherIsBetter: false,
          weight: 0.12,
          displayLabel: "Event recency"
        },
        {
          key: "survey-participation",
          name: "Survey Participation",
          slug: "morecheese-survey-participation",
          description: "Surveys the member responded to over the last 24 months.",
          sourceEntityName: "MJ_BizApps_Forms: Form Responses",
          alias: "surveyResponses",
          aggregation: "Count",
          dateField: "SubmittedAt",
          windowKey: "w24m",
          weight: 0.056,
          displayLabel: "Survey participation (24m)"
        },
        {
          key: "member-spend",
          name: "Member Spend",
          slug: "morecheese-member-spend",
          description: "Total billed value of everything the member has ordered in the trailing 24 months — dues, events, credentials, publications and merchandise.",
          sourceEntityName: "MoreCheese: Orders",
          alias: "orders",
          relationshipPath: "Person → Order.PersonID",
          aggregation: "Sum",
          aggregateFieldName: "TotalGross",
          windowKey: "w24m",
          windowMonths: 24,
          weight: 0.18,
          displayLabel: "Spend (24m)"
        },
        {
          key: "tenure",
          name: "Membership Tenure",
          slug: "morecheese-tenure",
          description: "How long the member has belonged to the federation. Recency of the join date, inverted — an older join means longer tenure and a stronger relationship.",
          sourceEntityName: "MoreCheese: Member Profiles",
          alias: "profile",
          relationshipPath: "Person → MemberProfile.PersonID",
          aggregation: "Recency",
          aggregateFieldName: "JoinDate",
          higherIsBetter: false,
          weight: 0.12,
          displayLabel: "Tenure"
        }
      ]
    },
    params: {
      // The model record: its name, what it attaches to, who owns it, and when it was
      // created and published (both counted backwards from the release date, never from
      // today).
      model: {
        key: "morecheese-engagement",
        name: "Member Engagement Score",
        slug: "morecheese-engagement",
        description: "Composite engagement score for federation members — breadth, recency, and depth of participation across events, governance, learning, advocacy, surveys, certifications, and competitions. The retention early-warning dial, computed live by Sonar.",
        anchorEntityName: "MJ_BizApps_Common: People",
        status: "Active",
        ownerStaffKey: "ops-analyst",
        createdDaysBeforeRelease: 300,
        publishedDaysBeforeRelease: 280
      }
    }
  },
};
