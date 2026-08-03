// THE REFERENCE GRAPH, declared as data.
//
// Every edge here is "this child column must point at an existing parent key". The checks are
// GENERATED from these declarations by engine/checks.mjs — nobody writes a dangling counter.
//
// Why this file exists: reference integrity was a dozen hand-rolled counters in validate.mjs,
// each re-deciding whether nulls count as broken and each inventing its own message. Declaring
// the edges instead means the rule is stated once, the check derives from it, and a second
// project declares its own graph rather than reimplementing the counting.
//
// It also makes the graph READABLE. Before, you could not see the shape of the dataset without
// reading 1,600 lines of validator; now it is one screen.
//
// A dangling reference is not a cosmetic problem. It is invisible in the packs — the row looks
// fine — and only fails at install, where the real foreign key rejects it. That is exactly how a
// committee seat on a term that was never emitted surfaced: gates green, push failed.

/** @type {readonly import('../../engine/checks.mjs').Ref[]} */
export const refs = [
  // ---- identity ----
  { from: ['common', 'people', 'OrgKey'], to: ['common', 'organizations', 'OrgKey'],
    note: 'optional: not every person has an employer' },

  // ---- membership ----
  { from: ['membership', 'membership_periods', 'MemberNumber'], to: ['common', 'people', 'MemberNumber'] },

  // ---- events ----
  { from: ['events', 'event_registrations', 'EventKey'], to: ['events', 'events', 'EventKey'] },
  { from: ['events', 'event_registrations', 'MemberNumber'], to: ['common', 'people', 'MemberNumber'],
    note: 'prospects register too, so the parent set is ALL people, not members' },

  // ---- the money chain ----
  { from: ['orders', 'orders', 'MemberNumber'], to: ['common', 'people', 'MemberNumber'] },
  { from: ['orders', 'order_lines', 'OrderKey'], to: ['orders', 'orders', 'OrderKey'] },
  { from: ['orders', 'order_lines', 'ProductKey'], to: ['orders', 'products', 'ProductKey'] },
  { from: ['orders', 'payments', 'OrderKey'], to: ['orders', 'orders', 'OrderKey'] },

  // ---- governance ----
  { from: ['committees', 'committee_terms', 'CommitteeKey'], to: ['committees', 'committees', 'CommitteeKey'] },
  { from: ['committees', 'committee_meetings', 'CommitteeKey'], to: ['committees', 'committees', 'CommitteeKey'] },
  { from: ['committees', 'committee_memberships', 'MemberNumber'], to: ['common', 'people', 'MemberNumber'] },
  { from: ['committees', 'committee_memberships', 'CommitteeKey'], to: ['committees', 'committees', 'CommitteeKey'] },
  { from: ['committees', 'committee_memberships', 'TermKey'], to: ['committees', 'committee_terms', 'TermKey'],
    note: 'the edge that once shipped broken — a seat on a term that was never emitted' },
  { from: ['committees', 'committee_attendance', 'MeetingKey'], to: ['committees', 'committee_meetings', 'MeetingKey'] },
  { from: ['committees', 'committee_attendance', 'MemberNumber'], to: ['common', 'people', 'MemberNumber'] },

  // ---- support + messaging ----
  { from: ['issues', 'issues', 'ReporterMemberNumber'], to: ['common', 'people', 'MemberNumber'] },
  { from: ['messaging', 'secure_threads', 'IssueKey'], to: ['issues', 'issues', 'IssueKey'] },
  { from: ['messaging', 'secure_messages', 'ThreadKey'], to: ['messaging', 'secure_threads', 'ThreadKey'] },
  { from: ['messaging', 'secure_messages', 'SessionKey'], to: ['messaging', 'portal_sessions', 'SessionKey'] },

  // ---- tasks ----
  { from: ['tasks', 'tasks', 'CreatedByMemberNumber'], to: ['common', 'people', 'MemberNumber'] },
];
