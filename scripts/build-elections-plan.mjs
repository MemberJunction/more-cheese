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
 *                       mid-October to mid-November, every member current on August 31 on the roll. Directors serve three years and
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
 *   member votes      — the bylaw amendments and referendums the board puts to every member (VAULT-DESIGN §5.5), from
 *                       data/elections/member-votes.json: a secret ballot with every current member on the roll two weeks
 *                       before it opens, Yes/No per amendment or question; two-thirds of votes cast carries an amendment,
 *                       a majority a referendum. Online, or by mail; a vote held at the annual meeting is cast there by
 *                       the conference's registrants, in person, and by proxy holders (committee members there) for
 *                       members who named one.
 *                       Certified by Membership & Outreach's chair.
 *   chapter officers  — each chapter elects its chair and vice chair every two years, from 2020 (VAULT-DESIGN §5.6):
 *                       nominations in February, a secret plurality ballot of the chapter's current members in March,
 *                       anchored to the chapter's space. 2026's winners are the chapter's officers in its space (owner,
 *                       first admin, skipping heroes who never run); before that, officers run again (two terms at most as chair) or the vice chair
 *                       moves up. One race ties and is broken by lot. Certified by Membership & Outreach's chair.
 *   polls             — Yes/No polls in chapter and work-group spaces, from data/elections/polls.json: a chapter poll goes
 *                       to the chapter's current members, a work-group poll to the space's members; live results, tallied
 *                       when the poll closes and never certified.
 *   e-votes           — committee motions voted electronically between meetings, from data/elections/evotes.json: an
 *                       Open roll call of the committee's members over a week or two. Certified by the committee's chair.
 *
 * The plan stops at the data's as-of date (generated/checkpoint.json): an election still open then is planned as open,
 * with only the ballots cast by then and no result; one whose nominations are open is planned in nominations; one not
 * yet started is left out. Each later month's data finishes them. Every election open on the as-of date has a place on
 * its roll for the demo's presenter, whom scripts/load-elections.mjs --presenter seats as a voter.
 *   node scripts/build-elections-plan.mjs           # write the plan
 *   node scripts/build-elections-plan.mjs --check   # exit 1 if the plan is out of date
 *   node scripts/build-elections-plan.mjs --rewrite-history   # write even if it changes what the last plan planned
 * Writing refuses a plan that changes the past: an election the last plan finished, or the roll, dates and ballots so far
 * of one it had open (historyChanges). The monthly run relies on that, since the demo database holds the last plan.
 *
 * Plain Node, no dependencies. Run from the repo root.
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { loadWorld as loadMemberWorld, makeIndex, CHAPTERS } from './build-spaces-plan.mjs';

const PLAN_FILE = 'data/elections/elections.plan.json';
const STATEMENTS_FILE = 'data/elections/statements.json';
const STANDARDS_FILE = 'data/elections/standards.json';
const COMMENTS_FILE = 'data/elections/comments.json';
const MEMBER_VOTES_FILE = 'data/elections/member-votes.json';
const POLLS_FILE = 'data/elections/polls.json';
const EVOTES_FILE = 'data/elections/evotes.json';
const SPACES_PLAN = 'data/spaces/spaces.plan.json';
const MOTIONS_ENTITY = 'Committees: Motions';
const COMMITTEES_ENTITY = 'Committees: Committees';
const SPACES_ENTITY = 'MJ_BizApps_Collaboration: Spaces';

/** The board's elections. Each year's three seats are the class elected three years before. */
const BOARD = {
    seats: 3,
    termYears: 3,
    maxTerms: 2,
    years: [2019, 2020, 2021, 2022, 2023, 2024, 2025, 2026],
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
    turnout: { 2019: 0.27, 2020: 0.34, 2021: 0.31, 2022: 0.26, 2023: 0.23, 2024: 0.28, 2025: 0.36, 2026: 0.31 },
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
/** Member votes: the chance a conference registrant on the roll votes at the annual meeting, and a voter abstains on an item. */
const MEETING_TURNOUT = 0.85;
const MEMBER_ABSTAIN = 0.03;

/** Chapter officer elections. */
const CHAPTER = {
    years: [2020, 2022, 2024, 2026],
    offices: ['Chapter Chair', 'Vice Chair'],
    // Share of the roll that votes, before engagement: chapters are small and local, so higher than member-wide votes.
    turnout: 0.45,
    smallChapter: 30,
    smallTurnout: 0.65,
    minVoters: 5,
    // An officer runs again with this chance (a chair for two terms at most), and a vice chair moves up to chair.
    rerun: 0.6,
    moveUp: 0.55,
    // In the cycle before 2026, the 2026 chair is often already vice chair.
    groomed: 0.6,
    // The share of chair and vice chair races with a single candidate, and the abstentions in each kind of race.
    uncontested: [0.2, 0.4],
    abstain: { contested: 0.04, uncontested: 0.15 },
    // The one race that ties and is broken by lot.
    tie: { chapter: 'chapter-mexico', year: 2022, office: 1 },
    // Heroes who never run for anything (as for the board).
    never: BOARD.never,
};
/** Polls: the share of the roll that answers, chapter polls before engagement. */
const POLL_TURNOUT = { chapter: 0.25, smallChapter: 0.55, group: 0.8 };
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
    // Who registered for each event (ORD-E-REG-<person>-<EventKey>), less registrations later reversed.
    const reversed = new Set(load(root, 'orders').map((r) => up(r.fields.ReversesOrderHeaderID)).filter(Boolean));
    const registrations = new Map();
    for (const r of load(root, 'orders')) {
        const m = String(r.fields.OrderNumber ?? '').match(/^ORD-E-REG-.*-(EVT-\d{4}-[A-Z0-9]+)$/);
        if (!m || r.fields.Status !== 'Confirmed' || r.fields.ReversesOrderHeaderID || reversed.has(up(r.primaryKey?.ID))) continue;
        if (!registrations.has(m[1])) registrations.set(m[1], new Set());
        registrations.get(m[1]).add(up(r.fields.BillToPersonID));
    }
    return {
        ...w,
        membershipTypes,
        registrations,
        meetings: load(root, 'committee-meetings').map((m) => ({
            ...flat(m),
            motions: children(m, 'Motions').map((mo) => ({ ...flat(mo), votes: children(mo, 'Votes').map(flat) })),
        })),
        spaces: readJson(root, SPACES_PLAN, { spaces: [] }).spaces,
        statements: readJson(root, STATEMENTS_FILE, {}).statements ?? {},
        standards: readJson(root, STANDARDS_FILE, null),
        comments: readJson(root, COMMENTS_FILE, {}).comments ?? {},
        memberVotes: readJson(root, MEMBER_VOTES_FILE, null),
        polls: readJson(root, POLLS_FILE, null),
        evotes: readJson(root, EVOTES_FILE, null),
    };
}

