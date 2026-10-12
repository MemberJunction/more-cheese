---
"@mj-biz-apps/more-cheese-entities": minor
"@mj-biz-apps/more-cheese-server": minor
"@mj-biz-apps/more-cheese-ng": minor
---

Fix GitHub issue #110: remove pre-encrypted Dropbox OAuth credential from seed

- **Remove encrypted credential value from migration.** The seeded `MJ: Credentials` record "Dropbox OAuth" (ID `7A1E4C2B-5D3F-4E8A-9B6C-2F0D8E1A3C55`) contained a pre-encrypted `Values` field that was encrypted with the original developer's key. Since no other install has that key, every clean install failed to decrypt the credential at MJAPI startup and logged a `Decryption failed: authentication tag mismatch` error. The encrypted value has been removed from `migrations/V202609182029__v1.2.x__Metadata_Sync_Part5of5.sql` and replaced with an empty JSON object `{}`, matching the intent in `config/credentials/.credentials.json` (a placeholder for admins to configure).

- **Add Dropbox setup documentation.** The README now includes a "Configuring Dropbox Access for Knowledge Hub" section that walks admins through obtaining Dropbox OAuth credentials, entering them in MemberJunction Explorer, and activating the credential for Knowledge Hub integration. Local development and demo installs without a live Dropbox account can keep the credential inactive.

- **Security note**: The encrypted value was published in the public repository. The Dropbox account behind it should be treated as compromised and a human should rotate the Dropbox refresh token / app secret (not done here).

- **No migration for existing installs**: `mj sync push` is upsert-only and never deletes. Existing installations with the bad encrypted `Values` row will keep it. Admins must either (a) manually clear the `Values` column via SQL/Explorer and re-enter the credentials, or (b) leave it inactive and Know Hub will not ingest from Dropbox. This changeset documents the fix for new installs.
