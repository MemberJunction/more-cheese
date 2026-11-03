#!/usr/bin/env node
/**
 * build-knowledge-hub-governance.mjs — Knowledge Hub co-occurrence, governance, item duplicates,
 * and search scopes for More Cheese, computed deterministically from the committed config/ tree.
 *
 * PR #81 (5297bfc) shipped the crawl output (config/tags, config/content-items,
 * config/content-item-chunks, config/content-item-tags), and aa6d81e shipped entity duplicate runs.
 * However, the Knowledge Hub Clusters co-occurrence overlay, Analytics Co-Occurrence Pairs table,
 * Tag Governance drawer (TagSuggestion + TagAuditLog), Content Item Duplicate tracking, and Search
 * Scopes depend on five companion config directories that were not yet generated from the crawl:
 *
 *   config/tag-co-occurrences/.tag-co-occurrences.json           — canonical (TagAID < TagBID) pairs
 *   config/tag-suggestions/.tag-suggestions.json                 — WideNode, MergeCandidate, LowUsage
 *   config/tag-audit-logs/.tag-audit-logs.json                   — initial root taxonomy audit entries
 *   config/content-item-duplicates/.content-item-duplicates.json — duplicate-title item pairs
 *   config/search-scopes/.search-scopes.json                     — All, Knowledge, Entities, Files
 *
 *   node scripts/build-knowledge-hub-governance.mjs           # write the five config directories
 *   node scripts/build-knowledge-hub-governance.mjs --check   # exit 1 if any file is out of date
 *
 * Plain Node, zero dependencies. Run from the repo root.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { uuidv5 } from './enrich-person-job-functions.mjs';

const NAMESPACE = '9c4e71a2-3d58-4e19-8b62-7f10a9d4e2c1';
const COMPUTED_AT = '2026-10-26T14:00:00.000Z';
const SYSTEM_USER_LOOKUP = '@lookup:MJ: Users.Email=not.set@nowhere.com';

const up = (v) => (v == null ? v : String(v).toUpperCase());
const id = (key) => uuidv5(key, NAMESPACE);

/** Strips mj-sync push bookkeeping before comparing JSON in --check and build-knowledge-hub-governance.spec.mjs. */
export const unsynced = (text) => JSON.stringify(JSON.parse(text), (k, v) => (k === 'sync' ? undefined : v));

function loadConfigDir(root, dir) {
    const d = path.join(root, 'config', dir);
    if (!fs.existsSync(d)) return [];
    const out = [];
    for (const f of fs.readdirSync(d).sort()) {
        if (f === '.mj-sync.json' || !f.endsWith('.json')) continue;
        const parsed = JSON.parse(fs.readFileSync(path.join(d, f), 'utf8'));
        if (Array.isArray(parsed)) out.push(...parsed);
        else if (parsed && typeof parsed === 'object') out.push(parsed);
    }
    return out;
}

export function loadKnowledgeHub(root) {
    return {
        tags: loadConfigDir(root, 'tags'),
        contentItems: loadConfigDir(root, 'content-items'),
        contentItemTags: loadConfigDir(root, 'content-item-tags'),
    };
}

