#!/usr/bin/env node
/**
 * monthly-run.mjs — what the monthly run owes on a given day, so the routine that extends More Cheese
 * (the morecheese-monthly-run skill) decides from the repo, not from its own reading of dates.
 *
 *   node scripts/monthly-run.mjs status                      # what is due today, as text
 *   node scripts/monthly-run.mjs status --today 2026-12-01 --json
 *   node scripts/monthly-run.mjs loom-ref                    # the Loom commit CI pins (changes.yml)
 *
 * Why this exists. Each month three things extend the dataset, in an order that matters:
 *
 *   1. BLOG      — three researched posts per week (morecheese-weekly-blog). A week is researched from that
 *                  week's real news, so it is only due once the week is over.
 *   2. PLAN      — the next Loom cycle (plan-month-gemini.mjs). Its brief reads the month's blog posts (the
 *                  October 2026 recall posts are why the Boise workshop sold), so it runs after the blog, and
 *                  only once the month is over: a cycle never dates records after the day it runs.
 *   3. INTERNAL  — one staff bundle per week (content-backfill-internal-gemini.mjs). It quotes the week's
 *                  facts and blog, and the internal-comms skill refuses a week ending after the last
 *                  confirmed order (vault-facts dataEnds), so it runs after the plan.
 *   4. COMMUNITY — the BizApps Community plan (data/community/community.plan.json), extended append-only
 *                  for each due cycle once its month ends (npm run community:plan).
 *
 * Getting a date wrong is silent: a blog week written before it ends invents its news, and a plan run early
 * puts orders in the future. These rules are small, but they are the routine's whole schedule, so they live
 * here with a spec rather than in a prompt.
 *
 * New here; no sibling-repo port. Never writes, never runs git.
 */
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const DAY = 86400000;
export const addDays = (iso, n) => new Date(Date.parse(`${iso}T00:00:00Z`) + n * DAY).toISOString().slice(0, 10);
export const mondayOf = (iso) => addDays(iso, -((new Date(`${iso}T00:00:00Z`).getUTCDay() + 6) % 7));
export const monthEnd = (ym) => { const [y, m] = ym.split('-').map(Number); return new Date(Date.UTC(y, m, 0)).toISOString().slice(0, 10); };
const nextMonth = (ym) => { const [y, m] = ym.split('-').map(Number); return new Date(Date.UTC(y, m, 1)).toISOString().slice(0, 7); };
const ISO = /^\d{4}-\d{2}-\d{2}$/;

// ── RULE 1 — what the repo already holds ──
const walk = (dir) => (fs.existsSync(dir) ? fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(dir, e.name)) : [path.join(dir, e.name)])) : []);

/** Monday of the newest blog post (content/blog/<year>/<YYYY-MM-DD>-<slug>.md), or null. */
export function lastBlogMonday(root) {
    const dates = walk(path.join(root, 'content', 'blog')).map((f) => path.basename(f).slice(0, 10)).filter((d) => ISO.test(d)).sort();
    return dates.length ? mondayOf(dates[dates.length - 1]) : null;
}

/** Newest week_of in vault/internal/ (front matter `week_of:`, or `# week_of:` in a CSV header), or null. */
export function lastInternalMonday(root) {
    let last = null;
    for (const f of walk(path.join(root, 'vault', 'internal'))) {
        const m = /^#?\s*week_of:\s*(\d{4}-\d{2}-\d{2})/m.exec(fs.readFileSync(f, 'utf8').slice(0, 4000));
        if (m && (!last || m[1] > last)) last = m[1];
    }
    return last;
}

/** The last confirmed order date — vault-facts' dataEnds. */
export function dataEnds(root) {
    let last = '';
    for (const f of walk(path.join(root, 'generated', 'orders')).filter((x) => x.endsWith('.json'))) {
        const rows = JSON.parse(fs.readFileSync(f, 'utf8'));
        if (!Array.isArray(rows)) continue;
        for (const r of rows) {
            const d = String(r.fields?.OrderDate ?? '').slice(0, 10);
            if (r.fields?.Status === 'Confirmed' && d > last) last = d;
        }
    }
    return last || null;
}

/** The month the next Loom cycle covers: the month after the checkpoint's as-of date. */
export function nextCycle(root) {
    const cp = JSON.parse(fs.readFileSync(path.join(root, 'generated', 'checkpoint.json'), 'utf8'));
    return nextMonth(String(cp.continuity?.asOfDate ?? cp.releaseDate).slice(0, 7));
}

/** The as-of date of data/community/community.plan.json (YYYY-MM-DD), or null if absent. */
export function communityAsOf(root) {
    const planPath = path.join(root, 'data', 'community', 'community.plan.json');
    if (!fs.existsSync(planPath)) return null;
    const plan = JSON.parse(fs.readFileSync(planPath, 'utf8'));
    const raw = plan.asOf ?? plan.continuity?.asOfDate ?? plan.through ?? null;
    if (typeof raw === 'string' && ISO.test(raw.slice(0, 10))) return raw.slice(0, 10);
    if (Array.isArray(plan.cycles) && plan.cycles.length > 0) {
        const lastYm = String(plan.cycles[plan.cycles.length - 1]).slice(0, 7);
        if (/^\d{4}-\d{2}$/.test(lastYm)) return monthEnd(lastYm);
    }
    return null;
}

