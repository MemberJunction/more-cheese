---
"@mj-biz-apps/more-cheese-entities": minor
"@mj-biz-apps/more-cheese-server": minor
"@mj-biz-apps/more-cheese-ng": minor
---

The `DuplicatePerson` data quality labels now name the duplicate as it reads after the planted duplicates were aligned with their originals. 24 of the 25 labels' `DefectValue` named a person who no longer exists ("Manish Agarwal (ICF-D00467)" on a record that reads "Oleg Agarwal"); each now reads "<FirstName> <LastName> (<code>)" from the duplicate's own fields, with the code unchanged. Kathy OLeary's label already matched. 24 Data Quality Labels rows change `DefectValue` only; no record is added or removed, and `TruthValue` and `Notes` are unchanged. The changed rows reach a host with the next release's Metadata_Sync seed.
