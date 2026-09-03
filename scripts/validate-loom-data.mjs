import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { z } from 'zod';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// ============================================================================
// 1. Plan 02 Zod Contracts
// ============================================================================

const ProjectManifestSchema = z.object({
  name: z.string().min(1),
  version: z.string().min(1),
  domain: z.string().min(1),
  uuidNamespace: z.string().uuid(),
  description: z.string().optional(),
  entrypoint: z.string().default('./index.ts'),
  rulesetPath: z.string().default('./ruleset'),
  narrativePath: z.string().optional(),
  output: z.object({
    metadataDir: z.string().default('./metadata'),
    migrationsDir: z.string().default('./migrations'),
    sqlDialect: z.enum(['sqlserver', 'postgres']).default('sqlserver'),
  }).default({
    metadataDir: './metadata',
    migrationsDir: './migrations',
    sqlDialect: 'sqlserver',
  }),
}).strict();

const FieldTypeSchema = z.enum(['string', 'number', 'boolean', 'date', 'uuid', 'json']);
const FieldConfigSchema = z.object({
  name: z.string().min(1),
  type: FieldTypeSchema,
  nullable: z.boolean().default(false),
  description: z.string().optional(),
  defaultValue: z.union([z.string(), z.number(), z.boolean()]).optional(),
  isPrimaryKey: z.boolean().default(false),
  mjFieldType: z.string().optional(),
  valueListType: z.string().optional(),
});

const ForeignKeyConfigSchema = z.object({
  fieldName: z.string().min(1).optional(),
  targetEntity: z.string().min(1),
  targetField: z.string().min(1),
  cardinality: z.enum(['one-to-one', 'many-to-one', 'one-to-many']).default('many-to-one'),
});

const EntityConfigSchema = z.object({
  name: z.string().min(1),
  targetTable: z.string().min(1),
  schema: z.string().min(1),
  pack: z.string().min(1),
  businessKey: z.array(z.string()).min(1),
  fields: z.record(z.string(), FieldConfigSchema),
  foreignKeys: z.record(z.string(), ForeignKeyConfigSchema).default({}),
  isImmutable: z.boolean().default(false),
});

const PackConfigSchema = z.object({
  name: z.string().min(1),
  dependsOn: z.array(z.string()).default([]),
  description: z.string().optional(),
});

const DomainConfigSchema = z.object({
  name: z.string().min(1),
  namespace: z.string().uuid(),
  description: z.string().optional(),
  entities: z.record(z.string(), EntityConfigSchema),
  packs: z.record(z.string(), PackConfigSchema),
});

const PinOpSchema = z.enum(['eq', 'neq', 'gt', 'gte', 'lt', 'lte', 'in', 'exists', 'withinCyclesOfAsOf']);
const PinPrimitiveValueSchema = z.union([z.string(), z.number(), z.boolean(), z.null()]);

const FeatureQuerySchema = z.object({
  from: z.string().min(1),
  field: z.string().min(1).optional(),
  where: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])).optional(),
  aggregation: z.enum(['count', 'sum', 'avg', 'min', 'max', 'exists']).optional(),
  path: z.array(z.string()).optional(),
  description: z.string().optional(),
});

const HeroFieldPinSchema = z.object({
  kind: z.literal('field'),
  field: z.string().min(1),
  op: PinOpSchema,
  value: z.union([PinPrimitiveValueSchema, z.array(PinPrimitiveValueSchema)]),
  description: z.string().optional(),
}).strict();

const HeroOutcomePinSchema = z.object({
  kind: z.literal('outcome'),
  factor: z.string().min(1),
  cycle: z.number().int(),
  value: z.boolean(),
  description: z.string().optional(),
}).strict();

const HeroFeaturePinSchema = z.object({
  kind: z.literal('feature'),
  feature: FeatureQuerySchema,
  op: PinOpSchema,
  value: z.union([PinPrimitiveValueSchema, z.array(PinPrimitiveValueSchema)]),
  description: z.string().optional(),
}).strict();

const HeroPinSchema = z.discriminatedUnion('kind', [
  HeroFieldPinSchema,
  HeroOutcomePinSchema,
  HeroFeaturePinSchema,
]);

