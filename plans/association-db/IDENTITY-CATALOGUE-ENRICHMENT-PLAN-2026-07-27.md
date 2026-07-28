# MoreCheese v2 — identity, demographics and catalogue enrichment

**Status:** proposal, nothing built. **Date:** 2026-07-27.
**Base:** `sonar-metadata-integration` @ `edc8571` + the two data-quality passes (`2dd19b3`, `5958d61`)
and the ruleset-formatting fix (`0b07973`). Suite green at 146 gates.

The ask: tighten nationality, names, demographics-by-region, and the catalogue tables
(3 certifications, a thin course catalogue) across the whole dataset.

---

## 1. What the audits found

Four read-only audits over the canonical N=2500 build. Full evidence in the session
record; the load-bearing facts:

### Identity is three-valued and country-free
- **There is no `Country` field** in the generator *or* the DDL. `State` holds US postal
  codes for 14 US cities and ISO country codes for everything else — and uses `CA` for
  California (255 people) while Canada is `CA-ON` (72). Grouping by `State` silently
  merges them.
- **Names key off three super-regions (NA/EU/RoW), not countries.** Every European city
  therefore gets an identical name mix: Poligny is 29% Nordic/Germanic vs 27% French;
  Somerset is 11% anglo; Bern is 27% Slavic and 0% Spanish (the EU weight vector has no
  `hispanic` key); Oaxaca is 34% anglo. Aarhus, Amsterdam, Bern, Poligny and Somerset are
  statistically indistinguishable.
- **23 cities, 23 exact coordinate pairs** for an "International" federation. EU is five
  countries; Italy, Spain, Germany, Ireland, Austria, Portugal, Greece, Norway, Sweden,
  Poland are absent. A map renders 23 pins with 173 people stacked on one.
- **93.4% of employed people do not live in their employer's city; 53.9% not even the same
  region** — employer is drawn uniformly over all orgs, ignoring geography entirely. That
  is exactly chance, i.e. no coupling at all.
- **Every email is `first.last.MEMBERNUMBER@`** (98.8%; the rest are the deliberate
  duplicate shells). The member number is in 100% of local parts.
- **Accented characters are deleted, not transliterated**: `Nordström → nordstrm`,
  `Grüber → grber`, `Quesería Valdeluna → queseravaldeluna`. 22 people, 3 orgs.
- **171 of 641 org domains are truncated mid-word** at a 24-char cap:
  `beauchampfarmsteadcreame.example`.
- Person record is 16 columns. **Absent:** country, address, postal code, phone,
  birthdate, gender, pronouns, prefix/suffix, language, communication preferences.

### Catalogues are thin, and several are hardcoded in code
| Catalogue | Now | Where declared |
|---|---|---|
| Certifications | **3** | ruleset ✅ |
| Course topics | **8** (111 courses, 81 distinct names, 30 collisions) | **`learning.mjs:14` — code** |
| Webinar topics | **4** (84 webinars; `Label Law 2024` ×6) | **`events.mjs:66` — code** |
| Workshop subjects | **4** × 20 cheese-words | **`events.mjs:61` — code** |
| Conference host cities | **3**, rotating on `year % 3` | **`events.mjs:51` — code** |
| Products | **6**, 2 types, CHECK-constrained | code, from ruleset inputs |
| Committee types / roles | **2 / 3** (no Secretary, Treasurer, Staff Liaison) | ruleset ✅ |
| Relationship types | **2 rows carrying 2 edges** | ruleset ✅ |
| Issue statuses | 4, but selection is a hardcoded bernoulli | ruleset + code |
| Meeting rooms, issue titles | 4, 4–6 | **code** |

Two structural holes worth naming:
- **The relationship type carrying 1,593 of 1,596 edges (`Employee`) is not in our
  dictionary at all** — it is referenced by an externally-seeded UUID. A relationship
  viewer shows a 2-row type list and a graph made almost entirely of an invisible type.
- **Committees claim formation dates from 2014 but governance data starts 2023** — eight
  years of missing history, and certifications/competition entries generate **zero
  revenue** despite 121 credentials and 445 entries.

### Determinism: cheaper than feared, with two real traps
- `pickWeighted`/`pick` consume **exactly one draw regardless of list size**. Expanding a
  bank changes *which* value each row gets but **shifts no downstream draw**.
