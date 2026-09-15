# Deploying the Terroir theme to morecheese.org

**Theme:** `Terroir — More Cheese`, version 1.0.0
**Package:** `website/wp-theme/terroir.zip` (106 KB, 32 files, unzips to `terroir/`)
**Replaces:** `charity-organization`
**Tested on:** WordPress 7.1 / PHP 8.3 in Docker, permalinks `/%postname%/`, 16 posts, 24 pages.

The theme reads **slugs, never page content**. Every page body is in the template, so the existing
WordPress page content on the live site is ignored, not overwritten, and not required. That is what
makes this safe to activate before anyone tidies the content.

---

## Before you activate: create eight pages

These eight slugs have no page on the live site yet. The theme renders a template for each, but
WordPress will 404 the URL until a published page with that exact slug exists.

| Slug | Suggested title | Parent |
| --- | --- | --- |
| `join` | Join | — |
| `learn` | Learn | — |
| `library` | Cheese Library | — |
| `compete` | Compete | — |
| `events` | Events | — |
| `advocacy` | Advocacy | — |
| `about` | About the ICF | — |
| `careers` | Careers & Volunteering | — |

Status must be `publish`. Content can be anything — a single sentence is fine; nothing is rendered.

```bash
# One page, via REST. Repeat per row above.
curl -u "$WP_USER:$WP_APP_PASSWORD" \
  -X POST https://morecheese.wpenginepowered.com/wp-json/wp/v2/pages \
  -H 'Content-Type: application/json' \
  -d '{"title":"Cheese Library","slug":"library","status":"publish",
       "content":"Rendered by the Terroir theme template page-library.php."}'
```

### Pages that already exist and need nothing

`home` (275, front page), `blog` (274, posts page), `contact` (39), `research` (35), `faq` (58) and
its eight children — `membership-dues` (59), `membership-benefits` (60), `renewals-account` (61),
`certifications` (66), `conferences-events` (67), `publications-resources` (68),
`career-governance` (69), `organization-directory` (71).

The FAQ children must stay children of page 58 so their permalinks remain `/faq/<slug>/`. The
templates are chosen by the child's own slug, so the parent only affects the URL.

### Pages that stay published but become redirects

`programs` (36) and `about-page` (31) keep existing. The theme 301s them at `template_redirect`
before the page renders, so nothing needs deleting and the rollback is clean. Leave them alone.

### Settings — already correct, verify only

- Settings → Reading: front page = `home` (275), posts page = `blog` (274).
- Settings → Permalinks: post name. FAQ children resolve at `/faq/<slug>/`.

No menus to assign: the header nav is built from slugs in `header.php`. No widgets, no customiser
settings, no options written by the theme.

---

## Activate

1. **Appearance → Themes → Add New → Upload Theme**, choose `terroir.zip`, **Install Now**.
2. Do **not** activate yet if you want a look first — **Live Preview** renders the real site.
3. **Activate**.
4. **Purge the WP Engine cache** (WP Engine → Caching → Purge all caches). The old theme's CSS and
   HTML are cached at the edge; without a purge the first visitors get a half-swapped page.
5. Walk the verification list below.

Total downtime: none. Activation is atomic and the previous theme stays installed.

---

## Verify after activation

Every URL below should return 200 unless stated. Check the header nav renders, the page is not the
generic fallback, and the footer carries the fiction disclaimer.

```
/                                        front page, hero canvas, 3 latest posts from the loop
/join/  /learn/  /library/  /compete/    the four new programme pages
/events/  /advocacy/  /about/  /careers/
/research/  /contact/                    existing pages, new templates
/faq/                                    hub: 8 topic cards + 10 quick answers
/faq/membership-dues/                    and the other seven FAQ children
/blog/                                   12 cards + pagination
/blog/page/2/  …  /blog/page/11/         124 posts ÷ 12 = 11 pages
/<any-post-slug>/                        single post, article typography
/nothing-here/                           404 page with the four routes out
/faq/cheese-education/   → 301 /library/
/programs/               → 301 /learn/
/about-page/             → 301 /about/
```

Three things to click rather than curl, because they are JavaScript:

- `/library/` — set Family to Blue, then Milk to Sheep. The count should read "Showing 1 of 25
  styles." Clear filters restores 25.
- `/faq/certifications/` — type "exam" in the filter box. Matching questions open; Clear closes them.
- Any page below 900px wide — the Menu button opens the nav and Escape closes it.

Quick smoke test from a terminal:

