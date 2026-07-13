// SQL emitter: converts the JSON packs into SQL Server seed scripts.
// Usage: node emit-sql.mjs [--out out]   (run build.mjs first) → out/sql/*.sql
//
// The key conversion (spec §4): every row gets a REAL, deterministic UUID derived from its
// business key — uuidv5("person:ICF-100217") — so the same entity has the same ID in every
// release (minimal seed-migration diffs), and foreign keys are derived independently by
// parent and child (referential integrity by construction, no lookup fragility). Business
// keys stay on the rows as the human handle; UUIDs are plumbing.
//
// ⚠ TABLE/COLUMN NAMES ARE ASSUMED SHAPES — but informed ones (2026-07-10): the cheese
// tables follow our schema proposal, and MembershipPeriod is confirmed as the July-31
// SHIPPING shape because bizapps-orders (the eventual home: Subscription + renewal Orders,
// schema __mj_BizAppsOrders) is pre-implementation. When that app lands, this emitter gains
// a second target: period rows → Subscription/Order/Payment/SubscriptionEvent rows.
// Never emit __mj_* audit columns (CodeGen owns those).

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { uuidFor } from '../engine/ids.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const args = Object.fromEntries(process.argv.slice(2).map((a, i, all) => (a.startsWith('--') ? [a.slice(2), all[i + 1]] : null)).filter(Boolean));
const ROOT = join(HERE, '..');
const OUT = join(ROOT, args.out ?? 'out');
const load = (pack, table) => JSON.parse(readFileSync(join(OUT, 'packs', pack, `${table}.json`), 'utf8'));
const run = JSON.parse(readFileSync(join(OUT, 'run.json'), 'utf8'));

// ---------- SQL value formatting ----------
const sqlStr = (v) => v == null ? 'NULL' : `N'${String(v).replace(/'/g, "''")}'`;
const sqlNum = (v) => v == null ? 'NULL' : String(v);
const sqlBit = (v) => v == null ? 'NULL' : v ? '1' : '0';
const sqlDate = (v) => v == null ? 'NULL' : `'${v}'`;
const sqlId = (v) => v == null ? 'NULL' : `'${v}'`;

