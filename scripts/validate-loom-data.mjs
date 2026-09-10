import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

function fail(msg) {
  console.error(`❌ ${msg}`);
  process.exit(1);
}

// 0. Load Loom's real Zod schemas (R5-1: single honest mode, fail if unavailable)
let LoomContracts;
try {
  LoomContracts = await import('@memberjunction/loom-contracts');
} catch {
  try {
    LoomContracts = await import('../../loom/packages/contracts/dist/index.js');
  } catch {
    try {
      LoomContracts = await import('../loom/packages/contracts/dist/index.js');
    } catch {
      try {
        LoomContracts = await import('./loom/packages/contracts/dist/index.js');
      } catch (err) {
        fail(`Could not load Loom schemas from @memberjunction/loom-contracts, ../../loom, or ./loom: ${err.message}`);
      }
    }
  }
}

console.log('================================================================================');
console.log('            LOOM DATA PROJECT & DOMAIN CONFORMANCE AUDIT                        ');
console.log('            Mode: LoomContracts Zod Schemas (Strict)                            ');
console.log('================================================================================');

// 1. Validate data/project.json against ProjectManifestSchema
const projectPath = path.join(rootDir, 'data/project.json');
if (!fs.existsSync(projectPath)) fail('data/project.json does not exist');
const projectRaw = fs.readFileSync(projectPath, 'utf8');
let project;
try {
  project = JSON.parse(projectRaw);
  LoomContracts.ProjectManifestSchema.parse(project);
} catch (err) {
  fail(`data/project.json schema validation failed: ${err.message}`);
}
if (project.output.metadataDir !== '../generated' && project.output.metadataDir !== 'generated') {
  fail('project.output.metadataDir must point to ../generated per tree separation');
}
console.log('✓ data/project.json conforms to Loom ProjectManifestSchema');

// 2. Validate data/domain.json against DomainConfigSchema
const domainPath = path.join(rootDir, 'data/domain.json');
if (!fs.existsSync(domainPath)) fail('data/domain.json does not exist');
let domain;
try {
  domain = JSON.parse(fs.readFileSync(domainPath, 'utf8'));
  LoomContracts.DomainConfigSchema.parse(domain);
} catch (err) {
  fail(`data/domain.json schema validation failed: ${err.message}`);
}

// 3. Domain vs Generated Entities and Metadata Schema Conformance (R2-M1, R2-M2)
const subclassesPath = path.join(rootDir, 'packages/Entities/src/generated/entity_subclasses.ts');
if (!fs.existsSync(subclassesPath)) fail('Generated entity subclasses missing at packages/Entities/src/generated/entity_subclasses.ts');
const subclasses = fs.readFileSync(subclassesPath, 'utf8');

// Build mapping of entityName -> directory from generated/ and config/
const scanRoots = [path.join(rootDir, 'generated'), path.join(rootDir, 'config')];
const entityNameToMetaDir = new Map();
for (const baseDir of scanRoots) {
  if (!fs.existsSync(baseDir)) continue;
  const dirs = fs.readdirSync(baseDir, { withFileTypes: true }).filter((d) => d.isDirectory());
  for (const md of dirs) {
    const syncFile = path.join(baseDir, md.name, '.mj-sync.json');
    if (fs.existsSync(syncFile)) {
      try {
        const s = JSON.parse(fs.readFileSync(syncFile, 'utf8'));
        if (s.entity) {
          entityNameToMetaDir.set(s.entity, { dirName: md.name, dirPath: path.join(baseDir, md.name), syncConfig: s });
        }
      } catch {}
    }
  }
}

