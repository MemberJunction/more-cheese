-- =============================================================================
-- MoreCheese: Member Renewal Signals (v1.4.x)
--
-- Gives the "Member Renewal Risk" Predictive Studio model a real, non-constant label and
-- live engagement features, and a place on the member record to materialize its scores.
--
-- 1. vwMemberRenewalSignals — one row per Member Profile (ID = MemberProfile.ID), computed
--    live from canonical BizApps data. No dependency on Subscriptions or Journal Entries.
--      * RenewalOutcome (the label): 'Lapsed' when the member's most recent confirmed
--        membership-dues order is more than 395 days (one annual term + 30-day grace) older
--        than the dataset's reference date, else 'Renewed'. NULL when the member has never
--        bought a membership (excluded from training, still scored).
--      * ReferenceDate = the latest confirmed membership-dues order date in the database —
--        data-relative rather than GETDATE(), so a generated demo world keeps a stable label
--        no matter when it is installed.
--      * Features are computed AS OF the member's last membership purchase (never after it),
--        so none of them encodes the recency that defines the label.
--    Registered as the read-only virtual entity "MoreCheese: Member Renewal Signals" by
--    CodeGen (VirtualEntities in codegen-schema-info.json); its CodeGen output is appended
--    below.
--
-- 2. MemberProfile.RenewalProbability / RenewalStatus / RenewalScoredAt — where the scoring
--    Record Process writes each member's score back (OutputMapping), so the prediction is
--    materialized on the member record and shown by the prediction panels.
-- =============================================================================

ALTER TABLE [${flyway:defaultSchema}].[MemberProfile] ADD
    [RenewalProbability] DECIMAL(9, 6) NULL,
    [RenewalStatus] NVARCHAR(100) NULL,
    [RenewalScoredAt] DATETIMEOFFSET(7) NULL;
GO

EXEC sp_addextendedproperty @name = N'MS_Description', @value = N'Predicted probability (0-1) that this member renews, written by the Member Renewal Risk scoring process (Predictive Studio).',
    @level0type = N'SCHEMA', @level0name = N'${flyway:defaultSchema}', @level1type = N'TABLE', @level1name = N'MemberProfile', @level2type = N'COLUMN', @level2name = N'RenewalProbability';
EXEC sp_addextendedproperty @name = N'MS_Description', @value = N'Renewal risk band label for the latest prediction (e.g. High / Medium / Low likelihood), written by the Member Renewal Risk scoring process.',
    @level0type = N'SCHEMA', @level0name = N'${flyway:defaultSchema}', @level1type = N'TABLE', @level1name = N'MemberProfile', @level2type = N'COLUMN', @level2name = N'RenewalStatus';
EXEC sp_addextendedproperty @name = N'MS_Description', @value = N'When the renewal prediction on this member was last scored.',
    @level0type = N'SCHEMA', @level0name = N'${flyway:defaultSchema}', @level1type = N'TABLE', @level1name = N'MemberProfile', @level2type = N'COLUMN', @level2name = N'RenewalScoredAt';
GO

CREATE VIEW [${flyway:defaultSchema}].[vwMemberRenewalSignals]
AS
WITH MembershipLine AS (
    SELECT oh.BillToPersonID AS PersonID, oh.OrderDate, ol.LineTotalNet, p.Name AS ProductName
    FROM [${mjSchema}_BizAppsOrders].[OrderLine] ol
    INNER JOIN [${mjSchema}_BizAppsOrders].[OrderHeader] oh ON oh.ID = ol.OrderHeaderID
    INNER JOIN [${mjSchema}_BizAppsOrders].[Product] p ON p.ID = ol.ProductID
    INNER JOIN [${mjSchema}_BizAppsOrders].[ProductType] pt ON pt.ID = p.ProductTypeID
    WHERE pt.Name = 'Membership' AND oh.Status = 'Confirmed' AND oh.BillToPersonID IS NOT NULL
),
MembershipSummary AS (
    SELECT PersonID, MIN(OrderDate) AS FirstMembershipDate, MAX(OrderDate) AS LastMembershipDate, COUNT(*) AS TermsCount
    FROM MembershipLine GROUP BY PersonID
),
LatestTerm AS (
    SELECT PersonID, LineTotalNet, ProductName,
           ROW_NUMBER() OVER (PARTITION BY PersonID ORDER BY OrderDate DESC) AS rn
    FROM MembershipLine
),
Reference AS (
    SELECT MAX(OrderDate) AS AsOfDate FROM MembershipLine
)
SELECT
    mp.ID,
    mp.PersonID,
    ms.LastMembershipDate,
    ref.AsOfDate AS ReferenceDate,
    CASE
        WHEN ms.LastMembershipDate IS NULL THEN NULL
        WHEN DATEDIFF(day, ms.LastMembershipDate, ref.AsOfDate) > 395 THEN 'Lapsed'
        ELSE 'Renewed'
    END AS RenewalOutcome,
    CASE WHEN lt.ProductName LIKE '% Membership%' THEN LEFT(lt.ProductName, CHARINDEX(' Membership', lt.ProductName) - 1) ELSE 'None' END AS MembershipTier,
    ISNULL(mp.Segment, 'Unknown') AS MemberSegment,
    ISNULL(mp.Region, 'Unknown') AS MemberRegion,
    ISNULL(DATEDIFF(day, ms.FirstMembershipDate, ms.LastMembershipDate), 0) AS TenureDays,
    ISNULL(ms.TermsCount, 0) - CASE WHEN ms.TermsCount IS NULL THEN 0 ELSE 1 END AS PriorTermsCount,
    ISNULL(lt.LineTotalNet, 0) AS DuesAmount,
    ISNULL(ord.OrdersCount, 0) AS OrdersCount,
    ISNULL(ord.TotalOrderSpend, 0) AS TotalOrderSpend,
    DATEDIFF(day, ord.LastOrderDate, ms.LastMembershipDate) AS DaysSinceLastOrder,
    ISNULL(evt.EventsAttendedCount, 0) AS EventsAttendedCount,
    DATEDIFF(day, evt.LastEventDate, ms.LastMembershipDate) AS DaysSinceLastEvent,
    ISNULL(crs.CoursesEnrolledCount, 0) AS CoursesEnrolledCount,
    ISNULL(crc.CoursesCompletedCount, 0) AS CoursesCompletedCount
FROM [${flyway:defaultSchema}].[MemberProfile] mp
CROSS JOIN Reference ref
LEFT JOIN MembershipSummary ms ON ms.PersonID = mp.PersonID
LEFT JOIN LatestTerm lt ON lt.PersonID = mp.PersonID AND lt.rn = 1
OUTER APPLY (
    SELECT COUNT(DISTINCT oh.ID) AS OrdersCount, SUM(ol.LineTotalNet) AS TotalOrderSpend, MAX(oh.OrderDate) AS LastOrderDate
    FROM [${mjSchema}_BizAppsOrders].[OrderHeader] oh
    INNER JOIN [${mjSchema}_BizAppsOrders].[OrderLine] ol ON ol.OrderHeaderID = oh.ID
    INNER JOIN [${mjSchema}_BizAppsOrders].[Product] p ON p.ID = ol.ProductID
    INNER JOIN [${mjSchema}_BizAppsOrders].[ProductType] pt ON pt.ID = p.ProductTypeID
    WHERE oh.BillToPersonID = mp.PersonID AND oh.Status = 'Confirmed' AND pt.Name NOT IN ('Membership', 'Event')
      AND oh.OrderDate <= ms.LastMembershipDate
) ord
OUTER APPLY (
    SELECT COUNT(*) AS EventsAttendedCount, MAX(oh.OrderDate) AS LastEventDate
    FROM [${mjSchema}_BizAppsOrders].[EventOrderLine] eol
    INNER JOIN [${mjSchema}_BizAppsOrders].[OrderLine] ol ON ol.ID = eol.ID
    INNER JOIN [${mjSchema}_BizAppsOrders].[OrderHeader] oh ON oh.ID = ol.OrderHeaderID
    WHERE eol.PersonID = mp.PersonID AND eol.AttendanceStatus = 'Attended' AND oh.OrderDate <= ms.LastMembershipDate
) evt
OUTER APPLY (
    SELECT COUNT(*) AS CoursesEnrolledCount
    FROM [morecheese_learning].[CourseEnrollment] ce
    WHERE ce.PersonID = mp.PersonID AND ce.EnrolledOn <= ms.LastMembershipDate
) crs
OUTER APPLY (
    SELECT COUNT(*) AS CoursesCompletedCount
    FROM [morecheese_learning].[CourseEnrollment] ce
    WHERE ce.PersonID = mp.PersonID AND ce.Status = 'Completed' AND ce.CompletedOn <= ms.LastMembershipDate
) crc
GO























