const HeroLadderEntrySchema = z.object({
  ladderKey: z.string().min(1),
  state: z.string().min(1),
  enterCycle: z.number().int(),
  exitCycle: z.number().int().optional(),
}).strict();

const HeroConfigSchema = z.object({
  heroKey: z.string().min(1),
  entity: z.string().min(1),
  businessKeys: z.record(z.string(), z.union([z.string(), z.number()])),
  fixedFields: z.record(z.string(), PinPrimitiveValueSchema).default({}),
  birthCycle: z.number().int().default(0),
  latentDials: z.record(z.string(), z.number()).default({}),
  ladderEntries: z.array(HeroLadderEntrySchema).default([]),
  eras: z.array(z.string()).default([]),
  pins: z.array(HeroPinSchema).default([]),
  description: z.string().optional(),
}).strict();

const HeroesManifestSchema = z.object({
  $schema: z.string().optional(),
  heroes: z.array(HeroConfigSchema),
}).strict();

const MotifQuotaSchema = z.object({
  mode: z.enum(['count', 'percentage']),
  value: z.number().min(0),
  rounding: z.enum(['floor', 'ceil', 'round']).default('round'),
}).strict().refine((q) => {
  if (q.mode === 'percentage') return q.value <= 1;
  return q.value >= 1;
}, { message: "Percentage quota value must be a fraction in [0, 1]" });

const LatentTrajectorySchema = z.object({
  dial: z.string().min(1),
  deltaPerCycle: z.number(),
  acceleration: z.number().optional(),
}).strict();

const ChildRateSchema = z.object({
  entity: z.string().min(1),
  perCycle: z.union([
    z.number().min(0),
    z.object({ min: z.number().min(0), max: z.number().min(0) }).strict(),
  ]),
  condition: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])).optional(),
}).strict();

const FactorOverrideSchema = z.object({
  factor: z.string().min(1),
  beta: z.number().optional(),
  probability: z.number().min(0).max(1).optional(),
}).strict().refine((o) => o.beta !== undefined || o.probability !== undefined);

const MotifConfigSchema = z.object({
  motifKey: z.string().min(1),
  targetEntity: z.string().min(1),
  quota: MotifQuotaSchema,
  birthCycles: z.array(z.number().int()).optional(),
  latentConstraints: z.record(
    z.string(),
    z.object({ min: z.number().optional(), max: z.number().optional() }).strict()
  ).optional(),
  latentTrajectory: LatentTrajectorySchema.optional(),
  childRates: z.array(ChildRateSchema).default([]),
  ladderProgression: z.object({
    ladderKey: z.string().min(1),
    initialState: z.string().min(1),
  }).strict().optional(),
  eras: z.array(z.string()).default([]),
  factorOverrides: z.array(FactorOverrideSchema).default([]),
  fixedFields: z.record(z.string(), z.union([z.string(), z.number(), z.boolean(), z.null()])).optional(),
  description: z.string().optional(),
}).strict();

const MotifsManifestSchema = z.object({
  $schema: z.string().optional(),
  motifs: z.array(MotifConfigSchema),
}).strict();

const StateLadderFieldBindingSchema = z.object({
  mode: z.literal('field'),
  field: z.string().min(1),
}).strict();

const StateLadderChildEntityBindingSchema = z.object({
  mode: z.literal('childEntity'),
  childEntity: z.string().min(1),
  foreignKey: z.string().min(1),
  stateField: z.string().min(1),
  termField: z.string().min(1).optional(),
  startDateField: z.string().min(1).optional(),
  endDateField: z.string().min(1).optional(),
}).strict();

const StateLadderBindingSchema = z.discriminatedUnion('mode', [
  StateLadderFieldBindingSchema,
  StateLadderChildEntityBindingSchema,
]);

const LadderEffectSchema = z.object({
  factor: z.string().min(1),
  beta: z.number(),
}).strict();

const LadderExitEffectSchema = z.object({
  dial: z.string().min(1),
  delta: z.number(),
}).strict();

const StateLadderPrerequisiteSchema = z.object({
  priorState: z.string().optional(),
  minCyclesSinceBirth: z.number().int().optional(),
  dials: z.record(
    z.string(),
    z.object({ min: z.number().optional(), max: z.number().optional() }).strict()
  ).optional(),
}).strict();

