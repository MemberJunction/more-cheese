# Appendix — Pack Schemas (per-table column reference)

> [!NOTE]
> **Historical Reference**: The `morecheese_orders` stand-in schema was retired in PR #22 and replaced by native `@mj-biz-apps/orders` tables.

Companion to `SCHEMA-BRIEF-2026-07-16.md`. Shapes are extracted from the live DDL
(drift-guarded against the frozen baseline migration; dependency tables show the
columns relevant to our data — their apps own additional nullable columns and the
`__mj_*` audit columns CodeGen adds). **bold** = column populated by the generator;
plain = present but left NULL/default. `→` = hard FK target.

## Pack 01 — common

### `__mj_BizAppsCommon.Organization`

- **ID** `UNIQUEIDENTIFIER` (PK)
- **Name** `NVARCHAR(255)`
- LegalName `NVARCHAR(255)` (nullable)
- OrganizationTypeID `UNIQUEIDENTIFIER` (nullable)
- ParentID `UNIQUEIDENTIFIER` (nullable)
- Website `NVARCHAR(1000)` (nullable)
- LogoURL `NVARCHAR(1000)` (nullable)
- Description `NVARCHAR(MAX)` (nullable)
- Email `NVARCHAR(255)` (nullable)
- Phone `NVARCHAR(50)` (nullable)
- FoundedDate `DATE` (nullable)
- TaxID `NVARCHAR(50)` (nullable)
- **Status** `NVARCHAR(50)`

### `morecheese_members.OrganizationProfile`

- **ID** `UNIQUEIDENTIFIER` (PK)
- **OrganizationID** `UNIQUEIDENTIFIER` (→ __mj_BizAppsCommon.Organization)
- **OrgKey** `NVARCHAR(50)`
- **Type** `NVARCHAR(50)`
- **Region** `NVARCHAR(50)`
- **City** `NVARCHAR(100)`
- **State** `NVARCHAR(50)`
- **Latitude** `DECIMAL(9,6)`
- **Longitude** `DECIMAL(9,6)`
- **LifecycleEventKind** `NVARCHAR(50)` (nullable)
- **LifecycleEventYear** `INT` (nullable)
- **IsSharedDemo** `BIT`

### `__mj_BizAppsCommon.RelationshipType`

- **ID** `UNIQUEIDENTIFIER` (PK)
- **Name** `NVARCHAR(100)`
- **Description** `NVARCHAR(MAX)` (nullable)
- **Category** `NVARCHAR(50)`
- **IsDirectional** `BIT`
- **ForwardLabel** `NVARCHAR(100)` (nullable)
- **ReverseLabel** `NVARCHAR(100)` (nullable)
- **IsActive** `BIT`

### `__mj_BizAppsCommon.Person`

- **ID** `UNIQUEIDENTIFIER` (PK)
- **FirstName** `NVARCHAR(100)`
- **LastName** `NVARCHAR(100)`
- MiddleName `NVARCHAR(100)` (nullable)
- Prefix `NVARCHAR(20)` (nullable)
- Suffix `NVARCHAR(20)` (nullable)
- PreferredName `NVARCHAR(100)` (nullable)
- **Title** `NVARCHAR(200)` (nullable)
- **Email** `NVARCHAR(255)` (nullable)
- Phone `NVARCHAR(50)` (nullable)
- DateOfBirth `DATE` (nullable)
- Gender `NVARCHAR(50)` (nullable)
- PhotoURL `NVARCHAR(1000)` (nullable)
- Bio `NVARCHAR(MAX)` (nullable)
- LinkedUserID `UNIQUEIDENTIFIER` (nullable)
- **Status** `NVARCHAR(50)`

### `morecheese_members.MemberProfile`

- **ID** `UNIQUEIDENTIFIER` (PK)
- **PersonID** `UNIQUEIDENTIFIER` (→ __mj_BizAppsCommon.Person)
- **OrganizationID** `UNIQUEIDENTIFIER` (→ __mj_BizAppsCommon.Organization, nullable)
- **MemberNumber** `NVARCHAR(50)`
- **Segment** `NVARCHAR(50)`
- **Region** `NVARCHAR(50)`
- **City** `NVARCHAR(100)`
- **State** `NVARCHAR(50)`
- **Latitude** `DECIMAL(9,6)`
- **Longitude** `DECIMAL(9,6)`
- **JoinDate** `DATE`
- **IsSharedDemo** `BIT`

