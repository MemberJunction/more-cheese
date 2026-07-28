-- =========================================================================
-- MoreCheese Demo — Consolidated Schema Baseline (v1.0.0)
-- =========================================================================
-- Single baseline for the ${flyway:defaultSchema} application schema (home schema:
-- morecheese_members) plus this app's sibling schemas (morecheese_events,
-- morecheese_learning, morecheese_orders — a deliberate multi-schema app, one schema
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
-- NOTE: morecheese_orders is the sanctioned STAND-IN for bizapps-orders (pre-implementation,
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
CREATE SCHEMA morecheese_orders;
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
CREATE TABLE morecheese_orders.Product (
    ID UNIQUEIDENTIFIER NOT NULL DEFAULT NEWSEQUENTIALID(),
    ProductKey NVARCHAR(50) NOT NULL,
    Name NVARCHAR(200) NOT NULL,
    ProductType NVARCHAR(50) NOT NULL,
    UnitPrice DECIMAL(10,2) NOT NULL,
    IsSharedDemo BIT NOT NULL DEFAULT 1,
    CONSTRAINT PK_Product PRIMARY KEY (ID),
    CONSTRAINT UQ_Product_ProductKey UNIQUE (ProductKey),
    CONSTRAINT CK_Product_ProductType CHECK (ProductType IN ('Membership', 'Event', 'Certification', 'Competition', 'Publication', 'Sponsorship', 'JobPosting', 'Merchandise', 'Donation'))
);
GO

CREATE TABLE morecheese_orders.[Order] (
    ID UNIQUEIDENTIFIER NOT NULL DEFAULT NEWSEQUENTIALID(),
    OrderKey NVARCHAR(50) NOT NULL,
    PersonID UNIQUEIDENTIFIER NOT NULL,
    OrderType NVARCHAR(50) NOT NULL DEFAULT 'Sale',
    Status NVARCHAR(50) NOT NULL DEFAULT 'Posted',
    OrderDate DATE NOT NULL,
    DueDate DATE NOT NULL,
    TotalGross DECIMAL(10,2) NOT NULL,
    PaymentStatus NVARCHAR(50) NOT NULL,
    IsSharedDemo BIT NOT NULL DEFAULT 1,
    CONSTRAINT PK_Order PRIMARY KEY (ID),
    CONSTRAINT UQ_Order_OrderKey UNIQUE (OrderKey),
    CONSTRAINT FK_Order_Person FOREIGN KEY (PersonID) REFERENCES __mj_BizAppsCommon.Person(ID),
    CONSTRAINT CK_Order_PaymentStatus CHECK (PaymentStatus IN ('Paid', 'Unpaid', 'Overdue'))
);
GO

CREATE TABLE morecheese_orders.OrderLine (
    ID UNIQUEIDENTIFIER NOT NULL DEFAULT NEWSEQUENTIALID(),
    OrderID UNIQUEIDENTIFIER NOT NULL,
    ProductID UNIQUEIDENTIFIER NOT NULL,
    Quantity INT NOT NULL DEFAULT 1,
    UnitPrice DECIMAL(10,2) NOT NULL,
    LineTotal DECIMAL(10,2) NOT NULL,
    IsSharedDemo BIT NOT NULL DEFAULT 1,
    CONSTRAINT PK_OrderLine PRIMARY KEY (ID),
    CONSTRAINT FK_OrderLine_Order FOREIGN KEY (OrderID) REFERENCES morecheese_orders.[Order](ID),
    CONSTRAINT FK_OrderLine_Product FOREIGN KEY (ProductID) REFERENCES morecheese_orders.Product(ID)
);
GO

CREATE TABLE morecheese_orders.Payment (
    ID UNIQUEIDENTIFIER NOT NULL DEFAULT NEWSEQUENTIALID(),
    OrderID UNIQUEIDENTIFIER NOT NULL,
    Amount DECIMAL(10,2) NOT NULL,
    PaymentDate DATE NOT NULL,
    Method NVARCHAR(50) NOT NULL,
    Status NVARCHAR(50) NOT NULL DEFAULT 'Captured',
    IsSharedDemo BIT NOT NULL DEFAULT 1,
    CONSTRAINT PK_Payment PRIMARY KEY (ID),
    CONSTRAINT FK_Payment_Order FOREIGN KEY (OrderID) REFERENCES morecheese_orders.[Order](ID),
    CONSTRAINT CK_Payment_Method CHECK (Method IN ('CreditCard', 'ACH', 'Check', 'Wire')),
    CONSTRAINT CK_Payment_Status CHECK (Status IN ('Captured', 'Failed', 'Refunded'))
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
EXEC sp_addextendedproperty @name = N'MS_Description', @value = N'Sellable products: membership tiers and event registrations', @level0type = N'SCHEMA', @level0name = N'morecheese_orders', @level1type = N'TABLE', @level1name = N'Product';
GO
EXEC sp_addextendedproperty @name = N'MS_Description', @value = N'One order per billable fact (order-per-cycle; the posted order IS the bill). Stand-in for bizapps-orders', @level0type = N'SCHEMA', @level0name = N'morecheese_orders', @level1type = N'TABLE', @level1name = N'Order';
GO
EXEC sp_addextendedproperty @name = N'MS_Description', @value = N'Product-typed order lines', @level0type = N'SCHEMA', @level0name = N'morecheese_orders', @level1type = N'TABLE', @level1name = N'OrderLine';
GO
EXEC sp_addextendedproperty @name = N'MS_Description', @value = N'Payments against orders, timed by the declared payment profiles (a payment dated after release has not happened yet — orders age instead)', @level0type = N'SCHEMA', @level0name = N'morecheese_orders', @level1type = N'TABLE', @level1name = N'Payment';
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
EXEC sp_addextendedproperty @name = N'MS_Description', @value = N'Business key (e.g. PROD-MEM-INDIVIDUAL); UUIDs derive from it', @level0type = N'SCHEMA', @level0name = N'morecheese_orders', @level1type = N'TABLE', @level1name = N'Product', @level2type = N'COLUMN', @level2name = N'ProductKey';
GO
EXEC sp_addextendedproperty @name = N'MS_Description', @value = N'Product display name', @level0type = N'SCHEMA', @level0name = N'morecheese_orders', @level1type = N'TABLE', @level1name = N'Product', @level2type = N'COLUMN', @level2name = N'Name';
GO
EXEC sp_addextendedproperty @name = N'MS_Description', @value = N'Membership (annual dues per tier) or Event (registration)', @level0type = N'SCHEMA', @level0name = N'morecheese_orders', @level1type = N'TABLE', @level1name = N'Product', @level2type = N'COLUMN', @level2name = N'ProductType';
GO
EXEC sp_addextendedproperty @name = N'MS_Description', @value = N'List price in USD', @level0type = N'SCHEMA', @level0name = N'morecheese_orders', @level1type = N'TABLE', @level1name = N'Product', @level2type = N'COLUMN', @level2name = N'UnitPrice';
GO
EXEC sp_addextendedproperty @name = N'MS_Description', @value = N'Marks generated shared-demo rows; the wipe-and-recreate boundary', @level0type = N'SCHEMA', @level0name = N'morecheese_orders', @level1type = N'TABLE', @level1name = N'Product', @level2type = N'COLUMN', @level2name = N'IsSharedDemo';
GO
EXEC sp_addextendedproperty @name = N'MS_Description', @value = N'Business key (ORD-D-* dues, ORD-R-* open renewal, ORD-E-* event); UUIDs derive from it', @level0type = N'SCHEMA', @level0name = N'morecheese_orders', @level1type = N'TABLE', @level1name = N'Order', @level2type = N'COLUMN', @level2name = N'OrderKey';
GO
EXEC sp_addextendedproperty @name = N'MS_Description', @value = N'Always Sale in the demo slice', @level0type = N'SCHEMA', @level0name = N'morecheese_orders', @level1type = N'TABLE', @level1name = N'Order', @level2type = N'COLUMN', @level2name = N'OrderType';
GO
EXEC sp_addextendedproperty @name = N'MS_Description', @value = N'Always Posted — the posted order IS the bill (no invoices, per bizapps-orders design)', @level0type = N'SCHEMA', @level0name = N'morecheese_orders', @level1type = N'TABLE', @level1name = N'Order', @level2type = N'COLUMN', @level2name = N'Status';
GO
EXEC sp_addextendedproperty @name = N'MS_Description', @value = N'Date the order posted (dues post at period start; event orders at registration)', @level0type = N'SCHEMA', @level0name = N'morecheese_orders', @level1type = N'TABLE', @level1name = N'Order', @level2type = N'COLUMN', @level2name = N'OrderDate';
GO
EXEC sp_addextendedproperty @name = N'MS_Description', @value = N'Payment due date (period start, or +30 days on business-tier net terms)', @level0type = N'SCHEMA', @level0name = N'morecheese_orders', @level1type = N'TABLE', @level1name = N'Order', @level2type = N'COLUMN', @level2name = N'DueDate';
GO
EXEC sp_addextendedproperty @name = N'MS_Description', @value = N'Order total in USD', @level0type = N'SCHEMA', @level0name = N'morecheese_orders', @level1type = N'TABLE', @level1name = N'Order', @level2type = N'COLUMN', @level2name = N'TotalGross';
GO
EXEC sp_addextendedproperty @name = N'MS_Description', @value = N'Paid, Unpaid, or Overdue — a payment dated after release has not happened yet, so orders age (real A/R)', @level0type = N'SCHEMA', @level0name = N'morecheese_orders', @level1type = N'TABLE', @level1name = N'Order', @level2type = N'COLUMN', @level2name = N'PaymentStatus';
GO
EXEC sp_addextendedproperty @name = N'MS_Description', @value = N'Marks generated shared-demo rows; the wipe-and-recreate boundary', @level0type = N'SCHEMA', @level0name = N'morecheese_orders', @level1type = N'TABLE', @level1name = N'Order', @level2type = N'COLUMN', @level2name = N'IsSharedDemo';
GO
EXEC sp_addextendedproperty @name = N'MS_Description', @value = N'Line quantity (1 in the demo slice)', @level0type = N'SCHEMA', @level0name = N'morecheese_orders', @level1type = N'TABLE', @level1name = N'OrderLine', @level2type = N'COLUMN', @level2name = N'Quantity';
GO
EXEC sp_addextendedproperty @name = N'MS_Description', @value = N'Line unit price in USD', @level0type = N'SCHEMA', @level0name = N'morecheese_orders', @level1type = N'TABLE', @level1name = N'OrderLine', @level2type = N'COLUMN', @level2name = N'UnitPrice';
GO
EXEC sp_addextendedproperty @name = N'MS_Description', @value = N'Quantity × UnitPrice, in USD', @level0type = N'SCHEMA', @level0name = N'morecheese_orders', @level1type = N'TABLE', @level1name = N'OrderLine', @level2type = N'COLUMN', @level2name = N'LineTotal';
GO
EXEC sp_addextendedproperty @name = N'MS_Description', @value = N'Marks generated shared-demo rows; the wipe-and-recreate boundary', @level0type = N'SCHEMA', @level0name = N'morecheese_orders', @level1type = N'TABLE', @level1name = N'OrderLine', @level2type = N'COLUMN', @level2name = N'IsSharedDemo';
GO
EXEC sp_addextendedproperty @name = N'MS_Description', @value = N'Payment amount in USD (full payment; no partials in the demo slice)', @level0type = N'SCHEMA', @level0name = N'morecheese_orders', @level1type = N'TABLE', @level1name = N'Payment', @level2type = N'COLUMN', @level2name = N'Amount';
GO
EXEC sp_addextendedproperty @name = N'MS_Description', @value = N'Date the payment landed, per the declared payment-timing profiles', @level0type = N'SCHEMA', @level0name = N'morecheese_orders', @level1type = N'TABLE', @level1name = N'Payment', @level2type = N'COLUMN', @level2name = N'PaymentDate';
GO
EXEC sp_addextendedproperty @name = N'MS_Description', @value = N'CreditCard, ACH, Check, or Wire (business tiers pay on net terms)', @level0type = N'SCHEMA', @level0name = N'morecheese_orders', @level1type = N'TABLE', @level1name = N'Payment', @level2type = N'COLUMN', @level2name = N'Method';
GO
EXEC sp_addextendedproperty @name = N'MS_Description', @value = N'Captured (Failed/Refunded reserved for future stories)', @level0type = N'SCHEMA', @level0name = N'morecheese_orders', @level1type = N'TABLE', @level1name = N'Payment', @level2type = N'COLUMN', @level2name = N'Status';
GO
EXEC sp_addextendedproperty @name = N'MS_Description', @value = N'Marks generated shared-demo rows; the wipe-and-recreate boundary', @level0type = N'SCHEMA', @level0name = N'morecheese_orders', @level1type = N'TABLE', @level1name = N'Payment', @level2type = N'COLUMN', @level2name = N'IsSharedDemo';
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
        '${flyway:defaultSchema},morecheese_events,morecheese_learning,morecheese_orders'
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

ALTER TABLE morecheese_orders.Payment DROP CONSTRAINT CK_Payment_Status;
GO
ALTER TABLE morecheese_orders.Payment ADD CONSTRAINT CK_Payment_Status
    CHECK (Status IN ('Captured', 'InProgress', 'Failed', 'Denied', 'Refunded'));
GO

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

/* SQL generated to create new entity MoreCheese: Orders */

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
         '81b84f0d-7a7a-4897-a8f3-08eb40a09b51',
         'MoreCheese: Orders',
         'Orders',
         'One order per billable fact (order-per-cycle; the posted order IS the bill). Stand-in for bizapps-orders',
         NULL,
         'Order',
         'vwOrders',
         'morecheese_orders',
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

/* SQL generated to add new entity MoreCheese: Orders to application ID: '3C46B3A5-34FB-51EA-B54D-77E9F104ABAF' */
INSERT INTO [${mjSchema}].[ApplicationEntity]
                                       ([ApplicationID], [EntityID], [Sequence], [__mj_CreatedAt], [__mj_UpdatedAt]) VALUES
                                       ('3C46B3A5-34FB-51EA-B54D-77E9F104ABAF', '81b84f0d-7a7a-4897-a8f3-08eb40a09b51', (SELECT COALESCE(MAX([Sequence]),0)+1 FROM [${mjSchema}].[ApplicationEntity] WHERE [ApplicationID] = '3C46B3A5-34FB-51EA-B54D-77E9F104ABAF'), GETUTCDATE(), GETUTCDATE());

/* SQL generated to add new permission for entity MoreCheese: Orders for role UI */
INSERT INTO [${mjSchema}].[EntityPermission]
                                                   ([EntityID], [RoleID], [CanRead], [CanCreate], [CanUpdate], [CanDelete], [__mj_CreatedAt], [__mj_UpdatedAt]) VALUES
                                                   ('81b84f0d-7a7a-4897-a8f3-08eb40a09b51', 'E0AFCCEC-6A37-EF11-86D4-000D3A4E707E', 1, 0, 0, 0, GETUTCDATE(), GETUTCDATE());

/* SQL generated to add new permission for entity MoreCheese: Orders for role Developer */
INSERT INTO [${mjSchema}].[EntityPermission]
                                                   ([EntityID], [RoleID], [CanRead], [CanCreate], [CanUpdate], [CanDelete], [__mj_CreatedAt], [__mj_UpdatedAt]) VALUES
                                                   ('81b84f0d-7a7a-4897-a8f3-08eb40a09b51', 'DEAFCCEC-6A37-EF11-86D4-000D3A4E707E', 1, 1, 1, 1, GETUTCDATE(), GETUTCDATE());

/* SQL generated to add new permission for entity MoreCheese: Orders for role Integration */
INSERT INTO [${mjSchema}].[EntityPermission]
                                                   ([EntityID], [RoleID], [CanRead], [CanCreate], [CanUpdate], [CanDelete], [__mj_CreatedAt], [__mj_UpdatedAt]) VALUES
                                                   ('81b84f0d-7a7a-4897-a8f3-08eb40a09b51', 'DFAFCCEC-6A37-EF11-86D4-000D3A4E707E', 1, 1, 1, 1, GETUTCDATE(), GETUTCDATE());

/* SQL generated to create new entity MoreCheese: Order Lines */

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
         'b5027754-cb75-4789-aa34-f71b815f0933',
         'MoreCheese: Order Lines',
         'Order Lines',
         'Product-typed order lines',
         NULL,
         'OrderLine',
         'vwOrderLines',
         'morecheese_orders',
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

/* SQL generated to add new entity MoreCheese: Order Lines to application ID: '3C46B3A5-34FB-51EA-B54D-77E9F104ABAF' */
INSERT INTO [${mjSchema}].[ApplicationEntity]
                                       ([ApplicationID], [EntityID], [Sequence], [__mj_CreatedAt], [__mj_UpdatedAt]) VALUES
                                       ('3C46B3A5-34FB-51EA-B54D-77E9F104ABAF', 'b5027754-cb75-4789-aa34-f71b815f0933', (SELECT COALESCE(MAX([Sequence]),0)+1 FROM [${mjSchema}].[ApplicationEntity] WHERE [ApplicationID] = '3C46B3A5-34FB-51EA-B54D-77E9F104ABAF'), GETUTCDATE(), GETUTCDATE());

/* SQL generated to add new permission for entity MoreCheese: Order Lines for role UI */
INSERT INTO [${mjSchema}].[EntityPermission]
                                                   ([EntityID], [RoleID], [CanRead], [CanCreate], [CanUpdate], [CanDelete], [__mj_CreatedAt], [__mj_UpdatedAt]) VALUES
                                                   ('b5027754-cb75-4789-aa34-f71b815f0933', 'E0AFCCEC-6A37-EF11-86D4-000D3A4E707E', 1, 0, 0, 0, GETUTCDATE(), GETUTCDATE());

/* SQL generated to add new permission for entity MoreCheese: Order Lines for role Developer */
INSERT INTO [${mjSchema}].[EntityPermission]
                                                   ([EntityID], [RoleID], [CanRead], [CanCreate], [CanUpdate], [CanDelete], [__mj_CreatedAt], [__mj_UpdatedAt]) VALUES
                                                   ('b5027754-cb75-4789-aa34-f71b815f0933', 'DEAFCCEC-6A37-EF11-86D4-000D3A4E707E', 1, 1, 1, 1, GETUTCDATE(), GETUTCDATE());

/* SQL generated to add new permission for entity MoreCheese: Order Lines for role Integration */
INSERT INTO [${mjSchema}].[EntityPermission]
                                                   ([EntityID], [RoleID], [CanRead], [CanCreate], [CanUpdate], [CanDelete], [__mj_CreatedAt], [__mj_UpdatedAt]) VALUES
                                                   ('b5027754-cb75-4789-aa34-f71b815f0933', 'DFAFCCEC-6A37-EF11-86D4-000D3A4E707E', 1, 1, 1, 1, GETUTCDATE(), GETUTCDATE());

/* SQL generated to create new entity MoreCheese: Payments */

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
         'af2f0cf6-f5be-4769-b43a-fe3066defc44',
         'MoreCheese: Payments',
         'Payments',
         'Payments against orders, timed by the declared payment profiles (a payment dated after release has not happened yet — orders age instead)',
         NULL,
         'Payment',
         'vwPayments',
         'morecheese_orders',
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

/* SQL generated to add new entity MoreCheese: Payments to application ID: '3C46B3A5-34FB-51EA-B54D-77E9F104ABAF' */
INSERT INTO [${mjSchema}].[ApplicationEntity]
                                       ([ApplicationID], [EntityID], [Sequence], [__mj_CreatedAt], [__mj_UpdatedAt]) VALUES
                                       ('3C46B3A5-34FB-51EA-B54D-77E9F104ABAF', 'af2f0cf6-f5be-4769-b43a-fe3066defc44', (SELECT COALESCE(MAX([Sequence]),0)+1 FROM [${mjSchema}].[ApplicationEntity] WHERE [ApplicationID] = '3C46B3A5-34FB-51EA-B54D-77E9F104ABAF'), GETUTCDATE(), GETUTCDATE());

/* SQL generated to add new permission for entity MoreCheese: Payments for role UI */
INSERT INTO [${mjSchema}].[EntityPermission]
                                                   ([EntityID], [RoleID], [CanRead], [CanCreate], [CanUpdate], [CanDelete], [__mj_CreatedAt], [__mj_UpdatedAt]) VALUES
                                                   ('af2f0cf6-f5be-4769-b43a-fe3066defc44', 'E0AFCCEC-6A37-EF11-86D4-000D3A4E707E', 1, 0, 0, 0, GETUTCDATE(), GETUTCDATE());

/* SQL generated to add new permission for entity MoreCheese: Payments for role Developer */
INSERT INTO [${mjSchema}].[EntityPermission]
                                                   ([EntityID], [RoleID], [CanRead], [CanCreate], [CanUpdate], [CanDelete], [__mj_CreatedAt], [__mj_UpdatedAt]) VALUES
                                                   ('af2f0cf6-f5be-4769-b43a-fe3066defc44', 'DEAFCCEC-6A37-EF11-86D4-000D3A4E707E', 1, 1, 1, 1, GETUTCDATE(), GETUTCDATE());

/* SQL generated to add new permission for entity MoreCheese: Payments for role Integration */
INSERT INTO [${mjSchema}].[EntityPermission]
                                                   ([EntityID], [RoleID], [CanRead], [CanCreate], [CanUpdate], [CanDelete], [__mj_CreatedAt], [__mj_UpdatedAt]) VALUES
                                                   ('af2f0cf6-f5be-4769-b43a-fe3066defc44', 'DFAFCCEC-6A37-EF11-86D4-000D3A4E707E', 1, 1, 1, 1, GETUTCDATE(), GETUTCDATE());

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

/* SQL generated to create new entity MoreCheese: Products */

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
         'a05cc658-f8d8-476e-8e84-f2022c6dfef9',
         'MoreCheese: Products',
         'Products',
         'Sellable products: membership tiers and event registrations',
         NULL,
         'Product',
         'vwProducts',
         'morecheese_orders',
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

/* SQL generated to add new entity MoreCheese: Products to application ID: '3C46B3A5-34FB-51EA-B54D-77E9F104ABAF' */
INSERT INTO [${mjSchema}].[ApplicationEntity]
                                       ([ApplicationID], [EntityID], [Sequence], [__mj_CreatedAt], [__mj_UpdatedAt]) VALUES
                                       ('3C46B3A5-34FB-51EA-B54D-77E9F104ABAF', 'a05cc658-f8d8-476e-8e84-f2022c6dfef9', (SELECT COALESCE(MAX([Sequence]),0)+1 FROM [${mjSchema}].[ApplicationEntity] WHERE [ApplicationID] = '3C46B3A5-34FB-51EA-B54D-77E9F104ABAF'), GETUTCDATE(), GETUTCDATE());

/* SQL generated to add new permission for entity MoreCheese: Products for role UI */
INSERT INTO [${mjSchema}].[EntityPermission]
                                                   ([EntityID], [RoleID], [CanRead], [CanCreate], [CanUpdate], [CanDelete], [__mj_CreatedAt], [__mj_UpdatedAt]) VALUES
                                                   ('a05cc658-f8d8-476e-8e84-f2022c6dfef9', 'E0AFCCEC-6A37-EF11-86D4-000D3A4E707E', 1, 0, 0, 0, GETUTCDATE(), GETUTCDATE());

/* SQL generated to add new permission for entity MoreCheese: Products for role Developer */
INSERT INTO [${mjSchema}].[EntityPermission]
                                                   ([EntityID], [RoleID], [CanRead], [CanCreate], [CanUpdate], [CanDelete], [__mj_CreatedAt], [__mj_UpdatedAt]) VALUES
                                                   ('a05cc658-f8d8-476e-8e84-f2022c6dfef9', 'DEAFCCEC-6A37-EF11-86D4-000D3A4E707E', 1, 1, 1, 1, GETUTCDATE(), GETUTCDATE());

/* SQL generated to add new permission for entity MoreCheese: Products for role Integration */
INSERT INTO [${mjSchema}].[EntityPermission]
                                                   ([EntityID], [RoleID], [CanRead], [CanCreate], [CanUpdate], [CanDelete], [__mj_CreatedAt], [__mj_UpdatedAt]) VALUES
                                                   ('a05cc658-f8d8-476e-8e84-f2022c6dfef9', 'DFAFCCEC-6A37-EF11-86D4-000D3A4E707E', 1, 1, 1, 1, GETUTCDATE(), GETUTCDATE());

/* SQL text to update existing entities from schema */
EXEC [${mjSchema}].[spUpdateExistingEntitiesFromSchema] @ExcludedSchemaNames='sys,staging,dbo,${mjSchema},${mjSchema}_UDT,sample_app,AssociationDemo,Bookstore,${mjSchema}_BizAppsCommon,${mjSchema}_BizAppsTasks,${mjSchema}_BizAppsCommittees,${mjSchema}_BizAppsForms,${mjSchema}_BizAppsIssues,secure_messaging,${mjSchema}';

/* SQL text to add special date field __mj_CreatedAt to entity morecheese_orders.Order */
ALTER TABLE [morecheese_orders].[Order] ADD [__mj_CreatedAt] DATETIMEOFFSET NULL;
GO

/* SQL text to add special date field __mj_CreatedAt to entity morecheese_orders.Order */
UPDATE [morecheese_orders].[Order] SET [__mj_CreatedAt] = GETUTCDATE() WHERE [__mj_CreatedAt] IS NULL;
GO

/* SQL text to add special date field __mj_CreatedAt to entity morecheese_orders.Order */
ALTER TABLE [morecheese_orders].[Order] ALTER COLUMN [__mj_CreatedAt] DATETIMEOFFSET NOT NULL;
GO

/* SQL text to add special date field __mj_CreatedAt to entity morecheese_orders.Order */
ALTER TABLE [morecheese_orders].[Order] ADD CONSTRAINT [DF_morecheese_orders_Order___mj_CreatedAt] DEFAULT GETUTCDATE() FOR [__mj_CreatedAt];
GO

/* SQL text to add special date field __mj_UpdatedAt to entity morecheese_orders.Order */
ALTER TABLE [morecheese_orders].[Order] ADD [__mj_UpdatedAt] DATETIMEOFFSET NULL;
GO

/* SQL text to add special date field __mj_UpdatedAt to entity morecheese_orders.Order */
UPDATE [morecheese_orders].[Order] SET [__mj_UpdatedAt] = GETUTCDATE() WHERE [__mj_UpdatedAt] IS NULL;
GO

/* SQL text to add special date field __mj_UpdatedAt to entity morecheese_orders.Order */
ALTER TABLE [morecheese_orders].[Order] ALTER COLUMN [__mj_UpdatedAt] DATETIMEOFFSET NOT NULL;
GO

/* SQL text to add special date field __mj_UpdatedAt to entity morecheese_orders.Order */
ALTER TABLE [morecheese_orders].[Order] ADD CONSTRAINT [DF_morecheese_orders_Order___mj_UpdatedAt] DEFAULT GETUTCDATE() FOR [__mj_UpdatedAt];
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

/* SQL text to add special date field __mj_CreatedAt to entity morecheese_orders.Product */
ALTER TABLE [morecheese_orders].[Product] ADD [__mj_CreatedAt] DATETIMEOFFSET NULL;
GO

/* SQL text to add special date field __mj_CreatedAt to entity morecheese_orders.Product */
UPDATE [morecheese_orders].[Product] SET [__mj_CreatedAt] = GETUTCDATE() WHERE [__mj_CreatedAt] IS NULL;
GO

/* SQL text to add special date field __mj_CreatedAt to entity morecheese_orders.Product */
ALTER TABLE [morecheese_orders].[Product] ALTER COLUMN [__mj_CreatedAt] DATETIMEOFFSET NOT NULL;
GO

/* SQL text to add special date field __mj_CreatedAt to entity morecheese_orders.Product */
ALTER TABLE [morecheese_orders].[Product] ADD CONSTRAINT [DF_morecheese_orders_Product___mj_CreatedAt] DEFAULT GETUTCDATE() FOR [__mj_CreatedAt];
GO

/* SQL text to add special date field __mj_UpdatedAt to entity morecheese_orders.Product */
ALTER TABLE [morecheese_orders].[Product] ADD [__mj_UpdatedAt] DATETIMEOFFSET NULL;
GO

/* SQL text to add special date field __mj_UpdatedAt to entity morecheese_orders.Product */
UPDATE [morecheese_orders].[Product] SET [__mj_UpdatedAt] = GETUTCDATE() WHERE [__mj_UpdatedAt] IS NULL;
GO

/* SQL text to add special date field __mj_UpdatedAt to entity morecheese_orders.Product */
ALTER TABLE [morecheese_orders].[Product] ALTER COLUMN [__mj_UpdatedAt] DATETIMEOFFSET NOT NULL;
GO

/* SQL text to add special date field __mj_UpdatedAt to entity morecheese_orders.Product */
ALTER TABLE [morecheese_orders].[Product] ADD CONSTRAINT [DF_morecheese_orders_Product___mj_UpdatedAt] DEFAULT GETUTCDATE() FOR [__mj_UpdatedAt];
GO

/* SQL text to add special date field __mj_CreatedAt to entity morecheese_orders.OrderLine */
ALTER TABLE [morecheese_orders].[OrderLine] ADD [__mj_CreatedAt] DATETIMEOFFSET NULL;
GO

/* SQL text to add special date field __mj_CreatedAt to entity morecheese_orders.OrderLine */
UPDATE [morecheese_orders].[OrderLine] SET [__mj_CreatedAt] = GETUTCDATE() WHERE [__mj_CreatedAt] IS NULL;
GO

/* SQL text to add special date field __mj_CreatedAt to entity morecheese_orders.OrderLine */
ALTER TABLE [morecheese_orders].[OrderLine] ALTER COLUMN [__mj_CreatedAt] DATETIMEOFFSET NOT NULL;
GO

/* SQL text to add special date field __mj_CreatedAt to entity morecheese_orders.OrderLine */
ALTER TABLE [morecheese_orders].[OrderLine] ADD CONSTRAINT [DF_morecheese_orders_OrderLine___mj_CreatedAt] DEFAULT GETUTCDATE() FOR [__mj_CreatedAt];
GO

/* SQL text to add special date field __mj_UpdatedAt to entity morecheese_orders.OrderLine */
ALTER TABLE [morecheese_orders].[OrderLine] ADD [__mj_UpdatedAt] DATETIMEOFFSET NULL;
GO

/* SQL text to add special date field __mj_UpdatedAt to entity morecheese_orders.OrderLine */
UPDATE [morecheese_orders].[OrderLine] SET [__mj_UpdatedAt] = GETUTCDATE() WHERE [__mj_UpdatedAt] IS NULL;
GO

/* SQL text to add special date field __mj_UpdatedAt to entity morecheese_orders.OrderLine */
ALTER TABLE [morecheese_orders].[OrderLine] ALTER COLUMN [__mj_UpdatedAt] DATETIMEOFFSET NOT NULL;
GO

/* SQL text to add special date field __mj_UpdatedAt to entity morecheese_orders.OrderLine */
ALTER TABLE [morecheese_orders].[OrderLine] ADD CONSTRAINT [DF_morecheese_orders_OrderLine___mj_UpdatedAt] DEFAULT GETUTCDATE() FOR [__mj_UpdatedAt];
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

/* SQL text to add special date field __mj_CreatedAt to entity morecheese_orders.Payment */
ALTER TABLE [morecheese_orders].[Payment] ADD [__mj_CreatedAt] DATETIMEOFFSET NULL;
GO

/* SQL text to add special date field __mj_CreatedAt to entity morecheese_orders.Payment */
UPDATE [morecheese_orders].[Payment] SET [__mj_CreatedAt] = GETUTCDATE() WHERE [__mj_CreatedAt] IS NULL;
GO

/* SQL text to add special date field __mj_CreatedAt to entity morecheese_orders.Payment */
ALTER TABLE [morecheese_orders].[Payment] ALTER COLUMN [__mj_CreatedAt] DATETIMEOFFSET NOT NULL;
GO

/* SQL text to add special date field __mj_CreatedAt to entity morecheese_orders.Payment */
ALTER TABLE [morecheese_orders].[Payment] ADD CONSTRAINT [DF_morecheese_orders_Payment___mj_CreatedAt] DEFAULT GETUTCDATE() FOR [__mj_CreatedAt];
GO

/* SQL text to add special date field __mj_UpdatedAt to entity morecheese_orders.Payment */
ALTER TABLE [morecheese_orders].[Payment] ADD [__mj_UpdatedAt] DATETIMEOFFSET NULL;
GO

/* SQL text to add special date field __mj_UpdatedAt to entity morecheese_orders.Payment */
UPDATE [morecheese_orders].[Payment] SET [__mj_UpdatedAt] = GETUTCDATE() WHERE [__mj_UpdatedAt] IS NULL;
GO

/* SQL text to add special date field __mj_UpdatedAt to entity morecheese_orders.Payment */
ALTER TABLE [morecheese_orders].[Payment] ALTER COLUMN [__mj_UpdatedAt] DATETIMEOFFSET NOT NULL;
GO

/* SQL text to add special date field __mj_UpdatedAt to entity morecheese_orders.Payment */
ALTER TABLE [morecheese_orders].[Payment] ADD CONSTRAINT [DF_morecheese_orders_Payment___mj_UpdatedAt] DEFAULT GETUTCDATE() FOR [__mj_UpdatedAt];
GO

/* SQL text to insert 173 new entity field(s) */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '82b39c60-0d97-4fd0-9f7c-f3371dc0e02e' OR (EntityID = '81B84F0D-7A7A-4897-A8F3-08EB40A09B51' AND Name = 'ID')) BEGIN
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
            '82b39c60-0d97-4fd0-9f7c-f3371dc0e02e',
            '81B84F0D-7A7A-4897-A8F3-08EB40A09B51', -- Entity: MoreCheese: Orders
            100001,
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

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '1be6daa9-2335-41ce-b730-8a56581a0f48' OR (EntityID = '81B84F0D-7A7A-4897-A8F3-08EB40A09B51' AND Name = 'OrderKey')) BEGIN
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
            '1be6daa9-2335-41ce-b730-8a56581a0f48',
            '81B84F0D-7A7A-4897-A8F3-08EB40A09B51', -- Entity: MoreCheese: Orders
            100002,
            'OrderKey',
            'Order Key',
            'Business key (ORD-D-* dues, ORD-R-* open renewal, ORD-E-* event); UUIDs derive from it',
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

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = 'f5156143-443d-4374-b7e5-4788645028c5' OR (EntityID = '81B84F0D-7A7A-4897-A8F3-08EB40A09B51' AND Name = 'PersonID')) BEGIN
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
            'f5156143-443d-4374-b7e5-4788645028c5',
            '81B84F0D-7A7A-4897-A8F3-08EB40A09B51', -- Entity: MoreCheese: Orders
            100003,
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

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '25ed959b-53ee-4f21-9659-eb174b942916' OR (EntityID = '81B84F0D-7A7A-4897-A8F3-08EB40A09B51' AND Name = 'OrderType')) BEGIN
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
            '25ed959b-53ee-4f21-9659-eb174b942916',
            '81B84F0D-7A7A-4897-A8F3-08EB40A09B51', -- Entity: MoreCheese: Orders
            100004,
            'OrderType',
            'Order Type',
            'Always Sale in the demo slice',
            'nvarchar',
            100,
            0,
            0,
            0,
            'Sale',
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

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '80d073b4-370f-43a5-9588-66217a3f4c18' OR (EntityID = '81B84F0D-7A7A-4897-A8F3-08EB40A09B51' AND Name = 'Status')) BEGIN
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
            '80d073b4-370f-43a5-9588-66217a3f4c18',
            '81B84F0D-7A7A-4897-A8F3-08EB40A09B51', -- Entity: MoreCheese: Orders
            100005,
            'Status',
            'Status',
            'Always Posted — the posted order IS the bill (no invoices, per bizapps-orders design)',
            'nvarchar',
            100,
            0,
            0,
            0,
            'Posted',
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

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '7d32a126-eeba-42d0-a07a-bc6cbd29cf3d' OR (EntityID = '81B84F0D-7A7A-4897-A8F3-08EB40A09B51' AND Name = 'OrderDate')) BEGIN
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
            '7d32a126-eeba-42d0-a07a-bc6cbd29cf3d',
            '81B84F0D-7A7A-4897-A8F3-08EB40A09B51', -- Entity: MoreCheese: Orders
            100006,
            'OrderDate',
            'Order Date',
            'Date the order posted (dues post at period start; event orders at registration)',
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

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '1f2684ad-e808-4288-a352-184faf10473f' OR (EntityID = '81B84F0D-7A7A-4897-A8F3-08EB40A09B51' AND Name = 'DueDate')) BEGIN
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
            '1f2684ad-e808-4288-a352-184faf10473f',
            '81B84F0D-7A7A-4897-A8F3-08EB40A09B51', -- Entity: MoreCheese: Orders
            100007,
            'DueDate',
            'Due Date',
            'Payment due date (period start, or +30 days on business-tier net terms)',
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

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '486fe26d-db39-4e63-9ef3-04621fad0b3c' OR (EntityID = '81B84F0D-7A7A-4897-A8F3-08EB40A09B51' AND Name = 'TotalGross')) BEGIN
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
            '486fe26d-db39-4e63-9ef3-04621fad0b3c',
            '81B84F0D-7A7A-4897-A8F3-08EB40A09B51', -- Entity: MoreCheese: Orders
            100008,
            'TotalGross',
            'Total Gross',
            'Order total in USD',
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

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '7a3d85ec-4344-4268-9a5e-52126d42a750' OR (EntityID = '81B84F0D-7A7A-4897-A8F3-08EB40A09B51' AND Name = 'PaymentStatus')) BEGIN
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
            '7a3d85ec-4344-4268-9a5e-52126d42a750',
            '81B84F0D-7A7A-4897-A8F3-08EB40A09B51', -- Entity: MoreCheese: Orders
            100009,
            'PaymentStatus',
            'Payment Status',
            'Paid, Unpaid, or Overdue — a payment dated after release has not happened yet, so orders age (real A/R)',
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

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '27a3a8a3-e18f-45b3-8875-2ff70da01a77' OR (EntityID = '81B84F0D-7A7A-4897-A8F3-08EB40A09B51' AND Name = 'IsSharedDemo')) BEGIN
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
            '27a3a8a3-e18f-45b3-8875-2ff70da01a77',
            '81B84F0D-7A7A-4897-A8F3-08EB40A09B51', -- Entity: MoreCheese: Orders
            100010,
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

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '373042e3-1f6d-4114-a17c-e2bdfe003ca7' OR (EntityID = '81B84F0D-7A7A-4897-A8F3-08EB40A09B51' AND Name = '__mj_CreatedAt')) BEGIN
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
            '373042e3-1f6d-4114-a17c-e2bdfe003ca7',
            '81B84F0D-7A7A-4897-A8F3-08EB40A09B51', -- Entity: MoreCheese: Orders
            100011,
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

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '28a0e877-33cf-456c-ae48-1502644b4290' OR (EntityID = '81B84F0D-7A7A-4897-A8F3-08EB40A09B51' AND Name = '__mj_UpdatedAt')) BEGIN
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
            '28a0e877-33cf-456c-ae48-1502644b4290',
            '81B84F0D-7A7A-4897-A8F3-08EB40A09B51', -- Entity: MoreCheese: Orders
            100012,
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

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = 'e4647eb2-0d66-47b2-8808-d4ab32f91f9a' OR (EntityID = '49DF9400-9C38-422C-8DB6-1373D5392E35' AND Name = 'ID')) BEGIN
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
            'e4647eb2-0d66-47b2-8808-d4ab32f91f9a',
            '49DF9400-9C38-422C-8DB6-1373D5392E35', -- Entity: MoreCheese: Certifications
            100001,
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

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '7c06cc50-44fa-4742-a899-d15aa8c5bcbb' OR (EntityID = '49DF9400-9C38-422C-8DB6-1373D5392E35' AND Name = 'CertKey')) BEGIN
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
            '7c06cc50-44fa-4742-a899-d15aa8c5bcbb',
            '49DF9400-9C38-422C-8DB6-1373D5392E35', -- Entity: MoreCheese: Certifications
            100002,
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

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '57379c3b-8913-402e-900b-52be638a9035' OR (EntityID = '49DF9400-9C38-422C-8DB6-1373D5392E35' AND Name = 'Name')) BEGIN
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
            '57379c3b-8913-402e-900b-52be638a9035',
            '49DF9400-9C38-422C-8DB6-1373D5392E35', -- Entity: MoreCheese: Certifications
            100003,
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

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = 'dbedee9b-8f33-44c1-9fe0-ee9fb7beb959' OR (EntityID = '49DF9400-9C38-422C-8DB6-1373D5392E35' AND Name = 'Description')) BEGIN
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
            'dbedee9b-8f33-44c1-9fe0-ee9fb7beb959',
            '49DF9400-9C38-422C-8DB6-1373D5392E35', -- Entity: MoreCheese: Certifications
            100004,
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

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '944d7084-2abd-4b6e-bc9b-93d6bd5d2366' OR (EntityID = '49DF9400-9C38-422C-8DB6-1373D5392E35' AND Name = 'ValidYears')) BEGIN
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
            '944d7084-2abd-4b6e-bc9b-93d6bd5d2366',
            '49DF9400-9C38-422C-8DB6-1373D5392E35', -- Entity: MoreCheese: Certifications
            100005,
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

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '6aae4039-b297-44b1-9379-544a91d1fc50' OR (EntityID = '49DF9400-9C38-422C-8DB6-1373D5392E35' AND Name = 'IsSharedDemo')) BEGIN
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
            '6aae4039-b297-44b1-9379-544a91d1fc50',
            '49DF9400-9C38-422C-8DB6-1373D5392E35', -- Entity: MoreCheese: Certifications
            100006,
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

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = 'a39ecf32-c099-4422-9764-58d454b86506' OR (EntityID = '49DF9400-9C38-422C-8DB6-1373D5392E35' AND Name = '__mj_CreatedAt')) BEGIN
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
            'a39ecf32-c099-4422-9764-58d454b86506',
            '49DF9400-9C38-422C-8DB6-1373D5392E35', -- Entity: MoreCheese: Certifications
            100007,
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

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '2e1f3025-acec-483b-9716-875466cda060' OR (EntityID = '49DF9400-9C38-422C-8DB6-1373D5392E35' AND Name = '__mj_UpdatedAt')) BEGIN
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
            '2e1f3025-acec-483b-9716-875466cda060',
            '49DF9400-9C38-422C-8DB6-1373D5392E35', -- Entity: MoreCheese: Certifications
            100008,
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

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = 'd9a3fc07-efe5-48df-9f0b-3749a13f99a1' OR (EntityID = 'CB9A5230-39C0-49EE-A5BC-238D3536B39B' AND Name = 'ID')) BEGIN
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
            'd9a3fc07-efe5-48df-9f0b-3749a13f99a1',
            'CB9A5230-39C0-49EE-A5BC-238D3536B39B', -- Entity: MoreCheese: Events
            100001,
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

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = 'ceb59a83-a25f-44f7-9182-b48eb4d587b3' OR (EntityID = 'CB9A5230-39C0-49EE-A5BC-238D3536B39B' AND Name = 'EventKey')) BEGIN
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
            'ceb59a83-a25f-44f7-9182-b48eb4d587b3',
            'CB9A5230-39C0-49EE-A5BC-238D3536B39B', -- Entity: MoreCheese: Events
            100002,
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

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '8a853b0d-1298-4428-a194-4add53c17d99' OR (EntityID = 'CB9A5230-39C0-49EE-A5BC-238D3536B39B' AND Name = 'Name')) BEGIN
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
            '8a853b0d-1298-4428-a194-4add53c17d99',
            'CB9A5230-39C0-49EE-A5BC-238D3536B39B', -- Entity: MoreCheese: Events
            100003,
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

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '40e4eac3-edb5-4ae1-af99-593c4d74460a' OR (EntityID = 'CB9A5230-39C0-49EE-A5BC-238D3536B39B' AND Name = 'EventType')) BEGIN
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
            '40e4eac3-edb5-4ae1-af99-593c4d74460a',
            'CB9A5230-39C0-49EE-A5BC-238D3536B39B', -- Entity: MoreCheese: Events
            100004,
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

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '1647e597-b94b-4c47-af58-8194da4812d8' OR (EntityID = 'CB9A5230-39C0-49EE-A5BC-238D3536B39B' AND Name = 'EventDate')) BEGIN
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
            '1647e597-b94b-4c47-af58-8194da4812d8',
            'CB9A5230-39C0-49EE-A5BC-238D3536B39B', -- Entity: MoreCheese: Events
            100005,
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

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = 'a86a565f-68d9-47cc-8931-f000a6d1422c' OR (EntityID = 'CB9A5230-39C0-49EE-A5BC-238D3536B39B' AND Name = 'IsVirtual')) BEGIN
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
            'a86a565f-68d9-47cc-8931-f000a6d1422c',
            'CB9A5230-39C0-49EE-A5BC-238D3536B39B', -- Entity: MoreCheese: Events
            100006,
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

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = 'e5ba2927-942d-419f-82a4-4a6f01d6cca8' OR (EntityID = 'CB9A5230-39C0-49EE-A5BC-238D3536B39B' AND Name = 'IsPaid')) BEGIN
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
            'e5ba2927-942d-419f-82a4-4a6f01d6cca8',
            'CB9A5230-39C0-49EE-A5BC-238D3536B39B', -- Entity: MoreCheese: Events
            100007,
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

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = 'dd914d99-2b94-4bbb-8642-c1c261782f79' OR (EntityID = 'CB9A5230-39C0-49EE-A5BC-238D3536B39B' AND Name = 'City')) BEGIN
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
            'dd914d99-2b94-4bbb-8642-c1c261782f79',
            'CB9A5230-39C0-49EE-A5BC-238D3536B39B', -- Entity: MoreCheese: Events
            100008,
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

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '7a636ae3-36ad-4da4-a173-867c55b139c9' OR (EntityID = 'CB9A5230-39C0-49EE-A5BC-238D3536B39B' AND Name = 'State')) BEGIN
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
            '7a636ae3-36ad-4da4-a173-867c55b139c9',
            'CB9A5230-39C0-49EE-A5BC-238D3536B39B', -- Entity: MoreCheese: Events
            100009,
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

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '8da63195-2484-4eea-84b6-4f4b5609c358' OR (EntityID = 'CB9A5230-39C0-49EE-A5BC-238D3536B39B' AND Name = 'Latitude')) BEGIN
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
            '8da63195-2484-4eea-84b6-4f4b5609c358',
            'CB9A5230-39C0-49EE-A5BC-238D3536B39B', -- Entity: MoreCheese: Events
            100010,
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

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '9a507aea-f589-475b-bed7-2543568bf839' OR (EntityID = 'CB9A5230-39C0-49EE-A5BC-238D3536B39B' AND Name = 'Longitude')) BEGIN
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
            '9a507aea-f589-475b-bed7-2543568bf839',
            'CB9A5230-39C0-49EE-A5BC-238D3536B39B', -- Entity: MoreCheese: Events
            100011,
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

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = 'a8001744-46fa-49da-82b3-7afd88ab9dbf' OR (EntityID = 'CB9A5230-39C0-49EE-A5BC-238D3536B39B' AND Name = 'IsSharedDemo')) BEGIN
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
            'a8001744-46fa-49da-82b3-7afd88ab9dbf',
            'CB9A5230-39C0-49EE-A5BC-238D3536B39B', -- Entity: MoreCheese: Events
            100012,
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

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '986c2f99-9ca7-4a49-bbed-37db4df72daa' OR (EntityID = 'CB9A5230-39C0-49EE-A5BC-238D3536B39B' AND Name = '__mj_CreatedAt')) BEGIN
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
            '986c2f99-9ca7-4a49-bbed-37db4df72daa',
            'CB9A5230-39C0-49EE-A5BC-238D3536B39B', -- Entity: MoreCheese: Events
            100013,
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

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '3c76a3f4-420f-4770-93ea-d44a5c30cb9a' OR (EntityID = 'CB9A5230-39C0-49EE-A5BC-238D3536B39B' AND Name = '__mj_UpdatedAt')) BEGIN
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
            '3c76a3f4-420f-4770-93ea-d44a5c30cb9a',
            'CB9A5230-39C0-49EE-A5BC-238D3536B39B', -- Entity: MoreCheese: Events
            100014,
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

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '13c063d7-0b64-44b7-bcd1-7849e45e67f8' OR (EntityID = 'F2C9BD57-8734-4AFE-B20A-2C8C1C3BB25F' AND Name = 'ID')) BEGIN
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
            '13c063d7-0b64-44b7-bcd1-7849e45e67f8',
            'F2C9BD57-8734-4AFE-B20A-2C8C1C3BB25F', -- Entity: MoreCheese: Advocacy Actions
            100001,
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

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = 'b6ad7bea-68a6-4cca-8b76-327eaf914936' OR (EntityID = 'F2C9BD57-8734-4AFE-B20A-2C8C1C3BB25F' AND Name = 'ActionKey')) BEGIN
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
            'b6ad7bea-68a6-4cca-8b76-327eaf914936',
            'F2C9BD57-8734-4AFE-B20A-2C8C1C3BB25F', -- Entity: MoreCheese: Advocacy Actions
            100002,
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

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '04fb77e8-2a7f-4446-9a90-9ba70889aaab' OR (EntityID = 'F2C9BD57-8734-4AFE-B20A-2C8C1C3BB25F' AND Name = 'PersonID')) BEGIN
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
            '04fb77e8-2a7f-4446-9a90-9ba70889aaab',
            'F2C9BD57-8734-4AFE-B20A-2C8C1C3BB25F', -- Entity: MoreCheese: Advocacy Actions
            100003,
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

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '9b8e004e-cb4a-4eb6-8e69-c075028f6b00' OR (EntityID = 'F2C9BD57-8734-4AFE-B20A-2C8C1C3BB25F' AND Name = 'ActionDate')) BEGIN
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
            '9b8e004e-cb4a-4eb6-8e69-c075028f6b00',
            'F2C9BD57-8734-4AFE-B20A-2C8C1C3BB25F', -- Entity: MoreCheese: Advocacy Actions
            100004,
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

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '0a8440bd-a3b6-4257-8003-dcd137773cea' OR (EntityID = 'F2C9BD57-8734-4AFE-B20A-2C8C1C3BB25F' AND Name = 'Kind')) BEGIN
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
            '0a8440bd-a3b6-4257-8003-dcd137773cea',
            'F2C9BD57-8734-4AFE-B20A-2C8C1C3BB25F', -- Entity: MoreCheese: Advocacy Actions
            100005,
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

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '2c606e23-dd74-4cf3-9527-330ef3b99309' OR (EntityID = 'F2C9BD57-8734-4AFE-B20A-2C8C1C3BB25F' AND Name = 'Topic')) BEGIN
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
            '2c606e23-dd74-4cf3-9527-330ef3b99309',
            'F2C9BD57-8734-4AFE-B20A-2C8C1C3BB25F', -- Entity: MoreCheese: Advocacy Actions
            100006,
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

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = 'ea3e12ff-126d-43a4-8888-63ddd4ff4c00' OR (EntityID = 'F2C9BD57-8734-4AFE-B20A-2C8C1C3BB25F' AND Name = 'IsSharedDemo')) BEGIN
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
            'ea3e12ff-126d-43a4-8888-63ddd4ff4c00',
            'F2C9BD57-8734-4AFE-B20A-2C8C1C3BB25F', -- Entity: MoreCheese: Advocacy Actions
            100007,
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

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = 'b102a298-b964-411f-abbf-9f876936ef81' OR (EntityID = 'F2C9BD57-8734-4AFE-B20A-2C8C1C3BB25F' AND Name = '__mj_CreatedAt')) BEGIN
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
            'b102a298-b964-411f-abbf-9f876936ef81',
            'F2C9BD57-8734-4AFE-B20A-2C8C1C3BB25F', -- Entity: MoreCheese: Advocacy Actions
            100008,
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

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '2bc1ee95-d5ea-4d7f-bf5b-e94c2636dea2' OR (EntityID = 'F2C9BD57-8734-4AFE-B20A-2C8C1C3BB25F' AND Name = '__mj_UpdatedAt')) BEGIN
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
            '2bc1ee95-d5ea-4d7f-bf5b-e94c2636dea2',
            'F2C9BD57-8734-4AFE-B20A-2C8C1C3BB25F', -- Entity: MoreCheese: Advocacy Actions
            100009,
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

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '44ad68bd-c6df-4e03-a78f-8853b294f578' OR (EntityID = 'A3E60AF2-D7CA-407E-A1D3-34320E851892' AND Name = 'ID')) BEGIN
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
            '44ad68bd-c6df-4e03-a78f-8853b294f578',
            'A3E60AF2-D7CA-407E-A1D3-34320E851892', -- Entity: MoreCheese: Courses
            100001,
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

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '9a7c9ff2-ad80-4e7a-8bfd-b8cc0f7d7bee' OR (EntityID = 'A3E60AF2-D7CA-407E-A1D3-34320E851892' AND Name = 'CourseKey')) BEGIN
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
            '9a7c9ff2-ad80-4e7a-8bfd-b8cc0f7d7bee',
            'A3E60AF2-D7CA-407E-A1D3-34320E851892', -- Entity: MoreCheese: Courses
            100002,
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

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = 'ddd3066b-eb4b-4ca6-94d3-ff1dffd8a4a6' OR (EntityID = 'A3E60AF2-D7CA-407E-A1D3-34320E851892' AND Name = 'Name')) BEGIN
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
            'ddd3066b-eb4b-4ca6-94d3-ff1dffd8a4a6',
            'A3E60AF2-D7CA-407E-A1D3-34320E851892', -- Entity: MoreCheese: Courses
            100003,
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

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '8d374d1b-9bd2-47f0-8522-f4c6b274f6ed' OR (EntityID = 'A3E60AF2-D7CA-407E-A1D3-34320E851892' AND Name = 'StartDate')) BEGIN
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
            '8d374d1b-9bd2-47f0-8522-f4c6b274f6ed',
            'A3E60AF2-D7CA-407E-A1D3-34320E851892', -- Entity: MoreCheese: Courses
            100004,
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

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = 'eec71add-2e31-4de9-9402-fc844d514619' OR (EntityID = 'A3E60AF2-D7CA-407E-A1D3-34320E851892' AND Name = 'DurationWeeks')) BEGIN
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
            'eec71add-2e31-4de9-9402-fc844d514619',
            'A3E60AF2-D7CA-407E-A1D3-34320E851892', -- Entity: MoreCheese: Courses
            100005,
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

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = 'dd75f718-67d8-413a-8de0-0f25327c2528' OR (EntityID = 'A3E60AF2-D7CA-407E-A1D3-34320E851892' AND Name = 'IsSharedDemo')) BEGIN
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
            'dd75f718-67d8-413a-8de0-0f25327c2528',
            'A3E60AF2-D7CA-407E-A1D3-34320E851892', -- Entity: MoreCheese: Courses
            100006,
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

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = 'fe716808-5300-4168-9440-b0365f5bbf45' OR (EntityID = 'A3E60AF2-D7CA-407E-A1D3-34320E851892' AND Name = '__mj_CreatedAt')) BEGIN
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
            'fe716808-5300-4168-9440-b0365f5bbf45',
            'A3E60AF2-D7CA-407E-A1D3-34320E851892', -- Entity: MoreCheese: Courses
            100007,
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

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = 'ba6140c1-d5b8-4b83-86e7-7fdb1aad9cd8' OR (EntityID = 'A3E60AF2-D7CA-407E-A1D3-34320E851892' AND Name = '__mj_UpdatedAt')) BEGIN
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
            'ba6140c1-d5b8-4b83-86e7-7fdb1aad9cd8',
            'A3E60AF2-D7CA-407E-A1D3-34320E851892', -- Entity: MoreCheese: Courses
            100008,
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

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '6cc3a35f-b085-4ca9-a6a1-3d3217a7e2df' OR (EntityID = 'BE4D97E0-48DE-4240-A09F-8B39AD4BD043' AND Name = 'ID')) BEGIN
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
            '6cc3a35f-b085-4ca9-a6a1-3d3217a7e2df',
            'BE4D97E0-48DE-4240-A09F-8B39AD4BD043', -- Entity: MoreCheese: Member Profiles
            100001,
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

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '7cbedd07-513a-48bc-949b-a4ca8436387a' OR (EntityID = 'BE4D97E0-48DE-4240-A09F-8B39AD4BD043' AND Name = 'PersonID')) BEGIN
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
            '7cbedd07-513a-48bc-949b-a4ca8436387a',
            'BE4D97E0-48DE-4240-A09F-8B39AD4BD043', -- Entity: MoreCheese: Member Profiles
            100002,
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

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = 'f8b9a4ad-bd44-4f5d-9c6f-0b23eec84c8b' OR (EntityID = 'BE4D97E0-48DE-4240-A09F-8B39AD4BD043' AND Name = 'OrganizationID')) BEGIN
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
            'f8b9a4ad-bd44-4f5d-9c6f-0b23eec84c8b',
            'BE4D97E0-48DE-4240-A09F-8B39AD4BD043', -- Entity: MoreCheese: Member Profiles
            100003,
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

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = 'cdf8f3e5-f527-44b0-be23-10b8431c3a19' OR (EntityID = 'BE4D97E0-48DE-4240-A09F-8B39AD4BD043' AND Name = 'MemberNumber')) BEGIN
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
            'cdf8f3e5-f527-44b0-be23-10b8431c3a19',
            'BE4D97E0-48DE-4240-A09F-8B39AD4BD043', -- Entity: MoreCheese: Member Profiles
            100004,
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

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = 'e0442068-ae13-4cc6-a5aa-6e2ebe16ef0f' OR (EntityID = 'BE4D97E0-48DE-4240-A09F-8B39AD4BD043' AND Name = 'Segment')) BEGIN
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
            'e0442068-ae13-4cc6-a5aa-6e2ebe16ef0f',
            'BE4D97E0-48DE-4240-A09F-8B39AD4BD043', -- Entity: MoreCheese: Member Profiles
            100005,
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

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '8fa7894d-19e6-4662-82d9-c923a8a8ca57' OR (EntityID = 'BE4D97E0-48DE-4240-A09F-8B39AD4BD043' AND Name = 'Region')) BEGIN
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
            '8fa7894d-19e6-4662-82d9-c923a8a8ca57',
            'BE4D97E0-48DE-4240-A09F-8B39AD4BD043', -- Entity: MoreCheese: Member Profiles
            100006,
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

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '7cfdb7cd-97c9-491e-b94d-62c5776f40a9' OR (EntityID = 'BE4D97E0-48DE-4240-A09F-8B39AD4BD043' AND Name = 'City')) BEGIN
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
            '7cfdb7cd-97c9-491e-b94d-62c5776f40a9',
            'BE4D97E0-48DE-4240-A09F-8B39AD4BD043', -- Entity: MoreCheese: Member Profiles
            100007,
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

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '111789ca-b374-4baf-8eae-8f19487156ac' OR (EntityID = 'BE4D97E0-48DE-4240-A09F-8B39AD4BD043' AND Name = 'State')) BEGIN
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
            '111789ca-b374-4baf-8eae-8f19487156ac',
            'BE4D97E0-48DE-4240-A09F-8B39AD4BD043', -- Entity: MoreCheese: Member Profiles
            100008,
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

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = 'd4c5b0a4-547f-4ffc-97f0-8fe7df519f12' OR (EntityID = 'BE4D97E0-48DE-4240-A09F-8B39AD4BD043' AND Name = 'Latitude')) BEGIN
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
            'd4c5b0a4-547f-4ffc-97f0-8fe7df519f12',
            'BE4D97E0-48DE-4240-A09F-8B39AD4BD043', -- Entity: MoreCheese: Member Profiles
            100009,
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

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '24b22b75-f856-4da3-923f-16f678b3f93e' OR (EntityID = 'BE4D97E0-48DE-4240-A09F-8B39AD4BD043' AND Name = 'Longitude')) BEGIN
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
            '24b22b75-f856-4da3-923f-16f678b3f93e',
            'BE4D97E0-48DE-4240-A09F-8B39AD4BD043', -- Entity: MoreCheese: Member Profiles
            100010,
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

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '8a705b0f-1d40-40d1-9877-9b3662c70c40' OR (EntityID = 'BE4D97E0-48DE-4240-A09F-8B39AD4BD043' AND Name = 'JoinDate')) BEGIN
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
            '8a705b0f-1d40-40d1-9877-9b3662c70c40',
            'BE4D97E0-48DE-4240-A09F-8B39AD4BD043', -- Entity: MoreCheese: Member Profiles
            100011,
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

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '24d57ad2-12e9-459a-9ff2-564bb5aaa782' OR (EntityID = 'BE4D97E0-48DE-4240-A09F-8B39AD4BD043' AND Name = 'IsSharedDemo')) BEGIN
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
            '24d57ad2-12e9-459a-9ff2-564bb5aaa782',
            'BE4D97E0-48DE-4240-A09F-8B39AD4BD043', -- Entity: MoreCheese: Member Profiles
            100012,
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

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '4741e59a-f3a0-4cbd-ad11-9e69da30f81c' OR (EntityID = 'BE4D97E0-48DE-4240-A09F-8B39AD4BD043' AND Name = '__mj_CreatedAt')) BEGIN
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
            '4741e59a-f3a0-4cbd-ad11-9e69da30f81c',
            'BE4D97E0-48DE-4240-A09F-8B39AD4BD043', -- Entity: MoreCheese: Member Profiles
            100013,
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

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = 'b5ba3737-6dd0-4621-8b4f-99a3f197216c' OR (EntityID = 'BE4D97E0-48DE-4240-A09F-8B39AD4BD043' AND Name = '__mj_UpdatedAt')) BEGIN
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
            'b5ba3737-6dd0-4621-8b4f-99a3f197216c',
            'BE4D97E0-48DE-4240-A09F-8B39AD4BD043', -- Entity: MoreCheese: Member Profiles
            100014,
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

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = 'a94fd655-1e1e-44d0-a151-47fbc120fd56' OR (EntityID = 'FF152388-ED04-4F1F-B237-94D502C4AA54' AND Name = 'ID')) BEGIN
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
            'a94fd655-1e1e-44d0-a151-47fbc120fd56',
            'FF152388-ED04-4F1F-B237-94D502C4AA54', -- Entity: MoreCheese: Data Quality Labels
            100001,
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

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = 'c7ace3fc-d6d2-4162-83cc-7a402e6491d7' OR (EntityID = 'FF152388-ED04-4F1F-B237-94D502C4AA54' AND Name = 'LabelKey')) BEGIN
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
            'c7ace3fc-d6d2-4162-83cc-7a402e6491d7',
            'FF152388-ED04-4F1F-B237-94D502C4AA54', -- Entity: MoreCheese: Data Quality Labels
            100002,
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

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '2450c51e-480c-4e3f-9464-82d92305e54c' OR (EntityID = 'FF152388-ED04-4F1F-B237-94D502C4AA54' AND Name = 'DefectKind')) BEGIN
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
            '2450c51e-480c-4e3f-9464-82d92305e54c',
            'FF152388-ED04-4F1F-B237-94D502C4AA54', -- Entity: MoreCheese: Data Quality Labels
            100003,
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

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '79bcdc32-cda8-49a8-91cc-1c6f3e8d744b' OR (EntityID = 'FF152388-ED04-4F1F-B237-94D502C4AA54' AND Name = 'PersonID')) BEGIN
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
            '79bcdc32-cda8-49a8-91cc-1c6f3e8d744b',
            'FF152388-ED04-4F1F-B237-94D502C4AA54', -- Entity: MoreCheese: Data Quality Labels
            100004,
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

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '793512a3-601d-430d-8b13-f4ede4178d8a' OR (EntityID = 'FF152388-ED04-4F1F-B237-94D502C4AA54' AND Name = 'RelatedPersonID')) BEGIN
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
            '793512a3-601d-430d-8b13-f4ede4178d8a',
            'FF152388-ED04-4F1F-B237-94D502C4AA54', -- Entity: MoreCheese: Data Quality Labels
            100005,
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

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '9701d6d7-c43f-4370-b049-e10be8cf707b' OR (EntityID = 'FF152388-ED04-4F1F-B237-94D502C4AA54' AND Name = 'RelatedOrganizationID')) BEGIN
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
            '9701d6d7-c43f-4370-b049-e10be8cf707b',
            'FF152388-ED04-4F1F-B237-94D502C4AA54', -- Entity: MoreCheese: Data Quality Labels
            100006,
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

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '2c863e4a-3ed7-4ce6-b30c-3a23efc4e934' OR (EntityID = 'FF152388-ED04-4F1F-B237-94D502C4AA54' AND Name = 'DefectValue')) BEGIN
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
            '2c863e4a-3ed7-4ce6-b30c-3a23efc4e934',
            'FF152388-ED04-4F1F-B237-94D502C4AA54', -- Entity: MoreCheese: Data Quality Labels
            100007,
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

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '88159b82-9b7b-4afc-8a27-6e73c2abfb84' OR (EntityID = 'FF152388-ED04-4F1F-B237-94D502C4AA54' AND Name = 'TruthValue')) BEGIN
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
            '88159b82-9b7b-4afc-8a27-6e73c2abfb84',
            'FF152388-ED04-4F1F-B237-94D502C4AA54', -- Entity: MoreCheese: Data Quality Labels
            100008,
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

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '66d03afb-effd-462f-9036-f0e295c0db5c' OR (EntityID = 'FF152388-ED04-4F1F-B237-94D502C4AA54' AND Name = 'Notes')) BEGIN
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
            '66d03afb-effd-462f-9036-f0e295c0db5c',
            'FF152388-ED04-4F1F-B237-94D502C4AA54', -- Entity: MoreCheese: Data Quality Labels
            100009,
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

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = 'd7e19440-bd3c-4288-9509-8db3b855be8e' OR (EntityID = 'FF152388-ED04-4F1F-B237-94D502C4AA54' AND Name = 'IsSharedDemo')) BEGIN
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
            'd7e19440-bd3c-4288-9509-8db3b855be8e',
            'FF152388-ED04-4F1F-B237-94D502C4AA54', -- Entity: MoreCheese: Data Quality Labels
            100010,
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

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '8496d9d3-f95b-4a9d-9e12-e5bafdf1f223' OR (EntityID = 'FF152388-ED04-4F1F-B237-94D502C4AA54' AND Name = '__mj_CreatedAt')) BEGIN
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
            '8496d9d3-f95b-4a9d-9e12-e5bafdf1f223',
            'FF152388-ED04-4F1F-B237-94D502C4AA54', -- Entity: MoreCheese: Data Quality Labels
            100011,
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

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '73a40df0-c9f1-46ec-b053-3258e7ecca17' OR (EntityID = 'FF152388-ED04-4F1F-B237-94D502C4AA54' AND Name = '__mj_UpdatedAt')) BEGIN
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
            '73a40df0-c9f1-46ec-b053-3258e7ecca17',
            'FF152388-ED04-4F1F-B237-94D502C4AA54', -- Entity: MoreCheese: Data Quality Labels
            100012,
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

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '57391a05-3228-45c5-927a-10249a275c53' OR (EntityID = '16538F9B-E025-460D-9505-BD03A7648EC5' AND Name = 'ID')) BEGIN
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
            '57391a05-3228-45c5-927a-10249a275c53',
            '16538F9B-E025-460D-9505-BD03A7648EC5', -- Entity: MoreCheese: Membership Periods
            100001,
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

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '020e84fa-a521-45fd-93ba-1cb0c0d5aa4f' OR (EntityID = '16538F9B-E025-460D-9505-BD03A7648EC5' AND Name = 'PeriodKey')) BEGIN
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
            '020e84fa-a521-45fd-93ba-1cb0c0d5aa4f',
            '16538F9B-E025-460D-9505-BD03A7648EC5', -- Entity: MoreCheese: Membership Periods
            100002,
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

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '524ea3e8-b69d-4648-814c-09521c4051fe' OR (EntityID = '16538F9B-E025-460D-9505-BD03A7648EC5' AND Name = 'PersonID')) BEGIN
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
            '524ea3e8-b69d-4648-814c-09521c4051fe',
            '16538F9B-E025-460D-9505-BD03A7648EC5', -- Entity: MoreCheese: Membership Periods
            100003,
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

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = 'af860254-0c86-4efe-aecd-b3e11a10b73f' OR (EntityID = '16538F9B-E025-460D-9505-BD03A7648EC5' AND Name = 'MembershipTier')) BEGIN
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
            'af860254-0c86-4efe-aecd-b3e11a10b73f',
            '16538F9B-E025-460D-9505-BD03A7648EC5', -- Entity: MoreCheese: Membership Periods
            100004,
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

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '58e134cf-48e2-4d0c-ab8a-4cb9bdf3883f' OR (EntityID = '16538F9B-E025-460D-9505-BD03A7648EC5' AND Name = 'DuesAmount')) BEGIN
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
            '58e134cf-48e2-4d0c-ab8a-4cb9bdf3883f',
            '16538F9B-E025-460D-9505-BD03A7648EC5', -- Entity: MoreCheese: Membership Periods
            100005,
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

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '37b6ff5c-c0f1-4e0c-ae7c-05e5f6f06149' OR (EntityID = '16538F9B-E025-460D-9505-BD03A7648EC5' AND Name = 'StartDate')) BEGIN
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
            '37b6ff5c-c0f1-4e0c-ae7c-05e5f6f06149',
            '16538F9B-E025-460D-9505-BD03A7648EC5', -- Entity: MoreCheese: Membership Periods
            100006,
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

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = 'ce20aa70-1692-41c3-a67c-f7fa8d245c10' OR (EntityID = '16538F9B-E025-460D-9505-BD03A7648EC5' AND Name = 'EndDate')) BEGIN
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
            'ce20aa70-1692-41c3-a67c-f7fa8d245c10',
            '16538F9B-E025-460D-9505-BD03A7648EC5', -- Entity: MoreCheese: Membership Periods
            100007,
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

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '89d84b86-0813-4420-9cbe-5cd635e79610' OR (EntityID = '16538F9B-E025-460D-9505-BD03A7648EC5' AND Name = 'RenewalDate')) BEGIN
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
            '89d84b86-0813-4420-9cbe-5cd635e79610',
            '16538F9B-E025-460D-9505-BD03A7648EC5', -- Entity: MoreCheese: Membership Periods
            100008,
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

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '66ab3f67-d88f-4002-9601-8f45ff1e9943' OR (EntityID = '16538F9B-E025-460D-9505-BD03A7648EC5' AND Name = 'Status')) BEGIN
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
            '66ab3f67-d88f-4002-9601-8f45ff1e9943',
            '16538F9B-E025-460D-9505-BD03A7648EC5', -- Entity: MoreCheese: Membership Periods
            100009,
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

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = 'c9de47d6-db85-4d66-a081-63de219a4a3e' OR (EntityID = '16538F9B-E025-460D-9505-BD03A7648EC5' AND Name = 'CancellationDate')) BEGIN
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
            'c9de47d6-db85-4d66-a081-63de219a4a3e',
            '16538F9B-E025-460D-9505-BD03A7648EC5', -- Entity: MoreCheese: Membership Periods
            100010,
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

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = 'a0ece410-43fb-492c-b0c2-6233ae2d8306' OR (EntityID = '16538F9B-E025-460D-9505-BD03A7648EC5' AND Name = 'CancellationReason')) BEGIN
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
            'a0ece410-43fb-492c-b0c2-6233ae2d8306',
            '16538F9B-E025-460D-9505-BD03A7648EC5', -- Entity: MoreCheese: Membership Periods
            100011,
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

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = 'ca8e63e8-3b64-464f-bade-df254bfea236' OR (EntityID = '16538F9B-E025-460D-9505-BD03A7648EC5' AND Name = 'AutoRenew')) BEGIN
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
            'ca8e63e8-3b64-464f-bade-df254bfea236',
            '16538F9B-E025-460D-9505-BD03A7648EC5', -- Entity: MoreCheese: Membership Periods
            100012,
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

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '60bd117e-849b-48b8-a677-89c2ffb5b904' OR (EntityID = '16538F9B-E025-460D-9505-BD03A7648EC5' AND Name = 'IsSharedDemo')) BEGIN
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
            '60bd117e-849b-48b8-a677-89c2ffb5b904',
            '16538F9B-E025-460D-9505-BD03A7648EC5', -- Entity: MoreCheese: Membership Periods
            100013,
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

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '609469cd-beb0-4b72-8755-89c515bb4ece' OR (EntityID = '16538F9B-E025-460D-9505-BD03A7648EC5' AND Name = '__mj_CreatedAt')) BEGIN
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
            '609469cd-beb0-4b72-8755-89c515bb4ece',
            '16538F9B-E025-460D-9505-BD03A7648EC5', -- Entity: MoreCheese: Membership Periods
            100014,
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

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '791f73c5-3bb8-457c-8a7f-1bbf3c945fa3' OR (EntityID = '16538F9B-E025-460D-9505-BD03A7648EC5' AND Name = '__mj_UpdatedAt')) BEGIN
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
            '791f73c5-3bb8-457c-8a7f-1bbf3c945fa3',
            '16538F9B-E025-460D-9505-BD03A7648EC5', -- Entity: MoreCheese: Membership Periods
            100015,
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

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '6bea23d1-74f3-4661-b875-9ab47902215f' OR (EntityID = '23916A8E-3487-4793-9E18-C209EF097E58' AND Name = 'ID')) BEGIN
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
            '6bea23d1-74f3-4661-b875-9ab47902215f',
            '23916A8E-3487-4793-9E18-C209EF097E58', -- Entity: MoreCheese: Member Certifications
            100001,
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

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = 'a69dbfe9-8f28-4503-bb5e-8f7ed81aa4ef' OR (EntityID = '23916A8E-3487-4793-9E18-C209EF097E58' AND Name = 'MemberCertKey')) BEGIN
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
            'a69dbfe9-8f28-4503-bb5e-8f7ed81aa4ef',
            '23916A8E-3487-4793-9E18-C209EF097E58', -- Entity: MoreCheese: Member Certifications
            100002,
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

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '996b6888-46a9-4088-bd6e-1fd4e85482b4' OR (EntityID = '23916A8E-3487-4793-9E18-C209EF097E58' AND Name = 'PersonID')) BEGIN
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
            '996b6888-46a9-4088-bd6e-1fd4e85482b4',
            '23916A8E-3487-4793-9E18-C209EF097E58', -- Entity: MoreCheese: Member Certifications
            100003,
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

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '6316a924-e1ad-46f7-9ad9-a3d18ebb085d' OR (EntityID = '23916A8E-3487-4793-9E18-C209EF097E58' AND Name = 'CertificationID')) BEGIN
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
            '6316a924-e1ad-46f7-9ad9-a3d18ebb085d',
            '23916A8E-3487-4793-9E18-C209EF097E58', -- Entity: MoreCheese: Member Certifications
            100004,
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
            '49DF9400-9C38-422C-8DB6-1373D5392E35',
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

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = 'e2a5d9ed-ca19-41d7-aae1-476652d08c2c' OR (EntityID = '23916A8E-3487-4793-9E18-C209EF097E58' AND Name = 'Status')) BEGIN
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
            'e2a5d9ed-ca19-41d7-aae1-476652d08c2c',
            '23916A8E-3487-4793-9E18-C209EF097E58', -- Entity: MoreCheese: Member Certifications
            100005,
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

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = 'f9df9bfc-8ca3-476e-967a-d2d8abe09c46' OR (EntityID = '23916A8E-3487-4793-9E18-C209EF097E58' AND Name = 'EnrolledOn')) BEGIN
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
            'f9df9bfc-8ca3-476e-967a-d2d8abe09c46',
            '23916A8E-3487-4793-9E18-C209EF097E58', -- Entity: MoreCheese: Member Certifications
            100006,
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

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '72f75915-79e2-486b-a555-d4a506863b8a' OR (EntityID = '23916A8E-3487-4793-9E18-C209EF097E58' AND Name = 'AwardedOn')) BEGIN
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
            '72f75915-79e2-486b-a555-d4a506863b8a',
            '23916A8E-3487-4793-9E18-C209EF097E58', -- Entity: MoreCheese: Member Certifications
            100007,
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

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = 'dfdf741d-523d-4ae0-94ba-b2c44214fc06' OR (EntityID = '23916A8E-3487-4793-9E18-C209EF097E58' AND Name = 'ExpiresOn')) BEGIN
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
            'dfdf741d-523d-4ae0-94ba-b2c44214fc06',
            '23916A8E-3487-4793-9E18-C209EF097E58', -- Entity: MoreCheese: Member Certifications
            100008,
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

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '98e96508-da31-4439-8658-314178424980' OR (EntityID = '23916A8E-3487-4793-9E18-C209EF097E58' AND Name = 'IsSharedDemo')) BEGIN
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
            '98e96508-da31-4439-8658-314178424980',
            '23916A8E-3487-4793-9E18-C209EF097E58', -- Entity: MoreCheese: Member Certifications
            100009,
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

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = 'a564a588-f10c-44c4-a1b2-5f4d4128ca2e' OR (EntityID = '23916A8E-3487-4793-9E18-C209EF097E58' AND Name = '__mj_CreatedAt')) BEGIN
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
            'a564a588-f10c-44c4-a1b2-5f4d4128ca2e',
            '23916A8E-3487-4793-9E18-C209EF097E58', -- Entity: MoreCheese: Member Certifications
            100010,
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

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = 'd0710e24-883f-49b3-9375-a129f210cafa' OR (EntityID = '23916A8E-3487-4793-9E18-C209EF097E58' AND Name = '__mj_UpdatedAt')) BEGIN
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
            'd0710e24-883f-49b3-9375-a129f210cafa',
            '23916A8E-3487-4793-9E18-C209EF097E58', -- Entity: MoreCheese: Member Certifications
            100011,
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

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '150a3741-7dc3-445c-9c78-85fcef7992c3' OR (EntityID = '9F493BE6-006B-4FC2-986C-D15AB527E65B' AND Name = 'ID')) BEGIN
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
            '150a3741-7dc3-445c-9c78-85fcef7992c3',
            '9F493BE6-006B-4FC2-986C-D15AB527E65B', -- Entity: MoreCheese: Competition Entries
            100001,
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

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '288c5441-ce57-45f4-9955-3aa3e52db704' OR (EntityID = '9F493BE6-006B-4FC2-986C-D15AB527E65B' AND Name = 'EntryKey')) BEGIN
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
            '288c5441-ce57-45f4-9955-3aa3e52db704',
            '9F493BE6-006B-4FC2-986C-D15AB527E65B', -- Entity: MoreCheese: Competition Entries
            100002,
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

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '92dd1df5-83c7-487a-8b9b-99e263c5875e' OR (EntityID = '9F493BE6-006B-4FC2-986C-D15AB527E65B' AND Name = 'PersonID')) BEGIN
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
            '92dd1df5-83c7-487a-8b9b-99e263c5875e',
            '9F493BE6-006B-4FC2-986C-D15AB527E65B', -- Entity: MoreCheese: Competition Entries
            100003,
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

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '46d0584d-8063-41c5-9684-cc8371f28e4b' OR (EntityID = '9F493BE6-006B-4FC2-986C-D15AB527E65B' AND Name = 'OrganizationID')) BEGIN
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
            '46d0584d-8063-41c5-9684-cc8371f28e4b',
            '9F493BE6-006B-4FC2-986C-D15AB527E65B', -- Entity: MoreCheese: Competition Entries
            100004,
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

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = 'ef4319ff-b470-44f1-8931-dc182fbabf11' OR (EntityID = '9F493BE6-006B-4FC2-986C-D15AB527E65B' AND Name = 'EntryYear')) BEGIN
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
            'ef4319ff-b470-44f1-8931-dc182fbabf11',
            '9F493BE6-006B-4FC2-986C-D15AB527E65B', -- Entity: MoreCheese: Competition Entries
            100005,
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

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = 'a2129745-3476-4908-aaaa-35fd4a4ca92b' OR (EntityID = '9F493BE6-006B-4FC2-986C-D15AB527E65B' AND Name = 'Category')) BEGIN
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
            'a2129745-3476-4908-aaaa-35fd4a4ca92b',
            '9F493BE6-006B-4FC2-986C-D15AB527E65B', -- Entity: MoreCheese: Competition Entries
            100006,
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

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '9b0d5bca-163b-40b3-9268-1ef5cee4483f' OR (EntityID = '9F493BE6-006B-4FC2-986C-D15AB527E65B' AND Name = 'ProductName')) BEGIN
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
            '9b0d5bca-163b-40b3-9268-1ef5cee4483f',
            '9F493BE6-006B-4FC2-986C-D15AB527E65B', -- Entity: MoreCheese: Competition Entries
            100007,
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

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '67eaf2f0-0b72-4794-8880-e0ba4f900542' OR (EntityID = '9F493BE6-006B-4FC2-986C-D15AB527E65B' AND Name = 'Result')) BEGIN
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
            '67eaf2f0-0b72-4794-8880-e0ba4f900542',
            '9F493BE6-006B-4FC2-986C-D15AB527E65B', -- Entity: MoreCheese: Competition Entries
            100008,
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

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '92f08fb2-a82c-4149-8893-1a3c78d2c932' OR (EntityID = '9F493BE6-006B-4FC2-986C-D15AB527E65B' AND Name = 'IsSharedDemo')) BEGIN
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
            '92f08fb2-a82c-4149-8893-1a3c78d2c932',
            '9F493BE6-006B-4FC2-986C-D15AB527E65B', -- Entity: MoreCheese: Competition Entries
            100009,
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

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '4c2dfa3f-d838-45d9-bb6c-4861ad5d7468' OR (EntityID = '9F493BE6-006B-4FC2-986C-D15AB527E65B' AND Name = '__mj_CreatedAt')) BEGIN
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
            '4c2dfa3f-d838-45d9-bb6c-4861ad5d7468',
            '9F493BE6-006B-4FC2-986C-D15AB527E65B', -- Entity: MoreCheese: Competition Entries
            100010,
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

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '9437e481-b71e-4481-a954-a9e9932a3dfc' OR (EntityID = '9F493BE6-006B-4FC2-986C-D15AB527E65B' AND Name = '__mj_UpdatedAt')) BEGIN
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
            '9437e481-b71e-4481-a954-a9e9932a3dfc',
            '9F493BE6-006B-4FC2-986C-D15AB527E65B', -- Entity: MoreCheese: Competition Entries
            100011,
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

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = 'a04c813a-2c44-4d63-bba9-bd5b0a70cf70' OR (EntityID = 'DC863C47-C1FA-4C3F-92D1-DF7F8A7BC153' AND Name = 'ID')) BEGIN
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
            'a04c813a-2c44-4d63-bba9-bd5b0a70cf70',
            'DC863C47-C1FA-4C3F-92D1-DF7F8A7BC153', -- Entity: MoreCheese: Event Registrations
            100001,
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

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = 'ef681974-0b57-47ef-9a8c-86e058df172e' OR (EntityID = 'DC863C47-C1FA-4C3F-92D1-DF7F8A7BC153' AND Name = 'RegKey')) BEGIN
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
            'ef681974-0b57-47ef-9a8c-86e058df172e',
            'DC863C47-C1FA-4C3F-92D1-DF7F8A7BC153', -- Entity: MoreCheese: Event Registrations
            100002,
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

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '84bf9b95-cef9-4ad3-b807-95578fa1fea1' OR (EntityID = 'DC863C47-C1FA-4C3F-92D1-DF7F8A7BC153' AND Name = 'PersonID')) BEGIN
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
            '84bf9b95-cef9-4ad3-b807-95578fa1fea1',
            'DC863C47-C1FA-4C3F-92D1-DF7F8A7BC153', -- Entity: MoreCheese: Event Registrations
            100003,
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

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = 'a10b7340-6a2d-430c-8587-1bf283644d8c' OR (EntityID = 'DC863C47-C1FA-4C3F-92D1-DF7F8A7BC153' AND Name = 'EventID')) BEGIN
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
            'a10b7340-6a2d-430c-8587-1bf283644d8c',
            'DC863C47-C1FA-4C3F-92D1-DF7F8A7BC153', -- Entity: MoreCheese: Event Registrations
            100004,
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
            'CB9A5230-39C0-49EE-A5BC-238D3536B39B',
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

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = 'aa10bba2-6c17-42af-9228-4d7585f38d3a' OR (EntityID = 'DC863C47-C1FA-4C3F-92D1-DF7F8A7BC153' AND Name = 'RegisteredOn')) BEGIN
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
            'aa10bba2-6c17-42af-9228-4d7585f38d3a',
            'DC863C47-C1FA-4C3F-92D1-DF7F8A7BC153', -- Entity: MoreCheese: Event Registrations
            100005,
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

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = 'c6260bbf-d011-4db0-843b-d262a7868c5d' OR (EntityID = 'DC863C47-C1FA-4C3F-92D1-DF7F8A7BC153' AND Name = 'Attended')) BEGIN
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
            'c6260bbf-d011-4db0-843b-d262a7868c5d',
            'DC863C47-C1FA-4C3F-92D1-DF7F8A7BC153', -- Entity: MoreCheese: Event Registrations
            100006,
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

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = 'f297f16c-1253-4c19-ada4-db257ae91646' OR (EntityID = 'DC863C47-C1FA-4C3F-92D1-DF7F8A7BC153' AND Name = 'IsSharedDemo')) BEGIN
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
            'f297f16c-1253-4c19-ada4-db257ae91646',
            'DC863C47-C1FA-4C3F-92D1-DF7F8A7BC153', -- Entity: MoreCheese: Event Registrations
            100007,
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

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = 'b644deb4-d341-46ae-a6e6-db2daeef5125' OR (EntityID = 'DC863C47-C1FA-4C3F-92D1-DF7F8A7BC153' AND Name = '__mj_CreatedAt')) BEGIN
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
            'b644deb4-d341-46ae-a6e6-db2daeef5125',
            'DC863C47-C1FA-4C3F-92D1-DF7F8A7BC153', -- Entity: MoreCheese: Event Registrations
            100008,
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

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = 'b6b112fe-d8fd-425d-8df1-c0c603fba7e5' OR (EntityID = 'DC863C47-C1FA-4C3F-92D1-DF7F8A7BC153' AND Name = '__mj_UpdatedAt')) BEGIN
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
            'b6b112fe-d8fd-425d-8df1-c0c603fba7e5',
            'DC863C47-C1FA-4C3F-92D1-DF7F8A7BC153', -- Entity: MoreCheese: Event Registrations
            100009,
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

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '292d9b4b-ce3f-44e5-b516-06561f9c5b16' OR (EntityID = '428C670F-EBE3-41E6-86E4-EB5A274960A1' AND Name = 'ID')) BEGIN
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
            '292d9b4b-ce3f-44e5-b516-06561f9c5b16',
            '428C670F-EBE3-41E6-86E4-EB5A274960A1', -- Entity: MoreCheese: Course Enrollments
            100001,
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

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = 'a305a1dc-0f32-436c-8371-6788f4291f90' OR (EntityID = '428C670F-EBE3-41E6-86E4-EB5A274960A1' AND Name = 'EnrollKey')) BEGIN
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
            'a305a1dc-0f32-436c-8371-6788f4291f90',
            '428C670F-EBE3-41E6-86E4-EB5A274960A1', -- Entity: MoreCheese: Course Enrollments
            100002,
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

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = 'ac3e81fa-c066-4370-8fae-80d5754f5320' OR (EntityID = '428C670F-EBE3-41E6-86E4-EB5A274960A1' AND Name = 'PersonID')) BEGIN
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
            'ac3e81fa-c066-4370-8fae-80d5754f5320',
            '428C670F-EBE3-41E6-86E4-EB5A274960A1', -- Entity: MoreCheese: Course Enrollments
            100003,
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

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = 'cc41734d-83ee-421b-9d1f-b7bbce05e0de' OR (EntityID = '428C670F-EBE3-41E6-86E4-EB5A274960A1' AND Name = 'CourseID')) BEGIN
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
            'cc41734d-83ee-421b-9d1f-b7bbce05e0de',
            '428C670F-EBE3-41E6-86E4-EB5A274960A1', -- Entity: MoreCheese: Course Enrollments
            100004,
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
            'A3E60AF2-D7CA-407E-A1D3-34320E851892',
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

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = 'f0462571-752c-4602-bd9d-58229c8d782d' OR (EntityID = '428C670F-EBE3-41E6-86E4-EB5A274960A1' AND Name = 'EnrolledOn')) BEGIN
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
            'f0462571-752c-4602-bd9d-58229c8d782d',
            '428C670F-EBE3-41E6-86E4-EB5A274960A1', -- Entity: MoreCheese: Course Enrollments
            100005,
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

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = 'faee9e23-7a30-473b-9233-17ac3fe977a2' OR (EntityID = '428C670F-EBE3-41E6-86E4-EB5A274960A1' AND Name = 'Status')) BEGIN
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
            'faee9e23-7a30-473b-9233-17ac3fe977a2',
            '428C670F-EBE3-41E6-86E4-EB5A274960A1', -- Entity: MoreCheese: Course Enrollments
            100006,
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

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '499d65a7-6992-477d-a2c2-6c2f999414b0' OR (EntityID = '428C670F-EBE3-41E6-86E4-EB5A274960A1' AND Name = 'CompletedOn')) BEGIN
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
            '499d65a7-6992-477d-a2c2-6c2f999414b0',
            '428C670F-EBE3-41E6-86E4-EB5A274960A1', -- Entity: MoreCheese: Course Enrollments
            100007,
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

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = 'ad3ec0b4-1847-4b0a-b189-4f32fcfeb7ab' OR (EntityID = '428C670F-EBE3-41E6-86E4-EB5A274960A1' AND Name = 'IsSharedDemo')) BEGIN
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
            'ad3ec0b4-1847-4b0a-b189-4f32fcfeb7ab',
            '428C670F-EBE3-41E6-86E4-EB5A274960A1', -- Entity: MoreCheese: Course Enrollments
            100008,
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

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '287358f7-8a60-4603-99f1-d103eed51761' OR (EntityID = '428C670F-EBE3-41E6-86E4-EB5A274960A1' AND Name = '__mj_CreatedAt')) BEGIN
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
            '287358f7-8a60-4603-99f1-d103eed51761',
            '428C670F-EBE3-41E6-86E4-EB5A274960A1', -- Entity: MoreCheese: Course Enrollments
            100009,
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

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '7f0e218b-cc9a-4137-a85e-06d24237be2a' OR (EntityID = '428C670F-EBE3-41E6-86E4-EB5A274960A1' AND Name = '__mj_UpdatedAt')) BEGIN
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
            '7f0e218b-cc9a-4137-a85e-06d24237be2a',
            '428C670F-EBE3-41E6-86E4-EB5A274960A1', -- Entity: MoreCheese: Course Enrollments
            100010,
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

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '5fef500f-8b34-4d32-b53b-26d490bb7353' OR (EntityID = 'A05CC658-F8D8-476E-8E84-F2022C6DFEF9' AND Name = 'ID')) BEGIN
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
            '5fef500f-8b34-4d32-b53b-26d490bb7353',
            'A05CC658-F8D8-476E-8E84-F2022C6DFEF9', -- Entity: MoreCheese: Products
            100001,
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

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = 'aee3a787-7a62-45d0-a04f-3a035435e920' OR (EntityID = 'A05CC658-F8D8-476E-8E84-F2022C6DFEF9' AND Name = 'ProductKey')) BEGIN
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
            'aee3a787-7a62-45d0-a04f-3a035435e920',
            'A05CC658-F8D8-476E-8E84-F2022C6DFEF9', -- Entity: MoreCheese: Products
            100002,
            'ProductKey',
            'Product Key',
            'Business key (e.g. PROD-MEM-INDIVIDUAL); UUIDs derive from it',
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

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '48b2653c-1607-4f46-8dd4-fc265c0fb419' OR (EntityID = 'A05CC658-F8D8-476E-8E84-F2022C6DFEF9' AND Name = 'Name')) BEGIN
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
            '48b2653c-1607-4f46-8dd4-fc265c0fb419',
            'A05CC658-F8D8-476E-8E84-F2022C6DFEF9', -- Entity: MoreCheese: Products
            100003,
            'Name',
            'Name',
            'Product display name',
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

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = 'cb587108-c61e-46ab-9eeb-f315e3313e02' OR (EntityID = 'A05CC658-F8D8-476E-8E84-F2022C6DFEF9' AND Name = 'ProductType')) BEGIN
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
            'cb587108-c61e-46ab-9eeb-f315e3313e02',
            'A05CC658-F8D8-476E-8E84-F2022C6DFEF9', -- Entity: MoreCheese: Products
            100004,
            'ProductType',
            'Product Type',
            'Membership (annual dues per tier) or Event (registration)',
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

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '49c182be-f762-43e9-8b91-228764cedec4' OR (EntityID = 'A05CC658-F8D8-476E-8E84-F2022C6DFEF9' AND Name = 'UnitPrice')) BEGIN
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
            '49c182be-f762-43e9-8b91-228764cedec4',
            'A05CC658-F8D8-476E-8E84-F2022C6DFEF9', -- Entity: MoreCheese: Products
            100005,
            'UnitPrice',
            'Unit Price',
            'List price in USD',
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

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '9235bfb5-a5da-4034-9ec3-5c82b8ca87f7' OR (EntityID = 'A05CC658-F8D8-476E-8E84-F2022C6DFEF9' AND Name = 'IsSharedDemo')) BEGIN
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
            '9235bfb5-a5da-4034-9ec3-5c82b8ca87f7',
            'A05CC658-F8D8-476E-8E84-F2022C6DFEF9', -- Entity: MoreCheese: Products
            100006,
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

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = 'b25281d3-b4e2-4eea-9ffe-9b5b6900dfe6' OR (EntityID = 'A05CC658-F8D8-476E-8E84-F2022C6DFEF9' AND Name = '__mj_CreatedAt')) BEGIN
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
            'b25281d3-b4e2-4eea-9ffe-9b5b6900dfe6',
            'A05CC658-F8D8-476E-8E84-F2022C6DFEF9', -- Entity: MoreCheese: Products
            100007,
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

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '725876e4-aa1e-4933-818a-83382ff36989' OR (EntityID = 'A05CC658-F8D8-476E-8E84-F2022C6DFEF9' AND Name = '__mj_UpdatedAt')) BEGIN
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
            '725876e4-aa1e-4933-818a-83382ff36989',
            'A05CC658-F8D8-476E-8E84-F2022C6DFEF9', -- Entity: MoreCheese: Products
            100008,
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

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '7551e6a6-b172-402f-a324-38624139ff2b' OR (EntityID = 'B5027754-CB75-4789-AA34-F71B815F0933' AND Name = 'ID')) BEGIN
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
            '7551e6a6-b172-402f-a324-38624139ff2b',
            'B5027754-CB75-4789-AA34-F71B815F0933', -- Entity: MoreCheese: Order Lines
            100001,
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

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '68d80a17-35f6-46d0-bd4e-00f84a8e96e4' OR (EntityID = 'B5027754-CB75-4789-AA34-F71B815F0933' AND Name = 'OrderID')) BEGIN
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
            '68d80a17-35f6-46d0-bd4e-00f84a8e96e4',
            'B5027754-CB75-4789-AA34-F71B815F0933', -- Entity: MoreCheese: Order Lines
            100002,
            'OrderID',
            'Order ID',
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
            '81B84F0D-7A7A-4897-A8F3-08EB40A09B51',
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

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '300c666f-4892-473f-a922-8291ad71fd5d' OR (EntityID = 'B5027754-CB75-4789-AA34-F71B815F0933' AND Name = 'ProductID')) BEGIN
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
            '300c666f-4892-473f-a922-8291ad71fd5d',
            'B5027754-CB75-4789-AA34-F71B815F0933', -- Entity: MoreCheese: Order Lines
            100003,
            'ProductID',
            'Product ID',
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
            'A05CC658-F8D8-476E-8E84-F2022C6DFEF9',
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

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '9fd3a8d4-ac33-4591-9c89-b3ed652426a3' OR (EntityID = 'B5027754-CB75-4789-AA34-F71B815F0933' AND Name = 'Quantity')) BEGIN
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
            '9fd3a8d4-ac33-4591-9c89-b3ed652426a3',
            'B5027754-CB75-4789-AA34-F71B815F0933', -- Entity: MoreCheese: Order Lines
            100004,
            'Quantity',
            'Quantity',
            'Line quantity (1 in the demo slice)',
            'int',
            4,
            10,
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

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '22145de3-fd2b-4f3a-ab92-05b39171de04' OR (EntityID = 'B5027754-CB75-4789-AA34-F71B815F0933' AND Name = 'UnitPrice')) BEGIN
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
            '22145de3-fd2b-4f3a-ab92-05b39171de04',
            'B5027754-CB75-4789-AA34-F71B815F0933', -- Entity: MoreCheese: Order Lines
            100005,
            'UnitPrice',
            'Unit Price',
            'Line unit price in USD',
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

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '2582e682-7bae-4f60-b083-c7fcdc51a71a' OR (EntityID = 'B5027754-CB75-4789-AA34-F71B815F0933' AND Name = 'LineTotal')) BEGIN
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
            '2582e682-7bae-4f60-b083-c7fcdc51a71a',
            'B5027754-CB75-4789-AA34-F71B815F0933', -- Entity: MoreCheese: Order Lines
            100006,
            'LineTotal',
            'Line Total',
            'Quantity × UnitPrice, in USD',
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

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '8e236ce4-fc66-4fd2-aaae-b4783f8e043a' OR (EntityID = 'B5027754-CB75-4789-AA34-F71B815F0933' AND Name = 'IsSharedDemo')) BEGIN
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
            '8e236ce4-fc66-4fd2-aaae-b4783f8e043a',
            'B5027754-CB75-4789-AA34-F71B815F0933', -- Entity: MoreCheese: Order Lines
            100007,
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

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '29359d27-a691-43e7-a3ff-4e4ab0666eb3' OR (EntityID = 'B5027754-CB75-4789-AA34-F71B815F0933' AND Name = '__mj_CreatedAt')) BEGIN
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
            '29359d27-a691-43e7-a3ff-4e4ab0666eb3',
            'B5027754-CB75-4789-AA34-F71B815F0933', -- Entity: MoreCheese: Order Lines
            100008,
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

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '5b69bb01-7195-41b6-a370-4a3ae528ca94' OR (EntityID = 'B5027754-CB75-4789-AA34-F71B815F0933' AND Name = '__mj_UpdatedAt')) BEGIN
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
            '5b69bb01-7195-41b6-a370-4a3ae528ca94',
            'B5027754-CB75-4789-AA34-F71B815F0933', -- Entity: MoreCheese: Order Lines
            100009,
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

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '8b0403a8-0517-4aa3-93ac-aea730576a3d' OR (EntityID = 'A3D95071-B312-40E2-AEF3-F90D8EF881AD' AND Name = 'ID')) BEGIN
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
            '8b0403a8-0517-4aa3-93ac-aea730576a3d',
            'A3D95071-B312-40E2-AEF3-F90D8EF881AD', -- Entity: MoreCheese: Organization Profiles
            100001,
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

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '1a222081-1065-4574-9e04-e94d98517c15' OR (EntityID = 'A3D95071-B312-40E2-AEF3-F90D8EF881AD' AND Name = 'OrganizationID')) BEGIN
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
            '1a222081-1065-4574-9e04-e94d98517c15',
            'A3D95071-B312-40E2-AEF3-F90D8EF881AD', -- Entity: MoreCheese: Organization Profiles
            100002,
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

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '374c2bb9-65d2-43da-a546-0c196254ca7e' OR (EntityID = 'A3D95071-B312-40E2-AEF3-F90D8EF881AD' AND Name = 'OrgKey')) BEGIN
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
            '374c2bb9-65d2-43da-a546-0c196254ca7e',
            'A3D95071-B312-40E2-AEF3-F90D8EF881AD', -- Entity: MoreCheese: Organization Profiles
            100003,
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

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '6de789b0-6c3c-4773-90a6-5db6cfbe3c3e' OR (EntityID = 'A3D95071-B312-40E2-AEF3-F90D8EF881AD' AND Name = 'Type')) BEGIN
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
            '6de789b0-6c3c-4773-90a6-5db6cfbe3c3e',
            'A3D95071-B312-40E2-AEF3-F90D8EF881AD', -- Entity: MoreCheese: Organization Profiles
            100004,
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

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '57f15499-1fef-42ea-b670-39b2dc619eec' OR (EntityID = 'A3D95071-B312-40E2-AEF3-F90D8EF881AD' AND Name = 'Region')) BEGIN
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
            '57f15499-1fef-42ea-b670-39b2dc619eec',
            'A3D95071-B312-40E2-AEF3-F90D8EF881AD', -- Entity: MoreCheese: Organization Profiles
            100005,
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

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '684bf7fe-98e7-49d0-b09a-683437c9a001' OR (EntityID = 'A3D95071-B312-40E2-AEF3-F90D8EF881AD' AND Name = 'City')) BEGIN
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
            '684bf7fe-98e7-49d0-b09a-683437c9a001',
            'A3D95071-B312-40E2-AEF3-F90D8EF881AD', -- Entity: MoreCheese: Organization Profiles
            100006,
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

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '433f7946-73d6-4c5d-914e-df56e9feb40c' OR (EntityID = 'A3D95071-B312-40E2-AEF3-F90D8EF881AD' AND Name = 'State')) BEGIN
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
            '433f7946-73d6-4c5d-914e-df56e9feb40c',
            'A3D95071-B312-40E2-AEF3-F90D8EF881AD', -- Entity: MoreCheese: Organization Profiles
            100007,
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

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = 'd9a30ae8-3a82-4695-8179-3aa94d94c2b9' OR (EntityID = 'A3D95071-B312-40E2-AEF3-F90D8EF881AD' AND Name = 'Latitude')) BEGIN
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
            'd9a30ae8-3a82-4695-8179-3aa94d94c2b9',
            'A3D95071-B312-40E2-AEF3-F90D8EF881AD', -- Entity: MoreCheese: Organization Profiles
            100008,
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

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '57a89403-376e-431f-a585-550b647db7fa' OR (EntityID = 'A3D95071-B312-40E2-AEF3-F90D8EF881AD' AND Name = 'Longitude')) BEGIN
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
            '57a89403-376e-431f-a585-550b647db7fa',
            'A3D95071-B312-40E2-AEF3-F90D8EF881AD', -- Entity: MoreCheese: Organization Profiles
            100009,
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

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '3f53b245-8f1d-4b8a-ad6b-86f536a22dea' OR (EntityID = 'A3D95071-B312-40E2-AEF3-F90D8EF881AD' AND Name = 'LifecycleEventKind')) BEGIN
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
            '3f53b245-8f1d-4b8a-ad6b-86f536a22dea',
            'A3D95071-B312-40E2-AEF3-F90D8EF881AD', -- Entity: MoreCheese: Organization Profiles
            100010,
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

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = 'cec6f5e5-c9cd-454c-80a8-9d931d76aa8a' OR (EntityID = 'A3D95071-B312-40E2-AEF3-F90D8EF881AD' AND Name = 'LifecycleEventYear')) BEGIN
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
            'cec6f5e5-c9cd-454c-80a8-9d931d76aa8a',
            'A3D95071-B312-40E2-AEF3-F90D8EF881AD', -- Entity: MoreCheese: Organization Profiles
            100011,
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

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '45632549-2e22-4529-bffe-4e429e6e530e' OR (EntityID = 'A3D95071-B312-40E2-AEF3-F90D8EF881AD' AND Name = 'IsSharedDemo')) BEGIN
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
            '45632549-2e22-4529-bffe-4e429e6e530e',
            'A3D95071-B312-40E2-AEF3-F90D8EF881AD', -- Entity: MoreCheese: Organization Profiles
            100012,
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

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '77174356-130f-4b1c-9ff8-6ffaf85cc4a3' OR (EntityID = 'A3D95071-B312-40E2-AEF3-F90D8EF881AD' AND Name = '__mj_CreatedAt')) BEGIN
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
            '77174356-130f-4b1c-9ff8-6ffaf85cc4a3',
            'A3D95071-B312-40E2-AEF3-F90D8EF881AD', -- Entity: MoreCheese: Organization Profiles
            100013,
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

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '07cb786f-f415-4ed4-899d-1a6964f53b85' OR (EntityID = 'A3D95071-B312-40E2-AEF3-F90D8EF881AD' AND Name = '__mj_UpdatedAt')) BEGIN
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
            '07cb786f-f415-4ed4-899d-1a6964f53b85',
            'A3D95071-B312-40E2-AEF3-F90D8EF881AD', -- Entity: MoreCheese: Organization Profiles
            100014,
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

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '8b7e1dab-fca3-438e-a28d-a5727b8d2e26' OR (EntityID = 'AF2F0CF6-F5BE-4769-B43A-FE3066DEFC44' AND Name = 'ID')) BEGIN
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
            '8b7e1dab-fca3-438e-a28d-a5727b8d2e26',
            'AF2F0CF6-F5BE-4769-B43A-FE3066DEFC44', -- Entity: MoreCheese: Payments
            100001,
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

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '25b38840-3bbc-4cfd-83af-86b40c774249' OR (EntityID = 'AF2F0CF6-F5BE-4769-B43A-FE3066DEFC44' AND Name = 'OrderID')) BEGIN
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
            '25b38840-3bbc-4cfd-83af-86b40c774249',
            'AF2F0CF6-F5BE-4769-B43A-FE3066DEFC44', -- Entity: MoreCheese: Payments
            100002,
            'OrderID',
            'Order ID',
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
            '81B84F0D-7A7A-4897-A8F3-08EB40A09B51',
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

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '8af0231b-d452-422c-97fb-af85bcc3dabd' OR (EntityID = 'AF2F0CF6-F5BE-4769-B43A-FE3066DEFC44' AND Name = 'Amount')) BEGIN
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
            '8af0231b-d452-422c-97fb-af85bcc3dabd',
            'AF2F0CF6-F5BE-4769-B43A-FE3066DEFC44', -- Entity: MoreCheese: Payments
            100003,
            'Amount',
            'Amount',
            'Payment amount in USD (full payment; no partials in the demo slice)',
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

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = 'f29f8278-cda2-4be2-b0cc-702b63f96a0e' OR (EntityID = 'AF2F0CF6-F5BE-4769-B43A-FE3066DEFC44' AND Name = 'PaymentDate')) BEGIN
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
            'f29f8278-cda2-4be2-b0cc-702b63f96a0e',
            'AF2F0CF6-F5BE-4769-B43A-FE3066DEFC44', -- Entity: MoreCheese: Payments
            100004,
            'PaymentDate',
            'Payment Date',
            'Date the payment landed, per the declared payment-timing profiles',
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

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = 'd37f54d1-5b6c-4a46-baa0-7be1189adb7d' OR (EntityID = 'AF2F0CF6-F5BE-4769-B43A-FE3066DEFC44' AND Name = 'Method')) BEGIN
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
            'd37f54d1-5b6c-4a46-baa0-7be1189adb7d',
            'AF2F0CF6-F5BE-4769-B43A-FE3066DEFC44', -- Entity: MoreCheese: Payments
            100005,
            'Method',
            'Method',
            'CreditCard, ACH, Check, or Wire (business tiers pay on net terms)',
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

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '12aebf68-f3fd-4836-b8cf-4d903f8e2fe8' OR (EntityID = 'AF2F0CF6-F5BE-4769-B43A-FE3066DEFC44' AND Name = 'Status')) BEGIN
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
            '12aebf68-f3fd-4836-b8cf-4d903f8e2fe8',
            'AF2F0CF6-F5BE-4769-B43A-FE3066DEFC44', -- Entity: MoreCheese: Payments
            100006,
            'Status',
            'Status',
            'Captured (Failed/Refunded reserved for future stories)',
            'nvarchar',
            100,
            0,
            0,
            0,
            'Captured',
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

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '533f6c5a-9678-4241-8a40-9396045cf234' OR (EntityID = 'AF2F0CF6-F5BE-4769-B43A-FE3066DEFC44' AND Name = 'IsSharedDemo')) BEGIN
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
            '533f6c5a-9678-4241-8a40-9396045cf234',
            'AF2F0CF6-F5BE-4769-B43A-FE3066DEFC44', -- Entity: MoreCheese: Payments
            100007,
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

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = 'f0cc4563-5c70-42a0-a36f-ec1f25ed1892' OR (EntityID = 'AF2F0CF6-F5BE-4769-B43A-FE3066DEFC44' AND Name = '__mj_CreatedAt')) BEGIN
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
            'f0cc4563-5c70-42a0-a36f-ec1f25ed1892',
            'AF2F0CF6-F5BE-4769-B43A-FE3066DEFC44', -- Entity: MoreCheese: Payments
            100008,
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

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '7eea03f4-ef62-491a-876a-f88d10a73861' OR (EntityID = 'AF2F0CF6-F5BE-4769-B43A-FE3066DEFC44' AND Name = '__mj_UpdatedAt')) BEGIN
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
            '7eea03f4-ef62-491a-876a-f88d10a73861',
            'AF2F0CF6-F5BE-4769-B43A-FE3066DEFC44', -- Entity: MoreCheese: Payments
            100009,
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
EXEC [${mjSchema}].[spUpdateExistingEntityFieldsFromSchema] @ExcludedSchemaNames='sys,staging,dbo,${mjSchema},${mjSchema}_UDT,sample_app,AssociationDemo,Bookstore,${mjSchema}_BizAppsCommon,${mjSchema}_BizAppsTasks,${mjSchema}_BizAppsCommittees,${mjSchema}_BizAppsForms,${mjSchema}_BizAppsIssues,secure_messaging,${mjSchema}';