-- =============================================================================
-- CODEGEN OUTPUT — DO NOT EDIT BELOW THIS LINE
-- Generated by `mj codegen` (scoped to the More Cheese schemas) after the DDL above was
-- applied: the virtual entity "MoreCheese: Member Renewal Signals" and its fields, the
-- three new MemberProfile fields, and the regenerated MemberProfile view / procs.
-- =============================================================================
/* SQL text to insert 3 new entity field(s) */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = 'caabd192-5f15-4b9c-8c62-842dcce4e7ee' OR (EntityID = 'BE4D97E0-48DE-4240-A09F-8B39AD4BD043' AND Name = 'RenewalProbability')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            'caabd192-5f15-4b9c-8c62-842dcce4e7ee',
            'BE4D97E0-48DE-4240-A09F-8B39AD4BD043', -- Entity: MoreCheese: Member Profiles
            (SELECT COALESCE(MAX([Sequence]), 0) + 1 FROM [${mjSchema}].[EntityField] WHERE [EntityID] = 'BE4D97E0-48DE-4240-A09F-8B39AD4BD043'),
            'RenewalProbability',
            'Renewal Probability',
            'Predicted probability (0-1) that this member renews, written by the Member Renewal Risk scoring process (Predictive Studio).',
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

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '3589d64a-4a4a-4798-8c66-35619f664530' OR (EntityID = 'BE4D97E0-48DE-4240-A09F-8B39AD4BD043' AND Name = 'RenewalStatus')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            '3589d64a-4a4a-4798-8c66-35619f664530',
            'BE4D97E0-48DE-4240-A09F-8B39AD4BD043', -- Entity: MoreCheese: Member Profiles
            (SELECT COALESCE(MAX([Sequence]), 0) + 1 FROM [${mjSchema}].[EntityField] WHERE [EntityID] = 'BE4D97E0-48DE-4240-A09F-8B39AD4BD043'),
            'RenewalStatus',
            'Renewal Status',
            'Renewal risk band label for the latest prediction (e.g. High / Medium / Low likelihood), written by the Member Renewal Risk scoring process.',
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

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '3649ab28-129a-48d0-9c21-385b430e218a' OR (EntityID = 'BE4D97E0-48DE-4240-A09F-8B39AD4BD043' AND Name = 'RenewalScoredAt')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            '3649ab28-129a-48d0-9c21-385b430e218a',
            'BE4D97E0-48DE-4240-A09F-8B39AD4BD043', -- Entity: MoreCheese: Member Profiles
            (SELECT COALESCE(MAX([Sequence]), 0) + 1 FROM [${mjSchema}].[EntityField] WHERE [EntityID] = 'BE4D97E0-48DE-4240-A09F-8B39AD4BD043'),
            'RenewalScoredAt',
            'Renewal Scored At',
            'When the renewal prediction on this member was last scored.',
            'datetimeoffset',
            10,
            34,
            7,
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

/* Resolve the virtual entity by natural key, so a host whose CodeGen already minted it keeps its own id */
DECLARE @MemberRenewalSignalsEntityID UNIQUEIDENTIFIER = (SELECT TOP 1 [ID] FROM [${mjSchema}].[Entity] WHERE [BaseView] = 'vwMemberRenewalSignals' AND [SchemaName] = '${flyway:defaultSchema}');

/* SQL generated to create new virtual entity MoreCheese: Member Renewal Signals */
IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[Entity] WHERE [BaseView] = 'vwMemberRenewalSignals' AND [SchemaName] = '${flyway:defaultSchema}')
BEGIN
    SET @MemberRenewalSignalsEntityID = '6A375F5D-7580-4592-B577-2A40C2CCD00B';
INSERT INTO [${mjSchema}].[Entity] (
         [ID], [Name], [Description], [BaseTable], [BaseView], [SchemaName],
         [VirtualEntity], [IncludeInAPI], [AllowCreateAPI], [AllowUpdateAPI], [AllowDeleteAPI],
         [AllowRecordMerge], [TrackRecordChanges], [__mj_CreatedAt], [__mj_UpdatedAt]
      ) VALUES (
         @MemberRenewalSignalsEntityID, 'MoreCheese: Member Renewal Signals', 'Read-only, live per-member renewal signals (label + engagement features as of the last membership purchase) computed from canonical Orders, Event Order Lines and Course Enrollments. One row per Member Profile; ID = MemberProfile.ID. The training source for the Member Renewal Risk Predictive Studio pipeline.', 'vwMemberRenewalSignals', 'vwMemberRenewalSignals', '${flyway:defaultSchema}',
         1, 1, 0, 0, 0,
         0, 0, GETUTCDATE(), GETUTCDATE()
      );
END;

/* SQL generated to seed primary key field ID for virtual entity MoreCheese: Member Renewal Signals */
IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE [EntityID] = @MemberRenewalSignalsEntityID AND [Name] = 'ID')
BEGIN
INSERT INTO [${mjSchema}].[EntityField] (
         [ID], [EntityID], [Sequence], [Name], [IsPrimaryKey], [IsUnique], [Type],
         [__mj_CreatedAt], [__mj_UpdatedAt]
      ) VALUES (
         CAST('e1b4a66b-2c10-4006-a53d-bbd1b642fb15' AS uniqueidentifier), @MemberRenewalSignalsEntityID, (SELECT COALESCE(MAX([Sequence]), 0) + 1 FROM [${mjSchema}].[EntityField] WHERE [EntityID] = @MemberRenewalSignalsEntityID), 'ID',
         1, 1, 'int', GETUTCDATE(), GETUTCDATE()
      );
END;

/* SQL generated to add entity MoreCheese: Member Renewal Signals to application ID: '3C46B3A5-34FB-51EA-B54D-77E9F104ABAF' */
IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[ApplicationEntity] WHERE [ApplicationID] = '3C46B3A5-34FB-51EA-B54D-77E9F104ABAF' AND [EntityID] = @MemberRenewalSignalsEntityID)
BEGIN
INSERT INTO [${mjSchema}].[ApplicationEntity]
                                    ([ApplicationID], [EntityID], [Sequence], [__mj_CreatedAt], [__mj_UpdatedAt]) VALUES
                                    ('3C46B3A5-34FB-51EA-B54D-77E9F104ABAF', @MemberRenewalSignalsEntityID, (SELECT COALESCE(MAX([Sequence]),0)+1 FROM [${mjSchema}].[ApplicationEntity] WHERE [ApplicationID] = '3C46B3A5-34FB-51EA-B54D-77E9F104ABAF'), GETUTCDATE(), GETUTCDATE());
END;

