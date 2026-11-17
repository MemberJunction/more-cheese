/**
 * Specs for build-spaces-chats-gemini.mjs — who may post, how many messages a space gets, and what the reply check
 * refuses. No model is called.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { posters, messageCount, check, workQueue } from './build-spaces-chats-gemini.mjs';

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
    assert.equal(messageCount(space({ type: 'team', staff: true, parent: 'staff' })), 16);
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

const staffSpace = () => space({
    type: 'team', staff: true,
    seats: ['a', 'b', 'c'].map((k, i) => ({ user: `${k}@morecheese.example`, staff: k, role: i ? 'member' : 'owner', status: 'Active' }))
        .concat({ user: PRESENTER, role: 'admin', status: 'Active' }),
});

test('staff teams: staff seats post, the presenter does not; three authors are enough for three staff', () => {
    assert.deepEqual(posters(staffSpace(), PRESENTER).map((x) => x.staff), ['a', 'b', 'c']);
    const chat = good().map((m, i) => ({ ...m, author: `${'abc'[i % 3]}@morecheese.example` }));
    assert.deepEqual(check(chat, staffSpace(), plan), []);
});

test('staff teams: naming a member fails there, and only there', () => {
    const names = new Set(['Marcus Chen']);
    const chat = good().map((m, i) => ({ ...m, author: `${'abc'[i % 3]}@morecheese.example` }));
    chat[2] = { ...chat[2], text: 'Marcus Chen still has not renewed.' };
    assert.match(check(chat, staffSpace(), plan, names).join('\n'), /message 3: names the member Marcus Chen/);
    const memberChat = good();
    memberChat[2] = { ...memberChat[2], text: 'Marcus Chen brought samples.' };
    assert.deepEqual(check(memberChat, space(), plan, names), []);
});

test('workQueue: counts, kinds and the due range, never the member names in task titles', () => {
    const q = workQueue([
        { Name: 'Renewal outreach — Marcus Chen (ICF-000102)', DueAt: '2026-08-21T11:53:00Z', Status: 'Open' },
        { Name: 'Renewal outreach — Alessia Gallo (ICF-100064)', DueAt: '2026-08-07T17:31:00Z', Status: 'InProgress' },
    ]);
    assert.deepEqual(q, { kinds: ['Renewal outreach'], count: 2, dueFrom: '2026-08-07', dueTo: '2026-08-21', mentionFrom: '2026-07-08', byStatus: { Open: 1, InProgress: 1 } });
    assert.ok(!JSON.stringify(q).includes('Marcus'));
    assert.equal(workQueue([]), null);
});

test('check: era wording, a board chair, invented events; staff naming themselves or the queue too early', () => {
    const bad = good();
    bad[0] = { ...bad[0], text: 'Great to see the artisan boom in full swing.' };
    bad[1] = { ...bad[1], text: 'The board chair wants it by Friday.' };
    bad[2] = { ...bad[2], text: 'Venue options for the autumn summit are in.' };
    bad[3] = { ...bad[3], text: 'Prices are up across the board.' };
    const problems = check(bad, space(), plan).join('\n');
    assert.match(problems, /message 1: quotes era wording \("artisan boom"\)/);
    assert.match(problems, /message 2: says who chairs the board/);
    assert.match(problems, /message 3: invents an event \("summit"\)/);
    assert.doesNotMatch(problems, /message 4/);
    const staffPlan = { ...plan, staff: [{ key: 'a', user: 'a@morecheese.example', name: 'Ana Staff' }] };
    const chat = good().map((m, i) => ({ ...m, author: `${'abc'[i % 3]}@morecheese.example` }));
    chat[0] = { ...chat[0], text: 'Ana, let me know if you need the numbers.' };
    chat[3] = { ...chat[3], date: '2026-06-01T10:00', text: 'Fifty outreach tasks are due this month.' };
    const staffProblems = check(chat, staffSpace(), staffPlan, new Set(), { mentionFrom: '2026-07-08' }).join('\n');
    assert.match(staffProblems, /message 1: Ana addresses or names themselves/);
    assert.match(staffProblems, /talks about the outreach queue before 2026-07-08/);
});
