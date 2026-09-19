/**
 * Spec for the instruction-file health gate.
 *
 * Every case builds a throwaway repo root in a temp directory, so none of them depends on what is
 * checked in here today. That matters more than usual for this gate: its subject IS the checked-in
 * instruction files, so a spec that read the real tree would pass for as long as the tree happened
 * to be clean and would tell us nothing about whether the gate can still detect a violation.
 *
 * The last test is the exception, and is deliberately the other way round: it asserts the real tree
 * passes, which is what makes the gate's green in CI mean something.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { spawnSync } from 'node:child_process';
import {
    checkInstructionFiles,
    parseRuleFrontmatter,
    globToRegExp,
    extractReferences,
    isCheckableReference,
    countBraceExpansions,
    stripMaintainerComments,
    listRuleFiles,
    listSkillFiles,
} from './check-claude-md.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.join(HERE, '..');

/** Which checks failed, as a Set — assertions name the check, not the wording of its message. */
const failedChecks = (root) => new Set(checkInstructionFiles(root).failures.map((f) => f.check));
const messagesFor = (root, check) =>
    checkInstructionFiles(root).failures.filter((f) => f.check === check).map((f) => f.msg);

/**
 * A throwaway repo root that PASSES every check.
 *
 * Each test then breaks exactly one thing, so a failure names the check that caught it rather than
 * whatever else happened to be wrong in a hand-built fixture.
 */
function makeCleanRepo(overrides = {}) {
    const root = mkdtempSync(path.join(tmpdir(), 'claude-md-gate-'));

    const write = (rel, body) => {
        const full = path.join(root, rel);
        mkdirSync(path.dirname(full), { recursive: true });
        writeFileSync(full, body);
    };

    // A real file for the rule's glob to match.
    write('src/thing.ts', 'export const x = 1;\n');
    write('docs/guide.md', '# guide\n');

    write('.claude/rules/style.md', ['---', 'paths:', '  - "src/**/*.ts"', '---', '', '# Style', ''].join('\n'));

    write('CLAUDE.md', [
        '# Fixture',
        '',
        'Routing table:',
        '',
        '- [style](.claude/rules/style.md)',
        '- [guide](docs/guide.md)',
        '',
    ].join('\n'));

    write('.claude/claude-md-manifest.json', JSON.stringify({
        baseline: { gitRev: 'abc1234', files: [] },
        budget: { file: 'CLAUDE.md', maxLines: 50, maxBytes: 4000 },
        sections: [
            { source: 'CLAUDE.md', title: 'Kept', destinations: ['root'] },
            { source: 'old.md', title: 'Moved', destinations: ['rule:.claude/rules/style.md'] },
            { source: 'old.md', title: 'Dropped', destinations: ['deleted'], reason: 'Described a suite that does not exist.' },
        ],
    }, null, 2));

    for (const [rel, body] of Object.entries(overrides)) {
        if (body === null) rmSync(path.join(root, rel), { force: true });
        else write(rel, body);
    }
    return root;
}

const manifestWith = (sections, budget = { file: 'CLAUDE.md', maxLines: 50, maxBytes: 4000 }) =>
    JSON.stringify({ baseline: { gitRev: 'abc1234', files: [] }, budget, sections }, null, 2);

// ── the fixture itself ────────────────────────────────────────────────────────────────────────

test('the clean fixture passes every check', () => {
    const { failures } = checkInstructionFiles(makeCleanRepo());
    assert.deepEqual(failures, [], `clean fixture should pass, got: ${JSON.stringify(failures, null, 2)}`);
});

// ── CHECK 1 — COMPLETENESS ────────────────────────────────────────────────────────────────────

test('completeness: a section with no destinations is a hard error', () => {
    const root = makeCleanRepo({
        '.claude/claude-md-manifest.json': manifestWith([{ source: 'old.md', title: 'Orphan', destinations: [] }]),
    });
    assert.ok(failedChecks(root).has('completeness'));
});

