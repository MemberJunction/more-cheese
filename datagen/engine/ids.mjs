// Deterministic real UUIDs from business keys (UUIDv5: SHA-1 over namespace + name).
// The same entity gets the same UUID in every release — stable joins, minimal seed diffs,
// and parent/child can derive FK references independently (no lookups). Used by every
// emitter that needs database-grade IDs (SQL, mj-sync).

import { createHash } from 'node:crypto';

// COLLISION MODEL: within a namespace, entity-prefixed names ('person:…', 'order:…') are
// unique by construction; accidental SHA-1 collisions are ~10^-24 at our scale; and PK
// uniqueness makes the impossible case fail loudly rather than corrupt. The ONE real
// hazard is procedural: deterministic IDs mean a cloned app reusing this namespace with
// overlapping business keys would mint the SAME UUIDs by construction. Framework rule:
// **one namespace per domain/app** — a new domain mints its own constant (uuidgen) and
// never changes it after first push. This constant belongs to MoreCheese, forever.
const NAMESPACE = Buffer.from('9b1dcbf2c05341e8a2f4d40e11ce66a1', 'hex'); // fixed forever — changing it changes every ID

export function uuidFor(entity, businessKey) {
  const h = createHash('sha1').update(NAMESPACE).update(`${entity}:${businessKey}`).digest();
  h[6] = (h[6] & 0x0f) | 0x50; // version 5
  h[8] = (h[8] & 0x3f) | 0x80; // RFC variant
  const x = h.subarray(0, 16).toString('hex').toUpperCase();
  return `${x.slice(0, 8)}-${x.slice(8, 12)}-${x.slice(12, 16)}-${x.slice(16, 20)}-${x.slice(20, 32)}`;
}
