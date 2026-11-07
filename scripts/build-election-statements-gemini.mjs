#!/usr/bin/env node
/**
 * build-election-statements-gemini.mjs — candidate statements for the board elections in the elections plan.
 *
 * One Gemini call per board election writes every candidate's statement together, so the field reads as different
 * people. Each candidate is briefed from generated/ only: title, business, segment, region, the year they joined, their
 * committee service up to that election, and whether they sit on the board or ran before. The year's storyline is
 * background for tone and is never named. Every statement is checked (length, first person, no other candidate named,
 * no invented events, no planning wording) and sent back with the problems until it passes, three tries at most.
 *
 * Writes data/elections/statements.json ({statements: {"board-2024:<PersonID>": "…"}}), which
 * scripts/build-elections-plan.mjs reads into each nomination. Re-run the plan builder afterwards.
 *
 *   node scripts/build-election-statements-gemini.mjs              # every board election without statements
 *   node scripts/build-election-statements-gemini.mjs --election board-2024 --force
 *   node scripts/build-election-statements-gemini.mjs --dry-run    # print the first brief, call nothing
 *
 * Key: GEMINI_API_KEY, else AI_VENDOR_API_KEY__GeminiLLM, from the environment or from GEMINI_ENV_FILE (a .env);
 * GEMINI_KEY_FROM_PROXY=1 where a network secret adds the header. The key is sent only to
 * generativelanguage.googleapis.com and is never logged. Run from the repo root.
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ERAS } from './build-spaces-chats-gemini.mjs';

const ROOT = process.cwd();
const PLAN = 'data/elections/elections.plan.json';
const OUT = 'data/elections/statements.json';
const MODEL = 'gemini-3.5-flash-lite';

const SYSTEM = `You write candidate statements for the yearly Board of Directors election of the International Cheese
Federation (ICF), a FICTIONAL cheese makers' association used as demo data for MemberJunction. Everything is invented:
never name a real company, product, person, place of business or brand.

Each candidate writes their own statement, in the first person, 70 to 120 words, as it would appear on the ballot.
- Ground it in the brief: their work and business, their part of the cheese trade, where they are, how long they have
  been a member, and the committees they served on (by name, with the roles the brief gives). Never invent other roles.
- An incumbent says what the board did in their term in general terms and why they want a second term. Someone who ran
  before and lost may say so.
- Say what they would focus on, in plain words that fit the year's background. The background is for tone only: never
  quote it or name it as a period.
- Never name another candidate, any other member or any ICF staff member. Never quote statistics about ICF itself.
- The only ICF events are the Annual Conference, the annual competition, the 2021 virtual symposium, webinars, courses
  and chapter meet-ups. Never invent another (no summit, gala, banquet, expo or awards dinner).
- No slogans, hashtags, emojis, email addresses or links. Each statement opens differently and sounds like its writer.

Return JSON: {"statements": [{"person": "<id from the brief>", "statement": "<text>"}]}, one entry per candidate.`;

const SCHEMA = {
    type: 'OBJECT',
    properties: { statements: { type: 'ARRAY', items: { type: 'OBJECT', properties: { person: { type: 'STRING' }, statement: { type: 'STRING' } }, required: ['person', 'statement'] } } },
    required: ['statements'],
};

const ERA_WORDING = /artisan boom|stabili[sz]ation|virtual pivot|capacity strain|sponsorship holds|stretched thin|pandemic shock|creamery closures/i;
const INVENTED_EVENT = /\b(summit|gala|banquet|expo|awards dinner)\b/i;

function load(dir) {
    const d = path.join(ROOT, 'generated', dir);
    return fs.readdirSync(d).filter((f) => f.endsWith('.json') && f !== '.mj-sync.json').sort()
        .flatMap((f) => JSON.parse(fs.readFileSync(path.join(d, f), 'utf8')));
}

export function world() {
    const up = (v) => String(v ?? '').toUpperCase();
    const terms = new Map(load('committee-terms').map((t) => [up(t.primaryKey.ID), up(t.fields.CommitteeID)]));
    const committees = new Map(load('committees').map((c) => [up(c.primaryKey.ID), c.fields.Name]));
    return {
        person: new Map(load('people').map((r) => [up(r.primaryKey.ID), r.fields])),
        profile: new Map(load('member-profiles').map((r) => [up(r.fields.PersonID), r.fields])),
        organization: new Map(load('organizations').map((r) => [up(r.primaryKey.ID), r.fields.Name])),
        service: load('committee-memberships').map((r) => ({
            person: up(r.fields.PersonID),
            committee: committees.get(terms.get(up(r.fields.TermID))) ?? null,
            role: String(r.fields.RoleID).replace(/^@lookup:.*Name=/, ''),
            from: String(r.fields.StartDate ?? '').slice(0, 4),
            to: r.fields.EndDate ? String(r.fields.EndDate).slice(0, 4) : null,
        })),
    };
}

/** What Gemini is told about one election's candidates. */
export function brief(election, plan, w) {
    const year = Number(election.key.slice(-4));
    const board = plan.board ?? [];
    const before = plan.elections.filter((e) => e.family === 'board-election' && Number(e.key.slice(-4)) < year);
    return {
        election: election.name,
        year,
        seats: election.contests[0].seats,
        background: ERAS[year] ?? '',
        candidates: election.nominations.entries.filter((n) => !n.withdrawn).map(({ person }) => {
            const p = w.person.get(person) ?? {};
            const prof = w.profile.get(person) ?? {};
            return {
                id: person,
                name: `${p.FirstName} ${p.LastName}`,
                title: p.Title ?? null,
                business: w.organization.get(String(prof.OrganizationID ?? '').toUpperCase()) ?? null,
                segment: prof.Segment ?? null,
                place: [prof.City, prof.State, prof.CountryName].filter(Boolean).join(', ') || null,
                memberSince: String(prof.JoinDate ?? '').slice(0, 4) || null,
                committeeService: w.service.filter((s) => s.person === person && s.committee && s.from && s.from <= String(year))
                    .map((s) => `${s.role}, ${s.committee}, ${s.from}–${s.to && s.to <= String(year) ? s.to : 'now'}`),
                incumbent: board.some((s) => s.person === person && s.from <= year && s.to >= year),
                ranBeforeAndLost: before.some((e) => e.nominations.entries.some((n) => n.person === person && !n.withdrawn) && !e.expect[0].elected.includes(person)),
            };
        }),
    };
}