test('completeness: a destination that does not exist on disk is a hard error', () => {
    const root = makeCleanRepo({
        '.claude/claude-md-manifest.json': manifestWith([
            { source: 'old.md', title: 'Moved', destinations: ['rule:.claude/rules/nonexistent.md'] },
        ]),
    });
    assert.ok(failedChecks(root).has('completeness'));
});

test('completeness: a deletion without a reason is a hard error', () => {
    const root = makeCleanRepo({
        '.claude/claude-md-manifest.json': manifestWith([
            { source: 'old.md', title: 'Dropped', destinations: ['deleted'] },
        ]),
    });
    const msgs = messagesFor(root, 'completeness');
    assert.equal(msgs.length, 1);
    assert.match(msgs[0], /without a reason/);
});

test('completeness: a deletion WITH a reason is accepted', () => {
    const root = makeCleanRepo({
        '.claude/claude-md-manifest.json': manifestWith([
            { source: 'old.md', title: 'Dropped', destinations: ['deleted'], reason: 'Superseded by the gate suite.' },
        ]),
    });
    assert.ok(!failedChecks(root).has('completeness'));
});

test('completeness: an unknown destination grammar is a hard error', () => {
    const root = makeCleanRepo({
        '.claude/claude-md-manifest.json': manifestWith([
            { source: 'old.md', title: 'Moved', destinations: ['somewhere-else'] },
        ]),
    });
    assert.ok(failedChecks(root).has('completeness'));
});

test('completeness: a missing manifest is a hard error, not a skip', () => {
    const root = makeCleanRepo({ '.claude/claude-md-manifest.json': null });
    assert.ok(failedChecks(root).has('completeness'));
});

test('completeness: a malformed manifest reports the JSON error rather than throwing', () => {
    const root = makeCleanRepo({ '.claude/claude-md-manifest.json': '{ not json' });
    const msgs = messagesFor(root, 'completeness');
    assert.ok(msgs.some((m) => /not valid JSON/.test(m)));
});

// ── CHECK 2 — BUDGET ──────────────────────────────────────────────────────────────────────────

test('budget: a root file over the line ceiling fails', () => {
    const root = makeCleanRepo({
        'CLAUDE.md': ['# Fixture', '- [style](.claude/rules/style.md)', '- [guide](docs/guide.md)']
            .concat(Array(80).fill('padding'))
            .join('\n'),
    });
    const msgs = messagesFor(root, 'budget');
    assert.ok(msgs.some((m) => /line ceiling/.test(m)), msgs.join('\n'));
});

test('budget: a root file over the byte ceiling fails even when the line count is fine', () => {
    const root = makeCleanRepo({
        '.claude/claude-md-manifest.json': manifestWith(
            [{ source: 'CLAUDE.md', title: 'Kept', destinations: ['root'] }],
            { file: 'CLAUDE.md', maxLines: 5000, maxBytes: 10 },
        ),
    });
    const msgs = messagesFor(root, 'budget');
    assert.ok(msgs.some((m) => /byte ceiling/.test(m)), msgs.join('\n'));
});

// ── CHECK 3 — REFERENCES ──────────────────────────────────────────────────────────────────────

test('references: a dead markdown link fails', () => {
    const root = makeCleanRepo({
        'CLAUDE.md': '# Fixture\n\n- [style](.claude/rules/style.md)\n- [guide](docs/guide.md)\n- [gone](docs/deleted.md)\n',
    });
    assert.ok(failedChecks(root).has('references'));
});

test('references: a link escaping the repository root fails', () => {
    const root = makeCleanRepo({
        'CLAUDE.md': '# Fixture\n\n- [style](.claude/rules/style.md)\n- [guide](docs/guide.md)\n- [outside](../../etc/passwd)\n',
    });
    const msgs = messagesFor(root, 'references');
    assert.ok(msgs.some((m) => /escapes the repository root/.test(m)), msgs.join('\n'));
});

