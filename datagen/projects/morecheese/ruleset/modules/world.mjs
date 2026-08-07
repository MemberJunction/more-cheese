// WORLD — the substrate every other domain sits on: the organisations members work for,
// where members are, how to contact them, the non-members the association knows about, and
// the pre-membership history of recent joiners.
//
// ─── THE SHAPE ─────────────────────────────────────────────────────────────────────────────
// FIVE blocks in one file, each with its own parts. Most need only params: this file is almost
// entirely rates, because the things themselves (people, organisations) are generated rather
// than authored.
//
//   orgs        params + mixes    how many employers, and how they are legally constituted
//   geography   mixes             where members are
//   contacts    params            how many members have a second phone, a LinkedIn, and so on
//   prospects   params            non-members the association has a record of
//   funnel      params            what happened before recent joiners joined
//
// The mixes here were pair-arrays ([["LLC", 0.33], …]) and are now object maps, which is the
// one form the format uses. Same values, same draw order, same output.
//
// See datagen/CONTRACT.md. Values only — no clock, no randomness, no I/O, no functions.

export default {
  orgs: {
    params: {
      // Organisations per member. Not one each — members share employers, which is what
      // makes an employer worth showing in the app.
      ratioToMembers: 0.25,
      // Of those organisations, the share that actually make cheese.
      producerShare: 0.45,
      // Chance per year that an organisation is acquired or closes. Feeds the renewal
      // effect: people whose employer folds are likelier to lapse.
      lifecycleEventRatePerYear: 0.02
    },
    mixes: {
      // Producers skew small and owner-run; suppliers skew incorporated. Each type gets its
      // own mix so a legal-structure column is not uniform noise.
      legalStructureProducer: {
        "Sole Proprietorship": 0.34,
        LLC: 0.33,
        Partnership: 0.18,
        Corporation: 0.15
      },
      legalStructureRetailer: {
        LLC: 0.42,
        Corporation: 0.3,
        "Sole Proprietorship": 0.28
      },
      legalStructureSupplier: {
        Corporation: 0.55,
        LLC: 0.35,
        Partnership: 0.1
      },
      legalStructureEducator: {
        "Educational Institution": 0.62,
        "Non-Profit": 0.26,
        Association: 0.12
      }
    }
  },
  geography: {
    mixes: {
      // Where members are. Drives cities, addresses, phone formats and conference travel.
      region: {
        NA: 0.6,
        EU: 0.25,
        RoW: 0.15
      }
    }
  },
  contacts: {
    params: {
      // Contact-method coverage. Deliberately partial — a database where everyone has every
      // contact method is the clearest sign of generated data.
      secondPhoneShare: 0.22,
      linkedInShare: 0.18,
      mobileFirstShare: 0.62,
      orgPhoneShare: 0.7
    }
  },
  prospects: {
    params: {
      ratioToMembers: 0.45,
      orgAffiliatedShare: 0.5,
      // How far back a prospect may first have been seen.
      firstSeenMaxDaysAgo: 1460,
      webinarsPerProspectMean: 2,
      dispersionK: 1.1,
      maxWebinarsPerProspect: 5,
      attendShare: 0.52
    }
  },
  funnel: {
    params: {
      lookbackYears: 4,
      // Share of recent joiners the association already had a record of before they joined.
      // This is what makes a conversion rate computable from the data instead of asserted.
      knownBeforeJoiningShare: 0.12,
      priorWindowDays: 540,
      maxPriorWebinars: 2,
      priorAttendShare: 0.68,
      // Share of joiners who left an application form behind.
      applicationShare: 0.8,
      applicationLeadDays: 60
    }
  }
};
