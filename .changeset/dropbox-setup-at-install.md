---
"@mj-biz-apps/more-cheese-entities": minor
"@mj-biz-apps/more-cheese-server": minor
"@mj-biz-apps/more-cheese-ng": minor
---

The demo Dropbox is now connected at install time instead of shipped in the release (#110). Releases up to v1.3.x seeded a "Dropbox OAuth" credential whose value was encrypted with the release machine's key, so every other install logged a decrypt error at MJAPI startup, and a real read-only key can never ship in a public repo. The credential, the "More Cheese Dropbox" storage account and its permissions are no longer seeded; a new post-install and post-upgrade hook (`@mj-biz-apps/more-cheese-server/dist/setup/dropbox-setup.js`) creates them on the install itself when someone supplies the read-only key (prompts, or `MORECHEESE_DROPBOX_*` environment variables), so the credential is encrypted with that install's own key. Without a key the install is clean and Knowledge Hub simply has no Dropbox source. A migration removes the shipped placeholders from existing installs, only while the credential is still the untouched placeholder. The README explains both ways to connect.