export function check(statements, b) {
    const problems = [];
    const ids = new Set(b.candidates.map((c) => c.id));
    const got = new Map((statements ?? []).map((s) => [String(s.person).toUpperCase(), String(s.statement ?? '').trim()]));
    for (const c of b.candidates) if (!got.get(c.id)) problems.push(`no statement for ${c.id} (${c.name})`);
    const openings = new Set();
    for (const [id, text] of got) {
        const who = b.candidates.find((c) => c.id === id);
        if (!ids.has(id)) { problems.push(`${id} is not a candidate`); continue; }
        const at = who.name;
        const words = text.split(/\s+/).filter(Boolean).length;
        if (words < 60 || words > 135) problems.push(`${at}: ${words} words, keep it to 70–120`);
        if (!/\b(I|I'm|I've|[Mm]y|me)\b/.test(text)) problems.push(`${at}: write in the first person`);
        for (const other of b.candidates) {
            if (other.id === id) continue;
            if (text.includes(other.name) || new RegExp(`\\b${other.name.split(' ').slice(-1)[0]}\\b`).test(text)) problems.push(`${at}: names another candidate (${other.name})`);
        }
        if (ERA_WORDING.test(text)) problems.push(`${at}: names the background ("${text.match(ERA_WORDING)[0]}")`);
        if (INVENTED_EVENT.test(text)) problems.push(`${at}: invents an event ("${text.match(INVENTED_EVENT)[0]}")`);
        if (/https?:|www\.|@|#\w/.test(text)) problems.push(`${at}: has a link, address or hashtag`);
        const opening = text.split(/\s+/).slice(0, 3).join(' ').toLowerCase();
        if (openings.has(opening)) problems.push(`${at}: opens like another statement ("${opening}")`);
        openings.add(opening);
    }
    return problems;
}

export function apiKey() {
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

/** One Gemini call; `opts` swaps in another script's system prompt, schema and temperature. */
export async function generate(key, contents, { system = SYSTEM, schema = SCHEMA, temperature = 0.9 } = {}) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;
    const body = JSON.stringify({
        systemInstruction: { parts: [{ text: system }] },
        contents,
        generationConfig: { responseMimeType: 'application/json', responseSchema: schema, maxOutputTokens: 8192, temperature },
    });
    for (let i = 0; ; i++) {
        const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json', ...(key ? { 'x-goog-api-key': key } : {}) }, body });
        const data = await res.json().catch(() => ({}));
        if (res.ok) return data;
        if (i < 4 && (res.status === 429 || res.status >= 500)) { await new Promise((r) => setTimeout(r, 2000 * 2 ** i)); continue; }
        throw new Error(`Gemini ${res.status}: ${data.error?.message ?? res.statusText}`);
    }
}

async function statementsFor(b, key) {
    const contents = [{ role: 'user', parts: [{ text: JSON.stringify(b, null, 1) }] }];
    const usage = { in: 0, out: 0 };
    for (let attempt = 1; attempt <= 3; attempt++) {
        const data = await generate(key, contents);
        usage.in += data.usageMetadata?.promptTokenCount ?? 0;
        usage.out += (data.usageMetadata?.candidatesTokenCount ?? 0) + (data.usageMetadata?.thoughtsTokenCount ?? 0);
        const text = data.candidates?.[0]?.content?.parts?.map((p) => p.text ?? '').join('') ?? '';
        let statements;
        try { statements = JSON.parse(text).statements; } catch { statements = null; }
        const problems = check(statements, b);
        if (!problems.length) return { statements, usage, attempts: attempt };
        contents.push({ role: 'model', parts: [{ text }] }, { role: 'user', parts: [{ text: `Fix these problems and return every statement again:\n- ${problems.join('\n- ')}` }] });
        if (attempt === 3) throw new Error(`${b.election}: ${problems.slice(0, 5).join('; ')}`);
    }
}

async function main(argv) {
    const only = argv.includes('--election') ? argv[argv.indexOf('--election') + 1] : null;
    const force = argv.includes('--force');
    const plan = JSON.parse(fs.readFileSync(path.join(ROOT, PLAN), 'utf8'));
    const out = fs.existsSync(path.join(ROOT, OUT)) ? JSON.parse(fs.readFileSync(path.join(ROOT, OUT), 'utf8')) : { statements: {} };
    const w = world();
    const todo = plan.elections.filter((e) => e.family === 'board-election' && (!only || e.key === only)
        && (force || e.nominations.entries.some((n) => !n.withdrawn && !out.statements[`${e.key}:${n.person}`])));
    if (argv.includes('--dry-run')) {
        if (todo[0]) console.log(JSON.stringify(brief(todo[0], plan, w), null, 1));
        console.log(`${todo.length} election(s) would be written`);
        return;
    }
    const key = apiKey();
    const total = { in: 0, out: 0 };
    for (const e of todo) {
        const r = await statementsFor(brief(e, plan, w), key);
        for (const s of r.statements) out.statements[`${e.key}:${String(s.person).toUpperCase()}`] = s.statement.trim();
        total.in += r.usage.in; total.out += r.usage.out;
        console.log(`${e.key}: ${r.statements.length} statements, ${r.attempts} attempt(s)`);
    }
    out.statements = Object.fromEntries(Object.entries(out.statements).sort(([a], [b]) => (a < b ? -1 : 1)));
    fs.mkdirSync(path.dirname(path.join(ROOT, OUT)), { recursive: true });
    fs.writeFileSync(path.join(ROOT, OUT), JSON.stringify({ source: `${MODEL} via scripts/build-election-statements-gemini.mjs`, statements: out.statements }, null, 2) + '\n');
    console.log(`${todo.length} election(s) written; ${total.in} in / ${total.out} out tokens, about $${((total.in * 0.30 + total.out * 2.50) / 1e6).toFixed(3)}`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main(process.argv.slice(2)).catch((e) => { console.error(e instanceof Error ? e.message : e); process.exit(1); });
