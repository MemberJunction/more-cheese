-- =========================================================================
-- MoreCheese Demo — Consolidated Schema Baseline (v1.0.0)
-- =========================================================================
-- Single baseline for the ${flyway:defaultSchema} application schema (home schema:
-- morecheese_members) plus this app's sibling schemas (morecheese_events,
-- morecheese_learning — a deliberate multi-schema app, one schema
-- per composed demo domain, mirroring the D9 pack pyramid).
--
-- Shapes were frozen 2026-07-14 from the datagen generator (datagen/cli/emit-schema.mjs),
-- proven loadable + FK-clean + CodeGen-registrable on a cloned MJ database. From here on
-- MIGRATIONS own these shapes (immutable, additive-only); the generator's schema emitter
-- is a dev-playground shim and a suite drift-guard keeps it matched to this file.
--
-- STRUCTURE (order matters — later sections depend on earlier ones):
--   1. Schema DDL         — schemas, tables, FKs, check constraints, extended properties
--   2. APPLICATION        — the Explorer app record, correctly named up front;
--                           CodeGen attaches every generated entity to it
--   3. CODEGEN section    — spliced in when the app is first published: run `mj codegen`
--                           on a freshly-migrated DB and fold the emitted SQL here
--                           (entity registrations, audit columns, FK indexes, base views,
--                           CRUD procs, permissions). Until then, dev DBs get the same
--                           effect from running codegen directly.
-- Seed/lookup data is NOT here — demo data loads via datagen's emitted packs; any
-- metadata seeds live in metadata/ via `mj sync push` capture.
--
-- CROSS-SCHEMA PREREQUISITES (must be migrated BEFORE this baseline runs — declared as
-- app dependencies in mj-app.json, so install order is guaranteed):
--   __mj_BizAppsCommon  (sibling repo: bizapps-common) — Person, Organization
--
-- NOTE: Commercial entities are delivered via @mj-biz-apps/orders
-- Marcelo memo §2.4). When their Subscription/Order model ships, a follow-up V* migration
-- handles the decomposition — this baseline is not edited.
-- No __mj_* audit columns and no FK indexes here — CodeGen owns those.
-- =========================================================================

-- =========================================================================
-- 1. SCHEMA DDL
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
-- Product / Order / OrderLine / Payment: the money chain, shaped to
-- bizapps-orders' published design (order-per-cycle, the posted Order IS
-- the bill, no invoices). SANCTIONED STAND-IN until bizapps-orders ships.
---------------------------------------------------------------------------




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
-- 2. APPLICATION — created here, correctly named, BEFORE codegen ever runs.
--
-- CodeGen only auto-creates a schema-named app when NO Application row has
-- SchemaAutoAddNewEntities covering the schema; because this app claims all
-- four morecheese schemas, CodeGen attaches every generated entity to it —
-- no rename, no entity-copy, no ordering trap (the BizApps convention).
-- Hardcoded UUID: uuidv5 of 'mjapplication:more-cheese-demo' in the
-- MoreCheese namespace — minted once, frozen forever.
-- =========================================================================
IF NOT EXISTS (SELECT 1 FROM __mj.Application WHERE ID = '3C46B3A5-34FB-51EA-B54D-77E9F104ABAF')
    INSERT INTO __mj.Application (ID, Name, Description, Icon, Color, Path, AutoUpdatePath, SchemaAutoAddNewEntities)
    VALUES (
        '3C46B3A5-34FB-51EA-B54D-77E9F104ABAF',
        'MoreCheese',
        'MoreCheese demo association — membership, events, learning, and money over the composed BizApps',
        'fa-solid fa-cheese',
        '#F2A900',
        'morecheese',
        0,
        '${flyway:defaultSchema},morecheese_events,morecheese_learning'
    );
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
-- CONSOLIDATED into baseline (was V202607161500__v1.1.0_Payment_Lifecycle_Values.sql)
-- ==================================================================

-- ============================================================
-- MoreCheese: payment lifecycle status values (v1.1.0)
-- The enrichment batch (2026-07-16) adds Failed/Denied attempt rows and
-- in-flight (InProgress) settlements to the payment stream — a deliberate
-- causal-vs-noise mix (low-affluence card failures + a pure-noise floor).
-- Value-list change per the MJ migration rules: drop + re-add the CHECK;
-- CodeGen regenerates the TypeScript union on next run.
-- ============================================================


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

GO
-- ==================================================================
-- APPENDED: MJ CodeGen output (regenerated on a clean DB, 2026-07-23).
-- Entity metadata + views + CRUD procs + permissions. Do not hand-edit;
-- re-run codegen and replace this section.
-- ==================================================================

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
         '49df9400-9c38-422c-8db6-1373d5392e35',
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

/* SQL generated to add new entity MoreCheese: Certifications to application ID: '3C46B3A5-34FB-51EA-B54D-77E9F104ABAF' */
INSERT INTO [${mjSchema}].[ApplicationEntity]
                                       ([ApplicationID], [EntityID], [Sequence], [__mj_CreatedAt], [__mj_UpdatedAt]) VALUES
                                       ('3C46B3A5-34FB-51EA-B54D-77E9F104ABAF', '49df9400-9c38-422c-8db6-1373d5392e35', (SELECT COALESCE(MAX([Sequence]),0)+1 FROM [${mjSchema}].[ApplicationEntity] WHERE [ApplicationID] = '3C46B3A5-34FB-51EA-B54D-77E9F104ABAF'), GETUTCDATE(), GETUTCDATE());