/* SQL generated to add permission for entity MoreCheese: Member Renewal Signals for role UI */
IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityPermission] WHERE [EntityID] = @MemberRenewalSignalsEntityID AND [RoleID] = 'E0AFCCEC-6A37-EF11-86D4-000D3A4E707E' AND [Type] = 'Allow')
BEGIN
INSERT INTO [${mjSchema}].[EntityPermission]
                ([EntityID], [RoleID], [Type], [CanRead], [CanCreate], [CanUpdate], [CanDelete], [__mj_CreatedAt], [__mj_UpdatedAt])
              SELECT @MemberRenewalSignalsEntityID, CAST('E0AFCCEC-6A37-EF11-86D4-000D3A4E707E' AS uniqueidentifier), 'Allow', 1, 0, 0, 0, GETUTCDATE(), GETUTCDATE()
              WHERE NOT EXISTS (
                SELECT 1 FROM [${mjSchema}].[EntityPermission]
                WHERE [EntityID] = @MemberRenewalSignalsEntityID AND [RoleID] = CAST('E0AFCCEC-6A37-EF11-86D4-000D3A4E707E' AS uniqueidentifier) AND [Type] = 'Allow'
              );
END;

/* SQL generated to add permission for entity MoreCheese: Member Renewal Signals for role Developer */
IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityPermission] WHERE [EntityID] = @MemberRenewalSignalsEntityID AND [RoleID] = 'DEAFCCEC-6A37-EF11-86D4-000D3A4E707E' AND [Type] = 'Allow')
BEGIN
INSERT INTO [${mjSchema}].[EntityPermission]
                ([EntityID], [RoleID], [Type], [CanRead], [CanCreate], [CanUpdate], [CanDelete], [__mj_CreatedAt], [__mj_UpdatedAt])
              SELECT @MemberRenewalSignalsEntityID, CAST('DEAFCCEC-6A37-EF11-86D4-000D3A4E707E' AS uniqueidentifier), 'Allow', 1, 1, 1, 1, GETUTCDATE(), GETUTCDATE()
              WHERE NOT EXISTS (
                SELECT 1 FROM [${mjSchema}].[EntityPermission]
                WHERE [EntityID] = @MemberRenewalSignalsEntityID AND [RoleID] = CAST('DEAFCCEC-6A37-EF11-86D4-000D3A4E707E' AS uniqueidentifier) AND [Type] = 'Allow'
              );
END;

/* SQL generated to add permission for entity MoreCheese: Member Renewal Signals for role Integration */
IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityPermission] WHERE [EntityID] = @MemberRenewalSignalsEntityID AND [RoleID] = 'DFAFCCEC-6A37-EF11-86D4-000D3A4E707E' AND [Type] = 'Allow')
BEGIN
INSERT INTO [${mjSchema}].[EntityPermission]
                ([EntityID], [RoleID], [Type], [CanRead], [CanCreate], [CanUpdate], [CanDelete], [__mj_CreatedAt], [__mj_UpdatedAt])
              SELECT @MemberRenewalSignalsEntityID, CAST('DFAFCCEC-6A37-EF11-86D4-000D3A4E707E' AS uniqueidentifier), 'Allow', 1, 1, 1, 1, GETUTCDATE(), GETUTCDATE()
              WHERE NOT EXISTS (
                SELECT 1 FROM [${mjSchema}].[EntityPermission]
                WHERE [EntityID] = @MemberRenewalSignalsEntityID AND [RoleID] = CAST('DFAFCCEC-6A37-EF11-86D4-000D3A4E707E' AS uniqueidentifier) AND [Type] = 'Allow'
              );
END;

/* SQL text to update virtual entity field ID for entity MoreCheese: Member Renewal Signals */
UPDATE
                                    [${mjSchema}].[EntityField]
                                  SET
                                    
                                    Sequence=1,
                                    Type='uniqueidentifier',
                                    AllowsNull=0,
                                    
                                    Length=16,
                                    Precision=0,
                                    Scale=0
                                  WHERE
                                    ID = 'E1B4A66B-2C10-4006-A53D-BBD1B642FB15';

/* SQL text to add virtual entity field PersonID for entity MoreCheese: Member Renewal Signals */
IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE [EntityID] = @MemberRenewalSignalsEntityID AND [Name] = 'PersonID')
BEGIN
INSERT INTO [${mjSchema}].[EntityField] (
                                      [ID], [EntityID], [Name], [Type], [AllowsNull],
                                      [Length], [Precision], [Scale],
                                      [Sequence], [IsPrimaryKey], [IsUnique],
                                      [__mj_CreatedAt], [__mj_UpdatedAt] )
                            VALUES (  '912659c9-d444-4994-8213-968fbcccde01', @MemberRenewalSignalsEntityID, 'PersonID', 'uniqueidentifier', 0,
                                       16, 0, 0,
                                       (SELECT COALESCE(MAX([Sequence]), 0) + 1 FROM [${mjSchema}].[EntityField] WHERE [EntityID] = @MemberRenewalSignalsEntityID), 0, 0,
                                       GETUTCDATE(), GETUTCDATE()
                                    );
END;

/* SQL text to add virtual entity field LastMembershipDate for entity MoreCheese: Member Renewal Signals */
IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE [EntityID] = @MemberRenewalSignalsEntityID AND [Name] = 'LastMembershipDate')
BEGIN
INSERT INTO [${mjSchema}].[EntityField] (
                                      [ID], [EntityID], [Name], [Type], [AllowsNull],
                                      [Length], [Precision], [Scale],
                                      [Sequence], [IsPrimaryKey], [IsUnique],
                                      [__mj_CreatedAt], [__mj_UpdatedAt] )
                            VALUES (  '050ba72b-01a8-41df-9151-28083c29b081', @MemberRenewalSignalsEntityID, 'LastMembershipDate', 'date', 1,
                                       3, 10, 0,
                                       (SELECT COALESCE(MAX([Sequence]), 0) + 1 FROM [${mjSchema}].[EntityField] WHERE [EntityID] = @MemberRenewalSignalsEntityID), 0, 0,
                                       GETUTCDATE(), GETUTCDATE()
                                    );
END;

/* SQL text to add virtual entity field ReferenceDate for entity MoreCheese: Member Renewal Signals */
IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE [EntityID] = @MemberRenewalSignalsEntityID AND [Name] = 'ReferenceDate')
BEGIN
INSERT INTO [${mjSchema}].[EntityField] (
                                      [ID], [EntityID], [Name], [Type], [AllowsNull],
                                      [Length], [Precision], [Scale],
                                      [Sequence], [IsPrimaryKey], [IsUnique],
                                      [__mj_CreatedAt], [__mj_UpdatedAt] )
                            VALUES (  '525709bf-745d-45d5-9f38-290ad07955cb', @MemberRenewalSignalsEntityID, 'ReferenceDate', 'date', 1,
                                       3, 10, 0,
                                       (SELECT COALESCE(MAX([Sequence]), 0) + 1 FROM [${mjSchema}].[EntityField] WHERE [EntityID] = @MemberRenewalSignalsEntityID), 0, 0,
                                       GETUTCDATE(), GETUTCDATE()
                                    );
END;

/* SQL text to add virtual entity field RenewalOutcome for entity MoreCheese: Member Renewal Signals */
IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE [EntityID] = @MemberRenewalSignalsEntityID AND [Name] = 'RenewalOutcome')
BEGIN
INSERT INTO [${mjSchema}].[EntityField] (
                                      [ID], [EntityID], [Name], [Type], [AllowsNull],
                                      [Length], [Precision], [Scale],
                                      [Sequence], [IsPrimaryKey], [IsUnique],
                                      [__mj_CreatedAt], [__mj_UpdatedAt] )
                            VALUES (  '0eebdd44-3355-4318-91a6-2572947426d4', @MemberRenewalSignalsEntityID, 'RenewalOutcome', 'varchar', 1,
                                       7, 0, 0,
                                       (SELECT COALESCE(MAX([Sequence]), 0) + 1 FROM [${mjSchema}].[EntityField] WHERE [EntityID] = @MemberRenewalSignalsEntityID), 0, 0,
                                       GETUTCDATE(), GETUTCDATE()
                                    );
