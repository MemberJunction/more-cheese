---
"@mj-biz-apps/more-cheese-entities": minor
"@mj-biz-apps/more-cheese-server": minor
"@mj-biz-apps/more-cheese-ng": minor
---

Ship the Knowledge Hub content so search works on a fresh install. `config/` gains the crawl output with IDs preserved — 175 Tags (hierarchy, parents first), 192 Content Items (186 pages of the public site, 6 vault documents), 192 Content Item Chunks (their IDs are the vector record IDs in the shared Pinecone index) and 1,425 Content Item Tags — plus a delta `Metadata_Sync` migration (9.4 MB) generated against a fresh `mj app install` of v1.2.0, so the vectors already in `morecheese-content` resolve without a re-crawl. Intra-set references (tag parents, item→source, item-tag→tag) carry fixed IDs rather than `@lookup`s: tag names contain `&`, which the lookup parser cannot read.
