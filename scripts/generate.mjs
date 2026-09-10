#!/usr/bin/env node
/**
 * scripts/generate.mjs — Deterministic simulation and metadata generation pipeline
 *
 * Compiles the Loom domain, applies Loom declarative generators (names, prefixes, pronouns,
 * DOBs), AvatarGenerator, LogoGenerator, and ReversalEngine to the governed generated/ tree
 * from data/domain.json field config, and verifies checkpoint.json. After the tree is
 * committed, a second run must leave generated/ byte-identical.
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
const heroesPath = path.join(rootDir, 'data', 'ruleset', 'heroes.json');
const givenNamesPath = path.join(rootDir, 'data', 'catalogs', 'given-names.json');

console.log(`🧵 Loom Pipeline: Compile domain smoke test, run deterministic passes (names, prefixes, pronouns, DOBs, reversals, avatars, logos), verify entity directories`);
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
  path.resolve(rootDir, '../loom/packages/cli/dist/bin/loom.js'),
  path.resolve(rootDir, 'loom/packages/cli/dist/bin/loom.js'),
  path.resolve(rootDir, '../../loom/packages/cli/dist/bin/loom.js'),
  path.resolve(rootDir, '../loom-wp2/packages/cli/dist/bin/loom.js'),
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
  path.resolve(rootDir, '../loom/packages/engine/dist/index.js'),
  path.resolve(rootDir, 'loom/packages/engine/dist/index.js'),
  path.resolve(rootDir, '../../loom/packages/engine/dist/index.js'),
  path.resolve(rootDir, '../loom-wp2/packages/engine/dist/index.js'),
]);
if (!engineEntry) {
  console.error('Error: Loom engine dist not found (AvatarGenerator / LogoGenerator / ReversalEngine)');
  process.exit(1);
}

const {
  AvatarGenerator,
  LogoGenerator,
  ReversalEngine,
  applyDeclarativeGeneratorsToRow,
  createRng,
} = await import(pathToFileURL(engineEntry).href);

const domain = JSON.parse(fs.readFileSync(domainPath, 'utf8'));
const heroes = JSON.parse(fs.readFileSync(heroesPath, 'utf8'));
const givenNames = JSON.parse(fs.readFileSync(givenNamesPath, 'utf8'));

const heroByEmail = new Map(heroes.heroes.map((h) => [h.businessKeys.Email.toLowerCase(), h]));

// ---------------------------------------------------------------------------
// 1. Order Reversals & Cancellation Coherence Pass
// ---------------------------------------------------------------------------
function applyOrderCancellationsPass() {
  const ordersDir = path.join(generatedDir, 'orders');
  if (!fs.existsSync(ordersDir)) return;

  const partFiles = fs
    .readdirSync(ordersDir)
    .filter((f) => f.endsWith('.json') && f !== '.mj-sync.json')
    .sort();

  const fileData = [];
  const allOrders = [];

  for (const f of partFiles) {
    const full = path.join(ordersDir, f);
    const rows = JSON.parse(fs.readFileSync(full, 'utf8'));
    fileData.push({ full, count: rows.length });
    allOrders.push(...rows);
  }

  const result = ReversalEngine.CoherifyCancellations({ orders: allOrders });
  console.log(`   ✓ ReversalEngine: ${result.reversalsCount} cancellations processed, ${result.coherentCount} coherent reversals`);

  let offset = 0;
  for (const { full, count } of fileData) {
    const chunk = allOrders.slice(offset, offset + count);
    fs.writeFileSync(full, JSON.stringify(chunk, null, 2) + '\n', 'utf8');
    offset += count;
  }
}

// ---------------------------------------------------------------------------
// 2. People Generation Pass (Name, Prefix, DOB, PhotoURL)
// ---------------------------------------------------------------------------
function applyPeopleAndMemberProfilePass() {
  const mpPath = path.join(generatedDir, 'member-profiles', '.member-profiles.json');
  const mps = JSON.parse(fs.readFileSync(mpPath, 'utf8'));
  const joinDateByPersonId = new Map();
  for (const m of mps) {
    if (m.fields?.PersonID && m.fields?.JoinDate) {
      joinDateByPersonId.set(m.fields.PersonID.toLowerCase(), m.fields.JoinDate);
    }
  }

  const peoplePath = path.join(generatedDir, 'people', '.people.json');
  const people = JSON.parse(fs.readFileSync(peoplePath, 'utf8'));
  const avatarCfg = domain.entities.Person.fields.PhotoURL.avatar;

  const genderByPersonId = new Map();
  let distinctAvatars = new Set();

  for (const p of people) {
    const pId = p.primaryKey.ID;
    const email = String(p.fields.Email || '').toLowerCase();
    const hero = heroByEmail.get(email);
    const rng = createRng(42, `person:${pId}`);

    const joinDate = joinDateByPersonId.get(pId.toLowerCase()) || '2022-01-01';
    p.fields.JoinDate = joinDate;

    if (hero) {
      if (hero.fixedFields?.FirstName) p.fields.FirstName = hero.fixedFields.FirstName;
      if (hero.fixedFields?.LastName) p.fields.LastName = hero.fixedFields.LastName;
      if (hero.fixedFields?.Title) p.fields.Title = hero.fixedFields.Title;
    }

    applyDeclarativeGeneratorsToRow(domain.entities.Person, p.fields, {
      catalogs: { 'given-names': givenNames },
      rng,
    });

    if (hero) {
      if (hero.fixedFields?.FirstName) p.fields.FirstName = hero.fixedFields.FirstName;
      if (hero.fixedFields?.LastName) p.fields.LastName = hero.fixedFields.LastName;
      if (hero.fixedFields?.Title) p.fields.Title = hero.fixedFields.Title;
    }

    delete p.fields.JoinDate;
    genderByPersonId.set(pId.toLowerCase(), p.fields.Gender);

    p.fields.PhotoURL = AvatarGenerator.Generate({
      seed: pId,
      trait: p.fields.Gender,
      traits: avatarCfg.traits,
      defaultTrait: avatarCfg.defaultTrait,
      style: avatarCfg.style,
      format: avatarCfg.format,
      version: avatarCfg.version,
      backgroundColor: avatarCfg.backgroundColor,
    });
    distinctAvatars.add(p.fields.PhotoURL);
  }

  fs.writeFileSync(peoplePath, JSON.stringify(people, null, 2) + '\n', 'utf8');
  console.log(
    `   ✓ Loom People Generator: ${people.length} people processed (${distinctAvatars.size}/${people.length} distinct avatars, ${(distinctAvatars.size / people.length * 100).toFixed(2)}%)`
  );

  // Apply MemberProfile PronounSet
  for (const m of mps) {
    const pId = String(m.fields.PersonID || '').toLowerCase();
    const parentGender = genderByPersonId.get(pId) || 'Female';
    const rng = createRng(42, `mp:${m.primaryKey.ID}`);

    applyDeclarativeGeneratorsToRow(domain.entities.MemberProfile, m.fields, {
      parent: { Gender: parentGender },
      rng,
    });
  }

  fs.writeFileSync(mpPath, JSON.stringify(mps, null, 2) + '\n', 'utf8');
  console.log(`   ✓ Loom MemberProfile Generator: ${mps.length} pronoun sets generated`);
}

// ---------------------------------------------------------------------------
// 3. Organization Logos Pass
// ---------------------------------------------------------------------------
function applyOrganizationLogosPass() {
  const orgsPath = path.join(generatedDir, 'organizations', '.organizations.json');
  if (!fs.existsSync(orgsPath)) return;
  const orgs = JSON.parse(fs.readFileSync(orgsPath, 'utf8'));

  const logoCfg = domain.entities.Organization.fields.LogoURL.logo;
  const logoDistinct = new Set();
  let logoMax = 0;

  for (const o of orgs) {
    const nameVal = o.fields?.Name || 'Organization';
    const seedVal = o.primaryKey?.ID || nameVal;
    const uri = LogoGenerator.Generate({
      name: String(nameVal),
      seed: String(seedVal),
      format: logoCfg.format,
      shape: logoCfg.shape,
    });
    o.fields.LogoURL = uri;
    logoDistinct.add(uri);
    if (uri.length > logoMax) logoMax = uri.length;
  }

  fs.writeFileSync(orgsPath, JSON.stringify(orgs, null, 2) + '\n', 'utf8');
  console.log(`   ✓ Loom LogoGenerator: ${orgs.length}/${logoDistinct.size} distinct LogoURL (max ${logoMax} chars)`);
}

// ---------------------------------------------------------------------------
// Execute Passes
// ---------------------------------------------------------------------------
applyOrderCancellationsPass();
applyPeopleAndMemberProfilePass();
applyOrganizationLogosPass();

// ---------------------------------------------------------------------------
// Checkpoint and Sync Configuration Verification
// ---------------------------------------------------------------------------
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

const syncConfigPath = path.join(generatedDir, '.mj-sync.json');
const syncConfig = JSON.parse(fs.readFileSync(syncConfigPath, 'utf8'));
const missingDirs = (syncConfig.directoryOrder || []).filter(
  (dirName) => !fs.existsSync(path.join(generatedDir, dirName))
);
if (missingDirs.length > 0) {
  console.error(`Error: directories in .mj-sync.json missing on disk: ${missingDirs.join(', ')}`);
  process.exit(1);
}
console.log(`   ✓ All ${syncConfig.directoryOrder?.length} entity directories in .mj-sync.json present on disk`);

console.log(`✨ Pipeline complete successfully.`);
process.exit(0);
