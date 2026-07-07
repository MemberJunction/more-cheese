# MoreCheese Demo Data — Design Review

**What this is:** the design of the MoreCheese demo data, in one reviewable document — what
we're building and why (§1–§2), the database design (§3), how the data gets generated and
checked (§4), what's already decided (§5), and the open decisions we need input on (§6).

**Status: OPEN FOR REVIEW** · Drafted 2026-07-07 · §5 is settled, with the evidence cited —
please don't re-open it. §6 is where input is needed.

Companions: [ASSOCIATION-PROFILE.md](ASSOCIATION-PROFILE.md) (the fictional association,
described plainly) · [DATA-SUMMARY.md](DATA-SUMMARY.md) (the sales-facing summary).

---

## 1. What we're building

The demo database for **MoreCheese** (the International Cheese Federation): a fake but
carefully realistic professional association — ~2,500 members at default scale, with small
(~500) and large (~15,000) presets. It's not random filler: every rate a prospect might
sniff-test (renewal %, conference turnout, email opens, medal rates) is calibrated to real
published numbers and real IRS filings, and a cast of named "hero" members with fixed
storylines keeps demo scripts working release after release.

**What the data is engineered to show off** (full list: [FEATURES-REVIEW.md](FEATURES-REVIEW.md)):

- **One person, every system** — the same member appears consistently in membership, events,
  learning, community, marketing, support, and money data; every cross-system drill-down
  resolves. This is the #1 engineered feature.
- **Retention stories with findable causes** — every lapse has a reason an AI can discover
  live in the data (an employer folded a program, a company got acquired, a creamery closed).
- **Engagement scores with receipts** — computed from actual behavior, never typed in, with
  counter-patterns that punish naive models (a highly engaged member who spends nothing; a
  disengaged one who's zero-risk).
- **Predictive models that actually predict** — churn, renewal, lifetime value, attendance,
  certification completion, and event ROI are trainable because the cause-and-effect
  relationships really are in the data.
- **Numbers that survive a knowledgeable prospect** — calibrated and primary-source-verified.
- **Data-quality problems with known answers** — ~50 deliberate duplicate people and ~100
  stale employer records, with the truth stored, so dedup/enrichment demos have a verifiably
  right answer.

It ships as one installable MJ Open App in two packages: the app (schemas, config,
dashboards — no fake data) and an optional data companion (all the generated content).

## 2. How it's put together

We do **not** build members, orders, payments, or committees from scratch. The app
**composes 10 apps we already have** and adds only the genuinely cheese-specific parts.
The composition is itself the sales pitch: "here's what you assemble from the ecosystem
vs. what's truly custom."

| Composed app | What it provides to the demo |
|---|---|
| bizapps-common | People, organizations, employment, contact info — the identity layer |
| subscriptions | Memberships, modeled as recurring subscriptions |
| orders | Every purchase: dues, event registrations, course fees, entry fees, merch, donations |
| payments | Payment records against those orders |
| accounting | The ledger — every payment lands as a balanced journal entry |
| sonar | Engagement scoring (feeds the predictive models) |
| committees | Charters, terms, meetings, motions, votes, minutes |
| issues | Member-service tickets / the support queue |
| secure-messaging | Member↔staff and board message threads |
| tasks | Work tracking across committees, events, and legislative activity |

**The schema-only rule** (kickoff decision): we only need these apps' **database tables
frozen** — not their features finished — because the demo loads pre-baked, finished data
(an already-fulfilled order, an already-posted journal entry). We ship the *results*, not
the running process.

**The 8 custom schemas:** Members, Events, Learning, Forums, Resources, Awards/Competition,
Legislative, Marketing. They're deliberately spread across schemas so the demo looks like a
real customer's messy multi-system world — an AMS, an LMS, an email platform, a community,
a support desk — that MJ then unifies.

**Two structural commitments:**

- **A member is a profile, not a person.** The person lives once in bizapps-common; the
  member profile points at it. That's how the same human shows up consistently in events,
  courses, forums, and payments — the unification story depends on it.
- **Engagement scores are computed, never typed in.** We define the scoring model as
  configuration, generate the *behavior*, then run Sonar's real scoring engine at release.
  Elena isn't labeled "engaged" — her activity earns it. (This also means Sonar's
  still-moving table design can't block us; we depend on its engine, not its tables.)

## 3. The database design (summary — column detail in [research-plan-and-schema-proposal.md](research-plan-and-schema-proposal.md) Part 2)

| Schema | Tables |
|---|---|
| Members | MemberProfile (→Person), MembershipType, MembershipPeriod (→subscriptions), Chapter, ChapterOfficer |
| Events | Event, EventSession, EventTrack, EventSpeaker, EventRegistration |
| Learning | Course, CourseEnrollment, Certification, CertificationRecord, CEEvent, CECredit |
| Forums | ForumCategory, ForumThread, ForumPost, ForumReaction, ForumModeration |
| Resources | Resource, ResourceCategory, ResourceDownload, ResourceBookmark |
| Awards | Product, Competition, CompetitionEntry, Judge, JudgeScore |
| Legislative | LegislativeBody, LegislativeIssue, LegislativePosition, AdvocacyAction, GovernmentContact, AdvocacyEngagement |
| Marketing | Campaign, Segment, EmailTemplate, EmailSend, EmailEngagement |

**Why the rules below exist:** v1's data bugs were all one bug wearing different hats —
related facts stored independently, free to disagree. Members marked "Active" with expired
dates. Medals unrelated to judges' scores. A stored engagement score that was all zeros.
v2's design makes each of those **impossible to store**, not just unlikely:

1. **Dates mean one thing.** `EndDate` = when the paid period ends. `RenewalDate` = the next
   renewal due date (normally the same day). `CancellationDate` = the day someone stopped
   being a member — set both for "I quit" and for "stopped paying and the 2-month grace ran
   out," with the reason field saying which. Late renewals connect with no gap (the next
   period back-dates).
