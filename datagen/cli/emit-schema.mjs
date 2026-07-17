// SCHEMA emitter: provisional CREATE SCHEMA + CREATE TABLE DDL for STANDALONE demo DBs.
// Usage: node emit-schema.mjs [--out out]   → out/sql/00_schema.sql (run before the seed packs)
//
// ⚠ DEV SHIM — NEVER SHIPS. Since 2026-07-14 the morecheese_* shapes are OWNED by the
//   frozen baseline migration (migrations/B202607141200__v1.0.0_MoreCheese_Baseline.sql);
//   the bizapps stand-ins remain playground conveniences (a genuine app install wins the
//   IF-guards). This file exists only to stand up throwaway demo databases without doing
//   full app installs. A suite drift-guard asserts these shapes still match the migration —
//   any new morecheese table added here requires a new hand-authored V* migration.
//
// Deliberately omits everything CodeGen/MJ owns: no __mj_* audit columns, no MJ entity
// registration. Column names + nullability are kept in lockstep with emit-sql's MAPPING by
// the drift guard in test.mjs (DDL columns must be a superset of every INSERT's columns).

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const args = Object.fromEntries(process.argv.slice(2).map((a, i, all) => (a.startsWith('--') ? [a.slice(2), all[i + 1]] : null)).filter(Boolean));
const ROOT = join(HERE, '..');
const OUT = join(ROOT, args.out ?? 'out');
const run = JSON.parse(readFileSync(join(OUT, 'run.json'), 'utf8'));

// type shorthands (SQL Server) — match the value families emit-sql formats
const UID = 'UNIQUEIDENTIFIER';
const s = (n) => `NVARCHAR(${n})`;
const GEO = 'DECIMAL(9,6)';   // latitude/longitude
const MONEY = 'DECIMAL(10,2)'; // dues / prices / amounts
const INT = 'INT';
const BIT = 'BIT';
const DATE = 'DATE';

// col(name, type, {null, pk, fk:'[schema].[Table]'}) — order matches emit-sql's INSERT columns
const c = (name, type, opt = {}) => ({ name, type, nullable: !!opt.null, pk: !!opt.pk, fk: opt.fk ?? null });

