#!/usr/bin/env node
/**
 * build-site.mjs — build the static More Cheese public site into `website/dist/`,
 * ready to upload to an Azure Static Web App.
 *
 *   node scripts/build-site.mjs            # or: npm run build:site
 *
 * What it does, in order:
 *
 *   1. wipes `website/dist/` (the build is idempotent — run it as often as you like);
 *   2. copies every static file from `website/` (the 23 hand-written pages and
 *      `assets/`), skipping the dev-only bits: `wp-theme/`, `check-links.py`,
 *      `README.md` and `dist/` itself;
 *   3. reads the blog corpus from `content/blog/**\/*.md` — the same frontmatter
 *      contract `scripts/publish-wordpress.mjs` publishes to WordPress (js-yaml
 *      for the frontmatter, marked for the body) — and generates:
 *        /blog/index.html            newest 12 posts, the blog.html card design
 *        /blog/page/N/index.html     pages 2..n, same design
 *        /<slug>/index.html          one page per post, the post.html design
 *      Those are exactly the URLs the live WordPress site serves today, which
 *      matters because the Knowledge Hub crawler is seeded on
 *      https://morecheese.org/blog/ and walks the post links from there;
 *   4. rewrites the three hand-copied "this week" cards on the homepage with the
 *      three newest real posts, and turns `dist/blog.html` into a meta refresh
 *      to `/blog/` so the old design-review URL still lands somewhere sensible;
 *   5. rewrites every `./x` href/src in dist to a root-absolute `/x`, because the
 *      generated pages live two and three levels down and the header, footer and
 *      asset links are copied verbatim into all of them;
 *   6. writes `dist/staticwebapp.config.json` — the 301s for the WordPress URLs
 *      that exist today and a real (404-status) 404 page.
 *
 * The page chassis — <head>, the Tailwind palette block, the header with its
 * "Fictional demo" badge, the footer with the disclaimer — is not duplicated
 * here: the generated pages are built by swapping <main> inside `blog.html` and
 * `post.html`, so a change to the design in those files flows through the build.
 */
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { marked } from 'marked';
import yaml from 'js-yaml';
import { staticWebAppConfig } from './site-routes.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SITE = path.join(ROOT, 'website');
const DIST = path.join(SITE, 'dist');
const CORPUS = path.join(ROOT, 'content', 'blog');

const PER_PAGE = 9; // Matt: 3-column grid, 9 per page, numbered pager
const SKIP_TOP = new Set(['dist', 'wp-theme', 'check-links.py', 'README.md', 'data']);
/** Static pages are published at pretty URLs (Matt: `#/about` → `/about/`, one to one). `x.html` lands at
 *  `/x/index.html`, `faq-x.html` at `/faq/x/index.html`; index.html and 404.html stay at the root; blog.html and
 *  post.html are build shells and are not published. */
const SHELLS = new Set(['blog.html', 'post.html']);
function prettyPath(file) {
    const base = file.replace(/\.html$/, '');
    if (base === 'index') return '/';
    if (base === 'blog') return '/blog/';
    if (base.startsWith('faq-')) return `/faq/${base.slice(4)}/`;
    return `/${base}/`;
}

/* ------------------------------------------------------------------ utils */

const esc = (s) =>
    String(s ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];

/** "2019-05-22" -> "22 May 2019". Parsed as plain parts, never as a Date, so the
 *  build does not drift a day depending on the machine's timezone. */
function longDate(iso) {
    const [y, m, d] = String(iso).slice(0, 10).split('-').map(Number);
    return `${d} ${MONTHS[m - 1]} ${y}`;
}

function trimWords(text, words) {
    const parts = String(text).replace(/\s+/g, ' ').trim().split(' ');
    return parts.length <= words ? parts.join(' ') : parts.slice(0, words).join(' ') + '…';
}

function walk(dir, out = []) {
    if (!fs.existsSync(dir)) return out;
    for (const e of fs.readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
        const p = path.join(dir, e.name);
        if (e.isDirectory()) walk(p, out);
        else out.push(p);
    }
    return out;
}

function write(rel, html) {
    const target = path.join(DIST, rel);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, html, 'utf8');
}

/* ------------------------------------------------------- the page chassis */

/** Split a hand-written page into everything before <main> and everything after
 *  </main>, so a generated <main> can be dropped in between. */
