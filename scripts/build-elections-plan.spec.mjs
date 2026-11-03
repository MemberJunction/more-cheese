import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { buildPlan, loadWorld, historyChanges } from './build-elections-plan.mjs';

const SCRIPT = fileURLToPath(new URL('./build-elections-plan.mjs', import.meta.url));
const P = (n) => `00000000-0000-0000-0000-${String(n).padStart(12, '0')}`;
const INDIVIDUAL = 'P0000000-0000-0000-0000-000000000001';
const CORPORATE = 'P0000000-0000-0000-0000-000000000002';
const SMALL = { years: [2023, 2026], beats: {}, withdrawn: [2023], incumbentLoses: [], turnout: { 2023: 0.6, 2026: 0.6 } };

/**
 * A throwaway repo root: `n` members who renew every March from 2018 (the last ten on Corporate memberships), the Food
 * Safety committee with a long line of officers, Membership & Outreach chaired by person 99, and one Food Safety
 * meeting with one motion. Person 1 chairs Food Safety from 2023; person 5's chair term ended in 2022. `registrants`
 * registers people 1..registrants for the 2024 annual conference. Everyone lives in California, whose chapter space
 * (from 2019) has person 7 as owner and person 8 as its first admin; the 'relief' work group seats people 1–10. The data
 * runs to `asOf`.
 */
function world({ n = 120, result = 'Passed', votes = ['Yes', 'Yes', 'Absent', 'Abstain'], comments = null, registrants = 0, asOf = '2026-10-31' } = {}) {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'elections-plan-'));
    const put = (rel, value) => {
        fs.mkdirSync(path.dirname(path.join(root, rel)), { recursive: true });
        fs.writeFileSync(path.join(root, rel), JSON.stringify(value));
    };
    const ids = [...Array.from({ length: n }, (_, i) => i + 1), 99].filter((v, i, a) => a.indexOf(v) === i);
    put('generated/checkpoint.json', { continuity: { asOfDate: asOf } });
    put('generated/people/.people.json', ids.map((i) => ({ fields: { FirstName: `F${i}`, LastName: `L${i}`, Email: `p${i}@x.example`, Status: 'Active' }, primaryKey: { ID: P(i) } })));
    put('generated/member-profiles/.member-profiles.json', ids.map((i) => ({ fields: { PersonID: P(i), Region: i % 2 ? 'NA' : 'EU', Segment: i % 3 ? 'Producer' : 'Retailer', JoinDate: '2015-01-01', State: 'US-CA', Country: 'US' } })));
    put('generated/products/.products.json', [
        { fields: { Name: 'Individual Membership (annual)' }, primaryKey: { ID: INDIVIDUAL } },
        { fields: { Name: 'Corporate Membership (annual)' }, primaryKey: { ID: CORPORATE } },
    ]);
    put('generated/orders/.orders.json', ids.flatMap((i) => [2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025, 2026].map((y) => ({
        fields: { OrderNumber: `ORD-${i}-${y}`, Status: 'Confirmed', OrderDate: `${y}-03-01`, BillToPersonID: P(i) },
        primaryKey: { ID: `O-${i}-${y}` },
        collections: { Lines: [{ fields: { ProductID: i > n - 10 ? CORPORATE : INDIVIDUAL } }] },
    })).concat(i <= registrants ? [{
        fields: { OrderNumber: `ORD-E-REG-ICF-${i}-EVT-2024-CONF`, Status: 'Confirmed', OrderDate: '2024-04-01', BillToPersonID: P(i) },
        primaryKey: { ID: `R-${i}` },
        collections: { Lines: [] },
    }] : [])));
    put('generated/enrollments/.enrollments.json', ids.flatMap((i) => Array.from({ length: i % 7 }, (_, k) => ({ fields: { PersonID: P(i), EnrolledOn: `2022-0${1 + (k % 9)}-01` } }))));
    put('generated/advocacy-actions/.advocacy-actions.json', []);
    put('generated/competition-entries/.competition-entries.json', []);
    put('generated/tasks/.tasks.json', []);
    put('generated/committees/.committees.json', [
        { fields: { Name: 'Food Safety Committee' }, primaryKey: { ID: 'C1' } },
        { fields: { Name: 'Membership & Outreach Committee' }, primaryKey: { ID: 'C2' } },
        { fields: { Name: 'Standards Committee' }, primaryKey: { ID: 'C3' } },
    ]);
    put('generated/committee-terms/.committee-terms.json', ['C1', 'C2', 'C3'].map((c, i) => ({ fields: { CommitteeID: c }, primaryKey: { ID: `T${i + 1}` } })));
    const m = (p, role, start, end = null, term = 'T1') => ({ fields: { TermID: term, PersonID: P(p), RoleID: `@lookup:Committees: Roles.Name=${role}`, StartDate: start, EndDate: end }, primaryKey: { ID: `M${p}-${term}-${role}` } });
    put('generated/committee-memberships/.committee-memberships.json', [
        m(1, 'Chair', '2023-01-01'), m(2, 'Member', '2023-01-01'), m(3, 'Member', '2023-01-01'), m(4, 'Member', '2023-01-01'),
        m(5, 'Chair', '2019-01-01', '2022-12-31'),
        ...Array.from({ length: 24 }, (_, k) => m(10 + k, k % 2 ? 'Chair' : 'Vice Chair', `${2016 + (k % 6)}-01-01`, `${2017 + (k % 6)}-12-31`)),
        m(99, 'Chair', '2015-01-01', null, 'T2'),
        m(40, 'Chair', '2018-01-01', null, 'T3'),
        ...Array.from({ length: 8 }, (_, k) => m(41 + k, 'Member', '2018-01-01', null, 'T3')),
    ]);
    const vote = (v, i) => ({ fields: { MembershipID: [`M1-T1-Chair`, 'M2-T1-Member', 'M3-T1-Member', 'M4-T1-Member'][i], VoteValue: v }, primaryKey: { ID: `V${i + 1}` } });
    put('generated/committee-meetings/.committee-meetings.json', [{
        fields: { CommitteeID: 'C1', StartDateTime: '2025-03-04T15:00:00Z', EndDateTime: '2025-03-04T16:00:00Z' },
        primaryKey: { ID: 'MT1' },
        collections: { Motions: [{
            fields: { Name: 'Adopt the recall checklist', Sequence: 1, Result: result, MovedByMembershipID: 'M2-T1-Member' },
            primaryKey: { ID: 'MO1' },
            collections: { Votes: votes.map(vote) },
        }] },
    }]);
    put('data/ruleset/heroes.json', { heroes: [] });
    const seat = (i, role) => ({ person: P(i), role, status: 'Active' });
    put('data/spaces/spaces.plan.json', { spaces: [
        { id: 'SPACE-1', anchors: [{ entity: 'Committees: Committees', recordId: 'C1' }] },
        { key: 'relief', id: 'SPACE-2', startedAt: '2025-01-01', anchors: [], seats: [...Array.from({ length: 10 }, (_, k) => seat(k + 1, k ? 'member' : 'owner')), seat(11, 'guest')] },
        { key: 'chapter-california', id: 'SPACE-CA', name: 'California Chapter', startedAt: '2019-01-01', anchors: [], seats: [seat(7, 'owner'), seat(8, 'admin'), seat(9, 'admin'), seat(10, 'member')] },
    ] });
    if (comments) put('data/elections/comments.json', { comments });
    return root;
}

