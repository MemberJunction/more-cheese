# GAP-3 public-docs stopgap — HubSpot & Higher Logic object models

**Status: 📦 BACKLOGGED (2026-07-06, the schema owner)** — integration modeling dropped for this demo;
the marketing/community schemas ship as the simple baseline. This survey is RETAINED as the
pickup material for `DEMO-BACKLOG.md` BL-1 (raise in a later meeting). Do not apply the
recommendations below in the current release.

## HubSpot (calibrates the `_Marketing` schema)

Doc set (official developer docs):
- [Email Events API](https://developers.hubspot.com/docs/api-reference/legacy/reporting/email-analytics/guide) — the event model (scraped in full)
- [Understanding the CRM APIs](https://developers.hubspot.com/docs/api-reference/latest/crm/understanding-the-crm) · [Campaigns API](https://developers.hubspot.com/docs/api-reference/legacy/marketing/campaigns/guide) · [Marketing Emails v3](https://developers.hubspot.com/docs/api-reference/legacy/marketing/marketing-emails/guide) · [Lists API](https://developers.hubspot.com/docs/api-reference/latest/crm/lists/guide) · [Forms v3](https://developers.hubspot.com/docs/api-reference/legacy/marketing/forms/get-forms)

What the real product has that our schema lacks (objects only):
1. **Email is an EVENT LOG, not three timestamps.** 13 event types — SENT, DROPPED (+16-value
   drop-reason enum), PROCESSED, DELIVERED, DEFERRED, BOUNCE (+17-value category enum:
   UNKNOWN_USER, MAILBOX_FULL, SPAM, DMARC…), OPEN (+duration), CLICK (+url), PRINT, FORWARD,
   STATUSCHANGE, SPAMREPORT, SUPPRESSION. Our `EmailSend.OpenedAt/ClickedAt/UnsubscribedAt`
   has **no deliverability story** (no bounce/drop/spam/suppression) — minimum add
   `DeliveredAt/BouncedAt(+category)/SpamReportedAt`; better: an `EmailEvent` child table.
2. **MarketingEmail ≠ EmailTemplate**: a send unit with `state` lifecycle, publishDate,
   included/excluded LISTS, and a `stats` rollup (sent/delivered/open/click/bounce/unsub/spam).
3. **Campaign** carries startDate/endDate/budget/owner/audience + **campaign↔asset
   associations** (emails, forms, landing pages, lists, workflows — 26 asset types) and
   reporting metrics incl. REGISTRATIONS/ATTENDEES (nice tie-in to our events).
4. **Lists (segments)** have `processingType` MANUAL / DYNAMIC (filter-driven) / SNAPSHOT +
   a filter definition — our `Segment.DefinitionJSON` should adopt this triad.
5. **Forms + FormSubmission** are first-class marketing objects — we have none (note:
   bizapps-forms exists as an Open App; reconcile rather than invent).

## Higher Logic (calibrates the community/forums schema)

Doc set:
- [API v2.0 endpoint reference](https://api.connectedcommunity.org/v2.0/Help) (236 endpoints extracted) · [API portal](https://api.connectedcommunity.org/) · [API overview](https://support.higherlogic.com/hc/en-us/articles/360032691332-Higher-Logic-API) · [Push API v1 member-data dictionary](https://support.higherlogic.com/hc/en-us/articles/6535087910548-Higher-Logic-Push-API-v1)
- Concept docs: [Discussions](https://support.higherlogic.com/hc/en-us/articles/4404279262484) · [Libraries](https://support.higherlogic.com/hc/en-us/articles/4404272758292) · [Announcements](https://support.higherlogic.com/hc/en-us/articles/360033051631) · [Ideation](https://support.higherlogic.com/hc/en-us/articles/360033052291)

What the real product has that our schema lacks (objects only):
1. **Community is the container** (membership, join/invitations, per-community stats) —
   discussions belong to a Community, not a bare category tree.
2. Sibling content objects alongside discussions: **Libraries → LibraryDocuments →
   Attachments** (favorites/comments), **Announcements**, **Blogs + BlogComments**,
   **Events + RSVP/Registrants**, **Ideation** (Ideas + Categories + Statuses + Votes),
   **Q&A with Best Answer**.
3. Discussion hierarchy is Discussion → Thread (taggable, followable) → Post (replies,
   anonymous flag, cross-posting, recommendations, best-answer toggle).
4. "Reactions" are **recommendations spanning posts, documents, and blogs** — not forum-only.
5. Members are rich **Contact profiles** (demographics, job history, education,
   ribbons/badges via automation rules) — ours reference bare Person IDs (fine — that's
   `bizapps-common`'s job — but ribbons/badges are a nice engagement-visible object).

## Recommendation if approved (post-review, at the reconciliation)
Adopt a **minimum credible set**, not the whole surface: EmailSend → add deliverability
(bounce/drop/spam/suppression, ideally an EmailEvent log) + list-targeted MarketingEmail +
campaign-asset links + segment processingType; Forums → wrap in a Community container + add
Announcements and a Library (documents) + thread tags + best-answer. Everything else is listed
for the "simulates X" doc note, not built. Cross-check against the real exports when they
arrive (the ask is out).