export function buildKnowledgeHubGovernance({ tags, contentItems, contentItemTags }) {
    const tagById = new Map();
    const usageByTag = new Map();
    for (const t of tags) {
        const tid = up(t.primaryKey?.ID);
        if (!tid) continue;
        tagById.set(tid, t);
        usageByTag.set(tid, 0);
    }

    // ── RULE 1 — Canonical Tag Co-Occurrences (TagAID < TagBID) ──
    const tagsByItem = new Map();
    for (const it of contentItemTags) {
        const itemId = up(it.fields?.ItemID);
        const tagId = up(it.fields?.TagID);
        if (!itemId || !tagById.has(tagId)) continue;
        if (!tagsByItem.has(itemId)) tagsByItem.set(itemId, new Set());
        const itemSet = tagsByItem.get(itemId);
        if (!itemSet.has(tagId)) {
            itemSet.add(tagId);
            usageByTag.set(tagId, (usageByTag.get(tagId) || 0) + 1);
        }
    }

    const pairCounts = new Map();
    for (const tagSet of tagsByItem.values()) {
        const sorted = Array.from(tagSet).sort();
        for (let i = 0; i < sorted.length; i++) {
            for (let j = i + 1; j < sorted.length; j++) {
                const key = `${sorted[i]}|${sorted[j]}`;
                pairCounts.set(key, (pairCounts.get(key) || 0) + 1);
            }
        }
    }

    const tagCoOccurrences = Array.from(pairCounts.entries())
        .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
        .map(([key, count]) => {
            const [TagAID, TagBID] = key.split('|');
            return {
                fields: {
                    TagAID,
                    TagBID,
                    CoOccurrenceCount: count,
                    LastComputedAt: COMPUTED_AT,
                },
                primaryKey: {
                    ID: id(`tag-co-occurrence:${key}`),
                },
            };
        });

    // ── RULE 2 — Tag Governance Suggestions (WideNode, MergeCandidate, LowUsage) ──
    // Emits the exact MJ: Tag Suggestions columns and TagHealthJob conventions:
    //   WideNode       -> ProposedName = tag.Name, ProposedParentID = tag.ID, BestMatchTagID = tag.ID, BestMatchScore = null
    //   MergeCandidate -> ProposedName = tagA.Name, ProposedParentID = null, BestMatchTagID = tagB.ID, BestMatchScore = similarity
    //   LowUsage       -> ProposedName = tag.Name, ProposedParentID = tag.ParentID, BestMatchTagID = tag.ID, BestMatchScore = null
    const childrenByParent = new Map();
    for (const t of tags) {
        const pid = up(t.fields?.ParentID);
        if (pid && tagById.has(pid)) {
            if (!childrenByParent.has(pid)) childrenByParent.set(pid, []);
            childrenByParent.get(pid).push(t);
        }
    }

    const tagSuggestions = [];
    for (const [pid, children] of Array.from(childrenByParent.entries()).sort((a, b) => a[0].localeCompare(b[0]))) {
        if (children.length > 10) {
            const parentTag = tagById.get(pid);
            const name = parentTag.fields.DisplayName || parentTag.fields.Name;
            tagSuggestions.push({
                fields: {
                    ProposedName: name,
                    ProposedParentID: pid,
                    BestMatchTagID: pid,
                    BestMatchScore: null,
                    Reason: 'WideNode',
                    Status: 'Pending',
                    ReviewedByUserID: null,
                    ReviewedAt: null,
                    ReviewerNotes: null,
                },
                primaryKey: {
                    ID: id(`tag-suggestion:WideNode:${pid}`),
                },
            });
        }
    }

    const sortedTags = Array.from(tagById.values()).sort((a, b) => up(a.primaryKey.ID).localeCompare(up(b.primaryKey.ID)));
    let mergeCandidateCount = 0;
    for (let i = 0; i < sortedTags.length; i++) {
        for (let j = i + 1; j < sortedTags.length; j++) {
            if (mergeCandidateCount >= 8) break;
            const a = sortedTags[i];
            const b = sortedTags[j];
            const na = String(a.fields.Name || '').toLowerCase().replace(/[^a-z0-9 ]/g, ' ').trim();
            const nb = String(b.fields.Name || '').toLowerCase().replace(/[^a-z0-9 ]/g, ' ').trim();
            if (!na || !nb) continue;
            const wordsA = new Set(na.split(/\s+/).filter((w) => w.length > 3));
            const wordsB = new Set(nb.split(/\s+/).filter((w) => w.length > 3));
            if (wordsA.size === 0 || wordsB.size === 0) continue;
            let overlap = 0;
            for (const w of wordsA) if (wordsB.has(w)) overlap++;
            const jaccard = overlap / (wordsA.size + wordsB.size - overlap);
            if (jaccard >= 0.65) {
                const idA = up(a.primaryKey.ID);
                const idB = up(b.primaryKey.ID);
                mergeCandidateCount++;
                tagSuggestions.push({
                    fields: {
                        ProposedName: a.fields.DisplayName || a.fields.Name,
                        ProposedParentID: null,
                        BestMatchTagID: idB,
                        BestMatchScore: Number(Math.min(0.95, 0.75 + jaccard * 0.2).toFixed(2)),
                        Reason: 'MergeCandidate',
                        Status: 'Pending',
                        ReviewedByUserID: null,
                        ReviewedAt: null,
                        ReviewerNotes: null,
                    },
                    primaryKey: {
                        ID: id(`tag-suggestion:MergeCandidate:${idA}:${idB}`),
                    },
                });
            }
        }
    }

    for (const t of sortedTags) {
        const tid = up(t.primaryKey.ID);
        const count = usageByTag.get(tid) || 0;
        const hasChildren = childrenByParent.has(tid);
        if (!hasChildren && count <= 2) {
            const name = t.fields.DisplayName || t.fields.Name;
            tagSuggestions.push({
                fields: {
                    ProposedName: name,
                    ProposedParentID: up(t.fields.ParentID) ?? null,
                    BestMatchTagID: tid,
                    BestMatchScore: null,
                    Reason: 'LowUsage',
                    Status: 'Pending',
                    ReviewedByUserID: null,
                    ReviewedAt: null,
                    ReviewerNotes: null,
                },
                primaryKey: {
                    ID: id(`tag-suggestion:LowUsage:${tid}`),
                },
            });
        }
    }

    // ── RULE 3 — Tag Audit Logs on Root Taxonomy Nodes ──
    const rootTags = sortedTags
        .filter((t) => !t.fields.ParentID)
        .sort((a, b) => String(a.fields.Name).localeCompare(String(b.fields.Name)))
        .slice(0, 12);

    const tagAuditLogs = rootTags.map((t, idx) => {
        const tid = up(t.primaryKey.ID);
        const name = t.fields.DisplayName || t.fields.Name;
        return {
            fields: {
                TagID: tid,
                Action: 'Created',
                PerformedByUserID: SYSTEM_USER_LOOKUP,
                Details: JSON.stringify({
                    TagName: name,
                    Note: 'Initial ICF Knowledge Hub taxonomy governance pass',
                    Timestamp: COMPUTED_AT,
                }),
                RelatedTagID: null,
            },
            primaryKey: {
                ID: id(`tag-audit-log:${tid}:${idx}`),
            },
        };
    });

    // ── RULE 4 — Content Item Duplicates (identical normalized titles across crawled items) ──
    const itemsByTitle = new Map();
    for (const item of contentItems) {
        const iid = up(item.primaryKey?.ID);
        const title = String(item.fields?.Name || '').trim().toLowerCase();
        if (!iid || !title) continue;
        if (!itemsByTitle.has(title)) itemsByTitle.set(title, []);
        itemsByTitle.get(title).push(item);
    }

    const contentItemDuplicates = [];
    for (const [, group] of Array.from(itemsByTitle.entries()).sort((a, b) => a[0].localeCompare(b[0]))) {
        if (group.length > 1) {
            const sortedIds = group.map((g) => up(g.primaryKey.ID)).sort();
            for (let i = 0; i < sortedIds.length; i++) {
                for (let j = i + 1; j < sortedIds.length; j++) {
                    const key = `${sortedIds[i]}|${sortedIds[j]}`;
                    contentItemDuplicates.push({
                        fields: {
                            ContentItemAID: sortedIds[i],
                            ContentItemBID: sortedIds[j],
                            SimilarityScore: 0.96,
                            DetectionMethod: 'Title',
                            Status: 'Pending',
                            ResolvedByUserID: null,
                            ResolvedAt: null,
                            Resolution: null,
                        },
                        primaryKey: {
                            ID: id(`content-item-duplicate:${key}`),
                        },
                    });
                }
            }
        }
    }

    // ── RULE 5 — Bounded Search Scopes + Provider/Entity/Storage Lanes + Role Permissions ──
    // MJ core already seeds the built-in Global default scope (75EE4F64-B784-402B-B6A0-041A3134ED8D,
    // IsGlobal = true, IsDefault = true). Each More Cheese scope below is non-global and explicitly
    // bounds its providers and lanes (MJ: Search Scope Providers, MJ: Search Scope Entities, and
    // MJ: Search Scope Storage Accounts) plus UI ('Search') and Developer ('Manage') role permissions.
    // Entity names match the host's declared .mj-sync.json entities across config/ and generated/.
    const KNOWLEDGE_ENTITIES = ['MJ: Content Items', 'MJ: Content Item Chunks'];
    const CRM_ENTITIES = [
        'MJ_BizApps_Common: People',
        'MJ_BizApps_Common: Organizations',
        'MJ_BizApps_Orders: Products',
        'MJ_BizApps_Orders: Order Headers',
        'MoreCheese: Courses',
        'MoreCheese: Certifications',
        'Committees: Committees',
    ];
    const ENTITY_PROVIDERS = ['Database', 'Database Full-Text', 'Tags'];
    const DROPBOX_STORAGE_ACCOUNT = 'More Cheese Dropbox';

    const scopesSpec = [
        {
            name: 'All',
            description: 'Search across all More Cheese Knowledge Hub content, CRM entities, and Dropbox vault files.',
            icon: 'fa-solid fa-globe',
            providers: [...ENTITY_PROVIDERS, 'File Storage'],
            entities: [...KNOWLEDGE_ENTITIES, ...CRM_ENTITIES],
            storageAccounts: [DROPBOX_STORAGE_ACCOUNT],
        },
        {
            name: 'Knowledge',
            description: 'Search across tagged Knowledge Hub articles, press releases, and internal vault documents.',
            icon: 'fa-solid fa-book-open',
            providers: ENTITY_PROVIDERS,
            entities: KNOWLEDGE_ENTITIES,
            storageAccounts: [],
        },
        {
            name: 'Entities',
            description: 'Search across People, Organizations, Products, Orders, Courses, Certifications, and Committees.',
            icon: 'fa-solid fa-database',
            providers: ENTITY_PROVIDERS,
            entities: CRM_ENTITIES,
            storageAccounts: [],
        },
        {
            name: 'Files',
            description: 'Search across uploaded documents and Dropbox vault files.',
            icon: 'fa-solid fa-folder-open',
            providers: ['File Storage'],
            entities: [],
            storageAccounts: [DROPBOX_STORAGE_ACCOUNT],
        },
    ];

    const searchScopes = scopesSpec.map((s) => {
        const relatedEntities = {
            'MJ: Search Scope Providers': s.providers.map((providerName) => ({
                fields: {
                    SearchScopeID: '@parent:ID',
                    SearchProviderID: `@lookup:MJ: Search Providers.Name=${providerName}`,
                    Enabled: true,
                },
                primaryKey: {
                    ID: id(`search-scope-provider:${s.name}:${providerName}`),
                },
            })),
        };

        if (s.entities.length > 0) {
            relatedEntities['MJ: Search Scope Entities'] = s.entities.map((entityName) => ({
                fields: {
                    SearchScopeID: '@parent:ID',
                    EntityID: `@lookup:MJ: Entities.Name=${entityName}`,
                },
                primaryKey: {
                    ID: id(`search-scope-entity:${s.name}:${entityName}`),
                },
            }));
        }

        if (s.storageAccounts.length > 0) {
            relatedEntities['MJ: Search Scope Storage Accounts'] = s.storageAccounts.map((accountName) => ({
                fields: {
                    SearchScopeID: '@parent:ID',
                    FileStorageAccountID: `@lookup:MJ: File Storage Accounts.Name=${accountName}`,
                },
                primaryKey: {
                    ID: id(`search-scope-storage:${s.name}:${accountName}`),
                },
            }));
        }

        relatedEntities['MJ: Search Scope Permissions'] = [
            {
                fields: {
                    SearchScopeID: '@parent:ID',
                    RoleID: '@lookup:MJ: Roles.Name=UI',
                    UserID: null,
                    PermissionLevel: 'Search',
                },
                primaryKey: {
                    ID: id(`search-scope-perm:${s.name}:UI`),
                },
            },
            {
                fields: {
                    SearchScopeID: '@parent:ID',
                    RoleID: '@lookup:MJ: Roles.Name=Developer',
                    UserID: null,
                    PermissionLevel: 'Manage',
                },
                primaryKey: {
                    ID: id(`search-scope-perm:${s.name}:Developer`),
                },
            },
        ];

        return {
            fields: {
                Name: s.name,
                Description: s.description,
                Icon: s.icon,
                Status: 'Active',
                IsGlobal: false,
                IsDefault: false,
            },
            primaryKey: {
                ID: id(`search-scope:${s.name}`),
            },
            relatedEntities,
        };
    });

    return {
        tagCoOccurrences,
        tagSuggestions,
        tagAuditLogs,
        contentItemDuplicates,
        searchScopes,
    };
}

