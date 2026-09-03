import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

function fail(msg) {
  console.error(`❌ ${msg}`);
  process.exit(1);
}

// 0. Load Loom's real Zod schemas
let LoomContracts;
try {
  LoomContracts = await import('@memberjunction/loom-contracts');
} catch {
  try {
    LoomContracts = await import('../../loom/packages/contracts/dist/index.js');
  } catch (err) {
    fail(`Could not load Loom schemas from @memberjunction/loom-contracts or ../../loom/packages/contracts: ${err.message}`);
  }
}

console.log('================================================================================');
console.log('            LOOM DATA PROJECT & DOMAIN CONFORMANCE AUDIT                        ');
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
if (project.output.metadataDir === '../metadata' || project.output.migrationsDir === '../migrations') {
  fail('project.output must point to scratch/build directories, not shipped metadata/migrations');
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
}
console.log('✓ data/domain.json conforms to Loom DomainConfigSchema & generated entity_subclasses.ts');

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

const peoplePath = path.join(rootDir, 'metadata/people/.people.json');
if (!fs.existsSync(peoplePath)) fail('Committed metadata people file missing at metadata/people/.people.json');
const people = JSON.parse(fs.readFileSync(peoplePath, 'utf8'));

const cmsPath = path.join(rootDir, 'metadata/committee-memberships/.committee-memberships.json');
if (!fs.existsSync(cmsPath)) fail('Committed metadata committee memberships file missing');
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
        // Find corresponding committee membership matching role and year span
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

console.log('================================================================================');
console.log('✅ ALL LOOM DATA SPECIFICATIONS & DOMAIN CONFORMANCE CHECKS PASSED');
console.log('================================================================================');
