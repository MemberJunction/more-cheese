-- =============================================================================
-- MoreCheese: Retire Events & Event Registrations Entities (v1.2.x)
-- Drops physical tables [morecheese_events].[EventRegistration] and [morecheese_events].[Event],
-- associated views, stored procedures, triggers, and purges entity metadata from [${mjSchema}] tables.
-- Canonical event products and event attendee registrations are now managed via BizApps Orders:
-- [${mjSchema}_BizAppsOrders].[EventProduct] and [${mjSchema}_BizAppsOrders].[EventOrderLine].
-- Rebinds the MoreCheese Event No-Show Propensity pipeline to [${mjSchema}_BizAppsOrders].[EventOrderLine].
-- Backfills realistic attendance lifecycle statuses, badge names, and ticket tiers across EventOrderLine.
-- =============================================================================

DECLARE @regEntityId UNIQUEIDENTIFIER = 'DC863C47-C1FA-4C3F-92D1-DF7F8A7BC153'; -- MoreCheese: Event Registrations
DECLARE @evtEntityId UNIQUEIDENTIFIER = 'CB9A5230-39C0-49EE-A5BC-238D3536B39B'; -- MoreCheese: Events
DECLARE @canonicalEventOrderLineEntityId UNIQUEIDENTIFIER = '90A1060F-35D6-44A7-9076-A9053BBF60E6'; -- MJ_BizApps_Orders: Event Order Lines

-- 0. Rebind or update MLTrainingPipeline for Event No-Show Propensity to canonical BizApps Orders
IF OBJECT_ID('${mjSchema}.MLTrainingPipeline', 'U') IS NOT NULL
BEGIN
    UPDATE [${mjSchema}].[MLTrainingPipeline]
    SET [TargetEntityID] = @canonicalEventOrderLineEntityId,
        [TargetVariable] = 'AttendanceStatus',
        [SourceBindings] = JSON_MODIFY(
            '[]',
            'append $',
            JSON_QUERY('{"Kind":"Entity","Ref":"MJ_BizApps_Orders: Event Order Lines"}')
        ),
        [FeatureSteps] = JSON_QUERY('{"Steps":[{"Id":"select-features","Kind":"select","Columns":["TicketTier","ProductID","UnitPrice","LineTotalNet"]}]}'),
        [LeakageGuard] = JSON_QUERY('{"DenyFields":["AttendanceStatus","CheckInAt","BadgePrintedAt","CheckInNotes","SpecialRequests","Comments","DietaryPreferences","Allergies","PersonID"],"SingleFeatureDominanceThreshold":0.85}')
    WHERE [ID] = '8A1C44F3-938C-4E65-B6DE-D621BC4C3002';

    -- Update Member Renewal Risk pipeline to replace references to legacy MoreCheese: Event Registrations
    UPDATE [${mjSchema}].[MLTrainingPipeline]
    SET [SourceBindings] = REPLACE(CAST([SourceBindings] AS NVARCHAR(MAX)), 'MoreCheese: Event Registrations', 'MJ_BizApps_Orders: Event Order Lines'),
        [FeatureSteps] = REPLACE(CAST([FeatureSteps] AS NVARCHAR(MAX)), 'MoreCheese: Event Registrations', 'MJ_BizApps_Orders: Event Order Lines')
    WHERE [ID] = '8A1C44F3-938C-4E65-B6DE-D621BC4C3001';
END;

-- 1. Rebind issues referencing event registrations to canonical event order lines
IF OBJECT_ID('${mjSchema}_BizAppsIssues.Issue', 'U') IS NOT NULL
    UPDATE [${mjSchema}_BizAppsIssues].[Issue]
    SET [SourceEntityID] = @canonicalEventOrderLineEntityId
    WHERE [SourceEntityID] IN (@regEntityId, @evtEntityId);

-- 1b. Rebind Sonar model related entities and factors referencing legacy Event Registrations
IF OBJECT_ID('${mjSchema}_BizAppsSonar.ModelRelatedEntity', 'U') IS NOT NULL
    UPDATE [${mjSchema}_BizAppsSonar].[ModelRelatedEntity]
    SET [RelatedEntityID] = @canonicalEventOrderLineEntityId
    WHERE [RelatedEntityID] IN (@regEntityId, @evtEntityId);

