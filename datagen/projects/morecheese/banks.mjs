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
// English initial frequencies, roughly — a uniform A-Z draw put X/Q/Z on par with J/M
const INITIALS = 'AAAABBBCCCDDDEEEFFGGHHHIIJJKKLLLMMMMNNOOPPRRRSSSSTTTTVWWY'.split('');

function namePick(r, arr) {
  return r.pickWeighted(arr.map((v, i) => [v, arr.length - i]));
}

/** Origin-consistent person name from the member's own name stream (`personname:<key>`).
 * v2 robustness: Zipf-weighted picks, controlled mixed-heritage surnames (first from one
 * origin + surname from another — common in NA/RoW), hyphenated surnames, middle initials,
 * and nicknames as PreferredName. */
export function personNameFor(seed, key, region, origin = null) {
  const r = rng(seed, `personname:${key}`);
  const S = PEOPLE_BANK.structure;
  // per-COUNTRY weights when the city supplies an origin; the three super-region vectors
  // remain the fallback. Keying names to NA/EU/RoW made every European city statistically
  // identical — Poligny read 29% Nordic against 27% French.
  const weights = (origin && PEOPLE_BANK.countryWeights?.[origin])
    ?? PEOPLE_BANK.regionWeights[region] ?? PEOPLE_BANK.regionWeights.NA;
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
  // Hispanic and Iberian naming carries a MATERNAL SURNAME, not an initial. Elsewhere the
  // middle is an initial — but drawn from a realistic letter frequency, since a uniform
  // A-Z made X, Q and Z as common as J and M.
  const maternalOrigins = ['mexico', 'spain', 'portugal', 'argentina'];
  const middle = maternalOrigins.includes(origin) && r.bernoulli(0.7)
    ? namePick(r, bucket.last)
    : r.bernoulli(S.middleInitialShare) ? INITIALS[r.int(0, INITIALS.length - 1)] + '.' : null;
  const nick = PEOPLE_BANK.nicknames[first];
  const preferred = nick && r.bernoulli(S.preferredNameShare) ? nick : null;
  return { first, last, middle, preferred };
}

export const TOPONYMS = ORG_BANK.toponyms; // cleared components — also compose competition product names

// Workshop TOPIC words (not brand names — "Workshop: Alpine Affinage" is a subject line)
export const CHEESE_WORDS = ['Alpine','Meadow','Cave','Wheel','Rind','Curd','Brook','Dairy','Hollow','Prairie','Cedar','Willow','Granite','Clover','Harvest','Stone','Valley','Summit','Lark','Birch'];

