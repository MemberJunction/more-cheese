-- =============================================================================================
-- MoreCheese teardown — retire this app's rows and its undeclared schemas on `mj app remove`
-- =============================================================================================
-- ⚠️ GENERATED — DO NOT HAND-EDIT. Produced by `scripts/generate-teardown.mjs` (`npm run
-- generate:teardown`). Every id below is read out of the file that creates it — `config/` for the
-- application configuration, `B202607141200__v1.0.0_MoreCheese_Baseline.sql` for the entity and application rows — so the delete list
-- matches the insert list by construction. Regenerate whenever `config/` or the baseline changes.
--
-- ── WHY THIS FILE EXISTS AT ALL: more-cheese IS MULTI-SCHEMA ─────────────────────────────────
-- `mj app remove` operates on ONE schema: `existingApp.SchemaName`, which is `schema.name` in
-- mj-app.json — `morecheese_members`. It walks the foreign-key graph out from that schema's
-- `__mj.Entity` rows, retires app-owned Applications and SchemaInfo, and drops that schema.
--
-- This app creates THREE schemas. `morecheese_events` and `morecheese_learning` are created by the
-- baseline as literal names, and MJ has never heard of them. Without this file they survive an
-- uninstall — schemas, tables, views, CRUD procedures, triggers, rows — as do the `__mj.Entity` rows
-- for their seven entities and everything hanging off those. The next install then re-inserts the
-- same fixed UUIDs and collides on the primary key.
--
-- ── WHAT THIS REMOVES ────────────────────────────────────────────────────────────────────────
--   1. The application configuration `config/` seeds, resolved to its tables through the host's own
--      `__mj.Entity` by entity NAME — never by a table name baked in here, so a sibling app that
--      installed itself into a different schema still resolves.
--   2. All 12 `__mj.Entity` rows the baseline creates, for all three schemas:
--    3 in morecheese_events
--    4 in morecheese_learning
--    5 in morecheese_members (declared)
--      The 5 in the declared schema are retired by `mj app remove` too; repeating them is
--      deliberate, so that this file's correctness does not depend on guessing what MJ already did.
--      Both deletes are idempotent — whichever runs second finds nothing.
--   3. The `__mj.Application` row the baseline creates for this app.
--   4. Everything the foreign-key graph says depends on the above, discovered AT APPLY TIME.
--   5. The `morecheese_events` and `morecheese_learning` schemas and every object in them.
--
-- ── WHAT THIS DELIBERATELY LEAVES ────────────────────────────────────────────────────────────
--   • The 121,661 demo records under `generated/`. Those are rows in NINE SIBLING APPS' schemas
--     (orders, forms, tasks, issues, common, accounting, committees, secure-messaging) — not in any
--     schema this app owns. See migrations-teardown/README.md: retiring them is a real and separate
--     question, and this file does not answer it.
--   • Any row a NULLABLE foreign key points at ours with. That row belongs to the customer and
--     merely references ours; the reference is released and the row kept.
--   • `morecheese_members` itself. MJ drops it, and a second DROP SCHEMA would fail on a condition
--     that is not an error.
--
-- ── HOW IT ORDERS DELETES ────────────────────────────────────────────────────────────────────
-- It does not. An earlier version of the caliber original this is ported from deleted in reverse
-- seed order, which only orders rows the SEED created — a real install also has runtime children
-- (prompt runs, execution logs, user-application grants, dashboard state, conversation details) that
-- blocked 11 of its deletes on a used database while passing cleanly on a pristine canary. Instead
-- the ids below seed a doomed set, and the engine discovers dependents from `sys.foreign_keys` at
-- apply time: a NULLABLE reference is set to NULL, a NOT NULL reference is deleted and joins the
-- doomed set.
--
-- ── RUNTIME ──────────────────────────────────────────────────────────────────────────────────
-- MJ executes this file as ONE statement inside ONE transaction and rolls everything back on error,
-- so there is no `GO` here and no partial application. Exactly one placeholder is substituted: the
-- core schema. The app-schema placeholder used by regular migrations is NOT substituted at teardown
-- time and must never appear — which is why the two sibling schemas are written literally.
--
-- ⚠️ NOT TESTED AGAINST A DATABASE. This was generated and reviewed statically;
-- `scripts/generate-teardown.spec.mjs` checks its structure DB-free. It must be applied against a
-- used database (not a pristine canary — that is the blind spot caliber's rewrite exists to remove)
-- before the release.
--
-- Seed provenance (350 distinct records; 376 declared across
-- 37 directories, 26 of them declared in two directories and inserted once):
--     75 from config/conversations
--     46 from config/artifacts
--     44 from config/query-categories
--     29 from config/queries
--     25 from config/conversations-owner
--     23 from config/conversation-detail-artifacts
--     23 from config/resource-permissions
--     23 from config/user-views
--     19 from config/user-applications
--     10 from config/sonar-factors
--     10 from config/sonar-model-factors
--     10 from config/sonar-model-related-entities
--      4 from config/dashboard-category-links
--      4 from config/dashboards
--      4 from config/sonar-score-bands
--      2 from config/application-roles
--      2 from config/content-sources
--      2 from config/file-storage-account-permissions
--      2 from config/sonar-time-windows
--      2 from config/user-roles
--      1 from config/ai-model-vendors
--      1 from config/ai-models
--      1 from config/ai-vendors
--      1 from config/content-types
--      1 from config/credential-types
--      1 from config/credentials
--      1 from config/dashboard-categories
--      1 from config/file-storage-accounts
--      1 from config/file-storage-providers
--      1 from config/projects
--      1 from config/sonar-score-band-sets
--      1 from config/sonar-score-model-versions
--      1 from config/sonar-score-models
--      1 from config/sonar-score-models-activate
--      1 from config/user-settings
--      1 from config/users
--      1 from config/vector-indexes
-- =============================================================================================

CREATE TABLE #MoreCheeseSeed (
    EntityName NVARCHAR(255)     NOT NULL,
    RowID      UNIQUEIDENTIFIER  NOT NULL,
    PRIMARY KEY (EntityName, RowID)
);

CREATE TABLE #MoreCheeseDoomed (
    SchemaName sysname          NOT NULL,
    TableName  sysname          NOT NULL,
    RowID      UNIQUEIDENTIFIER NOT NULL,
    Depth      INT              NOT NULL,
    PRIMARY KEY (SchemaName, TableName, RowID)
);

