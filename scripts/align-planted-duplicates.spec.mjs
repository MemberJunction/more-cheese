/**
 * Spec for the planted-duplicate alignment pass (#117).
 *
 * More Cheese plants duplicate people for the duplicate-detection demo: a `DuplicatePerson` data
 * quality label points from the duplicate (`PersonID`) to its original (`RelatedPersonID`). The
 * generator's name and DOB passes run over every person, so without this pass the pair shares only
 * a surname and duplicate detection rightly rejects it. The pass copies the identity fields from the
 * original onto the duplicate after those passes.
 *
 * The fixture cases cover the rules; the last case reads the committed `generated/` tree, so a
 * regeneration that drops the pass fails here, not in a demo.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { alignPlantedDuplicates } from './align-planted-duplicates.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const GENERATED = path.join(HERE, '..', 'generated');

const MOBILE = '@lookup:MJ_BizApps_Common: Contact Types.Name=Mobile Phone';
const WORK_PHONE = '@lookup:MJ_BizApps_Common: Contact Types.Name=Work Phone';
const EMAIL = '@lookup:MJ_BizApps_Common: Contact Types.Name=Email';

function person(ID, fields) {
    return { fields: { MiddleName: null, Phone: null, ...fields }, primaryKey: { ID } };
}
function contact(ID, PersonID, ContactTypeID, Value, IsPrimary = true) {
    return { fields: { PersonID, OrganizationID: null, ContactTypeID, Value, Label: 'Work', IsPrimary }, primaryKey: { ID } };
}
function dupLabel(PersonID, RelatedPersonID, DefectValue = 'Julien Agarwal (ICF-D00467)') {
    return { fields: { DefectKind: 'DuplicatePerson', PersonID, RelatedPersonID, DefectValue }, primaryKey: { ID: `L-${PersonID}` } };
}

function pair({ dupPhone = '+1 (222) 222-2222', origPhone = '+1 (111) 111-1111', dupEmail = 'manish.dup@example' } = {}) {
    const people = [
        person('ORIG', { FirstName: 'Manish', MiddleName: 'K.', LastName: 'Agarwal', DateOfBirth: '1974-02-02', Phone: origPhone, Email: 'manish@example' }),
        person('DUP', { FirstName: 'Julien', LastName: 'Agarwal', DateOfBirth: '1994-04-05', Phone: dupPhone, Email: dupEmail }),
    ];
    const contactMethods = [contact('CM-O-E', 'ORIG', EMAIL, 'manish@example'), contact('CM-D-E', 'DUP', EMAIL, dupEmail)];
    if (origPhone) contactMethods.push(contact('CM-O-P', 'ORIG', MOBILE, origPhone));
    if (dupPhone) contactMethods.push(contact('CM-D-P', 'DUP', WORK_PHONE, dupPhone), contact('CM-D-P2', 'DUP', WORK_PHONE, '+1 (999) 999-9999', false));
    return { people, contactMethods, labels: [dupLabel('DUP', 'ORIG')] };
}

const byId = (rows, id) => rows.find((r) => r.primaryKey.ID === id).fields;

test('the duplicate takes the original\'s name, middle name, birth date and phone; email and IDs stay its own', () => {
    const { people, contactMethods, labels } = pair();
    alignPlantedDuplicates({ people, contactMethods, labels });

    const dup = byId(people, 'DUP');
    assert.equal(dup.FirstName, 'Manish');
    assert.equal(dup.MiddleName, 'K.');
    assert.equal(dup.LastName, 'Agarwal');
    assert.equal(dup.DateOfBirth, '1974-02-02');
    assert.equal(dup.Phone, '+1 (111) 111-1111');
    assert.equal(dup.Email, 'manish.dup@example');
    assert.deepEqual(people.map((p) => p.primaryKey.ID), ['ORIG', 'DUP']);
    assert.deepEqual(byId(people, 'ORIG'), pair().people[0].fields, 'the original is never edited');
});

test('the duplicate\'s own phone contact row follows its new phone; no contact row is added or removed', () => {
    const { people, contactMethods, labels } = pair();
    const idsBefore = contactMethods.map((c) => c.primaryKey.ID);
    alignPlantedDuplicates({ people, contactMethods, labels });

    assert.deepEqual(contactMethods.map((c) => c.primaryKey.ID), idsBefore);
    assert.equal(byId(contactMethods, 'CM-D-P').Value, '+1 (111) 111-1111');
    assert.equal(byId(contactMethods, 'CM-D-P').ContactTypeID, WORK_PHONE, 'only the value moves');
    assert.equal(byId(contactMethods, 'CM-D-P2').Value, '+1 (999) 999-9999', 'secondary numbers are left alone');
    assert.equal(byId(contactMethods, 'CM-D-E').Value, 'manish.dup@example');
});

test('phone is left alone when either side has none — a phone cannot be added or dropped without adding or dropping a contact row', () => {
    for (const variant of [{ dupPhone: null }, { origPhone: null }]) {
        const { people, contactMethods, labels } = pair(variant);
        const before = JSON.stringify(contactMethods);
        alignPlantedDuplicates({ people, contactMethods, labels });

        const dup = byId(people, 'DUP');
        assert.equal(dup.Phone, variant.dupPhone === null ? null : '+1 (222) 222-2222');
        assert.equal(JSON.stringify(contactMethods), before);
        assert.equal(dup.FirstName, 'Manish', 'the rest of the identity still aligns');
        assert.equal(dup.DateOfBirth, '1974-02-02');
    }
});

test('a hero duplicate keeps the names its hero entry fixes and takes the rest', () => {
    const { people, contactMethods, labels } = pair({ dupEmail: 'kathy.oleary@example' });
    const dup = byId(people, 'DUP');
    dup.FirstName = 'Kathy';
    dup.LastName = 'OLeary';
    const heroFixedFieldsByEmail = new Map([['kathy.oleary@example', { FirstName: 'Kathy', LastName: 'OLeary', Title: 'Director' }]]);
    alignPlantedDuplicates({ people, contactMethods, labels, heroFixedFieldsByEmail });

    assert.equal(dup.FirstName, 'Kathy');
    assert.equal(dup.LastName, 'OLeary');
    assert.equal(dup.DateOfBirth, '1974-02-02');
    assert.equal(dup.Phone, '+1 (111) 111-1111');
});

test('the label\'s DefectValue names the duplicate as it now reads; its code in brackets stays', () => {
    const { people, contactMethods, labels } = pair();
    alignPlantedDuplicates({ people, contactMethods, labels });
    assert.equal(labels[0].fields.DefectValue, 'Manish Agarwal (ICF-D00467)');
});

test('a hero duplicate\'s DefectValue keeps the hero\'s fixed name', () => {
    const { people, contactMethods } = pair({ dupEmail: 'kathy.oleary@example' });
    const dup = byId(people, 'DUP');
    dup.FirstName = 'Kathy';
    dup.LastName = 'OLeary';
    const labels = [dupLabel('DUP', 'ORIG', 'Kathy OLeary (ICF-000287)')];
    const heroFixedFieldsByEmail = new Map([['kathy.oleary@example', { FirstName: 'Kathy', LastName: 'OLeary' }]]);
    alignPlantedDuplicates({ people, contactMethods, labels, heroFixedFieldsByEmail });
    assert.equal(labels[0].fields.DefectValue, 'Kathy OLeary (ICF-000287)');
});

test('a DefectValue not in the "Name (code)" shape fails loudly rather than being guessed at', () => {
    const { people, contactMethods } = pair();
    assert.throws(() => alignPlantedDuplicates({ people, contactMethods, labels: [dupLabel('DUP', 'ORIG', 'Julien Agarwal')] }), /DefectValue/);
});

test('a second run changes nothing', () => {
    const { people, contactMethods, labels } = pair();
    alignPlantedDuplicates({ people, contactMethods, labels });
    const once = JSON.stringify({ people, contactMethods, labels });
    const stats = alignPlantedDuplicates({ people, contactMethods, labels });
    assert.equal(JSON.stringify({ people, contactMethods, labels }), once);
    assert.equal(stats.fieldsChanged, 0);
});

test('a label pointing at a missing person fails loudly', () => {
    const { people, contactMethods } = pair();
    assert.throws(() => alignPlantedDuplicates({ people, contactMethods, labels: [dupLabel('DUP', 'GONE')] }), /GONE/);
});

test('the committed generated/ tree: every planted pair looks like a duplicate', () => {
    const readRows = (dir) =>
        fs
            .readdirSync(path.join(GENERATED, dir))
            .filter((f) => f.endsWith('.json') && f !== '.mj-sync.json')
            .sort()
            .flatMap((f) => JSON.parse(fs.readFileSync(path.join(GENERATED, dir, f), 'utf8')));
    const people = new Map(readRows('people').map((p) => [p.primaryKey.ID.toLowerCase(), p.fields]));
    const phonesByPerson = new Map();
    for (const c of readRows('contact-methods')) {
        if (!/Phone/.test(c.fields.ContactTypeID) || !c.fields.IsPrimary) continue;
        const key = String(c.fields.PersonID).toLowerCase();
        phonesByPerson.set(key, [...(phonesByPerson.get(key) || []), c.fields.Value]);
    }
    const heroes = JSON.parse(fs.readFileSync(path.join(HERE, '..', 'data', 'ruleset', 'heroes.json'), 'utf8')).heroes;
    const fixedByEmail = new Map(heroes.map((h) => [h.businessKeys.Email.toLowerCase(), h.fixedFields || {}]));

    const labels = readRows('data-quality-labels').filter((l) => l.fields.DefectKind === 'DuplicatePerson');
    assert.ok(labels.length > 0, 'no DuplicatePerson labels found');

    const problems = [];
    for (const { fields: l } of labels) {
        const dup = people.get(l.PersonID.toLowerCase());
        const orig = people.get(l.RelatedPersonID.toLowerCase());
        const fixed = fixedByEmail.get(String(dup.Email).toLowerCase()) || {};
        for (const f of ['FirstName', 'MiddleName', 'LastName', 'DateOfBirth']) {
            if (!(f in fixed) && dup[f] !== orig[f]) problems.push(`${l.DefectValue}: ${f} ${JSON.stringify(dup[f])} ≠ original ${JSON.stringify(orig[f])}`);
        }
        if (!l.DefectValue.startsWith(`${dup.FirstName} ${dup.LastName} (`)) problems.push(`${l.DefectValue}: DefectValue does not name the duplicate ${dup.FirstName} ${dup.LastName}`);
        if (dup.Phone && orig.Phone && dup.Phone !== orig.Phone) problems.push(`${l.DefectValue}: Phone ${dup.Phone} ≠ original ${orig.Phone}`);
        if (dup.Phone && !(phonesByPerson.get(l.PersonID.toLowerCase()) || []).includes(dup.Phone)) {
            problems.push(`${l.DefectValue}: Phone ${dup.Phone} has no primary phone contact row`);
        }
    }
    assert.deepEqual(problems, [], `${problems.length} problems across ${labels.length} planted pairs`);
});
