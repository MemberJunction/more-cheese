import { test } from 'node:test';
import assert from 'node:assert/strict';
import { check } from './build-election-statements-gemini.mjs';

const brief = {
    election: 'ICF Board of Directors Election 2024',
    candidates: [
        { id: 'A', name: 'Gwen Whitfield' },
        { id: 'B', name: 'Esteban Neves' },
    ],
};
const words = (n, lead = 'I have') => `${lead} ${Array.from({ length: n - 2 }, (_, i) => `word${i}`).join(' ')}`;

test('statements: one per candidate, first person, the right length, each opening its own way', () => {
    assert.deepEqual(check([{ person: 'A', statement: words(90) }, { person: 'B', statement: words(90, 'My work') }], brief), []);
    assert.match(check([{ person: 'A', statement: words(90) }], brief).join(), /no statement for B/);
    assert.match(check([{ person: 'A', statement: words(30) }, { person: 'B', statement: words(90, 'My work') }], brief).join(), /30 words/);
    assert.match(check([{ person: 'A', statement: words(90, 'Gwen has') }, { person: 'B', statement: words(90, 'My work') }], brief).join(), /first person/);
    assert.match(check([{ person: 'A', statement: words(90) }, { person: 'B', statement: words(90) }], brief).join(), /opens like another/);
});

test('statements: no other candidate, no named background, no invented event, no links', () => {
    const with_ = (extra) => [{ person: 'A', statement: `${words(80)} ${extra}` }, { person: 'B', statement: words(90, 'My work') }];
    assert.match(check(with_('unlike Neves'), brief).join(), /names another candidate \(Esteban Neves\)/);
    assert.match(check(with_('in the artisan boom'), brief).join(), /names the background/);
    assert.match(check(with_('at the autumn gala'), brief).join(), /invents an event/);
    assert.match(check(with_('see www.example.org'), brief).join(), /link/);
});
