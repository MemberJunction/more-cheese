// MEMBERSHIP — the renewal engine. The most load-bearing file here: almost every other
// domain is downstream of who is a member and when.
//
// ─── THE SHAPE ─────────────────────────────────────────────────────────────────────────────
//   catalog   the tiers, the rules that assign them, and the passive cancellation reasons
//   params    the renewal rate and its band, grace period, dues target
//   effects   the five things that make one member likelier to renew than another
//   mixes     why people leave
//
// The effects here are the only ones in the system the COMPILER touches. Everywhere else an
// effect is read straight off the page; here they are solved together against the overall
// renewal target, so the population lands at that rate no matter how the individual effects
// are written. That is why their keys are also wired into three other places (the feature map
// and refinement step in hooks.mjs, and the narrative map in cli/explain.mjs) — renaming one
// means renaming it in all four.
//
// See datagen/CONTRACT.md. Values only — no clock, no randomness, no I/O, no functions.

export default {
  membership: {
    catalog: {
      // The four tiers and their dues. `dues` is read by the money chain, so changing one
      // changes every invoice at that tier for all thirteen years of history.
      tiers: [
        {
          name: "Enthusiast",
          dues: 150
        },
        {
          name: "Individual",
          dues: 175
        },
        {
          name: "SmallBusiness",
          dues: 400
        },
        {
          name: "Corporate",
          dues: 1000
        }
      ],
      // Ordered rules: the first one whose conditions match wins. A rule with no conditions is
      // the default, and there must be one.
      tierAssignment: [
        {
          value: "Enthusiast",
          when: {
            Segment: "Enthusiast"
          }
        },
        {
          value: "Corporate",
          when: {
            hasOrganization: true
          },
          whenAbove: {
            phi: 1.6
          }
        },
        {
          value: "SmallBusiness",
          when: {
            hasOrganization: true
          },
          whenAbove: {
            phi: 0.7
          }
        },
        {
          value: "Individual"
        }
      ],
      // What gets recorded when a member simply stops paying and never says why — which is
      // most of them.
      cancellationPassiveReasons: [
        "non-payment — lapsed past grace",
        "non-payment — employer event"
      ]
    },
    params: {
      // The headline number: the share of members due to renew who do. Enforced.
      // 
      // Everything else in this file bends around it. The effects below decide WHO renews;
      // this decides HOW MANY, and the compiler reconciles the two so both hold at once.
      renewal: {
        target: 0.87,
        tolerance: 0.02
      },
      // The range any single year is allowed to fall in. Wider than the tolerance on the
      // rate above, because one year is a small sample and real associations wobble.
      yearlyBand: [
        0.84,
        0.9
      ],
      // A FLOOR on year-to-year variation, not a ceiling. Without it the series came out
      // machine-smooth, which is the most obvious sign of generated data on any chart.
      yoyStdFloor: 0.008,
      // The enthusiast tier renews far worse than the rest. Enforced separately, because a
      // headline rate that is right on average can still hide a tier behaving impossibly.
      enthusiastRenewal: {
        target: 0.65,
        tolerance: 0.08
      },
      individualDuesTarget: 175,
      // How long after a period ends before a member counts as lapsed rather than late.
      gracePeriodMonths: 2,
      // Of those who do renew, the share who renew after their period already ended.
      lateRenewalShare: 0.25,
      cancellationToldUsShareOfActiveReasons: 0.35,
      // A [low, high] range: members who actively cancel give this much notice before their
      // period ends.
      cancellationNoticeDaysBeforeEnd: [
        15,
        120
      ]
    },
    effects: {
      // Long-standing members renew more. Per 1 SD of tenure at the moment of the decision.
      "renewal.tenure": {
        beta: 0.55,
        label: "med",
        note: "per 1 SD of tenure at decision"
      },
      // The strongest effect: keen members renew far more. This is the single most important
      // rule in the system — it is what makes engagement visible in the data at all.
      "renewal.engagement": {
        beta: 1.1,
        label: "strong",
        note: "latent theta; validated via behavioral proxy (attenuated)"
      },
      // Written in percentage points rather than the raw coefficient, and solved by the
      // compiler: members on auto-renew renew about 12 points better than those who renew
      // by hand.
      "renewal.autoRenew": {
        liftPts: 12,
        feature: {
          from: "self",
          field: "AutoRenew"
        },
        note: "HUMAN-AUTHORED FORM + DECLARED FEATURE: members on auto-renew renew about 12 points better — the compiler solves the β; the executor reads the feature from the declaration, not from code",
        evidence: "MGI: +10-15pt"
      },
      // NEGATIVE: members whose employer was acquired or closed in the decision year renew
      // much less. This is what makes the employer-collapse story visible.
      "renewal.employerEvent": {
        beta: -0.9,
        label: "med-strong",
        note: "arrow 1.15 — dissolution/acquisition in the decision year. BUILT-IN driver (computed: org lifecycle × decision-year window) — richer than feature grammar v1; migrates when the grammar earns cross-entity time windows"
      },
      // Also written as a plain statement of where the group lands: the enthusiast tier
      // renews at about 65%. Hobbyist churn is real.
      "renewal.enthusiastTier": {
        groupTarget: 0.65,
        share: 0.15,
        feature: {
          from: "self",
          where: {
            Segment: "Enthusiast"
          }
        },
        note: "HUMAN-AUTHORED FORM + DECLARED FEATURE: 'the enthusiast tier renews at about 65%' — compiler solves the β against the calibrated baseline; executor reads the Segment match from the declaration",
        evidence: "hobbyist churn is real (AHA analog); benchmarks renewal_rate_enthusiast_tier"
      }
    },
    mixes: {
      // Why members leave, weighted. Non-payment dominates — most people do not resign,
      // they just stop paying. (Was a pair-array; now an object map, the one form the format
      // uses.)
      churnReason: {
        "non-payment — lapsed past grace": 0.42,
        "cost — dues no longer justified": 0.16,
        "left the industry / changed employer": 0.14,
        "retired": 0.1,
        "consolidated under an organizational membership": 0.07,
        "dissatisfied with member benefits": 0.06,
        "relocated outside the region": 0.05
      }
    }
  },
};