function chassis(file) {
    const html = fs.readFileSync(path.join(SITE, file), 'utf8');
    const open = html.indexOf('<main id="main">');
    const close = html.indexOf('</main>', open);
    if (open < 0 || close < 0) throw new Error(`${file}: no <main id="main"> … </main> to split on`);
    return {
        head: html.slice(0, open),
        tail: html.slice(close + '</main>'.length),
    };
}

/** Replace <title> and the meta description in a chassis head. */
function retitle(head, title, description) {
    return head
        .replace(/<title>[\s\S]*?<\/title>/, `<title>${esc(title)}</title>`)
        .replace(/<meta name="description" content="[^"]*">/, `<meta name="description" content="${esc(description)}">`);
}

/* ------------------------------------------------------------ the corpus */

const DISCLAIMER_MARK = 'are entirely fictional. This post is demonstration content created for MemberJunction';

function readPosts() {
    const files = walk(CORPUS).filter((f) => f.endsWith('.md'));
    const posts = [];
    const problems = [];

    // Gate on the content validator (same rule as publish-wordpress.mjs): a post that fails
    // validation never reaches the public site, even mid-backfill.
    const failing = new Set();
    if (files.length) {
        // validate-content exits 1 when anything fails; the JSON report is still on stdout.
        let raw;
        try {
            raw = execFileSync(process.execPath, [path.join(ROOT, 'scripts', 'validate-content.mjs'), '--json', ...files],
                { cwd: ROOT, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, stdio: ['ignore', 'pipe', 'ignore'] });
        } catch (e) {
            if (!e.stdout) throw e;
            raw = e.stdout;
        }
        const report = JSON.parse(raw.toString());
        for (const f of report.files) if (f.fails.length) failing.add(path.resolve(ROOT, f.rel));
    }

    for (const file of files) {
        const rel = path.relative(ROOT, file);
        if (failing.has(path.resolve(file))) { problems.push(`${rel}: fails validate-content — skipped`); continue; }
        const text = fs.readFileSync(file, 'utf8');
        const m = text.match(/^---\n([\s\S]*?)\n---\n?/);
        if (!m) { problems.push(`${rel}: no frontmatter`); continue; }

        // JSON_SCHEMA keeps `date:` a plain string rather than a JS Date.
        const fm = yaml.load(m[1], { schema: yaml.JSON_SCHEMA });
        const body = text.slice(m[0].length).replace(/\s+$/, '');

        if (fm.fictional !== true) { problems.push(`${rel}: fictional: true missing — skipped`); continue; }
        if (!fm.slug) { problems.push(`${rel}: no slug — skipped`); continue; }
        if (!body.includes(DISCLAIMER_MARK)) { problems.push(`${rel}: no fiction disclaimer in the body — skipped`); continue; }

        posts.push({
            rel,
            slug: String(fm.slug),
            title: String(fm.title ?? fm.slug),
            date: String(fm.date).slice(0, 10),
            category: String(fm.category ?? 'From the Federation'),
            tags: Array.isArray(fm.tags) ? fm.tags.map(String) : [],
            excerpt: String(fm.excerpt ?? ''),
            author: String(fm.author ?? 'ICF Communications Team'),
            body,
        });
    }

    // Newest first, with the filename as a stable tie-break inside a day.
    posts.sort((a, b) => (a.date === b.date ? b.rel.localeCompare(a.rel) : b.date.localeCompare(a.date)));

    // One slug is one URL. Two files claiming the same slug would otherwise write
    // the same page twice and show the post twice on the index, so the newer file
    // wins and the other is reported rather than silently overwritten.
    const seen = new Map();
    const unique = [];
    for (const post of posts) {
        if (seen.has(post.slug)) {
            problems.push(`${post.rel}: duplicate slug "${post.slug}" (kept ${seen.get(post.slug)}) — skipped`);
            continue;
        }
        seen.set(post.slug, post.rel);
        unique.push(post);
    }

    return { posts: unique, problems };
}

/* ------------------------------------------------- blog index + post pages */

/** The card colorway rotation from blog.html (and terroir_card_style in the
 *  theme): mostly outlined, with a clover, a pasture and a brick card in the mix. */

const slugify = (t) => String(t).toLowerCase().replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const catHref = (cat, n = 1) => (n <= 1 ? `/blog/category/${slugify(cat)}/` : `/blog/category/${slugify(cat)}/page/${n}/`);

