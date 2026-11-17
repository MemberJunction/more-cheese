-- =============================================================================
-- MoreCheese: Clear Encrypted Placeholder Credential Values (v1.4.x)
--
-- V202609182029__v1.2.x__Metadata_Sync_Part5of5.sql seeded the inactive
-- placeholder "Dropbox OAuth" credential (7A1E4C2B-5D3F-4E8A-9B6C-2F0D8E1A3C55)
-- with Values encrypted under the build machine's MJ_BASE_ENCRYPTION_KEY
-- (85B814C8-A01B-4AE3-A252-DC9D54C914C7). On any other install, that key ID
-- holds the host's own MJ_BASE_ENCRYPTION_KEY, causing AES-256-GCM tag
-- verification to fail with:
--   Failed to decrypt field "Values" on entity "MJ: Credentials": authentication tag mismatch
--
-- Reset Values to plaintext N'{}' when the credential is still inactive and
-- still carries an encrypted placeholder value.
-- =============================================================================

UPDATE [${mjSchema}].[Credential]
SET [Values] = N'{}'
WHERE [ID] = '7A1E4C2B-5D3F-4E8A-9B6C-2F0D8E1A3C55'
  AND [IsActive] = 0
  AND [Values] LIKE N'$ENC$%';
GO
