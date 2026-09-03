import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

console.log('================================================================================');
console.log('            LOOM DATA VALIDATOR MUTATION TEST SUITE (R3-M1)                      ');
console.log('================================================================================');

function runValidatorExpectingFailure(mutationName, expectedErrorSnippet) {
  try {
    execSync('node scripts/validate-loom-data.mjs', { cwd: rootDir, stdio: 'pipe' });
    console.error(`❌ Mutation Test FAILED: '${mutationName}' was expected to fail validation, but passed!`);
    process.exit(1);
  } catch (err) {
    const output = (err.stderr?.toString() || '') + (err.stdout?.toString() || '');
    if (!output.includes(expectedErrorSnippet)) {
      console.error(`❌ Mutation Test FAILED: '${mutationName}' failed as expected, but output did not contain snippet '${expectedErrorSnippet}'. Output was:\n${output}`);
      process.exit(1);
    }
    console.log(`✓ Mutation '${mutationName}' caught successfully (matched: "${expectedErrorSnippet}")`);
  }
}

// Backup original files
const heroesPath = path.join(rootDir, 'data/ruleset/heroes.json');
const laddersPath = path.join(rootDir, 'data/ruleset/ladders.json');
const domainPath = path.join(rootDir, 'data/domain.json');
const commonPath = path.join(rootDir, 'data/ruleset/common.json');

const origHeroes = fs.readFileSync(heroesPath, 'utf8');
const origLadders = fs.readFileSync(laddersPath, 'utf8');
const origDomain = fs.readFileSync(domainPath, 'utf8');
const origCommon = fs.readFileSync(commonPath, 'utf8');

try {
  // Baseline verification: original unmutated dataset must pass
  console.log('Testing baseline unmutated dataset:');
  execSync('node scripts/validate-loom-data.mjs', { cwd: rootDir, stdio: 'pipe' });
  console.log('✓ Baseline validation passed.\n');

  // Mutation 1: Wrong ladder state/year on hero Elena Rodriguez
  console.log('Running Mutation 1: Wrong ladder state/year...');
  const mutatedHeroes1 = JSON.parse(origHeroes);
  const elena = mutatedHeroes1.heroes.find((h) => h.heroKey === 'HERO-ICF-001');
  elena.ladderEntries[0].enterCycle = 1999;
  fs.writeFileSync(heroesPath, JSON.stringify(mutatedHeroes1, null, 2), 'utf8');
  runValidatorExpectingFailure('Mutation 1: wrong ladder state/year', 'wrong ladder state/year');

  // Mutation 2: Wrong ladder vocabulary
  console.log('Running Mutation 2: Wrong ladder vocabulary...');
  fs.writeFileSync(heroesPath, origHeroes, 'utf8'); // restore
  const mutatedLadders2 = JSON.parse(origLadders);
  const govLadder = mutatedLadders2.ladders.find((l) => l.ladderKey === 'governance-leadership-ladder');
  govLadder.states.push({
    name: 'GrandMaster',
    durationCycles: 2,
    capacity: 1,
    effects: [],
    exitEffects: []
  });
  fs.writeFileSync(laddersPath, JSON.stringify(mutatedLadders2, null, 2), 'utf8');
  runValidatorExpectingFailure('Mutation 2: wrong ladder vocabulary', 'wrong ladder vocabulary');

  // Mutation 3: Field on wrong entity in domain.json
  console.log('Running Mutation 3: Field on wrong entity...');
  fs.writeFileSync(laddersPath, origLadders, 'utf8'); // restore
  const mutatedDomain3 = JSON.parse(origDomain);
  mutatedDomain3.entities.Product.fields.Bio = { name: 'Bio', type: 'string' };
  fs.writeFileSync(domainPath, JSON.stringify(mutatedDomain3, null, 2), 'utf8');
  runValidatorExpectingFailure('Mutation 3: field on wrong entity', 'field on wrong entity');

  // Mutation 4: Gutted common.json
  console.log('Running Mutation 4: Gutted common.json...');
  fs.writeFileSync(domainPath, origDomain, 'utf8'); // restore
  const mutatedCommon4 = JSON.parse(origCommon);
  mutatedCommon4.effects['factor-annual-conference-attendance'].arrows = {};
  fs.writeFileSync(commonPath, JSON.stringify(mutatedCommon4, null, 2), 'utf8');
  runValidatorExpectingFailure('Mutation 4: gutted common.json', 'gutted common.json');

  // Mutation 5: Wrong title on hero Jamie Fuller
  console.log('Running Mutation 5: Wrong title on hero...');
  fs.writeFileSync(commonPath, origCommon, 'utf8'); // restore
  const mutatedHeroes5 = JSON.parse(origHeroes);
  const jamie = mutatedHeroes5.heroes.find((h) => h.heroKey === 'HERO-ICF-013');
  jamie.fixedFields.Title = 'Artisan Cheese Blogger';
  fs.writeFileSync(heroesPath, JSON.stringify(mutatedHeroes5, null, 2), 'utf8');
  runValidatorExpectingFailure('Mutation 5: wrong title', 'disagrees with committed dataset');

  console.log('\n================================================================================');
  console.log('✅ ALL 5 MUTATION TESTS CAUGHT AND REJECTED SUCCESSFULLY (R3-M1)');
  console.log('================================================================================');
} finally {
  // Always restore originals
  fs.writeFileSync(heroesPath, origHeroes, 'utf8');
  fs.writeFileSync(laddersPath, origLadders, 'utf8');
  fs.writeFileSync(domainPath, origDomain, 'utf8');
  fs.writeFileSync(commonPath, origCommon, 'utf8');
}
