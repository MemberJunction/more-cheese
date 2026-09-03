#!/usr/bin/env node
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';

const METADATA_DIR = resolve(process.cwd(), 'metadata');

function findJsonFiles(dir) {
  const results = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) {
      results.push(...findJsonFiles(full));
    } else if (entry.endsWith('.json') && !entry.startsWith('.')) {
      results.push(full);
    } else if (entry.startsWith('.') && entry.endsWith('.json')) {
      // e.g. .events.json, .people.json
      results.push(full);
    }
  }
  return results;
}

// 1. Index all primary keys and group by directory/entity
const allPrimaryKeys = new Set();
const recordsByDir = new Map();

const files = findJsonFiles(METADATA_DIR);
for (const file of files) {
  try {
    const raw = readFileSync(file, 'utf-8');
    const records = JSON.parse(raw);
    if (!Array.isArray(records)) continue;

    const relPath = file.replace(METADATA_DIR + '/', '');
    const dir = relPath.split('/')[0];
    if (!recordsByDir.has(dir)) recordsByDir.set(dir, []);
    recordsByDir.get(dir).push(...records);

    for (const r of records) {
      if (r?.primaryKey?.ID) {
        allPrimaryKeys.add(r.primaryKey.ID.toUpperCase());
      }
    }
  } catch (err) {
    console.error(`Error reading ${file}:`, err);
  }
}

// 2. Define standard referential closure checks
const checks = [
  { sourceDir: 'organization-profiles', fkField: 'OrganizationID', targetName: 'Organizations' },
  { sourceDir: 'member-profiles', fkField: 'PersonID', targetName: 'People' },
  { sourceDir: 'membership-periods', fkField: 'PersonID', targetName: 'People' },
  { sourceDir: 'event-registrations', fkField: 'EventID', targetName: 'Events' },
  { sourceDir: 'event-registrations', fkField: 'PersonID', targetName: 'People' },
  { sourceDir: 'competition-entries', fkField: 'EventID', targetName: 'Events' },
  { sourceDir: 'enrollments', fkField: 'CourseID', targetName: 'Courses' },
  { sourceDir: 'enrollments', fkField: 'PersonID', targetName: 'People' },
  { sourceDir: 'orders', fkField: 'PersonID', targetName: 'People' },
  { sourceDir: 'order-lines', fkField: 'OrderID', targetName: 'Orders' },
  { sourceDir: 'order-lines', fkField: 'ProductID', targetName: 'Products' },
  { sourceDir: 'payments', fkField: 'OrderID', targetName: 'Orders' },
  { sourceDir: 'advocacy-actions', fkField: 'PersonID', targetName: 'People' },
  { sourceDir: 'member-certifications', fkField: 'PersonID', targetName: 'People' },
  { sourceDir: 'member-certifications', fkField: 'CertificationID', targetName: 'Certifications' },
];

console.log('='.repeat(80));
console.log('           METADATA REFERENTIAL INTEGRITY CLOSURE AUDIT           ');
console.log('='.repeat(80));
console.log(`Indexed ${allPrimaryKeys.size.toLocaleString()} unique Primary Keys across ${recordsByDir.size} metadata collections.\n`);

let totalChecked = 0;
let totalFailures = 0;

for (const check of checks) {
  const records = recordsByDir.get(check.sourceDir) || [];
  let checked = 0;
  let orphans = 0;

  for (const r of records) {
    const val = r?.fields?.[check.fkField];
    if (val && typeof val === 'string' && !val.startsWith('@lookup:')) {
      checked++;
      if (!allPrimaryKeys.has(val.toUpperCase())) {
        orphans++;
      }
    }
  }

  totalChecked += checked;
  totalFailures += orphans;

  const status = orphans === 0 ? 'PASSED' : `FAILED (${orphans} orphans)`;
  const label = `${check.sourceDir} -> ${check.targetName} (${check.fkField})`;
  console.log(`  ${label.padEnd(52)} : ${status.padEnd(10)} [${checked.toLocaleString()} checked]`);
}

console.log('-'.repeat(80));
console.log(`Total Foreign Keys Evaluated: ${totalChecked.toLocaleString()}`);
console.log(`Total Referential Orphans:    ${totalFailures}`);
console.log('='.repeat(80));

if (totalFailures > 0) {
  console.error(`\n❌ Metadata closure check FAILED with ${totalFailures} orphaned foreign keys.`);
  process.exit(1);
} else {
  console.log('\n✅ Metadata closure check PASSED. All relationships closed with 0 orphans.');
  process.exit(0);
}
