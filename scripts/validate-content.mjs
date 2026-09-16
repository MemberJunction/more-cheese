#!/usr/bin/env node
/**
 * validate-content.mjs — mechanical check of generated More Cheese content against the
 * skills' completion checklists and the vault design's fiction-labelling standard.
 *
 *   node scripts/validate-content.mjs                       # everything under content/ and vault/internal/
 *   node scripts/validate-content.mjs --week 2019-01-14     # one blog week (Monday): exactly 3 posts, 3 categories
 *   node scripts/validate-content.mjs content/blog/2019     # specific files or directories
 *   node scripts/validate-content.mjs --json                # machine-readable report
 *
 * Exit code 0 = every file passed (warnings allowed), 1 = at least one FAIL.
 * Plain Node, no dependencies. Run from the repo root.
 *
 * What it checks (blog posts, from .claude/skills/morecheese-weekly-blog/SKILL.md §4–§8):
 *   filename YYYY-MM-DD-<slug>.md under content/blog/YYYY/; slug 3–7 lowercase hyphenated words;
 *   frontmatter fields present and in order; date == filename date; year folder == date year;
 *   category one of six; era matches data/ruleset/eras.json for the year; fictional: true;
 *   author "ICF Communications Team"; 3–5 lowercase tags; excerpt 20–35 words; research_sources
 *   non-empty http(s) URLs; body 500–900 words; no H1; at most two H2; `---` then the verbatim
 *   disclaimer as the last line; banned AI phrases (warn); person-name candidates that are not
 *   heroes listed for human review (info). With --week: exactly 3 posts in Mon–Sun, 3 distinct categories.
 * Other public artifacts (content/annual-reports, press-releases, …): frontmatter, fictional: true, disclaimer last line.
 * Internal artifacts (vault/internal): Markdown must carry the §6.2 header line right after the
 *   frontmatter; CSV must carry the `# notice:` FICTIONAL DEMONSTRATION DATA block.
 */
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const DISCLAIMER =
    '*The International Cheese Federation (ICF) and More Cheese are entirely fictional. This post is demonstration content created for MemberJunction. All people, organizations, events, courses, certifications, figures, and quotations in it are invented, and nothing here represents a real association, a real business, a real person, or real professional advice.*';
const INTERNAL_HEADER =
    '> **FICTIONAL DEMONSTRATION DOCUMENT** — International Cheese Federation (ICF), a fictitious trade association created for the MemberJunction More Cheese demonstration environment. All names, figures, events, and decisions are invented.';