/* SQL generated to add new permission for entity MoreCheese: Certifications for role UI */
INSERT INTO [${mjSchema}].[EntityPermission]
                                                   ([EntityID], [RoleID], [CanRead], [CanCreate], [CanUpdate], [CanDelete], [__mj_CreatedAt], [__mj_UpdatedAt]) VALUES
                                                   ('49df9400-9c38-422c-8db6-1373d5392e35', 'E0AFCCEC-6A37-EF11-86D4-000D3A4E707E', 1, 0, 0, 0, GETUTCDATE(), GETUTCDATE());

/* SQL generated to add new permission for entity MoreCheese: Certifications for role Developer */
INSERT INTO [${mjSchema}].[EntityPermission]
                                                   ([EntityID], [RoleID], [CanRead], [CanCreate], [CanUpdate], [CanDelete], [__mj_CreatedAt], [__mj_UpdatedAt]) VALUES
                                                   ('49df9400-9c38-422c-8db6-1373d5392e35', 'DEAFCCEC-6A37-EF11-86D4-000D3A4E707E', 1, 1, 1, 1, GETUTCDATE(), GETUTCDATE());

/* SQL generated to add new permission for entity MoreCheese: Certifications for role Integration */
INSERT INTO [${mjSchema}].[EntityPermission]
                                                   ([EntityID], [RoleID], [CanRead], [CanCreate], [CanUpdate], [CanDelete], [__mj_CreatedAt], [__mj_UpdatedAt]) VALUES
                                                   ('49df9400-9c38-422c-8db6-1373d5392e35', 'DFAFCCEC-6A37-EF11-86D4-000D3A4E707E', 1, 1, 1, 1, GETUTCDATE(), GETUTCDATE());

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
         '23916a8e-3487-4793-9e18-c209ef097e58',
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

/* SQL generated to add new entity MoreCheese: Member Certifications to application ID: '3C46B3A5-34FB-51EA-B54D-77E9F104ABAF' */
INSERT INTO [${mjSchema}].[ApplicationEntity]
                                       ([ApplicationID], [EntityID], [Sequence], [__mj_CreatedAt], [__mj_UpdatedAt]) VALUES
                                       ('3C46B3A5-34FB-51EA-B54D-77E9F104ABAF', '23916a8e-3487-4793-9e18-c209ef097e58', (SELECT COALESCE(MAX([Sequence]),0)+1 FROM [${mjSchema}].[ApplicationEntity] WHERE [ApplicationID] = '3C46B3A5-34FB-51EA-B54D-77E9F104ABAF'), GETUTCDATE(), GETUTCDATE());

/* SQL generated to add new permission for entity MoreCheese: Member Certifications for role UI */
INSERT INTO [${mjSchema}].[EntityPermission]
                                                   ([EntityID], [RoleID], [CanRead], [CanCreate], [CanUpdate], [CanDelete], [__mj_CreatedAt], [__mj_UpdatedAt]) VALUES
                                                   ('23916a8e-3487-4793-9e18-c209ef097e58', 'E0AFCCEC-6A37-EF11-86D4-000D3A4E707E', 1, 0, 0, 0, GETUTCDATE(), GETUTCDATE());

/* SQL generated to add new permission for entity MoreCheese: Member Certifications for role Developer */
INSERT INTO [${mjSchema}].[EntityPermission]
                                                   ([EntityID], [RoleID], [CanRead], [CanCreate], [CanUpdate], [CanDelete], [__mj_CreatedAt], [__mj_UpdatedAt]) VALUES
                                                   ('23916a8e-3487-4793-9e18-c209ef097e58', 'DEAFCCEC-6A37-EF11-86D4-000D3A4E707E', 1, 1, 1, 1, GETUTCDATE(), GETUTCDATE());

/* SQL generated to add new permission for entity MoreCheese: Member Certifications for role Integration */
INSERT INTO [${mjSchema}].[EntityPermission]
                                                   ([EntityID], [RoleID], [CanRead], [CanCreate], [CanUpdate], [CanDelete], [__mj_CreatedAt], [__mj_UpdatedAt]) VALUES
                                                   ('23916a8e-3487-4793-9e18-c209ef097e58', 'DFAFCCEC-6A37-EF11-86D4-000D3A4E707E', 1, 1, 1, 1, GETUTCDATE(), GETUTCDATE());

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
         '9f493be6-006b-4fc2-986c-d15ab527e65b',
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

/* SQL generated to add new entity MoreCheese: Competition Entries to application ID: '3C46B3A5-34FB-51EA-B54D-77E9F104ABAF' */
INSERT INTO [${mjSchema}].[ApplicationEntity]
                                       ([ApplicationID], [EntityID], [Sequence], [__mj_CreatedAt], [__mj_UpdatedAt]) VALUES
                                       ('3C46B3A5-34FB-51EA-B54D-77E9F104ABAF', '9f493be6-006b-4fc2-986c-d15ab527e65b', (SELECT COALESCE(MAX([Sequence]),0)+1 FROM [${mjSchema}].[ApplicationEntity] WHERE [ApplicationID] = '3C46B3A5-34FB-51EA-B54D-77E9F104ABAF'), GETUTCDATE(), GETUTCDATE());

/* SQL generated to add new permission for entity MoreCheese: Competition Entries for role UI */
INSERT INTO [${mjSchema}].[EntityPermission]
                                                   ([EntityID], [RoleID], [CanRead], [CanCreate], [CanUpdate], [CanDelete], [__mj_CreatedAt], [__mj_UpdatedAt]) VALUES
                                                   ('9f493be6-006b-4fc2-986c-d15ab527e65b', 'E0AFCCEC-6A37-EF11-86D4-000D3A4E707E', 1, 0, 0, 0, GETUTCDATE(), GETUTCDATE());

