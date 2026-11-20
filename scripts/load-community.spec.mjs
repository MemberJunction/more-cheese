/**
 * Specs for load-community.mjs — CLI argument parsing, plan validation,
 * topological parent-before-child post ordering, --limit parent closure slicing,
 * presenter seating plans, backdating SQL generation, and offline --dry-run CLI execution.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import {
    DEFAULT_PLAN_PATH,
    DEFAULT_PRESENTER,
    ENTITY,
    assertValidUuid,
    buildBackdateSqlStatements,
    escapeSqlLiteral,
    load,
    parseArgs,
    planPresenterSeating,
    sliceCommunityPlanByLimit,
    topologicallySortPosts,
    uuidsEqual,
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

function createMockRuntime(initialTables = {}, users = [], hooks = {}) {
    const tables = new Map();
    for (const [k, rows] of Object.entries(initialTables)) {
        tables.set(k, rows.map((r) => ({ ...r })));
    }
    const getRows = (entity) => {
        if (!tables.has(entity)) tables.set(entity, []);
        return tables.get(entity);
    };
    const queries = [];
    const saves = [];
    const sqlBatches = [];

    class MockRunView {
        async RunView(params) {
            queries.push(params);
            let rows = [...getRows(params.EntityName)];
            if (params.ExtraFilter) {
                const spaceMatch = /^SpaceID\s*=\s*'([^']+)'$/i.exec(params.ExtraFilter.trim());
                if (spaceMatch) {
                    const target = spaceMatch[1].toUpperCase();
                    rows = rows.filter((r) => String(r.SpaceID ?? '').toUpperCase() === target);
                } else if (params.ExtraFilter.trim() === 'IsDefault = 1') {
                    rows = rows.filter((r) => r.IsDefault === 1 || r.IsDefault === true);
                }
            }
            return { Success: true, Results: rows.map((r) => ({ ...r })) };
        }
    }

    class MockEntityObject {
        constructor(entityName) {
            this.__entityName = entityName;
            this.__isNew = false;
            this.LatestResult = { CompleteMessage: '' };
        }
        NewRecord() {
            this.__isNew = true;
        }
        async Load(id) {
            const found = getRows(this.__entityName).find((r) => uuidsEqual(r.ID, id));
            if (!found) return false;
            Object.assign(this, found);
            this.__isNew = false;
            return true;
        }
        async AttachToParent(ck) {
            const id = ck?.KeyValuePairs?.[0]?.Value;
            this.ID = id;
            return getRows(ENTITY.spaces).some((r) => uuidsEqual(r.ID, id)) || getRows(ENTITY.forums).some((r) => uuidsEqual(r.ID, id));
        }
        async Save() {
            const payload = {};
            for (const [k, v] of Object.entries(this)) {
                if (k.startsWith('__') || k === 'LatestResult') continue;
                payload[k] = v;
            }
            if (hooks.onSave) {
                const err = await hooks.onSave(this.__entityName, payload, { tables, getRows, saves });
                if (err) {
                    this.LatestResult = { CompleteMessage: err };
                    return false;
                }
            }
            const rows = getRows(this.__entityName);
            if (!payload.ID) payload.ID = crypto.randomUUID().toUpperCase();
            const idx = rows.findIndex((r) => uuidsEqual(r.ID, payload.ID));
            if (idx >= 0) {
                rows[idx] = { ...rows[idx], ...payload };
            } else {
                rows.push({ ...payload });
            }
            saves.push({ entityName: this.__entityName, isNew: this.__isNew, data: { ...payload } });
            this.__isNew = false;
            return true;
        }
    }

    class MockMetadata {
        EntityByName(name) {
            return { ID: '11111111-1111-4111-8111-111111111111', Name: name };
        }
        async GetEntityObject(name) {
            return new MockEntityObject(name);
        }
    }

    const systemUser = users.find((u) => u.Name === 'System') ?? { ID: '00000000-0000-0000-0000-000000000001', Name: 'System', Email: 'system@morecheese.org' };
    return {
        queries,
        saves,
        sqlBatches,
        tables,
        getRows,
        runtime: {
            core: {
                Metadata: MockMetadata,
                RunView: MockRunView,
                CompositeKey: { FromID: (id) => ({ KeyValuePairs: [{ FieldName: 'ID', Value: id }] }) },
            },
            pool: {
                request: () => ({
                    query: async (sql) => {
                        sqlBatches.push(sql);
                    },
                }),
                close: async () => {},
            },
            UserCache: {
                Instance: {
                    Users: users,
                    GetSystemUser: () => systemUser,
                },
            },
            collab: { vouchStoredFile: () => {} },
        },
    };
}

test('CR-001: validateCommunityPlanForLoader & load() reject SQL injection in cs.id and id/fields.ID mismatches before any query or save', async () => {
    const plan = structuredClone(getCommittedPlan());

    // Helper checks
    assert.equal(escapeSqlLiteral("o'malley"), "o''malley");
    assert.equal(uuidsEqual('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'AAAAAAAA-AAAA-4AAA-8AAA-AAAAAAAAAAAA'), true);
    assert.throws(() => assertValidUuid("'; DROP TABLE Users; --", 'cs.id'), /Invalid UUID/);

    // 1. Malicious SQL syntax in cs.id
    const sqlInjPlan = structuredClone(plan);
    sqlInjPlan.communitySpaces[0].id = "8BF2CDD5-52DE-5448-8D90-91D299F9927A' OR '1'='1";
    assert.throws(() => validateCommunityPlanForLoader(sqlInjPlan), /Invalid UUID/);

    // 2. Mismatched cs.id !== cs.fields.ID
    const mismatchPlan = structuredClone(plan);
    mismatchPlan.communitySpaces[0].id = '11111111-1111-4111-8111-111111111111';
    assert.throws(() => validateCommunityPlanForLoader(mismatchPlan), /mismatched id/);

    // 3. Mismatched collaborationSpace.id / collaborationSpace.fields.ID
    const collabMismatch = structuredClone(plan);
    collabMismatch.communitySpaces[0].collaborationSpace.id = '22222222-2222-4222-8222-222222222222';
    assert.throws(() => validateCommunityPlanForLoader(collabMismatch), /does not match collaborationSpace\.id/);

    const collabFieldMismatch = structuredClone(plan);
    collabFieldMismatch.communitySpaces[0].collaborationSpace.fields.ID = '22222222-2222-4222-8222-222222222222';
    assert.throws(() => validateCommunityPlanForLoader(collabFieldMismatch), /does not match collaborationSpace\.fields\.ID/);

    // 4. Invalid FK UUID in posts / subscriptions
    const badFkPlan = structuredClone(plan);
    badFkPlan.posts[0].fields.AuthorUserID = "bad' OR 1=1--";
    assert.throws(() => validateCommunityPlanForLoader(badFkPlan), /Invalid UUID/);

    // 5. load() rejects both malicious cs.id and mismatched cs.id !== cs.fields.ID BEFORE touching runtime queries or saves
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'load-comm-cr001-'));
    try {
        const bad1Path = path.join(tmpDir, 'sql-inj.plan.json');
        const bad2Path = path.join(tmpDir, 'mismatch.plan.json');
        fs.writeFileSync(bad1Path, JSON.stringify(sqlInjPlan));
        fs.writeFileSync(bad2Path, JSON.stringify(mismatchPlan));

        const mock = createMockRuntime();
        await assert.rejects(() => load({ plan: bad1Path, runtime: mock.runtime }), /Invalid UUID/);
        await assert.rejects(() => load({ plan: bad2Path, runtime: mock.runtime }), /mismatched id/);
        assert.equal(mock.queries.length, 0, 'validation failure must occur before any RunView query');
        assert.equal(mock.saves.length, 0, 'validation failure must occur before any Save');
    } finally {
        fs.rmSync(tmpDir, { recursive: true, force: true });
    }
});

test('CR-002: buildBackdateSqlStatements emits CAST(NULL AS datetimeoffset) and never bare NULL for nullable timestamp columns', () => {
    const base = getCommittedPlan();
    // 1. All-null nullable timestamp batch (--limit 1 on an unsynthesized root post where SummaryGeneratedAt is null)
    const unsynthRoot = base.posts.find((p) => p.fields.RootPostID == null && p.fields.SummaryGeneratedAt == null);
    assert.ok(unsynthRoot, 'expected at least one unsynthesized root post in committed plan');
    const allNullPlan = {
        ...base,
        posts: [unsynthRoot],
        questionPosts: base.questionPosts
            .filter((qp) => uuidsEqual(qp.fields.ID, unsynthRoot.fields.ID))
            .map((qp) => ({ ...qp, fields: { ...qp.fields, ResolvedAt: null } })),
        answerPosts: [],
    };
    const allNullSql = buildBackdateSqlStatements(allNullPlan);
    const postStmt = allNullSql.statements.find((s) => s.includes('[__mj_BizAppsCommunity].[ForumPost]'));
    assert.ok(postStmt, 'expected ForumPost backdate statement');
    assert.ok(postStmt.includes('CAST(NULL AS datetimeoffset)'), 'all-null batch must emit CAST(NULL AS datetimeoffset)');
    const bareNullRe = /(?:[(,]\s*)NULL(?:\s*[,)])/;
    assert.equal(bareNullRe.test(allNullSql.sql), false, 'zero bare NULL tokens allowed in backdate SQL');

    // 2. Mixed-null batch (both null and non-null SummaryGeneratedAt, ResolvedAt, VerifiedAt)
    const synthRoot = base.posts.find((p) => p.fields.RootPostID == null && p.fields.SummaryGeneratedAt != null);
    assert.ok(synthRoot, 'expected at least one synthesized root post in committed plan');
    const mixedPlan = {
        ...base,
        posts: [unsynthRoot, synthRoot],
        questionPosts: [
            { fields: { ID: unsynthRoot.fields.ID, ResolvedAt: null } },
            { fields: { ID: synthRoot.fields.ID, ResolvedAt: '2024-05-10T12:00:00Z' } },
        ],
        answerPosts: [
            { fields: { ID: base.answerPosts[0].fields.ID, VerifiedAt: null } },
            { fields: { ID: base.answerPosts[1].fields.ID, VerifiedAt: '2024-05-11T15:30:00Z' } },
        ],
    };
    const mixedSql = buildBackdateSqlStatements(mixedPlan);
    for (const stmt of mixedSql.statements) {
        assert.equal(bareNullRe.test(stmt), false, `bare NULL found in statement: ${stmt}`);
    }
    const mixedPostStmt = mixedSql.statements.find((s) => s.includes('[__mj_BizAppsCommunity].[ForumPost]'));
    assert.ok(mixedPostStmt.includes('CAST(NULL AS datetimeoffset)'));
    assert.ok(mixedPostStmt.includes(`CAST('${synthRoot.fields.SummaryGeneratedAt}' AS datetimeoffset)`));
});

test('CR-004: load() reconciles missing collaborationSpace.seats when flagship Collaboration Space already exists, and is idempotent on replay', async () => {
    const spaceId = '8BF2CDD5-52DE-5448-8D90-91D299F9927A';
    const forumId = '10000000-0000-4000-8000-000000000001';
    const forumTypeId = 'C8A17100-4E12-4B8F-9A10-100000000001';
    const ownerId = '20000000-0000-4000-8000-000000000001';
    const memberAId = '20000000-0000-4000-8000-000000000002';
    const memberBId = '20000000-0000-4000-8000-000000000003';
    const presenterId = '20000000-0000-4000-8000-000000000099';

    const minimalPlan = {
        version: 1,
        asOf: '2026-10-31',
        communitySpaces: [
            {
                key: 'icf-member-commons',
                id: spaceId,
                createCollaborationSpace: true,
                startedAt: '2019-01-01',
                ownerUserId: ownerId,
                ownerEmail: 'owner@morecheese.org',
                collaborationSpace: {
                    id: spaceId,
                    fields: {
                        ID: spaceId,
                        SpaceTypeID: '2B2C14A8-CCD6-4835-A1BD-969C54236D57',
                        ParentID: null,
                        Name: 'ICF Member Commons',
                        Description: 'Flagship',
                        OwnerID: ownerId,
                        InheritsMembership: false,
                        AgentRetrieval: 'Included',
                        StartedAt: '2019-01-01T00:00:00Z',
                    },
                    seats: [
                        { userId: ownerId, email: 'owner@morecheese.org', role: 'owner', status: 'Active' },
                        { userId: memberAId, email: 'membera@morecheese.org', role: 'member', status: 'Active' },
                        { userId: memberBId, email: 'memberb@morecheese.org', role: 'member', status: 'Active' },
                    ],
                },
                fields: {
                    ID: spaceId,
                    Slug: 'icf-member-commons',
                    CommunityKind: 'Association',
                    AnonymousReadMode: 'Teaser Only',
                    AskFirstEnabled: true,
                    DefaultDigestCadence: 'Daily Digest',
                    DefaultForumID: forumId,
                },
            },
        ],
        forums: [
            {
                key: 'commons-town-square',
                spaceKey: 'icf-member-commons',
                forumTypeCode: 'general-discussion',
                startedAt: '2019-01-01',
                fields: { ID: forumId, SpaceID: spaceId, ForumTypeID: forumTypeId, Slug: 'town-square', Name: 'Town Square' },
            },
        ],
        forumIdeaCampaigns: [],
        topicTags: [],
        forumMembers: [],
        memberProfiles: [],
        posts: [],
        questionPosts: [],
        answerPosts: [],
        ideaPosts: [],
        casePosts: [],
        amaPosts: [],
        artifactPosts: [],
        postTags: [],
        reactions: [],
        ideaAllocations: [],
        subscriptions: [],
    };

    const users = [
        { ID: '00000000-0000-0000-0000-000000000001', Name: 'System', Email: 'system@morecheese.org' },
        { ID: ownerId, Name: 'Owner', Email: 'owner@morecheese.org' },
        { ID: memberAId, Name: 'Member A', Email: 'membera@morecheese.org' },
        { ID: memberBId, Name: 'Member B', Email: 'memberb@morecheese.org' },
        { ID: presenterId, Name: 'Presenter', Email: DEFAULT_PRESENTER },
    ];

    const mock = createMockRuntime(
        {
            [ENTITY.forumTypes]: [{ ID: forumTypeId, Code: 'general-discussion' }],
            [ENTITY.postTypes]: [],
            [ENTITY.forumRoleTypes]: [{ ID: '30000000-0000-4000-8000-000000000001', Code: 'forum-admin' }],
            [ENTITY.spaceRoles]: [
                { ID: '40000000-0000-4000-8000-000000000001', Code: 'owner' },
                { ID: '40000000-0000-4000-8000-000000000002', Code: 'admin' },
                { ID: '40000000-0000-4000-8000-000000000003', Code: 'member' },
            ],
            [ENTITY.environments]: [{ ID: '50000000-0000-4000-8000-000000000001', IsDefault: 1 }],
            [ENTITY.artifactTypes]: [{ ID: '60000000-0000-4000-8000-000000000001', Name: 'Document' }],
            // Space already exists with ONLY owner seated (partial roster)
            [ENTITY.spaces]: [{ ID: spaceId, Name: 'ICF Member Commons' }],
            [ENTITY.spaceMembers]: [{ ID: '70000000-0000-4000-8000-000000000001', SpaceID: spaceId, UserID: ownerId }],
        },
        users,
    );

    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'load-comm-cr004-'));
    try {
        const planPath = path.join(tmpDir, 'plan.json');
        fs.writeFileSync(planPath, JSON.stringify(minimalPlan));

        const res1 = await load({ plan: planPath, runtime: mock.runtime });
        assert.equal(res1.counts.collabSpaces, 0, 'existing collaboration space must not be recreated');
        assert.equal(res1.counts.collabSeats, 2, 'must insert the 2 missing planned seats');
        const seatedUsers = new Set(mock.getRows(ENTITY.spaceMembers).map((r) => r.UserID.toUpperCase()));
        assert.ok(seatedUsers.has(ownerId));
        assert.ok(seatedUsers.has(memberAId));
        assert.ok(seatedUsers.has(memberBId));
        assert.ok(seatedUsers.has(presenterId));

        // Second replay must insert zero duplicate seats
        const res2 = await load({ plan: planPath, runtime: mock.runtime });
        assert.equal(res2.counts.collabSeats, 0, 'second replay must add zero duplicate seats');
        assert.equal(res2.counts.presenterSeats, 0);
        assert.equal(mock.getRows(ENTITY.spaceMembers).length, 4);
    } finally {
        fs.rmSync(tmpDir, { recursive: true, force: true });
    }
});

test('CR-005: load() temporarily reopens a closed existing ForumIdeaCampaign to save missing allocations and restores VotingClosesAt in finally', async () => {
    const spaceId = '8BF2CDD5-52DE-5448-8D90-91D299F9927A';
    const forumId = '10000000-0000-4000-8000-000000000010';
    const forumTypeId = 'C8A17100-4E12-4B8F-9A10-100000000003';
    const postTypeId = 'D8A17100-4E12-4B8F-9A10-100000000003';
    const ideaPostId = '10000000-0000-4000-8000-000000000020';
    const allocId1 = '10000000-0000-4000-8000-000000000031';
    const allocId2 = '10000000-0000-4000-8000-000000000032';
    const ownerId = '20000000-0000-4000-8000-000000000001';
    const voter1Id = '20000000-0000-4000-8000-000000000002';
    const voter2Id = '20000000-0000-4000-8000-000000000003';
    const presenterId = '20000000-0000-4000-8000-000000000099';
    const historicalClose = '2025-06-30T23:59:59Z';

    const buildTestPlan = (includeSecondAlloc = false) => ({
        version: 1,
        asOf: '2026-10-31',
        communitySpaces: [
            {
                key: 'icf-member-commons',
                id: spaceId,
                createCollaborationSpace: false,
                startedAt: '2019-01-01',
                ownerUserId: ownerId,
                ownerEmail: 'owner@morecheese.org',
                fields: { ID: spaceId, Slug: 'icf-member-commons', DefaultForumID: forumId },
            },
        ],
        forums: [
            {
                key: 'commons-ideation',
                spaceKey: 'icf-member-commons',
                forumTypeCode: 'ideation-campaign',
                startedAt: '2024-09-01',
                fields: { ID: forumId, SpaceID: spaceId, ForumTypeID: forumTypeId, Slug: 'commons-ideation', Name: 'Ideation' },
            },
        ],
        forumIdeaCampaigns: [
            {
                campaignKey: 'campaign-2025',
                forumKey: 'commons-ideation',
                spaceKey: 'icf-member-commons',
                opensAt: '2024-09-01T00:00:00Z',
                fields: {
                    ID: forumId,
                    DefaultBudgetPoints: 100,
                    AllocationMode: 'Quadratic',
                    MaxPointsPerIdea: 49,
                    SubmissionsCloseAt: '2025-05-31T23:59:59Z',
                    VotingClosesAt: historicalClose,
                },
            },
        ],
        topicTags: [],
        forumMembers: [],
        memberProfiles: [],
        posts: [
            {
                key: 'idea-1',
                cycle: '2024-09',
                createdAt: '2024-09-05T10:00:00Z',
                fields: {
                    ID: ideaPostId,
                    ForumID: forumId,
                    PostTypeID: postTypeId,
                    RootPostID: null,
                    ParentPostID: null,
                    ReplyDepth: 0,
                    AuthorUserID: ownerId,
                    ViewCount: 0,
                },
            },
        ],
        questionPosts: [],
        answerPosts: [],
        ideaPosts: [
            {
                cycle: '2024-09',
                campaignKey: 'campaign-2025',
                fields: { ID: ideaPostId, IdeaStatus: 'Shipped', TotalPointsAllocated: 25 },
            },
        ],
        casePosts: [],
        amaPosts: [],
        artifactPosts: [],
        postTags: [],
        reactions: [],
        ideaAllocations: [
            {
                cycle: '2024-10',
                campaignKey: 'campaign-2025',
                createdAt: '2024-10-05T12:00:00Z',
                fields: { ID: allocId1, IdeaPostID: ideaPostId, UserID: voter1Id, PointsAllocated: 25, QuadraticVotes: 5 },
            },
            ...(includeSecondAlloc
                ? [
                      {
                          cycle: '2024-10',
                          campaignKey: 'campaign-2025',
                          createdAt: '2024-10-06T12:00:00Z',
                          fields: { ID: allocId2, IdeaPostID: ideaPostId, UserID: voter2Id, PointsAllocated: 16, QuadraticVotes: 4 },
                      },
                  ]
                : []),
        ],
        subscriptions: [],
    });

    const users = [
        { ID: '00000000-0000-0000-0000-000000000001', Name: 'System', Email: 'system@morecheese.org' },
        { ID: ownerId, Name: 'Owner', Email: 'owner@morecheese.org' },
        { ID: voter1Id, Name: 'Voter 1', Email: 'voter1@morecheese.org' },
        { ID: voter2Id, Name: 'Voter 2', Email: 'voter2@morecheese.org' },
        { ID: presenterId, Name: 'Presenter', Email: DEFAULT_PRESENTER },
    ];

    const makeInitialTables = () => ({
        [ENTITY.forumTypes]: [{ ID: forumTypeId, Code: 'ideation-campaign' }],
        [ENTITY.postTypes]: [{ ID: postTypeId, Code: 'idea-proposal' }],
        [ENTITY.forumRoleTypes]: [{ ID: '30000000-0000-4000-8000-000000000001', Code: 'forum-admin' }],
        [ENTITY.spaceRoles]: [{ ID: '40000000-0000-4000-8000-000000000001', Code: 'admin' }],
        [ENTITY.environments]: [{ ID: '50000000-0000-4000-8000-000000000001', IsDefault: 1 }],
        [ENTITY.artifactTypes]: [{ ID: '60000000-0000-4000-8000-000000000001', Name: 'Document' }],
        [ENTITY.spaces]: [{ ID: spaceId }],
        [ENTITY.spaceMembers]: [{ ID: '70000000-0000-4000-8000-000000000001', SpaceID: spaceId, UserID: presenterId }],
        [ENTITY.communitySpaces]: [{ ID: spaceId, DefaultForumID: forumId }],
        [ENTITY.forums]: [{ ID: forumId, SpaceID: spaceId }],
        [ENTITY.forumMembers]: [{ ID: '70000000-0000-4000-8000-000000000002', ForumID: forumId, UserID: presenterId }],
        [ENTITY.communityMemberProfiles]: [{ ID: '70000000-0000-4000-8000-000000000003', SpaceID: spaceId, UserID: presenterId }],
        [ENTITY.forumSubscriptions]: [{ ID: '70000000-0000-4000-8000-000000000004', UserID: presenterId, ForumID: forumId }],
        [ENTITY.forumIdeaCampaigns]: [{ ID: forumId, VotingClosesAt: historicalClose }],
        [ENTITY.forumPosts]: [{ ID: ideaPostId, ForumID: forumId }],
    });

    const enforceClosedVoting = async (entityName, payload, { getRows }) => {
        if (entityName === ENTITY.forumIdeaAllocations) {
            const camp = getRows(ENTITY.forumIdeaCampaigns)[0];
            if (camp?.VotingClosesAt != null && new Date(camp.VotingClosesAt).getTime() <= Date.now()) {
                return `Voting for this ideation campaign closed at ${new Date(camp.VotingClosesAt).toISOString()}.`;
            }
        }
        return null;
    };

    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'load-comm-cr005-'));
    try {
        const planPath = path.join(tmpDir, 'plan.json');
        fs.writeFileSync(planPath, JSON.stringify(buildTestPlan(false)));

        const mock = createMockRuntime(makeInitialTables(), users, { onSave: enforceClosedVoting });
        const res = await load({ plan: planPath, runtime: mock.runtime });
        assert.equal(res.counts.ideaAllocations, 1, 'missing allocation should be saved while campaign was temporarily reopened');

        const campSaves = mock.saves.filter((s) => s.entityName === ENTITY.forumIdeaCampaigns);
        assert.equal(campSaves.length, 2, 'campaign should be saved twice: temporary reopen + finally restore');
        assert.ok(new Date(campSaves[0].data.VotingClosesAt).getTime() > Date.now(), 'first save must temporarily reopen VotingClosesAt into the future');
        assert.equal(new Date(campSaves[1].data.VotingClosesAt).toISOString(), new Date(historicalClose).toISOString(), 'second save must restore historical VotingClosesAt');

        // Failure path: if second allocation fails mid-save, finally MUST still restore historical VotingClosesAt
        const failPlanPath = path.join(tmpDir, 'fail-plan.json');
        fs.writeFileSync(failPlanPath, JSON.stringify(buildTestPlan(true)));
        const failMock = createMockRuntime(makeInitialTables(), users, {
            onSave: async (entityName, payload, ctx) => {
                const baseErr = await enforceClosedVoting(entityName, payload, ctx);
                if (baseErr) return baseErr;
                if (entityName === ENTITY.forumIdeaAllocations && uuidsEqual(payload.ID, allocId2)) {
                    return 'Simulated mid-replay allocation failure';
                }
                return null;
            },
        });
        await assert.rejects(() => load({ plan: failPlanPath, runtime: failMock.runtime }), /Simulated mid-replay allocation failure/);
        const finalCampRow = failMock.getRows(ENTITY.forumIdeaCampaigns)[0];
        assert.equal(new Date(finalCampRow.VotingClosesAt).toISOString(), new Date(historicalClose).toISOString(), 'finally must restore historical VotingClosesAt even on error');
    } finally {
        fs.rmSync(tmpDir, { recursive: true, force: true });
    }
});
