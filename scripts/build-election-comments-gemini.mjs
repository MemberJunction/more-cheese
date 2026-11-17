#!/usr/bin/env node
/**
 * build-election-comments-gemini.mjs — the wording of every standards-ballot comment and its resolution.
 *
 * The elections plan decides everything else about a comment: who wrote it, on which item, whether it came with a
 * Disapprove (Technical or General) or an Approve (Editorial), how the Standards Committee resolved it, and whether the
 * writer was satisfied. This script asks Gemini for the words: the clause it points at, the comment, the change it
 * proposes, and the committee's response. One call covers up to CHUNK comments of one ballot, briefed with the
 * document, each item's gist and result, and each writer's trade from generated/ (never their name). Every entry is
 * checked (clause, length, response matching the disposition, nobody named, no agency or regulation cited, no invented
 * event) and sent back with the problems until it passes, four tries at most.
 *
 * Writes data/elections/comments.json ({comments: {"<ballot>:<PersonID>:<item>": {reference, comment, proposedChange,
 * response}}}), which scripts/build-elections-plan.mjs reads into each comment. Re-run the plan builder afterwards.
 *
 *   node scripts/build-election-comments-gemini.mjs                 # every ballot with comments still unwritten
 *   node scripts/build-election-comments-gemini.mjs --election std-101-2.0 --force
 *   node scripts/build-election-comments-gemini.mjs --dry-run       # print the first brief, call nothing
 *
 * Key: as scripts/build-election-statements-gemini.mjs (GEMINI_API_KEY, AI_VENDOR_API_KEY__GeminiLLM, GEMINI_ENV_FILE
 * or GEMINI_KEY_FROM_PROXY=1). The key is sent only to generativelanguage.googleapis.com and is never logged.
 * Run from the repo root.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { apiKey, generate, world } from './build-election-statements-gemini.mjs';

const ROOT = process.cwd();
const PLAN = 'data/elections/elections.plan.json';
const STANDARDS = 'data/elections/standards.json';
const OUT = 'data/elections/comments.json';
const CHUNK = 10;

const SYSTEM = `You write the comments on Standards Committee ballots of the International Cheese Federation (ICF), a
FICTIONAL cheese makers' association used as demo data for MemberJunction, and the committee's resolution of each.
Everything is invented: never name a real company, product, person, brand or place of business.

The brief gives the document, each balloted item (its name, what it says, and how the vote came out) and one entry per
comment: which item it is on, the writer's stance and comment type, the writer's trade, and how the committee resolved
it. For each comment write:
- reference: the clause it points at. It starts with the item's own section mark (for "§2 Bulk-tank testing" write
  "§2" or "§2.1" or "§2, second paragraph"; for "§A2 …" start with "§A2"; for "Amendment 1: …" start with
  "Amendment 1").
- comment: what the writer says, 20 to 90 words, plainly and specifically, from their own trade and situation. They
  may name their own business, never anyone else's. A Technical comment argues about what the section requires; a
  General comment raises cost, scope, timing or how members will manage; an Editorial comment comes with an Approve
  and points at one concrete fix to wording, clarity, units or cross-references, never the substance.
- proposedChange: the change the writer asks for, 5 to 50 words, as replacement wording or a concrete instruction.
  It is never "retain the text", "keep it unchanged" or "no change": an Approve on an item others oppose still asks
  for a wording fix (a clearer definition, a unit, an example, a cross-reference). It may be empty only for a General
  comment.
- response: the committee's resolution, 12 to 70 words, written as the committee ("The committee …"), and it must
  match the disposition: Accepted — the change is made as proposed; AcceptedInPrinciple — the concern is met another
  way, said how; Rejected — the text stands, and why; Deferred — held for the next revision of the document;
  Withdrawn — the writer withdrew it after discussion. On an item that failed, an accepted change goes into the
  revised draft that is recirculated. On a recirculation, the item is already the revised draft. A response
  reasons from the item's own text, safety and members' practice; it never cites another rule, clause or exemption
  that the brief doesn't give.
Keep to the numbers in the item's text; never invent other figures. Refer to government rules only as "the federal
rule" or "the federal floor": never name an agency or cite a regulation. Never name any person or ICF staff member.
The only ICF events are the Annual Conference, the annual competition, the 2021 virtual symposium, webinars, courses
and chapter meet-ups; never invent another. No links, hashtags or emojis. Each comment sounds like its writer.

Return JSON: {"comments": [{"id": "<id from the brief>", "reference": "…", "comment": "…", "proposedChange": "…",
"response": "…"}]}, one entry per comment in the brief.`;

const SCHEMA = {
    type: 'OBJECT',
    properties: {
        comments: {
            type: 'ARRAY',
            items: {
                type: 'OBJECT',
                properties: { id: { type: 'STRING' }, reference: { type: 'STRING' }, comment: { type: 'STRING' }, proposedChange: { type: 'STRING' }, response: { type: 'STRING' } },
                required: ['id', 'reference', 'comment', 'proposedChange', 'response'],
            },
        },
    },
    required: ['comments'],
};

const ERA_WORDING = /artisan boom|stabili[sz]ation|virtual pivot|capacity strain|sponsorship holds|stretched thin|pandemic shock|creamery closures/i;
const INVENTED_EVENT = /\b(summit|gala|banquet|expo|awards dinner)\b/i;
const AGENCY = /\b(FDA|USDA|FSIS|CFR|Food and Drug|Department of Agriculture|21 ?C\.?F\.?R)\b/;
const HONORIFIC = /\b(Mr|Mrs|Ms|Dr)\.? [A-Z]/;
/** What a response to each disposition must, or must not, say. */
const FITS = {
    Accepted: { not: /\b(reject|declin|not accept|stands as written|defer)/i },
    AcceptedInPrinciple: { not: /\b(reject|declin|defer)/i },
    Rejected: { must: /\b(not|declin|retain|stands|keeps?|unchanged|reject)/i, not: /\b(accepted|we have (revised|changed|added))\b/i },
    Deferred: { must: /\b(next revision|defer|future revision|later revision|next edition|held)/i },
    Withdrawn: { must: /withdr/i },
};

