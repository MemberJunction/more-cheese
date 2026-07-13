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
const { buildWorld } = await loadProject(cfg.project);

const world = buildWorld(cfg);

// §8: pack emission
emitPacks(cfg, world);

// run summary
const { people, orgs, periods, events, registrations, renewalEvents } = world;
const lastStatus = new Map();
for (const per of periods) lastStatus.set(per.MemberNumber, per.Status);
const mix = { Active: 0, Lapsed: 0, Cancelled: 0, PendingRenewal: 0, Renewed: 0 };
for (const s of lastStatus.values()) mix[s] = (mix[s] ?? 0) + 1;
const byYear = {};
for (const e of renewalEvents) { (byYear[e.year] ??= { n: 0, r: 0 }); byYear[e.year].n++; byYear[e.year].r += e.renewed; }
console.log(`generated: ${people.length} people, ${orgs.length} orgs, ${periods.length} periods, ${events.length} events, ${registrations.length} registrations`);
console.log('status mix @release:', mix);
console.log('renewal by year:', Object.fromEntries(Object.entries(byYear).map(([y, v]) => [y, (v.r / v.n).toFixed(3)])));
console.log(`packs → ${join(cfg.outDir, 'packs')}`);
