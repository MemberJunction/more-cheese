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

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SITE = path.join(ROOT, 'website');
const DIST = path.join(SITE, 'dist');
const CORPUS = path.join(ROOT, 'content', 'blog');

const PER_PAGE = 12;
const SKIP_TOP = new Set(['dist', 'wp-theme', 'check-links.py', 'README.md']);

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
function cardStyle(i) {
    const slot = i % 12;
    if (slot === 2 || slot === 8) {
        return {
            card: 'flex flex-col rounded-2xl bg-clover p-6',
            kicker: 'm-0 text-[11px] font-bold uppercase tracking-[.14em] text-pasture',
            meta: 'm-0 text-sm text-[#41503F]',
            body: 'm-0 mt-3 text-[15px] text-[#243027]',
            link: 'text-charcoal no-underline hover:text-pasture',
        };
    }
    if (slot === 5) {
        return {
            card: 'flex flex-col rounded-2xl bg-pasture p-6 text-white',
            kicker: 'm-0 text-[11px] font-bold uppercase tracking-[.14em] text-clover',
            meta: 'm-0 text-sm text-clover',
            body: 'm-0 mt-3 text-[15px] opacity-95',
            link: 'text-white no-underline underline-offset-4 hover:underline',
        };
    }
    if (slot === 10) {
        return {
            card: 'flex flex-col rounded-2xl bg-brick p-6 text-white',
            kicker: 'm-0 text-[11px] font-bold uppercase tracking-[.14em] text-clover',
            meta: 'm-0 text-sm text-clover',
            body: 'm-0 mt-3 text-[15px] opacity-95',
            link: 'text-white no-underline underline-offset-4 hover:underline',
        };
    }
    return {
        card: 'flex flex-col rounded-2xl border-[1.5px] border-charcoal bg-milk p-6',
        kicker: 'm-0 text-[11px] font-bold uppercase tracking-[.14em] text-brick',
        meta: 'm-0 text-sm text-mid',
        body: 'm-0 mt-3 text-[15px] text-[#3A403C]',
        link: 'text-charcoal no-underline hover:text-pasture',
    };
}

function card(post, i) {
    const s = cardStyle(i);
    return `      <article class="${s.card}">
        <p class="${s.kicker}">${esc(post.category)}</p>
        <h3 class="font-display mb-2 mt-2 text-[22px] font-bold leading-[1.15] tracking-tight">
          <a href="/${post.slug}/" class="${s.link}">${esc(post.title)}</a>
        </h3>
        <p class="${s.meta}"><time datetime="${post.date}">${longDate(post.date)}</time></p>
        <p class="${s.body}">${esc(trimWords(post.excerpt, 28))}</p>
      </article>`;
}

const pageHref = (n) => (n <= 1 ? '/blog/' : `/blog/page/${n}/`);

function pagination(page, pages) {
    if (pages < 2) return '';
    const bits = [];
    if (page > 1) {
        bits.push(`<a href="${pageHref(page - 1)}" class="rounded-full border-[1.5px] border-charcoal px-4 py-2 font-semibold text-charcoal no-underline hover:bg-clover">&larr; Newer</a>`);
    }
    for (let n = 1; n <= pages; n++) {
        // Keep the strip short: the ends, and a window either side of here.
        if (n !== 1 && n !== pages && Math.abs(n - page) > 2) {
            if (Math.abs(n - page) === 3) bits.push('<span class="px-1 text-mid" aria-hidden="true">&hellip;</span>');
            continue;
        }
        bits.push(n === page
            ? `<span class="rounded-full bg-pasture px-4 py-2 font-bold text-white" aria-current="page">${n}</span>`
            : `<a href="${pageHref(n)}" class="rounded-full border-[1.5px] border-charcoal px-4 py-2 font-semibold text-charcoal no-underline hover:bg-clover">${n}</a>`);
    }
    if (page < pages) {
        bits.push(`<a href="${pageHref(page + 1)}" class="rounded-full border-[1.5px] border-charcoal px-4 py-2 font-semibold text-charcoal no-underline hover:bg-clover">Older &rarr;</a>`);
    }
    return `
    <nav class="mt-10 flex flex-wrap items-center gap-2 border-t-[1.5px] border-charcoal pt-6 text-[15px]" aria-label="Blog pages">
      ${bits.join('\n      ')}
    </nav>`;
}

