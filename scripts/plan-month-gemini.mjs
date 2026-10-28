#!/usr/bin/env node
/**
 * plan-month-gemini.mjs — extend the More Cheese dataset by one month: a frontier model decides what happens,
 * this script turns the decisions into records, Loom appends them, and the repo's gates check the result.
 *
 *   node scripts/plan-month-gemini.mjs                       # the month after generated/checkpoint.json
 *   node scripts/plan-month-gemini.mjs --month 2026-10       # a given month (must be the next Loom cycle)
 *   node scripts/plan-month-gemini.mjs --from 2026-07-01     # also cover earlier, empty months in this cycle
 *   node scripts/plan-month-gemini.mjs --dry-run             # print the (first) prompt, call nothing, write nothing
 *   node scripts/plan-month-gemini.mjs --decisions d.json    # apply saved decisions; the model plans any month they lack
 *
 * Why this exists. Monthly accumulate (#128) adds no rows on its own: Loom's intake generator can only invent
 * placeholder rows (MemberFirst12, user12@enterprise12.com), so intake is 0. Amith's direction: each month a
 * frontier model (Gemini 4 Argon or later) decides how the dataset grows, then Loom runs. Loom's
 * `accumulate --plan` (loom#21) appends planned records with its usual guarantees. A model is good at deciding
 * who joins, who lapses and how an event sells, and bad at bookkeeping (order numbers, status shapes,
 * payments, address links), so the work is split:
 *
 *   1. BRIEF    — computed here from generated/: members whose membership comes due in the window, last year's
 *                 volumes for the same window, paid events and how they sold before, the window's blog posts,
 *                 known cities and organizations, the era. The model has no tools.
 *   2. DECIDE   — the model returns DECISIONS JSON: named new members, lapses and tier changes among the due
 *                 members, unpaid renewals, and how many registrations each event takes (plus anyone it wants
 *                 to name). Checked here against the brief before anything is compiled.
 *   3. COMPILE  — decisions become a Loom plan in the shapes generated/ already uses (people, member profiles,
 *                 addresses, contact methods, employment, dues and registration orders with lines, event order
 *                 lines, payments). Everyone due who is not lapsed renews. Registrants beyond the named ones are
 *                 drawn by past attendance and region. All draws are seeded by the window, so a re-run of the
 *                 same decisions compiles to the same plan.
 *   4. APPLY    — `loom accumulate --plan`, then `npm run generate` (which keeps planned values, see
 *                 generate.mjs), then check-metadata-closure, validate:loom and check:ownership. On any failure
 *                 generated/ is restored from a snapshot taken before step 4 and the problems go back to the
 *                 model as the next turn; after --attempts tries nothing is kept.
 *
 * Several months in one cycle (--from). Loom applies one plan per cycle, but one model call for four months
 * would be four times the output and blind to its own earlier months. So the window is split into calendar
 * months, decided in order, each with a brief built from generated/ as it stands with the earlier months
 * applied: August's model sees July's joins as members, their names as taken and their bookings as sold.
 * Each step re-applies the whole cycle's plan so far onto the snapshot taken before the first, so a failure
 * only ever loses the month being decided; if a month still fails after --attempts, nothing is kept and the
 * months already decided go to <month>.partial.decisions.json in --logdir, which --decisions resumes from.
 *
 * What it writes on success: generated/ (the appended records), data/plans/<YYYY-MM>.plan.json (the Loom plan,
 * which generate.mjs reads) and data/plans/<YYYY-MM>.decisions.json ({ segments: [{ window, ...decisions }] },
 * the model's decisions per month, the "why"). Logs, prompts and every attempt go to --logdir. Never runs git.
 *
 * Not modeled yet: course enrollments, committee activity, advocacy, issues, new organizations, free webinars.
 * Registrations are dated inside the window and carry their final attendance, because accumulate is
 * append-only and cannot move a registration from Registered to Attended next month.
 *
 * Key: GEMINI_API_KEY, else AI_VENDOR_API_KEY__GeminiLLM, from the environment or from the .env file named by
 * GEMINI_ENV_FILE (e.g. GEMINI_ENV_FILE=~/Projects/MJ/.env), or GEMINI_KEY_FROM_PROXY=1 where a cloud network
 * secret adds the header. The key is never logged. Loom: --loom <checkout>,
 * else LOOM_DIR, else ../loom-plan or ../loom; the checkout must have `accumulate --plan` built.
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';

const ROOT = process.cwd();
const ICF_COMPANY = 'E8A1D92C-38A2-51E7-8FB2-12C9B7A65D30';
const EMPLOYEE_OF = '27CFD031-5663-4000-A7AB-8AC87DB88C1D';
const PAYMENT_TYPES = [['2F1A6D30-0C41-4E7B-9E51-0A1B7C2D3E01', 0.86], ['2F1A6D30-0C41-4E7B-9E51-0A1B7C2D3E04', 0.11], ['2F1A6D30-0C41-4E7B-9E51-0A1B7C2D3E02', 0.03]];
const TIERS = { Enthusiast: 'PROD-MEM-ENTHUSIAST', Individual: 'PROD-MEM-INDIVIDUAL', SmallBusiness: 'PROD-MEM-SMALLBUSINESS', Corporate: 'PROD-MEM-CORPORATE' };
const JOURNAL = 'PROD-PUB-JOURNAL';
const EVENT_PRODUCT = { Workshop: 'PROD-EVT-WORKSHOP', Conference: 'PROD-EVT-CONFERENCE' };
const SEGMENTS = ['Producer', 'Retailer', 'Supplier', 'Enthusiast', 'Educator'];
const GENDERS = ['Female', 'Male', 'Non-binary'];
const LOOKAHEAD_DAYS = 75;
const PERSON = '@lookup:MJ: Entities.Name=MJ_BizApps_Common: People';
const contactType = (n) => `@lookup:MJ_BizApps_Common: Contact Types.Name=${n}`;
const addressType = (n) => `@lookup:MJ_BizApps_Common: Address Types.Name=${n}`;

// ── dates and draws ──
const day = (v) => (v == null ? '' : String(v).slice(0, 10));
const addDays = (iso, n) => new Date(Date.parse(`${iso}T00:00:00Z`) + n * 86400000).toISOString().slice(0, 10);
const daysBetween = (a, b) => Math.round((Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`)) / 86400000);
export function addMonths(iso, n) {
    const [y, m, d] = iso.split('-').map(Number);
    const t = new Date(Date.UTC(y, m - 1 + n, 1));
    const last = new Date(Date.UTC(t.getUTCFullYear(), t.getUTCMonth() + 1, 0)).getUTCDate();
    return new Date(Date.UTC(t.getUTCFullYear(), t.getUTCMonth(), Math.min(d, last))).toISOString().slice(0, 10);
}
export function monthEnd(ym) {
    const [y, m] = ym.split('-').map(Number);
    return new Date(Date.UTC(y, m, 0)).toISOString().slice(0, 10);
}
export function rng(seedText) {
    let h = 1779033703 ^ seedText.length;
    for (let i = 0; i < seedText.length; i++) { h = Math.imul(h ^ seedText.charCodeAt(i), 3432918353); h = (h << 13) | (h >>> 19); }
    let a = h >>> 0;
    const next = () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
    return {
        next,
        int: (lo, hi) => lo + Math.floor(next() * (hi - lo + 1)),
        pick: (xs) => xs[Math.floor(next() * xs.length)],
        weighted: (pairs) => { const tot = pairs.reduce((s, [, w]) => s + w, 0); let r = next() * tot; for (const [v, w] of pairs) { if ((r -= w) < 0) return v; } return pairs[pairs.length - 1][0]; },
    };
}
export const slug = (s) => String(s).normalize('NFKD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]/g, '');

// ── world: generated/ as the planner needs it ──
function loadDir(root, dir) {
    const d = path.join(root, 'generated', dir);
    if (!fs.existsSync(d)) return [];
    return fs.readdirSync(d).filter((f) => f.endsWith('.json') && f !== '.mj-sync.json').sort()
        .flatMap((f) => { const j = JSON.parse(fs.readFileSync(path.join(d, f), 'utf8')); return Array.isArray(j) ? j : []; });
}
const up = (v) => (v == null ? '' : String(v).toUpperCase());
const flat = (r) => ({ id: up(r.primaryKey?.ID), ...r.fields });

export function loadWorld(root = ROOT) {
    const products = loadDir(root, 'products').map(flat);
    const productById = new Map(products.map((p) => [p.id, p]));
    const productBySku = new Map(products.map((p) => [p.SKU, p]));
    const people = loadDir(root, 'people').map(flat);
    const personById = new Map(people.map((p) => [p.id, p]));
    const profiles = loadDir(root, 'member-profiles').map(flat);
    const profileByPerson = new Map(profiles.map((m) => [up(m.PersonID), m]));
    const profileByNumber = new Map(profiles.map((m) => [m.MemberNumber, m]));
    const orgs = loadDir(root, 'organizations').map(flat);
    const orgById = new Map(orgs.map((o) => [o.id, o]));
    const orgProfiles = new Map(loadDir(root, 'organization-profiles').map(flat).map((p) => [up(p.OrganizationID), p]));
    const orders = [];
    const lines = [];
    for (const r of loadDir(root, 'orders')) {
        const o = flat(r);
        o.OrderDate = day(o.OrderDate);
        o.lines = (r.collections?.Lines ?? []).map((lr) => ({ ...flat(lr), order: o, sku: productById.get(up(lr.fields?.ProductID))?.SKU, event: lr.extension?.fields ?? null }));
        orders.push(o);
        lines.push(...o.lines);
    }
    const contacts = loadDir(root, 'contact-methods').map(flat);
    const calendar = JSON.parse(fs.readFileSync(path.join(root, 'content', 'event-calendar.json'), 'utf8')).events;
    const eras = JSON.parse(fs.readFileSync(path.join(root, 'data', 'ruleset', 'eras.json'), 'utf8')).eras;
    const checkpoint = JSON.parse(fs.readFileSync(path.join(root, 'generated', 'checkpoint.json'), 'utf8'));
    return { products, productById, productBySku, people, personById, profiles, profileByPerson, profileByNumber, orgs, orgById, orgProfiles, orders, lines, contacts, calendar, eras, checkpoint, root };
}

const isMembershipSku = (sku) => Object.values(TIERS).includes(sku);
const tierOfSku = (sku) => Object.keys(TIERS).find((t) => TIERS[t] === sku);
const reversedIds = (w) => new Set(w.orders.filter((o) => o.ReversesOrderHeaderID).map((o) => up(o.ReversesOrderHeaderID)));

/** Confirmed, un-reversed membership purchases per person, oldest first (vault-facts' Membership Status rule). */
export function membershipHistory(w) {
    const reversed = reversedIds(w);
    const out = new Map();
    for (const o of w.orders) {
        if (o.Status !== 'Confirmed' || o.ReversesOrderHeaderID || reversed.has(o.id)) continue;
        const mem = o.lines.find((l) => isMembershipSku(l.sku) && !l.ReversesOrderLineID);
        if (!mem) continue;
        const person = up(o.BillToPersonID);
        if (!out.has(person)) out.set(person, []);
        out.get(person).push({ date: o.OrderDate, tier: tierOfSku(mem.sku), journal: o.lines.some((l) => l.sku === JOURNAL), orderNumber: o.OrderNumber });
    }
    for (const list of out.values()) list.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
    return out;
}

