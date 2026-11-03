#!/usr/bin/env node
/**
 * build-spaces-plan.mjs — the collaboration Spaces for More Cheese, computed from the committed generated/.
 *
 * Writes three files, all deterministic (same generated/ in, same bytes out):
 *   data/spaces/spaces.plan.json         — every space: type, parent, dates, owner, seats, anchors
 *   config/users/.space-users.json       — an MJ User for every person seated in any space
 *   config/user-roles/.space-user-roles.json — the UI role for each of those users
 * Each committee space also lists its committee's action items (generated/tasks) to file into its Work tab.
 *
 * The users push with the rest of config/. The spaces do not: collaboration only lets a space's owner
 * create it and seat people, so scripts/load-spaces.mjs replays the plan as each owner.
 *
 * Families (plans: MoreCheese Collaboration, Committees & Voting Plan, "Spaces"):
 *   committees — one interim working-group space per committee, anchored to its Committees record,
 *                seated from committee memberships (current seats Active, ended seats Removed)
 *   chapters   — regional community spaces from member Region/Country, with a few sealed child groups
 *   work groups — working-group / project / event spaces tied to the era storylines
 * Staff teams are left out until VAULT-DESIGN §5.2 (named staff) is approved.
 *
 *   node scripts/build-spaces-plan.mjs           # write the three files
 *   node scripts/build-spaces-plan.mjs --check   # exit 1 if any file is out of date
 *
 * Plain Node, no dependencies. Run from the repo root.
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { uuidv5 } from './enrich-person-job-functions.mjs';

const NAMESPACE = '5b0e3c8e-6f1a-4c2b-9a7d-3e51c0a1f4d2';
export const PRESENTER = 'demo.user@morecheese.org';
const PLAN_FILE = 'data/spaces/spaces.plan.json';
const USERS_FILE = 'config/users/.space-users.json';
const ROLES_FILE = 'config/user-roles/.space-user-roles.json';
const COMMITTEES_ENTITY = 'Committees: Committees';
const PEOPLE_ENTITY = 'MJ_BizApps_Common: People';

// ---------- helpers ----------
const up = (v) => (v == null ? v : String(v).toUpperCase());
const day = (v) => (v == null ? '' : String(v).slice(0, 10));
const id = (name) => uuidv5(name, NAMESPACE);
/** Stable tie-break: a hash of the key, so ranking never depends on file order. */
const tie = (key) => crypto.createHash('sha1').update(String(key)).digest('hex');
const minusMonths = (iso, n) => {
    const [y, m, d] = iso.split('-').map(Number);
    const t = new Date(Date.UTC(y, m - 1 - n, 1));
    const last = new Date(Date.UTC(t.getUTCFullYear(), t.getUTCMonth() + 1, 0)).getUTCDate();
    return new Date(Date.UTC(t.getUTCFullYear(), t.getUTCMonth(), Math.min(d, last))).toISOString().slice(0, 10);
};

function load(root, dir) {
    const d = path.join(root, 'generated', dir);
    const out = [];
    for (const f of fs.readdirSync(d).sort()) {
        if (f === '.mj-sync.json' || !f.endsWith('.json')) continue;
        const j = JSON.parse(fs.readFileSync(path.join(d, f), 'utf8'));
        if (Array.isArray(j)) out.push(...j);
    }
    return out;
}
const flat = (r) => ({ id: up(r.primaryKey?.ID), ...r.fields });