test('references: external URLs and bare anchors are not filesystem claims', () => {
    const root = makeCleanRepo({
        'CLAUDE.md': [
            '# Fixture',
            '- [style](.claude/rules/style.md)',
            '- [guide](docs/guide.md)',
            '- [mj](https://github.com/MemberJunction/MJ/blob/next/CLAUDE.md)',
            '- [section](#where-new-guidance-goes)',
            '- [mail](mailto:someone@example.com)',
        ].join('\n'),
    });
    assert.ok(!failedChecks(root).has('references'));
});

test('references: links inside fenced code blocks are examples, not claims', () => {
    const root = makeCleanRepo({
        'CLAUDE.md': [
            '# Fixture',
            '- [style](.claude/rules/style.md)',
            '- [guide](docs/guide.md)',
            '',
            '```md',
            '[example](docs/does-not-exist.md)',
            '```',
        ].join('\n'),
    });
    assert.ok(!failedChecks(root).has('references'));
});

test('references: a backticked path is prose, NOT a checked claim', () => {
    // Deliberate: `origin/next`, `/compact`, and MJ-repo paths are all legitimately unresolvable
    // here. Checking them would make the gate cry wolf. See extractReferences.
    const root = makeCleanRepo({
        'CLAUDE.md': [
            '# Fixture',
            '- [style](.claude/rules/style.md)',
            '- [guide](docs/guide.md)',
            '',
            'Never push to `origin/next`, and survive `/compact`.',
            'MJ ships `guides/CACHING_AND_PUBSUB_GUIDE.md`, which is not in this repo.',
        ].join('\n'),
    });
    assert.ok(!failedChecks(root).has('references'));
});

// ── CHECK 4 — ROUTING ─────────────────────────────────────────────────────────────────────────

test('routing: a rule on disk that the routing table never mentions fails', () => {
    const root = makeCleanRepo({
        '.claude/rules/orphan.md': ['---', 'paths:', '  - "src/**/*.ts"', '---', '', '# Orphan', ''].join('\n'),
    });
    const msgs = messagesFor(root, 'routing');
    assert.ok(msgs.some((m) => /orphan\.md/.test(m)), msgs.join('\n'));
});

test('routing: a skill the routing table never mentions fails', () => {
    const root = makeCleanRepo({
        '.claude/skills/secret-skill/SKILL.md': '# Secret skill\n',
    });
    const msgs = messagesFor(root, 'routing');
    assert.ok(msgs.some((m) => /secret-skill/.test(m)), msgs.join('\n'));
});

test('routing: a nested CLAUDE.md the routing table never mentions fails', () => {
    const root = makeCleanRepo({ 'packages/Thing/CLAUDE.md': '# Thing\n' });
    const msgs = messagesFor(root, 'routing');
    assert.ok(msgs.some((m) => /packages\/Thing\/CLAUDE\.md/.test(m)), msgs.join('\n'));
});

// ── CHECK 5 — RULES ───────────────────────────────────────────────────────────────────────────

test('rules: a rule with no frontmatter fails', () => {
    const root = makeCleanRepo({ '.claude/rules/style.md': '# Style\n\nNo frontmatter here.\n' });
    assert.ok(failedChecks(root).has('rules'));
});

test('rules: a rule with frontmatter but NO paths key fails loudly', () => {
    // The subtle one. Without `paths` the rule loads unconditionally at launch — omitting it does
    // not scope the rule down, it makes it permanent.
    const root = makeCleanRepo({
        '.claude/rules/style.md': ['---', 'description: some rule', '---', '', '# Style', ''].join('\n'),
    });
    const msgs = messagesFor(root, 'rules');
    assert.ok(msgs.some((m) => /UNCONDITIONALLY/.test(m)), msgs.join('\n'));
});

test('rules: a rule with an empty paths list fails', () => {
    const root = makeCleanRepo({
        '.claude/rules/style.md': ['---', 'paths:', '---', '', '# Style', ''].join('\n'),
    });
    assert.ok(failedChecks(root).has('rules'));
});

