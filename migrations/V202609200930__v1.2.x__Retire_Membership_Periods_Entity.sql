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

-- 5b. Record process watermarks
IF OBJECT_ID('${mjSchema}.RecordProcessWatermark', 'U') IS NOT NULL
    DELETE FROM [${mjSchema}].[RecordProcessWatermark] 
    WHERE [EntityID] = @entityId 
       OR [RecordProcessID] IN (SELECT [ID] FROM [${mjSchema}].[RecordProcess] WHERE [EntityID] = @entityId);

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

-- 14c. Pinned Queries and User Views referencing retired vwMembershipPeriods
IF OBJECT_ID('${mjSchema}.QueryField', 'U') IS NOT NULL
    DELETE FROM [${mjSchema}].[QueryField] WHERE [QueryID] IN (
        '04DC85EF-583E-4D2A-A8DD-DD0B5972A5C7',
        '188341AE-1B9B-4E92-B668-AB8B8FF81BC7',
        '1A8CF27F-EB6F-4E96-9D68-CFD0E056FC0A',
        '20C3F9C9-9C9F-404E-AB0B-01BB3BE8E782',
        '279CC0ED-1AE8-438B-AA72-4F2497E57896',
        '370F9B87-E39C-4394-A55F-077B70C51106',
        '3879A59D-87B6-4061-BE2F-3FCEC6585508',
        '6012D5AA-2580-406E-9523-2D19CA18C036',
        '6BBE8897-03BB-44CA-AB22-4EFACFD91450',
        '86D957A8-1125-4091-B662-6ED0403A75E9',
        '8770A736-D96A-4B47-BC55-F95214E5083F',
        '970F0F7B-454C-422F-86C8-AB631429B947',
        'AFEAE5C5-127D-47D7-A480-E1ABB95F47D6',
        'CBDDD0E4-3DCA-41A7-8F4D-C4EE65D54ABA',
        'E710AC9D-EC60-4CE6-88D0-C0A50A75FB9A'
    );

IF OBJECT_ID('${mjSchema}.QueryEntity', 'U') IS NOT NULL
    DELETE FROM [${mjSchema}].[QueryEntity] WHERE [QueryID] IN (
        '04DC85EF-583E-4D2A-A8DD-DD0B5972A5C7',
        '188341AE-1B9B-4E92-B668-AB8B8FF81BC7',
        '1A8CF27F-EB6F-4E96-9D68-CFD0E056FC0A',
        '20C3F9C9-9C9F-404E-AB0B-01BB3BE8E782',
        '279CC0ED-1AE8-438B-AA72-4F2497E57896',
        '370F9B87-E39C-4394-A55F-077B70C51106',
        '3879A59D-87B6-4061-BE2F-3FCEC6585508',
        '6012D5AA-2580-406E-9523-2D19CA18C036',
        '6BBE8897-03BB-44CA-AB22-4EFACFD91450',
        '86D957A8-1125-4091-B662-6ED0403A75E9',
        '8770A736-D96A-4B47-BC55-F95214E5083F',
        '970F0F7B-454C-422F-86C8-AB631429B947',
        'AFEAE5C5-127D-47D7-A480-E1ABB95F47D6',
        'CBDDD0E4-3DCA-41A7-8F4D-C4EE65D54ABA',
        'E710AC9D-EC60-4CE6-88D0-C0A50A75FB9A'
    );

