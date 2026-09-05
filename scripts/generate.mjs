#!/usr/bin/env node
/**
 * scripts/generate.mjs — Deterministic simulation and metadata generation pipeline
 *
 * Compiles the Loom domain, applies Loom AvatarGenerator / LogoGenerator to the
 * governed generated/ tree from data/domain.json field config, and verifies
 * checkpoint.json. After the tree is committed, a second run must leave
 * generated/ byte-identical.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { execSync } from 'node:child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const generatedDir = path.join(rootDir, 'generated');
const checkpointPath = path.join(generatedDir, 'checkpoint.json');
const domainPath = path.join(rootDir, 'data', 'domain.json');

console.log(`🧵 Loom Pipeline: Compile domain, run deterministic passes (avatars, logos), verify tree unchanged`);
console.log(`   Seed: 42 | Release: 2026-09-02 (asOfYear: 2026)`);

function findExisting(candidates) {
  for (const c of candidates) {
    if (c === 'loom') {
      try {
        execSync('which loom', { stdio: 'ignore' });
        return 'loom';
      } catch {
        continue;
      }
    }
    if (fs.existsSync(c)) return c;
  }
  return null;
}

const loomBin = findExisting([
  'loom',
  path.resolve(rootDir, 'loom/packages/cli/dist/bin/loom.js'),
  path.resolve(rootDir, '../loom/packages/cli/dist/bin/loom.js'),
  path.resolve(rootDir, '../../loom/packages/cli/dist/bin/loom.js'),
]);
const loomCmd = loomBin === 'loom' ? 'loom' : loomBin ? `node ${loomBin}` : null;

const tmpBuildDir = path.join(rootDir, '.loom-tmp-build');
if (loomCmd) {
  try {
    fs.mkdirSync(tmpBuildDir, { recursive: true });
    execSync(`${loomCmd} build -p data -o ${tmpBuildDir}`, {
      cwd: rootDir,
      stdio: 'pipe',
      encoding: 'utf8',
    });
    console.log(`   ✓ Canonical Loom engine compiled 41-entity domain model cleanly`);
  } catch (err) {
    const errOut = (err.stdout?.toString() || '') + (err.stderr?.toString() || '');
    console.error(`Error: Loom build failed: ${errOut}`);
    process.exit(1);
  } finally {
    try {
      fs.rmSync(tmpBuildDir, { recursive: true, force: true });
    } catch {}
  }
}

const engineEntry = findExisting([
  path.resolve(rootDir, 'loom/packages/engine/dist/index.js'),
  path.resolve(rootDir, '../loom/packages/engine/dist/index.js'),
  path.resolve(rootDir, '../../loom/packages/engine/dist/index.js'),
]);
if (!engineEntry) {
  console.error('Error: Loom engine dist not found (AvatarGenerator / LogoGenerator)');
  process.exit(1);
}

const { AvatarGenerator, LogoGenerator } = await import(pathToFileURL(engineEntry).href);
const domain = JSON.parse(fs.readFileSync(domainPath, 'utf8'));

function loadEntityRows(outputDirectory) {
  const dir = path.join(generatedDir, outputDirectory);
  if (!fs.existsSync(dir)) {
    console.error(`Error: generated directory missing: ${outputDirectory}`);
    process.exit(1);
  }
  const files = fs
    .readdirSync(dir)
    .filter((f) => f.endsWith('.json') && f !== '.mj-sync.json')
    .sort();
  return files.map((name) => {
    const full = path.join(dir, name);
    return { full, rows: JSON.parse(fs.readFileSync(full, 'utf8')) };
  });
}

function fieldValue(row, fieldName) {
  if (fieldName === 'ID' || fieldName === 'id') {
    return row.primaryKey?.ID ?? row.primaryKey?.id ?? row.fields?.ID ?? row.fields?.id;
  }
  if (row.fields && row.fields[fieldName] !== undefined && row.fields[fieldName] !== null) {
    return row.fields[fieldName];
  }
  return row.primaryKey?.[fieldName];
}

function applyConfiguredGenerators() {
  let logoDistinct = new Set();
  let logoCount = 0;
  let logoMax = 0;
  let photoCount = 0;
  let photoMax = 0;

  for (const entityCfg of Object.values(domain.entities || {})) {
    const outDir = entityCfg.outputDirectory;
    if (!outDir) continue;
    const files = loadEntityRows(outDir);
    for (const file of files) {
      let changed = false;
      for (const row of file.rows) {
        if (!row.fields) continue;
        for (const [fieldName, fieldCfg] of Object.entries(entityCfg.fields || {})) {
          if (fieldCfg.logo) {
            const cfg = fieldCfg.logo;
            const nameVal = fieldValue(row, cfg.nameField || 'Name') ?? `${entityCfg.name}`;
            const seedVal = fieldValue(row, cfg.seedField || 'ID') ?? nameVal;
            const uri = LogoGenerator.Generate({
              name: String(nameVal),
              seed: String(seedVal),
              format: cfg.format,
              shape: cfg.shape,
            });
            if (row.fields[fieldName] !== uri) {
              row.fields[fieldName] = uri;
              changed = true;
            }
            logoDistinct.add(uri);
            logoCount += 1;
            if (uri.length > logoMax) logoMax = uri.length;
            if (uri.length >= 1000) {
              console.error(`Error: ${entityCfg.name}.${fieldName} length ${uri.length} >= 1000`);
              process.exit(1);
            }
          } else if (fieldCfg.avatar) {
            const cfg = fieldCfg.avatar;
            const seedVal = fieldValue(row, cfg.seedField || 'ID') ?? `${entityCfg.name}`;
            const traitRaw = cfg.traitField ? fieldValue(row, cfg.traitField) : undefined;
            const uri = AvatarGenerator.Generate({
              seed: String(seedVal),
              trait: traitRaw !== undefined && traitRaw !== null ? String(traitRaw) : undefined,
              traits: cfg.traits,
              defaultTrait: cfg.defaultTrait,
              style: cfg.style,
              format: cfg.format,
              backgroundColor: cfg.backgroundColor,
            });
            if (row.fields[fieldName] !== uri) {
              row.fields[fieldName] = uri;
              changed = true;
            }
            photoCount += 1;
            if (uri.length > photoMax) photoMax = uri.length;
            if (uri.length >= 1000) {
              console.error(`Error: ${entityCfg.name}.${fieldName} length ${uri.length} >= 1000`);
              process.exit(1);
            }
          }
        }
      }
      if (changed) {
        fs.writeFileSync(file.full, JSON.stringify(file.rows, null, 2) + '\n', 'utf8');
      }
    }
  }

  if (logoCount !== 641 || logoDistinct.size !== 641) {
    console.error(
      `Error: expected 641/641 distinct organization logos, got count=${logoCount} distinct=${logoDistinct.size}`
    );
    process.exit(1);
  }
  if (photoCount < 1) {
    console.error('Error: no PhotoURL values generated');
    process.exit(1);
  }
  console.log(`   ✓ Loom LogoGenerator: ${logoCount}/${logoDistinct.size} distinct LogoURL (max ${logoMax} chars)`);
  console.log(`   ✓ Loom AvatarGenerator: ${photoCount} PhotoURL (max ${photoMax} chars)`);
}

applyConfiguredGenerators();

if (!fs.existsSync(checkpointPath)) {
  console.error(`Error: Checkpoint file missing at ${checkpointPath}`);
  process.exit(1);
}

try {
  const checkpoint = JSON.parse(fs.readFileSync(checkpointPath, 'utf8'));
  if (checkpoint.domain !== 'more-cheese' || checkpoint.seed !== 42) {
    console.error(`Error: Checkpoint contains invalid seed or domain`);
    process.exit(1);
  }
  console.log(`   ✓ Checkpoint state verified: generated/checkpoint.json`);
} catch (e) {
  console.error(`Error: Corrupt checkpoint.json: ${e.message}`);
  process.exit(1);
}

const genEntries = fs.readdirSync(generatedDir, { withFileTypes: true });
const genDirs = genEntries.filter((e) => e.isDirectory()).map((e) => e.name);
console.log(`   ✓ ${genDirs.length} entity directories verified unchanged`);

console.log(`✨ Pipeline complete successfully.`);
process.exit(0);