function blogIndexPage(chunk, page, pages, total, shell) {
    const heading = page === 1
        ? 'ICF Blog'
        : `ICF Blog <span class="text-brick">&middot; page ${page}</span>`;
    const main = `<main id="main">

  <section class="border-b border-charcoal/15 bg-milk">
    <div class="mx-auto max-w-6xl px-5 py-12 md:px-10 md:py-14">
      <p class="text-xs font-bold uppercase tracking-[.14em] text-brick">Publications</p>
      <h1 class="font-display font-display-tight m-0 mb-4 mt-2 text-[clamp(38px,5.4vw,68px)] font-extrabold leading-[0.94] tracking-tight text-pasture">${heading}</h1>
      <p class="m-0 max-w-[58ch] text-[17px] text-[#3A403C]">Certification, education, advocacy, events, industry news and the members behind them &mdash; written by the Federation, for the people who make, age, sell and buy the cheese.</p>
      <p class="m-0 mt-3 text-sm text-mid">${total} posts &middot; page ${page} of ${pages}</p>
    </div>
  </section>

  <section class="mx-auto max-w-6xl px-5 py-12 md:px-10" aria-labelledby="posts-h">
    <h2 id="posts-h" class="sr-only">Recent posts</h2>
    <div class="grid grid-cols-1 gap-4 md:grid-cols-2 nav:grid-cols-3">

${chunk.map(card).join('\n\n')}

    </div>${pagination(page, pages)}
  </section>
</main>`;

    const title = page === 1 ? 'Blog · More Cheese' : `Blog · page ${page} · More Cheese`;
    const desc = 'The ICF blog: certification, education, advocacy, events, industry news and member spotlights from the International Cheese Federation.';
    return retitle(shell.head, title, desc) + main + shell.tail;
}

function tagList(tags) {
    if (!tags.length) return '';
    return `
    <ul class="mt-8 flex list-none flex-wrap gap-2 p-0 text-[12px]">
${tags.map((t) => `      <li class="rounded-full border border-charcoal/25 px-3 py-1 font-semibold text-mid">${esc(t)}</li>`).join('\n')}
    </ul>`;
}

function postPage(post, prev, next, shell) {
    // `prev` is the older post and `next` the newer one, matching the theme's
    // single.php so the two builds read the same way.
    const bodyHtml = marked.parse(post.body, { gfm: true, breaks: false });
    const minutes = Math.max(1, Math.round(post.body.split(/\s+/).length / 200));

    const nav = (prev || next) ? `
    <nav class="mt-10 grid grid-cols-1 gap-3 border-t-[1.5px] border-charcoal pt-6 md:grid-cols-2" aria-label="More posts">
${prev ? `      <a href="/${prev.slug}/" class="rounded-2xl border-[1.5px] border-charcoal p-4 no-underline transition hover:bg-clover">
        <span class="block text-[11px] font-bold uppercase tracking-[.14em] text-brick">Previous</span>
        <span class="font-display mt-1 block text-[17px] font-bold leading-tight tracking-tight text-charcoal">${esc(prev.title)}</span>
      </a>` : ''}
${next ? `      <a href="/${next.slug}/" class="rounded-2xl border-[1.5px] border-charcoal p-4 no-underline transition hover:bg-clover md:text-right">
        <span class="block text-[11px] font-bold uppercase tracking-[.14em] text-brick">Next</span>
        <span class="font-display mt-1 block text-[17px] font-bold leading-tight tracking-tight text-charcoal">${esc(next.title)}</span>
      </a>` : ''}
    </nav>` : '';

    // No second disclaimer: the verbatim paragraph is already the last thing in
    // every post's body, and the footer carries the site-wide copy.
    const main = `<main id="main">

  <article class="mx-auto max-w-[72ch] px-5 py-12 md:py-16">
    <nav aria-label="Breadcrumb" class="mb-6 text-sm">
      <a href="/blog/" class="text-brick no-underline hover:underline">&larr; ICF Blog</a>
    </nav>

    <p class="m-0 text-[11px] font-bold uppercase tracking-[.14em] text-brick">${esc(post.category)}</p>
    <h1 class="font-display font-display-tight m-0 mb-4 mt-3 text-[clamp(34px,4.6vw,56px)] font-extrabold leading-[0.96] tracking-tight text-pasture">${esc(post.title)}</h1>
    <p class="m-0 mb-8 border-b border-charcoal/20 pb-6 text-sm text-mid">
      <time datetime="${post.date}">${longDate(post.date)}</time> &middot; International Cheese Federation &middot; ${minutes} minute read
    </p>

    <div class="prose-mc">
${bodyHtml.trimEnd()}
    </div>${tagList(post.tags)}

    <aside class="mt-10 rounded-2xl bg-clover p-6">
      <h2 class="font-display m-0 text-xl font-bold tracking-tight">Start on the ladder</h2>
      <p class="m-0 mt-2 text-[15px] text-[#243027]">Four rungs, 63 courses this year, cohorts named Brook, Meadow, Alpine and Birch.</p>
      <div class="mt-4 flex flex-wrap gap-2.5">
        <a href="/learn.html" class="rounded-full bg-pasture px-5 py-2.5 text-sm font-bold text-white no-underline hover:bg-[#0E4530]">See the credential ladder</a>
        <a href="/join.html" class="rounded-full border-[1.5px] border-charcoal px-5 py-2.5 text-sm font-semibold text-charcoal no-underline hover:bg-charcoal hover:text-milk">Compare membership tiers</a>
      </div>
    </aside>${nav}
  </article>
</main>`;

    const desc = trimWords(post.excerpt || post.title, 30);
    return retitle(shell.head, `${post.title} · More Cheese`, desc) + main + shell.tail;
}

