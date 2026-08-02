// TASKS — action items: committee follow-ups, and renewal outreach.
//
// ─── THE SHAPE ─────────────────────────────────────────────────────────────────────────────
//   catalog   the two task types, and the bank of committee action wordings
//   params    how often meetings spawn actions, how long they get, how many finish
//   effects   keen assignees finish more of them
//
// Renewal outreach takes no settings at all: it is one Open task per member whose renewal
// is pending at the release date, due when their period ends. Derived, not tuned.
//
// See datagen/CONTRACT.md. Values only — no clock, no randomness, no I/O, no functions.

export default {
  tasks: {
    catalog: {
      // The two kinds of task. `priority` is what the app shows in its queue.
      types: [
        {
          name: "Committee Action Item",
          priority: "Medium",
          description: "Follow-up work items arising from committee meetings"
        },
        {
          name: "Renewal Outreach",
          priority: "High",
          description: "Staff outreach to members whose renewal is due"
        }
      ],
      // Wordings for meeting follow-ups. Deliberately mundane — real action items are.
      committeeActionBank: [
        "Draft the guidance revision",
        "Circulate the meeting summary to members",
        "Follow up with speaker candidates",
        "Prepare budget figures for next quarter",
        "Review the member feedback digest",
        "Coordinate venue logistics for the workshop",
        "Collect comments on the draft standard",
        "Update the committee charter page"
      ]
    },
    params: {
      // Chance a meeting produces any follow-up work at all.
      committeeActionRatePerMeeting: 0.5,
      committeeActionMaxPerMeeting: 2,
      committeeActionDueDays: 30,
      // Share of action items that get finished. Enforced.
      committeeActionCompletion: {
        target: 0.7,
        tolerance: 0.08
      }
    },
    effects: {
      "completion.engagement": {
        beta: 0.5,
        note: "engaged assignees finish their action items"
      }
    }
  },
};
