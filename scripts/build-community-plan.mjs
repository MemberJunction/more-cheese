#!/usr/bin/env node
/**
 * build-community-plan.mjs — ICF's BizApps Community historical & ongoing plan for More Cheese.
 *
 * Reads:
 *   data/ruleset/community-rules.json
 *   data/ruleset/heroes.json
 *   data/spaces/spaces.plan.json
 *   data/spaces/staff.json
 *   config/users/.space-users.json
 *   config/users/.staff-users.json
 *   generated/checkpoint.json
 *   generated/people/.people.json
 *   generated/member-profiles/.member-profiles.json
 *   generated/products/.products.json
 *   generated/orders/*.json
 *
 * Writes:
 *   data/community/community.plan.json — deterministic UUIDv5 plan covering 2019-01 through
 *   the requested/committed horizon (default 2026-10-31, 94 months), with append-only monthly
 *   growth support (--through YYYY-MM / --month YYYY-MM) and --check verification.
 *
 * Usage:
 *   node scripts/build-community-plan.mjs                    # generate through checkpoint/baseline month
 *   node scripts/build-community-plan.mjs --through 2026-11  # append-only extend through 2026-11
 *   node scripts/build-community-plan.mjs --check            # exit 0 if committed file matches byte-for-byte
 *
 * Plain Node, no external dependencies. Run from the repo root.
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { uuidv5 } from './enrich-person-job-functions.mjs';

export const NAMESPACE = 'a3f7c812-49b0-4d1e-8c6a-91d4e70b2f55';
export const PRESENTER = 'demo.user@morecheese.org';
export const BASELINE_MONTH = '2026-10';
export const BASELINE_AS_OF = '2026-10-31';
export const PLAN_FILE = 'data/community/community.plan.json';
export const RULES_FILE = 'data/ruleset/community-rules.json';
export const SPACES_PLAN_FILE = 'data/spaces/spaces.plan.json';
export const STAFF_FILE = 'data/spaces/staff.json';
export const SPACE_USERS_FILE = 'config/users/.space-users.json';
export const STAFF_USERS_FILE = 'config/users/.staff-users.json';
export const COLLAB_SPACE_TYPE_COMMUNITY = '2B2C14A8-CCD6-4835-A1BD-969C54236D57';

const DAY_MS = 86400000;
const YM_RE = /^\d{4}-(0[1-9]|1[0-2])$/;

// ---------- deterministic helpers ----------
const up = (v) => (v == null ? v : String(v).toUpperCase());
const day = (v) => (v == null ? '' : String(v).slice(0, 10));
const tie = (key) => crypto.createHash('sha1').update(String(key)).digest('hex');
const draw = (key) => parseInt(tie(key).slice(0, 13), 16) / 2 ** 52;
const pickInt = (key, min, max) => min + Math.floor(draw(key) * (max - min + 1));
const pickOne = (key, arr) => arr[Math.floor(draw(key) * arr.length) % arr.length];

function monthEnd(ym) {
    const [y, m] = ym.split('-').map(Number);
    return new Date(Date.UTC(y, m, 0)).toISOString().slice(0, 10);
}

function nextMonth(ym) {
    const [y, m] = ym.split('-').map(Number);
    return new Date(Date.UTC(y, m, 1)).toISOString().slice(0, 7);
}

function monthRange(startYm, endYm) {
    if (endYm < startYm) return [];
    const out = [];
    for (let ym = startYm; ym <= endYm; ym = nextMonth(ym)) {
        out.push(ym);
    }
    return out;
}

function plusMonths(iso, n) {
    const [y, m, d] = iso.slice(0, 10).split('-').map(Number);
    const t = new Date(Date.UTC(y, m - 1 + n, 1));
    const last = new Date(Date.UTC(t.getUTCFullYear(), t.getUTCMonth() + 1, 0)).getUTCDate();
    return new Date(Date.UTC(t.getUTCFullYear(), t.getUTCMonth(), Math.min(d, last))).toISOString().slice(0, 10);
}

function daysInMonth(ym) {
    return Number(monthEnd(ym).slice(8, 10));
}

function makeIsoInMonth(ym, dayNum, hour, minute) {
    const maxD = daysInMonth(ym);
    const d = Math.max(1, Math.min(maxD, dayNum));
    const hh = String(Math.max(0, Math.min(23, hour))).padStart(2, '0');
    const mm = String(Math.max(0, Math.min(59, minute))).padStart(2, '0');
    return `${ym}-${String(d).padStart(2, '0')}T${hh}:${mm}:00Z`;
}

function clampIsoToMonthEnd(iso, ym) {
    const end = `${monthEnd(ym)}T23:55:00Z`;
    return iso > end ? end : iso;
}

function addMinutesClamped(iso, minutes, maxIso) {
    const t = Date.parse(iso) + minutes * 60000;
    const out = new Date(t).toISOString().replace('.000Z', 'Z');
    return maxIso && out > maxIso ? maxIso : out;
}

function slugify(str) {
    return String(str)
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 96);
}

function readGeneratedDir(root, dir) {
    const d = path.join(root, 'generated', dir);
    if (!fs.existsSync(d)) return [];
    const out = [];
    for (const f of fs.readdirSync(d).sort()) {
        if (f === '.mj-sync.json' || !f.endsWith('.json')) continue;
        const j = JSON.parse(fs.readFileSync(path.join(d, f), 'utf8'));
        if (Array.isArray(j)) out.push(...j);
    }
    return out;
}

// ---------- world loader ----------
export function loadCommunityWorld(root) {
    const rules = JSON.parse(fs.readFileSync(path.join(root, RULES_FILE), 'utf8'));
    const checkpoint = JSON.parse(fs.readFileSync(path.join(root, 'generated', 'checkpoint.json'), 'utf8'));
    const spacesPlan = JSON.parse(fs.readFileSync(path.join(root, SPACES_PLAN_FILE), 'utf8'));
    const staffData = JSON.parse(fs.readFileSync(path.join(root, STAFF_FILE), 'utf8'));
    const spaceUsersRaw = JSON.parse(fs.readFileSync(path.join(root, SPACE_USERS_FILE), 'utf8'));
    const staffUsersRaw = JSON.parse(fs.readFileSync(path.join(root, STAFF_USERS_FILE), 'utf8'));
    const heroesData = JSON.parse(fs.readFileSync(path.join(root, 'data', 'ruleset', 'heroes.json'), 'utf8'));

    const people = readGeneratedDir(root, 'people').map((r) => ({ id: up(r.primaryKey?.ID), ...r.fields }));
    const memberProfiles = readGeneratedDir(root, 'member-profiles').map((r) => ({
        id: up(r.primaryKey?.ID),
        ...r.fields,
        PersonID: up(r.fields.PersonID),
    }));
    const products = new Map(readGeneratedDir(root, 'products').map((r) => [up(r.primaryKey?.ID), r.fields]));
    const orders = readGeneratedDir(root, 'orders');

    const reversed = new Set(
        orders
            .filter((o) => o.fields?.Status === 'Confirmed' && o.fields?.ReversesOrderHeaderID)
            .map((o) => up(o.fields.ReversesOrderHeaderID)),
    );
    const purchases = [];
    for (const r of orders) {
        const o = r.fields;
        if (!o || o.Status !== 'Confirmed' || o.ReversesOrderHeaderID || reversed.has(up(r.primaryKey?.ID))) continue;
        const date = day(o.OrderDate);
        const personId = up(o.BillToPersonID);
        for (const l of r.collections?.Lines ?? []) {
            if (l.fields?.ReversesOrderLineID) continue;
            if (products.get(up(l.fields?.ProductID))?.Name?.endsWith(' Membership (annual)')) {
                purchases.push({ personId, date });
            }
        }
    }
    purchases.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));

    const asOfDate = day(checkpoint.continuity?.asOfDate ?? checkpoint.releaseDate ?? BASELINE_AS_OF);
    return {
        rules,
        asOfDate,
        defaultThroughMonth: asOfDate.slice(0, 7),
        spacesPlan,
        staff: staffData.staff ?? [],
        spaceUsers: spaceUsersRaw,
        staffUsers: staffUsersRaw,
        heroes: heroesData.heroes ?? [],
        people,
        memberProfiles,
        purchases,
    };
}

// ---------- member & eligibility index ----------
function buildActorIndex(world) {
    const { rules, people, memberProfiles, spaceUsers, staffUsers, staff, heroes, purchases } = world;
    const heroByEmail = new Map(heroes.map((h) => [String(h.businessKeys?.Email ?? '').toLowerCase(), h]));
    const heroRuleByEmail = new Map(
        (rules.heroParticipationRules?.heroes ?? []).map((h) => [String(h.email).toLowerCase(), h]),
    );
    const excludedEmails = new Set([
        PRESENTER.toLowerCase(),
        ...(rules.heroParticipationRules?.excludedEmails ?? []).map((e) => String(e).toLowerCase()),
    ]);
    const excludedHeroKeys = new Set(rules.heroParticipationRules?.excludedHeroKeys ?? ['HERO-ICF-012']);

    const personByEmail = new Map(people.map((p) => [String(p.Email).toLowerCase(), p]));
    const profileByPersonId = new Map(memberProfiles.map((p) => [up(p.PersonID), p]));

    const firstPurchase = new Map();
    const lastPurchase = new Map();
    for (const p of purchases) {
        if (!firstPurchase.has(p.personId)) firstPurchase.set(p.personId, p.date);
        lastPurchase.set(p.personId, p.date);
    }

    const actors = [];
    const actorByUserId = new Map();
    const actorByEmail = new Map();
    const actorByHeroKey = new Map();

    for (const su of spaceUsers) {
        const email = String(su.fields?.Email ?? '').toLowerCase();
        if (!email || excludedEmails.has(email)) continue;
        const person = personByEmail.get(email);
        if (!person || person.Status !== 'Active') continue;
        const hero = heroByEmail.get(email);
        if (hero && excludedHeroKeys.has(hero.heroKey)) continue;

        const userId = up(su.primaryKey?.ID);
        const personId = up(person.id);
        const prof = profileByPersonId.get(personId);
        const fp = firstPurchase.get(personId) ?? null;
        const lp = lastPurchase.get(personId) ?? null;
        const joinDate = prof?.JoinDate ?? fp ?? '2019-01-01';
        const activeFrom = fp && fp > joinDate ? fp : joinDate;
        const heroRule = heroRuleByEmail.get(email) ?? null;

        let activeThrough = lp ? plusMonths(lp, 12) : '2027-12-31';
        if (heroRule?.activeThrough && heroRule.activeThrough < activeThrough) {
            activeThrough = heroRule.activeThrough;
        }
        // Ensure activeFrom never exceeds activeThrough for valid member windows
        if (activeThrough < activeFrom) activeThrough = activeFrom;

        const theta = hero?.latentDials?.theta ?? (draw(`theta:${userId}`) * 2.4 - 0.6);
        const phi = hero?.latentDials?.phi ?? (draw(`phi:${userId}`) * 2.0 - 0.5);

        const actor = {
            userId,
            personId,
            email,
            name: su.fields.Name,
            firstName: su.fields.FirstName,
            lastName: su.fields.LastName,
            title: person.Title ?? 'ICF Member',
            bio: person.Bio ?? null,
            segment: prof?.Segment ?? 'Producer',
            region: prof?.Region ?? 'NA',
            country: prof?.Country ?? 'US',
            state: prof?.State ?? 'US-WI',
            city: prof?.City ?? 'Madison',
            joinDate,
            activeFrom,
            activeThrough,
            isStaff: false,
            heroKey: hero?.heroKey ?? null,
            heroRule,
            theta,
            phi,
            activityWeight: heroRule?.activityWeight ?? 1.0,
            canonReviewer: Boolean(heroRule?.canonReviewer),
        };
        actors.push(actor);
        actorByUserId.set(userId, actor);
        actorByEmail.set(email, actor);
        if (actor.heroKey) actorByHeroKey.set(actor.heroKey, actor);
    }

    const staffByKey = new Map(staff.map((s) => [s.key, s]));
    for (const stU of staffUsers) {
        const email = String(stU.fields?.Email ?? '').toLowerCase();
        if (!email || excludedEmails.has(email)) continue;
        const stInfo = staff.find((s) => String(s.email).toLowerCase() === email);
        if (!stInfo) continue;
        const userId = up(stU.primaryKey?.ID);
        const sinceDate = `${stInfo.since}-01-01`;
        const actor = {
            userId,
            personId: null,
            email,
            name: stU.fields.Name,
            firstName: stU.fields.FirstName,
            lastName: stU.fields.LastName,
            title: stInfo.title,
            bio: `ICF Staff — ${stInfo.title}. ${stInfo.voice}`,
            segment: 'Federation Staff',
            region: 'NA',
            country: 'US',
            state: 'US-WI',
            city: 'Madison',
            joinDate: sinceDate,
            activeFrom: sinceDate,
            activeThrough: '2099-12-31',
            isStaff: true,
            staffKey: stInfo.key,
            heroKey: null,
            heroRule: null,
            theta: 1.1,
            phi: 0.6,
            activityWeight: 1.1,
            canonReviewer: stInfo.key === 'tsai' || stInfo.key === 'oyelaran',
        };
        actors.push(actor);
        actorByUserId.set(userId, actor);
        actorByEmail.set(email, actor);
    }

    actors.sort((a, b) => (a.email < b.email ? -1 : a.email > b.email ? 1 : 0));

    // Map active Collaboration Space seats from spaces.plan.json
    const seatsBySpaceKey = new Map();
    for (const sp of world.spacesPlan.spaces ?? []) {
        const activeUserIds = new Set();
        const adminUserIds = new Set();
        for (const s of sp.seats ?? []) {
            if (s.status !== 'Active' || s.role === 'guest') continue;
            const em = String(s.user ?? '').toLowerCase();
            if (em === PRESENTER.toLowerCase()) continue;
            const actor = actorByEmail.get(em);
            if (!actor) continue;
            activeUserIds.add(actor.userId);
            if (s.role === 'owner' || s.role === 'admin') {
                adminUserIds.add(actor.userId);
            }
        }
        seatsBySpaceKey.set(sp.key, { activeUserIds, adminUserIds, space: sp });
    }

    // For icf-member-commons: all non-excluded active actors are seated
    const commonsActive = new Set(actors.map((a) => a.userId));
    const commonsAdmins = new Set();
    for (const hk of ['HERO-ICF-001', 'HERO-ICF-007', 'HERO-ICF-008', 'HERO-ICF-009', 'HERO-ICF-011']) {
        const a = actorByHeroKey.get(hk);
        if (a) commonsAdmins.add(a.userId);
    }
    for (const sk of ['ashdown', 'oyelaran']) {
        const st = staffByKey.get(sk);
        const a = st ? actorByEmail.get(st.email.toLowerCase()) : null;
        if (a) commonsAdmins.add(a.userId);
    }
    seatsBySpaceKey.set('icf-member-commons', {
        activeUserIds: commonsActive,
        adminUserIds: commonsAdmins,
        space: null,
    });

    return { actors, actorByUserId, actorByEmail, actorByHeroKey, seatsBySpaceKey };
}

// ---------- domain content bank ----------
const ERA_NARRATIVES = {
    'era-pre-pandemic-baseline': {
        yearLabel: '2019',
        themes: [
            {
                title: 'Spring Chapter Tasting & Moisture Calibration Flight',
                tags: ['chapter-tastings', 'cave-humidity-control', 'sensory-judging-calibration'],
                body: 'Our regional tasting table compared three-week vs. eight-week bloomy and washed-rind wheels across four member creameries. The clearest pattern was moisture loss in the first 72 hours after unmolding: rooms running below 86% RH showed early rind tightening and bitter edge notes, while steady 91-93% RH preserved supple paste.',
                replies: [
                    'We logged the exact same curve on our March makes—nudging evening humidifier cycles up by 3% eliminated the dry rim.',
                    'Adding a clean spruce turning board on day 4 also evened out surface drying across the bottom shelf.',
                    'Great benchmark notes. Could we capture the 72-hour weigh-loss targets in our chapter reference sheet before the summer judging?',
                    'Happy to share our gravimetric log from last spring so newcomers have baseline target percentages.',
                ],
            },
            {
                title: 'Pasteurized Vat Curd Craft & CaCl2 Dosing Consistency',
                tags: ['pasteurized-curd-craft', 'rennet-coagulation', 'acidification-ph-curves'],
                body: 'Comparing vat-pasteurized morning milk at 63°C/30min against HTST batches this quarter. With spring component shifts, keeping calcium chloride at 18 mL per 100 L milk and holding a 3.2x flocculation multiplier produced clean shatter-free curd knit and predictable press weights.',
                replies: [
                    'Did you adjust rennet strength when switching from winter hay milk to first-cut pasture milk?',
                    'Yes—we stayed at 190 IMCU single-strength calf rennet and let flocculation tell us when to cut rather than watching the clock.',
                    'Confirmed on our 400-gallon vat: cutting by flocculation multiplier cut fines loss in the whey drain by nearly a third.',
                ],
            },
            {
                title: 'Wholesale Distributor Cut-to-Order Margins vs. Whole-Wheel Turns',
                tags: ['wholesale-distribution', 'cheese-counter-merchandising', 'world-cheese-cup-rules'],
                body: 'Several mid-sized distributors are asking for quarter-wheel Cryovac cuts ahead of autumn resets. Before committing pricing tiers, how are fellow makers accounting for trim loss, cold-room labor, and shorter best-by codes on cut wedges versus whole-wheel shipments?',
                replies: [
                    'We build an explicit 11% yield-and-wrap surcharge on quartered wheels so whole-wheel accounts are not subsidizing cut labor.',
                    'From the buyer side, two-pound half-moons turn fast enough at specialty counters that shrink stays under 3% if wrapped in breathable paper.',
                    'Watch distributor cold-chain dwell times—quarter cuts warm faster on mixed pallets if not staged near the evaporator.',
                ],
            },
        ],
    },
    'era-pandemic-shock-2020': {
        yearLabel: '2020',
        themes: [
            {
                title: 'Rapid Pivot from Foodservice Wholesale to Direct-to-Consumer Cheese Boxes',
                tags: ['pandemic-pivot', 'direct-to-consumer', 'cold-chain-shipping'],
                body: 'With restaurant and hotel accounts paused overnight, we reallocated 70% of our fresh and semi-soft production into weekly curated farmstead boxes. Balancing box weight (three 6-oz wedges + pairing card), recyclable insulated liners, and two-day ground zones kept spoilage below 1.2% in our first month.',
                replies: [
                    'Two-day transit mapping was essential for us too—we froze Wednesday afternoon cutoffs for West Coast zones so boxes never sat in a Sunday hub.',
                    'Bundling an aged tomme alongside a fresh chevre lifted average order value enough to absorb the $9 insulated shipper cost.',
                    'Thanks for posting exact liner specs. Sharing vendor lead times here has kept three small creameries in our county shipping.',
                    'We added a QR tasting sheet inside each box and saw 38% repeat conversion onto monthly club subscriptions.',
                ],
            },
            {
                title: 'Emergency Milk Surplus Diversion & Long-Aged Wheel Conversion',
                tags: ['milk-surplus-diversion', 'alpine-cooked-curd', 'emergency-relief-grants'],
                body: 'When fluid and restaurant buyers dropped pick-ups, we converted surplus morning milk into 35-pound cooked-curd alpine formats and salted farmstead cheddars to buy 6-12 months of cave runway. Tracking brine saturation and cave rack capacity early prevented bottlenecks.',
                replies: [
                    'Converting to 90-day+ formats gave us breathing room while waiting on state agricultural relief micro-grant approvals.',
                    'Make sure brine calcium and pH (5.15) are re-balanced after heavy consecutive vat days or the rind softens.',
                    'We partnered with two regional food banks for fresh curd donations under the emergency dairy diversion credit.',
                ],
            },
            {
                title: 'Virtual CCP Study Circles & Remote Vat Sanitation Oversight',
                tags: ['online-ccp-study', 'haccp-preventive-controls', 'listeria-environmental-monitoring'],
                body: 'With in-person chapter tastings suspended, our study group moved flashcard drills and sanitation log reviews online. Continuous digital data loggers in our aging caves cut unnecessary walk-ins during split-shift staffing.',
                replies: [
                    'Continuous wireless probes alerting at >88% or <80% RH saved an entire batch of bloomy rinds when a compressor tripped on Saturday night.',
                    'Our virtual CCP cohort is running Tuesday evenings—happy to send the shared study deck to anyone preparing remotely.',
                    'Split-shift make-room handoff checklists also reduced missed ATP swab checks during lean weeks.',
                ],
            },
        ],
    },
    'era-virtual-pivot-2021': {
        yearLabel: '2021',
        themes: [
            {
                title: 'Virtual Symposium 2021: Cross-Time-Zone Session Notes & Tasting Kits',
                tags: ['virtual-symposium', 'digital-tasting-kits', 'sensory-judging-calibration'],
                body: 'Shipping 180 refrigerated calibration flights across four time zones ahead of the 2021 Virtual Symposium taught us plenty about gel-pack sizing and blind-number coding. Opening the sensory breakdown asynchronously let European and Pacific members calibrate together.',
                replies: [
                    'Pre-tempering the shipped wedges for 45 minutes before the live stream made aroma volatility match an in-person judging table.',
                    'The recorded cave airflow Q&A from Jura and Vermont has already been rewatched by our entire apprentice crew.',
                    'Keep the blind flight format even after in-person events return—regional buyers loved joining from store backrooms.',
                    'Agreed: hybrid tasting kits should become a permanent ICF education fixture.',
                ],
            },
            {
                title: 'Starter Culture Lead Times & Bacteriophage Rotation Under Supply Delays',
                tags: ['starter-culture-supply', 'acidification-ph-curves', 'fsma-remote-audits'],
                body: 'Global DVS culture shipments are running 2-3 weeks longer than usual. We rebuilt our three-strain rotation matrix so a single delayed pouch never forces back-to-back identical phage profiles in the make-room.',
                replies: [
                    'Checking whey titratable acidity at drain every make caught a sluggish mesophilic batch before phage spread to the press table.',
                    'Also keep chlorinated foam footbaths refreshed between morning and afternoon makes when rotating strains.',
                    'For FSMA remote document reviews, having culture lot numbers tied directly to vat sheets made the digital audit packet painless.',
                ],
            },
            {
                title: 'Structured Apprenticeship Pathways for pandemic-era Career Changers',
                tags: ['apprenticeship-pathways', 'online-ccp-study', 'next-gen-succession'],
                body: 'More hospitality veterans and culinary grads are applying for paid assistant cheesemaker roles. Pairing 12-week make-room shadowing with online CCP modules helped two apprentices reach independent vat lead within nine months.',
                replies: [
                    'Writing clear week-by-week competencies—milk receiving, flocculation testing, brine checks, cave turning—cuts onboarding stress for small teams.',
                    'Our chapter matched three apprentices with stipend micro-grants so they could cover lab exam fees.',
                    'Would love to turn this onboarding outline into a shared ICF playbook.',
                ],
            },
        ],
    },
    'era-artisan-boom-2022-2024': {
        yearLabel: '2022-2024',
        themes: [
            {
                title: 'Return of In-Person World Cheese Cup Judging & Sensory Calibration',
                tags: ['world-cheese-cup-rules', 'sensory-judging-calibration', 'washed-rind-affinage'],
                body: 'Back at full table density for the World Cheese Cup, entries surged past pre-2020 levels. Calibrating technical vs. aesthetic deductions across washed-rind and alpine classes kept panel spreads tight even on packed flights.',
                replies: [
                    'Blind pre-flight tasting of three defect reference wedges (excess bitterness, slip-skin ammonia, late-blowing gas) aligned our table within 1.5 points.',
                    'Shipping boxes arrived in far better shape when makers double-wrapped wheels in micro-perforated cellulose before gel-pack staging.',
                    'Excited to see independent affineurs recognized alongside partner dairies as co-stewards of the final wheel.',
                    'Let us log feedback for the Awards Committee on splitting 6-12m vs 12m+ alpine entries.',
                ],
            },
            {
                title: 'Alpine Cooked-Curd Copper Vat Trials & Propionic Eye Balance',
                tags: ['alpine-cooked-curd', 'wooden-aging-boards', 'seasonal-pasture-milk'],
                body: 'Scaling our 1,200-L copper kettle alpine program during peak summer pasture. Holding scald at 53.5°C for 45 minutes and moving wheels into a 21°C warm room for 18 days gave clean walnut-sized eyes without split-paste cracks.',
                replies: [
                    'Watch warm-room humidity closely—keeping 84-86% RH prevents brittle rind fissures during gas expansion.',
                    'Kiln-dried spruce boards conditioned with benign cave flora gave much cleaner bottom-face breathing than plastic mats.',
                    'We also reduced starter inoculum by 15% on high-fat late-summer milk to keep 24-hour pH above 5.22.',
                ],
            },
            {
                title: 'Specialty Counter Merchandising & Export Health Certificate Workflows',
                tags: ['cheese-counter-merchandising', 'export-certification', 'compostable-packaging'],
                body: 'Retail demand is brisk, and several member creameries are shipping mixed-case exports again. Updating counter signage with milk origin, cave age, and compostable wrap guidance boosted repeat wedge velocity 22% across partner counters.',
                replies: [
                    'Batch-coding USDA/FDA health certificates 10 days ahead of container cutoff eliminated our port hold delays.',
                    'Training mongers on three-bite tasting stories for washed-rind and sheep wheels doubled conversion on unfamiliar styles.',
                    'Make sure breathable cellulose wraps are sealed at the seam only—over-taping traps condensate and dulls bloomy rinds.',
                ],
            },
        ],
    },
    'era-creamery-closures-2025': {
        yearLabel: '2025',
        themes: [
            {
                title: 'Navigating Feed, Culture & Energy Inflation Without Compromising Wheel Quality',
                tags: ['creamery-cost-squeeze', 'herd-economics', 'whey-valorization'],
                body: 'With utility rates, hay costs, and specialty packaging up 18-26% across regional creameries, small farmsteads are feeling acute margin compression. Auditing boiler/chiller heat recovery and recovering sweet whey for ricotta or whey butter clawed back $0.42/lb across our make-room.',
                replies: [
                    'Heat-recovery preheating wash water off our glycol chiller cut propane bills by 28% in Q1 alone.',
                    'Negotiating a four-creamery co-buy on parchment and gel packs saved 19% versus solo pallet orders.',
                    'Sharing these unit-cost worksheets openly helps smaller producers spot leaks before cashflow tightens.',
                    'Please check the Hardship Dues & Mutual Aid thread if your creamery needs bridge support this renewal cycle.',
                ],
            },
            {
                title: 'Hardship Dues Relief & Shared Regional Aging Cave Co-Ops',
                tags: ['hardship-dues-aid', 'shared-aging-caves', 'mutual-aid-equipment'],
                body: 'Following recent small-creamery closures, ICF chapters launched hardship dues waivers and subsidized micro-lab testing vouchers. Several member caves are opening segregated rack capacity for partner makers who lost lease space.',
                replies: [
                    'Clear lot segregation tags and dual-signature humidity logs are essential when two creameries share an affinage room.',
                    'Our chapter pooled three spare vacuum sealers and a brining tank for displaced apprentices transitioning to contract make days.',
                    'Thank you to everyone who quietly funded hardship vouchers—keeping experienced hands in the trade matters more than ever.',
                ],
            },
            {
                title: 'Regional Cold-Chain Consolidation & Cooperative Freight Drops',
                tags: ['cold-chain-shipping', 'wholesale-distribution', 'creamery-cost-squeeze'],
                body: 'Solo LTL refrigerated minimums doubled this year for rural creameries. Pooling Tuesday morning reefers across six valley producers cut per-case freight to urban hubs by 34%.',
                replies: [
                    'Standardizing on 40x48 half-pallets with color-coded temperature strips kept dock transfers under 12 minutes.',
                    'Let us submit this model to the PNW Cold-Chain Grant ideation campaign so other corridors can replicate it.',
                    'Count our creamery in for the Thursday return leg if there is pallet space for cultured butter.',
                ],
            },
        ],
    },
    'era-stabilization-2026': {
        yearLabel: '2026',
        themes: [
            {
                title: 'FDA 60-Day Raw-Milk Aging Modernization & Phosphatase Equivalence Dossier',
                tags: ['raw-milk-aging-rule', 'grassroots-advocacy', 'haccp-preventive-controls'],
                body: 'The Standards & Food Safety committees are compiling multi-year water-activity, pH drop, and pathogen-challenge curves across soft and semi-hard raw-milk wheels to support evidence-based aging modernization in our 2026 regulatory brief.',
                replies: [
                    'Our farmstead contributed 24 months of 45-day vs. 60-day Aw and pH logs—happy to share the anonymized CSV template.',
                    'Pairing strict bulk-tank somatic cell and pathogen pre-screening with verified acidification curves is much stronger scientifically than a blanket day count.',
                    'Reminder: submit producer testimony summaries before the committee docket closes next month.',
                    'This dossier will anchor our Madison 2026 policy plenary.',
                ],
            },
            {
                title: 'FSMA 204 Lot-Level Traceability Pilot & Mock Recall Readiness',
                tags: ['fsma-204-traceability', 'lot-level-traceability', 'fda-recall-readiness'],
                body: 'Twelve volunteer creameries completed timed 2-hour mock recall drills linking bulk milk tanker pick-ups through vat make-sheets, cave turning lots, and distributor case labels. Barcode-scanned cave rack cards cut trace reconciliation from 4 hours to 19 minutes.',
                replies: [
                    'Mapping Critical Tracking Events (CTEs) directly onto our existing make-sheet PDF required zero extra software—just a consistent lot string.',
                    'Biggest bottleneck in our drill was split-lot whey brining—tagging brine changeovers as a lot boundary solved it.',
                    'Can we pin the starter spreadsheet template in the Food Safety Playbooks forum?',
                ],
            },
            {
                title: 'Madison 2026 Conference & Next-Generation Creamery Succession Planning',
                tags: ['annual-conference-madison', 'next-gen-succession', 'world-cheese-cup-2026'],
                body: 'With feed and energy costs stabilizing, federation attention at Madison 2026 shifts toward founder-to-apprentice succession, employee buyouts, and the 2026 World Cheese Cup category reforms.',
                replies: [
                    'Our retiring co-founder is structuring a three-year sweat-equity transition with two lead affineurs—the succession legal clinic notes were gold.',
                    'Excited for the Wisconsin farm tours and the dual-credit maker/affineur medal showcase.',
                    'Please sign up for volunteer judging steward shifts if you are arriving in Madison a day early.',
                ],
            },
        ],
    },
};

const QA_CATALOG = [
    {
        qTitle: 'Target 24-hour pH and brine Baumé for washed-rind taleggio-style squares?',
        qBody: 'We are scaling 2-kg washed-rind squares from 150 L to 500 L vats. Our 24-hour pH has been drifting down to 4.85 before brining, causing slight chalky core at week 4. What target 24-hour pH and brine Baumé keep the paste supple for B. linens development?',
        aBody: 'Hold your 24-hour post-drain pH between **5.05 and 5.15** before entering brine (reduce mesophilic starter by ~15% or shorten pre-rip time by 10 minutes). Aim for **18–19° Baumé** (~19% w/w NaCl) at 11–12°C buffered to pH 5.1 with 0.2% CaCl2, brining 45–55 minutes per kg. That prevents acid-locked core while letting *Geotrichum* de-acidify the surface cleanly before *B. linens* blooms.',
        rationale: 'Matches ICF Affinage Reference Manual §4.2 (pH 5.05–5.15, 18–19° Bé brine, CaCl2 buffering).',
        tags: ['washed-rind-affinage', 'acidification-ph-curves', 'brine-salting-chemistry'],
        forums: ['commons-cheesemaker-qa', 'ca-milk-and-cave-qa'],
    },
    {
        qTitle: 'Preventing slip-skin in bloomy-rind camembert styles during humid coastal summers',
        qBody: 'When ambient summer coastal humidity spikes above 80% outside our plant, our 10-day bloomy wheels develop soft slip-skin beneath the Penicillium candidum coat while the center stays firm. How do we rebalance Geotrichum and drying room airflow?',
        aBody: 'Slip-skin is classic **over-proteolysis at the rind interface** driven by excessive early surface moisture and slow *Geotrichum candidum* establishment. Drop your initial 48-hour drying room to **78–82% RH** with gentle **0.2–0.3 m/s** laminar airflow until rind moisture feels dry-to-touch, increase *G. candidum* relative to *P. candidum* (roughly 1:2 ratio), and verify 24-hour pH reaches **4.65–4.75** before moving to the 92% RH bloom cave.',
        rationale: 'Verified against ICF Coastal Affinage & Bloomy-Rind Troubleshooting Canon (§3.4).',
        tags: ['bloomy-rind-management', 'cave-humidity-control', 'acidification-ph-curves'],
        forums: ['commons-cheesemaker-qa', 'ca-milk-and-cave-qa', 'pnw-new-maker-qa'],
    },
    {
        qTitle: 'Zone 1 vs. Zone 2 environmental swabbing frequency under FSMA Preventive Controls',
        qBody: 'We are a 12-person farmstead creamery running four make-days per week (pasteurized and 60-day raw-milk aged wheels). How should we structure Zone 1 food-contact vs. Zone 2 adjacent drain/equipment swabs to satisfy FSMA PCQI audits?',
        aBody: 'Under ICF FSMA Preventive Controls guidance for small-to-mid creameries: swab **Zone 2** (make-table legs, press frames, brine pump housings, floor-wall coving near drains) **weekly** on a rotating 12-site map for *Listeria* spp. (aiming for at least 5–8 swabs/week). Reserve **Zone 1** food-contact swabs for **post-sanitation ATP verification** daily and targeted *Listeria* spp. swabs immediately if any adjacent Zone 2 site tests positive or during seek-and-destroy tear-downs.',
        rationale: 'Aligns with FDA Draft Guidance for Control of Listeria monocytogenes in RTE Foods and ICF Food Safety Committee SOP-104.',
        tags: ['listeria-environmental-monitoring', 'haccp-preventive-controls', 'fda-recall-readiness'],
        forums: ['fs-fsma-qa', 'commons-cheesemaker-qa'],
    },
    {
        qTitle: 'Bacteriophage troubleshooting when cheddar milling pH stalls at 5.65',
        qBody: 'Two consecutive Thursday cheddar vats stalled at pH 5.65 two hours past our normal milling window, even though milk temperature (38°C scald) and starter dose matched Tuesday. How do we confirm phage vs. antibiotic residue quickly?',
        aBody: 'Run a parallel **milk-acidity activity test** on bulk tank milk using your suspect culture vs. a completely unrelated backup strain at 32°C for 4 hours. If the unrelated strain acidifies normally to <5.3 while the suspect strain stalls, you have **bacteriophage** (confirmable via whey spot assay). Immediately switch to an **unrelated phage-rotation strain**, deep-clean vat gaskets and whey lines with peracetic/chlorine rotation, and stop using whey-cream recycle until cleared.',
        rationale: 'Consistent with Wisconsin Center for Dairy Research & ICF Starter Culture Rotation Protocol.',
        tags: ['starter-culture-supply', 'acidification-ph-curves', 'milk-quality-scc'],
        forums: ['wi-equipment-and-cultures-qa', 'commons-cheesemaker-qa'],
    },
    {
        qTitle: 'CCP Exam Prep: Distinguishing enzymatic vs. acid coagulation and whey mineral loss',
        qBody: 'On the Certified Cheese Professional (CCP) practice domain, questions frequently contrast rennet-coagulated vs. direct-acid/lactic curds in calcium retention and meltability. What is the crispest rule-of-thumb for the exam?',
        aBody: 'Remember **pH at drain determines bound calcium**:\n1. **Rennet-dominant curds** drained high (pH 6.1–6.4, e.g., Alpine, Gouda, Cheddar) retain colloidal calcium phosphate inside the casein micelle network, yielding **elastic, meltable paste** when heated.\n2. **Lactic/acid-set curds** (e.g., fresh chèvre, Valencay) acidify down near the isoelectric point (**pH 4.6**) *before* draining, solubilizing calcium into the whey—producing **chalky/crumbly, non-melting paste**.',
        rationale: 'Directly matches ICF CCP Study Domain 2 (Cheese Science & Milk Chemistry).',
        tags: ['ccp-exam-prep', 'rennet-coagulation', 'acidification-ph-curves'],
        forums: ['edu-ccp-study-qa', 'commons-cheesemaker-qa'],
    },
    {
        qTitle: 'Kiln sanitation and biofilm recovery for spruce aging boards',
        qBody: 'When cycling spruce boards between batches of washed-rind and natural-rind tommes, what wash temperature and drying protocol eliminates unwanted molds without stripping beneficial cave flora?',
        aBody: 'Scrub boards in **65–70°C potable water** using stiff nylon brushes (avoid quaternary ammonium sanitizers on porous wood, which leave residues and kill beneficial *Geotrichum/Debaryomyces* competitors). Rinse hot, then **kiln-dry or sun-dry at 55–60°C** until board moisture drops below 14% for 24 hours before resting 48 hours at ambient cave humidity. Maintain dedicated board sets per cheese family (bloomy vs. washed vs. natural).',
        rationale: 'Verified by Jura & Vermont Wood-Board Stewardship working group.',
        tags: ['wooden-aging-boards', 'washed-rind-affinage', 'haccp-preventive-controls'],
        forums: ['commons-cheesemaker-qa', 'fs-fsma-qa'],
    },
    {
        qTitle: 'CDFA & Grade A permitting timeline for adding a small sheep-milk pasteurizer',
        qBody: 'We currently hold a cow-milk Grade A plant permit in northern California and want to add a 200-gallon vat pasteurizer dedicated to seasonal sheep milk. What CDFA inspection steps have the longest lead time?',
        aBody: 'Budget **10–14 weeks** for CDFA Milk & Dairy Food Safety Branch review: submit stamped P&ID plumbing diagrams showing air-space heater and time-temperature recording chart (with physical break between cow and sheep CIP lines if allergen/species segregated), schedule **recording thermometer calibration + airspace check** before first commercial make, and validate raw-milk receiving antibiotic screening logs for ovine inhibitors (Delvotest SP-NT timing differs slightly on high-solids sheep milk).',
        rationale: 'Verified against California Chapter CDFA permitting checklist (2024–2026 update).',
        tags: ['goat-and-sheep-dairy', 'pasteurized-curd-craft', 'haccp-preventive-controls'],
        forums: ['ca-milk-and-cave-qa', 'pnw-new-maker-qa'],
    },
    {
        qTitle: 'Maintaining brine mineral balance and pasteurizing spent cheddar/gouda brines',
        qBody: 'After 90 days of continuous brining, our 20° Baumé tank is turning slightly cloudy and we are seeing a faint surface film. When should we heat-pasteurize vs. dump and rebuild, and how do we re-adjust calcium?',
        aBody: 'Filter brine through a 5-micron food-grade bag weekly, and **heat-pasteurize at 75–80°C for 15–20 minutes** (or run through UV + 1-micron filtration) every 4–6 weeks, skimming denatured whey proteins after cooling. Re-verify **specific gravity (18–21° Bé)**, **pH (5.0–5.2)** with food-grade lactic/hydrochloric adjustment, and **soluble calcium (0.15–0.25% CaCl2)**—brine depleted of calcium leaches calcium out of wheel rinds and creates slimy "blistered" rinds.',
        rationale: 'Matches ICF Dairy Chemistry Canon §5.1 (Brine Maintenance & Rind Integrity).',
        tags: ['brine-salting-chemistry', 'haccp-preventive-controls', 'cave-humidity-control'],
        forums: ['wi-equipment-and-cultures-qa', 'commons-cheesemaker-qa'],
    },
    {
        qTitle: 'FSMA 204 KDE lot-code mapping for raw-milk commingled morning/evening milkings',
        qBody: 'Under FSMA 204 traceability rules, if a farmstead vat mixes evening and morning bulk-tank milkings from the same herd before making a 60-day raw-milk tomme, how should the Traceability Lot Code (TLC) be assigned?',
        aBody: 'Assign the **Transformation Event TLC at the vat make** (e.g., `YYMMDD-VAT1-TOM`), and record both the evening and morning raw-milk bulk-tank cooling/pick-up **Source Lot IDs** as input KDEs on that vat make-sheet. Every wheel stamped from that vat carries the single Transformation TLC through cave turning, cutting, and shipping—so a mock recall traces both forward to retail cases and backward to both milkings in one lookup.',
        rationale: 'Verified by ICF Food Safety Committee FSMA 204 Pilot Working Group.',
        tags: ['fsma-204-traceability', 'lot-level-traceability', 'raw-milk-aging-rule'],
        forums: ['fs-fsma-qa', 'commons-cheesemaker-qa'],
    },
    {
        qTitle: 'First-year creamery cold-chain gel-pack sizing for 48-hour summer shipments',
        qBody: 'Launching our first D2C 2-lb cheese box from Oregon to Phoenix and Denver in July. How much phase-change gel weight per insulated box keeps internal core temps under 7°C (45°F) across 48-hour ground transit?',
        aBody: 'For a 2-lb payload in a **1.5-inch compostable cellulose or recycled-PET liner**, pair **two 16-oz 0°C/28°F gel packs** (one frozen solid at -18°C on top, one chilled/semi-frozen separator pack separated by butcher paper so fresh chèvre does not freeze-burn). Pre-chill boxes at 2°C for 12 hours before packing, and validate with a $12 USB temperature logger on a Thursday-drop summer test lane before opening hot-weather zip codes.',
        rationale: 'Verified against PNW Cold-Chain D2C Transit Validation Guide.',
        tags: ['cold-chain-shipping', 'direct-to-consumer', 'compostable-packaging'],
        forums: ['pnw-new-maker-qa', 'commons-cheesemaker-qa'],
    },
    {
        qTitle: 'Mitigating cheese mite (Tyrophagus) pressure on long-aged natural-rind wheels',
        qBody: 'We noticed dusty tan mite trails on two racks of 9-month clothbound cheddar. What non-chemical cave hygiene and brushing schedule brings mite counts down without losing natural rind complexity?',
        aBody: 'First isolate affected racks and **vacuum-brush wheels with a HEPA-filtered soft-bristle attachment** outside the cave (never dry-sweep inside, which aerosolizes eggs). Drop cave temperature slightly toward **10–11°C** and **80–82% RH**, scrub racks with 70°C water, and coat clothbound surfaces lightly with food-grade lard/canola or dip-wash in hot brine (60°C) for 10 seconds followed by clean drying. Weekly compressed-air/brush rotation prevents re-colonization.',
        rationale: 'Verified against ICF Natural-Rind Cave IPM Manual §6.3.',
        tags: ['cheese-mite-control', 'cave-humidity-control', 'wooden-aging-boards'],
        forums: ['commons-cheesemaker-qa', 'ca-milk-and-cave-qa'],
    },
    {
        qTitle: 'Late-blowing gas prevention when switching seasonal cows onto wrapped baleage',
        qBody: 'Our winter alpine wheels developed sweet-fruity fissures at week 10 after our partner farm switched from dry hay to wrapped baleage. How do we screen milk for Clostridium tyrobutyricum spores before committing to 6-month aging?',
        aBody: 'Run **MPN (Most Probable Number) butyric-acid bacteria spore counts** on incoming bulk milk; target **<100 spores/L** for cooked-curd long-aged cheeses (above 500 spores/L guarantees late-blowing risk). Short-term mitigation in the vat: use **bactofugation or microfiltration** if equipped, apply **lysozyme** (where permitted/labeled) or protective *Lactobacillus* adjuncts, keep salt-in-moisture >3.8%, and hold early cave temperatures under **12°C**.',
        rationale: 'Verified against ICF Herd & Silage Milk Quality Canon.',
        tags: ['late-blowing-clostridia', 'milk-quality-scc', 'alpine-cooked-curd'],
        forums: ['wi-equipment-and-cultures-qa', 'fs-fsma-qa'],
    },
];

const CASE_CATALOG = [
    {
        title: 'Case Round: Recovering Persistent Slip-Skin on Coastal Triple-Cream Wheels',
        situation: 'During an August marine-layer heatwave, 65% of our 220g triple-cream rounds developed soft slip-skin by day 11 in cave #2 (12°C, 95% RH). Surface pH rose to 6.8 within 8 days while core pH remained at 4.55.',
        action: 'Reduced initial drying humidity from 88% to 79% RH for 48 hours, installed a laminar baffle fan at 0.25 m/s across racks, raised Geotrichum candidum inoculation by 25%, and lowered final bloom-cave temp from 12°C to 10.5°C.',
        outcome: 'Within two make cycles, surface proteolysis slowed to match core softening. Slip-skin rejections dropped from 65% to <2%, and shelf-life stability at retail counters extended from 18 to 26 days.',
        tags: ['bloomy-rind-management', 'cave-humidity-control', 'seasonal-pasture-milk'],
        forums: ['ca-case-rounds', 'ne-farmstead-case-rounds'],
        anonymized: false,
    },
    {
        title: 'Case Round: Anonymized Zone 2 Listeria Positive & Drain Assembly Teardown',
        situation: 'Routine Thursday Zone 2 environmental swabbing returned one presumptive positive (confirmed L. innocua, treated under full Listeria spp. protocol) on a recessed trench-drain grate frame adjacent to our brining room.',
        action: 'Immediately placed the last 48 hours of brined lots on precautionary hold, removed and autoclaved all drain baskets, disassembled the trench-frame seal, applied 800 ppm peracetic acid + hot-water steam flush across 3 consecutive nights, and swabbed 18 vector sites across Zones 1–3.',
        outcome: 'All 18 vector swabs and 3 consecutive post-remediation clearance swabs tested negative; no Zone 1 or product lots were implicated. Replaced recessed rubber drain gaskets with solid welded stainless covers and added bi-weekly basket pull-outs to SOP-104.',
        tags: ['listeria-environmental-monitoring', 'haccp-preventive-controls', 'fda-recall-readiness'],
        forums: ['fs-recall-case-rounds'],
        anonymized: true,
    },
    {
        title: 'Case Round: Jura Spruce-Board Ammonia Spike in High-Density Winter Cave',
        situation: 'Following a 30% winter volume increase of washed-rind wheels in Cave B, free ammonia climbed above 15 ppm, dulling B. linens orange pigmentation and leaving bitter rind edges.',
        action: 'Staggered fresh-air exchange dampers (4 room-volume exchanges per 24h via pre-humidified intake), reduced wheel density per spruce shelf from 8 to 6 wheels, and shifted wash frequency from every 2 days to every 3 days with lighter 3% brine.',
        outcome: 'Cave ammonia stabilized under 4 ppm within 10 days, rind color recovered vibrant brick-orange luster, and sensory panel bitterness scores returned to zero.',
        tags: ['washed-rind-affinage', 'wooden-aging-boards', 'cave-humidity-control'],
        forums: ['fr-cave-microflora-case-rounds', 'ne-farmstead-case-rounds'],
        anonymized: false,
    },
    {
        title: 'Case Round: Preventing Blue-Vein Collapse in High-Moisture Ovine Curd',
        situation: 'Late-lactation sheep milk (7.8% butterfat, 6.1% protein) yielded overly dense, closed curds in our September blue makes, choking Penicillium roqueforti veining even after standard day-7 piercing.',
        action: 'Cut curd larger (2.2 cm cubes), shortened stir time by 12 minutes to preserve whey pockets, delayed piercing until day 11 when paste firmed to 54% moisture, and added a second orthogonal pass at day 14.',
        outcome: 'Even emerald-blue marbling formed across 94% of cut faces with creamy, non-crumbly texture and balanced lipolysis.',
        tags: ['blue-veining-penicillium', 'goat-and-sheep-dairy', 'seasonal-pasture-milk'],
        forums: ['ca-case-rounds', 'fr-cave-microflora-case-rounds'],
        anonymized: false,
    },
];

const PLAYBOOK_CATALOG = [
    {
        title: 'Living SOP: FSMA 204 Lot-Level Traceability & 2-Hour Mock Recall Template',
        modality: 'Document',
        postTypeCode: 'collaborative-doc',
        body: 'Co-authored ICF Food Safety Committee template mapping bulk-milk receiving KDEs, vat transformation TLC strings, cave rack transfers, and retail case shipping logs so any creamery can pass a 2-hour mock recall drill.',
        tags: ['fsma-204-traceability', 'lot-level-traceability', 'fda-recall-readiness'],
        forums: ['fs-haccp-and-raw-milk-playbooks', 'commons-creamery-playbooks'],
    },
    {
        title: 'Workbook: Creamery Unit Economics, Energy Heat-Recovery & Whey Margin Model',
        modality: 'Spreadsheet',
        postTypeCode: 'collaborative-sheet',
        body: 'Interactive multi-tab spreadsheet modeling raw milk solids yield, starter/rennet cost per pound, chiller heat-recovery ROI, and sweet-whey ricotta recovery across 200-gal to 1,500-gal batch sizes.',
        tags: ['creamery-cost-squeeze', 'whey-valorization', 'herd-economics'],
        forums: ['commons-creamery-playbooks', 'ne-seasonal-grazing-playbooks'],
    },
    {
        title: 'Playbook: 60-Day Raw-Milk Aging Verification & Phosphatase Equivalence Log',
        modality: 'Document',
        postTypeCode: 'collaborative-doc',
        body: 'Standardized recording template for raw-milk lot release dates, cave temperature verification (>1.7°C / 35°F for >=60 days), Aw/pH progression benchmarks, and voluntary phosphatase/pathogen testing documentation.',
        tags: ['raw-milk-aging-rule', 'haccp-preventive-controls', 'lot-level-traceability'],
        forums: ['fs-haccp-and-raw-milk-playbooks', 'fr-export-and-aop-playbooks'],
    },
    {
        title: 'Deck: World Cheese Cup Sensory Calibration & Defect Lexicon Training',
        modality: 'Presentation',
        postTypeCode: 'collaborative-deck',
        body: 'Judge & steward calibration slide deck covering 100-point sensory scoring sheets, blind defect reference standards (late-blowing, slip-skin, oxidation, phage sourness), and affineur co-attribution rules.',
        tags: ['sensory-judging-calibration', 'world-cheese-cup-rules', 'world-cheese-cup-2026'],
        forums: ['wcc-sensory-calibration-playbooks', 'commons-creamery-playbooks'],
    },
    {
        title: 'Playbook: FDA Export Prior Notice & EU/UK Cold-Chain Customs Checklist',
        modality: 'Document',
        postTypeCode: 'collaborative-doc',
        body: 'Step-by-step transatlantic export guide detailing USDA/FDA health certificates, TRACES NT pre-notification, raw-milk equivalence declarations, and gel-pack pallet validation for European & North American shipments.',
        tags: ['export-certification', 'aop-igp-standards', 'cold-chain-shipping'],
        forums: ['fr-export-and-aop-playbooks', 'commons-creamery-playbooks'],
    },
];

const AMA_CATALOG = [
    {
        title: 'AMA: Navigating the 2020 Wholesale Collapse & Launching Farmstead D2C Boxes',
        body: 'Live Federation Town Hall & Q&A with ICF leadership and peer producers who shifted >60% of volume to direct-to-consumer cheese clubs in 21 days.',
        recap: '**Session Recap:** 142 members attended live. Key takeaways included 2-day ground shipping zone maps, minimum $55 box economics, and shared insulated liner co-buys.',
        tags: ['pandemic-pivot', 'direct-to-consumer', 'cold-chain-shipping'],
        forums: ['commons-town-halls-amas'],
        minYear: 2020,
        maxYear: 2021,
    },
    {
        title: 'Masterclass AMA: CCP Exam Strategy, Milk Chemistry & Sensory Flight Prep',
        body: 'Live Q&A with ICF Education Committee exam authors covering the 9 CCP knowledge domains, high-yield chemistry conversions, and virtual tasting calibration.',
        recap: '**Session Recap:** Covered colloidal calcium retention, flocculation math, and effective 8-week study schedules for remote cohorts.',
        tags: ['ccp-exam-prep', 'online-ccp-study', 'sensory-judging-calibration'],
        forums: ['edu-masterclass-amas', 'commons-town-halls-amas'],
        minYear: 2020,
        maxYear: 2026,
    },
    {
        title: 'Wisconsin Master Makers AMA: Open-Vat Cheddar, Whey Recovery & Madison 2026',
        body: 'Ask Wisconsin Master Cheesemakers and Madison 2026 track leads about cheddaring curves, phage rotation, and conference creamery tour highlights.',
        recap: '**Session Recap:** Shared open-vat milling pH logs (5.32–5.38), whey cream separator yields, and Madison 2026 judging volunteer sign-ups.',
        tags: ['annual-conference-madison', 'starter-culture-supply', 'whey-valorization'],
        forums: ['wi-conference-and-tasting-amas', 'commons-town-halls-amas'],
        minYear: 2021,
        maxYear: 2026,
    },
    {
        title: 'Town Hall AMA: 2026 Raw-Milk Rulemaking Dossier & Next-Gen Creamery Succession',
        body: 'Joint Town Hall with ICF Standards & Food Safety chairs reviewing the 2026 raw-milk aging equivalence brief and employee-buyout succession case studies.',
        recap: '**Session Recap:** Confirmed 38 creameries contributing Aw/pH aging data and announced 12 new succession legal-clinic office-hour slots.',
        tags: ['raw-milk-aging-rule', 'next-gen-succession', 'grassroots-advocacy'],
        forums: ['commons-town-halls-amas', 'edu-masterclass-amas'],
        minYear: 2025,
        maxYear: 2026,
    },
];

// ---------- main builder ----------
export function buildCommunityPlan(world, opts = {}) {
    const { rules } = world;
    const ns = rules.namespace ?? NAMESPACE;
    const id = (name) => uuidv5(name, ns);

    const startMonth = rules.monthlyCadence?.startMonth ?? '2019-01';
    const throughMonth = opts.throughMonth ?? world.defaultThroughMonth ?? BASELINE_MONTH;
    if (!YM_RE.test(throughMonth) || throughMonth < startMonth) {
        throw new Error(`throughMonth must be YYYY-MM >= ${startMonth}, got "${throughMonth}"`);
    }
    const cycles = monthRange(startMonth, throughMonth);
    const asOf = monthEnd(throughMonth);

    const ix = buildActorIndex(world);
    const { actors, actorByUserId, actorByEmail, actorByHeroKey, seatsBySpaceKey } = ix;

    const forumTypeByCode = rules.metadataRefs?.forumTypes ?? {};
    const postTypeByCode = rules.metadataRefs?.postTypes ?? {};
    const roleTypeByCode = rules.metadataRefs?.forumRoleTypes ?? {};
    const topicBySlug = new Map((rules.topicTaxonomy ?? []).map((t) => [t.slug, t]));

    // 1. CommunitySpaces (9) & Forums (29) & ForumIdeaCampaigns (4)
    const spaceByKey = new Map();
    const communitySpaces = [];
    for (const cs of rules.communitySpaces) {
        const spaceId = cs.collaborationSpaceId ? up(cs.collaborationSpaceId) : id(`space:${cs.key}`);
        const ownerActor = cs.ownerHeroKey
            ? actorByHeroKey.get(cs.ownerHeroKey)
            : (() => {
                  const seatInfo = seatsBySpaceKey.get(cs.collaborationSpaceKey);
                  const spOwnerEmail = String(seatInfo?.space?.owner ?? '').toLowerCase();
                  return actorByEmail.get(spOwnerEmail) ?? actors[0];
              })();

        const spaceForums = rules.forums.filter((f) => f.spaceKey === cs.key);
        const defaultForumDef = spaceForums.find((f) => f.defaultForum) ?? spaceForums[0];
        const defaultForumId = defaultForumDef ? id(`forum:${defaultForumDef.key}`) : null;

        let collaborationSpace = null;
        if (cs.createCollaborationSpace) {
            const seatInfo = seatsBySpaceKey.get(cs.key);
            const seats = actors.map((a) => ({
                userId: a.userId,
                personId: a.personId,
                email: a.email,
                role: a.userId === ownerActor.userId ? 'owner' : seatInfo.adminUserIds.has(a.userId) ? 'admin' : 'member',
                status: 'Active',
            }));
            collaborationSpace = {
                fields: {
                    ID: spaceId,
                    SpaceTypeID: up(cs.spaceTypeId ?? COLLAB_SPACE_TYPE_COMMUNITY),
                    ParentID: null,
                    Name: cs.name,
                    Description: cs.description,
                    OwnerID: ownerActor.userId,
                    InheritsMembership: false,
                    AgentRetrieval: 'Included',
                    StartedAt: `${cs.startedAt}T00:00:00Z`,
                    PlannedCloseAt: null,
                    ClosedAt: null,
                    AllowParentAssignees: true,
                    IconClass: 'fa-solid fa-people-roof',
                    Color: '#C87D20',
                },
                seats,
            };
        }

        const spaceObj = {
            key: cs.key,
            id: spaceId,
            createCollaborationSpace: Boolean(cs.createCollaborationSpace),
            collaborationSpaceKey: cs.collaborationSpaceKey,
            startedAt: cs.startedAt,
            ownerHeroKey: cs.ownerHeroKey ?? null,
            ownerUserId: ownerActor.userId,
            ownerEmail: ownerActor.email,
            ...(collaborationSpace ? { collaborationSpace } : {}),
            fields: {
                ID: spaceId,
                Slug: cs.slug,
                CommunityKind: cs.CommunityKind,
                CommunityKindDetails: cs.CommunityKindDetails ?? null,
                AnonymousReadMode: cs.AnonymousReadMode ?? 'Teaser Only',
                AskFirstEnabled: Boolean(cs.AskFirstEnabled),
                DefaultDigestCadence: cs.DefaultDigestCadence ?? 'Daily Digest',
                BannerImageURL: null,
                WelcomeMarkdown: cs.welcomeMarkdown ?? null,
                DefaultForumID: defaultForumId,
            },
        };
        communitySpaces.push(spaceObj);
        spaceByKey.set(cs.key, spaceObj);
    }

    const forumByKey = new Map();
    const forums = [];
    for (const f of rules.forums) {
        const space = spaceByKey.get(f.spaceKey);
        if (!space) throw new Error(`Unknown spaceKey ${f.spaceKey} for forum ${f.key}`);
        const forumType = forumTypeByCode[f.forumTypeCode];
        if (!forumType) throw new Error(`Unknown forumTypeCode ${f.forumTypeCode}`);
        const forumId = id(`forum:${f.key}`);
        const forumObj = {
            key: f.key,
            spaceKey: f.spaceKey,
            forumTypeCode: f.forumTypeCode,
            startedAt: f.startedAt,
            defaultForum: Boolean(f.defaultForum),
            ideaCampaignKey: f.ideaCampaignKey ?? null,
            fields: {
                ID: forumId,
                SpaceID: space.id,
                ParentForumID: null,
                ForumTypeID: up(f.forumTypeId ?? forumType.id),
                Slug: f.slug,
                Name: f.name,
                Description: f.description,
                Icon: f.icon ?? null,
                ColorHex: f.colorHex ?? null,
                VisibilityBand: f.visibilityBand ?? 'Shared',
                AnonymousReadMode: null,
                InheritsSpaceMembers: true,
                PostingPolicy: f.postingPolicy ?? 'Open',
                InboundEmailAlias: null,
                Sequence: f.sequence,
                Status: 'Active',
                Configuration: null,
            },
        };
        forums.push(forumObj);
        forumByKey.set(f.key, forumObj);
    }

    const campaignByKey = new Map();
    const forumIdeaCampaigns = [];
    for (const c of rules.ideationCampaignSchedule ?? []) {
        const forum = forumByKey.get(c.forumKey);
        if (!forum) throw new Error(`Unknown forumKey ${c.forumKey} for campaign ${c.campaignKey}`);
        const campObj = {
            campaignKey: c.campaignKey,
            forumKey: c.forumKey,
            spaceKey: c.spaceKey,
            title: c.title,
            description: c.description,
            opensAt: c.opensAt,
            seedIdeas: c.seedIdeas ?? [],
            fields: {
                ID: forum.fields.ID,
                DefaultBudgetPoints: c.defaultBudgetPoints ?? 100,
                AllocationMode: c.allocationMode ?? 'Quadratic',
                MaxPointsPerIdea: c.maxPointsPerIdea ?? null,
                SubmissionsCloseAt: c.submissionsCloseAt ?? null,
                VotingClosesAt: c.votingClosesAt ?? null,
            },
        };
        forumIdeaCampaigns.push(campObj);
        campaignByKey.set(c.campaignKey, campObj);
    }

    // 2. Space-scoped ForumTopicTags (all 52 in icf-member-commons + domain-scoped tags in every space)
    const topicTags = [];
    const tagBySpaceAndSlug = new Map();
    const addSpaceTag = (spaceKey, t) => {
        const mapKey = `${spaceKey}:${t.slug}`;
        if (tagBySpaceAndSlug.has(mapKey)) return tagBySpaceAndSlug.get(mapKey);
        const space = spaceByKey.get(spaceKey);
        const tagObj = {
            key: mapKey,
            spaceKey,
            category: t.category,
            fields: {
                ID: id(`topic-tag:${spaceKey}:${t.slug}`),
                SpaceID: space.id,
                ParentTagID: null,
                TagID: null,
                Slug: t.slug,
                Name: t.name,
                Description: t.description,
                ColorHex: t.colorHex,
                IsOfficial: Boolean(t.isOfficial),
                PostCount: 0,
            },
        };
        topicTags.push(tagObj);
        tagBySpaceAndSlug.set(mapKey, tagObj);
        return tagObj;
    };

    for (const t of rules.topicTaxonomy ?? []) {
        addSpaceTag('icf-member-commons', t);
    }
    const SPACE_TAG_CATEGORIES = {
        'chapter-california': ['Affinage & Caves', 'Milk & Herd Science', 'Events & Chapters', 'Regulation & Policy', 'Cultures & Make-Room'],
        'chapter-wisconsin': ['Cultures & Make-Room', 'Competition & Awards', 'Events & Chapters', 'Sustainability', 'Creamery Business'],
        'chapter-new-england': ['Affinage & Caves', 'Milk & Herd Science', 'Creamery Business', 'Sustainability'],
        'chapter-pacific-northwest': ['Retail & Logistics', 'Creamery Business', 'Milk & Herd Science', 'Education & CCP'],
        'chapter-france': ['Affinage & Caves', 'Regulation & Policy', 'Cultures & Make-Room', 'Competition & Awards'],
        'committee-food-safety': ['Food Safety', 'Regulation & Policy', 'Milk & Herd Science'],
        'committee-education': ['Education & CCP', 'Creamery Business', 'Competition & Awards'],
        'committee-awards-and-competition': ['Competition & Awards', 'Affinage & Caves', 'Cultures & Make-Room'],
    };
    for (const cs of communitySpaces) {
        if (cs.key === 'icf-member-commons') continue;
        const cats = new Set(SPACE_TAG_CATEGORIES[cs.key] ?? []);
        for (const t of rules.topicTaxonomy ?? []) {
            if (cats.has(t.category)) addSpaceTag(cs.key, t);
        }
    }
    // Ensure every tag mentioned in QA_CATALOG, CASE_CATALOG, PLAYBOOK_CATALOG, AMA_CATALOG, ERA_NARRATIVES, and ideation campaigns exists in every relevant space
    for (const camp of forumIdeaCampaigns) {
        for (const si of camp.seedIdeas) {
            for (const slug of si.tags ?? []) {
                const t = topicBySlug.get(slug);
                if (t) addSpaceTag(camp.spaceKey, t);
            }
        }
    }
    for (const item of [...QA_CATALOG, ...CASE_CATALOG, ...PLAYBOOK_CATALOG, ...AMA_CATALOG]) {
        for (const fKey of item.forums) {
            const f = forumByKey.get(fKey);
            if (!f) continue;
            for (const slug of item.tags) {
                const t = topicBySlug.get(slug);
                if (t) addSpaceTag(f.spaceKey, t);
            }
        }
    }
    for (const era of Object.values(ERA_NARRATIVES)) {
        for (const th of era.themes) {
            for (const f of forums) {
                for (const slug of th.tags) {
                    const t = topicBySlug.get(slug);
                    if (t) addSpaceTag(f.spaceKey, t);
                }
            }
        }
    }

    // Helper: pick eligible actors for a space on a given date
    const eligibleActorsForSpace = (spaceKey, onDate) => {
        const seatInfo = seatsBySpaceKey.get(spaceKey);
        if (!seatInfo) return [];
        return actors.filter(
            (a) =>
                seatInfo.activeUserIds.has(a.userId) &&
                a.activeFrom <= onDate &&
                a.activeThrough >= onDate,
        );
    };

    // 3. ForumMembers (explicit role overrides & moderators across all 29 forums)
    const forumMembers = [];
    const forumMemberRoleByKey = new Map(); // `${forumId}:${userId}` -> roleCode
    const addForumMember = (forum, actor, roleCode) => {
        if (!forum || !actor) return;
        const mapKey = `${forum.fields.ID}:${actor.userId}`;
        if (forumMemberRoleByKey.has(mapKey)) return;
        const roleDef = roleTypeByCode[roleCode];
        if (!roleDef) throw new Error(`Unknown roleCode ${roleCode}`);
        forumMemberRoleByKey.set(mapKey, roleCode);
        forumMembers.push({
            forumKey: forum.key,
            userEmail: actor.email,
            roleCode,
            createdAt: `${forum.startedAt}T00:00:00Z`,
            fields: {
                ID: id(`forum-member:${forum.key}:${actor.userId}`),
                ForumID: forum.fields.ID,
                UserID: actor.userId,
                ForumRoleTypeID: up(roleDef.id),
                Status: 'Active',
            },
        });
    };

    for (const forum of forums) {
        const space = spaceByKey.get(forum.spaceKey);
        const seatInfo = seatsBySpaceKey.get(forum.spaceKey);
        // Space owner + admins get forum-admin or moderator
        const ownerActor = actorByUserId.get(space.ownerUserId);
        if (ownerActor) addForumMember(forum, ownerActor, 'forum-admin');
        for (const adminUid of seatInfo?.adminUserIds ?? []) {
            const adminActor = actorByUserId.get(adminUid);
            if (adminActor) addForumMember(forum, adminActor, 'moderator');
        }
        // Always ensure Gwen Whitfield (HERO-ICF-008, joined 2014) & Elena (HERO-ICF-001) & Henri (HERO-ICF-007) sit appropriately
        if (forum.spaceKey === 'icf-member-commons' || forum.spaceKey === 'committee-food-safety') {
            addForumMember(forum, actorByHeroKey.get('HERO-ICF-008'), 'forum-admin');
        }
        if (forum.spaceKey === 'icf-member-commons' || forum.spaceKey === 'chapter-california') {
            addForumMember(forum, actorByHeroKey.get('HERO-ICF-001'), 'forum-admin');
        }
        if (forum.spaceKey === 'icf-member-commons' || forum.spaceKey === 'chapter-france' || forum.spaceKey === 'committee-awards-and-competition') {
            addForumMember(forum, actorByHeroKey.get('HERO-ICF-007'), 'moderator');
        }
        if (forum.spaceKey === 'icf-member-commons' || forum.spaceKey === 'committee-education' || forum.spaceKey === 'committee-awards-and-competition') {
            addForumMember(forum, actorByHeroKey.get('HERO-ICF-011'), 'moderator');
        }
        if (forum.spaceKey === 'icf-member-commons' || forum.spaceKey === 'committee-food-safety') {
            addForumMember(forum, actorByHeroKey.get('HERO-ICF-009'), 'topic-host');
        }
        // Guarantee at least 2 early-tenure moderators (active by forum.startedAt) in every forum for historical verification
        const spaceActivePool = actors.filter((a) => seatInfo?.activeUserIds.has(a.userId));
        const earliestPool = [...spaceActivePool].sort(
            (a, b) => (a.activeFrom < b.activeFrom ? -1 : a.activeFrom > b.activeFrom ? 1 : tie(a.userId) < tie(b.userId) ? -1 : 1),
        );
        for (const earlyMod of earliestPool.slice(0, 2)) {
            addForumMember(forum, earlyMod, 'moderator');
        }
        // Seat a deterministic sample of active space members as expert-reviewers / contributors
        const rankedSpacePool = [...spaceActivePool].sort(
            (a, b) => b.theta - a.theta || (tie(a.userId) < tie(b.userId) ? -1 : 1),
        );
        for (const a of rankedSpacePool.slice(0, 10)) {
            const role = a.canonReviewer || a.theta > 1.35 ? 'expert-reviewer' : 'contributor';
            addForumMember(forum, a, role);
        }
    }

    const fallbackForumAdminActor = (forum, onDate) => {
        const pool = eligibleActorsForSpace(forum.spaceKey, onDate);
        const mod = pool.find((a) => {
            const rc = forumMemberRoleByKey.get(`${forum.fields.ID}:${a.userId}`);
            return rc === 'forum-admin' || rc === 'moderator';
        });
        if (mod) return mod;
        return pool[0] ?? null;
    };

    // 4. CommunityMemberProfiles (>= 260 profiles, created deterministically from active members)
    const profileMap = new Map(); // `${spaceKey}:${userId}` -> profileObj
    const digestChoices = ['Daily Digest', 'Weekly Digest', 'Highlights Only', 'Every Post'];
    const ensureProfile = (spaceKey, actor, createdAtOverride = null) => {
        const mapKey = `${spaceKey}:${actor.userId}`;
        if (profileMap.has(mapKey)) return profileMap.get(mapKey);
        const space = spaceByKey.get(spaceKey);
        const spaceTags = topicTags.filter((t) => t.spaceKey === spaceKey);
        const pickedTags = [];
        for (let k = 0; k < Math.min(4, spaceTags.length); k++) {
            const idx = Math.floor(draw(`prof-tag:${mapKey}:${k}`) * spaceTags.length);
            const slug = spaceTags[idx].fields.Slug;
            if (!pickedTags.includes(slug)) pickedTags.push(slug);
        }
        const bioBase =
            actor.bio ??
            `${actor.title} (${actor.segment}) in ${actor.city}, ${actor.state}. Active ICF community member since ${actor.joinDate.slice(0, 4)}.`;
        const cadence = pickOne(`cadence:${mapKey}`, digestChoices);
        const mentoring = actor.canonReviewer || actor.theta > 0.75 || draw(`mentor:${mapKey}`) > 0.58;
        const createdIso = createdAtOverride ?? `${actor.activeFrom > space.startedAt ? actor.activeFrom : space.startedAt}T09:00:00Z`;
        const obj = {
            spaceKey,
            userEmail: actor.email,
            heroKey: actor.heroKey,
            createdAt: createdIso,
            helpfulCount: 0,
            acceptedCount: 0,
            postCount: 0,
            reactionsReceived: 0,
            fields: {
                ID: id(`member-profile:${spaceKey}:${actor.userId}`),
                SpaceID: space.id,
                UserID: actor.userId,
                PersonID: actor.personId,
                BioMarkdown: bioBase.slice(0, 1000),
                ExpertiseTagsJSON: JSON.stringify(pickedTags),
                HelpfulAnswerCount: 0,
                AcceptedAnswerCount: 0,
                ReputationScore: 10 + Math.round(Math.max(0, actor.theta) * 15),
                DigestCadence: cadence,
                OpenToPeerMentoring: Boolean(mentoring),
            },
        };
        profileMap.set(mapKey, obj);
        return obj;
    };

    // Pre-seed rich CommunityMemberProfiles for active heroes & >=300 real active ICF members in icf-member-commons + chapter/guild seats
    for (const heroActor of actorByHeroKey.values()) {
        if (heroActor.activeFrom <= asOf) {
            ensureProfile('icf-member-commons', heroActor);
        }
    }
    const commonsRosterSorted = [...actors]
        .filter((a) => a.activeFrom <= asOf)
        .sort((a, b) => b.theta - a.theta || (tie(a.userId) < tie(b.userId) ? -1 : 1));
    for (const a of commonsRosterSorted.slice(0, 320)) {
        ensureProfile('icf-member-commons', a);
    }
    for (const cs of communitySpaces) {
        if (cs.key === 'icf-member-commons') continue;
        const seatInfo = seatsBySpaceKey.get(cs.key);
        for (const uid of seatInfo?.activeUserIds ?? []) {
            const a = actorByUserId.get(uid);
            if (a && a.activeFrom <= asOf) {
                ensureProfile(cs.key, a);
            }
        }
    }

    // 5. Chronological month-by-month simulation (append-only by cycle!)
    const posts = [];
    const questionPosts = [];
    const answerPosts = [];
    const ideaPosts = [];
    const ideaAllocations = [];
    const casePosts = [];
    const amaPosts = [];
    const artifactPosts = [];
    const postTags = [];
    const reactions = [];
    const subscriptions = [];

    const postTagDedup = new Set();
    const reactionDedup = new Set();
    const subscriptionDedup = new Set();
    const allocatedByCampaignUser = new Map(); // `${campaignKey}:${userId}` -> pointsUsed
    const allocatedPairSet = new Set(); // `${ideaPostId}:${userId}`
    const ideaPostBySlug = new Map();
    const postedIdeaSlugs = new Set();

    const eraForYear = (year) => {
        const eras = rules.eraMultipliers?.eras ?? [];
        return eras.find((e) => (e.cycles ?? []).includes(year)) ?? eras[eras.length - 1];
    };

    const pickWeightedActor = (pool, seedKey, roleHint = 'post', preferredSpaceKey = null, preferredForumType = null) => {
        if (!pool.length) return null;
        const weightsCfg = rules.engagementDialWeights ?? {};
        const beta =
            roleHint === 'answer'
                ? weightsCfg.helpfulAnswerBeta
                : roleHint === 'reply'
                  ? weightsCfg.replyBeta
                  : roleHint === 'reaction'
                    ? weightsCfg.reactionBeta
                    : roleHint === 'allocation'
                      ? weightsCfg.ideationAllocationBeta
                      : weightsCfg.rootPostBeta;
        const bT = beta?.theta ?? 0.7;
        const bP = beta?.phi ?? 0.2;

        // Deterministic tournament draw over up to 16 candidates so O(1) per pick and well-spread across members
        const sampleSize = Math.min(pool.length, 16);
        let best = pool[0];
        let bestScore = -Infinity;
        for (let k = 0; k < sampleSize; k++) {
            const idx = Math.floor(draw(`${seedKey}:cand:${k}`) * pool.length);
            const a = pool[idx];
            let s = bT * a.theta + bP * a.phi + Math.log(Math.max(0.05, a.activityWeight));
            if (preferredSpaceKey && a.heroRule?.preferredSpaces?.includes(preferredSpaceKey)) s += 1.4;
            if (preferredForumType && a.heroRule?.preferredForumTypes?.includes(preferredForumType)) s += 0.9;
            if (roleHint === 'answer' && a.canonReviewer) s += 1.5;
            s += draw(`${seedKey}:jitter:${a.userId}`) * 1.6;
            if (s > bestScore) {
                bestScore = s;
                best = a;
            }
        }
        return best;
    };

    const addTagToPost = (postId, spaceKey, tagSlug, cycle, assignedByAI = false) => {
        const tag = tagBySpaceAndSlug.get(`${spaceKey}:${tagSlug}`);
        if (!tag) return;
        const dedupKey = `${postId}:${tag.fields.ID}`;
        if (postTagDedup.has(dedupKey)) return;
        postTagDedup.add(dedupKey);
        tag.fields.PostCount += 1;
        postTags.push({
            cycle,
            spaceKey,
            tagSlug,
            fields: {
                ID: id(`post-tag:${postId}:${tag.fields.ID}`),
                PostID: postId,
                TopicTagID: tag.fields.ID,
                AssignedByAI: Boolean(assignedByAI),
            },
        });
    };

    const reactionKinds = rules.monthlyCadence?.reactionsPerPost?.allowedKinds ?? [
        'Upvote',
        'Helpful',
        'Insightful',
        'Agree',
        'Celebrate',
        'Curious',
    ];

    const addReactionsForPost = (postObj, forum, cycle, targetCount, maxIso) => {
        const postDate = postObj.createdAt.slice(0, 10);
        const pool = eligibleActorsForSpace(forum.spaceKey, postDate).filter(
            (a) => a.userId !== postObj.fields.AuthorUserID && (!a.heroRule || a.heroRule.roleCode !== 'observer'),
        );
        if (!pool.length) return;
        let added = 0;
        let scoreSum = 0;
        for (let i = 0; i < targetCount * 2 && added < targetCount; i++) {
            const reactor = pickWeightedActor(pool, `react:${postObj.key}:${i}`, 'reaction');
            if (!reactor) break;
            const kind = pickOne(`rkind:${postObj.key}:${reactor.userId}:${i}`, reactionKinds);
            const dedupKey = `${postObj.fields.ID}:${reactor.userId}:${kind}`;
            if (reactionDedup.has(dedupKey)) continue;
            reactionDedup.add(dedupKey);
            const roleCode = forumMemberRoleByKey.get(`${forum.fields.ID}:${reactor.userId}`) ?? 'contributor';
            const weight = roleCode === 'expert-reviewer' ? 1.25 : 1.0;
            const rAt = addMinutesClamped(postObj.createdAt, 15 + Math.floor(draw(`rt:${dedupKey}`) * 4320), maxIso);
            if (reactor.activeFrom > rAt.slice(0, 10) || reactor.activeThrough < rAt.slice(0, 10)) continue;
            reactions.push({
                cycle,
                userEmail: reactor.email,
                createdAt: rAt,
                fields: {
                    ID: id(`reaction:${postObj.fields.ID}:${reactor.userId}:${kind}`),
                    PostID: postObj.fields.ID,
                    UserID: reactor.userId,
                    ReactionKind: kind,
                    Weight: weight,
                },
            });
            added += 1;
            scoreSum += weight;
        }
        postObj.fields.ReactionScore = Math.round(scoreSum);
        const authorActor = actorByUserId.get(postObj.fields.AuthorUserID);
        if (authorActor) {
            const prof = ensureProfile(forum.spaceKey, authorActor, postObj.createdAt);
            prof.reactionsReceived += Math.round(scoreSum);
        }
    };

    const synthesisByType = rules.synthesisThreshold?.byForumType ?? {};
    const defaultSynthThreshold = rules.synthesisThreshold?.defaultThreshold ?? 4;

    const finalizeRootSynthesis = (rootPostObj, replies, forum) => {
        const threshold = synthesisByType[forum.forumTypeCode] ?? defaultSynthThreshold;
        const replyCount = replies.length;
        const participants = new Set([rootPostObj.fields.AuthorUserID, ...replies.map((r) => r.fields.AuthorUserID)]);
        rootPostObj.fields.ReplyCount = replyCount;
        rootPostObj.fields.ParticipantCount = participants.size;
        const lastActivity = replies.length ? replies[replies.length - 1].createdAt : rootPostObj.createdAt;
        rootPostObj.fields.LastActivityAt = lastActivity;
        rootPostObj.fields.ViewCount = 18 + replyCount * 11 + rootPostObj.fields.ReactionScore * 4 + pickInt(`views:${rootPostObj.key}`, 4, 42);

        if (replyCount >= threshold) {
            rootPostObj.fields.SummaryMarkdown =
                `**Living Thread Synthesis (${replyCount} replies, ${participants.size} participants)**\n\n` +
                `- **Key Consensus:** Members aligned on practical make-room and cave benchmarks documented in this thread, emphasizing verifiable pH/moisture logs over ad-hoc adjustments.\n` +
                `- **Open Questions:** Regional adaptation across seasonal spring-to-autumn milk solids remains under peer validation.\n` +
                `- **Actionable Takeaways:** Apply the recommended process thresholds in your next batch log and tag follow-up outcomes for the ${forum.fields.Name} archive.`;
            rootPostObj.fields.SummaryGeneratedAt = addMinutesClamped(lastActivity, 20, `${monthEnd(rootPostObj.cycle)}T23:59:00Z`);
            rootPostObj.fields.SummaryReplyWatermark = replyCount;
        }
    };

    const createRootThread = ({
        cycle,
        forum,
        postTypeCode,
        title,
        bodyMarkdown,
        authorActor,
        createdAt,
        tagSlugs,
        replySpecs,
        isPinned = false,
        isFeatured = false,
        status = 'Published',
        qaMeta = null,
        caseMeta = null,
        amaMeta = null,
        artifactMeta = null,
        ideaMeta = null,
    }) => {
        const space = spaceByKey.get(forum.spaceKey);
        const postType = postTypeByCode[postTypeCode];
        if (!postType) throw new Error(`Unknown postTypeCode ${postTypeCode}`);
        const rootKey = `post:root:${cycle}:${forum.key}:${slugify(title)}:${posts.length}`;
        const rootId = id(`post:${cycle}:${forum.key}:${slugify(title)}:${posts.filter((p) => p.cycle === cycle && p.forumKey === forum.key && p.fields.RootPostID === null).length}`);
        const slug = `${slugify(title)}-${rootId.slice(0, 8).toLowerCase()}`;
        const maxIso = `${monthEnd(cycle)}T23:55:00Z`;

        const authorProf = ensureProfile(forum.spaceKey, authorActor, createdAt);
        authorProf.postCount += 1;

        const rootObj = {
            key: rootKey,
            cycle,
            forumKey: forum.key,
            spaceKey: forum.spaceKey,
            postTypeCode,
            authorEmail: authorActor.email,
            createdAt,
            fields: {
                ID: rootId,
                ForumID: forum.fields.ID,
                PostTypeID: up(postType.id),
                RootPostID: null,
                ParentPostID: null,
                ReplyDepth: 0,
                AuthorUserID: authorActor.userId,
                AuthorPersonID: authorActor.personId,
                AuthorAgentID: null,
                Title: title.slice(0, 300),
                Slug: slug.slice(0, 320),
                BodyMarkdown: bodyMarkdown,
                SummaryMarkdown: null,
                SummaryGeneratedAt: null,
                SummaryReplyWatermark: 0,
                VisibilityBand: 'Shared',
                Status: status,
                IsPinned: Boolean(isPinned),
                IsLocked: false,
                IsFeatured: Boolean(isFeatured),
                ReplyCount: 0,
                ParticipantCount: 1,
                ReactionScore: 0,
                ViewCount: 0,
                LastActivityAt: createdAt,
                PromotedToSpaceID: null,
                LinkedTaskID: null,
                LinkedEntityID: null,
                LinkedRecordID: null,
                ConversationID: null,
            },
        };
        posts.push(rootObj);

        // Attach tags (2-4 per root post, strictly in the same SpaceID)
        const availTags = topicTags.filter((t) => t.spaceKey === forum.spaceKey);
        for (const s of tagSlugs) addTagToPost(rootId, forum.spaceKey, s, cycle, false);
        const minTags = rules.monthlyCadence?.tagsPerRootPost?.min ?? 2;
        for (let ti = 0; ti < minTags && postTags.filter((pt) => pt.fields.PostID === rootId).length < minTags && availTags.length; ti++) {
            const extraTag = pickOne(`extra-tag:${rootId}:${ti}`, availTags);
            addTagToPost(rootId, forum.spaceKey, extraTag.fields.Slug, cycle, ti > 0);
        }

        // Root reactions
        const rootReactTarget = pickInt(`rreact:${rootId}`, 2, 7);
        addReactionsForPost(rootObj, forum, cycle, rootReactTarget, maxIso);

        // Replies
        const threadReplies = [];
        let acceptedAnswerId = null;
        let aiCanonAnswerId = null;
        let resolvedAt = null;
        let prevTime = createdAt;

        for (let ri = 0; ri < replySpecs.length; ri++) {
            const spec = replySpecs[ri];
            const rTime = addMinutesClamped(prevTime, 45 + pickInt(`rdelay:${rootId}:${ri}`, 30, 720), maxIso);
            prevTime = rTime;
            const rDate = rTime.slice(0, 10);
            const rPool = eligibleActorsForSpace(forum.spaceKey, rDate).filter(
                (a) =>
                    (!a.heroRule || a.heroRule.roleCode !== 'observer') &&
                    (spec.allowSameAuthor || a.userId !== authorActor.userId),
            );
            const replyAuthor =
                spec.authorActor && spec.authorActor.activeFrom <= rDate && spec.authorActor.activeThrough >= rDate
                    ? spec.authorActor
                    : pickWeightedActor(
                          rPool.length ? rPool : eligibleActorsForSpace(forum.spaceKey, rDate),
                          `reply-auth:${rootId}:${ri}`,
                          spec.postTypeCode === 'answer' ? 'answer' : 'reply',
                          forum.spaceKey,
                          forum.forumTypeCode,
                      );
            if (!replyAuthor) continue;
            ensureProfile(forum.spaceKey, replyAuthor, rTime).postCount += 1;

            const rTypeCode = spec.postTypeCode;
            const rPostType = postTypeByCode[rTypeCode];
            const parentObj = spec.parentReplyIdx != null && threadReplies[spec.parentReplyIdx] ? threadReplies[spec.parentReplyIdx] : rootObj;
            const depth = parentObj.fields.ReplyDepth + 1;
            const rId = id(`reply:${rootId}:${ri}`);

            const replyObj = {
                key: `${rootKey}:r${ri}`,
                cycle,
                forumKey: forum.key,
                spaceKey: forum.spaceKey,
                postTypeCode: rTypeCode,
                authorEmail: replyAuthor.email,
                createdAt: rTime,
                fields: {
                    ID: rId,
                    ForumID: forum.fields.ID,
                    PostTypeID: up(rPostType.id),
                    RootPostID: rootId,
                    ParentPostID: parentObj.fields.ID,
                    ReplyDepth: depth,
                    AuthorUserID: replyAuthor.userId,
                    AuthorPersonID: replyAuthor.personId,
                    AuthorAgentID: null,
                    Title: null,
                    Slug: null,
                    BodyMarkdown: spec.body,
                    SummaryMarkdown: null,
                    SummaryGeneratedAt: null,
                    SummaryReplyWatermark: 0,
                    VisibilityBand: 'Shared',
                    Status: 'Published',
                    IsPinned: false,
                    IsLocked: false,
                    IsFeatured: false,
                    ReplyCount: 0,
                    ParticipantCount: 1,
                    ReactionScore: 0,
                    ViewCount: 0,
                    LastActivityAt: rTime,
                    PromotedToSpaceID: null,
                    LinkedTaskID: null,
                    LinkedEntityID: null,
                    LinkedRecordID: null,
                    ConversationID: null,
                },
            };
            posts.push(replyObj);
            threadReplies.push(replyObj);

            const rReactCount = pickInt(`rreact-reply:${rId}`, 1, 3);
            addReactionsForPost(replyObj, forum, cycle, rReactCount, maxIso);

            if (rTypeCode === 'answer') {
                const isBest = Boolean(spec.isBestAnswer);
                const verifier = fallbackForumAdminActor(forum, rDate);
                const verifierRole = verifier ? forumMemberRoleByKey.get(`${forum.fields.ID}:${verifier.userId}`) : null;
                const isCanon = isBest && Boolean(verifier) && (verifierRole === 'forum-admin' || verifierRole === 'moderator');
                const epistemicStatus = isCanon
                    ? cycle <= '2021-12' && draw(`stale:${rId}`) < 0.22
                        ? 'Partially Outdated'
                        : 'Canon Verified'
                    : 'Novel Insight';
                const verifiedAt = isCanon ? addMinutesClamped(rTime, 180, maxIso) : null;
                const freshnessDue = isCanon ? `${plusMonths(rDate, 12)}T00:00:00Z` : null;

                answerPosts.push({
                    cycle,
                    forumKey: forum.key,
                    verifiedByEmail: isCanon ? verifier.email : null,
                    fields: {
                        ID: rId,
                        QuestionPostID: rootId,
                        IsAcceptedByAuthor: isBest,
                        IsVerifiedByModerator: isCanon,
                        VerifiedByUserID: isCanon ? verifier.userId : null,
                        VerifiedAt: verifiedAt,
                        AIEpistemicStatus: epistemicStatus,
                        AIConfidenceScore: isCanon ? Number((0.88 + draw(`conf:${rId}`) * 0.11).toFixed(3)) : Number((0.72 + draw(`conf:${rId}`) * 0.14).toFixed(3)),
                        AIRationaleMarkdown: spec.rationale ?? `Verified peer technical answer aligned with ${forum.fields.Name} standards.`,
                        FreshnessReviewDueAt: freshnessDue,
                    },
                });
                const rProf = ensureProfile(forum.spaceKey, replyAuthor, rTime);
                if (isBest) {
                    acceptedAnswerId = rId;
                    resolvedAt = verifiedAt ?? rTime;
                    rProf.acceptedCount += 1;
                }
                if (isBest || isCanon) {
                    aiCanonAnswerId = rId;
                    rProf.helpfulCount += 1;
                }
            }
        }

        if (qaMeta) {
            if (acceptedAnswerId) rootObj.fields.Status = 'Answered';
            questionPosts.push({
                cycle,
                forumKey: forum.key,
                fields: {
                    ID: rootId,
                    AcceptedAnswerPostID: acceptedAnswerId,
                    AICanonAnswerPostID: aiCanonAnswerId,
                    BountyPoints: qaMeta.bountyPoints ?? 0,
                    ResolvedAt: resolvedAt,
                    DeflectionCount: qaMeta.deflectionCount ?? pickInt(`defl:${rootId}`, 1, 14),
                },
            });
        }
        if (caseMeta) {
            const moderator = fallbackForumAdminActor(forum, createdAt.slice(0, 10));
            casePosts.push({
                cycle,
                forumKey: forum.key,
                fields: {
                    ID: rootId,
                    SituationMarkdown: caseMeta.situation,
                    ActionTakenMarkdown: caseMeta.action,
                    OutcomeMarkdown: caseMeta.outcome,
                    IsAnonymized: Boolean(caseMeta.anonymized),
                    AnonymizedAuthorAlias: caseMeta.anonymized ? `ICF-Case-${cycle.replace('-', '')}-${casePosts.length + 1}` : null,
                    RedactionConfirmedByUserID: caseMeta.anonymized && moderator ? moderator.userId : null,
                },
            });
        }
        if (amaMeta) {
            const startAt = createdAt;
            const endAt = addMinutesClamped(startAt, 90, maxIso);
            const openAt = addMinutesClamped(startAt, -1440, startAt);
            amaPosts.push({
                cycle,
                forumKey: forum.key,
                hostEmail: amaMeta.hostActor.email,
                fields: {
                    ID: rootId,
                    HostUserID: amaMeta.hostActor.userId,
                    ScheduledStartAt: startAt,
                    ScheduledEndAt: endAt,
                    QuestionsOpenAt: openAt,
                    IsLiveNow: false,
                    RecordingURL: `https://community.morecheese.example/recordings/${slug}`,
                    RecapMarkdown: amaMeta.recap,
                },
            });
        }
        if (artifactMeta) {
            const artId = id(`artifact:${rootId}`);
            const verId = id(`artifact-version:${rootId}:v1`);
            const siId = id(`space-item:${rootId}`);
            artifactPosts.push({
                cycle,
                forumKey: forum.key,
                spaceKey: forum.spaceKey,
                artifactName: title,
                artifactType: artifactMeta.modality,
                artifactContent: bodyMarkdown,
                fields: {
                    ID: rootId,
                    ArtifactID: artId,
                    PinnedArtifactVersionID: verId,
                    SpaceItemID: siId,
                    ArtifactModality: artifactMeta.modality,
                    CollaborationMode: 'Suggest',
                    ShowInlinePreview: true,
                },
            });
        }
        if (ideaMeta) {
            const ideaObj = {
                cycle,
                campaignKey: ideaMeta.campaign.campaignKey,
                forumKey: forum.key,
                slug: ideaMeta.slug,
                fields: {
                    ID: rootId,
                    IdeaStatus: ideaMeta.ideaStatus,
                    TotalPointsAllocated: 0,
                    EffectiveQuadraticVotes: 0,
                    UniqueBackerCount: 0,
                    TargetReleaseOrQuarter: ideaMeta.targetReleaseOrQuarter,
                    StatusRationaleMarkdown: `Prioritized in ${ideaMeta.campaign.title} (${ideaMeta.ideaStatus}).`,
                    MergedIntoIdeaPostID: null,
                },
            };
            ideaPosts.push(ideaObj);
            ideaPostBySlug.set(`${ideaMeta.campaign.campaignKey}:${ideaMeta.slug}`, ideaObj);
            postedIdeaSlugs.add(`${ideaMeta.campaign.campaignKey}:${ideaMeta.slug}`);
        }

        finalizeRootSynthesis(rootObj, threadReplies, forum);
        return rootObj;
    };

    // Iterate chronologically month-by-month across ALL cycles (2019-01 .. throughMonth)
    const activeForumsAt = (ym) => forums.filter((f) => f.startedAt.slice(0, 7) <= ym);

    const REPLY_SNIPPETS_DISCUSSION = [
        'Verified this in our make-room last week—logging temperature at both cut and drain made the trend unmistakable.',
        'Great data point. We adjusted our evening cave dampers by 4% RH and saw immediate improvement in rind suppleness.',
        'Agree with the approach above; happy to compare batch numbers at the next regional meetup.',
        'Adding our lab sheet summary: keeping whey TA at drain within 0.02% tightened week-4 paste consistency.',
        'Thanks for documenting the exact parameters rather than general rules of thumb—huge help for newer crews.',
        'Seconding this recommendation; we saw shrink drop meaningfully once air velocity stayed laminar across top racks.',
    ];
    const COMMENT_SNIPPETS = [
        'Quick clarification: was that measured before or after salting?',
        'Confirmed—we logged those readings immediately post-brine at 11.5°C.',
        'Noted! Cross-linking this into our seasonal binder.',
    ];

    for (const ym of cycles) {
        const year = Number(ym.slice(0, 4));
        const monthStr = ym.slice(5, 7);
        const era = eraForYear(year);
        const eraMult = rules.eraMultipliers?.byYear?.[String(year)] ?? rules.eraMultipliers?.defaultPost2026Multiplier ?? 1.3;
        const seasonMult = rules.monthlyCadence?.seasonalMultipliers?.[monthStr] ?? 1.0;
        const baseRoots = rules.monthlyCadence?.baseRootPostsPerMonth ?? 2;

        // Determine root thread count for this month (>= 2 always, typically 2-4, totaling ~250+ across 94 months)
        const targetRoots = Math.max(2, Math.min(5, Math.round(baseRoots * eraMult * seasonMult)));
        const openForums = activeForumsAt(ym);

        // 1) Publish any Ideation Campaign seed ideas whose campaign opened on or before this month
        for (const camp of forumIdeaCampaigns) {
            if (camp.opensAt.slice(0, 7) > ym) continue;
            const campForum = forumByKey.get(camp.forumKey);
            for (let si = 0; si < camp.seedIdeas.length; si++) {
                const seedIdea = camp.seedIdeas[si];
                const fullKey = `${camp.campaignKey}:${seedIdea.slug}`;
                if (postedIdeaSlugs.has(fullKey)) continue;
                // Spread idea submissions across the first 2 months after campaign opens
                const openYm = camp.opensAt.slice(0, 7);
                const targetYm = si < 2 ? openYm : nextMonth(openYm);
                if (ym < targetYm) continue;

                const postIso = clampIsoToMonthEnd(makeIsoInMonth(ym, 5 + si * 5, 11 + si, 15), ym);
                const postDate = postIso.slice(0, 10);
                const pool = eligibleActorsForSpace(campForum.spaceKey, postDate).filter(
                    (a) => !a.heroRule || a.heroRule.roleCode !== 'observer',
                );
                const author = pickWeightedActor(pool, `idea-auth:${fullKey}`, 'post', campForum.spaceKey, 'ideation-campaign');
                if (!author) continue;

                createRootThread({
                    cycle: ym,
                    forum: campForum,
                    postTypeCode: 'idea-proposal',
                    title: seedIdea.title,
                    bodyMarkdown:
                        `### Proposal Summary\n${seedIdea.title} — scoped for **${seedIdea.targetReleaseOrQuarter}** under the **${camp.title}** campaign.\n\n` +
                        `### Member Impact\nDirectly addresses federation priorities across ${seedIdea.tags.join(', ')}. Allocate 100-point quadratic wallet votes and share implementation feedback below.`,
                    authorActor: author,
                    createdAt: postIso,
                    tagSlugs: seedIdea.tags ?? [],
                    isPinned: si === 0,
                    isFeatured: si < 2,
                    replySpecs: [0, 1, 2, 3].map((ri) => ({
                        postTypeCode: 'reply',
                        body: `Strong support for **${seedIdea.title}**—backing with quadratic wallet points so ${seedIdea.targetReleaseOrQuarter} stays on schedule. ${REPLY_SNIPPETS_DISCUSSION[(si + ri) % REPLY_SNIPPETS_DISCUSSION.length]}`,
                    })),
                    ideaMeta: {
                        campaign: camp,
                        slug: seedIdea.slug,
                        ideaStatus: seedIdea.ideaStatus,
                        targetReleaseOrQuarter: seedIdea.targetReleaseOrQuarter,
                    },
                });
            }
        }

        // 2) Generate this month's regular root threads across diverse ForumTypes & Spaces
        const nonIdeationForums = openForums.filter((f) => f.forumTypeCode !== 'ideation-campaign');
        for (let rIdx = 0; rIdx < targetRoots; rIdx++) {
            // Ensure strong Q&A Canon volume (>=40 Q&As across 94 months) + discussions, case rounds, playbooks, AMAs
            const slotMod = (cycles.indexOf(ym) * 3 + rIdx) % 10;
            let desiredTypeCode;
            if (slotMod === 0 || slotMod === 3 || slotMod === 6) desiredTypeCode = 'qa-knowledge-base';
            else if (slotMod === 1 || slotMod === 4 || slotMod === 8) desiredTypeCode = 'general-discussion';
            else if (slotMod === 2) desiredTypeCode = 'peer-case-rounds';
            else if (slotMod === 5) desiredTypeCode = 'playbooks-and-docs';
            else desiredTypeCode = 'live-events-and-amas';

            let candidateForums = nonIdeationForums.filter((f) => f.forumTypeCode === desiredTypeCode);
            if (!candidateForums.length) {
                candidateForums = nonIdeationForums.filter((f) => f.forumTypeCode === 'qa-knowledge-base' || f.forumTypeCode === 'general-discussion');
            }
            const forum = candidateForums[Math.floor(draw(`forum-pick:${ym}:${rIdx}`) * candidateForums.length)];
            const dayNum = Math.min(daysInMonth(ym), 2 + rIdx * 7 + pickInt(`day:${ym}:${rIdx}`, 0, 5));
            const postIso = makeIsoInMonth(ym, dayNum, 9 + ((rIdx * 3) % 9), pickInt(`min:${ym}:${rIdx}`, 0, 55));
            const postDate = postIso.slice(0, 10);

            const isModerated = forum.fields.PostingPolicy === 'Moderated';
            let pool = eligibleActorsForSpace(forum.spaceKey, postDate).filter(
                (a) => !a.heroRule || a.heroRule.roleCode !== 'observer',
            );
            if (isModerated) {
                const modPool = pool.filter((a) => {
                    const rc = forumMemberRoleByKey.get(`${forum.fields.ID}:${a.userId}`);
                    return rc === 'forum-admin' || rc === 'moderator';
                });
                if (modPool.length) pool = modPool;
            }
            const author = pickWeightedActor(pool, `root-auth:${ym}:${rIdx}`, 'post', forum.spaceKey, forum.forumTypeCode);
            if (!author) continue;

            const replyCount = pickInt(`rcnt:${ym}:${rIdx}`, 2, 5);

            if (forum.forumTypeCode === 'qa-knowledge-base') {
                const matchingQa = QA_CATALOG.filter((q) => q.forums.includes(forum.key));
                const qa = matchingQa.length
                    ? matchingQa[(cycles.indexOf(ym) + rIdx) % matchingQa.length]
                    : QA_CATALOG[(cycles.indexOf(ym) + rIdx) % QA_CATALOG.length];
                const titleSuffix = cycles.indexOf(ym) < QA_CATALOG.length ? '' : ` (${ym} batch check)`;
                const qTitle = `${qa.qTitle}${titleSuffix}`;
                const qBody = `${qa.qBody}\n\n*Context: ${era.narrativeFocus} (${ym}).*`;
                const replySpecs = [
                    {
                        postTypeCode: 'answer',
                        body: qa.aBody,
                        rationale: qa.rationale,
                        isBestAnswer: true,
                    },
                    {
                        postTypeCode: 'answer',
                        body: `Adding a field note from our ${forum.spaceKey.replace('chapter-', '').replace('committee-', '')} vat runs: verify calibrated thermometer/pH probe buffers weekly when testing this parameter.`,
                        rationale: 'Corroborating operational peer observation.',
                        isBestAnswer: false,
                    },
                ];
                for (let k = 2; k < replyCount; k++) {
                    replySpecs.push({
                        postTypeCode: 'comment',
                        parentReplyIdx: k % 2,
                        body: COMMENT_SNIPPETS[(rIdx + k) % COMMENT_SNIPPETS.length],
                    });
                }
                createRootThread({
                    cycle: ym,
                    forum,
                    postTypeCode: 'question',
                    title: qTitle,
                    bodyMarkdown: qBody,
                    authorActor: author,
                    createdAt: postIso,
                    tagSlugs: qa.tags,
                    replySpecs,
                    isFeatured: rIdx === 0 && Number(monthStr) % 3 === 0,
                    qaMeta: { bountyPoints: rIdx === 0 ? 25 : 0 },
                });
            } else if (forum.forumTypeCode === 'peer-case-rounds') {
                const matchingCase = CASE_CATALOG.filter((c) => c.forums.includes(forum.key));
                const cs = matchingCase.length
                    ? matchingCase[(cycles.indexOf(ym) + rIdx) % matchingCase.length]
                    : CASE_CATALOG[(cycles.indexOf(ym) + rIdx) % CASE_CATALOG.length];
                const title = `${cs.title} — ${ym}`;
                const body = `**Situation:** ${cs.situation}\n\n**Action Taken:** ${cs.action}\n\n**Outcome:** ${cs.outcome}`;
                const replySpecs = Array.from({ length: replyCount }, (_, k) => ({
                    postTypeCode: k === replyCount - 1 ? 'comment' : 'reply',
                    parentReplyIdx: k === replyCount - 1 && k > 0 ? 0 : null,
                    body: REPLY_SNIPPETS_DISCUSSION[(rIdx + k) % REPLY_SNIPPETS_DISCUSSION.length],
                }));
                createRootThread({
                    cycle: ym,
                    forum,
                    postTypeCode: 'case-review',
                    title,
                    bodyMarkdown: body,
                    authorActor: author,
                    createdAt: postIso,
                    tagSlugs: cs.tags,
                    replySpecs,
                    caseMeta: cs,
                });
            } else if (forum.forumTypeCode === 'playbooks-and-docs') {
                const matchingPb = PLAYBOOK_CATALOG.filter((p) => p.forums.includes(forum.key));
                const pb = matchingPb.length
                    ? matchingPb[(cycles.indexOf(ym) + rIdx) % matchingPb.length]
                    : PLAYBOOK_CATALOG[(cycles.indexOf(ym) + rIdx) % PLAYBOOK_CATALOG.length];
                const title = `${pb.title} (${year} Rev ${monthStr})`;
                const body = `${pb.body}\n\n*Maintained in ${forum.fields.Name} (${ym}). Suggest section updates in the thread below.*`;
                const replySpecs = Array.from({ length: replyCount }, (_, k) => ({
                    postTypeCode: k % 3 === 2 ? 'comment' : 'reply',
                    parentReplyIdx: k % 3 === 2 && k > 0 ? k - 1 : null,
                    body: `Reviewed section ${k + 1} of this ${pb.modality.toLowerCase()}—${REPLY_SNIPPETS_DISCUSSION[(rIdx + k) % REPLY_SNIPPETS_DISCUSSION.length]}`,
                }));
                createRootThread({
                    cycle: ym,
                    forum,
                    postTypeCode: pb.postTypeCode,
                    title,
                    bodyMarkdown: body,
                    authorActor: author,
                    createdAt: postIso,
                    tagSlugs: pb.tags,
                    replySpecs,
                    isPinned: year === 2026 && rIdx === 0,
                    artifactMeta: { modality: pb.modality },
                });
            } else if (forum.forumTypeCode === 'live-events-and-amas') {
                const matchingAma = AMA_CATALOG.filter((a) => year >= a.minYear && year <= a.maxYear);
                const ama = matchingAma.length
                    ? matchingAma[(cycles.indexOf(ym) + rIdx) % matchingAma.length]
                    : AMA_CATALOG[(cycles.indexOf(ym) + rIdx) % AMA_CATALOG.length];
                const title = `${ama.title} (${ym})`;
                const body = `${ama.body}\n\n**Host:** ${author.name} (${author.title})\n\n${ama.recap}`;
                const replySpecs = Array.from({ length: replyCount }, (_, k) => ({
                    postTypeCode: 'reply',
                    parentReplyIdx: k % 2 === 1 && k > 0 ? k - 1 : null,
                    body: k % 2 === 0
                        ? `Question for ${author.firstName}: how are smaller creameries adapting this workflow during ${era.yearLabel} seasonal peaks?`
                        : `Great follow-up—start with a two-week baseline log and bring your readings to the next monthly guild check-in.`,
                }));
                createRootThread({
                    cycle: ym,
                    forum,
                    postTypeCode: 'live-ama',
                    title,
                    bodyMarkdown: body,
                    authorActor: author,
                    createdAt: postIso,
                    tagSlugs: ama.tags,
                    replySpecs,
                    amaMeta: { hostActor: author, recap: ama.recap },
                });
            } else {
                const eraThemes = ERA_NARRATIVES[era.eraKey]?.themes ?? ERA_NARRATIVES['era-stabilization-2026'].themes;
                const th = eraThemes[(cycles.indexOf(ym) + rIdx) % eraThemes.length];
                const spaceLabel = spaceByKey.get(forum.spaceKey)?.fields?.Name ?? 'ICF';
                const title = `${th.title} — ${spaceLabel} (${ym})`;
                const body = `${th.body}\n\n*Thread opened in ${forum.fields.Name} (${ym}).*`;
                const replySpecs = Array.from({ length: replyCount }, (_, k) => ({
                    postTypeCode: k === replyCount - 1 && k > 1 ? 'comment' : 'reply',
                    parentReplyIdx: k > 0 && k % 2 === 1 ? 0 : null,
                    body: th.replies[k % th.replies.length] ?? REPLY_SNIPPETS_DISCUSSION[k % REPLY_SNIPPETS_DISCUSSION.length],
                }));
                createRootThread({
                    cycle: ym,
                    forum,
                    postTypeCode: 'discussion',
                    title,
                    bodyMarkdown: body,
                    authorActor: author,
                    createdAt: postIso,
                    tagSlugs: th.tags,
                    replySpecs,
                    isPinned: ym === '2026-10' && rIdx === 0 && forum.key === 'commons-town-square',
                    isFeatured: Number(monthStr) % 4 === 0 && rIdx === 0,
                });
            }
        }

        // 3) Process Ideation Campaign 100-point quadratic allocations for active campaigns in this month
        const allocPatterns = [
            [36, 25, 16, 9],
            [49, 25, 16],
            [25, 25, 16, 4],
            [36, 16, 9],
            [49, 16, 9],
            [25, 16, 9],
            [36, 36],
            [16, 16, 9, 4],
        ];
        const rationales = [
            'High operational leverage for small and mid-sized creameries this season.',
            'Directly reduces compliance and testing overhead for farmstead producers.',
            'Essential investment in next-generation cheesemakers and cave stewards.',
            'Backing this reform so judging and attribution stay fair across regions.',
        ];

        for (const camp of forumIdeaCampaigns) {
            const openYm = camp.opensAt.slice(0, 7);
            const closeYm = camp.fields.VotingClosesAt ? camp.fields.VotingClosesAt.slice(0, 7) : '2099-12';
            if (ym < openYm || ym > closeYm) continue;

            const campIdeas = ideaPosts.filter((ip) => ip.campaignKey === camp.campaignKey);
            if (!campIdeas.length) continue;

            const campForum = forumByKey.get(camp.forumKey);
            const monthEndStr = monthEnd(ym);
            const voterPool = eligibleActorsForSpace(campForum.spaceKey, monthEndStr).filter(
                (a) => !a.heroRule || a.heroRule.roleCode !== 'observer',
            );
            // ~4-6 new voters per open campaign per month => ~240-320 total allocations across 2024-09..2026-10
            const votersThisMonth = Math.min(voterPool.length, ym >= '2025-10' ? 5 : 3);
            let pickedVoters = 0;

            for (let vi = 0; vi < voterPool.length && pickedVoters < votersThisMonth; vi++) {
                const voter = pickWeightedActor(voterPool, `alloc-voter:${camp.campaignKey}:${ym}:${vi}`, 'allocation', campForum.spaceKey, 'ideation-campaign');
                if (!voter) break;
                const budgetKey = `${camp.campaignKey}:${voter.userId}`;
                const usedSoFar = allocatedByCampaignUser.get(budgetKey) ?? 0;
                const budgetLimit = camp.fields.DefaultBudgetPoints ?? 100;
                if (usedSoFar >= budgetLimit) continue;

                const remaining = budgetLimit - usedSoFar;
                const maxPerIdea = camp.fields.MaxPointsPerIdea ?? budgetLimit;
                const pattern = allocPatterns[(cycles.indexOf(ym) + vi) % allocPatterns.length];

                let allocatedAny = false;
                let currentRemaining = remaining;
                for (let pi = 0; pi < campIdeas.length && pi < pattern.length; pi++) {
                    const idea = campIdeas[(vi + pi) % campIdeas.length];
                    const pairKey = `${idea.fields.ID}:${voter.userId}`;
                    if (allocatedPairSet.has(pairKey)) continue;
                    const desiredPts = Math.min(pattern[pi], maxPerIdea, currentRemaining);
                    if (desiredPts <= 0) continue;

                    const allocDate = makeIsoInMonth(ym, Math.min(daysInMonth(ym), 8 + ((vi * 4 + pi) % 20)), 14 + (pi % 6), 10);
                    if (voter.activeFrom > allocDate.slice(0, 10) || voter.activeThrough < allocDate.slice(0, 10)) continue;

                    allocatedPairSet.add(pairKey);
                    currentRemaining -= desiredPts;
                    allocatedByCampaignUser.set(budgetKey, (allocatedByCampaignUser.get(budgetKey) ?? 0) + desiredPts);
                    const qVotes = Number(Math.sqrt(desiredPts).toFixed(2));
                    ensureProfile(campForum.spaceKey, voter, allocDate);

                    ideaAllocations.push({
                        cycle: ym,
                        campaignKey: camp.campaignKey,
                        userEmail: voter.email,
                        createdAt: allocDate,
                        fields: {
                            ID: id(`idea-alloc:${idea.fields.ID}:${voter.userId}`),
                            IdeaPostID: idea.fields.ID,
                            UserID: voter.userId,
                            PointsAllocated: desiredPts,
                            QuadraticVotes: qVotes,
                            RationaleComment: rationales[(vi + pi) % rationales.length],
                        },
                    });
                    allocatedAny = true;
                }
                if (allocatedAny) pickedVoters += 1;
            }
        }

        // 4) Monthly ForumSubscriptions (~5-6 distinct per month => >=480 across 94 months, strictly honoring CK_ForumSubscription_Target)
        const subCountTarget = rules.monthlyCadence?.newSubscriptionsPerMonthBase ?? 5;
        const deliveryLevels = ['Every Post', 'First Post Only', 'Digest Only'];
        const monthRoots = posts.filter((p) => p.cycle === ym && p.fields.RootPostID === null);
        let subsAdded = 0;
        for (let si = 0; si < subCountTarget * 6 && subsAdded < subCountTarget; si++) {
            const subForum = openForums[(cycles.indexOf(ym) * 5 + si) % openForums.length];
            const subIso = makeIsoInMonth(ym, Math.min(daysInMonth(ym), 3 + ((si * 4) % 25)), 10 + (si % 8), 30);
            const subDate = subIso.slice(0, 10);
            const subPool = eligibleActorsForSpace(subForum.spaceKey, subDate);
            const subUser = pickWeightedActor(subPool, `sub:${ym}:${si}`, 'reply', subForum.spaceKey, subForum.forumTypeCode);
            if (!subUser) continue;

            const mode = si % 4;
            if (mode === 0 || mode === 1) {
                const dKey = `forum:${subUser.userId}:${subForum.fields.ID}`;
                if (subscriptionDedup.has(dKey)) continue;
                subscriptionDedup.add(dKey);
                subscriptions.push({
                    cycle: ym,
                    userEmail: subUser.email,
                    createdAt: subIso,
                    fields: {
                        ID: id(`sub:forum:${subForum.fields.ID}:${subUser.userId}`),
                        UserID: subUser.userId,
                        ForumID: subForum.fields.ID,
                        RootPostID: null,
                        TopicTagID: null,
                        DeliveryLevel: pickOne(`sdel:${dKey}`, deliveryLevels),
                    },
                });
                subsAdded += 1;
            } else if (mode === 2 && monthRoots.length > 0) {
                const rootTarget = monthRoots[(cycles.indexOf(ym) + si) % monthRoots.length];
                const rootPool = eligibleActorsForSpace(rootTarget.spaceKey, subDate);
                const rootSubUser = pickWeightedActor(rootPool, `subroot:${ym}:${si}`, 'reply', rootTarget.spaceKey, null);
                if (!rootSubUser) continue;
                const dKey = `root:${rootSubUser.userId}:${rootTarget.fields.ID}`;
                if (subscriptionDedup.has(dKey)) continue;
                subscriptionDedup.add(dKey);
                subscriptions.push({
                    cycle: ym,
                    userEmail: rootSubUser.email,
                    createdAt: subIso,
                    fields: {
                        ID: id(`sub:root:${rootTarget.fields.ID}:${rootSubUser.userId}`),
                        UserID: rootSubUser.userId,
                        ForumID: null,
                        RootPostID: rootTarget.fields.ID,
                        TopicTagID: null,
                        DeliveryLevel: pickOne(`sdel:${dKey}`, deliveryLevels),
                    },
                });
                subsAdded += 1;
            } else {
                const spaceTags = topicTags.filter((t) => t.spaceKey === subForum.spaceKey);
                if (!spaceTags.length) continue;
                const tTag = pickOne(`stag:${ym}:${si}`, spaceTags);
                const dKey = `tag:${subUser.userId}:${tTag.fields.ID}`;
                if (subscriptionDedup.has(dKey)) continue;
                subscriptionDedup.add(dKey);
                subscriptions.push({
                    cycle: ym,
                    userEmail: subUser.email,
                    createdAt: subIso,
                    fields: {
                        ID: id(`sub:tag:${tTag.fields.ID}:${subUser.userId}`),
                        UserID: subUser.userId,
                        ForumID: null,
                        RootPostID: null,
                        TopicTagID: tTag.fields.ID,
                        DeliveryLevel: pickOne(`sdel:${dKey}`, deliveryLevels),
                    },
                });
                subsAdded += 1;
            }
        }
    }

    // Recompute idea totals & profile aggregates
    for (const idea of ideaPosts) {
        const allocs = ideaAllocations.filter((a) => a.fields.IdeaPostID === idea.fields.ID);
        idea.fields.TotalPointsAllocated = allocs.reduce((s, a) => s + a.fields.PointsAllocated, 0);
        idea.fields.EffectiveQuadraticVotes = Number(
            allocs.reduce((s, a) => s + a.fields.QuadraticVotes, 0).toFixed(2),
        );
        idea.fields.UniqueBackerCount = new Set(allocs.map((a) => a.fields.UserID)).size;
    }

    const memberProfiles = [...profileMap.values()]
        .map((p) => {
            p.fields.HelpfulAnswerCount = p.helpfulCount;
            p.fields.AcceptedAnswerCount = p.acceptedCount;
            p.fields.ReputationScore =
                10 + p.postCount * 5 + p.helpfulCount * 20 + p.acceptedCount * 15 + p.reactionsReceived * 2;
            return {
                spaceKey: p.spaceKey,
                userEmail: p.userEmail,
                heroKey: p.heroKey,
                createdAt: p.createdAt,
                fields: p.fields,
            };
        })
        .sort((a, b) => (a.fields.ID < b.fields.ID ? -1 : a.fields.ID > b.fields.ID ? 1 : 0));

    // Compute stats summary
    const rootPosts = posts.filter((p) => p.fields.RootPostID === null);
    const replyPosts = posts.filter((p) => p.fields.RootPostID !== null);
    const postsByYear = {};
    for (const p of posts) {
        const y = p.cycle.slice(0, 4);
        postsByYear[y] = (postsByYear[y] ?? 0) + 1;
    }
    const verifiedCanonAnswers = answerPosts.filter(
        (a) => a.fields.IsVerifiedByModerator && a.fields.AIEpistemicStatus === 'Canon Verified',
    ).length;
    const acceptedAnswers = answerPosts.filter((a) => a.fields.IsAcceptedByAuthor).length;
    const synthesizedThreads = rootPosts.filter((p) => p.fields.SummaryMarkdown != null).length;
    const uniqueTopicSlugs = new Set(topicTags.map((t) => t.fields.Slug)).size;
    const uniqueProfileUsers = new Set(memberProfiles.map((p) => p.fields.UserID)).size;

    const stats = {
        communitySpaces: communitySpaces.length,
        forums: forums.length,
        forumIdeaCampaigns: forumIdeaCampaigns.length,
        forumMembers: forumMembers.length,
        topicTags: topicTags.length,
        uniqueTopicSlugs,
        memberProfiles: memberProfiles.length,
        uniqueProfileUsers,
        totalPosts: posts.length,
        rootPosts: rootPosts.length,
        replyPosts: replyPosts.length,
        qaQuestionPosts: questionPosts.length,
        qaAnswerPosts: answerPosts.length,
        verifiedCanonAnswers,
        acceptedAnswers,
        ideaPosts: ideaPosts.length,
        ideaAllocations: ideaAllocations.length,
        casePosts: casePosts.length,
        amaPosts: amaPosts.length,
        artifactPosts: artifactPosts.length,
        synthesizedThreads,
        reactions: reactions.length,
        postTags: postTags.length,
        subscriptions: subscriptions.length,
        monthsCovered: cycles.length,
        postsByYear,
    };

    return {
        version: 1,
        asOf,
        throughMonth,
        baselineAsOf: rules.monthlyCadence?.baselineAsOf ?? BASELINE_AS_OF,
        generatedBy: 'scripts/build-community-plan.mjs',
        namespace: ns,
        presenter: PRESENTER,
        cycles,
        stats,
        communitySpaces,
        forums,
        forumIdeaCampaigns,
        topicTags,
        forumMembers,
        memberProfiles,
        posts,
        questionPosts,
        answerPosts,
        ideaPosts,
        ideaAllocations,
        casePosts,
        amaPosts,
        artifactPosts,
        postTags,
        reactions,
        subscriptions,
    };
}

export function renderCommunityPlan(plan) {
    return `${JSON.stringify(plan, null, 2)}\n`;
}

// ---------- CLI ----------
export function parseArgs(argv) {
    let check = false;
    let throughMonth = null;
    let out = PLAN_FILE;
    let allowShrink = false;
    const nextVal = (flag, i) => {
        if (i + 1 >= argv.length) throw new Error(`${flag} requires a value`);
        return argv[i + 1];
    };
    for (let i = 0; i < argv.length; i++) {
        const a = argv[i];
        if (a === '--check') check = true;
        else if (a === '--through' || a === '--month') throughMonth = nextVal(a, i++);
        else if (a.startsWith('--through=')) throughMonth = a.slice('--through='.length);
        else if (a.startsWith('--month=')) throughMonth = a.slice('--month='.length);
        else if (a === '--out') out = nextVal('--out', i++);
        else if (a.startsWith('--out=')) out = a.slice('--out='.length);
        else if (a === '--allow-shrink' || a === '--reset') allowShrink = true;
        else throw new Error(`Unknown argument: ${a}`);
    }
    return { check, throughMonth, out, allowShrink };
}

export function readExistingThroughMonth(outPath) {
    if (!fs.existsSync(outPath)) return null;
    try {
        const existing = JSON.parse(fs.readFileSync(outPath, 'utf8'));
        const committedMonth =
            existing?.throughMonth ??
            (typeof existing?.asOf === 'string' && existing.asOf.length >= 7 ? existing.asOf.slice(0, 7) : null);
        return committedMonth && YM_RE.test(committedMonth) ? committedMonth : null;
    } catch {
        return null;
    }
}

export function main(argv, root = process.cwd()) {
    const { check, throughMonth: explicitThrough, out, allowShrink } = parseArgs(argv);
    const world = loadCommunityWorld(root);
    const outPath = path.resolve(root, out);
    const relOut = path.relative(root, outPath) || out;

    const existingThroughMonth = readExistingThroughMonth(outPath);
    const worldDefault = world.defaultThroughMonth ?? BASELINE_MONTH;

    let targetThrough;
    if (explicitThrough != null) {
        if (!YM_RE.test(explicitThrough)) {
            throw new Error(`--through/--month must be YYYY-MM, got "${explicitThrough}"`);
        }
        if (existingThroughMonth && explicitThrough < existingThroughMonth && !allowShrink) {
            throw new Error(
                `Refusing to shrink existing community plan at ${relOut} from ${existingThroughMonth} to ${explicitThrough}; pass --allow-shrink (or --reset) to truncate.`,
            );
        }
        targetThrough = explicitThrough;
    } else {
        targetThrough =
            existingThroughMonth && existingThroughMonth > worldDefault ? existingThroughMonth : worldDefault;
    }

    const plan = buildCommunityPlan(world, { throughMonth: targetThrough });
    const rendered = renderCommunityPlan(plan);

    if (check) {
        if (!fs.existsSync(outPath)) {
            const err = new Error(`community plan missing at ${relOut}; run: npm run community:plan`);
            err.exitCode = 1;
            throw err;
        }
        const onDisk = fs.readFileSync(outPath, 'utf8');
        if (onDisk !== rendered) {
            const err = new Error(
                `community plan is out of date at ${relOut} (horizon ${targetThrough}); run: npm run community:plan`,
            );
            err.exitCode = 1;
            throw err;
        }
        console.log(
            `community plan is up to date (${plan.stats.monthsCovered} months through ${plan.asOf}: ${plan.stats.communitySpaces} spaces, ${plan.stats.forums} forums, ${plan.stats.totalPosts} posts, ${plan.stats.ideaAllocations} allocations, ${plan.stats.reactions} reactions)`,
        );
        return plan;
    }

    fs.mkdirSync(path.dirname(outPath), { recursive: true });
    fs.writeFileSync(outPath, rendered, 'utf8');
    console.log(
        `wrote ${relOut} (${plan.stats.monthsCovered} months through ${plan.asOf}): ${plan.stats.communitySpaces} spaces, ${plan.stats.forums} forums, ${plan.stats.topicTags} tags (${plan.stats.uniqueTopicSlugs} slugs), ${plan.stats.memberProfiles} profiles, ${plan.stats.totalPosts} posts (${plan.stats.rootPosts} roots, ${plan.stats.replyPosts} replies), ${plan.stats.qaQuestionPosts} Q&As (${plan.stats.verifiedCanonAnswers} verified canon), ${plan.stats.ideaAllocations} allocations, ${plan.stats.reactions} reactions, ${plan.stats.postTags} post tags, ${plan.stats.subscriptions} subscriptions`,
    );
    return plan;
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url))) {
    try {
        main(process.argv.slice(2));
    } catch (err) {
        console.error(err instanceof Error ? err.message : String(err));
        process.exit(err?.exitCode ?? 1);
    }
}
