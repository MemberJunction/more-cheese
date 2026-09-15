# More Cheese — public website (source)

This folder holds the **public marketing site for More Cheese**, the demonstration site of the
(fictional) International Cheese Federation. These pages are the *source of truth for the design
and the copy*, and since the September 2026 cutover they are also what ships: `npm run build:site`
turns this folder plus the blog corpus into `website/dist/`, which GitHub Actions uploads to an
**Azure Static Web App** on every push to `main`. The WordPress theme in `wp-theme/` is now
transitional — see *Publishing* below.

Copy is **US English** throughout (organization, program, labeling, catalog, aging, color, center,
license, mold, gray, inquiry). If you add copy, match that; `flavor`, `program` and friends are
a review comment, not a style choice.

Design identity: **Terroir** — pasture green, clover, one brick accent on a milk ground;
Bricolage Grotesque headlines over Public Sans body copy. It is a faithful build of the `terroir`
concept in `../../more-cheese-work/design/icf-site-concepts.html`.

## Constraint set

Non-negotiable, because the markup has to survive being pasted into a CMS:

- **Static HTML only.** No bundler, no framework, no client-side templating. The one build step is
  `scripts/build-site.mjs`, and it only assembles: it copies these files and renders the Markdown
  blog into pages. Nothing here needs compiling and every page still opens correctly from `file://`.
- **Vanilla JavaScript**, all of it in `assets/site.js`.
- **Tailwind CSS from the play CDN** (`https://cdn.tailwindcss.com`), configured by an inline
  `tailwind.config = {...}` block in every page's `<head>`.
- **Small custom CSS only**, in `assets/site.css` — the things utilities cannot express
  (variable-font axes, marquee keyframes, the 900px nav breakpoint, article typography).
- **No templating.** The header and footer are copied verbatim into every page; that is deliberate,
  because each page ships to WordPress on its own.
- **Relative links only** (`./join.html`), no absolute local paths — in *this folder*, so each page
  stands alone in review. The build rewrites every `./x` to a root-absolute `/x` in `dist/`, because
  the generated pages live one and three levels down.
- **Images are inline SVG or canvas** — no binary assets, nothing to migrate.
- Every page carries the fiction disclaimer in the footer, verbatim.
- **One domain.** Every address on the site is `@morecheese.org`; the old `intlcheese.org` domain
  must not appear anywhere, in a link or in prose. `check-links.py` fails the build if it does.
- **No dead controls.** No `href="#"`; every button either does something in `assets/site.js` or is
  a real link. In-page anchors must point at an `id` that exists on the page.

## Files

