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
    City NVARCHAR(100) NOT NULL,
    State NVARCHAR(50) NOT NULL,
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
    City NVARCHAR(100) NOT NULL,
    State NVARCHAR(50) NOT NULL,
    Latitude DECIMAL(9,6) NOT NULL,
    Longitude DECIMAL(9,6) NOT NULL,
    JoinDate DATE NOT NULL,
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
    CONSTRAINT CK_Product_ProductType CHECK (ProductType IN ('Membership', 'Event'))
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
