#!/usr/bin/env node
/**
 * build-elections-plan.mjs — ICF's voting history for bizapps-voting, computed from the committed generated/.
 *
 * Writes data/elections/elections.plan.json, deterministically (same generated/, spaces plan and statements in, same
 * bytes out). Each entry is one election with everything bizapps-voting needs to replay it: type, contests, the roll,
 * every ballot, nominations, who certified it, the dates it ran, the records it is anchored to, and the result the
 * replay must reach.
 *
 * Voting only accepts ballots through its own engines (it encrypts selections and hashes the roll and the ballot set),
 * so elections cannot go in as config JSON. scripts/load-elections.mjs replays this plan through those engines and then
 * backdates the rows to the plan's dates (plans: MoreCheese Collaboration, Committees & Voting Plan, "Voting").
 *
 * Families:
 *   committee motions — the committee motions already in generated/committee-meetings, each a roll-call (Open)
 *                       motion: the roll is the committee members recorded on it, every Yes/No/Abstain is a ballot,
 *                       Absent members are on the roll but don't vote. Majority of votes cast, so a tie fails, as the
 *                       committees data records. Certified by the committee's chair that day (else vice chair, else
 *                       the mover). Anchored to its Committees: Motions record and its committee's space.
 *   board elections   — the yearly election of three directors to the nine-seat Board of Directors (VAULT-DESIGN §5.3,
 *                       decided 2026-10-30), from 2019: nominations in September, a secret ranked ballot (STV) from
 *                       mid-October to mid-November, every current member on the roll. Directors serve three years and
 *                       at most two terms. Candidates are past committee officers; the heroes run where BOARD.beats says.
 *                       Turnout follows each member's engagement and the year's storyline.
 *   standards ballots — the Standards Committee's ballots on ICF's member standards (VAULT-DESIGN §5.4), from
 *                       data/elections/standards.json: an Open roll call, one Approve/Disapprove item per section,
 *                       two-thirds of votes cast approves. The committee votes with a ballot pool of engaged members
 *                       who signed up; a member stays in the pool while they are current. Every Disapprove carries a
 *                       comment, and some Approves an editorial one; the committee resolves each comment and its writer
 *                       answers. A failed item goes back as a recirculation to the same voters, where those the
 *                       resolution didn't satisfy vote against again. Comment and resolution wording comes from
 *                       data/elections/comments.json (scripts/build-election-comments-gemini.mjs). Certified by the
 *                       committee's chair three weeks after the ballot closes.
 *
 *   node scripts/build-elections-plan.mjs           # write the plan
 *   node scripts/build-elections-plan.mjs --check   # exit 1 if the plan is out of date
 *
 * Plain Node, no dependencies. Run from the repo root.
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { loadWorld as loadMemberWorld, makeIndex } from './build-spaces-plan.mjs';

const PLAN_FILE = 'data/elections/elections.plan.json';
const STATEMENTS_FILE = 'data/elections/statements.json';
const STANDARDS_FILE = 'data/elections/standards.json';
const COMMENTS_FILE = 'data/elections/comments.json';
const SPACES_PLAN = 'data/spaces/spaces.plan.json';
const MOTIONS_ENTITY = 'Committees: Motions';
const COMMITTEES_ENTITY = 'Committees: Committees';
const SPACES_ENTITY = 'MJ_BizApps_Collaboration: Spaces';

/** The board's elections. Each year's three seats are the class elected three years before. */
const BOARD = {
    seats: 3,
    termYears: 3,
    maxTerms: 2,
    years: [2019, 2020, 2021, 2022, 2023, 2024, 2025],
    candidates: 5,
    // Story beats (VAULT-DESIGN §5.3 hero arcs): who runs, and whether they win.
    beats: {
        2021: { loses: ['HERO-ICF-008'] },
        2024: { wins: ['HERO-ICF-008'] },
        2025: { wins: ['HERO-ICF-001'] },
    },
    // Heroes whose arcs rule out running: no volunteering, no smooth renewal, no stage, no growth story, the duplicate.
    never: ['HERO-ICF-002', 'HERO-ICF-005', 'HERO-ICF-009', 'HERO-ICF-012', 'HERO-ICF-014'],
    // A nomination withdrawn before the ballot, and an incumbent who loses.
    withdrawn: [2020, 2023],
    incumbentLoses: [2023],
    // Share of the roll that votes, by year: steady, up in the online years, down in the strained ones, up again in the
    // hardship-dues year.
    turnout: { 2019: 0.27, 2020: 0.34, 2021: 0.31, 2022: 0.26, 2023: 0.23, 2024: 0.28, 2025: 0.36 },
    paperShare: 0.12,
};

