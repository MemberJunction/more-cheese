---
"@mj-biz-apps/more-cheese-entities": minor
"@mj-biz-apps/more-cheese-server": minor
"@mj-biz-apps/more-cheese-ng": minor
---

The demo user's setup now reaches whoever installs More Cheese. `demo.user@morecheese.org` is seeded as a template user (`IsTemplate`), and `mj-app.json` declares it as the app's `templateUser`: after `mj app install`, MJ offers to create the installer's own user as a full copy of it (pinned dashboards, Skip conversations and their components, pinned apps, settings), and to make it the template every later first sign-in is copied from. Non-interactive installs set `MJ_INSTALL_USER_EMAIL` (and optionally `MJ_INSTALL_USER_FIRST_NAME`, `MJ_INSTALL_USER_LAST_NAME`, `MJ_INSTALL_TEMPLATE_FOR_NEW_USERS=1`). Requires MemberJunction 6.2.0 or later (the release that adds template users and the template clone preset).
