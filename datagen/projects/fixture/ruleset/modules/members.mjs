// MEMBERS — the roster. A fixture roster, drawn from this project's OWN name bank.
//
// ─── THE SHAPE ─────────────────────────────────────────────────────────────────────────────
//   catalog   the name bank
//   params    the keenness spread
//
// The bank lives here rather than in a shared module on purpose: name banks are project data.
// MoreCheese's banks are in projects/morecheese/banks.mjs and this project cannot see them —
// which is the boundary working, not an inconvenience.

export default {
  members: {
    catalog: {
      firstNames: ['Ada', 'Bo', 'Cai', 'Dev', 'Eli', 'Fen', 'Gil', 'Hana'],
      lastNames: ['Aster', 'Birch', 'Cedar', 'Dune', 'Elm', 'Fern'],
    },
    params: {
      // keenness ~ Normal(0, 1); the outings decision scores against it
      keennessSd: 1,
    },
  },
};
