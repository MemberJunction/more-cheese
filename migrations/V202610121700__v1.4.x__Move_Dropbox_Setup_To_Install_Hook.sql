-- =============================================================================
-- MoreCheese: move the demo Dropbox setup out of the release seeds (v1.4.x, issue #110)
--
-- Releases up to v1.3.x seeded three records for the More Cheese demo Dropbox:
--   * the "Dropbox OAuth" credential  (7A1E4C2B-5D3F-4E8A-9B6C-2F0D8E1A3C55)
--   * the "More Cheese Dropbox" file storage account (636E204B-12CB-4D67-A861-09DA9C825BA3)
--   * its two read permissions (UI, Developer roles)
-- The credential's Values was encrypted with the key of the machine that generated the
-- release, so no other install can decrypt it and MJAPI logs a decrypt error at every start.
-- A real key can't ship either: it can't be in a public repo, and it has to be encrypted
-- with each install's own key.
--
-- From v1.4.x these records are created on each install by the app's post-install hook
-- (packages/Server/src/setup/dropbox-setup.ts), only when someone supplies the read-only key.
-- This migration removes the shipped placeholders from existing installs so the hook can
-- create real ones. It acts ONLY while the credential is still the untouched placeholder
-- (inactive, Values = '{}' or the shipped ciphertext). A credential an admin has filled in
-- and activated is left exactly as it is, along with its storage account.
--
-- The "More Cheese vault — internal (Dropbox)" content source stays: six shipped content items
-- belong to it, and it simply has nothing to ingest until the storage account exists.
-- =============================================================================

IF EXISTS (
    SELECT 1 FROM [${mjSchema}].[Credential]
    WHERE [ID] = '7A1E4C2B-5D3F-4E8A-9B6C-2F0D8E1A3C55'
      AND [IsActive] = 0
      AND [Values] IN (N'{}', N'$ENC$$85B814C8-A01B-4AE3-A252-DC9D54C914C7$AES-256-GCM$Temlei5KP70HXPIB$0MU=$oQfpDZfqHnAdRClmZnjdUA==')
)
BEGIN
    -- Optional references to the storage account. These tables and columns are newer than
    -- some MJ versions this app supports, so each runs as dynamic SQL behind an existence check.
    IF COL_LENGTH('[${mjSchema}].[AIAgentType]', 'DefaultStorageAccountID') IS NOT NULL
        EXEC sp_executesql N'UPDATE [${mjSchema}].[AIAgentType] SET [DefaultStorageAccountID] = NULL WHERE [DefaultStorageAccountID] = ''636E204B-12CB-4D67-A861-09DA9C825BA3''';
    IF COL_LENGTH('[${mjSchema}].[AIAgent]', 'DefaultStorageAccountID') IS NOT NULL
        EXEC sp_executesql N'UPDATE [${mjSchema}].[AIAgent] SET [DefaultStorageAccountID] = NULL WHERE [DefaultStorageAccountID] = ''636E204B-12CB-4D67-A861-09DA9C825BA3''';
    IF COL_LENGTH('[${mjSchema}].[AIAgentCategory]', 'DefaultStorageAccountID') IS NOT NULL
        EXEC sp_executesql N'UPDATE [${mjSchema}].[AIAgentCategory] SET [DefaultStorageAccountID] = NULL WHERE [DefaultStorageAccountID] = ''636E204B-12CB-4D67-A861-09DA9C825BA3''';
    IF COL_LENGTH('[${mjSchema}].[ArchiveConfiguration]', 'StorageAccountID') IS NOT NULL
        EXEC sp_executesql N'UPDATE [${mjSchema}].[ArchiveConfiguration] SET [StorageAccountID] = NULL WHERE [StorageAccountID] = ''636E204B-12CB-4D67-A861-09DA9C825BA3''';
    IF OBJECT_ID('[${mjSchema}].[SearchScopeStorageAccount]') IS NOT NULL
        EXEC sp_executesql N'DELETE FROM [${mjSchema}].[SearchScopeStorageAccount] WHERE [FileStorageAccountID] = ''636E204B-12CB-4D67-A861-09DA9C825BA3''';

    DELETE FROM [${mjSchema}].[FileStorageAccountPermission]
    WHERE [FileStorageAccountID] = '636E204B-12CB-4D67-A861-09DA9C825BA3';

    DELETE FROM [${mjSchema}].[FileStorageAccount]
    WHERE [ID] = '636E204B-12CB-4D67-A861-09DA9C825BA3'
      AND [CredentialID] = '7A1E4C2B-5D3F-4E8A-9B6C-2F0D8E1A3C55';

    DELETE FROM [${mjSchema}].[Credential]
    WHERE [ID] = '7A1E4C2B-5D3F-4E8A-9B6C-2F0D8E1A3C55'
      AND NOT EXISTS (
          SELECT 1 FROM [${mjSchema}].[FileStorageAccount]
          WHERE [CredentialID] = '7A1E4C2B-5D3F-4E8A-9B6C-2F0D8E1A3C55'
      );
END;
