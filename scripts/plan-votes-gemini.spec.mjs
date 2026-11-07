/**
 * Specs for plan-votes-gemini.mjs — what a month's new votes must look like and how they go into the catalogs. No
 * Gemini call: the checks, the catalog writers and the brief are pure, and the CLI is exercised only up to its refusals.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { check, entries, appendPolls, appendEvotes, pollSpaces, brief, monthEnd, POLLS_FILE, EVOTES_FILE } from './plan-votes-gemini.mjs';

const SCRIPT = path.join(path.dirname(fileURLToPath(import.meta.url)), 'plan-votes-gemini.mjs');

const B = {
    month: '2026-11', firstDay: '2026-11-01', lastDay: '2026-11-30', openOneOpensBetween: ['2026-11-21', '2026-11-30'],
    spaces: [{ key: 'chapter-dach', name: 'DACH Chapter', kind: 'chapter', description: 'd', latestChat: ['Lukas says the Zurich room is booked.'] }],
    committees: [{ name: 'Food Safety Committee', mission: 'm' }],
};
const TEXT = 'The chapter would hold its winter tasting online so members across the region can join without the trip, at the cost of tasting together in one room.';
const poll = (over = {}) => ({ kind: 'poll', space: 'chapter-dach', committee: '', opens: '2026-11-23', closes: '2026-12-02', certified: '', name: 'DACH Chapter poll: an online winter tasting',
    question: 'Hold the winter tasting online?', text: TEXT, yes: 0.7, fail: false, turnout: 0, ...over });
const evote = (over = {}) => ({ kind: 'evote', space: '', committee: 'Food Safety Committee', opens: '2026-11-09', closes: '2026-11-16', certified: '2026-11-18',
    name: 'Endorse the recall drill guide (Food Safety, electronic vote)', question: 'Endorse it?',
    text: `Motion: that the Food Safety Committee endorse the recall drill guide for members. ${TEXT}`, yes: 0.8, fail: false, turnout: 0.9, ...over });

test('check: one vote open at the month end plus one inside the month passes', () => {
    assert.deepEqual(check([poll(), evote()], B), []);
    assert.deepEqual(check([poll()], B), []);
});

test('check: the month needs exactly one vote still open on its last day, opened in its last ten days', () => {
    assert.match(check([evote()], B).join(), /exactly one vote must still be open on 2026-11-30 \(got 0\)/);
    assert.match(check([poll(), poll({ name: 'DACH Chapter poll: another' })], B).join(), /got 2/);
    assert.match(check([poll({ opens: '2026-11-12', closes: '2026-12-02' })], B).join(), /must open between 2026-11-21 and 2026-11-30/);
    assert.match(check([poll({ closes: '2026-12-15' })], B).join(), /runs 22 days; make it 5 to 14/);
    assert.match(check([poll(), evote({ opens: '2026-10-30' })], B).join(), /opens 2026-10-30, outside/);
    assert.match(check([], B).join(), /one or two votes/);
});

test('check: a poll names its space and asks one Yes/No question; an e-vote is a motion of a committee in the brief', () => {
    assert.match(check([poll({ space: 'chapter-mars' })], B).join(), /space "chapter-mars" is not one of the brief's spaces/);
    assert.match(check([poll({ name: 'Online winter tasting' })], B).join(), /name it "DACH Chapter poll: <short topic>"/);
    assert.match(check([poll({ question: '' })], B).join(), /needs a "question" field/);
    assert.match(check([poll({ question: 'Online or in Zurich?' })], B).join(), /offers a choice/);
    assert.match(check([poll(), evote({ committee: 'Cheese Committee' })], B).join(), /not one of the brief's committees/);
    assert.match(check([poll(), evote({ text: TEXT })], B).join(), /must begin "Motion: that the Food Safety Committee"/);
    assert.match(check([poll(), evote({ certified: '2026-11-25' })], B).join(), /certified must be 1 to 3 days after it closes/);
});

test('check: the share must clearly pass or fail, and say which', () => {
    assert.match(check([poll({ yes: 0.5 })], B).join(), /outside 0.42–0.58/);
    assert.match(check([poll({ yes: 0.3 })], B).join(), /fail must be true/);
    assert.deepEqual(check([poll({ yes: 0.3, fail: true })], B), []);
});

test('check: no people, invented events, background wording, British spelling or repeated names', () => {
    const names = new Set(['Anna Weber']);
    const firstNamesOf = new Set(['Lukas', 'Anna']);
    assert.match(check([poll({ text: `${TEXT} Anna Weber offered her barn.` })], B, { names }).join(), /names a person \(Anna Weber\)/);
    assert.match(check([poll({ text: `${TEXT} Lukas can host.` })], B, { firstNamesOf }).join(), /names a member \(Lukas\)/);
    assert.match(check([poll({ text: `${TEXT} A winter gala follows.` })], B).join(), /invents an event \("gala"\)/);
    assert.match(check([poll({ text: `${TEXT} Costs are in stabilization.` })], B).join(), /names the background/);
    assert.match(check([poll({ text: `${TEXT} The programme stays.` })], B).join(), /use US spelling/);
    assert.match(check([poll()], B, { taken: new Set(['dach chapter poll: an online winter tasting']) }).join(), /already has this name/);
});

test('entries: keyed by space or committee and month, in each catalog\'s own fields, never reusing a key', () => {
    const [p, e] = entries([poll({ yes: 0.3, fail: true }), evote()], '2026-11', new Set(['poll-dach-2026-11']));
    assert.deepEqual(p, { kind: 'poll', entry: { key: 'poll-dach-2026-11-2', space: 'chapter-dach', opens: '2026-11-23', closes: '2026-12-02',
        name: 'DACH Chapter poll: an online winter tasting', question: 'Hold the winter tasting online?', text: TEXT, yes: 0.3, fail: true } });
    assert.equal(e.entry.key, 'evote-food-safety-2026-11');
    assert.deepEqual(Object.keys(e.entry), ['key', 'committee', 'opens', 'closes', 'certified', 'name', 'text', 'turnout', 'yes']);
});

test('appendPolls and appendEvotes: the catalogs stay valid JSON, with the new votes last and the rest untouched', () => {
    const polls = '{\n  "about": "a",\n  "polls": [\n    { "key": "poll-a", "space": "s", "opens": "2020-01-01", "closes": "2020-01-05",\n      "name": "n",\n      "question": "q?",\n      "text": "t",\n      "yes": 0.8 }\n  ]\n}\n';
    const [p] = entries([poll()], '2026-11');
    const out = appendPolls(polls, [p.entry]);
    assert.ok(out.startsWith(polls.slice(0, polls.lastIndexOf('\n  ]'))));
    assert.deepEqual(JSON.parse(out).polls.map((x) => x.key), ['poll-a', 'poll-dach-2026-11']);
    assert.deepEqual(JSON.parse(out).polls[1], p.entry);
    assert.equal(appendPolls(polls, []), polls);
    const evotes = JSON.stringify({ about: 'a', votes: [{ key: 'evote-x' }] }, null, 2) + '\n';
    const [, e] = entries([poll(), evote()], '2026-11');
    assert.deepEqual(JSON.parse(appendEvotes(evotes, [e.entry])).votes.map((x) => x.key), ['evote-x', 'evote-food-safety-2026-11']);
});

test('pollSpaces: chapters and work groups open the whole stretch; never committee or staff spaces', () => {
    const s = (key, over = {}) => ({ key, anchors: [], startedAt: '2020-01-01', closedAt: null, ...over });
    const spaces = [s('chapter-dach'), s('committee-x', { anchors: [{ entity: 'Committees: Committees' }] }), s('staff', { staff: true }),
        s('closed', { closedAt: '2026-11-10' }), s('closing', { plannedCloseAt: '2026-12-01' }), s('new', { startedAt: '2026-11-15' })];
    assert.deepEqual(pollSpaces(spaces, '2026-11-01', '2026-12-14').map((x) => x.key), ['chapter-dach']);
});

/** A repo root with what brief() and the CLI read: a spaces plan, a chat, the catalogs, one committee, the blog. */
function root({ asOf = '2026-11-30', evoteKey = 'evote-food-safety-2026-10' } = {}) {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'plan-votes-'));
    const put = (rel, body) => { fs.mkdirSync(path.dirname(path.join(dir, rel)), { recursive: true }); fs.writeFileSync(path.join(dir, rel), typeof body === 'string' ? body : JSON.stringify(body)); };
    put('generated/checkpoint.json', { continuity: { asOfDate: asOf } });
    put('generated/committees/.committees.json', [{ fields: { Name: 'Food Safety Committee', MissionStatement: 'Safe cheese.' } }]);
    put('data/spaces/spaces.plan.json', { spaces: [{ key: 'chapter-dach', name: 'DACH Chapter', type: 'community', description: 'd', anchors: [], startedAt: '2019-01-01' }] });
    put('data/spaces/chats/chapter-dach.json', { messages: [1, 2, 3, 4].map((n) => ({ text: `m${n}` })) });
    put(POLLS_FILE, { polls: [{ key: 'poll-dach-2025', name: 'Old poll', opens: '2023-01-02' }, { key: 'poll-dach-2026', name: 'Recent poll', opens: '2026-09-14' }] });
    put(EVOTES_FILE, { votes: [{ key: evoteKey, name: 'Recent e-vote', opens: '2026-10-28' }] });
    put('content/blog/2026/2026-11-02-a-post.md', '---\ntitle: "A November post"\ndate: 2026-11-02\n---\n');
    put('content/blog/2026/2026-10-30-older.md', '---\ntitle: "An October post"\n---\n');
    return dir;
}