END;

/* SQL text to add virtual entity field MembershipTier for entity MoreCheese: Member Renewal Signals */
IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE [EntityID] = @MemberRenewalSignalsEntityID AND [Name] = 'MembershipTier')
BEGIN
INSERT INTO [${mjSchema}].[EntityField] (
                                      [ID], [EntityID], [Name], [Type], [AllowsNull],
                                      [Length], [Precision], [Scale],
                                      [Sequence], [IsPrimaryKey], [IsUnique],
                                      [__mj_CreatedAt], [__mj_UpdatedAt] )
                            VALUES (  'b119e353-6967-4a34-91ed-9700a1b7be2e', @MemberRenewalSignalsEntityID, 'MembershipTier', 'nvarchar', 1,
                                       400, 0, 0,
                                       (SELECT COALESCE(MAX([Sequence]), 0) + 1 FROM [${mjSchema}].[EntityField] WHERE [EntityID] = @MemberRenewalSignalsEntityID), 0, 0,
                                       GETUTCDATE(), GETUTCDATE()
                                    );
END;

/* SQL text to add virtual entity field MemberSegment for entity MoreCheese: Member Renewal Signals */
IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE [EntityID] = @MemberRenewalSignalsEntityID AND [Name] = 'MemberSegment')
BEGIN
INSERT INTO [${mjSchema}].[EntityField] (
                                      [ID], [EntityID], [Name], [Type], [AllowsNull],
                                      [Length], [Precision], [Scale],
                                      [Sequence], [IsPrimaryKey], [IsUnique],
                                      [__mj_CreatedAt], [__mj_UpdatedAt] )
                            VALUES (  '1184053f-b618-4b8b-b529-c22b775c24f1', @MemberRenewalSignalsEntityID, 'MemberSegment', 'nvarchar', 0,
                                       100, 0, 0,
                                       (SELECT COALESCE(MAX([Sequence]), 0) + 1 FROM [${mjSchema}].[EntityField] WHERE [EntityID] = @MemberRenewalSignalsEntityID), 0, 0,
                                       GETUTCDATE(), GETUTCDATE()
                                    );
END;

/* SQL text to add virtual entity field MemberRegion for entity MoreCheese: Member Renewal Signals */
IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE [EntityID] = @MemberRenewalSignalsEntityID AND [Name] = 'MemberRegion')
BEGIN
INSERT INTO [${mjSchema}].[EntityField] (
                                      [ID], [EntityID], [Name], [Type], [AllowsNull],
                                      [Length], [Precision], [Scale],
                                      [Sequence], [IsPrimaryKey], [IsUnique],
                                      [__mj_CreatedAt], [__mj_UpdatedAt] )
                            VALUES (  '1946e424-fcc3-4948-aec2-335e22586aa4', @MemberRenewalSignalsEntityID, 'MemberRegion', 'nvarchar', 0,
                                       100, 0, 0,
                                       (SELECT COALESCE(MAX([Sequence]), 0) + 1 FROM [${mjSchema}].[EntityField] WHERE [EntityID] = @MemberRenewalSignalsEntityID), 0, 0,
                                       GETUTCDATE(), GETUTCDATE()
                                    );
END;

/* SQL text to add virtual entity field TenureDays for entity MoreCheese: Member Renewal Signals */
IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE [EntityID] = @MemberRenewalSignalsEntityID AND [Name] = 'TenureDays')
BEGIN
INSERT INTO [${mjSchema}].[EntityField] (
                                      [ID], [EntityID], [Name], [Type], [AllowsNull],
                                      [Length], [Precision], [Scale],
                                      [Sequence], [IsPrimaryKey], [IsUnique],
                                      [__mj_CreatedAt], [__mj_UpdatedAt] )
                            VALUES (  'd49e7fab-38a1-4518-831c-daac47b73ab3', @MemberRenewalSignalsEntityID, 'TenureDays', 'int', 0,
                                       4, 10, 0,
                                       (SELECT COALESCE(MAX([Sequence]), 0) + 1 FROM [${mjSchema}].[EntityField] WHERE [EntityID] = @MemberRenewalSignalsEntityID), 0, 0,
                                       GETUTCDATE(), GETUTCDATE()
                                    );
END;

/* SQL text to add virtual entity field PriorTermsCount for entity MoreCheese: Member Renewal Signals */
IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE [EntityID] = @MemberRenewalSignalsEntityID AND [Name] = 'PriorTermsCount')
BEGIN
INSERT INTO [${mjSchema}].[EntityField] (
                                      [ID], [EntityID], [Name], [Type], [AllowsNull],
                                      [Length], [Precision], [Scale],
                                      [Sequence], [IsPrimaryKey], [IsUnique],
                                      [__mj_CreatedAt], [__mj_UpdatedAt] )
                            VALUES (  'ee1bf13f-fc24-4901-a1b4-c106ece5dbb7', @MemberRenewalSignalsEntityID, 'PriorTermsCount', 'int', 1,
                                       4, 10, 0,
                                       (SELECT COALESCE(MAX([Sequence]), 0) + 1 FROM [${mjSchema}].[EntityField] WHERE [EntityID] = @MemberRenewalSignalsEntityID), 0, 0,
                                       GETUTCDATE(), GETUTCDATE()
                                    );
END;

/* SQL text to add virtual entity field DuesAmount for entity MoreCheese: Member Renewal Signals */
IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE [EntityID] = @MemberRenewalSignalsEntityID AND [Name] = 'DuesAmount')
BEGIN
INSERT INTO [${mjSchema}].[EntityField] (
                                      [ID], [EntityID], [Name], [Type], [AllowsNull],
                                      [Length], [Precision], [Scale],
                                      [Sequence], [IsPrimaryKey], [IsUnique],
                                      [__mj_CreatedAt], [__mj_UpdatedAt] )
                            VALUES (  '668adeeb-621d-4f5d-baed-a6d111c71984', @MemberRenewalSignalsEntityID, 'DuesAmount', 'decimal', 0,
                                       9, 18, 2,
                                       (SELECT COALESCE(MAX([Sequence]), 0) + 1 FROM [${mjSchema}].[EntityField] WHERE [EntityID] = @MemberRenewalSignalsEntityID), 0, 0,
                                       GETUTCDATE(), GETUTCDATE()
                                    );
END;

/* SQL text to add virtual entity field OrdersCount for entity MoreCheese: Member Renewal Signals */
IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE [EntityID] = @MemberRenewalSignalsEntityID AND [Name] = 'OrdersCount')
BEGIN
INSERT INTO [${mjSchema}].[EntityField] (
                                      [ID], [EntityID], [Name], [Type], [AllowsNull],
                                      [Length], [Precision], [Scale],
                                      [Sequence], [IsPrimaryKey], [IsUnique],
                                      [__mj_CreatedAt], [__mj_UpdatedAt] )
                            VALUES (  'bf14cff9-ad66-4f43-9b1d-2cb38b21830d', @MemberRenewalSignalsEntityID, 'OrdersCount', 'int', 0,
                                       4, 10, 0,
                                       (SELECT COALESCE(MAX([Sequence]), 0) + 1 FROM [${mjSchema}].[EntityField] WHERE [EntityID] = @MemberRenewalSignalsEntityID), 0, 0,
                                       GETUTCDATE(), GETUTCDATE()
                                    );
END;