test('rules: a glob matching nothing on disk fails — the cargo-cult guard', () => {
    // This is what would have caught copying MJ's testing.md (.test.ts) or design-tokens.md (.scss)
    // into a repo that has neither.
    const root = makeCleanRepo({
        '.claude/rules/style.md': ['---', 'paths:', '  - "**/*.scss"', '---', '', '# Style', ''].join('\n'),
    });
    const msgs = messagesFor(root, 'rules');
    assert.ok(msgs.some((m) => /can never fire/.test(m)), msgs.join('\n'));
});

// ── unit: frontmatter parsing ─────────────────────────────────────────────────────────────────

test('parseRuleFrontmatter reads a quoted paths sequence', () => {
    const r = parseRuleFrontmatter(['---', 'paths:', '  - "src/**/*.ts"', '  - \'lib/**\'', '---', '', '# x'].join('\n'));
    assert.deepEqual(r, { hasFrontmatter: true, hasPathsKey: true, paths: ['src/**/*.ts', 'lib/**'] });
});

test('parseRuleFrontmatter stops the sequence at the next top-level key', () => {
    const r = parseRuleFrontmatter(['---', 'paths:', '  - "a/**"', 'description: x', '---', '', '# x'].join('\n'));
    assert.deepEqual(r.paths, ['a/**']);
});

test('parseRuleFrontmatter reports absent frontmatter distinctly from absent paths', () => {
    assert.equal(parseRuleFrontmatter('# no frontmatter').hasFrontmatter, false);
    assert.equal(parseRuleFrontmatter('---\ndescription: x\n---\n').hasPathsKey, false);
});

// ── unit: glob translation ────────────────────────────────────────────────────────────────────

test('globToRegExp handles the patterns Claude Code documents', () => {
    const m = (glob, p) => globToRegExp(glob).test(p);

    assert.ok(m('**/*.ts', 'src/deep/thing.ts'));
    assert.ok(m('**/*.ts', 'thing.ts'), '**/ must match zero segments too');
    assert.ok(!m('**/*.ts', 'src/thing.tsx'));

    assert.ok(m('src/**/*', 'src/a/b.txt'));
    assert.ok(!m('src/**/*', 'lib/a.txt'));

    assert.ok(m('*.md', 'README.md'));
    assert.ok(!m('*.md', 'docs/README.md'), 'a bare *.md is root-only');

    assert.ok(m('packages/*/src/generated/**', 'packages/Entities/src/generated/entity_subclasses.ts'));
    assert.ok(!m('packages/*/src/generated/**', 'packages/Entities/src/index.ts'));

    assert.ok(m('src/**/*.{ts,tsx}', 'src/a/b.tsx'));
    assert.ok(m('scripts/*.mjs', 'scripts/check-peer-ranges.mjs'));
    assert.ok(!m('scripts/*.mjs', 'scripts/sub/deep.mjs'));
});

test('globToRegExp escapes regex metacharacters in literal segments', () => {
    assert.ok(globToRegExp('.changeset/**').test('.changeset/foo.md'));
    assert.ok(!globToRegExp('.changeset/**').test('Xchangeset/foo.md'));
});

test('globToRegExp treats a comma OUTSIDE braces as a literal, not alternation', () => {
    // Regression: every "," was translated to "|" regardless of brace depth, so a filename
    // containing a comma became an alternation matching two things it should not.
    const re = globToRegExp('docs/a,b.md');
    assert.ok(re.test('docs/a,b.md'));
    assert.ok(!re.test('docs/a'), 'must not match the left alternative');
    assert.ok(!re.test('b.md'), 'must not match the right alternative');
});

test('globToRegExp reads [ as a bracket expression, as Claude Code does', () => {
    assert.ok(globToRegExp('src/v[0-9]/*.ts').test('src/v2/a.ts'));
    assert.ok(!globToRegExp('src/v[0-9]/*.ts').test('src/vx/a.ts'));
    assert.ok(globToRegExp('src/[abc].ts').test('src/b.ts'));
    assert.ok(!globToRegExp('src/[abc].ts').test('src/d.ts'));
    assert.ok(globToRegExp('src/[!abc].ts').test('src/d.ts'), 'negation');
    assert.ok(!globToRegExp('src/[!abc].ts').test('src/a.ts'));
});

