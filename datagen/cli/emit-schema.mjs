// SCHEMA emitter: provisional CREATE SCHEMA + CREATE TABLE DDL for STANDALONE demo DBs.
// Usage: node emit-schema.mjs [--out out]   → out/sql/00_schema.sql (run before the seed packs)
//
// ⚠ THIS IS NOT THE RECONCILIATION. Table/column shapes here are the generator's ASSUMED
//   shapes — the same ones emit-sql's INSERTs target. They exist so you can stand up a
//   throwaway SQL Server demo database WITHOUT waiting on Marcelo's authoritative migrations
//   (which own the real shapes and ship to consumers). When those land, delete this file's
//   output and load the seed packs into the real tables instead.
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
const SCHEMAS = ['__mj_BizAppsCommon', 'morecheese_members', 'morecheese_events', 'morecheese_learning', 'morecheese_orders'];
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

mkdirSync(join(OUT, 'sql'), { recursive: true });
writeFileSync(join(OUT, 'sql', '00_schema.sql'), lines.join('\n'));
for (const t of TABLES) console.log(`[${t.schema}].[${t.table}]`.padEnd(46) + ` ${t.cols.length} columns`);
console.log(`schema DDL → ${join(OUT, 'sql', '00_schema.sql')}`);
