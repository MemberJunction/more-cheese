// ==== SHARED SEED MAPPING (extracted from emit-sql.mjs so the SQL-seed emitter and the
// data-migration emitter can NEVER drift) ====
//
// Pure data + functions (no file I/O, no execution): the JSON-pack → SQL-table MAPPING, the
// per-table column projections (with deterministic uuidv5 IDs via uuidFor), the polymorphic-ref
// PREAMBLE, the pack INSTALL_ORDER (the dependency pyramid), and the VALUES batch size + SQL value
// formatters. Both emitters import from here; each owns only its OWN output concern (out/sql vs
// migrations/). See emit-sql.mjs / emit-data-migration.mjs.
import { uuidFor } from './ids.mjs';

export const sqlStr = (v) => v == null ? 'NULL' : `N'${String(v).replace(/'/g, "''")}'`;
export const sqlNum = (v) => v == null ? 'NULL' : String(v);
export const sqlBit = (v) => v == null ? 'NULL' : v ? '1' : '0';
export const sqlDate = (v) => v == null ? 'NULL' : `'${v}'`;
export const sqlId = (v) => v == null ? 'NULL' : `'${v}'`;
export const sqlVar = (v) => v; // raw expression (e.g. a DECLAREd @Entity variable) — polymorphic refs resolve by NAME at load time

