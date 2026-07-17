-- =========================================================================
-- V202607170800__v1.0.0_CodeGen.sql
--
-- CodeGen output for the MoreCheese demo schema, folded into a migration so a
-- clean install reproduces it. Captured from a real run against MJ 5.48.0
-- (instance `morecheese-datagen`) after B202607141200 + V1.1.0/V1.2.0/V1.3.0.
--
-- WHY this migration exists: `mj app install` does NOT run CodeGen — its step 8
-- is "Run migrations (Skyway - DDL + metadata DML)" and nothing more
-- (OpenApp/Engine/src/install/install-orchestrator.ts:188-201). So anything
-- CodeGen produces that a consumer needs must ship as SQL. This mirrors the
-- shipped BizApps convention (e.g. bizapps-issues folds its CREATE VIEW /
-- CREATE PROCEDURE / __mj_* columns / IDX_AUTO_MJ_FKEY_* indexes into its
-- applied baseline). Our baseline is already frozen + applied, so this lands as
-- a follow-up V* instead of an edit to it (never edit an applied migration).
--
-- Contents (16 entities across morecheese_members/_events/_learning/_orders):
--   * 16 base views, 48 CRUD procs (spCreate/spUpdate/spDelete x 16)
--   * __mj_CreatedAt/__mj_UpdatedAt columns + their triggers
--   * IDX_AUTO_MJ_FKEY_* foreign-key indexes
--   * entity/field metadata DML + permission GRANTs
--
-- Placeholders: ${flyway:defaultSchema} = morecheese_members (the manifest's
-- home schema), ${mjSchema} = MJ core. morecheese_events/_learning/_orders are
-- written LITERALLY — they are fixed names created by the baseline, and only the
-- home schema is placeholder-mapped (mj.config.cjs SQLOutput.schemaPlaceholders).
--
-- GENERATED — do not hand-edit. Regenerate by re-running `mj codegen` and
-- re-folding migrations/codegen/CodeGen_Run_*.sql.
-- =========================================================================

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
         'fe8bf319-06bc-4e03-a22a-7864db37579f',
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
                                       ('3C46B3A5-34FB-51EA-B54D-77E9F104ABAF', 'fe8bf319-06bc-4e03-a22a-7864db37579f', (SELECT COALESCE(MAX([Sequence]),0)+1 FROM [${mjSchema}].[ApplicationEntity] WHERE [ApplicationID] = '3C46B3A5-34FB-51EA-B54D-77E9F104ABAF'), GETUTCDATE(), GETUTCDATE());

/* SQL generated to add new permission for entity MoreCheese: Course Enrollments for role UI */
INSERT INTO [${mjSchema}].[EntityPermission]
                                                   ([EntityID], [RoleID], [CanRead], [CanCreate], [CanUpdate], [CanDelete], [__mj_CreatedAt], [__mj_UpdatedAt]) VALUES
                                                   ('fe8bf319-06bc-4e03-a22a-7864db37579f', 'E0AFCCEC-6A37-EF11-86D4-000D3A4E707E', 1, 0, 0, 0, GETUTCDATE(), GETUTCDATE());

/* SQL generated to add new permission for entity MoreCheese: Course Enrollments for role Developer */
INSERT INTO [${mjSchema}].[EntityPermission]
                                                   ([EntityID], [RoleID], [CanRead], [CanCreate], [CanUpdate], [CanDelete], [__mj_CreatedAt], [__mj_UpdatedAt]) VALUES
                                                   ('fe8bf319-06bc-4e03-a22a-7864db37579f', 'DEAFCCEC-6A37-EF11-86D4-000D3A4E707E', 1, 1, 1, 1, GETUTCDATE(), GETUTCDATE());

/* SQL generated to add new permission for entity MoreCheese: Course Enrollments for role Integration */
INSERT INTO [${mjSchema}].[EntityPermission]
                                                   ([EntityID], [RoleID], [CanRead], [CanCreate], [CanUpdate], [CanDelete], [__mj_CreatedAt], [__mj_UpdatedAt]) VALUES
                                                   ('fe8bf319-06bc-4e03-a22a-7864db37579f', 'DFAFCCEC-6A37-EF11-86D4-000D3A4E707E', 1, 1, 1, 1, GETUTCDATE(), GETUTCDATE());

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
         'd2d94e6a-e5e0-4baa-a50b-5479770d2f4e',
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
                                       ('3C46B3A5-34FB-51EA-B54D-77E9F104ABAF', 'd2d94e6a-e5e0-4baa-a50b-5479770d2f4e', (SELECT COALESCE(MAX([Sequence]),0)+1 FROM [${mjSchema}].[ApplicationEntity] WHERE [ApplicationID] = '3C46B3A5-34FB-51EA-B54D-77E9F104ABAF'), GETUTCDATE(), GETUTCDATE());

/* SQL generated to add new permission for entity MoreCheese: Products for role UI */
INSERT INTO [${mjSchema}].[EntityPermission]
                                                   ([EntityID], [RoleID], [CanRead], [CanCreate], [CanUpdate], [CanDelete], [__mj_CreatedAt], [__mj_UpdatedAt]) VALUES
                                                   ('d2d94e6a-e5e0-4baa-a50b-5479770d2f4e', 'E0AFCCEC-6A37-EF11-86D4-000D3A4E707E', 1, 0, 0, 0, GETUTCDATE(), GETUTCDATE());

/* SQL generated to add new permission for entity MoreCheese: Products for role Developer */
INSERT INTO [${mjSchema}].[EntityPermission]
                                                   ([EntityID], [RoleID], [CanRead], [CanCreate], [CanUpdate], [CanDelete], [__mj_CreatedAt], [__mj_UpdatedAt]) VALUES
                                                   ('d2d94e6a-e5e0-4baa-a50b-5479770d2f4e', 'DEAFCCEC-6A37-EF11-86D4-000D3A4E707E', 1, 1, 1, 1, GETUTCDATE(), GETUTCDATE());

/* SQL generated to add new permission for entity MoreCheese: Products for role Integration */
INSERT INTO [${mjSchema}].[EntityPermission]
                                                   ([EntityID], [RoleID], [CanRead], [CanCreate], [CanUpdate], [CanDelete], [__mj_CreatedAt], [__mj_UpdatedAt]) VALUES
                                                   ('d2d94e6a-e5e0-4baa-a50b-5479770d2f4e', 'DFAFCCEC-6A37-EF11-86D4-000D3A4E707E', 1, 1, 1, 1, GETUTCDATE(), GETUTCDATE());

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
         'a186072d-0d8b-497e-8766-9b2f300a6055',
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
                                       ('3C46B3A5-34FB-51EA-B54D-77E9F104ABAF', 'a186072d-0d8b-497e-8766-9b2f300a6055', (SELECT COALESCE(MAX([Sequence]),0)+1 FROM [${mjSchema}].[ApplicationEntity] WHERE [ApplicationID] = '3C46B3A5-34FB-51EA-B54D-77E9F104ABAF'), GETUTCDATE(), GETUTCDATE());

/* SQL generated to add new permission for entity MoreCheese: Orders for role UI */
INSERT INTO [${mjSchema}].[EntityPermission]
                                                   ([EntityID], [RoleID], [CanRead], [CanCreate], [CanUpdate], [CanDelete], [__mj_CreatedAt], [__mj_UpdatedAt]) VALUES
                                                   ('a186072d-0d8b-497e-8766-9b2f300a6055', 'E0AFCCEC-6A37-EF11-86D4-000D3A4E707E', 1, 0, 0, 0, GETUTCDATE(), GETUTCDATE());

/* SQL generated to add new permission for entity MoreCheese: Orders for role Developer */
INSERT INTO [${mjSchema}].[EntityPermission]
                                                   ([EntityID], [RoleID], [CanRead], [CanCreate], [CanUpdate], [CanDelete], [__mj_CreatedAt], [__mj_UpdatedAt]) VALUES
                                                   ('a186072d-0d8b-497e-8766-9b2f300a6055', 'DEAFCCEC-6A37-EF11-86D4-000D3A4E707E', 1, 1, 1, 1, GETUTCDATE(), GETUTCDATE());

/* SQL generated to add new permission for entity MoreCheese: Orders for role Integration */
INSERT INTO [${mjSchema}].[EntityPermission]
                                                   ([EntityID], [RoleID], [CanRead], [CanCreate], [CanUpdate], [CanDelete], [__mj_CreatedAt], [__mj_UpdatedAt]) VALUES
                                                   ('a186072d-0d8b-497e-8766-9b2f300a6055', 'DFAFCCEC-6A37-EF11-86D4-000D3A4E707E', 1, 1, 1, 1, GETUTCDATE(), GETUTCDATE());

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
         '594a4ce0-05a6-407a-92af-4690b557bc6b',
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
                                       ('3C46B3A5-34FB-51EA-B54D-77E9F104ABAF', '594a4ce0-05a6-407a-92af-4690b557bc6b', (SELECT COALESCE(MAX([Sequence]),0)+1 FROM [${mjSchema}].[ApplicationEntity] WHERE [ApplicationID] = '3C46B3A5-34FB-51EA-B54D-77E9F104ABAF'), GETUTCDATE(), GETUTCDATE());

/* SQL generated to add new permission for entity MoreCheese: Order Lines for role UI */
INSERT INTO [${mjSchema}].[EntityPermission]
                                                   ([EntityID], [RoleID], [CanRead], [CanCreate], [CanUpdate], [CanDelete], [__mj_CreatedAt], [__mj_UpdatedAt]) VALUES
                                                   ('594a4ce0-05a6-407a-92af-4690b557bc6b', 'E0AFCCEC-6A37-EF11-86D4-000D3A4E707E', 1, 0, 0, 0, GETUTCDATE(), GETUTCDATE());

/* SQL generated to add new permission for entity MoreCheese: Order Lines for role Developer */
INSERT INTO [${mjSchema}].[EntityPermission]
                                                   ([EntityID], [RoleID], [CanRead], [CanCreate], [CanUpdate], [CanDelete], [__mj_CreatedAt], [__mj_UpdatedAt]) VALUES
                                                   ('594a4ce0-05a6-407a-92af-4690b557bc6b', 'DEAFCCEC-6A37-EF11-86D4-000D3A4E707E', 1, 1, 1, 1, GETUTCDATE(), GETUTCDATE());

/* SQL generated to add new permission for entity MoreCheese: Order Lines for role Integration */
INSERT INTO [${mjSchema}].[EntityPermission]
                                                   ([EntityID], [RoleID], [CanRead], [CanCreate], [CanUpdate], [CanDelete], [__mj_CreatedAt], [__mj_UpdatedAt]) VALUES
                                                   ('594a4ce0-05a6-407a-92af-4690b557bc6b', 'DFAFCCEC-6A37-EF11-86D4-000D3A4E707E', 1, 1, 1, 1, GETUTCDATE(), GETUTCDATE());

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
         '8d7a9a85-352e-4be4-a663-4f930ed61a42',
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
                                       ('3C46B3A5-34FB-51EA-B54D-77E9F104ABAF', '8d7a9a85-352e-4be4-a663-4f930ed61a42', (SELECT COALESCE(MAX([Sequence]),0)+1 FROM [${mjSchema}].[ApplicationEntity] WHERE [ApplicationID] = '3C46B3A5-34FB-51EA-B54D-77E9F104ABAF'), GETUTCDATE(), GETUTCDATE());

/* SQL generated to add new permission for entity MoreCheese: Payments for role UI */
INSERT INTO [${mjSchema}].[EntityPermission]
                                                   ([EntityID], [RoleID], [CanRead], [CanCreate], [CanUpdate], [CanDelete], [__mj_CreatedAt], [__mj_UpdatedAt]) VALUES
                                                   ('8d7a9a85-352e-4be4-a663-4f930ed61a42', 'E0AFCCEC-6A37-EF11-86D4-000D3A4E707E', 1, 0, 0, 0, GETUTCDATE(), GETUTCDATE());

/* SQL generated to add new permission for entity MoreCheese: Payments for role Developer */
INSERT INTO [${mjSchema}].[EntityPermission]
                                                   ([EntityID], [RoleID], [CanRead], [CanCreate], [CanUpdate], [CanDelete], [__mj_CreatedAt], [__mj_UpdatedAt]) VALUES
                                                   ('8d7a9a85-352e-4be4-a663-4f930ed61a42', 'DEAFCCEC-6A37-EF11-86D4-000D3A4E707E', 1, 1, 1, 1, GETUTCDATE(), GETUTCDATE());

/* SQL generated to add new permission for entity MoreCheese: Payments for role Integration */
INSERT INTO [${mjSchema}].[EntityPermission]
                                                   ([EntityID], [RoleID], [CanRead], [CanCreate], [CanUpdate], [CanDelete], [__mj_CreatedAt], [__mj_UpdatedAt]) VALUES
                                                   ('8d7a9a85-352e-4be4-a663-4f930ed61a42', 'DFAFCCEC-6A37-EF11-86D4-000D3A4E707E', 1, 1, 1, 1, GETUTCDATE(), GETUTCDATE());

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
         '3c5ed337-c9be-4ecc-9ba4-1be2a797f0f2',
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
                                       ('3C46B3A5-34FB-51EA-B54D-77E9F104ABAF', '3c5ed337-c9be-4ecc-9ba4-1be2a797f0f2', (SELECT COALESCE(MAX([Sequence]),0)+1 FROM [${mjSchema}].[ApplicationEntity] WHERE [ApplicationID] = '3C46B3A5-34FB-51EA-B54D-77E9F104ABAF'), GETUTCDATE(), GETUTCDATE());

/* SQL generated to add new permission for entity MoreCheese: Certifications for role UI */
INSERT INTO [${mjSchema}].[EntityPermission]
                                                   ([EntityID], [RoleID], [CanRead], [CanCreate], [CanUpdate], [CanDelete], [__mj_CreatedAt], [__mj_UpdatedAt]) VALUES
                                                   ('3c5ed337-c9be-4ecc-9ba4-1be2a797f0f2', 'E0AFCCEC-6A37-EF11-86D4-000D3A4E707E', 1, 0, 0, 0, GETUTCDATE(), GETUTCDATE());

/* SQL generated to add new permission for entity MoreCheese: Certifications for role Developer */
INSERT INTO [${mjSchema}].[EntityPermission]
                                                   ([EntityID], [RoleID], [CanRead], [CanCreate], [CanUpdate], [CanDelete], [__mj_CreatedAt], [__mj_UpdatedAt]) VALUES
                                                   ('3c5ed337-c9be-4ecc-9ba4-1be2a797f0f2', 'DEAFCCEC-6A37-EF11-86D4-000D3A4E707E', 1, 1, 1, 1, GETUTCDATE(), GETUTCDATE());

/* SQL generated to add new permission for entity MoreCheese: Certifications for role Integration */
INSERT INTO [${mjSchema}].[EntityPermission]
                                                   ([EntityID], [RoleID], [CanRead], [CanCreate], [CanUpdate], [CanDelete], [__mj_CreatedAt], [__mj_UpdatedAt]) VALUES
                                                   ('3c5ed337-c9be-4ecc-9ba4-1be2a797f0f2', 'DFAFCCEC-6A37-EF11-86D4-000D3A4E707E', 1, 1, 1, 1, GETUTCDATE(), GETUTCDATE());

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
         'f4d4ba79-c264-45c6-9a51-a00571abcd6b',
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
                                       ('3C46B3A5-34FB-51EA-B54D-77E9F104ABAF', 'f4d4ba79-c264-45c6-9a51-a00571abcd6b', (SELECT COALESCE(MAX([Sequence]),0)+1 FROM [${mjSchema}].[ApplicationEntity] WHERE [ApplicationID] = '3C46B3A5-34FB-51EA-B54D-77E9F104ABAF'), GETUTCDATE(), GETUTCDATE());

/* SQL generated to add new permission for entity MoreCheese: Member Certifications for role UI */
INSERT INTO [${mjSchema}].[EntityPermission]
                                                   ([EntityID], [RoleID], [CanRead], [CanCreate], [CanUpdate], [CanDelete], [__mj_CreatedAt], [__mj_UpdatedAt]) VALUES
                                                   ('f4d4ba79-c264-45c6-9a51-a00571abcd6b', 'E0AFCCEC-6A37-EF11-86D4-000D3A4E707E', 1, 0, 0, 0, GETUTCDATE(), GETUTCDATE());

/* SQL generated to add new permission for entity MoreCheese: Member Certifications for role Developer */
INSERT INTO [${mjSchema}].[EntityPermission]
                                                   ([EntityID], [RoleID], [CanRead], [CanCreate], [CanUpdate], [CanDelete], [__mj_CreatedAt], [__mj_UpdatedAt]) VALUES
                                                   ('f4d4ba79-c264-45c6-9a51-a00571abcd6b', 'DEAFCCEC-6A37-EF11-86D4-000D3A4E707E', 1, 1, 1, 1, GETUTCDATE(), GETUTCDATE());

/* SQL generated to add new permission for entity MoreCheese: Member Certifications for role Integration */
INSERT INTO [${mjSchema}].[EntityPermission]
                                                   ([EntityID], [RoleID], [CanRead], [CanCreate], [CanUpdate], [CanDelete], [__mj_CreatedAt], [__mj_UpdatedAt]) VALUES
                                                   ('f4d4ba79-c264-45c6-9a51-a00571abcd6b', 'DFAFCCEC-6A37-EF11-86D4-000D3A4E707E', 1, 1, 1, 1, GETUTCDATE(), GETUTCDATE());

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
         '1928bdf7-d4ee-4c1b-b36d-cc3b9a4782ac',
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
                                       ('3C46B3A5-34FB-51EA-B54D-77E9F104ABAF', '1928bdf7-d4ee-4c1b-b36d-cc3b9a4782ac', (SELECT COALESCE(MAX([Sequence]),0)+1 FROM [${mjSchema}].[ApplicationEntity] WHERE [ApplicationID] = '3C46B3A5-34FB-51EA-B54D-77E9F104ABAF'), GETUTCDATE(), GETUTCDATE());

/* SQL generated to add new permission for entity MoreCheese: Competition Entries for role UI */
INSERT INTO [${mjSchema}].[EntityPermission]
                                                   ([EntityID], [RoleID], [CanRead], [CanCreate], [CanUpdate], [CanDelete], [__mj_CreatedAt], [__mj_UpdatedAt]) VALUES
                                                   ('1928bdf7-d4ee-4c1b-b36d-cc3b9a4782ac', 'E0AFCCEC-6A37-EF11-86D4-000D3A4E707E', 1, 0, 0, 0, GETUTCDATE(), GETUTCDATE());

/* SQL generated to add new permission for entity MoreCheese: Competition Entries for role Developer */
INSERT INTO [${mjSchema}].[EntityPermission]
                                                   ([EntityID], [RoleID], [CanRead], [CanCreate], [CanUpdate], [CanDelete], [__mj_CreatedAt], [__mj_UpdatedAt]) VALUES
                                                   ('1928bdf7-d4ee-4c1b-b36d-cc3b9a4782ac', 'DEAFCCEC-6A37-EF11-86D4-000D3A4E707E', 1, 1, 1, 1, GETUTCDATE(), GETUTCDATE());

/* SQL generated to add new permission for entity MoreCheese: Competition Entries for role Integration */
INSERT INTO [${mjSchema}].[EntityPermission]
                                                   ([EntityID], [RoleID], [CanRead], [CanCreate], [CanUpdate], [CanDelete], [__mj_CreatedAt], [__mj_UpdatedAt]) VALUES
                                                   ('1928bdf7-d4ee-4c1b-b36d-cc3b9a4782ac', 'DFAFCCEC-6A37-EF11-86D4-000D3A4E707E', 1, 1, 1, 1, GETUTCDATE(), GETUTCDATE());

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
         '318e1216-842b-4ef7-8ad5-fcc4fc83e16e',
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
                                       ('3C46B3A5-34FB-51EA-B54D-77E9F104ABAF', '318e1216-842b-4ef7-8ad5-fcc4fc83e16e', (SELECT COALESCE(MAX([Sequence]),0)+1 FROM [${mjSchema}].[ApplicationEntity] WHERE [ApplicationID] = '3C46B3A5-34FB-51EA-B54D-77E9F104ABAF'), GETUTCDATE(), GETUTCDATE());

/* SQL generated to add new permission for entity MoreCheese: Advocacy Actions for role UI */
INSERT INTO [${mjSchema}].[EntityPermission]
                                                   ([EntityID], [RoleID], [CanRead], [CanCreate], [CanUpdate], [CanDelete], [__mj_CreatedAt], [__mj_UpdatedAt]) VALUES
                                                   ('318e1216-842b-4ef7-8ad5-fcc4fc83e16e', 'E0AFCCEC-6A37-EF11-86D4-000D3A4E707E', 1, 0, 0, 0, GETUTCDATE(), GETUTCDATE());

/* SQL generated to add new permission for entity MoreCheese: Advocacy Actions for role Developer */
INSERT INTO [${mjSchema}].[EntityPermission]
                                                   ([EntityID], [RoleID], [CanRead], [CanCreate], [CanUpdate], [CanDelete], [__mj_CreatedAt], [__mj_UpdatedAt]) VALUES
                                                   ('318e1216-842b-4ef7-8ad5-fcc4fc83e16e', 'DEAFCCEC-6A37-EF11-86D4-000D3A4E707E', 1, 1, 1, 1, GETUTCDATE(), GETUTCDATE());

/* SQL generated to add new permission for entity MoreCheese: Advocacy Actions for role Integration */
INSERT INTO [${mjSchema}].[EntityPermission]
                                                   ([EntityID], [RoleID], [CanRead], [CanCreate], [CanUpdate], [CanDelete], [__mj_CreatedAt], [__mj_UpdatedAt]) VALUES
                                                   ('318e1216-842b-4ef7-8ad5-fcc4fc83e16e', 'DFAFCCEC-6A37-EF11-86D4-000D3A4E707E', 1, 1, 1, 1, GETUTCDATE(), GETUTCDATE());

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
         '74a95cb4-0407-4a2a-a84e-18faf120b0d6',
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
                                       ('3C46B3A5-34FB-51EA-B54D-77E9F104ABAF', '74a95cb4-0407-4a2a-a84e-18faf120b0d6', (SELECT COALESCE(MAX([Sequence]),0)+1 FROM [${mjSchema}].[ApplicationEntity] WHERE [ApplicationID] = '3C46B3A5-34FB-51EA-B54D-77E9F104ABAF'), GETUTCDATE(), GETUTCDATE());

/* SQL generated to add new permission for entity MoreCheese: Data Quality Labels for role UI */
INSERT INTO [${mjSchema}].[EntityPermission]
                                                   ([EntityID], [RoleID], [CanRead], [CanCreate], [CanUpdate], [CanDelete], [__mj_CreatedAt], [__mj_UpdatedAt]) VALUES
                                                   ('74a95cb4-0407-4a2a-a84e-18faf120b0d6', 'E0AFCCEC-6A37-EF11-86D4-000D3A4E707E', 1, 0, 0, 0, GETUTCDATE(), GETUTCDATE());

/* SQL generated to add new permission for entity MoreCheese: Data Quality Labels for role Developer */
INSERT INTO [${mjSchema}].[EntityPermission]
                                                   ([EntityID], [RoleID], [CanRead], [CanCreate], [CanUpdate], [CanDelete], [__mj_CreatedAt], [__mj_UpdatedAt]) VALUES
                                                   ('74a95cb4-0407-4a2a-a84e-18faf120b0d6', 'DEAFCCEC-6A37-EF11-86D4-000D3A4E707E', 1, 1, 1, 1, GETUTCDATE(), GETUTCDATE());

/* SQL generated to add new permission for entity MoreCheese: Data Quality Labels for role Integration */
INSERT INTO [${mjSchema}].[EntityPermission]
                                                   ([EntityID], [RoleID], [CanRead], [CanCreate], [CanUpdate], [CanDelete], [__mj_CreatedAt], [__mj_UpdatedAt]) VALUES
                                                   ('74a95cb4-0407-4a2a-a84e-18faf120b0d6', 'DFAFCCEC-6A37-EF11-86D4-000D3A4E707E', 1, 1, 1, 1, GETUTCDATE(), GETUTCDATE());

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
         '56a03017-ebd2-4bc3-a67c-73fdb8c189f4',
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
                                       ('3C46B3A5-34FB-51EA-B54D-77E9F104ABAF', '56a03017-ebd2-4bc3-a67c-73fdb8c189f4', (SELECT COALESCE(MAX([Sequence]),0)+1 FROM [${mjSchema}].[ApplicationEntity] WHERE [ApplicationID] = '3C46B3A5-34FB-51EA-B54D-77E9F104ABAF'), GETUTCDATE(), GETUTCDATE());