const StateLadderStateSchema = z.object({
  name: z.string().min(1),
  durationCycles: z.number().int().min(1).default(1),
  capacity: z.number().int().min(1).optional(),
  prerequisites: StateLadderPrerequisiteSchema.optional(),
  effects: z.array(LadderEffectSchema).default([]),
  exitEffects: z.array(LadderExitEffectSchema).default([]),
}).strict();

const StateLadderConfigSchema = z.object({
  ladderKey: z.string().min(1),
  entity: z.string().min(1),
  binding: StateLadderBindingSchema,
  cohortShare: z.number().min(0).max(1).default(1),
  states: z.array(StateLadderStateSchema).min(1),
  description: z.string().optional(),
}).strict();

const LaddersManifestSchema = z.object({
  $schema: z.string().optional(),
  ladders: z.array(StateLadderConfigSchema),
}).strict();

const FactorAdjustmentSchema = z.object({
  factor: z.string().min(1),
  deltaIntercept: z.number(),
}).strict();

const VolumeMultiplierSchema = z.object({
  entity: z.string().min(1),
  multiplier: z.number().min(0),
}).strict();

const EraConfigSchema = z.object({
  eraKey: z.string().min(1),
  scope: z.enum(['all', 'tagged']).default('all'),
  cycles: z.array(z.number().int()).min(1),
  factorAdjustments: z.array(FactorAdjustmentSchema).default([]),
  volumeMultipliers: z.array(VolumeMultiplierSchema).default([]),
  description: z.string().optional(),
}).strict();

const ErasManifestSchema = z.object({
  $schema: z.string().optional(),
  eras: z.array(EraConfigSchema),
}).strict();

// ============================================================================
// 2. Domain Conformance Validation
// ============================================================================

console.log('================================================================================');
console.log('            LOOM DATA PROJECT & DOMAIN CONFORMANCE AUDIT                        ');
console.log('================================================================================');

// A. Validate project.json
const projectRaw = JSON.parse(fs.readFileSync(path.join(rootDir, 'data/project.json'), 'utf8'));
const projectParsed = ProjectManifestSchema.safeParse(projectRaw);
if (!projectParsed.success) {
  console.error('❌ data/project.json failed schema validation:');
  console.error(projectParsed.error.format());
  process.exit(1);
}
console.log('✓ data/project.json conforms to ProjectManifestSchema');

// B. Validate domain.json
const domainRaw = JSON.parse(fs.readFileSync(path.join(rootDir, 'data/domain.json'), 'utf8'));
const domainParsed = DomainConfigSchema.safeParse(domainRaw);
if (!domainParsed.success) {
  console.error('❌ data/domain.json failed schema validation:');
  console.error(domainParsed.error.format());
  process.exit(1);
}
const domain = domainParsed.data;
console.log(`✓ data/domain.json conforms to DomainConfigSchema (${Object.keys(domain.entities).length} entities)`);

// C. Validate heroes.json
const heroesRaw = JSON.parse(fs.readFileSync(path.join(rootDir, 'data/ruleset/heroes.json'), 'utf8'));
const heroesParsed = HeroesManifestSchema.safeParse(heroesRaw);
if (!heroesParsed.success) {
  console.error('❌ data/ruleset/heroes.json failed schema validation:');
  console.error(heroesParsed.error.format());
  process.exit(1);
}

for (const hero of heroesParsed.data.heroes) {
  const entityCfg = domain.entities[hero.entity];
  if (!entityCfg) {
    console.error(`❌ Hero '${hero.heroKey}': unknown entity '${hero.entity}'`);
    process.exit(1);
  }
  for (const field of Object.keys(hero.fixedFields)) {
    if (!entityCfg.fields[field]) {
      console.error(`❌ Hero '${hero.heroKey}': unknown field '${hero.entity}.${field}' in fixedFields`);
      process.exit(1);
    }
  }
  for (const pin of hero.pins) {
    if (pin.kind === 'field' && !entityCfg.fields[pin.field]) {
      console.error(`❌ Hero '${hero.heroKey}': unknown field '${hero.entity}.${pin.field}' in field pin`);
      process.exit(1);
    }
    if (pin.kind === 'feature') {
      const targetEntity = pin.feature.from === 'self' ? hero.entity : pin.feature.from;
      const targetCfg = domain.entities[targetEntity];
      if (!targetCfg) {
        console.error(`❌ Hero '${hero.heroKey}': unknown target entity '${targetEntity}' in feature pin`);
        process.exit(1);
      }
      if (pin.feature.field && !targetCfg.fields[pin.feature.field]) {
        console.error(`❌ Hero '${hero.heroKey}': unknown field '${targetEntity}.${pin.feature.field}' in feature pin`);
        process.exit(1);
      }
    }
  }
}
console.log(`✓ data/ruleset/heroes.json conforms to schema and domain (${heroesParsed.data.heroes.length} heroes)`);

