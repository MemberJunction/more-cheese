/**
 * Specs for monthly-run.mjs — the dates that decide what the monthly routine does. Each case builds a
 * throwaway repo root, so none depends on the 90 MB tree; the CLI is exercised through spawnSync too.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { mondayOf, monthEnd, due, status, lastBlogMonday, lastInternalMonday, dataEnds, nextCycle, loomRef } from './monthly-run.mjs';

const SCRIPT = path.join(path.dirname(fileURLToPath(import.meta.url)), 'monthly-run.mjs');
const LOOM = '54df8fdc09cfd82ed706d8f1ec46576928ad77da';

function repo({ blog = [], internal = [], orders = [], asOf = '2026-10-31' } = {}) {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'monthly-run-'));
    const put = (rel, body) => { fs.mkdirSync(path.dirname(path.join(root, rel)), { recursive: true }); fs.writeFileSync(path.join(root, rel), body); };
    for (const d of blog) put(`content/blog/${d.slice(0, 4)}/${d}-a-post.md`, '---\ntitle: x\n---\n');
    for (const [file, week] of internal) put(`vault/internal/${file}`, file.endsWith('.csv') ? `# title: x\n# week_of: ${week}\n` : `---\nweek_of: ${week}\n---\n`);
    put('generated/orders/.orders.part-01.json', JSON.stringify(orders.map(([d, s]) => ({ fields: { OrderDate: `${d}T00:00:00`, Status: s } }))));
    put('generated/checkpoint.json', JSON.stringify({ continuity: { asOfDate: asOf } }));
    put('.github/workflows/changes.yml', `      - uses: actions/checkout@v4\n        with:\n          repository: MemberJunction/loom\n          ref: ${LOOM}\n          path: loom\n`);
    return root;
}

test('dates: Monday of a week and the last day of a month', () => {
    assert.equal(mondayOf('2026-10-23'), '2026-10-19');
    assert.equal(mondayOf('2026-10-19'), '2026-10-19');
    assert.equal(mondayOf('2026-10-25'), '2026-10-19');
    assert.equal(monthEnd('2026-02'), '2026-02-28');
    assert.equal(monthEnd('2028-02'), '2028-02-29');
});

test('reads the newest blog week, internal week (front matter or CSV header), data end and next cycle', () => {
    const root = repo({
        blog: ['2026-10-19', '2026-10-23', '2026-10-21'],
        internal: [['memos/2026/2026-10-05-a.md', '2026-10-05'], ['spreadsheets/2026/2026-10-18-b.csv', '2026-10-12']],
        orders: [['2026-10-30', 'Confirmed'], ['2026-11-02', 'Draft']],
    });
    assert.equal(lastBlogMonday(root), '2026-10-19');
    assert.equal(lastInternalMonday(root), '2026-10-12');
    assert.equal(dataEnds(root), '2026-10-30', 'drafts do not move the data end');
    assert.equal(nextCycle(root), '2026-11');
    assert.equal(loomRef(root), LOOM);
});

test('nothing to read yet: an empty repo owes no blog or internal weeks', () => {
    const root = repo();
    assert.equal(lastBlogMonday(root), null);
    assert.equal(lastInternalMonday(root), null);
    assert.equal(dataEnds(root), null);
    const s = status(root, '2026-12-01');
    assert.deepEqual(s.blog.weeks, []);
    assert.deepEqual(s.internal.weeks, []);
});

test('a blog week is due only after its Sunday; a cycle only after its month ends', () => {
    const base = { lastBlog: '2026-10-19', lastInternal: '2026-10-12', dataEnd: '2026-10-31', cycle: '2026-11' };
    const early = due({ ...base, today: '2026-10-28' });
    assert.deepEqual(early.blog.weeks, [], 'the week of Oct 26 runs to Nov 1');
    assert.deepEqual(early.plan.cycles, []);
    assert.match(early.plan.note, /no cycle is due before 2026-12-01/);
    const lastDay = due({ ...base, today: '2026-11-30' });
    assert.deepEqual(lastDay.plan.cycles, [], 'not on the last day of the month itself');
    const dec1 = due({ ...base, today: '2026-12-01' });
    assert.deepEqual(dec1.blog.weeks, ['2026-10-26', '2026-11-02', '2026-11-09', '2026-11-16', '2026-11-23']);
    assert.equal(dec1.blog.through, '2026-11-29');
    assert.deepEqual(dec1.plan.cycles, ['2026-11']);
});

test('a missed month is owed too, oldest first', () => {
    const s = due({ today: '2027-01-02', lastBlog: '2026-10-19', lastInternal: '2026-10-12', dataEnd: '2026-10-31', cycle: '2026-11' });
    assert.deepEqual(s.plan.cycles, ['2026-11', '2026-12']);
});

test('internal weeks stop at the data end, whatever today is', () => {
    const s = due({ today: '2026-12-01', lastBlog: '2026-10-19', lastInternal: '2026-09-28', dataEnd: '2026-10-31', cycle: '2026-11' });
    assert.deepEqual(s.internal.weeks, ['2026-10-05', '2026-10-12', '2026-10-19'], 'the week of Oct 26 ends Nov 1, after the data');
    assert.throws(() => due({ ...s, today: '12/01/2026', lastBlog: null, lastInternal: null, dataEnd: null, cycle: '2026-11' }), /YYYY-MM-DD/);
});

test('CLI: status as JSON and text, loom-ref, and a usage error', () => {
    const root = repo({ blog: ['2026-10-23'], internal: [['memos/2026/x.md', '2026-10-19']], orders: [['2026-10-31', 'Confirmed']] });
    const run = (...args) => spawnSync(process.execPath, [SCRIPT, ...args], { cwd: root, encoding: 'utf8' });
    const json = run('status', '--today', '2026-12-01', '--json');
    assert.equal(json.status, 0, json.stderr);
    assert.deepEqual(JSON.parse(json.stdout).plan.cycles, ['2026-11']);
    const text = run('status', '--today', '2026-10-28');
    assert.equal(text.status, 0);
    assert.match(text.stdout, /2\. plan\s+next cycle 2026-11; due: none/);
    assert.equal(run('loom-ref').stdout.trim(), LOOM);
    assert.equal(run('bogus').status, 2);
});
