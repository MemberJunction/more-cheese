#!/usr/bin/env node
/**
 * publish-wordpress.mjs — publish validated public content (content/blog/**.md) to the More Cheese
 * WordPress site through the REST API. Idempotent: a post is matched by slug and updated in place.
 *
 *   node scripts/publish-wordpress.mjs --dry-run                     # show what would happen
 *   node scripts/publish-wordpress.mjs content/blog/2019              # publish a folder (or files)
 *   node scripts/publish-wordpress.mjs --status draft content/blog    # upload as drafts
 *   node scripts/publish-wordpress.mjs --week 2019-01-14              # one blog week
 *
 * Credentials come from environment variables (never from the repo):
 *   WP_BASE_URL, WP_USERNAME, WP_APP_PASSWORD   (WordPress application password)
 * e.g.  set -a; source ~/Projects/more-cheese-work/.env.content; set +a
 *
 * Rules: only files that pass scripts/validate-content.mjs are published (run it first; this script
 * re-checks the disclaimer and `fictional: true` itself and refuses anything without them).
 * The post date is the frontmatter date at 09:00 site-local; category and tags are created on demand;
 * the excerpt is the frontmatter excerpt; the body is the Markdown rendered to HTML with the verbatim
 * disclaimer kept as the final paragraph. A `fictional_demo` tag is added to every post.
 */
import fs from 'node:fs';
import path from 'node:path';
import { marked } from 'marked';
import yaml from 'js-yaml';
import { execFileSync } from 'node:child_process';

const ROOT = process.cwd();
const DISCLAIMER = '*The International Cheese Federation (ICF) and More Cheese are entirely fictional. This post is demonstration content created for MemberJunction. All people, organizations, events, courses, certifications, figures, and quotations in it are invented, and nothing here represents a real association, a real business, a real person, or real professional advice.*';

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const statusIdx = args.indexOf('--status');
const status = statusIdx >= 0 ? args[statusIdx + 1] : 'publish';
const weekIdx = args.indexOf('--week');
const week = weekIdx >= 0 ? args[weekIdx + 1] : null;
const targets = args.filter((a, i) => !a.startsWith('--') && i !== statusIdx + 1 && i !== weekIdx + 1);

const { WP_BASE_URL, WP_USERNAME, WP_APP_PASSWORD } = process.env;
if (!dryRun && !(WP_BASE_URL && WP_USERNAME && WP_APP_PASSWORD)) {
    console.error('Missing WP_BASE_URL / WP_USERNAME / WP_APP_PASSWORD in the environment.');
    process.exit(2);
}
const base = (WP_BASE_URL ?? 'https://example.invalid').replace(/\/+$/, '');
const auth = 'Basic ' + Buffer.from(`${WP_USERNAME}:${WP_APP_PASSWORD}`).toString('base64');

async function wp(method, route, body) {
    const res = await fetch(`${base}/wp-json/wp/v2${route}`, {
        method,
        headers: { Authorization: auth, 'Content-Type': 'application/json', Accept: 'application/json' },
        body: body ? JSON.stringify(body) : undefined,
    });
    const text = await res.text();
    let json;
    try { json = JSON.parse(text); } catch { json = { raw: text }; }
    if (!res.ok) throw new Error(`${method} ${route} → ${res.status}: ${json.message ?? text.slice(0, 200)}`);
    return json;
}

function walk(dir, out = []) {
    if (!fs.existsSync(dir)) return out;
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
        const p = path.join(dir, e.name);
        if (e.isDirectory()) walk(p, out);
        else if (e.name.endsWith('.md')) out.push(p);
    }
    return out;
}

function readPost(file) {
    const text = fs.readFileSync(file, 'utf8');
    const m = text.match(/^---\n([\s\S]*?)\n---\n?/);
    if (!m) throw new Error(`${file}: no frontmatter`);
    const fm = yaml.load(m[1], { schema: yaml.JSON_SCHEMA }); // JSON schema keeps dates as plain strings
    const body = text.slice(m[0].length).replace(/\s+$/, '');
    const lines = body.split('\n');
    if (lines[lines.length - 1].trim() !== DISCLAIMER) throw new Error(`${file}: disclaimer is not the last line — refusing to publish`);
    if (fm.fictional !== true) throw new Error(`${file}: fictional: true missing — refusing to publish`);
    return { file, fm, body };
}