// ---------- the mapping: JSON pack tables → SQL tables (ASSUMED shapes) ----------
// THE PERSON/ORG SPLIT (Marcelo's v2-plan §4.2 ruling, landed 2026-07-14): identity rows go
// to bizapps-common's tables (their REAL columns, from bizapps-common
// migrations/B202602271452); everything member-ish becomes an extension-profile row in OUR
// morecheese_members schema carrying the PersonID/OrganizationID. The pinned uuidv5 IDs make
// the FK pairs line up by construction — parent and child derive them independently.
// IsSharedDemo never goes on bizapps-common tables (not ours to alter — memo §2.5); demo
// rows are identifiable through their profile row.
export const MAPPING = {
  common: [
    {
      json: 'organizations', table: '[__mj_BizAppsCommon].[Organization]',
      columns: (r) => ({
        ID: sqlId(uuidFor('org', r.OrgKey)), Name: sqlStr(r.Name),
        // their Status CHECK: Active|Inactive|Dissolved — our dissolution stories map straight on
        Status: sqlStr(r.LifecycleEvent?.kind === 'Dissolved' ? 'Dissolved' : 'Active'),
      }),
    },
    {
      json: 'organizations', table: '[morecheese_members].[OrganizationProfile]',
      columns: (r) => ({
        ID: sqlId(uuidFor('orgprofile', r.OrgKey)), OrganizationID: sqlId(uuidFor('org', r.OrgKey)),
        OrgKey: sqlStr(r.OrgKey), Type: sqlStr(r.Type), Region: sqlStr(r.Region), City: sqlStr(r.City), State: sqlStr(r.State),
        Latitude: sqlNum(r.Latitude), Longitude: sqlNum(r.Longitude),
        LifecycleEventKind: sqlStr(r.LifecycleEvent?.kind ?? null), LifecycleEventYear: sqlNum(r.LifecycleEvent?.year ?? null),
        IsSharedDemo: sqlBit(r.IsSharedDemo),
      }),
    },
    {
      json: 'relationship_types', table: '[__mj_BizAppsCommon].[RelationshipType]',
      columns: (r) => ({
        ID: sqlId(uuidFor('reltype', r.TypeKey)), Name: sqlStr(r.Name), Description: sqlStr(r.Description),
        Category: sqlStr(r.Category), IsDirectional: sqlBit(r.IsDirectional), ForwardLabel: sqlStr(r.ForwardLabel),
        ReverseLabel: sqlStr(r.ReverseLabel), IsActive: sqlBit(r.IsActive),
      }),
    },
    {
      json: 'people', table: '[__mj_BizAppsCommon].[Person]',
      columns: (r) => ({
        ID: sqlId(uuidFor('person', r.MemberNumber)),
        FirstName: sqlStr(r.FirstName), LastName: sqlStr(r.LastName), MiddleName: sqlStr(r.MiddleName), PreferredName: sqlStr(r.PreferredName), Title: sqlStr(r.Title), Email: sqlStr(r.Email),
        Status: sqlStr('Active'), // member-lifecycle states live on MembershipPeriod, never here (memo §2.2)
      }),
    },
    {
      json: 'people', table: '[morecheese_members].[MemberProfile]',
      columns: (r) => ({
        ID: sqlId(uuidFor('memberprofile', r.MemberNumber)), PersonID: sqlId(uuidFor('person', r.MemberNumber)),
        OrganizationID: sqlId(r.OrgKey ? uuidFor('org', r.OrgKey) : null),
        MemberNumber: sqlStr(r.MemberNumber), Segment: sqlStr(r.Segment),
        Region: sqlStr(r.Region), City: sqlStr(r.City), State: sqlStr(r.State),
        Latitude: sqlNum(r.Latitude), Longitude: sqlNum(r.Longitude),
        JoinDate: sqlDate(r.JoinDate), IsSharedDemo: sqlBit(r.IsSharedDemo),
      }),
    },
    {
      json: 'relationships', table: '[__mj_BizAppsCommon].[Relationship]',
      columns: (r) => ({
        ID: sqlId(uuidFor('rel', r.RelKey)),
        RelationshipTypeID: sqlId(r.TypeID ?? uuidFor('reltype', r.TypeKey)),
        FromPersonID: sqlId(r.FromMemberNumber ? uuidFor('person', r.FromMemberNumber) : null),
        FromOrganizationID: sqlId(r.FromOrgKey ? uuidFor('org', r.FromOrgKey) : null),
        ToPersonID: sqlId(r.ToMemberNumber ? uuidFor('person', r.ToMemberNumber) : null),
        ToOrganizationID: sqlId(r.ToOrgKey ? uuidFor('org', r.ToOrgKey) : null),
        Title: sqlStr(r.Title ?? null), StartDate: sqlDate(r.StartDate), EndDate: sqlDate(r.EndDate),
        Status: sqlStr(r.Status), Notes: sqlStr(r.Notes ?? null),
      }),
    },
  ],
  membership: [
    {
      json: 'data_quality_labels', table: '[morecheese_members].[DataQualityLabel]',
      columns: (r) => ({
        ID: sqlId(uuidFor('dqlabel', r.LabelKey)), LabelKey: sqlStr(r.LabelKey), DefectKind: sqlStr(r.DefectKind),
        PersonID: sqlId(uuidFor('person', r.MemberNumber)),
        RelatedPersonID: sqlId(r.RelatedMemberNumber ? uuidFor('person', r.RelatedMemberNumber) : null),
        RelatedOrganizationID: sqlId(r.RelatedOrgKey ? uuidFor('org', r.RelatedOrgKey) : null),
        DefectValue: sqlStr(r.DefectValue ?? null), TruthValue: sqlStr(r.TruthValue ?? null),
        Notes: sqlStr(r.Notes ?? null), IsSharedDemo: sqlBit(r.IsSharedDemo),
      }),
    },
    {
      json: 'advocacy_actions', table: '[morecheese_members].[AdvocacyAction]',
      columns: (r) => ({
        ID: sqlId(uuidFor('advocacy', r.ActionKey)), ActionKey: sqlStr(r.ActionKey),
        PersonID: sqlId(uuidFor('person', r.MemberNumber)), ActionDate: sqlDate(r.ActionDate),
        Kind: sqlStr(r.Kind), Topic: sqlStr(r.Topic), IsSharedDemo: sqlBit(r.IsSharedDemo),
      }),
    },
    {
      json: 'membership_periods', table: '[morecheese_members].[MembershipPeriod]',
      columns: (r) => ({
        ID: sqlId(uuidFor('period', r.PeriodKey)), PeriodKey: sqlStr(r.PeriodKey),
        PersonID: sqlId(uuidFor('person', r.MemberNumber)),
        MembershipTier: sqlStr(r.MembershipTier), DuesAmount: sqlNum(r.DuesAmount),
        StartDate: sqlDate(r.StartDate), EndDate: sqlDate(r.EndDate), RenewalDate: sqlDate(r.RenewalDate),
        Status: sqlStr(r.Status), CancellationDate: sqlDate(r.CancellationDate), CancellationReason: sqlStr(r.CancellationReason),
        AutoRenew: sqlBit(r.AutoRenew), IsSharedDemo: sqlBit(r.IsSharedDemo),
      }),
    },
  ],
  learning: [
    {
      json: 'certifications', table: '[morecheese_learning].[Certification]',
      columns: (r) => ({ ID: sqlId(uuidFor('cert', r.CertKey)), CertKey: sqlStr(r.CertKey), Name: sqlStr(r.Name), ValidYears: sqlNum(r.ValidYears), IsSharedDemo: sqlBit(r.IsSharedDemo) }),
    },
    {
      json: 'member_certifications', table: '[morecheese_learning].[MemberCertification]',
      columns: (r) => ({
        ID: sqlId(uuidFor('membercert', r.MemberCertKey)), MemberCertKey: sqlStr(r.MemberCertKey),
        PersonID: sqlId(uuidFor('person', r.MemberNumber)), CertificationID: sqlId(uuidFor('cert', r.CertKey)),
        Status: sqlStr(r.Status), EnrolledOn: sqlDate(r.EnrolledOn), AwardedOn: sqlDate(r.AwardedOn), ExpiresOn: sqlDate(r.ExpiresOn),
        IsSharedDemo: sqlBit(r.IsSharedDemo),
      }),
    },
    {
      json: 'courses', table: '[morecheese_learning].[Course]',
      columns: (r) => ({
        ID: sqlId(uuidFor('course', r.CourseKey)), CourseKey: sqlStr(r.CourseKey), Name: sqlStr(r.Name),
        StartDate: sqlDate(r.StartDate), DurationWeeks: sqlNum(r.DurationWeeks), IsSharedDemo: sqlBit(r.IsSharedDemo),
      }),
    },
    {
      json: 'enrollments', table: '[morecheese_learning].[CourseEnrollment]',
      columns: (r) => ({
        ID: sqlId(uuidFor('enroll', r.EnrollKey)), EnrollKey: sqlStr(r.EnrollKey),
        PersonID: sqlId(uuidFor('person', r.MemberNumber)), CourseID: sqlId(uuidFor('course', r.CourseKey)),
        EnrolledOn: sqlDate(r.EnrolledOn), Status: sqlStr(r.Status), CompletedOn: sqlDate(r.CompletedOn),
        IsSharedDemo: sqlBit(r.IsSharedDemo),
      }),
    },
  ],
  orders: [
    {
      json: 'products', table: '[morecheese_orders].[Product]',
      columns: (r) => ({
        ID: sqlId(uuidFor('product', r.ProductKey)), ProductKey: sqlStr(r.ProductKey), Name: sqlStr(r.Name),
        ProductType: sqlStr(r.ProductType), UnitPrice: sqlNum(r.UnitPrice), IsSharedDemo: sqlBit(r.IsSharedDemo),
      }),
    },
    {
      json: 'orders', table: '[morecheese_orders].[Order]',
      columns: (r) => ({
        ID: sqlId(uuidFor('order', r.OrderKey)), OrderKey: sqlStr(r.OrderKey),
        PersonID: sqlId(uuidFor('person', r.MemberNumber)), OrderType: sqlStr(r.OrderType), Status: sqlStr(r.Status),
        OrderDate: sqlDate(r.OrderDate), DueDate: sqlDate(r.DueDate), TotalGross: sqlNum(r.TotalGross),
        PaymentStatus: sqlStr(r.PaymentStatus), IsSharedDemo: sqlBit(r.IsSharedDemo),
      }),
    },
    {
      json: 'order_lines', table: '[morecheese_orders].[OrderLine]',
      columns: (r) => ({
        ID: sqlId(uuidFor('line', r.LineKey)), OrderID: sqlId(uuidFor('order', r.OrderKey)),
        ProductID: sqlId(uuidFor('product', r.ProductKey)), Quantity: sqlNum(r.Quantity),
        UnitPrice: sqlNum(r.UnitPrice), LineTotal: sqlNum(r.LineTotal), IsSharedDemo: sqlBit(r.IsSharedDemo),
      }),
    },
    {
      json: 'payments', table: '[morecheese_orders].[Payment]',
      columns: (r) => ({
        ID: sqlId(uuidFor('payment', r.PaymentKey)), OrderID: sqlId(uuidFor('order', r.OrderKey)),
        Amount: sqlNum(r.Amount), PaymentDate: sqlDate(r.PaymentDate), Method: sqlStr(r.Method),
        Status: sqlStr(r.Status), IsSharedDemo: sqlBit(r.IsSharedDemo),
      }),
    },
  ],
  committees: [
    // bizapps-committees' REAL shapes (B202602151200) — no IsSharedDemo (their tables, §2.5 logic)
    {
      json: 'committee_types', table: '[__mj_BizAppsCommittees].[Type]',
      columns: (r) => ({ ID: sqlId(uuidFor('ctype', r.TypeKey)), Name: sqlStr(r.Name), IsStandards: sqlBit(r.IsStandards), DefaultTermMonths: sqlNum(r.DefaultTermMonths) }),
    },
    {
      json: 'committees', table: '[__mj_BizAppsCommittees].[Committee]',
      columns: (r) => ({
        ID: sqlId(uuidFor('committee', r.CommitteeKey)), Name: sqlStr(r.Name), TypeID: sqlId(uuidFor('ctype', r.TypeKey)),
        MissionStatement: sqlStr(r.MissionStatement), Status: sqlStr(r.Status), IsPublic: sqlBit(true), FormationDate: sqlDate(r.FormationDate),
      }),
    },
    {
      json: 'committee_terms', table: '[__mj_BizAppsCommittees].[Term]',
      columns: (r) => ({
        ID: sqlId(uuidFor('cterm', r.TermKey)), CommitteeID: sqlId(uuidFor('committee', r.CommitteeKey)),
        Name: sqlStr(r.Name), StartDate: sqlDate(r.StartDate), EndDate: sqlDate(r.EndDate), Status: sqlStr(r.Status === 'Completed' ? 'Completed' : 'Active'),
      }),
    },
    {
      json: 'committee_memberships', table: '[__mj_BizAppsCommittees].[Membership]',
      columns: (r) => ({
        ID: sqlId(uuidFor('cmembership', r.MembershipKey)), PersonID: sqlId(uuidFor('person', r.MemberNumber)),
        RoleID: sqlVar({ Chair: '@Role_Chair', 'Vice Chair': '@Role_ViceChair', Member: '@Role_Member' }[r.RoleKey]), TermID: sqlId(uuidFor('cterm', r.TermKey)),
        StartDate: sqlDate(r.StartDate), EndDate: sqlDate(r.EndDate), Status: sqlStr(r.Status),
      }),
    },
    {
      json: 'committee_meetings', table: '[__mj_BizAppsCommittees].[Meeting]',
      columns: (r) => ({
        ID: sqlId(uuidFor('meeting', r.MeetingKey)), CommitteeID: sqlId(uuidFor('committee', r.CommitteeKey)),
        Name: sqlStr(r.Name), StartDateTime: sqlDate(r.StartDateTime), TimeZone: sqlStr('UTC'),
        LocationType: sqlStr(r.LocationType), Status: sqlStr(r.Status),
      }),
    },
    {
      json: 'committee_attendance', table: '[__mj_BizAppsCommittees].[Attendance]',
      columns: (r) => ({
        ID: sqlId(uuidFor('att', r.AttendanceKey)), MeetingID: sqlId(uuidFor('meeting', r.MeetingKey)),
        PersonID: sqlId(uuidFor('person', r.MemberNumber)), AttendanceStatus: sqlStr(r.AttendanceStatus),
      }),
    },
    {
      json: 'committee_agenda_items', table: '[__mj_BizAppsCommittees].[AgendaItem]',
      columns: (r) => ({
        ID: sqlId(uuidFor('agenda', r.AgendaKey)), MeetingID: sqlId(uuidFor('meeting', r.MeetingKey)),
        Sequence: sqlNum(r.Sequence), Name: sqlStr(r.Name),
        PresenterPersonID: sqlId(uuidFor('person', r.PresenterMemberNumber)), DurationMinutes: sqlNum(r.DurationMinutes),
        ItemType: sqlStr(r.ItemType), Status: sqlStr(r.Status),
      }),
    },
    {
      json: 'committee_motions', table: '[__mj_BizAppsCommittees].[Motion]',
      columns: (r) => ({
        ID: sqlId(uuidFor('motion', r.MotionKey)), MeetingID: sqlId(uuidFor('meeting', r.MeetingKey)),
        AgendaItemID: sqlId(uuidFor('agenda', r.AgendaKey)), Sequence: sqlNum(r.Sequence), Name: sqlStr(r.Name),
        MovedByMembershipID: sqlId(uuidFor('cmembership', r.MovedByMembershipKey)),
        SecondedByMembershipID: sqlId(uuidFor('cmembership', r.SecondedByMembershipKey)),
        Result: sqlStr(r.Result), ResultSummary: sqlStr(r.ResultSummary),
        YesCount: sqlNum(r.YesCount), NoCount: sqlNum(r.NoCount), AbstainCount: sqlNum(r.AbstainCount),
      }),
    },
    {
      json: 'committee_votes', table: '[__mj_BizAppsCommittees].[Vote]',
      columns: (r) => ({
        ID: sqlId(uuidFor('vote', r.VoteKey)), MotionID: sqlId(uuidFor('motion', r.MotionKey)),
        MembershipID: sqlId(uuidFor('cmembership', r.MembershipKey)), VoteValue: sqlStr(r.VoteValue),
      }),
    },
  ],
  tasks: [
    // bizapps-tasks' REAL shapes (B202604011500). Polymorphic assignee/link references
    // resolve by ENTITY NAME through the pack preamble's DECLAREd variables.
    {
      json: 'task_types', table: '[__mj_BizAppsTasks].[TaskType]',
      columns: (r) => ({ ID: sqlId(uuidFor('tasktype', r.TypeKey)), Name: sqlStr(r.Name), Description: sqlStr(r.Description), DefaultPriority: sqlStr(r.DefaultPriority), IsActive: sqlBit(r.IsActive) }),
    },
    {
      json: 'tasks', table: '[__mj_BizAppsTasks].[Task]',
      columns: (r) => ({
        ID: sqlId(uuidFor('task', r.TaskKey)), Name: sqlStr(r.Name), TypeID: sqlId(uuidFor('tasktype', r.TypeKey)),
        Status: sqlStr(r.Status), Priority: sqlStr(r.Priority), DueAt: sqlDate(r.DueAt), CompletedAt: sqlDate(r.CompletedAt ?? null),
        PercentComplete: sqlNum(r.PercentComplete ?? 0),
        CreatedByPersonID: sqlId(r.CreatedByMemberNumber ? uuidFor('person', r.CreatedByMemberNumber) : null),
      }),
    },
    {
      json: 'task_assignments', table: '[__mj_BizAppsTasks].[TaskAssignment]',
      columns: (r) => ({
        ID: sqlId(uuidFor('taskassign', r.AssignKey)), TaskID: sqlId(uuidFor('task', r.TaskKey)),
        AssigneeEntityID: sqlVar('@E_People'), AssigneeRecordID: sqlId(uuidFor('person', r.AssigneeMemberNumber)),
        Status: sqlStr(r.Status),
      }),
    },
    {
      json: 'task_links', table: '[__mj_BizAppsTasks].[TaskLink]',
      columns: (r) => ({
        ID: sqlId(uuidFor('tasklink', r.LinkKey)), TaskID: sqlId(uuidFor('task', r.TaskKey)),
        EntityID: sqlVar(r.EntityName === 'Committees: Meetings' ? '@E_Meetings' : '@E_People'),
        RecordID: sqlId(r.RefKind === 'meeting' ? uuidFor('meeting', r.RefKey) : uuidFor('person', r.RefKey)),
      }),
    },
  ],
  issues: [
    // bizapps-issues' REAL shapes (B202606091000). Source references are polymorphic.
    {
      json: 'issue_types', table: '[__mj_BizAppsIssues].[IssueType]',
      columns: (r) => ({ ID: sqlId(uuidFor('issuetype', r.TypeKey)), Name: sqlStr(r.Name), Description: sqlStr(r.Description), DefaultPriority: sqlStr(r.DefaultPriority), IsActive: sqlBit(r.IsActive) }),
    },
    {
      json: 'issues', table: '[__mj_BizAppsIssues].[Issue]',
      columns: (r) => ({
        ID: sqlId(uuidFor('issue', r.IssueKey)), IssueNumber: sqlStr(r.IssueNumber), Title: sqlStr(r.Title),
        IssueTypeID: sqlId(uuidFor('issuetype', r.TypeKey)), StatusID: sqlVar({ New: '@IS_New', 'In Progress': '@IS_InProgress', Resolved: '@IS_Resolved', Closed: '@IS_Closed' }[r.StatusKey]),
        Severity: sqlStr(r.Severity), Priority: sqlStr(r.Priority),
        ReporterPersonID: sqlId(uuidFor('person', r.ReporterMemberNumber)),
        SourceEntityID: sqlVar({ 'MoreCheese: Orders': '@E_Orders', 'MJ_BizApps_Common: Organizations': '@E_Orgs', 'MoreCheese: Event Registrations': '@E_Regs', 'MJ_BizApps_Common: People': '@E_People' }[r.SourceEntityName]),
        SourceRecordID: sqlId({ order: uuidFor('order', r.SourceRefKey), org: uuidFor('org', r.SourceRefKey), reg: uuidFor('reg', r.SourceRefKey), person: uuidFor('person', r.SourceRefKey) }[r.SourceRefKind]),
        ResolvedAt: sqlDate(r.ResolvedAt), ClosedAt: sqlDate(r.ClosedAt),
      }),
    },
    {
      json: 'issue_sequences', table: '[__mj_BizAppsIssues].[IssueNumberSequence]',
      columns: (r) => ({ ScopeCode: sqlStr(r.ScopeCode), NextSequenceNumber: sqlNum(r.NextSequenceNumber) }),
    },
  ],
  forms: [
    // bizapps-forms' REAL shapes (B202606281200) — the D10 optional pack
    {
      json: 'forms', table: '[__mj_BizAppsForms].[Form]',
      columns: (r) => ({ ID: sqlId(uuidFor('form', r.FormKey)), Name: sqlStr(r.Name), Description: sqlStr(r.Description), Status: sqlStr(r.Status), RenderMode: sqlStr(r.RenderMode) }),
    },
    {
      json: 'form_versions', table: '[__mj_BizAppsForms].[FormVersion]',
      columns: (r) => ({ ID: sqlId(uuidFor('formver', r.VersionKey)), FormID: sqlId(uuidFor('form', r.FormKey)), VersionNumber: sqlNum(r.VersionNumber), Status: sqlStr(r.Status), PublishedAt: sqlDate(r.PublishedAt) }),
    },
    {
      json: 'form_pages', table: '[__mj_BizAppsForms].[FormPage]',
      columns: (r) => ({ ID: sqlId(uuidFor('formpage', r.PageKey)), FormID: sqlId(uuidFor('form', r.FormKey)), Title: sqlStr(r.Title), DisplayOrder: sqlNum(r.DisplayOrder) }),
    },
    {
      json: 'form_questions', table: '[__mj_BizAppsForms].[FormQuestion]',
      columns: (r) => ({
        ID: sqlId(uuidFor('formq', r.QuestionKey)), FormID: sqlId(uuidFor('form', r.FormKey)), PageID: sqlId(uuidFor('formpage', r.PageKey)),
        QuestionType: sqlStr(r.QuestionType), Prompt: sqlStr(r.Prompt), IsRequired: sqlBit(r.IsRequired), DisplayOrder: sqlNum(r.DisplayOrder),
      }),
    },
    {
      json: 'form_distributions', table: '[__mj_BizAppsForms].[FormDistribution]',
      columns: (r) => ({
        ID: sqlId(uuidFor('formdist', r.DistributionKey)), FormID: sqlId(uuidFor('form', r.FormKey)), Name: sqlStr(r.Name),
        ChannelType: sqlStr(r.ChannelType), Status: sqlStr(r.Status), OpenAt: sqlDate(r.OpenAt), CloseAt: sqlDate(r.CloseAt),
        MaxResponses: sqlNum(null), ResponseCount: sqlNum(r.ResponseCount), CaptchaRequired: sqlBit(false), IsActive: sqlBit(r.Status !== 'Closed'),
      }),
    },
    {
      json: 'form_responses', table: '[__mj_BizAppsForms].[FormResponse]',
      columns: (r) => ({
        ID: sqlId(uuidFor('formresp', r.ResponseKey)), FormID: sqlId(uuidFor('form', r.FormKey)),
        FormVersionID: sqlId(uuidFor('formver', r.VersionKey)), Status: sqlStr(r.Status),
        RespondentPersonID: sqlId(uuidFor('person', r.MemberNumber)), SubmittedAt: sqlDate(r.SubmittedAt),
      }),
    },
    {
      json: 'form_answers', table: '[__mj_BizAppsForms].[FormResponseAnswer]',
      columns: (r) => ({
        ID: sqlId(uuidFor('formans', r.AnswerKey)), ResponseID: sqlId(uuidFor('formresp', r.ResponseKey)),
        QuestionID: sqlId(uuidFor('formq', r.QuestionKey)), NumericValue: sqlNum(r.NumericValue ?? null), BooleanValue: sqlBit(r.BooleanValue ?? null),
      }),
    },
  ],
  events: [
    {
      json: 'events', table: '[morecheese_events].[Event]',
      columns: (r) => ({
        ID: sqlId(uuidFor('event', r.EventKey)), EventKey: sqlStr(r.EventKey), Name: sqlStr(r.Name),
        EventType: sqlStr(r.EventType), EventDate: sqlDate(r.Date), IsVirtual: sqlBit(r.IsVirtual), IsPaid: sqlBit(r.IsPaid),
        City: sqlStr(r.City), State: sqlStr(r.State), Latitude: sqlNum(r.Latitude), Longitude: sqlNum(r.Longitude),
        IsSharedDemo: sqlBit(r.IsSharedDemo),
      }),
    },
    {
      json: 'competition_entries', table: '[morecheese_events].[CompetitionEntry]',
      columns: (r) => ({
        ID: sqlId(uuidFor('compentry', r.EntryKey)), EntryKey: sqlStr(r.EntryKey),
        PersonID: sqlId(uuidFor('person', r.MemberNumber)), OrganizationID: sqlId(r.OrgKey ? uuidFor('org', r.OrgKey) : null),
        EntryYear: sqlNum(r.EntryYear), Category: sqlStr(r.Category), ProductName: sqlStr(r.ProductName),
        Result: sqlStr(r.Result), IsSharedDemo: sqlBit(r.IsSharedDemo),
      }),
    },
    {
      json: 'event_registrations', table: '[morecheese_events].[EventRegistration]',
      columns: (r) => ({
        ID: sqlId(uuidFor('reg', r.RegKey)), RegKey: sqlStr(r.RegKey),
        PersonID: sqlId(uuidFor('person', r.MemberNumber)), EventID: sqlId(uuidFor('event', r.EventKey)),
        RegisteredOn: sqlDate(r.RegisteredOn), Attended: sqlBit(r.Attended), IsSharedDemo: sqlBit(r.IsSharedDemo),
      }),
    },
  ],
};

