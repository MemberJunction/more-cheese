// Contact methods and addresses as FIRST-CLASS bizapps-common rows.
//
// Why this module exists: bizapps-common owns the contact/address domain (ContactMethod,
// Address, AddressLink) and ships the UI that reads them. We were generating the same facts
// into MemberProfile's own columns and leaving the app's tables empty — a member opened in
// their UI had no address and no contact methods. The ownership rule (BIZAPPS-COVERAGE.md)
// says the system of record is the app that owns the domain; MemberProfile keeps its
// denormalised copy for segmentation, and these rows are the record.
//
// Determinism: the ADDRESS rows are a pure projection of fields already on the person/org
// row — no draws at all, so nothing upstream moves. Only the extra contact methods (second
// phone, LinkedIn) consume randomness, and they do it on their own new streams.
//
// F6: ContactType ('Email'/'Mobile Phone'/'Work Phone'/'LinkedIn'/'Website'/…) and AddressType
// (Home/Work/Mailing/Billing/Legal/Shipping) are SEEDED BY bizapps-common. We reference them
// by NAME and never emit the lookup rows themselves.

import { rng } from '../../engine/rng.mjs';
import { deaccent } from './world.mjs';
import { renderRow } from '../../engine/row-template.mjs';

/** the seeded type names we reference — a gate asserts these against the schema contract */
export const CONTACT_TYPES = ['Email', 'Mobile Phone', 'Work Phone', 'LinkedIn', 'Website'];
export const ADDRESS_TYPES = ['Home', 'Work', 'Mailing'];

// ── row templates ── the LINK row is a clean projection. The ADDRESS row is NOT and stays
// handwritten: StateProvince strips a country prefix by regex and Country falls back through
// CountryName — a computed field and a real fallback, neither of which belongs in a template.
export const ADDRESS_LINK_ROW = { row: {
  LinkKey: { from: 'key' }, AddressKey: { from: 'key' }, EntityName: { from: 'entityName' },
  RecordKind: { from: 'recordKind' }, RecordKey: { from: 'recordKey' },
  AddressTypeName: { from: 'addressType' }, IsPrimary: true, Rank: 1,
} };
/** this row draws nothing; the sentinel makes that a hard error rather than a convention */
const NO_DRAWS = new Proxy({}, { get(_, k) { throw new Error(`ADDRESS_LINK_ROW must not draw ('${String(k)}')`); } });

export function buildContacts(cfg, { people, orgs }) {
  // ── inputs ── the ruleset sections this domain reads, and the upstream rows
  const { R, seed } = cfg;
  const C = R.contacts;
  const addresses = [];
  const addressLinks = [];
  const contactMethods = [];

  const pushAddress = (key, row, entityName, recordKind, recordKey, addressType) => {
    if (!row.AddressLine1 || !row.City || !row.Country) return;
    addresses.push({
      AddressKey: key, Line1: row.AddressLine1, Line2: row.AddressLine2 ?? null,
      City: row.City,
      // MemberProfile.State keeps the ISO subdivision code (US-NY) — right for a profile field
      // and for segmentation. On an ADDRESS line it reads wrong: a real address says 'Brooklyn,
      // NY', never 'Brooklyn, US-NY'. Strip the country prefix here only.
      StateProvince: row.State ? String(row.State).replace(/^[A-Z]{2}-/, '') : null,
      PostalCode: row.PostalCode ?? null,
      Country: row.CountryName ?? row.Country, Latitude: row.Latitude ?? null, Longitude: row.Longitude ?? null,
    });
    addressLinks.push(renderRow(NO_DRAWS, ADDRESS_LINK_ROW, { key, entityName, recordKind, recordKey, addressType }));
  };

  // ── decisions ── people
  for (const p of people) {
    // a member who gave us a street address gets one on file; where they work decides
    // whether it reads as a work or a home address
    pushAddress(`person:${p.MemberNumber}`, p, 'MJ_BizApps_Common: People', 'person', p.MemberNumber,
      p.OrgKey ? 'Work' : 'Home');

    const r = rng(seed, `contactmethods:${p.MemberNumber}`);
    const push = (type, value, isPrimary, label) => {
      if (!value) return;
      contactMethods.push({
        MethodKey: `person:${p.MemberNumber}:${type}`, OwnerKind: 'person', OwnerKey: p.MemberNumber,
        ContactTypeName: type, Value: value, Label: label ?? null, IsPrimary: isPrimary,
      });
    };

    push('Email', p.Email, true, 'Work');
    if (p.Phone) {
      // one number on file: most people give a mobile, the rest a desk line
      const primaryType = r.bernoulli(C.params.mobileFirstShare) ? 'Mobile Phone' : 'Work Phone';
      push(primaryType, p.Phone, true, primaryType === 'Mobile Phone' ? 'Mobile' : 'Work');
      if (r.bernoulli(C.params.secondPhoneShare)) {
        const other = primaryType === 'Mobile Phone' ? 'Work Phone' : 'Mobile Phone';
        push(other, altPhone(r, p.Phone), false, other === 'Mobile Phone' ? 'Mobile' : 'Work');
      }
    }
    if (r.bernoulli(C.params.linkedInShare)) {
      const slug = `${deaccent(p.FirstName)}-${deaccent(p.LastName)}`.toLowerCase().replace(/[^a-z-]/g, '');
      push('LinkedIn', `https://www.linkedin.com/in/${slug}`, false, null);
    }
  }

  // ── decisions ── organizations
  for (const o of orgs) {
    pushAddress(`org:${o.OrgKey}`, o, 'MJ_BizApps_Common: Organizations', 'org', o.OrgKey, 'Mailing');

    const r = rng(seed, `orgcontacts:${o.OrgKey}`);
    const push = (type, value, isPrimary) => {
      if (!value) return;
      contactMethods.push({
        MethodKey: `org:${o.OrgKey}:${type}`, OwnerKind: 'org', OwnerKey: o.OrgKey,
        ContactTypeName: type, Value: value, Label: null, IsPrimary: isPrimary,
      });
    };
    push('Website', o.Website, true);
    if (r.bernoulli(C.params.orgPhoneShare)) push('Work Phone', o.Phone, o.Website ? false : true);
  }

  // ── shape ── assemble the named tables this domain owns
  return { addresses, addressLinks, contactMethods };
}

/** a second line on the same exchange — only the last four digits differ, national format kept */
function altPhone(r, phone) {
  const four = String(r.int(1000, 9999));
  const chars = phone.split('');
  const digitPositions = [];
  for (let i = 0; i < chars.length; i++) if (chars[i] >= '0' && chars[i] <= '9') digitPositions.push(i);
  digitPositions.slice(-4).forEach((pos, k) => { chars[pos] = four[k]; });
  return chars.join('');
}