/** One blog card in Matt's pattern: eyebrow + date, Sora title, excerpt, "Read post". Every third card
 *  sits on cream and every seventh on soft butter so a 3-column grid never reads as a flat sheet. */
function card(post, i) {
    const tone = i % 7 === 6 ? ' card--soft' : i % 3 === 2 ? ' card--cream' : '';
    return `      <a href="/${post.slug}/" class="card${tone}">
        <div class="card__meta"><span class="eyebrow">${esc(post.category)}</span><span class="card__date"><time datetime="${post.date}">${longDate(post.date)}</time></span></div>
        <h3 class="card__title">${esc(post.title)}</h3>
        <p class="card__excerpt">${esc(trimWords(post.excerpt, 28))}</p>
        <span class="card__more">Read post</span>
      </a>`;
}

const pageHref = (n) => (n <= 1 ? '/blog/' : `/blog/page/${n}/`);

/** Numbered pager (Matt: no load-more — every page has a real URL). `href(n)` decides the URL family. */
function pagination(page, pages, href = pageHref) {
    if (pages < 2) return '';
    const bits = [];
    const link = (n, label) => `<a href="${href(n)}" class="pager__link"${label ? ` aria-label="${label}"` : ''}>${label ? (n < page ? '←' : '→') : n}</a>`;
    if (page > 1) bits.push(link(page - 1, 'Previous page'));
    for (let n = 1; n <= pages; n++) {
        if (n !== 1 && n !== pages && Math.abs(n - page) > 2) {
            if (Math.abs(n - page) === 3) bits.push('<span class="pager__gap" aria-hidden="true">…</span>');
            continue;
        }
        bits.push(n === page ? `<span class="pager__link is-current" aria-current="page">${n}</span>` : link(n));
    }
    if (page < pages) bits.push(link(page + 1, 'Next page'));
    return `
    <nav class="pager" aria-label="Blog pages">
      <span class="pager__line">Page ${page} of ${pages}</span>
      <div class="pager__links">${bits.join('')}</div>
    </nav>`;
}

/** Category chips are links, not buttons: each category is its own paged URL tree, so the archive stays crawlable. */
function categoryChips(categories, active) {
    const all = `<a href="/blog/" class="chip${active ? '' : ' is-on'}"${active ? '' : ' aria-current="page"'}>All</a>`;
    return all + categories.map((c) => `<a href="${catHref(c)}" class="chip${c === active ? ' is-on' : ''}"${c === active ? ' aria-current="page"' : ''}>${esc(c)}</a>`).join('');
}

function blogIndexPage(chunk, page, pages, total, shell, { categories = [], category = null } = {}) {
    const href = category ? (n) => catHref(category, n) : pageHref;
    const main = `<main id="main">

  <section class="page-head on-ink">
    <div class="holes holes--ink" aria-hidden="true"><span class="hole" style="left:72%;top:14%;width:44px;height:44px"></span><span class="hole" style="left:88%;top:58%;width:28px;height:28px"></span><span class="hole" style="left:60%;top:70%;width:18px;height:18px"></span></div>
    <div class="wrap page-head__inner">
      <span class="eyebrow eyebrow--yellow">Publications</span>
      <h1 class="display">${category ? esc(category) : 'Blog'}</h1>
      <p class="lede">${category ? `Every post the Federation has filed under ${esc(category)}.` : 'Certification, education, advocacy, events, industry news and the members behind them — written by the Federation, for the people who make, age, sell and buy the cheese.'}</p>
    </div>
  </section>

  <section class="wrap section blog-index">
    <div class="blog-index__bar">
      <span role="status" class="muted">${total} posts${category ? ` in ${esc(category)}` : ''} · page ${page} of ${pages}</span>
      <div class="chips">${categoryChips(categories, category)}</div>
    </div>
    <div class="grid grid--cards">
${chunk.map(card).join('\n')}
    </div>${pagination(page, pages, href)}
  </section>
</main>`;

    const title = `${category ? `${category} · ` : ''}Blog${page > 1 ? ` · page ${page}` : ''} · More Cheese`;
    const desc = category
        ? `ICF blog posts in ${category}: ${total} articles from the International Cheese Federation (fictional demonstration content).`
        : 'The ICF blog: certification, education, advocacy, events, industry news and member spotlights from the International Cheese Federation (fictional demonstration content).';
    return retitle(shell.head, title, desc) + main + shell.tail;
}

