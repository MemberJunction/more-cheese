-- =============================================================================
-- MoreCheese: Retire Membership Periods Entity (v1.2.x)
-- Drops physical table [morecheese_members].[MembershipPeriod], associated view,
-- stored procedures, triggers, and purges entity metadata from [__mj] tables.
-- Predictive Studio now scores churn risk directly on upstream canonical entities
-- (Orders, Order Lines, Event Registrations, Member Profiles).
-- =============================================================================

DECLARE @entityId UNIQUEIDENTIFIER = '16538F9B-E025-460D-9505-BD03A7648EC5';

-- 1. ML model bindings
IF OBJECT_ID('__mj.MLModelScoringBinding', 'U') IS NOT NULL
    DELETE FROM [__mj].[MLModelScoringBinding] 
    WHERE [TargetEntityID] = @entityId 
       OR [MLModelID] IN (SELECT ID FROM [__mj].[MLModel] WHERE PipelineID IN (SELECT ID FROM [__mj].[MLTrainingPipeline] WHERE TargetEntityID = @entityId));

-- 2. ML training runs
IF OBJECT_ID('__mj.MLTrainingRun', 'U') IS NOT NULL
    DELETE FROM [__mj].[MLTrainingRun] 
    WHERE PipelineID IN (SELECT ID FROM [__mj].[MLTrainingPipeline] WHERE TargetEntityID = @entityId)
       OR ResultingModelID IN (SELECT ID FROM [__mj].[MLModel] WHERE PipelineID IN (SELECT ID FROM [__mj].[MLTrainingPipeline] WHERE TargetEntityID = @entityId));

-- 3. ML models
IF OBJECT_ID('__mj.MLModel', 'U') IS NOT NULL
    DELETE FROM [__mj].[MLModel] 
    WHERE PipelineID IN (SELECT ID FROM [__mj].[MLTrainingPipeline] WHERE TargetEntityID = @entityId);

-- 4. ML pipelines
IF OBJECT_ID('__mj.MLTrainingPipeline', 'U') IS NOT NULL
    DELETE FROM [__mj].[MLTrainingPipeline] WHERE [TargetEntityID] = @entityId;

-- 5. Process runs and details
IF OBJECT_ID('__mj.ProcessRunDetail', 'U') IS NOT NULL
    DELETE FROM [__mj].[ProcessRunDetail] WHERE [EntityID] = @entityId;

IF OBJECT_ID('__mj.ProcessRun', 'U') IS NOT NULL
    DELETE FROM [__mj].[ProcessRun] WHERE [EntityID] = @entityId;

-- 6. Record processes
IF OBJECT_ID('__mj.RecordProcess', 'U') IS NOT NULL
    DELETE FROM [__mj].[RecordProcess] WHERE [EntityID] = @entityId;

-- 7. Record change tracking logs
IF OBJECT_ID('__mj.RecordChange', 'U') IS NOT NULL
    DELETE FROM [__mj].[RecordChange] WHERE [EntityID] = @entityId;

-- 8. User record logs
IF OBJECT_ID('__mj.UserRecordLog', 'U') IS NOT NULL
    DELETE FROM [__mj].[UserRecordLog] WHERE [EntityID] = @entityId;

-- 9. Application entity associations
IF OBJECT_ID('__mj.UserApplicationEntity', 'U') IS NOT NULL
    DELETE FROM [__mj].[UserApplicationEntity] WHERE [EntityID] = @entityId;

IF OBJECT_ID('__mj.ApplicationEntity', 'U') IS NOT NULL
    DELETE FROM [__mj].[ApplicationEntity] WHERE [EntityID] = @entityId;

-- 10. Entity settings
IF OBJECT_ID('__mj.EntitySetting', 'U') IS NOT NULL
    DELETE FROM [__mj].[EntitySetting] WHERE [EntityID] = @entityId;

-- 11. Entity relationships
IF OBJECT_ID('__mj.EntityRelationship', 'U') IS NOT NULL
    DELETE FROM [__mj].[EntityRelationship] WHERE [EntityID] = @entityId OR [RelatedEntityID] = @entityId;

-- 12. Entity permissions
IF OBJECT_ID('__mj.EntityPermission', 'U') IS NOT NULL
    DELETE FROM [__mj].[EntityPermission] WHERE [EntityID] = @entityId;

-- 13. Entity field values (value list constraints)
IF OBJECT_ID('__mj.EntityFieldValue', 'U') IS NOT NULL
    DELETE FROM [__mj].[EntityFieldValue] WHERE [EntityFieldID] IN (SELECT ID FROM [__mj].[EntityField] WHERE EntityID = @entityId);

-- 14. Entity fields
IF OBJECT_ID('__mj.EntityField', 'U') IS NOT NULL
    DELETE FROM [__mj].[EntityField] WHERE [EntityID] = @entityId;

-- 14b. Queries, query entities, query fields and views referencing this entity
IF OBJECT_ID('__mj.QueryField', 'U') IS NOT NULL
    DELETE FROM [__mj].[QueryField] WHERE [SourceEntityID] = @entityId;

IF OBJECT_ID('__mj.QueryEntity', 'U') IS NOT NULL
    DELETE FROM [__mj].[QueryEntity] WHERE [EntityID] = @entityId;

IF OBJECT_ID('__mj.UserViewRun', 'U') IS NOT NULL
    DELETE FROM [__mj].[UserViewRun] WHERE [UserViewID] IN (SELECT [ID] FROM [__mj].[UserView] WHERE [EntityID] = @entityId);

IF OBJECT_ID('__mj.UserView', 'U') IS NOT NULL
    DELETE FROM [__mj].[UserView] WHERE [EntityID] = @entityId;

-- 15. Core Entity entry
IF OBJECT_ID('__mj.Entity', 'U') IS NOT NULL
    DELETE FROM [__mj].[Entity] WHERE [ID] = @entityId;

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