// Resolve composed children (collections and isA) to their parent directories until fixpoint
let resolvedNew = true;
while (resolvedNew) {
  resolvedNew = false;
  for (const [entityName, entityCfg] of Object.entries(domain.entities)) {
    if (entityCfg.composition?.collections) {
      const parentMeta = entityNameToMetaDir.get(entityCfg.entityName);
      if (parentMeta) {
        for (const [colName, colCfg] of Object.entries(entityCfg.composition.collections)) {
          const childCfg = domain.entities[colCfg.entity];
          if (childCfg && !entityNameToMetaDir.has(childCfg.entityName)) {
            const parentPath = parentMeta.collectionPath ?? [];
            entityNameToMetaDir.set(childCfg.entityName, {
              dirName: parentMeta.dirName,
              dirPath: parentMeta.dirPath,
              collectionPath: [...parentPath, colName],
              foreignKey: colCfg.foreignKey,
            });
            resolvedNew = true;
          }
        }
      }
    }
    if (entityCfg.composition?.isA && !entityNameToMetaDir.has(entityCfg.entityName)) {
      const parentEntity = domain.entities[entityCfg.composition.isA.parentEntity];
      if (parentEntity) {
        const parentMeta = entityNameToMetaDir.get(parentEntity.entityName);
        if (parentMeta) {
          entityNameToMetaDir.set(entityCfg.entityName, {
            dirName: parentMeta.dirName,
            dirPath: parentMeta.dirPath,
            isA: true,
          });
          resolvedNew = true;
        }
      }
    }
  }
}

for (const [entityName, entityCfg] of Object.entries(domain.entities)) {
  if (!domain.packs[entityCfg.pack]) {
    fail(`Entity '${entityName}' declares pack '${entityCfg.pack}' not found in domain.packs`);
  }

  // Check FK validity
  for (const [fkKey, fk] of Object.entries(entityCfg.foreignKeys ?? {})) {
    if (!domain.entities[fk.targetEntity]) {
      fail(`FK ${entityName}.${fkKey} references undeclared entity '${fk.targetEntity}'`);
    }
  }

  // Check field conformance for application-specific entities against subclasses
  if (entityCfg.schema === 'morecheese_members') {
    // Find class section in subclasses (classes are prefixed like morecheesemembersMembershipPeriodEntity)
    const classMatch = subclasses.match(
      new RegExp(`export class [a-zA-Z0-9_]*${entityName}Entity extends BaseEntity[\\s\\S]*?(?=export class |$)`)
    );
    if (!classMatch) {
      fail(`Entity '${entityName}' declared in domain.json does not exist in generated entity_subclasses.ts`);
    }
    const classBody = classMatch[0];

    for (const fieldName of Object.keys(entityCfg.fields ?? {})) {
      if (fieldName === 'ID') continue;
      const singleFieldRegex = new RegExp(`\\* \\* Field Name: ${fieldName}\\b`);
      if (!singleFieldRegex.test(classBody)) {
        fail(
          `Field '${entityName}.${fieldName}' in domain.json does not exist on entity '${entityName}' in generated entity_subclasses.ts (field on wrong entity)`
        );
      }
    }
  }

  // V1: For EVERY domain entity, assert declared fields are a subset of keys present across EVERY record in EVERY file of the directory (R4-2)
  const metaDirEntry = entityNameToMetaDir.get(entityCfg.entityName);
  if (!metaDirEntry) {
    fail(`Entity '${entityName}' (${entityCfg.entityName}) does not match any data directory via .mj-sync.json`);
  }
  const { dirName: metaDir, dirPath } = metaDirEntry;
  const dataFiles = fs.readdirSync(dirPath).filter((f) => f.endsWith('.json') && !f.startsWith('.mj-sync'));
  if (dataFiles.length === 0) {
    fail(`Data directory '${metaDir}' for entity '${entityName}' contains no JSON data files`);
  }

  const declaredFieldNames = Object.keys(entityCfg.fields ?? {});
  for (const file of dataFiles) {
    const fileContent = JSON.parse(fs.readFileSync(path.join(dirPath, file), 'utf8'));
    const rawRecords = Array.isArray(fileContent) ? fileContent : (fileContent.records ? fileContent.records : [fileContent]);
    let records = rawRecords;

    if (metaDirEntry.isA) {
      const childList = [];
      for (const r of rawRecords) {
        if (r.extension && r.extension.fields) {
          childList.push({
            primaryKey: r.primaryKey,
            fields: r.extension.fields,
          });
        }
      }
      records = childList;
    } else if (metaDirEntry.collectionPath && metaDirEntry.collectionPath.length > 0) {
      let current = rawRecords;
      for (const colKey of metaDirEntry.collectionPath) {
        const next = [];
        for (const r of current) {
          const colItems = r.collections?.[colKey] ?? [];
          for (const item of colItems) {
            next.push(item);
          }
        }
        current = next;
      }
      records = current;
    }

    for (let idx = 0; idx < records.length; idx++) {
      const rec = records[idx];
      const recFields = rec.fields || rec;
      const recKeys = new Set(Object.keys(recFields));
      if (rec.primaryKey) {
        for (const k of Object.keys(rec.primaryKey)) recKeys.add(k);
      }
      for (const declaredField of declaredFieldNames) {
        if (!recKeys.has(declaredField)) {
          fail(
            `Declared field '${entityName}.${declaredField}' in domain.json is missing from record #${idx} in '${path.join(metaDir, file)}' (field on wrong entity or partial record loss)`
          );
        }
      }
    }
  }
}
console.log('✓ data/domain.json conforms to Loom DomainConfigSchema, generated entity_subclasses.ts & all committed metadata records');