/* SQL generated to add new permission for entity MoreCheese: Organization Profiles for role UI */
INSERT INTO [${mjSchema}].[EntityPermission]
                                                   ([EntityID], [RoleID], [CanRead], [CanCreate], [CanUpdate], [CanDelete], [__mj_CreatedAt], [__mj_UpdatedAt]) VALUES
                                                   ('56a03017-ebd2-4bc3-a67c-73fdb8c189f4', 'E0AFCCEC-6A37-EF11-86D4-000D3A4E707E', 1, 0, 0, 0, GETUTCDATE(), GETUTCDATE());

/* SQL generated to add new permission for entity MoreCheese: Organization Profiles for role Developer */
INSERT INTO [${mjSchema}].[EntityPermission]
                                                   ([EntityID], [RoleID], [CanRead], [CanCreate], [CanUpdate], [CanDelete], [__mj_CreatedAt], [__mj_UpdatedAt]) VALUES
                                                   ('56a03017-ebd2-4bc3-a67c-73fdb8c189f4', 'DEAFCCEC-6A37-EF11-86D4-000D3A4E707E', 1, 1, 1, 1, GETUTCDATE(), GETUTCDATE());

/* SQL generated to add new permission for entity MoreCheese: Organization Profiles for role Integration */
INSERT INTO [${mjSchema}].[EntityPermission]
                                                   ([EntityID], [RoleID], [CanRead], [CanCreate], [CanUpdate], [CanDelete], [__mj_CreatedAt], [__mj_UpdatedAt]) VALUES
                                                   ('56a03017-ebd2-4bc3-a67c-73fdb8c189f4', 'DFAFCCEC-6A37-EF11-86D4-000D3A4E707E', 1, 1, 1, 1, GETUTCDATE(), GETUTCDATE());

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
         '84685bd4-a229-47c6-a759-71b5dfd410a0',
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
                                       ('3C46B3A5-34FB-51EA-B54D-77E9F104ABAF', '84685bd4-a229-47c6-a759-71b5dfd410a0', (SELECT COALESCE(MAX([Sequence]),0)+1 FROM [${mjSchema}].[ApplicationEntity] WHERE [ApplicationID] = '3C46B3A5-34FB-51EA-B54D-77E9F104ABAF'), GETUTCDATE(), GETUTCDATE());

/* SQL generated to add new permission for entity MoreCheese: Member Profiles for role UI */
INSERT INTO [${mjSchema}].[EntityPermission]
                                                   ([EntityID], [RoleID], [CanRead], [CanCreate], [CanUpdate], [CanDelete], [__mj_CreatedAt], [__mj_UpdatedAt]) VALUES
                                                   ('84685bd4-a229-47c6-a759-71b5dfd410a0', 'E0AFCCEC-6A37-EF11-86D4-000D3A4E707E', 1, 0, 0, 0, GETUTCDATE(), GETUTCDATE());

/* SQL generated to add new permission for entity MoreCheese: Member Profiles for role Developer */
INSERT INTO [${mjSchema}].[EntityPermission]
                                                   ([EntityID], [RoleID], [CanRead], [CanCreate], [CanUpdate], [CanDelete], [__mj_CreatedAt], [__mj_UpdatedAt]) VALUES
                                                   ('84685bd4-a229-47c6-a759-71b5dfd410a0', 'DEAFCCEC-6A37-EF11-86D4-000D3A4E707E', 1, 1, 1, 1, GETUTCDATE(), GETUTCDATE());

/* SQL generated to add new permission for entity MoreCheese: Member Profiles for role Integration */
INSERT INTO [${mjSchema}].[EntityPermission]
                                                   ([EntityID], [RoleID], [CanRead], [CanCreate], [CanUpdate], [CanDelete], [__mj_CreatedAt], [__mj_UpdatedAt]) VALUES
                                                   ('84685bd4-a229-47c6-a759-71b5dfd410a0', 'DFAFCCEC-6A37-EF11-86D4-000D3A4E707E', 1, 1, 1, 1, GETUTCDATE(), GETUTCDATE());

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
         'ed525220-b7cb-4bb7-ac3b-92ba3878a6d0',
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
                                       ('3C46B3A5-34FB-51EA-B54D-77E9F104ABAF', 'ed525220-b7cb-4bb7-ac3b-92ba3878a6d0', (SELECT COALESCE(MAX([Sequence]),0)+1 FROM [${mjSchema}].[ApplicationEntity] WHERE [ApplicationID] = '3C46B3A5-34FB-51EA-B54D-77E9F104ABAF'), GETUTCDATE(), GETUTCDATE());

/* SQL generated to add new permission for entity MoreCheese: Membership Periods for role UI */
INSERT INTO [${mjSchema}].[EntityPermission]
                                                   ([EntityID], [RoleID], [CanRead], [CanCreate], [CanUpdate], [CanDelete], [__mj_CreatedAt], [__mj_UpdatedAt]) VALUES
                                                   ('ed525220-b7cb-4bb7-ac3b-92ba3878a6d0', 'E0AFCCEC-6A37-EF11-86D4-000D3A4E707E', 1, 0, 0, 0, GETUTCDATE(), GETUTCDATE());

/* SQL generated to add new permission for entity MoreCheese: Membership Periods for role Developer */
INSERT INTO [${mjSchema}].[EntityPermission]
                                                   ([EntityID], [RoleID], [CanRead], [CanCreate], [CanUpdate], [CanDelete], [__mj_CreatedAt], [__mj_UpdatedAt]) VALUES
                                                   ('ed525220-b7cb-4bb7-ac3b-92ba3878a6d0', 'DEAFCCEC-6A37-EF11-86D4-000D3A4E707E', 1, 1, 1, 1, GETUTCDATE(), GETUTCDATE());

/* SQL generated to add new permission for entity MoreCheese: Membership Periods for role Integration */
INSERT INTO [${mjSchema}].[EntityPermission]
                                                   ([EntityID], [RoleID], [CanRead], [CanCreate], [CanUpdate], [CanDelete], [__mj_CreatedAt], [__mj_UpdatedAt]) VALUES
                                                   ('ed525220-b7cb-4bb7-ac3b-92ba3878a6d0', 'DFAFCCEC-6A37-EF11-86D4-000D3A4E707E', 1, 1, 1, 1, GETUTCDATE(), GETUTCDATE());

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
         '9a39a0a9-a476-4559-aec4-e826d7410e09',
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
                                       ('3C46B3A5-34FB-51EA-B54D-77E9F104ABAF', '9a39a0a9-a476-4559-aec4-e826d7410e09', (SELECT COALESCE(MAX([Sequence]),0)+1 FROM [${mjSchema}].[ApplicationEntity] WHERE [ApplicationID] = '3C46B3A5-34FB-51EA-B54D-77E9F104ABAF'), GETUTCDATE(), GETUTCDATE());

/* SQL generated to add new permission for entity MoreCheese: Events for role UI */
INSERT INTO [${mjSchema}].[EntityPermission]
                                                   ([EntityID], [RoleID], [CanRead], [CanCreate], [CanUpdate], [CanDelete], [__mj_CreatedAt], [__mj_UpdatedAt]) VALUES
                                                   ('9a39a0a9-a476-4559-aec4-e826d7410e09', 'E0AFCCEC-6A37-EF11-86D4-000D3A4E707E', 1, 0, 0, 0, GETUTCDATE(), GETUTCDATE());

/* SQL generated to add new permission for entity MoreCheese: Events for role Developer */
INSERT INTO [${mjSchema}].[EntityPermission]
                                                   ([EntityID], [RoleID], [CanRead], [CanCreate], [CanUpdate], [CanDelete], [__mj_CreatedAt], [__mj_UpdatedAt]) VALUES
                                                   ('9a39a0a9-a476-4559-aec4-e826d7410e09', 'DEAFCCEC-6A37-EF11-86D4-000D3A4E707E', 1, 1, 1, 1, GETUTCDATE(), GETUTCDATE());

/* SQL generated to add new permission for entity MoreCheese: Events for role Integration */
INSERT INTO [${mjSchema}].[EntityPermission]
                                                   ([EntityID], [RoleID], [CanRead], [CanCreate], [CanUpdate], [CanDelete], [__mj_CreatedAt], [__mj_UpdatedAt]) VALUES
                                                   ('9a39a0a9-a476-4559-aec4-e826d7410e09', 'DFAFCCEC-6A37-EF11-86D4-000D3A4E707E', 1, 1, 1, 1, GETUTCDATE(), GETUTCDATE());

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
         '37c1aadd-e111-4604-ad2c-264775b1a076',
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
                                       ('3C46B3A5-34FB-51EA-B54D-77E9F104ABAF', '37c1aadd-e111-4604-ad2c-264775b1a076', (SELECT COALESCE(MAX([Sequence]),0)+1 FROM [${mjSchema}].[ApplicationEntity] WHERE [ApplicationID] = '3C46B3A5-34FB-51EA-B54D-77E9F104ABAF'), GETUTCDATE(), GETUTCDATE());

/* SQL generated to add new permission for entity MoreCheese: Event Registrations for role UI */
INSERT INTO [${mjSchema}].[EntityPermission]
                                                   ([EntityID], [RoleID], [CanRead], [CanCreate], [CanUpdate], [CanDelete], [__mj_CreatedAt], [__mj_UpdatedAt]) VALUES
                                                   ('37c1aadd-e111-4604-ad2c-264775b1a076', 'E0AFCCEC-6A37-EF11-86D4-000D3A4E707E', 1, 0, 0, 0, GETUTCDATE(), GETUTCDATE());

/* SQL generated to add new permission for entity MoreCheese: Event Registrations for role Developer */
INSERT INTO [${mjSchema}].[EntityPermission]
                                                   ([EntityID], [RoleID], [CanRead], [CanCreate], [CanUpdate], [CanDelete], [__mj_CreatedAt], [__mj_UpdatedAt]) VALUES
                                                   ('37c1aadd-e111-4604-ad2c-264775b1a076', 'DEAFCCEC-6A37-EF11-86D4-000D3A4E707E', 1, 1, 1, 1, GETUTCDATE(), GETUTCDATE());

/* SQL generated to add new permission for entity MoreCheese: Event Registrations for role Integration */
INSERT INTO [${mjSchema}].[EntityPermission]
                                                   ([EntityID], [RoleID], [CanRead], [CanCreate], [CanUpdate], [CanDelete], [__mj_CreatedAt], [__mj_UpdatedAt]) VALUES
                                                   ('37c1aadd-e111-4604-ad2c-264775b1a076', 'DFAFCCEC-6A37-EF11-86D4-000D3A4E707E', 1, 1, 1, 1, GETUTCDATE(), GETUTCDATE());

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
         'b718d5bb-dc40-4fae-bc8f-bcb35247ed0e',
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
                                       ('3C46B3A5-34FB-51EA-B54D-77E9F104ABAF', 'b718d5bb-dc40-4fae-bc8f-bcb35247ed0e', (SELECT COALESCE(MAX([Sequence]),0)+1 FROM [${mjSchema}].[ApplicationEntity] WHERE [ApplicationID] = '3C46B3A5-34FB-51EA-B54D-77E9F104ABAF'), GETUTCDATE(), GETUTCDATE());

/* SQL generated to add new permission for entity MoreCheese: Courses for role UI */
INSERT INTO [${mjSchema}].[EntityPermission]
                                                   ([EntityID], [RoleID], [CanRead], [CanCreate], [CanUpdate], [CanDelete], [__mj_CreatedAt], [__mj_UpdatedAt]) VALUES
                                                   ('b718d5bb-dc40-4fae-bc8f-bcb35247ed0e', 'E0AFCCEC-6A37-EF11-86D4-000D3A4E707E', 1, 0, 0, 0, GETUTCDATE(), GETUTCDATE());

/* SQL generated to add new permission for entity MoreCheese: Courses for role Developer */
INSERT INTO [${mjSchema}].[EntityPermission]
                                                   ([EntityID], [RoleID], [CanRead], [CanCreate], [CanUpdate], [CanDelete], [__mj_CreatedAt], [__mj_UpdatedAt]) VALUES
                                                   ('b718d5bb-dc40-4fae-bc8f-bcb35247ed0e', 'DEAFCCEC-6A37-EF11-86D4-000D3A4E707E', 1, 1, 1, 1, GETUTCDATE(), GETUTCDATE());

/* SQL generated to add new permission for entity MoreCheese: Courses for role Integration */
INSERT INTO [${mjSchema}].[EntityPermission]
                                                   ([EntityID], [RoleID], [CanRead], [CanCreate], [CanUpdate], [CanDelete], [__mj_CreatedAt], [__mj_UpdatedAt]) VALUES
                                                   ('b718d5bb-dc40-4fae-bc8f-bcb35247ed0e', 'DFAFCCEC-6A37-EF11-86D4-000D3A4E707E', 1, 1, 1, 1, GETUTCDATE(), GETUTCDATE());

/* SQL text to update existing entities from schema */
EXEC [${mjSchema}].[spUpdateExistingEntitiesFromSchema] @ExcludedSchemaNames='sys,staging,dbo,${mjSchema},${mjSchema}_UDT,sample_app,AssociationDemo,Bookstore,${mjSchema}_BizAppsCommon,${mjSchema}_BizAppsForms,${mjSchema}_BizAppsTasks,${mjSchema}_BizAppsIssues,${mjSchema}_BizAppsCommittees,${mjSchema}';

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

/* SQL text to insert new entity field */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '1d858517-9150-41fb-84fd-95ae09805a47' OR (EntityID = '74A95CB4-0407-4A2A-A84E-18FAF120B0D6' AND Name = 'ID')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            '1d858517-9150-41fb-84fd-95ae09805a47',
            '74A95CB4-0407-4A2A-A84E-18FAF120B0D6', -- Entity: MoreCheese: Data Quality Labels
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

/* SQL text to insert new entity field */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = 'be2d931d-8c22-4d62-a7c7-c2d763c882a1' OR (EntityID = '74A95CB4-0407-4A2A-A84E-18FAF120B0D6' AND Name = 'LabelKey')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            'be2d931d-8c22-4d62-a7c7-c2d763c882a1',
            '74A95CB4-0407-4A2A-A84E-18FAF120B0D6', -- Entity: MoreCheese: Data Quality Labels
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

/* SQL text to insert new entity field */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '05581837-3c8f-46cf-81de-0be422635347' OR (EntityID = '74A95CB4-0407-4A2A-A84E-18FAF120B0D6' AND Name = 'DefectKind')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            '05581837-3c8f-46cf-81de-0be422635347',
            '74A95CB4-0407-4A2A-A84E-18FAF120B0D6', -- Entity: MoreCheese: Data Quality Labels
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

/* SQL text to insert new entity field */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '5e6e76d6-74b7-4321-aeb4-906f867fbb23' OR (EntityID = '74A95CB4-0407-4A2A-A84E-18FAF120B0D6' AND Name = 'PersonID')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            '5e6e76d6-74b7-4321-aeb4-906f867fbb23',
            '74A95CB4-0407-4A2A-A84E-18FAF120B0D6', -- Entity: MoreCheese: Data Quality Labels
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

/* SQL text to insert new entity field */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '06ac547c-db4b-44d1-8bb0-8fc26ae45e79' OR (EntityID = '74A95CB4-0407-4A2A-A84E-18FAF120B0D6' AND Name = 'RelatedPersonID')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            '06ac547c-db4b-44d1-8bb0-8fc26ae45e79',
            '74A95CB4-0407-4A2A-A84E-18FAF120B0D6', -- Entity: MoreCheese: Data Quality Labels
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

/* SQL text to insert new entity field */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = 'c57fe48e-e205-40e7-9970-bdaccee01103' OR (EntityID = '74A95CB4-0407-4A2A-A84E-18FAF120B0D6' AND Name = 'RelatedOrganizationID')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            'c57fe48e-e205-40e7-9970-bdaccee01103',
            '74A95CB4-0407-4A2A-A84E-18FAF120B0D6', -- Entity: MoreCheese: Data Quality Labels
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

/* SQL text to insert new entity field */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '5631c831-2643-4ffd-9e66-88cb0dd747bc' OR (EntityID = '74A95CB4-0407-4A2A-A84E-18FAF120B0D6' AND Name = 'DefectValue')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            '5631c831-2643-4ffd-9e66-88cb0dd747bc',
            '74A95CB4-0407-4A2A-A84E-18FAF120B0D6', -- Entity: MoreCheese: Data Quality Labels
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

/* SQL text to insert new entity field */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '06c012d5-044e-420f-88ec-d7bccf956817' OR (EntityID = '74A95CB4-0407-4A2A-A84E-18FAF120B0D6' AND Name = 'TruthValue')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            '06c012d5-044e-420f-88ec-d7bccf956817',
            '74A95CB4-0407-4A2A-A84E-18FAF120B0D6', -- Entity: MoreCheese: Data Quality Labels
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

/* SQL text to insert new entity field */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '18861d38-e686-4d99-a295-6754e383d127' OR (EntityID = '74A95CB4-0407-4A2A-A84E-18FAF120B0D6' AND Name = 'Notes')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            '18861d38-e686-4d99-a295-6754e383d127',
            '74A95CB4-0407-4A2A-A84E-18FAF120B0D6', -- Entity: MoreCheese: Data Quality Labels
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

/* SQL text to insert new entity field */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = 'e7fad989-372b-42b2-8e7b-97fd5923364d' OR (EntityID = '74A95CB4-0407-4A2A-A84E-18FAF120B0D6' AND Name = 'IsSharedDemo')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            'e7fad989-372b-42b2-8e7b-97fd5923364d',
            '74A95CB4-0407-4A2A-A84E-18FAF120B0D6', -- Entity: MoreCheese: Data Quality Labels
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

/* SQL text to insert new entity field */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '479ab847-d1c7-472b-b33c-5656cf630b61' OR (EntityID = '74A95CB4-0407-4A2A-A84E-18FAF120B0D6' AND Name = '__mj_CreatedAt')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            '479ab847-d1c7-472b-b33c-5656cf630b61',
            '74A95CB4-0407-4A2A-A84E-18FAF120B0D6', -- Entity: MoreCheese: Data Quality Labels
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

/* SQL text to insert new entity field */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '2d7dcdd5-2b83-4eaa-9176-f4ac99c7fbd1' OR (EntityID = '74A95CB4-0407-4A2A-A84E-18FAF120B0D6' AND Name = '__mj_UpdatedAt')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            '2d7dcdd5-2b83-4eaa-9176-f4ac99c7fbd1',
            '74A95CB4-0407-4A2A-A84E-18FAF120B0D6', -- Entity: MoreCheese: Data Quality Labels
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

/* SQL text to insert new entity field */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '9d438000-1c79-4d23-a2d5-8a562b8bc02b' OR (EntityID = '3C5ED337-C9BE-4ECC-9BA4-1BE2A797F0F2' AND Name = 'ID')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            '9d438000-1c79-4d23-a2d5-8a562b8bc02b',
            '3C5ED337-C9BE-4ECC-9BA4-1BE2A797F0F2', -- Entity: MoreCheese: Certifications
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

/* SQL text to insert new entity field */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = 'e220cd5f-349d-4bb8-b245-28f1be982e0a' OR (EntityID = '3C5ED337-C9BE-4ECC-9BA4-1BE2A797F0F2' AND Name = 'CertKey')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            'e220cd5f-349d-4bb8-b245-28f1be982e0a',
            '3C5ED337-C9BE-4ECC-9BA4-1BE2A797F0F2', -- Entity: MoreCheese: Certifications
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

/* SQL text to insert new entity field */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '56c55baf-25b5-4df5-a7b4-9783010e027c' OR (EntityID = '3C5ED337-C9BE-4ECC-9BA4-1BE2A797F0F2' AND Name = 'Name')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            '56c55baf-25b5-4df5-a7b4-9783010e027c',
            '3C5ED337-C9BE-4ECC-9BA4-1BE2A797F0F2', -- Entity: MoreCheese: Certifications
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

/* SQL text to insert new entity field */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = 'f18aa8e0-93d9-4d1c-9d18-ee0bb7a391d0' OR (EntityID = '3C5ED337-C9BE-4ECC-9BA4-1BE2A797F0F2' AND Name = 'Description')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            'f18aa8e0-93d9-4d1c-9d18-ee0bb7a391d0',
            '3C5ED337-C9BE-4ECC-9BA4-1BE2A797F0F2', -- Entity: MoreCheese: Certifications
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

/* SQL text to insert new entity field */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = 'd6771aa3-b307-4e4a-9d2d-31865f4e6bae' OR (EntityID = '3C5ED337-C9BE-4ECC-9BA4-1BE2A797F0F2' AND Name = 'ValidYears')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            'd6771aa3-b307-4e4a-9d2d-31865f4e6bae',
            '3C5ED337-C9BE-4ECC-9BA4-1BE2A797F0F2', -- Entity: MoreCheese: Certifications
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

/* SQL text to insert new entity field */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = 'cd95c59d-78d3-4930-abf3-890c7cac4cf6' OR (EntityID = '3C5ED337-C9BE-4ECC-9BA4-1BE2A797F0F2' AND Name = 'IsSharedDemo')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            'cd95c59d-78d3-4930-abf3-890c7cac4cf6',
            '3C5ED337-C9BE-4ECC-9BA4-1BE2A797F0F2', -- Entity: MoreCheese: Certifications
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

/* SQL text to insert new entity field */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '72a20590-03e6-4972-8fd2-1ba79ace3833' OR (EntityID = '3C5ED337-C9BE-4ECC-9BA4-1BE2A797F0F2' AND Name = '__mj_CreatedAt')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            '72a20590-03e6-4972-8fd2-1ba79ace3833',
            '3C5ED337-C9BE-4ECC-9BA4-1BE2A797F0F2', -- Entity: MoreCheese: Certifications
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

/* SQL text to insert new entity field */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = 'cf234be0-7662-404d-96fd-0490469a5404' OR (EntityID = '3C5ED337-C9BE-4ECC-9BA4-1BE2A797F0F2' AND Name = '__mj_UpdatedAt')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            'cf234be0-7662-404d-96fd-0490469a5404',
            '3C5ED337-C9BE-4ECC-9BA4-1BE2A797F0F2', -- Entity: MoreCheese: Certifications
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

/* SQL text to insert new entity field */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '6985e6df-7512-404b-8abd-55c116358af5' OR (EntityID = '37C1AADD-E111-4604-AD2C-264775B1A076' AND Name = 'ID')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            '6985e6df-7512-404b-8abd-55c116358af5',
            '37C1AADD-E111-4604-AD2C-264775B1A076', -- Entity: MoreCheese: Event Registrations
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

/* SQL text to insert new entity field */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '2cba3e0d-d9e6-47b1-9107-a3cfb9daaa7c' OR (EntityID = '37C1AADD-E111-4604-AD2C-264775B1A076' AND Name = 'RegKey')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            '2cba3e0d-d9e6-47b1-9107-a3cfb9daaa7c',
            '37C1AADD-E111-4604-AD2C-264775B1A076', -- Entity: MoreCheese: Event Registrations
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

/* SQL text to insert new entity field */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '929287e5-8fd9-4f55-bf50-1d0fa1949e05' OR (EntityID = '37C1AADD-E111-4604-AD2C-264775B1A076' AND Name = 'PersonID')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            '929287e5-8fd9-4f55-bf50-1d0fa1949e05',
            '37C1AADD-E111-4604-AD2C-264775B1A076', -- Entity: MoreCheese: Event Registrations
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