/* SQL text to add virtual entity field TotalOrderSpend for entity MoreCheese: Member Renewal Signals */
IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE [EntityID] = @MemberRenewalSignalsEntityID AND [Name] = 'TotalOrderSpend')
BEGIN
INSERT INTO [${mjSchema}].[EntityField] (
                                      [ID], [EntityID], [Name], [Type], [AllowsNull],
                                      [Length], [Precision], [Scale],
                                      [Sequence], [IsPrimaryKey], [IsUnique],
                                      [__mj_CreatedAt], [__mj_UpdatedAt] )
                            VALUES (  '6bb72571-86cd-4a8e-9ff6-10f7b4e3d08a', @MemberRenewalSignalsEntityID, 'TotalOrderSpend', 'decimal', 0,
                                       17, 38, 2,
                                       (SELECT COALESCE(MAX([Sequence]), 0) + 1 FROM [${mjSchema}].[EntityField] WHERE [EntityID] = @MemberRenewalSignalsEntityID), 0, 0,
                                       GETUTCDATE(), GETUTCDATE()
                                    );
END;

/* SQL text to add virtual entity field DaysSinceLastOrder for entity MoreCheese: Member Renewal Signals */
IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE [EntityID] = @MemberRenewalSignalsEntityID AND [Name] = 'DaysSinceLastOrder')
BEGIN
INSERT INTO [${mjSchema}].[EntityField] (
                                      [ID], [EntityID], [Name], [Type], [AllowsNull],
                                      [Length], [Precision], [Scale],
                                      [Sequence], [IsPrimaryKey], [IsUnique],
                                      [__mj_CreatedAt], [__mj_UpdatedAt] )
                            VALUES (  '8f28f169-e250-4a78-9554-492c054c2ba9', @MemberRenewalSignalsEntityID, 'DaysSinceLastOrder', 'int', 1,
                                       4, 10, 0,
                                       (SELECT COALESCE(MAX([Sequence]), 0) + 1 FROM [${mjSchema}].[EntityField] WHERE [EntityID] = @MemberRenewalSignalsEntityID), 0, 0,
                                       GETUTCDATE(), GETUTCDATE()
                                    );
END;

/* SQL text to add virtual entity field EventsAttendedCount for entity MoreCheese: Member Renewal Signals */
IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE [EntityID] = @MemberRenewalSignalsEntityID AND [Name] = 'EventsAttendedCount')
BEGIN
INSERT INTO [${mjSchema}].[EntityField] (
                                      [ID], [EntityID], [Name], [Type], [AllowsNull],
                                      [Length], [Precision], [Scale],
                                      [Sequence], [IsPrimaryKey], [IsUnique],
                                      [__mj_CreatedAt], [__mj_UpdatedAt] )
                            VALUES (  '40df5295-035c-4961-9285-a5bebd92a742', @MemberRenewalSignalsEntityID, 'EventsAttendedCount', 'int', 0,
                                       4, 10, 0,
                                       (SELECT COALESCE(MAX([Sequence]), 0) + 1 FROM [${mjSchema}].[EntityField] WHERE [EntityID] = @MemberRenewalSignalsEntityID), 0, 0,
                                       GETUTCDATE(), GETUTCDATE()
                                    );
END;

/* SQL text to add virtual entity field DaysSinceLastEvent for entity MoreCheese: Member Renewal Signals */
IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE [EntityID] = @MemberRenewalSignalsEntityID AND [Name] = 'DaysSinceLastEvent')
BEGIN
INSERT INTO [${mjSchema}].[EntityField] (
                                      [ID], [EntityID], [Name], [Type], [AllowsNull],
                                      [Length], [Precision], [Scale],
                                      [Sequence], [IsPrimaryKey], [IsUnique],
                                      [__mj_CreatedAt], [__mj_UpdatedAt] )
                            VALUES (  '348e50e9-f784-4f57-a65f-2c5472b56f6b', @MemberRenewalSignalsEntityID, 'DaysSinceLastEvent', 'int', 1,
                                       4, 10, 0,
                                       (SELECT COALESCE(MAX([Sequence]), 0) + 1 FROM [${mjSchema}].[EntityField] WHERE [EntityID] = @MemberRenewalSignalsEntityID), 0, 0,
                                       GETUTCDATE(), GETUTCDATE()
                                    );
END;

/* SQL text to add virtual entity field CoursesEnrolledCount for entity MoreCheese: Member Renewal Signals */
IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE [EntityID] = @MemberRenewalSignalsEntityID AND [Name] = 'CoursesEnrolledCount')
BEGIN
INSERT INTO [${mjSchema}].[EntityField] (
                                      [ID], [EntityID], [Name], [Type], [AllowsNull],
                                      [Length], [Precision], [Scale],
                                      [Sequence], [IsPrimaryKey], [IsUnique],
                                      [__mj_CreatedAt], [__mj_UpdatedAt] )
                            VALUES (  '77b37d46-cf0e-4e40-8cf7-3d576ccb59f0', @MemberRenewalSignalsEntityID, 'CoursesEnrolledCount', 'int', 0,
                                       4, 10, 0,
                                       (SELECT COALESCE(MAX([Sequence]), 0) + 1 FROM [${mjSchema}].[EntityField] WHERE [EntityID] = @MemberRenewalSignalsEntityID), 0, 0,
                                       GETUTCDATE(), GETUTCDATE()
                                    );
END;

/* SQL text to add virtual entity field CoursesCompletedCount for entity MoreCheese: Member Renewal Signals */
IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE [EntityID] = @MemberRenewalSignalsEntityID AND [Name] = 'CoursesCompletedCount')
BEGIN
INSERT INTO [${mjSchema}].[EntityField] (
                                      [ID], [EntityID], [Name], [Type], [AllowsNull],
                                      [Length], [Precision], [Scale],
                                      [Sequence], [IsPrimaryKey], [IsUnique],
                                      [__mj_CreatedAt], [__mj_UpdatedAt] )
                            VALUES (  'd9cfaee4-637a-4c06-ab49-b385ef4dc7bb', @MemberRenewalSignalsEntityID, 'CoursesCompletedCount', 'int', 0,
                                       4, 10, 0,
                                       (SELECT COALESCE(MAX([Sequence]), 0) + 1 FROM [${mjSchema}].[EntityField] WHERE [EntityID] = @MemberRenewalSignalsEntityID), 0, 0,
                                       GETUTCDATE(), GETUTCDATE()
                                    );
END;

/* SQL text to update virtual entity updated date for MoreCheese: Member Renewal Signals */
UPDATE [${mjSchema}].[Entity] SET [__mj_UpdatedAt]=GETUTCDATE() WHERE ID=@MemberRenewalSignalsEntityID;

/* Set soft PK for ${flyway:defaultSchema}.vwMemberRenewalSignals.ID */
UPDATE [${mjSchema}].[EntityField]
                       SET [__mj_UpdatedAt]=GETUTCDATE(),
                           [IsPrimaryKey] = 1,
                           [IsSoftPrimaryKey] = 1
                       WHERE [EntityID] = @MemberRenewalSignalsEntityID AND [Name] = 'ID';

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
REVOKE SELECT ON [${flyway:defaultSchema}].[vwMemberProfiles] FROM [cdp_Developer]
REVOKE SELECT ON [${flyway:defaultSchema}].[vwMemberProfiles] FROM [cdp_Integration]
REVOKE SELECT ON [${flyway:defaultSchema}].[vwMemberProfiles] FROM [cdp_UI]
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