/** The item's own section mark: "§2", "§A2" or "Amendment 1". */
export const markOf = (name) => name.match(/^(§[A-Z]?\d+|Amendment \d+)/)?.[1] ?? null;

/** Every comment a ballot carries, in the plan's order. */
export function slots(election) {
    const out = [];
    for (const b of election.ballots) {
        b.contests.forEach((c, i) => {
            if (c.comment) out.push({ person: b.person, item: i, stance: c.option, comment: c.comment });
        });
    }
    return out;
}

/** What Gemini is told about some of one ballot's comments. */
export function brief(election, catalog, w, chunk) {
    const ballot = catalog.ballots.find((b) => b.key === election.key);
    const classOf = new Map(election.roll.map((r) => [r.person, r.class]));
    return {
        ballot: election.name,
        document: election.standards.documentTitle,
        version: election.standards.documentVersion,
        recirculation: election.standards.round,
        items: ballot.items.map((it, i) => ({
            index: i, name: it.name, says: it.gist,
            // A ballot still open on the plan's as-of date has no result yet.
            vote: election.expect ? `${election.expect[i].result} (${election.expect[i].approve} approve, ${election.expect[i].disapprove} disapprove, ${election.expect[i].abstain} abstain)` : 'still open',
        })),
        comments: chunk.map((s) => {
            const p = w.person.get(s.person) ?? {};
            const prof = w.profile.get(s.person) ?? {};
            return {
                id: s.comment.key,
                item: s.item,
                stance: s.stance,
                type: s.comment.type,
                writer: {
                    title: p.Title ?? null,
                    business: w.organization.get(String(prof.OrganizationID ?? '').toUpperCase()) ?? null,
                    segment: prof.Segment ?? null,
                    place: [prof.City, prof.State, prof.CountryName].filter(Boolean).join(', ') || null,
                    voting: classOf.get(s.person) === 'Committee' ? 'Standards Committee member' : 'ballot pool member',
                },
                disposition: s.comment.resolution.disposition,
            };
        }),
    };
}

const wordCount = (t) => String(t ?? '').split(/\s+/).filter(Boolean).length;