function tagList(tags) {
    if (!tags.length) return '';
    return `
      <div class="tags">${tags.map((t) => `<span class="chip">${esc(t)}</span>`).join('')}</div>`;
}

const AUTHOR_BIO = 'The Federation’s communications desk: certification news, advocacy updates, event notices and member spotlights, written for the people who make, age, sell and buy the cheese.';
const initials = (name) => name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join('');

/** Three related posts: same category, nearest in time, never the post itself. */
function relatedPosts(post, all) {
    const i = all.indexOf(post);
    return all.filter((p) => p.category === post.category && p.slug !== post.slug)
        .sort((a, b) => Math.abs(all.indexOf(a) - i) - Math.abs(all.indexOf(b) - i))
        .slice(0, 3);
}

function postPage(post, prev, next, shell, all = []) {
    const bodyHtml = marked.parse(post.body, { gfm: true, breaks: false });
    const author = post.author || 'ICF Communications Team';
    const related = relatedPosts(post, all);
    const relatedHtml = related.length ? `
  <section class="on-cream rule-top">
    <div class="wrap section post-related">
      <div class="post-related__bar">
        <h2 class="h2 h2--sm">More from the blog</h2>
        <a href="${catHref(post.category)}" class="text-link">All ${esc(post.category)} posts →</a>
      </div>
      <div class="grid grid--cards">
${related.map((p) => `        <a href="/${p.slug}/" class="card">
          <div class="card__meta"><span class="eyebrow">${esc(p.category)}</span><span class="card__date"><time datetime="${p.date}">${longDate(p.date)}</time></span></div>
          <h3 class="card__title card__title--sm">${esc(p.title)}</h3>
        </a>`).join('\n')}
      </div>
    </div>
  </section>` : '';

    const main = `<main id="main">

  <section class="page-head on-ink">
    <div class="holes holes--ink" aria-hidden="true"><span class="hole" style="left:78%;top:12%;width:40px;height:40px"></span><span class="hole" style="left:91%;top:64%;width:22px;height:22px"></span></div>
    <div class="wrap page-head__inner post-head">
      <a href="/blog/" class="post-head__back">← All posts</a>
      <a href="${catHref(post.category)}" class="eyebrow eyebrow--yellow">${esc(post.category)}</a>
      <h1 class="display display--post">${esc(post.title)}</h1>
      ${post.excerpt ? `<p class="lede post-head__dek">${esc(post.excerpt)}</p>` : ''}
      <div class="byline">
        <span class="byline__avatar" aria-hidden="true">${esc(initials(author))}</span>
        <div class="byline__text"><strong>${esc(author)}</strong><span>International Cheese Federation · <time datetime="${post.date}">${longDate(post.date)}</time></span></div>
      </div>
    </div>
  </section>

  <article class="wrap section post">
    <div class="post__body">
      <div class="prose-mc">
${bodyHtml.trimEnd()}
      </div>${tagList(post.tags)}
      ${(prev || next) ? `<nav class="post__nav" aria-label="More posts">
${prev ? `        <a href="/${prev.slug}/" class="post__nav-link"><span class="eyebrow">Previous</span><span>${esc(prev.title)}</span></a>` : '<span></span>'}
${next ? `        <a href="/${next.slug}/" class="post__nav-link post__nav-link--next"><span class="eyebrow">Next</span><span>${esc(next.title)}</span></a>` : ''}
      </nav>` : ''}
    </div>
    <aside class="post__aside">
      <div class="card">
        <span class="eyebrow">Written by</span>
        <strong class="h3 h3--sm">${esc(author)}</strong>
        <p class="muted card__excerpt">${AUTHOR_BIO}</p>
      </div>
      <div class="brief-cta on-yellow">
        <strong class="h3 h3--sm">The Monday brief</strong>
        <p>Every post, plus the week’s rule changes and deadlines, in one email to members.</p>
        <a href="/join/" class="btn btn-ink btn-sm">Join to get it</a>
      </div>
    </aside>
  </article>${relatedHtml}
</main>`;

    const desc = trimWords(post.excerpt || post.title, 30);
    return retitle(shell.head, `${post.title} · More Cheese`, desc) + main + shell.tail;
}

/* ------------------------------------------------------------- library */

/** `/library/<family>/` and `/library/<family>/<style>/` from website/data/library.json (Matt: the Library
 *  wants its own URL tree). Skipped, with a note, when the data file is not there yet. */
