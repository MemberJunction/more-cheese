#!/usr/bin/env node
/**
 * plan-votes-gemini.mjs — one month's new votes for the monthly run: Yes/No polls in chapter and work-group spaces and
 * committee e-votes, appended to data/elections/polls.json and data/elections/evotes.json.
 *
 * Why it exists. The elections plan (scripts/build-elections-plan.mjs) stops at the data's as-of date, so each month's
 * data finishes the votes that were open, but every other vote comes from a hand-written catalog or a fixed calendar
 * (boards each autumn, chapters every other March). Without new entries, the first monthly run after October 2026 would
 * close the last open vote and the demo would have nothing to vote on until the 2027 board election. Amith asked for new
 * votes through the monthly generation; this is that step.
 *
 * One Gemini call per month (gemini-3.5-flash-lite, as for all bulk content) proposes one or two votes, briefed from the
 * repo only: the month's blog titles, the spaces that are open (description, the latest chat), the committees, and the
 * votes of the last two years so it repeats none. Exactly one vote opens in the month's last ten days and is still open
 * when the month ends, so the demo always has a vote in progress; any other opens and closes inside the month. Each vote
 * is checked here (dates, space or committee, wording, the share it needs to pass or fail), then the elections plan is
 * built with it, which checks the rest (enough voters, a chair to certify); problems go back to Gemini, three tries at
 * most. A month that cannot pass writes nothing.
 *
 *   node scripts/plan-votes-gemini.mjs --month 2026-11              # after that month's Loom cycle
 *   node scripts/plan-votes-gemini.mjs --month 2026-11 --dry-run    # print the brief, call nothing
 *   node scripts/plan-votes-gemini.mjs --month 2026-11 --verbose    # also print each rejected proposal
 *
 * Then rebuild the plan: node scripts/build-elections-plan.mjs. Run it after the month's Loom cycle (the data must end
 * on the month's last day) and before the plan rebuild. A month already in the catalogs is refused.
 *
 * Key: as scripts/build-election-statements-gemini.mjs (GEMINI_API_KEY, AI_VENDOR_API_KEY__GeminiLLM, GEMINI_ENV_FILE,
 * or GEMINI_KEY_FROM_PROXY=1); sent only to generativelanguage.googleapis.com, never logged. New here; no sibling-repo port.
 * Run from the repo root.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ERAS } from './build-spaces-chats-gemini.mjs';
import { apiKey, generate } from './build-election-statements-gemini.mjs';
import { buildPlan, loadWorld } from './build-elections-plan.mjs';

export const POLLS_FILE = 'data/elections/polls.json';
export const EVOTES_FILE = 'data/elections/evotes.json';
const SPACES_PLAN = 'data/spaces/spaces.plan.json';
const COMMITTEES_ENTITY = 'Committees: Committees';
const MODEL = 'gemini-3.5-flash-lite';

const SYSTEM = `You plan the new member votes for one month at the International Cheese Federation (ICF), a FICTIONAL
cheese makers' association used as demo data for MemberJunction. Everything is invented: never name a real company,
creamery, brand, person, regulator decision or product.

Propose one or two votes for the month in the brief:
- A "poll" is one Yes/No question put to a chapter's members or a work group's members in their space: a practical
  choice the space is facing (a venue, a format, a date, a fee, what a meeting covers), grounded in the space's
  description and latest chat. Name it "<space name> poll: <short topic>".
- An "evote" is a committee motion voted online between meetings because it cannot wait for the next one: grounded in
  the committee's mission and the month's news. Name it "<motion in a few words> (<committee name without
  'Committee'>, electronic vote)"; its text begins "Motion: that the <committee name> ..." and says why it is voted
  electronically.
- Exactly one vote is "the open one": it opens on one of the month's last ten days and closes five to fourteen days
  after it opens, after the month ends. Any other vote opens and closes inside the month and runs three to fourteen days.
- yes is the share of votes cast answering Yes, between 0.12 and 0.92 and not between 0.42 and 0.58. Most votes pass;
  set fail to true exactly when yes is below 0.5. An evote also gives turnout, the share of members who vote (0.6 to 1),
  and certified, a date one to three days after it closes.
- A poll's "question" is the Yes/No question itself, ending with "?", and asks one thing (never "A or B?"). text is 20
  to 70 words, plain and specific: what is being decided and the trade-off; it is not the question again.
- Never name a person, a staff member or a board member. Never invent an event: the only ICF events are the Annual
  Conference, the annual competition, webinars, courses and chapter meet-ups. No statistics, links, hashtags or emoji.
  US spelling. Never repeat a vote listed under recentVotes.

Return JSON: {"votes": [{"kind": "poll"|"evote", "space": "<space key>", "committee": "<committee name>", "opens":
"YYYY-MM-DD", "closes": "YYYY-MM-DD", "certified": "YYYY-MM-DD", "name": "...", "question": "...", "text": "...",
"yes": 0.0, "fail": false, "turnout": 0.0}]}. Every field is always present: a poll gives space and question and sets
committee and certified to "" and turnout to 0; an evote gives committee, certified and turnout, sets space to "", and
gives the motion as its question.`;

const SCHEMA = {
    type: 'OBJECT',
    properties: {
        votes: {
            type: 'ARRAY',
            items: {
                type: 'OBJECT',
                properties: {
                    kind: { type: 'STRING', enum: ['poll', 'evote'] },
                    space: { type: 'STRING' }, committee: { type: 'STRING' },
                    opens: { type: 'STRING' }, closes: { type: 'STRING' }, certified: { type: 'STRING' },
                    name: { type: 'STRING' }, question: { type: 'STRING' }, text: { type: 'STRING' },
                    yes: { type: 'NUMBER' }, fail: { type: 'BOOLEAN' }, turnout: { type: 'NUMBER' },
                },
                // Every field, or Gemini leaves out the ones a kind needs; a kind fills the others with "" or 0.
                required: ['kind', 'space', 'committee', 'opens', 'closes', 'certified', 'name', 'question', 'text', 'yes', 'fail', 'turnout'],
            },
        },
    },
    required: ['votes'],
};

const DAY = 86400000;
const addDays = (iso, n) => new Date(Date.parse(`${iso}T00:00:00Z`) + n * DAY).toISOString().slice(0, 10);
const daysBetween = (a, b) => Math.round((Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`)) / DAY);
export const monthEnd = (ym) => { const [y, m] = ym.split('-').map(Number); return new Date(Date.UTC(y, m, 0)).toISOString().slice(0, 10); };
const ISO = /^\d{4}-\d{2}-\d{2}$/;
const ERA_WORDING = /artisan boom|stabili[sz]ation|virtual pivot|capacity strain|sponsorship holds|stretched thin|pandemic shock|creamery closures/i;
const INVENTED_EVENT = /\b(summit|gala|banquet|expo|awards dinner|symposium)\b/i;
const BRITISH = /\b\w*(colour|favour|honour|organis|programme|centre|licence|cheque|catalogue|travelled|analys(e|ing))\w*\b/i;
const readJson = (root, rel) => JSON.parse(fs.readFileSync(path.join(root, rel), 'utf8'));

// ── RULE 1 — what the month can hold ──
/** Spaces a poll can run in on a day: chapters and work groups (not committee or staff spaces) open that whole stretch. */
export function pollSpaces(spaces, from, to) {
    return spaces.filter((s) => !s.staff && !s.anchors.some((a) => a.entity === COMMITTEES_ENTITY) && s.startedAt <= from
        && (!s.closedAt || s.closedAt >= to) && (!s.plannedCloseAt || s.plannedCloseAt >= to));
}