export function check(entries, b) {
    const problems = [];
    const got = new Map((entries ?? []).map((x) => [String(x.id), x]));
    const businesses = b.comments.map((c) => c.writer.business).filter(Boolean);
    const seen = new Set();
    for (const c of b.comments) {
        const x = got.get(c.id);
        if (!x) { problems.push(`no entry for ${c.id}`); continue; }
        const at = c.id;
        const item = b.items[c.item];
        const mark = markOf(item.name);
        const ref = String(x.reference ?? '').trim();
        if (mark && !ref.startsWith(mark)) problems.push(`${at}: this comment is on item ${c.item} ("${item.name}"), so its reference must start with ${mark}, not "${ref}"`);
        const n = wordCount(x.comment);
        if (n < 15 || n > 110) problems.push(`${at}: comment is ${n} words, keep it to 20–90`);
        const pc = wordCount(x.proposedChange);
        if (pc > 65) problems.push(`${at}: proposedChange is ${pc} words, keep it to 5–50`);
        if (pc === 0 && c.type !== 'General') problems.push(`${at}: a ${c.type} comment needs a proposedChange`);
        if (/^\s*(retain|keep|no change|none|n\/a)\b|\bas (currently )?(written|drafted)\b|\b(affirm|lock in)\b/i.test(x.proposedChange ?? '')) problems.push(`${at}: proposedChange must ask for a change ("${x.proposedChange}")`);
        const r = wordCount(x.response);
        if (r < 8 || r > 90) problems.push(`${at}: response is ${r} words, keep it to 12–70`);
        const fit = FITS[c.disposition];
        if (fit?.must && !fit.must.test(x.response)) problems.push(`${at}: the response doesn't read as ${c.disposition}`);
        if (fit?.not?.test(x.response)) problems.push(`${at}: the response contradicts ${c.disposition} ("${x.response.match(fit.not)[0]}")`);
        const all = [x.reference, x.comment, x.proposedChange, x.response].join(' ');
        for (const other of businesses) if (other !== c.writer.business && all.includes(other)) problems.push(`${at}: names another business (${other})`);
        if (AGENCY.test(all)) problems.push(`${at}: names an agency or regulation ("${all.match(AGENCY)[0]}")`);
        if (HONORIFIC.test(all)) problems.push(`${at}: names a person`);
        if (ERA_WORDING.test(all)) problems.push(`${at}: names the background ("${all.match(ERA_WORDING)[0]}")`);
        if (INVENTED_EVENT.test(all)) problems.push(`${at}: invents an event ("${all.match(INVENTED_EVENT)[0]}")`);
        if (/https?:|www\.|@|#\w/.test(all)) problems.push(`${at}: has a link, address or hashtag`);
        const opening = String(x.comment ?? '').split(/\s+/).slice(0, 5).join(' ').toLowerCase();
        if (seen.has(opening)) problems.push(`${at}: opens like another comment ("${opening}")`);
        seen.add(opening);
    }
    return problems;
}

async function write(b, key) {
    const contents = [{ role: 'user', parts: [{ text: JSON.stringify(b, null, 1) }] }];
    const usage = { in: 0, out: 0 };
    for (let attempt = 1; attempt <= 4; attempt++) {
        const data = await generate(key, contents, { system: SYSTEM, schema: SCHEMA, temperature: 0.8 });
        usage.in += data.usageMetadata?.promptTokenCount ?? 0;
        usage.out += (data.usageMetadata?.candidatesTokenCount ?? 0) + (data.usageMetadata?.thoughtsTokenCount ?? 0);
        const text = data.candidates?.[0]?.content?.parts?.map((p) => p.text ?? '').join('') ?? '';
        let entries;
        try { entries = JSON.parse(text).comments; } catch { entries = null; }
        const problems = check(entries, b);
        if (!problems.length) return { entries, usage, attempts: attempt };
        contents.push({ role: 'model', parts: [{ text }] }, { role: 'user', parts: [{ text: `Fix these problems and return every comment again:\n- ${problems.join('\n- ')}` }] });
        if (attempt === 4) throw new Error(`${b.ballot}: ${problems.slice(0, 5).join('; ')}`);
    }
}

async function main(argv) {
    const only = argv.includes('--election') ? argv[argv.indexOf('--election') + 1] : null;
    const force = argv.includes('--force');
    const plan = JSON.parse(fs.readFileSync(path.join(ROOT, PLAN), 'utf8'));
    const catalog = JSON.parse(fs.readFileSync(path.join(ROOT, STANDARDS), 'utf8'));
    const out = fs.existsSync(path.join(ROOT, OUT)) ? JSON.parse(fs.readFileSync(path.join(ROOT, OUT), 'utf8')) : { comments: {} };
    const w = world();
    const todo = plan.elections.filter((e) => e.family === 'standards-ballot' && (!only || e.key === only))
        .map((e) => ({ e, chunks: slots(e).filter((s) => force || !out.comments[s.comment.key]) }))
        .filter((x) => x.chunks.length)
        .map(({ e, chunks }) => ({ e, chunks: Array.from({ length: Math.ceil(chunks.length / CHUNK) }, (_, i) => chunks.slice(i * CHUNK, (i + 1) * CHUNK)) }));
    if (argv.includes('--dry-run')) {
        if (todo[0]) console.log(JSON.stringify(brief(todo[0].e, catalog, w, todo[0].chunks[0]), null, 1));
        console.log(`${todo.length} ballot(s) would be written`);
        return;
    }
    const key = apiKey();
    const total = { in: 0, out: 0 };
    const save = () => {
        out.comments = Object.fromEntries(Object.entries(out.comments).sort(([a], [b]) => (a < b ? -1 : 1)));
        fs.mkdirSync(path.dirname(path.join(ROOT, OUT)), { recursive: true });
        fs.writeFileSync(path.join(ROOT, OUT), JSON.stringify({ source: 'gemini-3.5-flash-lite via scripts/build-election-comments-gemini.mjs', comments: out.comments }, null, 2) + '\n');
    };
    for (const { e, chunks } of todo) {
        let n = 0;
        for (const chunk of chunks) {
            const r = await write(brief(e, catalog, w, chunk), key);
            for (const x of r.entries) {
                out.comments[x.id] = { reference: x.reference.trim(), comment: x.comment.trim(), proposedChange: x.proposedChange.trim() || null, response: x.response.trim() };
            }
            total.in += r.usage.in; total.out += r.usage.out;
            n += r.entries.length;
        }
        save();
        console.log(`${e.key}: ${n} comments`);
    }
    console.log(`${todo.length} ballot(s) written; ${total.in} in / ${total.out} out tokens, about $${((total.in * 0.30 + total.out * 2.50) / 1e6).toFixed(3)}`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main(process.argv.slice(2)).catch((e) => { console.error(e instanceof Error ? e.message : e); process.exit(1); });
