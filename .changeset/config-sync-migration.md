---
"@mj-more-cheese-demo/entities": minor
"@mj-more-cheese-demo/server": minor
"@mj-more-cheese-demo/ng": minor
---

Add the Explorer/app configuration seed migration (`V202609122355__v1.1.x_Config_Sync.sql`), captured from `mj sync push --dir config` on a clean database and proven on a second one: persona user views + resource permissions, Knowledge Hub application roles, the Sonar engagement score model (factors, bands, windows, activation), Gemini embedding + Betty AI rows, Knowledge Hub content type/sources and Pinecone vector index, Dropbox storage-provider activation and a "Dropbox OAuth" credential type. The demo dataset ships as a separate migration.