| File | What it is |
| --- | --- |
| `index.html` | Homepage: split hero with the canvas Emmental panel, member marquee, three path cards, the Cheese Library band, this week's posts |
| `join.html` | Membership: four-tier rate card, what every tier includes, how dues billing works |
| `learn.html` | The four-rung credential ladder, the cohorts, the 63-course catalog, cheese-wheel graphic, the four program areas and six current initiatives |
| `compete.html` | The annual competition: six categories and how blind judging works |
| `events.html` | Notice board table, the October Annual Conference, the virtual symposium, regional meetups, how to propose a session |
| `advocacy.html` | Raw-milk rules, labeling, tariffs, import lines; how members comment; 2019–2025 themes |
| `blog.html` | Blog index design — 12 post cards linking to the live post URLs |
| `post.html` | Single-post template showing article typography |
| `about.html` | The Federation, the three commitments, where the membership is, the six committees, staff by role, the fiction note |
| `library.html` | **Cheese Library** — eight families, 25 reference styles, vanilla-JS filter/search (family, milk, texture). The one interactive showpiece |
| `research.html` | The four standing reports, journal articles, the Monday brief and what is open vs members-only |
| `careers.html` | Member vacancies, four routes into the trade, the apprenticeship strand, six volunteer roles |
| `faq.html` | FAQ hub: eight topic cards plus the ten most-asked questions, with a filter box |
| `faq-membership-dues.html` | FAQ topic — cost, tiers, billing, refunds, hardship dues (10 Q&As) |
| `faq-membership-benefits.html` | FAQ topic — what is included, what is not, fit against a regional guild (8 Q&As) |
| `faq-renewals-account.html` | FAQ topic — renewal, lapse, covered staff, receipts, directory entry (10 Q&As) |
| `faq-certifications.html` | FAQ topic — the four rungs, the exam, reconfirmation, continuing education (11 Q&As) |
| `faq-conferences-events.html` | FAQ topic — the October conference, proposing a session, the virtual strand (11 Q&As) |
| `faq-publications-resources.html` | FAQ topic — the brief, the archive, research, reuse, sponsorship (9 Q&As) |
| `faq-career-governance.html` | FAQ topic — vacancies, committees, voting, ethics, advocacy, dues rises (12 Q&As) |
| `faq-organization-directory.html` | FAQ topic — the directory, what is visible, which inbox to use (10 Q&As) |
| `contact.html` | Address, routing list, static (non-submitting) inquiry form, `#betty-widget` placeholder, "faster than an email" shortcuts |
| `404.html` | Page-not-found, in the site design: four routes out plus a contact card. Served with a real 404 status by the Static Web App |
| `assets/site.css` | Custom CSS layer |
| `assets/site.js` | Nav toggle, current-page marking, hero canvas, footer year, Cheese Library filter, FAQ question filter, inert-form guard, first-visit fiction notice |
| `check-links.py` | **Dev tool, not part of the site.** Verifies every relative `href`/`src` resolves, reports `href="#"`, reports any `intlcheese`, lists each page's `<title>`. Run `python3 check-links.py` from this folder, and `python3 check-links.py --dist` after a build to check `dist/` the same way |
| `dist/` | **Build output, not source.** Written by `npm run build:site`, wiped and rewritten every run. Never edit it, never commit a hand fix to it |

## Page → URL mapping

The **Live URL** column is the address the WordPress site serves today and that the static site
must keep answering. Anything in `LEGACY_PAGES` in `scripts/build-site.mjs` becomes a 301 in
`dist/staticwebapp.config.json`; the `.html` file is the canonical address of the static site.

| Source file | WordPress object | Live URL |
| --- | --- | --- |
| `index.html` | Front page (static) | `/` |
| `join.html` | Page — Join | `/join/` |
| `learn.html` | Page — Learn | `/learn/` |
| `compete.html` | Page — Compete | `/compete/` |
| `events.html` | Page — Events | `/events/` |
| `advocacy.html` | Page — Advocacy | `/advocacy/` |
| `blog.html` | Posts index (archive template) | `/blog/` |
| `post.html` | Single post template | `/<post-slug>/` |
| `about.html` | Page — About the ICF | `/about/` |
| `library.html` | Page — Cheese Library | `/library/` |
| `research.html` | Page — Research & Publications | `/research/` |
| `careers.html` | Page — Careers & Volunteering | `/careers/` |
| `faq.html` | Page — FAQ (hub) | `/faq/` |
| `faq-membership-dues.html` | Page — Membership & Dues (child of FAQ) | `/faq/membership-dues/` |
| `faq-membership-benefits.html` | Page — Membership Benefits & Services (child of FAQ) | `/faq/membership-benefits/` |
| `faq-renewals-account.html` | Page — Renewals & Account Management (child of FAQ) | `/faq/renewals-account/` |
| `faq-certifications.html` | Page — Certifications (child of FAQ) | `/faq/certifications/` |
| `faq-conferences-events.html` | Page — Conferences & Events (child of FAQ) | `/faq/conferences-events/` |
| `faq-publications-resources.html` | Page — Publications & Resources (child of FAQ) | `/faq/publications-resources/` |
| `faq-career-governance.html` | Page — Career Services, Networking & Governance (child of FAQ) | `/faq/career-governance/` |
| `faq-organization-directory.html` | Page — Organization & Staff Directory (child of FAQ) | `/faq/organization-directory/` |
| `contact.html` | Page — Contact | `/contact/` |
| `404.html` | 404 template | any unmatched URL, with a 404 status |
| `check-links.py` | *not published* — review tool only | — |

Header and footer are copied verbatim into every page; that is why the "Fictional demo" badge had
to be pasted into all twenty-three of them and into `wp-theme/terroir/header.php`.