/* SQL text to insert new entity field */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = 'd9b2f92d-2f57-4883-afe3-f85fd01b84ee' OR (EntityID = '37C1AADD-E111-4604-AD2C-264775B1A076' AND Name = 'EventID')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            'd9b2f92d-2f57-4883-afe3-f85fd01b84ee',
            '37C1AADD-E111-4604-AD2C-264775B1A076', -- Entity: MoreCheese: Event Registrations
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
            '9A39A0A9-A476-4559-AEC4-E826D7410E09',
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

/* SQL text to insert new entity field */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '8f4de82f-983f-4904-9f08-b60f1e2c6cae' OR (EntityID = '37C1AADD-E111-4604-AD2C-264775B1A076' AND Name = 'RegisteredOn')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            '8f4de82f-983f-4904-9f08-b60f1e2c6cae',
            '37C1AADD-E111-4604-AD2C-264775B1A076', -- Entity: MoreCheese: Event Registrations
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

/* SQL text to insert new entity field */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '40c531c7-1e07-485b-8cf3-f323843f63bc' OR (EntityID = '37C1AADD-E111-4604-AD2C-264775B1A076' AND Name = 'Attended')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            '40c531c7-1e07-485b-8cf3-f323843f63bc',
            '37C1AADD-E111-4604-AD2C-264775B1A076', -- Entity: MoreCheese: Event Registrations
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

/* SQL text to insert new entity field */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '68a0b3f9-0d66-40c7-8bd3-f8d354093fb3' OR (EntityID = '37C1AADD-E111-4604-AD2C-264775B1A076' AND Name = 'IsSharedDemo')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            '68a0b3f9-0d66-40c7-8bd3-f8d354093fb3',
            '37C1AADD-E111-4604-AD2C-264775B1A076', -- Entity: MoreCheese: Event Registrations
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

/* SQL text to insert new entity field */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = 'e7232fcb-efc2-4267-aa20-c92ebf98cb44' OR (EntityID = '37C1AADD-E111-4604-AD2C-264775B1A076' AND Name = '__mj_CreatedAt')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            'e7232fcb-efc2-4267-aa20-c92ebf98cb44',
            '37C1AADD-E111-4604-AD2C-264775B1A076', -- Entity: MoreCheese: Event Registrations
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

/* SQL text to insert new entity field */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '382834d9-e515-4ea4-b2de-f9c630ad63f2' OR (EntityID = '37C1AADD-E111-4604-AD2C-264775B1A076' AND Name = '__mj_UpdatedAt')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            '382834d9-e515-4ea4-b2de-f9c630ad63f2',
            '37C1AADD-E111-4604-AD2C-264775B1A076', -- Entity: MoreCheese: Event Registrations
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

/* SQL text to insert new entity field */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '4d6f3f2b-7a4b-473c-b9d6-da0032f9a2d0' OR (EntityID = '594A4CE0-05A6-407A-92AF-4690B557BC6B' AND Name = 'ID')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            '4d6f3f2b-7a4b-473c-b9d6-da0032f9a2d0',
            '594A4CE0-05A6-407A-92AF-4690B557BC6B', -- Entity: MoreCheese: Order Lines
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

/* SQL text to insert new entity field */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = 'c04f824d-4401-4fcb-954f-c81805eb3e03' OR (EntityID = '594A4CE0-05A6-407A-92AF-4690B557BC6B' AND Name = 'OrderID')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            'c04f824d-4401-4fcb-954f-c81805eb3e03',
            '594A4CE0-05A6-407A-92AF-4690B557BC6B', -- Entity: MoreCheese: Order Lines
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
            'A186072D-0D8B-497E-8766-9B2F300A6055',
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

/* SQL text to insert new entity field */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '0cb6e4ea-182a-487c-9a68-c670386e48a4' OR (EntityID = '594A4CE0-05A6-407A-92AF-4690B557BC6B' AND Name = 'ProductID')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            '0cb6e4ea-182a-487c-9a68-c670386e48a4',
            '594A4CE0-05A6-407A-92AF-4690B557BC6B', -- Entity: MoreCheese: Order Lines
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
            'D2D94E6A-E5E0-4BAA-A50B-5479770D2F4E',
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

/* SQL text to insert new entity field */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '815865db-8f06-4207-a5cc-21c51e0a13ea' OR (EntityID = '594A4CE0-05A6-407A-92AF-4690B557BC6B' AND Name = 'Quantity')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            '815865db-8f06-4207-a5cc-21c51e0a13ea',
            '594A4CE0-05A6-407A-92AF-4690B557BC6B', -- Entity: MoreCheese: Order Lines
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

/* SQL text to insert new entity field */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '8d6045b3-6e85-49f0-9816-1fafe893d818' OR (EntityID = '594A4CE0-05A6-407A-92AF-4690B557BC6B' AND Name = 'UnitPrice')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            '8d6045b3-6e85-49f0-9816-1fafe893d818',
            '594A4CE0-05A6-407A-92AF-4690B557BC6B', -- Entity: MoreCheese: Order Lines
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

/* SQL text to insert new entity field */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '7d8fc7e4-4d4a-4fce-bd6c-9371d91e1f4a' OR (EntityID = '594A4CE0-05A6-407A-92AF-4690B557BC6B' AND Name = 'LineTotal')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            '7d8fc7e4-4d4a-4fce-bd6c-9371d91e1f4a',
            '594A4CE0-05A6-407A-92AF-4690B557BC6B', -- Entity: MoreCheese: Order Lines
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

/* SQL text to insert new entity field */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '64eefa9c-5307-4765-b0e2-c7579f5ec1ba' OR (EntityID = '594A4CE0-05A6-407A-92AF-4690B557BC6B' AND Name = 'IsSharedDemo')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            '64eefa9c-5307-4765-b0e2-c7579f5ec1ba',
            '594A4CE0-05A6-407A-92AF-4690B557BC6B', -- Entity: MoreCheese: Order Lines
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

/* SQL text to insert new entity field */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '6fe84206-d812-40fd-ac9a-699da823cda0' OR (EntityID = '594A4CE0-05A6-407A-92AF-4690B557BC6B' AND Name = '__mj_CreatedAt')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            '6fe84206-d812-40fd-ac9a-699da823cda0',
            '594A4CE0-05A6-407A-92AF-4690B557BC6B', -- Entity: MoreCheese: Order Lines
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

/* SQL text to insert new entity field */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '86fd61b1-bd89-4079-849e-055e3b1d325f' OR (EntityID = '594A4CE0-05A6-407A-92AF-4690B557BC6B' AND Name = '__mj_UpdatedAt')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            '86fd61b1-bd89-4079-849e-055e3b1d325f',
            '594A4CE0-05A6-407A-92AF-4690B557BC6B', -- Entity: MoreCheese: Order Lines
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

/* SQL text to insert new entity field */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = 'ba69ceab-ae2e-4234-9a9b-f740d2d99444' OR (EntityID = '8D7A9A85-352E-4BE4-A663-4F930ED61A42' AND Name = 'ID')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            'ba69ceab-ae2e-4234-9a9b-f740d2d99444',
            '8D7A9A85-352E-4BE4-A663-4F930ED61A42', -- Entity: MoreCheese: Payments
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

/* SQL text to insert new entity field */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = 'e126035e-62dd-4e2d-8905-9dd1be370f8a' OR (EntityID = '8D7A9A85-352E-4BE4-A663-4F930ED61A42' AND Name = 'OrderID')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            'e126035e-62dd-4e2d-8905-9dd1be370f8a',
            '8D7A9A85-352E-4BE4-A663-4F930ED61A42', -- Entity: MoreCheese: Payments
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
            'A186072D-0D8B-497E-8766-9B2F300A6055',
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

/* SQL text to insert new entity field */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = 'f2806588-90d9-4428-9d9c-dd9436f74df9' OR (EntityID = '8D7A9A85-352E-4BE4-A663-4F930ED61A42' AND Name = 'Amount')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            'f2806588-90d9-4428-9d9c-dd9436f74df9',
            '8D7A9A85-352E-4BE4-A663-4F930ED61A42', -- Entity: MoreCheese: Payments
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

/* SQL text to insert new entity field */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '8b744f9e-9f22-4e2a-95fa-cbdf7506aac7' OR (EntityID = '8D7A9A85-352E-4BE4-A663-4F930ED61A42' AND Name = 'PaymentDate')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            '8b744f9e-9f22-4e2a-95fa-cbdf7506aac7',
            '8D7A9A85-352E-4BE4-A663-4F930ED61A42', -- Entity: MoreCheese: Payments
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

/* SQL text to insert new entity field */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '1297da82-e7a0-4b03-9bd0-bd08fbb642e0' OR (EntityID = '8D7A9A85-352E-4BE4-A663-4F930ED61A42' AND Name = 'Method')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            '1297da82-e7a0-4b03-9bd0-bd08fbb642e0',
            '8D7A9A85-352E-4BE4-A663-4F930ED61A42', -- Entity: MoreCheese: Payments
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

/* SQL text to insert new entity field */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = 'e81fa7ef-be3b-4f98-8b76-e8738d436805' OR (EntityID = '8D7A9A85-352E-4BE4-A663-4F930ED61A42' AND Name = 'Status')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            'e81fa7ef-be3b-4f98-8b76-e8738d436805',
            '8D7A9A85-352E-4BE4-A663-4F930ED61A42', -- Entity: MoreCheese: Payments
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

/* SQL text to insert new entity field */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '13711cbb-a7b0-47af-815f-e6a215afceaf' OR (EntityID = '8D7A9A85-352E-4BE4-A663-4F930ED61A42' AND Name = 'IsSharedDemo')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            '13711cbb-a7b0-47af-815f-e6a215afceaf',
            '8D7A9A85-352E-4BE4-A663-4F930ED61A42', -- Entity: MoreCheese: Payments
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

/* SQL text to insert new entity field */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '86ec9ecb-f85a-4f00-900b-44c93d7f9570' OR (EntityID = '8D7A9A85-352E-4BE4-A663-4F930ED61A42' AND Name = '__mj_CreatedAt')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            '86ec9ecb-f85a-4f00-900b-44c93d7f9570',
            '8D7A9A85-352E-4BE4-A663-4F930ED61A42', -- Entity: MoreCheese: Payments
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

/* SQL text to insert new entity field */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '094039f7-5ec0-4cb6-a8d3-99426d81f932' OR (EntityID = '8D7A9A85-352E-4BE4-A663-4F930ED61A42' AND Name = '__mj_UpdatedAt')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            '094039f7-5ec0-4cb6-a8d3-99426d81f932',
            '8D7A9A85-352E-4BE4-A663-4F930ED61A42', -- Entity: MoreCheese: Payments
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

/* SQL text to insert new entity field */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '30e1b939-68c2-4d6e-b28f-9426b5f4b46c' OR (EntityID = 'D2D94E6A-E5E0-4BAA-A50B-5479770D2F4E' AND Name = 'ID')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            '30e1b939-68c2-4d6e-b28f-9426b5f4b46c',
            'D2D94E6A-E5E0-4BAA-A50B-5479770D2F4E', -- Entity: MoreCheese: Products
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

/* SQL text to insert new entity field */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = 'd2a17a18-e9af-46d2-bf91-4e3ae4dc64f6' OR (EntityID = 'D2D94E6A-E5E0-4BAA-A50B-5479770D2F4E' AND Name = 'ProductKey')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            'd2a17a18-e9af-46d2-bf91-4e3ae4dc64f6',
            'D2D94E6A-E5E0-4BAA-A50B-5479770D2F4E', -- Entity: MoreCheese: Products
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

/* SQL text to insert new entity field */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '3cb3733a-55e5-4b37-a097-066b50ed6642' OR (EntityID = 'D2D94E6A-E5E0-4BAA-A50B-5479770D2F4E' AND Name = 'Name')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            '3cb3733a-55e5-4b37-a097-066b50ed6642',
            'D2D94E6A-E5E0-4BAA-A50B-5479770D2F4E', -- Entity: MoreCheese: Products
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

/* SQL text to insert new entity field */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = 'c84bd915-d049-4997-84fd-8773be459c01' OR (EntityID = 'D2D94E6A-E5E0-4BAA-A50B-5479770D2F4E' AND Name = 'ProductType')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            'c84bd915-d049-4997-84fd-8773be459c01',
            'D2D94E6A-E5E0-4BAA-A50B-5479770D2F4E', -- Entity: MoreCheese: Products
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

/* SQL text to insert new entity field */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '50f9b211-3d11-4296-9e7b-1f907b3733d0' OR (EntityID = 'D2D94E6A-E5E0-4BAA-A50B-5479770D2F4E' AND Name = 'UnitPrice')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            '50f9b211-3d11-4296-9e7b-1f907b3733d0',
            'D2D94E6A-E5E0-4BAA-A50B-5479770D2F4E', -- Entity: MoreCheese: Products
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

/* SQL text to insert new entity field */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '2173165d-c15a-4a93-8305-6d62892313ad' OR (EntityID = 'D2D94E6A-E5E0-4BAA-A50B-5479770D2F4E' AND Name = 'IsSharedDemo')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            '2173165d-c15a-4a93-8305-6d62892313ad',
            'D2D94E6A-E5E0-4BAA-A50B-5479770D2F4E', -- Entity: MoreCheese: Products
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

/* SQL text to insert new entity field */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = 'c7aa2557-ef29-41cd-bf8d-4cec0cc02e4d' OR (EntityID = 'D2D94E6A-E5E0-4BAA-A50B-5479770D2F4E' AND Name = '__mj_CreatedAt')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            'c7aa2557-ef29-41cd-bf8d-4cec0cc02e4d',
            'D2D94E6A-E5E0-4BAA-A50B-5479770D2F4E', -- Entity: MoreCheese: Products
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

/* SQL text to insert new entity field */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = 'b7573c57-2f40-4a20-98fb-fdaaa5d3cc3f' OR (EntityID = 'D2D94E6A-E5E0-4BAA-A50B-5479770D2F4E' AND Name = '__mj_UpdatedAt')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            'b7573c57-2f40-4a20-98fb-fdaaa5d3cc3f',
            'D2D94E6A-E5E0-4BAA-A50B-5479770D2F4E', -- Entity: MoreCheese: Products
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

/* SQL text to insert new entity field */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '3c59d600-2ef1-4be7-b816-f50b42e84a06' OR (EntityID = '84685BD4-A229-47C6-A759-71B5DFD410A0' AND Name = 'ID')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            '3c59d600-2ef1-4be7-b816-f50b42e84a06',
            '84685BD4-A229-47C6-A759-71B5DFD410A0', -- Entity: MoreCheese: Member Profiles
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

/* SQL text to insert new entity field */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '8fa08408-0e8f-4444-b9b2-da66e970ea2c' OR (EntityID = '84685BD4-A229-47C6-A759-71B5DFD410A0' AND Name = 'PersonID')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            '8fa08408-0e8f-4444-b9b2-da66e970ea2c',
            '84685BD4-A229-47C6-A759-71B5DFD410A0', -- Entity: MoreCheese: Member Profiles
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

/* SQL text to insert new entity field */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = 'a7ebb025-4c35-4554-9155-6fdcb8830bdb' OR (EntityID = '84685BD4-A229-47C6-A759-71B5DFD410A0' AND Name = 'OrganizationID')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            'a7ebb025-4c35-4554-9155-6fdcb8830bdb',
            '84685BD4-A229-47C6-A759-71B5DFD410A0', -- Entity: MoreCheese: Member Profiles
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

/* SQL text to insert new entity field */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '527af5d2-cc8c-4d74-82d7-5fcce8e536c4' OR (EntityID = '84685BD4-A229-47C6-A759-71B5DFD410A0' AND Name = 'MemberNumber')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            '527af5d2-cc8c-4d74-82d7-5fcce8e536c4',
            '84685BD4-A229-47C6-A759-71B5DFD410A0', -- Entity: MoreCheese: Member Profiles
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

/* SQL text to insert new entity field */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = 'd68db94a-73fd-42ca-8a09-d6eb01fb56eb' OR (EntityID = '84685BD4-A229-47C6-A759-71B5DFD410A0' AND Name = 'Segment')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            'd68db94a-73fd-42ca-8a09-d6eb01fb56eb',
            '84685BD4-A229-47C6-A759-71B5DFD410A0', -- Entity: MoreCheese: Member Profiles
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

/* SQL text to insert new entity field */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = 'b9b51678-e3de-4f2b-addc-36aabc71e0f8' OR (EntityID = '84685BD4-A229-47C6-A759-71B5DFD410A0' AND Name = 'Region')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            'b9b51678-e3de-4f2b-addc-36aabc71e0f8',
            '84685BD4-A229-47C6-A759-71B5DFD410A0', -- Entity: MoreCheese: Member Profiles
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

/* SQL text to insert new entity field */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '42268ad9-721c-4cc6-8b90-f6bc86cc79b6' OR (EntityID = '84685BD4-A229-47C6-A759-71B5DFD410A0' AND Name = 'City')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            '42268ad9-721c-4cc6-8b90-f6bc86cc79b6',
            '84685BD4-A229-47C6-A759-71B5DFD410A0', -- Entity: MoreCheese: Member Profiles
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

/* SQL text to insert new entity field */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = 'c2fdb5be-8637-42a1-b684-bf2234bcdf3a' OR (EntityID = '84685BD4-A229-47C6-A759-71B5DFD410A0' AND Name = 'State')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            'c2fdb5be-8637-42a1-b684-bf2234bcdf3a',
            '84685BD4-A229-47C6-A759-71B5DFD410A0', -- Entity: MoreCheese: Member Profiles
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

/* SQL text to insert new entity field */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '04f9a388-3cb9-4108-a7b5-e64faa147815' OR (EntityID = '84685BD4-A229-47C6-A759-71B5DFD410A0' AND Name = 'Latitude')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            '04f9a388-3cb9-4108-a7b5-e64faa147815',
            '84685BD4-A229-47C6-A759-71B5DFD410A0', -- Entity: MoreCheese: Member Profiles
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

/* SQL text to insert new entity field */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '312f3582-f70b-4dad-be9c-ea79fdad807e' OR (EntityID = '84685BD4-A229-47C6-A759-71B5DFD410A0' AND Name = 'Longitude')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            '312f3582-f70b-4dad-be9c-ea79fdad807e',
            '84685BD4-A229-47C6-A759-71B5DFD410A0', -- Entity: MoreCheese: Member Profiles
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

/* SQL text to insert new entity field */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '65c48323-0972-4427-9a3b-44ecb7fc0b0c' OR (EntityID = '84685BD4-A229-47C6-A759-71B5DFD410A0' AND Name = 'JoinDate')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            '65c48323-0972-4427-9a3b-44ecb7fc0b0c',
            '84685BD4-A229-47C6-A759-71B5DFD410A0', -- Entity: MoreCheese: Member Profiles
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

/* SQL text to insert new entity field */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = 'd01752eb-4bbd-489c-9888-ee605824d982' OR (EntityID = '84685BD4-A229-47C6-A759-71B5DFD410A0' AND Name = 'IsSharedDemo')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            'd01752eb-4bbd-489c-9888-ee605824d982',
            '84685BD4-A229-47C6-A759-71B5DFD410A0', -- Entity: MoreCheese: Member Profiles
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

/* SQL text to insert new entity field */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '76802cd8-9826-42fc-93a5-0045cfba3c83' OR (EntityID = '84685BD4-A229-47C6-A759-71B5DFD410A0' AND Name = '__mj_CreatedAt')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            '76802cd8-9826-42fc-93a5-0045cfba3c83',
            '84685BD4-A229-47C6-A759-71B5DFD410A0', -- Entity: MoreCheese: Member Profiles
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

/* SQL text to insert new entity field */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '2f166864-44ea-4640-90de-eada53e4f111' OR (EntityID = '84685BD4-A229-47C6-A759-71B5DFD410A0' AND Name = '__mj_UpdatedAt')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            '2f166864-44ea-4640-90de-eada53e4f111',
            '84685BD4-A229-47C6-A759-71B5DFD410A0', -- Entity: MoreCheese: Member Profiles
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

/* SQL text to insert new entity field */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '390bfcaf-1373-4e2b-86b9-b77989015418' OR (EntityID = '56A03017-EBD2-4BC3-A67C-73FDB8C189F4' AND Name = 'ID')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            '390bfcaf-1373-4e2b-86b9-b77989015418',
            '56A03017-EBD2-4BC3-A67C-73FDB8C189F4', -- Entity: MoreCheese: Organization Profiles
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

/* SQL text to insert new entity field */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '49a30d42-326f-400c-ad58-dd0ed3cb698f' OR (EntityID = '56A03017-EBD2-4BC3-A67C-73FDB8C189F4' AND Name = 'OrganizationID')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            '49a30d42-326f-400c-ad58-dd0ed3cb698f',
            '56A03017-EBD2-4BC3-A67C-73FDB8C189F4', -- Entity: MoreCheese: Organization Profiles
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

/* SQL text to insert new entity field */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '37e68dbc-7602-4443-9a47-3f50500f3bd8' OR (EntityID = '56A03017-EBD2-4BC3-A67C-73FDB8C189F4' AND Name = 'OrgKey')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            '37e68dbc-7602-4443-9a47-3f50500f3bd8',
            '56A03017-EBD2-4BC3-A67C-73FDB8C189F4', -- Entity: MoreCheese: Organization Profiles
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

/* SQL text to insert new entity field */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '40e22e3d-6286-40aa-bc47-a86bc126a43f' OR (EntityID = '56A03017-EBD2-4BC3-A67C-73FDB8C189F4' AND Name = 'Type')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            '40e22e3d-6286-40aa-bc47-a86bc126a43f',
            '56A03017-EBD2-4BC3-A67C-73FDB8C189F4', -- Entity: MoreCheese: Organization Profiles
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

/* SQL text to insert new entity field */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = 'e255c844-f9db-44db-aae4-33dfc9c3d515' OR (EntityID = '56A03017-EBD2-4BC3-A67C-73FDB8C189F4' AND Name = 'Region')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            'e255c844-f9db-44db-aae4-33dfc9c3d515',
            '56A03017-EBD2-4BC3-A67C-73FDB8C189F4', -- Entity: MoreCheese: Organization Profiles
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

/* SQL text to insert new entity field */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '91709cbc-65c6-4955-ba9d-f641213f9217' OR (EntityID = '56A03017-EBD2-4BC3-A67C-73FDB8C189F4' AND Name = 'City')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            '91709cbc-65c6-4955-ba9d-f641213f9217',
            '56A03017-EBD2-4BC3-A67C-73FDB8C189F4', -- Entity: MoreCheese: Organization Profiles
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

/* SQL text to insert new entity field */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '6dc9a7a3-d78d-41d6-b62f-90738032505e' OR (EntityID = '56A03017-EBD2-4BC3-A67C-73FDB8C189F4' AND Name = 'State')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            '6dc9a7a3-d78d-41d6-b62f-90738032505e',
            '56A03017-EBD2-4BC3-A67C-73FDB8C189F4', -- Entity: MoreCheese: Organization Profiles
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

/* SQL text to insert new entity field */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '3ecd64e5-bb1c-4e1a-b287-bf544ed3fb27' OR (EntityID = '56A03017-EBD2-4BC3-A67C-73FDB8C189F4' AND Name = 'Latitude')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            '3ecd64e5-bb1c-4e1a-b287-bf544ed3fb27',
            '56A03017-EBD2-4BC3-A67C-73FDB8C189F4', -- Entity: MoreCheese: Organization Profiles
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

/* SQL text to insert new entity field */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '74fc1f5a-2c8c-408f-8daa-f842c46fa978' OR (EntityID = '56A03017-EBD2-4BC3-A67C-73FDB8C189F4' AND Name = 'Longitude')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            '74fc1f5a-2c8c-408f-8daa-f842c46fa978',
            '56A03017-EBD2-4BC3-A67C-73FDB8C189F4', -- Entity: MoreCheese: Organization Profiles
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

/* SQL text to insert new entity field */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '51eb5edd-5ff5-4c69-9204-b6edda4715ee' OR (EntityID = '56A03017-EBD2-4BC3-A67C-73FDB8C189F4' AND Name = 'LifecycleEventKind')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            '51eb5edd-5ff5-4c69-9204-b6edda4715ee',
            '56A03017-EBD2-4BC3-A67C-73FDB8C189F4', -- Entity: MoreCheese: Organization Profiles
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

