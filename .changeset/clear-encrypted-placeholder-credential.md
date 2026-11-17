---
"@mj-biz-apps/more-cheese-entities": minor
"@mj-biz-apps/more-cheese-server": minor
"@mj-biz-apps/more-cheese-ng": minor
---

Clear build-machine-encrypted placeholder `Values` on the inactive `Dropbox OAuth` credential (`7A1E4C2B-5D3F-4E8A-9B6C-2F0D8E1A3C55`).

- **New migration `V202611062030__v1.4.x_Clear_Encrypted_Placeholder_Credential`.**
  - `V202609182029__v1.2.x__Metadata_Sync_Part5of5.sql` seeded `Values` encrypted with the release build machine's `MJ_BASE_ENCRYPTION_KEY` (`85B814C8-A01B-4AE3-A252-DC9D54C914C7`), causing `Failed to decrypt field "Values" on entity "MJ: Credentials": authentication tag mismatch` on any other install where that key ID holds the host's own encryption key.
  - Resets `Values` to plaintext `N'{}'` when the credential is still inactive (`IsActive = 0`) and still carries an encrypted `$ENC$...` value.
