#!/usr/bin/env node
/**
 * Instruction-file health gate — keep the agent rulebook small, live, and honest.
 *
 * NEW HERE, not ported. `bizapps-forms` has the rules layout this repo adopted but no gate over it;
 * MJ has the gate (`.github/scripts/check-claude-md.mjs`) and this is adapted from it, with the
 * checks that only make sense for a repo of MJ's shape dropped and two added that this repo needs.
 *
 * WHY THIS EXISTS. MJ's root CLAUDE.md reached 2,256 lines. Not through carelessness — through one
 * reasonable-seeming addition at a time, each individually defensible, none of them the one that
 * broke it. Nothing in a PR diff tells a reviewer that an instruction file has crossed the line
 * where it stops being read. A committed ceiling is what converts "keep it small" from an intention
 * into a property of the repo. Three sibling repos are at ~2,010 lines right now.
 *
 * The second failure mode is quieter. `docs/claude/` held 512 lines of MJ guidance that nothing
 * loaded, in files eight of which were still byte-identical to the template they were scaffolded
 * from. Documentation that no mechanism delivers and no gate checks does not stay true; it just
 * stops being wrong out loud.
 *
 * ── CHECK 1 — COMPLETENESS ────────────────────────────────────────────────────────────────────
 * Every section in the manifest has a destination, every destination exists on disk, and every
 * deletion carries a reason. This is the "we lost nothing" evidence: the refactor moved content
 * between files, so a reviewer cannot confirm it from `git diff`, where every relocated line is
 * both a deletion and an addition.
 *
 * ── CHECK 2 — BUDGET ──────────────────────────────────────────────────────────────────────────
 * Root CLAUDE.md stays under its committed ceiling. Claude Code's own guidance is ~200 lines:
 * longer files consume context AND reduce adherence, so this is a correctness ceiling, not a
 * tidiness one.
 *
 * Measured EFFECTIVE, not raw. Claude Code strips block-level HTML comments before injecting a
 * CLAUDE.md into context, and blank lines cost nothing, so counting raw would charge the file for
 * maintainer notes that are free and discourage exactly the commenting the docs recommend.
 *
 * ── CHECK 3 — REFERENCES ──────────────────────────────────────────────────────────────────────
 * Every markdown link in every instruction file resolves. Instruction files are read by agents that
 * will act on what a path claims to contain, so a dead link is worse than a missing sentence: it
 * asserts something exists. Backticked paths are deliberately NOT checked — see extractReferences
 * for why that is a decision and not an oversight.
 *
 * ── CHECK 4 — ROUTING ─────────────────────────────────────────────────────────────────────────
 * Every rule, every nested CLAUDE.md, and every skill on disk appears in root's routing table. A
 * rule nobody can find is a rule nobody follows, and path-scoped rules are invisible by design —
 * they do not announce themselves until you happen to open a matching file.
 *
 * Discovery covers NESTED `.claude/` directories (`packages/Foo/.claude/rules/`, `.../skills/`),
 * which Claude Code loads too. `.claude/CLAUDE.md` is excluded: that is an alternative location
 * for the PROJECT file, not a per-directory one, so it is not the routing table's job to list it.
 *
 * ── CHECK 5 — RULES ───────────────────────────────────────────────────────────────────────────
 * Frontmatter parses, `paths` is PRESENT, every glob is valid, every glob matches at least one
 * tracked file, and the `paths` list stays inside Claude Code's 1,000-pattern brace budget.
 *
 * The `paths` requirement is the subtle one and the reason this check earns its place. Per Claude
 * Code's documented behaviour, a rule WITHOUT `paths` is loaded unconditionally at launch, at the
 * same priority as CLAUDE.md. So omitting `paths` does not scope a rule down — it silently makes
 * it permanent, defeating the entire arrangement while looking like a smaller file.
 *
 * The match-something requirement catches the other direction: cargo-culting a sibling repo's rule
 * set. MJ ships a `testing.md` scoped to `.test.ts` files and a `design-tokens.md` scoped to `.scss`
 * files. This repo has zero of each. Copied over, both would have sat in .claude/rules/ looking like
 * coverage and firing never.
 *
 * Usage:  node scripts/check-claude-md.mjs [--root <dir>] [--quiet] [--self-test]
 * Exit:   0 = all checks pass, 1 = at least one failure.
 */