/* SQL generated to add new permission for entity MoreCheese: Competition Entries for role Developer */
INSERT INTO [${mjSchema}].[EntityPermission]
                                                   ([EntityID], [RoleID], [CanRead], [CanCreate], [CanUpdate], [CanDelete], [__mj_CreatedAt], [__mj_UpdatedAt]) VALUES
                                                   ('9f493be6-006b-4fc2-986c-d15ab527e65b', 'DEAFCCEC-6A37-EF11-86D4-000D3A4E707E', 1, 1, 1, 1, GETUTCDATE(), GETUTCDATE());

/* SQL generated to add new permission for entity MoreCheese: Competition Entries for role Integration */
INSERT INTO [${mjSchema}].[EntityPermission]
                                                   ([EntityID], [RoleID], [CanRead], [CanCreate], [CanUpdate], [CanDelete], [__mj_CreatedAt], [__mj_UpdatedAt]) VALUES
                                                   ('9f493be6-006b-4fc2-986c-d15ab527e65b', 'DFAFCCEC-6A37-EF11-86D4-000D3A4E707E', 1, 1, 1, 1, GETUTCDATE(), GETUTCDATE());

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
         'f2c9bd57-8734-4afe-b20a-2c8c1c3bb25f',
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

/* SQL generated to add new entity MoreCheese: Advocacy Actions to application ID: '3C46B3A5-34FB-51EA-B54D-77E9F104ABAF' */
INSERT INTO [${mjSchema}].[ApplicationEntity]
                                       ([ApplicationID], [EntityID], [Sequence], [__mj_CreatedAt], [__mj_UpdatedAt]) VALUES
                                       ('3C46B3A5-34FB-51EA-B54D-77E9F104ABAF', 'f2c9bd57-8734-4afe-b20a-2c8c1c3bb25f', (SELECT COALESCE(MAX([Sequence]),0)+1 FROM [${mjSchema}].[ApplicationEntity] WHERE [ApplicationID] = '3C46B3A5-34FB-51EA-B54D-77E9F104ABAF'), GETUTCDATE(), GETUTCDATE());

/* SQL generated to add new permission for entity MoreCheese: Advocacy Actions for role UI */
INSERT INTO [${mjSchema}].[EntityPermission]
                                                   ([EntityID], [RoleID], [CanRead], [CanCreate], [CanUpdate], [CanDelete], [__mj_CreatedAt], [__mj_UpdatedAt]) VALUES
                                                   ('f2c9bd57-8734-4afe-b20a-2c8c1c3bb25f', 'E0AFCCEC-6A37-EF11-86D4-000D3A4E707E', 1, 0, 0, 0, GETUTCDATE(), GETUTCDATE());

/* SQL generated to add new permission for entity MoreCheese: Advocacy Actions for role Developer */
INSERT INTO [${mjSchema}].[EntityPermission]
                                                   ([EntityID], [RoleID], [CanRead], [CanCreate], [CanUpdate], [CanDelete], [__mj_CreatedAt], [__mj_UpdatedAt]) VALUES
                                                   ('f2c9bd57-8734-4afe-b20a-2c8c1c3bb25f', 'DEAFCCEC-6A37-EF11-86D4-000D3A4E707E', 1, 1, 1, 1, GETUTCDATE(), GETUTCDATE());

/* SQL generated to add new permission for entity MoreCheese: Advocacy Actions for role Integration */
INSERT INTO [${mjSchema}].[EntityPermission]
                                                   ([EntityID], [RoleID], [CanRead], [CanCreate], [CanUpdate], [CanDelete], [__mj_CreatedAt], [__mj_UpdatedAt]) VALUES
                                                   ('f2c9bd57-8734-4afe-b20a-2c8c1c3bb25f', 'DFAFCCEC-6A37-EF11-86D4-000D3A4E707E', 1, 1, 1, 1, GETUTCDATE(), GETUTCDATE());

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
         'ff152388-ed04-4f1f-b237-94d502c4aa54',
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

/* SQL generated to add new entity MoreCheese: Data Quality Labels to application ID: '3C46B3A5-34FB-51EA-B54D-77E9F104ABAF' */
INSERT INTO [${mjSchema}].[ApplicationEntity]
                                       ([ApplicationID], [EntityID], [Sequence], [__mj_CreatedAt], [__mj_UpdatedAt]) VALUES
                                       ('3C46B3A5-34FB-51EA-B54D-77E9F104ABAF', 'ff152388-ed04-4f1f-b237-94d502c4aa54', (SELECT COALESCE(MAX([Sequence]),0)+1 FROM [${mjSchema}].[ApplicationEntity] WHERE [ApplicationID] = '3C46B3A5-34FB-51EA-B54D-77E9F104ABAF'), GETUTCDATE(), GETUTCDATE());

/* SQL generated to add new permission for entity MoreCheese: Data Quality Labels for role UI */
INSERT INTO [${mjSchema}].[EntityPermission]
                                                   ([EntityID], [RoleID], [CanRead], [CanCreate], [CanUpdate], [CanDelete], [__mj_CreatedAt], [__mj_UpdatedAt]) VALUES
                                                   ('ff152388-ed04-4f1f-b237-94d502c4aa54', 'E0AFCCEC-6A37-EF11-86D4-000D3A4E707E', 1, 0, 0, 0, GETUTCDATE(), GETUTCDATE());