-- ── The application configuration this app seeds, by entity name ──────────────────────────────
INSERT INTO #MoreCheeseSeed (EntityName, RowID) VALUES
    ('MJ: AI Model Vendors', '832E6ECA-62AC-57AA-B6D8-9408A37E3084'),
    ('MJ: AI Models', 'D6B3CFD1-6C41-5A26-B89F-54C875097FA6'),
    ('MJ: AI Vendors', 'EB93BD78-D94F-5EB4-A88D-7B73DA2C8B6F'),
    ('MJ: Application Roles', 'A1B2C3D4-0001-4E5F-8A9B-0C1D2E3F4A05'),
    ('MJ: Application Roles', 'A1B2C3D4-0002-4E5F-8A9B-0C1D2E3F4A05'),
    ('MJ: Artifacts', '1F5239A1-C733-482E-A532-F3463BB6273A'),
    ('MJ: Artifacts', '72F2C5DC-D43A-4246-957D-BED97DDC0ED6'),
    ('MJ: Artifacts', '203BF433-249D-4D72-9FB8-BF8E63648134'),
    ('MJ: Artifacts', 'C6144C9E-46DC-4AA3-A824-5BAF9C5F38F2'),
    ('MJ: Artifacts', '26D09E7B-C75C-46B9-96F4-B7A548571C12'),
    ('MJ: Artifacts', '2EFFD076-9680-4BA1-B8F4-2E8F5780158C'),
    ('MJ: Artifacts', '3A252DFD-F112-44F3-849D-6F7D9FFC7C36'),
    ('MJ: Artifacts', 'C3CAC88C-4386-4C1A-A807-312858AECDCA'),
    ('MJ: Artifacts', '4174B4F7-8AC7-4ABC-A1CF-3092055F22EE'),
    ('MJ: Artifacts', '08EC21DC-9F49-40D6-8434-120AF288C9FA'),
    ('MJ: Artifacts', '5117E7AB-B26E-4134-9939-E4E0DBFEC681'),
    ('MJ: Artifacts', 'D1B7EC0C-E744-42F8-AB92-CA0F9E623A03'),
    ('MJ: Artifacts', '658DBCA2-240F-43BC-9820-FBA04346443F'),
    ('MJ: Artifacts', '6D66DB4B-490C-4210-AB6D-EAEE2BBA38DE'),
    ('MJ: Artifacts', '7447D869-5A52-4A8E-B3BA-6A925D38F130'),
    ('MJ: Artifacts', 'AA8EDB9F-3AE6-4D73-B3D9-E49585A12F0F'),
    ('MJ: Artifacts', '796C1596-D4C8-4FBF-B89E-4E694819214E'),
    ('MJ: Artifacts', 'D1CDB540-C1AE-4695-B6E3-9F1C3CAD38AE'),
    ('MJ: Artifacts', '7A1FCDF0-F093-4D67-A0BF-0831AFF4A828'),
    ('MJ: Artifacts', 'FB130F4D-006E-4812-B070-927638C40BB9'),
    ('MJ: Artifacts', '7E649D63-AA1B-46E2-AEB9-68DD862E75AA'),
    ('MJ: Artifacts', '21FA12A7-B30A-4E73-9B54-5F6F5472C5E0'),
    ('MJ: Artifacts', '854C09A0-7970-4226-BD2F-2301DD78CCFE'),
    ('MJ: Artifacts', 'C226F9CF-1A06-4515-A9F7-D536F481E0DC'),
    ('MJ: Artifacts', '8B5D7CFF-7F67-4F2C-9B0D-EAA37DCA459C'),
    ('MJ: Artifacts', '6CFB2DCA-C2D7-4F08-9B1E-070168278ED0'),
    ('MJ: Artifacts', '91F5060A-6546-4896-B1F1-F48F1342A087'),
    ('MJ: Artifacts', '4274B342-079A-4D3A-8209-09757EDECFE5'),
    ('MJ: Artifacts', '991F9C55-CCDB-46C4-A32F-B356B28E7C48'),
    ('MJ: Artifacts', 'A0EEF06E-47D3-4CA4-BDAD-CE57EEAB6F75'),
    ('MJ: Artifacts', '9A79B469-A6BB-4324-A052-E30428E4DA1C'),
    ('MJ: Artifacts', 'F819AFB3-EEDB-464B-9C1C-B1A008C1FDC7'),
    ('MJ: Artifacts', 'B28756D9-4DB5-404F-8D1B-18AA757FFF58'),
    ('MJ: Artifacts', '5512EA5E-6FC4-41B9-8B54-B7F7C42D56AA'),
    ('MJ: Artifacts', 'B320F3A4-27B2-4205-A3A7-6D1CEE56B968'),
    ('MJ: Artifacts', 'C6895E4E-4376-462B-823B-B8CB96A5FFCC'),
    ('MJ: Artifacts', 'C357C457-3DB9-4D74-B586-13F9F2CF9FBA'),
    ('MJ: Artifacts', '35FA169F-D914-4EC2-B615-459C5C945D97'),
    ('MJ: Artifacts', 'C787998D-8129-43EF-ABA4-8CAA88C76E1D'),
    ('MJ: Artifacts', 'D85344D7-E732-45F7-BE9C-710BE819418A'),
    ('MJ: Artifacts', 'ED9274A3-C4C8-4499-98F3-713050CEA437'),
    ('MJ: Artifacts', '5D99D038-7C05-4D1A-AF63-A21AC105FCCD'),
    ('MJ: Artifacts', 'F34F9B10-AE92-465B-A8DB-C62AEAC5263B'),
    ('MJ: Artifacts', '996ECD05-E8F9-4924-9AE5-F12E041B7A45'),
    ('MJ: Artifacts', 'F70CF3A3-40A1-4821-9606-0ACBFE4487EF'),
    ('MJ: Artifacts', 'C865EE7B-9F39-4755-977D-DB87BA7B1E9A'),
    ('MJ: Content Sources', '8C4E3B2A-5D0F-4A79-9E63-4F9B0C7D8E03'),
    ('MJ: Content Sources', '9D5F4C3B-6E1A-4B8A-AF74-5A0C1D8E9F04'),
    ('MJ: Content Types', '7B3D2A1F-4C9E-4F68-8D52-3E8A9B6C7D02'),
    ('MJ: Conversation Detail Artifacts', '114D0644-DCC4-40A7-81F0-81BF5F1CF8A5'),
    ('MJ: Conversation Detail Artifacts', '11D395E9-0CFB-46B1-B82C-F46D0A53253D'),
    ('MJ: Conversation Detail Artifacts', '29D20F48-8050-42F5-8081-594DF91DE688'),
    ('MJ: Conversation Detail Artifacts', '427A07C1-1FBA-402F-9A9D-32E7C95CAE41'),
    ('MJ: Conversation Detail Artifacts', '471A841A-386A-4DE3-BCE4-678DA8C7AC39'),
    ('MJ: Conversation Detail Artifacts', '4C73AA89-3F78-43CE-807A-FFD58D278812'),
    ('MJ: Conversation Detail Artifacts', '5388D334-2615-421D-A75D-9DEA032301C1'),
    ('MJ: Conversation Detail Artifacts', '62D2E7B0-A51F-43C8-9F88-DC8CBADF427A'),
    ('MJ: Conversation Detail Artifacts', '741EBAF9-A21A-4189-A2DD-2C85634A58F1'),
    ('MJ: Conversation Detail Artifacts', '76D68772-C638-4983-9EA1-1FA5C35191A4'),
    ('MJ: Conversation Detail Artifacts', '82AC7BDB-8CA5-4E0D-88BC-FB33614CFC49'),
    ('MJ: Conversation Detail Artifacts', '88927B61-B899-4481-A1FA-B2DF07700898'),
    ('MJ: Conversation Detail Artifacts', '8BE9A35F-7605-4DD9-A469-9D42DB3467A0'),
    ('MJ: Conversation Detail Artifacts', '92D1A34C-C0CD-457F-A0DA-58935146FF16'),
    ('MJ: Conversation Detail Artifacts', '935A3425-A2A3-406E-AD79-A719D7CA8EAC'),
    ('MJ: Conversation Detail Artifacts', 'AD67DD35-30F7-4602-AF3C-F43351B142E6'),
    ('MJ: Conversation Detail Artifacts', 'B121C37C-52B6-42FC-AD95-A341D20F95F8'),
    ('MJ: Conversation Detail Artifacts', 'C8AD92DB-E760-46DF-BC50-E525AA228AA4'),
    ('MJ: Conversation Detail Artifacts', 'D5603472-CEED-4788-94AD-B5855E8CE56D'),
    ('MJ: Conversation Detail Artifacts', 'D836AB72-468B-4351-8324-B0C6833FACD6'),
    ('MJ: Conversation Detail Artifacts', 'E754D15C-9C7C-404C-BB4B-32A6EDACBD6D'),
    ('MJ: Conversation Detail Artifacts', 'E7DCE07E-93CC-4622-BD2C-611F8BAA2336'),
    ('MJ: Conversation Detail Artifacts', 'EC343966-4F91-4711-A005-A5F09321222A'),
    ('MJ: Conversations', '031AD8A0-2B62-4E5D-B6CB-6BA4C9154643'),
    ('MJ: Conversations', '199C5192-0B99-4089-AD6C-80C269557796'),
    ('MJ: Conversations', 'FDCB8EED-ECBC-4D0A-90EE-13FF9FE84AEF'),
    ('MJ: Conversations', '1A6A59BE-6F7C-4FC0-9B57-664F8FB1C9BB'),
    ('MJ: Conversations', 'F7CBBAE0-5EBE-41DF-B4CF-0F6E2EF47358'),
    ('MJ: Conversations', 'D88986CB-F3C2-4F65-8CA5-238F338CB903'),
    ('MJ: Conversations', '25582A06-9FA6-401F-B737-B0EAAC3DBCFF'),
    ('MJ: Conversations', 'D50EE4B3-FCC2-4F71-B527-670DAB1D5600'),
    ('MJ: Conversations', '1096C88C-E843-4329-B4E0-9467A756F805'),
    ('MJ: Conversations', '27EC6794-7006-461C-9CAB-932544CA93EC'),
    ('MJ: Conversations', 'F4C865B6-5FD9-4851-96CF-9D38BC30EF24'),
    ('MJ: Conversations', '75226484-8061-48CD-BD76-ECA04C97FB9C'),
    ('MJ: Conversations', '3958262D-5C2F-4EE7-9C33-3EC7D293433B'),
    ('MJ: Conversations', '73F5E33B-ED46-4F10-800C-B1ACDAD4F86D'),
    ('MJ: Conversations', '92306ABC-5C34-4E29-8B58-71E592ACDB23'),
    ('MJ: Conversations', '403BD19D-7DAB-44EE-9909-4C6ED28A4082'),
    ('MJ: Conversations', 'CAB6CD9A-357B-4DA9-95BE-1C7B1C106558'),
    ('MJ: Conversations', '8A20E693-66C6-49B8-8E98-0D2C8BE4A95D'),
    ('MJ: Conversations', '4DEDFF0A-2A56-43F6-A045-55ADC420E68D'),
    ('MJ: Conversations', '062588BD-A09B-47B7-A9E0-1578C1A4D5E7'),
    ('MJ: Conversations', '720212C6-E35F-4FCE-8442-12B1FF38C710'),
    ('MJ: Conversations', '4FA88702-C81B-4F1E-B1BD-D114D34FE580'),
    ('MJ: Conversations', '7604680B-78A7-4972-B38F-754F55270DE2'),
    ('MJ: Conversations', '95705806-36E7-4178-88F3-5AE13676A30F'),
    ('MJ: Conversations', '5A66B567-37D1-4259-AADA-886ADD363D70'),
    ('MJ: Conversations', '447E68E1-2D14-4821-B042-F4E3838EC1EE'),
    ('MJ: Conversations', 'A1BBBE70-F4F5-491A-BA8B-30200C820E93'),
    ('MJ: Conversations', '5E3BAEC5-AFAE-4F17-8C4B-E18A552EE7C3'),
    ('MJ: Conversations', '9A521F2E-D481-402D-B38E-CBA74B5928A4'),
    ('MJ: Conversations', 'ADBDF56E-E73F-41BC-81BD-242E4829F3E8'),
    ('MJ: Conversations', '651BA430-DAF2-49E4-902A-230A12706B20'),
    ('MJ: Conversations', 'C2365FCF-FF5E-46FE-86F0-E33B0D1B965C'),
    ('MJ: Conversations', '86C0AE99-41FD-4522-B30E-DAF711528D8E'),
    ('MJ: Conversations', '67021547-E287-482C-AE3C-DEF4DAB040B2'),
    ('MJ: Conversations', 'A3CC15EA-D71B-43B7-8767-50EC88A2F41F'),
    ('MJ: Conversations', '49B0157F-3EB6-44A0-AF7A-16860E8C2431'),
    ('MJ: Conversations', '8127E707-891A-494D-99B1-8D0BE8A8D41E'),
    ('MJ: Conversations', 'D78830D6-034F-40BD-9CE0-C7F56270E151'),
    ('MJ: Conversations', '852FC201-208A-45CC-B708-EAC1DDBFE7F1'),
    ('MJ: Conversations', '89EAFDA2-D366-40C9-89B1-3CC2F93F48FA'),
    ('MJ: Conversations', '81BD240D-2356-4644-A497-DBEDA4749580'),
    ('MJ: Conversations', '9AAE574C-BD4F-4BD0-A496-673681F453F0'),
    ('MJ: Conversations', '8C7C1809-0DDA-4FA7-A80E-77AF322EA5F1'),
    ('MJ: Conversations', 'AEEE395C-56A6-4126-B6A7-55529FA55922'),
    ('MJ: Conversations', '126FAF17-08F7-462B-B61C-86F7A7FC7C74'),
    ('MJ: Conversations', '9B413F4F-18FE-44CA-B225-85080BC24B5B'),
    ('MJ: Conversations', 'E8054A04-35BD-4A1C-94D3-7A465437B908'),
    ('MJ: Conversations', 'A65B3E5F-5DF1-4C2E-96DA-C478576D603B'),
    ('MJ: Conversations', 'A897D981-F62A-440E-8C20-F25CAD6238DC'),
    ('MJ: Conversations', '0A346637-51DD-4402-B3F9-E59183BAE3DA'),
    ('MJ: Conversations', 'DDB5BBB3-B0E0-480B-B482-D77C9919B645'),
    ('MJ: Conversations', 'B32BE779-6F34-4709-8F9F-2096A6D08156'),
    ('MJ: Conversations', '60E1BC4A-09FD-4411-A00D-DAF8B0EA76E0'),
    ('MJ: Conversations', 'C70293F7-1EEB-45FF-8B99-49FF88758DCF'),
    ('MJ: Conversations', 'BB81AA64-2109-4DED-AA5C-CE212FFE75FD'),
    ('MJ: Conversations', '7000482F-ECB7-4538-9527-7B0087FAB563'),
    ('MJ: Conversations', '1A98C62D-2153-4C28-B9A3-34D803BF8426'),
    ('MJ: Conversations', 'C690CB25-AFBA-496F-8CA0-CC6B8EB42C66'),
    ('MJ: Conversations', 'DCED1448-B9CD-406B-9B31-58FC8B2C213D'),
    ('MJ: Conversations', 'C21478C2-882F-485D-B41B-A3D1776214DE'),
    ('MJ: Conversations', 'CABDEACA-5C4C-4CB4-A0D5-E3589C9FA871'),
    ('MJ: Conversations', '3A459751-772F-45A7-819A-5A3E9E78E4EE'),
    ('MJ: Conversations', 'FFFCBFB5-6E36-4610-A3F8-EBB5AD7A00DE'),
    ('MJ: Conversations', 'EB78F09B-E6C3-4FFC-B755-9C1F6CFB3983'),
    ('MJ: Conversations', '82727168-7E30-4A1F-890B-D2C17E5FB1D9'),
    ('MJ: Conversations', '99790239-72F8-416F-92FF-778C6CD15EDE'),
    ('MJ: Conversations', 'F58A352D-8AAF-4ED4-AC11-0D826A83DDB4'),
    ('MJ: Conversations', '683E1B54-EA16-490C-9506-200D31BF011F'),
    ('MJ: Conversations', 'F7F60843-D0AD-4B70-A094-549944E8A191'),
    ('MJ: Conversations', 'F8ADAEAD-0C70-4D6A-9F43-F3C490E5C851'),
    ('MJ: Conversations', 'CF0A9A0B-6568-47D7-829F-EDE0EEF376B0'),
    ('MJ: Conversations', '9C94EB68-9925-4C0D-BB74-671BC1917408'),
    ('MJ: Conversations', 'F92E4123-3627-4D2C-9972-C8556D625410'),
    ('MJ: Conversations', '48D7F31C-BF36-4732-B7A9-57F4075CCDF3'),
    ('MJ: Conversations', '8FFF9237-0DE1-43DA-BEE9-A5725F08C921'),
    ('MJ: Credential Types', '5E7A2C41-9B3D-4F1E-8A6C-2D4B7F9E0C15'),
    ('MJ: Credentials', '7A1E4C2B-5D3F-4E8A-9B6C-2F0D8E1A3C55'),
    ('MJ: Dashboard Categories', '8D2F4A61-3B7C-4E9D-A5F1-2C6B8E0D4A93'),
    ('MJ: Dashboard Category Links', 'C3E5A7B9-1D2F-4A6C-8E0B-4F6D8A2C1E75'),
    ('MJ: Dashboard Category Links', 'BC0DB1F0-35C8-560D-A69D-FCD66A992D2B'),
    ('MJ: Dashboard Category Links', '335DDC9D-47FF-5E8B-B003-0D3EB857A5AE'),
    ('MJ: Dashboard Category Links', '72877428-C78B-5065-95D6-E4236226DD81'),
    ('MJ: Dashboards', '5A7C9E21-4D6B-4F83-B2E7-9C1D3F5A7B60'),
    ('MJ: Dashboards', '9F177261-C909-52F2-8ACF-475613ABFB49'),
    ('MJ: Dashboards', '82858464-5FFD-5DF7-A79E-E6DADD0652CA'),
    ('MJ: Dashboards', '74420F91-79C0-59FF-8E4B-C4A4AFDC4C83'),
    ('MJ: File Storage Account Permissions', '79A45295-2080-56FD-93A4-D995CA5382E7'),
    ('MJ: File Storage Account Permissions', '0ADD75FF-B902-55D7-81AB-DC6535E81749'),
    ('MJ: File Storage Accounts', '636E204B-12CB-4D67-A861-09DA9C825BA3'),
    ('MJ: File Storage Providers', 'C9B9433E-F36B-1410-8DA0-00021F8B792E'),
    ('MJ: Projects', '3C9E1F52-7A4B-4D8E-9B2C-6F1A8D3E5B70'),
    ('MJ: Queries', '01233BE6-F40A-48C0-81F3-A04476E1429F'),
    ('MJ: Queries', '15BCACCF-3411-49B7-9D55-811486068114'),
    ('MJ: Queries', '1C19142E-AD9F-4ABA-A5CE-F43E4147E844'),
    ('MJ: Queries', '2074CD3B-B18D-42AC-8719-C91E16426D29'),
    ('MJ: Queries', '2D3D9981-4E0E-4D75-BD71-E96E0D583EC4'),
    ('MJ: Queries', '4833639C-B08E-4DE8-8D40-736537600210'),
    ('MJ: Queries', '4A6CAD80-4ABB-4057-A278-B91393207D5E'),
    ('MJ: Queries', '69125C05-7700-464E-9C3E-5AB0B3CE3C26'),
    ('MJ: Queries', '6A1D129B-FD58-4B37-A163-6DE69930CF73'),
    ('MJ: Queries', '70DC5BF9-4382-4FBF-8170-BDFB8FB399A4'),
    ('MJ: Queries', '81596FC4-2758-4531-8F5B-9F83CDE9E887'),
    ('MJ: Queries', '88842A4E-84F6-4F91-905F-723E3B1DB8F0'),
    ('MJ: Queries', '89B9E252-9F66-473F-898B-02FB91C96F10'),
    ('MJ: Queries', '8BFDEECF-9767-46F8-8F31-D7ABDD449468'),
    ('MJ: Queries', '96129FA0-3DC9-4329-A5A7-ACE3DD6C4025'),
    ('MJ: Queries', '97AA052D-4305-43EA-A6CE-97A23C7073E7'),
    ('MJ: Queries', 'A438A9E2-55F2-4C19-9D5C-48A8A1BA1286'),
    ('MJ: Queries', 'A94EC844-1672-437A-852B-26763C3E5E2B'),
    ('MJ: Queries', 'B2AD46EF-55E2-4A2E-B12D-AEF35B706283'),
    ('MJ: Queries', 'C3CE64FE-EEAB-4B30-A647-8F89CBE83209'),
    ('MJ: Queries', 'CE78AD75-1CE9-464D-A492-E047064A0317'),
    ('MJ: Queries', 'E30B4FC9-CC3F-4F35-9D60-D22D01C98C23'),
    ('MJ: Queries', 'E80E748A-E041-486B-9CCF-4AD0FEEB672B'),
    ('MJ: Queries', 'F4407C5F-4A26-45E8-B359-62BF356CC495'),
    ('MJ: Queries', 'F549132D-33B7-487F-ADEE-C44F4B351C47'),
    ('MJ: Queries', 'F6C89900-1C0B-410B-919D-02945B1892C1'),
    ('MJ: Queries', 'F8BCC51A-F68E-4DB3-8030-4DD70EABEC27'),
    ('MJ: Queries', 'F94D83C9-9800-492E-B539-868C2EE4451F'),
    ('MJ: Queries', 'FBF5A27B-E1E0-41D9-B004-23B920F19209'),
    ('MJ: Query Categories', '73DC0889-EDFF-463E-A27B-B4CDF8150D62'),
    ('MJ: Query Categories', 'C8ACE109-ED11-4ACD-B7FD-94B31D9F2056'),
    ('MJ: Query Categories', '907A8463-69AF-4205-A9F1-4C668BBC29C5'),
    ('MJ: Query Categories', '8C6F805D-200E-406A-90CA-A379B2253098'),
    ('MJ: Query Categories', 'B42C64DE-D4FD-47CB-9C32-5DB6C2056D9B'),
    ('MJ: Query Categories', 'B14247D0-8962-4B01-A485-8BFD76ABCECF'),
    ('MJ: Query Categories', 'DAE72EFC-4003-4B61-8ACE-15F61415C4EB'),
    ('MJ: Query Categories', '7C13B6EF-2E46-4337-8B8F-AF03C8D131D7'),
    ('MJ: Query Categories', '76AC9359-0959-4553-9D20-4589178E8798'),
    ('MJ: Query Categories', '4FC6DC99-B66A-4F70-9D42-FC9E81C0BD43'),
    ('MJ: Query Categories', '09EDA406-D3B9-4F8E-A584-746F3CADB78E'),
    ('MJ: Query Categories', 'AF8FA334-298D-4D3E-BCFC-6225060B046A'),
    ('MJ: Query Categories', '0E6918F0-453E-43DE-9995-431B11F9F342'),
    ('MJ: Query Categories', 'F1C13450-0CE0-493D-8D4C-126AE028B10F'),
    ('MJ: Query Categories', 'FBAF81C4-57D0-4C6A-A0A8-B6C084B86799'),
    ('MJ: Query Categories', '3F3630FF-D956-4A14-AAE9-08E9FA15B872'),
    ('MJ: Query Categories', '310D55CB-124C-4C59-9202-9378ADB3BC27'),
    ('MJ: Query Categories', 'F8B084A3-3D45-4896-98B7-FEE5736FA71F'),
    ('MJ: Query Categories', '91FA28D2-A699-47E4-9708-33003D5A22F9'),
    ('MJ: Query Categories', '28BA117D-4EA3-4F21-9247-EEDB8EE66E2F'),
    ('MJ: Query Categories', '4ACF3EC1-D97F-41D4-8E9C-A289EBF6E2DA'),
    ('MJ: Query Categories', '299562AB-5017-4D0B-B06E-12872A0BF732'),
    ('MJ: Query Categories', '45A22A65-F6BB-45E4-A692-7D66496A3511'),
    ('MJ: Query Categories', '27EE2C4E-69C5-437E-8CF0-8D0E1A1D5C0E'),
    ('MJ: Query Categories', '972753F6-0627-41DB-8A68-1B829F8DF53C'),
    ('MJ: Query Categories', '271A5166-6C06-4DD5-96D3-0BB80BF1E8E6'),
    ('MJ: Query Categories', '8D4F7766-B115-4B87-AF11-891AF5A265ED'),
    ('MJ: Query Categories', 'E0B2973E-C99C-4C74-90D7-81035270ECD7'),
    ('MJ: Query Categories', '4D499ED2-94EF-42BD-A04E-5621EAA89B44'),
    ('MJ: Query Categories', '3B8652CB-E248-4D99-B32F-8E70B858CF03'),
    ('MJ: Query Categories', '44D30D65-E0DC-4F70-984E-06E5041756F0'),
    ('MJ: Query Categories', 'E176AAB1-2EDF-4FFF-9EA0-85AB7E0CF008'),
    ('MJ: Query Categories', '4EB7ECFB-BAF4-4CD3-B054-FAF3CDEFBC04'),
    ('MJ: Query Categories', 'A841A12C-2F66-48EB-B383-211D11D5A2C7'),
    ('MJ: Query Categories', '7333DBDC-381E-476E-84E9-357EA0EAFE25'),
    ('MJ: Query Categories', 'FB712356-61E4-4992-8712-41C91FCDE085'),
    ('MJ: Query Categories', 'FD4C8862-E63F-4509-B702-62D345521487'),
    ('MJ: Query Categories', '16DC714B-8648-47B7-94D4-481CF18195AE'),
    ('MJ: Query Categories', '23FD90D3-C0AC-40E6-A378-33DFA867C78D'),
    ('MJ: Query Categories', 'A1A42040-DA6A-4053-B713-7BAC7C352112'),
    ('MJ: Query Categories', 'C7503D04-6A4E-4F76-B0D9-FE7A0BF84BFD'),
    ('MJ: Query Categories', '8D044066-1D85-43D2-BB24-10D2716F968F'),
    ('MJ: Query Categories', 'AD5719EE-0FE4-44D2-A919-7AA8A1C94332'),
    ('MJ: Query Categories', '5478D31A-2876-4CEA-A4A9-511F55F49A3A'),
    ('MJ: Resource Permissions', '0248BC52-59A9-538E-B7B5-2D7FD5133AB6'),
    ('MJ: Resource Permissions', '49095437-AC96-50CD-8B85-A18B2795C08A'),
    ('MJ: Resource Permissions', 'D787AF2F-419D-50AF-886F-BAD1E64576B7'),
    ('MJ: Resource Permissions', '553E2D08-FFEB-5B0A-8340-9BF7D9EA97AC'),
    ('MJ: Resource Permissions', 'E0B85809-F8BF-5DA5-9F78-2965F6D94520'),
    ('MJ: Resource Permissions', '282685ED-32AD-51C8-9D7F-CDF57F76F665'),
    ('MJ: Resource Permissions', 'BF76A340-B8EA-55D8-A517-E8AB18FC7E37'),
    ('MJ: Resource Permissions', 'B91881B3-5119-5468-8CDA-3FB8F084F21D'),
    ('MJ: Resource Permissions', 'DC204575-FFD7-5E14-B010-8F2BE40BE00A'),
    ('MJ: Resource Permissions', 'F8A9AF0F-3A69-5621-BE79-5FDB49608928'),
    ('MJ: Resource Permissions', '0C8E882B-5336-553F-BC0A-6B261E846B93'),
    ('MJ: Resource Permissions', '7CEAD060-3931-5838-A30C-333202F4C254'),
    ('MJ: Resource Permissions', '101BE0A3-B37C-5E3E-B8FE-9B006E32E4B4'),
    ('MJ: Resource Permissions', '43613F4B-7ABB-557B-B0DF-417ECC9C3D62'),
    ('MJ: Resource Permissions', '1E7F9FD8-4098-55D9-A206-DE46FAB785B7'),
    ('MJ: Resource Permissions', 'D6D24615-B2D9-54FE-8826-FACA10DE9F2B'),
    ('MJ: Resource Permissions', '891BA0BA-D624-5A33-B200-AF53EC689DE9'),
    ('MJ: Resource Permissions', '2A22E2D7-A670-4111-B7D6-EDAF30A803A6'),
    ('MJ: Resource Permissions', '60D44E76-664E-475E-98AF-6135CA53214F'),
    ('MJ: Resource Permissions', '4AA26C45-285E-4D6A-A5F3-DEC5DC9EF8C8'),
    ('MJ: Resource Permissions', '4ED75807-7860-48B5-860A-0EB09526B4A9'),
    ('MJ: Resource Permissions', '6186BDEE-7D63-41A9-B2D6-1740CAB69E75'),
    ('MJ: Resource Permissions', 'B3035CFE-243C-4157-8CE1-D0B9444BB31A'),
    ('MJ_BizApps_Sonar: Factors', '83F3C3B5-D8DE-54DA-8969-BAA1D947D77B'),
    ('MJ_BizApps_Sonar: Factors', '570029BF-9C80-5C72-9914-E99D12C338B1'),
    ('MJ_BizApps_Sonar: Factors', '7A2C147C-A4DB-5DAD-AB01-A99344A4AA82'),
    ('MJ_BizApps_Sonar: Factors', '9DD8C3C8-7F39-5058-A8BA-D830EA41832D'),
    ('MJ_BizApps_Sonar: Factors', '1A860AAD-8767-5E2A-9ECE-C359C3D4EC1F'),
    ('MJ_BizApps_Sonar: Factors', 'EC18FBE8-6AA4-5FF4-BAE7-7B2AD248EA49'),
    ('MJ_BizApps_Sonar: Factors', '2C7B495A-61FE-553A-B219-B5F576E23278'),
    ('MJ_BizApps_Sonar: Factors', '4D09A1F1-44A7-524F-BFB6-576550070B5D'),
    ('MJ_BizApps_Sonar: Factors', 'EED98A91-5C8D-5E47-BA6B-41EA8159C38B'),
    ('MJ_BizApps_Sonar: Factors', '07B56545-0BE8-51D3-9E17-EE8214F86E11'),
    ('MJ_BizApps_Sonar: Model Factors', 'C1D324B8-C8D5-59E5-8125-7E673B33E2F3'),
    ('MJ_BizApps_Sonar: Model Factors', '87AC52AD-B6C5-52B9-925E-37436418C6EB'),
    ('MJ_BizApps_Sonar: Model Factors', '170A62A8-6880-5AF3-8BA2-9A6B122DD9E9'),
    ('MJ_BizApps_Sonar: Model Factors', '5750EE23-F7AA-516B-A2CE-C59476FBA6B4'),
    ('MJ_BizApps_Sonar: Model Factors', '9526CD7C-9BD4-55D4-9C5D-9F17DD225119'),
    ('MJ_BizApps_Sonar: Model Factors', '3DC0231E-D0E6-5B08-B3E0-0F7A030031B2'),
    ('MJ_BizApps_Sonar: Model Factors', 'C7264C81-78B5-5C93-9578-261010FCEDAB'),
    ('MJ_BizApps_Sonar: Model Factors', '65EDE704-8EF3-58F1-B1B7-F03972020947'),
    ('MJ_BizApps_Sonar: Model Factors', '4B0450F8-1E97-5BC0-8191-0F5AF3F35002'),
    ('MJ_BizApps_Sonar: Model Factors', '786AF287-F683-5DB3-A81B-A6025321B80B'),
    ('MJ_BizApps_Sonar: Model Related Entities', 'F0E5F480-36AB-5E85-B8B8-7C7255837A32'),
    ('MJ_BizApps_Sonar: Model Related Entities', '1513A3B7-DC66-57D2-9FC5-F364F3147205'),
    ('MJ_BizApps_Sonar: Model Related Entities', 'E5508983-6C7F-5379-8537-FB54E23630FE'),
    ('MJ_BizApps_Sonar: Model Related Entities', '8032E327-83FA-5297-A791-EE91AD2CABC5'),
    ('MJ_BizApps_Sonar: Model Related Entities', '123C5F43-B18B-5C63-AF54-4D6E3015635F'),
    ('MJ_BizApps_Sonar: Model Related Entities', '97A307B6-E7D6-5D7F-BF48-C3FCF0336517'),
    ('MJ_BizApps_Sonar: Model Related Entities', '543604CB-5EB4-5276-AD81-4F27D56B0023'),
    ('MJ_BizApps_Sonar: Model Related Entities', '73A51ECF-B377-53F4-BFCF-04A2F9C85C1A'),
    ('MJ_BizApps_Sonar: Model Related Entities', '5A171835-2878-55B9-9172-D71434FC2E58'),
    ('MJ_BizApps_Sonar: Model Related Entities', '4BC57B86-7827-5D79-8175-29EBD4CAF032'),
    ('MJ_BizApps_Sonar: Score Band Sets', '82A80C88-CF9D-5386-A3C5-8ACDE3025B55'),
    ('MJ_BizApps_Sonar: Score Bands', '4B51BE35-94A0-5760-AAB5-F7803EC1C22B'),
    ('MJ_BizApps_Sonar: Score Bands', 'CD02E66D-C02F-5BC7-BC62-5DA43A65E10F'),
    ('MJ_BizApps_Sonar: Score Bands', 'ED587C74-F495-5AF6-8E7A-1F0D892AB80E'),
    ('MJ_BizApps_Sonar: Score Bands', '36C432E5-EE8F-57F8-8BF6-808EC147C339'),
    ('MJ_BizApps_Sonar: Score Model Versions', '9EC51FE5-B002-564E-9C7E-7B8E4954CC5B'),
    ('MJ_BizApps_Sonar: Score Models', '05C13018-27B8-53DE-9D1D-129E6E15DF1C'),
    ('MJ_BizApps_Sonar: Time Windows', 'CF6F428F-7016-5898-BF94-22795E3B3F91'),
    ('MJ_BizApps_Sonar: Time Windows', '97DF3796-A479-558E-9927-755A48D0D061'),
    ('MJ: User Applications', '272F8C07-1C6F-41F9-AFD5-648ED362F5A6'),
    ('MJ: User Applications', '2E205A2C-270F-4BEC-AAB8-54D412105993'),
    ('MJ: User Applications', '3385D969-9511-4517-9F5D-0F7FDD9BF8C5'),
    ('MJ: User Applications', '38FCF30B-F7A8-49E5-A606-69869E960048'),
    ('MJ: User Applications', '46C26329-6033-4B48-AC2E-2703093EAC43'),
    ('MJ: User Applications', '5A29431D-B198-4CB5-9346-77A051FE6CE6'),
    ('MJ: User Applications', '5C2971D3-B51E-4BF3-8E31-5E3EFDFE674B'),
    ('MJ: User Applications', '5D1134B3-EDE3-4334-BB42-435E04E0504E'),
    ('MJ: User Applications', '852BC3D7-CE37-4CFA-B59F-BB5F4390E1AA'),
    ('MJ: User Applications', '9EE2E41E-AA73-4AB8-B85E-B7139185116D'),
    ('MJ: User Applications', 'A7688DD0-BD3F-4F69-9970-CA70E6674307'),
    ('MJ: User Applications', 'B2A05F3E-F36B-1410-8DD4-0033802F0180'),
    ('MJ: User Applications', 'BDDE76C7-0B3A-4DC8-BDA5-B46AE1C57E6B'),
    ('MJ: User Applications', 'CA7EDB51-4C87-47CE-8A9F-ABB26BB68FB4'),
    ('MJ: User Applications', 'DD1B5F3E-F36B-1410-8DD4-0033802F0180'),
    ('MJ: User Applications', 'E63A5D99-1033-4CC4-9411-719529CC62BA'),
    ('MJ: User Applications', 'E8C85BA6-BE0D-4EAB-93D6-6718CB933571'),
    ('MJ: User Applications', 'F064489C-F5A5-4D1F-9E61-D6BC8343F63D'),
    ('MJ: User Applications', 'F8431342-5F1E-4D38-B7EA-18FA8389F8A9'),
    ('MJ: User Roles', '536EFF6C-EE9D-4D65-B6C6-2BE52124F2BA'),
    ('MJ: User Roles', 'E41B5F3E-F36B-1410-8DD4-0033802F0180'),
    ('MJ: User Settings', 'DCD29593-E66F-5A0C-BF7D-46D7645E7332'),
    ('MJ: User Views', 'BFD12082-4704-5963-9E6F-896A83F09032'),
    ('MJ: User Views', 'D2F4C4F4-44EC-5617-B479-640DB962969F'),
    ('MJ: User Views', 'A4B45F20-87E7-5F9D-9137-E9B8DC2E32B5'),
    ('MJ: User Views', '904AD6FF-D13F-5600-80A6-5773EF8214E2'),
    ('MJ: User Views', 'CF1A97D9-A3E2-5DA1-8F25-A2F988CBB5A9'),
    ('MJ: User Views', '3FE9B436-2A55-5B6C-AA98-7AAC5C8979A8'),
    ('MJ: User Views', '30A3DD46-B308-5EFE-925F-73C7F98683D0'),
    ('MJ: User Views', 'B830A7C6-2FE9-5A44-979E-093EED038A66'),
    ('MJ: User Views', 'C5E7CEDD-8E37-5B72-9B3B-7CB1750BCD3B'),
    ('MJ: User Views', 'FF096534-A80F-511B-BDF2-4B9F4962015B'),
    ('MJ: User Views', '5CB88F7E-1368-5963-8973-4FC0E9D5A504'),
    ('MJ: User Views', 'F89A3421-3A95-5730-A873-F4B9A46E7ABE'),
    ('MJ: User Views', 'E284181A-91DF-5A96-8D16-63076ABCA8BA'),
    ('MJ: User Views', '97A75D49-A060-5828-98DD-7BA09A948F71'),
    ('MJ: User Views', '698F8C76-2071-544C-BCE6-5FB66673F709'),
    ('MJ: User Views', '1C3B0B3B-3A74-51BB-A485-FFACE8CCBE87'),
    ('MJ: User Views', '5DBB924D-9E66-5A62-BC59-065C9AA5A9F7'),
    ('MJ: User Views', '99E510A6-2160-4664-BE08-8EC28A64FA2E'),
    ('MJ: User Views', 'A3CF1C6C-7B59-4A0D-AD3D-EC17DD8770CF'),
    ('MJ: User Views', '3BF98DAF-CCC4-4C14-AF8D-D7DE74FAFB2A'),
    ('MJ: User Views', 'BA61903F-1E34-4BD1-94EA-A45258127A92'),
    ('MJ: User Views', '3EF9D448-B589-4332-B344-0F737DE8BB55'),
    ('MJ: User Views', 'D78F3FFA-B2F2-4CB0-9CE7-AFE1E1FF22D0'),
    ('MJ: Users', '7FE3B684-1136-4881-983E-F87D22E9A0EC'),
    ('MJ: Vector Indexes', '6A2C1F0E-3B8D-4E57-9C41-2D7F8A5B6C01');