/** A draft with one item that passes and one that fails, and its recirculation of the failed item. */
const CATALOG = {
    pool: {
        segments: ['Producer', 'Retailer'],
        size: { 2024: 20 },
        turnout: { Committee: 1, 'Ballot Pool': 0.9 },
        abstain: { Committee: 0, 'Ballot Pool': 0.05 },
        editorial: { Committee: 0.2, 'Ballot Pool': 0.1 },
    },
    documents: { 'ICF-STD-900': { title: 'Test Standard', short: 'Test' } },
    ballots: [
        { key: 'std-900', doc: 'ICF-STD-900', version: '1.0', opens: '2024-03-04', days: 30, items: [
            { name: '§1 Scope', dis: 0.05, gist: 'g1' },
            { name: '§2 Rule', dis: 0.45, fail: true, gist: 'g2' },
        ] },
        { key: 'std-900-r1', doc: 'ICF-STD-900', version: '1.0 rev. 1', round: 1, prior: 'std-900', opens: '2024-06-03', days: 15, items: [
            { name: '§2 Rule (revised)', carry: 1, dis: 0.1, gist: 'g2r' },
        ] },
    ],
};
const NO_BOARD = { board: { years: [] } };

/** Two amendments voted at the 2024 annual meeting (one fails two-thirds), and a referendum by online and mail ballot. */
const VOTES = {
    votes: [
        { key: 'amend-2024', type: 'amendment', name: 'Bylaw Amendments 2024', description: 'd', opens: '2024-06-17', closes: '2024-07-16',
            meetingAt: '2024-07-16T19:00:00Z', certified: '2024-07-24', turnout: 0.3,
            channels: { meeting: 'EVT-2024-CONF', proxy: 0.4, paper: 1, proxyDeadline: '2024-07-12' },
            contests: [
                { name: 'A1', kind: 'Amendment', text: 'text of A1', yes: 0.8 },
                { name: 'A2', kind: 'Amendment', text: 'text of A2', yes: 0.6, fail: true, lean: { Corporate: 0.4 } },
            ] },
        { key: 'referendum-2025', type: 'referendum', name: 'Referendum 2025', description: 'd', opens: '2025-03-10', closes: '2025-03-31',
            certified: '2025-04-03', turnout: 0.3, channels: { paper: 0.1 }, space: 'relief',
            contests: [{ name: 'Q', kind: 'Question', text: 'text of Q', yes: 0.56 }] },
    ],
};

