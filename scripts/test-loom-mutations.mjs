import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

console.log('================================================================================');
console.log('            LOOM DATA VALIDATOR MUTATION TEST SUITE (C27-4, C27-6)              ');
console.log('================================================================================');

function runValidatorExpectingFailure(mutationName, expectedErrorSnippet) {
  try {
    execSync('npm run validate:loom', { cwd: rootDir, stdio: 'pipe' });
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

// Backup original config files
const heroesPath = path.join(rootDir, 'data/ruleset/heroes.json');
const laddersPath = path.join(rootDir, 'data/ruleset/ladders.json');
const domainPath = path.join(rootDir, 'data/domain.json');
const commonPath = path.join(rootDir, 'data/ruleset/common.json');

const origHeroes = fs.readFileSync(heroesPath, 'utf8');
const origLadders = fs.readFileSync(laddersPath, 'utf8');
const origDomain = fs.readFileSync(domainPath, 'utf8');
const origCommon = fs.readFileSync(commonPath, 'utf8');

// Backup generated dataset files for relational & closure mutations
const commMemPath = path.join(rootDir, 'generated/committee-memberships/.committee-memberships.json');
const commMotionPath = path.join(rootDir, 'generated/committee-motions/.committee-motions.json');
const orderLinePath = path.join(rootDir, 'generated/order-lines/.order-lines.part-01.json');
const peoplePath = path.join(rootDir, 'generated/people/.people.json');
const orgsPath = path.join(rootDir, 'generated/organizations/.organizations.json');

const origCommMem = fs.readFileSync(commMemPath, 'utf8');
const origCommMotion = fs.readFileSync(commMotionPath, 'utf8');
const origOrderLine = fs.readFileSync(orderLinePath, 'utf8');
const origPeople = fs.readFileSync(peoplePath, 'utf8');
const origOrgs = fs.readFileSync(orgsPath, 'utf8');

try {
  // Baseline verification: original unmutated dataset must pass
  console.log('Testing baseline unmutated dataset:');
  execSync('npm run validate:loom', { cwd: rootDir, stdio: 'pipe' });
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
  mutatedDomain3.entities.MembershipPeriod.fields.Bio = { name: 'Bio', type: 'string' };
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

  // Mutation 6: Declared field on non-members schema missing from metadata records (V1)
  console.log('Running Mutation 6: Non-members schema declared field missing from metadata...');
  fs.writeFileSync(heroesPath, origHeroes, 'utf8'); // restore
  const mutatedDomain6 = JSON.parse(origDomain);
  mutatedDomain6.entities.Product.fields.Bio = { name: 'Bio', type: 'string' };
  fs.writeFileSync(domainPath, JSON.stringify(mutatedDomain6, null, 2), 'utf8');
  runValidatorExpectingFailure('Mutation 6: non-members field missing from metadata', 'missing from record #0');

  // Mutation 7: Relational Rule 1 (date-window: committee-membership-covered-by-term)
  console.log('Running Mutation 7: Relational Rule 1 (date-window breach)...');
  fs.writeFileSync(domainPath, origDomain, 'utf8'); // restore
  const mutatedCommMem7 = JSON.parse(origCommMem);
  mutatedCommMem7[0].fields.StartDate = '1985-01-01';
  fs.writeFileSync(commMemPath, JSON.stringify(mutatedCommMem7, null, 2), 'utf8');
  runValidatorExpectingFailure('Mutation 7: committee-membership-covered-by-term', 'committee-membership-covered-by-term');

  // Mutation 8: Relational Rule 2 (outcome-derived-from-ballots: motion-outcome-derived-from-votes)
  console.log('Running Mutation 8: Relational Rule 2 (outcome contradicts ballots)...');
  fs.writeFileSync(commMemPath, origCommMem, 'utf8'); // restore
  const mutatedMotion8 = JSON.parse(origCommMotion);
  mutatedMotion8[0].fields.Result = 'Failed';
  fs.writeFileSync(commMotionPath, JSON.stringify(mutatedMotion8, null, 2), 'utf8');
  runValidatorExpectingFailure('Mutation 8: motion-outcome-derived-from-votes', 'motion-outcome-derived-from-votes');

  // Mutation 9: Relational Rule 3 (path-match: order-line-company-matches-order)
  console.log('Running Mutation 9: Relational Rule 3 (order line company differs from order)...');
  fs.writeFileSync(commMotionPath, origCommMotion, 'utf8'); // restore
  const mutatedOrderLine9 = JSON.parse(origOrderLine);
  mutatedOrderLine9[0].fields.CompanyID = '00000000-0000-0000-0000-000000000000';
  fs.writeFileSync(orderLinePath, JSON.stringify(mutatedOrderLine9, null, 2), 'utf8');
  runValidatorExpectingFailure('Mutation 9: order-line-company-matches-order', 'order-line-company-matches-order');

  // Mutation 10: PK Uniqueness violation
  console.log('Running Mutation 10: Primary Key collision...');
  fs.writeFileSync(orderLinePath, origOrderLine, 'utf8'); // restore
  const mutatedPeople10 = JSON.parse(origPeople);
  mutatedPeople10[1].primaryKey.ID = mutatedPeople10[0].primaryKey.ID;
  fs.writeFileSync(peoplePath, JSON.stringify(mutatedPeople10, null, 2), 'utf8');
  runValidatorExpectingFailure('Mutation 10: PK uniqueness duplicate', 'PK Uniqueness');

  // Mutation 11: Foreign Key closure violation
  console.log('Running Mutation 11: FK orphan reference...');
  fs.writeFileSync(peoplePath, origPeople, 'utf8'); // restore
  const mutatedOrderLine11 = JSON.parse(origOrderLine);
  mutatedOrderLine11[0].fields.ProductID = '00000000-0000-0000-0000-000000000000';
  fs.writeFileSync(orderLinePath, JSON.stringify(mutatedOrderLine11, null, 2), 'utf8');
  runValidatorExpectingFailure('Mutation 11: FK closure orphan', 'FK Closure');

  // Mutation 12: Lookup Resolution violation
  console.log('Running Mutation 12: Unresolvable @lookup expression...');
  fs.writeFileSync(orderLinePath, origOrderLine, 'utf8'); // restore
  const mutatedOrgs12 = JSON.parse(origOrgs);
  mutatedOrgs12[0].fields.OrganizationTypeID = '@lookup:MJ_BizApps_Common: Organization Types.Name=NonExistentTypeXYZ';
  fs.writeFileSync(orgsPath, JSON.stringify(mutatedOrgs12, null, 2), 'utf8');
  runValidatorExpectingFailure('Mutation 12: @lookup resolution failure', 'Lookup Resolution');

  console.log('\n================================================================================');
  console.log('✅ ALL 12 MUTATION TESTS CAUGHT AND REJECTED SUCCESSFULLY (C27-4, C27-6)');
  console.log('================================================================================');
} finally {
  // Always restore originals
  fs.writeFileSync(heroesPath, origHeroes, 'utf8');
  fs.writeFileSync(laddersPath, origLadders, 'utf8');
  fs.writeFileSync(domainPath, origDomain, 'utf8');
  fs.writeFileSync(commonPath, origCommon, 'utf8');
  fs.writeFileSync(commMemPath, origCommMem, 'utf8');
  fs.writeFileSync(commMotionPath, origCommMotion, 'utf8');
  fs.writeFileSync(orderLinePath, origOrderLine, 'utf8');
  fs.writeFileSync(peoplePath, origPeople, 'utf8');
  fs.writeFileSync(orgsPath, origOrgs, 'utf8');
}
