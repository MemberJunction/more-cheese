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

/** national phone shapes — keyed off the (overloaded) State field until Country exists */
const PHONE = {
  FR: (r) => `+33 ${r.int(1, 9)} ${d2(r)} ${d2(r)} ${d2(r)} ${d2(r)}`,
  DK: (r) => `+45 ${d2(r)} ${d2(r)} ${d2(r)} ${d2(r)}`,
  NL: (r) => `+31 ${d2(r)} ${d3(r)} ${d4(r)}`,
  CH: (r) => `+41 ${d2(r)} ${d3(r)} ${d2(r)} ${d2(r)}`,
  UK: (r) => `+44 ${d4(r)} ${d3(r)}${d3(r)}`,
  MX: (r) => `+52 ${d2(r)} ${d4(r)} ${d4(r)}`,
  AU: (r) => `+61 ${r.int(2, 8)} ${d4(r)} ${d4(r)}`,
  NZ: (r) => `+64 ${r.int(3, 9)} ${d3(r)} ${d4(r)}`,
  'CA-ON': (r) => `+1 (${r.int(226, 905)}) ${d3(r)}-${d4(r)}`,
};
const d2 = (r) => String(r.int(0, 99)).padStart(2, '0');
const d3 = (r) => String(r.int(0, 999)).padStart(3, '0');
const d4 = (r) => String(r.int(0, 9999)).padStart(4, '0');
const usPhone = (r) => `+1 (${r.int(201, 989)}) ${d3(r)}-${d4(r)}`;

/** completeness rises with tenure; newest joiners are about twice as blank (AIA 2024) */
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

  // --- phone: national format, sometimes absent
  const fmt = PHONE[p.State] ?? usPhone;
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
  const Gender = rd.bernoulli(answeredShare(0.065, tenure))
    ? rd.pickWeighted([['Female', 0.475], ['Male', 0.475], ['Non-binary', 0.012], ['Self-described', 0.004], ['Prefer not to say', 0.034]])
    : null;

  // --- birthdate: working-age spread, no correlation with anything
  let DateOfBirth = null;
  if (rd.bernoulli(answeredShare(0.105, tenure))) {
    const age = rd.pickWeighted([[[22, 29], 0.13], [[30, 39], 0.26], [[40, 49], 0.24], [[50, 59], 0.21], [[60, 69], 0.12], [[70, 78], 0.04]]);
    const yr = release.getUTCFullYear() - rd.int(age[0], age[1]);
    const mo = rd.int(0, 11);
    DateOfBirth = iso(new Date(Date.UTC(yr, mo, rd.int(1, new Date(Date.UTC(yr, mo + 1, 0)).getUTCDate()))));
  }

  return { Prefix, Suffix, Phone, Gender, DateOfBirth };
}

/** Organization contact/profile fields — all pre-existing upstream columns. */
export function orgIdentityFor(seed, o, releaseYear) {
  const r = rng(seed, `orgmeta:${o.OrgKey}`);
  const suffixByCountry = { FR: 'SARL', DK: 'ApS', NL: 'B.V.', CH: 'AG', UK: 'Ltd', MX: 'S.A. de C.V.', AU: 'Pty Ltd', NZ: 'Ltd' };
  const legalSuffix = suffixByCountry[o.State] ?? (o.Type === 'Producer' ? 'LLC' : 'Inc.');
  const founded = releaseYear - r.int(3, 80);
  return {
    LegalName: `${o.Name} ${legalSuffix}`,
    // same slug as the work-email domain, so a member's address and their employer's
    // website agree instead of disagreeing on the truncation
    Website: r.bernoulli(0.72) ? `https://www.${orgDomainFor(o.Name)}` : null,
    Phone: r.bernoulli(0.66) ? (PHONE[o.State] ?? usPhone)(r) : null,
    FoundedDate: `${founded}-${String(r.int(1, 12)).padStart(2, '0')}-${String(r.int(1, 28)).padStart(2, '0')}`,
  };
}
