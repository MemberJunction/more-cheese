// The ruleset linter: structural checks that protect HUMAN authors (who can now write
// rules) from silent typos. Runs inside loadRuleset, before compilation — a malformed
// recipe never reaches the kitchen. Throws with all problems listed, not just the first.

const AUTHORING_FORMS = ['beta', 'liftPts', 'groupTarget', 'strength', 'logitShift'];

export function lintRuleset(R, domainLint) {
  const problems = [];

  // GENERIC: every arrow must have exactly one authoring form, and evidence or a note
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

  // GENERIC: structural typo classes a human editing JSON actually produces. Each rule
  // exists because the failure it prevents was otherwise a stack trace from deep inside
  // generation (or worse, silence). Walks the COMPOSED ruleset, so scenario overlays are
  // linted too. Paths in messages are edit-locations, not schema jargon.
  const walk = (node, path) => {
    if (Array.isArray(node)) {
      // a weighted list is an array whose EVERY element is a [value, weight] pair — the
      // pickWeighted shape. A negative, zero, or non-numeric weight draws garbage silently.
      const isWeighted = node.length > 0 && node.every((e) => Array.isArray(e) && e.length === 2 && typeof e[1] === 'number');
      if (isWeighted) {
        node.forEach((e, i) => {
          if (!Number.isFinite(e[1]) || e[1] <= 0) problems.push(`${path}[${i}]: weight ${e[1]} — weights must be positive finite numbers`);
        });
      }
      node.forEach((e, i) => walk(e, `${path}[${i}]`));
      return;
    }
    if (node && typeof node === 'object') {
      for (const [k, v] of Object.entries(node)) {
        const kp = path ? `${path}.${k}` : k;
        if (typeof v === 'number') {
          // shares and tolerances are probabilities; a '15' where '0.15' was meant is the
          // classic edit and it detonates far from here
          if (/share/i.test(k) && !/day|days|count/i.test(k) && (v < 0 || v > 1)) problems.push(`${kp}: ${v} — *share* values are probabilities in [0, 1]`);
          if (/tolerance/i.test(k) && (v <= 0 || v > 1)) problems.push(`${kp}: ${v} — tolerances are in (0, 1]`);
          if (/multiplier/i.test(k) && (!Number.isFinite(v) || v < 0)) problems.push(`${kp}: ${v} — multipliers must be finite and >= 0`);
        }
        walk(v, kp);
      }
    }
  };
  walk(R, '');

  // DOMAIN checks arrive through the hook (tier lattices, gate tolerances, …)
  if (domainLint) problems.push(...domainLint(R));

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
