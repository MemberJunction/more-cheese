---
"@mj-biz-apps/more-cheese-entities": minor
"@mj-biz-apps/more-cheese-server": minor
"@mj-biz-apps/more-cheese-ng": minor
---

People form, Membership section: a new Membership status card shows Current, Lapsed or Never Purchased, with the tier and the expiry or lapse date. It reads the new "Membership Status" stored query, which is the single definition of those three states. If the query is missing or fails, the card is hidden and the rest of the panel still loads.

Organization form, Staff section: More Cheese now adds membership figures to the Staff section through Common's Staff section plug-in point (`OrganizationStaffContributor`, registered as `more-cheese-membership`): current members, certifications held, competition entries, conference attendances and the average AI renewal probability, plus a membership, renewal and certification cell per person. Its renewal scores use the same Predictive Studio filter as the member page.

The member page's renewal prediction now reads only Predictive Studio prediction rows: `MJ: Process Run Details` whose run belongs to a Record Process with `WorkType = 'ML Model'` and that carry a result payload. Before this, the page read the newest 10 detail rows of any process for the person, so a run of another process (a Sonar rescore, for example) could push the prediction off the page and show "Not Scored". A person who never bought a membership now sees "Not a member" on the renewal card, because there is nothing to renew.

Adds three ICF query categories and three stored queries under `config/`: Membership Status (optional PersonID and OrganizationID filters), Member Event Attendance, and Certified Members Without Recent Event Attendance. These are metadata that ships in the next release's Metadata_Sync seed, which is why this is a minor bump. There is no migration in this change.

Depends on bizapps-common's release that adds the Staff section plug-in point (`OrganizationStaffContributor` in `@mj-biz-apps/common-ng`). `@mj-biz-apps/common-ng` is a new peer dependency of `@mj-biz-apps/more-cheese-ng`.
