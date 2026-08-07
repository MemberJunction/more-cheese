# MoreCheese enrichment: Forms + Issues + Cross-App Hero Footprint

## Context

Mounting the real bizapps UIs over our generated data (the committees proof) exposed gaps the
generic entity browser never showed. A data audit of the canonical N=2500 build found:

- **Forms** is the thinnest app, ironically: 1 form / 1 page / 3 questions, and **0 anonymous
  responses** — yet anonymous/public intake is bizapps-forms' flagship feature.
- **Issues** looks flat: priority/severity ~all "Medium" (100 of 104), severity is a copy of
  priority, no assignees.
- **Cross-app narrative fails**: you can't walk a flagship persona (Elena, Bob, Gwen, Tom)
  through every app — almost no hero has an issue or form response.
- **Tasks** is already healthy — untouched.

Scope agreed with the workstream lead: forms + issues enrichment, cross-app narrative check, **no accounting**,
**issue comments deferred**. Key exploration finding: **zero migrations needed** — the real
schemas already support everything (nullable `RespondentPersonID` + `AnonymousSessionID` +
`SourceMetadata` on FormResponse; `AssigneeEntityID/RecordID` + Low→Critical CHECKs on Issue).
Pure datagen work on `datagen-framework`.

## Goals

1. **Forms**: second form — "Membership Application" **public intake**, anonymous respondents
   (applicants aren't members; the second form IS the anonymous story). Post-conf survey stays
   member-only.
2. **Issues**: severity (impact) and priority (urgency) become distinct, realistic distributions
   incl. some Critical/Low; ~75% of issues assigned to committee officers (renewal-outreach
   precedent — no invented staff records).
3. **Hero footprint**: Elena ICF-000101, Bob ICF-000105, Gwen ICF-000108, Tom ICF-000109 each get
   ≥1 authored issue + ≥1 guaranteed survey response, gated. (Tasks excluded from the gate: Bob
   pins `Active` so he can never receive a renewal-outreach task, and Tom sits on no committee —
   noted as follow-up.)

## Determinism contract

New data uses new rng streams. **Byte-identical surfaces:** people/orgs/periods/events/
registrations/orders/learning/committees/tasks packs; all crowd survey responses and answer
values (via the meanTheta exclusion below); existing issues' status draws.
**Intentional re-rolls (call out in commit):** MC-#### numbers reshuffle (4 hero drafts enter the
sort), every issue's Severity/Priority re-derives, IssueNumberSequence bumps, survey distributions
gaining a hero response bump ResponseCount.

---

## Implementation (ordered)

### 1. Ruleset — `datagen/projects/morecheese/ruleset/modules/forms.json`
Additive `application` block next to `survey` (do NOT refactor `survey` to plural — zero
byte-churn):
- name "Membership Application", page "Tell us about yourself"
- 5 questions using richer types: name (ShortText), email (Email), segment (SingleChoice:
  Producer/Retailer/Supplier/Educator/Enthusiast), operation (LongText), newsletter (YesNo)
- distribution: `{ channel: "PublicLink", sinceYearsBeforeRelease: 3 }` — ONE open distribution
- volume: `{ perYearMin: 20, perYearMax: 40, partialShare: 0.15 }`
- segmentMix weighted list; `$note` re: anonymity
- SingleChoice options live in config/prompt only; the answer is stored as TextValue (verify once
  whether real FormQuestion has an options column; populate if so — fixture-only).

### 2. Ruleset — `heroes.json` (append-only INSIDE existing hero objects; never reorder roster)
For Elena / Bob / Gwen / Tom add:
- `issues: [{ type, title, daysBeforeRelease }]` — one story-consistent issue each, all
  `daysBeforeRelease < 75` so they land in open statuses (visible on demo boards):
  Elena→Events "Session recordings missing…", Bob→Billing "Invoice went to old Ostergaard AP
  contact after acquisition", Gwen→Data Correction roster affiliation, Tom→General testimony
  question.
- `pins.issueMin: 1` and `pins.formResponse: true` (declarative gates, matching existing pin
  pattern). `$comment` noting tasks-footprint as follow-up.

### 3. Ruleset — `issues.json`
- `severity.byType` weighted distributions (Billing skews High/Critical; Data Correction/Events
  mostly Medium/Low; General Low) + `tolerance: 0.06`
- `priorityRule`: priority = type default, bumped if severity ≥ High, small noiseDownShare 0.15 —
  so severity ≠ priority
- `assignment`: `{ share: 0.75, tolerance: 0.08 }` — New issues more likely unassigned

### 4. Generator — `datagen/projects/morecheese/issues.mjs`
Signature → `buildIssues(cfg, people, orgs, events, registrations, money, committees)`:
- Hero-authored drafts after the Kate/Kathy block (authored facts, no rng), key
  `hero:${memberNumber}:${i}`, source = the hero's Person record.
- Severity/Priority on a NEW stream `rng(seed, 'issue-sevprio:'+d.key)` (never touch the existing
  `issue-status:` streams). Severity = weighted pick per type; Priority derived per priorityRule,
  clamped to the Low..Critical ladder.
- Assignees: officer pool = active-term Chairs/Vice-Chairs from `committees.memberships`
  (deterministic sort); per-issue stream `issue-assign:${d.key}`; assign ~40% of New / ~90% of
  others (nets ≈ share); emit `AssigneeEntityName: 'MJ_BizApps_Common: People'` +
  `AssigneeMemberNumber` (both absent when unassigned — satisfies the both-or-neither CHECK).
  Guard `if (!officers.length) skip` (pilot scale).

