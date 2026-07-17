// Name banks: AUTHORED content (banks/*.json — reviewed in git, safety-cleared per
// plans/association-db/research/name-banks-research.md), plus cities (with real
// coordinates) and the segment mix.
//
// The doctrine split: banks author the VOCABULARY (a mind wrote every name); dice do the
// ASSIGNMENT (which org gets which name, deterministically from the seed). Org names deal
// from seeded shuffles WITHOUT replacement — exhausting a register throws (extend the bank,
// never fall back to templates). Person names draw origin-consistent first+last pairs from
// region-weighted buckets; duplicate people are allowed on purpose (real rosters have them).

import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { rng } from '../../engine/rng.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const ORG_BANK = JSON.parse(readFileSync(join(HERE, 'banks/orgs.json'), 'utf8'));
const PEOPLE_BANK = JSON.parse(readFileSync(join(HERE, 'banks/people.json'), 'utf8'));

/** Expand a register's pool in AUTHORED order (forms-major) — the order is part of determinism. */
function expandRegister(reg) {
  const pool = [];
  for (const form of reg.toponymForms) for (const t of ORG_BANK.toponyms) pool.push(form.replace('{t}', t));
  for (const form of reg.surnameForms) for (const s of ORG_BANK.surnames) pool.push(form.replace('{s}', s));
  pool.push(...reg.oneOffs);
  const reserved = new Set(ORG_BANK.reserved ?? []); // hero employers — never dealt to the crowd
  return pool.filter((n) => !reserved.has(n));
}

/**
 * A seeded org-name dealer: one shuffled pool per org type, dealt without replacement.
 * Same seed → same dealing, and because names ride their OWN streams (`bank:orgs:<type>`),
 * editing a bank never reshuffles anything else in the world.
 */
export function orgNameDealer(seed) {
  const shuffled = Object.fromEntries(
    Object.entries(ORG_BANK.registers).map(([type, reg]) => [type, rng(seed, `bank:orgs:${type}`).shuffle(expandRegister(reg))])
  );
  const cursor = Object.fromEntries(Object.keys(shuffled).map((t) => [t, 0]));
  return (type) => {
    const pool = shuffled[type];
    if (!pool) throw new Error(`org bank: unknown register '${type}'`);
    if (cursor[type] >= pool.length) throw new Error(`org bank: register '${type}' exhausted after ${pool.length} names — extend banks/orgs.json`);
    return pool[cursor[type]++];
  };
}

/** Association-relevant job title from the member's own title stream — NULL for
 * Enthusiasts (their day job isn't association data). Own stream: adding titles
 * re-rolled nothing. */
export function titleFor(seed, key, segment) {
  const pool = PEOPLE_BANK.titles[segment];
  if (!pool) return null;
  return rng(seed, `title:${key}`).pick(pool);
}

/** Frequency-weighted pick: earlier entries are more common (Zipf-ish) — uniform sampling
 * over-represents rare names and reads fake (name-bank research §2). */
function namePick(r, arr) {
  return r.pickWeighted(arr.map((v, i) => [v, arr.length - i]));
}

/** Origin-consistent person name from the member's own name stream (`personname:<key>`).
 * v2 robustness: Zipf-weighted picks, controlled mixed-heritage surnames (first from one
 * origin + surname from another — common in NA/RoW), hyphenated surnames, middle initials,
 * and nicknames as PreferredName. */
export function personNameFor(seed, key, region) {
  const r = rng(seed, `personname:${key}`);
  const S = PEOPLE_BANK.structure;
  const weights = PEOPLE_BANK.regionWeights[region] ?? PEOPLE_BANK.regionWeights.NA;
  const bucket = PEOPLE_BANK.buckets[r.pickWeighted(Object.entries(weights))];
  const first = namePick(r, bucket.first);
  let last;
  if (r.bernoulli(S.mixedHeritageShare[region] ?? 0)) {
    const other = PEOPLE_BANK.buckets[r.pickWeighted(Object.entries(weights))];
    last = namePick(r, other.last);
  } else {
    last = namePick(r, bucket.last);
  }
  if (r.bernoulli(S.compoundSurnameShare)) {
    const second = namePick(r, bucket.last);
    if (second !== last) last = `${last}-${second}`;
  }
  const middle = r.bernoulli(S.middleInitialShare) ? String.fromCharCode(65 + r.int(0, 25)) + '.' : null;
  const nick = PEOPLE_BANK.nicknames[first];
  const preferred = nick && r.bernoulli(S.preferredNameShare) ? nick : null;
  return { first, last, middle, preferred };
}

// Workshop TOPIC words (not brand names — "Workshop: Alpine Affinage" is a subject line)
export const CHEESE_WORDS = ['Alpine','Meadow','Cave','Wheel','Rind','Curd','Brook','Dairy','Hollow','Prairie','Cedar','Willow','Granite','Clover','Harvest','Stone','Valley','Summit','Lark','Birch'];

// [city, state, lat, lon, weight] — weights give the dairy-belt clustering (GAP-11a: real
// coordinates, no live geocoding). Real cities are correct here — LOCATIONS should be real;
// it's business NAMES that must be invented.
export const CITIES = {
  NA: [['Madison','WI',43.0731,-89.4012,3],['Green Bay','WI',44.5133,-88.0133,2],['Petaluma','CA',38.2324,-122.6367,3],['Sonoma','CA',38.2919,-122.458,2],['Burlington','VT',44.4759,-73.2121,2],['Brattleboro','VT',42.8509,-72.5579,1],['Portland','OR',45.5152,-122.6784,2],['Seattle','WA',47.6062,-122.3321,2],['Brooklyn','NY',40.6782,-73.9442,2],['Ithaca','NY',42.4440,-76.5019,1],['Chicago','IL',41.8781,-87.6298,1],['Denver','CO',39.7392,-104.9903,1],['Austin','TX',30.2672,-97.7431,1],['Asheville','NC',35.5951,-82.5515,1]],
  EU: [['Poligny','FR',46.8367,5.7075,2],['Aarhus','DK',56.1629,10.2039,1],['Amsterdam','NL',52.3676,4.9041,1],['Bern','CH',46.9480,7.4474,1],['Somerset','UK',51.0577,-2.7183,1]],
  RoW: [['Hobart','AU',-42.8821,147.3272,1],['Auckland','NZ',-36.8509,174.7645,1],['Guelph','CA-ON',43.5448,-80.2482,1],['Oaxaca','MX',17.0732,-96.7266,1]],
};

export const SEGMENTS = [['Producer',0.38],['Retailer',0.27],['Supplier',0.12],['Educator',0.08],['Enthusiast',0.15]];
