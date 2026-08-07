// ISSUES — support tickets: what members complain about, how urgent it is, who picks it up.
//
// ─── THE SHAPE ─────────────────────────────────────────────────────────────────────────────
//   catalog   the ticket types, the statuses, and the four comment banks
//   params    how many tickets each source produces, and how they are prioritised
//   mixes     how severe a ticket is, one mix per ticket type
//
// No effects: a ticket is caused by a FACT that already exists — an overdue invoice, a paid
// no-show, an employer that changed — not by how keen the member is. That is why this domain
// has volumes per source rather than one calibrated rate.
//
// The severity mixes were pair-arrays and are now object maps, one per type, keyed by the type
// name with spaces removed (Data Correction becomes severityDataCorrection).
//
// See datagen/CONTRACT.md. Values only — no clock, no randomness, no I/O, no functions.

export default {
  issues: {
    catalog: {
      // The four kinds of ticket. The `priority` here is the DEFAULT, before severity bumps it.
      types: [
        {
          name: "Billing",
          priority: "High",
          description: "Dues and payment problems"
        },
        {
          name: "Data Correction",
          priority: "Medium",
          description: "Member/organization record fixes"
        },
        {
          name: "Events",
          priority: "Medium",
          description: "Registration and refund requests"
        },
        {
          name: "General",
          priority: "Low",
          description: "Everything else"
        }
      ],
      // The workflow. `isTerminal` marks the ones that stop the clock.
      statuses: [
        {
          name: "New",
          sequence: 10,
          isDefault: true,
          isTerminal: false,
          color: "#2196F3"
        },
        {
          name: "In Progress",
          sequence: 20,
          isDefault: false,
          isTerminal: false,
          color: "#FF9800"
        },
        {
          name: "Resolved",
          sequence: 30,
          isDefault: false,
          isTerminal: true,
          color: "#4CAF50"
        },
        {
          name: "Closed",
          sequence: 40,
          isDefault: false,
          isTerminal: true,
          color: "#9E9E9E"
        }
      ],
      // Comment banks, by stage of a ticket's life: triage, internal notes, member replies,
      // and resolutions.
      commentTriage: [
        "Picked this up — checking the account now.",
        "Acknowledged. Pulling the record to see what happened.",
        "Taking a look; I'll confirm shortly.",
        "Assigned to me. Reviewing the history on this one."
      ],
      commentInternal: [
        "Confirmed against the order history — the charge did post twice.",
        "Directory record is stale; the employment edge was never end-dated.",
        "No refund policy exception applies here, but it's within the goodwill threshold.",
        "Checked with the events team — recordings were published late.",
        "Duplicate of an earlier report from the same member.",
        "Member's tier changed mid-cycle, which explains the amount."
      ],
      commentMemberReply: [
        "Thanks — anything else you need from me?",
        "That matches what I'm seeing on my side.",
        "Appreciate the quick response.",
        "Still showing the old details when I log in.",
        "No rush, just wanted to make sure it was logged."
      ],
      commentResolution: [
        "Corrected and confirmed with the member. Closing.",
        "Resolved — the adjustment has been applied.",
        "Fixed on our side; the member has been notified.",
        "Sorted. Record updated and verified."
      ]
    },
    params: {
      // One ticket source per real fact: members with an overdue invoice, members who paid
      // for an event and did not attend, and a thin background stream of general inquiries.
      // Data-correction tickets come from employer changes and are not rate-driven at all —
      // one per member whose employer had a lifecycle event while they were active.
      billingSharePerOverdueMember: 0.35,
      refundSharePerPaidNoShow: 0.04,
      // ESTIMATE — the fact-free portal inquiries (logins, newsletter, directory listings)
      // that every real support queue carries. Without this, the General type had exactly one
      // authored row and looked broken.
      generalSharePerMember: 0.012,
      commentSharePerIssue: 0.62,
      // Tickets newer than this may still be open; older ones are resolved. This is what keeps
      // a demo board from being either empty or entirely stale.
      recencyOpenDays: 75,
      numberPrefix: "MC",
      severityTolerance: 0.06,
      // At least this many Critical tickets must exist. A floor, not a share — Critical sat at
      // ZERO for weeks behind a share gate that was passing, because 0% was inside its
      // tolerance band. A share can never prove a category is present.
      severityCriticalFloor: 1,
      // Severity is impact; priority is urgency. They are deliberately DIFFERENT: priority
      // starts from the type default, gets bumped when severity is at least this level, and is
      // sometimes knocked down again by noise. Without that, severity was just a copy of
      // priority in another column.
      priorityBumpIfSeverityAtLeast: "High",
      priorityNoiseDownShare: 0.15,
      // Share of tickets assigned to a committee officer. Enforced.
      // (Was `share` + `tolerance` as separate sibling keys.)
      assignment: {
        target: 0.75,
        tolerance: 0.08
      }
    },
    mixes: {
      // Billing problems skew severe — money is involved. General inquiries never do.
      severityBilling: {
        Critical: 0.1,
        High: 0.45,
        Medium: 0.35,
        Low: 0.1
      },
      severityDataCorrection: {
        High: 0.1,
        Medium: 0.55,
        Low: 0.35
      },
      severityEvents: {
        Critical: 0.04,
        High: 0.13,
        Medium: 0.58,
        Low: 0.25
      },
      severityGeneral: {
        Medium: 0.35,
        Low: 0.65
      }
    }
  },
};