/* ------------------------------------------------------------------ build */

function copyStatic() {
    let files = 0;
    for (const entry of fs.readdirSync(SITE, { withFileTypes: true })) {
        if (SKIP_TOP.has(entry.name) || entry.name.startsWith('.')) continue;
        const from = path.join(SITE, entry.name);
        const to = path.join(DIST, entry.name);
        if (entry.isDirectory()) {
            fs.cpSync(from, to, { recursive: true });
            files += walk(from).length;
        } else {
            fs.mkdirSync(DIST, { recursive: true });
            fs.copyFileSync(from, to);
            files++;
        }
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
    const closer = html.indexOf('<p class="nav:col-span-3">', endOfH2);
    if (open < 0 || closer < 0) throw new Error('index.html: could not find the "this week" card block');

    const cards = latest.map((p, i) => {
        const lead = i === 0;
        return `    <article class="border-t-[1.5px] border-charcoal pt-3">
      <div class="text-[11px] font-bold uppercase tracking-[.14em] text-brick">${esc(p.category)}${lead ? ' &middot; this week' : ''}</div>
      <h3 class="font-display mb-1.5 mt-2 ${lead ? 'text-3xl' : 'text-[22px]'} font-bold leading-[1.1] tracking-tight">
        <a href="/${p.slug}/" class="text-charcoal no-underline hover:text-pasture">${esc(p.title)}</a>
      </h3>
      <p class="m-0 text-sm text-[#3A403C]">${esc(trimWords(p.excerpt, 26))}</p>
    </article>`;
    }).join('\n');

    html = html.slice(0, endOfH2 + '</h2>'.length) + '\n' + cards + '\n    ' + html.slice(closer);
    fs.writeFileSync(file, html, 'utf8');
    return latest.length;
}

/** blog.html was only ever the design of the index; /blog/ is the real thing. */
function blogRedirect() {
    write('blog.html', `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta http-equiv="refresh" content="0; url=/blog/">
<link rel="canonical" href="/blog/">
<title>ICF Blog &middot; More Cheese</title>
<meta name="robots" content="noindex">
</head>
<body>
<p>The ICF blog has moved to <a href="/blog/">/blog/</a>.</p>
</body>
</html>
`);
}

/** Every page carries the header, footer and asset links as `./x`; generated
 *  pages sit one and three levels down, so dist is normalised to root-absolute. */
function rootAbsoluteLinks() {
    let touched = 0;
    let rewrites = 0;
    for (const file of walk(DIST)) {
        if (!file.endsWith('.html')) continue;
        const before = fs.readFileSync(file, 'utf8');
        let n = 0;
        const after = before.replace(/\b(href|src)="\.\/([^"]*)"/g, (_m, attr, rest) => {
            n++;
            return `${attr}="/${rest}"`;
        });
        if (n) {
            fs.writeFileSync(file, after, 'utf8');
            touched++;
            rewrites += n;
        }
    }
    return { touched, rewrites };
}

