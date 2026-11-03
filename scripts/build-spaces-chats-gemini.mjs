#!/usr/bin/env node
/**
 * build-spaces-chats-gemini.mjs — the member chat for each space in data/spaces/spaces.plan.json, written by
 * Gemini and committed as data/spaces/chats/<space-key>.json. scripts/load-spaces.mjs posts them as each author.
 *
 * One call per space. The brief is the space (name, type, description, dates), its people (only seated members
 * who can post: no guests, no pending invitations, no removed seats, not the presenter), the era storyline for
 * the years the space covers, and, for a committee, its action items. Every reply is checked: authors are on the
 * roster, dates fall inside the space's life and never after the data ends, messages are short, plain and
 * unique. A failed check goes back to the model with the problems listed, up to three attempts.
 *
 *   node scripts/build-spaces-chats-gemini.mjs                    # every space without a chat file
 *   node scripts/build-spaces-chats-gemini.mjs --space chapter-california --force
 *   node scripts/build-spaces-chats-gemini.mjs --dry-run          # print one brief, call nothing
 *
 * Key: GEMINI_API_KEY, else AI_VENDOR_API_KEY__GeminiLLM, from the environment or from GEMINI_ENV_FILE (a .env);
 * GEMINI_KEY_FROM_PROXY=1 where a network secret adds the header. The key is sent only to
 * generativelanguage.googleapis.com and is never logged. Run from the repo root.
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = process.cwd();
const PLAN = 'data/spaces/spaces.plan.json';
const OUT_DIR = 'data/spaces/chats';
const MODEL = 'gemini-3.5-flash-lite';
const MAX_CHARS = 600;

/** VAULT-DESIGN §4.2 — what each year was about, for the tone of a chat dated in it. */
export const ERAS = {
    2015: 'steady early years: a small federation building its committees and standards',
    2016: 'steady growth; committee work and a first wave of chapters forming',
    2017: 'steady growth; standards and education programs maturing',
    2018: 'steady growth; the annual conference and competition becoming fixtures',
    2019: 'confident growth: conference previews, straightforward advocacy, routine operations',
    2020: 'pandemic shock: event cancellations, refunds, emergency member support, the pivot to online courses',
    2021: 'the virtual pivot: virtual symposium, online credentials, "are we going back in person"',
    2022: 'the artisan boom: in-person conference returns, competition entries climb, capacity strain',
    2023: 'the artisan boom continues: busy, optimistic, venue contracts and growth',
    2024: 'the artisan boom at its peak: growth, sponsorship holds, staffing stretched',
    2025: 'creamery closures: cost inflation, hardship dues, closure and succession support',
    2026: 'stabilization: costs ease, succession and consolidation, next-generation makers, raw-milk aging rule modernization, traceability',
};

const SYSTEM = `You write the member chat of one collaboration space for the International Cheese Federation (ICF), a FICTIONAL
cheese makers' association used as demo data for MemberJunction. Everything is invented: never name a real company,
creamery, brand, person, regulator decision or product. People are the roster given; staff are never named (say
"ICF staff", "Membership Operations", "the events team"). Write like real members in a work chat: short, specific,
practical, warm but not chirpy, plain text, no hashtags, no emoji, no links, no @-handles, no markdown. Mention
other roster members by first name when natural. Keep figures rare, round and incidental; never invent statistics.
Each message must fit its date: the era notes say what that year was about. Never say a file was attached, uploaded or
shared in the chat; talk about the work itself. Return JSON only.`;

const SCHEMA = {
    type: 'OBJECT',
    properties: {
        messages: {
            type: 'ARRAY',
            items: {
                type: 'OBJECT',
                properties: { author: { type: 'STRING' }, date: { type: 'STRING' }, text: { type: 'STRING' } },
                required: ['author', 'date', 'text'],
            },
        },
    },
    required: ['messages'],
};

const day = (v) => String(v ?? '').slice(0, 10);
function load(dir) {
    const d = path.join(ROOT, 'generated', dir);
    const out = [];
    for (const f of fs.readdirSync(d).sort()) {
        if (f === '.mj-sync.json' || !f.endsWith('.json')) continue;
        const j = JSON.parse(fs.readFileSync(path.join(d, f), 'utf8'));
        if (Array.isArray(j)) out.push(...j);
    }
    return out;
}

/** Who may post in the space: active, non-guest seats, not the template user. */
export function posters(space, presenter) {
    return space.seats.filter((x) => x.status === 'Active' && x.role !== 'guest' && x.user !== presenter && x.person);
}

/** How many messages a space gets: long-lived open spaces more, short or closed ones fewer. */
export function messageCount(space) {
    if (space.parent) return 10;
    if (space.closedAt) return 12;
    return space.type === 'community' || space.anchors.length ? 18 : 14;
}