/* SQL text to set default column width where needed */
EXEC [${mjSchema}].[spSetDefaultColumnWidthWhereNeeded] @ExcludedSchemaNames='sys,staging,dbo,${mjSchema},${mjSchema}_UDT,sample_app,AssociationDemo,Bookstore,${mjSchema}_BizAppsCommon,${mjSchema}_BizAppsTasks,${mjSchema}_BizAppsCommittees,${mjSchema}_BizAppsForms,${mjSchema}_BizAppsIssues,secure_messaging,${mjSchema}';

/* SQL text to insert entity field value with ID 8120ae6e-cbe3-452f-9a1f-2a7d17593948 */
INSERT INTO [${mjSchema}].[EntityFieldValue]
                                       ([ID], [EntityFieldID], [Sequence], [Value], [Code], [__mj_CreatedAt], [__mj_UpdatedAt])
                                    VALUES
                                       ('8120ae6e-cbe3-452f-9a1f-2a7d17593948', 'CB587108-C61E-46AB-9EEB-F315E3313E02', 1, 'Event', 'Event', GETUTCDATE(), GETUTCDATE());

/* SQL text to insert entity field value with ID 15056f8a-41fb-42bc-898f-d2b8f10219e2 */
INSERT INTO [${mjSchema}].[EntityFieldValue]
                                       ([ID], [EntityFieldID], [Sequence], [Value], [Code], [__mj_CreatedAt], [__mj_UpdatedAt])
                                    VALUES
                                       ('15056f8a-41fb-42bc-898f-d2b8f10219e2', 'CB587108-C61E-46AB-9EEB-F315E3313E02', 2, 'Membership', 'Membership', GETUTCDATE(), GETUTCDATE());