// [city, state, lat, lon, weight] — weights give the dairy-belt clustering (GAP-11a: real
// coordinates, no live geocoding). Real cities are correct here — LOCATIONS should be real;
// it's business NAMES that must be invented.
export const CITIES = {
  // [city, subdivision (ISO 3166-2 style), lat, lon, weight, countryISO2, countryName, nameOrigin]
  // Subdivisions are prefixed with the country ('US-CA', 'FR-39') so the field is
  // UNAMBIGUOUS — it previously held 'CA' for California AND 'CA-ON' for Canada, so any
  // group-by silently merged them. Country is now explicit rather than inferred.
  // `nameOrigin` keys the per-country name weights (banks/people.json regionWeights):
  // a member in Poligny should read French, not the old flat EU average.
  NA: [
    ['Madison','US-WI',43.0731,-89.4012,3,'US','United States','usa'],
    ['Green Bay','US-WI',44.5133,-88.0133,2,'US','United States','usa'],
    ['Petaluma','US-CA',38.2324,-122.6367,3,'US','United States','usa'],
    ['Sonoma','US-CA',38.2919,-122.458,2,'US','United States','usa'],
    ['Point Reyes Station','US-CA',38.0682,-122.8064,1,'US','United States','usa'],
    ['Burlington','US-VT',44.4759,-73.2121,2,'US','United States','usa'],
    ['Brattleboro','US-VT',42.8509,-72.5579,1,'US','United States','usa'],
    ['Greensboro','US-VT',44.5906,-72.2929,1,'US','United States','usa'],
    ['Portland','US-OR',45.5152,-122.6784,2,'US','United States','usa'],
    ['Seattle','US-WA',47.6062,-122.3321,2,'US','United States','usa'],
    ['Brooklyn','US-NY',40.6782,-73.9442,2,'US','United States','usa'],
    ['Ithaca','US-NY',42.4440,-76.5019,1,'US','United States','usa'],
    ['Chicago','US-IL',41.8781,-87.6298,1,'US','United States','usa'],
    ['Denver','US-CO',39.7392,-104.9903,1,'US','United States','usa'],
    ['Austin','US-TX',30.2672,-97.7431,1,'US','United States','usa'],
    ['Asheville','US-NC',35.5951,-82.5515,1,'US','United States','usa'],
    ['Boise','US-ID',43.6150,-116.2023,1,'US','United States','usa'],
    ['Lancaster','US-PA',40.0379,-76.3055,1,'US','United States','usa'],
    ['Guelph','CA-ON',43.5448,-80.2482,1,'CA','Canada','canada'],
    ['Saint-Hyacinthe','CA-QC',45.6300,-72.9570,1,'CA','Canada','quebec'],
    ['Courtenay','CA-BC',49.6877,-124.9936,1,'CA','Canada','canada'],
    ['Oaxaca','MX-OAX',17.0732,-96.7266,1,'MX','Mexico','mexico'],
    ['Querétaro','MX-QUE',20.5888,-100.3899,1,'MX','Mexico','mexico'],
  ],
  EU: [
    ['Poligny','FR-39',46.8367,5.7075,2,'FR','France','france'],
    ['Rodez','FR-12',44.3506,2.5730,1,'FR','France','france'],
    ['Annecy','FR-74',45.8992,6.1294,1,'FR','France','france'],
    ['Saint-Lô','FR-50',49.1157,-1.0910,1,'FR','France','france'],
    ['Parma','IT-PR',44.8015,10.3279,2,'IT','Italy','italy'],
    ['Reggio Emilia','IT-RE',44.6983,10.6310,1,'IT','Italy','italy'],
    ['Bra','IT-CN',44.6980,7.8580,1,'IT','Italy','italy'],
    ['Sassari','IT-SS',40.7259,8.5557,1,'IT','Italy','italy'],
    ['Gouda','NL-ZH',52.0115,4.7104,1,'NL','Netherlands','netherlands'],
    ['Alkmaar','NL-NH',52.6324,4.7534,1,'NL','Netherlands','netherlands'],
    ['Aarhus','DK-82',56.1629,10.2039,1,'DK','Denmark','denmark'],
    ['Nykøbing Mors','DK-81',56.7940,8.8570,1,'DK','Denmark','denmark'],
    ['Bern','CH-BE',46.9480,7.4474,1,'CH','Switzerland','switzerland'],
    ['Gruyères','CH-FR',46.5836,7.0822,1,'CH','Switzerland','switzerland'],
    ['Emmental','CH-BE',47.0500,7.7500,1,'CH','Switzerland','switzerland'],
    ['Somerset','GB-SOM',51.0577,-2.7183,1,'GB','United Kingdom','uk'],
    ['Ludlow','GB-SHR',52.3680,-2.7180,1,'GB','United Kingdom','uk'],
    ['Ayrshire','GB-SAY',55.4586,-4.6292,1,'GB','United Kingdom','uk'],
    ['Allgäu','DE-BY',47.5800,10.2200,2,'DE','Germany','germany'],
    ['Münster','DE-NW',51.9607,7.6261,1,'DE','Germany','germany'],
    ['Bregenz','AT-8',47.5031,9.7471,1,'AT','Austria','austria'],
    ['Idiazabal','ES-PV',43.0500,-2.2500,1,'ES','Spain','spain'],
    ['Cabrales','ES-AS',43.3000,-4.8500,1,'ES','Spain','spain'],
    ['Serpa','PT-07',37.9430,-7.5960,1,'PT','Portugal','portugal'],
    ['Kilkenny','IE-KK',52.6541,-7.2448,1,'IE','Ireland','ireland'],
    ['Cork','IE-CO',51.8985,-8.4756,1,'IE','Ireland','ireland'],
    ['Trikala','GR-E4',39.5556,21.7679,1,'GR','Greece','greece'],
    ['Kraków','PL-MA',50.0647,19.9450,1,'PL','Poland','poland'],
  ],
  RoW: [
    ['Hobart','AU-TAS',-42.8821,147.3272,1,'AU','Australia','australia'],
    ['Bega','AU-NSW',-36.6741,149.8409,1,'AU','Australia','australia'],
    ['Auckland','NZ-AUK',-36.8509,174.7645,1,'NZ','New Zealand','newzealand'],
    ['Oamaru','NZ-OTA',-45.0975,170.9714,1,'NZ','New Zealand','newzealand'],
    ['Tandil','AR-B',-37.3217,-59.1332,1,'AR','Argentina','argentina'],
    ['Hokkaido','JP-01',43.0642,141.3469,1,'JP','Japan','japan'],
  ],
};

export const SEGMENTS = [['Producer',0.38],['Retailer',0.27],['Supplier',0.12],['Educator',0.08],['Enthusiast',0.15]];
