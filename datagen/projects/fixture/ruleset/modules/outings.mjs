// OUTINGS — who goes on an outing each year, and what kind it was.
//
// ─── THE SHAPE ─────────────────────────────────────────────────────────────────────────────
//   catalog   the kinds of outing that exist
//   params    the participation rate that is ENFORCED
//   effects   keener members go more often
//   mixes     which kind an outing turns out to be
//
// One decision, one pattern (annualParticipation). Written with `beta`, never `liftPts` — the
// human forms are only solved for the block a project points its calibration machinery at, and
// this project points at nothing, so anything else would stay undefined and draw ZERO ROWS.

export default {
  outings: {
    catalog: {
      kinds: [
        { key: 'shore', name: 'Shore walk' },
        { key: 'ridge', name: 'Ridge hike' },
        { key: 'night', name: 'Night survey' },
      ],
    },
    params: {
      // a pair means a check ENFORCES it: the build fails until measurements.mjs can measure it
      participation: { target: 0.4, tolerance: 0.08, se: 3 },
    },
    effects: {
      'join.keenness': {
        beta: 0.7,
        label: 'med',
        note: 'keener members turn up more — the only causal claim this fixture makes',
        evidence: 'INVENTED — this project is a test fixture, not a model of anything',
      },
    },
    mixes: {
      // every option is required to appear once presence.mjs says where it lands
      kind: { shore: 0.5, ridge: 0.35, night: 0.15 },
    },
  },
};
