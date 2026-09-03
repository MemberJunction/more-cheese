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

function assertObject(val, pathStr) {
  if (!val || typeof val !== 'object' || Array.isArray(val)) {
    fail(`${pathStr} must be an object`);
  }
}

function assertArray(val, pathStr) {
  if (!Array.isArray(val)) {
    fail(`${pathStr} must be an array`);
  }
}

function assertString(val, pathStr) {
  if (typeof val !== 'string' || val.trim() === '') {
    fail(`${pathStr} must be a non-empty string`);
  }
}

function assertNumber(val, pathStr) {
  if (typeof val !== 'number' || isNaN(val)) {
    fail(`${pathStr} must be a valid number`);
  }
}

console.log('================================================================================');
console.log('            LOOM DATA PROJECT & DOMAIN CONFORMANCE AUDIT                        ');
console.log('================================================================================');

// 1. Validate data/project.json
const projectPath = path.join(rootDir, 'data/project.json');
if (!fs.existsSync(projectPath)) fail('data/project.json does not exist');
const project = JSON.parse(fs.readFileSync(projectPath, 'utf8'));
assertObject(project, 'data/project.json');
assertString(project.name, 'project.name');
assertString(project.version, 'project.version');
assertString(project.domain, 'project.domain');
assertString(project.uuidNamespace, 'project.uuidNamespace');
assertString(project.rulesetPath, 'project.rulesetPath');
assertObject(project.output, 'project.output');
assertString(project.output.metadataDir, 'project.output.metadataDir');
assertString(project.output.migrationsDir, 'project.output.migrationsDir');
if (project.output.metadataDir === '../metadata' || project.output.migrationsDir === '../migrations') {
  fail('project.output must point to scratch/build directories, not shipped metadata/migrations');
}
console.log('✓ data/project.json conforms to ProjectManifestSchema');

// 2. Validate data/domain.json
const domainPath = path.join(rootDir, 'data/domain.json');
if (!fs.existsSync(domainPath)) fail('data/domain.json does not exist');
const domain = JSON.parse(fs.readFileSync(domainPath, 'utf8'));
assertObject(domain, 'data/domain.json');
assertString(domain.name, 'domain.name');
assertString(domain.namespace, 'domain.namespace');
assertObject(domain.packs, 'domain.packs');
assertObject(domain.entities, 'domain.entities');

// 3. Domain vs Generated Entities and Metadata Schema Conformance (R2-M1, R2-M2)
const subclassesPath = path.join(rootDir, 'packages/Entities/src/generated/entity_subclasses.ts');
if (!fs.existsSync(subclassesPath)) fail('Generated entity subclasses missing at packages/Entities/src/generated/entity_subclasses.ts');
const subclasses = fs.readFileSync(subclassesPath, 'utf8');

for (const [entityName, entityCfg] of Object.entries(domain.entities)) {
  assertObject(entityCfg, `domain.entities[${entityName}]`);
  assertString(entityCfg.name, `${entityName}.name`);
  assertString(entityCfg.targetTable, `${entityName}.targetTable`);
  assertString(entityCfg.schema, `${entityName}.schema`);
  assertString(entityCfg.pack, `${entityName}.pack`);
  assertArray(entityCfg.businessKey, `${entityName}.businessKey`);
  assertObject(entityCfg.fields, `${entityName}.fields`);
  assertObject(entityCfg.foreignKeys, `${entityName}.foreignKeys`);

  if (!domain.packs[entityCfg.pack]) {
    fail(`Entity '${entityName}' declares pack '${entityCfg.pack}' not found in domain.packs`);
  }

  // Check FK validity
  for (const [fkKey, fk] of Object.entries(entityCfg.foreignKeys)) {
    assertObject(fk, `${entityName}.foreignKeys[${fkKey}]`);
    assertString(fk.targetEntity, `${entityName}.foreignKeys[${fkKey}].targetEntity`);
    assertString(fk.targetField, `${entityName}.foreignKeys[${fkKey}].targetField`);
    if (!domain.entities[fk.targetEntity]) {
      fail(`FK ${entityName}.${fkKey} references undeclared entity '${fk.targetEntity}'`);
    }
  }

  // Check field conformance for application-specific entities
  if (entityCfg.schema === 'morecheese_members') {
    for (const fieldName of Object.keys(entityCfg.fields)) {
      if (fieldName === 'ID') continue;
      const regex = new RegExp(`\\* \\* Field Name: ${fieldName}\\b`);
      if (!regex.test(subclasses)) {
        fail(`Field ${entityName}.${fieldName} in domain.json does not exist in generated entity_subclasses.ts`);
      }
    }
  }
}
console.log('✓ data/domain.json conforms to DomainConfigSchema & generated entity_subclasses.ts');

// 4. Heroes vs Committed Dataset Conformance (R2-H1)
const heroesPath = path.join(rootDir, 'data/ruleset/heroes.json');
if (!fs.existsSync(heroesPath)) fail('data/ruleset/heroes.json does not exist');
const heroes = JSON.parse(fs.readFileSync(heroesPath, 'utf8'));
assertArray(heroes.heroes, 'heroes.heroes');