/** The Loom commit changes.yml checks out, so the routine runs the planner on the Loom CI validates with. */
export function loomRef(root) {
    const yml = fs.readFileSync(path.join(root, '.github', 'workflows', 'changes.yml'), 'utf8');
    const m = /repository:\s*MemberJunction\/loom\s*\n\s*ref:\s*([0-9a-f]{40})/.exec(yml);
    if (!m) throw new Error('changes.yml pins no MemberJunction/loom ref');
    return m[1];
}

// ── RULE 2 — what is due ──
const mondaysAfter = (last, ok) => {
    const out = [];
    for (let m = addDays(last, 7); ok(m); m = addDays(m, 7)) out.push(m);
    return out;
};

/**
 * Due work for `today`, in run order. A blog week is due once it has ended (Sunday before today). Plan
 * cycles are due once their month has ended, oldest first; each needs the blog to cover its last full week
 * first. Internal weeks are due up to dataEnds, which only moves when a plan lands — so the routine asks
 * again after planning. Community cycles track data/community/community.plan.json independently so a plan
 * extension is flagged whenever a cycle month has ended past community.asOf.
 */
export function due({ today, lastBlog, lastInternal, dataEnd, cycle, communityAsOf: commAsOf = null, hasCommunityRules = false }) {
    if (!ISO.test(today)) throw new Error(`today must be YYYY-MM-DD, got ${today}`);
    const blogWeeks = lastBlog ? mondaysAfter(lastBlog, (m) => addDays(m, 6) < today) : [];
    const blogThrough = blogWeeks.length ? addDays(blogWeeks[blogWeeks.length - 1], 6) : lastBlog ? addDays(lastBlog, 6) : null;
    const cycles = [];
    for (let c = cycle; monthEnd(c) < today; c = nextMonth(c)) cycles.push(c);
    const internalWeeks = lastInternal && dataEnd ? mondaysAfter(lastInternal, (m) => addDays(m, 6) <= dataEnd) : [];

    let community;
    if (commAsOf && ISO.test(commAsOf)) {
        const commNext = nextMonth(commAsOf.slice(0, 7));
        const commCycles = [];
        for (let c = commNext; monthEnd(c) < today; c = nextMonth(c)) commCycles.push(c);
        community = {
            asOf: commAsOf,
            next: commNext,
            cycles: commCycles,
            needsExtend: commCycles.length > 0,
            note: commCycles.length ? null : `${commNext} ends ${monthEnd(commNext)}; no cycle is due before ${addDays(monthEnd(commNext), 1)}`,
        };
    } else {
        community = {
            asOf: null,
            next: null,
            cycles: [],
            needsExtend: false,
            note: hasCommunityRules
                ? 'data/community/community.plan.json not yet generated; run npm run community:plan'
                : 'no community plan present',
        };
    }

    return {
        today,
        blog: { last: lastBlog, weeks: blogWeeks, through: blogThrough },
        plan: { next: cycle, cycles, note: cycles.length ? null : `${cycle} ends ${monthEnd(cycle)}; no cycle is due before ${addDays(monthEnd(cycle), 1)}` },
        internal: { last: lastInternal, dataEnds: dataEnd, weeks: internalWeeks },
        community,
    };
}

export function status(root, today) {
    return due({
        today,
        lastBlog: lastBlogMonday(root),
        lastInternal: lastInternalMonday(root),
        dataEnd: dataEnds(root),
        cycle: nextCycle(root),
        communityAsOf: communityAsOf(root),
        hasCommunityRules: fs.existsSync(path.join(root, 'data', 'ruleset', 'community-rules.json')),
    });
}

// ── CLI ──
function main(argv) {
    const [cmd, ...rest] = argv;
    const root = process.cwd();
    if (cmd === 'loom-ref') { console.log(loomRef(root)); return 0; }
    if (cmd !== 'status') { console.error('usage: monthly-run.mjs status [--today YYYY-MM-DD] [--json] | loom-ref'); return 2; }
    const i = rest.indexOf('--today');
    const today = i >= 0 ? rest[i + 1] : new Date().toISOString().slice(0, 10);
    const s = status(root, today);
    if (rest.includes('--json')) { console.log(JSON.stringify(s, null, 2)); return 0; }
    const list = (a) => (a.length ? a.join(' ') : 'none');
    console.log(`today ${s.today}`);
    console.log(`1. blog      last week ${s.blog.last}; due: ${list(s.blog.weeks)}`);
    console.log(`2. plan      next cycle ${s.plan.next}; due: ${list(s.plan.cycles)}${s.plan.note ? ` (${s.plan.note})` : ''}`);
    console.log(`3. internal  last week ${s.internal.last}, data ends ${s.internal.dataEnds}; due now: ${list(s.internal.weeks)} (ask again after planning)`);
    console.log(`4. community as of ${s.community.asOf ?? 'none'}; next cycle ${s.community.next ?? 'none'}; due: ${list(s.community.cycles)}${s.community.note ? ` (${s.community.note})` : ''}`);
    return 0;
}

if (process.argv[1] && import.meta.url === pathToFileURL(fs.realpathSync(process.argv[1])).href) {
    process.exitCode = main(process.argv.slice(2));
}
