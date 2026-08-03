# demo-morecheese — Kickoff Meeting

**60 min, Monday. Add the demo lead (he asked to be in it).**
**Pre-read:** `work-breakdown.md` (the working summary) + open `morecheese-site-mockup/index.html` (the website starting point).

**The point of this meeting:** the whole project hinges on one thing — **are the apps we depend on actually ready?** This meeting confirms that, clears the early roadblocks, and agrees what starts this week. Ship date is **July 31** (~4.5 weeks).

**The thesis in one line:** MoreCheese is "just another Open App" — it composes 10 apps we already have + adds the cheese-specific bits, and installs anywhere with one command. No golden image, no special setup. (This is why the generative-data lead's old "template" idea is gone — you just install the app.)

---

## 1. Are the dependency apps ready? (20 min) — the big one

We compose 10 apps. We only need their **database tables frozen** — NOT the apps fully built (see "the schema-only rule" below). Go app by app and get a date:

| App | Question to answer |
|---|---|
| Accounting | Tables stable? Pinnable version + date? (in progress now) |
| Orders | "Framework next week" — what does an installable schema mean here, and when? |
| Common / Tasks / Committees | Confirmed done? |
| Issues / Sonar / Secure Messaging | Production-ready / first-cut / in-dev / not started? |

**The schema-only rule — agree on this explicitly:** the bar is **"tables frozen + CodeGen produces clean entities + published at a pinned version."** We do NOT wait for every feature to work (live order fulfillment, real payment charging, GL automation). This works because the demo loads pre-baked, finished data — we ship the *results*, not the running process. **This relaxation is what makes July 31 possible.** If we instead wait for the apps to be fully built, it's a different timeline — so confirm it here.

**Decision:** a date for when each app's tables freeze. (Tracks open question OQ-11.)

## 2. Clear the roadblocks (20 min)

Fast decisions so work can start. Each maps to an open question in the spec:
- **Repo + code policy (OQ-16):** Where does it live? Do we depend on stable npm releases or live MJ main-branch builds? Who reviews/merges PRs?
- **Final name (OQ-3):** `demo-morecheese` + `demo-morecheese-data` as proposed? (Sets the naming convention for all future demos.)
- **Search engine (OQ-1, OQ-2):** Does MJ's in-DB search service (SVS) already work on both SQL Server and Postgres, or does someone need to build it? This blocks the AI step. SQL Server is the risk.
- **Website designer (OQ-13):** Who redesigns morecheese.org, and when can they start? The site is on the path to going live, but can run in parallel. The existing mockup de-risks the start.
- **Park the rest with a name + due date:** pricing (OQ-4), v1 retirement (OQ-5), who writes the demo chats (OQ-7), release cadence (OQ-8), how many predictive models (OQ-9), who owns releases long-term (OQ-12), real-data lifecycle once the site is live prod (OQ-14), public-site AI cost limits (OQ-15).

## 3. What starts this week vs. what waits (15 min)

**Can start immediately (no dependency needed):**
- Create the repo + workspace layout + dependency manifests.
- Audit whether the search engine (SVS) exists or needs building.
- Write the old-demo → new-demo mapping doc.
- Start hand-writing the hero personas (long lead time — these are quality-gated and block the release, so start now).
- Kick off the three parallel tracks: website redesign, semantic search, Sage helper tools.

**Waits until the dependency tables freeze:**
- Building the cheese-specific tables, the data generator, CodeGen, and the AI/embeddings step.

**Also decide:** which content is hand-written by the team vs. generated (the demo chats and personas need humans — OQ-7).

## 4. Wrap (5 min)
- Weekly status update posted in the PR thread **every Friday**.
- Read back each decision and who's chasing the open ones.

---

## We must leave this meeting with:
1. A **date** for when each dependency app's tables are frozen (OQ-11).
2. Explicit agreement that **frozen tables = good enough** — not full features.
3. **Repo + final names** decided (OQ-3), and the release-vs-main-branch policy (OQ-16).
4. A clear answer: is the **search engine** ready, or does it need building? (OQ-1, OQ-2)
5. A **website designer** named, or a date to decide (OQ-13).
6. The agreed list of **what starts this week**.
