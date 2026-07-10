// MoreCheese datagen — walking skeleton (vertical slice, ruleset-spec §5 order).
//
// Usage: node generate.mjs [--n 500] [--seed 42] [--release 2026-07-31] [--out out]
// Deterministic: same inputs → byte-identical output. No network, no wall clock, no AI calls.
//
// The pipeline, in plain words (each step is one module under lib/):
//   1. world.mjs       — organizations (with lifecycle events) and people (with the two
//                        hidden dials); heroes pinned from the ruleset
//   2. membership.mjs  — the renewal unroll: score → calibrate → draw, year by year;
//                        then the archive rule
//   3. events.mjs      — conferences/workshops/webinars + registrations + no-shows
//   4. packs.mjs       — deal the finished rows into per-app packs (cook once, portion last)

import { loadConfig } from './lib/config.mjs';
import { buildOrgs, buildPeople } from './lib/world.mjs';
import { runRenewalUnroll, applyArchiveRule } from './lib/membership.mjs';
import { buildEvents, buildRegistrations } from './lib/events.mjs';
import { buildMoney } from './lib/money.mjs';
import { buildLearning } from './lib/learning.mjs';
import { emitPacks } from './lib/packs.mjs';
import { join } from 'node:path';

const cfg = loadConfig(process.argv.slice(2));

// §5.1–2: the world and its drivers
const orgs = buildOrgs(cfg);
let people = buildPeople(cfg, orgs); // note: appends hero employers to orgs

// §5.3: membership — the renewal unroll, then archive old lapsed records
const { periods: allPeriods, renewalEvents } = runRenewalUnroll(cfg, people, orgs);
const archived = applyArchiveRule(cfg, people, allPeriods);
people = archived.people;
const periods = archived.periods;

// §5.4: events + registrations (only ever inside valid membership windows)
const events = buildEvents(cfg);
const registrations = buildRegistrations(cfg, people, periods, events);

// §5.4b: learning — same pattern, third domain
const learning = buildLearning(cfg, people, periods);

// §5.5: the money chain — one order per billable fact, payments per the 3-part timing mixture
const money = buildMoney(cfg, people, periods, events, registrations);

// §8: pack emission
emitPacks(cfg, { people, orgs, periods, events, registrations, renewalEvents, money, learning });

// run summary
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
