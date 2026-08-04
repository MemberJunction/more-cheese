// Capture the REAL dependency + core schema into a checked-in contract snapshot —
// the "truth" the fast contract gate diffs our assumptions against. Run this ONCE, and
// again only when a dependency version is deliberately bumped; the git diff on the output
// is the drift report. Dev/ops tool (shells out to sqlcmd) — NOT part of the deterministic
// build. See datagen/SCHEMA-CONTRACT.md.
//
// Usage:
//   MJ_SA_PASSWORD=... node cli/capture-contract.mjs --db MC_UITest [--container sql_server_dev] [--out out]
//   (--out is the build whose emitted packs define WHICH tables/lookups to introspect)

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { extractClaims, parseCheckValues } from '../engine/contract.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..');
const APP_ROOT = join(ROOT, '..');
const args = Object.fromEntries(process.argv.slice(2).map((a, i, all) => (a.startsWith('--') ? [a.slice(2), all[i + 1]] : null)).filter(Boolean));
const DB = args.db;
const CONTAINER = args.container ?? 'sql_server_dev';
const OUT = join(ROOT, args.out ?? 'out');
const PASSWORD = process.env.MJ_SA_PASSWORD;
if (!DB) throw new Error('--db <database> is required');
if (!PASSWORD) throw new Error('set MJ_SA_PASSWORD in the environment (never hard-code it)');

const load = (pack, table) => JSON.parse(readFileSync(join(OUT, 'packs', pack, `${table}.json`), 'utf8'));

// The MAPPING is the PROJECT's — the claims we make about a dependency schema are ours, not the
// engine's.
const project = args.project ?? 'morecheese';
const { MAPPING, PREAMBLE } = await import(`../projects/${project}/seed-mapping.mjs`);
const claims = extractClaims({ MAPPING, PREAMBLE, load });

// which tables + lookups to introspect — exactly what we depend on, nothing more
const tableKeys = Object.keys(claims.tables).filter((t) => claims.tables[t].columns.length);
const lookupTables = Object.keys(claims.lookups);

// run a query through the container's sqlcmd; return the data rows, sentinel-stripped.
// -y 0 = don't truncate wide varchar columns (CHECK definitions are long); -w wide so a
// single concatenated column never wraps. -y 0 is incompatible with both -W and -h -1, so
// every SELECT prefixes each row with 'ROW\x01' and we keep only those lines (header +
// dashes separator are dropped), then strip the sentinel and trim.
const sql = (query) => execFileSync('docker', [
  'exec', '-i', CONTAINER, '/opt/mssql-tools18/bin/sqlcmd',
  '-S', 'localhost', '-U', 'sa', '-P', PASSWORD, '-C', '-d', DB, '-y', '0', '-w', '65535', '-Q', `SET NOCOUNT ON; ${query}`,
], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 })
  .split('\n').filter((l) => l.startsWith('ROW\x01')).map((l) => l.slice(4).trim());

const inList = (xs) => xs.map((x) => `'${x.replace(/'/g, "''")}'`).join(', ');

// ---- columns: nullability, has-default, is-computed (sys.columns so we can see computed
// columns — e.g. Person.DisplayName — which are NOT NULL/no-default but must NOT be inserted) ----
const colRows = sql(`SELECT 'ROW' + CHAR(1) + s.name + '.' + t.name + '|' + c.name + '|' + CAST(c.is_nullable AS CHAR(1)) + '|' + CASE WHEN c.default_object_id <> 0 THEN '1' ELSE '0' END + '|' + CAST(c.is_computed AS CHAR(1)) FROM sys.columns c JOIN sys.tables t ON c.object_id = t.object_id JOIN sys.schemas s ON t.schema_id = s.schema_id WHERE s.name + '.' + t.name IN (${inList(tableKeys)})`);
const tables = {};
for (const line of colRows) {
  const [tkey, col, nullable, hasDefault, computed] = line.split('|');
  (tables[tkey] ??= { columns: {}, checks: {} }).columns[col] = { nullable: nullable === '1', hasDefault: hasDefault === '1', computed: computed === '1' };
}

// ---- enum CHECK constraints → allowed value sets ----
const checkRows = sql(`SELECT 'ROW' + CHAR(1) + s.name + '.' + t.name + '||' + cc.definition FROM sys.check_constraints cc JOIN sys.tables t ON cc.parent_object_id = t.object_id JOIN sys.schemas s ON t.schema_id = s.schema_id WHERE s.name + '.' + t.name IN (${inList(tableKeys)})`);
for (const line of checkRows) {
  const sep = line.indexOf('||');
  const tkey = line.slice(0, sep);
  const def = line.slice(sep + 2);
  if (!tables[tkey]) continue;
  for (const [col, vals] of Object.entries(parseCheckValues(def))) {
    tables[tkey].checks[col] = [...new Set([...(tables[tkey].checks[col] ?? []), ...vals])].sort();
  }
}

// ---- seeded-lookup names (only the ones we reference need to exist) ----
const lookups = {};
for (const table of lookupTables) {
  const needed = claims.lookups[table];
  const present = sql(`SELECT 'ROW' + CHAR(1) + Name FROM ${table.split('.').map((p) => `[${p}]`).join('.')} WHERE Name IN (${inList(needed)})`);
  lookups[table] = present.sort();
}

const deps = (() => { try { return JSON.parse(readFileSync(join(APP_ROOT, 'mj-app.json'), 'utf8')).dependencies ?? {}; } catch { return {}; } })();
const contract = {
  $comment: 'GENERATED by cli/capture-contract.mjs — the real dependency+core schema our seeds assume. Re-capture ONLY when a dependency version is bumped; the diff is the drift report. Do not edit by hand.',
  capturedAt: new Date().toISOString(),
  database: DB,
  dependencyVersions: Object.fromEntries(Object.entries(deps).map(([k, v]) => [k, v.version])),
  tables,
  lookups,
};

mkdirSync(join(ROOT, 'contract'), { recursive: true });
const outFile = join(ROOT, 'contract', 'schema-contract.json');
writeFileSync(outFile, JSON.stringify(contract, null, 2) + '\n');
console.log(`captured ${Object.keys(tables).length} tables, ${Object.keys(lookups).length} lookup sets → ${outFile}`);
for (const [t, c] of Object.entries(tables)) {
  const nchecks = Object.keys(c.checks).length;
  console.log(`  ${t.padEnd(46)} ${String(Object.keys(c.columns).length).padStart(3)} cols${nchecks ? ` · ${nchecks} enum check(s)` : ''}`);
}