/** Highest dues period number used per member number (ORD-D-ICF-100949-P6 → 6), counting every status. */
function duesPeriods(w) {
    const out = new Map();
    for (const o of w.orders) {
        const m = /^ORD-[DR]-(ICF-[0-9A-Z]+)-P(\d+)$/.exec(o.OrderNumber);
        if (m) out.set(m[1], Math.max(out.get(m[1]) ?? 0, Number(m[2])));
    }
    return out;
}

function attendedSince(w, since) {
    const out = new Map();
    for (const l of w.lines) {
        if (l.event?.AttendanceStatus !== 'Attended' || l.order.OrderDate < since) continue;
        const p = up(l.event.PersonID);
        out.set(p, (out.get(p) ?? 0) + 1);
    }
    return out;
}

/** Members whose latest purchase comes up for its anniversary inside the window. */
export function dueRenewals(w, win) {
    const hist = membershipHistory(w);
    const periods = duesPeriods(w);
    const attended = attendedSince(w, addMonths(win.asOf, -24));
    const due = [];
    for (const [person, list] of hist) {
        const last = list[list.length - 1];
        const anniversary = addMonths(last.date, 12);
        if (anniversary < win.from || anniversary > win.asOf) continue;
        const prof = w.profileByPerson.get(person);
        const who = w.personById.get(person);
        if (!prof || !who) continue;
        due.push({
            memberNumber: prof.MemberNumber, personId: person, name: `${who.FirstName} ${who.LastName}`, segment: prof.Segment, tier: last.tier,
            journal: last.journal, lastPurchase: last.date, anniversary, years: list.length, period: periods.get(prof.MemberNumber) ?? list.length,
            attended24mo: attended.get(person) ?? 0, country: prof.Country, org: prof.OrganizationID ? w.orgById.get(up(prof.OrganizationID))?.Name ?? null : null,
        });
    }
    return due.sort((a, b) => (a.anniversary < b.anniversary ? -1 : a.anniversary > b.anniversary ? 1 : a.memberNumber < b.memberNumber ? -1 : 1));
}

export function currentMembers(w, asOf, hist = membershipHistory(w)) {
    const from = addMonths(asOf, -12);
    const out = [];
    for (const [person, list] of hist) {
        const latest = list.filter((p) => p.date <= asOf).pop();
        if (latest && latest.date > from) out.push(person);
    }
    return out;
}

const EVENT_KEY = /(EVT-\d{4}-[A-Z0-9]+)$/;
function registrationsByEvent(w) {
    const out = new Map();
    for (const o of w.orders) {
        const m = /^ORD-E-REG-/.test(o.OrderNumber) && EVENT_KEY.exec(o.OrderNumber);
        if (!m) continue;
        if (!out.has(m[1])) out.set(m[1], []);
        out.get(m[1]).push(o);
    }
    return out;
}

/** Past paid events of a type: registrations, attendance rate, and how many days before the event people booked. */
export function eventHistory(w, type, before) {
    const regs = registrationsByEvent(w);
    const past = w.calendar.filter((e) => e.EventType === type && e.IsPaid && e.EventDate < before);
    const counts = [];
    const leads = [];
    let attended = 0, finished = 0;
    for (const e of past) {
        const orders = (regs.get(e.EventKey) ?? []).filter((o) => o.Status === 'Confirmed');
        if (!orders.length) continue;
        counts.push({ key: e.EventKey, date: e.EventDate, registrations: orders.length });
        for (const o of orders) {
            leads.push(Math.max(0, daysBetween(o.OrderDate, e.EventDate)));
            const st = o.lines.find((l) => l.event)?.event?.AttendanceStatus;
            if (st === 'Attended') { attended++; finished++; } else if (st === 'No Show') finished++;
        }
    }
    return { recent: counts.slice(-4), leads: leads.sort((a, b) => a - b), attendanceRate: finished ? attended / finished : 0.92 };
}

const regionOfCountry = (w) => {
    const tally = new Map();
    for (const p of w.profiles) {
        const k = `${p.Country}|${p.Region}`;
        tally.set(k, (tally.get(k) ?? 0) + 1);
    }
    const best = new Map();
    for (const [k, n] of tally) { const [c, r] = k.split('|'); if ((best.get(c)?.[1] ?? 0) < n) best.set(c, [r, n]); }
    return new Map([...best].map(([c, [r]]) => [c, r]));
};
const eventCountry = (e) => (e.State && /^[A-Z]{2}-/.test(e.State) ? e.State.slice(0, 2) : e.State ? 'US' : null);

