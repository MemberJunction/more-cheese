#!/usr/bin/env node
/**
 * load-community.mjs — replays data/community/community.plan.json into a MemberJunction
 * database through @mj-biz-apps/community-server and @mj-biz-apps/collaboration-server.
 *
 * Why a dedicated loader?
 *   - Collaboration Spaces & CommunitySpace IS-A subtypes require owner-authenticated saves.
 *   - ForumPost, ForumQuestionPost, ForumAnswerPost, ForumIdeaPost, ForumCasePost, ForumAMAPost,
 *     and ForumArtifactPost enforce parent-before-child ordering, role/moderation rules, and
 *     canon-verification authorization at save time.
 *   - ForumPostReaction and ForumIdeaAllocation enforce caller ownership and quadratic wallet caps
 *     during ValidateAsync().
 *   - Historical timestamps (2019-01 through 2026-10+) must be preserved after engine rollups run.
 *
 * Usage:
 *   node scripts/load-community.mjs --dry-run
 *   node scripts/load-community.mjs --dry-run --limit 25
 *   node scripts/load-community.mjs --mj ../MJ
 *   node scripts/load-community.mjs --mj ../MJ --presenter you@example.org
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';

export const DEFAULT_PLAN_PATH = 'data/community/community.plan.json';
export const DEFAULT_PRESENTER = 'demo.user@morecheese.org';
export const COLLAB_SCHEMA = '__mj_BizAppsCollaboration';
export const COMMUNITY_SCHEMA = '__mj_BizAppsCommunity';
export const MJ_CORE_SCHEMA = '__mj';

export const ENTITY = Object.freeze({
    spaces: 'MJ_BizApps_Collaboration: Spaces',
    spaceMembers: 'MJ_BizApps_Collaboration: Space Members',
    spaceTypes: 'MJ_BizApps_Collaboration: Space Types',
    spaceRoles: 'MJ_BizApps_Collaboration: Space Role Types',
    spaceItems: 'MJ_BizApps_Collaboration: Space Items',
    communitySpaces: 'MJ_BizApps_Community: Community Spaces',
    forums: 'MJ_BizApps_Community: Forums',
    forumTypes: 'MJ_BizApps_Community: Forum Types',
    postTypes: 'MJ_BizApps_Community: Post Types',
    forumRoleTypes: 'MJ_BizApps_Community: Forum Role Types',
    forumIdeaCampaigns: 'MJ_BizApps_Community: Forum Idea Campaigns',
    forumMembers: 'MJ_BizApps_Community: Forum Members',
    forumTopicTags: 'MJ_BizApps_Community: Forum Topic Tags',
    communityMemberProfiles: 'MJ_BizApps_Community: Community Member Profiles',
    forumSubscriptions: 'MJ_BizApps_Community: Forum Subscriptions',
    forumPosts: 'MJ_BizApps_Community: Forum Posts',
    forumQuestionPosts: 'MJ_BizApps_Community: Forum Question Posts',
    forumAnswerPosts: 'MJ_BizApps_Community: Forum Answer Posts',
    forumIdeaPosts: 'MJ_BizApps_Community: Forum Idea Posts',
    forumCasePosts: 'MJ_BizApps_Community: Forum Case Posts',
    forumAMAPosts: 'MJ_BizApps_Community: Forum AMA Posts',
    forumArtifactPosts: 'MJ_BizApps_Community: Forum Artifact Posts',
    forumPostTags: 'MJ_BizApps_Community: Forum Post Tags',
    forumPostReactions: 'MJ_BizApps_Community: Forum Post Reactions',
    forumIdeaAllocations: 'MJ_BizApps_Community: Forum Idea Allocations',
    artifacts: 'MJ: Artifacts',
    artifactVersions: 'MJ: Artifact Versions',
    artifactTypes: 'MJ: Artifact Types',
    environments: 'MJ: Environments',
    users: 'MJ: Users',
    people: 'MJ_BizApps_Common: People',
    entities: 'MJ: Entities',
});

const UUID_RE = /^[0-9A-F]{8}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{12}$/i;
const ISO_TS_RE = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2}))?$/;

const up = (v) => (v == null ? null : String(v).toUpperCase());
const q = (s) => String(s).replace(/'/g, "''");
const sameId = (a, b) => String(a ?? '').toUpperCase() === String(b ?? '').toUpperCase();
const log = (...a) => console.log(new Date().toISOString().slice(11, 19), ...a);

function assertUuid(value, label) {
    const s = String(value ?? '');
    if (!UUID_RE.test(s)) throw new Error(`Invalid UUID for ${label}: "${s}"`);
    return s.toUpperCase();
}

function assertIsoTimestamp(value, label) {
    const s = String(value ?? '');
    if (!ISO_TS_RE.test(s)) throw new Error(`Invalid ISO timestamp for ${label}: "${s}"`);
    return s.length === 10 ? `${s}T00:00:00Z` : s;
}

export function parseArgs(argv) {
    const out = {
        mj: process.env.MJ_DIR ?? null,
        plan: DEFAULT_PLAN_PATH,
        dryRun: false,
        presenter: DEFAULT_PRESENTER,
        limit: null,
    };
    const nextVal = (flag, i) => {
        if (i + 1 >= argv.length) throw new Error(`${flag} requires a value`);
        return argv[i + 1];
    };
    for (let i = 0; i < argv.length; i++) {
        const arg = argv[i];
        if (arg === '--mj') {
            out.mj = nextVal('--mj', i++);
        } else if (arg.startsWith('--mj=')) {
            out.mj = arg.slice('--mj='.length);
        } else if (arg === '--plan') {
            out.plan = nextVal('--plan', i++);
        } else if (arg.startsWith('--plan=')) {
            out.plan = arg.slice('--plan='.length);
        } else if (arg === '--dry-run') {
            out.dryRun = true;
        } else if (arg === '--presenter') {
            out.presenter = String(nextVal('--presenter', i++)).trim().toLowerCase();
        } else if (arg.startsWith('--presenter=')) {
            out.presenter = arg.slice('--presenter='.length).trim().toLowerCase();
        } else if (arg === '--limit') {
            const raw = nextVal('--limit', i++);
            const parsed = Number(raw);
            if (!Number.isInteger(parsed) || parsed <= 0) {
                throw new Error(`--limit must be a positive integer, got "${raw}"`);
            }
            out.limit = parsed;
        } else if (arg.startsWith('--limit=')) {
            const raw = arg.slice('--limit='.length);
            const parsed = Number(raw);
            if (!Number.isInteger(parsed) || parsed <= 0) {
                throw new Error(`--limit must be a positive integer, got "${raw}"`);
            }
            out.limit = parsed;
        } else {
            throw new Error(`unknown argument ${arg}`);
        }
    }
    if (!out.presenter) {
        throw new Error('--presenter must not be empty');
    }
    if (!out.dryRun && !out.mj) {
        throw new Error('--mj <path to the MJ repo or host that has mj.config.cjs> is required (or set MJ_DIR, or pass --dry-run)');
    }
    if (out.mj) {
        out.mj = path.resolve(out.mj);
    }
    return out;
}

/**
 * Validates that a parsed community plan JSON has all required collections, valid post DAGs,
 * valid subtype references, and valid ForumSubscription target exclusivity.
 */
export function validateCommunityPlanForLoader(plan) {
    if (!plan || typeof plan !== 'object') {
        throw new Error('Community plan must be a JSON object');
    }
    const requiredArrays = [
        'communitySpaces',
        'forums',
        'forumIdeaCampaigns',
        'topicTags',
        'forumMembers',
        'memberProfiles',
        'posts',
        'questionPosts',
        'answerPosts',
        'ideaPosts',
        'casePosts',
        'amaPosts',
        'artifactPosts',
        'postTags',
        'reactions',
        'ideaAllocations',
        'subscriptions',
    ];
    for (const key of requiredArrays) {
        if (!Array.isArray(plan[key])) {
            throw new Error(`Community plan missing required array "${key}"`);
        }
    }
    if (plan.communitySpaces.length === 0) {
        throw new Error('Community plan has 0 communitySpaces');
    }
    if (plan.forums.length === 0) {
        throw new Error('Community plan has 0 forums');
    }

    const spaceIds = new Set(plan.communitySpaces.map((cs) => up(cs.fields?.ID ?? cs.id)));
    const forumIds = new Set(plan.forums.map((f) => up(f.fields?.ID)));
    for (const f of plan.forums) {
        if (!spaceIds.has(up(f.fields?.SpaceID))) {
            throw new Error(`Forum ${f.key} references unknown SpaceID ${f.fields?.SpaceID}`);
        }
    }
    for (const c of plan.forumIdeaCampaigns) {
        if (!forumIds.has(up(c.fields?.ID))) {
            throw new Error(`ForumIdeaCampaign ${c.campaignKey} references unknown Forum ID ${c.fields?.ID}`);
        }
    }

    const sortedPosts = topologicallySortPosts(plan.posts);
    const postIds = new Set(sortedPosts.map((p) => up(p.fields.ID)));
    for (const p of sortedPosts) {
        if (!forumIds.has(up(p.fields?.ForumID))) {
            throw new Error(`ForumPost ${p.fields?.ID} references unknown ForumID ${p.fields?.ForumID}`);
        }
    }

    for (const [label, rows] of [
        ['questionPosts', plan.questionPosts],
        ['answerPosts', plan.answerPosts],
        ['ideaPosts', plan.ideaPosts],
        ['casePosts', plan.casePosts],
        ['amaPosts', plan.amaPosts],
        ['artifactPosts', plan.artifactPosts],
    ]) {
        for (const r of rows) {
            if (!postIds.has(up(r.fields?.ID))) {
                throw new Error(`${label} row references missing ForumPost ${r.fields?.ID}`);
            }
        }
    }

    for (const sub of plan.subscriptions) {
        const targets = [sub.fields?.ForumID, sub.fields?.RootPostID, sub.fields?.TopicTagID].filter((v) => v != null);
        if (targets.length !== 1) {
            throw new Error(`ForumSubscription ${sub.fields?.ID} must have exactly one target (CK_ForumSubscription_Target)`);
        }
    }

    return {
        valid: true,
        summary: {
            communitySpaces: plan.communitySpaces.length,
            forums: plan.forums.length,
            forumIdeaCampaigns: plan.forumIdeaCampaigns.length,
            topicTags: plan.topicTags.length,
            forumMembers: plan.forumMembers.length,
            memberProfiles: plan.memberProfiles.length,
            posts: sortedPosts.length,
            questionPosts: plan.questionPosts.length,
            answerPosts: plan.answerPosts.length,
            ideaPosts: plan.ideaPosts.length,
            casePosts: plan.casePosts.length,
            amaPosts: plan.amaPosts.length,
            artifactPosts: plan.artifactPosts.length,
            postTags: plan.postTags.length,
            reactions: plan.reactions.length,
            ideaAllocations: plan.ideaAllocations.length,
            subscriptions: plan.subscriptions.length,
        },
    };
}