/* SQL text to update ValueListType for entity field ID CB587108-C61E-46AB-9EEB-F315E3313E02 */
UPDATE [${mjSchema}].[EntityField] SET ValueListType='List' WHERE ID='CB587108-C61E-46AB-9EEB-F315E3313E02';

/* SQL text to insert entity field value with ID cfc345fb-1ad2-4bb9-9ab9-afd4f4983f5e */
INSERT INTO [${mjSchema}].[EntityFieldValue]
                                       ([ID], [EntityFieldID], [Sequence], [Value], [Code], [__mj_CreatedAt], [__mj_UpdatedAt])
                                    VALUES
                                       ('cfc345fb-1ad2-4bb9-9ab9-afd4f4983f5e', '7A3D85EC-4344-4268-9A5E-52126D42A750', 1, 'Overdue', 'Overdue', GETUTCDATE(), GETUTCDATE());

/* SQL text to insert entity field value with ID e246e127-f433-46c1-9465-9ed231f0b5ff */
INSERT INTO [${mjSchema}].[EntityFieldValue]
                                       ([ID], [EntityFieldID], [Sequence], [Value], [Code], [__mj_CreatedAt], [__mj_UpdatedAt])
                                    VALUES
                                       ('e246e127-f433-46c1-9465-9ed231f0b5ff', '7A3D85EC-4344-4268-9A5E-52126D42A750', 2, 'Paid', 'Paid', GETUTCDATE(), GETUTCDATE());

