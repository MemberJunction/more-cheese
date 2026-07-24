// SCHEMA CONTRACT — makes our IMPLICIT assumptions about dependency + core schemas
// EXPLICIT and checkable. The generator inserts into tables it does NOT own (__mj,
// __mj_BizApps*); seed-mapping.mjs quietly assumes their columns, CHECK value lists, and
// seeded lookup names. This module extracts those assumptions from the mapping itself
// (no hand-maintained lists) so a captured snapshot of the REAL schema can be diffed
// against them — a moved column or a tightened CHECK fails the suite in milliseconds
// instead of surviving to a 13-minute install. See datagen/SCHEMA-CONTRACT.md.

// Recover a bare string literal from an emitted SQL value: N'Active' → Active,
// 'Active' → Active, doubling-escapes undone. NULL / numbers / @vars → null (not a literal
// we can check against a CHECK list).
export function literalOf(expr) {
  if (typeof expr !== 'string') return null;
  const m = expr.match(/^N?'([\s\S]*)'$/);
  return m ? m[1].replace(/''/g, "'") : null;
}

// Parse a SQL Server CHECK definition of the OR-equality / IN-list enum form into
// { column: [allowed values] }. Composite/range/function CHECKs don't reduce to a value
// set and are simply not represented (the gate skips columns with no captured list).
export function parseCheckValues(definition) {
  const out = {};
  for (const m of definition.matchAll(/\[(\w+)\]\s*=\s*N?'([^']*)'/g)) {
    (out[m[1]] ??= new Set()).add(m[2].replace(/''/g, "'"));
  }
  return Object.fromEntries(Object.entries(out).map(([k, v]) => [k, [...v]]));
}

const stripBrackets = (s) => s.replace(/[\[\]]/g, '');

// The tables + columns + emitted literal values we DEPEND ON, derived by running each
// mapping's columns() over the actually-emitted rows (union across rows — some columns are
// conditional). load(pack, jsonName) → rows[]. Returns a JSON-friendly claims object.
export function extractClaims({ MAPPING, PREAMBLE, load }) {
  const tables = {};
  for (const [pack, defs] of Object.entries(MAPPING)) {
    for (const def of defs) {
      const tkey = stripBrackets(def.table);
      const entry = (tables[tkey] ??= { columns: new Set(), literals: {} });
      let rows = [];
      try { rows = load(pack, def.json); } catch { rows = []; }
      for (const row of rows) {
        const cols = def.columns(row);
        for (const [col, expr] of Object.entries(cols)) {
          entry.columns.add(col);
          const lit = literalOf(expr);
          if (lit != null) (entry.literals[col] ??= new Set()).add(lit);
        }
      }
    }
  }

  // seeded-lookup names our PREAMBLE requires to resolve at load time
  // (DECLARE ... = (SELECT ID FROM <table> WHERE Name = N'<name>'))
  const lookups = {};
  for (const lines of Object.values(PREAMBLE)) {
    for (const m of lines.join('\n').matchAll(/FROM\s+(\S+?)\s+WHERE\s+Name\s*=\s*N'([^']+)'/gi)) {
      const table = stripBrackets(m[1]);
      (lookups[table] ??= new Set()).add(m[2]);
    }
  }

  return {
    tables: Object.fromEntries(Object.entries(tables).map(([k, v]) => [k, {
      columns: [...v.columns].sort(),
      literals: Object.fromEntries(Object.entries(v.literals).map(([c, s]) => [c, [...s].sort()])),
    }])),
    lookups: Object.fromEntries(Object.entries(lookups).map(([k, v]) => [k, [...v].sort()])),
  };
}

// Compare claims against a captured contract snapshot. Returns a list of human-readable
// drift problems (empty = clean). Pure: no I/O, both inputs are plain objects.
export function checkClaims(claims, contract) {
  const problems = [];
  for (const [tkey, claim] of Object.entries(claims.tables)) {
    if (!claim.columns.length) continue; // emitted no rows this build → nothing to check
    const real = contract.tables[tkey];
    if (!real) { problems.push(`${tkey}: table we insert into is absent from the contract`); continue; }

    // (1) every column we emit still exists
    for (const col of claim.columns) {
      if (!real.columns[col]) problems.push(`${tkey}.${col}: we insert it but the real table has no such column`);
    }
    // (2) every required (NOT NULL, no default, not computed) column is supplied
    for (const [col, meta] of Object.entries(real.columns)) {
      if (!meta.nullable && !meta.hasDefault && !meta.computed && !claim.columns.includes(col)) {
        problems.push(`${tkey}.${col}: required (NOT NULL, no default) but we don't supply it → insert would fail`);
      }
    }
    // (3) every literal we emit into a CHECK column is allowed
    for (const [col, values] of Object.entries(claim.literals)) {
      const allowed = real.checks?.[col];
      if (!allowed) continue; // no enum CHECK on this column
      for (const v of values) {
        if (!allowed.includes(v)) problems.push(`${tkey}.${col}: we emit '${v}' but CHECK allows {${allowed.join(', ')}}`);
      }
    }
  }
  // (4) every seeded-lookup name our preamble needs exists
  for (const [table, names] of Object.entries(claims.lookups)) {
    const real = contract.lookups[table];
    if (!real) { problems.push(`lookup ${table}: preamble resolves names here but the contract has no such lookup`); continue; }
    for (const n of names) if (!real.includes(n)) problems.push(`lookup ${table}: preamble needs Name='${n}' but the contract doesn't have it`);
  }
  return problems;
}
