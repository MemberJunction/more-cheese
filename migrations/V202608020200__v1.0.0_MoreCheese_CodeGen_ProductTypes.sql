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

IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityFieldValue] WHERE [ID] = '86f3e458-2e60-4824-b9f8-2f59c48170c3')
INSERT INTO [${mjSchema}].[EntityFieldValue]
                                       ([ID], [EntityFieldID], [Sequence], [Value], [Code], [__mj_CreatedAt], [__mj_UpdatedAt])
                                    VALUES
                                       ('86f3e458-2e60-4824-b9f8-2f59c48170c3', 'C84BD915-D049-4997-84FD-8773BE459C01', 1, 'Certification', 'Certification', GETUTCDATE(), GETUTCDATE());
GO
IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityFieldValue] WHERE [ID] = 'a0532c04-e45f-407c-922e-bd0383317c9b')
INSERT INTO [${mjSchema}].[EntityFieldValue]
                                       ([ID], [EntityFieldID], [Sequence], [Value], [Code], [__mj_CreatedAt], [__mj_UpdatedAt])
                                    VALUES
                                       ('a0532c04-e45f-407c-922e-bd0383317c9b', 'C84BD915-D049-4997-84FD-8773BE459C01', 2, 'Competition', 'Competition', GETUTCDATE(), GETUTCDATE());
GO
IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityFieldValue] WHERE [ID] = 'd0744f22-4f3b-42cb-b6e2-e0d115641bcc')
INSERT INTO [${mjSchema}].[EntityFieldValue]
                                       ([ID], [EntityFieldID], [Sequence], [Value], [Code], [__mj_CreatedAt], [__mj_UpdatedAt])
                                    VALUES
                                       ('d0744f22-4f3b-42cb-b6e2-e0d115641bcc', 'C84BD915-D049-4997-84FD-8773BE459C01', 3, 'Donation', 'Donation', GETUTCDATE(), GETUTCDATE());
GO
IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityFieldValue] WHERE [ID] = '6abc0617-21a3-4d69-9e38-afecc5d942be')
INSERT INTO [${mjSchema}].[EntityFieldValue]
                                       ([ID], [EntityFieldID], [Sequence], [Value], [Code], [__mj_CreatedAt], [__mj_UpdatedAt])
                                    VALUES
                                       ('6abc0617-21a3-4d69-9e38-afecc5d942be', 'C84BD915-D049-4997-84FD-8773BE459C01', 5, 'JobPosting', 'JobPosting', GETUTCDATE(), GETUTCDATE());
GO
IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityFieldValue] WHERE [ID] = 'd3f58cb2-0f97-4ca1-a125-c7a51a243e3a')
INSERT INTO [${mjSchema}].[EntityFieldValue]
                                       ([ID], [EntityFieldID], [Sequence], [Value], [Code], [__mj_CreatedAt], [__mj_UpdatedAt])
                                    VALUES
                                       ('d3f58cb2-0f97-4ca1-a125-c7a51a243e3a', 'C84BD915-D049-4997-84FD-8773BE459C01', 7, 'Merchandise', 'Merchandise', GETUTCDATE(), GETUTCDATE());
GO
IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityFieldValue] WHERE [ID] = '35be9260-2c7b-4582-8b2b-8e70872d0683')
INSERT INTO [${mjSchema}].[EntityFieldValue]
                                       ([ID], [EntityFieldID], [Sequence], [Value], [Code], [__mj_CreatedAt], [__mj_UpdatedAt])
                                    VALUES
                                       ('35be9260-2c7b-4582-8b2b-8e70872d0683', 'C84BD915-D049-4997-84FD-8773BE459C01', 8, 'Publication', 'Publication', GETUTCDATE(), GETUTCDATE());
GO
IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityFieldValue] WHERE [ID] = 'e358ded2-7775-4767-8ae6-be7adc59ee28')
INSERT INTO [${mjSchema}].[EntityFieldValue]
                                       ([ID], [EntityFieldID], [Sequence], [Value], [Code], [__mj_CreatedAt], [__mj_UpdatedAt])
                                    VALUES
                                       ('e358ded2-7775-4767-8ae6-be7adc59ee28', 'C84BD915-D049-4997-84FD-8773BE459C01', 9, 'Sponsorship', 'Sponsorship', GETUTCDATE(), GETUTCDATE());
GO