/* SQL text to insert entity field value with ID 391273db-f77b-41b4-af10-55060dff9a65 */
INSERT INTO [${mjSchema}].[EntityFieldValue]
                                       ([ID], [EntityFieldID], [Sequence], [Value], [Code], [__mj_CreatedAt], [__mj_UpdatedAt])
                                    VALUES
                                       ('391273db-f77b-41b4-af10-55060dff9a65', '7A3D85EC-4344-4268-9A5E-52126D42A750', 3, 'Unpaid', 'Unpaid', GETUTCDATE(), GETUTCDATE());

/* SQL text to update ValueListType for entity field ID 7A3D85EC-4344-4268-9A5E-52126D42A750 */
UPDATE [${mjSchema}].[EntityField] SET ValueListType='List' WHERE ID='7A3D85EC-4344-4268-9A5E-52126D42A750';

/* SQL text to insert entity field value with ID 9ef9d1f0-86b4-4835-8fb0-f7558aa71878 */
INSERT INTO [${mjSchema}].[EntityFieldValue]
                                       ([ID], [EntityFieldID], [Sequence], [Value], [Code], [__mj_CreatedAt], [__mj_UpdatedAt])
                                    VALUES
                                       ('9ef9d1f0-86b4-4835-8fb0-f7558aa71878', 'D37F54D1-5B6C-4A46-BAA0-7BE1189ADB7D', 1, 'ACH', 'ACH', GETUTCDATE(), GETUTCDATE());