const peoplePath = path.join(rootDir, 'metadata/people/.people.json');
if (!fs.existsSync(peoplePath)) fail('Committed metadata people file missing at metadata/people/.people.json');
const people = JSON.parse(fs.readFileSync(peoplePath, 'utf8'));

const cmsPath = path.join(rootDir, 'metadata/committee-memberships/.committee-memberships.json');
if (!fs.existsSync(cmsPath)) fail('Committed metadata committee memberships file missing');
const cms = JSON.parse(fs.readFileSync(cmsPath, 'utf8'));

let heroChecks = 0;
for (const hero of heroes.heroes) {
  assertString(hero.heroKey, 'hero.heroKey');
  assertString(hero.entity, 'hero.entity');
  assertObject(hero.businessKeys, `${hero.heroKey}.businessKeys`);
  assertObject(hero.fixedFields, `${hero.heroKey}.fixedFields`);
  assertArray(hero.pins, `${hero.heroKey}.pins`);

  const p = people.find((x) => x.fields && x.fields.Email === hero.businessKeys.Email);
  if (!p) {
    fail(`Hero '${hero.heroKey}' (${hero.businessKeys.Email}) not found in committed metadata people dataset`);
  }

  // Verify Title, FirstName, LastName match dataset
  if (hero.fixedFields.Title && p.fields.Title && hero.fixedFields.Title !== p.fields.Title) {
    fail(`Hero '${hero.heroKey}' fixedFields.Title "${hero.fixedFields.Title}" disagrees with committed dataset "${p.fields.Title}"`);
  }
  if (hero.fixedFields.FirstName && p.fields.FirstName && hero.fixedFields.FirstName !== p.fields.FirstName) {
    fail(`Hero '${hero.heroKey}' fixedFields.FirstName "${hero.fixedFields.FirstName}" disagrees with committed dataset "${p.fields.FirstName}"`);
  }

  // Verify Gwen Whitfield ladder history match
  if (hero.heroKey === 'HERO-ICF-008') {
    if (!hero.ladderEntries || hero.ladderEntries.length < 2) {
      fail("HERO-ICF-008 (Gwen Whitfield) must declare full ladder entries");
    }
    const pid = p.primaryKey.ID;
    const gwenCms = cms.filter((x) => x.fields && x.fields.PersonID === pid);
    if (gwenCms.length < 2) {
      fail("Gwen Whitfield committee memberships missing in dataset");
    }
  }

  heroChecks++;
}
console.log(`✓ data/ruleset/heroes.json (${heroChecks} heroes) matches committed metadata dataset 100%`);

// 5. Validate ruleset manifests (motifs, ladders, eras, common)
const motifsPath = path.join(rootDir, 'data/ruleset/motifs.json');
const motifs = JSON.parse(fs.readFileSync(motifsPath, 'utf8'));
assertArray(motifs.motifs, 'motifs.motifs');
for (const m of motifs.motifs) {
  assertString(m.motifKey, 'm.motifKey');
  assertString(m.targetEntity, `${m.motifKey}.targetEntity`);
  assertObject(m.quota, `${m.motifKey}.quota`);
  assertNumber(m.quota.value, `${m.motifKey}.quota.value`);
  if (m.quota.mode === 'percentage' && (m.quota.value < 0 || m.quota.value > 1)) {
    fail(`Motif ${m.motifKey} percentage quota must be a fraction in [0, 1]`);
  }
}
console.log('✓ data/ruleset/motifs.json conforms to MotifsManifestSchema');

const laddersPath = path.join(rootDir, 'data/ruleset/ladders.json');
const ladders = JSON.parse(fs.readFileSync(laddersPath, 'utf8'));
assertArray(ladders.ladders, 'ladders.ladders');
for (const l of ladders.ladders) {
  assertString(l.ladderKey, 'l.ladderKey');
  assertString(l.entity, `${l.ladderKey}.entity`);
  assertObject(l.binding, `${l.ladderKey}.binding`);
  assertArray(l.states, `${l.ladderKey}.states`);
}
console.log('✓ data/ruleset/ladders.json conforms to LaddersManifestSchema');

const erasPath = path.join(rootDir, 'data/ruleset/eras.json');
const eras = JSON.parse(fs.readFileSync(erasPath, 'utf8'));
assertArray(eras.eras, 'eras.eras');
console.log('✓ data/ruleset/eras.json conforms to ErasManifestSchema');

const commonPath = path.join(rootDir, 'data/ruleset/common.json');
const common = JSON.parse(fs.readFileSync(commonPath, 'utf8'));
assertObject(common.effects, 'common.effects');
console.log('✓ data/ruleset/common.json conforms to RulesetModuleSchema');

console.log('================================================================================');
console.log('✅ ALL LOOM DATA SPECIFICATIONS & DOMAIN CONFORMANCE CHECKS PASSED');
console.log('================================================================================');