test('globToRegExp returns null for a pattern Claude Code treats as invalid', () => {
    // Documented: `photos [2024/**` cannot be read as a bracket expression, so it matches nothing
    // while the rule's other patterns keep working.
    assert.equal(globToRegExp('photos [2024/**'), null);
    assert.equal(globToRegExp('src/{a,b/*.ts'), null, 'unbalanced brace');
    assert.equal(globToRegExp('src/trailing\\'), null, 'trailing backslash');
});

test('globToRegExp matches a literal bracket when it is escaped', () => {
    assert.ok(globToRegExp('photos \\[2024\\]/**').test('photos [2024]/a.jpg'));
});

test('countBraceExpansions multiplies brace groups and ignores brace-free patterns', () => {
    assert.equal(countBraceExpansions(['**/*.ts']), 0, 'no braces means no budget cost');
    assert.equal(countBraceExpansions(['src/*.{ts,tsx}']), 2);
    assert.equal(countBraceExpansions(['{a,b}/{c,d}/*.{ts,tsx}']), 8);
    assert.equal(countBraceExpansions(['src/*.{ts,tsx}', '{a,b,c}/**']), 5);
});

test('rules: a paths list over the brace-expansion budget fails', () => {
    // Over the budget Claude Code uses the pattern unexpanded, and its literal braces match
    // nothing — the rule silently stops firing.
    const many = Array.from({ length: 11 }, () => '{a,b,c,d}').join('/');
    const root = makeCleanRepo({
        '.claude/rules/style.md': ['---', 'paths:', '  - "src/**/*.ts"', `  - "${many}/*.ts"`, '---', '', '# Style'].join('\n'),
    });
    const msgs = messagesFor(root, 'rules');
    assert.ok(msgs.some((m) => /pattern budget/.test(m)), msgs.join('\n'));
});

test('rules: an invalid glob is reported as invalid, not as matching nothing', () => {
    const root = makeCleanRepo({
        '.claude/rules/style.md': ['---', 'paths:', '  - "photos [2024/**"', '---', '', '# Style'].join('\n'),
    });
    const msgs = messagesFor(root, 'rules');
    assert.ok(msgs.some((m) => /not a valid pattern/.test(m)), msgs.join('\n'));
});

// ── unit: effective size ──────────────────────────────────────────────────────────────────────

test('stripMaintainerComments removes block-level HTML comments', () => {
    const out = stripMaintainerComments(['# Title', '<!-- a note -->', 'body', '<!--', 'multi', 'line', '-->', 'tail'].join('\n'));
    assert.equal(out.replace(/\n+/g, '\n'), '# Title\nbody\ntail');
});

test('stripMaintainerComments preserves comments inside fenced code blocks', () => {
    // Those are not stripped by Claude Code, so they still cost context and still count.
    const src = ['# Title', '```html', '<!-- shown to the reader -->', '```', 'tail'].join('\n');
    assert.ok(stripMaintainerComments(src).includes('<!-- shown to the reader -->'));
});

test('budget measures effective size, so maintainer comments are free', () => {
    const padding = Array(40).fill('<!-- a maintainer note that never reaches context -->').join('\n');
    const root = makeCleanRepo({
        'CLAUDE.md': ['# Fixture', '- [style](.claude/rules/style.md)', '- [guide](docs/guide.md)', padding].join('\n'),
    });
    assert.ok(!failedChecks(root).has('budget'), 'comment lines must not count against the ceiling');
});

// ── nested .claude/ directories ───────────────────────────────────────────────────────────────