// ---------- the world ----------
export function loadWorld(root) {
    const checkpoint = JSON.parse(fs.readFileSync(path.join(root, 'generated', 'checkpoint.json'), 'utf8'));
    const asOf = day(checkpoint.continuity?.asOfDate ?? checkpoint.releaseDate);
    const people = load(root, 'people').map(flat);
    const profiles = load(root, 'member-profiles').map((r) => ({ ...r.fields, PersonID: up(r.fields.PersonID) }));
    const committees = load(root, 'committees').map(flat);
    const terms = load(root, 'committee-terms').map(flat);
    const memberships = load(root, 'committee-memberships').map(flat).map((m) => ({
        ...m,
        PersonID: up(m.PersonID),
        role: String(m.RoleID).replace(/^@lookup:.*Name=/, ''),
        committeeID: up(terms.find((t) => t.id === up(m.TermID))?.CommitteeID),
    }));
    const products = new Map(load(root, 'products').map(flat).map((p) => [p.id, p]));

    // Memberships are Confirmed '… Membership (annual)' purchases that were never reversed (vault-facts.mjs).
    const orders = load(root, 'orders');
    const reversed = new Set(orders.filter((o) => o.fields.Status === 'Confirmed' && o.fields.ReversesOrderHeaderID).map((o) => up(o.fields.ReversesOrderHeaderID)));
    const purchases = [];
    const registrations = [];
    for (const r of orders) {
        const o = r.fields;
        if (o.Status !== 'Confirmed' || o.ReversesOrderHeaderID || reversed.has(up(r.primaryKey?.ID))) continue;
        const date = day(o.OrderDate);
        const person = up(o.BillToPersonID);
        if (/^ORD-E-REG-/.test(o.OrderNumber ?? '')) registrations.push({ person, date });
        for (const l of r.collections?.Lines ?? []) {
            if (l.fields.ReversesOrderLineID) continue;
            if (products.get(up(l.fields.ProductID))?.Name?.endsWith(' Membership (annual)')) purchases.push({ person, date });
        }
    }
    purchases.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));

    const activity = [
        ...registrations,
        ...load(root, 'enrollments').map((r) => ({ person: up(r.fields.PersonID), date: day(r.fields.EnrolledOn) })),
        ...load(root, 'advocacy-actions').map((r) => ({ person: up(r.fields.PersonID), date: day(r.fields.ActionDate) })),
        ...load(root, 'competition-entries').map((r) => ({ person: up(r.fields.PersonID), date: `${r.fields.EntryYear}-06-30` })),
        ...memberships.map((m) => ({ person: m.PersonID, date: day(m.StartDate) })),
    ];
    const advocacy = load(root, 'advocacy-actions').map((r) => ({ person: up(r.fields.PersonID), topic: r.fields.Topic ?? '', date: day(r.fields.ActionDate) }));
    const tasks = load(root, 'tasks').map(flat);
    const heroes = JSON.parse(fs.readFileSync(path.join(root, 'data', 'ruleset', 'heroes.json'), 'utf8')).heroes;
    return { asOf, people, profiles, committees, terms, memberships, purchases, activity, advocacy, tasks, heroes };
}

// ---------- who is who ----------
function makeIndex(w) {
    const person = new Map(w.people.map((p) => [p.id, p]));
    const profile = new Map(w.profiles.map((p) => [p.PersonID, p]));
    const byEmail = new Map(w.people.map((p) => [String(p.Email).toLowerCase(), p.id]));
    const hero = (key) => byEmail.get(String(w.heroes.find((h) => h.heroKey === key)?.businessKeys?.Email ?? '').toLowerCase());
    // Kathy OLeary is the planted duplicate of Kate O'Leary; she never gets a seat.
    const excluded = new Set([hero('HERO-ICF-012')].filter(Boolean));

    const latestPurchase = (asOf) => {
        const latest = new Map();
        for (const p of w.purchases) if (p.date <= asOf) latest.set(p.person, p.date);
        return latest;
    };
    const currentAt = (asOf) => {
        const floor = minusMonths(asOf, 12);
        const latest = latestPurchase(asOf);
        return new Set([...latest].filter(([, d]) => d >= floor).map(([p]) => p));
    };
    const firstPurchase = new Map();
    for (const p of w.purchases) if (!firstPurchase.has(p.person)) firstPurchase.set(p.person, p.date);

    /** Engagement over the three years before asOf: one point per registration, enrollment, action, entry or seat. */
    const engagementAt = (asOf) => {
        const floor = minusMonths(asOf, 36);
        const score = new Map();
        for (const a of w.activity) if (a.date > floor && a.date <= asOf) score.set(a.person, (score.get(a.person) ?? 0) + 1);
        return score;
    };
    const eligible = (pid) => pid && !excluded.has(pid) && person.get(pid)?.Status === 'Active';
    return { person, profile, hero, excluded, currentAt, latestPurchase, firstPurchase, engagementAt, eligible };
}