The eight FAQ topic pages keep the live site's existing slugs. Three live slugs are **retired** and
301 to their replacement: `/faq/cheese-education/ → /library.html` (its consumer-facing material is
now the open `library.html`), `/programs/ → /learn.html` and `/about-page/ → /about.html`.

Two URL shapes are load-bearing and must not change: **`/blog/`** and **`/<post-slug>/`**. The
Knowledge Hub crawler is seeded on `https://morecheese.org/blog/` and follows the post links out of
it, so the build generates exactly those paths — `dist/blog/index.html`, `dist/blog/page/N/index.html`
and `dist/<slug>/index.html` — rather than anything tidier.

## Saying it is fiction

Two things beyond the footer disclaimer, both driven from `assets/site.css` and `assets/site.js`:

- **The nav badge.** A small pill next to the wordmark — "Fictional demo", shortened to "Fiction"
  where the header is tight — linking to `about.html#fiction`. It is in the copied header markup of
  every page and of `wp-theme/terroir/header.php`, so a new page must carry it too. Class
  `.mc-badge`; the responsive labels are `.mc-badge__long` / `.mc-badge__short`.
- **The first-visit notice.** A bottom sheet built by `initFictionNotice()` in `assets/site.js` on a
  visitor's first page view and never again: the flag is `mc-fiction-notice-v1` in `localStorage`,
  and every access is wrapped in try/catch, so a browser with storage blocked shows the notice each
  visit rather than breaking. Escape or "Got it" dismisses it, focus returns to the badge, and
  `prefers-reduced-motion` drops the slide-in. It is built in JS rather than pasted into
  twenty-three files, and takes its "Read more" target from the badge's `href`, which is why the
  same `site.js` works unchanged in the WordPress theme (where the link is `/about/#fiction`).

`about.html` carries the anchor: `<section id="fiction">` with the heading "A note on the fiction".
Do not remove the id.

## Publishing

```sh
npm run build:site                  # -> website/dist/  (idempotent: rm -rf dist first)
cd website && python3 check-links.py && python3 check-links.py --dist
cd website/dist && python3 -m http.server 8777     # then open http://127.0.0.1:8777/
```

`scripts/build-site.mjs` copies this folder (minus `wp-theme/`, `check-links.py`, `README.md` and
`dist/`), renders the blog corpus, rewrites `./x` links to `/x`, and writes
`dist/staticwebapp.config.json`. It prints a summary and names anything it skipped.

`.github/workflows/publish-site.yml` runs it on every push to `main` that touches `website/**`,
`content/blog/**` or the build script, and uploads `website/dist` with
`Azure/static-web-apps-deploy@v1`. The only secret is `AZURE_STATIC_WEB_APPS_API_TOKEN` — the
deployment token of the Static Web App. Releases still follow the `next → main` model in
`docs/template-docs/branching.md`, so the site goes live when the release PR merges.

Two things the local `python3 -m http.server` cannot show you, because they are Azure-side:
the 301s for the old WordPress URLs (`/join/`, `/faq/certifications/`, `/programs/` …) and the 404
status on an unknown path. Check those on the `*.azurestaticapps.net` URL after the first deploy.

## How the blog is built from `content/blog/`

- **`../content/blog/`** holds the posts, authored as Markdown, one file per post, named
  `YYYY-MM-DD-<slug>.md` under a year folder (`content/blog/2019/…`). That is the corpus; the posts
  do **not** live in this folder.
- **`blog.html`** and **`post.html`** are the *designs*. The build reads each of them, keeps
  everything outside `<main id="main"> … </main>` — the `<head>`, the palette block, the header, the
  footer — and swaps in generated content. So a change to the chrome or the palette flows into all
  the generated pages for free; a change *inside* `<main>` on those two files is design reference
  only and is not what ships at `/blog/` or `/<slug>/`.
- In `dist/`, `blog.html` becomes a meta refresh to `/blog/`, and the hand-copied cards on
  `index.html` ("this week") are replaced with the three newest real posts.