// ---------- the plan ----------
/**
 * `opts.board` and `opts.chapter` override BOARD's and CHAPTER's settings, and `opts.standards`, `opts.memberVotes`,
 * `opts.polls` and `opts.evotes` the catalogs (the specs use them to run a small world).
 */
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
    elections.push(...memberVotes(w, ix, holding, opts.memberVotes ?? w.memberVotes));
    elections.push(...chapterElections(w, ix, holding, { ...CHAPTER, ...opts.chapter }));
    elections.push(...polls(w, ix, opts.polls ?? w.polls));
    elections.push(...committeeEvotes(w, holding, opts.evotes ?? w.evotes));

    const planned = asOfCut(elections, w.asOf);
    const names = new Set();
    for (const e of planned) {
        if (names.has(e.name)) throw new Error(`two elections are named "${e.name}"; the loader finds elections by name`);
        names.add(e.name);
    }
    return {
        version: 1,
        asOf: w.asOf,
        generatedBy: 'scripts/build-elections-plan.mjs',
        board: boardRoster(planned, board),
        elections: planned,
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
    const typeOn = membershipTypeOn(w);
    const terms = new Map(); // person -> years they were elected
    const lostIn = new Map(); // person -> last year they lost
    const classOf = new Map(); // election year -> directors it elected

    for (const year of BOARD.years) {
        const key = `board-${year}`;
        // Candidates are judged as of October 1; the roll is as of the day before nominations open (opening them
        // freezes it).
        const recordDate = `${year}-10-01`;
        const rollDate = `${year}-08-31`;
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
        const roll = [...ix.currentAt(rollDate)].filter((p) => ix.eligible(p)).sort().map((p) => ({ person: p, class: typeOn(p, rollDate) ?? 'Individual' }));
        const onRoll = new Set(roll.map((r) => r.person));
        const offRoll = [...winners, ...losers, ...withdrawn].filter((p) => !onRoll.has(p));
        if (offRoll.length) throw new Error(`${key}: candidates ${offRoll.join(', ')} are not members on ${rollDate}`);
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
            recordDate: `${rollDate}T12:00:00Z`,
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

// Member votes: the board's bylaw amendments and referendums, decided by every current member.
function memberVotes(w, ix, holding, V) {
    if (!V) return [];
    const typeOn = membershipTypeOn(w);
    const out = [];
    for (const v of V.votes) {
        const opensAt = `${v.opens}T13:00:00Z`;
        const closesAt = `${v.closes}T23:00:00Z`;
        const certifiedAt = `${v.certified}T16:00:00Z`;
        if (v.certified <= addDays(v.closes, 1)) throw new Error(`${v.key}: certified before the day after it closes`);
        const recordDate = addDays(v.opens, -14);
        const span = Date.parse(closesAt) - Date.parse(opensAt);
        const current = ix.currentAt(recordDate);
        const engagement = ix.engagementAt(recordDate);
        const roll = [...current].filter((p) => ix.eligible(p)).sort().map((p) => ({ person: p, class: typeOn(p, recordDate) ?? 'Individual' }));
        const classOf = new Map(roll.map((r) => [r.person, r.class]));
        const ch = v.channels;
        const attending = ch.meeting ? w.registrations.get(ch.meeting) ?? new Set() : new Set();
        if (ch.meeting && !v.meetingAt) throw new Error(`${v.key}: a vote at the annual meeting needs meetingAt`);

        // Who votes: the registrants at the meeting, and the rest as their engagement and the year's storyline go.
        const voters = roll.map((r) => r.person).filter((p) => {
            if (attending.has(p)) return draw(`${v.key}:attends:${p}`) < MEETING_TURNOUT;
            const e = Math.min(engagement.get(p) ?? 0, 6);
            return draw(`${v.key}:votes:${p}`) < v.turnout * (0.55 + 0.15 * e);
        });
        const share = voters.length / roll.length;
        if (share < 0.15 || share > 0.45) throw new Error(`${v.key}: ${voters.length} of ${roll.length} vote (${Math.round(share * 100)}%), outside member-wide turnout`);

        // How each votes: at the meeting in person, else by proxy (held by a committee member at the meeting), by mail,
        // or online. Mail for a meeting vote arrives before the meeting.
        const holders = [...new Set(w.memberships.filter((m) => day(m.StartDate) <= v.closes && (!m.EndDate || day(m.EndDate) >= v.closes))
            .map((m) => m.PersonID))].filter((p) => attending.has(p) && voters.includes(p)).sort();
        const proxies = [];
        const meetingSpan = 90 * 60000;
        const ballots = voters.map((p) => {
            const at = (ms) => after(opensAt, ms);
            if (attending.has(p)) return { person: p, channel: 'InPerson', at: after(v.meetingAt, draw(`${v.key}:at:${p}`) * meetingSpan) };
            if (ch.proxy && draw(`${v.key}:proxy:${p}`) < ch.proxy) {
                if (!holders.length) throw new Error(`${v.key}: no committee member at the meeting can hold a proxy`);
                const deadline = `${ch.proxyDeadline}T23:00:00Z`;
                proxies.push({ person: p, holder: holders[Math.floor(draw(`${v.key}:holder:${p}`) * holders.length)],
                    at: after(opensAt, draw(`${v.key}:proxy-at:${p}`) * (Date.parse(deadline) - Date.parse(opensAt))) });
                return { person: p, channel: 'Proxy', at: after(v.meetingAt, draw(`${v.key}:at:${p}`) * meetingSpan) };
            }
            if (draw(`${v.key}:paper:${p}`) < ch.paper) {
                // Mail takes about five days to go out and come back; for a meeting vote it is in by the day before.
                const last = (v.meetingAt ? Date.parse(v.meetingAt) - DAY : Date.parse(closesAt)) - Date.parse(opensAt) - 5 * DAY;
                return { person: p, channel: 'Paper', at: at(5 * DAY + draw(`${v.key}:at:${p}`) * last) };
            }
            return { person: p, channel: 'Online', at: at(draw(`${v.key}:at:${p}`) ** 1.6 * span) };
        });

        // Each item: a few abstain; of the rest, the planned share votes Yes, a voter's stance carrying across items and
        // their membership class leaning it.
        const choices = new Map(voters.map((p) => [p, []]));
        const expect = v.contests.map((c, i) => {
            const abstaining = new Set(voters.filter((p) => draw(`${v.key}:${i}:abstain:${p}`) < MEMBER_ABSTAIN));
            const casting = voters.filter((p) => !abstaining.has(p));
            const stance = (p) => 0.6 * draw(`${v.key}:stance:${p}`) + 0.4 * draw(`${v.key}:${i}:stance:${p}`) - (c.lean?.[classOf.get(p)] ?? 0);
            const ranked = [...casting].sort((x, y) => stance(x) - stance(y) || (x < y ? -1 : 1));
            const yes = new Set(ranked.slice(0, Math.round(c.yes * casting.length)));
            for (const p of voters) choices.get(p).push(abstaining.has(p) ? { abstain: true } : { option: yes.has(p) ? 'Yes' : 'No' });
            const n = casting.length;
            const passed = c.kind === 'Amendment' ? yes.size * 3 >= n * 2 : yes.size * 2 > n;
            if (passed === Boolean(c.fail)) throw new Error(`${v.key}: "${c.name}" ${passed ? 'passes' : 'fails'}, the catalog says it ${c.fail ? 'fails' : 'passes'}`);
            return { result: passed ? 'Passed' : 'Failed', yes: yes.size, no: n - yes.size, abstain: abstaining.size };
        });

        // Membership & Outreach's chair certifies, else another committee's chair.
        const certifier = [holding(mo(w), 'Chair', v.certified), ...w.committees.map((c) => holding(c.id, 'Chair', v.certified))].find(Boolean)?.PersonID;
        if (!certifier) throw new Error(`${v.key}: no committee chair on ${v.certified} to certify`);
        const space = v.space ? w.spaces.find((s) => s.key === v.space) : null;
        if (v.space && !space) throw new Error(`${v.key}: no space ${v.space}`);
        out.push({
            key: v.key,
            family: 'member-vote',
            type: v.type,
            name: v.name,
            description: v.description,
            secrecy: 'Secret',
            resultsTiming: 'AfterClose',
            resultsAudience: 'Eligible',
            createdAt: `${addDays(v.opens, -21)}T15:00:00Z`,
            recordDate: `${recordDate}T12:00:00Z`,
            opensAt,
            closesAt,
            // Counted the day after it closes; certified once the count is checked.
            talliedAt: `${addDays(v.closes, 1)}T15:00:00Z`,
            certifiedAt,
            certifier,
            anchors: space ? [{ entity: SPACES_ENTITY, recordId: space.id, role: 'Subject', isPrimary: true }] : [],
            contests: v.contests.map((c) => ({
                name: c.name, description: c.text, kind: c.kind, tally: 'majority', threshold: c.kind === 'Amendment' ? 'TwoThirds' : 'Majority',
                basis: 'VotesCast', allowAbstain: true, options: [{ label: 'Yes' }, { label: 'No' }],
            })),
            ...(proxies.length ? { proxies: { deadline: `${ch.proxyDeadline}T23:00:00Z`, entries: proxies.sort((a, b) => (a.at < b.at ? -1 : 1)) } } : {}),
            roll,
            ballots: ballots.map((b) => ({ ...b, contests: choices.get(b.person) }))
                .sort((x, y) => (x.at < y.at ? -1 : x.at > y.at ? 1 : x.person < y.person ? -1 : 1)),
            expect,
        });
    }
    return out;
}

// Chapter officers: every two years each chapter elects a chair and a vice chair.
function chapterElections(w, ix, holding, C) {
    const typeOn = membershipTypeOn(w);
    const out = [];
    const last = C.years[C.years.length - 1];
    const never = new Set(C.never.map((h) => ix.hero(h)).filter(Boolean));
    CHAPTERS.forEach((ch, index) => {
        const space = w.spaces.find((s) => s.key === `chapter-${ch.key}`);
        if (!space) return;
        const region = new Set(w.profiles.filter((p) => (ch.states ? ch.states.includes(p.State) : ch.countries.includes(p.Country))).map((p) => p.PersonID));
        // 2026's officers: the space's owner and admins, in seat order, less heroes who never run.
        const [chair26, vice26] = ['owner', 'admin'].flatMap((role) => space.seats.filter((x) => x.status === 'Active' && x.role === role))
            .map((x) => x.person).filter((p) => !never.has(p));
        const years = C.years.filter((y) => `${y}-01-01` > space.startedAt);
        let prev = null;
        const streak = new Map(); // person -> consecutive terms as chair
        for (const y of years) {
            const key = `chapter-${ch.key}-${y}`;
            const offset = index % 5;
            // The roll is as of the day before nominations open (opening them freezes it); voting opens nine days after
            // they close.
            const nomDay = `${y}-02-${String(1 + offset).padStart(2, '0')}`;
            const recordDate = addDays(nomDay, -1);
            const nomOpens = `${nomDay}T14:00:00Z`;
            const nomCloses = `${addDays(nomDay, 20)}T23:00:00Z`;
            const opens = addDays(nomDay, 30);
            const opensAt = `${opens}T14:00:00Z`;
            const closesAt = `${addDays(opens, 14)}T23:00:00Z`;
            const roll = [...ix.currentAt(recordDate)].filter((p) => region.has(p) && ix.eligible(p)).sort()
                .map((p) => ({ person: p, class: typeOn(p, recordDate) ?? 'Individual' }));
            const onRoll = new Set(roll.map((r) => r.person));
            const engagement = ix.engagementAt(recordDate);
            const keen = [...onRoll].filter((p) => !never.has(p)).sort((a, b) => (engagement.get(b) ?? 0) - (engagement.get(a) ?? 0) || draw(`${key}:keen:${a}`) - draw(`${key}:keen:${b}`));
            const pick = (taken) => keen.find((p) => !taken.has(p));

            // Who wins: 2026's are the officers in the chapter's space; before that, officers run again or move up.
            let chair, vice;
            if (y === last) {
                [chair, vice] = [chair26, vice26];
                if (!onRoll.has(chair) || !onRoll.has(vice)) throw new Error(`${key}: the chapter's officers are not current members on ${recordDate}`);
                if ((streak.get(chair) ?? 0) >= 2) throw new Error(`${key}: ${chair} would chair a third term in a row`);
            } else {
                const penultimate = y === last - 2;
                const may = (p) => p && onRoll.has(p) && (streak.get(p) ?? 0) < 2 && !(penultimate && p === chair26 && (streak.get(p) ?? 0) >= 1) && p !== (penultimate ? vice26 : null);
                if (prev && may(prev.chair) && draw(`${key}:rerun`) < C.rerun) chair = prev.chair;
                else if (prev && may(prev.vice) && draw(`${key}:moveup`) < C.moveUp) chair = prev.vice;
                else chair = keen.find((p) => may(p) && p !== chair26);
                const groom = penultimate && onRoll.has(chair26) && chair !== chair26 && draw(`${key}:groom`) < C.groomed;
                if (groom) vice = chair26;
                else if (prev && prev.vice !== chair && onRoll.has(prev.vice) && prev.vice !== chair26 && draw(`${key}:vice-rerun`) < C.rerun) vice = prev.vice;
                else vice = pick(new Set([chair, chair26, vice26]));
            }
            if (!chair || !vice || chair === vice) throw new Error(`${key}: cannot fill both offices from ${roll.length} members`);

            // Who else runs: none in an uncontested race, else one or two of the keenest members.
            const tie = C.tie && C.tie.chapter === space.key && C.tie.year === y ? C.tie.office : null;
            const taken = new Set([chair, vice, chair26, vice26]);
            const races = [chair, vice].map((winner, i) => {
                if (tie !== i && draw(`${key}:${i}:alone`) < C.uncontested[i]) return { winner, losers: [] };
                const field = keen.filter((p) => !taken.has(p)).slice(0, 8).sort((a, b) => draw(`${key}:${i}:field:${a}`) - draw(`${key}:${i}:field:${b}`));
                const losers = field.slice(0, tie === i || draw(`${key}:${i}:three`) < 0.7 ? 1 : 2);
                for (const p of losers) taken.add(p);
                return { winner, losers };
            });
            const candidates = new Set(races.flatMap((r) => [r.winner, ...r.losers]));

            // Who votes: candidates do; the rest as their engagement goes, more of them in a small chapter.
            const base = roll.length < C.smallChapter ? C.smallTurnout : C.turnout;
            const voters = roll.map((r) => r.person).filter((p) => candidates.has(p)
                || draw(`${key}:votes:${p}`) < base * (0.55 + 0.15 * Math.min(engagement.get(p) ?? 0, 6)));
            if (voters.length < C.minVoters) throw new Error(`${key}: only ${voters.length} of ${roll.length} vote`);

            // Each race: a few abstain; candidates vote for themselves; the winner leads (or ties, by lot).
            const choices = new Map(voters.map((p) => [p, []]));
            races.forEach((r, i) => {
                const field = [r.winner, ...r.losers];
                const running = new Set(field);
                const share = r.losers.length ? C.abstain.contested : C.abstain.uncontested;
                const abstaining = new Set(voters.filter((p) => !running.has(p) && draw(`${key}:${i}:abstain:${p}`) < share));
                let casting = voters.filter((p) => !abstaining.has(p));
                if (tie === i && casting.length % 2) {
                    const extra = casting.filter((p) => !running.has(p)).sort((a, b) => draw(`${key}:${i}:extra:${a}`) - draw(`${key}:${i}:extra:${b}`))[0];
                    abstaining.add(extra);
                    casting = casting.filter((p) => p !== extra);
                }
                const n = casting.length;
                // Votes per candidate: the winner takes 52–72% of a two-way race, 42–56% of a three-way one.
                let counts;
                if (!r.losers.length) counts = [n];
                else if (tie === i) counts = [n / 2, n / 2];
                else if (r.losers.length === 1) {
                    const win = Math.max(Math.floor(n / 2) + 1, Math.round(n * (0.52 + 0.2 * draw(`${key}:${i}:margin`))));
                    counts = [win, n - win];
                } else {
                    const win = Math.round(n * (0.42 + 0.14 * draw(`${key}:${i}:margin`)));
                    const second = Math.min(win - 1, Math.round((n - win) * 0.62));
                    counts = [win, second, n - win - second];
                }
                if (counts.slice(1).some((c) => c >= counts[0]) && tie !== i) throw new Error(`${key}: ${C.offices[i]} has no clear winner`);
                // Candidates first, each into their own column; then everyone else in a deterministic order.
                const left = [...counts];
                const vote = new Map();
                for (const [k, p] of field.entries()) if (!abstaining.has(p)) { vote.set(p, k); left[k]--; }
                const rest = casting.filter((p) => !vote.has(p)).sort((a, b) => draw(`${key}:${i}:pref:${a}`) - draw(`${key}:${i}:pref:${b}`));
                let k = 0;
                for (const p of rest) {
                    while (left[k] <= 0) k++;
                    vote.set(p, k);
                    left[k]--;
                }
                for (const p of voters) choices.get(p).push(abstaining.has(p) ? { abstain: true } : { option: { person: field[vote.get(p)] } });
            });

            const certifyOn = addDays(opens, 18);
            const certifier = [holding(mo(w), 'Chair', certifyOn), ...w.committees.map((c) => holding(c.id, 'Chair', certifyOn))]
                .filter(Boolean).map((m) => m.PersonID).find((p) => !candidates.has(p));
            if (!certifier) throw new Error(`${key}: no committee chair is free to certify`);
            const span = Date.parse(closesAt) - Date.parse(opensAt);
            out.push({
                key,
                family: 'chapter-election',
                type: 'organization-election',
                name: `${space.name} Officer Election ${y}`,
                description: `The ${space.name}'s chair and vice chair for ${y}–${y + 2}, elected by the chapter's members. The candidate with the most votes wins each office.`,
                secrecy: 'Secret',
                resultsTiming: 'AfterClose',
                resultsAudience: 'Eligible',
                createdAt: `${addDays(nomOpens.slice(0, 10), -5)}T15:00:00Z`,
                recordDate: `${recordDate}T12:00:00Z`,
                opensAt,
                closesAt,
                talliedAt: `${addDays(opens, 15)}T15:00:00Z`,
                certifiedAt: `${certifyOn}T16:00:00Z`,
                certifier,
                anchors: [{ entity: SPACES_ENTITY, recordId: space.id, role: 'Host', isPrimary: true }],
                contests: C.offices.map((name) => ({ name, kind: 'Office', tally: 'plurality', seats: 1, allowAbstain: true })),
                nominations: {
                    opensAt: nomOpens,
                    closesAt: nomCloses,
                    entries: races.flatMap((r, i) => [r.winner, ...r.losers].map((p) => ({
                        person: p,
                        contest: i,
                        submittedAt: after(nomOpens, draw(`${key}:nom:${p}`) * (Date.parse(nomCloses) - Date.parse(nomOpens) - DAY)),
                        statement: null,
                        withdrawn: false,
                    }))).sort((a, b) => (a.submittedAt < b.submittedAt ? -1 : 1)),
                },
                roll,
                ballots: voters.map((p) => ({ person: p, channel: 'Online', at: after(opensAt, draw(`${key}:at:${p}`) ** 1.5 * span), contests: choices.get(p) }))
                    .sort((a, b) => (a.at < b.at ? -1 : a.at > b.at ? 1 : a.person < b.person ? -1 : 1)),
                expect: races.map((r) => ({ elected: [r.winner] })),
                ...(tie != null ? { lot: { contest: tie, winner: races[tie].winner, tied: [races[tie].winner, ...races[tie].losers] } } : {}),
            });
            streak.set(chair, (prev?.chair === chair ? streak.get(chair) ?? 0 : 0) + 1);
            for (const p of [...streak.keys()]) if (p !== chair) streak.delete(p);
            prev = { chair, vice };
        }
    });
    if (C.tie && w.spaces.some((x) => x.key === C.tie.chapter) && !out.some((e) => e.lot)) throw new Error(`no ${C.tie.chapter} election in ${C.tie.year} to tie`);
    return out;
}

// Polls: one Yes/No question in a chapter or work-group space.
function polls(w, ix, P) {
    if (!P) return [];
    const typeOn = membershipTypeOn(w);
    return P.polls.map((q) => {
        const space = w.spaces.find((s) => s.key === q.space);
        if (!space) throw new Error(`${q.key}: no space ${q.space}`);
        if (q.opens < space.startedAt || (space.closedAt && q.closes > space.closedAt)) throw new Error(`${q.key}: runs outside ${q.space}'s life`);
        const chapter = CHAPTERS.find((c) => `chapter-${c.key}` === q.space);
        const opensAt = `${q.opens}T14:00:00Z`;
        const closesAt = `${q.closes}T23:00:00Z`;
        const engagement = ix.engagementAt(q.opens);
        let people;
        if (chapter) {
            const region = new Set(w.profiles.filter((p) => (chapter.states ? chapter.states.includes(p.State) : chapter.countries.includes(p.Country))).map((p) => p.PersonID));
            people = [...ix.currentAt(q.opens)].filter((p) => region.has(p) && ix.eligible(p));
        } else {
            people = space.seats.filter((x) => x.status === 'Active' && x.role !== 'guest').map((x) => x.person).filter((p) => ix.eligible(p));
        }
        const roll = [...new Set(people)].sort().map((p) => ({ person: p, class: typeOn(p, q.opens) ?? 'Individual' }));
        const voters = roll.map((r) => r.person).filter((p) => draw(`${q.key}:votes:${p}`)
            < (chapter ? (roll.length < CHAPTER.smallChapter ? POLL_TURNOUT.smallChapter : POLL_TURNOUT.chapter) * (0.55 + 0.15 * Math.min(engagement.get(p) ?? 0, 6)) : POLL_TURNOUT.group));
        // Live results show once five have answered.
        if (voters.length < 5) throw new Error(`${q.key}: only ${voters.length} of ${roll.length} answer`);
        const ranked = [...voters].sort((a, b) => draw(`${q.key}:stance:${a}`) - draw(`${q.key}:stance:${b}`) || (a < b ? -1 : 1));
        const yes = new Set(ranked.slice(0, Math.round(q.yes * voters.length)));
        const passed = yes.size * 2 > voters.length;
        if (passed === Boolean(q.fail)) throw new Error(`${q.key}: ${passed ? 'passes' : 'fails'}, the catalog says it ${q.fail ? 'fails' : 'passes'}`);
        const span = Date.parse(closesAt) - Date.parse(opensAt);
        return {
            key: q.key,
            family: 'poll',
            type: 'poll',
            name: q.name,
            description: q.text,
            secrecy: 'Secret',
            resultsTiming: 'Live',
            resultsAudience: 'Eligible',
            createdAt: after(opensAt, -2 * 3600000),
            recordDate: after(opensAt, -3600000),
            opensAt,
            closesAt,
            talliedAt: after(closesAt, 5 * 60000),
            certifier: null,
            anchors: [{ entity: SPACES_ENTITY, recordId: space.id, role: 'Host', isPrimary: true }],
            contests: [{ name: q.question, description: q.text, kind: 'Question', tally: 'majority', threshold: 'Majority', basis: 'VotesCast', allowAbstain: false, options: [{ label: 'Yes' }, { label: 'No' }] }],
            roll,
            // Most answer in the first day or two.
            ballots: voters.map((p) => ({ person: p, channel: 'Online', at: after(opensAt, draw(`${q.key}:at:${p}`) ** 2.2 * span), contests: [{ option: yes.has(p) ? 'Yes' : 'No' }] }))
                .sort((a, b) => (a.at < b.at ? -1 : a.at > b.at ? 1 : a.person < b.person ? -1 : 1)),
            expect: [{ result: passed ? 'Passed' : 'Failed', yes: yes.size, no: voters.length - yes.size }],
        };
    });
}

// E-votes: a committee motion voted online between meetings.
function committeeEvotes(w, holding, V) {
    if (!V) return [];
    const spaceOf = new Map(w.spaces.flatMap((s) => s.anchors.filter((a) => a.entity === COMMITTEES_ENTITY).map((a) => [up(a.recordId), s.id])));
    return V.votes.map((v) => {
        const committee = w.committees.find((c) => c.Name === v.committee);
        if (!committee) throw new Error(`${v.key}: no ${v.committee}`);
        const opensAt = `${v.opens}T14:00:00Z`;
        const closesAt = `${v.closes}T23:00:00Z`;
        const members = [...new Set(w.memberships.filter((m) => m.committeeID === committee.id && day(m.StartDate) <= v.opens
            && (!m.EndDate || day(m.EndDate) >= v.opens)).map((m) => m.PersonID))].sort();
        const voters = members.filter((p) => draw(`${v.key}:votes:${p}`) < v.turnout);
        const ranked = [...voters].sort((a, b) => draw(`${v.key}:stance:${a}`) - draw(`${v.key}:stance:${b}`) || (a < b ? -1 : 1));
        const yes = new Set(ranked.slice(0, Math.round(v.yes * voters.length)));
        const passed = yes.size * 2 > voters.length;
        if (passed === Boolean(v.fail)) throw new Error(`${v.key}: ${passed ? 'passes' : 'fails'}, the catalog says it ${v.fail ? 'fails' : 'passes'}`);
        const certifier = [holding(committee.id, 'Chair', v.certified), holding(committee.id, 'Vice Chair', v.certified)].find(Boolean)?.PersonID;
        if (!certifier) throw new Error(`${v.key}: ${v.committee} has no chair or vice chair on ${v.certified}`);
        const span = Date.parse(closesAt) - Date.parse(opensAt);
        const space = spaceOf.get(committee.id);
        return {
            key: v.key,
            family: 'committee-evote',
            type: 'motion',
            name: v.name,
            description: v.text,
            secrecy: 'Open',
            resultsTiming: 'AfterClose',
            resultsAudience: 'Eligible',
            createdAt: after(opensAt, -3600000),
            recordDate: after(opensAt, -1800000),
            opensAt,
            closesAt,
            talliedAt: after(closesAt, 3600000),
            certifiedAt: `${v.certified}T16:00:00Z`,
            certifier,
            anchors: [
                { entity: COMMITTEES_ENTITY, recordId: committee.id, role: 'Host', isPrimary: true },
                ...(space ? [{ entity: SPACES_ENTITY, recordId: space, role: 'Host', isPrimary: false }] : []),
            ],
            contests: [{ name: v.name.replace(/ \(.*\)$/, ''), description: v.text, kind: 'Motion', tally: 'majority', threshold: 'Majority', basis: 'VotesCast', allowAbstain: true }],
            roll: members.map((p) => ({ person: p })),
            ballots: voters.map((p) => ({ person: p, channel: 'Online', at: after(opensAt, draw(`${v.key}:at:${p}`) ** 1.6 * span), contests: [{ option: yes.has(p) ? 'Yes' : 'No' }] }))
                .sort((a, b) => (a.at < b.at ? -1 : a.at > b.at ? 1 : a.person < b.person ? -1 : 1)),
            expect: [{ result: passed ? 'Passed' : 'Failed', yes: yes.size, no: voters.length - yes.size, abstain: 0 }],
        };
    });
}

/**
 * Each election as the data's as-of date finds it. Done by then: as planned. Open: `stage: 'open'`, the ballots cast so
 * far, no result or certification, and a place on the roll for the presenter. Taking nominations: `stage:
 * 'nominations'`, the nominations in so far, no ballots. Not started: left out.
 */
function asOfCut(elections, asOf) {
    const end = `${asOf}T23:59:59Z`;
    const out = [];
    for (const e of elections) {
        if (e.closesAt <= end && (e.certifiedAt ?? e.talliedAt ?? e.closesAt) <= end) { out.push(e); continue; }
        const started = e.nominations ? e.nominations.opensAt : e.opensAt;
        if (started > end) continue;
        if (e.closesAt <= end) throw new Error(`${e.key}: closes by ${asOf} but is certified after it; the plan cannot stop mid-count`);
        const { expect, talliedAt, certifiedAt, lot, ...rest } = e;
        const stage = e.opensAt <= end ? 'open' : 'nominations';
        out.push({
            ...rest,
            stage,
            stageAt: end,
            // The presenter votes as an ordinary member (or committee member) of whatever is open.
            presenter: { class: e.roll[0]?.class ? 'Individual' : null },
            ...(e.nominations ? { nominations: { ...e.nominations, entries: e.nominations.entries.filter((n) => n.submittedAt <= end) } } : {}),
            ballots: stage === 'open' ? e.ballots.filter((b) => b.at <= end) : [],
        });
    }
    return out;
}

/** A person's membership type on a date: their latest membership purchase's. */
const membershipTypeOn = (w) => (pid, date) => {
    let t = null;
    for (const m of w.membershipTypes) if (m.person === pid && m.date <= date) t = m.type;
    return t;
};
const fullName = (ix, pid) => {
    const p = ix.person.get(pid);
    return p ? `${p.FirstName} ${p.LastName}` : pid;
};
const mo = (w) => w.committees.find((c) => /^Membership/.test(c.Name))?.id;

/** Who sits on the board each year, from the elections: for the world model and the content rules. */
function boardRoster(elections, BOARD) {
    const seats = [];
    for (const e of elections.filter((x) => x.family === 'board-election' && x.expect)) {
        const year = Number(e.key.slice(-4));
        for (const p of e.expect[0].elected) seats.push({ person: p, from: year + 1, to: year + BOARD.termYears, elected: year });
    }
    return seats.sort((a, b) => a.from - b.from || (a.person < b.person ? -1 : 1));
}

export const renderPlan = (plan) => JSON.stringify(plan, null, 2) + '\n';

// What an election open on the as-of date leaves out until it finishes (asOfCut).
/**
 * The last plan with the words of its still-unwritten standards comments taken from the new one. A plan is written
 * before scripts/build-election-comments-gemini.mjs words its new comments, and scripts/load-elections.mjs refuses a
 * comment without words, so words arriving later change nothing the database holds.
 */
function withWording(prev, next) {
    const words = new Map();
    for (const e of next.elections) for (const b of e.ballots ?? []) for (const c of b.contests) if (c.comment) words.set(c.comment.key, c.comment);
    const fill = (c) => {
        const w = words.get(c.key);
        if (c.comment !== null || !w) return c;
        return { ...c, reference: w.reference, comment: w.comment, proposedChange: w.proposedChange, resolution: { ...c.resolution, response: w.resolution.response } };
    };
    return {
        ...prev,
        elections: prev.elections.map((e) => ({ ...e, ballots: (e.ballots ?? []).map((b) => ({ ...b, contests: b.contests.map((c) => (c.comment ? { ...c, comment: fill(c.comment) } : c)) })) })),
    };
}

const UNFINISHED = new Set(['ballots', 'stage', 'stageAt', 'presenter', 'expect', 'talliedAt', 'certifiedAt', 'lot', 'nominations']);
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);

/**
 * What a new plan would change in the history the last one planned, as a list of problems (empty when it only adds).
 * The demo database holds the last plan's elections, so a later month may finish an open election, add ballots and
 * nominations after its as-of date, and add new elections; it may not touch a finished election, drop one, or change
 * an open one's roll, contests, dates or the ballots and nominations it already had. A change here means the data
 * rewrote the past (a planner bug, or a hand edit to generated/ or a catalog) and the database would no longer match.
 */
export function historyChanges(prev, next) {
    prev = withWording(prev, next);
    const byKey = new Map(next.elections.map((e) => [e.key, e]));
    const problems = [];
    for (const e of prev.elections) {
        const f = byKey.get(e.key);
        if (!f) { problems.push(`${e.key}: the new plan drops it`); continue; }
        if (!e.stage) {
            if (!same(e, f)) problems.push(`${e.key}: finished, but the new plan changes ${Object.keys({ ...e, ...f }).filter((k) => !same(e[k], f[k])).join(', ')}`);
            continue;
        }
        const changed = Object.keys({ ...e, ...f }).filter((k) => !UNFINISHED.has(k) && !same(e[k], f[k]));
        if (changed.length) problems.push(`${e.key}: ${e.stage} on ${e.stageAt.slice(0, 10)}, but the new plan changes ${changed.join(', ')}`);
        const upTo = (rows, at) => (rows ?? []).filter((r) => (r.at ?? r.submittedAt) <= at);
        if (!same(e.ballots, upTo(f.ballots, e.stageAt))) problems.push(`${e.key}: the new plan changes the ballots cast by ${e.stageAt.slice(0, 10)}`);
        if (!same(e.nominations?.entries ?? [], upTo(f.nominations?.entries, e.stageAt))) problems.push(`${e.key}: the new plan changes the nominations made by ${e.stageAt.slice(0, 10)}`);
    }
    return problems;
}

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
    const prev = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : null;
    if (prev && !argv.includes('--rewrite-history')) {
        const problems = historyChanges(prev, plan);
        if (problems.length) {
            console.error(`the new plan would change elections the last one planned (the demo database holds them), so ${PLAN_FILE} is left as it was:`);
            for (const p of problems) console.error(`  ${p}`);
            console.error('A deliberate change: rerun with --rewrite-history, then delete those elections from the database and reload them.');
            process.exit(1);
        }
    }
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, body);
    const byFamily = plan.elections.reduce((m, e) => ((m[e.family] = (m[e.family] ?? 0) + 1), m), {});
    const ballots = plan.elections.reduce((n, e) => n + e.ballots.length, 0);
    console.log(`${plan.elections.length} elections (${Object.entries(byFamily).map(([k, v]) => `${v} ${k}`).join(', ')}), ${ballots} ballots`);
    if (prev) {
        // What this plan adds to the last one, for the monthly run's pull request.
        const before = new Map(prev.elections.map((e) => [e.key, e]));
        const said = (e) => `${e.key} (${e.stage ?? (e.expect?.[0]?.result ?? (e.expect?.[0]?.elected ? 'elected' : 'done'))})`;
        const finished = plan.elections.filter((e) => before.get(e.key)?.stage && !e.stage).map(said);
        const added = plan.elections.filter((e) => !before.has(e.key)).map(said);
        const open = plan.elections.filter((e) => e.stage).map((e) => `${e.key} (${e.ballots.length} of ${e.roll.length} so far)`);
        console.log(`since the last plan: finished ${finished.join(', ') || 'none'}; new ${added.join(', ') || 'none'}; open on ${plan.asOf}: ${open.join(', ') || 'none'}`);
    }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main(process.argv.slice(2));
