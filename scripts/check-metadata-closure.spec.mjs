/**
 * Spec for the metadata closure gate.
 *
 * The gate's first and largest job is referential closure: every field ending in `ID` on every record
 * in `generated/` and `config/` must point at a primary key some file in those trees declares. A
 * dangling one is invisible here — `mj sync push` writes it happily, because the row it names exists
 * on the developer's database — and surfaces on a stranger's install as a foreign key failure in the
 * middle of a seed.
 *
 * The gate is one top-level program: ten audits in sequence, no exported seam, rooted at
 * `process.cwd()`. So each case builds a throwaway repo root and runs the CLI against it. The root is
 * small but not minimal, because the audits run in order and several of them are prerequisites for
 * reaching the closure report: every declared external exclusion must match at least one record
 * (audit 2 fails the run on a stale one), the two sync roots must exist, and audits 7 through 9 want
 * the two product categories and the four annual membership prices. {@link baseFiles} is the
 * smallest tree that gets all the way through, and every case below is that tree with one thing
 * changed — so a failure names the one thing.
 *
 * `SKIP_BASE_DELTA_CHECK=1` is set because audit 10 diffs against a git base, and a temp directory
 * has no history to diff.
 */
import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const GATE = path.join(HERE, 'check-metadata-closure.mjs');

const roots = [];
after(() => {
    for (const root of roots) fs.rmSync(root, { recursive: true, force: true });
});

const CAT_MEMBERSHIPS = '11111111-0000-0000-0000-000000000001';
const CAT_PHYSICAL = '11111111-0000-0000-0000-000000000002';
const PRODUCT = '22222222-0000-0000-0000-000000000001';
const PERSON = '33333333-0000-0000-0000-000000000001';
const UNDECLARED = '99999999-9999-9999-9999-999999999999';

/**
 * The four annual membership prices the gate names by literal id (its audit 9).
 *
 * Copied from the gate on purpose: the ids ARE the contract there — the rule exists because a push
 * that omits `"RecurrenceMonths": null` silently leaves a pre-fix `12` in place on these four rows.
 */
const ANNUAL_MEMBERSHIP_PRICE_IDS = [
    '0FD77933-317D-4BA9-9837-F30A37FE8F76',
    '488480D6-4B47-470B-9BFD-F3EA1FBB9A1F',
    'D5156F09-228F-4731-882C-0FC077A4E768',
    'FF98075B-2C62-45E8-BB3B-5333230EBA99',
];

const record = (id, fields) => ({ primaryKey: { ID: id }, fields });

/**
 * The smallest tree that reaches the end of every audit.
 *
 * The `queries`, `vector-indexes`, `relationships`, `form-responses`, `payments`, `gl-account-links`
 * and three of the `products` fields exist for one reason: each is a declared external exclusion, and
 * an exclusion matching zero records fails the run before closure is ever reported. Returned fresh
 * each call so a case can edit it without reaching into the next one.
 */
function baseFiles() {
    return {
        'generated/.mj-sync.json': { directoryOrder: [] },
        'config/.mj-sync.json': { directoryOrder: [] },

        'generated/product-categories/.data.json': [
            record(CAT_MEMBERSHIPS, { Name: 'Memberships' }),
            record(CAT_PHYSICAL, { Name: 'Publications & Goods' }),
        ],
        'generated/products/.data.json': [
            record(PRODUCT, {
                Name: 'Individual Membership',
                ProductCategoryID: CAT_MEMBERSHIPS,
                ProductTypeID: 'seeded-by-orders',
                RevenueRecognitionTypeID: 'seeded-by-orders',
                SubscriptionTypeID: 'seeded-by-orders',
            }),
        ],
        'generated/product-prices/.data.json': ANNUAL_MEMBERSHIP_PRICE_IDS.map((id) =>
            record(id, { ProductID: PRODUCT, RecurrenceMonths: null }),
        ),
        'generated/people/.data.json': [record(PERSON, { Name: 'A Member', SeniorityLevelID: 'ext' })],

        // One record per declared external exclusion.
        'generated/person-job-functions/.data.json': [record('44444444-0000-0000-0000-000000000005', { JobFunctionID: 'ext' })],
        'generated/relationships/.data.json': [record('44444444-0000-0000-0000-000000000001', { RelationshipTypeID: 'ext' })],
        'generated/form-responses/.data.json': [record('44444444-0000-0000-0000-000000000002', { AnonymousSessionID: 'sess' })],
        'generated/payments/.data.json': [record('44444444-0000-0000-0000-000000000003', { PaymentTypeID: 'ext' })],
        'generated/gl-account-links/.data.json': [
            record('44444444-0000-0000-0000-000000000004', {
                RecordID: 'ext',
                // Skipped by the closure check as a lookup, and the string the exclusion's condition reads.
                EntityID: '@lookup:Entities.Name=Product Types',
            }),
        ],
        'config/queries/.data.json': [
            record('55555555-0000-0000-0000-000000000001', { EmbeddingModelID: 'ext', SQLDialectID: 'ext' }),
        ],
        'config/vector-indexes/.data.json': [record('55555555-0000-0000-0000-000000000002', { ExternalID: 'pinecone-idx' })],
    };
}

