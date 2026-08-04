// THE PROJECT-GENERIC CHECK RUNNER.
//
// Until now the four declaration-derived check kinds lived INSIDE cli/validate.mjs — 1,600 lines of
// MoreCheese. So a second project inherited none of them: it got the ruleset lint, the data-only
// guard, and nothing else. No gates, and no way to say "this target should hold" and have it
// checked. That was the last structural gap between "a framework" and "one project's validator
// with good documentation".
//
// This inverts it. The runner is generic and lives here; each project supplies only declarations:
//
//   projects/<name>/refs.mjs          the reference graph        → dangling-reference gates
//   projects/<name>/presence.mjs      where each mix lands       → presence floors
//   projects/<name>/measurements.mjs  how to measure a target    → target band gates
//
// All three are OPTIONAL. A project with none gets the coverage gates only, which will tell it what
// it is missing — which is the right first message for a project on day one.
//
// PHASES matter. Reference gates run in the REFERENTIAL phase, before a validator's fail-fast
// bailout: a broken reference graph makes every causal measurement meaningless, so the run stops
// there. Target gates run at the END, once the world is known good. Getting this wrong is not
// theoretical — wiring the reference gates after the bailout meant a dangling reference stopped the
// run before they executed, and they reported green by never running.

const optional = async (spec) => {
  try { return await import(spec); } catch { return null; }
};

/**
 * @param {object} opts
 * @param {string} opts.project
 * @param {object} opts.R composed ruleset
 * @param {(pack: string, table: string) => any[]} opts.load
 * @param {string[]} [opts.packs] every emitted pack name, if the caller can enumerate them
 * @param {(name: string, ok: boolean, detail?: string) => void} opts.check
 * @param {'referential'|'final'} phase
 * @returns {Promise<{kinds: string[], counts: Record<string, number>}>}
 */
export async function runDerivedChecks({ project, R, load, check, packs }, phase) {
  const { runRefChecks, runPresenceChecks, runTargetChecks, runInstallOrderChecks, runDiscriminatorChecks } = await import('./checks.mjs');
  const base = `../projects/${project}/`;
  const kinds = [];
  const counts = {};

  if (phase === 'referential') {
    const refsMod = await optional(`${base}refs.mjs`);
    if (refsMod?.refs) {
      runRefChecks(refsMod.refs, load, check);
      kinds.push('references');
      counts.references = refsMod.refs.length;
      // every polymorphic kind present in the data must have a declared edge
      runDiscriminatorChecks(refsMod.refs, load, check);
      // the same declarations, read for a different claim: the packs' install order
      runInstallOrderChecks(refsMod.refs, load, check, packs);
      kinds.push('install order');
      counts.installOrder = 2;
    }

    const presenceMod = await optional(`${base}presence.mjs`);
    if (presenceMod?.mixLandings) {
      const { ran, unlanded } = runPresenceChecks(R, presenceMod.mixLandings, load, check);
      check(
        `every declared mix has a landing site (${Object.keys(presenceMod.mixLandings).length} declared)`,
        unlanded.length === 0,
        unlanded.length ? `NO LANDING: ${unlanded.join(', ')}` : 'no mix ships unchecked',
      );
      kinds.push('presence floors');
      counts.presence = ran;
    }
    return { kinds, counts };
  }

  // final phase — targets, once the world is known referentially sound
  const mMod = await optional(`${base}measurements.mjs`);
  const measurements = mMod?.measurements ?? {};
  const gatedElsewhere = mMod?.gatedElsewhere ?? new Set();

  const { ran, unmeasured } = runTargetChecks(R, measurements, check, { load, R });
  const missing = unmeasured.filter((p) => !gatedElsewhere.has(p));
  check(
    `every declared target has a check (${ran} derived, ${gatedElsewhere.size} bespoke)`,
    missing.length === 0,
    missing.length
      ? `UNCHECKED: ${missing.join(', ')}`
      : (ran || gatedElsewhere.size ? 'no target ships unverified' : 'no targets declared yet'),
  );
  // Only claim the 'targets' kind ran if something actually did. Otherwise a project that has
  // declared nothing would be told 'targets' were checked, when in fact it was handed a list of
  // what it still owes — and the guidance for a day-one project could never print.
  if (ran || gatedElsewhere.size) { kinds.push('targets'); counts.targets = ran; }
  return { kinds, counts };
}