/** Everything Gemini is told: from the repo, nothing else. */
export function brief(root, month) {
    const end = monthEnd(month);
    const spaces = readJson(root, SPACES_PLAN).spaces;
    const chat = (key) => {
        const f = path.join(root, 'data/spaces/chats', `${key}.json`);
        return fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, 'utf8')).messages.slice(-3).map((m) => m.text) : [];
    };
    const blog = path.join(root, 'content/blog', month.slice(0, 4));
    const news = fs.existsSync(blog) ? fs.readdirSync(blog).filter((f) => f.startsWith(month) && f.endsWith('.md')).sort()
        .map((f) => fs.readFileSync(path.join(blog, f), 'utf8').match(/^title:\s*"?(.*?)"?\s*$/m)?.[1]).filter(Boolean) : [];
    const committees = fs.readdirSync(path.join(root, 'generated/committees')).filter((f) => f.endsWith('.json') && f !== '.mj-sync.json')
        .flatMap((f) => readJson(root, `generated/committees/${f}`)).map((c) => ({ name: c.fields.Name, mission: c.fields.MissionStatement }))
        .sort((a, b) => (a.name < b.name ? -1 : 1));
    const since = `${Number(month.slice(0, 4)) - 2}${month.slice(4)}`;
    const recentVotes = [
        ...readJson(root, POLLS_FILE).polls.map((p) => ({ name: p.name, opens: p.opens })),
        ...readJson(root, EVOTES_FILE).votes.map((v) => ({ name: v.name, opens: v.opens })),
    ].filter((v) => v.opens >= since).sort((a, b) => (a.opens < b.opens ? -1 : 1));
    return {
        month,
        firstDay: `${month}-01`,
        lastDay: end,
        openOneOpensBetween: [addDays(end, -9), end],
        background: ERAS[Number(month.slice(0, 4))] ?? '',
        news,
        spaces: pollSpaces(spaces, `${month}-01`, addDays(end, 14)).map((s) => ({
            key: s.key, name: s.name, kind: s.key.startsWith('chapter-') ? 'chapter' : s.type, description: s.description, latestChat: chat(s.key),
        })),
        committees,
        recentVotes,
    };
}

