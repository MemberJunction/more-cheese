// THE INVISIBLE ORDERING EDGES.
//
// buildWorld's call order is mostly self-enforcing: a stage that takes `programs` as an argument
// cannot run before programs exists, and JavaScript says so.
//
// These edges are the ones nothing enforces. Each is a stage that MUTATES a shared object which a
// later stage reads — the argument lists look identical either way, so swapping two calls compiles,
// runs, and produces quietly different data. Until now they lived only in comments, which do not
// object when someone moves a line.
//
// Only declare an edge here if it is genuinely invisible. An edge already implied by an argument
// list does not belong: a second copy of a constraint the language enforces is a copy that can
// drift.

/** @type {readonly {before: string, after: string, why: string}[]} */
export const mustPrecede = [
  {
    before: 'applyMotifs',
    after: 'runRenewalUnroll',
    why: 'motifs stamp _lapseYear onto people, and the unroll reads it as a PINNED outcome. Both take `people`, so nothing enforces the order — run the unroll first and every stamped archetype silently loses its story.',
  },
  {
    before: 'applyMotifs',
    after: 'buildRegistrations',
    why: 'motifs write _thetaPath (an authored engagement arc). Every downstream domain that scores on engagement reads it, and reads a flat _theta instead if motifs have not run.',
  },
  {
    before: 'applyMotifs',
    after: 'buildLearning',
    why: 'same _thetaPath dependency: a rising star who has not risen yet takes courses like anyone else.',
  },
  {
    before: 'applyMotifs',
    after: 'buildCommittees',
    why: 'same _thetaPath dependency: committee volunteering scores on the arc, not the anchor.',
  },
  {
    before: 'buildDefects',
    after: 'buildPlatform',
    why: 'defects REWRITE relationship edges (the true-employer correction) and mutate emails in place. Platform mirrors those timelines in its audit rows, so running it first records history that the finished world does not contain.',
  },
  {
    before: 'buildRelationships',
    after: 'buildDefects',
    why: 'defects append true-employer edges to the relationships array, so relationships must exist as an array first. Visible in the argument list today, declared here because the DIRECTION is the load-bearing part: defects mutate, they do not receive a copy.',
  },
];