- **UUIDs are content-addressed on `MemberNumber` / `OrgKey` only.** Names, cities, emails,
  new columns — none of it moves a UUID. Every FK across all 12 packs survives.
- City / lat-lon / names are **display-only**: no distance maths exists, and the causal
  model never reads them. So a "re-roll" of geography and names is cosmetic, not causal.
- **Trap 1 — the compiler.** `hooks.compile.refineMeasure` re-runs `buildOrgs` /
  `buildPeople` / `runRenewalUnroll` on a reference world to solve the causal coefficients.
  Any change to *draw order* in those three functions re-solves every β for every seed and
  scenario. Adding draws on **new stream keys** avoids this completely.
- **Trap 2 — gate 6c cannot see `ALTER TABLE`.** It parses only `CREATE TABLE`. The moment
  we add a column via a new migration, the suite goes red with *"in shim, not in
  migration"*. This blocks all schema work until fixed.
- Expanding the **org name bank** is the one genuinely expensive bank change: it re-deals
  every org name via a `shuffle` (cost = pool length), and because ~60% of member emails
  derive from org names, most emails change with it.

### Free capacity already in the upstream schema
`__mj_BizAppsCommon.Person` already has, nullable and unfilled: **`Prefix`, `Suffix`,
`Phone`, `DateOfBirth`, `Gender`, `PhotoURL`, `Bio`**.
`Organization` already has: **`LegalName`, `Website`, `Phone`, `FoundedDate`, `Description`,
`TaxID`, `ParentID`**.
Filling these needs **no migration** — just the three emitters plus the dev shim.

### Real-world calibration (published association data)
Non-response rates from associations that actually print them — ASHA 2024/25, AIA 2024,
APA 2002–2017, ACS 2014:

| Field | Blank rate | Anchor |
|---|---|---|
| Gender | 8–11% | ASHA |
| Age / birthdate | 5% senior tier → 21% junior tier | AIA, ASHA |
| Ethnicity | 12–15% | ASHA |
| Race | 15–17%; 26–41% where self-service only | ASHA, APA, AIA |
| Explicit "prefer not to say" | 1.7–9%, **grew ~10× over a decade** | AIA 2014→2024 |
| Job function | 15–28% | ASHA, APA |

Three patterns to build rather than a flat rate:
1. **Blankness scales inversely with member tier** — APA: Fellow 5.6% vs Associate 45.5%,
   same field, same year.
2. **New joins are ~2× blanker** than the file average — AIA: 39% vs 21%.
3. **Two distinct nulls that behave differently** — "never answered" (large, flat 17–26%)
   vs "prefer not to say" (small, rising fast). Model both.

---

## 2. The one design rule for demographics

Associations really do collect this, so it is legitimate demo data — a DEI dashboard is a
real screen. But there are two ways to build it and only one is defensible.

**Rule: response *rate* may ride engagement; response *values* must not.**

- Whether a member answered **may** correlate with tier and tenure. That is a documented
  real phenomenon (pattern 1 above) and it makes the roster behave correctly.
- What they answered, **given** that they answered, is drawn from a stream independent of
  the engagement dial, renewal, spend, and every other outcome.

Without this, someone demos a "discovered" disparity in renewal or revenue by race or
gender that we fabricated. Enforced by gate, not by good intentions:
`demographics decorrelated from outcomes` — for each demographic value, renewal rate and
mean engagement must sit inside the population band. Negative-test it by deliberately
injecting a skew and confirming the gate fails.

Same for nationality: country becomes real and names become country-coherent, but neither
carries engagement signal.

---

## 3. Phased plan

Ordered by value ÷ blast radius. Each phase is independently shippable and green.

### Phase 0 — unblock the schema path *(prerequisite, small)*
Teach gate 6c (`test.mjs:104-130`) to parse `ALTER TABLE … ADD` in addition to
`CREATE TABLE`, so a column added by a follow-on `V*` migration is visible to the drift
guard. Negative-test: add a column, confirm the gate goes green only when the migration
is present.

Also needed: a ruling from the install-branch owner on whether the **unshipped** v1.0.0
baseline may be amended in place, or whether every new column must be a follow-on `V*`.
That answer changes phases 2, 3 and 5. *(Decision required — see §5.)*

**Blast radius:** none (test-harness only).