/* SQL text to insert new entity field */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '1848c7ed-62da-4487-a35d-a83355cf4e00' OR (EntityID = '56A03017-EBD2-4BC3-A67C-73FDB8C189F4' AND Name = 'LifecycleEventYear')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            '1848c7ed-62da-4487-a35d-a83355cf4e00',
            '56A03017-EBD2-4BC3-A67C-73FDB8C189F4', -- Entity: MoreCheese: Organization Profiles
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

/* SQL text to insert new entity field */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = 'ee3934e0-9a47-4c37-abc8-303cd5fa6997' OR (EntityID = '56A03017-EBD2-4BC3-A67C-73FDB8C189F4' AND Name = 'IsSharedDemo')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            'ee3934e0-9a47-4c37-abc8-303cd5fa6997',
            '56A03017-EBD2-4BC3-A67C-73FDB8C189F4', -- Entity: MoreCheese: Organization Profiles
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

/* SQL text to insert new entity field */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = 'fe42cc0e-b5e2-4be5-b01d-907316288b0a' OR (EntityID = '56A03017-EBD2-4BC3-A67C-73FDB8C189F4' AND Name = '__mj_CreatedAt')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            'fe42cc0e-b5e2-4be5-b01d-907316288b0a',
            '56A03017-EBD2-4BC3-A67C-73FDB8C189F4', -- Entity: MoreCheese: Organization Profiles
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

/* SQL text to insert new entity field */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '40cf16d7-af4a-415d-b2af-4034bce1037a' OR (EntityID = '56A03017-EBD2-4BC3-A67C-73FDB8C189F4' AND Name = '__mj_UpdatedAt')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            '40cf16d7-af4a-415d-b2af-4034bce1037a',
            '56A03017-EBD2-4BC3-A67C-73FDB8C189F4', -- Entity: MoreCheese: Organization Profiles
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

/* SQL text to insert new entity field */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = 'd4e217c0-c53f-41d3-8e86-31117e785ab0' OR (EntityID = 'FE8BF319-06BC-4E03-A22A-7864DB37579F' AND Name = 'ID')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            'd4e217c0-c53f-41d3-8e86-31117e785ab0',
            'FE8BF319-06BC-4E03-A22A-7864DB37579F', -- Entity: MoreCheese: Course Enrollments
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

/* SQL text to insert new entity field */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = 'cdd369fa-2d85-469a-a4fd-656e73984cae' OR (EntityID = 'FE8BF319-06BC-4E03-A22A-7864DB37579F' AND Name = 'EnrollKey')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            'cdd369fa-2d85-469a-a4fd-656e73984cae',
            'FE8BF319-06BC-4E03-A22A-7864DB37579F', -- Entity: MoreCheese: Course Enrollments
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

/* SQL text to insert new entity field */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '6c5a8fa5-1db2-4bea-8bab-114b664f9a1d' OR (EntityID = 'FE8BF319-06BC-4E03-A22A-7864DB37579F' AND Name = 'PersonID')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            '6c5a8fa5-1db2-4bea-8bab-114b664f9a1d',
            'FE8BF319-06BC-4E03-A22A-7864DB37579F', -- Entity: MoreCheese: Course Enrollments
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

/* SQL text to insert new entity field */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '0b668435-2e50-4afa-abeb-f0a2ac7ffd79' OR (EntityID = 'FE8BF319-06BC-4E03-A22A-7864DB37579F' AND Name = 'CourseID')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            '0b668435-2e50-4afa-abeb-f0a2ac7ffd79',
            'FE8BF319-06BC-4E03-A22A-7864DB37579F', -- Entity: MoreCheese: Course Enrollments
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
            'B718D5BB-DC40-4FAE-BC8F-BCB35247ED0E',
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

/* SQL text to insert new entity field */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '3136742f-afb1-4c4a-89da-a89df1ff35d4' OR (EntityID = 'FE8BF319-06BC-4E03-A22A-7864DB37579F' AND Name = 'EnrolledOn')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            '3136742f-afb1-4c4a-89da-a89df1ff35d4',
            'FE8BF319-06BC-4E03-A22A-7864DB37579F', -- Entity: MoreCheese: Course Enrollments
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

/* SQL text to insert new entity field */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '9010ff76-e62e-4cd4-ad5f-90ea7b836963' OR (EntityID = 'FE8BF319-06BC-4E03-A22A-7864DB37579F' AND Name = 'Status')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            '9010ff76-e62e-4cd4-ad5f-90ea7b836963',
            'FE8BF319-06BC-4E03-A22A-7864DB37579F', -- Entity: MoreCheese: Course Enrollments
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

/* SQL text to insert new entity field */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '20040950-2181-4f98-b2c0-a73fcdbf1376' OR (EntityID = 'FE8BF319-06BC-4E03-A22A-7864DB37579F' AND Name = 'CompletedOn')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            '20040950-2181-4f98-b2c0-a73fcdbf1376',
            'FE8BF319-06BC-4E03-A22A-7864DB37579F', -- Entity: MoreCheese: Course Enrollments
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

/* SQL text to insert new entity field */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '6733a025-ef8b-46fd-99ac-2b9fcd8875ad' OR (EntityID = 'FE8BF319-06BC-4E03-A22A-7864DB37579F' AND Name = 'IsSharedDemo')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            '6733a025-ef8b-46fd-99ac-2b9fcd8875ad',
            'FE8BF319-06BC-4E03-A22A-7864DB37579F', -- Entity: MoreCheese: Course Enrollments
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

/* SQL text to insert new entity field */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = 'b2db920f-0f6c-4387-9726-38e54bfc012e' OR (EntityID = 'FE8BF319-06BC-4E03-A22A-7864DB37579F' AND Name = '__mj_CreatedAt')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            'b2db920f-0f6c-4387-9726-38e54bfc012e',
            'FE8BF319-06BC-4E03-A22A-7864DB37579F', -- Entity: MoreCheese: Course Enrollments
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

/* SQL text to insert new entity field */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '644e18c1-3e7f-4daa-9132-444237e12612' OR (EntityID = 'FE8BF319-06BC-4E03-A22A-7864DB37579F' AND Name = '__mj_UpdatedAt')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            '644e18c1-3e7f-4daa-9132-444237e12612',
            'FE8BF319-06BC-4E03-A22A-7864DB37579F', -- Entity: MoreCheese: Course Enrollments
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

/* SQL text to insert new entity field */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '2fa8750d-8dce-48e5-8d2c-b71cd7bdbb8f' OR (EntityID = 'ED525220-B7CB-4BB7-AC3B-92BA3878A6D0' AND Name = 'ID')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            '2fa8750d-8dce-48e5-8d2c-b71cd7bdbb8f',
            'ED525220-B7CB-4BB7-AC3B-92BA3878A6D0', -- Entity: MoreCheese: Membership Periods
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

/* SQL text to insert new entity field */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '5f21b356-1b7c-43a4-94a1-d526adc9b99d' OR (EntityID = 'ED525220-B7CB-4BB7-AC3B-92BA3878A6D0' AND Name = 'PeriodKey')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            '5f21b356-1b7c-43a4-94a1-d526adc9b99d',
            'ED525220-B7CB-4BB7-AC3B-92BA3878A6D0', -- Entity: MoreCheese: Membership Periods
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

/* SQL text to insert new entity field */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = 'b9124ecf-85e9-4da9-9e56-85e2e858482e' OR (EntityID = 'ED525220-B7CB-4BB7-AC3B-92BA3878A6D0' AND Name = 'PersonID')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            'b9124ecf-85e9-4da9-9e56-85e2e858482e',
            'ED525220-B7CB-4BB7-AC3B-92BA3878A6D0', -- Entity: MoreCheese: Membership Periods
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

/* SQL text to insert new entity field */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '71632094-f78d-42ee-846e-a1f9423e2357' OR (EntityID = 'ED525220-B7CB-4BB7-AC3B-92BA3878A6D0' AND Name = 'MembershipTier')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            '71632094-f78d-42ee-846e-a1f9423e2357',
            'ED525220-B7CB-4BB7-AC3B-92BA3878A6D0', -- Entity: MoreCheese: Membership Periods
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

/* SQL text to insert new entity field */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = 'f5d702bc-0281-4078-bfa4-9580bb7baa2d' OR (EntityID = 'ED525220-B7CB-4BB7-AC3B-92BA3878A6D0' AND Name = 'DuesAmount')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            'f5d702bc-0281-4078-bfa4-9580bb7baa2d',
            'ED525220-B7CB-4BB7-AC3B-92BA3878A6D0', -- Entity: MoreCheese: Membership Periods
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

/* SQL text to insert new entity field */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '7d6874bf-5883-46f9-98db-6c9a7eff8b91' OR (EntityID = 'ED525220-B7CB-4BB7-AC3B-92BA3878A6D0' AND Name = 'StartDate')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            '7d6874bf-5883-46f9-98db-6c9a7eff8b91',
            'ED525220-B7CB-4BB7-AC3B-92BA3878A6D0', -- Entity: MoreCheese: Membership Periods
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

/* SQL text to insert new entity field */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '5a227f12-ca59-4329-abb6-7f75c082a8a9' OR (EntityID = 'ED525220-B7CB-4BB7-AC3B-92BA3878A6D0' AND Name = 'EndDate')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            '5a227f12-ca59-4329-abb6-7f75c082a8a9',
            'ED525220-B7CB-4BB7-AC3B-92BA3878A6D0', -- Entity: MoreCheese: Membership Periods
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

/* SQL text to insert new entity field */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = 'ee70ba21-39e5-491f-913d-517ac9b8fa78' OR (EntityID = 'ED525220-B7CB-4BB7-AC3B-92BA3878A6D0' AND Name = 'RenewalDate')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            'ee70ba21-39e5-491f-913d-517ac9b8fa78',
            'ED525220-B7CB-4BB7-AC3B-92BA3878A6D0', -- Entity: MoreCheese: Membership Periods
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

/* SQL text to insert new entity field */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '3e2b5ea7-98f4-436b-9ed8-7acc434757b0' OR (EntityID = 'ED525220-B7CB-4BB7-AC3B-92BA3878A6D0' AND Name = 'Status')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            '3e2b5ea7-98f4-436b-9ed8-7acc434757b0',
            'ED525220-B7CB-4BB7-AC3B-92BA3878A6D0', -- Entity: MoreCheese: Membership Periods
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

/* SQL text to insert new entity field */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '5e34bff1-afcd-4189-b0b4-a5e9083ac8a3' OR (EntityID = 'ED525220-B7CB-4BB7-AC3B-92BA3878A6D0' AND Name = 'CancellationDate')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            '5e34bff1-afcd-4189-b0b4-a5e9083ac8a3',
            'ED525220-B7CB-4BB7-AC3B-92BA3878A6D0', -- Entity: MoreCheese: Membership Periods
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

/* SQL text to insert new entity field */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '99c8a014-e662-48bb-8541-96d709f0a479' OR (EntityID = 'ED525220-B7CB-4BB7-AC3B-92BA3878A6D0' AND Name = 'CancellationReason')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            '99c8a014-e662-48bb-8541-96d709f0a479',
            'ED525220-B7CB-4BB7-AC3B-92BA3878A6D0', -- Entity: MoreCheese: Membership Periods
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

/* SQL text to insert new entity field */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '3d9c9944-1b00-421e-99d3-c75ada866010' OR (EntityID = 'ED525220-B7CB-4BB7-AC3B-92BA3878A6D0' AND Name = 'AutoRenew')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            '3d9c9944-1b00-421e-99d3-c75ada866010',
            'ED525220-B7CB-4BB7-AC3B-92BA3878A6D0', -- Entity: MoreCheese: Membership Periods
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

/* SQL text to insert new entity field */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = 'fa4c3267-60aa-46f8-9106-0cec082d4d34' OR (EntityID = 'ED525220-B7CB-4BB7-AC3B-92BA3878A6D0' AND Name = 'IsSharedDemo')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            'fa4c3267-60aa-46f8-9106-0cec082d4d34',
            'ED525220-B7CB-4BB7-AC3B-92BA3878A6D0', -- Entity: MoreCheese: Membership Periods
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

/* SQL text to insert new entity field */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = 'e4b1e67b-cc1b-45b9-95ee-36b8cffc07c3' OR (EntityID = 'ED525220-B7CB-4BB7-AC3B-92BA3878A6D0' AND Name = '__mj_CreatedAt')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            'e4b1e67b-cc1b-45b9-95ee-36b8cffc07c3',
            'ED525220-B7CB-4BB7-AC3B-92BA3878A6D0', -- Entity: MoreCheese: Membership Periods
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

/* SQL text to insert new entity field */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '4cebf8e0-9796-4918-a1ae-364040e1ab3e' OR (EntityID = 'ED525220-B7CB-4BB7-AC3B-92BA3878A6D0' AND Name = '__mj_UpdatedAt')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            '4cebf8e0-9796-4918-a1ae-364040e1ab3e',
            'ED525220-B7CB-4BB7-AC3B-92BA3878A6D0', -- Entity: MoreCheese: Membership Periods
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

/* SQL text to insert new entity field */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = 'b510a336-e52e-4388-ae33-76da48448422' OR (EntityID = 'A186072D-0D8B-497E-8766-9B2F300A6055' AND Name = 'ID')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            'b510a336-e52e-4388-ae33-76da48448422',
            'A186072D-0D8B-497E-8766-9B2F300A6055', -- Entity: MoreCheese: Orders
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

/* SQL text to insert new entity field */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = 'e699a9c1-9fa1-4be0-b571-8773250846c5' OR (EntityID = 'A186072D-0D8B-497E-8766-9B2F300A6055' AND Name = 'OrderKey')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            'e699a9c1-9fa1-4be0-b571-8773250846c5',
            'A186072D-0D8B-497E-8766-9B2F300A6055', -- Entity: MoreCheese: Orders
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

/* SQL text to insert new entity field */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = 'fae8ccee-f3cf-4e31-b8fd-14b871d95510' OR (EntityID = 'A186072D-0D8B-497E-8766-9B2F300A6055' AND Name = 'PersonID')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            'fae8ccee-f3cf-4e31-b8fd-14b871d95510',
            'A186072D-0D8B-497E-8766-9B2F300A6055', -- Entity: MoreCheese: Orders
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

/* SQL text to insert new entity field */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = 'e7d025e9-9755-42ec-8194-256f18b83370' OR (EntityID = 'A186072D-0D8B-497E-8766-9B2F300A6055' AND Name = 'OrderType')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            'e7d025e9-9755-42ec-8194-256f18b83370',
            'A186072D-0D8B-497E-8766-9B2F300A6055', -- Entity: MoreCheese: Orders
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

/* SQL text to insert new entity field */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '0bf5284d-307b-4617-8807-f2a1656170dc' OR (EntityID = 'A186072D-0D8B-497E-8766-9B2F300A6055' AND Name = 'Status')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            '0bf5284d-307b-4617-8807-f2a1656170dc',
            'A186072D-0D8B-497E-8766-9B2F300A6055', -- Entity: MoreCheese: Orders
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

/* SQL text to insert new entity field */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '84c326c7-7f74-4aec-9c4b-62f4e9a89c76' OR (EntityID = 'A186072D-0D8B-497E-8766-9B2F300A6055' AND Name = 'OrderDate')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            '84c326c7-7f74-4aec-9c4b-62f4e9a89c76',
            'A186072D-0D8B-497E-8766-9B2F300A6055', -- Entity: MoreCheese: Orders
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

/* SQL text to insert new entity field */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = 'cc475705-5d74-4e83-9ab4-b6bea30dc2ca' OR (EntityID = 'A186072D-0D8B-497E-8766-9B2F300A6055' AND Name = 'DueDate')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            'cc475705-5d74-4e83-9ab4-b6bea30dc2ca',
            'A186072D-0D8B-497E-8766-9B2F300A6055', -- Entity: MoreCheese: Orders
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

/* SQL text to insert new entity field */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '1bb17121-f507-4aec-88ea-31bf92ebec4f' OR (EntityID = 'A186072D-0D8B-497E-8766-9B2F300A6055' AND Name = 'TotalGross')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            '1bb17121-f507-4aec-88ea-31bf92ebec4f',
            'A186072D-0D8B-497E-8766-9B2F300A6055', -- Entity: MoreCheese: Orders
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

/* SQL text to insert new entity field */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '0f314803-129a-4f1c-9b08-a61f96fc66ff' OR (EntityID = 'A186072D-0D8B-497E-8766-9B2F300A6055' AND Name = 'PaymentStatus')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            '0f314803-129a-4f1c-9b08-a61f96fc66ff',
            'A186072D-0D8B-497E-8766-9B2F300A6055', -- Entity: MoreCheese: Orders
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

/* SQL text to insert new entity field */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '5730a024-6ae1-4d5c-be8b-fe7952db2e24' OR (EntityID = 'A186072D-0D8B-497E-8766-9B2F300A6055' AND Name = 'IsSharedDemo')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            '5730a024-6ae1-4d5c-be8b-fe7952db2e24',
            'A186072D-0D8B-497E-8766-9B2F300A6055', -- Entity: MoreCheese: Orders
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

/* SQL text to insert new entity field */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '896da3e8-89ec-4d5d-ab23-45c74d83d69a' OR (EntityID = 'A186072D-0D8B-497E-8766-9B2F300A6055' AND Name = '__mj_CreatedAt')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            '896da3e8-89ec-4d5d-ab23-45c74d83d69a',
            'A186072D-0D8B-497E-8766-9B2F300A6055', -- Entity: MoreCheese: Orders
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

/* SQL text to insert new entity field */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = 'e10c4dc3-0329-4875-9efa-02e0c1985668' OR (EntityID = 'A186072D-0D8B-497E-8766-9B2F300A6055' AND Name = '__mj_UpdatedAt')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            'e10c4dc3-0329-4875-9efa-02e0c1985668',
            'A186072D-0D8B-497E-8766-9B2F300A6055', -- Entity: MoreCheese: Orders
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

/* SQL text to insert new entity field */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '67b3c2fd-be96-42d8-9e81-a3b3de52a486' OR (EntityID = 'F4D4BA79-C264-45C6-9A51-A00571ABCD6B' AND Name = 'ID')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            '67b3c2fd-be96-42d8-9e81-a3b3de52a486',
            'F4D4BA79-C264-45C6-9A51-A00571ABCD6B', -- Entity: MoreCheese: Member Certifications
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

/* SQL text to insert new entity field */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '27d6f14e-5122-42c1-850a-f467f7e8aad3' OR (EntityID = 'F4D4BA79-C264-45C6-9A51-A00571ABCD6B' AND Name = 'MemberCertKey')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            '27d6f14e-5122-42c1-850a-f467f7e8aad3',
            'F4D4BA79-C264-45C6-9A51-A00571ABCD6B', -- Entity: MoreCheese: Member Certifications
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

/* SQL text to insert new entity field */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '2d09d8ac-8716-4297-a8d2-98121967c0d5' OR (EntityID = 'F4D4BA79-C264-45C6-9A51-A00571ABCD6B' AND Name = 'PersonID')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            '2d09d8ac-8716-4297-a8d2-98121967c0d5',
            'F4D4BA79-C264-45C6-9A51-A00571ABCD6B', -- Entity: MoreCheese: Member Certifications
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

/* SQL text to insert new entity field */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '5f333d7c-1043-4ee4-a0cf-d117d0801fc0' OR (EntityID = 'F4D4BA79-C264-45C6-9A51-A00571ABCD6B' AND Name = 'CertificationID')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            '5f333d7c-1043-4ee4-a0cf-d117d0801fc0',
            'F4D4BA79-C264-45C6-9A51-A00571ABCD6B', -- Entity: MoreCheese: Member Certifications
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
            '3C5ED337-C9BE-4ECC-9BA4-1BE2A797F0F2',
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

/* SQL text to insert new entity field */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '746f56fe-9f06-4b2c-8c03-048ff31a5529' OR (EntityID = 'F4D4BA79-C264-45C6-9A51-A00571ABCD6B' AND Name = 'Status')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            '746f56fe-9f06-4b2c-8c03-048ff31a5529',
            'F4D4BA79-C264-45C6-9A51-A00571ABCD6B', -- Entity: MoreCheese: Member Certifications
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

/* SQL text to insert new entity field */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '6d76b6f1-69f0-427a-bcae-ccf55c032dbf' OR (EntityID = 'F4D4BA79-C264-45C6-9A51-A00571ABCD6B' AND Name = 'EnrolledOn')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            '6d76b6f1-69f0-427a-bcae-ccf55c032dbf',
            'F4D4BA79-C264-45C6-9A51-A00571ABCD6B', -- Entity: MoreCheese: Member Certifications
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

/* SQL text to insert new entity field */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '71109b1f-4053-40e3-b976-c58d06b12174' OR (EntityID = 'F4D4BA79-C264-45C6-9A51-A00571ABCD6B' AND Name = 'AwardedOn')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            '71109b1f-4053-40e3-b976-c58d06b12174',
            'F4D4BA79-C264-45C6-9A51-A00571ABCD6B', -- Entity: MoreCheese: Member Certifications
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

/* SQL text to insert new entity field */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '1f357709-99a9-4b2d-bfe1-9a009b3ac6dc' OR (EntityID = 'F4D4BA79-C264-45C6-9A51-A00571ABCD6B' AND Name = 'ExpiresOn')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            '1f357709-99a9-4b2d-bfe1-9a009b3ac6dc',
            'F4D4BA79-C264-45C6-9A51-A00571ABCD6B', -- Entity: MoreCheese: Member Certifications
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

/* SQL text to insert new entity field */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '3e59c2a0-cd82-473d-899d-14076c897de1' OR (EntityID = 'F4D4BA79-C264-45C6-9A51-A00571ABCD6B' AND Name = 'IsSharedDemo')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            '3e59c2a0-cd82-473d-899d-14076c897de1',
            'F4D4BA79-C264-45C6-9A51-A00571ABCD6B', -- Entity: MoreCheese: Member Certifications
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

/* SQL text to insert new entity field */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '170e7f6d-dc2c-465e-8251-e891ba83f753' OR (EntityID = 'F4D4BA79-C264-45C6-9A51-A00571ABCD6B' AND Name = '__mj_CreatedAt')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            '170e7f6d-dc2c-465e-8251-e891ba83f753',
            'F4D4BA79-C264-45C6-9A51-A00571ABCD6B', -- Entity: MoreCheese: Member Certifications
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

/* SQL text to insert new entity field */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '43a37942-3d85-4102-9bbc-0590f1b2e02f' OR (EntityID = 'F4D4BA79-C264-45C6-9A51-A00571ABCD6B' AND Name = '__mj_UpdatedAt')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            '43a37942-3d85-4102-9bbc-0590f1b2e02f',
            'F4D4BA79-C264-45C6-9A51-A00571ABCD6B', -- Entity: MoreCheese: Member Certifications
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

/* SQL text to insert new entity field */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '8302fbc6-e7f1-4f99-aa74-10163ead0854' OR (EntityID = 'B718D5BB-DC40-4FAE-BC8F-BCB35247ED0E' AND Name = 'ID')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            '8302fbc6-e7f1-4f99-aa74-10163ead0854',
            'B718D5BB-DC40-4FAE-BC8F-BCB35247ED0E', -- Entity: MoreCheese: Courses
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

/* SQL text to insert new entity field */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = 'a5f45b6b-d8f3-4b63-af42-a9cf0a6bd11e' OR (EntityID = 'B718D5BB-DC40-4FAE-BC8F-BCB35247ED0E' AND Name = 'CourseKey')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            'a5f45b6b-d8f3-4b63-af42-a9cf0a6bd11e',
            'B718D5BB-DC40-4FAE-BC8F-BCB35247ED0E', -- Entity: MoreCheese: Courses
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

/* SQL text to insert new entity field */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '9fe3fdc7-edd3-4be3-98a7-bb5499cf1a70' OR (EntityID = 'B718D5BB-DC40-4FAE-BC8F-BCB35247ED0E' AND Name = 'Name')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            '9fe3fdc7-edd3-4be3-98a7-bb5499cf1a70',
            'B718D5BB-DC40-4FAE-BC8F-BCB35247ED0E', -- Entity: MoreCheese: Courses
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

