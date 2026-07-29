// Contact details + voluntary self-identified demographics.
//
// These columns ALREADY EXIST on bizapps-common's Person/Organization (nullable and, until
// now, always empty) — so filling them needs no migration. Every value comes off its OWN
// stream key (`contact:`, `demo:`, `orgmeta:`), which is the documented zero-re-roll
// pattern in this project: a new stream is a pure function of its own key, so no existing
// draw moves.
//
// THE RULE FOR DEMOGRAPHICS (see plans/association-db/IDENTITY-CATALOGUE-ENRICHMENT-PLAN):
//   · WHETHER a member answered may vary with tenure. That is a documented real pattern —
//     associations that publish their numbers show long-standing members far more complete
//     than recent joiners (APA: 5.6% blank for Fellows vs 45.5% for Associates).
//   · WHAT they answered is drawn on a stream that knows nothing about engagement, renewal,
//     spend or segment. Nobody may "discover" a disparity in outcomes by gender, because
//     none was authored. A gate asserts it.
// Blank rates are calibrated to published association profiles (ASHA 2024/25, AIA 2024,
// APA 2002-2017): gender ~8-11% missing, birthdate ~5% (long-tenured) to ~21% (newest),
// and a small, separately-modelled "Prefer not to say" that behaves nothing like a blank.

import { rng } from '../../engine/rng.mjs';
import { iso, parseDate } from '../../engine/dates.mjs';
import { orgDomainFor } from './world.mjs';

/** national phone shapes, keyed off Country (ISO2) */
const PHONE = {
  FR: (r) => `+33 ${r.int(1, 9)} ${d2(r)} ${d2(r)} ${d2(r)} ${d2(r)}`,
  DK: (r) => `+45 ${d2(r)} ${d2(r)} ${d2(r)} ${d2(r)}`,
  NL: (r) => `+31 ${d2(r)} ${d3(r)} ${d4(r)}`,
  CH: (r) => `+41 ${d2(r)} ${d3(r)} ${d2(r)} ${d2(r)}`,
  GB: (r) => `+44 ${d4(r)} ${d3(r)}${d3(r)}`,
  IE: (r) => `+353 ${r.int(1, 99)} ${d3(r)} ${d4(r)}`,
  IT: (r) => `+39 ${d3(r)} ${d3(r)} ${d4(r)}`,
  ES: (r) => `+34 ${d3(r)} ${d3(r)} ${d3(r)}`,
  PT: (r) => `+351 ${d3(r)} ${d3(r)} ${d3(r)}`,
  DE: (r) => `+49 ${d3(r)} ${d4(r)}${d3(r)}`,
  AT: (r) => `+43 ${d3(r)} ${d3(r)}${d4(r)}`,
  GR: (r) => `+30 ${d3(r)} ${d3(r)} ${d4(r)}`,
  PL: (r) => `+48 ${d3(r)} ${d3(r)} ${d3(r)}`,
  AR: (r) => `+54 ${d2(r)} ${d4(r)}-${d4(r)}`,
  JP: (r) => `+81 ${d2(r)} ${d4(r)} ${d4(r)}`,
  CA: (r) => `+1 (${r.int(226, 905)}) ${d3(r)}-${d4(r)}`,
  US: (r) => `+1 (${r.int(201, 989)}) ${d3(r)}-${d4(r)}`,
  MX: (r) => `+52 ${d2(r)} ${d4(r)} ${d4(r)}`,
  AU: (r) => `+61 ${r.int(2, 8)} ${d4(r)} ${d4(r)}`,
  NZ: (r) => `+64 ${r.int(3, 9)} ${d3(r)} ${d4(r)}`,
};
const d2 = (r) => String(r.int(0, 99)).padStart(2, '0');
const d3 = (r) => String(r.int(0, 999)).padStart(3, '0');
const d4 = (r) => String(r.int(0, 9999)).padStart(4, '0');
const usPhone = (r) => `+1 (${r.int(201, 989)}) ${d3(r)}-${d4(r)}`;