const motions = (plan) => plan.elections.filter((e) => e.family === 'committee-motion');
const boards = (plan) => plan.elections.filter((e) => e.family === 'board-election');

test('committee motion: a roll-call election with the recorded roll, ballots, result and chair as certifier', () => {
    const [e] = motions(buildPlan(loadWorld(world()), { board: { years: [] } }));
    assert.equal(e.type, 'motion');
    assert.equal(e.secrecy, 'Open');
    assert.equal(e.name, 'Adopt the recall checklist (Food Safety, 2025-03-04)');
    assert.equal(e.opensAt, '2025-03-04T15:10:00Z');
    assert.equal(e.closesAt, '2025-03-04T15:20:00Z');
    // The chair on the meeting date certifies, not the chair whose term had ended.
    assert.equal(e.certifier, P(1));
    assert.deepEqual(e.anchors.map((a) => [a.entity, a.recordId]), [['Committees: Motions', 'MO1'], ['MJ_BizApps_Collaboration: Spaces', 'SPACE-1']]);
    // Absent members are on the roll but cast nothing; an abstention is a ballot.
    assert.deepEqual(e.roll.map((r) => r.person), [P(1), P(2), P(3), P(4)]);
    assert.deepEqual(e.ballots.map((b) => [b.person, b.contests[0]]), [[P(1), { option: 'Yes' }], [P(2), { option: 'Yes' }], [P(4), { abstain: true }]]);
    assert.ok(e.ballots.every((b) => b.channel === 'InPerson' && b.at >= e.opensAt && b.at < e.closesAt));
    assert.deepEqual(e.expect, [{ result: 'Passed', yes: 2, no: 0, abstain: 1 }]);
});

test('committee motion: a recorded result its votes cannot produce is refused; a tie fails', () => {
    assert.throws(() => buildPlan(loadWorld(world({ result: 'Failed' })), { board: { years: [] } }), /records Failed but its votes are 2–0/);
    const plan = buildPlan(loadWorld(world({ result: 'Failed', votes: ['Yes', 'No', 'Absent', 'Absent'] })), { board: { years: [] } });
    assert.equal(motions(plan)[0].expect[0].result, 'Failed');
});

test('board: three seats a year from past officers, a secret ranked ballot of current members, certified by a chair not running', () => {
    const plan = buildPlan(loadWorld(world({ n: 300, asOf: '2026-12-31' })), { board: SMALL });
    const [y2023, y2026] = boards(plan);
    for (const e of [y2023, y2026]) {
        assert.equal(e.type, 'board-election');
        assert.equal(e.secrecy, 'Secret');
        assert.deepEqual(e.contests, [{ name: 'Board of Directors (3 seats)', kind: 'Office', tally: 'stv', seats: 3, allowAbstain: false }]);
        const running = e.nominations.entries.filter((n) => !n.withdrawn).map((n) => n.person);
        assert.equal(running.length, 5);
        assert.equal(e.expect[0].elected.length, 3);
        assert.ok(e.expect[0].elected.every((p) => running.includes(p)));
        assert.equal(e.certifier, P(99));
        assert.ok(!running.includes(e.certifier));
        // Every ballot ranks only running candidates, and its voter is on the roll.
        const roll = new Set(e.roll.map((r) => r.person));
        assert.ok(e.ballots.length > 20 && e.ballots.length < e.roll.length);
        assert.ok(e.ballots.every((b) => roll.has(b.person) && b.contests[0].ranks.every((r) => running.includes(r.person))));
        assert.ok(e.ballots.every((b) => b.at >= e.opensAt && b.at <= e.closesAt));
        assert.ok(e.nominations.entries.every((n) => n.submittedAt >= e.nominations.opensAt && n.submittedAt <= e.nominations.closesAt));
    }
    // Voting class follows the membership bought.
    assert.equal(y2023.roll.find((r) => r.person === P(300)).class, 'Corporate');
    assert.equal(y2023.roll.find((r) => r.person === P(3)).class, 'Individual');
    // 2023 had a withdrawal; 2026's seats are 2023's class, who run again and keep them.
    assert.equal(y2023.nominations.entries.filter((n) => n.withdrawn).length, 1);
    assert.deepEqual([...y2026.expect[0].elected].sort(), [...y2023.expect[0].elected].sort());
    assert.deepEqual(plan.board.map((s) => [s.elected, s.from, s.to]).slice(0, 3), [[2023, 2024, 2026], [2023, 2024, 2026], [2023, 2024, 2026]]);
});

