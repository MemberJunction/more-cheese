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

// platform pack: entity name → the preamble DECLARE that resolves it, and RefKind → the
// uuidFor prefix that reconstructs the referenced record's deterministic PK
export const MJ_ENTITY_VAR = {
  'MJ_BizApps_Common: People': '@E_People',
  'MJ_BizApps_Common: Relationships': '@E_Relationships',
  'MJ_BizApps_Issues: Issues': '@E_Issues',
  'MJ_BizApps_Tasks: Tasks': '@E_Tasks',
  'MoreCheese: Member Profiles': '@E_MemberProfiles',
  'MoreCheese: Membership Periods': '@E_Periods',
  'MoreCheese: Competition Entries': '@E_CompEntries',
  // sonar factor sources (all single-hop to the People anchor)
  'MoreCheese: Event Registrations': '@E_Regs',
  'Committees: Memberships': '@E_CommMemberships',
  'MoreCheese: Course Enrollments': '@E_Enrollments',
  'MoreCheese: Advocacy Actions': '@E_Advocacy',
  'MJ_BizApps_Forms: Form Responses': '@E_FormResponses',
};
export const RECORD_PREFIX = { memberprofile: 'memberprofile', period: 'period', issue: 'issue', task: 'task', rel: 'rel', person: 'person' };

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
        AssigneeEntityID: r.AssigneeMemberNumber ? sqlVar('@E_People') : sqlId(null),
        AssigneeRecordID: sqlId(r.AssigneeMemberNumber ? uuidFor('person', r.AssigneeMemberNumber) : null),
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
      json: 'form_question_options', table: '[__mj_BizAppsForms].[FormQuestionOption]',
      columns: (r) => ({
        ID: sqlId(uuidFor('formqopt', r.OptionKey)), QuestionID: sqlId(uuidFor('formq', r.QuestionKey)),
        Label: sqlStr(r.Label), Value: sqlStr(r.Value), DisplayOrder: sqlNum(r.DisplayOrder), IsDefault: sqlBit(r.IsDefault),
      }),
    },
    {
      json: 'form_responses', table: '[__mj_BizAppsForms].[FormResponse]',
      columns: (r) => ({
        ID: sqlId(uuidFor('formresp', r.ResponseKey)), FormID: sqlId(uuidFor('form', r.FormKey)),
        FormVersionID: sqlId(uuidFor('formver', r.VersionKey)), Status: sqlStr(r.Status),
        // anonymous intake: null member → null person FK, session id carries the identity-less trail
        RespondentPersonID: sqlId(r.MemberNumber ? uuidFor('person', r.MemberNumber) : null),
        AnonymousSessionID: sqlStr(r.AnonymousSessionID ?? null), SourceMetadata: sqlStr(r.SourceMetadata ?? null),
        StartedAt: sqlDate(r.StartedAt ?? null), SubmittedAt: sqlDate(r.SubmittedAt),
      }),
    },
    {
      json: 'form_answers', table: '[__mj_BizAppsForms].[FormResponseAnswer]',
      columns: (r) => ({
        ID: sqlId(uuidFor('formans', r.AnswerKey)), ResponseID: sqlId(uuidFor('formresp', r.ResponseKey)),
        QuestionID: sqlId(uuidFor('formq', r.QuestionKey)), TextValue: sqlStr(r.TextValue ?? null),
        NumericValue: sqlNum(r.NumericValue ?? null), BooleanValue: sqlBit(r.BooleanValue ?? null),
      }),
    },
  ],
  messaging: [
    // bizapps-secure-messaging's REAL shapes (V202607201423). ContactID/PersonID are SOFT
    // references (their design: no cross-schema FK), so person UUIDs land directly.
    // Session before message: SecureMessage.PortalSessionID is NOT NULL.
    {
      json: 'portal_sessions', table: '[__mj_BizAppsSecureMessaging].[PortalSession]',
      columns: (r) => ({
        ID: sqlId(uuidFor('psession', r.SessionKey)), ContactID: sqlId(uuidFor('person', r.MemberNumber)),
        TokenHash: sqlStr(r.TokenHash), Status: sqlStr(r.Status),
        ExpiresAt: sqlDate(r.ExpiresAt), LastAccessedAt: sqlDate(r.LastAccessedAt),
      }),
    },
    {
      json: 'secure_threads', table: '[__mj_BizAppsSecureMessaging].[SecureThread]',
      columns: (r) => ({
        ID: sqlId(uuidFor('thread', r.ThreadKey)), ContactID: sqlId(uuidFor('person', r.MemberNumber)),
        Subject: sqlStr(r.Subject), Status: sqlStr(r.Status), SourceChannel: sqlStr(r.SourceChannel),
        CreatedByUserID: sqlId(null), LastMessageAt: sqlDate(r.LastMessageAt), IsDeleted: sqlBit(r.IsDeleted),
      }),
    },
    {
      json: 'secure_messages', table: '[__mj_BizAppsSecureMessaging].[SecureMessage]',
      columns: (r) => ({
        ID: sqlId(uuidFor('secmsg', r.MessageKey)), PortalSessionID: sqlId(uuidFor('psession', r.SessionKey)),
        ThreadID: sqlId(uuidFor('thread', r.ThreadKey)),
        PersonID: sqlId(r.MemberNumber ? uuidFor('person', r.MemberNumber) : null),
        Direction: sqlStr(r.Direction), Sender: sqlStr(r.Sender), Recipient: sqlStr(r.Recipient),
        Subject: sqlStr(r.Subject), Content: sqlStr(r.Content), IsSecure: sqlBit(r.IsSecure),
        Status: sqlStr(r.Status), ExternalMessageID: sqlId(null), ReceivedAt: sqlDate(r.ReceivedAt),
        IsStarred: sqlBit(r.IsStarred), IsImported: sqlBit(r.IsImported), SourceChannel: sqlStr(r.SourceChannel),
      }),
    },
  ],
  platform: [
    // __mj CORE application data — usage residue (plan: MJ-PLATFORM-RESIDUE-PLAN-2026-07-23).
    // Shapes + CHECK value lists verified against a real v5.45 __mj schema (F9 discipline).
    // EnvironmentID / SQLDialectID are omitted on purpose: their column DEFAULTs are the
    // Default environment and the T-SQL dialect. Never __mj entity-DEFINITION rows here.
    {
      json: 'mj_users', table: '[__mj].[User]',
      columns: (r) => ({
        ID: sqlId(uuidFor('mjuser', r.UserKey)), Name: sqlStr(r.Name),
        FirstName: sqlStr(r.FirstName), LastName: sqlStr(r.LastName), Title: sqlStr(r.Title),
        Email: sqlStr(r.Email), Type: sqlStr('User'), IsActive: sqlBit(true), LinkedRecordType: sqlStr('None'),
      }),
    },
    {
      json: 'mj_user_roles', table: '[__mj].[UserRole]',
      columns: (r) => ({
        ID: sqlId(uuidFor('mjuserrole', r.RoleKey)), UserID: sqlId(uuidFor('mjuser', r.UserKey)),
        RoleID: sqlVar('@MJRole_UI'),
      }),
    },
    {
      json: 'user_views', table: '[__mj].[UserView]',
      columns: (r) => ({
        ID: sqlId(uuidFor('uview', r.ViewKey)), UserID: sqlId(uuidFor('mjuser', r.UserKey)),
        EntityID: sqlVar(MJ_ENTITY_VAR[r.EntityName]), Name: sqlStr(r.Name), Description: sqlStr(r.Description),
        IsShared: sqlBit(true), IsDefault: sqlBit(false),
        WhereClause: sqlStr(r.WhereClause), CustomWhereClause: sqlBit(true),
        GridState: sqlStr(r.GridState), FilterState: sqlStr(r.FilterState),
        CustomFilterState: sqlBit(false), SmartFilterEnabled: sqlBit(false),
      }),
    },
    {
      json: 'queries', table: '[__mj].[Query]',
      columns: (r) => ({
        ID: sqlId(uuidFor('query', r.QueryKey)), Name: sqlStr(r.Name),
        UserQuestion: sqlStr(r.UserQuestion), Description: sqlStr(r.Description), SQL: sqlStr(r.SQL),
        Status: sqlStr('Approved'), Reusable: sqlBit(true),
        CacheEnabled: sqlBit(false), AuditQueryRuns: sqlBit(false), UsesTemplate: sqlBit(false),
      }),
    },
    {
      json: 'conversations', table: '[__mj].[Conversation]',
      columns: (r) => ({
        ID: sqlId(uuidFor('conv', r.ConvKey)), UserID: sqlId(uuidFor('mjuser', r.UserKey)),
        Name: sqlStr(r.Name), Type: sqlStr('Skip'), Status: sqlStr('Available'),
        IsArchived: sqlBit(false), IsPinned: sqlBit(false), ApplicationScope: sqlStr('Global'),
        // authored timeline: __mj timestamps set explicitly so the thread predates the install
        ['__mj_CreatedAt']: sqlDate(r.CreatedAtTs), ['__mj_UpdatedAt']: sqlDate(r.CreatedAtTs),
      }),
    },
    {
      json: 'conversation_details', table: '[__mj].[ConversationDetail]',
      columns: (r) => ({
        ID: sqlId(uuidFor('convmsg', r.MsgKey)), ConversationID: sqlId(uuidFor('conv', r.ConvKey)),
        Role: sqlStr(r.Role), Message: sqlStr(r.Message), Status: sqlStr('Complete'),
        HiddenToUser: sqlBit(false), IsPinned: sqlBit(false), OriginalMessageChanged: sqlBit(false),
        UserID: sqlId(r.UserKey ? uuidFor('mjuser', r.UserKey) : null),
        ['__mj_CreatedAt']: sqlDate(r.CreatedAtTs), ['__mj_UpdatedAt']: sqlDate(r.CreatedAtTs),
      }),
    },
    {
      json: 'user_favorites', table: '[__mj].[UserFavorite]',
      columns: (r) => ({
        ID: sqlId(uuidFor('fav', r.FavKey)), UserID: sqlId(uuidFor('mjuser', r.UserKey)),
        EntityID: sqlVar(MJ_ENTITY_VAR[r.EntityName]), RecordID: sqlId(uuidFor(RECORD_PREFIX[r.RefKind], r.RefKey)),
      }),
    },
    {
      json: 'lists', table: '[__mj].[List]',
      columns: (r) => ({
        ID: sqlId(uuidFor('list', r.ListKey)), Name: sqlStr(r.Name), Description: sqlStr(r.Description),
        EntityID: sqlVar(MJ_ENTITY_VAR[r.EntityName]), UserID: sqlId(uuidFor('mjuser', r.UserKey)),
        RefreshMode: sqlStr('Additive'), UseSnapshot: sqlBit(false),
      }),
    },
    {
      json: 'list_details', table: '[__mj].[ListDetail]',
      columns: (r) => ({
        ID: sqlId(uuidFor('listitem', r.ItemKey)), ListID: sqlId(uuidFor('list', r.ListKey)),
        RecordID: sqlId(uuidFor(RECORD_PREFIX[r.RefKind], r.RefKey)), Sequence: sqlNum(r.Sequence), Status: sqlStr('Active'),
      }),
    },
    {
      json: 'user_notifications', table: '[__mj].[UserNotification]',
      columns: (r) => ({
        ID: sqlId(uuidFor('notif', r.NotifKey)), UserID: sqlId(uuidFor('mjuser', r.UserKey)),
        Title: sqlStr(r.Title), Message: sqlStr(r.Message), Unread: sqlBit(r.Unread), ReadAt: sqlDate(r.ReadAt),
      }),
    },
    {
      json: 'record_changes', table: '[__mj].[RecordChange]',
      columns: (r) => ({
        ID: sqlId(uuidFor('recchg', r.ChangeKey)), EntityID: sqlVar(MJ_ENTITY_VAR[r.EntityName]),
        RecordID: sqlId(uuidFor(RECORD_PREFIX[r.RefKind], r.RefKey)), UserID: sqlId(uuidFor('mjuser', r.UserKey)),
        Type: sqlStr(r.Type), Source: sqlStr('Internal'), ChangedAt: sqlDate(r.ChangedAt),
        ChangesJSON: sqlStr(r.ChangesJSON), ChangesDescription: sqlStr(r.ChangesDescription),
        FullRecordJSON: sqlStr(r.FullRecordJSON), Status: sqlStr('Complete'),
        CreatedAt: sqlDate(r.ChangedAt), UpdatedAt: sqlDate(r.ChangedAt),
      }),
    },
  ],
  sonar: [
    // bizapps-sonar's REAL shapes (V202606121005 Initial_Schema) — engagement scoring MODEL
    // DEFINITION ONLY (Sonar's FactorCompiler computes scores/contributions/history live, so we
    // never pre-emit those rows). Integration-grade: the preamble resolves __mj.Entity IDs.
    {
      json: 'score_band_sets', table: '[__mj_BizAppsSonar].[ScoreBandSet]',
      columns: (r) => ({
        ID: sqlId(uuidFor('sonarbandset', r.BandSetKey)), Name: sqlStr(r.Name),
        AnchorEntityID: sqlVar(MJ_ENTITY_VAR[r.AnchorEntityName]), Description: sqlStr(r.Description),
      }),
    },
    {
      json: 'score_bands', table: '[__mj_BizAppsSonar].[ScoreBand]',
      columns: (r) => ({
        ID: sqlId(uuidFor('sonarband', r.BandKey)), BandSetID: sqlId(uuidFor('sonarbandset', r.BandSetKey)),
        Label: sqlStr(r.Label), MinScore: sqlNum(r.MinScore), MaxScore: sqlNum(r.MaxScore),
        Severity: sqlNum(r.Severity), ColorHex: sqlStr(r.ColorHex), IsTerminal: sqlBit(r.IsTerminal), Description: sqlStr(r.Description),
      }),
    },
    {
      json: 'score_models', table: '[__mj_BizAppsSonar].[ScoreModel]',
      columns: (r) => ({
        ID: sqlId(uuidFor('sonarmodel', r.ModelKey)), Name: sqlStr(r.Name), Slug: sqlStr(r.Slug),
        Description: sqlStr(r.Description), AnchorEntityID: sqlVar(MJ_ENTITY_VAR[r.AnchorEntityName]),
        Status: sqlStr(r.Status), ScoreScaleMin: sqlNum(0), ScoreScaleMax: sqlNum(100),
        CombineStrategy: sqlStr(r.CombineStrategy), BandSetID: sqlId(uuidFor('sonarbandset', 'engagement-bands')),
        OwnerUserID: sqlId(uuidFor('mjuser', r.OwnerStaffKey)), EffectiveFrom: sqlDate(r.EffectiveFrom),
        // CurrentVersionID is set by the pack POSTAMBLE (circular FK with ScoreModelVersion)
      }),
    },
    {
      json: 'score_model_versions', table: '[__mj_BizAppsSonar].[ScoreModelVersion]',
      columns: (r) => ({
        ID: sqlId(uuidFor('sonarver', r.VersionKey)), ScoreModelID: sqlId(uuidFor('sonarmodel', r.ModelKey)),
        VersionNumber: sqlNum(r.VersionNumber), VersionLabel: sqlStr(r.VersionLabel),
        ConfigSnapshotJSON: sqlStr(r.ConfigSnapshotJSON), ChangeSummary: sqlStr(r.ChangeSummary),
        PublishedByUserID: sqlId(uuidFor('mjuser', r.PublishedByStaffKey)), PublishedAt: sqlDate(r.PublishedAt),
        IsCurrent: sqlBit(r.IsCurrent),
      }),
    },
    {
      json: 'model_related_entities', table: '[__mj_BizAppsSonar].[ModelRelatedEntity]',
      columns: (r) => ({
        ID: sqlId(uuidFor('sonarmre', r.RelatedKey)), ScoreModelID: sqlId(uuidFor('sonarmodel', r.ModelKey)),
        RelatedEntityID: sqlVar(MJ_ENTITY_VAR[r.EntityName]), Alias: sqlStr(r.Alias),
        RelationshipPath: sqlStr(r.RelationshipPath), JoinType: sqlStr(r.JoinType), // '[]' → compiler auto-resolves FK path
      }),
    },
    {
      json: 'factors', table: '[__mj_BizAppsSonar].[Factor]',
      columns: (r) => ({
        ID: sqlId(uuidFor('sonarfactor', r.FactorKey)), Name: sqlStr(r.Name), Slug: sqlStr(r.Slug),
        Description: sqlStr(r.Description), ScoreModelID: sqlId(uuidFor('sonarmodel', r.ModelKey)),
        AnchorEntityID: sqlVar(MJ_ENTITY_VAR[r.AnchorEntityName]), FactorType: sqlStr(r.FactorType),
        // the data source the FactorCompiler traverses — link to the ModelRelatedEntity (was missing)
        SourceRelatedEntityID: sqlId(uuidFor('sonarmre', r.SourceRelatedKey)),
        SourceEntityID: sqlVar(MJ_ENTITY_VAR[r.SourceEntityName]), Aggregation: sqlStr(r.Aggregation),
        NormalizationMethod: sqlStr(r.NormalizationMethod),
        HigherIsBetter: sqlBit(r.HigherIsBetter), PromotionState: sqlStr(r.PromotionState),
      }),
    },
    {
      json: 'model_factors', table: '[__mj_BizAppsSonar].[ModelFactor]',
      columns: (r) => ({
        ID: sqlId(uuidFor('sonarmf', r.ModelFactorKey)), ScoreModelID: sqlId(uuidFor('sonarmodel', r.ModelKey)),
        FactorID: sqlId(uuidFor('sonarfactor', r.FactorKey)), Weight: sqlNum(r.Weight),
        WeightMode: sqlStr(r.WeightMode), MissingDataPolicy: sqlStr(r.MissingDataPolicy),
        IsRequired: sqlBit(r.IsRequired), DisplayLabel: sqlStr(r.DisplayLabel), DisplayOrder: sqlNum(r.DisplayOrder),
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
export const INSTALL_ORDER = ['common', 'membership', 'events', 'learning', 'orders', 'committees', 'forms', 'tasks', 'issues', 'messaging', 'platform', 'sonar']; // the pack pyramid; platform after everything it audits, sonar last (its model owner is a platform staff user)

// DELIVERY MECHANISM per pack (hybrid ruling, 2026-07-24). Two ways demo data can ship:
//   'insert'   — Skyway INSERT data migrations (emit-data-migration.mjs → Seed_NN_*.sql)
//   'metadata' — MJ MetadataSync push through the entity SPs (emit-mjsync.mjs tree, applied
//                as MetadataSync migrations — the approach in PR #3)
// DEFAULT is 'metadata' on this (metadata-era) branch: all domain + sonar data ships through
// the entity SPs via emit-mjsync.mjs → MetadataSync migrations (PR #3's approach). The INSERT
// path (emit-data-migration.mjs) is now the EXCEPTION, used only by 'platform'.
// 'platform' is PINNED to 'insert' FOREVER: it forges state the entity layer refuses to forge —
// direct __mj.RecordChange audit rows and back-dated Conversation __mj_CreatedAt timestamps —
// which a push through the SPs would reject or re-stamp "now", destroying the "someone has used
// this instance" effect that is the pack's whole purpose. emit-data-migration.mjs emits only
// 'insert' packs (→ Seed_NN); everything else is the metadata emitter's job.
export const DELIVERY = { platform: 'insert' };
export const deliveryOf = (pack) => DELIVERY[pack] ?? 'metadata';
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
  platform: [
    "-- MJ core lookups resolve BY NAME (F6). EnvironmentID/SQLDialectID ride column DEFAULTs.",
    "DECLARE @MJRole_UI UNIQUEIDENTIFIER = (SELECT ID FROM [__mj].[Role] WHERE Name = N'UI');",
    "DECLARE @E_People UNIQUEIDENTIFIER = (SELECT ID FROM __mj.Entity WHERE Name = N'MJ_BizApps_Common: People');",
    "DECLARE @E_Relationships UNIQUEIDENTIFIER = (SELECT ID FROM __mj.Entity WHERE Name = N'MJ_BizApps_Common: Relationships');",
    "DECLARE @E_Issues UNIQUEIDENTIFIER = (SELECT ID FROM __mj.Entity WHERE Name = N'MJ_BizApps_Issues: Issues');",
    "DECLARE @E_Tasks UNIQUEIDENTIFIER = (SELECT ID FROM __mj.Entity WHERE Name = N'MJ_BizApps_Tasks: Tasks');",
    "DECLARE @E_MemberProfiles UNIQUEIDENTIFIER = (SELECT ID FROM __mj.Entity WHERE Name = N'MoreCheese: Member Profiles');",
    "DECLARE @E_Periods UNIQUEIDENTIFIER = (SELECT ID FROM __mj.Entity WHERE Name = N'MoreCheese: Membership Periods');",
    "DECLARE @E_CompEntries UNIQUEIDENTIFIER = (SELECT ID FROM __mj.Entity WHERE Name = N'MoreCheese: Competition Entries');",
  ],
  sonar: [
    "-- MJ entity lookups resolve BY NAME (F6)",
    "DECLARE @E_People UNIQUEIDENTIFIER = (SELECT ID FROM __mj.Entity WHERE Name = N'MJ_BizApps_Common: People');",
    "DECLARE @E_Regs UNIQUEIDENTIFIER = (SELECT ID FROM __mj.Entity WHERE Name = N'MoreCheese: Event Registrations');",
    "DECLARE @E_CommMemberships UNIQUEIDENTIFIER = (SELECT ID FROM __mj.Entity WHERE Name = N'Committees: Memberships');",
    "DECLARE @E_Enrollments UNIQUEIDENTIFIER = (SELECT ID FROM __mj.Entity WHERE Name = N'MoreCheese: Course Enrollments');",
    "DECLARE @E_Advocacy UNIQUEIDENTIFIER = (SELECT ID FROM __mj.Entity WHERE Name = N'MoreCheese: Advocacy Actions');",
    "DECLARE @E_FormResponses UNIQUEIDENTIFIER = (SELECT ID FROM __mj.Entity WHERE Name = N'MJ_BizApps_Forms: Form Responses');",
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

// POSTAMBLE: statements appended AFTER a pack's INSERTs — for circular FKs that can't be
// satisfied in insert order. UUIDs here are uuidv5 constants (stable forever by design).
export const POSTAMBLE = {
  sonar: [
    "-- circular FK (ScoreModel ⇄ ScoreModelVersion): point the model at v1 now both exist",
    `UPDATE [__mj_BizAppsSonar].[ScoreModel] SET CurrentVersionID = '${uuidFor('sonarver', 'morecheese-engagement:1')}' WHERE ID = '${uuidFor('sonarmodel', 'morecheese-engagement')}';`,
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