function writeLibraryPages(shell) {
    const file = path.join(SITE, 'data', 'library.json');
    if (!fs.existsSync(file)) { console.warn('library: website/data/library.json missing — no style pages generated'); return 0; }
    const data = JSON.parse(fs.readFileSync(file, 'utf8'));
    let n = 0;
    const fact = (label, value) => (value ? `<div class="fact"><span class="eyebrow">${esc(label)}</span><span>${esc(value)}</span></div>` : '');
    const styleCard = (fam, st, small = false) => `<a href="/library/${fam.slug}/${st.slug}/" class="card">${small ? '' : `<div class="card__meta"><span class="eyebrow">${esc([st.milk, st.texture].filter(Boolean).join(' · '))}</span></div>`}<h3 class="card__title${small ? ' card__title--sm' : ''}">${esc(st.name)}</h3><p class="card__excerpt">${esc(trimWords(st.description ?? '', small ? 20 : 26))}</p>${small ? '' : '<span class="card__more">Read the entry</span>'}</a>`;
    for (const fam of data.families ?? []) {
        const styles = (data.styles ?? []).filter((st) => st.familySlug === fam.slug);
        const main = `<main id="main">
  <section class="page-head on-ink"><div class="wrap page-head__inner"><a href="/library/" class="post-head__back">← The Cheese Library</a><span class="eyebrow eyebrow--yellow">Family</span><h1 class="display">${esc(fam.name)}</h1>${fam.blurb ? `<p class="lede">${esc(fam.blurb)}</p>` : ''}</div></section>
  <section class="wrap section"><div class="grid grid--cards">
${styles.map((st) => '    ' + styleCard(fam, st)).join('\n')}
  </div></section>
</main>`;
        write(`library/${fam.slug}/index.html`, retitle(shell.head, `${fam.name} · Cheese Library · More Cheese`, fam.blurb || `${fam.name} styles in the ICF Cheese Library.`) + main + shell.tail);
        n++;
        for (const st of styles) {
            const others = styles.filter((o) => o.slug !== st.slug).slice(0, 3);
            const main2 = `<main id="main">
  <section class="page-head on-ink"><div class="wrap page-head__inner"><a href="/library/${fam.slug}/" class="post-head__back">← ${esc(fam.name)}</a><span class="eyebrow eyebrow--yellow">${esc(fam.name)}</span><h1 class="display">${esc(st.name)}</h1>${st.description ? `<p class="lede">${esc(st.description)}</p>` : ''}</div></section>
  <article class="wrap section post"><div class="post__body">
    <div class="facts">${fact('Milk', st.milk)}${fact('Texture', st.texture)}${fact('Region', st.region)}${fact('Aging', st.aging)}</div>
    ${st.lookFor ? `<div class="prose-mc"><h2>What to look for</h2><p>${esc(st.lookFor)}</p></div>` : ''}
    ${st.notes ? `<div class="prose-mc"><h2>Notes</h2><p>${esc(st.notes)}</p></div>` : ''}
  </div><aside class="post__aside"><div class="brief-cta on-yellow"><strong class="h3 h3--sm">Learn the ladder</strong><p>The Certified Cheese Professional track covers every family in this library.</p><a href="/learn/" class="btn btn-ink btn-sm">See the credentials</a></div></aside></article>
  ${others.length ? `<section class="on-cream rule-top"><div class="wrap section"><h2 class="h2 h2--sm">More ${esc(fam.name)} styles</h2><div class="grid grid--cards">${others.map((o) => styleCard(fam, o, true)).join('')}</div></div></section>` : ''}
</main>`;
            write(`library/${fam.slug}/${st.slug}/index.html`, retitle(shell.head, `${st.name} · Cheese Library · More Cheese`, trimWords(st.description || st.name, 30)) + main2 + shell.tail);
            n++;
        }
    }
    return n;
}

/* --------------------------------------------------------------- betty */

/** Betty launcher (Colin's two-line embed). Opt-in: reads website/data/betty.json
 *  `{ "publishableKey": "pk_betty_…", "baseUrl": "https://…/betty/v1" }` and replaces the footer's
 *  `<!-- BETTY-WIDGET … -->` marker on every page. Without the file the marker is simply removed, so a
 *  build never ships a widget that refuses to open because our origins are not yet allow-listed. */