/** Cities members already live in, with the coordinates and country facts a profile needs. */
export function knownCities(w) {
    const out = new Map();
    for (const p of w.profiles) {
        const key = `${p.City}|${p.State}|${p.Country}`;
        if (!out.has(key)) out.set(key, { city: p.City, state: p.State, country: p.Country, countryName: p.CountryName, region: p.Region, lat: p.Latitude, lon: p.Longitude, members: 0, langs: new Map() });
        const c = out.get(key);
        c.members++;
        c.langs.set(p.PrimaryLanguage, (c.langs.get(p.PrimaryLanguage) ?? 0) + 1);
    }
    return [...out.values()].map((c) => ({ ...c, language: [...c.langs].sort((a, b) => b[1] - a[1])[0][0], langs: undefined })).sort((a, b) => b.members - a.members);
}

function baselineLastYear(w, win, hist) {
    const from = addMonths(win.from, -12), to = addMonths(win.asOf, -12);
    let joins = 0, renewals = 0;
    const joinTiers = {};
    for (const list of hist.values()) {
        list.forEach((p, i) => {
            if (p.date < from || p.date > to) return;
            if (i === 0) { joins++; joinTiers[p.tier] = (joinTiers[p.tier] ?? 0) + 1; } else renewals++;
        });
    }
    let due = 0, renewed = 0;
    for (const list of hist.values()) {
        for (let i = 0; i < list.length; i++) {
            const ann = addMonths(list[i].date, 12);
            if (ann < from || ann > to) continue;
            due++;
            if (list[i + 1] && daysBetween(ann, list[i + 1].date) <= 90) renewed++;
        }
    }
    return { window: { from, to }, joins, joinTiers, renewalOrders: renewals, due, renewedWithin90Days: renewed, renewalRate: due ? Math.round((renewed / due) * 1000) / 1000 : null };
}

function blogInWindow(root, win) {
    const out = [];
    for (const y of new Set([win.from.slice(0, 4), win.asOf.slice(0, 4)])) {
        const dir = path.join(root, 'content', 'blog', y);
        if (!fs.existsSync(dir)) continue;
        for (const f of fs.readdirSync(dir).filter((f) => f.endsWith('.md')).sort()) {
            const d = f.slice(0, 10);
            if (d < win.from || d > win.asOf) continue;
            const text = fs.readFileSync(path.join(dir, f), 'utf8');
            const title = /^title:\s*"?(.*?)"?\s*$/m.exec(text)?.[1] ?? f;
            const excerpt = /^excerpt:\s*"?(.*?)"?\s*$/m.exec(text)?.[1] ?? '';
            const category = /^category:\s*"?(.*?)"?\s*$/m.exec(text)?.[1] ?? '';
            out.push({ date: d, title, category, excerpt });
        }
    }
    return out;
}