IF OBJECT_ID('${mjSchema}.QueryPermission', 'U') IS NOT NULL
    DELETE FROM [${mjSchema}].[QueryPermission] WHERE [QueryID] IN (
        '04DC85EF-583E-4D2A-A8DD-DD0B5972A5C7',
        '188341AE-1B9B-4E92-B668-AB8B8FF81BC7',
        '1A8CF27F-EB6F-4E96-9D68-CFD0E056FC0A',
        '20C3F9C9-9C9F-404E-AB0B-01BB3BE8E782',
        '279CC0ED-1AE8-438B-AA72-4F2497E57896',
        '370F9B87-E39C-4394-A55F-077B70C51106',
        '3879A59D-87B6-4061-BE2F-3FCEC6585508',
        '6012D5AA-2580-406E-9523-2D19CA18C036',
        '6BBE8897-03BB-44CA-AB22-4EFACFD91450',
        '86D957A8-1125-4091-B662-6ED0403A75E9',
        '8770A736-D96A-4B47-BC55-F95214E5083F',
        '970F0F7B-454C-422F-86C8-AB631429B947',
        'AFEAE5C5-127D-47D7-A480-E1ABB95F47D6',
        'CBDDD0E4-3DCA-41A7-8F4D-C4EE65D54ABA',
        'E710AC9D-EC60-4CE6-88D0-C0A50A75FB9A'
    );

IF OBJECT_ID('${mjSchema}.QueryParameter', 'U') IS NOT NULL
    DELETE FROM [${mjSchema}].[QueryParameter] WHERE [QueryID] IN (
        '04DC85EF-583E-4D2A-A8DD-DD0B5972A5C7',
        '188341AE-1B9B-4E92-B668-AB8B8FF81BC7',
        '1A8CF27F-EB6F-4E96-9D68-CFD0E056FC0A',
        '20C3F9C9-9C9F-404E-AB0B-01BB3BE8E782',
        '279CC0ED-1AE8-438B-AA72-4F2497E57896',
        '370F9B87-E39C-4394-A55F-077B70C51106',
        '3879A59D-87B6-4061-BE2F-3FCEC6585508',
        '6012D5AA-2580-406E-9523-2D19CA18C036',
        '6BBE8897-03BB-44CA-AB22-4EFACFD91450',
        '86D957A8-1125-4091-B662-6ED0403A75E9',
        '8770A736-D96A-4B47-BC55-F95214E5083F',
        '970F0F7B-454C-422F-86C8-AB631429B947',
        'AFEAE5C5-127D-47D7-A480-E1ABB95F47D6',
        'CBDDD0E4-3DCA-41A7-8F4D-C4EE65D54ABA',
        'E710AC9D-EC60-4CE6-88D0-C0A50A75FB9A'
    );

IF OBJECT_ID('${mjSchema}.QueryDependency', 'U') IS NOT NULL
    DELETE FROM [${mjSchema}].[QueryDependency] WHERE [QueryID] IN (
        '04DC85EF-583E-4D2A-A8DD-DD0B5972A5C7',
        '188341AE-1B9B-4E92-B668-AB8B8FF81BC7',
        '1A8CF27F-EB6F-4E96-9D68-CFD0E056FC0A',
        '20C3F9C9-9C9F-404E-AB0B-01BB3BE8E782',
        '279CC0ED-1AE8-438B-AA72-4F2497E57896',
        '370F9B87-E39C-4394-A55F-077B70C51106',
        '3879A59D-87B6-4061-BE2F-3FCEC6585508',
        '6012D5AA-2580-406E-9523-2D19CA18C036',
        '6BBE8897-03BB-44CA-AB22-4EFACFD91450',
        '86D957A8-1125-4091-B662-6ED0403A75E9',
        '8770A736-D96A-4B47-BC55-F95214E5083F',
        '970F0F7B-454C-422F-86C8-AB631429B947',
        'AFEAE5C5-127D-47D7-A480-E1ABB95F47D6',
        'CBDDD0E4-3DCA-41A7-8F4D-C4EE65D54ABA',
        'E710AC9D-EC60-4CE6-88D0-C0A50A75FB9A'
    ) OR [DependsOnQueryID] IN (
        '04DC85EF-583E-4D2A-A8DD-DD0B5972A5C7',
        '188341AE-1B9B-4E92-B668-AB8B8FF81BC7',
        '1A8CF27F-EB6F-4E96-9D68-CFD0E056FC0A',
        '20C3F9C9-9C9F-404E-AB0B-01BB3BE8E782',
        '279CC0ED-1AE8-438B-AA72-4F2497E57896',
        '370F9B87-E39C-4394-A55F-077B70C51106',
        '3879A59D-87B6-4061-BE2F-3FCEC6585508',
        '6012D5AA-2580-406E-9523-2D19CA18C036',
        '6BBE8897-03BB-44CA-AB22-4EFACFD91450',
        '86D957A8-1125-4091-B662-6ED0403A75E9',
        '8770A736-D96A-4B47-BC55-F95214E5083F',
        '970F0F7B-454C-422F-86C8-AB631429B947',
        'AFEAE5C5-127D-47D7-A480-E1ABB95F47D6',
        'CBDDD0E4-3DCA-41A7-8F4D-C4EE65D54ABA',
        'E710AC9D-EC60-4CE6-88D0-C0A50A75FB9A'
    );

