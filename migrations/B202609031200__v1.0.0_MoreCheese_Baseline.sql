-- =========================================================================
-- MoreCheese Demo — Consolidated Schema Baseline (v1.0.0)
-- =========================================================================
-- Single clean baseline for the ${flyway:defaultSchema} application schema (home schema:
-- morecheese_members) plus sibling schemas (morecheese_events, morecheese_learning).
--
-- STRUCTURE:
--   1. Schema DDL         — schemas, custom tables, FKs, check constraints, extended properties
--   2. APPLICATION        — the Explorer app record (MoreCheese)
--   3. CODEGEN section    — entity registrations, audit columns, FK indexes, base views,
--                           CRUD procs, permissions.
-- =========================================================================

CREATE SCHEMA morecheese_events;
GO
CREATE SCHEMA morecheese_learning;
GO

---------------------------------------------------------------------------
-- OrganizationProfile: our extension of bizapps-common Organization —
-- everything org-shaped that upstream doesn't model (demo geography, the
-- lifecycle events that fuel employer-driven churn stories)
---------------------------------------------------------------------------
CREATE TABLE ${flyway:defaultSchema}.OrganizationProfile (
    ID UNIQUEIDENTIFIER NOT NULL DEFAULT NEWSEQUENTIALID(),
    OrganizationID UNIQUEIDENTIFIER NOT NULL,
    OrgKey NVARCHAR(50) NOT NULL,
    Type NVARCHAR(50) NOT NULL,
    Region NVARCHAR(50) NOT NULL,
    Country NVARCHAR(2) NULL,
    CountryName NVARCHAR(100) NULL,
    City NVARCHAR(100) NOT NULL,
    State NVARCHAR(50) NOT NULL,
    AddressLine1 NVARCHAR(200) NULL,
    PostalCode NVARCHAR(20) NULL,
    Latitude DECIMAL(9,6) NOT NULL,
    Longitude DECIMAL(9,6) NOT NULL,
    LifecycleEventKind NVARCHAR(50) NULL,
    LifecycleEventYear INT NULL,
    IsSharedDemo BIT NOT NULL DEFAULT 1,
    CONSTRAINT PK_OrganizationProfile PRIMARY KEY (ID),
    CONSTRAINT UQ_OrganizationProfile_OrgKey UNIQUE (OrgKey),
    CONSTRAINT FK_OrganizationProfile_Organization FOREIGN KEY (OrganizationID) REFERENCES __mj_BizAppsCommon.Organization(ID),
    CONSTRAINT CK_OrganizationProfile_Type CHECK (Type IN ('Producer', 'Retailer', 'Supplier', 'Educator')),
    CONSTRAINT CK_OrganizationProfile_Region CHECK (Region IN ('NA', 'EU', 'RoW')),
    CONSTRAINT CK_OrganizationProfile_LifecycleEventKind CHECK (LifecycleEventKind IN ('Dissolved', 'Acquired', 'ProgramCut'))
);
GO

---------------------------------------------------------------------------
-- MemberProfile: our extension of bizapps-common Person — member number,
-- segment, geography, join date (v2-plan §4.2: Member = extension FKing Person)
---------------------------------------------------------------------------
CREATE TABLE ${flyway:defaultSchema}.MemberProfile (
    ID UNIQUEIDENTIFIER NOT NULL DEFAULT NEWSEQUENTIALID(),
    PersonID UNIQUEIDENTIFIER NOT NULL,
    OrganizationID UNIQUEIDENTIFIER NULL,
    MemberNumber NVARCHAR(50) NOT NULL,
    Segment NVARCHAR(50) NOT NULL,
    Region NVARCHAR(50) NOT NULL,
    Country NVARCHAR(2) NULL,
    CountryName NVARCHAR(100) NULL,
    City NVARCHAR(100) NOT NULL,
    State NVARCHAR(50) NOT NULL,
    AddressLine1 NVARCHAR(200) NULL,
    AddressLine2 NVARCHAR(200) NULL,
    PostalCode NVARCHAR(20) NULL,
    Latitude DECIMAL(9,6) NOT NULL,
    Longitude DECIMAL(9,6) NOT NULL,
    JoinDate DATE NOT NULL,
    -- voluntary self-identified demographics: blank is a real and common answer, and
    -- 'Prefer not to say' is a DIFFERENT answer from never having responded
    RaceEthnicity NVARCHAR(200) NULL,
    EthnicityHispanic NVARCHAR(30) NULL,
    PronounSet NVARCHAR(50) NULL,
    PrimaryLanguage NVARCHAR(50) NULL,
    IsSharedDemo BIT NOT NULL DEFAULT 1,
    CONSTRAINT PK_MemberProfile PRIMARY KEY (ID),
    CONSTRAINT UQ_MemberProfile_MemberNumber UNIQUE (MemberNumber),
    CONSTRAINT FK_MemberProfile_Person FOREIGN KEY (PersonID) REFERENCES __mj_BizAppsCommon.Person(ID),
    CONSTRAINT FK_MemberProfile_Organization FOREIGN KEY (OrganizationID) REFERENCES __mj_BizAppsCommon.Organization(ID),
    CONSTRAINT CK_MemberProfile_Segment CHECK (Segment IN ('Producer', 'Retailer', 'Supplier', 'Educator', 'Enthusiast')),
    CONSTRAINT CK_MemberProfile_Region CHECK (Region IN ('NA', 'EU', 'RoW'))
);
GO

---------------------------------------------------------------------------
-- MembershipPeriod: one row per membership cycle — the July-31 shipping
-- shape AND the intermediate for the eventual bizapps-orders decomposition
-- (Subscription + renewal Order per cycle). Status is period state;
-- member status is always DERIVED from the latest period, never stored.
---------------------------------------------------------------------------
CREATE TABLE ${flyway:defaultSchema}.MembershipPeriod (
    ID UNIQUEIDENTIFIER NOT NULL DEFAULT NEWSEQUENTIALID(),
    PeriodKey NVARCHAR(60) NOT NULL,
    PersonID UNIQUEIDENTIFIER NOT NULL,
    MembershipTier NVARCHAR(50) NOT NULL,
    DuesAmount DECIMAL(10,2) NOT NULL,
    StartDate DATE NOT NULL,
    EndDate DATE NOT NULL,
    RenewalDate DATE NOT NULL,
    Status NVARCHAR(50) NOT NULL,
    CancellationDate DATE NULL,
    CancellationReason NVARCHAR(200) NULL,
    AutoRenew BIT NOT NULL DEFAULT 0,
    IsSharedDemo BIT NOT NULL DEFAULT 1,
    CONSTRAINT PK_MembershipPeriod PRIMARY KEY (ID),
    CONSTRAINT UQ_MembershipPeriod_PeriodKey UNIQUE (PeriodKey),
    CONSTRAINT FK_MembershipPeriod_Person FOREIGN KEY (PersonID) REFERENCES __mj_BizAppsCommon.Person(ID),
    CONSTRAINT CK_MembershipPeriod_Status CHECK (Status IN ('Active', 'Renewed', 'Lapsed', 'PendingRenewal', 'Cancelled')),
    CONSTRAINT CK_MembershipPeriod_Tier CHECK (MembershipTier IN ('Enthusiast', 'Individual', 'SmallBusiness', 'Corporate'))
);
GO

---------------------------------------------------------------------------
-- Event: conferences, workshops, webinars — with venue coordinates for the
-- member map (GAP-11a: pre-baked lat/long, no live geocoding)
---------------------------------------------------------------------------
CREATE TABLE morecheese_events.Event (
    ID UNIQUEIDENTIFIER NOT NULL DEFAULT NEWSEQUENTIALID(),
    EventKey NVARCHAR(50) NOT NULL,
    Name NVARCHAR(200) NOT NULL,
    EventType NVARCHAR(50) NOT NULL,
    EventDate DATE NOT NULL,
    IsVirtual BIT NOT NULL DEFAULT 0,
    IsPaid BIT NOT NULL DEFAULT 0,
    City NVARCHAR(100) NULL,
    State NVARCHAR(50) NULL,
    Latitude DECIMAL(9,6) NULL,
    Longitude DECIMAL(9,6) NULL,
    IsSharedDemo BIT NOT NULL DEFAULT 1,
    CONSTRAINT PK_Event PRIMARY KEY (ID),
    CONSTRAINT UQ_Event_EventKey UNIQUE (EventKey),
    CONSTRAINT CK_Event_EventType CHECK (EventType IN ('Conference', 'Workshop', 'Webinar'))
);
GO

---------------------------------------------------------------------------
-- EventRegistration: a registration can only exist inside a valid
-- membership window — impossible dates are unrepresentable by construction
---------------------------------------------------------------------------
CREATE TABLE morecheese_events.EventRegistration (
    ID UNIQUEIDENTIFIER NOT NULL DEFAULT NEWSEQUENTIALID(),
    RegKey NVARCHAR(120) NOT NULL,
    PersonID UNIQUEIDENTIFIER NOT NULL,
    EventID UNIQUEIDENTIFIER NOT NULL,
    RegisteredOn DATE NOT NULL,
    Attended BIT NULL,
    IsSharedDemo BIT NOT NULL DEFAULT 1,
    CONSTRAINT PK_EventRegistration PRIMARY KEY (ID),
    CONSTRAINT UQ_EventRegistration_RegKey UNIQUE (RegKey),
    CONSTRAINT FK_EventRegistration_Person FOREIGN KEY (PersonID) REFERENCES __mj_BizAppsCommon.Person(ID),
    CONSTRAINT FK_EventRegistration_Event FOREIGN KEY (EventID) REFERENCES morecheese_events.Event(ID)
);
GO

---------------------------------------------------------------------------
-- Course + CourseEnrollment: the learning catalog and its enrollments
-- (completion is a calibrated outcome; Attended-style selection effects
-- are handled at generation time)
---------------------------------------------------------------------------
CREATE TABLE morecheese_learning.Course (
    ID UNIQUEIDENTIFIER NOT NULL DEFAULT NEWSEQUENTIALID(),
    CourseKey NVARCHAR(50) NOT NULL,
    Name NVARCHAR(200) NOT NULL,
    StartDate DATE NOT NULL,
    DurationWeeks INT NOT NULL,
    IsSharedDemo BIT NOT NULL DEFAULT 1,
    CONSTRAINT PK_Course PRIMARY KEY (ID),
    CONSTRAINT UQ_Course_CourseKey UNIQUE (CourseKey)
);
GO

CREATE TABLE morecheese_learning.CourseEnrollment (
    ID UNIQUEIDENTIFIER NOT NULL DEFAULT NEWSEQUENTIALID(),
    EnrollKey NVARCHAR(80) NOT NULL,
    PersonID UNIQUEIDENTIFIER NOT NULL,
    CourseID UNIQUEIDENTIFIER NOT NULL,
    EnrolledOn DATE NOT NULL,
    Status NVARCHAR(50) NOT NULL,
    CompletedOn DATE NULL,
    IsSharedDemo BIT NOT NULL DEFAULT 1,
    CONSTRAINT PK_CourseEnrollment PRIMARY KEY (ID),
    CONSTRAINT UQ_CourseEnrollment_EnrollKey UNIQUE (EnrollKey),
    CONSTRAINT FK_CourseEnrollment_Person FOREIGN KEY (PersonID) REFERENCES __mj_BizAppsCommon.Person(ID),
    CONSTRAINT FK_CourseEnrollment_Course FOREIGN KEY (CourseID) REFERENCES morecheese_learning.Course(ID),
    CONSTRAINT CK_CourseEnrollment_Status CHECK (Status IN ('InProgress', 'Completed', 'Dropped'))
);
GO

---------------------------------------------------------------------------
-- Extended properties (MS_Description) — CodeGen reads these into entity
-- descriptions
---------------------------------------------------------------------------
EXEC sp_addextendedproperty @name = N'MS_Description', @value = N'Org-specific extension of bizapps-common Organization: demo geography and the lifecycle events (dissolution/acquisition/program cut) that drive employer-related churn', @level0type = N'SCHEMA', @level0name = N'${flyway:defaultSchema}', @level1type = N'TABLE', @level1name = N'OrganizationProfile';
GO

EXEC sp_addextendedproperty @name = N'MS_Description', @value = N'Member-specific extension of bizapps-common Person: member number, segment, geography, join date (v2-plan §4.2)', @level0type = N'SCHEMA', @level0name = N'${flyway:defaultSchema}', @level1type = N'TABLE', @level1name = N'MemberProfile';
GO

EXEC sp_addextendedproperty @name = N'MS_Description', @value = N'One row per membership cycle; member status is derived from the latest period. Decomposes into bizapps-orders Subscription + renewal Orders when that app ships', @level0type = N'SCHEMA', @level0name = N'${flyway:defaultSchema}', @level1type = N'TABLE', @level1name = N'MembershipPeriod';
GO

EXEC sp_addextendedproperty @name = N'MS_Description', @value = N'Conferences, workshops, and webinars with venue coordinates for the member map', @level0type = N'SCHEMA', @level0name = N'morecheese_events', @level1type = N'TABLE', @level1name = N'Event';
GO

EXEC sp_addextendedproperty @name = N'MS_Description', @value = N'Event registrations; Attended NULL means the event has not occurred yet', @level0type = N'SCHEMA', @level0name = N'morecheese_events', @level1type = N'TABLE', @level1name = N'EventRegistration';
GO

EXEC sp_addextendedproperty @name = N'MS_Description', @value = N'The learning catalog', @level0type = N'SCHEMA', @level0name = N'morecheese_learning', @level1type = N'TABLE', @level1name = N'Course';
GO

EXEC sp_addextendedproperty @name = N'MS_Description', @value = N'Course enrollments with completion outcomes', @level0type = N'SCHEMA', @level0name = N'morecheese_learning', @level1type = N'TABLE', @level1name = N'CourseEnrollment';
GO

---------------------------------------------------------------------------
-- Column descriptions (MS_Description on every column except PKs/FKs, per
-- the MJ migration rules) — CodeGen turns these into entity-FIELD descriptions
---------------------------------------------------------------------------
EXEC sp_addextendedproperty @name = N'MS_Description', @value = N'Business key for the organization (e.g. ORG-0042); UUIDs derive from it', @level0type = N'SCHEMA', @level0name = N'${flyway:defaultSchema}', @level1type = N'TABLE', @level1name = N'OrganizationProfile', @level2type = N'COLUMN', @level2name = N'OrgKey';
GO

EXEC sp_addextendedproperty @name = N'MS_Description', @value = N'What the organization does in the cheese world: Producer, Retailer, Supplier, or Educator', @level0type = N'SCHEMA', @level0name = N'${flyway:defaultSchema}', @level1type = N'TABLE', @level1name = N'OrganizationProfile', @level2type = N'COLUMN', @level2name = N'Type';
GO

EXEC sp_addextendedproperty @name = N'MS_Description', @value = N'Coarse geography bucket: NA, EU, or RoW', @level0type = N'SCHEMA', @level0name = N'${flyway:defaultSchema}', @level1type = N'TABLE', @level1name = N'OrganizationProfile', @level2type = N'COLUMN', @level2name = N'Region';
GO

EXEC sp_addextendedproperty @name = N'MS_Description', @value = N'Headquarters city (real city, invented business name)', @level0type = N'SCHEMA', @level0name = N'${flyway:defaultSchema}', @level1type = N'TABLE', @level1name = N'OrganizationProfile', @level2type = N'COLUMN', @level2name = N'City';
GO

EXEC sp_addextendedproperty @name = N'MS_Description', @value = N'Headquarters state/country code', @level0type = N'SCHEMA', @level0name = N'${flyway:defaultSchema}', @level1type = N'TABLE', @level1name = N'OrganizationProfile', @level2type = N'COLUMN', @level2name = N'State';
GO

EXEC sp_addextendedproperty @name = N'MS_Description', @value = N'Headquarters latitude, pre-baked for the map (no live geocoding)', @level0type = N'SCHEMA', @level0name = N'${flyway:defaultSchema}', @level1type = N'TABLE', @level1name = N'OrganizationProfile', @level2type = N'COLUMN', @level2name = N'Latitude';
GO

EXEC sp_addextendedproperty @name = N'MS_Description', @value = N'Headquarters longitude, pre-baked for the map (no live geocoding)', @level0type = N'SCHEMA', @level0name = N'${flyway:defaultSchema}', @level1type = N'TABLE', @level1name = N'OrganizationProfile', @level2type = N'COLUMN', @level2name = N'Longitude';
GO

EXEC sp_addextendedproperty @name = N'MS_Description', @value = N'The org-level shock, if any: Dissolved, Acquired, or ProgramCut — the driver behind employer-related churn', @level0type = N'SCHEMA', @level0name = N'${flyway:defaultSchema}', @level1type = N'TABLE', @level1name = N'OrganizationProfile', @level2type = N'COLUMN', @level2name = N'LifecycleEventKind';
GO

EXEC sp_addextendedproperty @name = N'MS_Description', @value = N'Year the lifecycle event happened', @level0type = N'SCHEMA', @level0name = N'${flyway:defaultSchema}', @level1type = N'TABLE', @level1name = N'OrganizationProfile', @level2type = N'COLUMN', @level2name = N'LifecycleEventYear';
GO

EXEC sp_addextendedproperty @name = N'MS_Description', @value = N'Marks generated shared-demo rows; the wipe-and-recreate boundary', @level0type = N'SCHEMA', @level0name = N'${flyway:defaultSchema}', @level1type = N'TABLE', @level1name = N'OrganizationProfile', @level2type = N'COLUMN', @level2name = N'IsSharedDemo';
GO

EXEC sp_addextendedproperty @name = N'MS_Description', @value = N'Business key for the member (e.g. ICF-100217); UUIDs derive from it', @level0type = N'SCHEMA', @level0name = N'${flyway:defaultSchema}', @level1type = N'TABLE', @level1name = N'MemberProfile', @level2type = N'COLUMN', @level2name = N'MemberNumber';
GO

EXEC sp_addextendedproperty @name = N'MS_Description', @value = N'Professional segment: Producer, Retailer, Supplier, Educator, or Enthusiast', @level0type = N'SCHEMA', @level0name = N'${flyway:defaultSchema}', @level1type = N'TABLE', @level1name = N'MemberProfile', @level2type = N'COLUMN', @level2name = N'Segment';
GO

EXEC sp_addextendedproperty @name = N'MS_Description', @value = N'Coarse geography bucket: NA, EU, or RoW', @level0type = N'SCHEMA', @level0name = N'${flyway:defaultSchema}', @level1type = N'TABLE', @level1name = N'MemberProfile', @level2type = N'COLUMN', @level2name = N'Region';
GO

EXEC sp_addextendedproperty @name = N'MS_Description', @value = N'Member city (real city; drives the member map)', @level0type = N'SCHEMA', @level0name = N'${flyway:defaultSchema}', @level1type = N'TABLE', @level1name = N'MemberProfile', @level2type = N'COLUMN', @level2name = N'City';
GO

EXEC sp_addextendedproperty @name = N'MS_Description', @value = N'Member state/country code', @level0type = N'SCHEMA', @level0name = N'${flyway:defaultSchema}', @level1type = N'TABLE', @level1name = N'MemberProfile', @level2type = N'COLUMN', @level2name = N'State';
GO

EXEC sp_addextendedproperty @name = N'MS_Description', @value = N'Member latitude, pre-baked for the map', @level0type = N'SCHEMA', @level0name = N'${flyway:defaultSchema}', @level1type = N'TABLE', @level1name = N'MemberProfile', @level2type = N'COLUMN', @level2name = N'Latitude';
GO

EXEC sp_addextendedproperty @name = N'MS_Description', @value = N'Member longitude, pre-baked for the map', @level0type = N'SCHEMA', @level0name = N'${flyway:defaultSchema}', @level1type = N'TABLE', @level1name = N'MemberProfile', @level2type = N'COLUMN', @level2name = N'Longitude';
GO

EXEC sp_addextendedproperty @name = N'MS_Description', @value = N'Date the member first joined the federation', @level0type = N'SCHEMA', @level0name = N'${flyway:defaultSchema}', @level1type = N'TABLE', @level1name = N'MemberProfile', @level2type = N'COLUMN', @level2name = N'JoinDate';
GO

EXEC sp_addextendedproperty @name = N'MS_Description', @value = N'Marks generated shared-demo rows; the wipe-and-recreate boundary', @level0type = N'SCHEMA', @level0name = N'${flyway:defaultSchema}', @level1type = N'TABLE', @level1name = N'MemberProfile', @level2type = N'COLUMN', @level2name = N'IsSharedDemo';
GO

EXEC sp_addextendedproperty @name = N'MS_Description', @value = N'Business key: <MemberNumber>-P<n>, the n-th period of that member', @level0type = N'SCHEMA', @level0name = N'${flyway:defaultSchema}', @level1type = N'TABLE', @level1name = N'MembershipPeriod', @level2type = N'COLUMN', @level2name = N'PeriodKey';
GO

EXEC sp_addextendedproperty @name = N'MS_Description', @value = N'Tier for this period: Enthusiast, Individual, SmallBusiness, or Corporate', @level0type = N'SCHEMA', @level0name = N'${flyway:defaultSchema}', @level1type = N'TABLE', @level1name = N'MembershipPeriod', @level2type = N'COLUMN', @level2name = N'MembershipTier';
GO

EXEC sp_addextendedproperty @name = N'MS_Description', @value = N'Dues billed for this period, in USD, per the tier lattice', @level0type = N'SCHEMA', @level0name = N'${flyway:defaultSchema}', @level1type = N'TABLE', @level1name = N'MembershipPeriod', @level2type = N'COLUMN', @level2name = N'DuesAmount';
GO

EXEC sp_addextendedproperty @name = N'MS_Description', @value = N'Period start; renewals back-date so consecutive periods never gap', @level0type = N'SCHEMA', @level0name = N'${flyway:defaultSchema}', @level1type = N'TABLE', @level1name = N'MembershipPeriod', @level2type = N'COLUMN', @level2name = N'StartDate';
GO

EXEC sp_addextendedproperty @name = N'MS_Description', @value = N'Period end; member status is derived from the latest period, never stored', @level0type = N'SCHEMA', @level0name = N'${flyway:defaultSchema}', @level1type = N'TABLE', @level1name = N'MembershipPeriod', @level2type = N'COLUMN', @level2name = N'EndDate';
GO

EXEC sp_addextendedproperty @name = N'MS_Description', @value = N'Date the renewal decision falls due (equals EndDate)', @level0type = N'SCHEMA', @level0name = N'${flyway:defaultSchema}', @level1type = N'TABLE', @level1name = N'MembershipPeriod', @level2type = N'COLUMN', @level2name = N'RenewalDate';
GO

EXEC sp_addextendedproperty @name = N'MS_Description', @value = N'Period state: Active, Renewed, Lapsed, PendingRenewal, or Cancelled — member-lifecycle state lives HERE, never on Person', @level0type = N'SCHEMA', @level0name = N'${flyway:defaultSchema}', @level1type = N'TABLE', @level1name = N'MembershipPeriod', @level2type = N'COLUMN', @level2name = N'Status';
GO

EXEC sp_addextendedproperty @name = N'MS_Description', @value = N'Set when a lapse passes the 2-month grace window (team rule: every lapse past grace gets a termination date)', @level0type = N'SCHEMA', @level0name = N'${flyway:defaultSchema}', @level1type = N'TABLE', @level1name = N'MembershipPeriod', @level2type = N'COLUMN', @level2name = N'CancellationDate';
GO

EXEC sp_addextendedproperty @name = N'MS_Description', @value = N'Why the membership ended (e.g. non-payment — employer event); carries the diagnosis for win-back stories', @level0type = N'SCHEMA', @level0name = N'${flyway:defaultSchema}', @level1type = N'TABLE', @level1name = N'MembershipPeriod', @level2type = N'COLUMN', @level2name = N'CancellationReason';
GO

EXEC sp_addextendedproperty @name = N'MS_Description', @value = N'Whether this period renews automatically (card on file)', @level0type = N'SCHEMA', @level0name = N'${flyway:defaultSchema}', @level1type = N'TABLE', @level1name = N'MembershipPeriod', @level2type = N'COLUMN', @level2name = N'AutoRenew';
GO

EXEC sp_addextendedproperty @name = N'MS_Description', @value = N'Marks generated shared-demo rows; the wipe-and-recreate boundary', @level0type = N'SCHEMA', @level0name = N'${flyway:defaultSchema}', @level1type = N'TABLE', @level1name = N'MembershipPeriod', @level2type = N'COLUMN', @level2name = N'IsSharedDemo';
GO

EXEC sp_addextendedproperty @name = N'MS_Description', @value = N'Business key (e.g. EVT-2025-CONF); UUIDs derive from it', @level0type = N'SCHEMA', @level0name = N'morecheese_events', @level1type = N'TABLE', @level1name = N'Event', @level2type = N'COLUMN', @level2name = N'EventKey';
GO

EXEC sp_addextendedproperty @name = N'MS_Description', @value = N'Event display name', @level0type = N'SCHEMA', @level0name = N'morecheese_events', @level1type = N'TABLE', @level1name = N'Event', @level2type = N'COLUMN', @level2name = N'Name';
GO

EXEC sp_addextendedproperty @name = N'MS_Description', @value = N'Conference, Workshop, or Webinar', @level0type = N'SCHEMA', @level0name = N'morecheese_events', @level1type = N'TABLE', @level1name = N'Event', @level2type = N'COLUMN', @level2name = N'EventType';
GO

EXEC sp_addextendedproperty @name = N'MS_Description', @value = N'Date the event takes place', @level0type = N'SCHEMA', @level0name = N'morecheese_events', @level1type = N'TABLE', @level1name = N'Event', @level2type = N'COLUMN', @level2name = N'EventDate';
GO

EXEC sp_addextendedproperty @name = N'MS_Description', @value = N'Virtual events have no venue coordinates (COVID-era conferences were virtual)', @level0type = N'SCHEMA', @level0name = N'morecheese_events', @level1type = N'TABLE', @level1name = N'Event', @level2type = N'COLUMN', @level2name = N'IsVirtual';
GO

EXEC sp_addextendedproperty @name = N'MS_Description', @value = N'Whether registration is billable (webinars are free)', @level0type = N'SCHEMA', @level0name = N'morecheese_events', @level1type = N'TABLE', @level1name = N'Event', @level2type = N'COLUMN', @level2name = N'IsPaid';
GO

EXEC sp_addextendedproperty @name = N'MS_Description', @value = N'Venue city; NULL for virtual events', @level0type = N'SCHEMA', @level0name = N'morecheese_events', @level1type = N'TABLE', @level1name = N'Event', @level2type = N'COLUMN', @level2name = N'City';
GO

EXEC sp_addextendedproperty @name = N'MS_Description', @value = N'Venue state; NULL for virtual events', @level0type = N'SCHEMA', @level0name = N'morecheese_events', @level1type = N'TABLE', @level1name = N'Event', @level2type = N'COLUMN', @level2name = N'State';
GO

EXEC sp_addextendedproperty @name = N'MS_Description', @value = N'Venue latitude for the events map; NULL for virtual', @level0type = N'SCHEMA', @level0name = N'morecheese_events', @level1type = N'TABLE', @level1name = N'Event', @level2type = N'COLUMN', @level2name = N'Latitude';
GO

EXEC sp_addextendedproperty @name = N'MS_Description', @value = N'Venue longitude for the events map; NULL for virtual', @level0type = N'SCHEMA', @level0name = N'morecheese_events', @level1type = N'TABLE', @level1name = N'Event', @level2type = N'COLUMN', @level2name = N'Longitude';
GO

EXEC sp_addextendedproperty @name = N'MS_Description', @value = N'Marks generated shared-demo rows; the wipe-and-recreate boundary', @level0type = N'SCHEMA', @level0name = N'morecheese_events', @level1type = N'TABLE', @level1name = N'Event', @level2type = N'COLUMN', @level2name = N'IsSharedDemo';
GO

EXEC sp_addextendedproperty @name = N'MS_Description', @value = N'Business key: REG-<member>-<event>[-n]; UUIDs derive from it', @level0type = N'SCHEMA', @level0name = N'morecheese_events', @level1type = N'TABLE', @level1name = N'EventRegistration', @level2type = N'COLUMN', @level2name = N'RegKey';
GO

EXEC sp_addextendedproperty @name = N'MS_Description', @value = N'Registration date — always inside a valid membership window by construction', @level0type = N'SCHEMA', @level0name = N'morecheese_events', @level1type = N'TABLE', @level1name = N'EventRegistration', @level2type = N'COLUMN', @level2name = N'RegisteredOn';
GO

EXEC sp_addextendedproperty @name = N'MS_Description', @value = N'Whether the member showed up; NULL means the event has not happened yet', @level0type = N'SCHEMA', @level0name = N'morecheese_events', @level1type = N'TABLE', @level1name = N'EventRegistration', @level2type = N'COLUMN', @level2name = N'Attended';
GO

EXEC sp_addextendedproperty @name = N'MS_Description', @value = N'Marks generated shared-demo rows; the wipe-and-recreate boundary', @level0type = N'SCHEMA', @level0name = N'morecheese_events', @level1type = N'TABLE', @level1name = N'EventRegistration', @level2type = N'COLUMN', @level2name = N'IsSharedDemo';
GO

EXEC sp_addextendedproperty @name = N'MS_Description', @value = N'Business key; UUIDs derive from it', @level0type = N'SCHEMA', @level0name = N'morecheese_learning', @level1type = N'TABLE', @level1name = N'Course', @level2type = N'COLUMN', @level2name = N'CourseKey';
GO

EXEC sp_addextendedproperty @name = N'MS_Description', @value = N'Course title', @level0type = N'SCHEMA', @level0name = N'morecheese_learning', @level1type = N'TABLE', @level1name = N'Course', @level2type = N'COLUMN', @level2name = N'Name';
GO

EXEC sp_addextendedproperty @name = N'MS_Description', @value = N'Cohort start date', @level0type = N'SCHEMA', @level0name = N'morecheese_learning', @level1type = N'TABLE', @level1name = N'Course', @level2type = N'COLUMN', @level2name = N'StartDate';
GO

EXEC sp_addextendedproperty @name = N'MS_Description', @value = N'Course length in weeks', @level0type = N'SCHEMA', @level0name = N'morecheese_learning', @level1type = N'TABLE', @level1name = N'Course', @level2type = N'COLUMN', @level2name = N'DurationWeeks';
GO

EXEC sp_addextendedproperty @name = N'MS_Description', @value = N'Marks generated shared-demo rows; the wipe-and-recreate boundary', @level0type = N'SCHEMA', @level0name = N'morecheese_learning', @level1type = N'TABLE', @level1name = N'Course', @level2type = N'COLUMN', @level2name = N'IsSharedDemo';
GO

EXEC sp_addextendedproperty @name = N'MS_Description', @value = N'Business key; UUIDs derive from it', @level0type = N'SCHEMA', @level0name = N'morecheese_learning', @level1type = N'TABLE', @level1name = N'CourseEnrollment', @level2type = N'COLUMN', @level2name = N'EnrollKey';
GO

EXEC sp_addextendedproperty @name = N'MS_Description', @value = N'Enrollment date — always inside a valid membership window', @level0type = N'SCHEMA', @level0name = N'morecheese_learning', @level1type = N'TABLE', @level1name = N'CourseEnrollment', @level2type = N'COLUMN', @level2name = N'EnrolledOn';
GO

EXEC sp_addextendedproperty @name = N'MS_Description', @value = N'InProgress, Completed, or Dropped (completion is a calibrated outcome)', @level0type = N'SCHEMA', @level0name = N'morecheese_learning', @level1type = N'TABLE', @level1name = N'CourseEnrollment', @level2type = N'COLUMN', @level2name = N'Status';
GO

EXEC sp_addextendedproperty @name = N'MS_Description', @value = N'Completion date when Status is Completed', @level0type = N'SCHEMA', @level0name = N'morecheese_learning', @level1type = N'TABLE', @level1name = N'CourseEnrollment', @level2type = N'COLUMN', @level2name = N'CompletedOn';
GO

EXEC sp_addextendedproperty @name = N'MS_Description', @value = N'Marks generated shared-demo rows; the wipe-and-recreate boundary', @level0type = N'SCHEMA', @level0name = N'morecheese_learning', @level1type = N'TABLE', @level1name = N'CourseEnrollment', @level2type = N'COLUMN', @level2name = N'IsSharedDemo';
GO

-- =========================================================================
-- 3. CODEGEN SECTION — TO BE SPLICED AT FIRST PUBLISH
-- =========================================================================
-- Per the BizApps baseline convention: run `mj codegen` against a database that has ONLY
-- the migrations up to this point applied, then fold the SQL it emits (entity/field
-- registrations, __mj_* audit columns, FK indexes, base views, CRUD procs, permissions,
-- ApplicationEntity rows for the app above) into this section, replacing this comment.
-- Dev/playground databases get the identical effect by running `mj codegen` directly
-- (see datagen/PLAYGROUND.md), so splicing is only required when the app publishes.
-- =========================================================================
GO

-- ==================================================================
-- CONSOLIDATED into baseline (was V202607161600__v1.0.0_Certifications_Competition_Advocacy.sql)
-- ==================================================================

-- ============================================================
-- MoreCheese: certifications, competition entries, advocacy actions (v1.2.0)
-- The "more tables" enrichment (2026-07-16): three new demo domains that unlock the
-- remaining expressible personas — Sofia Marchetti (the certification journey), Henri
-- Dubois's Gold medal (the competition eligibility story), Tom Reyes (the advocacy
-- champion / Sonar component-breakdown demo).
-- Hand-authored per the ownership rule (the baseline is immutable; the generator never
-- writes migrations). No __mj_* columns, no FK indexes — CodeGen owns those.
-- ============================================================

---------------------------------------------------------------------------
-- Certification: the credential catalog (learning domain)
---------------------------------------------------------------------------
CREATE TABLE morecheese_learning.Certification (
    ID UNIQUEIDENTIFIER NOT NULL DEFAULT NEWSEQUENTIALID(),
    CertKey NVARCHAR(50) NOT NULL,
    Name NVARCHAR(200) NOT NULL,
    Description NVARCHAR(MAX) NULL,
    ValidYears INT NOT NULL DEFAULT 3,
    IsSharedDemo BIT NOT NULL DEFAULT 1,
    CONSTRAINT PK_Certification PRIMARY KEY (ID),
    CONSTRAINT UQ_Certification_CertKey UNIQUE (CertKey)
);
GO

CREATE TABLE morecheese_learning.MemberCertification (
    ID UNIQUEIDENTIFIER NOT NULL DEFAULT NEWSEQUENTIALID(),
    MemberCertKey NVARCHAR(80) NOT NULL,
    PersonID UNIQUEIDENTIFIER NOT NULL,
    CertificationID UNIQUEIDENTIFIER NOT NULL,
    Status NVARCHAR(50) NOT NULL,
    EnrolledOn DATE NOT NULL,
    AwardedOn DATE NULL,
    ExpiresOn DATE NULL,
    IsSharedDemo BIT NOT NULL DEFAULT 1,
    CONSTRAINT PK_MemberCertification PRIMARY KEY (ID),
    CONSTRAINT UQ_MemberCertification_Key UNIQUE (MemberCertKey),
    CONSTRAINT FK_MemberCertification_Person FOREIGN KEY (PersonID) REFERENCES __mj_BizAppsCommon.Person(ID),
    CONSTRAINT FK_MemberCertification_Certification FOREIGN KEY (CertificationID) REFERENCES morecheese_learning.Certification(ID),
    CONSTRAINT CK_MemberCertification_Status CHECK (Status IN ('InProgress', 'Awarded', 'Expired', 'Withdrawn'))
);
GO

---------------------------------------------------------------------------
-- CompetitionEntry: the annual judging (events domain) — org membership is
-- the eligibility gate (Henri's join trigger)
---------------------------------------------------------------------------
CREATE TABLE morecheese_events.CompetitionEntry (
    ID UNIQUEIDENTIFIER NOT NULL DEFAULT NEWSEQUENTIALID(),
    EntryKey NVARCHAR(80) NOT NULL,
    PersonID UNIQUEIDENTIFIER NOT NULL,
    OrganizationID UNIQUEIDENTIFIER NULL,
    EntryYear INT NOT NULL,
    Category NVARCHAR(100) NOT NULL,
    ProductName NVARCHAR(200) NOT NULL,
    Result NVARCHAR(50) NOT NULL DEFAULT 'None',
    IsSharedDemo BIT NOT NULL DEFAULT 1,
    CONSTRAINT PK_CompetitionEntry PRIMARY KEY (ID),
    CONSTRAINT UQ_CompetitionEntry_Key UNIQUE (EntryKey),
    CONSTRAINT FK_CompetitionEntry_Person FOREIGN KEY (PersonID) REFERENCES __mj_BizAppsCommon.Person(ID),
    CONSTRAINT FK_CompetitionEntry_Organization FOREIGN KEY (OrganizationID) REFERENCES __mj_BizAppsCommon.Organization(ID),
    CONSTRAINT CK_CompetitionEntry_Result CHECK (Result IN ('Gold', 'Silver', 'Bronze', 'None'))
);
GO

---------------------------------------------------------------------------
-- AdvocacyAction: legislative engagement (membership domain) — the
-- "engaged, but differently shaped" signal for Sonar's component breakdown
---------------------------------------------------------------------------
CREATE TABLE morecheese_members.AdvocacyAction (
    ID UNIQUEIDENTIFIER NOT NULL DEFAULT NEWSEQUENTIALID(),
    ActionKey NVARCHAR(80) NOT NULL,
    PersonID UNIQUEIDENTIFIER NOT NULL,
    ActionDate DATE NOT NULL,
    Kind NVARCHAR(50) NOT NULL,
    Topic NVARCHAR(200) NOT NULL,
    IsSharedDemo BIT NOT NULL DEFAULT 1,
    CONSTRAINT PK_AdvocacyAction PRIMARY KEY (ID),
    CONSTRAINT UQ_AdvocacyAction_Key UNIQUE (ActionKey),
    CONSTRAINT FK_AdvocacyAction_Person FOREIGN KEY (PersonID) REFERENCES __mj_BizAppsCommon.Person(ID),
    CONSTRAINT CK_AdvocacyAction_Kind CHECK (Kind IN ('LetterCampaign', 'PetitionSignature', 'Testimony', 'CoalitionMeeting'))
);
GO

---------------------------------------------------------------------------
-- Extended properties (MS_Description) — tables + non-PK/FK columns
---------------------------------------------------------------------------
EXEC sp_addextendedproperty @name = N'MS_Description', @value = N'The credential catalog (CCP, sensory evaluation, food safety)', @level0type = N'SCHEMA', @level0name = N'morecheese_learning', @level1type = N'TABLE', @level1name = N'Certification';
GO

EXEC sp_addextendedproperty @name = N'MS_Description', @value = N'A member''s certification journey: enrolled, awarded (with expiry), expired, or withdrawn', @level0type = N'SCHEMA', @level0name = N'morecheese_learning', @level1type = N'TABLE', @level1name = N'MemberCertification';
GO

EXEC sp_addextendedproperty @name = N'MS_Description', @value = N'Annual competition entries; org membership is the eligibility gate, results are medal or none', @level0type = N'SCHEMA', @level0name = N'morecheese_events', @level1type = N'TABLE', @level1name = N'CompetitionEntry';
GO

EXEC sp_addextendedproperty @name = N'MS_Description', @value = N'Legislative engagement actions — the advocacy-shaped component of member engagement', @level0type = N'SCHEMA', @level0name = N'morecheese_members', @level1type = N'TABLE', @level1name = N'AdvocacyAction';
GO

EXEC sp_addextendedproperty @name = N'MS_Description', @value = N'Business key (e.g. CERT-CCP)', @level0type = N'SCHEMA', @level0name = N'morecheese_learning', @level1type = N'TABLE', @level1name = N'Certification', @level2type = N'COLUMN', @level2name = N'CertKey';
GO

EXEC sp_addextendedproperty @name = N'MS_Description', @value = N'Years the credential stays valid after award', @level0type = N'SCHEMA', @level0name = N'morecheese_learning', @level1type = N'TABLE', @level1name = N'Certification', @level2type = N'COLUMN', @level2name = N'ValidYears';
GO

EXEC sp_addextendedproperty @name = N'MS_Description', @value = N'InProgress, Awarded, Expired, or Withdrawn', @level0type = N'SCHEMA', @level0name = N'morecheese_learning', @level1type = N'TABLE', @level1name = N'MemberCertification', @level2type = N'COLUMN', @level2name = N'Status';
GO

EXEC sp_addextendedproperty @name = N'MS_Description', @value = N'Competition category (e.g. Alpine Styles, Soft-Ripened)', @level0type = N'SCHEMA', @level0name = N'morecheese_events', @level1type = N'TABLE', @level1name = N'CompetitionEntry', @level2type = N'COLUMN', @level2name = N'Category';
GO

EXEC sp_addextendedproperty @name = N'MS_Description', @value = N'The entered cheese (invented product names from the cleared bank components)', @level0type = N'SCHEMA', @level0name = N'morecheese_events', @level1type = N'TABLE', @level1name = N'CompetitionEntry', @level2type = N'COLUMN', @level2name = N'ProductName';
GO

EXEC sp_addextendedproperty @name = N'MS_Description', @value = N'Gold, Silver, Bronze, or None', @level0type = N'SCHEMA', @level0name = N'morecheese_events', @level1type = N'TABLE', @level1name = N'CompetitionEntry', @level2type = N'COLUMN', @level2name = N'Result';
GO

EXEC sp_addextendedproperty @name = N'MS_Description', @value = N'LetterCampaign, PetitionSignature, Testimony, or CoalitionMeeting', @level0type = N'SCHEMA', @level0name = N'morecheese_members', @level1type = N'TABLE', @level1name = N'AdvocacyAction', @level2type = N'COLUMN', @level2name = N'Kind';
GO

-- ==================================================================
-- CONSOLIDATED into baseline (was V202607161700__v1.0.0_Data_Quality_Labels.sql)
-- ==================================================================

-- ============================================================
-- MoreCheese: data-quality defect labels (v1.3.0)
-- The defects module (feedback 2026-07-16): the generator deliberately injects
-- realistic record defects (duplicate people, stale employers, typo'd emails) and
-- records EVERY injection here as labeled ground truth — so data-quality demos
-- (dedup, enrichment, cleansing) have a verifiable right answer.
-- Hand-authored per the ownership rule. No __mj_* columns, no FK indexes (CodeGen).
-- ============================================================

CREATE TABLE morecheese_members.DataQualityLabel (
    ID UNIQUEIDENTIFIER NOT NULL DEFAULT NEWSEQUENTIALID(),
    LabelKey NVARCHAR(80) NOT NULL,
    DefectKind NVARCHAR(50) NOT NULL,
    PersonID UNIQUEIDENTIFIER NOT NULL,
    RelatedPersonID UNIQUEIDENTIFIER NULL,
    RelatedOrganizationID UNIQUEIDENTIFIER NULL,
    DefectValue NVARCHAR(400) NULL,
    TruthValue NVARCHAR(400) NULL,
    Notes NVARCHAR(500) NULL,
    IsSharedDemo BIT NOT NULL DEFAULT 1,
    CONSTRAINT PK_DataQualityLabel PRIMARY KEY (ID),
    CONSTRAINT UQ_DataQualityLabel_Key UNIQUE (LabelKey),
    CONSTRAINT FK_DataQualityLabel_Person FOREIGN KEY (PersonID) REFERENCES __mj_BizAppsCommon.Person(ID),
    CONSTRAINT FK_DataQualityLabel_RelatedPerson FOREIGN KEY (RelatedPersonID) REFERENCES __mj_BizAppsCommon.Person(ID),
    CONSTRAINT FK_DataQualityLabel_RelatedOrganization FOREIGN KEY (RelatedOrganizationID) REFERENCES __mj_BizAppsCommon.Organization(ID),
    CONSTRAINT CK_DataQualityLabel_Kind CHECK (DefectKind IN ('DuplicatePerson', 'StaleEmployer', 'TypoEmail'))
);
GO

EXEC sp_addextendedproperty @name = N'MS_Description', @value = N'Labeled ground truth for deliberately injected data defects — every duplicate, stale record, and typo the generator planted, with the correct answer. Data-quality demos verify against this table.', @level0type = N'SCHEMA', @level0name = N'morecheese_members', @level1type = N'TABLE', @level1name = N'DataQualityLabel';
GO

EXEC sp_addextendedproperty @name = N'MS_Description', @value = N'DuplicatePerson (RelatedPersonID = the canonical record), StaleEmployer (RelatedOrganizationID = the TRUE employer), or TypoEmail (TruthValue = the correct email)', @level0type = N'SCHEMA', @level0name = N'morecheese_members', @level1type = N'TABLE', @level1name = N'DataQualityLabel', @level2type = N'COLUMN', @level2name = N'DefectKind';
GO

EXEC sp_addextendedproperty @name = N'MS_Description', @value = N'The defective value as it appears in the data (e.g. the typo''d email, the stale org name)', @level0type = N'SCHEMA', @level0name = N'morecheese_members', @level1type = N'TABLE', @level1name = N'DataQualityLabel', @level2type = N'COLUMN', @level2name = N'DefectValue';
GO

EXEC sp_addextendedproperty @name = N'MS_Description', @value = N'The correct value (the verifiable right answer)', @level0type = N'SCHEMA', @level0name = N'morecheese_members', @level1type = N'TABLE', @level1name = N'DataQualityLabel', @level2type = N'COLUMN', @level2name = N'TruthValue';
GO


















































-- =============================================================================
-- GENERATED BY MemberJunction CodeGen — DO NOT EDIT BY HAND
-- =============================================================================

/* SQL generated to create new entity MoreCheese: Event Registrations */

      INSERT INTO [${mjSchema}].[Entity] (
         [ID],
         [Name],
         [DisplayName],
         [Description],
         [NameSuffix],
         [BaseTable],
         [BaseView],
         [SchemaName],
         [IncludeInAPI],
         [AllowUserSearchAPI],
         [AllowCaching]
         , [TrackRecordChanges]
         , [AuditRecordAccess]
         , [AuditViewRuns]
         , [AllowAllRowsAPI]
         , [AllowCreateAPI]
         , [AllowUpdateAPI]
         , [AllowDeleteAPI]
         , [UserViewMaxRows]
         , [__mj_CreatedAt]
         , [__mj_UpdatedAt]
      )
      VALUES (
         'cd3ebece-bfbe-485c-8ff4-8744a030fe07',
         'MoreCheese: Event Registrations',
         'Event Registrations',
         'Event registrations; Attended NULL means the event has not occurred yet',
         NULL,
         'EventRegistration',
         'vwEventRegistrations',
         'morecheese_events',
         1,
         1,
         0
         , 1
         , 0
         , 0
         , 0
         , 1
         , 1
         , 1
         , 1000
         , GETUTCDATE()
         , GETUTCDATE()
      );

/* SQL generated to create new application morecheese_events */
IF NOT EXISTS (
      SELECT 1 FROM [${mjSchema}].[Application] WHERE [ID] = '10ccbe4e-a3f7-4710-bda3-3dc8e6dd75b8'
   )
   BEGIN
      INSERT INTO [${mjSchema}].[Application] ([ID], [Name], [Description], [SchemaAutoAddNewEntities], [Path], [AutoUpdatePath], [DefaultForNewUser])
                       VALUES ('10ccbe4e-a3f7-4710-bda3-3dc8e6dd75b8', 'morecheese_events', 'Generated for schema', 'morecheese_events', 'morecheeseevents', 1, 0)
   END;

/* Adding role UI to application morecheese_events */
IF NOT EXISTS (
      SELECT 1 FROM [${mjSchema}].[ApplicationRole] WHERE [ApplicationID] = '10ccbe4e-a3f7-4710-bda3-3dc8e6dd75b8' AND [RoleID] = 'E0AFCCEC-6A37-EF11-86D4-000D3A4E707E'
   )
   BEGIN
      INSERT INTO [${mjSchema}].[ApplicationRole]
                                 ([ApplicationID], [RoleID], [CanAccess], [CanAdmin]) VALUES
                                 ('10ccbe4e-a3f7-4710-bda3-3dc8e6dd75b8', 'E0AFCCEC-6A37-EF11-86D4-000D3A4E707E', 1, 0)
   END;

/* Adding role Developer to application morecheese_events */
IF NOT EXISTS (
      SELECT 1 FROM [${mjSchema}].[ApplicationRole] WHERE [ApplicationID] = '10ccbe4e-a3f7-4710-bda3-3dc8e6dd75b8' AND [RoleID] = 'DEAFCCEC-6A37-EF11-86D4-000D3A4E707E'
   )
   BEGIN
      INSERT INTO [${mjSchema}].[ApplicationRole]
                                 ([ApplicationID], [RoleID], [CanAccess], [CanAdmin]) VALUES
                                 ('10ccbe4e-a3f7-4710-bda3-3dc8e6dd75b8', 'DEAFCCEC-6A37-EF11-86D4-000D3A4E707E', 1, 1)
   END;

/* Adding role Integration to application morecheese_events */
IF NOT EXISTS (
      SELECT 1 FROM [${mjSchema}].[ApplicationRole] WHERE [ApplicationID] = '10ccbe4e-a3f7-4710-bda3-3dc8e6dd75b8' AND [RoleID] = 'DFAFCCEC-6A37-EF11-86D4-000D3A4E707E'
   )
   BEGIN
      INSERT INTO [${mjSchema}].[ApplicationRole]
                                 ([ApplicationID], [RoleID], [CanAccess], [CanAdmin]) VALUES
                                 ('10ccbe4e-a3f7-4710-bda3-3dc8e6dd75b8', 'DFAFCCEC-6A37-EF11-86D4-000D3A4E707E', 1, 0)
   END;

/* SQL generated to add new entity MoreCheese: Event Registrations to application ID: '10ccbe4e-a3f7-4710-bda3-3dc8e6dd75b8' */
INSERT INTO [${mjSchema}].[ApplicationEntity]
                                       ([ApplicationID], [EntityID], [Sequence], [__mj_CreatedAt], [__mj_UpdatedAt]) VALUES
                                       ('10ccbe4e-a3f7-4710-bda3-3dc8e6dd75b8', 'cd3ebece-bfbe-485c-8ff4-8744a030fe07', (SELECT COALESCE(MAX([Sequence]),0)+1 FROM [${mjSchema}].[ApplicationEntity] WHERE [ApplicationID] = '10ccbe4e-a3f7-4710-bda3-3dc8e6dd75b8'), GETUTCDATE(), GETUTCDATE());

/* SQL generated to add new permission for entity MoreCheese: Event Registrations for role UI */
INSERT INTO [${mjSchema}].[EntityPermission]
                                                   ([EntityID], [RoleID], [CanRead], [CanCreate], [CanUpdate], [CanDelete], [__mj_CreatedAt], [__mj_UpdatedAt]) VALUES
                                                   ('cd3ebece-bfbe-485c-8ff4-8744a030fe07', 'E0AFCCEC-6A37-EF11-86D4-000D3A4E707E', 1, 0, 0, 0, GETUTCDATE(), GETUTCDATE());

/* SQL generated to add new permission for entity MoreCheese: Event Registrations for role Developer */
INSERT INTO [${mjSchema}].[EntityPermission]
                                                   ([EntityID], [RoleID], [CanRead], [CanCreate], [CanUpdate], [CanDelete], [__mj_CreatedAt], [__mj_UpdatedAt]) VALUES
                                                   ('cd3ebece-bfbe-485c-8ff4-8744a030fe07', 'DEAFCCEC-6A37-EF11-86D4-000D3A4E707E', 1, 1, 1, 1, GETUTCDATE(), GETUTCDATE());

/* SQL generated to add new permission for entity MoreCheese: Event Registrations for role Integration */
INSERT INTO [${mjSchema}].[EntityPermission]
                                                   ([EntityID], [RoleID], [CanRead], [CanCreate], [CanUpdate], [CanDelete], [__mj_CreatedAt], [__mj_UpdatedAt]) VALUES
                                                   ('cd3ebece-bfbe-485c-8ff4-8744a030fe07', 'DFAFCCEC-6A37-EF11-86D4-000D3A4E707E', 1, 1, 1, 1, GETUTCDATE(), GETUTCDATE());

/* SQL generated to create new entity MoreCheese: Courses */

      INSERT INTO [${mjSchema}].[Entity] (
         [ID],
         [Name],
         [DisplayName],
         [Description],
         [NameSuffix],
         [BaseTable],
         [BaseView],
         [SchemaName],
         [IncludeInAPI],
         [AllowUserSearchAPI],
         [AllowCaching]
         , [TrackRecordChanges]
         , [AuditRecordAccess]
         , [AuditViewRuns]
         , [AllowAllRowsAPI]
         , [AllowCreateAPI]
         , [AllowUpdateAPI]
         , [AllowDeleteAPI]
         , [UserViewMaxRows]
         , [__mj_CreatedAt]
         , [__mj_UpdatedAt]
      )
      VALUES (
         '63f9789f-c8cb-4573-91e6-daf670c4d3b7',
         'MoreCheese: Courses',
         'Courses',
         'The learning catalog',
         NULL,
         'Course',
         'vwCourses',
         'morecheese_learning',
         1,
         1,
         0
         , 1
         , 0
         , 0
         , 0
         , 1
         , 1
         , 1
         , 1000
         , GETUTCDATE()
         , GETUTCDATE()
      );

/* SQL generated to create new application morecheese_learning */
IF NOT EXISTS (
      SELECT 1 FROM [${mjSchema}].[Application] WHERE [ID] = '842be07b-043d-4ee2-853e-0af2a7609fc3'
   )
   BEGIN
      INSERT INTO [${mjSchema}].[Application] ([ID], [Name], [Description], [SchemaAutoAddNewEntities], [Path], [AutoUpdatePath], [DefaultForNewUser])
                       VALUES ('842be07b-043d-4ee2-853e-0af2a7609fc3', 'morecheese_learning', 'Generated for schema', 'morecheese_learning', 'morecheeselearning', 1, 0)
   END;

/* Adding role UI to application morecheese_learning */
IF NOT EXISTS (
      SELECT 1 FROM [${mjSchema}].[ApplicationRole] WHERE [ApplicationID] = '842be07b-043d-4ee2-853e-0af2a7609fc3' AND [RoleID] = 'E0AFCCEC-6A37-EF11-86D4-000D3A4E707E'
   )
   BEGIN
      INSERT INTO [${mjSchema}].[ApplicationRole]
                                 ([ApplicationID], [RoleID], [CanAccess], [CanAdmin]) VALUES
                                 ('842be07b-043d-4ee2-853e-0af2a7609fc3', 'E0AFCCEC-6A37-EF11-86D4-000D3A4E707E', 1, 0)
   END;

/* Adding role Developer to application morecheese_learning */
IF NOT EXISTS (
      SELECT 1 FROM [${mjSchema}].[ApplicationRole] WHERE [ApplicationID] = '842be07b-043d-4ee2-853e-0af2a7609fc3' AND [RoleID] = 'DEAFCCEC-6A37-EF11-86D4-000D3A4E707E'
   )
   BEGIN
      INSERT INTO [${mjSchema}].[ApplicationRole]
                                 ([ApplicationID], [RoleID], [CanAccess], [CanAdmin]) VALUES
                                 ('842be07b-043d-4ee2-853e-0af2a7609fc3', 'DEAFCCEC-6A37-EF11-86D4-000D3A4E707E', 1, 1)
   END;

/* Adding role Integration to application morecheese_learning */
IF NOT EXISTS (
      SELECT 1 FROM [${mjSchema}].[ApplicationRole] WHERE [ApplicationID] = '842be07b-043d-4ee2-853e-0af2a7609fc3' AND [RoleID] = 'DFAFCCEC-6A37-EF11-86D4-000D3A4E707E'
   )
   BEGIN
      INSERT INTO [${mjSchema}].[ApplicationRole]
                                 ([ApplicationID], [RoleID], [CanAccess], [CanAdmin]) VALUES
                                 ('842be07b-043d-4ee2-853e-0af2a7609fc3', 'DFAFCCEC-6A37-EF11-86D4-000D3A4E707E', 1, 0)
   END;

/* SQL generated to add new entity MoreCheese: Courses to application ID: '842be07b-043d-4ee2-853e-0af2a7609fc3' */
INSERT INTO [${mjSchema}].[ApplicationEntity]
                                       ([ApplicationID], [EntityID], [Sequence], [__mj_CreatedAt], [__mj_UpdatedAt]) VALUES
                                       ('842be07b-043d-4ee2-853e-0af2a7609fc3', '63f9789f-c8cb-4573-91e6-daf670c4d3b7', (SELECT COALESCE(MAX([Sequence]),0)+1 FROM [${mjSchema}].[ApplicationEntity] WHERE [ApplicationID] = '842be07b-043d-4ee2-853e-0af2a7609fc3'), GETUTCDATE(), GETUTCDATE());

/* SQL generated to add new permission for entity MoreCheese: Courses for role UI */
INSERT INTO [${mjSchema}].[EntityPermission]
                                                   ([EntityID], [RoleID], [CanRead], [CanCreate], [CanUpdate], [CanDelete], [__mj_CreatedAt], [__mj_UpdatedAt]) VALUES
                                                   ('63f9789f-c8cb-4573-91e6-daf670c4d3b7', 'E0AFCCEC-6A37-EF11-86D4-000D3A4E707E', 1, 0, 0, 0, GETUTCDATE(), GETUTCDATE());

/* SQL generated to add new permission for entity MoreCheese: Courses for role Developer */
INSERT INTO [${mjSchema}].[EntityPermission]
                                                   ([EntityID], [RoleID], [CanRead], [CanCreate], [CanUpdate], [CanDelete], [__mj_CreatedAt], [__mj_UpdatedAt]) VALUES
                                                   ('63f9789f-c8cb-4573-91e6-daf670c4d3b7', 'DEAFCCEC-6A37-EF11-86D4-000D3A4E707E', 1, 1, 1, 1, GETUTCDATE(), GETUTCDATE());

/* SQL generated to add new permission for entity MoreCheese: Courses for role Integration */
INSERT INTO [${mjSchema}].[EntityPermission]
                                                   ([EntityID], [RoleID], [CanRead], [CanCreate], [CanUpdate], [CanDelete], [__mj_CreatedAt], [__mj_UpdatedAt]) VALUES
                                                   ('63f9789f-c8cb-4573-91e6-daf670c4d3b7', 'DFAFCCEC-6A37-EF11-86D4-000D3A4E707E', 1, 1, 1, 1, GETUTCDATE(), GETUTCDATE());

/* SQL generated to create new entity MoreCheese: Course Enrollments */

      INSERT INTO [${mjSchema}].[Entity] (
         [ID],
         [Name],
         [DisplayName],
         [Description],
         [NameSuffix],
         [BaseTable],
         [BaseView],
         [SchemaName],
         [IncludeInAPI],
         [AllowUserSearchAPI],
         [AllowCaching]
         , [TrackRecordChanges]
         , [AuditRecordAccess]
         , [AuditViewRuns]
         , [AllowAllRowsAPI]
         , [AllowCreateAPI]
         , [AllowUpdateAPI]
         , [AllowDeleteAPI]
         , [UserViewMaxRows]
         , [__mj_CreatedAt]
         , [__mj_UpdatedAt]
      )
      VALUES (
         'b8fbefc1-9b31-4a45-a86b-71ba5d4fe3ec',
         'MoreCheese: Course Enrollments',
         'Course Enrollments',
         'Course enrollments with completion outcomes',
         NULL,
         'CourseEnrollment',
         'vwCourseEnrollments',
         'morecheese_learning',
         1,
         1,
         0
         , 1
         , 0
         , 0
         , 0
         , 1
         , 1
         , 1
         , 1000
         , GETUTCDATE()
         , GETUTCDATE()
      );

/* SQL generated to add new entity MoreCheese: Course Enrollments to application ID: '842BE07B-043D-4EE2-853E-0AF2A7609FC3' */
INSERT INTO [${mjSchema}].[ApplicationEntity]
                                       ([ApplicationID], [EntityID], [Sequence], [__mj_CreatedAt], [__mj_UpdatedAt]) VALUES
                                       ('842BE07B-043D-4EE2-853E-0AF2A7609FC3', 'b8fbefc1-9b31-4a45-a86b-71ba5d4fe3ec', (SELECT COALESCE(MAX([Sequence]),0)+1 FROM [${mjSchema}].[ApplicationEntity] WHERE [ApplicationID] = '842BE07B-043D-4EE2-853E-0AF2A7609FC3'), GETUTCDATE(), GETUTCDATE());

/* SQL generated to add new permission for entity MoreCheese: Course Enrollments for role UI */
INSERT INTO [${mjSchema}].[EntityPermission]
                                                   ([EntityID], [RoleID], [CanRead], [CanCreate], [CanUpdate], [CanDelete], [__mj_CreatedAt], [__mj_UpdatedAt]) VALUES
                                                   ('b8fbefc1-9b31-4a45-a86b-71ba5d4fe3ec', 'E0AFCCEC-6A37-EF11-86D4-000D3A4E707E', 1, 0, 0, 0, GETUTCDATE(), GETUTCDATE());

/* SQL generated to add new permission for entity MoreCheese: Course Enrollments for role Developer */
INSERT INTO [${mjSchema}].[EntityPermission]
                                                   ([EntityID], [RoleID], [CanRead], [CanCreate], [CanUpdate], [CanDelete], [__mj_CreatedAt], [__mj_UpdatedAt]) VALUES
                                                   ('b8fbefc1-9b31-4a45-a86b-71ba5d4fe3ec', 'DEAFCCEC-6A37-EF11-86D4-000D3A4E707E', 1, 1, 1, 1, GETUTCDATE(), GETUTCDATE());

/* SQL generated to add new permission for entity MoreCheese: Course Enrollments for role Integration */
INSERT INTO [${mjSchema}].[EntityPermission]
                                                   ([EntityID], [RoleID], [CanRead], [CanCreate], [CanUpdate], [CanDelete], [__mj_CreatedAt], [__mj_UpdatedAt]) VALUES
                                                   ('b8fbefc1-9b31-4a45-a86b-71ba5d4fe3ec', 'DFAFCCEC-6A37-EF11-86D4-000D3A4E707E', 1, 1, 1, 1, GETUTCDATE(), GETUTCDATE());

/* SQL generated to create new entity MoreCheese: Certifications */

      INSERT INTO [${mjSchema}].[Entity] (
         [ID],
         [Name],
         [DisplayName],
         [Description],
         [NameSuffix],
         [BaseTable],
         [BaseView],
         [SchemaName],
         [IncludeInAPI],
         [AllowUserSearchAPI],
         [AllowCaching]
         , [TrackRecordChanges]
         , [AuditRecordAccess]
         , [AuditViewRuns]
         , [AllowAllRowsAPI]
         , [AllowCreateAPI]
         , [AllowUpdateAPI]
         , [AllowDeleteAPI]
         , [UserViewMaxRows]
         , [__mj_CreatedAt]
         , [__mj_UpdatedAt]
      )
      VALUES (
         '141e023a-18c1-4c84-962c-2bd1abf0627f',
         'MoreCheese: Certifications',
         'Certifications',
         'The credential catalog (CCP, sensory evaluation, food safety)',
         NULL,
         'Certification',
         'vwCertifications',
         'morecheese_learning',
         1,
         1,
         0
         , 1
         , 0
         , 0
         , 0
         , 1
         , 1
         , 1
         , 1000
         , GETUTCDATE()
         , GETUTCDATE()
      );

/* SQL generated to add new entity MoreCheese: Certifications to application ID: '842BE07B-043D-4EE2-853E-0AF2A7609FC3' */
INSERT INTO [${mjSchema}].[ApplicationEntity]
                                       ([ApplicationID], [EntityID], [Sequence], [__mj_CreatedAt], [__mj_UpdatedAt]) VALUES
                                       ('842BE07B-043D-4EE2-853E-0AF2A7609FC3', '141e023a-18c1-4c84-962c-2bd1abf0627f', (SELECT COALESCE(MAX([Sequence]),0)+1 FROM [${mjSchema}].[ApplicationEntity] WHERE [ApplicationID] = '842BE07B-043D-4EE2-853E-0AF2A7609FC3'), GETUTCDATE(), GETUTCDATE());

/* SQL generated to add new permission for entity MoreCheese: Certifications for role UI */
INSERT INTO [${mjSchema}].[EntityPermission]
                                                   ([EntityID], [RoleID], [CanRead], [CanCreate], [CanUpdate], [CanDelete], [__mj_CreatedAt], [__mj_UpdatedAt]) VALUES
                                                   ('141e023a-18c1-4c84-962c-2bd1abf0627f', 'E0AFCCEC-6A37-EF11-86D4-000D3A4E707E', 1, 0, 0, 0, GETUTCDATE(), GETUTCDATE());

/* SQL generated to add new permission for entity MoreCheese: Certifications for role Developer */
INSERT INTO [${mjSchema}].[EntityPermission]
                                                   ([EntityID], [RoleID], [CanRead], [CanCreate], [CanUpdate], [CanDelete], [__mj_CreatedAt], [__mj_UpdatedAt]) VALUES
                                                   ('141e023a-18c1-4c84-962c-2bd1abf0627f', 'DEAFCCEC-6A37-EF11-86D4-000D3A4E707E', 1, 1, 1, 1, GETUTCDATE(), GETUTCDATE());

/* SQL generated to add new permission for entity MoreCheese: Certifications for role Integration */
INSERT INTO [${mjSchema}].[EntityPermission]
                                                   ([EntityID], [RoleID], [CanRead], [CanCreate], [CanUpdate], [CanDelete], [__mj_CreatedAt], [__mj_UpdatedAt]) VALUES
                                                   ('141e023a-18c1-4c84-962c-2bd1abf0627f', 'DFAFCCEC-6A37-EF11-86D4-000D3A4E707E', 1, 1, 1, 1, GETUTCDATE(), GETUTCDATE());

/* SQL generated to create new entity MoreCheese: Member Certifications */

      INSERT INTO [${mjSchema}].[Entity] (
         [ID],
         [Name],
         [DisplayName],
         [Description],
         [NameSuffix],
         [BaseTable],
         [BaseView],
         [SchemaName],
         [IncludeInAPI],
         [AllowUserSearchAPI],
         [AllowCaching]
         , [TrackRecordChanges]
         , [AuditRecordAccess]
         , [AuditViewRuns]
         , [AllowAllRowsAPI]
         , [AllowCreateAPI]
         , [AllowUpdateAPI]
         , [AllowDeleteAPI]
         , [UserViewMaxRows]
         , [__mj_CreatedAt]
         , [__mj_UpdatedAt]
      )
      VALUES (
         'dcb0400a-ec0a-4551-baea-50b515c3c59c',
         'MoreCheese: Member Certifications',
         'Member Certifications',
         'A member''s certification journey: enrolled, awarded (with expiry), expired, or withdrawn',
         NULL,
         'MemberCertification',
         'vwMemberCertifications',
         'morecheese_learning',
         1,
         1,
         0
         , 1
         , 0
         , 0
         , 0
         , 1
         , 1
         , 1
         , 1000
         , GETUTCDATE()
         , GETUTCDATE()
      );

/* SQL generated to add new entity MoreCheese: Member Certifications to application ID: '842BE07B-043D-4EE2-853E-0AF2A7609FC3' */
INSERT INTO [${mjSchema}].[ApplicationEntity]
                                       ([ApplicationID], [EntityID], [Sequence], [__mj_CreatedAt], [__mj_UpdatedAt]) VALUES
                                       ('842BE07B-043D-4EE2-853E-0AF2A7609FC3', 'dcb0400a-ec0a-4551-baea-50b515c3c59c', (SELECT COALESCE(MAX([Sequence]),0)+1 FROM [${mjSchema}].[ApplicationEntity] WHERE [ApplicationID] = '842BE07B-043D-4EE2-853E-0AF2A7609FC3'), GETUTCDATE(), GETUTCDATE());

/* SQL generated to add new permission for entity MoreCheese: Member Certifications for role UI */
INSERT INTO [${mjSchema}].[EntityPermission]
                                                   ([EntityID], [RoleID], [CanRead], [CanCreate], [CanUpdate], [CanDelete], [__mj_CreatedAt], [__mj_UpdatedAt]) VALUES
                                                   ('dcb0400a-ec0a-4551-baea-50b515c3c59c', 'E0AFCCEC-6A37-EF11-86D4-000D3A4E707E', 1, 0, 0, 0, GETUTCDATE(), GETUTCDATE());

/* SQL generated to add new permission for entity MoreCheese: Member Certifications for role Developer */
INSERT INTO [${mjSchema}].[EntityPermission]
                                                   ([EntityID], [RoleID], [CanRead], [CanCreate], [CanUpdate], [CanDelete], [__mj_CreatedAt], [__mj_UpdatedAt]) VALUES
                                                   ('dcb0400a-ec0a-4551-baea-50b515c3c59c', 'DEAFCCEC-6A37-EF11-86D4-000D3A4E707E', 1, 1, 1, 1, GETUTCDATE(), GETUTCDATE());

/* SQL generated to add new permission for entity MoreCheese: Member Certifications for role Integration */
INSERT INTO [${mjSchema}].[EntityPermission]
                                                   ([EntityID], [RoleID], [CanRead], [CanCreate], [CanUpdate], [CanDelete], [__mj_CreatedAt], [__mj_UpdatedAt]) VALUES
                                                   ('dcb0400a-ec0a-4551-baea-50b515c3c59c', 'DFAFCCEC-6A37-EF11-86D4-000D3A4E707E', 1, 1, 1, 1, GETUTCDATE(), GETUTCDATE());

/* SQL generated to create new entity MoreCheese: Competition Entries */

      INSERT INTO [${mjSchema}].[Entity] (
         [ID],
         [Name],
         [DisplayName],
         [Description],
         [NameSuffix],
         [BaseTable],
         [BaseView],
         [SchemaName],
         [IncludeInAPI],
         [AllowUserSearchAPI],
         [AllowCaching]
         , [TrackRecordChanges]
         , [AuditRecordAccess]
         , [AuditViewRuns]
         , [AllowAllRowsAPI]
         , [AllowCreateAPI]
         , [AllowUpdateAPI]
         , [AllowDeleteAPI]
         , [UserViewMaxRows]
         , [__mj_CreatedAt]
         , [__mj_UpdatedAt]
      )
      VALUES (
         '2f328de1-f9f5-402d-b085-ac41ebde9f77',
         'MoreCheese: Competition Entries',
         'Competition Entries',
         'Annual competition entries; org membership is the eligibility gate, results are medal or none',
         NULL,
         'CompetitionEntry',
         'vwCompetitionEntries',
         'morecheese_events',
         1,
         1,
         0
         , 1
         , 0
         , 0
         , 0
         , 1
         , 1
         , 1
         , 1000
         , GETUTCDATE()
         , GETUTCDATE()
      );

/* SQL generated to add new entity MoreCheese: Competition Entries to application ID: '10CCBE4E-A3F7-4710-BDA3-3DC8E6DD75B8' */
INSERT INTO [${mjSchema}].[ApplicationEntity]
                                       ([ApplicationID], [EntityID], [Sequence], [__mj_CreatedAt], [__mj_UpdatedAt]) VALUES
                                       ('10CCBE4E-A3F7-4710-BDA3-3DC8E6DD75B8', '2f328de1-f9f5-402d-b085-ac41ebde9f77', (SELECT COALESCE(MAX([Sequence]),0)+1 FROM [${mjSchema}].[ApplicationEntity] WHERE [ApplicationID] = '10CCBE4E-A3F7-4710-BDA3-3DC8E6DD75B8'), GETUTCDATE(), GETUTCDATE());

/* SQL generated to add new permission for entity MoreCheese: Competition Entries for role UI */
INSERT INTO [${mjSchema}].[EntityPermission]
                                                   ([EntityID], [RoleID], [CanRead], [CanCreate], [CanUpdate], [CanDelete], [__mj_CreatedAt], [__mj_UpdatedAt]) VALUES
                                                   ('2f328de1-f9f5-402d-b085-ac41ebde9f77', 'E0AFCCEC-6A37-EF11-86D4-000D3A4E707E', 1, 0, 0, 0, GETUTCDATE(), GETUTCDATE());

/* SQL generated to add new permission for entity MoreCheese: Competition Entries for role Developer */
INSERT INTO [${mjSchema}].[EntityPermission]
                                                   ([EntityID], [RoleID], [CanRead], [CanCreate], [CanUpdate], [CanDelete], [__mj_CreatedAt], [__mj_UpdatedAt]) VALUES
                                                   ('2f328de1-f9f5-402d-b085-ac41ebde9f77', 'DEAFCCEC-6A37-EF11-86D4-000D3A4E707E', 1, 1, 1, 1, GETUTCDATE(), GETUTCDATE());

/* SQL generated to add new permission for entity MoreCheese: Competition Entries for role Integration */
INSERT INTO [${mjSchema}].[EntityPermission]
                                                   ([EntityID], [RoleID], [CanRead], [CanCreate], [CanUpdate], [CanDelete], [__mj_CreatedAt], [__mj_UpdatedAt]) VALUES
                                                   ('2f328de1-f9f5-402d-b085-ac41ebde9f77', 'DFAFCCEC-6A37-EF11-86D4-000D3A4E707E', 1, 1, 1, 1, GETUTCDATE(), GETUTCDATE());

/* SQL generated to create new entity MoreCheese: Advocacy Actions */

      INSERT INTO [${mjSchema}].[Entity] (
         [ID],
         [Name],
         [DisplayName],
         [Description],
         [NameSuffix],
         [BaseTable],
         [BaseView],
         [SchemaName],
         [IncludeInAPI],
         [AllowUserSearchAPI],
         [AllowCaching]
         , [TrackRecordChanges]
         , [AuditRecordAccess]
         , [AuditViewRuns]
         , [AllowAllRowsAPI]
         , [AllowCreateAPI]
         , [AllowUpdateAPI]
         , [AllowDeleteAPI]
         , [UserViewMaxRows]
         , [__mj_CreatedAt]
         , [__mj_UpdatedAt]
      )
      VALUES (
         'a39cf933-acc1-4178-8bba-8b2b02bb40f5',
         'MoreCheese: Advocacy Actions',
         'Advocacy Actions',
         'Legislative engagement actions — the advocacy-shaped component of member engagement',
         NULL,
         'AdvocacyAction',
         'vwAdvocacyActions',
         '${flyway:defaultSchema}',
         1,
         1,
         0
         , 1
         , 0
         , 0
         , 0
         , 1
         , 1
         , 1
         , 1000
         , GETUTCDATE()
         , GETUTCDATE()
      );

/* SQL generated to create new application ${flyway:defaultSchema} */
IF NOT EXISTS (
      SELECT 1 FROM [${mjSchema}].[Application] WHERE [ID] = '8a3fb685-1bf6-4db7-b470-a4ba18f18780'
   )
   BEGIN
      INSERT INTO [${mjSchema}].[Application] ([ID], [Name], [Description], [SchemaAutoAddNewEntities], [Path], [AutoUpdatePath], [DefaultForNewUser])
                       VALUES ('8a3fb685-1bf6-4db7-b470-a4ba18f18780', '${flyway:defaultSchema}', 'Generated for schema', '${flyway:defaultSchema}', 'morecheesemembers', 1, 0)
   END;

/* Adding role UI to application ${flyway:defaultSchema} */
IF NOT EXISTS (
      SELECT 1 FROM [${mjSchema}].[ApplicationRole] WHERE [ApplicationID] = '8a3fb685-1bf6-4db7-b470-a4ba18f18780' AND [RoleID] = 'E0AFCCEC-6A37-EF11-86D4-000D3A4E707E'
   )
   BEGIN
      INSERT INTO [${mjSchema}].[ApplicationRole]
                                 ([ApplicationID], [RoleID], [CanAccess], [CanAdmin]) VALUES
                                 ('8a3fb685-1bf6-4db7-b470-a4ba18f18780', 'E0AFCCEC-6A37-EF11-86D4-000D3A4E707E', 1, 0)
   END;

/* Adding role Developer to application ${flyway:defaultSchema} */
IF NOT EXISTS (
      SELECT 1 FROM [${mjSchema}].[ApplicationRole] WHERE [ApplicationID] = '8a3fb685-1bf6-4db7-b470-a4ba18f18780' AND [RoleID] = 'DEAFCCEC-6A37-EF11-86D4-000D3A4E707E'
   )
   BEGIN
      INSERT INTO [${mjSchema}].[ApplicationRole]
                                 ([ApplicationID], [RoleID], [CanAccess], [CanAdmin]) VALUES
                                 ('8a3fb685-1bf6-4db7-b470-a4ba18f18780', 'DEAFCCEC-6A37-EF11-86D4-000D3A4E707E', 1, 1)
   END;

/* Adding role Integration to application ${flyway:defaultSchema} */
IF NOT EXISTS (
      SELECT 1 FROM [${mjSchema}].[ApplicationRole] WHERE [ApplicationID] = '8a3fb685-1bf6-4db7-b470-a4ba18f18780' AND [RoleID] = 'DFAFCCEC-6A37-EF11-86D4-000D3A4E707E'
   )
   BEGIN
      INSERT INTO [${mjSchema}].[ApplicationRole]
                                 ([ApplicationID], [RoleID], [CanAccess], [CanAdmin]) VALUES
                                 ('8a3fb685-1bf6-4db7-b470-a4ba18f18780', 'DFAFCCEC-6A37-EF11-86D4-000D3A4E707E', 1, 0)
   END;

/* SQL generated to add new entity MoreCheese: Advocacy Actions to application ID: '8a3fb685-1bf6-4db7-b470-a4ba18f18780' */
INSERT INTO [${mjSchema}].[ApplicationEntity]
                                       ([ApplicationID], [EntityID], [Sequence], [__mj_CreatedAt], [__mj_UpdatedAt]) VALUES
                                       ('8a3fb685-1bf6-4db7-b470-a4ba18f18780', 'a39cf933-acc1-4178-8bba-8b2b02bb40f5', (SELECT COALESCE(MAX([Sequence]),0)+1 FROM [${mjSchema}].[ApplicationEntity] WHERE [ApplicationID] = '8a3fb685-1bf6-4db7-b470-a4ba18f18780'), GETUTCDATE(), GETUTCDATE());

/* SQL generated to add new permission for entity MoreCheese: Advocacy Actions for role UI */
INSERT INTO [${mjSchema}].[EntityPermission]
                                                   ([EntityID], [RoleID], [CanRead], [CanCreate], [CanUpdate], [CanDelete], [__mj_CreatedAt], [__mj_UpdatedAt]) VALUES
                                                   ('a39cf933-acc1-4178-8bba-8b2b02bb40f5', 'E0AFCCEC-6A37-EF11-86D4-000D3A4E707E', 1, 0, 0, 0, GETUTCDATE(), GETUTCDATE());

/* SQL generated to add new permission for entity MoreCheese: Advocacy Actions for role Developer */
INSERT INTO [${mjSchema}].[EntityPermission]
                                                   ([EntityID], [RoleID], [CanRead], [CanCreate], [CanUpdate], [CanDelete], [__mj_CreatedAt], [__mj_UpdatedAt]) VALUES
                                                   ('a39cf933-acc1-4178-8bba-8b2b02bb40f5', 'DEAFCCEC-6A37-EF11-86D4-000D3A4E707E', 1, 1, 1, 1, GETUTCDATE(), GETUTCDATE());

/* SQL generated to add new permission for entity MoreCheese: Advocacy Actions for role Integration */
INSERT INTO [${mjSchema}].[EntityPermission]
                                                   ([EntityID], [RoleID], [CanRead], [CanCreate], [CanUpdate], [CanDelete], [__mj_CreatedAt], [__mj_UpdatedAt]) VALUES
                                                   ('a39cf933-acc1-4178-8bba-8b2b02bb40f5', 'DFAFCCEC-6A37-EF11-86D4-000D3A4E707E', 1, 1, 1, 1, GETUTCDATE(), GETUTCDATE());

/* SQL generated to create new entity MoreCheese: Data Quality Labels */

      INSERT INTO [${mjSchema}].[Entity] (
         [ID],
         [Name],
         [DisplayName],
         [Description],
         [NameSuffix],
         [BaseTable],
         [BaseView],
         [SchemaName],
         [IncludeInAPI],
         [AllowUserSearchAPI],
         [AllowCaching]
         , [TrackRecordChanges]
         , [AuditRecordAccess]
         , [AuditViewRuns]
         , [AllowAllRowsAPI]
         , [AllowCreateAPI]
         , [AllowUpdateAPI]
         , [AllowDeleteAPI]
         , [UserViewMaxRows]
         , [__mj_CreatedAt]
         , [__mj_UpdatedAt]
      )
      VALUES (
         '50b6fd43-6669-41a0-8dba-fb23c3b8c753',
         'MoreCheese: Data Quality Labels',
         'Data Quality Labels',
         'Labeled ground truth for deliberately injected data defects — every duplicate, stale record, and typo the generator planted, with the correct answer. Data-quality demos verify against this table.',
         NULL,
         'DataQualityLabel',
         'vwDataQualityLabels',
         '${flyway:defaultSchema}',
         1,
         1,
         0
         , 1
         , 0
         , 0
         , 0
         , 1
         , 1
         , 1
         , 1000
         , GETUTCDATE()
         , GETUTCDATE()
      );

/* SQL generated to add new entity MoreCheese: Data Quality Labels to application ID: '8A3FB685-1BF6-4DB7-B470-A4BA18F18780' */
INSERT INTO [${mjSchema}].[ApplicationEntity]
                                       ([ApplicationID], [EntityID], [Sequence], [__mj_CreatedAt], [__mj_UpdatedAt]) VALUES
                                       ('8A3FB685-1BF6-4DB7-B470-A4BA18F18780', '50b6fd43-6669-41a0-8dba-fb23c3b8c753', (SELECT COALESCE(MAX([Sequence]),0)+1 FROM [${mjSchema}].[ApplicationEntity] WHERE [ApplicationID] = '8A3FB685-1BF6-4DB7-B470-A4BA18F18780'), GETUTCDATE(), GETUTCDATE());

/* SQL generated to add new permission for entity MoreCheese: Data Quality Labels for role UI */
INSERT INTO [${mjSchema}].[EntityPermission]
                                                   ([EntityID], [RoleID], [CanRead], [CanCreate], [CanUpdate], [CanDelete], [__mj_CreatedAt], [__mj_UpdatedAt]) VALUES
                                                   ('50b6fd43-6669-41a0-8dba-fb23c3b8c753', 'E0AFCCEC-6A37-EF11-86D4-000D3A4E707E', 1, 0, 0, 0, GETUTCDATE(), GETUTCDATE());

/* SQL generated to add new permission for entity MoreCheese: Data Quality Labels for role Developer */
INSERT INTO [${mjSchema}].[EntityPermission]
                                                   ([EntityID], [RoleID], [CanRead], [CanCreate], [CanUpdate], [CanDelete], [__mj_CreatedAt], [__mj_UpdatedAt]) VALUES
                                                   ('50b6fd43-6669-41a0-8dba-fb23c3b8c753', 'DEAFCCEC-6A37-EF11-86D4-000D3A4E707E', 1, 1, 1, 1, GETUTCDATE(), GETUTCDATE());

/* SQL generated to add new permission for entity MoreCheese: Data Quality Labels for role Integration */
INSERT INTO [${mjSchema}].[EntityPermission]
                                                   ([EntityID], [RoleID], [CanRead], [CanCreate], [CanUpdate], [CanDelete], [__mj_CreatedAt], [__mj_UpdatedAt]) VALUES
                                                   ('50b6fd43-6669-41a0-8dba-fb23c3b8c753', 'DFAFCCEC-6A37-EF11-86D4-000D3A4E707E', 1, 1, 1, 1, GETUTCDATE(), GETUTCDATE());

/* SQL generated to create new entity MoreCheese: Organization Profiles */

      INSERT INTO [${mjSchema}].[Entity] (
         [ID],
         [Name],
         [DisplayName],
         [Description],
         [NameSuffix],
         [BaseTable],
         [BaseView],
         [SchemaName],
         [IncludeInAPI],
         [AllowUserSearchAPI],
         [AllowCaching]
         , [TrackRecordChanges]
         , [AuditRecordAccess]
         , [AuditViewRuns]
         , [AllowAllRowsAPI]
         , [AllowCreateAPI]
         , [AllowUpdateAPI]
         , [AllowDeleteAPI]
         , [UserViewMaxRows]
         , [__mj_CreatedAt]
         , [__mj_UpdatedAt]
      )
      VALUES (
         'a820fa5a-520e-4058-92d8-33c5aec0fec5',
         'MoreCheese: Organization Profiles',
         'Organization Profiles',
         'Org-specific extension of bizapps-common Organization: demo geography and the lifecycle events (dissolution/acquisition/program cut) that drive employer-related churn',
         NULL,
         'OrganizationProfile',
         'vwOrganizationProfiles',
         '${flyway:defaultSchema}',
         1,
         1,
         0
         , 1
         , 0
         , 0
         , 0
         , 1
         , 1
         , 1
         , 1000
         , GETUTCDATE()
         , GETUTCDATE()
      );

/* SQL generated to add new entity MoreCheese: Organization Profiles to application ID: '8A3FB685-1BF6-4DB7-B470-A4BA18F18780' */
INSERT INTO [${mjSchema}].[ApplicationEntity]
                                       ([ApplicationID], [EntityID], [Sequence], [__mj_CreatedAt], [__mj_UpdatedAt]) VALUES
                                       ('8A3FB685-1BF6-4DB7-B470-A4BA18F18780', 'a820fa5a-520e-4058-92d8-33c5aec0fec5', (SELECT COALESCE(MAX([Sequence]),0)+1 FROM [${mjSchema}].[ApplicationEntity] WHERE [ApplicationID] = '8A3FB685-1BF6-4DB7-B470-A4BA18F18780'), GETUTCDATE(), GETUTCDATE());

/* SQL generated to add new permission for entity MoreCheese: Organization Profiles for role UI */
INSERT INTO [${mjSchema}].[EntityPermission]
                                                   ([EntityID], [RoleID], [CanRead], [CanCreate], [CanUpdate], [CanDelete], [__mj_CreatedAt], [__mj_UpdatedAt]) VALUES
                                                   ('a820fa5a-520e-4058-92d8-33c5aec0fec5', 'E0AFCCEC-6A37-EF11-86D4-000D3A4E707E', 1, 0, 0, 0, GETUTCDATE(), GETUTCDATE());

/* SQL generated to add new permission for entity MoreCheese: Organization Profiles for role Developer */
INSERT INTO [${mjSchema}].[EntityPermission]
                                                   ([EntityID], [RoleID], [CanRead], [CanCreate], [CanUpdate], [CanDelete], [__mj_CreatedAt], [__mj_UpdatedAt]) VALUES
                                                   ('a820fa5a-520e-4058-92d8-33c5aec0fec5', 'DEAFCCEC-6A37-EF11-86D4-000D3A4E707E', 1, 1, 1, 1, GETUTCDATE(), GETUTCDATE());

/* SQL generated to add new permission for entity MoreCheese: Organization Profiles for role Integration */
INSERT INTO [${mjSchema}].[EntityPermission]
                                                   ([EntityID], [RoleID], [CanRead], [CanCreate], [CanUpdate], [CanDelete], [__mj_CreatedAt], [__mj_UpdatedAt]) VALUES
                                                   ('a820fa5a-520e-4058-92d8-33c5aec0fec5', 'DFAFCCEC-6A37-EF11-86D4-000D3A4E707E', 1, 1, 1, 1, GETUTCDATE(), GETUTCDATE());

/* SQL generated to create new entity MoreCheese: Member Profiles */

      INSERT INTO [${mjSchema}].[Entity] (
         [ID],
         [Name],
         [DisplayName],
         [Description],
         [NameSuffix],
         [BaseTable],
         [BaseView],
         [SchemaName],
         [IncludeInAPI],
         [AllowUserSearchAPI],
         [AllowCaching]
         , [TrackRecordChanges]
         , [AuditRecordAccess]
         , [AuditViewRuns]
         , [AllowAllRowsAPI]
         , [AllowCreateAPI]
         , [AllowUpdateAPI]
         , [AllowDeleteAPI]
         , [UserViewMaxRows]
         , [__mj_CreatedAt]
         , [__mj_UpdatedAt]
      )
      VALUES (
         '70c724c9-b518-4d81-81b0-be7f4962b63a',
         'MoreCheese: Member Profiles',
         'Member Profiles',
         'Member-specific extension of bizapps-common Person: member number, segment, geography, join date (v2-plan §4.2)',
         NULL,
         'MemberProfile',
         'vwMemberProfiles',
         '${flyway:defaultSchema}',
         1,
         1,
         0
         , 1
         , 0
         , 0
         , 0
         , 1
         , 1
         , 1
         , 1000
         , GETUTCDATE()
         , GETUTCDATE()
      );

/* SQL generated to add new entity MoreCheese: Member Profiles to application ID: '8A3FB685-1BF6-4DB7-B470-A4BA18F18780' */
INSERT INTO [${mjSchema}].[ApplicationEntity]
                                       ([ApplicationID], [EntityID], [Sequence], [__mj_CreatedAt], [__mj_UpdatedAt]) VALUES
                                       ('8A3FB685-1BF6-4DB7-B470-A4BA18F18780', '70c724c9-b518-4d81-81b0-be7f4962b63a', (SELECT COALESCE(MAX([Sequence]),0)+1 FROM [${mjSchema}].[ApplicationEntity] WHERE [ApplicationID] = '8A3FB685-1BF6-4DB7-B470-A4BA18F18780'), GETUTCDATE(), GETUTCDATE());

/* SQL generated to add new permission for entity MoreCheese: Member Profiles for role UI */
INSERT INTO [${mjSchema}].[EntityPermission]
                                                   ([EntityID], [RoleID], [CanRead], [CanCreate], [CanUpdate], [CanDelete], [__mj_CreatedAt], [__mj_UpdatedAt]) VALUES
                                                   ('70c724c9-b518-4d81-81b0-be7f4962b63a', 'E0AFCCEC-6A37-EF11-86D4-000D3A4E707E', 1, 0, 0, 0, GETUTCDATE(), GETUTCDATE());

/* SQL generated to add new permission for entity MoreCheese: Member Profiles for role Developer */
INSERT INTO [${mjSchema}].[EntityPermission]
                                                   ([EntityID], [RoleID], [CanRead], [CanCreate], [CanUpdate], [CanDelete], [__mj_CreatedAt], [__mj_UpdatedAt]) VALUES
                                                   ('70c724c9-b518-4d81-81b0-be7f4962b63a', 'DEAFCCEC-6A37-EF11-86D4-000D3A4E707E', 1, 1, 1, 1, GETUTCDATE(), GETUTCDATE());

/* SQL generated to add new permission for entity MoreCheese: Member Profiles for role Integration */
INSERT INTO [${mjSchema}].[EntityPermission]
                                                   ([EntityID], [RoleID], [CanRead], [CanCreate], [CanUpdate], [CanDelete], [__mj_CreatedAt], [__mj_UpdatedAt]) VALUES
                                                   ('70c724c9-b518-4d81-81b0-be7f4962b63a', 'DFAFCCEC-6A37-EF11-86D4-000D3A4E707E', 1, 1, 1, 1, GETUTCDATE(), GETUTCDATE());

/* SQL generated to create new entity MoreCheese: Membership Periods */

      INSERT INTO [${mjSchema}].[Entity] (
         [ID],
         [Name],
         [DisplayName],
         [Description],
         [NameSuffix],
         [BaseTable],
         [BaseView],
         [SchemaName],
         [IncludeInAPI],
         [AllowUserSearchAPI],
         [AllowCaching]
         , [TrackRecordChanges]
         , [AuditRecordAccess]
         , [AuditViewRuns]
         , [AllowAllRowsAPI]
         , [AllowCreateAPI]
         , [AllowUpdateAPI]
         , [AllowDeleteAPI]
         , [UserViewMaxRows]
         , [__mj_CreatedAt]
         , [__mj_UpdatedAt]
      )
      VALUES (
         '6585d210-bd5a-44e2-bd90-0d425734dcf0',
         'MoreCheese: Membership Periods',
         'Membership Periods',
         'One row per membership cycle; member status is derived from the latest period. Decomposes into bizapps-orders Subscription + renewal Orders when that app ships',
         NULL,
         'MembershipPeriod',
         'vwMembershipPeriods',
         '${flyway:defaultSchema}',
         1,
         1,
         0
         , 1
         , 0
         , 0
         , 0
         , 1
         , 1
         , 1
         , 1000
         , GETUTCDATE()
         , GETUTCDATE()
      );

/* SQL generated to add new entity MoreCheese: Membership Periods to application ID: '8A3FB685-1BF6-4DB7-B470-A4BA18F18780' */
INSERT INTO [${mjSchema}].[ApplicationEntity]
                                       ([ApplicationID], [EntityID], [Sequence], [__mj_CreatedAt], [__mj_UpdatedAt]) VALUES
                                       ('8A3FB685-1BF6-4DB7-B470-A4BA18F18780', '6585d210-bd5a-44e2-bd90-0d425734dcf0', (SELECT COALESCE(MAX([Sequence]),0)+1 FROM [${mjSchema}].[ApplicationEntity] WHERE [ApplicationID] = '8A3FB685-1BF6-4DB7-B470-A4BA18F18780'), GETUTCDATE(), GETUTCDATE());

/* SQL generated to add new permission for entity MoreCheese: Membership Periods for role UI */
INSERT INTO [${mjSchema}].[EntityPermission]
                                                   ([EntityID], [RoleID], [CanRead], [CanCreate], [CanUpdate], [CanDelete], [__mj_CreatedAt], [__mj_UpdatedAt]) VALUES
                                                   ('6585d210-bd5a-44e2-bd90-0d425734dcf0', 'E0AFCCEC-6A37-EF11-86D4-000D3A4E707E', 1, 0, 0, 0, GETUTCDATE(), GETUTCDATE());

/* SQL generated to add new permission for entity MoreCheese: Membership Periods for role Developer */
INSERT INTO [${mjSchema}].[EntityPermission]
                                                   ([EntityID], [RoleID], [CanRead], [CanCreate], [CanUpdate], [CanDelete], [__mj_CreatedAt], [__mj_UpdatedAt]) VALUES
                                                   ('6585d210-bd5a-44e2-bd90-0d425734dcf0', 'DEAFCCEC-6A37-EF11-86D4-000D3A4E707E', 1, 1, 1, 1, GETUTCDATE(), GETUTCDATE());

/* SQL generated to add new permission for entity MoreCheese: Membership Periods for role Integration */
INSERT INTO [${mjSchema}].[EntityPermission]
                                                   ([EntityID], [RoleID], [CanRead], [CanCreate], [CanUpdate], [CanDelete], [__mj_CreatedAt], [__mj_UpdatedAt]) VALUES
                                                   ('6585d210-bd5a-44e2-bd90-0d425734dcf0', 'DFAFCCEC-6A37-EF11-86D4-000D3A4E707E', 1, 1, 1, 1, GETUTCDATE(), GETUTCDATE());

/* SQL generated to create new entity MoreCheese: Events */

      INSERT INTO [${mjSchema}].[Entity] (
         [ID],
         [Name],
         [DisplayName],
         [Description],
         [NameSuffix],
         [BaseTable],
         [BaseView],
         [SchemaName],
         [IncludeInAPI],
         [AllowUserSearchAPI],
         [AllowCaching]
         , [TrackRecordChanges]
         , [AuditRecordAccess]
         , [AuditViewRuns]
         , [AllowAllRowsAPI]
         , [AllowCreateAPI]
         , [AllowUpdateAPI]
         , [AllowDeleteAPI]
         , [UserViewMaxRows]
         , [__mj_CreatedAt]
         , [__mj_UpdatedAt]
      )
      VALUES (
         'dd32d132-f9bb-4ffb-87c2-839fbc1a7b7f',
         'MoreCheese: Events',
         'Events',
         'Conferences, workshops, and webinars with venue coordinates for the member map',
         NULL,
         'Event',
         'vwEvents',
         'morecheese_events',
         1,
         1,
         0
         , 1
         , 0
         , 0
         , 0
         , 1
         , 1
         , 1
         , 1000
         , GETUTCDATE()
         , GETUTCDATE()
      );

/* SQL generated to add new entity MoreCheese: Events to application ID: '10CCBE4E-A3F7-4710-BDA3-3DC8E6DD75B8' */
INSERT INTO [${mjSchema}].[ApplicationEntity]
                                       ([ApplicationID], [EntityID], [Sequence], [__mj_CreatedAt], [__mj_UpdatedAt]) VALUES
                                       ('10CCBE4E-A3F7-4710-BDA3-3DC8E6DD75B8', 'dd32d132-f9bb-4ffb-87c2-839fbc1a7b7f', (SELECT COALESCE(MAX([Sequence]),0)+1 FROM [${mjSchema}].[ApplicationEntity] WHERE [ApplicationID] = '10CCBE4E-A3F7-4710-BDA3-3DC8E6DD75B8'), GETUTCDATE(), GETUTCDATE());

/* SQL generated to add new permission for entity MoreCheese: Events for role UI */
INSERT INTO [${mjSchema}].[EntityPermission]
                                                   ([EntityID], [RoleID], [CanRead], [CanCreate], [CanUpdate], [CanDelete], [__mj_CreatedAt], [__mj_UpdatedAt]) VALUES
                                                   ('dd32d132-f9bb-4ffb-87c2-839fbc1a7b7f', 'E0AFCCEC-6A37-EF11-86D4-000D3A4E707E', 1, 0, 0, 0, GETUTCDATE(), GETUTCDATE());

/* SQL generated to add new permission for entity MoreCheese: Events for role Developer */
INSERT INTO [${mjSchema}].[EntityPermission]
                                                   ([EntityID], [RoleID], [CanRead], [CanCreate], [CanUpdate], [CanDelete], [__mj_CreatedAt], [__mj_UpdatedAt]) VALUES
                                                   ('dd32d132-f9bb-4ffb-87c2-839fbc1a7b7f', 'DEAFCCEC-6A37-EF11-86D4-000D3A4E707E', 1, 1, 1, 1, GETUTCDATE(), GETUTCDATE());

/* SQL generated to add new permission for entity MoreCheese: Events for role Integration */
INSERT INTO [${mjSchema}].[EntityPermission]
                                                   ([EntityID], [RoleID], [CanRead], [CanCreate], [CanUpdate], [CanDelete], [__mj_CreatedAt], [__mj_UpdatedAt]) VALUES
                                                   ('dd32d132-f9bb-4ffb-87c2-839fbc1a7b7f', 'DFAFCCEC-6A37-EF11-86D4-000D3A4E707E', 1, 1, 1, 1, GETUTCDATE(), GETUTCDATE());

/* SQL text to update existing entities from schema */
EXEC [${mjSchema}].[spUpdateExistingEntitiesFromSchema] @ExcludedSchemaNames='sys,staging,${mjSchema}', @IncludedSchemaNames='${flyway:defaultSchema},morecheese_events,morecheese_learning';

/* SQL text to add special date field __mj_CreatedAt to entity ${flyway:defaultSchema}.MembershipPeriod */
ALTER TABLE [${flyway:defaultSchema}].[MembershipPeriod] ADD [__mj_CreatedAt] DATETIMEOFFSET NULL;
GO

/* SQL text to add special date field __mj_CreatedAt to entity ${flyway:defaultSchema}.MembershipPeriod */
UPDATE [${flyway:defaultSchema}].[MembershipPeriod] SET [__mj_CreatedAt] = GETUTCDATE() WHERE [__mj_CreatedAt] IS NULL;
GO

/* SQL text to add special date field __mj_CreatedAt to entity ${flyway:defaultSchema}.MembershipPeriod */
ALTER TABLE [${flyway:defaultSchema}].[MembershipPeriod] ALTER COLUMN [__mj_CreatedAt] DATETIMEOFFSET NOT NULL;
GO

/* SQL text to add special date field __mj_CreatedAt to entity ${flyway:defaultSchema}.MembershipPeriod */
ALTER TABLE [${flyway:defaultSchema}].[MembershipPeriod] ADD CONSTRAINT [DF_morecheese_members_MembershipPeriod___mj_CreatedAt] DEFAULT GETUTCDATE() FOR [__mj_CreatedAt];
GO

/* SQL text to add special date field __mj_UpdatedAt to entity ${flyway:defaultSchema}.MembershipPeriod */
ALTER TABLE [${flyway:defaultSchema}].[MembershipPeriod] ADD [__mj_UpdatedAt] DATETIMEOFFSET NULL;
GO

/* SQL text to add special date field __mj_UpdatedAt to entity ${flyway:defaultSchema}.MembershipPeriod */
UPDATE [${flyway:defaultSchema}].[MembershipPeriod] SET [__mj_UpdatedAt] = GETUTCDATE() WHERE [__mj_UpdatedAt] IS NULL;
GO

/* SQL text to add special date field __mj_UpdatedAt to entity ${flyway:defaultSchema}.MembershipPeriod */
ALTER TABLE [${flyway:defaultSchema}].[MembershipPeriod] ALTER COLUMN [__mj_UpdatedAt] DATETIMEOFFSET NOT NULL;
GO

/* SQL text to add special date field __mj_UpdatedAt to entity ${flyway:defaultSchema}.MembershipPeriod */
ALTER TABLE [${flyway:defaultSchema}].[MembershipPeriod] ADD CONSTRAINT [DF_morecheese_members_MembershipPeriod___mj_UpdatedAt] DEFAULT GETUTCDATE() FOR [__mj_UpdatedAt];
GO

/* SQL text to add special date field __mj_CreatedAt to entity morecheese_learning.Certification */
ALTER TABLE [morecheese_learning].[Certification] ADD [__mj_CreatedAt] DATETIMEOFFSET NULL;
GO

/* SQL text to add special date field __mj_CreatedAt to entity morecheese_learning.Certification */
UPDATE [morecheese_learning].[Certification] SET [__mj_CreatedAt] = GETUTCDATE() WHERE [__mj_CreatedAt] IS NULL;
GO

/* SQL text to add special date field __mj_CreatedAt to entity morecheese_learning.Certification */
ALTER TABLE [morecheese_learning].[Certification] ALTER COLUMN [__mj_CreatedAt] DATETIMEOFFSET NOT NULL;
GO

/* SQL text to add special date field __mj_CreatedAt to entity morecheese_learning.Certification */
ALTER TABLE [morecheese_learning].[Certification] ADD CONSTRAINT [DF_morecheese_learning_Certification___mj_CreatedAt] DEFAULT GETUTCDATE() FOR [__mj_CreatedAt];
GO

/* SQL text to add special date field __mj_UpdatedAt to entity morecheese_learning.Certification */
ALTER TABLE [morecheese_learning].[Certification] ADD [__mj_UpdatedAt] DATETIMEOFFSET NULL;
GO

/* SQL text to add special date field __mj_UpdatedAt to entity morecheese_learning.Certification */
UPDATE [morecheese_learning].[Certification] SET [__mj_UpdatedAt] = GETUTCDATE() WHERE [__mj_UpdatedAt] IS NULL;
GO

/* SQL text to add special date field __mj_UpdatedAt to entity morecheese_learning.Certification */
ALTER TABLE [morecheese_learning].[Certification] ALTER COLUMN [__mj_UpdatedAt] DATETIMEOFFSET NOT NULL;
GO

/* SQL text to add special date field __mj_UpdatedAt to entity morecheese_learning.Certification */
ALTER TABLE [morecheese_learning].[Certification] ADD CONSTRAINT [DF_morecheese_learning_Certification___mj_UpdatedAt] DEFAULT GETUTCDATE() FOR [__mj_UpdatedAt];
GO

/* SQL text to add special date field __mj_CreatedAt to entity ${flyway:defaultSchema}.OrganizationProfile */
ALTER TABLE [${flyway:defaultSchema}].[OrganizationProfile] ADD [__mj_CreatedAt] DATETIMEOFFSET NULL;
GO

/* SQL text to add special date field __mj_CreatedAt to entity ${flyway:defaultSchema}.OrganizationProfile */
UPDATE [${flyway:defaultSchema}].[OrganizationProfile] SET [__mj_CreatedAt] = GETUTCDATE() WHERE [__mj_CreatedAt] IS NULL;
GO

/* SQL text to add special date field __mj_CreatedAt to entity ${flyway:defaultSchema}.OrganizationProfile */
ALTER TABLE [${flyway:defaultSchema}].[OrganizationProfile] ALTER COLUMN [__mj_CreatedAt] DATETIMEOFFSET NOT NULL;
GO

/* SQL text to add special date field __mj_CreatedAt to entity ${flyway:defaultSchema}.OrganizationProfile */
ALTER TABLE [${flyway:defaultSchema}].[OrganizationProfile] ADD CONSTRAINT [DF_morecheese_members_OrganizationProfile___mj_CreatedAt] DEFAULT GETUTCDATE() FOR [__mj_CreatedAt];
GO

/* SQL text to add special date field __mj_UpdatedAt to entity ${flyway:defaultSchema}.OrganizationProfile */
ALTER TABLE [${flyway:defaultSchema}].[OrganizationProfile] ADD [__mj_UpdatedAt] DATETIMEOFFSET NULL;
GO

/* SQL text to add special date field __mj_UpdatedAt to entity ${flyway:defaultSchema}.OrganizationProfile */
UPDATE [${flyway:defaultSchema}].[OrganizationProfile] SET [__mj_UpdatedAt] = GETUTCDATE() WHERE [__mj_UpdatedAt] IS NULL;
GO

/* SQL text to add special date field __mj_UpdatedAt to entity ${flyway:defaultSchema}.OrganizationProfile */
ALTER TABLE [${flyway:defaultSchema}].[OrganizationProfile] ALTER COLUMN [__mj_UpdatedAt] DATETIMEOFFSET NOT NULL;
GO

/* SQL text to add special date field __mj_UpdatedAt to entity ${flyway:defaultSchema}.OrganizationProfile */
ALTER TABLE [${flyway:defaultSchema}].[OrganizationProfile] ADD CONSTRAINT [DF_morecheese_members_OrganizationProfile___mj_UpdatedAt] DEFAULT GETUTCDATE() FOR [__mj_UpdatedAt];
GO

/* SQL text to add special date field __mj_CreatedAt to entity morecheese_learning.MemberCertification */
ALTER TABLE [morecheese_learning].[MemberCertification] ADD [__mj_CreatedAt] DATETIMEOFFSET NULL;
GO

/* SQL text to add special date field __mj_CreatedAt to entity morecheese_learning.MemberCertification */
UPDATE [morecheese_learning].[MemberCertification] SET [__mj_CreatedAt] = GETUTCDATE() WHERE [__mj_CreatedAt] IS NULL;
GO

/* SQL text to add special date field __mj_CreatedAt to entity morecheese_learning.MemberCertification */
ALTER TABLE [morecheese_learning].[MemberCertification] ALTER COLUMN [__mj_CreatedAt] DATETIMEOFFSET NOT NULL;
GO

/* SQL text to add special date field __mj_CreatedAt to entity morecheese_learning.MemberCertification */
ALTER TABLE [morecheese_learning].[MemberCertification] ADD CONSTRAINT [DF_morecheese_learning_MemberCertification___mj_CreatedAt] DEFAULT GETUTCDATE() FOR [__mj_CreatedAt];
GO

/* SQL text to add special date field __mj_UpdatedAt to entity morecheese_learning.MemberCertification */
ALTER TABLE [morecheese_learning].[MemberCertification] ADD [__mj_UpdatedAt] DATETIMEOFFSET NULL;
GO

/* SQL text to add special date field __mj_UpdatedAt to entity morecheese_learning.MemberCertification */
UPDATE [morecheese_learning].[MemberCertification] SET [__mj_UpdatedAt] = GETUTCDATE() WHERE [__mj_UpdatedAt] IS NULL;
GO

/* SQL text to add special date field __mj_UpdatedAt to entity morecheese_learning.MemberCertification */
ALTER TABLE [morecheese_learning].[MemberCertification] ALTER COLUMN [__mj_UpdatedAt] DATETIMEOFFSET NOT NULL;
GO

/* SQL text to add special date field __mj_UpdatedAt to entity morecheese_learning.MemberCertification */
ALTER TABLE [morecheese_learning].[MemberCertification] ADD CONSTRAINT [DF_morecheese_learning_MemberCertification___mj_UpdatedAt] DEFAULT GETUTCDATE() FOR [__mj_UpdatedAt];
GO

/* SQL text to add special date field __mj_CreatedAt to entity morecheese_learning.CourseEnrollment */
ALTER TABLE [morecheese_learning].[CourseEnrollment] ADD [__mj_CreatedAt] DATETIMEOFFSET NULL;
GO

/* SQL text to add special date field __mj_CreatedAt to entity morecheese_learning.CourseEnrollment */
UPDATE [morecheese_learning].[CourseEnrollment] SET [__mj_CreatedAt] = GETUTCDATE() WHERE [__mj_CreatedAt] IS NULL;
GO

/* SQL text to add special date field __mj_CreatedAt to entity morecheese_learning.CourseEnrollment */
ALTER TABLE [morecheese_learning].[CourseEnrollment] ALTER COLUMN [__mj_CreatedAt] DATETIMEOFFSET NOT NULL;
GO

/* SQL text to add special date field __mj_CreatedAt to entity morecheese_learning.CourseEnrollment */
ALTER TABLE [morecheese_learning].[CourseEnrollment] ADD CONSTRAINT [DF_morecheese_learning_CourseEnrollment___mj_CreatedAt] DEFAULT GETUTCDATE() FOR [__mj_CreatedAt];
GO

/* SQL text to add special date field __mj_UpdatedAt to entity morecheese_learning.CourseEnrollment */
ALTER TABLE [morecheese_learning].[CourseEnrollment] ADD [__mj_UpdatedAt] DATETIMEOFFSET NULL;
GO

/* SQL text to add special date field __mj_UpdatedAt to entity morecheese_learning.CourseEnrollment */
UPDATE [morecheese_learning].[CourseEnrollment] SET [__mj_UpdatedAt] = GETUTCDATE() WHERE [__mj_UpdatedAt] IS NULL;
GO

/* SQL text to add special date field __mj_UpdatedAt to entity morecheese_learning.CourseEnrollment */
ALTER TABLE [morecheese_learning].[CourseEnrollment] ALTER COLUMN [__mj_UpdatedAt] DATETIMEOFFSET NOT NULL;
GO

/* SQL text to add special date field __mj_UpdatedAt to entity morecheese_learning.CourseEnrollment */
ALTER TABLE [morecheese_learning].[CourseEnrollment] ADD CONSTRAINT [DF_morecheese_learning_CourseEnrollment___mj_UpdatedAt] DEFAULT GETUTCDATE() FOR [__mj_UpdatedAt];
GO

/* SQL text to add special date field __mj_CreatedAt to entity morecheese_events.Event */
ALTER TABLE [morecheese_events].[Event] ADD [__mj_CreatedAt] DATETIMEOFFSET NULL;
GO

/* SQL text to add special date field __mj_CreatedAt to entity morecheese_events.Event */
UPDATE [morecheese_events].[Event] SET [__mj_CreatedAt] = GETUTCDATE() WHERE [__mj_CreatedAt] IS NULL;
GO

/* SQL text to add special date field __mj_CreatedAt to entity morecheese_events.Event */
ALTER TABLE [morecheese_events].[Event] ALTER COLUMN [__mj_CreatedAt] DATETIMEOFFSET NOT NULL;
GO

/* SQL text to add special date field __mj_CreatedAt to entity morecheese_events.Event */
ALTER TABLE [morecheese_events].[Event] ADD CONSTRAINT [DF_morecheese_events_Event___mj_CreatedAt] DEFAULT GETUTCDATE() FOR [__mj_CreatedAt];
GO

/* SQL text to add special date field __mj_UpdatedAt to entity morecheese_events.Event */
ALTER TABLE [morecheese_events].[Event] ADD [__mj_UpdatedAt] DATETIMEOFFSET NULL;
GO

/* SQL text to add special date field __mj_UpdatedAt to entity morecheese_events.Event */
UPDATE [morecheese_events].[Event] SET [__mj_UpdatedAt] = GETUTCDATE() WHERE [__mj_UpdatedAt] IS NULL;
GO

/* SQL text to add special date field __mj_UpdatedAt to entity morecheese_events.Event */
ALTER TABLE [morecheese_events].[Event] ALTER COLUMN [__mj_UpdatedAt] DATETIMEOFFSET NOT NULL;
GO

/* SQL text to add special date field __mj_UpdatedAt to entity morecheese_events.Event */
ALTER TABLE [morecheese_events].[Event] ADD CONSTRAINT [DF_morecheese_events_Event___mj_UpdatedAt] DEFAULT GETUTCDATE() FOR [__mj_UpdatedAt];
GO

/* SQL text to add special date field __mj_CreatedAt to entity morecheese_events.EventRegistration */
ALTER TABLE [morecheese_events].[EventRegistration] ADD [__mj_CreatedAt] DATETIMEOFFSET NULL;
GO

/* SQL text to add special date field __mj_CreatedAt to entity morecheese_events.EventRegistration */
UPDATE [morecheese_events].[EventRegistration] SET [__mj_CreatedAt] = GETUTCDATE() WHERE [__mj_CreatedAt] IS NULL;
GO

/* SQL text to add special date field __mj_CreatedAt to entity morecheese_events.EventRegistration */
ALTER TABLE [morecheese_events].[EventRegistration] ALTER COLUMN [__mj_CreatedAt] DATETIMEOFFSET NOT NULL;
GO

/* SQL text to add special date field __mj_CreatedAt to entity morecheese_events.EventRegistration */
ALTER TABLE [morecheese_events].[EventRegistration] ADD CONSTRAINT [DF_morecheese_events_EventRegistration___mj_CreatedAt] DEFAULT GETUTCDATE() FOR [__mj_CreatedAt];
GO

/* SQL text to add special date field __mj_UpdatedAt to entity morecheese_events.EventRegistration */
ALTER TABLE [morecheese_events].[EventRegistration] ADD [__mj_UpdatedAt] DATETIMEOFFSET NULL;
GO

/* SQL text to add special date field __mj_UpdatedAt to entity morecheese_events.EventRegistration */
UPDATE [morecheese_events].[EventRegistration] SET [__mj_UpdatedAt] = GETUTCDATE() WHERE [__mj_UpdatedAt] IS NULL;
GO

/* SQL text to add special date field __mj_UpdatedAt to entity morecheese_events.EventRegistration */
ALTER TABLE [morecheese_events].[EventRegistration] ALTER COLUMN [__mj_UpdatedAt] DATETIMEOFFSET NOT NULL;
GO

/* SQL text to add special date field __mj_UpdatedAt to entity morecheese_events.EventRegistration */
ALTER TABLE [morecheese_events].[EventRegistration] ADD CONSTRAINT [DF_morecheese_events_EventRegistration___mj_UpdatedAt] DEFAULT GETUTCDATE() FOR [__mj_UpdatedAt];
GO

/* SQL text to add special date field __mj_CreatedAt to entity ${flyway:defaultSchema}.AdvocacyAction */
ALTER TABLE [${flyway:defaultSchema}].[AdvocacyAction] ADD [__mj_CreatedAt] DATETIMEOFFSET NULL;
GO

/* SQL text to add special date field __mj_CreatedAt to entity ${flyway:defaultSchema}.AdvocacyAction */
UPDATE [${flyway:defaultSchema}].[AdvocacyAction] SET [__mj_CreatedAt] = GETUTCDATE() WHERE [__mj_CreatedAt] IS NULL;
GO

/* SQL text to add special date field __mj_CreatedAt to entity ${flyway:defaultSchema}.AdvocacyAction */
ALTER TABLE [${flyway:defaultSchema}].[AdvocacyAction] ALTER COLUMN [__mj_CreatedAt] DATETIMEOFFSET NOT NULL;
GO

/* SQL text to add special date field __mj_CreatedAt to entity ${flyway:defaultSchema}.AdvocacyAction */
ALTER TABLE [${flyway:defaultSchema}].[AdvocacyAction] ADD CONSTRAINT [DF_morecheese_members_AdvocacyAction___mj_CreatedAt] DEFAULT GETUTCDATE() FOR [__mj_CreatedAt];
GO

/* SQL text to add special date field __mj_UpdatedAt to entity ${flyway:defaultSchema}.AdvocacyAction */
ALTER TABLE [${flyway:defaultSchema}].[AdvocacyAction] ADD [__mj_UpdatedAt] DATETIMEOFFSET NULL;
GO

/* SQL text to add special date field __mj_UpdatedAt to entity ${flyway:defaultSchema}.AdvocacyAction */
UPDATE [${flyway:defaultSchema}].[AdvocacyAction] SET [__mj_UpdatedAt] = GETUTCDATE() WHERE [__mj_UpdatedAt] IS NULL;
GO

/* SQL text to add special date field __mj_UpdatedAt to entity ${flyway:defaultSchema}.AdvocacyAction */
ALTER TABLE [${flyway:defaultSchema}].[AdvocacyAction] ALTER COLUMN [__mj_UpdatedAt] DATETIMEOFFSET NOT NULL;
GO

/* SQL text to add special date field __mj_UpdatedAt to entity ${flyway:defaultSchema}.AdvocacyAction */
ALTER TABLE [${flyway:defaultSchema}].[AdvocacyAction] ADD CONSTRAINT [DF_morecheese_members_AdvocacyAction___mj_UpdatedAt] DEFAULT GETUTCDATE() FOR [__mj_UpdatedAt];
GO

/* SQL text to add special date field __mj_CreatedAt to entity morecheese_events.CompetitionEntry */
ALTER TABLE [morecheese_events].[CompetitionEntry] ADD [__mj_CreatedAt] DATETIMEOFFSET NULL;
GO

/* SQL text to add special date field __mj_CreatedAt to entity morecheese_events.CompetitionEntry */
UPDATE [morecheese_events].[CompetitionEntry] SET [__mj_CreatedAt] = GETUTCDATE() WHERE [__mj_CreatedAt] IS NULL;
GO

/* SQL text to add special date field __mj_CreatedAt to entity morecheese_events.CompetitionEntry */
ALTER TABLE [morecheese_events].[CompetitionEntry] ALTER COLUMN [__mj_CreatedAt] DATETIMEOFFSET NOT NULL;
GO

/* SQL text to add special date field __mj_CreatedAt to entity morecheese_events.CompetitionEntry */
ALTER TABLE [morecheese_events].[CompetitionEntry] ADD CONSTRAINT [DF_morecheese_events_CompetitionEntry___mj_CreatedAt] DEFAULT GETUTCDATE() FOR [__mj_CreatedAt];
GO

/* SQL text to add special date field __mj_UpdatedAt to entity morecheese_events.CompetitionEntry */
ALTER TABLE [morecheese_events].[CompetitionEntry] ADD [__mj_UpdatedAt] DATETIMEOFFSET NULL;
GO

/* SQL text to add special date field __mj_UpdatedAt to entity morecheese_events.CompetitionEntry */
UPDATE [morecheese_events].[CompetitionEntry] SET [__mj_UpdatedAt] = GETUTCDATE() WHERE [__mj_UpdatedAt] IS NULL;
GO

/* SQL text to add special date field __mj_UpdatedAt to entity morecheese_events.CompetitionEntry */
ALTER TABLE [morecheese_events].[CompetitionEntry] ALTER COLUMN [__mj_UpdatedAt] DATETIMEOFFSET NOT NULL;
GO

/* SQL text to add special date field __mj_UpdatedAt to entity morecheese_events.CompetitionEntry */
ALTER TABLE [morecheese_events].[CompetitionEntry] ADD CONSTRAINT [DF_morecheese_events_CompetitionEntry___mj_UpdatedAt] DEFAULT GETUTCDATE() FOR [__mj_UpdatedAt];
GO

/* SQL text to add special date field __mj_CreatedAt to entity ${flyway:defaultSchema}.MemberProfile */
ALTER TABLE [${flyway:defaultSchema}].[MemberProfile] ADD [__mj_CreatedAt] DATETIMEOFFSET NULL;
GO

/* SQL text to add special date field __mj_CreatedAt to entity ${flyway:defaultSchema}.MemberProfile */
UPDATE [${flyway:defaultSchema}].[MemberProfile] SET [__mj_CreatedAt] = GETUTCDATE() WHERE [__mj_CreatedAt] IS NULL;
GO

/* SQL text to add special date field __mj_CreatedAt to entity ${flyway:defaultSchema}.MemberProfile */
ALTER TABLE [${flyway:defaultSchema}].[MemberProfile] ALTER COLUMN [__mj_CreatedAt] DATETIMEOFFSET NOT NULL;
GO

/* SQL text to add special date field __mj_CreatedAt to entity ${flyway:defaultSchema}.MemberProfile */
ALTER TABLE [${flyway:defaultSchema}].[MemberProfile] ADD CONSTRAINT [DF_morecheese_members_MemberProfile___mj_CreatedAt] DEFAULT GETUTCDATE() FOR [__mj_CreatedAt];
GO

/* SQL text to add special date field __mj_UpdatedAt to entity ${flyway:defaultSchema}.MemberProfile */
ALTER TABLE [${flyway:defaultSchema}].[MemberProfile] ADD [__mj_UpdatedAt] DATETIMEOFFSET NULL;
GO

/* SQL text to add special date field __mj_UpdatedAt to entity ${flyway:defaultSchema}.MemberProfile */
UPDATE [${flyway:defaultSchema}].[MemberProfile] SET [__mj_UpdatedAt] = GETUTCDATE() WHERE [__mj_UpdatedAt] IS NULL;
GO

/* SQL text to add special date field __mj_UpdatedAt to entity ${flyway:defaultSchema}.MemberProfile */
ALTER TABLE [${flyway:defaultSchema}].[MemberProfile] ALTER COLUMN [__mj_UpdatedAt] DATETIMEOFFSET NOT NULL;
GO

/* SQL text to add special date field __mj_UpdatedAt to entity ${flyway:defaultSchema}.MemberProfile */
ALTER TABLE [${flyway:defaultSchema}].[MemberProfile] ADD CONSTRAINT [DF_morecheese_members_MemberProfile___mj_UpdatedAt] DEFAULT GETUTCDATE() FOR [__mj_UpdatedAt];
GO

/* SQL text to add special date field __mj_CreatedAt to entity morecheese_learning.Course */
ALTER TABLE [morecheese_learning].[Course] ADD [__mj_CreatedAt] DATETIMEOFFSET NULL;
GO

/* SQL text to add special date field __mj_CreatedAt to entity morecheese_learning.Course */
UPDATE [morecheese_learning].[Course] SET [__mj_CreatedAt] = GETUTCDATE() WHERE [__mj_CreatedAt] IS NULL;
GO

/* SQL text to add special date field __mj_CreatedAt to entity morecheese_learning.Course */
ALTER TABLE [morecheese_learning].[Course] ALTER COLUMN [__mj_CreatedAt] DATETIMEOFFSET NOT NULL;
GO

/* SQL text to add special date field __mj_CreatedAt to entity morecheese_learning.Course */
ALTER TABLE [morecheese_learning].[Course] ADD CONSTRAINT [DF_morecheese_learning_Course___mj_CreatedAt] DEFAULT GETUTCDATE() FOR [__mj_CreatedAt];
GO

/* SQL text to add special date field __mj_UpdatedAt to entity morecheese_learning.Course */
ALTER TABLE [morecheese_learning].[Course] ADD [__mj_UpdatedAt] DATETIMEOFFSET NULL;
GO

/* SQL text to add special date field __mj_UpdatedAt to entity morecheese_learning.Course */
UPDATE [morecheese_learning].[Course] SET [__mj_UpdatedAt] = GETUTCDATE() WHERE [__mj_UpdatedAt] IS NULL;
GO

/* SQL text to add special date field __mj_UpdatedAt to entity morecheese_learning.Course */
ALTER TABLE [morecheese_learning].[Course] ALTER COLUMN [__mj_UpdatedAt] DATETIMEOFFSET NOT NULL;
GO

/* SQL text to add special date field __mj_UpdatedAt to entity morecheese_learning.Course */
ALTER TABLE [morecheese_learning].[Course] ADD CONSTRAINT [DF_morecheese_learning_Course___mj_UpdatedAt] DEFAULT GETUTCDATE() FOR [__mj_UpdatedAt];
GO

/* SQL text to add special date field __mj_CreatedAt to entity ${flyway:defaultSchema}.DataQualityLabel */
ALTER TABLE [${flyway:defaultSchema}].[DataQualityLabel] ADD [__mj_CreatedAt] DATETIMEOFFSET NULL;
GO

/* SQL text to add special date field __mj_CreatedAt to entity ${flyway:defaultSchema}.DataQualityLabel */
UPDATE [${flyway:defaultSchema}].[DataQualityLabel] SET [__mj_CreatedAt] = GETUTCDATE() WHERE [__mj_CreatedAt] IS NULL;
GO

/* SQL text to add special date field __mj_CreatedAt to entity ${flyway:defaultSchema}.DataQualityLabel */
ALTER TABLE [${flyway:defaultSchema}].[DataQualityLabel] ALTER COLUMN [__mj_CreatedAt] DATETIMEOFFSET NOT NULL;
GO

/* SQL text to add special date field __mj_CreatedAt to entity ${flyway:defaultSchema}.DataQualityLabel */
ALTER TABLE [${flyway:defaultSchema}].[DataQualityLabel] ADD CONSTRAINT [DF_morecheese_members_DataQualityLabel___mj_CreatedAt] DEFAULT GETUTCDATE() FOR [__mj_CreatedAt];
GO

/* SQL text to add special date field __mj_UpdatedAt to entity ${flyway:defaultSchema}.DataQualityLabel */
ALTER TABLE [${flyway:defaultSchema}].[DataQualityLabel] ADD [__mj_UpdatedAt] DATETIMEOFFSET NULL;
GO

/* SQL text to add special date field __mj_UpdatedAt to entity ${flyway:defaultSchema}.DataQualityLabel */
UPDATE [${flyway:defaultSchema}].[DataQualityLabel] SET [__mj_UpdatedAt] = GETUTCDATE() WHERE [__mj_UpdatedAt] IS NULL;
GO

/* SQL text to add special date field __mj_UpdatedAt to entity ${flyway:defaultSchema}.DataQualityLabel */
ALTER TABLE [${flyway:defaultSchema}].[DataQualityLabel] ALTER COLUMN [__mj_UpdatedAt] DATETIMEOFFSET NOT NULL;
GO

/* SQL text to add special date field __mj_UpdatedAt to entity ${flyway:defaultSchema}.DataQualityLabel */
ALTER TABLE [${flyway:defaultSchema}].[DataQualityLabel] ADD CONSTRAINT [DF_morecheese_members_DataQualityLabel___mj_UpdatedAt] DEFAULT GETUTCDATE() FOR [__mj_UpdatedAt];
GO

/* SQL text to insert 162 new entity field(s) */
UPDATE [${mjSchema}].[EntityField]
         SET [Sequence] = [Sequence] + 100000
       WHERE [EntityID] = '6585D210-BD5A-44E2-BD90-0D425734DCF0'
         AND [Sequence] < 100000
         AND NOT EXISTS (
             SELECT 1 FROM [${mjSchema}].[EntityField]
              WHERE [EntityID] = '6585D210-BD5A-44E2-BD90-0D425734DCF0'
                AND [Sequence] >= 100000
         );

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = 'a1e95382-4dcf-4f5c-8029-d17c6bc2b54d' OR (EntityID = '6585D210-BD5A-44E2-BD90-0D425734DCF0' AND Name = 'ID')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            'a1e95382-4dcf-4f5c-8029-d17c6bc2b54d',
            '6585D210-BD5A-44E2-BD90-0D425734DCF0', -- Entity: MoreCheese: Membership Periods
            1,
            'ID',
            'ID',
            NULL,
            'uniqueidentifier',
            16,
            0,
            0,
            0,
            'newsequentialid()',
            0,
            0,
            0,
            0,
            NULL,
            NULL,
            0,
            1,
            0,
            0,
            1,
            1,
            'Search',
            GETUTCDATE(),
            GETUTCDATE()
         )
      END;

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = 'c9388e2b-692a-4b0b-bbc2-9a00e9553a11' OR (EntityID = '6585D210-BD5A-44E2-BD90-0D425734DCF0' AND Name = 'PeriodKey')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            'c9388e2b-692a-4b0b-bbc2-9a00e9553a11',
            '6585D210-BD5A-44E2-BD90-0D425734DCF0', -- Entity: MoreCheese: Membership Periods
            2,
            'PeriodKey',
            'Period Key',
            'Business key: <MemberNumber>-P<n>, the n-th period of that member',
            'nvarchar',
            120,
            0,
            0,
            0,
            NULL,
            0,
            1,
            0,
            0,
            NULL,
            NULL,
            0,
            0,
            0,
            0,
            0,
            1,
            'Search',
            GETUTCDATE(),
            GETUTCDATE()
         )
      END;

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '5d36973e-4ca0-42c1-a641-653e3a3962f3' OR (EntityID = '6585D210-BD5A-44E2-BD90-0D425734DCF0' AND Name = 'PersonID')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            '5d36973e-4ca0-42c1-a641-653e3a3962f3',
            '6585D210-BD5A-44E2-BD90-0D425734DCF0', -- Entity: MoreCheese: Membership Periods
            3,
            'PersonID',
            'Person ID',
            NULL,
            'uniqueidentifier',
            16,
            0,
            0,
            0,
            NULL,
            0,
            1,
            0,
            0,
            '7A94ADA9-7880-4FAE-97D8-DB0E934C3F5F',
            'ID',
            0,
            0,
            1,
            0,
            0,
            0,
            'Search',
            GETUTCDATE(),
            GETUTCDATE()
         )
      END;

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '52def96d-22aa-4aac-9752-45561d7b9e6e' OR (EntityID = '6585D210-BD5A-44E2-BD90-0D425734DCF0' AND Name = 'MembershipTier')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            '52def96d-22aa-4aac-9752-45561d7b9e6e',
            '6585D210-BD5A-44E2-BD90-0D425734DCF0', -- Entity: MoreCheese: Membership Periods
            4,
            'MembershipTier',
            'Membership Tier',
            'Tier for this period: Enthusiast, Individual, SmallBusiness, or Corporate',
            'nvarchar',
            100,
            0,
            0,
            0,
            NULL,
            0,
            1,
            0,
            0,
            NULL,
            NULL,
            0,
            0,
            0,
            0,
            0,
            0,
            'Search',
            GETUTCDATE(),
            GETUTCDATE()
         )
      END;

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '916290c3-05f9-41cb-a9ce-b9e78da7f4d0' OR (EntityID = '6585D210-BD5A-44E2-BD90-0D425734DCF0' AND Name = 'DuesAmount')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            '916290c3-05f9-41cb-a9ce-b9e78da7f4d0',
            '6585D210-BD5A-44E2-BD90-0D425734DCF0', -- Entity: MoreCheese: Membership Periods
            5,
            'DuesAmount',
            'Dues Amount',
            'Dues billed for this period, in USD, per the tier lattice',
            'decimal',
            9,
            10,
            2,
            0,
            NULL,
            0,
            1,
            0,
            0,
            NULL,
            NULL,
            0,
            0,
            0,
            0,
            0,
            0,
            'Search',
            GETUTCDATE(),
            GETUTCDATE()
         )
      END;

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = 'd8d733c1-ad7b-4072-9e6a-2b181bdd5b85' OR (EntityID = '6585D210-BD5A-44E2-BD90-0D425734DCF0' AND Name = 'StartDate')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            'd8d733c1-ad7b-4072-9e6a-2b181bdd5b85',
            '6585D210-BD5A-44E2-BD90-0D425734DCF0', -- Entity: MoreCheese: Membership Periods
            6,
            'StartDate',
            'Start Date',
            'Period start; renewals back-date so consecutive periods never gap',
            'date',
            3,
            10,
            0,
            0,
            NULL,
            0,
            1,
            0,
            0,
            NULL,
            NULL,
            0,
            0,
            0,
            0,
            0,
            0,
            'Search',
            GETUTCDATE(),
            GETUTCDATE()
         )
      END;

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '58aa7eb9-473f-4e76-82ef-330d5d914e8c' OR (EntityID = '6585D210-BD5A-44E2-BD90-0D425734DCF0' AND Name = 'EndDate')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            '58aa7eb9-473f-4e76-82ef-330d5d914e8c',
            '6585D210-BD5A-44E2-BD90-0D425734DCF0', -- Entity: MoreCheese: Membership Periods
            7,
            'EndDate',
            'End Date',
            'Period end; member status is derived from the latest period, never stored',
            'date',
            3,
            10,
            0,
            0,
            NULL,
            0,
            1,
            0,
            0,
            NULL,
            NULL,
            0,
            0,
            0,
            0,
            0,
            0,
            'Search',
            GETUTCDATE(),
            GETUTCDATE()
         )
      END;

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '3f5345ce-676a-414a-81c8-a6ea7b0d5609' OR (EntityID = '6585D210-BD5A-44E2-BD90-0D425734DCF0' AND Name = 'RenewalDate')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            '3f5345ce-676a-414a-81c8-a6ea7b0d5609',
            '6585D210-BD5A-44E2-BD90-0D425734DCF0', -- Entity: MoreCheese: Membership Periods
            8,
            'RenewalDate',
            'Renewal Date',
            'Date the renewal decision falls due (equals EndDate)',
            'date',
            3,
            10,
            0,
            0,
            NULL,
            0,
            1,
            0,
            0,
            NULL,
            NULL,
            0,
            0,
            0,
            0,
            0,
            0,
            'Search',
            GETUTCDATE(),
            GETUTCDATE()
         )
      END;

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '2f526a4f-673f-4182-82b3-6305959954c5' OR (EntityID = '6585D210-BD5A-44E2-BD90-0D425734DCF0' AND Name = 'Status')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            '2f526a4f-673f-4182-82b3-6305959954c5',
            '6585D210-BD5A-44E2-BD90-0D425734DCF0', -- Entity: MoreCheese: Membership Periods
            9,
            'Status',
            'Status',
            'Period state: Active, Renewed, Lapsed, PendingRenewal, or Cancelled — member-lifecycle state lives HERE, never on Person',
            'nvarchar',
            100,
            0,
            0,
            0,
            NULL,
            0,
            1,
            0,
            0,
            NULL,
            NULL,
            0,
            0,
            0,
            0,
            0,
            0,
            'Search',
            GETUTCDATE(),
            GETUTCDATE()
         )
      END;

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '4306c89a-4567-4261-ae6e-4158cda58057' OR (EntityID = '6585D210-BD5A-44E2-BD90-0D425734DCF0' AND Name = 'CancellationDate')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            '4306c89a-4567-4261-ae6e-4158cda58057',
            '6585D210-BD5A-44E2-BD90-0D425734DCF0', -- Entity: MoreCheese: Membership Periods
            10,
            'CancellationDate',
            'Cancellation Date',
            'Set when a lapse passes the 2-month grace window (team rule: every lapse past grace gets a termination date)',
            'date',
            3,
            10,
            0,
            1,
            NULL,
            0,
            1,
            0,
            0,
            NULL,
            NULL,
            0,
            0,
            0,
            0,
            0,
            0,
            'Search',
            GETUTCDATE(),
            GETUTCDATE()
         )
      END;

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '1b2b0220-200a-45a2-ac75-56ecf54253ca' OR (EntityID = '6585D210-BD5A-44E2-BD90-0D425734DCF0' AND Name = 'CancellationReason')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            '1b2b0220-200a-45a2-ac75-56ecf54253ca',
            '6585D210-BD5A-44E2-BD90-0D425734DCF0', -- Entity: MoreCheese: Membership Periods
            11,
            'CancellationReason',
            'Cancellation Reason',
            'Why the membership ended (e.g. non-payment — employer event); carries the diagnosis for win-back stories',
            'nvarchar',
            400,
            0,
            0,
            1,
            NULL,
            0,
            1,
            0,
            0,
            NULL,
            NULL,
            0,
            0,
            0,
            0,
            0,
            0,
            'Search',
            GETUTCDATE(),
            GETUTCDATE()
         )
      END;

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '97ec08d1-de91-45f9-ac4e-3f123abf46c7' OR (EntityID = '6585D210-BD5A-44E2-BD90-0D425734DCF0' AND Name = 'AutoRenew')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            '97ec08d1-de91-45f9-ac4e-3f123abf46c7',
            '6585D210-BD5A-44E2-BD90-0D425734DCF0', -- Entity: MoreCheese: Membership Periods
            12,
            'AutoRenew',
            'Auto Renew',
            'Whether this period renews automatically (card on file)',
            'bit',
            1,
            1,
            0,
            0,
            '(0)',
            0,
            1,
            0,
            0,
            NULL,
            NULL,
            0,
            0,
            0,
            0,
            0,
            0,
            'Search',
            GETUTCDATE(),
            GETUTCDATE()
         )
      END;

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = 'ab28e37c-fd4c-471a-9fa2-517dd09e5889' OR (EntityID = '6585D210-BD5A-44E2-BD90-0D425734DCF0' AND Name = 'IsSharedDemo')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            'ab28e37c-fd4c-471a-9fa2-517dd09e5889',
            '6585D210-BD5A-44E2-BD90-0D425734DCF0', -- Entity: MoreCheese: Membership Periods
            13,
            'IsSharedDemo',
            'Is Shared Demo',
            'Marks generated shared-demo rows; the wipe-and-recreate boundary',
            'bit',
            1,
            1,
            0,
            0,
            '(1)',
            0,
            1,
            0,
            0,
            NULL,
            NULL,
            0,
            0,
            0,
            0,
            0,
            0,
            'Search',
            GETUTCDATE(),
            GETUTCDATE()
         )
      END;

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '68a7357f-8c19-495c-838a-4b66bbf39dde' OR (EntityID = '6585D210-BD5A-44E2-BD90-0D425734DCF0' AND Name = '__mj_CreatedAt')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            '68a7357f-8c19-495c-838a-4b66bbf39dde',
            '6585D210-BD5A-44E2-BD90-0D425734DCF0', -- Entity: MoreCheese: Membership Periods
            14,
            '__mj_CreatedAt',
            'Created At',
            NULL,
            'datetimeoffset',
            10,
            34,
            7,
            0,
            'getutcdate()',
            0,
            0,
            0,
            0,
            NULL,
            NULL,
            0,
            0,
            0,
            0,
            0,
            0,
            'Search',
            GETUTCDATE(),
            GETUTCDATE()
         )
      END;

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '26e83c10-c993-49ed-a313-59ca4ef7ad2a' OR (EntityID = '6585D210-BD5A-44E2-BD90-0D425734DCF0' AND Name = '__mj_UpdatedAt')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            '26e83c10-c993-49ed-a313-59ca4ef7ad2a',
            '6585D210-BD5A-44E2-BD90-0D425734DCF0', -- Entity: MoreCheese: Membership Periods
            15,
            '__mj_UpdatedAt',
            'Updated At',
            NULL,
            'datetimeoffset',
            10,
            34,
            7,
            0,
            'getutcdate()',
            0,
            0,
            0,
            0,
            NULL,
            NULL,
            0,
            0,
            0,
            0,
            0,
            0,
            'Search',
            GETUTCDATE(),
            GETUTCDATE()
         )
      END;
UPDATE [${mjSchema}].[EntityField]
         SET [Sequence] = [Sequence] + 100000
       WHERE [EntityID] = '141E023A-18C1-4C84-962C-2BD1ABF0627F'
         AND [Sequence] < 100000
         AND NOT EXISTS (
             SELECT 1 FROM [${mjSchema}].[EntityField]
              WHERE [EntityID] = '141E023A-18C1-4C84-962C-2BD1ABF0627F'
                AND [Sequence] >= 100000
         );

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = 'f1e78ddb-6237-4b85-b0c8-0524c192d00f' OR (EntityID = '141E023A-18C1-4C84-962C-2BD1ABF0627F' AND Name = 'ID')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            'f1e78ddb-6237-4b85-b0c8-0524c192d00f',
            '141E023A-18C1-4C84-962C-2BD1ABF0627F', -- Entity: MoreCheese: Certifications
            1,
            'ID',
            'ID',
            NULL,
            'uniqueidentifier',
            16,
            0,
            0,
            0,
            'newsequentialid()',
            0,
            0,
            0,
            0,
            NULL,
            NULL,
            0,
            1,
            0,
            0,
            1,
            1,
            'Search',
            GETUTCDATE(),
            GETUTCDATE()
         )
      END;

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = 'b759e74b-4cd0-44f2-afca-ed7c46016d8e' OR (EntityID = '141E023A-18C1-4C84-962C-2BD1ABF0627F' AND Name = 'CertKey')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            'b759e74b-4cd0-44f2-afca-ed7c46016d8e',
            '141E023A-18C1-4C84-962C-2BD1ABF0627F', -- Entity: MoreCheese: Certifications
            2,
            'CertKey',
            'Cert Key',
            'Business key (e.g. CERT-CCP)',
            'nvarchar',
            100,
            0,
            0,
            0,
            NULL,
            0,
            1,
            0,
            0,
            NULL,
            NULL,
            0,
            0,
            0,
            0,
            0,
            1,
            'Search',
            GETUTCDATE(),
            GETUTCDATE()
         )
      END;

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '277ea8db-e1ff-4c8c-ae97-eabd3e68364c' OR (EntityID = '141E023A-18C1-4C84-962C-2BD1ABF0627F' AND Name = 'Name')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            '277ea8db-e1ff-4c8c-ae97-eabd3e68364c',
            '141E023A-18C1-4C84-962C-2BD1ABF0627F', -- Entity: MoreCheese: Certifications
            3,
            'Name',
            'Name',
            NULL,
            'nvarchar',
            400,
            0,
            0,
            0,
            NULL,
            0,
            1,
            0,
            0,
            NULL,
            NULL,
            1,
            1,
            0,
            1,
            0,
            0,
            'Search',
            GETUTCDATE(),
            GETUTCDATE()
         )
      END;

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = 'b0e1d409-433b-4daf-bfb3-3b67924ab0e7' OR (EntityID = '141E023A-18C1-4C84-962C-2BD1ABF0627F' AND Name = 'Description')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            'b0e1d409-433b-4daf-bfb3-3b67924ab0e7',
            '141E023A-18C1-4C84-962C-2BD1ABF0627F', -- Entity: MoreCheese: Certifications
            4,
            'Description',
            'Description',
            NULL,
            'nvarchar',
            -1,
            0,
            0,
            1,
            NULL,
            0,
            1,
            0,
            0,
            NULL,
            NULL,
            0,
            0,
            0,
            0,
            0,
            0,
            'Search',
            GETUTCDATE(),
            GETUTCDATE()
         )
      END;

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '6e338be3-9411-4819-af92-c1b9c8aad404' OR (EntityID = '141E023A-18C1-4C84-962C-2BD1ABF0627F' AND Name = 'ValidYears')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            '6e338be3-9411-4819-af92-c1b9c8aad404',
            '141E023A-18C1-4C84-962C-2BD1ABF0627F', -- Entity: MoreCheese: Certifications
            5,
            'ValidYears',
            'Valid Years',
            'Years the credential stays valid after award',
            'int',
            4,
            10,
            0,
            0,
            '(3)',
            0,
            1,
            0,
            0,
            NULL,
            NULL,
            0,
            0,
            0,
            0,
            0,
            0,
            'Search',
            GETUTCDATE(),
            GETUTCDATE()
         )
      END;

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '42d182ac-ada5-4514-9741-032849061125' OR (EntityID = '141E023A-18C1-4C84-962C-2BD1ABF0627F' AND Name = 'IsSharedDemo')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            '42d182ac-ada5-4514-9741-032849061125',
            '141E023A-18C1-4C84-962C-2BD1ABF0627F', -- Entity: MoreCheese: Certifications
            6,
            'IsSharedDemo',
            'Is Shared Demo',
            NULL,
            'bit',
            1,
            1,
            0,
            0,
            '(1)',
            0,
            1,
            0,
            0,
            NULL,
            NULL,
            0,
            0,
            0,
            0,
            0,
            0,
            'Search',
            GETUTCDATE(),
            GETUTCDATE()
         )
      END;

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = 'e2060987-492c-4abe-a8f5-1f85b5d8bd6b' OR (EntityID = '141E023A-18C1-4C84-962C-2BD1ABF0627F' AND Name = '__mj_CreatedAt')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            'e2060987-492c-4abe-a8f5-1f85b5d8bd6b',
            '141E023A-18C1-4C84-962C-2BD1ABF0627F', -- Entity: MoreCheese: Certifications
            7,
            '__mj_CreatedAt',
            'Created At',
            NULL,
            'datetimeoffset',
            10,
            34,
            7,
            0,
            'getutcdate()',
            0,
            0,
            0,
            0,
            NULL,
            NULL,
            0,
            0,
            0,
            0,
            0,
            0,
            'Search',
            GETUTCDATE(),
            GETUTCDATE()
         )
      END;

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '99cbee6e-f1e4-48f9-bc12-b6e72a7db112' OR (EntityID = '141E023A-18C1-4C84-962C-2BD1ABF0627F' AND Name = '__mj_UpdatedAt')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            '99cbee6e-f1e4-48f9-bc12-b6e72a7db112',
            '141E023A-18C1-4C84-962C-2BD1ABF0627F', -- Entity: MoreCheese: Certifications
            8,
            '__mj_UpdatedAt',
            'Updated At',
            NULL,
            'datetimeoffset',
            10,
            34,
            7,
            0,
            'getutcdate()',
            0,
            0,
            0,
            0,
            NULL,
            NULL,
            0,
            0,
            0,
            0,
            0,
            0,
            'Search',
            GETUTCDATE(),
            GETUTCDATE()
         )
      END;
UPDATE [${mjSchema}].[EntityField]
         SET [Sequence] = [Sequence] + 100000
       WHERE [EntityID] = 'A820FA5A-520E-4058-92D8-33C5AEC0FEC5'
         AND [Sequence] < 100000
         AND NOT EXISTS (
             SELECT 1 FROM [${mjSchema}].[EntityField]
              WHERE [EntityID] = 'A820FA5A-520E-4058-92D8-33C5AEC0FEC5'
                AND [Sequence] >= 100000
         );

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = 'c795296c-00da-4cdf-9d11-df7bb198871e' OR (EntityID = 'A820FA5A-520E-4058-92D8-33C5AEC0FEC5' AND Name = 'ID')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            'c795296c-00da-4cdf-9d11-df7bb198871e',
            'A820FA5A-520E-4058-92D8-33C5AEC0FEC5', -- Entity: MoreCheese: Organization Profiles
            1,
            'ID',
            'ID',
            NULL,
            'uniqueidentifier',
            16,
            0,
            0,
            0,
            'newsequentialid()',
            0,
            0,
            0,
            0,
            NULL,
            NULL,
            0,
            1,
            0,
            0,
            1,
            1,
            'Search',
            GETUTCDATE(),
            GETUTCDATE()
         )
      END;

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '51dd3ffc-e786-49e1-902d-f0589d67c50b' OR (EntityID = 'A820FA5A-520E-4058-92D8-33C5AEC0FEC5' AND Name = 'OrganizationID')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            '51dd3ffc-e786-49e1-902d-f0589d67c50b',
            'A820FA5A-520E-4058-92D8-33C5AEC0FEC5', -- Entity: MoreCheese: Organization Profiles
            2,
            'OrganizationID',
            'Organization ID',
            NULL,
            'uniqueidentifier',
            16,
            0,
            0,
            0,
            NULL,
            0,
            1,
            0,
            0,
            'C70448F9-9792-41D7-A82C-784B66429D54',
            'ID',
            0,
            0,
            1,
            0,
            0,
            0,
            'Search',
            GETUTCDATE(),
            GETUTCDATE()
         )
      END;

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '4b782ef4-2bae-432d-9e11-4958dc215a3f' OR (EntityID = 'A820FA5A-520E-4058-92D8-33C5AEC0FEC5' AND Name = 'OrgKey')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            '4b782ef4-2bae-432d-9e11-4958dc215a3f',
            'A820FA5A-520E-4058-92D8-33C5AEC0FEC5', -- Entity: MoreCheese: Organization Profiles
            3,
            'OrgKey',
            'Org Key',
            'Business key for the organization (e.g. ORG-0042); UUIDs derive from it',
            'nvarchar',
            100,
            0,
            0,
            0,
            NULL,
            0,
            1,
            0,
            0,
            NULL,
            NULL,
            0,
            0,
            0,
            0,
            0,
            1,
            'Search',
            GETUTCDATE(),
            GETUTCDATE()
         )
      END;

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = 'c2532faf-8510-45a6-8fd2-8517130efe57' OR (EntityID = 'A820FA5A-520E-4058-92D8-33C5AEC0FEC5' AND Name = 'Type')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            'c2532faf-8510-45a6-8fd2-8517130efe57',
            'A820FA5A-520E-4058-92D8-33C5AEC0FEC5', -- Entity: MoreCheese: Organization Profiles
            4,
            'Type',
            'Type',
            'What the organization does in the cheese world: Producer, Retailer, Supplier, or Educator',
            'nvarchar',
            100,
            0,
            0,
            0,
            NULL,
            0,
            1,
            0,
            0,
            NULL,
            NULL,
            0,
            0,
            0,
            0,
            0,
            0,
            'Search',
            GETUTCDATE(),
            GETUTCDATE()
         )
      END;

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '978c4eea-6e65-47c0-b2ff-8d41a5c85805' OR (EntityID = 'A820FA5A-520E-4058-92D8-33C5AEC0FEC5' AND Name = 'Region')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            '978c4eea-6e65-47c0-b2ff-8d41a5c85805',
            'A820FA5A-520E-4058-92D8-33C5AEC0FEC5', -- Entity: MoreCheese: Organization Profiles
            5,
            'Region',
            'Region',
            'Coarse geography bucket: NA, EU, or RoW',
            'nvarchar',
            100,
            0,
            0,
            0,
            NULL,
            0,
            1,
            0,
            0,
            NULL,
            NULL,
            0,
            0,
            0,
            0,
            0,
            0,
            'Search',
            GETUTCDATE(),
            GETUTCDATE()
         )
      END;

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = 'd4845f69-9cef-4e4a-8fff-f0793133079f' OR (EntityID = 'A820FA5A-520E-4058-92D8-33C5AEC0FEC5' AND Name = 'Country')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            'd4845f69-9cef-4e4a-8fff-f0793133079f',
            'A820FA5A-520E-4058-92D8-33C5AEC0FEC5', -- Entity: MoreCheese: Organization Profiles
            6,
            'Country',
            'Country',
            NULL,
            'nvarchar',
            4,
            0,
            0,
            1,
            NULL,
            0,
            1,
            0,
            0,
            NULL,
            NULL,
            0,
            0,
            0,
            0,
            0,
            0,
            'Search',
            GETUTCDATE(),
            GETUTCDATE()
         )
      END;

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = 'afc60647-8cce-472e-a17a-d7920671671c' OR (EntityID = 'A820FA5A-520E-4058-92D8-33C5AEC0FEC5' AND Name = 'CountryName')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            'afc60647-8cce-472e-a17a-d7920671671c',
            'A820FA5A-520E-4058-92D8-33C5AEC0FEC5', -- Entity: MoreCheese: Organization Profiles
            7,
            'CountryName',
            'Country Name',
            NULL,
            'nvarchar',
            200,
            0,
            0,
            1,
            NULL,
            0,
            1,
            0,
            0,
            NULL,
            NULL,
            0,
            0,
            0,
            0,
            0,
            0,
            'Search',
            GETUTCDATE(),
            GETUTCDATE()
         )
      END;

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '71ae7961-66d0-43ed-8adf-1a95b51b7e90' OR (EntityID = 'A820FA5A-520E-4058-92D8-33C5AEC0FEC5' AND Name = 'City')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            '71ae7961-66d0-43ed-8adf-1a95b51b7e90',
            'A820FA5A-520E-4058-92D8-33C5AEC0FEC5', -- Entity: MoreCheese: Organization Profiles
            8,
            'City',
            'City',
            'Headquarters city (real city, invented business name)',
            'nvarchar',
            200,
            0,
            0,
            0,
            NULL,
            0,
            1,
            0,
            0,
            NULL,
            NULL,
            0,
            0,
            0,
            0,
            0,
            0,
            'Search',
            GETUTCDATE(),
            GETUTCDATE()
         )
      END;

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '9bf77ca1-2784-4c72-a3c5-6847ca58ef28' OR (EntityID = 'A820FA5A-520E-4058-92D8-33C5AEC0FEC5' AND Name = 'State')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            '9bf77ca1-2784-4c72-a3c5-6847ca58ef28',
            'A820FA5A-520E-4058-92D8-33C5AEC0FEC5', -- Entity: MoreCheese: Organization Profiles
            9,
            'State',
            'State',
            'Headquarters state/country code',
            'nvarchar',
            100,
            0,
            0,
            0,
            NULL,
            0,
            1,
            0,
            0,
            NULL,
            NULL,
            0,
            0,
            0,
            0,
            0,
            0,
            'Search',
            GETUTCDATE(),
            GETUTCDATE()
         )
      END;

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '5f425cd9-794b-45fb-91a9-28899530e1fc' OR (EntityID = 'A820FA5A-520E-4058-92D8-33C5AEC0FEC5' AND Name = 'AddressLine1')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            '5f425cd9-794b-45fb-91a9-28899530e1fc',
            'A820FA5A-520E-4058-92D8-33C5AEC0FEC5', -- Entity: MoreCheese: Organization Profiles
            10,
            'AddressLine1',
            'Address Line 1',
            NULL,
            'nvarchar',
            400,
            0,
            0,
            1,
            NULL,
            0,
            1,
            0,
            0,
            NULL,
            NULL,
            0,
            0,
            0,
            0,
            0,
            0,
            'Search',
            GETUTCDATE(),
            GETUTCDATE()
         )
      END;

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = 'ebb000de-945b-4ce7-9ff1-a9ffb528feed' OR (EntityID = 'A820FA5A-520E-4058-92D8-33C5AEC0FEC5' AND Name = 'PostalCode')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            'ebb000de-945b-4ce7-9ff1-a9ffb528feed',
            'A820FA5A-520E-4058-92D8-33C5AEC0FEC5', -- Entity: MoreCheese: Organization Profiles
            11,
            'PostalCode',
            'Postal Code',
            NULL,
            'nvarchar',
            40,
            0,
            0,
            1,
            NULL,
            0,
            1,
            0,
            0,
            NULL,
            NULL,
            0,
            0,
            0,
            0,
            0,
            0,
            'Search',
            GETUTCDATE(),
            GETUTCDATE()
         )
      END;

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '2041ea01-efb7-4444-aa3d-37f6a068d3e4' OR (EntityID = 'A820FA5A-520E-4058-92D8-33C5AEC0FEC5' AND Name = 'Latitude')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            '2041ea01-efb7-4444-aa3d-37f6a068d3e4',
            'A820FA5A-520E-4058-92D8-33C5AEC0FEC5', -- Entity: MoreCheese: Organization Profiles
            12,
            'Latitude',
            'Latitude',
            'Headquarters latitude, pre-baked for the map (no live geocoding)',
            'decimal',
            5,
            9,
            6,
            0,
            NULL,
            0,
            1,
            0,
            0,
            NULL,
            NULL,
            0,
            0,
            0,
            0,
            0,
            0,
            'Search',
            GETUTCDATE(),
            GETUTCDATE()
         )
      END;

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '234346a0-73b4-4bc5-8792-26fdd52da29b' OR (EntityID = 'A820FA5A-520E-4058-92D8-33C5AEC0FEC5' AND Name = 'Longitude')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            '234346a0-73b4-4bc5-8792-26fdd52da29b',
            'A820FA5A-520E-4058-92D8-33C5AEC0FEC5', -- Entity: MoreCheese: Organization Profiles
            13,
            'Longitude',
            'Longitude',
            'Headquarters longitude, pre-baked for the map (no live geocoding)',
            'decimal',
            5,
            9,
            6,
            0,
            NULL,
            0,
            1,
            0,
            0,
            NULL,
            NULL,
            0,
            0,
            0,
            0,
            0,
            0,
            'Search',
            GETUTCDATE(),
            GETUTCDATE()
         )
      END;

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = 'c492f3f2-6891-49c9-a530-bafb4981029a' OR (EntityID = 'A820FA5A-520E-4058-92D8-33C5AEC0FEC5' AND Name = 'LifecycleEventKind')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            'c492f3f2-6891-49c9-a530-bafb4981029a',
            'A820FA5A-520E-4058-92D8-33C5AEC0FEC5', -- Entity: MoreCheese: Organization Profiles
            14,
            'LifecycleEventKind',
            'Lifecycle Event Kind',
            'The org-level shock, if any: Dissolved, Acquired, or ProgramCut — the driver behind employer-related churn',
            'nvarchar',
            100,
            0,
            0,
            1,
            NULL,
            0,
            1,
            0,
            0,
            NULL,
            NULL,
            0,
            0,
            0,
            0,
            0,
            0,
            'Search',
            GETUTCDATE(),
            GETUTCDATE()
         )
      END;

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = 'c84d997f-459a-412c-8f49-147cc39e7bf5' OR (EntityID = 'A820FA5A-520E-4058-92D8-33C5AEC0FEC5' AND Name = 'LifecycleEventYear')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            'c84d997f-459a-412c-8f49-147cc39e7bf5',
            'A820FA5A-520E-4058-92D8-33C5AEC0FEC5', -- Entity: MoreCheese: Organization Profiles
            15,
            'LifecycleEventYear',
            'Lifecycle Event Year',
            'Year the lifecycle event happened',
            'int',
            4,
            10,
            0,
            1,
            NULL,
            0,
            1,
            0,
            0,
            NULL,
            NULL,
            0,
            0,
            0,
            0,
            0,
            0,
            'Search',
            GETUTCDATE(),
            GETUTCDATE()
         )
      END;

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = 'dd164a6a-f4b5-4b7f-b34a-8647443c5aa6' OR (EntityID = 'A820FA5A-520E-4058-92D8-33C5AEC0FEC5' AND Name = 'IsSharedDemo')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            'dd164a6a-f4b5-4b7f-b34a-8647443c5aa6',
            'A820FA5A-520E-4058-92D8-33C5AEC0FEC5', -- Entity: MoreCheese: Organization Profiles
            16,
            'IsSharedDemo',
            'Is Shared Demo',
            'Marks generated shared-demo rows; the wipe-and-recreate boundary',
            'bit',
            1,
            1,
            0,
            0,
            '(1)',
            0,
            1,
            0,
            0,
            NULL,
            NULL,
            0,
            0,
            0,
            0,
            0,
            0,
            'Search',
            GETUTCDATE(),
            GETUTCDATE()
         )
      END;

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = 'e1f77699-a166-48b2-b243-32f616bd715f' OR (EntityID = 'A820FA5A-520E-4058-92D8-33C5AEC0FEC5' AND Name = '__mj_CreatedAt')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            'e1f77699-a166-48b2-b243-32f616bd715f',
            'A820FA5A-520E-4058-92D8-33C5AEC0FEC5', -- Entity: MoreCheese: Organization Profiles
            17,
            '__mj_CreatedAt',
            'Created At',
            NULL,
            'datetimeoffset',
            10,
            34,
            7,
            0,
            'getutcdate()',
            0,
            0,
            0,
            0,
            NULL,
            NULL,
            0,
            0,
            0,
            0,
            0,
            0,
            'Search',
            GETUTCDATE(),
            GETUTCDATE()
         )
      END;

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = 'c0561ccc-f07a-44f4-804b-99c968b198d8' OR (EntityID = 'A820FA5A-520E-4058-92D8-33C5AEC0FEC5' AND Name = '__mj_UpdatedAt')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            'c0561ccc-f07a-44f4-804b-99c968b198d8',
            'A820FA5A-520E-4058-92D8-33C5AEC0FEC5', -- Entity: MoreCheese: Organization Profiles
            18,
            '__mj_UpdatedAt',
            'Updated At',
            NULL,
            'datetimeoffset',
            10,
            34,
            7,
            0,
            'getutcdate()',
            0,
            0,
            0,
            0,
            NULL,
            NULL,
            0,
            0,
            0,
            0,
            0,
            0,
            'Search',
            GETUTCDATE(),
            GETUTCDATE()
         )
      END;
UPDATE [${mjSchema}].[EntityField]
         SET [Sequence] = [Sequence] + 100000
       WHERE [EntityID] = 'DCB0400A-EC0A-4551-BAEA-50B515C3C59C'
         AND [Sequence] < 100000
         AND NOT EXISTS (
             SELECT 1 FROM [${mjSchema}].[EntityField]
              WHERE [EntityID] = 'DCB0400A-EC0A-4551-BAEA-50B515C3C59C'
                AND [Sequence] >= 100000
         );

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '80b5ac0d-9184-4fea-b9db-5982798182e0' OR (EntityID = 'DCB0400A-EC0A-4551-BAEA-50B515C3C59C' AND Name = 'ID')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            '80b5ac0d-9184-4fea-b9db-5982798182e0',
            'DCB0400A-EC0A-4551-BAEA-50B515C3C59C', -- Entity: MoreCheese: Member Certifications
            1,
            'ID',
            'ID',
            NULL,
            'uniqueidentifier',
            16,
            0,
            0,
            0,
            'newsequentialid()',
            0,
            0,
            0,
            0,
            NULL,
            NULL,
            0,
            1,
            0,
            0,
            1,
            1,
            'Search',
            GETUTCDATE(),
            GETUTCDATE()
         )
      END;

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '82330e6d-dabc-4d69-8686-a1555b142162' OR (EntityID = 'DCB0400A-EC0A-4551-BAEA-50B515C3C59C' AND Name = 'MemberCertKey')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            '82330e6d-dabc-4d69-8686-a1555b142162',
            'DCB0400A-EC0A-4551-BAEA-50B515C3C59C', -- Entity: MoreCheese: Member Certifications
            2,
            'MemberCertKey',
            'Member Cert Key',
            NULL,
            'nvarchar',
            160,
            0,
            0,
            0,
            NULL,
            0,
            1,
            0,
            0,
            NULL,
            NULL,
            0,
            0,
            0,
            0,
            0,
            1,
            'Search',
            GETUTCDATE(),
            GETUTCDATE()
         )
      END;

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '13f9c927-b51e-4fa6-a34d-8c86b6035678' OR (EntityID = 'DCB0400A-EC0A-4551-BAEA-50B515C3C59C' AND Name = 'PersonID')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            '13f9c927-b51e-4fa6-a34d-8c86b6035678',
            'DCB0400A-EC0A-4551-BAEA-50B515C3C59C', -- Entity: MoreCheese: Member Certifications
            3,
            'PersonID',
            'Person ID',
            NULL,
            'uniqueidentifier',
            16,
            0,
            0,
            0,
            NULL,
            0,
            1,
            0,
            0,
            '7A94ADA9-7880-4FAE-97D8-DB0E934C3F5F',
            'ID',
            0,
            0,
            1,
            0,
            0,
            0,
            'Search',
            GETUTCDATE(),
            GETUTCDATE()
         )
      END;

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '2ec02bcb-8f76-4e3a-917c-19717e80c66c' OR (EntityID = 'DCB0400A-EC0A-4551-BAEA-50B515C3C59C' AND Name = 'CertificationID')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            '2ec02bcb-8f76-4e3a-917c-19717e80c66c',
            'DCB0400A-EC0A-4551-BAEA-50B515C3C59C', -- Entity: MoreCheese: Member Certifications
            4,
            'CertificationID',
            'Certification ID',
            NULL,
            'uniqueidentifier',
            16,
            0,
            0,
            0,
            NULL,
            0,
            1,
            0,
            0,
            '141E023A-18C1-4C84-962C-2BD1ABF0627F',
            'ID',
            0,
            0,
            1,
            0,
            0,
            0,
            'Search',
            GETUTCDATE(),
            GETUTCDATE()
         )
      END;

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = 'f1566a08-aac3-4bcf-9485-c52581550e2c' OR (EntityID = 'DCB0400A-EC0A-4551-BAEA-50B515C3C59C' AND Name = 'Status')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            'f1566a08-aac3-4bcf-9485-c52581550e2c',
            'DCB0400A-EC0A-4551-BAEA-50B515C3C59C', -- Entity: MoreCheese: Member Certifications
            5,
            'Status',
            'Status',
            'InProgress, Awarded, Expired, or Withdrawn',
            'nvarchar',
            100,
            0,
            0,
            0,
            NULL,
            0,
            1,
            0,
            0,
            NULL,
            NULL,
            0,
            0,
            0,
            0,
            0,
            0,
            'Search',
            GETUTCDATE(),
            GETUTCDATE()
         )
      END;

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '5a1428a4-d180-49b1-9bc3-30ab59d2369e' OR (EntityID = 'DCB0400A-EC0A-4551-BAEA-50B515C3C59C' AND Name = 'EnrolledOn')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            '5a1428a4-d180-49b1-9bc3-30ab59d2369e',
            'DCB0400A-EC0A-4551-BAEA-50B515C3C59C', -- Entity: MoreCheese: Member Certifications
            6,
            'EnrolledOn',
            'Enrolled On',
            NULL,
            'date',
            3,
            10,
            0,
            0,
            NULL,
            0,
            1,
            0,
            0,
            NULL,
            NULL,
            0,
            0,
            0,
            0,
            0,
            0,
            'Search',
            GETUTCDATE(),
            GETUTCDATE()
         )
      END;

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = 'ca4f7476-c656-4b9c-905b-9d9fbe37fad1' OR (EntityID = 'DCB0400A-EC0A-4551-BAEA-50B515C3C59C' AND Name = 'AwardedOn')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            'ca4f7476-c656-4b9c-905b-9d9fbe37fad1',
            'DCB0400A-EC0A-4551-BAEA-50B515C3C59C', -- Entity: MoreCheese: Member Certifications
            7,
            'AwardedOn',
            'Awarded On',
            NULL,
            'date',
            3,
            10,
            0,
            1,
            NULL,
            0,
            1,
            0,
            0,
            NULL,
            NULL,
            0,
            0,
            0,
            0,
            0,
            0,
            'Search',
            GETUTCDATE(),
            GETUTCDATE()
         )
      END;

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = 'acc21f63-98e7-434c-9757-9cb8e30e5edb' OR (EntityID = 'DCB0400A-EC0A-4551-BAEA-50B515C3C59C' AND Name = 'ExpiresOn')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            'acc21f63-98e7-434c-9757-9cb8e30e5edb',
            'DCB0400A-EC0A-4551-BAEA-50B515C3C59C', -- Entity: MoreCheese: Member Certifications
            8,
            'ExpiresOn',
            'Expires On',
            NULL,
            'date',
            3,
            10,
            0,
            1,
            NULL,
            0,
            1,
            0,
            0,
            NULL,
            NULL,
            0,
            0,
            0,
            0,
            0,
            0,
            'Search',
            GETUTCDATE(),
            GETUTCDATE()
         )
      END;

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = 'c851b949-8858-41dc-9326-0612c6a973e3' OR (EntityID = 'DCB0400A-EC0A-4551-BAEA-50B515C3C59C' AND Name = 'IsSharedDemo')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            'c851b949-8858-41dc-9326-0612c6a973e3',
            'DCB0400A-EC0A-4551-BAEA-50B515C3C59C', -- Entity: MoreCheese: Member Certifications
            9,
            'IsSharedDemo',
            'Is Shared Demo',
            NULL,
            'bit',
            1,
            1,
            0,
            0,
            '(1)',
            0,
            1,
            0,
            0,
            NULL,
            NULL,
            0,
            0,
            0,
            0,
            0,
            0,
            'Search',
            GETUTCDATE(),
            GETUTCDATE()
         )
      END;

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = 'f7d1578a-ab50-499b-a194-4a2993670373' OR (EntityID = 'DCB0400A-EC0A-4551-BAEA-50B515C3C59C' AND Name = '__mj_CreatedAt')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            'f7d1578a-ab50-499b-a194-4a2993670373',
            'DCB0400A-EC0A-4551-BAEA-50B515C3C59C', -- Entity: MoreCheese: Member Certifications
            10,
            '__mj_CreatedAt',
            'Created At',
            NULL,
            'datetimeoffset',
            10,
            34,
            7,
            0,
            'getutcdate()',
            0,
            0,
            0,
            0,
            NULL,
            NULL,
            0,
            0,
            0,
            0,
            0,
            0,
            'Search',
            GETUTCDATE(),
            GETUTCDATE()
         )
      END;

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = 'ec5ed4ab-d12f-4063-8dc1-90c254159578' OR (EntityID = 'DCB0400A-EC0A-4551-BAEA-50B515C3C59C' AND Name = '__mj_UpdatedAt')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            'ec5ed4ab-d12f-4063-8dc1-90c254159578',
            'DCB0400A-EC0A-4551-BAEA-50B515C3C59C', -- Entity: MoreCheese: Member Certifications
            11,
            '__mj_UpdatedAt',
            'Updated At',
            NULL,
            'datetimeoffset',
            10,
            34,
            7,
            0,
            'getutcdate()',
            0,
            0,
            0,
            0,
            NULL,
            NULL,
            0,
            0,
            0,
            0,
            0,
            0,
            'Search',
            GETUTCDATE(),
            GETUTCDATE()
         )
      END;
UPDATE [${mjSchema}].[EntityField]
         SET [Sequence] = [Sequence] + 100000
       WHERE [EntityID] = 'B8FBEFC1-9B31-4A45-A86B-71BA5D4FE3EC'
         AND [Sequence] < 100000
         AND NOT EXISTS (
             SELECT 1 FROM [${mjSchema}].[EntityField]
              WHERE [EntityID] = 'B8FBEFC1-9B31-4A45-A86B-71BA5D4FE3EC'
                AND [Sequence] >= 100000
         );

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '5bde77ae-0da9-4028-a122-45210f152b48' OR (EntityID = 'B8FBEFC1-9B31-4A45-A86B-71BA5D4FE3EC' AND Name = 'ID')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            '5bde77ae-0da9-4028-a122-45210f152b48',
            'B8FBEFC1-9B31-4A45-A86B-71BA5D4FE3EC', -- Entity: MoreCheese: Course Enrollments
            1,
            'ID',
            'ID',
            NULL,
            'uniqueidentifier',
            16,
            0,
            0,
            0,
            'newsequentialid()',
            0,
            0,
            0,
            0,
            NULL,
            NULL,
            0,
            1,
            0,
            0,
            1,
            1,
            'Search',
            GETUTCDATE(),
            GETUTCDATE()
         )
      END;

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = 'bb1e2110-0902-48d9-ad91-0564055ba2c0' OR (EntityID = 'B8FBEFC1-9B31-4A45-A86B-71BA5D4FE3EC' AND Name = 'EnrollKey')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            'bb1e2110-0902-48d9-ad91-0564055ba2c0',
            'B8FBEFC1-9B31-4A45-A86B-71BA5D4FE3EC', -- Entity: MoreCheese: Course Enrollments
            2,
            'EnrollKey',
            'Enroll Key',
            'Business key; UUIDs derive from it',
            'nvarchar',
            160,
            0,
            0,
            0,
            NULL,
            0,
            1,
            0,
            0,
            NULL,
            NULL,
            0,
            0,
            0,
            0,
            0,
            1,
            'Search',
            GETUTCDATE(),
            GETUTCDATE()
         )
      END;

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = 'fb431899-db6b-440e-a794-c89ee53ccd62' OR (EntityID = 'B8FBEFC1-9B31-4A45-A86B-71BA5D4FE3EC' AND Name = 'PersonID')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            'fb431899-db6b-440e-a794-c89ee53ccd62',
            'B8FBEFC1-9B31-4A45-A86B-71BA5D4FE3EC', -- Entity: MoreCheese: Course Enrollments
            3,
            'PersonID',
            'Person ID',
            NULL,
            'uniqueidentifier',
            16,
            0,
            0,
            0,
            NULL,
            0,
            1,
            0,
            0,
            '7A94ADA9-7880-4FAE-97D8-DB0E934C3F5F',
            'ID',
            0,
            0,
            1,
            0,
            0,
            0,
            'Search',
            GETUTCDATE(),
            GETUTCDATE()
         )
      END;

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '4a79b308-30c6-4958-a4e3-a8ea533718e1' OR (EntityID = 'B8FBEFC1-9B31-4A45-A86B-71BA5D4FE3EC' AND Name = 'CourseID')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            '4a79b308-30c6-4958-a4e3-a8ea533718e1',
            'B8FBEFC1-9B31-4A45-A86B-71BA5D4FE3EC', -- Entity: MoreCheese: Course Enrollments
            4,
            'CourseID',
            'Course ID',
            NULL,
            'uniqueidentifier',
            16,
            0,
            0,
            0,
            NULL,
            0,
            1,
            0,
            0,
            '63F9789F-C8CB-4573-91E6-DAF670C4D3B7',
            'ID',
            0,
            0,
            1,
            0,
            0,
            0,
            'Search',
            GETUTCDATE(),
            GETUTCDATE()
         )
      END;

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '71e0b928-23ed-45b0-a9bb-4d1ae8f82585' OR (EntityID = 'B8FBEFC1-9B31-4A45-A86B-71BA5D4FE3EC' AND Name = 'EnrolledOn')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            '71e0b928-23ed-45b0-a9bb-4d1ae8f82585',
            'B8FBEFC1-9B31-4A45-A86B-71BA5D4FE3EC', -- Entity: MoreCheese: Course Enrollments
            5,
            'EnrolledOn',
            'Enrolled On',
            'Enrollment date — always inside a valid membership window',
            'date',
            3,
            10,
            0,
            0,
            NULL,
            0,
            1,
            0,
            0,
            NULL,
            NULL,
            0,
            0,
            0,
            0,
            0,
            0,
            'Search',
            GETUTCDATE(),
            GETUTCDATE()
         )
      END;

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '7e8d65a1-5858-497b-bcef-6df19aee292c' OR (EntityID = 'B8FBEFC1-9B31-4A45-A86B-71BA5D4FE3EC' AND Name = 'Status')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            '7e8d65a1-5858-497b-bcef-6df19aee292c',
            'B8FBEFC1-9B31-4A45-A86B-71BA5D4FE3EC', -- Entity: MoreCheese: Course Enrollments
            6,
            'Status',
            'Status',
            'InProgress, Completed, or Dropped (completion is a calibrated outcome)',
            'nvarchar',
            100,
            0,
            0,
            0,
            NULL,
            0,
            1,
            0,
            0,
            NULL,
            NULL,
            0,
            0,
            0,
            0,
            0,
            0,
            'Search',
            GETUTCDATE(),
            GETUTCDATE()
         )
      END;

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = 'b2357810-4882-47ed-9798-3bab2e3ddb7b' OR (EntityID = 'B8FBEFC1-9B31-4A45-A86B-71BA5D4FE3EC' AND Name = 'CompletedOn')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            'b2357810-4882-47ed-9798-3bab2e3ddb7b',
            'B8FBEFC1-9B31-4A45-A86B-71BA5D4FE3EC', -- Entity: MoreCheese: Course Enrollments
            7,
            'CompletedOn',
            'Completed On',
            'Completion date when Status is Completed',
            'date',
            3,
            10,
            0,
            1,
            NULL,
            0,
            1,
            0,
            0,
            NULL,
            NULL,
            0,
            0,
            0,
            0,
            0,
            0,
            'Search',
            GETUTCDATE(),
            GETUTCDATE()
         )
      END;

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = 'd425aa8b-c288-4804-8838-3aae871d6989' OR (EntityID = 'B8FBEFC1-9B31-4A45-A86B-71BA5D4FE3EC' AND Name = 'IsSharedDemo')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            'd425aa8b-c288-4804-8838-3aae871d6989',
            'B8FBEFC1-9B31-4A45-A86B-71BA5D4FE3EC', -- Entity: MoreCheese: Course Enrollments
            8,
            'IsSharedDemo',
            'Is Shared Demo',
            'Marks generated shared-demo rows; the wipe-and-recreate boundary',
            'bit',
            1,
            1,
            0,
            0,
            '(1)',
            0,
            1,
            0,
            0,
            NULL,
            NULL,
            0,
            0,
            0,
            0,
            0,
            0,
            'Search',
            GETUTCDATE(),
            GETUTCDATE()
         )
      END;

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = 'b63a0504-dcca-415b-964d-31906350a2cf' OR (EntityID = 'B8FBEFC1-9B31-4A45-A86B-71BA5D4FE3EC' AND Name = '__mj_CreatedAt')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            'b63a0504-dcca-415b-964d-31906350a2cf',
            'B8FBEFC1-9B31-4A45-A86B-71BA5D4FE3EC', -- Entity: MoreCheese: Course Enrollments
            9,
            '__mj_CreatedAt',
            'Created At',
            NULL,
            'datetimeoffset',
            10,
            34,
            7,
            0,
            'getutcdate()',
            0,
            0,
            0,
            0,
            NULL,
            NULL,
            0,
            0,
            0,
            0,
            0,
            0,
            'Search',
            GETUTCDATE(),
            GETUTCDATE()
         )
      END;

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = 'a3ee444d-9b33-4c42-8f74-7f16db36bf3c' OR (EntityID = 'B8FBEFC1-9B31-4A45-A86B-71BA5D4FE3EC' AND Name = '__mj_UpdatedAt')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            'a3ee444d-9b33-4c42-8f74-7f16db36bf3c',
            'B8FBEFC1-9B31-4A45-A86B-71BA5D4FE3EC', -- Entity: MoreCheese: Course Enrollments
            10,
            '__mj_UpdatedAt',
            'Updated At',
            NULL,
            'datetimeoffset',
            10,
            34,
            7,
            0,
            'getutcdate()',
            0,
            0,
            0,
            0,
            NULL,
            NULL,
            0,
            0,
            0,
            0,
            0,
            0,
            'Search',
            GETUTCDATE(),
            GETUTCDATE()
         )
      END;
UPDATE [${mjSchema}].[EntityField]
         SET [Sequence] = [Sequence] + 100000
       WHERE [EntityID] = 'DD32D132-F9BB-4FFB-87C2-839FBC1A7B7F'
         AND [Sequence] < 100000
         AND NOT EXISTS (
             SELECT 1 FROM [${mjSchema}].[EntityField]
              WHERE [EntityID] = 'DD32D132-F9BB-4FFB-87C2-839FBC1A7B7F'
                AND [Sequence] >= 100000
         );

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '2398199d-cb05-49f5-92c0-98b2a52897aa' OR (EntityID = 'DD32D132-F9BB-4FFB-87C2-839FBC1A7B7F' AND Name = 'ID')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            '2398199d-cb05-49f5-92c0-98b2a52897aa',
            'DD32D132-F9BB-4FFB-87C2-839FBC1A7B7F', -- Entity: MoreCheese: Events
            1,
            'ID',
            'ID',
            NULL,
            'uniqueidentifier',
            16,
            0,
            0,
            0,
            'newsequentialid()',
            0,
            0,
            0,
            0,
            NULL,
            NULL,
            0,
            1,
            0,
            0,
            1,
            1,
            'Search',
            GETUTCDATE(),
            GETUTCDATE()
         )
      END;

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '85ab3131-9bc7-4b57-999f-4c19e47f39c6' OR (EntityID = 'DD32D132-F9BB-4FFB-87C2-839FBC1A7B7F' AND Name = 'EventKey')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            '85ab3131-9bc7-4b57-999f-4c19e47f39c6',
            'DD32D132-F9BB-4FFB-87C2-839FBC1A7B7F', -- Entity: MoreCheese: Events
            2,
            'EventKey',
            'Event Key',
            'Business key (e.g. EVT-2025-CONF); UUIDs derive from it',
            'nvarchar',
            100,
            0,
            0,
            0,
            NULL,
            0,
            1,
            0,
            0,
            NULL,
            NULL,
            0,
            0,
            0,
            0,
            0,
            1,
            'Search',
            GETUTCDATE(),
            GETUTCDATE()
         )
      END;

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = 'e0c4ea1a-5451-43e7-8f25-4ebe31723ddd' OR (EntityID = 'DD32D132-F9BB-4FFB-87C2-839FBC1A7B7F' AND Name = 'Name')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            'e0c4ea1a-5451-43e7-8f25-4ebe31723ddd',
            'DD32D132-F9BB-4FFB-87C2-839FBC1A7B7F', -- Entity: MoreCheese: Events
            3,
            'Name',
            'Name',
            'Event display name',
            'nvarchar',
            400,
            0,
            0,
            0,
            NULL,
            0,
            1,
            0,
            0,
            NULL,
            NULL,
            1,
            1,
            0,
            1,
            0,
            0,
            'Search',
            GETUTCDATE(),
            GETUTCDATE()
         )
      END;

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = 'ae2c88c6-67e7-4ee5-81e6-dde067b9d0d8' OR (EntityID = 'DD32D132-F9BB-4FFB-87C2-839FBC1A7B7F' AND Name = 'EventType')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            'ae2c88c6-67e7-4ee5-81e6-dde067b9d0d8',
            'DD32D132-F9BB-4FFB-87C2-839FBC1A7B7F', -- Entity: MoreCheese: Events
            4,
            'EventType',
            'Event Type',
            'Conference, Workshop, or Webinar',
            'nvarchar',
            100,
            0,
            0,
            0,
            NULL,
            0,
            1,
            0,
            0,
            NULL,
            NULL,
            0,
            0,
            0,
            0,
            0,
            0,
            'Search',
            GETUTCDATE(),
            GETUTCDATE()
         )
      END;

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = 'b005f583-2bc2-4a1d-965c-ee65148b9eaf' OR (EntityID = 'DD32D132-F9BB-4FFB-87C2-839FBC1A7B7F' AND Name = 'EventDate')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            'b005f583-2bc2-4a1d-965c-ee65148b9eaf',
            'DD32D132-F9BB-4FFB-87C2-839FBC1A7B7F', -- Entity: MoreCheese: Events
            5,
            'EventDate',
            'Event Date',
            'Date the event takes place',
            'date',
            3,
            10,
            0,
            0,
            NULL,
            0,
            1,
            0,
            0,
            NULL,
            NULL,
            0,
            0,
            0,
            0,
            0,
            0,
            'Search',
            GETUTCDATE(),
            GETUTCDATE()
         )
      END;

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '462476ef-c90a-413f-a488-13746b48f555' OR (EntityID = 'DD32D132-F9BB-4FFB-87C2-839FBC1A7B7F' AND Name = 'IsVirtual')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            '462476ef-c90a-413f-a488-13746b48f555',
            'DD32D132-F9BB-4FFB-87C2-839FBC1A7B7F', -- Entity: MoreCheese: Events
            6,
            'IsVirtual',
            'Is Virtual',
            'Virtual events have no venue coordinates (COVID-era conferences were virtual)',
            'bit',
            1,
            1,
            0,
            0,
            '(0)',
            0,
            1,
            0,
            0,
            NULL,
            NULL,
            0,
            0,
            0,
            0,
            0,
            0,
            'Search',
            GETUTCDATE(),
            GETUTCDATE()
         )
      END;

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = 'aebdfa88-7193-4e71-a25a-f059b2c39c4f' OR (EntityID = 'DD32D132-F9BB-4FFB-87C2-839FBC1A7B7F' AND Name = 'IsPaid')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            'aebdfa88-7193-4e71-a25a-f059b2c39c4f',
            'DD32D132-F9BB-4FFB-87C2-839FBC1A7B7F', -- Entity: MoreCheese: Events
            7,
            'IsPaid',
            'Is Paid',
            'Whether registration is billable (webinars are free)',
            'bit',
            1,
            1,
            0,
            0,
            '(0)',
            0,
            1,
            0,
            0,
            NULL,
            NULL,
            0,
            0,
            0,
            0,
            0,
            0,
            'Search',
            GETUTCDATE(),
            GETUTCDATE()
         )
      END;

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = 'aa946517-f296-4f62-a63c-a43788679c5c' OR (EntityID = 'DD32D132-F9BB-4FFB-87C2-839FBC1A7B7F' AND Name = 'City')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            'aa946517-f296-4f62-a63c-a43788679c5c',
            'DD32D132-F9BB-4FFB-87C2-839FBC1A7B7F', -- Entity: MoreCheese: Events
            8,
            'City',
            'City',
            'Venue city; NULL for virtual events',
            'nvarchar',
            200,
            0,
            0,
            1,
            NULL,
            0,
            1,
            0,
            0,
            NULL,
            NULL,
            0,
            0,
            0,
            0,
            0,
            0,
            'Search',
            GETUTCDATE(),
            GETUTCDATE()
         )
      END;

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '58fcd644-1df3-4d17-a3ad-b9a921fb3779' OR (EntityID = 'DD32D132-F9BB-4FFB-87C2-839FBC1A7B7F' AND Name = 'State')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            '58fcd644-1df3-4d17-a3ad-b9a921fb3779',
            'DD32D132-F9BB-4FFB-87C2-839FBC1A7B7F', -- Entity: MoreCheese: Events
            9,
            'State',
            'State',
            'Venue state; NULL for virtual events',
            'nvarchar',
            100,
            0,
            0,
            1,
            NULL,
            0,
            1,
            0,
            0,
            NULL,
            NULL,
            0,
            0,
            0,
            0,
            0,
            0,
            'Search',
            GETUTCDATE(),
            GETUTCDATE()
         )
      END;

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '4b2440ac-4b39-4cae-9d29-2426f95915ee' OR (EntityID = 'DD32D132-F9BB-4FFB-87C2-839FBC1A7B7F' AND Name = 'Latitude')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            '4b2440ac-4b39-4cae-9d29-2426f95915ee',
            'DD32D132-F9BB-4FFB-87C2-839FBC1A7B7F', -- Entity: MoreCheese: Events
            10,
            'Latitude',
            'Latitude',
            'Venue latitude for the events map; NULL for virtual',
            'decimal',
            5,
            9,
            6,
            1,
            NULL,
            0,
            1,
            0,
            0,
            NULL,
            NULL,
            0,
            0,
            0,
            0,
            0,
            0,
            'Search',
            GETUTCDATE(),
            GETUTCDATE()
         )
      END;

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = 'b3424b97-d1bf-4287-8e55-cf33c187b862' OR (EntityID = 'DD32D132-F9BB-4FFB-87C2-839FBC1A7B7F' AND Name = 'Longitude')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            'b3424b97-d1bf-4287-8e55-cf33c187b862',
            'DD32D132-F9BB-4FFB-87C2-839FBC1A7B7F', -- Entity: MoreCheese: Events
            11,
            'Longitude',
            'Longitude',
            'Venue longitude for the events map; NULL for virtual',
            'decimal',
            5,
            9,
            6,
            1,
            NULL,
            0,
            1,
            0,
            0,
            NULL,
            NULL,
            0,
            0,
            0,
            0,
            0,
            0,
            'Search',
            GETUTCDATE(),
            GETUTCDATE()
         )
      END;

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '1468c8b4-30c6-4de5-9806-46bc7e7858f8' OR (EntityID = 'DD32D132-F9BB-4FFB-87C2-839FBC1A7B7F' AND Name = 'IsSharedDemo')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            '1468c8b4-30c6-4de5-9806-46bc7e7858f8',
            'DD32D132-F9BB-4FFB-87C2-839FBC1A7B7F', -- Entity: MoreCheese: Events
            12,
            'IsSharedDemo',
            'Is Shared Demo',
            'Marks generated shared-demo rows; the wipe-and-recreate boundary',
            'bit',
            1,
            1,
            0,
            0,
            '(1)',
            0,
            1,
            0,
            0,
            NULL,
            NULL,
            0,
            0,
            0,
            0,
            0,
            0,
            'Search',
            GETUTCDATE(),
            GETUTCDATE()
         )
      END;

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '09a7311a-0f30-4eb5-bfd1-6939817b283c' OR (EntityID = 'DD32D132-F9BB-4FFB-87C2-839FBC1A7B7F' AND Name = '__mj_CreatedAt')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            '09a7311a-0f30-4eb5-bfd1-6939817b283c',
            'DD32D132-F9BB-4FFB-87C2-839FBC1A7B7F', -- Entity: MoreCheese: Events
            13,
            '__mj_CreatedAt',
            'Created At',
            NULL,
            'datetimeoffset',
            10,
            34,
            7,
            0,
            'getutcdate()',
            0,
            0,
            0,
            0,
            NULL,
            NULL,
            0,
            0,
            0,
            0,
            0,
            0,
            'Search',
            GETUTCDATE(),
            GETUTCDATE()
         )
      END;

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '6a8def47-8aa0-473f-8888-aed1560ec436' OR (EntityID = 'DD32D132-F9BB-4FFB-87C2-839FBC1A7B7F' AND Name = '__mj_UpdatedAt')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            '6a8def47-8aa0-473f-8888-aed1560ec436',
            'DD32D132-F9BB-4FFB-87C2-839FBC1A7B7F', -- Entity: MoreCheese: Events
            14,
            '__mj_UpdatedAt',
            'Updated At',
            NULL,
            'datetimeoffset',
            10,
            34,
            7,
            0,
            'getutcdate()',
            0,
            0,
            0,
            0,
            NULL,
            NULL,
            0,
            0,
            0,
            0,
            0,
            0,
            'Search',
            GETUTCDATE(),
            GETUTCDATE()
         )
      END;
UPDATE [${mjSchema}].[EntityField]
         SET [Sequence] = [Sequence] + 100000
       WHERE [EntityID] = 'CD3EBECE-BFBE-485C-8FF4-8744A030FE07'
         AND [Sequence] < 100000
         AND NOT EXISTS (
             SELECT 1 FROM [${mjSchema}].[EntityField]
              WHERE [EntityID] = 'CD3EBECE-BFBE-485C-8FF4-8744A030FE07'
                AND [Sequence] >= 100000
         );

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = 'fccdb295-4fd0-4faf-992d-e6d9936321e1' OR (EntityID = 'CD3EBECE-BFBE-485C-8FF4-8744A030FE07' AND Name = 'ID')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            'fccdb295-4fd0-4faf-992d-e6d9936321e1',
            'CD3EBECE-BFBE-485C-8FF4-8744A030FE07', -- Entity: MoreCheese: Event Registrations
            1,
            'ID',
            'ID',
            NULL,
            'uniqueidentifier',
            16,
            0,
            0,
            0,
            'newsequentialid()',
            0,
            0,
            0,
            0,
            NULL,
            NULL,
            0,
            1,
            0,
            0,
            1,
            1,
            'Search',
            GETUTCDATE(),
            GETUTCDATE()
         )
      END;

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = 'ab982980-723a-477f-9b2d-7f3654c3379f' OR (EntityID = 'CD3EBECE-BFBE-485C-8FF4-8744A030FE07' AND Name = 'RegKey')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            'ab982980-723a-477f-9b2d-7f3654c3379f',
            'CD3EBECE-BFBE-485C-8FF4-8744A030FE07', -- Entity: MoreCheese: Event Registrations
            2,
            'RegKey',
            'Reg Key',
            'Business key: REG-<member>-<event>[-n]; UUIDs derive from it',
            'nvarchar',
            240,
            0,
            0,
            0,
            NULL,
            0,
            1,
            0,
            0,
            NULL,
            NULL,
            0,
            0,
            0,
            0,
            0,
            1,
            'Search',
            GETUTCDATE(),
            GETUTCDATE()
         )
      END;

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = 'ffbe607f-1c69-40e4-905b-871162e0ef56' OR (EntityID = 'CD3EBECE-BFBE-485C-8FF4-8744A030FE07' AND Name = 'PersonID')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            'ffbe607f-1c69-40e4-905b-871162e0ef56',
            'CD3EBECE-BFBE-485C-8FF4-8744A030FE07', -- Entity: MoreCheese: Event Registrations
            3,
            'PersonID',
            'Person ID',
            NULL,
            'uniqueidentifier',
            16,
            0,
            0,
            0,
            NULL,
            0,
            1,
            0,
            0,
            '7A94ADA9-7880-4FAE-97D8-DB0E934C3F5F',
            'ID',
            0,
            0,
            1,
            0,
            0,
            0,
            'Search',
            GETUTCDATE(),
            GETUTCDATE()
         )
      END;

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '2a2646ef-3994-49df-bc16-a7fcf9b419fb' OR (EntityID = 'CD3EBECE-BFBE-485C-8FF4-8744A030FE07' AND Name = 'EventID')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            '2a2646ef-3994-49df-bc16-a7fcf9b419fb',
            'CD3EBECE-BFBE-485C-8FF4-8744A030FE07', -- Entity: MoreCheese: Event Registrations
            4,
            'EventID',
            'Event ID',
            NULL,
            'uniqueidentifier',
            16,
            0,
            0,
            0,
            NULL,
            0,
            1,
            0,
            0,
            'DD32D132-F9BB-4FFB-87C2-839FBC1A7B7F',
            'ID',
            0,
            0,
            1,
            0,
            0,
            0,
            'Search',
            GETUTCDATE(),
            GETUTCDATE()
         )
      END;

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '07f52f34-4c2d-4a8c-8832-f5f18c097207' OR (EntityID = 'CD3EBECE-BFBE-485C-8FF4-8744A030FE07' AND Name = 'RegisteredOn')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            '07f52f34-4c2d-4a8c-8832-f5f18c097207',
            'CD3EBECE-BFBE-485C-8FF4-8744A030FE07', -- Entity: MoreCheese: Event Registrations
            5,
            'RegisteredOn',
            'Registered On',
            'Registration date — always inside a valid membership window by construction',
            'date',
            3,
            10,
            0,
            0,
            NULL,
            0,
            1,
            0,
            0,
            NULL,
            NULL,
            0,
            0,
            0,
            0,
            0,
            0,
            'Search',
            GETUTCDATE(),
            GETUTCDATE()
         )
      END;

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = 'e35bcb1b-3348-405e-9ad1-7266bc505a6b' OR (EntityID = 'CD3EBECE-BFBE-485C-8FF4-8744A030FE07' AND Name = 'Attended')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            'e35bcb1b-3348-405e-9ad1-7266bc505a6b',
            'CD3EBECE-BFBE-485C-8FF4-8744A030FE07', -- Entity: MoreCheese: Event Registrations
            6,
            'Attended',
            'Attended',
            'Whether the member showed up; NULL means the event has not happened yet',
            'bit',
            1,
            1,
            0,
            1,
            NULL,
            0,
            1,
            0,
            0,
            NULL,
            NULL,
            0,
            0,
            0,
            0,
            0,
            0,
            'Search',
            GETUTCDATE(),
            GETUTCDATE()
         )
      END;

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = 'd3da72de-56b6-4653-9773-a672fd0aa942' OR (EntityID = 'CD3EBECE-BFBE-485C-8FF4-8744A030FE07' AND Name = 'IsSharedDemo')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            'd3da72de-56b6-4653-9773-a672fd0aa942',
            'CD3EBECE-BFBE-485C-8FF4-8744A030FE07', -- Entity: MoreCheese: Event Registrations
            7,
            'IsSharedDemo',
            'Is Shared Demo',
            'Marks generated shared-demo rows; the wipe-and-recreate boundary',
            'bit',
            1,
            1,
            0,
            0,
            '(1)',
            0,
            1,
            0,
            0,
            NULL,
            NULL,
            0,
            0,
            0,
            0,
            0,
            0,
            'Search',
            GETUTCDATE(),
            GETUTCDATE()
         )
      END;

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '3ffd4504-5897-47ef-a0bf-99b672db3e90' OR (EntityID = 'CD3EBECE-BFBE-485C-8FF4-8744A030FE07' AND Name = '__mj_CreatedAt')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            '3ffd4504-5897-47ef-a0bf-99b672db3e90',
            'CD3EBECE-BFBE-485C-8FF4-8744A030FE07', -- Entity: MoreCheese: Event Registrations
            8,
            '__mj_CreatedAt',
            'Created At',
            NULL,
            'datetimeoffset',
            10,
            34,
            7,
            0,
            'getutcdate()',
            0,
            0,
            0,
            0,
            NULL,
            NULL,
            0,
            0,
            0,
            0,
            0,
            0,
            'Search',
            GETUTCDATE(),
            GETUTCDATE()
         )
      END;

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '5e10b4b1-bfc3-4dec-ba98-7b634dd79116' OR (EntityID = 'CD3EBECE-BFBE-485C-8FF4-8744A030FE07' AND Name = '__mj_UpdatedAt')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            '5e10b4b1-bfc3-4dec-ba98-7b634dd79116',
            'CD3EBECE-BFBE-485C-8FF4-8744A030FE07', -- Entity: MoreCheese: Event Registrations
            9,
            '__mj_UpdatedAt',
            'Updated At',
            NULL,
            'datetimeoffset',
            10,
            34,
            7,
            0,
            'getutcdate()',
            0,
            0,
            0,
            0,
            NULL,
            NULL,
            0,
            0,
            0,
            0,
            0,
            0,
            'Search',
            GETUTCDATE(),
            GETUTCDATE()
         )
      END;
UPDATE [${mjSchema}].[EntityField]
         SET [Sequence] = [Sequence] + 100000
       WHERE [EntityID] = 'A39CF933-ACC1-4178-8BBA-8B2B02BB40F5'
         AND [Sequence] < 100000
         AND NOT EXISTS (
             SELECT 1 FROM [${mjSchema}].[EntityField]
              WHERE [EntityID] = 'A39CF933-ACC1-4178-8BBA-8B2B02BB40F5'
                AND [Sequence] >= 100000
         );

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '7dfe6f9e-7004-4589-8176-95753d3a5e04' OR (EntityID = 'A39CF933-ACC1-4178-8BBA-8B2B02BB40F5' AND Name = 'ID')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            '7dfe6f9e-7004-4589-8176-95753d3a5e04',
            'A39CF933-ACC1-4178-8BBA-8B2B02BB40F5', -- Entity: MoreCheese: Advocacy Actions
            1,
            'ID',
            'ID',
            NULL,
            'uniqueidentifier',
            16,
            0,
            0,
            0,
            'newsequentialid()',
            0,
            0,
            0,
            0,
            NULL,
            NULL,
            0,
            1,
            0,
            0,
            1,
            1,
            'Search',
            GETUTCDATE(),
            GETUTCDATE()
         )
      END;

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '3e335b74-0d8f-408d-91d4-0540690bb9b5' OR (EntityID = 'A39CF933-ACC1-4178-8BBA-8B2B02BB40F5' AND Name = 'ActionKey')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            '3e335b74-0d8f-408d-91d4-0540690bb9b5',
            'A39CF933-ACC1-4178-8BBA-8B2B02BB40F5', -- Entity: MoreCheese: Advocacy Actions
            2,
            'ActionKey',
            'Action Key',
            NULL,
            'nvarchar',
            160,
            0,
            0,
            0,
            NULL,
            0,
            1,
            0,
            0,
            NULL,
            NULL,
            0,
            0,
            0,
            0,
            0,
            1,
            'Search',
            GETUTCDATE(),
            GETUTCDATE()
         )
      END;

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '5f22645f-1907-4046-88d7-c46c66b38ac7' OR (EntityID = 'A39CF933-ACC1-4178-8BBA-8B2B02BB40F5' AND Name = 'PersonID')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            '5f22645f-1907-4046-88d7-c46c66b38ac7',
            'A39CF933-ACC1-4178-8BBA-8B2B02BB40F5', -- Entity: MoreCheese: Advocacy Actions
            3,
            'PersonID',
            'Person ID',
            NULL,
            'uniqueidentifier',
            16,
            0,
            0,
            0,
            NULL,
            0,
            1,
            0,
            0,
            '7A94ADA9-7880-4FAE-97D8-DB0E934C3F5F',
            'ID',
            0,
            0,
            1,
            0,
            0,
            0,
            'Search',
            GETUTCDATE(),
            GETUTCDATE()
         )
      END;

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = 'b2aa6175-2959-4630-a853-60baac40c4df' OR (EntityID = 'A39CF933-ACC1-4178-8BBA-8B2B02BB40F5' AND Name = 'ActionDate')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            'b2aa6175-2959-4630-a853-60baac40c4df',
            'A39CF933-ACC1-4178-8BBA-8B2B02BB40F5', -- Entity: MoreCheese: Advocacy Actions
            4,
            'ActionDate',
            'Action Date',
            NULL,
            'date',
            3,
            10,
            0,
            0,
            NULL,
            0,
            1,
            0,
            0,
            NULL,
            NULL,
            0,
            0,
            0,
            0,
            0,
            0,
            'Search',
            GETUTCDATE(),
            GETUTCDATE()
         )
      END;

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '2f2a4e1e-dc13-4602-ab6b-2149c909dd04' OR (EntityID = 'A39CF933-ACC1-4178-8BBA-8B2B02BB40F5' AND Name = 'Kind')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            '2f2a4e1e-dc13-4602-ab6b-2149c909dd04',
            'A39CF933-ACC1-4178-8BBA-8B2B02BB40F5', -- Entity: MoreCheese: Advocacy Actions
            5,
            'Kind',
            'Kind',
            'LetterCampaign, PetitionSignature, Testimony, or CoalitionMeeting',
            'nvarchar',
            100,
            0,
            0,
            0,
            NULL,
            0,
            1,
            0,
            0,
            NULL,
            NULL,
            0,
            0,
            0,
            0,
            0,
            0,
            'Search',
            GETUTCDATE(),
            GETUTCDATE()
         )
      END;

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '4ad7d467-2c4b-4fef-ad5f-0bc2d964abc1' OR (EntityID = 'A39CF933-ACC1-4178-8BBA-8B2B02BB40F5' AND Name = 'Topic')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            '4ad7d467-2c4b-4fef-ad5f-0bc2d964abc1',
            'A39CF933-ACC1-4178-8BBA-8B2B02BB40F5', -- Entity: MoreCheese: Advocacy Actions
            6,
            'Topic',
            'Topic',
            NULL,
            'nvarchar',
            400,
            0,
            0,
            0,
            NULL,
            0,
            1,
            0,
            0,
            NULL,
            NULL,
            0,
            0,
            0,
            0,
            0,
            0,
            'Search',
            GETUTCDATE(),
            GETUTCDATE()
         )
      END;

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = 'e57df045-46f1-4372-8dbe-e8eb0d0894f6' OR (EntityID = 'A39CF933-ACC1-4178-8BBA-8B2B02BB40F5' AND Name = 'IsSharedDemo')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            'e57df045-46f1-4372-8dbe-e8eb0d0894f6',
            'A39CF933-ACC1-4178-8BBA-8B2B02BB40F5', -- Entity: MoreCheese: Advocacy Actions
            7,
            'IsSharedDemo',
            'Is Shared Demo',
            NULL,
            'bit',
            1,
            1,
            0,
            0,
            '(1)',
            0,
            1,
            0,
            0,
            NULL,
            NULL,
            0,
            0,
            0,
            0,
            0,
            0,
            'Search',
            GETUTCDATE(),
            GETUTCDATE()
         )
      END;

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '85f51e14-8924-4682-a52c-6705d46b0733' OR (EntityID = 'A39CF933-ACC1-4178-8BBA-8B2B02BB40F5' AND Name = '__mj_CreatedAt')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            '85f51e14-8924-4682-a52c-6705d46b0733',
            'A39CF933-ACC1-4178-8BBA-8B2B02BB40F5', -- Entity: MoreCheese: Advocacy Actions
            8,
            '__mj_CreatedAt',
            'Created At',
            NULL,
            'datetimeoffset',
            10,
            34,
            7,
            0,
            'getutcdate()',
            0,
            0,
            0,
            0,
            NULL,
            NULL,
            0,
            0,
            0,
            0,
            0,
            0,
            'Search',
            GETUTCDATE(),
            GETUTCDATE()
         )
      END;

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '9f224773-7ef2-4faa-9218-bb1badcb6aa1' OR (EntityID = 'A39CF933-ACC1-4178-8BBA-8B2B02BB40F5' AND Name = '__mj_UpdatedAt')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            '9f224773-7ef2-4faa-9218-bb1badcb6aa1',
            'A39CF933-ACC1-4178-8BBA-8B2B02BB40F5', -- Entity: MoreCheese: Advocacy Actions
            9,
            '__mj_UpdatedAt',
            'Updated At',
            NULL,
            'datetimeoffset',
            10,
            34,
            7,
            0,
            'getutcdate()',
            0,
            0,
            0,
            0,
            NULL,
            NULL,
            0,
            0,
            0,
            0,
            0,
            0,
            'Search',
            GETUTCDATE(),
            GETUTCDATE()
         )
      END;
UPDATE [${mjSchema}].[EntityField]
         SET [Sequence] = [Sequence] + 100000
       WHERE [EntityID] = '2F328DE1-F9F5-402D-B085-AC41EBDE9F77'
         AND [Sequence] < 100000
         AND NOT EXISTS (
             SELECT 1 FROM [${mjSchema}].[EntityField]
              WHERE [EntityID] = '2F328DE1-F9F5-402D-B085-AC41EBDE9F77'
                AND [Sequence] >= 100000
         );

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '5b05eea4-ed02-4f52-a299-24656278fc28' OR (EntityID = '2F328DE1-F9F5-402D-B085-AC41EBDE9F77' AND Name = 'ID')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            '5b05eea4-ed02-4f52-a299-24656278fc28',
            '2F328DE1-F9F5-402D-B085-AC41EBDE9F77', -- Entity: MoreCheese: Competition Entries
            1,
            'ID',
            'ID',
            NULL,
            'uniqueidentifier',
            16,
            0,
            0,
            0,
            'newsequentialid()',
            0,
            0,
            0,
            0,
            NULL,
            NULL,
            0,
            1,
            0,
            0,
            1,
            1,
            'Search',
            GETUTCDATE(),
            GETUTCDATE()
         )
      END;

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '503079ce-bcd9-4078-a31b-c145a38ea971' OR (EntityID = '2F328DE1-F9F5-402D-B085-AC41EBDE9F77' AND Name = 'EntryKey')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            '503079ce-bcd9-4078-a31b-c145a38ea971',
            '2F328DE1-F9F5-402D-B085-AC41EBDE9F77', -- Entity: MoreCheese: Competition Entries
            2,
            'EntryKey',
            'Entry Key',
            NULL,
            'nvarchar',
            160,
            0,
            0,
            0,
            NULL,
            0,
            1,
            0,
            0,
            NULL,
            NULL,
            0,
            0,
            0,
            0,
            0,
            1,
            'Search',
            GETUTCDATE(),
            GETUTCDATE()
         )
      END;

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '7c41f425-787f-4150-bd51-22f030baab5d' OR (EntityID = '2F328DE1-F9F5-402D-B085-AC41EBDE9F77' AND Name = 'PersonID')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            '7c41f425-787f-4150-bd51-22f030baab5d',
            '2F328DE1-F9F5-402D-B085-AC41EBDE9F77', -- Entity: MoreCheese: Competition Entries
            3,
            'PersonID',
            'Person ID',
            NULL,
            'uniqueidentifier',
            16,
            0,
            0,
            0,
            NULL,
            0,
            1,
            0,
            0,
            '7A94ADA9-7880-4FAE-97D8-DB0E934C3F5F',
            'ID',
            0,
            0,
            1,
            0,
            0,
            0,
            'Search',
            GETUTCDATE(),
            GETUTCDATE()
         )
      END;

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '8c85faf9-4548-4418-b3fd-774efbaa970c' OR (EntityID = '2F328DE1-F9F5-402D-B085-AC41EBDE9F77' AND Name = 'OrganizationID')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            '8c85faf9-4548-4418-b3fd-774efbaa970c',
            '2F328DE1-F9F5-402D-B085-AC41EBDE9F77', -- Entity: MoreCheese: Competition Entries
            4,
            'OrganizationID',
            'Organization ID',
            NULL,
            'uniqueidentifier',
            16,
            0,
            0,
            1,
            NULL,
            0,
            1,
            0,
            0,
            'C70448F9-9792-41D7-A82C-784B66429D54',
            'ID',
            0,
            0,
            1,
            0,
            0,
            0,
            'Search',
            GETUTCDATE(),
            GETUTCDATE()
         )
      END;

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '622d3c4f-84d3-404d-8d25-f2fe41bb3a16' OR (EntityID = '2F328DE1-F9F5-402D-B085-AC41EBDE9F77' AND Name = 'EntryYear')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            '622d3c4f-84d3-404d-8d25-f2fe41bb3a16',
            '2F328DE1-F9F5-402D-B085-AC41EBDE9F77', -- Entity: MoreCheese: Competition Entries
            5,
            'EntryYear',
            'Entry Year',
            NULL,
            'int',
            4,
            10,
            0,
            0,
            NULL,
            0,
            1,
            0,
            0,
            NULL,
            NULL,
            0,
            0,
            0,
            0,
            0,
            0,
            'Search',
            GETUTCDATE(),
            GETUTCDATE()
         )
      END;

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '83fbf1a5-b4f5-432d-8c2a-2b8535eb48f2' OR (EntityID = '2F328DE1-F9F5-402D-B085-AC41EBDE9F77' AND Name = 'Category')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            '83fbf1a5-b4f5-432d-8c2a-2b8535eb48f2',
            '2F328DE1-F9F5-402D-B085-AC41EBDE9F77', -- Entity: MoreCheese: Competition Entries
            6,
            'Category',
            'Category',
            'Competition category (e.g. Alpine Styles, Soft-Ripened)',
            'nvarchar',
            200,
            0,
            0,
            0,
            NULL,
            0,
            1,
            0,
            0,
            NULL,
            NULL,
            0,
            0,
            0,
            0,
            0,
            0,
            'Search',
            GETUTCDATE(),
            GETUTCDATE()
         )
      END;

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '786c4021-88d8-4a9e-be0b-bc4e0defb238' OR (EntityID = '2F328DE1-F9F5-402D-B085-AC41EBDE9F77' AND Name = 'ProductName')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            '786c4021-88d8-4a9e-be0b-bc4e0defb238',
            '2F328DE1-F9F5-402D-B085-AC41EBDE9F77', -- Entity: MoreCheese: Competition Entries
            7,
            'ProductName',
            'Product Name',
            'The entered cheese (invented product names from the cleared bank components)',
            'nvarchar',
            400,
            0,
            0,
            0,
            NULL,
            0,
            1,
            0,
            0,
            NULL,
            NULL,
            0,
            0,
            0,
            0,
            0,
            0,
            'Search',
            GETUTCDATE(),
            GETUTCDATE()
         )
      END;

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '07e777d4-1bf8-473a-aabf-e9a3da6db4f0' OR (EntityID = '2F328DE1-F9F5-402D-B085-AC41EBDE9F77' AND Name = 'Result')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            '07e777d4-1bf8-473a-aabf-e9a3da6db4f0',
            '2F328DE1-F9F5-402D-B085-AC41EBDE9F77', -- Entity: MoreCheese: Competition Entries
            8,
            'Result',
            'Result',
            'Gold, Silver, Bronze, or None',
            'nvarchar',
            100,
            0,
            0,
            0,
            'None',
            0,
            1,
            0,
            0,
            NULL,
            NULL,
            0,
            0,
            0,
            0,
            0,
            0,
            'Search',
            GETUTCDATE(),
            GETUTCDATE()
         )
      END;

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '8474b7e9-1143-4608-8327-815679f0a341' OR (EntityID = '2F328DE1-F9F5-402D-B085-AC41EBDE9F77' AND Name = 'IsSharedDemo')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            '8474b7e9-1143-4608-8327-815679f0a341',
            '2F328DE1-F9F5-402D-B085-AC41EBDE9F77', -- Entity: MoreCheese: Competition Entries
            9,
            'IsSharedDemo',
            'Is Shared Demo',
            NULL,
            'bit',
            1,
            1,
            0,
            0,
            '(1)',
            0,
            1,
            0,
            0,
            NULL,
            NULL,
            0,
            0,
            0,
            0,
            0,
            0,
            'Search',
            GETUTCDATE(),
            GETUTCDATE()
         )
      END;

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '4e9a09ba-6971-4dfb-af9c-d8915eed709e' OR (EntityID = '2F328DE1-F9F5-402D-B085-AC41EBDE9F77' AND Name = '__mj_CreatedAt')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            '4e9a09ba-6971-4dfb-af9c-d8915eed709e',
            '2F328DE1-F9F5-402D-B085-AC41EBDE9F77', -- Entity: MoreCheese: Competition Entries
            10,
            '__mj_CreatedAt',
            'Created At',
            NULL,
            'datetimeoffset',
            10,
            34,
            7,
            0,
            'getutcdate()',
            0,
            0,
            0,
            0,
            NULL,
            NULL,
            0,
            0,
            0,
            0,
            0,
            0,
            'Search',
            GETUTCDATE(),
            GETUTCDATE()
         )
      END;

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = 'f32a33cc-f1ac-48cf-ac0a-15ad0a740b8a' OR (EntityID = '2F328DE1-F9F5-402D-B085-AC41EBDE9F77' AND Name = '__mj_UpdatedAt')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            'f32a33cc-f1ac-48cf-ac0a-15ad0a740b8a',
            '2F328DE1-F9F5-402D-B085-AC41EBDE9F77', -- Entity: MoreCheese: Competition Entries
            11,
            '__mj_UpdatedAt',
            'Updated At',
            NULL,
            'datetimeoffset',
            10,
            34,
            7,
            0,
            'getutcdate()',
            0,
            0,
            0,
            0,
            NULL,
            NULL,
            0,
            0,
            0,
            0,
            0,
            0,
            'Search',
            GETUTCDATE(),
            GETUTCDATE()
         )
      END;
UPDATE [${mjSchema}].[EntityField]
         SET [Sequence] = [Sequence] + 100000
       WHERE [EntityID] = '70C724C9-B518-4D81-81B0-BE7F4962B63A'
         AND [Sequence] < 100000
         AND NOT EXISTS (
             SELECT 1 FROM [${mjSchema}].[EntityField]
              WHERE [EntityID] = '70C724C9-B518-4D81-81B0-BE7F4962B63A'
                AND [Sequence] >= 100000
         );

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '8e025d39-c217-41fb-b99e-67dd00a438b3' OR (EntityID = '70C724C9-B518-4D81-81B0-BE7F4962B63A' AND Name = 'ID')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            '8e025d39-c217-41fb-b99e-67dd00a438b3',
            '70C724C9-B518-4D81-81B0-BE7F4962B63A', -- Entity: MoreCheese: Member Profiles
            1,
            'ID',
            'ID',
            NULL,
            'uniqueidentifier',
            16,
            0,
            0,
            0,
            'newsequentialid()',
            0,
            0,
            0,
            0,
            NULL,
            NULL,
            0,
            1,
            0,
            0,
            1,
            1,
            'Search',
            GETUTCDATE(),
            GETUTCDATE()
         )
      END;

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = 'f05fe60f-083c-48c1-9f86-97b21710a48e' OR (EntityID = '70C724C9-B518-4D81-81B0-BE7F4962B63A' AND Name = 'PersonID')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            'f05fe60f-083c-48c1-9f86-97b21710a48e',
            '70C724C9-B518-4D81-81B0-BE7F4962B63A', -- Entity: MoreCheese: Member Profiles
            2,
            'PersonID',
            'Person ID',
            NULL,
            'uniqueidentifier',
            16,
            0,
            0,
            0,
            NULL,
            0,
            1,
            0,
            0,
            '7A94ADA9-7880-4FAE-97D8-DB0E934C3F5F',
            'ID',
            0,
            0,
            1,
            0,
            0,
            0,
            'Search',
            GETUTCDATE(),
            GETUTCDATE()
         )
      END;

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = 'dcc3a015-251a-41c5-9242-9f228d457d1e' OR (EntityID = '70C724C9-B518-4D81-81B0-BE7F4962B63A' AND Name = 'OrganizationID')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            'dcc3a015-251a-41c5-9242-9f228d457d1e',
            '70C724C9-B518-4D81-81B0-BE7F4962B63A', -- Entity: MoreCheese: Member Profiles
            3,
            'OrganizationID',
            'Organization ID',
            NULL,
            'uniqueidentifier',
            16,
            0,
            0,
            1,
            NULL,
            0,
            1,
            0,
            0,
            'C70448F9-9792-41D7-A82C-784B66429D54',
            'ID',
            0,
            0,
            1,
            0,
            0,
            0,
            'Search',
            GETUTCDATE(),
            GETUTCDATE()
         )
      END;

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = 'c056444f-8753-477e-a909-86ac160e8cdf' OR (EntityID = '70C724C9-B518-4D81-81B0-BE7F4962B63A' AND Name = 'MemberNumber')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            'c056444f-8753-477e-a909-86ac160e8cdf',
            '70C724C9-B518-4D81-81B0-BE7F4962B63A', -- Entity: MoreCheese: Member Profiles
            4,
            'MemberNumber',
            'Member Number',
            'Business key for the member (e.g. ICF-100217); UUIDs derive from it',
            'nvarchar',
            100,
            0,
            0,
            0,
            NULL,
            0,
            1,
            0,
            0,
            NULL,
            NULL,
            0,
            0,
            0,
            0,
            0,
            1,
            'Search',
            GETUTCDATE(),
            GETUTCDATE()
         )
      END;

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = 'ceae0d08-1c23-4ab9-862b-7720fef292e7' OR (EntityID = '70C724C9-B518-4D81-81B0-BE7F4962B63A' AND Name = 'Segment')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            'ceae0d08-1c23-4ab9-862b-7720fef292e7',
            '70C724C9-B518-4D81-81B0-BE7F4962B63A', -- Entity: MoreCheese: Member Profiles
            5,
            'Segment',
            'Segment',
            'Professional segment: Producer, Retailer, Supplier, Educator, or Enthusiast',
            'nvarchar',
            100,
            0,
            0,
            0,
            NULL,
            0,
            1,
            0,
            0,
            NULL,
            NULL,
            0,
            0,
            0,
            0,
            0,
            0,
            'Search',
            GETUTCDATE(),
            GETUTCDATE()
         )
      END;

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '28126800-5a2f-4de4-9907-9bd4cfe38f2e' OR (EntityID = '70C724C9-B518-4D81-81B0-BE7F4962B63A' AND Name = 'Region')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            '28126800-5a2f-4de4-9907-9bd4cfe38f2e',
            '70C724C9-B518-4D81-81B0-BE7F4962B63A', -- Entity: MoreCheese: Member Profiles
            6,
            'Region',
            'Region',
            'Coarse geography bucket: NA, EU, or RoW',
            'nvarchar',
            100,
            0,
            0,
            0,
            NULL,
            0,
            1,
            0,
            0,
            NULL,
            NULL,
            0,
            0,
            0,
            0,
            0,
            0,
            'Search',
            GETUTCDATE(),
            GETUTCDATE()
         )
      END;

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '31563f0f-7d00-46b9-aca5-361c52b206ac' OR (EntityID = '70C724C9-B518-4D81-81B0-BE7F4962B63A' AND Name = 'Country')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            '31563f0f-7d00-46b9-aca5-361c52b206ac',
            '70C724C9-B518-4D81-81B0-BE7F4962B63A', -- Entity: MoreCheese: Member Profiles
            7,
            'Country',
            'Country',
            NULL,
            'nvarchar',
            4,
            0,
            0,
            1,
            NULL,
            0,
            1,
            0,
            0,
            NULL,
            NULL,
            0,
            0,
            0,
            0,
            0,
            0,
            'Search',
            GETUTCDATE(),
            GETUTCDATE()
         )
      END;

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '21b34de0-0baa-4614-87fe-30f9c8c191f4' OR (EntityID = '70C724C9-B518-4D81-81B0-BE7F4962B63A' AND Name = 'CountryName')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            '21b34de0-0baa-4614-87fe-30f9c8c191f4',
            '70C724C9-B518-4D81-81B0-BE7F4962B63A', -- Entity: MoreCheese: Member Profiles
            8,
            'CountryName',
            'Country Name',
            NULL,
            'nvarchar',
            200,
            0,
            0,
            1,
            NULL,
            0,
            1,
            0,
            0,
            NULL,
            NULL,
            0,
            0,
            0,
            0,
            0,
            0,
            'Search',
            GETUTCDATE(),
            GETUTCDATE()
         )
      END;

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '7a9b530f-6263-4107-891e-cb7926307538' OR (EntityID = '70C724C9-B518-4D81-81B0-BE7F4962B63A' AND Name = 'City')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            '7a9b530f-6263-4107-891e-cb7926307538',
            '70C724C9-B518-4D81-81B0-BE7F4962B63A', -- Entity: MoreCheese: Member Profiles
            9,
            'City',
            'City',
            'Member city (real city; drives the member map)',
            'nvarchar',
            200,
            0,
            0,
            0,
            NULL,
            0,
            1,
            0,
            0,
            NULL,
            NULL,
            0,
            0,
            0,
            0,
            0,
            0,
            'Search',
            GETUTCDATE(),
            GETUTCDATE()
         )
      END;

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = 'ab949d39-8367-4520-a407-9dd8e090f87f' OR (EntityID = '70C724C9-B518-4D81-81B0-BE7F4962B63A' AND Name = 'State')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            'ab949d39-8367-4520-a407-9dd8e090f87f',
            '70C724C9-B518-4D81-81B0-BE7F4962B63A', -- Entity: MoreCheese: Member Profiles
            10,
            'State',
            'State',
            'Member state/country code',
            'nvarchar',
            100,
            0,
            0,
            0,
            NULL,
            0,
            1,
            0,
            0,
            NULL,
            NULL,
            0,
            0,
            0,
            0,
            0,
            0,
            'Search',
            GETUTCDATE(),
            GETUTCDATE()
         )
      END;

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '6876ade5-10dc-4cc5-b16f-95d7d64ad7d5' OR (EntityID = '70C724C9-B518-4D81-81B0-BE7F4962B63A' AND Name = 'AddressLine1')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            '6876ade5-10dc-4cc5-b16f-95d7d64ad7d5',
            '70C724C9-B518-4D81-81B0-BE7F4962B63A', -- Entity: MoreCheese: Member Profiles
            11,
            'AddressLine1',
            'Address Line 1',
            NULL,
            'nvarchar',
            400,
            0,
            0,
            1,
            NULL,
            0,
            1,
            0,
            0,
            NULL,
            NULL,
            0,
            0,
            0,
            0,
            0,
            0,
            'Search',
            GETUTCDATE(),
            GETUTCDATE()
         )
      END;

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = 'f224868c-0785-4fc7-9143-c2a075e741de' OR (EntityID = '70C724C9-B518-4D81-81B0-BE7F4962B63A' AND Name = 'AddressLine2')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            'f224868c-0785-4fc7-9143-c2a075e741de',
            '70C724C9-B518-4D81-81B0-BE7F4962B63A', -- Entity: MoreCheese: Member Profiles
            12,
            'AddressLine2',
            'Address Line 2',
            NULL,
            'nvarchar',
            400,
            0,
            0,
            1,
            NULL,
            0,
            1,
            0,
            0,
            NULL,
            NULL,
            0,
            0,
            0,
            0,
            0,
            0,
            'Search',
            GETUTCDATE(),
            GETUTCDATE()
         )
      END;

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '57dc1ab5-7f1e-4aa4-a94c-b3afc742c13c' OR (EntityID = '70C724C9-B518-4D81-81B0-BE7F4962B63A' AND Name = 'PostalCode')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            '57dc1ab5-7f1e-4aa4-a94c-b3afc742c13c',
            '70C724C9-B518-4D81-81B0-BE7F4962B63A', -- Entity: MoreCheese: Member Profiles
            13,
            'PostalCode',
            'Postal Code',
            NULL,
            'nvarchar',
            40,
            0,
            0,
            1,
            NULL,
            0,
            1,
            0,
            0,
            NULL,
            NULL,
            0,
            0,
            0,
            0,
            0,
            0,
            'Search',
            GETUTCDATE(),
            GETUTCDATE()
         )
      END;

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '769a7a33-03b5-4f7f-99a7-e8aa0c2a18ae' OR (EntityID = '70C724C9-B518-4D81-81B0-BE7F4962B63A' AND Name = 'Latitude')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            '769a7a33-03b5-4f7f-99a7-e8aa0c2a18ae',
            '70C724C9-B518-4D81-81B0-BE7F4962B63A', -- Entity: MoreCheese: Member Profiles
            14,
            'Latitude',
            'Latitude',
            'Member latitude, pre-baked for the map',
            'decimal',
            5,
            9,
            6,
            0,
            NULL,
            0,
            1,
            0,
            0,
            NULL,
            NULL,
            0,
            0,
            0,
            0,
            0,
            0,
            'Search',
            GETUTCDATE(),
            GETUTCDATE()
         )
      END;

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '2ba0db75-005c-4601-a1ae-a5571e3d6095' OR (EntityID = '70C724C9-B518-4D81-81B0-BE7F4962B63A' AND Name = 'Longitude')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            '2ba0db75-005c-4601-a1ae-a5571e3d6095',
            '70C724C9-B518-4D81-81B0-BE7F4962B63A', -- Entity: MoreCheese: Member Profiles
            15,
            'Longitude',
            'Longitude',
            'Member longitude, pre-baked for the map',
            'decimal',
            5,
            9,
            6,
            0,
            NULL,
            0,
            1,
            0,
            0,
            NULL,
            NULL,
            0,
            0,
            0,
            0,
            0,
            0,
            'Search',
            GETUTCDATE(),
            GETUTCDATE()
         )
      END;

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '48e77991-959b-46b3-8565-84f9126fdb7c' OR (EntityID = '70C724C9-B518-4D81-81B0-BE7F4962B63A' AND Name = 'JoinDate')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            '48e77991-959b-46b3-8565-84f9126fdb7c',
            '70C724C9-B518-4D81-81B0-BE7F4962B63A', -- Entity: MoreCheese: Member Profiles
            16,
            'JoinDate',
            'Join Date',
            'Date the member first joined the federation',
            'date',
            3,
            10,
            0,
            0,
            NULL,
            0,
            1,
            0,
            0,
            NULL,
            NULL,
            0,
            0,
            0,
            0,
            0,
            0,
            'Search',
            GETUTCDATE(),
            GETUTCDATE()
         )
      END;

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '001dde07-639a-471c-9f99-78b63d14b078' OR (EntityID = '70C724C9-B518-4D81-81B0-BE7F4962B63A' AND Name = 'RaceEthnicity')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            '001dde07-639a-471c-9f99-78b63d14b078',
            '70C724C9-B518-4D81-81B0-BE7F4962B63A', -- Entity: MoreCheese: Member Profiles
            17,
            'RaceEthnicity',
            'Race Ethnicity',
            NULL,
            'nvarchar',
            400,
            0,
            0,
            1,
            NULL,
            0,
            1,
            0,
            0,
            NULL,
            NULL,
            0,
            0,
            0,
            0,
            0,
            0,
            'Search',
            GETUTCDATE(),
            GETUTCDATE()
         )
      END;

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '3c3ec353-4e8a-463a-bea0-296d0c896d8e' OR (EntityID = '70C724C9-B518-4D81-81B0-BE7F4962B63A' AND Name = 'EthnicityHispanic')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            '3c3ec353-4e8a-463a-bea0-296d0c896d8e',
            '70C724C9-B518-4D81-81B0-BE7F4962B63A', -- Entity: MoreCheese: Member Profiles
            18,
            'EthnicityHispanic',
            'Ethnicity Hispanic',
            NULL,
            'nvarchar',
            60,
            0,
            0,
            1,
            NULL,
            0,
            1,
            0,
            0,
            NULL,
            NULL,
            0,
            0,
            0,
            0,
            0,
            0,
            'Search',
            GETUTCDATE(),
            GETUTCDATE()
         )
      END;

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '3a98b093-7682-4695-b909-18953705fb24' OR (EntityID = '70C724C9-B518-4D81-81B0-BE7F4962B63A' AND Name = 'PronounSet')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            '3a98b093-7682-4695-b909-18953705fb24',
            '70C724C9-B518-4D81-81B0-BE7F4962B63A', -- Entity: MoreCheese: Member Profiles
            19,
            'PronounSet',
            'Pronoun Set',
            NULL,
            'nvarchar',
            100,
            0,
            0,
            1,
            NULL,
            0,
            1,
            0,
            0,
            NULL,
            NULL,
            0,
            0,
            0,
            0,
            0,
            0,
            'Search',
            GETUTCDATE(),
            GETUTCDATE()
         )
      END;

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '63a2d970-02f0-4635-83c2-7ee1559c6012' OR (EntityID = '70C724C9-B518-4D81-81B0-BE7F4962B63A' AND Name = 'PrimaryLanguage')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            '63a2d970-02f0-4635-83c2-7ee1559c6012',
            '70C724C9-B518-4D81-81B0-BE7F4962B63A', -- Entity: MoreCheese: Member Profiles
            20,
            'PrimaryLanguage',
            'Primary Language',
            NULL,
            'nvarchar',
            100,
            0,
            0,
            1,
            NULL,
            0,
            1,
            0,
            0,
            NULL,
            NULL,
            0,
            0,
            0,
            0,
            0,
            0,
            'Search',
            GETUTCDATE(),
            GETUTCDATE()
         )
      END;

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '520209db-e726-48be-b304-623f99a8d38d' OR (EntityID = '70C724C9-B518-4D81-81B0-BE7F4962B63A' AND Name = 'IsSharedDemo')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            '520209db-e726-48be-b304-623f99a8d38d',
            '70C724C9-B518-4D81-81B0-BE7F4962B63A', -- Entity: MoreCheese: Member Profiles
            21,
            'IsSharedDemo',
            'Is Shared Demo',
            'Marks generated shared-demo rows; the wipe-and-recreate boundary',
            'bit',
            1,
            1,
            0,
            0,
            '(1)',
            0,
            1,
            0,
            0,
            NULL,
            NULL,
            0,
            0,
            0,
            0,
            0,
            0,
            'Search',
            GETUTCDATE(),
            GETUTCDATE()
         )
      END;

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = 'e4455fbb-46fe-4b2b-bd48-a1aa35b217d2' OR (EntityID = '70C724C9-B518-4D81-81B0-BE7F4962B63A' AND Name = '__mj_CreatedAt')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            'e4455fbb-46fe-4b2b-bd48-a1aa35b217d2',
            '70C724C9-B518-4D81-81B0-BE7F4962B63A', -- Entity: MoreCheese: Member Profiles
            22,
            '__mj_CreatedAt',
            'Created At',
            NULL,
            'datetimeoffset',
            10,
            34,
            7,
            0,
            'getutcdate()',
            0,
            0,
            0,
            0,
            NULL,
            NULL,
            0,
            0,
            0,
            0,
            0,
            0,
            'Search',
            GETUTCDATE(),
            GETUTCDATE()
         )
      END;

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = 'b9c52fad-923f-400b-bdc0-91dfb39f8f28' OR (EntityID = '70C724C9-B518-4D81-81B0-BE7F4962B63A' AND Name = '__mj_UpdatedAt')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            'b9c52fad-923f-400b-bdc0-91dfb39f8f28',
            '70C724C9-B518-4D81-81B0-BE7F4962B63A', -- Entity: MoreCheese: Member Profiles
            23,
            '__mj_UpdatedAt',
            'Updated At',
            NULL,
            'datetimeoffset',
            10,
            34,
            7,
            0,
            'getutcdate()',
            0,
            0,
            0,
            0,
            NULL,
            NULL,
            0,
            0,
            0,
            0,
            0,
            0,
            'Search',
            GETUTCDATE(),
            GETUTCDATE()
         )
      END;
UPDATE [${mjSchema}].[EntityField]
         SET [Sequence] = [Sequence] + 100000
       WHERE [EntityID] = '63F9789F-C8CB-4573-91E6-DAF670C4D3B7'
         AND [Sequence] < 100000
         AND NOT EXISTS (
             SELECT 1 FROM [${mjSchema}].[EntityField]
              WHERE [EntityID] = '63F9789F-C8CB-4573-91E6-DAF670C4D3B7'
                AND [Sequence] >= 100000
         );

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = 'ad41c473-0983-4637-a761-157d35c0bd04' OR (EntityID = '63F9789F-C8CB-4573-91E6-DAF670C4D3B7' AND Name = 'ID')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            'ad41c473-0983-4637-a761-157d35c0bd04',
            '63F9789F-C8CB-4573-91E6-DAF670C4D3B7', -- Entity: MoreCheese: Courses
            1,
            'ID',
            'ID',
            NULL,
            'uniqueidentifier',
            16,
            0,
            0,
            0,
            'newsequentialid()',
            0,
            0,
            0,
            0,
            NULL,
            NULL,
            0,
            1,
            0,
            0,
            1,
            1,
            'Search',
            GETUTCDATE(),
            GETUTCDATE()
         )
      END;

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '2bf81441-c58f-4982-a6db-3f64fd88864c' OR (EntityID = '63F9789F-C8CB-4573-91E6-DAF670C4D3B7' AND Name = 'CourseKey')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            '2bf81441-c58f-4982-a6db-3f64fd88864c',
            '63F9789F-C8CB-4573-91E6-DAF670C4D3B7', -- Entity: MoreCheese: Courses
            2,
            'CourseKey',
            'Course Key',
            'Business key; UUIDs derive from it',
            'nvarchar',
            100,
            0,
            0,
            0,
            NULL,
            0,
            1,
            0,
            0,
            NULL,
            NULL,
            0,
            0,
            0,
            0,
            0,
            1,
            'Search',
            GETUTCDATE(),
            GETUTCDATE()
         )
      END;

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = 'afd2f5bc-ee39-4e6d-afea-53afbb64dc48' OR (EntityID = '63F9789F-C8CB-4573-91E6-DAF670C4D3B7' AND Name = 'Name')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            'afd2f5bc-ee39-4e6d-afea-53afbb64dc48',
            '63F9789F-C8CB-4573-91E6-DAF670C4D3B7', -- Entity: MoreCheese: Courses
            3,
            'Name',
            'Name',
            'Course title',
            'nvarchar',
            400,
            0,
            0,
            0,
            NULL,
            0,
            1,
            0,
            0,
            NULL,
            NULL,
            1,
            1,
            0,
            1,
            0,
            0,
            'Search',
            GETUTCDATE(),
            GETUTCDATE()
         )
      END;

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = 'a33a96eb-7bc7-4a47-8421-3cf7bba65406' OR (EntityID = '63F9789F-C8CB-4573-91E6-DAF670C4D3B7' AND Name = 'StartDate')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            'a33a96eb-7bc7-4a47-8421-3cf7bba65406',
            '63F9789F-C8CB-4573-91E6-DAF670C4D3B7', -- Entity: MoreCheese: Courses
            4,
            'StartDate',
            'Start Date',
            'Cohort start date',
            'date',
            3,
            10,
            0,
            0,
            NULL,
            0,
            1,
            0,
            0,
            NULL,
            NULL,
            0,
            0,
            0,
            0,
            0,
            0,
            'Search',
            GETUTCDATE(),
            GETUTCDATE()
         )
      END;

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '44d34e11-2cc9-415c-8549-e3d6bf484948' OR (EntityID = '63F9789F-C8CB-4573-91E6-DAF670C4D3B7' AND Name = 'DurationWeeks')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            '44d34e11-2cc9-415c-8549-e3d6bf484948',
            '63F9789F-C8CB-4573-91E6-DAF670C4D3B7', -- Entity: MoreCheese: Courses
            5,
            'DurationWeeks',
            'Duration Weeks',
            'Course length in weeks',
            'int',
            4,
            10,
            0,
            0,
            NULL,
            0,
            1,
            0,
            0,
            NULL,
            NULL,
            0,
            0,
            0,
            0,
            0,
            0,
            'Search',
            GETUTCDATE(),
            GETUTCDATE()
         )
      END;

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = 'ea98a1f7-8f5e-4183-a8c7-4265e53501d7' OR (EntityID = '63F9789F-C8CB-4573-91E6-DAF670C4D3B7' AND Name = 'IsSharedDemo')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            'ea98a1f7-8f5e-4183-a8c7-4265e53501d7',
            '63F9789F-C8CB-4573-91E6-DAF670C4D3B7', -- Entity: MoreCheese: Courses
            6,
            'IsSharedDemo',
            'Is Shared Demo',
            'Marks generated shared-demo rows; the wipe-and-recreate boundary',
            'bit',
            1,
            1,
            0,
            0,
            '(1)',
            0,
            1,
            0,
            0,
            NULL,
            NULL,
            0,
            0,
            0,
            0,
            0,
            0,
            'Search',
            GETUTCDATE(),
            GETUTCDATE()
         )
      END;

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '8e410ba7-8c6d-4fdb-ae6c-055aa50e9e85' OR (EntityID = '63F9789F-C8CB-4573-91E6-DAF670C4D3B7' AND Name = '__mj_CreatedAt')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            '8e410ba7-8c6d-4fdb-ae6c-055aa50e9e85',
            '63F9789F-C8CB-4573-91E6-DAF670C4D3B7', -- Entity: MoreCheese: Courses
            7,
            '__mj_CreatedAt',
            'Created At',
            NULL,
            'datetimeoffset',
            10,
            34,
            7,
            0,
            'getutcdate()',
            0,
            0,
            0,
            0,
            NULL,
            NULL,
            0,
            0,
            0,
            0,
            0,
            0,
            'Search',
            GETUTCDATE(),
            GETUTCDATE()
         )
      END;

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '2b1694a9-fd8f-4d1c-a94c-2592859dfeb9' OR (EntityID = '63F9789F-C8CB-4573-91E6-DAF670C4D3B7' AND Name = '__mj_UpdatedAt')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            '2b1694a9-fd8f-4d1c-a94c-2592859dfeb9',
            '63F9789F-C8CB-4573-91E6-DAF670C4D3B7', -- Entity: MoreCheese: Courses
            8,
            '__mj_UpdatedAt',
            'Updated At',
            NULL,
            'datetimeoffset',
            10,
            34,
            7,
            0,
            'getutcdate()',
            0,
            0,
            0,
            0,
            NULL,
            NULL,
            0,
            0,
            0,
            0,
            0,
            0,
            'Search',
            GETUTCDATE(),
            GETUTCDATE()
         )
      END;
UPDATE [${mjSchema}].[EntityField]
         SET [Sequence] = [Sequence] + 100000
       WHERE [EntityID] = '0342BEB0-51CE-4284-B5CC-E0811D413335'
         AND [Sequence] < 100000
         AND NOT EXISTS (
             SELECT 1 FROM [${mjSchema}].[EntityField]
              WHERE [EntityID] = '0342BEB0-51CE-4284-B5CC-E0811D413335'
                AND [Sequence] >= 100000
         );

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '16718efe-9c75-456f-9ec2-a958d31266b5' OR (EntityID = '0342BEB0-51CE-4284-B5CC-E0811D413335' AND Name = 'ProductPrice')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            '16718efe-9c75-456f-9ec2-a958d31266b5',
            '0342BEB0-51CE-4284-B5CC-E0811D413335', -- Entity: MJ_BizApps_Orders: Price Tiers
            9,
            'ProductPrice',
            'Product Price',
            NULL,
            'nvarchar',
            200,
            0,
            0,
            0,
            NULL,
            0,
            0,
            1,
            0,
            NULL,
            NULL,
            0,
            0,
            0,
            0,
            0,
            0,
            'Search',
            GETUTCDATE(),
            GETUTCDATE()
         )
      END;
UPDATE [${mjSchema}].[EntityField]
         SET [Sequence] = [Sequence] + 100000
       WHERE [EntityID] = '50B6FD43-6669-41A0-8DBA-FB23C3B8C753'
         AND [Sequence] < 100000
         AND NOT EXISTS (
             SELECT 1 FROM [${mjSchema}].[EntityField]
              WHERE [EntityID] = '50B6FD43-6669-41A0-8DBA-FB23C3B8C753'
                AND [Sequence] >= 100000
         );

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '9cce2b30-a985-4fdc-b84f-0c2c10f6eb36' OR (EntityID = '50B6FD43-6669-41A0-8DBA-FB23C3B8C753' AND Name = 'ID')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            '9cce2b30-a985-4fdc-b84f-0c2c10f6eb36',
            '50B6FD43-6669-41A0-8DBA-FB23C3B8C753', -- Entity: MoreCheese: Data Quality Labels
            1,
            'ID',
            'ID',
            NULL,
            'uniqueidentifier',
            16,
            0,
            0,
            0,
            'newsequentialid()',
            0,
            0,
            0,
            0,
            NULL,
            NULL,
            0,
            1,
            0,
            0,
            1,
            1,
            'Search',
            GETUTCDATE(),
            GETUTCDATE()
         )
      END;

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = 'fe29ef1a-28a9-4d65-a9b5-a127a5c8e0ac' OR (EntityID = '50B6FD43-6669-41A0-8DBA-FB23C3B8C753' AND Name = 'LabelKey')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            'fe29ef1a-28a9-4d65-a9b5-a127a5c8e0ac',
            '50B6FD43-6669-41A0-8DBA-FB23C3B8C753', -- Entity: MoreCheese: Data Quality Labels
            2,
            'LabelKey',
            'Label Key',
            NULL,
            'nvarchar',
            160,
            0,
            0,
            0,
            NULL,
            0,
            1,
            0,
            0,
            NULL,
            NULL,
            0,
            0,
            0,
            0,
            0,
            1,
            'Search',
            GETUTCDATE(),
            GETUTCDATE()
         )
      END;

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '0ced10f1-5a98-471b-b823-93ea2222ddb7' OR (EntityID = '50B6FD43-6669-41A0-8DBA-FB23C3B8C753' AND Name = 'DefectKind')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            '0ced10f1-5a98-471b-b823-93ea2222ddb7',
            '50B6FD43-6669-41A0-8DBA-FB23C3B8C753', -- Entity: MoreCheese: Data Quality Labels
            3,
            'DefectKind',
            'Defect Kind',
            'DuplicatePerson (RelatedPersonID = the canonical record), StaleEmployer (RelatedOrganizationID = the TRUE employer), or TypoEmail (TruthValue = the correct email)',
            'nvarchar',
            100,
            0,
            0,
            0,
            NULL,
            0,
            1,
            0,
            0,
            NULL,
            NULL,
            0,
            0,
            0,
            0,
            0,
            0,
            'Search',
            GETUTCDATE(),
            GETUTCDATE()
         )
      END;

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = 'b232382d-ad14-4662-a1e6-0c28e1b9993c' OR (EntityID = '50B6FD43-6669-41A0-8DBA-FB23C3B8C753' AND Name = 'PersonID')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            'b232382d-ad14-4662-a1e6-0c28e1b9993c',
            '50B6FD43-6669-41A0-8DBA-FB23C3B8C753', -- Entity: MoreCheese: Data Quality Labels
            4,
            'PersonID',
            'Person ID',
            NULL,
            'uniqueidentifier',
            16,
            0,
            0,
            0,
            NULL,
            0,
            1,
            0,
            0,
            '7A94ADA9-7880-4FAE-97D8-DB0E934C3F5F',
            'ID',
            0,
            0,
            1,
            0,
            0,
            0,
            'Search',
            GETUTCDATE(),
            GETUTCDATE()
         )
      END;

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '56103ec8-b51d-4a9f-a8c6-9c1cc75e0119' OR (EntityID = '50B6FD43-6669-41A0-8DBA-FB23C3B8C753' AND Name = 'RelatedPersonID')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            '56103ec8-b51d-4a9f-a8c6-9c1cc75e0119',
            '50B6FD43-6669-41A0-8DBA-FB23C3B8C753', -- Entity: MoreCheese: Data Quality Labels
            5,
            'RelatedPersonID',
            'Related Person ID',
            NULL,
            'uniqueidentifier',
            16,
            0,
            0,
            1,
            NULL,
            0,
            1,
            0,
            0,
            '7A94ADA9-7880-4FAE-97D8-DB0E934C3F5F',
            'ID',
            0,
            0,
            1,
            0,
            0,
            0,
            'Search',
            GETUTCDATE(),
            GETUTCDATE()
         )
      END;

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '951a6339-3685-49cf-a5fa-363c8fb68168' OR (EntityID = '50B6FD43-6669-41A0-8DBA-FB23C3B8C753' AND Name = 'RelatedOrganizationID')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            '951a6339-3685-49cf-a5fa-363c8fb68168',
            '50B6FD43-6669-41A0-8DBA-FB23C3B8C753', -- Entity: MoreCheese: Data Quality Labels
            6,
            'RelatedOrganizationID',
            'Related Organization ID',
            NULL,
            'uniqueidentifier',
            16,
            0,
            0,
            1,
            NULL,
            0,
            1,
            0,
            0,
            'C70448F9-9792-41D7-A82C-784B66429D54',
            'ID',
            0,
            0,
            1,
            0,
            0,
            0,
            'Search',
            GETUTCDATE(),
            GETUTCDATE()
         )
      END;

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = 'e5b885aa-1202-48d3-a24e-291e4864d19f' OR (EntityID = '50B6FD43-6669-41A0-8DBA-FB23C3B8C753' AND Name = 'DefectValue')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            'e5b885aa-1202-48d3-a24e-291e4864d19f',
            '50B6FD43-6669-41A0-8DBA-FB23C3B8C753', -- Entity: MoreCheese: Data Quality Labels
            7,
            'DefectValue',
            'Defect Value',
            'The defective value as it appears in the data (e.g. the typo''d email, the stale org name)',
            'nvarchar',
            800,
            0,
            0,
            1,
            NULL,
            0,
            1,
            0,
            0,
            NULL,
            NULL,
            0,
            0,
            0,
            0,
            0,
            0,
            'Search',
            GETUTCDATE(),
            GETUTCDATE()
         )
      END;

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = 'cdb43a70-607e-4439-8531-45f5a5c773a5' OR (EntityID = '50B6FD43-6669-41A0-8DBA-FB23C3B8C753' AND Name = 'TruthValue')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            'cdb43a70-607e-4439-8531-45f5a5c773a5',
            '50B6FD43-6669-41A0-8DBA-FB23C3B8C753', -- Entity: MoreCheese: Data Quality Labels
            8,
            'TruthValue',
            'Truth Value',
            'The correct value (the verifiable right answer)',
            'nvarchar',
            800,
            0,
            0,
            1,
            NULL,
            0,
            1,
            0,
            0,
            NULL,
            NULL,
            0,
            0,
            0,
            0,
            0,
            0,
            'Search',
            GETUTCDATE(),
            GETUTCDATE()
         )
      END;

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '4b7f95d0-890c-40f8-a928-9a0b0d727284' OR (EntityID = '50B6FD43-6669-41A0-8DBA-FB23C3B8C753' AND Name = 'Notes')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            '4b7f95d0-890c-40f8-a928-9a0b0d727284',
            '50B6FD43-6669-41A0-8DBA-FB23C3B8C753', -- Entity: MoreCheese: Data Quality Labels
            9,
            'Notes',
            'Notes',
            NULL,
            'nvarchar',
            1000,
            0,
            0,
            1,
            NULL,
            0,
            1,
            0,
            0,
            NULL,
            NULL,
            0,
            0,
            0,
            0,
            0,
            0,
            'Search',
            GETUTCDATE(),
            GETUTCDATE()
         )
      END;

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '82ccc845-2fef-4023-b039-7506de65b29e' OR (EntityID = '50B6FD43-6669-41A0-8DBA-FB23C3B8C753' AND Name = 'IsSharedDemo')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            '82ccc845-2fef-4023-b039-7506de65b29e',
            '50B6FD43-6669-41A0-8DBA-FB23C3B8C753', -- Entity: MoreCheese: Data Quality Labels
            10,
            'IsSharedDemo',
            'Is Shared Demo',
            NULL,
            'bit',
            1,
            1,
            0,
            0,
            '(1)',
            0,
            1,
            0,
            0,
            NULL,
            NULL,
            0,
            0,
            0,
            0,
            0,
            0,
            'Search',
            GETUTCDATE(),
            GETUTCDATE()
         )
      END;

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = 'bf1e576a-f9be-47f1-9f87-8b2a93959fc3' OR (EntityID = '50B6FD43-6669-41A0-8DBA-FB23C3B8C753' AND Name = '__mj_CreatedAt')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            'bf1e576a-f9be-47f1-9f87-8b2a93959fc3',
            '50B6FD43-6669-41A0-8DBA-FB23C3B8C753', -- Entity: MoreCheese: Data Quality Labels
            11,
            '__mj_CreatedAt',
            'Created At',
            NULL,
            'datetimeoffset',
            10,
            34,
            7,
            0,
            'getutcdate()',
            0,
            0,
            0,
            0,
            NULL,
            NULL,
            0,
            0,
            0,
            0,
            0,
            0,
            'Search',
            GETUTCDATE(),
            GETUTCDATE()
         )
      END;

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '3536c09e-49f2-4567-80d5-ac73211d9cf0' OR (EntityID = '50B6FD43-6669-41A0-8DBA-FB23C3B8C753' AND Name = '__mj_UpdatedAt')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            '3536c09e-49f2-4567-80d5-ac73211d9cf0',
            '50B6FD43-6669-41A0-8DBA-FB23C3B8C753', -- Entity: MoreCheese: Data Quality Labels
            12,
            '__mj_UpdatedAt',
            'Updated At',
            NULL,
            'datetimeoffset',
            10,
            34,
            7,
            0,
            'getutcdate()',
            0,
            0,
            0,
            0,
            NULL,
            NULL,
            0,
            0,
            0,
            0,
            0,
            0,
            'Search',
            GETUTCDATE(),
            GETUTCDATE()
         )
      END;

/* SQL text to update existing entity fields from schema */
EXEC [${mjSchema}].[spUpdateExistingEntityFieldsFromSchema] @ExcludedSchemaNames='sys,staging,${mjSchema}', @IncludedSchemaNames='${flyway:defaultSchema},morecheese_events,morecheese_learning';

/* SQL text to set default column width where needed */
EXEC [${mjSchema}].[spSetDefaultColumnWidthWhereNeeded] @ExcludedSchemaNames='sys,staging,${mjSchema}', @IncludedSchemaNames='${flyway:defaultSchema},morecheese_events,morecheese_learning';

/* SQL text to insert entity field value with ID 32d777df-ff88-4fdc-b205-6848a3d94523 */
INSERT INTO [${mjSchema}].[EntityFieldValue]
                                       ([ID], [EntityFieldID], [Sequence], [Value], [Code], [__mj_CreatedAt], [__mj_UpdatedAt])
                                    VALUES
                                       ('32d777df-ff88-4fdc-b205-6848a3d94523', 'AE2C88C6-67E7-4EE5-81E6-DDE067B9D0D8', 1, 'Conference', 'Conference', GETUTCDATE(), GETUTCDATE());

/* SQL text to insert entity field value with ID 1c4ce403-a915-4f28-970d-27574505c005 */
INSERT INTO [${mjSchema}].[EntityFieldValue]
                                       ([ID], [EntityFieldID], [Sequence], [Value], [Code], [__mj_CreatedAt], [__mj_UpdatedAt])
                                    VALUES
                                       ('1c4ce403-a915-4f28-970d-27574505c005', 'AE2C88C6-67E7-4EE5-81E6-DDE067B9D0D8', 2, 'Webinar', 'Webinar', GETUTCDATE(), GETUTCDATE());

/* SQL text to insert entity field value with ID 5690d21a-ac0f-47e0-80e0-6ce448545181 */
INSERT INTO [${mjSchema}].[EntityFieldValue]
                                       ([ID], [EntityFieldID], [Sequence], [Value], [Code], [__mj_CreatedAt], [__mj_UpdatedAt])
                                    VALUES
                                       ('5690d21a-ac0f-47e0-80e0-6ce448545181', 'AE2C88C6-67E7-4EE5-81E6-DDE067B9D0D8', 3, 'Workshop', 'Workshop', GETUTCDATE(), GETUTCDATE());

/* SQL text to update ValueListType for entity field ID AE2C88C6-67E7-4EE5-81E6-DDE067B9D0D8 */
UPDATE [${mjSchema}].[EntityField] SET ValueListType='List' WHERE ID='AE2C88C6-67E7-4EE5-81E6-DDE067B9D0D8';

/* SQL text to insert entity field value with ID c6b1abfb-a1d0-4af6-a2f0-bbbe500ce1d4 */
INSERT INTO [${mjSchema}].[EntityFieldValue]
                                       ([ID], [EntityFieldID], [Sequence], [Value], [Code], [__mj_CreatedAt], [__mj_UpdatedAt])
                                    VALUES
                                       ('c6b1abfb-a1d0-4af6-a2f0-bbbe500ce1d4', '7E8D65A1-5858-497B-BCEF-6DF19AEE292C', 1, 'Completed', 'Completed', GETUTCDATE(), GETUTCDATE());

/* SQL text to insert entity field value with ID 41a70626-afea-4a5f-9a7c-6e4e85d3bbae */
INSERT INTO [${mjSchema}].[EntityFieldValue]
                                       ([ID], [EntityFieldID], [Sequence], [Value], [Code], [__mj_CreatedAt], [__mj_UpdatedAt])
                                    VALUES
                                       ('41a70626-afea-4a5f-9a7c-6e4e85d3bbae', '7E8D65A1-5858-497B-BCEF-6DF19AEE292C', 2, 'Dropped', 'Dropped', GETUTCDATE(), GETUTCDATE());

/* SQL text to insert entity field value with ID 155bebba-ca07-445f-ac83-66e7891dd2db */
INSERT INTO [${mjSchema}].[EntityFieldValue]
                                       ([ID], [EntityFieldID], [Sequence], [Value], [Code], [__mj_CreatedAt], [__mj_UpdatedAt])
                                    VALUES
                                       ('155bebba-ca07-445f-ac83-66e7891dd2db', '7E8D65A1-5858-497B-BCEF-6DF19AEE292C', 3, 'InProgress', 'InProgress', GETUTCDATE(), GETUTCDATE());

/* SQL text to update ValueListType for entity field ID 7E8D65A1-5858-497B-BCEF-6DF19AEE292C */
UPDATE [${mjSchema}].[EntityField] SET ValueListType='List' WHERE ID='7E8D65A1-5858-497B-BCEF-6DF19AEE292C';

/* SQL text to insert entity field value with ID 5083909c-1d46-4408-9bd3-c6ad7de898eb */
INSERT INTO [${mjSchema}].[EntityFieldValue]
                                       ([ID], [EntityFieldID], [Sequence], [Value], [Code], [__mj_CreatedAt], [__mj_UpdatedAt])
                                    VALUES
                                       ('5083909c-1d46-4408-9bd3-c6ad7de898eb', 'F1566A08-AAC3-4BCF-9485-C52581550E2C', 1, 'Awarded', 'Awarded', GETUTCDATE(), GETUTCDATE());

/* SQL text to insert entity field value with ID 69716102-5162-4e35-b475-a3dfb3f8e1a4 */
INSERT INTO [${mjSchema}].[EntityFieldValue]
                                       ([ID], [EntityFieldID], [Sequence], [Value], [Code], [__mj_CreatedAt], [__mj_UpdatedAt])
                                    VALUES
                                       ('69716102-5162-4e35-b475-a3dfb3f8e1a4', 'F1566A08-AAC3-4BCF-9485-C52581550E2C', 2, 'Expired', 'Expired', GETUTCDATE(), GETUTCDATE());

/* SQL text to insert entity field value with ID 58b0e53b-6239-4b49-b92a-d08b24b5af5e */
INSERT INTO [${mjSchema}].[EntityFieldValue]
                                       ([ID], [EntityFieldID], [Sequence], [Value], [Code], [__mj_CreatedAt], [__mj_UpdatedAt])
                                    VALUES
                                       ('58b0e53b-6239-4b49-b92a-d08b24b5af5e', 'F1566A08-AAC3-4BCF-9485-C52581550E2C', 3, 'InProgress', 'InProgress', GETUTCDATE(), GETUTCDATE());

/* SQL text to insert entity field value with ID 9a35209a-d636-4191-8c4c-37ba33250391 */
INSERT INTO [${mjSchema}].[EntityFieldValue]
                                       ([ID], [EntityFieldID], [Sequence], [Value], [Code], [__mj_CreatedAt], [__mj_UpdatedAt])
                                    VALUES
                                       ('9a35209a-d636-4191-8c4c-37ba33250391', 'F1566A08-AAC3-4BCF-9485-C52581550E2C', 4, 'Withdrawn', 'Withdrawn', GETUTCDATE(), GETUTCDATE());

/* SQL text to update ValueListType for entity field ID F1566A08-AAC3-4BCF-9485-C52581550E2C */
UPDATE [${mjSchema}].[EntityField] SET ValueListType='List' WHERE ID='F1566A08-AAC3-4BCF-9485-C52581550E2C';

/* SQL text to insert entity field value with ID 535997f1-9c01-4b0d-99c8-17644cd2b2cf */
INSERT INTO [${mjSchema}].[EntityFieldValue]
                                       ([ID], [EntityFieldID], [Sequence], [Value], [Code], [__mj_CreatedAt], [__mj_UpdatedAt])
                                    VALUES
                                       ('535997f1-9c01-4b0d-99c8-17644cd2b2cf', '07E777D4-1BF8-473A-AABF-E9A3DA6DB4F0', 1, 'Bronze', 'Bronze', GETUTCDATE(), GETUTCDATE());

/* SQL text to insert entity field value with ID 2a9e3dcd-c0da-4b55-9f4e-febb496d4164 */
INSERT INTO [${mjSchema}].[EntityFieldValue]
                                       ([ID], [EntityFieldID], [Sequence], [Value], [Code], [__mj_CreatedAt], [__mj_UpdatedAt])
                                    VALUES
                                       ('2a9e3dcd-c0da-4b55-9f4e-febb496d4164', '07E777D4-1BF8-473A-AABF-E9A3DA6DB4F0', 2, 'Gold', 'Gold', GETUTCDATE(), GETUTCDATE());

/* SQL text to insert entity field value with ID 7f353cfb-fbcd-439b-ad56-f7a4a8acb95a */
INSERT INTO [${mjSchema}].[EntityFieldValue]
                                       ([ID], [EntityFieldID], [Sequence], [Value], [Code], [__mj_CreatedAt], [__mj_UpdatedAt])
                                    VALUES
                                       ('7f353cfb-fbcd-439b-ad56-f7a4a8acb95a', '07E777D4-1BF8-473A-AABF-E9A3DA6DB4F0', 3, 'None', 'None', GETUTCDATE(), GETUTCDATE());

/* SQL text to insert entity field value with ID 9ba97eb1-c258-459b-9a46-4f09d2dd6b5e */
INSERT INTO [${mjSchema}].[EntityFieldValue]
                                       ([ID], [EntityFieldID], [Sequence], [Value], [Code], [__mj_CreatedAt], [__mj_UpdatedAt])
                                    VALUES
                                       ('9ba97eb1-c258-459b-9a46-4f09d2dd6b5e', '07E777D4-1BF8-473A-AABF-E9A3DA6DB4F0', 4, 'Silver', 'Silver', GETUTCDATE(), GETUTCDATE());

/* SQL text to update ValueListType for entity field ID 07E777D4-1BF8-473A-AABF-E9A3DA6DB4F0 */
UPDATE [${mjSchema}].[EntityField] SET ValueListType='List' WHERE ID='07E777D4-1BF8-473A-AABF-E9A3DA6DB4F0';

/* SQL text to insert entity field value with ID e8820918-944f-4d9a-b6c3-a0ba8c4143cc */
INSERT INTO [${mjSchema}].[EntityFieldValue]
                                       ([ID], [EntityFieldID], [Sequence], [Value], [Code], [__mj_CreatedAt], [__mj_UpdatedAt])
                                    VALUES
                                       ('e8820918-944f-4d9a-b6c3-a0ba8c4143cc', '2F2A4E1E-DC13-4602-AB6B-2149C909DD04', 1, 'CoalitionMeeting', 'CoalitionMeeting', GETUTCDATE(), GETUTCDATE());

/* SQL text to insert entity field value with ID 06d65ce4-3518-49cc-8d6b-e613a5da9bae */
INSERT INTO [${mjSchema}].[EntityFieldValue]
                                       ([ID], [EntityFieldID], [Sequence], [Value], [Code], [__mj_CreatedAt], [__mj_UpdatedAt])
                                    VALUES
                                       ('06d65ce4-3518-49cc-8d6b-e613a5da9bae', '2F2A4E1E-DC13-4602-AB6B-2149C909DD04', 2, 'LetterCampaign', 'LetterCampaign', GETUTCDATE(), GETUTCDATE());

/* SQL text to insert entity field value with ID 341d147e-57c8-4e00-835b-2ccf26cdefa7 */
INSERT INTO [${mjSchema}].[EntityFieldValue]
                                       ([ID], [EntityFieldID], [Sequence], [Value], [Code], [__mj_CreatedAt], [__mj_UpdatedAt])
                                    VALUES
                                       ('341d147e-57c8-4e00-835b-2ccf26cdefa7', '2F2A4E1E-DC13-4602-AB6B-2149C909DD04', 3, 'PetitionSignature', 'PetitionSignature', GETUTCDATE(), GETUTCDATE());

/* SQL text to insert entity field value with ID 47e76c1c-025b-4b7d-aad0-598de007fbf7 */
INSERT INTO [${mjSchema}].[EntityFieldValue]
                                       ([ID], [EntityFieldID], [Sequence], [Value], [Code], [__mj_CreatedAt], [__mj_UpdatedAt])
                                    VALUES
                                       ('47e76c1c-025b-4b7d-aad0-598de007fbf7', '2F2A4E1E-DC13-4602-AB6B-2149C909DD04', 4, 'Testimony', 'Testimony', GETUTCDATE(), GETUTCDATE());

/* SQL text to update ValueListType for entity field ID 2F2A4E1E-DC13-4602-AB6B-2149C909DD04 */
UPDATE [${mjSchema}].[EntityField] SET ValueListType='List' WHERE ID='2F2A4E1E-DC13-4602-AB6B-2149C909DD04';

/* SQL text to insert entity field value with ID 5736c0c6-4bcd-4278-8ecf-d15e794d6c59 */
INSERT INTO [${mjSchema}].[EntityFieldValue]
                                       ([ID], [EntityFieldID], [Sequence], [Value], [Code], [__mj_CreatedAt], [__mj_UpdatedAt])
                                    VALUES
                                       ('5736c0c6-4bcd-4278-8ecf-d15e794d6c59', '0CED10F1-5A98-471B-B823-93EA2222DDB7', 1, 'DuplicatePerson', 'DuplicatePerson', GETUTCDATE(), GETUTCDATE());

/* SQL text to insert entity field value with ID 53ad2a46-d454-4804-a4e4-9ae4e1021b9e */
INSERT INTO [${mjSchema}].[EntityFieldValue]
                                       ([ID], [EntityFieldID], [Sequence], [Value], [Code], [__mj_CreatedAt], [__mj_UpdatedAt])
                                    VALUES
                                       ('53ad2a46-d454-4804-a4e4-9ae4e1021b9e', '0CED10F1-5A98-471B-B823-93EA2222DDB7', 2, 'StaleEmployer', 'StaleEmployer', GETUTCDATE(), GETUTCDATE());

/* SQL text to insert entity field value with ID e862ff2b-73bb-413d-a7e6-7c1a1c147b2c */
INSERT INTO [${mjSchema}].[EntityFieldValue]
                                       ([ID], [EntityFieldID], [Sequence], [Value], [Code], [__mj_CreatedAt], [__mj_UpdatedAt])
                                    VALUES
                                       ('e862ff2b-73bb-413d-a7e6-7c1a1c147b2c', '0CED10F1-5A98-471B-B823-93EA2222DDB7', 3, 'TypoEmail', 'TypoEmail', GETUTCDATE(), GETUTCDATE());

/* SQL text to update ValueListType for entity field ID 0CED10F1-5A98-471B-B823-93EA2222DDB7 */
UPDATE [${mjSchema}].[EntityField] SET ValueListType='List' WHERE ID='0CED10F1-5A98-471B-B823-93EA2222DDB7';

/* SQL text to insert entity field value with ID 5feb27e1-b86c-4525-a66d-20f927638d41 */
INSERT INTO [${mjSchema}].[EntityFieldValue]
                                       ([ID], [EntityFieldID], [Sequence], [Value], [Code], [__mj_CreatedAt], [__mj_UpdatedAt])
                                    VALUES
                                       ('5feb27e1-b86c-4525-a66d-20f927638d41', 'C2532FAF-8510-45A6-8FD2-8517130EFE57', 1, 'Educator', 'Educator', GETUTCDATE(), GETUTCDATE());

/* SQL text to insert entity field value with ID 993b6bde-25cf-4cb0-834a-c27387afc20c */
INSERT INTO [${mjSchema}].[EntityFieldValue]
                                       ([ID], [EntityFieldID], [Sequence], [Value], [Code], [__mj_CreatedAt], [__mj_UpdatedAt])
                                    VALUES
                                       ('993b6bde-25cf-4cb0-834a-c27387afc20c', 'C2532FAF-8510-45A6-8FD2-8517130EFE57', 2, 'Producer', 'Producer', GETUTCDATE(), GETUTCDATE());

/* SQL text to insert entity field value with ID acad5cd7-7d3d-4712-a2d3-77fe57b6702c */
INSERT INTO [${mjSchema}].[EntityFieldValue]
                                       ([ID], [EntityFieldID], [Sequence], [Value], [Code], [__mj_CreatedAt], [__mj_UpdatedAt])
                                    VALUES
                                       ('acad5cd7-7d3d-4712-a2d3-77fe57b6702c', 'C2532FAF-8510-45A6-8FD2-8517130EFE57', 3, 'Retailer', 'Retailer', GETUTCDATE(), GETUTCDATE());

/* SQL text to insert entity field value with ID 6e2eca40-8e4c-41dc-9318-519002f20b15 */
INSERT INTO [${mjSchema}].[EntityFieldValue]
                                       ([ID], [EntityFieldID], [Sequence], [Value], [Code], [__mj_CreatedAt], [__mj_UpdatedAt])
                                    VALUES
                                       ('6e2eca40-8e4c-41dc-9318-519002f20b15', 'C2532FAF-8510-45A6-8FD2-8517130EFE57', 4, 'Supplier', 'Supplier', GETUTCDATE(), GETUTCDATE());

/* SQL text to update ValueListType for entity field ID C2532FAF-8510-45A6-8FD2-8517130EFE57 */
UPDATE [${mjSchema}].[EntityField] SET ValueListType='List' WHERE ID='C2532FAF-8510-45A6-8FD2-8517130EFE57';

/* SQL text to insert entity field value with ID d5cf1e54-579d-4fe8-bcd6-358fcda65482 */
INSERT INTO [${mjSchema}].[EntityFieldValue]
                                       ([ID], [EntityFieldID], [Sequence], [Value], [Code], [__mj_CreatedAt], [__mj_UpdatedAt])
                                    VALUES
                                       ('d5cf1e54-579d-4fe8-bcd6-358fcda65482', '978C4EEA-6E65-47C0-B2FF-8D41A5C85805', 1, 'EU', 'EU', GETUTCDATE(), GETUTCDATE());

/* SQL text to insert entity field value with ID 41ccd11a-0ca1-4b02-800e-849cd484dc59 */
INSERT INTO [${mjSchema}].[EntityFieldValue]
                                       ([ID], [EntityFieldID], [Sequence], [Value], [Code], [__mj_CreatedAt], [__mj_UpdatedAt])
                                    VALUES
                                       ('41ccd11a-0ca1-4b02-800e-849cd484dc59', '978C4EEA-6E65-47C0-B2FF-8D41A5C85805', 2, 'NA', 'NA', GETUTCDATE(), GETUTCDATE());

/* SQL text to insert entity field value with ID 4b068f8a-80f1-40ce-b7fa-17f20968feb0 */
INSERT INTO [${mjSchema}].[EntityFieldValue]
                                       ([ID], [EntityFieldID], [Sequence], [Value], [Code], [__mj_CreatedAt], [__mj_UpdatedAt])
                                    VALUES
                                       ('4b068f8a-80f1-40ce-b7fa-17f20968feb0', '978C4EEA-6E65-47C0-B2FF-8D41A5C85805', 3, 'RoW', 'RoW', GETUTCDATE(), GETUTCDATE());

/* SQL text to update ValueListType for entity field ID 978C4EEA-6E65-47C0-B2FF-8D41A5C85805 */
UPDATE [${mjSchema}].[EntityField] SET ValueListType='List' WHERE ID='978C4EEA-6E65-47C0-B2FF-8D41A5C85805';

/* SQL text to insert entity field value with ID 90cf34a2-79b8-4e3d-b091-e7efbf6d5488 */
INSERT INTO [${mjSchema}].[EntityFieldValue]
                                       ([ID], [EntityFieldID], [Sequence], [Value], [Code], [__mj_CreatedAt], [__mj_UpdatedAt])
                                    VALUES
                                       ('90cf34a2-79b8-4e3d-b091-e7efbf6d5488', 'C492F3F2-6891-49C9-A530-BAFB4981029A', 1, 'Acquired', 'Acquired', GETUTCDATE(), GETUTCDATE());

/* SQL text to insert entity field value with ID 7f547e32-4807-4571-a187-86065eb799f6 */
INSERT INTO [${mjSchema}].[EntityFieldValue]
                                       ([ID], [EntityFieldID], [Sequence], [Value], [Code], [__mj_CreatedAt], [__mj_UpdatedAt])
                                    VALUES
                                       ('7f547e32-4807-4571-a187-86065eb799f6', 'C492F3F2-6891-49C9-A530-BAFB4981029A', 2, 'Dissolved', 'Dissolved', GETUTCDATE(), GETUTCDATE());

/* SQL text to insert entity field value with ID e54d91a3-fd88-4d9a-8a29-f56c913d878a */
INSERT INTO [${mjSchema}].[EntityFieldValue]
                                       ([ID], [EntityFieldID], [Sequence], [Value], [Code], [__mj_CreatedAt], [__mj_UpdatedAt])
                                    VALUES
                                       ('e54d91a3-fd88-4d9a-8a29-f56c913d878a', 'C492F3F2-6891-49C9-A530-BAFB4981029A', 3, 'ProgramCut', 'ProgramCut', GETUTCDATE(), GETUTCDATE());

/* SQL text to update ValueListType for entity field ID C492F3F2-6891-49C9-A530-BAFB4981029A */
UPDATE [${mjSchema}].[EntityField] SET ValueListType='List' WHERE ID='C492F3F2-6891-49C9-A530-BAFB4981029A';

/* SQL text to insert entity field value with ID 3d2ee5d3-2e86-4eee-be34-13e636597f41 */
INSERT INTO [${mjSchema}].[EntityFieldValue]
                                       ([ID], [EntityFieldID], [Sequence], [Value], [Code], [__mj_CreatedAt], [__mj_UpdatedAt])
                                    VALUES
                                       ('3d2ee5d3-2e86-4eee-be34-13e636597f41', 'CEAE0D08-1C23-4AB9-862B-7720FEF292E7', 1, 'Educator', 'Educator', GETUTCDATE(), GETUTCDATE());

/* SQL text to insert entity field value with ID bab8a5eb-560f-4035-82a8-6393bbe3f2c1 */
INSERT INTO [${mjSchema}].[EntityFieldValue]
                                       ([ID], [EntityFieldID], [Sequence], [Value], [Code], [__mj_CreatedAt], [__mj_UpdatedAt])
                                    VALUES
                                       ('bab8a5eb-560f-4035-82a8-6393bbe3f2c1', 'CEAE0D08-1C23-4AB9-862B-7720FEF292E7', 2, 'Enthusiast', 'Enthusiast', GETUTCDATE(), GETUTCDATE());

/* SQL text to insert entity field value with ID 6b467301-c715-4055-b263-21e21fc01feb */
INSERT INTO [${mjSchema}].[EntityFieldValue]
                                       ([ID], [EntityFieldID], [Sequence], [Value], [Code], [__mj_CreatedAt], [__mj_UpdatedAt])
                                    VALUES
                                       ('6b467301-c715-4055-b263-21e21fc01feb', 'CEAE0D08-1C23-4AB9-862B-7720FEF292E7', 3, 'Producer', 'Producer', GETUTCDATE(), GETUTCDATE());

/* SQL text to insert entity field value with ID 922c9f80-2198-420d-8640-2b3c7a306fee */
INSERT INTO [${mjSchema}].[EntityFieldValue]
                                       ([ID], [EntityFieldID], [Sequence], [Value], [Code], [__mj_CreatedAt], [__mj_UpdatedAt])
                                    VALUES
                                       ('922c9f80-2198-420d-8640-2b3c7a306fee', 'CEAE0D08-1C23-4AB9-862B-7720FEF292E7', 4, 'Retailer', 'Retailer', GETUTCDATE(), GETUTCDATE());

/* SQL text to insert entity field value with ID d3e1bdb3-59c1-4326-86f8-bb7446499b1c */
INSERT INTO [${mjSchema}].[EntityFieldValue]
                                       ([ID], [EntityFieldID], [Sequence], [Value], [Code], [__mj_CreatedAt], [__mj_UpdatedAt])
                                    VALUES
                                       ('d3e1bdb3-59c1-4326-86f8-bb7446499b1c', 'CEAE0D08-1C23-4AB9-862B-7720FEF292E7', 5, 'Supplier', 'Supplier', GETUTCDATE(), GETUTCDATE());

/* SQL text to update ValueListType for entity field ID CEAE0D08-1C23-4AB9-862B-7720FEF292E7 */
UPDATE [${mjSchema}].[EntityField] SET ValueListType='List' WHERE ID='CEAE0D08-1C23-4AB9-862B-7720FEF292E7';

/* SQL text to insert entity field value with ID 4d05d962-1f14-4506-b81a-1f773535597d */
INSERT INTO [${mjSchema}].[EntityFieldValue]
                                       ([ID], [EntityFieldID], [Sequence], [Value], [Code], [__mj_CreatedAt], [__mj_UpdatedAt])
                                    VALUES
                                       ('4d05d962-1f14-4506-b81a-1f773535597d', '28126800-5A2F-4DE4-9907-9BD4CFE38F2E', 1, 'EU', 'EU', GETUTCDATE(), GETUTCDATE());

/* SQL text to insert entity field value with ID 5a9297e0-1d56-418b-999c-bbe1aaf55cc6 */
INSERT INTO [${mjSchema}].[EntityFieldValue]
                                       ([ID], [EntityFieldID], [Sequence], [Value], [Code], [__mj_CreatedAt], [__mj_UpdatedAt])
                                    VALUES
                                       ('5a9297e0-1d56-418b-999c-bbe1aaf55cc6', '28126800-5A2F-4DE4-9907-9BD4CFE38F2E', 2, 'NA', 'NA', GETUTCDATE(), GETUTCDATE());

/* SQL text to insert entity field value with ID 9206d82c-fa1e-411b-9d56-a6efd4760bc7 */
INSERT INTO [${mjSchema}].[EntityFieldValue]
                                       ([ID], [EntityFieldID], [Sequence], [Value], [Code], [__mj_CreatedAt], [__mj_UpdatedAt])
                                    VALUES
                                       ('9206d82c-fa1e-411b-9d56-a6efd4760bc7', '28126800-5A2F-4DE4-9907-9BD4CFE38F2E', 3, 'RoW', 'RoW', GETUTCDATE(), GETUTCDATE());

/* SQL text to update ValueListType for entity field ID 28126800-5A2F-4DE4-9907-9BD4CFE38F2E */
UPDATE [${mjSchema}].[EntityField] SET ValueListType='List' WHERE ID='28126800-5A2F-4DE4-9907-9BD4CFE38F2E';

/* SQL text to insert entity field value with ID c67f36ed-39ce-4ec8-8167-f24d02582827 */
INSERT INTO [${mjSchema}].[EntityFieldValue]
                                       ([ID], [EntityFieldID], [Sequence], [Value], [Code], [__mj_CreatedAt], [__mj_UpdatedAt])
                                    VALUES
                                       ('c67f36ed-39ce-4ec8-8167-f24d02582827', '2F526A4F-673F-4182-82B3-6305959954C5', 1, 'Active', 'Active', GETUTCDATE(), GETUTCDATE());

/* SQL text to insert entity field value with ID 4994cf54-bb03-49f3-9645-abea7cac0d42 */
INSERT INTO [${mjSchema}].[EntityFieldValue]
                                       ([ID], [EntityFieldID], [Sequence], [Value], [Code], [__mj_CreatedAt], [__mj_UpdatedAt])
                                    VALUES
                                       ('4994cf54-bb03-49f3-9645-abea7cac0d42', '2F526A4F-673F-4182-82B3-6305959954C5', 2, 'Cancelled', 'Cancelled', GETUTCDATE(), GETUTCDATE());

/* SQL text to insert entity field value with ID 55f807f2-3c27-454e-a34b-5c5acc09702c */
INSERT INTO [${mjSchema}].[EntityFieldValue]
                                       ([ID], [EntityFieldID], [Sequence], [Value], [Code], [__mj_CreatedAt], [__mj_UpdatedAt])
                                    VALUES
                                       ('55f807f2-3c27-454e-a34b-5c5acc09702c', '2F526A4F-673F-4182-82B3-6305959954C5', 3, 'Lapsed', 'Lapsed', GETUTCDATE(), GETUTCDATE());

/* SQL text to insert entity field value with ID 2679c771-cd57-4c46-ab4d-e99d8ec0fda6 */
INSERT INTO [${mjSchema}].[EntityFieldValue]
                                       ([ID], [EntityFieldID], [Sequence], [Value], [Code], [__mj_CreatedAt], [__mj_UpdatedAt])
                                    VALUES
                                       ('2679c771-cd57-4c46-ab4d-e99d8ec0fda6', '2F526A4F-673F-4182-82B3-6305959954C5', 4, 'PendingRenewal', 'PendingRenewal', GETUTCDATE(), GETUTCDATE());

/* SQL text to insert entity field value with ID eceec1e3-0300-4514-9a6f-6a507920a5af */
INSERT INTO [${mjSchema}].[EntityFieldValue]
                                       ([ID], [EntityFieldID], [Sequence], [Value], [Code], [__mj_CreatedAt], [__mj_UpdatedAt])
                                    VALUES
                                       ('eceec1e3-0300-4514-9a6f-6a507920a5af', '2F526A4F-673F-4182-82B3-6305959954C5', 5, 'Renewed', 'Renewed', GETUTCDATE(), GETUTCDATE());

/* SQL text to update ValueListType for entity field ID 2F526A4F-673F-4182-82B3-6305959954C5 */
UPDATE [${mjSchema}].[EntityField] SET ValueListType='List' WHERE ID='2F526A4F-673F-4182-82B3-6305959954C5';

/* SQL text to insert entity field value with ID 02b6605e-eb03-40de-aa2f-d2b59f2ea608 */
INSERT INTO [${mjSchema}].[EntityFieldValue]
                                       ([ID], [EntityFieldID], [Sequence], [Value], [Code], [__mj_CreatedAt], [__mj_UpdatedAt])
                                    VALUES
                                       ('02b6605e-eb03-40de-aa2f-d2b59f2ea608', '52DEF96D-22AA-4AAC-9752-45561D7B9E6E', 1, 'Corporate', 'Corporate', GETUTCDATE(), GETUTCDATE());

/* SQL text to insert entity field value with ID 2f98ad4c-9188-449e-9bf2-0273137761df */
INSERT INTO [${mjSchema}].[EntityFieldValue]
                                       ([ID], [EntityFieldID], [Sequence], [Value], [Code], [__mj_CreatedAt], [__mj_UpdatedAt])
                                    VALUES
                                       ('2f98ad4c-9188-449e-9bf2-0273137761df', '52DEF96D-22AA-4AAC-9752-45561D7B9E6E', 2, 'Enthusiast', 'Enthusiast', GETUTCDATE(), GETUTCDATE());

/* SQL text to insert entity field value with ID b2140dcc-749f-41fc-ae3e-3a01cb78504c */
INSERT INTO [${mjSchema}].[EntityFieldValue]
                                       ([ID], [EntityFieldID], [Sequence], [Value], [Code], [__mj_CreatedAt], [__mj_UpdatedAt])
                                    VALUES
                                       ('b2140dcc-749f-41fc-ae3e-3a01cb78504c', '52DEF96D-22AA-4AAC-9752-45561D7B9E6E', 3, 'Individual', 'Individual', GETUTCDATE(), GETUTCDATE());

/* SQL text to insert entity field value with ID 81c75e22-fdf1-458e-935d-bd5124919abe */
INSERT INTO [${mjSchema}].[EntityFieldValue]
                                       ([ID], [EntityFieldID], [Sequence], [Value], [Code], [__mj_CreatedAt], [__mj_UpdatedAt])
                                    VALUES
                                       ('81c75e22-fdf1-458e-935d-bd5124919abe', '52DEF96D-22AA-4AAC-9752-45561D7B9E6E', 4, 'SmallBusiness', 'SmallBusiness', GETUTCDATE(), GETUTCDATE());

/* SQL text to update ValueListType for entity field ID 52DEF96D-22AA-4AAC-9752-45561D7B9E6E */
UPDATE [${mjSchema}].[EntityField] SET ValueListType='List' WHERE ID='52DEF96D-22AA-4AAC-9752-45561D7B9E6E';


/* Create Entity Relationship: MoreCheese: Certifications -> MoreCheese: Member Certifications (One To Many via CertificationID) */
   IF NOT EXISTS (
      SELECT 1 FROM [${mjSchema}].[EntityRelationship] WHERE [ID] = '0dc8814f-acc4-44bc-b3c9-8709a2ea6e31'
   )
   BEGIN
      INSERT INTO [${mjSchema}].[EntityRelationship] ([ID], [EntityID], [RelatedEntityID], [RelatedEntityJoinField], [Type], [BundleInAPI], [DisplayInForm], [Sequence], [__mj_CreatedAt], [__mj_UpdatedAt])
                    VALUES ('0dc8814f-acc4-44bc-b3c9-8709a2ea6e31', '141E023A-18C1-4C84-962C-2BD1ABF0627F', 'DCB0400A-EC0A-4551-BAEA-50B515C3C59C', 'CertificationID', 'One To Many', 1, 1, 1, GETUTCDATE(), GETUTCDATE())
   END;
                    
/* Create Entity Relationship: MJ_BizApps_Common: Organizations -> MoreCheese: Organization Profiles (One To Many via OrganizationID) */
   IF NOT EXISTS (
      SELECT 1 FROM [${mjSchema}].[EntityRelationship] WHERE [ID] = '68e6ded9-d4b0-40f4-9823-2bc1b2d814ad'
   )
   BEGIN
      INSERT INTO [${mjSchema}].[EntityRelationship] ([ID], [EntityID], [RelatedEntityID], [RelatedEntityJoinField], [Type], [BundleInAPI], [DisplayInForm], [Sequence], [__mj_CreatedAt], [__mj_UpdatedAt])
                    VALUES ('68e6ded9-d4b0-40f4-9823-2bc1b2d814ad', 'C70448F9-9792-41D7-A82C-784B66429D54', 'A820FA5A-520E-4058-92D8-33C5AEC0FEC5', 'OrganizationID', 'One To Many', 1, 1, 17, GETUTCDATE(), GETUTCDATE())
   END;
                    
/* Create Entity Relationship: MJ_BizApps_Common: Organizations -> MoreCheese: Member Profiles (One To Many via OrganizationID) */
   IF NOT EXISTS (
      SELECT 1 FROM [${mjSchema}].[EntityRelationship] WHERE [ID] = 'a78c8fb0-2baf-4aab-82db-cdb94549e850'
   )
   BEGIN
      INSERT INTO [${mjSchema}].[EntityRelationship] ([ID], [EntityID], [RelatedEntityID], [RelatedEntityJoinField], [Type], [BundleInAPI], [DisplayInForm], [Sequence], [__mj_CreatedAt], [__mj_UpdatedAt])
                    VALUES ('a78c8fb0-2baf-4aab-82db-cdb94549e850', 'C70448F9-9792-41D7-A82C-784B66429D54', '70C724C9-B518-4D81-81B0-BE7F4962B63A', 'OrganizationID', 'One To Many', 1, 1, 18, GETUTCDATE(), GETUTCDATE())
   END;
                    
/* Create Entity Relationship: MJ_BizApps_Common: Organizations -> MoreCheese: Competition Entries (One To Many via OrganizationID) */
   IF NOT EXISTS (
      SELECT 1 FROM [${mjSchema}].[EntityRelationship] WHERE [ID] = '55fa949f-4426-4692-9b2d-939e2e53afe2'
   )
   BEGIN
      INSERT INTO [${mjSchema}].[EntityRelationship] ([ID], [EntityID], [RelatedEntityID], [RelatedEntityJoinField], [Type], [BundleInAPI], [DisplayInForm], [Sequence], [__mj_CreatedAt], [__mj_UpdatedAt])
                    VALUES ('55fa949f-4426-4692-9b2d-939e2e53afe2', 'C70448F9-9792-41D7-A82C-784B66429D54', '2F328DE1-F9F5-402D-B085-AC41EBDE9F77', 'OrganizationID', 'One To Many', 1, 1, 19, GETUTCDATE(), GETUTCDATE())
   END;
                    
/* Create Entity Relationship: MJ_BizApps_Common: Organizations -> MoreCheese: Data Quality Labels (One To Many via RelatedOrganizationID) */
   IF NOT EXISTS (
      SELECT 1 FROM [${mjSchema}].[EntityRelationship] WHERE [ID] = '8b690025-ab04-4478-bf07-5526aadb7163'
   )
   BEGIN
      INSERT INTO [${mjSchema}].[EntityRelationship] ([ID], [EntityID], [RelatedEntityID], [RelatedEntityJoinField], [Type], [BundleInAPI], [DisplayInForm], [Sequence], [__mj_CreatedAt], [__mj_UpdatedAt])
                    VALUES ('8b690025-ab04-4478-bf07-5526aadb7163', 'C70448F9-9792-41D7-A82C-784B66429D54', '50B6FD43-6669-41A0-8DBA-FB23C3B8C753', 'RelatedOrganizationID', 'One To Many', 1, 1, 20, GETUTCDATE(), GETUTCDATE())
   END;


/* Create Entity Relationship: MoreCheese: Events -> MoreCheese: Event Registrations (One To Many via EventID) */
   IF NOT EXISTS (
      SELECT 1 FROM [${mjSchema}].[EntityRelationship] WHERE [ID] = '8f3b8532-2aa8-44e2-9b17-51a42e35a852'
   )
   BEGIN
      INSERT INTO [${mjSchema}].[EntityRelationship] ([ID], [EntityID], [RelatedEntityID], [RelatedEntityJoinField], [Type], [BundleInAPI], [DisplayInForm], [Sequence], [__mj_CreatedAt], [__mj_UpdatedAt])
                    VALUES ('8f3b8532-2aa8-44e2-9b17-51a42e35a852', 'DD32D132-F9BB-4FFB-87C2-839FBC1A7B7F', 'CD3EBECE-BFBE-485C-8FF4-8744A030FE07', 'EventID', 'One To Many', 1, 1, 1, GETUTCDATE(), GETUTCDATE())
   END;
                    
/* Create Entity Relationship: MoreCheese: Courses -> MoreCheese: Course Enrollments (One To Many via CourseID) */
   IF NOT EXISTS (
      SELECT 1 FROM [${mjSchema}].[EntityRelationship] WHERE [ID] = '8092079c-18fe-4640-96c0-1b6b83ff3cef'
   )
   BEGIN
      INSERT INTO [${mjSchema}].[EntityRelationship] ([ID], [EntityID], [RelatedEntityID], [RelatedEntityJoinField], [Type], [BundleInAPI], [DisplayInForm], [Sequence], [__mj_CreatedAt], [__mj_UpdatedAt])
                    VALUES ('8092079c-18fe-4640-96c0-1b6b83ff3cef', '63F9789F-C8CB-4573-91E6-DAF670C4D3B7', 'B8FBEFC1-9B31-4A45-A86B-71BA5D4FE3EC', 'CourseID', 'One To Many', 1, 1, 1, GETUTCDATE(), GETUTCDATE())
   END;
                    
/* Create Entity Relationship: MJ_BizApps_Common: People -> MoreCheese: Course Enrollments (One To Many via PersonID) */
   IF NOT EXISTS (
      SELECT 1 FROM [${mjSchema}].[EntityRelationship] WHERE [ID] = 'd8ffa275-bf2a-4ef7-b993-1f52db7985c6'
   )
   BEGIN
      INSERT INTO [${mjSchema}].[EntityRelationship] ([ID], [EntityID], [RelatedEntityID], [RelatedEntityJoinField], [Type], [BundleInAPI], [DisplayInForm], [Sequence], [__mj_CreatedAt], [__mj_UpdatedAt])
                    VALUES ('d8ffa275-bf2a-4ef7-b993-1f52db7985c6', '7A94ADA9-7880-4FAE-97D8-DB0E934C3F5F', 'B8FBEFC1-9B31-4A45-A86B-71BA5D4FE3EC', 'PersonID', 'One To Many', 1, 1, 28, GETUTCDATE(), GETUTCDATE())
   END;
                    
/* Create Entity Relationship: MJ_BizApps_Common: People -> MoreCheese: Event Registrations (One To Many via PersonID) */
   IF NOT EXISTS (
      SELECT 1 FROM [${mjSchema}].[EntityRelationship] WHERE [ID] = '8ed46951-2198-4e1f-a1b2-e78e0f355cb8'
   )
   BEGIN
      INSERT INTO [${mjSchema}].[EntityRelationship] ([ID], [EntityID], [RelatedEntityID], [RelatedEntityJoinField], [Type], [BundleInAPI], [DisplayInForm], [Sequence], [__mj_CreatedAt], [__mj_UpdatedAt])
                    VALUES ('8ed46951-2198-4e1f-a1b2-e78e0f355cb8', '7A94ADA9-7880-4FAE-97D8-DB0E934C3F5F', 'CD3EBECE-BFBE-485C-8FF4-8744A030FE07', 'PersonID', 'One To Many', 1, 1, 29, GETUTCDATE(), GETUTCDATE())
   END;
                    
/* Create Entity Relationship: MJ_BizApps_Common: People -> MoreCheese: Advocacy Actions (One To Many via PersonID) */
   IF NOT EXISTS (
      SELECT 1 FROM [${mjSchema}].[EntityRelationship] WHERE [ID] = '66014f7d-3f88-4f5d-95bf-2eb86282daec'
   )
   BEGIN
      INSERT INTO [${mjSchema}].[EntityRelationship] ([ID], [EntityID], [RelatedEntityID], [RelatedEntityJoinField], [Type], [BundleInAPI], [DisplayInForm], [Sequence], [__mj_CreatedAt], [__mj_UpdatedAt])
                    VALUES ('66014f7d-3f88-4f5d-95bf-2eb86282daec', '7A94ADA9-7880-4FAE-97D8-DB0E934C3F5F', 'A39CF933-ACC1-4178-8BBA-8B2B02BB40F5', 'PersonID', 'One To Many', 1, 1, 30, GETUTCDATE(), GETUTCDATE())
   END;


/* Create Entity Relationship: MJ_BizApps_Common: People -> MoreCheese: Member Certifications (One To Many via PersonID) */
   IF NOT EXISTS (
      SELECT 1 FROM [${mjSchema}].[EntityRelationship] WHERE [ID] = 'dff7fa83-4832-486a-80c5-819866d64e5d'
   )
   BEGIN
      INSERT INTO [${mjSchema}].[EntityRelationship] ([ID], [EntityID], [RelatedEntityID], [RelatedEntityJoinField], [Type], [BundleInAPI], [DisplayInForm], [Sequence], [__mj_CreatedAt], [__mj_UpdatedAt])
                    VALUES ('dff7fa83-4832-486a-80c5-819866d64e5d', '7A94ADA9-7880-4FAE-97D8-DB0E934C3F5F', 'DCB0400A-EC0A-4551-BAEA-50B515C3C59C', 'PersonID', 'One To Many', 1, 1, 31, GETUTCDATE(), GETUTCDATE())
   END;
                    
/* Create Entity Relationship: MJ_BizApps_Common: People -> MoreCheese: Membership Periods (One To Many via PersonID) */
   IF NOT EXISTS (
      SELECT 1 FROM [${mjSchema}].[EntityRelationship] WHERE [ID] = '47c6b3d8-cf17-4882-9753-eafc24ab374c'
   )
   BEGIN
      INSERT INTO [${mjSchema}].[EntityRelationship] ([ID], [EntityID], [RelatedEntityID], [RelatedEntityJoinField], [Type], [BundleInAPI], [DisplayInForm], [Sequence], [__mj_CreatedAt], [__mj_UpdatedAt])
                    VALUES ('47c6b3d8-cf17-4882-9753-eafc24ab374c', '7A94ADA9-7880-4FAE-97D8-DB0E934C3F5F', '6585D210-BD5A-44E2-BD90-0D425734DCF0', 'PersonID', 'One To Many', 1, 1, 32, GETUTCDATE(), GETUTCDATE())
   END;
                    
/* Create Entity Relationship: MJ_BizApps_Common: People -> MoreCheese: Competition Entries (One To Many via PersonID) */
   IF NOT EXISTS (
      SELECT 1 FROM [${mjSchema}].[EntityRelationship] WHERE [ID] = '7e60e955-0f25-4869-ba7b-875951e49ca4'
   )
   BEGIN
      INSERT INTO [${mjSchema}].[EntityRelationship] ([ID], [EntityID], [RelatedEntityID], [RelatedEntityJoinField], [Type], [BundleInAPI], [DisplayInForm], [Sequence], [__mj_CreatedAt], [__mj_UpdatedAt])
                    VALUES ('7e60e955-0f25-4869-ba7b-875951e49ca4', '7A94ADA9-7880-4FAE-97D8-DB0E934C3F5F', '2F328DE1-F9F5-402D-B085-AC41EBDE9F77', 'PersonID', 'One To Many', 1, 1, 33, GETUTCDATE(), GETUTCDATE())
   END;
                    
/* Create Entity Relationship: MJ_BizApps_Common: People -> MoreCheese: Member Profiles (One To Many via PersonID) */
   IF NOT EXISTS (
      SELECT 1 FROM [${mjSchema}].[EntityRelationship] WHERE [ID] = 'fadb3f6c-8263-4cd7-8da7-0c5e0caf41ec'
   )
   BEGIN
      INSERT INTO [${mjSchema}].[EntityRelationship] ([ID], [EntityID], [RelatedEntityID], [RelatedEntityJoinField], [Type], [BundleInAPI], [DisplayInForm], [Sequence], [__mj_CreatedAt], [__mj_UpdatedAt])
                    VALUES ('fadb3f6c-8263-4cd7-8da7-0c5e0caf41ec', '7A94ADA9-7880-4FAE-97D8-DB0E934C3F5F', '70C724C9-B518-4D81-81B0-BE7F4962B63A', 'PersonID', 'One To Many', 1, 1, 34, GETUTCDATE(), GETUTCDATE())
   END;
                    
/* Create Entity Relationship: MJ_BizApps_Common: People -> MoreCheese: Data Quality Labels (One To Many via RelatedPersonID) */
   IF NOT EXISTS (
      SELECT 1 FROM [${mjSchema}].[EntityRelationship] WHERE [ID] = 'fe1d632d-ff87-4c4c-a783-78211b88cd9d'
   )
   BEGIN
      INSERT INTO [${mjSchema}].[EntityRelationship] ([ID], [EntityID], [RelatedEntityID], [RelatedEntityJoinField], [Type], [BundleInAPI], [DisplayInForm], [Sequence], [__mj_CreatedAt], [__mj_UpdatedAt])
                    VALUES ('fe1d632d-ff87-4c4c-a783-78211b88cd9d', '7A94ADA9-7880-4FAE-97D8-DB0E934C3F5F', '50B6FD43-6669-41A0-8DBA-FB23C3B8C753', 'RelatedPersonID', 'One To Many', 1, 1, 35, GETUTCDATE(), GETUTCDATE())
   END;
                    
/* Create Entity Relationship: MJ_BizApps_Common: People -> MoreCheese: Data Quality Labels (One To Many via PersonID) */
   IF NOT EXISTS (
      SELECT 1 FROM [${mjSchema}].[EntityRelationship] WHERE [ID] = '7e1860f6-a071-436a-a3be-9cd7e37c997c'
   )
   BEGIN
      INSERT INTO [${mjSchema}].[EntityRelationship] ([ID], [EntityID], [RelatedEntityID], [RelatedEntityJoinField], [Type], [BundleInAPI], [DisplayInForm], [Sequence], [__mj_CreatedAt], [__mj_UpdatedAt])
                    VALUES ('7e1860f6-a071-436a-a3be-9cd7e37c997c', '7A94ADA9-7880-4FAE-97D8-DB0E934C3F5F', '50B6FD43-6669-41A0-8DBA-FB23C3B8C753', 'PersonID', 'One To Many', 1, 1, 36, GETUTCDATE(), GETUTCDATE())
   END;

/* SQL text to sync schema info from database schemas */
EXEC [${mjSchema}].[spUpdateSchemaInfoFromDatabase] @ExcludedSchemaNames='sys,staging,${mjSchema}', @IncludedSchemaNames='${flyway:defaultSchema},morecheese_events,morecheese_learning';

/* Index for Foreign Keys for AdvocacyAction */
-----------------------------------------------------------------
-- SQL Code Generation
-- Entity: MoreCheese: Advocacy Actions
-- Item: Index for Foreign Keys
--
-- This was generated by the MemberJunction CodeGen tool.
-- This file should NOT be edited by hand.
-----------------------------------------------------------------
-- Index for foreign key PersonID in table AdvocacyAction
IF NOT EXISTS (
    SELECT 1
    FROM sys.indexes
    WHERE name = 'IDX_AUTO_MJ_FKEY_AdvocacyAction_PersonID' 
    AND object_id = OBJECT_ID('[${flyway:defaultSchema}].[AdvocacyAction]')
)
CREATE INDEX IDX_AUTO_MJ_FKEY_AdvocacyAction_PersonID ON [${flyway:defaultSchema}].[AdvocacyAction] ([PersonID]);

/* SQL text to update entity field related entity name field map for entity field ID 5F22645F-1907-4046-88D7-C46C66B38AC7 */
EXEC [${mjSchema}].[spUpdateEntityFieldRelatedEntityNameFieldMap] @EntityFieldID='5F22645F-1907-4046-88D7-C46C66B38AC7', @RelatedEntityNameFieldMap='Person';

/* Index for Foreign Keys for Certification */
-----------------------------------------------------------------
-- SQL Code Generation
-- Entity: MoreCheese: Certifications
-- Item: Index for Foreign Keys
--
-- This was generated by the MemberJunction CodeGen tool.
-- This file should NOT be edited by hand.
-----------------------------------------------------------------;

/* Index for Foreign Keys for CompetitionEntry */
-----------------------------------------------------------------
-- SQL Code Generation
-- Entity: MoreCheese: Competition Entries
-- Item: Index for Foreign Keys
--
-- This was generated by the MemberJunction CodeGen tool.
-- This file should NOT be edited by hand.
-----------------------------------------------------------------
-- Index for foreign key PersonID in table CompetitionEntry
IF NOT EXISTS (
    SELECT 1
    FROM sys.indexes
    WHERE name = 'IDX_AUTO_MJ_FKEY_CompetitionEntry_PersonID' 
    AND object_id = OBJECT_ID('[morecheese_events].[CompetitionEntry]')
)
CREATE INDEX IDX_AUTO_MJ_FKEY_CompetitionEntry_PersonID ON [morecheese_events].[CompetitionEntry] ([PersonID]);

-- Index for foreign key OrganizationID in table CompetitionEntry
IF NOT EXISTS (
    SELECT 1
    FROM sys.indexes
    WHERE name = 'IDX_AUTO_MJ_FKEY_CompetitionEntry_OrganizationID' 
    AND object_id = OBJECT_ID('[morecheese_events].[CompetitionEntry]')
)
CREATE INDEX IDX_AUTO_MJ_FKEY_CompetitionEntry_OrganizationID ON [morecheese_events].[CompetitionEntry] ([OrganizationID]);

/* SQL text to update entity field related entity name field map for entity field ID 7C41F425-787F-4150-BD51-22F030BAAB5D */
EXEC [${mjSchema}].[spUpdateEntityFieldRelatedEntityNameFieldMap] @EntityFieldID='7C41F425-787F-4150-BD51-22F030BAAB5D', @RelatedEntityNameFieldMap='Person';

/* Index for Foreign Keys for CourseEnrollment */
-----------------------------------------------------------------
-- SQL Code Generation
-- Entity: MoreCheese: Course Enrollments
-- Item: Index for Foreign Keys
--
-- This was generated by the MemberJunction CodeGen tool.
-- This file should NOT be edited by hand.
-----------------------------------------------------------------
-- Index for foreign key PersonID in table CourseEnrollment
IF NOT EXISTS (
    SELECT 1
    FROM sys.indexes
    WHERE name = 'IDX_AUTO_MJ_FKEY_CourseEnrollment_PersonID' 
    AND object_id = OBJECT_ID('[morecheese_learning].[CourseEnrollment]')
)
CREATE INDEX IDX_AUTO_MJ_FKEY_CourseEnrollment_PersonID ON [morecheese_learning].[CourseEnrollment] ([PersonID]);

-- Index for foreign key CourseID in table CourseEnrollment
IF NOT EXISTS (
    SELECT 1
    FROM sys.indexes
    WHERE name = 'IDX_AUTO_MJ_FKEY_CourseEnrollment_CourseID' 
    AND object_id = OBJECT_ID('[morecheese_learning].[CourseEnrollment]')
)
CREATE INDEX IDX_AUTO_MJ_FKEY_CourseEnrollment_CourseID ON [morecheese_learning].[CourseEnrollment] ([CourseID]);

/* SQL text to update entity field related entity name field map for entity field ID FB431899-DB6B-440E-A794-C89EE53CCD62 */
EXEC [${mjSchema}].[spUpdateEntityFieldRelatedEntityNameFieldMap] @EntityFieldID='FB431899-DB6B-440E-A794-C89EE53CCD62', @RelatedEntityNameFieldMap='Person';

/* Index for Foreign Keys for Course */
-----------------------------------------------------------------
-- SQL Code Generation
-- Entity: MoreCheese: Courses
-- Item: Index for Foreign Keys
--
-- This was generated by the MemberJunction CodeGen tool.
-- This file should NOT be edited by hand.
-----------------------------------------------------------------;

/* Index for Foreign Keys for DataQualityLabel */
-----------------------------------------------------------------
-- SQL Code Generation
-- Entity: MoreCheese: Data Quality Labels
-- Item: Index for Foreign Keys
--
-- This was generated by the MemberJunction CodeGen tool.
-- This file should NOT be edited by hand.
-----------------------------------------------------------------
-- Index for foreign key PersonID in table DataQualityLabel
IF NOT EXISTS (
    SELECT 1
    FROM sys.indexes
    WHERE name = 'IDX_AUTO_MJ_FKEY_DataQualityLabel_PersonID' 
    AND object_id = OBJECT_ID('[${flyway:defaultSchema}].[DataQualityLabel]')
)
CREATE INDEX IDX_AUTO_MJ_FKEY_DataQualityLabel_PersonID ON [${flyway:defaultSchema}].[DataQualityLabel] ([PersonID]);

-- Index for foreign key RelatedPersonID in table DataQualityLabel
IF NOT EXISTS (
    SELECT 1
    FROM sys.indexes
    WHERE name = 'IDX_AUTO_MJ_FKEY_DataQualityLabel_RelatedPersonID' 
    AND object_id = OBJECT_ID('[${flyway:defaultSchema}].[DataQualityLabel]')
)
CREATE INDEX IDX_AUTO_MJ_FKEY_DataQualityLabel_RelatedPersonID ON [${flyway:defaultSchema}].[DataQualityLabel] ([RelatedPersonID]);

-- Index for foreign key RelatedOrganizationID in table DataQualityLabel
IF NOT EXISTS (
    SELECT 1
    FROM sys.indexes
    WHERE name = 'IDX_AUTO_MJ_FKEY_DataQualityLabel_RelatedOrganizationID' 
    AND object_id = OBJECT_ID('[${flyway:defaultSchema}].[DataQualityLabel]')
)
CREATE INDEX IDX_AUTO_MJ_FKEY_DataQualityLabel_RelatedOrganizationID ON [${flyway:defaultSchema}].[DataQualityLabel] ([RelatedOrganizationID]);

/* SQL text to update entity field related entity name field map for entity field ID B232382D-AD14-4662-A1E6-0C28E1B9993C */
EXEC [${mjSchema}].[spUpdateEntityFieldRelatedEntityNameFieldMap] @EntityFieldID='B232382D-AD14-4662-A1E6-0C28E1B9993C', @RelatedEntityNameFieldMap='Person';

/* Index for Foreign Keys for EventRegistration */
-----------------------------------------------------------------
-- SQL Code Generation
-- Entity: MoreCheese: Event Registrations
-- Item: Index for Foreign Keys
--
-- This was generated by the MemberJunction CodeGen tool.
-- This file should NOT be edited by hand.
-----------------------------------------------------------------
-- Index for foreign key PersonID in table EventRegistration
IF NOT EXISTS (
    SELECT 1
    FROM sys.indexes
    WHERE name = 'IDX_AUTO_MJ_FKEY_EventRegistration_PersonID' 
    AND object_id = OBJECT_ID('[morecheese_events].[EventRegistration]')
)
CREATE INDEX IDX_AUTO_MJ_FKEY_EventRegistration_PersonID ON [morecheese_events].[EventRegistration] ([PersonID]);

-- Index for foreign key EventID in table EventRegistration
IF NOT EXISTS (
    SELECT 1
    FROM sys.indexes
    WHERE name = 'IDX_AUTO_MJ_FKEY_EventRegistration_EventID' 
    AND object_id = OBJECT_ID('[morecheese_events].[EventRegistration]')
)
CREATE INDEX IDX_AUTO_MJ_FKEY_EventRegistration_EventID ON [morecheese_events].[EventRegistration] ([EventID]);

/* SQL text to update entity field related entity name field map for entity field ID FFBE607F-1C69-40E4-905B-871162E0EF56 */
EXEC [${mjSchema}].[spUpdateEntityFieldRelatedEntityNameFieldMap] @EntityFieldID='FFBE607F-1C69-40E4-905B-871162E0EF56', @RelatedEntityNameFieldMap='Person';

/* Index for Foreign Keys for Event */
-----------------------------------------------------------------
-- SQL Code Generation
-- Entity: MoreCheese: Events
-- Item: Index for Foreign Keys
--
-- This was generated by the MemberJunction CodeGen tool.
-- This file should NOT be edited by hand.
-----------------------------------------------------------------;

/* Base View SQL for MoreCheese: Certifications */
-----------------------------------------------------------------
-- SQL Code Generation
-- Entity: MoreCheese: Certifications
-- Item: vwCertifications
--
-- This was generated by the MemberJunction CodeGen tool.
-- This file should NOT be edited by hand.
-----------------------------------------------------------------

------------------------------------------------------------
----- BASE VIEW FOR ENTITY:      MoreCheese: Certifications
-----               SCHEMA:      morecheese_learning
-----               BASE TABLE:  Certification
-----               PRIMARY KEY: ID
------------------------------------------------------------
IF OBJECT_ID('[morecheese_learning].[vwCertifications]', 'V') IS NOT NULL
    DROP VIEW [morecheese_learning].[vwCertifications];
GO

CREATE VIEW [morecheese_learning].[vwCertifications]
AS
SELECT
    c.*
FROM
    [morecheese_learning].[Certification] AS c
GO
GRANT SELECT ON [morecheese_learning].[vwCertifications] TO [cdp_UI], [cdp_Developer], [cdp_Integration];

/* Base View Permissions SQL for MoreCheese: Certifications */
-----------------------------------------------------------------
-- SQL Code Generation
-- Entity: MoreCheese: Certifications
-- Item: Permissions for vwCertifications
--
-- This was generated by the MemberJunction CodeGen tool.
-- This file should NOT be edited by hand.
-----------------------------------------------------------------

GRANT SELECT ON [morecheese_learning].[vwCertifications] TO [cdp_UI], [cdp_Developer], [cdp_Integration];

/* spCreate SQL for MoreCheese: Certifications */
-----------------------------------------------------------------
-- SQL Code Generation
-- Entity: MoreCheese: Certifications
-- Item: spCreateCertification
--
-- This was generated by the MemberJunction CodeGen tool.
-- This file should NOT be edited by hand.
-----------------------------------------------------------------

------------------------------------------------------------
----- CREATE PROCEDURE FOR Certification
------------------------------------------------------------
IF OBJECT_ID('[morecheese_learning].[spCreateCertification]', 'P') IS NOT NULL
    DROP PROCEDURE [morecheese_learning].[spCreateCertification];
GO

CREATE PROCEDURE [morecheese_learning].[spCreateCertification]
    @ID uniqueidentifier = NULL,
    @CertKey nvarchar(50),
    @Name nvarchar(200),
    @Description_Clear bit = 0,
    @Description nvarchar(MAX) = NULL,
    @ValidYears int = NULL,
    @IsSharedDemo bit = NULL
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @InsertedRow TABLE ([ID] UNIQUEIDENTIFIER)

    IF @ID IS NOT NULL
    BEGIN
        -- User provided a value, use it
        INSERT INTO [morecheese_learning].[Certification]
            (
                [ID],
                [CertKey],
                [Name],
                [Description],
                [ValidYears],
                [IsSharedDemo]
            )
        OUTPUT INSERTED.[ID] INTO @InsertedRow
        VALUES
            (
                @ID,
                @CertKey,
                @Name,
                CASE WHEN @Description_Clear = 1 THEN NULL ELSE ISNULL(@Description, NULL) END,
                ISNULL(@ValidYears, 3),
                ISNULL(@IsSharedDemo, 1)
            )
    END
    ELSE
    BEGIN
        -- No value provided, let database use its default (e.g., NEWSEQUENTIALID())
        INSERT INTO [morecheese_learning].[Certification]
            (
                [CertKey],
                [Name],
                [Description],
                [ValidYears],
                [IsSharedDemo]
            )
        OUTPUT INSERTED.[ID] INTO @InsertedRow
        VALUES
            (
                @CertKey,
                @Name,
                CASE WHEN @Description_Clear = 1 THEN NULL ELSE ISNULL(@Description, NULL) END,
                ISNULL(@ValidYears, 3),
                ISNULL(@IsSharedDemo, 1)
            )
    END
    -- return the new record from the base view, which might have some calculated fields
    SELECT * FROM [morecheese_learning].[vwCertifications] WHERE [ID] = (SELECT [ID] FROM @InsertedRow)
END
GO
GRANT EXECUTE ON [morecheese_learning].[spCreateCertification] TO [cdp_Developer], [cdp_Integration];

/* spCreate Permissions for MoreCheese: Certifications */

GRANT EXECUTE ON [morecheese_learning].[spCreateCertification] TO [cdp_Developer], [cdp_Integration];

/* spUpdate SQL for MoreCheese: Certifications */
-----------------------------------------------------------------
-- SQL Code Generation
-- Entity: MoreCheese: Certifications
-- Item: spUpdateCertification
--
-- This was generated by the MemberJunction CodeGen tool.
-- This file should NOT be edited by hand.
-----------------------------------------------------------------

------------------------------------------------------------
----- UPDATE PROCEDURE FOR Certification
------------------------------------------------------------
IF OBJECT_ID('[morecheese_learning].[spUpdateCertification]', 'P') IS NOT NULL
    DROP PROCEDURE [morecheese_learning].[spUpdateCertification];
GO

CREATE PROCEDURE [morecheese_learning].[spUpdateCertification]
    @ID uniqueidentifier,
    @CertKey nvarchar(50) = NULL,
    @Name nvarchar(200) = NULL,
    @Description_Clear bit = 0,
    @Description nvarchar(MAX) = NULL,
    @ValidYears int = NULL,
    @IsSharedDemo bit = NULL
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE
        [morecheese_learning].[Certification]
    SET
        [CertKey] = ISNULL(@CertKey, [CertKey]),
        [Name] = ISNULL(@Name, [Name]),
        [Description] = CASE WHEN @Description_Clear = 1 THEN NULL ELSE ISNULL(@Description, [Description]) END,
        [ValidYears] = ISNULL(@ValidYears, [ValidYears]),
        [IsSharedDemo] = ISNULL(@IsSharedDemo, [IsSharedDemo])
    WHERE
        [ID] = @ID

    -- Check if the update was successful
    IF @@ROWCOUNT = 0
        -- Nothing was updated, return no rows, but column structure from base view intact, semantically correct this way.
        SELECT TOP 0 * FROM [morecheese_learning].[vwCertifications] WHERE 1=0
    ELSE
        -- Return the updated record so the caller can see the updated values and any calculated fields
        SELECT
                                        *
                                    FROM
                                        [morecheese_learning].[vwCertifications]
                                    WHERE
                                        [ID] = @ID
                                    
END
GO

GRANT EXECUTE ON [morecheese_learning].[spUpdateCertification] TO [cdp_Developer], [cdp_Integration]
GO

------------------------------------------------------------
----- TRIGGER FOR __mj_UpdatedAt field for the Certification table
------------------------------------------------------------
IF OBJECT_ID('[morecheese_learning].[trgUpdateCertification]', 'TR') IS NOT NULL
    DROP TRIGGER [morecheese_learning].[trgUpdateCertification];
GO
CREATE TRIGGER [morecheese_learning].trgUpdateCertification
ON [morecheese_learning].[Certification]
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE
        [morecheese_learning].[Certification]
    SET
        __mj_UpdatedAt = GETUTCDATE()
    FROM
        [morecheese_learning].[Certification] AS _organicTable
    INNER JOIN
        INSERTED AS I ON
        _organicTable.[ID] = I.[ID];
END;
GO

/* spUpdate Permissions for MoreCheese: Certifications */

GRANT EXECUTE ON [morecheese_learning].[spUpdateCertification] TO [cdp_Developer], [cdp_Integration];

/* Base View SQL for MoreCheese: Courses */
-----------------------------------------------------------------
-- SQL Code Generation
-- Entity: MoreCheese: Courses
-- Item: vwCourses
--
-- This was generated by the MemberJunction CodeGen tool.
-- This file should NOT be edited by hand.
-----------------------------------------------------------------

------------------------------------------------------------
----- BASE VIEW FOR ENTITY:      MoreCheese: Courses
-----               SCHEMA:      morecheese_learning
-----               BASE TABLE:  Course
-----               PRIMARY KEY: ID
------------------------------------------------------------
IF OBJECT_ID('[morecheese_learning].[vwCourses]', 'V') IS NOT NULL
    DROP VIEW [morecheese_learning].[vwCourses];
GO

CREATE VIEW [morecheese_learning].[vwCourses]
AS
SELECT
    c.*
FROM
    [morecheese_learning].[Course] AS c
GO
GRANT SELECT ON [morecheese_learning].[vwCourses] TO [cdp_UI], [cdp_Developer], [cdp_Integration];

/* Base View Permissions SQL for MoreCheese: Courses */
-----------------------------------------------------------------
-- SQL Code Generation
-- Entity: MoreCheese: Courses
-- Item: Permissions for vwCourses
--
-- This was generated by the MemberJunction CodeGen tool.
-- This file should NOT be edited by hand.
-----------------------------------------------------------------

GRANT SELECT ON [morecheese_learning].[vwCourses] TO [cdp_UI], [cdp_Developer], [cdp_Integration];

/* spCreate SQL for MoreCheese: Courses */
-----------------------------------------------------------------
-- SQL Code Generation
-- Entity: MoreCheese: Courses
-- Item: spCreateCourse
--
-- This was generated by the MemberJunction CodeGen tool.
-- This file should NOT be edited by hand.
-----------------------------------------------------------------

------------------------------------------------------------
----- CREATE PROCEDURE FOR Course
------------------------------------------------------------
IF OBJECT_ID('[morecheese_learning].[spCreateCourse]', 'P') IS NOT NULL
    DROP PROCEDURE [morecheese_learning].[spCreateCourse];
GO

CREATE PROCEDURE [morecheese_learning].[spCreateCourse]
    @ID uniqueidentifier = NULL,
    @CourseKey nvarchar(50),
    @Name nvarchar(200),
    @StartDate date,
    @DurationWeeks int,
    @IsSharedDemo bit = NULL
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @InsertedRow TABLE ([ID] UNIQUEIDENTIFIER)

    IF @ID IS NOT NULL
    BEGIN
        -- User provided a value, use it
        INSERT INTO [morecheese_learning].[Course]
            (
                [ID],
                [CourseKey],
                [Name],
                [StartDate],
                [DurationWeeks],
                [IsSharedDemo]
            )
        OUTPUT INSERTED.[ID] INTO @InsertedRow
        VALUES
            (
                @ID,
                @CourseKey,
                @Name,
                @StartDate,
                @DurationWeeks,
                ISNULL(@IsSharedDemo, 1)
            )
    END
    ELSE
    BEGIN
        -- No value provided, let database use its default (e.g., NEWSEQUENTIALID())
        INSERT INTO [morecheese_learning].[Course]
            (
                [CourseKey],
                [Name],
                [StartDate],
                [DurationWeeks],
                [IsSharedDemo]
            )
        OUTPUT INSERTED.[ID] INTO @InsertedRow
        VALUES
            (
                @CourseKey,
                @Name,
                @StartDate,
                @DurationWeeks,
                ISNULL(@IsSharedDemo, 1)
            )
    END
    -- return the new record from the base view, which might have some calculated fields
    SELECT * FROM [morecheese_learning].[vwCourses] WHERE [ID] = (SELECT [ID] FROM @InsertedRow)
END
GO
GRANT EXECUTE ON [morecheese_learning].[spCreateCourse] TO [cdp_Developer], [cdp_Integration];

/* spCreate Permissions for MoreCheese: Courses */

GRANT EXECUTE ON [morecheese_learning].[spCreateCourse] TO [cdp_Developer], [cdp_Integration];

/* spUpdate SQL for MoreCheese: Courses */
-----------------------------------------------------------------
-- SQL Code Generation
-- Entity: MoreCheese: Courses
-- Item: spUpdateCourse
--
-- This was generated by the MemberJunction CodeGen tool.
-- This file should NOT be edited by hand.
-----------------------------------------------------------------

------------------------------------------------------------
----- UPDATE PROCEDURE FOR Course
------------------------------------------------------------
IF OBJECT_ID('[morecheese_learning].[spUpdateCourse]', 'P') IS NOT NULL
    DROP PROCEDURE [morecheese_learning].[spUpdateCourse];
GO

CREATE PROCEDURE [morecheese_learning].[spUpdateCourse]
    @ID uniqueidentifier,
    @CourseKey nvarchar(50) = NULL,
    @Name nvarchar(200) = NULL,
    @StartDate date = NULL,
    @DurationWeeks int = NULL,
    @IsSharedDemo bit = NULL
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE
        [morecheese_learning].[Course]
    SET
        [CourseKey] = ISNULL(@CourseKey, [CourseKey]),
        [Name] = ISNULL(@Name, [Name]),
        [StartDate] = ISNULL(@StartDate, [StartDate]),
        [DurationWeeks] = ISNULL(@DurationWeeks, [DurationWeeks]),
        [IsSharedDemo] = ISNULL(@IsSharedDemo, [IsSharedDemo])
    WHERE
        [ID] = @ID

    -- Check if the update was successful
    IF @@ROWCOUNT = 0
        -- Nothing was updated, return no rows, but column structure from base view intact, semantically correct this way.
        SELECT TOP 0 * FROM [morecheese_learning].[vwCourses] WHERE 1=0
    ELSE
        -- Return the updated record so the caller can see the updated values and any calculated fields
        SELECT
                                        *
                                    FROM
                                        [morecheese_learning].[vwCourses]
                                    WHERE
                                        [ID] = @ID
                                    
END
GO

GRANT EXECUTE ON [morecheese_learning].[spUpdateCourse] TO [cdp_Developer], [cdp_Integration]
GO

------------------------------------------------------------
----- TRIGGER FOR __mj_UpdatedAt field for the Course table
------------------------------------------------------------
IF OBJECT_ID('[morecheese_learning].[trgUpdateCourse]', 'TR') IS NOT NULL
    DROP TRIGGER [morecheese_learning].[trgUpdateCourse];
GO
CREATE TRIGGER [morecheese_learning].trgUpdateCourse
ON [morecheese_learning].[Course]
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE
        [morecheese_learning].[Course]
    SET
        __mj_UpdatedAt = GETUTCDATE()
    FROM
        [morecheese_learning].[Course] AS _organicTable
    INNER JOIN
        INSERTED AS I ON
        _organicTable.[ID] = I.[ID];
END;
GO

/* spUpdate Permissions for MoreCheese: Courses */

GRANT EXECUTE ON [morecheese_learning].[spUpdateCourse] TO [cdp_Developer], [cdp_Integration];

/* Base View SQL for MoreCheese: Events */
-----------------------------------------------------------------
-- SQL Code Generation
-- Entity: MoreCheese: Events
-- Item: vwEvents
--
-- This was generated by the MemberJunction CodeGen tool.
-- This file should NOT be edited by hand.
-----------------------------------------------------------------

------------------------------------------------------------
----- BASE VIEW FOR ENTITY:      MoreCheese: Events
-----               SCHEMA:      morecheese_events
-----               BASE TABLE:  Event
-----               PRIMARY KEY: ID
------------------------------------------------------------
IF OBJECT_ID('[morecheese_events].[vwEvents]', 'V') IS NOT NULL
    DROP VIEW [morecheese_events].[vwEvents];
GO

CREATE VIEW [morecheese_events].[vwEvents]
AS
SELECT
    e.*
FROM
    [morecheese_events].[Event] AS e
GO
GRANT SELECT ON [morecheese_events].[vwEvents] TO [cdp_UI], [cdp_Developer], [cdp_Integration];

/* Base View Permissions SQL for MoreCheese: Events */
-----------------------------------------------------------------
-- SQL Code Generation
-- Entity: MoreCheese: Events
-- Item: Permissions for vwEvents
--
-- This was generated by the MemberJunction CodeGen tool.
-- This file should NOT be edited by hand.
-----------------------------------------------------------------

GRANT SELECT ON [morecheese_events].[vwEvents] TO [cdp_UI], [cdp_Developer], [cdp_Integration];

/* spCreate SQL for MoreCheese: Events */
-----------------------------------------------------------------
-- SQL Code Generation
-- Entity: MoreCheese: Events
-- Item: spCreateEvent
--
-- This was generated by the MemberJunction CodeGen tool.
-- This file should NOT be edited by hand.
-----------------------------------------------------------------

------------------------------------------------------------
----- CREATE PROCEDURE FOR Event
------------------------------------------------------------
IF OBJECT_ID('[morecheese_events].[spCreateEvent]', 'P') IS NOT NULL
    DROP PROCEDURE [morecheese_events].[spCreateEvent];
GO

CREATE PROCEDURE [morecheese_events].[spCreateEvent]
    @ID uniqueidentifier = NULL,
    @EventKey nvarchar(50),
    @Name nvarchar(200),
    @EventType nvarchar(50),
    @EventDate date,
    @IsVirtual bit = NULL,
    @IsPaid bit = NULL,
    @City_Clear bit = 0,
    @City nvarchar(100) = NULL,
    @State_Clear bit = 0,
    @State nvarchar(50) = NULL,
    @Latitude_Clear bit = 0,
    @Latitude decimal(9, 6) = NULL,
    @Longitude_Clear bit = 0,
    @Longitude decimal(9, 6) = NULL,
    @IsSharedDemo bit = NULL
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @InsertedRow TABLE ([ID] UNIQUEIDENTIFIER)

    IF @ID IS NOT NULL
    BEGIN
        -- User provided a value, use it
        INSERT INTO [morecheese_events].[Event]
            (
                [ID],
                [EventKey],
                [Name],
                [EventType],
                [EventDate],
                [IsVirtual],
                [IsPaid],
                [City],
                [State],
                [Latitude],
                [Longitude],
                [IsSharedDemo]
            )
        OUTPUT INSERTED.[ID] INTO @InsertedRow
        VALUES
            (
                @ID,
                @EventKey,
                @Name,
                @EventType,
                @EventDate,
                ISNULL(@IsVirtual, 0),
                ISNULL(@IsPaid, 0),
                CASE WHEN @City_Clear = 1 THEN NULL ELSE ISNULL(@City, NULL) END,
                CASE WHEN @State_Clear = 1 THEN NULL ELSE ISNULL(@State, NULL) END,
                CASE WHEN @Latitude_Clear = 1 THEN NULL ELSE ISNULL(@Latitude, NULL) END,
                CASE WHEN @Longitude_Clear = 1 THEN NULL ELSE ISNULL(@Longitude, NULL) END,
                ISNULL(@IsSharedDemo, 1)
            )
    END
    ELSE
    BEGIN
        -- No value provided, let database use its default (e.g., NEWSEQUENTIALID())
        INSERT INTO [morecheese_events].[Event]
            (
                [EventKey],
                [Name],
                [EventType],
                [EventDate],
                [IsVirtual],
                [IsPaid],
                [City],
                [State],
                [Latitude],
                [Longitude],
                [IsSharedDemo]
            )
        OUTPUT INSERTED.[ID] INTO @InsertedRow
        VALUES
            (
                @EventKey,
                @Name,
                @EventType,
                @EventDate,
                ISNULL(@IsVirtual, 0),
                ISNULL(@IsPaid, 0),
                CASE WHEN @City_Clear = 1 THEN NULL ELSE ISNULL(@City, NULL) END,
                CASE WHEN @State_Clear = 1 THEN NULL ELSE ISNULL(@State, NULL) END,
                CASE WHEN @Latitude_Clear = 1 THEN NULL ELSE ISNULL(@Latitude, NULL) END,
                CASE WHEN @Longitude_Clear = 1 THEN NULL ELSE ISNULL(@Longitude, NULL) END,
                ISNULL(@IsSharedDemo, 1)
            )
    END
    -- return the new record from the base view, which might have some calculated fields
    SELECT * FROM [morecheese_events].[vwEvents] WHERE [ID] = (SELECT [ID] FROM @InsertedRow)
END
GO
GRANT EXECUTE ON [morecheese_events].[spCreateEvent] TO [cdp_Developer], [cdp_Integration];

/* spCreate Permissions for MoreCheese: Events */

GRANT EXECUTE ON [morecheese_events].[spCreateEvent] TO [cdp_Developer], [cdp_Integration];

/* spUpdate SQL for MoreCheese: Events */
-----------------------------------------------------------------
-- SQL Code Generation
-- Entity: MoreCheese: Events
-- Item: spUpdateEvent
--
-- This was generated by the MemberJunction CodeGen tool.
-- This file should NOT be edited by hand.
-----------------------------------------------------------------

------------------------------------------------------------
----- UPDATE PROCEDURE FOR Event
------------------------------------------------------------
IF OBJECT_ID('[morecheese_events].[spUpdateEvent]', 'P') IS NOT NULL
    DROP PROCEDURE [morecheese_events].[spUpdateEvent];
GO

CREATE PROCEDURE [morecheese_events].[spUpdateEvent]
    @ID uniqueidentifier,
    @EventKey nvarchar(50) = NULL,
    @Name nvarchar(200) = NULL,
    @EventType nvarchar(50) = NULL,
    @EventDate date = NULL,
    @IsVirtual bit = NULL,
    @IsPaid bit = NULL,
    @City_Clear bit = 0,
    @City nvarchar(100) = NULL,
    @State_Clear bit = 0,
    @State nvarchar(50) = NULL,
    @Latitude_Clear bit = 0,
    @Latitude decimal(9, 6) = NULL,
    @Longitude_Clear bit = 0,
    @Longitude decimal(9, 6) = NULL,
    @IsSharedDemo bit = NULL
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE
        [morecheese_events].[Event]
    SET
        [EventKey] = ISNULL(@EventKey, [EventKey]),
        [Name] = ISNULL(@Name, [Name]),
        [EventType] = ISNULL(@EventType, [EventType]),
        [EventDate] = ISNULL(@EventDate, [EventDate]),
        [IsVirtual] = ISNULL(@IsVirtual, [IsVirtual]),
        [IsPaid] = ISNULL(@IsPaid, [IsPaid]),
        [City] = CASE WHEN @City_Clear = 1 THEN NULL ELSE ISNULL(@City, [City]) END,
        [State] = CASE WHEN @State_Clear = 1 THEN NULL ELSE ISNULL(@State, [State]) END,
        [Latitude] = CASE WHEN @Latitude_Clear = 1 THEN NULL ELSE ISNULL(@Latitude, [Latitude]) END,
        [Longitude] = CASE WHEN @Longitude_Clear = 1 THEN NULL ELSE ISNULL(@Longitude, [Longitude]) END,
        [IsSharedDemo] = ISNULL(@IsSharedDemo, [IsSharedDemo])
    WHERE
        [ID] = @ID

    -- Check if the update was successful
    IF @@ROWCOUNT = 0
        -- Nothing was updated, return no rows, but column structure from base view intact, semantically correct this way.
        SELECT TOP 0 * FROM [morecheese_events].[vwEvents] WHERE 1=0
    ELSE
        -- Return the updated record so the caller can see the updated values and any calculated fields
        SELECT
                                        *
                                    FROM
                                        [morecheese_events].[vwEvents]
                                    WHERE
                                        [ID] = @ID
                                    
END
GO

GRANT EXECUTE ON [morecheese_events].[spUpdateEvent] TO [cdp_Developer], [cdp_Integration]
GO

------------------------------------------------------------
----- TRIGGER FOR __mj_UpdatedAt field for the Event table
------------------------------------------------------------
IF OBJECT_ID('[morecheese_events].[trgUpdateEvent]', 'TR') IS NOT NULL
    DROP TRIGGER [morecheese_events].[trgUpdateEvent];
GO
CREATE TRIGGER [morecheese_events].trgUpdateEvent
ON [morecheese_events].[Event]
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE
        [morecheese_events].[Event]
    SET
        __mj_UpdatedAt = GETUTCDATE()
    FROM
        [morecheese_events].[Event] AS _organicTable
    INNER JOIN
        INSERTED AS I ON
        _organicTable.[ID] = I.[ID];
END;
GO

/* spUpdate Permissions for MoreCheese: Events */

GRANT EXECUTE ON [morecheese_events].[spUpdateEvent] TO [cdp_Developer], [cdp_Integration];

/* spDelete SQL for MoreCheese: Certifications */
-----------------------------------------------------------------
-- SQL Code Generation
-- Entity: MoreCheese: Certifications
-- Item: spDeleteCertification
--
-- This was generated by the MemberJunction CodeGen tool.
-- This file should NOT be edited by hand.
-----------------------------------------------------------------

------------------------------------------------------------
----- DELETE PROCEDURE FOR Certification
------------------------------------------------------------
IF OBJECT_ID('[morecheese_learning].[spDeleteCertification]', 'P') IS NOT NULL
    DROP PROCEDURE [morecheese_learning].[spDeleteCertification];
GO

CREATE PROCEDURE [morecheese_learning].[spDeleteCertification]
    @ID uniqueidentifier
AS
BEGIN
    SET NOCOUNT ON;

    DELETE FROM
        [morecheese_learning].[Certification]
    WHERE
        [ID] = @ID


    -- Check if the delete was successful
    IF @@ROWCOUNT = 0
        SELECT NULL AS [ID] -- Return NULL for all primary key fields to indicate no record was deleted
    ELSE
        SELECT @ID AS [ID] -- Return the primary key values to indicate we successfully deleted the record
END
GO
GRANT EXECUTE ON [morecheese_learning].[spDeleteCertification] TO [cdp_Developer], [cdp_Integration];

/* spDelete Permissions for MoreCheese: Certifications */

GRANT EXECUTE ON [morecheese_learning].[spDeleteCertification] TO [cdp_Developer], [cdp_Integration];

/* spDelete SQL for MoreCheese: Courses */
-----------------------------------------------------------------
-- SQL Code Generation
-- Entity: MoreCheese: Courses
-- Item: spDeleteCourse
--
-- This was generated by the MemberJunction CodeGen tool.
-- This file should NOT be edited by hand.
-----------------------------------------------------------------

------------------------------------------------------------
----- DELETE PROCEDURE FOR Course
------------------------------------------------------------
IF OBJECT_ID('[morecheese_learning].[spDeleteCourse]', 'P') IS NOT NULL
    DROP PROCEDURE [morecheese_learning].[spDeleteCourse];
GO

CREATE PROCEDURE [morecheese_learning].[spDeleteCourse]
    @ID uniqueidentifier
AS
BEGIN
    SET NOCOUNT ON;

    DELETE FROM
        [morecheese_learning].[Course]
    WHERE
        [ID] = @ID


    -- Check if the delete was successful
    IF @@ROWCOUNT = 0
        SELECT NULL AS [ID] -- Return NULL for all primary key fields to indicate no record was deleted
    ELSE
        SELECT @ID AS [ID] -- Return the primary key values to indicate we successfully deleted the record
END
GO
GRANT EXECUTE ON [morecheese_learning].[spDeleteCourse] TO [cdp_Developer], [cdp_Integration];

/* spDelete Permissions for MoreCheese: Courses */

GRANT EXECUTE ON [morecheese_learning].[spDeleteCourse] TO [cdp_Developer], [cdp_Integration];

/* spDelete SQL for MoreCheese: Events */
-----------------------------------------------------------------
-- SQL Code Generation
-- Entity: MoreCheese: Events
-- Item: spDeleteEvent
--
-- This was generated by the MemberJunction CodeGen tool.
-- This file should NOT be edited by hand.
-----------------------------------------------------------------

------------------------------------------------------------
----- DELETE PROCEDURE FOR Event
------------------------------------------------------------
IF OBJECT_ID('[morecheese_events].[spDeleteEvent]', 'P') IS NOT NULL
    DROP PROCEDURE [morecheese_events].[spDeleteEvent];
GO

CREATE PROCEDURE [morecheese_events].[spDeleteEvent]
    @ID uniqueidentifier
AS
BEGIN
    SET NOCOUNT ON;

    DELETE FROM
        [morecheese_events].[Event]
    WHERE
        [ID] = @ID


    -- Check if the delete was successful
    IF @@ROWCOUNT = 0
        SELECT NULL AS [ID] -- Return NULL for all primary key fields to indicate no record was deleted
    ELSE
        SELECT @ID AS [ID] -- Return the primary key values to indicate we successfully deleted the record
END
GO
GRANT EXECUTE ON [morecheese_events].[spDeleteEvent] TO [cdp_Developer], [cdp_Integration];

/* spDelete Permissions for MoreCheese: Events */

GRANT EXECUTE ON [morecheese_events].[spDeleteEvent] TO [cdp_Developer], [cdp_Integration];

/* SQL text to update entity field related entity name field map for entity field ID 8C85FAF9-4548-4418-B3FD-774EFBAA970C */
EXEC [${mjSchema}].[spUpdateEntityFieldRelatedEntityNameFieldMap] @EntityFieldID='8C85FAF9-4548-4418-B3FD-774EFBAA970C', @RelatedEntityNameFieldMap='Organization';

/* SQL text to update entity field related entity name field map for entity field ID 56103EC8-B51D-4A9F-A8C6-9C1CC75E0119 */
EXEC [${mjSchema}].[spUpdateEntityFieldRelatedEntityNameFieldMap] @EntityFieldID='56103EC8-B51D-4A9F-A8C6-9C1CC75E0119', @RelatedEntityNameFieldMap='RelatedPerson';

/* Base View SQL for MoreCheese: Advocacy Actions */
-----------------------------------------------------------------
-- SQL Code Generation
-- Entity: MoreCheese: Advocacy Actions
-- Item: vwAdvocacyActions
--
-- This was generated by the MemberJunction CodeGen tool.
-- This file should NOT be edited by hand.
-----------------------------------------------------------------

------------------------------------------------------------
----- BASE VIEW FOR ENTITY:      MoreCheese: Advocacy Actions
-----               SCHEMA:      ${flyway:defaultSchema}
-----               BASE TABLE:  AdvocacyAction
-----               PRIMARY KEY: ID
------------------------------------------------------------
IF OBJECT_ID('[${flyway:defaultSchema}].[vwAdvocacyActions]', 'V') IS NOT NULL
    DROP VIEW [${flyway:defaultSchema}].[vwAdvocacyActions];
GO

CREATE VIEW [${flyway:defaultSchema}].[vwAdvocacyActions]
AS
SELECT
    a.*,
    mjBizAppsCommonPerson_PersonID.[DisplayName] AS [Person]
FROM
    [${flyway:defaultSchema}].[AdvocacyAction] AS a
INNER JOIN
    [${mjSchema}_BizAppsCommon].[Person] AS mjBizAppsCommonPerson_PersonID
  ON
    [a].[PersonID] = mjBizAppsCommonPerson_PersonID.[ID]
GO
GRANT SELECT ON [${flyway:defaultSchema}].[vwAdvocacyActions] TO [cdp_UI], [cdp_Developer], [cdp_Integration];

/* Base View Permissions SQL for MoreCheese: Advocacy Actions */
-----------------------------------------------------------------
-- SQL Code Generation
-- Entity: MoreCheese: Advocacy Actions
-- Item: Permissions for vwAdvocacyActions
--
-- This was generated by the MemberJunction CodeGen tool.
-- This file should NOT be edited by hand.
-----------------------------------------------------------------

GRANT SELECT ON [${flyway:defaultSchema}].[vwAdvocacyActions] TO [cdp_UI], [cdp_Developer], [cdp_Integration];

/* spCreate SQL for MoreCheese: Advocacy Actions */
-----------------------------------------------------------------
-- SQL Code Generation
-- Entity: MoreCheese: Advocacy Actions
-- Item: spCreateAdvocacyAction
--
-- This was generated by the MemberJunction CodeGen tool.
-- This file should NOT be edited by hand.
-----------------------------------------------------------------

------------------------------------------------------------
----- CREATE PROCEDURE FOR AdvocacyAction
------------------------------------------------------------
IF OBJECT_ID('[${flyway:defaultSchema}].[spCreateAdvocacyAction]', 'P') IS NOT NULL
    DROP PROCEDURE [${flyway:defaultSchema}].[spCreateAdvocacyAction];
GO

CREATE PROCEDURE [${flyway:defaultSchema}].[spCreateAdvocacyAction]
    @ID uniqueidentifier = NULL,
    @ActionKey nvarchar(80),
    @PersonID uniqueidentifier,
    @ActionDate date,
    @Kind nvarchar(50),
    @Topic nvarchar(200),
    @IsSharedDemo bit = NULL
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @InsertedRow TABLE ([ID] UNIQUEIDENTIFIER)

    IF @ID IS NOT NULL
    BEGIN
        -- User provided a value, use it
        INSERT INTO [${flyway:defaultSchema}].[AdvocacyAction]
            (
                [ID],
                [ActionKey],
                [PersonID],
                [ActionDate],
                [Kind],
                [Topic],
                [IsSharedDemo]
            )
        OUTPUT INSERTED.[ID] INTO @InsertedRow
        VALUES
            (
                @ID,
                @ActionKey,
                @PersonID,
                @ActionDate,
                @Kind,
                @Topic,
                ISNULL(@IsSharedDemo, 1)
            )
    END
    ELSE
    BEGIN
        -- No value provided, let database use its default (e.g., NEWSEQUENTIALID())
        INSERT INTO [${flyway:defaultSchema}].[AdvocacyAction]
            (
                [ActionKey],
                [PersonID],
                [ActionDate],
                [Kind],
                [Topic],
                [IsSharedDemo]
            )
        OUTPUT INSERTED.[ID] INTO @InsertedRow
        VALUES
            (
                @ActionKey,
                @PersonID,
                @ActionDate,
                @Kind,
                @Topic,
                ISNULL(@IsSharedDemo, 1)
            )
    END
    -- return the new record from the base view, which might have some calculated fields
    SELECT * FROM [${flyway:defaultSchema}].[vwAdvocacyActions] WHERE [ID] = (SELECT [ID] FROM @InsertedRow)
END
GO
GRANT EXECUTE ON [${flyway:defaultSchema}].[spCreateAdvocacyAction] TO [cdp_Developer], [cdp_Integration];

/* spCreate Permissions for MoreCheese: Advocacy Actions */

GRANT EXECUTE ON [${flyway:defaultSchema}].[spCreateAdvocacyAction] TO [cdp_Developer], [cdp_Integration];

/* spUpdate SQL for MoreCheese: Advocacy Actions */
-----------------------------------------------------------------
-- SQL Code Generation
-- Entity: MoreCheese: Advocacy Actions
-- Item: spUpdateAdvocacyAction
--
-- This was generated by the MemberJunction CodeGen tool.
-- This file should NOT be edited by hand.
-----------------------------------------------------------------

------------------------------------------------------------
----- UPDATE PROCEDURE FOR AdvocacyAction
------------------------------------------------------------
IF OBJECT_ID('[${flyway:defaultSchema}].[spUpdateAdvocacyAction]', 'P') IS NOT NULL
    DROP PROCEDURE [${flyway:defaultSchema}].[spUpdateAdvocacyAction];
GO

CREATE PROCEDURE [${flyway:defaultSchema}].[spUpdateAdvocacyAction]
    @ID uniqueidentifier,
    @ActionKey nvarchar(80) = NULL,
    @PersonID uniqueidentifier = NULL,
    @ActionDate date = NULL,
    @Kind nvarchar(50) = NULL,
    @Topic nvarchar(200) = NULL,
    @IsSharedDemo bit = NULL
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE
        [${flyway:defaultSchema}].[AdvocacyAction]
    SET
        [ActionKey] = ISNULL(@ActionKey, [ActionKey]),
        [PersonID] = ISNULL(@PersonID, [PersonID]),
        [ActionDate] = ISNULL(@ActionDate, [ActionDate]),
        [Kind] = ISNULL(@Kind, [Kind]),
        [Topic] = ISNULL(@Topic, [Topic]),
        [IsSharedDemo] = ISNULL(@IsSharedDemo, [IsSharedDemo])
    WHERE
        [ID] = @ID

    -- Check if the update was successful
    IF @@ROWCOUNT = 0
        -- Nothing was updated, return no rows, but column structure from base view intact, semantically correct this way.
        SELECT TOP 0 * FROM [${flyway:defaultSchema}].[vwAdvocacyActions] WHERE 1=0
    ELSE
        -- Return the updated record so the caller can see the updated values and any calculated fields
        SELECT
                                        *
                                    FROM
                                        [${flyway:defaultSchema}].[vwAdvocacyActions]
                                    WHERE
                                        [ID] = @ID
                                    
END
GO

GRANT EXECUTE ON [${flyway:defaultSchema}].[spUpdateAdvocacyAction] TO [cdp_Developer], [cdp_Integration]
GO

------------------------------------------------------------
----- TRIGGER FOR __mj_UpdatedAt field for the AdvocacyAction table
------------------------------------------------------------
IF OBJECT_ID('[${flyway:defaultSchema}].[trgUpdateAdvocacyAction]', 'TR') IS NOT NULL
    DROP TRIGGER [${flyway:defaultSchema}].[trgUpdateAdvocacyAction];
GO
CREATE TRIGGER [${flyway:defaultSchema}].trgUpdateAdvocacyAction
ON [${flyway:defaultSchema}].[AdvocacyAction]
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE
        [${flyway:defaultSchema}].[AdvocacyAction]
    SET
        __mj_UpdatedAt = GETUTCDATE()
    FROM
        [${flyway:defaultSchema}].[AdvocacyAction] AS _organicTable
    INNER JOIN
        INSERTED AS I ON
        _organicTable.[ID] = I.[ID];
END;
GO

/* spUpdate Permissions for MoreCheese: Advocacy Actions */

GRANT EXECUTE ON [${flyway:defaultSchema}].[spUpdateAdvocacyAction] TO [cdp_Developer], [cdp_Integration];

/* spDelete SQL for MoreCheese: Advocacy Actions */
-----------------------------------------------------------------
-- SQL Code Generation
-- Entity: MoreCheese: Advocacy Actions
-- Item: spDeleteAdvocacyAction
--
-- This was generated by the MemberJunction CodeGen tool.
-- This file should NOT be edited by hand.
-----------------------------------------------------------------

------------------------------------------------------------
----- DELETE PROCEDURE FOR AdvocacyAction
------------------------------------------------------------
IF OBJECT_ID('[${flyway:defaultSchema}].[spDeleteAdvocacyAction]', 'P') IS NOT NULL
    DROP PROCEDURE [${flyway:defaultSchema}].[spDeleteAdvocacyAction];
GO

CREATE PROCEDURE [${flyway:defaultSchema}].[spDeleteAdvocacyAction]
    @ID uniqueidentifier
AS
BEGIN
    SET NOCOUNT ON;

    DELETE FROM
        [${flyway:defaultSchema}].[AdvocacyAction]
    WHERE
        [ID] = @ID


    -- Check if the delete was successful
    IF @@ROWCOUNT = 0
        SELECT NULL AS [ID] -- Return NULL for all primary key fields to indicate no record was deleted
    ELSE
        SELECT @ID AS [ID] -- Return the primary key values to indicate we successfully deleted the record
END
GO
GRANT EXECUTE ON [${flyway:defaultSchema}].[spDeleteAdvocacyAction] TO [cdp_Developer], [cdp_Integration];

/* spDelete Permissions for MoreCheese: Advocacy Actions */

GRANT EXECUTE ON [${flyway:defaultSchema}].[spDeleteAdvocacyAction] TO [cdp_Developer], [cdp_Integration];

/* SQL text to update entity field related entity name field map for entity field ID 4A79B308-30C6-4958-A4E3-A8EA533718E1 */
EXEC [${mjSchema}].[spUpdateEntityFieldRelatedEntityNameFieldMap] @EntityFieldID='4A79B308-30C6-4958-A4E3-A8EA533718E1', @RelatedEntityNameFieldMap='Course';

/* SQL text to update entity field related entity name field map for entity field ID 2A2646EF-3994-49DF-BC16-A7FCF9B419FB */
EXEC [${mjSchema}].[spUpdateEntityFieldRelatedEntityNameFieldMap] @EntityFieldID='2A2646EF-3994-49DF-BC16-A7FCF9B419FB', @RelatedEntityNameFieldMap='Event';

/* Base View SQL for MoreCheese: Competition Entries */
-----------------------------------------------------------------
-- SQL Code Generation
-- Entity: MoreCheese: Competition Entries
-- Item: vwCompetitionEntries
--
-- This was generated by the MemberJunction CodeGen tool.
-- This file should NOT be edited by hand.
-----------------------------------------------------------------

------------------------------------------------------------
----- BASE VIEW FOR ENTITY:      MoreCheese: Competition Entries
-----               SCHEMA:      morecheese_events
-----               BASE TABLE:  CompetitionEntry
-----               PRIMARY KEY: ID
------------------------------------------------------------
IF OBJECT_ID('[morecheese_events].[vwCompetitionEntries]', 'V') IS NOT NULL
    DROP VIEW [morecheese_events].[vwCompetitionEntries];
GO

CREATE VIEW [morecheese_events].[vwCompetitionEntries]
AS
SELECT
    c.*,
    mjBizAppsCommonPerson_PersonID.[DisplayName] AS [Person],
    mjBizAppsCommonOrganization_OrganizationID.[Name] AS [Organization]
FROM
    [morecheese_events].[CompetitionEntry] AS c
INNER JOIN
    [${mjSchema}_BizAppsCommon].[Person] AS mjBizAppsCommonPerson_PersonID
  ON
    [c].[PersonID] = mjBizAppsCommonPerson_PersonID.[ID]
LEFT OUTER JOIN
    [${mjSchema}_BizAppsCommon].[Organization] AS mjBizAppsCommonOrganization_OrganizationID
  ON
    [c].[OrganizationID] = mjBizAppsCommonOrganization_OrganizationID.[ID]
GO
GRANT SELECT ON [morecheese_events].[vwCompetitionEntries] TO [cdp_UI], [cdp_Developer], [cdp_Integration];

/* Base View Permissions SQL for MoreCheese: Competition Entries */
-----------------------------------------------------------------
-- SQL Code Generation
-- Entity: MoreCheese: Competition Entries
-- Item: Permissions for vwCompetitionEntries
--
-- This was generated by the MemberJunction CodeGen tool.
-- This file should NOT be edited by hand.
-----------------------------------------------------------------

GRANT SELECT ON [morecheese_events].[vwCompetitionEntries] TO [cdp_UI], [cdp_Developer], [cdp_Integration];

/* spCreate SQL for MoreCheese: Competition Entries */
-----------------------------------------------------------------
-- SQL Code Generation
-- Entity: MoreCheese: Competition Entries
-- Item: spCreateCompetitionEntry
--
-- This was generated by the MemberJunction CodeGen tool.
-- This file should NOT be edited by hand.
-----------------------------------------------------------------

------------------------------------------------------------
----- CREATE PROCEDURE FOR CompetitionEntry
------------------------------------------------------------
IF OBJECT_ID('[morecheese_events].[spCreateCompetitionEntry]', 'P') IS NOT NULL
    DROP PROCEDURE [morecheese_events].[spCreateCompetitionEntry];
GO

CREATE PROCEDURE [morecheese_events].[spCreateCompetitionEntry]
    @ID uniqueidentifier = NULL,
    @EntryKey nvarchar(80),
    @PersonID uniqueidentifier,
    @OrganizationID_Clear bit = 0,
    @OrganizationID uniqueidentifier = NULL,
    @EntryYear int,
    @Category nvarchar(100),
    @ProductName nvarchar(200),
    @Result nvarchar(50) = NULL,
    @IsSharedDemo bit = NULL
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @InsertedRow TABLE ([ID] UNIQUEIDENTIFIER)

    IF @ID IS NOT NULL
    BEGIN
        -- User provided a value, use it
        INSERT INTO [morecheese_events].[CompetitionEntry]
            (
                [ID],
                [EntryKey],
                [PersonID],
                [OrganizationID],
                [EntryYear],
                [Category],
                [ProductName],
                [Result],
                [IsSharedDemo]
            )
        OUTPUT INSERTED.[ID] INTO @InsertedRow
        VALUES
            (
                @ID,
                @EntryKey,
                @PersonID,
                CASE WHEN @OrganizationID_Clear = 1 THEN NULL ELSE ISNULL(@OrganizationID, NULL) END,
                @EntryYear,
                @Category,
                @ProductName,
                ISNULL(@Result, 'None'),
                ISNULL(@IsSharedDemo, 1)
            )
    END
    ELSE
    BEGIN
        -- No value provided, let database use its default (e.g., NEWSEQUENTIALID())
        INSERT INTO [morecheese_events].[CompetitionEntry]
            (
                [EntryKey],
                [PersonID],
                [OrganizationID],
                [EntryYear],
                [Category],
                [ProductName],
                [Result],
                [IsSharedDemo]
            )
        OUTPUT INSERTED.[ID] INTO @InsertedRow
        VALUES
            (
                @EntryKey,
                @PersonID,
                CASE WHEN @OrganizationID_Clear = 1 THEN NULL ELSE ISNULL(@OrganizationID, NULL) END,
                @EntryYear,
                @Category,
                @ProductName,
                ISNULL(@Result, 'None'),
                ISNULL(@IsSharedDemo, 1)
            )
    END
    -- return the new record from the base view, which might have some calculated fields
    SELECT * FROM [morecheese_events].[vwCompetitionEntries] WHERE [ID] = (SELECT [ID] FROM @InsertedRow)
END
GO
GRANT EXECUTE ON [morecheese_events].[spCreateCompetitionEntry] TO [cdp_Developer], [cdp_Integration];

/* spCreate Permissions for MoreCheese: Competition Entries */

GRANT EXECUTE ON [morecheese_events].[spCreateCompetitionEntry] TO [cdp_Developer], [cdp_Integration];

/* spUpdate SQL for MoreCheese: Competition Entries */
-----------------------------------------------------------------
-- SQL Code Generation
-- Entity: MoreCheese: Competition Entries
-- Item: spUpdateCompetitionEntry
--
-- This was generated by the MemberJunction CodeGen tool.
-- This file should NOT be edited by hand.
-----------------------------------------------------------------

------------------------------------------------------------
----- UPDATE PROCEDURE FOR CompetitionEntry
------------------------------------------------------------
IF OBJECT_ID('[morecheese_events].[spUpdateCompetitionEntry]', 'P') IS NOT NULL
    DROP PROCEDURE [morecheese_events].[spUpdateCompetitionEntry];
GO

CREATE PROCEDURE [morecheese_events].[spUpdateCompetitionEntry]
    @ID uniqueidentifier,
    @EntryKey nvarchar(80) = NULL,
    @PersonID uniqueidentifier = NULL,
    @OrganizationID_Clear bit = 0,
    @OrganizationID uniqueidentifier = NULL,
    @EntryYear int = NULL,
    @Category nvarchar(100) = NULL,
    @ProductName nvarchar(200) = NULL,
    @Result nvarchar(50) = NULL,
    @IsSharedDemo bit = NULL
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE
        [morecheese_events].[CompetitionEntry]
    SET
        [EntryKey] = ISNULL(@EntryKey, [EntryKey]),
        [PersonID] = ISNULL(@PersonID, [PersonID]),
        [OrganizationID] = CASE WHEN @OrganizationID_Clear = 1 THEN NULL ELSE ISNULL(@OrganizationID, [OrganizationID]) END,
        [EntryYear] = ISNULL(@EntryYear, [EntryYear]),
        [Category] = ISNULL(@Category, [Category]),
        [ProductName] = ISNULL(@ProductName, [ProductName]),
        [Result] = ISNULL(@Result, [Result]),
        [IsSharedDemo] = ISNULL(@IsSharedDemo, [IsSharedDemo])
    WHERE
        [ID] = @ID

    -- Check if the update was successful
    IF @@ROWCOUNT = 0
        -- Nothing was updated, return no rows, but column structure from base view intact, semantically correct this way.
        SELECT TOP 0 * FROM [morecheese_events].[vwCompetitionEntries] WHERE 1=0
    ELSE
        -- Return the updated record so the caller can see the updated values and any calculated fields
        SELECT
                                        *
                                    FROM
                                        [morecheese_events].[vwCompetitionEntries]
                                    WHERE
                                        [ID] = @ID
                                    
END
GO

GRANT EXECUTE ON [morecheese_events].[spUpdateCompetitionEntry] TO [cdp_Developer], [cdp_Integration]
GO

------------------------------------------------------------
----- TRIGGER FOR __mj_UpdatedAt field for the CompetitionEntry table
------------------------------------------------------------
IF OBJECT_ID('[morecheese_events].[trgUpdateCompetitionEntry]', 'TR') IS NOT NULL
    DROP TRIGGER [morecheese_events].[trgUpdateCompetitionEntry];
GO
CREATE TRIGGER [morecheese_events].trgUpdateCompetitionEntry
ON [morecheese_events].[CompetitionEntry]
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE
        [morecheese_events].[CompetitionEntry]
    SET
        __mj_UpdatedAt = GETUTCDATE()
    FROM
        [morecheese_events].[CompetitionEntry] AS _organicTable
    INNER JOIN
        INSERTED AS I ON
        _organicTable.[ID] = I.[ID];
END;
GO

/* spUpdate Permissions for MoreCheese: Competition Entries */

GRANT EXECUTE ON [morecheese_events].[spUpdateCompetitionEntry] TO [cdp_Developer], [cdp_Integration];

/* spDelete SQL for MoreCheese: Competition Entries */
-----------------------------------------------------------------
-- SQL Code Generation
-- Entity: MoreCheese: Competition Entries
-- Item: spDeleteCompetitionEntry
--
-- This was generated by the MemberJunction CodeGen tool.
-- This file should NOT be edited by hand.
-----------------------------------------------------------------

------------------------------------------------------------
----- DELETE PROCEDURE FOR CompetitionEntry
------------------------------------------------------------
IF OBJECT_ID('[morecheese_events].[spDeleteCompetitionEntry]', 'P') IS NOT NULL
    DROP PROCEDURE [morecheese_events].[spDeleteCompetitionEntry];
GO

CREATE PROCEDURE [morecheese_events].[spDeleteCompetitionEntry]
    @ID uniqueidentifier
AS
BEGIN
    SET NOCOUNT ON;

    DELETE FROM
        [morecheese_events].[CompetitionEntry]
    WHERE
        [ID] = @ID


    -- Check if the delete was successful
    IF @@ROWCOUNT = 0
        SELECT NULL AS [ID] -- Return NULL for all primary key fields to indicate no record was deleted
    ELSE
        SELECT @ID AS [ID] -- Return the primary key values to indicate we successfully deleted the record
END
GO
GRANT EXECUTE ON [morecheese_events].[spDeleteCompetitionEntry] TO [cdp_Developer], [cdp_Integration];

/* spDelete Permissions for MoreCheese: Competition Entries */

GRANT EXECUTE ON [morecheese_events].[spDeleteCompetitionEntry] TO [cdp_Developer], [cdp_Integration];

/* Base View SQL for MoreCheese: Course Enrollments */
-----------------------------------------------------------------
-- SQL Code Generation
-- Entity: MoreCheese: Course Enrollments
-- Item: vwCourseEnrollments
--
-- This was generated by the MemberJunction CodeGen tool.
-- This file should NOT be edited by hand.
-----------------------------------------------------------------

------------------------------------------------------------
----- BASE VIEW FOR ENTITY:      MoreCheese: Course Enrollments
-----               SCHEMA:      morecheese_learning
-----               BASE TABLE:  CourseEnrollment
-----               PRIMARY KEY: ID
------------------------------------------------------------
IF OBJECT_ID('[morecheese_learning].[vwCourseEnrollments]', 'V') IS NOT NULL
    DROP VIEW [morecheese_learning].[vwCourseEnrollments];
GO

CREATE VIEW [morecheese_learning].[vwCourseEnrollments]
AS
SELECT
    c.*,
    mjBizAppsCommonPerson_PersonID.[DisplayName] AS [Person],
    morecheeselearningCourse_CourseID.[Name] AS [Course]
FROM
    [morecheese_learning].[CourseEnrollment] AS c
INNER JOIN
    [${mjSchema}_BizAppsCommon].[Person] AS mjBizAppsCommonPerson_PersonID
  ON
    [c].[PersonID] = mjBizAppsCommonPerson_PersonID.[ID]
INNER JOIN
    [morecheese_learning].[Course] AS morecheeselearningCourse_CourseID
  ON
    [c].[CourseID] = morecheeselearningCourse_CourseID.[ID]
GO
GRANT SELECT ON [morecheese_learning].[vwCourseEnrollments] TO [cdp_UI], [cdp_Developer], [cdp_Integration];

/* Base View Permissions SQL for MoreCheese: Course Enrollments */
-----------------------------------------------------------------
-- SQL Code Generation
-- Entity: MoreCheese: Course Enrollments
-- Item: Permissions for vwCourseEnrollments
--
-- This was generated by the MemberJunction CodeGen tool.
-- This file should NOT be edited by hand.
-----------------------------------------------------------------

GRANT SELECT ON [morecheese_learning].[vwCourseEnrollments] TO [cdp_UI], [cdp_Developer], [cdp_Integration];

/* spCreate SQL for MoreCheese: Course Enrollments */
-----------------------------------------------------------------
-- SQL Code Generation
-- Entity: MoreCheese: Course Enrollments
-- Item: spCreateCourseEnrollment
--
-- This was generated by the MemberJunction CodeGen tool.
-- This file should NOT be edited by hand.
-----------------------------------------------------------------

------------------------------------------------------------
----- CREATE PROCEDURE FOR CourseEnrollment
------------------------------------------------------------
IF OBJECT_ID('[morecheese_learning].[spCreateCourseEnrollment]', 'P') IS NOT NULL
    DROP PROCEDURE [morecheese_learning].[spCreateCourseEnrollment];
GO

CREATE PROCEDURE [morecheese_learning].[spCreateCourseEnrollment]
    @ID uniqueidentifier = NULL,
    @EnrollKey nvarchar(80),
    @PersonID uniqueidentifier,
    @CourseID uniqueidentifier,
    @EnrolledOn date,
    @Status nvarchar(50),
    @CompletedOn_Clear bit = 0,
    @CompletedOn date = NULL,
    @IsSharedDemo bit = NULL
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @InsertedRow TABLE ([ID] UNIQUEIDENTIFIER)

    IF @ID IS NOT NULL
    BEGIN
        -- User provided a value, use it
        INSERT INTO [morecheese_learning].[CourseEnrollment]
            (
                [ID],
                [EnrollKey],
                [PersonID],
                [CourseID],
                [EnrolledOn],
                [Status],
                [CompletedOn],
                [IsSharedDemo]
            )
        OUTPUT INSERTED.[ID] INTO @InsertedRow
        VALUES
            (
                @ID,
                @EnrollKey,
                @PersonID,
                @CourseID,
                @EnrolledOn,
                @Status,
                CASE WHEN @CompletedOn_Clear = 1 THEN NULL ELSE ISNULL(@CompletedOn, NULL) END,
                ISNULL(@IsSharedDemo, 1)
            )
    END
    ELSE
    BEGIN
        -- No value provided, let database use its default (e.g., NEWSEQUENTIALID())
        INSERT INTO [morecheese_learning].[CourseEnrollment]
            (
                [EnrollKey],
                [PersonID],
                [CourseID],
                [EnrolledOn],
                [Status],
                [CompletedOn],
                [IsSharedDemo]
            )
        OUTPUT INSERTED.[ID] INTO @InsertedRow
        VALUES
            (
                @EnrollKey,
                @PersonID,
                @CourseID,
                @EnrolledOn,
                @Status,
                CASE WHEN @CompletedOn_Clear = 1 THEN NULL ELSE ISNULL(@CompletedOn, NULL) END,
                ISNULL(@IsSharedDemo, 1)
            )
    END
    -- return the new record from the base view, which might have some calculated fields
    SELECT * FROM [morecheese_learning].[vwCourseEnrollments] WHERE [ID] = (SELECT [ID] FROM @InsertedRow)
END
GO
GRANT EXECUTE ON [morecheese_learning].[spCreateCourseEnrollment] TO [cdp_Developer], [cdp_Integration];

/* spCreate Permissions for MoreCheese: Course Enrollments */

GRANT EXECUTE ON [morecheese_learning].[spCreateCourseEnrollment] TO [cdp_Developer], [cdp_Integration];

/* spUpdate SQL for MoreCheese: Course Enrollments */
-----------------------------------------------------------------
-- SQL Code Generation
-- Entity: MoreCheese: Course Enrollments
-- Item: spUpdateCourseEnrollment
--
-- This was generated by the MemberJunction CodeGen tool.
-- This file should NOT be edited by hand.
-----------------------------------------------------------------

------------------------------------------------------------
----- UPDATE PROCEDURE FOR CourseEnrollment
------------------------------------------------------------
IF OBJECT_ID('[morecheese_learning].[spUpdateCourseEnrollment]', 'P') IS NOT NULL
    DROP PROCEDURE [morecheese_learning].[spUpdateCourseEnrollment];
GO

CREATE PROCEDURE [morecheese_learning].[spUpdateCourseEnrollment]
    @ID uniqueidentifier,
    @EnrollKey nvarchar(80) = NULL,
    @PersonID uniqueidentifier = NULL,
    @CourseID uniqueidentifier = NULL,
    @EnrolledOn date = NULL,
    @Status nvarchar(50) = NULL,
    @CompletedOn_Clear bit = 0,
    @CompletedOn date = NULL,
    @IsSharedDemo bit = NULL
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE
        [morecheese_learning].[CourseEnrollment]
    SET
        [EnrollKey] = ISNULL(@EnrollKey, [EnrollKey]),
        [PersonID] = ISNULL(@PersonID, [PersonID]),
        [CourseID] = ISNULL(@CourseID, [CourseID]),
        [EnrolledOn] = ISNULL(@EnrolledOn, [EnrolledOn]),
        [Status] = ISNULL(@Status, [Status]),
        [CompletedOn] = CASE WHEN @CompletedOn_Clear = 1 THEN NULL ELSE ISNULL(@CompletedOn, [CompletedOn]) END,
        [IsSharedDemo] = ISNULL(@IsSharedDemo, [IsSharedDemo])
    WHERE
        [ID] = @ID

    -- Check if the update was successful
    IF @@ROWCOUNT = 0
        -- Nothing was updated, return no rows, but column structure from base view intact, semantically correct this way.
        SELECT TOP 0 * FROM [morecheese_learning].[vwCourseEnrollments] WHERE 1=0
    ELSE
        -- Return the updated record so the caller can see the updated values and any calculated fields
        SELECT
                                        *
                                    FROM
                                        [morecheese_learning].[vwCourseEnrollments]
                                    WHERE
                                        [ID] = @ID
                                    
END
GO

GRANT EXECUTE ON [morecheese_learning].[spUpdateCourseEnrollment] TO [cdp_Developer], [cdp_Integration]
GO

------------------------------------------------------------
----- TRIGGER FOR __mj_UpdatedAt field for the CourseEnrollment table
------------------------------------------------------------
IF OBJECT_ID('[morecheese_learning].[trgUpdateCourseEnrollment]', 'TR') IS NOT NULL
    DROP TRIGGER [morecheese_learning].[trgUpdateCourseEnrollment];
GO
CREATE TRIGGER [morecheese_learning].trgUpdateCourseEnrollment
ON [morecheese_learning].[CourseEnrollment]
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE
        [morecheese_learning].[CourseEnrollment]
    SET
        __mj_UpdatedAt = GETUTCDATE()
    FROM
        [morecheese_learning].[CourseEnrollment] AS _organicTable
    INNER JOIN
        INSERTED AS I ON
        _organicTable.[ID] = I.[ID];
END;
GO

/* spUpdate Permissions for MoreCheese: Course Enrollments */

GRANT EXECUTE ON [morecheese_learning].[spUpdateCourseEnrollment] TO [cdp_Developer], [cdp_Integration];

/* spDelete SQL for MoreCheese: Course Enrollments */
-----------------------------------------------------------------
-- SQL Code Generation
-- Entity: MoreCheese: Course Enrollments
-- Item: spDeleteCourseEnrollment
--
-- This was generated by the MemberJunction CodeGen tool.
-- This file should NOT be edited by hand.
-----------------------------------------------------------------

------------------------------------------------------------
----- DELETE PROCEDURE FOR CourseEnrollment
------------------------------------------------------------
IF OBJECT_ID('[morecheese_learning].[spDeleteCourseEnrollment]', 'P') IS NOT NULL
    DROP PROCEDURE [morecheese_learning].[spDeleteCourseEnrollment];
GO

CREATE PROCEDURE [morecheese_learning].[spDeleteCourseEnrollment]
    @ID uniqueidentifier
AS
BEGIN
    SET NOCOUNT ON;

    DELETE FROM
        [morecheese_learning].[CourseEnrollment]
    WHERE
        [ID] = @ID


    -- Check if the delete was successful
    IF @@ROWCOUNT = 0
        SELECT NULL AS [ID] -- Return NULL for all primary key fields to indicate no record was deleted
    ELSE
        SELECT @ID AS [ID] -- Return the primary key values to indicate we successfully deleted the record
END
GO
GRANT EXECUTE ON [morecheese_learning].[spDeleteCourseEnrollment] TO [cdp_Developer], [cdp_Integration];

/* spDelete Permissions for MoreCheese: Course Enrollments */

GRANT EXECUTE ON [morecheese_learning].[spDeleteCourseEnrollment] TO [cdp_Developer], [cdp_Integration];

/* SQL text to update entity field related entity name field map for entity field ID 951A6339-3685-49CF-A5FA-363C8FB68168 */
EXEC [${mjSchema}].[spUpdateEntityFieldRelatedEntityNameFieldMap] @EntityFieldID='951A6339-3685-49CF-A5FA-363C8FB68168', @RelatedEntityNameFieldMap='RelatedOrganization';

/* Base View SQL for MoreCheese: Event Registrations */
-----------------------------------------------------------------
-- SQL Code Generation
-- Entity: MoreCheese: Event Registrations
-- Item: vwEventRegistrations
--
-- This was generated by the MemberJunction CodeGen tool.
-- This file should NOT be edited by hand.
-----------------------------------------------------------------

------------------------------------------------------------
----- BASE VIEW FOR ENTITY:      MoreCheese: Event Registrations
-----               SCHEMA:      morecheese_events
-----               BASE TABLE:  EventRegistration
-----               PRIMARY KEY: ID
------------------------------------------------------------
IF OBJECT_ID('[morecheese_events].[vwEventRegistrations]', 'V') IS NOT NULL
    DROP VIEW [morecheese_events].[vwEventRegistrations];
GO

CREATE VIEW [morecheese_events].[vwEventRegistrations]
AS
SELECT
    e.*,
    mjBizAppsCommonPerson_PersonID.[DisplayName] AS [Person],
    morecheeseeventsEvent_EventID.[Name] AS [Event]
FROM
    [morecheese_events].[EventRegistration] AS e
INNER JOIN
    [${mjSchema}_BizAppsCommon].[Person] AS mjBizAppsCommonPerson_PersonID
  ON
    [e].[PersonID] = mjBizAppsCommonPerson_PersonID.[ID]
INNER JOIN
    [morecheese_events].[Event] AS morecheeseeventsEvent_EventID
  ON
    [e].[EventID] = morecheeseeventsEvent_EventID.[ID]
GO
GRANT SELECT ON [morecheese_events].[vwEventRegistrations] TO [cdp_UI], [cdp_Developer], [cdp_Integration];

/* Base View Permissions SQL for MoreCheese: Event Registrations */
-----------------------------------------------------------------
-- SQL Code Generation
-- Entity: MoreCheese: Event Registrations
-- Item: Permissions for vwEventRegistrations
--
-- This was generated by the MemberJunction CodeGen tool.
-- This file should NOT be edited by hand.
-----------------------------------------------------------------

GRANT SELECT ON [morecheese_events].[vwEventRegistrations] TO [cdp_UI], [cdp_Developer], [cdp_Integration];

/* spCreate SQL for MoreCheese: Event Registrations */
-----------------------------------------------------------------
-- SQL Code Generation
-- Entity: MoreCheese: Event Registrations
-- Item: spCreateEventRegistration
--
-- This was generated by the MemberJunction CodeGen tool.
-- This file should NOT be edited by hand.
-----------------------------------------------------------------

------------------------------------------------------------
----- CREATE PROCEDURE FOR EventRegistration
------------------------------------------------------------
IF OBJECT_ID('[morecheese_events].[spCreateEventRegistration]', 'P') IS NOT NULL
    DROP PROCEDURE [morecheese_events].[spCreateEventRegistration];
GO

CREATE PROCEDURE [morecheese_events].[spCreateEventRegistration]
    @ID uniqueidentifier = NULL,
    @RegKey nvarchar(120),
    @PersonID uniqueidentifier,
    @EventID uniqueidentifier,
    @RegisteredOn date,
    @Attended_Clear bit = 0,
    @Attended bit = NULL,
    @IsSharedDemo bit = NULL
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @InsertedRow TABLE ([ID] UNIQUEIDENTIFIER)

    IF @ID IS NOT NULL
    BEGIN
        -- User provided a value, use it
        INSERT INTO [morecheese_events].[EventRegistration]
            (
                [ID],
                [RegKey],
                [PersonID],
                [EventID],
                [RegisteredOn],
                [Attended],
                [IsSharedDemo]
            )
        OUTPUT INSERTED.[ID] INTO @InsertedRow
        VALUES
            (
                @ID,
                @RegKey,
                @PersonID,
                @EventID,
                @RegisteredOn,
                CASE WHEN @Attended_Clear = 1 THEN NULL ELSE ISNULL(@Attended, NULL) END,
                ISNULL(@IsSharedDemo, 1)
            )
    END
    ELSE
    BEGIN
        -- No value provided, let database use its default (e.g., NEWSEQUENTIALID())
        INSERT INTO [morecheese_events].[EventRegistration]
            (
                [RegKey],
                [PersonID],
                [EventID],
                [RegisteredOn],
                [Attended],
                [IsSharedDemo]
            )
        OUTPUT INSERTED.[ID] INTO @InsertedRow
        VALUES
            (
                @RegKey,
                @PersonID,
                @EventID,
                @RegisteredOn,
                CASE WHEN @Attended_Clear = 1 THEN NULL ELSE ISNULL(@Attended, NULL) END,
                ISNULL(@IsSharedDemo, 1)
            )
    END
    -- return the new record from the base view, which might have some calculated fields
    SELECT * FROM [morecheese_events].[vwEventRegistrations] WHERE [ID] = (SELECT [ID] FROM @InsertedRow)
END
GO
GRANT EXECUTE ON [morecheese_events].[spCreateEventRegistration] TO [cdp_Developer], [cdp_Integration];

/* spCreate Permissions for MoreCheese: Event Registrations */

GRANT EXECUTE ON [morecheese_events].[spCreateEventRegistration] TO [cdp_Developer], [cdp_Integration];

/* spUpdate SQL for MoreCheese: Event Registrations */
-----------------------------------------------------------------
-- SQL Code Generation
-- Entity: MoreCheese: Event Registrations
-- Item: spUpdateEventRegistration
--
-- This was generated by the MemberJunction CodeGen tool.
-- This file should NOT be edited by hand.
-----------------------------------------------------------------

------------------------------------------------------------
----- UPDATE PROCEDURE FOR EventRegistration
------------------------------------------------------------
IF OBJECT_ID('[morecheese_events].[spUpdateEventRegistration]', 'P') IS NOT NULL
    DROP PROCEDURE [morecheese_events].[spUpdateEventRegistration];
GO

CREATE PROCEDURE [morecheese_events].[spUpdateEventRegistration]
    @ID uniqueidentifier,
    @RegKey nvarchar(120) = NULL,
    @PersonID uniqueidentifier = NULL,
    @EventID uniqueidentifier = NULL,
    @RegisteredOn date = NULL,
    @Attended_Clear bit = 0,
    @Attended bit = NULL,
    @IsSharedDemo bit = NULL
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE
        [morecheese_events].[EventRegistration]
    SET
        [RegKey] = ISNULL(@RegKey, [RegKey]),
        [PersonID] = ISNULL(@PersonID, [PersonID]),
        [EventID] = ISNULL(@EventID, [EventID]),
        [RegisteredOn] = ISNULL(@RegisteredOn, [RegisteredOn]),
        [Attended] = CASE WHEN @Attended_Clear = 1 THEN NULL ELSE ISNULL(@Attended, [Attended]) END,
        [IsSharedDemo] = ISNULL(@IsSharedDemo, [IsSharedDemo])
    WHERE
        [ID] = @ID

    -- Check if the update was successful
    IF @@ROWCOUNT = 0
        -- Nothing was updated, return no rows, but column structure from base view intact, semantically correct this way.
        SELECT TOP 0 * FROM [morecheese_events].[vwEventRegistrations] WHERE 1=0
    ELSE
        -- Return the updated record so the caller can see the updated values and any calculated fields
        SELECT
                                        *
                                    FROM
                                        [morecheese_events].[vwEventRegistrations]
                                    WHERE
                                        [ID] = @ID
                                    
END
GO

GRANT EXECUTE ON [morecheese_events].[spUpdateEventRegistration] TO [cdp_Developer], [cdp_Integration]
GO

------------------------------------------------------------
----- TRIGGER FOR __mj_UpdatedAt field for the EventRegistration table
------------------------------------------------------------
IF OBJECT_ID('[morecheese_events].[trgUpdateEventRegistration]', 'TR') IS NOT NULL
    DROP TRIGGER [morecheese_events].[trgUpdateEventRegistration];
GO
CREATE TRIGGER [morecheese_events].trgUpdateEventRegistration
ON [morecheese_events].[EventRegistration]
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE
        [morecheese_events].[EventRegistration]
    SET
        __mj_UpdatedAt = GETUTCDATE()
    FROM
        [morecheese_events].[EventRegistration] AS _organicTable
    INNER JOIN
        INSERTED AS I ON
        _organicTable.[ID] = I.[ID];
END;
GO

/* spUpdate Permissions for MoreCheese: Event Registrations */

GRANT EXECUTE ON [morecheese_events].[spUpdateEventRegistration] TO [cdp_Developer], [cdp_Integration];

/* spDelete SQL for MoreCheese: Event Registrations */
-----------------------------------------------------------------
-- SQL Code Generation
-- Entity: MoreCheese: Event Registrations
-- Item: spDeleteEventRegistration
--
-- This was generated by the MemberJunction CodeGen tool.
-- This file should NOT be edited by hand.
-----------------------------------------------------------------

------------------------------------------------------------
----- DELETE PROCEDURE FOR EventRegistration
------------------------------------------------------------
IF OBJECT_ID('[morecheese_events].[spDeleteEventRegistration]', 'P') IS NOT NULL
    DROP PROCEDURE [morecheese_events].[spDeleteEventRegistration];
GO

CREATE PROCEDURE [morecheese_events].[spDeleteEventRegistration]
    @ID uniqueidentifier
AS
BEGIN
    SET NOCOUNT ON;

    DELETE FROM
        [morecheese_events].[EventRegistration]
    WHERE
        [ID] = @ID


    -- Check if the delete was successful
    IF @@ROWCOUNT = 0
        SELECT NULL AS [ID] -- Return NULL for all primary key fields to indicate no record was deleted
    ELSE
        SELECT @ID AS [ID] -- Return the primary key values to indicate we successfully deleted the record
END
GO
GRANT EXECUTE ON [morecheese_events].[spDeleteEventRegistration] TO [cdp_Developer], [cdp_Integration];

/* spDelete Permissions for MoreCheese: Event Registrations */

GRANT EXECUTE ON [morecheese_events].[spDeleteEventRegistration] TO [cdp_Developer], [cdp_Integration];

/* Base View SQL for MoreCheese: Data Quality Labels */
-----------------------------------------------------------------
-- SQL Code Generation
-- Entity: MoreCheese: Data Quality Labels
-- Item: vwDataQualityLabels
--
-- This was generated by the MemberJunction CodeGen tool.
-- This file should NOT be edited by hand.
-----------------------------------------------------------------

------------------------------------------------------------
----- BASE VIEW FOR ENTITY:      MoreCheese: Data Quality Labels
-----               SCHEMA:      ${flyway:defaultSchema}
-----               BASE TABLE:  DataQualityLabel
-----               PRIMARY KEY: ID
------------------------------------------------------------
IF OBJECT_ID('[${flyway:defaultSchema}].[vwDataQualityLabels]', 'V') IS NOT NULL
    DROP VIEW [${flyway:defaultSchema}].[vwDataQualityLabels];
GO

CREATE VIEW [${flyway:defaultSchema}].[vwDataQualityLabels]
AS
SELECT
    d.*,
    mjBizAppsCommonPerson_PersonID.[DisplayName] AS [Person],
    mjBizAppsCommonPerson_RelatedPersonID.[DisplayName] AS [RelatedPerson],
    mjBizAppsCommonOrganization_RelatedOrganizationID.[Name] AS [RelatedOrganization]
FROM
    [${flyway:defaultSchema}].[DataQualityLabel] AS d
INNER JOIN
    [${mjSchema}_BizAppsCommon].[Person] AS mjBizAppsCommonPerson_PersonID
  ON
    [d].[PersonID] = mjBizAppsCommonPerson_PersonID.[ID]
LEFT OUTER JOIN
    [${mjSchema}_BizAppsCommon].[Person] AS mjBizAppsCommonPerson_RelatedPersonID
  ON
    [d].[RelatedPersonID] = mjBizAppsCommonPerson_RelatedPersonID.[ID]
LEFT OUTER JOIN
    [${mjSchema}_BizAppsCommon].[Organization] AS mjBizAppsCommonOrganization_RelatedOrganizationID
  ON
    [d].[RelatedOrganizationID] = mjBizAppsCommonOrganization_RelatedOrganizationID.[ID]
GO
GRANT SELECT ON [${flyway:defaultSchema}].[vwDataQualityLabels] TO [cdp_UI], [cdp_Developer], [cdp_Integration];

/* Base View Permissions SQL for MoreCheese: Data Quality Labels */
-----------------------------------------------------------------
-- SQL Code Generation
-- Entity: MoreCheese: Data Quality Labels
-- Item: Permissions for vwDataQualityLabels
--
-- This was generated by the MemberJunction CodeGen tool.
-- This file should NOT be edited by hand.
-----------------------------------------------------------------

GRANT SELECT ON [${flyway:defaultSchema}].[vwDataQualityLabels] TO [cdp_UI], [cdp_Developer], [cdp_Integration];

/* spCreate SQL for MoreCheese: Data Quality Labels */
-----------------------------------------------------------------
-- SQL Code Generation
-- Entity: MoreCheese: Data Quality Labels
-- Item: spCreateDataQualityLabel
--
-- This was generated by the MemberJunction CodeGen tool.
-- This file should NOT be edited by hand.
-----------------------------------------------------------------

------------------------------------------------------------
----- CREATE PROCEDURE FOR DataQualityLabel
------------------------------------------------------------
IF OBJECT_ID('[${flyway:defaultSchema}].[spCreateDataQualityLabel]', 'P') IS NOT NULL
    DROP PROCEDURE [${flyway:defaultSchema}].[spCreateDataQualityLabel];
GO

CREATE PROCEDURE [${flyway:defaultSchema}].[spCreateDataQualityLabel]
    @ID uniqueidentifier = NULL,
    @LabelKey nvarchar(80),
    @DefectKind nvarchar(50),
    @PersonID uniqueidentifier,
    @RelatedPersonID_Clear bit = 0,
    @RelatedPersonID uniqueidentifier = NULL,
    @RelatedOrganizationID_Clear bit = 0,
    @RelatedOrganizationID uniqueidentifier = NULL,
    @DefectValue_Clear bit = 0,
    @DefectValue nvarchar(400) = NULL,
    @TruthValue_Clear bit = 0,
    @TruthValue nvarchar(400) = NULL,
    @Notes_Clear bit = 0,
    @Notes nvarchar(500) = NULL,
    @IsSharedDemo bit = NULL
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @InsertedRow TABLE ([ID] UNIQUEIDENTIFIER)

    IF @ID IS NOT NULL
    BEGIN
        -- User provided a value, use it
        INSERT INTO [${flyway:defaultSchema}].[DataQualityLabel]
            (
                [ID],
                [LabelKey],
                [DefectKind],
                [PersonID],
                [RelatedPersonID],
                [RelatedOrganizationID],
                [DefectValue],
                [TruthValue],
                [Notes],
                [IsSharedDemo]
            )
        OUTPUT INSERTED.[ID] INTO @InsertedRow
        VALUES
            (
                @ID,
                @LabelKey,
                @DefectKind,
                @PersonID,
                CASE WHEN @RelatedPersonID_Clear = 1 THEN NULL ELSE ISNULL(@RelatedPersonID, NULL) END,
                CASE WHEN @RelatedOrganizationID_Clear = 1 THEN NULL ELSE ISNULL(@RelatedOrganizationID, NULL) END,
                CASE WHEN @DefectValue_Clear = 1 THEN NULL ELSE ISNULL(@DefectValue, NULL) END,
                CASE WHEN @TruthValue_Clear = 1 THEN NULL ELSE ISNULL(@TruthValue, NULL) END,
                CASE WHEN @Notes_Clear = 1 THEN NULL ELSE ISNULL(@Notes, NULL) END,
                ISNULL(@IsSharedDemo, 1)
            )
    END
    ELSE
    BEGIN
        -- No value provided, let database use its default (e.g., NEWSEQUENTIALID())
        INSERT INTO [${flyway:defaultSchema}].[DataQualityLabel]
            (
                [LabelKey],
                [DefectKind],
                [PersonID],
                [RelatedPersonID],
                [RelatedOrganizationID],
                [DefectValue],
                [TruthValue],
                [Notes],
                [IsSharedDemo]
            )
        OUTPUT INSERTED.[ID] INTO @InsertedRow
        VALUES
            (
                @LabelKey,
                @DefectKind,
                @PersonID,
                CASE WHEN @RelatedPersonID_Clear = 1 THEN NULL ELSE ISNULL(@RelatedPersonID, NULL) END,
                CASE WHEN @RelatedOrganizationID_Clear = 1 THEN NULL ELSE ISNULL(@RelatedOrganizationID, NULL) END,
                CASE WHEN @DefectValue_Clear = 1 THEN NULL ELSE ISNULL(@DefectValue, NULL) END,
                CASE WHEN @TruthValue_Clear = 1 THEN NULL ELSE ISNULL(@TruthValue, NULL) END,
                CASE WHEN @Notes_Clear = 1 THEN NULL ELSE ISNULL(@Notes, NULL) END,
                ISNULL(@IsSharedDemo, 1)
            )
    END
    -- return the new record from the base view, which might have some calculated fields
    SELECT * FROM [${flyway:defaultSchema}].[vwDataQualityLabels] WHERE [ID] = (SELECT [ID] FROM @InsertedRow)
END
GO
GRANT EXECUTE ON [${flyway:defaultSchema}].[spCreateDataQualityLabel] TO [cdp_Developer], [cdp_Integration];

/* spCreate Permissions for MoreCheese: Data Quality Labels */

GRANT EXECUTE ON [${flyway:defaultSchema}].[spCreateDataQualityLabel] TO [cdp_Developer], [cdp_Integration];

/* spUpdate SQL for MoreCheese: Data Quality Labels */
-----------------------------------------------------------------
-- SQL Code Generation
-- Entity: MoreCheese: Data Quality Labels
-- Item: spUpdateDataQualityLabel
--
-- This was generated by the MemberJunction CodeGen tool.
-- This file should NOT be edited by hand.
-----------------------------------------------------------------

------------------------------------------------------------
----- UPDATE PROCEDURE FOR DataQualityLabel
------------------------------------------------------------
IF OBJECT_ID('[${flyway:defaultSchema}].[spUpdateDataQualityLabel]', 'P') IS NOT NULL
    DROP PROCEDURE [${flyway:defaultSchema}].[spUpdateDataQualityLabel];
GO

CREATE PROCEDURE [${flyway:defaultSchema}].[spUpdateDataQualityLabel]
    @ID uniqueidentifier,
    @LabelKey nvarchar(80) = NULL,
    @DefectKind nvarchar(50) = NULL,
    @PersonID uniqueidentifier = NULL,
    @RelatedPersonID_Clear bit = 0,
    @RelatedPersonID uniqueidentifier = NULL,
    @RelatedOrganizationID_Clear bit = 0,
    @RelatedOrganizationID uniqueidentifier = NULL,
    @DefectValue_Clear bit = 0,
    @DefectValue nvarchar(400) = NULL,
    @TruthValue_Clear bit = 0,
    @TruthValue nvarchar(400) = NULL,
    @Notes_Clear bit = 0,
    @Notes nvarchar(500) = NULL,
    @IsSharedDemo bit = NULL
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE
        [${flyway:defaultSchema}].[DataQualityLabel]
    SET
        [LabelKey] = ISNULL(@LabelKey, [LabelKey]),
        [DefectKind] = ISNULL(@DefectKind, [DefectKind]),
        [PersonID] = ISNULL(@PersonID, [PersonID]),
        [RelatedPersonID] = CASE WHEN @RelatedPersonID_Clear = 1 THEN NULL ELSE ISNULL(@RelatedPersonID, [RelatedPersonID]) END,
        [RelatedOrganizationID] = CASE WHEN @RelatedOrganizationID_Clear = 1 THEN NULL ELSE ISNULL(@RelatedOrganizationID, [RelatedOrganizationID]) END,
        [DefectValue] = CASE WHEN @DefectValue_Clear = 1 THEN NULL ELSE ISNULL(@DefectValue, [DefectValue]) END,
        [TruthValue] = CASE WHEN @TruthValue_Clear = 1 THEN NULL ELSE ISNULL(@TruthValue, [TruthValue]) END,
        [Notes] = CASE WHEN @Notes_Clear = 1 THEN NULL ELSE ISNULL(@Notes, [Notes]) END,
        [IsSharedDemo] = ISNULL(@IsSharedDemo, [IsSharedDemo])
    WHERE
        [ID] = @ID

    -- Check if the update was successful
    IF @@ROWCOUNT = 0
        -- Nothing was updated, return no rows, but column structure from base view intact, semantically correct this way.
        SELECT TOP 0 * FROM [${flyway:defaultSchema}].[vwDataQualityLabels] WHERE 1=0
    ELSE
        -- Return the updated record so the caller can see the updated values and any calculated fields
        SELECT
                                        *
                                    FROM
                                        [${flyway:defaultSchema}].[vwDataQualityLabels]
                                    WHERE
                                        [ID] = @ID
                                    
END
GO

GRANT EXECUTE ON [${flyway:defaultSchema}].[spUpdateDataQualityLabel] TO [cdp_Developer], [cdp_Integration]
GO

------------------------------------------------------------
----- TRIGGER FOR __mj_UpdatedAt field for the DataQualityLabel table
------------------------------------------------------------
IF OBJECT_ID('[${flyway:defaultSchema}].[trgUpdateDataQualityLabel]', 'TR') IS NOT NULL
    DROP TRIGGER [${flyway:defaultSchema}].[trgUpdateDataQualityLabel];
GO
CREATE TRIGGER [${flyway:defaultSchema}].trgUpdateDataQualityLabel
ON [${flyway:defaultSchema}].[DataQualityLabel]
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE
        [${flyway:defaultSchema}].[DataQualityLabel]
    SET
        __mj_UpdatedAt = GETUTCDATE()
    FROM
        [${flyway:defaultSchema}].[DataQualityLabel] AS _organicTable
    INNER JOIN
        INSERTED AS I ON
        _organicTable.[ID] = I.[ID];
END;
GO

/* spUpdate Permissions for MoreCheese: Data Quality Labels */

GRANT EXECUTE ON [${flyway:defaultSchema}].[spUpdateDataQualityLabel] TO [cdp_Developer], [cdp_Integration];

/* spDelete SQL for MoreCheese: Data Quality Labels */
-----------------------------------------------------------------
-- SQL Code Generation
-- Entity: MoreCheese: Data Quality Labels
-- Item: spDeleteDataQualityLabel
--
-- This was generated by the MemberJunction CodeGen tool.
-- This file should NOT be edited by hand.
-----------------------------------------------------------------

------------------------------------------------------------
----- DELETE PROCEDURE FOR DataQualityLabel
------------------------------------------------------------
IF OBJECT_ID('[${flyway:defaultSchema}].[spDeleteDataQualityLabel]', 'P') IS NOT NULL
    DROP PROCEDURE [${flyway:defaultSchema}].[spDeleteDataQualityLabel];
GO

CREATE PROCEDURE [${flyway:defaultSchema}].[spDeleteDataQualityLabel]
    @ID uniqueidentifier
AS
BEGIN
    SET NOCOUNT ON;

    DELETE FROM
        [${flyway:defaultSchema}].[DataQualityLabel]
    WHERE
        [ID] = @ID


    -- Check if the delete was successful
    IF @@ROWCOUNT = 0
        SELECT NULL AS [ID] -- Return NULL for all primary key fields to indicate no record was deleted
    ELSE
        SELECT @ID AS [ID] -- Return the primary key values to indicate we successfully deleted the record
END
GO
GRANT EXECUTE ON [${flyway:defaultSchema}].[spDeleteDataQualityLabel] TO [cdp_Developer], [cdp_Integration];

/* spDelete Permissions for MoreCheese: Data Quality Labels */

GRANT EXECUTE ON [${flyway:defaultSchema}].[spDeleteDataQualityLabel] TO [cdp_Developer], [cdp_Integration];

/* Index for Foreign Keys for MemberCertification */
-----------------------------------------------------------------
-- SQL Code Generation
-- Entity: MoreCheese: Member Certifications
-- Item: Index for Foreign Keys
--
-- This was generated by the MemberJunction CodeGen tool.
-- This file should NOT be edited by hand.
-----------------------------------------------------------------
-- Index for foreign key PersonID in table MemberCertification
IF NOT EXISTS (
    SELECT 1
    FROM sys.indexes
    WHERE name = 'IDX_AUTO_MJ_FKEY_MemberCertification_PersonID' 
    AND object_id = OBJECT_ID('[morecheese_learning].[MemberCertification]')
)
CREATE INDEX IDX_AUTO_MJ_FKEY_MemberCertification_PersonID ON [morecheese_learning].[MemberCertification] ([PersonID]);

-- Index for foreign key CertificationID in table MemberCertification
IF NOT EXISTS (
    SELECT 1
    FROM sys.indexes
    WHERE name = 'IDX_AUTO_MJ_FKEY_MemberCertification_CertificationID' 
    AND object_id = OBJECT_ID('[morecheese_learning].[MemberCertification]')
)
CREATE INDEX IDX_AUTO_MJ_FKEY_MemberCertification_CertificationID ON [morecheese_learning].[MemberCertification] ([CertificationID]);

/* SQL text to update entity field related entity name field map for entity field ID 13F9C927-B51E-4FA6-A34D-8C86B6035678 */
EXEC [${mjSchema}].[spUpdateEntityFieldRelatedEntityNameFieldMap] @EntityFieldID='13F9C927-B51E-4FA6-A34D-8C86B6035678', @RelatedEntityNameFieldMap='Person';

/* Index for Foreign Keys for MemberProfile */
-----------------------------------------------------------------
-- SQL Code Generation
-- Entity: MoreCheese: Member Profiles
-- Item: Index for Foreign Keys
--
-- This was generated by the MemberJunction CodeGen tool.
-- This file should NOT be edited by hand.
-----------------------------------------------------------------
-- Index for foreign key PersonID in table MemberProfile
IF NOT EXISTS (
    SELECT 1
    FROM sys.indexes
    WHERE name = 'IDX_AUTO_MJ_FKEY_MemberProfile_PersonID' 
    AND object_id = OBJECT_ID('[${flyway:defaultSchema}].[MemberProfile]')
)
CREATE INDEX IDX_AUTO_MJ_FKEY_MemberProfile_PersonID ON [${flyway:defaultSchema}].[MemberProfile] ([PersonID]);

-- Index for foreign key OrganizationID in table MemberProfile
IF NOT EXISTS (
    SELECT 1
    FROM sys.indexes
    WHERE name = 'IDX_AUTO_MJ_FKEY_MemberProfile_OrganizationID' 
    AND object_id = OBJECT_ID('[${flyway:defaultSchema}].[MemberProfile]')
)
CREATE INDEX IDX_AUTO_MJ_FKEY_MemberProfile_OrganizationID ON [${flyway:defaultSchema}].[MemberProfile] ([OrganizationID]);

/* SQL text to update entity field related entity name field map for entity field ID F05FE60F-083C-48C1-9F86-97B21710A48E */
EXEC [${mjSchema}].[spUpdateEntityFieldRelatedEntityNameFieldMap] @EntityFieldID='F05FE60F-083C-48C1-9F86-97B21710A48E', @RelatedEntityNameFieldMap='Person';

/* Index for Foreign Keys for MembershipPeriod */
-----------------------------------------------------------------
-- SQL Code Generation
-- Entity: MoreCheese: Membership Periods
-- Item: Index for Foreign Keys
--
-- This was generated by the MemberJunction CodeGen tool.
-- This file should NOT be edited by hand.
-----------------------------------------------------------------
-- Index for foreign key PersonID in table MembershipPeriod
IF NOT EXISTS (
    SELECT 1
    FROM sys.indexes
    WHERE name = 'IDX_AUTO_MJ_FKEY_MembershipPeriod_PersonID' 
    AND object_id = OBJECT_ID('[${flyway:defaultSchema}].[MembershipPeriod]')
)
CREATE INDEX IDX_AUTO_MJ_FKEY_MembershipPeriod_PersonID ON [${flyway:defaultSchema}].[MembershipPeriod] ([PersonID]);

/* SQL text to update entity field related entity name field map for entity field ID 5D36973E-4CA0-42C1-A641-653E3A3962F3 */
EXEC [${mjSchema}].[spUpdateEntityFieldRelatedEntityNameFieldMap] @EntityFieldID='5D36973E-4CA0-42C1-A641-653E3A3962F3', @RelatedEntityNameFieldMap='Person';

/* Index for Foreign Keys for OrganizationProfile */
-----------------------------------------------------------------
-- SQL Code Generation
-- Entity: MoreCheese: Organization Profiles
-- Item: Index for Foreign Keys
--
-- This was generated by the MemberJunction CodeGen tool.
-- This file should NOT be edited by hand.
-----------------------------------------------------------------
-- Index for foreign key OrganizationID in table OrganizationProfile
IF NOT EXISTS (
    SELECT 1
    FROM sys.indexes
    WHERE name = 'IDX_AUTO_MJ_FKEY_OrganizationProfile_OrganizationID' 
    AND object_id = OBJECT_ID('[${flyway:defaultSchema}].[OrganizationProfile]')
)
CREATE INDEX IDX_AUTO_MJ_FKEY_OrganizationProfile_OrganizationID ON [${flyway:defaultSchema}].[OrganizationProfile] ([OrganizationID]);

/* SQL text to update entity field related entity name field map for entity field ID 51DD3FFC-E786-49E1-902D-F0589D67C50B */
EXEC [${mjSchema}].[spUpdateEntityFieldRelatedEntityNameFieldMap] @EntityFieldID='51DD3FFC-E786-49E1-902D-F0589D67C50B', @RelatedEntityNameFieldMap='Organization';

/* SQL text to update entity field related entity name field map for entity field ID 2EC02BCB-8F76-4E3A-917C-19717E80C66C */
EXEC [${mjSchema}].[spUpdateEntityFieldRelatedEntityNameFieldMap] @EntityFieldID='2EC02BCB-8F76-4E3A-917C-19717E80C66C', @RelatedEntityNameFieldMap='Certification';

/* SQL text to update entity field related entity name field map for entity field ID DCC3A015-251A-41C5-9242-9F228D457D1E */
EXEC [${mjSchema}].[spUpdateEntityFieldRelatedEntityNameFieldMap] @EntityFieldID='DCC3A015-251A-41C5-9242-9F228D457D1E', @RelatedEntityNameFieldMap='Organization';

/* Base View SQL for MoreCheese: Organization Profiles */
-----------------------------------------------------------------
-- SQL Code Generation
-- Entity: MoreCheese: Organization Profiles
-- Item: vwOrganizationProfiles
--
-- This was generated by the MemberJunction CodeGen tool.
-- This file should NOT be edited by hand.
-----------------------------------------------------------------

------------------------------------------------------------
----- BASE VIEW FOR ENTITY:      MoreCheese: Organization Profiles
-----               SCHEMA:      ${flyway:defaultSchema}
-----               BASE TABLE:  OrganizationProfile
-----               PRIMARY KEY: ID
------------------------------------------------------------
IF OBJECT_ID('[${flyway:defaultSchema}].[vwOrganizationProfiles]', 'V') IS NOT NULL
    DROP VIEW [${flyway:defaultSchema}].[vwOrganizationProfiles];
GO

CREATE VIEW [${flyway:defaultSchema}].[vwOrganizationProfiles]
AS
SELECT
    o.*,
    mjBizAppsCommonOrganization_OrganizationID.[Name] AS [Organization]
FROM
    [${flyway:defaultSchema}].[OrganizationProfile] AS o
INNER JOIN
    [${mjSchema}_BizAppsCommon].[Organization] AS mjBizAppsCommonOrganization_OrganizationID
  ON
    [o].[OrganizationID] = mjBizAppsCommonOrganization_OrganizationID.[ID]
GO
GRANT SELECT ON [${flyway:defaultSchema}].[vwOrganizationProfiles] TO [cdp_UI], [cdp_Developer], [cdp_Integration];

/* Base View Permissions SQL for MoreCheese: Organization Profiles */
-----------------------------------------------------------------
-- SQL Code Generation
-- Entity: MoreCheese: Organization Profiles
-- Item: Permissions for vwOrganizationProfiles
--
-- This was generated by the MemberJunction CodeGen tool.
-- This file should NOT be edited by hand.
-----------------------------------------------------------------

GRANT SELECT ON [${flyway:defaultSchema}].[vwOrganizationProfiles] TO [cdp_UI], [cdp_Developer], [cdp_Integration];

/* spCreate SQL for MoreCheese: Organization Profiles */
-----------------------------------------------------------------
-- SQL Code Generation
-- Entity: MoreCheese: Organization Profiles
-- Item: spCreateOrganizationProfile
--
-- This was generated by the MemberJunction CodeGen tool.
-- This file should NOT be edited by hand.
-----------------------------------------------------------------

------------------------------------------------------------
----- CREATE PROCEDURE FOR OrganizationProfile
------------------------------------------------------------
IF OBJECT_ID('[${flyway:defaultSchema}].[spCreateOrganizationProfile]', 'P') IS NOT NULL
    DROP PROCEDURE [${flyway:defaultSchema}].[spCreateOrganizationProfile];
GO

CREATE PROCEDURE [${flyway:defaultSchema}].[spCreateOrganizationProfile]
    @ID uniqueidentifier = NULL,
    @OrganizationID uniqueidentifier,
    @OrgKey nvarchar(50),
    @Type nvarchar(50),
    @Region nvarchar(50),
    @Country_Clear bit = 0,
    @Country nvarchar(2) = NULL,
    @CountryName_Clear bit = 0,
    @CountryName nvarchar(100) = NULL,
    @City nvarchar(100),
    @State nvarchar(50),
    @AddressLine1_Clear bit = 0,
    @AddressLine1 nvarchar(200) = NULL,
    @PostalCode_Clear bit = 0,
    @PostalCode nvarchar(20) = NULL,
    @Latitude decimal(9, 6),
    @Longitude decimal(9, 6),
    @LifecycleEventKind_Clear bit = 0,
    @LifecycleEventKind nvarchar(50) = NULL,
    @LifecycleEventYear_Clear bit = 0,
    @LifecycleEventYear int = NULL,
    @IsSharedDemo bit = NULL
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @InsertedRow TABLE ([ID] UNIQUEIDENTIFIER)

    IF @ID IS NOT NULL
    BEGIN
        -- User provided a value, use it
        INSERT INTO [${flyway:defaultSchema}].[OrganizationProfile]
            (
                [ID],
                [OrganizationID],
                [OrgKey],
                [Type],
                [Region],
                [Country],
                [CountryName],
                [City],
                [State],
                [AddressLine1],
                [PostalCode],
                [Latitude],
                [Longitude],
                [LifecycleEventKind],
                [LifecycleEventYear],
                [IsSharedDemo]
            )
        OUTPUT INSERTED.[ID] INTO @InsertedRow
        VALUES
            (
                @ID,
                @OrganizationID,
                @OrgKey,
                @Type,
                @Region,
                CASE WHEN @Country_Clear = 1 THEN NULL ELSE ISNULL(@Country, NULL) END,
                CASE WHEN @CountryName_Clear = 1 THEN NULL ELSE ISNULL(@CountryName, NULL) END,
                @City,
                @State,
                CASE WHEN @AddressLine1_Clear = 1 THEN NULL ELSE ISNULL(@AddressLine1, NULL) END,
                CASE WHEN @PostalCode_Clear = 1 THEN NULL ELSE ISNULL(@PostalCode, NULL) END,
                @Latitude,
                @Longitude,
                CASE WHEN @LifecycleEventKind_Clear = 1 THEN NULL ELSE ISNULL(@LifecycleEventKind, NULL) END,
                CASE WHEN @LifecycleEventYear_Clear = 1 THEN NULL ELSE ISNULL(@LifecycleEventYear, NULL) END,
                ISNULL(@IsSharedDemo, 1)
            )
    END
    ELSE
    BEGIN
        -- No value provided, let database use its default (e.g., NEWSEQUENTIALID())
        INSERT INTO [${flyway:defaultSchema}].[OrganizationProfile]
            (
                [OrganizationID],
                [OrgKey],
                [Type],
                [Region],
                [Country],
                [CountryName],
                [City],
                [State],
                [AddressLine1],
                [PostalCode],
                [Latitude],
                [Longitude],
                [LifecycleEventKind],
                [LifecycleEventYear],
                [IsSharedDemo]
            )
        OUTPUT INSERTED.[ID] INTO @InsertedRow
        VALUES
            (
                @OrganizationID,
                @OrgKey,
                @Type,
                @Region,
                CASE WHEN @Country_Clear = 1 THEN NULL ELSE ISNULL(@Country, NULL) END,
                CASE WHEN @CountryName_Clear = 1 THEN NULL ELSE ISNULL(@CountryName, NULL) END,
                @City,
                @State,
                CASE WHEN @AddressLine1_Clear = 1 THEN NULL ELSE ISNULL(@AddressLine1, NULL) END,
                CASE WHEN @PostalCode_Clear = 1 THEN NULL ELSE ISNULL(@PostalCode, NULL) END,
                @Latitude,
                @Longitude,
                CASE WHEN @LifecycleEventKind_Clear = 1 THEN NULL ELSE ISNULL(@LifecycleEventKind, NULL) END,
                CASE WHEN @LifecycleEventYear_Clear = 1 THEN NULL ELSE ISNULL(@LifecycleEventYear, NULL) END,
                ISNULL(@IsSharedDemo, 1)
            )
    END
    -- return the new record from the base view, which might have some calculated fields
    SELECT * FROM [${flyway:defaultSchema}].[vwOrganizationProfiles] WHERE [ID] = (SELECT [ID] FROM @InsertedRow)
END
GO
GRANT EXECUTE ON [${flyway:defaultSchema}].[spCreateOrganizationProfile] TO [cdp_Developer], [cdp_Integration];

/* spCreate Permissions for MoreCheese: Organization Profiles */

GRANT EXECUTE ON [${flyway:defaultSchema}].[spCreateOrganizationProfile] TO [cdp_Developer], [cdp_Integration];

/* spUpdate SQL for MoreCheese: Organization Profiles */
-----------------------------------------------------------------
-- SQL Code Generation
-- Entity: MoreCheese: Organization Profiles
-- Item: spUpdateOrganizationProfile
--
-- This was generated by the MemberJunction CodeGen tool.
-- This file should NOT be edited by hand.
-----------------------------------------------------------------

------------------------------------------------------------
----- UPDATE PROCEDURE FOR OrganizationProfile
------------------------------------------------------------
IF OBJECT_ID('[${flyway:defaultSchema}].[spUpdateOrganizationProfile]', 'P') IS NOT NULL
    DROP PROCEDURE [${flyway:defaultSchema}].[spUpdateOrganizationProfile];
GO

CREATE PROCEDURE [${flyway:defaultSchema}].[spUpdateOrganizationProfile]
    @ID uniqueidentifier,
    @OrganizationID uniqueidentifier = NULL,
    @OrgKey nvarchar(50) = NULL,
    @Type nvarchar(50) = NULL,
    @Region nvarchar(50) = NULL,
    @Country_Clear bit = 0,
    @Country nvarchar(2) = NULL,
    @CountryName_Clear bit = 0,
    @CountryName nvarchar(100) = NULL,
    @City nvarchar(100) = NULL,
    @State nvarchar(50) = NULL,
    @AddressLine1_Clear bit = 0,
    @AddressLine1 nvarchar(200) = NULL,
    @PostalCode_Clear bit = 0,
    @PostalCode nvarchar(20) = NULL,
    @Latitude decimal(9, 6) = NULL,
    @Longitude decimal(9, 6) = NULL,
    @LifecycleEventKind_Clear bit = 0,
    @LifecycleEventKind nvarchar(50) = NULL,
    @LifecycleEventYear_Clear bit = 0,
    @LifecycleEventYear int = NULL,
    @IsSharedDemo bit = NULL
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE
        [${flyway:defaultSchema}].[OrganizationProfile]
    SET
        [OrganizationID] = ISNULL(@OrganizationID, [OrganizationID]),
        [OrgKey] = ISNULL(@OrgKey, [OrgKey]),
        [Type] = ISNULL(@Type, [Type]),
        [Region] = ISNULL(@Region, [Region]),
        [Country] = CASE WHEN @Country_Clear = 1 THEN NULL ELSE ISNULL(@Country, [Country]) END,
        [CountryName] = CASE WHEN @CountryName_Clear = 1 THEN NULL ELSE ISNULL(@CountryName, [CountryName]) END,
        [City] = ISNULL(@City, [City]),
        [State] = ISNULL(@State, [State]),
        [AddressLine1] = CASE WHEN @AddressLine1_Clear = 1 THEN NULL ELSE ISNULL(@AddressLine1, [AddressLine1]) END,
        [PostalCode] = CASE WHEN @PostalCode_Clear = 1 THEN NULL ELSE ISNULL(@PostalCode, [PostalCode]) END,
        [Latitude] = ISNULL(@Latitude, [Latitude]),
        [Longitude] = ISNULL(@Longitude, [Longitude]),
        [LifecycleEventKind] = CASE WHEN @LifecycleEventKind_Clear = 1 THEN NULL ELSE ISNULL(@LifecycleEventKind, [LifecycleEventKind]) END,
        [LifecycleEventYear] = CASE WHEN @LifecycleEventYear_Clear = 1 THEN NULL ELSE ISNULL(@LifecycleEventYear, [LifecycleEventYear]) END,
        [IsSharedDemo] = ISNULL(@IsSharedDemo, [IsSharedDemo])
    WHERE
        [ID] = @ID

    -- Check if the update was successful
    IF @@ROWCOUNT = 0
        -- Nothing was updated, return no rows, but column structure from base view intact, semantically correct this way.
        SELECT TOP 0 * FROM [${flyway:defaultSchema}].[vwOrganizationProfiles] WHERE 1=0
    ELSE
        -- Return the updated record so the caller can see the updated values and any calculated fields
        SELECT
                                        *
                                    FROM
                                        [${flyway:defaultSchema}].[vwOrganizationProfiles]
                                    WHERE
                                        [ID] = @ID
                                    
END
GO

GRANT EXECUTE ON [${flyway:defaultSchema}].[spUpdateOrganizationProfile] TO [cdp_Developer], [cdp_Integration]
GO

------------------------------------------------------------
----- TRIGGER FOR __mj_UpdatedAt field for the OrganizationProfile table
------------------------------------------------------------
IF OBJECT_ID('[${flyway:defaultSchema}].[trgUpdateOrganizationProfile]', 'TR') IS NOT NULL
    DROP TRIGGER [${flyway:defaultSchema}].[trgUpdateOrganizationProfile];
GO
CREATE TRIGGER [${flyway:defaultSchema}].trgUpdateOrganizationProfile
ON [${flyway:defaultSchema}].[OrganizationProfile]
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE
        [${flyway:defaultSchema}].[OrganizationProfile]
    SET
        __mj_UpdatedAt = GETUTCDATE()
    FROM
        [${flyway:defaultSchema}].[OrganizationProfile] AS _organicTable
    INNER JOIN
        INSERTED AS I ON
        _organicTable.[ID] = I.[ID];
END;
GO

/* spUpdate Permissions for MoreCheese: Organization Profiles */

GRANT EXECUTE ON [${flyway:defaultSchema}].[spUpdateOrganizationProfile] TO [cdp_Developer], [cdp_Integration];

/* spDelete SQL for MoreCheese: Organization Profiles */
-----------------------------------------------------------------
-- SQL Code Generation
-- Entity: MoreCheese: Organization Profiles
-- Item: spDeleteOrganizationProfile
--
-- This was generated by the MemberJunction CodeGen tool.
-- This file should NOT be edited by hand.
-----------------------------------------------------------------

------------------------------------------------------------
----- DELETE PROCEDURE FOR OrganizationProfile
------------------------------------------------------------
IF OBJECT_ID('[${flyway:defaultSchema}].[spDeleteOrganizationProfile]', 'P') IS NOT NULL
    DROP PROCEDURE [${flyway:defaultSchema}].[spDeleteOrganizationProfile];
GO

CREATE PROCEDURE [${flyway:defaultSchema}].[spDeleteOrganizationProfile]
    @ID uniqueidentifier
AS
BEGIN
    SET NOCOUNT ON;

    DELETE FROM
        [${flyway:defaultSchema}].[OrganizationProfile]
    WHERE
        [ID] = @ID


    -- Check if the delete was successful
    IF @@ROWCOUNT = 0
        SELECT NULL AS [ID] -- Return NULL for all primary key fields to indicate no record was deleted
    ELSE
        SELECT @ID AS [ID] -- Return the primary key values to indicate we successfully deleted the record
END
GO
GRANT EXECUTE ON [${flyway:defaultSchema}].[spDeleteOrganizationProfile] TO [cdp_Developer], [cdp_Integration];

/* spDelete Permissions for MoreCheese: Organization Profiles */

GRANT EXECUTE ON [${flyway:defaultSchema}].[spDeleteOrganizationProfile] TO [cdp_Developer], [cdp_Integration];

/* Base View SQL for MoreCheese: Membership Periods */
-----------------------------------------------------------------
-- SQL Code Generation
-- Entity: MoreCheese: Membership Periods
-- Item: vwMembershipPeriods
--
-- This was generated by the MemberJunction CodeGen tool.
-- This file should NOT be edited by hand.
-----------------------------------------------------------------

------------------------------------------------------------
----- BASE VIEW FOR ENTITY:      MoreCheese: Membership Periods
-----               SCHEMA:      ${flyway:defaultSchema}
-----               BASE TABLE:  MembershipPeriod
-----               PRIMARY KEY: ID
------------------------------------------------------------
IF OBJECT_ID('[${flyway:defaultSchema}].[vwMembershipPeriods]', 'V') IS NOT NULL
    DROP VIEW [${flyway:defaultSchema}].[vwMembershipPeriods];
GO

CREATE VIEW [${flyway:defaultSchema}].[vwMembershipPeriods]
AS
SELECT
    m.*,
    mjBizAppsCommonPerson_PersonID.[DisplayName] AS [Person]
FROM
    [${flyway:defaultSchema}].[MembershipPeriod] AS m
INNER JOIN
    [${mjSchema}_BizAppsCommon].[Person] AS mjBizAppsCommonPerson_PersonID
  ON
    [m].[PersonID] = mjBizAppsCommonPerson_PersonID.[ID]
GO
GRANT SELECT ON [${flyway:defaultSchema}].[vwMembershipPeriods] TO [cdp_UI], [cdp_Developer], [cdp_Integration];

/* Base View Permissions SQL for MoreCheese: Membership Periods */
-----------------------------------------------------------------
-- SQL Code Generation
-- Entity: MoreCheese: Membership Periods
-- Item: Permissions for vwMembershipPeriods
--
-- This was generated by the MemberJunction CodeGen tool.
-- This file should NOT be edited by hand.
-----------------------------------------------------------------

GRANT SELECT ON [${flyway:defaultSchema}].[vwMembershipPeriods] TO [cdp_UI], [cdp_Developer], [cdp_Integration];

/* spCreate SQL for MoreCheese: Membership Periods */
-----------------------------------------------------------------
-- SQL Code Generation
-- Entity: MoreCheese: Membership Periods
-- Item: spCreateMembershipPeriod
--
-- This was generated by the MemberJunction CodeGen tool.
-- This file should NOT be edited by hand.
-----------------------------------------------------------------

------------------------------------------------------------
----- CREATE PROCEDURE FOR MembershipPeriod
------------------------------------------------------------
IF OBJECT_ID('[${flyway:defaultSchema}].[spCreateMembershipPeriod]', 'P') IS NOT NULL
    DROP PROCEDURE [${flyway:defaultSchema}].[spCreateMembershipPeriod];
GO

CREATE PROCEDURE [${flyway:defaultSchema}].[spCreateMembershipPeriod]
    @ID uniqueidentifier = NULL,
    @PeriodKey nvarchar(60),
    @PersonID uniqueidentifier,
    @MembershipTier nvarchar(50),
    @DuesAmount decimal(10, 2),
    @StartDate date,
    @EndDate date,
    @RenewalDate date,
    @Status nvarchar(50),
    @CancellationDate_Clear bit = 0,
    @CancellationDate date = NULL,
    @CancellationReason_Clear bit = 0,
    @CancellationReason nvarchar(200) = NULL,
    @AutoRenew bit = NULL,
    @IsSharedDemo bit = NULL
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @InsertedRow TABLE ([ID] UNIQUEIDENTIFIER)

    IF @ID IS NOT NULL
    BEGIN
        -- User provided a value, use it
        INSERT INTO [${flyway:defaultSchema}].[MembershipPeriod]
            (
                [ID],
                [PeriodKey],
                [PersonID],
                [MembershipTier],
                [DuesAmount],
                [StartDate],
                [EndDate],
                [RenewalDate],
                [Status],
                [CancellationDate],
                [CancellationReason],
                [AutoRenew],
                [IsSharedDemo]
            )
        OUTPUT INSERTED.[ID] INTO @InsertedRow
        VALUES
            (
                @ID,
                @PeriodKey,
                @PersonID,
                @MembershipTier,
                @DuesAmount,
                @StartDate,
                @EndDate,
                @RenewalDate,
                @Status,
                CASE WHEN @CancellationDate_Clear = 1 THEN NULL ELSE ISNULL(@CancellationDate, NULL) END,
                CASE WHEN @CancellationReason_Clear = 1 THEN NULL ELSE ISNULL(@CancellationReason, NULL) END,
                ISNULL(@AutoRenew, 0),
                ISNULL(@IsSharedDemo, 1)
            )
    END
    ELSE
    BEGIN
        -- No value provided, let database use its default (e.g., NEWSEQUENTIALID())
        INSERT INTO [${flyway:defaultSchema}].[MembershipPeriod]
            (
                [PeriodKey],
                [PersonID],
                [MembershipTier],
                [DuesAmount],
                [StartDate],
                [EndDate],
                [RenewalDate],
                [Status],
                [CancellationDate],
                [CancellationReason],
                [AutoRenew],
                [IsSharedDemo]
            )
        OUTPUT INSERTED.[ID] INTO @InsertedRow
        VALUES
            (
                @PeriodKey,
                @PersonID,
                @MembershipTier,
                @DuesAmount,
                @StartDate,
                @EndDate,
                @RenewalDate,
                @Status,
                CASE WHEN @CancellationDate_Clear = 1 THEN NULL ELSE ISNULL(@CancellationDate, NULL) END,
                CASE WHEN @CancellationReason_Clear = 1 THEN NULL ELSE ISNULL(@CancellationReason, NULL) END,
                ISNULL(@AutoRenew, 0),
                ISNULL(@IsSharedDemo, 1)
            )
    END
    -- return the new record from the base view, which might have some calculated fields
    SELECT * FROM [${flyway:defaultSchema}].[vwMembershipPeriods] WHERE [ID] = (SELECT [ID] FROM @InsertedRow)
END
GO
GRANT EXECUTE ON [${flyway:defaultSchema}].[spCreateMembershipPeriod] TO [cdp_Developer], [cdp_Integration];

/* spCreate Permissions for MoreCheese: Membership Periods */

GRANT EXECUTE ON [${flyway:defaultSchema}].[spCreateMembershipPeriod] TO [cdp_Developer], [cdp_Integration];

/* spUpdate SQL for MoreCheese: Membership Periods */
-----------------------------------------------------------------
-- SQL Code Generation
-- Entity: MoreCheese: Membership Periods
-- Item: spUpdateMembershipPeriod
--
-- This was generated by the MemberJunction CodeGen tool.
-- This file should NOT be edited by hand.
-----------------------------------------------------------------

------------------------------------------------------------
----- UPDATE PROCEDURE FOR MembershipPeriod
------------------------------------------------------------
IF OBJECT_ID('[${flyway:defaultSchema}].[spUpdateMembershipPeriod]', 'P') IS NOT NULL
    DROP PROCEDURE [${flyway:defaultSchema}].[spUpdateMembershipPeriod];
GO

CREATE PROCEDURE [${flyway:defaultSchema}].[spUpdateMembershipPeriod]
    @ID uniqueidentifier,
    @PeriodKey nvarchar(60) = NULL,
    @PersonID uniqueidentifier = NULL,
    @MembershipTier nvarchar(50) = NULL,
    @DuesAmount decimal(10, 2) = NULL,
    @StartDate date = NULL,
    @EndDate date = NULL,
    @RenewalDate date = NULL,
    @Status nvarchar(50) = NULL,
    @CancellationDate_Clear bit = 0,
    @CancellationDate date = NULL,
    @CancellationReason_Clear bit = 0,
    @CancellationReason nvarchar(200) = NULL,
    @AutoRenew bit = NULL,
    @IsSharedDemo bit = NULL
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE
        [${flyway:defaultSchema}].[MembershipPeriod]
    SET
        [PeriodKey] = ISNULL(@PeriodKey, [PeriodKey]),
        [PersonID] = ISNULL(@PersonID, [PersonID]),
        [MembershipTier] = ISNULL(@MembershipTier, [MembershipTier]),
        [DuesAmount] = ISNULL(@DuesAmount, [DuesAmount]),
        [StartDate] = ISNULL(@StartDate, [StartDate]),
        [EndDate] = ISNULL(@EndDate, [EndDate]),
        [RenewalDate] = ISNULL(@RenewalDate, [RenewalDate]),
        [Status] = ISNULL(@Status, [Status]),
        [CancellationDate] = CASE WHEN @CancellationDate_Clear = 1 THEN NULL ELSE ISNULL(@CancellationDate, [CancellationDate]) END,
        [CancellationReason] = CASE WHEN @CancellationReason_Clear = 1 THEN NULL ELSE ISNULL(@CancellationReason, [CancellationReason]) END,
        [AutoRenew] = ISNULL(@AutoRenew, [AutoRenew]),
        [IsSharedDemo] = ISNULL(@IsSharedDemo, [IsSharedDemo])
    WHERE
        [ID] = @ID

    -- Check if the update was successful
    IF @@ROWCOUNT = 0
        -- Nothing was updated, return no rows, but column structure from base view intact, semantically correct this way.
        SELECT TOP 0 * FROM [${flyway:defaultSchema}].[vwMembershipPeriods] WHERE 1=0
    ELSE
        -- Return the updated record so the caller can see the updated values and any calculated fields
        SELECT
                                        *
                                    FROM
                                        [${flyway:defaultSchema}].[vwMembershipPeriods]
                                    WHERE
                                        [ID] = @ID
                                    
END
GO

GRANT EXECUTE ON [${flyway:defaultSchema}].[spUpdateMembershipPeriod] TO [cdp_Developer], [cdp_Integration]
GO

------------------------------------------------------------
----- TRIGGER FOR __mj_UpdatedAt field for the MembershipPeriod table
------------------------------------------------------------
IF OBJECT_ID('[${flyway:defaultSchema}].[trgUpdateMembershipPeriod]', 'TR') IS NOT NULL
    DROP TRIGGER [${flyway:defaultSchema}].[trgUpdateMembershipPeriod];
GO
CREATE TRIGGER [${flyway:defaultSchema}].trgUpdateMembershipPeriod
ON [${flyway:defaultSchema}].[MembershipPeriod]
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE
        [${flyway:defaultSchema}].[MembershipPeriod]
    SET
        __mj_UpdatedAt = GETUTCDATE()
    FROM
        [${flyway:defaultSchema}].[MembershipPeriod] AS _organicTable
    INNER JOIN
        INSERTED AS I ON
        _organicTable.[ID] = I.[ID];
END;
GO

/* spUpdate Permissions for MoreCheese: Membership Periods */

GRANT EXECUTE ON [${flyway:defaultSchema}].[spUpdateMembershipPeriod] TO [cdp_Developer], [cdp_Integration];

/* spDelete SQL for MoreCheese: Membership Periods */
-----------------------------------------------------------------
-- SQL Code Generation
-- Entity: MoreCheese: Membership Periods
-- Item: spDeleteMembershipPeriod
--
-- This was generated by the MemberJunction CodeGen tool.
-- This file should NOT be edited by hand.
-----------------------------------------------------------------

------------------------------------------------------------
----- DELETE PROCEDURE FOR MembershipPeriod
------------------------------------------------------------
IF OBJECT_ID('[${flyway:defaultSchema}].[spDeleteMembershipPeriod]', 'P') IS NOT NULL
    DROP PROCEDURE [${flyway:defaultSchema}].[spDeleteMembershipPeriod];
GO

CREATE PROCEDURE [${flyway:defaultSchema}].[spDeleteMembershipPeriod]
    @ID uniqueidentifier
AS
BEGIN
    SET NOCOUNT ON;

    DELETE FROM
        [${flyway:defaultSchema}].[MembershipPeriod]
    WHERE
        [ID] = @ID


    -- Check if the delete was successful
    IF @@ROWCOUNT = 0
        SELECT NULL AS [ID] -- Return NULL for all primary key fields to indicate no record was deleted
    ELSE
        SELECT @ID AS [ID] -- Return the primary key values to indicate we successfully deleted the record
END
GO
GRANT EXECUTE ON [${flyway:defaultSchema}].[spDeleteMembershipPeriod] TO [cdp_Developer], [cdp_Integration];

/* spDelete Permissions for MoreCheese: Membership Periods */

GRANT EXECUTE ON [${flyway:defaultSchema}].[spDeleteMembershipPeriod] TO [cdp_Developer], [cdp_Integration];

/* Base View SQL for MoreCheese: Member Certifications */
-----------------------------------------------------------------
-- SQL Code Generation
-- Entity: MoreCheese: Member Certifications
-- Item: vwMemberCertifications
--
-- This was generated by the MemberJunction CodeGen tool.
-- This file should NOT be edited by hand.
-----------------------------------------------------------------

------------------------------------------------------------
----- BASE VIEW FOR ENTITY:      MoreCheese: Member Certifications
-----               SCHEMA:      morecheese_learning
-----               BASE TABLE:  MemberCertification
-----               PRIMARY KEY: ID
------------------------------------------------------------
IF OBJECT_ID('[morecheese_learning].[vwMemberCertifications]', 'V') IS NOT NULL
    DROP VIEW [morecheese_learning].[vwMemberCertifications];
GO

CREATE VIEW [morecheese_learning].[vwMemberCertifications]
AS
SELECT
    m.*,
    mjBizAppsCommonPerson_PersonID.[DisplayName] AS [Person],
    morecheeselearningCertification_CertificationID.[Name] AS [Certification]
FROM
    [morecheese_learning].[MemberCertification] AS m
INNER JOIN
    [${mjSchema}_BizAppsCommon].[Person] AS mjBizAppsCommonPerson_PersonID
  ON
    [m].[PersonID] = mjBizAppsCommonPerson_PersonID.[ID]
INNER JOIN
    [morecheese_learning].[Certification] AS morecheeselearningCertification_CertificationID
  ON
    [m].[CertificationID] = morecheeselearningCertification_CertificationID.[ID]
GO
GRANT SELECT ON [morecheese_learning].[vwMemberCertifications] TO [cdp_UI], [cdp_Developer], [cdp_Integration];

/* Base View Permissions SQL for MoreCheese: Member Certifications */
-----------------------------------------------------------------
-- SQL Code Generation
-- Entity: MoreCheese: Member Certifications
-- Item: Permissions for vwMemberCertifications
--
-- This was generated by the MemberJunction CodeGen tool.
-- This file should NOT be edited by hand.
-----------------------------------------------------------------

GRANT SELECT ON [morecheese_learning].[vwMemberCertifications] TO [cdp_UI], [cdp_Developer], [cdp_Integration];

/* spCreate SQL for MoreCheese: Member Certifications */
-----------------------------------------------------------------
-- SQL Code Generation
-- Entity: MoreCheese: Member Certifications
-- Item: spCreateMemberCertification
--
-- This was generated by the MemberJunction CodeGen tool.
-- This file should NOT be edited by hand.
-----------------------------------------------------------------

------------------------------------------------------------
----- CREATE PROCEDURE FOR MemberCertification
------------------------------------------------------------
IF OBJECT_ID('[morecheese_learning].[spCreateMemberCertification]', 'P') IS NOT NULL
    DROP PROCEDURE [morecheese_learning].[spCreateMemberCertification];
GO

CREATE PROCEDURE [morecheese_learning].[spCreateMemberCertification]
    @ID uniqueidentifier = NULL,
    @MemberCertKey nvarchar(80),
    @PersonID uniqueidentifier,
    @CertificationID uniqueidentifier,
    @Status nvarchar(50),
    @EnrolledOn date,
    @AwardedOn_Clear bit = 0,
    @AwardedOn date = NULL,
    @ExpiresOn_Clear bit = 0,
    @ExpiresOn date = NULL,
    @IsSharedDemo bit = NULL
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @InsertedRow TABLE ([ID] UNIQUEIDENTIFIER)

    IF @ID IS NOT NULL
    BEGIN
        -- User provided a value, use it
        INSERT INTO [morecheese_learning].[MemberCertification]
            (
                [ID],
                [MemberCertKey],
                [PersonID],
                [CertificationID],
                [Status],
                [EnrolledOn],
                [AwardedOn],
                [ExpiresOn],
                [IsSharedDemo]
            )
        OUTPUT INSERTED.[ID] INTO @InsertedRow
        VALUES
            (
                @ID,
                @MemberCertKey,
                @PersonID,
                @CertificationID,
                @Status,
                @EnrolledOn,
                CASE WHEN @AwardedOn_Clear = 1 THEN NULL ELSE ISNULL(@AwardedOn, NULL) END,
                CASE WHEN @ExpiresOn_Clear = 1 THEN NULL ELSE ISNULL(@ExpiresOn, NULL) END,
                ISNULL(@IsSharedDemo, 1)
            )
    END
    ELSE
    BEGIN
        -- No value provided, let database use its default (e.g., NEWSEQUENTIALID())
        INSERT INTO [morecheese_learning].[MemberCertification]
            (
                [MemberCertKey],
                [PersonID],
                [CertificationID],
                [Status],
                [EnrolledOn],
                [AwardedOn],
                [ExpiresOn],
                [IsSharedDemo]
            )
        OUTPUT INSERTED.[ID] INTO @InsertedRow
        VALUES
            (
                @MemberCertKey,
                @PersonID,
                @CertificationID,
                @Status,
                @EnrolledOn,
                CASE WHEN @AwardedOn_Clear = 1 THEN NULL ELSE ISNULL(@AwardedOn, NULL) END,
                CASE WHEN @ExpiresOn_Clear = 1 THEN NULL ELSE ISNULL(@ExpiresOn, NULL) END,
                ISNULL(@IsSharedDemo, 1)
            )
    END
    -- return the new record from the base view, which might have some calculated fields
    SELECT * FROM [morecheese_learning].[vwMemberCertifications] WHERE [ID] = (SELECT [ID] FROM @InsertedRow)
END
GO
GRANT EXECUTE ON [morecheese_learning].[spCreateMemberCertification] TO [cdp_Developer], [cdp_Integration];

/* spCreate Permissions for MoreCheese: Member Certifications */

GRANT EXECUTE ON [morecheese_learning].[spCreateMemberCertification] TO [cdp_Developer], [cdp_Integration];

/* spUpdate SQL for MoreCheese: Member Certifications */
-----------------------------------------------------------------
-- SQL Code Generation
-- Entity: MoreCheese: Member Certifications
-- Item: spUpdateMemberCertification
--
-- This was generated by the MemberJunction CodeGen tool.
-- This file should NOT be edited by hand.
-----------------------------------------------------------------

------------------------------------------------------------
----- UPDATE PROCEDURE FOR MemberCertification
------------------------------------------------------------
IF OBJECT_ID('[morecheese_learning].[spUpdateMemberCertification]', 'P') IS NOT NULL
    DROP PROCEDURE [morecheese_learning].[spUpdateMemberCertification];
GO

CREATE PROCEDURE [morecheese_learning].[spUpdateMemberCertification]
    @ID uniqueidentifier,
    @MemberCertKey nvarchar(80) = NULL,
    @PersonID uniqueidentifier = NULL,
    @CertificationID uniqueidentifier = NULL,
    @Status nvarchar(50) = NULL,
    @EnrolledOn date = NULL,
    @AwardedOn_Clear bit = 0,
    @AwardedOn date = NULL,
    @ExpiresOn_Clear bit = 0,
    @ExpiresOn date = NULL,
    @IsSharedDemo bit = NULL
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE
        [morecheese_learning].[MemberCertification]
    SET
        [MemberCertKey] = ISNULL(@MemberCertKey, [MemberCertKey]),
        [PersonID] = ISNULL(@PersonID, [PersonID]),
        [CertificationID] = ISNULL(@CertificationID, [CertificationID]),
        [Status] = ISNULL(@Status, [Status]),
        [EnrolledOn] = ISNULL(@EnrolledOn, [EnrolledOn]),
        [AwardedOn] = CASE WHEN @AwardedOn_Clear = 1 THEN NULL ELSE ISNULL(@AwardedOn, [AwardedOn]) END,
        [ExpiresOn] = CASE WHEN @ExpiresOn_Clear = 1 THEN NULL ELSE ISNULL(@ExpiresOn, [ExpiresOn]) END,
        [IsSharedDemo] = ISNULL(@IsSharedDemo, [IsSharedDemo])
    WHERE
        [ID] = @ID

    -- Check if the update was successful
    IF @@ROWCOUNT = 0
        -- Nothing was updated, return no rows, but column structure from base view intact, semantically correct this way.
        SELECT TOP 0 * FROM [morecheese_learning].[vwMemberCertifications] WHERE 1=0
    ELSE
        -- Return the updated record so the caller can see the updated values and any calculated fields
        SELECT
                                        *
                                    FROM
                                        [morecheese_learning].[vwMemberCertifications]
                                    WHERE
                                        [ID] = @ID
                                    
END
GO

GRANT EXECUTE ON [morecheese_learning].[spUpdateMemberCertification] TO [cdp_Developer], [cdp_Integration]
GO

------------------------------------------------------------
----- TRIGGER FOR __mj_UpdatedAt field for the MemberCertification table
------------------------------------------------------------
IF OBJECT_ID('[morecheese_learning].[trgUpdateMemberCertification]', 'TR') IS NOT NULL
    DROP TRIGGER [morecheese_learning].[trgUpdateMemberCertification];
GO
CREATE TRIGGER [morecheese_learning].trgUpdateMemberCertification
ON [morecheese_learning].[MemberCertification]
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE
        [morecheese_learning].[MemberCertification]
    SET
        __mj_UpdatedAt = GETUTCDATE()
    FROM
        [morecheese_learning].[MemberCertification] AS _organicTable
    INNER JOIN
        INSERTED AS I ON
        _organicTable.[ID] = I.[ID];
END;
GO

/* spUpdate Permissions for MoreCheese: Member Certifications */

GRANT EXECUTE ON [morecheese_learning].[spUpdateMemberCertification] TO [cdp_Developer], [cdp_Integration];

/* spDelete SQL for MoreCheese: Member Certifications */
-----------------------------------------------------------------
-- SQL Code Generation
-- Entity: MoreCheese: Member Certifications
-- Item: spDeleteMemberCertification
--
-- This was generated by the MemberJunction CodeGen tool.
-- This file should NOT be edited by hand.
-----------------------------------------------------------------

------------------------------------------------------------
----- DELETE PROCEDURE FOR MemberCertification
------------------------------------------------------------
IF OBJECT_ID('[morecheese_learning].[spDeleteMemberCertification]', 'P') IS NOT NULL
    DROP PROCEDURE [morecheese_learning].[spDeleteMemberCertification];
GO

CREATE PROCEDURE [morecheese_learning].[spDeleteMemberCertification]
    @ID uniqueidentifier
AS
BEGIN
    SET NOCOUNT ON;

    DELETE FROM
        [morecheese_learning].[MemberCertification]
    WHERE
        [ID] = @ID


    -- Check if the delete was successful
    IF @@ROWCOUNT = 0
        SELECT NULL AS [ID] -- Return NULL for all primary key fields to indicate no record was deleted
    ELSE
        SELECT @ID AS [ID] -- Return the primary key values to indicate we successfully deleted the record
END
GO
GRANT EXECUTE ON [morecheese_learning].[spDeleteMemberCertification] TO [cdp_Developer], [cdp_Integration];

/* spDelete Permissions for MoreCheese: Member Certifications */

GRANT EXECUTE ON [morecheese_learning].[spDeleteMemberCertification] TO [cdp_Developer], [cdp_Integration];

/* Base View SQL for MoreCheese: Member Profiles */
-----------------------------------------------------------------
-- SQL Code Generation
-- Entity: MoreCheese: Member Profiles
-- Item: vwMemberProfiles
--
-- This was generated by the MemberJunction CodeGen tool.
-- This file should NOT be edited by hand.
-----------------------------------------------------------------

------------------------------------------------------------
----- BASE VIEW FOR ENTITY:      MoreCheese: Member Profiles
-----               SCHEMA:      ${flyway:defaultSchema}
-----               BASE TABLE:  MemberProfile
-----               PRIMARY KEY: ID
------------------------------------------------------------
IF OBJECT_ID('[${flyway:defaultSchema}].[vwMemberProfiles]', 'V') IS NOT NULL
    DROP VIEW [${flyway:defaultSchema}].[vwMemberProfiles];
GO

CREATE VIEW [${flyway:defaultSchema}].[vwMemberProfiles]
AS
SELECT
    m.*,
    mjBizAppsCommonPerson_PersonID.[DisplayName] AS [Person],
    mjBizAppsCommonOrganization_OrganizationID.[Name] AS [Organization]
FROM
    [${flyway:defaultSchema}].[MemberProfile] AS m
INNER JOIN
    [${mjSchema}_BizAppsCommon].[Person] AS mjBizAppsCommonPerson_PersonID
  ON
    [m].[PersonID] = mjBizAppsCommonPerson_PersonID.[ID]
LEFT OUTER JOIN
    [${mjSchema}_BizAppsCommon].[Organization] AS mjBizAppsCommonOrganization_OrganizationID
  ON
    [m].[OrganizationID] = mjBizAppsCommonOrganization_OrganizationID.[ID]
GO
GRANT SELECT ON [${flyway:defaultSchema}].[vwMemberProfiles] TO [cdp_UI], [cdp_Developer], [cdp_Integration];

/* Base View Permissions SQL for MoreCheese: Member Profiles */
-----------------------------------------------------------------
-- SQL Code Generation
-- Entity: MoreCheese: Member Profiles
-- Item: Permissions for vwMemberProfiles
--
-- This was generated by the MemberJunction CodeGen tool.
-- This file should NOT be edited by hand.
-----------------------------------------------------------------

GRANT SELECT ON [${flyway:defaultSchema}].[vwMemberProfiles] TO [cdp_UI], [cdp_Developer], [cdp_Integration];

/* spCreate SQL for MoreCheese: Member Profiles */
-----------------------------------------------------------------
-- SQL Code Generation
-- Entity: MoreCheese: Member Profiles
-- Item: spCreateMemberProfile
--
-- This was generated by the MemberJunction CodeGen tool.
-- This file should NOT be edited by hand.
-----------------------------------------------------------------

------------------------------------------------------------
----- CREATE PROCEDURE FOR MemberProfile
------------------------------------------------------------
IF OBJECT_ID('[${flyway:defaultSchema}].[spCreateMemberProfile]', 'P') IS NOT NULL
    DROP PROCEDURE [${flyway:defaultSchema}].[spCreateMemberProfile];
GO

CREATE PROCEDURE [${flyway:defaultSchema}].[spCreateMemberProfile]
    @ID uniqueidentifier = NULL,
    @PersonID uniqueidentifier,
    @OrganizationID_Clear bit = 0,
    @OrganizationID uniqueidentifier = NULL,
    @MemberNumber nvarchar(50),
    @Segment nvarchar(50),
    @Region nvarchar(50),
    @Country_Clear bit = 0,
    @Country nvarchar(2) = NULL,
    @CountryName_Clear bit = 0,
    @CountryName nvarchar(100) = NULL,
    @City nvarchar(100),
    @State nvarchar(50),
    @AddressLine1_Clear bit = 0,
    @AddressLine1 nvarchar(200) = NULL,
    @AddressLine2_Clear bit = 0,
    @AddressLine2 nvarchar(200) = NULL,
    @PostalCode_Clear bit = 0,
    @PostalCode nvarchar(20) = NULL,
    @Latitude decimal(9, 6),
    @Longitude decimal(9, 6),
    @JoinDate date,
    @RaceEthnicity_Clear bit = 0,
    @RaceEthnicity nvarchar(200) = NULL,
    @EthnicityHispanic_Clear bit = 0,
    @EthnicityHispanic nvarchar(30) = NULL,
    @PronounSet_Clear bit = 0,
    @PronounSet nvarchar(50) = NULL,
    @PrimaryLanguage_Clear bit = 0,
    @PrimaryLanguage nvarchar(50) = NULL,
    @IsSharedDemo bit = NULL
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @InsertedRow TABLE ([ID] UNIQUEIDENTIFIER)

    IF @ID IS NOT NULL
    BEGIN
        -- User provided a value, use it
        INSERT INTO [${flyway:defaultSchema}].[MemberProfile]
            (
                [ID],
                [PersonID],
                [OrganizationID],
                [MemberNumber],
                [Segment],
                [Region],
                [Country],
                [CountryName],
                [City],
                [State],
                [AddressLine1],
                [AddressLine2],
                [PostalCode],
                [Latitude],
                [Longitude],
                [JoinDate],
                [RaceEthnicity],
                [EthnicityHispanic],
                [PronounSet],
                [PrimaryLanguage],
                [IsSharedDemo]
            )
        OUTPUT INSERTED.[ID] INTO @InsertedRow
        VALUES
            (
                @ID,
                @PersonID,
                CASE WHEN @OrganizationID_Clear = 1 THEN NULL ELSE ISNULL(@OrganizationID, NULL) END,
                @MemberNumber,
                @Segment,
                @Region,
                CASE WHEN @Country_Clear = 1 THEN NULL ELSE ISNULL(@Country, NULL) END,
                CASE WHEN @CountryName_Clear = 1 THEN NULL ELSE ISNULL(@CountryName, NULL) END,
                @City,
                @State,
                CASE WHEN @AddressLine1_Clear = 1 THEN NULL ELSE ISNULL(@AddressLine1, NULL) END,
                CASE WHEN @AddressLine2_Clear = 1 THEN NULL ELSE ISNULL(@AddressLine2, NULL) END,
                CASE WHEN @PostalCode_Clear = 1 THEN NULL ELSE ISNULL(@PostalCode, NULL) END,
                @Latitude,
                @Longitude,
                @JoinDate,
                CASE WHEN @RaceEthnicity_Clear = 1 THEN NULL ELSE ISNULL(@RaceEthnicity, NULL) END,
                CASE WHEN @EthnicityHispanic_Clear = 1 THEN NULL ELSE ISNULL(@EthnicityHispanic, NULL) END,
                CASE WHEN @PronounSet_Clear = 1 THEN NULL ELSE ISNULL(@PronounSet, NULL) END,
                CASE WHEN @PrimaryLanguage_Clear = 1 THEN NULL ELSE ISNULL(@PrimaryLanguage, NULL) END,
                ISNULL(@IsSharedDemo, 1)
            )
    END
    ELSE
    BEGIN
        -- No value provided, let database use its default (e.g., NEWSEQUENTIALID())
        INSERT INTO [${flyway:defaultSchema}].[MemberProfile]
            (
                [PersonID],
                [OrganizationID],
                [MemberNumber],
                [Segment],
                [Region],
                [Country],
                [CountryName],
                [City],
                [State],
                [AddressLine1],
                [AddressLine2],
                [PostalCode],
                [Latitude],
                [Longitude],
                [JoinDate],
                [RaceEthnicity],
                [EthnicityHispanic],
                [PronounSet],
                [PrimaryLanguage],
                [IsSharedDemo]
            )
        OUTPUT INSERTED.[ID] INTO @InsertedRow
        VALUES
            (
                @PersonID,
                CASE WHEN @OrganizationID_Clear = 1 THEN NULL ELSE ISNULL(@OrganizationID, NULL) END,
                @MemberNumber,
                @Segment,
                @Region,
                CASE WHEN @Country_Clear = 1 THEN NULL ELSE ISNULL(@Country, NULL) END,
                CASE WHEN @CountryName_Clear = 1 THEN NULL ELSE ISNULL(@CountryName, NULL) END,
                @City,
                @State,
                CASE WHEN @AddressLine1_Clear = 1 THEN NULL ELSE ISNULL(@AddressLine1, NULL) END,
                CASE WHEN @AddressLine2_Clear = 1 THEN NULL ELSE ISNULL(@AddressLine2, NULL) END,
                CASE WHEN @PostalCode_Clear = 1 THEN NULL ELSE ISNULL(@PostalCode, NULL) END,
                @Latitude,
                @Longitude,
                @JoinDate,
                CASE WHEN @RaceEthnicity_Clear = 1 THEN NULL ELSE ISNULL(@RaceEthnicity, NULL) END,
                CASE WHEN @EthnicityHispanic_Clear = 1 THEN NULL ELSE ISNULL(@EthnicityHispanic, NULL) END,
                CASE WHEN @PronounSet_Clear = 1 THEN NULL ELSE ISNULL(@PronounSet, NULL) END,
                CASE WHEN @PrimaryLanguage_Clear = 1 THEN NULL ELSE ISNULL(@PrimaryLanguage, NULL) END,
                ISNULL(@IsSharedDemo, 1)
            )
    END
    -- return the new record from the base view, which might have some calculated fields
    SELECT * FROM [${flyway:defaultSchema}].[vwMemberProfiles] WHERE [ID] = (SELECT [ID] FROM @InsertedRow)
END
GO
GRANT EXECUTE ON [${flyway:defaultSchema}].[spCreateMemberProfile] TO [cdp_Developer], [cdp_Integration];

/* spCreate Permissions for MoreCheese: Member Profiles */

GRANT EXECUTE ON [${flyway:defaultSchema}].[spCreateMemberProfile] TO [cdp_Developer], [cdp_Integration];

/* spUpdate SQL for MoreCheese: Member Profiles */
-----------------------------------------------------------------
-- SQL Code Generation
-- Entity: MoreCheese: Member Profiles
-- Item: spUpdateMemberProfile
--
-- This was generated by the MemberJunction CodeGen tool.
-- This file should NOT be edited by hand.
-----------------------------------------------------------------

------------------------------------------------------------
----- UPDATE PROCEDURE FOR MemberProfile
------------------------------------------------------------
IF OBJECT_ID('[${flyway:defaultSchema}].[spUpdateMemberProfile]', 'P') IS NOT NULL
    DROP PROCEDURE [${flyway:defaultSchema}].[spUpdateMemberProfile];
GO

CREATE PROCEDURE [${flyway:defaultSchema}].[spUpdateMemberProfile]
    @ID uniqueidentifier,
    @PersonID uniqueidentifier = NULL,
    @OrganizationID_Clear bit = 0,
    @OrganizationID uniqueidentifier = NULL,
    @MemberNumber nvarchar(50) = NULL,
    @Segment nvarchar(50) = NULL,
    @Region nvarchar(50) = NULL,
    @Country_Clear bit = 0,
    @Country nvarchar(2) = NULL,
    @CountryName_Clear bit = 0,
    @CountryName nvarchar(100) = NULL,
    @City nvarchar(100) = NULL,
    @State nvarchar(50) = NULL,
    @AddressLine1_Clear bit = 0,
    @AddressLine1 nvarchar(200) = NULL,
    @AddressLine2_Clear bit = 0,
    @AddressLine2 nvarchar(200) = NULL,
    @PostalCode_Clear bit = 0,
    @PostalCode nvarchar(20) = NULL,
    @Latitude decimal(9, 6) = NULL,
    @Longitude decimal(9, 6) = NULL,
    @JoinDate date = NULL,
    @RaceEthnicity_Clear bit = 0,
    @RaceEthnicity nvarchar(200) = NULL,
    @EthnicityHispanic_Clear bit = 0,
    @EthnicityHispanic nvarchar(30) = NULL,
    @PronounSet_Clear bit = 0,
    @PronounSet nvarchar(50) = NULL,
    @PrimaryLanguage_Clear bit = 0,
    @PrimaryLanguage nvarchar(50) = NULL,
    @IsSharedDemo bit = NULL
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE
        [${flyway:defaultSchema}].[MemberProfile]
    SET
        [PersonID] = ISNULL(@PersonID, [PersonID]),
        [OrganizationID] = CASE WHEN @OrganizationID_Clear = 1 THEN NULL ELSE ISNULL(@OrganizationID, [OrganizationID]) END,
        [MemberNumber] = ISNULL(@MemberNumber, [MemberNumber]),
        [Segment] = ISNULL(@Segment, [Segment]),
        [Region] = ISNULL(@Region, [Region]),
        [Country] = CASE WHEN @Country_Clear = 1 THEN NULL ELSE ISNULL(@Country, [Country]) END,
        [CountryName] = CASE WHEN @CountryName_Clear = 1 THEN NULL ELSE ISNULL(@CountryName, [CountryName]) END,
        [City] = ISNULL(@City, [City]),
        [State] = ISNULL(@State, [State]),
        [AddressLine1] = CASE WHEN @AddressLine1_Clear = 1 THEN NULL ELSE ISNULL(@AddressLine1, [AddressLine1]) END,
        [AddressLine2] = CASE WHEN @AddressLine2_Clear = 1 THEN NULL ELSE ISNULL(@AddressLine2, [AddressLine2]) END,
        [PostalCode] = CASE WHEN @PostalCode_Clear = 1 THEN NULL ELSE ISNULL(@PostalCode, [PostalCode]) END,
        [Latitude] = ISNULL(@Latitude, [Latitude]),
        [Longitude] = ISNULL(@Longitude, [Longitude]),
        [JoinDate] = ISNULL(@JoinDate, [JoinDate]),
        [RaceEthnicity] = CASE WHEN @RaceEthnicity_Clear = 1 THEN NULL ELSE ISNULL(@RaceEthnicity, [RaceEthnicity]) END,
        [EthnicityHispanic] = CASE WHEN @EthnicityHispanic_Clear = 1 THEN NULL ELSE ISNULL(@EthnicityHispanic, [EthnicityHispanic]) END,
        [PronounSet] = CASE WHEN @PronounSet_Clear = 1 THEN NULL ELSE ISNULL(@PronounSet, [PronounSet]) END,
        [PrimaryLanguage] = CASE WHEN @PrimaryLanguage_Clear = 1 THEN NULL ELSE ISNULL(@PrimaryLanguage, [PrimaryLanguage]) END,
        [IsSharedDemo] = ISNULL(@IsSharedDemo, [IsSharedDemo])
    WHERE
        [ID] = @ID

    -- Check if the update was successful
    IF @@ROWCOUNT = 0
        -- Nothing was updated, return no rows, but column structure from base view intact, semantically correct this way.
        SELECT TOP 0 * FROM [${flyway:defaultSchema}].[vwMemberProfiles] WHERE 1=0
    ELSE
        -- Return the updated record so the caller can see the updated values and any calculated fields
        SELECT
                                        *
                                    FROM
                                        [${flyway:defaultSchema}].[vwMemberProfiles]
                                    WHERE
                                        [ID] = @ID
                                    
END
GO

GRANT EXECUTE ON [${flyway:defaultSchema}].[spUpdateMemberProfile] TO [cdp_Developer], [cdp_Integration]
GO

------------------------------------------------------------
----- TRIGGER FOR __mj_UpdatedAt field for the MemberProfile table
------------------------------------------------------------
IF OBJECT_ID('[${flyway:defaultSchema}].[trgUpdateMemberProfile]', 'TR') IS NOT NULL
    DROP TRIGGER [${flyway:defaultSchema}].[trgUpdateMemberProfile];
GO
CREATE TRIGGER [${flyway:defaultSchema}].trgUpdateMemberProfile
ON [${flyway:defaultSchema}].[MemberProfile]
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE
        [${flyway:defaultSchema}].[MemberProfile]
    SET
        __mj_UpdatedAt = GETUTCDATE()
    FROM
        [${flyway:defaultSchema}].[MemberProfile] AS _organicTable
    INNER JOIN
        INSERTED AS I ON
        _organicTable.[ID] = I.[ID];
END;
GO

/* spUpdate Permissions for MoreCheese: Member Profiles */

GRANT EXECUTE ON [${flyway:defaultSchema}].[spUpdateMemberProfile] TO [cdp_Developer], [cdp_Integration];

/* spDelete SQL for MoreCheese: Member Profiles */
-----------------------------------------------------------------
-- SQL Code Generation
-- Entity: MoreCheese: Member Profiles
-- Item: spDeleteMemberProfile
--
-- This was generated by the MemberJunction CodeGen tool.
-- This file should NOT be edited by hand.
-----------------------------------------------------------------

------------------------------------------------------------
----- DELETE PROCEDURE FOR MemberProfile
------------------------------------------------------------
IF OBJECT_ID('[${flyway:defaultSchema}].[spDeleteMemberProfile]', 'P') IS NOT NULL
    DROP PROCEDURE [${flyway:defaultSchema}].[spDeleteMemberProfile];
GO

CREATE PROCEDURE [${flyway:defaultSchema}].[spDeleteMemberProfile]
    @ID uniqueidentifier
AS
BEGIN
    SET NOCOUNT ON;

    DELETE FROM
        [${flyway:defaultSchema}].[MemberProfile]
    WHERE
        [ID] = @ID


    -- Check if the delete was successful
    IF @@ROWCOUNT = 0
        SELECT NULL AS [ID] -- Return NULL for all primary key fields to indicate no record was deleted
    ELSE
        SELECT @ID AS [ID] -- Return the primary key values to indicate we successfully deleted the record
END
GO
GRANT EXECUTE ON [${flyway:defaultSchema}].[spDeleteMemberProfile] TO [cdp_Developer], [cdp_Integration];

/* spDelete Permissions for MoreCheese: Member Profiles */

GRANT EXECUTE ON [${flyway:defaultSchema}].[spDeleteMemberProfile] TO [cdp_Developer], [cdp_Integration];

/* SQL text to delete unneeded entity fields (13 scoped entities) */
EXEC [${mjSchema}].[spDeleteUnneededEntityFields] @ExcludedSchemaNames='sys,staging,${mjSchema}', @EntityIDs='CD3EBECE-BFBE-485C-8FF4-8744A030FE07,63F9789F-C8CB-4573-91E6-DAF670C4D3B7,B8FBEFC1-9B31-4A45-A86B-71BA5D4FE3EC,141E023A-18C1-4C84-962C-2BD1ABF0627F,DCB0400A-EC0A-4551-BAEA-50B515C3C59C,2F328DE1-F9F5-402D-B085-AC41EBDE9F77,A39CF933-ACC1-4178-8BBA-8B2B02BB40F5,50B6FD43-6669-41A0-8DBA-FB23C3B8C753,A820FA5A-520E-4058-92D8-33C5AEC0FEC5,70C724C9-B518-4D81-81B0-BE7F4962B63A,6585D210-BD5A-44E2-BD90-0D425734DCF0,DD32D132-F9BB-4FFB-87C2-839FBC1A7B7F,0342BEB0-51CE-4284-B5CC-E0811D413335', @IncludedSchemaNames='${flyway:defaultSchema},morecheese_events,morecheese_learning';

/* SQL text to insert 25 new entity field(s) */
UPDATE [${mjSchema}].[EntityField]
         SET [Sequence] = [Sequence] + 100000
       WHERE [EntityID] = '6585D210-BD5A-44E2-BD90-0D425734DCF0'
         AND [Sequence] < 100000
         AND NOT EXISTS (
             SELECT 1 FROM [${mjSchema}].[EntityField]
              WHERE [EntityID] = '6585D210-BD5A-44E2-BD90-0D425734DCF0'
                AND [Sequence] >= 100000
         );

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = 'ac4037ff-56f3-4b79-8f52-59c68b0312f7' OR (EntityID = '6585D210-BD5A-44E2-BD90-0D425734DCF0' AND Name = 'Person')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            'ac4037ff-56f3-4b79-8f52-59c68b0312f7',
            '6585D210-BD5A-44E2-BD90-0D425734DCF0', -- Entity: MoreCheese: Membership Periods
            16,
            'Person',
            'Person',
            NULL,
            'nvarchar',
            402,
            0,
            0,
            0,
            NULL,
            0,
            0,
            1,
            0,
            NULL,
            NULL,
            0,
            0,
            0,
            0,
            0,
            0,
            'Search',
            GETUTCDATE(),
            GETUTCDATE()
         )
      END;
UPDATE [${mjSchema}].[EntityField]
         SET [Sequence] = [Sequence] + 100000
       WHERE [EntityID] = 'A820FA5A-520E-4058-92D8-33C5AEC0FEC5'
         AND [Sequence] < 100000
         AND NOT EXISTS (
             SELECT 1 FROM [${mjSchema}].[EntityField]
              WHERE [EntityID] = 'A820FA5A-520E-4058-92D8-33C5AEC0FEC5'
                AND [Sequence] >= 100000
         );

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '6c4ecd27-85a8-477d-9002-a93a3bbebded' OR (EntityID = 'A820FA5A-520E-4058-92D8-33C5AEC0FEC5' AND Name = 'Organization')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            '6c4ecd27-85a8-477d-9002-a93a3bbebded',
            'A820FA5A-520E-4058-92D8-33C5AEC0FEC5', -- Entity: MoreCheese: Organization Profiles
            19,
            'Organization',
            'Organization',
            NULL,
            'nvarchar',
            510,
            0,
            0,
            0,
            NULL,
            0,
            0,
            1,
            0,
            NULL,
            NULL,
            0,
            0,
            0,
            0,
            0,
            0,
            'Search',
            GETUTCDATE(),
            GETUTCDATE()
         )
      END;
UPDATE [${mjSchema}].[EntityField]
         SET [Sequence] = [Sequence] + 100000
       WHERE [EntityID] = 'DCB0400A-EC0A-4551-BAEA-50B515C3C59C'
         AND [Sequence] < 100000
         AND NOT EXISTS (
             SELECT 1 FROM [${mjSchema}].[EntityField]
              WHERE [EntityID] = 'DCB0400A-EC0A-4551-BAEA-50B515C3C59C'
                AND [Sequence] >= 100000
         );

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '127ccbbf-1d55-45da-9649-e651f67eabab' OR (EntityID = 'DCB0400A-EC0A-4551-BAEA-50B515C3C59C' AND Name = 'Person')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            '127ccbbf-1d55-45da-9649-e651f67eabab',
            'DCB0400A-EC0A-4551-BAEA-50B515C3C59C', -- Entity: MoreCheese: Member Certifications
            12,
            'Person',
            'Person',
            NULL,
            'nvarchar',
            402,
            0,
            0,
            0,
            NULL,
            0,
            0,
            1,
            0,
            NULL,
            NULL,
            0,
            0,
            0,
            0,
            0,
            0,
            'Search',
            GETUTCDATE(),
            GETUTCDATE()
         )
      END;

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = 'ecccc8f5-2478-4ee2-9a8e-4ce2325e4fbf' OR (EntityID = 'DCB0400A-EC0A-4551-BAEA-50B515C3C59C' AND Name = 'Certification')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            'ecccc8f5-2478-4ee2-9a8e-4ce2325e4fbf',
            'DCB0400A-EC0A-4551-BAEA-50B515C3C59C', -- Entity: MoreCheese: Member Certifications
            13,
            'Certification',
            'Certification',
            NULL,
            'nvarchar',
            400,
            0,
            0,
            0,
            NULL,
            0,
            0,
            1,
            0,
            NULL,
            NULL,
            0,
            0,
            0,
            0,
            0,
            0,
            'Search',
            GETUTCDATE(),
            GETUTCDATE()
         )
      END;
UPDATE [${mjSchema}].[EntityField]
         SET [Sequence] = [Sequence] + 100000
       WHERE [EntityID] = 'B8FBEFC1-9B31-4A45-A86B-71BA5D4FE3EC'
         AND [Sequence] < 100000
         AND NOT EXISTS (
             SELECT 1 FROM [${mjSchema}].[EntityField]
              WHERE [EntityID] = 'B8FBEFC1-9B31-4A45-A86B-71BA5D4FE3EC'
                AND [Sequence] >= 100000
         );

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '8a6bf9df-a28d-4390-a16f-62c8a4600c70' OR (EntityID = 'B8FBEFC1-9B31-4A45-A86B-71BA5D4FE3EC' AND Name = 'Person')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            '8a6bf9df-a28d-4390-a16f-62c8a4600c70',
            'B8FBEFC1-9B31-4A45-A86B-71BA5D4FE3EC', -- Entity: MoreCheese: Course Enrollments
            11,
            'Person',
            'Person',
            NULL,
            'nvarchar',
            402,
            0,
            0,
            0,
            NULL,
            0,
            0,
            1,
            0,
            NULL,
            NULL,
            0,
            0,
            0,
            0,
            0,
            0,
            'Search',
            GETUTCDATE(),
            GETUTCDATE()
         )
      END;

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = 'a9a1b633-a9e5-499f-8d4c-91dac42bc320' OR (EntityID = 'B8FBEFC1-9B31-4A45-A86B-71BA5D4FE3EC' AND Name = 'Course')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            'a9a1b633-a9e5-499f-8d4c-91dac42bc320',
            'B8FBEFC1-9B31-4A45-A86B-71BA5D4FE3EC', -- Entity: MoreCheese: Course Enrollments
            12,
            'Course',
            'Course',
            NULL,
            'nvarchar',
            400,
            0,
            0,
            0,
            NULL,
            0,
            0,
            1,
            0,
            NULL,
            NULL,
            0,
            0,
            0,
            0,
            0,
            0,
            'Search',
            GETUTCDATE(),
            GETUTCDATE()
         )
      END;
UPDATE [${mjSchema}].[EntityField]
         SET [Sequence] = [Sequence] + 100000
       WHERE [EntityID] = 'CD3EBECE-BFBE-485C-8FF4-8744A030FE07'
         AND [Sequence] < 100000
         AND NOT EXISTS (
             SELECT 1 FROM [${mjSchema}].[EntityField]
              WHERE [EntityID] = 'CD3EBECE-BFBE-485C-8FF4-8744A030FE07'
                AND [Sequence] >= 100000
         );

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = 'b381b029-5f8d-4f5e-9521-39c68018fbc8' OR (EntityID = 'CD3EBECE-BFBE-485C-8FF4-8744A030FE07' AND Name = 'Person')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            'b381b029-5f8d-4f5e-9521-39c68018fbc8',
            'CD3EBECE-BFBE-485C-8FF4-8744A030FE07', -- Entity: MoreCheese: Event Registrations
            10,
            'Person',
            'Person',
            NULL,
            'nvarchar',
            402,
            0,
            0,
            0,
            NULL,
            0,
            0,
            1,
            0,
            NULL,
            NULL,
            0,
            0,
            0,
            0,
            0,
            0,
            'Search',
            GETUTCDATE(),
            GETUTCDATE()
         )
      END;

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '99f5ce1a-d06d-485d-a03a-e64eed2a22e2' OR (EntityID = 'CD3EBECE-BFBE-485C-8FF4-8744A030FE07' AND Name = 'Event')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            '99f5ce1a-d06d-485d-a03a-e64eed2a22e2',
            'CD3EBECE-BFBE-485C-8FF4-8744A030FE07', -- Entity: MoreCheese: Event Registrations
            11,
            'Event',
            'Event',
            NULL,
            'nvarchar',
            400,
            0,
            0,
            0,
            NULL,
            0,
            0,
            1,
            0,
            NULL,
            NULL,
            0,
            0,
            0,
            0,
            0,
            0,
            'Search',
            GETUTCDATE(),
            GETUTCDATE()
         )
      END;
UPDATE [${mjSchema}].[EntityField]
         SET [Sequence] = [Sequence] + 100000
       WHERE [EntityID] = 'A39CF933-ACC1-4178-8BBA-8B2B02BB40F5'
         AND [Sequence] < 100000
         AND NOT EXISTS (
             SELECT 1 FROM [${mjSchema}].[EntityField]
              WHERE [EntityID] = 'A39CF933-ACC1-4178-8BBA-8B2B02BB40F5'
                AND [Sequence] >= 100000
         );

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '62bac804-38e0-46aa-8198-339498269250' OR (EntityID = 'A39CF933-ACC1-4178-8BBA-8B2B02BB40F5' AND Name = 'Person')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            '62bac804-38e0-46aa-8198-339498269250',
            'A39CF933-ACC1-4178-8BBA-8B2B02BB40F5', -- Entity: MoreCheese: Advocacy Actions
            10,
            'Person',
            'Person',
            NULL,
            'nvarchar',
            402,
            0,
            0,
            0,
            NULL,
            0,
            0,
            1,
            0,
            NULL,
            NULL,
            0,
            0,
            0,
            0,
            0,
            0,
            'Search',
            GETUTCDATE(),
            GETUTCDATE()
         )
      END;
UPDATE [${mjSchema}].[EntityField]
         SET [Sequence] = [Sequence] + 100000
       WHERE [EntityID] = '2F328DE1-F9F5-402D-B085-AC41EBDE9F77'
         AND [Sequence] < 100000
         AND NOT EXISTS (
             SELECT 1 FROM [${mjSchema}].[EntityField]
              WHERE [EntityID] = '2F328DE1-F9F5-402D-B085-AC41EBDE9F77'
                AND [Sequence] >= 100000
         );

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '66b0c595-9beb-42f9-aa29-1189b6e9f219' OR (EntityID = '2F328DE1-F9F5-402D-B085-AC41EBDE9F77' AND Name = 'Person')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            '66b0c595-9beb-42f9-aa29-1189b6e9f219',
            '2F328DE1-F9F5-402D-B085-AC41EBDE9F77', -- Entity: MoreCheese: Competition Entries
            12,
            'Person',
            'Person',
            NULL,
            'nvarchar',
            402,
            0,
            0,
            0,
            NULL,
            0,
            0,
            1,
            0,
            NULL,
            NULL,
            0,
            0,
            0,
            0,
            0,
            0,
            'Search',
            GETUTCDATE(),
            GETUTCDATE()
         )
      END;

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '18df5211-4a6f-4ca4-968a-8f8d4d5f18ea' OR (EntityID = '2F328DE1-F9F5-402D-B085-AC41EBDE9F77' AND Name = 'Organization')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            '18df5211-4a6f-4ca4-968a-8f8d4d5f18ea',
            '2F328DE1-F9F5-402D-B085-AC41EBDE9F77', -- Entity: MoreCheese: Competition Entries
            13,
            'Organization',
            'Organization',
            NULL,
            'nvarchar',
            510,
            0,
            0,
            1,
            NULL,
            0,
            0,
            1,
            0,
            NULL,
            NULL,
            0,
            0,
            0,
            0,
            0,
            0,
            'Search',
            GETUTCDATE(),
            GETUTCDATE()
         )
      END;
UPDATE [${mjSchema}].[EntityField]
         SET [Sequence] = [Sequence] + 100000
       WHERE [EntityID] = '70C724C9-B518-4D81-81B0-BE7F4962B63A'
         AND [Sequence] < 100000
         AND NOT EXISTS (
             SELECT 1 FROM [${mjSchema}].[EntityField]
              WHERE [EntityID] = '70C724C9-B518-4D81-81B0-BE7F4962B63A'
                AND [Sequence] >= 100000
         );

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '34795ba3-df48-4333-a5bc-73923c52c20f' OR (EntityID = '70C724C9-B518-4D81-81B0-BE7F4962B63A' AND Name = 'Person')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            '34795ba3-df48-4333-a5bc-73923c52c20f',
            '70C724C9-B518-4D81-81B0-BE7F4962B63A', -- Entity: MoreCheese: Member Profiles
            24,
            'Person',
            'Person',
            NULL,
            'nvarchar',
            402,
            0,
            0,
            0,
            NULL,
            0,
            0,
            1,
            0,
            NULL,
            NULL,
            0,
            0,
            0,
            0,
            0,
            0,
            'Search',
            GETUTCDATE(),
            GETUTCDATE()
         )
      END;

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '12a73ba6-836d-4eec-8db8-1a67c5e474d9' OR (EntityID = '70C724C9-B518-4D81-81B0-BE7F4962B63A' AND Name = 'Organization')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            '12a73ba6-836d-4eec-8db8-1a67c5e474d9',
            '70C724C9-B518-4D81-81B0-BE7F4962B63A', -- Entity: MoreCheese: Member Profiles
            25,
            'Organization',
            'Organization',
            NULL,
            'nvarchar',
            510,
            0,
            0,
            1,
            NULL,
            0,
            0,
            1,
            0,
            NULL,
            NULL,
            0,
            0,
            0,
            0,
            0,
            0,
            'Search',
            GETUTCDATE(),
            GETUTCDATE()
         )
      END;
UPDATE [${mjSchema}].[EntityField]
         SET [Sequence] = [Sequence] + 100000
       WHERE [EntityID] = '50B6FD43-6669-41A0-8DBA-FB23C3B8C753'
         AND [Sequence] < 100000
         AND NOT EXISTS (
             SELECT 1 FROM [${mjSchema}].[EntityField]
              WHERE [EntityID] = '50B6FD43-6669-41A0-8DBA-FB23C3B8C753'
                AND [Sequence] >= 100000
         );

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = 'ca9c1666-bdef-410c-b252-54ee4db4b978' OR (EntityID = '50B6FD43-6669-41A0-8DBA-FB23C3B8C753' AND Name = 'Person')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            'ca9c1666-bdef-410c-b252-54ee4db4b978',
            '50B6FD43-6669-41A0-8DBA-FB23C3B8C753', -- Entity: MoreCheese: Data Quality Labels
            13,
            'Person',
            'Person',
            NULL,
            'nvarchar',
            402,
            0,
            0,
            0,
            NULL,
            0,
            0,
            1,
            0,
            NULL,
            NULL,
            0,
            0,
            0,
            0,
            0,
            0,
            'Search',
            GETUTCDATE(),
            GETUTCDATE()
         )
      END;

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '424a1d31-33a4-473d-8a8f-3e11ea38e9d2' OR (EntityID = '50B6FD43-6669-41A0-8DBA-FB23C3B8C753' AND Name = 'RelatedPerson')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            '424a1d31-33a4-473d-8a8f-3e11ea38e9d2',
            '50B6FD43-6669-41A0-8DBA-FB23C3B8C753', -- Entity: MoreCheese: Data Quality Labels
            14,
            'RelatedPerson',
            'Related Person',
            NULL,
            'nvarchar',
            402,
            0,
            0,
            1,
            NULL,
            0,
            0,
            1,
            0,
            NULL,
            NULL,
            0,
            0,
            0,
            0,
            0,
            0,
            'Search',
            GETUTCDATE(),
            GETUTCDATE()
         )
      END;

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '279aebd5-4bbc-4a25-8397-089e5341d1f3' OR (EntityID = '50B6FD43-6669-41A0-8DBA-FB23C3B8C753' AND Name = 'RelatedOrganization')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            '279aebd5-4bbc-4a25-8397-089e5341d1f3',
            '50B6FD43-6669-41A0-8DBA-FB23C3B8C753', -- Entity: MoreCheese: Data Quality Labels
            15,
            'RelatedOrganization',
            'Related Organization',
            NULL,
            'nvarchar',
            510,
            0,
            0,
            1,
            NULL,
            0,
            0,
            1,
            0,
            NULL,
            NULL,
            0,
            0,
            0,
            0,
            0,
            0,
            'Search',
            GETUTCDATE(),
            GETUTCDATE()
         )
      END;

/* SQL text to update existing entity fields from schema (13 scoped entities) */
EXEC [${mjSchema}].[spUpdateExistingEntityFieldsFromSchema] @ExcludedSchemaNames='sys,staging,${mjSchema}', @EntityIDs='CD3EBECE-BFBE-485C-8FF4-8744A030FE07,63F9789F-C8CB-4573-91E6-DAF670C4D3B7,B8FBEFC1-9B31-4A45-A86B-71BA5D4FE3EC,141E023A-18C1-4C84-962C-2BD1ABF0627F,DCB0400A-EC0A-4551-BAEA-50B515C3C59C,2F328DE1-F9F5-402D-B085-AC41EBDE9F77,A39CF933-ACC1-4178-8BBA-8B2B02BB40F5,50B6FD43-6669-41A0-8DBA-FB23C3B8C753,A820FA5A-520E-4058-92D8-33C5AEC0FEC5,70C724C9-B518-4D81-81B0-BE7F4962B63A,6585D210-BD5A-44E2-BD90-0D425734DCF0,DD32D132-F9BB-4FFB-87C2-839FBC1A7B7F,0342BEB0-51CE-4284-B5CC-E0811D413335', @IncludedSchemaNames='${flyway:defaultSchema},morecheese_events,morecheese_learning';

/* SQL text to set default column width where needed */
EXEC [${mjSchema}].[spSetDefaultColumnWidthWhereNeeded] @ExcludedSchemaNames='sys,staging,${mjSchema}', @IncludedSchemaNames='${flyway:defaultSchema},morecheese_events,morecheese_learning';

/* Set field properties for entity */

               UPDATE [${mjSchema}].[EntityField]
               SET DefaultInView = 1
               WHERE ID = 'B759E74B-4CD0-44F2-AFCA-ED7C46016D8E'
               AND AutoUpdateDefaultInView = 1;

               UPDATE [${mjSchema}].[EntityField]
               SET DefaultInView = 1
               WHERE ID = '6E338BE3-9411-4819-AF92-C1B9C8AAD404'
               AND AutoUpdateDefaultInView = 1;

               UPDATE [${mjSchema}].[EntityField]
               SET IncludeInUserSearchAPI = 1
               WHERE ID = 'B759E74B-4CD0-44F2-AFCA-ED7C46016D8E'
               AND AutoUpdateIncludeInUserSearchAPI = 1;

               UPDATE [${mjSchema}].[EntityField]
               SET UserSearchPredicateAPI = 'BeginsWith'
               WHERE ID = '277EA8DB-E1FF-4C8C-AE97-EABD3E68364C'
               AND AutoUpdateUserSearchPredicate = 1;

               UPDATE [${mjSchema}].[EntityField]
               SET UserSearchPredicateAPI = 'Exact'
               WHERE ID = 'B759E74B-4CD0-44F2-AFCA-ED7C46016D8E'
               AND AutoUpdateUserSearchPredicate = 1;

/* Set field properties for entity */

               UPDATE [${mjSchema}].[EntityField]
               SET DefaultInView = 1
               WHERE ID = '2BF81441-C58F-4982-A6DB-3F64FD88864C'
               AND AutoUpdateDefaultInView = 1;

               UPDATE [${mjSchema}].[EntityField]
               SET DefaultInView = 1
               WHERE ID = 'A33A96EB-7BC7-4A47-8421-3CF7BBA65406'
               AND AutoUpdateDefaultInView = 1;

               UPDATE [${mjSchema}].[EntityField]
               SET DefaultInView = 1
               WHERE ID = '44D34E11-2CC9-415C-8549-E3D6BF484948'
               AND AutoUpdateDefaultInView = 1;

               UPDATE [${mjSchema}].[EntityField]
               SET IncludeInUserSearchAPI = 1
               WHERE ID = '2BF81441-C58F-4982-A6DB-3F64FD88864C'
               AND AutoUpdateIncludeInUserSearchAPI = 1;

               UPDATE [${mjSchema}].[EntityField]
               SET UserSearchPredicateAPI = 'BeginsWith'
               WHERE ID = 'AFD2F5BC-EE39-4E6D-AFEA-53AFBB64DC48'
               AND AutoUpdateUserSearchPredicate = 1;

               UPDATE [${mjSchema}].[EntityField]
               SET UserSearchPredicateAPI = 'Exact'
               WHERE ID = '2BF81441-C58F-4982-A6DB-3F64FD88864C'
               AND AutoUpdateUserSearchPredicate = 1;

/* Set field properties for entity */

               UPDATE [${mjSchema}].[EntityField]
               SET IsNameField = 1
               WHERE ID = '786C4021-88D8-4A9E-BE0B-BC4E0DEFB238'
               AND AutoUpdateIsNameField = 1;

               UPDATE [${mjSchema}].[EntityField]
               SET DefaultInView = 1
               WHERE ID = '622D3C4F-84D3-404D-8D25-F2FE41BB3A16'
               AND AutoUpdateDefaultInView = 1;

               UPDATE [${mjSchema}].[EntityField]
               SET DefaultInView = 1
               WHERE ID = '83FBF1A5-B4F5-432D-8C2A-2B8535EB48F2'
               AND AutoUpdateDefaultInView = 1;

               UPDATE [${mjSchema}].[EntityField]
               SET DefaultInView = 1
               WHERE ID = '786C4021-88D8-4A9E-BE0B-BC4E0DEFB238'
               AND AutoUpdateDefaultInView = 1;

               UPDATE [${mjSchema}].[EntityField]
               SET DefaultInView = 1
               WHERE ID = '07E777D4-1BF8-473A-AABF-E9A3DA6DB4F0'
               AND AutoUpdateDefaultInView = 1;

               UPDATE [${mjSchema}].[EntityField]
               SET DefaultInView = 1
               WHERE ID = '66B0C595-9BEB-42F9-AA29-1189B6E9F219'
               AND AutoUpdateDefaultInView = 1;

               UPDATE [${mjSchema}].[EntityField]
               SET DefaultInView = 1
               WHERE ID = '18DF5211-4A6F-4CA4-968A-8F8D4D5F18EA'
               AND AutoUpdateDefaultInView = 1;

               UPDATE [${mjSchema}].[EntityField]
               SET IncludeInUserSearchAPI = 1
               WHERE ID = '503079CE-BCD9-4078-A31B-C145A38EA971'
               AND AutoUpdateIncludeInUserSearchAPI = 1;

               UPDATE [${mjSchema}].[EntityField]
               SET IncludeInUserSearchAPI = 1
               WHERE ID = '786C4021-88D8-4A9E-BE0B-BC4E0DEFB238'
               AND AutoUpdateIncludeInUserSearchAPI = 1;

               UPDATE [${mjSchema}].[EntityField]
               SET UserSearchPredicateAPI = 'BeginsWith'
               WHERE ID = '786C4021-88D8-4A9E-BE0B-BC4E0DEFB238'
               AND AutoUpdateUserSearchPredicate = 1;

               UPDATE [${mjSchema}].[EntityField]
               SET UserSearchPredicateAPI = 'Exact'
               WHERE ID = '503079CE-BCD9-4078-A31B-C145A38EA971'
               AND AutoUpdateUserSearchPredicate = 1;

/* Set field properties for entity */

               UPDATE [${mjSchema}].[EntityField]
               SET IsNameField = 1
               WHERE ID = '2F2A4E1E-DC13-4602-AB6B-2149C909DD04'
               AND AutoUpdateIsNameField = 1;

               UPDATE [${mjSchema}].[EntityField]
               SET DefaultInView = 1
               WHERE ID = 'B2AA6175-2959-4630-A853-60BAAC40C4DF'
               AND AutoUpdateDefaultInView = 1;

               UPDATE [${mjSchema}].[EntityField]
               SET DefaultInView = 1
               WHERE ID = '2F2A4E1E-DC13-4602-AB6B-2149C909DD04'
               AND AutoUpdateDefaultInView = 1;

               UPDATE [${mjSchema}].[EntityField]
               SET DefaultInView = 1
               WHERE ID = '4AD7D467-2C4B-4FEF-AD5F-0BC2D964ABC1'
               AND AutoUpdateDefaultInView = 1;

               UPDATE [${mjSchema}].[EntityField]
               SET DefaultInView = 1
               WHERE ID = '62BAC804-38E0-46AA-8198-339498269250'
               AND AutoUpdateDefaultInView = 1;

               UPDATE [${mjSchema}].[EntityField]
               SET IncludeInUserSearchAPI = 1
               WHERE ID = '62BAC804-38E0-46AA-8198-339498269250'
               AND AutoUpdateIncludeInUserSearchAPI = 1;

               UPDATE [${mjSchema}].[EntityField]
               SET UserSearchPredicateAPI = 'BeginsWith'
               WHERE ID = '62BAC804-38E0-46AA-8198-339498269250'
               AND AutoUpdateUserSearchPredicate = 1;

/* Set field properties for entity */

               UPDATE [${mjSchema}].[EntityField]
               SET DefaultInView = 1
               WHERE ID = '71E0B928-23ED-45B0-A9BB-4D1AE8F82585'
               AND AutoUpdateDefaultInView = 1;

               UPDATE [${mjSchema}].[EntityField]
               SET DefaultInView = 1
               WHERE ID = '7E8D65A1-5858-497B-BCEF-6DF19AEE292C'
               AND AutoUpdateDefaultInView = 1;

               UPDATE [${mjSchema}].[EntityField]
               SET DefaultInView = 1
               WHERE ID = 'B2357810-4882-47ED-9798-3BAB2E3DDB7B'
               AND AutoUpdateDefaultInView = 1;

               UPDATE [${mjSchema}].[EntityField]
               SET DefaultInView = 1
               WHERE ID = '8A6BF9DF-A28D-4390-A16F-62C8A4600C70'
               AND AutoUpdateDefaultInView = 1;

               UPDATE [${mjSchema}].[EntityField]
               SET DefaultInView = 1
               WHERE ID = 'A9A1B633-A9E5-499F-8D4C-91DAC42BC320'
               AND AutoUpdateDefaultInView = 1;

               UPDATE [${mjSchema}].[EntityField]
               SET IncludeInUserSearchAPI = 1
               WHERE ID = '8A6BF9DF-A28D-4390-A16F-62C8A4600C70'
               AND AutoUpdateIncludeInUserSearchAPI = 1;

               UPDATE [${mjSchema}].[EntityField]
               SET IncludeInUserSearchAPI = 1
               WHERE ID = 'A9A1B633-A9E5-499F-8D4C-91DAC42BC320'
               AND AutoUpdateIncludeInUserSearchAPI = 1;

               UPDATE [${mjSchema}].[EntityField]
               SET UserSearchPredicateAPI = 'BeginsWith'
               WHERE ID = '8A6BF9DF-A28D-4390-A16F-62C8A4600C70'
               AND AutoUpdateUserSearchPredicate = 1;

               UPDATE [${mjSchema}].[EntityField]
               SET UserSearchPredicateAPI = 'BeginsWith'
               WHERE ID = 'A9A1B633-A9E5-499F-8D4C-91DAC42BC320'
               AND AutoUpdateUserSearchPredicate = 1;

/* Set categories for 8 fields */

-- UPDATE Entity Field Category Info MoreCheese: Certifications.ID 
UPDATE [${mjSchema}].[EntityField]
SET 
   Category = 'System Metadata',
   GeneratedFormSection = 'Category',
   ExtendedType = NULL,
   CodeType = NULL
WHERE 
   ID = 'F1E78DDB-6237-4B85-B0C8-0524C192D00F' AND AutoUpdateCategory = 1;

-- UPDATE Entity Field Category Info MoreCheese: Certifications.CertKey 
UPDATE [${mjSchema}].[EntityField]
SET 
   Category = 'Certification Details',
   GeneratedFormSection = 'Category',
   DisplayName = 'Certification Key',
   ExtendedType = NULL,
   CodeType = NULL
WHERE 
   ID = 'B759E74B-4CD0-44F2-AFCA-ED7C46016D8E' AND AutoUpdateCategory = 1;

-- UPDATE Entity Field Category Info MoreCheese: Certifications.Name 
UPDATE [${mjSchema}].[EntityField]
SET 
   Category = 'Certification Details',
   GeneratedFormSection = 'Category',
   ExtendedType = NULL,
   CodeType = NULL
WHERE 
   ID = '277EA8DB-E1FF-4C8C-AE97-EABD3E68364C' AND AutoUpdateCategory = 1;

-- UPDATE Entity Field Category Info MoreCheese: Certifications.Description 
UPDATE [${mjSchema}].[EntityField]
SET 
   Category = 'Certification Details',
   GeneratedFormSection = 'Category',
   ExtendedType = NULL,
   CodeType = NULL
WHERE 
   ID = 'B0E1D409-433B-4DAF-BFB3-3B67924AB0E7' AND AutoUpdateCategory = 1;

-- UPDATE Entity Field Category Info MoreCheese: Certifications.ValidYears 
UPDATE [${mjSchema}].[EntityField]
SET 
   Category = 'Certification Details',
   GeneratedFormSection = 'Category',
   DisplayName = 'Validity (Years)',
   ExtendedType = NULL,
   CodeType = NULL
WHERE 
   ID = '6E338BE3-9411-4819-AF92-C1B9C8AAD404' AND AutoUpdateCategory = 1;

-- UPDATE Entity Field Category Info MoreCheese: Certifications.IsSharedDemo 
UPDATE [${mjSchema}].[EntityField]
SET 
   Category = 'Configuration',
   GeneratedFormSection = 'Category',
   ExtendedType = NULL,
   CodeType = NULL
WHERE 
   ID = '42D182AC-ADA5-4514-9741-032849061125' AND AutoUpdateCategory = 1;

-- UPDATE Entity Field Category Info MoreCheese: Certifications.__mj_CreatedAt 
UPDATE [${mjSchema}].[EntityField]
SET 
   Category = 'System Metadata',
   GeneratedFormSection = 'Category',
   ExtendedType = NULL,
   CodeType = NULL
WHERE 
   ID = 'E2060987-492C-4ABE-A8F5-1F85B5D8BD6B' AND AutoUpdateCategory = 1;

-- UPDATE Entity Field Category Info MoreCheese: Certifications.__mj_UpdatedAt 
UPDATE [${mjSchema}].[EntityField]
SET 
   Category = 'System Metadata',
   GeneratedFormSection = 'Category',
   ExtendedType = NULL,
   CodeType = NULL
WHERE 
   ID = '99CBEE6E-F1E4-48F9-BC12-B6E72A7DB112' AND AutoUpdateCategory = 1;

/* Set categories for 8 fields */

-- UPDATE Entity Field Category Info MoreCheese: Courses.ID 
UPDATE [${mjSchema}].[EntityField]
SET 
   Category = 'System Metadata',
   GeneratedFormSection = 'Category',
   ExtendedType = NULL,
   CodeType = NULL
WHERE 
   ID = 'AD41C473-0983-4637-A761-157D35C0BD04' AND AutoUpdateCategory = 1;

-- UPDATE Entity Field Category Info MoreCheese: Courses.CourseKey 
UPDATE [${mjSchema}].[EntityField]
SET 
   Category = 'Course Details',
   GeneratedFormSection = 'Category',
   ExtendedType = NULL,
   CodeType = NULL
WHERE 
   ID = '2BF81441-C58F-4982-A6DB-3F64FD88864C' AND AutoUpdateCategory = 1;

-- UPDATE Entity Field Category Info MoreCheese: Courses.Name 
UPDATE [${mjSchema}].[EntityField]
SET 
   Category = 'Course Details',
   GeneratedFormSection = 'Category',
   DisplayName = 'Course Name',
   ExtendedType = NULL,
   CodeType = NULL
WHERE 
   ID = 'AFD2F5BC-EE39-4E6D-AFEA-53AFBB64DC48' AND AutoUpdateCategory = 1;

-- UPDATE Entity Field Category Info MoreCheese: Courses.StartDate 
UPDATE [${mjSchema}].[EntityField]
SET 
   Category = 'Course Schedule',
   GeneratedFormSection = 'Category',
   ExtendedType = NULL,
   CodeType = NULL
WHERE 
   ID = 'A33A96EB-7BC7-4A47-8421-3CF7BBA65406' AND AutoUpdateCategory = 1;

-- UPDATE Entity Field Category Info MoreCheese: Courses.DurationWeeks 
UPDATE [${mjSchema}].[EntityField]
SET 
   Category = 'Course Schedule',
   GeneratedFormSection = 'Category',
   DisplayName = 'Duration (Weeks)',
   ExtendedType = NULL,
   CodeType = NULL
WHERE 
   ID = '44D34E11-2CC9-415C-8549-E3D6BF484948' AND AutoUpdateCategory = 1;

-- UPDATE Entity Field Category Info MoreCheese: Courses.IsSharedDemo 
UPDATE [${mjSchema}].[EntityField]
SET 
   Category = 'Course Details',
   GeneratedFormSection = 'Category',
   ExtendedType = NULL,
   CodeType = NULL
WHERE 
   ID = 'EA98A1F7-8F5E-4183-A8C7-4265E53501D7' AND AutoUpdateCategory = 1;

-- UPDATE Entity Field Category Info MoreCheese: Courses.__mj_CreatedAt 
UPDATE [${mjSchema}].[EntityField]
SET 
   Category = 'System Metadata',
   GeneratedFormSection = 'Category',
   ExtendedType = NULL,
   CodeType = NULL
WHERE 
   ID = '8E410BA7-8C6D-4FDB-AE6C-055AA50E9E85' AND AutoUpdateCategory = 1;

-- UPDATE Entity Field Category Info MoreCheese: Courses.__mj_UpdatedAt 
UPDATE [${mjSchema}].[EntityField]
SET 
   Category = 'System Metadata',
   GeneratedFormSection = 'Category',
   ExtendedType = NULL,
   CodeType = NULL
WHERE 
   ID = '2B1694A9-FD8F-4D1C-A94C-2592859DFEB9' AND AutoUpdateCategory = 1;

/* Set entity icon to fa fa-certificate */

               UPDATE [${mjSchema}].[Entity]
               SET [Icon] = 'fa fa-certificate', [__mj_UpdatedAt] = GETUTCDATE()
               WHERE [ID] = '141E023A-18C1-4C84-962C-2BD1ABF0627F';

/* Set entity icon to fa fa-graduation-cap */

               UPDATE [${mjSchema}].[Entity]
               SET [Icon] = 'fa fa-graduation-cap', [__mj_UpdatedAt] = GETUTCDATE()
               WHERE [ID] = '63F9789F-C8CB-4573-91E6-DAF670C4D3B7';

/* Insert FieldCategoryInfo setting for entity */

               INSERT INTO [${mjSchema}].[EntitySetting] ([ID], [EntityID], [Name], [Value], [__mj_CreatedAt], [__mj_UpdatedAt])
               VALUES ('c0cb1895-63e9-4c19-ba60-9deae6f29e4d', '63F9789F-C8CB-4573-91E6-DAF670C4D3B7', 'FieldCategoryInfo', '{"Course Details":{"icon":"fa fa-book","description":"Core identification and classification information for the course"},"Course Schedule":{"icon":"fa fa-calendar-alt","description":"Timing and duration details for the learning cohort"},"System Metadata":{"icon":"fa fa-cog","description":"System-managed audit and tracking fields"}}', GETUTCDATE(), GETUTCDATE());

/* Insert FieldCategoryInfo setting for entity */

               INSERT INTO [${mjSchema}].[EntitySetting] ([ID], [EntityID], [Name], [Value], [__mj_CreatedAt], [__mj_UpdatedAt])
               VALUES ('96c5bf64-86f5-4918-a772-1e02dd2b6898', '141E023A-18C1-4C84-962C-2BD1ABF0627F', 'FieldCategoryInfo', '{"Certification Details":{"icon":"fa fa-info-circle","description":"Core information defining the certification program and its validity"},"Configuration":{"icon":"fa fa-sliders-h","description":"Settings and flags controlling how the certification behaves in the system"},"System Metadata":{"icon":"fa fa-cog","description":"System-managed audit and tracking fields"}}', GETUTCDATE(), GETUTCDATE());

/* Insert FieldCategoryIcons setting (legacy) */

               INSERT INTO [${mjSchema}].[EntitySetting] ([ID], [EntityID], [Name], [Value], [__mj_CreatedAt], [__mj_UpdatedAt])
               VALUES ('aa4fce93-815f-4078-98b3-a7d3fdf58420', '63F9789F-C8CB-4573-91E6-DAF670C4D3B7', 'FieldCategoryIcons', '{"Course Details":"fa fa-book","Course Schedule":"fa fa-calendar-alt","System Metadata":"fa fa-cog"}', GETUTCDATE(), GETUTCDATE());

/* Insert FieldCategoryIcons setting (legacy) */

               INSERT INTO [${mjSchema}].[EntitySetting] ([ID], [EntityID], [Name], [Value], [__mj_CreatedAt], [__mj_UpdatedAt])
               VALUES ('2d5dfbb3-b6ec-4723-b804-8b5423b26f0e', '141E023A-18C1-4C84-962C-2BD1ABF0627F', 'FieldCategoryIcons', '{"Certification Details":"fa fa-info-circle","Configuration":"fa fa-sliders-h","System Metadata":"fa fa-cog"}', GETUTCDATE(), GETUTCDATE());

/* Set DefaultForNewUser=true for NEW entity (category: primary, confidence: high) */

         UPDATE [${mjSchema}].[ApplicationEntity]
         SET [DefaultForNewUser] = 1, [__mj_UpdatedAt] = GETUTCDATE()
         WHERE [EntityID] = '63F9789F-C8CB-4573-91E6-DAF670C4D3B7';

/* Set DefaultForNewUser=false for NEW entity (category: reference, confidence: high) */

         UPDATE [${mjSchema}].[ApplicationEntity]
         SET [DefaultForNewUser] = 0, [__mj_UpdatedAt] = GETUTCDATE()
         WHERE [EntityID] = '141E023A-18C1-4C84-962C-2BD1ABF0627F';

/* Set categories for 10 fields */

-- UPDATE Entity Field Category Info MoreCheese: Advocacy Actions.ID 
UPDATE [${mjSchema}].[EntityField]
SET 
   Category = 'System Metadata',
   GeneratedFormSection = 'Category',
   ExtendedType = NULL,
   CodeType = NULL
WHERE 
   ID = '7DFE6F9E-7004-4589-8176-95753D3A5E04' AND AutoUpdateCategory = 1;

-- UPDATE Entity Field Category Info MoreCheese: Advocacy Actions.ActionKey 
UPDATE [${mjSchema}].[EntityField]
SET 
   Category = 'Action Details',
   GeneratedFormSection = 'Category',
   ExtendedType = NULL,
   CodeType = NULL
WHERE 
   ID = '3E335B74-0D8F-408D-91D4-0540690BB9B5' AND AutoUpdateCategory = 1;

-- UPDATE Entity Field Category Info MoreCheese: Advocacy Actions.PersonID 
UPDATE [${mjSchema}].[EntityField]
SET 
   Category = 'Action Details',
   GeneratedFormSection = 'Category',
   ExtendedType = NULL,
   CodeType = NULL
WHERE 
   ID = '5F22645F-1907-4046-88D7-C46C66B38AC7' AND AutoUpdateCategory = 1;

-- UPDATE Entity Field Category Info MoreCheese: Advocacy Actions.Person 
UPDATE [${mjSchema}].[EntityField]
SET 
   Category = 'Action Details',
   GeneratedFormSection = 'Category',
   ExtendedType = NULL,
   CodeType = NULL
WHERE 
   ID = '62BAC804-38E0-46AA-8198-339498269250' AND AutoUpdateCategory = 1;

-- UPDATE Entity Field Category Info MoreCheese: Advocacy Actions.ActionDate 
UPDATE [${mjSchema}].[EntityField]
SET 
   Category = 'Action Context',
   GeneratedFormSection = 'Category',
   ExtendedType = NULL,
   CodeType = NULL
WHERE 
   ID = 'B2AA6175-2959-4630-A853-60BAAC40C4DF' AND AutoUpdateCategory = 1;

-- UPDATE Entity Field Category Info MoreCheese: Advocacy Actions.Kind 
UPDATE [${mjSchema}].[EntityField]
SET 
   Category = 'Action Context',
   GeneratedFormSection = 'Category',
   DisplayName = 'Action Kind',
   ExtendedType = NULL,
   CodeType = NULL
WHERE 
   ID = '2F2A4E1E-DC13-4602-AB6B-2149C909DD04' AND AutoUpdateCategory = 1;

-- UPDATE Entity Field Category Info MoreCheese: Advocacy Actions.Topic 
UPDATE [${mjSchema}].[EntityField]
SET 
   Category = 'Action Context',
   GeneratedFormSection = 'Category',
   ExtendedType = NULL,
   CodeType = NULL
WHERE 
   ID = '4AD7D467-2C4B-4FEF-AD5F-0BC2D964ABC1' AND AutoUpdateCategory = 1;

-- UPDATE Entity Field Category Info MoreCheese: Advocacy Actions.IsSharedDemo 
UPDATE [${mjSchema}].[EntityField]
SET 
   Category = 'Action Context',
   GeneratedFormSection = 'Category',
   ExtendedType = NULL,
   CodeType = NULL
WHERE 
   ID = 'E57DF045-46F1-4372-8DBE-E8EB0D0894F6' AND AutoUpdateCategory = 1;

-- UPDATE Entity Field Category Info MoreCheese: Advocacy Actions.__mj_CreatedAt 
UPDATE [${mjSchema}].[EntityField]
SET 
   Category = 'System Metadata',
   GeneratedFormSection = 'Category',
   ExtendedType = NULL,
   CodeType = NULL
WHERE 
   ID = '85F51E14-8924-4682-A52C-6705D46B0733' AND AutoUpdateCategory = 1;

-- UPDATE Entity Field Category Info MoreCheese: Advocacy Actions.__mj_UpdatedAt 
UPDATE [${mjSchema}].[EntityField]
SET 
   Category = 'System Metadata',
   GeneratedFormSection = 'Category',
   ExtendedType = NULL,
   CodeType = NULL
WHERE 
   ID = '9F224773-7EF2-4FAA-9218-BB1BADCB6AA1' AND AutoUpdateCategory = 1;

/* Set entity icon to fa fa-bullhorn */

               UPDATE [${mjSchema}].[Entity]
               SET [Icon] = 'fa fa-bullhorn', [__mj_UpdatedAt] = GETUTCDATE()
               WHERE [ID] = 'A39CF933-ACC1-4178-8BBA-8B2B02BB40F5';

/* Insert FieldCategoryInfo setting for entity */

               INSERT INTO [${mjSchema}].[EntitySetting] ([ID], [EntityID], [Name], [Value], [__mj_CreatedAt], [__mj_UpdatedAt])
               VALUES ('9f5b048e-ff3b-47f2-a7fa-bd392f91605d', 'A39CF933-ACC1-4178-8BBA-8B2B02BB40F5', 'FieldCategoryInfo', '{"Action Details":{"icon":"fa fa-id-card","description":"Core identifiers and participant information for the advocacy action"},"Action Context":{"icon":"fa fa-calendar-alt","description":"Contextual information including dates, types, and topics of the engagement"},"System Metadata":{"icon":"fa fa-cog","description":"System-managed audit and tracking fields"}}', GETUTCDATE(), GETUTCDATE());

/* Insert FieldCategoryIcons setting (legacy) */

               INSERT INTO [${mjSchema}].[EntitySetting] ([ID], [EntityID], [Name], [Value], [__mj_CreatedAt], [__mj_UpdatedAt])
               VALUES ('4e397278-8087-417f-9ad8-3458ced42c16', 'A39CF933-ACC1-4178-8BBA-8B2B02BB40F5', 'FieldCategoryIcons', '{"Action Details":"fa fa-id-card","Action Context":"fa fa-calendar-alt","System Metadata":"fa fa-cog"}', GETUTCDATE(), GETUTCDATE());

/* Set DefaultForNewUser=true for NEW entity (category: primary, confidence: high) */

         UPDATE [${mjSchema}].[ApplicationEntity]
         SET [DefaultForNewUser] = 1, [__mj_UpdatedAt] = GETUTCDATE()
         WHERE [EntityID] = 'A39CF933-ACC1-4178-8BBA-8B2B02BB40F5';

/* Set categories for 13 fields */

-- UPDATE Entity Field Category Info MoreCheese: Competition Entries.ID 
UPDATE [${mjSchema}].[EntityField]
SET 
   Category = 'System Metadata',
   GeneratedFormSection = 'Category',
   ExtendedType = NULL,
   CodeType = NULL
WHERE 
   ID = '5B05EEA4-ED02-4F52-A299-24656278FC28' AND AutoUpdateCategory = 1;

-- UPDATE Entity Field Category Info MoreCheese: Competition Entries.EntryKey 
UPDATE [${mjSchema}].[EntityField]
SET 
   Category = 'Competition Details',
   GeneratedFormSection = 'Category',
   ExtendedType = NULL,
   CodeType = NULL
WHERE 
   ID = '503079CE-BCD9-4078-A31B-C145A38EA971' AND AutoUpdateCategory = 1;

-- UPDATE Entity Field Category Info MoreCheese: Competition Entries.EntryYear 
UPDATE [${mjSchema}].[EntityField]
SET 
   Category = 'Competition Details',
   GeneratedFormSection = 'Category',
   ExtendedType = NULL,
   CodeType = NULL
WHERE 
   ID = '622D3C4F-84D3-404D-8D25-F2FE41BB3A16' AND AutoUpdateCategory = 1;

-- UPDATE Entity Field Category Info MoreCheese: Competition Entries.Category 
UPDATE [${mjSchema}].[EntityField]
SET 
   Category = 'Competition Details',
   GeneratedFormSection = 'Category',
   ExtendedType = NULL,
   CodeType = NULL
WHERE 
   ID = '83FBF1A5-B4F5-432D-8C2A-2B8535EB48F2' AND AutoUpdateCategory = 1;

-- UPDATE Entity Field Category Info MoreCheese: Competition Entries.ProductName 
UPDATE [${mjSchema}].[EntityField]
SET 
   Category = 'Competition Details',
   GeneratedFormSection = 'Category',
   ExtendedType = NULL,
   CodeType = NULL
WHERE 
   ID = '786C4021-88D8-4A9E-BE0B-BC4E0DEFB238' AND AutoUpdateCategory = 1;

-- UPDATE Entity Field Category Info MoreCheese: Competition Entries.Result 
UPDATE [${mjSchema}].[EntityField]
SET 
   Category = 'Competition Details',
   GeneratedFormSection = 'Category',
   ExtendedType = NULL,
   CodeType = NULL
WHERE 
   ID = '07E777D4-1BF8-473A-AABF-E9A3DA6DB4F0' AND AutoUpdateCategory = 1;

-- UPDATE Entity Field Category Info MoreCheese: Competition Entries.PersonID 
UPDATE [${mjSchema}].[EntityField]
SET 
   Category = 'Entrant Information',
   GeneratedFormSection = 'Category',
   ExtendedType = NULL,
   CodeType = NULL
WHERE 
   ID = '7C41F425-787F-4150-BD51-22F030BAAB5D' AND AutoUpdateCategory = 1;

-- UPDATE Entity Field Category Info MoreCheese: Competition Entries.Person 
UPDATE [${mjSchema}].[EntityField]
SET 
   Category = 'Entrant Information',
   GeneratedFormSection = 'Category',
   ExtendedType = NULL,
   CodeType = NULL
WHERE 
   ID = '66B0C595-9BEB-42F9-AA29-1189B6E9F219' AND AutoUpdateCategory = 1;

-- UPDATE Entity Field Category Info MoreCheese: Competition Entries.OrganizationID 
UPDATE [${mjSchema}].[EntityField]
SET 
   Category = 'Entrant Information',
   GeneratedFormSection = 'Category',
   ExtendedType = NULL,
   CodeType = NULL
WHERE 
   ID = '8C85FAF9-4548-4418-B3FD-774EFBAA970C' AND AutoUpdateCategory = 1;

-- UPDATE Entity Field Category Info MoreCheese: Competition Entries.Organization 
UPDATE [${mjSchema}].[EntityField]
SET 
   Category = 'Entrant Information',
   GeneratedFormSection = 'Category',
   ExtendedType = NULL,
   CodeType = NULL
WHERE 
   ID = '18DF5211-4A6F-4CA4-968A-8F8D4D5F18EA' AND AutoUpdateCategory = 1;

-- UPDATE Entity Field Category Info MoreCheese: Competition Entries.IsSharedDemo 
UPDATE [${mjSchema}].[EntityField]
SET 
   Category = 'Entry Configuration',
   GeneratedFormSection = 'Category',
   ExtendedType = NULL,
   CodeType = NULL
WHERE 
   ID = '8474B7E9-1143-4608-8327-815679F0A341' AND AutoUpdateCategory = 1;

-- UPDATE Entity Field Category Info MoreCheese: Competition Entries.__mj_CreatedAt 
UPDATE [${mjSchema}].[EntityField]
SET 
   Category = 'System Metadata',
   GeneratedFormSection = 'Category',
   ExtendedType = NULL,
   CodeType = NULL
WHERE 
   ID = '4E9A09BA-6971-4DFB-AF9C-D8915EED709E' AND AutoUpdateCategory = 1;

-- UPDATE Entity Field Category Info MoreCheese: Competition Entries.__mj_UpdatedAt 
UPDATE [${mjSchema}].[EntityField]
SET 
   Category = 'System Metadata',
   GeneratedFormSection = 'Category',
   ExtendedType = NULL,
   CodeType = NULL
WHERE 
   ID = 'F32A33CC-F1AC-48CF-AC0A-15AD0A740B8A' AND AutoUpdateCategory = 1;

/* Set entity icon to fa fa-trophy */

               UPDATE [${mjSchema}].[Entity]
               SET [Icon] = 'fa fa-trophy', [__mj_UpdatedAt] = GETUTCDATE()
               WHERE [ID] = '2F328DE1-F9F5-402D-B085-AC41EBDE9F77';

/* Insert FieldCategoryInfo setting for entity */

               INSERT INTO [${mjSchema}].[EntitySetting] ([ID], [EntityID], [Name], [Value], [__mj_CreatedAt], [__mj_UpdatedAt])
               VALUES ('6c759823-6fb0-4b3f-af4a-2d3dbe6f383f', '2F328DE1-F9F5-402D-B085-AC41EBDE9F77', 'FieldCategoryInfo', '{"Competition Details":{"icon":"fa fa-medal","description":"Core competition entry data including category, product, and results"},"Entrant Information":{"icon":"fa fa-user-friends","description":"Information about the participant and their associated organization"},"Entry Configuration":{"icon":"fa fa-sliders-h","description":"Settings and flags for entry management"},"System Metadata":{"icon":"fa fa-cog","description":"System-managed audit and tracking fields"}}', GETUTCDATE(), GETUTCDATE());

/* Insert FieldCategoryIcons setting (legacy) */

               INSERT INTO [${mjSchema}].[EntitySetting] ([ID], [EntityID], [Name], [Value], [__mj_CreatedAt], [__mj_UpdatedAt])
               VALUES ('6541b8f2-e7e0-4e01-b2ea-57aa91a474bc', '2F328DE1-F9F5-402D-B085-AC41EBDE9F77', 'FieldCategoryIcons', '{"Competition Details":"fa fa-medal","Entrant Information":"fa fa-user-friends","Entry Configuration":"fa fa-sliders-h","System Metadata":"fa fa-cog"}', GETUTCDATE(), GETUTCDATE());

/* Set DefaultForNewUser=true for NEW entity (category: primary, confidence: high) */

         UPDATE [${mjSchema}].[ApplicationEntity]
         SET [DefaultForNewUser] = 1, [__mj_UpdatedAt] = GETUTCDATE()
         WHERE [EntityID] = '2F328DE1-F9F5-402D-B085-AC41EBDE9F77';

/* Set categories for 12 fields */

-- UPDATE Entity Field Category Info MoreCheese: Course Enrollments.ID 
UPDATE [${mjSchema}].[EntityField]
SET 
   Category = 'System Metadata',
   GeneratedFormSection = 'Category',
   ExtendedType = NULL,
   CodeType = NULL
WHERE 
   ID = '5BDE77AE-0DA9-4028-A122-45210F152B48' AND AutoUpdateCategory = 1;

-- UPDATE Entity Field Category Info MoreCheese: Course Enrollments.EnrollKey 
UPDATE [${mjSchema}].[EntityField]
SET 
   Category = 'Enrollment Details',
   GeneratedFormSection = 'Category',
   DisplayName = 'Enrollment Key',
   ExtendedType = NULL,
   CodeType = NULL
WHERE 
   ID = 'BB1E2110-0902-48D9-AD91-0564055BA2C0' AND AutoUpdateCategory = 1;

-- UPDATE Entity Field Category Info MoreCheese: Course Enrollments.PersonID 
UPDATE [${mjSchema}].[EntityField]
SET 
   Category = 'Enrollment Details',
   GeneratedFormSection = 'Category',
   ExtendedType = NULL,
   CodeType = NULL
WHERE 
   ID = 'FB431899-DB6B-440E-A794-C89EE53CCD62' AND AutoUpdateCategory = 1;

-- UPDATE Entity Field Category Info MoreCheese: Course Enrollments.CourseID 
UPDATE [${mjSchema}].[EntityField]
SET 
   Category = 'Enrollment Details',
   GeneratedFormSection = 'Category',
   ExtendedType = NULL,
   CodeType = NULL
WHERE 
   ID = '4A79B308-30C6-4958-A4E3-A8EA533718E1' AND AutoUpdateCategory = 1;

-- UPDATE Entity Field Category Info MoreCheese: Course Enrollments.Person 
UPDATE [${mjSchema}].[EntityField]
SET 
   Category = 'Enrollment Details',
   GeneratedFormSection = 'Category',
   ExtendedType = NULL,
   CodeType = NULL
WHERE 
   ID = '8A6BF9DF-A28D-4390-A16F-62C8A4600C70' AND AutoUpdateCategory = 1;

-- UPDATE Entity Field Category Info MoreCheese: Course Enrollments.Course 
UPDATE [${mjSchema}].[EntityField]
SET 
   Category = 'Enrollment Details',
   GeneratedFormSection = 'Category',
   ExtendedType = NULL,
   CodeType = NULL
WHERE 
   ID = 'A9A1B633-A9E5-499F-8D4C-91DAC42BC320' AND AutoUpdateCategory = 1;

-- UPDATE Entity Field Category Info MoreCheese: Course Enrollments.EnrolledOn 
UPDATE [${mjSchema}].[EntityField]
SET 
   Category = 'Progress and Status',
   GeneratedFormSection = 'Category',
   ExtendedType = NULL,
   CodeType = NULL
WHERE 
   ID = '71E0B928-23ED-45B0-A9BB-4D1AE8F82585' AND AutoUpdateCategory = 1;

-- UPDATE Entity Field Category Info MoreCheese: Course Enrollments.Status 
UPDATE [${mjSchema}].[EntityField]
SET 
   Category = 'Progress and Status',
   GeneratedFormSection = 'Category',
   ExtendedType = NULL,
   CodeType = NULL
WHERE 
   ID = '7E8D65A1-5858-497B-BCEF-6DF19AEE292C' AND AutoUpdateCategory = 1;

-- UPDATE Entity Field Category Info MoreCheese: Course Enrollments.CompletedOn 
UPDATE [${mjSchema}].[EntityField]
SET 
   Category = 'Progress and Status',
   GeneratedFormSection = 'Category',
   ExtendedType = NULL,
   CodeType = NULL
WHERE 
   ID = 'B2357810-4882-47ED-9798-3BAB2E3DDB7B' AND AutoUpdateCategory = 1;

-- UPDATE Entity Field Category Info MoreCheese: Course Enrollments.IsSharedDemo 
UPDATE [${mjSchema}].[EntityField]
SET 
   Category = 'System Metadata',
   GeneratedFormSection = 'Category',
   ExtendedType = NULL,
   CodeType = NULL
WHERE 
   ID = 'D425AA8B-C288-4804-8838-3AAE871D6989' AND AutoUpdateCategory = 1;

-- UPDATE Entity Field Category Info MoreCheese: Course Enrollments.__mj_CreatedAt 
UPDATE [${mjSchema}].[EntityField]
SET 
   Category = 'System Metadata',
   GeneratedFormSection = 'Category',
   ExtendedType = NULL,
   CodeType = NULL
WHERE 
   ID = 'B63A0504-DCCA-415B-964D-31906350A2CF' AND AutoUpdateCategory = 1;

-- UPDATE Entity Field Category Info MoreCheese: Course Enrollments.__mj_UpdatedAt 
UPDATE [${mjSchema}].[EntityField]
SET 
   Category = 'System Metadata',
   GeneratedFormSection = 'Category',
   ExtendedType = NULL,
   CodeType = NULL
WHERE 
   ID = 'A3EE444D-9B33-4C42-8F74-7F16DB36BF3C' AND AutoUpdateCategory = 1;

/* Set entity icon to fa fa-graduation-cap */

               UPDATE [${mjSchema}].[Entity]
               SET [Icon] = 'fa fa-graduation-cap', [__mj_UpdatedAt] = GETUTCDATE()
               WHERE [ID] = 'B8FBEFC1-9B31-4A45-A86B-71BA5D4FE3EC';

/* Insert FieldCategoryInfo setting for entity */

               INSERT INTO [${mjSchema}].[EntitySetting] ([ID], [EntityID], [Name], [Value], [__mj_CreatedAt], [__mj_UpdatedAt])
               VALUES ('b4128060-c91a-4806-aa4a-991e71b85479', 'B8FBEFC1-9B31-4A45-A86B-71BA5D4FE3EC', 'FieldCategoryInfo', '{"Enrollment Details":{"icon":"fa fa-id-card","description":"Core information identifying the student and the course"},"Progress and Status":{"icon":"fa fa-chart-line","description":"Timeline and status tracking for course completion"},"System Metadata":{"icon":"fa fa-cog","description":"System-managed audit and maintenance fields"}}', GETUTCDATE(), GETUTCDATE());

/* Insert FieldCategoryIcons setting (legacy) */

               INSERT INTO [${mjSchema}].[EntitySetting] ([ID], [EntityID], [Name], [Value], [__mj_CreatedAt], [__mj_UpdatedAt])
               VALUES ('4d273381-028d-4933-91ca-612fc8d381c2', 'B8FBEFC1-9B31-4A45-A86B-71BA5D4FE3EC', 'FieldCategoryIcons', '{"Enrollment Details":"fa fa-id-card","Progress and Status":"fa fa-chart-line","System Metadata":"fa fa-cog"}', GETUTCDATE(), GETUTCDATE());

/* Set DefaultForNewUser=true for NEW entity (category: primary, confidence: high) */

         UPDATE [${mjSchema}].[ApplicationEntity]
         SET [DefaultForNewUser] = 1, [__mj_UpdatedAt] = GETUTCDATE()
         WHERE [EntityID] = 'B8FBEFC1-9B31-4A45-A86B-71BA5D4FE3EC';

/* Set field properties for entity */

               UPDATE [${mjSchema}].[EntityField]
               SET DefaultInView = 1
               WHERE ID = 'F1566A08-AAC3-4BCF-9485-C52581550E2C'
               AND AutoUpdateDefaultInView = 1;

               UPDATE [${mjSchema}].[EntityField]
               SET DefaultInView = 1
               WHERE ID = 'CA4F7476-C656-4B9C-905B-9D9FBE37FAD1'
               AND AutoUpdateDefaultInView = 1;

               UPDATE [${mjSchema}].[EntityField]
               SET DefaultInView = 1
               WHERE ID = 'ACC21F63-98E7-434C-9757-9CB8E30E5EDB'
               AND AutoUpdateDefaultInView = 1;

               UPDATE [${mjSchema}].[EntityField]
               SET DefaultInView = 1
               WHERE ID = '127CCBBF-1D55-45DA-9649-E651F67EABAB'
               AND AutoUpdateDefaultInView = 1;

               UPDATE [${mjSchema}].[EntityField]
               SET DefaultInView = 1
               WHERE ID = 'ECCCC8F5-2478-4EE2-9A8E-4CE2325E4FBF'
               AND AutoUpdateDefaultInView = 1;

               UPDATE [${mjSchema}].[EntityField]
               SET IncludeInUserSearchAPI = 1
               WHERE ID = '127CCBBF-1D55-45DA-9649-E651F67EABAB'
               AND AutoUpdateIncludeInUserSearchAPI = 1;

               UPDATE [${mjSchema}].[EntityField]
               SET IncludeInUserSearchAPI = 1
               WHERE ID = 'ECCCC8F5-2478-4EE2-9A8E-4CE2325E4FBF'
               AND AutoUpdateIncludeInUserSearchAPI = 1;

               UPDATE [${mjSchema}].[EntityField]
               SET UserSearchPredicateAPI = 'BeginsWith'
               WHERE ID = '127CCBBF-1D55-45DA-9649-E651F67EABAB'
               AND AutoUpdateUserSearchPredicate = 1;

               UPDATE [${mjSchema}].[EntityField]
               SET UserSearchPredicateAPI = 'BeginsWith'
               WHERE ID = 'ECCCC8F5-2478-4EE2-9A8E-4CE2325E4FBF'
               AND AutoUpdateUserSearchPredicate = 1;

/* Set field properties for entity */

               UPDATE [${mjSchema}].[EntityField]
               SET DefaultInView = 1
               WHERE ID = 'C056444F-8753-477E-A909-86AC160E8CDF'
               AND AutoUpdateDefaultInView = 1;

               UPDATE [${mjSchema}].[EntityField]
               SET DefaultInView = 1
               WHERE ID = 'CEAE0D08-1C23-4AB9-862B-7720FEF292E7'
               AND AutoUpdateDefaultInView = 1;

               UPDATE [${mjSchema}].[EntityField]
               SET DefaultInView = 1
               WHERE ID = '28126800-5A2F-4DE4-9907-9BD4CFE38F2E'
               AND AutoUpdateDefaultInView = 1;

               UPDATE [${mjSchema}].[EntityField]
               SET DefaultInView = 1
               WHERE ID = '7A9B530F-6263-4107-891E-CB7926307538'
               AND AutoUpdateDefaultInView = 1;

               UPDATE [${mjSchema}].[EntityField]
               SET DefaultInView = 1
               WHERE ID = '48E77991-959B-46B3-8565-84F9126FDB7C'
               AND AutoUpdateDefaultInView = 1;

               UPDATE [${mjSchema}].[EntityField]
               SET DefaultInView = 1
               WHERE ID = '34795BA3-DF48-4333-A5BC-73923C52C20F'
               AND AutoUpdateDefaultInView = 1;

               UPDATE [${mjSchema}].[EntityField]
               SET IncludeInUserSearchAPI = 1
               WHERE ID = 'C056444F-8753-477E-A909-86AC160E8CDF'
               AND AutoUpdateIncludeInUserSearchAPI = 1;

               UPDATE [${mjSchema}].[EntityField]
               SET IncludeInUserSearchAPI = 1
               WHERE ID = '34795BA3-DF48-4333-A5BC-73923C52C20F'
               AND AutoUpdateIncludeInUserSearchAPI = 1;

               UPDATE [${mjSchema}].[EntityField]
               SET UserSearchPredicateAPI = 'BeginsWith'
               WHERE ID = '34795BA3-DF48-4333-A5BC-73923C52C20F'
               AND AutoUpdateUserSearchPredicate = 1;

               UPDATE [${mjSchema}].[EntityField]
               SET UserSearchPredicateAPI = 'Exact'
               WHERE ID = 'C056444F-8753-477E-A909-86AC160E8CDF'
               AND AutoUpdateUserSearchPredicate = 1;

/* Set field properties for entity */

               UPDATE [${mjSchema}].[EntityField]
               SET DefaultInView = 1
               WHERE ID = 'AE2C88C6-67E7-4EE5-81E6-DDE067B9D0D8'
               AND AutoUpdateDefaultInView = 1;

               UPDATE [${mjSchema}].[EntityField]
               SET DefaultInView = 1
               WHERE ID = 'B005F583-2BC2-4A1D-965C-EE65148B9EAF'
               AND AutoUpdateDefaultInView = 1;

               UPDATE [${mjSchema}].[EntityField]
               SET DefaultInView = 1
               WHERE ID = '462476EF-C90A-413F-A488-13746B48F555'
               AND AutoUpdateDefaultInView = 1;

               UPDATE [${mjSchema}].[EntityField]
               SET DefaultInView = 1
               WHERE ID = 'AA946517-F296-4F62-A63C-A43788679C5C'
               AND AutoUpdateDefaultInView = 1;

               UPDATE [${mjSchema}].[EntityField]
               SET DefaultInView = 1
               WHERE ID = '58FCD644-1DF3-4D17-A3AD-B9A921FB3779'
               AND AutoUpdateDefaultInView = 1;

               UPDATE [${mjSchema}].[EntityField]
               SET IncludeInUserSearchAPI = 1
               WHERE ID = '85AB3131-9BC7-4B57-999F-4C19E47F39C6'
               AND AutoUpdateIncludeInUserSearchAPI = 1;

               UPDATE [${mjSchema}].[EntityField]
               SET UserSearchPredicateAPI = 'BeginsWith'
               WHERE ID = 'E0C4EA1A-5451-43E7-8F25-4EBE31723DDD'
               AND AutoUpdateUserSearchPredicate = 1;

               UPDATE [${mjSchema}].[EntityField]
               SET UserSearchPredicateAPI = 'Exact'
               WHERE ID = '85AB3131-9BC7-4B57-999F-4C19E47F39C6'
               AND AutoUpdateUserSearchPredicate = 1;

/* Set field properties for entity */

               UPDATE [${mjSchema}].[EntityField]
               SET IsNameField = 1
               WHERE ID = 'FE29EF1A-28A9-4D65-A9B5-A127A5C8E0AC'
               AND AutoUpdateIsNameField = 1;

               UPDATE [${mjSchema}].[EntityField]
               SET DefaultInView = 1
               WHERE ID = 'FE29EF1A-28A9-4D65-A9B5-A127A5C8E0AC'
               AND AutoUpdateDefaultInView = 1;

               UPDATE [${mjSchema}].[EntityField]
               SET DefaultInView = 1
               WHERE ID = '0CED10F1-5A98-471B-B823-93EA2222DDB7'
               AND AutoUpdateDefaultInView = 1;

               UPDATE [${mjSchema}].[EntityField]
               SET DefaultInView = 1
               WHERE ID = 'E5B885AA-1202-48D3-A24E-291E4864D19F'
               AND AutoUpdateDefaultInView = 1;

               UPDATE [${mjSchema}].[EntityField]
               SET DefaultInView = 1
               WHERE ID = 'CDB43A70-607E-4439-8531-45F5A5C773A5'
               AND AutoUpdateDefaultInView = 1;

               UPDATE [${mjSchema}].[EntityField]
               SET DefaultInView = 1
               WHERE ID = '82CCC845-2FEF-4023-B039-7506DE65B29E'
               AND AutoUpdateDefaultInView = 1;

               UPDATE [${mjSchema}].[EntityField]
               SET DefaultInView = 1
               WHERE ID = 'CA9C1666-BDEF-410C-B252-54EE4DB4B978'
               AND AutoUpdateDefaultInView = 1;

            UPDATE [${mjSchema}].[Entity]
            SET AllowUserSearchAPI = 0
            WHERE ID = '50B6FD43-6669-41A0-8DBA-FB23C3B8C753'
            AND AutoUpdateAllowUserSearchAPI = 1;

/* Set field properties for entity */

               UPDATE [${mjSchema}].[EntityField]
               SET DefaultInView = 1
               WHERE ID = '07F52F34-4C2D-4A8C-8832-F5F18C097207'
               AND AutoUpdateDefaultInView = 1;

               UPDATE [${mjSchema}].[EntityField]
               SET DefaultInView = 1
               WHERE ID = 'E35BCB1B-3348-405E-9AD1-7266BC505A6B'
               AND AutoUpdateDefaultInView = 1;

               UPDATE [${mjSchema}].[EntityField]
               SET DefaultInView = 1
               WHERE ID = 'B381B029-5F8D-4F5E-9521-39C68018FBC8'
               AND AutoUpdateDefaultInView = 1;

               UPDATE [${mjSchema}].[EntityField]
               SET DefaultInView = 1
               WHERE ID = '99F5CE1A-D06D-485D-A03A-E64EED2A22E2'
               AND AutoUpdateDefaultInView = 1;

            UPDATE [${mjSchema}].[Entity]
            SET AllowUserSearchAPI = 0
            WHERE ID = 'CD3EBECE-BFBE-485C-8FF4-8744A030FE07'
            AND AutoUpdateAllowUserSearchAPI = 1;

/* Set categories for 13 fields */

-- UPDATE Entity Field Category Info MoreCheese: Member Certifications.ID 
UPDATE [${mjSchema}].[EntityField]
SET 
   Category = 'System Metadata',
   GeneratedFormSection = 'Category',
   ExtendedType = NULL,
   CodeType = NULL
WHERE 
   ID = '80B5AC0D-9184-4FEA-B9DB-5982798182E0' AND AutoUpdateCategory = 1;

-- UPDATE Entity Field Category Info MoreCheese: Member Certifications.MemberCertKey 
UPDATE [${mjSchema}].[EntityField]
SET 
   Category = 'Certification Details',
   GeneratedFormSection = 'Category',
   DisplayName = 'Member Certification Key',
   ExtendedType = NULL,
   CodeType = NULL
WHERE 
   ID = '82330E6D-DABC-4D69-8686-A1555B142162' AND AutoUpdateCategory = 1;

-- UPDATE Entity Field Category Info MoreCheese: Member Certifications.PersonID 
UPDATE [${mjSchema}].[EntityField]
SET 
   Category = 'Member Information',
   GeneratedFormSection = 'Category',
   ExtendedType = NULL,
   CodeType = NULL
WHERE 
   ID = '13F9C927-B51E-4FA6-A34D-8C86B6035678' AND AutoUpdateCategory = 1;

-- UPDATE Entity Field Category Info MoreCheese: Member Certifications.Person 
UPDATE [${mjSchema}].[EntityField]
SET 
   Category = 'Member Information',
   GeneratedFormSection = 'Category',
   ExtendedType = NULL,
   CodeType = NULL
WHERE 
   ID = '127CCBBF-1D55-45DA-9649-E651F67EABAB' AND AutoUpdateCategory = 1;

-- UPDATE Entity Field Category Info MoreCheese: Member Certifications.CertificationID 
UPDATE [${mjSchema}].[EntityField]
SET 
   Category = 'Certification Details',
   GeneratedFormSection = 'Category',
   ExtendedType = NULL,
   CodeType = NULL
WHERE 
   ID = '2EC02BCB-8F76-4E3A-917C-19717E80C66C' AND AutoUpdateCategory = 1;

-- UPDATE Entity Field Category Info MoreCheese: Member Certifications.Certification 
UPDATE [${mjSchema}].[EntityField]
SET 
   Category = 'Certification Details',
   GeneratedFormSection = 'Category',
   ExtendedType = NULL,
   CodeType = NULL
WHERE 
   ID = 'ECCCC8F5-2478-4EE2-9A8E-4CE2325E4FBF' AND AutoUpdateCategory = 1;

-- UPDATE Entity Field Category Info MoreCheese: Member Certifications.Status 
UPDATE [${mjSchema}].[EntityField]
SET 
   Category = 'Certification Status',
   GeneratedFormSection = 'Category',
   ExtendedType = NULL,
   CodeType = NULL
WHERE 
   ID = 'F1566A08-AAC3-4BCF-9485-C52581550E2C' AND AutoUpdateCategory = 1;

-- UPDATE Entity Field Category Info MoreCheese: Member Certifications.EnrolledOn 
UPDATE [${mjSchema}].[EntityField]
SET 
   Category = 'Certification Status',
   GeneratedFormSection = 'Category',
   ExtendedType = NULL,
   CodeType = NULL
WHERE 
   ID = '5A1428A4-D180-49B1-9BC3-30AB59D2369E' AND AutoUpdateCategory = 1;

-- UPDATE Entity Field Category Info MoreCheese: Member Certifications.AwardedOn 
UPDATE [${mjSchema}].[EntityField]
SET 
   Category = 'Certification Status',
   GeneratedFormSection = 'Category',
   ExtendedType = NULL,
   CodeType = NULL
WHERE 
   ID = 'CA4F7476-C656-4B9C-905B-9D9FBE37FAD1' AND AutoUpdateCategory = 1;

-- UPDATE Entity Field Category Info MoreCheese: Member Certifications.ExpiresOn 
UPDATE [${mjSchema}].[EntityField]
SET 
   Category = 'Certification Status',
   GeneratedFormSection = 'Category',
   ExtendedType = NULL,
   CodeType = NULL
WHERE 
   ID = 'ACC21F63-98E7-434C-9757-9CB8E30E5EDB' AND AutoUpdateCategory = 1;

-- UPDATE Entity Field Category Info MoreCheese: Member Certifications.IsSharedDemo 
UPDATE [${mjSchema}].[EntityField]
SET 
   Category = 'Certification Details',
   GeneratedFormSection = 'Category',
   ExtendedType = NULL,
   CodeType = NULL
WHERE 
   ID = 'C851B949-8858-41DC-9326-0612C6A973E3' AND AutoUpdateCategory = 1;

-- UPDATE Entity Field Category Info MoreCheese: Member Certifications.__mj_CreatedAt 
UPDATE [${mjSchema}].[EntityField]
SET 
   Category = 'System Metadata',
   GeneratedFormSection = 'Category',
   ExtendedType = NULL,
   CodeType = NULL
WHERE 
   ID = 'F7D1578A-AB50-499B-A194-4A2993670373' AND AutoUpdateCategory = 1;

-- UPDATE Entity Field Category Info MoreCheese: Member Certifications.__mj_UpdatedAt 
UPDATE [${mjSchema}].[EntityField]
SET 
   Category = 'System Metadata',
   GeneratedFormSection = 'Category',
   ExtendedType = NULL,
   CodeType = NULL
WHERE 
   ID = 'EC5ED4AB-D12F-4063-8DC1-90C254159578' AND AutoUpdateCategory = 1;

/* Set entity icon to fa fa-graduation-cap */

               UPDATE [${mjSchema}].[Entity]
               SET [Icon] = 'fa fa-graduation-cap', [__mj_UpdatedAt] = GETUTCDATE()
               WHERE [ID] = 'DCB0400A-EC0A-4551-BAEA-50B515C3C59C';

/* Insert FieldCategoryInfo setting for entity */

               INSERT INTO [${mjSchema}].[EntitySetting] ([ID], [EntityID], [Name], [Value], [__mj_CreatedAt], [__mj_UpdatedAt])
               VALUES ('1a604a49-7d9a-4c3b-9784-aa71e3f407c5', 'DCB0400A-EC0A-4551-BAEA-50B515C3C59C', 'FieldCategoryInfo', '{"Certification Details":{"icon":"fa fa-certificate","description":"Core certification identification and configuration details"},"Member Information":{"icon":"fa fa-user","description":"Information identifying the member associated with the certification"},"Certification Status":{"icon":"fa fa-flag","description":"Status, milestones, and timeline for the certification journey"},"System Metadata":{"icon":"fa fa-cog","description":"System-managed audit and tracking fields"}}', GETUTCDATE(), GETUTCDATE());

/* Insert FieldCategoryIcons setting (legacy) */

               INSERT INTO [${mjSchema}].[EntitySetting] ([ID], [EntityID], [Name], [Value], [__mj_CreatedAt], [__mj_UpdatedAt])
               VALUES ('1384880e-8044-45f6-84b5-63db7ef7dda4', 'DCB0400A-EC0A-4551-BAEA-50B515C3C59C', 'FieldCategoryIcons', '{"Certification Details":"fa fa-certificate","Member Information":"fa fa-user","Certification Status":"fa fa-flag","System Metadata":"fa fa-cog"}', GETUTCDATE(), GETUTCDATE());

/* Set DefaultForNewUser=true for NEW entity (category: supporting, confidence: high) */

         UPDATE [${mjSchema}].[ApplicationEntity]
         SET [DefaultForNewUser] = 1, [__mj_UpdatedAt] = GETUTCDATE()
         WHERE [EntityID] = 'DCB0400A-EC0A-4551-BAEA-50B515C3C59C';

/* Set categories for 14 fields */

-- UPDATE Entity Field Category Info MoreCheese: Events.ID 
UPDATE [${mjSchema}].[EntityField]
SET 
   Category = 'System Metadata',
   GeneratedFormSection = 'Category',
   ExtendedType = NULL,
   CodeType = NULL
WHERE 
   ID = '2398199D-CB05-49F5-92C0-98B2A52897AA' AND AutoUpdateCategory = 1;

-- UPDATE Entity Field Category Info MoreCheese: Events.EventKey 
UPDATE [${mjSchema}].[EntityField]
SET 
   Category = 'Event Information',
   GeneratedFormSection = 'Category',
   ExtendedType = NULL,
   CodeType = NULL
WHERE 
   ID = '85AB3131-9BC7-4B57-999F-4C19E47F39C6' AND AutoUpdateCategory = 1;

-- UPDATE Entity Field Category Info MoreCheese: Events.Name 
UPDATE [${mjSchema}].[EntityField]
SET 
   Category = 'Event Information',
   GeneratedFormSection = 'Category',
   ExtendedType = NULL,
   CodeType = NULL
WHERE 
   ID = 'E0C4EA1A-5451-43E7-8F25-4EBE31723DDD' AND AutoUpdateCategory = 1;

-- UPDATE Entity Field Category Info MoreCheese: Events.EventType 
UPDATE [${mjSchema}].[EntityField]
SET 
   Category = 'Event Information',
   GeneratedFormSection = 'Category',
   ExtendedType = NULL,
   CodeType = NULL
WHERE 
   ID = 'AE2C88C6-67E7-4EE5-81E6-DDE067B9D0D8' AND AutoUpdateCategory = 1;

-- UPDATE Entity Field Category Info MoreCheese: Events.EventDate 
UPDATE [${mjSchema}].[EntityField]
SET 
   Category = 'Event Information',
   GeneratedFormSection = 'Category',
   ExtendedType = NULL,
   CodeType = NULL
WHERE 
   ID = 'B005F583-2BC2-4A1D-965C-EE65148B9EAF' AND AutoUpdateCategory = 1;

-- UPDATE Entity Field Category Info MoreCheese: Events.IsVirtual 
UPDATE [${mjSchema}].[EntityField]
SET 
   Category = 'Event Configuration',
   GeneratedFormSection = 'Category',
   ExtendedType = NULL,
   CodeType = NULL
WHERE 
   ID = '462476EF-C90A-413F-A488-13746B48F555' AND AutoUpdateCategory = 1;

-- UPDATE Entity Field Category Info MoreCheese: Events.IsPaid 
UPDATE [${mjSchema}].[EntityField]
SET 
   Category = 'Event Configuration',
   GeneratedFormSection = 'Category',
   ExtendedType = NULL,
   CodeType = NULL
WHERE 
   ID = 'AEBDFA88-7193-4E71-A25A-F059B2C39C4F' AND AutoUpdateCategory = 1;

-- UPDATE Entity Field Category Info MoreCheese: Events.IsSharedDemo 
UPDATE [${mjSchema}].[EntityField]
SET 
   Category = 'Event Configuration',
   GeneratedFormSection = 'Category',
   ExtendedType = NULL,
   CodeType = NULL
WHERE 
   ID = '1468C8B4-30C6-4DE5-9806-46BC7E7858F8' AND AutoUpdateCategory = 1;

-- UPDATE Entity Field Category Info MoreCheese: Events.City 
UPDATE [${mjSchema}].[EntityField]
SET 
   Category = 'Venue Location',
   GeneratedFormSection = 'Category',
   ExtendedType = 'GeoCity',
   CodeType = NULL
WHERE 
   ID = 'AA946517-F296-4F62-A63C-A43788679C5C' AND AutoUpdateCategory = 1;

-- UPDATE Entity Field Category Info MoreCheese: Events.State 
UPDATE [${mjSchema}].[EntityField]
SET 
   Category = 'Venue Location',
   GeneratedFormSection = 'Category',
   ExtendedType = 'GeoStateProvince',
   CodeType = NULL
WHERE 
   ID = '58FCD644-1DF3-4D17-A3AD-B9A921FB3779' AND AutoUpdateCategory = 1;

-- UPDATE Entity Field Category Info MoreCheese: Events.Latitude 
UPDATE [${mjSchema}].[EntityField]
SET 
   Category = 'Venue Location',
   GeneratedFormSection = 'Category',
   ExtendedType = 'GeoLatitude',
   CodeType = NULL
WHERE 
   ID = '4B2440AC-4B39-4CAE-9D29-2426F95915EE' AND AutoUpdateCategory = 1;

-- UPDATE Entity Field Category Info MoreCheese: Events.Longitude 
UPDATE [${mjSchema}].[EntityField]
SET 
   Category = 'Venue Location',
   GeneratedFormSection = 'Category',
   ExtendedType = 'GeoLongitude',
   CodeType = NULL
WHERE 
   ID = 'B3424B97-D1BF-4287-8E55-CF33C187B862' AND AutoUpdateCategory = 1;

-- UPDATE Entity Field Category Info MoreCheese: Events.__mj_CreatedAt 
UPDATE [${mjSchema}].[EntityField]
SET 
   Category = 'System Metadata',
   GeneratedFormSection = 'Category',
   ExtendedType = NULL,
   CodeType = NULL
WHERE 
   ID = '09A7311A-0F30-4EB5-BFD1-6939817B283C' AND AutoUpdateCategory = 1;

-- UPDATE Entity Field Category Info MoreCheese: Events.__mj_UpdatedAt 
UPDATE [${mjSchema}].[EntityField]
SET 
   Category = 'System Metadata',
   GeneratedFormSection = 'Category',
   ExtendedType = NULL,
   CodeType = NULL
WHERE 
   ID = '6A8DEF47-8AA0-473F-8888-AED1560EC436' AND AutoUpdateCategory = 1;

/* Set SupportsGeoCoding = true for MoreCheese: Events */

            UPDATE [${mjSchema}].[Entity]
            SET [SupportsGeoCoding] = 1
            WHERE [ID] = 'DD32D132-F9BB-4FFB-87C2-839FBC1A7B7F' AND [AutoUpdateSupportsGeoCoding] = 1;

/* Set entity icon to fa fa-calendar-alt */

               UPDATE [${mjSchema}].[Entity]
               SET [Icon] = 'fa fa-calendar-alt', [__mj_UpdatedAt] = GETUTCDATE()
               WHERE [ID] = 'DD32D132-F9BB-4FFB-87C2-839FBC1A7B7F';

/* Insert FieldCategoryInfo setting for entity */

               INSERT INTO [${mjSchema}].[EntitySetting] ([ID], [EntityID], [Name], [Value], [__mj_CreatedAt], [__mj_UpdatedAt])
               VALUES ('b27f32ce-df5e-4204-b197-89bfb3affaa6', 'DD32D132-F9BB-4FFB-87C2-839FBC1A7B7F', 'FieldCategoryInfo', '{"Event Information":{"icon":"fa fa-info-circle","description":"Core event details including name, date, and classification"},"Event Configuration":{"icon":"fa fa-sliders-h","description":"Settings for event type, billing, and demo status"},"Venue Location":{"icon":"fa fa-map-marker-alt","description":"Physical location details for in-person events"},"System Metadata":{"icon":"fa fa-cog","description":"System-managed audit and tracking fields"}}', GETUTCDATE(), GETUTCDATE());

/* Insert FieldCategoryIcons setting (legacy) */

               INSERT INTO [${mjSchema}].[EntitySetting] ([ID], [EntityID], [Name], [Value], [__mj_CreatedAt], [__mj_UpdatedAt])
               VALUES ('ce156133-889b-4f70-9338-b8ad888ef36b', 'DD32D132-F9BB-4FFB-87C2-839FBC1A7B7F', 'FieldCategoryIcons', '{"Event Information":"fa fa-info-circle","Event Configuration":"fa fa-sliders-h","Venue Location":"fa fa-map-marker-alt","System Metadata":"fa fa-cog"}', GETUTCDATE(), GETUTCDATE());

/* Set DefaultForNewUser=true for NEW entity (category: primary, confidence: high) */

         UPDATE [${mjSchema}].[ApplicationEntity]
         SET [DefaultForNewUser] = 1, [__mj_UpdatedAt] = GETUTCDATE()
         WHERE [EntityID] = 'DD32D132-F9BB-4FFB-87C2-839FBC1A7B7F';

/* Set categories for 15 fields */

-- UPDATE Entity Field Category Info MoreCheese: Data Quality Labels.ID 
UPDATE [${mjSchema}].[EntityField]
SET 
   Category = 'System Metadata',
   GeneratedFormSection = 'Category',
   ExtendedType = NULL,
   CodeType = NULL
WHERE 
   ID = '9CCE2B30-A985-4FDC-B84F-0C2C10F6EB36' AND AutoUpdateCategory = 1;

-- UPDATE Entity Field Category Info MoreCheese: Data Quality Labels.LabelKey 
UPDATE [${mjSchema}].[EntityField]
SET 
   Category = 'Data Quality Label',
   GeneratedFormSection = 'Category',
   ExtendedType = NULL,
   CodeType = NULL
WHERE 
   ID = 'FE29EF1A-28A9-4D65-A9B5-A127A5C8E0AC' AND AutoUpdateCategory = 1;

-- UPDATE Entity Field Category Info MoreCheese: Data Quality Labels.DefectKind 
UPDATE [${mjSchema}].[EntityField]
SET 
   Category = 'Data Quality Label',
   GeneratedFormSection = 'Category',
   ExtendedType = NULL,
   CodeType = NULL
WHERE 
   ID = '0CED10F1-5A98-471B-B823-93EA2222DDB7' AND AutoUpdateCategory = 1;

-- UPDATE Entity Field Category Info MoreCheese: Data Quality Labels.PersonID 
UPDATE [${mjSchema}].[EntityField]
SET 
   Category = 'Record Context',
   GeneratedFormSection = 'Category',
   DisplayName = 'Person',
   ExtendedType = NULL,
   CodeType = NULL
WHERE 
   ID = 'B232382D-AD14-4662-A1E6-0C28E1B9993C' AND AutoUpdateCategory = 1;

-- UPDATE Entity Field Category Info MoreCheese: Data Quality Labels.RelatedPersonID 
UPDATE [${mjSchema}].[EntityField]
SET 
   Category = 'Record Context',
   GeneratedFormSection = 'Category',
   DisplayName = 'Related Person',
   ExtendedType = NULL,
   CodeType = NULL
WHERE 
   ID = '56103EC8-B51D-4A9F-A8C6-9C1CC75E0119' AND AutoUpdateCategory = 1;

-- UPDATE Entity Field Category Info MoreCheese: Data Quality Labels.RelatedOrganizationID 
UPDATE [${mjSchema}].[EntityField]
SET 
   Category = 'Record Context',
   GeneratedFormSection = 'Category',
   DisplayName = 'Related Organization',
   ExtendedType = NULL,
   CodeType = NULL
WHERE 
   ID = '951A6339-3685-49CF-A5FA-363C8FB68168' AND AutoUpdateCategory = 1;

-- UPDATE Entity Field Category Info MoreCheese: Data Quality Labels.DefectValue 
UPDATE [${mjSchema}].[EntityField]
SET 
   Category = 'Defect Details',
   GeneratedFormSection = 'Category',
   DisplayName = 'Defective Value',
   ExtendedType = NULL,
   CodeType = NULL
WHERE 
   ID = 'E5B885AA-1202-48D3-A24E-291E4864D19F' AND AutoUpdateCategory = 1;

-- UPDATE Entity Field Category Info MoreCheese: Data Quality Labels.TruthValue 
UPDATE [${mjSchema}].[EntityField]
SET 
   Category = 'Defect Details',
   GeneratedFormSection = 'Category',
   ExtendedType = NULL,
   CodeType = NULL
WHERE 
   ID = 'CDB43A70-607E-4439-8531-45F5A5C773A5' AND AutoUpdateCategory = 1;

-- UPDATE Entity Field Category Info MoreCheese: Data Quality Labels.Notes 
UPDATE [${mjSchema}].[EntityField]
SET 
   Category = 'Defect Details',
   GeneratedFormSection = 'Category',
   ExtendedType = NULL,
   CodeType = NULL
WHERE 
   ID = '4B7F95D0-890C-40F8-A928-9A0B0D727284' AND AutoUpdateCategory = 1;

-- UPDATE Entity Field Category Info MoreCheese: Data Quality Labels.IsSharedDemo 
UPDATE [${mjSchema}].[EntityField]
SET 
   Category = 'Data Quality Label',
   GeneratedFormSection = 'Category',
   ExtendedType = NULL,
   CodeType = NULL
WHERE 
   ID = '82CCC845-2FEF-4023-B039-7506DE65B29E' AND AutoUpdateCategory = 1;

-- UPDATE Entity Field Category Info MoreCheese: Data Quality Labels.Person 
UPDATE [${mjSchema}].[EntityField]
SET 
   Category = 'Record Context',
   GeneratedFormSection = 'Category',
   DisplayName = 'Person Name',
   ExtendedType = NULL,
   CodeType = NULL
WHERE 
   ID = 'CA9C1666-BDEF-410C-B252-54EE4DB4B978' AND AutoUpdateCategory = 1;

-- UPDATE Entity Field Category Info MoreCheese: Data Quality Labels.RelatedPerson 
UPDATE [${mjSchema}].[EntityField]
SET 
   Category = 'Record Context',
   GeneratedFormSection = 'Category',
   DisplayName = 'Related Person Name',
   ExtendedType = NULL,
   CodeType = NULL
WHERE 
   ID = '424A1D31-33A4-473D-8A8F-3E11EA38E9D2' AND AutoUpdateCategory = 1;

-- UPDATE Entity Field Category Info MoreCheese: Data Quality Labels.RelatedOrganization 
UPDATE [${mjSchema}].[EntityField]
SET 
   Category = 'Record Context',
   GeneratedFormSection = 'Category',
   DisplayName = 'Related Organization Name',
   ExtendedType = NULL,
   CodeType = NULL
WHERE 
   ID = '279AEBD5-4BBC-4A25-8397-089E5341D1F3' AND AutoUpdateCategory = 1;

-- UPDATE Entity Field Category Info MoreCheese: Data Quality Labels.__mj_CreatedAt 
UPDATE [${mjSchema}].[EntityField]
SET 
   Category = 'System Metadata',
   GeneratedFormSection = 'Category',
   ExtendedType = NULL,
   CodeType = NULL
WHERE 
   ID = 'BF1E576A-F9BE-47F1-9F87-8B2A93959FC3' AND AutoUpdateCategory = 1;

-- UPDATE Entity Field Category Info MoreCheese: Data Quality Labels.__mj_UpdatedAt 
UPDATE [${mjSchema}].[EntityField]
SET 
   Category = 'System Metadata',
   GeneratedFormSection = 'Category',
   ExtendedType = NULL,
   CodeType = NULL
WHERE 
   ID = '3536C09E-49F2-4567-80D5-AC73211D9CF0' AND AutoUpdateCategory = 1;

/* Set entity icon to fa fa-bug */

               UPDATE [${mjSchema}].[Entity]
               SET [Icon] = 'fa fa-bug', [__mj_UpdatedAt] = GETUTCDATE()
               WHERE [ID] = '50B6FD43-6669-41A0-8DBA-FB23C3B8C753';

/* Insert FieldCategoryInfo setting for entity */

               INSERT INTO [${mjSchema}].[EntitySetting] ([ID], [EntityID], [Name], [Value], [__mj_CreatedAt], [__mj_UpdatedAt])
               VALUES ('2134896b-a48d-4ce5-bbef-6b8c677b7a7b', '50B6FD43-6669-41A0-8DBA-FB23C3B8C753', 'FieldCategoryInfo', '{"Data Quality Label":{"icon":"fa fa-tag","description":"Core classification and identification for data quality test definitions."},"Record Context":{"icon":"fa fa-users","description":"References to the specific records being tested for data quality."},"Defect Details":{"icon":"fa fa-exclamation-triangle","description":"Specifics about the injected defects and the expected truth values."},"System Metadata":{"icon":"fa fa-cog","description":"System-managed audit and tracking fields."}}', GETUTCDATE(), GETUTCDATE());

/* Insert FieldCategoryIcons setting (legacy) */

               INSERT INTO [${mjSchema}].[EntitySetting] ([ID], [EntityID], [Name], [Value], [__mj_CreatedAt], [__mj_UpdatedAt])
               VALUES ('7348551a-1bae-49e8-b010-295163b5cb90', '50B6FD43-6669-41A0-8DBA-FB23C3B8C753', 'FieldCategoryIcons', '{"Data Quality Label":"fa fa-tag","Record Context":"fa fa-users","Defect Details":"fa fa-exclamation-triangle","System Metadata":"fa fa-cog"}', GETUTCDATE(), GETUTCDATE());

/* Set DefaultForNewUser=false for NEW entity (category: supporting, confidence: high) */

         UPDATE [${mjSchema}].[ApplicationEntity]
         SET [DefaultForNewUser] = 0, [__mj_UpdatedAt] = GETUTCDATE()
         WHERE [EntityID] = '50B6FD43-6669-41A0-8DBA-FB23C3B8C753';

/* Set categories for 11 fields */

-- UPDATE Entity Field Category Info MoreCheese: Event Registrations.ID 
UPDATE [${mjSchema}].[EntityField]
SET 
   Category = 'System Metadata',
   GeneratedFormSection = 'Category',
   ExtendedType = NULL,
   CodeType = NULL
WHERE 
   ID = 'FCCDB295-4FD0-4FAF-992D-E6D9936321E1' AND AutoUpdateCategory = 1;

-- UPDATE Entity Field Category Info MoreCheese: Event Registrations.RegKey 
UPDATE [${mjSchema}].[EntityField]
SET 
   Category = 'Registration Details',
   GeneratedFormSection = 'Category',
   DisplayName = 'Registration Key',
   ExtendedType = NULL,
   CodeType = NULL
WHERE 
   ID = 'AB982980-723A-477F-9B2D-7F3654C3379F' AND AutoUpdateCategory = 1;

-- UPDATE Entity Field Category Info MoreCheese: Event Registrations.PersonID 
UPDATE [${mjSchema}].[EntityField]
SET 
   Category = 'Registration Details',
   GeneratedFormSection = 'Category',
   ExtendedType = NULL,
   CodeType = NULL
WHERE 
   ID = 'FFBE607F-1C69-40E4-905B-871162E0EF56' AND AutoUpdateCategory = 1;

-- UPDATE Entity Field Category Info MoreCheese: Event Registrations.EventID 
UPDATE [${mjSchema}].[EntityField]
SET 
   Category = 'Registration Details',
   GeneratedFormSection = 'Category',
   ExtendedType = NULL,
   CodeType = NULL
WHERE 
   ID = '2A2646EF-3994-49DF-BC16-A7FCF9B419FB' AND AutoUpdateCategory = 1;

-- UPDATE Entity Field Category Info MoreCheese: Event Registrations.Person 
UPDATE [${mjSchema}].[EntityField]
SET 
   Category = 'Registration Details',
   GeneratedFormSection = 'Category',
   DisplayName = 'Person Name',
   ExtendedType = NULL,
   CodeType = NULL
WHERE 
   ID = 'B381B029-5F8D-4F5E-9521-39C68018FBC8' AND AutoUpdateCategory = 1;

-- UPDATE Entity Field Category Info MoreCheese: Event Registrations.Event 
UPDATE [${mjSchema}].[EntityField]
SET 
   Category = 'Registration Details',
   GeneratedFormSection = 'Category',
   DisplayName = 'Event Name',
   ExtendedType = NULL,
   CodeType = NULL
WHERE 
   ID = '99F5CE1A-D06D-485D-A03A-E64EED2A22E2' AND AutoUpdateCategory = 1;

-- UPDATE Entity Field Category Info MoreCheese: Event Registrations.RegisteredOn 
UPDATE [${mjSchema}].[EntityField]
SET 
   Category = 'Event Attendance',
   GeneratedFormSection = 'Category',
   ExtendedType = NULL,
   CodeType = NULL
WHERE 
   ID = '07F52F34-4C2D-4A8C-8832-F5F18C097207' AND AutoUpdateCategory = 1;

-- UPDATE Entity Field Category Info MoreCheese: Event Registrations.Attended 
UPDATE [${mjSchema}].[EntityField]
SET 
   Category = 'Event Attendance',
   GeneratedFormSection = 'Category',
   ExtendedType = NULL,
   CodeType = NULL
WHERE 
   ID = 'E35BCB1B-3348-405E-9AD1-7266BC505A6B' AND AutoUpdateCategory = 1;

-- UPDATE Entity Field Category Info MoreCheese: Event Registrations.IsSharedDemo 
UPDATE [${mjSchema}].[EntityField]
SET 
   Category = 'System Metadata',
   GeneratedFormSection = 'Category',
   ExtendedType = NULL,
   CodeType = NULL
WHERE 
   ID = 'D3DA72DE-56B6-4653-9773-A672FD0AA942' AND AutoUpdateCategory = 1;

-- UPDATE Entity Field Category Info MoreCheese: Event Registrations.__mj_CreatedAt 
UPDATE [${mjSchema}].[EntityField]
SET 
   Category = 'System Metadata',
   GeneratedFormSection = 'Category',
   ExtendedType = NULL,
   CodeType = NULL
WHERE 
   ID = '3FFD4504-5897-47EF-A0BF-99B672DB3E90' AND AutoUpdateCategory = 1;

-- UPDATE Entity Field Category Info MoreCheese: Event Registrations.__mj_UpdatedAt 
UPDATE [${mjSchema}].[EntityField]
SET 
   Category = 'System Metadata',
   GeneratedFormSection = 'Category',
   ExtendedType = NULL,
   CodeType = NULL
WHERE 
   ID = '5E10B4B1-BFC3-4DEC-BA98-7B634DD79116' AND AutoUpdateCategory = 1;

/* Set entity icon to fa fa-calendar-check */

               UPDATE [${mjSchema}].[Entity]
               SET [Icon] = 'fa fa-calendar-check', [__mj_UpdatedAt] = GETUTCDATE()
               WHERE [ID] = 'CD3EBECE-BFBE-485C-8FF4-8744A030FE07';

/* Insert FieldCategoryInfo setting for entity */

               INSERT INTO [${mjSchema}].[EntitySetting] ([ID], [EntityID], [Name], [Value], [__mj_CreatedAt], [__mj_UpdatedAt])
               VALUES ('12656edf-a16f-4fcc-816e-ea1651c4e09f', 'CD3EBECE-BFBE-485C-8FF4-8744A030FE07', 'FieldCategoryInfo', '{"Registration Details":{"icon":"fa fa-id-card","description":"Core registration identifiers and participant/event associations"},"Event Attendance":{"icon":"fa fa-check-circle","description":"Tracking of registration dates and actual event attendance status"},"System Metadata":{"icon":"fa fa-database","description":"Technical audit, demo management, and system tracking fields"}}', GETUTCDATE(), GETUTCDATE());

/* Insert FieldCategoryIcons setting (legacy) */

               INSERT INTO [${mjSchema}].[EntitySetting] ([ID], [EntityID], [Name], [Value], [__mj_CreatedAt], [__mj_UpdatedAt])
               VALUES ('2cbb78ed-7eac-4d70-9dc7-e6d82b089210', 'CD3EBECE-BFBE-485C-8FF4-8744A030FE07', 'FieldCategoryIcons', '{"Registration Details":"fa fa-id-card","Event Attendance":"fa fa-check-circle","System Metadata":"fa fa-database"}', GETUTCDATE(), GETUTCDATE());

/* Set DefaultForNewUser=true for NEW entity (category: supporting, confidence: high) */

         UPDATE [${mjSchema}].[ApplicationEntity]
         SET [DefaultForNewUser] = 1, [__mj_UpdatedAt] = GETUTCDATE()
         WHERE [EntityID] = 'CD3EBECE-BFBE-485C-8FF4-8744A030FE07';

/* Set categories for 25 fields */

-- UPDATE Entity Field Category Info MoreCheese: Member Profiles.ID 
UPDATE [${mjSchema}].[EntityField]
SET 
   Category = 'System Metadata',
   GeneratedFormSection = 'Category',
   ExtendedType = NULL,
   CodeType = NULL
WHERE 
   ID = '8E025D39-C217-41FB-B99E-67DD00A438B3' AND AutoUpdateCategory = 1;

-- UPDATE Entity Field Category Info MoreCheese: Member Profiles.PersonID 
UPDATE [${mjSchema}].[EntityField]
SET 
   Category = 'Member Identity',
   GeneratedFormSection = 'Category',
   DisplayName = 'Person',
   ExtendedType = NULL,
   CodeType = NULL
WHERE 
   ID = 'F05FE60F-083C-48C1-9F86-97B21710A48E' AND AutoUpdateCategory = 1;

-- UPDATE Entity Field Category Info MoreCheese: Member Profiles.OrganizationID 
UPDATE [${mjSchema}].[EntityField]
SET 
   Category = 'Member Identity',
   GeneratedFormSection = 'Category',
   DisplayName = 'Organization',
   ExtendedType = NULL,
   CodeType = NULL
WHERE 
   ID = 'DCC3A015-251A-41C5-9242-9F228D457D1E' AND AutoUpdateCategory = 1;

-- UPDATE Entity Field Category Info MoreCheese: Member Profiles.MemberNumber 
UPDATE [${mjSchema}].[EntityField]
SET 
   Category = 'Member Identity',
   GeneratedFormSection = 'Category',
   ExtendedType = NULL,
   CodeType = NULL
WHERE 
   ID = 'C056444F-8753-477E-A909-86AC160E8CDF' AND AutoUpdateCategory = 1;

-- UPDATE Entity Field Category Info MoreCheese: Member Profiles.Segment 
UPDATE [${mjSchema}].[EntityField]
SET 
   Category = 'Member Details',
   GeneratedFormSection = 'Category',
   ExtendedType = NULL,
   CodeType = NULL
WHERE 
   ID = 'CEAE0D08-1C23-4AB9-862B-7720FEF292E7' AND AutoUpdateCategory = 1;

-- UPDATE Entity Field Category Info MoreCheese: Member Profiles.JoinDate 
UPDATE [${mjSchema}].[EntityField]
SET 
   Category = 'Member Details',
   GeneratedFormSection = 'Category',
   ExtendedType = NULL,
   CodeType = NULL
WHERE 
   ID = '48E77991-959B-46B3-8565-84F9126FDB7C' AND AutoUpdateCategory = 1;

-- UPDATE Entity Field Category Info MoreCheese: Member Profiles.IsSharedDemo 
UPDATE [${mjSchema}].[EntityField]
SET 
   Category = 'Member Details',
   GeneratedFormSection = 'Category',
   ExtendedType = NULL,
   CodeType = NULL
WHERE 
   ID = '520209DB-E726-48BE-B304-623F99A8D38D' AND AutoUpdateCategory = 1;

-- UPDATE Entity Field Category Info MoreCheese: Member Profiles.Region 
UPDATE [${mjSchema}].[EntityField]
SET 
   Category = 'Geography and Location',
   GeneratedFormSection = 'Category',
   ExtendedType = NULL,
   CodeType = NULL
WHERE 
   ID = '28126800-5A2F-4DE4-9907-9BD4CFE38F2E' AND AutoUpdateCategory = 1;

-- UPDATE Entity Field Category Info MoreCheese: Member Profiles.Country 
UPDATE [${mjSchema}].[EntityField]
SET 
   Category = 'Geography and Location',
   GeneratedFormSection = 'Category',
   ExtendedType = 'GeoCountry',
   CodeType = NULL
WHERE 
   ID = '31563F0F-7D00-46B9-ACA5-361C52B206AC' AND AutoUpdateCategory = 1;

-- UPDATE Entity Field Category Info MoreCheese: Member Profiles.CountryName 
UPDATE [${mjSchema}].[EntityField]
SET 
   Category = 'Geography and Location',
   GeneratedFormSection = 'Category',
   ExtendedType = NULL,
   CodeType = NULL
WHERE 
   ID = '21B34DE0-0BAA-4614-87FE-30F9C8C191F4' AND AutoUpdateCategory = 1;

-- UPDATE Entity Field Category Info MoreCheese: Member Profiles.City 
UPDATE [${mjSchema}].[EntityField]
SET 
   Category = 'Geography and Location',
   GeneratedFormSection = 'Category',
   ExtendedType = 'GeoCity',
   CodeType = NULL
WHERE 
   ID = '7A9B530F-6263-4107-891E-CB7926307538' AND AutoUpdateCategory = 1;

-- UPDATE Entity Field Category Info MoreCheese: Member Profiles.State 
UPDATE [${mjSchema}].[EntityField]
SET 
   Category = 'Geography and Location',
   GeneratedFormSection = 'Category',
   ExtendedType = 'GeoStateProvince',
   CodeType = NULL
WHERE 
   ID = 'AB949D39-8367-4520-A407-9DD8E090F87F' AND AutoUpdateCategory = 1;

-- UPDATE Entity Field Category Info MoreCheese: Member Profiles.AddressLine1 
UPDATE [${mjSchema}].[EntityField]
SET 
   Category = 'Geography and Location',
   GeneratedFormSection = 'Category',
   ExtendedType = 'GeoAddress',
   CodeType = NULL
WHERE 
   ID = '6876ADE5-10DC-4CC5-B16F-95D7D64AD7D5' AND AutoUpdateCategory = 1;

-- UPDATE Entity Field Category Info MoreCheese: Member Profiles.AddressLine2 
UPDATE [${mjSchema}].[EntityField]
SET 
   Category = 'Geography and Location',
   GeneratedFormSection = 'Category',
   ExtendedType = 'GeoAddress',
   CodeType = NULL
WHERE 
   ID = 'F224868C-0785-4FC7-9143-C2A075E741DE' AND AutoUpdateCategory = 1;

-- UPDATE Entity Field Category Info MoreCheese: Member Profiles.PostalCode 
UPDATE [${mjSchema}].[EntityField]
SET 
   Category = 'Geography and Location',
   GeneratedFormSection = 'Category',
   ExtendedType = 'GeoPostalCode',
   CodeType = NULL
WHERE 
   ID = '57DC1AB5-7F1E-4AA4-A94C-B3AFC742C13C' AND AutoUpdateCategory = 1;

-- UPDATE Entity Field Category Info MoreCheese: Member Profiles.Latitude 
UPDATE [${mjSchema}].[EntityField]
SET 
   Category = 'Geography and Location',
   GeneratedFormSection = 'Category',
   ExtendedType = 'GeoLatitude',
   CodeType = NULL
WHERE 
   ID = '769A7A33-03B5-4F7F-99A7-E8AA0C2A18AE' AND AutoUpdateCategory = 1;

-- UPDATE Entity Field Category Info MoreCheese: Member Profiles.Longitude 
UPDATE [${mjSchema}].[EntityField]
SET 
   Category = 'Geography and Location',
   GeneratedFormSection = 'Category',
   ExtendedType = 'GeoLongitude',
   CodeType = NULL
WHERE 
   ID = '2BA0DB75-005C-4601-A1AE-A5571E3D6095' AND AutoUpdateCategory = 1;

-- UPDATE Entity Field Category Info MoreCheese: Member Profiles.RaceEthnicity 
UPDATE [${mjSchema}].[EntityField]
SET 
   Category = 'Demographics',
   GeneratedFormSection = 'Category',
   ExtendedType = NULL,
   CodeType = NULL
WHERE 
   ID = '001DDE07-639A-471C-9F99-78B63D14B078' AND AutoUpdateCategory = 1;

-- UPDATE Entity Field Category Info MoreCheese: Member Profiles.EthnicityHispanic 
UPDATE [${mjSchema}].[EntityField]
SET 
   Category = 'Demographics',
   GeneratedFormSection = 'Category',
   ExtendedType = NULL,
   CodeType = NULL
WHERE 
   ID = '3C3EC353-4E8A-463A-BEA0-296D0C896D8E' AND AutoUpdateCategory = 1;

-- UPDATE Entity Field Category Info MoreCheese: Member Profiles.PronounSet 
UPDATE [${mjSchema}].[EntityField]
SET 
   Category = 'Demographics',
   GeneratedFormSection = 'Category',
   ExtendedType = NULL,
   CodeType = NULL
WHERE 
   ID = '3A98B093-7682-4695-B909-18953705FB24' AND AutoUpdateCategory = 1;

-- UPDATE Entity Field Category Info MoreCheese: Member Profiles.PrimaryLanguage 
UPDATE [${mjSchema}].[EntityField]
SET 
   Category = 'Demographics',
   GeneratedFormSection = 'Category',
   ExtendedType = NULL,
   CodeType = NULL
WHERE 
   ID = '63A2D970-02F0-4635-83C2-7EE1559C6012' AND AutoUpdateCategory = 1;

-- UPDATE Entity Field Category Info MoreCheese: Member Profiles.Person 
UPDATE [${mjSchema}].[EntityField]
SET 
   Category = 'Member Identity',
   GeneratedFormSection = 'Category',
   DisplayName = 'Person Name',
   ExtendedType = NULL,
   CodeType = NULL
WHERE 
   ID = '34795BA3-DF48-4333-A5BC-73923C52C20F' AND AutoUpdateCategory = 1;

-- UPDATE Entity Field Category Info MoreCheese: Member Profiles.Organization 
UPDATE [${mjSchema}].[EntityField]
SET 
   Category = 'Member Identity',
   GeneratedFormSection = 'Category',
   DisplayName = 'Organization Name',
   ExtendedType = NULL,
   CodeType = NULL
WHERE 
   ID = '12A73BA6-836D-4EEC-8DB8-1A67C5E474D9' AND AutoUpdateCategory = 1;

-- UPDATE Entity Field Category Info MoreCheese: Member Profiles.__mj_CreatedAt 
UPDATE [${mjSchema}].[EntityField]
SET 
   Category = 'System Metadata',
   GeneratedFormSection = 'Category',
   ExtendedType = NULL,
   CodeType = NULL
WHERE 
   ID = 'E4455FBB-46FE-4B2B-BD48-A1AA35B217D2' AND AutoUpdateCategory = 1;

-- UPDATE Entity Field Category Info MoreCheese: Member Profiles.__mj_UpdatedAt 
UPDATE [${mjSchema}].[EntityField]
SET 
   Category = 'System Metadata',
   GeneratedFormSection = 'Category',
   ExtendedType = NULL,
   CodeType = NULL
WHERE 
   ID = 'B9C52FAD-923F-400B-BDC0-91DFB39F8F28' AND AutoUpdateCategory = 1;

/* Set SupportsGeoCoding = true for MoreCheese: Member Profiles */

            UPDATE [${mjSchema}].[Entity]
            SET [SupportsGeoCoding] = 1
            WHERE [ID] = '70C724C9-B518-4D81-81B0-BE7F4962B63A' AND [AutoUpdateSupportsGeoCoding] = 1;

/* Set entity icon to fa fa-user-circle */

               UPDATE [${mjSchema}].[Entity]
               SET [Icon] = 'fa fa-user-circle', [__mj_UpdatedAt] = GETUTCDATE()
               WHERE [ID] = '70C724C9-B518-4D81-81B0-BE7F4962B63A';

/* Insert FieldCategoryInfo setting for entity */

               INSERT INTO [${mjSchema}].[EntitySetting] ([ID], [EntityID], [Name], [Value], [__mj_CreatedAt], [__mj_UpdatedAt])
               VALUES ('7e380c19-5807-4ab0-9a5a-fd455525e100', '70C724C9-B518-4D81-81B0-BE7F4962B63A', 'FieldCategoryInfo', '{"Member Identity":{"icon":"fa fa-id-card","description":"Core identifiers linking the member to people and organizations"},"Member Details":{"icon":"fa fa-info-circle","description":"General membership information such as segments and join dates"},"Geography and Location":{"icon":"fa fa-map-marker-alt","description":"Geographic details including address, region, and mapping coordinates"},"Demographics":{"icon":"fa fa-users","description":"Personal demographic information including ethnicity, language, and pronouns"},"System Metadata":{"icon":"fa fa-cog","description":"System-managed audit and tracking fields"}}', GETUTCDATE(), GETUTCDATE());

/* Insert FieldCategoryIcons setting (legacy) */

               INSERT INTO [${mjSchema}].[EntitySetting] ([ID], [EntityID], [Name], [Value], [__mj_CreatedAt], [__mj_UpdatedAt])
               VALUES ('04e5467f-344f-4ca1-b948-8ca064dec87e', '70C724C9-B518-4D81-81B0-BE7F4962B63A', 'FieldCategoryIcons', '{"Member Identity":"fa fa-id-card","Member Details":"fa fa-info-circle","Geography and Location":"fa fa-map-marker-alt","Demographics":"fa fa-users","System Metadata":"fa fa-cog"}', GETUTCDATE(), GETUTCDATE());

/* Set DefaultForNewUser=true for NEW entity (category: primary, confidence: high) */

         UPDATE [${mjSchema}].[ApplicationEntity]
         SET [DefaultForNewUser] = 1, [__mj_UpdatedAt] = GETUTCDATE()
         WHERE [EntityID] = '70C724C9-B518-4D81-81B0-BE7F4962B63A';

/* Set field properties for entity */

               UPDATE [${mjSchema}].[EntityField]
               SET IsNameField = 1
               WHERE ID = 'C9388E2B-692A-4B0B-BBC2-9A00E9553A11'
               AND AutoUpdateIsNameField = 1;

               UPDATE [${mjSchema}].[EntityField]
               SET DefaultInView = 1
               WHERE ID = 'C9388E2B-692A-4B0B-BBC2-9A00E9553A11'
               AND AutoUpdateDefaultInView = 1;

               UPDATE [${mjSchema}].[EntityField]
               SET DefaultInView = 1
               WHERE ID = '52DEF96D-22AA-4AAC-9752-45561D7B9E6E'
               AND AutoUpdateDefaultInView = 1;

               UPDATE [${mjSchema}].[EntityField]
               SET DefaultInView = 1
               WHERE ID = 'D8D733C1-AD7B-4072-9E6A-2B181BDD5B85'
               AND AutoUpdateDefaultInView = 1;

               UPDATE [${mjSchema}].[EntityField]
               SET DefaultInView = 1
               WHERE ID = '58AA7EB9-473F-4E76-82EF-330D5D914E8C'
               AND AutoUpdateDefaultInView = 1;

               UPDATE [${mjSchema}].[EntityField]
               SET DefaultInView = 1
               WHERE ID = '2F526A4F-673F-4182-82B3-6305959954C5'
               AND AutoUpdateDefaultInView = 1;

               UPDATE [${mjSchema}].[EntityField]
               SET DefaultInView = 1
               WHERE ID = 'AC4037FF-56F3-4B79-8F52-59C68B0312F7'
               AND AutoUpdateDefaultInView = 1;

               UPDATE [${mjSchema}].[EntityField]
               SET IncludeInUserSearchAPI = 1
               WHERE ID = 'C9388E2B-692A-4B0B-BBC2-9A00E9553A11'
               AND AutoUpdateIncludeInUserSearchAPI = 1;

               UPDATE [${mjSchema}].[EntityField]
               SET UserSearchPredicateAPI = 'Exact'
               WHERE ID = 'C9388E2B-692A-4B0B-BBC2-9A00E9553A11'
               AND AutoUpdateUserSearchPredicate = 1;

/* Set field properties for entity */

               UPDATE [${mjSchema}].[EntityField]
               SET DefaultInView = 1
               WHERE ID = '4B782EF4-2BAE-432D-9E11-4958DC215A3F'
               AND AutoUpdateDefaultInView = 1;

               UPDATE [${mjSchema}].[EntityField]
               SET DefaultInView = 1
               WHERE ID = 'C2532FAF-8510-45A6-8FD2-8517130EFE57'
               AND AutoUpdateDefaultInView = 1;

               UPDATE [${mjSchema}].[EntityField]
               SET DefaultInView = 1
               WHERE ID = '71AE7961-66D0-43ED-8ADF-1A95B51B7E90'
               AND AutoUpdateDefaultInView = 1;

               UPDATE [${mjSchema}].[EntityField]
               SET DefaultInView = 1
               WHERE ID = '9BF77CA1-2784-4C72-A3C5-6847CA58EF28'
               AND AutoUpdateDefaultInView = 1;

               UPDATE [${mjSchema}].[EntityField]
               SET DefaultInView = 1
               WHERE ID = 'C492F3F2-6891-49C9-A530-BAFB4981029A'
               AND AutoUpdateDefaultInView = 1;

               UPDATE [${mjSchema}].[EntityField]
               SET DefaultInView = 1
               WHERE ID = '6C4ECD27-85A8-477D-9002-A93A3BBEBDED'
               AND AutoUpdateDefaultInView = 1;

               UPDATE [${mjSchema}].[EntityField]
               SET IncludeInUserSearchAPI = 1
               WHERE ID = '4B782EF4-2BAE-432D-9E11-4958DC215A3F'
               AND AutoUpdateIncludeInUserSearchAPI = 1;

               UPDATE [${mjSchema}].[EntityField]
               SET IncludeInUserSearchAPI = 1
               WHERE ID = '6C4ECD27-85A8-477D-9002-A93A3BBEBDED'
               AND AutoUpdateIncludeInUserSearchAPI = 1;

               UPDATE [${mjSchema}].[EntityField]
               SET UserSearchPredicateAPI = 'BeginsWith'
               WHERE ID = '6C4ECD27-85A8-477D-9002-A93A3BBEBDED'
               AND AutoUpdateUserSearchPredicate = 1;

               UPDATE [${mjSchema}].[EntityField]
               SET UserSearchPredicateAPI = 'Exact'
               WHERE ID = '4B782EF4-2BAE-432D-9E11-4958DC215A3F'
               AND AutoUpdateUserSearchPredicate = 1;

/* Set categories for 16 fields */

-- UPDATE Entity Field Category Info MoreCheese: Membership Periods.ID 
UPDATE [${mjSchema}].[EntityField]
SET 
   Category = 'System Metadata',
   GeneratedFormSection = 'Category',
   ExtendedType = NULL,
   CodeType = NULL
WHERE 
   ID = 'A1E95382-4DCF-4F5C-8029-D17C6BC2B54D' AND AutoUpdateCategory = 1;

-- UPDATE Entity Field Category Info MoreCheese: Membership Periods.PeriodKey 
UPDATE [${mjSchema}].[EntityField]
SET 
   Category = 'Membership Details',
   GeneratedFormSection = 'Category',
   ExtendedType = NULL,
   CodeType = NULL
WHERE 
   ID = 'C9388E2B-692A-4B0B-BBC2-9A00E9553A11' AND AutoUpdateCategory = 1;

-- UPDATE Entity Field Category Info MoreCheese: Membership Periods.PersonID 
UPDATE [${mjSchema}].[EntityField]
SET 
   Category = 'Membership Details',
   GeneratedFormSection = 'Category',
   ExtendedType = NULL,
   CodeType = NULL
WHERE 
   ID = '5D36973E-4CA0-42C1-A641-653E3A3962F3' AND AutoUpdateCategory = 1;

-- UPDATE Entity Field Category Info MoreCheese: Membership Periods.Person 
UPDATE [${mjSchema}].[EntityField]
SET 
   Category = 'Membership Details',
   GeneratedFormSection = 'Category',
   ExtendedType = NULL,
   CodeType = NULL
WHERE 
   ID = 'AC4037FF-56F3-4B79-8F52-59C68B0312F7' AND AutoUpdateCategory = 1;

-- UPDATE Entity Field Category Info MoreCheese: Membership Periods.MembershipTier 
UPDATE [${mjSchema}].[EntityField]
SET 
   Category = 'Membership Details',
   GeneratedFormSection = 'Category',
   ExtendedType = NULL,
   CodeType = NULL
WHERE 
   ID = '52DEF96D-22AA-4AAC-9752-45561D7B9E6E' AND AutoUpdateCategory = 1;

-- UPDATE Entity Field Category Info MoreCheese: Membership Periods.DuesAmount 
UPDATE [${mjSchema}].[EntityField]
SET 
   Category = 'Financial Information',
   GeneratedFormSection = 'Category',
   ExtendedType = NULL,
   CodeType = NULL
WHERE 
   ID = '916290C3-05F9-41CB-A9CE-B9E78DA7F4D0' AND AutoUpdateCategory = 1;

-- UPDATE Entity Field Category Info MoreCheese: Membership Periods.AutoRenew 
UPDATE [${mjSchema}].[EntityField]
SET 
   Category = 'Financial Information',
   GeneratedFormSection = 'Category',
   ExtendedType = NULL,
   CodeType = NULL
WHERE 
   ID = '97EC08D1-DE91-45F9-AC4E-3F123ABF46C7' AND AutoUpdateCategory = 1;

-- UPDATE Entity Field Category Info MoreCheese: Membership Periods.StartDate 
UPDATE [${mjSchema}].[EntityField]
SET 
   Category = 'Timeline and Status',
   GeneratedFormSection = 'Category',
   ExtendedType = NULL,
   CodeType = NULL
WHERE 
   ID = 'D8D733C1-AD7B-4072-9E6A-2B181BDD5B85' AND AutoUpdateCategory = 1;

-- UPDATE Entity Field Category Info MoreCheese: Membership Periods.EndDate 
UPDATE [${mjSchema}].[EntityField]
SET 
   Category = 'Timeline and Status',
   GeneratedFormSection = 'Category',
   ExtendedType = NULL,
   CodeType = NULL
WHERE 
   ID = '58AA7EB9-473F-4E76-82EF-330D5D914E8C' AND AutoUpdateCategory = 1;

-- UPDATE Entity Field Category Info MoreCheese: Membership Periods.RenewalDate 
UPDATE [${mjSchema}].[EntityField]
SET 
   Category = 'Timeline and Status',
   GeneratedFormSection = 'Category',
   ExtendedType = NULL,
   CodeType = NULL
WHERE 
   ID = '3F5345CE-676A-414A-81C8-A6EA7B0D5609' AND AutoUpdateCategory = 1;

-- UPDATE Entity Field Category Info MoreCheese: Membership Periods.Status 
UPDATE [${mjSchema}].[EntityField]
SET 
   Category = 'Timeline and Status',
   GeneratedFormSection = 'Category',
   ExtendedType = NULL,
   CodeType = NULL
WHERE 
   ID = '2F526A4F-673F-4182-82B3-6305959954C5' AND AutoUpdateCategory = 1;

-- UPDATE Entity Field Category Info MoreCheese: Membership Periods.CancellationDate 
UPDATE [${mjSchema}].[EntityField]
SET 
   Category = 'Timeline and Status',
   GeneratedFormSection = 'Category',
   ExtendedType = NULL,
   CodeType = NULL
WHERE 
   ID = '4306C89A-4567-4261-AE6E-4158CDA58057' AND AutoUpdateCategory = 1;

-- UPDATE Entity Field Category Info MoreCheese: Membership Periods.CancellationReason 
UPDATE [${mjSchema}].[EntityField]
SET 
   Category = 'Timeline and Status',
   GeneratedFormSection = 'Category',
   ExtendedType = NULL,
   CodeType = NULL
WHERE 
   ID = '1B2B0220-200A-45A2-AC75-56ECF54253CA' AND AutoUpdateCategory = 1;

-- UPDATE Entity Field Category Info MoreCheese: Membership Periods.IsSharedDemo 
UPDATE [${mjSchema}].[EntityField]
SET 
   Category = 'System Metadata',
   GeneratedFormSection = 'Category',
   ExtendedType = NULL,
   CodeType = NULL
WHERE 
   ID = 'AB28E37C-FD4C-471A-9FA2-517DD09E5889' AND AutoUpdateCategory = 1;

-- UPDATE Entity Field Category Info MoreCheese: Membership Periods.__mj_CreatedAt 
UPDATE [${mjSchema}].[EntityField]
SET 
   Category = 'System Metadata',
   GeneratedFormSection = 'Category',
   ExtendedType = NULL,
   CodeType = NULL
WHERE 
   ID = '68A7357F-8C19-495C-838A-4B66BBF39DDE' AND AutoUpdateCategory = 1;

-- UPDATE Entity Field Category Info MoreCheese: Membership Periods.__mj_UpdatedAt 
UPDATE [${mjSchema}].[EntityField]
SET 
   Category = 'System Metadata',
   GeneratedFormSection = 'Category',
   ExtendedType = NULL,
   CodeType = NULL
WHERE 
   ID = '26E83C10-C993-49ED-A313-59CA4EF7AD2A' AND AutoUpdateCategory = 1;

/* Set entity icon to fa fa-calendar-check */

               UPDATE [${mjSchema}].[Entity]
               SET [Icon] = 'fa fa-calendar-check', [__mj_UpdatedAt] = GETUTCDATE()
               WHERE [ID] = '6585D210-BD5A-44E2-BD90-0D425734DCF0';

/* Insert FieldCategoryInfo setting for entity */

               INSERT INTO [${mjSchema}].[EntitySetting] ([ID], [EntityID], [Name], [Value], [__mj_CreatedAt], [__mj_UpdatedAt])
               VALUES ('0bc3cd5f-4048-46dd-85f8-0d14d85edaa4', '6585D210-BD5A-44E2-BD90-0D425734DCF0', 'FieldCategoryInfo', '{"Membership Details":{"icon":"fa fa-id-card","description":"Core membership identification and tier information"},"Financial Information":{"icon":"fa fa-dollar-sign","description":"Billing amounts and payment renewal preferences"},"Timeline and Status":{"icon":"fa fa-clock","description":"Period dates, lifecycle status, and termination details"},"System Metadata":{"icon":"fa fa-cog","description":"System-managed audit, demo flags, and technical identifiers"}}', GETUTCDATE(), GETUTCDATE());

/* Insert FieldCategoryIcons setting (legacy) */

               INSERT INTO [${mjSchema}].[EntitySetting] ([ID], [EntityID], [Name], [Value], [__mj_CreatedAt], [__mj_UpdatedAt])
               VALUES ('0a1becd9-17f7-42a3-af6e-cbc2fa2e1c61', '6585D210-BD5A-44E2-BD90-0D425734DCF0', 'FieldCategoryIcons', '{"Membership Details":"fa fa-id-card","Financial Information":"fa fa-dollar-sign","Timeline and Status":"fa fa-clock","System Metadata":"fa fa-cog"}', GETUTCDATE(), GETUTCDATE());

/* Set DefaultForNewUser=true for NEW entity (category: supporting, confidence: high) */

         UPDATE [${mjSchema}].[ApplicationEntity]
         SET [DefaultForNewUser] = 1, [__mj_UpdatedAt] = GETUTCDATE()
         WHERE [EntityID] = '6585D210-BD5A-44E2-BD90-0D425734DCF0';

/* Set categories for 19 fields */

-- UPDATE Entity Field Category Info MoreCheese: Organization Profiles.ID 
UPDATE [${mjSchema}].[EntityField]
SET 
   Category = 'System Metadata',
   GeneratedFormSection = 'Category',
   ExtendedType = NULL,
   CodeType = NULL
WHERE 
   ID = 'C795296C-00DA-4CDF-9D11-DF7BB198871E' AND AutoUpdateCategory = 1;

-- UPDATE Entity Field Category Info MoreCheese: Organization Profiles.OrganizationID 
UPDATE [${mjSchema}].[EntityField]
SET 
   Category = 'Organization Identity',
   GeneratedFormSection = 'Category',
   ExtendedType = NULL,
   CodeType = NULL
WHERE 
   ID = '51DD3FFC-E786-49E1-902D-F0589D67C50B' AND AutoUpdateCategory = 1;

-- UPDATE Entity Field Category Info MoreCheese: Organization Profiles.Organization 
UPDATE [${mjSchema}].[EntityField]
SET 
   Category = 'Organization Identity',
   GeneratedFormSection = 'Category',
   DisplayName = 'Organization Name',
   ExtendedType = NULL,
   CodeType = NULL
WHERE 
   ID = '6C4ECD27-85A8-477D-9002-A93A3BBEBDED' AND AutoUpdateCategory = 1;

-- UPDATE Entity Field Category Info MoreCheese: Organization Profiles.OrgKey 
UPDATE [${mjSchema}].[EntityField]
SET 
   Category = 'Organization Identity',
   GeneratedFormSection = 'Category',
   DisplayName = 'Organization Key',
   ExtendedType = NULL,
   CodeType = NULL
WHERE 
   ID = '4B782EF4-2BAE-432D-9E11-4958DC215A3F' AND AutoUpdateCategory = 1;

-- UPDATE Entity Field Category Info MoreCheese: Organization Profiles.Type 
UPDATE [${mjSchema}].[EntityField]
SET 
   Category = 'Organization Identity',
   GeneratedFormSection = 'Category',
   ExtendedType = NULL,
   CodeType = NULL
WHERE 
   ID = 'C2532FAF-8510-45A6-8FD2-8517130EFE57' AND AutoUpdateCategory = 1;

-- UPDATE Entity Field Category Info MoreCheese: Organization Profiles.Region 
UPDATE [${mjSchema}].[EntityField]
SET 
   Category = 'Location and Geography',
   GeneratedFormSection = 'Category',
   ExtendedType = NULL,
   CodeType = NULL
WHERE 
   ID = '978C4EEA-6E65-47C0-B2FF-8D41A5C85805' AND AutoUpdateCategory = 1;

-- UPDATE Entity Field Category Info MoreCheese: Organization Profiles.Country 
UPDATE [${mjSchema}].[EntityField]
SET 
   Category = 'Location and Geography',
   GeneratedFormSection = 'Category',
   DisplayName = 'Country Code',
   ExtendedType = 'GeoCountry',
   CodeType = NULL
WHERE 
   ID = 'D4845F69-9CEF-4E4A-8FFF-F0793133079F' AND AutoUpdateCategory = 1;

-- UPDATE Entity Field Category Info MoreCheese: Organization Profiles.CountryName 
UPDATE [${mjSchema}].[EntityField]
SET 
   Category = 'Location and Geography',
   GeneratedFormSection = 'Category',
   ExtendedType = NULL,
   CodeType = NULL
WHERE 
   ID = 'AFC60647-8CCE-472E-A17A-D7920671671C' AND AutoUpdateCategory = 1;

-- UPDATE Entity Field Category Info MoreCheese: Organization Profiles.City 
UPDATE [${mjSchema}].[EntityField]
SET 
   Category = 'Location and Geography',
   GeneratedFormSection = 'Category',
   ExtendedType = 'GeoCity',
   CodeType = NULL
WHERE 
   ID = '71AE7961-66D0-43ED-8ADF-1A95B51B7E90' AND AutoUpdateCategory = 1;

-- UPDATE Entity Field Category Info MoreCheese: Organization Profiles.State 
UPDATE [${mjSchema}].[EntityField]
SET 
   Category = 'Location and Geography',
   GeneratedFormSection = 'Category',
   ExtendedType = 'GeoStateProvince',
   CodeType = NULL
WHERE 
   ID = '9BF77CA1-2784-4C72-A3C5-6847CA58EF28' AND AutoUpdateCategory = 1;

-- UPDATE Entity Field Category Info MoreCheese: Organization Profiles.AddressLine1 
UPDATE [${mjSchema}].[EntityField]
SET 
   Category = 'Location and Geography',
   GeneratedFormSection = 'Category',
   ExtendedType = 'GeoAddress',
   CodeType = NULL
WHERE 
   ID = '5F425CD9-794B-45FB-91A9-28899530E1FC' AND AutoUpdateCategory = 1;

-- UPDATE Entity Field Category Info MoreCheese: Organization Profiles.PostalCode 
UPDATE [${mjSchema}].[EntityField]
SET 
   Category = 'Location and Geography',
   GeneratedFormSection = 'Category',
   ExtendedType = 'GeoPostalCode',
   CodeType = NULL
WHERE 
   ID = 'EBB000DE-945B-4CE7-9FF1-A9FFB528FEED' AND AutoUpdateCategory = 1;

-- UPDATE Entity Field Category Info MoreCheese: Organization Profiles.Latitude 
UPDATE [${mjSchema}].[EntityField]
SET 
   Category = 'Location and Geography',
   GeneratedFormSection = 'Category',
   ExtendedType = 'GeoLatitude',
   CodeType = NULL
WHERE 
   ID = '2041EA01-EFB7-4444-AA3D-37F6A068D3E4' AND AutoUpdateCategory = 1;

-- UPDATE Entity Field Category Info MoreCheese: Organization Profiles.Longitude 
UPDATE [${mjSchema}].[EntityField]
SET 
   Category = 'Location and Geography',
   GeneratedFormSection = 'Category',
   ExtendedType = 'GeoLongitude',
   CodeType = NULL
WHERE 
   ID = '234346A0-73B4-4BC5-8792-26FDD52DA29B' AND AutoUpdateCategory = 1;

-- UPDATE Entity Field Category Info MoreCheese: Organization Profiles.LifecycleEventKind 
UPDATE [${mjSchema}].[EntityField]
SET 
   Category = 'Lifecycle and Churn',
   GeneratedFormSection = 'Category',
   DisplayName = 'Lifecycle Event',
   ExtendedType = NULL,
   CodeType = NULL
WHERE 
   ID = 'C492F3F2-6891-49C9-A530-BAFB4981029A' AND AutoUpdateCategory = 1;

-- UPDATE Entity Field Category Info MoreCheese: Organization Profiles.LifecycleEventYear 
UPDATE [${mjSchema}].[EntityField]
SET 
   Category = 'Lifecycle and Churn',
   GeneratedFormSection = 'Category',
   DisplayName = 'Event Year',
   ExtendedType = NULL,
   CodeType = NULL
WHERE 
   ID = 'C84D997F-459A-412C-8F49-147CC39E7BF5' AND AutoUpdateCategory = 1;

-- UPDATE Entity Field Category Info MoreCheese: Organization Profiles.IsSharedDemo 
UPDATE [${mjSchema}].[EntityField]
SET 
   Category = 'System Metadata',
   GeneratedFormSection = 'Category',
   ExtendedType = NULL,
   CodeType = NULL
WHERE 
   ID = 'DD164A6A-F4B5-4B7F-B34A-8647443C5AA6' AND AutoUpdateCategory = 1;

-- UPDATE Entity Field Category Info MoreCheese: Organization Profiles.__mj_CreatedAt 
UPDATE [${mjSchema}].[EntityField]
SET 
   Category = 'System Metadata',
   GeneratedFormSection = 'Category',
   ExtendedType = NULL,
   CodeType = NULL
WHERE 
   ID = 'E1F77699-A166-48B2-B243-32F616BD715F' AND AutoUpdateCategory = 1;

-- UPDATE Entity Field Category Info MoreCheese: Organization Profiles.__mj_UpdatedAt 
UPDATE [${mjSchema}].[EntityField]
SET 
   Category = 'System Metadata',
   GeneratedFormSection = 'Category',
   ExtendedType = NULL,
   CodeType = NULL
WHERE 
   ID = 'C0561CCC-F07A-44F4-804B-99C968B198D8' AND AutoUpdateCategory = 1;

/* Set SupportsGeoCoding = true for MoreCheese: Organization Profiles */

            UPDATE [${mjSchema}].[Entity]
            SET [SupportsGeoCoding] = 1
            WHERE [ID] = 'A820FA5A-520E-4058-92D8-33C5AEC0FEC5' AND [AutoUpdateSupportsGeoCoding] = 1;

/* Set entity icon to fa fa-building */

               UPDATE [${mjSchema}].[Entity]
               SET [Icon] = 'fa fa-building', [__mj_UpdatedAt] = GETUTCDATE()
               WHERE [ID] = 'A820FA5A-520E-4058-92D8-33C5AEC0FEC5';

/* Insert FieldCategoryInfo setting for entity */

               INSERT INTO [${mjSchema}].[EntitySetting] ([ID], [EntityID], [Name], [Value], [__mj_CreatedAt], [__mj_UpdatedAt])
               VALUES ('840f0e18-d182-49d3-9d3c-f0a1a6beb8c4', 'A820FA5A-520E-4058-92D8-33C5AEC0FEC5', 'FieldCategoryInfo', '{"Organization Identity":{"icon":"fa fa-id-card","description":"Core identity and classification details for the organization."},"Location and Geography":{"icon":"fa fa-map-marker-alt","description":"Geographic location, address, and mapping coordinates."},"Lifecycle and Churn":{"icon":"fa fa-history","description":"Tracking of organizational lifecycle events and churn drivers."},"System Metadata":{"icon":"fa fa-cog","description":"System-managed audit and maintenance fields."}}', GETUTCDATE(), GETUTCDATE());

/* Insert FieldCategoryIcons setting (legacy) */

               INSERT INTO [${mjSchema}].[EntitySetting] ([ID], [EntityID], [Name], [Value], [__mj_CreatedAt], [__mj_UpdatedAt])
               VALUES ('becda566-8e3a-4802-9121-3217a5919028', 'A820FA5A-520E-4058-92D8-33C5AEC0FEC5', 'FieldCategoryIcons', '{"Organization Identity":"fa fa-id-card","Location and Geography":"fa fa-map-marker-alt","Lifecycle and Churn":"fa fa-history","System Metadata":"fa fa-cog"}', GETUTCDATE(), GETUTCDATE());

/* Set DefaultForNewUser=true for NEW entity (category: primary, confidence: high) */

         UPDATE [${mjSchema}].[ApplicationEntity]
         SET [DefaultForNewUser] = 1, [__mj_UpdatedAt] = GETUTCDATE()
         WHERE [EntityID] = 'A820FA5A-520E-4058-92D8-33C5AEC0FEC5';

/* Index for Foreign Keys for Event */
-----------------------------------------------------------------
-- SQL Code Generation
-- Entity: MoreCheese: Events
-- Item: Index for Foreign Keys
--
-- This was generated by the MemberJunction CodeGen tool.
-- This file should NOT be edited by hand.
-----------------------------------------------------------------;

/* Base View SQL for MoreCheese: Events */
-----------------------------------------------------------------
-- SQL Code Generation
-- Entity: MoreCheese: Events
-- Item: vwEvents
--
-- This was generated by the MemberJunction CodeGen tool.
-- This file should NOT be edited by hand.
-----------------------------------------------------------------

------------------------------------------------------------
----- BASE VIEW FOR ENTITY:      MoreCheese: Events
-----               SCHEMA:      morecheese_events
-----               BASE TABLE:  Event
-----               PRIMARY KEY: ID
------------------------------------------------------------
IF OBJECT_ID('[morecheese_events].[vwEvents]', 'V') IS NOT NULL
    DROP VIEW [morecheese_events].[vwEvents];
GO

CREATE VIEW [morecheese_events].[vwEvents]
AS
SELECT
    e.*,    [e].[Latitude] AS [${mjSchema}_Latitude],
    [e].[Longitude] AS [${mjSchema}_Longitude]
FROM
    [morecheese_events].[Event] AS e
GO
GRANT SELECT ON [morecheese_events].[vwEvents] TO [cdp_UI], [cdp_Developer], [cdp_Integration];

/* Base View Permissions SQL for MoreCheese: Events */
-----------------------------------------------------------------
-- SQL Code Generation
-- Entity: MoreCheese: Events
-- Item: Permissions for vwEvents
--
-- This was generated by the MemberJunction CodeGen tool.
-- This file should NOT be edited by hand.
-----------------------------------------------------------------

GRANT SELECT ON [morecheese_events].[vwEvents] TO [cdp_UI], [cdp_Developer], [cdp_Integration];

/* spCreate SQL for MoreCheese: Events */
-----------------------------------------------------------------
-- SQL Code Generation
-- Entity: MoreCheese: Events
-- Item: spCreateEvent
--
-- This was generated by the MemberJunction CodeGen tool.
-- This file should NOT be edited by hand.
-----------------------------------------------------------------

------------------------------------------------------------
----- CREATE PROCEDURE FOR Event
------------------------------------------------------------
IF OBJECT_ID('[morecheese_events].[spCreateEvent]', 'P') IS NOT NULL
    DROP PROCEDURE [morecheese_events].[spCreateEvent];
GO

CREATE PROCEDURE [morecheese_events].[spCreateEvent]
    @ID uniqueidentifier = NULL,
    @EventKey nvarchar(50),
    @Name nvarchar(200),
    @EventType nvarchar(50),
    @EventDate date,
    @IsVirtual bit = NULL,
    @IsPaid bit = NULL,
    @City_Clear bit = 0,
    @City nvarchar(100) = NULL,
    @State_Clear bit = 0,
    @State nvarchar(50) = NULL,
    @Latitude_Clear bit = 0,
    @Latitude decimal(9, 6) = NULL,
    @Longitude_Clear bit = 0,
    @Longitude decimal(9, 6) = NULL,
    @IsSharedDemo bit = NULL
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @InsertedRow TABLE ([ID] UNIQUEIDENTIFIER)

    IF @ID IS NOT NULL
    BEGIN
        -- User provided a value, use it
        INSERT INTO [morecheese_events].[Event]
            (
                [ID],
                [EventKey],
                [Name],
                [EventType],
                [EventDate],
                [IsVirtual],
                [IsPaid],
                [City],
                [State],
                [Latitude],
                [Longitude],
                [IsSharedDemo]
            )
        OUTPUT INSERTED.[ID] INTO @InsertedRow
        VALUES
            (
                @ID,
                @EventKey,
                @Name,
                @EventType,
                @EventDate,
                ISNULL(@IsVirtual, 0),
                ISNULL(@IsPaid, 0),
                CASE WHEN @City_Clear = 1 THEN NULL ELSE ISNULL(@City, NULL) END,
                CASE WHEN @State_Clear = 1 THEN NULL ELSE ISNULL(@State, NULL) END,
                CASE WHEN @Latitude_Clear = 1 THEN NULL ELSE ISNULL(@Latitude, NULL) END,
                CASE WHEN @Longitude_Clear = 1 THEN NULL ELSE ISNULL(@Longitude, NULL) END,
                ISNULL(@IsSharedDemo, 1)
            )
    END
    ELSE
    BEGIN
        -- No value provided, let database use its default (e.g., NEWSEQUENTIALID())
        INSERT INTO [morecheese_events].[Event]
            (
                [EventKey],
                [Name],
                [EventType],
                [EventDate],
                [IsVirtual],
                [IsPaid],
                [City],
                [State],
                [Latitude],
                [Longitude],
                [IsSharedDemo]
            )
        OUTPUT INSERTED.[ID] INTO @InsertedRow
        VALUES
            (
                @EventKey,
                @Name,
                @EventType,
                @EventDate,
                ISNULL(@IsVirtual, 0),
                ISNULL(@IsPaid, 0),
                CASE WHEN @City_Clear = 1 THEN NULL ELSE ISNULL(@City, NULL) END,
                CASE WHEN @State_Clear = 1 THEN NULL ELSE ISNULL(@State, NULL) END,
                CASE WHEN @Latitude_Clear = 1 THEN NULL ELSE ISNULL(@Latitude, NULL) END,
                CASE WHEN @Longitude_Clear = 1 THEN NULL ELSE ISNULL(@Longitude, NULL) END,
                ISNULL(@IsSharedDemo, 1)
            )
    END
    -- return the new record from the base view, which might have some calculated fields
    SELECT * FROM [morecheese_events].[vwEvents] WHERE [ID] = (SELECT [ID] FROM @InsertedRow)
END
GO
GRANT EXECUTE ON [morecheese_events].[spCreateEvent] TO [cdp_Developer], [cdp_Integration];

/* spCreate Permissions for MoreCheese: Events */

GRANT EXECUTE ON [morecheese_events].[spCreateEvent] TO [cdp_Developer], [cdp_Integration];

/* spUpdate SQL for MoreCheese: Events */
-----------------------------------------------------------------
-- SQL Code Generation
-- Entity: MoreCheese: Events
-- Item: spUpdateEvent
--
-- This was generated by the MemberJunction CodeGen tool.
-- This file should NOT be edited by hand.
-----------------------------------------------------------------

------------------------------------------------------------
----- UPDATE PROCEDURE FOR Event
------------------------------------------------------------
IF OBJECT_ID('[morecheese_events].[spUpdateEvent]', 'P') IS NOT NULL
    DROP PROCEDURE [morecheese_events].[spUpdateEvent];
GO

CREATE PROCEDURE [morecheese_events].[spUpdateEvent]
    @ID uniqueidentifier,
    @EventKey nvarchar(50) = NULL,
    @Name nvarchar(200) = NULL,
    @EventType nvarchar(50) = NULL,
    @EventDate date = NULL,
    @IsVirtual bit = NULL,
    @IsPaid bit = NULL,
    @City_Clear bit = 0,
    @City nvarchar(100) = NULL,
    @State_Clear bit = 0,
    @State nvarchar(50) = NULL,
    @Latitude_Clear bit = 0,
    @Latitude decimal(9, 6) = NULL,
    @Longitude_Clear bit = 0,
    @Longitude decimal(9, 6) = NULL,
    @IsSharedDemo bit = NULL
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE
        [morecheese_events].[Event]
    SET
        [EventKey] = ISNULL(@EventKey, [EventKey]),
        [Name] = ISNULL(@Name, [Name]),
        [EventType] = ISNULL(@EventType, [EventType]),
        [EventDate] = ISNULL(@EventDate, [EventDate]),
        [IsVirtual] = ISNULL(@IsVirtual, [IsVirtual]),
        [IsPaid] = ISNULL(@IsPaid, [IsPaid]),
        [City] = CASE WHEN @City_Clear = 1 THEN NULL ELSE ISNULL(@City, [City]) END,
        [State] = CASE WHEN @State_Clear = 1 THEN NULL ELSE ISNULL(@State, [State]) END,
        [Latitude] = CASE WHEN @Latitude_Clear = 1 THEN NULL ELSE ISNULL(@Latitude, [Latitude]) END,
        [Longitude] = CASE WHEN @Longitude_Clear = 1 THEN NULL ELSE ISNULL(@Longitude, [Longitude]) END,
        [IsSharedDemo] = ISNULL(@IsSharedDemo, [IsSharedDemo])
    WHERE
        [ID] = @ID

    -- Check if the update was successful
    IF @@ROWCOUNT = 0
        -- Nothing was updated, return no rows, but column structure from base view intact, semantically correct this way.
        SELECT TOP 0 * FROM [morecheese_events].[vwEvents] WHERE 1=0
    ELSE
        -- Return the updated record so the caller can see the updated values and any calculated fields
        SELECT
                                        *
                                    FROM
                                        [morecheese_events].[vwEvents]
                                    WHERE
                                        [ID] = @ID
                                    
END
GO

GRANT EXECUTE ON [morecheese_events].[spUpdateEvent] TO [cdp_Developer], [cdp_Integration]
GO

------------------------------------------------------------
----- TRIGGER FOR __mj_UpdatedAt field for the Event table
------------------------------------------------------------
IF OBJECT_ID('[morecheese_events].[trgUpdateEvent]', 'TR') IS NOT NULL
    DROP TRIGGER [morecheese_events].[trgUpdateEvent];
GO
CREATE TRIGGER [morecheese_events].trgUpdateEvent
ON [morecheese_events].[Event]
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE
        [morecheese_events].[Event]
    SET
        __mj_UpdatedAt = GETUTCDATE()
    FROM
        [morecheese_events].[Event] AS _organicTable
    INNER JOIN
        INSERTED AS I ON
        _organicTable.[ID] = I.[ID];
END;
GO

/* spUpdate Permissions for MoreCheese: Events */

GRANT EXECUTE ON [morecheese_events].[spUpdateEvent] TO [cdp_Developer], [cdp_Integration];

/* spDelete SQL for MoreCheese: Events */
-----------------------------------------------------------------
-- SQL Code Generation
-- Entity: MoreCheese: Events
-- Item: spDeleteEvent
--
-- This was generated by the MemberJunction CodeGen tool.
-- This file should NOT be edited by hand.
-----------------------------------------------------------------

------------------------------------------------------------
----- DELETE PROCEDURE FOR Event
------------------------------------------------------------
IF OBJECT_ID('[morecheese_events].[spDeleteEvent]', 'P') IS NOT NULL
    DROP PROCEDURE [morecheese_events].[spDeleteEvent];
GO

CREATE PROCEDURE [morecheese_events].[spDeleteEvent]
    @ID uniqueidentifier
AS
BEGIN
    SET NOCOUNT ON;

    DELETE FROM
        [morecheese_events].[Event]
    WHERE
        [ID] = @ID


    -- Check if the delete was successful
    IF @@ROWCOUNT = 0
        SELECT NULL AS [ID] -- Return NULL for all primary key fields to indicate no record was deleted
    ELSE
        SELECT @ID AS [ID] -- Return the primary key values to indicate we successfully deleted the record
END
GO
GRANT EXECUTE ON [morecheese_events].[spDeleteEvent] TO [cdp_Developer], [cdp_Integration];

/* spDelete Permissions for MoreCheese: Events */

GRANT EXECUTE ON [morecheese_events].[spDeleteEvent] TO [cdp_Developer], [cdp_Integration];

/* Index for Foreign Keys for MemberProfile */
-----------------------------------------------------------------
-- SQL Code Generation
-- Entity: MoreCheese: Member Profiles
-- Item: Index for Foreign Keys
--
-- This was generated by the MemberJunction CodeGen tool.
-- This file should NOT be edited by hand.
-----------------------------------------------------------------
-- Index for foreign key PersonID in table MemberProfile
IF NOT EXISTS (
    SELECT 1
    FROM sys.indexes
    WHERE name = 'IDX_AUTO_MJ_FKEY_MemberProfile_PersonID' 
    AND object_id = OBJECT_ID('[${flyway:defaultSchema}].[MemberProfile]')
)
CREATE INDEX IDX_AUTO_MJ_FKEY_MemberProfile_PersonID ON [${flyway:defaultSchema}].[MemberProfile] ([PersonID]);

-- Index for foreign key OrganizationID in table MemberProfile
IF NOT EXISTS (
    SELECT 1
    FROM sys.indexes
    WHERE name = 'IDX_AUTO_MJ_FKEY_MemberProfile_OrganizationID' 
    AND object_id = OBJECT_ID('[${flyway:defaultSchema}].[MemberProfile]')
)
CREATE INDEX IDX_AUTO_MJ_FKEY_MemberProfile_OrganizationID ON [${flyway:defaultSchema}].[MemberProfile] ([OrganizationID]);

/* Base View SQL for MoreCheese: Member Profiles */
-----------------------------------------------------------------
-- SQL Code Generation
-- Entity: MoreCheese: Member Profiles
-- Item: vwMemberProfiles
--
-- This was generated by the MemberJunction CodeGen tool.
-- This file should NOT be edited by hand.
-----------------------------------------------------------------

------------------------------------------------------------
----- BASE VIEW FOR ENTITY:      MoreCheese: Member Profiles
-----               SCHEMA:      ${flyway:defaultSchema}
-----               BASE TABLE:  MemberProfile
-----               PRIMARY KEY: ID
------------------------------------------------------------
IF OBJECT_ID('[${flyway:defaultSchema}].[vwMemberProfiles]', 'V') IS NOT NULL
    DROP VIEW [${flyway:defaultSchema}].[vwMemberProfiles];
GO

CREATE VIEW [${flyway:defaultSchema}].[vwMemberProfiles]
AS
SELECT
    m.*,
    mjBizAppsCommonPerson_PersonID.[DisplayName] AS [Person],
    mjBizAppsCommonOrganization_OrganizationID.[Name] AS [Organization],
    [m].[Latitude] AS [${mjSchema}_Latitude],
    [m].[Longitude] AS [${mjSchema}_Longitude]
FROM
    [${flyway:defaultSchema}].[MemberProfile] AS m
INNER JOIN
    [${mjSchema}_BizAppsCommon].[Person] AS mjBizAppsCommonPerson_PersonID
  ON
    [m].[PersonID] = mjBizAppsCommonPerson_PersonID.[ID]
LEFT OUTER JOIN
    [${mjSchema}_BizAppsCommon].[Organization] AS mjBizAppsCommonOrganization_OrganizationID
  ON
    [m].[OrganizationID] = mjBizAppsCommonOrganization_OrganizationID.[ID]
GO
GRANT SELECT ON [${flyway:defaultSchema}].[vwMemberProfiles] TO [cdp_UI], [cdp_Developer], [cdp_Integration];

/* Base View Permissions SQL for MoreCheese: Member Profiles */
-----------------------------------------------------------------
-- SQL Code Generation
-- Entity: MoreCheese: Member Profiles
-- Item: Permissions for vwMemberProfiles
--
-- This was generated by the MemberJunction CodeGen tool.
-- This file should NOT be edited by hand.
-----------------------------------------------------------------

GRANT SELECT ON [${flyway:defaultSchema}].[vwMemberProfiles] TO [cdp_UI], [cdp_Developer], [cdp_Integration];

/* spCreate SQL for MoreCheese: Member Profiles */
-----------------------------------------------------------------
-- SQL Code Generation
-- Entity: MoreCheese: Member Profiles
-- Item: spCreateMemberProfile
--
-- This was generated by the MemberJunction CodeGen tool.
-- This file should NOT be edited by hand.
-----------------------------------------------------------------

------------------------------------------------------------
----- CREATE PROCEDURE FOR MemberProfile
------------------------------------------------------------
IF OBJECT_ID('[${flyway:defaultSchema}].[spCreateMemberProfile]', 'P') IS NOT NULL
    DROP PROCEDURE [${flyway:defaultSchema}].[spCreateMemberProfile];
GO

CREATE PROCEDURE [${flyway:defaultSchema}].[spCreateMemberProfile]
    @ID uniqueidentifier = NULL,
    @PersonID uniqueidentifier,
    @OrganizationID_Clear bit = 0,
    @OrganizationID uniqueidentifier = NULL,
    @MemberNumber nvarchar(50),
    @Segment nvarchar(50),
    @Region nvarchar(50),
    @Country_Clear bit = 0,
    @Country nvarchar(2) = NULL,
    @CountryName_Clear bit = 0,
    @CountryName nvarchar(100) = NULL,
    @City nvarchar(100),
    @State nvarchar(50),
    @AddressLine1_Clear bit = 0,
    @AddressLine1 nvarchar(200) = NULL,
    @AddressLine2_Clear bit = 0,
    @AddressLine2 nvarchar(200) = NULL,
    @PostalCode_Clear bit = 0,
    @PostalCode nvarchar(20) = NULL,
    @Latitude decimal(9, 6),
    @Longitude decimal(9, 6),
    @JoinDate date,
    @RaceEthnicity_Clear bit = 0,
    @RaceEthnicity nvarchar(200) = NULL,
    @EthnicityHispanic_Clear bit = 0,
    @EthnicityHispanic nvarchar(30) = NULL,
    @PronounSet_Clear bit = 0,
    @PronounSet nvarchar(50) = NULL,
    @PrimaryLanguage_Clear bit = 0,
    @PrimaryLanguage nvarchar(50) = NULL,
    @IsSharedDemo bit = NULL
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @InsertedRow TABLE ([ID] UNIQUEIDENTIFIER)

    IF @ID IS NOT NULL
    BEGIN
        -- User provided a value, use it
        INSERT INTO [${flyway:defaultSchema}].[MemberProfile]
            (
                [ID],
                [PersonID],
                [OrganizationID],
                [MemberNumber],
                [Segment],
                [Region],
                [Country],
                [CountryName],
                [City],
                [State],
                [AddressLine1],
                [AddressLine2],
                [PostalCode],
                [Latitude],
                [Longitude],
                [JoinDate],
                [RaceEthnicity],
                [EthnicityHispanic],
                [PronounSet],
                [PrimaryLanguage],
                [IsSharedDemo]
            )
        OUTPUT INSERTED.[ID] INTO @InsertedRow
        VALUES
            (
                @ID,
                @PersonID,
                CASE WHEN @OrganizationID_Clear = 1 THEN NULL ELSE ISNULL(@OrganizationID, NULL) END,
                @MemberNumber,
                @Segment,
                @Region,
                CASE WHEN @Country_Clear = 1 THEN NULL ELSE ISNULL(@Country, NULL) END,
                CASE WHEN @CountryName_Clear = 1 THEN NULL ELSE ISNULL(@CountryName, NULL) END,
                @City,
                @State,
                CASE WHEN @AddressLine1_Clear = 1 THEN NULL ELSE ISNULL(@AddressLine1, NULL) END,
                CASE WHEN @AddressLine2_Clear = 1 THEN NULL ELSE ISNULL(@AddressLine2, NULL) END,
                CASE WHEN @PostalCode_Clear = 1 THEN NULL ELSE ISNULL(@PostalCode, NULL) END,
                @Latitude,
                @Longitude,
                @JoinDate,
                CASE WHEN @RaceEthnicity_Clear = 1 THEN NULL ELSE ISNULL(@RaceEthnicity, NULL) END,
                CASE WHEN @EthnicityHispanic_Clear = 1 THEN NULL ELSE ISNULL(@EthnicityHispanic, NULL) END,
                CASE WHEN @PronounSet_Clear = 1 THEN NULL ELSE ISNULL(@PronounSet, NULL) END,
                CASE WHEN @PrimaryLanguage_Clear = 1 THEN NULL ELSE ISNULL(@PrimaryLanguage, NULL) END,
                ISNULL(@IsSharedDemo, 1)
            )
    END
    ELSE
    BEGIN
        -- No value provided, let database use its default (e.g., NEWSEQUENTIALID())
        INSERT INTO [${flyway:defaultSchema}].[MemberProfile]
            (
                [PersonID],
                [OrganizationID],
                [MemberNumber],
                [Segment],
                [Region],
                [Country],
                [CountryName],
                [City],
                [State],
                [AddressLine1],
                [AddressLine2],
                [PostalCode],
                [Latitude],
                [Longitude],
                [JoinDate],
                [RaceEthnicity],
                [EthnicityHispanic],
                [PronounSet],
                [PrimaryLanguage],
                [IsSharedDemo]
            )
        OUTPUT INSERTED.[ID] INTO @InsertedRow
        VALUES
            (
                @PersonID,
                CASE WHEN @OrganizationID_Clear = 1 THEN NULL ELSE ISNULL(@OrganizationID, NULL) END,
                @MemberNumber,
                @Segment,
                @Region,
                CASE WHEN @Country_Clear = 1 THEN NULL ELSE ISNULL(@Country, NULL) END,
                CASE WHEN @CountryName_Clear = 1 THEN NULL ELSE ISNULL(@CountryName, NULL) END,
                @City,
                @State,
                CASE WHEN @AddressLine1_Clear = 1 THEN NULL ELSE ISNULL(@AddressLine1, NULL) END,
                CASE WHEN @AddressLine2_Clear = 1 THEN NULL ELSE ISNULL(@AddressLine2, NULL) END,
                CASE WHEN @PostalCode_Clear = 1 THEN NULL ELSE ISNULL(@PostalCode, NULL) END,
                @Latitude,
                @Longitude,
                @JoinDate,
                CASE WHEN @RaceEthnicity_Clear = 1 THEN NULL ELSE ISNULL(@RaceEthnicity, NULL) END,
                CASE WHEN @EthnicityHispanic_Clear = 1 THEN NULL ELSE ISNULL(@EthnicityHispanic, NULL) END,
                CASE WHEN @PronounSet_Clear = 1 THEN NULL ELSE ISNULL(@PronounSet, NULL) END,
                CASE WHEN @PrimaryLanguage_Clear = 1 THEN NULL ELSE ISNULL(@PrimaryLanguage, NULL) END,
                ISNULL(@IsSharedDemo, 1)
            )
    END
    -- return the new record from the base view, which might have some calculated fields
    SELECT * FROM [${flyway:defaultSchema}].[vwMemberProfiles] WHERE [ID] = (SELECT [ID] FROM @InsertedRow)
END
GO
GRANT EXECUTE ON [${flyway:defaultSchema}].[spCreateMemberProfile] TO [cdp_Developer], [cdp_Integration];

/* spCreate Permissions for MoreCheese: Member Profiles */

GRANT EXECUTE ON [${flyway:defaultSchema}].[spCreateMemberProfile] TO [cdp_Developer], [cdp_Integration];

/* spUpdate SQL for MoreCheese: Member Profiles */
-----------------------------------------------------------------
-- SQL Code Generation
-- Entity: MoreCheese: Member Profiles
-- Item: spUpdateMemberProfile
--
-- This was generated by the MemberJunction CodeGen tool.
-- This file should NOT be edited by hand.
-----------------------------------------------------------------

------------------------------------------------------------
----- UPDATE PROCEDURE FOR MemberProfile
------------------------------------------------------------
IF OBJECT_ID('[${flyway:defaultSchema}].[spUpdateMemberProfile]', 'P') IS NOT NULL
    DROP PROCEDURE [${flyway:defaultSchema}].[spUpdateMemberProfile];
GO

CREATE PROCEDURE [${flyway:defaultSchema}].[spUpdateMemberProfile]
    @ID uniqueidentifier,
    @PersonID uniqueidentifier = NULL,
    @OrganizationID_Clear bit = 0,
    @OrganizationID uniqueidentifier = NULL,
    @MemberNumber nvarchar(50) = NULL,
    @Segment nvarchar(50) = NULL,
    @Region nvarchar(50) = NULL,
    @Country_Clear bit = 0,
    @Country nvarchar(2) = NULL,
    @CountryName_Clear bit = 0,
    @CountryName nvarchar(100) = NULL,
    @City nvarchar(100) = NULL,
    @State nvarchar(50) = NULL,
    @AddressLine1_Clear bit = 0,
    @AddressLine1 nvarchar(200) = NULL,
    @AddressLine2_Clear bit = 0,
    @AddressLine2 nvarchar(200) = NULL,
    @PostalCode_Clear bit = 0,
    @PostalCode nvarchar(20) = NULL,
    @Latitude decimal(9, 6) = NULL,
    @Longitude decimal(9, 6) = NULL,
    @JoinDate date = NULL,
    @RaceEthnicity_Clear bit = 0,
    @RaceEthnicity nvarchar(200) = NULL,
    @EthnicityHispanic_Clear bit = 0,
    @EthnicityHispanic nvarchar(30) = NULL,
    @PronounSet_Clear bit = 0,
    @PronounSet nvarchar(50) = NULL,
    @PrimaryLanguage_Clear bit = 0,
    @PrimaryLanguage nvarchar(50) = NULL,
    @IsSharedDemo bit = NULL
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE
        [${flyway:defaultSchema}].[MemberProfile]
    SET
        [PersonID] = ISNULL(@PersonID, [PersonID]),
        [OrganizationID] = CASE WHEN @OrganizationID_Clear = 1 THEN NULL ELSE ISNULL(@OrganizationID, [OrganizationID]) END,
        [MemberNumber] = ISNULL(@MemberNumber, [MemberNumber]),
        [Segment] = ISNULL(@Segment, [Segment]),
        [Region] = ISNULL(@Region, [Region]),
        [Country] = CASE WHEN @Country_Clear = 1 THEN NULL ELSE ISNULL(@Country, [Country]) END,
        [CountryName] = CASE WHEN @CountryName_Clear = 1 THEN NULL ELSE ISNULL(@CountryName, [CountryName]) END,
        [City] = ISNULL(@City, [City]),
        [State] = ISNULL(@State, [State]),
        [AddressLine1] = CASE WHEN @AddressLine1_Clear = 1 THEN NULL ELSE ISNULL(@AddressLine1, [AddressLine1]) END,
        [AddressLine2] = CASE WHEN @AddressLine2_Clear = 1 THEN NULL ELSE ISNULL(@AddressLine2, [AddressLine2]) END,
        [PostalCode] = CASE WHEN @PostalCode_Clear = 1 THEN NULL ELSE ISNULL(@PostalCode, [PostalCode]) END,
        [Latitude] = ISNULL(@Latitude, [Latitude]),
        [Longitude] = ISNULL(@Longitude, [Longitude]),
        [JoinDate] = ISNULL(@JoinDate, [JoinDate]),
        [RaceEthnicity] = CASE WHEN @RaceEthnicity_Clear = 1 THEN NULL ELSE ISNULL(@RaceEthnicity, [RaceEthnicity]) END,
        [EthnicityHispanic] = CASE WHEN @EthnicityHispanic_Clear = 1 THEN NULL ELSE ISNULL(@EthnicityHispanic, [EthnicityHispanic]) END,
        [PronounSet] = CASE WHEN @PronounSet_Clear = 1 THEN NULL ELSE ISNULL(@PronounSet, [PronounSet]) END,
        [PrimaryLanguage] = CASE WHEN @PrimaryLanguage_Clear = 1 THEN NULL ELSE ISNULL(@PrimaryLanguage, [PrimaryLanguage]) END,
        [IsSharedDemo] = ISNULL(@IsSharedDemo, [IsSharedDemo])
    WHERE
        [ID] = @ID

    -- Check if the update was successful
    IF @@ROWCOUNT = 0
        -- Nothing was updated, return no rows, but column structure from base view intact, semantically correct this way.
        SELECT TOP 0 * FROM [${flyway:defaultSchema}].[vwMemberProfiles] WHERE 1=0
    ELSE
        -- Return the updated record so the caller can see the updated values and any calculated fields
        SELECT
                                        *
                                    FROM
                                        [${flyway:defaultSchema}].[vwMemberProfiles]
                                    WHERE
                                        [ID] = @ID
                                    
END
GO

GRANT EXECUTE ON [${flyway:defaultSchema}].[spUpdateMemberProfile] TO [cdp_Developer], [cdp_Integration]
GO

------------------------------------------------------------
----- TRIGGER FOR __mj_UpdatedAt field for the MemberProfile table
------------------------------------------------------------
IF OBJECT_ID('[${flyway:defaultSchema}].[trgUpdateMemberProfile]', 'TR') IS NOT NULL
    DROP TRIGGER [${flyway:defaultSchema}].[trgUpdateMemberProfile];
GO
CREATE TRIGGER [${flyway:defaultSchema}].trgUpdateMemberProfile
ON [${flyway:defaultSchema}].[MemberProfile]
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE
        [${flyway:defaultSchema}].[MemberProfile]
    SET
        __mj_UpdatedAt = GETUTCDATE()
    FROM
        [${flyway:defaultSchema}].[MemberProfile] AS _organicTable
    INNER JOIN
        INSERTED AS I ON
        _organicTable.[ID] = I.[ID];
END;
GO

/* spUpdate Permissions for MoreCheese: Member Profiles */

GRANT EXECUTE ON [${flyway:defaultSchema}].[spUpdateMemberProfile] TO [cdp_Developer], [cdp_Integration];

/* spDelete SQL for MoreCheese: Member Profiles */
-----------------------------------------------------------------
-- SQL Code Generation
-- Entity: MoreCheese: Member Profiles
-- Item: spDeleteMemberProfile
--
-- This was generated by the MemberJunction CodeGen tool.
-- This file should NOT be edited by hand.
-----------------------------------------------------------------

------------------------------------------------------------
----- DELETE PROCEDURE FOR MemberProfile
------------------------------------------------------------
IF OBJECT_ID('[${flyway:defaultSchema}].[spDeleteMemberProfile]', 'P') IS NOT NULL
    DROP PROCEDURE [${flyway:defaultSchema}].[spDeleteMemberProfile];
GO

CREATE PROCEDURE [${flyway:defaultSchema}].[spDeleteMemberProfile]
    @ID uniqueidentifier
AS
BEGIN
    SET NOCOUNT ON;

    DELETE FROM
        [${flyway:defaultSchema}].[MemberProfile]
    WHERE
        [ID] = @ID


    -- Check if the delete was successful
    IF @@ROWCOUNT = 0
        SELECT NULL AS [ID] -- Return NULL for all primary key fields to indicate no record was deleted
    ELSE
        SELECT @ID AS [ID] -- Return the primary key values to indicate we successfully deleted the record
END
GO
GRANT EXECUTE ON [${flyway:defaultSchema}].[spDeleteMemberProfile] TO [cdp_Developer], [cdp_Integration];

/* spDelete Permissions for MoreCheese: Member Profiles */

GRANT EXECUTE ON [${flyway:defaultSchema}].[spDeleteMemberProfile] TO [cdp_Developer], [cdp_Integration];

/* Index for Foreign Keys for OrganizationProfile */
-----------------------------------------------------------------
-- SQL Code Generation
-- Entity: MoreCheese: Organization Profiles
-- Item: Index for Foreign Keys
--
-- This was generated by the MemberJunction CodeGen tool.
-- This file should NOT be edited by hand.
-----------------------------------------------------------------
-- Index for foreign key OrganizationID in table OrganizationProfile
IF NOT EXISTS (
    SELECT 1
    FROM sys.indexes
    WHERE name = 'IDX_AUTO_MJ_FKEY_OrganizationProfile_OrganizationID' 
    AND object_id = OBJECT_ID('[${flyway:defaultSchema}].[OrganizationProfile]')
)
CREATE INDEX IDX_AUTO_MJ_FKEY_OrganizationProfile_OrganizationID ON [${flyway:defaultSchema}].[OrganizationProfile] ([OrganizationID]);

/* Base View SQL for MoreCheese: Organization Profiles */
-----------------------------------------------------------------
-- SQL Code Generation
-- Entity: MoreCheese: Organization Profiles
-- Item: vwOrganizationProfiles
--
-- This was generated by the MemberJunction CodeGen tool.
-- This file should NOT be edited by hand.
-----------------------------------------------------------------

------------------------------------------------------------
----- BASE VIEW FOR ENTITY:      MoreCheese: Organization Profiles
-----               SCHEMA:      ${flyway:defaultSchema}
-----               BASE TABLE:  OrganizationProfile
-----               PRIMARY KEY: ID
------------------------------------------------------------
IF OBJECT_ID('[${flyway:defaultSchema}].[vwOrganizationProfiles]', 'V') IS NOT NULL
    DROP VIEW [${flyway:defaultSchema}].[vwOrganizationProfiles];
GO

CREATE VIEW [${flyway:defaultSchema}].[vwOrganizationProfiles]
AS
SELECT
    o.*,
    mjBizAppsCommonOrganization_OrganizationID.[Name] AS [Organization],
    [o].[Latitude] AS [${mjSchema}_Latitude],
    [o].[Longitude] AS [${mjSchema}_Longitude]
FROM
    [${flyway:defaultSchema}].[OrganizationProfile] AS o
INNER JOIN
    [${mjSchema}_BizAppsCommon].[Organization] AS mjBizAppsCommonOrganization_OrganizationID
  ON
    [o].[OrganizationID] = mjBizAppsCommonOrganization_OrganizationID.[ID]
GO
GRANT SELECT ON [${flyway:defaultSchema}].[vwOrganizationProfiles] TO [cdp_UI], [cdp_Developer], [cdp_Integration];

/* Base View Permissions SQL for MoreCheese: Organization Profiles */
-----------------------------------------------------------------
-- SQL Code Generation
-- Entity: MoreCheese: Organization Profiles
-- Item: Permissions for vwOrganizationProfiles
--
-- This was generated by the MemberJunction CodeGen tool.
-- This file should NOT be edited by hand.
-----------------------------------------------------------------

GRANT SELECT ON [${flyway:defaultSchema}].[vwOrganizationProfiles] TO [cdp_UI], [cdp_Developer], [cdp_Integration];

/* spCreate SQL for MoreCheese: Organization Profiles */
-----------------------------------------------------------------
-- SQL Code Generation
-- Entity: MoreCheese: Organization Profiles
-- Item: spCreateOrganizationProfile
--
-- This was generated by the MemberJunction CodeGen tool.
-- This file should NOT be edited by hand.
-----------------------------------------------------------------

------------------------------------------------------------
----- CREATE PROCEDURE FOR OrganizationProfile
------------------------------------------------------------
IF OBJECT_ID('[${flyway:defaultSchema}].[spCreateOrganizationProfile]', 'P') IS NOT NULL
    DROP PROCEDURE [${flyway:defaultSchema}].[spCreateOrganizationProfile];
GO

CREATE PROCEDURE [${flyway:defaultSchema}].[spCreateOrganizationProfile]
    @ID uniqueidentifier = NULL,
    @OrganizationID uniqueidentifier,
    @OrgKey nvarchar(50),
    @Type nvarchar(50),
    @Region nvarchar(50),
    @Country_Clear bit = 0,
    @Country nvarchar(2) = NULL,
    @CountryName_Clear bit = 0,
    @CountryName nvarchar(100) = NULL,
    @City nvarchar(100),
    @State nvarchar(50),
    @AddressLine1_Clear bit = 0,
    @AddressLine1 nvarchar(200) = NULL,
    @PostalCode_Clear bit = 0,
    @PostalCode nvarchar(20) = NULL,
    @Latitude decimal(9, 6),
    @Longitude decimal(9, 6),
    @LifecycleEventKind_Clear bit = 0,
    @LifecycleEventKind nvarchar(50) = NULL,
    @LifecycleEventYear_Clear bit = 0,
    @LifecycleEventYear int = NULL,
    @IsSharedDemo bit = NULL
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @InsertedRow TABLE ([ID] UNIQUEIDENTIFIER)

    IF @ID IS NOT NULL
    BEGIN
        -- User provided a value, use it
        INSERT INTO [${flyway:defaultSchema}].[OrganizationProfile]
            (
                [ID],
                [OrganizationID],
                [OrgKey],
                [Type],
                [Region],
                [Country],
                [CountryName],
                [City],
                [State],
                [AddressLine1],
                [PostalCode],
                [Latitude],
                [Longitude],
                [LifecycleEventKind],
                [LifecycleEventYear],
                [IsSharedDemo]
            )
        OUTPUT INSERTED.[ID] INTO @InsertedRow
        VALUES
            (
                @ID,
                @OrganizationID,
                @OrgKey,
                @Type,
                @Region,
                CASE WHEN @Country_Clear = 1 THEN NULL ELSE ISNULL(@Country, NULL) END,
                CASE WHEN @CountryName_Clear = 1 THEN NULL ELSE ISNULL(@CountryName, NULL) END,
                @City,
                @State,
                CASE WHEN @AddressLine1_Clear = 1 THEN NULL ELSE ISNULL(@AddressLine1, NULL) END,
                CASE WHEN @PostalCode_Clear = 1 THEN NULL ELSE ISNULL(@PostalCode, NULL) END,
                @Latitude,
                @Longitude,
                CASE WHEN @LifecycleEventKind_Clear = 1 THEN NULL ELSE ISNULL(@LifecycleEventKind, NULL) END,
                CASE WHEN @LifecycleEventYear_Clear = 1 THEN NULL ELSE ISNULL(@LifecycleEventYear, NULL) END,
                ISNULL(@IsSharedDemo, 1)
            )
    END
    ELSE
    BEGIN
        -- No value provided, let database use its default (e.g., NEWSEQUENTIALID())
        INSERT INTO [${flyway:defaultSchema}].[OrganizationProfile]
            (
                [OrganizationID],
                [OrgKey],
                [Type],
                [Region],
                [Country],
                [CountryName],
                [City],
                [State],
                [AddressLine1],
                [PostalCode],
                [Latitude],
                [Longitude],
                [LifecycleEventKind],
                [LifecycleEventYear],
                [IsSharedDemo]
            )
        OUTPUT INSERTED.[ID] INTO @InsertedRow
        VALUES
            (
                @OrganizationID,
                @OrgKey,
                @Type,
                @Region,
                CASE WHEN @Country_Clear = 1 THEN NULL ELSE ISNULL(@Country, NULL) END,
                CASE WHEN @CountryName_Clear = 1 THEN NULL ELSE ISNULL(@CountryName, NULL) END,
                @City,
                @State,
                CASE WHEN @AddressLine1_Clear = 1 THEN NULL ELSE ISNULL(@AddressLine1, NULL) END,
                CASE WHEN @PostalCode_Clear = 1 THEN NULL ELSE ISNULL(@PostalCode, NULL) END,
                @Latitude,
                @Longitude,
                CASE WHEN @LifecycleEventKind_Clear = 1 THEN NULL ELSE ISNULL(@LifecycleEventKind, NULL) END,
                CASE WHEN @LifecycleEventYear_Clear = 1 THEN NULL ELSE ISNULL(@LifecycleEventYear, NULL) END,
                ISNULL(@IsSharedDemo, 1)
            )
    END
    -- return the new record from the base view, which might have some calculated fields
    SELECT * FROM [${flyway:defaultSchema}].[vwOrganizationProfiles] WHERE [ID] = (SELECT [ID] FROM @InsertedRow)
END
GO
GRANT EXECUTE ON [${flyway:defaultSchema}].[spCreateOrganizationProfile] TO [cdp_Developer], [cdp_Integration];

/* spCreate Permissions for MoreCheese: Organization Profiles */

GRANT EXECUTE ON [${flyway:defaultSchema}].[spCreateOrganizationProfile] TO [cdp_Developer], [cdp_Integration];

/* spUpdate SQL for MoreCheese: Organization Profiles */
-----------------------------------------------------------------
-- SQL Code Generation
-- Entity: MoreCheese: Organization Profiles
-- Item: spUpdateOrganizationProfile
--
-- This was generated by the MemberJunction CodeGen tool.
-- This file should NOT be edited by hand.
-----------------------------------------------------------------

------------------------------------------------------------
----- UPDATE PROCEDURE FOR OrganizationProfile
------------------------------------------------------------
IF OBJECT_ID('[${flyway:defaultSchema}].[spUpdateOrganizationProfile]', 'P') IS NOT NULL
    DROP PROCEDURE [${flyway:defaultSchema}].[spUpdateOrganizationProfile];
GO

CREATE PROCEDURE [${flyway:defaultSchema}].[spUpdateOrganizationProfile]
    @ID uniqueidentifier,
    @OrganizationID uniqueidentifier = NULL,
    @OrgKey nvarchar(50) = NULL,
    @Type nvarchar(50) = NULL,
    @Region nvarchar(50) = NULL,
    @Country_Clear bit = 0,
    @Country nvarchar(2) = NULL,
    @CountryName_Clear bit = 0,
    @CountryName nvarchar(100) = NULL,
    @City nvarchar(100) = NULL,
    @State nvarchar(50) = NULL,
    @AddressLine1_Clear bit = 0,
    @AddressLine1 nvarchar(200) = NULL,
    @PostalCode_Clear bit = 0,
    @PostalCode nvarchar(20) = NULL,
    @Latitude decimal(9, 6) = NULL,
    @Longitude decimal(9, 6) = NULL,
    @LifecycleEventKind_Clear bit = 0,
    @LifecycleEventKind nvarchar(50) = NULL,
    @LifecycleEventYear_Clear bit = 0,
    @LifecycleEventYear int = NULL,
    @IsSharedDemo bit = NULL
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE
        [${flyway:defaultSchema}].[OrganizationProfile]
    SET
        [OrganizationID] = ISNULL(@OrganizationID, [OrganizationID]),
        [OrgKey] = ISNULL(@OrgKey, [OrgKey]),
        [Type] = ISNULL(@Type, [Type]),
        [Region] = ISNULL(@Region, [Region]),
        [Country] = CASE WHEN @Country_Clear = 1 THEN NULL ELSE ISNULL(@Country, [Country]) END,
        [CountryName] = CASE WHEN @CountryName_Clear = 1 THEN NULL ELSE ISNULL(@CountryName, [CountryName]) END,
        [City] = ISNULL(@City, [City]),
        [State] = ISNULL(@State, [State]),
        [AddressLine1] = CASE WHEN @AddressLine1_Clear = 1 THEN NULL ELSE ISNULL(@AddressLine1, [AddressLine1]) END,
        [PostalCode] = CASE WHEN @PostalCode_Clear = 1 THEN NULL ELSE ISNULL(@PostalCode, [PostalCode]) END,
        [Latitude] = ISNULL(@Latitude, [Latitude]),
        [Longitude] = ISNULL(@Longitude, [Longitude]),
        [LifecycleEventKind] = CASE WHEN @LifecycleEventKind_Clear = 1 THEN NULL ELSE ISNULL(@LifecycleEventKind, [LifecycleEventKind]) END,
        [LifecycleEventYear] = CASE WHEN @LifecycleEventYear_Clear = 1 THEN NULL ELSE ISNULL(@LifecycleEventYear, [LifecycleEventYear]) END,
        [IsSharedDemo] = ISNULL(@IsSharedDemo, [IsSharedDemo])
    WHERE
        [ID] = @ID

    -- Check if the update was successful
    IF @@ROWCOUNT = 0
        -- Nothing was updated, return no rows, but column structure from base view intact, semantically correct this way.
        SELECT TOP 0 * FROM [${flyway:defaultSchema}].[vwOrganizationProfiles] WHERE 1=0
    ELSE
        -- Return the updated record so the caller can see the updated values and any calculated fields
        SELECT
                                        *
                                    FROM
                                        [${flyway:defaultSchema}].[vwOrganizationProfiles]
                                    WHERE
                                        [ID] = @ID
                                    
END
GO

GRANT EXECUTE ON [${flyway:defaultSchema}].[spUpdateOrganizationProfile] TO [cdp_Developer], [cdp_Integration]
GO

------------------------------------------------------------
----- TRIGGER FOR __mj_UpdatedAt field for the OrganizationProfile table
------------------------------------------------------------
IF OBJECT_ID('[${flyway:defaultSchema}].[trgUpdateOrganizationProfile]', 'TR') IS NOT NULL
    DROP TRIGGER [${flyway:defaultSchema}].[trgUpdateOrganizationProfile];
GO
CREATE TRIGGER [${flyway:defaultSchema}].trgUpdateOrganizationProfile
ON [${flyway:defaultSchema}].[OrganizationProfile]
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE
        [${flyway:defaultSchema}].[OrganizationProfile]
    SET
        __mj_UpdatedAt = GETUTCDATE()
    FROM
        [${flyway:defaultSchema}].[OrganizationProfile] AS _organicTable
    INNER JOIN
        INSERTED AS I ON
        _organicTable.[ID] = I.[ID];
END;
GO

/* spUpdate Permissions for MoreCheese: Organization Profiles */

GRANT EXECUTE ON [${flyway:defaultSchema}].[spUpdateOrganizationProfile] TO [cdp_Developer], [cdp_Integration];

/* spDelete SQL for MoreCheese: Organization Profiles */
-----------------------------------------------------------------
-- SQL Code Generation
-- Entity: MoreCheese: Organization Profiles
-- Item: spDeleteOrganizationProfile
--
-- This was generated by the MemberJunction CodeGen tool.
-- This file should NOT be edited by hand.
-----------------------------------------------------------------

------------------------------------------------------------
----- DELETE PROCEDURE FOR OrganizationProfile
------------------------------------------------------------
IF OBJECT_ID('[${flyway:defaultSchema}].[spDeleteOrganizationProfile]', 'P') IS NOT NULL
    DROP PROCEDURE [${flyway:defaultSchema}].[spDeleteOrganizationProfile];
GO

CREATE PROCEDURE [${flyway:defaultSchema}].[spDeleteOrganizationProfile]
    @ID uniqueidentifier
AS
BEGIN
    SET NOCOUNT ON;

    DELETE FROM
        [${flyway:defaultSchema}].[OrganizationProfile]
    WHERE
        [ID] = @ID


    -- Check if the delete was successful
    IF @@ROWCOUNT = 0
        SELECT NULL AS [ID] -- Return NULL for all primary key fields to indicate no record was deleted
    ELSE
        SELECT @ID AS [ID] -- Return the primary key values to indicate we successfully deleted the record
END
GO
GRANT EXECUTE ON [${flyway:defaultSchema}].[spDeleteOrganizationProfile] TO [cdp_Developer], [cdp_Integration];

/* spDelete Permissions for MoreCheese: Organization Profiles */

GRANT EXECUTE ON [${flyway:defaultSchema}].[spDeleteOrganizationProfile] TO [cdp_Developer], [cdp_Integration];

/* SQL text to delete unneeded entity fields (3 scoped entities) */
EXEC [${mjSchema}].[spDeleteUnneededEntityFields] @ExcludedSchemaNames='sys,staging,${mjSchema}', @EntityIDs='DD32D132-F9BB-4FFB-87C2-839FBC1A7B7F,70C724C9-B518-4D81-81B0-BE7F4962B63A,A820FA5A-520E-4058-92D8-33C5AEC0FEC5', @IncludedSchemaNames='${flyway:defaultSchema},morecheese_events,morecheese_learning';

/* SQL text to insert 9 new entity field(s) */
UPDATE [${mjSchema}].[EntityField]
         SET [Sequence] = [Sequence] + 100000
       WHERE [EntityID] = 'A820FA5A-520E-4058-92D8-33C5AEC0FEC5'
         AND [Sequence] < 100000
         AND NOT EXISTS (
             SELECT 1 FROM [${mjSchema}].[EntityField]
              WHERE [EntityID] = 'A820FA5A-520E-4058-92D8-33C5AEC0FEC5'
                AND [Sequence] >= 100000
         );

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '3a19f68d-0978-4fb7-bf2b-08050461b037' OR (EntityID = 'A820FA5A-520E-4058-92D8-33C5AEC0FEC5' AND Name = '${mjSchema}_Latitude')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            '3a19f68d-0978-4fb7-bf2b-08050461b037',
            'A820FA5A-520E-4058-92D8-33C5AEC0FEC5', -- Entity: MoreCheese: Organization Profiles
            20,
            '${mjSchema}_Latitude',
            'Mj Latitude',
            NULL,
            'decimal',
            5,
            9,
            6,
            0,
            NULL,
            0,
            0,
            1,
            0,
            NULL,
            NULL,
            0,
            0,
            0,
            0,
            0,
            0,
            'Search',
            GETUTCDATE(),
            GETUTCDATE()
         )
      END;

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '91958f7b-3e4c-4c6d-937f-2839c3a3f3dc' OR (EntityID = 'A820FA5A-520E-4058-92D8-33C5AEC0FEC5' AND Name = '${mjSchema}_Longitude')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            '91958f7b-3e4c-4c6d-937f-2839c3a3f3dc',
            'A820FA5A-520E-4058-92D8-33C5AEC0FEC5', -- Entity: MoreCheese: Organization Profiles
            21,
            '${mjSchema}_Longitude',
            'Mj Longitude',
            NULL,
            'decimal',
            5,
            9,
            6,
            0,
            NULL,
            0,
            0,
            1,
            0,
            NULL,
            NULL,
            0,
            0,
            0,
            0,
            0,
            0,
            'Search',
            GETUTCDATE(),
            GETUTCDATE()
         )
      END;
UPDATE [${mjSchema}].[EntityField]
         SET [Sequence] = [Sequence] + 100000
       WHERE [EntityID] = 'DD32D132-F9BB-4FFB-87C2-839FBC1A7B7F'
         AND [Sequence] < 100000
         AND NOT EXISTS (
             SELECT 1 FROM [${mjSchema}].[EntityField]
              WHERE [EntityID] = 'DD32D132-F9BB-4FFB-87C2-839FBC1A7B7F'
                AND [Sequence] >= 100000
         );

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '70476593-be3f-4cfe-8eea-b689e33ab69a' OR (EntityID = 'DD32D132-F9BB-4FFB-87C2-839FBC1A7B7F' AND Name = '${mjSchema}_Latitude')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            '70476593-be3f-4cfe-8eea-b689e33ab69a',
            'DD32D132-F9BB-4FFB-87C2-839FBC1A7B7F', -- Entity: MoreCheese: Events
            15,
            '${mjSchema}_Latitude',
            'Mj Latitude',
            NULL,
            'decimal',
            5,
            9,
            6,
            1,
            NULL,
            0,
            0,
            1,
            0,
            NULL,
            NULL,
            0,
            0,
            0,
            0,
            0,
            0,
            'Search',
            GETUTCDATE(),
            GETUTCDATE()
         )
      END;

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '08fab222-a024-4bf5-b0b9-26668d689def' OR (EntityID = 'DD32D132-F9BB-4FFB-87C2-839FBC1A7B7F' AND Name = '${mjSchema}_Longitude')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            '08fab222-a024-4bf5-b0b9-26668d689def',
            'DD32D132-F9BB-4FFB-87C2-839FBC1A7B7F', -- Entity: MoreCheese: Events
            16,
            '${mjSchema}_Longitude',
            'Mj Longitude',
            NULL,
            'decimal',
            5,
            9,
            6,
            1,
            NULL,
            0,
            0,
            1,
            0,
            NULL,
            NULL,
            0,
            0,
            0,
            0,
            0,
            0,
            'Search',
            GETUTCDATE(),
            GETUTCDATE()
         )
      END;
UPDATE [${mjSchema}].[EntityField]
         SET [Sequence] = [Sequence] + 100000
       WHERE [EntityID] = '70C724C9-B518-4D81-81B0-BE7F4962B63A'
         AND [Sequence] < 100000
         AND NOT EXISTS (
             SELECT 1 FROM [${mjSchema}].[EntityField]
              WHERE [EntityID] = '70C724C9-B518-4D81-81B0-BE7F4962B63A'
                AND [Sequence] >= 100000
         );

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = 'bae07da1-15db-488f-a728-3c885d82838d' OR (EntityID = '70C724C9-B518-4D81-81B0-BE7F4962B63A' AND Name = '${mjSchema}_Latitude')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            'bae07da1-15db-488f-a728-3c885d82838d',
            '70C724C9-B518-4D81-81B0-BE7F4962B63A', -- Entity: MoreCheese: Member Profiles
            26,
            '${mjSchema}_Latitude',
            'Mj Latitude',
            NULL,
            'decimal',
            5,
            9,
            6,
            0,
            NULL,
            0,
            0,
            1,
            0,
            NULL,
            NULL,
            0,
            0,
            0,
            0,
            0,
            0,
            'Search',
            GETUTCDATE(),
            GETUTCDATE()
         )
      END;

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '8f8e4fa7-f41b-486a-938f-ba86faab04e8' OR (EntityID = '70C724C9-B518-4D81-81B0-BE7F4962B63A' AND Name = '${mjSchema}_Longitude')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            '8f8e4fa7-f41b-486a-938f-ba86faab04e8',
            '70C724C9-B518-4D81-81B0-BE7F4962B63A', -- Entity: MoreCheese: Member Profiles
            27,
            '${mjSchema}_Longitude',
            'Mj Longitude',
            NULL,
            'decimal',
            5,
            9,
            6,
            0,
            NULL,
            0,
            0,
            1,
            0,
            NULL,
            NULL,
            0,
            0,
            0,
            0,
            0,
            0,
            'Search',
            GETUTCDATE(),
            GETUTCDATE()
         )
      END;

/* SQL text to update existing entity fields from schema (3 scoped entities) */
EXEC [${mjSchema}].[spUpdateExistingEntityFieldsFromSchema] @ExcludedSchemaNames='sys,staging,${mjSchema}', @EntityIDs='DD32D132-F9BB-4FFB-87C2-839FBC1A7B7F,70C724C9-B518-4D81-81B0-BE7F4962B63A,A820FA5A-520E-4058-92D8-33C5AEC0FEC5', @IncludedSchemaNames='${flyway:defaultSchema},morecheese_events,morecheese_learning';

/* SQL text to set default column width where needed */
EXEC [${mjSchema}].[spSetDefaultColumnWidthWhereNeeded] @ExcludedSchemaNames='sys,staging,${mjSchema}', @IncludedSchemaNames='${flyway:defaultSchema},morecheese_events,morecheese_learning';

/* Set ExtendedType=GeoLatitude on virtual geo fields */
UPDATE [${mjSchema}].[EntityField] SET [ExtendedType] = 'GeoLatitude' WHERE [Name] = '${mjSchema}_Latitude' AND [ExtendedType] IS NULL AND [EntityID] IN ('DD32D132-F9BB-4FFB-87C2-839FBC1A7B7F','70C724C9-B518-4D81-81B0-BE7F4962B63A','A820FA5A-520E-4058-92D8-33C5AEC0FEC5');

/* Set ExtendedType=GeoLongitude on virtual geo fields */
UPDATE [${mjSchema}].[EntityField] SET [ExtendedType] = 'GeoLongitude' WHERE [Name] = '${mjSchema}_Longitude' AND [ExtendedType] IS NULL AND [EntityID] IN ('DD32D132-F9BB-4FFB-87C2-839FBC1A7B7F','70C724C9-B518-4D81-81B0-BE7F4962B63A','A820FA5A-520E-4058-92D8-33C5AEC0FEC5');