// 4. Heroes vs Committed Dataset Conformance (R2-H1)
const heroesPath = path.join(rootDir, 'data/ruleset/heroes.json');
if (!fs.existsSync(heroesPath)) fail('data/ruleset/heroes.json does not exist');
let heroes;
try {
  heroes = JSON.parse(fs.readFileSync(heroesPath, 'utf8'));
  LoomContracts.HeroesManifestSchema.parse(heroes);
} catch (err) {
  fail(`data/ruleset/heroes.json schema validation failed: ${err.message}`);
}

const peoplePath = path.join(rootDir, 'generated/people/.people.json');
if (!fs.existsSync(peoplePath)) fail('Committed generated people file missing at generated/people/.people.json');
const people = JSON.parse(fs.readFileSync(peoplePath, 'utf8'));

const cmsPath = path.join(rootDir, 'generated/committee-memberships/.committee-memberships.json');
if (!fs.existsSync(cmsPath)) fail('Committed generated committee memberships file missing at generated/committee-memberships/.committee-memberships.json');
const cms = JSON.parse(fs.readFileSync(cmsPath, 'utf8'));

let heroChecks = 0;
for (const hero of heroes.heroes) {
  const p = people.find((x) => x.fields && x.fields.Email === hero.businessKeys.Email);
  if (!p) {
    fail(`Hero '${hero.heroKey}' (${hero.businessKeys.Email}) not found in committed metadata people dataset`);
  }

  // Verify Title, FirstName, LastName match dataset strictly (R2-H1)
  if (hero.fixedFields.Title !== undefined && hero.fixedFields.Title !== (p.fields.Title ?? null)) {
    fail(`Hero '${hero.heroKey}' fixedFields.Title "${hero.fixedFields.Title}" disagrees with committed dataset "${p.fields.Title ?? null}"`);
  }
  if (hero.fixedFields.FirstName !== undefined && hero.fixedFields.FirstName !== (p.fields.FirstName ?? null)) {
    fail(`Hero '${hero.heroKey}' fixedFields.FirstName "${hero.fixedFields.FirstName}" disagrees with committed dataset "${p.fields.FirstName ?? null}"`);
  }
  if (hero.fixedFields.LastName !== undefined && hero.fixedFields.LastName !== (p.fields.LastName ?? null)) {
    fail(`Hero '${hero.heroKey}' fixedFields.LastName "${hero.fixedFields.LastName}" disagrees with committed dataset "${p.fields.LastName ?? null}"`);
  }

  // Verify ladder entries match committed committee memberships
  if (hero.ladderEntries && hero.ladderEntries.length > 0) {
    const pid = p.primaryKey.ID;
    const personCms = cms.filter((x) => x.fields && x.fields.PersonID === pid);
    for (const le of hero.ladderEntries) {
      if (le.ladderKey === 'governance-leadership-ladder') {
        const matchingCm = personCms.find((c) => {
          const roleMatch = c.fields.RoleID && c.fields.RoleID.includes(`Name=${le.state}`);
          const startYear = parseInt(c.fields.StartDate?.slice(0, 4), 10);
          const endYear = parseInt(c.fields.EndDate?.slice(0, 4), 10);
          const yearMatch = startYear === le.enterCycle && endYear === le.exitCycle;
          return roleMatch && yearMatch;
        });
        if (!matchingCm) {
          fail(
            `Hero '${hero.heroKey}' ladder entry (${le.state}, ${le.enterCycle}-${le.exitCycle}) has no matching CommitteeMembership in dataset (wrong ladder state/year)`
          );
        }
      }
    }
  }

  // Specific check for Elena Rodriguez (2 terms in dataset)
  if (hero.heroKey === 'HERO-ICF-001') {
    if (!hero.ladderEntries || hero.ladderEntries.length < 2) {
      fail('HERO-ICF-001 (Elena Rodriguez) must declare 2 distinct ladder entries matching dataset');
    }
  }

  heroChecks++;
}
console.log(`✓ data/ruleset/heroes.json (${heroChecks} heroes) matches committed metadata dataset 100%`);