// D. Validate motifs.json
const motifsRaw = JSON.parse(fs.readFileSync(path.join(rootDir, 'data/ruleset/motifs.json'), 'utf8'));
const motifsParsed = MotifsManifestSchema.safeParse(motifsRaw);
if (!motifsParsed.success) {
  console.error('❌ data/ruleset/motifs.json failed schema validation:');
  console.error(motifsParsed.error.format());
  process.exit(1);
}
for (const motif of motifsParsed.data.motifs) {
  if (!domain.entities[motif.targetEntity]) {
    console.error(`❌ Motif '${motif.motifKey}': unknown target entity '${motif.targetEntity}'`);
    process.exit(1);
  }
  for (const cr of motif.childRates) {
    if (!domain.entities[cr.entity]) {
      console.error(`❌ Motif '${motif.motifKey}': unknown child entity '${cr.entity}' in childRates`);
      process.exit(1);
    }
  }
}
console.log(`✓ data/ruleset/motifs.json conforms to schema and domain (${motifsParsed.data.motifs.length} motifs)`);

// E. Validate ladders.json
const laddersRaw = JSON.parse(fs.readFileSync(path.join(rootDir, 'data/ruleset/ladders.json'), 'utf8'));
const laddersParsed = LaddersManifestSchema.safeParse(laddersRaw);
if (!laddersParsed.success) {
  console.error('❌ data/ruleset/ladders.json failed schema validation:');
  console.error(laddersParsed.error.format());
  process.exit(1);
}
for (const ladder of laddersParsed.data.ladders) {
  if (!domain.entities[ladder.entity]) {
    console.error(`❌ Ladder '${ladder.ladderKey}': unknown entity '${ladder.entity}'`);
    process.exit(1);
  }
  if (ladder.binding.mode === 'childEntity') {
    const childCfg = domain.entities[ladder.binding.childEntity];
    if (!childCfg) {
      console.error(`❌ Ladder '${ladder.ladderKey}': unknown child entity '${ladder.binding.childEntity}'`);
      process.exit(1);
    }
    if (!childCfg.fields[ladder.binding.foreignKey]) {
      console.error(`❌ Ladder '${ladder.ladderKey}': unknown foreign key '${ladder.binding.childEntity}.${ladder.binding.foreignKey}'`);
      process.exit(1);
    }
    if (!childCfg.fields[ladder.binding.stateField]) {
      console.error(`❌ Ladder '${ladder.ladderKey}': unknown state field '${ladder.binding.childEntity}.${ladder.binding.stateField}'`);
      process.exit(1);
    }
  }
}
console.log(`✓ data/ruleset/ladders.json conforms to schema and domain (${laddersParsed.data.ladders.length} ladders)`);

// F. Validate eras.json
const erasRaw = JSON.parse(fs.readFileSync(path.join(rootDir, 'data/ruleset/eras.json'), 'utf8'));
const erasParsed = ErasManifestSchema.safeParse(erasRaw);
if (!erasParsed.success) {
  console.error('❌ data/ruleset/eras.json failed schema validation:');
  console.error(erasParsed.error.format());
  process.exit(1);
}
for (const era of erasParsed.data.eras) {
  for (const vm of era.volumeMultipliers) {
    if (!domain.entities[vm.entity]) {
      console.error(`❌ Era '${era.eraKey}': unknown entity '${vm.entity}' in volumeMultipliers`);
      process.exit(1);
    }
  }
}
console.log(`✓ data/ruleset/eras.json conforms to schema and domain (${erasParsed.data.eras.length} eras)`);

console.log('================================================================================');
console.log('✅ ALL LOOM DATA PROJECT FILES CONFORM STRICTLY TO SCHEMA AND DOMAIN CLOSURE');
console.log('================================================================================');