/** Highest engagement first; ties broken by a hash of the id so order never depends on input order. */
function rank(ids, score) {
    return [...ids].sort((a, b) => (score.get(b) ?? 0) - (score.get(a) ?? 0) || (tie(a) < tie(b) ? -1 : 1));
}

const activeOn = (m, d) => day(m.StartDate) <= d && (!m.EndDate || day(m.EndDate) >= d);

// ---------- the families ----------
const CHAPTERS = [
    { key: 'california', name: 'California Chapter', states: ['US-CA'], chair: 'HERO-ICF-001' },
    { key: 'wisconsin', name: 'Wisconsin Chapter', states: ['US-WI'] },
    { key: 'new-england', name: 'New England Chapter', states: ['US-VT', 'US-ME', 'US-NH', 'US-MA', 'US-CT', 'US-RI'] },
    { key: 'new-york', name: 'New York Chapter', states: ['US-NY'] },
    { key: 'pacific-northwest', name: 'Pacific Northwest Chapter', states: ['US-OR', 'US-WA', 'US-ID'] },
    { key: 'canada', name: 'Canada Chapter', countries: ['CA'] },
    { key: 'mexico', name: 'Mexico Chapter', countries: ['MX'] },
    { key: 'france', name: 'France Chapter', countries: ['FR'] },
    { key: 'italy', name: 'Italy Chapter', countries: ['IT'] },
    { key: 'british-isles', name: 'British Isles Chapter', countries: ['GB', 'IE'] },
    { key: 'dach', name: 'DACH Chapter', countries: ['DE', 'AT', 'CH'], blurb: 'Germany, Austria and Switzerland' },
    { key: 'benelux-nordic', name: 'Benelux & Nordic Chapter', countries: ['NL', 'BE', 'LU', 'DK', 'SE', 'NO', 'FI'] },
    { key: 'oceania', name: 'Oceania Chapter', countries: ['AU', 'NZ'] },
    { key: 'japan', name: 'Japan Chapter', countries: ['JP'] },
];

/** Sealed child groups: picked from the chapter's region, led by one of their own. */
const CHAPTER_GROUPS = [
    { key: 'california-young-makers', startedAt: '2022-04-04', chapter: 'california', type: 'cohort', name: 'Young Cheesemakers (California)', pick: 'young', size: 12,
        description: 'Members under 35 in California: mentoring, plant visits and a shared make-day calendar.' },
    { key: 'wisconsin-host-2026', chapter: 'wisconsin', type: 'working-group', name: 'Madison 2026 Host Committee', pick: 'engaged', size: 10,
        startedAt: '2025-10-06', closedAt: '2026-08-14',
        description: 'Wisconsin volunteers who hosted the ICF Annual Conference 2026 in Madison: farm tours, the welcome reception and volunteer shifts.' },
    { key: 'new-england-producers', startedAt: '2021-09-13', chapter: 'new-england', type: 'working-group', name: 'Farmstead Producers Circle', pick: 'producers', size: 10,
        description: 'New England farmstead producers comparing notes on raw-milk aging, herd health and seasonal milk.' },
    { key: 'france-affineurs', startedAt: '2020-10-05', chapter: 'france', type: 'working-group', name: 'Affineurs Circle', pick: 'engaged', size: 8, include: ['HERO-ICF-007'],
        description: 'Affineurs and cave managers in the France chapter: aging rooms, rind work and export paperwork.' },
    { key: 'british-isles-events', startedAt: '2022-02-07', chapter: 'british-isles', type: 'working-group', name: 'Chapter Events Team', pick: 'engaged', size: 8,
        description: 'Plans the British Isles chapter meet-ups, tastings and the autumn market day.' },
    { key: 'italy-events', startedAt: '2023-03-06', chapter: 'italy', type: 'working-group', name: 'Chapter Events Team', pick: 'engaged', size: 8,
        description: 'Plans the Italy chapter tastings and the spring visit to member dairies.' },
    { key: 'pacific-northwest-newcomers', startedAt: '2026-01-12', chapter: 'pacific-northwest', type: 'cohort', name: 'New Members 2026', pick: 'newcomers', size: 12,
        description: 'Members who joined in 2026: orientation, a buddy from the chapter and the first-year checklist.' },
    { key: 'oceania-young-makers', startedAt: '2023-08-07', chapter: 'oceania', type: 'cohort', name: 'Young Cheesemakers (Oceania)', pick: 'young', size: 10,
        description: 'Members under 35 in Australia and New Zealand: mentoring and a monthly video call across the time zones.' },
];