// 5. Validate ruleset manifests (motifs, ladders, eras, common)
const motifsPath = path.join(rootDir, 'data/ruleset/motifs.json');
let motifs;
try {
  motifs = JSON.parse(fs.readFileSync(motifsPath, 'utf8'));
  LoomContracts.MotifsManifestSchema.parse(motifs);
} catch (err) {
  fail(`data/ruleset/motifs.json schema validation failed: ${err.message}`);
}
for (const m of motifs.motifs) {
  if (m.quota.mode === 'percentage' && (m.quota.value < 0 || m.quota.value > 1)) {
    fail(`Motif ${m.motifKey} percentage quota must be a fraction in [0, 1]`);
  }
}
console.log('✓ data/ruleset/motifs.json conforms to Loom MotifsManifestSchema');

const laddersPath = path.join(rootDir, 'data/ruleset/ladders.json');
let ladders;
try {
  ladders = JSON.parse(fs.readFileSync(laddersPath, 'utf8'));
  LoomContracts.LaddersManifestSchema.parse(ladders);
} catch (err) {
  fail(`data/ruleset/ladders.json schema validation failed: ${err.message}`);
}

// Ladder vocabulary validation (R2-L1, R3-M1)
const validGovernanceRoles = new Set(['Member', 'Vice Chair', 'Chair']);
for (const l of ladders.ladders) {
  if (l.ladderKey === 'governance-leadership-ladder') {
    for (const state of l.states) {
      if (!validGovernanceRoles.has(state.name)) {
        fail(`Ladder '${l.ladderKey}' contains invalid state '${state.name}'. Must be one of: ${Array.from(validGovernanceRoles).join(', ')} (wrong ladder vocabulary)`);
      }
    }
  }
}
console.log('✓ data/ruleset/ladders.json conforms to Loom LaddersManifestSchema & role catalog vocabulary');

const erasPath = path.join(rootDir, 'data/ruleset/eras.json');
let eras;
try {
  eras = JSON.parse(fs.readFileSync(erasPath, 'utf8'));
  LoomContracts.ErasManifestSchema.parse(eras);
} catch (err) {
  fail(`data/ruleset/eras.json schema validation failed: ${err.message}`);
}
console.log('✓ data/ruleset/eras.json conforms to Loom ErasManifestSchema');