/* SQL text to insert entity field value with ID 93ae5b22-9aa7-4b07-9830-7ddbc81a5d98 */
INSERT INTO [${mjSchema}].[EntityFieldValue]
                                       ([ID], [EntityFieldID], [Sequence], [Value], [Code], [__mj_CreatedAt], [__mj_UpdatedAt])
                                    VALUES
                                       ('93ae5b22-9aa7-4b07-9830-7ddbc81a5d98', 'D37F54D1-5B6C-4A46-BAA0-7BE1189ADB7D', 2, 'Check', 'Check', GETUTCDATE(), GETUTCDATE());

/* SQL text to insert entity field value with ID e44f1685-9ef7-404a-bd3c-0f45ce00e2cb */
INSERT INTO [${mjSchema}].[EntityFieldValue]
                                       ([ID], [EntityFieldID], [Sequence], [Value], [Code], [__mj_CreatedAt], [__mj_UpdatedAt])
                                    VALUES
                                       ('e44f1685-9ef7-404a-bd3c-0f45ce00e2cb', 'D37F54D1-5B6C-4A46-BAA0-7BE1189ADB7D', 3, 'CreditCard', 'CreditCard', GETUTCDATE(), GETUTCDATE());

/* SQL text to insert entity field value with ID a71ac384-8cc5-4712-8248-e07eb9f560f9 */
INSERT INTO [${mjSchema}].[EntityFieldValue]
                                       ([ID], [EntityFieldID], [Sequence], [Value], [Code], [__mj_CreatedAt], [__mj_UpdatedAt])
                                    VALUES
                                       ('a71ac384-8cc5-4712-8248-e07eb9f560f9', 'D37F54D1-5B6C-4A46-BAA0-7BE1189ADB7D', 4, 'Wire', 'Wire', GETUTCDATE(), GETUTCDATE());

/* SQL text to update ValueListType for entity field ID D37F54D1-5B6C-4A46-BAA0-7BE1189ADB7D */
UPDATE [${mjSchema}].[EntityField] SET ValueListType='List' WHERE ID='D37F54D1-5B6C-4A46-BAA0-7BE1189ADB7D';

/* SQL text to insert entity field value with ID 337a74b0-5d7e-4d6b-81cc-cb3ff701c2d1 */
INSERT INTO [${mjSchema}].[EntityFieldValue]
                                       ([ID], [EntityFieldID], [Sequence], [Value], [Code], [__mj_CreatedAt], [__mj_UpdatedAt])
                                    VALUES
                                       ('337a74b0-5d7e-4d6b-81cc-cb3ff701c2d1', '12AEBF68-F3FD-4836-B8CF-4D903F8E2FE8', 1, 'Captured', 'Captured', GETUTCDATE(), GETUTCDATE());

/* SQL text to insert entity field value with ID 8fdce8aa-8840-4502-8482-fdf81d8c621f */
INSERT INTO [${mjSchema}].[EntityFieldValue]
                                       ([ID], [EntityFieldID], [Sequence], [Value], [Code], [__mj_CreatedAt], [__mj_UpdatedAt])
                                    VALUES
                                       ('8fdce8aa-8840-4502-8482-fdf81d8c621f', '12AEBF68-F3FD-4836-B8CF-4D903F8E2FE8', 2, 'Denied', 'Denied', GETUTCDATE(), GETUTCDATE());

/* SQL text to insert entity field value with ID 3128dba0-cbf6-4ae1-a0e8-79daa862599c */
INSERT INTO [${mjSchema}].[EntityFieldValue]
                                       ([ID], [EntityFieldID], [Sequence], [Value], [Code], [__mj_CreatedAt], [__mj_UpdatedAt])
                                    VALUES
                                       ('3128dba0-cbf6-4ae1-a0e8-79daa862599c', '12AEBF68-F3FD-4836-B8CF-4D903F8E2FE8', 3, 'Failed', 'Failed', GETUTCDATE(), GETUTCDATE());

/* SQL text to insert entity field value with ID 5fc1b148-3b8d-400e-a7cd-1e7f5e8e6cdb */
INSERT INTO [${mjSchema}].[EntityFieldValue]
                                       ([ID], [EntityFieldID], [Sequence], [Value], [Code], [__mj_CreatedAt], [__mj_UpdatedAt])
                                    VALUES
                                       ('5fc1b148-3b8d-400e-a7cd-1e7f5e8e6cdb', '12AEBF68-F3FD-4836-B8CF-4D903F8E2FE8', 4, 'InProgress', 'InProgress', GETUTCDATE(), GETUTCDATE());

/* SQL text to insert entity field value with ID 6a3c95f0-b1c1-47e6-94c3-0b0584063242 */
INSERT INTO [${mjSchema}].[EntityFieldValue]
                                       ([ID], [EntityFieldID], [Sequence], [Value], [Code], [__mj_CreatedAt], [__mj_UpdatedAt])
                                    VALUES
                                       ('6a3c95f0-b1c1-47e6-94c3-0b0584063242', '12AEBF68-F3FD-4836-B8CF-4D903F8E2FE8', 5, 'Refunded', 'Refunded', GETUTCDATE(), GETUTCDATE());

/* SQL text to update ValueListType for entity field ID 12AEBF68-F3FD-4836-B8CF-4D903F8E2FE8 */
UPDATE [${mjSchema}].[EntityField] SET ValueListType='List' WHERE ID='12AEBF68-F3FD-4836-B8CF-4D903F8E2FE8';

/* SQL text to insert entity field value with ID 8b59fb5c-7a8e-419b-857f-fa3ea41c335d */
INSERT INTO [${mjSchema}].[EntityFieldValue]
                                       ([ID], [EntityFieldID], [Sequence], [Value], [Code], [__mj_CreatedAt], [__mj_UpdatedAt])
                                    VALUES
                                       ('8b59fb5c-7a8e-419b-857f-fa3ea41c335d', 'E2A5D9ED-CA19-41D7-AAE1-476652D08C2C', 1, 'Awarded', 'Awarded', GETUTCDATE(), GETUTCDATE());

/* SQL text to insert entity field value with ID 6299da6d-3441-404c-a741-7e8bfeac3eac */
INSERT INTO [${mjSchema}].[EntityFieldValue]
                                       ([ID], [EntityFieldID], [Sequence], [Value], [Code], [__mj_CreatedAt], [__mj_UpdatedAt])
                                    VALUES
                                       ('6299da6d-3441-404c-a741-7e8bfeac3eac', 'E2A5D9ED-CA19-41D7-AAE1-476652D08C2C', 2, 'Expired', 'Expired', GETUTCDATE(), GETUTCDATE());

/* SQL text to insert entity field value with ID 23296fdd-14f2-47b4-acae-b2d9efc2457d */
INSERT INTO [${mjSchema}].[EntityFieldValue]
                                       ([ID], [EntityFieldID], [Sequence], [Value], [Code], [__mj_CreatedAt], [__mj_UpdatedAt])
                                    VALUES
                                       ('23296fdd-14f2-47b4-acae-b2d9efc2457d', 'E2A5D9ED-CA19-41D7-AAE1-476652D08C2C', 3, 'InProgress', 'InProgress', GETUTCDATE(), GETUTCDATE());

/* SQL text to insert entity field value with ID dc3aff7e-2783-4f64-beb7-d0cc55c09152 */
INSERT INTO [${mjSchema}].[EntityFieldValue]
                                       ([ID], [EntityFieldID], [Sequence], [Value], [Code], [__mj_CreatedAt], [__mj_UpdatedAt])
                                    VALUES
                                       ('dc3aff7e-2783-4f64-beb7-d0cc55c09152', 'E2A5D9ED-CA19-41D7-AAE1-476652D08C2C', 4, 'Withdrawn', 'Withdrawn', GETUTCDATE(), GETUTCDATE());

/* SQL text to update ValueListType for entity field ID E2A5D9ED-CA19-41D7-AAE1-476652D08C2C */
UPDATE [${mjSchema}].[EntityField] SET ValueListType='List' WHERE ID='E2A5D9ED-CA19-41D7-AAE1-476652D08C2C';

/* SQL text to insert entity field value with ID c0a79831-deeb-4180-a91a-89300af42421 */
INSERT INTO [${mjSchema}].[EntityFieldValue]
                                       ([ID], [EntityFieldID], [Sequence], [Value], [Code], [__mj_CreatedAt], [__mj_UpdatedAt])
                                    VALUES
                                       ('c0a79831-deeb-4180-a91a-89300af42421', '67EAF2F0-0B72-4794-8880-E0BA4F900542', 1, 'Bronze', 'Bronze', GETUTCDATE(), GETUTCDATE());

/* SQL text to insert entity field value with ID f472c34e-6d79-4618-849c-2bd59bb7c2fb */
INSERT INTO [${mjSchema}].[EntityFieldValue]
                                       ([ID], [EntityFieldID], [Sequence], [Value], [Code], [__mj_CreatedAt], [__mj_UpdatedAt])
                                    VALUES
                                       ('f472c34e-6d79-4618-849c-2bd59bb7c2fb', '67EAF2F0-0B72-4794-8880-E0BA4F900542', 2, 'Gold', 'Gold', GETUTCDATE(), GETUTCDATE());

/* SQL text to insert entity field value with ID af563974-c837-4ca0-8afe-52243e1338bf */
INSERT INTO [${mjSchema}].[EntityFieldValue]
                                       ([ID], [EntityFieldID], [Sequence], [Value], [Code], [__mj_CreatedAt], [__mj_UpdatedAt])
                                    VALUES
                                       ('af563974-c837-4ca0-8afe-52243e1338bf', '67EAF2F0-0B72-4794-8880-E0BA4F900542', 3, 'None', 'None', GETUTCDATE(), GETUTCDATE());

/* SQL text to insert entity field value with ID a286f2fb-9bfb-4cc6-8e33-77d48699a769 */
INSERT INTO [${mjSchema}].[EntityFieldValue]
                                       ([ID], [EntityFieldID], [Sequence], [Value], [Code], [__mj_CreatedAt], [__mj_UpdatedAt])
                                    VALUES
                                       ('a286f2fb-9bfb-4cc6-8e33-77d48699a769', '67EAF2F0-0B72-4794-8880-E0BA4F900542', 4, 'Silver', 'Silver', GETUTCDATE(), GETUTCDATE());

/* SQL text to update ValueListType for entity field ID 67EAF2F0-0B72-4794-8880-E0BA4F900542 */
UPDATE [${mjSchema}].[EntityField] SET ValueListType='List' WHERE ID='67EAF2F0-0B72-4794-8880-E0BA4F900542';

/* SQL text to insert entity field value with ID 1c15c74e-c7ff-4d33-8494-ddaa31ab3258 */
INSERT INTO [${mjSchema}].[EntityFieldValue]
                                       ([ID], [EntityFieldID], [Sequence], [Value], [Code], [__mj_CreatedAt], [__mj_UpdatedAt])
                                    VALUES
                                       ('1c15c74e-c7ff-4d33-8494-ddaa31ab3258', '0A8440BD-A3B6-4257-8003-DCD137773CEA', 1, 'CoalitionMeeting', 'CoalitionMeeting', GETUTCDATE(), GETUTCDATE());

/* SQL text to insert entity field value with ID ffe9a409-e9aa-425f-9e76-d63f6d2e03e0 */
INSERT INTO [${mjSchema}].[EntityFieldValue]
                                       ([ID], [EntityFieldID], [Sequence], [Value], [Code], [__mj_CreatedAt], [__mj_UpdatedAt])
                                    VALUES
                                       ('ffe9a409-e9aa-425f-9e76-d63f6d2e03e0', '0A8440BD-A3B6-4257-8003-DCD137773CEA', 2, 'LetterCampaign', 'LetterCampaign', GETUTCDATE(), GETUTCDATE());

/* SQL text to insert entity field value with ID feccc07c-e803-43d9-830e-f91f324c0374 */
INSERT INTO [${mjSchema}].[EntityFieldValue]
                                       ([ID], [EntityFieldID], [Sequence], [Value], [Code], [__mj_CreatedAt], [__mj_UpdatedAt])
                                    VALUES
                                       ('feccc07c-e803-43d9-830e-f91f324c0374', '0A8440BD-A3B6-4257-8003-DCD137773CEA', 3, 'PetitionSignature', 'PetitionSignature', GETUTCDATE(), GETUTCDATE());

/* SQL text to insert entity field value with ID 5d4e0523-8ec1-421b-a3c9-de2565fecdcf */
INSERT INTO [${mjSchema}].[EntityFieldValue]
                                       ([ID], [EntityFieldID], [Sequence], [Value], [Code], [__mj_CreatedAt], [__mj_UpdatedAt])
                                    VALUES
                                       ('5d4e0523-8ec1-421b-a3c9-de2565fecdcf', '0A8440BD-A3B6-4257-8003-DCD137773CEA', 4, 'Testimony', 'Testimony', GETUTCDATE(), GETUTCDATE());

/* SQL text to update ValueListType for entity field ID 0A8440BD-A3B6-4257-8003-DCD137773CEA */
UPDATE [${mjSchema}].[EntityField] SET ValueListType='List' WHERE ID='0A8440BD-A3B6-4257-8003-DCD137773CEA';

/* SQL text to insert entity field value with ID a186f7ac-a376-4f4e-a51f-e3101ce5b426 */
INSERT INTO [${mjSchema}].[EntityFieldValue]
                                       ([ID], [EntityFieldID], [Sequence], [Value], [Code], [__mj_CreatedAt], [__mj_UpdatedAt])
                                    VALUES
                                       ('a186f7ac-a376-4f4e-a51f-e3101ce5b426', '2450C51E-480C-4E3F-9464-82D92305E54C', 1, 'DuplicatePerson', 'DuplicatePerson', GETUTCDATE(), GETUTCDATE());

/* SQL text to insert entity field value with ID 4d790ef8-d922-4d77-adca-a275eecb027f */
INSERT INTO [${mjSchema}].[EntityFieldValue]
                                       ([ID], [EntityFieldID], [Sequence], [Value], [Code], [__mj_CreatedAt], [__mj_UpdatedAt])
                                    VALUES
                                       ('4d790ef8-d922-4d77-adca-a275eecb027f', '2450C51E-480C-4E3F-9464-82D92305E54C', 2, 'StaleEmployer', 'StaleEmployer', GETUTCDATE(), GETUTCDATE());

/* SQL text to insert entity field value with ID db8e954c-43f5-4150-8762-3bf1ec38c9c3 */
INSERT INTO [${mjSchema}].[EntityFieldValue]
                                       ([ID], [EntityFieldID], [Sequence], [Value], [Code], [__mj_CreatedAt], [__mj_UpdatedAt])
                                    VALUES
                                       ('db8e954c-43f5-4150-8762-3bf1ec38c9c3', '2450C51E-480C-4E3F-9464-82D92305E54C', 3, 'TypoEmail', 'TypoEmail', GETUTCDATE(), GETUTCDATE());

/* SQL text to update ValueListType for entity field ID 2450C51E-480C-4E3F-9464-82D92305E54C */
UPDATE [${mjSchema}].[EntityField] SET ValueListType='List' WHERE ID='2450C51E-480C-4E3F-9464-82D92305E54C';

/* SQL text to insert entity field value with ID 9c398f53-09e7-43b3-a723-1c5324b0bc32 */
INSERT INTO [${mjSchema}].[EntityFieldValue]
                                       ([ID], [EntityFieldID], [Sequence], [Value], [Code], [__mj_CreatedAt], [__mj_UpdatedAt])
                                    VALUES
                                       ('9c398f53-09e7-43b3-a723-1c5324b0bc32', '6DE789B0-6C3C-4773-90A6-5DB6CFBE3C3E', 1, 'Educator', 'Educator', GETUTCDATE(), GETUTCDATE());

/* SQL text to insert entity field value with ID 4dc0e18b-97c5-44ce-bc19-6d5dea979214 */
INSERT INTO [${mjSchema}].[EntityFieldValue]
                                       ([ID], [EntityFieldID], [Sequence], [Value], [Code], [__mj_CreatedAt], [__mj_UpdatedAt])
                                    VALUES
                                       ('4dc0e18b-97c5-44ce-bc19-6d5dea979214', '6DE789B0-6C3C-4773-90A6-5DB6CFBE3C3E', 2, 'Producer', 'Producer', GETUTCDATE(), GETUTCDATE());

/* SQL text to insert entity field value with ID 2afa69b3-b9d7-40e1-b19c-5b29d0967340 */
INSERT INTO [${mjSchema}].[EntityFieldValue]
                                       ([ID], [EntityFieldID], [Sequence], [Value], [Code], [__mj_CreatedAt], [__mj_UpdatedAt])
                                    VALUES
                                       ('2afa69b3-b9d7-40e1-b19c-5b29d0967340', '6DE789B0-6C3C-4773-90A6-5DB6CFBE3C3E', 3, 'Retailer', 'Retailer', GETUTCDATE(), GETUTCDATE());

/* SQL text to insert entity field value with ID 9e02d645-3e57-4c20-8316-79f377f753ee */
INSERT INTO [${mjSchema}].[EntityFieldValue]
                                       ([ID], [EntityFieldID], [Sequence], [Value], [Code], [__mj_CreatedAt], [__mj_UpdatedAt])
                                    VALUES
                                       ('9e02d645-3e57-4c20-8316-79f377f753ee', '6DE789B0-6C3C-4773-90A6-5DB6CFBE3C3E', 4, 'Supplier', 'Supplier', GETUTCDATE(), GETUTCDATE());

/* SQL text to update ValueListType for entity field ID 6DE789B0-6C3C-4773-90A6-5DB6CFBE3C3E */
UPDATE [${mjSchema}].[EntityField] SET ValueListType='List' WHERE ID='6DE789B0-6C3C-4773-90A6-5DB6CFBE3C3E';

/* SQL text to insert entity field value with ID 43f9413a-275d-417c-9cd8-91929c3358a7 */
INSERT INTO [${mjSchema}].[EntityFieldValue]
                                       ([ID], [EntityFieldID], [Sequence], [Value], [Code], [__mj_CreatedAt], [__mj_UpdatedAt])
                                    VALUES
                                       ('43f9413a-275d-417c-9cd8-91929c3358a7', '57F15499-1FEF-42EA-B670-39B2DC619EEC', 1, 'EU', 'EU', GETUTCDATE(), GETUTCDATE());

/* SQL text to insert entity field value with ID cd571dba-d6d7-4a61-888e-9caaaaf6f60a */
INSERT INTO [${mjSchema}].[EntityFieldValue]
                                       ([ID], [EntityFieldID], [Sequence], [Value], [Code], [__mj_CreatedAt], [__mj_UpdatedAt])
                                    VALUES
                                       ('cd571dba-d6d7-4a61-888e-9caaaaf6f60a', '57F15499-1FEF-42EA-B670-39B2DC619EEC', 2, 'NA', 'NA', GETUTCDATE(), GETUTCDATE());

/* SQL text to insert entity field value with ID 108f53ad-2890-49b4-acc2-264fe04b0418 */
INSERT INTO [${mjSchema}].[EntityFieldValue]
                                       ([ID], [EntityFieldID], [Sequence], [Value], [Code], [__mj_CreatedAt], [__mj_UpdatedAt])
                                    VALUES
                                       ('108f53ad-2890-49b4-acc2-264fe04b0418', '57F15499-1FEF-42EA-B670-39B2DC619EEC', 3, 'RoW', 'RoW', GETUTCDATE(), GETUTCDATE());

/* SQL text to update ValueListType for entity field ID 57F15499-1FEF-42EA-B670-39B2DC619EEC */
UPDATE [${mjSchema}].[EntityField] SET ValueListType='List' WHERE ID='57F15499-1FEF-42EA-B670-39B2DC619EEC';

/* SQL text to insert entity field value with ID c4284652-3fdc-4ea6-9d6d-d1a2fd26a186 */
INSERT INTO [${mjSchema}].[EntityFieldValue]
                                       ([ID], [EntityFieldID], [Sequence], [Value], [Code], [__mj_CreatedAt], [__mj_UpdatedAt])
                                    VALUES
                                       ('c4284652-3fdc-4ea6-9d6d-d1a2fd26a186', '3F53B245-8F1D-4B8A-AD6B-86F536A22DEA', 1, 'Acquired', 'Acquired', GETUTCDATE(), GETUTCDATE());

/* SQL text to insert entity field value with ID 5eb0d252-0d7a-4ca4-aa5b-d03227e2ec9e */
INSERT INTO [${mjSchema}].[EntityFieldValue]
                                       ([ID], [EntityFieldID], [Sequence], [Value], [Code], [__mj_CreatedAt], [__mj_UpdatedAt])
                                    VALUES
                                       ('5eb0d252-0d7a-4ca4-aa5b-d03227e2ec9e', '3F53B245-8F1D-4B8A-AD6B-86F536A22DEA', 2, 'Dissolved', 'Dissolved', GETUTCDATE(), GETUTCDATE());

/* SQL text to insert entity field value with ID 915616bc-d05a-451d-a664-801716cb0c0f */
INSERT INTO [${mjSchema}].[EntityFieldValue]
                                       ([ID], [EntityFieldID], [Sequence], [Value], [Code], [__mj_CreatedAt], [__mj_UpdatedAt])
                                    VALUES
                                       ('915616bc-d05a-451d-a664-801716cb0c0f', '3F53B245-8F1D-4B8A-AD6B-86F536A22DEA', 3, 'ProgramCut', 'ProgramCut', GETUTCDATE(), GETUTCDATE());

/* SQL text to update ValueListType for entity field ID 3F53B245-8F1D-4B8A-AD6B-86F536A22DEA */
UPDATE [${mjSchema}].[EntityField] SET ValueListType='List' WHERE ID='3F53B245-8F1D-4B8A-AD6B-86F536A22DEA';

/* SQL text to insert entity field value with ID 32f35c28-d39f-4adb-8d03-ad3e06c33a47 */
INSERT INTO [${mjSchema}].[EntityFieldValue]
                                       ([ID], [EntityFieldID], [Sequence], [Value], [Code], [__mj_CreatedAt], [__mj_UpdatedAt])
                                    VALUES
                                       ('32f35c28-d39f-4adb-8d03-ad3e06c33a47', 'E0442068-AE13-4CC6-A5AA-6E2EBE16EF0F', 1, 'Educator', 'Educator', GETUTCDATE(), GETUTCDATE());

/* SQL text to insert entity field value with ID 9718bc3c-490e-4d67-a722-a545ab78a81e */
INSERT INTO [${mjSchema}].[EntityFieldValue]
                                       ([ID], [EntityFieldID], [Sequence], [Value], [Code], [__mj_CreatedAt], [__mj_UpdatedAt])
                                    VALUES
                                       ('9718bc3c-490e-4d67-a722-a545ab78a81e', 'E0442068-AE13-4CC6-A5AA-6E2EBE16EF0F', 2, 'Enthusiast', 'Enthusiast', GETUTCDATE(), GETUTCDATE());

/* SQL text to insert entity field value with ID 0145fe65-de3a-43d1-919b-189e603a889c */
INSERT INTO [${mjSchema}].[EntityFieldValue]
                                       ([ID], [EntityFieldID], [Sequence], [Value], [Code], [__mj_CreatedAt], [__mj_UpdatedAt])
                                    VALUES
                                       ('0145fe65-de3a-43d1-919b-189e603a889c', 'E0442068-AE13-4CC6-A5AA-6E2EBE16EF0F', 3, 'Producer', 'Producer', GETUTCDATE(), GETUTCDATE());

/* SQL text to insert entity field value with ID 68a3b654-5e0e-491b-844f-688cbbb005c1 */
INSERT INTO [${mjSchema}].[EntityFieldValue]
                                       ([ID], [EntityFieldID], [Sequence], [Value], [Code], [__mj_CreatedAt], [__mj_UpdatedAt])
                                    VALUES
                                       ('68a3b654-5e0e-491b-844f-688cbbb005c1', 'E0442068-AE13-4CC6-A5AA-6E2EBE16EF0F', 4, 'Retailer', 'Retailer', GETUTCDATE(), GETUTCDATE());

/* SQL text to insert entity field value with ID 3d3d6689-4363-4905-9c50-bc7ae57ed687 */
INSERT INTO [${mjSchema}].[EntityFieldValue]
                                       ([ID], [EntityFieldID], [Sequence], [Value], [Code], [__mj_CreatedAt], [__mj_UpdatedAt])
                                    VALUES
                                       ('3d3d6689-4363-4905-9c50-bc7ae57ed687', 'E0442068-AE13-4CC6-A5AA-6E2EBE16EF0F', 5, 'Supplier', 'Supplier', GETUTCDATE(), GETUTCDATE());

/* SQL text to update ValueListType for entity field ID E0442068-AE13-4CC6-A5AA-6E2EBE16EF0F */
UPDATE [${mjSchema}].[EntityField] SET ValueListType='List' WHERE ID='E0442068-AE13-4CC6-A5AA-6E2EBE16EF0F';

/* SQL text to insert entity field value with ID 5dc8536b-cf8c-43f1-9181-a171ca4ace60 */
INSERT INTO [${mjSchema}].[EntityFieldValue]
                                       ([ID], [EntityFieldID], [Sequence], [Value], [Code], [__mj_CreatedAt], [__mj_UpdatedAt])
                                    VALUES
                                       ('5dc8536b-cf8c-43f1-9181-a171ca4ace60', '8FA7894D-19E6-4662-82D9-C923A8A8CA57', 1, 'EU', 'EU', GETUTCDATE(), GETUTCDATE());