/**
 * Orders ForumPosts so every parent (ParentPostID and RootPostID) appears strictly before any
 * child/reply that references it. Detects missing parent references and cycles.
 */
export function topologicallySortPosts(posts) {
    if (!Array.isArray(posts)) throw new Error('posts must be an array');
    const byId = new Map();
    const indexById = new Map();
    for (let i = 0; i < posts.length; i++) {
        const p = posts[i];
        const pid = up(p.fields?.ID);
        if (!pid) throw new Error(`Post at index ${i} is missing fields.ID`);
        if (byId.has(pid)) throw new Error(`Duplicate ForumPost ID: ${pid}`);
        byId.set(pid, p);
        indexById.set(pid, i);
    }

    const depsOf = new Map();
    const dependents = new Map();
    for (const [pid, p] of byId) {
        const deps = new Set();
        const parentId = up(p.fields?.ParentPostID);
        const rootId = up(p.fields?.RootPostID);
        if (parentId) {
            if (!byId.has(parentId)) throw new Error(`ForumPost ${pid} references missing ParentPostID ${parentId}`);
            if (parentId === pid) throw new Error(`ForumPost ${pid} cannot reference itself as ParentPostID`);
            deps.add(parentId);
        }
        if (rootId) {
            if (!byId.has(rootId)) throw new Error(`ForumPost ${pid} references missing RootPostID ${rootId}`);
            if (rootId === pid) throw new Error(`ForumPost ${pid} cannot reference itself as RootPostID`);
            deps.add(rootId);
        }
        depsOf.set(pid, deps);
        for (const d of deps) {
            if (!dependents.has(d)) dependents.set(d, []);
            dependents.get(d).push(pid);
        }
    }

    const comparePosts = (aId, bId) => {
        const a = byId.get(aId);
        const b = byId.get(bId);
        const da = a.fields?.ReplyDepth ?? 0;
        const db = b.fields?.ReplyDepth ?? 0;
        if (da !== db) return da - db;
        const ta = String(a.createdAt ?? '');
        const tb = String(b.createdAt ?? '');
        if (ta !== tb) return ta < tb ? -1 : 1;
        return indexById.get(aId) - indexById.get(bId);
    };

    const ready = [];
    for (const [pid, deps] of depsOf) {
        if (deps.size === 0) ready.push(pid);
    }
    ready.sort(comparePosts);

    const out = [];
    while (ready.length > 0) {
        const currentId = ready.shift();
        out.push(byId.get(currentId));
        const children = dependents.get(currentId) ?? [];
        let added = false;
        for (const cid of children) {
            const cDeps = depsOf.get(cid);
            cDeps.delete(currentId);
            if (cDeps.size === 0) {
                ready.push(cid);
                added = true;
            }
        }
        if (added) ready.sort(comparePosts);
    }

    if (out.length !== posts.length) {
        const remaining = [...byId.keys()].filter((pid) => depsOf.get(pid).size > 0);
        throw new Error(`Cycle detected in ForumPost parent hierarchy involving: ${remaining.slice(0, 5).join(', ')}`);
    }
    return out;
}

/**
 * Slices a community plan to at most `limit` posts (or minimal ancestor closure when a selected
 * post has parents) while preserving parent-before-child closure and pruning dependent subtypes,
 * tags, reactions, allocations, and thread subscriptions cleanly.
 */
export function sliceCommunityPlanByLimit(plan, limit) {
    if (limit == null) return plan;
    if (!Number.isInteger(limit) || limit <= 0) {
        throw new Error(`limit must be a positive integer, got ${limit}`);
    }

    const byId = new Map(plan.posts.map((p) => [up(p.fields.ID), p]));
    const ancestorsOf = (pid) => {
        const chain = [];
        const seen = new Set();
        const visit = (id) => {
            if (!id || seen.has(id)) return;
            seen.add(id);
            const node = byId.get(id);
            if (!node) return;
            visit(up(node.fields.RootPostID));
            visit(up(node.fields.ParentPostID));
            chain.push(node);
        };
        visit(pid);
        return chain;
    };

    const keptIds = new Set();
    const keptPosts = [];
    for (const p of plan.posts) {
        if (keptPosts.length >= limit) break;
        const pid = up(p.fields.ID);
        if (keptIds.has(pid)) continue;
        const needed = ancestorsOf(pid).filter((a) => !keptIds.has(up(a.fields.ID)));
        if (keptPosts.length + needed.length > limit && keptPosts.length > 0) {
            continue;
        }
        for (const a of needed) {
            const aid = up(a.fields.ID);
            if (!keptIds.has(aid)) {
                keptIds.add(aid);
                keptPosts.push(a);
            }
        }
    }

    const sortedKeptPosts = topologicallySortPosts(keptPosts);
    const keepByPostId = (rows, field = 'ID') => rows.filter((r) => keptIds.has(up(r.fields?.[field])));

    const questionPosts = keepByPostId(plan.questionPosts, 'ID').map((qp) => {
        const acc = up(qp.fields.AcceptedAnswerPostID);
        const canon = up(qp.fields.AICanonAnswerPostID);
        const hasAcc = acc && keptIds.has(acc);
        const hasCanon = canon && keptIds.has(canon);
        if (hasAcc === Boolean(acc) && hasCanon === Boolean(canon)) return qp;
        return {
            ...qp,
            fields: {
                ...qp.fields,
                AcceptedAnswerPostID: hasAcc ? qp.fields.AcceptedAnswerPostID : null,
                AICanonAnswerPostID: hasCanon ? qp.fields.AICanonAnswerPostID : null,
                ResolvedAt: hasAcc ? qp.fields.ResolvedAt : null,
            },
        };
    });

    const answerPosts = keepByPostId(plan.answerPosts, 'ID');
    const ideaPosts = keepByPostId(plan.ideaPosts, 'ID');
    const casePosts = keepByPostId(plan.casePosts, 'ID');
    const amaPosts = keepByPostId(plan.amaPosts, 'ID');
    const artifactPosts = keepByPostId(plan.artifactPosts, 'ID');
    const postTags = keepByPostId(plan.postTags, 'PostID');
    const reactions = keepByPostId(plan.reactions, 'PostID');
    const ideaAllocations = keepByPostId(plan.ideaAllocations, 'IdeaPostID');
    const subscriptions = plan.subscriptions.filter(
        (s) => s.fields?.RootPostID == null || keptIds.has(up(s.fields.RootPostID)),
    );

    return {
        ...plan,
        posts: sortedKeptPosts,
        questionPosts,
        answerPosts,
        ideaPosts,
        casePosts,
        amaPosts,
        artifactPosts,
        postTags,
        reactions,
        ideaAllocations,
        subscriptions,
        stats: {
            ...plan.stats,
            totalPosts: sortedKeptPosts.length,
            rootPosts: sortedKeptPosts.filter((p) => p.fields.RootPostID == null).length,
            replyPosts: sortedKeptPosts.filter((p) => p.fields.RootPostID != null).length,
            qaQuestionPosts: questionPosts.length,
            qaAnswerPosts: answerPosts.length,
            ideaPosts: ideaPosts.length,
            ideaAllocations: ideaAllocations.length,
            casePosts: casePosts.length,
            amaPosts: amaPosts.length,
            artifactPosts: artifactPosts.length,
            reactions: reactions.length,
            postTags: postTags.length,
            subscriptions: subscriptions.length,
        },
    };
}

/**
 * Builds the deterministic presenter seating plan across all ICF Community Spaces and Forums
 * so logging in as `--presenter <email>` reveals every Space, Forum, Q&A Canon thread,
 * Quadratic Ideation Campaign, Playbook, and Personalized Digest.
 */
