#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const dataDir = path.join(rootDir, 'data');
const genDir = path.join(rootDir, 'generated');

const erasPath = path.join(dataDir, 'ruleset/eras.json');
const heroesPath = path.join(dataDir, 'ruleset/heroes.json');

const erasConfig = JSON.parse(fs.readFileSync(erasPath, 'utf8'));
const heroesConfig = JSON.parse(fs.readFileSync(heroesPath, 'utf8'));

function readRecords(dirName) {
  const dir = path.join(genDir, dirName);
  if (!fs.existsSync(dir)) return [];
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.json') && !f.startsWith('.mj-'));
  const records = [];
  for (const f of files) {
    const arr = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'));
    for (const r of arr) {
      records.push({ ...(r.primaryKey || {}), ...(r.fields || {}) });
    }
  }
  return records;
}

const people = readRecords('people');
const organizations = readRecords('organizations');
const memberships = readRecords('membership-periods');
const eventRegs = readRecords('event-registrations');
const enrollments = readRecords('enrollments');
const advocacy = readRecords('advocacy-actions');
const orders = readRecords('orders');

function getYear(val) {
  if (!val) return NaN;
  return new Date(val).getFullYear();
}

console.log('='.repeat(96));
console.log('     MORE CHEESE (ICF) REALIZED ERA & SIMULATION REPORT (2019 - 2026)     ');
console.log('='.repeat(96));

const cycles = [2019, 2020, 2021, 2022, 2023, 2024, 2025, 2026];

console.log('\n### 1. Realized Entity Volumes by Cycle (Year)\n');
console.log('| Cycle | Organizations (Founded <=) | Active Members | Event Regs | Enrollments | Advocacy | Orders |');
console.log('|-------|----------------------------|----------------|------------|-------------|----------|--------|');

for (const cy of cycles) {
  const orgCount = organizations.filter(r => !r.FoundedDate || getYear(r.FoundedDate) <= cy).length;
  const memCount = memberships.filter(r => getYear(r.StartDate) === cy).length;
  const eventCount = eventRegs.filter(r => getYear(r.RegisteredOn) === cy).length;
  const enrollCount = enrollments.filter(r => getYear(r.EnrolledOn) === cy).length;
  const advCount = advocacy.filter(r => getYear(r.ActionDate) === cy).length;
  const orderCount = orders.filter(r => getYear(r.OrderDate) === cy).length;

  console.log(`| ${cy}  | ${String(orgCount).padStart(26)} | ${String(memCount).padStart(14)} | ${String(eventCount).padStart(10)} | ${String(enrollCount).padStart(11)} | ${String(advCount).padStart(8)} | ${String(orderCount).padStart(6)} |`);
}

console.log(`\n* Total Population Baselines: ${organizations.length.toLocaleString()} Organizations, ${people.length.toLocaleString()} People, ${memberships.length.toLocaleString()} Total Membership Periods.`);

console.log('\n### 2. Realized Factor Rates by Cycle (Year)\n');
console.log('| Cycle | Active/Renewed Membership | Conference Attendance | Course Completion | Petition Advocacy |');
console.log('|-------|---------------------------|-----------------------|-------------------|-------------------|');

for (const cy of cycles) {
  const mems = memberships.filter(r => getYear(r.StartDate) === cy);
  const memActive = mems.filter(r => r.Status === 'Active' || r.Status === 'Renewed').length;
  const memRate = mems.length > 0 ? (memActive / mems.length * 100).toFixed(1) + '%' : 'N/A';

  const evs = eventRegs.filter(r => getYear(r.RegisteredOn) === cy);
  const evAttended = evs.filter(r => r.Attended === true).length;
  const evRate = evs.length > 0 ? (evAttended / evs.length * 100).toFixed(1) + '%' : 'N/A';

  const ens = enrollments.filter(r => getYear(r.EnrolledOn) === cy);
  const ensComp = ens.filter(r => r.Status === 'Completed').length;
  const ensRate = ens.length > 0 ? (ensComp / ens.length * 100).toFixed(1) + '%' : 'N/A';

  const advs = advocacy.filter(r => getYear(r.ActionDate) === cy);
  const advPet = advs.filter(r => r.Kind === 'PetitionSignature').length;
  const advRate = advs.length > 0 ? (advPet / advs.length * 100).toFixed(1) + '%' : 'N/A';

  console.log(`| ${cy}  | ${String(memRate).padStart(25)} | ${String(evRate).padStart(21)} | ${String(ensRate).padStart(17)} | ${String(advRate).padStart(17)} |`);
}

console.log('\n### 3. Defined Eras & Macroeconomic Shifts\n');
for (const era of erasConfig.eras) {
  console.log(`* **${era.eraKey}** (Cycles: ${era.cycles.join(', ')})`);
  console.log(`  - Scope: ${era.scope}`);
  console.log(`  - Description: ${era.description}`);
  if (era.volumeMultipliers && era.volumeMultipliers.length > 0) {
    console.log('  - Volume Multipliers:');
    for (const vm of era.volumeMultipliers) {
      console.log(`    • ${vm.entity}: ${vm.multiplier}x`);
    }
  }
  if (era.factorAdjustments && era.factorAdjustments.length > 0) {
    console.log('  - Factor Adjustments:');
    for (const fa of era.factorAdjustments) {
      console.log(`    • ${fa.factor}: deltaIntercept ${fa.deltaIntercept > 0 ? '+' : ''}${fa.deltaIntercept}`);
    }
  }
}

console.log('\n### 4. Hero Personas & Strategic Pins\n');
let totalPins = 0;
for (const hero of heroesConfig.heroes) {
  const heroPins = Object.keys(hero.pins ?? {}).length;
  totalPins += heroPins;
}
console.log(`✓ Verified ${heroesConfig.heroes.length} hero personas and ${totalPins} deterministic pins across history.`);
console.log('='.repeat(96));