```bash
for u in / /join/ /learn/ /library/ /compete/ /events/ /advocacy/ /about/ /careers/ \
         /research/ /contact/ /faq/ /faq/membership-dues/ /blog/ /blog/page/2/; do
  printf '%-32s %s\n' "$u" "$(curl -s -o /dev/null -w '%{http_code}' https://morecheese.org$u)"
done
for u in /faq/cheese-education/ /programs/ /about-page/; do
  printf '%-32s %s -> %s\n' "$u" \
    "$(curl -s -o /dev/null -w '%{http_code}' https://morecheese.org$u)" \
    "$(curl -sI https://morecheese.org$u | grep -i ^location: | tr -d '\r')"
done
```

---

## Rollback

1. **Appearance → Themes → charity-organization → Activate.**
2. Purge the WP Engine cache.

That is the whole rollback and it takes under a minute. The theme writes no options, creates no
pages, registers no post types or taxonomies, and runs no migrations — there is nothing to undo.

Two things survive a rollback because they are content, not theme state, and both are harmless:
the eight new pages (they will render in `charity-organization` with their placeholder bodies —
unpublish them if that matters) and nothing else.

The three 301s disappear on rollback, because they live in this theme's `functions.php`. If the
redirects need to outlive the theme, move them to a WP Engine redirect rule or an mu-plugin.

---

## Test matrix — results from the local Docker run

WordPress 7.1, PHP 8.3, `WP_DEBUG` on with `display_errors`, theme installed **from the zip** via
`wp theme install terroir.zip --activate` (the same code path as Appearance → Add New → Upload).

Checked per URL: HTTP status · `<title>` present · header nav (`id="nav-menu"`) present · fiction
disclaimer present verbatim · no PHP warning/notice/deprecation/fatal in the HTML.

| URL | Expect | Got | Title | Nav | Disclaimer | PHP | Result |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `/` | 200 | 200 | ok | ok | ok | clean | PASS |
| `/join/` | 200 | 200 | ok | ok | ok | clean | PASS |
| `/learn/` | 200 | 200 | ok | ok | ok | clean | PASS |
| `/library/` | 200 | 200 | ok | ok | ok | clean | PASS |
| `/compete/` | 200 | 200 | ok | ok | ok | clean | PASS |
| `/events/` | 200 | 200 | ok | ok | ok | clean | PASS |
| `/advocacy/` | 200 | 200 | ok | ok | ok | clean | PASS |
| `/about/` | 200 | 200 | ok | ok | ok | clean | PASS |
| `/research/` | 200 | 200 | ok | ok | ok | clean | PASS |
| `/careers/` | 200 | 200 | ok | ok | ok | clean | PASS |
| `/contact/` | 200 | 200 | ok | ok | ok | clean | PASS |
| `/faq/` | 200 | 200 | ok | ok | ok | clean | PASS |
| `/faq/membership-dues/` | 200 | 200 | ok | ok | ok | clean | PASS |
| `/faq/membership-benefits/` | 200 | 200 | ok | ok | ok | clean | PASS |
| `/faq/renewals-account/` | 200 | 200 | ok | ok | ok | clean | PASS |
| `/faq/certifications/` | 200 | 200 | ok | ok | ok | clean | PASS |
| `/faq/conferences-events/` | 200 | 200 | ok | ok | ok | clean | PASS |
| `/faq/publications-resources/` | 200 | 200 | ok | ok | ok | clean | PASS |
| `/faq/career-governance/` | 200 | 200 | ok | ok | ok | clean | PASS |
| `/faq/organization-directory/` | 200 | 200 | ok | ok | ok | clean | PASS |
| `/blog/` | 200 | 200 | ok | ok | ok | clean | PASS |
| `/blog/page/2/` | 200 | 200 | ok | ok | ok | clean | PASS |
| `/what-the-cheese-foundations-certificate-is-for/` | 200 | 200 | ok | ok | ok | clean | PASS |
| `/no-such-page-here/` | 404 | 404 | ok | ok | ok | clean | PASS |
| `/faq/cheese-education/` | 301 → `/library/` | 301 → `/library/` | — | — | — | clean | PASS |
| `/programs/` | 301 → `/learn/` | 301 → `/learn/` | — | — | — | clean | PASS |
| `/about-page/` | 301 → `/about/` | 301 → `/about/` | — | — | — | clean | PASS |

**27 / 27 PASS.** Apache and PHP container logs contain no warning, notice, deprecation or fatal.

### Browser checks (Playwright, headless Chromium)

