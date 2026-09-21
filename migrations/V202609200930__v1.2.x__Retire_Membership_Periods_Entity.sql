-- =============================================================================
-- MoreCheese: Retire Membership Periods Entity (v1.2.x)
-- Drops physical table [morecheese_members].[MembershipPeriod], associated view,
-- stored procedures, triggers, and purges entity metadata from [${mjSchema}] tables.
-- Predictive Studio now scores churn risk directly on upstream canonical entities
-- (Orders, Order Lines, Event Registrations, Member Profiles).
-- =============================================================================

DECLARE @entityId UNIQUEIDENTIFIER = '16538F9B-E025-460D-9505-BD03A7648EC5';

-- 1. ML model bindings
IF OBJECT_ID('${mjSchema}.MLModelScoringBinding', 'U') IS NOT NULL
    DELETE FROM [${mjSchema}].[MLModelScoringBinding] 
    WHERE [TargetEntityID] = @entityId 
       OR [MLModelID] IN (SELECT ID FROM [${mjSchema}].[MLModel] WHERE PipelineID IN (SELECT ID FROM [${mjSchema}].[MLTrainingPipeline] WHERE TargetEntityID = @entityId));

-- 2. ML training runs
IF OBJECT_ID('${mjSchema}.MLTrainingRun', 'U') IS NOT NULL
    DELETE FROM [${mjSchema}].[MLTrainingRun] 
    WHERE PipelineID IN (SELECT ID FROM [${mjSchema}].[MLTrainingPipeline] WHERE TargetEntityID = @entityId)
       OR ResultingModelID IN (SELECT ID FROM [${mjSchema}].[MLModel] WHERE PipelineID IN (SELECT ID FROM [${mjSchema}].[MLTrainingPipeline] WHERE TargetEntityID = @entityId));

-- 3. ML models
IF OBJECT_ID('${mjSchema}.MLModel', 'U') IS NOT NULL
    DELETE FROM [${mjSchema}].[MLModel] 
    WHERE PipelineID IN (SELECT ID FROM [${mjSchema}].[MLTrainingPipeline] WHERE TargetEntityID = @entityId);

-- 4. ML pipelines
IF OBJECT_ID('${mjSchema}.MLTrainingPipeline', 'U') IS NOT NULL
    DELETE FROM [${mjSchema}].[MLTrainingPipeline] WHERE [TargetEntityID] = @entityId;

-- 5. Process runs and details
IF OBJECT_ID('${mjSchema}.ProcessRunDetail', 'U') IS NOT NULL
    DELETE FROM [${mjSchema}].[ProcessRunDetail] WHERE [EntityID] = @entityId;

IF OBJECT_ID('${mjSchema}.ProcessRun', 'U') IS NOT NULL
    DELETE FROM [${mjSchema}].[ProcessRun] WHERE [EntityID] = @entityId;

-- 6. Record processes
IF OBJECT_ID('${mjSchema}.RecordProcess', 'U') IS NOT NULL
    DELETE FROM [${mjSchema}].[RecordProcess] WHERE [EntityID] = @entityId;

-- 7. Record change tracking logs
IF OBJECT_ID('${mjSchema}.RecordChange', 'U') IS NOT NULL
    DELETE FROM [${mjSchema}].[RecordChange] WHERE [EntityID] = @entityId;

-- 8. User record logs
IF OBJECT_ID('${mjSchema}.UserRecordLog', 'U') IS NOT NULL
    DELETE FROM [${mjSchema}].[UserRecordLog] WHERE [EntityID] = @entityId;

-- 9. Application entity associations
IF OBJECT_ID('${mjSchema}.UserApplicationEntity', 'U') IS NOT NULL
    DELETE FROM [${mjSchema}].[UserApplicationEntity] WHERE [EntityID] = @entityId;

IF OBJECT_ID('${mjSchema}.ApplicationEntity', 'U') IS NOT NULL
    DELETE FROM [${mjSchema}].[ApplicationEntity] WHERE [EntityID] = @entityId;