### 5. Generator — `datagen/projects/morecheese/forms.mjs`
- **Hero survey responses** (separate declared loop AFTER crowd childOutcome, driven by
  `R.heroes.filter(h => h.pins?.formResponse)`): anchor to any attended-conference year with a
  distribution (most recent), ResponseKey `distKey:member` — skip if crowd already selected them;
  force Complete; stream `formresp-hero:${memberNumber}`; bump dist.ResponseCount.
- **meanTheta exclusion**: compute the NPS/overall calibration pool over crowd rows only
  (exclude `_hero`) → crowd answers stay byte-identical; hero answers price off the same bases
  with the hero's theta.
- **Application fixtures**: append form/version/page/questions from `F.application`
  (keys `membership-application`, `:1`, `:p1`, `:qkey`); one Open PublicLink distribution.
- **Anonymous responses**: per year in window, count from `rng(seed,'formapp:'+year)`; per
  applicant stream `formapp:${year}:${i}` for date/partial/answers. Rows:
  `MemberNumber: null`, `AnonymousSessionID: 'anon-'+hex`, `SourceMetadata` JSON
  ({channel:'web', referrer}), Status Complete|Partial (partial = first answer only).
  Applicant names via existing `personNameFor(seed, 'formapp:'+year+':'+i, 'NA')` from
  `./banks.mjs` (no import cycle) — identity lives ONLY in answer TextValue; **no Person rows**.
  Answers: name/email/segment/operation → TextValue; newsletter → BooleanValue.

### 6. Wiring — `datagen/projects/morecheese/index.mjs`
Pass `committees` into `buildIssues`. Pack map unchanged (assignees reference Person rows already
in `common`).

### 7. Emitters (all three)
- `emit-sql.mjs` form_responses: null-guard `RespondentPersonID`; add `AnonymousSessionID`,
  `SourceMetadata`, `StartedAt`. form_answers: add `TextValue`. issues: add
  `AssigneeEntityID` (reuse existing `@E_People` DECLARE; NULL when unassigned) +
  `AssigneeRecordID` (person uuid; both derive from the same field). Verify once whether real
  FormResponse has a DistributionID column — if yes, emit it (latent bug fix).
- `emit-mjsync.mjs`: same three changes (`@lookup:Entities.Name=MJ_BizApps_Common: People` for
  AssigneeEntityID).
- `emit-schema.mjs` (dev shim; drift guard only covers morecheese_* tables — safe): FormResponse
  +AnonymousSessionID/SourceMetadata/StartedAt; FormResponseAnswer +TextValue; Issue stand-in
  +Assignee columns.

### 8. Validator — `datagen/cli/validate.mjs`
Amend existing gates (required):
- FK gate: member refs checked only when `MemberNumber != null`; anon rows must have
  `AnonymousSessionID`; assignee refs must resolve to people.
- **Survey response-rate gate: filter `FormKey === 'post-conf-survey'`** (else application
  responses inflate it — the most likely silent breakage). NPS gates already filter by
  QuestionKey.

New gates:
- application responses exist, all anonymous-shaped (null member + session id), volume within
  `[3×perYearMin, 3×perYearMax]`
- severity spread per level vs expected mixture (tolerance + 3×SE), plus a
  "severity and priority are decoupled" existence check
- assignment coverage vs share (tolerance + 1.5×SE); every assignee is a committee officer
- distribution ResponseCount === actual row count (load form_distributions)
- `checkHeroes` pin loop: `pins.issueMin` (reporter count) + `pins.formResponse` (response
  exists) — this IS the cross-app footprint gate.

### 9. Record the plan in-repo
Copy this plan to `plans/association-db/FORMS-ISSUES-ENRICHMENT-PLAN-2026-07-21.md` (per
the workstream lead's request to have the plan on a markdown file) and commit it with the change.

## Verification

1. Spot: `node cli/generate.mjs --n 500 --seed 42 --release 2026-07-31 --out out-test` +
   `validate.mjs` — all gates green.
2. **Byte-surface audit**: diff packs vs a pre-change baseline build — changes ONLY in
   `issues/*` and `forms/*`; all other packs byte-identical (if crowd survey answers moved, the
   meanTheta exclusion is missing).
3. Full suite `node test.mjs` (7 seeds, determinism, N=2500) — watch the hero formResponse pin at
   every seed (risk: a hero with zero attended conferences at some seed — mitigate by anchoring
   to ANY attended year; only build further fallback if a seed actually fails).
4. Canonical rebuild (`build.mjs --n 2500 --seed 42`) → `emit-mjsync --metadata-out
   ../metadata/demo-data` → eyeball one anon response + one assigned issue → commit generator +
   ruleset + demo-data + plan doc together (changeset not needed — no migration), noting the
   intentional re-rolls (issues renumbering makes a big-looking demo-data diff — expected).

## Key risks
- Hero without attended conference at some seed → anchor to any attended year (mitigation a);
  decide more only if the suite fails.
- ResponseKey hero/crowd collision → skip-if-present.
- Rate-gate contamination → FormKey filter (step 8).
- Officer pool empty at pilot scale → skip assignment guard; SE-tolerant gate.
- F6 lookups, statusMix, people pack: untouched by construction (no new statuses, no new Person
  rows, no new DECLAREs).
