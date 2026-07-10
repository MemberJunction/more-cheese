# MoreCheese Demo Data — Design Review

**What this is:** the design of the MoreCheese demo data, in one reviewable document.
**The open decisions that need your input come first (§1).** Everything after them is
context: what we're building and why (§2–§3), the database design (§4), how the data gets
generated and checked (§5), and what's already decided (§6).

**Status: OPEN FOR REVIEW** · Drafted 2026-07-07 · §1 is where input is needed. §6 is
settled, with the evidence cited — please don't re-open it.
**2026-07-08:** review feedback received ([DESIGN-REVIEW-FEEDBACK.md](DESIGN-REVIEW-FEEDBACK.md),
Robert — concurs on D1–D8) and its accepted findings folded in: D9/D10 added, D5/D7/D8
amended, ruleset-spec step added to §7, pilot gate and safety nets upgraded in §5.

Companions: [ASSOCIATION-PROFILE.md](ASSOCIATION-PROFILE.md) (the fictional association,
described plainly) · [DATA-SUMMARY.md](DATA-SUMMARY.md) (the sales-facing summary).

---

## 1. Decisions we need

Eight open decisions. Each has a recommendation and the evidence in one line; the context
behind them is in §2–§5, and the full evidence trail is in the reading map (§9).

| # | Decision | Recommendation | Why (one line) |
|---|---|---|---|
| D1 | Renewal rate: **87%** vs the 89% prior | Adopt 87% | The closest real societies' own tax filings show flat-to-shrinking membership (the size-twin: five straight down years) — 89% would mean growth none of them shows. Verified against the e-filed 990s. |
| D2 | Flagship attendance: **35% of members** vs the 25% prior | Adopt 35% (+32% non-member registrants) | The old 25% was a generic guess; real ACS numbers decompose to exactly 35% + 32%. |
| D3 | Grace period = **2 months** | Adopt | It's the industry's most common policy (48% of associations, MGI survey). |
| D4 | **~625 organizations** at default scale (plan said ~25) | Adopt 625 | The competition needs ~210 entering companies to look real; 25 orgs can't carry it. |
| D5 | Default hosted-demo size | **Large (15,000 members)** — with two conditions (review 2026-07-08): (a) a **volume budget** before sign-off (large ≈ 5M+ email-send rows over 5 years, plus pre-computed embeddings — get install-time and package-size numbers); (b) at least **one full large-preset generation** before launch, not just the 500-pilot | Meets the "10k+ credibility" ask, and it's now honestly sized from real same-size associations (~2,000-person flagship, ~$4M revenue) — but large is the least-validated preset. |
| D6 | Renewal cycle: pure calendar-year, or calendar-year **plus a ~25–30% anniversary cohort** (GAP-12) | **The mixed policy** *(Barnatt's pick, 2026-07-07)*: auto-pay members bill on their join anniversary (that's how subscription billing really works — and it exercises the subscription machinery in bizapps-orders), optionally plus members grandfathered from a 2022 policy switch. December still dominates. *(2026-07-10: bizapps-orders' published design models NO cycle alignment — zero upstream constraint on this decision.)* | Pure calendar-year empties the "who's about to renew?" demo — and bunches all lapses around March — for most of the year. Half of individual-member associations really do run anniversary cycles, so the mix is honest. Also fixes three hero storylines. Detail: Marcus Chen goes in the anniversary cohort with auto-renew OFF (his story needs reminder emails); org-tier cycle to be specified at ratification. *(If adopted: ASSOCIATION-PROFILE §3, the §6 calendar row here, and the JSON cycle note get updated — flagged in each.)* |
| D7 | Bless the hero names (permanent afterward) | Review via [PERSONAS-REVIEW.md](PERSONAS-REVIEW.md) — with one gate first (review 2026-07-08): a **name/entity collision check** (hero and org names vs. real people/businesses in this small, real industry) and a one-line "calibration, not depiction" note re: the identifiable ACS | Two names are already fixed by prior team use (Elena Rodriguez, Anna Brown). |
| D8 | Who owns hero authoring from here (OQ-7) | **Name an owner now — and formally re-scope the July-31 hero target to ~25** (roughly the current cast), letting quarterly refreshes grow toward 50–100 (review 2026-07-08) | Hero content is hand-written, quality-gated, and release-blocking; 22 exist, the owner is unassigned, and the ship date is July 31. Deliberate scoping now beats week-5 triage. |
| D9 | **Per-app data packs** — one installable data pack per composed bizapps app (common → tasks → issues → committees → …), rolling up to the full dataset *(proposed 2026-07-08 from Amith's comments)* | Adopt, with the **generate-once / partition-into-packs** principle fixed now, a pack dependency pyramid mirroring the app graph, and a handful of **named, tested bundles** rather than arbitrary combinations | Amith's ask, and it's the BizApps-suite sales story — but the causal generator cannot run per-pack (one hidden dial drives a person's registrations *and* posts *and* payments), so generation stays monolithic and packaging becomes the final partitioning step. Additive if decided before the generator's output format is designed; a rewrite after. |
| D10 | **bizapps-forms as composed app #11** — forms + responses (session evaluations, post-event surveys, membership applications) *(proposed 2026-07-08)* | Adopt as an **optional pack** — the readiness concern resolved itself (2026-07-10): forms Phase 1 is **build complete** (audited 07-01; schema migrated, codegen'd, 396 tests; `FormResponse`/`FormResponseAnswer` shapes known). Still not a July-31 blocker: the forms *data* module (response-rate benchmarks, arrows 4.11/4.12) stays post-pilot work | Plugs a real hole (Dale Peterson's "great reviews" currently have no table to live in; event-ROI gains a satisfaction signal) — and it turned out to be the *most* frozen of the newer apps, not the least. |

---

## 2. What we're building

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

## 3. How it's put together

We do **not** build members, orders, payments, or committees from scratch. The app
**composes 10 apps we already have** and adds only the genuinely cheese-specific parts.
The composition is itself the sales pitch: "here's what you assemble from the ecosystem
vs. what's truly custom."

| Composed app | What it provides to the demo |
|---|---|
| bizapps-common | People, organizations, employment, contact info — the identity layer |
| bizapps-orders | Every purchase AND the payments AND the subscriptions — its published design folds all three together: products (typed: Membership/Event/Donation/merch), orders (the posted Order *is* the bill — no invoices), payments, and subscriptions that spawn a renewal order each cycle. **Memberships live here.** *(2026-07-10: the plan's original list counted payments and subscriptions as separate apps; the real design merges them — and the app is pre-implementation, see §8.)* |
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

**Per-app data packs (proposed under D9):** the data ships as one installable pack per
composed app — a common pack (people/orgs), a committees pack, a tickets pack, and so on —
each doubling as a showcase for its app, all rolling up to the full demo. The architecture
rule: **cook once, portion at the end.** The generator always runs over the whole world (the
cross-connections are the product), and a final emitter step partitions the finished rows
into packs. Packs form a dependency pyramid mirroring the app graph (common is the base;
you can stop anywhere on the way up, but never skip a layer something depends on), the
install-time integrity check runs per layer, and stable business keys make cross-pack
references safe. We ship a few **named, tested bundles** ("Full demo," "AMS core,"
"Engagement") rather than promising arbitrary combinations; computed data (Sonar scores,
trained models) sits at the top of the pyramid and installs only with the full set (or gets
recomputed over what's present).

**Two structural commitments:**

- **A member is a profile, not a person.** The person lives once in bizapps-common; the
  member profile points at it. That's how the same human shows up consistently in events,
  courses, forums, and payments — the unification story depends on it.
- **Engagement scores are computed, never typed in.** We define the scoring model as
  configuration, generate the *behavior*, then run Sonar's real scoring engine at release.
  Elena isn't labeled "engaged" — her activity earns it. (This also means Sonar's
  still-moving table design can't block us; we depend on its engine, not its tables.)

## 4. The database design (summary — column detail in [research-plan-and-schema-proposal.md](research-plan-and-schema-proposal.md) Part 2)

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

**Still to confirm with Marcelo** (tracked in [RECONCILIATION-ASKS.md](RECONCILIATION-ASKS.md)
— see its **2026-07-10 findings banner**: the composed apps' public design docs were read, and
the Subscription/order-line questions are now answered at design level; the session confirms
rather than discovers). What remains genuinely open: the **individual-member pattern**
(their Order/Subscription design requires a customer *organization* — B2B-shaped), the
**`MembershipProduct` extension fields** (exists by name, zero fields defined — we propose,
not ask), where org size/region lives, event venue geo columns, map coordinates on addresses,
the 'Suspended' status value — plus confirmation that the composed apps accommodate
cross-schema foreign keys (rule 3), `IsSharedDemo` everywhere (rule 5), and the competition's
"entrant must be a member organization" hard gate (asks B5–B7).

**Membership data's two-stage life** (2026-07-10): bizapps-orders won't have tables by July 31
(§8), so our `MembershipPeriod` is the **shipping shape** for this release. When the orders app
lands, each period row decomposes into their design's canonical form — one long-lived
`Subscription` per member + one renewal `Order` per cycle + payments + an event stream. The
generator's flat period table is deliberately the intermediate that can emit either.

## 5. How the fake data gets made — and how we'll know it worked

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
day** and baked at each quarterly release, so "upcoming" events stay upcoming forever. The
forward window is explicit: upcoming events with pre-registrations, **future membership
expirations** (spread realistically — this depends on D6), and **future-expiring committee
terms** (which also gives the governance demo a live "term ending soon" hook). An optional
**declining-association scenario** (calibrated to real craft-food decline curves) can be
switched on for dramatic retention demos.

**One canonical windowing mechanism** (review 2026-07-08): the release date is a generator
input, and *re-running the generator is* the date-windowing process — deterministic, so the
same seed + new date gives the same world, slid forward. The standalone date-shift script
survives only as a clearly-labeled mid-quarter emergency tool, never a peer mechanism (two
peer mechanisms would drift). Windowing is **calendar-aware** either way: seasonal anchors
re-snap rather than slide, so the July conference stays in July and the December crunch
stays in December.

### Heroes

The 22 named members are **pinned inputs**, not hand-written data: each is a small set of
fixed facts (name, member number, employer, join date, milestones, their engagement/affluence
levels) and the generator grows a full consistent history around them. Every release
re-verifies each hero loads with their story intact — that check is release-blocking.

### Determinism

Same seed → byte-identical output. The generator runs at **release time**, never at install:
installs load finished data, embeddings are pre-computed, and Sonar's scoring runs once at
release. No live AI calls, no external services, no surprises on a customer's machine.

**The hard rule that makes this true** (review 2026-07-08): the AI authors the ruleset and
the text-template library **once**, both checked into git and reviewed like code;
deterministic code executes them with seeded slot-filling and variation. **No model calls
inside the generator** — if any bio or forum post came from a live AI call at generation
time, byte-identical rebuilds (and with them, stable heroes) would be impossible. Generated
text also obeys a consistency rule: it must never leak the invisible dials ("I'm super
engaged!") nor contradict the member's generated behavior.

### The safety nets

1. **Benchmarks with tolerances.** Every headline number is a target with an allowed range;
   after generation we measure the data and **the build fails** if it misses. A handful of
   benchmarks are deliberately held out as blind checks — and the blindness has a mechanism
   (review 2026-07-08): holdouts live in a named list that is **stripped from anything the
   ruleset-authoring AI reads**, and the isolation is verified at the pilot.
2. **Texture, enforced both directions** (Amith's anti-smoothness ask, made checkable): the
   averages must be right *and* organically noisy. Yearly renewal wanders in a band (~84–90%
   around the 87% mean — calibrated to the real year-over-year jitter in the verified 990s),
   monthly activity has autocorrelated wobble, money distributions are lumpy mixtures, and
   timestamps carry day-of-week and holiday texture. The benchmark checks gain **variance
   floors** (e.g., year-over-year renewal variance above a threshold) so suspicious
   smoothness fails the build just like a missed mean. Noise amplitude is co-designed with
   tolerance widths (so builds don't randomly fail) and sized so the causal signal still
   passes the pilot's magnitude bands.
3. **The database rules in §4** — bad combinations simply can't load.
4. **The 108 curated queries** ported from v1 — every one must return a meaningful,
   non-degenerate answer (in v1, whole query families silently ran on dead columns).
   "Non-degenerate" gets a written definition (row-count and variance floors, and who
   judges) in the ruleset spec.

### What consumes the data

Sonar scores the generated behavior → **7 predictive models** (churn, renewal likelihood,
LTV, attendance forecast, engagement, cert completion, event ROI) train on real signal →
dashboards, saved views, semantic search, and the demo scripts all sit on top. If the causal
rules are wrong, every one of those layers wobbles — which is why the pilot gate exists.

### The pilot gate (first milestone once §1 is settled)

Generate a small vertical slice — member → subscription → event registration — at ~500
people, then check it. **Pass means:** every cause-and-effect rule in the slice shows up in
the data with the *predicted direction* (a flipped sign is a hard fail) **and at a usable
size** — the map's weak/med/strong labels become quantified effect-size bands, so an effect
that technically points the right way but has vanished to nothing also fails (review
2026-07-08). One end-to-end check on top: train the churn model on the pilot output and
require discriminative lift appropriate to N≈500 — the data's whole point is that models
trained on it work. Every in-slice benchmark lands within tolerance (including the variance
floors), and the in-slice heroes load with their pins intact. **On failure:** the ruleset
gets fixed and re-run; a flipped sign goes back to the causal-map workshop rather than being
patched quietly. **Who calls it:** Barnatt (data workstream), with Madhav confirming the
method held. Only after a green pilot do we generate the full dataset — plus, per D5, at
least one full large-preset dry run before launch. The pilot also validates the D9 pack
mechanism: the slice spans three packs (common, membership, orders/events), emitted and
installed layer by layer.

## 6. Already decided — please don't re-open (evidence cited)

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

## 7. What happens next (the sequence)

| Step | Who | Output |
|---|---|---|
| 1. Schema reconciliation session (agenda: [RECONCILIATION-ASKS.md](RECONCILIATION-ASKS.md)) | Barnatt + Marcelo (needs his BizApps survey) | Final table shapes for the vertical slice; B1–B9 answered; pack layout + IsA/overlay rule agreed (D9) |
| 2. Causal-map workshop | Barnatt, Marcelo, Madhav, Robert | Every arrow direction agreed — **1.15 (employer events) walked first**, it's load-bearing for the churn stories; D6 mechanism ratified; the ruleset's first-draft edge list |
| 3. **Ruleset spec v0.1** *(added per review 2026-07-08)* | Barnatt + Madhav | The executable contract: file format + versioning; how ~50 effects combine on one outcome (and how interactions and regime gates apply); the texture/noise model and its amplitudes; the no-live-AI rule; the windowing mechanism; the "non-degenerate query" definition; executor + validation-harness design |
| 4. Ruleset v0.1 | Barnatt | The vertical slice (member → subscription → event registration), authored and runnable |
| 5. N≈500 pilot | Barnatt (Madhav confirms method) | Pass/fail against the §5 gate (signs + magnitudes + texture + trainability + pack install); fixes looped until green |
| 6. Full generation | data workstream | All three presets (incl. the D5 large dry run), full benchmark check, heroes verified, packs emitted |

Rough effort and calendar (ship date July 31): see [work-breakdown.md](work-breakdown.md) —
the generator is the hardest engineering in the project, hero content is the longest lead time.

## 8. Risks & schedule watch-items

- **⏱ Composed-app schema freezes (OQ-11) — now quantified (2026-07-10, from the public
  design docs):** `bizapps-orders` (which contains payments AND subscriptions) is
  **design/pre-implementation** — no tables exist, its own phasing lands Subscriptions at
  week 10–13, and it's gated on `bizapps-accounting`, which was still structurally churning
  on 07-08 (AccountingPeriod removed; batch-lock redesign). **The money chain cannot ride
  real orders tables by July 31** — membership data ships on our `MembershipPeriod` shape
  and decomposes into Subscription+Orders later (see §4). Conversely, `bizapps-forms` is
  build-complete and `bizapps-common` is stable. Owner: Marcelo confirms the rest.
- **⏱ Hero pipeline** — 22 of 50–100 written, authoring owner unassigned (D8),
  release-blocking.
- **The seams between apps** — where one app's tables meet another's assumptions is where
  integration time vanishes; the cross-app integrity check is the smoke test that proves the
  composition works.
- **The generator itself is real engineering** — thousands of records that all line up
  (dates, statuses, payments-to-ledger) is exactly where v1 broke; the §4/§5 machinery exists
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
| The review feedback this version folds in | [DESIGN-REVIEW-FEEDBACK.md](DESIGN-REVIEW-FEEDBACK.md) (Robert, 2026-07-08) |
| The association as a story + all headline numbers | [ASSOCIATION-PROFILE.md](ASSOCIATION-PROFILE.md) |
| What sales approves | [DATA-SUMMARY.md](DATA-SUMMARY.md) |
| What the data is engineered to show off, in priority order | [FEATURES-REVIEW.md](FEATURES-REVIEW.md) |
| Effort, timeline, and what could bite us | [work-breakdown.md](work-breakdown.md) |
| Every target number with source/confidence/tolerance | `research/benchmarks-draft.json` v0.9.2 (canonical) |
| Column-level schema detail | [research-plan-and-schema-proposal.md](research-plan-and-schema-proposal.md) Part 2 |
| Why the schema is shaped this way (generation requirements) | [generative-schema-findings.md](generative-schema-findings.md) |
| The cause-and-effect map the generator uses | `research/causal-map-draft.md` |
| The heroes | [hero-personas-draft.md](hero-personas-draft.md) + [PERSONAS-REVIEW.md](PERSONAS-REVIEW.md) |
| Decision audit trail | [gaps-to-fill.md](gaps-to-fill.md) |
| The Marcelo session agenda | [RECONCILIATION-ASKS.md](RECONCILIATION-ASKS.md) |