/* SQL text to insert new entity field */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = 'f49210a3-50d0-46d0-a29d-7a0900983c06' OR (EntityID = 'B718D5BB-DC40-4FAE-BC8F-BCB35247ED0E' AND Name = 'StartDate')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            'f49210a3-50d0-46d0-a29d-7a0900983c06',
            'B718D5BB-DC40-4FAE-BC8F-BCB35247ED0E', -- Entity: MoreCheese: Courses
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

/* SQL text to insert new entity field */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = 'c6d4915a-82ef-4201-b315-1182272f62f1' OR (EntityID = 'B718D5BB-DC40-4FAE-BC8F-BCB35247ED0E' AND Name = 'DurationWeeks')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            'c6d4915a-82ef-4201-b315-1182272f62f1',
            'B718D5BB-DC40-4FAE-BC8F-BCB35247ED0E', -- Entity: MoreCheese: Courses
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

/* SQL text to insert new entity field */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '330b3396-6d98-475b-8646-5bc3f7e14988' OR (EntityID = 'B718D5BB-DC40-4FAE-BC8F-BCB35247ED0E' AND Name = 'IsSharedDemo')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            '330b3396-6d98-475b-8646-5bc3f7e14988',
            'B718D5BB-DC40-4FAE-BC8F-BCB35247ED0E', -- Entity: MoreCheese: Courses
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

/* SQL text to insert new entity field */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '1fee32a1-f226-4967-9bf8-1ace93469a43' OR (EntityID = 'B718D5BB-DC40-4FAE-BC8F-BCB35247ED0E' AND Name = '__mj_CreatedAt')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            '1fee32a1-f226-4967-9bf8-1ace93469a43',
            'B718D5BB-DC40-4FAE-BC8F-BCB35247ED0E', -- Entity: MoreCheese: Courses
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

/* SQL text to insert new entity field */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = 'deb5e0f6-312b-486c-bf26-d79b16024010' OR (EntityID = 'B718D5BB-DC40-4FAE-BC8F-BCB35247ED0E' AND Name = '__mj_UpdatedAt')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            'deb5e0f6-312b-486c-bf26-d79b16024010',
            'B718D5BB-DC40-4FAE-BC8F-BCB35247ED0E', -- Entity: MoreCheese: Courses
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

/* SQL text to insert new entity field */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '6a9fd32c-f1db-4c6d-a36c-0ce1e957bcdc' OR (EntityID = '1928BDF7-D4EE-4C1B-B36D-CC3B9A4782AC' AND Name = 'ID')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            '6a9fd32c-f1db-4c6d-a36c-0ce1e957bcdc',
            '1928BDF7-D4EE-4C1B-B36D-CC3B9A4782AC', -- Entity: MoreCheese: Competition Entries
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

/* SQL text to insert new entity field */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '8b8ca00b-1942-4961-88a3-8f83ab46a35c' OR (EntityID = '1928BDF7-D4EE-4C1B-B36D-CC3B9A4782AC' AND Name = 'EntryKey')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            '8b8ca00b-1942-4961-88a3-8f83ab46a35c',
            '1928BDF7-D4EE-4C1B-B36D-CC3B9A4782AC', -- Entity: MoreCheese: Competition Entries
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

/* SQL text to insert new entity field */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '82ebaa0a-2ab6-4b56-9fe9-8199177bf852' OR (EntityID = '1928BDF7-D4EE-4C1B-B36D-CC3B9A4782AC' AND Name = 'PersonID')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            '82ebaa0a-2ab6-4b56-9fe9-8199177bf852',
            '1928BDF7-D4EE-4C1B-B36D-CC3B9A4782AC', -- Entity: MoreCheese: Competition Entries
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

/* SQL text to insert new entity field */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = 'ca5d9b5d-c36b-492c-aeb1-7f3e8bf72b84' OR (EntityID = '1928BDF7-D4EE-4C1B-B36D-CC3B9A4782AC' AND Name = 'OrganizationID')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            'ca5d9b5d-c36b-492c-aeb1-7f3e8bf72b84',
            '1928BDF7-D4EE-4C1B-B36D-CC3B9A4782AC', -- Entity: MoreCheese: Competition Entries
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

/* SQL text to insert new entity field */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '1c0d025f-f1fe-4001-8f79-f0cc4e4b2c22' OR (EntityID = '1928BDF7-D4EE-4C1B-B36D-CC3B9A4782AC' AND Name = 'EntryYear')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            '1c0d025f-f1fe-4001-8f79-f0cc4e4b2c22',
            '1928BDF7-D4EE-4C1B-B36D-CC3B9A4782AC', -- Entity: MoreCheese: Competition Entries
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

/* SQL text to insert new entity field */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = 'a17fa08c-1978-478a-9416-d24f18a520ce' OR (EntityID = '1928BDF7-D4EE-4C1B-B36D-CC3B9A4782AC' AND Name = 'Category')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            'a17fa08c-1978-478a-9416-d24f18a520ce',
            '1928BDF7-D4EE-4C1B-B36D-CC3B9A4782AC', -- Entity: MoreCheese: Competition Entries
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

/* SQL text to insert new entity field */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '986cc97c-3865-4150-908e-00fe4476ac71' OR (EntityID = '1928BDF7-D4EE-4C1B-B36D-CC3B9A4782AC' AND Name = 'ProductName')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            '986cc97c-3865-4150-908e-00fe4476ac71',
            '1928BDF7-D4EE-4C1B-B36D-CC3B9A4782AC', -- Entity: MoreCheese: Competition Entries
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

/* SQL text to insert new entity field */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '5f12e8ac-e151-42a5-9162-55f0740deb93' OR (EntityID = '1928BDF7-D4EE-4C1B-B36D-CC3B9A4782AC' AND Name = 'Result')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            '5f12e8ac-e151-42a5-9162-55f0740deb93',
            '1928BDF7-D4EE-4C1B-B36D-CC3B9A4782AC', -- Entity: MoreCheese: Competition Entries
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

/* SQL text to insert new entity field */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = 'd4e5acee-eb61-491c-8112-2df180e8f1f1' OR (EntityID = '1928BDF7-D4EE-4C1B-B36D-CC3B9A4782AC' AND Name = 'IsSharedDemo')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            'd4e5acee-eb61-491c-8112-2df180e8f1f1',
            '1928BDF7-D4EE-4C1B-B36D-CC3B9A4782AC', -- Entity: MoreCheese: Competition Entries
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

/* SQL text to insert new entity field */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = 'ffb0f938-2a8e-418f-85d8-337c43e6be7b' OR (EntityID = '1928BDF7-D4EE-4C1B-B36D-CC3B9A4782AC' AND Name = '__mj_CreatedAt')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            'ffb0f938-2a8e-418f-85d8-337c43e6be7b',
            '1928BDF7-D4EE-4C1B-B36D-CC3B9A4782AC', -- Entity: MoreCheese: Competition Entries
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

/* SQL text to insert new entity field */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = 'cdfe72f9-51ba-4b8e-8aa6-8b22d02fa724' OR (EntityID = '1928BDF7-D4EE-4C1B-B36D-CC3B9A4782AC' AND Name = '__mj_UpdatedAt')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            'cdfe72f9-51ba-4b8e-8aa6-8b22d02fa724',
            '1928BDF7-D4EE-4C1B-B36D-CC3B9A4782AC', -- Entity: MoreCheese: Competition Entries
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

/* SQL text to insert new entity field */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '09d10800-846d-4f1d-89a5-d9ca6822b73f' OR (EntityID = '9A39A0A9-A476-4559-AEC4-E826D7410E09' AND Name = 'ID')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            '09d10800-846d-4f1d-89a5-d9ca6822b73f',
            '9A39A0A9-A476-4559-AEC4-E826D7410E09', -- Entity: MoreCheese: Events
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

/* SQL text to insert new entity field */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = 'c1779c7b-c27e-499e-b157-1901311ef8d1' OR (EntityID = '9A39A0A9-A476-4559-AEC4-E826D7410E09' AND Name = 'EventKey')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            'c1779c7b-c27e-499e-b157-1901311ef8d1',
            '9A39A0A9-A476-4559-AEC4-E826D7410E09', -- Entity: MoreCheese: Events
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

/* SQL text to insert new entity field */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '7e6482f0-e1d8-41be-a45b-183d6a2f2ebb' OR (EntityID = '9A39A0A9-A476-4559-AEC4-E826D7410E09' AND Name = 'Name')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            '7e6482f0-e1d8-41be-a45b-183d6a2f2ebb',
            '9A39A0A9-A476-4559-AEC4-E826D7410E09', -- Entity: MoreCheese: Events
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

/* SQL text to insert new entity field */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = 'dfff15de-7516-4dbd-8302-4b593c2026f6' OR (EntityID = '9A39A0A9-A476-4559-AEC4-E826D7410E09' AND Name = 'EventType')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            'dfff15de-7516-4dbd-8302-4b593c2026f6',
            '9A39A0A9-A476-4559-AEC4-E826D7410E09', -- Entity: MoreCheese: Events
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

/* SQL text to insert new entity field */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '32c4e2c8-b59f-41fd-94a6-8b07c18809ed' OR (EntityID = '9A39A0A9-A476-4559-AEC4-E826D7410E09' AND Name = 'EventDate')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            '32c4e2c8-b59f-41fd-94a6-8b07c18809ed',
            '9A39A0A9-A476-4559-AEC4-E826D7410E09', -- Entity: MoreCheese: Events
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

/* SQL text to insert new entity field */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = 'e4734667-f37d-45b4-8be3-e8d30ff3b358' OR (EntityID = '9A39A0A9-A476-4559-AEC4-E826D7410E09' AND Name = 'IsVirtual')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            'e4734667-f37d-45b4-8be3-e8d30ff3b358',
            '9A39A0A9-A476-4559-AEC4-E826D7410E09', -- Entity: MoreCheese: Events
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

/* SQL text to insert new entity field */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = 'a5da5951-c5f1-4901-96ee-945568ff9501' OR (EntityID = '9A39A0A9-A476-4559-AEC4-E826D7410E09' AND Name = 'IsPaid')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            'a5da5951-c5f1-4901-96ee-945568ff9501',
            '9A39A0A9-A476-4559-AEC4-E826D7410E09', -- Entity: MoreCheese: Events
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

/* SQL text to insert new entity field */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = 'ee9dbb13-9e97-4ba3-b4df-713c3a343f18' OR (EntityID = '9A39A0A9-A476-4559-AEC4-E826D7410E09' AND Name = 'City')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            'ee9dbb13-9e97-4ba3-b4df-713c3a343f18',
            '9A39A0A9-A476-4559-AEC4-E826D7410E09', -- Entity: MoreCheese: Events
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

/* SQL text to insert new entity field */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '3ad8da32-deb3-4233-95df-b2fc94be0f0a' OR (EntityID = '9A39A0A9-A476-4559-AEC4-E826D7410E09' AND Name = 'State')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            '3ad8da32-deb3-4233-95df-b2fc94be0f0a',
            '9A39A0A9-A476-4559-AEC4-E826D7410E09', -- Entity: MoreCheese: Events
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

/* SQL text to insert new entity field */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '7a7a01a9-597e-43ba-9e1b-ef75fc0f9a65' OR (EntityID = '9A39A0A9-A476-4559-AEC4-E826D7410E09' AND Name = 'Latitude')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            '7a7a01a9-597e-43ba-9e1b-ef75fc0f9a65',
            '9A39A0A9-A476-4559-AEC4-E826D7410E09', -- Entity: MoreCheese: Events
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

/* SQL text to insert new entity field */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = 'eae44ad7-3a66-4a55-822f-59829ebd41ac' OR (EntityID = '9A39A0A9-A476-4559-AEC4-E826D7410E09' AND Name = 'Longitude')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            'eae44ad7-3a66-4a55-822f-59829ebd41ac',
            '9A39A0A9-A476-4559-AEC4-E826D7410E09', -- Entity: MoreCheese: Events
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

/* SQL text to insert new entity field */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = 'a2dd1604-a242-4fd8-a867-19efebd93c5f' OR (EntityID = '9A39A0A9-A476-4559-AEC4-E826D7410E09' AND Name = 'IsSharedDemo')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            'a2dd1604-a242-4fd8-a867-19efebd93c5f',
            '9A39A0A9-A476-4559-AEC4-E826D7410E09', -- Entity: MoreCheese: Events
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

/* SQL text to insert new entity field */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '94dd967e-1248-462a-86d3-e6dd1511b4d8' OR (EntityID = '9A39A0A9-A476-4559-AEC4-E826D7410E09' AND Name = '__mj_CreatedAt')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            '94dd967e-1248-462a-86d3-e6dd1511b4d8',
            '9A39A0A9-A476-4559-AEC4-E826D7410E09', -- Entity: MoreCheese: Events
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

/* SQL text to insert new entity field */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '6d6f6a37-8711-47cf-b514-213aa85614bb' OR (EntityID = '9A39A0A9-A476-4559-AEC4-E826D7410E09' AND Name = '__mj_UpdatedAt')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            '6d6f6a37-8711-47cf-b514-213aa85614bb',
            '9A39A0A9-A476-4559-AEC4-E826D7410E09', -- Entity: MoreCheese: Events
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

/* SQL text to insert new entity field */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '32e9fa78-8c5b-46ac-89b4-c7cebdfcaa8d' OR (EntityID = '318E1216-842B-4EF7-8AD5-FCC4FC83E16E' AND Name = 'ID')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            '32e9fa78-8c5b-46ac-89b4-c7cebdfcaa8d',
            '318E1216-842B-4EF7-8AD5-FCC4FC83E16E', -- Entity: MoreCheese: Advocacy Actions
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

/* SQL text to insert new entity field */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = 'a1134a62-0a54-452c-bbf2-078d21538721' OR (EntityID = '318E1216-842B-4EF7-8AD5-FCC4FC83E16E' AND Name = 'ActionKey')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            'a1134a62-0a54-452c-bbf2-078d21538721',
            '318E1216-842B-4EF7-8AD5-FCC4FC83E16E', -- Entity: MoreCheese: Advocacy Actions
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

/* SQL text to insert new entity field */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '1716f162-210c-4723-b520-25ec8dc4551d' OR (EntityID = '318E1216-842B-4EF7-8AD5-FCC4FC83E16E' AND Name = 'PersonID')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            '1716f162-210c-4723-b520-25ec8dc4551d',
            '318E1216-842B-4EF7-8AD5-FCC4FC83E16E', -- Entity: MoreCheese: Advocacy Actions
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

/* SQL text to insert new entity field */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '794880ee-2ef5-42b6-8a74-1e32a4556cfe' OR (EntityID = '318E1216-842B-4EF7-8AD5-FCC4FC83E16E' AND Name = 'ActionDate')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            '794880ee-2ef5-42b6-8a74-1e32a4556cfe',
            '318E1216-842B-4EF7-8AD5-FCC4FC83E16E', -- Entity: MoreCheese: Advocacy Actions
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

/* SQL text to insert new entity field */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '25fab85a-522f-4fc8-8aad-ff5210e064eb' OR (EntityID = '318E1216-842B-4EF7-8AD5-FCC4FC83E16E' AND Name = 'Kind')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            '25fab85a-522f-4fc8-8aad-ff5210e064eb',
            '318E1216-842B-4EF7-8AD5-FCC4FC83E16E', -- Entity: MoreCheese: Advocacy Actions
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

/* SQL text to insert new entity field */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '770f4327-37b2-4c10-9292-b0ebfeaa9f81' OR (EntityID = '318E1216-842B-4EF7-8AD5-FCC4FC83E16E' AND Name = 'Topic')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            '770f4327-37b2-4c10-9292-b0ebfeaa9f81',
            '318E1216-842B-4EF7-8AD5-FCC4FC83E16E', -- Entity: MoreCheese: Advocacy Actions
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

/* SQL text to insert new entity field */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '87ca818b-452b-4b4f-a92c-0695f3c3a7c4' OR (EntityID = '318E1216-842B-4EF7-8AD5-FCC4FC83E16E' AND Name = 'IsSharedDemo')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            '87ca818b-452b-4b4f-a92c-0695f3c3a7c4',
            '318E1216-842B-4EF7-8AD5-FCC4FC83E16E', -- Entity: MoreCheese: Advocacy Actions
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

/* SQL text to insert new entity field */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '77d1ba51-2b49-444a-b335-83bb5d906cc2' OR (EntityID = '318E1216-842B-4EF7-8AD5-FCC4FC83E16E' AND Name = '__mj_CreatedAt')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            '77d1ba51-2b49-444a-b335-83bb5d906cc2',
            '318E1216-842B-4EF7-8AD5-FCC4FC83E16E', -- Entity: MoreCheese: Advocacy Actions
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

/* SQL text to insert new entity field */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '6c6efdb2-89c2-42ff-9e9c-56e8bb0a2d85' OR (EntityID = '318E1216-842B-4EF7-8AD5-FCC4FC83E16E' AND Name = '__mj_UpdatedAt')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            '6c6efdb2-89c2-42ff-9e9c-56e8bb0a2d85',
            '318E1216-842B-4EF7-8AD5-FCC4FC83E16E', -- Entity: MoreCheese: Advocacy Actions
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
EXEC [${mjSchema}].[spUpdateExistingEntityFieldsFromSchema] @ExcludedSchemaNames='sys,staging,dbo,${mjSchema},${mjSchema}_UDT,sample_app,AssociationDemo,Bookstore,${mjSchema}_BizAppsCommon,${mjSchema}_BizAppsForms,${mjSchema}_BizAppsTasks,${mjSchema}_BizAppsIssues,${mjSchema}_BizAppsCommittees,${mjSchema}';

/* SQL text to set default column width where needed */
EXEC [${mjSchema}].[spSetDefaultColumnWidthWhereNeeded] @ExcludedSchemaNames='sys,staging,dbo,${mjSchema},${mjSchema}_UDT,sample_app,AssociationDemo,Bookstore,${mjSchema}_BizAppsCommon,${mjSchema}_BizAppsForms,${mjSchema}_BizAppsTasks,${mjSchema}_BizAppsIssues,${mjSchema}_BizAppsCommittees,${mjSchema}';

/* SQL text to insert entity field value with ID 860a5e5e-e395-4733-b883-f4361ce4d424 */
INSERT INTO [${mjSchema}].[EntityFieldValue]
                                       ([ID], [EntityFieldID], [Sequence], [Value], [Code], [__mj_CreatedAt], [__mj_UpdatedAt])
                                    VALUES
                                       ('860a5e5e-e395-4733-b883-f4361ce4d424', '9010FF76-E62E-4CD4-AD5F-90EA7B836963', 1, 'Completed', 'Completed', GETUTCDATE(), GETUTCDATE());

/* SQL text to insert entity field value with ID fd3a2347-734c-486e-aed5-2adf16a90eb5 */
INSERT INTO [${mjSchema}].[EntityFieldValue]
                                       ([ID], [EntityFieldID], [Sequence], [Value], [Code], [__mj_CreatedAt], [__mj_UpdatedAt])
                                    VALUES
                                       ('fd3a2347-734c-486e-aed5-2adf16a90eb5', '9010FF76-E62E-4CD4-AD5F-90EA7B836963', 2, 'Dropped', 'Dropped', GETUTCDATE(), GETUTCDATE());

/* SQL text to insert entity field value with ID 3d2b21af-fb2a-4ad6-b8cd-7d8b40b75941 */
INSERT INTO [${mjSchema}].[EntityFieldValue]
                                       ([ID], [EntityFieldID], [Sequence], [Value], [Code], [__mj_CreatedAt], [__mj_UpdatedAt])
                                    VALUES
                                       ('3d2b21af-fb2a-4ad6-b8cd-7d8b40b75941', '9010FF76-E62E-4CD4-AD5F-90EA7B836963', 3, 'InProgress', 'InProgress', GETUTCDATE(), GETUTCDATE());

/* SQL text to update ValueListType for entity field ID 9010FF76-E62E-4CD4-AD5F-90EA7B836963 */
UPDATE [${mjSchema}].[EntityField] SET ValueListType='List' WHERE ID='9010FF76-E62E-4CD4-AD5F-90EA7B836963';

/* SQL text to insert entity field value with ID 3b0cbf8d-e200-43c1-9a57-e461097d9761 */
INSERT INTO [${mjSchema}].[EntityFieldValue]
                                       ([ID], [EntityFieldID], [Sequence], [Value], [Code], [__mj_CreatedAt], [__mj_UpdatedAt])
                                    VALUES
                                       ('3b0cbf8d-e200-43c1-9a57-e461097d9761', 'C84BD915-D049-4997-84FD-8773BE459C01', 1, 'Event', 'Event', GETUTCDATE(), GETUTCDATE());

/* SQL text to insert entity field value with ID 3050aacf-0965-46a7-a77a-45a05b8683dd */
INSERT INTO [${mjSchema}].[EntityFieldValue]
                                       ([ID], [EntityFieldID], [Sequence], [Value], [Code], [__mj_CreatedAt], [__mj_UpdatedAt])
                                    VALUES
                                       ('3050aacf-0965-46a7-a77a-45a05b8683dd', 'C84BD915-D049-4997-84FD-8773BE459C01', 2, 'Membership', 'Membership', GETUTCDATE(), GETUTCDATE());

/* SQL text to update ValueListType for entity field ID C84BD915-D049-4997-84FD-8773BE459C01 */
UPDATE [${mjSchema}].[EntityField] SET ValueListType='List' WHERE ID='C84BD915-D049-4997-84FD-8773BE459C01';

/* SQL text to insert entity field value with ID 61820443-5cf3-46c7-9440-81b39831d55d */
INSERT INTO [${mjSchema}].[EntityFieldValue]
                                       ([ID], [EntityFieldID], [Sequence], [Value], [Code], [__mj_CreatedAt], [__mj_UpdatedAt])
                                    VALUES
                                       ('61820443-5cf3-46c7-9440-81b39831d55d', '0F314803-129A-4F1C-9B08-A61F96FC66FF', 1, 'Overdue', 'Overdue', GETUTCDATE(), GETUTCDATE());

/* SQL text to insert entity field value with ID fa7773fa-868f-4275-8f2b-7ee4c2b6e6bf */
INSERT INTO [${mjSchema}].[EntityFieldValue]
                                       ([ID], [EntityFieldID], [Sequence], [Value], [Code], [__mj_CreatedAt], [__mj_UpdatedAt])
                                    VALUES
                                       ('fa7773fa-868f-4275-8f2b-7ee4c2b6e6bf', '0F314803-129A-4F1C-9B08-A61F96FC66FF', 2, 'Paid', 'Paid', GETUTCDATE(), GETUTCDATE());

/* SQL text to insert entity field value with ID 7ae8656b-7a4f-4783-8178-5af7ea80888f */
INSERT INTO [${mjSchema}].[EntityFieldValue]
                                       ([ID], [EntityFieldID], [Sequence], [Value], [Code], [__mj_CreatedAt], [__mj_UpdatedAt])
                                    VALUES
                                       ('7ae8656b-7a4f-4783-8178-5af7ea80888f', '0F314803-129A-4F1C-9B08-A61F96FC66FF', 3, 'Unpaid', 'Unpaid', GETUTCDATE(), GETUTCDATE());

/* SQL text to update ValueListType for entity field ID 0F314803-129A-4F1C-9B08-A61F96FC66FF */
UPDATE [${mjSchema}].[EntityField] SET ValueListType='List' WHERE ID='0F314803-129A-4F1C-9B08-A61F96FC66FF';

/* SQL text to insert entity field value with ID ee739a98-3c05-4175-86ca-16b6bba4e9ea */
INSERT INTO [${mjSchema}].[EntityFieldValue]
                                       ([ID], [EntityFieldID], [Sequence], [Value], [Code], [__mj_CreatedAt], [__mj_UpdatedAt])
                                    VALUES
                                       ('ee739a98-3c05-4175-86ca-16b6bba4e9ea', '1297DA82-E7A0-4B03-9BD0-BD08FBB642E0', 1, 'ACH', 'ACH', GETUTCDATE(), GETUTCDATE());

