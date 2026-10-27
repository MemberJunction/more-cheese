#!/usr/bin/env node
/**
 * content-backfill-internal-gemini.mjs — backfill the internal staff corpus (vault/internal/) with Gemini,
 * one week per model call, every bundle gated by validate-content.mjs plus the checks below.
 *
 *   node scripts/content-backfill-internal-gemini.mjs <Monday> [<Monday> ...]
 *   node scripts/content-backfill-internal-gemini.mjs --par 4 --logdir ~/runs 2020-03-16 2021-04-12
 *   node scripts/content-backfill-internal-gemini.mjs --dry-run 2023-07-24      # print the prompt, call nothing
 *
 * Why this exists. The first internal pilot (#125) ran the morecheese-internal-comms skill through headless
 * Claude Code (content-backfill-internal.sh): ~$0.51 a week, ~$200 for the 2019–2026 backfill. Amith's review
 * of #125: don't use the Anthropic API for this workload, use Gemini 3.5 Flash Lite. A small model cannot run
 * the skill as an agent (call vault-facts, read the blog, validate, fix), so this script does the agent's
 * legwork deterministically and asks the model only to write:
 *
 *   1. CONTEXT  — vault-facts week + year JSON, the week's blog posts, titles filed in the four weeks before,
 *                 the era, the course list, VAULT-DESIGN.md and the skill, and one finished pilot bundle as a
 *                 format exemplar — all in one prompt. The model has no tools.
 *   2. WRITE    — the model returns the bundle as JSON {files:[{path, content}]}; paths are checked before
 *                 anything touches disk (vault/internal/<type>/<year>/, dated inside the week, no overwrite).
 *   3. CHECK    — validate-content.mjs --internal-week (fails AND warnings), plus what the skill's §10 checklist
 *                 asked Claude to verify by hand: lengths, banned phrases, British spellings, and every figure
 *                 traceable to the facts (a fact value, a value from the week's blog, or a sum, difference or
 *                 percentage of two fact values).
 *   4. RETRY    — on any problem the files are removed and the problems are sent back as the next turn of the
 *                 same conversation; after --attempts tries the last draft is moved to <logdir>/rejected/ so
 *                 vault/internal/ only ever holds bundles that passed.
 *
 * Weeks are split into --par contiguous lanes run side by side; inside a lane weeks run in date order so each
 * one sees the titles its predecessors filed (only a lane's first week misses its neighbours').
 *
 * Key: GEMINI_API_KEY, else AI_VENDOR_API_KEY__GeminiLLM (MJ's vendor-key name), from the environment or from
 * the .env file named by GEMINI_ENV_FILE (e.g. GEMINI_ENV_FILE=~/Projects/MJ/.env). The key is never logged.
 * Cost is estimated from usageMetadata at --price-in / --price-out USD per million tokens.
 * Never runs git, never writes outside vault/internal/ and the log directory.
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';

const ROOT = process.cwd();
const TYPES = new Set(['memos', 'policies', 'spreadsheets', 'decks', 'board-packets', 'email']);
const MONTHS = 'January|February|March|April|May|June|July|August|September|October|November|December|Jan|Feb|Mar|Apr|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec';
const BANNED = ['delve', 'landscape', 'game-changer', 'game changer', "in today's fast-paced", 'leverag', 'tapestry', 'testament to', 'we are thrilled', 'navigate the'];
const BRITISH = ['organisation', 'organise', 'programme', 'labelling', 'labelled', 'colour', 'centre', 'ageing', 'favour', 'behaviour', 'analyse\\b', 'analysed', 'analysing', 'catalogue', 'licence', 'defence', 'cheque', 'judgement'];
const FICTION_LINE = '> **FICTIONAL DEMONSTRATION DOCUMENT** — International Cheese Federation (ICF), a fictitious trade association created for the MemberJunction More Cheese demonstration environment. All names, figures, events, and decisions are invented.';

// ── dates ──
export function weekWindow(monday) {
    const d = new Date(`${monday}T00:00:00Z`);
    if (Number.isNaN(d.getTime()) || d.getUTCDay() !== 1) throw new Error(`${monday} is not a Monday`);
    const end = new Date(d.getTime() + 6 * 86400000).toISOString().slice(0, 10);
    return { start: monday, end };
}
const shiftDays = (iso, n) => new Date(Date.parse(`${iso}T00:00:00Z`) + n * 86400000).toISOString().slice(0, 10);

// ── RULE 1 — a returned path must land inside this week's slice of vault/internal/ ──
export function checkPath(rel, win) {
    const norm = path.posix.normalize(String(rel).replace(/\\/g, '/'));
    const parts = norm.split('/');
    if (norm !== rel || parts[0] !== 'vault' || parts[1] !== 'internal' || norm.includes('..')) return `${rel}: must be a plain path under vault/internal/`;
    if (!TYPES.has(parts[2])) return `${rel}: type folder must be one of ${[...TYPES].join(', ')}`;
    const date = (path.posix.basename(norm).match(/\d{4}-\d{2}-\d{2}/) ?? [])[0];
    if (!date) return `${rel}: filename carries no YYYY-MM-DD date`;
    if (date < win.start || date > win.end) return `${rel}: dated ${date}, outside the week ${win.start}..${win.end}`;
    if (parts[3] !== date.slice(0, 4)) return `${rel}: year folder ${parts[3]} does not match ${date.slice(0, 4)}`;
    if (parts[2] === 'email') {
        if (parts.length !== 6 || !/^\d{4}-\d{2}-\d{2}-thread-[a-z0-9-]+$/.test(parts[4]) || !/^\d{2}-.*\.md$/.test(parts[5])) return `${rel}: email must be vault/internal/email/YYYY/YYYY-MM-DD-thread-<slug>/NN-….md, with <slug> in lowercase letters, digits and hyphens only`;
    } else if (parts.length !== 5) return `${rel}: expected vault/internal/${parts[2]}/YYYY/<file>`;
    // 2026-10-27 run: a memo came back as `2024-05-30-milk-heat-stress- <Tamil script>-cost-model-review.md`.
    const file = parts[parts.length - 1];
    if (!/^(\d{2}-)?\d{4}-\d{2}-\d{2}-[a-z0-9]+(-[a-z0-9]+)*\.(md|csv)$/.test(file)) return `${rel}: filename must be YYYY-MM-DD-<slug> with the slug in lowercase ASCII letters, digits and single hyphens — no dots, spaces or capitals (write membership-ops, not membership.ops)`;
    const want = parts[2] === 'spreadsheets' ? '.csv' : '.md';
    if (!norm.endsWith(want)) return `${rel}: ${parts[2]} files end in ${want}`;
    return null;
}

// ── RULE 2 — every figure must be traceable to the facts ──
// Collect every number in the facts JSON and the week's blog text, then close the set under the operations a
// staffer would do by hand: a + b, a − b, and a / b as a percentage (0–2 decimals).
export function allowedFigures(factsList, texts = []) {
    const base = new Set();
    const walk = (v) => {
        if (typeof v === 'number') base.add(v);
        else if (typeof v === 'string') for (const n of numbersIn(v, { all: true })) base.add(n);
        else if (v && typeof v === 'object') for (const x of Object.values(v)) walk(x);
    };
    factsList.forEach(walk);
    for (const t of texts) for (const n of numbersIn(t, { all: true })) base.add(n);
    const vals = [...base].filter((n) => Math.abs(n) < 1e9);
    const out = new Set(vals.map(canon));
    for (const a of vals) for (const b of vals) {
        out.add(canon(a + b)); out.add(canon(Math.abs(a - b)));
        if (b) for (const dp of [0, 1, 2]) out.add(canon(Number(((a / b) * 100).toFixed(dp))));
    }
    return out;
}
const canon = (n) => String(Math.round(n * 100) / 100);

// Numbers a reader would take as figures. Strips what is not a figure first: ISO dates and times, day-month
// dates, event and order keys, years, and (in prose) counts of 12 or less — "two courses", "12 months".
export function numbersIn(text, { all = false } = {}) {
    let t = String(text)
        .replace(/\b\d{4}-\d{2}-\d{2}(T[\d:.]+Z?)?\b/g, ' ')
        .replace(/\b(EVT|ORD|CRS|mc)-[\w-]+/g, ' ')
        .replace(/\b\d{1,2}:\d{2}\b/g, ' ')
        .replace(new RegExp(`\\b\\d{1,2}(st|nd|rd|th)?\\s+(${MONTHS})\\b`, 'g'), ' ')
        .replace(new RegExp(`\\b(${MONTHS})\\.?\\s+\\d{1,2}(st|nd|rd|th)?\\b`, 'g'), ' ');
    const out = [];
    for (const m of t.matchAll(/(?<![\w.])-?\$?(\d{1,3}(?:,\d{3})+|\d+)(\.\d+)?(?![\w])/g)) {
        const n = Number((m[1] + (m[2] ?? '')).replace(/,/g, ''));
        if (!all && ((n >= 1990 && n <= 2030 && !m[2] && !m[1].includes(',')) || n <= 12)) continue;
        out.push(n);
    }
    return out;
}

// The figures in one artifact: prose numbers from a Markdown body, every numeric cell of a CSV's data rows.
export function figuresOf(rel, content) {
    if (rel.endsWith('.csv')) {
        const rows = content.split('\n').filter((l) => l.trim() && !l.startsWith('#')).slice(1);
        return rows.flatMap((r) => r.split(',').map((c) => c.trim()).filter((c) => /^-?\d+(\.\d+)?$/.test(c)).map(Number))
            .filter((n) => !(n >= 1990 && n <= 2030 && Number.isInteger(n)));
    }
    return numbersIn(stripFrontmatter(content));
}

export function untraced(files, allowed) {
    const out = [];
    for (const f of files) {
        const bad = [...new Set(figuresOf(f.path, f.content).map(canon))].filter((n) => !allowed.has(n));
        if (bad.length) out.push(`${f.path}: figures not in the facts: ${bad.join(', ')}. Use only numbers from FACTS (or their sums, differences, percentages) and the week's blog; otherwise write the point without a number.`);
    }
    return out;
}

// ── RULE 3 — nothing is known before it happens ──
// The week's facts include final attendance for an event held mid-week. A document dated before the event
// cannot know it: the first Gemini draft of 2023-07-24 had a Monday deck quoting Tuesday's conference
// attendance as "final".
export function timeLeaks(files, eventsThisWeek = []) {
    const out = [];
    for (const ev of eventsThisWeek) {
        const counts = Object.values(ev.attendance ?? {}).filter((n) => n > 12).map(canon);
        if (!counts.length) continue;
        for (const f of files) {
            const d = (path.posix.basename(f.path).match(/\d{4}-\d{2}-\d{2}/) ?? [''])[0];
            const hit = figuresOf(f.path, f.content).map(canon).filter((n) => counts.includes(n));
            if (d && d < ev.date && hit.length) out.push(`${f.path}: dated ${d}, before ${ev.name} on ${ev.date}, but quotes its attendance (${[...new Set(hit)].join(', ')}). Attendance and no-shows are only known on or after the event date; date the artifact later or use registrations only.`);
        }
    }
    return out;
}

// ── RULE 4 — the shape rules the skill's §10 checklist asked for, made mechanical ──
const stripFrontmatter = (s) => s.replace(/^---\n[\s\S]*?\n---\n/, '');
const wordCount = (s) => (s.match(/[A-Za-z0-9'’$%.,-]+/g) ?? []).length;
function proseBody(content) {
    return stripFrontmatter(content).split('\n')
        .filter((l) => l.trim() !== FICTION_LINE && !/^\*\*(To|From|Cc|Date|Sent|Subject):\*\*/.test(l)).join('\n');
}
export function shapeProblems(files, ignoreNames = []) {
    const out = [];
    const tol = (n, lo, hi) => n >= lo * 0.9 && n <= hi * 1.1;
    for (const f of files) {
        const kind = f.path.split('/')[2];
        if (kind === 'memos' || kind === 'policies') {
            const w = wordCount(proseBody(f.content));
            if (!tol(w, 400, 700)) out.push(`${f.path}: memo body is ${w} words; it must be 400–700`);
        } else if (kind === 'email') {
            const w = wordCount(proseBody(f.content));
            if (!tol(w, 60, 200)) out.push(`${f.path}: email body is ${w} words; it must be 60–200`);
        } else if (kind === 'decks' || kind === 'board-packets') {
            const slides = stripFrontmatter(f.content).split(/\n---[ \t]*\n/).filter((s) => /^##\s/m.test(s));
            if (slides.length < 6 || slides.length > 12) out.push(`${f.path}: ${slides.length} slides; a deck has 6–12`);
            slides.forEach((s, i) => {
                const b = s.split('\n').filter((l) => /^-\s/.test(l)).length;
                if (b > 5) out.push(`${f.path}: slide ${i + 1} has ${b} bullets (5 at most)`);
            });
        } else if (kind === 'spreadsheets') {
            const rows = f.content.split('\n').filter((l) => l.trim() && !l.startsWith('#')).length - 1;
            if (rows < 5 || rows > 25) out.push(`${f.path}: ${rows} data rows; a CSV has 5–25`);
        }
        // 2026-10-27 run: a Korean fragment in an email header ("Advocacy &성과"); Latin with accents (Querétaro) is fine.
        const stray = f.content.match(/[\u0370-\u1FFF\u3000-\uFFEF]+/);
        if (stray) out.push(`${f.path}: stray non-Latin text "${stray[0]}"; write in English only`);
        let text = f.content.toLowerCase();
        for (const n of ignoreNames) text = text.split(n.toLowerCase()).join(' ');
        for (const p of BANNED) if (text.includes(p)) out.push(`${f.path}: banned phrase "${p}"`);
        for (const w of BRITISH) if (new RegExp(`\\b${w}`, 'i').test(text)) out.push(`${f.path}: British spelling "${w.replace(/\\b$/, '')}" — use US spelling`);
    }
    return out;
}

// ── RULE 5 — the email thread is about this week's assigned topic, not the blog ──
// The first full run (2026-10-27) required a blog cross-reference and left the topic open, and 228 of 388
// thread subjects came back as "<x> and blog alignment" — staff discussing the blog every week. Each week
// now gets a thread topic by rotation (consecutive weeks get different topics; one in fourteen is the
// blog), and a thread on any other topic may not be about the blog.
export const THREAD_TOPICS = [
    'a member renewal problem: a lapse, a grace-window request, a failed payment or a tier change, routed between Membership Operations and another team',
    "logistics for an upcoming event from FACTS (venue, room block, catering, speakers, AV, materials) — pick the nearest one in eventsNextEightWeeks or the year's events",
    'committee business: scheduling a meeting, chasing minutes or action items, or a vacancy on one of the six committees',
    'a course cohort from COURSES starting soon: instructor scheduling, materials, enrollment pacing or a waitlist',
    'certification administration: an exam sitting, a prerequisite question, a credential record that needs correcting, or a renewal',
    'a data-quality problem in the member records: a duplicate pair, a stale employer, a bounced address, or a status that does not match payments',
    'finance: a refund request, a month-end reconciliation of orders against cash, or an invoice a member disputes',
    'advocacy work: a comment letter, a member action alert and its response, or a meeting with a regulator',
    'a press or media inquiry and how Media Relations and Communications answer it',
    'a member complaint or question that bounces between two teams before someone owns it',
    'the competition: entry deadlines, shipping and judging logistics, scoresheets, or results',
    'preparing the quarterly numbers or an agenda item for the Office of the Chief Executive',
    'staff capacity: who covers what during a busy stretch, a deadline that has to move, or work that gets dropped',
    "coordinating a public post: what this week's blog can and cannot say, and which numbers it may use",
];
export const BLOG_TOPIC = THREAD_TOPICS.length - 1;
export function threadTopicIndex(monday) {
    return Math.floor(Date.parse(`${monday}T00:00:00Z`) / (7 * 86400000)) % THREAD_TOPICS.length;
}
// Run 2 (2026-10-27) gave "Competition entry deadlines and shipping logistics" to 14 different weeks: the
// topic recurs every fourteen weeks and the four-week title list cannot see that far back. Every thread
// subject already filed is passed in, and an exact repeat is rejected.
export function topicProblems(files, topicIndex, usedSubjects = new Set()) {
    const subjectOf = (f) => ((f.content.match(/^subject:\s*"?(.*?)"?\s*$/m) ?? [])[1] ?? '').trim();
    const firsts = files.filter((f) => f.path.includes('/email/') && /\/01-[^/]+$/.test(f.path));
    const repeats = firsts.filter((f) => usedSubjects.has(subjectOf(f).toLowerCase()))
        .map((f) => `${f.path}: the thread subject "${subjectOf(f)}" was already used by another week; write a subject specific to this week (name the event, course, committee, member case or figure involved)`);
    if (topicIndex === BLOG_TOPIC) return repeats;
    return [...repeats, ...firsts.filter((f) => /\bblog\b/i.test((f.content.match(/^subject:\s*(.*)$/m) ?? [])[1] ?? ''))
        .map((f) => `${f.path}: the thread subject mentions the blog, but this week's thread topic is ${THREAD_TOPICS[topicIndex]}. Write the thread about that topic; the blog may come up at most in passing.`)];
}
export function usedThreadSubjects(root, win) {
    return new Set(walkFiles(path.join(root, 'vault', 'internal', 'email'))
        .filter((f) => /\/01-[^/]+$/.test(f) && !(fileDate(path.dirname(f)) >= win.start && fileDate(path.dirname(f)) <= win.end))
        .map((f) => ((fs.readFileSync(f, 'utf8').match(/^subject:\s*"?(.*?)"?\s*$/m) ?? [])[1] ?? '').trim().toLowerCase()).filter(Boolean));
}

// Contiguous lanes: --par lanes, each a run of consecutive weeks processed in order.
export function lanes(weeks, par) {
    const sorted = [...weeks].sort();
    const n = Math.max(1, Math.min(par, sorted.length));
    const size = Math.ceil(sorted.length / n);
    return Array.from({ length: n }, (_, i) => sorted.slice(i * size, (i + 1) * size)).filter((l) => l.length);
}

// ── context ──
function walkFiles(dir, out = []) {
    if (!fs.existsSync(dir)) return out;
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
        const p = path.join(dir, e.name);
        if (e.isDirectory()) walkFiles(p, out);
        else if (/\.(md|csv)$/.test(e.name) && e.name.toLowerCase() !== 'readme.md') out.push(p);
    }
    return out;
}
const fileDate = (f) => (path.basename(f).match(/\d{4}-\d{2}-\d{2}/) ?? [''])[0];
function facts(...args) {
    const r = spawnSync(process.execPath, ['scripts/vault-facts.mjs', ...args, '--json'], { cwd: ROOT, encoding: 'utf8', maxBuffer: 64 << 20 });
    if (r.status !== 0) throw new Error(`vault-facts ${args.join(' ')} failed: ${r.stderr}`);
    return JSON.parse(r.stdout);
}
function titleOf(f) {
    const t = fs.readFileSync(f, 'utf8');
    return (t.match(/^#?\s*title:\s*"?(.*?)"?\s*$/m) ?? [])[1] ?? path.basename(f);
}
const PILOT_WEEKS = ['2023-07-24', '2025-11-03', '2021-04-12'];
// EXEMPLAR_ROOT points at another checkout when a comparison run has removed the pilot bundles from this one.
function exemplar(win) {
    const root = process.env.EXEMPLAR_ROOT ? path.resolve(process.env.EXEMPLAR_ROOT) : ROOT;
    const wk = PILOT_WEEKS.find((w) => w !== win.start);
    const end = weekWindow(wk).end;
    return walkFiles(path.join(root, 'vault', 'internal')).filter((f) => fileDate(f) >= wk && fileDate(f) <= end).sort()
        .map((f) => `### FILE ${path.relative(root, f)}\n${fs.readFileSync(f, 'utf8')}`).join('\n\n');
}

export function buildContext(monday) {
    const win = weekWindow(monday);
    const year = Number(monday.slice(0, 4));
    const week = facts('week', monday);
    if (year < 2019 || win.end > week.dataEnds) return { win, skip: `outside 2019..dataEnds (${week.dataEnds})` };
    const yearFacts = facts('year', String(year));
    const blogFiles = [...new Set([monday.slice(0, 4), win.end.slice(0, 4)])]
        .flatMap((y) => walkFiles(path.join(ROOT, 'content', 'blog', y)))
        .filter((f) => fileDate(f) >= win.start && fileDate(f) <= win.end).sort();
    const blog = blogFiles.map((f) => ({ path: path.relative(ROOT, f), text: fs.readFileSync(f, 'utf8') }));
    const recent = walkFiles(path.join(ROOT, 'vault', 'internal'))
        .filter((f) => fileDate(f) >= shiftDays(monday, -28) && fileDate(f) < monday)
        .map((f) => `${fileDate(f)}  ${path.relative(ROOT, f).split('/')[2]}  ${titleOf(f)}`).sort();
    const erasRaw = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/ruleset/eras.json'), 'utf8'));
    const era = (erasRaw.eras ?? erasRaw).find((e) => (e.cycles ?? []).includes(year));
    const courseRows = JSON.parse(fs.readFileSync(path.join(ROOT, 'generated/courses/.courses.json'), 'utf8'));
    const courses = courseRows.map((c) => `${c.fields.StartDate}  ${c.fields.Name}`).sort();
    const calendar = JSON.parse(fs.readFileSync(path.join(ROOT, 'content/event-calendar.json'), 'utf8')).events;
    // Official names keep their spelling ("Webinar: Allergen Labelling 2023", "Labelling Law and Compliance").
    const eventNames = [...calendar.map((e) => e.Name), ...new Set(courseRows.map((c) => c.fields.Name.replace(/\s*\([^)]*cohort\)$/, '')))].flatMap((n) => [n, n.replace(/&/g, 'and')]);
    const allowed = allowedFigures([week, yearFacts], blog.map((b) => b.text));
    return { win, year, week, yearFacts, blog, recent, era, courses, eventNames, allowed };
}

const SYSTEM = `You write the INTERNAL staff record of the International Cheese Federation (ICF), a fictitious trade association in the More Cheese demonstration environment for MemberJunction. You produce one week's bundle of internal documents. You have no tools: every fact you may use is in the prompt. Follow the design document and the skill exactly where they govern format, metadata, cast and the do-not list. Where the skill tells you to run a command (vault-facts, validate-content) or run a checklist, the harness has already done it for you: the FACTS sections ARE the output of those commands, and the harness validates your files after you return them.

Return JSON only: {"files":[{"path":"vault/internal/...","content":"..."}]}. Each content is the complete file text.`;

export function buildPrompt(ctx) {
    const { win, week, yearFacts, blog, recent, era, courses } = ctx;
    const yr = win.start.slice(0, 4);
    return [
        `# Task\nWrite the ICF internal bundle for the week of Monday ${win.start} (Monday ${win.start} to Sunday ${win.end}).`,
        `Bundle: exactly one memo (or policy), one CSV spreadsheet, one deck (or board packet), and one email thread of 3–5 messages — four artifacts, five at most. Every file is dated inside the week; its year folder is ${yr}; every file's week_of is ${win.start}; every file's era is ${era?.eraKey}.`,
        `Hard rules:
- US English spelling everywhere (organization, program, labeling, color, center, aging, catalog, favor, analyze). Event and course names keep their official spelling.
- Every number you state must come from FACTS below (or be a sum, difference or percentage of two FACTS values) or from this week's blog. Never invent a figure, not even a preliminary one; if you lack a number, make the point without one. Free webinars have no registrations — never quote attendance for one.
- Senders and recipients are roles and role mailboxes only: comms@, membership.ops@, events@, education@, advocacy@, exec@, press@ — all @morecheese.example. The named staff roster (VAULT-DESIGN §5.2) is NOT approved: never give a staffer a name, not even a first name in a sign-off.
- Never invent an event, course, certification, committee, competition category, product or organization. Events come from FACTS (eventsThisWeek, eventsNextEightWeeks, the year's events); courses from COURSES.
- Time: every artifact knows only what had happened by its own date. FACTS week totals are complete on Sunday ${win.end}: quote them as week totals only in artifacts dated Friday–Sunday, or call them "so far" / preliminary. An event's attendance and no-shows are known only on or after its date; before it, quote registrations only.
- Texture: this is the private record, so show the seams. The email thread must contain real friction — a pushback, a caveat, a number that is not ready, a deadline that moves — and end with a decision or an agreed next step. No "Hello," or "Best regards"; sign off with the role name only. Memos are blunt and specific, not upbeat.
- CSV cells: leave a cell empty when it does not apply; never write 0 as a filler.
- EMAIL THREAD TOPIC for this week (required): ${THREAD_TOPICS[threadTopicIndex(win.start)]}. Its subject line names that business, not the blog, and is specific to this week — name the event, course, committee, member case or figure involved. It must not repeat any subject in USED THREAD SUBJECTS.
- The memo takes a different subject from the thread. Do not open any artifact by referring to the blog.
- Coherence with the public record: at least one artifact touches something in this week's blog posts (a topic, an event, a course, a figure) without contradicting it, in passing and in the staff's own terms — the staff are running the association, not reviewing its blog.
- Do not repeat a theme from RECENT INTERNAL TITLES.
- Memo body 400–700 words; each email body 60–200 words (excluding frontmatter, header block and the fiction line); deck 6–12 slides of at most 5 bullets; CSV 5–25 data rows with unformatted numeric cells.
- data_sources lists only directories that exist: generated/orders, generated/payments, generated/enrollments, generated/courses, generated/certifications, generated/member-certifications, generated/advocacy-actions, generated/committee-meetings, generated/committees, generated/competition-entries, generated/people, generated/organizations.
- Fiction labels, verbatim. Markdown files: the first body line after the frontmatter is exactly
  ${FICTION_LINE}
  (emails: after the rendered header block, before the body). The CSV comment block carries exactly these two lines — the word is DATA, not DOCUMENT:
  # notice: FICTIONAL DEMONSTRATION DATA - International Cheese Federation, a fictitious
  #   association created for the MemberJunction More Cheese demo. All names, figures, events, and decisions are invented.
- Email files: vault/internal/email/<year>/<date of message 01>-thread-<slug>/NN-YYYY-MM-DD-HHMM-<from>-to-<to>.md, with roles written comms, membership-ops, events, education, advocacy, exec, press (hyphens, never dots). ALL messages of the thread go in that ONE folder, even those sent on later days.
- Email threads: in_reply_to is null on 01 and the previous message's message_id on each later one; files numbered 01, 02, … in send order; the folder is dated to message 01.`,
        `# Era\n${era?.eraKey}: ${era?.description}`,
        `# FACTS — week (node scripts/vault-facts.mjs week ${win.start})\n${JSON.stringify(week, null, 1)}`,
        `# FACTS — year (node scripts/vault-facts.mjs year ${yr})\n${JSON.stringify(yearFacts, null, 1)}`,
        `# This week's public blog posts\n${blog.length ? blog.map((b) => `### ${b.path}\n${b.text}`).join('\n\n') : '(none — say in the memo that coherence with the public blog could not be checked)'}`,
        `# RECENT INTERNAL TITLES (four weeks before; do not repeat these themes)\n${recent.length ? recent.join('\n') : '(none)'}`,
        `# USED THREAD SUBJECTS (other weeks; yours must differ)\n${[...usedThreadSubjects(ROOT, win)].sort().join('\n') || '(none)'}`,
        `# COURSES (start date, name)\n${courses.join('\n')}`,
        `# DESIGN DOCUMENT — content/VAULT-DESIGN.md\n${fs.readFileSync(path.join(ROOT, 'content/VAULT-DESIGN.md'), 'utf8')}`,
        `# SKILL — .claude/skills/morecheese-internal-comms/SKILL.md\n${fs.readFileSync(path.join(ROOT, '.claude/skills/morecheese-internal-comms/SKILL.md'), 'utf8')}`,
        `# FORMAT EXEMPLAR — a finished bundle from another week. Copy its FORMAT (frontmatter fields, header blocks, fiction line placement, CSV comment block, slide layout), never its content or numbers.\n${exemplar(win)}`,
    ].join('\n\n');
}

// ── Gemini ──
const RESPONSE_SCHEMA = {
    type: 'OBJECT',
    properties: { files: { type: 'ARRAY', items: { type: 'OBJECT', properties: { path: { type: 'STRING' }, content: { type: 'STRING' } }, required: ['path', 'content'] } } },
    required: ['files'],
};
function apiKey() {
    const fromEnv = process.env.GEMINI_API_KEY || process.env.AI_VENDOR_API_KEY__GeminiLLM;
    if (fromEnv) return fromEnv.trim();
    const file = process.env.GEMINI_ENV_FILE?.replace(/^~(?=\/)/, os.homedir());
    if (file && fs.existsSync(file)) {
        const m = fs.readFileSync(file, 'utf8').match(/^\s*(?:export\s+)?(?:GEMINI_API_KEY|AI_VENDOR_API_KEY__GeminiLLM)\s*=\s*["']?([^"'\s#]+)/m);
        if (m) return m[1];
    }
    throw new Error('no Gemini key: set GEMINI_API_KEY, or GEMINI_ENV_FILE to a .env holding AI_VENDOR_API_KEY__GeminiLLM');
}
async function generate(opts, contents) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${opts.model}:generateContent`;
    const body = JSON.stringify({
        systemInstruction: { parts: [{ text: SYSTEM }] },
        contents,
        generationConfig: { responseMimeType: 'application/json', responseSchema: RESPONSE_SCHEMA, maxOutputTokens: 32768 },
    });
    for (let i = 0; ; i++) {
        const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-goog-api-key': opts.key }, body });
        const data = await res.json().catch(() => ({}));
        if (res.ok) return data;
        if (i < 4 && (res.status === 429 || res.status >= 500)) { await new Promise((r) => setTimeout(r, 2000 * 2 ** i)); continue; }
        throw new Error(`Gemini ${res.status}: ${data.error?.message ?? res.statusText}`);
    }
}

// ── one week ──
function validate(monday) {
    const r = spawnSync(process.execPath, ['scripts/validate-content.mjs', '--internal-week', monday, '--json'], { cwd: ROOT, encoding: 'utf8', maxBuffer: 64 << 20 });
    const rep = JSON.parse(r.stdout);
    return [...rep.files.flatMap((f) => [...f.fails, ...f.warns].map((x) => `${f.rel}: ${x}`)), ...rep.weekFails];
}
function removeFiles(rels) {
    for (const rel of rels) fs.rmSync(path.join(ROOT, rel), { force: true });
    for (const dir of new Set(rels.map((r) => path.dirname(path.join(ROOT, r))))) {
        if (dir.includes(`${path.sep}email${path.sep}`) && fs.existsSync(dir) && !fs.readdirSync(dir).length) fs.rmdirSync(dir);
    }
}

async function runWeek(monday, opts, log) {
    const t0 = Date.now();
    const usage = { in: 0, out: 0 };
    const row = (status, attempts, note = '') => {
        const secs = Math.round((Date.now() - t0) / 1000);
        const cost = (usage.in * opts.priceIn + usage.out * opts.priceOut) / 1e6;
        fs.appendFileSync(path.join(opts.logdir, 'results.tsv'), `${monday}\t${status}\t${attempts}\t${usage.in}\t${usage.out}\t${secs}\t${cost.toFixed(4)}\t${note}\n`);
        log(`${monday}  ${status}  attempts=${attempts}  ${secs}s  $${cost.toFixed(4)}${note ? `  ${note}` : ''}`);
    };
    const win = weekWindow(monday);
    const existing = walkFiles(path.join(ROOT, 'vault', 'internal')).filter((f) => fileDate(f) >= win.start && fileDate(f) <= win.end);
    if (existing.length && !opts.dryRun) return row('skipped', 0, `${existing.length} file(s) already dated in the week`);
    const ctx = buildContext(monday);
    if (ctx.skip) return row('skipped', 0, ctx.skip);
    const prompt = buildPrompt(ctx);
    if (opts.dryRun) { process.stdout.write(`${SYSTEM}\n\n${prompt}\n`); return; }
    const contents = [{ role: 'user', parts: [{ text: prompt }] }];
    let written = [];
    for (let attempt = 1; attempt <= opts.attempts; attempt++) {
        const res = await generate(opts, contents);
        usage.in += res.usageMetadata?.promptTokenCount ?? 0;
        usage.out += (res.usageMetadata?.candidatesTokenCount ?? 0) + (res.usageMetadata?.thoughtsTokenCount ?? 0);
        const text = res.candidates?.[0]?.content?.parts?.map((p) => p.text ?? '').join('') ?? '';
        fs.writeFileSync(path.join(opts.logdir, `${monday}.attempt${attempt}.json`), text);
        let files, problems = [];
        try { files = JSON.parse(text).files; if (!Array.isArray(files)) throw new Error('no files array'); }
        catch (e) { problems = [`your reply was not the required JSON (${e.message}; finishReason ${res.candidates?.[0]?.finishReason})`]; files = []; }
        for (const f of files) { const p = checkPath(f.path, win); if (p) problems.push(p); }
        if (new Set(files.map((f) => f.path)).size !== files.length) problems.push('two files share one path');
        if (!problems.length) {
            for (const f of files) {
                fs.mkdirSync(path.dirname(path.join(ROOT, f.path)), { recursive: true });
                fs.writeFileSync(path.join(ROOT, f.path), `${f.content.replace(/\r/g, '').replace(/[ \t]+$/gm, '').replace(/\n*$/, '')}\n`);
            }
            written = files.map((f) => f.path);
            problems = [...validate(monday), ...shapeProblems(files, ctx.eventNames), ...untraced(files, ctx.allowed), ...timeLeaks(files, ctx.week.eventsThisWeek), ...topicProblems(files, threadTopicIndex(monday), usedThreadSubjects(ROOT, weekWindow(monday)))];
        }
        if (!problems.length) return row('PASS', attempt);
        fs.writeFileSync(path.join(opts.logdir, `${monday}.attempt${attempt}.problems.txt`), problems.join('\n') + '\n');
        if (attempt === opts.attempts) {
            for (const rel of written) {
                const dest = path.join(opts.logdir, 'rejected', rel);
                fs.mkdirSync(path.dirname(dest), { recursive: true });
                fs.copyFileSync(path.join(ROOT, rel), dest);
            }
            removeFiles(written);
            return row('FAIL', attempt, `${problems.length} problem(s); last draft in rejected/, problems in ${monday}.attempt${attempt}.problems.txt`);
        }
        removeFiles(written);
        written = [];
        contents.push({ role: 'model', parts: [{ text }] });
        contents.push({ role: 'user', parts: [{ text: `The harness rejected that bundle. Fix every problem below and return the COMPLETE corrected bundle (all files) as the same JSON. Problems:\n${problems.map((p) => `- ${p}`).join('\n')}` }] });
    }
}

// ── CLI ──
function parseArgs(argv) {
    const opts = { model: 'gemini-3.5-flash-lite', par: 3, attempts: 3, priceIn: 0.30, priceOut: 2.50, logdir: path.join(os.homedir(), 'Projects/more-cheese-work/internal-runs-gemini'), dryRun: false, weeks: [] };
    for (let i = 0; i < argv.length; i++) {
        const a = argv[i];
        const next = () => argv[++i];
        if (a === '--model') opts.model = next();
        else if (a === '--par') opts.par = Number(next());
        else if (a === '--attempts') opts.attempts = Number(next());
        else if (a === '--logdir') opts.logdir = path.resolve(next());
        else if (a === '--price-in') opts.priceIn = Number(next());
        else if (a === '--price-out') opts.priceOut = Number(next());
        else if (a === '--dry-run') opts.dryRun = true;
        else if (a.startsWith('--')) throw new Error(`unknown option ${a}`);
        else { weekWindow(a); opts.weeks.push(a); }
    }
    if (!opts.weeks.length) throw new Error('give one or more Mondays (YYYY-MM-DD)');
    return opts;
}

async function main() {
    const opts = parseArgs(process.argv.slice(2));
    if (!fs.existsSync(path.join(ROOT, 'scripts/vault-facts.mjs'))) throw new Error('run from the repo root');
    if (opts.dryRun) { for (const w of opts.weeks) await runWeek(w, { ...opts, logdir: os.tmpdir() }, () => {}); return; }
    opts.key = apiKey();
    fs.mkdirSync(opts.logdir, { recursive: true });
    const tsv = path.join(opts.logdir, 'results.tsv');
    if (!fs.existsSync(tsv)) fs.writeFileSync(tsv, 'week\tstatus\tattempts\tin_tokens\tout_tokens\tseconds\tcost_usd\tnote\n');
    const log = (s) => console.log(`[${new Date().toISOString().slice(11, 19)}] ${s}`);
    log(`${opts.weeks.length} week(s), ${opts.model}, ${Math.min(opts.par, opts.weeks.length)} lane(s), logs in ${opts.logdir}`);
    await Promise.all(lanes(opts.weeks, opts.par).map(async (lane) => {
        for (const w of lane) {
            try { await runWeek(w, opts, log); }
            catch (e) { fs.appendFileSync(tsv, `${w}\tERROR\t-\t0\t0\t0\t0\t${String(e.message).replace(/\s+/g, ' ')}\n`); log(`${w}  ERROR  ${e.message}`); }
        }
    }));
    console.log(fs.readFileSync(tsv, 'utf8'));
}

if (process.argv[1] && import.meta.url === pathToFileURL(fs.realpathSync(process.argv[1])).href) {
    main().catch((e) => { console.error(e.message); process.exitCode = 1; });
}