// The tables in DEPENDENCY order (a referenced table is created before its referencer), so
// the FK constraints resolve in a single top-to-bottom run.
// __mj_BizAppsCommon is a STAND-IN: IF-guarded, real column shapes (copied from
// bizapps-common migrations/B202602271452) — when the real app is installed first, the
// guards skip and our INSERTs land in the genuine tables.
const SCHEMAS = ['__mj_BizAppsCommon', '__mj_BizAppsCommittees', '__mj_BizAppsForms', '__mj_BizAppsTasks', '__mj_BizAppsIssues', 'morecheese_members', 'morecheese_events', 'morecheese_learning', 'morecheese_orders'];
const TABLES = [
  // bizapps-common stand-ins — REAL shapes (B202602271452), minus their FKs to tables we
  // don't stand in (__mj.User, OrganizationType); columns we don't fill stay nullable
  { schema: '__mj_BizAppsCommon', table: 'Organization', cols: [
    c('ID', UID, { pk: true }), c('Name', s(255)), c('LegalName', s(255), { null: true }),
    c('OrganizationTypeID', UID, { null: true }), c('ParentID', UID, { null: true }),
    c('Website', s(1000), { null: true }), c('LogoURL', s(1000), { null: true }), c('Description', 'NVARCHAR(MAX)', { null: true }),
    c('Email', s(255), { null: true }), c('Phone', s(50), { null: true }), c('FoundedDate', DATE, { null: true }),
    c('TaxID', s(50), { null: true }), c('Status', s(50)),
  ] },
  { schema: '__mj_BizAppsCommon', table: 'Person', cols: [
    c('ID', UID, { pk: true }), c('FirstName', s(100)), c('LastName', s(100)),
    c('MiddleName', s(100), { null: true }), c('Prefix', s(20), { null: true }), c('Suffix', s(20), { null: true }),
    c('PreferredName', s(100), { null: true }), c('Title', s(200), { null: true }), c('Email', s(255), { null: true }),
    c('Phone', s(50), { null: true }), c('DateOfBirth', DATE, { null: true }), c('Gender', s(50), { null: true }),
    c('PhotoURL', s(1000), { null: true }), c('Bio', 'NVARCHAR(MAX)', { null: true }),
    c('LinkedUserID', UID, { null: true }), c('Status', s(50)),
  ] },
  { schema: '__mj_BizAppsCommon', table: 'RelationshipType', cols: [
    c('ID', UID, { pk: true }), c('Name', s(100)), c('Description', 'NVARCHAR(MAX)', { null: true }),
    c('Category', s(50)), c('IsDirectional', BIT), c('ForwardLabel', s(100), { null: true }),
    c('ReverseLabel', s(100), { null: true }), c('IsActive', BIT),
  ] },
  { schema: '__mj_BizAppsCommon', table: 'Relationship', cols: [
    c('ID', UID, { pk: true }), c('RelationshipTypeID', UID, { fk: '[__mj_BizAppsCommon].[RelationshipType]' }),
    c('FromPersonID', UID, { null: true, fk: '[__mj_BizAppsCommon].[Person]' }),
    c('FromOrganizationID', UID, { null: true, fk: '[__mj_BizAppsCommon].[Organization]' }),
    c('ToPersonID', UID, { null: true }), c('ToOrganizationID', UID, { null: true }),
    c('Title', s(255), { null: true }), c('StartDate', DATE, { null: true }), c('EndDate', DATE, { null: true }),
    c('Status', s(50)), c('Notes', 'NVARCHAR(MAX)', { null: true }),
  ] },
  // bizapps-tasks stand-ins (B202604011500) — polymorphic entity refs are plain columns here
  { schema: '__mj_BizAppsTasks', table: 'TaskType', cols: [
    c('ID', UID, { pk: true }), c('Name', s(100)), c('Description', 'NVARCHAR(MAX)', { null: true }),
    c('DefaultPriority', s(20)), c('IsActive', BIT),
  ] },
  { schema: '__mj_BizAppsTasks', table: 'Task', cols: [
    c('ID', UID, { pk: true }), c('Name', s(255)), c('TypeID', UID, { fk: '[__mj_BizAppsTasks].[TaskType]' }),
    c('Status', s(50)), c('Priority', s(20)), c('DueAt', 'DATETIMEOFFSET', { null: true }),
    c('CompletedAt', 'DATETIMEOFFSET', { null: true }), c('PercentComplete', INT),
    c('CreatedByPersonID', UID, { null: true, fk: '[__mj_BizAppsCommon].[Person]' }),
  ] },
  { schema: '__mj_BizAppsTasks', table: 'TaskAssignment', cols: [
    c('ID', UID, { pk: true }), c('TaskID', UID, { fk: '[__mj_BizAppsTasks].[Task]' }),
    c('AssigneeEntityID', UID), c('AssigneeRecordID', s(450)), c('Status', s(50)),
  ] },
  { schema: '__mj_BizAppsTasks', table: 'TaskLink', cols: [
    c('ID', UID, { pk: true }), c('TaskID', UID, { fk: '[__mj_BizAppsTasks].[Task]' }),
    c('EntityID', UID), c('RecordID', s(450)),
  ] },
  // bizapps-issues stand-ins (B202606091000)
  { schema: '__mj_BizAppsIssues', table: 'IssueType', cols: [
    c('ID', UID, { pk: true }), c('Name', s(100)), c('Description', 'NVARCHAR(MAX)', { null: true }),
    c('DefaultPriority', s(20)), c('IsActive', BIT),
  ] },
  { schema: '__mj_BizAppsIssues', table: 'IssueStatus', cols: [
    c('ID', UID, { pk: true }), c('Name', s(100)), c('Sequence', INT), c('IsDefault', BIT),
    c('IsTerminal', BIT), c('ColorCode', s(20), { null: true }),
  ] },
  { schema: '__mj_BizAppsIssues', table: 'Issue', cols: [
    c('ID', UID, { pk: true }), c('IssueNumber', s(50), { null: true }), c('Title', s(500)),
    c('IssueTypeID', UID, { fk: '[__mj_BizAppsIssues].[IssueType]' }),
    c('StatusID', UID, { fk: '[__mj_BizAppsIssues].[IssueStatus]' }),
    c('Severity', s(20)), c('Priority', s(20)),
    c('ReporterPersonID', UID, { null: true, fk: '[__mj_BizAppsCommon].[Person]' }),
    c('SourceEntityID', UID, { null: true }), c('SourceRecordID', s(450), { null: true }),
    c('ResolvedAt', 'DATETIMEOFFSET', { null: true }), c('ClosedAt', 'DATETIMEOFFSET', { null: true }),
  ] },
  { schema: '__mj_BizAppsIssues', table: 'IssueNumberSequence', cols: [
    c('ScopeCode', s(50), { pk: true }), c('NextSequenceNumber', INT),
  ] },
  // OUR extension profiles (memo §2.3 shape convention) — member/org-specific fields,
  // hard FKs into the dependency schema (Marcelo's linking ruling)
  { schema: 'morecheese_members', table: 'OrganizationProfile', cols: [
    c('ID', UID, { pk: true }), c('OrganizationID', UID, { fk: '[__mj_BizAppsCommon].[Organization]' }),
    c('OrgKey', s(50)), c('Type', s(50)), c('Region', s(50)), c('City', s(100)), c('State', s(50)),
    c('Latitude', GEO), c('Longitude', GEO),
    c('LifecycleEventKind', s(50), { null: true }), c('LifecycleEventYear', INT, { null: true }), c('IsSharedDemo', BIT),
  ] },
  { schema: 'morecheese_members', table: 'MemberProfile', cols: [
    c('ID', UID, { pk: true }), c('PersonID', UID, { fk: '[__mj_BizAppsCommon].[Person]' }),
    c('OrganizationID', UID, { null: true, fk: '[__mj_BizAppsCommon].[Organization]' }),
    c('MemberNumber', s(50)), c('Segment', s(50)), c('Region', s(50)), c('City', s(100)), c('State', s(50)),
    c('Latitude', GEO), c('Longitude', GEO), c('JoinDate', DATE), c('IsSharedDemo', BIT),
  ] },
  // bizapps-committees stand-ins (B202602151200) — same IF-guard convention
  { schema: '__mj_BizAppsCommittees', table: 'Type', cols: [
    c('ID', UID, { pk: true }), c('Name', s(100)), c('Description', 'NVARCHAR(MAX)', { null: true }),
    c('IsStandards', BIT), c('DefaultTermMonths', INT, { null: true }),
  ] },
  { schema: '__mj_BizAppsCommittees', table: 'Role', cols: [
    c('ID', UID, { pk: true }), c('Name', s(100)), c('Description', 'NVARCHAR(MAX)', { null: true }),
    c('IsOfficer', BIT), c('IsVotingRole', BIT), c('Sequence', INT),
  ] },
  { schema: '__mj_BizAppsCommittees', table: 'Committee', cols: [
    c('ID', UID, { pk: true }), c('Name', s(255)), c('Description', 'NVARCHAR(MAX)', { null: true }),
    c('TypeID', UID, { fk: '[__mj_BizAppsCommittees].[Type]' }), c('MissionStatement', 'NVARCHAR(MAX)', { null: true }),
    c('Status', s(50)), c('IsPublic', BIT), c('FormationDate', DATE, { null: true }),
  ] },
  { schema: '__mj_BizAppsCommittees', table: 'Term', cols: [
    c('ID', UID, { pk: true }), c('CommitteeID', UID, { fk: '[__mj_BizAppsCommittees].[Committee]' }),
    c('Name', s(100)), c('StartDate', DATE), c('EndDate', DATE, { null: true }), c('Status', s(50)),
  ] },
  { schema: '__mj_BizAppsCommittees', table: 'Membership', cols: [
    c('ID', UID, { pk: true }), c('PersonID', UID, { fk: '[__mj_BizAppsCommon].[Person]' }),
    c('RoleID', UID, { fk: '[__mj_BizAppsCommittees].[Role]' }), c('TermID', UID, { fk: '[__mj_BizAppsCommittees].[Term]' }),
    c('StartDate', DATE), c('EndDate', DATE, { null: true }), c('Status', s(50)),
  ] },
  { schema: '__mj_BizAppsCommittees', table: 'Meeting', cols: [
    c('ID', UID, { pk: true }), c('CommitteeID', UID, { fk: '[__mj_BizAppsCommittees].[Committee]' }),
    c('Name', s(255)), c('StartDateTime', 'DATETIMEOFFSET'), c('TimeZone', s(50)),
    c('LocationType', s(50)), c('Status', s(50)),
  ] },
  { schema: '__mj_BizAppsCommittees', table: 'Attendance', cols: [
    c('ID', UID, { pk: true }), c('MeetingID', UID, { fk: '[__mj_BizAppsCommittees].[Meeting]' }),
    c('PersonID', UID, { fk: '[__mj_BizAppsCommon].[Person]' }), c('AttendanceStatus', s(50)),
  ] },
  { schema: '__mj_BizAppsCommittees', table: 'AgendaItem', cols: [
    c('ID', UID, { pk: true }), c('MeetingID', UID, { fk: '[__mj_BizAppsCommittees].[Meeting]' }),
    c('Sequence', INT), c('Name', s(255)), c('PresenterPersonID', UID, { null: true, fk: '[__mj_BizAppsCommon].[Person]' }),
    c('DurationMinutes', INT, { null: true }), c('ItemType', s(50)), c('Status', s(50)),
  ] },
  { schema: '__mj_BizAppsCommittees', table: 'Motion', cols: [
    c('ID', UID, { pk: true }), c('MeetingID', UID, { null: true, fk: '[__mj_BizAppsCommittees].[Meeting]' }),
    c('AgendaItemID', UID, { null: true, fk: '[__mj_BizAppsCommittees].[AgendaItem]' }),
    c('Sequence', INT), c('Name', s(255)),
    c('MovedByMembershipID', UID, { null: true, fk: '[__mj_BizAppsCommittees].[Membership]' }),
    c('SecondedByMembershipID', UID, { null: true, fk: '[__mj_BizAppsCommittees].[Membership]' }),
    c('Result', s(50)), c('ResultSummary', s(255), { null: true }),
    c('YesCount', INT, { null: true }), c('NoCount', INT, { null: true }), c('AbstainCount', INT, { null: true }),
  ] },
  { schema: '__mj_BizAppsCommittees', table: 'Vote', cols: [
    c('ID', UID, { pk: true }), c('MotionID', UID, { fk: '[__mj_BizAppsCommittees].[Motion]' }),
    c('MembershipID', UID, { fk: '[__mj_BizAppsCommittees].[Membership]' }), c('VoteValue', s(20)),
  ] },
  // bizapps-forms stand-ins (B202606281200) — the D10 optional pack
  { schema: '__mj_BizAppsForms', table: 'Form', cols: [
    c('ID', UID, { pk: true }), c('Name', s(255)), c('Description', 'NVARCHAR(MAX)', { null: true }),
    c('Status', s(20)), c('RenderMode', s(20)),
  ] },
  { schema: '__mj_BizAppsForms', table: 'FormVersion', cols: [
    c('ID', UID, { pk: true }), c('FormID', UID, { fk: '[__mj_BizAppsForms].[Form]' }),
    c('VersionNumber', INT), c('Status', s(20)), c('PublishedAt', 'DATETIMEOFFSET', { null: true }),
  ] },
  { schema: '__mj_BizAppsForms', table: 'FormPage', cols: [
    c('ID', UID, { pk: true }), c('FormID', UID, { fk: '[__mj_BizAppsForms].[Form]' }),
    c('Title', s(255), { null: true }), c('DisplayOrder', INT),
  ] },
  { schema: '__mj_BizAppsForms', table: 'FormQuestion', cols: [
    c('ID', UID, { pk: true }), c('FormID', UID, { fk: '[__mj_BizAppsForms].[Form]' }),
    c('PageID', UID, { null: true, fk: '[__mj_BizAppsForms].[FormPage]' }),
    c('QuestionType', s(50)), c('Prompt', 'NVARCHAR(MAX)'), c('IsRequired', BIT), c('DisplayOrder', INT),
  ] },
  { schema: '__mj_BizAppsForms', table: 'FormDistribution', cols: [
    c('ID', UID, { pk: true }), c('FormID', UID, { fk: '[__mj_BizAppsForms].[Form]' }),
    c('Name', s(255)), c('ChannelType', s(20)), c('Status', s(20)),
    c('OpenAt', 'DATETIMEOFFSET', { null: true }), c('CloseAt', 'DATETIMEOFFSET', { null: true }),
    c('MaxResponses', INT, { null: true }), c('ResponseCount', INT), c('CaptchaRequired', BIT), c('IsActive', BIT),
  ] },
  { schema: '__mj_BizAppsForms', table: 'FormResponse', cols: [
    c('ID', UID, { pk: true }), c('FormID', UID, { fk: '[__mj_BizAppsForms].[Form]' }),
    c('FormVersionID', UID, { fk: '[__mj_BizAppsForms].[FormVersion]' }), c('Status', s(20)),
    c('RespondentPersonID', UID, { null: true, fk: '[__mj_BizAppsCommon].[Person]' }), c('SubmittedAt', 'DATETIMEOFFSET', { null: true }),
  ] },
  { schema: '__mj_BizAppsForms', table: 'FormResponseAnswer', cols: [
    c('ID', UID, { pk: true }), c('ResponseID', UID, { fk: '[__mj_BizAppsForms].[FormResponse]' }),
    c('QuestionID', UID, { fk: '[__mj_BizAppsForms].[FormQuestion]' }),
    c('NumericValue', 'DECIMAL(18,4)', { null: true }), c('BooleanValue', BIT, { null: true }),
  ] },
  { schema: 'morecheese_learning', table: 'Certification', cols: [
    c('ID', UID, { pk: true }), c('CertKey', s(50)), c('Name', s(200)), c('Description', 'NVARCHAR(MAX)', { null: true }), c('ValidYears', INT), c('IsSharedDemo', BIT),
  ] },
  { schema: 'morecheese_learning', table: 'MemberCertification', cols: [
    c('ID', UID, { pk: true }), c('MemberCertKey', s(80)), c('PersonID', UID, { fk: '[__mj_BizAppsCommon].[Person]' }),
    c('CertificationID', UID, { fk: '[morecheese_learning].[Certification]' }), c('Status', s(50)),
    c('EnrolledOn', DATE), c('AwardedOn', DATE, { null: true }), c('ExpiresOn', DATE, { null: true }), c('IsSharedDemo', BIT),
  ] },
  { schema: 'morecheese_events', table: 'CompetitionEntry', cols: [
    c('ID', UID, { pk: true }), c('EntryKey', s(80)), c('PersonID', UID, { fk: '[__mj_BizAppsCommon].[Person]' }),
    c('OrganizationID', UID, { null: true, fk: '[__mj_BizAppsCommon].[Organization]' }),
    c('EntryYear', INT), c('Category', s(100)), c('ProductName', s(200)), c('Result', s(50)), c('IsSharedDemo', BIT),
  ] },
  { schema: 'morecheese_members', table: 'AdvocacyAction', cols: [
    c('ID', UID, { pk: true }), c('ActionKey', s(80)), c('PersonID', UID, { fk: '[__mj_BizAppsCommon].[Person]' }),
    c('ActionDate', DATE), c('Kind', s(50)), c('Topic', s(200)), c('IsSharedDemo', BIT),
  ] },
  { schema: 'morecheese_events', table: 'Event', cols: [
    c('ID', UID, { pk: true }), c('EventKey', s(50)), c('Name', s(200)), c('EventType', s(50)), c('EventDate', DATE),
    c('IsVirtual', BIT), c('IsPaid', BIT), c('City', s(100), { null: true }), c('State', s(50), { null: true }),
    c('Latitude', GEO, { null: true }), c('Longitude', GEO, { null: true }), c('IsSharedDemo', BIT),
  ] },
  { schema: 'morecheese_members', table: 'MembershipPeriod', cols: [
    c('ID', UID, { pk: true }), c('PeriodKey', s(60)), c('PersonID', UID, { fk: '[__mj_BizAppsCommon].[Person]' }),
    c('MembershipTier', s(50)), c('DuesAmount', MONEY), c('StartDate', DATE), c('EndDate', DATE), c('RenewalDate', DATE),
    c('Status', s(50)), c('CancellationDate', DATE, { null: true }), c('CancellationReason', s(200), { null: true }),
    c('AutoRenew', BIT), c('IsSharedDemo', BIT),
  ] },
  { schema: 'morecheese_events', table: 'EventRegistration', cols: [
    c('ID', UID, { pk: true }), c('RegKey', s(120)), c('PersonID', UID, { fk: '[__mj_BizAppsCommon].[Person]' }),
    c('EventID', UID, { fk: '[morecheese_events].[Event]' }), c('RegisteredOn', DATE), c('Attended', BIT, { null: true }), c('IsSharedDemo', BIT),
  ] },
  { schema: 'morecheese_learning', table: 'Course', cols: [
    c('ID', UID, { pk: true }), c('CourseKey', s(50)), c('Name', s(200)), c('StartDate', DATE), c('DurationWeeks', INT), c('IsSharedDemo', BIT),
  ] },
  { schema: 'morecheese_learning', table: 'CourseEnrollment', cols: [
    c('ID', UID, { pk: true }), c('EnrollKey', s(80)), c('PersonID', UID, { fk: '[__mj_BizAppsCommon].[Person]' }),
    c('CourseID', UID, { fk: '[morecheese_learning].[Course]' }), c('EnrolledOn', DATE), c('Status', s(50)), c('CompletedOn', DATE, { null: true }), c('IsSharedDemo', BIT),
  ] },
  { schema: 'morecheese_orders', table: 'Product', cols: [
    c('ID', UID, { pk: true }), c('ProductKey', s(50)), c('Name', s(200)), c('ProductType', s(50)), c('UnitPrice', MONEY), c('IsSharedDemo', BIT),
  ] },
  { schema: 'morecheese_orders', table: 'Order', cols: [
    c('ID', UID, { pk: true }), c('OrderKey', s(50)), c('PersonID', UID, { fk: '[__mj_BizAppsCommon].[Person]' }),
    c('OrderType', s(50)), c('Status', s(50)), c('OrderDate', DATE), c('DueDate', DATE), c('TotalGross', MONEY), c('PaymentStatus', s(50)), c('IsSharedDemo', BIT),
  ] },
  { schema: 'morecheese_orders', table: 'OrderLine', cols: [
    c('ID', UID, { pk: true }), c('OrderID', UID, { fk: '[morecheese_orders].[Order]' }), c('ProductID', UID, { fk: '[morecheese_orders].[Product]' }),
    c('Quantity', INT), c('UnitPrice', MONEY), c('LineTotal', MONEY), c('IsSharedDemo', BIT),
  ] },
  { schema: 'morecheese_orders', table: 'Payment', cols: [
    c('ID', UID, { pk: true }), c('OrderID', UID, { fk: '[morecheese_orders].[Order]' }), c('Amount', MONEY),
    c('PaymentDate', DATE), c('Method', s(50)), c('Status', s(50)), c('IsSharedDemo', BIT),
  ] },
];

