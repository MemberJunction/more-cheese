// Outings — the one decision this fixture makes.
//
// "Each year, some of the roster goes on an outing" is annualParticipation, verbatim from the
// pattern table in ADDING-A-DOMAIN.md step 2. The target is PER YEAR — the share of that year's
// eligible pool — which is the denominator mistake the docs warn about twice.

import { annualParticipation } from '../../engine/patterns.mjs';
import { renderRow } from '../../engine/row-template.mjs';
import { yearsOf, stripInternals } from '../../engine/authoring.mjs';

// ── row templates ── two draws, in column order: the kind, then the day offset
export const OUTING_ROW = { row: {
  OutingKey: { fmt: 'OUT-{member.MemberNumber}-{year}' },
  MemberNumber: { from: 'member.MemberNumber' },
  Year: { from: 'year' },
  KindKey: { mix: 'kinds' },
  WentOn: { date: { anchor: 'anchor', offset: { dist: 'uniformDays', min: 0, max: 120 } } },
  IsFixture: true,
} };

export function buildOutings(cfg, { members }) {
  // ── inputs ── the ruleset sections this domain reads, and the upstream rows
  const { R, seed } = cfg;
  const O = R.outings;

  // ── decisions ── one pattern call, one decision
  const outings = annualParticipation({
    seed,
    years: yearsOf(cfg),
    minPool: 1, // a fixture roster is small; the default of 5 would skip its early years
    poolOf: (y) => members.filter((m) => m.JoinYear <= y),
    scoreOf: (m) => O.effects['join.keenness'].beta * m._keenness,
    target: O.params.participation.target,
    streamKey: (m, y) => `outing:${m.MemberNumber}:${y}`,
    spawn: (r, m, y) => renderRow(r, OUTING_ROW, {
      member: m, year: y, kinds: O.mixes.kind, anchor: `${y}-05-01`,
    }),
  });

  // ── shape ── assemble the named tables this domain owns
  stripInternals(outings);
  return { outings };
}