// ── RULE 2 — what a proposal must look like ──
/**
 * Problems with Gemini's proposal, in words it can act on; empty when it passes. `names` are people's full names and
 * `firstNamesOf` their first names, never to appear (a first name only when the brief's chats use it).
 */
export function check(votes, b, { taken = new Set(), names = new Set(), firstNamesOf = new Set() } = {}) {
    const problems = [];
    const firstNames = new Set(b.spaces.flatMap((s) => s.latestChat.join(' ').match(/\b[A-Z][a-z'-]+\b/g) ?? []).filter((t) => firstNamesOf.has(t)));
    if (!Array.isArray(votes) || votes.length < 1 || votes.length > 2) return [`propose one or two votes (got ${Array.isArray(votes) ? votes.length : 'none'})`];
    const spaces = new Map(b.spaces.map((s) => [s.key, s]));
    const committees = new Set(b.committees.map((c) => c.name));
    const [openFrom, openTo] = b.openOneOpensBetween;
    const open = votes.filter((v) => v.closes > b.lastDay);
    if (open.length !== 1) problems.push(`exactly one vote must still be open on ${b.lastDay} (got ${open.length})`);
    const seen = new Set();
    for (const [i, v] of votes.entries()) {
        const at = `vote ${i + 1} ("${v.name ?? ''}")`;
        if (!ISO.test(v.opens ?? '') || !ISO.test(v.closes ?? '')) { problems.push(`${at}: opens and closes must be YYYY-MM-DD`); continue; }
        const length = daysBetween(v.opens, v.closes);
        if (v.opens < b.firstDay || v.opens > b.lastDay) problems.push(`${at}: opens ${v.opens}, outside ${b.firstDay}..${b.lastDay}`);
        if (v.closes > b.lastDay) {
            if (v.opens < openFrom || v.opens > openTo) problems.push(`${at}: the open one must open between ${openFrom} and ${openTo}`);
            if (length < 5 || length > 14) problems.push(`${at}: the open one runs ${length} days; make it 5 to 14`);
        } else if (length < 3 || length > 14) problems.push(`${at}: runs ${length} days; make it 3 to 14`);
        if (v.kind === 'poll') {
            const s = spaces.get(v.space);
            if (!s) problems.push(`${at}: space "${v.space}" is not one of the brief's spaces`);
            else if (!String(v.name).startsWith(`${s.name} poll: `)) problems.push(`${at}: name it "${s.name} poll: <short topic>"`);
            const question = String(v.question ?? '').trim();
            if (!question) problems.push(`${at}: a poll needs a "question" field: the Yes/No question itself, ending with "?"`);
            else if (!question.endsWith('?')) problems.push(`${at}: question must end with "?"`);
            else if (/\bor\b/i.test(question)) problems.push(`${at}: question offers a choice ("or"); ask one thing members answer Yes or No to`);
        } else if (v.kind === 'evote') {
            if (!committees.has(v.committee)) problems.push(`${at}: committee "${v.committee}" is not one of the brief's committees`);
            else {
                if (!String(v.name).endsWith(`(${v.committee.replace(/ Committee$/, '')}, electronic vote)`)) problems.push(`${at}: name it "<motion> (${v.committee.replace(/ Committee$/, '')}, electronic vote)"`);
                if (!String(v.text).startsWith(`Motion: that the ${v.committee}`)) problems.push(`${at}: text must begin "Motion: that the ${v.committee}"`);
            }
            if (!ISO.test(v.certified ?? '') || daysBetween(v.closes, v.certified) < 1 || daysBetween(v.closes, v.certified) > 3) problems.push(`${at}: certified must be 1 to 3 days after it closes`);
            if (!(v.turnout >= 0.6 && v.turnout <= 1)) problems.push(`${at}: turnout must be 0.6 to 1`);
        } else problems.push(`${at}: kind must be "poll" or "evote"`);
        if (!(v.yes >= 0.12 && v.yes <= 0.92) || (v.yes > 0.42 && v.yes < 0.58)) problems.push(`${at}: yes ${v.yes} must be 0.12–0.92 and outside 0.42–0.58`);
        if (Boolean(v.fail) !== v.yes < 0.5) problems.push(`${at}: fail must be ${v.yes < 0.5} for yes ${v.yes}`);
        const text = `${v.name ?? ''} ${v.question ?? ''} ${v.text ?? ''}`;
        const words = String(v.text ?? '').split(/\s+/).filter(Boolean).length;
        if (words < 15 || words > 85) problems.push(`${at}: text is ${words} words; keep it to 20–70`);
        if (taken.has(String(v.name).toLowerCase()) || seen.has(String(v.name).toLowerCase())) problems.push(`${at}: another vote already has this name`);
        seen.add(String(v.name).toLowerCase());
        if (ERA_WORDING.test(text)) problems.push(`${at}: names the background ("${text.match(ERA_WORDING)[0]}")`);
        if (INVENTED_EVENT.test(text)) problems.push(`${at}: invents an event ("${text.match(INVENTED_EVENT)[0]}")`);
        if (BRITISH.test(text)) problems.push(`${at}: use US spelling ("${text.match(BRITISH)[0]}")`);
        if (/https?:|www\.|@\w|#\w|[\u{1F300}-\u{1FAFF}]/u.test(text)) problems.push(`${at}: links, handles, hashtags or emoji`);
        for (const [pair] of text.matchAll(/\b[A-Z][a-z'-]+ [A-Z][a-z'-]+\b/g)) if (names.has(pair)) problems.push(`${at}: names a person (${pair})`);
        // The chats name members by first name; none of those names may carry over.
        for (const first of firstNames) if (new RegExp(`\\b${first}\\b`).test(text)) problems.push(`${at}: names a member (${first})`);
    }
    return problems;
}

// ── RULE 3 — how a vote goes into the catalogs ──
const slug = (s) => s.replace(/ Committee$/, '').toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

/** The catalog entries for Gemini's votes: keyed by space or committee and month, in the catalogs' own fields. */
export function entries(votes, month, taken = new Set()) {
    const keys = new Set(taken);
    const unique = (k) => { let key = k; for (let n = 2; keys.has(key); n++) key = `${k}-${n}`; keys.add(key); return key; };
    return votes.map((v) => (v.kind === 'poll'
        ? { kind: 'poll', entry: { key: unique(`poll-${v.space.replace(/^chapter-/, '')}-${month}`), space: v.space, opens: v.opens, closes: v.closes,
            name: v.name.trim(), question: v.question.trim(), text: v.text.trim(), yes: v.yes, ...(v.fail ? { fail: true } : {}) } }
        : { kind: 'evote', entry: { key: unique(`evote-${slug(v.committee)}-${month}`), committee: v.committee, opens: v.opens, closes: v.closes, certified: v.certified,
            name: v.name.trim(), text: v.text.trim(), turnout: v.turnout, yes: v.yes, ...(v.fail ? { fail: true } : {}) } }));
}

/** polls.json keeps one poll per few lines; a new poll is written the same way, at the end. */
export function appendPolls(body, polls) {
    if (!polls.length) return body;
    const q = (v) => JSON.stringify(v);
    const lines = polls.map((p) => `    { "key": ${q(p.key)}, "space": ${q(p.space)}, "opens": ${q(p.opens)}, "closes": ${q(p.closes)},\n` +
        `      "name": ${q(p.name)},\n      "question": ${q(p.question)},\n      "text": ${q(p.text)},\n      "yes": ${p.yes}${p.fail ? ', "fail": true' : ''} }`);
    const at = body.lastIndexOf('\n  ]');
    if (at < 0) throw new Error(`${POLLS_FILE}: cannot find the end of the polls list`);
    return `${body.slice(0, at)},\n${lines.join(',\n')}${body.slice(at)}`;
}

export function appendEvotes(body, votes) {
    if (!votes.length) return body;
    const j = JSON.parse(body);
    j.votes.push(...votes);
    return JSON.stringify(j, null, 2) + '\n';
}

async function main(argv) {
    const root = process.cwd();
    const month = argv.includes('--month') ? argv[argv.indexOf('--month') + 1] : null;
    if (!/^\d{4}-\d{2}$/.test(month ?? '')) throw new Error('usage: node scripts/plan-votes-gemini.mjs --month YYYY-MM [--dry-run]');
    const asOf = String(readJson(root, 'generated/checkpoint.json').continuity?.asOfDate ?? '').slice(0, 10);
    if (asOf !== monthEnd(month)) throw new Error(`the data ends ${asOf}, not ${monthEnd(month)}: run this after ${month}'s Loom cycle`);
    const pollsBody = fs.readFileSync(path.join(root, POLLS_FILE), 'utf8');
    const evotesBody = fs.readFileSync(path.join(root, EVOTES_FILE), 'utf8');
    const catalog = { polls: JSON.parse(pollsBody).polls, votes: JSON.parse(evotesBody).votes };
    const keys = new Set([...catalog.polls, ...catalog.votes].map((v) => v.key));
    if ([...keys].some((k) => k.endsWith(`-${month}`) || new RegExp(`-${month}-\\d+$`).test(k))) throw new Error(`${month} already has votes in the catalogs`);
    const b = brief(root, month);
    if (argv.includes('--dry-run')) { console.log(JSON.stringify(b, null, 1)); return; }

    const w = loadWorld(root);
    const taken = new Set([...catalog.polls, ...catalog.votes].map((v) => v.name.toLowerCase()));
    const names = new Set(w.people.map((p) => `${p.FirstName} ${p.LastName}`));
    const firstNamesOf = new Set(w.people.map((p) => p.FirstName).filter(Boolean));
    const key = apiKey();
    const contents = [{ role: 'user', parts: [{ text: JSON.stringify(b, null, 1) }] }];
    const usage = { in: 0, out: 0 };
    for (let attempt = 1; attempt <= 3; attempt++) {
        const data = await generate(key, contents, { system: SYSTEM, schema: SCHEMA, temperature: 0.8 });
        usage.in += data.usageMetadata?.promptTokenCount ?? 0;
        usage.out += (data.usageMetadata?.candidatesTokenCount ?? 0) + (data.usageMetadata?.thoughtsTokenCount ?? 0);
        const text = data.candidates?.[0]?.content?.parts?.map((p) => p.text ?? '').join('') ?? '';
        let votes;
        try { votes = JSON.parse(text).votes; } catch { votes = null; }
        const problems = check(votes, b, { taken, names, firstNamesOf });
        let added = [];
        if (!problems.length) {
            added = entries(votes, month, keys);
            // The plan builder checks what only the data can: enough voters to answer, a chair to certify, the result.
            try {
                const plan = buildPlan(w, {
                    polls: { polls: [...catalog.polls, ...added.filter((a) => a.kind === 'poll').map((a) => a.entry)] },
                    evotes: { votes: [...catalog.votes, ...added.filter((a) => a.kind === 'evote').map((a) => a.entry)] },
                });
                const openNow = plan.elections.filter((e) => e.stage === 'open' && added.some((a) => a.entry.key === e.key));
                if (openNow.length !== 1) problems.push(`the open vote is not open on ${b.lastDay} in the plan`);
            } catch (err) {
                problems.push(`the plan refuses it: ${err instanceof Error ? err.message : err}`);
            }
        }
        if (!problems.length) {
            fs.writeFileSync(path.join(root, POLLS_FILE), appendPolls(pollsBody, added.filter((a) => a.kind === 'poll').map((a) => a.entry)));
            fs.writeFileSync(path.join(root, EVOTES_FILE), appendEvotes(evotesBody, added.filter((a) => a.kind === 'evote').map((a) => a.entry)));
            for (const a of added) console.log(`${a.entry.key}: ${a.entry.name} (${a.entry.opens} to ${a.entry.closes})`);
            console.log(`${month}: ${added.length} vote(s) added in ${attempt} attempt(s); ${usage.in} in / ${usage.out} out tokens, about $${((usage.in * 0.30 + usage.out * 2.50) / 1e6).toFixed(4)}`);
            console.log('next: node scripts/build-elections-plan.mjs');
            return;
        }
        console.log(`attempt ${attempt}: ${problems.length} problem(s): ${problems.slice(0, 3).join('; ')}`);
        if (argv.includes('--verbose')) console.log(text);
        contents.push({ role: 'model', parts: [{ text }] }, { role: 'user', parts: [{ text: `Fix these problems and return every vote again:\n- ${problems.join('\n- ')}` }] });
        if (attempt === 3) throw new Error(`${month}: no votes added; ${problems.slice(0, 6).join('; ')}`);
    }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main(process.argv.slice(2)).catch((e) => { console.error(e instanceof Error ? e.message : e); process.exit(1); });
