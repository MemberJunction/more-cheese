#!/usr/bin/env node
/**
 * Assert that MetadataSync migrations insert exactly the IDs in generated/
 * for every loom-classified directory. Fails if the capture drifted from
 * the committed tree (extra IDs, missing IDs, or a directory with no
 * spCreate/spUpdate blocks).
 */
import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline';

const rootDir = process.cwd();
const ownership = JSON.parse(fs.readFileSync(path.join(rootDir, 'data/ownership.json'), 'utf8'));
const generatedRoot = path.join(rootDir, 'generated');
const migrationsDir = path.join(rootDir, 'migrations');

const loomDirs = Object.entries(ownership.directories)
  .filter(([, v]) => v.classification === 'loom')
  .map(([k]) => k)
  .sort();

function generatedIds(dir) {
  const folder = path.join(generatedRoot, dir);
  const ids = new Set();
  if (!fs.existsSync(folder)) return ids;
  for (const name of fs.readdirSync(folder)) {
    if (!name.endsWith('.json') || name === '.mj-sync.json') continue;
    const data = JSON.parse(fs.readFileSync(path.join(folder, name), 'utf8'));
    const rows = Array.isArray(data) ? data : data.records || data.items || [];
    for (const row of rows) {
      const id = row?.primaryKey?.ID ?? row?.primaryKey?.Id ?? row?.ID;
      if (id) ids.add(String(id).toUpperCase());
    }
  }
  return ids;
}

function entityNameFor(dir) {
  const p = path.join(generatedRoot, dir, '.mj-sync.json');
  if (!fs.existsSync(p)) return null;
  return JSON.parse(fs.readFileSync(p, 'utf8')).entity || null;
}

const syncSqlFiles = fs
  .readdirSync(migrationsDir)
  .filter((f) => /MetadataSync/i.test(f) && f.endsWith('.sql'))
  .map((f) => path.join(migrationsDir, f))
  .sort();

if (syncSqlFiles.length === 0) {
  console.error('❌ No MetadataSync migration files in migrations/');
  process.exit(1);
}

const byEntity = new Map(); // entityName -> Set(id)

function currentSet(entity) {
  if (!byEntity.has(entity)) byEntity.set(entity, new Set());
  return byEntity.get(entity);
}

const saveRe = /^-- Save (.+?)(?: \([^)]+\))?\s*$/;
const idAssignRe = /^  @ID_[A-Za-z0-9]+ = '([0-9A-Fa-f-]{36})'\s*$/;

async function loadInsertedIds() {
  let currentEntity = null;
  for (const file of syncSqlFiles) {
    const rl = readline.createInterface({
      input: fs.createReadStream(file),
      crlfDelay: Infinity,
    });
    for await (const line of rl) {
      const save = line.match(saveRe);
      if (save) {
        currentEntity = save[1].trim();
        continue;
      }
      if (line.startsWith('GO') || line.startsWith('-- SQL Logging') || line.startsWith('-- Split part')) {
        currentEntity = null;
        continue;
      }
      const assign = line.match(idAssignRe);
      if (assign && currentEntity) {
        currentSet(currentEntity).add(assign[1].toUpperCase());
      }
    }
  }
}

await loadInsertedIds();

let failed = 0;
console.log(`🔍 Sync ID parity: ${loomDirs.length} loom directories vs ${syncSqlFiles.length} MetadataSync file(s)`);

for (const dir of loomDirs) {
  const entity = entityNameFor(dir);
  if (!entity) {
    console.error(`❌ ${dir}: missing generated/${dir}/.mj-sync.json entity`);
    failed++;
    continue;
  }
  const tree = generatedIds(dir);
  const inserted = byEntity.get(entity) || new Set();
  const extra = [...inserted].filter((id) => !tree.has(id));
  const missing = [...tree].filter((id) => !inserted.has(id));
  if (extra.length === 0 && missing.length === 0) {
    console.log(`  ✓ ${dir} (${entity}): ${tree.size} IDs`);
    continue;
  }
  failed++;
  console.error(
    `❌ ${dir} (${entity}): generated=${tree.size} inserted=${inserted.size} extra=${extra.length} missing=${missing.length}`,
  );
  if (extra.length) console.error(`   extra sample: ${extra.slice(0, 3).join(', ')}`);
  if (missing.length) console.error(`   missing sample: ${missing.slice(0, 3).join(', ')}`);
}

if (failed) {
  console.error(`\n❌ Sync ID parity failed for ${failed} loom director${failed === 1 ? 'y' : 'ies'}.`);
  process.exit(1);
}

console.log('\n✅ MetadataSync inserted ID sets match generated/ for every loom directory.');
process.exit(0);
