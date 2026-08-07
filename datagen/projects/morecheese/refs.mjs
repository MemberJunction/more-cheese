// THE REFERENCE GRAPH, declared as data. 100 edges, and it is the whole graph now.
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
// reading 1,600 lines of validator.
//
// This file started at 20 edges — the ones somebody remembered. The rest were found rather than
// recalled: every *Key/*Number/*ID column in the emitted packs was listed, the ones with a declared
// parent removed, and what remained was 46 child columns nobody had claimed, from the whole
// form→version→page→question→answer chain to every platform artifact's owner. Inference can say a
// column is unowned; it CANNOT pick the parent — offered the chance it resolved every platform
// UserKey to `conversations`, because that column happened to be unique. Choosing the parent is the
// judgement, and this file is where it is recorded.
//
// Eleven bespoke reference gates in cli/validate.mjs are gone as a result, along with the
// fkResolves helper that existed to make writing more of them convenient.
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

  // ---- the roster edges, every pack that names a person ----
  // Found by inference, not by memory: every *Key/*Number column in the emitted packs was tested
  // against every unique-key column, and these ten held in the data while being declared nowhere.
  // Each was a missing dangling-reference gate; they also make the install-order check mean
  // something, which on eight declared cross-pack edges it did not.
  { from: ['membership', 'advocacy_actions', 'MemberNumber'], to: ['common', 'people', 'MemberNumber'] },
  { from: ['membership', 'data_quality_labels', 'MemberNumber'], to: ['common', 'people', 'MemberNumber'] },
  { from: ['events', 'competition_entries', 'MemberNumber'], to: ['common', 'people', 'MemberNumber'] },
  { from: ['events', 'competition_entries', 'OrgKey'], to: ['common', 'organizations', 'OrgKey'] },
  { from: ['learning', 'enrollments', 'MemberNumber'], to: ['common', 'people', 'MemberNumber'] },
  { from: ['learning', 'member_certifications', 'MemberNumber'], to: ['common', 'people', 'MemberNumber'] },
  { from: ['forms', 'form_responses', 'MemberNumber'], to: ['common', 'people', 'MemberNumber'],
    note: 'nullable BY DESIGN: the public application form takes anonymous respondents' },
  { from: ['messaging', 'portal_sessions', 'MemberNumber'], to: ['common', 'people', 'MemberNumber'] },
  { from: ['messaging', 'secure_threads', 'MemberNumber'], to: ['common', 'people', 'MemberNumber'] },
  { from: ['messaging', 'secure_messages', 'MemberNumber'], to: ['common', 'people', 'MemberNumber'] },

  // ---- the rest of the graph ----
  // Found the same way as the roster edges: every *Key/*Number/*ID column in the emitted packs was
  // listed, the ones with a declared parent removed, and what remained was 46 child columns nobody
  // had claimed. Inference can say a column is UNOWNED; it cannot pick the right parent — offered
  // one, it resolved every platform UserKey to `conversations` because that column happened to be
  // unique. Choosing the parent is the judgement, and writing it down here is the point.

  // membership
  { from: ['membership', 'data_quality_labels', 'RelatedMemberNumber'], to: ['common', 'people', 'MemberNumber'] },
  { from: ['membership', 'data_quality_labels', 'RelatedOrgKey'], to: ['common', 'organizations', 'OrgKey'] },

  // the relationship graph — four nullable columns, two of people and two of organisations
  { from: ['common', 'relationships', 'FromMemberNumber'], to: ['common', 'people', 'MemberNumber'] },
  { from: ['common', 'relationships', 'ToMemberNumber'], to: ['common', 'people', 'MemberNumber'] },
  { from: ['common', 'relationships', 'FromOrgKey'], to: ['common', 'organizations', 'OrgKey'] },
  { from: ['common', 'relationships', 'ToOrgKey'], to: ['common', 'organizations', 'OrgKey'] },
  { from: ['common', 'relationships', 'TypeKey'], to: ['common', 'relationship_types', 'TypeKey'] },

  // learning
  { from: ['learning', 'enrollments', 'CourseKey'], to: ['learning', 'courses', 'CourseKey'] },
  { from: ['learning', 'member_certifications', 'CertKey'], to: ['learning', 'certifications', 'CertKey'] },

  // governance — the meeting-content chain, which nothing had declared
  { from: ['committees', 'committee_memberships', 'RoleName'], to: ['committees', 'committee_roles', 'Name'] },
  { from: ['committees', 'committee_agenda_items', 'MeetingKey'], to: ['committees', 'committee_meetings', 'MeetingKey'] },
  { from: ['committees', 'committee_motions', 'MeetingKey'], to: ['committees', 'committee_meetings', 'MeetingKey'] },
  { from: ['committees', 'committee_votes', 'MotionKey'], to: ['committees', 'committee_motions', 'MotionKey'] },
  { from: ['committees', 'committee_votes', 'MemberNumber'], to: ['common', 'people', 'MemberNumber'] },

  // forms — the whole form→version→page→question→answer chain
  { from: ['forms', 'form_versions', 'FormKey'], to: ['forms', 'forms', 'FormKey'] },
  { from: ['forms', 'form_pages', 'FormKey'], to: ['forms', 'forms', 'FormKey'] },
  { from: ['forms', 'form_questions', 'FormKey'], to: ['forms', 'forms', 'FormKey'] },
  { from: ['forms', 'form_questions', 'PageKey'], to: ['forms', 'form_pages', 'PageKey'] },
  { from: ['forms', 'form_question_options', 'QuestionKey'], to: ['forms', 'form_questions', 'QuestionKey'] },
  { from: ['forms', 'form_distributions', 'FormKey'], to: ['forms', 'forms', 'FormKey'] },
  { from: ['forms', 'form_responses', 'FormKey'], to: ['forms', 'forms', 'FormKey'] },
  { from: ['forms', 'form_responses', 'VersionKey'], to: ['forms', 'form_versions', 'VersionKey'] },
  { from: ['forms', 'form_responses', 'DistributionKey'], to: ['forms', 'form_distributions', 'DistributionKey'] },
  { from: ['forms', 'form_answers', 'ResponseKey'], to: ['forms', 'form_responses', 'ResponseKey'] },
  { from: ['forms', 'form_answers', 'QuestionKey'], to: ['forms', 'form_questions', 'QuestionKey'] },

  // support
  { from: ['issues', 'issues', 'TypeKey'], to: ['issues', 'issue_types', 'TypeKey'] },
  { from: ['issues', 'issues', 'StatusKey'], to: ['issues', 'issue_statuses', 'StatusKey'] },
  { from: ['issues', 'issues', 'AssigneeMemberNumber'], to: ['common', 'people', 'MemberNumber'] },
  { from: ['issues', 'issue_comments', 'IssueKey'], to: ['issues', 'issues', 'IssueKey'] },
  { from: ['issues', 'issue_comments', 'AuthorMemberNumber'], to: ['common', 'people', 'MemberNumber'],
    note: 'nullable: a staff-authored comment has no member' },

  // tasks
  { from: ['tasks', 'tasks', 'TypeKey'], to: ['tasks', 'task_types', 'TypeKey'] },
  { from: ['tasks', 'task_assignments', 'TaskKey'], to: ['tasks', 'tasks', 'TaskKey'] },
  { from: ['tasks', 'task_assignments', 'AssigneeMemberNumber'], to: ['common', 'people', 'MemberNumber'] },
  { from: ['tasks', 'task_links', 'TaskKey'], to: ['tasks', 'tasks', 'TaskKey'] },

  // the platform's own residue: every artifact belongs to a staff user
  { from: ['platform', 'mj_user_roles', 'UserKey'], to: ['platform', 'mj_users', 'UserKey'] },
  { from: ['platform', 'user_views', 'UserKey'], to: ['platform', 'mj_users', 'UserKey'] },
  { from: ['platform', 'conversations', 'UserKey'], to: ['platform', 'mj_users', 'UserKey'] },
  { from: ['platform', 'conversation_details', 'ConvKey'], to: ['platform', 'conversations', 'ConvKey'] },
  { from: ['platform', 'conversation_details', 'UserKey'], to: ['platform', 'mj_users', 'UserKey'],
    note: 'nullable: an assistant turn has no user' },
  { from: ['platform', 'lists', 'UserKey'], to: ['platform', 'mj_users', 'UserKey'] },
  { from: ['platform', 'list_details', 'ListKey'], to: ['platform', 'lists', 'ListKey'] },
  { from: ['platform', 'user_favorites', 'UserKey'], to: ['platform', 'mj_users', 'UserKey'] },
  { from: ['platform', 'user_notifications', 'UserKey'], to: ['platform', 'mj_users', 'UserKey'] },
  { from: ['platform', 'record_changes', 'UserKey'], to: ['platform', 'mj_users', 'UserKey'] },

  // sonar — definitions only, but they still have to hang together
  { from: ['sonar', 'score_bands', 'BandSetKey'], to: ['sonar', 'score_band_sets', 'BandSetKey'] },
  { from: ['sonar', 'score_model_versions', 'ModelKey'], to: ['sonar', 'score_models', 'ModelKey'] },
  { from: ['sonar', 'model_related_entities', 'ModelKey'], to: ['sonar', 'score_models', 'ModelKey'] },
  { from: ['sonar', 'factors', 'ModelKey'], to: ['sonar', 'score_models', 'ModelKey'] },
  { from: ['sonar', 'factors', 'SourceRelatedKey'], to: ['sonar', 'model_related_entities', 'RelatedKey'] },
  { from: ['sonar', 'factors', 'WindowKey'], to: ['sonar', 'time_windows', 'WindowKey'],
    note: 'nullable: a factor need not be windowed' },
  { from: ['sonar', 'model_factors', 'ModelKey'], to: ['sonar', 'score_models', 'ModelKey'] },
  { from: ['sonar', 'model_factors', 'FactorKey'], to: ['sonar', 'factors', 'FactorKey'] },

  // ---- POLYMORPHIC references: one column, parent chosen by a sibling discriminator ----
  // These were a hand-written switch in the validator whose final branch was `: false` — so a
  // RefKind nobody added to the chain failed closed as a dangling count with no name on it. One
  // declared edge per kind instead, and the `when` subset is required to be non-empty, so a
  // renamed discriminator fails LOUDLY rather than passing over zero rows.
  { from: ['common', 'address_links', 'AddressKey'], to: ['common', 'addresses', 'AddressKey'] },
  { from: ['common', 'address_links', 'RecordKey'], to: ['common', 'people', 'MemberNumber'],
    when: { RecordKind: 'person' } },
  { from: ['common', 'address_links', 'RecordKey'], to: ['common', 'organizations', 'OrgKey'],
    when: { RecordKind: 'org' } },
  { from: ['common', 'contact_methods', 'OwnerKey'], to: ['common', 'people', 'MemberNumber'],
    when: { OwnerKind: 'person' } },
  { from: ['common', 'contact_methods', 'OwnerKey'], to: ['common', 'organizations', 'OrgKey'],
    when: { OwnerKind: 'org' } },
  { from: ['platform', 'record_changes', 'RefKey'], to: ['issues', 'issues', 'IssueKey'],
    when: { RefKind: 'issue' } },
  { from: ['platform', 'record_changes', 'RefKey'], to: ['tasks', 'tasks', 'TaskKey'],
    when: { RefKind: 'task' } },
  { from: ['platform', 'record_changes', 'RefKey'], to: ['membership', 'membership_periods', 'PeriodKey'],
    when: { RefKind: 'period' } },
  { from: ['platform', 'record_changes', 'RefKey'], to: ['common', 'people', 'MemberNumber'],
    when: { RefKind: ['memberprofile', 'person'] } },
  { from: ['platform', 'record_changes', 'RefKey'], to: ['common', 'relationships', 'RelKey'],
    when: { RefKind: 'rel' } },
  { from: ['platform', 'user_favorites', 'RefKey'], to: ['common', 'people', 'MemberNumber'],
    when: { RefKind: 'memberprofile' } },
  { from: ['platform', 'list_details', 'RefKey'], to: ['common', 'people', 'MemberNumber'],
    when: { RefKind: 'memberprofile' } },
  { from: ['tasks', 'task_links', 'RefKey'], to: ['committees', 'committee_meetings', 'MeetingKey'],
    when: { RefKind: 'meeting' } },
  { from: ['tasks', 'task_links', 'RefKey'], to: ['common', 'people', 'MemberNumber'],
    when: { RefKind: 'person' } },
  { from: ['issues', 'issues', 'SourceRefKey'], to: ['common', 'organizations', 'OrgKey'],
    when: { SourceRefKind: 'org' } },
  { from: ['issues', 'issues', 'SourceRefKey'], to: ['events', 'event_registrations', 'RegKey'],
    when: { SourceRefKind: 'reg' } },
  { from: ['issues', 'issues', 'SourceRefKey'], to: ['common', 'people', 'MemberNumber'],
    when: { SourceRefKind: 'person' } },
  { from: ['issues', 'issues', 'SourceRefKey'], to: ['orders', 'orders', 'OrderKey'],
    when: { SourceRefKind: 'order' } },
];