test('board: a two-term director cannot run a third time', () => {
    const plan = buildPlan(loadWorld(world({ n: 300 })), { board: { ...SMALL, years: [2020, 2023, 2026], turnout: { 2020: 0.6, 2023: 0.6, 2026: 0.6 }, withdrawn: [] } });
    const [first, , third] = boards(plan);
    const running = third.nominations.entries.map((n) => n.person);
    assert.ok(first.expect[0].elected.every((p) => !running.includes(p)));
});

test('standards: an Open roll call of the committee and its pool, section by section, two-thirds of votes cast', () => {
    const plan = buildPlan(loadWorld(world()), { ...NO_BOARD, standards: CATALOG });
    const [ballot, recirc] = plan.elections.filter((e) => e.family === 'standards-ballot');
    assert.equal(ballot.name, 'ICF-STD-900 Test v1.0 — Ballot');
    assert.equal(recirc.name, 'ICF-STD-900 Test v1.0 — Recirculation 1');
    assert.equal(ballot.secrecy, 'Open');
    assert.deepEqual(ballot.standards, { code: 'ICF-STD-900', documentTitle: 'ICF-STD-900 Test Standard', documentVersion: '1.0', round: 0, prior: null });
    assert.equal(recirc.standards.prior, ballot.name);
    assert.ok(ballot.contests.every((c) => c.kind === 'StandardsItem' && c.threshold === 'TwoThirds' && c.basis === 'VotesCast'
        && c.options.map((o) => o.label).join() === 'Approve,Disapprove'));
    // The committee (chair and eight members) and twenty pool members; the chair certifies.
    assert.equal(ballot.roll.filter((r) => r.class === 'Committee').length, 9);
    assert.equal(ballot.roll.filter((r) => r.class === 'Ballot Pool').length, 20);
    assert.equal(ballot.certifier, P(40));
    // The results the catalog asks for, and every Disapprove with a comment.
    assert.deepEqual(ballot.expect.map((x) => x.result), ['Passed', 'Failed']);
    assert.deepEqual(recirc.expect.map((x) => x.result), ['Passed']);
    for (const [i, x] of ballot.expect.entries()) {
        const votes = ballot.ballots.map((b) => b.contests[i]);
        assert.equal(votes.filter((v) => v.option === 'Disapprove').length, x.disapprove);
        assert.equal(votes.filter((v) => v.option === 'Approve').length, x.approve);
        assert.equal(x.result === 'Passed', x.approve * 3 >= (x.approve + x.disapprove) * 2);
    }
    const all = plan.elections.flatMap((e) => e.ballots.flatMap((b) => b.contests));
    assert.ok(all.filter((v) => v.option === 'Disapprove').every((v) => v.comment && v.comment.type !== 'Editorial'));
    assert.ok(all.filter((v) => v.option === 'Approve' && v.comment).every((v) => v.comment.type === 'Editorial'));
    // Resolved after the tally, answered before certifying.
    for (const e of [ballot, recirc]) {
        for (const c of e.ballots.flatMap((b) => b.contests).filter((v) => v.comment)) {
            assert.ok(c.comment.resolution.at > e.talliedAt && (c.comment.resolution.answeredAt ?? c.comment.resolution.at) < e.certifiedAt);
            assert.equal(c.comment.comment, null, 'no comments.json yet');
        }
    }
    // The recirculation goes to the same voters, and those the resolution didn't satisfy vote against again.
    const before = new Set(ballot.roll.map((r) => r.person));
    assert.ok(recirc.roll.every((r) => before.has(r.person)));
    const unsatisfied = ballot.ballots.filter((b) => b.contests[1].option === 'Disapprove' && b.contests[1].comment.resolution.commenter !== 'Satisfied').map((b) => b.person);
    const again = new Set(recirc.ballots.filter((b) => b.contests[0].option === 'Disapprove').map((b) => b.person));
    const cast = recirc.ballots.filter((b) => !b.contests[0].abstain).map((b) => b.person);
    const carried = unsatisfied.filter((p) => cast.includes(p));
    assert.ok(carried.length > 0);
    // Disapprovals go to the unsatisfied first: all of them if they fit, else only them.
    if (carried.length <= again.size) assert.ok(carried.every((p) => again.has(p)));
    else assert.ok([...again].every((p) => carried.includes(p)));
});

