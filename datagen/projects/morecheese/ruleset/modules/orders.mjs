// ORDERS — the money chain: what is for sale, what it costs, and how and when it gets paid.
//
// ─── THE SHAPE ─────────────────────────────────────────────────────────────────────────────
//   catalog   the product list, and the four named ways an invoice gets paid
//   params    prices, inflation, and how often each optional purchase happens
//
// No effects and no mixes. Nothing here differs by how keen a member is — an invoice is an
// invoice — and the payment method is chosen by which profile applies, not by a weighted draw.
//
// A note on `catalog`: it holds the payment profiles even though they are a keyed map rather
// than a list. Catalog means "things that exist and get referred to by name", and a profile is
// looked up by name exactly like a product is.
//
// See datagen/CONTRACT.md. Values only — no clock, no randomness, no I/O, no functions.

export default {
  orders: {
    catalog: {
      // Everything that can be bought, beyond membership dues itself.
      products: [
        {
          key: "PROD-CERT-EXAM",
          name: "Certification exam fee",
          type: "Certification",
          price: 425
        },
        {
          key: "PROD-CERT-RECERT",
          name: "Recertification fee",
          type: "Certification",
          price: 195
        },
        {
          key: "PROD-COMP-ENTRY",
          name: "Competition entry (per cheese)",
          type: "Competition",
          price: 65
        },
        {
          key: "PROD-PUB-JOURNAL",
          name: "Journal of Artisan Cheese (annual)",
          type: "Publication",
          price: 85
        },
        {
          key: "PROD-PUB-STANDARDS",
          name: "Standards handbook",
          type: "Publication",
          price: 140
        },
        {
          key: "PROD-SPON-EXPO",
          name: "Conference exhibitor booth",
          type: "Sponsorship",
          price: 2400
        },
        {
          key: "PROD-JOB-POST",
          name: "Job board posting (30 days)",
          type: "JobPosting",
          price: 250
        },
        {
          key: "PROD-MERCH-APRON",
          name: "Federation apron",
          type: "Merchandise",
          price: 38
        },
        {
          key: "PROD-MERCH-BOOK",
          name: "Cheese atlas",
          type: "Merchandise",
          price: 52
        },
        {
          key: "PROD-DONATION",
          name: "Education fund donation",
          type: "Donation",
          price: 100
        }
      ],
      // HOW an invoice gets paid, and WHEN relative to its due date. Four named profiles;
      // which one applies is decided by the generator, not drawn.
      // 
      // Each declares a method (or several to pick between), the share that are paid late,
      // and a distribution for the day offset in each case. The draw order inside a profile
      // is part of the reproducibility contract: method first (only when several are
      // offered), then the late/on-time coin, then the offset. Reordering them re-rolls every
      // payment in thirteen years of history.
      // 
      // The realism lives here. Net-terms invoices go out to organisations and are late
      // nearly half the time, by a lognormal tail — a few very late, most only a little.
      // Autopay is almost never late. Card checkout is never late at all, because the
      // transaction IS the payment.
      paymentProfiles: {
        netTerms: {
          appliesToTiers: [
            "SmallBusiness",
            "Corporate"
          ],
          termsDays: 30,
          methods: [
            "ACH",
            "Check",
            "Wire"
          ],
          lateShare: 0.45,
          late: {
            dist: "lognormalDays",
            medianDays: 12,
            sigma: 0.85,
            minDays: 1,
            capDays: 60
          },
          onTime: {
            dist: "uniformDays",
            min: 0,
            max: 5,
            sign: -1
          }
        },
        autopay: {
          method: "CreditCard",
          lateShare: 0.03,
          late: {
            dist: "uniformDays",
            min: 3,
            max: 14
          },
          onTime: {
            dist: "const",
            days: 0
          }
        },
        manual: {
          methods: [
            "CreditCard",
            "CreditCard",
            "Check"
          ],
          lateShare: 0.25,
          late: {
            dist: "uniformDays",
            min: 1,
            max: 60
          },
          onTime: {
            dist: "uniformDays",
            min: 0,
            max: 45,
            sign: -1
          }
        },
        checkout: {
          method: "CreditCard",
          lateShare: 0,
          onTime: {
            dist: "const",
            days: 0
          }
        }
      }
    },
    params: {
      eventPrices: {
        Conference: 450,
        Workshop: 150
      },
      // How far before a period starts the renewal invoice is raised.
      renewalBilledDaysAhead: 30,
      // Prices drift upward year on year. Without this, a thirteen-year price history is a
      // flat line, which no finance person believes.
      annualInflation: 0.027,
      // How often the optional purchases actually happen: exam and recertification fees,
      // competition entry fees, conference merchandise, journal subscriptions, donations.
      // Each is a share of the eligible population, not a count.
      certificationExamShare: 1,
      certificationRecertShare: 0.8,
      competitionFeeShare: 1,
      addOnConferenceMerchShare: 0.22,
      addOnJournalShare: 0.12,
      addOnDonationShare: 0.05,
      // Of the people who paid for an event and did not attend, the share who successfully
      // claim a refund. The rest are simply out of pocket, which is also realistic.
      refundShareOfPaidNoShows: 0.35,
      // Payments do not all succeed. A baseline share fail at random; less affluent members
      // fail more often (the bonus and the cut below define who counts as less affluent);
      // some failures become outright denials rather than retries.
      paymentNoiseFailShare: 0.015,
      paymentLowPhiFailBonus: 0.05,
      paymentLowPhiCut: -0.8,
      paymentDeniedShareOfFailed: 0.3,
      // A failed payment is retried within this many days.
      paymentRetryDaysMax: 6,
      paymentInProgressWindowDays: 3,
      // VALIDATOR-ONLY thresholds. Nothing generates from these three — they are the bands
      // the checks hold the generated payment behaviour to, kept next to the numbers they
      // check rather than buried in the validator.
      gateNetTermsLate: {
        target: 0.45,
        tolerance: 0.1,
        se: 1.5, // as the bespoke gate had it: tolerance + 1.5×SE over the paid net-terms orders
      },
      gateManualLate: {
        target: 0.25,
        tolerance: 0.1,
        se: 1.5,
      },
      gateAutopayOnDueMin: 0.9
    }
  },
};
