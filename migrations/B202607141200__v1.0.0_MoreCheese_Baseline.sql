-- ============================================================
-- MoreCheese: baseline schema (v1.0.0)
-- Frozen 2026-07-14 from the datagen generator's shapes (datagen/cli/emit-schema.mjs),
-- which were proven loadable + FK-clean + CodeGen-registrable on a cloned MJ database.
-- From here on, migrations OWN these shapes (immutable, additive-only) — the generator's
-- schema emitter is a dev-playground shim and never ships; a suite drift-guard keeps the
-- generator's assumed shapes matched to this file.
--
-- MULTI-SCHEMA APP: ${flyway:defaultSchema} is the home schema (morecheese_members, per
-- the manifest); the events/learning/orders schemas are ours too and created literally.
-- Identity lives in the bizapps-common DEPENDENCY (declared in mj-app.json, install order
-- guaranteed) — hard FKs into __mj_BizAppsCommon per the linking ruling (2026-07-13).
-- morecheese_orders is the sanctioned stand-in until bizapps-orders ships (memo §2.4).
-- No __mj_* audit columns, no FK indexes — CodeGen adds those.
-- ============================================================

CREATE SCHEMA morecheese_events;
GO
CREATE SCHEMA morecheese_learning;
GO
CREATE SCHEMA morecheese_orders;
GO

-- ---------- extension profiles: what bizapps-common doesn't model ----------

CREATE TABLE ${flyway:defaultSchema}.OrganizationProfile (
    ID UNIQUEIDENTIFIER NOT NULL,
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
    IsSharedDemo BIT NOT NULL,
    CONSTRAINT PK_OrganizationProfile PRIMARY KEY (ID),
    CONSTRAINT FK_OrganizationProfile_Organization FOREIGN KEY (OrganizationID) REFERENCES __mj_BizAppsCommon.Organization (ID)
);
GO

CREATE TABLE ${flyway:defaultSchema}.MemberProfile (
    ID UNIQUEIDENTIFIER NOT NULL,
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
    IsSharedDemo BIT NOT NULL,
    CONSTRAINT PK_MemberProfile PRIMARY KEY (ID),
    CONSTRAINT FK_MemberProfile_Person FOREIGN KEY (PersonID) REFERENCES __mj_BizAppsCommon.Person (ID),
    CONSTRAINT FK_MemberProfile_Organization FOREIGN KEY (OrganizationID) REFERENCES __mj_BizAppsCommon.Organization (ID)
);
GO

-- ---------- membership: the July-31 shipping shape (decomposes into bizapps-orders later) ----------

CREATE TABLE ${flyway:defaultSchema}.MembershipPeriod (
    ID UNIQUEIDENTIFIER NOT NULL,
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
    AutoRenew BIT NOT NULL,
    IsSharedDemo BIT NOT NULL,
    CONSTRAINT PK_MembershipPeriod PRIMARY KEY (ID),
    CONSTRAINT FK_MembershipPeriod_Person FOREIGN KEY (PersonID) REFERENCES __mj_BizAppsCommon.Person (ID)
);
GO

-- ---------- events ----------

CREATE TABLE morecheese_events.Event (
    ID UNIQUEIDENTIFIER NOT NULL,
    EventKey NVARCHAR(50) NOT NULL,
    Name NVARCHAR(200) NOT NULL,
    EventType NVARCHAR(50) NOT NULL,
    EventDate DATE NOT NULL,
    IsVirtual BIT NOT NULL,
    IsPaid BIT NOT NULL,
    City NVARCHAR(100) NULL,
    State NVARCHAR(50) NULL,
    Latitude DECIMAL(9,6) NULL,
    Longitude DECIMAL(9,6) NULL,
    IsSharedDemo BIT NOT NULL,
    CONSTRAINT PK_Event PRIMARY KEY (ID)
);
GO

CREATE TABLE morecheese_events.EventRegistration (
    ID UNIQUEIDENTIFIER NOT NULL,
    RegKey NVARCHAR(120) NOT NULL,
    PersonID UNIQUEIDENTIFIER NOT NULL,
    EventID UNIQUEIDENTIFIER NOT NULL,
    RegisteredOn DATE NOT NULL,
    Attended BIT NULL,
    IsSharedDemo BIT NOT NULL,
    CONSTRAINT PK_EventRegistration PRIMARY KEY (ID),
    CONSTRAINT FK_EventRegistration_Person FOREIGN KEY (PersonID) REFERENCES __mj_BizAppsCommon.Person (ID),
    CONSTRAINT FK_EventRegistration_Event FOREIGN KEY (EventID) REFERENCES morecheese_events.Event (ID)
);
GO

