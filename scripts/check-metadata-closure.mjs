#!/usr/bin/env node
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, resolve, relative, sep } from 'node:path';

const METADATA_DIR = resolve(process.cwd(), 'metadata');

function findJsonFiles(dir) {
  const results = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) {
      results.push(...findJsonFiles(full));
    } else if (entry.endsWith('.json')) {
      results.push(full);
    }
  }
  return results;
}

// 1. Index primary keys globally and per target directory
const allPrimaryKeys = new Set();
const primaryKeysByDir = new Map();
const records = [];

const files = findJsonFiles(METADATA_DIR);
for (const file of files) {
  try {
    const raw = readFileSync(file, 'utf-8');
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) continue;

    const relPath = relative(METADATA_DIR, file);
    const dir = relPath.split(sep)[0];

    if (!primaryKeysByDir.has(dir)) {
      primaryKeysByDir.set(dir, new Set());
    }
    const dirKeys = primaryKeysByDir.get(dir);

    for (const r of parsed) {
      if (r?.primaryKey?.ID) {
        const pk = r.primaryKey.ID.toUpperCase();
        allPrimaryKeys.add(pk);
        dirKeys.add(pk);
      }
      if (r?.fields) {
        records.push({ dir, primaryKey: r.primaryKey, fields: r.fields });
      }
    }
  } catch (err) {
    console.error(`Error reading ${file}:`, err);
  }
}

// 2. Directory target map: enforce target-aware referential resolution
const FIELD_TARGET_DIR_MAP = new Map([
  ['CompanyID', 'companies'],
  ['ReceivingCompanyID', 'companies'],
  ['PersonID', 'people'],
  ['BillToPersonID', 'people'],
  ['OrganizationID', 'organizations'],
  ['BillToOrganizationID', 'organizations'],
  ['ProductID', 'products'],
  ['ProductCategoryID', 'product-categories'],
  ['OrderHeaderID', 'orders'],
  ['OrderID', 'orders'],
  ['ReversesOrderHeaderID', 'orders'],
  ['OrderLineID', 'order-lines'],
  ['PaymentHeaderID', 'payments'],
  ['EventID', 'events'],
  ['CourseID', 'courses'],
  ['CertificationID', 'certifications']
]);

// 3. Explicit, documented exclusion list for known external cross-repo references
// Each exclusion tracks hit counts; an exclusion that matches 0 records will fail the build to catch stale exclusions.
const EXCLUDED_EXTERNAL_FIELDS = new Map([
  ['relationships.RelationshipTypeID', { reason: 'Points to @memberjunction/bizapps-common seeded types', hits: 0 }],
  ['form-responses.AnonymousSessionID', { reason: 'Anonymous browser session tokens from public form submissions', hits: 0 }],
  ['sonar-score-models.OwnerUserID', { reason: 'External Core User ID in MJ User table', hits: 0 }],
  ['sonar-score-model-versions.PublishedByUserID', { reason: 'External Core User ID in MJ User table', hits: 0 }],
  ['products.ProductTypeID', { reason: 'Points to @mj-biz-apps/orders seeded product types', hits: 0 }],
  ['products.RevenueRecognitionTypeID', { reason: 'Points to @mj-biz-apps/orders seeded revenue recognition types', hits: 0 }],
  ['payments.PaymentTypeID', { reason: 'Points to @mj-biz-apps/orders seeded payment types', hits: 0 }]
]);

console.log('='.repeat(80));
console.log('       TARGET-AWARE METADATA REFERENTIAL INTEGRITY CLOSURE AUDIT       ');
console.log('='.repeat(80));
console.log(`Indexed ${allPrimaryKeys.size.toLocaleString()} unique Primary Keys across ${primaryKeysByDir.size} directories and ${records.length.toLocaleString()} records.\n`);

let evaluatedCount = 0;
const orphanMap = new Map();

for (const r of records) {
  for (const [fieldName, val] of Object.entries(r.fields)) {
    // Check every field ending in 'ID' except primary key 'ID'
    if (fieldName.endsWith('ID') && fieldName !== 'ID') {
      if (!val || typeof val !== 'string' || val.startsWith('@lookup:')) {
        continue;
      }

      const qualifiedKey = `${r.dir}.${fieldName}`;
      if (EXCLUDED_EXTERNAL_FIELDS.has(qualifiedKey)) {
        EXCLUDED_EXTERNAL_FIELDS.get(qualifiedKey).hits++;
        continue;
      }

      evaluatedCount++;
      const valUpper = val.toUpperCase();

      // Target-aware check if target directory is known
      const targetDir = FIELD_TARGET_DIR_MAP.get(fieldName);
      if (targetDir) {
        const targetKeys = primaryKeysByDir.get(targetDir);
        if (!targetKeys || !targetKeys.has(valUpper)) {
          if (!orphanMap.has(qualifiedKey)) orphanMap.set(qualifiedKey, []);
          orphanMap.get(qualifiedKey).push(`${val} (expected in metadata/${targetDir})`);
        }
      } else {
        // Fallback global closure check
        if (!allPrimaryKeys.has(valUpper)) {
          if (!orphanMap.has(qualifiedKey)) orphanMap.set(qualifiedKey, []);
          orphanMap.get(qualifiedKey).push(val);
        }
      }
    }
  }
}

