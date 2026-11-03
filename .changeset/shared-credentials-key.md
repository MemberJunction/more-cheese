---
"@mj-biz-apps/more-cheese-entities": minor
"@mj-biz-apps/more-cheese-server": minor
"@mj-biz-apps/more-cheese-ng": minor
---

More Cheese's demo credentials now work on every install that has the More Cheese shared key, which the More Cheese portal hands out (#110).

- **New: the More Cheese Shared Key** (`config/encryption-keys`). An MJ Encryption Key read from the environment variable `MORECHEESE_SHARED_KEY`. The key material is never in the repo; it is shared with everyone installing More Cheese.
- **Shipped credentials are sealed with it**: `Dropbox OAuth`, and the new `Component Registry: Skip`, a read-only key for the Skip components the pinned dashboards load. MJ reads values encrypted with any key it has a record for, so one release works everywhere, instead of carrying values encrypted with the release machine's key, which no install could read.
- **Without the key** the app installs and runs. MJAPI logs one warning naming `MORECHEESE_SHARED_KEY` (with MemberJunction's quiet handling of a key an install doesn't have), and the Dropbox source and Skip dashboard components are unavailable.
- **`scripts/seal-credential.mjs`** (`new-key`, `seal`, `verify`, `check`) seals a credential's values with the key. **`npm run check:shared-credentials`**, now a CI gate, fails while any shipped credential is not sealed with it.
