/** @type {import('@memberjunction/config').MJConfig} */
//
// mj.config.cjs — MemberJunction configuration for THIS Open App repository.
//
// This file drives `mj codegen` (and, when developing standalone, `mj migrate`).
// Database connection settings come from environment variables / .env — you do
// NOT put credentials here. Most settings have sensible package defaults; this
// file only declares what is specific to this app's directory structure.
//
// MoreCheese demo (International Cheese Federation). Custom demo data is split
// across multiple AssociationDemoV2_* schemas (per the v2 plan — simulates a
// realistic multi-source-system customer environment); the manifest's home
// schema (migration default) is AssociationDemoV2_Members.
//
module.exports = {
  // ==========================================================================
  // CodeGen output — REQUIRED
  // ==========================================================================

  // The npm package that receives generated entity subclasses. Must match
  // packages/Entities/package.json "name".
  entityPackageName: '@mj-more-cheese-demo/entities',

  // Where each kind of generated artifact is written. These paths match this
  // template's packages/ layout — keep them in sync if you rename packages.
  output: [
    { type: 'SQL', directory: './SQL Scripts/generated', appendOutputCode: true },
    {
      type: 'Angular',
      directory: './packages/Angular/src/lib/generated',
      options: [{ name: 'maxComponentsPerModule', value: 20 }],
    },
    { type: 'GraphQLServer', directory: './packages/Server/src/generated' },
    { type: 'ActionSubclasses', directory: './packages/Actions/src/generated' },
    { type: 'EntitySubclasses', directory: './packages/Entities/src/generated' },
    { type: 'DBSchemaJSON', directory: './Schema Files' },
  ],

  // Commands CodeGen runs after generating — build the packages it wrote into
  // so the generated TypeScript is compiled and committed alongside its source.
  commands: [
    { workingDirectory: './packages/Entities', command: 'npm', args: ['run', 'build'], when: 'after' },
    { workingDirectory: './packages/Actions', command: 'npm', args: ['run', 'build'], when: 'after' },
    { workingDirectory: './packages/Server', command: 'npm', args: ['run', 'build'], when: 'after' },
    { workingDirectory: './packages/Angular', command: 'npm', args: ['run', 'build'], when: 'after' },
  ],

  // ==========================================================================
  // New-entity naming — RECOMMENDED
  // ==========================================================================
  // Prefix generated entity names so they can never collide with MJ core
  // ("MJ: ...") or other apps. Must agree with the EntityNamePrefix your
  // baseline migration writes into __mj.SchemaInfo.
  newEntityDefaults: {
    NameRulesBySchema: [
      { SchemaName: '${mj_core_schema}', EntityNamePrefix: 'MJ: ' },
      // All AssociationDemoV2_* demo schemas share the ICF prefix (the demo
      // association brand). One entry per schema in the v2 plan's domain map.
      { SchemaName: 'AssociationDemoV2_Members', EntityNamePrefix: 'ICF: ', EntityNameSuffix: '' },
      { SchemaName: 'AssociationDemoV2_Events', EntityNamePrefix: 'ICF: ', EntityNameSuffix: '' },
      { SchemaName: 'AssociationDemoV2_Learning', EntityNamePrefix: 'ICF: ', EntityNameSuffix: '' },
      { SchemaName: 'AssociationDemoV2_Forums', EntityNamePrefix: 'ICF: ', EntityNameSuffix: '' },
      { SchemaName: 'AssociationDemoV2_Resources', EntityNamePrefix: 'ICF: ', EntityNameSuffix: '' },
      { SchemaName: 'AssociationDemoV2_Awards', EntityNamePrefix: 'ICF: ', EntityNameSuffix: '' },
      { SchemaName: 'AssociationDemoV2_Legislative', EntityNamePrefix: 'ICF: ', EntityNameSuffix: '' },
      { SchemaName: 'AssociationDemoV2_Marketing', EntityNamePrefix: 'ICF: ', EntityNameSuffix: '' },
    ],
  },

  // ==========================================================================
  // Schema exclusions — RECOMMENDED
  // ==========================================================================
  // CodeGen for THIS app must only touch THIS app's schema. Never generate
  // against MJ core (__mj) or system schemas from an app repo.
  // Include schemas for dependencies to avoid generating duplicate entities for 
  // them. See docs/template-docs/codegen-and-metadata-migrations.md.
  excludeSchemas: ['sys', 'staging', 'dbo', '__mj'],

  // ==========================================================================
  // SQL output for migrations — RECOMMENDED
  // ==========================================================================
  // CodeGen writes the SQL it executed into ./migrations/codegen/. After a
  // schema/metadata change you fold that SQL into a proper V*__ migration file
  // and commit it TOGETHER with the regenerated code — that is the convention
  // that keeps clean installs reproducible. See
  // docs/codegen-and-metadata-migrations.md.
  SQLOutput: {
    enabled: true,
    folderPath: './migrations/codegen/',
    appendToFile: false,
    convertCoreSchemaToFlywayMigrationFile: true,
    omitRecurringScriptsFromLog: false,
    schemaPlaceholders: [
      // Order matters: more-specific schema names must come first (greedy
      // sequential substitution).
      // Only the HOME schema maps to the default placeholder; the other
      // AssociationDemoV2_* schemas are fixed names written literally by the
      // migrations.
      { schema: 'AssociationDemoV2_Members', placeholder: '${flyway:defaultSchema}' },
      { schema: '__mj', placeholder: '${mjSchema}' },
    ],
  },

  // ==========================================================================
  // Everything else is OPTIONAL and defaults sensibly:
  //   - settings / logging / advancedGeneration / forceRegeneration
  //   - dbHost/dbPort/dbDatabase/... come from environment variables
  //   - graphqlPort etc. come from DEFAULT_SERVER_CONFIG
  // See the fully-commented example in the bizapps-common repository, or the
  // @memberjunction/config package, for the complete list.
  // ==========================================================================
};
