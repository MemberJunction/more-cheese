// A zero-dep JSON Schema (draft-07 subset) validator, so engine/ruleset.schema.json — the
// schema the EDITOR reads for autocomplete and hover docs — can also be executed in the
// suite against all 19 real modules.
//
// Why not ajv: datagen has no node_modules and that is load-bearing (anyone can run it with
// a bare node). The subset here is exactly what the schema uses; an unrecognised keyword is
// a hard error rather than a silent pass, so the schema can never quietly outgrow this file.
//
// A schema nobody executes drifts from reality, and then the editor promises authors one
// thing while the build enforces another.

const KNOWN = new Set([
  '$schema', '$id', 'title', 'description', '$defs', '$ref', 'type', 'properties',
  'patternProperties', 'additionalProperties', 'propertyNames', 'required', 'enum',
  'minimum', 'maximum', 'exclusiveMinimum', 'exclusiveMaximum', 'minItems', 'maxItems',
  'items', 'anyOf', 'oneOf', 'allOf', 'not', 'pattern',
]);

const typeOf = (v) => (v === null ? 'null' : Array.isArray(v) ? 'array' : typeof v);

function resolveRef(ref, root) {
  if (!ref.startsWith('#/')) throw new Error(`only local $ref is supported, got ${ref}`);
  return ref.slice(2).split('/').reduce((o, k) => o?.[k.replace(/~1/g, '/').replace(/~0/g, '~')], root);
}

/**
 * Validate a value against a schema. Returns an array of human-readable errors ([] = valid).
 * @param {unknown} value
 * @param {object|boolean} schema
 * @param {object} [root] the document $ref resolves against (defaults to schema)
 * @param {string} [path] dotted path used in messages
 * @returns {string[]}
 */
export function validate(value, schema, root = schema, path = '') {
  if (schema === true) return [];
  if (!schema || typeof schema !== 'object') return [];
  for (const k of Object.keys(schema)) {
    if (!KNOWN.has(k)) throw new Error(`schema at ${path || '<root>'} uses unsupported keyword '${k}' — teach engine/schema-check.mjs about it`);
  }
  if (schema.$ref) {
    const target = resolveRef(schema.$ref, root);
    if (!target) throw new Error(`unresolvable $ref ${schema.$ref}`);
    return validate(value, target, root, path);
  }

  const errs = [];
  const at = (p, msg) => errs.push(`${p || '<root>'}: ${msg}`);
  const t = typeOf(value);

  if (schema.type) {
    const want = Array.isArray(schema.type) ? schema.type : [schema.type];
    const ok = want.some((w) => (w === 'integer' ? t === 'number' && Number.isInteger(value) : w === t));
    if (!ok) {
      at(path, `expected ${want.join(' or ')}, got ${t}${t === 'number' || t === 'string' ? ` (${JSON.stringify(value)})` : ''}`);
      return errs; // anything further would just be noise about the wrong type
    }
  }
  if (schema.enum && !schema.enum.some((e) => JSON.stringify(e) === JSON.stringify(value))) {
    at(path, `${JSON.stringify(value)} is not one of ${schema.enum.map((e) => JSON.stringify(e)).join(', ')}`);
  }
  // draft-07 semantics: the string MUST match. Inversion is expressed with `not`.
  if (t === 'string' && schema.pattern !== undefined && !new RegExp(schema.pattern).test(value)) {
    at(path, `${JSON.stringify(value)} does not match ${schema.pattern}`);
  }
  if (t === 'number') {
    if (schema.minimum !== undefined && value < schema.minimum) at(path, `${value} is below the minimum ${schema.minimum}`);
    if (schema.maximum !== undefined && value > schema.maximum) at(path, `${value} is above the maximum ${schema.maximum}`);
    if (schema.exclusiveMinimum !== undefined && value <= schema.exclusiveMinimum) at(path, `${value} must be greater than ${schema.exclusiveMinimum}`);
    if (schema.exclusiveMaximum !== undefined && value >= schema.exclusiveMaximum) at(path, `${value} must be less than ${schema.exclusiveMaximum}`);
  }
  if (t === 'array') {
    if (schema.minItems !== undefined && value.length < schema.minItems) at(path, `has ${value.length} items, needs at least ${schema.minItems}`);
    if (schema.maxItems !== undefined && value.length > schema.maxItems) at(path, `has ${value.length} items, allows at most ${schema.maxItems}`);
    if (Array.isArray(schema.items)) {
      schema.items.forEach((s, i) => { if (i < value.length) errs.push(...validate(value[i], s, root, `${path}[${i}]`)); });
    } else if (schema.items) {
      value.forEach((v, i) => errs.push(...validate(v, schema.items, root, `${path}[${i}]`)));
    }
  }
  if (t === 'object') {
    for (const r of schema.required ?? []) if (!(r in value)) at(path, `is missing the required key '${r}'`);
    if (schema.propertyNames) {
      for (const k of Object.keys(value)) {
        if (validate(k, schema.propertyNames, root, path).length) at(path, `key ${JSON.stringify(k)} is not a legal property name`);
      }
    }
    const pats = Object.entries(schema.patternProperties ?? {}).map(([p, s]) => [new RegExp(p), s]);
    for (const [k, v] of Object.entries(value)) {
      const child = `${path}${path ? '.' : ''}${k}`;
      let matched = false;
      if (schema.properties && k in schema.properties) {
        matched = true;
        errs.push(...validate(v, schema.properties[k], root, child));
      }
      for (const [re, s] of pats) {
        if (re.test(k)) { matched = true; errs.push(...validate(v, s, root, child)); }
      }
      if (matched) continue;
      if (schema.additionalProperties === false) at(child, 'is not an expected key here');
      else if (schema.additionalProperties && typeof schema.additionalProperties === 'object') {
        errs.push(...validate(v, schema.additionalProperties, root, child));
      }
    }
  }
  // allOf is how the root document layers the recursive node rules on top of its own
  // per-block descriptions (draft-07 ignores keywords sitting beside a bare $ref).
  for (const s of schema.allOf ?? []) errs.push(...validate(value, s, root, path));
  if (schema.not && validate(value, schema.not, root, path).length === 0) at(path, 'matches a forbidden shape');
  if (schema.anyOf && !schema.anyOf.some((s) => validate(value, s, root, path).length === 0)) {
    // When every branch is just a required-key list, say which keys — "matches none of the 3
    // allowed forms" tells an author nothing about what to type.
    const keys = schema.anyOf.every((s) => Object.keys(s).length === 1 && s.required)
      ? schema.anyOf.flatMap((s) => s.required).join(' or ')
      : null;
    at(path, keys ? `needs one of: ${keys}` : `matches none of the ${schema.anyOf.length} allowed forms for this key`);
  }
  if (schema.oneOf) {
    const n = schema.oneOf.filter((s) => validate(value, s, root, path).length === 0).length;
    if (n !== 1) {
      const forms = schema.oneOf.map((s) => (s.required ?? []).join(' + ')).filter(Boolean).join(' | ');
      at(path, n === 0 ? `must declare exactly one of: ${forms}` : `declares ${n} mutually exclusive forms (${forms}) — keep one`);
    }
  }
  return errs;
}