function priorPlans(root) {
    const dir = path.join(root, 'data', 'plans');
    if (!fs.existsSync(dir)) return [];
    return fs.readdirSync(dir).filter((f) => f.endsWith('.decisions.json')).sort().slice(-6)
        .flatMap((f) => segmentsOf(JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8')), f.replace('.decisions.json', '')))
        .map((s) => ({ window: typeof s.window === 'string' ? s.window : `${s.window.from}..${s.window.asOf}`, summary: s.summary })).slice(-6);
}

/** A decisions file's months: { segments: [...] }, or one bare DECISIONS object for the whole cycle. */
export function segmentsOf(file, label) {
    return Array.isArray(file?.segments) ? file.segments : [{ window: label, ...file }];
}

/** The window as calendar months, oldest first; the first starts at win.from and the last ends at win.asOf. */
export function monthSegments(win) {
    const out = [];
    for (let m = win.from.slice(0, 7); m <= win.asOf.slice(0, 7); m = addMonths(`${m}-01`, 1).slice(0, 7)) {
        out.push({ from: out.length ? `${m}-01` : win.from, asOf: m === win.asOf.slice(0, 7) ? win.asOf : monthEnd(m) });
    }
    return out;
}

/** Everything the model may use, and everything the checks and the compiler need. */
export function buildBrief(w, win) {
    const hist = membershipHistory(w);
    const due = dueRenewals(w, win);
    const regs = registrationsByEvent(w);
    const regionOf = regionOfCountry(w);
    const events = w.calendar
        .filter((e) => e.IsPaid && EVENT_PRODUCT[e.EventType] && e.EventDate >= win.from && e.EventDate <= addDays(win.asOf, LOOKAHEAD_DAYS))
        .map((e) => {
            const h = eventHistory(w, e.EventType, win.from);
            const already = (regs.get(e.EventKey) ?? []).filter((o) => o.Status === 'Confirmed').length;
            const typical = h.recent.length ? Math.round(h.recent.reduce((s, r) => s + r.registrations, 0) / h.recent.length) : 0;
            // Share of a typical event's bookings that fall inside this window, from the observed lead times
            const lo = Math.max(0, daysBetween(win.asOf, e.EventDate)), hi = daysBetween(win.from, e.EventDate);
            const share = h.leads.length ? h.leads.filter((d) => d >= lo && d <= hi).length / h.leads.length : 0;
            const country = eventCountry(e);
            return {
                eventKey: e.EventKey, name: e.Name, type: e.EventType, date: e.EventDate, city: e.City, state: e.State, region: country ? regionOf.get(country) ?? 'RoW' : null,
                price: w.productBySku.get(EVENT_PRODUCT[e.EventType])?.StandaloneSellingPrice, alreadyRegistered: already,
                typicalRegistrations: typical, expectedInWindow: Math.round(typical * share), recentComparable: h.recent, attendanceRate: Math.round(h.attendanceRate * 1000) / 1000,
                leads: h.leads,
            };
        });
    const era = w.eras.find((e) => e.cycles.includes(Number(win.asOf.slice(0, 4))));
    const domains = new Map();
    for (const p of w.people) {
        if (w.profileByPerson.get(p.id)?.OrganizationID) continue;
        const d = String(p.Email).split('@')[1];
        domains.set(d, (domains.get(d) ?? 0) + 1);
    }
    const personalDomains = [...domains].filter(([, n]) => n >= 50).map(([d]) => d).sort();
    const orgs = w.orgs.filter((o) => o.Status === 'Active').map((o) => {
        const p = w.orgProfiles.get(o.id);
        return { name: o.Name, type: p?.Type ?? null, country: p?.Country ?? null, city: p?.City ?? null, domain: o.Website ? String(o.Website).replace(/^https?:\/\/(www\.)?/, '').replace(/\/.*$/, '') : null };
    }).sort((a, b) => (a.name < b.name ? -1 : 1));
    const memberNumbers = w.profiles.map((p) => p.MemberNumber).filter((n) => /^ICF-\d{6}$/.test(n)).sort();
    return {
        window: win, era: era ? { key: era.eraKey, description: era.description } : null,
        currentMembers: currentMembers(w, addDays(win.from, -1), hist).length,
        lastYear: baselineLastYear(w, win, hist),
        due, events, blog: blogInWindow(w.root, win), cities: knownCities(w), orgs, personalDomains,
        prices: Object.fromEntries([...Object.entries(TIERS), ['Journal', JOURNAL]].map(([t, sku]) => [t, w.productBySku.get(sku)?.StandaloneSellingPrice])),
        nextMemberNumber: Number(memberNumbers[memberNumbers.length - 1]?.slice(4) ?? 100000) + 1,
        priorPlans: priorPlans(w.root),
    };
}

// ── the model's decisions ──
export const DECISIONS_SCHEMA = {
    type: 'OBJECT',
    properties: {
        summary: { type: 'STRING' },
        joins: {
            type: 'ARRAY',
            items: {
                type: 'OBJECT',
                properties: {
                    key: { type: 'STRING' }, firstName: { type: 'STRING' }, lastName: { type: 'STRING' }, gender: { type: 'STRING', enum: GENDERS },
                    title: { type: 'STRING' }, segment: { type: 'STRING', enum: SEGMENTS }, tier: { type: 'STRING', enum: Object.keys(TIERS) },
                    city: { type: 'STRING' }, country: { type: 'STRING' }, organization: { type: 'STRING', nullable: true }, addressLine1: { type: 'STRING' },
                    postalCode: { type: 'STRING' }, date: { type: 'STRING' }, journal: { type: 'BOOLEAN' }, why: { type: 'STRING' },
                },
                required: ['key', 'firstName', 'lastName', 'gender', 'title', 'segment', 'tier', 'city', 'country', 'addressLine1', 'postalCode', 'date', 'journal'],
            },
        },
        lapses: { type: 'ARRAY', items: { type: 'OBJECT', properties: { memberNumber: { type: 'STRING' }, reason: { type: 'STRING' } }, required: ['memberNumber', 'reason'] } },
        tierChanges: { type: 'ARRAY', items: { type: 'OBJECT', properties: { memberNumber: { type: 'STRING' }, tier: { type: 'STRING', enum: Object.keys(TIERS) }, reason: { type: 'STRING' } }, required: ['memberNumber', 'tier', 'reason'] } },
        unpaidRenewals: { type: 'ARRAY', items: { type: 'STRING' } },
        registrations: {
            type: 'ARRAY',
            items: {
                type: 'OBJECT',
                properties: { eventKey: { type: 'STRING' }, count: { type: 'INTEGER' }, attendanceRate: { type: 'NUMBER' }, include: { type: 'ARRAY', items: { type: 'STRING' } }, why: { type: 'STRING' } },
                required: ['eventKey', 'count'],
            },
        },
    },
    required: ['summary', 'joins', 'lapses', 'tierChanges', 'unpaidRenewals', 'registrations'],
};

const cityKey = (city, country) => `${String(city).toLowerCase()}|${String(country).toUpperCase()}`;

/** Every way the decisions disagree with the brief; empty when they can be compiled. */
export function checkDecisions(d, brief, w) {
    const problems = [];
    if (!d || typeof d !== 'object') return ['the reply is not a DECISIONS object'];
    for (const k of ['joins', 'lapses', 'tierChanges', 'unpaidRenewals', 'registrations']) if (!Array.isArray(d[k])) problems.push(`${k} must be an array`);
    if (problems.length) return problems;
    if (!String(d.summary ?? '').trim()) problems.push('summary is empty');
    const { from, asOf } = brief.window;
    const due = new Map(brief.due.map((m) => [m.memberNumber, m]));
    const cities = new Map(brief.cities.map((c) => [cityKey(c.city, c.country), c]));
    const orgs = new Map(brief.orgs.map((o) => [o.name, o]));
    const keys = new Set();
    const names = new Set(w.people.map((p) => `${p.FirstName} ${p.LastName}`.toLowerCase()));
    d.joins.forEach((j, i) => {
        const at = `joins[${i}] (${j.key ?? '?'})`;
        if (!j.key || keys.has(j.key)) problems.push(`${at}: key must be present and unique`);
        keys.add(j.key);
        if (!/^\p{L}[\p{L}' .-]*$/u.test(j.firstName ?? '') || !/^\p{L}[\p{L}' .-]*$/u.test(j.lastName ?? '')) problems.push(`${at}: firstName and lastName must be plain names`);
        const full = `${j.firstName} ${j.lastName}`.toLowerCase();
        if (names.has(full)) problems.push(`${at}: ${j.firstName} ${j.lastName} already exists in the dataset; pick another name`);
        names.add(full);
        if (!GENDERS.includes(j.gender)) problems.push(`${at}: gender must be one of ${GENDERS.join(', ')}`);
        if (!SEGMENTS.includes(j.segment)) problems.push(`${at}: segment must be one of ${SEGMENTS.join(', ')}`);
        if (!TIERS[j.tier]) problems.push(`${at}: tier must be one of ${Object.keys(TIERS).join(', ')}`);
        if ((j.segment === 'Enthusiast') !== (j.tier === 'Enthusiast')) problems.push(`${at}: the Enthusiast tier is for (and only for) the Enthusiast segment`);
        if (!cities.has(cityKey(j.city, j.country))) problems.push(`${at}: city ${j.city}, ${j.country} is not in KNOWN CITIES (use the city and country code exactly as listed)`);
        if (j.organization != null && !orgs.has(j.organization)) problems.push(`${at}: organization "${j.organization}" is not in ORGANIZATIONS (use the exact name, or null)`);
        if (['SmallBusiness', 'Corporate'].includes(j.tier) && j.organization == null) problems.push(`${at}: a ${j.tier} membership needs an organization`);
        if (!/^\d{4}-\d{2}-\d{2}$/.test(j.date ?? '') || j.date < from || j.date > asOf) problems.push(`${at}: date must be inside the window ${from}..${asOf}`);
        if (!String(j.title ?? '').trim() || !String(j.addressLine1 ?? '').trim() || !String(j.postalCode ?? '').trim()) problems.push(`${at}: title, addressLine1 and postalCode are required`);
    });
    const lapsed = new Set();
    for (const [i, l] of d.lapses.entries()) {
        if (!due.has(l.memberNumber)) problems.push(`lapses[${i}]: ${l.memberNumber} is not in DUE RENEWALS`);
        if (lapsed.has(l.memberNumber)) problems.push(`lapses[${i}]: ${l.memberNumber} is listed twice`);
        lapsed.add(l.memberNumber);
    }
    const changed = new Set();
    for (const [i, t] of d.tierChanges.entries()) {
        const m = due.get(t.memberNumber);
        if (!m) { problems.push(`tierChanges[${i}]: ${t.memberNumber} is not in DUE RENEWALS`); continue; }
        if (lapsed.has(t.memberNumber)) problems.push(`tierChanges[${i}]: ${t.memberNumber} also lapses`);
        if (changed.has(t.memberNumber)) problems.push(`tierChanges[${i}]: ${t.memberNumber} is listed twice`);
        changed.add(t.memberNumber);
        if (!TIERS[t.tier] || t.tier === m.tier) problems.push(`tierChanges[${i}]: ${t.memberNumber} is already ${m.tier}; give a different tier`);
        if ((m.segment === 'Enthusiast') !== (t.tier === 'Enthusiast')) problems.push(`tierChanges[${i}]: the Enthusiast tier is for (and only for) the Enthusiast segment`);
    }
    for (const [i, n] of d.unpaidRenewals.entries()) {
        if (!due.has(n)) problems.push(`unpaidRenewals[${i}]: ${n} is not in DUE RENEWALS`);
        else if (lapsed.has(n)) problems.push(`unpaidRenewals[${i}]: ${n} lapses, so has no renewal to leave unpaid`);
    }
    const events = new Map(brief.events.map((e) => [e.eventKey, e]));
    const seenEvents = new Set();
    for (const [i, r] of d.registrations.entries()) {
        const e = events.get(r.eventKey);
        if (!e) { problems.push(`registrations[${i}]: ${r.eventKey} is not in EVENTS`); continue; }
        if (seenEvents.has(r.eventKey)) problems.push(`registrations[${i}]: ${r.eventKey} is listed twice`);
        seenEvents.add(r.eventKey);
        if (!Number.isInteger(r.count) || r.count < 0) problems.push(`registrations[${i}]: count must be a whole number ≥ 0`);
        if (r.attendanceRate != null && !(r.attendanceRate >= 0.5 && r.attendanceRate <= 1)) problems.push(`registrations[${i}]: attendanceRate must be between 0.5 and 1`);
        const include = r.include ?? [];
        if (include.length > r.count) problems.push(`registrations[${i}]: include names ${include.length} people but count is ${r.count}`);
        for (const n of include) {
            if (!keys.has(n) && !w.profileByNumber.has(n)) problems.push(`registrations[${i}]: include ${n} is neither a join key nor a member number`);
            const j = d.joins.find((x) => x.key === n);
            if (j && j.date > e.date) problems.push(`registrations[${i}]: ${n} joins ${j.date}, after the event on ${e.date}`);
        }
    }
    return problems;
}

// ── compile decisions into a Loom plan ──
function orderShape({ number, date, personRef, personLookup, lines, paid }) {
    const total = lines.reduce((s, l) => s + l.price, 0);
    const physical = lines.some((l) => l.physical);
    const status = physical ? (paid ? 'Fulfilled' : 'Pending') : 'NotApplicable';
    const bill = personRef ? { ref: personRef } : personLookup;
    return {
        order: {
            entity: 'Order', ref: number, fields: {
                OrderNumber: number, OrderType: 'Sale', OrderDate: date, Status: 'Confirmed', CompanyID: ICF_COMPANY, BillToPersonID: bill,
                TotalGross: total, AmountPaid: paid ? total : 0, Balance: paid ? 0 : total, DueDate: paid ? date : addDays(date, 30), Origin: 'Online',
                FulfillmentStatus: status, InitialPaymentAmount: 0,
            },
        },
        lines: lines.map((l, i) => ({
            entity: 'OrderLine', ref: `${number}#${i + 1}`, fields: {
                OrderHeaderID: { ref: number }, ProductID: { lookup: { SKU: l.sku } }, CompanyID: ICF_COMPANY, LineNumber: i + 1, Quantity: 1, UnitPrice: l.price,
                DiscountPct: 0, DiscountAmount: 0, ChargeAmount: 0, LineTax: 0, IsRollupParent: false, IsQuantityOverridden: false,
                FulfillmentStatus: l.physical && !paid ? 'Pending' : 'Fulfilled', Description: l.name, LineTotalNet: l.price, LineTotalGross: l.price,
            },
        })),
        total,
    };
}
function paymentShape({ number, date, bill, total, r }) {
    const pmt = number.replace(/^ORD-/, 'PMT-');
    return [
        { entity: 'Payment', ref: pmt, fields: { PaymentNumber: pmt, ReceivingCompanyID: ICF_COMPANY, BillToPersonID: bill, PaymentDate: date, PaymentTypeID: r.weighted(PAYMENT_TYPES), Amount: total, ProcessingFeeAmount: 0, Status: 'Captured' } },
        { entity: 'PaymentLine', fields: { PaymentHeaderID: { ref: pmt }, OrderHeaderID: { ref: number }, Amount: total, AllocatedAt: `${date}T00:00:00Z` } },
    ];
}
const sampleBy = (rows, key, r) => {
    const tally = new Map();
    for (const x of rows) tally.set(x[key] ?? null, (tally.get(x[key] ?? null) ?? 0) + 1);
    return r.weighted([...tally]);
};
function phoneLike(w, country, r) {
    const sameCountry = w.contacts.filter((c) => c.ContactTypeID === contactType('Mobile Phone') && w.profileByPerson.get(up(c.PersonID))?.Country === country);
    const model = sameCountry.length ? r.pick(sameCountry).Value : '+1 (555) 010-0000';
    const [cc, rest] = /^(\+\d+)(.*)$/.exec(model)?.slice(1) ?? ['', model];
    return cc + rest.replace(/\d/g, () => String(r.int(0, 9)));
}

/** The Loom plan for the decisions. Deterministic for the same world, window and decisions. */
export function compilePlan(d, brief, w) {
    const { from, asOf } = brief.window;
    const r = rng(`more-cheese-plan:${from}:${asOf}`);
    const records = [];
    const product = (sku) => { const p = w.productBySku.get(sku); return { sku, price: Number(p.StandaloneSellingPrice), name: p.Name, physical: sku === JOURNAL }; };
    const cities = new Map(brief.cities.map((c) => [cityKey(c.city, c.country), c]));
    const orgs = new Map(brief.orgs.map((o) => [o.name, o]));
    const unpaid = new Set(d.unpaidRenewals);
    const joinRef = new Map();
    let memberNo = brief.nextMemberNumber;

    // New members: person, profile, address, contacts, employment, first dues order and its payment
    for (const j of [...d.joins].sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0))) {
        const number = `ICF-${String(memberNo++).padStart(6, '0')}`;
        const c = cities.get(cityKey(j.city, j.country));
        const org = j.organization ? orgs.get(j.organization) : null;
        const domain = org?.domain ?? r.pick(brief.personalDomains);
        const email = `${slug(j.firstName)}.${slug(j.lastName)}.${number.slice(4)}@${domain}`;
        const p = `person:${number}`;
        joinRef.set(j.key, { ref: p, number, date: j.date, region: c.region });
        records.push({ entity: 'Person', ref: p, fields: { FirstName: j.firstName, LastName: j.lastName, Email: email, Title: j.title, Gender: j.gender, Status: 'Active' } });
        records.push({
            entity: 'MemberProfile', fields: {
                PersonID: { ref: p }, OrganizationID: org ? { lookup: { Name: org.name } } : null, MemberNumber: number, Segment: j.segment, Region: c.region,
                Country: c.country, CountryName: c.countryName, City: c.city, State: c.state, AddressLine1: j.addressLine1, AddressLine2: null, PostalCode: j.postalCode,
                Latitude: c.lat, Longitude: c.lon, JoinDate: j.date, RaceEthnicity: sampleBy(w.profiles, 'RaceEthnicity', r), EthnicityHispanic: sampleBy(w.profiles, 'EthnicityHispanic', r),
                PrimaryLanguage: c.language, IsSharedDemo: true,
            },
        });
        records.push({ entity: 'Address', ref: `address:${number}`, fields: { Line1: j.addressLine1, Line2: null, City: c.city, StateProvince: String(c.state).replace(/^[A-Z]{2}-/, ''), PostalCode: j.postalCode, Country: c.countryName, Latitude: c.lat, Longitude: c.lon } });
        records.push({ entity: 'AddressLink', fields: { AddressID: { ref: `address:${number}` }, EntityID: PERSON, RecordID: { ref: p }, AddressTypeID: addressType(org ? 'Work' : 'Home'), IsPrimary: true, Rank: 1 } });
        records.push({ entity: 'ContactMethod', fields: { PersonID: { ref: p }, OrganizationID: null, ContactTypeID: contactType('Email'), Value: email, Label: 'Work', IsPrimary: true } });
        if (r.next() < 0.6) records.push({ entity: 'ContactMethod', fields: { PersonID: { ref: p }, OrganizationID: null, ContactTypeID: contactType('Mobile Phone'), Value: phoneLike(w, c.country, r), Label: 'Mobile', IsPrimary: true } });
        if (org) records.push({ entity: 'Relationship', fields: { RelationshipTypeID: EMPLOYEE_OF, FromPersonID: { ref: p }, FromOrganizationID: null, ToPersonID: null, ToOrganizationID: { lookup: { Name: org.name } }, Title: j.title, StartDate: j.date, EndDate: null, Status: 'Active', Notes: null } });
        const num = `ORD-D-${number}-P1`;
        const lines = [product(TIERS[j.tier]), ...(j.journal ? [product(JOURNAL)] : [])];
        const o = orderShape({ number: num, date: j.date, personRef: p, lines, paid: true });
        records.push(o.order, ...o.lines, ...paymentShape({ number: num, date: j.date, bill: { ref: p }, total: o.total, r }));
    }

    // Renewals: everyone due who does not lapse, at their tier (or the new one), on or near the anniversary
    const lapsed = new Set(d.lapses.map((l) => l.memberNumber));
    const tierOf = new Map(d.tierChanges.map((t) => [t.memberNumber, t.tier]));
    for (const m of brief.due) {
        if (lapsed.has(m.memberNumber)) continue;
        let date = addDays(m.anniversary, r.int(-10, 6));
        if (date < from) date = from;
        if (date > asOf) date = asOf;
        const num = `ORD-D-${m.memberNumber}-P${m.period + 1}`;
        const lines = [product(TIERS[tierOf.get(m.memberNumber) ?? m.tier]), ...(m.journal ? [product(JOURNAL)] : [])];
        const paid = !unpaid.has(m.memberNumber);
        const bill = { lookup: { Email: w.personById.get(m.personId).Email } };
        const o = orderShape({ number: num, date, personLookup: bill, lines, paid });
        records.push(o.order, ...o.lines);
        if (paid) records.push(...paymentShape({ number: num, date, bill, total: o.total, r }));
    }

    // Event registrations: the named people first, then a draw weighted by past attendance and region
    const hist = membershipHistory(w);
    // Members at the start of the window, less the ones who lapse in it (renewals are not in generated/ yet)
    const members = currentMembers(w, addDays(from, -1), hist).map((id) => w.profileByPerson.get(id)).filter((m) => m && !lapsed.has(m.MemberNumber));
    const attended = attendedSince(w, addMonths(asOf, -24));
    const regs = registrationsByEvent(w);
    for (const want of d.registrations) {
        const e = brief.events.find((x) => x.eventKey === want.eventKey);
        const taken = new Set((regs.get(e.eventKey) ?? []).map((o) => up(o.BillToPersonID)));
        const chosen = [];
        const add = (who) => { if (!taken.has(who.key) && chosen.length < want.count) { taken.add(who.key); chosen.push(who); } };
        const lastDay = e.date < asOf ? e.date : asOf;
        for (const n of want.include ?? []) {
            const j = joinRef.get(n);
            if (j) add({ key: j.ref, ref: j.ref, number: j.number, earliest: j.date });
            else { const prof = w.profileByNumber.get(n); add({ key: up(prof.PersonID), email: w.personById.get(up(prof.PersonID)).Email, number: n, earliest: from }); }
        }
        const pool = [
            ...members.filter((m) => !taken.has(up(m.PersonID))).map((m) => ({ key: up(m.PersonID), email: w.personById.get(up(m.PersonID))?.Email, number: m.MemberNumber, earliest: from, region: m.Region, weight: 1 + 2 * (attended.get(up(m.PersonID)) ?? 0) })),
            ...[...joinRef].filter(([, j]) => j.date <= lastDay && !taken.has(j.ref)).map(([, j]) => ({ key: j.ref, ref: j.ref, number: j.number, earliest: j.date, region: j.region, weight: 1.5 })),
        ].filter((x) => x.email || x.ref).map((x) => ({ ...x, weight: x.weight * (e.region && x.region === e.region ? 3 : 1) }));
        while (chosen.length < want.count && pool.length) {
            const tot = pool.reduce((s, x) => s + x.weight, 0);
            let t = r.next() * tot, i = 0;
            while ((t -= pool[i].weight) >= 0 && i < pool.length - 1) i++;
            add(pool.splice(i, 1)[0]);
        }
        const rate = want.attendanceRate ?? e.attendanceRate;
        const leads = e.leads.filter((dd) => { const dt = addDays(e.date, -dd); return dt >= from && dt <= lastDay; });
        for (const who of chosen) {
            let date = leads.length ? addDays(e.date, -r.pick(leads)) : addDays(lastDay, -r.int(0, Math.max(0, daysBetween(from, lastDay))));
            if (date < who.earliest) date = who.earliest;
            if (date > lastDay) date = lastDay;
            const num = `ORD-E-REG-${who.number}-${e.eventKey}`;
            const bill = who.ref ? { ref: who.ref } : { lookup: { Email: who.email } };
            const o = orderShape({ number: num, date, personRef: who.ref, personLookup: who.ref ? undefined : bill, lines: [product(EVENT_PRODUCT[e.type])], paid: true });
            records.push(o.order, ...o.lines);
            records.push({ entity: 'EventOrderLine', extends: `${num}#1`, fields: { PersonID: bill, AttendanceStatus: r.next() < rate ? 'Attended' : 'No Show' } });
            records.push(...paymentShape({ number: num, date, bill, total: o.total, r }));
        }
    }
    return { asOf, summary: String(d.summary).slice(0, 2000), intake: {}, records };
}