/** How the Standards Committee resolves a comment, by what it says about the item: shares of each disposition. */
const DISPOSITIONS = {
    // A Disapprove on an item that fails: the revision answers most of them.
    failing: [['Accepted', 0.45], ['AcceptedInPrinciple', 0.4], ['Rejected', 0.15]],
    // A Disapprove on an item that passes anyway.
    passing: [['Rejected', 0.45], ['AcceptedInPrinciple', 0.25], ['Deferred', 0.2], ['Accepted', 0.1]],
    // An editorial comment on an Approve.
    editorial: [['Accepted', 0.8], ['AcceptedInPrinciple', 0.1], ['Withdrawn', 0.05], ['Rejected', 0.05]],
};
/** The chance a commenter who answers the resolution is satisfied with it. */
const SATISFIED = { Accepted: 0.92, AcceptedInPrinciple: 0.8, Deferred: 0.5, Rejected: 0.3 };
const DAY = 86400000;

// ---------- helpers ----------
const up = (v) => (v == null ? v : String(v).toUpperCase());
const day = (v) => (v == null ? '' : String(v).slice(0, 10));
const addMinutes = (iso, n) => new Date(Date.parse(iso) + n * 60000).toISOString().replace('.000Z', 'Z');
const addDays = (date, n) => new Date(Date.parse(`${date}T00:00:00Z`) + n * DAY).toISOString().slice(0, 10);
/** A time `ms` after `iso`, to the whole second, so plan times compare as strings. */
const after = (iso, ms) => new Date(Date.parse(iso) + Math.floor(ms / 1000) * 1000).toISOString().replace('.000Z', 'Z');
/** A deterministic number in [0, 1) for a key. */
const draw = (key) => parseInt(crypto.createHash('sha1').update(String(key)).digest('hex').slice(0, 13), 16) / 2 ** 52;
const gumbel = (key) => -Math.log(-Math.log(Math.min(Math.max(draw(key), 1e-12), 1 - 1e-12)));

function load(root, dir) {
    const d = path.join(root, 'generated', dir);
    if (!fs.existsSync(d)) return [];
    const out = [];
    for (const f of fs.readdirSync(d).sort()) {
        if (f === '.mj-sync.json' || !f.endsWith('.json')) continue;
        const j = JSON.parse(fs.readFileSync(path.join(d, f), 'utf8'));
        if (Array.isArray(j)) out.push(...j);
    }
    return out;
}
const flat = (r) => ({ id: up(r.primaryKey?.ID), ...r.fields });
const readJson = (root, rel, fallback) => (fs.existsSync(path.join(root, rel)) ? JSON.parse(fs.readFileSync(path.join(root, rel), 'utf8')) : fallback);
const children = (r, name) => r.collections?.[name] ?? r.relatedEntities?.[name] ?? [];

// ---------- the world ----------
export function loadWorld(root) {
    const w = loadMemberWorld(root);
    const products = new Map(load(root, 'products').map(flat).map((p) => [p.id, p.Name]));
    // Each membership purchase's type ("Individual", "Corporate", …), for the voting class on the day of the roll.
    const membershipTypes = [];
    for (const r of load(root, 'orders')) {
        const o = r.fields;
        if (o.Status !== 'Confirmed' || o.ReversesOrderHeaderID) continue;
        for (const l of children(r, 'Lines')) {
            const name = products.get(up(l.fields.ProductID)) ?? '';
            const m = name.match(/^(.*) Membership \(annual\)$/);
            if (m && !l.fields.ReversesOrderLineID) membershipTypes.push({ person: up(o.BillToPersonID), date: day(o.OrderDate), type: m[1] });
        }
    }
    membershipTypes.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
    return {
        ...w,
        membershipTypes,
        meetings: load(root, 'committee-meetings').map((m) => ({
            ...flat(m),
            motions: children(m, 'Motions').map((mo) => ({ ...flat(mo), votes: children(mo, 'Votes').map(flat) })),
        })),
        spaces: readJson(root, SPACES_PLAN, { spaces: [] }).spaces,
        statements: readJson(root, STATEMENTS_FILE, {}).statements ?? {},
        standards: readJson(root, STANDARDS_FILE, null),
        comments: readJson(root, COMMENTS_FILE, {}).comments ?? {},
    };
}