/* SQL generated to add new permission for entity MoreCheese: Data Quality Labels for role Developer */
INSERT INTO [${mjSchema}].[EntityPermission]
                                                   ([EntityID], [RoleID], [CanRead], [CanCreate], [CanUpdate], [CanDelete], [__mj_CreatedAt], [__mj_UpdatedAt]) VALUES
                                                   ('ff152388-ed04-4f1f-b237-94d502c4aa54', 'DEAFCCEC-6A37-EF11-86D4-000D3A4E707E', 1, 1, 1, 1, GETUTCDATE(), GETUTCDATE());

/* SQL generated to add new permission for entity MoreCheese: Data Quality Labels for role Integration */
INSERT INTO [${mjSchema}].[EntityPermission]
                                                   ([EntityID], [RoleID], [CanRead], [CanCreate], [CanUpdate], [CanDelete], [__mj_CreatedAt], [__mj_UpdatedAt]) VALUES
                                                   ('ff152388-ed04-4f1f-b237-94d502c4aa54', 'DFAFCCEC-6A37-EF11-86D4-000D3A4E707E', 1, 1, 1, 1, GETUTCDATE(), GETUTCDATE());

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
         'a3d95071-b312-40e2-aef3-f90d8ef881ad',
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

/* SQL generated to add new entity MoreCheese: Organization Profiles to application ID: '3C46B3A5-34FB-51EA-B54D-77E9F104ABAF' */
INSERT INTO [${mjSchema}].[ApplicationEntity]
                                       ([ApplicationID], [EntityID], [Sequence], [__mj_CreatedAt], [__mj_UpdatedAt]) VALUES
                                       ('3C46B3A5-34FB-51EA-B54D-77E9F104ABAF', 'a3d95071-b312-40e2-aef3-f90d8ef881ad', (SELECT COALESCE(MAX([Sequence]),0)+1 FROM [${mjSchema}].[ApplicationEntity] WHERE [ApplicationID] = '3C46B3A5-34FB-51EA-B54D-77E9F104ABAF'), GETUTCDATE(), GETUTCDATE());

/* SQL generated to add new permission for entity MoreCheese: Organization Profiles for role UI */
INSERT INTO [${mjSchema}].[EntityPermission]
                                                   ([EntityID], [RoleID], [CanRead], [CanCreate], [CanUpdate], [CanDelete], [__mj_CreatedAt], [__mj_UpdatedAt]) VALUES
                                                   ('a3d95071-b312-40e2-aef3-f90d8ef881ad', 'E0AFCCEC-6A37-EF11-86D4-000D3A4E707E', 1, 0, 0, 0, GETUTCDATE(), GETUTCDATE());

/* SQL generated to add new permission for entity MoreCheese: Organization Profiles for role Developer */
INSERT INTO [${mjSchema}].[EntityPermission]
                                                   ([EntityID], [RoleID], [CanRead], [CanCreate], [CanUpdate], [CanDelete], [__mj_CreatedAt], [__mj_UpdatedAt]) VALUES
                                                   ('a3d95071-b312-40e2-aef3-f90d8ef881ad', 'DEAFCCEC-6A37-EF11-86D4-000D3A4E707E', 1, 1, 1, 1, GETUTCDATE(), GETUTCDATE());

/* SQL generated to add new permission for entity MoreCheese: Organization Profiles for role Integration */
INSERT INTO [${mjSchema}].[EntityPermission]
                                                   ([EntityID], [RoleID], [CanRead], [CanCreate], [CanUpdate], [CanDelete], [__mj_CreatedAt], [__mj_UpdatedAt]) VALUES
                                                   ('a3d95071-b312-40e2-aef3-f90d8ef881ad', 'DFAFCCEC-6A37-EF11-86D4-000D3A4E707E', 1, 1, 1, 1, GETUTCDATE(), GETUTCDATE());

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
         'be4d97e0-48de-4240-a09f-8b39ad4bd043',
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

/* SQL generated to add new entity MoreCheese: Member Profiles to application ID: '3C46B3A5-34FB-51EA-B54D-77E9F104ABAF' */
INSERT INTO [${mjSchema}].[ApplicationEntity]
                                       ([ApplicationID], [EntityID], [Sequence], [__mj_CreatedAt], [__mj_UpdatedAt]) VALUES
                                       ('3C46B3A5-34FB-51EA-B54D-77E9F104ABAF', 'be4d97e0-48de-4240-a09f-8b39ad4bd043', (SELECT COALESCE(MAX([Sequence]),0)+1 FROM [${mjSchema}].[ApplicationEntity] WHERE [ApplicationID] = '3C46B3A5-34FB-51EA-B54D-77E9F104ABAF'), GETUTCDATE(), GETUTCDATE());

/* SQL generated to add new permission for entity MoreCheese: Member Profiles for role UI */
INSERT INTO [${mjSchema}].[EntityPermission]
                                                   ([EntityID], [RoleID], [CanRead], [CanCreate], [CanUpdate], [CanDelete], [__mj_CreatedAt], [__mj_UpdatedAt]) VALUES
                                                   ('be4d97e0-48de-4240-a09f-8b39ad4bd043', 'E0AFCCEC-6A37-EF11-86D4-000D3A4E707E', 1, 0, 0, 0, GETUTCDATE(), GETUTCDATE());

/* SQL generated to add new permission for entity MoreCheese: Member Profiles for role Developer */
INSERT INTO [${mjSchema}].[EntityPermission]
                                                   ([EntityID], [RoleID], [CanRead], [CanCreate], [CanUpdate], [CanDelete], [__mj_CreatedAt], [__mj_UpdatedAt]) VALUES
                                                   ('be4d97e0-48de-4240-a09f-8b39ad4bd043', 'DEAFCCEC-6A37-EF11-86D4-000D3A4E707E', 1, 1, 1, 1, GETUTCDATE(), GETUTCDATE());