export function brief(space, plan, world) {
    const end = space.closedAt ?? plan.asOf;
    const people = posters(space, plan.presenter).slice(0, 18).map((x) => {
        const p = world.person.get(x.person.toUpperCase());
        const prof = world.profile.get(x.person.toUpperCase());
        return { author: x.user, name: `${p.FirstName} ${p.LastName}`, role: x.role, title: p.Title ?? null, place: prof ? [prof.City, prof.CountryName].filter(Boolean).join(', ') : null };
    });
    const from = Number(space.startedAt.slice(0, 4));
    const to = Number(end.slice(0, 4));
    const eras = Object.fromEntries(Object.entries(ERAS).filter(([y]) => Number(y) >= from && Number(y) <= to));
    const tasks = space.tasks.map((id) => world.task.get(id.toUpperCase())).filter(Boolean)
        .sort((a, b) => (day(a.DueAt) < day(b.DueAt) ? 1 : -1)).slice(0, 12)
        .map((t) => ({ name: t.Name, due: day(t.DueAt), status: t.Status }));
    const recentFrom = new Date(Date.parse(`${end}T00:00:00Z`) - 183 * 86400000).toISOString().slice(0, 10);
    return {
        space: { name: space.name, type: space.type, description: space.description, startedAt: space.startedAt, endsAt: end, closed: !!space.closedAt },
        parentSpace: space.parent ? plan.spaces.find((s) => s.key === space.parent)?.name : null,
        roster: people,
        eras,
        committeeActionItems: tasks,
        write: {
            messages: messageCount(space),
            dates: `ISO "YYYY-MM-DDTHH:MM", between ${space.startedAt} and ${end}, in order, spread across the space's life with about a third on or after ${recentFrom}; working hours in the author's place`,
            authors: 'only the author emails in the roster; the owner and admins post more than members; at least five different authors',
            length: `each message 1–3 sentences, at most ${MAX_CHARS} characters`,
            ...(space.closedAt ? { ending: 'the last few messages wrap the work up, because the space closed on its end date' } : {}),
        },
    };
}

export function check(messages, space, plan) {
    const problems = [];
    const allowed = new Set(posters(space, plan.presenter).map((x) => x.user));
    const end = space.closedAt ?? plan.asOf;
    const seen = new Set();
    if (!Array.isArray(messages) || messages.length < Math.min(6, messageCount(space))) problems.push(`too few messages (${messages?.length ?? 0})`);
    for (const [i, m] of (messages ?? []).entries()) {
        const at = `message ${i + 1}`;
        if (!allowed.has(String(m.author).toLowerCase())) problems.push(`${at}: author ${m.author} is not on the roster`);
        if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(m.date ?? '')) problems.push(`${at}: date ${m.date} is not YYYY-MM-DDTHH:MM`);
        else if (day(m.date) < space.startedAt || day(m.date) > end) problems.push(`${at}: date ${m.date} is outside ${space.startedAt}..${end}`);
        const text = String(m.text ?? '').trim();
        if (!text) problems.push(`${at}: empty`);
        if (text.length > MAX_CHARS) problems.push(`${at}: ${text.length} characters, over ${MAX_CHARS}`);
        if (/https?:\/\/|www\.|#\w|@\w|\*\*|[\u{1F300}-\u{1FAFF}]/u.test(text)) problems.push(`${at}: links, hashtags, handles, markdown or emoji`);
        if (/\b(attached|uploaded|shared folder)\b/i.test(text)) problems.push(`${at}: mentions an attached or uploaded file`);
        if (seen.has(text.toLowerCase())) problems.push(`${at}: repeats an earlier message`);
        seen.add(text.toLowerCase());
    }
    if (new Set((messages ?? []).map((m) => m.author)).size < Math.min(5, allowed.size)) problems.push('fewer than five different authors');
    return problems;
}