const lines = [
  '-- MoreCheese demo — PROVISIONAL schema (assumed shapes) for standalone demo databases.',
  `-- Generated by datagen/cli/emit-schema.mjs · seed ${run.seed} · release ${run.releaseDate} · ruleset v${run.ruleset}`,
  '-- ⚠ NOT the reconciliation. Run this FIRST, then the numbered seed packs (01_common.sql … ).',
  '--   When Marcelo\'s authoritative migrations land, discard this and load the packs into the real tables.',
  '-- No __mj_* audit columns (CodeGen owns those).',
  '',
  'SET XACT_ABORT ON;',
  '',
  '-- schemas',
];
for (const sch of SCHEMAS) lines.push(`IF SCHEMA_ID('${sch}') IS NULL EXEC('CREATE SCHEMA [${sch}]');`);
lines.push('');

for (const t of TABLES) {
  const full = `[${t.schema}].[${t.table}]`;
  lines.push(`-- ${full}`);
  lines.push(`IF OBJECT_ID('${t.schema}.${t.table}') IS NULL`);
  lines.push('CREATE TABLE ' + full + ' (');
  const defs = t.cols.map((col) => {
    let d = `  [${col.name}] ${col.type} ${col.nullable ? 'NULL' : 'NOT NULL'}`;
    if (col.pk) d += ' CONSTRAINT [PK_' + t.table + '] PRIMARY KEY';
    return d;
  });
  for (const col of t.cols.filter((x) => x.fk)) {
    const ref = col.fk;
    defs.push(`  CONSTRAINT [FK_${t.table}_${col.name}] FOREIGN KEY ([${col.name}]) REFERENCES ${ref} ([ID])`);
  }
  lines.push(defs.join(',\n'));
  lines.push(');');
  lines.push('');
}