-- 10. Entity settings
IF OBJECT_ID('${mjSchema}.EntitySetting', 'U') IS NOT NULL
    DELETE FROM [${mjSchema}].[EntitySetting] WHERE [EntityID] = @entityId;

-- 11. Entity relationships
IF OBJECT_ID('${mjSchema}.EntityRelationship', 'U') IS NOT NULL
    DELETE FROM [${mjSchema}].[EntityRelationship] WHERE [EntityID] = @entityId OR [RelatedEntityID] = @entityId;

-- 12. Entity permissions
IF OBJECT_ID('${mjSchema}.EntityPermission', 'U') IS NOT NULL
    DELETE FROM [${mjSchema}].[EntityPermission] WHERE [EntityID] = @entityId;

-- 13. Entity field values (value list constraints)
IF OBJECT_ID('${mjSchema}.EntityFieldValue', 'U') IS NOT NULL
    DELETE FROM [${mjSchema}].[EntityFieldValue] WHERE [EntityFieldID] IN (SELECT ID FROM [${mjSchema}].[EntityField] WHERE EntityID = @entityId);

-- 14. Entity fields
IF OBJECT_ID('${mjSchema}.EntityField', 'U') IS NOT NULL
    DELETE FROM [${mjSchema}].[EntityField] WHERE [EntityID] = @entityId;

-- 14b. Queries, query entities, query fields and views referencing this entity
IF OBJECT_ID('${mjSchema}.QueryField', 'U') IS NOT NULL
    DELETE FROM [${mjSchema}].[QueryField] WHERE [SourceEntityID] = @entityId;

IF OBJECT_ID('${mjSchema}.QueryEntity', 'U') IS NOT NULL
    DELETE FROM [${mjSchema}].[QueryEntity] WHERE [EntityID] = @entityId;

IF OBJECT_ID('${mjSchema}.UserViewRun', 'U') IS NOT NULL
    DELETE FROM [${mjSchema}].[UserViewRun] WHERE [UserViewID] IN (SELECT [ID] FROM [${mjSchema}].[UserView] WHERE [EntityID] = @entityId);

IF OBJECT_ID('${mjSchema}.UserView', 'U') IS NOT NULL
    DELETE FROM [${mjSchema}].[UserView] WHERE [EntityID] = @entityId;

-- 15. Core Entity entry
IF OBJECT_ID('${mjSchema}.Entity', 'U') IS NOT NULL
    DELETE FROM [${mjSchema}].[Entity] WHERE [ID] = @entityId;

-- 16. Drop physical SQL Server objects in ${flyway:defaultSchema}
IF OBJECT_ID('[${flyway:defaultSchema}].[trgUpdateMembershipPeriod]', 'TR') IS NOT NULL
    DROP TRIGGER [${flyway:defaultSchema}].[trgUpdateMembershipPeriod];

IF OBJECT_ID('[${flyway:defaultSchema}].[spCreateMembershipPeriod]', 'P') IS NOT NULL
    DROP PROCEDURE [${flyway:defaultSchema}].[spCreateMembershipPeriod];

IF OBJECT_ID('[${flyway:defaultSchema}].[spUpdateMembershipPeriod]', 'P') IS NOT NULL
    DROP PROCEDURE [${flyway:defaultSchema}].[spUpdateMembershipPeriod];

IF OBJECT_ID('[${flyway:defaultSchema}].[spDeleteMembershipPeriod]', 'P') IS NOT NULL
    DROP PROCEDURE [${flyway:defaultSchema}].[spDeleteMembershipPeriod];

IF OBJECT_ID('[${flyway:defaultSchema}].[vwMembershipPeriods]', 'V') IS NOT NULL
    DROP VIEW [${flyway:defaultSchema}].[vwMembershipPeriods];

IF OBJECT_ID('[${flyway:defaultSchema}].[MembershipPeriod]', 'U') IS NOT NULL
    DROP TABLE [${flyway:defaultSchema}].[MembershipPeriod];