-- ── The entity metadata this app's baseline creates, for all three schemas ────────────────────
INSERT INTO #MoreCheeseDoomed (SchemaName, TableName, RowID, Depth) VALUES
    -- MoreCheese: Certifications in morecheese_learning
    ('${mjSchema}', 'Entity', '49DF9400-9C38-422C-8DB6-1373D5392E35', 0),
    -- MoreCheese: Member Certifications in morecheese_learning
    ('${mjSchema}', 'Entity', '23916A8E-3487-4793-9E18-C209EF097E58', 0),
    -- MoreCheese: Competition Entries in morecheese_events
    ('${mjSchema}', 'Entity', '9F493BE6-006B-4FC2-986C-D15AB527E65B', 0),
    -- MoreCheese: Advocacy Actions in morecheese_members (declared)
    ('${mjSchema}', 'Entity', 'F2C9BD57-8734-4AFE-B20A-2C8C1C3BB25F', 0),
    -- MoreCheese: Data Quality Labels in morecheese_members (declared)
    ('${mjSchema}', 'Entity', 'FF152388-ED04-4F1F-B237-94D502C4AA54', 0),
    -- MoreCheese: Organization Profiles in morecheese_members (declared)
    ('${mjSchema}', 'Entity', 'A3D95071-B312-40E2-AEF3-F90D8EF881AD', 0),
    -- MoreCheese: Member Profiles in morecheese_members (declared)
    ('${mjSchema}', 'Entity', 'BE4D97E0-48DE-4240-A09F-8B39AD4BD043', 0),
    -- MoreCheese: Membership Periods in morecheese_members (declared)
    ('${mjSchema}', 'Entity', '16538F9B-E025-460D-9505-BD03A7648EC5', 0),
    -- MoreCheese: Events in morecheese_events
    ('${mjSchema}', 'Entity', 'CB9A5230-39C0-49EE-A5BC-238D3536B39B', 0),
    -- MoreCheese: Event Registrations in morecheese_events
    ('${mjSchema}', 'Entity', 'DC863C47-C1FA-4C3F-92D1-DF7F8A7BC153', 0),
    -- MoreCheese: Courses in morecheese_learning
    ('${mjSchema}', 'Entity', 'A3E60AF2-D7CA-407E-A1D3-34320E851892', 0),
    -- MoreCheese: Course Enrollments in morecheese_learning
    ('${mjSchema}', 'Entity', '428C670F-EBE3-41E6-86E4-EB5A274960A1', 0);

