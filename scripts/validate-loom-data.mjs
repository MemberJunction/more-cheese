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
assertObject(domain.entities, 'domain.entities');
assertObject(domain.packs, 'domain.packs');

for (const [entityName, entity] of Object.entries(domain.entities)) {
  assertString(entity.name, `domain.entities.${entityName}.name`);
  assertString(entity.targetTable, `domain.entities.${entityName}.targetTable`);
  assertString(entity.schema, `domain.entities.${entityName}.schema`);
  assertString(entity.pack, `domain.entities.${entityName}.pack`);
  assertArray(entity.businessKey, `domain.entities.${entityName}.businessKey`);
  if (entity.businessKey.length === 0) fail(`domain.entities.${entityName}.businessKey must not be empty`);
  assertObject(entity.fields, `domain.entities.${entityName}.fields`);

  for (const [fieldName, field] of Object.entries(entity.fields)) {
    assertString(field.name, `entity.${entityName}.fields.${fieldName}.name`);
    assertString(field.type, `entity.${entityName}.fields.${fieldName}.type`);
  }

  if (entity.foreignKeys) {
    assertObject(entity.foreignKeys, `domain.entities.${entityName}.foreignKeys`);
    for (const [fkName, fk] of Object.entries(entity.foreignKeys)) {
      assertString(fk.targetEntity, `foreignKey.${entityName}.${fkName}.targetEntity`);
      assertString(fk.targetField, `foreignKey.${entityName}.${fkName}.targetField`);
      assertString(fk.cardinality, `foreignKey.${entityName}.${fkName}.cardinality`);
    }
  }
}
console.log(`✓ data/domain.json conforms to DomainConfigSchema (${Object.keys(domain.entities).length} entities)`);

// 3. Validate data/ruleset/heroes.json
const heroesPath = path.join(rootDir, 'data/ruleset/heroes.json');
if (!fs.existsSync(heroesPath)) fail('data/ruleset/heroes.json does not exist');
const heroesDoc = JSON.parse(fs.readFileSync(heroesPath, 'utf8'));
assertArray(heroesDoc.heroes, 'heroesDoc.heroes');

const allowedHeroKeys = new Set([
  'heroKey',
  'entity',
  'businessKeys',
  'fixedFields',
  'birthCycle',
  'latentDials',
  'ladderEntries',
  'eras',
  'pins',
  'description',
]);

for (const hero of heroesDoc.heroes) {
  for (const k of Object.keys(hero)) {
    if (!allowedHeroKeys.has(k)) {
      fail(`Hero '${hero.heroKey}' contains unauthorized key '${k}' under strict schema`);
    }
  }

  assertString(hero.heroKey, 'hero.heroKey');
  assertString(hero.entity, `hero.${hero.heroKey}.entity`);
  assertObject(hero.businessKeys, `hero.${hero.heroKey}.businessKeys`);

  const entityCfg = domain.entities[hero.entity];
  if (!entityCfg) fail(`Hero '${hero.heroKey}': unknown entity '${hero.entity}'`);

  if (hero.fixedFields) {
    for (const field of Object.keys(hero.fixedFields)) {
      if (!entityCfg.fields[field]) {
        fail(`Hero '${hero.heroKey}': unknown field '${hero.entity}.${field}' in fixedFields`);
      }
    }
  }

  if (hero.pins) {
    for (const pin of hero.pins) {
      if (!pin.kind) fail(`Hero '${hero.heroKey}': pin missing 'kind'`);
      if (pin.kind === 'field') {
        if (!entityCfg.fields[pin.field]) {
          fail(`Hero '${hero.heroKey}': unknown field '${hero.entity}.${pin.field}' in field pin`);
        }
      } else if (pin.kind === 'feature') {
        const targetEntity = pin.feature.from === 'self' ? hero.entity : pin.feature.from;
        const targetCfg = domain.entities[targetEntity];
        if (!targetCfg) fail(`Hero '${hero.heroKey}': unknown target entity '${targetEntity}' in feature pin`);
        if (pin.feature.field && !targetCfg.fields[pin.feature.field]) {
          fail(`Hero '${hero.heroKey}': unknown field '${targetEntity}.${pin.feature.field}' in feature pin`);
        }
      }
    }
  }
}
console.log(`✓ data/ruleset/heroes.json conforms to schema and domain (${heroesDoc.heroes.length} heroes)`);

// 4. Validate data/ruleset/motifs.json
const motifsPath = path.join(rootDir, 'data/ruleset/motifs.json');
if (!fs.existsSync(motifsPath)) fail('data/ruleset/motifs.json does not exist');
const motifsDoc = JSON.parse(fs.readFileSync(motifsPath, 'utf8'));
assertArray(motifsDoc.motifs, 'motifsDoc.motifs');