### `__mj_BizAppsCommon.Relationship`

- **ID** `UNIQUEIDENTIFIER` (PK)
- **RelationshipTypeID** `UNIQUEIDENTIFIER` (→ __mj_BizAppsCommon.RelationshipType)
- **FromPersonID** `UNIQUEIDENTIFIER` (→ __mj_BizAppsCommon.Person, nullable)
- **FromOrganizationID** `UNIQUEIDENTIFIER` (→ __mj_BizAppsCommon.Organization, nullable)
- **ToPersonID** `UNIQUEIDENTIFIER` (nullable)
- **ToOrganizationID** `UNIQUEIDENTIFIER` (nullable)
- **Title** `NVARCHAR(255)` (nullable)
- **StartDate** `DATE` (nullable)
- **EndDate** `DATE` (nullable)
- **Status** `NVARCHAR(50)`
- **Notes** `NVARCHAR(MAX)` (nullable)

## Pack 02 — membership

### `morecheese_members.MembershipPeriod`

- **ID** `UNIQUEIDENTIFIER` (PK)
- **PeriodKey** `NVARCHAR(60)`
- **PersonID** `UNIQUEIDENTIFIER` (→ __mj_BizAppsCommon.Person)
- **MembershipTier** `NVARCHAR(50)`
- **DuesAmount** `DECIMAL(10,2)`
- **StartDate** `DATE`
- **EndDate** `DATE`
- **RenewalDate** `DATE`
- **Status** `NVARCHAR(50)`
- **CancellationDate** `DATE` (nullable)
- **CancellationReason** `NVARCHAR(200)` (nullable)
- **AutoRenew** `BIT`
- **IsSharedDemo** `BIT`

## Pack 03 — events

### `morecheese_events.Event`

- **ID** `UNIQUEIDENTIFIER` (PK)
- **EventKey** `NVARCHAR(50)`
- **Name** `NVARCHAR(200)`
- **EventType** `NVARCHAR(50)`
- **EventDate** `DATE`
- **IsVirtual** `BIT`
- **IsPaid** `BIT`
- **City** `NVARCHAR(100)` (nullable)
- **State** `NVARCHAR(50)` (nullable)
- **Latitude** `DECIMAL(9,6)` (nullable)
- **Longitude** `DECIMAL(9,6)` (nullable)
- **IsSharedDemo** `BIT`

### `morecheese_events.EventRegistration`

- **ID** `UNIQUEIDENTIFIER` (PK)
- **RegKey** `NVARCHAR(120)`
- **PersonID** `UNIQUEIDENTIFIER` (→ __mj_BizAppsCommon.Person)
- **EventID** `UNIQUEIDENTIFIER` (→ morecheese_events.Event)
- **RegisteredOn** `DATE`
- **Attended** `BIT` (nullable)
- **IsSharedDemo** `BIT`

## Pack 04 — learning

### `morecheese_learning.Course`

- **ID** `UNIQUEIDENTIFIER` (PK)
- **CourseKey** `NVARCHAR(50)`
- **Name** `NVARCHAR(200)`
- **StartDate** `DATE`
- **DurationWeeks** `INT`
- **IsSharedDemo** `BIT`

### `morecheese_learning.CourseEnrollment`

- **ID** `UNIQUEIDENTIFIER` (PK)
- **EnrollKey** `NVARCHAR(80)`
- **PersonID** `UNIQUEIDENTIFIER` (→ __mj_BizAppsCommon.Person)
- **CourseID** `UNIQUEIDENTIFIER` (→ morecheese_learning.Course)
- **EnrolledOn** `DATE`
- **Status** `NVARCHAR(50)`
- **CompletedOn** `DATE` (nullable)
- **IsSharedDemo** `BIT`

## Pack 05 — orders

### `morecheese_orders.Product`

- **ID** `UNIQUEIDENTIFIER` (PK)
- **ProductKey** `NVARCHAR(50)`
- **Name** `NVARCHAR(200)`
- **ProductType** `NVARCHAR(50)`
- **UnitPrice** `DECIMAL(10,2)`
- **IsSharedDemo** `BIT`

### `morecheese_orders.Order`

