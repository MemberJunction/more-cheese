// FORMS — the post-conference survey, and the public membership application.
//
// This file does NOT use the four-part shape, deliberately. A form is one coherent thing: its
// name, its page, its questions, how it is distributed, and how many responses come in. Splitting
// that across catalog / params / effects would scatter one object across three sections and make
// it harder to read, not easier. The shape is a tool, not a rule to obey when it does not help.
//
// So the arrangement here is by FORM, then by what happens to it:
//   survey        the member survey sent after each conference
//   application   the public intake form — the anonymous story
//   response      who responds at all
//   answers       what they say, when they do
//
// See datagen/CONTRACT.md. Values only — no clock, no randomness, no I/O, no functions.

export default {
  forms: {
    // Sent to members after each conference. One distribution per conference year, open for
    // a month.
    survey: {
      name: "Post-Conference Attendee Survey",
      description: "Sent to all attendees the day after the ICF Annual Conference closes.",
      page: "Your conference experience",
      questions: [
        {
          key: "nps",
          type: "NPS",
          prompt: "How likely are you to recommend the ICF Annual Conference to a colleague?",
          required: true
        },
        {
          key: "overall",
          type: "Rating",
          prompt: "How would you rate your overall conference experience?",
          required: true
        },
        {
          key: "returning",
          type: "YesNo",
          prompt: "Do you plan to attend next year's conference?",
          required: false
        }
      ],
      distribution: {
        channel: "Email",
        opensDaysAfter: 1,
        closesDaysAfter: 31
      }
    },
    // The ANONYMOUS story, and the flagship feature of the forms app: applicants are NOT
    // members yet. Responses carry no member number and an anonymous session id instead;
    // the applicant's identity exists only inside the answer text, and no person rows are
    // created for them. One open public-link distribution rather than one per year.
    application: {
      name: "Membership Application",
      description: "Public intake form on the ICF website — prospective members apply here.",
      page: "Tell us about yourself",
      questions: [
        {
          key: "name",
          type: "ShortText",
          prompt: "Your full name",
          required: true
        },
        {
          key: "email",
          type: "Email",
          prompt: "Email address",
          required: true
        },
        {
          key: "segment",
          type: "SingleChoice",
          prompt: "Which best describes you?",
          required: true,
          options: [
            "Producer",
            "Retailer",
            "Supplier",
            "Educator",
            "Enthusiast"
          ]
        },
        {
          key: "operation",
          type: "LongText",
          prompt: "Tell us about your operation or interest in cheese",
          required: false
        },
        {
          key: "newsletter",
          type: "YesNo",
          prompt: "Subscribe to the ICF newsletter?",
          required: false
        }
      ],
      distribution: {
        channel: "PublicLink",
        sinceYearsBeforeRelease: 3
      },
      // A modest public-intake trickle. ESTIMATE. Partials run higher than on the member
      // survey, because anonymous funnels leak more.
      volume: {
        perYearMin: 20,
        perYearMax: 40,
        // Share of responses that start and never submit — first answer only. Real funnels leak.
        partialShare: 0.15
      },
      segmentMix: [
        [
          "Producer",
          0.35
        ],
        [
          "Retailer",
          0.25
        ],
        [
          "Enthusiast",
          0.22
        ],
        [
          "Supplier",
          0.1
        ],
        [
          "Educator",
          0.08
        ]
      ],
      operationTemplates: [
        "Small {segment} operation in {toponym}; looking to connect with the wider community.",
        "Family-run for two generations — hoping the federation can help us with food-safety guidance.",
        "Just getting started as a {segment} and want access to the courses and the annual conference.",
        "We run a farmers-market stall and are exploring wholesale; joining for the standards resources.",
        "Longtime home cheesemaker turning professional; interested in certification down the road."
      ],
      referrers: [
        "icf-website",
        "search",
        "conference-page",
        "newsletter",
        "member-referral"
      ]
    },
    // SOURCED 2026-07-16, medium confidence: industry surveys put conference response at
    // 10-20%, with 20-30% typical across the event industry and 30-40% aspirational for
    // paid conferences.
    response: {
      rateTarget: 0.28,
      tolerance: 0.08,
      // How long after receiving it a member may take to respond.
      submitDelayDaysMax: 14,
      arrows: {
        engagement: {
          beta: 0.7,
          label: "med",
          note: "engaged attendees answer surveys"
        }
      },
      partialShare: 0.08
    },
    // Satisfaction rides the SAME hidden keenness dial as renewal. That is the point: the
    // correlation between satisfaction and retention EMERGES from a shared cause, rather
    // than being painted on afterwards. Anyone analysing the data finds a real relationship.
    answers: {
      // The 0-10 recommend score. SOURCED 2026-07-16, high confidence: benchmarks across
      // thousands of events put conference-attendee NPS around +35.
      nps: {
        base: 8.3,
        engagementBeta: 1.3,
        noiseSd: 1.4,
        min: 0,
        max: 10,
        meanTolerance: 0.5,
        // A gaussian around 8.3 never produces a 0-2, so the canonical build had ZERO scores
        // below 3 across 648 responses — the detractor tail every real survey carries was simply
        // missing. A small share of respondents now answer from the bottom of the scale.
        detractorShare: 0.025
      },
      // The 1-5 satisfaction score.
      overall: {
        base: 3.9,
        engagementBeta: 0.5,
        noiseSd: 0.7,
        min: 1,
        max: 5
      },
      // Whether they say they will come back.
      returning: {
        baseLogit: 1.2,
        engagementBeta: 0.8
      }
    }
  }
};