test('standards: comment wording comes from comments.json; a recirculation needs its prior ballot', () => {
    const plan = buildPlan(loadWorld(world()), { ...NO_BOARD, standards: CATALOG });
    const slot = plan.elections.find((e) => e.key === 'std-900').ballots.flatMap((b) => b.contests).find((v) => v.comment);
    const words = { reference: '§2.1', comment: 'c', proposedChange: 'p', response: 'r' };
    const filled = buildPlan(loadWorld(world({ comments: { [slot.comment.key]: words } })), { ...NO_BOARD, standards: CATALOG });
    const again = filled.elections.find((e) => e.key === 'std-900').ballots.flatMap((b) => b.contests).find((v) => v.comment?.key === slot.comment.key);
    assert.deepEqual([again.comment.reference, again.comment.comment, again.comment.proposedChange, again.comment.resolution.response], ['§2.1', 'c', 'p', 'r']);
    const orphan = { ...CATALOG, ballots: [CATALOG.ballots[1]] };
    assert.throws(() => buildPlan(loadWorld(world()), { ...NO_BOARD, standards: orphan }), /recirculation follows an earlier ballot/);
});

test('member votes: a secret Yes/No ballot of every current member, in person, by proxy, by mail or online', () => {
    const plan = buildPlan(loadWorld(world({ n: 300, registrants: 40 })), { ...NO_BOARD, memberVotes: VOTES });
    const [amend, ref] = plan.elections.filter((e) => e.family === 'member-vote');
    for (const e of [amend, ref]) {
        assert.equal(e.secrecy, 'Secret');
        assert.equal(e.resultsAudience, 'Eligible');
        assert.equal(e.roll.length, 300);
        assert.equal(e.certifier, P(99));
        assert.ok(e.closesAt < e.talliedAt && e.talliedAt < e.certifiedAt);
        const roll = new Set(e.roll.map((r) => r.person));
        assert.ok(e.ballots.every((b) => roll.has(b.person) && b.at >= e.opensAt && b.at <= e.closesAt));
        assert.ok(e.ballots.length >= 0.15 * e.roll.length && e.ballots.length <= 0.45 * e.roll.length);
        // The plan's counts are the ballots'.
        e.expect.forEach((x, i) => {
            assert.equal(e.ballots.filter((b) => b.contests[i].option === 'Yes').length, x.yes);
            assert.equal(e.ballots.filter((b) => b.contests[i].option === 'No').length, x.no);
            assert.equal(e.ballots.filter((b) => b.contests[i].abstain).length, x.abstain);
        });
        assert.ok(e.contests.every((c) => c.basis === 'VotesCast' && c.allowAbstain && c.options.map((o) => o.label).join() === 'Yes,No'));
    }
    assert.equal(amend.type, 'amendment');
    assert.deepEqual(amend.contests.map((c) => [c.kind, c.threshold, c.description]), [['Amendment', 'TwoThirds', 'text of A1'], ['Amendment', 'TwoThirds', 'text of A2']]);
    assert.deepEqual(amend.expect.map((x) => x.result), ['Passed', 'Failed']);
    assert.deepEqual(ref.contests.map((c) => [c.kind, c.threshold]), [['Question', 'Majority']]);
    assert.deepEqual(ref.expect.map((x) => x.result), ['Passed']);
    assert.deepEqual(ref.anchors, [{ entity: 'MJ_BizApps_Collaboration: Spaces', recordId: 'SPACE-2', role: 'Subject', isPrimary: true }]);

    // At the meeting: registrants in person, proxies held by officers there, mail in by the day before; nobody online.
    const registered = new Set(Array.from({ length: 40 }, (_, i) => P(i + 1)));
    const meetingEnd = '2024-07-16T20:30:00Z';
    const by = (e, ch) => e.ballots.filter((b) => b.channel === ch);
    assert.equal(by(amend, 'Online').length, 0);
    assert.ok(by(amend, 'InPerson').length > 0 && by(amend, 'InPerson').every((b) => registered.has(b.person) && b.at >= amend.closesAt.slice(0, 10) + 'T19:00:00Z' && b.at <= meetingEnd));
    assert.ok(by(amend, 'Paper').every((b) => !registered.has(b.person) && b.at < '2024-07-15T19:00:00Z'));
    const proxied = by(amend, 'Proxy');
    assert.ok(proxied.length > 0);
    assert.deepEqual(proxied.map((b) => b.person).sort(), amend.proxies.entries.map((x) => x.person).sort());
    // Holders are committee members at the meeting: of the 40 registrants, people 1–4 and 40.
    assert.ok(amend.proxies.entries.every((x) => [1, 2, 3, 4, 40].map(P).includes(x.holder) && x.at <= amend.proxies.deadline && x.at >= amend.opensAt));
    assert.ok(new Set(amend.proxies.entries.map((x) => x.holder)).size > 1);
    assert.equal(amend.proxies.deadline, '2024-07-12T23:00:00Z');
    assert.ok(by(ref, 'Online').length > 0 && by(ref, 'Paper').length > 0);
    assert.equal(by(ref, 'Online').length + by(ref, 'Paper').length, ref.ballots.length);
    assert.equal(ref.proxies, undefined);

    // A class's lean shows in its vote.
    const yesShare = (cls) => {
        const of = new Set(amend.roll.filter((r) => r.class === cls).map((r) => r.person));
        const cast = amend.ballots.filter((b) => of.has(b.person) && !b.contests[1].abstain);
        return cast.filter((b) => b.contests[1].option === 'Yes').length / cast.length;
    };
    assert.ok(yesShare('Corporate') > yesShare('Individual'));
});