function mjSyncJson(entityName, fileName) {
    return JSON.stringify(
        {
            entity: entityName,
            filePattern: '**/.*.json',
            pull: {
                filePattern: '.*.json',
                createNewFileIfNotFound: true,
                newFileName: fileName,
                updateExistingRecords: true,
                mergeStrategy: 'merge',
                excludeFields: ['__mj_CreatedAt', '__mj_UpdatedAt', '__mj_DeletedAt'],
                ignoreVirtualFields: true,
            },
        },
        null,
        2,
    ) + '\n';
}

export function renderFiles(built) {
    return {
        'config/tag-co-occurrences/.mj-sync.json': mjSyncJson('MJ: Tag Co Occurrences', '.tag-co-occurrences.json'),
        'config/tag-co-occurrences/.tag-co-occurrences.json': JSON.stringify(built.tagCoOccurrences, null, 2) + '\n',
        'config/tag-suggestions/.mj-sync.json': mjSyncJson('MJ: Tag Suggestions', '.tag-suggestions.json'),
        'config/tag-suggestions/.tag-suggestions.json': JSON.stringify(built.tagSuggestions, null, 2) + '\n',
        'config/tag-audit-logs/.mj-sync.json': mjSyncJson('MJ: Tag Audit Logs', '.tag-audit-logs.json'),
        'config/tag-audit-logs/.tag-audit-logs.json': JSON.stringify(built.tagAuditLogs, null, 2) + '\n',
        'config/content-item-duplicates/.mj-sync.json': mjSyncJson('MJ: Content Item Duplicates', '.content-item-duplicates.json'),
        'config/content-item-duplicates/.content-item-duplicates.json': JSON.stringify(built.contentItemDuplicates, null, 2) + '\n',
        'config/search-scopes/.mj-sync.json': mjSyncJson('MJ: Search Scopes', '.search-scopes.json'),
        'config/search-scopes/.search-scopes.json': JSON.stringify(built.searchScopes, null, 2) + '\n',
    };
}