import { readFileSync, existsSync, statSync, readdirSync } from 'node:fs';
import { join, dirname, resolve, relative, posix } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const HERE = dirname(fileURLToPath(import.meta.url));

const MANIFEST_PATH = '.claude/claude-md-manifest.json';
const ROOT_FILE = 'CLAUDE.md';
const RULES_DIR = '.claude/rules';
const SKILLS_DIR = '.claude/skills';

/** Directories never worth walking for instruction files or glob matches. */
const IGNORED_DIRS = new Set(['node_modules', '.git', 'dist', 'coverage', '.turbo']);

/** Claude Code gives a rule's whole `paths` list one budget of this many expanded patterns. */
const BRACE_EXPANSION_BUDGET = 1000;

/**
 * A reference into `.changeset/` that `changeset version` will delete at release.
 *
 * README.md and config.json are checked in and outlive every release; the changesets themselves
 * are consumed the moment a release is cut. An instruction file linking one therefore resolves on
 * `next` and dangles on the release branch — so the gate has to reject it HERE, while the file is
 * still on disk, rather than discovering it after the release branch exists.
 */
const EPHEMERAL_CHANGESET = /^\.changeset\/(?!README\.md$|config\.json$)/;

// ─────────────────────────────────────────────────────────────────────────────────────────────
// Pure helpers — exported so the spec can exercise them without a subprocess.
// ─────────────────────────────────────────────────────────────────────────────────────────────

/**
 * Parse the `paths:` list out of a rule's YAML frontmatter.
 *
 * Deliberately a small hand-rolled reader rather than js-yaml: the only shape a rule is allowed to
 * have is a `paths` sequence of quoted strings, and accepting more would mean accepting rules whose
 * frontmatter Claude Code itself may not read the way this gate does.
 *
 * @returns {{ hasFrontmatter: boolean, hasPathsKey: boolean, paths: string[] }}
 */