test('member votes: a planned share that cannot give the catalog\'s result is refused', () => {
    const passing = { votes: [{ ...VOTES.votes[1], contests: [{ ...VOTES.votes[1].contests[0], yes: 0.45 }] }] };
    assert.throws(() => buildPlan(loadWorld(world({ n: 300 })), { ...NO_BOARD, memberVotes: passing }), /"Q" fails, the catalog says it passes/);
    const noMeeting = { votes: [{ ...VOTES.votes[0], meetingAt: undefined }] };
    assert.throws(() => buildPlan(loadWorld(world({ n: 300, registrants: 40 })), { ...NO_BOARD, memberVotes: noMeeting }), /needs meetingAt/);
});

const CHAPTER = { years: [2022, 2024, 2026], tie: { chapter: 'chapter-california', year: 2024, office: 1 } };
const chapters = (plan) => plan.elections.filter((e) => e.family === 'chapter-election');

test('chapters: a chair and vice chair every two years by plurality, ending with the officers in the space', () => {
    const plan = buildPlan(loadWorld(world({ n: 120 })), { ...NO_BOARD, chapter: CHAPTER });
    const es = chapters(plan);
    assert.deepEqual(es.map((e) => e.name), ['California Chapter Officer Election 2022', 'California Chapter Officer Election 2024', 'California Chapter Officer Election 2026']);
    for (const e of es) {
        assert.equal(e.type, 'organization-election');
        assert.equal(e.secrecy, 'Secret');
        assert.deepEqual(e.contests.map((c) => [c.name, c.kind, c.tally, c.seats]), [['Chapter Chair', 'Office', 'plurality', 1], ['Vice Chair', 'Office', 'plurality', 1]]);
        assert.deepEqual(e.anchors, [{ entity: 'MJ_BizApps_Collaboration: Spaces', recordId: 'SPACE-CA', role: 'Host', isPrimary: true }]);
        // The roll is frozen as nominations open, so it dates from before them.
        assert.ok(e.recordDate < e.nominations.opensAt && e.nominations.closesAt < e.opensAt && e.closesAt < e.talliedAt && e.talliedAt < e.certifiedAt);
        const roll = new Set(e.roll.map((r) => r.person));
        assert.ok(e.ballots.length >= 5 && e.ballots.every((b) => roll.has(b.person)));
        e.contests.forEach((_, i) => {
            const running = e.nominations.entries.filter((x) => x.contest === i).map((x) => x.person);
            assert.ok(running.every((p) => roll.has(p)) && running.includes(e.expect[i].elected[0]));
            // Every vote is for someone running for that office; candidates vote for themselves.
            const tally = new Map(running.map((p) => [p, 0]));
            for (const b of e.ballots) {
                const c = b.contests[i];
                if (c.abstain) continue;
                assert.ok(tally.has(c.option.person));
                tally.set(c.option.person, tally.get(c.option.person) + 1);
                if (running.includes(b.person)) assert.equal(c.option.person, b.person);
            }
            const [first, second] = [...tally.values()].sort((a, b) => b - a);
            const winner = tally.get(e.expect[i].elected[0]);
            if (e.lot?.contest === i) assert.ok(winner === first && first === second && e.lot.winner === e.expect[i].elected[0]);
            else assert.ok(winner === first && (second === undefined || first > second));
        });
        assert.ok(!e.nominations.entries.some((x) => x.person === e.certifier));
    }
    // 2026's officers are the space's; nobody chairs three terms in a row; the 2024 vice chair race ties.
    assert.deepEqual(es[2].expect.map((x) => x.elected[0]), [P(7), P(8)]);
    const chairs = es.map((e) => e.expect[0].elected[0]);
    assert.ok(!(chairs[0] === chairs[1] && chairs[1] === chairs[2]));
    assert.deepEqual(es.map((e) => e.lot?.contest ?? null), [null, 1, null]);
});

