---
"@mj-more-cheese-demo/entities": minor
"@mj-more-cheese-demo/server": minor
"@mj-more-cheese-demo/ng": minor
---

Identity columns on the member and organization profiles: country, postal address, and voluntary self-identified demographics (race/ethnicity, Hispanic origin, pronouns, primary language). Adds the columns to the baseline schema and folds the CodeGen regeneration — base views, CRUD stored procedures and update triggers for the two changed tables — into a migration, with the regenerated entity subclasses, resolvers and form components.