// bizapps-common's own RelationshipType seeds (their pinned IDs, from their metadata) —
// stand-in playgrounds need them as FK targets; IF NOT EXISTS keeps this inert on genuine installs
const REL_TYPE_SEEDS = [
  ['FEB33819-FC85-4309-B1EC-A54EEA91DACF', 'Spouse', 'PersonToPerson', 'is spouse of', 'is spouse of'],
  ['431DBAF3-AC1D-47E6-B91E-264E8C76FC57', 'Parent / Child', 'PersonToPerson', 'is parent of', 'is child of'],
  ['D471B007-0717-493E-AC0D-2F102A32BCC2', 'Sibling', 'PersonToPerson', 'is sibling of', 'is sibling of'],
  ['6A17A929-8B23-4D73-9DF9-A368E7C1C1B9', 'Friend', 'PersonToPerson', 'is friend of', 'is friend of'],
  ['27CFD031-5663-4000-A7AB-8AC87DB88C1D', 'Employee', 'PersonToOrganization', 'is employee of', 'employs'],
  ['2FE33D05-5FD0-4076-8EF2-A30A640651B4', 'Board Member', 'PersonToOrganization', 'is board member of', 'has board member'],
  ['5B8C871C-025B-410A-9D44-4D30C76534C7', 'Member', 'PersonToOrganization', 'is member of', 'has member'],
  ['DF72DDBB-A829-41AC-8698-01FCCD21FEEF', 'Volunteer', 'PersonToOrganization', 'volunteers for', 'has volunteer'],
  ['DC06CB0C-A6CE-437C-A19E-F615F949BC51', 'Customer', 'PersonToOrganization', 'is customer of', 'has customer'],
  ['6BF6959D-18B4-4615-AFCE-643963A87C1B', 'Consultant', 'PersonToOrganization', 'consults for', 'has consultant'],
  ['39373681-5C70-4845-896B-4BFE4343751F', 'Subsidiary', 'OrganizationToOrganization', 'is subsidiary of', 'has subsidiary'],
  ['CA9BBDBE-3595-4C3F-80FF-DA78D3389EA7', 'Partner', 'OrganizationToOrganization', 'is partner of', 'is partner of'],
  ['190A8BBF-771E-4631-980A-84918311E5EC', 'Vendor', 'OrganizationToOrganization', 'is vendor to', 'has vendor'],
  ['2DBA78A6-DF6F-4A7E-B126-AE038BD3B6BA', 'Affiliate', 'OrganizationToOrganization', 'is affiliate of', 'is affiliate of'],
];
lines.push("-- bizapps-common's RelationshipType seeds (their pinned IDs) — playground FK targets; inert on genuine installs");
for (const [id, name, cat, fwd, rev] of REL_TYPE_SEEDS) {
  lines.push(`IF NOT EXISTS (SELECT 1 FROM [__mj_BizAppsCommon].[RelationshipType] WHERE ID = '${id}')`);
  lines.push(`INSERT INTO [__mj_BizAppsCommon].[RelationshipType] (ID, Name, Category, IsDirectional, ForwardLabel, ReverseLabel, IsActive) VALUES ('${id}', N'${name}', N'${cat}', 1, N'${fwd}', N'${rev}', 1);`);
}
// playground seeds for APP-OWNED lookups our data references by name (real installs ship
// their own — the name guards keep this inert there; integration finding F6)
const LOOKUP_SEEDS = [
  ['[__mj_BizAppsCommittees].[Role]', '(ID, Name, IsOfficer, IsVotingRole, Sequence)', [
    ["'FF49949F-D6EE-5D20-858D-B6606DAF070A'", "N'Chair'", 1, 1, 1],
    ["'9C9BB0CE-0144-5F75-97C3-6C8463C08B51'", "N'Vice Chair'", 1, 1, 2],
    ["'271A996D-04DB-5977-9296-1CA0FB679147'", "N'Member'", 0, 1, 100],
  ]],
  ['[__mj_BizAppsIssues].[IssueStatus]', '(ID, Name, Sequence, IsDefault, IsTerminal)', [
    ["'FD5D7CB0-76D3-5071-83A2-84956BC40C04'", "N'New'", 10, 1, 0],
    ["'D475F44D-87C0-5096-A63E-6F246D6CB736'", "N'In Progress'", 20, 0, 0],
    ["'9F669D60-DF28-5B86-A7EB-421AA3293183'", "N'Resolved'", 30, 0, 1],
    ["'06EB4A32-7F06-504C-A3C0-9F1DF0098CA3'", "N'Closed'", 40, 0, 1],
  ]],
];
lines.push('-- app-owned lookup seeds for STANDALONE playgrounds (name-guarded; real installs ship their own — F6)');
for (const [table, cols, rows] of LOOKUP_SEEDS) {
  for (const row of rows) {
    lines.push(`IF NOT EXISTS (SELECT 1 FROM ${table} WHERE Name = ${row[1]})`);
    lines.push(`INSERT INTO ${table} ${cols} VALUES (${row.join(', ')});`);
  }
}
lines.push('');

lines.push('');

mkdirSync(join(OUT, 'sql'), { recursive: true });
writeFileSync(join(OUT, 'sql', '00_schema.sql'), lines.join('\n'));
for (const t of TABLES) console.log(`[${t.schema}].[${t.table}]`.padEnd(46) + ` ${t.cols.length} columns`);
console.log(`schema DDL → ${join(OUT, 'sql', '00_schema.sql')}`);