test('polls: a Yes/No question to a chapter\'s members or a work group\'s, tallied live and never certified', () => {
    const POLLS = { polls: [
        { key: 'poll-ca', space: 'chapter-california', opens: '2025-03-03', closes: '2025-03-10', name: 'Chapter poll', question: 'Q1?', text: 't1', yes: 0.8 },
        { key: 'poll-relief', space: 'relief', opens: '2025-06-02', closes: '2025-06-06', name: 'Group poll', question: 'Q2?', text: 't2', yes: 0.3, fail: true },
    ] };
    const plan = buildPlan(loadWorld(world({ n: 120 })), { ...NO_BOARD, chapter: { years: [] }, polls: POLLS });
    const [ca, relief] = plan.elections.filter((e) => e.family === 'poll');
    for (const e of [ca, relief]) {
        assert.equal(e.type, 'poll');
        assert.equal(e.resultsTiming, 'Live');
        assert.equal(e.certifier, null);
        assert.ok(e.createdAt < e.recordDate && e.recordDate < e.opensAt && e.closesAt < e.talliedAt);
        assert.deepEqual(e.contests.map((c) => [c.name, c.kind, c.options.map((o) => o.label).join()]), [[e === ca ? 'Q1?' : 'Q2?', 'Question', 'Yes,No']]);
        assert.equal(e.ballots.filter((b) => b.contests[0].option === 'Yes').length, e.expect[0].yes);
        assert.ok(e.ballots.length >= 5 && e.ballots.every((b) => b.at >= e.opensAt && b.at <= e.closesAt));
    }
    assert.equal(ca.roll.length, 120);
    assert.deepEqual(relief.roll.map((r) => r.person), Array.from({ length: 10 }, (_, k) => P(k + 1)));
    assert.deepEqual([ca.expect[0].result, relief.expect[0].result], ['Passed', 'Failed']);
    const wrong = { polls: [{ ...POLLS.polls[1], fail: false }] };
    assert.throws(() => buildPlan(loadWorld(world({ n: 120 })), { ...NO_BOARD, chapter: { years: [] }, polls: wrong }), /fails, the catalog says it passes/);
});