/** completeness rises with tenure; newest joiners are about twice as blank (AIA 2024) */
/** non-members answer almost no profile questions — they were never asked */
const R_PROSPECT_SELF_ID = 0.06;

function answeredShare(baseBlank, tenureYears) {
  const blank = baseBlank * (tenureYears < 2 ? 2.0 : tenureYears < 5 ? 1.3 : tenureYears < 10 ? 0.85 : 0.6);
  return 1 - Math.min(0.6, blank);
}

/**
 * Contact + demographic fields for one person. `release` bounds birthdates; `joinDate`
 * drives completeness only — never the values.
 */
export function identityFor(seed, p, release) {
  const rc = rng(seed, `contact:${p.MemberNumber}`);
  const rd = rng(seed, `demo:${p.MemberNumber}`);
  const tenure = Math.max(0, (release - parseDate(p.JoinDate)) / (365.25 * 86400000));
  // VOLUNTARY self-ID comes from a member profile form. A non-member never filled one in, so
  // they have contact details and almost no demographics — 480 of 550 prospects carrying a
  // self-reported gender was the profile pass treating a webinar signup like a ten-year member.
  const selfIdScale = p.IsProspect ? (R_PROSPECT_SELF_ID) : 1;

  // --- phone: national format, sometimes absent
  const fmt = PHONE[p.Country] ?? usPhone;
  const Phone = rc.bernoulli(answeredShare(0.09, tenure)) ? fmt(rc) : null;

  // --- prefix/suffix: occupational, not demographic (an educator is likelier to be Dr.)
  const prefixPool = p.Segment === 'Educator'
    ? [['Dr.', 0.45], ['Prof.', 0.2], ['Mr.', 0.12], ['Ms.', 0.12], ['Mx.', 0.01], [null, 0.1]]
    : [['Mr.', 0.3], ['Ms.', 0.3], ['Mrs.', 0.08], ['Dr.', 0.03], ['Mx.', 0.01], [null, 0.28]];
  const Prefix = rc.pickWeighted(prefixPool);
  const Suffix = rc.bernoulli(0.03) ? rc.pick(['Jr.', 'Sr.', 'III']) : null;

  // --- gender: VOLUNTARY self-ID. Values are independent of segment, engagement and every
  // outcome; only the response RATE varies (with tenure). "Prefer not to say" is a real
  // answer and is modelled separately from never having answered (null).
  const Gender = rd.bernoulli(answeredShare(0.065, tenure) * selfIdScale)
    ? rd.pickWeighted([['Female', 0.475], ['Male', 0.475], ['Non-binary', 0.012], ['Self-described', 0.004], ['Prefer not to say', 0.034]])
    : null;

  // --- birthdate: working-age spread, no correlation with anything
  let DateOfBirth = null;
  if (rd.bernoulli(answeredShare(0.105, tenure) * selfIdScale)) {
    const age = rd.pickWeighted([[[22, 29], 0.13], [[30, 39], 0.26], [[40, 49], 0.24], [[50, 59], 0.21], [[60, 69], 0.12], [[70, 78], 0.04]]);
    const yr = release.getUTCFullYear() - rd.int(age[0], age[1]);
    const mo = rd.int(0, 11);
    DateOfBirth = iso(new Date(Date.UTC(yr, mo, rd.int(1, new Date(Date.UTC(yr, mo + 1, 0)).getUTCDate()))));
  }

  // --- postal address, in the destination country's own shape
  const addr = addressFor(rc, p);

  // --- race / ethnicity: same voluntary-self-ID rules as gender. Blank rates run higher
  // than gender in every published series (ASHA: race 17% vs gender 10%), and the
  // Hispanic-origin question is asked SEPARATELY, as real instruments do.
  const answeredRace = rd.bernoulli(answeredShare(0.095, tenure) * selfIdScale);
  const RaceEthnicity = answeredRace
    ? rd.pickWeighted([
      ['White', 0.62], ['Asian', 0.09], ['Black or African American', 0.07],
      ['American Indian or Alaska Native', 0.01], ['Native Hawaiian or Pacific Islander', 0.005],
      ['Two or more races', 0.045], ['Prefer not to say', 0.16],
    ])
    : null;
  const EthnicityHispanic = rd.bernoulli(answeredShare(0.11, tenure) * selfIdScale)
    ? rd.pickWeighted([['Not Hispanic or Latino', 0.83], ['Hispanic or Latino', 0.14], ['Prefer not to say', 0.03]])
    : null;
  const PronounSet = rd.bernoulli(answeredShare(0.55, tenure) * selfIdScale)   // far less commonly filled
    ? rd.pickWeighted([['she/her', 0.46], ['he/him', 0.46], ['they/them', 0.06], ['she/they', 0.01], ['he/they', 0.01]])
    : null;
  const PrimaryLanguage = LANGUAGE[p.Country] ?? 'English';

  return { Prefix, Suffix, Phone, Gender, DateOfBirth, RaceEthnicity, EthnicityHispanic, PronounSet, PrimaryLanguage, ...addr };
}