-- ── The Application row this app's baseline creates ───────────────────────────────────────────
INSERT INTO #MoreCheeseDoomed (SchemaName, TableName, RowID, Depth) VALUES
    ('${mjSchema}', 'Application', '3C46B3A5-34FB-51EA-B54D-77E9F104ABAF', 0);

-- MJ's own AtomicBatchScript sets this, and for the same reason: with XACT_ABORT OFF an error inside
-- EXEC sp_executesql does NOT abort the batch, so the loops below would keep issuing destructive
-- statements against an already-doomed transaction. The rollback still happens, but running the
-- remainder of a delete plan after the first failure is not a risk worth taking for one line.
SET XACT_ABORT ON;

-- ── 1. Resolve each seeded record to the table that holds it ──────────────────────────────────
-- By ENTITY NAME, through the host's own __mj.Entity, rather than through a table name this
-- generator baked in. Whatever schema a sibling app installed itself into, the lookup finds it.
INSERT INTO #MoreCheeseDoomed (SchemaName, TableName, RowID, Depth)
SELECT DISTINCT e.[SchemaName], e.[BaseTable], s.RowID, 0
FROM #MoreCheeseSeed s
JOIN [${mjSchema}].[Entity] e ON e.[Name] = s.EntityName
WHERE NOT EXISTS (
    SELECT 1 FROM #MoreCheeseDoomed d
    WHERE d.SchemaName = e.[SchemaName] AND d.TableName = e.[BaseTable] AND d.RowID = s.RowID
);