// ── prompt ──
const SYSTEM = `You plan one window of activity for the International Cheese Federation (ICF), a fictitious cheese trade association whose membership, commerce and event records make up the More Cheese demonstration dataset for MemberJunction. You decide WHAT happens in the window; a deterministic compiler turns your decisions into database records, so you never write records, IDs, order numbers or prices. You have no tools: every fact you may use is in the prompt. Decide like an association analyst who knows this federation: keep volumes close to last year's for the same window unless the era or the blog gives a reason, and make every exception (a lapse, a tier change, an unusually strong or weak event) something a staff member could explain. Return only the DECISIONS JSON.`;

export function buildPrompt(brief) {
    const due = brief.due.map((m) => `${m.memberNumber} | ${m.name} | ${m.segment} | ${m.tier}${m.journal ? ' + journal' : ''} | member ${m.years} yr | last paid ${m.lastPurchase}, due ${m.anniversary} | events attended in 24 mo: ${m.attended24mo} | ${m.country}${m.org ? ` | ${m.org}` : ''}`);
    const events = brief.events.map((e) => [
        `${e.eventKey} | ${e.name} | ${e.type} | ${e.date} | ${e.city ?? 'virtual'}${e.state ? `, ${e.state}` : ''} | $${e.price}`,
        `  already registered: ${e.alreadyRegistered}; a typical ${e.type.toLowerCase()} takes ${e.typicalRegistrations}; at past booking lead times about ${e.expectedInWindow} of those book inside this window; attendance rate ${e.attendanceRate}`,
        `  recent comparable: ${e.recentComparable.map((c) => `${c.key} ${c.date}: ${c.registrations}`).join('; ') || 'none'}`,
    ].join('\n'));
    const cities = brief.cities.slice(0, 220).map((c) => `${c.city} | ${c.country} | ${c.state} | ${c.members} members`);
    const orgs = brief.orgs.map((o) => `${o.name} | ${o.type ?? '-'} | ${o.country ?? '-'}${o.city ? `, ${o.city}` : ''}`);
    return `WINDOW: ${brief.window.from} to ${brief.window.asOf}
ERA: ${brief.era ? `${brief.era.key} — ${brief.era.description}` : 'none'}
CURRENT MEMBERS at the start of the window: ${brief.currentMembers}
PRICES (USD, the compiler applies them): ${Object.entries(brief.prices).map(([k, v]) => `${k} ${v}`).join(', ')}

LAST YEAR, SAME WINDOW (${brief.lastYear.window.from} to ${brief.lastYear.window.to}):
- new members: ${brief.lastYear.joins} (${Object.entries(brief.lastYear.joinTiers).map(([k, v]) => `${k} ${v}`).join(', ') || 'none'})
- renewal orders: ${brief.lastYear.renewalOrders}; members due: ${brief.lastYear.due}; renewed within 90 days of due: ${brief.lastYear.renewedWithin90Days} (rate ${brief.lastYear.renewalRate ?? 'n/a'})

PREVIOUS PLANS (most recent last):
${brief.priorPlans.map((p) => `- ${p.window}: ${p.summary}`).join('\n') || '- none yet'}

THE WINDOW'S PUBLIC BLOG POSTS (what the federation said publicly; your decisions should not contradict them):
${brief.blog.map((b) => `- ${b.date} [${b.category}] ${b.title} — ${b.excerpt}`).join('\n') || '- none'}

DUE RENEWALS (${brief.due.length}; everyone here renews at their tier on or near the due date unless you list them in lapses or tierChanges):
${due.join('\n') || '- none'}

EVENTS (paid events in or shortly after the window; registrations you add are dated inside the window):
${events.join('\n') || '- none'}

KNOWN CITIES (new members must live in one of these; city | country code | state | members there):
${cities.join('\n')}

ORGANIZATIONS (a new member may work at one of these, by exact name, or at none):
${orgs.join('\n')}

RULES
1. joins: the new members who join in the window, each with a realistic name for their city's country (no name that already exists in the dataset), gender (${GENDERS.join(', ')}), job title fitting the segment, segment (${SEGMENTS.join(', ')}), tier (${Object.keys(TIERS).join(', ')}; Enthusiast tier only and always for the Enthusiast segment; SmallBusiness and Corporate need an organization), city and country code exactly as in KNOWN CITIES, organization (exact name from ORGANIZATIONS, or null), a street address line and postal code plausible for the city, join date inside the window, whether they add the journal, and a short why. key is any unique short id (j1, j2, ...).
2. lapses: members from DUE RENEWALS who do not renew, with a reason a membership manager would record. Keep the renewal rate near last year's unless the era says otherwise; low engagement makes a lapse likelier.
3. tierChanges: due members who renew at a different tier, with a reason.
4. unpaidRenewals: member numbers of due members whose renewal invoice is issued but still unpaid at the end of the window (a small share).
5. registrations: for each event in EVENTS, how many NEW registrations are taken inside this window (count), optionally the attendanceRate if this event should differ from the norm, and include: member numbers or join keys of people who certainly register (for example a new member who joined to attend). The compiler draws the rest from current members, favouring past attendees and the event's region. Do not count people already registered.
6. summary: three or four sentences on what happened at the federation in this window, in data terms (joins, lapses, events), consistent with the era and the blog.

DECISIONS JSON: {"summary": "...", "joins": [...], "lapses": [...], "tierChanges": [...], "unpaidRenewals": [...], "registrations": [...]}`;
}

