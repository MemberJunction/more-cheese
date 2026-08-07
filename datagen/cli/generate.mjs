// datagen — the project-generic generation entrypoint.
//
// Usage: node generate.mjs [--project morecheese] [--n 500] [--seed 42]
//                          [--release 2026-07-31] [--scenario name] [--out out]
// Deterministic: same inputs → byte-identical output. No network, no wall clock, no AI calls.
//
// This file knows NO domain: it loads the named project (projects/<name>/index.mjs), asks it
// to build its world, and hands the finished rows to the pack emitter. The pipeline itself —
// what exists and in what causal order — is the project's `buildWorld` (its table of contents).

import { loadConfig, loadProject } from '../engine/config.mjs';
import { emitPacks } from '../engine/packs.mjs';
import { join } from 'node:path';

const cfg = await loadConfig(process.argv.slice(2));
const { buildWorld, buildPacks, NOT_SHIPPED, LATENTS_OF, RUN_EXTRAS, SUMMARY_OF } = await loadProject(cfg.project);

const world = buildWorld(cfg);

// §8: pack emission — the project supplies the pack map, the engine deals the rows.
// `world` and NOT_SHIPPED are passed so the emitter can enforce the pack contract: a table that
// is generated and appears in no pack ships nothing, and used to do so with a green build.
// The harness-private files are the PROJECT's: which latents exist and what a run is worth
// recording are its model, not the engine's. A project that supplies neither gets neither.
emitPacks(cfg, {
  packs: buildPacks(world),
  world,
  notShipped: NOT_SHIPPED,
  latents: LATENTS_OF?.(world),
  renewalEvents: world.renewalEvents,
  registries: world.motifs ? { motifs: world.motifs } : undefined,
  runExtras: RUN_EXTRAS?.(cfg),
});

// RUN SUMMARY. The engine can only report what it knows: how many rows went where. Everything
// worth saying beyond that — a membership status mix, a renewal-by-year curve — is domain
// reporting, and it used to live HERE, destructuring people/orgs/periods/registrations straight
// out of the world. The second project crashed on `periods is not iterable` before it had printed
// anything: a project with no membership periods is not misconfigured, this file was.
const summary = SUMMARY_OF?.(world);
if (summary) for (const line of summary) console.log(line);
else {
  const counts = Object.entries(buildPacks(world)).map(([name, p]) => `${name}: ${Object.values(p.tables).reduce((n, rows) => n + rows.length, 0)} rows`);
  console.log(`generated — ${counts.join(', ')}`);
}
console.log(`packs → ${join(cfg.outDir, 'packs')}`);