test('listRuleFiles finds rules in nested .claude/rules/ directories', () => {
    const root = makeCleanRepo({
        'packages/api/.claude/rules/api.md': ['---', 'paths:', '  - "src/**/*.ts"', '---', '', '# API'].join('\n'),
    });
    const found = listRuleFiles(root);
    assert.ok(found.includes('packages/api/.claude/rules/api.md'), found.join(', '));
    assert.ok(found.includes('.claude/rules/style.md'));
});

test('routing: a rule in a nested .claude/rules/ must still be routed', () => {
    const root = makeCleanRepo({
        'packages/api/.claude/rules/api.md': ['---', 'paths:', '  - "src/**/*.ts"', '---', '', '# API'].join('\n'),
    });
    const msgs = messagesFor(root, 'routing');
    assert.ok(msgs.some((m) => /packages\/api\/\.claude\/rules\/api\.md/.test(m)), msgs.join('\n'));
});

test('listSkillFiles finds per-directory skills as well as root ones', () => {
    const root = makeCleanRepo({
        '.claude/skills/root-skill/SKILL.md': '# root\n',
        'packages/api/.claude/skills/api-skill/SKILL.md': '# api\n',
    });
    const found = listSkillFiles(root);
    assert.ok(found.includes('.claude/skills/root-skill/SKILL.md'), found.join(', '));
    assert.ok(found.includes('packages/api/.claude/skills/api-skill/SKILL.md'), found.join(', '));
});

test('routing: .claude/CLAUDE.md is the project file, not a nested one to route', () => {
    // `./CLAUDE.md` and `./.claude/CLAUDE.md` are both valid locations for the PROJECT file, so the
    // latter must not be demanded in the routing table the way a per-directory file is.
    const root = makeCleanRepo({ '.claude/CLAUDE.md': '# alternative project file location\n' });
    const msgs = messagesFor(root, 'routing');
    assert.ok(!msgs.some((m) => /\.claude\/CLAUDE\.md/.test(m)), msgs.join('\n'));
});

// ── unit: reference classification ────────────────────────────────────────────────────────────

test('extractReferences takes markdown links and skips fenced blocks', () => {
    const refs = extractReferences('[a](one.md)\n```\n[b](two.md)\n```\n[c](three.md)');
    assert.deepEqual(refs.map((r) => r.ref), ['one.md', 'three.md']);
});

test('isCheckableReference rejects what is not a filesystem claim', () => {
    for (const ref of ['https://x.com/y', 'mailto:a@b.c', '#anchor', '@memberjunction/core', 'packages/dev-apps/<this-repo>/migrations', '${flyway:defaultSchema}']) {
        assert.equal(isCheckableReference(ref), false, `${ref} should not be checkable`);
    }
    for (const ref of ['docs/guide.md', '.claude/rules/style.md', '../../CLAUDE.md']) {
        assert.equal(isCheckableReference(ref), true, `${ref} should be checkable`);
    }
});

// ── the CLI contract ──────────────────────────────────────────────────────────────────────────

test('a failing repo signals failure through the exit status, not just stderr', () => {
    const root = makeCleanRepo({
        '.claude/claude-md-manifest.json': manifestWith([{ source: 'x', title: 'Orphan', destinations: [] }]),
    });
    const r = spawnSync(process.execPath, [path.join(HERE, 'check-claude-md.mjs'), '--root', root, '--quiet'], { encoding: 'utf8' });
    assert.equal(r.status, 1);
    assert.match(r.stderr, /COMPLETENESS/);
});

test('a clean repo exits zero', () => {
    const r = spawnSync(process.execPath, [path.join(HERE, 'check-claude-md.mjs'), '--root', makeCleanRepo(), '--quiet'], { encoding: 'utf8' });
    assert.equal(r.status, 0, r.stderr);
});

// ── the real tree ─────────────────────────────────────────────────────────────────────────────

test('the instruction files checked in here pass the gate', () => {
    const { failures } = checkInstructionFiles(REPO_ROOT);
    assert.deepEqual(failures, [], `real tree should pass, got:\n${failures.map((f) => `${f.check}: ${f.msg}`).join('\n')}`);
});