// ── Gemini (as in content-backfill-internal-gemini.mjs) ──
function apiKey() {
    // A Claude Code cloud environment can hold the key as a network secret: its proxy adds the header to
    // requests for generativelanguage.googleapis.com, and the session never sees the key
    if (process.env.GEMINI_KEY_FROM_PROXY === '1') return null;
    const fromEnv = process.env.GEMINI_API_KEY || process.env.AI_VENDOR_API_KEY__GeminiLLM;
    if (fromEnv) return fromEnv.trim();
    const file = process.env.GEMINI_ENV_FILE?.replace(/^~(?=\/)/, os.homedir());
    if (file && fs.existsSync(file)) {
        const m = fs.readFileSync(file, 'utf8').match(/^\s*(?:export\s+)?(?:GEMINI_API_KEY|AI_VENDOR_API_KEY__GeminiLLM)\s*=\s*["']?([^"'\s#]+)/m);
        if (m) return m[1];
    }
    throw new Error('no Gemini key: set GEMINI_API_KEY, or GEMINI_ENV_FILE to a .env holding AI_VENDOR_API_KEY__GeminiLLM, or GEMINI_KEY_FROM_PROXY=1 where a network secret adds it');
}
async function generate(opts, contents) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${opts.model}:generateContent`;
    const body = JSON.stringify({
        systemInstruction: { parts: [{ text: SYSTEM }] },
        contents,
        generationConfig: { responseMimeType: 'application/json', responseSchema: DECISIONS_SCHEMA, maxOutputTokens: 32768 },
    });
    for (let i = 0; ; i++) {
        const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json', ...(opts.key ? { 'x-goog-api-key': opts.key } : {}) }, body });
        const data = await res.json().catch(() => ({}));
        if (res.ok) return data;
        if (i < 4 && (res.status === 429 || res.status >= 500)) { await new Promise((r) => setTimeout(r, 2000 * 2 ** i)); continue; }
        throw new Error(`Gemini ${res.status}: ${data.error?.message ?? res.statusText}`);
    }
}

// ── apply ──
function loomBin(opts) {
    const dirs = [opts.loom, process.env.LOOM_DIR, path.resolve(ROOT, '../loom-plan'), path.resolve(ROOT, '../loom')].filter(Boolean);
    for (const d of dirs) {
        const bin = path.join(d, 'packages/cli/dist/bin/loom.js');
        if (fs.existsSync(bin) && /--plan/.test(spawnSync(process.execPath, [bin, 'accumulate', '--help'], { encoding: 'utf8' }).stdout)) return bin;
    }
    throw new Error(`no Loom checkout with 'accumulate --plan' built (looked in ${dirs.join(', ')}); pass --loom <dir>`);
}
function run(cmd, args, env = {}) {
    const r = spawnSync(cmd, args, { cwd: ROOT, encoding: 'utf8', maxBuffer: 256 << 20, env: { ...process.env, ...env } });
    return { ok: r.status === 0, out: `${r.stdout ?? ''}${r.stderr ?? ''}` };
}
const tail = (s, n = 40) => s.trim().split('\n').slice(-n).join('\n');
// validate:loom lists every broken gate, waived ones included, before naming the unwaived ones; lead with those
const failureLines = (s) => {
    const unwaived = s.split(/not covered by waiver:?/)[1];
    if (unwaived) return unwaived.trim().split('\n').slice(0, 60).join('\n');
    return s.split('\n').filter((l) => !/\[WAIVED\]/.test(l) && /❌|✗|FAIL|Error|rejected|problem|^\s+- |records\[/.test(l)).slice(0, 60).join('\n') || tail(s);
};

/** Puts generated/ back to opts.base (taken before the first month) and applies the cycle's plan so far on top. */
function applyPlan(opts, plan, decisions) {
    const planDir = path.join(ROOT, 'data', 'plans');
    const planPath = path.join(planDir, `${opts.label}.plan.json`);
    const decisionsPath = path.join(planDir, `${opts.label}.decisions.json`);
    discardCycle(opts);
    fs.mkdirSync(planDir, { recursive: true });
    fs.writeFileSync(planPath, `${JSON.stringify(plan, null, 2)}\n`);
    fs.writeFileSync(decisionsPath, `${JSON.stringify(decisions, null, 2)}\n`);
    const steps = [
        ['loom accumulate --plan', process.execPath, [opts.loomBin, 'accumulate', '-p', 'data', '--prior-state', 'generated', '--as-of', plan.asOf, '--plan', path.relative(ROOT, planPath)]],
        ['npm run generate', 'npm', ['run', '-s', 'generate']],
        ['check-metadata-closure', process.execPath, ['scripts/check-metadata-closure.mjs']],
        ['validate:loom', 'npm', ['run', '-s', 'validate:loom']],
        ['check:ownership', 'npm', ['run', '-s', 'check:ownership']],
    ];
    for (const [name, cmd, args] of steps) {
        const r = run(cmd, args);
        fs.writeFileSync(path.join(opts.logdir, `${opts.step}.${name.replace(/[^a-z]+/gi, '-')}.log`), r.out);
        if (!r.ok) { discardCycle(opts); return { ok: false, step: name, problems: failureLines(r.out) }; }
    }
    return { ok: true };
}
/** Back to opts.base with no plan files for the cycle. */
function discardCycle(opts) {
    fs.rmSync(path.join(ROOT, 'generated'), { recursive: true, force: true });
    fs.cpSync(path.join(opts.base, 'generated'), path.join(ROOT, 'generated'), { recursive: true });
    for (const ext of ['plan', 'decisions']) fs.rmSync(path.join(ROOT, 'data', 'plans', `${opts.label}.${ext}.json`), { force: true });
}

// ── CLI ──
function parseArgs(argv) {
    const opts = { model: 'gemini-4-argon', attempts: 3, priceIn: 0, priceOut: 0, logdir: path.join(os.homedir(), 'Projects/more-cheese-work/monthly-plans'), dryRun: false, month: null, from: null, loom: null, decisions: null };
    for (let i = 0; i < argv.length; i++) {
        const a = argv[i];
        const next = () => argv[++i];
        if (a === '--model') opts.model = next();
        else if (a === '--month') opts.month = next();
        else if (a === '--from') opts.from = next();
        else if (a === '--attempts') opts.attempts = Number(next());
        else if (a === '--logdir') opts.logdir = path.resolve(next());
        else if (a === '--loom') opts.loom = path.resolve(next());
        else if (a === '--price-in') opts.priceIn = Number(next());
        else if (a === '--price-out') opts.priceOut = Number(next());
        else if (a === '--dry-run') opts.dryRun = true;
        else if (a === '--decisions') opts.decisions = path.resolve(next());
        else throw new Error(`unknown argument ${a}`);
    }
    return opts;
}

/** One month: saved decisions if there are any, else the model with up to --attempts tries. Applies the cycle so far. */
async function decideMonth(opts, ctx, seg, saved) {
    const { w, brief, done, usage, log } = ctx;
    // The cycle's plan so far: the months already decided, then this one
    const tryApply = (decisions) => {
        const plan = compilePlan(decisions, brief, w);
        const all = { asOf: opts.cycleAsOf, summary: [...done.map((x) => x.decisions.summary), String(decisions.summary)].join('\n').slice(0, 2000), intake: {}, records: [...done.flatMap((x) => x.records), ...plan.records] };
        log(`${opts.step}: ${decisions.joins.length} join(s), ${decisions.lapses.length} lapse(s), ${brief.due.length - decisions.lapses.length} renewal(s), ${decisions.registrations.reduce((s, x) => s + x.count, 0)} registration(s) → ${plan.records.length} records (${all.records.length} in the cycle)`);
        return { plan, applied: applyPlan(opts, all, { segments: [...done.map((x) => x.decisions), { window: seg, ...decisions }] }) };
    };
    if (saved) {
        const decisions = { ...saved };
        delete decisions.window;
        const problems = checkDecisions(decisions, brief, w);
        if (problems.length) return { ok: false, where: 'saved decisions', problems };
        const { plan, applied } = tryApply(decisions);
        return applied.ok ? { ok: true, decisions: { window: seg, ...decisions }, records: plan.records } : { ok: false, where: applied.step, problems: [applied.problems] };
    }
    const prompt = buildPrompt(brief);
    fs.writeFileSync(path.join(opts.logdir, `${opts.step}.prompt.txt`), `${SYSTEM}\n\n${prompt}\n`);
    log(`${opts.step}: window ${seg.from}..${seg.asOf}, ${brief.due.length} due, ${brief.events.length} event(s), ${opts.model}`);
    const contents = [{ role: 'user', parts: [{ text: prompt }] }];
    let problems = [], where = '';
    for (let attempt = 1; attempt <= opts.attempts; attempt++) {
        const res = await generate(opts, contents);
        usage.in += res.usageMetadata?.promptTokenCount ?? 0;
        usage.out += (res.usageMetadata?.candidatesTokenCount ?? 0) + (res.usageMetadata?.thoughtsTokenCount ?? 0);
        const text = res.candidates?.[0]?.content?.parts?.map((p) => p.text ?? '').join('') ?? '';
        fs.writeFileSync(path.join(opts.logdir, `${opts.step}.attempt${attempt}.json`), text);
        let decisions;
        where = 'decision check';
        try { decisions = JSON.parse(text); problems = checkDecisions(decisions, brief, w); }
        catch (e) { problems = [`your reply was not the required JSON (${e.message}; finishReason ${res.candidates?.[0]?.finishReason})`]; }
        if (!problems.length) {
            const { plan, applied } = tryApply(decisions);
            if (applied.ok) { log(`${opts.step}: PASS on attempt ${attempt}`); return { ok: true, decisions: { window: seg, ...decisions }, records: plan.records }; }
            where = applied.step;
            problems = [applied.problems];
        }
        fs.writeFileSync(path.join(opts.logdir, `${opts.step}.attempt${attempt}.problems.txt`), `${problems.join('\n')}\n`);
        log(`${opts.step}: attempt ${attempt} rejected at ${where} (see ${opts.step}.attempt${attempt}.problems.txt)`);
        contents.push({ role: 'model', parts: [{ text }] });
        contents.push({ role: 'user', parts: [{ text: `The harness rejected those decisions at the ${where} step. Fix every problem below and return the COMPLETE corrected DECISIONS JSON. Problems:\n${problems.map((p) => `- ${p}`).join('\n')}` }] });
    }
    return { ok: false, where, problems };
}

async function main() {
    const opts = parseArgs(process.argv.slice(2));
    if (!fs.existsSync(path.join(ROOT, 'scripts/vault-facts.mjs'))) throw new Error('run from the repo root');
    let w = loadWorld();
    const nextCycle = addMonths(day(w.checkpoint.continuity?.asOfDate ?? w.checkpoint.releaseDate).slice(0, 7) + '-01', 1).slice(0, 7);
    const month = opts.month ?? nextCycle;
    if (month !== nextCycle) throw new Error(`the next Loom cycle is ${nextCycle} (checkpoint as of ${w.checkpoint.continuity?.asOfDate}); cannot plan ${month}`);
    const win = { from: opts.from ?? `${month}-01`, asOf: monthEnd(month) };
    if (win.from > `${month}-01`) throw new Error('--from must be on or before the first day of the month');
    const segments = monthSegments(win);
    opts.label = month;
    opts.cycleAsOf = win.asOf;
    if (opts.dryRun) { process.stdout.write(`${SYSTEM}\n\n${buildPrompt(buildBrief(w, segments[0]))}\n`); return; }
    const saved = opts.decisions ? segmentsOf(JSON.parse(fs.readFileSync(opts.decisions, 'utf8')), month) : [];
    if (saved.length > segments.length) throw new Error(`${opts.decisions} has ${saved.length} month(s); this cycle has ${segments.length}`);
    opts.loomBin = loomBin(opts);
    if (saved.length < segments.length) opts.key = apiKey();
    fs.mkdirSync(opts.logdir, { recursive: true });
    const log = (s) => console.log(`[${new Date().toISOString().slice(11, 19)}] ${s}`);
    log(`${month}: ${segments.length} month(s) ${win.from}..${win.asOf}, ${saved.length} from saved decisions, logs in ${opts.logdir}`);
    opts.base = fs.mkdtempSync(path.join(os.tmpdir(), 'more-cheese-plan-'));
    fs.cpSync(path.join(ROOT, 'generated'), path.join(opts.base, 'generated'), { recursive: true });
    const usage = { in: 0, out: 0 };
    const cost = () => (opts.priceIn || opts.priceOut ? ` $${((usage.in * opts.priceIn + usage.out * opts.priceOut) / 1e6).toFixed(4)}` : '');
    const done = [];
    try {
        for (const [i, seg] of segments.entries()) {
            opts.step = segments.length > 1 ? `${month}.${seg.from.slice(0, 7)}` : month;
            if (i > 0) w = loadWorld();
            const res = await decideMonth(opts, { w, brief: buildBrief(w, seg), done, usage, log }, seg, saved[i]);
            if (!res.ok) {
                process.exitCode = 1;
                discardCycle(opts);
                if (done.length) fs.writeFileSync(path.join(opts.logdir, `${month}.partial.decisions.json`), `${JSON.stringify({ segments: done.map((x) => x.decisions) }, null, 2)}\n`);
                log(`FAIL in ${seg.from.slice(0, 7)} at ${res.where}; nothing kept${done.length ? `; ${done.length} decided month(s) saved to ${month}.partial.decisions.json (resume with --decisions)` : ''}; tokens in ${usage.in} out ${usage.out}${cost()}\n${res.problems.join('\n')}`);
                return;
            }
            done.push(res);
        }
        log(`PASS: ${done.reduce((s, x) => s + x.records.length, 0)} records over ${segments.length} month(s); tokens in ${usage.in} out ${usage.out}${cost()}. Review: git status, data/plans/${month}.decisions.json`);
    } finally {
        fs.rmSync(opts.base, { recursive: true, force: true });
    }
}

if (process.argv[1] && import.meta.url === pathToFileURL(fs.realpathSync(process.argv[1])).href) {
    main().catch((e) => { console.error(e.message); process.exitCode = 1; });
}
