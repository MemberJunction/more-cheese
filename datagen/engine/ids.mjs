// Deterministic real UUIDs from business keys (UUIDv5: SHA-1 over namespace + name).
// The same entity gets the same UUID in every release — stable joins, minimal seed diffs,
// and parent/child can derive FK references independently (no lookups). Used by every
// emitter that needs database-grade IDs (SQL, mj-sync).

import { createHash } from 'node:crypto';

// COLLISION MODEL: within a namespace, entity-prefixed names ('person:…', 'order:…') are
// unique by construction; accidental SHA-1 collisions are ~10^-24 at our scale; and PK
// uniqueness makes the impossible case fail loudly rather than corrupt. The ONE real
// hazard is procedural: deterministic IDs mean a cloned app reusing a namespace with
// overlapping business keys would mint the SAME UUIDs by construction.
//
// Framework rule: **one namespace per project**, and THE PROJECT OWNS IT. A project exports
// `UUID_NAMESPACE` from its index.mjs (uuidgen once) and never changes it after first push —
// changing it changes every ID it has ever shipped.
//
// It used to be a registry in THIS FILE, keyed by project name, and that was wrong in a way worth
// recording: the engine held a table of every project's ID space, so standing up a second project
// meant editing the engine — and this module's own error message said so, instructing authors to
// "add it to NAMESPACES in engine/ids.mjs". An engine that must be edited to add a consumer is not
// a framework, it is a library with a hardcoded caller list. The registry was itself the fix for an
// earlier version that had one module-level const; both versions kept the value on the wrong side
// of the boundary.
//
// The hazard the rule guards against is unchanged: deterministic IDs mean two projects sharing a
// namespace mint the SAME UUIDs for overlapping business keys.

/** namespaces bound this run, project → Buffer. Populated by useNamespace, never by the engine. */
const bound = new Map();
let active = null;

/**
 * Bind the ID namespace for this run. The loader calls this with the project's own declared
 * namespace, so a project cannot forget to and cannot borrow another project's space.
 * @param {string} project
 * @param {string} hex 32 hex chars — the project's `UUID_NAMESPACE`
 */
export function useNamespace(project, hex) {
  if (!hex || !/^[0-9a-fA-F]{32}$/.test(hex)) {
    throw new Error(
      `project '${project}' did not declare a valid UUID_NAMESPACE (got ${hex === undefined ? 'nothing' : `'${hex}'`}). `
      + 'Deterministic IDs mean two projects sharing a namespace mint the SAME UUIDs for overlapping '
      + `business keys. Generate one with \`uuidgen\` (strip the dashes), export it as UUID_NAMESPACE `
      + `from projects/${project}/index.mjs, and never change it after the first push.`,
    );
  }
  const buf = Buffer.from(hex, 'hex');
  bound.set(project, buf);
  active = buf;
}

/**
 * The namespace to use when nothing has bound one — which happens in every entry point that mints
 * IDs without loading a ruleset (the emitters read finished packs; the suite extracts schema
 * claims). While ONE project is registered there is no ambiguity, so falling back to it is safe
 * and keeps those paths working.
 *
 * The moment a SECOND namespace is registered that reasoning collapses, and this throws instead —
 * so the error arrives exactly when the hazard becomes real, naming the entry point that needs an
 * explicit binding, rather than nagging while it is impossible or staying silent once it isn't.
 */
function resolve() {
  if (active) return active;
  if (bound.size === 1) return [...bound.values()][0];
  throw new Error(
    bound.size === 0
      ? 'uuidFor called before any namespace was bound. The entry point that reached here must load '
        + 'a project (which binds it) or call useNamespace(project, hex) itself — there is nothing to '
        + 'guess from, and guessing would mint IDs in the wrong space.'
      : `uuidFor called with no namespace bound, and ${bound.size} projects are bound this run `
        + `(${[...bound.keys()].join(', ')}). Whichever entry point reached here must call `
        + 'useNamespace(project, hex) first — guessing would mint another project\'s IDs.',
  );
}

export function uuidFor(entity, businessKey) {
  const h = createHash('sha1').update(resolve()).update(`${entity}:${businessKey}`).digest();
  h[6] = (h[6] & 0x0f) | 0x50; // version 5
  h[8] = (h[8] & 0x3f) | 0x80; // RFC variant
  const x = h.subarray(0, 16).toString('hex').toUpperCase();
  return `${x.slice(0, 8)}-${x.slice(8, 12)}-${x.slice(12, 16)}-${x.slice(16, 20)}-${x.slice(20, 32)}`;
}
