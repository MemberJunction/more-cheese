#!/usr/bin/env node
/**
 * Assert that MetadataSync migrations insert exactly the primary keys in
 * generated/ for every loom-classified directory. Keys are every field on
 * the record's primaryKey (not only ID) matched to the corresponding
 * spCreate/spUpdate argument. A directory that yields zero keys fails.
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

function normalizeValue(v) {
  if (v === undefined || v === null) return null;
  const s = String(v);
  if (/^[0-9A-Fa-f]{8}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{12}$/.test(s)) {
    return s.toUpperCase();
  }
  return s;
}

function canonKey(pk, fieldNames) {
  return fieldNames
    .map((f) => `${f}=${normalizeValue(pk[f])}`)
    .join('|');
}

function generatedKeys(dir) {
  const folder = path.join(generatedRoot, dir);
  const keys = new Set();
  const fieldNames = new Set();
  if (!fs.existsSync(folder)) return { keys, fieldNames: [] };
  for (const name of fs.readdirSync(folder)) {
    if (!name.endsWith('.json') || name === '.mj-sync.json') continue;
    const data = JSON.parse(fs.readFileSync(path.join(folder, name), 'utf8'));
    const rows = Array.isArray(data) ? data : data.records || data.items || [];
    for (const row of rows) {
      const pk = row?.primaryKey;
      if (!pk || typeof pk !== 'object') continue;
      const names = Object.keys(pk);
      for (const n of names) fieldNames.add(n);
      if (names.length === 0) continue;
      const ordered = [...names].sort();
      const key = canonKey(pk, ordered);
      if (ordered.every((f) => normalizeValue(pk[f]) !== null)) keys.add(key);
    }
  }
  return { keys, fieldNames: [...fieldNames].sort() };
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

const pkFieldsByEntity = new Map();
const treeKeysByDir = new Map();
for (const dir of loomDirs) {
  const entity = entityNameFor(dir);
  const { keys, fieldNames } = generatedKeys(dir);
  treeKeysByDir.set(dir, { entity, keys, fieldNames });
  if (entity && fieldNames.length) {
    const existing = pkFieldsByEntity.get(entity) || new Set();
    for (const f of fieldNames) existing.add(f);
    pkFieldsByEntity.set(entity, existing);
  }
}

const saveRe = /^-- Save (.+?)(?: \([^)]+\))?\s*$/;
const assignRe = /^\s*@([A-Za-z][A-Za-z0-9]*)_([A-Za-z0-9]+) = (?:N)?'([^']*)'/;
const assignNumRe = /^\s*@([A-Za-z][A-Za-z0-9]*)_([A-Za-z0-9]+) = (-?[0-9]+(?:\.[0-9]+)?)(?:\s|$)/;
const execArgVarRe = /@([A-Za-z][A-Za-z0-9]*)\s*=\s*@([A-Za-z][A-Za-z0-9_]*)/g;
const execArgLitRe = /@([A-Za-z][A-Za-z0-9]*)\s*=\s*N?'([^']*)'/g;

function resetBlock(state) {
  state.vars = new Map();
  state.execArgs = new Map();
  state.execArgVars = [];
  state.sawExec = false;
}

function flushBlock(state, byEntity) {
  if (!state.entity || !state.sawExec) {
    resetBlock(state);
    return;
  }
  const pkFields = [...(pkFieldsByEntity.get(state.entity) || [])].sort();
  if (pkFields.length === 0) {
    resetBlock(state);
    return;
  }
  const args = new Map(state.execArgs);
  for (const [param, varName] of state.execArgVars) {
    const resolved = state.vars.get(varName) ?? state.vars.get(varName.replace(/^@/, ''));
    if (resolved !== undefined) args.set(param, resolved);
  }
  const pk = {};
  let complete = true;
  for (const f of pkFields) {
    const val = args.has(f) ? args.get(f) : null;
    if (val === null || val === undefined) {
      complete = false;
      break;
    }
    pk[f] = val;
  }
  if (complete) {
    if (!byEntity.has(state.entity)) byEntity.set(state.entity, new Set());
    byEntity.get(state.entity).add(canonKey(pk, pkFields));
  }
  resetBlock(state);
}

async function loadInsertedKeys() {
  const byEntity = new Map();
  for (const file of syncSqlFiles) {
    const rl = readline.createInterface({
      input: fs.createReadStream(file),
      crlfDelay: Infinity,
    });
    const state = {
      entity: null,
      vars: new Map(),
      execArgs: new Map(),
      execArgVars: [],
      sawExec: false,
    };
    resetBlock(state);
    for await (const raw of rl) {
      const line = raw;
      const save = line.match(saveRe);
      if (save) {
        flushBlock(state, byEntity);
        state.entity = save[1].trim();
        continue;
      }
      if (line.startsWith('GO') || line.startsWith('-- SQL Logging') || line.startsWith('-- Split part')) {
        flushBlock(state, byEntity);
        state.entity = null;
        continue;
      }
      const assign = line.match(assignRe) || line.match(assignNumRe);
      if (assign) {
        const field = assign[1];
        const suffix = assign[2];
        const value = normalizeValue(assign[3]);
        state.vars.set(`${field}_${suffix}`, value);
        state.vars.set(`@${field}_${suffix}`, value);
      }
      if (/\bEXEC\b/i.test(line)) {
        state.sawExec = true;
      }
      if (state.sawExec) {
        execArgVarRe.lastIndex = 0;
        let m;
        while ((m = execArgVarRe.exec(line))) {
          state.execArgVars.push([m[1], m[2]]);
        }
        execArgLitRe.lastIndex = 0;
        while ((m = execArgLitRe.exec(line))) {
          state.execArgs.set(m[1], normalizeValue(m[2]));
        }
      }
    }
    flushBlock(state, byEntity);
  }
  return byEntity;
}

const byEntity = await loadInsertedKeys();

let failed = 0;
console.log(`🔍 Sync ID parity: ${loomDirs.length} loom directories vs ${syncSqlFiles.length} MetadataSync file(s)`);

for (const dir of loomDirs) {
  const meta = treeKeysByDir.get(dir);
  const entity = meta?.entity;
  if (!entity) {
    console.error(`❌ ${dir}: missing generated/${dir}/.mj-sync.json entity`);
    failed++;
    continue;
  }
  const tree = meta.keys;
  const inserted = byEntity.get(entity) || new Set();
  if (tree.size === 0) {
    failed++;
    console.error(
      `❌ ${dir} (${entity}): zero primary keys in generated/ (pk fields: ${meta.fieldNames.join(', ') || 'none'})`,
    );
    continue;
  }
  const extra = [...inserted].filter((id) => !tree.has(id));
  const missing = [...tree].filter((id) => !inserted.has(id));
  if (extra.length === 0 && missing.length === 0) {
    console.log(`  ✓ ${dir} (${entity}): ${tree.size} keys [${meta.fieldNames.join(', ')}]`);
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
