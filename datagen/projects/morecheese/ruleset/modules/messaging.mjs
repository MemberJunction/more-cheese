// MESSAGING — secure member↔staff message threads, derived from support tickets.
//
// ─── THE SHAPE ─────────────────────────────────────────────────────────────────────────────
//   catalog   the wording banks, keyed by ticket type
//   params    how many threads, how fast replies come, who signs them
//
// No effects or mixes: nothing here differs by group, and the wording picks are plain
// uniform choices rather than weighted ones.
//
// See datagen/CONTRACT.md. Values only — no clock, no randomness, no I/O, no functions.

export default {
  messaging: {
    catalog: {
      // The member's first message, by ticket type. Four banks, so a Billing thread never
      // opens with an Events sentence.
      openers: {
        Billing: [
          "Hi — I received an overdue notice but I believe this invoice was already paid. Could you check on your end?",
          "Our AP contact changed and I think the invoice went to the wrong inbox. Can you resend the current statement?",
          "I'd like to sort out the outstanding balance on my account before renewal — what exactly is still open?"
        ],
        "Data Correction": [
          "My employer information is out of date in the member directory — could you update the record?",
          "The roster still shows my old affiliation. What do you need from me to correct it?",
          "I noticed my organization's listing has stale details. Happy to provide the current information."
        ],
        Events: [
          "I registered and paid but couldn't attend — could you let me know the refund options?",
          "I can't find the session materials from the event in my portal. Are they available somewhere?",
          "Quick question about my event registration — can it be transferred to a colleague?"
        ],
        General: [
          "I have a question about member benefits — who is the right person to talk to?",
          "Could you point me to the process for getting involved with federation programs?",
          "I'd like some guidance on how to make the most of my membership this year."
        ]
      },
      // Staff answers. Five per type, so a demo scrolling a few threads does not see the same
      // sentence twice.
      replies: {
        Billing: [
          "Thanks for reaching out — I'm pulling up the invoice history on your account now.",
          "Got it. Let me trace the payment against the order and confirm what actually posted.",
          "Thanks for flagging this. I've asked our finance contact to verify the transaction.",
          "I can see the charge you're describing — checking whether a duplicate was captured.",
          "Appreciate the details. I'll reconcile this against our records and follow up."
        ],
        "Data Correction": [
          "Thanks for letting us know — I'm opening your record to update the employment details.",
          "Understood. I'll correct the organization on your profile and re-check the directory listing.",
          "Thanks for catching that. I've flagged the record for correction.",
          "I can see the outdated entry. I'll get it amended and confirm once it's live.",
          "Appreciate you reporting it — checking whether the old affiliation needs an end date too."
        ],
        Events: [
          "Thanks for getting in touch — let me look up the registration and the refund policy for that event.",
          "Sorry you couldn't make it. I'm checking what credit options are available.",
          "Got it. I'll confirm the registration status and what we can do about the fee.",
          "Thanks — I can see the registration. Let me check with the events team.",
          "Understood. Looking into whether a transfer or credit applies here."
        ],
        General: [
          "Thanks for reaching out — I'm looking into this now and will follow up shortly.",
          "Got it, thanks for the details. Let me check with the team and get back to you.",
          "Thanks for flagging this. I've pulled up your account and I'm reviewing it now.",
          "Happy to help — I'm checking the settings on your profile now.",
          "Appreciate the report. Let me confirm what's happening on our side."
        ]
      },
      followUps: {
        Billing: [
          "Thanks — just checking in on where this stands.",
          "One more detail that might help: the payment went out by card, and it's on my statement.",
          "Any update? I'd like this cleared before the next renewal.",
          "Happy to forward the receipt if that's useful."
        ],
        "Data Correction": [
          "Thanks — just checking in on where this stands.",
          "For reference, the change took effect at the start of last year.",
          "Let me know if you need anything from me to verify the new employer.",
          "Appreciate it — the directory still shows the old entry as of today."
        ],
        Events: [
          "Thanks — just checking in on where this stands.",
          "For what it's worth, I did let the organizers know in advance.",
          "A credit toward a future event would be fine if a refund isn't possible.",
          "Any word on this one?"
        ],
        General: [
          "Thanks — just checking in on where this stands.",
          "Thank you! Let me know if you need anything else from me.",
          "Still seeing the same behaviour on my end.",
          "No rush — just making sure it didn't get lost."
        ]
      },
      closers: {
        Billing: [
          "This is resolved — the balance has been corrected and you should see it within a day. Thanks for your patience!",
          "All set. The duplicate charge has been reversed; refunds usually post in a few business days.",
          "Good news — the payment was located and applied to the right order. Closing this out."
        ],
        "Data Correction": [
          "Updated — your profile now shows the correct organization. Thanks for letting us know!",
          "All set. I've corrected the record and confirmed the directory listing looks right.",
          "Done on our end, and the old affiliation has been end-dated. Reply any time if anything still looks off."
        ],
        Events: [
          "Sorted — the refund has been approved and will go back to the original payment method.",
          "All set: a credit has been applied to your account toward a future event.",
          "This is taken care of. Thanks for your patience, and sorry you had to miss it."
        ],
        General: [
          "This is resolved on our end — you should see the correction reflected within a day. Thanks for your patience!",
          "All set! I've updated the record and confirmed everything looks right. Don't hesitate to reach out again.",
          "Good news — this has been taken care of. Closing the thread, but reply any time to reopen."
        ]
      }
    },
    params: {
      // Share of support tickets that also produce a message thread. Enforced — the pair form
      // means the validator checks the real number afterwards.
      // 
      // This was two separate keys: `threadSharePerIssue` and a loose `tolerance` sitting next
      // to it, with nothing saying they belonged together. Now they visibly do.
      threadSharePerIssue: {
        target: 0.45,
        tolerance: 0.1
      },
      followUpPairsMax: 2,
      replyDelayHoursMax: 72,
      // Signature used when no specific staff member owns the thread.
      staffFallbackSender: "ICF Member Services",
      starredShare: 0.06
    }
  },
};