- **ID** `UNIQUEIDENTIFIER` (PK)
- **OrderKey** `NVARCHAR(50)`
- **PersonID** `UNIQUEIDENTIFIER` (→ __mj_BizAppsCommon.Person)
- **OrderType** `NVARCHAR(50)`
- **Status** `NVARCHAR(50)`
- **OrderDate** `DATE`
- **DueDate** `DATE`
- **TotalGross** `DECIMAL(10,2)`
- **PaymentStatus** `NVARCHAR(50)`
- **IsSharedDemo** `BIT`

### `morecheese_orders.OrderLine`

- **ID** `UNIQUEIDENTIFIER` (PK)
- **OrderID** `UNIQUEIDENTIFIER` (→ morecheese_orders.Order)
- **ProductID** `UNIQUEIDENTIFIER` (→ morecheese_orders.Product)
- **Quantity** `INT`
- **UnitPrice** `DECIMAL(10,2)`
- **LineTotal** `DECIMAL(10,2)`
- **IsSharedDemo** `BIT`

### `morecheese_orders.Payment`

- **ID** `UNIQUEIDENTIFIER` (PK)
- **OrderID** `UNIQUEIDENTIFIER` (→ morecheese_orders.Order)
- **Amount** `DECIMAL(10,2)`
- **PaymentDate** `DATE`
- **Method** `NVARCHAR(50)`
- **Status** `NVARCHAR(50)`
- **IsSharedDemo** `BIT`

## Pack 06 — committees

### `__mj_BizAppsCommittees.Type`

- **ID** `UNIQUEIDENTIFIER` (PK)
- **Name** `NVARCHAR(100)`
- Description `NVARCHAR(MAX)` (nullable)
- **IsStandards** `BIT`
- **DefaultTermMonths** `INT` (nullable)

### `__mj_BizAppsCommittees.Role`

- **ID** `UNIQUEIDENTIFIER` (PK)
- **Name** `NVARCHAR(100)`
- Description `NVARCHAR(MAX)` (nullable)
- **IsOfficer** `BIT`
- **IsVotingRole** `BIT`
- **Sequence** `INT`

### `__mj_BizAppsCommittees.Committee`

- **ID** `UNIQUEIDENTIFIER` (PK)
- **Name** `NVARCHAR(255)`
- Description `NVARCHAR(MAX)` (nullable)
- **TypeID** `UNIQUEIDENTIFIER` (→ __mj_BizAppsCommittees.Type)
- **MissionStatement** `NVARCHAR(MAX)` (nullable)
- **Status** `NVARCHAR(50)`
- **IsPublic** `BIT`
- **FormationDate** `DATE` (nullable)

### `__mj_BizAppsCommittees.Term`

- **ID** `UNIQUEIDENTIFIER` (PK)
- **CommitteeID** `UNIQUEIDENTIFIER` (→ __mj_BizAppsCommittees.Committee)
- **Name** `NVARCHAR(100)`
- **StartDate** `DATE`
- **EndDate** `DATE` (nullable)
- **Status** `NVARCHAR(50)`

### `__mj_BizAppsCommittees.Membership`

- **ID** `UNIQUEIDENTIFIER` (PK)
- **PersonID** `UNIQUEIDENTIFIER` (→ __mj_BizAppsCommon.Person)
- **RoleID** `UNIQUEIDENTIFIER` (→ __mj_BizAppsCommittees.Role)
- **TermID** `UNIQUEIDENTIFIER` (→ __mj_BizAppsCommittees.Term)
- **StartDate** `DATE`
- **EndDate** `DATE` (nullable)
- **Status** `NVARCHAR(50)`

### `__mj_BizAppsCommittees.Meeting`

- **ID** `UNIQUEIDENTIFIER` (PK)
- **CommitteeID** `UNIQUEIDENTIFIER` (→ __mj_BizAppsCommittees.Committee)
- **Name** `NVARCHAR(255)`
- **StartDateTime** `DATETIMEOFFSET`
- **TimeZone** `NVARCHAR(50)`
- **LocationType** `NVARCHAR(50)`
- **Status** `NVARCHAR(50)`

### `__mj_BizAppsCommittees.Attendance`

- **ID** `UNIQUEIDENTIFIER` (PK)
- **MeetingID** `UNIQUEIDENTIFIER` (→ __mj_BizAppsCommittees.Meeting)
- **PersonID** `UNIQUEIDENTIFIER` (→ __mj_BizAppsCommon.Person)
- **AttendanceStatus** `NVARCHAR(50)`

### `__mj_BizAppsCommittees.AgendaItem`

