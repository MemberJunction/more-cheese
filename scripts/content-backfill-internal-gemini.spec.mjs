/**
 * Specs for the pure checks in content-backfill-internal-gemini.mjs — the ones that stand between a
 * small model's draft and vault/internal/. The model call itself is not exercised here (it needs a key
 * and the network); what is pinned down is that each check rejects the defect it was written for and
 * passes a clean bundle, so a green backfill run means the drafts were actually held to the rules.
 *
 * The defects come from the 2026-10-27 Gemini pilot: a CSV whose fiction notice said DOCUMENT instead
 * of DATA (validate-content catches that one), retired data_sources, a Monday deck quoting Tuesday's
 * conference attendance as final, and figures that appear nowhere in vault-facts.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { weekWindow, checkPath, allowedFigures, numbersIn, untraced, timeLeaks, shapeProblems, lanes, THREAD_TOPICS, BLOG_TOPIC, threadTopicIndex, topicProblems } from './content-backfill-internal-gemini.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const WIN = weekWindow('2023-07-24');
const FACTS = { currentMembersAtWeekEnd: 800, membershipPurchases: { total: 6, gross: 2494 }, orders: { gross: 8575 }, cashCaptured: 8561 };

test('weekWindow takes Mondays only', () => {
    assert.deepEqual(WIN, { start: '2023-07-24', end: '2023-07-30' });
    assert.throws(() => weekWindow('2023-07-25'), /not a Monday/);
});

test('checkPath keeps the model inside this week of vault/internal/', () => {
    assert.equal(checkPath('vault/internal/memos/2023/2023-07-28-readout.md', WIN), null);
    assert.equal(checkPath('vault/internal/email/2023/2023-07-26-thread-numbers/01-2023-07-26-0912-comms-to-events.md', WIN), null);
    assert.match(checkPath('content/blog/2023/2023-07-28-x.md', WIN), /under vault\/internal/);
    assert.match(checkPath('vault/internal/../../data/x.md', WIN), /plain path/);
    assert.match(checkPath('vault/internal/memos/2023/2023-08-01-late.md', WIN), /outside the week/);
    assert.match(checkPath('vault/internal/memos/2022/2023-07-28-readout.md', WIN), /year folder/);
    assert.match(checkPath('vault/internal/spreadsheets/2023/2023-07-30-snapshot.md', WIN), /end in \.csv/);
    assert.match(checkPath('vault/internal/notes/2023/2023-07-28-x.md', WIN), /type folder/);
    assert.match(checkPath('vault/internal/email/2023/2023-07-26-numbers.md', WIN), /email must be/);
    assert.match(checkPath('vault/internal/memos/2023/2023-07-28-heat- பெண்-review.md', WIN), /lowercase ASCII/);
    assert.match(checkPath('vault/internal/memos/2023/2023-07-28-Heat-Review.md', WIN), /lowercase ASCII/);
});

test('numbersIn skips dates, times, keys, years and small counts', () => {
    assert.deepEqual(numbersIn('On 26 July 2023 at 09:12 EVT-2023-CONF had 290 registered, two days, 12 months, $8,575 gross'), [290, 8575]);
    assert.deepEqual(numbersIn('July 25, 2023: 268 attended'), [268]);
});

test('untraced passes fact values and their sums, differences and percentages; flags inventions', () => {
    const allowed = allowedFigures([FACTS]);
    const ok = { path: 'vault/internal/memos/2023/2023-07-28-a.md', content: '---\nx: 1\n---\n800 current; 6 purchases worth $2,494; 8575 gross, 8561 cash, a 14 gap; 0.75% of members.' };
    assert.deepEqual(untraced([ok], allowed), []);
    const bad = { path: 'vault/internal/spreadsheets/2023/2023-07-30-s.csv', content: '# notice: x\n#\nmetric,value\nmembers,800\ninvented,1096\n' };
    assert.match(untraced([bad], allowed)[0], /figures not in the facts: 1096/);
});

test('allowedFigures reads numbers out of the blog text it is given', () => {
    const allowed = allowedFigures([FACTS], ['The rule requires 60 days of aging.']);
    assert.deepEqual(untraced([{ path: 'vault/internal/memos/2023/2023-07-28-a.md', content: 'Raw-milk cheese ages 60 days.' }], allowed), []);
});

test('timeLeaks rejects attendance quoted before the event, allows it after', () => {
    const ev = [{ name: 'ICF Annual Conference 2023', date: '2023-07-25', attendance: { Attended: 268, 'No Show': 22 } }];
    const before = { path: 'vault/internal/decks/2023/2023-07-24-prep.md', content: '- 268 present\n- 22 no-shows' };
    const after = { path: 'vault/internal/decks/2023/2023-07-27-recap.md', content: '- 268 present\n- 22 no-shows' };
    assert.match(timeLeaks([before], ev)[0], /before ICF Annual Conference 2023/);
    assert.deepEqual(timeLeaks([after], ev), []);
    assert.deepEqual(timeLeaks([before], [{ ...ev[0], attendance: {} }]), []);
});

test('shapeProblems: lengths, bullets, rows, banned phrases, British spelling; event names exempt', () => {
    const words = (n) => Array.from({ length: n }, () => 'word').join(' ');
    const slide = (bullets) => `## Slide\n${Array.from({ length: bullets }, () => '- point').join('\n')}`;
    const files = [
        { path: 'vault/internal/memos/2023/2023-07-28-a.md', content: `---\nt: 1\n---\n${words(200)}` },
        { path: 'vault/internal/email/2023/2023-07-26-thread-x/01-2023-07-26-0900-comms-to-events.md', content: `---\nt: 1\n---\n${words(100)}` },
        { path: 'vault/internal/decks/2023/2023-07-27-d.md', content: `---\nt: 1\n---\n${[slide(6), ...Array(5).fill(slide(2))].join('\n---\n')}` },
        { path: 'vault/internal/spreadsheets/2023/2023-07-30-s.csv', content: '# notice: x\n#\na,b\n1,2\n' },
        { path: 'vault/internal/memos/2023/2023-07-29-b.md', content: `---\nt: 1\n---\n${words(450)} We will leverage the organisation. Webinar: Allergen Labelling 2023.` },
    ];
    const out = shapeProblems(files, ['Webinar: Allergen Labelling 2023']).join('\n');
    assert.match(out, /2023-07-28-a\.md: memo body is 200 words/);
    assert.doesNotMatch(out, /01-2023-07-26/);
    assert.match(out, /slide 1 has 6 bullets/);
    assert.match(out, /1 data rows/);
    assert.match(out, /banned phrase "leverag"/);
    assert.match(out, /British spelling "organisation"/);
    assert.doesNotMatch(out, /labelling/);
    // "analyses" is the US plural of analysis (2026-10-27 run 2 rejected 2022-10-24 for it); "analyse" is British
    const memo = (t) => ({ path: 'vault/internal/memos/2023/2023-07-28-d.md', content: `---\nt: 1\n---\n${words(450)} ${t}` });
    assert.deepEqual(shapeProblems([memo('association analyses show')]), []);
    assert.match(shapeProblems([memo('we will analyse it')]).join(''), /British spelling "analyse"/);
    assert.match(shapeProblems([{ path: 'vault/internal/memos/2023/2023-07-28-c.md', content: `---\nt: 1\n---\n${words(450)} Advocacy &성과 in Querétaro` }]).join('\n'), /stray non-Latin text "성과"/);
    assert.deepEqual(shapeProblems([{ path: 'vault/internal/memos/2023/2023-07-28-c.md', content: `---\nt: 1\n---\n${words(450)} Querétaro — Saint-Rémille` }]), []);
    // a divider with trailing whitespace still separates slides (2026-10-27 run: 2019-05-06 and 2023-04-10 were rejected for "8 bullets")
    const spaced = { path: 'vault/internal/decks/2023/2023-07-27-e.md', content: `---\nt: 1\n---\n${Array(6).fill(slide(4)).join('\n--- \n')}` };
    assert.deepEqual(shapeProblems([spaced]), []);
});

test('thread topics rotate week by week, and only the blog week may put the blog in the subject', () => {
    const weeks = Array.from({ length: THREAD_TOPICS.length }, (_, i) => new Date(Date.UTC(2019, 0, 7 + 7 * i)).toISOString().slice(0, 10));
    assert.equal(new Set(weeks.map(threadTopicIndex)).size, THREAD_TOPICS.length);
    const thread = [{ path: 'vault/internal/email/2023/2023-07-26-thread-x/01-2023-07-26-0900-comms-to-events.md', content: '---\nsubject: "Workshop numbers and blog alignment"\n---\n' }];
    assert.match(topicProblems(thread, 0)[0], /mentions the blog/);
    assert.deepEqual(topicProblems(thread, BLOG_TOPIC), []);
    const reply = [{ path: 'vault/internal/email/2023/2023-07-26-thread-x/02-2023-07-26-1000-events-to-comms.md', content: '---\nsubject: "Re: blog"\n---\n' }];
    assert.deepEqual(topicProblems(reply, 0), []);
    const comp = [{ path: 'vault/internal/email/2023/2023-07-26-thread-x/01-2023-07-26-0900-events-to-comms.md', content: '---\nsubject: "Competition entry deadlines and shipping logistics"\n---\n' }];
    assert.match(topicProblems(comp, 10, new Set(['competition entry deadlines and shipping logistics']))[0], /already used by another week/);
    assert.deepEqual(topicProblems(comp, 10, new Set(['something else'])), []);
});

test('lanes split weeks into contiguous, ordered runs', () => {
    assert.deepEqual(lanes(['2020-01-13', '2020-01-06', '2020-01-20', '2020-01-27', '2020-02-03'], 2), [['2020-01-06', '2020-01-13', '2020-01-20'], ['2020-01-27', '2020-02-03']]);
    assert.deepEqual(lanes(['2020-01-06'], 4), [['2020-01-06']]);
});

test('CLI refuses a non-Monday and an empty week list without calling anything', () => {
    const run = (...a) => spawnSync(process.execPath, [path.join(HERE, 'content-backfill-internal-gemini.mjs'), ...a], { cwd: path.join(HERE, '..'), encoding: 'utf8', env: { PATH: process.env.PATH } });
    assert.match(run('2023-07-25').stderr, /not a Monday/);
    assert.match(run().stderr, /give one or more Mondays/);
    assert.equal(run().status, 1);
});
