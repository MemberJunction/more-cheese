/**
 * Specs for the pure parts of plan-month-gemini.mjs — the brief the model decides from, the checks that stand
 * between its decisions and the compiler, and the compiler that turns decisions into a Loom plan. The model
 * call, Loom and the gates are not exercised here (they need a key, the network and the 90 MB tree); what is
 * pinned down is that a due member is found, a bad decision is named before anything is compiled, and the
 * compiled plan carries the shapes check-metadata-closure enforces (dues numbering, status shape, payments).
 *
 * The world is a handful of in-memory rows shaped like loadWorld()'s, so no case depends on generated/.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { addMonths, monthEnd, monthSegments, segmentsOf, rng, slug, dueRenewals, buildBrief, checkDecisions, compilePlan } from './plan-month-gemini.mjs';

const P = (n) => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`;
const SKUS = { 'PROD-MEM-ENTHUSIAST': 150, 'PROD-MEM-INDIVIDUAL': 175, 'PROD-MEM-SMALLBUSINESS': 400, 'PROD-MEM-CORPORATE': 1000, 'PROD-PUB-JOURNAL': 85, 'PROD-EVT-WORKSHOP': 150, 'PROD-EVT-CONFERENCE': 450 };
const WIN = { from: '2026-10-01', asOf: '2026-10-31' };

function world() {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'plan-month-spec-'));
    fs.mkdirSync(path.join(root, 'content', 'blog', '2026'), { recursive: true });
    const products = Object.entries(SKUS).map(([SKU, price], i) => ({ id: P(900 + i), SKU, Name: SKU, StandaloneSellingPrice: price }));
    const productBySku = new Map(products.map((p) => [p.SKU, p]));
    const people = [
        { id: P(1), FirstName: 'Ada', LastName: 'Due', Email: 'ada.due.100001@lakemail.example' },
        { id: P(2), FirstName: 'Bo', LastName: 'Early', Email: 'bo.early.100002@lakemail.example' },
        { id: P(3), FirstName: 'Cy', LastName: 'Keen', Email: 'cy.keen.100003@quillpost.example' },
    ];
    const profiles = [
        { PersonID: P(1), MemberNumber: 'ICF-100001', Segment: 'Producer', Region: 'NA', Country: 'US', CountryName: 'United States', City: 'Madison', State: 'US-WI', Latitude: 43.07, Longitude: -89.4, PrimaryLanguage: 'English', OrganizationID: null, RaceEthnicity: 'White', EthnicityHispanic: 'Not Hispanic or Latino' },
        { PersonID: P(2), MemberNumber: 'ICF-100002', Segment: 'Enthusiast', Region: 'NA', Country: 'US', CountryName: 'United States', City: 'Madison', State: 'US-WI', Latitude: 43.07, Longitude: -89.4, PrimaryLanguage: 'English', OrganizationID: null, RaceEthnicity: null, EthnicityHispanic: null },
        { PersonID: P(3), MemberNumber: 'ICF-100003', Segment: 'Retailer', Region: 'EU', Country: 'IT', CountryName: 'Italy', City: 'Bra', State: 'IT-CN', Latitude: 44.7, Longitude: 7.86, PrimaryLanguage: 'Italian', OrganizationID: P(50), RaceEthnicity: 'White', EthnicityHispanic: 'Not Hispanic or Latino' },
    ];
    const order = (n, person, date, skus, extra = {}) => {
        const o = { id: P(n), OrderNumber: extra.number, Status: 'Confirmed', OrderDate: date, BillToPersonID: person, ...extra };
        o.lines = skus.map((sku) => ({ order: o, sku, event: extra.event ?? null }));
        return o;
    };
    const orders = [
        order(101, P(1), '2025-10-05', ['PROD-MEM-INDIVIDUAL', 'PROD-PUB-JOURNAL'], { number: 'ORD-D-ICF-100001-P3' }),
        order(102, P(2), '2025-09-05', ['PROD-MEM-ENTHUSIAST'], { number: 'ORD-D-ICF-100002-P1' }),
        order(103, P(3), '2025-10-20', ['PROD-MEM-INDIVIDUAL'], { number: 'ORD-D-ICF-100003-P2' }),
        order(104, P(3), '2025-06-01', ['PROD-EVT-WORKSHOP'], { number: 'ORD-E-REG-ICF-100003-EVT-2025-W1', event: { PersonID: P(3), AttendanceStatus: 'Attended' } }),
    ];
    return {
        root, products, productBySku, productById: new Map(products.map((p) => [p.id, p])), people, personById: new Map(people.map((p) => [p.id, p])),
        profiles, profileByPerson: new Map(profiles.map((m) => [m.PersonID, m])), profileByNumber: new Map(profiles.map((m) => [m.MemberNumber, m])),
        orgs: [{ id: P(50), Name: 'Caseificio Test', Status: 'Active', Website: 'https://www.caseificiotest.example' }], orgById: new Map([[P(50), { Name: 'Caseificio Test' }]]),
        orgProfiles: new Map([[P(50), { Type: 'Producer', Country: 'IT', City: 'Bra' }]]), orders, lines: orders.flatMap((o) => o.lines),
        contacts: [], eras: [{ eraKey: 'era-test', cycles: [2026], description: 'test era' }], checkpoint: { continuity: { asOfDate: '2026-09-30' } },
        calendar: [
            { EventKey: 'EVT-2025-W1', Name: 'Workshop: Past', EventType: 'Workshop', EventDate: '2025-06-20', IsPaid: true, City: 'Bra', State: 'IT-CN' },
            { EventKey: 'EVT-2026-W5', Name: 'Workshop: Test', EventType: 'Workshop', EventDate: '2026-10-27', IsPaid: true, City: 'Madison', State: 'US-WI' },
            { EventKey: 'EVT-2026-WEB1', Name: 'Webinar: Free', EventType: 'Webinar', EventDate: '2026-10-15', IsPaid: false, City: null, State: null },
        ],
    };
}
const join = (over = {}) => ({ key: 'j1', firstName: 'Renata', lastName: 'Vasquez-Hale', gender: 'Female', title: 'Head Cheesemaker', segment: 'Producer', tier: 'Individual', city: 'Madison', country: 'US', organization: null, addressLine1: '418 Curd Mill Rd', postalCode: '53703', date: '2026-10-06', journal: false, ...over });
const decisions = (over = {}) => ({ summary: 'One member joins; one lapses.', joins: [join()], lapses: [], tierChanges: [], unpaidRenewals: [], registrations: [], ...over });

test('dates: month arithmetic clamps to the month end', () => {
    assert.equal(addMonths('2025-10-05', 12), '2026-10-05');
    assert.equal(addMonths('2024-01-31', 1), '2024-02-29');
    assert.equal(monthEnd('2026-02'), '2026-02-28');
    assert.equal(monthEnd('2026-10'), '2026-10-31');
});

test('a window splits into calendar months, keeping its own first and last day', () => {
    assert.deepEqual(monthSegments({ from: '2026-07-01', asOf: '2026-10-31' }).map((m) => `${m.from}..${m.asOf}`),
        ['2026-07-01..2026-07-31', '2026-08-01..2026-08-31', '2026-09-01..2026-09-30', '2026-10-01..2026-10-31']);
    assert.deepEqual(monthSegments({ from: '2026-09-15', asOf: '2026-10-31' }).map((m) => m.from), ['2026-09-15', '2026-10-01']);
    assert.deepEqual(monthSegments(WIN), [WIN]);
});

test('a decisions file is read as months, whether it holds segments or one bare DECISIONS object', () => {
    const july = { window: { from: '2026-07-01', asOf: '2026-07-31' }, summary: 'July' };
    assert.deepEqual(segmentsOf({ segments: [july] }, '2026-10'), [july]);
    assert.deepEqual(segmentsOf({ summary: 'October', joins: [] }, '2026-10'), [{ window: '2026-10', summary: 'October', joins: [] }]);
});

test('draws are seeded: the same seed gives the same sequence', () => {
    const a = rng('x'), b = rng('x'), c = rng('y');
    const seq = (r) => Array.from({ length: 5 }, () => r.next());
    assert.deepEqual(seq(a), seq(b));
    assert.notDeepEqual(seq(rng('x')), seq(c));
    assert.equal(slug('Vasquez-Hale'), 'vasquezhale');
    assert.equal(slug('Gallo-Vercelli Müller'), 'gallovercellimuller');
});

test('dueRenewals finds members whose latest purchase comes up for its anniversary in the window', () => {
    const due = dueRenewals(world(), WIN);
    assert.deepEqual(due.map((m) => m.memberNumber), ['ICF-100001', 'ICF-100003']);
    const ada = due[0];
    assert.equal(ada.anniversary, '2026-10-05');
    assert.equal(ada.period, 3);
    assert.equal(ada.journal, true);
    assert.equal(due[1].attended24mo, 1);
});

test('the brief lists paid events only, and counts last year', () => {
    const w = world();
    const brief = buildBrief(w, WIN);
    assert.deepEqual(brief.events.map((e) => e.eventKey), ['EVT-2026-W5']);
    assert.equal(brief.nextMemberNumber, 100004);
    assert.equal(brief.lastYear.joins, 2);
    assert.equal(brief.lastYear.renewalOrders, 0);
    assert.equal(brief.cities.length, 2);
});

test('checkDecisions passes clean decisions and names each bad one', () => {
    const w = world();
    const brief = buildBrief(w, WIN);
    assert.deepEqual(checkDecisions(decisions(), brief, w), []);
    const bad = checkDecisions(decisions({
        joins: [join({ city: 'Atlantis' }), join({ key: 'j1', firstName: 'Ada', lastName: 'Due' }), join({ key: 'j3', segment: 'Enthusiast', tier: 'Individual' }), join({ key: 'j4', date: '2026-11-02' }), join({ key: 'j5', tier: 'Corporate' })],
        lapses: [{ memberNumber: 'ICF-100002', reason: 'not due' }],
        tierChanges: [{ memberNumber: 'ICF-100001', tier: 'Individual', reason: 'same tier' }],
        unpaidRenewals: ['ICF-100009'],
        registrations: [{ eventKey: 'EVT-2026-WEB1', count: 1 }, { eventKey: 'EVT-2026-W5', count: 1, include: ['ICF-100001', 'ICF-100003'] }],
    }), brief, w).join('\n');
    assert.match(bad, /city Atlantis, US is not in KNOWN CITIES/);
    assert.match(bad, /key must be present and unique/);
    assert.match(bad, /Ada Due already exists/);
    assert.match(bad, /Enthusiast tier is for \(and only for\) the Enthusiast segment/);
    assert.match(bad, /date must be inside the window/);
    assert.match(bad, /Corporate membership needs an organization/);
    assert.match(bad, /lapses\[0\]: ICF-100002 is not in DUE RENEWALS/);
    assert.match(bad, /is already Individual/);
    assert.match(bad, /unpaidRenewals\[0\]: ICF-100009/);
    assert.match(bad, /EVT-2026-WEB1 is not in EVENTS/);
    assert.match(bad, /include names 2 people but count is 1/);
    assert.deepEqual(checkDecisions({ summary: 'x' }, brief, w), ['joins must be an array', 'lapses must be an array', 'tierChanges must be an array', 'unpaidRenewals must be an array', 'registrations must be an array']);
});

test('compilePlan: joins, renewals, lapses and registrations in the shapes generated/ uses', () => {
    const w = world();
    const brief = buildBrief(w, WIN);
    const d = decisions({ joins: [join({ journal: true })], lapses: [{ memberNumber: 'ICF-100003', reason: 'closed shop' }], unpaidRenewals: ['ICF-100001'], registrations: [{ eventKey: 'EVT-2026-W5', count: 2, include: ['j1'] }] });
    const plan = compilePlan(d, brief, w);
    assert.equal(plan.asOf, '2026-10-31');
    assert.deepEqual(plan, compilePlan(d, brief, w), 'the same decisions compile to the same plan');
    const orders = plan.records.filter((r) => r.entity === 'Order').map((r) => r.fields);
    const numbers = orders.map((o) => o.OrderNumber);
    // The new member's first dues period, the due member's next one, nothing for the lapsed member
    assert.ok(numbers.includes('ORD-D-ICF-100004-P1'));
    assert.ok(numbers.includes('ORD-D-ICF-100001-P4'));
    assert.ok(!numbers.some((n) => n.includes('ICF-100003-P')));
    // Status shape: a paid order with the journal is Fulfilled; an unpaid one is Pending with a balance and no payment
    const first = orders.find((o) => o.OrderNumber === 'ORD-D-ICF-100004-P1');
    assert.deepEqual([first.Status, first.FulfillmentStatus, first.TotalGross, first.Balance], ['Confirmed', 'Fulfilled', 260, 0]);
    const unpaid = orders.find((o) => o.OrderNumber === 'ORD-D-ICF-100001-P4');
    assert.deepEqual([unpaid.FulfillmentStatus, unpaid.AmountPaid, unpaid.Balance], ['Pending', 0, 260]);
    const payments = plan.records.filter((r) => r.entity === 'Payment').map((r) => r.fields.PaymentNumber);
    assert.ok(payments.includes('PMT-D-ICF-100004-P1'));
    assert.ok(!payments.includes('PMT-D-ICF-100001-P4'));
    // Registrations: the named new member plus one drawn member, each an event order line extending its line
    const regs = orders.filter((o) => o.OrderNumber.startsWith('ORD-E-REG-'));
    assert.equal(regs.length, 2);
    assert.ok(regs.some((o) => o.OrderNumber === 'ORD-E-REG-ICF-100004-EVT-2026-W5'));
    for (const o of regs) {
        assert.equal(o.FulfillmentStatus, 'NotApplicable');
        assert.ok(o.OrderDate >= '2026-10-01' && o.OrderDate <= '2026-10-27');
        assert.ok(plan.records.some((r) => r.entity === 'EventOrderLine' && r.extends === `${o.OrderNumber}#1` && ['Attended', 'No Show'].includes(r.fields.AttendanceStatus)));
    }
    // The new member's person, profile and address hang together
    const person = plan.records.find((r) => r.entity === 'Person');
    assert.equal(person.fields.Email, 'renata.vasquezhale.100004@' + person.fields.Email.split('@')[1]);
    const link = plan.records.find((r) => r.entity === 'AddressLink');
    assert.deepEqual(link.fields.RecordID, { ref: person.ref });
    assert.equal(plan.records.find((r) => r.entity === 'Address').fields.StateProvince, 'WI');
    assert.ok(plan.records.every((r) => !('OrderLineID' in r.fields)));
});