// ---------- the plan ----------
/** `opts.board` overrides BOARD's settings and `opts.standards` the standards catalog (the specs use them to run a small world). */
export function buildPlan(w, opts = {}) {
    const board = { ...BOARD, ...opts.board };
    const ix = makeIndex(w);
    const elections = [];
    const committeeOf = new Map(w.committees.map((c) => [c.id, c]));
    const membership = new Map(w.memberships.map((m) => [m.id, m]));
    const holding = (committeeId, role, date) => w.memberships.find((m) => m.committeeID === committeeId && m.role === role
        && day(m.StartDate) <= date && (!m.EndDate || day(m.EndDate) >= date));

    elections.push(...committeeMotions(w, committeeOf, membership, holding));
    elections.push(...boardElections(w, ix, holding, board));
    elections.push(...standardsBallots(w, ix, holding, opts.standards ?? w.standards));

    const names = new Set();
    for (const e of elections) {
        if (names.has(e.name)) throw new Error(`two elections are named "${e.name}"; the loader finds elections by name`);
        names.add(e.name);
    }
    return {
        version: 1,
        asOf: w.asOf,
        generatedBy: 'scripts/build-elections-plan.mjs',
        board: boardRoster(elections, board),
        elections,
    };
}

// Committee motions: one roll-call election per motion, as recorded.
function committeeMotions(w, committeeOf, membership, holding) {
    const out = [];
    const spaceOf = new Map(w.spaces.flatMap((s) => s.anchors.filter((a) => a.entity === COMMITTEES_ENTITY).map((a) => [up(a.recordId), s.id])));
    const meetings = [...w.meetings].sort((a, b) => (a.StartDateTime < b.StartDateTime ? -1 : a.StartDateTime > b.StartDateTime ? 1 : a.id < b.id ? -1 : 1));
    for (const meeting of meetings) {
        const committee = committeeOf.get(up(meeting.CommitteeID));
        if (!committee) continue;
        const date = day(meeting.StartDateTime);
        for (const motion of [...meeting.motions].sort((a, b) => a.Sequence - b.Sequence)) {
            const person = (membershipId) => membership.get(up(membershipId))?.PersonID;
            const counts = { Yes: 0, No: 0, Abstain: 0 };
            for (const v of motion.votes) if (v.VoteValue in counts) counts[v.VoteValue]++;
            if ((motion.Result === 'Passed') !== counts.Yes > counts.No) {
                throw new Error(`motion ${motion.id} records ${motion.Result} but its votes are ${counts.Yes}–${counts.No}`);
            }
            const opensAt = addMinutes(meeting.StartDateTime, 10 * motion.Sequence);
            const voters = [...motion.votes].sort((a, b) => (a.id < b.id ? -1 : 1)).filter((v) => person(v.MembershipID));
            const certifier = [holding(committee.id, 'Chair', date), holding(committee.id, 'Vice Chair', date)].find(Boolean)?.PersonID
                ?? person(motion.MovedByMembershipID);
            const space = spaceOf.get(committee.id);
            out.push({
                key: `motion-${motion.id.toLowerCase()}`,
                family: 'committee-motion',
                type: 'motion',
                name: `${motion.Name} (${committee.Name.replace(/ Committee$/, '')}, ${date})`,
                description: `Moved at the ${committee.Name} meeting on ${date}. Roll call.`,
                secrecy: 'Open',
                resultsTiming: 'AfterClose',
                resultsAudience: 'Eligible',
                opensAt,
                closesAt: addMinutes(opensAt, 10),
                certifier,
                anchors: [
                    { entity: MOTIONS_ENTITY, recordId: motion.id, role: 'Subject', isPrimary: true },
                    ...(space ? [{ entity: SPACES_ENTITY, recordId: space, role: 'Host', isPrimary: false }] : []),
                ],
                contests: [{ name: motion.Name, kind: 'Motion', tally: 'majority', threshold: 'Majority', basis: 'VotesCast', allowAbstain: true }],
                roll: [...new Set(voters.map((v) => person(v.MembershipID)))].map((p) => ({ person: p })),
                ballots: voters.filter((v) => v.VoteValue in counts).map((v, i) => ({
                    person: person(v.MembershipID),
                    channel: 'InPerson',
                    at: addMinutes(opensAt, 1 + i * 0.25),
                    contests: [v.VoteValue === 'Abstain' ? { abstain: true } : { option: v.VoteValue }],
                })),
                expect: [{ result: motion.Result, yes: counts.Yes, no: counts.No, abstain: counts.Abstain }],
            });
        }
    }
    return out;
}