export function planPresenterSeating(plan, presenterEmail = DEFAULT_PRESENTER) {
    const email = String(presenterEmail ?? '').trim().toLowerCase();
    if (!email) throw new Error('presenterEmail must be a non-empty email address');

    const tagsBySpace = new Map();
    for (const tag of plan.topicTags ?? []) {
        const sk = tag.spaceKey;
        if (!tagsBySpace.has(sk)) tagsBySpace.set(sk, []);
        tagsBySpace.get(sk).push(tag);
    }

    const collaborationSpaceSeats = (plan.communitySpaces ?? []).map((cs) => ({
        spaceId: up(cs.id),
        spaceKey: cs.key,
        role: 'admin',
        status: 'Active',
    }));

    const forumMemberships = (plan.forums ?? []).map((f) => ({
        forumId: up(f.fields.ID),
        forumKey: f.key,
        spaceId: up(f.fields.SpaceID),
        spaceKey: f.spaceKey,
        roleCode: 'forum-admin',
        status: 'Active',
    }));

    const memberProfiles = (plan.communitySpaces ?? []).map((cs) => {
        const spaceTags = (tagsBySpace.get(cs.key) ?? []).slice(0, 4).map((t) => t.fields.Slug);
        return {
            spaceId: up(cs.id),
            spaceKey: cs.key,
            bioMarkdown: `ICF Demo Presenter — active administrator and member across ${cs.key}.`,
            expertiseTagsJson: JSON.stringify(spaceTags),
            digestCadence: 'Daily Digest',
            openToPeerMentoring: true,
        };
    });

    const forumSubscriptions = (plan.forums ?? []).map((f) => ({
        forumId: up(f.fields.ID),
        forumKey: f.key,
        deliveryLevel: 'Every Post',
    }));

    return {
        presenterEmail: email,
        collaborationSpaceSeats,
        forumMemberships,
        memberProfiles,
        forumSubscriptions,
    };
}

function chunkRows(rows, size = 200) {
    const out = [];
    for (let i = 0; i < rows.length; i += size) out.push(rows.slice(i, i + size));
    return out;
}

/**
 * Generates trigger-guarded T-SQL batches to backdate Community, Collaboration (icf-member-commons),
 * and Artifact rows to their exact historical 2019-2026 plan timestamps.
 */
export function buildBackdateSqlStatements(plan, options = {}) {
    const chunkSize = options.chunkSize ?? 200;
    const includeCollabCommons = options.includeCollabCommons ?? true;
    const statements = [];
    const touchedTables = [];

    const addBatchedUpdate = (schema, table, columns, rows) => {
        if (!rows.length) return;
        const fq = `[${schema}].[${table}]`;
        touchedTables.push(fq);
        const colNames = columns.map((c) => c.col);
        const setClause = columns.map((c) => `t.[${c.col}] = v.[${c.col}]`).join(', ');
        for (const chunk of chunkRows(rows, chunkSize)) {
            const values = chunk
                .map((row) => {
                    const idLit = `'${assertUuid(row.id, `${table}.ID`)}'`;
                    const vals = columns.map((c) => {
                        const raw = row[c.prop];
                        return raw == null ? 'NULL' : `'${assertIsoTimestamp(raw, `${table}.${c.col}`)}'`;
                    });
                    return `(${idLit}, ${vals.join(', ')})`;
                })
                .join(', ');
            statements.push(
                `UPDATE t SET ${setClause} FROM ${fq} t JOIN (VALUES ${values}) v([ID], ${colNames.map((n) => `[${n}]`).join(', ')}) ON t.[ID] = v.[ID];`,
            );
        }
    };

    const forumStartedById = new Map((plan.forums ?? []).map((f) => [up(f.fields.ID), `${f.startedAt}T00:00:00Z`]));
    const spaceStartedByKey = new Map((plan.communitySpaces ?? []).map((cs) => [cs.key, `${cs.startedAt}T00:00:00Z`]));
    const postCreatedById = new Map((plan.posts ?? []).map((p) => [up(p.fields.ID), p.createdAt]));

    if (includeCollabCommons) {
        const commonsSpaces = (plan.communitySpaces ?? []).filter((cs) => cs.createCollaborationSpace);
        addBatchedUpdate(
            COLLAB_SCHEMA,
            'Space',
            [
                { col: '__mj_CreatedAt', prop: 'createdAt' },
                { col: '__mj_UpdatedAt', prop: 'updatedAt' },
                { col: 'StartedAt', prop: 'startedAt' },
            ],
            commonsSpaces.map((cs) => ({
                id: cs.id,
                createdAt: `${cs.startedAt}T00:00:00Z`,
                updatedAt: `${cs.startedAt}T00:00:00Z`,
                startedAt: `${cs.startedAt}T00:00:00Z`,
            })),
        );

        const commonsSpaceIds = commonsSpaces.map((cs) => assertUuid(cs.id, 'commonsSpace.ID'));
        if (commonsSpaceIds.length) {
            touchedTables.push(`[${COLLAB_SCHEMA}].[SpaceMember]`);
            for (const cs of commonsSpaces) {
                const ts = assertIsoTimestamp(`${cs.startedAt}T00:00:00Z`, 'commonsSpace.startedAt');
                statements.push(
                    `UPDATE [${COLLAB_SCHEMA}].[SpaceMember] SET [__mj_CreatedAt] = '${ts}', [__mj_UpdatedAt] = '${ts}' WHERE [SpaceID] = '${assertUuid(cs.id, 'SpaceID')}' AND [Status] <> 'Invited';`,
                );
            }
        }
    }

    addBatchedUpdate(
        COMMUNITY_SCHEMA,
        'CommunitySpace',
        [
            { col: '__mj_CreatedAt', prop: 'createdAt' },
            { col: '__mj_UpdatedAt', prop: 'updatedAt' },
        ],
        (plan.communitySpaces ?? []).map((cs) => ({
            id: cs.fields.ID,
            createdAt: `${cs.startedAt}T00:00:00Z`,
            updatedAt: `${cs.startedAt}T00:00:00Z`,
        })),
    );

    addBatchedUpdate(
        COMMUNITY_SCHEMA,
        'Forum',
        [
            { col: '__mj_CreatedAt', prop: 'createdAt' },
            { col: '__mj_UpdatedAt', prop: 'updatedAt' },
        ],
        (plan.forums ?? []).map((f) => ({
            id: f.fields.ID,
            createdAt: `${f.startedAt}T00:00:00Z`,
            updatedAt: `${f.startedAt}T00:00:00Z`,
        })),
    );

    addBatchedUpdate(
        COMMUNITY_SCHEMA,
        'ForumIdeaCampaign',
        [
            { col: '__mj_CreatedAt', prop: 'createdAt' },
            { col: '__mj_UpdatedAt', prop: 'updatedAt' },
        ],
        (plan.forumIdeaCampaigns ?? []).map((c) => ({
            id: c.fields.ID,
            createdAt: c.opensAt ?? forumStartedById.get(up(c.fields.ID)) ?? '2024-01-01T00:00:00Z',
            updatedAt: c.opensAt ?? forumStartedById.get(up(c.fields.ID)) ?? '2024-01-01T00:00:00Z',
        })),
    );

    addBatchedUpdate(
        COMMUNITY_SCHEMA,
        'ForumMember',
        [
            { col: '__mj_CreatedAt', prop: 'createdAt' },
            { col: '__mj_UpdatedAt', prop: 'updatedAt' },
        ],
        (plan.forumMembers ?? []).map((m) => ({
            id: m.fields.ID,
            createdAt: m.createdAt,
            updatedAt: m.createdAt,
        })),
    );

    addBatchedUpdate(
        COMMUNITY_SCHEMA,
        'ForumTopicTag',
        [
            { col: '__mj_CreatedAt', prop: 'createdAt' },
            { col: '__mj_UpdatedAt', prop: 'updatedAt' },
        ],
        (plan.topicTags ?? []).map((t) => {
            const ts = spaceStartedByKey.get(t.spaceKey) ?? '2019-01-01T00:00:00Z';
            return { id: t.fields.ID, createdAt: ts, updatedAt: ts };
        }),
    );

    addBatchedUpdate(
        COMMUNITY_SCHEMA,
        'CommunityMemberProfile',
        [
            { col: '__mj_CreatedAt', prop: 'createdAt' },
            { col: '__mj_UpdatedAt', prop: 'updatedAt' },
        ],
        (plan.memberProfiles ?? []).map((mp) => ({
            id: mp.fields.ID,
            createdAt: mp.createdAt,
            updatedAt: mp.createdAt,
        })),
    );

    addBatchedUpdate(
        COMMUNITY_SCHEMA,
        'ForumSubscription',
        [
            { col: '__mj_CreatedAt', prop: 'createdAt' },
            { col: '__mj_UpdatedAt', prop: 'updatedAt' },
        ],
        (plan.subscriptions ?? []).map((s) => ({
            id: s.fields.ID,
            createdAt: s.createdAt,
            updatedAt: s.createdAt,
        })),
    );

    addBatchedUpdate(
        COMMUNITY_SCHEMA,
        'ForumPost',
        [
            { col: '__mj_CreatedAt', prop: 'createdAt' },
            { col: '__mj_UpdatedAt', prop: 'updatedAt' },
            { col: 'LastActivityAt', prop: 'lastActivityAt' },
            { col: 'SummaryGeneratedAt', prop: 'summaryGeneratedAt' },
        ],
        (plan.posts ?? []).map((p) => ({
            id: p.fields.ID,
            createdAt: p.createdAt,
            updatedAt: p.fields.LastActivityAt ?? p.createdAt,
            lastActivityAt: p.fields.LastActivityAt ?? p.createdAt,
            summaryGeneratedAt: p.fields.SummaryGeneratedAt ?? null,
        })),
    );

    addBatchedUpdate(
        COMMUNITY_SCHEMA,
        'ForumQuestionPost',
        [
            { col: '__mj_CreatedAt', prop: 'createdAt' },
            { col: '__mj_UpdatedAt', prop: 'updatedAt' },
            { col: 'ResolvedAt', prop: 'resolvedAt' },
        ],
        (plan.questionPosts ?? []).map((qp) => {
            const cAt = postCreatedById.get(up(qp.fields.ID)) ?? '2019-01-01T00:00:00Z';
            return {
                id: qp.fields.ID,
                createdAt: cAt,
                updatedAt: qp.fields.ResolvedAt ?? cAt,
                resolvedAt: qp.fields.ResolvedAt ?? null,
            };
        }),
    );

    addBatchedUpdate(
        COMMUNITY_SCHEMA,
        'ForumAnswerPost',
        [
            { col: '__mj_CreatedAt', prop: 'createdAt' },
            { col: '__mj_UpdatedAt', prop: 'updatedAt' },
            { col: 'VerifiedAt', prop: 'verifiedAt' },
        ],
        (plan.answerPosts ?? []).map((ap) => {
            const cAt = postCreatedById.get(up(ap.fields.ID)) ?? '2019-01-01T00:00:00Z';
            return {
                id: ap.fields.ID,
                createdAt: cAt,
                updatedAt: ap.fields.VerifiedAt ?? cAt,
                verifiedAt: ap.fields.VerifiedAt ?? null,
            };
        }),
    );

    addBatchedUpdate(
        COMMUNITY_SCHEMA,
        'ForumIdeaPost',
        [
            { col: '__mj_CreatedAt', prop: 'createdAt' },
            { col: '__mj_UpdatedAt', prop: 'updatedAt' },
        ],
        (plan.ideaPosts ?? []).map((ip) => {
            const cAt = postCreatedById.get(up(ip.fields.ID)) ?? '2024-09-01T00:00:00Z';
            return { id: ip.fields.ID, createdAt: cAt, updatedAt: cAt };
        }),
    );

    addBatchedUpdate(
        COMMUNITY_SCHEMA,
        'ForumCasePost',
        [
            { col: '__mj_CreatedAt', prop: 'createdAt' },
            { col: '__mj_UpdatedAt', prop: 'updatedAt' },
        ],
        (plan.casePosts ?? []).map((cp) => {
            const cAt = postCreatedById.get(up(cp.fields.ID)) ?? '2019-01-01T00:00:00Z';
            return { id: cp.fields.ID, createdAt: cAt, updatedAt: cAt };
        }),
    );

    addBatchedUpdate(
        COMMUNITY_SCHEMA,
        'ForumAMAPost',
        [
            { col: '__mj_CreatedAt', prop: 'createdAt' },
            { col: '__mj_UpdatedAt', prop: 'updatedAt' },
        ],
        (plan.amaPosts ?? []).map((ap) => {
            const cAt = postCreatedById.get(up(ap.fields.ID)) ?? '2020-01-01T00:00:00Z';
            return { id: ap.fields.ID, createdAt: cAt, updatedAt: cAt };
        }),
    );

    const artifactPosts = plan.artifactPosts ?? [];
    addBatchedUpdate(
        COMMUNITY_SCHEMA,
        'ForumArtifactPost',
        [
            { col: '__mj_CreatedAt', prop: 'createdAt' },
            { col: '__mj_UpdatedAt', prop: 'updatedAt' },
        ],
        artifactPosts.map((ap) => {
            const cAt = postCreatedById.get(up(ap.fields.ID)) ?? '2019-01-01T00:00:00Z';
            return { id: ap.fields.ID, createdAt: cAt, updatedAt: cAt };
        }),
    );

    addBatchedUpdate(
        MJ_CORE_SCHEMA,
        'Artifact',
        [
            { col: '__mj_CreatedAt', prop: 'createdAt' },
            { col: '__mj_UpdatedAt', prop: 'updatedAt' },
        ],
        artifactPosts.map((ap) => {
            const cAt = postCreatedById.get(up(ap.fields.ID)) ?? '2019-01-01T00:00:00Z';
            return { id: ap.fields.ArtifactID, createdAt: cAt, updatedAt: cAt };
        }),
    );

    addBatchedUpdate(
        MJ_CORE_SCHEMA,
        'ArtifactVersion',
        [
            { col: '__mj_CreatedAt', prop: 'createdAt' },
            { col: '__mj_UpdatedAt', prop: 'updatedAt' },
        ],
        artifactPosts
            .filter((ap) => ap.fields.PinnedArtifactVersionID)
            .map((ap) => {
                const cAt = postCreatedById.get(up(ap.fields.ID)) ?? '2019-01-01T00:00:00Z';
                return { id: ap.fields.PinnedArtifactVersionID, createdAt: cAt, updatedAt: cAt };
            }),
    );

    addBatchedUpdate(
        COLLAB_SCHEMA,
        'SpaceItem',
        [
            { col: '__mj_CreatedAt', prop: 'createdAt' },
            { col: '__mj_UpdatedAt', prop: 'updatedAt' },
            { col: 'PromotedAt', prop: 'promotedAt' },
        ],
        artifactPosts.map((ap) => {
            const cAt = postCreatedById.get(up(ap.fields.ID)) ?? '2019-01-01T00:00:00Z';
            return { id: ap.fields.SpaceItemID, createdAt: cAt, updatedAt: cAt, promotedAt: cAt };
        }),
    );

    addBatchedUpdate(
        COMMUNITY_SCHEMA,
        'ForumPostTag',
        [
            { col: '__mj_CreatedAt', prop: 'createdAt' },
            { col: '__mj_UpdatedAt', prop: 'updatedAt' },
        ],
        (plan.postTags ?? []).map((pt) => {
            const cAt = postCreatedById.get(up(pt.fields.PostID)) ?? '2019-01-01T00:00:00Z';
            return { id: pt.fields.ID, createdAt: cAt, updatedAt: cAt };
        }),
    );

    addBatchedUpdate(
        COMMUNITY_SCHEMA,
        'ForumPostReaction',
        [
            { col: '__mj_CreatedAt', prop: 'createdAt' },
            { col: '__mj_UpdatedAt', prop: 'updatedAt' },
        ],
        (plan.reactions ?? []).map((r) => ({
            id: r.fields.ID,
            createdAt: r.createdAt,
            updatedAt: r.createdAt,
        })),
    );

    addBatchedUpdate(
        COMMUNITY_SCHEMA,
        'ForumIdeaAllocation',
        [
            { col: '__mj_CreatedAt', prop: 'createdAt' },
            { col: '__mj_UpdatedAt', prop: 'updatedAt' },
        ],
        (plan.ideaAllocations ?? []).map((al) => ({
            id: al.fields.ID,
            createdAt: al.createdAt,
            updatedAt: al.createdAt,
        })),
    );

    const uniqueTables = [...new Set(touchedTables)];
    const disableAll = uniqueTables.map((fq) => `DISABLE TRIGGER ALL ON ${fq};`).join(' ');
    const enableAll = uniqueTables.map((fq) => `ENABLE TRIGGER ALL ON ${fq};`).join(' ');
    const sql = statements.length
        ? `SET XACT_ABORT ON;\nBEGIN TRAN;\n${disableAll}\n${statements.join('\n')}\n${enableAll}\nCOMMIT;`
        : '';

    return {
        tables: uniqueTables,
        statements,
        sql,
    };
}