- **ID** `UNIQUEIDENTIFIER` (PK)
- **MeetingID** `UNIQUEIDENTIFIER` (→ __mj_BizAppsCommittees.Meeting)
- **Sequence** `INT`
- **Name** `NVARCHAR(255)`
- **PresenterPersonID** `UNIQUEIDENTIFIER` (→ __mj_BizAppsCommon.Person, nullable)
- **DurationMinutes** `INT` (nullable)
- **ItemType** `NVARCHAR(50)`
- **Status** `NVARCHAR(50)`

### `__mj_BizAppsCommittees.Motion`

- **ID** `UNIQUEIDENTIFIER` (PK)
- **MeetingID** `UNIQUEIDENTIFIER` (→ __mj_BizAppsCommittees.Meeting, nullable)
- **AgendaItemID** `UNIQUEIDENTIFIER` (→ __mj_BizAppsCommittees.AgendaItem, nullable)
- **Sequence** `INT`
- **Name** `NVARCHAR(255)`
- **MovedByMembershipID** `UNIQUEIDENTIFIER` (→ __mj_BizAppsCommittees.Membership, nullable)
- **SecondedByMembershipID** `UNIQUEIDENTIFIER` (→ __mj_BizAppsCommittees.Membership, nullable)
- **Result** `NVARCHAR(50)`
- **ResultSummary** `NVARCHAR(255)` (nullable)
- **YesCount** `INT` (nullable)
- **NoCount** `INT` (nullable)
- **AbstainCount** `INT` (nullable)

### `__mj_BizAppsCommittees.Vote`

- **ID** `UNIQUEIDENTIFIER` (PK)
- **MotionID** `UNIQUEIDENTIFIER` (→ __mj_BizAppsCommittees.Motion)
- **MembershipID** `UNIQUEIDENTIFIER` (→ __mj_BizAppsCommittees.Membership)
- **VoteValue** `NVARCHAR(20)`

## Pack 07 — forms

### `__mj_BizAppsForms.Form`

- **ID** `UNIQUEIDENTIFIER` (PK)
- **Name** `NVARCHAR(255)`
- **Description** `NVARCHAR(MAX)` (nullable)
- **Status** `NVARCHAR(20)`
- **RenderMode** `NVARCHAR(20)`

### `__mj_BizAppsForms.FormVersion`

- **ID** `UNIQUEIDENTIFIER` (PK)
- **FormID** `UNIQUEIDENTIFIER` (→ __mj_BizAppsForms.Form)
- **VersionNumber** `INT`
- **Status** `NVARCHAR(20)`
- **PublishedAt** `DATETIMEOFFSET` (nullable)

### `__mj_BizAppsForms.FormPage`

- **ID** `UNIQUEIDENTIFIER` (PK)
- **FormID** `UNIQUEIDENTIFIER` (→ __mj_BizAppsForms.Form)
- **Title** `NVARCHAR(255)` (nullable)
- **DisplayOrder** `INT`

### `__mj_BizAppsForms.FormQuestion`

- **ID** `UNIQUEIDENTIFIER` (PK)
- **FormID** `UNIQUEIDENTIFIER` (→ __mj_BizAppsForms.Form)
- **PageID** `UNIQUEIDENTIFIER` (→ __mj_BizAppsForms.FormPage, nullable)
- **QuestionType** `NVARCHAR(50)`
- **Prompt** `NVARCHAR(MAX)`
- **IsRequired** `BIT`
- **DisplayOrder** `INT`

### `__mj_BizAppsForms.FormDistribution`

- **ID** `UNIQUEIDENTIFIER` (PK)
- **FormID** `UNIQUEIDENTIFIER` (→ __mj_BizAppsForms.Form)
- **Name** `NVARCHAR(255)`
- **ChannelType** `NVARCHAR(20)`
- **Status** `NVARCHAR(20)`
- **OpenAt** `DATETIMEOFFSET` (nullable)
- **CloseAt** `DATETIMEOFFSET` (nullable)
- **MaxResponses** `INT` (nullable)
- **ResponseCount** `INT`
- **CaptchaRequired** `BIT`
- **IsActive** `BIT`

### `__mj_BizAppsForms.FormResponse`

