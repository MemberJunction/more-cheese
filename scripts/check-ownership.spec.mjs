/**
 * Spec for the ownership gate.
 *
 * The gate answers one question: is every directory under `config/` and `generated/` claimed by
 * `data/ownership.json`, and does every claim in that manifest point at something real? Both halves
 * rot silently — a new Loom output directory lands unclaimed, or a directory is renamed and the
 * manifest keeps naming the old one — and neither shows up in a build.
 *
 * WHAT THE GATE DOES NOT ENFORCE, since the task that added this spec asked: there is no
 * "doubly-claimed directory" rule, and there cannot be one — `ownership.directories` is a JSON
 * object keyed by directory name, so a second claim on the same directory is collapsed by
 * `JSON.parse` before the gate ever sees it. The enforced violation is the unclaimed one (a
 * directory on disk with no manifest entry) and its mirror (a manifest entry with no directory).
 *
 * The gate is one top-level program with no exported seam; it reads `process.cwd()`. So each case
 * builds a throwaway repo root and runs the CLI against it, which also means the exit status is
 * covered rather than assumed.
 */
import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const GATE = path.join(HERE, 'check-ownership.mjs');

const roots = [];
after(() => {
    for (const root of roots) fs.rmSync(root, { recursive: true, force: true });
});

const CONFIG_ENTRY = { tier: 'config', classification: 'config', reason: 'Hand-authored taxonomy' };
const LOOM_ENTRY = { tier: 'generated', classification: 'loom', reason: 'Loom-generated synthetic data' };

/**
 * A throwaway repo root.
 *
 * `configDirs` and `generatedDirs` are created on disk; `ownership`, `domain` and `configEntities`
 * are written as the three data files the gate reads. Each defaults to the consistent value, so a
 * case states only the thing it is about.
 */
function fixture({ configDirs = [], generatedDirs = [], ownership, domain, configEntities } = {}) {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'ownership-'));
    roots.push(root);
    for (const dir of configDirs) fs.mkdirSync(path.join(root, 'config', dir), { recursive: true });
    for (const dir of generatedDirs) fs.mkdirSync(path.join(root, 'generated', dir), { recursive: true });
    fs.mkdirSync(path.join(root, 'data'), { recursive: true });

    const directories = Object.fromEntries([
        ...configDirs.map((d) => [d, CONFIG_ENTRY]),
        ...generatedDirs.map((d) => [d, LOOM_ENTRY]),
    ]);
    const write = (name, value) => fs.writeFileSync(path.join(root, 'data', name), JSON.stringify(value, null, 2));
    if (ownership !== null) write('ownership.json', ownership ?? { version: 1, directories });
    write('domain.json', domain ?? { entities: Object.fromEntries(generatedDirs.map((d) => [d, { outputDirectory: d }])) });
    write('config-entities.json', configEntities ?? configDirs.map((d) => ({ directory: d })));
    return root;
}

function runGate(root) {
    return spawnSync(process.execPath, [GATE], { cwd: root, encoding: 'utf8' });
}

// ── The rejection this gate exists for ──────────────────────────────────────────────────────────

test('a generated directory no manifest entry claims is a violation', () => {
    const root = fixture({ generatedDirs: ['people'] });
    const ownership = JSON.parse(fs.readFileSync(path.join(root, 'data/ownership.json'), 'utf8'));
    delete ownership.directories.people;
    fs.writeFileSync(path.join(root, 'data/ownership.json'), JSON.stringify(ownership));

    const run = runGate(root);
    assert.equal(run.status, 1);
    assert.match(run.stderr, /Unclassified directory in generated\/: people/);
    assert.match(run.stderr, /Ownership audit failed with 1 error/);
});

test('a config directory no manifest entry claims is a violation', () => {
    const root = fixture({ configDirs: ['ai-models'], ownership: { version: 1, directories: {} }, configEntities: [] });
    const run = runGate(root);
    assert.equal(run.status, 1);
    assert.match(run.stderr, /Unclassified directory in config\/: ai-models/);
});

test('a manifest entry with no directory on disk is a violation', () => {
    const root = fixture({ ownership: { version: 1, directories: { 'renamed-away': LOOM_ENTRY } } });
    const run = runGate(root);
    assert.equal(run.status, 1);
    assert.match(run.stderr, /Directory in ownership manifest does not exist on disk: renamed-away/);
});

