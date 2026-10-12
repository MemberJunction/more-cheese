---
"@mj-biz-apps/more-cheese-entities": minor
"@mj-biz-apps/more-cheese-server": minor
"@mj-biz-apps/more-cheese-ng": minor
---

Clean installs no longer log a decrypt error for the "Dropbox OAuth" credential (#110). The release seed shipped that credential's `Values` encrypted with the key of the machine that generated the release, so every other install failed to decrypt it at MJAPI startup. The plaintext was only `{}` (the 2-byte ciphertext matches the `{}` in `config/credentials/.credentials.json`), so no secret was published. A new migration resets the value to plain `{}` on new and existing installs; it matches only the exact shipped ciphertext, so a credential an admin has already filled in is left alone. The README now explains how to fill in the credential after install.