2. **No stored member status.** Status is always computed from the membership records, so it
   can never drift out of sync with the dates (the confirmed v1 bug).
3. **The database checks itself.** Allowed values are enforced by the database (no free-text
   statuses), relationships are real foreign keys — including across schemas — and
   consistency rules (a click requires an open; CE credit requires attendance; invoice math
   adds up; medals agree with scores) are database checks plus an install-time integrity
   check that fails loudly.
4. **Everything has a time window,** and child records must fit inside their parents'
   windows — a registration can't predate the membership; a committee vote can't postdate
   the term.
5. **Every generated row is flagged `IsSharedDemo`** so demo data and real morecheese.org
   production data can safely share a database.
6. **Stable business keys** (member numbers, invoice numbers, event slugs) so regeneration
   is deterministic and heroes survive every rebuild with minimal diffs.
7. **Derived numbers are computed last, never trusted as inputs** — anything like an
   engagement score or an invoice balance is produced from the underlying rows at the end,
   with arithmetic checks so it can't silently go stale.

**Still to confirm with Marcelo** (tracked in [RECONCILIATION-ASKS.md](RECONCILIATION-ASKS.md)):
the Subscription and order-line shapes, where org size/region lives, event venue geo columns,
map coordinates on addresses (a bizapps-common change), the 'Suspended' status value, and
donation order-line typing — **plus confirmation that the composed apps can accommodate three
of the rules above**: cross-schema foreign keys (rule 3), `IsSharedDemo` everywhere (rule 5),
and the competition's "entrant must be a member organization" hard gate. We state them here
as design requirements; they're asks B5–B7 until Marcelo confirms.

## 4. How the fake data gets made — and how we'll know it worked

### The ruleset

An AI authors a **causal ruleset** — a machine-readable file describing association life —
and ordinary, deterministic code executes it. The ruleset holds four kinds of content:

1. **Realistic numbers** — the calibrated targets (renewal 87%, $175 dues, 25% medal rate…).
2. **Cause-and-effect rules** (~50 of them, each with a predicted direction). Examples:
   longer tenure → likelier renewal · more engaged → more event registrations · higher ticket
   price → fewer no-shows · member and event in the same region → likelier registration ·
   employer dissolved or acquired → renewal risk. The draft map is
   `research/causal-map-draft.md`; the workshop reviews every direction.
3. **Value lists and eras** — what categories exist (segments, event types, cheese styles)
   and what time periods shaped behavior.
4. **Text templates** — bios, tasting notes, forum posts, support conversations, generated
   with enough variation that semantic search and clustering behave believably.

Two **invisible dials** drive most behavior: each person gets an *engagement* level and an
*affluence* level (correlated — engaged members tend to spend more). Neither is stored
anywhere; they exist only inside the generator and express themselves through behavior —
registrations, posts, purchase sizes, renewal odds. That's what makes cross-tabs hold up:
the correlations are real, produced by shared causes, not painted on.

### Time

Five years of dated history follow real-world eras: steady growth → the COVID shock (events
halved, competition canceled two years) → recovery → today's hybrid normal — plus the annual
rhythm ending in the December renewal crunch. All dates are authored **relative to release
day** and baked at each quarterly release, so "upcoming" events stay upcoming forever. An
optional **declining-association scenario** (calibrated to real craft-food decline curves)
can be switched on for dramatic retention demos.

### Heroes