// Board elections: three seats a year, staggered three-year terms, two-term limit.
function boardElections(w, ix, holding, BOARD) {
    const out = [];
    const hero = (key) => ix.hero(key);
    const never = new Set(BOARD.never.map(hero).filter(Boolean));
    const officers = w.memberships.filter((m) => m.role === 'Chair' || m.role === 'Vice Chair');
    const typeOn = (pid, date) => {
        let t = null;
        for (const m of w.membershipTypes) if (m.person === pid && m.date <= date) t = m.type;
        return t;
    };
    const terms = new Map(); // person -> years they were elected
    const lostIn = new Map(); // person -> last year they lost
    const classOf = new Map(); // election year -> directors it elected

    for (const year of BOARD.years) {
        const key = `board-${year}`;
        const recordDate = `${year}-10-01`;
        const current = ix.currentAt(recordDate);
        const engagement = ix.engagementAt(recordDate);
        const joined = (pid) => day(ix.profile.get(pid)?.JoinDate) || ix.firstPurchase.get(pid) || '9999';
        const canRun = (pid) => ix.eligible(pid) && current.has(pid) && !never.has(pid) && joined(pid) <= `${year - 2}-10-01`
            && (terms.get(pid)?.length ?? 0) < BOARD.maxTerms;
        const sitting = new Set(BOARD.years.filter((y) => y < year && y >= year - BOARD.termYears + 1).flatMap((y) => classOf.get(y) ?? []));
        const beat = BOARD.beats[year] ?? {};
        const beatWins = (beat.wins ?? []).map(hero).filter(canRun);
        const beatLoses = (beat.loses ?? []).map(hero).filter(canRun);

        // Incumbents whose term ends this year run again unless termed out; one may lose.
        const incumbents = (classOf.get(year - BOARD.termYears) ?? []).filter(canRun);
        // The least engaged incumbents lose: one in an incumbentLoses year, and any a story-beat winner unseats.
        incumbents.sort((a, b) => (engagement.get(b) ?? 0) - (engagement.get(a) ?? 0) || (a < b ? -1 : 1));
        const keep = Math.min(BOARD.seats - beatWins.length, incumbents.length - (BOARD.incumbentLoses.includes(year) ? 1 : 0));
        const losingIncumbents = incumbents.slice(Math.max(0, keep));
        const winners = [...new Set([...beatWins, ...incumbents.filter((p) => !losingIncumbents.includes(p))])];
        const taken = new Set([...winners, ...beatLoses, ...losingIncumbents, ...sitting]);
        // Fresh candidates: past committee officers, most engaged first, skipping last year's losers.
        const pool = [...new Set(officers.filter((m) => day(m.StartDate) < recordDate).map((m) => m.PersonID))]
            .filter((p) => canRun(p) && !taken.has(p) && lostIn.get(p) !== year - 1)
            .sort((a, b) => (engagement.get(b) ?? 0) - (engagement.get(a) ?? 0) || (draw(`${key}:${a}`) < draw(`${key}:${b}`) ? -1 : 1));
        while (winners.length < BOARD.seats && pool.length) winners.push(pool.shift());
        const losers = [...beatLoses, ...losingIncumbents];
        const withdrawing = BOARD.withdrawn.includes(year) ? 1 : 0;
        while (winners.length + losers.length < BOARD.candidates + withdrawing && pool.length) losers.push(pool.shift());
        const withdrawn = withdrawing ? losers.splice(losers.length - 1, 1) : [];
        if (winners.length !== BOARD.seats) throw new Error(`${key}: only ${winners.length} candidates can win`);

        const candidates = [...winners, ...losers].sort((a, b) => (fullName(ix, a) < fullName(ix, b) ? -1 : 1));
        // Winners lead, but not by a landslide: the gap is about one unit of the voters' Gumbel noise.
        const strength = new Map(candidates.map((p) => [p, (winners.includes(p) ? 1.3 : 0) + 0.35 * draw(`${key}:strength:${p}`)]));
        const profile = (p) => ix.profile.get(p) ?? {};

        // The roll: every current member on the record date; voting class is their membership type.
        const roll = [...current].filter((p) => ix.eligible(p)).sort().map((p) => ({ person: p, class: typeOn(p, recordDate) ?? 'Individual' }));
        const opensAt = `${year}-10-15T13:00:00Z`;
        const closesAt = `${year}-11-15T23:00:00Z`;
        const span = Date.parse(closesAt) - Date.parse(opensAt);
        const ballots = [];
        for (const { person } of roll) {
            const e = Math.min(engagement.get(person) ?? 0, 6);
            if (draw(`${key}:votes:${person}`) >= BOARD.turnout[year] * (0.55 + 0.15 * e)) continue;
            const mine = profile(person);
            const scored = candidates.map((c) => {
                const theirs = profile(c);
                const affinity = (mine.Segment && mine.Segment === theirs.Segment ? 0.5 : 0) + (mine.Region && mine.Region === theirs.Region ? 0.4 : 0);
                return { c, s: strength.get(c) + affinity + gumbel(`${key}:pref:${person}:${c}`) };
            }).sort((a, b) => b.s - a.s);
            const depth = draw(`${key}:depth:${person}`);
            const ranked = scored.slice(0, depth < 0.3 ? 1 : depth < 0.5 ? 2 : depth < 0.8 ? 3 : scored.length).map((x) => x.c);
            ballots.push({
                person,
                channel: draw(`${key}:paper:${person}`) < BOARD.paperShare ? 'Paper' : 'Online',
                at: after(opensAt, draw(`${key}:at:${person}`) ** 1.6 * span),
                contests: [{ ranks: ranked.map((c) => ({ person: c })) }],
            });
        }
        ballots.sort((a, b) => (a.at < b.at ? -1 : a.at > b.at ? 1 : a.person < b.person ? -1 : 1));
        // The planned winners must lead on first preferences, with room to spare, or STV could seat someone else.
        const first = new Map(candidates.map((c) => [c, 0]));
        for (const b of ballots) first.set(b.contests[0].ranks[0].person, first.get(b.contests[0].ranks[0].person) + 1);
        const weakestWinner = Math.min(...winners.map((c) => first.get(c)));
        const strongestLoser = Math.max(...losers.map((c) => first.get(c)));
        if (weakestWinner < strongestLoser * 1.15 + 3) throw new Error(`${key}: a planned winner has ${weakestWinner} first preferences, a loser ${strongestLoser}`);

        // An officer who isn't running and isn't on the board certifies: Membership & Outreach's chair, else another chair.
        const certifier = [holding(mo(w), 'Chair', recordDate), ...w.committees.map((c) => holding(c.id, 'Chair', recordDate))]
            .filter(Boolean).map((m) => m.PersonID).find((p) => !candidates.includes(p) && !withdrawn.includes(p) && !sitting.has(p));
        if (!certifier) throw new Error(`${key}: no committee chair is free to certify`);
        const nominated = [...candidates, ...withdrawn];
        out.push({
            key,
            family: 'board-election',
            type: 'board-election',
            name: `ICF Board of Directors Election ${year}`,
            description: `Three seats on the nine-member Board of Directors, for the ${year + 1}–${year + BOARD.termYears} term. Ranked ballot (single transferable vote).`,
            secrecy: 'Secret',
            resultsTiming: 'AfterClose',
            resultsAudience: 'HostMembers',
            createdAt: `${year}-08-25T14:00:00Z`,
            recordDate: `${recordDate}T12:00:00Z`,
            opensAt,
            closesAt,
            certifiedAt: `${year}-11-18T16:00:00Z`,
            certifier,
            anchors: [],
            contests: [{ name: `Board of Directors (${BOARD.seats} seats)`, kind: 'Office', tally: 'stv', seats: BOARD.seats, allowAbstain: false }],
            nominations: {
                opensAt: `${year}-09-01T13:00:00Z`,
                closesAt: `${year}-09-30T23:00:00Z`,
                entries: nominated.map((p) => ({
                    person: p,
                    submittedAt: after(`${year}-09-02T14:00:00Z`, draw(`${key}:nom:${p}`) * 26 * 86400000),
                    statement: w.statements[`${key}:${p}`] ?? null,
                    withdrawn: withdrawn.includes(p),
                })).sort((a, b) => (a.submittedAt < b.submittedAt ? -1 : 1)),
            },
            roll,
            ballots,
            expect: [{ elected: [...winners].sort() }],
        });
        for (const p of winners) terms.set(p, [...(terms.get(p) ?? []), year]);
        for (const p of losers) lostIn.set(p, year);
        classOf.set(year, winners);
    }
    return out;
}