/** Work groups: storylines from VAULT-DESIGN §4.2, staffed from the committees and members of the day. */
const WORK_GROUPS = [
    { key: 'pandemic-response-2020', type: 'working-group', name: 'Pandemic Response Task Force', startedAt: '2020-03-16', closedAt: '2020-12-18',
        committees: 'officers', size: 12,
        description: 'Committee chairs and vice chairs who met weekly through 2020 on event cancellations, refunds, emergency member support and the move to online courses.' },
    { key: 'virtual-symposium-2021', type: 'project', name: 'Virtual Symposium 2021', startedAt: '2020-11-02', closedAt: '2021-06-30',
        committees: ['Events Committee', 'Education Committee'], size: 12,
        description: 'Planned and ran the 2021 virtual symposium: the platform choice, speaker sessions across time zones and the recordings library.' },
    { key: 'hardship-dues-2025', type: 'working-group', name: 'Hardship Dues Program', startedAt: '2025-02-03', closedAt: '2026-01-30',
        committees: ['Membership & Outreach Committee'], size: 10,
        description: 'Designed and ran the 2025 hardship dues program for members hit by rising costs and creamery closures.' },
    { key: 'conference-2026', type: 'event', name: 'ICF Annual Conference 2026', startedAt: '2025-09-08', closedAt: '2026-08-14',
        committees: ['Events Committee'], size: 12, include: ['chapter:wisconsin'], presenter: 'admin',
        description: 'The ICF Annual Conference 2026 in Madison, Wisconsin (July 21): program, venue, sponsors and the volunteer roster.' },
    { key: 'raw-milk-aging-2026', type: 'working-group', name: 'Raw-Milk Aging Rule Task Force', startedAt: '2026-01-12',
        committees: ['Standards Committee'], advocacy: /raw.?milk/i, size: 12, include: ['HERO-ICF-009'], presenter: 'member',
        description: 'Drafting ICF comments on modernizing the raw-milk aging rule, with producer testimony and the Standards Committee.' },
    { key: 'traceability-pilot-2026', type: 'project', name: 'Traceability Pilot', startedAt: '2026-03-02', plannedCloseAt: '2027-03-31',
        committees: ['Food Safety Committee'], producers: true, size: 10,
        description: 'A one-year pilot of lot-level traceability with volunteer creameries: recall drills, labeling and the record-keeping template.' },
    { key: 'next-generation-2026', type: 'working-group', name: 'Succession & Next-Generation Makers', startedAt: '2026-02-02',
        committees: ['Education Committee'], young: true, size: 12, include: ['HERO-ICF-004'], invite: ['HERO-ICF-015'],
        description: 'Succession planning for retiring owners and a path into the trade for new makers: apprenticeships, mentoring and creamery transfers.' },
    { key: 'competition-2026', type: 'event', name: 'Annual Competition 2026', startedAt: '2026-01-05', plannedCloseAt: '2026-11-30',
        committees: ['Awards & Competition Committee'], size: 10,
        description: 'Entries, judging panels and results for the 2026 ICF cheese competition.' },
];

const PRESENTER_SEATS = { 'committee-food-safety': 'admin', 'chapter-california': 'admin' };

