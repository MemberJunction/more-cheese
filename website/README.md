# More Cheese — public website (source)

This folder holds the **public marketing site for More Cheese**, the demonstration site of the
(fictional) International Cheese Federation. These pages are the *source of truth for the design
and the copy*; they are built to be lifted into WordPress later, not to be deployed as-is.

Design identity: **Terroir** — pasture green, clover, one brick accent on a milk ground;
Bricolage Grotesque headlines over Public Sans body copy. It is a faithful build of the `terroir`
concept in `../../more-cheese-work/design/icf-site-concepts.html`.

## Constraint set

Non-negotiable, because the markup has to survive being pasted into a CMS:

- **Static HTML only.** No build step, no bundler, no npm, no framework.
- **Vanilla JavaScript**, all of it in `assets/site.js`.
- **Tailwind CSS from the play CDN** (`https://cdn.tailwindcss.com`), configured by an inline
  `tailwind.config = {...}` block in every page's `<head>`.
- **Small custom CSS only**, in `assets/site.css` — the things utilities cannot express
  (variable-font axes, marquee keyframes, the 900px nav breakpoint, article typography).
- **No templating.** The header and footer are copied verbatim into every page; that is deliberate,
  because each page ships to WordPress on its own.
- **Relative links only** (`./join.html`), no absolute local paths.
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
| `learn.html` | The four-rung credential ladder, the cohorts, the 63-course catalogue, cheese-wheel graphic, the four programme areas and six current initiatives |
| `compete.html` | The annual competition: six categories and how blind judging works |
| `events.html` | Notice board table, the October Annual Conference, the virtual symposium, regional meetups, how to propose a session |
| `advocacy.html` | Raw-milk rules, labelling, tariffs, import lines; how members comment; 2019–2025 themes |
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
| `contact.html` | Address, routing list, static (non-submitting) enquiry form, `#betty-widget` placeholder, "faster than an email" shortcuts |
| `assets/site.css` | Custom CSS layer |
| `assets/site.js` | Nav toggle, current-page marking, hero canvas, footer year, Cheese Library filter, FAQ question filter, inert-form guard |
| `check-links.py` | **Dev tool, not part of the site.** Verifies every relative `href`/`src` resolves, reports `href="#"`, reports any `intlcheese`, lists each page's `<title>`. Run `python3 check-links.py` from this folder |

## Page → WordPress mapping

| Source file | WordPress object | Slug |
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
| `check-links.py` | *not published* — review tool only | — |

Header and footer become the theme header/footer once; the per-page copies exist only so that each
static file stands alone in review.

The eight FAQ topic pages keep the live site's existing slugs, so the migration is an in-place
content replacement rather than a redirect exercise. Two live slugs are **retired**:
`/faq/cheese-education/` (already a 404 on the live site — its consumer-facing material is now the
open `library.html`) and `/programs/` and `/about-page/`, whose content is folded into `learn.html`
and `about.html` respectively. Those three need 301s at cutover:
`/faq/cheese-education/ → /library/`, `/programs/ → /learn/`, `/about-page/ → /about/`.

## How `blog.html` relates to `content/blog/`

They are different things and should not be confused:

- **`../content/blog/`** holds the actual posts, authored as Markdown, one file per post, named
  `YYYY-MM-DD-<slug>.md` under a year folder (`content/blog/2019/…`). That is the corpus, and it is
  published to WordPress by its own pipeline — the posts do **not** live in this folder.
- **`blog.html`** is only the **design of the index**: the card grid, the category label, the title
  link, the date and the excerpt. In WordPress this becomes the archive template, and the cards are
  generated from the posts rather than hand-written.
- The 12 cards currently in `blog.html` are real posts from the corpus, hand-copied so the page can
  be reviewed with true content. Each links to its published URL (`https://morecheese.org/<slug>/`).
  When the archive template is wired up, these hard-coded cards go away.
- `post.html` is likewise the single-post *design*, populated with one real post
  ("What the Cheese Foundations Certificate is for") so the article typography can be judged.

## WordPress theme

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
  twenty-two HTML files here, and that one PHP function.
- `front-page.php`, `home.php` and `single.php` replace the hand-copied blog cards with the real
  WordPress loop; `blog.html` and `post.html` stay in this folder as the design reference.
- The theme issues the three cutover 301s (`/faq/cheese-education/` → `/library/`, `/programs/` →
  `/learn/`, `/about-page/` → `/about/`) from `functions.php`.

Tested locally on WordPress 7.1 / PHP 8.3 in Docker: 27/27 URL checks pass, no PHP warnings, no
JavaScript errors. Details in `wp-theme/DEPLOY.md`.

## Changing the palette (one place)

All six colours plus the unused `butter` token live in the `tailwind.config` block at the top of
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
brand colour by name. Two caveats, both deliberate and both small:

1. `assets/site.css` repeats a handful of hex values where a utility class cannot reach
   (the logo mark, the skip link, the focus ring, the marquee-free bits of article type). Search
   `assets/site.css` for `#` and update alongside the config.
2. `assets/site.js` draws the hero canvas with the same greens (`#C8E3A0`, `#145C3D`, `#0E4530`),
   and the cheese-wheel SVG on `learn.html` carries its own rind gradient. Both are graphics, not
   theme tokens, so they are edited where they are drawn.

Because there is no templating, a palette change means editing the config block in all twenty-two
HTML files — identical find-and-replace, or one pass once the theme header exists in WordPress.

---

The International Cheese Federation (ICF) and More Cheese are entirely fictional. This site is
demonstration content created for MemberJunction. All people, organizations, events, courses,
certifications, figures, and quotations are invented.
