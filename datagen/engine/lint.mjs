// The ruleset linter: structural checks that protect HUMAN authors (who can now write
// rules) from silent typos. Runs inside loadRuleset, before compilation — a malformed
// recipe never reaches the kitchen. Throws with all problems listed, not just the first.

const AUTHORING_FORMS = ['beta', 'liftPts', 'groupTarget', 'strength', 'logitShift'];

export function lintRuleset(R, domainLint) {
  const problems = [];

  // GENERIC: every effect must have exactly one authoring form, and evidence or a note.
  //
  // HISTORY, because this rule was dead for a while and nothing noticed: it originally walked
  // `block.arrows` at the TOP level of each domain block. Then two things happened to it. The
  // four-section restructure renamed `arrows` → `effects`, and nested effect blocks
  // (forms.response.effects, committees.participation.effects) were never reachable from the top
  // level anyway — a gap the 2026-07-31 census called out. After the rename the loop matched
  // NOTHING: exactly-one-form and evidence-required were enforced by no code at all, and the
  // suite's lint tests never covered them, so the dead rule stayed green. Found by reading the
  // lint while tightening it (TYPES-PROPOSAL stage 3), which is not a detection method — the
  // negative tests below in test.mjs are.
  //
  // The rule now rides the recursive walk: any object under a key named `effects`, at ANY depth,
  // in any module, in any project.
  const lintEffect = (name, a, at) => {
    const forms = AUTHORING_FORMS.filter((f) => a[f] != null);
    if (forms.length !== 1) problems.push(`${at}: needs exactly ONE of ${AUTHORING_FORMS.join('|')} (found: ${forms.join(', ') || 'none'})`);
    if (a.strength && !['weak', 'med', 'strong'].includes(a.strength)) problems.push(`${at}: unknown strength "${a.strength}"`);
    if (a.strength && !a.sign) problems.push(`${at}: qualitative form needs a "sign" (+/-)`);
    if (a.groupTarget != null && (a.groupTarget <= 0 || a.groupTarget >= 1)) problems.push(`${at}: groupTarget must be a probability (0..1)`);
    if (!a.note && !a.evidence && !a.$note) problems.push(`${at}: no evidence/note — every rule carries its why`);
  };

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
      // A `target` is a promise about the generated data, and the validator cannot check a
      // promise without knowing how much drift is acceptable. Recognised by SHAPE rather than
      // by a list of known paths, so it covers every module — including ones that don't exist
      // yet — and survives any regrouping. (Replaced a hardcoded list of three paths that had
      // to be edited by hand every time a key moved.)
      if ('target' in node && !('tolerance' in node)) {
        problems.push(`${path || '<root>'}: has a target but no tolerance — the validator can't gate a target without knowing the acceptable drift`);
      }
      for (const [k, v] of Object.entries(node)) {
        const kp = path ? `${path}.${k}` : k;
        if (k === 'effects' && v && typeof v === 'object' && !Array.isArray(v)) {
          for (const [name, e] of Object.entries(v)) {
            if (name.startsWith('$') || !e || typeof e !== 'object') continue;
            lintEffect(name, e, `${kp}.${name}`);
          }
        }
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
