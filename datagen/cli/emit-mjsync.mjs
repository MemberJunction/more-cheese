// mj-sync emitter: converts the JSON packs into an MJ metadata tree.
// Usage: node emit-mjsync.mjs [--out out] [--metadata-out <dir>]   (run build.mjs first)
//   --metadata-out points the tree anywhere — e.g. the app's `metadata/demo-data/` so a
//   `mj sync push` over that dir picks it up. Resolved against the CWD; default is the
//   disposable out/metadata/. Only THIS emitter's own entity folders are cleared on
//   regeneration — sibling content in the target dir (e.g. schema-info/) is left alone.
//
// Format per docs/template-docs/metadata.md: root .mj-sync.json with directoryOrder
// (parents before children — the pack pyramid), one folder per ENTITY with its own
// .mj-sync.json, records as dot-prefixed JSON arrays. Every record pins its primaryKey
// with our deterministic UUID (core/ids.mjs), so `mj sync push` is a stable upsert:
// re-push after a regeneration updates the same rows in place. FK fields carry literal
// pinned IDs (derived independently) — no @lookup needed.
//
// ✓ ENTITY NAMES VERIFIED (2026-07-13): a real CodeGen run against a cloned MJ database
//   (MoreCheese_Playground) minted exactly these names, and `mj sync push` round-tripped
//   ("no changes" vs SQL-loaded rows — pinned UUIDs make both load paths the same rows).
//   Table SHAPES remain provisional pending the reconciliation, and the common-pack
//   entities will eventually belong to bizapps-common, not MoreCheese.
// ⚠ `mj sync push` is a FULL RECONCILE per entity scope — it can DELETE rows that exist
//   in the DB but not in these files. Dev databases only; never over real data.
//
// Output defaults to out/metadata/ (inert); pass --metadata-out to write into the repo's
// live metadata/ tree (e.g. a dedicated metadata/demo-data/ folder) for a real `mj sync`.