-- An entity name that does not resolve means that app has already been removed and took its schema
-- with it, so there is no table left to delete those rows from. Announced rather than thrown: a
-- host may remove apps in any order, and blocking a teardown for a normal condition is how a
-- teardown gets skipped. Announcing it keeps a name that fails to resolve for some OTHER reason
-- visible instead of silent.
DECLARE @unresolved NVARCHAR(MAX) = (
    SELECT STRING_AGG(CONVERT(NVARCHAR(MAX), x.EntityName), ', ')
    FROM (SELECT DISTINCT s.EntityName
          FROM #MoreCheeseSeed s
          WHERE NOT EXISTS (SELECT 1 FROM [${mjSchema}].[Entity] e WHERE e.[Name] = s.EntityName)) x
);
IF @unresolved IS NOT NULL
    RAISERROR('MoreCheese teardown: no __mj.Entity row for %s - that app is already removed, so its rows are gone with its schema. Skipped.', 0, 1, @unresolved) WITH NOWAIT;

-- ── 2. Discover dependents from the catalog, at apply time ────────────────────────────────────
-- Not from a build-time ordering: the dependent surface is not knowable when this file is written
-- and reaches into sibling schemas. Nullable references are released; non-nullable dependents join
-- the doomed set and are removed with their own dependents. Bounded, and it fails loudly rather
-- than half-finishing.
DECLARE @pass INT = 0;
DECLARE @MAX_PASSES INT = 25;
DECLARE @changed INT = 1;