-- ---------- learning ----------

CREATE TABLE morecheese_learning.Course (
    ID UNIQUEIDENTIFIER NOT NULL,
    CourseKey NVARCHAR(50) NOT NULL,
    Name NVARCHAR(200) NOT NULL,
    StartDate DATE NOT NULL,
    DurationWeeks INT NOT NULL,
    IsSharedDemo BIT NOT NULL,
    CONSTRAINT PK_Course PRIMARY KEY (ID)
);
GO

CREATE TABLE morecheese_learning.CourseEnrollment (
    ID UNIQUEIDENTIFIER NOT NULL,
    EnrollKey NVARCHAR(80) NOT NULL,
    PersonID UNIQUEIDENTIFIER NOT NULL,
    CourseID UNIQUEIDENTIFIER NOT NULL,
    EnrolledOn DATE NOT NULL,
    Status NVARCHAR(50) NOT NULL,
    CompletedOn DATE NULL,
    IsSharedDemo BIT NOT NULL,
    CONSTRAINT PK_CourseEnrollment PRIMARY KEY (ID),
    CONSTRAINT FK_CourseEnrollment_Person FOREIGN KEY (PersonID) REFERENCES __mj_BizAppsCommon.Person (ID),
    CONSTRAINT FK_CourseEnrollment_Course FOREIGN KEY (CourseID) REFERENCES morecheese_learning.Course (ID)
);
GO

-- ---------- orders: the sanctioned stand-in until bizapps-orders ships ----------

CREATE TABLE morecheese_orders.Product (
    ID UNIQUEIDENTIFIER NOT NULL,
    ProductKey NVARCHAR(50) NOT NULL,
    Name NVARCHAR(200) NOT NULL,
    ProductType NVARCHAR(50) NOT NULL,
    UnitPrice DECIMAL(10,2) NOT NULL,
    IsSharedDemo BIT NOT NULL,
    CONSTRAINT PK_Product PRIMARY KEY (ID)
);
GO

CREATE TABLE morecheese_orders.[Order] (
    ID UNIQUEIDENTIFIER NOT NULL,
    OrderKey NVARCHAR(50) NOT NULL,
    PersonID UNIQUEIDENTIFIER NOT NULL,
    OrderType NVARCHAR(50) NOT NULL,
    Status NVARCHAR(50) NOT NULL,
    OrderDate DATE NOT NULL,
    DueDate DATE NOT NULL,
    TotalGross DECIMAL(10,2) NOT NULL,
    PaymentStatus NVARCHAR(50) NOT NULL,
    IsSharedDemo BIT NOT NULL,
    CONSTRAINT PK_Order PRIMARY KEY (ID),
    CONSTRAINT FK_Order_Person FOREIGN KEY (PersonID) REFERENCES __mj_BizAppsCommon.Person (ID)
);
GO

CREATE TABLE morecheese_orders.OrderLine (
    ID UNIQUEIDENTIFIER NOT NULL,
    OrderID UNIQUEIDENTIFIER NOT NULL,
    ProductID UNIQUEIDENTIFIER NOT NULL,
    Quantity INT NOT NULL,
    UnitPrice DECIMAL(10,2) NOT NULL,
    LineTotal DECIMAL(10,2) NOT NULL,
    IsSharedDemo BIT NOT NULL,
    CONSTRAINT PK_OrderLine PRIMARY KEY (ID),
    CONSTRAINT FK_OrderLine_Order FOREIGN KEY (OrderID) REFERENCES morecheese_orders.[Order] (ID),
    CONSTRAINT FK_OrderLine_Product FOREIGN KEY (ProductID) REFERENCES morecheese_orders.Product (ID)
);
GO

CREATE TABLE morecheese_orders.Payment (
    ID UNIQUEIDENTIFIER NOT NULL,
    OrderID UNIQUEIDENTIFIER NOT NULL,
    Amount DECIMAL(10,2) NOT NULL,
    PaymentDate DATE NOT NULL,
    Method NVARCHAR(50) NOT NULL,
    Status NVARCHAR(50) NOT NULL,
    IsSharedDemo BIT NOT NULL,
    CONSTRAINT PK_Payment PRIMARY KEY (ID),
    CONSTRAINT FK_Payment_Order FOREIGN KEY (OrderID) REFERENCES morecheese_orders.[Order] (ID)
);
GO