IF OBJECT_ID('${mjSchema}_BizAppsSonar.Factor', 'U') IS NOT NULL
    UPDATE [${mjSchema}_BizAppsSonar].[Factor]
    SET [SourceEntityID] = @canonicalEventOrderLineEntityId
    WHERE [SourceEntityID] IN (@regEntityId, @evtEntityId);

-- 2. ML model bindings
IF OBJECT_ID('${mjSchema}.MLModelScoringBinding', 'U') IS NOT NULL
    DELETE FROM [${mjSchema}].[MLModelScoringBinding] 
    WHERE [TargetEntityID] IN (@regEntityId, @evtEntityId);

-- 3. ML training runs
IF OBJECT_ID('${mjSchema}.MLTrainingRun', 'U') IS NOT NULL
    DELETE FROM [${mjSchema}].[MLTrainingRun] 
    WHERE PipelineID IN (SELECT ID FROM [${mjSchema}].[MLTrainingPipeline] WHERE TargetEntityID IN (@regEntityId, @evtEntityId));

-- 4. ML models
IF OBJECT_ID('${mjSchema}.MLModel', 'U') IS NOT NULL
    DELETE FROM [${mjSchema}].[MLModel] 
    WHERE PipelineID IN (SELECT ID FROM [${mjSchema}].[MLTrainingPipeline] WHERE TargetEntityID IN (@regEntityId, @evtEntityId));

-- 5. Record geocodes
IF OBJECT_ID('${mjSchema}.RecordGeoCode', 'U') IS NOT NULL
    DELETE FROM [${mjSchema}].[RecordGeoCode] 
    WHERE [EntityID] IN (@regEntityId, @evtEntityId);

-- 6. Process runs and details
IF OBJECT_ID('${mjSchema}.ProcessRunDetail', 'U') IS NOT NULL
    DELETE FROM [${mjSchema}].[ProcessRunDetail] WHERE [EntityID] IN (@regEntityId, @evtEntityId);

IF OBJECT_ID('${mjSchema}.ProcessRun', 'U') IS NOT NULL
    DELETE FROM [${mjSchema}].[ProcessRun] WHERE [EntityID] IN (@regEntityId, @evtEntityId);

-- 7. Record processes
IF OBJECT_ID('${mjSchema}.RecordProcess', 'U') IS NOT NULL
    DELETE FROM [${mjSchema}].[RecordProcess] WHERE [EntityID] IN (@regEntityId, @evtEntityId);

-- 8. Record change tracking logs
IF OBJECT_ID('${mjSchema}.RecordChange', 'U') IS NOT NULL
    DELETE FROM [${mjSchema}].[RecordChange] WHERE [EntityID] IN (@regEntityId, @evtEntityId);

-- 9. User record logs
IF OBJECT_ID('${mjSchema}.UserRecordLog', 'U') IS NOT NULL
    DELETE FROM [${mjSchema}].[UserRecordLog] WHERE [EntityID] IN (@regEntityId, @evtEntityId);

-- 10. Application entity associations
IF OBJECT_ID('${mjSchema}.UserApplicationEntity', 'U') IS NOT NULL
    DELETE FROM [${mjSchema}].[UserApplicationEntity] WHERE [EntityID] IN (@regEntityId, @evtEntityId);

IF OBJECT_ID('${mjSchema}.ApplicationEntity', 'U') IS NOT NULL
    DELETE FROM [${mjSchema}].[ApplicationEntity] WHERE [EntityID] IN (@regEntityId, @evtEntityId);

-- 11. Entity settings
IF OBJECT_ID('${mjSchema}.EntitySetting', 'U') IS NOT NULL
    DELETE FROM [${mjSchema}].[EntitySetting] WHERE [EntityID] IN (@regEntityId, @evtEntityId);

-- 12. Entity relationships
IF OBJECT_ID('${mjSchema}.EntityRelationship', 'U') IS NOT NULL
    DELETE FROM [${mjSchema}].[EntityRelationship] WHERE [EntityID] IN (@regEntityId, @evtEntityId) OR [RelatedEntityID] IN (@regEntityId, @evtEntityId);

-- 13. Entity permissions
IF OBJECT_ID('${mjSchema}.EntityPermission', 'U') IS NOT NULL
    DELETE FROM [${mjSchema}].[EntityPermission] WHERE [EntityID] IN (@regEntityId, @evtEntityId);

