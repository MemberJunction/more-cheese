// THE PIPELINE GRAPH — the third graph in this system, and the only one never written down.
//
//   1. the DATA graph      — which column points at which key       → projects/*/refs.mjs
//   2. the CAUSAL graph    — which driver moves which decision      → `effects` blocks
//   3. the PIPELINE graph  — which stage must run before which      → this file
//
// buildWorld is ~100 lines of hand-sequenced calls. Most of the ordering is visible in the argument
// lists: buildMoney takes `programs`, so programs must exist first, and JavaScript enforces that
// for free.
//
// The dangerous edges are the ones in NO argument list. A stage that MUTATES a shared object which
// a later stage reads has a hard ordering requirement that no signature shows and no language rule
// enforces. Today those live in prose:
//
//     // motifs BEFORE the unroll: stamped archetypes pin renewal outcomes (_lapseYear)
//     // programs BEFORE money: credentials are billable facts
//     // defects LAST: labeled corruption over the finished world
//     // platform AFTER defects: its RecordChange rows mirror timelines everywhere above
//
// Reorder two calls and the comments do not object. This module extracts the ACTUAL order from the
// source and checks it against declared invisible edges, so those constraints fail a build instead
// of being remembered.
//
// EXTRACTED, not declared, on purpose: a hand-maintained copy of the call order is one more thing
// to drift. Only the invisible edges are declared, because only they cannot be read off the code.

/**
 * Parse a project's buildWorld into ordered stages.
 * @param {string} source contents of projects/<name>/index.mjs
 * @returns {{ name: string, produces: string, consumes: string[], order: number }[]}
 */
export function extractPipeline(source) {
  const start = source.indexOf('export function buildWorld');
  if (start < 0) throw new Error('extractPipeline: no buildWorld in this source');
  const end = source.indexOf('export function buildPacks', start);
  const body = source.slice(start, end > 0 ? end : undefined);

  // `const x = buildFoo(cfg, a, b)` / `const { a, b } = runBar(cfg, c)`
  const re = /(?:const|let)\s+(?:\{([^}]*)\}|(\w+))\s*=\s*((?:build|run|apply)\w+)\(([^;]*)\);/g;
  const stages = [];
  let m;
  while ((m = re.exec(body))) {
    const produces = m[1]
      ? m[1].split(',').map((s) => s.trim().split(':')[0].trim()).filter(Boolean).join('+')
      : m[2];
    const consumes = [...new Set(
      (m[4].match(/\b[a-zA-Z_]\w*\b/g) ?? [])
        .filter((w) => w !== 'cfg' && !/^(filter|map|length|true|false|null|p|x)$/.test(w)),
    )];
    stages.push({ name: m[3], produces, consumes, order: stages.length + 1 });
  }
  return stages;
}

/**
 * Check the extracted order against edges that MUST hold but that no argument list expresses.
 *
 * @param {ReturnType<typeof extractPipeline>} stages
 * @param {readonly {before: string, after: string, why: string}[]} mustPrecede
 * @param {(name: string, ok: boolean, detail?: string) => void} check
 */
export function checkPipeline(stages, mustPrecede, check) {
  const at = new Map(stages.map((s) => [s.name, s.order]));

  for (const edge of mustPrecede) {
    const a = at.get(edge.before);
    const b = at.get(edge.after);
    if (a == null || b == null) {
      check(`pipeline: ${edge.before} before ${edge.after}`, false,
        `stage not found in buildWorld (${a == null ? edge.before : edge.after}) — renamed or removed?`);
      continue;
    }
    check(`pipeline: ${edge.before} runs before ${edge.after}`, a < b,
      a < b ? edge.why : `ORDER VIOLATED — ${edge.why}`);
  }

  // A consumed name produced by a LATER stage is a real cycle in the visible graph. JavaScript
  // would normally catch it; a stage reading a mutated shared object would not, so report rather
  // than trust the language.
  const producedAt = new Map();
  for (const s of stages) for (const p of s.produces.split('+')) producedAt.set(p, s.order);
  const late = [];
  for (const s of stages) {
    for (const c of s.consumes) {
      const p = producedAt.get(c);
      if (p != null && p > s.order) late.push(`${s.name} consumes ${c}, produced later by stage ${p}`);
    }
  }
  check('pipeline: no stage consumes something produced later', late.length === 0,
    late.join('; ') || `${stages.length} stages, order consistent`);
}

/** The pipeline as a mermaid graph. Nodes are stages; edges are the visible dependencies. */
export function pipelineMermaid(stages) {
  const producedAt = new Map();
  for (const s of stages) for (const p of s.produces.split('+')) producedAt.set(p, s.name);
  const lines = ['graph TD'];
  for (const s of stages) {
    const deps = [...new Set(s.consumes.map((c) => producedAt.get(c)).filter((d) => d && d !== s.name))];
    if (!deps.length) lines.push(`  ${s.name}`);
    for (const d of deps) lines.push(`  ${d} --> ${s.name}`);
  }
  return lines.join('\n');
}
