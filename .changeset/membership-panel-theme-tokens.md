---
"@mj-biz-apps/more-cheese-entities": patch
"@mj-biz-apps/more-cheese-server": patch
"@mj-biz-apps/more-cheese-ng": patch
---

People form, Membership section: the panel now follows the Explorer theme. In dark mode it previously showed white KPI boxes (with the values unreadable) and light status pills, because its CSS used variables MJ does not define and fell back to light colors. Every color now comes from MJ's semantic theme tokens (`_tokens.scss`, checked against MJ 6.1.4), including the Attribution Drivers and Prediction History block. In light mode the AI accent changes from a fixed indigo to the theme's brand primary, so it also follows white-labeling. CSS only, with no schema, metadata or API change. Fixes #83.