-- 14. Entity field values (value list constraints)
IF OBJECT_ID('${mjSchema}.EntityFieldValue', 'U') IS NOT NULL
    DELETE FROM [${mjSchema}].[EntityFieldValue] WHERE [EntityFieldID] IN (SELECT ID FROM [${mjSchema}].[EntityField] WHERE EntityID IN (@regEntityId, @evtEntityId));

-- 15. Clear RelatedEntityID pointers in EntityField before deleting
IF OBJECT_ID('${mjSchema}.EntityField', 'U') IS NOT NULL
    UPDATE [${mjSchema}].[EntityField]
    SET [RelatedEntityID] = NULL
    WHERE [RelatedEntityID] IN (@regEntityId, @evtEntityId);

-- 16. Entity fields
IF OBJECT_ID('${mjSchema}.EntityField', 'U') IS NOT NULL
    DELETE FROM [${mjSchema}].[EntityField] WHERE [EntityID] IN (@regEntityId, @evtEntityId);

-- 16b. Queries, query entities, query fields and views referencing these entities
IF OBJECT_ID('${mjSchema}.QueryField', 'U') IS NOT NULL
    DELETE FROM [${mjSchema}].[QueryField] WHERE [SourceEntityID] IN (@regEntityId, @evtEntityId);

IF OBJECT_ID('${mjSchema}.QueryEntity', 'U') IS NOT NULL
    DELETE FROM [${mjSchema}].[QueryEntity] WHERE [EntityID] IN (@regEntityId, @evtEntityId);

IF OBJECT_ID('${mjSchema}.UserViewRun', 'U') IS NOT NULL
    DELETE FROM [${mjSchema}].[UserViewRun] WHERE [UserViewID] IN (SELECT [ID] FROM [${mjSchema}].[UserView] WHERE [EntityID] IN (@regEntityId, @evtEntityId));

IF OBJECT_ID('${mjSchema}.UserView', 'U') IS NOT NULL
    DELETE FROM [${mjSchema}].[UserView] WHERE [EntityID] IN (@regEntityId, @evtEntityId);

-- 17. Core Entity entry
IF OBJECT_ID('${mjSchema}.Entity', 'U') IS NOT NULL
    DELETE FROM [${mjSchema}].[Entity] WHERE [ID] IN (@regEntityId, @evtEntityId);

-- 18. Drop physical SQL Server objects in morecheese_events
IF OBJECT_ID('[morecheese_events].[trgUpdateEventRegistration]', 'TR') IS NOT NULL
    DROP TRIGGER [morecheese_events].[trgUpdateEventRegistration];

IF OBJECT_ID('[morecheese_events].[spCreateEventRegistration]', 'P') IS NOT NULL
    DROP PROCEDURE [morecheese_events].[spCreateEventRegistration];

IF OBJECT_ID('[morecheese_events].[spUpdateEventRegistration]', 'P') IS NOT NULL
    DROP PROCEDURE [morecheese_events].[spUpdateEventRegistration];

IF OBJECT_ID('[morecheese_events].[spDeleteEventRegistration]', 'P') IS NOT NULL
    DROP PROCEDURE [morecheese_events].[spDeleteEventRegistration];

IF OBJECT_ID('[morecheese_events].[vwEventRegistrations]', 'V') IS NOT NULL
    DROP VIEW [morecheese_events].[vwEventRegistrations];

IF OBJECT_ID('[morecheese_events].[EventRegistration]', 'U') IS NOT NULL
    DROP TABLE [morecheese_events].[EventRegistration];

IF OBJECT_ID('[morecheese_events].[trgUpdateEvent]', 'TR') IS NOT NULL
    DROP TRIGGER [morecheese_events].[trgUpdateEvent];

IF OBJECT_ID('[morecheese_events].[spCreateEvent]', 'P') IS NOT NULL
    DROP PROCEDURE [morecheese_events].[spCreateEvent];

IF OBJECT_ID('[morecheese_events].[spUpdateEvent]', 'P') IS NOT NULL
    DROP PROCEDURE [morecheese_events].[spUpdateEvent];