/* SQL generated to add new permission for entity MoreCheese: Member Profiles for role Integration */
INSERT INTO [${mjSchema}].[EntityPermission]
                                                   ([EntityID], [RoleID], [CanRead], [CanCreate], [CanUpdate], [CanDelete], [__mj_CreatedAt], [__mj_UpdatedAt]) VALUES
                                                   ('be4d97e0-48de-4240-a09f-8b39ad4bd043', 'DFAFCCEC-6A37-EF11-86D4-000D3A4E707E', 1, 1, 1, 1, GETUTCDATE(), GETUTCDATE());

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
         '16538f9b-e025-460d-9505-bd03a7648ec5',
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

/* SQL generated to add new entity MoreCheese: Membership Periods to application ID: '3C46B3A5-34FB-51EA-B54D-77E9F104ABAF' */
INSERT INTO [${mjSchema}].[ApplicationEntity]
                                       ([ApplicationID], [EntityID], [Sequence], [__mj_CreatedAt], [__mj_UpdatedAt]) VALUES
                                       ('3C46B3A5-34FB-51EA-B54D-77E9F104ABAF', '16538f9b-e025-460d-9505-bd03a7648ec5', (SELECT COALESCE(MAX([Sequence]),0)+1 FROM [${mjSchema}].[ApplicationEntity] WHERE [ApplicationID] = '3C46B3A5-34FB-51EA-B54D-77E9F104ABAF'), GETUTCDATE(), GETUTCDATE());

/* SQL generated to add new permission for entity MoreCheese: Membership Periods for role UI */
INSERT INTO [${mjSchema}].[EntityPermission]
                                                   ([EntityID], [RoleID], [CanRead], [CanCreate], [CanUpdate], [CanDelete], [__mj_CreatedAt], [__mj_UpdatedAt]) VALUES
                                                   ('16538f9b-e025-460d-9505-bd03a7648ec5', 'E0AFCCEC-6A37-EF11-86D4-000D3A4E707E', 1, 0, 0, 0, GETUTCDATE(), GETUTCDATE());

/* SQL generated to add new permission for entity MoreCheese: Membership Periods for role Developer */
INSERT INTO [${mjSchema}].[EntityPermission]
                                                   ([EntityID], [RoleID], [CanRead], [CanCreate], [CanUpdate], [CanDelete], [__mj_CreatedAt], [__mj_UpdatedAt]) VALUES
                                                   ('16538f9b-e025-460d-9505-bd03a7648ec5', 'DEAFCCEC-6A37-EF11-86D4-000D3A4E707E', 1, 1, 1, 1, GETUTCDATE(), GETUTCDATE());

/* SQL generated to add new permission for entity MoreCheese: Membership Periods for role Integration */
INSERT INTO [${mjSchema}].[EntityPermission]
                                                   ([EntityID], [RoleID], [CanRead], [CanCreate], [CanUpdate], [CanDelete], [__mj_CreatedAt], [__mj_UpdatedAt]) VALUES
                                                   ('16538f9b-e025-460d-9505-bd03a7648ec5', 'DFAFCCEC-6A37-EF11-86D4-000D3A4E707E', 1, 1, 1, 1, GETUTCDATE(), GETUTCDATE());

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
         'cb9a5230-39c0-49ee-a5bc-238d3536b39b',
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

/* SQL generated to add new entity MoreCheese: Events to application ID: '3C46B3A5-34FB-51EA-B54D-77E9F104ABAF' */
INSERT INTO [${mjSchema}].[ApplicationEntity]
                                       ([ApplicationID], [EntityID], [Sequence], [__mj_CreatedAt], [__mj_UpdatedAt]) VALUES
                                       ('3C46B3A5-34FB-51EA-B54D-77E9F104ABAF', 'cb9a5230-39c0-49ee-a5bc-238d3536b39b', (SELECT COALESCE(MAX([Sequence]),0)+1 FROM [${mjSchema}].[ApplicationEntity] WHERE [ApplicationID] = '3C46B3A5-34FB-51EA-B54D-77E9F104ABAF'), GETUTCDATE(), GETUTCDATE());

/* SQL generated to add new permission for entity MoreCheese: Events for role UI */
INSERT INTO [${mjSchema}].[EntityPermission]
                                                   ([EntityID], [RoleID], [CanRead], [CanCreate], [CanUpdate], [CanDelete], [__mj_CreatedAt], [__mj_UpdatedAt]) VALUES
                                                   ('cb9a5230-39c0-49ee-a5bc-238d3536b39b', 'E0AFCCEC-6A37-EF11-86D4-000D3A4E707E', 1, 0, 0, 0, GETUTCDATE(), GETUTCDATE());

/* SQL generated to add new permission for entity MoreCheese: Events for role Developer */
INSERT INTO [${mjSchema}].[EntityPermission]
                                                   ([EntityID], [RoleID], [CanRead], [CanCreate], [CanUpdate], [CanDelete], [__mj_CreatedAt], [__mj_UpdatedAt]) VALUES
                                                   ('cb9a5230-39c0-49ee-a5bc-238d3536b39b', 'DEAFCCEC-6A37-EF11-86D4-000D3A4E707E', 1, 1, 1, 1, GETUTCDATE(), GETUTCDATE());