The 22 named members are **pinned inputs**, not hand-written data: each is a small set of
fixed facts (name, member number, employer, join date, milestones, their engagement/affluence
levels) and the generator grows a full consistent history around them. Every release
re-verifies each hero loads with their story intact — that check is release-blocking.

### Determinism

Same seed → byte-identical output. The generator runs at **release time**, never at install:
installs load finished data, embeddings are pre-computed, and Sonar's scoring runs once at
release. No live AI calls, no external services, no surprises on a customer's machine.

### The safety nets

1. **Benchmarks with tolerances.** Every headline number is a target with an allowed range;
   after generation we measure the data and **the build fails** if it misses. A handful of
   benchmarks are deliberately held out as blind checks — the generator never sees them, and
   the data has to reproduce them anyway.
2. **The database rules in §3** — bad combinations simply can't load.
3. **The 108 curated queries** ported from v1 — every one must return a meaningful,
   non-degenerate answer (in v1, whole query families silently ran on dead columns).

### What consumes the data

Sonar scores the generated behavior → **7 predictive models** (churn, renewal likelihood,
LTV, attendance forecast, engagement, cert completion, event ROI) train on real signal →
dashboards, saved views, semantic search, and the demo scripts all sit on top. If the causal
rules are wrong, every one of those layers wobbles — which is why the pilot gate exists.

### The pilot gate (first milestone once §6 is settled)

Generate a small vertical slice — member → subscription → event registration — at ~500
people, then check it. **Pass means:** every cause-and-effect rule in the slice shows up in
the data with the *predicted direction* (a flipped sign is a hard fail), every in-slice
benchmark lands within tolerance, and the in-slice heroes load with their pins intact.
**On failure:** the ruleset gets fixed and re-run; a flipped sign goes back to the causal-map
workshop rather than being patched quietly. **Who calls it:** Barnatt (data workstream), with
Madhav confirming the method held. Only after a green pilot do we generate the full dataset.

## 5. Already decided — please don't re-open (evidence cited)

| Decision | Evidence / authority |
|---|---|
| Professional society; individuals are members | morecheese site; team 2026-07-02 |
| US-lean metrics; 60/25/15 geo mix; single USD; US-hosted flagship; no honorific grades | Barnatt 2026-07-02 |
| Calendar-year memberships as the **dominant** cycle (December renewal spike) — *whether a minority anniversary cohort exists alongside is open as D6* | real ACS ground truth (R8) |
| CancellationDate = termination (quit AND lapse-past-grace); late renewals back-date; stored member status banned | team Q&A 2026-07-02 |
| Sonar scores come from running Sonar's real engine at release — never faked | design rec. D |
| Donations flow through Orders as post-install configuration (no Fundraising app) | Robert, 2026-07-06 |
| Team-named heroes are always carried (Elena, Anna Brown); this roster is the single roster of record | Marcelo, 2026-07-06 |
| HubSpot/Higher Logic lookalike schemas deferred; simple baselines ship | Marcelo, 2026-07-06 → backlog BL-1 |
| Payment timing modeled as a 3-part mixture (checkout / auto-pay spike / corporate late curve) with approved sources | Marcelo, 2026-07-06 |
| Support-ticket realism is estimate-led (no real data exists; Izzy data confidential) | Marcelo, 2026-07-06 |
| All load-bearing benchmark figures verified against primary sources | 2026-07-07, JSON `$v091` |

## 6. Decisions we need

| # | Decision | Recommendation | Why (one line) |
|---|---|---|---|
| D1 | Renewal rate: **87%** vs the 89% prior | Adopt 87% | The closest real societies' own tax filings show flat-to-shrinking membership (the size-twin: five straight down years) — 89% would mean growth none of them shows. Verified against the e-filed 990s. |
| D2 | Flagship attendance: **35% of members** vs the 25% prior | Adopt 35% (+32% non-member registrants) | The old 25% was a generic guess; real ACS numbers decompose to exactly 35% + 32%. |
| D3 | Grace period = **2 months** | Adopt | It's the industry's most common policy (48% of associations, MGI survey). |
| D4 | **~625 organizations** at default scale (plan said ~25) | Adopt 625 | The competition needs ~210 entering companies to look real; 25 orgs can't carry it. |
| D5 | Default hosted-demo size | **Large (15,000 members)** | Meets the "10k+ credibility" ask, and it's now honestly sized from real same-size associations (~2,000-person flagship, ~$4M revenue). |
| D6 | Renewal cycle: pure calendar-year, or calendar-year **plus a ~25–30% anniversary cohort** (GAP-12) | **The mixed policy** *(Barnatt's pick, 2026-07-07)*: auto-pay members bill on their join anniversary (that's how subscription billing really works — and it exercises our subscriptions app), optionally plus members grandfathered from a 2022 policy switch. December still dominates. | Pure calendar-year empties the "who's about to renew?" demo — and bunches all lapses around March — for most of the year. Half of individual-member associations really do run anniversary cycles, so the mix is honest. Also fixes three hero storylines. Detail: Marcus Chen goes in the anniversary cohort with auto-renew OFF (his story needs reminder emails); org-tier cycle to be specified at ratification. *(If adopted: ASSOCIATION-PROFILE §3, the §5 calendar row here, and the JSON cycle note get updated — flagged in each.)* |
| D7 | Bless the hero names (permanent afterward) | Review via [PERSONAS-REVIEW.md](PERSONAS-REVIEW.md) | Two names are already fixed by prior team use (Elena Rodriguez, Anna Brown). |
| D8 | Who owns hero authoring from here (OQ-7) | **Name an owner now** | Hero content is hand-written, quality-gated, and release-blocking; 22 of the target 50–100 exist and the ship date is July 31. This is the schedule's longest pole. |

