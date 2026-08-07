// Members — the fixture roster.
//
// One draw per person on its own stream, from this project's own name bank. No pattern: a roster
// is not a decision, it is the population every decision is made over.

import { rng } from '../../engine/rng.mjs';
import { renderRow } from '../../engine/row-template.mjs';

// ── row templates ── column order is pack serialization order, which is byte identity
export const MEMBER_ROW = { row: {
  MemberNumber: { from: 'key' },
  FirstName: { from: 'first' },
  LastName: { from: 'last' },
  JoinYear: { from: 'joinYear' },
  Kind: { mix: 'kinds' },
  IsFixture: true,
  _keenness: { from: 'keenness' }, // internal: the emitter REFUSES any `_` field that survives
} };

export function buildMembers(cfg) {
  // ── inputs ── the ruleset sections this domain reads
  const { R, seed, releaseYear } = cfg;
  const M = R.members;

  // ── decisions ── per member: name, join year, keenness. One stream each, order fixed.
  const members = [];
  for (let i = 0; i < cfg.n; i++) {
    const key = `FX-${String(1001 + i)}`;
    const r = rng(seed, `member:${key}`);
    members.push(renderRow(r, MEMBER_ROW, {
      key,
      first: r.pick(M.catalog.firstNames),
      last: r.pick(M.catalog.lastNames),
      joinYear: r.int(R.history.startYear, releaseYear),
      kinds: R.outings.mixes.kind,           // a member's preferred kind, drawn from the declared mix
      keenness: +r.normal(0, M.params.keennessSd).toFixed(4),
    }));
  }

  // ── shape ── assemble the named tables this domain owns
  return { members };
}
