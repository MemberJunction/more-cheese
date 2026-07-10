// Deterministic real UUIDs from business keys (UUIDv5: SHA-1 over namespace + name).
// The same entity gets the same UUID in every release — stable joins, minimal seed diffs,
// and parent/child can derive FK references independently (no lookups). Used by every
// emitter that needs database-grade IDs (SQL, mj-sync).

import { createHash } from 'node:crypto';

const NAMESPACE = Buffer.from('9b1dcbf2c05341e8a2f4d40e11ce66a1', 'hex'); // fixed forever — changing it changes every ID

export function uuidFor(entity, businessKey) {
  const h = createHash('sha1').update(NAMESPACE).update(`${entity}:${businessKey}`).digest();
  h[6] = (h[6] & 0x0f) | 0x50; // version 5
  h[8] = (h[8] & 0x3f) | 0x80; // RFC variant
  const x = h.subarray(0, 16).toString('hex').toUpperCase();
  return `${x.slice(0, 8)}-${x.slice(8, 12)}-${x.slice(12, 16)}-${x.slice(16, 20)}-${x.slice(20, 32)}`;
}
