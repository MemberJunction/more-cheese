---
"mj-more-cheese-demo": minor
---

Committees data enrichment (surfaced by running against the real bizapps-committees UI): each committee now schedules meetings ahead — `upcomingPerCommittee` future meetings with Status 'Scheduled' and no attendance yet — so the app's forward/upcoming view is populated instead of an all-past archive. Motions gain a `contentiousShare` with a tighter `contentiousVoteSplit`, so a realistic minority genuinely FAIL; the outcome stays causally derived from the actual vote tally (never forced). New validation gate asserts the upcoming-meeting count per committee and that future meetings carry no attendance. No schema change — data-generation only.