function fixture(files) {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'metadata-closure-'));
    roots.push(root);
    for (const [rel, body] of Object.entries(files)) {
        const full = path.join(root, rel);
        fs.mkdirSync(path.dirname(full), { recursive: true });
        fs.writeFileSync(full, JSON.stringify(body, null, 2));
    }
    return root;
}

function runGate(root) {
    return spawnSync(process.execPath, [GATE], {
        cwd: root,
        encoding: 'utf8',
        env: { ...process.env, SKIP_BASE_DELTA_CHECK: '1' },
    });
}

// ── The rejection this gate exists for ──────────────────────────────────────────────────────────

test('a reference to a primary key no file declares is a violation', () => {
    const files = baseFiles();
    files['generated/products/.data.json'][0].fields.ProductCategoryID = UNDECLARED;
    const run = runGate(fixture(files));
    assert.equal(run.status, 1);
    assert.match(run.stderr, /Metadata closure check FAILED: Unresolved foreign keys detected/);
    assert.match(run.stderr, /products\.ProductCategoryID: 1 orphans/);
});

// Target-aware: the id must be declared in the directory the field points AT, not merely somewhere.
// A ProductCategoryID holding a real person's id is the shape a bad join produces, and a gate that
// only asked "is this id known?" would pass it.
test('a reference resolving in the wrong directory is still a violation', () => {
    const files = baseFiles();
    files['generated/products/.data.json'][0].fields.ProductCategoryID = PERSON;
    const run = runGate(fixture(files));
    assert.equal(run.status, 1);
    assert.match(run.stderr, new RegExp(`${PERSON} \\(expected in product-categories\\)`));
});

// A field with no declared target directory falls back to global closure, which is the only rule
// covering the long tail of ID fields nobody has mapped.
test('an unmapped ID field pointing nowhere is a violation', () => {
    const files = baseFiles();
    files['generated/people/.data.json'][0].fields.PreferredChapterID = UNDECLARED;
    const run = runGate(fixture(files));
    assert.equal(run.status, 1);
    assert.match(run.stderr, /people\.PreferredChapterID: 1 orphans/);
});

test('the run reports how many orphans it found, not just the first', () => {
    const files = baseFiles();
    files['generated/people/.data.json'] = [
        record(PERSON, { Name: 'A', PreferredChapterID: UNDECLARED, SeniorityLevelID: 'ext' }),
        record('33333333-0000-0000-0000-000000000002', { Name: 'B', PreferredChapterID: UNDECLARED }),
    ];
    const run = runGate(fixture(files));
    assert.equal(run.status, 1);
    assert.match(run.stderr, /people\.PreferredChapterID: 2 orphans/);
});

// ── What closure allows ─────────────────────────────────────────────────────────────────────────

test('a closed reference set passes every audit', () => {
    const run = runGate(fixture(baseFiles()));
    assert.equal(run.status, 0, run.stderr);
    assert.match(run.stdout, /Total Orphaned References Found: *0/);
    assert.match(run.stdout, /ALL METADATA INTEGRITY CHECKS PASSED/);
});