/* -------------------------------------------- Azure Static Web App routing */

// The WordPress URLs that exist on morecheese.org today, and the static file each
// one now maps to. Everything here 301s: the .html file is the canonical address
// of the static site, and a permanent redirect keeps whatever already links to
// the old URL (search engines, the Knowledge Hub crawler's seed list, bookmarks)
// pointing at one address rather than two.
const LEGACY_PAGES = {
    '/join/': '/join.html',
    '/learn/': '/learn.html',
    '/library/': '/library.html',
    '/compete/': '/compete.html',
    '/events/': '/events.html',
    '/advocacy/': '/advocacy.html',
    '/about/': '/about.html',
    '/faq/': '/faq.html',
    '/research/': '/research.html',
    '/careers/': '/careers.html',
    '/contact/': '/contact.html',
    '/faq/membership-dues/': '/faq-membership-dues.html',
    '/faq/membership-benefits/': '/faq-membership-benefits.html',
    '/faq/renewals-account/': '/faq-renewals-account.html',
    '/faq/certifications/': '/faq-certifications.html',
    '/faq/conferences-events/': '/faq-conferences-events.html',
    '/faq/publications-resources/': '/faq-publications-resources.html',
    '/faq/career-governance/': '/faq-career-governance.html',
    '/faq/organization-directory/': '/faq-organization-directory.html',
};

// Retired at the WordPress cutover and kept retired here.
const RETIRED = {
    '/faq/cheese-education/': '/library.html',
    '/programs/': '/learn.html',
    '/about-page/': '/about.html',
};

export function staticWebAppConfig() {
    const routes = [];

    // /blog/ is a real generated directory; naming it explicitly documents that
    // this URL is load-bearing (it is the Knowledge Hub crawler's seed).
    routes.push({ route: '/blog/', rewrite: '/blog/index.html' });

    for (const [from, to] of Object.entries({ ...RETIRED, ...LEGACY_PAGES })) {
        // Both spellings: WordPress served the trailing-slash form, but plenty of
        // links in the wild drop it, and SWA matches the path literally.
        routes.push({ route: from, redirect: to, statusCode: 301 });
        const bare = from.replace(/\/$/, '');
        if (bare) routes.push({ route: bare, redirect: to, statusCode: 301 });
    }

    return {
        $schema: 'https://json.schemastore.org/staticwebapp.config.json',
        routes,
        // No navigationFallback: a rewrite there would answer every unknown URL
        // with 200 and the 404 page, which is worse than useless for a site whose
        // content is crawled. responseOverrides keeps the 404 status honest.
        responseOverrides: {
            404: { rewrite: '/404.html', statusCode: 404 },
        },
        globalHeaders: {
            'X-Content-Type-Options': 'nosniff',
            'Referrer-Policy': 'strict-origin-when-cross-origin',
        },
    };
}

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
    const pageNames = new Set(fs.readdirSync(DIST).filter((f) => f.endsWith('.html')).map((f) => f.replace(/\.html$/, '')));
    const collisions = posts.filter((p) => pageNames.has(p.slug)).map((p) => p.slug);

    const blogShell = chassis('blog.html');
    const postShell = chassis('post.html');

    const pages = Math.ceil(posts.length / PER_PAGE);
    for (let page = 1; page <= pages; page++) {
        const chunk = posts.slice((page - 1) * PER_PAGE, page * PER_PAGE);
        const html = blogIndexPage(chunk, page, pages, posts.length, blogShell);
        write(page === 1 ? 'blog/index.html' : `blog/page/${page}/index.html`, html);
    }

    posts.forEach((post, i) => {
        const next = i > 0 ? posts[i - 1] : null;      // newer
        const prev = i < posts.length - 1 ? posts[i + 1] : null; // older
        write(`${post.slug}/index.html`, postPage(post, prev, next, postShell));
    });

    const homeCards = rewriteHomeCards(posts.slice(0, 3));
    blogRedirect();
    const links = rootAbsoluteLinks();

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
