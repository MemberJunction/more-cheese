#!/usr/bin/env node
/**
 * scripts/enrich-person-job-functions.mjs
 *
 * Deterministically enriches Person records with SeniorityLevelID and generates
 * PersonJobFunction child records based on the BizApps Common title taxonomy.
 *
 * Can be run standalone or invoked as a pass during Loom generation.
 */

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const DEFAULT_NAMESPACE = '8d3e9117-2b36-4078-a6fe-4c60144f8101';

/**
 * Mint RFC 4122 v5 UUID deterministically using SHA-1 and namespace.
 */
export function uuidv5(name, namespaceUuid = DEFAULT_NAMESPACE) {
  const nsClean = namespaceUuid.replace(/-/g, '');
  const nsBuffer = Buffer.from(nsClean, 'hex');
  const nameBuffer = Buffer.from(name, 'utf8');

  const hash = crypto.createHash('sha1');
  hash.update(nsBuffer);
  hash.update(nameBuffer);
  const digest = hash.digest();

  digest[6] = (digest[6] & 0x0f) | 0x50; // version 5
  digest[8] = (digest[8] & 0x3f) | 0x80; // variant RFC 4122

  const hex = digest.toString('hex', 0, 16);
  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    hex.slice(12, 16),
    hex.slice(16, 20),
    hex.slice(20, 32),
  ].join('-').toUpperCase();
}

/**
 * Enriches people with SeniorityLevelID and generates PersonJobFunction records.
 */
export function applyPersonJobFunctionsEnrichment(options = {}) {
  const baseDir = options.rootDir || rootDir;
  const taxonomyPath = path.join(baseDir, 'data', 'catalogs', 'title-taxonomy.json');
  const peoplePath = path.join(baseDir, 'generated', 'people', '.people.json');
  const pjfDir = path.join(baseDir, 'generated', 'person-job-functions');
  const pjfPath = path.join(pjfDir, '.person-job-functions.json');
  const pjfSyncPath = path.join(pjfDir, '.mj-sync.json');

  if (!fs.existsSync(taxonomyPath)) {
    throw new Error(`Taxonomy catalog missing at ${taxonomyPath}`);
  }
  if (!fs.existsSync(peoplePath)) {
    throw new Error(`People dataset missing at ${peoplePath}`);
  }

  const taxonomy = JSON.parse(fs.readFileSync(taxonomyPath, 'utf8'));
  const people = JSON.parse(fs.readFileSync(peoplePath, 'utf8'));

  let matchedSeniorityCount = 0;
  const pjfRecords = [];

  for (const person of people) {
    const title = person.fields?.Title?.trim();
    const entry = title ? taxonomy[title] : null;

    if (entry && entry.seniorityID) {
      person.fields.SeniorityLevelID = entry.seniorityID.toUpperCase();
      matchedSeniorityCount++;
    } else {
      person.fields.SeniorityLevelID = null;
    }

    if (entry && Array.isArray(entry.functions)) {
      const personId = person.primaryKey.ID.toUpperCase();
      for (const fn of entry.functions) {
        const jfId = fn.jobFunctionID.toUpperCase();
        const seq = fn.sequence;
        const pkId = uuidv5(`PersonJobFunction:${personId}:${jfId}:${seq}`, DEFAULT_NAMESPACE);

        pjfRecords.push({
          fields: {
            PersonID: personId,
            JobFunctionID: jfId,
            Sequence: seq,
            Source: 'Manual',
            Confidence: fn.confidence,
          },
          primaryKey: {
            ID: pkId,
          },
        });
      }
    }
  }

  // Write updated people dataset
  fs.writeFileSync(peoplePath, JSON.stringify(people, null, 2) + '\n', 'utf8');

  // Ensure person-job-functions directory and files exist
  fs.mkdirSync(pjfDir, { recursive: true });
  fs.writeFileSync(pjfPath, JSON.stringify(pjfRecords, null, 2) + '\n', 'utf8');

  const syncConfig = {
    entity: 'MJ_BizApps_Common: Person Job Functions',
    filePattern: '**/.*.json',
  };
  fs.writeFileSync(pjfSyncPath, JSON.stringify(syncConfig, null, 2) + '\n', 'utf8');

  return {
    peopleCount: people.length,
    matchedSeniorityCount,
    personJobFunctionsCount: pjfRecords.length,
  };
}

// Run standalone if executed directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  console.log('🧀 Enriching Person Seniority Levels and Person Job Functions...');
  const stats = applyPersonJobFunctionsEnrichment();
  console.log(`   ✓ People processed: ${stats.peopleCount} (${stats.matchedSeniorityCount} assigned SeniorityLevelID)`);
  console.log(`   ✓ PersonJobFunction records generated: ${stats.personJobFunctionsCount}`);
  console.log('✨ Enrichment completed successfully.');
}
