// THE FIXTURE PROJECT — the second consumer, and the only real test of the framework claim.
//
// WHAT THIS IS FOR. Every abstraction in engine/ was extracted from one project, so every one of
// them could be MoreCheese-shaped without anybody noticing. A framework validated on a single
// consumer is a guess. This project exists so that "a new project needs zero engine edits" is a
// statement the suite can check rather than a hope.
//
// WHAT IT IS NOT. It is not a demo, it is not shipped, it is not installed, and it does not
// represent any real organisation. Fifty invented members and one decision. If you are looking for
// the real dataset, it is projects/morecheese/.
//
// Deliberately built by following engine/README.md literally, writing nothing the document did not
// say to write. Where the engine resisted, that is recorded in FINDINGS.md next to this file —
// those findings are the deliverable, more than the project is.

import { buildMembers } from './members.mjs';
import { buildOutings } from './outings.mjs';
import { stripInternals } from '../../engine/authoring.mjs';

/**
 * THIS PROJECT'S UUID NAMESPACE — `uuidgen` once, frozen forever.
 *
 * Distinct from MoreCheese's by construction. Deterministic IDs mean two projects sharing a
 * namespace would mint IDENTICAL UUIDs for overlapping business keys, and this project's keys
 * (FX-1001…) are short enough to collide with anything.
 */
export const UUID_NAMESPACE = '0d9d25aa5b0c4946b4820e4a5078e0c7';

/**
 * The engine calls exactly these hooks. This project declares every effect directly as `beta`, so
 * there is nothing to solve — `arrowsOf` returns an empty map and the compiler's human-form passes
 * have nothing to do. The remaining compile hooks (overallTarget, features, syntheticPop,
 * refineMeasure) exist for calibrated human forms and are genuinely unnecessary here.
 *
 * `domainLint` is a project's own cross-reference checks — this one has no cross-references worth
 * checking, so it is a no-op rather than absent, because absent would make the engine's call site
 * conditional and this project exists to exercise the normal path.
 */
export const hooks = {
  compile: {
    arrowsOf: () => ({}),
  },
  // MUST return an array of problem strings — the engine spreads the result. Returning nothing
  // crashes with "domainLint(...) is not iterable", which is finding #2 in FINDINGS.md.
  domainLint: () => [],
};

export function buildWorld(cfg) {
  const { members } = buildMembers(cfg);
  const { outings } = buildOutings(cfg, { members });
  // AFTER the decision, not before: outings scores against member._keenness, so the internal has
  // to survive generation and die before emission. Shipping it is refused by the emitter, which is
  // how this ordering got learned rather than remembered (finding #4).
  stripInternals(members);
  return { members, outings };
}

/** This project's own validator, in this project's directory. It runs the engine's derived gates
 *  and adds the one claim no declaration can state. Naming a cli/ script also works — that is how
 *  MoreCheese keeps cli/validate.mjs — but a project should own its validation. */
export const VALIDATOR = 'validate.mjs';

/** Everything generated here ships, so this is empty — but it must EXIST, because the emitter's
 *  unshipped-table check reads it. An empty object is the honest declaration. */
export const NOT_SHIPPED = {};

export function buildPacks(world) {
  const { members, outings } = world;
  return {
    circle: {
      dependsOn: [],
      tables: {
        members,
        outings,
      },
    },
  };
}