- Frontmatter drives everything: `title`, `slug`, `date`, `category`, `tags`, `excerpt`. A file
  without `fictional: true`, without a slug, or without the verbatim disclaimer as its last
  paragraph is **skipped and named in the build summary** — the same contract
  `scripts/publish-wordpress.mjs` enforces.
- The disclaimer is already the final paragraph of every post body, so the article does not add a
  second one. The footer copy is separate and appears on every page.

## WordPress theme (legacy — transitional)

**The theme is no longer the publishing target.** It stays in the repo, activated on
morecheese.org, only until DNS moves to the Static Web App; after that it is dead weight and can be
deleted along with the WordPress site. Until then it must be kept in step with these files, because
it is what the public actually sees: the US-English pass and the fiction notice were applied to
both. The cutover order and the retirement point are in
`../../more-cheese-work/site-static-cutover-2026-09-15.md`.

The static pages in this folder are also shipped as a real, activatable WordPress theme:

| Path | What it is |
| --- | --- |
| `wp-theme/terroir/` | The theme source. One template per page, chosen by slug, so activation needs no template assignment in wp-admin |
| `wp-theme/terroir.zip` | The upload package (Appearance → Themes → Add New → Upload) |
| `wp-theme/DEPLOY.md` | Cutover steps, the eight pages that must exist first, verification list, rollback, and the full local test matrix |

How it relates to these static files:

- Each page's `<main>` is copied verbatim into `wp-theme/terroir/page-<slug>.php`; only the links
  are rewritten (`./join.html` → `home_url('/join/')`, FAQ topics → `/faq/<slug>/`).
- `header.php` and `footer.php` carry the shared chrome once, so the theme is the place where "no
  templating" finally stops being true. **These static files remain the source of truth for the
  design and the copy** — edit here first, then regenerate or hand-copy into the theme.
- `assets/site.css` and `assets/site.js` are copied into `wp-theme/terroir/assets/` unchanged. When
  you change either one, copy it across and re-zip.
- The Tailwind config block lives in `functions.php` (`terroir_tailwind_config()`) rather than in
  each page's `<head>`. A palette change is therefore **two** edits: the config block in all
  twenty-three HTML files here, and that one PHP function.
- `front-page.php`, `home.php` and `single.php` replace the hand-copied blog cards with the real
  WordPress loop; `blog.html` and `post.html` stay in this folder as the design reference.
- The theme issues the three cutover 301s (`/faq/cheese-education/` → `/library/`, `/programs/` →
  `/learn/`, `/about-page/` → `/about/`) from `functions.php`.

Tested locally on WordPress 7.1 / PHP 8.3 in Docker: 27/27 URL checks pass, no PHP warnings, no
JavaScript errors. Details in `wp-theme/DEPLOY.md`.

## Changing the palette (one place)

All six colors plus the unused `butter` token live in the `tailwind.config` block at the top of
every page:

```js
colors: {
  milk:     '#FCFBF7',  // page ground
  pasture:  '#145C3D',  // primary green
  clover:   '#C8E3A0',  // light green
  brick:    '#A23C2C',  // single accent
  charcoal: '#242424',  // text
  mid:      '#5E6560',  // muted text
  butter:   '#EFC24A'   // reserved, unused today
}
```

To move the site to a **yellower variant**, change those hex values — nothing else references a
brand color by name. Two caveats, both deliberate and both small:

1. `assets/site.css` repeats a handful of hex values where a utility class cannot reach
   (the logo mark, the skip link, the focus ring, the marquee-free bits of article type). Search
   `assets/site.css` for `#` and update alongside the config.
2. `assets/site.js` draws the hero canvas with the same greens (`#C8E3A0`, `#145C3D`, `#0E4530`),
   and the cheese-wheel SVG on `learn.html` carries its own rind gradient. Both are graphics, not
   theme tokens, so they are edited where they are drawn.

Because there is no templating, a palette change means editing the config block in all twenty-three
HTML files — identical find-and-replace, or one pass once the theme header exists in WordPress.

---

The International Cheese Federation (ICF) and More Cheese are entirely fictional. This site is
demonstration content created for MemberJunction. All people, organizations, events, courses,
certifications, figures, and quotations are invented.