## 7. What happens next (the sequence)

| Step | Who | Output |
|---|---|---|
| 1. Schema reconciliation session (agenda: [RECONCILIATION-ASKS.md](RECONCILIATION-ASKS.md)) | Barnatt + Marcelo (needs his BizApps survey) | Final table shapes for the vertical slice; B1–B7 answered |
| 2. Causal-map workshop | Barnatt, Marcelo, Madhav, Robert | Every arrow direction agreed; D6 mechanism ratified; the ruleset's first-draft edge list |
| 3. Ruleset v0.1 | Barnatt | The vertical slice (member → subscription → event registration), authored and runnable |
| 4. N≈500 pilot | Barnatt (Madhav confirms method) | Pass/fail against the §4 gate; fixes looped until green |
| 5. Full generation | data workstream | All three presets, full benchmark check, heroes verified |

Rough effort and calendar (ship date July 31): see [work-breakdown.md](work-breakdown.md) —
the generator is the hardest engineering in the project, hero content is the longest lead time.

## 8. Risks & schedule watch-items

- **⏱ Composed-app schema freezes (OQ-11)** — the whole timeline hangs on when the 10
  dependency apps' tables freeze; several were unconfirmed at kickoff. Owner: Marcelo.
  Get dates.
- **⏱ Hero pipeline** — 22 of 50–100 written, authoring owner unassigned (D8),
  release-blocking.
- **The seams between apps** — where one app's tables meet another's assumptions is where
  integration time vanishes; the cross-app integrity check is the smoke test that proves the
  composition works.
- **The generator itself is real engineering** — thousands of records that all line up
  (dates, statuses, payments-to-ledger) is exactly where v1 broke; the §3/§4 machinery exists
  because of it.
- **Support-ticket numbers are estimates** — no real association data exists (and internal
  Izzy data was ruled out for confidentiality). Labeled as estimates; fine for demos.
- **Large-preset conference (~2,000 registrants) is an upper-mid estimate** — hard evidence
  supports the middle of the band; the stated tolerance covers it.
- **Text templates** (bios, tasting notes, posts) have requirements but no authoring plan —
  due after the pilot; will need an owner.
- Deliberately deferred, with context to pick each up cold: [DEMO-BACKLOG.md](DEMO-BACKLOG.md).

## 9. Reading map

| Want… | Read |
|---|---|
| The association as a story + all headline numbers | [ASSOCIATION-PROFILE.md](ASSOCIATION-PROFILE.md) |
| What sales approves | [DATA-SUMMARY.md](DATA-SUMMARY.md) |
| What the data is engineered to show off, in priority order | [FEATURES-REVIEW.md](FEATURES-REVIEW.md) |
| Effort, timeline, and what could bite us | [work-breakdown.md](work-breakdown.md) |
| Every target number with source/confidence/tolerance | `research/benchmarks-draft.json` v0.9.1 (canonical) |
| Column-level schema detail | [research-plan-and-schema-proposal.md](research-plan-and-schema-proposal.md) Part 2 |
| Why the schema is shaped this way (generation requirements) | [generative-schema-findings.md](generative-schema-findings.md) |
| The cause-and-effect map the generator uses | `research/causal-map-draft.md` |
| The heroes | [hero-personas-draft.md](hero-personas-draft.md) + [PERSONAS-REVIEW.md](PERSONAS-REVIEW.md) |
| Decision audit trail | [gaps-to-fill.md](gaps-to-fill.md) |
| The Marcelo session agenda | [RECONCILIATION-ASKS.md](RECONCILIATION-ASKS.md) |