REVOKE SELECT ON [${flyway:defaultSchema}].[vwMemberProfiles] FROM [cdp_Developer]
REVOKE SELECT ON [${flyway:defaultSchema}].[vwMemberProfiles] FROM [cdp_Integration]
REVOKE SELECT ON [${flyway:defaultSchema}].[vwMemberProfiles] FROM [cdp_UI]
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
    @IsSharedDemo bit = NULL,
    @RenewalProbability_Clear bit = 0,
    @RenewalProbability decimal(9, 6) = NULL,
    @RenewalStatus_Clear bit = 0,
    @RenewalStatus nvarchar(100) = NULL,
    @RenewalScoredAt_Clear bit = 0,
    @RenewalScoredAt datetimeoffset = NULL
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
                [IsSharedDemo],
                [RenewalProbability],
                [RenewalStatus],
                [RenewalScoredAt]
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
                ISNULL(@IsSharedDemo, 1),
                CASE WHEN @RenewalProbability_Clear = 1 THEN NULL ELSE ISNULL(@RenewalProbability, NULL) END,
                CASE WHEN @RenewalStatus_Clear = 1 THEN NULL ELSE ISNULL(@RenewalStatus, NULL) END,
                CASE WHEN @RenewalScoredAt_Clear = 1 THEN NULL ELSE ISNULL(@RenewalScoredAt, NULL) END
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
                [IsSharedDemo],
                [RenewalProbability],
                [RenewalStatus],
                [RenewalScoredAt]
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
                ISNULL(@IsSharedDemo, 1),
                CASE WHEN @RenewalProbability_Clear = 1 THEN NULL ELSE ISNULL(@RenewalProbability, NULL) END,
                CASE WHEN @RenewalStatus_Clear = 1 THEN NULL ELSE ISNULL(@RenewalStatus, NULL) END,
                CASE WHEN @RenewalScoredAt_Clear = 1 THEN NULL ELSE ISNULL(@RenewalScoredAt, NULL) END
            )
    END
    -- return the new record from the base view, which might have some calculated fields
    SELECT * FROM [${flyway:defaultSchema}].[vwMemberProfiles] WHERE [ID] = (SELECT [ID] FROM @InsertedRow)
END
GO
REVOKE EXECUTE ON [${flyway:defaultSchema}].[spCreateMemberProfile] FROM [cdp_Developer]
REVOKE EXECUTE ON [${flyway:defaultSchema}].[spCreateMemberProfile] FROM [cdp_Integration]
GRANT EXECUTE ON [${flyway:defaultSchema}].[spCreateMemberProfile] TO [cdp_Developer], [cdp_Integration];

/* spCreate Permissions for MoreCheese: Member Profiles */

REVOKE EXECUTE ON [${flyway:defaultSchema}].[spCreateMemberProfile] FROM [cdp_Developer]
REVOKE EXECUTE ON [${flyway:defaultSchema}].[spCreateMemberProfile] FROM [cdp_Integration]
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
    @IsSharedDemo bit = NULL,
    @RenewalProbability_Clear bit = 0,
    @RenewalProbability decimal(9, 6) = NULL,
    @RenewalStatus_Clear bit = 0,
    @RenewalStatus nvarchar(100) = NULL,
    @RenewalScoredAt_Clear bit = 0,
    @RenewalScoredAt datetimeoffset = NULL
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
        [IsSharedDemo] = ISNULL(@IsSharedDemo, [IsSharedDemo]),
        [RenewalProbability] = CASE WHEN @RenewalProbability_Clear = 1 THEN NULL ELSE ISNULL(@RenewalProbability, [RenewalProbability]) END,
        [RenewalStatus] = CASE WHEN @RenewalStatus_Clear = 1 THEN NULL ELSE ISNULL(@RenewalStatus, [RenewalStatus]) END,
        [RenewalScoredAt] = CASE WHEN @RenewalScoredAt_Clear = 1 THEN NULL ELSE ISNULL(@RenewalScoredAt, [RenewalScoredAt]) END
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

REVOKE EXECUTE ON [${flyway:defaultSchema}].[spUpdateMemberProfile] FROM [cdp_Developer]
REVOKE EXECUTE ON [${flyway:defaultSchema}].[spUpdateMemberProfile] FROM [cdp_Integration]
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

REVOKE EXECUTE ON [${flyway:defaultSchema}].[spUpdateMemberProfile] FROM [cdp_Developer]
REVOKE EXECUTE ON [${flyway:defaultSchema}].[spUpdateMemberProfile] FROM [cdp_Integration]
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
REVOKE EXECUTE ON [${flyway:defaultSchema}].[spDeleteMemberProfile] FROM [cdp_Developer]
REVOKE EXECUTE ON [${flyway:defaultSchema}].[spDeleteMemberProfile] FROM [cdp_Integration]
GRANT EXECUTE ON [${flyway:defaultSchema}].[spDeleteMemberProfile] TO [cdp_Developer], [cdp_Integration];

/* spDelete Permissions for MoreCheese: Member Profiles */

REVOKE EXECUTE ON [${flyway:defaultSchema}].[spDeleteMemberProfile] FROM [cdp_Developer]
REVOKE EXECUTE ON [${flyway:defaultSchema}].[spDeleteMemberProfile] FROM [cdp_Integration]
GRANT EXECUTE ON [${flyway:defaultSchema}].[spDeleteMemberProfile] TO [cdp_Developer], [cdp_Integration];

/* Base View Permissions SQL for MoreCheese: Member Renewal Signals */
-----------------------------------------------------------------
-- SQL Code Generation
-- Entity: MoreCheese: Member Renewal Signals
-- Item: Permissions for vwMemberRenewalSignals
--
-- This was generated by the MemberJunction CodeGen tool.
-- This file should NOT be edited by hand.
-----------------------------------------------------------------

GRANT SELECT ON [${flyway:defaultSchema}].[vwMemberRenewalSignals] TO [cdp_UI], [cdp_Developer], [cdp_Integration];

/* SQL text to update display name for field TotalOrderSpend */
UPDATE [${mjSchema}].[EntityField] SET [__mj_UpdatedAt]=GETUTCDATE(), DisplayName = 'Total Order Spend' WHERE ID = '6BB72571-86CD-4A8E-9FF6-10F7B4E3D08A';

/* SQL text to update display name for field RenewalOutcome */
UPDATE [${mjSchema}].[EntityField] SET [__mj_UpdatedAt]=GETUTCDATE(), DisplayName = 'Renewal Outcome' WHERE ID = '0EEBDD44-3355-4318-91A6-2572947426D4';

/* SQL text to update display name for field LastMembershipDate */
UPDATE [${mjSchema}].[EntityField] SET [__mj_UpdatedAt]=GETUTCDATE(), DisplayName = 'Last Membership Date' WHERE ID = '050BA72B-01A8-41DF-9151-28083C29B081';

/* SQL text to update display name for field ReferenceDate */
UPDATE [${mjSchema}].[EntityField] SET [__mj_UpdatedAt]=GETUTCDATE(), DisplayName = 'Reference Date' WHERE ID = '525709BF-745D-45D5-9F38-290AD07955CB';

/* SQL text to update display name for field DaysSinceLastEvent */
UPDATE [${mjSchema}].[EntityField] SET [__mj_UpdatedAt]=GETUTCDATE(), DisplayName = 'Days Since Last Event' WHERE ID = '348E50E9-F784-4F57-A65F-2C5472B56F6B';

/* SQL text to update display name for field OrdersCount */
UPDATE [${mjSchema}].[EntityField] SET [__mj_UpdatedAt]=GETUTCDATE(), DisplayName = 'Orders Count' WHERE ID = 'BF14CFF9-AD66-4F43-9B1D-2CB38B21830D';

/* SQL text to update display name for field MemberRegion */
UPDATE [${mjSchema}].[EntityField] SET [__mj_UpdatedAt]=GETUTCDATE(), DisplayName = 'Member Region' WHERE ID = '1946E424-FCC3-4948-AEC2-335E22586AA4';

/* SQL text to update display name for field CoursesEnrolledCount */
UPDATE [${mjSchema}].[EntityField] SET [__mj_UpdatedAt]=GETUTCDATE(), DisplayName = 'Courses Enrolled Count' WHERE ID = '77B37D46-CF0E-4E40-8CF7-3D576CCB59F0';

