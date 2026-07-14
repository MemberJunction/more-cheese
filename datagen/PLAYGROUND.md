# The Playground — generated data, live in a real MJ database

**What exists (stood up 2026-07-13):** `MoreCheese_Playground` — a clone of a real
MemberJunction database with the full generated world loaded and **registered as MJ
entities**. No reconciliation required; wipe-and-recreate whenever.

- **Server:** the `sql_server_dev` docker container, `localhost:1433` (SQL auth; same
  credentials as the Sonar dev setup — see that checkout's `.env`; never commit them here).
- **Database:** `MoreCheese_Playground`
- **Data:** seed 42 · N=2500 · release 2026-07-31 · 60/60 gates green — 1,999 visible
  members (2,500 generated minus the 3-year archive rule), 627 orgs, ~8k membership
  periods, ~17.5k registrations, ~17.4k orders, 12 hero personas.
- **MJ layer:** all 13 tables registered — identity as `MJ_BizApps_Common: *`, the rest as `MoreCheese: *` entities (CodeGen run scoped to
  the `morecheese_*` schemas), with generated views (`vwPeople`, `vwMembershipPeriods`, …)
  and CRUD procs. `mj sync push` round-trips against them ("no changes" vs the SQL-loaded
  rows — the pinned UUIDs make both load paths the same rows).

## Queries to start with

```sql
-- the hero cast (identity in bizapps-common, member fields in OUR MemberProfile — the split)
SELECT mp.MemberNumber, p.FirstName, p.LastName, p.Email, mp.Segment, o.Name AS Employer
FROM morecheese_members.MemberProfile mp
JOIN __mj_BizAppsCommon.Person p ON mp.PersonID = p.ID
LEFT JOIN __mj_BizAppsCommon.Organization o ON mp.OrganizationID = o.ID
WHERE mp.MemberNumber LIKE 'ICF-000%';

-- Danielle's diagnosable lapse (the win-back story)
SELECT per.FirstName, mp.Status, mp.EndDate, mp.CancellationDate, mp.CancellationReason, o.Name, o.Status AS OrgStatus
FROM morecheese_members.MembershipPeriod mp
JOIN __mj_BizAppsCommon.Person per ON mp.PersonID = per.ID
JOIN morecheese_members.MemberProfile pr ON pr.PersonID = per.ID
LEFT JOIN __mj_BizAppsCommon.Organization o ON pr.OrganizationID = o.ID
WHERE pr.MemberNumber = 'ICF-000103' ORDER BY mp.StartDate;

-- renewal rate by year (should wander the 84–90% band, with the COVID dent)
SELECT YEAR(EndDate) y,
       CAST(SUM(CASE WHEN Status='Renewed' THEN 1 ELSE 0 END) AS float) / COUNT(*) rate, COUNT(*) n
FROM morecheese_members.MembershipPeriod WHERE Status IN ('Renewed','Lapsed')
GROUP BY YEAR(EndDate) ORDER BY y;

-- A/R aging (real Unpaid/Overdue rows — the money-demo hook)
SELECT PaymentStatus, COUNT(*) n, SUM(TotalGross) total
FROM morecheese_orders.[Order] GROUP BY PaymentStatus;

-- the renewal-outreach queue (Marcus lives here)
SELECT pr.MemberNumber, per.FirstName, per.LastName, per.Email, mp.EndDate
FROM morecheese_members.MembershipPeriod mp
JOIN __mj_BizAppsCommon.Person per ON mp.PersonID=per.ID
JOIN morecheese_members.MemberProfile pr ON pr.PersonID=per.ID
WHERE mp.Status = 'PendingRenewal' ORDER BY mp.EndDate;
```

Also: `datagen/out/dashboard.html` — the offline inspector (member timelines, the causal
tab, the gate report) over the same build.

## Rebuild from scratch (~2 minutes)

```sh
# 1. regenerate + emit (deterministic — same seed, same bytes)
node datagen/cli/build.mjs --n 2500 --seed 42 --release 2026-07-31 --demo
node datagen/cli/emit-sql.mjs && node datagen/cli/emit-schema.mjs && node datagen/cli/emit-mjsync.mjs

# 2. clone the MJ DB (inside the sql container) + install:
#    RESTORE ... AS MoreCheese_Playground, then run out/sql/00_schema.sql, 01..05_*.sql in order

# 3. register entities: from this repo root, with DB_* env pointed at the playground DB
npx mj codegen --skipfiles   # DB-side only: registers entities, generates views/procs —
                             # writes NO code files into the repo (--skipfiles is the
                             # playground mode; omit it only when you WANT generated code,
                             # which must then ship with its migration)
```

## Honest labels

- Table shapes are still the PROVISIONAL assumed shapes (`emit-schema`), not the
  reconciliation's. Entity names are verified (CodeGen minted exactly the names the
  emitters assume); the shapes remain ours until Marcelo's migrations land.
- The Person/Organization SPLIT IS LANDED (Marcelo's memo §2.2/2.3): identity rows live in
  `__mj_BizAppsCommon.Person/Organization` (stand-in tables with their REAL column shapes,
  IF-guarded — a genuine bizapps-common install wins) and member/org-specific fields live in
  `morecheese_members.MemberProfile/OrganizationProfile` with hard FKs. Emails are
  deterministic `@example.com` (RFC 2606). `morecheese_common` no longer exists.
- Everything in the playground DB is disposable; the generator + this doc reproduce it.
