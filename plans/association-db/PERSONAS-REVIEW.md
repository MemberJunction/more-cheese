# MoreCheese Demo — Hero Personas · Review Guide

**Status: FOR REVIEW.** The MoreCheese demo database (the *International Cheese Federation*)
ships with a cast of named "hero" members whose stories stay **identical in every release** —
so a demo script like "let's look at Anna Brown's profile" works every time, in front of every
prospect. Each hero exists to anchor a specific pitch moment; the rest of the database (2,500+
members) is generated around them.

**What we're asking reviewers to do:**
1. **Bless or edit the names.** After this review, names are permanent (scripts will depend on
   them). Two names are already fixed by prior use: *Elena Rodriguez* and *Anna Brown*.
2. **Check the pitch coverage table** — is any story you'd want to tell in a demo missing?
3. Optionally suggest better storylines — the *data* will be built to match whatever story we
   lock here.

---

## 1. Pitch coverage — which persona anchors which demo moment

| Demo moment / pitch hook | Persona |
|---|---|
| "Tell me about this member" — the complete 360° profile, semantic search | Elena Rodriguez |
| "Why did she churn?" — post-lapse diagnosis, cause visible in the data | **Anna Brown** |
| "Save this member before he lapses" — decline detected early, high value | Bob Kowalski |
| "Win her back" — lapse with a sympathetic, findable cause | Danielle Okafor |
| "Who's about to renew?" — renewal-reminder workflows | Marcus Chen |
| "These two records are the same person" — duplicate detection & merge | Kate O'Leary (×2) |
| "Her employer info is stale — AI fixes it" — data enrichment | Aisha Bell |
| "Will she finish her certification?" — learning pipeline & forecasting | Sofia Marchetti, Priya Natarajan |
| "Committee management, minutes, motions, votes" — governance | Gwen Whitfield |
| "Our most valuable member" — VIP list, lifetime value, sponsorships | Lucia Marchetti |
| "Engagement isn't one number" — component breakdown (all-advocacy member) | Tom Reyes |
| "High engagement ≠ high revenue" — stress-tests naive assumptions | Jamie Fuller |
| "Zero engagement but zero risk" — auto-renewing corporate contact | Victor Sandoval |
| "Brand-new member — what do we do in week one?" — first-year retention | Nia Thompson |
| "International members behave differently" — timezone/on-demand patterns | Henri Dubois, Lars Vestergaard, Charlie Mason |
| "This event loses money — here's the fix" — event ROI & forecasting | Dale Peterson |
| "The edge cases work too" — suspension, chargebacks, moderation | Gary Toth |
| The staff side of every workflow — support queue, renewal campaigns | Maya Delgado, Denise Archer (staff) |

## 2. The cast in brief

**Members —**

- **Elena Rodriguez** · Head Cheesemaker, Crowfeather Creamery (CA) — the flagship member:
  active in events, courses, committees, forums since 2022. *Use for:* member-360, "great
  member" retention story, semantic search ("tell me about Elena").
- **Anna Brown** · former Specialty Cheese Buyer, Northgate Market Group (Boston) — was a
  fixture for three years, then her employer folded its specialty program in 2023 and her
  membership quietly lapsed. *Use for:* the "why did she churn?" walkthrough — the cause (title
  change, dead budget line, engagement cliff) is readable straight off her record.
- **Bob Kowalski** · Regional Sales Director, Cleveland — 15-year member declining since his
  employer was acquired in 2023; still active, enormous lifetime value, top lapse risk.
  *Use for:* the proactive retention play ("save Bob").
- **Danielle Okafor** · young cheesemaker whose Vermont creamery closed — lapsed with her
  paycheck, still lurking in the forums. *Use for:* win-back targeting.
- **Marcus Chen** · Seattle specialty grocer buyer — solid member, renewal due in three weeks,
  opened both reminder emails, clicked neither. *Use for:* renewal-outreach queues.
- **Kate O'Leary** · Minneapolis co-op cheese program director — exists TWICE (personal-email
  record + work-email record minted by her assistant); history split between them; merged,
  she's clearly a strong member. *Use for:* duplicate detection with a satisfying merge.
- **Aisha Bell** · QA manager — changed employers 8 months ago, never updated her profile; the
  true employer is stored as labeled ground truth. *Use for:* enrichment before/after with a
  verifiable right answer.
- **Sofia Marchetti** · third-generation Boston cheesemonger, two prep courses down, exam
  registered. **Priya Natarajan** · lab-scientist-turned-affinage-apprentice, steepest rising
  engagement in her cohort, mentored by Elena. *Use for:* certification pipeline + completion
  forecasting + rising-star spotting.
- **Gwen Whitfield** · food-safety consultant, chairs the Food Safety Committee, runs the
  webinar series, conducts a long respectful forum debate with Tom. *Use for:* committee
  governance (terms, meetings, motions, votes, minutes).
- **Lucia Marchetti** · founder of Marchetti Family Caves (Hudson Valley), Sofia's aunt —
  highest lifetime spend: corporate dues, sponsor tables, 8–10 competition entries/yr,
  3 medals, largest recurring donation. *Use for:* VIP list, lifetime value, sponsorships.
- **Tom Reyes** · raw-milk farmstead owner, ex-Marine — 30+ advocacy actions, two testimonies,
  near-zero event/course activity. *Use for:* engagement component breakdown (same "engaged,"
  completely different shape than Elena).
- **Jamie Fuller** · Portland home-cheesemaking blogger, enthusiast tier — top-five forum
  poster, opens every email, spends almost nothing. *Use for:* engagement ≠ revenue.
- **Victor Sandoval** · VP Procurement at a national distributor — org-paid membership,
  auto-renew since 2017, has never opened a newsletter (his analyst reads everything). *Use
  for:* why the churn model must NOT flag him.
- **Nia Thompson** · Brooklyn junior cheesemonger, joined two weeks ago. *Use for:* the
  cold-start / first-90-days story.
- **Henri Dubois** (Jura, France — flies in once a year, Gold 2025) · **Lars Vestergaard**
  (Denmark — all on-demand webinars, 9 timezones out) · **Charlie Mason** (Tasmania — ships
  wheels 9,000 miles for the competition, Silver 2024). *Use for:* international behavior
  patterns + competition eligibility.
- **Dale Peterson** · co-op GM and volunteer chapter education chair — his beloved January
  workshop has great reviews and terrible economics. *Use for:* event ROI + attendance
  forecasting ("here's the data conversation that saves Dale's workshop").
- **Gary Toth** · small Ohio producer, **suspended** after a refund dispute became a card
  chargeback — the entire paper trail is in the data. *Use for:* edge states, disputes,
  moderation, policy workflows.

**Staff (the association's side of every workflow) —**

- **Maya Delgado** · Member Services Coordinator — owns the support queue (logins, dues,
  refunds, registration transfers) and the member message threads.
- **Denise Archer** · Director of Membership & Engagement — owns renewals: the reminder
  cadence, the at-risk lists, the retention reports to the board.

## 3. Relationships (so drill-downs feel alive)
Elena mentors Priya · Gwen and Tom's running forum debate · Victor's company acquired Bob's ·
Lucia is Sofia's aunt · Anna and Kate were 2021 co-panelists · Nia's shop owner is a
long-tenured member.

## 4. What happens after this review
Locked names + storylines become committed "pinned facts"; the data generator builds each
hero's full history (registrations, posts, payments, scores) to *compute* to their story —
Elena isn't labeled "engaged," she earns it. Every future release re-verifies each hero loads
with their story intact. Full technical detail: `hero-personas-draft.md`.
