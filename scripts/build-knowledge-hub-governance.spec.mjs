/**
 * Specs for build-knowledge-hub-governance.mjs — canonical TagCoOccurrence pairs, TagSuggestion
 * rules (WideNode, MergeCandidate, LowUsage), TagAuditLog entries, ContentItemDuplicate pairs,
 * and SearchScope + lanes/permissions. Each case builds a throwaway repo root, and the final case
 * asserts that the committed config/ tree matches a fresh run (ignoring `sync` blocks).
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { loadKnowledgeHub, buildKnowledgeHubGovernance, renderFiles, unsynced } from './build-knowledge-hub-governance.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.join(HERE, '..');
const SCRIPT = path.join(HERE, 'build-knowledge-hub-governance.mjs');

const tid = (n) => `10000000-0000-4000-8000-${String(n).padStart(12, '0')}`;
const iid = (n) => `20000000-0000-4000-8000-${String(n).padStart(12, '0')}`;

const DISTINCT_CHILD_NAMES = [
    'Pasteurized Milk Cheese Aging Regulations',
    'Pasteurized Milk Cheese Aging Rules',
    'Cave Humidity Monitoring',
    'Brine Salinity Standards',
    'Rind Washing Protocols',
    'Curd Cutting Techniques',
    'Whey Drainage Systems',
    'Rennet Coagulation Metrics',
    'Starter Culture Selection',
    'Affinage Cellar Operations',
    'Sensory Grading Criteria',
    'Cold Chain Export Logistics',
];

function declaredRepoEntityNames(root) {
    const names = new Set();
    for (const tier of ['config', 'generated']) {
        const tierDir = path.join(root, tier);
        for (const sub of fs.readdirSync(tierDir)) {
            const syncFile = path.join(tierDir, sub, '.mj-sync.json');
            if (fs.existsSync(syncFile)) {
                const parsed = JSON.parse(fs.readFileSync(syncFile, 'utf8'));
                if (parsed.entity) names.add(parsed.entity);
            }
        }
    }
    const configEntitiesFile = path.join(root, 'data/config-entities.json');
    if (fs.existsSync(configEntitiesFile)) {
        for (const entry of JSON.parse(fs.readFileSync(configEntitiesFile, 'utf8'))) {
            if (entry.entity) names.add(entry.entity);
        }
    }
    return names;
}

function fixtureWorld({ childCount = 12 } = {}) {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'kh-gov-'));
    const put = (rel, body) => {
        const full = path.join(root, rel);
        fs.mkdirSync(path.dirname(full), { recursive: true });
        fs.writeFileSync(full, JSON.stringify(body, null, 2));
    };

    const parentTag = {
        fields: { Name: 'Cheese Standards', DisplayName: 'Cheese Standards', ParentID: null, Status: 'Active' },
        primaryKey: { ID: tid(1) },
    };
    const childTags = Array.from({ length: childCount }, (_, idx) => {
        const name = DISTINCT_CHILD_NAMES[idx] ?? `Distinct Topic ${idx + 1}`;
        return {
            fields: {
                Name: name,
                DisplayName: name,
                ParentID: tid(1),
                Status: 'Active',
            },
            primaryKey: { ID: tid(10 + idx) },
        };
    });

    put('config/tags/.tags.json', [parentTag, ...childTags]);
    put('config/content-items/.items.json', [
        { fields: { Name: 'Annual Standards Report' }, primaryKey: { ID: iid(1) } },
        { fields: { Name: 'Annual Standards Report' }, primaryKey: { ID: iid(2) } },
        { fields: { Name: 'Distinct Article' }, primaryKey: { ID: iid(3) } },
    ]);
    put('config/content-item-tags/.item-tags.json', [
        { fields: { ItemID: iid(1), TagID: tid(10) }, primaryKey: { ID: tid(100) } },
        { fields: { ItemID: iid(1), TagID: tid(10) }, primaryKey: { ID: tid(104) } }, // duplicate (ItemID, TagID) row must be deduped
        { fields: { ItemID: iid(1), TagID: tid(11) }, primaryKey: { ID: tid(101) } },
        { fields: { ItemID: iid(2), TagID: tid(10) }, primaryKey: { ID: tid(102) } },
        { fields: { ItemID: iid(2), TagID: tid(11) }, primaryKey: { ID: tid(103) } },
    ]);

    return root;
}

test('co-occurrences: orders TagAID < TagBID canonically and dedupes repeated (ItemID, TagID) rows', () => {
    const built = buildKnowledgeHubGovernance(loadKnowledgeHub(fixtureWorld()));
    assert.equal(built.tagCoOccurrences.length, 1);
    assert.equal(built.tagCoOccurrences[0].fields.TagAID, tid(10));
    assert.equal(built.tagCoOccurrences[0].fields.TagBID, tid(11));
    assert.equal(built.tagCoOccurrences[0].fields.CoOccurrenceCount, 2);
});

test('tag suggestions: emits 6.1.6 TagHealthJob columns for WideNode, MergeCandidate, and LowUsage', () => {
    const built = buildKnowledgeHubGovernance(loadKnowledgeHub(fixtureWorld({ childCount: 11 })));
    const wide = built.tagSuggestions.filter((s) => s.fields.Reason === 'WideNode');
    const merge = built.tagSuggestions.filter((s) => s.fields.Reason === 'MergeCandidate');
    const low = built.tagSuggestions.filter((s) => s.fields.Reason === 'LowUsage');

    assert.equal(wide.length, 1, 'expected WideNode suggestion for parent with 11 children');
    assert.equal(wide[0].fields.ProposedName, 'Cheese Standards');
    assert.equal(wide[0].fields.ProposedParentID, tid(1));
    assert.equal(wide[0].fields.BestMatchTagID, tid(1));
    assert.equal(wide[0].fields.BestMatchScore, null);

    assert.equal(merge.length, 1, 'expected exactly the named overlapping pair to produce a MergeCandidate');
    assert.equal(merge[0].fields.ProposedName, 'Pasteurized Milk Cheese Aging Regulations');
    assert.equal(merge[0].fields.ProposedParentID, null);
    assert.equal(merge[0].fields.BestMatchTagID, tid(11));
    assert.ok(merge[0].fields.BestMatchScore >= 0.85);

    // All 11 leaf tags have <= 2 distinct items (tid(10) has 2 after deduping the repeated row on iid(1))
    assert.equal(low.length, 11, 'expected all 11 leaf tags to remain <= 2 items after per-item deduplication');
    assert.ok(low.some((s) => s.fields.BestMatchTagID === tid(10) && s.fields.ProposedParentID === tid(1) && s.fields.BestMatchScore === null));
});

test('content item duplicates: pairs items sharing normalized title with ContentItemAID < ContentItemBID and DetectionMethod Title', () => {
    const built = buildKnowledgeHubGovernance(loadKnowledgeHub(fixtureWorld()));
    assert.equal(built.contentItemDuplicates.length, 1);
    assert.equal(built.contentItemDuplicates[0].fields.ContentItemAID, iid(1));
    assert.equal(built.contentItemDuplicates[0].fields.ContentItemBID, iid(2));
    assert.equal(built.contentItemDuplicates[0].fields.DetectionMethod, 'Title');
    assert.equal(built.contentItemDuplicates[0].fields.Status, 'Pending');
});

test('search scopes: emits bounded All, Knowledge, Entities, Files scopes whose entity lookups resolve to declared repo entities', () => {
    const built = buildKnowledgeHubGovernance(loadKnowledgeHub(fixtureWorld()));
    const knownEntities = declaredRepoEntityNames(REPO_ROOT);
    assert.deepEqual(
        built.searchScopes.map((s) => s.fields.Name),
        ['All', 'Knowledge', 'Entities', 'Files'],
    );
    for (const scope of built.searchScopes) {
        assert.equal(scope.fields.Status, 'Active');
        assert.equal(scope.fields.IsGlobal, false);
        assert.equal(scope.fields.IsDefault, false);
        assert.ok(scope.relatedEntities['MJ: Search Scope Providers'].length >= 1);
        const entityLanes = scope.relatedEntities['MJ: Search Scope Entities'] ?? [];
        const storageLanes = scope.relatedEntities['MJ: Search Scope Storage Accounts'] ?? [];
        assert.ok(entityLanes.length > 0 || storageLanes.length > 0, `scope ${scope.fields.Name} must configure at least one active lane`);

        for (const lane of entityLanes) {
            const prefix = '@lookup:MJ: Entities.Name=';
            assert.ok(lane.fields.EntityID.startsWith(prefix), `expected ${prefix}* lookup, got ${lane.fields.EntityID}`);
            const targetEntity = lane.fields.EntityID.slice(prefix.length);
            assert.ok(
                knownEntities.has(targetEntity),
                `scope ${scope.fields.Name} references undeclared entity "${targetEntity}" (not in config/*/.mj-sync.json, generated/*/.mj-sync.json, or data/config-entities.json)`,
            );
        }

        const perms = scope.relatedEntities['MJ: Search Scope Permissions'];
        assert.equal(perms.length, 2);
        assert.equal(perms[0].fields.RoleID, '@lookup:MJ: Roles.Name=UI');
        assert.equal(perms[0].fields.PermissionLevel, 'Search');
        assert.equal(perms[1].fields.RoleID, '@lookup:MJ: Roles.Name=Developer');
        assert.equal(perms[1].fields.PermissionLevel, 'Manage');
    }
});

test('CLI: writes the five config directories, ignores mj-sync bookkeeping in --check, and fails when config/tags changes', () => {
    const root = fixtureWorld();
    const run = (...a) => spawnSync(process.execPath, [SCRIPT, ...a], { cwd: root, encoding: 'utf8' });
    assert.equal(run('--check').status, 1);
    const w = run();
    assert.equal(w.status, 0, w.stderr);
    assert.equal(run('--check').status, 0);

    // Simulating mj sync push writing sync blocks into a generated record file must not trip --check
    const auditFile = path.join(root, 'config/tag-audit-logs/.tag-audit-logs.json');
    const audits = JSON.parse(fs.readFileSync(auditFile, 'utf8'));
    assert.equal(audits[0].fields.Action, 'Created');
    assert.ok(audits[0].fields.Details.includes('Cheese Standards'));
    audits[0].sync = { lastModified: '2026-11-02T00:00:00.000Z', checksum: 'abc123' };
    fs.writeFileSync(auditFile, JSON.stringify(audits, null, 2));
    assert.equal(run('--check').status, 0);

    const tagsFile = path.join(root, 'config/tags/.tags.json');
    const tags = JSON.parse(fs.readFileSync(tagsFile, 'utf8'));
    tags.push({ fields: { Name: 'Extra Leaf Tag', DisplayName: 'Extra Leaf Tag', ParentID: null, Status: 'Active' }, primaryKey: { ID: tid(999) } });
    fs.writeFileSync(tagsFile, JSON.stringify(tags, null, 2));
    assert.equal(run('--check').status, 1);
});

test('the committed config/ tree matches a fresh build-knowledge-hub-governance run', () => {
    const built = buildKnowledgeHubGovernance(loadKnowledgeHub(REPO_ROOT));
    const files = renderFiles(built);
    for (const [rel, expected] of Object.entries(files)) {
        const actual = fs.readFileSync(path.join(REPO_ROOT, rel), 'utf8');
        assert.equal(unsynced(actual), unsynced(expected), `${rel} is out of date — run node scripts/build-knowledge-hub-governance.mjs`);
    }
});
