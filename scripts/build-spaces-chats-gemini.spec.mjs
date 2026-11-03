/**
 * Specs for build-spaces-chats-gemini.mjs — who may post, how many messages a space gets, and what the reply check
 * refuses. No model is called.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { posters, messageCount, check } from './build-spaces-chats-gemini.mjs';

const PRESENTER = 'demo.user@morecheese.org';
const seat = (n, role = 'member', status = 'Active') => ({ user: `p${n}@x.example`, person: `P${n}`, role, status });
const space = (over = {}) => ({
    key: 's', type: 'working-group', parent: null, startedAt: '2025-01-01', closedAt: null, anchors: [],
    seats: [seat(1, 'owner'), seat(2, 'admin'), seat(3), seat(4), seat(5), seat(6, 'guest'), seat(7, 'member', 'Invited'), seat(8, 'member', 'Removed'),
        { user: PRESENTER, role: 'admin', status: 'Active' }],
    ...over,
});
const plan = { asOf: '2026-10-31', presenter: PRESENTER };
const msg = (n, date, text = `Message number ${n}.`) => ({ author: `p${(n % 5) + 1}@x.example`, date, text });
const good = () => Array.from({ length: 14 }, (_, i) => msg(i, `2026-0${(i % 9) + 1}-10T10:00`, `Message number ${i} about the work.`));

test('posters: active seats only, never guests, invitations, removed seats or the presenter', () => {
    assert.deepEqual(posters(space(), PRESENTER).map((x) => x.user), ['p1@x.example', 'p2@x.example', 'p3@x.example', 'p4@x.example', 'p5@x.example']);
});

test('messageCount: sub-groups 10, closed spaces 12, chapters and committees 18, other open spaces 14', () => {
    assert.equal(messageCount(space({ parent: 'chapter-x' })), 10);
    assert.equal(messageCount(space({ closedAt: '2025-12-01' })), 12);
    assert.equal(messageCount(space({ type: 'community' })), 18);
    assert.equal(messageCount(space({ anchors: [{}] })), 18);
    assert.equal(messageCount(space()), 14);
});

test('check: a clean chat passes', () => {
    assert.deepEqual(check(good(), space(), plan), []);
});

test('check: refuses strangers, the presenter, dates outside the space, long or styled text, file claims and repeats', () => {
    const bad = good();
    bad[0] = { ...bad[0], author: 'p6@x.example' };
    bad[1] = { ...bad[1], author: PRESENTER };
    bad[2] = { ...bad[2], date: '2024-12-31T10:00' };
    bad[3] = { ...bad[3], date: '2026-11-02T10:00' };
    bad[4] = { ...bad[4], text: 'x'.repeat(601) };
    bad[5] = { ...bad[5], text: 'See https://example.org for **details**' };
    bad[6] = { ...bad[6], text: 'I attached the draft.' };
    bad[7] = { ...bad[7], text: bad[8].text };
    const problems = check(bad, space(), plan).join('\n');
    assert.match(problems, /message 1: author p6@x.example is not on the roster/);
    assert.match(problems, /message 2: author demo.user@morecheese.org is not on the roster/);
    assert.match(problems, /message 3: date .* outside/);
    assert.match(problems, /message 4: date .* outside/);
    assert.match(problems, /message 5: 601 characters/);
    assert.match(problems, /message 6: links, hashtags/);
    assert.match(problems, /message 7: mentions an attached or uploaded file/);
    assert.match(problems, /message 9: repeats an earlier message/);
});

test('check: a closed space ends on its close date; too few messages or authors fail', () => {
    const closed = space({ closedAt: '2025-06-30' });
    assert.match(check(good(), closed, plan).join('\n'), /outside 2025-01-01\.\.2025-06-30/);
    assert.match(check(good().slice(0, 3), space(), plan).join('\n'), /too few messages/);
    const oneVoice = good().map((m) => ({ ...m, author: 'p1@x.example' }));
    assert.match(check(oneVoice, space(), plan).join('\n'), /fewer than five different authors/);
});
