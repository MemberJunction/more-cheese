# Hero Personas — Draft v0.3 (for team review)

**Status: DRAFT.** Heroes are team-owned, quality-gated content (v2 plan §7.0) — this draft exists so the team edits instead of starting from blank. **Names are placeholders until the team blesses them; after that they're permanent** (renames break demo scripts and need explicit sign-off).

Roster: 22 now (20 members + 2 staff) → 50–100 by release. Every release re-verifies each hero loads with their storyline intact (release blocker).

> **This document is the SINGLE roster of record** (decided 2026-07-06): the earlier 8-candidate
> stub at `mj/plans/association-db/morecheese-v2-hero-personas.md` is superseded by this doc and
> banner-marked as such. **Carry-over rule (Marcelo, 2026-07-06): personas the TEAM has named
> directly are always carried — familiarity wins in demos.** Carried: **Elena Rodriguez**
> (named throughout Amith's v2-plan) and **Anna Brown** (Robert's named example in the Q&A
> thread, cited in v2-plan §7.0), her story revamped below to the causal pinned-facts style.
> Personas only the stub proposed are not carried; their demo-script anchors are — see §0.
> Two similar personas may coexist when they cover distinct asked-for pitch flows.
> This roster is also the **marketing team's anchor for entering demo data**.

---

## 0. Script anchors — scenario → persona map (review this first)

Every demo script the data must support, and which hero anchors it. ❌ = anchor missing
(gap to fill in the next tranche). Where a scenario was previously anchored by the superseded
stub, the "carried from" column shows the mapping so no script anchor is lost.