/* SQL text to update display name for field DaysSinceLastOrder */
UPDATE [${mjSchema}].[EntityField] SET [__mj_UpdatedAt]=GETUTCDATE(), DisplayName = 'Days Since Last Order' WHERE ID = '8F28F169-E250-4A78-9554-492C054C2BA9';

/* SQL text to update display name for field PersonID */
UPDATE [${mjSchema}].[EntityField] SET [__mj_UpdatedAt]=GETUTCDATE(), DisplayName = 'Person' WHERE ID = '912659C9-D444-4994-8213-968FBCCCDE01';

/* SQL text to update display name for field MembershipTier */
UPDATE [${mjSchema}].[EntityField] SET [__mj_UpdatedAt]=GETUTCDATE(), DisplayName = 'Membership Tier' WHERE ID = 'B119E353-6967-4A34-91ED-9700A1B7BE2E';

/* SQL text to update display name for field EventsAttendedCount */
UPDATE [${mjSchema}].[EntityField] SET [__mj_UpdatedAt]=GETUTCDATE(), DisplayName = 'Events Attended Count' WHERE ID = '40DF5295-035C-4961-9285-A5BEBD92A742';

/* SQL text to update display name for field DuesAmount */
UPDATE [${mjSchema}].[EntityField] SET [__mj_UpdatedAt]=GETUTCDATE(), DisplayName = 'Dues Amount' WHERE ID = '668ADEEB-621D-4F5D-BAED-A6D111C71984';

/* SQL text to update display name for field CoursesCompletedCount */
UPDATE [${mjSchema}].[EntityField] SET [__mj_UpdatedAt]=GETUTCDATE(), DisplayName = 'Courses Completed Count' WHERE ID = 'D9CFAEE4-637A-4C06-AB49-B385EF4DC7BB';

/* SQL text to update display name for field PriorTermsCount */
UPDATE [${mjSchema}].[EntityField] SET [__mj_UpdatedAt]=GETUTCDATE(), DisplayName = 'Prior Terms Count' WHERE ID = 'EE1BF13F-FC24-4901-A1B4-C106ECE5DBB7';

/* SQL text to update display name for field MemberSegment */
UPDATE [${mjSchema}].[EntityField] SET [__mj_UpdatedAt]=GETUTCDATE(), DisplayName = 'Member Segment' WHERE ID = '1184053F-B618-4B8B-B529-C22B775C24F1';

/* SQL text to update display name for field TenureDays */
UPDATE [${mjSchema}].[EntityField] SET [__mj_UpdatedAt]=GETUTCDATE(), DisplayName = 'Tenure Days' WHERE ID = 'D49E7FAB-38A1-4518-831C-DAAC47B73AB3';

/* Set field properties for entity */

               UPDATE [${mjSchema}].[EntityField]
               SET IsNameField = 1
               WHERE ID = 'CDF8F3E5-F527-44B0-BE23-10B8431C3A19'
               AND AutoUpdateIsNameField = 1;

               UPDATE [${mjSchema}].[EntityField]
               SET DefaultInView = 1
               WHERE ID = '3589D64A-4A4A-4798-8C66-35619F664530'
               AND AutoUpdateDefaultInView = 1;

/* Set categories for 28 fields */

-- UPDATE Entity Field Category Info MoreCheese: Member Profiles.ID 
UPDATE [${mjSchema}].[EntityField]
SET 
   Category = 'System Metadata',
   GeneratedFormSection = 'Category'
WHERE 
   ID = '6CC3A35F-B085-4CA9-A6A1-3D3217A7E2DF';

-- UPDATE Entity Field Category Info MoreCheese: Member Profiles.PersonID 
UPDATE [${mjSchema}].[EntityField]
SET 
   Category = 'Member Details',
   GeneratedFormSection = 'Category'
WHERE 
   ID = '7CBEDD07-513A-48BC-949B-A4CA8436387A';

-- UPDATE Entity Field Category Info MoreCheese: Member Profiles.OrganizationID 
UPDATE [${mjSchema}].[EntityField]
SET 
   Category = 'Member Details',
   GeneratedFormSection = 'Category'
WHERE 
   ID = 'F8B9A4AD-BD44-4F5D-9C6F-0B23EEC84C8B';

-- UPDATE Entity Field Category Info MoreCheese: Member Profiles.MemberNumber 
UPDATE [${mjSchema}].[EntityField]
SET 
   Category = 'Member Details',
   GeneratedFormSection = 'Category'
WHERE 
   ID = 'CDF8F3E5-F527-44B0-BE23-10B8431C3A19';

-- UPDATE Entity Field Category Info MoreCheese: Member Profiles.Segment 
UPDATE [${mjSchema}].[EntityField]
SET 
   Category = 'Member Details',
   GeneratedFormSection = 'Category'
WHERE 
   ID = 'E0442068-AE13-4CC6-A5AA-6E2EBE16EF0F';

-- UPDATE Entity Field Category Info MoreCheese: Member Profiles.JoinDate 
UPDATE [${mjSchema}].[EntityField]
SET 
   Category = 'Member Details',
   GeneratedFormSection = 'Category'
WHERE 
   ID = '8A705B0F-1D40-40D1-9877-9B3662C70C40';

-- UPDATE Entity Field Category Info MoreCheese: Member Profiles.IsSharedDemo 
UPDATE [${mjSchema}].[EntityField]
SET 
   Category = 'Member Details',
   GeneratedFormSection = 'Category'
WHERE 
   ID = '24D57AD2-12E9-459A-9FF2-564BB5AAA782';

-- UPDATE Entity Field Category Info MoreCheese: Member Profiles.Region 
UPDATE [${mjSchema}].[EntityField]
SET 
   Category = 'Geography and Location',
   GeneratedFormSection = 'Category'
WHERE 
   ID = '8FA7894D-19E6-4662-82D9-C923A8A8CA57';

-- UPDATE Entity Field Category Info MoreCheese: Member Profiles.Country 
UPDATE [${mjSchema}].[EntityField]
SET 
   Category = 'Geography and Location',
   GeneratedFormSection = 'Category'
WHERE 
   ID = 'F7ABFEDC-4679-5F9F-A967-D409E25B35E0';

-- UPDATE Entity Field Category Info MoreCheese: Member Profiles.CountryName 
UPDATE [${mjSchema}].[EntityField]
SET 
   Category = 'Geography and Location',
   GeneratedFormSection = 'Category'
WHERE 
   ID = '8525A745-6CF9-5446-8D79-40BB1F26BA7B';

-- UPDATE Entity Field Category Info MoreCheese: Member Profiles.City 
UPDATE [${mjSchema}].[EntityField]
SET 
   Category = 'Geography and Location',
   GeneratedFormSection = 'Category'
WHERE 
   ID = '7CFDB7CD-97C9-491E-B94D-62C5776F40A9';

-- UPDATE Entity Field Category Info MoreCheese: Member Profiles.State 
UPDATE [${mjSchema}].[EntityField]
SET 
   Category = 'Geography and Location',
   GeneratedFormSection = 'Category'
WHERE 
   ID = '111789CA-B374-4BAF-8EAE-8F19487156AC';

-- UPDATE Entity Field Category Info MoreCheese: Member Profiles.AddressLine1 
UPDATE [${mjSchema}].[EntityField]
SET 
   Category = 'Geography and Location',
   GeneratedFormSection = 'Category'
WHERE 
   ID = '09F8E8AD-3B49-5539-992F-0DCB940FAEF8';

-- UPDATE Entity Field Category Info MoreCheese: Member Profiles.AddressLine2 
UPDATE [${mjSchema}].[EntityField]
SET 
   Category = 'Geography and Location',
   GeneratedFormSection = 'Category'