/* SQL text to insert entity field value with ID c06c70de-3ea0-427f-b818-f1668fcfbe2c */
INSERT INTO [${mjSchema}].[EntityFieldValue]
                                       ([ID], [EntityFieldID], [Sequence], [Value], [Code], [__mj_CreatedAt], [__mj_UpdatedAt])
                                    VALUES
                                       ('c06c70de-3ea0-427f-b818-f1668fcfbe2c', '8FA7894D-19E6-4662-82D9-C923A8A8CA57', 2, 'NA', 'NA', GETUTCDATE(), GETUTCDATE());

/* SQL text to insert entity field value with ID ab4600a8-9caf-4d8b-892a-b7692c624ac7 */
INSERT INTO [${mjSchema}].[EntityFieldValue]
                                       ([ID], [EntityFieldID], [Sequence], [Value], [Code], [__mj_CreatedAt], [__mj_UpdatedAt])
                                    VALUES
                                       ('ab4600a8-9caf-4d8b-892a-b7692c624ac7', '8FA7894D-19E6-4662-82D9-C923A8A8CA57', 3, 'RoW', 'RoW', GETUTCDATE(), GETUTCDATE());

/* SQL text to update ValueListType for entity field ID 8FA7894D-19E6-4662-82D9-C923A8A8CA57 */
UPDATE [${mjSchema}].[EntityField] SET ValueListType='List' WHERE ID='8FA7894D-19E6-4662-82D9-C923A8A8CA57';

/* SQL text to insert entity field value with ID f3c9070d-dad0-4f73-be44-284ed21afdb9 */
INSERT INTO [${mjSchema}].[EntityFieldValue]
                                       ([ID], [EntityFieldID], [Sequence], [Value], [Code], [__mj_CreatedAt], [__mj_UpdatedAt])
                                    VALUES
                                       ('f3c9070d-dad0-4f73-be44-284ed21afdb9', '66AB3F67-D88F-4002-9601-8F45FF1E9943', 1, 'Active', 'Active', GETUTCDATE(), GETUTCDATE());

/* SQL text to insert entity field value with ID 11c519cc-bcf3-434f-854f-c94fbb548b3e */
INSERT INTO [${mjSchema}].[EntityFieldValue]
                                       ([ID], [EntityFieldID], [Sequence], [Value], [Code], [__mj_CreatedAt], [__mj_UpdatedAt])
                                    VALUES
                                       ('11c519cc-bcf3-434f-854f-c94fbb548b3e', '66AB3F67-D88F-4002-9601-8F45FF1E9943', 2, 'Cancelled', 'Cancelled', GETUTCDATE(), GETUTCDATE());

/* SQL text to insert entity field value with ID e80cd4bf-16e6-4d1d-b593-24fda93bec19 */
INSERT INTO [${mjSchema}].[EntityFieldValue]
                                       ([ID], [EntityFieldID], [Sequence], [Value], [Code], [__mj_CreatedAt], [__mj_UpdatedAt])
                                    VALUES
                                       ('e80cd4bf-16e6-4d1d-b593-24fda93bec19', '66AB3F67-D88F-4002-9601-8F45FF1E9943', 3, 'Lapsed', 'Lapsed', GETUTCDATE(), GETUTCDATE());

/* SQL text to insert entity field value with ID 96c2a1b8-be06-4674-a8ec-7a10e6d1cabe */
INSERT INTO [${mjSchema}].[EntityFieldValue]
                                       ([ID], [EntityFieldID], [Sequence], [Value], [Code], [__mj_CreatedAt], [__mj_UpdatedAt])
                                    VALUES
                                       ('96c2a1b8-be06-4674-a8ec-7a10e6d1cabe', '66AB3F67-D88F-4002-9601-8F45FF1E9943', 4, 'PendingRenewal', 'PendingRenewal', GETUTCDATE(), GETUTCDATE());

/* SQL text to insert entity field value with ID a3ee6cdc-b990-4c96-8bb9-9a932f54c4c7 */
INSERT INTO [${mjSchema}].[EntityFieldValue]
                                       ([ID], [EntityFieldID], [Sequence], [Value], [Code], [__mj_CreatedAt], [__mj_UpdatedAt])
                                    VALUES
                                       ('a3ee6cdc-b990-4c96-8bb9-9a932f54c4c7', '66AB3F67-D88F-4002-9601-8F45FF1E9943', 5, 'Renewed', 'Renewed', GETUTCDATE(), GETUTCDATE());

/* SQL text to update ValueListType for entity field ID 66AB3F67-D88F-4002-9601-8F45FF1E9943 */
UPDATE [${mjSchema}].[EntityField] SET ValueListType='List' WHERE ID='66AB3F67-D88F-4002-9601-8F45FF1E9943';

/* SQL text to insert entity field value with ID dff91253-daef-4dc4-acf6-c62d0882176c */
INSERT INTO [${mjSchema}].[EntityFieldValue]
                                       ([ID], [EntityFieldID], [Sequence], [Value], [Code], [__mj_CreatedAt], [__mj_UpdatedAt])
                                    VALUES
                                       ('dff91253-daef-4dc4-acf6-c62d0882176c', 'AF860254-0C86-4EFE-AECD-B3E11A10B73F', 1, 'Corporate', 'Corporate', GETUTCDATE(), GETUTCDATE());

/* SQL text to insert entity field value with ID ae66da9e-25ac-4282-9108-ca4fcb3932d7 */
INSERT INTO [${mjSchema}].[EntityFieldValue]
                                       ([ID], [EntityFieldID], [Sequence], [Value], [Code], [__mj_CreatedAt], [__mj_UpdatedAt])
                                    VALUES
                                       ('ae66da9e-25ac-4282-9108-ca4fcb3932d7', 'AF860254-0C86-4EFE-AECD-B3E11A10B73F', 2, 'Enthusiast', 'Enthusiast', GETUTCDATE(), GETUTCDATE());

/* SQL text to insert entity field value with ID 75a71ccb-cbdb-4516-90e2-67e2269ca57c */
INSERT INTO [${mjSchema}].[EntityFieldValue]
                                       ([ID], [EntityFieldID], [Sequence], [Value], [Code], [__mj_CreatedAt], [__mj_UpdatedAt])
                                    VALUES
                                       ('75a71ccb-cbdb-4516-90e2-67e2269ca57c', 'AF860254-0C86-4EFE-AECD-B3E11A10B73F', 3, 'Individual', 'Individual', GETUTCDATE(), GETUTCDATE());

/* SQL text to insert entity field value with ID 7bbeeb78-763f-4d1c-aafb-a9d8c87a3223 */
INSERT INTO [${mjSchema}].[EntityFieldValue]
                                       ([ID], [EntityFieldID], [Sequence], [Value], [Code], [__mj_CreatedAt], [__mj_UpdatedAt])
                                    VALUES
                                       ('7bbeeb78-763f-4d1c-aafb-a9d8c87a3223', 'AF860254-0C86-4EFE-AECD-B3E11A10B73F', 4, 'SmallBusiness', 'SmallBusiness', GETUTCDATE(), GETUTCDATE());

/* SQL text to update ValueListType for entity field ID AF860254-0C86-4EFE-AECD-B3E11A10B73F */
UPDATE [${mjSchema}].[EntityField] SET ValueListType='List' WHERE ID='AF860254-0C86-4EFE-AECD-B3E11A10B73F';

/* SQL text to insert entity field value with ID f26ce8f2-f452-41f6-ba70-aeee5c0cc5a3 */
INSERT INTO [${mjSchema}].[EntityFieldValue]
                                       ([ID], [EntityFieldID], [Sequence], [Value], [Code], [__mj_CreatedAt], [__mj_UpdatedAt])
                                    VALUES
                                       ('f26ce8f2-f452-41f6-ba70-aeee5c0cc5a3', '40E4EAC3-EDB5-4AE1-AF99-593C4D74460A', 1, 'Conference', 'Conference', GETUTCDATE(), GETUTCDATE());

/* SQL text to insert entity field value with ID beefa5b8-ad2d-4ba2-9fad-89eba8126816 */
INSERT INTO [${mjSchema}].[EntityFieldValue]
                                       ([ID], [EntityFieldID], [Sequence], [Value], [Code], [__mj_CreatedAt], [__mj_UpdatedAt])
                                    VALUES
                                       ('beefa5b8-ad2d-4ba2-9fad-89eba8126816', '40E4EAC3-EDB5-4AE1-AF99-593C4D74460A', 2, 'Webinar', 'Webinar', GETUTCDATE(), GETUTCDATE());

/* SQL text to insert entity field value with ID 6f66c9e7-a992-4ff5-a763-f7ce4638afac */
INSERT INTO [${mjSchema}].[EntityFieldValue]
                                       ([ID], [EntityFieldID], [Sequence], [Value], [Code], [__mj_CreatedAt], [__mj_UpdatedAt])
                                    VALUES
                                       ('6f66c9e7-a992-4ff5-a763-f7ce4638afac', '40E4EAC3-EDB5-4AE1-AF99-593C4D74460A', 3, 'Workshop', 'Workshop', GETUTCDATE(), GETUTCDATE());

/* SQL text to update ValueListType for entity field ID 40E4EAC3-EDB5-4AE1-AF99-593C4D74460A */
UPDATE [${mjSchema}].[EntityField] SET ValueListType='List' WHERE ID='40E4EAC3-EDB5-4AE1-AF99-593C4D74460A';

/* SQL text to insert entity field value with ID 7ea87d9a-b3c5-4f9d-b290-ef717cf9707e */
INSERT INTO [${mjSchema}].[EntityFieldValue]
                                       ([ID], [EntityFieldID], [Sequence], [Value], [Code], [__mj_CreatedAt], [__mj_UpdatedAt])
                                    VALUES
                                       ('7ea87d9a-b3c5-4f9d-b290-ef717cf9707e', 'FAEE9E23-7A30-473B-9233-17AC3FE977A2', 1, 'Completed', 'Completed', GETUTCDATE(), GETUTCDATE());

/* SQL text to insert entity field value with ID 9201153b-f20a-4ca3-8511-1f28e2a087ab */
INSERT INTO [${mjSchema}].[EntityFieldValue]
                                       ([ID], [EntityFieldID], [Sequence], [Value], [Code], [__mj_CreatedAt], [__mj_UpdatedAt])
                                    VALUES
                                       ('9201153b-f20a-4ca3-8511-1f28e2a087ab', 'FAEE9E23-7A30-473B-9233-17AC3FE977A2', 2, 'Dropped', 'Dropped', GETUTCDATE(), GETUTCDATE());

/* SQL text to insert entity field value with ID cb14cbd7-c429-46c3-bd76-d6b3ae48848f */
INSERT INTO [${mjSchema}].[EntityFieldValue]
                                       ([ID], [EntityFieldID], [Sequence], [Value], [Code], [__mj_CreatedAt], [__mj_UpdatedAt])
                                    VALUES
                                       ('cb14cbd7-c429-46c3-bd76-d6b3ae48848f', 'FAEE9E23-7A30-473B-9233-17AC3FE977A2', 3, 'InProgress', 'InProgress', GETUTCDATE(), GETUTCDATE());

/* SQL text to update ValueListType for entity field ID FAEE9E23-7A30-473B-9233-17AC3FE977A2 */
UPDATE [${mjSchema}].[EntityField] SET ValueListType='List' WHERE ID='FAEE9E23-7A30-473B-9233-17AC3FE977A2';


/* Create Entity Relationship: MoreCheese: Orders -> MoreCheese: Payments (One To Many via OrderID) */
   IF NOT EXISTS (
      SELECT 1 FROM [${mjSchema}].[EntityRelationship] WHERE [ID] = 'd65273e0-e004-4dbe-995d-9c9dc2608458'
   )
   BEGIN
      INSERT INTO [${mjSchema}].[EntityRelationship] ([ID], [EntityID], [RelatedEntityID], [RelatedEntityJoinField], [Type], [BundleInAPI], [DisplayInForm], [Sequence], [__mj_CreatedAt], [__mj_UpdatedAt])
                    VALUES ('d65273e0-e004-4dbe-995d-9c9dc2608458', '81B84F0D-7A7A-4897-A8F3-08EB40A09B51', 'AF2F0CF6-F5BE-4769-B43A-FE3066DEFC44', 'OrderID', 'One To Many', 1, 1, 1, GETUTCDATE(), GETUTCDATE())
   END;
                    
/* Create Entity Relationship: MoreCheese: Orders -> MoreCheese: Order Lines (One To Many via OrderID) */
   IF NOT EXISTS (
      SELECT 1 FROM [${mjSchema}].[EntityRelationship] WHERE [ID] = 'c1d68971-7f5d-4ef1-92b8-5a2ffc93d1b7'
   )
   BEGIN
      INSERT INTO [${mjSchema}].[EntityRelationship] ([ID], [EntityID], [RelatedEntityID], [RelatedEntityJoinField], [Type], [BundleInAPI], [DisplayInForm], [Sequence], [__mj_CreatedAt], [__mj_UpdatedAt])
                    VALUES ('c1d68971-7f5d-4ef1-92b8-5a2ffc93d1b7', '81B84F0D-7A7A-4897-A8F3-08EB40A09B51', 'B5027754-CB75-4789-AA34-F71B815F0933', 'OrderID', 'One To Many', 1, 1, 2, GETUTCDATE(), GETUTCDATE())
   END;
                    
/* Create Entity Relationship: MoreCheese: Certifications -> MoreCheese: Member Certifications (One To Many via CertificationID) */
   IF NOT EXISTS (
      SELECT 1 FROM [${mjSchema}].[EntityRelationship] WHERE [ID] = '84690c21-1027-443c-9b4f-15436244ef1f'
   )
   BEGIN
      INSERT INTO [${mjSchema}].[EntityRelationship] ([ID], [EntityID], [RelatedEntityID], [RelatedEntityJoinField], [Type], [BundleInAPI], [DisplayInForm], [Sequence], [__mj_CreatedAt], [__mj_UpdatedAt])
                    VALUES ('84690c21-1027-443c-9b4f-15436244ef1f', '49DF9400-9C38-422C-8DB6-1373D5392E35', '23916A8E-3487-4793-9E18-C209EF097E58', 'CertificationID', 'One To Many', 1, 1, 1, GETUTCDATE(), GETUTCDATE())
   END;
                    
/* Create Entity Relationship: MoreCheese: Events -> MoreCheese: Event Registrations (One To Many via EventID) */
   IF NOT EXISTS (
      SELECT 1 FROM [${mjSchema}].[EntityRelationship] WHERE [ID] = '5e9545b6-0198-41e8-87ea-2abeb8274480'
   )
   BEGIN
      INSERT INTO [${mjSchema}].[EntityRelationship] ([ID], [EntityID], [RelatedEntityID], [RelatedEntityJoinField], [Type], [BundleInAPI], [DisplayInForm], [Sequence], [__mj_CreatedAt], [__mj_UpdatedAt])
                    VALUES ('5e9545b6-0198-41e8-87ea-2abeb8274480', 'CB9A5230-39C0-49EE-A5BC-238D3536B39B', 'DC863C47-C1FA-4C3F-92D1-DF7F8A7BC153', 'EventID', 'One To Many', 1, 1, 1, GETUTCDATE(), GETUTCDATE())
   END;
                    
/* Create Entity Relationship: MoreCheese: Courses -> MoreCheese: Course Enrollments (One To Many via CourseID) */
   IF NOT EXISTS (
      SELECT 1 FROM [${mjSchema}].[EntityRelationship] WHERE [ID] = '15f5ccc6-29fe-4ffc-8406-83ec652f32bc'
   )
   BEGIN
      INSERT INTO [${mjSchema}].[EntityRelationship] ([ID], [EntityID], [RelatedEntityID], [RelatedEntityJoinField], [Type], [BundleInAPI], [DisplayInForm], [Sequence], [__mj_CreatedAt], [__mj_UpdatedAt])
                    VALUES ('15f5ccc6-29fe-4ffc-8406-83ec652f32bc', 'A3E60AF2-D7CA-407E-A1D3-34320E851892', '428C670F-EBE3-41E6-86E4-EB5A274960A1', 'CourseID', 'One To Many', 1, 1, 1, GETUTCDATE(), GETUTCDATE())
   END;


/* Create Entity Relationship: MJ_BizApps_Common: Organizations -> MoreCheese: Competition Entries (One To Many via OrganizationID) */
   IF NOT EXISTS (
      SELECT 1 FROM [${mjSchema}].[EntityRelationship] WHERE [ID] = '03564d10-1320-43fe-8b34-c4c90aaf9ad4'
   )
   BEGIN
      INSERT INTO [${mjSchema}].[EntityRelationship] ([ID], [EntityID], [RelatedEntityID], [RelatedEntityJoinField], [Type], [BundleInAPI], [DisplayInForm], [Sequence], [__mj_CreatedAt], [__mj_UpdatedAt])
                    VALUES ('03564d10-1320-43fe-8b34-c4c90aaf9ad4', 'C70448F9-9792-41D7-A82C-784B66429D54', '9F493BE6-006B-4FC2-986C-D15AB527E65B', 'OrganizationID', 'One To Many', 1, 1, 6, GETUTCDATE(), GETUTCDATE())
   END;
                    
/* Create Entity Relationship: MJ_BizApps_Common: Organizations -> MoreCheese: Data Quality Labels (One To Many via RelatedOrganizationID) */
   IF NOT EXISTS (
      SELECT 1 FROM [${mjSchema}].[EntityRelationship] WHERE [ID] = '84c7a2f1-265b-4751-af89-f49f660b38f3'
   )
   BEGIN
      INSERT INTO [${mjSchema}].[EntityRelationship] ([ID], [EntityID], [RelatedEntityID], [RelatedEntityJoinField], [Type], [BundleInAPI], [DisplayInForm], [Sequence], [__mj_CreatedAt], [__mj_UpdatedAt])
                    VALUES ('84c7a2f1-265b-4751-af89-f49f660b38f3', 'C70448F9-9792-41D7-A82C-784B66429D54', 'FF152388-ED04-4F1F-B237-94D502C4AA54', 'RelatedOrganizationID', 'One To Many', 1, 1, 7, GETUTCDATE(), GETUTCDATE())
   END;
                    
/* Create Entity Relationship: MJ_BizApps_Common: Organizations -> MoreCheese: Organization Profiles (One To Many via OrganizationID) */
   IF NOT EXISTS (
      SELECT 1 FROM [${mjSchema}].[EntityRelationship] WHERE [ID] = '3797ef6c-f545-401f-9e8d-2b246cfc8b45'
   )
   BEGIN
      INSERT INTO [${mjSchema}].[EntityRelationship] ([ID], [EntityID], [RelatedEntityID], [RelatedEntityJoinField], [Type], [BundleInAPI], [DisplayInForm], [Sequence], [__mj_CreatedAt], [__mj_UpdatedAt])
                    VALUES ('3797ef6c-f545-401f-9e8d-2b246cfc8b45', 'C70448F9-9792-41D7-A82C-784B66429D54', 'A3D95071-B312-40E2-AEF3-F90D8EF881AD', 'OrganizationID', 'One To Many', 1, 1, 8, GETUTCDATE(), GETUTCDATE())
   END;
                    
/* Create Entity Relationship: MJ_BizApps_Common: Organizations -> MoreCheese: Member Profiles (One To Many via OrganizationID) */
   IF NOT EXISTS (
      SELECT 1 FROM [${mjSchema}].[EntityRelationship] WHERE [ID] = '564dadee-7be8-46e8-bf81-8137c07a6f90'
   )
   BEGIN
      INSERT INTO [${mjSchema}].[EntityRelationship] ([ID], [EntityID], [RelatedEntityID], [RelatedEntityJoinField], [Type], [BundleInAPI], [DisplayInForm], [Sequence], [__mj_CreatedAt], [__mj_UpdatedAt])
                    VALUES ('564dadee-7be8-46e8-bf81-8137c07a6f90', 'C70448F9-9792-41D7-A82C-784B66429D54', 'BE4D97E0-48DE-4240-A09F-8B39AD4BD043', 'OrganizationID', 'One To Many', 1, 1, 9, GETUTCDATE(), GETUTCDATE())
   END;
                    
/* Create Entity Relationship: MJ_BizApps_Common: People -> MoreCheese: Data Quality Labels (One To Many via RelatedPersonID) */
   IF NOT EXISTS (
      SELECT 1 FROM [${mjSchema}].[EntityRelationship] WHERE [ID] = 'd600adaf-b3ac-444a-814e-eea9e7accdda'
   )
   BEGIN
      INSERT INTO [${mjSchema}].[EntityRelationship] ([ID], [EntityID], [RelatedEntityID], [RelatedEntityJoinField], [Type], [BundleInAPI], [DisplayInForm], [Sequence], [__mj_CreatedAt], [__mj_UpdatedAt])
                    VALUES ('d600adaf-b3ac-444a-814e-eea9e7accdda', '7A94ADA9-7880-4FAE-97D8-DB0E934C3F5F', 'FF152388-ED04-4F1F-B237-94D502C4AA54', 'RelatedPersonID', 'One To Many', 1, 1, 18, GETUTCDATE(), GETUTCDATE())
   END;
                    
/* Create Entity Relationship: MJ_BizApps_Common: People -> MoreCheese: Data Quality Labels (One To Many via PersonID) */
   IF NOT EXISTS (
      SELECT 1 FROM [${mjSchema}].[EntityRelationship] WHERE [ID] = '39a15131-5cbd-4379-89c6-ba4418459a21'
   )
   BEGIN
      INSERT INTO [${mjSchema}].[EntityRelationship] ([ID], [EntityID], [RelatedEntityID], [RelatedEntityJoinField], [Type], [BundleInAPI], [DisplayInForm], [Sequence], [__mj_CreatedAt], [__mj_UpdatedAt])
                    VALUES ('39a15131-5cbd-4379-89c6-ba4418459a21', '7A94ADA9-7880-4FAE-97D8-DB0E934C3F5F', 'FF152388-ED04-4F1F-B237-94D502C4AA54', 'PersonID', 'One To Many', 1, 1, 19, GETUTCDATE(), GETUTCDATE())
   END;


/* Create Entity Relationship: MJ_BizApps_Common: People -> MoreCheese: Member Profiles (One To Many via PersonID) */
   IF NOT EXISTS (
      SELECT 1 FROM [${mjSchema}].[EntityRelationship] WHERE [ID] = '5f0f70a2-6cf3-4b99-a54c-ba16b8bca19d'
   )
   BEGIN
      INSERT INTO [${mjSchema}].[EntityRelationship] ([ID], [EntityID], [RelatedEntityID], [RelatedEntityJoinField], [Type], [BundleInAPI], [DisplayInForm], [Sequence], [__mj_CreatedAt], [__mj_UpdatedAt])
                    VALUES ('5f0f70a2-6cf3-4b99-a54c-ba16b8bca19d', '7A94ADA9-7880-4FAE-97D8-DB0E934C3F5F', 'BE4D97E0-48DE-4240-A09F-8B39AD4BD043', 'PersonID', 'One To Many', 1, 1, 20, GETUTCDATE(), GETUTCDATE())
   END;
                    
/* Create Entity Relationship: MJ_BizApps_Common: People -> MoreCheese: Membership Periods (One To Many via PersonID) */
   IF NOT EXISTS (
      SELECT 1 FROM [${mjSchema}].[EntityRelationship] WHERE [ID] = '6a321959-cc17-4e00-807e-9da9e1fd1598'
   )
   BEGIN
      INSERT INTO [${mjSchema}].[EntityRelationship] ([ID], [EntityID], [RelatedEntityID], [RelatedEntityJoinField], [Type], [BundleInAPI], [DisplayInForm], [Sequence], [__mj_CreatedAt], [__mj_UpdatedAt])
                    VALUES ('6a321959-cc17-4e00-807e-9da9e1fd1598', '7A94ADA9-7880-4FAE-97D8-DB0E934C3F5F', '16538F9B-E025-460D-9505-BD03A7648EC5', 'PersonID', 'One To Many', 1, 1, 21, GETUTCDATE(), GETUTCDATE())
   END;
                    
/* Create Entity Relationship: MJ_BizApps_Common: People -> MoreCheese: Member Certifications (One To Many via PersonID) */
   IF NOT EXISTS (
      SELECT 1 FROM [${mjSchema}].[EntityRelationship] WHERE [ID] = 'f3982200-bb04-4da2-8930-03666346c37d'
   )
   BEGIN
      INSERT INTO [${mjSchema}].[EntityRelationship] ([ID], [EntityID], [RelatedEntityID], [RelatedEntityJoinField], [Type], [BundleInAPI], [DisplayInForm], [Sequence], [__mj_CreatedAt], [__mj_UpdatedAt])
                    VALUES ('f3982200-bb04-4da2-8930-03666346c37d', '7A94ADA9-7880-4FAE-97D8-DB0E934C3F5F', '23916A8E-3487-4793-9E18-C209EF097E58', 'PersonID', 'One To Many', 1, 1, 22, GETUTCDATE(), GETUTCDATE())
   END;
                    
/* Create Entity Relationship: MJ_BizApps_Common: People -> MoreCheese: Orders (One To Many via PersonID) */
   IF NOT EXISTS (
      SELECT 1 FROM [${mjSchema}].[EntityRelationship] WHERE [ID] = 'df362d9b-cc16-4abf-8d07-d72b67b816d9'
   )
   BEGIN
      INSERT INTO [${mjSchema}].[EntityRelationship] ([ID], [EntityID], [RelatedEntityID], [RelatedEntityJoinField], [Type], [BundleInAPI], [DisplayInForm], [Sequence], [__mj_CreatedAt], [__mj_UpdatedAt])
                    VALUES ('df362d9b-cc16-4abf-8d07-d72b67b816d9', '7A94ADA9-7880-4FAE-97D8-DB0E934C3F5F', '81B84F0D-7A7A-4897-A8F3-08EB40A09B51', 'PersonID', 'One To Many', 1, 1, 23, GETUTCDATE(), GETUTCDATE())
   END;
                    
/* Create Entity Relationship: MJ_BizApps_Common: People -> MoreCheese: Course Enrollments (One To Many via PersonID) */
   IF NOT EXISTS (
      SELECT 1 FROM [${mjSchema}].[EntityRelationship] WHERE [ID] = 'f52a99f9-0c69-4325-8de7-ba2bea0882a8'
   )
   BEGIN
      INSERT INTO [${mjSchema}].[EntityRelationship] ([ID], [EntityID], [RelatedEntityID], [RelatedEntityJoinField], [Type], [BundleInAPI], [DisplayInForm], [Sequence], [__mj_CreatedAt], [__mj_UpdatedAt])
                    VALUES ('f52a99f9-0c69-4325-8de7-ba2bea0882a8', '7A94ADA9-7880-4FAE-97D8-DB0E934C3F5F', '428C670F-EBE3-41E6-86E4-EB5A274960A1', 'PersonID', 'One To Many', 1, 1, 24, GETUTCDATE(), GETUTCDATE())
   END;


/* Create Entity Relationship: MJ_BizApps_Common: People -> MoreCheese: Event Registrations (One To Many via PersonID) */
   IF NOT EXISTS (
      SELECT 1 FROM [${mjSchema}].[EntityRelationship] WHERE [ID] = '2955bca8-cdac-4d83-a7b9-6bfffaf9de44'
   )
   BEGIN
      INSERT INTO [${mjSchema}].[EntityRelationship] ([ID], [EntityID], [RelatedEntityID], [RelatedEntityJoinField], [Type], [BundleInAPI], [DisplayInForm], [Sequence], [__mj_CreatedAt], [__mj_UpdatedAt])
                    VALUES ('2955bca8-cdac-4d83-a7b9-6bfffaf9de44', '7A94ADA9-7880-4FAE-97D8-DB0E934C3F5F', 'DC863C47-C1FA-4C3F-92D1-DF7F8A7BC153', 'PersonID', 'One To Many', 1, 1, 25, GETUTCDATE(), GETUTCDATE())
   END;
                    