/* SQL generated to add new permission for entity MoreCheese: Events for role Integration */
INSERT INTO [${mjSchema}].[EntityPermission]
                                                   ([EntityID], [RoleID], [CanRead], [CanCreate], [CanUpdate], [CanDelete], [__mj_CreatedAt], [__mj_UpdatedAt]) VALUES
                                                   ('cb9a5230-39c0-49ee-a5bc-238d3536b39b', 'DFAFCCEC-6A37-EF11-86D4-000D3A4E707E', 1, 1, 1, 1, GETUTCDATE(), GETUTCDATE());

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
         'dc863c47-c1fa-4c3f-92d1-df7f8a7bc153',
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

/* SQL generated to add new entity MoreCheese: Event Registrations to application ID: '3C46B3A5-34FB-51EA-B54D-77E9F104ABAF' */
INSERT INTO [${mjSchema}].[ApplicationEntity]
                                       ([ApplicationID], [EntityID], [Sequence], [__mj_CreatedAt], [__mj_UpdatedAt]) VALUES
                                       ('3C46B3A5-34FB-51EA-B54D-77E9F104ABAF', 'dc863c47-c1fa-4c3f-92d1-df7f8a7bc153', (SELECT COALESCE(MAX([Sequence]),0)+1 FROM [${mjSchema}].[ApplicationEntity] WHERE [ApplicationID] = '3C46B3A5-34FB-51EA-B54D-77E9F104ABAF'), GETUTCDATE(), GETUTCDATE());

/* SQL generated to add new permission for entity MoreCheese: Event Registrations for role UI */
INSERT INTO [${mjSchema}].[EntityPermission]
                                                   ([EntityID], [RoleID], [CanRead], [CanCreate], [CanUpdate], [CanDelete], [__mj_CreatedAt], [__mj_UpdatedAt]) VALUES
                                                   ('dc863c47-c1fa-4c3f-92d1-df7f8a7bc153', 'E0AFCCEC-6A37-EF11-86D4-000D3A4E707E', 1, 0, 0, 0, GETUTCDATE(), GETUTCDATE());

/* SQL generated to add new permission for entity MoreCheese: Event Registrations for role Developer */
INSERT INTO [${mjSchema}].[EntityPermission]
                                                   ([EntityID], [RoleID], [CanRead], [CanCreate], [CanUpdate], [CanDelete], [__mj_CreatedAt], [__mj_UpdatedAt]) VALUES
                                                   ('dc863c47-c1fa-4c3f-92d1-df7f8a7bc153', 'DEAFCCEC-6A37-EF11-86D4-000D3A4E707E', 1, 1, 1, 1, GETUTCDATE(), GETUTCDATE());

/* SQL generated to add new permission for entity MoreCheese: Event Registrations for role Integration */
INSERT INTO [${mjSchema}].[EntityPermission]
                                                   ([EntityID], [RoleID], [CanRead], [CanCreate], [CanUpdate], [CanDelete], [__mj_CreatedAt], [__mj_UpdatedAt]) VALUES
                                                   ('dc863c47-c1fa-4c3f-92d1-df7f8a7bc153', 'DFAFCCEC-6A37-EF11-86D4-000D3A4E707E', 1, 1, 1, 1, GETUTCDATE(), GETUTCDATE());

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
         'a3e60af2-d7ca-407e-a1d3-34320e851892',
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

/* SQL generated to add new entity MoreCheese: Courses to application ID: '3C46B3A5-34FB-51EA-B54D-77E9F104ABAF' */
INSERT INTO [${mjSchema}].[ApplicationEntity]
                                       ([ApplicationID], [EntityID], [Sequence], [__mj_CreatedAt], [__mj_UpdatedAt]) VALUES
                                       ('3C46B3A5-34FB-51EA-B54D-77E9F104ABAF', 'a3e60af2-d7ca-407e-a1d3-34320e851892', (SELECT COALESCE(MAX([Sequence]),0)+1 FROM [${mjSchema}].[ApplicationEntity] WHERE [ApplicationID] = '3C46B3A5-34FB-51EA-B54D-77E9F104ABAF'), GETUTCDATE(), GETUTCDATE());

/* SQL generated to add new permission for entity MoreCheese: Courses for role UI */
INSERT INTO [${mjSchema}].[EntityPermission]
                                                   ([EntityID], [RoleID], [CanRead], [CanCreate], [CanUpdate], [CanDelete], [__mj_CreatedAt], [__mj_UpdatedAt]) VALUES
                                                   ('a3e60af2-d7ca-407e-a1d3-34320e851892', 'E0AFCCEC-6A37-EF11-86D4-000D3A4E707E', 1, 0, 0, 0, GETUTCDATE(), GETUTCDATE());

/* SQL generated to add new permission for entity MoreCheese: Courses for role Developer */
INSERT INTO [${mjSchema}].[EntityPermission]
                                                   ([EntityID], [RoleID], [CanRead], [CanCreate], [CanUpdate], [CanDelete], [__mj_CreatedAt], [__mj_UpdatedAt]) VALUES
                                                   ('a3e60af2-d7ca-407e-a1d3-34320e851892', 'DEAFCCEC-6A37-EF11-86D4-000D3A4E707E', 1, 1, 1, 1, GETUTCDATE(), GETUTCDATE());

/* SQL generated to add new permission for entity MoreCheese: Courses for role Integration */
INSERT INTO [${mjSchema}].[EntityPermission]
                                                   ([EntityID], [RoleID], [CanRead], [CanCreate], [CanUpdate], [CanDelete], [__mj_CreatedAt], [__mj_UpdatedAt]) VALUES
                                                   ('a3e60af2-d7ca-407e-a1d3-34320e851892', 'DFAFCCEC-6A37-EF11-86D4-000D3A4E707E', 1, 1, 1, 1, GETUTCDATE(), GETUTCDATE());

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
         '428c670f-ebe3-41e6-86e4-eb5a274960a1',
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