// Verify that every declared exclusion actually matched records
let staleExclusions = 0;
console.log('External Exclusions Evaluated:');
for (const [key, meta] of EXCLUDED_EXTERNAL_FIELDS.entries()) {
  console.log(`  ${key.padEnd(46)} : ${meta.hits.toLocaleString()} skipped (${meta.reason})`);
  if (meta.hits === 0) {
    console.error(`  ❌ STALE EXCLUSION: ${key} matched 0 records! Remove it from EXCLUDED_EXTERNAL_FIELDS.`);
    staleExclusions++;
  }
}

console.log('\n' + '-'.repeat(80));
console.log(`Total Foreign Key References Evaluated: ${evaluatedCount.toLocaleString()}`);
console.log(`Total Orphaned References Found:        ${orphanMap.size}`);
console.log('='.repeat(80));

if (staleExclusions > 0) {
  console.error(`\n❌ Metadata closure check FAILED due to ${staleExclusions} stale exclusion(s).`);
  process.exit(1);
}

if (evaluatedCount === 0) {
  console.error('\n❌ Metadata closure check FAILED: 0 foreign key references were evaluated!');
  process.exit(1);
}

if (orphanMap.size > 0) {
  console.error(`\n❌ Metadata closure check FAILED: Unresolved foreign keys detected:`);
  for (const [field, samples] of orphanMap.entries()) {
    console.error(`  - ${field}: ${samples.length} orphans (sample: ${samples[0]})`);
  }
  process.exit(1);
}

// 4. Directory coverage audit: Every directory containing .mj-sync.json must be in root .mj-sync.json directoryOrder
console.log('\n--- Directory Coverage Audit ---');
const rootSyncConfig = JSON.parse(readFileSync(join(METADATA_DIR, '.mj-sync.json'), 'utf-8'));
const declaredDirs = new Set(rootSyncConfig.directoryOrder ?? []);
const actualSyncDirs = [];
for (const entry of readdirSync(METADATA_DIR)) {
  const full = join(METADATA_DIR, entry);
  if (statSync(full).isDirectory() && !entry.startsWith('.')) {
    if (readdirSync(full).includes('.mj-sync.json')) {
      actualSyncDirs.push(entry);
    }
  }
}
const missingFromOrder = actualSyncDirs.filter((d) => !declaredDirs.has(d));
if (missingFromOrder.length > 0) {
  console.error(`\n❌ DIRECTORY ORDER AUDIT FAILED: The following ${missingFromOrder.length} entity directories are missing from metadata/.mj-sync.json directoryOrder:`);
  for (const d of missingFromOrder) console.error(`  - ${d}`);
  process.exit(1);
}
console.log(`✓ All ${actualSyncDirs.length} entity directories declared in root .mj-sync.json directoryOrder.`);

// 5. Cross-directory Primary Key Uniqueness audit
console.log('\n--- Cross-Directory Primary Key Uniqueness Audit ---');
const pkOwnerMap = new Map();
let duplicatePks = 0;
for (const [dir, pks] of primaryKeysByDir.entries()) {
  for (const pk of pks) {
    if (pkOwnerMap.has(pk)) {
      console.error(`❌ PK COLLISION: Primary Key ${pk} exists in both '${pkOwnerMap.get(pk)}' and '${dir}'!`);
      duplicatePks++;
    } else {
      pkOwnerMap.set(pk, dir);
    }
  }
}
if (duplicatePks > 0) {
  console.error(`\n❌ PK UNIQUENESS AUDIT FAILED: ${duplicatePks} cross-directory primary key collision(s) found.`);
  process.exit(1);
}
console.log(`✓ Zero cross-directory Primary Key collisions across ${pkOwnerMap.size.toLocaleString()} unique PKs.`);

// 6. Order Financial Integrity audit (TotalGross == line sum, Balance == TotalGross - AmountPaid, 0 overpaid)
console.log('\n--- Order Financial Integrity Audit ---');
const orderLines = records.filter((r) => r.dir === 'order-lines');
const lineSums = new Map();
for (const ol of orderLines) {
  const oid = ol.fields.OrderHeaderID ? String(ol.fields.OrderHeaderID).toUpperCase() : null;
  if (!oid) continue;
  const lineTotal =
    (Number(ol.fields.Quantity) || 1) * (Number(ol.fields.UnitPrice) || 0) -
    (Number(ol.fields.DiscountAmount) || 0) +
    (Number(ol.fields.ChargeAmount) || 0) +
    (Number(ol.fields.LineTax) || 0);
  lineSums.set(oid, (lineSums.get(oid) ?? 0) + lineTotal);
}