// Standards ballots: the Standards Committee and its ballot pool vote a draft standard section by section.
function standardsBallots(w, ix, holding, S) {
    if (!S) return [];
    const committee = w.committees.find((c) => c.Name === 'Standards Committee');
    if (!committee) throw new Error('standards ballots need the Standards Committee');
    const space = w.spaces.find((s) => s.anchors.some((a) => a.entity === COMMITTEES_ENTITY && up(a.recordId) === committee.id))?.id;
    const seated = (date) => new Set(w.memberships.filter((m) => m.committeeID === committee.id && day(m.StartDate) <= date
        && (!m.EndDate || day(m.EndDate) >= date)).map((m) => m.PersonID).filter((p) => ix.eligible(p)));
    const out = [];
    const byKey = new Map();
    const pool = new Set(); // members who signed up to the ballot pool and are still in it
    let last = '';

    for (const b of S.ballots) {
        const doc = S.documents[b.doc];
        if (!doc) throw new Error(`${b.key}: no document ${b.doc}`);
        if (b.opens < last) throw new Error(`${b.key}: ballots must be in date order`);
        last = b.opens;
        const round = b.round ?? 0;
        const prior = b.prior ? byKey.get(b.prior) : null;
        if (round > 0 && (!prior || prior.standards.code !== b.doc)) throw new Error(`${b.key}: a recirculation follows an earlier ballot on ${b.doc}`);
        const opensAt = `${b.opens}T14:00:00Z`;
        const closesAt = `${addDays(b.opens, b.days)}T23:00:00Z`;
        const certifiedAt = `${addDays(b.opens, b.days + 21)}T16:00:00Z`;
        if (prior && opensAt <= prior.certifiedAt) throw new Error(`${b.key}: opens before ${prior.key} is certified`);
        const year = b.opens.slice(0, 4);
        const sitting = seated(b.opens);
        const current = ix.currentAt(b.opens);

        // The roll: a recirculation goes back to the voters of the ballot it follows who are still members; a new
        // ballot goes to the committee and the pool, topped up from engaged members, keenest first.
        let roll;
        if (prior) {
            roll = prior.roll.filter((r) => sitting.has(r.person) || current.has(r.person));
        } else {
            const engagement = ix.engagementAt(b.opens);
            for (const p of [...pool]) if (!current.has(p) || sitting.has(p)) pool.delete(p);
            const keen = [...current].filter((p) => ix.eligible(p) && !sitting.has(p) && !pool.has(p)
                && S.pool.segments.includes(ix.profile.get(p)?.Segment) && (engagement.get(p) ?? 0) >= 2)
                .sort((x, y) => draw(`std-pool:${x}`) - draw(`std-pool:${y}`) || (x < y ? -1 : 1));
            while (pool.size < S.pool.size[year] && keen.length) pool.add(keen.shift());
            roll = [...[...sitting].map((p) => ({ person: p, class: 'Committee' })), ...[...pool].map((p) => ({ person: p, class: 'Ballot Pool' }))]
                .sort((x, y) => (x.person < y.person ? -1 : 1));
        }
        const classOf = new Map(roll.map((r) => [r.person, r.class]));
        const voting = roll.map((r) => r.person).filter((p) => draw(`${b.key}:votes:${p}`) < S.pool.turnout[classOf.get(p)]);
        if (voting.length < roll.length * 0.6) throw new Error(`${b.key}: only ${voting.length} of ${roll.length} return a ballot`);

        const comment = (p, i, item, disapproving) => {
            const id = `${b.key}:${p}:${i}`;
            const shares = DISPOSITIONS[disapproving ? (item.fail ? 'failing' : 'passing') : 'editorial'];
            let x = draw(`${id}:disposition`);
            const disposition = shares.find(([, share]) => (x -= share) < 0)?.[0] ?? shares[0][0];
            const answers = disposition !== 'Withdrawn' && draw(`${id}:answers`) >= 0.15;
            const commenter = answers ? (draw(`${id}:satisfied`) < SATISFIED[disposition] ? 'Satisfied' : 'Unsatisfied') : null;
            const resolvedAt = after(closesAt, (2 + 10 * draw(`${id}:resolved`)) * DAY);
            const words = w.comments[id] ?? {};
            return {
                key: id,
                type: disapproving ? (draw(`${id}:type`) < 0.2 ? 'General' : 'Technical') : 'Editorial',
                reference: words.reference ?? null,
                comment: words.comment ?? null,
                proposedChange: words.proposedChange ?? null,
                resolution: {
                    disposition,
                    response: words.response ?? null,
                    at: resolvedAt,
                    commenter,
                    answeredAt: commenter ? after(resolvedAt, (1 + 4 * draw(`${id}:answered`)) * DAY) : null,
                },
            };
        };

        // Each item: who abstains, who disapproves (on a recirculation, the unsatisfied first), and the result.
        const choices = new Map(voting.map((p) => [p, []]));
        const expect = b.items.map((item, i) => {
            const abstaining = new Set(voting.filter((p) => draw(`${b.key}:${i}:abstain:${p}`) < S.pool.abstain[classOf.get(p)]));
            const casting = voting.filter((p) => !abstaining.has(p));
            const carried = new Set(prior && item.carry != null ? prior.ballots.filter((x) => x.contests[item.carry]?.option === 'Disapprove'
                && x.contests[item.carry].comment.resolution.commenter !== 'Satisfied').map((x) => x.person) : []);
            const ranked = [...casting].sort((x, y) => Number(carried.has(y)) - Number(carried.has(x)) || draw(`${b.key}:${i}:dis:${x}`) - draw(`${b.key}:${i}:dis:${y}`));
            const n = casting.length;
            if (n < 3) throw new Error(`${b.key}: item ${i + 1} has only ${n} votes cast`);
            // Two-thirds of votes cast approves: at most a third may disapprove an item that passes.
            const want = Math.round(item.dis * n);
            const disapprove = new Set(ranked.slice(0, item.fail ? Math.max(want, Math.floor(n / 3) + 1) : Math.min(want, Math.floor(n / 3))));
            for (const p of voting) {
                if (abstaining.has(p)) { choices.get(p).push({ abstain: true }); continue; }
                const against = disapprove.has(p);
                const remarks = against || draw(`${b.key}:${i}:editorial:${p}`) < S.pool.editorial[classOf.get(p)];
                choices.get(p).push({ option: against ? 'Disapprove' : 'Approve', ...(remarks ? { comment: comment(p, i, item, against) } : {}) });
            }
            const approve = n - disapprove.size;
            return { result: approve * 3 >= n * 2 ? 'Passed' : 'Failed', approve, disapprove: disapprove.size, abstain: abstaining.size };
        });

        const certifier = [holding(committee.id, 'Chair', certifiedAt.slice(0, 10)), holding(committee.id, 'Vice Chair', certifiedAt.slice(0, 10))].find(Boolean)?.PersonID;
        if (!certifier) throw new Error(`${b.key}: the Standards Committee has no chair or vice chair on ${certifiedAt.slice(0, 10)}`);
        const motion = b.motion && w.meetings.filter((m) => up(m.CommitteeID) === committee.id && day(m.StartDateTime) === b.motion.date)
            .flatMap((m) => m.motions).find((mo) => mo.Name === b.motion.name);
        if (b.motion && !motion) throw new Error(`${b.key}: no Standards Committee motion "${b.motion.name}" on ${b.motion.date}`);
        const span = Date.parse(closesAt) - Date.parse(opensAt);
        const items = b.items.map((it) => it.name);
        const e = {
            key: b.key,
            family: 'standards-ballot',
            type: 'standards-ballot',
            name: `${b.doc} ${doc.short} v${b.version.split(' ')[0]} — ${round ? `Recirculation ${round}` : 'Ballot'}`,
            description: (round
                ? `Recirculation ${round} of the ballot on ${b.doc} ${doc.title} ${b.version.split(' ')[0]}, to the same voters: ${items.join('; ')}, revised after the last round's comments.`
                : `Standards Committee ballot on ${b.doc} ${doc.title}, version ${b.version}: ${items.join('; ')}.`)
                + ' The committee and its ballot pool vote each item; two-thirds of votes cast approves it, and a Disapprove must come with a comment.',
            secrecy: 'Open',
            resultsTiming: 'AfterClose',
            resultsAudience: 'Public',
            createdAt: `${addDays(b.opens, -7)}T15:00:00Z`,
            recordDate: `${addDays(b.opens, -1)}T12:00:00Z`,
            opensAt,
            closesAt,
            talliedAt: `${addDays(b.opens, b.days + 1)}T15:00:00Z`,
            certifiedAt,
            certifier,
            standards: { code: b.doc, documentTitle: `${b.doc} ${doc.title}`, documentVersion: b.version, round, prior: prior?.name ?? null },
            anchors: [
                { entity: COMMITTEES_ENTITY, recordId: committee.id, role: 'Host', isPrimary: true },
                ...(space ? [{ entity: SPACES_ENTITY, recordId: space, role: 'Host', isPrimary: false }] : []),
                ...(motion ? [{ entity: MOTIONS_ENTITY, recordId: motion.id, role: 'Subject', isPrimary: false }] : []),
            ],
            contests: b.items.map((it) => ({
                name: it.name, kind: 'StandardsItem', tally: 'majority', threshold: 'TwoThirds', basis: 'VotesCast', allowAbstain: true,
                options: [{ label: 'Approve' }, { label: 'Disapprove' }],
            })),
            roll,
            ballots: voting.map((p) => ({ person: p, channel: 'Online', at: after(opensAt, draw(`${b.key}:at:${p}`) ** 1.4 * span), contests: choices.get(p) }))
                .sort((x, y) => (x.at < y.at ? -1 : x.at > y.at ? 1 : x.person < y.person ? -1 : 1)),
            expect,
        };
        b.items.forEach((it, i) => {
            if ((expect[i].result === 'Failed') !== Boolean(it.fail)) throw new Error(`${b.key}: "${it.name}" ${expect[i].result}, the catalog says it ${it.fail ? 'fails' : 'passes'}`);
        });
        out.push(e);
        byKey.set(b.key, e);
    }
    return out;
}