/* Create Entity Relationship: MJ_BizApps_Common: People -> MoreCheese: Competition Entries (One To Many via PersonID) */
   IF NOT EXISTS (
      SELECT 1 FROM [${mjSchema}].[EntityRelationship] WHERE [ID] = '6c1bff43-8e92-453d-af79-088d965af2ab'
   )
   BEGIN
      INSERT INTO [${mjSchema}].[EntityRelationship] ([ID], [EntityID], [RelatedEntityID], [RelatedEntityJoinField], [Type], [BundleInAPI], [DisplayInForm], [Sequence], [__mj_CreatedAt], [__mj_UpdatedAt])
                    VALUES ('6c1bff43-8e92-453d-af79-088d965af2ab', '7A94ADA9-7880-4FAE-97D8-DB0E934C3F5F', '9F493BE6-006B-4FC2-986C-D15AB527E65B', 'PersonID', 'One To Many', 1, 1, 26, GETUTCDATE(), GETUTCDATE())
   END;
                    
/* Create Entity Relationship: MJ_BizApps_Common: People -> MoreCheese: Advocacy Actions (One To Many via PersonID) */
   IF NOT EXISTS (
      SELECT 1 FROM [${mjSchema}].[EntityRelationship] WHERE [ID] = '21ee6fb9-031a-4002-829a-b1e4382f2ba3'
   )
   BEGIN
      INSERT INTO [${mjSchema}].[EntityRelationship] ([ID], [EntityID], [RelatedEntityID], [RelatedEntityJoinField], [Type], [BundleInAPI], [DisplayInForm], [Sequence], [__mj_CreatedAt], [__mj_UpdatedAt])
                    VALUES ('21ee6fb9-031a-4002-829a-b1e4382f2ba3', '7A94ADA9-7880-4FAE-97D8-DB0E934C3F5F', 'F2C9BD57-8734-4AFE-B20A-2C8C1C3BB25F', 'PersonID', 'One To Many', 1, 1, 27, GETUTCDATE(), GETUTCDATE())
   END;
                    
/* Create Entity Relationship: MoreCheese: Products -> MoreCheese: Order Lines (One To Many via ProductID) */
   IF NOT EXISTS (
      SELECT 1 FROM [${mjSchema}].[EntityRelationship] WHERE [ID] = '08fa4551-7338-4c18-b397-5c3ccbfc7954'
   )
   BEGIN
      INSERT INTO [${mjSchema}].[EntityRelationship] ([ID], [EntityID], [RelatedEntityID], [RelatedEntityJoinField], [Type], [BundleInAPI], [DisplayInForm], [Sequence], [__mj_CreatedAt], [__mj_UpdatedAt])
                    VALUES ('08fa4551-7338-4c18-b397-5c3ccbfc7954', 'A05CC658-F8D8-476E-8E84-F2022C6DFEF9', 'B5027754-CB75-4789-AA34-F71B815F0933', 'ProductID', 'One To Many', 1, 1, 1, GETUTCDATE(), GETUTCDATE())
   END;

/* SQL text to sync schema info from database schemas */
EXEC [${mjSchema}].[spUpdateSchemaInfoFromDatabase] @ExcludedSchemaNames='sys,staging,dbo,${mjSchema},${mjSchema}_UDT,sample_app,AssociationDemo,Bookstore,${mjSchema}_BizAppsCommon,${mjSchema}_BizAppsTasks,${mjSchema}_BizAppsCommittees,${mjSchema}_BizAppsForms,${mjSchema}_BizAppsIssues,secure_messaging,${mjSchema}';

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

/* SQL text to update entity field related entity name field map for entity field ID 04FB77E8-2A7F-4446-9A90-9BA70889AAAB */
EXEC [${mjSchema}].[spUpdateEntityFieldRelatedEntityNameFieldMap] @EntityFieldID='04FB77E8-2A7F-4446-9A90-9BA70889AAAB', @RelatedEntityNameFieldMap='Person';

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

/* SQL text to update entity field related entity name field map for entity field ID 92DD1DF5-83C7-487A-8B9B-99E263C5875E */
EXEC [${mjSchema}].[spUpdateEntityFieldRelatedEntityNameFieldMap] @EntityFieldID='92DD1DF5-83C7-487A-8B9B-99E263C5875E', @RelatedEntityNameFieldMap='Person';

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

/* SQL text to update entity field related entity name field map for entity field ID AC3E81FA-C066-4370-8FAE-80D5754F5320 */
EXEC [${mjSchema}].[spUpdateEntityFieldRelatedEntityNameFieldMap] @EntityFieldID='AC3E81FA-C066-4370-8FAE-80D5754F5320', @RelatedEntityNameFieldMap='Person';

/* Index for Foreign Keys for Course */
-----------------------------------------------------------------
-- SQL Code Generation
-- Entity: MoreCheese: Courses
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
-- Index for foreign key OrderID in table OrderLine
IF NOT EXISTS (
    SELECT 1
    FROM sys.indexes
    WHERE name = 'IDX_AUTO_MJ_FKEY_OrderLine_OrderID' 
    AND object_id = OBJECT_ID('[morecheese_orders].[OrderLine]')
)
CREATE INDEX IDX_AUTO_MJ_FKEY_OrderLine_OrderID ON [morecheese_orders].[OrderLine] ([OrderID]);

-- Index for foreign key ProductID in table OrderLine
IF NOT EXISTS (
    SELECT 1
    FROM sys.indexes
    WHERE name = 'IDX_AUTO_MJ_FKEY_OrderLine_ProductID' 
    AND object_id = OBJECT_ID('[morecheese_orders].[OrderLine]')
)
CREATE INDEX IDX_AUTO_MJ_FKEY_OrderLine_ProductID ON [morecheese_orders].[OrderLine] ([ProductID]);

/* SQL text to update entity field related entity name field map for entity field ID 300C666F-4892-473F-A922-8291AD71FD5D */
EXEC [${mjSchema}].[spUpdateEntityFieldRelatedEntityNameFieldMap] @EntityFieldID='300C666F-4892-473F-A922-8291AD71FD5D', @RelatedEntityNameFieldMap='Product';

/* Index for Foreign Keys for Order */
-----------------------------------------------------------------
-- SQL Code Generation
-- Entity: MoreCheese: Orders
-- Item: Index for Foreign Keys
--
-- This was generated by the MemberJunction CodeGen tool.
-- This file should NOT be edited by hand.
-----------------------------------------------------------------
-- Index for foreign key PersonID in table Order
IF NOT EXISTS (
    SELECT 1
    FROM sys.indexes
    WHERE name = 'IDX_AUTO_MJ_FKEY_Order_PersonID' 
    AND object_id = OBJECT_ID('[morecheese_orders].[Order]')
)
CREATE INDEX IDX_AUTO_MJ_FKEY_Order_PersonID ON [morecheese_orders].[Order] ([PersonID]);

/* SQL text to update entity field related entity name field map for entity field ID F5156143-443D-4374-B7E5-4788645028C5 */
EXEC [${mjSchema}].[spUpdateEntityFieldRelatedEntityNameFieldMap] @EntityFieldID='F5156143-443D-4374-B7E5-4788645028C5', @RelatedEntityNameFieldMap='Person';

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

/* Index for Foreign Keys for Payment */
-----------------------------------------------------------------
-- SQL Code Generation
-- Entity: MoreCheese: Payments
-- Item: Index for Foreign Keys
--
-- This was generated by the MemberJunction CodeGen tool.
-- This file should NOT be edited by hand.
-----------------------------------------------------------------
-- Index for foreign key OrderID in table Payment
IF NOT EXISTS (
    SELECT 1
    FROM sys.indexes
    WHERE name = 'IDX_AUTO_MJ_FKEY_Payment_OrderID' 
    AND object_id = OBJECT_ID('[morecheese_orders].[Payment]')
)
CREATE INDEX IDX_AUTO_MJ_FKEY_Payment_OrderID ON [morecheese_orders].[Payment] ([OrderID]);

/* Base View SQL for MoreCheese: Payments */
-----------------------------------------------------------------
-- SQL Code Generation
-- Entity: MoreCheese: Payments
-- Item: vwPayments
--
-- This was generated by the MemberJunction CodeGen tool.
-- This file should NOT be edited by hand.
-----------------------------------------------------------------

------------------------------------------------------------
----- BASE VIEW FOR ENTITY:      MoreCheese: Payments
-----               SCHEMA:      morecheese_orders
-----               BASE TABLE:  Payment
-----               PRIMARY KEY: ID
------------------------------------------------------------
IF OBJECT_ID('[morecheese_orders].[vwPayments]', 'V') IS NOT NULL
    DROP VIEW [morecheese_orders].[vwPayments];
GO

CREATE VIEW [morecheese_orders].[vwPayments]
AS
SELECT
    p.*
FROM
    [morecheese_orders].[Payment] AS p
GO
GRANT SELECT ON [morecheese_orders].[vwPayments] TO [cdp_UI], [cdp_Developer], [cdp_Integration];

/* Base View Permissions SQL for MoreCheese: Payments */
-----------------------------------------------------------------
-- SQL Code Generation
-- Entity: MoreCheese: Payments
-- Item: Permissions for vwPayments
--
-- This was generated by the MemberJunction CodeGen tool.
-- This file should NOT be edited by hand.
-----------------------------------------------------------------

GRANT SELECT ON [morecheese_orders].[vwPayments] TO [cdp_UI], [cdp_Developer], [cdp_Integration];

/* spCreate SQL for MoreCheese: Payments */
-----------------------------------------------------------------
-- SQL Code Generation
-- Entity: MoreCheese: Payments
-- Item: spCreatePayment
--
-- This was generated by the MemberJunction CodeGen tool.
-- This file should NOT be edited by hand.
-----------------------------------------------------------------

------------------------------------------------------------
----- CREATE PROCEDURE FOR Payment
------------------------------------------------------------
IF OBJECT_ID('[morecheese_orders].[spCreatePayment]', 'P') IS NOT NULL
    DROP PROCEDURE [morecheese_orders].[spCreatePayment];
GO

CREATE PROCEDURE [morecheese_orders].[spCreatePayment]
    @ID uniqueidentifier = NULL,
    @OrderID uniqueidentifier,
    @Amount decimal(10, 2),
    @PaymentDate date,
    @Method nvarchar(50),
    @Status nvarchar(50) = NULL,
    @IsSharedDemo bit = NULL
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @InsertedRow TABLE ([ID] UNIQUEIDENTIFIER)

    IF @ID IS NOT NULL
    BEGIN
        -- User provided a value, use it
        INSERT INTO [morecheese_orders].[Payment]
            (
                [ID],
                [OrderID],
                [Amount],
                [PaymentDate],
                [Method],
                [Status],
                [IsSharedDemo]
            )
        OUTPUT INSERTED.[ID] INTO @InsertedRow
        VALUES
            (
                @ID,
                @OrderID,
                @Amount,
                @PaymentDate,
                @Method,
                ISNULL(@Status, 'Captured'),
                ISNULL(@IsSharedDemo, 1)
            )
    END
    ELSE
    BEGIN
        -- No value provided, let database use its default (e.g., NEWSEQUENTIALID())
        INSERT INTO [morecheese_orders].[Payment]
            (
                [OrderID],
                [Amount],
                [PaymentDate],
                [Method],
                [Status],
                [IsSharedDemo]
            )
        OUTPUT INSERTED.[ID] INTO @InsertedRow
        VALUES
            (
                @OrderID,
                @Amount,
                @PaymentDate,
                @Method,
                ISNULL(@Status, 'Captured'),
                ISNULL(@IsSharedDemo, 1)
            )
    END
    -- return the new record from the base view, which might have some calculated fields
    SELECT * FROM [morecheese_orders].[vwPayments] WHERE [ID] = (SELECT [ID] FROM @InsertedRow)
END
GO
GRANT EXECUTE ON [morecheese_orders].[spCreatePayment] TO [cdp_Developer], [cdp_Integration];

/* spCreate Permissions for MoreCheese: Payments */

GRANT EXECUTE ON [morecheese_orders].[spCreatePayment] TO [cdp_Developer], [cdp_Integration];

/* spUpdate SQL for MoreCheese: Payments */
-----------------------------------------------------------------
-- SQL Code Generation
-- Entity: MoreCheese: Payments
-- Item: spUpdatePayment
--
-- This was generated by the MemberJunction CodeGen tool.
-- This file should NOT be edited by hand.
-----------------------------------------------------------------

------------------------------------------------------------
----- UPDATE PROCEDURE FOR Payment
------------------------------------------------------------
IF OBJECT_ID('[morecheese_orders].[spUpdatePayment]', 'P') IS NOT NULL
    DROP PROCEDURE [morecheese_orders].[spUpdatePayment];
GO

CREATE PROCEDURE [morecheese_orders].[spUpdatePayment]
    @ID uniqueidentifier,
    @OrderID uniqueidentifier = NULL,
    @Amount decimal(10, 2) = NULL,
    @PaymentDate date = NULL,
    @Method nvarchar(50) = NULL,
    @Status nvarchar(50) = NULL,
    @IsSharedDemo bit = NULL
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE
        [morecheese_orders].[Payment]
    SET
        [OrderID] = ISNULL(@OrderID, [OrderID]),
        [Amount] = ISNULL(@Amount, [Amount]),
        [PaymentDate] = ISNULL(@PaymentDate, [PaymentDate]),
        [Method] = ISNULL(@Method, [Method]),
        [Status] = ISNULL(@Status, [Status]),
        [IsSharedDemo] = ISNULL(@IsSharedDemo, [IsSharedDemo])
    WHERE
        [ID] = @ID

    -- Check if the update was successful
    IF @@ROWCOUNT = 0
        -- Nothing was updated, return no rows, but column structure from base view intact, semantically correct this way.
        SELECT TOP 0 * FROM [morecheese_orders].[vwPayments] WHERE 1=0
    ELSE
        -- Return the updated record so the caller can see the updated values and any calculated fields
        SELECT
                                        *
                                    FROM
                                        [morecheese_orders].[vwPayments]
                                    WHERE
                                        [ID] = @ID
                                    
END
GO

GRANT EXECUTE ON [morecheese_orders].[spUpdatePayment] TO [cdp_Developer], [cdp_Integration]
GO

------------------------------------------------------------
----- TRIGGER FOR __mj_UpdatedAt field for the Payment table
------------------------------------------------------------
IF OBJECT_ID('[morecheese_orders].[trgUpdatePayment]', 'TR') IS NOT NULL
    DROP TRIGGER [morecheese_orders].[trgUpdatePayment];
GO
CREATE TRIGGER [morecheese_orders].trgUpdatePayment
ON [morecheese_orders].[Payment]
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE
        [morecheese_orders].[Payment]
    SET
        __mj_UpdatedAt = GETUTCDATE()
    FROM
        [morecheese_orders].[Payment] AS _organicTable
    INNER JOIN
        INSERTED AS I ON
        _organicTable.[ID] = I.[ID];
END;
GO

/* spUpdate Permissions for MoreCheese: Payments */

GRANT EXECUTE ON [morecheese_orders].[spUpdatePayment] TO [cdp_Developer], [cdp_Integration];

/* spDelete SQL for MoreCheese: Payments */
-----------------------------------------------------------------
-- SQL Code Generation
-- Entity: MoreCheese: Payments
-- Item: spDeletePayment
--
-- This was generated by the MemberJunction CodeGen tool.
-- This file should NOT be edited by hand.
-----------------------------------------------------------------

------------------------------------------------------------
----- DELETE PROCEDURE FOR Payment
------------------------------------------------------------
IF OBJECT_ID('[morecheese_orders].[spDeletePayment]', 'P') IS NOT NULL
    DROP PROCEDURE [morecheese_orders].[spDeletePayment];
GO

CREATE PROCEDURE [morecheese_orders].[spDeletePayment]
    @ID uniqueidentifier
AS
BEGIN
    SET NOCOUNT ON;

    DELETE FROM
        [morecheese_orders].[Payment]
    WHERE
        [ID] = @ID


    -- Check if the delete was successful
    IF @@ROWCOUNT = 0
        SELECT NULL AS [ID] -- Return NULL for all primary key fields to indicate no record was deleted
    ELSE
        SELECT @ID AS [ID] -- Return the primary key values to indicate we successfully deleted the record
END
GO
GRANT EXECUTE ON [morecheese_orders].[spDeletePayment] TO [cdp_Developer], [cdp_Integration];

/* spDelete Permissions for MoreCheese: Payments */

GRANT EXECUTE ON [morecheese_orders].[spDeletePayment] TO [cdp_Developer], [cdp_Integration];

/* Base View SQL for MoreCheese: Orders */
-----------------------------------------------------------------
-- SQL Code Generation
-- Entity: MoreCheese: Orders
-- Item: vwOrders
--
-- This was generated by the MemberJunction CodeGen tool.
-- This file should NOT be edited by hand.
-----------------------------------------------------------------

------------------------------------------------------------
----- BASE VIEW FOR ENTITY:      MoreCheese: Orders
-----               SCHEMA:      morecheese_orders
-----               BASE TABLE:  Order
-----               PRIMARY KEY: ID
------------------------------------------------------------
IF OBJECT_ID('[morecheese_orders].[vwOrders]', 'V') IS NOT NULL
    DROP VIEW [morecheese_orders].[vwOrders];
GO

CREATE VIEW [morecheese_orders].[vwOrders]
AS
SELECT
    o.*,
    mjBizAppsCommonPerson_PersonID.[DisplayName] AS [Person]
FROM
    [morecheese_orders].[Order] AS o
INNER JOIN
    [${mjSchema}_BizAppsCommon].[Person] AS mjBizAppsCommonPerson_PersonID
  ON
    [o].[PersonID] = mjBizAppsCommonPerson_PersonID.[ID]
GO
GRANT SELECT ON [morecheese_orders].[vwOrders] TO [cdp_UI], [cdp_Developer], [cdp_Integration];

/* Base View Permissions SQL for MoreCheese: Orders */
-----------------------------------------------------------------
-- SQL Code Generation
-- Entity: MoreCheese: Orders
-- Item: Permissions for vwOrders
--
-- This was generated by the MemberJunction CodeGen tool.
-- This file should NOT be edited by hand.
-----------------------------------------------------------------

GRANT SELECT ON [morecheese_orders].[vwOrders] TO [cdp_UI], [cdp_Developer], [cdp_Integration];

/* spCreate SQL for MoreCheese: Orders */
-----------------------------------------------------------------
-- SQL Code Generation
-- Entity: MoreCheese: Orders
-- Item: spCreateOrder
--
-- This was generated by the MemberJunction CodeGen tool.
-- This file should NOT be edited by hand.
-----------------------------------------------------------------

------------------------------------------------------------
----- CREATE PROCEDURE FOR Order
------------------------------------------------------------
IF OBJECT_ID('[morecheese_orders].[spCreateOrder]', 'P') IS NOT NULL
    DROP PROCEDURE [morecheese_orders].[spCreateOrder];
GO

CREATE PROCEDURE [morecheese_orders].[spCreateOrder]
    @ID uniqueidentifier = NULL,
    @OrderKey nvarchar(50),
    @PersonID uniqueidentifier,
    @OrderType nvarchar(50) = NULL,
    @Status nvarchar(50) = NULL,
    @OrderDate date,
    @DueDate date,
    @TotalGross decimal(10, 2),
    @PaymentStatus nvarchar(50),
    @IsSharedDemo bit = NULL
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @InsertedRow TABLE ([ID] UNIQUEIDENTIFIER)

    IF @ID IS NOT NULL
    BEGIN
        -- User provided a value, use it
        INSERT INTO [morecheese_orders].[Order]
            (
                [ID],
                [OrderKey],
                [PersonID],
                [OrderType],
                [Status],
                [OrderDate],
                [DueDate],
                [TotalGross],
                [PaymentStatus],
                [IsSharedDemo]
            )
        OUTPUT INSERTED.[ID] INTO @InsertedRow
        VALUES
            (
                @ID,
                @OrderKey,
                @PersonID,
                ISNULL(@OrderType, 'Sale'),
                ISNULL(@Status, 'Posted'),
                @OrderDate,
                @DueDate,
                @TotalGross,
                @PaymentStatus,
                ISNULL(@IsSharedDemo, 1)
            )
    END
    ELSE
    BEGIN
        -- No value provided, let database use its default (e.g., NEWSEQUENTIALID())
        INSERT INTO [morecheese_orders].[Order]
            (
                [OrderKey],
                [PersonID],
                [OrderType],
                [Status],
                [OrderDate],
                [DueDate],
                [TotalGross],
                [PaymentStatus],
                [IsSharedDemo]
            )
        OUTPUT INSERTED.[ID] INTO @InsertedRow
        VALUES
            (
                @OrderKey,
                @PersonID,
                ISNULL(@OrderType, 'Sale'),
                ISNULL(@Status, 'Posted'),
                @OrderDate,
                @DueDate,
                @TotalGross,
                @PaymentStatus,
                ISNULL(@IsSharedDemo, 1)
            )
    END
    -- return the new record from the base view, which might have some calculated fields
    SELECT * FROM [morecheese_orders].[vwOrders] WHERE [ID] = (SELECT [ID] FROM @InsertedRow)
END
GO
GRANT EXECUTE ON [morecheese_orders].[spCreateOrder] TO [cdp_Developer], [cdp_Integration];

/* spCreate Permissions for MoreCheese: Orders */

GRANT EXECUTE ON [morecheese_orders].[spCreateOrder] TO [cdp_Developer], [cdp_Integration];

/* spUpdate SQL for MoreCheese: Orders */
-----------------------------------------------------------------
-- SQL Code Generation
-- Entity: MoreCheese: Orders
-- Item: spUpdateOrder
--
-- This was generated by the MemberJunction CodeGen tool.
-- This file should NOT be edited by hand.
-----------------------------------------------------------------

------------------------------------------------------------
----- UPDATE PROCEDURE FOR Order
------------------------------------------------------------
IF OBJECT_ID('[morecheese_orders].[spUpdateOrder]', 'P') IS NOT NULL
    DROP PROCEDURE [morecheese_orders].[spUpdateOrder];
GO

CREATE PROCEDURE [morecheese_orders].[spUpdateOrder]
    @ID uniqueidentifier,
    @OrderKey nvarchar(50) = NULL,
    @PersonID uniqueidentifier = NULL,
    @OrderType nvarchar(50) = NULL,
    @Status nvarchar(50) = NULL,
    @OrderDate date = NULL,
    @DueDate date = NULL,
    @TotalGross decimal(10, 2) = NULL,
    @PaymentStatus nvarchar(50) = NULL,
    @IsSharedDemo bit = NULL
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE
        [morecheese_orders].[Order]
    SET
        [OrderKey] = ISNULL(@OrderKey, [OrderKey]),
        [PersonID] = ISNULL(@PersonID, [PersonID]),
        [OrderType] = ISNULL(@OrderType, [OrderType]),
        [Status] = ISNULL(@Status, [Status]),
        [OrderDate] = ISNULL(@OrderDate, [OrderDate]),
        [DueDate] = ISNULL(@DueDate, [DueDate]),
        [TotalGross] = ISNULL(@TotalGross, [TotalGross]),
        [PaymentStatus] = ISNULL(@PaymentStatus, [PaymentStatus]),
        [IsSharedDemo] = ISNULL(@IsSharedDemo, [IsSharedDemo])
    WHERE
        [ID] = @ID

    -- Check if the update was successful
    IF @@ROWCOUNT = 0
        -- Nothing was updated, return no rows, but column structure from base view intact, semantically correct this way.
        SELECT TOP 0 * FROM [morecheese_orders].[vwOrders] WHERE 1=0
    ELSE
        -- Return the updated record so the caller can see the updated values and any calculated fields
        SELECT
                                        *
                                    FROM
                                        [morecheese_orders].[vwOrders]
                                    WHERE
                                        [ID] = @ID
                                    
END
GO

GRANT EXECUTE ON [morecheese_orders].[spUpdateOrder] TO [cdp_Developer], [cdp_Integration]
GO

------------------------------------------------------------
----- TRIGGER FOR __mj_UpdatedAt field for the Order table
------------------------------------------------------------
IF OBJECT_ID('[morecheese_orders].[trgUpdateOrder]', 'TR') IS NOT NULL
    DROP TRIGGER [morecheese_orders].[trgUpdateOrder];
GO
CREATE TRIGGER [morecheese_orders].trgUpdateOrder
ON [morecheese_orders].[Order]
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE
        [morecheese_orders].[Order]
    SET
        __mj_UpdatedAt = GETUTCDATE()
    FROM
        [morecheese_orders].[Order] AS _organicTable
    INNER JOIN
        INSERTED AS I ON
        _organicTable.[ID] = I.[ID];
END;
GO

/* spUpdate Permissions for MoreCheese: Orders */

GRANT EXECUTE ON [morecheese_orders].[spUpdateOrder] TO [cdp_Developer], [cdp_Integration];

/* spDelete SQL for MoreCheese: Orders */
-----------------------------------------------------------------
-- SQL Code Generation
-- Entity: MoreCheese: Orders
-- Item: spDeleteOrder
--
-- This was generated by the MemberJunction CodeGen tool.
-- This file should NOT be edited by hand.
-----------------------------------------------------------------

------------------------------------------------------------
----- DELETE PROCEDURE FOR Order
------------------------------------------------------------
IF OBJECT_ID('[morecheese_orders].[spDeleteOrder]', 'P') IS NOT NULL
    DROP PROCEDURE [morecheese_orders].[spDeleteOrder];
GO

CREATE PROCEDURE [morecheese_orders].[spDeleteOrder]
    @ID uniqueidentifier
AS
BEGIN
    SET NOCOUNT ON;

    DELETE FROM
        [morecheese_orders].[Order]
    WHERE
        [ID] = @ID


    -- Check if the delete was successful
    IF @@ROWCOUNT = 0
        SELECT NULL AS [ID] -- Return NULL for all primary key fields to indicate no record was deleted
    ELSE
        SELECT @ID AS [ID] -- Return the primary key values to indicate we successfully deleted the record
END
GO
GRANT EXECUTE ON [morecheese_orders].[spDeleteOrder] TO [cdp_Developer], [cdp_Integration];

/* spDelete Permissions for MoreCheese: Orders */

GRANT EXECUTE ON [morecheese_orders].[spDeleteOrder] TO [cdp_Developer], [cdp_Integration];

/* Base View SQL for MoreCheese: Order Lines */
-----------------------------------------------------------------
-- SQL Code Generation
-- Entity: MoreCheese: Order Lines
-- Item: vwOrderLines
--
-- This was generated by the MemberJunction CodeGen tool.
-- This file should NOT be edited by hand.
-----------------------------------------------------------------

------------------------------------------------------------
----- BASE VIEW FOR ENTITY:      MoreCheese: Order Lines
-----               SCHEMA:      morecheese_orders
-----               BASE TABLE:  OrderLine
-----               PRIMARY KEY: ID
------------------------------------------------------------
IF OBJECT_ID('[morecheese_orders].[vwOrderLines]', 'V') IS NOT NULL
    DROP VIEW [morecheese_orders].[vwOrderLines];
GO

CREATE VIEW [morecheese_orders].[vwOrderLines]
AS
SELECT
    o.*,
    morecheeseordersProduct_ProductID.[Name] AS [Product]
FROM
    [morecheese_orders].[OrderLine] AS o
INNER JOIN
    [morecheese_orders].[Product] AS morecheeseordersProduct_ProductID
  ON
    [o].[ProductID] = morecheeseordersProduct_ProductID.[ID]
GO
GRANT SELECT ON [morecheese_orders].[vwOrderLines] TO [cdp_UI], [cdp_Developer], [cdp_Integration];

/* Base View Permissions SQL for MoreCheese: Order Lines */
-----------------------------------------------------------------
-- SQL Code Generation
-- Entity: MoreCheese: Order Lines
-- Item: Permissions for vwOrderLines
--
-- This was generated by the MemberJunction CodeGen tool.
-- This file should NOT be edited by hand.
-----------------------------------------------------------------

