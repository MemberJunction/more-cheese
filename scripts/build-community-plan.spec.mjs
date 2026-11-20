/**
 * Specs for build-community-plan.mjs — deterministic ICF BizApps Community dataset,
 * referential & era-eligibility invariants, 100-point quadratic wallet compliance,
 * append-only 2026-11 monthly growth, and --check verification.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import {
    BASELINE_AS_OF,
    BASELINE_MONTH,
    PLAN_FILE,
    PRESENTER,
    buildCommunityPlan,
    loadCommunityWorld,
    main as buildCommunityPlanMain,
    renderCommunityPlan,
} from './build-community-plan.mjs';

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SCRIPT = path.join(REPO_ROOT, 'scripts', 'build-community-plan.mjs');
const UUID_RE = /^[0-9A-F]{8}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{12}$/i;

let cachedWorld;
let cachedBaselinePlan;
function getBaseline() {
    if (!cachedWorld) cachedWorld = loadCommunityWorld(REPO_ROOT);
    if (!cachedBaselinePlan) cachedBaselinePlan = buildCommunityPlan(cachedWorld, { throughMonth: BASELINE_MONTH });
    return { world: cachedWorld, plan: cachedBaselinePlan };
}

test('AC-2.1: baseline plan meets every scale, ForumType, Q&A canon, synthesis, and ideation target across 94 months', () => {
    const { world, plan } = getBaseline();
    const s = plan.stats;

    assert.equal(plan.asOf, BASELINE_AS_OF);
    assert.equal(plan.throughMonth, BASELINE_MONTH);
    assert.equal(plan.cycles.length, 94);
    assert.equal(plan.cycles[0], '2019-01');
    assert.equal(plan.cycles[plan.cycles.length - 1], '2026-10');

    // Scale & richness floors
    assert.ok(s.communitySpaces >= 9, `expected >= 9 spaces, got ${s.communitySpaces}`);
    assert.ok(s.forums >= 29, `expected >= 29 forums, got ${s.forums}`);
    assert.ok(s.uniqueTopicSlugs >= 52, `expected >= 52 topic tag slugs, got ${s.uniqueTopicSlugs}`);
    assert.ok(s.uniqueProfileUsers >= 260, `expected >= 260 unique profile users, got ${s.uniqueProfileUsers}`);
    assert.ok(s.memberProfiles >= 260, `expected >= 260 profiles, got ${s.memberProfiles}`);
    assert.ok(s.totalPosts >= 640, `expected >= 640 posts, got ${s.totalPosts}`);
    assert.ok(s.rootPosts >= 175, `expected >= 175 roots, got ${s.rootPosts}`);
    assert.ok(s.replyPosts >= 465, `expected >= 465 replies, got ${s.replyPosts}`);
    assert.ok(s.qaQuestionPosts >= 40, `expected >= 40 Q&A threads, got ${s.qaQuestionPosts}`);
    assert.ok(s.verifiedCanonAnswers >= 35, `expected >= 35 verified canon answers, got ${s.verifiedCanonAnswers}`);
    assert.ok(s.ideaAllocations >= 200, `expected >= 200 idea allocations, got ${s.ideaAllocations}`);
    assert.ok(s.reactions >= 950, `expected >= 950 reactions, got ${s.reactions}`);
    assert.ok(s.postTags >= 500, `expected >= 500 post tags, got ${s.postTags}`);
    assert.ok(s.subscriptions >= 380, `expected >= 380 subscriptions, got ${s.subscriptions}`);
    assert.ok(s.forumMembers >= 50, `expected >= 50 forumMembers, got ${s.forumMembers}`);
    assert.ok(s.synthesizedThreads >= 30, `expected >= 30 synthesized threads, got ${s.synthesizedThreads}`);

    // All 6 ForumTypes represented with exact seeded UUIDs
    const expectedForumTypeIds = new Set(Object.values(world.rules.metadataRefs.forumTypes).map((ft) => ft.id.toUpperCase()));
    const seenForumTypeIds = new Set(plan.forums.map((f) => f.fields.ForumTypeID.toUpperCase()));
    assert.deepEqual(seenForumTypeIds, expectedForumTypeIds);

    // Every year 2019..2026 has posts, and every month 2019-01..2026-10 has >= 1 root
    const rootsByCycle = new Map();
    for (const p of plan.posts) {
        if (p.fields.RootPostID === null) {
            rootsByCycle.set(p.cycle, (rootsByCycle.get(p.cycle) ?? 0) + 1);
        }
    }
    for (const ym of plan.cycles) {
        assert.ok((rootsByCycle.get(ym) ?? 0) >= 1, `missing root posts in month ${ym}`);
    }
    for (let y = 2019; y <= 2026; y++) {
        assert.ok((s.postsByYear[String(y)] ?? 0) > 0, `missing posts in year ${y}`);
    }

    // CommunitySpace IDs match spaces.plan.json for the 8 existing collaboration spaces
    const collabByKey = new Map(world.spacesPlan.spaces.map((sp) => [sp.key, sp.id.toUpperCase()]));
    for (const cs of plan.communitySpaces) {
        if (!cs.createCollaborationSpace) {
            assert.equal(cs.fields.ID.toUpperCase(), collabByKey.get(cs.collaborationSpaceKey));
        } else {
            assert.ok(cs.collaborationSpace, 'new CommunitySpace icf-member-commons must include collaborationSpace descriptor');
            assert.ok(cs.collaborationSpace.seats.length >= 400);
        }
        assert.ok(cs.fields.DefaultForumID, `space ${cs.key} missing DefaultForumID`);
    }

    // Living Thread Synthesis populated whenever ReplyCount >= threshold
    const synthThresholds = world.rules.synthesisThreshold.byForumType;
    const forumTypeByForumId = new Map(plan.forums.map((f) => [f.fields.ID, f.forumTypeCode]));
    for (const p of plan.posts) {
        if (p.fields.RootPostID === null) {
            const ftCode = forumTypeByForumId.get(p.fields.ForumID);
            const thr = synthThresholds[ftCode] ?? 4;
            if (p.fields.ReplyCount >= thr) {
                assert.ok(p.fields.SummaryMarkdown && p.fields.SummaryMarkdown.includes('Key Consensus'), `root ${p.fields.ID} missing synthesis`);
                assert.equal(p.fields.SummaryReplyWatermark, p.fields.ReplyCount);
                assert.ok(p.fields.SummaryGeneratedAt);
            }
        }
    }
});

test('AC-2.2 & referential integrity: real ICF users only, excludes HERO-ICF-012 & presenter, honors timestamps, tags, subscriptions, and 100-pt wallet cap', () => {
    const { world, plan } = getBaseline();
    const spaceUserIds = new Set(world.spaceUsers.map((u) => u.primaryKey.ID.toUpperCase()));
    const staffUserIds = new Set(world.staffUsers.map((u) => u.primaryKey.ID.toUpperCase()));
    const validUserIds = new Set([...spaceUserIds, ...staffUserIds]);
    const activePersonIds = new Set(
        world.people.filter((p) => p.fields?.Status === 'Active' || p.Status === 'Active').map((p) => p.id.toUpperCase()),
    );

    const kathyPerson = world.people.find((p) => p.Email.toLowerCase() === 'kathy.oleary.000287@orchardmerecheese.example');
    const kathyId = kathyPerson?.id?.toUpperCase();

    // Build user active windows matching build-community-plan.mjs
    const personByEmail = new Map(world.people.map((p) => [p.Email.toLowerCase(), p]));
    const profByPid = new Map(world.memberProfiles.map((p) => [p.PersonID.toUpperCase(), p]));
    const firstPurchase = new Map();
    for (const pu of world.purchases) {
        if (!firstPurchase.has(pu.personId)) firstPurchase.set(pu.personId, pu.date);
    }
    const activeFromByUserId = new Map();
    for (const su of world.spaceUsers) {
        const em = su.fields.Email.toLowerCase();
        const per = personByEmail.get(em);
        const prof = profByPid.get(per.id.toUpperCase());
        const fp = firstPurchase.get(per.id.toUpperCase()) ?? prof?.JoinDate ?? '2019-01-01';
        const jd = prof?.JoinDate ?? fp;
        activeFromByUserId.set(su.primaryKey.ID.toUpperCase(), fp > jd ? fp : jd);
    }
    for (const stu of world.staffUsers) {
        const em = stu.fields.Email.toLowerCase();
        const st = world.staff.find((s) => s.email.toLowerCase() === em);
        activeFromByUserId.set(stu.primaryKey.ID.toUpperCase(), `${st.since}-01-01`);
    }

    const assertValidUser = (uid, email, context) => {
        assert.ok(UUID_RE.test(uid), `invalid UUID ${uid} in ${context}`);
        assert.ok(validUserIds.has(uid.toUpperCase()), `unknown UserID ${uid} in ${context}`);
        assert.notEqual(String(email ?? '').toLowerCase(), PRESENTER.toLowerCase(), `presenter leaked into ${context}`);
        assert.notEqual(String(email ?? '').toLowerCase(), 'kathy.oleary.000287@orchardmerecheese.example', `HERO-ICF-012 leaked into ${context}`);
    };

    const forumById = new Map(plan.forums.map((f) => [f.fields.ID, f]));
    const postById = new Map(plan.posts.map((p) => [p.fields.ID, p]));
    const tagById = new Map(plan.topicTags.map((t) => [t.fields.ID, t]));

    for (const p of plan.posts) {
        assertValidUser(p.fields.AuthorUserID, p.authorEmail, `post ${p.fields.ID}`);
        if (p.fields.AuthorPersonID) {
            assert.notEqual(p.fields.AuthorPersonID.toUpperCase(), kathyId);
            assert.ok(activePersonIds.has(p.fields.AuthorPersonID.toUpperCase()));
        }
        const af = activeFromByUserId.get(p.fields.AuthorUserID.toUpperCase());
        assert.ok(af <= p.createdAt.slice(0, 10), `post ${p.fields.ID} at ${p.createdAt} precedes author activeFrom ${af}`);
        if (p.fields.RootPostID) {
            const root = postById.get(p.fields.RootPostID);
            assert.ok(root, `missing RootPostID ${p.fields.RootPostID}`);
            assert.equal(root.fields.ForumID, p.fields.ForumID);
            assert.ok(p.createdAt >= root.createdAt, 'reply timestamp precedes root post');
        }
    }

    for (const r of plan.reactions) {
        assertValidUser(r.fields.UserID, r.userEmail, `reaction ${r.fields.ID}`);
        assert.ok(postById.has(r.fields.PostID));
        const af = activeFromByUserId.get(r.fields.UserID.toUpperCase());
        assert.ok(af <= r.createdAt.slice(0, 10), `reaction at ${r.createdAt} precedes user activeFrom ${af}`);
    }

    for (const pt of plan.postTags) {
        const post = postById.get(pt.fields.PostID);
        const tag = tagById.get(pt.fields.TopicTagID);
        assert.ok(post && tag);
        const forum = forumById.get(post.fields.ForumID);
        assert.equal(tag.fields.SpaceID, forum.fields.SpaceID, 'ForumPostTag SpaceID must match Forum SpaceID');
    }

    for (const sub of plan.subscriptions) {
        assertValidUser(sub.fields.UserID, sub.userEmail, `subscription ${sub.fields.ID}`);
        const nonNullTargets = [sub.fields.ForumID, sub.fields.RootPostID, sub.fields.TopicTagID].filter((x) => x != null);
        assert.equal(nonNullTargets.length, 1, 'CK_ForumSubscription_Target requires exactly one non-null target');
    }

    for (const mp of plan.memberProfiles) {
        assertValidUser(mp.fields.UserID, mp.userEmail, `memberProfile ${mp.fields.ID}`);
        const parsedTags = JSON.parse(mp.fields.ExpertiseTagsJSON);
        assert.ok(Array.isArray(parsedTags) && parsedTags.length > 0);
    }

    // Heroes (excluding HERO-ICF-012) present in profiles
    const profileHeroKeys = new Set(plan.memberProfiles.map((mp) => mp.heroKey).filter(Boolean));
    for (const hk of ['HERO-ICF-001', 'HERO-ICF-004', 'HERO-ICF-006', 'HERO-ICF-007', 'HERO-ICF-008', 'HERO-ICF-009', 'HERO-ICF-011', 'HERO-ICF-013', 'HERO-ICF-015']) {
        assert.ok(profileHeroKeys.has(hk), `missing hero profile ${hk}`);
    }
    assert.ok(!profileHeroKeys.has('HERO-ICF-012'));

    // Quadratic Ideation 100-point wallet budget & MaxPointsPerIdea
    const campByKey = new Map(plan.forumIdeaCampaigns.map((c) => [c.campaignKey, c]));
    const spend = new Map();
    for (const al of plan.ideaAllocations) {
        assertValidUser(al.fields.UserID, al.userEmail, `allocation ${al.fields.ID}`);
        const camp = campByKey.get(al.campaignKey);
        assert.ok(al.fields.PointsAllocated > 0);
        if (camp.fields.MaxPointsPerIdea != null) {
            assert.ok(al.fields.PointsAllocated <= camp.fields.MaxPointsPerIdea);
        }
        assert.equal(al.fields.QuadraticVotes, Number(Math.sqrt(al.fields.PointsAllocated).toFixed(2)));
        const bk = `${al.campaignKey}:${al.fields.UserID}`;
        spend.set(bk, (spend.get(bk) ?? 0) + al.fields.PointsAllocated);
    }
    for (const [bk, total] of spend) {
        const campKey = bk.split(':')[0];
        const budget = campByKey.get(campKey).fields.DefaultBudgetPoints;
        assert.ok(total <= budget, `wallet ${bk} spent ${total} > ${budget}`);
    }

    // Answer verification invariants: every VerifiedByUserID holds moderator/forum-admin ForumMember role
    const roleIdToCode = new Map(Object.entries(world.rules.metadataRefs.forumRoleTypes).map(([code, r]) => [r.id.toUpperCase(), code]));
    const memberRoleByForumUser = new Map(
        plan.forumMembers.map((fm) => [`${fm.fields.ForumID}:${fm.fields.UserID}`, roleIdToCode.get(fm.fields.ForumRoleTypeID.toUpperCase())]),
    );
    for (const ans of plan.answerPosts) {
        if (ans.fields.IsVerifiedByModerator || ans.fields.AIEpistemicStatus === 'Canon Verified') {
            assert.ok(ans.fields.VerifiedByUserID);
            const post = postById.get(ans.fields.ID);
            const rc = memberRoleByForumUser.get(`${post.fields.ForumID}:${ans.fields.VerifiedByUserID}`);
            assert.ok(rc === 'forum-admin' || rc === 'moderator', `verifier ${ans.fields.VerifiedByUserID} has role ${rc}`);
        }
    }
});

test('append-only monthly growth (2026-11): preserves all 2019-01..2026-10 records & UUIDs, enforces cumulative 100-pt wallet cap, and is idempotent', () => {
    const { world, plan: basePlan } = getBaseline();
    const novPlanA = buildCommunityPlan(world, { throughMonth: '2026-11' });
    const novPlanB = buildCommunityPlan(world, { throughMonth: '2026-11' });

    assert.equal(renderCommunityPlan(novPlanA), renderCommunityPlan(novPlanB), 'repeat 2026-11 build must be byte-identical');
    assert.equal(novPlanA.asOf, '2026-11-30');
    assert.equal(novPlanA.cycles.length, 95);
    assert.equal(novPlanA.cycles[novPlanA.cycles.length - 1], '2026-11');

    // New 2026-11 records exist
    const novPosts = novPlanA.posts.filter((p) => p.cycle === '2026-11');
    const novReactions = novPlanA.reactions.filter((r) => r.cycle === '2026-11');
    const novTags = novPlanA.postTags.filter((t) => t.cycle === '2026-11');
    const novSubs = novPlanA.subscriptions.filter((s) => s.cycle === '2026-11');
    assert.ok(novPosts.length >= 4, `expected >= 4 2026-11 posts, got ${novPosts.length}`);
    assert.ok(novReactions.length >= 4);
    assert.ok(novTags.length >= 2);
    assert.ok(novSubs.length >= 1);

    // 100% of 2019-01..2026-10 records remain immutable across ALL 17 entity collections
    const immutableFullCollections = [
        'communitySpaces',
        'forums',
        'forumMembers',
        'forumIdeaCampaigns',
    ];
    for (const key of immutableFullCollections) {
        assert.deepEqual(novPlanA[key], basePlan[key], `collection ${key} mutated on 2026-11 append`);
    }

    const immutableCycleCollections = [
        'posts',
        'questionPosts',
        'answerPosts',
        'casePosts',
        'amaPosts',
        'artifactPosts',
        'postTags',
        'reactions',
        'ideaAllocations',
        'subscriptions',
    ];
    for (const key of immutableCycleCollections) {
        const baseSlice = basePlan[key];
        const novHistoricalSlice = novPlanA[key].filter((row) => row.cycle <= BASELINE_MONTH);
        assert.deepEqual(novHistoricalSlice, baseSlice, `historical ${key} mutated on 2026-11 append`);
    }

    // ideaPosts: closed campaigns are byte-for-byte identical; open campaigns preserve identity/metadata while rollups increase monotonically
    const novIdeaById = new Map(novPlanA.ideaPosts.map((ip) => [ip.fields.ID, ip]));
    const openCampaignKeys = new Set(
        novPlanA.forumIdeaCampaigns
            .filter((c) => !c.fields.VotingClosesAt || c.fields.VotingClosesAt.slice(0, 7) >= '2026-11')
            .map((c) => c.campaignKey),
    );
    for (const baseIdea of basePlan.ideaPosts) {
        const novIdea = novIdeaById.get(baseIdea.fields.ID);
        assert.ok(novIdea, `missing ideaPost ${baseIdea.fields.ID} after 2026-11 append`);
        if (!openCampaignKeys.has(baseIdea.campaignKey)) {
            assert.deepEqual(novIdea, baseIdea, `closed-campaign ideaPost ${baseIdea.slug} mutated`);
        } else {
            assert.equal(novIdea.cycle, baseIdea.cycle);
            assert.equal(novIdea.campaignKey, baseIdea.campaignKey);
            assert.equal(novIdea.forumKey, baseIdea.forumKey);
            assert.equal(novIdea.slug, baseIdea.slug);
            assert.equal(novIdea.fields.IdeaStatus, baseIdea.fields.IdeaStatus);
            assert.equal(novIdea.fields.TargetReleaseOrQuarter, baseIdea.fields.TargetReleaseOrQuarter);
            assert.equal(novIdea.fields.StatusRationaleMarkdown, baseIdea.fields.StatusRationaleMarkdown);
            assert.equal(novIdea.fields.MergedIntoIdeaPostID, baseIdea.fields.MergedIntoIdeaPostID);
            assert.ok(novIdea.fields.TotalPointsAllocated >= baseIdea.fields.TotalPointsAllocated);
            assert.ok(novIdea.fields.EffectiveQuadraticVotes >= baseIdea.fields.EffectiveQuadraticVotes);
            assert.ok(novIdea.fields.UniqueBackerCount >= baseIdea.fields.UniqueBackerCount);
        }
    }

    // topicTags: preexisting PKs, identity, and taxonomy fields unchanged; PostCount only increases monotonically on 2026-11 tag activity
    const novTaggedSlugs = new Set(novTags.map((t) => `${t.spaceKey}:${t.tagSlug}`));
    const novTagById = new Map(novPlanA.topicTags.map((t) => [t.fields.ID, t]));
    assert.equal(novPlanA.topicTags.length, basePlan.topicTags.length);
    for (const baseTag of basePlan.topicTags) {
        const novTag = novTagById.get(baseTag.fields.ID);
        assert.ok(novTag, `missing topicTag ${baseTag.fields.ID} after 2026-11 append`);
        assert.equal(novTag.key, baseTag.key);
        assert.equal(novTag.spaceKey, baseTag.spaceKey);
        assert.equal(novTag.category, baseTag.category);
        assert.equal(novTag.fields.SpaceID, baseTag.fields.SpaceID);
        assert.equal(novTag.fields.ParentTagID, baseTag.fields.ParentTagID);
        assert.equal(novTag.fields.TagID, baseTag.fields.TagID);
        assert.equal(novTag.fields.Slug, baseTag.fields.Slug);
        assert.equal(novTag.fields.Name, baseTag.fields.Name);
        assert.equal(novTag.fields.Description, baseTag.fields.Description);
        assert.equal(novTag.fields.ColorHex, baseTag.fields.ColorHex);
        assert.equal(novTag.fields.IsOfficial, baseTag.fields.IsOfficial);
        assert.ok(novTag.fields.PostCount >= baseTag.fields.PostCount);
        if (!novTaggedSlugs.has(baseTag.key)) {
            assert.equal(novTag.fields.PostCount, baseTag.fields.PostCount, `topicTag ${baseTag.key} PostCount changed without 2026-11 activity`);
        }
    }

    // memberProfiles: preexisting PKs, identity, bio/expertise, and createdAt unchanged; rollups only increase monotonically
    const novProfileById = new Map(novPlanA.memberProfiles.map((mp) => [mp.fields.ID, mp]));
    for (const baseProf of basePlan.memberProfiles) {
        const novProf = novProfileById.get(baseProf.fields.ID);
        assert.ok(novProf, `missing memberProfile ${baseProf.fields.ID} after 2026-11 append`);
        assert.equal(novProf.spaceKey, baseProf.spaceKey);
        assert.equal(novProf.userEmail, baseProf.userEmail);
        assert.equal(novProf.heroKey, baseProf.heroKey);
        assert.equal(novProf.createdAt, baseProf.createdAt);
        assert.equal(novProf.fields.SpaceID, baseProf.fields.SpaceID);
        assert.equal(novProf.fields.UserID, baseProf.fields.UserID);
        assert.equal(novProf.fields.PersonID, baseProf.fields.PersonID);
        assert.equal(novProf.fields.BioMarkdown, baseProf.fields.BioMarkdown);
        assert.equal(novProf.fields.ExpertiseTagsJSON, baseProf.fields.ExpertiseTagsJSON);
        assert.equal(novProf.fields.DigestCadence, baseProf.fields.DigestCadence);
        assert.equal(novProf.fields.OpenToPeerMentoring, baseProf.fields.OpenToPeerMentoring);
        assert.ok(novProf.fields.HelpfulAnswerCount >= baseProf.fields.HelpfulAnswerCount);
        assert.ok(novProf.fields.AcceptedAnswerCount >= baseProf.fields.AcceptedAnswerCount);
        assert.ok(novProf.fields.ReputationScore >= baseProf.fields.ReputationScore);
        if (baseProf.updatedAt != null && novProf.updatedAt != null) {
            assert.ok(novProf.updatedAt >= baseProf.updatedAt);
        }
    }

    // Cumulative wallet across 2019-01..2026-11 remains <= 100 per campaign & user
    const campByKey = new Map(novPlanA.forumIdeaCampaigns.map((c) => [c.campaignKey, c]));
    const spend = new Map();
    for (const al of novPlanA.ideaAllocations) {
        const bk = `${al.campaignKey}:${al.fields.UserID}`;
        spend.set(bk, (spend.get(bk) ?? 0) + al.fields.PointsAllocated);
    }
    for (const [bk, total] of spend) {
        const budget = campByKey.get(bk.split(':')[0]).fields.DefaultBudgetPoints;
        assert.ok(total <= budget, `cumulative 2026-11 wallet ${bk} spent ${total} > ${budget}`);
    }
});

test('CLI: committed data/community/community.plan.json passes --check, --through 2026-11 + --check works in isolated copy, and mismatch fails --check without mutating', () => {
    // 1. Committed file passes --check
    const checkCommitted = spawnSync(process.execPath, [SCRIPT, '--check'], { cwd: REPO_ROOT, encoding: 'utf8' });
    assert.equal(checkCommitted.status, 0, checkCommitted.stderr);

    // 2. Isolated copy: test --through 2026-11, repeat idempotency, --check after append, and failure on drift
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'community-plan-cli-'));
    try {
        for (const rel of [
            'data/ruleset/community-rules.json',
            'data/ruleset/heroes.json',
            'data/spaces/spaces.plan.json',
            'data/spaces/staff.json',
            'config/users/.space-users.json',
            'config/users/.staff-users.json',
            'generated/checkpoint.json',
            'generated/people',
            'generated/member-profiles',
            'generated/products',
            'generated/orders',
        ]) {
            const src = path.join(REPO_ROOT, rel);
            const dst = path.join(tmp, rel);
            fs.mkdirSync(path.dirname(dst), { recursive: true });
            fs.symlinkSync(src, dst);
        }

        const runCli = (...args) => spawnSync(process.execPath, [SCRIPT, ...args], { cwd: tmp, encoding: 'utf8' });

        // Missing file fails --check without writing
        const missingRes = runCli('--check');
        assert.equal(missingRes.status, 1);
        assert.ok(!fs.existsSync(path.join(tmp, PLAN_FILE)));

        // Append through 2026-11 and verify repeat run + --check (without --through) both succeed cleanly
        const nov1 = runCli('--through', '2026-11');
        assert.equal(nov1.status, 0, nov1.stderr);
        const bytes1 = fs.readFileSync(path.join(tmp, PLAN_FILE), 'utf8');

        const nov2 = runCli('--through', '2026-11');
        assert.equal(nov2.status, 0, nov2.stderr);
        const bytes2 = fs.readFileSync(path.join(tmp, PLAN_FILE), 'utf8');
        assert.equal(bytes2, bytes1, 'repeat --through 2026-11 must be byte-identical');

        const checkAfterNov = runCli('--check');
        assert.equal(checkAfterNov.status, 0, `--check after 2026-11 append failed: ${checkAfterNov.stderr}`);

        // Explicit mismatch fails --check without overwriting file
        const checkBaselineMismatch = runCli('--check', '--through', '2026-10');
        assert.equal(checkBaselineMismatch.status, 1);
        assert.equal(fs.readFileSync(path.join(tmp, PLAN_FILE), 'utf8'), bytes1, '--check must never mutate disk');
    } finally {
        fs.rmSync(tmp, { recursive: true, force: true });
    }
});

test('CR-003: default generation preserves extended horizon (--out temp plan) and explicit shrink requires --allow-shrink', () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'community-plan-cr003-'));
    const tempPlanPath = path.join(tmp, 'community.plan.json');
    try {
        // (a) Generate 2026-10
        const plan10 = buildCommunityPlanMain(['--out', tempPlanPath, '--through', '2026-10'], REPO_ROOT);
        assert.equal(plan10.throughMonth, '2026-10');
        assert.equal(plan10.asOf, '2026-10-31');

        // (b) Append 2026-11
        const plan11 = buildCommunityPlanMain(['--out', tempPlanPath, '--through', '2026-11'], REPO_ROOT);
        assert.equal(plan11.throughMonth, '2026-11');
        assert.equal(plan11.asOf, '2026-11-30');
        const novBytes = fs.readFileSync(tempPlanPath, 'utf8');

        // (c) Default generation (no --through) preserves 2026-11 and --check exits 0
        const defaultRun = buildCommunityPlanMain(['--out', tempPlanPath], REPO_ROOT);
        assert.equal(defaultRun.throughMonth, '2026-11');
        assert.equal(defaultRun.asOf, '2026-11-30');
        assert.equal(fs.readFileSync(tempPlanPath, 'utf8'), novBytes);

        const checkCli = spawnSync(process.execPath, [SCRIPT, '--out', tempPlanPath, '--check'], {
            cwd: REPO_ROOT,
            encoding: 'utf8',
        });
        assert.equal(checkCli.status, 0, checkCli.stderr);

        // (d) Passing --through 2026-10 against 2026-11 file throws unless --allow-shrink is passed
        assert.throws(
            () => buildCommunityPlanMain(['--out', tempPlanPath, '--through', '2026-10'], REPO_ROOT),
            /allow-shrink/,
        );
        assert.equal(fs.readFileSync(tempPlanPath, 'utf8'), novBytes, 'rejected shrink must not modify file');

        const shrinkCli = spawnSync(process.execPath, [SCRIPT, '--out', tempPlanPath, '--through', '2026-10'], {
            cwd: REPO_ROOT,
            encoding: 'utf8',
        });
        assert.equal(shrinkCli.status, 1);
        assert.match(shrinkCli.stderr, /allow-shrink/);

        const allowedShrink = buildCommunityPlanMain(
            ['--out', tempPlanPath, '--through', '2026-10', '--allow-shrink'],
            REPO_ROOT,
        );
        assert.equal(allowedShrink.throughMonth, '2026-10');
        assert.equal(allowedShrink.asOf, '2026-10-31');

        // Committed data/community/community.plan.json remains at 2026-10
        const committed = JSON.parse(fs.readFileSync(path.join(REPO_ROOT, PLAN_FILE), 'utf8'));
        assert.equal(committed.throughMonth, '2026-10');
        assert.equal(committed.asOf, '2026-10-31');
    } finally {
        fs.rmSync(tmp, { recursive: true, force: true });
    }
});
