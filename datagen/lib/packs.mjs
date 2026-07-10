// Spec §8: pack emission — cook once, portion at the end (D9).
//
// The world was generated as one batch (that's what keeps one person consistent across
// systems); this last step deals the finished rows into one folder per composed app, each
// with a manifest declaring what it depends on. Installers load bottom-up: common first,
// always. Latent dials (_theta/_phi) are stripped here — they exist only inside the kitchen;
// the validator gets its own private file (validation-events.json) that is never installed.

import { writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { iso } from './dates.mjs';

export function emitPacks(cfg, { people, orgs, periods, events, registrations, renewalEvents, money, learning }) {
  const packs = {
    common: {
      dependsOn: [],
      tables: { people: people.map(({ _theta, _thetaPath, _phi, _hero, CycleType, AutoRenew, MembershipTier, ...rest }) => rest), organizations: orgs },
    },
    membership: {
      dependsOn: ['common'],
      tables: { membership_periods: periods },
    },
    events: {
      dependsOn: ['common', 'membership'],
      tables: { events, event_registrations: registrations.map(({ _class, _theta, ...rest }) => rest) },
    },
    learning: {
      dependsOn: ['common', 'membership'],
      tables: { courses: learning.courses, enrollments: learning.enrollments.map(({ _theta, _endBase, _weeks, ...rest }) => rest) },
    },
    orders: {
      dependsOn: ['common', 'membership', 'events'],
      tables: { products: money.products, orders: money.orders, order_lines: money.orderLines, payments: money.payments },
    },
  };
  mkdirSync(join(cfg.outDir, 'packs'), { recursive: true });
  for (const [name, pack] of Object.entries(packs)) {
    const dir = join(cfg.outDir, 'packs', name);
    mkdirSync(dir, { recursive: true });
    const rowCounts = {};
    for (const [table, rows] of Object.entries(pack.tables)) {
      writeFileSync(join(dir, `${table}.json`), JSON.stringify(rows, null, 1));
      rowCounts[table] = rows.length;
    }
    writeFileSync(join(dir, 'manifest.json'), JSON.stringify({ name, version: cfg.R.version, seed: cfg.seed, releaseDate: iso(cfg.release), dependsOn: pack.dependsOn, rowCounts }, null, 2));
  }
  writeFileSync(join(cfg.outDir, 'validation-events.json'), JSON.stringify(renewalEvents));
  // per-member latents — validator/inspector-private, NEVER installed: lets an engineer
  // verify the hidden dials actually expressed through behavior
  writeFileSync(join(cfg.outDir, 'validation-latents.json'), JSON.stringify(people.map((p) => ({ m: p.MemberNumber, theta: +p._theta.toFixed(4), phi: +p._phi.toFixed(4), tier: p.MembershipTier, hero: !!p._hero }))));
  writeFileSync(join(cfg.outDir, 'run.json'), JSON.stringify({ seed: cfg.seed, n: cfg.n, releaseDate: iso(cfg.release), ruleset: cfg.R.version, scenario: cfg.scenario ?? null, covidYears: cfg.R.regimes.covid.years }, null, 2));
}