export function parseRuleFrontmatter(text) {
    const m = /^---\r?\n([\s\S]*?)\r?\n---/.exec(text);
    if (!m) return { hasFrontmatter: false, hasPathsKey: false, paths: [] };

    const body = m[1];
    const lines = body.split(/\r?\n/);
    const paths = [];
    let inPaths = false;
    let hasPathsKey = false;

    for (const line of lines) {
        if (/^paths\s*:/.test(line)) {
            inPaths = true;
            hasPathsKey = true;
            continue;
        }
        if (inPaths) {
            const item = /^\s*-\s*(.+?)\s*$/.exec(line);
            if (item) {
                paths.push(item[1].replace(/^["']|["']$/g, ''));
                continue;
            }
            if (/^\S/.test(line)) inPaths = false; // a new top-level key ends the sequence
        }
    }
    return { hasFrontmatter: true, hasPathsKey, paths };
}

/** Escape a literal character for use inside a RegExp. */
const esc = (c) => c.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * Translate one `paths` glob into a RegExp over POSIX-style repo-relative paths, or return `null`
 * for a pattern Claude Code treats as invalid.
 *
 * Mirrors the syntax Claude Code documents: `**` across directories, `*` within a segment, `?`,
 * `{a,b}` brace expansion, and `[abc]` / `[a-z]` / `[!abc]` bracket expressions.
 *
 * Three details here were wrong in the first version of this gate, and each mattered:
 *
 *   1. `,` was translated to alternation UNCONDITIONALLY. Outside a brace group a comma is a
 *      literal character in a filename, so `a,b.ts` became the pattern `a|b.ts` — a glob that
 *      matched two things it should not and missed the one it should.
 *   2. `[` was ESCAPED to a literal. Claude Code reads `[` as the start of a bracket expression,
 *      so this gate would happily report a match for a pattern Claude Code resolves differently.
 *   3. An unterminated `[`, such as `photos [2024/**`, is INVALID to Claude Code: it matches
 *      nothing, while the rule's other patterns keep working. Escaping it made this gate say the
 *      rule fires when it cannot. Returning null lets the RULES check report it honestly.
 */
export function globToRegExp(glob) {
    let out = '';
    let braceDepth = 0;

    for (let i = 0; i < glob.length; i++) {
        const c = glob[i];

        if (c === '\\') {                        // escaped literal: `\[` matches a real bracket
            const next = glob[++i];
            if (next === undefined) return null; // trailing backslash is not a valid pattern
            out += esc(next);
            continue;
        }

        if (c === '*') {
            if (glob[i + 1] === '*') {
                // `**/` may match zero segments, so the slash belongs to the optional group.
                if (glob[i + 2] === '/') { out += '(?:.*/)?'; i += 2; }
                else { out += '.*'; i += 1; }
            } else {
                out += '[^/]*';
            }
            continue;
        }

        if (c === '?') { out += '[^/]'; continue; }

        if (c === '[') {
            const close = findBracketClose(glob, i);
            if (close === -1) return null;       // invalid pattern — matches nothing
            let body = glob.slice(i + 1, close);
            let negated = false;
            if (body.startsWith('!') || body.startsWith('^')) { negated = true; body = body.slice(1); }
            // A bracket expression never matches a path separator.
            out += `(?!/)[${negated ? '^' : ''}${body.replace(/\\/g, '\\\\').replace(/\]/g, '\\]')}]`;
            i = close;
            continue;
        }

        if (c === '{') { braceDepth++; out += '(?:'; continue; }
        if (c === '}') {
            if (braceDepth === 0) { out += esc(c); continue; } // unmatched `}` is a literal
            braceDepth--; out += ')'; continue;
        }
        if (c === ',') { out += braceDepth > 0 ? '|' : esc(c); continue; }

        out += esc(c);
    }

    if (braceDepth !== 0) return null;           // unbalanced `{` — not a usable pattern
    try {
        return new RegExp(`^${out}$`);
    } catch {
        return null;
    }
}

/** Index of the `]` closing the bracket expression opened at `start`, or -1 if there is none. */
function findBracketClose(glob, start) {
    // POSIX allows a `]` as the first character of the body, where it is a literal.
    let i = start + 1;
    if (glob[i] === '!' || glob[i] === '^') i++;
    if (glob[i] === ']') i++;
    for (; i < glob.length; i++) {
        if (glob[i] === '\\') { i++; continue; }
        if (glob[i] === ']') return i;
    }
    return -1;
}

/**
 * How many patterns a `paths` list expands to once brace groups are multiplied out.
 *
 * Claude Code gives a rule's whole `paths` list one budget of 1,000 expanded patterns. Over that,
 * it uses the offending pattern UNEXPANDED — and then its literal braces match no files, so the
 * rule silently stops firing. That is the same failure this gate's "matches nothing" check exists
 * to catch, arriving by a different route, so it is worth counting. Patterns without braces do not
 * count against the budget.
 */
export function countBraceExpansions(globs) {
    let total = 0;
    for (const glob of globs) {
        if (!glob.includes('{')) continue;
        let combos = 1;
        let alternatives = 1;
        let depth = 0;
        for (let i = 0; i < glob.length; i++) {
            const c = glob[i];
            if (c === '\\') { i++; continue; }
            if (c === '{') { depth++; if (depth === 1) alternatives = 1; }
            else if (c === '}') { depth--; if (depth === 0) combos *= alternatives; }
            else if (c === ',' && depth === 1) alternatives++;
        }
        total += combos;
    }
    return total;
}

/**
 * Remove block-level HTML comments, which Claude Code strips before injecting a CLAUDE.md into
 * context. Comments inside fenced code blocks are preserved, so they still cost context and still
 * count against the budget.
 */
export function stripMaintainerComments(text) {
    const lines = text.split('\n');
    const kept = [];
    let inFence = false;
    let inComment = false;

    for (const line of lines) {
        if (/^\s*(```|~~~)/.test(line)) { inFence = !inFence; kept.push(line); continue; }
        if (inFence) { kept.push(line); continue; }

        if (inComment) {
            if (line.includes('-->')) inComment = false;
            continue;
        }
        if (/^\s*<!--/.test(line)) {
            if (!line.includes('-->')) inComment = true;
            continue;
        }
        kept.push(line);
    }
    return kept.join('\n');
}

/**
 * Markdown links `[text](target)`, outside fenced code blocks.
 *
 * DELIBERATELY LINKS ONLY — backticked paths are not checked, and that is a decision rather than an
 * omission. A markdown link is a promise that a target exists; a backticked path is prose, and in
 * these files it is very often prose about somewhere else: `origin/next` is a git ref, `/compact` is
 * a slash command, and `guides/CACHING_AND_PUBSUB_GUIDE.md` and
 * `packages/OpenApp/PUBLISH_NO_BREAK_POLICY.md` are real files in the MJ repo that correctly do not
 * exist in this one. No heuristic separates those from genuine rot, so checking them would mean a
 * gate that cries wolf — and a gate people learn to ignore is worse than no gate, because its green
 * still gets cited.
 *
 * If you want a path checked, link it.
 */
export function extractReferences(text) {
    const withoutFences = text.replace(/```[\s\S]*?```/g, '');
    return [...withoutFences.matchAll(/\[[^\]]*\]\(([^)\s]+)\)/g)].map((m) => ({ ref: m[1], isLink: true }));
}

/**
 * Decide whether a reference is ours to resolve.
 *
 * External URLs, anchors, npm specifiers, placeholder segments like `<this-repo>`, and glob
 * patterns are all legitimately unresolvable against the filesystem.
 */
export function isCheckableReference(ref) {
    if (!ref) return false;
    if (/^(https?:|mailto:|#)/.test(ref)) return false;
    if (/^@[a-z0-9-]+\//i.test(ref)) return false;   // npm scope, e.g. @memberjunction/core
    if (/[<>*${}]/.test(ref)) return false;           // placeholders and globs
    if (/^\$\{/.test(ref)) return false;
    return true;
}

/** Every tracked file, POSIX-relative to the repo root. Falls back to a walk outside git. */
export function listTrackedFiles(root) {
    try {
        const out = execFileSync('git', ['-C', root, 'ls-files'], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
        const files = out.split('\n').filter(Boolean);
        if (files.length > 0) return files;
    } catch {
        // not a git repo, or git unavailable — fall through to the walk
    }
    const acc = [];
    const walk = (dir) => {
        for (const e of readdirSync(join(root, dir || '.'), { withFileTypes: true })) {
            if (IGNORED_DIRS.has(e.name)) continue;
            const rel = dir ? posix.join(dir, e.name) : e.name;
            if (e.isDirectory()) walk(rel);
            else acc.push(rel);
        }
    };
    walk('');
    return acc;
}

/** Every .md under .claude/rules/, recursively, POSIX-relative to the repo root. */
export function listRuleFiles(root) {
    const acc = [];

    const walkRules = (rulesDirRel) => {
        const base = join(root, rulesDirRel);
        if (!existsSync(base)) return;
        const walk = (sub) => {
            for (const e of readdirSync(join(base, sub || '.'), { withFileTypes: true })) {
                const rel = sub ? posix.join(sub, e.name) : e.name;
                // withFileTypes reports a symlink as a link, so stat through it. `.claude/rules/`
                // supports symlinks, and a linked rule is still a rule.
                let isDir = e.isDirectory();
                if (e.isSymbolicLink()) {
                    try { isDir = statSync(join(base, rel)).isDirectory(); } catch { continue; }
                }
                if (isDir) walk(rel);
                else if (e.name.endsWith('.md')) acc.push(posix.join(rulesDirRel, rel));
            }
        };
        walk('');
    };

    walkRules(RULES_DIR);
    for (const dir of findNestedClaudeDirs(root)) walkRules(posix.join(dir, 'rules'));

    return [...new Set(acc)].sort();
}

/** Nested `.claude/` directories (excluding the repo root's), POSIX-relative to the root. */
export function findNestedClaudeDirs(root) {
    const acc = [];
    const walk = (dir) => {
        let entries;
        try { entries = readdirSync(join(root, dir || '.'), { withFileTypes: true }); } catch { return; }
        for (const e of entries) {
            if (!e.isDirectory()) continue;
            if (IGNORED_DIRS.has(e.name)) continue;
            const rel = dir ? posix.join(dir, e.name) : e.name;
            if (e.name === '.claude') {
                if (rel !== '.claude') acc.push(rel);
                continue; // do not descend into a .claude dir hunting for another
            }
            walk(rel);
        }
    };
    walk('');
    return acc;
}

/** Every `<name>/SKILL.md` under any `.claude/skills/`, POSIX-relative to the repo root. */
export function listSkillFiles(root) {
    const acc = [];
    const collect = (skillsDirRel) => {
        const base = join(root, skillsDirRel);
        if (!existsSync(base)) return;
        for (const e of readdirSync(base, { withFileTypes: true })) {
            if (!e.isDirectory() && !e.isSymbolicLink()) continue;
            const skillMd = posix.join(skillsDirRel, e.name, 'SKILL.md');
            if (existsSync(join(root, skillMd))) acc.push(skillMd);
        }
    };
    collect(SKILLS_DIR);
    for (const dir of findNestedClaudeDirs(root)) collect(posix.join(dir, 'skills'));
    return [...new Set(acc)].sort();
}

// ─────────────────────────────────────────────────────────────────────────────────────────────
// The gate
// ─────────────────────────────────────────────────────────────────────────────────────────────

/**
 * Run every check against a repo root.
 *
 * @returns {{ failures: {check: string, msg: string}[], notes: string[] }}
 */
export function checkInstructionFiles(root) {
    const failures = [];
    const notes = [];
    const fail = (check, msg) => failures.push({ check, msg });

    const read = (p) => readFileSync(join(root, p), 'utf8');
    const exists = (p) => existsSync(join(root, p));

    // ── 1. COMPLETENESS ──────────────────────────────────────────────────────────────────────
    let manifest = null;
    if (!exists(MANIFEST_PATH)) {
        fail('completeness', `${MANIFEST_PATH} is missing — the refactor's evidence file.`);
    } else {
        try {
            manifest = JSON.parse(read(MANIFEST_PATH));
        } catch (e) {
            fail('completeness', `${MANIFEST_PATH} is not valid JSON: ${e.message}`);
        }
    }

    if (manifest) {
        const sections = manifest.sections ?? [];
        if (sections.length === 0) fail('completeness', 'manifest has no sections');

        for (const s of sections) {
            const where = `section "${s.title}" (from ${s.source})`;
            const dests = s.destinations ?? [];
            if (dests.length === 0) {
                fail('completeness', `${where} has no destinations — every section must be accounted for.`);
                continue;
            }
            for (const d of dests) {
                if (d === 'root') {
                    if (!exists(ROOT_FILE)) fail('completeness', `${where} -> root, but ${ROOT_FILE} is missing`);
                } else if (d === 'deleted') {
                    if (!s.reason || !s.reason.trim()) {
                        fail('completeness', `${where} is deleted without a reason — a deletion must justify itself.`);
                    }
                } else if (d.startsWith('rule:') || d.startsWith('doc:')) {
                    const p = d.slice(d.indexOf(':') + 1);
                    if (!exists(p)) fail('completeness', `${where} -> ${d}, but ${p} does not exist`);
                } else if (d.startsWith('skill:')) {
                    const name = d.slice('skill:'.length);
                    if (!exists(posix.join(SKILLS_DIR, name, 'SKILL.md'))) {
                        fail('completeness', `${where} -> ${d}, but ${SKILLS_DIR}/${name}/SKILL.md does not exist`);
                    }
                } else {
                    fail('completeness', `${where} has unknown destination "${d}"`);
                }
            }
        }
        notes.push(`completeness: ${sections.length} section(s) accounted for`);
    }

    // ── 2. BUDGET ────────────────────────────────────────────────────────────────────────────
    if (!exists(ROOT_FILE)) {
        fail('budget', `${ROOT_FILE} is missing`);
    } else if (manifest?.budget) {
        const raw = read(ROOT_FILE);

        // Budget the EFFECTIVE size — what actually reaches the context window. Claude Code strips
        // block-level HTML comments before injecting a CLAUDE.md, so counting them would charge the
        // file for maintainer notes that cost nothing, and would discourage exactly the commenting
        // the docs recommend. The ~200-line guidance is about context cost, so measure context cost.
        const effective = stripMaintainerComments(raw);
        const lines = effective.split('\n').filter((l) => l.trim() !== '').length;
        const bytes = Buffer.byteLength(effective, 'utf8');
        const rawLines = raw.split('\n').length - (raw.endsWith('\n') ? 1 : 0);
        const { maxLines, maxBytes } = manifest.budget;

        if (maxLines && lines > maxLines) {
            fail('budget', `${ROOT_FILE} is ${lines} effective lines, over the ${maxLines}-line ceiling. Route the new content to a rule — see "Where new guidance goes".`);
        }
        if (maxBytes && bytes > maxBytes) {
            fail('budget', `${ROOT_FILE} is ${bytes} effective bytes, over the ${maxBytes}-byte ceiling.`);
        }
        notes.push(
            `budget: ${ROOT_FILE} ${lines}/${maxLines} effective lines, ${bytes}/${maxBytes} effective bytes ` +
            `(${rawLines} raw lines; blank lines and stripped HTML comments do not reach context)`,
        );
    }

    // ── 3. REFERENCES ────────────────────────────────────────────────────────────────────────
    const instructionFiles = [ROOT_FILE, ...listRuleFiles(root)].filter(exists);
    for (const p of ['docs/claude/README.md', 'plans/claude-instruction-architecture.md']) {
        if (exists(p)) instructionFiles.push(p);
    }

    let refCount = 0;
    for (const file of instructionFiles) {
        const text = read(file);
        for (const { ref } of extractReferences(text)) {
            const bare = ref.split('#')[0];
            if (!isCheckableReference(bare)) continue;
            refCount++;
            const target = bare.startsWith('/')
                ? join(root, bare.slice(1))
                : resolve(join(root, dirname(file)), bare);
            // Stay inside the repo — an instruction file pointing outside it is its own bug.
            const rel = relative(root, target);
            if (rel.startsWith('..')) {
                fail('references', `${file} -> "${ref}" escapes the repository root`);
                continue;
            }
            // Deliberately ahead of the existence check, and deliberately not conditional on it:
            // on `next` the changeset IS there, and that is exactly the case worth failing.
            if (EPHEMERAL_CHANGESET.test(rel.split(/[\\/]/).join('/'))) {
                fail('references', `${file} -> "${ref}" points at a changeset, which is consumed at release — it resolves here and dangles on every release branch`);
                continue;
            }
            if (!existsSync(target)) {
                fail('references', `${file} -> "${ref}" does not resolve (${rel})`);
            }
        }
    }
    notes.push(`references: ${refCount} checkable reference(s) across ${instructionFiles.length} instruction file(s)`);

    // ── 4. ROUTING ───────────────────────────────────────────────────────────────────────────
    const rootText = exists(ROOT_FILE) ? read(ROOT_FILE) : '';

    for (const rule of listRuleFiles(root)) {
        if (!rootText.includes(rule) && !rootText.includes(posix.basename(rule))) {
            fail('routing', `${rule} exists but is not in ${ROOT_FILE}'s routing table — a rule nobody can find is a rule nobody follows.`);
        }
    }

    // `.claude/CLAUDE.md` is an alternative location for the PROJECT file, not a nested one, so it
    // is not something the routing table should have to list alongside per-directory files.
    const nestedClaudeMds = listTrackedFiles(root).filter(
        (f) => f.endsWith('/CLAUDE.md')
            && !f.startsWith('.claude/worktrees/')
            && f !== '.claude/CLAUDE.md',
    );
    for (const nested of nestedClaudeMds) {
        if (!rootText.includes(nested)) {
            fail('routing', `${nested} exists but is not in ${ROOT_FILE}'s routing table`);
        }
    }

    for (const skillMd of listSkillFiles(root)) {
        const name = posix.basename(posix.dirname(skillMd));
        if (!rootText.includes(name)) {
            fail('routing', `skill "${name}" (${skillMd}) exists but is not in ${ROOT_FILE}'s routing table`);
        }
    }

    // ── 5. RULES ─────────────────────────────────────────────────────────────────────────────
    const tracked = listTrackedFiles(root);
    for (const rule of listRuleFiles(root)) {
        const { hasFrontmatter, hasPathsKey, paths } = parseRuleFrontmatter(read(rule));

        if (!hasFrontmatter) {
            fail('rules', `${rule} has no YAML frontmatter`);
            continue;
        }
        if (!hasPathsKey) {
            fail('rules', `${rule} has no "paths" key. A rule without paths loads UNCONDITIONALLY at launch — omitting it does not scope the rule down, it makes it permanent.`);
            continue;
        }
        if (paths.length === 0) {
            fail('rules', `${rule} has an empty "paths" list`);
            continue;
        }
        const expansions = countBraceExpansions(paths);
        if (expansions > BRACE_EXPANSION_BUDGET) {
            fail('rules', `${rule} expands to ${expansions} patterns, over Claude Code's ${BRACE_EXPANSION_BUDGET}-pattern budget. Over the budget the pattern is used UNEXPANDED, so its literal braces match no files and the rule stops firing.`);
        }

        for (const glob of paths) {
            const re = globToRegExp(glob);
            if (re === null) {
                fail('rules', `${rule} glob "${glob}" is not a valid pattern (unterminated "[" or "{"). Claude Code matches nothing for it while the rule's other patterns keep working, so the rule silently half-fires.`);
                continue;
            }
            if (!tracked.some((f) => re.test(f))) {
                fail('rules', `${rule} glob "${glob}" matches no tracked file — the rule can never fire.`);
            }
        }
    }
    notes.push(`rules: ${listRuleFiles(root).length} rule(s) checked against ${tracked.length} tracked file(s)`);

    return { failures, notes };
}

// ─────────────────────────────────────────────────────────────────────────────────────────────
// CLI
// ─────────────────────────────────────────────────────────────────────────────────────────────

function main() {
    const argv = process.argv.slice(2);
    const rootFlag = argv.indexOf('--root');
    const root = rootFlag !== -1 && argv[rootFlag + 1] ? resolve(argv[rootFlag + 1]) : resolve(HERE, '..');
    const quiet = argv.includes('--quiet');

    const { failures, notes } = checkInstructionFiles(root);

    if (!quiet) for (const n of notes) console.log(`  ${n}`);

    if (failures.length > 0) {
        console.error(`\n❌ Instruction-file gate failed (${failures.length} problem(s)):\n`);
        const byCheck = new Map();
        for (const f of failures) {
            if (!byCheck.has(f.check)) byCheck.set(f.check, []);
            byCheck.get(f.check).push(f.msg);
        }
        for (const [check, msgs] of byCheck) {
            console.error(`  ${check.toUpperCase()}`);
            for (const m of msgs) console.error(`    - ${m}`);
            console.error('');
        }
        process.exit(1);
    }

    console.log('✅ Instruction-file gate passed — budget held, every reference resolves, every rule is routed and can fire.');
}

if (import.meta.url === `file://${process.argv[1]}`) main();
