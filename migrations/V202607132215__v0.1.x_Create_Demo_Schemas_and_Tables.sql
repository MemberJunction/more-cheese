-- MoreCheese demo v0.1.x — create demo schemas + tables (AUTHORITATIVE migration).
-- Adopted from datagen/cli/emit-schema.mjs output (seed 42 · release 2026-07-31 · ruleset v0.0.2)
-- after the 2026-07-13 ruling: morecheese_common.Person/Organization ARE the demo's own model
-- (a simulated external organization's member database sitting next to MJ) — not a stand-in
-- for bizapps-common. Shapes are kept in lockstep with the datagen emitters (drift guard in
-- datagen/test.mjs).
--
-- Conventions: home schema = ${flyway:defaultSchema} (morecheese_common); sibling schemas are
-- literal fixed names. Cross-schema references are SOFT keys (no FK constraints) per the v2
-- plan; hard FKs only within a schema. No __mj_* audit columns (CodeGen owns those).

SET XACT_ABORT ON;

-- schemas
IF SCHEMA_ID('${flyway:defaultSchema}') IS NULL EXEC('CREATE SCHEMA ${flyway:defaultSchema}');
IF SCHEMA_ID('morecheese_members') IS NULL EXEC('CREATE SCHEMA [morecheese_members]');
IF SCHEMA_ID('morecheese_events') IS NULL EXEC('CREATE SCHEMA [morecheese_events]');
IF SCHEMA_ID('morecheese_learning') IS NULL EXEC('CREATE SCHEMA [morecheese_learning]');
IF SCHEMA_ID('morecheese_orders') IS NULL EXEC('CREATE SCHEMA [morecheese_orders]');

-- ${flyway:defaultSchema}.[Organization]
IF OBJECT_ID('${flyway:defaultSchema}.Organization') IS NULL
CREATE TABLE ${flyway:defaultSchema}.[Organization] (
  [ID] UNIQUEIDENTIFIER NOT NULL CONSTRAINT [PK_Organization] PRIMARY KEY,
  [OrgKey] NVARCHAR(50) NOT NULL,
  [Name] NVARCHAR(200) NOT NULL,
  [Type] NVARCHAR(50) NOT NULL,
  [Region] NVARCHAR(50) NOT NULL,
  [City] NVARCHAR(100) NOT NULL,
  [State] NVARCHAR(50) NOT NULL,
  [Latitude] DECIMAL(9,6) NOT NULL,
  [Longitude] DECIMAL(9,6) NOT NULL,
  [LifecycleEventKind] NVARCHAR(50) NULL,
  [LifecycleEventYear] INT NULL,
  [IsSharedDemo] BIT NOT NULL
);

-- ${flyway:defaultSchema}.[Person]
IF OBJECT_ID('${flyway:defaultSchema}.Person') IS NULL
CREATE TABLE ${flyway:defaultSchema}.[Person] (
  [ID] UNIQUEIDENTIFIER NOT NULL CONSTRAINT [PK_Person] PRIMARY KEY,
  [MemberNumber] NVARCHAR(50) NOT NULL,
  [FirstName] NVARCHAR(100) NOT NULL,
  [LastName] NVARCHAR(100) NOT NULL,
  [Segment] NVARCHAR(50) NOT NULL,
  [Region] NVARCHAR(50) NOT NULL,
  [City] NVARCHAR(100) NOT NULL,
  [State] NVARCHAR(50) NOT NULL,
  [Latitude] DECIMAL(9,6) NOT NULL,
  [Longitude] DECIMAL(9,6) NOT NULL,
  [OrganizationID] UNIQUEIDENTIFIER NULL,
  [JoinDate] DATE NOT NULL,
  [IsSharedDemo] BIT NOT NULL,
  CONSTRAINT [FK_Person_OrganizationID] FOREIGN KEY ([OrganizationID]) REFERENCES ${flyway:defaultSchema}.[Organization] ([ID])
);

-- [morecheese_events].[Event]
IF OBJECT_ID('morecheese_events.Event') IS NULL
CREATE TABLE [morecheese_events].[Event] (
  [ID] UNIQUEIDENTIFIER NOT NULL CONSTRAINT [PK_Event] PRIMARY KEY,
  [EventKey] NVARCHAR(50) NOT NULL,
  [Name] NVARCHAR(200) NOT NULL,
  [EventType] NVARCHAR(50) NOT NULL,
  [EventDate] DATE NOT NULL,
  [IsVirtual] BIT NOT NULL,
  [IsPaid] BIT NOT NULL,
  [City] NVARCHAR(100) NULL,
  [State] NVARCHAR(50) NULL,
  [Latitude] DECIMAL(9,6) NULL,
  [Longitude] DECIMAL(9,6) NULL,
  [IsSharedDemo] BIT NOT NULL
);

-- [morecheese_members].[MembershipPeriod]
IF OBJECT_ID('morecheese_members.MembershipPeriod') IS NULL
CREATE TABLE [morecheese_members].[MembershipPeriod] (
  [ID] UNIQUEIDENTIFIER NOT NULL CONSTRAINT [PK_MembershipPeriod] PRIMARY KEY,
  [PeriodKey] NVARCHAR(60) NOT NULL,
  [PersonID] UNIQUEIDENTIFIER NOT NULL,
  [MembershipTier] NVARCHAR(50) NOT NULL,
  [DuesAmount] DECIMAL(10,2) NOT NULL,
  [StartDate] DATE NOT NULL,
  [EndDate] DATE NOT NULL,
  [RenewalDate] DATE NOT NULL,
  [Status] NVARCHAR(50) NOT NULL,
  [CancellationDate] DATE NULL,
  [CancellationReason] NVARCHAR(200) NULL,
  [AutoRenew] BIT NOT NULL,
  [IsSharedDemo] BIT NOT NULL,
  CONSTRAINT [FK_MembershipPeriod_PersonID] FOREIGN KEY ([PersonID]) REFERENCES ${flyway:defaultSchema}.[Person] ([ID])
);

-- [morecheese_events].[EventRegistration]
IF OBJECT_ID('morecheese_events.EventRegistration') IS NULL
CREATE TABLE [morecheese_events].[EventRegistration] (
  [ID] UNIQUEIDENTIFIER NOT NULL CONSTRAINT [PK_EventRegistration] PRIMARY KEY,
  [RegKey] NVARCHAR(120) NOT NULL,
  [PersonID] UNIQUEIDENTIFIER NOT NULL,
  [EventID] UNIQUEIDENTIFIER NOT NULL,
  [RegisteredOn] DATE NOT NULL,
  [Attended] BIT NULL,
  [IsSharedDemo] BIT NOT NULL,
  CONSTRAINT [FK_EventRegistration_PersonID] FOREIGN KEY ([PersonID]) REFERENCES ${flyway:defaultSchema}.[Person] ([ID]),
  CONSTRAINT [FK_EventRegistration_EventID] FOREIGN KEY ([EventID]) REFERENCES [morecheese_events].[Event] ([ID])
);

-- [morecheese_learning].[Course]
IF OBJECT_ID('morecheese_learning.Course') IS NULL
CREATE TABLE [morecheese_learning].[Course] (
  [ID] UNIQUEIDENTIFIER NOT NULL CONSTRAINT [PK_Course] PRIMARY KEY,
  [CourseKey] NVARCHAR(50) NOT NULL,
  [Name] NVARCHAR(200) NOT NULL,
  [StartDate] DATE NOT NULL,
  [DurationWeeks] INT NOT NULL,
  [IsSharedDemo] BIT NOT NULL
);

-- [morecheese_learning].[CourseEnrollment]
IF OBJECT_ID('morecheese_learning.CourseEnrollment') IS NULL
CREATE TABLE [morecheese_learning].[CourseEnrollment] (
  [ID] UNIQUEIDENTIFIER NOT NULL CONSTRAINT [PK_CourseEnrollment] PRIMARY KEY,
  [EnrollKey] NVARCHAR(80) NOT NULL,
  [PersonID] UNIQUEIDENTIFIER NOT NULL,
  [CourseID] UNIQUEIDENTIFIER NOT NULL,
  [EnrolledOn] DATE NOT NULL,
  [Status] NVARCHAR(50) NOT NULL,
  [CompletedOn] DATE NULL,
  [IsSharedDemo] BIT NOT NULL,
  CONSTRAINT [FK_CourseEnrollment_PersonID] FOREIGN KEY ([PersonID]) REFERENCES ${flyway:defaultSchema}.[Person] ([ID]),
  CONSTRAINT [FK_CourseEnrollment_CourseID] FOREIGN KEY ([CourseID]) REFERENCES [morecheese_learning].[Course] ([ID])
);

-- [morecheese_orders].[Product]
IF OBJECT_ID('morecheese_orders.Product') IS NULL
CREATE TABLE [morecheese_orders].[Product] (
  [ID] UNIQUEIDENTIFIER NOT NULL CONSTRAINT [PK_Product] PRIMARY KEY,
  [ProductKey] NVARCHAR(50) NOT NULL,
  [Name] NVARCHAR(200) NOT NULL,
  [ProductType] NVARCHAR(50) NOT NULL,
  [UnitPrice] DECIMAL(10,2) NOT NULL,
  [IsSharedDemo] BIT NOT NULL
);

-- [morecheese_orders].[Order]
IF OBJECT_ID('morecheese_orders.Order') IS NULL
CREATE TABLE [morecheese_orders].[Order] (
  [ID] UNIQUEIDENTIFIER NOT NULL CONSTRAINT [PK_Order] PRIMARY KEY,
  [OrderKey] NVARCHAR(50) NOT NULL,
  [PersonID] UNIQUEIDENTIFIER NOT NULL,
  [OrderType] NVARCHAR(50) NOT NULL,
  [Status] NVARCHAR(50) NOT NULL,
  [OrderDate] DATE NOT NULL,
  [DueDate] DATE NOT NULL,
  [TotalGross] DECIMAL(10,2) NOT NULL,
  [PaymentStatus] NVARCHAR(50) NOT NULL,
  [IsSharedDemo] BIT NOT NULL,
  CONSTRAINT [FK_Order_PersonID] FOREIGN KEY ([PersonID]) REFERENCES ${flyway:defaultSchema}.[Person] ([ID])
);

-- [morecheese_orders].[OrderLine]
IF OBJECT_ID('morecheese_orders.OrderLine') IS NULL
CREATE TABLE [morecheese_orders].[OrderLine] (
  [ID] UNIQUEIDENTIFIER NOT NULL CONSTRAINT [PK_OrderLine] PRIMARY KEY,
  [OrderID] UNIQUEIDENTIFIER NOT NULL,
  [ProductID] UNIQUEIDENTIFIER NOT NULL,
  [Quantity] INT NOT NULL,
  [UnitPrice] DECIMAL(10,2) NOT NULL,
  [LineTotal] DECIMAL(10,2) NOT NULL,
  [IsSharedDemo] BIT NOT NULL,
  CONSTRAINT [FK_OrderLine_OrderID] FOREIGN KEY ([OrderID]) REFERENCES [morecheese_orders].[Order] ([ID]),
  CONSTRAINT [FK_OrderLine_ProductID] FOREIGN KEY ([ProductID]) REFERENCES [morecheese_orders].[Product] ([ID])
);

-- [morecheese_orders].[Payment]
IF OBJECT_ID('morecheese_orders.Payment') IS NULL
CREATE TABLE [morecheese_orders].[Payment] (
  [ID] UNIQUEIDENTIFIER NOT NULL CONSTRAINT [PK_Payment] PRIMARY KEY,
  [OrderID] UNIQUEIDENTIFIER NOT NULL,
  [Amount] DECIMAL(10,2) NOT NULL,
  [PaymentDate] DATE NOT NULL,
  [Method] NVARCHAR(50) NOT NULL,
  [Status] NVARCHAR(50) NOT NULL,
  [IsSharedDemo] BIT NOT NULL,
  CONSTRAINT [FK_Payment_OrderID] FOREIGN KEY ([OrderID]) REFERENCES [morecheese_orders].[Order] ([ID])
);
