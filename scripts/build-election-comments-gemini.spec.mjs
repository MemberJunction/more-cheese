import { test } from 'node:test';
import assert from 'node:assert/strict';
import { check, markOf, slots } from './build-election-comments-gemini.mjs';

const brief = {
    ballot: 'ICF-STD-900 Test v1.0 — Ballot',
    items: [{ index: 0, name: '§2 Bulk-tank testing' }, { index: 1, name: 'Amendment 1: small herds' }],
    comments: [
        { id: 'a', item: 0, stance: 'Disapprove', type: 'Technical', writer: { business: 'Fallowfen Cheese' }, disposition: 'Rejected' },
        { id: 'b', item: 1, stance: 'Approve', type: 'Editorial', writer: { business: 'Nornbrook Cheesemonger' }, disposition: 'Accepted' },
    ],
};
const words = (n) => Array.from({ length: n }, (_, i) => `w${i}`).join(' ');
const good = () => [
    { id: 'a', reference: '§2.1', comment: `Weekly testing ${words(25)}`, proposedChange: 'Test every second week.', response: 'The committee keeps the weekly rule unchanged because counts drift fast.' },
    { id: 'b', reference: 'Amendment 1, first line', comment: `The heading ${words(25)}`, proposedChange: 'Write "herds under 40 head".', response: 'The committee makes the change as proposed in the published text.' },
];

test('markOf: the section mark an item\'s reference starts with', () => {
    assert.equal(markOf('§2 Bulk-tank testing'), '§2');
    assert.equal(markOf('§A2 Aging periods'), '§A2');
    assert.equal(markOf('Amendment 1: small herds'), 'Amendment 1');
});

test('slots: every comment on a ballot, with its writer, item and stance', () => {
    const e = { ballots: [{ person: 'P1', contests: [{ option: 'Disapprove', comment: { key: 'k1' } }, { abstain: true }] }, { person: 'P2', contests: [{ option: 'Approve' }, { option: 'Approve', comment: { key: 'k2' } }] }] };
    assert.deepEqual(slots(e).map((s) => [s.person, s.item, s.stance, s.comment.key]), [['P1', 0, 'Disapprove', 'k1'], ['P2', 1, 'Approve', 'k2']]);
});

test('check: a clean entry per comment passes; a missing one or the wrong clause does not', () => {
    assert.deepEqual(check(good(), brief), []);
    assert.match(check(good().slice(0, 1), brief).join(), /no entry for b/);
    const wrong = good(); wrong[0].reference = '§3';
    assert.match(check(wrong, brief).join(), /must start with §2/);
});

test('check: the response matches its disposition, an editorial asks for a change, nobody else is named', () => {
    const accepted = good(); accepted[0].response = 'The committee accepted the change and has revised the text.';
    assert.match(check(accepted, brief).join(), /contradicts Rejected/);
    const retain = good(); retain[1].proposedChange = 'Retain the text as drafted.';
    assert.match(check(retain, brief).join(), /must ask for a change/);
    const named = good(); named[0].comment += ' Unlike Nornbrook Cheesemonger, we test weekly.';
    assert.match(check(named, brief).join(), /names another business/);
    const agency = good(); agency[0].comment += ' The FDA says otherwise.';
    assert.match(check(agency, brief).join(), /agency or regulation/);
    const short = good(); short[0].comment = 'Too short.';
    assert.match(check(short, brief).join(), /words/);
});