WHILE @changed > 0 AND @pass < @MAX_PASSES
BEGIN
    SET @pass += 1;
    SET @changed = 0;

    DECLARE @childSchema sysname, @childTable sysname, @childCol sysname,
            @parentSchema sysname, @parentTable sysname, @isNullable BIT, @sql NVARCHAR(MAX);

    -- NOT anchored to the core schema, unlike the caliber original: this app's doomed set spans
    -- __mj, __mj_BizAppsSonar and whatever schema each config/ entity resolves to. The filter is
    -- the doomed set itself, which reduces to caliber's behaviour when every doomed row is in one
    -- schema and is correct when they are not.
    DECLARE fk_cursor CURSOR LOCAL FAST_FORWARD FOR
        SELECT DISTINCT SCHEMA_NAME(pt.schema_id), pt.name, pc.name,
                        SCHEMA_NAME(rt.schema_id), rt.name, pc.is_nullable
        FROM sys.foreign_keys fk
        JOIN sys.foreign_key_columns fkc ON fkc.constraint_object_id = fk.object_id
        JOIN sys.tables  pt ON pt.object_id = fk.parent_object_id
        JOIN sys.columns pc ON pc.object_id = pt.object_id AND pc.column_id = fkc.parent_column_id
        JOIN sys.tables  rt ON rt.object_id = fk.referenced_object_id
        JOIN sys.columns rc ON rc.object_id = rt.object_id AND rc.column_id = fkc.referenced_column_id
        WHERE rc.name = 'ID'
          -- Single-column constraints only. MJ's EnumerateMjEntityFkGraph skips composites for the
          -- same reason: treating one column of a composite key as a standalone edge would null half
          -- a key or match a child on a partial reference.
          AND (SELECT COUNT(*) FROM sys.foreign_key_columns c2
               WHERE c2.constraint_object_id = fk.object_id) = 1
          AND EXISTS (SELECT 1 FROM #MoreCheeseDoomed d
                      WHERE d.SchemaName = SCHEMA_NAME(rt.schema_id) AND d.TableName = rt.name);

    OPEN fk_cursor;
    FETCH NEXT FROM fk_cursor INTO @childSchema, @childTable, @childCol, @parentSchema, @parentTable, @isNullable;
    WHILE @@FETCH_STATUS = 0
    BEGIN
        IF @isNullable = 1
        BEGIN
            -- Someone else's row that merely points at ours. Release the reference, keep the row.
            SET @sql = N'UPDATE c SET c.[' + @childCol + N'] = NULL
                         FROM [' + @childSchema + N'].[' + @childTable + N'] c
                         WHERE c.[' + @childCol + N'] IN (SELECT RowID FROM #MoreCheeseDoomed
                                                          WHERE SchemaName = @ps AND TableName = @pt)';
            EXEC sp_executesql @sql, N'@ps sysname, @pt sysname', @ps = @parentSchema, @pt = @parentTable;
            SET @changed += @@ROWCOUNT;
        END
        ELSE
        BEGIN
            -- Cannot exist without the parent, so it is doomed too.
            SET @sql = N'INSERT INTO #MoreCheeseDoomed (SchemaName, TableName, RowID, Depth)
                         SELECT ''' + @childSchema + N''', ''' + @childTable + N''', c.[ID], @pass
                         FROM [' + @childSchema + N'].[' + @childTable + N'] c
                         WHERE c.[' + @childCol + N'] IN (SELECT RowID FROM #MoreCheeseDoomed
                                                          WHERE SchemaName = @ps AND TableName = @pt)
                           AND NOT EXISTS (SELECT 1 FROM #MoreCheeseDoomed d
                                           WHERE d.SchemaName = ''' + @childSchema + N'''
                                             AND d.TableName = ''' + @childTable + N''' AND d.RowID = c.[ID])';
            EXEC sp_executesql @sql, N'@ps sysname, @pt sysname, @pass INT',
                 @ps = @parentSchema, @pt = @parentTable, @pass = @pass;
            SET @changed += @@ROWCOUNT;
        END

        FETCH NEXT FROM fk_cursor INTO @childSchema, @childTable, @childCol, @parentSchema, @parentTable, @isNullable;
    END
    CLOSE fk_cursor;
    DEALLOCATE fk_cursor;
