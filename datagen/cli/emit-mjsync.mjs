// mj-sync emitter: converts the JSON packs into an MJ metadata tree.
// Usage: node emit-mjsync.mjs [--out out] [--metadata-out <dir>]   (run build.mjs first)
//   --metadata-out points the tree anywhere — e.g. the app's `metadata/demo-data/` so a
//   `mj sync push` over that dir picks it up. Resolved against the CWD; default is the
//   disposable out/metadata/. Only THIS emitter's own entity folders are cleared on
//   regeneration — sibling content in the target dir (e.g. schema-info/) is left alone.
//
// Format per docs/template-docs/metadata.md: root .mj-sync.json with directoryOrder
// (parents before children — the pack pyramid), one folder per ENTITY with its own
// .mj-sync.json, records as dot-prefixed JSON arrays. Every record pins its primaryKey
// with our deterministic UUID (core/ids.mjs), so `mj sync push` is a stable upsert:
// re-push after a regeneration updates the same rows in place. FK fields carry literal
// pinned IDs (derived independently) — no @lookup needed.
//
// ✓ ENTITY NAMES VERIFIED (2026-07-13): a real CodeGen run against a cloned MJ database
//   (MoreCheese_Playground) minted exactly these names, and `mj sync push` round-tripped
//   ("no changes" vs SQL-loaded rows — pinned UUIDs make both load paths the same rows).
//   App-SEEDED lookups (committee Roles, issue Statuses) are referenced BY NAME (@lookup) —
//   the owning apps ship those rows (integration finding F6); we never emit them.
//   Table SHAPES remain provisional pending the reconciliation, and the common-pack
//   entities will eventually belong to bizapps-common, not MoreCheese.
// ⚠ `mj sync push` is a FULL RECONCILE per entity scope — it can DELETE rows that exist
//   in the DB but not in these files. Dev databases only; never over real data.
//
// Output defaults to out/metadata/ (inert); pass --metadata-out to write into the repo's
// live metadata/ tree (e.g. a dedicated metadata/demo-data/ folder) for a real `mj sync`.

