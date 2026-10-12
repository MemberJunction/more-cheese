-- =============================================================================
-- MoreCheese: clear the pre-encrypted 'Dropbox OAuth' credential value (v1.4.x, issue #110)
--
-- V202609182029 seeds the 'Dropbox OAuth' credential with a Values string that was encrypted
-- on the developer machine that generated the release. Its plaintext is just '{}' (the
-- ciphertext is 2 bytes; the config seed in config/credentials/.credentials.json is '{}'),
-- so no secret was ever shipped, but no other install holds that encryption key and MJAPI
-- logs "Failed to decrypt field Values on entity MJ: Credentials" at every startup.
--
-- This resets the value to the same plain '{}' the config seed holds. MJ's encryption
-- engine passes unencrypted values through unchanged, and encrypts whatever an admin enters
-- later. The WHERE clause matches only the exact shipped ciphertext, so a credential an
-- admin has already filled in on their own install is never touched. V202609182029 itself
-- is left unchanged so its checksum stays valid on installs that already applied it.
-- =============================================================================

UPDATE [${mjSchema}].[Credential]
SET [Values] = N'{}'
WHERE [ID] = '7A1E4C2B-5D3F-4E8A-9B6C-2F0D8E1A3C55'
  AND [Values] = N'$ENC$$85B814C8-A01B-4AE3-A252-DC9D54C914C7$AES-256-GCM$Temlei5KP70HXPIB$0MU=$oQfpDZfqHnAdRClmZnjdUA==';