/* SQL text to insert entity field value with ID 04039872-2173-436f-881a-8088dabc2664 */
INSERT INTO [${mjSchema}].[EntityFieldValue]
                                       ([ID], [EntityFieldID], [Sequence], [Value], [Code], [__mj_CreatedAt], [__mj_UpdatedAt])
                                    VALUES
                                       ('04039872-2173-436f-881a-8088dabc2664', '1297DA82-E7A0-4B03-9BD0-BD08FBB642E0', 2, 'Check', 'Check', GETUTCDATE(), GETUTCDATE());

/* SQL text to insert entity field value with ID 53a3e116-eacb-4de9-83dd-78e121686202 */
INSERT INTO [${mjSchema}].[EntityFieldValue]
                                       ([ID], [EntityFieldID], [Sequence], [Value], [Code], [__mj_CreatedAt], [__mj_UpdatedAt])
                                    VALUES
                                       ('53a3e116-eacb-4de9-83dd-78e121686202', '1297DA82-E7A0-4B03-9BD0-BD08FBB642E0', 3, 'CreditCard', 'CreditCard', GETUTCDATE(), GETUTCDATE());

/* SQL text to insert entity field value with ID 3ce28d35-1de6-4122-ac8f-ff82ce86d9a6 */
INSERT INTO [${mjSchema}].[EntityFieldValue]
                                       ([ID], [EntityFieldID], [Sequence], [Value], [Code], [__mj_CreatedAt], [__mj_UpdatedAt])
                                    VALUES
                                       ('3ce28d35-1de6-4122-ac8f-ff82ce86d9a6', '1297DA82-E7A0-4B03-9BD0-BD08FBB642E0', 4, 'Wire', 'Wire', GETUTCDATE(), GETUTCDATE());

/* SQL text to update ValueListType for entity field ID 1297DA82-E7A0-4B03-9BD0-BD08FBB642E0 */
UPDATE [${mjSchema}].[EntityField] SET ValueListType='List' WHERE ID='1297DA82-E7A0-4B03-9BD0-BD08FBB642E0';

/* SQL text to insert entity field value with ID b118f3a3-d4c9-4b26-a55f-77c94ff3af05 */
INSERT INTO [${mjSchema}].[EntityFieldValue]
                                       ([ID], [EntityFieldID], [Sequence], [Value], [Code], [__mj_CreatedAt], [__mj_UpdatedAt])
                                    VALUES
                                       ('b118f3a3-d4c9-4b26-a55f-77c94ff3af05', 'E81FA7EF-BE3B-4F98-8B76-E8738D436805', 1, 'Captured', 'Captured', GETUTCDATE(), GETUTCDATE());

/* SQL text to insert entity field value with ID 404d18fa-2904-4976-93a3-cba68e213fb5 */
INSERT INTO [${mjSchema}].[EntityFieldValue]
                                       ([ID], [EntityFieldID], [Sequence], [Value], [Code], [__mj_CreatedAt], [__mj_UpdatedAt])
                                    VALUES
                                       ('404d18fa-2904-4976-93a3-cba68e213fb5', 'E81FA7EF-BE3B-4F98-8B76-E8738D436805', 2, 'Denied', 'Denied', GETUTCDATE(), GETUTCDATE());

/* SQL text to insert entity field value with ID d157fc92-cbec-42fb-8bcb-dfd9b66b5480 */
INSERT INTO [${mjSchema}].[EntityFieldValue]
                                       ([ID], [EntityFieldID], [Sequence], [Value], [Code], [__mj_CreatedAt], [__mj_UpdatedAt])
                                    VALUES
                                       ('d157fc92-cbec-42fb-8bcb-dfd9b66b5480', 'E81FA7EF-BE3B-4F98-8B76-E8738D436805', 3, 'Failed', 'Failed', GETUTCDATE(), GETUTCDATE());

/* SQL text to insert entity field value with ID 49ff8a70-f5e1-439f-b1d2-31daee4f5547 */
INSERT INTO [${mjSchema}].[EntityFieldValue]
                                       ([ID], [EntityFieldID], [Sequence], [Value], [Code], [__mj_CreatedAt], [__mj_UpdatedAt])
                                    VALUES
                                       ('49ff8a70-f5e1-439f-b1d2-31daee4f5547', 'E81FA7EF-BE3B-4F98-8B76-E8738D436805', 4, 'InProgress', 'InProgress', GETUTCDATE(), GETUTCDATE());

/* SQL text to insert entity field value with ID 5be91d1b-7cdb-4cb4-b6a1-825d0fcdc48f */
INSERT INTO [${mjSchema}].[EntityFieldValue]
                                       ([ID], [EntityFieldID], [Sequence], [Value], [Code], [__mj_CreatedAt], [__mj_UpdatedAt])
                                    VALUES
                                       ('5be91d1b-7cdb-4cb4-b6a1-825d0fcdc48f', 'E81FA7EF-BE3B-4F98-8B76-E8738D436805', 5, 'Refunded', 'Refunded', GETUTCDATE(), GETUTCDATE());

/* SQL text to update ValueListType for entity field ID E81FA7EF-BE3B-4F98-8B76-E8738D436805 */
UPDATE [${mjSchema}].[EntityField] SET ValueListType='List' WHERE ID='E81FA7EF-BE3B-4F98-8B76-E8738D436805';

/* SQL text to insert entity field value with ID dba85f06-2a3d-4c6c-90d6-4700b33bce3f */
INSERT INTO [${mjSchema}].[EntityFieldValue]
                                       ([ID], [EntityFieldID], [Sequence], [Value], [Code], [__mj_CreatedAt], [__mj_UpdatedAt])
                                    VALUES
                                       ('dba85f06-2a3d-4c6c-90d6-4700b33bce3f', '746F56FE-9F06-4B2C-8C03-048FF31A5529', 1, 'Awarded', 'Awarded', GETUTCDATE(), GETUTCDATE());

/* SQL text to insert entity field value with ID 8bb323ed-3ee6-4c02-b412-f2090bfb287f */
INSERT INTO [${mjSchema}].[EntityFieldValue]
                                       ([ID], [EntityFieldID], [Sequence], [Value], [Code], [__mj_CreatedAt], [__mj_UpdatedAt])
                                    VALUES
                                       ('8bb323ed-3ee6-4c02-b412-f2090bfb287f', '746F56FE-9F06-4B2C-8C03-048FF31A5529', 2, 'Expired', 'Expired', GETUTCDATE(), GETUTCDATE());

/* SQL text to insert entity field value with ID 95068514-b66a-407a-ac89-d9d7817f9283 */
INSERT INTO [${mjSchema}].[EntityFieldValue]
                                       ([ID], [EntityFieldID], [Sequence], [Value], [Code], [__mj_CreatedAt], [__mj_UpdatedAt])
                                    VALUES
                                       ('95068514-b66a-407a-ac89-d9d7817f9283', '746F56FE-9F06-4B2C-8C03-048FF31A5529', 3, 'InProgress', 'InProgress', GETUTCDATE(), GETUTCDATE());

/* SQL text to insert entity field value with ID 58aa47b0-ed9f-412b-98d0-c5f70f4e7508 */
INSERT INTO [${mjSchema}].[EntityFieldValue]
                                       ([ID], [EntityFieldID], [Sequence], [Value], [Code], [__mj_CreatedAt], [__mj_UpdatedAt])
                                    VALUES
                                       ('58aa47b0-ed9f-412b-98d0-c5f70f4e7508', '746F56FE-9F06-4B2C-8C03-048FF31A5529', 4, 'Withdrawn', 'Withdrawn', GETUTCDATE(), GETUTCDATE());

/* SQL text to update ValueListType for entity field ID 746F56FE-9F06-4B2C-8C03-048FF31A5529 */
UPDATE [${mjSchema}].[EntityField] SET ValueListType='List' WHERE ID='746F56FE-9F06-4B2C-8C03-048FF31A5529';

/* SQL text to insert entity field value with ID 3870b262-c6d4-466b-b698-3ed4de2d03b2 */
INSERT INTO [${mjSchema}].[EntityFieldValue]
                                       ([ID], [EntityFieldID], [Sequence], [Value], [Code], [__mj_CreatedAt], [__mj_UpdatedAt])
                                    VALUES
                                       ('3870b262-c6d4-466b-b698-3ed4de2d03b2', '5F12E8AC-E151-42A5-9162-55F0740DEB93', 1, 'Bronze', 'Bronze', GETUTCDATE(), GETUTCDATE());

/* SQL text to insert entity field value with ID 627d23ed-24b7-4885-b9c4-0f7e380053d3 */
INSERT INTO [${mjSchema}].[EntityFieldValue]
                                       ([ID], [EntityFieldID], [Sequence], [Value], [Code], [__mj_CreatedAt], [__mj_UpdatedAt])
                                    VALUES
                                       ('627d23ed-24b7-4885-b9c4-0f7e380053d3', '5F12E8AC-E151-42A5-9162-55F0740DEB93', 2, 'Gold', 'Gold', GETUTCDATE(), GETUTCDATE());

/* SQL text to insert entity field value with ID 45a83488-3e68-4f28-9f41-f1611ce492bc */
INSERT INTO [${mjSchema}].[EntityFieldValue]
                                       ([ID], [EntityFieldID], [Sequence], [Value], [Code], [__mj_CreatedAt], [__mj_UpdatedAt])
                                    VALUES
                                       ('45a83488-3e68-4f28-9f41-f1611ce492bc', '5F12E8AC-E151-42A5-9162-55F0740DEB93', 3, 'None', 'None', GETUTCDATE(), GETUTCDATE());

/* SQL text to insert entity field value with ID bacfd00e-f4a8-4f3c-922d-c9d2d4193e48 */
INSERT INTO [${mjSchema}].[EntityFieldValue]
                                       ([ID], [EntityFieldID], [Sequence], [Value], [Code], [__mj_CreatedAt], [__mj_UpdatedAt])
                                    VALUES
                                       ('bacfd00e-f4a8-4f3c-922d-c9d2d4193e48', '5F12E8AC-E151-42A5-9162-55F0740DEB93', 4, 'Silver', 'Silver', GETUTCDATE(), GETUTCDATE());

/* SQL text to update ValueListType for entity field ID 5F12E8AC-E151-42A5-9162-55F0740DEB93 */
UPDATE [${mjSchema}].[EntityField] SET ValueListType='List' WHERE ID='5F12E8AC-E151-42A5-9162-55F0740DEB93';

/* SQL text to insert entity field value with ID e5c91fd7-34d5-44e5-9a44-3a82585afbc9 */
INSERT INTO [${mjSchema}].[EntityFieldValue]
                                       ([ID], [EntityFieldID], [Sequence], [Value], [Code], [__mj_CreatedAt], [__mj_UpdatedAt])
                                    VALUES
                                       ('e5c91fd7-34d5-44e5-9a44-3a82585afbc9', '25FAB85A-522F-4FC8-8AAD-FF5210E064EB', 1, 'CoalitionMeeting', 'CoalitionMeeting', GETUTCDATE(), GETUTCDATE());

/* SQL text to insert entity field value with ID b3c38909-decc-41ca-826c-e8085dc0a0c6 */
INSERT INTO [${mjSchema}].[EntityFieldValue]
                                       ([ID], [EntityFieldID], [Sequence], [Value], [Code], [__mj_CreatedAt], [__mj_UpdatedAt])
                                    VALUES
                                       ('b3c38909-decc-41ca-826c-e8085dc0a0c6', '25FAB85A-522F-4FC8-8AAD-FF5210E064EB', 2, 'LetterCampaign', 'LetterCampaign', GETUTCDATE(), GETUTCDATE());

/* SQL text to insert entity field value with ID 8302cc5e-f1a6-436b-8f9e-7aa66a650947 */
INSERT INTO [${mjSchema}].[EntityFieldValue]
                                       ([ID], [EntityFieldID], [Sequence], [Value], [Code], [__mj_CreatedAt], [__mj_UpdatedAt])
                                    VALUES
                                       ('8302cc5e-f1a6-436b-8f9e-7aa66a650947', '25FAB85A-522F-4FC8-8AAD-FF5210E064EB', 3, 'PetitionSignature', 'PetitionSignature', GETUTCDATE(), GETUTCDATE());

/* SQL text to insert entity field value with ID 35b481d7-1dee-45a7-9272-e4ec4e738180 */
INSERT INTO [${mjSchema}].[EntityFieldValue]
                                       ([ID], [EntityFieldID], [Sequence], [Value], [Code], [__mj_CreatedAt], [__mj_UpdatedAt])
                                    VALUES
                                       ('35b481d7-1dee-45a7-9272-e4ec4e738180', '25FAB85A-522F-4FC8-8AAD-FF5210E064EB', 4, 'Testimony', 'Testimony', GETUTCDATE(), GETUTCDATE());

/* SQL text to update ValueListType for entity field ID 25FAB85A-522F-4FC8-8AAD-FF5210E064EB */
UPDATE [${mjSchema}].[EntityField] SET ValueListType='List' WHERE ID='25FAB85A-522F-4FC8-8AAD-FF5210E064EB';

/* SQL text to insert entity field value with ID cb01fb78-da14-452f-ab47-5f5a6e395fc0 */
INSERT INTO [${mjSchema}].[EntityFieldValue]
                                       ([ID], [EntityFieldID], [Sequence], [Value], [Code], [__mj_CreatedAt], [__mj_UpdatedAt])
                                    VALUES
                                       ('cb01fb78-da14-452f-ab47-5f5a6e395fc0', '05581837-3C8F-46CF-81DE-0BE422635347', 1, 'DuplicatePerson', 'DuplicatePerson', GETUTCDATE(), GETUTCDATE());

/* SQL text to insert entity field value with ID 0f6ff1be-1d30-412b-adda-3fc84afb35e4 */
INSERT INTO [${mjSchema}].[EntityFieldValue]
                                       ([ID], [EntityFieldID], [Sequence], [Value], [Code], [__mj_CreatedAt], [__mj_UpdatedAt])
                                    VALUES
                                       ('0f6ff1be-1d30-412b-adda-3fc84afb35e4', '05581837-3C8F-46CF-81DE-0BE422635347', 2, 'StaleEmployer', 'StaleEmployer', GETUTCDATE(), GETUTCDATE());

/* SQL text to insert entity field value with ID 21806def-8afc-4915-9bbe-fe22be490b6d */
INSERT INTO [${mjSchema}].[EntityFieldValue]
                                       ([ID], [EntityFieldID], [Sequence], [Value], [Code], [__mj_CreatedAt], [__mj_UpdatedAt])
                                    VALUES
                                       ('21806def-8afc-4915-9bbe-fe22be490b6d', '05581837-3C8F-46CF-81DE-0BE422635347', 3, 'TypoEmail', 'TypoEmail', GETUTCDATE(), GETUTCDATE());

/* SQL text to update ValueListType for entity field ID 05581837-3C8F-46CF-81DE-0BE422635347 */
UPDATE [${mjSchema}].[EntityField] SET ValueListType='List' WHERE ID='05581837-3C8F-46CF-81DE-0BE422635347';

/* SQL text to insert entity field value with ID c289f40e-d2f4-44a5-81dc-1d238bb33687 */
INSERT INTO [${mjSchema}].[EntityFieldValue]
                                       ([ID], [EntityFieldID], [Sequence], [Value], [Code], [__mj_CreatedAt], [__mj_UpdatedAt])
                                    VALUES
                                       ('c289f40e-d2f4-44a5-81dc-1d238bb33687', '40E22E3D-6286-40AA-BC47-A86BC126A43F', 1, 'Educator', 'Educator', GETUTCDATE(), GETUTCDATE());

/* SQL text to insert entity field value with ID c02825bd-5b75-4496-be0b-e2e23f591f10 */
INSERT INTO [${mjSchema}].[EntityFieldValue]
                                       ([ID], [EntityFieldID], [Sequence], [Value], [Code], [__mj_CreatedAt], [__mj_UpdatedAt])
                                    VALUES
                                       ('c02825bd-5b75-4496-be0b-e2e23f591f10', '40E22E3D-6286-40AA-BC47-A86BC126A43F', 2, 'Producer', 'Producer', GETUTCDATE(), GETUTCDATE());

/* SQL text to insert entity field value with ID 7bf38e08-c6d2-4f89-b6e1-a7b4bf7f9715 */
INSERT INTO [${mjSchema}].[EntityFieldValue]
                                       ([ID], [EntityFieldID], [Sequence], [Value], [Code], [__mj_CreatedAt], [__mj_UpdatedAt])
                                    VALUES
                                       ('7bf38e08-c6d2-4f89-b6e1-a7b4bf7f9715', '40E22E3D-6286-40AA-BC47-A86BC126A43F', 3, 'Retailer', 'Retailer', GETUTCDATE(), GETUTCDATE());

/* SQL text to insert entity field value with ID 9ec5c819-e4e4-4bcb-8ba3-dc1e6a3efc03 */
INSERT INTO [${mjSchema}].[EntityFieldValue]
                                       ([ID], [EntityFieldID], [Sequence], [Value], [Code], [__mj_CreatedAt], [__mj_UpdatedAt])
                                    VALUES
                                       ('9ec5c819-e4e4-4bcb-8ba3-dc1e6a3efc03', '40E22E3D-6286-40AA-BC47-A86BC126A43F', 4, 'Supplier', 'Supplier', GETUTCDATE(), GETUTCDATE());

/* SQL text to update ValueListType for entity field ID 40E22E3D-6286-40AA-BC47-A86BC126A43F */
UPDATE [${mjSchema}].[EntityField] SET ValueListType='List' WHERE ID='40E22E3D-6286-40AA-BC47-A86BC126A43F';

/* SQL text to insert entity field value with ID 4c8295fa-d855-4897-bf17-5c0539144507 */
INSERT INTO [${mjSchema}].[EntityFieldValue]
                                       ([ID], [EntityFieldID], [Sequence], [Value], [Code], [__mj_CreatedAt], [__mj_UpdatedAt])
                                    VALUES
                                       ('4c8295fa-d855-4897-bf17-5c0539144507', 'E255C844-F9DB-44DB-AAE4-33DFC9C3D515', 1, 'EU', 'EU', GETUTCDATE(), GETUTCDATE());

/* SQL text to insert entity field value with ID 171d8e99-19f0-4606-b78e-7248285ca6c3 */
INSERT INTO [${mjSchema}].[EntityFieldValue]
                                       ([ID], [EntityFieldID], [Sequence], [Value], [Code], [__mj_CreatedAt], [__mj_UpdatedAt])
                                    VALUES
                                       ('171d8e99-19f0-4606-b78e-7248285ca6c3', 'E255C844-F9DB-44DB-AAE4-33DFC9C3D515', 2, 'NA', 'NA', GETUTCDATE(), GETUTCDATE());

/* SQL text to insert entity field value with ID 696fb004-ce03-4e58-a06c-5865a9802e8f */
INSERT INTO [${mjSchema}].[EntityFieldValue]
                                       ([ID], [EntityFieldID], [Sequence], [Value], [Code], [__mj_CreatedAt], [__mj_UpdatedAt])
                                    VALUES
                                       ('696fb004-ce03-4e58-a06c-5865a9802e8f', 'E255C844-F9DB-44DB-AAE4-33DFC9C3D515', 3, 'RoW', 'RoW', GETUTCDATE(), GETUTCDATE());

/* SQL text to update ValueListType for entity field ID E255C844-F9DB-44DB-AAE4-33DFC9C3D515 */
UPDATE [${mjSchema}].[EntityField] SET ValueListType='List' WHERE ID='E255C844-F9DB-44DB-AAE4-33DFC9C3D515';

/* SQL text to insert entity field value with ID ae700ebc-25be-4cac-bebf-dd5ed99ee92d */
INSERT INTO [${mjSchema}].[EntityFieldValue]
                                       ([ID], [EntityFieldID], [Sequence], [Value], [Code], [__mj_CreatedAt], [__mj_UpdatedAt])
                                    VALUES
                                       ('ae700ebc-25be-4cac-bebf-dd5ed99ee92d', '51EB5EDD-5FF5-4C69-9204-B6EDDA4715EE', 1, 'Acquired', 'Acquired', GETUTCDATE(), GETUTCDATE());

/* SQL text to insert entity field value with ID 3ae88e9c-473e-48a5-8f46-f6b427e72075 */
INSERT INTO [${mjSchema}].[EntityFieldValue]
                                       ([ID], [EntityFieldID], [Sequence], [Value], [Code], [__mj_CreatedAt], [__mj_UpdatedAt])
                                    VALUES
                                       ('3ae88e9c-473e-48a5-8f46-f6b427e72075', '51EB5EDD-5FF5-4C69-9204-B6EDDA4715EE', 2, 'Dissolved', 'Dissolved', GETUTCDATE(), GETUTCDATE());

/* SQL text to insert entity field value with ID b8985ede-ad69-4f93-bb79-56669800e73c */
INSERT INTO [${mjSchema}].[EntityFieldValue]
                                       ([ID], [EntityFieldID], [Sequence], [Value], [Code], [__mj_CreatedAt], [__mj_UpdatedAt])
                                    VALUES
                                       ('b8985ede-ad69-4f93-bb79-56669800e73c', '51EB5EDD-5FF5-4C69-9204-B6EDDA4715EE', 3, 'ProgramCut', 'ProgramCut', GETUTCDATE(), GETUTCDATE());

/* SQL text to update ValueListType for entity field ID 51EB5EDD-5FF5-4C69-9204-B6EDDA4715EE */
UPDATE [${mjSchema}].[EntityField] SET ValueListType='List' WHERE ID='51EB5EDD-5FF5-4C69-9204-B6EDDA4715EE';

/* SQL text to insert entity field value with ID 233fb505-5abe-4e23-8c07-822735bfe472 */
INSERT INTO [${mjSchema}].[EntityFieldValue]
                                       ([ID], [EntityFieldID], [Sequence], [Value], [Code], [__mj_CreatedAt], [__mj_UpdatedAt])
                                    VALUES
                                       ('233fb505-5abe-4e23-8c07-822735bfe472', 'D68DB94A-73FD-42CA-8A09-D6EB01FB56EB', 1, 'Educator', 'Educator', GETUTCDATE(), GETUTCDATE());

/* SQL text to insert entity field value with ID 299115cd-1ec5-447e-9a5f-b1646804bfa7 */
INSERT INTO [${mjSchema}].[EntityFieldValue]
                                       ([ID], [EntityFieldID], [Sequence], [Value], [Code], [__mj_CreatedAt], [__mj_UpdatedAt])
                                    VALUES
                                       ('299115cd-1ec5-447e-9a5f-b1646804bfa7', 'D68DB94A-73FD-42CA-8A09-D6EB01FB56EB', 2, 'Enthusiast', 'Enthusiast', GETUTCDATE(), GETUTCDATE());

/* SQL text to insert entity field value with ID 4eaa1439-d737-4fbd-b0b5-ebfb49a9f506 */
INSERT INTO [${mjSchema}].[EntityFieldValue]
                                       ([ID], [EntityFieldID], [Sequence], [Value], [Code], [__mj_CreatedAt], [__mj_UpdatedAt])
                                    VALUES
                                       ('4eaa1439-d737-4fbd-b0b5-ebfb49a9f506', 'D68DB94A-73FD-42CA-8A09-D6EB01FB56EB', 3, 'Producer', 'Producer', GETUTCDATE(), GETUTCDATE());

/* SQL text to insert entity field value with ID 32d0cbdc-eab0-4c87-81b5-d5fc66ef3006 */
INSERT INTO [${mjSchema}].[EntityFieldValue]
                                       ([ID], [EntityFieldID], [Sequence], [Value], [Code], [__mj_CreatedAt], [__mj_UpdatedAt])
                                    VALUES
                                       ('32d0cbdc-eab0-4c87-81b5-d5fc66ef3006', 'D68DB94A-73FD-42CA-8A09-D6EB01FB56EB', 4, 'Retailer', 'Retailer', GETUTCDATE(), GETUTCDATE());

/* SQL text to insert entity field value with ID 32ca10b7-096d-4edf-afbf-7ef6c6ebe656 */
INSERT INTO [${mjSchema}].[EntityFieldValue]
                                       ([ID], [EntityFieldID], [Sequence], [Value], [Code], [__mj_CreatedAt], [__mj_UpdatedAt])
                                    VALUES
                                       ('32ca10b7-096d-4edf-afbf-7ef6c6ebe656', 'D68DB94A-73FD-42CA-8A09-D6EB01FB56EB', 5, 'Supplier', 'Supplier', GETUTCDATE(), GETUTCDATE());