---

### Phase 1 — free wins: no migration, no cascade *(biggest value per unit of risk)*

**1a. Fill the upstream columns that already exist.** New stream keys only
(`contact:<key>`, `orgmeta:<key>`), so provably zero re-roll:
- Person: `Phone` (country-appropriate format), `Prefix`/`Suffix` where the title implies
  it, `Bio` for heroes and a small share of crowd, `DateOfBirth` (see 2b for blanking).
- Organization: `Website` (derived from the same slug as the email domain, so they agree),
  `Phone`, `FoundedDate` (must precede every employment edge), `Description`, `LegalName`
  (`… Ltd`/`… SARL`/`… GmbH` by country once Phase 3 lands).

**1b. Move hardcoded banks into ruleset/bank JSON, then expand them.** This is the
"rename-in-place" win: keys are derived from year+index, so **all 4,912 enrollments,
16,827 registrations and 17,338 orders survive byte-identical** — only `Name` strings
change.
- Course topics 8 → ~40, organised into tracks (see 5a).
- Webinar topics 4 → ~30. Workshop subjects 4 → ~20.
- Conference host cities 3 → a rotating international list (pairs with Phase 3).
- Meeting rooms, issue title banks, `generalDetails` → ruleset.

**1c. Expand the pure-`.map()` dictionaries** (zero draws involved):
- **Relationship types.** *(Corrected during implementation: an earlier draft said to add
  `Employee`/`Subsidiary` to our dictionary so it would describe the graph it ships. That
  would be a **bug** — those are bizapps-common's own seeded rows, referenced by pinned
  UUID precisely because app-seeded lookups collide **by name** at install (runbook finding
  F6). We must never re-create them.)* The correct move is to add **demo-owned** types that
  cannot collide — referred-by, supplier-of, board sponsor, household — and derive edges
  for each from facts we already have, so a relationship viewer shows more than one type.
- Committee roles: + Secretary, Treasurer, Staff Liaison, Ex-Officio.
- Committee types: + Task Force, Working Group, Advisory Council.
- Issue statuses: + On Hold, Waiting on Member, Escalated, Duplicate, Reopened (requires
  moving the hardcoded status bernoulli into the ruleset).
- Task types: + Onboarding, Follow-up, Content Review, Certification, Sponsorship.

**1d. Back-fill committee history** 2015–2022. Each term owns its own stream, so existing
terms are untouched — this is additive. Closes the "formed 2014, data starts 2023" hole
and gives roster continuity (currently 4% carryover between terms) somewhere to live.

**Blast radius:** none causal. Names/labels change; keys, counts, UUIDs, causal inputs all
stable. **New gates:** every relationship type carries edges; every dictionary row has
children or is deliberately empty; catalogue name-collision ceiling.

---

### Phase 2 — demographics *(needs one migration)*

New columns on **`MemberProfile`** (ours): `Gender` is upstream on `Person` and free;
`RaceEthnicity`, `EthnicityHispanic`, `PronounSet`, `PrimaryLanguage`, `JobFunction`,
`YearsInIndustry` need our own table.

Model, per §2:
- Two nulls: `NULL` (never answered) and a literal `Prefer not to say`, at the published
  ratio (~17–26% vs ~2%, with the "prefer not to say" share rising in recent join
  cohorts — that trend is itself real and demoable).
- Response rate scales with tier and tenure (Fellow-vs-Associate effect) and is ~2× blanker
  for members who joined in the last 18 months.
- Values drawn on an independent stream, decorrelated from every outcome.
- Race/ethnicity categories: use the multi-select structure real associations use
  (separate Hispanic-origin question), not a single flattened field.

**Blast radius:** additive columns; one `V*` migration + CodeGen. No re-roll.
**New gates:** blank rates land in the published bands per field; two-null split present;
new-joiner blankness ≈ 2× file average; **decorrelation gate** (negative-tested).

---

### Phase 3 — nationality and geography *(the headline fix)*

- **Add `Country` (ISO-3166-2)** to `MemberProfile` and `OrganizationProfile`; keep
  `Region` as the existing NA/EU/RoW roll-up (its CHECK stays valid). Resolve the
  `CA`-means-California-and-Canada ambiguity by making `State` genuinely sub-national and
  `Country` authoritative.