// ---------- build ----------
export function buildPlan(w) {
    const ix = makeIndex(w);
    const now = w.asOf;
    const current = ix.currentAt(now);
    const score = ix.engagementAt(now);
    const seated = new Set();
    const spaces = [];

    const seat = (pid, role, status = 'Active') => {
        seated.add(pid);
        return { person: pid, role, status };
    };
    const addPresenter = (space, role) => {
        if (role) space.seats.push({ user: PRESENTER, role, status: 'Active' });
    };
    // A space with nobody to own it (a region or committee with no one eligible) is left out.
    const space = (s) => {
        if (!s.seats.some((x) => x.role === 'owner')) return null;
        const out = {
            key: s.key,
            id: id(`space:${s.key}`),
            type: s.type,
            parent: s.parent ?? null,
            name: s.name,
            description: s.description,
            sealed: s.sealed ?? false,
            startedAt: s.startedAt,
            plannedCloseAt: s.plannedCloseAt ?? null,
            closedAt: s.closedAt ?? null,
            owner: s.seats.find((x) => x.role === 'owner').person,
            seats: s.seats,
            anchors: s.anchors ?? [],
            tasks: s.tasks ?? [],
        };
        addPresenter(out, PRESENTER_SEATS[s.key] ?? s.presenter);
        spaces.push(out);
        return out;
    };

    // Committees: one space each, seated from the latest membership of each person on that committee.
    const committeeByName = new Map(w.committees.map((c) => [c.Name, c]));
    for (const c of [...w.committees].sort((a, b) => (a.Name < b.Name ? -1 : 1))) {
        const latest = new Map();
        for (const m of w.memberships.filter((m) => m.committeeID === c.id).sort((a, b) => (day(a.StartDate) < day(b.StartDate) ? -1 : 1))) latest.set(m.PersonID, m);
        const rows = [...latest.values()].filter((m) => ix.eligible(m.PersonID));
        const roleOf = (m) => (m.Status !== 'Active' ? 'member' : m.role === 'Chair' ? 'owner' : m.role === 'Vice Chair' ? 'admin' : 'member');
        const order = { owner: 0, admin: 1, member: 2 };
        const seats = rows
            .map((m) => seat(m.PersonID, roleOf(m), m.Status === 'Active' ? 'Active' : 'Removed'))
            .sort((a, b) => order[a.role] - order[b.role] || (a.status < b.status ? -1 : a.status > b.status ? 1 : 0) || (tie(a.person) < tie(b.person) ? -1 : 1));
        const slug = c.Name.replace(/ Committee$/, '').toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
        space({
            key: `committee-${slug}`, type: 'working-group', name: c.Name, description: c.MissionStatement,
            startedAt: day(c.FormationDate), seats,
            // The committee's action items, filed into its space (Loom writes them as "recorded at the <Committee> meeting")
            tasks: (w.tasks ?? []).filter((t) => String(t.Description ?? '').includes(`recorded at the ${c.Name} meeting`)).map((t) => t.id).sort(),
            anchors: [{ entity: COMMITTEES_ENTITY, recordId: c.id, role: 'primary', isPrimary: true }],
        });
    }

    // Chapters: officers plus the most engaged current members of the region; a few guests and invitations.
    const inChapter = (ch) => (p) => (ch.states ? ch.states.includes(p.State) : ch.countries.includes(p.Country));
    const chapterPool = new Map();
    for (const ch of CHAPTERS) {
        const region = w.profiles.filter(inChapter(ch)).map((p) => p.PersonID).filter((pid) => ix.eligible(pid));
        const members = rank(region.filter((pid) => current.has(pid)), score);
        chapterPool.set(ch.key, { region, members });
        const chairPin = ch.chair ? ix.hero(ch.chair) : null;
        const ordered = chairPin && members.includes(chairPin) ? [chairPin, ...members.filter((p) => p !== chairPin)] : members;
        const size = Math.max(25, Math.min(40, Math.round(members.length * 0.3)));
        const recent = new Set(members.filter((pid) => (ix.firstPurchase.get(pid) ?? '') >= minusMonths(now, 3)));
        const seatedHere = ordered.filter((pid) => !recent.has(pid)).slice(0, size);
        const invited = rank([...recent], score).slice(0, 2);
        const lapsed = rank(region.filter((pid) => !current.has(pid) && ix.firstPurchase.has(pid)), score).slice(0, 2);
        // A chapter starts the year its region first had ten current members (never before 2015).
        let startedAt = '2015-01-01';
        for (let y = 2015; y <= Number(now.slice(0, 4)); y++) {
            const roster = ix.currentAt(`${y}-12-31`);
            if (region.filter((pid) => roster.has(pid)).length >= 10) { startedAt = `${y}-01-01`; break; }
        }
        space({
            key: `chapter-${ch.key}`, type: 'community', name: ch.name, startedAt,
            description: `The ICF chapter for members in ${ch.blurb ?? ch.name.replace(/ Chapter$/, '')}: local meet-ups, tastings, chapter news and member chat.`,
            seats: [
                ...seatedHere.map((pid, i) => seat(pid, i === 0 ? 'owner' : i < 3 ? 'admin' : 'member')),
                ...lapsed.map((pid) => seat(pid, 'guest')),
                ...invited.map((pid) => seat(pid, 'member', 'Invited')),
            ],
        });
    }

    // Chapter child groups: sealed, led by their most engaged pick.
    const age = (pid, at) => {
        const dob = ix.person.get(pid)?.DateOfBirth;
        return dob ? Number(at.slice(0, 4)) - Number(String(dob).slice(0, 4)) : 99;
    };
    for (const g of CHAPTER_GROUPS) {
        const { region, members } = chapterPool.get(g.chapter);
        if (!members.length) continue;
        const at = g.closedAt ?? now;
        const pool = g.closedAt ? rank(region.filter((pid) => ix.currentAt(g.startedAt).has(pid)), ix.engagementAt(g.startedAt)) : members;
        let picks;
        if (g.pick === 'young') picks = pool.filter((pid) => age(pid, at) < 35);
        else if (g.pick === 'producers') picks = pool.filter((pid) => ix.profile.get(pid)?.Segment === 'Producer');
        else if (g.pick === 'newcomers') picks = rank(region.filter((pid) => current.has(pid) && (ix.firstPurchase.get(pid) ?? '').startsWith(now.slice(0, 4))), score);
        else picks = pool;
        const pinned = (g.include ?? []).map((h) => ix.hero(h)).filter((pid) => pid && region.includes(pid));
        picks = [...pinned, ...picks.filter((p) => !pinned.includes(p))].slice(0, g.size);
        if (picks.length < 3) continue;
        const parent = spaces.find((s) => s.key === `chapter-${g.chapter}`);
        if (!parent) continue;
        space({
            key: g.key, type: g.type, parent: parent.key, sealed: true, name: g.name, description: g.description,
            startedAt: g.startedAt, closedAt: g.closedAt ?? null,
            seats: picks.map((pid, i) => seat(pid, i === 0 ? 'owner' : i === 1 ? 'admin' : 'member')),
        });
    }

    // Work groups: committee members of the day, then the most engaged current members who fit. Volunteers
    // from outside the committees sit on at most two work groups, so the same few names don't fill every one.
    const volunteered = new Map();
    for (const g of WORK_GROUPS) {
        const at = g.startedAt;
        const roster = ix.currentAt(at);
        const sc = ix.engagementAt(at);
        const onCommittee = w.memberships.filter((m) => activeOn(m, at) && ix.eligible(m.PersonID) && (g.committees === 'officers'
            ? m.role !== 'Member'
            : g.committees.includes(w.committees.find((c) => c.id === m.committeeID)?.Name)));
        const officerFirst = (m) => (m.role === 'Chair' ? 0 : m.role === 'Vice Chair' ? 1 : 2);
        const fromCommittees = [...new Map(onCommittee.sort((a, b) => officerFirst(a) - officerFirst(b) || (tie(a.PersonID) < tie(b.PersonID) ? -1 : 1)).map((m) => [m.PersonID, m])).keys()];
        let extra = rank([...roster].filter((pid) => ix.eligible(pid) && !fromCommittees.includes(pid) && (volunteered.get(pid) ?? 0) < 2), sc);
        if (g.advocacy) {
            const advocates = new Set(w.advocacy.filter((a) => g.advocacy.test(a.topic) && a.date <= at).map((a) => a.person));
            extra = extra.filter((pid) => advocates.has(pid));
        }
        if (g.producers) extra = extra.filter((pid) => ix.profile.get(pid)?.Segment === 'Producer');
        if (g.young) extra = extra.filter((pid) => age(pid, at) < 35);
        const pinned = (g.include ?? []).flatMap((h) => (h.startsWith('chapter:') ? [spaces.find((s) => s.key === `chapter-${h.slice(8)}`)?.owner] : [ix.hero(h)])).filter((pid) => ix.eligible(pid));
        const committeeShare = Math.min(fromCommittees.length, Math.ceil(g.size / 2));
        const picks = [...new Set([...fromCommittees.slice(0, committeeShare), ...pinned, ...extra])].slice(0, g.size);
        for (const pid of picks) if (!fromCommittees.includes(pid)) volunteered.set(pid, (volunteered.get(pid) ?? 0) + 1);
        const invited = (g.invite ?? []).map((h) => ix.hero(h)).filter((pid) => ix.eligible(pid) && !picks.includes(pid));
        space({
            key: g.key, type: g.type, name: g.name, description: g.description,
            startedAt: g.startedAt, plannedCloseAt: g.plannedCloseAt, closedAt: g.closedAt, presenter: g.presenter,
            seats: [
                ...picks.map((pid, i) => seat(pid, i === 0 ? 'owner' : i === 1 ? 'admin' : 'member')),
                ...invited.map((pid) => seat(pid, 'member', 'Invited')),
            ],
        });
    }

    // Users: everyone seated anywhere, keyed by person so the ids survive regeneration.
    const users = [...seated].map((pid) => {
        const p = ix.person.get(pid);
        return { person: pid, id: id(`user:${pid}`), email: String(p.Email).toLowerCase(), firstName: p.FirstName, lastName: p.LastName };
    }).sort((a, b) => (a.email < b.email ? -1 : 1));
    const emailOf = new Map(users.map((u) => [u.person, u.email]));
    for (const s of spaces) {
        s.owner = emailOf.get(s.owner);
        s.seats = s.seats.map((x) => (x.user ? x : { user: emailOf.get(x.person), person: x.person, role: x.role, status: x.status }));
    }
    return {
        plan: {
            version: 1,
            asOf: now,
            generatedBy: 'scripts/build-spaces-plan.mjs',
            presenter: PRESENTER,
            peopleEntity: PEOPLE_ENTITY,
            spaces,
        },
        users,
    };
}

