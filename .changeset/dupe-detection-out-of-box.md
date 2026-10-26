---
"@mj-biz-apps/more-cheese-entities": minor
"@mj-biz-apps/more-cheese-server": minor
"@mj-biz-apps/more-cheese-ng": minor
---

Ship duplicate detection out of the box. New metadata in `config/`: the `More Cheese Duplicates (Pinecone)` vector index, three Record Duplicate entity documents (People, Organizations, Products; Gemini Embedding 2, identity templates, Pinecone-scale thresholds), and one completed detection run for each, carrying the details that found matches. The People run finds 22 of the 25 planted duplicate pairs at 0.93, with one false positive. Removes the shared "Duplicate-Suspect People" view and its UI-role permission, which listed the planted pairs straight from the data-quality labels.