IF OBJECT_ID('[morecheese_events].[spDeleteEvent]', 'P') IS NOT NULL
    DROP PROCEDURE [morecheese_events].[spDeleteEvent];

IF OBJECT_ID('[morecheese_events].[vwEvents]', 'V') IS NOT NULL
    DROP VIEW [morecheese_events].[vwEvents];

IF OBJECT_ID('[morecheese_events].[Event]', 'U') IS NOT NULL
    DROP TABLE [morecheese_events].[Event];

-- 19. Backfill realistic attendance, badge, tier data on canonical EventOrderLines
IF OBJECT_ID('[${mjSchema}_BizAppsOrders].[EventOrderLine]', 'U') IS NOT NULL
BEGIN
    ;WITH EolRanked AS (
        SELECT 
            eol.ID,
            p.FirstName,
            p.LastName,
            p.Title AS PersonTitle,
            comp.Name AS CompanyName,
            ep.EventStartsAt,
            ep.EventFormat,
            ROW_NUMBER() OVER (ORDER BY eol.ID) AS RowNum
        FROM [${mjSchema}_BizAppsOrders].[EventOrderLine] eol
        JOIN [${mjSchema}_BizAppsOrders].[OrderLine] ol ON ol.ID = eol.ID
        JOIN [${mjSchema}_BizAppsOrders].[Product] prod ON prod.ID = ol.ProductID
        LEFT JOIN [${mjSchema}_BizAppsOrders].[EventProduct] ep ON ep.ID = prod.ID
        LEFT JOIN [${mjSchema}_BizAppsCommon].[Person] p ON p.ID = eol.PersonID
        LEFT JOIN [${mjSchema}].[Company] comp ON comp.ID = ol.CompanyID
    )
    UPDATE eol
    SET 
        eol.BadgeName = COALESCE(eol.BadgeName, NULLIF(LTRIM(RTRIM(CONCAT(r.FirstName, ' ', r.LastName))), '')),
        eol.BadgeCompany = COALESCE(eol.BadgeCompany, r.CompanyName, 'International Cheese Federation Member'),
        eol.BadgeTitle = COALESCE(eol.BadgeTitle, r.PersonTitle, 'Delegate'),
        eol.TicketTier = CASE 
            WHEN (r.RowNum % 20) = 0 THEN 'Speaker'
            WHEN (r.RowNum % 20) IN (1, 2) THEN 'VIP'
            WHEN (r.RowNum % 20) IN (3, 4) THEN 'Sponsor'
            WHEN (r.RowNum % 20) = 5 THEN 'Student'
            ELSE 'General'
        END,
        eol.AttendanceStatus = CASE 
            -- Past events: realistic distribution (~76% Attended, ~17% No Show, ~7% Cancelled)
            WHEN r.EventStartsAt IS NOT NULL AND r.EventStartsAt < GETUTCDATE() THEN 
                CASE 
                    WHEN (r.RowNum % 100) < 76 THEN 'Attended'
                    WHEN (r.RowNum % 100) < 93 THEN 'No Show'
                    ELSE 'Cancelled'
                END
            -- Future events: 95% Registered, 5% Cancelled
            ELSE 
                CASE 
                    WHEN (r.RowNum % 20) = 0 THEN 'Cancelled'
                    ELSE 'Registered'
                END
        END,
        eol.CheckInAt = CASE 
            WHEN r.EventStartsAt IS NOT NULL AND r.EventStartsAt < GETUTCDATE() AND (r.RowNum % 100) < 76 THEN 
                DATEADD(MINUTE, -15 + (r.RowNum % 45), r.EventStartsAt)
            ELSE NULL
        END,
        eol.BadgePrintedAt = CASE 
            WHEN r.EventStartsAt IS NOT NULL AND r.EventStartsAt < GETUTCDATE() AND (r.RowNum % 100) < 76 THEN 
                DATEADD(MINUTE, -20 + (r.RowNum % 45), r.EventStartsAt)
            ELSE NULL
        END,
        eol.TableAssignment = CASE 
            WHEN (r.RowNum % 100) < 76 THEN CONCAT('Table ', (r.RowNum % 40) + 1)
            ELSE NULL
        END
    FROM [${mjSchema}_BizAppsOrders].[EventOrderLine] eol
    JOIN EolRanked r ON r.ID = eol.ID;
END;