import { readFileSync, writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { uuidFor } from '../engine/ids.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const args = Object.fromEntries(process.argv.slice(2).map((a, i, all) => (a.startsWith('--') ? [a.slice(2), all[i + 1]] : null)).filter(Boolean));
const PKG = join(HERE, '..');
const OUT = join(PKG, args.out ?? 'out');
const load = (pack, table) => JSON.parse(readFileSync(join(OUT, 'packs', pack, `${table}.json`), 'utf8'));
const run = JSON.parse(readFileSync(join(OUT, 'run.json'), 'utf8'));

const CHUNK = 5000; // records per file; big tables split across .part-N.json files

// ---------- mapping: pack table → entity folder (entity names verified vs CodeGen) ----------
const MAPPING = [
  // THE PERSON/ORG SPLIT (memo §2.2/2.3): identity → bizapps-common's entities (their
  // prefix, not ours); member/org-specific fields → our extension-profile entities.
  // No IsSharedDemo on their entities (§2.5) — demo rows identify via the profile join.
  {
    pack: 'common', json: 'organizations', dir: 'organizations', entity: 'MJ_BizApps_Common: Organizations',
    record: (r) => ({
      primaryKey: { ID: uuidFor('org', r.OrgKey) },
      fields: { Name: r.Name, Status: r.LifecycleEvent?.kind === 'Dissolved' ? 'Dissolved' : 'Active' },
    }),
  },
  {
    pack: 'common', json: 'organizations', dir: 'organization-profiles', entity: 'MoreCheese: Organization Profiles',
    record: (r) => ({
      primaryKey: { ID: uuidFor('orgprofile', r.OrgKey) },
      fields: {
        OrganizationID: uuidFor('org', r.OrgKey), OrgKey: r.OrgKey, Type: r.Type,
        Region: r.Region, City: r.City, State: r.State, Latitude: r.Latitude, Longitude: r.Longitude,
        LifecycleEventKind: r.LifecycleEvent?.kind ?? null, LifecycleEventYear: r.LifecycleEvent?.year ?? null,
        IsSharedDemo: r.IsSharedDemo,
      },
    }),
  },
  {
    pack: 'common', json: 'people', dir: 'people', entity: 'MJ_BizApps_Common: People',
    record: (r) => ({
      primaryKey: { ID: uuidFor('person', r.MemberNumber) },
      fields: { FirstName: r.FirstName, LastName: r.LastName, MiddleName: r.MiddleName, PreferredName: r.PreferredName, Title: r.Title, Email: r.Email, Status: 'Active' },
    }),
  },
  {
    pack: 'common', json: 'people', dir: 'member-profiles', entity: 'MoreCheese: Member Profiles',
    record: (r) => ({
      primaryKey: { ID: uuidFor('memberprofile', r.MemberNumber) },
      fields: {
        PersonID: uuidFor('person', r.MemberNumber),
        OrganizationID: r.OrgKey ? uuidFor('org', r.OrgKey) : null,
        MemberNumber: r.MemberNumber, Segment: r.Segment,
        Region: r.Region, City: r.City, State: r.State, Latitude: r.Latitude, Longitude: r.Longitude,
        JoinDate: r.JoinDate, IsSharedDemo: r.IsSharedDemo,
      },
    }),
  },
  { pack: 'membership', json: 'data_quality_labels', dir: 'data-quality-labels', entity: 'MoreCheese: Data Quality Labels',
    record: (r) => ({ primaryKey: { ID: uuidFor('dqlabel', r.LabelKey) }, fields: { LabelKey: r.LabelKey, DefectKind: r.DefectKind, PersonID: uuidFor('person', r.MemberNumber), RelatedPersonID: r.RelatedMemberNumber ? uuidFor('person', r.RelatedMemberNumber) : null, RelatedOrganizationID: r.RelatedOrgKey ? uuidFor('org', r.RelatedOrgKey) : null, DefectValue: r.DefectValue ?? null, TruthValue: r.TruthValue ?? null, Notes: r.Notes ?? null, IsSharedDemo: r.IsSharedDemo } }) },
  { pack: 'membership', json: 'advocacy_actions', dir: 'advocacy-actions', entity: 'MoreCheese: Advocacy Actions',
    record: (r) => ({ primaryKey: { ID: uuidFor('advocacy', r.ActionKey) }, fields: { ActionKey: r.ActionKey, PersonID: uuidFor('person', r.MemberNumber), ActionDate: r.ActionDate, Kind: r.Kind, Topic: r.Topic, IsSharedDemo: r.IsSharedDemo } }) },
  { pack: 'events', json: 'competition_entries', dir: 'competition-entries', entity: 'MoreCheese: Competition Entries',
    record: (r) => ({ primaryKey: { ID: uuidFor('compentry', r.EntryKey) }, fields: { EntryKey: r.EntryKey, PersonID: uuidFor('person', r.MemberNumber), OrganizationID: r.OrgKey ? uuidFor('org', r.OrgKey) : null, EntryYear: r.EntryYear, Category: r.Category, ProductName: r.ProductName, Result: r.Result, IsSharedDemo: r.IsSharedDemo } }) },
  { pack: 'learning', json: 'certifications', dir: 'certifications', entity: 'MoreCheese: Certifications',
    record: (r) => ({ primaryKey: { ID: uuidFor('cert', r.CertKey) }, fields: { CertKey: r.CertKey, Name: r.Name, ValidYears: r.ValidYears, IsSharedDemo: r.IsSharedDemo } }) },
  { pack: 'learning', json: 'member_certifications', dir: 'member-certifications', entity: 'MoreCheese: Member Certifications',
    record: (r) => ({ primaryKey: { ID: uuidFor('membercert', r.MemberCertKey) }, fields: { MemberCertKey: r.MemberCertKey, PersonID: uuidFor('person', r.MemberNumber), CertificationID: uuidFor('cert', r.CertKey), Status: r.Status, EnrolledOn: r.EnrolledOn, AwardedOn: r.AwardedOn, ExpiresOn: r.ExpiresOn, IsSharedDemo: r.IsSharedDemo } }) },
    {
    pack: 'membership', json: 'membership_periods', dir: 'membership-periods', entity: 'MoreCheese: Membership Periods',
    record: (r) => ({
      primaryKey: { ID: uuidFor('period', r.PeriodKey) },
      fields: {
        PeriodKey: r.PeriodKey, PersonID: uuidFor('person', r.MemberNumber),
        MembershipTier: r.MembershipTier, DuesAmount: r.DuesAmount,
        StartDate: r.StartDate, EndDate: r.EndDate, RenewalDate: r.RenewalDate,
        Status: r.Status, CancellationDate: r.CancellationDate, CancellationReason: r.CancellationReason,
        AutoRenew: r.AutoRenew, IsSharedDemo: r.IsSharedDemo,
      },
    }),
  },
  { pack: 'common', json: 'relationship_types', dir: 'relationship-types', entity: 'MJ_BizApps_Common: Relationship Types',
    record: (r) => ({ primaryKey: { ID: uuidFor('reltype', r.TypeKey) }, fields: { Name: r.Name, Description: r.Description, Category: r.Category, IsDirectional: r.IsDirectional, ForwardLabel: r.ForwardLabel, ReverseLabel: r.ReverseLabel, IsActive: r.IsActive } }) },
  { pack: 'common', json: 'relationships', dir: 'relationships', entity: 'MJ_BizApps_Common: Relationships',
    record: (r) => ({ primaryKey: { ID: uuidFor('rel', r.RelKey) }, fields: {
      RelationshipTypeID: r.TypeID ?? uuidFor('reltype', r.TypeKey),
      FromPersonID: r.FromMemberNumber ? uuidFor('person', r.FromMemberNumber) : null,
      FromOrganizationID: r.FromOrgKey ? uuidFor('org', r.FromOrgKey) : null,
      ToPersonID: r.ToMemberNumber ? uuidFor('person', r.ToMemberNumber) : null,
      ToOrganizationID: r.ToOrgKey ? uuidFor('org', r.ToOrgKey) : null,
      Title: r.Title ?? null, StartDate: r.StartDate, EndDate: r.EndDate, Status: r.Status, Notes: r.Notes ?? null,
    } }) },
    // committees pack → bizapps-committees entities (their prefix 'Committees: '); no IsSharedDemo
  { pack: 'committees', json: 'committee_types', dir: 'committee-types', entity: 'Committees: Types',
    record: (r) => ({ primaryKey: { ID: uuidFor('ctype', r.TypeKey) }, fields: { Name: r.Name, IsStandards: r.IsStandards, DefaultTermMonths: r.DefaultTermMonths } }) },
  { pack: 'committees', json: 'committees', dir: 'committees', entity: 'Committees: Committees',
    record: (r) => ({ primaryKey: { ID: uuidFor('committee', r.CommitteeKey) }, fields: { Name: r.Name, TypeID: uuidFor('ctype', r.TypeKey), MissionStatement: r.MissionStatement, Status: r.Status, IsPublic: true, FormationDate: r.FormationDate } }) },
  { pack: 'committees', json: 'committee_terms', dir: 'committee-terms', entity: 'Committees: Terms',
    record: (r) => ({ primaryKey: { ID: uuidFor('cterm', r.TermKey) }, fields: { CommitteeID: uuidFor('committee', r.CommitteeKey), Name: r.Name, StartDate: r.StartDate, EndDate: r.EndDate, Status: r.Status === 'Completed' ? 'Completed' : 'Active' } }) },
  { pack: 'committees', json: 'committee_memberships', dir: 'committee-memberships', entity: 'Committees: Memberships',
    record: (r) => ({ primaryKey: { ID: uuidFor('cmembership', r.MembershipKey) }, fields: { PersonID: uuidFor('person', r.MemberNumber), RoleID: `@lookup:Committees: Roles.Name=${r.RoleKey}`, TermID: uuidFor('cterm', r.TermKey), StartDate: r.StartDate, EndDate: r.EndDate, Status: r.Status } }) },
  { pack: 'committees', json: 'committee_meetings', dir: 'committee-meetings', entity: 'Committees: Meetings',
    record: (r) => ({ primaryKey: { ID: uuidFor('meeting', r.MeetingKey) }, fields: { CommitteeID: uuidFor('committee', r.CommitteeKey), Name: r.Name, StartDateTime: r.StartDateTime, TimeZone: 'UTC', LocationType: r.LocationType, Status: r.Status } }) },
  { pack: 'committees', json: 'committee_attendance', dir: 'committee-attendance', entity: 'Committees: Attendances',
    record: (r) => ({ primaryKey: { ID: uuidFor('att', r.AttendanceKey) }, fields: { MeetingID: uuidFor('meeting', r.MeetingKey), PersonID: uuidFor('person', r.MemberNumber), AttendanceStatus: r.AttendanceStatus } }) },
  { pack: 'committees', json: 'committee_agenda_items', dir: 'committee-agenda-items', entity: 'Committees: Agenda Items',
    record: (r) => ({ primaryKey: { ID: uuidFor('agenda', r.AgendaKey) }, fields: { MeetingID: uuidFor('meeting', r.MeetingKey), Sequence: r.Sequence, Name: r.Name, PresenterPersonID: uuidFor('person', r.PresenterMemberNumber), DurationMinutes: r.DurationMinutes, ItemType: r.ItemType, Status: r.Status } }) },
  { pack: 'committees', json: 'committee_motions', dir: 'committee-motions', entity: 'Committees: Motions',
    record: (r) => ({ primaryKey: { ID: uuidFor('motion', r.MotionKey) }, fields: { MeetingID: uuidFor('meeting', r.MeetingKey), AgendaItemID: uuidFor('agenda', r.AgendaKey), Sequence: r.Sequence, Name: r.Name, MovedByMembershipID: uuidFor('cmembership', r.MovedByMembershipKey), SecondedByMembershipID: uuidFor('cmembership', r.SecondedByMembershipKey), Result: r.Result, ResultSummary: r.ResultSummary, YesCount: r.YesCount, NoCount: r.NoCount, AbstainCount: r.AbstainCount } }) },
  { pack: 'committees', json: 'committee_votes', dir: 'committee-votes', entity: 'Committees: Votes',
    record: (r) => ({ primaryKey: { ID: uuidFor('vote', r.VoteKey) }, fields: { MotionID: uuidFor('motion', r.MotionKey), MembershipID: uuidFor('cmembership', r.MembershipKey), VoteValue: r.VoteValue } }) },
  // tasks pack → bizapps-tasks entities; polymorphic refs use @lookup by entity NAME
  { pack: 'tasks', json: 'task_types', dir: 'task-types', entity: 'MJ_BizApps_Tasks: Task Types',
    record: (r) => ({ primaryKey: { ID: uuidFor('tasktype', r.TypeKey) }, fields: { Name: r.Name, Description: r.Description, DefaultPriority: r.DefaultPriority, IsActive: r.IsActive } }) },
  { pack: 'tasks', json: 'tasks', dir: 'tasks', entity: 'MJ_BizApps_Tasks: Tasks',
    record: (r) => ({ primaryKey: { ID: uuidFor('task', r.TaskKey) }, fields: { Name: r.Name, TypeID: uuidFor('tasktype', r.TypeKey), Status: r.Status, Priority: r.Priority, DueAt: r.DueAt, CompletedAt: r.CompletedAt ?? null, PercentComplete: r.PercentComplete ?? 0, CreatedByPersonID: r.CreatedByMemberNumber ? uuidFor('person', r.CreatedByMemberNumber) : null } }) },
  { pack: 'tasks', json: 'task_assignments', dir: 'task-assignments', entity: 'MJ_BizApps_Tasks: Task Assignments',
    record: (r) => ({ primaryKey: { ID: uuidFor('taskassign', r.AssignKey) }, fields: { TaskID: uuidFor('task', r.TaskKey), AssigneeEntityID: `@lookup:Entities.Name=${r.AssigneeEntityName}`, AssigneeRecordID: uuidFor('person', r.AssigneeMemberNumber), Status: r.Status } }) },
  { pack: 'tasks', json: 'task_links', dir: 'task-links', entity: 'MJ_BizApps_Tasks: Task Links',
    record: (r) => ({ primaryKey: { ID: uuidFor('tasklink', r.LinkKey) }, fields: { TaskID: uuidFor('task', r.TaskKey), EntityID: `@lookup:Entities.Name=${r.EntityName}`, RecordID: r.RefKind === 'meeting' ? uuidFor('meeting', r.RefKey) : uuidFor('person', r.RefKey) } }) },
  // issues pack → bizapps-issues entities
  { pack: 'issues', json: 'issue_types', dir: 'issue-types', entity: 'MJ_BizApps_Issues: Issue Types',
    record: (r) => ({ primaryKey: { ID: uuidFor('issuetype', r.TypeKey) }, fields: { Name: r.Name, Description: r.Description, DefaultPriority: r.DefaultPriority, IsActive: r.IsActive } }) },
  { pack: 'issues', json: 'issues', dir: 'issues', entity: 'MJ_BizApps_Issues: Issues',
    record: (r) => ({ primaryKey: { ID: uuidFor('issue', r.IssueKey) }, fields: { IssueNumber: r.IssueNumber, Title: r.Title, IssueTypeID: uuidFor('issuetype', r.TypeKey), StatusID: `@lookup:MJ_BizApps_Issues: Issue Statuses.Name=${r.StatusKey}`, Severity: r.Severity, Priority: r.Priority, ReporterPersonID: uuidFor('person', r.ReporterMemberNumber), AssigneeEntityID: r.AssigneeMemberNumber ? `@lookup:Entities.Name=${r.AssigneeEntityName}` : null, AssigneeRecordID: r.AssigneeMemberNumber ? uuidFor('person', r.AssigneeMemberNumber) : null, SourceEntityID: `@lookup:Entities.Name=${r.SourceEntityName}`, SourceRecordID: { order: uuidFor('order', r.SourceRefKey), org: uuidFor('org', r.SourceRefKey), reg: uuidFor('reg', r.SourceRefKey), person: uuidFor('person', r.SourceRefKey) }[r.SourceRefKind], ResolvedAt: r.ResolvedAt, ClosedAt: r.ClosedAt } }) },
  { pack: 'issues', json: 'issue_sequences', dir: 'issue-sequences', entity: 'MJ_BizApps_Issues: Issue Number Sequences',
    record: (r) => ({ primaryKey: { ScopeCode: r.ScopeCode }, fields: { NextSequenceNumber: r.NextSequenceNumber } }) },
  // messaging pack → bizapps-secure-messaging entities (soft person refs — plain UUIDs)
  { pack: 'messaging', json: 'portal_sessions', dir: 'portal-sessions', entity: 'MJ_BizApps_SecureMessaging: Portal Sessions',
    record: (r) => ({ primaryKey: { ID: uuidFor('psession', r.SessionKey) }, fields: { ContactID: uuidFor('person', r.MemberNumber), TokenHash: r.TokenHash, Status: r.Status, ExpiresAt: r.ExpiresAt, LastAccessedAt: r.LastAccessedAt } }) },
  { pack: 'messaging', json: 'secure_threads', dir: 'secure-threads', entity: 'MJ_BizApps_SecureMessaging: Secure Threads',
    record: (r) => ({ primaryKey: { ID: uuidFor('thread', r.ThreadKey) }, fields: { ContactID: uuidFor('person', r.MemberNumber), Subject: r.Subject, Status: r.Status, SourceChannel: r.SourceChannel, CreatedByUserID: null, LastMessageAt: r.LastMessageAt, IsDeleted: r.IsDeleted } }) },
  { pack: 'messaging', json: 'secure_messages', dir: 'secure-messages', entity: 'MJ_BizApps_SecureMessaging: Secure Messages',
    record: (r) => ({ primaryKey: { ID: uuidFor('secmsg', r.MessageKey) }, fields: { PortalSessionID: uuidFor('psession', r.SessionKey), ThreadID: uuidFor('thread', r.ThreadKey), PersonID: r.MemberNumber ? uuidFor('person', r.MemberNumber) : null, Direction: r.Direction, Sender: r.Sender, Recipient: r.Recipient, Subject: r.Subject, Content: r.Content, IsSecure: r.IsSecure, Status: r.Status, ReceivedAt: r.ReceivedAt, IsStarred: r.IsStarred, IsImported: r.IsImported, SourceChannel: r.SourceChannel } }) },
    // forms pack → bizapps-forms entities (their prefix 'MJ_BizApps_Forms: ')
  { pack: 'forms', json: 'forms', dir: 'forms', entity: 'MJ_BizApps_Forms: Forms',
    record: (r) => ({ primaryKey: { ID: uuidFor('form', r.FormKey) }, fields: { Name: r.Name, Description: r.Description, Status: r.Status, RenderMode: r.RenderMode } }) },
  { pack: 'forms', json: 'form_versions', dir: 'form-versions', entity: 'MJ_BizApps_Forms: Form Versions',
    record: (r) => ({ primaryKey: { ID: uuidFor('formver', r.VersionKey) }, fields: { FormID: uuidFor('form', r.FormKey), VersionNumber: r.VersionNumber, Status: r.Status, PublishedAt: r.PublishedAt } }) },
  { pack: 'forms', json: 'form_pages', dir: 'form-pages', entity: 'MJ_BizApps_Forms: Form Pages',
    record: (r) => ({ primaryKey: { ID: uuidFor('formpage', r.PageKey) }, fields: { FormID: uuidFor('form', r.FormKey), Title: r.Title, DisplayOrder: r.DisplayOrder } }) },
  { pack: 'forms', json: 'form_questions', dir: 'form-questions', entity: 'MJ_BizApps_Forms: Form Questions',
    record: (r) => ({ primaryKey: { ID: uuidFor('formq', r.QuestionKey) }, fields: { FormID: uuidFor('form', r.FormKey), PageID: uuidFor('formpage', r.PageKey), QuestionType: r.QuestionType, Prompt: r.Prompt, IsRequired: r.IsRequired, DisplayOrder: r.DisplayOrder } }) },
  { pack: 'forms', json: 'form_question_options', dir: 'form-question-options', entity: 'MJ_BizApps_Forms: Form Question Options',
    record: (r) => ({ primaryKey: { ID: uuidFor('formqopt', r.OptionKey) }, fields: { QuestionID: uuidFor('formq', r.QuestionKey), Label: r.Label, Value: r.Value, DisplayOrder: r.DisplayOrder, IsDefault: r.IsDefault } }) },
  { pack: 'forms', json: 'form_distributions', dir: 'form-distributions', entity: 'MJ_BizApps_Forms: Form Distributions',
    record: (r) => ({ primaryKey: { ID: uuidFor('formdist', r.DistributionKey) }, fields: { FormID: uuidFor('form', r.FormKey), Name: r.Name, ChannelType: r.ChannelType, Status: r.Status, OpenAt: r.OpenAt, CloseAt: r.CloseAt, ResponseCount: r.ResponseCount, CaptchaRequired: false, IsActive: r.Status !== 'Closed' } }) },
  { pack: 'forms', json: 'form_responses', dir: 'form-responses', entity: 'MJ_BizApps_Forms: Form Responses',
    record: (r) => ({ primaryKey: { ID: uuidFor('formresp', r.ResponseKey) }, fields: { FormID: uuidFor('form', r.FormKey), FormVersionID: uuidFor('formver', r.VersionKey), Status: r.Status, RespondentPersonID: r.MemberNumber ? uuidFor('person', r.MemberNumber) : null, AnonymousSessionID: r.AnonymousSessionID ?? null, SourceMetadata: r.SourceMetadata ?? null, StartedAt: r.StartedAt ?? null, SubmittedAt: r.SubmittedAt } }) },
  { pack: 'forms', json: 'form_answers', dir: 'form-answers', entity: 'MJ_BizApps_Forms: Form Response Answers',
    record: (r) => ({ primaryKey: { ID: uuidFor('formans', r.AnswerKey) }, fields: { ResponseID: uuidFor('formresp', r.ResponseKey), QuestionID: uuidFor('formq', r.QuestionKey), TextValue: r.TextValue ?? null, NumericValue: r.NumericValue ?? null, BooleanValue: r.BooleanValue ?? null } }) },
  {
    pack: 'events', json: 'events', dir: 'events', entity: 'MoreCheese: Events',
    record: (r) => ({
      primaryKey: { ID: uuidFor('event', r.EventKey) },
      fields: {
        EventKey: r.EventKey, Name: r.Name, EventType: r.EventType, EventDate: r.Date,
        IsVirtual: r.IsVirtual, IsPaid: r.IsPaid, City: r.City, State: r.State,
        Latitude: r.Latitude, Longitude: r.Longitude, IsSharedDemo: r.IsSharedDemo,
      },
    }),
  },
  {
    pack: 'events', json: 'event_registrations', dir: 'event-registrations', entity: 'MoreCheese: Event Registrations',
    record: (r) => ({
      primaryKey: { ID: uuidFor('reg', r.RegKey) },
      fields: {
        RegKey: r.RegKey, PersonID: uuidFor('person', r.MemberNumber), EventID: uuidFor('event', r.EventKey),
        RegisteredOn: r.RegisteredOn, Attended: r.Attended, IsSharedDemo: r.IsSharedDemo,
      },
    }),
  },
  {
    pack: 'learning', json: 'courses', dir: 'courses', entity: 'MoreCheese: Courses',
    record: (r) => ({
      primaryKey: { ID: uuidFor('course', r.CourseKey) },
      fields: { CourseKey: r.CourseKey, Name: r.Name, StartDate: r.StartDate, DurationWeeks: r.DurationWeeks, IsSharedDemo: r.IsSharedDemo },
    }),
  },
  {
    pack: 'learning', json: 'enrollments', dir: 'enrollments', entity: 'MoreCheese: Course Enrollments',
    record: (r) => ({
      primaryKey: { ID: uuidFor('enroll', r.EnrollKey) },
      fields: {
        EnrollKey: r.EnrollKey, PersonID: uuidFor('person', r.MemberNumber), CourseID: uuidFor('course', r.CourseKey),
        EnrolledOn: r.EnrolledOn, Status: r.Status, CompletedOn: r.CompletedOn, IsSharedDemo: r.IsSharedDemo,
      },
    }),
  },
  {
    pack: 'orders', json: 'products', dir: 'products', entity: 'MoreCheese: Products',
    record: (r) => ({
      primaryKey: { ID: uuidFor('product', r.ProductKey) },
      fields: { ProductKey: r.ProductKey, Name: r.Name, ProductType: r.ProductType, UnitPrice: r.UnitPrice, IsSharedDemo: r.IsSharedDemo },
    }),
  },
  {
    pack: 'orders', json: 'orders', dir: 'orders', entity: 'MoreCheese: Orders',
    record: (r) => ({
      primaryKey: { ID: uuidFor('order', r.OrderKey) },
      fields: {
        OrderKey: r.OrderKey, PersonID: uuidFor('person', r.MemberNumber), OrderType: r.OrderType, Status: r.Status,
        OrderDate: r.OrderDate, DueDate: r.DueDate, TotalGross: r.TotalGross, PaymentStatus: r.PaymentStatus, IsSharedDemo: r.IsSharedDemo,
      },
    }),
  },
  {
    pack: 'orders', json: 'order_lines', dir: 'order-lines', entity: 'MoreCheese: Order Lines',
    record: (r) => ({
      primaryKey: { ID: uuidFor('line', r.LineKey) },
      fields: {
        LineKey: r.LineKey, OrderID: uuidFor('order', r.OrderKey), ProductID: uuidFor('product', r.ProductKey),
        Quantity: r.Quantity, UnitPrice: r.UnitPrice, LineTotal: r.LineTotal, IsSharedDemo: r.IsSharedDemo,
      },
    }),
  },
  {
    pack: 'orders', json: 'payments', dir: 'payments', entity: 'MoreCheese: Payments',
    record: (r) => ({
      primaryKey: { ID: uuidFor('payment', r.PaymentKey) },
      fields: {
        PaymentKey: r.PaymentKey, OrderID: uuidFor('order', r.OrderKey), Amount: r.Amount,
        PaymentDate: r.PaymentDate, Method: r.Method, Status: r.Status, IsSharedDemo: r.IsSharedDemo,
      },
    }),
  },
];

// ---------- emit the tree ----------
// --metadata-out targets any dir (default: disposable out/metadata/). We do NOT wipe the
// whole target — only our own entity folders (below) — so pointing this at a shared
// metadata/ tree can't delete a sibling like schema-info/.
const ROOT = args['metadata-out'] ? resolve(args['metadata-out']) : join(OUT, 'metadata');
mkdirSync(ROOT, { recursive: true });

writeFileSync(join(ROOT, '.mj-sync.json'), JSON.stringify({
  version: '1.0.0',
  push: { autoCreateMissingRecords: true },
  directoryOrder: MAPPING.map((m) => m.dir), // the pack pyramid: parents before children
}, null, 2));

writeFileSync(join(ROOT, 'README.md'), [
  '# Generated mj-sync metadata (datagen)',
  '',
  `Generated by \`datagen/emit-mjsync.mjs\` · seed ${run.seed} · release ${run.releaseDate} · ruleset v${run.ruleset}.`,
  'Deterministic: same seed + release regenerates this tree byte-identically; primary keys are',
  'pinned (uuidv5 of business keys), so `mj sync push` upserts the same rows every time.',
  '',
  '⚠ Entity names are ASSUMED until the schema reconciliation + CodeGen — verify before pushing.',
  '⚠ `mj sync push` is a full reconcile: it can DELETE rows not present in these files. Dev DBs only.',
].join('\n'));

const summary = [];
for (const m of MAPPING) {
  const dir = join(ROOT, m.dir);
  rmSync(dir, { recursive: true, force: true }); // clear only OUR entity dir — never siblings
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, '.mj-sync.json'), JSON.stringify({ entity: m.entity, filePattern: '**/.*.json' }, null, 2));
  const rows = load(m.pack, m.json).map(m.record);
  const chunks = [];
  for (let i = 0; i < rows.length; i += CHUNK) chunks.push(rows.slice(i, i + CHUNK));
  chunks.forEach((chunk, i) => {
    const name = chunks.length === 1 ? `.${m.dir}.json` : `.${m.dir}.part-${String(i + 1).padStart(2, '0')}.json`;
    writeFileSync(join(dir, name), JSON.stringify(chunk, null, 2));
  });
  summary.push({ dir: m.dir, entity: m.entity, rows: rows.length, files: chunks.length });
}

for (const s of summary) console.log(`${s.dir.padEnd(22)} → "${s.entity}"  ${String(s.rows).padStart(6)} records in ${s.files} file(s)`);
console.log(`metadata tree → ${ROOT}`);