// ---------- emit: one .sql per pack, batched multi-row INSERTs, pack order = install order ----------
export const BATCH = 500; // SQL Server allows 1000 rows per VALUES; stay comfortably under
export const INSTALL_ORDER = ['common', 'membership', 'events', 'learning', 'orders', 'committees', 'forms', 'tasks', 'issues']; // the pack pyramid
// polymorphic packs resolve entity NAMES to this database's __mj.Entity IDs up front
export const PREAMBLE = {
  committees: [
    "-- app-seeded lookups resolve BY NAME (the owning app ships these rows; integration finding F6)",
    "DECLARE @Role_Chair UNIQUEIDENTIFIER = (SELECT ID FROM [__mj_BizAppsCommittees].[Role] WHERE Name = N'Chair');",
    "DECLARE @Role_ViceChair UNIQUEIDENTIFIER = (SELECT ID FROM [__mj_BizAppsCommittees].[Role] WHERE Name = N'Vice Chair');",
    "DECLARE @Role_Member UNIQUEIDENTIFIER = (SELECT ID FROM [__mj_BizAppsCommittees].[Role] WHERE Name = N'Member');",
  ],
  tasks: [
    "DECLARE @E_People UNIQUEIDENTIFIER = (SELECT ID FROM __mj.Entity WHERE Name = N'MJ_BizApps_Common: People');",
    "DECLARE @E_Meetings UNIQUEIDENTIFIER = (SELECT ID FROM __mj.Entity WHERE Name = N'Committees: Meetings');",
  ],
  issues: [
    "-- app-seeded lookups resolve BY NAME (F6)",
    "DECLARE @IS_New UNIQUEIDENTIFIER = (SELECT ID FROM [__mj_BizAppsIssues].[IssueStatus] WHERE Name = N'New');",
    "DECLARE @IS_InProgress UNIQUEIDENTIFIER = (SELECT ID FROM [__mj_BizAppsIssues].[IssueStatus] WHERE Name = N'In Progress');",
    "DECLARE @IS_Resolved UNIQUEIDENTIFIER = (SELECT ID FROM [__mj_BizAppsIssues].[IssueStatus] WHERE Name = N'Resolved');",
    "DECLARE @IS_Closed UNIQUEIDENTIFIER = (SELECT ID FROM [__mj_BizAppsIssues].[IssueStatus] WHERE Name = N'Closed');",
    "DECLARE @E_People UNIQUEIDENTIFIER = (SELECT ID FROM __mj.Entity WHERE Name = N'MJ_BizApps_Common: People');",
    "DECLARE @E_Orders UNIQUEIDENTIFIER = (SELECT ID FROM __mj.Entity WHERE Name = N'MoreCheese: Orders');",
    "DECLARE @E_Orgs UNIQUEIDENTIFIER = (SELECT ID FROM __mj.Entity WHERE Name = N'MJ_BizApps_Common: Organizations');",
    "DECLARE @E_Regs UNIQUEIDENTIFIER = (SELECT ID FROM __mj.Entity WHERE Name = N'MoreCheese: Event Registrations');",
  ],
};