// ---------- the mapping: JSON pack tables → SQL tables (ASSUMED shapes) ----------
const MAPPING = {
  common: [
    {
      json: 'organizations', table: '[morecheese_common].[Organization]',
      columns: (r) => ({
        ID: sqlId(uuidFor('org', r.OrgKey)), OrgKey: sqlStr(r.OrgKey), Name: sqlStr(r.Name),
        Type: sqlStr(r.Type), Region: sqlStr(r.Region), City: sqlStr(r.City), State: sqlStr(r.State),
        Latitude: sqlNum(r.Latitude), Longitude: sqlNum(r.Longitude),
        LifecycleEventKind: sqlStr(r.LifecycleEvent?.kind ?? null), LifecycleEventYear: sqlNum(r.LifecycleEvent?.year ?? null),
        IsSharedDemo: sqlBit(r.IsSharedDemo),
      }),
    },
    {
      json: 'people', table: '[morecheese_common].[Person]',
      columns: (r) => ({
        ID: sqlId(uuidFor('person', r.MemberNumber)), MemberNumber: sqlStr(r.MemberNumber),
        FirstName: sqlStr(r.FirstName), LastName: sqlStr(r.LastName), Segment: sqlStr(r.Segment),
        Region: sqlStr(r.Region), City: sqlStr(r.City), State: sqlStr(r.State),
        Latitude: sqlNum(r.Latitude), Longitude: sqlNum(r.Longitude),
        OrganizationID: sqlId(r.OrgKey ? uuidFor('org', r.OrgKey) : null), // FK derived independently — no lookups
        JoinDate: sqlDate(r.JoinDate), IsSharedDemo: sqlBit(r.IsSharedDemo),
      }),
    },
  ],
  membership: [
    {
      json: 'membership_periods', table: '[morecheese_members].[MembershipPeriod]',
      columns: (r) => ({
        ID: sqlId(uuidFor('period', r.PeriodKey)), PeriodKey: sqlStr(r.PeriodKey),
        PersonID: sqlId(uuidFor('person', r.MemberNumber)),
        MembershipTier: sqlStr(r.MembershipTier), DuesAmount: sqlNum(r.DuesAmount),
        StartDate: sqlDate(r.StartDate), EndDate: sqlDate(r.EndDate), RenewalDate: sqlDate(r.RenewalDate),
        Status: sqlStr(r.Status), CancellationDate: sqlDate(r.CancellationDate), CancellationReason: sqlStr(r.CancellationReason),
        AutoRenew: sqlBit(r.AutoRenew), IsSharedDemo: sqlBit(r.IsSharedDemo),
      }),
    },
  ],
  learning: [
    {
      json: 'courses', table: '[morecheese_learning].[Course]',
      columns: (r) => ({
        ID: sqlId(uuidFor('course', r.CourseKey)), CourseKey: sqlStr(r.CourseKey), Name: sqlStr(r.Name),
        StartDate: sqlDate(r.StartDate), DurationWeeks: sqlNum(r.DurationWeeks), IsSharedDemo: sqlBit(r.IsSharedDemo),
      }),
    },
    {
      json: 'enrollments', table: '[morecheese_learning].[CourseEnrollment]',
      columns: (r) => ({
        ID: sqlId(uuidFor('enroll', r.EnrollKey)), EnrollKey: sqlStr(r.EnrollKey),
        PersonID: sqlId(uuidFor('person', r.MemberNumber)), CourseID: sqlId(uuidFor('course', r.CourseKey)),
        EnrolledOn: sqlDate(r.EnrolledOn), Status: sqlStr(r.Status), CompletedOn: sqlDate(r.CompletedOn),
        IsSharedDemo: sqlBit(r.IsSharedDemo),
      }),
    },
  ],
  orders: [
    {
      json: 'products', table: '[morecheese_orders].[Product]',
      columns: (r) => ({
        ID: sqlId(uuidFor('product', r.ProductKey)), ProductKey: sqlStr(r.ProductKey), Name: sqlStr(r.Name),
        ProductType: sqlStr(r.ProductType), UnitPrice: sqlNum(r.UnitPrice), IsSharedDemo: sqlBit(r.IsSharedDemo),
      }),
    },
    {
      json: 'orders', table: '[morecheese_orders].[Order]',
      columns: (r) => ({
        ID: sqlId(uuidFor('order', r.OrderKey)), OrderKey: sqlStr(r.OrderKey),
        PersonID: sqlId(uuidFor('person', r.MemberNumber)), OrderType: sqlStr(r.OrderType), Status: sqlStr(r.Status),
        OrderDate: sqlDate(r.OrderDate), DueDate: sqlDate(r.DueDate), TotalGross: sqlNum(r.TotalGross),
        PaymentStatus: sqlStr(r.PaymentStatus), IsSharedDemo: sqlBit(r.IsSharedDemo),
      }),
    },
    {
      json: 'order_lines', table: '[morecheese_orders].[OrderLine]',
      columns: (r) => ({
        ID: sqlId(uuidFor('line', r.LineKey)), OrderID: sqlId(uuidFor('order', r.OrderKey)),
        ProductID: sqlId(uuidFor('product', r.ProductKey)), Quantity: sqlNum(r.Quantity),
        UnitPrice: sqlNum(r.UnitPrice), LineTotal: sqlNum(r.LineTotal), IsSharedDemo: sqlBit(r.IsSharedDemo),
      }),
    },
    {
      json: 'payments', table: '[morecheese_orders].[Payment]',
      columns: (r) => ({
        ID: sqlId(uuidFor('payment', r.PaymentKey)), OrderID: sqlId(uuidFor('order', r.OrderKey)),
        Amount: sqlNum(r.Amount), PaymentDate: sqlDate(r.PaymentDate), Method: sqlStr(r.Method),
        Status: sqlStr(r.Status), IsSharedDemo: sqlBit(r.IsSharedDemo),
      }),
    },
  ],
  events: [
    {
      json: 'events', table: '[morecheese_events].[Event]',
      columns: (r) => ({
        ID: sqlId(uuidFor('event', r.EventKey)), EventKey: sqlStr(r.EventKey), Name: sqlStr(r.Name),
        EventType: sqlStr(r.EventType), EventDate: sqlDate(r.Date), IsVirtual: sqlBit(r.IsVirtual), IsPaid: sqlBit(r.IsPaid),
        City: sqlStr(r.City), State: sqlStr(r.State), Latitude: sqlNum(r.Latitude), Longitude: sqlNum(r.Longitude),
        IsSharedDemo: sqlBit(r.IsSharedDemo),
      }),
    },
    {
      json: 'event_registrations', table: '[morecheese_events].[EventRegistration]',
      columns: (r) => ({
        ID: sqlId(uuidFor('reg', r.RegKey)), RegKey: sqlStr(r.RegKey),
        PersonID: sqlId(uuidFor('person', r.MemberNumber)), EventID: sqlId(uuidFor('event', r.EventKey)),
        RegisteredOn: sqlDate(r.RegisteredOn), Attended: sqlBit(r.Attended), IsSharedDemo: sqlBit(r.IsSharedDemo),
      }),
    },
  ],
};