/** primary language follows the country, not the person's name origin */
const LANGUAGE = {
  US: 'English', CA: 'English', GB: 'English', IE: 'English', AU: 'English', NZ: 'English',
  FR: 'French', IT: 'Italian', ES: 'Spanish', PT: 'Portuguese', MX: 'Spanish', AR: 'Spanish',
  NL: 'Dutch', DK: 'Danish', DE: 'German', AT: 'German', CH: 'German', GR: 'Greek',
  PL: 'Polish', JP: 'Japanese',
};

/** national postal formats — a French code is not a US ZIP, and the ordering differs too */
const STREETS = ['Mill', 'Church', 'Orchard', 'Station', 'Market', 'Meadow', 'Bridge', 'High', 'Cave', 'Dairy', 'Creamery', 'Spring'];
const SUFFIX_BY_COUNTRY = {
  US: ['St', 'Ave', 'Rd', 'Ln', 'Way'], CA: ['St', 'Ave', 'Rd'], GB: ['Street', 'Road', 'Lane'],
  IE: ['Street', 'Road'], AU: ['St', 'Rd'], NZ: ['St', 'Rd'],
  FR: ['Rue', 'Avenue', 'Chemin'], IT: ['Via', 'Viale'], ES: ['Calle', 'Avenida'], PT: ['Rua'],
  MX: ['Calle', 'Avenida'], AR: ['Calle'], NL: ['straat', 'weg'], DK: ['gade', 'vej'],
  DE: ['straße', 'weg'], AT: ['straße'], CH: ['strasse'], GR: ['Odos'], PL: ['ulica'], JP: ['Chome'],
};
function addressFor(r, p) {
  const c = p.Country ?? 'US';
  const num = r.int(1, 240);
  const street = r.pick(STREETS);
  const sfx = r.pick(SUFFIX_BY_COUNTRY[c] ?? ['St']);
  // romance/germanic ordering puts the number after the street name
  const numberLast = ['FR', 'IT', 'ES', 'PT', 'MX', 'AR', 'NL', 'DK', 'DE', 'AT', 'CH', 'GR', 'PL'].includes(c);
  const joined = ['NL', 'DK', 'DE', 'AT', 'CH'].includes(c); // Millstraat, not Mill straat
  const line = joined ? `${street}${sfx} ${num}`
    : numberLast ? `${sfx} ${street} ${num}` : `${num} ${street} ${sfx}`;
  const postal = {
    US: () => String(r.int(1001, 99950)).padStart(5, '0'),
    CA: () => `${r.pick(['K', 'L', 'M', 'N', 'V'])}${r.int(0, 9)}${r.pick(['A', 'B', 'C', 'J', 'R'])} ${r.int(0, 9)}${r.pick(['A', 'B', 'X', 'Z'])}${r.int(0, 9)}`,
    GB: () => `${r.pick(['BA', 'TA', 'SY', 'KA'])}${r.int(1, 20)} ${r.int(1, 9)}${r.pick(['AA', 'BQ', 'HX', 'PT'])}`,
    IE: () => `${r.pick(['R95', 'T12', 'D02'])} ${r.pick(['XY', 'AB', 'K4'])}${r.int(10, 99)}`,
    FR: () => String(r.int(1000, 98999)).padStart(5, '0'),
    IT: () => String(r.int(10, 98999)).padStart(5, '0'),
    ES: () => String(r.int(1000, 52999)).padStart(5, '0'),
    PT: () => `${String(r.int(1000, 9999))}-${String(r.int(0, 999)).padStart(3, '0')}`,
    MX: () => String(r.int(1000, 99999)).padStart(5, '0'),
    AR: () => `${r.pick(['B', 'C', 'X'])}${r.int(1000, 9999)}${r.pick(['ABC', 'XYZ', 'DEF'])}`,
    NL: () => `${r.int(1000, 9999)} ${r.pick(['AB', 'CD', 'JK', 'ZX'])}`,
    DK: () => String(r.int(1000, 9990)),
    DE: () => String(r.int(1000, 99998)).padStart(5, '0'),
    AT: () => String(r.int(1000, 9992)),
    CH: () => String(r.int(1000, 9658)),
    GR: () => `${r.int(100, 999)} ${r.int(10, 99)}`,
    PL: () => `${String(r.int(0, 99)).padStart(2, '0')}-${String(r.int(0, 999)).padStart(3, '0')}`,
    JP: () => `${String(r.int(0, 999)).padStart(3, '0')}-${String(r.int(0, 9999)).padStart(4, '0')}`,
  }[c] ?? (() => String(r.int(10000, 99999)));
  // addresses are less complete than phones in every AMS that publishes fill rates
  if (!r.bernoulli(0.86)) return { AddressLine1: null, AddressLine2: null, PostalCode: null };
  return {
    AddressLine1: line,
    AddressLine2: r.bernoulli(0.14) ? `${r.pick(['Unit', 'Apt', 'Suite'])} ${r.int(1, 40)}` : null,
    PostalCode: postal(),
  };
}