/* SQL generated to add new entity MoreCheese: Course Enrollments to application ID: '3C46B3A5-34FB-51EA-B54D-77E9F104ABAF' */
INSERT INTO [${mjSchema}].[ApplicationEntity]
                                       ([ApplicationID], [EntityID], [Sequence], [__mj_CreatedAt], [__mj_UpdatedAt]) VALUES
                                       ('3C46B3A5-34FB-51EA-B54D-77E9F104ABAF', '428c670f-ebe3-41e6-86e4-eb5a274960a1', (SELECT COALESCE(MAX([Sequence]),0)+1 FROM [${mjSchema}].[ApplicationEntity] WHERE [ApplicationID] = '3C46B3A5-34FB-51EA-B54D-77E9F104ABAF'), GETUTCDATE(), GETUTCDATE());

/* SQL generated to add new permission for entity MoreCheese: Course Enrollments for role UI */
INSERT INTO [${mjSchema}].[EntityPermission]
                                                   ([EntityID], [RoleID], [CanRead], [CanCreate], [CanUpdate], [CanDelete], [__mj_CreatedAt], [__mj_UpdatedAt]) VALUES
                                                   ('428c670f-ebe3-41e6-86e4-eb5a274960a1', 'E0AFCCEC-6A37-EF11-86D4-000D3A4E707E', 1, 0, 0, 0, GETUTCDATE(), GETUTCDATE());

/* SQL generated to add new permission for entity MoreCheese: Course Enrollments for role Developer */
INSERT INTO [${mjSchema}].[EntityPermission]
                                                   ([EntityID], [RoleID], [CanRead], [CanCreate], [CanUpdate], [CanDelete], [__mj_CreatedAt], [__mj_UpdatedAt]) VALUES
                                                   ('428c670f-ebe3-41e6-86e4-eb5a274960a1', 'DEAFCCEC-6A37-EF11-86D4-000D3A4E707E', 1, 1, 1, 1, GETUTCDATE(), GETUTCDATE());

/* SQL generated to add new permission for entity MoreCheese: Course Enrollments for role Integration */
INSERT INTO [${mjSchema}].[EntityPermission]
                                                   ([EntityID], [RoleID], [CanRead], [CanCreate], [CanUpdate], [CanDelete], [__mj_CreatedAt], [__mj_UpdatedAt]) VALUES
                                                   ('428c670f-ebe3-41e6-86e4-eb5a274960a1', 'DFAFCCEC-6A37-EF11-86D4-000D3A4E707E', 1, 1, 1, 1, GETUTCDATE(), GETUTCDATE());









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









/* SQL text to insert 173 new entity field(s) */


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

/* SQL text to update entity field related entity name field map for entity field ID 46D0584D-8063-41C5-9684-CC8371F28E4B */
EXEC [${mjSchema}].[spUpdateEntityFieldRelatedEntityNameFieldMap] @EntityFieldID='46D0584D-8063-41C5-9684-CC8371F28E4B', @RelatedEntityNameFieldMap='Organization';

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

/* SQL text to update entity field related entity name field map for entity field ID CC41734D-83EE-421B-9D1F-B7BBCE05E0DE */
EXEC [${mjSchema}].[spUpdateEntityFieldRelatedEntityNameFieldMap] @EntityFieldID='CC41734D-83EE-421B-9D1F-B7BBCE05E0DE', @RelatedEntityNameFieldMap='Course';

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

/* SQL text to update entity field related entity name field map for entity field ID 79BCDC32-CDA8-49A8-91CC-1C6F3E8D744B */
EXEC [${mjSchema}].[spUpdateEntityFieldRelatedEntityNameFieldMap] @EntityFieldID='79BCDC32-CDA8-49A8-91CC-1C6F3E8D744B', @RelatedEntityNameFieldMap='Person';

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

/* SQL text to update entity field related entity name field map for entity field ID 84BF9B95-CEF9-4AD3-B807-95578FA1FEA1 */
EXEC [${mjSchema}].[spUpdateEntityFieldRelatedEntityNameFieldMap] @EntityFieldID='84BF9B95-CEF9-4AD3-B807-95578FA1FEA1', @RelatedEntityNameFieldMap='Person';

/* Index for Foreign Keys for Event */
-----------------------------------------------------------------
-- SQL Code Generation
-- Entity: MoreCheese: Events
-- Item: Index for Foreign Keys
--
-- This was generated by the MemberJunction CodeGen tool.
-- This file should NOT be edited by hand.
-----------------------------------------------------------------;

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

/* SQL text to update entity field related entity name field map for entity field ID 996B6888-46A9-4088-BD6E-1FD4E85482B4 */
EXEC [${mjSchema}].[spUpdateEntityFieldRelatedEntityNameFieldMap] @EntityFieldID='996B6888-46A9-4088-BD6E-1FD4E85482B4', @RelatedEntityNameFieldMap='Person';

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

/* SQL text to update entity field related entity name field map for entity field ID 7CBEDD07-513A-48BC-949B-A4CA8436387A */
EXEC [${mjSchema}].[spUpdateEntityFieldRelatedEntityNameFieldMap] @EntityFieldID='7CBEDD07-513A-48BC-949B-A4CA8436387A', @RelatedEntityNameFieldMap='Person';

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

/* SQL text to update entity field related entity name field map for entity field ID A10B7340-6A2D-430C-8587-1BF283644D8C */
EXEC [${mjSchema}].[spUpdateEntityFieldRelatedEntityNameFieldMap] @EntityFieldID='A10B7340-6A2D-430C-8587-1BF283644D8C', @RelatedEntityNameFieldMap='Event';

