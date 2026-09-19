/**
 * Spec for the static site's Azure Static Web Apps routing table.
 *
 * THE INCIDENT. The first push to `main` (v1.2.0, 2026-09-19) ran `Publish public website` for the
 * first time ever — the workflow only fires on a push to `main`, and `main` had never moved. Azure
 * refused the deployment outright:
 *
 *   Encountered an issue while validating staticwebapp.config.json: A rule was already processed
 *   with a duplicate route /faq/cheese-education. Therefore, this rule will not be evaluated.
 *
 * `staticWebAppConfig()` emitted BOTH spellings of every legacy URL — `/programs/` and `/programs`
 * — on the assumption, written into the comment beside it, that "SWA matches the path literally".
 * It does not: Azure normalises the trailing slash away before matching, so the two spellings are
 * ONE rule to it and the second is rejected as a duplicate. 22 of the 45 routes collided; Azure
 * names only the first it meets and exits, which is why the message looks like a single bad URL.
 *
 * Nothing had ever deployed, so there was no green baseline to notice the regression against — the
 * config's first contact with Azure was also its first validation.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { staticWebAppConfig } from './build-site.mjs';

/** Azure's own rule: a trailing slash is not part of the route's identity. `/` stays `/`. */
const normalise = (route) => (route.length > 1 ? route.replace(/\/+$/, '') : route);

test('no two routes collide once Azure normalises the trailing slash away', () => {
    const byPath = new Map();
    for (const { route } of staticWebAppConfig().routes) {
        const key = normalise(route);
        byPath.set(key, [...(byPath.get(key) ?? []), route]);
    }
    const collisions = [...byPath].filter(([, spellings]) => spellings.length > 1);
    assert.deepEqual(
        collisions,
        [],
        `Azure rejects the whole config on the first of these:\n${collisions
            .map(([key, spellings]) => `  ${key} <= ${spellings.join(' , ')}`)
            .join('\n')}`,
    );
});

test('every legacy URL still redirects, so the fix removed duplicates and not coverage', () => {
    const { routes } = staticWebAppConfig();
    // 19 legacy pages + 3 retired = 22 redirects, plus the /blog/ rewrite.
    const redirects = routes.filter((r) => r.redirect);
    assert.equal(redirects.length, 22);
    assert.equal(routes.length, 23);
});

test('the retired URLs are redirects, not rewrites, so the old address stops being canonical', () => {
    const { routes } = staticWebAppConfig();
    for (const r of routes.filter((x) => x.redirect)) {
        assert.equal(r.statusCode, 301, `${r.route} is not a permanent redirect`);
    }
});

test('/blog/ stays a rewrite to the generated index', () => {
    // Load-bearing: it is the Knowledge Hub crawler's seed URL, and a redirect would change it.
    const blog = staticWebAppConfig().routes.find((r) => normalise(r.route) === '/blog');
    assert.equal(blog.rewrite, '/blog/index.html');
    assert.equal(blog.redirect, undefined);
});

test('every route is rooted, because a relative rule silently never matches', () => {
    for (const { route } of staticWebAppConfig().routes) {
        assert.ok(route.startsWith('/'), `${route} is not rooted`);
    }
});

test('the 404 stays a rewrite that keeps the status honest', () => {
    // No navigationFallback: it would answer every unknown URL with 200 and the 404 page.
    const config = staticWebAppConfig();
    assert.equal(config.responseOverrides[404].statusCode, 404);
    assert.equal(config.navigationFallback, undefined);
});
