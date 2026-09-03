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

// 1. Index all primary keys and load all records
const allPrimaryKeys = new Set();
const records = [];

const files = findJsonFiles(METADATA_DIR);
for (const file of files) {
  try {
    const raw = readFileSync(file, 'utf-8');
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) continue;

    const relPath = relative(METADATA_DIR, file);
    const dir = relPath.split(sep)[0];

    for (const r of parsed) {
      if (r?.primaryKey?.ID) {
        allPrimaryKeys.add(r.primaryKey.ID.toUpperCase());
      }
      if (r?.fields) {
        records.push({ dir, fields: r.fields });
      }
    }
  } catch (err) {
    console.error(`Error reading ${file}:`, err);
  }
}

// 2. Explicit, documented exclusion list for known external cross-repo references
// Each exclusion tracks hit counts; an exclusion that matches 0 records will fail the build to catch stale exclusions.
const EXCLUDED_EXTERNAL_FIELDS = new Map([
  ['relationships.RelationshipTypeID', { reason: 'Points to @memberjunction/bizapps-common seeded types', hits: 0 }],
  ['form-responses.AnonymousSessionID', { reason: 'Anonymous browser session tokens from public form submissions', hits: 0 }],
  ['sonar-score-models.OwnerUserID', { reason: 'External Core User ID in MJ User table', hits: 0 }],
  ['sonar-score-model-versions.PublishedByUserID', { reason: 'External Core User ID in MJ User table', hits: 0 }],
  ['products.ProductTypeID', { reason: 'Points to @mj-biz-apps/orders seeded product types', hits: 0 }],
  ['products.ProductCategoryID', { reason: 'Points to @mj-biz-apps/orders seeded categories', hits: 0 }],
  ['products.RevenueRecognitionTypeID', { reason: 'Points to @mj-biz-apps/orders seeded revenue recognition types', hits: 0 }],
  ['payments.PaymentTypeID', { reason: 'Points to @mj-biz-apps/orders seeded payment types', hits: 0 }]
]);

console.log('='.repeat(80));
console.log('       GENERIC METADATA REFERENTIAL INTEGRITY CLOSURE AUDIT       ');
console.log('='.repeat(80));
console.log(`Indexed ${allPrimaryKeys.size.toLocaleString()} unique Primary Keys across ${records.length.toLocaleString()} records.\n`);

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
      if (!allPrimaryKeys.has(val.toUpperCase())) {
        if (!orphanMap.has(qualifiedKey)) orphanMap.set(qualifiedKey, []);
        orphanMap.get(qualifiedKey).push(val);
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

console.log(`\n✅ Metadata closure check PASSED. All ${evaluatedCount.toLocaleString()} foreign keys closed with 0 orphans.`);
process.exit(0);