IF OBJECT_ID('${mjSchema}.QuerySQL', 'U') IS NOT NULL
    DELETE FROM [${mjSchema}].[QuerySQL] WHERE [QueryID] IN (
        '04DC85EF-583E-4D2A-A8DD-DD0B5972A5C7',
        '188341AE-1B9B-4E92-B668-AB8B8FF81BC7',
        '1A8CF27F-EB6F-4E96-9D68-CFD0E056FC0A',
        '20C3F9C9-9C9F-404E-AB0B-01BB3BE8E782',
        '279CC0ED-1AE8-438B-AA72-4F2497E57896',
        '370F9B87-E39C-4394-A55F-077B70C51106',
        '3879A59D-87B6-4061-BE2F-3FCEC6585508',
        '6012D5AA-2580-406E-9523-2D19CA18C036',
        '6BBE8897-03BB-44CA-AB22-4EFACFD91450',
        '86D957A8-1125-4091-B662-6ED0403A75E9',
        '8770A736-D96A-4B47-BC55-F95214E5083F',
        '970F0F7B-454C-422F-86C8-AB631429B947',
        'AFEAE5C5-127D-47D7-A480-E1ABB95F47D6',
        'CBDDD0E4-3DCA-41A7-8F4D-C4EE65D54ABA',
        'E710AC9D-EC60-4CE6-88D0-C0A50A75FB9A'
    );

-- Null out DataContextItem QueryID references (non-destructive for user saved contexts)
IF OBJECT_ID('${mjSchema}.DataContextItem', 'U') IS NOT NULL
    UPDATE [${mjSchema}].[DataContextItem] SET [QueryID] = NULL WHERE [QueryID] IN (
        '04DC85EF-583E-4D2A-A8DD-DD0B5972A5C7',
        '188341AE-1B9B-4E92-B668-AB8B8FF81BC7',
        '1A8CF27F-EB6F-4E96-9D68-CFD0E056FC0A',
        '20C3F9C9-9C9F-404E-AB0B-01BB3BE8E782',
        '279CC0ED-1AE8-438B-AA72-4F2497E57896',
        '370F9B87-E39C-4394-A55F-077B70C51106',
        '3879A59D-87B6-4061-BE2F-3FCEC6585508',
        '6012D5AA-2580-406E-9523-2D19CA18C036',
        '6BBE8897-03BB-44CA-AB22-4EFACFD91450',
        '86D957A8-1125-4091-B662-6ED0403A75E9',
        '8770A736-D96A-4B47-BC55-F95214E5083F',
        '970F0F7B-454C-422F-86C8-AB631429B947',
        'AFEAE5C5-127D-47D7-A480-E1ABB95F47D6',
        'CBDDD0E4-3DCA-41A7-8F4D-C4EE65D54ABA',
        'E710AC9D-EC60-4CE6-88D0-C0A50A75FB9A'
    );