test('reference casing does not decide closure', () => {
    const files = baseFiles();
    files['generated/products/.data.json'][0].fields.ProductCategoryID = CAT_MEMBERSHIPS.toLowerCase();
    assert.equal(runGate(fixture(files)).status, 0);
});

// Unresolved at push time by design: mj-sync resolves these itself, so they are not ours to close.
test('a @lookup: or @parent: reference is not a closure failure', () => {
    const files = baseFiles();
    files['generated/people/.data.json'][0].fields.ChapterID = '@lookup:Chapters.Name=Vermont';
    files['generated/people/.data.json'][0].fields.HouseholdID = '@parent:ID';
    assert.equal(runGate(fixture(files)).status, 0);
});

// Composed records — an order's lines, a payment's lines — declare their keys inside the parent file,
// and a gate that read only top-level records would call every reference to them an orphan.
test('a key declared inside a parent record resolves', () => {
    const files = baseFiles();
    files['generated/payments/.data.json'][0].relatedEntities = {
        'Payment Lines': [record('66666666-0000-0000-0000-000000000001', { Amount: 10 })],
    };
    files['generated/people/.data.json'][0].fields.LastPaymentLineID = '66666666-0000-0000-0000-000000000001';
    assert.equal(runGate(fixture(files)).status, 0);
});

// ── The states the gate refuses to call clean ───────────────────────────────────────────────────

// An exclusion is a standing claim that some field points outside this repo. When it stops matching
// anything the claim is stale, and a stale exclusion is a hole nobody is watching.
test('an exclusion that matches no record fails the run', () => {
    const files = baseFiles();
    delete files['config/vector-indexes/.data.json'];
    const run = runGate(fixture(files));
    assert.equal(run.status, 1);
    assert.match(run.stderr, /STALE EXCLUSION: vector-indexes\.ExternalID matched 0 records/);
});

// "Zero orphans" over zero references is what a tree that stopped being read reports, and it looks
// exactly like success.
test('evaluating zero references at all fails rather than passing', () => {
    const files = baseFiles();
    delete files['generated/products/.data.json'][0].fields.ProductCategoryID;
    for (const price of files['generated/product-prices/.data.json']) delete price.fields.ProductID;
    const run = runGate(fixture(files));
    assert.equal(run.status, 1);
    assert.match(run.stderr, /0 foreign key references were evaluated/);
});

test('one primary key claimed by two directories fails the run', () => {
    const files = baseFiles();
    files['generated/people/.data.json'].push(record(PRODUCT, { Name: 'Collides with a product' }));
    const run = runGate(fixture(files));
    assert.equal(run.status, 1);
    assert.match(run.stderr, new RegExp(`PK COLLISION: Primary Key ${PRODUCT} exists in both`));
});

test('an entity directory missing from directoryOrder fails the run', () => {
    const files = baseFiles();
    files['generated/people/.mj-sync.json'] = { entity: 'MoreCheese: People' };
    const run = runGate(fixture(files));
    assert.equal(run.status, 1);
    assert.match(run.stderr, /DIRECTORY ORDER AUDIT FAILED/);
    assert.match(run.stderr, /- people/);
});

// The load-bearing one: without an explicit null the push leaves the old `12` in place, and the four
// annual memberships start billing monthly.
test('an annual membership price without an explicit null RecurrenceMonths fails the run', () => {
    const files = baseFiles();
    files['generated/product-prices/.data.json'][0].fields.RecurrenceMonths = 12;
    const run = runGate(fixture(files));
    assert.equal(run.status, 1);
    assert.match(run.stderr, /must explicitly carry "RecurrenceMonths": null/);
    assert.match(run.stderr, /Found: 12/);
});

test('a missing annual membership price fails the run', () => {
    const files = baseFiles();
    files['generated/product-prices/.data.json'].shift();
    const run = runGate(fixture(files));
    assert.equal(run.status, 1);
    assert.match(run.stderr, new RegExp(`Required annual membership price ${ANNUAL_MEMBERSHIP_PRICE_IDS[0]} not found`));
});