function bettySnippet() {
    const file = path.join(SITE, 'data', 'betty.json');
    if (!fs.existsSync(file)) return '';
    const b = JSON.parse(fs.readFileSync(file, 'utf8'));
    if (!b.publishableKey || !b.baseUrl) return '';
    return `<betty-chat publishable-key="${esc(b.publishableKey)}" base-url="${esc(b.baseUrl)}"
            display-mode="launcher" allow-feedback="true" references-mode="expanded"
            locale='{"headerTitle":"Ask the Federation"}'></betty-chat>
<script src="${esc(b.baseUrl.replace(/\/$/, ''))}/widget/betty-chat.js"></script>`;
}

function insertBetty() {
    const snippet = bettySnippet();
    let files = 0;
    for (const file of walk(DIST).filter((f) => f.endsWith('.html'))) {
        const before = fs.readFileSync(file, 'utf8');
        const after = before.replace(/<!-- BETTY-WIDGET[^>]*-->/, snippet);
        if (after !== before) { fs.writeFileSync(file, after, 'utf8'); files++; }
    }
    return { files, enabled: snippet !== '' };
}

/* ------------------------------------------------------------------ build */

function copyStatic() {
    let files = 0;
    for (const entry of fs.readdirSync(SITE, { withFileTypes: true })) {
        if (SKIP_TOP.has(entry.name) || entry.name.startsWith('.')) continue;
        const from = path.join(SITE, entry.name);
        if (entry.isDirectory()) {
            fs.cpSync(from, path.join(DIST, entry.name), { recursive: true });
            files += walk(from).length;
            continue;
        }
        if (entry.name.endsWith('.html')) {
            if (SHELLS.has(entry.name)) continue;
            const pretty = prettyPath(entry.name);
            const to = pretty === '/' || entry.name === '404.html' ? path.join(DIST, entry.name) : path.join(DIST, pretty.slice(1), 'index.html');
            fs.mkdirSync(path.dirname(to), { recursive: true });
            fs.copyFileSync(from, to);
        } else {
            fs.mkdirSync(DIST, { recursive: true });
            fs.copyFileSync(from, path.join(DIST, entry.name));
        }
        files++;
    }
    return files;
}

/** Swap the three hand-copied "this week" cards on the homepage for the three
 *  newest real posts. The lead card is bigger and carries the "· this week" tail,
 *  exactly as front-page.php does it in the theme. */
function rewriteHomeCards(latest) {
    const file = path.join(DIST, 'index.html');
    let html = fs.readFileSync(file, 'utf8');
    const open = html.indexOf('<h2 id="week-h"');
    const endOfH2 = html.indexOf('</h2>', open);
    let closer = html.indexOf('<p class="nav:col-span-3">', endOfH2);
    if (closer < 0) closer = html.indexOf('<p class="home-blog__more">', endOfH2);
    if (open < 0 || closer < 0) throw new Error('index.html: could not find the "From the blog" card block');
    const cards = latest.map((p, i) => card(p, i)).join('\n');
    html = html.slice(0, endOfH2 + '</h2>'.length) + `\n    <div class="grid grid--cards">\n${cards}\n    </div>\n    ` + html.slice(closer);
    fs.writeFileSync(file, html, 'utf8');
    return latest.length;
}

/** blog.html was only ever the design of the index; /blog/ is the real thing. */

/** Every page carries the header, footer and asset links as `./x`; generated
 *  pages sit one and three levels down, so dist is normalised to root-absolute. */
function rootAbsoluteLinks() {
    let touched = 0;
    let rewrites = 0;
    for (const file of walk(DIST)) {
        if (!file.endsWith('.html')) continue;
        const before = fs.readFileSync(file, 'utf8');
        let n = 0;
        const after = before.replace(/\b(href|src)="\.\/([^"#?]*)([#?][^"]*)?"/g, (_m, attr, rest, tail = '') => {
            n++;
            const m = /^([a-z0-9-]+)\.html$/i.exec(rest);
            return `${attr}="${m ? prettyPath(rest) : `/${rest}`}${tail}"`;
        });
        if (n) {
            fs.writeFileSync(file, after, 'utf8');
            touched++;
            rewrites += n;
        }
    }
    return { touched, rewrites };
}

/* ---- Azure Static Web App routing lives in site-routes.mjs; see its header for why ---- */

/* ------------------------------------------------------------------- main */