IF OBJECT_ID('${mjSchema}.Query', 'U') IS NOT NULL
    DELETE FROM [${mjSchema}].[Query] WHERE [ID] IN (
        '04DC85EF-583E-4D2A-A8DD-DD0B5972A5C7',
        '188341AE-1B9B-4E92-B668-AB8B8FF81BC7',
        '1A8CF27F-EB6F-4E96-9D68-CFD0E056FC0A',
        '20C3F9C9-9C9F-404E-AB0B-01BB3BE8E782',
        '279CC0ED-1AE8-438B-AA72-4F2497E57896',
        '370F9B87-E39C-4394-A55F-077B70C51106',
        '3879A59D-87B6-4061-BE2F-3FCEC6585508',
        '6012D5AA-2580-406E-9523-2D19CA18C036',
        '6BBE8897-03BB-44CA-AB22-4EFACFD91450',
        '86D957A8-1125-4091-B662-6ED0403A75E9',
        '8770A736-D96A-4B47-BC55-F95214E5083F',
        '970F0F7B-454C-422F-86C8-AB631429B947',
        'AFEAE5C5-127D-47D7-A480-E1ABB95F47D6',
        'CBDDD0E4-3DCA-41A7-8F4D-C4EE65D54ABA',
        'E710AC9D-EC60-4CE6-88D0-C0A50A75FB9A'
    );

IF OBJECT_ID('${mjSchema}.ResourcePermission', 'U') IS NOT NULL
    DELETE FROM [${mjSchema}].[ResourcePermission] WHERE [ID] = 'EB75A6AC-46A4-562D-8708-06309E5480BA' OR [ResourceRecordID] = 'F770DD7A-032E-553C-B144-07655C3CC700';

-- Null out DataContextItem ViewID references
IF OBJECT_ID('${mjSchema}.DataContextItem', 'U') IS NOT NULL
    UPDATE [${mjSchema}].[DataContextItem] SET [ViewID] = NULL 
    WHERE [ViewID] IN (SELECT [ID] FROM [${mjSchema}].[UserView] WHERE [EntityID] = @entityId)
       OR [ViewID] = 'F770DD7A-032E-553C-B144-07655C3CC700';

IF OBJECT_ID('${mjSchema}.UserViewRun', 'U') IS NOT NULL
    DELETE FROM [${mjSchema}].[UserViewRun] WHERE [UserViewID] = 'F770DD7A-032E-553C-B144-07655C3CC700';

IF OBJECT_ID('${mjSchema}.UserView', 'U') IS NOT NULL
    DELETE FROM [${mjSchema}].[UserView] WHERE [ID] = 'F770DD7A-032E-553C-B144-07655C3CC700';

-- 14d. Live-host runtime references to retired Entity
IF OBJECT_ID('${mjSchema}.DataContextItem', 'U') IS NOT NULL
    UPDATE [${mjSchema}].[DataContextItem] SET [EntityID] = NULL WHERE [EntityID] = @entityId;

IF OBJECT_ID('${mjSchema}.UserFavorite', 'U') IS NOT NULL
    DELETE FROM [${mjSchema}].[UserFavorite] WHERE [EntityID] = @entityId;

IF OBJECT_ID('${mjSchema}.TaggedItem', 'U') IS NOT NULL
    DELETE FROM [${mjSchema}].[TaggedItem] WHERE [EntityID] = @entityId;

IF OBJECT_ID('${mjSchema}.AuditLog', 'U') IS NOT NULL
    DELETE FROM [${mjSchema}].[AuditLog] WHERE [EntityID] = @entityId;

IF OBJECT_ID('${mjSchema}.List', 'U') IS NOT NULL
    DELETE FROM [${mjSchema}].[List] WHERE [EntityID] = @entityId;

IF OBJECT_ID('${mjSchema}.RecordLink', 'U') IS NOT NULL
    DELETE FROM [${mjSchema}].[RecordLink] WHERE [SourceEntityID] = @entityId OR [TargetEntityID] = @entityId;

IF OBJECT_ID('${mjSchema}.Conversation', 'U') IS NOT NULL
    DELETE FROM [${mjSchema}].[Conversation] WHERE [LinkedEntityID] = @entityId;

IF OBJECT_ID('${mjSchema}.AIAgentRun', 'U') IS NOT NULL
    DELETE FROM [${mjSchema}].[AIAgentRun] WHERE [PrimaryScopeEntityID] = @entityId;

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