| Demo script / scenario | Anchor persona | Carried from superseded stub | Status |
|---|---|---|---|
| Flagship "great member" / member-360 / "tell me about X" semantic search | Elena Rodriguez | Elena Rodriguez (originates in Amith's v2-plan §7.0 — name must stay) | ✅ |
| **Post-lapse churn diagnosis — "why did she churn?" (Robert's named script)** | **Anna Brown** | Anna Brown — **CARRIED (team-named; story revamped 2026-07-06 to the causal style)** | ✅ |
| Churn save — long decline, still Active, high LTV | Bob Kowalski | — (new; distinct pitch flow from Anna's: intervene *before* the lapse) | ✅ |
| Lapse with a sympathetic external cause / win-back | Danielle Okafor | — (new; distinct flow: employer collapsed, she never chose to leave) | ✅ |
| Renewal-at-risk / pending renewal / reminder cadence | Marcus Chen | Marcus Feld | ✅ |
| Duplicate detection / merge | Kate O'Leary ×2 | Sofia Greco | ✅ |
| Stale employer / Apollo-style enrichment | Aisha Bell | James Okafor | ✅ |
| Certification pipeline / completion forecast | Sofia Marchetti + Priya Natarajan | Priya Nair | ✅ |
| Committee governance (meetings, motions, votes) | Gwen Whitfield | Tom Bjornson (board-chair flavor folded here) | ✅ |
| VIP / top engagement / LTV | **Lucia Marchetti** (dedicated VIP, tranche 2) + Henri Dubois & the Jamie/Victor counter-patterns | Lucia Marchetti (re-introduced) | ✅ |
| Advocacy / legislative champion | Tom Reyes | — (new) | ✅ |
| Engagement ≠ revenue counter-pattern | Jamie Fuller | — (new) | ✅ |
| Ghost-but-safe counter-pattern (auto-renew, employer-paid) | Victor Sandoval | — (new) | ✅ |
| International medalist / competition eligibility | Henri Dubois, Charlie Mason | — (new) | ✅ |
| Timezone / on-demand behavior | Lars Vestergaard | — (new) | ✅ |
| New-member cold start / first-year cliff | Nia Thompson | — (new) | ✅ |
| Event ROI (organizer of a low-performing event) | Dale Peterson | — (new, tranche 2) | ✅ |
| Staff personas (support/issues + secure messaging + membership workspace) | Maya Delgado + Denise Archer (STAFF) | — (new, tranche 2) | ✅ |
| Suspended member (moderation/edge state) | Gary Toth | — (new, tranche 2; needs 'Suspended' in the status value list — see his pins) | ✅ |
| Dedicated top-LTV VIP + sponsor-driven giving | Lucia Marchetti | Lucia Marchetti (name re-introduced; story rebuilt) | ✅ |

---

## 1. How heroes work in the causal generator

A hero is **not** hand-written data. A hero is a small set of **pinned facts** — the generator grows a full, consistent history around them:

- **Pinned:** name, MemberNumber (stable business key, e.g. `ICF-000101`), employer, region, segment/discipline, JoinDate, tier + status, their **latent levels** (engagement θ, affluence φ), and 2–5 **milestone facts** the storyline needs.
- **Generated around the pins:** registrations, forum posts, invoices, email opens — sampled from the same causal model as everyone else, conditioned on the pinned latents. Elena isn't *described* as highly engaged; she gets the activity that **computes** to highly engaged when Sonar scores her.
- **Deliberate defects are pins too:** the duplicate pair and the stale employer are injected on purpose, labeled, so the dedup/enrichment demos have known-truth answers.

**What the team owns:** the story. **What the generator owns:** making the data agree with it.

## 2. Believability rules (what makes these not-random)

Every persona below obeys five rules — apply them to all future heroes:

1. **Names follow real dairy-world demographics.** Wisconsin cheesemaking is Swiss/German heritage; California's dairy belt is heavily Portuguese-Azorean and Dutch; Vermont's artisan scene is full of career-changers; urban cheesemongers skew young and coastal. A name should feel like it belongs where the person works.
2. **Timelines add up.** Age, years in profession, JoinDate, and role must be mutually consistent — a 27-year-old isn't an 18-year member.
3. **Joining has a trigger.** Nobody joins an association "in 2021." They join *because something happened*: a promotion, a new product line, a regulation, a pandemic, an employer perk.
4. **Every data pattern has a legible cause.** Bob isn't "declining" — his employer got acquired and cheese shrank from 100% of his job to 10%. The cause should be *discoverable in the data* (his employer org's name changed in 2023), because that's what makes the demo's "diagnose this member" moment land.
5. **Heroes know each other.** Real professional communities are networked: mentorships, committee colleagues, friendly rivalries. Cross-links make drill-down demos feel alive instead of like browsing strangers.

## 3. Archetype coverage

| Required archetype | Hero |
|---|---|
| Flagship "great member" | Elena Rodriguez |
| Post-lapse churn diagnosis (team-named script) | **Anna Brown** (carried) |
| About to renew (PendingRenewal) | Marcus Chen |
| Lapsed for a findable reason | Danielle Okafor |
| Rising star | Priya Natarajan |
| Long-tenured, declining — the churn save | Bob Kowalski |
| Certification-track learner | Sofia Marchetti |
| Award-winning producer (international) | Henri Dubois |
| Committee chair | Gwen Whitfield |
| Advocacy champion | Tom Reyes |
| Stale employer (enrichment showcase) | Aisha Bell |
| Duplicate-record pair (dedup showcase) | Kate O'Leary ×2 |
| Timezone/distance behavior (EU) | Lars Vestergaard |
| High-engagement, low-revenue counter-pattern | Jamie Fuller |
| Zero-engagement, auto-renewing counter-pattern | Victor Sandoval |
| Brand-new member (cold start) | Nia Thompson |
| Rest-of-world producer | Charlie Mason |
| Event organizer / event-ROI lesson | Dale Peterson |
| Marquee VIP / top LTV / sponsor-giving | Lucia Marchetti |
| Suspended member (edge state) | Gary Toth |
| Staff — support queue | Maya Delgado (STAFF) |
| Staff — membership director workspace | Denise Archer (STAFF) |

Geography (member personas): 15 NA / 3 EU / 2 RoW (20 members, + 2 US staff personas) — NA-lean
vs the 60/25/15 target; acceptable for heroes (the generated long tail carries the exact mix).

## 4. The heroes

---

### Elena Rodriguez `ICF-000101` — the flagship member
**43 · Head Cheesemaker, Sierra Vista Creamery (mid-size, Petaluma CA) · Producer/Cheesemaking · joined 2022 · Professional, Active · θ high, φ med-high**
Grew up on her family's dairy outside Petaluma; Cal Poly dairy science; fifteen years working up through Sierra Vista's make room to head cheesemaker in 2019. **Join trigger:** in 2022 she launched the creamery's first raw-milk alpine-style ("Sierra Vista Reserve") and needed the federation's aging-standards network and food-safety guidance. Earned her CCP in 2024. Sits on the Standards Committee — she pushed for the raw-milk aging guidance doc. Answers make-room questions in the forum with the patience of someone who's trained a dozen assistants. **Mentors Priya Natarajan** (met at the 2025 conference affinage workshop).
*Pins: Standards Committee seat 2023–, CCP 2024, 3 consecutive conference attendances, top-decile Sonar.*

### Marcus Chen `ICF-000102` — the renewal nudge
**38 · Specialty Cheese Buyer, Puget Provisions (8-store grocer, Seattle WA) · Retailer · joined 2021 · Professional, Active — renewal due in ~3 weeks · θ med, φ med**
Started behind the counter at a Pike Place cheese shop in 2012; now buys for eight stores. **Join trigger:** 2021 supply-chain chaos — the federation's distributor forum was where buyers were actually finding stock. Solid but busy member: regional chapter meetings yes, July flagship conference never (retail can't leave in summer — a *pattern* the data should show, not a flaw). Opened both renewal emails, clicked neither. Not disengaged — swamped. Exactly the member a renewal-outreach queue exists for.
*Pins: EndDate ≈ release+21d, 2 renewal-campaign opens / 0 clicks, chapter-meeting-only attendance pattern. ⚠ D6/GAP-12 (2026-07-07): the release-relative EndDate requires the proposed anniversary cohort — Marcus goes in it with auto-renew OFF (an auto-payer would get no reminders); pending team ratification.*

### Danielle Okafor `ICF-000103` — the diagnosable lapse
**27 · Assistant Cheesemaker, formerly Meadowbrook Dairy (Brattleboro VT, closed) · Producer/Cheesemaking · joined 2024 · was Individual, Lapsed · θ was med, φ low**
UVM food-science grad, first real job at Meadowbrook in 2024. **Join trigger:** Meadowbrook's owner paid federation dues for junior staff — an employer perk. Meadowbrook lost its co-packing contract in late 2025 and folded within months (the small-creamery death spiral: one distributor is 70% of revenue). Her membership lapsed with her paycheck. Now decorating cakes at a bakery and posting occasionally in the forum from her free account — she wants back in. **The diagnosis is in the data:** employer org status = Dissolved; `CancellationReason` = non-payment / employer closed (she never *chose* to leave — the reason field carries that nuance). Prime win-back target.
*Pins: employer org Dissolved 2025, EndDate ~4 months past, CancellationDate = EndDate + 2mo grace with CancellationReason 'non-payment — employer dissolved' (revised 2026-07-06 to the team's ruling: every lapse past grace gets a termination date), residual forum logins.*

### Priya Natarajan `ICF-000104` — the rising star
**31 · Affinage Apprentice, Driftless Caves (cave-aging operation, Viroqua WI) · Producer/Affinage · joined 2025 · Individual (early-career rate), Active · θ high and rising, φ low**
Was a microbiologist at a Madison food-testing lab; a weekend course on rind ecology rerouted her life. Took the Driftless Caves apprenticeship in 2024 at a serious pay cut. **Join trigger:** her employer required it — cave crews need the food-safety training track. Her lab background makes her forum posts on rind microflora unusually rigorous; they collect "Helpful" reactions at triple the average. First conference in 2025, where **Elena took her under her wing**; now working toward the sensory-evaluation credential. Sonar trend: steepest positive slope in her cohort.
*Pins: sharply rising ScoreHistory, 2 completed courses with high scores, high reactions-received rate, mentor link to Elena.*

### Bob Kowalski `ICF-000105` — the churn save
**61 · Regional Sales Director, Great Lakes Cheese Distribution (Cleveland OH; acquired 2023 by Continental Food Group) · Distribution · joined 2008 · Professional, Active · θ med and declining 3 years, φ med-high**
Thirty years in dairy distribution. **Join trigger:** his 2008 promotion to regional director — the federation *was* his customer network, and for fifteen years he worked it hard: booth sponsorships, brought his whole team to conferences, chapter golf outings. **The cause of the decline is in the data:** Continental Food Group acquired his employer in 2023; cheese went from his whole book to one line item, half his old accounts moved to a national team, and he's two years from retirement. No conference since 2023; email opens fading. Enormous lifetime value, top-decile lapse risk — the exact member the retention play is designed for. (His new corporate parent is **Victor Sandoval's** employer — the acquisition connects two heroes.)
*Pins: employer org renamed/re-parented 2023, last conference 2023, 3-year declining ScoreHistory, high LTV, top-decile lapse-risk score.*

### Sofia Marchetti `ICF-000106` — the certification journey
**29 · Cheesemonger, Marchetti's Salumeria & Formaggio (family shop since 1962, Boston North End) · Retailer · joined 2024 · Individual, Active · θ med-high, φ med**
Third generation behind the counter; came back after a hospitality degree to modernize the cheese program her grandfather started. **Join trigger:** a gleaming national-chain "cheese destination" opened four blocks away in 2024 — the certification is her counter-move, credibility you can frame and hang by the register. Two prep courses down (Sensory Foundations 88, Cheese Chemistry 91), exam registered for the summer conference sitting. The cert-completion-forecast model should love her.
*Pins: 2 completed prerequisite enrollments with scores, exam registration at flagship conference, cert record In Progress.*

### Henri Dubois `ICF-000107` — the international medalist
**55 · Affineur & Owner, Caves Dubois (third-generation aging caves, Poligny, Jura, France) · Producer/Affinage · joined 2019 · Organizational, Active · θ med, φ high**
His grandfather dug the caves; Henri grew the business into export. **Join trigger:** met American mongers at a 2018 trade fair and realized the US specialty market was his growth path — took the organizational membership specifically because **only member organizations may enter the competition** (the eligibility gate, pinned). Enters ~8 wheels a year; his 18-month alpine took **Gold in 2025**. Flies over exactly once a year for the flagship conference, stacking US buyer meetings around it — otherwise engages entirely on-demand (7 hours ahead). The distance arrows, wearing a medal.
*Pins: org-tier membership, Gold 2025 + 8 entries/yr, one conference trip/yr, on-demand-only webinar pattern.*

### Gwen Whitfield `ICF-000108` — the committee chair
**52 · Principal, Whitfield Food Safety Training (solo practice, Chicago IL) · Educator/QualitySafety · joined 2014 · Professional, Active · θ high, φ med**
Twenty years running QA at a major dairy processor; went independent in 2013 when FSMA landed and small producers suddenly needed compliance help they couldn't afford to hire full-time. **Join trigger:** the federation is literally her client pipeline — she joined the year her practice opened. Chairs the Food Safety Committee (term 2024–2026), runs the quarterly FSMA webinar series, and conducts a running, mutually respectful argument with **Tom Reyes** in the food-safety forum — she wants tighter controls, he wants raw-milk tradition protected, and their threads are the forum's best content.
*Pins: committee chair term 2024–26, 4+ webinars as speaker, high meeting attendance, forum sparring thread with Tom.*

### Tom Reyes `ICF-000109` — the advocacy champion
**48 · Owner, Stone Meadow Farmstead (raw-milk farmstead, Lancaster County PA) · Producer/Cheesemaking · joined 2016 · Individual, Active · θ high (advocacy-shaped), φ low-med**
Ex-Marine; bought the farm in 2011; aged raw-milk tommes, everything past the 60-day rule. **Join trigger:** joined the week the FDA's raw-milk cheese testing scrutiny peaked in 2016 — he needed a collective voice, fast. His engagement is *all* legislative: 30+ advocacy actions, two testimonies, organizer of the raw-milk producers coalition inside the federation. Barely registers for events or courses — which makes him the perfect demo of **Sonar's component breakdown** (advocacy factor maxed, event factor near zero: same "engaged," completely different shape than Elena).
*Pins: 30+ AdvocacyActions on the raw-milk issue, 2 testimony records, near-zero event/course activity.*

### Aisha Bell `ICF-000110` — the stale record
**36 · QA Manager · record says Curdwell Creamery (Modesto CA); actually recruited to Golden Gate Cheese Co. (Petaluma CA) 8 months ago · QualitySafety · joined 2018 · Professional, Active · θ med, φ med**
Solid, quiet member — pays dues, takes a course a year, attends the NorCal chapter meetings. The story isn't her behavior; it's her *record*: she changed employers 8 months ago and never updated her profile (nobody does). Her LinkedIn says Golden Gate; the database says Curdwell. **The enrichment demo finds and fixes exactly this** — and because the true employer is stored as a labeled ground truth, the demo has a verifiable right answer.
*Pins: stale Employment row (labeled defect), ground-truth employer stored, otherwise-normal activity.*

### Kate O'Leary `ICF-000111` + duplicate `ICF-000287` — the dedup pair
**45 · Cheese Program Director, Harvest Table Co-op Markets (30-store co-op chain, Minneapolis MN) · Retailer · joined 2015 / dup created 2023 · Active ×2 · θ med, φ med**
The duplicate has a *realistic mechanism*, because that's how real dupes are born: her original 2015 record uses her personal email. In 2023 her assistant registered her for the conference through the org portal with her work email — and the system minted "Kathy OLeary," a second person. Since then her history is split: events accrue to the work-email record, courses and forum to the personal one. Neither looks very engaged; **merged, she's clearly a strong member** — which is the whole point of the dedup demo.
*Pins: two Person/MemberProfile sets with labeled duplicate link, activity split by source system, merge = visibly better member.*

### Lars Vestergaard `ICF-000112` — the timezone member
**44 · Senior Lecturer, Nordisk Mejeriakademi (dairy college, Aarhus, Denmark) · Educator · joined 2020 · Individual, Active · θ med-high (virtual-shaped), φ med**
Teaches cheese technology to Danish dairy students. **Join trigger:** the pandemic — when everything went virtual in 2020, an American federation's entire education catalog was suddenly 9 time zones from irrelevant. He consumes webinars almost exclusively on-demand (live sessions run at 11pm his time — the timezone arrow made flesh), is steady in the forums, and has flown over exactly once: 2024, as an invited speaker on Nordic washed-rind traditions.
*Pins: ~0 live / high on-demand webinar ratio, 1 lifetime conference trip (as speaker), steady forum cadence.*

### Jamie Fuller `ICF-000113` — engagement ≠ revenue
**34 · UX designer by day; runs the "Curd Nerd PDX" home-cheesemaking blog (Portland OR) · Enthusiast · joined 2023 · Enthusiast tier, Active · θ very high, φ low**
Started making mozzarella in an apartment kitchen during lockdown; the blog now outranks most creameries. **Join trigger:** joined at the enthusiast rate in 2023 when forum members kept citing federation resources they couldn't access. Top-five forum poster (their mozzarella-stretch troubleshooting thread is the most-bookmarked post in the community), downloads everything, opens every email — and spends almost nothing beyond dues. **Stress-tests any model that assumes engagement predicts revenue.**
*Pins: top-decile posts + downloads + opens, lowest tier, ~zero non-dues spend.*

### Victor Sandoval `ICF-000114` — the auto-renewing ghost
**57 · VP Procurement, Continental Food Group (national foodservice distributor, Dallas TX) · Distribution · joined 2017 · Organizational (employer-paid), Active, auto-renew · θ very low, φ high**
Continental holds the org membership for market intelligence and competition sponsorship visibility; Victor is the named contact because procurement owns the budget line. He has never opened a newsletter — **his analyst reads everything under her own login** (the realistic mechanism behind a "dead" high-value member). Auto-renew on a corporate card, unbroken since 2017. **Tests that the churn model learns employer-paid + auto-renew as protective factors** — by engagement alone he'd look like maximum risk, and he isn't. (His company acquired **Bob Kowalski's** employer in 2023.)
*Pins: auto-renew, org-paid tier, near-zero personal Sonar components, unbroken renewals, corporate link to Bob's employer.*

### Nia Thompson `ICF-000115` — the cold start
**24 · Junior Cheesemonger, Marble & Rind (cheese shop, Brooklyn NY) · Retailer · joined 2 weeks before release · Individual, Active (new) · θ unknown (priors only), φ low**
Culinary school, then the counter at Marble & Rind, where the owner — a fifteen-year federation member — puts every new hire on a membership in their first month ("it's cheaper than the mistakes"). Two weeks in: welcome email opened, one intro webinar registered, nothing else yet. **The models must score her on priors, not history** — and the first-year cliff says this moment is exactly when the association wins or loses her.
*Pins: JoinDate = release−14d, 1 registration + welcome-campaign engagement, employer link to a long-tenured member org.*

### Charlie Mason `ICF-000116` — rest-of-world
**39 · Cheesemaker & Co-owner, Southern Cross Dairy (sheep dairy, Tasmania, Australia) · Producer/Cheesemaking · joined 2021 · Organizational, Active · θ med, φ med**
She and her husband converted her family's sheep operation to farmstead cheese in 2015 — cool-climate cloth-wrapped wheels. **Join trigger:** a US importer told her a federation medal is what moves Australian cheese in American shops; the org membership makes her eligible to enter. Ships wheels 9,000 miles for the competition (**Silver, 2024**); everything else is on-demand from 17 hours ahead — even Lars has it easy by comparison.
*Pins: org-tier membership, Silver 2024 + 4 entries/yr, zero in-person events, extreme on-demand pattern.*

### Anna Brown `ICF-000117` — the post-lapse diagnosis *(team-named — carried from the original roster, story revamped 2026-07-06)*
**44 · Category Manager, Dairy & Deli (formerly Specialty Cheese Buyer), Northgate Market Group (regional grocer, ~40 stores, Boston metro) · Retailer · joined 2019 · Professional (employer-paid), **Lapsed** (~5 months) · θ was med-high, now low · φ med**
*She's the name the team already uses — "let's look at Anna Brown's member profile" — so she stays, permanently.* Fifteen years in grocery buying. **Join trigger:** in 2019 Northgate launched an in-store specialty cheese program and gave it to Anna; the federation's retail track and monger-training courses were her supplier network and her staff's training pipeline. For three years she was a fixture — retail-track workshops, two courses a year for her counter leads, reliable renewal on the program's budget line. **The cause of her churn is in the data:** in 2023 Northgate consolidated category management — the specialty program folded into general dairy, her Employment row shows the title change, and the program budget line that paid her dues died with it. Attendance stopped after 2022, renewal emails went unopened (she'd opened every one before), dues went unpaid past the grace period. Distinct from Bob (still active, save him now) and Danielle (employer vanished, win her back): Anna is the **post-mortem** — the "why did she churn?" walkthrough where Sage reads the title change, the budget-line death, and the engagement cliff straight off the record.
*Pins: Employment title change 2023 (Specialty Cheese Buyer → Category Manager, Dairy & Deli — the legible cause), heavy 2019–2022 event history then zero, renewal-campaign opens present in prior cycles / absent in the final one, last payment ~17 months pre-release (corrected 2026-07-07 from ~14 — a 12-month period from the last payment must end ~5 months pre-release to match her lapse timing; CancellationDate then lands ~3 months pre-release), Lapsed with CancellationDate = EndDate + 2mo grace, CancellationReason 'non-payment — program discontinued'.*

### Dale Peterson `ICF-000118` — the event-ROI lesson
**58 · GM, Meadowlark Co-op Creamery; volunteer Education Chair, Upper Midwest chapter · Producer · joined 2011 · Professional, Active · θ high (organizer-shaped), φ med**
Thirty years in co-op dairy; the guy who says "someone should run a workshop on that" and then runs it. **Join trigger:** his co-op joined when it started selling beyond the county line in 2011; Dale inherited the chapter education chair in 2019. His baby is the **Winter Cheese Business Intensive** — a January workshop with stellar satisfaction scores and *terrible* economics: three editions of declining registrations (January + snow + retail inventory season), high fixed venue cost, attendance ~55% of capacity and falling. Dale is beloved and the content is good — the *event* is mispositioned. **The event-ROI predictor flags it; the attendance forecast shows what moving it to March does.** The demo isn't "cancel Dale's workshop" — it's "here's the data conversation that saves it."
*Pins: organizer link on 3 editions of the same workshop with declining registrations + high per-event cost + top-quartile satisfaction, one well-performing fall event as contrast, active committee/forum presence.*

### Lucia Marchetti `ICF-000119` — the marquee VIP *(name re-introduced from the original roster's VIP)*
**63 · Founder & CEO, Marchetti Family Caves (producer + aging house, Hudson Valley NY); Sofia Marchetti's aunt · Producer/Affinage · joined 2012 · Corporate, Active · θ high, φ highest**
Built the family aging house into a nationally distributed brand. **Join trigger:** entered her first competition in 2012 on a distributor's dare; the Silver that year sold out a season's production and she never looked back. Since then: **highest lifetime spend in the roster** — corporate dues, a sponsor table at every flagship conference, 8–10 competition entries a year (3 medals), workshop sponsorships, and the largest recurring donation in the giving data (sponsor-driven, exactly how association giving really works). The **VIP list / lifetime-value** anchor: when the LTV model ranks members, Lucia is #1, and every component of that number is visible in her history.
*Pins: top-decile LTV by construction (dues + sponsorships + entries + donations), 3 medals incl. one Best-in-Show category, family link to Sofia Marchetti, unbroken 13-year renewal streak.*

### Gary Toth `ICF-000120` — the suspended edge case
**47 · Owner, Toth Farmstead Cheese (small producer, Ohio) · Producer · joined 2018 · Individual, **Suspended** · θ was med, φ low-med**
A capable cheesemaker with a short fuse. **The story:** disputed a refund after missing a workshop (his own no-show), lost the dispute, filed a **card chargeback** — account suspended pending resolution per policy, with the whole paper trail in the data: the registration, the no-show, the refund-denied ticket, the chargeback on the payment record, the suspension status change, and a locked forum thread where it got heated. Nobody else exercises the moderation/edge-state machinery; Gary does it all at once.
*Pins: Suspended status with a dated status-change event, refund-denied support ticket + chargeback-flagged payment, one locked forum thread, renewal blocked while suspended. ⚠ schema note: 'Suspended' must be added to the MembershipPeriod status value list (currently Active·Lapsed·Cancelled·PendingRenewal) — flagged for the schema reconciliation.*

### Maya Delgado — STAFF · Member Services Coordinator *(not a member — ICF staff persona)*
**29 · Member Services Coordinator, ICF staff (3 yrs)**
The face of the support queue: she owns the ticket inbox (login resets, dues questions, refund requests, registration transfers), answers the secure-messaging member threads, and escalates policy calls (she handled Gary's chargeback case by the book). Demo use: the **support/issues workspace** — her queue shows the topic mix and the renewal-season spike; her name is on ticket assignments and message threads so the staff side of every conversation looks human.
*Pins: assignee on ~40% of tickets, participant in member↔staff message threads, the named handler on Gary's case.*

### Denise Archer — STAFF · Director of Membership & Engagement *(not a member — ICF staff persona)*
**51 · Director of Membership & Engagement, ICF staff (11 yrs)**
Owns renewals and the health of the membership funnel. Demo use: the **Membership Director workspace** — her saved views (Pending Renewal, lapse-risk ranked, New This Quarter), the renewal-reminder cadence she runs (60/30/7/day-of/lapsed), the win-back list Danielle sits on, and the board-level secure-messaging thread where she reports retention numbers (to Gwen's committee). When the demo says "the membership director sees…", it's Denise's login.
*Pins: owner of the renewal scheduled-actions, author of the retention board reports, sender on renewal campaigns, workspace persona for the Membership Director role.*

---

## 5. The relationship graph (rule 5 made explicit)

- **Elena → mentors → Priya** (met: 2025 conference affinage workshop)
- **Anna ↔ Kate O'Leary** — retail-track peers; co-panelists at the 2021 retail workshop (Kate's record split means only ONE of her two records shows the panel — a bonus dedup clue)
- **Gwen ↔ Tom** — the food-safety forum's long-running, respectful raw-milk debate
- **Victor's employer acquired Bob's employer** (2023) — one corporate event, two member trajectories
- **Nia's shop owner** is a long-tenured member (org-level connection; the owner can be persona #17)
- **Henri and Charlie** both exist because of the competition-eligibility gate — international org members who ship entries

## 6. Governance

- **Team-named personas are always carried** (Marcelo, 2026-07-06): if the team uses a name in
  scripts/threads/plans (Elena, Anna Brown), that persona exists in every release — familiarity
  wins. If a team-named persona conflicts with a newer one, **revamp the old persona's story**
  to fit the causal-data style and keep both only when they cover distinct pitch flows.
- **Adding** heroes: any release. **Renaming/removing:** explicit sign-off — demo scripts depend on them.
- Every release: automated check that each hero loads with pinned milestones intact (release blocker).
- Next tranches toward 50–100: Nia's shop owner, a board member, chapter officers per region, competition judges, an org-admin contact, more staff personas (events/education roles). *(Suspended member and the first two staff personas landed 2026-07: Gary Toth, Maya Delgado, Denise Archer.)*

## 7. Asks for the team

1. **Bless or edit the names** (permanent afterward).
2. Check storylines against real demo scripts (every §0 scenario now has an anchor — event-ROI is Dale Peterson).
3. Who owns hero authoring going forward (OQ-7)?