function apiKey() {
    if (process.env.GEMINI_KEY_FROM_PROXY === '1') return null;
    const fromEnv = process.env.GEMINI_API_KEY || process.env.AI_VENDOR_API_KEY__GeminiLLM;
    if (fromEnv) return fromEnv.trim();
    const file = process.env.GEMINI_ENV_FILE?.replace(/^~(?=\/)/, os.homedir());
    if (file && fs.existsSync(file)) {
        const m = fs.readFileSync(file, 'utf8').match(/^\s*(?:export\s+)?(?:GEMINI_API_KEY|AI_VENDOR_API_KEY__GeminiLLM)\s*=\s*["']?([^"'\s#]+)/m);
        if (m) return m[1];
    }
    throw new Error('no Gemini key: set GEMINI_API_KEY, or GEMINI_ENV_FILE to a .env holding AI_VENDOR_API_KEY__GeminiLLM, or GEMINI_KEY_FROM_PROXY=1');
}

async function generate(key, contents) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;
    const body = JSON.stringify({
        systemInstruction: { parts: [{ text: SYSTEM }] },
        contents,
        generationConfig: { responseMimeType: 'application/json', responseSchema: SCHEMA, maxOutputTokens: 16384, temperature: 0.9 },
    });
    for (let i = 0; ; i++) {
        const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json', ...(key ? { 'x-goog-api-key': key } : {}) }, body });
        const data = await res.json().catch(() => ({}));
        if (res.ok) return data;
        if (i < 4 && (res.status === 429 || res.status >= 500)) { await new Promise((r) => setTimeout(r, 2000 * 2 ** i)); continue; }
        throw new Error(`Gemini ${res.status}: ${data.error?.message ?? res.statusText}`);
    }
}

async function chatFor(space, plan, world, key) {
    const prompt = JSON.stringify(brief(space, plan, world), null, 1);
    const contents = [{ role: 'user', parts: [{ text: prompt }] }];
    const usage = { in: 0, out: 0 };
    for (let attempt = 1; attempt <= 3; attempt++) {
        const data = await generate(key, contents);
        usage.in += data.usageMetadata?.promptTokenCount ?? 0;
        usage.out += (data.usageMetadata?.candidatesTokenCount ?? 0) + (data.usageMetadata?.thoughtsTokenCount ?? 0);
        const text = data.candidates?.[0]?.content?.parts?.map((p) => p.text ?? '').join('') ?? '';
        let messages;
        try { messages = JSON.parse(text).messages; } catch { messages = null; }
        if (Array.isArray(messages)) {
            messages = messages.map((m) => ({ author: String(m.author).toLowerCase().trim(), date: String(m.date).trim(), text: String(m.text).trim() }))
                .sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
        }
        const problems = check(messages, space, plan);
        if (!problems.length) return { messages, usage, attempts: attempt };
        contents.push({ role: 'model', parts: [{ text }] }, { role: 'user', parts: [{ text: `Fix these problems and return the whole chat again:\n- ${problems.join('\n- ')}` }] });
        if (attempt === 3) throw new Error(`${space.key}: ${problems.slice(0, 5).join('; ')}`);
    }
}

function world() {
    const flat = (r) => [String(r.primaryKey?.ID).toUpperCase(), r.fields];
    return {
        person: new Map(load('people').map(flat)),
        profile: new Map(load('member-profiles').map((r) => [String(r.fields.PersonID).toUpperCase(), r.fields])),
        task: new Map(load('tasks').map(flat)),
    };
}

async function main(argv) {
    const opts = { spaces: [], force: argv.includes('--force'), dryRun: argv.includes('--dry-run'), par: 4 };
    for (let i = 0; i < argv.length; i++) if (argv[i] === '--space') opts.spaces.push(argv[++i]);
    const plan = JSON.parse(fs.readFileSync(path.join(ROOT, PLAN), 'utf8'));
    const w = world();
    const todo = plan.spaces.filter((s) => (!opts.spaces.length || opts.spaces.includes(s.key)) && (opts.force || !fs.existsSync(path.join(ROOT, OUT_DIR, `${s.key}.json`))));
    if (opts.dryRun) {
        console.log(JSON.stringify(brief(todo[0], plan, w), null, 1));
        console.log(`${todo.length} space(s) would be written`);
        return;
    }
    const key = apiKey();
    fs.mkdirSync(path.join(ROOT, OUT_DIR), { recursive: true });
    const total = { in: 0, out: 0 };
    let failed = 0;
    const queue = [...todo];
    await Promise.all(Array.from({ length: opts.par }, async () => {
        for (let s = queue.shift(); s; s = queue.shift()) {
            try {
                const r = await chatFor(s, plan, w, key);
                fs.writeFileSync(path.join(ROOT, OUT_DIR, `${s.key}.json`), JSON.stringify({ space: s.key, chat: 'General', kind: 'General', messages: r.messages }, null, 2) + '\n');
                total.in += r.usage.in; total.out += r.usage.out;
                console.log(`${s.key}: ${r.messages.length} messages, ${r.attempts} attempt(s)`);
            } catch (e) {
                failed++;
                console.error(`FAILED ${e instanceof Error ? e.message : e}`);
            }
        }
    }));
    const cost = (total.in * 0.30 + total.out * 2.50) / 1e6;
    console.log(`${todo.length - failed}/${todo.length} written; ${total.in} in / ${total.out} out tokens, about $${cost.toFixed(2)}`);
    if (failed) process.exit(1);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main(process.argv.slice(2)).catch((e) => { console.error(e instanceof Error ? e.message : e); process.exit(1); });
