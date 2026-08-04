// THE REFERENCE GRAPH for the fixture project — two edges, and they generate their own gates.
//
// The point of declaring them in a project this small is to prove the derived-check layer is not
// MoreCheese's: an engine that only produced gates for the project it was extracted from would be
// a validator with good documentation.

/** @type {readonly import('../../engine/checks.mjs').Ref[]} */
export const refs = [
  { from: ['circle', 'outings', 'MemberNumber'], to: ['circle', 'members', 'MemberNumber'] },
  { from: ['circle', 'members', 'Kind'], to: ['circle', 'outings', 'KindKey'],
    note: 'a member prefers a kind of outing that actually exists in the data' },
];