- **ID** `UNIQUEIDENTIFIER` (PK)
- **FormID** `UNIQUEIDENTIFIER` (→ __mj_BizAppsForms.Form)
- **FormVersionID** `UNIQUEIDENTIFIER` (→ __mj_BizAppsForms.FormVersion)
- **Status** `NVARCHAR(20)`
- **RespondentPersonID** `UNIQUEIDENTIFIER` (→ __mj_BizAppsCommon.Person, nullable)
- **SubmittedAt** `DATETIMEOFFSET` (nullable)

### `__mj_BizAppsForms.FormResponseAnswer`

- **ID** `UNIQUEIDENTIFIER` (PK)
- **ResponseID** `UNIQUEIDENTIFIER` (→ __mj_BizAppsForms.FormResponse)
- **QuestionID** `UNIQUEIDENTIFIER` (→ __mj_BizAppsForms.FormQuestion)
- **NumericValue** `DECIMAL(18,4)` (nullable)
- **BooleanValue** `BIT` (nullable)

## Pack 08 — tasks

### `__mj_BizAppsTasks.TaskType`

- **ID** `UNIQUEIDENTIFIER` (PK)
- **Name** `NVARCHAR(100)`
- **Description** `NVARCHAR(MAX)` (nullable)
- **DefaultPriority** `NVARCHAR(20)`
- **IsActive** `BIT`

### `__mj_BizAppsTasks.Task`

- **ID** `UNIQUEIDENTIFIER` (PK)
- **Name** `NVARCHAR(255)`
- **TypeID** `UNIQUEIDENTIFIER` (→ __mj_BizAppsTasks.TaskType)
- **Status** `NVARCHAR(50)`
- **Priority** `NVARCHAR(20)`
- **DueAt** `DATETIMEOFFSET` (nullable)
- **CompletedAt** `DATETIMEOFFSET` (nullable)
- **PercentComplete** `INT`
- **CreatedByPersonID** `UNIQUEIDENTIFIER` (→ __mj_BizAppsCommon.Person, nullable)

### `__mj_BizAppsTasks.TaskAssignment`

- **ID** `UNIQUEIDENTIFIER` (PK)
- **TaskID** `UNIQUEIDENTIFIER` (→ __mj_BizAppsTasks.Task)
- **AssigneeEntityID** `UNIQUEIDENTIFIER`
- **AssigneeRecordID** `NVARCHAR(450)`
- **Status** `NVARCHAR(50)`

### `__mj_BizAppsTasks.TaskLink`

- **ID** `UNIQUEIDENTIFIER` (PK)
- **TaskID** `UNIQUEIDENTIFIER` (→ __mj_BizAppsTasks.Task)
- **EntityID** `UNIQUEIDENTIFIER`
- **RecordID** `NVARCHAR(450)`

## Pack 09 — issues

### `__mj_BizAppsIssues.IssueType`

- **ID** `UNIQUEIDENTIFIER` (PK)
- **Name** `NVARCHAR(100)`
- **Description** `NVARCHAR(MAX)` (nullable)
- **DefaultPriority** `NVARCHAR(20)`
- **IsActive** `BIT`

### `__mj_BizAppsIssues.IssueStatus`

- **ID** `UNIQUEIDENTIFIER` (PK)
- **Name** `NVARCHAR(100)`
- **Sequence** `INT`
- **IsDefault** `BIT`
- **IsTerminal** `BIT`
- **ColorCode** `NVARCHAR(20)` (nullable)

### `__mj_BizAppsIssues.Issue`

- **ID** `UNIQUEIDENTIFIER` (PK)
- **IssueNumber** `NVARCHAR(50)` (nullable)
- **Title** `NVARCHAR(500)`
- **IssueTypeID** `UNIQUEIDENTIFIER` (→ __mj_BizAppsIssues.IssueType)
- **StatusID** `UNIQUEIDENTIFIER` (→ __mj_BizAppsIssues.IssueStatus)
- **Severity** `NVARCHAR(20)`
- **Priority** `NVARCHAR(20)`
- **ReporterPersonID** `UNIQUEIDENTIFIER` (→ __mj_BizAppsCommon.Person, nullable)
- **SourceEntityID** `UNIQUEIDENTIFIER` (nullable)
- **SourceRecordID** `NVARCHAR(450)` (nullable)
- **ResolvedAt** `DATETIMEOFFSET` (nullable)
- **ClosedAt** `DATETIMEOFFSET` (nullable)

### `__mj_BizAppsIssues.IssueNumberSequence`

- **ScopeCode** `NVARCHAR(50)` (PK)
- **NextSequenceNumber** `INT`
