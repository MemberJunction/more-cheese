// mj-sync emitter: converts the JSON packs into an MJ metadata tree.
// Usage: node emit-mjsync.mjs [--out out]   (run build.mjs first) → out/metadata/…
//
// Format per docs/template-docs/metadata.md: root .mj-sync.json with directoryOrder
// (parents before children — the pack pyramid), one folder per ENTITY with its own
// .mj-sync.json, records as dot-prefixed JSON arrays. Every record pins its primaryKey
// with our deterministic UUID (lib/ids.mjs), so `mj sync push` is a stable upsert:
// re-push after a regeneration updates the same rows in place. FK fields carry literal
// pinned IDs (derived independently) — no @lookup needed.
//
// ⚠ ENTITY NAMES ARE ASSUMED pending the schema reconciliation + CodeGen run — verify
//   against entity_subclasses.ts before pointing a real sync at this. The common-pack
//   entities will actually belong to bizapps-common, not MoreCheese.
// ⚠ `mj sync push` is a FULL RECONCILE per entity scope — it can DELETE rows that exist
//   in the DB but not in these files. Dev databases only; never over real data.
//
// Output goes to out/metadata/ (inert), NOT the repo's live metadata/ folder.

import { readFileSync, writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { uuidFor } from './lib/ids.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const args = Object.fromEntries(process.argv.slice(2).map((a, i, all) => (a.startsWith('--') ? [a.slice(2), all[i + 1]] : null)).filter(Boolean));
const OUT = join(HERE, args.out ?? 'out');
const load = (pack, table) => JSON.parse(readFileSync(join(OUT, 'packs', pack, `${table}.json`), 'utf8'));
const run = JSON.parse(readFileSync(join(OUT, 'run.json'), 'utf8'));

const CHUNK = 5000; // records per file; big tables split across .part-N.json files

// ---------- mapping: pack table → entity folder (ASSUMED entity names) ----------
const MAPPING = [
  {
    pack: 'common', json: 'organizations', dir: 'organizations', entity: 'MoreCheese: Organizations',
    record: (r) => ({
      primaryKey: { ID: uuidFor('org', r.OrgKey) },
      fields: {
        OrgKey: r.OrgKey, Name: r.Name, Type: r.Type, Region: r.Region, City: r.City, State: r.State,
        Latitude: r.Latitude, Longitude: r.Longitude,
        LifecycleEventKind: r.LifecycleEvent?.kind ?? null, LifecycleEventYear: r.LifecycleEvent?.year ?? null,
        IsSharedDemo: r.IsSharedDemo,
      },
    }),
  },
  {
    pack: 'common', json: 'people', dir: 'people', entity: 'MoreCheese: People',
    record: (r) => ({
      primaryKey: { ID: uuidFor('person', r.MemberNumber) },
      fields: {
        MemberNumber: r.MemberNumber, FirstName: r.FirstName, LastName: r.LastName, Segment: r.Segment,
        Region: r.Region, City: r.City, State: r.State, Latitude: r.Latitude, Longitude: r.Longitude,
        OrganizationID: r.OrgKey ? uuidFor('org', r.OrgKey) : null,
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
const ROOT = join(OUT, 'metadata');
rmSync(ROOT, { recursive: true, force: true });
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
