-- CodeGen metadata for the widened Product.ProductType CHECK: the new permitted values
-- registered as EntityFieldValue rows, so the entity layer and Explorer offer them.
--
-- Contains ONLY the metadata inserts that belong to this app. Deliberately excluded, as
-- CodeGen re-applies them on every instance: spUpdateExistingEntitiesFromSchema,
-- spUpdateExistingEntityFieldsFromSchema, spSetDefaultColumnWidthWhereNeeded and
-- spUpdateSchemaInfoFromDatabase.
--
-- No view or procedure regeneration is needed: widening a CHECK does not change the
-- table's columns. IssueComment is likewise absent — it belongs to bizapps-issues, whose
-- own metadata-sync owns its registration (runbook F5).
--
-- Each insert is guarded on its pinned ID: CodeGen inserts these rows itself when it
-- runs, so an unguarded replay fails on a duplicate key against any database where it
-- already has.
-- EntityFieldID RESOLVED BY NAME, not hardcoded. CodeGen mints EntityField.ID freshly on
-- every instance, so the literal id this migration used to carry ('C84BD915-...') existed only
-- on the database it was authored against and failed everywhere else with
-- FK_EntityFieldValue_EntityField. Same lesson as runbook F6, one level down: anything CodeGen
-- generates must be looked up, never pinned. Kept as ONE batch so the DECLARE is in scope for
-- every insert (a GO would end it).

DECLARE @EF_ProductType UNIQUEIDENTIFIER = (
    SELECT ef.ID FROM [${mjSchema}].[EntityField] ef
    JOIN [${mjSchema}].[Entity] e ON e.ID = ef.EntityID
    WHERE e.Name = N'MoreCheese: Products' AND ef.Name = N'ProductType'
);
IF @EF_ProductType IS NULL
    THROW 50000, N'ProductTypes migration: EntityField MoreCheese: Products.ProductType not found — run mj codegen before this migration.', 1;

IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityFieldValue] WHERE [ID] = '86f3e458-2e60-4824-b9f8-2f59c48170c3')
    INSERT INTO [${mjSchema}].[EntityFieldValue] ([ID], [EntityFieldID], [Sequence], [Value], [Code], [__mj_CreatedAt], [__mj_UpdatedAt])
    VALUES ('86f3e458-2e60-4824-b9f8-2f59c48170c3', @EF_ProductType, 1, N'Certification', N'Certification', GETUTCDATE(), GETUTCDATE());
IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityFieldValue] WHERE [ID] = 'a0532c04-e45f-407c-922e-bd0383317c9b')
    INSERT INTO [${mjSchema}].[EntityFieldValue] ([ID], [EntityFieldID], [Sequence], [Value], [Code], [__mj_CreatedAt], [__mj_UpdatedAt])
    VALUES ('a0532c04-e45f-407c-922e-bd0383317c9b', @EF_ProductType, 2, N'Competition', N'Competition', GETUTCDATE(), GETUTCDATE());
IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityFieldValue] WHERE [ID] = 'd0744f22-4f3b-42cb-b6e2-e0d115641bcc')
    INSERT INTO [${mjSchema}].[EntityFieldValue] ([ID], [EntityFieldID], [Sequence], [Value], [Code], [__mj_CreatedAt], [__mj_UpdatedAt])
    VALUES ('d0744f22-4f3b-42cb-b6e2-e0d115641bcc', @EF_ProductType, 3, N'Donation', N'Donation', GETUTCDATE(), GETUTCDATE());
IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityFieldValue] WHERE [ID] = '6abc0617-21a3-4d69-9e38-afecc5d942be')
    INSERT INTO [${mjSchema}].[EntityFieldValue] ([ID], [EntityFieldID], [Sequence], [Value], [Code], [__mj_CreatedAt], [__mj_UpdatedAt])
    VALUES ('6abc0617-21a3-4d69-9e38-afecc5d942be', @EF_ProductType, 5, N'JobPosting', N'JobPosting', GETUTCDATE(), GETUTCDATE());
IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityFieldValue] WHERE [ID] = 'd3f58cb2-0f97-4ca1-a125-c7a51a243e3a')
    INSERT INTO [${mjSchema}].[EntityFieldValue] ([ID], [EntityFieldID], [Sequence], [Value], [Code], [__mj_CreatedAt], [__mj_UpdatedAt])
    VALUES ('d3f58cb2-0f97-4ca1-a125-c7a51a243e3a', @EF_ProductType, 7, N'Merchandise', N'Merchandise', GETUTCDATE(), GETUTCDATE());
IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityFieldValue] WHERE [ID] = '35be9260-2c7b-4582-8b2b-8e70872d0683')
    INSERT INTO [${mjSchema}].[EntityFieldValue] ([ID], [EntityFieldID], [Sequence], [Value], [Code], [__mj_CreatedAt], [__mj_UpdatedAt])
    VALUES ('35be9260-2c7b-4582-8b2b-8e70872d0683', @EF_ProductType, 8, N'Publication', N'Publication', GETUTCDATE(), GETUTCDATE());
IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityFieldValue] WHERE [ID] = 'e358ded2-7775-4767-8ae6-be7adc59ee28')
    INSERT INTO [${mjSchema}].[EntityFieldValue] ([ID], [EntityFieldID], [Sequence], [Value], [Code], [__mj_CreatedAt], [__mj_UpdatedAt])
    VALUES ('e358ded2-7775-4767-8ae6-be7adc59ee28', @EF_ProductType, 9, N'Sponsorship', N'Sponsorship', GETUTCDATE(), GETUTCDATE());
GO
