/**
 * Specs for load-community.mjs — CLI argument parsing, plan validation,
 * topological parent-before-child post ordering, --limit parent closure slicing,
 * presenter seating plans, backdating SQL generation, and offline --dry-run CLI execution.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import {
    DEFAULT_PLAN_PATH,
    DEFAULT_PRESENTER,
    ENTITY,
    buildBackdateSqlStatements,
    load,
    parseArgs,
    planPresenterSeating,
    sliceCommunityPlanByLimit,
    topologicallySortPosts,
    validateCommunityPlanForLoader,
} from './load-community.mjs';

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SCRIPT = path.join(REPO_ROOT, 'scripts', 'load-community.mjs');
const PLAN_FILE = path.join(REPO_ROOT, DEFAULT_PLAN_PATH);

let cachedPlan;
function getCommittedPlan() {
    if (!cachedPlan) {
        cachedPlan = JSON.parse(fs.readFileSync(PLAN_FILE, 'utf8'));
    }
    return cachedPlan;
}

test('ENTITY map uses exact MemberJunction Community and Collaboration entity names', () => {
    assert.equal(ENTITY.spaces, 'MJ_BizApps_Collaboration: Spaces');
    assert.equal(ENTITY.spaceMembers, 'MJ_BizApps_Collaboration: Space Members');
    assert.equal(ENTITY.communitySpaces, 'MJ_BizApps_Community: Community Spaces');
    assert.equal(ENTITY.forums, 'MJ_BizApps_Community: Forums');
    assert.equal(ENTITY.forumMembers, 'MJ_BizApps_Community: Forum Members');
    assert.equal(ENTITY.forumTopicTags, 'MJ_BizApps_Community: Forum Topic Tags');
    assert.equal(ENTITY.communityMemberProfiles, 'MJ_BizApps_Community: Community Member Profiles');
    assert.equal(ENTITY.forumSubscriptions, 'MJ_BizApps_Community: Forum Subscriptions');
    assert.equal(ENTITY.forumIdeaCampaigns, 'MJ_BizApps_Community: Forum Idea Campaigns');
    assert.equal(ENTITY.forumPosts, 'MJ_BizApps_Community: Forum Posts');
    assert.equal(ENTITY.forumQuestionPosts, 'MJ_BizApps_Community: Forum Question Posts');
    assert.equal(ENTITY.forumAnswerPosts, 'MJ_BizApps_Community: Forum Answer Posts');
    assert.equal(ENTITY.forumIdeaPosts, 'MJ_BizApps_Community: Forum Idea Posts');
    assert.equal(ENTITY.forumCasePosts, 'MJ_BizApps_Community: Forum Case Posts');
    assert.equal(ENTITY.forumAMAPosts, 'MJ_BizApps_Community: Forum AMA Posts');
    assert.equal(ENTITY.forumArtifactPosts, 'MJ_BizApps_Community: Forum Artifact Posts');
    assert.equal(ENTITY.forumPostTags, 'MJ_BizApps_Community: Forum Post Tags');
    assert.equal(ENTITY.forumPostReactions, 'MJ_BizApps_Community: Forum Post Reactions');
    assert.equal(ENTITY.forumIdeaAllocations, 'MJ_BizApps_Community: Forum Idea Allocations');
});

test('parseArgs: supports --dry-run offline, --mj, --plan, --presenter, --limit, and rejects invalid flags', () => {
    const dry = parseArgs(['--dry-run']);
    assert.equal(dry.dryRun, true);
    assert.equal(dry.plan, DEFAULT_PLAN_PATH);
    assert.equal(dry.presenter, DEFAULT_PRESENTER);
    assert.equal(dry.limit, null);

    const full = parseArgs([
        '--mj', '../MJ',
        '--plan=data/community/custom.plan.json',
        '--presenter', 'Alice.Smith@Example.COM',
        '--limit=25',
    ]);
    assert.equal(full.dryRun, false);
    assert.equal(full.mj, path.resolve('../MJ'));
    assert.equal(full.plan, 'data/community/custom.plan.json');
    assert.equal(full.presenter, 'alice.smith@example.com');
    assert.equal(full.limit, 25);

    const savedEnv = process.env.MJ_DIR;
    delete process.env.MJ_DIR;
    try {
        assert.throws(() => parseArgs([]), /--mj/);
    } finally {
        if (savedEnv !== undefined) process.env.MJ_DIR = savedEnv;
    }
    assert.throws(() => parseArgs(['--dry-run', '--limit', '0']), /positive integer/);
    assert.throws(() => parseArgs(['--dry-run', '--limit', 'abc']), /positive integer/);
    assert.throws(() => parseArgs(['--dry-run', '--unknown']), /unknown argument/);
    assert.throws(() => parseArgs(['--dry-run', '--presenter']), /requires a value/);
});

test('validateCommunityPlanForLoader: validates committed community.plan.json and rejects malformed plans', () => {
    const plan = getCommittedPlan();
    const res = validateCommunityPlanForLoader(plan);
    assert.equal(res.valid, true);
    assert.equal(res.summary.communitySpaces, 9);
    assert.equal(res.summary.forums, 29);
    assert.ok(res.summary.posts >= 640);

    assert.throws(() => validateCommunityPlanForLoader(null), /JSON object/);
    assert.throws(() => validateCommunityPlanForLoader({ ...plan, forums: undefined }), /missing required array "forums"/);
    assert.throws(() => validateCommunityPlanForLoader({ ...plan, communitySpaces: [] }), /0 communitySpaces/);

    const badSub = {
        ...plan,
        subscriptions: [
            { fields: { ID: '00000000-0000-0000-0000-000000000099', UserID: '00000000-0000-0000-0000-000000000001', ForumID: null, RootPostID: null, TopicTagID: null } },
        ],
    };
    assert.throws(() => validateCommunityPlanForLoader(badSub), /CK_ForumSubscription_Target/);
});

test('topologicallySortPosts: orders parents before children across reversed multi-depth threads and detects cycles', () => {
    const root = { createdAt: '2024-01-01T10:00:00Z', fields: { ID: '00000000-0000-0000-0000-000000000001', RootPostID: null, ParentPostID: null, ReplyDepth: 0 } };
    const r1 = { createdAt: '2024-01-01T11:00:00Z', fields: { ID: '00000000-0000-0000-0000-000000000002', RootPostID: root.fields.ID, ParentPostID: root.fields.ID, ReplyDepth: 1 } };
    const r2 = { createdAt: '2024-01-01T12:00:00Z', fields: { ID: '00000000-0000-0000-0000-000000000003', RootPostID: root.fields.ID, ParentPostID: r1.fields.ID, ReplyDepth: 2 } };

    const sorted = topologicallySortPosts([r2, r1, root]);
    assert.deepEqual(sorted.map((p) => p.fields.ID), [root.fields.ID, r1.fields.ID, r2.fields.ID]);

    const cycleA = { createdAt: '2024-01-01T10:00:00Z', fields: { ID: '00000000-0000-0000-0000-000000000010', RootPostID: null, ParentPostID: '00000000-0000-0000-0000-000000000011', ReplyDepth: 1 } };
    const cycleB = { createdAt: '2024-01-01T11:00:00Z', fields: { ID: '00000000-0000-0000-0000-000000000011', RootPostID: null, ParentPostID: '00000000-0000-0000-0000-000000000010', ReplyDepth: 1 } };
    assert.throws(() => topologicallySortPosts([cycleA, cycleB]), /Cycle detected/);

    const orphan = { createdAt: '2024-01-01T10:00:00Z', fields: { ID: '00000000-0000-0000-0000-000000000020', RootPostID: '00000000-0000-0000-0000-000000000099', ParentPostID: '00000000-0000-0000-0000-000000000099', ReplyDepth: 1 } };
    assert.throws(() => topologicallySortPosts([orphan]), /missing ParentPostID/);
});

test('sliceCommunityPlanByLimit: preserves complete parent closure, prunes dependent subtypes, and maintains referential integrity', () => {
    const plan = getCommittedPlan();
    const sliced = sliceCommunityPlanByLimit(plan, 20);
    assert.ok(sliced.posts.length <= 20 && sliced.posts.length > 0);
    const keptIds = new Set(sliced.posts.map((p) => p.fields.ID.toUpperCase()));

    for (const p of sliced.posts) {
        if (p.fields.ParentPostID) assert.ok(keptIds.has(p.fields.ParentPostID.toUpperCase()));
        if (p.fields.RootPostID) assert.ok(keptIds.has(p.fields.RootPostID.toUpperCase()));
    }
    for (const qp of sliced.questionPosts) {
        assert.ok(keptIds.has(qp.fields.ID.toUpperCase()));
        if (qp.fields.AcceptedAnswerPostID) assert.ok(keptIds.has(qp.fields.AcceptedAnswerPostID.toUpperCase()));
        if (qp.fields.AICanonAnswerPostID) assert.ok(keptIds.has(qp.fields.AICanonAnswerPostID.toUpperCase()));
    }
    for (const r of sliced.reactions) {
        assert.ok(keptIds.has(r.fields.PostID.toUpperCase()));
    }
    for (const pt of sliced.postTags) {
        assert.ok(keptIds.has(pt.fields.PostID.toUpperCase()));
    }
    for (const sub of sliced.subscriptions) {
        if (sub.fields.RootPostID) assert.ok(keptIds.has(sub.fields.RootPostID.toUpperCase()));
    }
});

test('planPresenterSeating: seats presenter across all 9 community spaces, 29 forums, profiles, and subscriptions', () => {
    const plan = getCommittedPlan();
    const seating = planPresenterSeating(plan, 'Presenter.User@Example.COM');
    assert.equal(seating.presenterEmail, 'presenter.user@example.com');
    assert.equal(seating.collaborationSpaceSeats.length, 9);
    assert.equal(seating.forumMemberships.length, 29);
    assert.equal(seating.memberProfiles.length, 9);
    assert.equal(seating.forumSubscriptions.length, 29);
    assert.ok(seating.forumMemberships.every((fm) => fm.roleCode === 'forum-admin' && fm.status === 'Active'));
    assert.ok(seating.collaborationSpaceSeats.every((s) => s.role === 'admin' && s.status === 'Active'));
});

test('buildBackdateSqlStatements: generates trigger-guarded batched T-SQL covering Community, Collaboration, and Artifact tables', () => {
    const plan = sliceCommunityPlanByLimit(getCommittedPlan(), 40);
    const result = buildBackdateSqlStatements(plan, { chunkSize: 15 });
    assert.ok(result.statements.length > 0);
    assert.ok(result.sql.startsWith('SET XACT_ABORT ON;\nBEGIN TRAN;\nDISABLE TRIGGER ALL ON'));
    assert.ok(result.sql.includes('ENABLE TRIGGER ALL ON'));
    assert.ok(result.sql.endsWith('COMMIT;'));
    assert.ok(result.tables.includes('[__mj_BizAppsCommunity].[CommunitySpace]'));
    assert.ok(result.tables.includes('[__mj_BizAppsCommunity].[ForumPost]'));
    assert.ok(result.tables.includes('[__mj_BizAppsCollaboration].[Space]'));
});

test('load() & CLI --dry-run: executes cleanly offline against committed community.plan.json and --limit', async () => {
    const res = await load({ plan: DEFAULT_PLAN_PATH, dryRun: true, presenter: DEFAULT_PRESENTER, limit: 30 });
    assert.equal(res.dryRun, true);
    assert.equal(res.counts.communitySpaces, 9);
    assert.equal(res.counts.forums, 29);
    assert.ok(res.counts.posts <= 30 && res.counts.posts > 0);
    assert.ok(res.backdateStatements > 0);

    const cliRes = spawnSync(process.execPath, [SCRIPT, '--dry-run', '--limit', '25'], { cwd: REPO_ROOT, encoding: 'utf8' });
    assert.equal(cliRes.status, 0, cliRes.stderr);
    assert.match(cliRes.stdout, /dry-run OK/);
});