GRANT SELECT ON [morecheese_orders].[vwOrderLines] TO [cdp_UI], [cdp_Developer], [cdp_Integration];

/* spCreate SQL for MoreCheese: Order Lines */
-----------------------------------------------------------------
-- SQL Code Generation
-- Entity: MoreCheese: Order Lines
-- Item: spCreateOrderLine
--
-- This was generated by the MemberJunction CodeGen tool.
-- This file should NOT be edited by hand.
-----------------------------------------------------------------

------------------------------------------------------------
----- CREATE PROCEDURE FOR OrderLine
------------------------------------------------------------
IF OBJECT_ID('[morecheese_orders].[spCreateOrderLine]', 'P') IS NOT NULL
    DROP PROCEDURE [morecheese_orders].[spCreateOrderLine];
GO

CREATE PROCEDURE [morecheese_orders].[spCreateOrderLine]
    @ID uniqueidentifier = NULL,
    @OrderID uniqueidentifier,
    @ProductID uniqueidentifier,
    @Quantity int = NULL,
    @UnitPrice decimal(10, 2),
    @LineTotal decimal(10, 2),
    @IsSharedDemo bit = NULL
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @InsertedRow TABLE ([ID] UNIQUEIDENTIFIER)

    IF @ID IS NOT NULL
    BEGIN
        -- User provided a value, use it
        INSERT INTO [morecheese_orders].[OrderLine]
            (
                [ID],
                [OrderID],
                [ProductID],
                [Quantity],
                [UnitPrice],
                [LineTotal],
                [IsSharedDemo]
            )
        OUTPUT INSERTED.[ID] INTO @InsertedRow
        VALUES
            (
                @ID,
                @OrderID,
                @ProductID,
                ISNULL(@Quantity, 1),
                @UnitPrice,
                @LineTotal,
                ISNULL(@IsSharedDemo, 1)
            )
    END
    ELSE
    BEGIN
        -- No value provided, let database use its default (e.g., NEWSEQUENTIALID())
        INSERT INTO [morecheese_orders].[OrderLine]
            (
                [OrderID],
                [ProductID],
                [Quantity],
                [UnitPrice],
                [LineTotal],
                [IsSharedDemo]
            )
        OUTPUT INSERTED.[ID] INTO @InsertedRow
        VALUES
            (
                @OrderID,
                @ProductID,
                ISNULL(@Quantity, 1),
                @UnitPrice,
                @LineTotal,
                ISNULL(@IsSharedDemo, 1)
            )
    END
    -- return the new record from the base view, which might have some calculated fields
    SELECT * FROM [morecheese_orders].[vwOrderLines] WHERE [ID] = (SELECT [ID] FROM @InsertedRow)
END
GO
GRANT EXECUTE ON [morecheese_orders].[spCreateOrderLine] TO [cdp_Developer], [cdp_Integration];

/* spCreate Permissions for MoreCheese: Order Lines */

GRANT EXECUTE ON [morecheese_orders].[spCreateOrderLine] TO [cdp_Developer], [cdp_Integration];

/* spUpdate SQL for MoreCheese: Order Lines */
-----------------------------------------------------------------
-- SQL Code Generation
-- Entity: MoreCheese: Order Lines
-- Item: spUpdateOrderLine
--
-- This was generated by the MemberJunction CodeGen tool.
-- This file should NOT be edited by hand.
-----------------------------------------------------------------

------------------------------------------------------------
----- UPDATE PROCEDURE FOR OrderLine
------------------------------------------------------------
IF OBJECT_ID('[morecheese_orders].[spUpdateOrderLine]', 'P') IS NOT NULL
    DROP PROCEDURE [morecheese_orders].[spUpdateOrderLine];
GO

CREATE PROCEDURE [morecheese_orders].[spUpdateOrderLine]
    @ID uniqueidentifier,
    @OrderID uniqueidentifier = NULL,
    @ProductID uniqueidentifier = NULL,
    @Quantity int = NULL,
    @UnitPrice decimal(10, 2) = NULL,
    @LineTotal decimal(10, 2) = NULL,
    @IsSharedDemo bit = NULL
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE
        [morecheese_orders].[OrderLine]
    SET
        [OrderID] = ISNULL(@OrderID, [OrderID]),
        [ProductID] = ISNULL(@ProductID, [ProductID]),
        [Quantity] = ISNULL(@Quantity, [Quantity]),
        [UnitPrice] = ISNULL(@UnitPrice, [UnitPrice]),
        [LineTotal] = ISNULL(@LineTotal, [LineTotal]),
        [IsSharedDemo] = ISNULL(@IsSharedDemo, [IsSharedDemo])
    WHERE
        [ID] = @ID

    -- Check if the update was successful
    IF @@ROWCOUNT = 0
        -- Nothing was updated, return no rows, but column structure from base view intact, semantically correct this way.
        SELECT TOP 0 * FROM [morecheese_orders].[vwOrderLines] WHERE 1=0
    ELSE
        -- Return the updated record so the caller can see the updated values and any calculated fields
        SELECT
                                        *
                                    FROM
                                        [morecheese_orders].[vwOrderLines]
                                    WHERE
                                        [ID] = @ID
                                    
END
GO

GRANT EXECUTE ON [morecheese_orders].[spUpdateOrderLine] TO [cdp_Developer], [cdp_Integration]
GO

------------------------------------------------------------
----- TRIGGER FOR __mj_UpdatedAt field for the OrderLine table
------------------------------------------------------------
IF OBJECT_ID('[morecheese_orders].[trgUpdateOrderLine]', 'TR') IS NOT NULL
    DROP TRIGGER [morecheese_orders].[trgUpdateOrderLine];
GO
CREATE TRIGGER [morecheese_orders].trgUpdateOrderLine
ON [morecheese_orders].[OrderLine]
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE
        [morecheese_orders].[OrderLine]
    SET
        __mj_UpdatedAt = GETUTCDATE()
    FROM
        [morecheese_orders].[OrderLine] AS _organicTable
    INNER JOIN
        INSERTED AS I ON
        _organicTable.[ID] = I.[ID];
END;
GO

/* spUpdate Permissions for MoreCheese: Order Lines */

GRANT EXECUTE ON [morecheese_orders].[spUpdateOrderLine] TO [cdp_Developer], [cdp_Integration];

/* spDelete SQL for MoreCheese: Order Lines */
-----------------------------------------------------------------
-- SQL Code Generation
-- Entity: MoreCheese: Order Lines
-- Item: spDeleteOrderLine
--
-- This was generated by the MemberJunction CodeGen tool.
-- This file should NOT be edited by hand.
-----------------------------------------------------------------

------------------------------------------------------------
----- DELETE PROCEDURE FOR OrderLine
------------------------------------------------------------
IF OBJECT_ID('[morecheese_orders].[spDeleteOrderLine]', 'P') IS NOT NULL
    DROP PROCEDURE [morecheese_orders].[spDeleteOrderLine];
GO

CREATE PROCEDURE [morecheese_orders].[spDeleteOrderLine]
    @ID uniqueidentifier
AS
BEGIN
    SET NOCOUNT ON;

    DELETE FROM
        [morecheese_orders].[OrderLine]
    WHERE
        [ID] = @ID


    -- Check if the delete was successful
    IF @@ROWCOUNT = 0
        SELECT NULL AS [ID] -- Return NULL for all primary key fields to indicate no record was deleted
    ELSE
        SELECT @ID AS [ID] -- Return the primary key values to indicate we successfully deleted the record
END
GO
GRANT EXECUTE ON [morecheese_orders].[spDeleteOrderLine] TO [cdp_Developer], [cdp_Integration];

/* spDelete Permissions for MoreCheese: Order Lines */

GRANT EXECUTE ON [morecheese_orders].[spDeleteOrderLine] TO [cdp_Developer], [cdp_Integration];

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

/* Index for Foreign Keys for Product */
-----------------------------------------------------------------
-- SQL Code Generation
-- Entity: MoreCheese: Products
-- Item: Index for Foreign Keys
--
-- This was generated by the MemberJunction CodeGen tool.
-- This file should NOT be edited by hand.
-----------------------------------------------------------------;

/* Base View SQL for MoreCheese: Products */
-----------------------------------------------------------------
-- SQL Code Generation
-- Entity: MoreCheese: Products
-- Item: vwProducts
--
-- This was generated by the MemberJunction CodeGen tool.
-- This file should NOT be edited by hand.
-----------------------------------------------------------------

------------------------------------------------------------
----- BASE VIEW FOR ENTITY:      MoreCheese: Products
-----               SCHEMA:      morecheese_orders
-----               BASE TABLE:  Product
-----               PRIMARY KEY: ID
------------------------------------------------------------
IF OBJECT_ID('[morecheese_orders].[vwProducts]', 'V') IS NOT NULL
    DROP VIEW [morecheese_orders].[vwProducts];
GO

CREATE VIEW [morecheese_orders].[vwProducts]
AS
SELECT
    p.*
FROM
    [morecheese_orders].[Product] AS p
GO
GRANT SELECT ON [morecheese_orders].[vwProducts] TO [cdp_UI], [cdp_Developer], [cdp_Integration];

/* Base View Permissions SQL for MoreCheese: Products */
-----------------------------------------------------------------
-- SQL Code Generation
-- Entity: MoreCheese: Products
-- Item: Permissions for vwProducts
--
-- This was generated by the MemberJunction CodeGen tool.
-- This file should NOT be edited by hand.
-----------------------------------------------------------------

GRANT SELECT ON [morecheese_orders].[vwProducts] TO [cdp_UI], [cdp_Developer], [cdp_Integration];

/* spCreate SQL for MoreCheese: Products */
-----------------------------------------------------------------
-- SQL Code Generation
-- Entity: MoreCheese: Products
-- Item: spCreateProduct
--
-- This was generated by the MemberJunction CodeGen tool.
-- This file should NOT be edited by hand.
-----------------------------------------------------------------

------------------------------------------------------------
----- CREATE PROCEDURE FOR Product
------------------------------------------------------------
IF OBJECT_ID('[morecheese_orders].[spCreateProduct]', 'P') IS NOT NULL
    DROP PROCEDURE [morecheese_orders].[spCreateProduct];
GO

CREATE PROCEDURE [morecheese_orders].[spCreateProduct]
    @ID uniqueidentifier = NULL,
    @ProductKey nvarchar(50),
    @Name nvarchar(200),
    @ProductType nvarchar(50),
    @UnitPrice decimal(10, 2),
    @IsSharedDemo bit = NULL
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @InsertedRow TABLE ([ID] UNIQUEIDENTIFIER)

    IF @ID IS NOT NULL
    BEGIN
        -- User provided a value, use it
        INSERT INTO [morecheese_orders].[Product]
            (
                [ID],
                [ProductKey],
                [Name],
                [ProductType],
                [UnitPrice],
                [IsSharedDemo]
            )
        OUTPUT INSERTED.[ID] INTO @InsertedRow
        VALUES
            (
                @ID,
                @ProductKey,
                @Name,
                @ProductType,
                @UnitPrice,
                ISNULL(@IsSharedDemo, 1)
            )
    END
    ELSE
    BEGIN
        -- No value provided, let database use its default (e.g., NEWSEQUENTIALID())
        INSERT INTO [morecheese_orders].[Product]
            (
                [ProductKey],
                [Name],
                [ProductType],
                [UnitPrice],
                [IsSharedDemo]
            )
        OUTPUT INSERTED.[ID] INTO @InsertedRow
        VALUES
            (
                @ProductKey,
                @Name,
                @ProductType,
                @UnitPrice,
                ISNULL(@IsSharedDemo, 1)
            )
    END
    -- return the new record from the base view, which might have some calculated fields
    SELECT * FROM [morecheese_orders].[vwProducts] WHERE [ID] = (SELECT [ID] FROM @InsertedRow)
END
GO
GRANT EXECUTE ON [morecheese_orders].[spCreateProduct] TO [cdp_Developer], [cdp_Integration];

/* spCreate Permissions for MoreCheese: Products */

GRANT EXECUTE ON [morecheese_orders].[spCreateProduct] TO [cdp_Developer], [cdp_Integration];

/* spUpdate SQL for MoreCheese: Products */
-----------------------------------------------------------------
-- SQL Code Generation
-- Entity: MoreCheese: Products
-- Item: spUpdateProduct
--
-- This was generated by the MemberJunction CodeGen tool.
-- This file should NOT be edited by hand.
-----------------------------------------------------------------

------------------------------------------------------------
----- UPDATE PROCEDURE FOR Product
------------------------------------------------------------
IF OBJECT_ID('[morecheese_orders].[spUpdateProduct]', 'P') IS NOT NULL
    DROP PROCEDURE [morecheese_orders].[spUpdateProduct];
GO

CREATE PROCEDURE [morecheese_orders].[spUpdateProduct]
    @ID uniqueidentifier,
    @ProductKey nvarchar(50) = NULL,
    @Name nvarchar(200) = NULL,
    @ProductType nvarchar(50) = NULL,
    @UnitPrice decimal(10, 2) = NULL,
    @IsSharedDemo bit = NULL
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE
        [morecheese_orders].[Product]
    SET
        [ProductKey] = ISNULL(@ProductKey, [ProductKey]),
        [Name] = ISNULL(@Name, [Name]),
        [ProductType] = ISNULL(@ProductType, [ProductType]),
        [UnitPrice] = ISNULL(@UnitPrice, [UnitPrice]),
        [IsSharedDemo] = ISNULL(@IsSharedDemo, [IsSharedDemo])
    WHERE
        [ID] = @ID

    -- Check if the update was successful
    IF @@ROWCOUNT = 0
        -- Nothing was updated, return no rows, but column structure from base view intact, semantically correct this way.
        SELECT TOP 0 * FROM [morecheese_orders].[vwProducts] WHERE 1=0
    ELSE
        -- Return the updated record so the caller can see the updated values and any calculated fields
        SELECT
                                        *
                                    FROM
                                        [morecheese_orders].[vwProducts]
                                    WHERE
                                        [ID] = @ID
                                    
END
GO

GRANT EXECUTE ON [morecheese_orders].[spUpdateProduct] TO [cdp_Developer], [cdp_Integration]
GO

------------------------------------------------------------
----- TRIGGER FOR __mj_UpdatedAt field for the Product table
------------------------------------------------------------
IF OBJECT_ID('[morecheese_orders].[trgUpdateProduct]', 'TR') IS NOT NULL
    DROP TRIGGER [morecheese_orders].[trgUpdateProduct];
GO
CREATE TRIGGER [morecheese_orders].trgUpdateProduct
ON [morecheese_orders].[Product]
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE
        [morecheese_orders].[Product]
    SET
        __mj_UpdatedAt = GETUTCDATE()
    FROM
        [morecheese_orders].[Product] AS _organicTable
    INNER JOIN
        INSERTED AS I ON
        _organicTable.[ID] = I.[ID];
END;
GO

/* spUpdate Permissions for MoreCheese: Products */

GRANT EXECUTE ON [morecheese_orders].[spUpdateProduct] TO [cdp_Developer], [cdp_Integration];

/* spDelete SQL for MoreCheese: Products */
-----------------------------------------------------------------
-- SQL Code Generation
-- Entity: MoreCheese: Products
-- Item: spDeleteProduct
--
-- This was generated by the MemberJunction CodeGen tool.
-- This file should NOT be edited by hand.
-----------------------------------------------------------------

------------------------------------------------------------
----- DELETE PROCEDURE FOR Product
------------------------------------------------------------
IF OBJECT_ID('[morecheese_orders].[spDeleteProduct]', 'P') IS NOT NULL
    DROP PROCEDURE [morecheese_orders].[spDeleteProduct];
GO

CREATE PROCEDURE [morecheese_orders].[spDeleteProduct]
    @ID uniqueidentifier
AS
BEGIN
    SET NOCOUNT ON;

    DELETE FROM
        [morecheese_orders].[Product]
    WHERE
        [ID] = @ID


    -- Check if the delete was successful
    IF @@ROWCOUNT = 0
        SELECT NULL AS [ID] -- Return NULL for all primary key fields to indicate no record was deleted
    ELSE
        SELECT @ID AS [ID] -- Return the primary key values to indicate we successfully deleted the record
END
GO
GRANT EXECUTE ON [morecheese_orders].[spDeleteProduct] TO [cdp_Developer], [cdp_Integration];

/* spDelete Permissions for MoreCheese: Products */

GRANT EXECUTE ON [morecheese_orders].[spDeleteProduct] TO [cdp_Developer], [cdp_Integration];

/* SQL text to delete unneeded entity fields (16 scoped entities) */
EXEC [${mjSchema}].[spDeleteUnneededEntityFields] @ExcludedSchemaNames='sys,staging,dbo,${mjSchema},${mjSchema}_UDT,sample_app,AssociationDemo,Bookstore,${mjSchema}_BizAppsCommon,${mjSchema}_BizAppsTasks,${mjSchema}_BizAppsCommittees,${mjSchema}_BizAppsForms,${mjSchema}_BizAppsIssues,secure_messaging,${mjSchema}', @EntityIDs='81B84F0D-7A7A-4897-A8F3-08EB40A09B51,B5027754-CB75-4789-AA34-F71B815F0933,AF2F0CF6-F5BE-4769-B43A-FE3066DEFC44,49DF9400-9C38-422C-8DB6-1373D5392E35,23916A8E-3487-4793-9E18-C209EF097E58,9F493BE6-006B-4FC2-986C-D15AB527E65B,F2C9BD57-8734-4AFE-B20A-2C8C1C3BB25F,FF152388-ED04-4F1F-B237-94D502C4AA54,A3D95071-B312-40E2-AEF3-F90D8EF881AD,BE4D97E0-48DE-4240-A09F-8B39AD4BD043,16538F9B-E025-460D-9505-BD03A7648EC5,CB9A5230-39C0-49EE-A5BC-238D3536B39B,DC863C47-C1FA-4C3F-92D1-DF7F8A7BC153,A3E60AF2-D7CA-407E-A1D3-34320E851892,428C670F-EBE3-41E6-86E4-EB5A274960A1,A05CC658-F8D8-476E-8E84-F2022C6DFEF9';

/* SQL text to insert 18 new entity field(s) */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = 'fc04bdb9-a550-4dd9-be9d-5507186bb0ed' OR (EntityID = '81B84F0D-7A7A-4897-A8F3-08EB40A09B51' AND Name = 'Person')) BEGIN
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
            'fc04bdb9-a550-4dd9-be9d-5507186bb0ed',
            '81B84F0D-7A7A-4897-A8F3-08EB40A09B51', -- Entity: MoreCheese: Orders
            100025,
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

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = 'abf75523-f0c3-4483-b74b-7e0bb2be5387' OR (EntityID = 'F2C9BD57-8734-4AFE-B20A-2C8C1C3BB25F' AND Name = 'Person')) BEGIN
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
            'abf75523-f0c3-4483-b74b-7e0bb2be5387',
            'F2C9BD57-8734-4AFE-B20A-2C8C1C3BB25F', -- Entity: MoreCheese: Advocacy Actions
            100019,
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

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = 'a85246a1-1461-4a08-8210-97d3357e04bd' OR (EntityID = 'BE4D97E0-48DE-4240-A09F-8B39AD4BD043' AND Name = 'Person')) BEGIN
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
            'a85246a1-1461-4a08-8210-97d3357e04bd',
            'BE4D97E0-48DE-4240-A09F-8B39AD4BD043', -- Entity: MoreCheese: Member Profiles
            100029,
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

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = 'c201aecb-bcdc-4fb0-9a8e-0c2bd206aed1' OR (EntityID = 'BE4D97E0-48DE-4240-A09F-8B39AD4BD043' AND Name = 'Organization')) BEGIN
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
            'c201aecb-bcdc-4fb0-9a8e-0c2bd206aed1',
            'BE4D97E0-48DE-4240-A09F-8B39AD4BD043', -- Entity: MoreCheese: Member Profiles
            100030,
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

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '8950e3da-857b-4973-9709-5f44bb2ceb3f' OR (EntityID = 'FF152388-ED04-4F1F-B237-94D502C4AA54' AND Name = 'Person')) BEGIN
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
            '8950e3da-857b-4973-9709-5f44bb2ceb3f',
            'FF152388-ED04-4F1F-B237-94D502C4AA54', -- Entity: MoreCheese: Data Quality Labels
            100025,
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

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = 'e9599ba2-933b-4699-86c9-f9fa21fb39d0' OR (EntityID = 'FF152388-ED04-4F1F-B237-94D502C4AA54' AND Name = 'RelatedPerson')) BEGIN
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
            'e9599ba2-933b-4699-86c9-f9fa21fb39d0',
            'FF152388-ED04-4F1F-B237-94D502C4AA54', -- Entity: MoreCheese: Data Quality Labels
            100026,
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

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '474481f6-96b3-4235-8d87-d2b0780e3efe' OR (EntityID = 'FF152388-ED04-4F1F-B237-94D502C4AA54' AND Name = 'RelatedOrganization')) BEGIN
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
            '474481f6-96b3-4235-8d87-d2b0780e3efe',
            'FF152388-ED04-4F1F-B237-94D502C4AA54', -- Entity: MoreCheese: Data Quality Labels
            100027,
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

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = 'daa561bf-b427-42ca-975b-4b955d77e31c' OR (EntityID = '16538F9B-E025-460D-9505-BD03A7648EC5' AND Name = 'Person')) BEGIN
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
            'daa561bf-b427-42ca-975b-4b955d77e31c',
            '16538F9B-E025-460D-9505-BD03A7648EC5', -- Entity: MoreCheese: Membership Periods
            100031,
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

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '72bb6163-3a23-48c1-a5a0-1c9a75700502' OR (EntityID = '23916A8E-3487-4793-9E18-C209EF097E58' AND Name = 'Person')) BEGIN
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
            '72bb6163-3a23-48c1-a5a0-1c9a75700502',
            '23916A8E-3487-4793-9E18-C209EF097E58', -- Entity: MoreCheese: Member Certifications
            100023,
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

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '737e4ac7-1c79-4677-8401-f1eccd81d3a7' OR (EntityID = '23916A8E-3487-4793-9E18-C209EF097E58' AND Name = 'Certification')) BEGIN
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
            '737e4ac7-1c79-4677-8401-f1eccd81d3a7',
            '23916A8E-3487-4793-9E18-C209EF097E58', -- Entity: MoreCheese: Member Certifications
            100024,
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

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '366f1231-cf05-42ad-afc5-84403d860a66' OR (EntityID = '9F493BE6-006B-4FC2-986C-D15AB527E65B' AND Name = 'Person')) BEGIN
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
            '366f1231-cf05-42ad-afc5-84403d860a66',
            '9F493BE6-006B-4FC2-986C-D15AB527E65B', -- Entity: MoreCheese: Competition Entries
            100023,
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

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '0ead38c3-3c9a-4447-9f96-ded688c870c9' OR (EntityID = '9F493BE6-006B-4FC2-986C-D15AB527E65B' AND Name = 'Organization')) BEGIN
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
            '0ead38c3-3c9a-4447-9f96-ded688c870c9',
            '9F493BE6-006B-4FC2-986C-D15AB527E65B', -- Entity: MoreCheese: Competition Entries
            100024,
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

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '238863f8-a7b8-48d4-a99c-150253a61da2' OR (EntityID = 'DC863C47-C1FA-4C3F-92D1-DF7F8A7BC153' AND Name = 'Person')) BEGIN
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
            '238863f8-a7b8-48d4-a99c-150253a61da2',
            'DC863C47-C1FA-4C3F-92D1-DF7F8A7BC153', -- Entity: MoreCheese: Event Registrations
            100019,
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

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = 'b43a6aef-4c29-4080-9e08-8d3c3f13efe0' OR (EntityID = 'DC863C47-C1FA-4C3F-92D1-DF7F8A7BC153' AND Name = 'Event')) BEGIN
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
            'b43a6aef-4c29-4080-9e08-8d3c3f13efe0',
            'DC863C47-C1FA-4C3F-92D1-DF7F8A7BC153', -- Entity: MoreCheese: Event Registrations
            100020,
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

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '6df3c4e7-c108-4e4d-b28a-d34b7edc8b59' OR (EntityID = '428C670F-EBE3-41E6-86E4-EB5A274960A1' AND Name = 'Person')) BEGIN
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
            '6df3c4e7-c108-4e4d-b28a-d34b7edc8b59',
            '428C670F-EBE3-41E6-86E4-EB5A274960A1', -- Entity: MoreCheese: Course Enrollments
            100021,
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

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = 'ecf95dce-c50f-4005-b194-8c993480784a' OR (EntityID = '428C670F-EBE3-41E6-86E4-EB5A274960A1' AND Name = 'Course')) BEGIN
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
            'ecf95dce-c50f-4005-b194-8c993480784a',
            '428C670F-EBE3-41E6-86E4-EB5A274960A1', -- Entity: MoreCheese: Course Enrollments
            100022,
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

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '84fdbf7c-7ec8-4c61-86f1-0f44656b6dd8' OR (EntityID = 'B5027754-CB75-4789-AA34-F71B815F0933' AND Name = 'Product')) BEGIN
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
            '84fdbf7c-7ec8-4c61-86f1-0f44656b6dd8',
            'B5027754-CB75-4789-AA34-F71B815F0933', -- Entity: MoreCheese: Order Lines
            100019,
            'Product',
            'Product',
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

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '7c6915c9-9b5f-4aae-8c5d-0fd2e9c4443c' OR (EntityID = 'A3D95071-B312-40E2-AEF3-F90D8EF881AD' AND Name = 'Organization')) BEGIN
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
            '7c6915c9-9b5f-4aae-8c5d-0fd2e9c4443c',
            'A3D95071-B312-40E2-AEF3-F90D8EF881AD', -- Entity: MoreCheese: Organization Profiles
            100029,
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

/* SQL text to update existing entity fields from schema (16 scoped entities) */
EXEC [${mjSchema}].[spUpdateExistingEntityFieldsFromSchema] @ExcludedSchemaNames='sys,staging,dbo,${mjSchema},${mjSchema}_UDT,sample_app,AssociationDemo,Bookstore,${mjSchema}_BizAppsCommon,${mjSchema}_BizAppsTasks,${mjSchema}_BizAppsCommittees,${mjSchema}_BizAppsForms,${mjSchema}_BizAppsIssues,secure_messaging,${mjSchema}', @EntityIDs='81B84F0D-7A7A-4897-A8F3-08EB40A09B51,B5027754-CB75-4789-AA34-F71B815F0933,AF2F0CF6-F5BE-4769-B43A-FE3066DEFC44,49DF9400-9C38-422C-8DB6-1373D5392E35,23916A8E-3487-4793-9E18-C209EF097E58,9F493BE6-006B-4FC2-986C-D15AB527E65B,F2C9BD57-8734-4AFE-B20A-2C8C1C3BB25F,FF152388-ED04-4F1F-B237-94D502C4AA54,A3D95071-B312-40E2-AEF3-F90D8EF881AD,BE4D97E0-48DE-4240-A09F-8B39AD4BD043,16538F9B-E025-460D-9505-BD03A7648EC5,CB9A5230-39C0-49EE-A5BC-238D3536B39B,DC863C47-C1FA-4C3F-92D1-DF7F8A7BC153,A3E60AF2-D7CA-407E-A1D3-34320E851892,428C670F-EBE3-41E6-86E4-EB5A274960A1,A05CC658-F8D8-476E-8E84-F2022C6DFEF9';

/* SQL text to set default column width where needed */
EXEC [${mjSchema}].[spSetDefaultColumnWidthWhereNeeded] @ExcludedSchemaNames='sys,staging,dbo,${mjSchema},${mjSchema}_UDT,sample_app,AssociationDemo,Bookstore,${mjSchema}_BizAppsCommon,${mjSchema}_BizAppsTasks,${mjSchema}_BizAppsCommittees,${mjSchema}_BizAppsForms,${mjSchema}_BizAppsIssues,secure_messaging,${mjSchema}';