const CSV_NOTICE = 'FICTIONAL DEMONSTRATION DATA';
const BLOG_FIELDS = ['title', 'date', 'slug', 'author', 'category', 'tags', 'excerpt', 'fictional', 'era', 'research_sources'];
const BLOG_OPTIONAL_TRAILING = ['data_sources']; // VAULT-DESIGN §8.2: list generated/ dirs behind any quoted figure
const CATEGORIES = ['Industry News', 'Member Spotlight', 'Education', 'Certification', 'Events', 'Advocacy'];
const AUTHOR = 'ICF Communications Team';
const REAL_ORGS = /\b(USDA|FDA|CDC|EPA|EU Commission|European Commission|Codex Alimentarius|Chicago Mercantile Exchange|CME|Congress|Senate|House of Representatives|Parliament|WTO|OECD|FAO|American Cheese Society|Wisconsin Cheese Makers Association|National Milk Producers Federation|Dairy Farmers of America|Land O'Lakes|Kraft|Tillamook|Cabot|Whole Foods|Walmart|Kroger|Costco|Amazon)\b/g;
const BANNED_PHRASES = ["in today's fast-paced world", 'delve', 'landscape', 'game-changer', 'game changer', "it's important to note", 'tapestry', 'testament to'];

// ---------- inputs from the world model ----------
function loadJson(rel) {
    return JSON.parse(fs.readFileSync(path.join(ROOT, rel), 'utf8'));
}
function eraForYear(year) {
    const raw = loadJson('data/ruleset/eras.json');
    const eras = Array.isArray(raw) ? raw : raw.eras ?? Object.values(raw)[0];
    for (const e of eras) {
        const cycles = e.cycles ?? e.years ?? [];
        if (cycles.includes(year)) return e.eraKey;
    }
    return null;
}
function heroNames() {
    const raw = loadJson('data/ruleset/heroes.json');
    const items = Array.isArray(raw) ? raw : raw.heroes ?? raw.items ?? Object.values(raw)[0];
    const names = new Set();
    for (const h of items) {
        const n = h.name ?? h.Name ?? `${h.fixedFields?.FirstName ?? ''} ${h.fixedFields?.LastName ?? ''}`.trim();
        if (n) names.add(n);
    }
    return names;
}
function heroJoinDates() {
    // hero name -> JoinDate via heroes.json email -> generated/people -> generated/member-profiles
    const out = new Map();
    try {
        const raw = loadJson('data/ruleset/heroes.json');
        const items = Array.isArray(raw) ? raw : raw.heroes ?? raw.items ?? Object.values(raw)[0];
        const emailToName = new Map();
        for (const h of items) {
            const n = `${h.fixedFields?.FirstName ?? ''} ${h.fixedFields?.LastName ?? ''}`.trim();
            const e = (h.businessKeys?.Email ?? '').toLowerCase();
            if (n && e) emailToName.set(e, n);
        }
        const idToName = new Map();
        for (const f of fs.readdirSync(path.join(ROOT, 'generated', 'people'))) {
            if (!f.endsWith('.json') || f === '.mj-sync.json') continue;
            for (const r of JSON.parse(fs.readFileSync(path.join(ROOT, 'generated', 'people', f), 'utf8'))) {
                const e = (r.fields?.Email ?? '').toLowerCase();
                if (emailToName.has(e)) idToName.set((r.primaryKey?.ID ?? '').toLowerCase(), emailToName.get(e));
            }
        }
        for (const f of fs.readdirSync(path.join(ROOT, 'generated', 'member-profiles'))) {
            if (!f.endsWith('.json') || f === '.mj-sync.json') continue;
            for (const r of JSON.parse(fs.readFileSync(path.join(ROOT, 'generated', 'member-profiles', f), 'utf8'))) {
                const n = idToName.get((r.fields?.PersonID ?? '').toLowerCase());
                if (n && r.fields?.JoinDate) out.set(n, String(r.fields.JoinDate).slice(0, 10));
            }
        }
    } catch { /* world model incomplete: skip the check */ }
    return out;
}
function orgNames() {
    try {
        const raw = loadJson('data/banks/organizations.json');
        const out = new Set();
        const walk = (v) => {
            if (typeof v === 'string') out.add(v);
            else if (Array.isArray(v)) v.forEach(walk);
            else if (v && typeof v === 'object') Object.values(v).forEach(walk);
        };
        walk(raw);
        return out;
    } catch {
        return new Set();
    }
}

// ---------- tiny YAML frontmatter reader (scalars, quoted strings, `- item` lists) ----------
function parseFrontmatter(text) {
    if (!text.startsWith('---\n')) return { fields: null, order: [], body: text, error: 'no frontmatter block at top of file' };
    const end = text.indexOf('\n---', 4);
    if (end < 0) return { fields: null, order: [], body: text, error: 'frontmatter not closed' };
    const block = text.slice(4, end);
    const body = text.slice(end + 4).replace(/^\n/, '');
    const fields = {};
    const order = [];
    let current = null;
    for (const line of block.split('\n')) {
        if (!line.trim()) continue;
        const item = line.match(/^\s+-\s+(.*)$/);
        if (item && current) {
            if (!Array.isArray(fields[current])) fields[current] = [];
            fields[current].push(unquote(item[1]));
            continue;
        }
        const kv = line.match(/^([A-Za-z_][A-Za-z0-9_]*):\s*(.*)$/);
        if (!kv) return { fields: null, order, body, error: `unparseable frontmatter line: ${line}` };
        current = kv[1];
        order.push(current);
        fields[current] = kv[2] === '' ? [] : unquote(kv[2]);
    }
    return { fields, order, body, error: null };
}
function unquote(s) {
    const t = s.trim();
    if ((t.startsWith('"') && t.endsWith('"')) || (t.startsWith("'") && t.endsWith("'"))) return t.slice(1, -1);
    if (t === 'true') return true;
    if (t === 'false') return false;
    return t;
}

// ---------- helpers ----------
function words(s) {
    return s.split(/\s+/).filter((w) => /[A-Za-z0-9]/.test(w)).length;
}
function isoDate(s) {
    return typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(Date.parse(s));
}
function weekWindow(monday) {
    const start = new Date(`${monday}T00:00:00Z`);
    if (start.getUTCDay() !== 1) throw new Error(`--week must be a Monday, got ${monday}`);
    const end = new Date(start);
    end.setUTCDate(end.getUTCDate() + 6);
    return { start: start.toISOString().slice(0, 10), end: end.toISOString().slice(0, 10) };
}
function nameCandidates(body, heroes, orgs) {
    // Two or three capitalised words in a row; drop sentence starters and known fictitious names.
    const found = new Set();
    const re = /\b([A-Z][a-z]+(?:['’][A-Z]?[a-z]+)?) ([A-Z][a-z]+(?:['’][A-Z]?[a-z]+)?)(?: ([A-Z][a-z]+))?\b/g;
    const nounish = /\b(Committee|Certificate|Certification|Essentials|Management|Control|Planning|Rooms?|Safety|Packaging|Documentation|Fromagerie|Affinage|Maturation|Airflow|Cave|Advanced|Export|Small|Food|Conference|Workshop|Course|Program|Programme|Award|Awards|Guild|Federation|Association|Council|Board|Team|Report|Survey|Act|Bill|Rule|Agreement|Partnership|Market|Markets|Week|Month|Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday|January|February|March|April|May|June|July|August|September|October|November|December)\b/;
    const stop = new Set(['The', 'If', 'In', 'On', 'At', 'For', 'And', 'But', 'This', 'That', 'Our', 'Your', 'We', 'It', 'Members', 'Committee', 'Federation', 'International', 'Cheese', 'More', 'New', 'A', 'An']);
    let m;
    while ((m = re.exec(body))) {
        const full = m[0].trim();
        if (stop.has(m[1])) continue;
        if (nounish.test(full)) continue;
        if (heroes.has(full) || heroes.has(`${m[1]} ${m[2]}`)) continue;
        let inOrg = false;
        for (const o of orgs) if (o.includes(full) || full.includes(o)) { inOrg = true; break; }
        if (inOrg) continue;
        if (/^(Standards|Food|Education|Membership|Annual|Cheese|Dairy|Farm|Federal|State|Specialty|Artisan|United|European|American|North|South|Pricing|Business)\b/.test(full)) continue;
        found.add(full);
    }
    return [...found];
}

// ---------- per-file checks ----------
function checkBlog(file, text, ctx) {
    const fails = [];
    const warns = [];
    const info = [];
    const rel = path.relative(ROOT, file);
    const base = path.basename(file, '.md');
    const m = base.match(/^(\d{4}-\d{2}-\d{2})-([a-z0-9]+(?:-[a-z0-9]+)*)$/);
    if (!m) fails.push(`filename must be YYYY-MM-DD-<slug>.md (lowercase, hyphenated): ${base}`);
    const fileDate = m?.[1];
    const fileSlug = m?.[2];
    if (fileSlug) {
        const n = fileSlug.split('-').length;
        if (n < 3 || n > 7) fails.push(`slug should be 3–7 words, has ${n}: ${fileSlug}`);
        if (/\d{4}/.test(fileSlug)) warns.push(`slug contains a year-like number: ${fileSlug}`);
    }
    const yearDir = path.basename(path.dirname(file));
    if (fileDate && yearDir !== fileDate.slice(0, 4)) fails.push(`year folder ${yearDir} does not match date ${fileDate}`);

    const fm = parseFrontmatter(text);
    if (fm.error) {
        fails.push(fm.error);
        return { rel, fails, warns, info };
    }
    const f = fm.fields;
    const missing = BLOG_FIELDS.filter((k) => !(k in f));
    if (missing.length) fails.push(`frontmatter missing: ${missing.join(', ')}`);
    const extra = fm.order.filter((k) => !BLOG_FIELDS.includes(k) && !BLOG_OPTIONAL_TRAILING.includes(k));
    if (extra.length) fails.push(`frontmatter has unexpected fields: ${extra.join(', ')}`);
    const required = fm.order.filter((k) => BLOG_FIELDS.includes(k));
    if (!missing.length && !extra.length && required.join(',') !== BLOG_FIELDS.join(','))
        fails.push(`frontmatter fields out of order: ${fm.order.join(', ')}`);
    if (Array.isArray(f.data_sources)) for (const d of f.data_sources) if (!/^generated\/[a-z0-9-]+$/.test(String(d))) fails.push(`data_sources entry must be a generated/<dir> path: ${d}`);
    if (!isoDate(f.date)) fails.push(`date must be plain ISO YYYY-MM-DD, got ${JSON.stringify(f.date)}`);
    else if (fileDate && f.date !== fileDate) fails.push(`date ${f.date} != filename date ${fileDate}`);
    if (fileSlug && f.slug !== fileSlug) fails.push(`slug frontmatter ${JSON.stringify(f.slug)} != filename slug ${fileSlug}`);
    if (f.author !== AUTHOR) fails.push(`author must be "${AUTHOR}", got ${JSON.stringify(f.author)}`);
    if (!CATEGORIES.includes(f.category)) fails.push(`category ${JSON.stringify(f.category)} not one of: ${CATEGORIES.join(' | ')}`);
    if (f.fictional !== true) fails.push(`fictional must be true`);
    if (isoDate(f.date)) {
        const era = eraForYear(Number(f.date.slice(0, 4)));
        if (!era) fails.push(`year ${f.date.slice(0, 4)} is outside the eras in data/ruleset/eras.json`);
        else if (f.era !== era) fails.push(`era ${JSON.stringify(f.era)} should be ${era} for ${f.date.slice(0, 4)}`);
        if (ctx.week && (f.date < ctx.week.start || f.date > ctx.week.end)) fails.push(`date ${f.date} outside week ${ctx.week.start}..${ctx.week.end}`);
    }
    const tags = Array.isArray(f.tags) ? f.tags : [];
    if (tags.length < 3 || tags.length > 5) fails.push(`tags should be 3–5, has ${tags.length}`);
    for (const t of tags) if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(String(t))) fails.push(`tag not lowercase-hyphenated: ${t}`);
    const exWords = typeof f.excerpt === 'string' ? words(f.excerpt) : 0;
    if (exWords < 20 || exWords > 35) warns.push(`excerpt is ${exWords} words (target 20–35)`);
    const srcs = Array.isArray(f.research_sources) ? f.research_sources : [];
    if (srcs.length === 0) fails.push('research_sources is empty');
    for (const s of srcs) if (!/^https?:\/\/\S+$/.test(String(s))) fails.push(`research_sources entry is not a bare URL: ${s}`);

    // body
    const lines = fm.body.replace(/\s+$/, '').split('\n');
    const last = lines[lines.length - 1] ?? '';
    if (last.trim() !== DISCLAIMER) fails.push('last line is not the verbatim disclaimer');
    else {
        const prev = lines.slice(0, -1).map((l) => l.trim()).filter(Boolean).pop() ?? '';
        if (prev !== '---') fails.push('the disclaimer must be preceded by a `---` rule');
    }
    const bodyNoDisc = lines.slice(0, -1).join('\n').replace(/\n---\s*$/, '');
    // US English only (PM feedback 2026-09-15): warn on common British spellings in title, excerpt and body.
    const BRITISH = /\b(organis(e|es|ed|ing|ation|ations)|programmes?|labell(ing|ed)|centres?|colours?|favourites?|favour|licences?|catalogues?|behaviours?|recognis(e|es|ed|ing|ably)|specialis(e|es|ed|ing)|analys(e|es|ed|ing)|cheques?|flavours?|honours?|travell(ing|ed|ers?)|enrol|enrolments?|whilst|amongst|learnt|practise|judgement|ageing|neighbours?|neighbourhood|grey|moulds?|moulded|pasteuris(e|ed)|unpasteurised|standardis(e|ed)|optimis(e|ed)|prioritis(e|ed)|minimis(e|ed)|maximis(e|ed)|realis(e|ed)|utilis(e|ed)|summaris(e|ed)|emphasis(e|ed)|apologis(e|ed)|jewellery|fulfil|fulfilment|instalments?|skilful|defence|offence|metres?|litres?|kilometres?|artefacts?|aluminium|sulphur|savoury|enquir(y|ies)|anonymis(e|ed)|modell(ed|ing)|millimetres?|tonnes?|afterwards|towards|onwards)\b/gi;
    const brit = new Set((`${f.title ?? ''} ${f.excerpt ?? ''} ${bodyNoDisc}`.match(BRITISH) || []).map((w) => w.toLowerCase()));
    if (brit.size) warns.push(`British spelling (use US English): ${[...brit].slice(0, 8).join(', ')}`);
    const wc = words(bodyNoDisc);
    if (wc < 500 || wc > 900) fails.push(`body is ${wc} words (required 500–900)`);
    else info.push(`${wc} words`);
    if (/^#\s/m.test(bodyNoDisc)) fails.push('body contains an H1 (# title) — start with a paragraph');
    const h2 = (bodyNoDisc.match(/^##\s/gm) ?? []).length;
    if (h2 > 2) warns.push(`body has ${h2} H2 subheads (skill §5 says at most two)`);
    if (!/^[A-Za-z*"“]/.test(bodyNoDisc.trim())) warns.push('body does not start with a paragraph');
    const lower = bodyNoDisc.toLowerCase();
    for (const p of BANNED_PHRASES) if (lower.includes(p)) warns.push(`banned phrase: "${p}"`);
    const orgHits = [...new Set((bodyNoDisc.match(REAL_ORGS) ?? []))];
    if (orgHits.length) warns.push(`real organisations/agencies named (skill §2: describe the thing, not the body): ${orgHits.join(', ')}`);
    const nonWiki = srcs.filter((u) => !/wikipedia\.org/i.test(String(u)));
    if (srcs.length && nonWiki.length < 2) warns.push(`research is thin: ${nonWiki.length} non-Wikipedia source(s); the skill wants dated industry sources`);
    const landing = srcs.filter((u) => { try { const x = new URL(String(u)); return x.pathname.replace(/\/+$/, '').split('/').filter(Boolean).length <= 1 && !/wikipedia/.test(x.hostname); } catch { return false; } });
    if (landing.length) warns.push(`sources that are site homepages / section landings, not dated pages: ${landing.join(', ')}`);
    const dated = srcs.filter((u) => /\/20[12]\d\//.test(String(u)) || /20[12]\d[-_]\d{2}/.test(String(u)));
    if (srcs.length && dated.length === 0) warns.push('no source URL carries a date; the skill prefers pages dated in or just before the week');
    if (isoDate(f.date)) {
        const postDay = f.date;
        for (const u of srcs) {
            const m1 = String(u).match(/\/(20[12]\d)\/(\d{2})(?:\/(\d{2}))?\//);
            if (m1) {
                const srcDay = `${m1[1]}-${m1[2]}-${m1[3] ?? '01'}`;
                if (srcDay > postDay) warns.push(`source is dated AFTER the post (${srcDay} > ${postDay}): ${u}`);
                const monthsBefore = (Number(postDay.slice(0, 4)) - Number(m1[1])) * 12 + (Number(postDay.slice(5, 7)) - Number(m1[2]));
                if (monthsBefore > 6) warns.push(`source is ${monthsBefore} months older than the post — is it really this week's research? ${u}`);
            }
            const m2 = String(u).match(/fmicb\.(20[12]\d)\.(\d{5})|\/(20[12]\d)\.(\d{5})\//); // journal article numbers: year must not be after the post
            if (m2) { const y = m2[1] ?? m2[3]; if (y && Number(y) > Number(postDay.slice(0, 4))) warns.push(`journal article from ${y} cited in a ${postDay.slice(0, 4)} post: ${u}`); }
        }
    }
    const voiceHits = (bodyNoDisc.match(/\b(we|we're|our|us|you|your|you're|members have been telling us)\b/gi) ?? []).length;
    if (voiceHits < 4) warns.push(`voice: only ${voiceHits} first/second-person hits — the skill's voice is "we / the federation" and "your make sheet", not a textbook`);
    if (ctx.sourceLists) {
        const key = [...srcs].map(String).sort().join('|');
        const twin = ctx.sourceLists.get(key);
        if (twin && twin !== rel) warns.push(`research_sources identical to ${twin} — sources must be researched per post, not copied`);
        else if (key) ctx.sourceLists.set(key, rel);
    }
    if (isoDate(f.date) && ctx.heroJoin) {
        for (const [hero, joined] of ctx.heroJoin) {
            if (bodyNoDisc.includes(hero) && joined > f.date) fails.push(`hero ${hero} appears in a post dated ${f.date} but joined ${joined} (member-profiles JoinDate)`);
        }
    }
    if (f.category === 'Member Spotlight' && ctx.spotlights) {
        for (const [h, files] of ctx.spotlights) if (files.includes(rel) && files.length > 1)
            fails.push(`${h} is spotlighted in ${files.length} posts (one spotlight per hero): ${files.filter((x) => x !== rel).join(', ')}`);
    }
    if (ctx.urlUse) for (const u of srcs) { const users = ctx.urlUse.get(String(u)); if (users && users.size >= 3) warns.push(`source reused across ${users.size} posts — research is going stale: ${u}`); }
    const names = nameCandidates(bodyNoDisc, ctx.heroes, ctx.orgs);
    if (names.length) info.push(`names to review (not heroes, not in the org bank): ${names.join('; ')}`);
    else info.push('no non-hero person names detected');
    return { rel, fails, warns, info, category: f.category, date: f.date };
}

function checkPublicOther(file, text) {
    const rel = path.relative(ROOT, file);
    const fails = [];
    const fm = parseFrontmatter(text);
    if (fm.error) fails.push(fm.error);
    else if (fm.fields.fictional !== true) fails.push('fictional must be true');
    const lines = text.replace(/\s+$/, '').split('\n');
    if ((lines[lines.length - 1] ?? '').trim() !== DISCLAIMER) fails.push('last line is not the verbatim disclaimer');
    return { rel, fails, warns: [], info: [] };
}

function checkInternal(file, text) {
    const rel = path.relative(ROOT, file);
    const fails = [];
    if (file.endsWith('.csv')) {
        const head = text.split('\n').slice(0, 30).join('\n');
        if (!/^#\s*notice:/m.test(head) || !head.includes(CSV_NOTICE)) fails.push('CSV lacks the `# notice:` FICTIONAL DEMONSTRATION DATA block');
        if (!/^#\s*fictional:\s*true/m.test(head)) fails.push('CSV comment block lacks `# fictional: true`');
        return { rel, fails, warns: [], info: [] };
    }
    if (path.basename(file).toLowerCase() === 'readme.md') return { rel, fails, warns: [], info: ['README, skipped'] };
    const fm = parseFrontmatter(text);
    if (fm.error) fails.push(fm.error);
    else {
        if (fm.fields.fictional !== true) fails.push('fictional must be true');
        if (fm.fields.visibility && fm.fields.visibility !== 'internal') fails.push(`visibility should be internal, got ${fm.fields.visibility}`);
        const bodyLines = fm.body.split('\n');
        const firstIdx = bodyLines.findIndex((l) => l.trim().length > 0);
        const isEmail = /\/email\//.test(file);
        const within = isEmail ? bodyLines.slice(0, 40) : [bodyLines[firstIdx] ?? ''];
        if (!within.some((l) => l.trim() === INTERNAL_HEADER)) fails.push(isEmail ? 'email lacks the §6.2 header line after the header block' : 'first body line is not the §6.2 FICTIONAL DEMONSTRATION DOCUMENT header');
    }
    return { rel, fails, warns: [], info: [] };
}

// ---------- discovery ----------
function walk(dir, out = []) {
    if (!fs.existsSync(dir)) return out;
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
        const p = path.join(dir, e.name);
        if (e.isDirectory()) walk(p, out);
        else if (/\.(md|csv)$/i.test(e.name)) out.push(p);
    }
    return out;
}

const args = process.argv.slice(2);
const json = args.includes('--json');
const weekIdx = args.indexOf('--week');
const week = weekIdx >= 0 ? weekWindow(args[weekIdx + 1]) : null;
const targets = args.filter((a, i) => !a.startsWith('--') && !(weekIdx >= 0 && i === weekIdx + 1));
let files = [];
if (week) files = walk(path.join(ROOT, 'content', 'blog'));
else if (targets.length) for (const t of targets) { const p = path.resolve(ROOT, t); files.push(...(fs.statSync(p).isDirectory() ? walk(p) : [p])); }
else files = [...walk(path.join(ROOT, 'content')), ...walk(path.join(ROOT, 'vault', 'internal'))];

const ctx = { week, heroes: heroNames(), orgs: orgNames(), sourceLists: new Map(), heroJoin: heroJoinDates(), spotlights: new Map(), urlUse: new Map() };
// corpus-level facts from every blog post (not just the ones being validated)
for (const f of walk(path.join(ROOT, 'content', 'blog'))) {
    const text = fs.readFileSync(f, 'utf8');
    const fm = parseFrontmatter(text);
    if (!fm.fields) continue;
    const rel = path.relative(ROOT, f);
    if (fm.fields.category === 'Member Spotlight') {
        for (const h of ctx.heroes) if (fm.body.includes(h) || String(fm.fields.title ?? '').includes(h)) {
            if (!ctx.spotlights.has(h)) ctx.spotlights.set(h, []);
            ctx.spotlights.get(h).push(rel);
        }
    }
    for (const u of (Array.isArray(fm.fields.research_sources) ? fm.fields.research_sources : [])) {
        const k = String(u); if (!ctx.urlUse.has(k)) ctx.urlUse.set(k, new Set()); ctx.urlUse.get(k).add(rel);
    }
}
// pre-seed source lists from every blog post so a copied list is caught even when validating one week
for (const f of walk(path.join(ROOT, 'content', 'blog'))) {
    const fm = parseFrontmatter(fs.readFileSync(f, 'utf8'));
    const srcs = Array.isArray(fm.fields?.research_sources) ? fm.fields.research_sources : [];
    const key = [...srcs].map(String).sort().join('|');
    if (key && !ctx.sourceLists.has(key)) ctx.sourceLists.set(key, path.relative(ROOT, f));
}
const results = [];
for (const file of files) {
    const rel = path.relative(ROOT, file);
    if (rel.endsWith('VAULT-DESIGN.md')) continue;
    const text = fs.readFileSync(file, 'utf8');
    let r;
    if (rel.startsWith(path.join('content', 'blog'))) {
        if (week) {
            const d = path.basename(file).slice(0, 10);
            if (d < week.start || d > week.end) continue;
        }
        r = checkBlog(file, text, ctx);
    } else if (rel.startsWith('content')) r = checkPublicOther(file, text);
    else r = checkInternal(file, text);
    results.push(r);
}

const weekFails = [];
if (week) {
    const posts = results.filter((r) => r.category !== undefined || r.rel.includes('/blog/'));
    if (posts.length !== 3) weekFails.push(`week ${week.start}..${week.end} has ${posts.length} posts (need exactly 3)`);
    const cats = new Set(posts.map((p) => p.category));
    if (posts.length === 3 && cats.size !== 3) weekFails.push(`categories not all different: ${posts.map((p) => p.category).join(', ')}`);
}

const failed = results.filter((r) => r.fails.length).length + (weekFails.length ? 1 : 0);
if (json) {
    console.log(JSON.stringify({ week, files: results, weekFails, ok: failed === 0 }, null, 2));
} else {
    for (const r of results) {
        const status = r.fails.length ? 'FAIL' : r.warns.length ? 'PASS (warnings)' : 'PASS';
        console.log(`${status}  ${r.rel}`);
        for (const x of r.fails) console.log(`    ✖ ${x}`);
        for (const x of r.warns) console.log(`    ⚠ ${x}`);
        for (const x of r.info) console.log(`    · ${x}`);
    }
    for (const x of weekFails) console.log(`FAIL  week: ${x}`);
    console.log(`\n${results.length} file(s) checked, ${failed} failing${week ? `, week ${week.start}..${week.end}` : ''}.`);
}
process.exit(failed ? 1 : 0);