// ---- Shared pack → INSERT-lines generator (empty-table-safe; the crash emit-sql had) ----
// load(pack, jsonName) → rows[]. transformTable rewrites a SQL table ref (e.g. home schema →
// ${flyway:defaultSchema} for a migration). Returns { lines, summary }.
export function packSqlLines(pack, load, { transformTable = (t) => t } = {}) {
  const lines = [];
  const summary = [];
  for (const t of MAPPING[pack]) {
    const rows = load(pack, t.json);
    const table = transformTable(t.table);
    if (rows.length === 0) {
      lines.push(`-- ${table}: 0 rows`, '');
      summary.push({ table: t.table, rows: 0 });
      continue;
    }
    const cols = Object.keys(t.columns(rows[0]));
    lines.push(`-- ${table}: ${rows.length} rows`);
    for (let i = 0; i < rows.length; i += BATCH) {
      const batch = rows.slice(i, i + BATCH);
      lines.push(`INSERT INTO ${table} (${cols.map((c) => `[${c}]`).join(', ')})`);
      lines.push('VALUES');
      lines.push(batch.map((r) => `  (${Object.values(t.columns(r)).join(', ')})`).join(',\n') + ';');
      lines.push('');
    }
    summary.push({ table: t.table, rows: rows.length });
  }
  return { lines, summary };
}