// ── The rest of the manifest's contract ─────────────────────────────────────────────────────────

test('a loom directory absent from domain.json is a violation', () => {
    const root = fixture({ generatedDirs: ['people'], domain: { entities: {} } });
    const run = runGate(root);
    assert.equal(run.status, 1);
    assert.match(run.stderr, /classified as 'loom' is not declared in data\/domain\.json: people/);
});

test('a config directory claimed with the generated tier is a violation', () => {
    const root = fixture({
        configDirs: ['ai-models'],
        ownership: { version: 1, directories: { 'ai-models': { ...CONFIG_ENTRY, tier: 'generated' } } },
    });
    const run = runGate(root);
    assert.equal(run.status, 1);
    assert.match(run.stderr, /tier mismatch: ai-models \(tier: generated\)/);
});

test('a generated directory classified as config is a violation', () => {
    const root = fixture({
        generatedDirs: ['people'],
        ownership: { version: 1, directories: { people: { ...LOOM_ENTRY, classification: 'config' } } },
    });
    const run = runGate(root);
    assert.equal(run.status, 1);
    assert.match(run.stderr, /must be classified loom or frozen, got config: people/);
});

// A blank reason is the shape a claim takes when somebody adds a directory to quiet the gate without
// deciding what it is, which is the state the manifest exists to prevent.
test('a claim with an empty reason is a violation', () => {
    const root = fixture({
        generatedDirs: ['people'],
        ownership: { version: 1, directories: { people: { ...LOOM_ENTRY, reason: '   ' } } },
    });
    const run = runGate(root);
    assert.equal(run.status, 1);
    assert.match(run.stderr, /Missing classification reason for generated\/: people/);
});

test('a frozen directory whose reason is not one of the approved rulings is a violation', () => {
    const root = fixture({
        generatedDirs: ['some-frozen-dir'],
        ownership: {
            version: 1,
            directories: { 'some-frozen-dir': { tier: 'generated', classification: 'frozen', reason: 'because' } },
        },
    });
    const run = runGate(root);
    assert.equal(run.status, 1);
    assert.match(run.stderr, /Unapproved frozen directory or reason: some-frozen-dir/);
});

test('a config directory missing from config-entities.json is a violation', () => {
    const root = fixture({ configDirs: ['ai-models'], configEntities: [] });
    const run = runGate(root);
    assert.equal(run.status, 1);
    assert.match(run.stderr, /Directory in config\/ missing from data\/config-entities\.json: ai-models/);
});

test('an entity in config-entities.json with no directory in config/ is a violation', () => {
    const root = fixture({ configDirs: ['ai-models'], configEntities: [{ directory: 'ai-models' }, { directory: 'ghost' }] });
    const run = runGate(root);
    assert.equal(run.status, 1);
    assert.match(run.stderr, /Entity in data\/config-entities\.json missing from config\/: ghost/);
});

test('every error is reported, not just the first', () => {
    const root = fixture({ generatedDirs: ['people', 'orders'], ownership: { version: 1, directories: {} } });
    const run = runGate(root);
    assert.equal(run.status, 1);
    assert.match(run.stderr, /Ownership audit failed with 2 error\(s\)/);
});

test('a missing ownership manifest fails rather than passing over nothing', () => {
    const root = fixture({ ownership: null });
    const run = runGate(root);
    assert.equal(run.status, 1);
    assert.match(run.stderr, /Missing data\/ownership\.json/);
});

// ── What the manifest is allowed to say ─────────────────────────────────────────────────────────

test('a manifest whose every entry resolves passes', () => {
    const run = runGate(fixture({ configDirs: ['ai-models'], generatedDirs: ['people'] }));
    assert.equal(run.status, 0, run.stderr);
    assert.match(run.stdout, /Ownership manifest and directory partitioning audit passed/);
});

// `schema-info` is the one manifest entry deliberately exempted from needing a directory on disk.
test('the schema-info entry needs no directory on disk', () => {
    const root = fixture({ ownership: { version: 1, directories: { 'schema-info': CONFIG_ENTRY } } });
    const run = runGate(root);
    assert.equal(run.status, 0, run.stderr);
});

test('a repo root with no config or generated directories yet passes', () => {
    const run = runGate(fixture({}));
    assert.equal(run.status, 0, run.stderr);
    assert.match(run.stdout, /0 config\/ and 0 generated\/ directories/);
});