/* SQL text to update ValueListType for entity field ID D68DB94A-73FD-42CA-8A09-D6EB01FB56EB */
UPDATE [${mjSchema}].[EntityField] SET ValueListType='List' WHERE ID='D68DB94A-73FD-42CA-8A09-D6EB01FB56EB';

/* SQL text to insert entity field value with ID 994eb402-f502-452a-89f4-c3830312247b */
INSERT INTO [${mjSchema}].[EntityFieldValue]
                                       ([ID], [EntityFieldID], [Sequence], [Value], [Code], [__mj_CreatedAt], [__mj_UpdatedAt])
                                    VALUES
                                       ('994eb402-f502-452a-89f4-c3830312247b', 'B9B51678-E3DE-4F2B-ADDC-36AABC71E0F8', 1, 'EU', 'EU', GETUTCDATE(), GETUTCDATE());

/* SQL text to insert entity field value with ID 5c2d89ab-7d86-4ae6-b719-c141dff7b65d */
INSERT INTO [${mjSchema}].[EntityFieldValue]
                                       ([ID], [EntityFieldID], [Sequence], [Value], [Code], [__mj_CreatedAt], [__mj_UpdatedAt])
                                    VALUES
                                       ('5c2d89ab-7d86-4ae6-b719-c141dff7b65d', 'B9B51678-E3DE-4F2B-ADDC-36AABC71E0F8', 2, 'NA', 'NA', GETUTCDATE(), GETUTCDATE());

/* SQL text to insert entity field value with ID 7273e477-8aaf-405f-a394-420d7d584b0d */
INSERT INTO [${mjSchema}].[EntityFieldValue]
                                       ([ID], [EntityFieldID], [Sequence], [Value], [Code], [__mj_CreatedAt], [__mj_UpdatedAt])
                                    VALUES
                                       ('7273e477-8aaf-405f-a394-420d7d584b0d', 'B9B51678-E3DE-4F2B-ADDC-36AABC71E0F8', 3, 'RoW', 'RoW', GETUTCDATE(), GETUTCDATE());

/* SQL text to update ValueListType for entity field ID B9B51678-E3DE-4F2B-ADDC-36AABC71E0F8 */
UPDATE [${mjSchema}].[EntityField] SET ValueListType='List' WHERE ID='B9B51678-E3DE-4F2B-ADDC-36AABC71E0F8';

/* SQL text to insert entity field value with ID 69851fcc-523e-43e7-8b98-1493464f3274 */
INSERT INTO [${mjSchema}].[EntityFieldValue]
                                       ([ID], [EntityFieldID], [Sequence], [Value], [Code], [__mj_CreatedAt], [__mj_UpdatedAt])
                                    VALUES
                                       ('69851fcc-523e-43e7-8b98-1493464f3274', '3E2B5EA7-98F4-436B-9ED8-7ACC434757B0', 1, 'Active', 'Active', GETUTCDATE(), GETUTCDATE());

/* SQL text to insert entity field value with ID 92c18707-6aa0-40f6-928f-f78b1a51d94e */
INSERT INTO [${mjSchema}].[EntityFieldValue]
                                       ([ID], [EntityFieldID], [Sequence], [Value], [Code], [__mj_CreatedAt], [__mj_UpdatedAt])
                                    VALUES
                                       ('92c18707-6aa0-40f6-928f-f78b1a51d94e', '3E2B5EA7-98F4-436B-9ED8-7ACC434757B0', 2, 'Cancelled', 'Cancelled', GETUTCDATE(), GETUTCDATE());

/* SQL text to insert entity field value with ID 8f42e5c5-889c-47dc-aeeb-2a7e1c244f3a */
INSERT INTO [${mjSchema}].[EntityFieldValue]
                                       ([ID], [EntityFieldID], [Sequence], [Value], [Code], [__mj_CreatedAt], [__mj_UpdatedAt])
                                    VALUES
                                       ('8f42e5c5-889c-47dc-aeeb-2a7e1c244f3a', '3E2B5EA7-98F4-436B-9ED8-7ACC434757B0', 3, 'Lapsed', 'Lapsed', GETUTCDATE(), GETUTCDATE());

/* SQL text to insert entity field value with ID da6042a0-7470-4a07-b328-acfe2ed9229f */
INSERT INTO [${mjSchema}].[EntityFieldValue]
                                       ([ID], [EntityFieldID], [Sequence], [Value], [Code], [__mj_CreatedAt], [__mj_UpdatedAt])
                                    VALUES
                                       ('da6042a0-7470-4a07-b328-acfe2ed9229f', '3E2B5EA7-98F4-436B-9ED8-7ACC434757B0', 4, 'PendingRenewal', 'PendingRenewal', GETUTCDATE(), GETUTCDATE());

/* SQL text to insert entity field value with ID fdc63afe-c4d9-406f-9b27-61c58f28b363 */
INSERT INTO [${mjSchema}].[EntityFieldValue]
                                       ([ID], [EntityFieldID], [Sequence], [Value], [Code], [__mj_CreatedAt], [__mj_UpdatedAt])
                                    VALUES
                                       ('fdc63afe-c4d9-406f-9b27-61c58f28b363', '3E2B5EA7-98F4-436B-9ED8-7ACC434757B0', 5, 'Renewed', 'Renewed', GETUTCDATE(), GETUTCDATE());

/* SQL text to update ValueListType for entity field ID 3E2B5EA7-98F4-436B-9ED8-7ACC434757B0 */
UPDATE [${mjSchema}].[EntityField] SET ValueListType='List' WHERE ID='3E2B5EA7-98F4-436B-9ED8-7ACC434757B0';

/* SQL text to insert entity field value with ID 59cb0299-b16d-4a0c-9a04-3628e5e8bab7 */
INSERT INTO [${mjSchema}].[EntityFieldValue]
                                       ([ID], [EntityFieldID], [Sequence], [Value], [Code], [__mj_CreatedAt], [__mj_UpdatedAt])
                                    VALUES
                                       ('59cb0299-b16d-4a0c-9a04-3628e5e8bab7', '71632094-F78D-42EE-846E-A1F9423E2357', 1, 'Corporate', 'Corporate', GETUTCDATE(), GETUTCDATE());

/* SQL text to insert entity field value with ID 90c6c42d-421a-4633-9598-78d2de15344d */
INSERT INTO [${mjSchema}].[EntityFieldValue]
                                       ([ID], [EntityFieldID], [Sequence], [Value], [Code], [__mj_CreatedAt], [__mj_UpdatedAt])
                                    VALUES
                                       ('90c6c42d-421a-4633-9598-78d2de15344d', '71632094-F78D-42EE-846E-A1F9423E2357', 2, 'Enthusiast', 'Enthusiast', GETUTCDATE(), GETUTCDATE());

/* SQL text to insert entity field value with ID 2b1826a6-14d9-4c57-b41a-66cd292193e0 */
INSERT INTO [${mjSchema}].[EntityFieldValue]
                                       ([ID], [EntityFieldID], [Sequence], [Value], [Code], [__mj_CreatedAt], [__mj_UpdatedAt])
                                    VALUES
                                       ('2b1826a6-14d9-4c57-b41a-66cd292193e0', '71632094-F78D-42EE-846E-A1F9423E2357', 3, 'Individual', 'Individual', GETUTCDATE(), GETUTCDATE());

/* SQL text to insert entity field value with ID 08a65157-6420-4213-9fd3-096c528a93ef */
INSERT INTO [${mjSchema}].[EntityFieldValue]
                                       ([ID], [EntityFieldID], [Sequence], [Value], [Code], [__mj_CreatedAt], [__mj_UpdatedAt])
                                    VALUES
                                       ('08a65157-6420-4213-9fd3-096c528a93ef', '71632094-F78D-42EE-846E-A1F9423E2357', 4, 'SmallBusiness', 'SmallBusiness', GETUTCDATE(), GETUTCDATE());

/* SQL text to update ValueListType for entity field ID 71632094-F78D-42EE-846E-A1F9423E2357 */
UPDATE [${mjSchema}].[EntityField] SET ValueListType='List' WHERE ID='71632094-F78D-42EE-846E-A1F9423E2357';

/* SQL text to insert entity field value with ID 1d8d5506-5cd6-4146-8629-6a95a989d719 */
INSERT INTO [${mjSchema}].[EntityFieldValue]
                                       ([ID], [EntityFieldID], [Sequence], [Value], [Code], [__mj_CreatedAt], [__mj_UpdatedAt])
                                    VALUES
                                       ('1d8d5506-5cd6-4146-8629-6a95a989d719', 'DFFF15DE-7516-4DBD-8302-4B593C2026F6', 1, 'Conference', 'Conference', GETUTCDATE(), GETUTCDATE());

/* SQL text to insert entity field value with ID 667eeaac-4cb6-491b-bc06-74a48e5d3b22 */
INSERT INTO [${mjSchema}].[EntityFieldValue]
                                       ([ID], [EntityFieldID], [Sequence], [Value], [Code], [__mj_CreatedAt], [__mj_UpdatedAt])
                                    VALUES
                                       ('667eeaac-4cb6-491b-bc06-74a48e5d3b22', 'DFFF15DE-7516-4DBD-8302-4B593C2026F6', 2, 'Webinar', 'Webinar', GETUTCDATE(), GETUTCDATE());

/* SQL text to insert entity field value with ID e5c85b68-bdc8-479c-be24-8911cbcdb6fb */
INSERT INTO [${mjSchema}].[EntityFieldValue]
                                       ([ID], [EntityFieldID], [Sequence], [Value], [Code], [__mj_CreatedAt], [__mj_UpdatedAt])
                                    VALUES
                                       ('e5c85b68-bdc8-479c-be24-8911cbcdb6fb', 'DFFF15DE-7516-4DBD-8302-4B593C2026F6', 3, 'Workshop', 'Workshop', GETUTCDATE(), GETUTCDATE());

/* SQL text to update ValueListType for entity field ID DFFF15DE-7516-4DBD-8302-4B593C2026F6 */
UPDATE [${mjSchema}].[EntityField] SET ValueListType='List' WHERE ID='DFFF15DE-7516-4DBD-8302-4B593C2026F6';


/* Create Entity Relationship: MoreCheese: Certifications -> MoreCheese: Member Certifications (One To Many via CertificationID) */
   IF NOT EXISTS (
      SELECT 1 FROM [${mjSchema}].[EntityRelationship] WHERE [ID] = '7764912e-fe91-44f6-86f7-208da7eec11b'
   )
   BEGIN
      INSERT INTO [${mjSchema}].[EntityRelationship] ([ID], [EntityID], [RelatedEntityID], [RelatedEntityJoinField], [Type], [BundleInAPI], [DisplayInForm], [Sequence], [__mj_CreatedAt], [__mj_UpdatedAt])
                    VALUES ('7764912e-fe91-44f6-86f7-208da7eec11b', '3C5ED337-C9BE-4ECC-9BA4-1BE2A797F0F2', 'F4D4BA79-C264-45C6-9A51-A00571ABCD6B', 'CertificationID', 'One To Many', 1, 1, 1, GETUTCDATE(), GETUTCDATE())
   END;
                    
/* Create Entity Relationship: MoreCheese: Products -> MoreCheese: Order Lines (One To Many via ProductID) */
   IF NOT EXISTS (
      SELECT 1 FROM [${mjSchema}].[EntityRelationship] WHERE [ID] = '88e58ee3-f014-4366-9438-035b659aa8f0'
   )
   BEGIN
      INSERT INTO [${mjSchema}].[EntityRelationship] ([ID], [EntityID], [RelatedEntityID], [RelatedEntityJoinField], [Type], [BundleInAPI], [DisplayInForm], [Sequence], [__mj_CreatedAt], [__mj_UpdatedAt])
                    VALUES ('88e58ee3-f014-4366-9438-035b659aa8f0', 'D2D94E6A-E5E0-4BAA-A50B-5479770D2F4E', '594A4CE0-05A6-407A-92AF-4690B557BC6B', 'ProductID', 'One To Many', 1, 1, 1, GETUTCDATE(), GETUTCDATE())
   END;
                    
/* Create Entity Relationship: MJ_BizApps_Common: Organizations -> MoreCheese: Member Profiles (One To Many via OrganizationID) */
   IF NOT EXISTS (
      SELECT 1 FROM [${mjSchema}].[EntityRelationship] WHERE [ID] = '6b1c9fd3-0b89-418a-8c89-61e7138f266a'
   )
   BEGIN
      INSERT INTO [${mjSchema}].[EntityRelationship] ([ID], [EntityID], [RelatedEntityID], [RelatedEntityJoinField], [Type], [BundleInAPI], [DisplayInForm], [Sequence], [__mj_CreatedAt], [__mj_UpdatedAt])
                    VALUES ('6b1c9fd3-0b89-418a-8c89-61e7138f266a', 'C70448F9-9792-41D7-A82C-784B66429D54', '84685BD4-A229-47C6-A759-71B5DFD410A0', 'OrganizationID', 'One To Many', 1, 1, 6, GETUTCDATE(), GETUTCDATE())
   END;
                    
/* Create Entity Relationship: MJ_BizApps_Common: Organizations -> MoreCheese: Data Quality Labels (One To Many via RelatedOrganizationID) */
   IF NOT EXISTS (
      SELECT 1 FROM [${mjSchema}].[EntityRelationship] WHERE [ID] = '4d86f1a5-5ee7-452a-a031-589e440280e8'
   )
   BEGIN
      INSERT INTO [${mjSchema}].[EntityRelationship] ([ID], [EntityID], [RelatedEntityID], [RelatedEntityJoinField], [Type], [BundleInAPI], [DisplayInForm], [Sequence], [__mj_CreatedAt], [__mj_UpdatedAt])
                    VALUES ('4d86f1a5-5ee7-452a-a031-589e440280e8', 'C70448F9-9792-41D7-A82C-784B66429D54', '74A95CB4-0407-4A2A-A84E-18FAF120B0D6', 'RelatedOrganizationID', 'One To Many', 1, 1, 7, GETUTCDATE(), GETUTCDATE())
   END;
                    
/* Create Entity Relationship: MJ_BizApps_Common: Organizations -> MoreCheese: Competition Entries (One To Many via OrganizationID) */
   IF NOT EXISTS (
      SELECT 1 FROM [${mjSchema}].[EntityRelationship] WHERE [ID] = '5b72b4c7-8441-487f-beec-6004c903924d'
   )
   BEGIN
      INSERT INTO [${mjSchema}].[EntityRelationship] ([ID], [EntityID], [RelatedEntityID], [RelatedEntityJoinField], [Type], [BundleInAPI], [DisplayInForm], [Sequence], [__mj_CreatedAt], [__mj_UpdatedAt])
                    VALUES ('5b72b4c7-8441-487f-beec-6004c903924d', 'C70448F9-9792-41D7-A82C-784B66429D54', '1928BDF7-D4EE-4C1B-B36D-CC3B9A4782AC', 'OrganizationID', 'One To Many', 1, 1, 8, GETUTCDATE(), GETUTCDATE())
   END;


/* Create Entity Relationship: MJ_BizApps_Common: Organizations -> MoreCheese: Organization Profiles (One To Many via OrganizationID) */
   IF NOT EXISTS (
      SELECT 1 FROM [${mjSchema}].[EntityRelationship] WHERE [ID] = 'ca33b612-ddd0-46c8-9ad6-4f184f8218af'
   )
   BEGIN
      INSERT INTO [${mjSchema}].[EntityRelationship] ([ID], [EntityID], [RelatedEntityID], [RelatedEntityJoinField], [Type], [BundleInAPI], [DisplayInForm], [Sequence], [__mj_CreatedAt], [__mj_UpdatedAt])
                    VALUES ('ca33b612-ddd0-46c8-9ad6-4f184f8218af', 'C70448F9-9792-41D7-A82C-784B66429D54', '56A03017-EBD2-4BC3-A67C-73FDB8C189F4', 'OrganizationID', 'One To Many', 1, 1, 9, GETUTCDATE(), GETUTCDATE())
   END;
                    
/* Create Entity Relationship: MoreCheese: Orders -> MoreCheese: Payments (One To Many via OrderID) */
   IF NOT EXISTS (
      SELECT 1 FROM [${mjSchema}].[EntityRelationship] WHERE [ID] = 'eef16f74-e36f-44d6-a5e2-1398d1d02aac'
   )
   BEGIN
      INSERT INTO [${mjSchema}].[EntityRelationship] ([ID], [EntityID], [RelatedEntityID], [RelatedEntityJoinField], [Type], [BundleInAPI], [DisplayInForm], [Sequence], [__mj_CreatedAt], [__mj_UpdatedAt])
                    VALUES ('eef16f74-e36f-44d6-a5e2-1398d1d02aac', 'A186072D-0D8B-497E-8766-9B2F300A6055', '8D7A9A85-352E-4BE4-A663-4F930ED61A42', 'OrderID', 'One To Many', 1, 1, 1, GETUTCDATE(), GETUTCDATE())
   END;
                    
/* Create Entity Relationship: MoreCheese: Orders -> MoreCheese: Order Lines (One To Many via OrderID) */
   IF NOT EXISTS (
      SELECT 1 FROM [${mjSchema}].[EntityRelationship] WHERE [ID] = '93ac4fbb-e58e-402b-80c2-43f63cff524d'
   )
   BEGIN
      INSERT INTO [${mjSchema}].[EntityRelationship] ([ID], [EntityID], [RelatedEntityID], [RelatedEntityJoinField], [Type], [BundleInAPI], [DisplayInForm], [Sequence], [__mj_CreatedAt], [__mj_UpdatedAt])
                    VALUES ('93ac4fbb-e58e-402b-80c2-43f63cff524d', 'A186072D-0D8B-497E-8766-9B2F300A6055', '594A4CE0-05A6-407A-92AF-4690B557BC6B', 'OrderID', 'One To Many', 1, 1, 2, GETUTCDATE(), GETUTCDATE())
   END;
                    
/* Create Entity Relationship: MoreCheese: Courses -> MoreCheese: Course Enrollments (One To Many via CourseID) */
   IF NOT EXISTS (
      SELECT 1 FROM [${mjSchema}].[EntityRelationship] WHERE [ID] = 'c0d9a4d0-5d94-4873-9702-f924c2d66bea'
   )
   BEGIN
      INSERT INTO [${mjSchema}].[EntityRelationship] ([ID], [EntityID], [RelatedEntityID], [RelatedEntityJoinField], [Type], [BundleInAPI], [DisplayInForm], [Sequence], [__mj_CreatedAt], [__mj_UpdatedAt])
                    VALUES ('c0d9a4d0-5d94-4873-9702-f924c2d66bea', 'B718D5BB-DC40-4FAE-BC8F-BCB35247ED0E', 'FE8BF319-06BC-4E03-A22A-7864DB37579F', 'CourseID', 'One To Many', 1, 1, 1, GETUTCDATE(), GETUTCDATE())
   END;
                    
/* Create Entity Relationship: MJ_BizApps_Common: People -> MoreCheese: Course Enrollments (One To Many via PersonID) */
   IF NOT EXISTS (
      SELECT 1 FROM [${mjSchema}].[EntityRelationship] WHERE [ID] = '07646961-d239-420d-86cb-d5d5f1aaff4a'
   )
   BEGIN
      INSERT INTO [${mjSchema}].[EntityRelationship] ([ID], [EntityID], [RelatedEntityID], [RelatedEntityJoinField], [Type], [BundleInAPI], [DisplayInForm], [Sequence], [__mj_CreatedAt], [__mj_UpdatedAt])
                    VALUES ('07646961-d239-420d-86cb-d5d5f1aaff4a', '7A94ADA9-7880-4FAE-97D8-DB0E934C3F5F', 'FE8BF319-06BC-4E03-A22A-7864DB37579F', 'PersonID', 'One To Many', 1, 1, 18, GETUTCDATE(), GETUTCDATE())
   END;


/* Create Entity Relationship: MJ_BizApps_Common: People -> MoreCheese: Membership Periods (One To Many via PersonID) */
   IF NOT EXISTS (
      SELECT 1 FROM [${mjSchema}].[EntityRelationship] WHERE [ID] = 'ed7d831c-6cfa-4cf4-888e-9c2b8b873717'
   )
   BEGIN
      INSERT INTO [${mjSchema}].[EntityRelationship] ([ID], [EntityID], [RelatedEntityID], [RelatedEntityJoinField], [Type], [BundleInAPI], [DisplayInForm], [Sequence], [__mj_CreatedAt], [__mj_UpdatedAt])
                    VALUES ('ed7d831c-6cfa-4cf4-888e-9c2b8b873717', '7A94ADA9-7880-4FAE-97D8-DB0E934C3F5F', 'ED525220-B7CB-4BB7-AC3B-92BA3878A6D0', 'PersonID', 'One To Many', 1, 1, 19, GETUTCDATE(), GETUTCDATE())
   END;
                    
/* Create Entity Relationship: MJ_BizApps_Common: People -> MoreCheese: Orders (One To Many via PersonID) */
   IF NOT EXISTS (
      SELECT 1 FROM [${mjSchema}].[EntityRelationship] WHERE [ID] = '21da2cb2-ef5c-47fd-8109-17851ca447f0'
   )
   BEGIN
      INSERT INTO [${mjSchema}].[EntityRelationship] ([ID], [EntityID], [RelatedEntityID], [RelatedEntityJoinField], [Type], [BundleInAPI], [DisplayInForm], [Sequence], [__mj_CreatedAt], [__mj_UpdatedAt])
                    VALUES ('21da2cb2-ef5c-47fd-8109-17851ca447f0', '7A94ADA9-7880-4FAE-97D8-DB0E934C3F5F', 'A186072D-0D8B-497E-8766-9B2F300A6055', 'PersonID', 'One To Many', 1, 1, 20, GETUTCDATE(), GETUTCDATE())
   END;
                    
/* Create Entity Relationship: MJ_BizApps_Common: People -> MoreCheese: Competition Entries (One To Many via PersonID) */
   IF NOT EXISTS (
      SELECT 1 FROM [${mjSchema}].[EntityRelationship] WHERE [ID] = '287de13c-d57d-45f0-bb51-91e5b18e2a73'
   )
   BEGIN
      INSERT INTO [${mjSchema}].[EntityRelationship] ([ID], [EntityID], [RelatedEntityID], [RelatedEntityJoinField], [Type], [BundleInAPI], [DisplayInForm], [Sequence], [__mj_CreatedAt], [__mj_UpdatedAt])
                    VALUES ('287de13c-d57d-45f0-bb51-91e5b18e2a73', '7A94ADA9-7880-4FAE-97D8-DB0E934C3F5F', '1928BDF7-D4EE-4C1B-B36D-CC3B9A4782AC', 'PersonID', 'One To Many', 1, 1, 21, GETUTCDATE(), GETUTCDATE())
   END;
                    
/* Create Entity Relationship: MJ_BizApps_Common: People -> MoreCheese: Advocacy Actions (One To Many via PersonID) */
   IF NOT EXISTS (
      SELECT 1 FROM [${mjSchema}].[EntityRelationship] WHERE [ID] = 'f8117b8c-ede9-42b9-ba10-ac59a3b196a4'
   )
   BEGIN
      INSERT INTO [${mjSchema}].[EntityRelationship] ([ID], [EntityID], [RelatedEntityID], [RelatedEntityJoinField], [Type], [BundleInAPI], [DisplayInForm], [Sequence], [__mj_CreatedAt], [__mj_UpdatedAt])
                    VALUES ('f8117b8c-ede9-42b9-ba10-ac59a3b196a4', '7A94ADA9-7880-4FAE-97D8-DB0E934C3F5F', '318E1216-842B-4EF7-8AD5-FCC4FC83E16E', 'PersonID', 'One To Many', 1, 1, 22, GETUTCDATE(), GETUTCDATE())
   END;
                    
