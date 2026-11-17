/**
 * scripts/close-reported-action-items.mjs — close committee action items once the owner has reported back
 *
 * Every committee action item reads "Action item recorded at the <Committee> meeting on <date>. …
 * Owner reports back at the next scheduled meeting." The July generator left 44 of them Open or
 * InProgress for years (due 2015–2026), so a space's Work tab, and the space agent asked "what's
 * open?", listed work a decade overdue.
 *
 * ── RULE — the next held meeting closes it ──
 * An Open or InProgress action item is closed when its committee has held a meeting (Status
 * Completed) after the item's DueAt: that is the meeting the owner reported back at. One with no
 * held meeting after its due date stays as it is. The rule reads only the meetings, not today's
 * date, so a later month can close an item going forward but never reopens or re-dates one.
 *
 * ── The closed item ──
 * Status Completed, PercentComplete 100. CompletedAt falls from a week before DueAt to ten days
 * after it, before the reporting meeting and after StartedAt. An item never started gets a
 * StartedAt two to ten days after the meeting that recorded it. HoursActual is HoursEstimated times
 * 0.6–1.5. Every offset comes from a hash of the task ID, so a rerun changes nothing.
 *
 * Tasks that are not committee action items (renewal outreach, staff work) are never touched, and no
 * record is added, dropped or re-keyed.
 */
import crypto from 'node:crypto';

const ACTION_ITEM = /^Action item recorded at the (.+?) meeting on (\d{4}-\d{2}-\d{2})\b/;
const OPEN = new Set(['Open', 'InProgress']);
const DAY = 24 * 60 * 60 * 1000;
const HOUR = 60 * 60 * 1000;

// A number in [0, 1) from the task ID and a salt: the same task always gets the same offsets.
function unit(id, salt) {
    return crypto.createHash('sha256').update(`${id}:${salt}`).digest().readUInt32BE(0) / 2 ** 32;
}
const iso = (ms) => new Date(Math.floor(ms / 60000) * 60000).toISOString().replace('.000Z', 'Z');

/**
 * Close every committee action item a later held meeting reported on, in place.
 * @param {{ tasks: object[], meetings: object[], committees: object[] }} tree generated/ rows
 * @returns {{ actionItems: number, closed: number, stillOpen: number }}
 */
export function closeReportedActionItems({ tasks, meetings, committees }) {
    const committeeId = new Map(committees.map((c) => [c.fields.Name, c.primaryKey.ID]));
    const heldBy = new Map();
    for (const m of meetings) {
        if (m.fields.Status !== 'Completed') continue;
        const list = heldBy.get(m.fields.CommitteeID) ?? [];
        list.push(Date.parse(m.fields.StartDateTime));
        heldBy.set(m.fields.CommitteeID, list);
    }
    for (const list of heldBy.values()) list.sort((a, b) => a - b);

    const stats = { actionItems: 0, closed: 0, stillOpen: 0 };
    for (const task of tasks) {
        const f = task.fields;
        const match = ACTION_ITEM.exec(f.Description ?? '');
        if (!match) continue;
        stats.actionItems++;
        if (!OPEN.has(f.Status)) continue;
        const id = committeeId.get(match[1]);
        if (!id) throw new Error(`action item ${task.primaryKey.ID} names an unknown committee: ${match[1]}`);
        const due = Date.parse(f.DueAt);
        const reported = (heldBy.get(id) ?? []).find((t) => t > due);
        if (reported === undefined) { stats.stillOpen++; continue; }

        const key = task.primaryKey.ID;
        const recorded = Date.parse(`${match[2]}T00:00:00Z`);
        const started = f.StartedAt ? Date.parse(f.StartedAt) : recorded + (2 + 8 * unit(key, 'started')) * DAY + 9 * HOUR;
        let completed = due + (-7 + 17 * unit(key, 'completed')) * DAY;
        completed = Math.min(completed, reported - HOUR);
        completed = Math.max(completed, started + HOUR);

        f.Status = 'Completed';
        f.PercentComplete = 100;
        f.StartedAt = iso(started);
        f.CompletedAt = iso(completed);
        if (f.HoursEstimated != null) f.HoursActual = Math.max(1, Math.round(f.HoursEstimated * (0.6 + 0.9 * unit(key, 'hours'))));
        stats.closed++;
    }
    return stats;
}