/** Organization contact/profile fields — all pre-existing upstream columns. */
export function orgIdentityFor(seed, o, releaseYear) {
  const r = rng(seed, `orgmeta:${o.OrgKey}`);
  const suffixByCountry = { FR: 'SARL', DK: 'ApS', NL: 'B.V.', CH: 'AG', GB: 'Ltd', IE: 'Ltd', IT: 'S.r.l.', ES: 'S.L.', PT: 'Lda', DE: 'GmbH', AT: 'GmbH', GR: 'EPE', PL: 'Sp. z o.o.', MX: 'S.A. de C.V.', AR: 'S.A.', AU: 'Pty Ltd', NZ: 'Ltd', JP: 'K.K.', CA: 'Inc.' };
  const legalSuffix = suffixByCountry[o.Country] ?? (o.Type === 'Producer' ? 'LLC' : 'Inc.');
  const founded = releaseYear - r.int(3, 80);
  return {
    LegalName: `${o.Name} ${legalSuffix}`,
    // same slug as the work-email domain, so a member's address and their employer's
    // website agree instead of disagreeing on the truncation
    Website: r.bernoulli(0.72) ? `https://www.${orgDomainFor(o.Name)}` : null,
    Phone: r.bernoulli(0.66) ? (PHONE[o.Country] ?? usPhone)(r) : null,
    FoundedDate: `${founded}-${String(r.int(1, 12)).padStart(2, '0')}-${String(r.int(1, 28)).padStart(2, '0')}`,
    ...(() => { const a = addressFor(r, o); return { AddressLine1: a.AddressLine1, PostalCode: a.PostalCode }; })(),
  };
}
