import fs from 'node:fs';
import path from 'node:path';

const rootDir = process.cwd();
const ownershipPath = path.join(rootDir, 'data/ownership.json');
const configEntitiesPath = path.join(rootDir, 'data/config-entities.json');
const domainPath = path.join(rootDir, 'data/domain.json');

if (!fs.existsSync(ownershipPath)) {
  console.error('❌ Missing data/ownership.json');
  process.exit(1);
}

const ownership = JSON.parse(fs.readFileSync(ownershipPath, 'utf8'));
const domain = fs.existsSync(domainPath) ? JSON.parse(fs.readFileSync(domainPath, 'utf8')) : null;
const configEntities = fs.existsSync(configEntitiesPath) ? JSON.parse(fs.readFileSync(configEntitiesPath, 'utf8')) : null;

let errors = 0;

function listDirs(baseDir) {
  const full = path.join(rootDir, baseDir);
  if (!fs.existsSync(full)) return [];
  return fs.readdirSync(full).filter((d) => {
    return fs.statSync(path.join(full, d)).isDirectory() && !d.startsWith('.');
  });
}

const configDirs = listDirs('config');
const generatedDirs = listDirs('generated');

console.log(`🔍 Checking ownership across ${configDirs.length} config/ and ${generatedDirs.length} generated/ directories...`);

// 1. Every directory on disk must be in ownership.json
const seenInManifest = new Set();

for (const dir of configDirs) {
  seenInManifest.add(dir);
  const entry = ownership.directories[dir];
  if (!entry) {
    console.error(`❌ Unclassified directory in config/: ${dir}`);
    errors++;
  } else {
    if (entry.tier !== 'config') {
      console.error(`❌ Directory in config/ has tier mismatch: ${dir} (tier: ${entry.tier})`);
      errors++;
    }
    if (entry.classification !== 'config') {
      console.error(`❌ Directory in config/ classified as ${entry.classification}: ${dir}`);
      errors++;
    }
    if (!entry.reason || entry.reason.trim().length === 0) {
      console.error(`❌ Missing classification reason for config/: ${dir}`);
      errors++;
    }
  }
}

// Build declared domain output directories set
const domainOutputDirs = new Set();
if (domain && domain.entities) {
  for (const [entityName, entityCfg] of Object.entries(domain.entities)) {
    domainOutputDirs.add(entityCfg.outputDirectory ?? entityName);
  }
}

for (const dir of generatedDirs) {
  seenInManifest.add(dir);
  const entry = ownership.directories[dir];
  if (!entry) {
    console.error(`❌ Unclassified directory in generated/: ${dir}`);
    errors++;
  } else {
    if (entry.tier !== 'generated') {
      console.error(`❌ Directory in generated/ has tier mismatch: ${dir} (tier: ${entry.tier})`);
      errors++;
    }
    if (entry.classification !== 'loom' && entry.classification !== 'frozen') {
      console.error(`❌ Directory in generated/ must be classified loom or frozen, got ${entry.classification}: ${dir}`);
      errors++;
    }
    if (!entry.reason || entry.reason.trim().length === 0) {
      console.error(`❌ Missing classification reason for generated/: ${dir}`);
      errors++;
    }

    // C2: Check that loom-classified directories are declared in domain.json
    if (entry.classification === 'loom') {
      if (!domainOutputDirs.has(dir)) {
        console.error(`❌ Directory in generated/ classified as 'loom' is not declared in data/domain.json: ${dir}`);
        errors++;
      }
    }
  }
}

// 2. Every directory in ownership.json must exist on disk
for (const [dir, entry] of Object.entries(ownership.directories)) {
  if (!seenInManifest.has(dir) && dir !== 'schema-info') {
    console.error(`❌ Directory in ownership manifest does not exist on disk: ${dir}`);
    errors++;
  }
}

// 3. Cross-check config-entities.json against config/
if (configEntities) {
  const configEntitiesSet = new Set(configEntities.map((e) => e.directory));
  for (const dir of configDirs) {
    if (!configEntitiesSet.has(dir)) {
      console.error(`❌ Directory in config/ missing from data/config-entities.json: ${dir}`);
      errors++;
    }
  }
  for (const dir of configEntitiesSet) {
    if (!configDirs.includes(dir)) {
      console.error(`❌ Entity in data/config-entities.json missing from config/: ${dir}`);
      errors++;
    }
  }
}

// 4. Proposed rulings & frozen validation check (C1, C2)
for (const [dir, entry] of Object.entries(ownership.directories)) {
  if (entry.classification === 'frozen') {
    if (dir === 'portal-sessions') {
      if (!entry.reason.includes('proposed, pending owner confirmation')) {
        console.error(`❌ portal-sessions reason must state "proposed, pending owner confirmation": got "${entry.reason}"`);
        errors++;
      }
    } else if (entry.reason.includes('reference taxonomy (reviewer round-1 C3 Option A; pending owner confirmation)')) {
      // Approved reference taxonomy (reviewer round-1 C3 Option A; pending owner confirmation)
    } else {
      console.error(`❌ Unapproved frozen directory or reason: ${dir} (reason: "${entry.reason}")`);
      errors++;
    }
  }
}

if (errors > 0) {
  console.error(`\n💥 Ownership audit failed with ${errors} error(s)`);
  process.exit(1);
}

console.log('✅ Ownership manifest and directory partitioning audit passed successfully.');
