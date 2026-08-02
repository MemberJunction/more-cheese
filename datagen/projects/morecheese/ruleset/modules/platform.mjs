// PLATFORM — the residue of the instance having been USED.
//
// Seeds MJ application data (never entity-definition rows — CodeGen owns those) so the
// instance does not look freshly installed: staff users, shared saved views, saved queries,
// conversations, favourites, lists, notifications, and back-dated audit trails.
// Team requirement 2026-07-23.
//
// ─── THE SHAPE ────────────────────────────────────────────────────────────────────────────
// Two of the four parts, because this domain has no behaviour — nothing here is decided by
// dice, so there is nothing to put in `effects` or `mixes`:
//
//   catalog   things that exist    the seven lists below
//   params    settings             the email domain, and which audit trails to forge
//
// Note that `params` holds a STRING and a group of on/off switches, not just numbers. That
// is deliberate: a parameter is anything you set, not only anything you count.
//
// ─── THIS IS DATA ─────────────────────────────────────────────────────────────────────────
// Values only. No reading files, no clock, no randomness, no functions — the same inputs must
// always produce the same data. cli/check-ruleset.mjs fails the build otherwise.

/** @type {{ platform: import('../../../../engine/types.js').PlatformBlock }} */
export default {
  platform: {
    catalog: {
      // Three staff personas. A demo signs in AS one of these, so each needs its own
      // residue below — the first version gave favourites only to the membership director, and
      // signing in as anyone else showed an empty Favourites tray in the first ten seconds.
      staff: [
        {
          key: "membership-director",
          first: "Priya",
          last: "Raghunathan",
          title: "Membership Director"
        },
        {
          key: "events-coordinator",
          first: "Marcus",
          last: "Oduya",
          title: "Events & Programs Coordinator"
        },
        {
          key: "ops-analyst",
          first: "Helena",
          last: "Kovacs",
          title: "Membership Operations Analyst"
        }
      ],
      // Saved views visible to everyone (IsShared=1). The columns reference REAL generated-view
      // fields, including foreign-key display columns like Person/ReporterPerson, verified against
      // the CodeGen migration. GridState/FilterState mirror exactly what Explorer writes when a
      // user saves a view — without them a seeded view arrives with no column layout at all.
      sharedViews: [
        {
          key: "pending-renewals",
          owner: "membership-director",
          entityName: "MoreCheese: Membership Periods",
          name: "Pending renewals — act now",
          description: "Memberships inside the renewal window. The daily worklist for retention outreach.",
          whereClause: "Status='PendingRenewal'",
          sort: {
            field: "EndDate",
            dir: "asc"
          },
          columns: [
            {
              name: "Person",
              width: 220
            },
            {
              name: "MembershipTier",
              width: 140
            },
            {
              name: "EndDate",
              width: 130
            },
            {
              name: "DuesAmount",
              width: 120
            }
          ]
        },
        {
          key: "cancellations-with-notice",
          owner: "membership-director",
          entityName: "MoreCheese: Membership Periods",
          name: "Cancellations — they told us why",
          description: "Members who gave notice mid-term rather than going quiet. The reason column is the point: this is churn a retention team could have worked.",
          whereClause: "Status='Cancelled'",
          sort: {
            field: "CancellationDate",
            dir: "desc"
          },
          columns: [
            {
              name: "Person",
              width: 220
            },
            {
              name: "CancellationReason",
              width: 260
            },
            {
              name: "CancellationDate",
              width: 140
            },
            {
              name: "MembershipTier",
              width: 130
            }
          ]
        },
        {
          key: "critical-and-high-issues",
          owner: "ops-analyst",
          entityName: "MJ_BizApps_Issues: Issues",
          name: "Critical & high severity",
          description: "The escalation queue — everything at high impact or above, newest first.",
          whereClause: "Severity IN ('Critical', 'High')",
          sort: {
            field: "IssueNumber",
            dir: "desc"
          },
          columns: [
            {
              name: "IssueNumber",
              width: 120
            },
            {
              name: "Title",
              width: 320
            },
            {
              name: "Severity",
              width: 110
            },
            {
              name: "Priority",
              width: 110
            }
          ]
        },
        {
          key: "paid-no-shows",
          owner: "events-coordinator",
          entityName: "MoreCheese: Event Registrations",
          name: "Registered but didn't attend",
          description: "No-shows — the pool for follow-up and for judging whether a format is working.",
          whereClause: "Attended=0",
          sort: {
            field: "RegisteredOn",
            dir: "desc"
          },
          columns: [
            {
              name: "Person",
              width: 220
            },
            {
              name: "Event",
              width: 280
            },
            {
              name: "RegisteredOn",
              width: 140
            }
          ]
        },
        {
          key: "lapsed-2025",
          owner: "membership-director",
          entityName: "MoreCheese: Membership Periods",
          name: "Lapsed 2025 — win-back",
          description: "Memberships that lapsed during 2025 — the win-back outreach pool.",
          whereClause: "Status IN ('Lapsed', 'Cancelled') AND EndDate >= '2025-01-01' AND EndDate < '2026-01-01'",
          sort: {
            field: "EndDate",
            dir: "desc"
          },
          columns: [
            {
              name: "Person",
              width: 220
            },
            {
              name: "MembershipTier",
              width: 140
            },
            {
              name: "Status",
              width: 120
            },
            {
              name: "StartDate",
              width: 130
            },
            {
              name: "EndDate",
              width: 130
            },
            {
              name: "DuesAmount",
              width: 120
            }
          ]
        },
        {
          key: "open-billing-issues",
          owner: "membership-director",
          entityName: "MJ_BizApps_Issues: Issues",
          name: "Open billing issues",
          description: "Billing tickets still open — check before any renewal conversation.",
          whereClause: "IssueType='Billing' AND Status NOT IN ('Resolved','Closed')",
          sort: {
            field: "IssueNumber",
            dir: "asc"
          },
          columns: [
            {
              name: "IssueNumber",
              width: 140
            },
            {
              name: "Title",
              width: 320
            },
            {
              name: "Severity",
              width: 110
            },
            {
              name: "Priority",
              width: 110
            },
            {
              name: "Status",
              width: 120
            },
            {
              name: "ReporterPerson",
              displayName: "Reporter",
              width: 200
            }
          ]
        },
        {
          key: "new-members-ytd",
          owner: "ops-analyst",
          entityName: "MoreCheese: Member Profiles",
          name: "New members — this year",
          description: "Profiles created since January 1 — onboarding cohort.",
          whereClause: "JoinDate >= '2026-01-01'",
          sort: {
            field: "JoinDate",
            dir: "desc"
          },
          columns: [
            {
              name: "MemberNumber",
              width: 140
            },
            {
              name: "Person",
              width: 220
            },
            {
              name: "Segment",
              width: 130
            },
            {
              name: "Region",
              width: 140
            },
            {
              name: "City",
              width: 140
            },
            {
              name: "State",
              width: 80
            },
            {
              name: "JoinDate",
              width: 120
            }
          ]
        },
        {
          key: "gold-winners-2025",
          owner: "events-coordinator",
          entityName: "MoreCheese: Competition Entries",
          name: "Gold award winners 2025",
          description: "Gold results from the 2025 competition — press release shortlist.",
          whereClause: "Result='Gold' AND EntryYear=2025",
          sort: {
            field: "EntryYear",
            dir: "desc"
          },
          columns: [
            {
              name: "EntryYear",
              width: 100
            },
            {
              name: "Category",
              width: 170
            },
            {
              name: "ProductName",
              width: 240
            },
            {
              name: "Person",
              width: 220
            },
            {
              name: "Result",
              width: 100
            }
          ]
        }
      ],
      // Approved + Reusable queries. These double as Skip's entry points.
      queries: [
        {
          key: "churn-reasons-by-year",
          name: "Why we lose members, by year",
          userQuestion: "What reasons do members give for leaving, and how has that changed?",
          description: "Terminal memberships grouped by year and recorded reason — the two ways a membership ends, side by side.",
          sql: "SELECT YEAR(EndDate) AS EndYear, Status, CancellationReason, COUNT(*) AS Memberships FROM [morecheese_members].[vwMembershipPeriods] WHERE Status IN ('Lapsed','Cancelled') GROUP BY YEAR(EndDate), Status, CancellationReason ORDER BY EndYear DESC, Memberships DESC"
        },
        {
          key: "event-attendance-by-format",
          name: "Attendance rate by event format",
          userQuestion: "Which event formats do people actually turn up to?",
          description: "Registrations and attendance per event type and year — the no-show rate that tells you whether a format is working.",
          sql: "SELECT e.EventType, YEAR(e.EventDate) AS EventYear, COUNT(*) AS Registrations, SUM(CASE WHEN r.Attended = 1 THEN 1 ELSE 0 END) AS Attended FROM [morecheese_events].[vwEventRegistrations] r JOIN [morecheese_events].[vwEvents] e ON e.ID = r.EventID GROUP BY e.EventType, YEAR(e.EventDate) ORDER BY EventYear DESC, e.EventType"
        },
        {
          key: "dues-revenue-by-tier-year",
          name: "Dues revenue by tier and year",
          userQuestion: "How much dues revenue does each membership tier bring in each year?",
          description: "Posted dues orders rolled up by tier and year — the revenue view behind any pricing conversation.",
          sql: "SELECT p.MembershipTier, YEAR(p.StartDate) AS PeriodYear, COUNT(*) AS Memberships, SUM(p.DuesAmount) AS DuesBilled FROM [morecheese_members].[vwMembershipPeriods] p GROUP BY p.MembershipTier, YEAR(p.StartDate) ORDER BY PeriodYear DESC, DuesBilled DESC"
        },
        {
          key: "committee-service-load",
          name: "Committee service load",
          userQuestion: "Who carries the committee workload, and which committees are thin?",
          description: "Seats per committee and term, with officer counts — surfaces both the over-committed volunteers and the committees that struggle to fill.",
          sql: "SELECT c.Name AS Committee, t.Name AS Term, COUNT(*) AS Seats FROM [__mj_BizAppsCommittees].[vwMemberships] m JOIN [__mj_BizAppsCommittees].[vwTerms] t ON t.ID = m.TermID JOIN [__mj_BizAppsCommittees].[vwCommittees] c ON c.ID = t.CommitteeID GROUP BY c.Name, t.Name ORDER BY c.Name, t.Name DESC"
        },
        {
          key: "members-by-segment-region",
          name: "Members by segment and region",
          userQuestion: "How are our members distributed across segments and regions?",
          description: "Member profile counts grouped by segment and region.",
          sql: "SELECT Segment, Region, COUNT(*) AS Members FROM [morecheese_members].[vwMemberProfiles] GROUP BY Segment, Region ORDER BY Members DESC"
        },
        {
          key: "open-issues-by-type-severity",
          name: "Open issues by type and severity",
          userQuestion: "What support issues are open right now, and how severe are they?",
          description: "Open ticket counts by issue type and severity.",
          sql: "SELECT IssueType, Severity, COUNT(*) AS OpenIssues FROM [__mj_BizAppsIssues].[vwIssues] WHERE Status NOT IN ('Resolved','Closed') GROUP BY IssueType, Severity ORDER BY OpenIssues DESC"
        },
        {
          key: "lapsed-by-year",
          name: "Lapsed memberships by year",
          userQuestion: "How many memberships lapsed each year?",
          description: "Lapse counts by the year the membership period ended.",
          sql: "SELECT YEAR(EndDate) AS YearEnded, COUNT(*) AS Lapsed FROM [morecheese_members].[vwMembershipPeriods] WHERE Status='Lapsed' GROUP BY YEAR(EndDate) ORDER BY YearEnded"
        }
      ],
      conversations: [
        {
          key: "at-risk-review",
          owner: "membership-director",
          name: "At-risk members review",
          daysBeforeRelease: 6,
          turns: [
            {
              role: "User",
              text: "Which members look at risk of not renewing this cycle?"
            },
            {
              role: "AI",
              text: "Looking across renewal status, satisfaction and open support items: {N:PENDING_RENEWALS} memberships are pending renewal right now, and {N:LAPSED_2025} lapsed during 2025. The clearest individual risk signal is {HERO:ICF-000105} — declining survey scores across three conferences, reduced event participation, and an open billing dispute that also has an unanswered secure-message thread. I'd prioritize resolving the billing issue before the renewal conversation."
            },
            {
              role: "User",
              text: "What about billing issues generally — how many are open?"
            },
            {
              role: "AI",
              text: "There are {N:OPEN_BILLING} open billing issues. Members with an unresolved billing dispute at renewal time lapse at a visibly higher rate in this dataset, so the open ones are worth triaging this week."
            }
          ]
        },
        {
          key: "segment-mix",
          owner: "ops-analyst",
          name: "Segment mix check",
          daysBeforeRelease: 13,
          turns: [
            {
              role: "User",
              text: "Give me a quick read on the membership base composition."
            },
            {
              role: "AI",
              text: "The federation currently has {N:MEMBER_COUNT} member profiles. The largest segment is {N:TOP_SEGMENT} with {N:TOP_SEGMENT_COUNT} members. I saved the full segment-by-region breakdown as the reusable query \"Members by segment and region\" if you want the complete table."
            }
          ]
        },
        {
          key: "conference-recap",
          owner: "events-coordinator",
          name: "Conference attendance recap",
          daysBeforeRelease: 20,
          turns: [
            {
              role: "User",
              text: "How did attendance look for the most recent annual conference?"
            },
            {
              role: "AI",
              text: "The {N:CONF_YEAR} conference drew {N:CONF_REGS} registrations, of which {N:CONF_ATTENDED} attended — a {N:CONF_ATTEND_PCT}% attendance rate. No-shows are concentrated in first-time registrants, which matches the historical pattern in this dataset."
            }
          ]
        }
      ],
      // Per staff persona — see the note on staff above.
      favorites: [
        {
          owner: "membership-director",
          memberNumbers: [
            "ICF-000101",
            "ICF-000105",
            "ICF-000108",
            "ICF-000109"
          ]
        },
        {
          owner: "events-coordinator",
          memberNumbers: [
            "ICF-000107",
            "ICF-000101",
            "ICF-000116"
          ]
        },
        {
          owner: "ops-analyst",
          memberNumbers: [
            "ICF-000105",
            "ICF-000103"
          ]
        }
      ],
      // All three are DERIVED, never invented: the outreach list is exactly the members the
      // tasks pack targets for renewal, the shortlist is exactly the recent competition
      // medalists, and the win-back list is exactly the most recent lapses, highest dues first.
      lists: [
        {
          key: "renewal-outreach",
          owner: "membership-director",
          entityName: "MoreCheese: Member Profiles",
          name: "Renewal outreach — current cycle",
          description: "Members with a pending renewal being worked by the outreach queue.",
          source: "renewal-outreach-tasks"
        },
        {
          key: "conference-speakers",
          owner: "events-coordinator",
          entityName: "MoreCheese: Member Profiles",
          name: "Speaker shortlist — next conference",
          description: "Members invited or under consideration to speak at the coming annual conference.",
          source: "competition-medalists"
        },
        {
          key: "at-risk-watch",
          owner: "ops-analyst",
          entityName: "MoreCheese: Member Profiles",
          name: "Retention watch list",
          description: "High-value members whose engagement has been sliding — the manual watch list behind the score.",
          source: "lapsed-high-value"
        }
      ],
      notifications: [
        {
          owner: "membership-director",
          title: "Cancellation notice received",
          message: "A member gave notice mid-term. Their stated reason is on the membership record.",
          unread: true,
          daysBeforeRelease: 2
        },
        {
          owner: "ops-analyst",
          title: "Critical ticket escalated",
          message: "An issue was escalated to Critical severity and is waiting on triage.",
          unread: true,
          daysBeforeRelease: 1
        },
        {
          owner: "events-coordinator",
          title: "Committee meeting agenda published",
          message: "The Events Committee agenda for the next quarterly meeting is available.",
          unread: false,
          daysBeforeRelease: 6
        },
        {
          owner: "ops-analyst",
          title: "Duplicate contact records found",
          message: "The nightly data-quality sweep flagged possible duplicate member records for review.",
          unread: true,
          daysBeforeRelease: 3
        },
        {
          owner: "membership-director",
          title: "Renewal outreach queue updated",
          message: "New pending renewals were added to the outreach queue overnight.",
          unread: true,
          daysBeforeRelease: 1
        },
        {
          owner: "membership-director",
          title: "Weekly at-risk digest",
          message: "Your weekly at-risk member digest is ready.",
          unread: false,
          daysBeforeRelease: 4
        },
        {
          owner: "events-coordinator",
          title: "Post-conference survey closing",
          message: "The post-conference survey distribution closes at the end of the week.",
          unread: true,
          daysBeforeRelease: 2
        },
        {
          owner: "ops-analyst",
          title: "Data quality review scheduled",
          message: "Quarterly duplicate/stale-record review is on the calendar for next Monday.",
          unread: false,
          daysBeforeRelease: 7
        }
      ]
    },
    params: {
      // Staff emails ride the reserved .example TLD, like every generated email here —
      // undeliverable by construction, so no test can ever mail a real person.
      emailDomain: "morecheesefederation.example",
      // Which back-dated audit trails to forge. Every row mirrors a timeline fact another pack
      // already generated, so the change date always falls inside the subject record's real
      // date window (checked).
      recordChanges: {
        issueTransitions: true,
        taskCompletions: true,
        heroProfileCreates: true,
        heroPeriodCreates: true,
        staleEmployerRelEdits: true
      }
    }
  },
};