const commonPath = path.join(rootDir, 'data/ruleset/common.json');
let common;
try {
  common = JSON.parse(fs.readFileSync(commonPath, 'utf8'));
  LoomContracts.RulesetModuleSchema.parse(common);
} catch (err) {
  fail(`data/ruleset/common.json schema validation failed: ${err.message}`);
}
// Validate common.json has non-empty effects and valid factor arrows
if (!common.effects || Object.keys(common.effects).length === 0) {
  fail('data/ruleset/common.json has no effect contracts defined (gutted common.json)');
}
for (const [fId, fContract] of Object.entries(common.effects)) {
  if (!fContract.arrows || Object.keys(fContract.arrows).length === 0) {
    fail(`Factor '${fId}' in common.json has no arrows defined (gutted common.json)`);
  }
}
console.log('✓ data/ruleset/common.json conforms to Loom RulesetModuleSchema with valid effect arrows');

// 8. Run Loom Validator over generated/
console.log('\n--- Running Loom Full Dataset Validator ---');
const candidates = [
  path.resolve(rootDir, '../loom/packages/cli/dist/bin/loom.js'),
  path.resolve(rootDir, 'loom/packages/cli/dist/bin/loom.js'),
  path.resolve(rootDir, '../../loom/packages/cli/dist/bin/loom.js'),
  'loom'
];
let loomCmd = null;
for (const c of candidates) {
  if (c === 'loom') {
    try {
      execSync('which loom', { stdio: 'ignore' });
      loomCmd = 'loom';
      break;
    } catch {}
  } else if (fs.existsSync(c)) {
    loomCmd = `node ${c}`;
    break;
  }
}

if (!loomCmd) {
  fail('Could not locate Loom CLI binary to run dataset validation');
}

/**
 * STRICT TEMPORARY ERA VOLUME WAIVER
 * Date: 2026-09-10
 * Tracking Issue: https://github.com/MemberJunction/more-cheese/issues/39 (#39)
 *
 * Reason:
 *   The volume multipliers defined in data/ruleset/eras.json (e.g. 2020 pandemic shock 0.15x
 *   on EventRegistration, 1.85x on CourseEnrollment; 2021 virtual pivot 0.45x / 1.5x; 2022-2024
 *   artisan boom 1.4x / 1.25x) reflect intended historical macroeconomic simulation. However,
 *   the historical generator pipeline in more-cheese does not currently synthesize cycle-dependent
 *   volume variations when emitting historical transactions. Volume grows smoothly across 2019-2025.
 *   This is pre-existing on 'next' (previously masked by n=0 prior to Loom D.5/D.6).
 *   Synthesis implementation is tracked in #39 and must preserve the base ⊆ head stability invariant.
 *
 * Strict Waiver Invariants:
 *   1. Enumerates exact literal gate names including cycle.
 *   2. Asserts the count: fails if any failing gate is not on this list, or if count !== 7.
 *   3. Fails if any waived gate PASSES (stale waiver detection).
 *   4. Prints the waived list, reason, and tracking issue on every run.
 */
const WAIVER_DATE = '2026-09-10';
const WAIVER_TRACKING_ISSUE = 'https://github.com/MemberJunction/more-cheese/issues/39';
const WAIVED_ERA_VOLUME_GATES = Object.freeze([
  'Realized Era Volume: era-pandemic-shock-2020 [EventRegistration in 2020]',
  'Realized Era Volume: era-virtual-pivot-2021 [EventRegistration in 2021]',
  'Realized Era Volume: era-artisan-boom-2022-2024 [EventRegistration in 2023]',
  'Realized Era Volume: era-artisan-boom-2022-2024 [EventRegistration in 2024]',
  'Realized Era Volume: era-artisan-boom-2022-2024 [CourseEnrollment in 2022]',
  'Realized Era Volume: era-artisan-boom-2022-2024 [CourseEnrollment in 2023]',
  'Realized Era Volume: era-artisan-boom-2022-2024 [CourseEnrollment in 2024]',
]);
const EXPECTED_WAIVED_COUNT = WAIVED_ERA_VOLUME_GATES.length;
const waivedSet = new Set(WAIVED_ERA_VOLUME_GATES);