export function renderFiles(plan, users) {
    const json = (v) => JSON.stringify(v, null, 2) + '\n';
    return {
        [PLAN_FILE]: json(plan),
        [USERS_FILE]: json(users.map((u) => ({
            fields: {
                Name: u.email, FirstName: u.firstName, LastName: u.lastName, Email: u.email,
                Type: 'User', IsActive: true, LinkedRecordType: 'None',
            },
            primaryKey: { ID: u.id },
        }))),
        [ROLES_FILE]: json(users.map((u) => ({
            fields: { UserID: u.id, RoleID: '@lookup:MJ: Roles.Name=UI' },
            primaryKey: { ID: id(`user-role:ui:${u.person}`) },
        }))),
    };
}

function main(argv) {
    const root = process.cwd();
    const { plan, users } = buildPlan(loadWorld(root));
    const files = renderFiles(plan, users);
    if (argv.includes('--check')) {
        // A push writes its own `sync` bookkeeping back into the record files; that is not drift.
        const unsynced = (text) => JSON.stringify(JSON.parse(text), (k, v) => (k === 'sync' ? undefined : v));
        const stale = Object.entries(files).filter(([f, body]) => !fs.existsSync(path.join(root, f)) || unsynced(fs.readFileSync(path.join(root, f), 'utf8')) !== unsynced(body)).map(([f]) => f);
        if (stale.length) {
            console.error(`spaces plan is out of date: ${stale.join(', ')}\nrun: node scripts/build-spaces-plan.mjs`);
            process.exit(1);
        }
        console.log('spaces plan is up to date');
        return;
    }
    for (const [f, body] of Object.entries(files)) {
        fs.mkdirSync(path.dirname(path.join(root, f)), { recursive: true });
        fs.writeFileSync(path.join(root, f), body);
    }
    const seats = plan.spaces.reduce((n, s) => n + s.seats.length, 0);
    const byType = plan.spaces.reduce((m, s) => ((m[s.type] = (m[s.type] ?? 0) + 1), m), {});
    console.log(`${plan.spaces.length} spaces (${Object.entries(byType).map(([k, v]) => `${v} ${k}`).join(', ')}), ${seats} seats, ${users.length} users`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main(process.argv.slice(2));