const termCache = { categories: new Map(), tags: new Map() };
async function ensureTerm(kind, name) {
    const key = name.toLowerCase();
    if (termCache[kind].has(key)) return termCache[kind].get(key);
    if (dryRun) { termCache[kind].set(key, -1); return -1; }
    const found = await wp('GET', `/${kind}?search=${encodeURIComponent(name)}&per_page=50`);
    let hit = found.find((t) => t.name.toLowerCase() === key || t.slug === key.replace(/\s+/g, '-'));
    if (!hit) hit = await wp('POST', `/${kind}`, { name });
    termCache[kind].set(key, hit.id);
    return hit.id;
}

async function findBySlug(slug) {
    if (dryRun) return null;
    const hits = await wp('GET', `/posts?slug=${encodeURIComponent(slug)}&status=any&context=edit&per_page=5`);
    return hits[0] ?? null;
}

function toDateGmt(d) {
    const day = String(d).slice(0, 10);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) throw new Error(`bad date ${d}`);
    return `${day}T09:00:00`; // site-local 09:00; WordPress applies the site timezone to `date`
}

async function publishOne(post) {
    const { fm, body } = post;
    const html = marked.parse(body, { gfm: true, breaks: false });
    const categoryId = await ensureTerm('categories', fm.category);
    const tagNames = [...(Array.isArray(fm.tags) ? fm.tags : []), 'fictional_demo'];
    const tagIds = [];
    for (const t of tagNames) tagIds.push(await ensureTerm('tags', String(t)));
    const payload = {
        title: fm.title,
        slug: fm.slug,
        status,
        date: toDateGmt(fm.date),
        excerpt: fm.excerpt,
        content: html,
        categories: categoryId > 0 ? [categoryId] : undefined,
        tags: tagIds.filter((x) => x > 0),
    };
    const existing = await findBySlug(fm.slug);
    if (dryRun) {
        console.log(`DRY  ${fm.date}  ${fm.slug}  [${fm.category}]  ${html.length} chars html`);
        return 'dry';
    }
    if (existing) {
        await wp('POST', `/posts/${existing.id}`, payload);
        console.log(`UPD  ${fm.date}  ${fm.slug}  (id ${existing.id})`);
        return 'updated';
    }
    const created = await wp('POST', '/posts', payload);
    console.log(`NEW  ${fm.date}  ${fm.slug}  (id ${created.id}) ${created.link ?? ''}`);
    return 'created';
}

// Safety: changing status away from publish across the WHOLE folder needs an explicit --all.
if (status !== 'publish' && targets.length === 0 && !week && !args.includes('--all')) {
    console.error(`Refusing to set status=${status} on every post without explicit files, --week, or --all.`);
    process.exit(2);
}
let files = [];
if (targets.length) for (const t of targets) { const p = path.resolve(ROOT, t); files.push(...(fs.statSync(p).isDirectory() ? walk(p) : [p])); }
else files = walk(path.join(ROOT, 'content', 'blog'));
if (week) {
    const start = new Date(`${week}T00:00:00Z`); const end = new Date(start); end.setUTCDate(end.getUTCDate() + 6);
    const s = start.toISOString().slice(0, 10), e = end.toISOString().slice(0, 10);
    files = files.filter((f) => { const d = path.basename(f).slice(0, 10); return d >= s && d <= e; });
}
files.sort();

// Gate on the validator unless --force: anything it marks FAIL is skipped (never published).
const force = args.includes('--force');
if (!force && files.length) {
    const report = JSON.parse(execFileSync(process.execPath, [path.join(ROOT, 'scripts', 'validate-content.mjs'), '--json', ...files], { cwd: ROOT, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 }).toString());
    const failing = new Set(report.files.filter((f) => f.fails.length).map((f) => path.resolve(ROOT, f.rel)));
    for (const f of files) if (failing.has(path.resolve(f))) console.error(`SKIP ${path.relative(ROOT, f)}: fails validation`);
    files = files.filter((f) => !failing.has(path.resolve(f)));
}

const counts = { created: 0, updated: 0, dry: 0, failed: 0 };
let skipped = 0;
for (const f of files) {
    try {
        const r = await publishOne(readPost(f));
        counts[r]++;
    } catch (e) {
        counts.failed++;
        console.error(`FAIL ${path.relative(ROOT, f)}: ${e.message}`);
    }
}
console.log(`\n${files.length} file(s): ${counts.created} created, ${counts.updated} updated, ${counts.dry} dry, ${counts.failed} failed → ${base} (${status}${dryRun ? ', dry run' : ''})`);
process.exit(counts.failed ? 1 : 0);