import { readFileSync, writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { uuidFor } from '../engine/ids.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const args = Object.fromEntries(process.argv.slice(2).map((a, i, all) => (a.startsWith('--') ? [a.slice(2), all[i + 1]] : null)).filter(Boolean));
const PKG = join(HERE, '..');
const OUT = join(PKG, args.out ?? 'out');
const load = (pack, table) => JSON.parse(readFileSync(join(OUT, 'packs', pack, `${table}.json`), 'utf8'));
const run = JSON.parse(readFileSync(join(OUT, 'run.json'), 'utf8'));

const CHUNK = 5000; // records per file; big tables split across .part-N.json files

// ---------- mapping: pack table → entity folder (entity names verified vs CodeGen) ----------
const MAPPING = [
  // THE PERSON/ORG SPLIT (memo §2.2/2.3): identity → bizapps-common's entities (their
  // prefix, not ours); member/org-specific fields → our extension-profile entities.
  // No IsSharedDemo on their entities (§2.5) — demo rows identify via the profile join.
  {
    pack: 'common', json: 'organizations', dir: 'organizations', entity: 'MJ_BizApps_Common: Organizations',
    record: (r) => ({
      primaryKey: { ID: uuidFor('org', r.OrgKey) },
      fields: { Name: r.Name, Status: r.LifecycleEvent?.kind === 'Dissolved' ? 'Dissolved' : 'Active' },
    }),
  },
  {
    pack: 'common', json: 'organizations', dir: 'organization-profiles', entity: 'MoreCheese: Organization Profiles',
    record: (r) => ({
      primaryKey: { ID: uuidFor('orgprofile', r.OrgKey) },
      fields: {
        OrganizationID: uuidFor('org', r.OrgKey), OrgKey: r.OrgKey, Type: r.Type,
        Region: r.Region, City: r.City, State: r.State, Latitude: r.Latitude, Longitude: r.Longitude,
        LifecycleEventKind: r.LifecycleEvent?.kind ?? null, LifecycleEventYear: r.LifecycleEvent?.year ?? null,
        IsSharedDemo: r.IsSharedDemo,
      },
    }),
  },
  {
    pack: 'common', json: 'people', dir: 'people', entity: 'MJ_BizApps_Common: People',
    record: (r) => ({
      primaryKey: { ID: uuidFor('person', r.MemberNumber) },
      fields: { FirstName: r.FirstName, LastName: r.LastName, Email: r.Email, Status: 'Active' },
    }),
  },
  {
    pack: 'common', json: 'people', dir: 'member-profiles', entity: 'MoreCheese: Member Profiles',
    record: (r) => ({
      primaryKey: { ID: uuidFor('memberprofile', r.MemberNumber) },
      fields: {
        PersonID: uuidFor('person', r.MemberNumber),
        OrganizationID: r.OrgKey ? uuidFor('org', r.OrgKey) : null,
        MemberNumber: r.MemberNumber, Segment: r.Segment,
        Region: r.Region, City: r.City, State: r.State, Latitude: r.Latitude, Longitude: r.Longitude,
        JoinDate: r.JoinDate, IsSharedDemo: r.IsSharedDemo,
      },
    }),
  },
  {
    pack: 'membership', json: 'membership_periods', dir: 'membership-periods', entity: 'MoreCheese: Membership Periods',
    record: (r) => ({
      primaryKey: { ID: uuidFor('period', r.PeriodKey) },
      fields: {
        PeriodKey: r.PeriodKey, PersonID: uuidFor('person', r.MemberNumber),
        MembershipTier: r.MembershipTier, DuesAmount: r.DuesAmount,
        StartDate: r.StartDate, EndDate: r.EndDate, RenewalDate: r.RenewalDate,
        Status: r.Status, CancellationDate: r.CancellationDate, CancellationReason: r.CancellationReason,
        AutoRenew: r.AutoRenew, IsSharedDemo: r.IsSharedDemo,
      },
    }),
  },
  // committees pack → bizapps-committees entities (their prefix 'Committees: '); no IsSharedDemo
  { pack: 'committees', json: 'committee_types', dir: 'committee-types', entity: 'Committees: Types',
    record: (r) => ({ primaryKey: { ID: uuidFor('ctype', r.TypeKey) }, fields: { Name: r.Name, IsStandards: r.IsStandards, DefaultTermMonths: r.DefaultTermMonths } }) },
  { pack: 'committees', json: 'committee_roles', dir: 'committee-roles', entity: 'Committees: Roles',
    record: (r) => ({ primaryKey: { ID: uuidFor('crole', r.RoleKey) }, fields: { Name: r.Name, IsOfficer: r.IsOfficer, IsVotingRole: r.IsVotingRole, Sequence: r.Sequence } }) },
  { pack: 'committees', json: 'committees', dir: 'committees', entity: 'Committees: Committees',
    record: (r) => ({ primaryKey: { ID: uuidFor('committee', r.CommitteeKey) }, fields: { Name: r.Name, TypeID: uuidFor('ctype', r.TypeKey), MissionStatement: r.MissionStatement, Status: r.Status, IsPublic: true, FormationDate: r.FormationDate } }) },
  { pack: 'committees', json: 'committee_terms', dir: 'committee-terms', entity: 'Committees: Terms',
    record: (r) => ({ primaryKey: { ID: uuidFor('cterm', r.TermKey) }, fields: { CommitteeID: uuidFor('committee', r.CommitteeKey), Name: r.Name, StartDate: r.StartDate, EndDate: r.EndDate, Status: r.Status === 'Completed' ? 'Completed' : 'Active' } }) },
  { pack: 'committees', json: 'committee_memberships', dir: 'committee-memberships', entity: 'Committees: Memberships',
    record: (r) => ({ primaryKey: { ID: uuidFor('cmembership', r.MembershipKey) }, fields: { PersonID: uuidFor('person', r.MemberNumber), RoleID: uuidFor('crole', r.RoleKey), TermID: uuidFor('cterm', r.TermKey), StartDate: r.StartDate, EndDate: r.EndDate, Status: r.Status } }) },
  { pack: 'committees', json: 'committee_meetings', dir: 'committee-meetings', entity: 'Committees: Meetings',
    record: (r) => ({ primaryKey: { ID: uuidFor('meeting', r.MeetingKey) }, fields: { CommitteeID: uuidFor('committee', r.CommitteeKey), Name: r.Name, StartDateTime: r.StartDateTime, TimeZone: 'UTC', LocationType: r.LocationType, Status: r.Status } }) },
  { pack: 'committees', json: 'committee_attendance', dir: 'committee-attendance', entity: 'Committees: Attendances',
    record: (r) => ({ primaryKey: { ID: uuidFor('att', r.AttendanceKey) }, fields: { MeetingID: uuidFor('meeting', r.MeetingKey), PersonID: uuidFor('person', r.MemberNumber), AttendanceStatus: r.AttendanceStatus } }) },
  // forms pack → bizapps-forms entities (their prefix 'MJ_BizApps_Forms: ')
  { pack: 'forms', json: 'forms', dir: 'forms', entity: 'MJ_BizApps_Forms: Forms',
    record: (r) => ({ primaryKey: { ID: uuidFor('form', r.FormKey) }, fields: { Name: r.Name, Description: r.Description, Status: r.Status, RenderMode: r.RenderMode } }) },
  { pack: 'forms', json: 'form_versions', dir: 'form-versions', entity: 'MJ_BizApps_Forms: Form Versions',
    record: (r) => ({ primaryKey: { ID: uuidFor('formver', r.VersionKey) }, fields: { FormID: uuidFor('form', r.FormKey), VersionNumber: r.VersionNumber, Status: r.Status, PublishedAt: r.PublishedAt } }) },
  { pack: 'forms', json: 'form_pages', dir: 'form-pages', entity: 'MJ_BizApps_Forms: Form Pages',
    record: (r) => ({ primaryKey: { ID: uuidFor('formpage', r.PageKey) }, fields: { FormID: uuidFor('form', r.FormKey), Title: r.Title, DisplayOrder: r.DisplayOrder } }) },
  { pack: 'forms', json: 'form_questions', dir: 'form-questions', entity: 'MJ_BizApps_Forms: Form Questions',
    record: (r) => ({ primaryKey: { ID: uuidFor('formq', r.QuestionKey) }, fields: { FormID: uuidFor('form', r.FormKey), PageID: uuidFor('formpage', r.PageKey), QuestionType: r.QuestionType, Prompt: r.Prompt, IsRequired: r.IsRequired, DisplayOrder: r.DisplayOrder } }) },
  { pack: 'forms', json: 'form_distributions', dir: 'form-distributions', entity: 'MJ_BizApps_Forms: Form Distributions',
    record: (r) => ({ primaryKey: { ID: uuidFor('formdist', r.DistributionKey) }, fields: { FormID: uuidFor('form', r.FormKey), Name: r.Name, ChannelType: r.ChannelType, Status: r.Status, OpenAt: r.OpenAt, CloseAt: r.CloseAt, ResponseCount: r.ResponseCount, CaptchaRequired: false, IsActive: r.Status !== 'Closed' } }) },
  { pack: 'forms', json: 'form_responses', dir: 'form-responses', entity: 'MJ_BizApps_Forms: Form Responses',
    record: (r) => ({ primaryKey: { ID: uuidFor('formresp', r.ResponseKey) }, fields: { FormID: uuidFor('form', r.FormKey), FormVersionID: uuidFor('formver', r.VersionKey), Status: r.Status, RespondentPersonID: uuidFor('person', r.MemberNumber), SubmittedAt: r.SubmittedAt } }) },
  { pack: 'forms', json: 'form_answers', dir: 'form-answers', entity: 'MJ_BizApps_Forms: Form Response Answers',
    record: (r) => ({ primaryKey: { ID: uuidFor('formans', r.AnswerKey) }, fields: { ResponseID: uuidFor('formresp', r.ResponseKey), QuestionID: uuidFor('formq', r.QuestionKey), NumericValue: r.NumericValue ?? null, BooleanValue: r.BooleanValue ?? null } }) },
  {
    pack: 'events', json: 'events', dir: 'events', entity: 'MoreCheese: Events',
    record: (r) => ({
      primaryKey: { ID: uuidFor('event', r.EventKey) },
      fields: {
        EventKey: r.EventKey, Name: r.Name, EventType: r.EventType, EventDate: r.Date,
        IsVirtual: r.IsVirtual, IsPaid: r.IsPaid, City: r.City, State: r.State,
        Latitude: r.Latitude, Longitude: r.Longitude, IsSharedDemo: r.IsSharedDemo,
      },
    }),
  },
  {
    pack: 'events', json: 'event_registrations', dir: 'event-registrations', entity: 'MoreCheese: Event Registrations',
    record: (r) => ({
      primaryKey: { ID: uuidFor('reg', r.RegKey) },
      fields: {
        RegKey: r.RegKey, PersonID: uuidFor('person', r.MemberNumber), EventID: uuidFor('event', r.EventKey),
        RegisteredOn: r.RegisteredOn, Attended: r.Attended, IsSharedDemo: r.IsSharedDemo,
      },
    }),
  },
  {
    pack: 'learning', json: 'courses', dir: 'courses', entity: 'MoreCheese: Courses',
    record: (r) => ({
      primaryKey: { ID: uuidFor('course', r.CourseKey) },
      fields: { CourseKey: r.CourseKey, Name: r.Name, StartDate: r.StartDate, DurationWeeks: r.DurationWeeks, IsSharedDemo: r.IsSharedDemo },
    }),
  },
  {
    pack: 'learning', json: 'enrollments', dir: 'enrollments', entity: 'MoreCheese: Course Enrollments',
    record: (r) => ({
      primaryKey: { ID: uuidFor('enroll', r.EnrollKey) },
      fields: {
        EnrollKey: r.EnrollKey, PersonID: uuidFor('person', r.MemberNumber), CourseID: uuidFor('course', r.CourseKey),
        EnrolledOn: r.EnrolledOn, Status: r.Status, CompletedOn: r.CompletedOn, IsSharedDemo: r.IsSharedDemo,
      },
    }),
  },
  {
    pack: 'orders', json: 'products', dir: 'products', entity: 'MoreCheese: Products',
    record: (r) => ({
      primaryKey: { ID: uuidFor('product', r.ProductKey) },
      fields: { ProductKey: r.ProductKey, Name: r.Name, ProductType: r.ProductType, UnitPrice: r.UnitPrice, IsSharedDemo: r.IsSharedDemo },
    }),
  },
  {
    pack: 'orders', json: 'orders', dir: 'orders', entity: 'MoreCheese: Orders',
    record: (r) => ({
      primaryKey: { ID: uuidFor('order', r.OrderKey) },
      fields: {
        OrderKey: r.OrderKey, PersonID: uuidFor('person', r.MemberNumber), OrderType: r.OrderType, Status: r.Status,
        OrderDate: r.OrderDate, DueDate: r.DueDate, TotalGross: r.TotalGross, PaymentStatus: r.PaymentStatus, IsSharedDemo: r.IsSharedDemo,
      },
    }),
  },
  {
    pack: 'orders', json: 'order_lines', dir: 'order-lines', entity: 'MoreCheese: Order Lines',
    record: (r) => ({
      primaryKey: { ID: uuidFor('line', r.LineKey) },
      fields: {
        LineKey: r.LineKey, OrderID: uuidFor('order', r.OrderKey), ProductID: uuidFor('product', r.ProductKey),
        Quantity: r.Quantity, UnitPrice: r.UnitPrice, LineTotal: r.LineTotal, IsSharedDemo: r.IsSharedDemo,
      },
    }),
  },
  {
    pack: 'orders', json: 'payments', dir: 'payments', entity: 'MoreCheese: Payments',
    record: (r) => ({
      primaryKey: { ID: uuidFor('payment', r.PaymentKey) },
      fields: {
        PaymentKey: r.PaymentKey, OrderID: uuidFor('order', r.OrderKey), Amount: r.Amount,
        PaymentDate: r.PaymentDate, Method: r.Method, Status: r.Status, IsSharedDemo: r.IsSharedDemo,
      },
    }),
  },
];

// ---------- emit the tree ----------
// --metadata-out targets any dir (default: disposable out/metadata/). We do NOT wipe the
// whole target — only our own entity folders (below) — so pointing this at a shared
// metadata/ tree can't delete a sibling like schema-info/.
const ROOT = args['metadata-out'] ? resolve(args['metadata-out']) : join(OUT, 'metadata');
mkdirSync(ROOT, { recursive: true });

writeFileSync(join(ROOT, '.mj-sync.json'), JSON.stringify({
  version: '1.0.0',
  push: { autoCreateMissingRecords: true },
  directoryOrder: MAPPING.map((m) => m.dir), // the pack pyramid: parents before children
}, null, 2));

writeFileSync(join(ROOT, 'README.md'), [
  '# Generated mj-sync metadata (datagen)',
  '',
  `Generated by \`datagen/emit-mjsync.mjs\` · seed ${run.seed} · release ${run.releaseDate} · ruleset v${run.ruleset}.`,
  'Deterministic: same seed + release regenerates this tree byte-identically; primary keys are',
  'pinned (uuidv5 of business keys), so `mj sync push` upserts the same rows every time.',
  '',
  '⚠ Entity names are ASSUMED until the schema reconciliation + CodeGen — verify before pushing.',
  '⚠ `mj sync push` is a full reconcile: it can DELETE rows not present in these files. Dev DBs only.',
].join('\n'));

const summary = [];
for (const m of MAPPING) {
  const dir = join(ROOT, m.dir);
  rmSync(dir, { recursive: true, force: true }); // clear only OUR entity dir — never siblings
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, '.mj-sync.json'), JSON.stringify({ entity: m.entity, filePattern: '**/.*.json' }, null, 2));
  const rows = load(m.pack, m.json).map(m.record);
  const chunks = [];
  for (let i = 0; i < rows.length; i += CHUNK) chunks.push(rows.slice(i, i + CHUNK));
  chunks.forEach((chunk, i) => {
    const name = chunks.length === 1 ? `.${m.dir}.json` : `.${m.dir}.part-${String(i + 1).padStart(2, '0')}.json`;
    writeFileSync(join(dir, name), JSON.stringify(chunk, null, 1));
  });
  summary.push({ dir: m.dir, entity: m.entity, rows: rows.length, files: chunks.length });
}

for (const s of summary) console.log(`${s.dir.padEnd(22)} → "${s.entity}"  ${String(s.rows).padStart(6)} records in ${s.files} file(s)`);
console.log(`metadata tree → ${ROOT}`);
