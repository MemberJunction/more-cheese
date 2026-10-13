---
"@mj-biz-apps/more-cheese-entities": minor
"@mj-biz-apps/more-cheese-server": minor
"@mj-biz-apps/more-cheese-ng": minor
---

The 25 planted duplicate people (`DuplicatePerson` data quality labels) now share their original's first, middle and last name and date of birth, and their phone wherever both records have one, so duplicate detection has real duplicates to find. Before, the generator's name and DOB passes gave every duplicate its own identity, and none of the 25 pairs shared a first name or birth date. Kathy OLeary keeps her nickname and spelling. Email, employer and every record ID are unchanged. 25 People rows and 17 Contact Methods rows change field values; no record is added or removed. The changed rows reach a host with the next release's Metadata_Sync seed.