| Check | Result |
| --- | --- |
| Nav current-page marking on `/`, `/join/`, `/library/`, `/blog/`, `/blog/page/2/`, `/faq/membership-dues/` | PASS — `/blog/page/2/` still marks Blog; FAQ children mark nothing, as designed |
| Library: 25 styles shown, Family=Blue → 3, +Milk=Sheep → 1, live count text | PASS |
| Library: no-match empty state, Clear filters restores 25, free-text "brine" → 4 | PASS |
| FAQ: 11 questions, filter "exam" → 8, matching `<details>` auto-open, Clear closes all | PASS |
| Mobile nav at 480px: hidden → toggle opens → `aria-expanded="true"` → Escape closes | PASS |
| Contact form submit does not navigate (`data-inert`) | PASS |
| Footer year filled by JS; hero canvas painted | PASS |
| JavaScript console/page errors across all pages visited | **0** |

### Other checks

| Check | Result |
| --- | --- |
| `php -l` on all 25 PHP files | no syntax errors |
| Relative `./*.html` links surviving in rendered output | 0 across 12 sampled pages |
| `href="#"` in rendered output | 0 across 8 sampled pages |
| Tailwind play CDN script + inline config in `<head>` | exactly once each |
| Google Fonts stylesheet + preconnects | present |
| `assets/site.css`, `assets/site.js`, `screenshot.png` over HTTP | 200 |
| Emoji script / `meta name="generator"` | removed |
| Single post disclaimer count | 2 — one from post content, one in the footer. No third added |
| Blog pagination | 12 cards page 1, 4 on page 2, `the_posts_pagination` renders |
| Front page "this week" | 3 real posts with real permalinks, from the loop |
| `terroir.zip` installs via `wp theme install` and activates | PASS, then full matrix re-run green |

---

## Known trade-offs, for the record

1. **Tailwind loads from the play CDN at runtime.** This is Amith's constraint (vanilla JS, no build
   step) and Tailwind's own documentation says the play CDN is not intended for production: the
   browser compiles the utility CSS on every page load, which costs roughly 100–150 ms of script
   time and makes the site dependent on `cdn.tailwindcss.com` being up. It works and it ships. The
   iteration, when someone wants it, is a one-off Tailwind build committed as a static
   `assets/tailwind.css` — the markup does not change, only the enqueue in `functions.php`.
2. **Google Fonts is a second third-party dependency.** Same shape of risk, much smaller.
3. **Page content is ignored on all 20 slug templates.** Editing `/join/` in wp-admin changes
   nothing on the front end. That is deliberate — the static build is the source of truth for the
   copy — but it will surprise whoever first tries to fix a typo through the editor. `page.php` (the
   fallback for any *new* page) does render editor content normally.
4. **The header nav is hard-coded**, not a WordPress menu, so it cannot be reordered in wp-admin. A
   `primary` menu location is registered but unused. Swapping to a real menu is a small change to
   `header.php` if editors ever need control.
5. **`the_posts_pagination` markup is WordPress default**, restyled lightly. With 124 posts the blog
   runs to 11 pages; the numbered list is fine at that size but worth a look on mobile.
6. **Global block styles are left enqueued.** They are ~8 KB of unused custom properties on the 20
   hand-written templates, kept because `page.php` and `single.php` render whatever the editor
   produced and a preset colour would otherwise lose its CSS. Safe to remove later if no page ever
   uses blocks.
7. **`screenshot.png` is a flat palette composition**, not a render of the homepage. Cosmetic, only
   visible in Appearance → Themes.

## What is in the package

```
terroir/
  style.css                 theme header only; real CSS is assets/site.css
  functions.php             supports, enqueues, head cleanup, 12-per-page, the three 301s, helpers
  header.php  footer.php    shared chrome, nav from slugs, disclaimer verbatim
  front-page.php            homepage; "this week" comes from the loop
  home.php                  blog index, 12 cards + pagination
  single.php                post, article typography, prev/next
  page.php                  generic fallback for pages added later
  404.php  index.php
  page-join.php  page-learn.php  page-library.php  page-compete.php  page-events.php
  page-advocacy.php  page-about.php  page-research.php  page-careers.php  page-contact.php
  page-faq.php
  page-membership-dues.php  page-membership-benefits.php  page-renewals-account.php
  page-certifications.php  page-conferences-events.php  page-publications-resources.php
  page-career-governance.php  page-organization-directory.php
  assets/site.css  assets/site.js
  screenshot.png
```

`assets/site.css` and `assets/site.js` are byte-identical copies of the static build's files in
`website/assets/`. When either changes, copy it across and re-zip — the enqueue is cache-busted by
`filemtime`, so no version bump is needed for asset changes.
