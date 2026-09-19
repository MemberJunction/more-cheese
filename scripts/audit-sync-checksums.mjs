import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const targetDirs = process.argv.slice(2);
const dirsToCheck = targetDirs.length > 0 ? targetDirs.map(d => path.resolve(rootDir, d)) : [path.join(rootDir, 'generated')];

let totalPrimaryKeyRecords = 0;
let totalMissingChecksum = 0;
const missingByDir = new Map();
const totalByDir = new Map();

for (const baseDir of dirsToCheck) {
  if (!fs.existsSync(baseDir)) continue;

  function walk(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(fullPath);
      } else if (entry.isFile() && entry.name.endsWith('.json') && !entry.name.startsWith('.mj-sync')) {
        try {
          const content = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
          const records = Array.isArray(content) ? content : (content.records ? content.records : [content]);
          const relDir = path.relative(baseDir, dir);

          for (const rec of records) {
            if (rec && typeof rec === 'object' && rec.primaryKey) {
              totalPrimaryKeyRecords++;
              totalByDir.set(relDir, (totalByDir.get(relDir) ?? 0) + 1);

              const hasChecksum = Boolean(rec.sync && rec.sync.checksum);
              if (!hasChecksum) {
                totalMissingChecksum++;
                missingByDir.set(relDir, (missingByDir.get(relDir) ?? 0) + 1);
              }
            }
          }
        } catch {
          // ignore unparseable
        }
      }
    }
  }

  walk(baseDir);
}

console.log('='.repeat(80));
console.log('             STATIC METADATA SYNC CHECKSUM PRESENCE AUDIT             ');
console.log('='.repeat(80));
console.log(`Audited: ${dirsToCheck.map(d => path.relative(rootDir, d)).join(', ')}`);
console.log(`Total records with primaryKey: ${totalPrimaryKeyRecords.toLocaleString()}`);
console.log(`Records with sync.checksum:   ${(totalPrimaryKeyRecords - totalMissingChecksum).toLocaleString()}`);
console.log(`Records missing checksum:     ${totalMissingChecksum.toLocaleString()}`);
console.log('-'.repeat(80));

if (totalMissingChecksum > 0) {
  console.log('Breakdown of missing checksums by directory:');
  const sortedDirs = Array.from(missingByDir.entries()).sort((a, b) => b[1] - a[1]);
  for (const [d, count] of sortedDirs) {
    const total = totalByDir.get(d) ?? count;
    console.log(`  ${(d || '.').padEnd(35)} : ${count.toLocaleString().padStart(6)} / ${total.toLocaleString().padStart(6)} missing`);
  }
  console.log('='.repeat(80));
  if (process.env.STRICT_CHECKSUMS === '1') {
    process.exit(1);
  }
} else {
  console.log('✅ All primaryKey records carry valid sync.checksum blocks.');
  console.log('='.repeat(80));
}
