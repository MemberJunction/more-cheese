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
// Framework rule: **one namespace per project.** A project registers its own constant here
// (uuidgen once) and never changes it after first push — changing it changes every ID it has
// ever shipped.
//
// This used to be a single module-level const, which made the rule unenforceable: FRAMEWORK.md
// promised that "a second domain passes its own", and there was no parameter to pass it
// through. A second project would silently mint MoreCheese's ID space — exactly the hazard
// described above, in the file warning about it.
const NAMESPACES = {
  // Belongs to MoreCheese, forever. Do not reuse, do not change.
  morecheese: '9b1dcbf2c05341e8a2f4d40e11ce66a1',
};

let active = null;

/**
 * Bind the ID namespace for this run, from the project name. The loader calls this, so a project
 * cannot forget to; entry points that mint IDs without loading a ruleset (the emitters) may call
 * it too.
 * @param {string} project
 */
export function useNamespace(project) {
  const hex = NAMESPACES[project];
  if (!hex) {
    throw new Error(
      `project '${project}' has no UUID namespace. Deterministic IDs mean two projects sharing a `
      + `namespace mint the SAME UUIDs for overlapping business keys. Generate one with \`uuidgen\`, `
      + `add it to NAMESPACES in engine/ids.mjs, and never change it after the first push.`,
    );
  }
  active = Buffer.from(hex, 'hex');
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
  const names = Object.keys(NAMESPACES);
  if (names.length === 1) return Buffer.from(NAMESPACES[names[0]], 'hex');
  throw new Error(
    `uuidFor called with no namespace bound, and ${names.length} projects are registered `
    + `(${names.join(', ')}). Whichever entry point reached here must call useNamespace(project) `
    + `first — guessing would mint another project's IDs.`,
  );
}

export function uuidFor(entity, businessKey) {
  const h = createHash('sha1').update(resolve()).update(`${entity}:${businessKey}`).digest();
  h[6] = (h[6] & 0x0f) | 0x50; // version 5
  h[8] = (h[8] & 0x3f) | 0x80; // RFC variant
  const x = h.subarray(0, 16).toString('hex').toUpperCase();
  return `${x.slice(0, 8)}-${x.slice(8, 12)}-${x.slice(12, 16)}-${x.slice(16, 20)}-${x.slice(20, 32)}`;
}