WHERE 
   ID = '8400640D-3302-561B-A0B9-538D72580933';

-- UPDATE Entity Field Category Info MoreCheese: Member Profiles.PostalCode 
UPDATE [${mjSchema}].[EntityField]
SET 
   Category = 'Geography and Location',
   GeneratedFormSection = 'Category'
WHERE 
   ID = '8C48A080-FBE3-5EE5-BFB6-49EBBE079200';

-- UPDATE Entity Field Category Info MoreCheese: Member Profiles.Latitude 
UPDATE [${mjSchema}].[EntityField]
SET 
   Category = 'Geography and Location',
   GeneratedFormSection = 'Category'
WHERE 
   ID = 'D4C5B0A4-547F-4FFC-97F0-8FE7DF519F12';

-- UPDATE Entity Field Category Info MoreCheese: Member Profiles.Longitude 
UPDATE [${mjSchema}].[EntityField]
SET 
   Category = 'Geography and Location',
   GeneratedFormSection = 'Category'
WHERE 
   ID = '24B22B75-F856-4DA3-923F-16F678B3F93E';

-- UPDATE Entity Field Category Info MoreCheese: Member Profiles.RaceEthnicity 
UPDATE [${mjSchema}].[EntityField]
SET 
   Category = 'Demographics and Profile',
   GeneratedFormSection = 'Category'
WHERE 
   ID = '3418E886-6EF9-5A85-A38B-993190659ABB';

-- UPDATE Entity Field Category Info MoreCheese: Member Profiles.EthnicityHispanic 
UPDATE [${mjSchema}].[EntityField]
SET 
   Category = 'Demographics and Profile',
   GeneratedFormSection = 'Category'
WHERE 
   ID = '453EB64B-F362-5FCB-86FC-2EEDE16175D8';

-- UPDATE Entity Field Category Info MoreCheese: Member Profiles.PronounSet 
UPDATE [${mjSchema}].[EntityField]
SET 
   Category = 'Demographics and Profile',
   GeneratedFormSection = 'Category'
WHERE 
   ID = 'FD8B8AA6-EC52-58FF-A1FB-02949B45A1E8';

-- UPDATE Entity Field Category Info MoreCheese: Member Profiles.PrimaryLanguage 
UPDATE [${mjSchema}].[EntityField]
SET 
   Category = 'Demographics and Profile',
   GeneratedFormSection = 'Category'
WHERE 
   ID = '6E9B9720-B620-5FDE-B11A-A88DED196210';

-- UPDATE Entity Field Category Info MoreCheese: Member Profiles.RenewalProbability 
UPDATE [${mjSchema}].[EntityField]
SET 
   Category = 'Renewal Risk & Analytics',
   GeneratedFormSection = 'Category'
WHERE 
   ID = 'CAABD192-5F15-4B9C-8C62-842DCCE4E7EE';

-- UPDATE Entity Field Category Info MoreCheese: Member Profiles.RenewalStatus 
UPDATE [${mjSchema}].[EntityField]
SET 
   Category = 'Renewal Risk & Analytics',
   GeneratedFormSection = 'Category'
WHERE 
   ID = '3589D64A-4A4A-4798-8C66-35619F664530';

-- UPDATE Entity Field Category Info MoreCheese: Member Profiles.RenewalScoredAt 
UPDATE [${mjSchema}].[EntityField]
SET 
   Category = 'Renewal Risk & Analytics',
   GeneratedFormSection = 'Category'
WHERE 
   ID = '3649AB28-129A-48D0-9C21-385B430E218A';

-- UPDATE Entity Field Category Info MoreCheese: Member Profiles.Person 
UPDATE [${mjSchema}].[EntityField]
SET 
   Category = 'Member Details',
   GeneratedFormSection = 'Category'
WHERE 
   ID = 'A85246A1-1461-4A08-8210-97D3357E04BD';

-- UPDATE Entity Field Category Info MoreCheese: Member Profiles.Organization 
UPDATE [${mjSchema}].[EntityField]
SET 
   Category = 'Member Details',
   GeneratedFormSection = 'Category'
WHERE 
   ID = 'C201AECB-BCDC-4FB0-9A8E-0C2BD206AED1';

-- UPDATE Entity Field Category Info MoreCheese: Member Profiles.__mj_CreatedAt 
UPDATE [${mjSchema}].[EntityField]
SET 
   Category = 'System Metadata',
   GeneratedFormSection = 'Category'
WHERE 
   ID = '4741E59A-F3A0-4CBD-AD11-9E69DA30F81C';

-- UPDATE Entity Field Category Info MoreCheese: Member Profiles.__mj_UpdatedAt 
UPDATE [${mjSchema}].[EntityField]
SET 
   Category = 'System Metadata',
   GeneratedFormSection = 'Category'
WHERE 
   ID = 'B5BA3737-6DD0-4621-8B4F-99A3F197216C';

/* Set entity icon to fa fa-id-card */

               UPDATE [${mjSchema}].[Entity]
               SET [Icon] = 'fa fa-id-card', [__mj_UpdatedAt] = GETUTCDATE()
               WHERE [ID] = 'BE4D97E0-48DE-4240-A09F-8B39AD4BD043';

/* Insert FieldCategoryInfo setting for entity */
IF NOT EXISTS (
      SELECT 1 FROM [${mjSchema}].[EntitySetting] WHERE [EntityID] = 'BE4D97E0-48DE-4240-A09F-8B39AD4BD043' AND [Name] = 'FieldCategoryInfo'
   )
   BEGIN
      INSERT INTO [${mjSchema}].[EntitySetting] ([ID], [EntityID], [Name], [Value], [__mj_CreatedAt], [__mj_UpdatedAt])
               VALUES ('05f4ccd6-9da6-5ee5-a771-0f81ba42f268', 'BE4D97E0-48DE-4240-A09F-8B39AD4BD043', 'FieldCategoryInfo', '{
  "Demographics and Profile": {
    "description": "Personal demographic details, pronouns, and language preferences",
    "icon": "fa fa-user-friends"
  },
  "Geography and Location": {
    "description": "Geographic regions, street addresses, and pre-baked map coordinates",
    "icon": "fa fa-map-marker-alt"
  },
  "Member Details": {
    "description": "Core membership identifiers, professional segments, and join details",
    "icon": "fa fa-id-badge"
  },
  "Renewal Risk & Analytics": {
    "description": "Predictive analytics and risk scoring regarding member renewals",
    "icon": "fa fa-chart-line"
  },
  "System Metadata": {
    "description": "System-managed tracking and audit timestamps",
    "icon": "fa fa-cog"
  }
}', GETUTCDATE(), GETUTCDATE())
   END;

/* Insert FieldCategoryIcons setting (legacy) */
IF NOT EXISTS (
      SELECT 1 FROM [${mjSchema}].[EntitySetting] WHERE [EntityID] = 'BE4D97E0-48DE-4240-A09F-8B39AD4BD043' AND [Name] = 'FieldCategoryIcons'
   )
   BEGIN
      INSERT INTO [${mjSchema}].[EntitySetting] ([ID], [EntityID], [Name], [Value], [__mj_CreatedAt], [__mj_UpdatedAt])
               VALUES ('1842dd42-4088-5516-816e-2a663fd6f639', 'BE4D97E0-48DE-4240-A09F-8B39AD4BD043', 'FieldCategoryIcons', '{
  "Demographics and Profile": "fa fa-user-friends",
  "Geography and Location": "fa fa-map-marker-alt",
  "Member Details": "fa fa-id-badge",
  "Renewal Risk & Analytics": "fa fa-chart-line",
  "System Metadata": "fa fa-cog"
}', GETUTCDATE(), GETUTCDATE())
   END;

