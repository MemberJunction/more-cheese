/**
 * Spec for the committee action items pass.
 *
 * The July generator left 44 committee action items Open or InProgress for years, so a space's Work
 * tab and the space agent listed work a decade overdue. The pass closes an item at the first meeting
 * its committee held after the item's due date, where the owner reported back.
 *
 * The fixture cases cover the rule; the last case reads the committed `generated/` tree, so a
 * regeneration that drops the pass fails here, not in a demo.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { closeReportedActionItems } from './close-reported-action-items.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const GENERATED = path.join(HERE, '..', 'generated');

const committees = [{ fields: { Name: 'Food Safety Committee' }, primaryKey: { ID: 'C1' } }];
const meeting = (StartDateTime, Status = 'Completed', CommitteeID = 'C1') => ({ fields: { CommitteeID, StartDateTime, Status } });
const item = (ID, fields) => ({
    fields: {
        Name: 'Draft the recall checklist (Food Safety)',
        Description: 'Action item recorded at the Food Safety Committee meeting on 2025-02-01. Draft the recall checklist. Owner reports back at the next scheduled meeting.',
        Status: 'Open', DueAt: '2025-03-01T09:00:00Z', StartedAt: null, CompletedAt: null, PercentComplete: 0, HoursEstimated: 4, HoursActual: null,
        ...fields,
    },
    primaryKey: { ID },
});

test('an item is closed at the first meeting held after its due date', () => {
    const tasks = [item('T1'), item('T2', { Status: 'InProgress', StartedAt: '2025-02-10T10:00:00Z', PercentComplete: 40 })];
    const stats = closeReportedActionItems({ tasks, committees, meetings: [meeting('2025-01-15T17:00:00Z'), meeting('2025-04-12T17:00:00Z')] });
    assert.deepEqual(stats, { actionItems: 2, closed: 2, stillOpen: 0 });
    for (const { fields: f } of tasks) {
        assert.equal(f.Status, 'Completed');
        assert.equal(f.PercentComplete, 100);
        assert.ok(f.CompletedAt > f.StartedAt, 'completed after it started');
        assert.ok(f.CompletedAt < '2025-04-12T17:00:00Z', 'completed before the meeting that heard it');
        assert.ok(f.StartedAt > '2025-02-01', 'started after the meeting that recorded it');
        assert.ok(f.HoursActual >= 1);
    }
    assert.equal(tasks[1].fields.StartedAt, '2025-02-10T10:00:00Z', 'a started item keeps its start');
});

test('an item with no meeting held after its due date stays as it is', () => {
    const tasks = [item('T1')];
    const before = structuredClone(tasks);
    const meetings = [meeting('2025-01-15T17:00:00Z'), meeting('2025-04-12T17:00:00Z', 'Scheduled'), meeting('2025-05-01T17:00:00Z', 'Completed', 'OTHER')];
    const stats = closeReportedActionItems({ tasks, committees, meetings });
    assert.deepEqual(stats, { actionItems: 1, closed: 0, stillOpen: 1 });
    assert.deepEqual(tasks, before, 'a scheduled meeting, or another committee\'s, reports nothing');
});

test('other tasks and finished items are never touched, and a rerun changes nothing', () => {
    const outreach = { fields: { Name: 'Renewal outreach — Marcus Chen', Description: 'Call before the grace period ends.', Status: 'Open', DueAt: '2020-01-01T00:00:00Z' }, primaryKey: { ID: 'R1' } };
    const done = item('T2', { Status: 'Completed', CompletedAt: '2025-02-20T10:00:00Z', PercentComplete: 100 });
    const tasks = [outreach, done, item('T3')];
    const meetings = [meeting('2025-04-12T17:00:00Z')];
    closeReportedActionItems({ tasks, committees, meetings });
    const once = structuredClone(tasks);
    const again = closeReportedActionItems({ tasks, committees, meetings });
    assert.equal(again.closed, 0);
    assert.deepEqual(tasks, once, 'the offsets come from the task ID, so a rerun is byte-identical');
    assert.equal(tasks[0].fields.Status, 'Open', 'renewal outreach is not a committee action item');
    assert.equal(tasks[1].fields.CompletedAt, '2025-02-20T10:00:00Z');
});

test('an action item naming an unknown committee fails loudly', () => {
    const tasks = [item('T1', { Description: 'Action item recorded at the Cheese Board meeting on 2025-02-01. Owner reports back.' })];
    assert.throws(() => closeReportedActionItems({ tasks, committees, meetings: [] }), /unknown committee: Cheese Board/);
});

test('nothing to check yet: no tasks, no change', () => {
    assert.deepEqual(closeReportedActionItems({ tasks: [], committees, meetings: [] }), { actionItems: 0, closed: 0, stillOpen: 0 });
});

test('the committed tree has no action item open past a meeting that heard it', () => {
    const read = (rel) => JSON.parse(fs.readFileSync(path.join(GENERATED, rel), 'utf8'));
    const tasks = read('tasks/.tasks.json');
    const stats = closeReportedActionItems({ tasks, meetings: read('committee-meetings/.committee-meetings.json'), committees: read('committees/.committees.json') });
    assert.equal(stats.closed, 0, 'run npm run generate: the committed tasks predate the action items pass');
    assert.ok(stats.actionItems > 0);
});
