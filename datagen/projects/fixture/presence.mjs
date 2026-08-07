// WHERE EACH DECLARED MIX LANDS. Declaring a mix is a promise that every option appears in the
// data; this says where to look, and the engine turns it into a floor per option.
//
// `night` is 15% of a 54-row table, so its expected count is ~8 — comfortably above the floor.
// A rarer option in a fixture this small would fail, which is the floor doing its job: at N=50
// there genuinely is not enough data to demonstrate a 1% category.

export const mixLandings = {
  'outings.mixes.kind': { at: ['circle', 'outings', 'KindKey'] },
};