END

IF @pass >= @MAX_PASSES AND @changed > 0
    THROW 51003, 'MoreCheese teardown did not converge: the dependency graph is deeper than MAX_PASSES. Nothing has been committed.', 1;

-- ── 3. Order the deletes by the FK graph, not by discovery order ──────────────────────────────
-- Discovery depth is NOT a topological order. Two tables can be discovered in the same pass from
-- different parents and still be parent and child of each other. So compute a real level: a table
-- sits one above every doomed table it references, and deletes run highest level first. Relaxation
-- is bounded; a non-nullable cycle would otherwise spin.
--
-- Keyed on SCHEMA + NAME, never on name alone. That is not defensive here, it is required: a live
-- more-cheese database holds __mj.Application beside __mj_BizAppsSonar tables, and this app's own
-- three schemas hold Event, Course and Certification alongside sibling apps' tables of similar name.
CREATE TABLE #MoreCheeseLevel (SchemaName sysname NOT NULL, TableName sysname NOT NULL, Lvl INT NOT NULL, PRIMARY KEY (SchemaName, TableName));

INSERT INTO #MoreCheeseLevel (SchemaName, TableName, Lvl)
SELECT DISTINCT SchemaName, TableName, 0 FROM #MoreCheeseDoomed;

DECLARE @relax INT = 0;
DECLARE @MAX_RELAX INT = 50;
DECLARE @moved INT = 1;

WHILE @moved > 0 AND @relax < @MAX_RELAX
BEGIN
    SET @relax += 1;

    UPDATE child
    SET child.Lvl = parent.Lvl + 1
    FROM #MoreCheeseLevel child
    JOIN (
        SELECT DISTINCT
               SCHEMA_NAME(pt.schema_id) AS ChildSchema, pt.name AS ChildTable,
               SCHEMA_NAME(rt.schema_id) AS ParentSchema, rt.name AS ParentTable
        FROM sys.foreign_keys fk
        JOIN sys.foreign_key_columns fkc ON fkc.constraint_object_id = fk.object_id
        JOIN sys.tables  pt ON pt.object_id = fk.parent_object_id
        JOIN sys.columns pc ON pc.object_id = pt.object_id AND pc.column_id = fkc.parent_column_id
        JOIN sys.tables  rt ON rt.object_id = fk.referenced_object_id
        JOIN sys.columns rc ON rc.object_id = rt.object_id AND rc.column_id = fkc.referenced_column_id
        WHERE rc.name = 'ID'
          AND pc.is_nullable = 0
          AND (SELECT COUNT(*) FROM sys.foreign_key_columns c2
               WHERE c2.constraint_object_id = fk.object_id) = 1
          AND NOT (pt.object_id = rt.object_id)
    ) edge ON edge.ChildTable = child.TableName AND edge.ChildSchema = child.SchemaName
    JOIN #MoreCheeseLevel parent ON parent.TableName = edge.ParentTable AND parent.SchemaName = edge.ParentSchema
    WHERE child.Lvl <= parent.Lvl;

    SET @moved = @@ROWCOUNT;
END

IF @moved > 0
    THROW 51005, 'MoreCheese teardown could not order its deletes within MAX_RELAX passes: either a non-nullable foreign-key CYCLE among the doomed tables, or a dependency chain deeper than the bound. Nothing has been committed.', 1;

-- ── 4. Announce the plan before executing it ──────────────────────────────────────────────────
-- MJ's own teardown calls ReportTeardownPlan and prints 'delete ActionExecutionLog x800' to the
-- operator BEFORE touching anything. On a used database the cascade removes the CUSTOMER's history
-- alongside our rows — conversation details, action execution logs, prompt and agent runs, dashboard
-- state. That is the standard cascade rule and MJ does the same, but an unrecallable delete of "what
-- your system did" should be announced rather than discovered.
DECLARE @planLine NVARCHAR(400);
DECLARE plan_cursor CURSOR LOCAL FAST_FORWARD FOR
    SELECT CONCAT('  delete ', d.SchemaName, '.', d.TableName, ' x', COUNT(*))
    FROM #MoreCheeseDoomed d GROUP BY d.SchemaName, d.TableName ORDER BY COUNT(*) DESC;
RAISERROR('MoreCheese teardown plan (rows to remove from shared schemas):', 0, 1) WITH NOWAIT;
OPEN plan_cursor;
FETCH NEXT FROM plan_cursor INTO @planLine;
WHILE @@FETCH_STATUS = 0
BEGIN
    RAISERROR(@planLine, 0, 1) WITH NOWAIT;
    FETCH NEXT FROM plan_cursor INTO @planLine;
END
CLOSE plan_cursor; DEALLOCATE plan_cursor;