// ---------- emit: one .sql per pack, batched multi-row INSERTs, pack order = install order ----------
const BATCH = 500; // SQL Server allows 1000 rows per VALUES; stay comfortably under
const INSTALL_ORDER = ['common', 'membership', 'events', 'learning', 'orders']; // the pack pyramid
mkdirSync(join(OUT, 'sql'), { recursive: true });
const summary = [];
let packIndex = 0;
for (const pack of INSTALL_ORDER) {
  const tables = MAPPING[pack];
  packIndex++;
  const lines = [
    `-- MoreCheese demo seed — pack: ${pack} (install order ${packIndex})`,
    `-- Generated by datagen/emit-sql.mjs · seed ${run.seed} · release ${run.releaseDate} · ruleset v${run.ruleset}`,
    `-- Deterministic: same seed + release regenerates this file byte-identically.`,
    `-- ⚠ ASSUMED table/column names pending schema reconciliation (A1/A2). No __mj_* columns (CodeGen owns them).`,
    '',
  ];
  for (const t of tables) {
    const rows = load(pack, t.json);
    const cols = Object.keys(t.columns(rows[0]));
    lines.push(`-- ${t.table}: ${rows.length} rows`);
    for (let i = 0; i < rows.length; i += BATCH) {
      const batch = rows.slice(i, i + BATCH);
      lines.push(`INSERT INTO ${t.table} (${cols.map((c) => `[${c}]`).join(', ')})`);
      lines.push('VALUES');
      lines.push(batch.map((r) => `  (${Object.values(t.columns(r)).join(', ')})`).join(',\n') + ';');
      lines.push('');
    }
    summary.push({ pack, table: t.table, rows: rows.length });
  }
  writeFileSync(join(OUT, 'sql', `${String(packIndex).padStart(2, '0')}_${pack}.sql`), lines.join('\n'));
}
writeFileSync(join(OUT, 'sql', '_install-order.txt'),
  'Install packs in file order (the pack dependency pyramid — common first, always):\n' +
  INSTALL_ORDER.map((p, i) => `${String(i + 1).padStart(2, '0')}_${p}.sql`).join('\n') + '\n');

for (const s of summary) console.log(`${s.pack.padEnd(11)} ${s.table.padEnd(46)} ${String(s.rows).padStart(6)} rows`);
console.log(`sql → ${join(OUT, 'sql')}`);