function main() {
    const started = Date.now();

    fs.rmSync(DIST, { recursive: true, force: true });
    fs.mkdirSync(DIST, { recursive: true });

    const copied = copyStatic();
    const { posts, problems } = readPosts();
    if (!posts.length) {
        console.error(`No usable posts found under ${path.relative(ROOT, CORPUS)}.`);
        process.exit(1);
    }

    // A post slug that collides with a page would shadow it; say so loudly.
    const pageNames = new Set(fs.readdirSync(DIST, { withFileTypes: true }).filter((e) => e.isDirectory()).map((e) => e.name));
    const collisions = posts.filter((p) => pageNames.has(p.slug)).map((p) => p.slug);

    const blogShell = chassis('blog.html');
    const postShell = chassis('post.html');

    const pages = Math.ceil(posts.length / PER_PAGE);
    for (let page = 1; page <= pages; page++) {
        const chunk = posts.slice((page - 1) * PER_PAGE, page * PER_PAGE);
        const html = blogIndexPage(chunk, page, pages, posts.length, blogShell, { categories: [...new Set(posts.map((p) => p.category))].sort() });
        write(page === 1 ? 'blog/index.html' : `blog/page/${page}/index.html`, html);
    }

    const categories = [...new Set(posts.map((p) => p.category))].sort();
    for (const category of categories) {
        const mine = posts.filter((p) => p.category === category);
        const catPages = Math.ceil(mine.length / PER_PAGE);
        for (let page = 1; page <= catPages; page++) {
            const chunk = mine.slice((page - 1) * PER_PAGE, page * PER_PAGE);
            const html = blogIndexPage(chunk, page, catPages, mine.length, blogShell, { categories, category });
            write(page === 1 ? `blog/category/${slugify(category)}/index.html` : `blog/category/${slugify(category)}/page/${page}/index.html`, html);
        }
    }

    posts.forEach((post, i) => {
        const next = i > 0 ? posts[i - 1] : null;      // newer
        const prev = i < posts.length - 1 ? posts[i + 1] : null; // older
        write(`${post.slug}/index.html`, postPage(post, prev, next, postShell, posts));
    });

    const libraryPages = writeLibraryPages(chassis('library.html'));
    console.log(`library pages: ${libraryPages}`);

    const homeCards = rewriteHomeCards(posts.slice(0, 3));
    const links = rootAbsoluteLinks();
    const betty = insertBetty();
    console.log(`betty embed: ${betty.enabled ? 'ON' : 'off (no website/data/betty.json)'} — marker handled in ${betty.files} files`);

    fs.writeFileSync(
        path.join(DIST, 'staticwebapp.config.json'),
        JSON.stringify(staticWebAppConfig(), null, 2) + '\n',
        'utf8'
    );

    const total = walk(DIST).length;
    console.log(`More Cheese static build -> ${path.relative(ROOT, DIST)}`);
    console.log('-'.repeat(64));
    console.log(`  static files copied     ${copied}`);
    console.log(`  posts read              ${posts.length}  (${posts[posts.length - 1].date} .. ${posts[0].date})`);
    console.log(`  blog index pages        ${pages}  (/blog/ + /blog/page/2..${pages}/)`);
    console.log(`  post pages              ${posts.length}  (/<slug>/index.html)`);
    console.log(`  homepage cards rewired  ${homeCards}`);
    console.log(`  ./ -> / link rewrites   ${links.rewrites} in ${links.touched} files`);
    console.log(`  routes in SWA config    ${staticWebAppConfig().routes.length}`);
    console.log(`  files in dist           ${total}`);
    console.log(`  built in                ${Date.now() - started} ms`);

    if (collisions.length) {
        console.log('');
        console.log(`  WARNING: ${collisions.length} post slug(s) collide with a page: ${collisions.join(', ')}`);
    }
    if (problems.length) {
        console.log('');
        console.log(`  Skipped ${problems.length} file(s):`);
        for (const p of problems) console.log(`    ${p}`);
    }
}

/**
 * `main()` ran unconditionally, so importing this module ran the whole build — which is why the
 * routing table below had never been unit-tested, and why a duplicate-route defect reached
 * production. Same reasoning and same shape as the other four scripts here; they must answer this
 * identically or the inconsistency is itself the bug.
 */
const isEntryPoint = () => {
    try {
        return (
            process.argv[1] !== undefined &&
            fs.realpathSync(process.argv[1]) === fs.realpathSync(fileURLToPath(import.meta.url))
        );
    } catch {
        return false;
    }
};

if (isEntryPoint()) {
    main();
}
