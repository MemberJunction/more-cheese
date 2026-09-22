/**
 * The public site's Azure Static Web Apps routing table.
 *
 * WHY THIS IS ITS OWN MODULE. `changes.yml` runs `npm run test:gates` at the TOP of the job, before
 * any `npm install`, because repo-gates.md requires a gate to be a zero-dependency script that reads
 * the repo and nothing else. `build-site.mjs` imports `marked` and `js-yaml`, so a spec that reaches
 * this table through that file dies on `ERR_MODULE_NOT_FOUND: Cannot find package 'marked'` — which
 * is exactly how the first attempt at testing it failed. The routing table itself needs no
 * dependency at all, so it lives here and stays testable for free. Same reasoning as
 * `release-base-ref.mjs`, which exists because `validate-loom-data.mjs` runs its audit at import.
 *
 * THE INCIDENT THIS TABLE CAUSED. The v1.2.0 push to `main` ran `Publish public website` for the
 * first time ever — it only fires on a push to `main`, and `main` had never moved — and Azure
 * refused the deployment:
 *
 *   A rule was already processed with a duplicate route /faq/cheese-education.
 *
 * This emitted BOTH spellings of every legacy URL, on the belief that "SWA matches the path
 * literally". It does not: Azure normalises the trailing slash away before matching, so `/programs/`
 * and `/programs` are ONE rule to it and the second is rejected — taking the whole config, and the
 * deployment, with it. 22 of 45 routes collided. Azure names only the first it meets and exits,
 * which is why the error reads like a single bad URL.
 */

/* -------------------------------------------- Azure Static Web App routing */

// The WordPress URLs that exist on morecheese.org today, and the static file each
// one now maps to. Everything here 301s: the .html file is the canonical address
// of the static site, and a permanent redirect keeps whatever already links to
// the old URL (search engines, the Knowledge Hub crawler's seed list, bookmarks)
// pointing at one address rather than two.
const LEGACY_PAGES = {
    // The old flat addresses (`/join.html`, `/faq-membership-dues.html`) — 19 of them, still linked from
    // the WordPress era and from search results — now redirect to the pretty URLs the build publishes.
    '/join.html': '/join/',
    '/learn.html': '/learn/',
    '/library.html': '/library/',
    '/compete.html': '/compete/',
    '/events.html': '/events/',
    '/advocacy.html': '/advocacy/',
    '/about.html': '/about/',
    '/faq.html': '/faq/',
    '/research.html': '/research/',
    '/careers.html': '/careers/',
    '/contact.html': '/contact/',
    '/faq-membership-dues.html': '/faq/membership-dues/',
    '/faq-membership-benefits.html': '/faq/membership-benefits/',
    '/faq-renewals-account.html': '/faq/renewals-account/',
    '/faq-certifications.html': '/faq/certifications/',
    '/faq-conferences-events.html': '/faq/conferences-events/',
    '/faq-publications-resources.html': '/faq/publications-resources/',
    '/faq-career-governance.html': '/faq/career-governance/',
    '/faq-organization-directory.html': '/faq/organization-directory/',
};
const RETIRED = {
    '/faq/cheese-education/': '/library/',
    '/programs/': '/learn/',
    '/about-page/': '/about/',
    '/blog.html': '/blog/',
};

export function staticWebAppConfig() {
    const routes = [];

    // /blog/ is a real generated directory; naming it explicitly documents that
    // this URL is load-bearing (it is the Knowledge Hub crawler's seed).
    routes.push({ route: '/blog/', rewrite: '/blog/index.html' });

    for (const [from, to] of Object.entries({ ...RETIRED, ...LEGACY_PAGES })) {
        // ONE rule per URL, in the trailing-slash spelling WordPress served. This used to emit the
        // bare spelling too, on the belief that "SWA matches the path literally" — it does not. Azure
        // normalises the trailing slash away before matching, so `/programs/` and `/programs` are the
        // same rule to it, and it rejects the second as a duplicate. It rejects the whole config with
        // it: 22 of 45 routes collided and the v1.2.0 deployment never happened. One rule still
        // answers both spellings, because the same normalisation applies to the incoming request.
        routes.push({ route: from, redirect: to, statusCode: 301 });
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
