// The ruleset linter: structural checks that protect HUMAN authors (who can now write
// rules) from silent typos. Runs inside loadRuleset, before compilation — a malformed
// recipe never reaches the kitchen. Throws with all problems listed, not just the first.

const AUTHORING_FORMS = ['beta', 'liftPts', 'groupTarget', 'strength', 'logitShift'];

export function lintRuleset(R) {
  const problems = [];

  // every arrow must have exactly one authoring form, and evidence or a note
  for (const [domain, block] of Object.entries(R)) {
    if (!block || typeof block !== 'object' || !block.arrows) continue;
    for (const [name, a] of Object.entries(block.arrows)) {
      const forms = AUTHORING_FORMS.filter((f) => a[f] != null);
      if (forms.length !== 1) problems.push(`${domain}.arrows.${name}: needs exactly ONE of ${AUTHORING_FORMS.join('|')} (found: ${forms.join(', ') || 'none'})`);
      if (a.strength && !['weak', 'med', 'strong'].includes(a.strength)) problems.push(`${domain}.arrows.${name}: unknown strength "${a.strength}"`);
      if (a.strength && !a.sign) problems.push(`${domain}.arrows.${name}: qualitative form needs a "sign" (+/-)`);
      if (a.groupTarget != null && (a.groupTarget <= 0 || a.groupTarget >= 1)) problems.push(`${domain}.arrows.${name}: groupTarget must be a probability (0..1)`);
      if (!a.note && !a.evidence && !a.$note) problems.push(`${domain}.arrows.${name}: no evidence/note — every rule carries its why`);
    }
  }

  // tiers must be a coherent lattice
  if (R.membership?.tiers) {
    for (const t of R.membership.tiers.list ?? []) {
      if (!t.name || typeof t.dues !== 'number') problems.push(`membership.tiers: entry ${JSON.stringify(t)} needs name + numeric dues`);
    }
  }

  // targets that gates consume must carry tolerances
  for (const [path, target] of [
    ['membership.renewalTarget+renewalTolerance', R.membership?.renewalTolerance],
    ['learning.participation.tolerance', R.learning?.participation?.tolerance],
    ['learning.completion.tolerance', R.learning?.completion?.tolerance],
  ]) {
    if (target == null) problems.push(`${path}: missing tolerance — the validator can't gate a target without one`);
  }

  if (problems.length) {
    throw new Error(`ruleset lint failed:\n  - ${problems.join('\n  - ')}`);
  }
}

/**
 * Scenario overlays may only OVERRIDE existing keys, never introduce new ones — a typo'd
 * key in an overlay would otherwise merge silently and change nothing. Returns the list
 * of unknown paths (caller throws).
 */
export function findUnknownOverlayKeys(base, overlay, prefix = '') {
  const unknown = [];
  for (const [k, v] of Object.entries(overlay)) {
    if (k.startsWith('$')) continue; // commentary is always welcome
    const path = prefix ? `${prefix}.${k}` : k;
    if (!(k in base)) { unknown.push(path); continue; }
    if (v && typeof v === 'object' && !Array.isArray(v) && base[k] && typeof base[k] === 'object' && !Array.isArray(base[k])) {
      unknown.push(...findUnknownOverlayKeys(base[k], v, path));
    }
  }
  return unknown;
}

/** Strip holdout-flagged targets — the view fed to any AI authoring step (spec §7: the
 * blind benchmarks must never be in the authoring context; the validator keeps them). */
export function stripHoldouts(node) {
  if (!node || typeof node !== 'object') return node;
  if (Array.isArray(node)) return node.map(stripHoldouts);
  const out = {};
  for (const [k, v] of Object.entries(node)) {
    if (v && typeof v === 'object' && !Array.isArray(v) && v.holdout === true) continue; // gone from the authoring view
    out[k] = stripHoldouts(v);
  }
  return out;
}