/* Create Entity Relationship: MJ_BizApps_Common: People -> MoreCheese: Member Certifications (One To Many via PersonID) */
   IF NOT EXISTS (
      SELECT 1 FROM [${mjSchema}].[EntityRelationship] WHERE [ID] = '2aa051cd-2fc6-439d-9580-01c4e7c2560d'
   )
   BEGIN
      INSERT INTO [${mjSchema}].[EntityRelationship] ([ID], [EntityID], [RelatedEntityID], [RelatedEntityJoinField], [Type], [BundleInAPI], [DisplayInForm], [Sequence], [__mj_CreatedAt], [__mj_UpdatedAt])
                    VALUES ('2aa051cd-2fc6-439d-9580-01c4e7c2560d', '7A94ADA9-7880-4FAE-97D8-DB0E934C3F5F', 'F4D4BA79-C264-45C6-9A51-A00571ABCD6B', 'PersonID', 'One To Many', 1, 1, 23, GETUTCDATE(), GETUTCDATE())
   END;


/* Create Entity Relationship: MJ_BizApps_Common: People -> MoreCheese: Member Profiles (One To Many via PersonID) */
   IF NOT EXISTS (
      SELECT 1 FROM [${mjSchema}].[EntityRelationship] WHERE [ID] = 'f35bf27d-113a-4c80-ae35-ac0d8d753dc0'
   )
   BEGIN
      INSERT INTO [${mjSchema}].[EntityRelationship] ([ID], [EntityID], [RelatedEntityID], [RelatedEntityJoinField], [Type], [BundleInAPI], [DisplayInForm], [Sequence], [__mj_CreatedAt], [__mj_UpdatedAt])
                    VALUES ('f35bf27d-113a-4c80-ae35-ac0d8d753dc0', '7A94ADA9-7880-4FAE-97D8-DB0E934C3F5F', '84685BD4-A229-47C6-A759-71B5DFD410A0', 'PersonID', 'One To Many', 1, 1, 24, GETUTCDATE(), GETUTCDATE())
   END;
                    
/* Create Entity Relationship: MJ_BizApps_Common: People -> MoreCheese: Event Registrations (One To Many via PersonID) */
   IF NOT EXISTS (
      SELECT 1 FROM [${mjSchema}].[EntityRelationship] WHERE [ID] = '40c7d28c-5986-4359-9260-85507c2121ed'
   )
   BEGIN
      INSERT INTO [${mjSchema}].[EntityRelationship] ([ID], [EntityID], [RelatedEntityID], [RelatedEntityJoinField], [Type], [BundleInAPI], [DisplayInForm], [Sequence], [__mj_CreatedAt], [__mj_UpdatedAt])
                    VALUES ('40c7d28c-5986-4359-9260-85507c2121ed', '7A94ADA9-7880-4FAE-97D8-DB0E934C3F5F', '37C1AADD-E111-4604-AD2C-264775B1A076', 'PersonID', 'One To Many', 1, 1, 25, GETUTCDATE(), GETUTCDATE())
   END;
                    
/* Create Entity Relationship: MJ_BizApps_Common: People -> MoreCheese: Data Quality Labels (One To Many via RelatedPersonID) */
   IF NOT EXISTS (
      SELECT 1 FROM [${mjSchema}].[EntityRelationship] WHERE [ID] = '102bf918-40f1-4ad9-8f8b-c38c480bce53'
   )
   BEGIN
      INSERT INTO [${mjSchema}].[EntityRelationship] ([ID], [EntityID], [RelatedEntityID], [RelatedEntityJoinField], [Type], [BundleInAPI], [DisplayInForm], [Sequence], [__mj_CreatedAt], [__mj_UpdatedAt])
                    VALUES ('102bf918-40f1-4ad9-8f8b-c38c480bce53', '7A94ADA9-7880-4FAE-97D8-DB0E934C3F5F', '74A95CB4-0407-4A2A-A84E-18FAF120B0D6', 'RelatedPersonID', 'One To Many', 1, 1, 26, GETUTCDATE(), GETUTCDATE())
   END;
                    
/* Create Entity Relationship: MJ_BizApps_Common: People -> MoreCheese: Data Quality Labels (One To Many via PersonID) */
   IF NOT EXISTS (
      SELECT 1 FROM [${mjSchema}].[EntityRelationship] WHERE [ID] = '556139a2-e872-442a-b06e-c4f6240545e8'
   )
   BEGIN
      INSERT INTO [${mjSchema}].[EntityRelationship] ([ID], [EntityID], [RelatedEntityID], [RelatedEntityJoinField], [Type], [BundleInAPI], [DisplayInForm], [Sequence], [__mj_CreatedAt], [__mj_UpdatedAt])
                    VALUES ('556139a2-e872-442a-b06e-c4f6240545e8', '7A94ADA9-7880-4FAE-97D8-DB0E934C3F5F', '74A95CB4-0407-4A2A-A84E-18FAF120B0D6', 'PersonID', 'One To Many', 1, 1, 27, GETUTCDATE(), GETUTCDATE())
   END;
                    
/* Create Entity Relationship: MoreCheese: Events -> MoreCheese: Event Registrations (One To Many via EventID) */
   IF NOT EXISTS (
      SELECT 1 FROM [${mjSchema}].[EntityRelationship] WHERE [ID] = 'd1b20a9a-4186-47e3-86fb-ee7a40182e95'
   )
   BEGIN
      INSERT INTO [${mjSchema}].[EntityRelationship] ([ID], [EntityID], [RelatedEntityID], [RelatedEntityJoinField], [Type], [BundleInAPI], [DisplayInForm], [Sequence], [__mj_CreatedAt], [__mj_UpdatedAt])
                    VALUES ('d1b20a9a-4186-47e3-86fb-ee7a40182e95', '9A39A0A9-A476-4559-AEC4-E826D7410E09', '37C1AADD-E111-4604-AD2C-264775B1A076', 'EventID', 'One To Many', 1, 1, 1, GETUTCDATE(), GETUTCDATE())
   END;

/* SQL text to sync schema info from database schemas */
EXEC [${mjSchema}].[spUpdateSchemaInfoFromDatabase] @ExcludedSchemaNames='sys,staging,dbo,${mjSchema},${mjSchema}_UDT,sample_app,AssociationDemo,Bookstore,${mjSchema}_BizAppsCommon,${mjSchema}_BizAppsForms,${mjSchema}_BizAppsTasks,${mjSchema}_BizAppsIssues,${mjSchema}_BizAppsCommittees,${mjSchema}';

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

/* SQL text to update entity field related entity name field map for entity field ID 1716F162-210C-4723-B520-25EC8DC4551D */
EXEC [${mjSchema}].[spUpdateEntityFieldRelatedEntityNameFieldMap] @EntityFieldID='1716F162-210C-4723-B520-25EC8DC4551D', @RelatedEntityNameFieldMap='Person';

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

/* SQL text to update entity field related entity name field map for entity field ID 82EBAA0A-2AB6-4B56-9FE9-8199177BF852 */
EXEC [${mjSchema}].[spUpdateEntityFieldRelatedEntityNameFieldMap] @EntityFieldID='82EBAA0A-2AB6-4B56-9FE9-8199177BF852', @RelatedEntityNameFieldMap='Person';

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

/* SQL text to update entity field related entity name field map for entity field ID 6C5A8FA5-1DB2-4BEA-8BAB-114B664F9A1D */
EXEC [${mjSchema}].[spUpdateEntityFieldRelatedEntityNameFieldMap] @EntityFieldID='6C5A8FA5-1DB2-4BEA-8BAB-114B664F9A1D', @RelatedEntityNameFieldMap='Person';

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

/* SQL text to update entity field related entity name field map for entity field ID CA5D9B5D-C36B-492C-AEB1-7F3E8BF72B84 */
EXEC [${mjSchema}].[spUpdateEntityFieldRelatedEntityNameFieldMap] @EntityFieldID='CA5D9B5D-C36B-492C-AEB1-7F3E8BF72B84', @RelatedEntityNameFieldMap='Organization';

/* SQL text to update entity field related entity name field map for entity field ID 0B668435-2E50-4AFA-ABEB-F0A2AC7FFD79 */
EXEC [${mjSchema}].[spUpdateEntityFieldRelatedEntityNameFieldMap] @EntityFieldID='0B668435-2E50-4AFA-ABEB-F0A2AC7FFD79', @RelatedEntityNameFieldMap='Course';

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

/* SQL text to update entity field related entity name field map for entity field ID 5E6E76D6-74B7-4321-AEB4-906F867FBB23 */
EXEC [${mjSchema}].[spUpdateEntityFieldRelatedEntityNameFieldMap] @EntityFieldID='5E6E76D6-74B7-4321-AEB4-906F867FBB23', @RelatedEntityNameFieldMap='Person';

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

/* SQL text to update entity field related entity name field map for entity field ID 929287E5-8FD9-4F55-BF50-1D0FA1949E05 */
EXEC [${mjSchema}].[spUpdateEntityFieldRelatedEntityNameFieldMap] @EntityFieldID='929287E5-8FD9-4F55-BF50-1D0FA1949E05', @RelatedEntityNameFieldMap='Person';

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

/* SQL text to update entity field related entity name field map for entity field ID 2D09D8AC-8716-4297-A8D2-98121967C0D5 */
EXEC [${mjSchema}].[spUpdateEntityFieldRelatedEntityNameFieldMap] @EntityFieldID='2D09D8AC-8716-4297-A8D2-98121967C0D5', @RelatedEntityNameFieldMap='Person';

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

/* SQL text to update entity field related entity name field map for entity field ID 8FA08408-0E8F-4444-B9B2-DA66E970EA2C */
EXEC [${mjSchema}].[spUpdateEntityFieldRelatedEntityNameFieldMap] @EntityFieldID='8FA08408-0E8F-4444-B9B2-DA66E970EA2C', @RelatedEntityNameFieldMap='Person';

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

/* SQL text to update entity field related entity name field map for entity field ID 06AC547C-DB4B-44D1-8BB0-8FC26AE45E79 */
EXEC [${mjSchema}].[spUpdateEntityFieldRelatedEntityNameFieldMap] @EntityFieldID='06AC547C-DB4B-44D1-8BB0-8FC26AE45E79', @RelatedEntityNameFieldMap='RelatedPerson';

/* SQL text to update entity field related entity name field map for entity field ID 5F333D7C-1043-4EE4-A0CF-D117D0801FC0 */
EXEC [${mjSchema}].[spUpdateEntityFieldRelatedEntityNameFieldMap] @EntityFieldID='5F333D7C-1043-4EE4-A0CF-D117D0801FC0', @RelatedEntityNameFieldMap='Certification';

/* SQL text to update entity field related entity name field map for entity field ID D9B2F92D-2F57-4883-AFE3-F85FD01B84EE */
EXEC [${mjSchema}].[spUpdateEntityFieldRelatedEntityNameFieldMap] @EntityFieldID='D9B2F92D-2F57-4883-AFE3-F85FD01B84EE', @RelatedEntityNameFieldMap='Event';

/* SQL text to update entity field related entity name field map for entity field ID C57FE48E-E205-40E7-9970-BDACCEE01103 */
EXEC [${mjSchema}].[spUpdateEntityFieldRelatedEntityNameFieldMap] @EntityFieldID='C57FE48E-E205-40E7-9970-BDACCEE01103', @RelatedEntityNameFieldMap='RelatedOrganization';

/* SQL text to update entity field related entity name field map for entity field ID A7EBB025-4C35-4554-9155-6FDCB8830BDB */
EXEC [${mjSchema}].[spUpdateEntityFieldRelatedEntityNameFieldMap] @EntityFieldID='A7EBB025-4C35-4554-9155-6FDCB8830BDB', @RelatedEntityNameFieldMap='Organization';

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

/* SQL text to update entity field related entity name field map for entity field ID B9124ECF-85E9-4DA9-9E56-85E2E858482E */
EXEC [${mjSchema}].[spUpdateEntityFieldRelatedEntityNameFieldMap] @EntityFieldID='B9124ECF-85E9-4DA9-9E56-85E2E858482E', @RelatedEntityNameFieldMap='Person';

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

/* SQL text to update entity field related entity name field map for entity field ID 0CB6E4EA-182A-487C-9A68-C670386E48A4 */
EXEC [${mjSchema}].[spUpdateEntityFieldRelatedEntityNameFieldMap] @EntityFieldID='0CB6E4EA-182A-487C-9A68-C670386E48A4', @RelatedEntityNameFieldMap='Product';

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

/* SQL text to update entity field related entity name field map for entity field ID FAE8CCEE-F3CF-4E31-B8FD-14B871D95510 */
EXEC [${mjSchema}].[spUpdateEntityFieldRelatedEntityNameFieldMap] @EntityFieldID='FAE8CCEE-F3CF-4E31-B8FD-14B871D95510', @RelatedEntityNameFieldMap='Person';

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

/* SQL text to update entity field related entity name field map for entity field ID 49A30D42-326F-400C-AD58-DD0ED3CB698F */
EXEC [${mjSchema}].[spUpdateEntityFieldRelatedEntityNameFieldMap] @EntityFieldID='49A30D42-326F-400C-AD58-DD0ED3CB698F', @RelatedEntityNameFieldMap='Organization';

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
EXEC [${mjSchema}].[spDeleteUnneededEntityFields] @ExcludedSchemaNames='sys,staging,dbo,${mjSchema},${mjSchema}_UDT,sample_app,AssociationDemo,Bookstore,${mjSchema}_BizAppsCommon,${mjSchema}_BizAppsForms,${mjSchema}_BizAppsTasks,${mjSchema}_BizAppsIssues,${mjSchema}_BizAppsCommittees,${mjSchema}', @EntityIDs='FE8BF319-06BC-4E03-A22A-7864DB37579F,D2D94E6A-E5E0-4BAA-A50B-5479770D2F4E,A186072D-0D8B-497E-8766-9B2F300A6055,594A4CE0-05A6-407A-92AF-4690B557BC6B,8D7A9A85-352E-4BE4-A663-4F930ED61A42,3C5ED337-C9BE-4ECC-9BA4-1BE2A797F0F2,F4D4BA79-C264-45C6-9A51-A00571ABCD6B,1928BDF7-D4EE-4C1B-B36D-CC3B9A4782AC,318E1216-842B-4EF7-8AD5-FCC4FC83E16E,74A95CB4-0407-4A2A-A84E-18FAF120B0D6,56A03017-EBD2-4BC3-A67C-73FDB8C189F4,84685BD4-A229-47C6-A759-71B5DFD410A0,ED525220-B7CB-4BB7-AC3B-92BA3878A6D0,9A39A0A9-A476-4559-AEC4-E826D7410E09,37C1AADD-E111-4604-AD2C-264775B1A076,B718D5BB-DC40-4FAE-BC8F-BCB35247ED0E';

/* SQL text to insert new entity field */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '464ada3e-19cf-4d31-ba64-a8e6edbb9fde' OR (EntityID = '74A95CB4-0407-4A2A-A84E-18FAF120B0D6' AND Name = 'Person')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            '464ada3e-19cf-4d31-ba64-a8e6edbb9fde',
            '74A95CB4-0407-4A2A-A84E-18FAF120B0D6', -- Entity: MoreCheese: Data Quality Labels
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

/* SQL text to insert new entity field */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '3e1de304-0657-417e-ae3c-33423c99b739' OR (EntityID = '74A95CB4-0407-4A2A-A84E-18FAF120B0D6' AND Name = 'RelatedPerson')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            '3e1de304-0657-417e-ae3c-33423c99b739',
            '74A95CB4-0407-4A2A-A84E-18FAF120B0D6', -- Entity: MoreCheese: Data Quality Labels
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

/* SQL text to insert new entity field */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '71a42495-f6e1-4925-989c-c199668f10fe' OR (EntityID = '74A95CB4-0407-4A2A-A84E-18FAF120B0D6' AND Name = 'RelatedOrganization')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            '71a42495-f6e1-4925-989c-c199668f10fe',
            '74A95CB4-0407-4A2A-A84E-18FAF120B0D6', -- Entity: MoreCheese: Data Quality Labels
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

/* SQL text to insert new entity field */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '4600b499-72ae-4c9d-a427-1c9527a43b40' OR (EntityID = '37C1AADD-E111-4604-AD2C-264775B1A076' AND Name = 'Person')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            '4600b499-72ae-4c9d-a427-1c9527a43b40',
            '37C1AADD-E111-4604-AD2C-264775B1A076', -- Entity: MoreCheese: Event Registrations
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

/* SQL text to insert new entity field */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '0096d49c-c4d2-446a-9166-d2a4b4d38e29' OR (EntityID = '37C1AADD-E111-4604-AD2C-264775B1A076' AND Name = 'Event')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            '0096d49c-c4d2-446a-9166-d2a4b4d38e29',
            '37C1AADD-E111-4604-AD2C-264775B1A076', -- Entity: MoreCheese: Event Registrations
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

/* SQL text to insert new entity field */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '2abe49f5-108c-4777-b1d7-c92dfd7f07cf' OR (EntityID = '594A4CE0-05A6-407A-92AF-4690B557BC6B' AND Name = 'Product')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            '2abe49f5-108c-4777-b1d7-c92dfd7f07cf',
            '594A4CE0-05A6-407A-92AF-4690B557BC6B', -- Entity: MoreCheese: Order Lines
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

/* SQL text to insert new entity field */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '48e36d44-e7c1-491d-b2f6-a7afc3d84226' OR (EntityID = '84685BD4-A229-47C6-A759-71B5DFD410A0' AND Name = 'Person')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            '48e36d44-e7c1-491d-b2f6-a7afc3d84226',
            '84685BD4-A229-47C6-A759-71B5DFD410A0', -- Entity: MoreCheese: Member Profiles
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

/* SQL text to insert new entity field */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = 'f050262f-0721-4b01-a295-35e032fa542e' OR (EntityID = '84685BD4-A229-47C6-A759-71B5DFD410A0' AND Name = 'Organization')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            'f050262f-0721-4b01-a295-35e032fa542e',
            '84685BD4-A229-47C6-A759-71B5DFD410A0', -- Entity: MoreCheese: Member Profiles
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

/* SQL text to insert new entity field */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '8a09c3d0-92fb-49db-a259-08569bd14190' OR (EntityID = '56A03017-EBD2-4BC3-A67C-73FDB8C189F4' AND Name = 'Organization')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            '8a09c3d0-92fb-49db-a259-08569bd14190',
            '56A03017-EBD2-4BC3-A67C-73FDB8C189F4', -- Entity: MoreCheese: Organization Profiles
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

/* SQL text to insert new entity field */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '4b8eba6d-68bf-4e2e-9d4b-3061178fe7e4' OR (EntityID = 'FE8BF319-06BC-4E03-A22A-7864DB37579F' AND Name = 'Person')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            '4b8eba6d-68bf-4e2e-9d4b-3061178fe7e4',
            'FE8BF319-06BC-4E03-A22A-7864DB37579F', -- Entity: MoreCheese: Course Enrollments
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

/* SQL text to insert new entity field */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '546c6041-a416-49b5-9ed1-7b16da4a1c0f' OR (EntityID = 'FE8BF319-06BC-4E03-A22A-7864DB37579F' AND Name = 'Course')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            '546c6041-a416-49b5-9ed1-7b16da4a1c0f',
            'FE8BF319-06BC-4E03-A22A-7864DB37579F', -- Entity: MoreCheese: Course Enrollments
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

/* SQL text to insert new entity field */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '0dd06e49-f0d2-4032-a601-4595862b7c55' OR (EntityID = 'ED525220-B7CB-4BB7-AC3B-92BA3878A6D0' AND Name = 'Person')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            '0dd06e49-f0d2-4032-a601-4595862b7c55',
            'ED525220-B7CB-4BB7-AC3B-92BA3878A6D0', -- Entity: MoreCheese: Membership Periods
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

/* SQL text to insert new entity field */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '96ecb11e-fa82-49eb-a576-435720bca106' OR (EntityID = 'A186072D-0D8B-497E-8766-9B2F300A6055' AND Name = 'Person')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            '96ecb11e-fa82-49eb-a576-435720bca106',
            'A186072D-0D8B-497E-8766-9B2F300A6055', -- Entity: MoreCheese: Orders
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

/* SQL text to insert new entity field */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = 'a6c87636-fb0b-4a48-b611-c751e477da8c' OR (EntityID = 'F4D4BA79-C264-45C6-9A51-A00571ABCD6B' AND Name = 'Person')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            'a6c87636-fb0b-4a48-b611-c751e477da8c',
            'F4D4BA79-C264-45C6-9A51-A00571ABCD6B', -- Entity: MoreCheese: Member Certifications
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

/* SQL text to insert new entity field */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '386cf54a-a296-4b2f-8bfc-9db2db40c1b2' OR (EntityID = 'F4D4BA79-C264-45C6-9A51-A00571ABCD6B' AND Name = 'Certification')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            '386cf54a-a296-4b2f-8bfc-9db2db40c1b2',
            'F4D4BA79-C264-45C6-9A51-A00571ABCD6B', -- Entity: MoreCheese: Member Certifications
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

/* SQL text to insert new entity field */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '0032a147-3526-476b-9bd9-abf48594e6c9' OR (EntityID = '1928BDF7-D4EE-4C1B-B36D-CC3B9A4782AC' AND Name = 'Person')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            '0032a147-3526-476b-9bd9-abf48594e6c9',
            '1928BDF7-D4EE-4C1B-B36D-CC3B9A4782AC', -- Entity: MoreCheese: Competition Entries
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

/* SQL text to insert new entity field */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '5a226b01-af88-47f6-881c-a029e2865062' OR (EntityID = '1928BDF7-D4EE-4C1B-B36D-CC3B9A4782AC' AND Name = 'Organization')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            '5a226b01-af88-47f6-881c-a029e2865062',
            '1928BDF7-D4EE-4C1B-B36D-CC3B9A4782AC', -- Entity: MoreCheese: Competition Entries
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

/* SQL text to insert new entity field */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '8f205adf-9d35-4531-af33-d0fc7c1cad75' OR (EntityID = '318E1216-842B-4EF7-8AD5-FCC4FC83E16E' AND Name = 'Person')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            '8f205adf-9d35-4531-af33-d0fc7c1cad75',
            '318E1216-842B-4EF7-8AD5-FCC4FC83E16E', -- Entity: MoreCheese: Advocacy Actions
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

/* SQL text to update existing entity fields from schema (16 scoped entities) */
EXEC [${mjSchema}].[spUpdateExistingEntityFieldsFromSchema] @ExcludedSchemaNames='sys,staging,dbo,${mjSchema},${mjSchema}_UDT,sample_app,AssociationDemo,Bookstore,${mjSchema}_BizAppsCommon,${mjSchema}_BizAppsForms,${mjSchema}_BizAppsTasks,${mjSchema}_BizAppsIssues,${mjSchema}_BizAppsCommittees,${mjSchema}', @EntityIDs='FE8BF319-06BC-4E03-A22A-7864DB37579F,D2D94E6A-E5E0-4BAA-A50B-5479770D2F4E,A186072D-0D8B-497E-8766-9B2F300A6055,594A4CE0-05A6-407A-92AF-4690B557BC6B,8D7A9A85-352E-4BE4-A663-4F930ED61A42,3C5ED337-C9BE-4ECC-9BA4-1BE2A797F0F2,F4D4BA79-C264-45C6-9A51-A00571ABCD6B,1928BDF7-D4EE-4C1B-B36D-CC3B9A4782AC,318E1216-842B-4EF7-8AD5-FCC4FC83E16E,74A95CB4-0407-4A2A-A84E-18FAF120B0D6,56A03017-EBD2-4BC3-A67C-73FDB8C189F4,84685BD4-A229-47C6-A759-71B5DFD410A0,ED525220-B7CB-4BB7-AC3B-92BA3878A6D0,9A39A0A9-A476-4559-AEC4-E826D7410E09,37C1AADD-E111-4604-AD2C-264775B1A076,B718D5BB-DC40-4FAE-BC8F-BCB35247ED0E';

/* SQL text to set default column width where needed */
EXEC [${mjSchema}].[spSetDefaultColumnWidthWhereNeeded] @ExcludedSchemaNames='sys,staging,dbo,${mjSchema},${mjSchema}_UDT,sample_app,AssociationDemo,Bookstore,${mjSchema}_BizAppsCommon,${mjSchema}_BizAppsForms,${mjSchema}_BizAppsTasks,${mjSchema}_BizAppsIssues,${mjSchema}_BizAppsCommittees,${mjSchema}';