const fullName = (ix, pid) => {
    const p = ix.person.get(pid);
    return p ? `${p.FirstName} ${p.LastName}` : pid;
};
const mo = (w) => w.committees.find((c) => /^Membership/.test(c.Name))?.id;

/** Who sits on the board each year, from the elections: for the world model and the content rules. */
function boardRoster(elections, BOARD) {
    const seats = [];
    for (const e of elections.filter((x) => x.family === 'board-election')) {
        const year = Number(e.key.slice(-4));
        for (const p of e.expect[0].elected) seats.push({ person: p, from: year + 1, to: year + BOARD.termYears, elected: year });
    }
    return seats.sort((a, b) => a.from - b.from || (a.person < b.person ? -1 : 1));
}

export const renderPlan = (plan) => JSON.stringify(plan, null, 2) + '\n';

function main(argv) {
    const root = process.cwd();
    const plan = buildPlan(loadWorld(root));
    const body = renderPlan(plan);
    const file = path.join(root, PLAN_FILE);
    if (argv.includes('--check')) {
        if (!fs.existsSync(file) || fs.readFileSync(file, 'utf8') !== body) {
            console.error(`elections plan is out of date: ${PLAN_FILE}\nrun: node scripts/build-elections-plan.mjs`);
            process.exit(1);
        }
        console.log('elections plan is up to date');
        return;
    }
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, body);
    const byFamily = plan.elections.reduce((m, e) => ((m[e.family] = (m[e.family] ?? 0) + 1), m), {});
    const ballots = plan.elections.reduce((n, e) => n + e.ballots.length, 0);
    console.log(`${plan.elections.length} elections (${Object.entries(byFamily).map(([k, v]) => `${v} ${k}`).join(', ')}), ${ballots} ballots`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main(process.argv.slice(2));