- **Expand the city bank** from 23 to ~70–90 across ~20 countries, weighted by real cheese
  production/trade so Europe stops being five countries. Add per-person coordinate jitter
  so a map shows a cloud, not 23 pins.
- **Address + postal code** on both profiles, in country-correct formats (a French postal
  code is not a US ZIP) — this also unlocks the missing-field and format-inconsistency
  defect classes that the cleanup demo currently cannot show.
- **Couple employment to geography**: employer drawn with a strong same-country /
  same-city preference, with a deliberate minority of genuine remote and
  multinational-subsidiary cases. *This one is not free* — employer assignment feeds
  relationships and the stale-employer defects.

**Blast radius:** city/country values change for everyone (cosmetic, no cascade); the
employer-coupling change re-rolls employment edges and the defect pack. Migration +
CodeGen. **New gates:** country coverage and weighting; every person's country consistent
with their city; employer-geography coupling within a target band; postal formats valid
per country.

---

### Phase 4 — country-coherent names and emails

- **Per-country name weights** replacing the three super-region vectors, so Poligny reads
  French, Aarhus Danish, Oaxaca Mexican — with a deliberate, realistic diaspora share
  rather than uniform mixing. Fixes the missing `hispanic` in EU and `slavic` in RoW.
- **Maternal surnames** for Hispanic/Iberian names instead of a bare middle initial; fix
  the uniform A–Z middle initial (X/Q/Z currently as common as J/M).
- **Transliterate** accented characters in emails and domains (`ö → oe`, `é → e`) instead
  of deleting them.
- **Email format variety**: drop the member number from the local part (it is currently in
  100%), and mix the real-world patterns — `f.last@`, `flast@`, `first@`, `first.last@`,
  with a realistic collision-disambiguation tail. Keep the reserved `.example` TLD.
- **Fix the 24-char domain truncation** — truncate on a word boundary or use an acronym.
- **Heroes are exempt** (pinned facts, safety-cleared).

**Blast radius:** all crowd names and most emails change — display-only, no cascade, no
UUID movement. Must verify the duplicate-shell and typo-email defects still derive
consistently (they share the derivation functions, so they should).

---

### Phase 5 — catalogue depth that needs schema

**5a. Certifications 3 → a real programme.** Add `Level`, `Track`, `PrerequisiteCertKey`,
`CEUsRequired`, `RecertificationYears`, `Description`, `ExamFee`. Model a genuine ladder
(foundation → professional → master) with prerequisites actually enforced, plus
recertification cycles — which is where the Expired status we added in pass 2 becomes a
story rather than a state.

**5b. Courses.** Add `Topic` as a real column (currently only recoverable by splitting the
name), plus `Level`, `Track`, `DeliveryMode` (in-person / live-online / self-paced),
`CECredits`, `InstructorPersonID`, `Description`. Tie course tracks to certification
tracks so the education → credential path is walkable.

**5c. Products and revenue.** Widen the `ProductType` CHECK beyond
`Membership`/`Event` and add publications, certification exam and recertification fees,
sponsorship/exhibitor packages, job-board postings, merchandise, donations. **Then bill the
facts that currently generate no revenue**: 121 certifications and 445 competition entries.
Also multi-line orders (conference + workshop + banquet), which fixes the 1:1
order↔line ratio, and price escalation over 13 years.

**Blast radius:** migrations (including CHECK widening) + CodeGen. Order/line changes
re-roll the money pack.

---

### Phase 6 — organisations *(last, alone)*

Expand the org name grammar (currently 59 invented toponyms × ~15 forms — 12 consecutive
`Nornbrook …` rows in an alphabetical list), make org names country-appropriate, give orgs
a realistic **Zipf size distribution** (today the largest employer in a 641-org federation
has 9 members and the mode is 1–3), and add org-level defect classes (duplicate orgs,
merged survivors).

**Why last:** expanding the org bank re-deals every org name through a `shuffle`, and ~60%
of member emails derive from org names — so this moves the most rows of any single change.
Do it once, deliberately, after Phases 1–5 are green.

---

## 4. Verification, every phase

1. `node cli/generate.mjs --n 500 --seed 42 --out out-A`, apply change, regenerate to
   `out-B`, `diff -r` — the blast radius is then measured, not assumed.
