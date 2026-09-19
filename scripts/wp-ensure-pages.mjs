#!/usr/bin/env node
/**
 * wp-ensure-pages.mjs — make sure every page the Terroir theme templates expect exists in WordPress, by slug.
 * Idempotent: existing slugs are left alone (status untouched), missing ones are created.
 *
 *   node scripts/wp-ensure-pages.mjs --dry-run            # show what would be created
 *   node scripts/wp-ensure-pages.mjs --status draft       # create missing pages as drafts (default)
 *   node scripts/wp-ensure-pages.mjs --status publish     # create (or publish existing drafts) — cutover step
 *
 * Credentials from WP_BASE_URL, WP_USERNAME, WP_APP_PASSWORD (set -a; source ~/Projects/more-cheese-work/.env.content; set +a).
 * Page body is a one-line pointer; the theme's page-<slug>.php template supplies the real content.
 */
const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const status = args.includes('--status') ? args[args.indexOf('--status') + 1] : 'draft';
const { WP_BASE_URL, WP_USERNAME, WP_APP_PASSWORD } = process.env;
if (!(WP_BASE_URL && WP_USERNAME && WP_APP_PASSWORD)) { console.error('Missing WP_* env'); process.exit(2); }
const base = WP_BASE_URL.replace(/\/+$/, '');
const auth = 'Basic ' + Buffer.from(`${WP_USERNAME}:${WP_APP_PASSWORD}`).toString('base64');
async function wp(method, route, body) {
    const res = await fetch(`${base}/wp-json/wp/v2${route}`, { method, headers: { Authorization: auth, 'Content-Type': 'application/json' }, body: body ? JSON.stringify(body) : undefined });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(`${method} ${route} → ${res.status}: ${json.message ?? ''}`);
    return json;
}
// slug → [title, parentSlug]
const PAGES = {
    join: ['Join', null], learn: ['Learn', null], library: ['Cheese Library', null], compete: ['Compete', null], events: ['Events', null],
    advocacy: ['Advocacy', null], about: ['About the ICF', null], faq: ['FAQ', null], research: ['Research', null], careers: ['Careers', null], contact: ['Contact', null],
    'membership-dues': ['Membership & Dues', 'faq'], 'membership-benefits': ['Membership Benefits & Services', 'faq'], 'renewals-account': ['Renewals & Account Management', 'faq'],
    certifications: ['Certifications', 'faq'], 'conferences-events': ['Conferences & Events', 'faq'], 'publications-resources': ['Publications & Resources', 'faq'],
    'career-governance': ['Career Services, Networking & Governance', 'faq'], 'organization-directory': ['Organization & Staff Directory', 'faq'],
};
const BODY = '<!-- Content for this page is supplied by the Terroir theme template (website/wp-theme/terroir/page-<slug>.php). -->';
const existing = await wp('GET', '/pages?per_page=100&status=any&_fields=id,slug,status,parent');
const bySlug = Object.fromEntries(existing.map((p) => [p.slug, p]));
let created = 0, published = 0;
for (const [slug, [title, parentSlug]] of Object.entries(PAGES)) {
    const have = bySlug[slug];
    if (have) {
        if (status === 'publish' && have.status !== 'publish') {
            console.log(`${dryRun ? 'DRY ' : ''}PUBLISH ${slug} (id ${have.id}, was ${have.status})`);
            if (!dryRun) await wp('POST', `/pages/${have.id}`, { status: 'publish' });
            published++;
        } else console.log(`ok      ${slug} (id ${have.id}, ${have.status})`);
        continue;
    }
    const parent = parentSlug ? bySlug[parentSlug]?.id : 0;
    if (parentSlug && !parent) throw new Error(`parent ${parentSlug} missing for ${slug}`);
    console.log(`${dryRun ? 'DRY ' : ''}CREATE  ${slug} "${title}" parent=${parent ?? 0} status=${status}`);
    if (!dryRun) { const p = await wp('POST', '/pages', { title, slug, status, parent: parent ?? 0, content: BODY.replace('<slug>', slug) }); bySlug[slug] = p; }
    created++;
}
console.log(`\n${created} to create, ${published} to publish → ${base}${dryRun ? ' (dry run)' : ''}`);
