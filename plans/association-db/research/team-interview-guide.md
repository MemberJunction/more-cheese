# Team Interview Guide (R4) — plain and simple

**Why we're doing this:** the data generator needs realistic numbers and rules. The web gave us industry averages, but the team has seen *real* association data. Their answers beat the web numbers wherever they differ.

Two short chats (~20–30 min each). Just ask the questions and write down what they say — italics explain why the question matters, in case they ask.

---

## Chat 1 — the domain lead (how membership data really works)

**1. "A membership record has these date fields — can you walk me through what each one means exactly?"**
- **StartDate / EndDate** — *we think: the paid period. EndDate is when the current paid term runs out, even if they'll probably renew.*
- **RenewalDate** — *we think: the date they last renewed (or are next scheduled to). This one caused the most confusion in v1 — is it the last action taken, or the next one due?*
- **JoinDate** — *we think: the very first day they ever became a member, never changes across renewals.*
- **CancellationDate** — *we think: only filled in when someone actively cancels — a member who just quietly doesn't renew (lapses) shouldn't have one.*

Then confirm the status rules: *"So an 'Active' member always has EndDate in the future, a 'Lapsed' member has EndDate in the past with no cancellation, and 'Cancelled' always has a CancellationDate — right? Any exceptions?"*

*Why: v1 shipped 'Active' members with already-expired EndDates and the reports broke. We're writing these rules into the database itself so bad combinations can't exist — which means we need the definitions exactly right, edge cases included.*

**2. "If someone's membership expires and they renew a month late — what happens to the record? Is there a grace period?"**
*Decides whether we need a "grace period" state in the data, or whether late renewals just get backdated.*

**3. "Roughly what share of members are on auto-renew? Does auto-renew noticeably help retention?"**
*The industry says auto-renew boosts renewal by 10–15 points. Want his gut-check.*

**4. "Which v1 demo reports looked obviously wrong or embarrassing? What did they show?"**
*Each broken report becomes a test: the new data must make that report look right.*

**5. "For an association of about 2,500 members — what would you expect for: renewal rate, annual conference attendance, and how much of revenue comes from dues vs. events/courses?"**
*These are the numbers a savvy prospect would sniff-test in a demo. Our research found ~85% renewal; conference attendance is our biggest open question (see Chat 2, Q5).*

**6. "How many staff would an association this size have?"**
*Sets how many helpdesk tickets, internal messages, and tasks we generate.*

---

## Chat 2 — the demo lead / leadership (what the demo needs to show)

**1. "In demos, what 3–5 numbers do prospects always ask about?"**
*Those numbers get the most care in generation — they have to look right.*

**2. "Is MoreCheese more like a trade association (companies are the members) or a professional society (individuals are the members)? Or a mix?"**
*This changes a lot: pricing tiers, who pays dues, and how much first-year members drop off (individuals drop off way harder than companies).*

**3. "In a real association, roughly what share of members are super-engaged, casually engaged, and basically ghosts? Does 10% / 60% / 30% sound right?"**
*Sets the engagement spread — which drives almost everything else in the data.*

**4. "Which demo stories matter most: saving an at-risk member, event profitability, selling certifications, or advocacy wins?"**
*We pre-bake the data behind the top stories first.*

**5. "Our model association (American Cheese Society) gets ~60% of its members to the annual conference. Generic industry data says 10–25%. Which feels right for MoreCheese?"**
*Genuine conflict in our research — this answer sets how big our events are.*

**6. "Do members actually donate to association foundations? Roughly what share?"**
*Web data was thin here (we guessed 3–8%). Sets the giving data.*

---

## The persona homework (send to whoever writes demo scripts)

We need ~15 named "hero" characters to start (eventually 50–100). These are the stable people demo scripts are written around — same names every release. For each one, we need a short card:

```
Name:            (permanent — renaming later breaks demo scripts)
Job & employer:  (e.g. "Head Cheesemaker at Alpine Creamery, Vermont")
Member since:
Tier & status:   (most Active; deliberately include one about-to-renew and one lapsed)
How engaged:     (1–5, and in what way — events? forums? committees? courses?)
Their story:     (2–3 sentences: what a demo shows about them)
Any quirks:      (on purpose: one duplicate record, one with an outdated employer, etc.)
```

Make sure the set includes these characters (the demos need them): someone about to renew, someone who lapsed for a findable reason, a rising star, a longtime member drifting away (the "save this member" story), a certification student, an award-winning cheesemaker, a committee chair, and one duplicate-record pair (for the dedup demo).