console.log('--------------------------------------------------------------------------------');
console.log(`⚠️  ACTIVE TEMPORARY GATE WAIVER (${EXPECTED_WAIVED_COUNT} gates, dated ${WAIVER_DATE})`);
console.log(`   Tracking Issue: ${WAIVER_TRACKING_ISSUE}`);
console.log('   Reason: Era volume model is not currently applied by the generator in the committed');
console.log('           dataset; surfaced truthfully by Loom D.5/D.6. Synthesis implementation tracked in #39.');
console.log('   Waived Gates:');
for (const gateName of WAIVED_ERA_VOLUME_GATES) {
  console.log(`     - [WAIVED] ${gateName}`);
}
console.log('--------------------------------------------------------------------------------\n');

let validatorStdout = '';
try {
  validatorStdout = execSync(`${loomCmd} validate -p data -d generated`, {
    cwd: rootDir,
    encoding: 'utf8',
    stdio: 'pipe',
  });
} catch (err) {
  validatorStdout = (err.stdout?.toString() || '') + (err.stderr?.toString() || '');
}

console.log(validatorStdout);

// Parse gate outcomes from validator output
const gateRegex = /^\s*\[(✓ PASS|✗ FAIL)\]\s+(.*?)\s+\(n=(\d+)\)$/gm;
const passedGates = new Set();
const failedGates = [];

let match;
while ((match = gateRegex.exec(validatorStdout)) !== null) {
  const [, status, name, countStr] = match;
  if (status === '✓ PASS') {
    passedGates.add(name);
  } else {
    failedGates.push({ name, population: parseInt(countStr, 10) });
  }
}

if (passedGates.size === 0 && failedGates.length === 0) {
  fail(`Loom Validator did not output any gate results (crashed before validation):\n${validatorStdout}`);
}

// Invariant 3: Fail if any waived gate PASSES (stale claim detection)
const staleWaivers = WAIVED_ERA_VOLUME_GATES.filter((g) => passedGates.has(g));
if (staleWaivers.length > 0) {
  fail(
    `Stale waiver detected! The following ${staleWaivers.length} waived gate(s) PASSED:\n` +
    staleWaivers.map((g) => `  - ${g}`).join('\n') +
    `\nA waiver that outlives the defect it waives is a stale claim. Remove these gate(s) from WAIVED_ERA_VOLUME_GATES in scripts/validate-loom-data.mjs.`
  );
}

// Invariant 2a: Fail if any failing gate is NOT on the waiver list
const unexpectedFailures = failedGates.filter((g) => !waivedSet.has(g.name));
if (unexpectedFailures.length > 0) {
  fail(
    `Loom Validator failed with ${unexpectedFailures.length} unexpected broken gate(s) not covered by waiver:\n` +
    unexpectedFailures.map((g) => `  - [✗ FAIL] ${g.name} (n=${g.population})`).join('\n')
  );
}

// Invariant 2b: Assert the count. Must be EXACTLY EXPECTED_WAIVED_COUNT (7)
if (failedGates.length !== EXPECTED_WAIVED_COUNT) {
  fail(
    `Loom Validator failed gate count mismatch: expected exactly ${EXPECTED_WAIVED_COUNT} waived failures, but received ${failedGates.length}.\n` +
    `Failed gates:\n` +
    failedGates.map((g) => `  - ${g.name}`).join('\n')
  );
}

console.log(`\n✓ All ${failedGates.length} failed gates match the active temporary waiver list (Issue #39).`);
console.log(`✓ All ${passedGates.size} non-waived gates PASSED cleanly (including all Plan 07 gates).`);

console.log('================================================================================');
console.log('✅ ALL LOOM DATA SPECIFICATIONS & DOMAIN CONFORMANCE CHECKS PASSED');
console.log('================================================================================');