if (path.resolve(process.argv[1] ?? '') === fileURLToPath(import.meta.url)) {
    const check = process.argv.includes('--check');
    const root = process.cwd();
    const built = buildKnowledgeHubGovernance(loadKnowledgeHub(root));
    const files = renderFiles(built);

    if (check) {
        // A push writes its own `sync` bookkeeping back into the record files; that is not drift.
        let stale = false;
        for (const [rel, expected] of Object.entries(files)) {
            const p = path.join(root, rel);
            if (!fs.existsSync(p) || unsynced(fs.readFileSync(p, 'utf8')) !== unsynced(expected)) {
                console.error(`stale or missing: ${rel}`);
                stale = true;
            }
        }
        if (stale) process.exit(1);
        console.log('Knowledge Hub governance config files are up to date.');
        process.exit(0);
    }

    for (const [rel, body] of Object.entries(files)) {
        const p = path.join(root, rel);
        fs.mkdirSync(path.dirname(p), { recursive: true });
        fs.writeFileSync(p, body);
    }
    console.log(
        `Built Knowledge Hub governance config: ${built.tagCoOccurrences.length} co-occurrences, ` +
            `${built.tagSuggestions.length} suggestions, ${built.tagAuditLogs.length} audit logs, ` +
            `${built.contentItemDuplicates.length} item duplicates, ${built.searchScopes.length} search scopes.`,
    );
}