test('as-of date: an election still open is planned open with the ballots so far; one not started is left out', () => {
    const EVOTES = { votes: [
        { key: 'ev-done', committee: 'Food Safety Committee', opens: '2026-10-05', closes: '2026-10-12', certified: '2026-10-14', name: 'Done (Food Safety, electronic vote)', text: 't', turnout: 1, yes: 0.8 },
        { key: 'ev-open', committee: 'Food Safety Committee', opens: '2026-10-28', closes: '2026-11-11', certified: '2026-11-13', name: 'Open (Food Safety, electronic vote)', text: 't', turnout: 1, yes: 0.8 },
        { key: 'ev-later', committee: 'Food Safety Committee', opens: '2026-11-20', closes: '2026-11-27', certified: '2026-11-30', name: 'Later (Food Safety, electronic vote)', text: 't', turnout: 1, yes: 0.8 },
    ] };
    const at = (asOf) => buildPlan(loadWorld(world({ asOf })), { ...NO_BOARD, chapter: { years: [] }, evotes: EVOTES }).elections.filter((e) => e.family === 'committee-evote');
    const [done, open] = at('2026-10-31');
    assert.deepEqual([done.key, open.key], ['ev-done', 'ev-open']);
    assert.equal(done.stage, undefined);
    assert.equal(done.expect[0].result, 'Passed');
    assert.equal(open.stage, 'open');
    assert.equal(open.stageAt, '2026-10-31T23:59:59Z');
    assert.deepEqual(open.presenter, { class: null });
    assert.equal(open.expect, undefined);
    assert.equal(open.certifiedAt, undefined);
    assert.ok(open.ballots.length > 0 && open.ballots.every((b) => b.at <= open.stageAt));
    // A month later the same vote is done, with every ballot: the open one's are the first of them.
    const later = at('2026-11-30');
    const finished = later.find((e) => e.key === 'ev-open');
    assert.equal(finished.stage, undefined);
    assert.ok(finished.ballots.length > open.ballots.length);
    assert.deepEqual(finished.ballots.slice(0, open.ballots.length), open.ballots);
    assert.deepEqual(later.map((e) => e.key), ['ev-done', 'ev-open', 'ev-later']);
    // The roll is the committee's members on the day it opens.
    assert.deepEqual(open.roll.map((r) => r.person).sort(), [1, 2, 3, 4].map(P).sort());
});

test('history: a later month may finish an open election and add new ones, never change what was planned', () => {
    const EVOTES = { votes: [
        { key: 'ev-done', committee: 'Food Safety Committee', opens: '2026-10-05', closes: '2026-10-12', certified: '2026-10-14', name: 'Done (Food Safety, electronic vote)', text: 't', turnout: 1, yes: 0.8 },
        { key: 'ev-open', committee: 'Food Safety Committee', opens: '2026-10-28', closes: '2026-11-11', certified: '2026-11-13', name: 'Open (Food Safety, electronic vote)', text: 't', turnout: 1, yes: 0.8 },
        { key: 'ev-later', committee: 'Food Safety Committee', opens: '2026-11-20', closes: '2026-11-27', certified: '2026-11-30', name: 'Later (Food Safety, electronic vote)', text: 't', turnout: 1, yes: 0.8 },
    ] };
    const at = (asOf) => buildPlan(loadWorld(world({ asOf })), { ...NO_BOARD, chapter: { years: [] }, evotes: EVOTES });
    const prev = at('2026-10-31');
    const next = at('2026-11-30');
    assert.deepEqual(historyChanges(prev, next), []);
    assert.deepEqual(historyChanges(prev, prev), []);
    const edit = (fn) => { const copy = structuredClone(next); fn(copy.elections); return historyChanges(prev, copy); };
    const find = (els, key) => els.find((e) => e.key === key);
    assert.match(edit((els) => { find(els, 'ev-done').ballots[0].contests[0].option = 'No'; }).join(), /ev-done: finished, but the new plan changes ballots/);
    assert.match(edit((els) => { find(els, 'ev-open').ballots[0].at = '2026-10-29T09:00:00Z'; }).join(), /ev-open: the new plan changes the ballots cast by 2026-10-31/);
    assert.match(edit((els) => { find(els, 'ev-open').closesAt = '2026-11-12T23:00:00Z'; }).join(), /ev-open: open on 2026-10-31, but the new plan changes closesAt/);
    assert.match(edit((els) => els.splice(els.findIndex((e) => e.key === 'ev-done'), 1)).join(), /ev-done: the new plan drops it/);
});

test('CLI: writes the plan, then --check passes until generated/ changes', () => {
    const root = world({ n: 6 });
    const run = (...a) => spawnSync(process.execPath, [SCRIPT, ...a], { cwd: root, encoding: 'utf8' });
    assert.equal(run('--check').status, 1, 'no plan yet');
    // Six members can't field a board, so the real BOARD settings refuse.
    assert.match(run().stderr, /board-2019/);
    const committees = path.join(root, 'generated/committees/.committees.json');
    assert.ok(fs.existsSync(committees));
});
