---
"@mj-biz-apps/more-cheese-entities": minor
"@mj-biz-apps/more-cheese-server": minor
"@mj-biz-apps/more-cheese-ng": minor
---

Ship Knowledge Hub tag co-occurrence, tag governance suggestions and audit history, content item duplicate pairs, and bounded Search Scopes out of the box (generated on 2026-11-02 against `@memberjunction/*@6.1.6`), produced deterministically from the committed `config/` crawl tree by `scripts/build-knowledge-hub-governance.mjs` (+ spec in `test:gates`). New metadata in `config/`: `tag-co-occurrences` (2,107 canonical pairs derived from `content-item-tags` for the Clusters graph and Analytics Co-Occurrence table), `tag-suggestions` (72 governance suggestions across `MergeCandidate`, `LowUsage`, and `WideNode` using `TagHealthJob` columns), `tag-audit-logs` (12 root taxonomy `Created` audit entries), `content-item-duplicates` (11 title-matched duplicate content item pairs), and `search-scopes` (`All`, `Knowledge`, `Entities`, and `Files` with `MJ: Search Scope Providers`, `MJ: Search Scope Entities`, `MJ: Search Scope Storage Accounts`, and `UI`/`Developer` `MJ: Search Scope Permissions`).
