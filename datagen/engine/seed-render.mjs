// SEED RENDERING — the generic half of seed delivery.
//
// One projection per table, rendered to BOTH delivery paths: raw SQL for a direct database install,
// and MetadataSync records for loading through an app's own procedures. That consolidation is why a
// column can no longer be right in one path and wrong in the other.
//
// NOTHING HERE KNOWS A DOMAIN. The mapping itself — which pack table becomes which SQL table, what
// the columns are, the polymorphic-reference preambles — is the project's, and lives in
// projects/<name>/seed-mapping.mjs. This file used to contain both: 901 lines in engine/, of which
// 155 lines mentioned MoreCheese tables, in direct violation of the extraction rule FRAMEWORK.md
// states two screens above. A second project inherited the machinery and then had to fork the
// mapping.
//
// MODE is module state, read by the project's formatters through mode(). That coupling is
// deliberate and narrow: renderRecord flips it around one projection call so the same columns()
// function yields SQL literals or raw sync values.

let MODE = 'sql';
export const sqlStr = (v) => MODE === 'sync' ? (v ?? null) : v == null ? 'NULL' : `N'${String(v).replace(/'/g, "''")}'`;
export const sqlNum = (v) => MODE === 'sync' ? (v ?? null) : v == null ? 'NULL' : String(v);
export const sqlBit = (v) => MODE === 'sync' ? (v ?? null) : v == null ? 'NULL' : v ? '1' : '0';
export const sqlDate = (v) => MODE === 'sync' ? (v ?? null) : v == null ? 'NULL' : `'${v}'`;
export const sqlId = (v) => MODE === 'sync' ? (v ?? null) : v == null ? 'NULL' : `'${v}'`;
// raw expression (a DECLAREd @variable) on the SQL path; its @lookup twin on the sync path

/** The current render mode. The project's own formatters read this. */
export const mode = () => MODE;

/** Render one row as a MetadataSync record — the sync twin of columns(). Entries that ship
 *  via MetadataSync carry dir + entity; syncPk overrides the primary-key column (default ID,
 *  e.g. IssueNumberSequence keys on ScopeCode); syncOmit lists SQL-only columns. */
export function renderRecord(entry, row) {
  MODE = 'sync';
  try {
    const cols = entry.columns(row);
    const pkName = entry.syncPk ?? 'ID';
    const { [pkName]: pk, ...fields } = cols;
    if (entry.syncOmit) for (const k of entry.syncOmit) delete fields[k];
    if (entry.syncOverride) for (const [k, fn] of Object.entries(entry.syncOverride)) fields[k] = fn(row);
    return { primaryKey: { [pkName]: pk }, fields };
  } finally { MODE = 'sql'; }
}

// ---------- the mapping: JSON pack tables → SQL tables (ASSUMED shapes) ----------
// THE PERSON/ORG SPLIT (the schema owner's v2-plan §4.2 ruling, landed 2026-07-14): identity rows go
// to bizapps-common's tables (their REAL columns, from bizapps-common
// migrations/B202602271452); everything member-ish becomes an extension-profile row in OUR
// morecheese_members schema carrying the PersonID/OrganizationID. The pinned uuidv5 IDs make
// the FK pairs line up by construction — parent and child derive them independently.
// IsSharedDemo never goes on bizapps-common tables (not ours to alter — memo §2.5); demo

// ---------- emit: one .sql per pack, batched multi-row INSERTs, pack order = install order ----------
export const BATCH = 500; // SQL Server allows 1000 rows per VALUES; stay comfortably under

//   'insert'   — Skyway INSERT data migrations (emit-data-migration.mjs → Seed_NN_*.sql)
//   'metadata' — MJ MetadataSync push through the entity SPs (emit-mjsync.mjs tree, applied
//                as MetadataSync migrations — the approach in PR #3)
// the entity SPs via emit-mjsync.mjs → MetadataSync migrations (PR #3's approach). The INSERT
// path (emit-data-migration.mjs) is now the EXCEPTION, used only by 'platform'.
// 'platform' is PINNED to 'insert' FOREVER: it forges state the entity layer refuses to forge —
// direct __mj.RecordChange audit rows and back-dated Conversation __mj_CreatedAt timestamps —
// which a push through the SPs would reject or re-stamp "now", destroying the "someone has used
// this instance" effect that is the pack's whole purpose. emit-data-migration.mjs emits only

/**
 * One pack's INSERT lines. Generic: the MAPPING is passed in, because which pack table becomes
 * which database table is the project's knowledge, not the engine's.
 */
export function packSqlLines(mapping, pack, load, { transformTable = (t) => t } = {}) {
  const lines = [];
  const summary = [];
  for (const t of mapping[pack]) {
    const rows = load(pack, t.json).filter(t.only ?? (() => true));
    const table = transformTable(t.table);
    if (rows.length === 0) {
      lines.push(`-- ${table}: 0 rows`, '');
      summary.push({ table: t.table, rows: 0 });
      continue;
    }
    const cols = Object.keys(t.columns(rows[0]));
    lines.push(`-- ${table}: ${rows.length} rows`);
    for (let i = 0; i < rows.length; i += BATCH) {
      const batch = rows.slice(i, i + BATCH);
      lines.push(`INSERT INTO ${table} (${cols.map((c) => `[${c}]`).join(', ')})`);
      lines.push('VALUES');
      lines.push(batch.map((r) => `  (${Object.values(t.columns(r)).join(', ')})`).join(',\n') + ';');
      lines.push('');
    }
    summary.push({ table: t.table, rows: rows.length });
  }
  return { lines, summary };
}