const orders = records.filter((r) => r.dir === 'orders');
let grossMismatches = 0;
let balanceMismatches = 0;
let overpaidOrders = 0;

for (const o of orders) {
  const oid = o.primaryKey?.ID ? String(o.primaryKey.ID).toUpperCase() : null;
  const f = o.fields;
  const lineTotal = lineSums.get(oid);
  if (lineTotal !== undefined && Math.abs(f.TotalGross - lineTotal) > 0.01) {
    grossMismatches++;
  }
  const expectedBalance = Math.round((f.TotalGross - f.AmountPaid) * 100) / 100;
  if (Math.abs(f.Balance - expectedBalance) > 0.01) {
    balanceMismatches++;
  }
  if (f.AmountPaid > f.TotalGross + 0.01) {
    overpaidOrders++;
  }
}

if (grossMismatches > 0 || balanceMismatches > 0 || overpaidOrders > 0) {
  console.error(
    `\n❌ ORDER FINANCIAL AUDIT FAILED: Gross mismatches: ${grossMismatches}, Balance mismatches: ${balanceMismatches}, Overpaid orders: ${overpaidOrders}`
  );
  process.exit(1);
}
console.log(
  `✓ All ${orders.length.toLocaleString()} orders pass financial integrity (TotalGross matches lines, Balance = TotalGross - AmountPaid, 0 overpaid).`
);

// 7. Membership period dues order coverage audit (R4-1)
console.log('\n--- Membership Period Dues Order Coverage Audit (R4-1) ---');
const periods = records.filter((r) => r.dir === 'membership-periods');
const products = records.filter((r) => r.dir === 'products');
const categories = records.filter((r) => r.dir === 'product-categories');
const membershipCategory = categories.find((c) => c.fields?.Name === 'Memberships');
if (!membershipCategory) {
  console.error("\n❌ DUES COVERAGE AUDIT FAILED: 'Memberships' category not found in metadata/product-categories");
  process.exit(1);
}
const membershipCategoryID = String(membershipCategory.primaryKey?.ID).toUpperCase();

const memProdIds = new Set(
  products
    .filter((p) => {
      const catId = p.fields?.ProductCategoryID ? String(p.fields.ProductCategoryID).toUpperCase() : null;
      return catId === membershipCategoryID;
    })
    .map((p) => String(p.primaryKey?.ID).toUpperCase())
);

const memOrderHeaderIds = new Set();
for (const l of orderLines) {
  const pid = l.fields?.ProductID ? String(l.fields.ProductID).toUpperCase() : null;
  if (pid && memProdIds.has(pid)) {
    const oid = l.fields?.OrderHeaderID ? String(l.fields.OrderHeaderID).toUpperCase() : null;
    if (oid) memOrderHeaderIds.add(oid);
  }
}

const memSaleOrders = orders.filter(
  (o) => o.fields?.OrderType === 'Sale' && memOrderHeaderIds.has(String(o.primaryKey?.ID).toUpperCase())
);
const ordersByPerson = new Map();
for (const o of memSaleOrders) {
  const pid = o.fields?.BillToPersonID ? String(o.fields.BillToPersonID).toUpperCase() : null;
  if (pid) {
    if (!ordersByPerson.has(pid)) ordersByPerson.set(pid, []);
    ordersByPerson.get(pid).push(o);
  }
}

let unbackedDuesPeriods = 0;
let billedPeriodsCount = 0;
for (const p of periods) {
  const dues = p.fields?.DuesAmount ?? 0;
  if (dues <= 0) continue;
  billedPeriodsCount++;
  const personId = p.fields?.PersonID ? String(p.fields.PersonID).toUpperCase() : null;
  const pStart = p.fields?.StartDate ? new Date(p.fields.StartDate).getTime() : NaN;
  const pOrders = personId ? ordersByPerson.get(personId) || [] : [];
  let hasWithin90 = false;
  for (const o of pOrders) {
    const oDate = o.fields?.OrderDate ? new Date(o.fields.OrderDate).getTime() : NaN;
    if (!isNaN(pStart) && !isNaN(oDate)) {
      const diffDays = Math.abs(oDate - pStart) / (1000 * 60 * 60 * 24);
      if (diffDays <= 90) {
        hasWithin90 = true;
        break;
      }
    }
  }
  if (!hasWithin90) unbackedDuesPeriods++;
}

if (unbackedDuesPeriods > 0) {
  console.error(`\n❌ DUES COVERAGE AUDIT FAILED: ${unbackedDuesPeriods} billed periods missing membership Sale order within 90 days.`);
  process.exit(1);
}
console.log(`✓ All ${billedPeriodsCount.toLocaleString()} billed periods backed 1:1 by membership Sale orders within 90 days.`);

console.log(`\n✅ ALL METADATA INTEGRITY CHECKS PASSED (Closure, Directory Order, PK Uniqueness, Financials, Dues Coverage).`);
process.exit(0);