-- ── 5. Delete, deepest level first ────────────────────────────────────────────────────────────
DECLARE @lvl INT = (SELECT MAX(Lvl) FROM #MoreCheeseLevel);
WHILE @lvl >= 0
BEGIN
    DECLARE @delSchema sysname, @delTable sysname, @delSql NVARCHAR(MAX);
    DECLARE del_cursor CURSOR LOCAL FAST_FORWARD FOR
        SELECT SchemaName, TableName FROM #MoreCheeseLevel WHERE Lvl = @lvl;
    OPEN del_cursor;
    FETCH NEXT FROM del_cursor INTO @delSchema, @delTable;
    WHILE @@FETCH_STATUS = 0
    BEGIN
        -- Joined on SchemaName as well as TableName, for the reason the levelling table records.
        SET @delSql = N'DELETE t FROM [' + @delSchema + N'].[' + @delTable + N'] t
                        JOIN #MoreCheeseDoomed d ON d.RowID = t.[ID]
                        WHERE d.TableName = @t AND d.SchemaName = @s';
        EXEC sp_executesql @delSql, N'@t sysname, @s sysname', @t = @delTable, @s = @delSchema;
        FETCH NEXT FROM del_cursor INTO @delSchema, @delTable;
    END
    CLOSE del_cursor;
    DEALLOCATE del_cursor;
    SET @lvl -= 1;
END

-- ── 6. Postcondition on the rows ──────────────────────────────────────────────────────────────
-- A teardown that reports success while leaving rows behind is the failure this design replaced, so
-- it is asserted rather than assumed. Only the SEEDED rows (Depth = 0) are asserted: a discovered
-- dependent that was SET NULL rather than deleted is still present by design.
DECLARE @remaining INT = 0;
DECLARE @chkSchema sysname, @chkTable sysname, @chkSql NVARCHAR(MAX), @chkCount INT;
DECLARE chk_cursor CURSOR LOCAL FAST_FORWARD FOR
    SELECT DISTINCT SchemaName, TableName FROM #MoreCheeseDoomed WHERE Depth = 0;
OPEN chk_cursor;
FETCH NEXT FROM chk_cursor INTO @chkSchema, @chkTable;
WHILE @@FETCH_STATUS = 0
BEGIN
    SET @chkSql = N'SELECT @c = COUNT(*) FROM [' + @chkSchema + N'].[' + @chkTable + N'] t
                    JOIN #MoreCheeseDoomed d ON d.RowID = t.[ID]
                    WHERE d.TableName = @t AND d.SchemaName = @s AND d.Depth = 0';
    EXEC sp_executesql @chkSql, N'@t sysname, @s sysname, @c INT OUTPUT', @t = @chkTable, @s = @chkSchema, @c = @chkCount OUTPUT;
    SET @remaining += ISNULL(@chkCount, 0);
    FETCH NEXT FROM chk_cursor INTO @chkSchema, @chkTable;
END
CLOSE chk_cursor;
DEALLOCATE chk_cursor;

IF @remaining > 0
    THROW 51004, 'MoreCheese teardown finished with seeded rows still present. Nothing has been committed.', 1;

-- ── 7. Drop the two schemas mj app remove does not ────────────────────────────────────────────
-- THE MULTI-SCHEMA HALF. 'mj app remove' drops schema.name from mj-app.json and nothing else, so
-- without this block morecheese_events and morecheese_learning survive an uninstall complete with
-- their tables, views, CRUD procedures, triggers and rows — and the next install collides.
--
-- Enumerated from the catalog rather than from a list written here, so a table added to either
-- schema by a later migration is torn down with nothing to keep in step. Order is forced: inbound
-- foreign keys first (a table in ANY schema may reference these), then views and programmable
-- objects, then tables, then the schema itself. DROP SCHEMA fails if anything remains, which is what
-- makes step 7d a real postcondition rather than a hope.
DECLARE @schemaName sysname, @dropSql NVARCHAR(MAX), @obj NVARCHAR(400);

DECLARE schema_cursor CURSOR LOCAL FAST_FORWARD FOR
    SELECT s.name FROM sys.schemas s WHERE s.name IN ('morecheese_events', 'morecheese_learning');
OPEN schema_cursor;
FETCH NEXT FROM schema_cursor INTO @schemaName;
WHILE @@FETCH_STATUS = 0
BEGIN
    RAISERROR('MoreCheese teardown: dropping schema %s (mj app remove drops only the declared schema).', 0, 1, @schemaName) WITH NOWAIT;

    -- 7a. Foreign keys pointing INTO this schema, from anywhere. Today every cross-schema FK this
    -- app declares points OUTWARD (to __mj_BizAppsCommon.Person / .Organization), so this finds
    -- nothing on a stock install; it exists because a host or a later migration can add one, and a
    -- single inbound FK is the difference between a clean DROP TABLE and a rolled-back teardown.
    DECLARE @fkName sysname, @fkSchema sysname, @fkTable sysname;
    DECLARE inbound_fk CURSOR LOCAL FAST_FORWARD FOR
        SELECT fk.name, SCHEMA_NAME(pt.schema_id), pt.name
        FROM sys.foreign_keys fk
        JOIN sys.tables pt ON pt.object_id = fk.parent_object_id
        JOIN sys.tables rt ON rt.object_id = fk.referenced_object_id
        WHERE SCHEMA_NAME(rt.schema_id) = @schemaName
          AND SCHEMA_NAME(pt.schema_id) <> @schemaName;
    OPEN inbound_fk;
    FETCH NEXT FROM inbound_fk INTO @fkName, @fkSchema, @fkTable;
    WHILE @@FETCH_STATUS = 0
    BEGIN
        SET @dropSql = N'ALTER TABLE [' + @fkSchema + N'].[' + @fkTable + N'] DROP CONSTRAINT [' + @fkName + N']';
        EXEC sp_executesql @dropSql;
        FETCH NEXT FROM inbound_fk INTO @fkName, @fkSchema, @fkTable;
    END
    CLOSE inbound_fk; DEALLOCATE inbound_fk;

    -- 7b. Views and programmable objects. Triggers are not listed: they are dropped with the table
    -- they sit on, and dropping one by name first would be a statement that can fail for no gain.
    DECLARE obj_cursor CURSOR LOCAL FAST_FORWARD FOR
        SELECT CASE o.type WHEN 'V' THEN 'VIEW' WHEN 'P' THEN 'PROCEDURE'
                           WHEN 'FN' THEN 'FUNCTION' WHEN 'IF' THEN 'FUNCTION' WHEN 'TF' THEN 'FUNCTION' END
               + ' [' + @schemaName + '].[' + o.name + ']'
        FROM sys.objects o
        WHERE o.schema_id = SCHEMA_ID(@schemaName) AND o.type IN ('V', 'P', 'FN', 'IF', 'TF');
    OPEN obj_cursor;
    FETCH NEXT FROM obj_cursor INTO @obj;
    WHILE @@FETCH_STATUS = 0
    BEGIN
        SET @dropSql = N'DROP ' + @obj;
        EXEC sp_executesql @dropSql;
        FETCH NEXT FROM obj_cursor INTO @obj;
    END
    CLOSE obj_cursor; DEALLOCATE obj_cursor;

    -- 7c. Tables. Intra-schema foreign keys (EventRegistration -> Event, CourseEnrollment -> Course,
    -- MemberCertification -> Certification) are dropped first so table order does not matter.
    DECLARE intra_fk CURSOR LOCAL FAST_FORWARD FOR
        SELECT fk.name, pt.name
        FROM sys.foreign_keys fk
        JOIN sys.tables pt ON pt.object_id = fk.parent_object_id
        WHERE pt.schema_id = SCHEMA_ID(@schemaName);
    OPEN intra_fk;
    FETCH NEXT FROM intra_fk INTO @fkName, @fkTable;
    WHILE @@FETCH_STATUS = 0
    BEGIN
        SET @dropSql = N'ALTER TABLE [' + @schemaName + N'].[' + @fkTable + N'] DROP CONSTRAINT [' + @fkName + N']';
        EXEC sp_executesql @dropSql;
        FETCH NEXT FROM intra_fk INTO @fkName, @fkTable;
    END
    CLOSE intra_fk; DEALLOCATE intra_fk;

    DECLARE tbl_cursor CURSOR LOCAL FAST_FORWARD FOR
        SELECT t.name FROM sys.tables t WHERE t.schema_id = SCHEMA_ID(@schemaName);
    OPEN tbl_cursor;
    FETCH NEXT FROM tbl_cursor INTO @fkTable;
    WHILE @@FETCH_STATUS = 0
    BEGIN
        SET @dropSql = N'DROP TABLE [' + @schemaName + N'].[' + @fkTable + N']';
        EXEC sp_executesql @dropSql;
        FETCH NEXT FROM tbl_cursor INTO @fkTable;
    END
    CLOSE tbl_cursor; DEALLOCATE tbl_cursor;

    -- 7d. The schema itself. Fails if anything above was missed, which is the point.
    SET @dropSql = N'DROP SCHEMA [' + @schemaName + N']';
    EXEC sp_executesql @dropSql;

    -- MJ writes a SchemaInfo row per schema it manages and retires only the declared one.
    DELETE FROM [${mjSchema}].[SchemaInfo] WHERE [SchemaName] = @schemaName;

    FETCH NEXT FROM schema_cursor INTO @schemaName;
END
CLOSE schema_cursor; DEALLOCATE schema_cursor;

-- Unreachable on the THROW paths above, deliberately: MJ runs this inside a transaction and rolls
-- back on any error, and a ROLLBACK drops temp tables created inside it. Kept for the success path
-- because MJ can run several teardown files on the SAME connection in the SAME transaction.
DROP TABLE #MoreCheeseSeed;
DROP TABLE #MoreCheeseDoomed;
DROP TABLE #MoreCheeseLevel;