/** Imports a package the way the MJ host resolves it, so the loader shares the host's singletons. */
function importer(fromDir) {
    const req = createRequire(path.join(fromDir, 'package.json'));
    return (name) => import(pathToFileURL(req.resolve(name)).href);
}

async function bootstrap(mjDir) {
    const configFile = path.join(mjDir, 'mj.config.cjs');
    if (!fs.existsSync(configFile)) throw new Error(`no mj.config.cjs in ${mjDir}`);
    const fromCli = importer(path.join(mjDir, 'packages', 'MJCLI'));
    const fromSync = importer(path.join(mjDir, 'packages', 'MetadataSync'));
    await fromCli('@memberjunction/server-bootstrap-lite/mj-class-registrations');
    const { LoadDynamicPackages, CliProcessId } = await fromCli('@memberjunction/dynamic-packages');
    const config = createRequire(configFile)(configFile);
    const report = await LoadDynamicPackages({
        processId: CliProcessId('community:load'),
        tier: 'server',
        config,
        configFilePath: configFile,
        log: { info: () => {}, verbose: () => {}, warn: (m, e) => console.error(m, e instanceof Error ? e.message : e ?? '') },
    });
    const core = await fromSync('@memberjunction/core');
    const global = await fromSync('@memberjunction/global');

    for (const [pkg, entityName] of [
        ['@mj-biz-apps/collaboration-server', ENTITY.spaces],
        ['@mj-biz-apps/community-server', ENTITY.communitySpaces],
        ['@mj-biz-apps/community-server', ENTITY.forumPosts],
    ]) {
        if (!global.MJGlobal.Instance.ClassFactory.GetRegistration(core.BaseEntity, entityName)) {
            throw new Error(
                `no server class is registered for ${entityName}: add ${pkg} to dynamicPackages.server ` +
                    `in ${configFile} (loaded ${report.Loaded.length}, failed ${report.Failed.length})`,
            );
        }
    }

    const sql = (await fromSync('mssql')).default;
    const pool = new sql.ConnectionPool({
        server: process.env.DB_HOST,
        port: Number(process.env.DB_PORT ?? 1433),
        database: process.env.DB_DATABASE,
        user: process.env.DB_USERNAME,
        password: process.env.DB_PASSWORD,
        requestTimeout: 120000,
        options: {
            encrypt: false,
            trustServerCertificate: /^(y|true)$/i.test(process.env.DB_TRUST_SERVER_CERTIFICATE ?? ''),
            enableArithAbort: true,
        },
    });
    await pool.connect();
    const { SQLServerProviderConfigData, setupSQLServerClient } = await fromSync('@memberjunction/sqlserver-dataprovider');
    await setupSQLServerClient(new SQLServerProviderConfigData(pool, config.mjCoreSchema ?? MJ_CORE_SCHEMA), { mode: 'task' });
    const { UserCache } = await fromSync('@memberjunction/generic-database-provider');

    const collabServer = createRequire(path.join(mjDir, 'package.json')).resolve('@mj-biz-apps/collaboration-server');
    const collab = await importer(path.dirname(path.dirname(collabServer)))('@mj-biz-apps/collaboration-core-entities-server');
    return { core, pool, UserCache, collab };
}

