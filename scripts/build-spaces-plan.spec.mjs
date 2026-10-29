/**
 * Specs for build-spaces-plan.mjs — who gets a seat where. Each case builds a throwaway repo root with a
 * small generated/ world, so none depends on the 90 MB tree; the CLI is exercised through spawnSync too.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { loadWorld, buildPlan, renderFiles, PRESENTER } from './build-spaces-plan.mjs';

const SCRIPT = path.join(path.dirname(fileURLToPath(import.meta.url)), 'build-spaces-plan.mjs');
const DUES = 'P0000000-0000-0000-0000-000000000001';
const pid = (n) => `00000000-0000-0000-0000-${String(n).padStart(12, '0')}`;

/**
 * A world of `n` Californian members (current unless listed in `lapsed`), one committee with a chair, a vice
 * chair, a member and an ended member, and Elena (person 1) as the hero who chairs the California chapter.
 */
function world({ n = 40, lapsed = [], kathy = null } = {}) {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'spaces-plan-'));
    const put = (rel, body) => { fs.mkdirSync(path.dirname(path.join(root, rel)), { recursive: true }); fs.writeFileSync(path.join(root, rel), JSON.stringify(body)); };
    const ids = Array.from({ length: n }, (_, i) => i + 1);
    const email = (i) => (i === 1 ? 'elena.rodriguez.000101@lakemail.example' : i === kathy ? 'kathy.oleary.000287@orchardmerecheese.example' : `p${i}@x.example`);
    put('generated/people/.people.json', ids.map((i) => ({ fields: { FirstName: `F${i}`, LastName: `L${i}`, PreferredName: `Pref${i}`, Email: email(i), Status: 'Active', DateOfBirth: '1980-01-01' }, primaryKey: { ID: pid(i) } })));
    put('generated/member-profiles/.member-profiles.json', ids.map((i) => ({ fields: { PersonID: pid(i), Region: 'NA', Country: 'US', State: 'US-CA', Segment: 'Producer' } })));
    put('generated/products/.products.json', [{ fields: { Name: 'Individual Membership (annual)' }, primaryKey: { ID: DUES } }]);
    put('generated/orders/.orders.json', ids.map((i) => ({
        fields: { OrderNumber: `ORD-${i}`, Status: 'Confirmed', OrderDate: lapsed.includes(i) ? '2023-01-10' : '2026-03-01', BillToPersonID: pid(i) },
        primaryKey: { ID: pid(1000 + i) },
        collections: { Lines: [{ fields: { ProductID: DUES } }] },
    })));
    // Engagement: person i has i enrollments, so higher numbers rank first.
    put('generated/enrollments/.enrollments.json', ids.flatMap((i) => Array.from({ length: i }, () => ({ fields: { PersonID: pid(i), EnrolledOn: '2026-05-01' } }))));
    put('generated/advocacy-actions/.advocacy-actions.json', []);
    put('generated/competition-entries/.competition-entries.json', []);
    put('generated/committees/.committees.json', [{ fields: { Name: 'Food Safety Committee', MissionStatement: 'Safe cheese.', FormationDate: '2015-01-01' }, primaryKey: { ID: 'C1' } }]);
    put('generated/committee-terms/.committee-terms.json', [{ fields: { CommitteeID: 'C1' }, primaryKey: { ID: 'T1' } }]);
    const m = (p, role, status, end = null) => ({ fields: { PersonID: pid(p), RoleID: `@lookup:Committees: Roles.Name=${role}`, TermID: 'T1', StartDate: '2025-01-01', EndDate: end, Status: status }, primaryKey: { ID: `M${p}` } });
    put('generated/committee-memberships/.committee-memberships.json', [m(2, 'Chair', 'Active'), m(3, 'Vice Chair', 'Active'), m(4, 'Member', 'Active'), m(5, 'Member', 'Ended', '2025-06-30')]);
    put('generated/tasks/.tasks.json', [
        { fields: { Name: 'Draft the recall checklist', Description: 'Action item recorded at the Food Safety Committee meeting on 2025-02-01.' }, primaryKey: { ID: 'TK1' } },
        { fields: { Name: 'Renewal outreach', Description: 'Member renewal follow-up.' }, primaryKey: { ID: 'TK2' } },
    ]);
    put('generated/checkpoint.json', { continuity: { asOfDate: '2026-10-31' } });
    put('data/ruleset/heroes.json', { heroes: [
        { heroKey: 'HERO-ICF-001', businessKeys: { Email: email(1) } },
        { heroKey: 'HERO-ICF-012', businessKeys: { Email: 'kathy.oleary.000287@orchardmerecheese.example' } },
    ] });
    return root;
}