test('brief: the month\'s window, blog titles, open spaces with their latest chat, committees and the last two years of votes', () => {
    const b = brief(root(), '2026-11');
    assert.equal(monthEnd('2026-02'), '2026-02-28');
    assert.deepEqual([b.firstDay, b.lastDay, b.openOneOpensBetween], ['2026-11-01', '2026-11-30', ['2026-11-21', '2026-11-30']]);
    assert.deepEqual(b.news, ['A November post']);
    assert.deepEqual(b.spaces, [{ key: 'chapter-dach', name: 'DACH Chapter', kind: 'chapter', description: 'd', latestChat: ['m2', 'm3', 'm4'] }]);
    assert.deepEqual(b.committees, [{ name: 'Food Safety Committee', mission: 'Safe cheese.' }]);
    assert.deepEqual(b.recentVotes.map((v) => v.name), ['Recent poll', 'Recent e-vote']);
});

test('CLI: refuses a bad month, a month the data has not reached, and a month already planned', () => {
    const run = (dir, ...a) => spawnSync(process.execPath, [SCRIPT, ...a], { cwd: dir, encoding: 'utf8', env: { ...process.env, GEMINI_API_KEY: '', AI_VENDOR_API_KEY__GeminiLLM: '' } });
    const r1 = run(root(), '--month', 'November');
    assert.equal(r1.status, 1);
    assert.match(r1.stderr, /usage/);
    const r2 = run(root({ asOf: '2026-10-31' }), '--month', '2026-11');
    assert.equal(r2.status, 1);
    assert.match(r2.stderr, /the data ends 2026-10-31, not 2026-11-30/);
    const r3 = run(root({ evoteKey: 'evote-food-safety-2026-11' }), '--month', '2026-11');
    assert.equal(r3.status, 1);
    assert.match(r3.stderr, /2026-11 already has votes/);
    const r4 = run(root(), '--month', '2026-11', '--dry-run');
    assert.equal(r4.status, 0);
    assert.equal(JSON.parse(r4.stdout).month, '2026-11');
});