function assignFields(record, fields) {
    for (const [k, v] of Object.entries(fields)) {
        if (v !== undefined) record[k] = v;
    }
}

export async function load(opts) {
    const planPath = path.resolve(opts.plan ?? DEFAULT_PLAN_PATH);
    if (!fs.existsSync(planPath)) {
        throw new Error(`community plan file not found at ${planPath}`);
    }
    const rawPlan = JSON.parse(fs.readFileSync(planPath, 'utf8'));
    validateCommunityPlanForLoader(rawPlan);
    const plan = opts.limit != null ? sliceCommunityPlanByLimit(rawPlan, opts.limit) : rawPlan;
    const presenterPlan = planPresenterSeating(plan, opts.presenter ?? DEFAULT_PRESENTER);

    if (opts.dryRun) {
        const backdate = buildBackdateSqlStatements(plan);
        const counts = {
            communitySpaces: plan.communitySpaces.length,
            forums: plan.forums.length,
            forumIdeaCampaigns: plan.forumIdeaCampaigns.length,
            forumMembers: plan.forumMembers.length,
            topicTags: plan.topicTags.length,
            memberProfiles: plan.memberProfiles.length,
            posts: plan.posts.length,
            questionPosts: plan.questionPosts.length,
            answerPosts: plan.answerPosts.length,
            ideaPosts: plan.ideaPosts.length,
            casePosts: plan.casePosts.length,
            amaPosts: plan.amaPosts.length,
            artifactPosts: plan.artifactPosts.length,
            postTags: plan.postTags.length,
            reactions: plan.reactions.length,
            ideaAllocations: plan.ideaAllocations.length,
            subscriptions: plan.subscriptions.length,
            presenterSpaces: presenterPlan.collaborationSpaceSeats.length,
            presenterForums: presenterPlan.forumMemberships.length,
            backdateStatements: backdate.statements.length,
        };
        log(
            `dry-run OK (${plan.asOf}${opts.limit ? `, limit=${opts.limit}` : ''}):`,
            `${counts.communitySpaces} spaces, ${counts.forums} forums (${counts.forumIdeaCampaigns} campaigns),`,
            `${counts.posts} posts, ${counts.reactions} reactions, ${counts.ideaAllocations} allocations,`,
            `presenter=${presenterPlan.presenterEmail} (${counts.presenterForums} forums),`,
            `${counts.backdateStatements} backdate SQL batches`,
        );
        return { dryRun: true, counts, presenterPlan, backdateStatements: backdate.statements.length };
    }

    const { core, pool, UserCache, collab } = await bootstrap(opts.mj);
    const md = new core.Metadata();
    const system = UserCache.Instance.GetSystemUser?.() ?? UserCache.Instance.UserByName('System', false);
    const run = async (entity, filter, fields, user = system) => {
        const r = await new core.RunView().RunView(
            { EntityName: entity, ExtraFilter: filter, Fields: fields, ResultType: 'simple', MaxRows: 1000000 },
            user,
        );
        if (!r.Success) throw new Error(`${entity}: ${r.ErrorMessage}`);
        return r.Results;
    };
    const save = async (record, what) => {
        if (!(await record.Save())) {
            throw new Error(`${what}: ${record.LatestResult?.CompleteMessage ?? 'save failed'}`);
        }
    };

    const usersByEmail = new Map();
    const usersById = new Map();
    for (const u of UserCache.Instance.Users) {
        usersByEmail.set(String(u.Email).toLowerCase(), u);
        usersById.set(up(u.ID), u);
    }
    const userByEmail = (email) => {
        const u = usersByEmail.get(String(email ?? '').toLowerCase());
        if (!u) throw new Error(`User ${email} is not in the database (push config/ first)`);
        return u;
    };
    const userById = (id, fallback = system) => usersById.get(up(id)) ?? fallback;

    const presenterUser = usersByEmail.get(presenterPlan.presenterEmail);
    if (!presenterUser) {
        throw new Error(`--presenter ${presenterPlan.presenterEmail}: no MJ User has that email (push config/ or clone user first)`);
    }

    // Verify metadata reference tables (ForumTypes, PostTypes, ForumRoleTypes, SpaceRoleTypes, Artifacts)
    const forumTypesById = new Map((await run(ENTITY.forumTypes, '', ['ID', 'Code'])).map((r) => [up(r.ID), r]));
    const postTypesById = new Map((await run(ENTITY.postTypes, '', ['ID', 'Code'])).map((r) => [up(r.ID), r]));
    const forumRolesByCode = new Map((await run(ENTITY.forumRoleTypes, '', ['ID', 'Code'])).map((r) => [r.Code, r]));
    const spaceRolesByCode = new Map((await run(ENTITY.spaceRoles, '', ['ID', 'Code'])).map((r) => [r.Code, r]));
    for (const f of plan.forums) {
        if (!forumTypesById.has(up(f.fields.ForumTypeID))) {
            throw new Error(`ForumTypeID ${f.fields.ForumTypeID} (${f.forumTypeCode}) is not installed in the database`);
        }
    }
    for (const p of plan.posts) {
        if (!postTypesById.has(up(p.fields.PostTypeID))) {
            throw new Error(`PostTypeID ${p.fields.PostTypeID} (${p.postTypeCode}) is not installed in the database`);
        }
    }

    const artifactsEntity = md.EntityByName(ENTITY.artifacts);
    const defaultEnvRow =
        (await run(ENTITY.environments, 'IsDefault = 1', ['ID']))[0] ??
        (await run(ENTITY.environments, '', ['ID']))[0];
    const artifactTypes = await run(ENTITY.artifactTypes, '', ['ID', 'Name']);
    const resolveArtifactTypeId = (modality) => {
        const exact = artifactTypes.find((t) => String(t.Name).toLowerCase() === String(modality).toLowerCase());
        const doc = artifactTypes.find((t) => String(t.Name).toLowerCase().includes('document'));
        return exact?.ID ?? doc?.ID ?? artifactTypes[0]?.ID ?? null;
    };

    const counts = {
        collabSpaces: 0,
        collabSeats: 0,
        communitySpaces: 0,
        forums: 0,
        forumIdeaCampaigns: 0,
        forumMembers: 0,
        topicTags: 0,
        memberProfiles: 0,
        posts: 0,
        postTags: 0,
        reactions: 0,
        ideaAllocations: 0,
        subscriptions: 0,
        presenterSeats: 0,
    };

    // 1. Collaboration Spaces + CommunitySpace IS-A
    const existingCollabSpaces = new Set((await run(ENTITY.spaces, '', ['ID'])).map((r) => up(r.ID)));
    const existingCommunitySpaces = new Map((await run(ENTITY.communitySpaces, '', ['ID', 'DefaultForumID'])).map((r) => [up(r.ID), r]));
    const spaceById = new Map(plan.communitySpaces.map((cs) => [up(cs.id), cs]));

    for (const cs of plan.communitySpaces) {
        const spaceId = up(cs.id);
        const ownerUser = userByEmail(cs.ownerEmail);

        if (cs.createCollaborationSpace && !existingCollabSpaces.has(spaceId)) {
            const spFields = cs.collaborationSpace.fields;
            const spaceRec = await md.GetEntityObject(ENTITY.spaces, ownerUser);
            spaceRec.NewRecord();
            assignFields(spaceRec, {
                ID: spFields.ID,
                SpaceTypeID: spFields.SpaceTypeID,
                ParentID: spFields.ParentID,
                Name: spFields.Name,
                Description: spFields.Description,
                OwnerID: ownerUser.ID,
                InheritsMembership: spFields.InheritsMembership,
                AgentRetrieval: spFields.AgentRetrieval,
                StartedAt: spFields.StartedAt ? new Date(spFields.StartedAt) : new Date(),
                PlannedCloseAt: spFields.PlannedCloseAt ? new Date(spFields.PlannedCloseAt) : null,
                IconClass: spFields.IconClass,
                Color: spFields.Color,
            });
            await save(spaceRec, `collaboration space ${cs.key}`);
            existingCollabSpaces.add(spaceId);
            counts.collabSpaces++;

            const existingSeats = new Set(
                (await run(ENTITY.spaceMembers, `SpaceID = '${spaceId}'`, ['UserID'])).map((r) => up(r.UserID)),
            );
            const ownerSeat = cs.collaborationSpace.seats.find((x) => x.role === 'owner');
            const orderedSeats = ownerSeat
                ? [ownerSeat, ...cs.collaborationSpace.seats.filter((x) => x !== ownerSeat)]
                : cs.collaborationSpace.seats;
            for (const seatDef of orderedSeats) {
                const seatUser = userByEmail(seatDef.email);
                if (existingSeats.has(up(seatUser.ID))) continue;
                const roleRow = spaceRolesByCode.get(seatDef.role);
                if (!roleRow) throw new Error(`SpaceRoleType ${seatDef.role} not found`);
                const sm = await md.GetEntityObject(ENTITY.spaceMembers, ownerUser);
                sm.NewRecord();
                sm.SpaceID = cs.id;
                sm.UserID = seatUser.ID;
                sm.SpaceRoleTypeID = roleRow.ID;
                sm.Band = 'Shared';
                sm.Status = 'Active';
                if (seatDef.personId) sm.PersonID = seatDef.personId;
                await save(sm, `space seat ${seatDef.email} on ${cs.key}`);
                existingSeats.add(up(seatUser.ID));
                counts.collabSeats++;
            }
        }

        if (!existingCommunitySpaces.has(spaceId)) {
            const csRec = await md.GetEntityObject(ENTITY.communitySpaces, ownerUser);
            csRec.NewRecord();
            const attached = await csRec.AttachToParent(core.CompositeKey.FromID(cs.id));
            if (!attached) {
                throw new Error(`Collaboration Space ${cs.id} (${cs.key}) does not exist — run load-spaces.mjs first`);
            }
            assignFields(csRec, {
                Slug: cs.fields.Slug,
                CommunityKind: cs.fields.CommunityKind,
                CommunityKindDetails: cs.fields.CommunityKindDetails,
                AnonymousReadMode: cs.fields.AnonymousReadMode,
                AskFirstEnabled: cs.fields.AskFirstEnabled,
                DefaultDigestCadence: cs.fields.DefaultDigestCadence,
                BannerImageURL: cs.fields.BannerImageURL,
                WelcomeMarkdown: cs.fields.WelcomeMarkdown,
                DefaultForumID: null,
            });
            await save(csRec, `community space ${cs.key}`);
            existingCommunitySpaces.set(spaceId, { ID: cs.id, DefaultForumID: null });
            counts.communitySpaces++;
        }
    }
    log(`spaces: ${counts.collabSpaces} collab, ${counts.communitySpaces} community`);

    // 2. Forums, ForumIdeaCampaign IS-A, CommunitySpace.DefaultForumID, ForumMembers, ForumTopicTags, CommunityMemberProfiles
    const existingForums = new Set((await run(ENTITY.forums, '', ['ID'])).map((r) => up(r.ID)));
    const existingCampaigns = new Set((await run(ENTITY.forumIdeaCampaigns, '', ['ID'])).map((r) => up(r.ID)));
    const campaignByForumId = new Map(plan.forumIdeaCampaigns.map((c) => [up(c.fields.ID), c]));
    const forumById = new Map(plan.forums.map((f) => [up(f.fields.ID), f]));

    for (const f of plan.forums) {
        const fid = up(f.fields.ID);
        const ownerUser = userByEmail(spaceById.get(up(f.fields.SpaceID)).ownerEmail);
        const camp = campaignByForumId.get(fid);
        if (camp) {
            if (!existingCampaigns.has(fid)) {
                const cRec = await md.GetEntityObject(ENTITY.forumIdeaCampaigns, ownerUser);
                cRec.NewRecord();
                if (existingForums.has(fid)) {
                    await cRec.AttachToParent(core.CompositeKey.FromID(f.fields.ID));
                } else {
                    assignFields(cRec, { ...f.fields, ID: f.fields.ID });
                }
                assignFields(cRec, {
                    DefaultBudgetPoints: camp.fields.DefaultBudgetPoints,
                    AllocationMode: camp.fields.AllocationMode,
                    MaxPointsPerIdea: camp.fields.MaxPointsPerIdea,
                    SubmissionsCloseAt: camp.fields.SubmissionsCloseAt ? new Date(camp.fields.SubmissionsCloseAt) : null,
                    VotingClosesAt: null, // pinned after allocations are saved
                });
                await save(cRec, `forum idea campaign ${f.key}`);
                existingForums.add(fid);
                existingCampaigns.add(fid);
                counts.forums++;
                counts.forumIdeaCampaigns++;
            }
        } else if (!existingForums.has(fid)) {
            const fRec = await md.GetEntityObject(ENTITY.forums, ownerUser);
            fRec.NewRecord();
            assignFields(fRec, f.fields);
            await save(fRec, `forum ${f.key}`);
            existingForums.add(fid);
            counts.forums++;
        }
    }

    for (const cs of plan.communitySpaces) {
        const existing = existingCommunitySpaces.get(up(cs.id));
        if (cs.fields.DefaultForumID && (!existing?.DefaultForumID || !sameId(existing.DefaultForumID, cs.fields.DefaultForumID))) {
            const ownerUser = userByEmail(cs.ownerEmail);
            const csRec = await md.GetEntityObject(ENTITY.communitySpaces, ownerUser);
            if (await csRec.Load(cs.id)) {
                csRec.DefaultForumID = cs.fields.DefaultForumID;
                await save(csRec, `default forum on ${cs.key}`);
            }
        }
    }

    const existingForumMembers = new Map(
        (await run(ENTITY.forumMembers, '', ['ID', 'ForumID', 'UserID', 'ForumRoleTypeID', 'Status'])).map((r) => [
            `${up(r.ForumID)}:${up(r.UserID)}`,
            r,
        ]),
    );
    const moderatorByForumId = new Map();
    const recordMod = (forumId, userObj, roleCode) => {
        if ((roleCode === 'forum-admin' || roleCode === 'moderator') && !moderatorByForumId.has(up(forumId))) {
            moderatorByForumId.set(up(forumId), userObj);
        }
    };
    for (const fm of plan.forumMembers) {
        const key = `${up(fm.fields.ForumID)}:${up(fm.fields.UserID)}`;
        const u = userById(fm.fields.UserID);
        recordMod(fm.fields.ForumID, u, fm.roleCode);
        if (existingForumMembers.has(key)) continue;
        const ownerUser = userByEmail(spaceById.get(up(forumById.get(up(fm.fields.ForumID)).fields.SpaceID)).ownerEmail);
        const rec = await md.GetEntityObject(ENTITY.forumMembers, ownerUser);
        rec.NewRecord();
        assignFields(rec, fm.fields);
        await save(rec, `forum member ${fm.userEmail} on ${fm.forumKey}`);
        existingForumMembers.set(key, fm.fields);
        counts.forumMembers++;
    }

    const existingTags = new Set((await run(ENTITY.forumTopicTags, '', ['ID'])).map((r) => up(r.ID)));
    for (const tag of plan.topicTags) {
        if (existingTags.has(up(tag.fields.ID))) continue;
        const ownerUser = userByEmail(spaceById.get(up(tag.fields.SpaceID)).ownerEmail);
        const rec = await md.GetEntityObject(ENTITY.forumTopicTags, ownerUser);
        rec.NewRecord();
        assignFields(rec, { ...tag.fields, PostCount: 0 });
        await save(rec, `topic tag ${tag.key}`);
        existingTags.add(up(tag.fields.ID));
        counts.topicTags++;
    }

    const existingProfiles = new Map(
        (await run(ENTITY.communityMemberProfiles, '', ['ID', 'SpaceID', 'UserID'])).map((r) => [
            `${up(r.SpaceID)}:${up(r.UserID)}`,
            r,
        ]),
    );
    for (const mp of plan.memberProfiles) {
        const key = `${up(mp.fields.SpaceID)}:${up(mp.fields.UserID)}`;
        if (existingProfiles.has(key)) continue;
        const rec = await md.GetEntityObject(ENTITY.communityMemberProfiles, userById(mp.fields.UserID));
        rec.NewRecord();
        assignFields(rec, mp.fields);
        await save(rec, `member profile ${mp.userEmail} in ${mp.spaceKey}`);
        existingProfiles.set(key, mp.fields);
        counts.memberProfiles++;
    }

    // 3. Seat --presenter across all Community Spaces and Forums before content loads
    const adminSpaceRoleId = spaceRolesByCode.get('admin')?.ID ?? spaceRolesByCode.get('member')?.ID;
    const forumAdminRoleId = forumRolesByCode.get('forum-admin')?.ID;
    for (const seatSpec of presenterPlan.collaborationSpaceSeats) {
        const spaceMembers = new Set(
            (await run(ENTITY.spaceMembers, `SpaceID = '${seatSpec.spaceId}'`, ['UserID'])).map((r) => up(r.UserID)),
        );
        if (spaceMembers.has(up(presenterUser.ID)) || !adminSpaceRoleId) continue;
        const ownerUser = userByEmail(spaceById.get(seatSpec.spaceId).ownerEmail);
        const sm = await md.GetEntityObject(ENTITY.spaceMembers, ownerUser);
        sm.NewRecord();
        sm.SpaceID = seatSpec.spaceId;
        sm.UserID = presenterUser.ID;
        sm.SpaceRoleTypeID = adminSpaceRoleId;
        sm.Band = 'Shared';
        sm.Status = 'Active';
        await save(sm, `presenter space seat on ${seatSpec.spaceKey}`);
        counts.presenterSeats++;
    }
    for (const fmSpec of presenterPlan.forumMemberships) {
        const key = `${fmSpec.forumId}:${up(presenterUser.ID)}`;
        if (existingForumMembers.has(key) || !forumAdminRoleId) continue;
        const ownerUser = userByEmail(spaceById.get(fmSpec.spaceId).ownerEmail);
        const rec = await md.GetEntityObject(ENTITY.forumMembers, ownerUser);
        rec.NewRecord();
        rec.ForumID = fmSpec.forumId;
        rec.UserID = presenterUser.ID;
        rec.ForumRoleTypeID = forumAdminRoleId;
        rec.Status = 'Active';
        await save(rec, `presenter forum-admin on ${fmSpec.forumKey}`);
        existingForumMembers.set(key, { ForumID: fmSpec.forumId, UserID: presenterUser.ID });
        counts.presenterSeats++;
    }
    for (const mpSpec of presenterPlan.memberProfiles) {
        const key = `${mpSpec.spaceId}:${up(presenterUser.ID)}`;
        if (existingProfiles.has(key)) continue;
        const rec = await md.GetEntityObject(ENTITY.communityMemberProfiles, presenterUser);
        rec.NewRecord();
        rec.SpaceID = mpSpec.spaceId;
        rec.UserID = presenterUser.ID;
        rec.BioMarkdown = mpSpec.bioMarkdown;
        rec.ExpertiseTagsJSON = mpSpec.expertiseTagsJson;
        rec.DigestCadence = mpSpec.digestCadence;
        rec.OpenToPeerMentoring = mpSpec.openToPeerMentoring;
        await save(rec, `presenter profile in ${mpSpec.spaceKey}`);
        existingProfiles.set(key, { SpaceID: mpSpec.spaceId, UserID: presenterUser.ID });
    }
    log(`forums: ${counts.forums}, members: ${counts.forumMembers}, tags: ${counts.topicTags}, profiles: ${counts.memberProfiles}`);

    // 4. ForumPosts + IS-A subtypes in parent-before-child topological order
    const questionById = new Map(plan.questionPosts.map((x) => [up(x.fields.ID), x]));
    const answerById = new Map(plan.answerPosts.map((x) => [up(x.fields.ID), x]));
    const ideaById = new Map(plan.ideaPosts.map((x) => [up(x.fields.ID), x]));
    const caseById = new Map(plan.casePosts.map((x) => [up(x.fields.ID), x]));
    const amaById = new Map(plan.amaPosts.map((x) => [up(x.fields.ID), x]));
    const artifactById = new Map(plan.artifactPosts.map((x) => [up(x.fields.ID), x]));

    const existingPosts = new Set((await run(ENTITY.forumPosts, '', ['ID'])).map((r) => up(r.ID)));
    const existingArtifacts = new Set((await run(ENTITY.artifacts, '', ['ID'])).map((r) => up(r.ID)));
    const existingArtifactVersions = new Set((await run(ENTITY.artifactVersions, '', ['ID'])).map((r) => up(r.ID)));
    const existingSpaceItems = new Set((await run(ENTITY.spaceItems, '', ['ID'])).map((r) => up(r.ID)));

    const sortedPosts = topologicallySortPosts(plan.posts);
    const modUserForForum = (forumId) => {
        const mod = moderatorByForumId.get(up(forumId));
        if (mod) return mod;
        const f = forumById.get(up(forumId));
        return userByEmail(spaceById.get(up(f.fields.SpaceID)).ownerEmail);
    };

    for (const p of sortedPosts) {
        const pid = up(p.fields.ID);
        if (existingPosts.has(pid)) continue;
        const authorUser = userById(p.fields.AuthorUserID);
        const modUser = modUserForForum(p.fields.ForumID);
        const fmInfo = existingForumMembers.get(`${up(p.fields.ForumID)}:${up(authorUser.ID)}`);
        const authorIsMod = fmInfo && (sameId(fmInfo.ForumRoleTypeID, forumAdminRoleId) || sameId(fmInfo.ForumRoleTypeID, forumRolesByCode.get('moderator')?.ID));

        const baseFields = {
            ...p.fields,
            Status: p.fields.Status === 'Answered' ? 'Published' : p.fields.Status,
            IsPinned: authorIsMod ? p.fields.IsPinned : false,
            IsLocked: authorIsMod ? p.fields.IsLocked : false,
            SummaryGeneratedAt: p.fields.SummaryGeneratedAt ? new Date(p.fields.SummaryGeneratedAt) : null,
            LastActivityAt: p.fields.LastActivityAt ? new Date(p.fields.LastActivityAt) : new Date(p.createdAt),
        };

        let targetEntity = ENTITY.forumPosts;
        let subtypeFields = {};
        if (questionById.has(pid)) {
            targetEntity = ENTITY.forumQuestionPosts;
            const qMeta = questionById.get(pid).fields;
            subtypeFields = {
                AcceptedAnswerPostID: null,
                AICanonAnswerPostID: null,
                BountyPoints: qMeta.BountyPoints,
                ResolvedAt: null,
                DeflectionCount: qMeta.DeflectionCount,
            };
        } else if (answerById.has(pid)) {
            targetEntity = ENTITY.forumAnswerPosts;
            const aMeta = answerById.get(pid).fields;
            subtypeFields = {
                QuestionPostID: aMeta.QuestionPostID,
                IsAcceptedByAuthor: false,
                IsVerifiedByModerator: false,
                VerifiedByUserID: null,
                VerifiedAt: null,
                AIEpistemicStatus: 'Novel Insight',
                AIConfidenceScore: aMeta.AIConfidenceScore,
                AIRationaleMarkdown: aMeta.AIRationaleMarkdown,
                FreshnessReviewDueAt: null,
            };
        } else if (ideaById.has(pid)) {
            targetEntity = ENTITY.forumIdeaPosts;
            const iMeta = ideaById.get(pid).fields;
            subtypeFields = {
                IdeaStatus: iMeta.IdeaStatus,
                TotalPointsAllocated: 0,
                EffectiveQuadraticVotes: 0,
                UniqueBackerCount: 0,
                TargetReleaseOrQuarter: iMeta.TargetReleaseOrQuarter,
                StatusRationaleMarkdown: iMeta.StatusRationaleMarkdown,
                MergedIntoIdeaPostID: iMeta.MergedIntoIdeaPostID,
            };
        } else if (caseById.has(pid)) {
            targetEntity = ENTITY.forumCasePosts;
            subtypeFields = { ...caseById.get(pid).fields };
        } else if (amaById.has(pid)) {
            targetEntity = ENTITY.forumAMAPosts;
            const ama = amaById.get(pid).fields;
            subtypeFields = {
                HostUserID: ama.HostUserID,
                ScheduledStartAt: new Date(ama.ScheduledStartAt),
                ScheduledEndAt: new Date(ama.ScheduledEndAt),
                QuestionsOpenAt: new Date(ama.QuestionsOpenAt),
                IsLiveNow: ama.IsLiveNow,
                RecordingURL: ama.RecordingURL,
                RecapMarkdown: ama.RecapMarkdown,
            };
        } else if (artifactById.has(pid)) {
            targetEntity = ENTITY.forumArtifactPosts;
            const ap = artifactById.get(pid);
            const artId = up(ap.fields.ArtifactID);
            const verId = up(ap.fields.PinnedArtifactVersionID);
            const siId = up(ap.fields.SpaceItemID);
            const f = forumById.get(up(p.fields.ForumID));
            const spaceOwner = userByEmail(spaceById.get(up(f.fields.SpaceID)).ownerEmail);
            if (!existingArtifacts.has(artId)) {
                const art = await md.GetEntityObject(ENTITY.artifacts, spaceOwner);
                art.NewRecord();
                art.ID = ap.fields.ArtifactID;
                art.EnvironmentID = defaultEnvRow.ID;
                art.Name = String(ap.artifactName).slice(0, 255);
                art.Description = String(ap.artifactName);
                art.TypeID = resolveArtifactTypeId(ap.artifactType);
                art.UserID = spaceOwner.ID;
                art.Visibility = 'Always';
                await save(art, `artifact ${artId}`);
                existingArtifacts.add(artId);
            }
            if (verId && !existingArtifactVersions.has(verId)) {
                const ver = await md.GetEntityObject(ENTITY.artifactVersions, spaceOwner);
                ver.NewRecord();
                ver.ID = ap.fields.PinnedArtifactVersionID;
                ver.ArtifactID = ap.fields.ArtifactID;
                ver.VersionNumber = 1;
                ver.Name = String(ap.artifactName).slice(0, 255);
                ver.Content = ap.artifactContent ?? '';
                ver.ContentHash = crypto.createHash('sha256').update(String(ap.artifactContent ?? '')).digest('hex');
                ver.ContentMode = 'Text';
                ver.UserID = spaceOwner.ID;
                await save(ver, `artifact version ${verId}`);
                existingArtifactVersions.add(verId);
            }
            if (!existingSpaceItems.has(siId)) {
                const item = await md.GetEntityObject(ENTITY.spaceItems, spaceOwner);
                collab.vouchStoredFile?.(item);
                item.NewRecord();
                item.ID = ap.fields.SpaceItemID;
                item.SpaceID = f.fields.SpaceID;
                item.EntityID = artifactsEntity.ID;
                item.RecordID = ap.fields.ArtifactID;
                item.Band = 'Shared';
                await save(item, `space item ${siId}`);
                existingSpaceItems.add(siId);
            }
            subtypeFields = {
                ArtifactID: ap.fields.ArtifactID,
                PinnedArtifactVersionID: ap.fields.PinnedArtifactVersionID,
                SpaceItemID: ap.fields.SpaceItemID,
                ArtifactModality: ap.fields.ArtifactModality,
                CollaborationMode: ap.fields.CollaborationMode,
                ShowInlinePreview: ap.fields.ShowInlinePreview,
            };
        }

        const rec = await md.GetEntityObject(targetEntity, authorUser);
        rec.NewRecord();
        assignFields(rec, { ...baseFields, ...subtypeFields });
        await save(rec, `post ${p.fields.ID} (${p.postTypeCode})`);
        existingPosts.add(pid);
        counts.posts++;

        if (
            (!authorIsMod && (p.fields.IsPinned || p.fields.IsLocked)) ||
            (p.fields.Status !== 'Answered' && rec.Status !== p.fields.Status)
        ) {
            const modRec = await md.GetEntityObject(ENTITY.forumPosts, modUser);
            if (await modRec.Load(p.fields.ID)) {
                modRec.IsPinned = p.fields.IsPinned;
                modRec.IsLocked = p.fields.IsLocked;
                if (p.fields.Status !== 'Answered') modRec.Status = p.fields.Status;
                await save(modRec, `moderator finalize post ${p.fields.ID}`);
            }
        }
    }

    // 4b. Finalize Q&A Canon verification & question resolution after replies exist
    for (const ans of plan.answerPosts) {
        const f = ans.fields;
        if (!f.IsAcceptedByAuthor && !f.IsVerifiedByModerator && f.AIEpistemicStatus !== 'Canon Verified' && f.AIEpistemicStatus !== 'Partially Outdated') {
            continue;
        }
        const postRow = sortedPosts.find((p) => sameId(p.fields.ID, f.ID));
        const modUser = ans.verifiedByEmail ? userByEmail(ans.verifiedByEmail) : modUserForForum(postRow.fields.ForumID);
        const rec = await md.GetEntityObject(ENTITY.forumAnswerPosts, modUser);
        if (await rec.Load(f.ID)) {
            const needsUpdate =
                rec.IsAcceptedByAuthor !== f.IsAcceptedByAuthor ||
                rec.IsVerifiedByModerator !== f.IsVerifiedByModerator ||
                rec.AIEpistemicStatus !== f.AIEpistemicStatus;
            if (needsUpdate) {
                rec.IsAcceptedByAuthor = f.IsAcceptedByAuthor;
                rec.IsVerifiedByModerator = f.IsVerifiedByModerator;
                rec.VerifiedByUserID = f.VerifiedByUserID;
                rec.VerifiedAt = f.VerifiedAt ? new Date(f.VerifiedAt) : null;
                rec.AIEpistemicStatus = f.AIEpistemicStatus;
                rec.AIRationaleMarkdown = f.AIRationaleMarkdown;
                rec.FreshnessReviewDueAt = f.FreshnessReviewDueAt ? new Date(f.FreshnessReviewDueAt) : null;
                await save(rec, `verify canon answer ${f.ID}`);
            }
        }
    }
    for (const qp of plan.questionPosts) {
        const f = qp.fields;
        if (!f.AcceptedAnswerPostID && !f.AICanonAnswerPostID) continue;
        const postRow = sortedPosts.find((p) => sameId(p.fields.ID, f.ID));
        const modUser = modUserForForum(postRow.fields.ForumID);
        const rec = await md.GetEntityObject(ENTITY.forumQuestionPosts, modUser);
        if (await rec.Load(f.ID)) {
            if (!sameId(rec.AcceptedAnswerPostID, f.AcceptedAnswerPostID) || !sameId(rec.AICanonAnswerPostID, f.AICanonAnswerPostID)) {
                rec.AcceptedAnswerPostID = f.AcceptedAnswerPostID;
                rec.AICanonAnswerPostID = f.AICanonAnswerPostID;
                rec.ResolvedAt = f.ResolvedAt ? new Date(f.ResolvedAt) : null;
                if (postRow.fields.Status === 'Answered') rec.Status = 'Answered';
                await save(rec, `resolve question ${f.ID}`);
            }
        }
    }
    log(`posts loaded: ${counts.posts}`);

    // 5. ForumPostTags, ForumPostReactions, ForumIdeaAllocations, ForumSubscriptions
    const existingPostTags = new Set(
        (await run(ENTITY.forumPostTags, '', ['PostID', 'TopicTagID'])).map((r) => `${up(r.PostID)}:${up(r.TopicTagID)}`),
    );
    for (const pt of plan.postTags) {
        const k = `${up(pt.fields.PostID)}:${up(pt.fields.TopicTagID)}`;
        if (existingPostTags.has(k)) continue;
        const rec = await md.GetEntityObject(ENTITY.forumPostTags, system);
        rec.NewRecord();
        assignFields(rec, pt.fields);
        await save(rec, `post tag ${pt.fields.ID}`);
        existingPostTags.add(k);
        counts.postTags++;
    }

    const existingReactions = new Set(
        (await run(ENTITY.forumPostReactions, '', ['PostID', 'UserID', 'ReactionKind'])).map(
            (r) => `${up(r.PostID)}:${up(r.UserID)}:${r.ReactionKind}`,
        ),
    );
    for (const r of plan.reactions) {
        const k = `${up(r.fields.PostID)}:${up(r.fields.UserID)}:${r.fields.ReactionKind}`;
        if (existingReactions.has(k)) continue;
        const rec = await md.GetEntityObject(ENTITY.forumPostReactions, userById(r.fields.UserID));
        rec.NewRecord();
        assignFields(rec, r.fields);
        await save(rec, `reaction ${r.fields.ID}`);
        existingReactions.add(k);
        counts.reactions++;
    }

    const existingAllocations = new Set(
        (await run(ENTITY.forumIdeaAllocations, '', ['IdeaPostID', 'UserID'])).map(
            (r) => `${up(r.IdeaPostID)}:${up(r.UserID)}`,
        ),
    );
    for (const al of plan.ideaAllocations) {
        const k = `${up(al.fields.IdeaPostID)}:${up(al.fields.UserID)}`;
        if (existingAllocations.has(k)) continue;
        const rec = await md.GetEntityObject(ENTITY.forumIdeaAllocations, userById(al.fields.UserID));
        rec.NewRecord();
        assignFields(rec, al.fields);
        await save(rec, `idea allocation ${al.fields.ID}`);
        existingAllocations.add(k);
        counts.ideaAllocations++;
    }

    for (const camp of plan.forumIdeaCampaigns) {
        if (!camp.fields.VotingClosesAt) continue;
        const ownerUser = userByEmail(spaceById.get(up(forumById.get(up(camp.fields.ID)).fields.SpaceID)).ownerEmail);
        const rec = await md.GetEntityObject(ENTITY.forumIdeaCampaigns, ownerUser);
        if (await rec.Load(camp.fields.ID)) {
            rec.VotingClosesAt = new Date(camp.fields.VotingClosesAt);
            await save(rec, `campaign voting close ${camp.campaignKey}`);
        }
    }

    const existingSubs = new Set(
        (await run(ENTITY.forumSubscriptions, '', ['UserID', 'ForumID', 'RootPostID', 'TopicTagID'])).map(
            (r) => `${up(r.UserID)}:${up(r.ForumID) ?? ''}:${up(r.RootPostID) ?? ''}:${up(r.TopicTagID) ?? ''}`,
        ),
    );
    for (const sub of plan.subscriptions) {
        const k = `${up(sub.fields.UserID)}:${up(sub.fields.ForumID) ?? ''}:${up(sub.fields.RootPostID) ?? ''}:${up(sub.fields.TopicTagID) ?? ''}`;
        if (existingSubs.has(k)) continue;
        const rec = await md.GetEntityObject(ENTITY.forumSubscriptions, userById(sub.fields.UserID));
        rec.NewRecord();
        assignFields(rec, sub.fields);
        await save(rec, `subscription ${sub.fields.ID}`);
        existingSubs.add(k);
        counts.subscriptions++;
    }
    for (const subSpec of presenterPlan.forumSubscriptions) {
        const k = `${up(presenterUser.ID)}:${subSpec.forumId}::`;
        if (existingSubs.has(k)) continue;
        const rec = await md.GetEntityObject(ENTITY.forumSubscriptions, presenterUser);
        rec.NewRecord();
        rec.UserID = presenterUser.ID;
        rec.ForumID = subSpec.forumId;
        rec.DeliveryLevel = subSpec.deliveryLevel;
        await save(rec, `presenter subscription on ${subSpec.forumKey}`);
        existingSubs.add(k);
        counts.subscriptions++;
    }

    // 6. Restore root post ViewCount / SummaryMarkdown / ReputationScore & backdate historical timestamps
    for (const p of sortedPosts) {
        if (p.fields.RootPostID != null) continue;
        if (p.fields.ViewCount > 0 || p.fields.SummaryMarkdown != null) {
            const rec = await md.GetEntityObject(ENTITY.forumPosts, modUserForForum(p.fields.ForumID));
            if (await rec.Load(p.fields.ID)) {
                rec.ViewCount = p.fields.ViewCount;
                if (p.fields.SummaryMarkdown) {
                    rec.SummaryMarkdown = p.fields.SummaryMarkdown;
                    rec.SummaryGeneratedAt = p.fields.SummaryGeneratedAt ? new Date(p.fields.SummaryGeneratedAt) : null;
                    rec.SummaryReplyWatermark = p.fields.SummaryReplyWatermark;
                }
                await save(rec, `rollup fields on ${p.fields.ID}`);
            }
        }
    }
    for (const mp of plan.memberProfiles) {
        const rec = await md.GetEntityObject(ENTITY.communityMemberProfiles, userById(mp.fields.UserID));
        if (await rec.Load(mp.fields.ID)) {
            if (rec.ReputationScore !== mp.fields.ReputationScore) {
                rec.ReputationScore = mp.fields.ReputationScore;
                await save(rec, `reputation score ${mp.fields.ID}`);
            }
        }
    }

    const backdate = buildBackdateSqlStatements(plan);
    if (backdate.sql) {
        await pool.request().query(backdate.sql);
        log(`backdated ${backdate.tables.length} tables across ${backdate.statements.length} SQL batches`);
    }

    await pool.close();
    return { dryRun: false, counts, presenterPlan, backdateStatements: backdate.statements.length };
}

const isMain = () => {
    if (!process.argv[1]) return false;
    try {
        return import.meta.url === pathToFileURL(fs.realpathSync(process.argv[1])).href;
    } catch {
        return import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href;
    }
};

if (isMain()) {
    load(parseArgs(process.argv.slice(2)))
        .then((res) => {
            log('done', JSON.stringify(res.counts));
            process.exit(0);
        })
        .catch((err) => {
            console.error(err instanceof Error ? err.stack : err);
            process.exit(1);
        });
}