const spaceOf = (plan, key) => plan.spaces.find((s) => s.key === key);
const seatOf = (space, email) => space.seats.find((x) => x.user === email);

test('committee: chair owns, vice chair admins, ended members are removed, presenter sits as admin, its action items are filed', () => {
    const { plan } = buildPlan(loadWorld(world()));
    const s = spaceOf(plan, 'committee-food-safety');
    assert.equal(s.type, 'working-group');
    assert.equal(s.owner, 'p2@x.example');
    assert.deepEqual(seatOf(s, 'p3@x.example'), { user: 'p3@x.example', person: pid(3), role: 'admin', status: 'Active' });
    assert.equal(seatOf(s, 'p4@x.example').role, 'member');
    assert.equal(seatOf(s, 'p5@x.example').status, 'Removed');
    assert.deepEqual(seatOf(s, PRESENTER), { user: PRESENTER, role: 'admin', status: 'Active' });
    assert.deepEqual(s.anchors, [{ entity: 'Committees: Committees', recordId: 'C1', role: 'primary', isPrimary: true }]);
    assert.deepEqual(s.tasks, ['TK1']);
});

test('chapter: the pinned hero chairs, the next two most engaged are admins, lapsed members are guests', () => {
    const { plan } = buildPlan(loadWorld(world({ lapsed: [39, 40] })));
    const s = spaceOf(plan, 'chapter-california');
    assert.equal(s.type, 'community');
    assert.equal(s.owner, 'elena.rodriguez.000101@lakemail.example');
    // 38 current members ranked by engagement: 38, 37, … ; Elena is pinned first.
    assert.equal(seatOf(s, 'p38@x.example').role, 'admin');
    assert.equal(seatOf(s, 'p37@x.example').role, 'admin');
    assert.equal(seatOf(s, 'p36@x.example').role, 'member');
    assert.equal(seatOf(s, 'p40@x.example').role, 'guest');
    assert.equal(seatOf(s, 'p39@x.example').role, 'guest');
    assert.equal(s.seats.filter((x) => x.user !== PRESENTER && x.role !== 'guest').length, 25);
});

test('the planted duplicate never gets a seat or a user', () => {
    const { plan, users } = buildPlan(loadWorld(world({ kathy: 30 })));
    assert.ok(!plan.spaces.some((s) => s.seats.some((x) => x.user.startsWith('kathy.'))));
    assert.ok(!users.some((u) => u.email.startsWith('kathy.')));
});

test('users: one per seated person, legal first name, stable ids, UI role each', () => {
    const root = world();
    const a = buildPlan(loadWorld(root));
    const b = buildPlan(loadWorld(root));
    assert.deepEqual(a, b);
    const seated = new Set(a.plan.spaces.flatMap((s) => s.seats.filter((x) => x.person).map((x) => x.person)));
    assert.equal(a.users.length, seated.size);
    const files = renderFiles(a.plan, a.users);
    const users = JSON.parse(files['config/users/.space-users.json']);
    const elena = users.find((u) => u.fields.Email.startsWith('elena.'));
    assert.equal(elena.fields.FirstName, 'F1');
    assert.equal(elena.fields.Type, 'User');
    const roles = JSON.parse(files['config/user-roles/.space-user-roles.json']);
    assert.equal(roles.length, users.length);
    assert.equal(roles[0].fields.RoleID, '@lookup:MJ: Roles.Name=UI');
    assert.equal(roles[0].fields.UserID, users[0].primaryKey.ID);
});

test('CLI: writes the three files, then --check passes until generated/ changes', () => {
    const root = world();
    const run = (...a) => spawnSync(process.execPath, [SCRIPT, ...a], { cwd: root, encoding: 'utf8' });
    assert.equal(run('--check').status, 1);
    const w = run();
    assert.equal(w.status, 0, w.stderr);
    assert.match(w.stdout, /spaces .* seats, \d+ users/);
    assert.equal(run('--check').status, 0);
    const f = path.join(root, 'generated/enrollments/.enrollments.json');
    fs.writeFileSync(f, JSON.stringify([...JSON.parse(fs.readFileSync(f, 'utf8')), ...Array.from({ length: 200 }, () => ({ fields: { PersonID: pid(7), EnrolledOn: '2026-05-01' } }))]));
    assert.equal(run('--check').status, 1);
});