for (const motif of motifsDoc.motifs) {
  assertString(motif.motifKey, 'motif.motifKey');
  assertString(motif.targetEntity, `motif.${motif.motifKey}.targetEntity`);
  if (!domain.entities[motif.targetEntity]) {
    fail(`Motif '${motif.motifKey}': unknown target entity '${motif.targetEntity}'`);
  }

  assertObject(motif.quota, `motif.${motif.motifKey}.quota`);
  assertString(motif.quota.mode, `motif.${motif.motifKey}.quota.mode`);
  assertNumber(motif.quota.value, `motif.${motif.motifKey}.quota.value`);
  if (motif.quota.mode === 'percentage' && (motif.quota.value < 0 || motif.quota.value > 1)) {
    fail(`Motif '${motif.motifKey}': percentage quota value must be a fraction in [0, 1] (got ${motif.quota.value})`);
  }

  if (motif.childRates) {
    for (const cr of motif.childRates) {
      if (!domain.entities[cr.entity]) {
        fail(`Motif '${motif.motifKey}': unknown child entity '${cr.entity}' in childRates`);
      }
    }
  }
}
console.log(`✓ data/ruleset/motifs.json conforms to schema and domain (${motifsDoc.motifs.length} motifs)`);

// 5. Validate data/ruleset/ladders.json
const laddersPath = path.join(rootDir, 'data/ruleset/ladders.json');
if (!fs.existsSync(laddersPath)) fail('data/ruleset/ladders.json does not exist');
const laddersDoc = JSON.parse(fs.readFileSync(laddersPath, 'utf8'));
assertArray(laddersDoc.ladders, 'laddersDoc.ladders');

for (const ladder of laddersDoc.ladders) {
  assertString(ladder.ladderKey, 'ladder.ladderKey');
  assertString(ladder.entity, `ladder.${ladder.ladderKey}.entity`);
  if (!domain.entities[ladder.entity]) fail(`Ladder '${ladder.ladderKey}': unknown entity '${ladder.entity}'`);

  assertObject(ladder.binding, `ladder.${ladder.ladderKey}.binding`);
  if (ladder.binding.mode === 'childEntity') {
    assertString(ladder.binding.childEntity, `ladder.${ladder.ladderKey}.binding.childEntity`);
    assertString(ladder.binding.foreignKey, `ladder.${ladder.ladderKey}.binding.foreignKey`);
    assertString(ladder.binding.stateField, `ladder.${ladder.ladderKey}.binding.stateField`);

    const childCfg = domain.entities[ladder.binding.childEntity];
    if (!childCfg) fail(`Ladder '${ladder.ladderKey}': unknown child entity '${ladder.binding.childEntity}'`);
    if (!childCfg.fields[ladder.binding.foreignKey]) {
      fail(`Ladder '${ladder.ladderKey}': unknown foreign key '${ladder.binding.childEntity}.${ladder.binding.foreignKey}'`);
    }
    if (!childCfg.fields[ladder.binding.stateField]) {
      fail(`Ladder '${ladder.ladderKey}': unknown state field '${ladder.binding.childEntity}.${ladder.binding.stateField}'`);
    }
  }
}
console.log(`✓ data/ruleset/ladders.json conforms to schema and domain (${laddersDoc.ladders.length} ladders)`);

// 6. Validate data/ruleset/eras.json
const erasPath = path.join(rootDir, 'data/ruleset/eras.json');
if (!fs.existsSync(erasPath)) fail('data/ruleset/eras.json does not exist');
const erasDoc = JSON.parse(fs.readFileSync(erasPath, 'utf8'));
assertArray(erasDoc.eras, 'erasDoc.eras');

for (const era of erasDoc.eras) {
  assertString(era.eraKey, 'era.eraKey');
  assertArray(era.cycles, `era.${era.eraKey}.cycles`);
  if (era.volumeMultipliers) {
    for (const vm of era.volumeMultipliers) {
      if (!domain.entities[vm.entity]) {
        fail(`Era '${era.eraKey}': unknown entity '${vm.entity}' in volumeMultipliers`);
      }
    }
  }
}
console.log(`✓ data/ruleset/eras.json conforms to schema and domain (${erasDoc.eras.length} eras)`);

console.log('================================================================================');
console.log('✅ ALL LOOM DATA PROJECT FILES CONFORM STRICTLY TO SCHEMA AND DOMAIN CLOSURE');
console.log('================================================================================');