2. Full suite: 7 seeds, determinism, N=2500, scenario, emitters, DDL drift,
   frozen-migration drift, dependency-schema contract.
3. New gates negative-tested (feed the broken input, confirm red) — the discipline that
   caught the transcript-truth bug.
4. Scale-aware thresholds: two gates in pass 2 false-redded the 7-seed sweep by asserting
   on small-sample counts. Any new gate asserts only where the expected count supports it.
5. Phases touching schema: apply on a scratch DB and confirm CodeGen + `mj sync push`
   round-trip before committing.

## 5. Decisions I need from you

1. **Baseline amendment** — may the unshipped v1.0.0 baseline be edited in place for new
   columns, or must everything be a follow-on `V*`? Changes phases 2/3/5.
2. **Scope and order** — is Phase 1 + 3 + 4 (identity, nationality, names — your stated
   ask) the target, with 2/5/6 later? Or all six?
3. **Demographics** — confirm the §2 rule (rate rides engagement, values decorrelated) and
   that voluntary self-ID with realistic blank rates is what you want.
4. **Employer-geography coupling** (Phase 3) is the one non-free identity change. Worth the
   re-roll of employment edges, or leave people working remotely for a creamery 5,000 km
   away?

## 6. Field model — what real AMS products actually store

Sourced from published vendor schemas (iMIS/ASI docs, Rhythm's public OpenAPI, Impexium's
Power Automate connector reference, MemberSuite object docs, Salesforce NPSP metadata).
Use these shapes rather than inventing our own:

- **Three distinct title concepts, consistent across every product surveyed** — job *title*
  (free text: "Head Cheesemaker"), job *function/role* (taxonomy: "Operations",
  "Quality"), and *credentials/designation* ("CCP", "PhD"). iMIS: `Title` /
  `FunctionalTitle` / `Designation`. Rhythm: `job_title` / `contact_role_ids` /
  `credentials`. We currently have only the first. A real job-function taxonomy exists to
  copy: ASAE's published interest sections.
- **Addresses are typed and multiple**, with an open lookup of purposes (Home, Work,
  Billing, Shipping, Seasonal) and separate preferred-mailing / preferred-billing /
  preferred-shipping flags. `Address3` exists specifically for international addresses.
- **International address formats are per-country layout templates**, not one shape —
  iMIS ships numbered formats (Japan and Korea lead with country and postal code).
- **Bad-address modelling differs by product**: a lookup-driven status (iMIS
  `BAD_ADDRESS`: "Moved", "No such address"), a date (`IncorrectSince`), or a boolean
  (`Undeliverable`). The date form is the most useful for a data-quality demo.
- **Phones are typed** (work / home / mobile / fax), with a preferred flag; extension and
  dialling-country are rarer (Impexium has both).
- **Suppression flags are first-class**: `do_not_call`, `do_not_mail`, `email_opt_out`,
  plus per-topic communication preferences with opt-in vs opt-out semantics. Rhythm has a
  tri-state subscription (`subscribed / digest / unsubscribed`) worth copying.
- **Membership date vocabulary** is richer than ours: join, effective, expire, **grace
  expire**, terminate, last-renewal. We have a grace period in the model but not as a date.
- **Organisation size and revenue are never native AMS fields** — they are custom fields
  everywhere. Real band structures come from published dues schedules: employee bands
  (ASAE 1-9 / 10-49 / 50+; chambers use 1-5 / 6-10 / 11-25 / 26-50 / 51-100 / 101-250 /
  251-500 / 501+) and revenue bands (NBAA: ≤$1M / $1-3M / $3-20M / $20-100M / $100-500M /
  $500M-1B / $1B+). Use these for the org-size Zipf in Phase 6 and to make Corporate vs
  SmallBusiness tiering defensible.
- **Gender is usually a small open lookup, not a boolean** — and several products ship only
  Male/Female out of the box, which is exactly the kind of legacy limitation a modern DEI
  dashboard demo is meant to contrast with. AIA's real data carries five distinct values
  including `Self-described`, `Prefer not to say` and `None Selected`.

## 7. Not proposed

- Reordering draws in `world.mjs` / `membership.mjs`, or touching segment weights — either
  re-solves every causal coefficient world-wide.
- Inserting a hero mid-roster (append-only by rule).
- Real photographs, real personal data, or any real organisation's branding.