/* SQL text to update entity field related entity name field map for entity field ID 6316A924-E1AD-46F7-9AD9-A3D18EBB085D */
EXEC [${mjSchema}].[spUpdateEntityFieldRelatedEntityNameFieldMap] @EntityFieldID='6316A924-E1AD-46F7-9AD9-A3D18EBB085D', @RelatedEntityNameFieldMap='Certification';

/* SQL text to update entity field related entity name field map for entity field ID 793512A3-601D-430D-8B13-F4EDE4178D8A */
EXEC [${mjSchema}].[spUpdateEntityFieldRelatedEntityNameFieldMap] @EntityFieldID='793512A3-601D-430D-8B13-F4EDE4178D8A', @RelatedEntityNameFieldMap='RelatedPerson';

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

/* SQL text to update entity field related entity name field map for entity field ID F8B9A4AD-BD44-4F5D-9C6F-0B23EEC84C8B */
EXEC [${mjSchema}].[spUpdateEntityFieldRelatedEntityNameFieldMap] @EntityFieldID='F8B9A4AD-BD44-4F5D-9C6F-0B23EEC84C8B', @RelatedEntityNameFieldMap='Organization';

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

/* SQL text to update entity field related entity name field map for entity field ID 9701D6D7-C43F-4370-B049-E10BE8CF707B */
EXEC [${mjSchema}].[spUpdateEntityFieldRelatedEntityNameFieldMap] @EntityFieldID='9701D6D7-C43F-4370-B049-E10BE8CF707B', @RelatedEntityNameFieldMap='RelatedOrganization';

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
    @City nvarchar(100),
    @State nvarchar(50),
    @Latitude decimal(9, 6),
    @Longitude decimal(9, 6),
    @JoinDate date,
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
                [City],
                [State],
                [Latitude],
                [Longitude],
                [JoinDate],
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
                @City,
                @State,
                @Latitude,
                @Longitude,
                @JoinDate,
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
                [City],
                [State],
                [Latitude],
                [Longitude],
                [JoinDate],
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
                @City,
                @State,
                @Latitude,
                @Longitude,
                @JoinDate,
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
    @City nvarchar(100) = NULL,
    @State nvarchar(50) = NULL,
    @Latitude decimal(9, 6) = NULL,
    @Longitude decimal(9, 6) = NULL,
    @JoinDate date = NULL,
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
        [City] = ISNULL(@City, [City]),
        [State] = ISNULL(@State, [State]),
        [Latitude] = ISNULL(@Latitude, [Latitude]),
        [Longitude] = ISNULL(@Longitude, [Longitude]),
        [JoinDate] = ISNULL(@JoinDate, [JoinDate]),
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

/* SQL text to update entity field related entity name field map for entity field ID 524EA3E8-B69D-4648-814C-09521C4051FE */
EXEC [${mjSchema}].[spUpdateEntityFieldRelatedEntityNameFieldMap] @EntityFieldID='524EA3E8-B69D-4648-814C-09521C4051FE', @RelatedEntityNameFieldMap='Person';

/* Index for Foreign Keys for OrderLine */
-----------------------------------------------------------------
-- SQL Code Generation
-- Entity: MoreCheese: Order Lines
-- Item: Index for Foreign Keys
--
-- This was generated by the MemberJunction CodeGen tool.
-- This file should NOT be edited by hand.
-----------------------------------------------------------------





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

/* SQL text to update entity field related entity name field map for entity field ID 1A222081-1065-4574-9E04-E94D98517C15 */
EXEC [${mjSchema}].[spUpdateEntityFieldRelatedEntityNameFieldMap] @EntityFieldID='1A222081-1065-4574-9E04-E94D98517C15', @RelatedEntityNameFieldMap='Organization';

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
    @City nvarchar(100),
    @State nvarchar(50),
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
                [City],
                [State],
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
                @City,
                @State,
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
                [City],
                [State],
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
                @City,
                @State,
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
    @City nvarchar(100) = NULL,
    @State nvarchar(50) = NULL,
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
        [City] = ISNULL(@City, [City]),
        [State] = ISNULL(@State, [State]),
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

/* SQL text to delete unneeded entity fields (12 scoped entities) */
EXEC [${mjSchema}].[spDeleteUnneededEntityFields] @ExcludedSchemaNames='sys,staging,dbo,${mjSchema},${mjSchema}_UDT,sample_app,AssociationDemo,Bookstore,${mjSchema}_BizAppsCommon,${mjSchema}_BizAppsTasks,${mjSchema}_BizAppsCommittees,${mjSchema}_BizAppsForms,${mjSchema}_BizAppsIssues,secure_messaging,${mjSchema}', @EntityIDs='49DF9400-9C38-422C-8DB6-1373D5392E35,23916A8E-3487-4793-9E18-C209EF097E58,9F493BE6-006B-4FC2-986C-D15AB527E65B,F2C9BD57-8734-4AFE-B20A-2C8C1C3BB25F,FF152388-ED04-4F1F-B237-94D502C4AA54,A3D95071-B312-40E2-AEF3-F90D8EF881AD,BE4D97E0-48DE-4240-A09F-8B39AD4BD043,16538F9B-E025-460D-9505-BD03A7648EC5,CB9A5230-39C0-49EE-A5BC-238D3536B39B,DC863C47-C1FA-4C3F-92D1-DF7F8A7BC153,A3E60AF2-D7CA-407E-A1D3-34320E851892,428C670F-EBE3-41E6-86E4-EB5A274960A1';

/* SQL text to insert 13 new entity field(s) */
