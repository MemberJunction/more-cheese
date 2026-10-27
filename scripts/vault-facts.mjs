#!/usr/bin/env node
/**
 * vault-facts.mjs — the figures content writers may quote, computed from the committed generated/.
 * Implements VAULT-DESIGN.md Appendix A against the current data model: memberships are Confirmed
 * '… Membership (annual)' purchases on orders (the Membership Status query's rule), event
 * registrations are Event Order Lines on orders numbered ORD-E-REG-…-<EventKey>, and event names,
 * dates and places come from content/event-calendar.json.
 *
 *   node scripts/vault-facts.mjs week 2020-03-16      # one Monday–Sunday week (A.10), plus context
 *   node scripts/vault-facts.mjs year 2023            # one fiscal year (A.1–A.9)
 *   node scripts/vault-facts.mjs event EVT-2023-CONF  # one event's registrations and attendance
 *   node scripts/vault-facts.mjs series               # members current on each Dec 31
 *   node scripts/vault-facts.mjs prices               # product list prices (A.11)
 *   add --json for machine-readable output
 *
 * Plain Node, no dependencies, read-only. Run from the repo root.
 */
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();

function load(dir) {
    const d = path.join(ROOT, 'generated', dir);
    const out = [];
    for (const f of fs.readdirSync(d).sort()) {
        if (f === '.mj-sync.json' || !f.endsWith('.json')) continue;
        const j = JSON.parse(fs.readFileSync(path.join(d, f), 'utf8'));
        if (Array.isArray(j)) out.push(...j);
    }
    return out;
}
const flat = (r) => ({ id: String(r.primaryKey?.ID ?? '').toUpperCase(), ...r.fields });
const up = (v) => (v == null ? v : String(v).toUpperCase());
const day = (v) => (v == null ? '' : String(v).slice(0, 10));
const tally = (rows, key) => rows.reduce((m, r) => ((m[key(r)] = (m[key(r)] || 0) + 1), m), {});
const sum = (rows, f) => Math.round(rows.reduce((s, r) => s + (Number(f(r)) || 0), 0) * 100) / 100;
const addDays = (iso, n) => new Date(Date.parse(iso + 'T00:00:00Z') + n * 86400000).toISOString().slice(0, 10);
const minusMonths = (iso, n) => {
    const [y, m, d] = iso.split('-').map(Number);
    const t = new Date(Date.UTC(y, m - 1 - n, 1));
    const last = new Date(Date.UTC(t.getUTCFullYear(), t.getUTCMonth() + 1, 0)).getUTCDate();
    return new Date(Date.UTC(t.getUTCFullYear(), t.getUTCMonth(), Math.min(d, last))).toISOString().slice(0, 10);
};

// ---------- data ----------
const products = load('products').map(flat);
const productById = new Map(products.map((p) => [p.id, p]));
const orders = [];
const lines = [];
for (const r of load('orders')) {
    const o = flat(r);
    o.OrderDate = day(o.OrderDate);
    orders.push(o);
    for (const lr of r.collections?.Lines ?? []) {
        const l = flat(lr);
        l.order = o;
        l.event = lr.extension?.fields ?? null;
        lines.push(l);
    }
}
const lineById = new Map(lines.map((l) => [l.id, l]));
const reversedOrders = new Set(orders.filter((o) => o.Status === 'Confirmed' && o.ReversesOrderHeaderID).map((o) => up(o.ReversesOrderHeaderID)));
const productOfLine = (l) => productById.get(up(l.ReversesOrderLineID ? lineById.get(up(l.ReversesOrderLineID))?.ProductID ?? l.ProductID : l.ProductID));

const MEMBERSHIP_SUFFIX = ' Membership (annual)';
// Membership Status query rule: Confirmed, not itself a refund, not refunded, line not a reversal.
const membershipPurchases = lines
    .filter((l) => {
        const o = l.order;
        const p = productById.get(up(l.ProductID));
        return o.Status === 'Confirmed' && !o.ReversesOrderHeaderID && !reversedOrders.has(o.id) && !l.ReversesOrderLineID && p?.Name?.endsWith(MEMBERSHIP_SUFFIX);
    })
    .map((l) => ({ person: up(l.order.BillToPersonID), date: l.order.OrderDate, tier: productById.get(up(l.ProductID)).Name.slice(0, -MEMBERSHIP_SUFFIX.length), gross: Number(l.LineTotalGross) || 0, orderNumber: l.order.OrderNumber }))
    .sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
const firstPurchase = new Map();
for (const p of membershipPurchases) if (!firstPurchase.has(p.person)) firstPurchase.set(p.person, p.date);

/** Members whose latest qualifying purchase on or before asOf is within the 12 months before it. */
function currentMembers(asOf) {
    const latest = new Map();
    for (const p of membershipPurchases) if (p.date <= asOf) latest.set(p.person, p);
    const floor = minusMonths(asOf, 12);
    return [...latest.values()].filter((p) => p.date >= floor);
}

const calendar = JSON.parse(fs.readFileSync(path.join(ROOT, 'content', 'event-calendar.json'), 'utf8')).events;
const eventByKey = new Map(calendar.map((e) => [e.EventKey, e]));
const EVENT_KEY = /(EVT-\d{4}-[A-Z0-9]+)$/;
const registrations = lines
    .filter((l) => l.event && l.order.OrderType === 'Sale' && l.order.Status === 'Confirmed' && EVENT_KEY.test(l.order.OrderNumber))
    .map((l) => ({ key: l.order.OrderNumber.match(EVENT_KEY)[1], date: l.order.OrderDate, status: l.event.AttendanceStatus ?? null, refunded: reversedOrders.has(l.order.id) }));

function eventSummary(key) {
    const e = eventByKey.get(key) ?? { EventKey: key };
    const regs = registrations.filter((r) => r.key === key);
    return {
        key, name: e.Name, type: e.EventType, date: e.EventDate, virtual: e.IsVirtual, city: e.City, state: e.State,
        registered: regs.length, refunded: regs.filter((r) => r.refunded).length,
        attendance: tally(regs, (r) => r.status ?? 'Unrecorded'),
        note: regs.length ? undefined : 'no paid registrations in the data (free webinars carry none) — do not quote an attendance figure',
    };
}

const people = new Map(load('people').map(flat).map((p) => [p.id, `${p.FirstName} ${p.LastName}`]));
const enrollments = load('enrollments').map(flat);
const courses = load('courses').map(flat);
const memberCerts = load('member-certifications').map(flat);
const certName = new Map(load('certifications').map(flat).map((c) => [c.id, c.Name]));
const advocacy = load('advocacy-actions').map(flat);
const committees = new Map(load('committees').map(flat).map((c) => [c.id, c.Name]));
const meetings = load('committee-meetings').map(flat);
const terms = new Map(load('committee-terms').map(flat).map((t) => [t.id, t]));
const seats = load('committee-memberships').map(flat);
const payments = load('payments').map(flat);
const competition = load('competition-entries').map(flat);
const organizations = new Map(load('organizations').map(flat).map((o) => [o.id, o.Name]));

// ---------- reports ----------
function membershipYear(year) {
    const ye = `${year}-12-31`;
    const cur = currentMembers(ye);
    const prior = new Set(currentMembers(`${year - 1}-12-31`).map((p) => p.person));
    const now = new Set(cur.map((p) => p.person));
    const bought = membershipPurchases.filter((p) => p.date.startsWith(String(year)));
    return {
        currentOnDec31: cur.length,
        tierMixOnDec31: tally(cur, (p) => p.tier),
        firstTimeMembers: [...firstPurchase.values()].filter((d) => d.startsWith(String(year))).length,
        retainedFromPriorYear: [...prior].filter((p) => now.has(p)).length,
        lapsedFromPriorYear: [...prior].filter((p) => !now.has(p)).length,
        priorYearBase: prior.size,
        membershipPurchases: bought.length,
        membershipSalesGross: sum(bought, (p) => p.gross),
        caveats: year === 2019 ? ['Order history starts in 2019: first-time and retained/lapsed figures for 2019 measure the data start, not real joins — never publish them.'] : [],
    };
}

function revenueYear(year) {
    const inYear = orders.filter((o) => o.OrderDate.startsWith(String(year)) && o.Status === 'Confirmed');
    const ids = new Set(inYear.map((o) => o.id));
    const byProduct = {};
    for (const l of lines.filter((x) => ids.has(x.order.id))) {
        const name = productOfLine(l)?.Name ?? 'Unknown product';
        byProduct[name] = Math.round(((byProduct[name] || 0) + (Number(l.LineTotalGross) || 0)) * 100) / 100;
    }
    return {
        confirmedOrders: inYear.length,
        sales: inYear.filter((o) => o.OrderType === 'Sale').length,
        cancellations: inYear.filter((o) => o.OrderType === 'Cancellation').length,
        gross: sum(inYear, (o) => o.TotalGross),
        applied: sum(inYear, (o) => o.AmountPaid),
        receivable: sum(inYear, (o) => o.Balance),
        cashCaptured: sum(payments.filter((p) => day(p.PaymentDate).startsWith(String(year)) && p.Status === 'Captured'), (p) => p.Amount),
        netByProduct: byProduct,
        note: 'Refund lines are attributed to the product of the line they reverse. Unaudited operating revenue; there is no expense side in the data.',
    };
}

function educationYear(year) {
    const y = String(year);
    return {
        courseInstancesStarting: courses.filter((c) => day(c.StartDate).startsWith(y)).map((c) => c.Name),
        enrollments: enrollments.filter((e) => day(e.EnrolledOn).startsWith(y)).length,
        completions: enrollments.filter((e) => day(e.CompletedOn).startsWith(y)).length,
        certificationEnrollments: memberCerts.filter((m) => day(m.EnrolledOn).startsWith(y)).length,
        certificationsAwarded: tally(memberCerts.filter((m) => day(m.AwardedOn).startsWith(y)), (m) => certName.get(up(m.CertificationID))),
    };
}

function governanceYear(year) {
    const y = String(year);
    const officers = seats
        .filter((m) => day(m.StartDate) <= `${y}-12-31` && (!m.EndDate || day(m.EndDate) >= `${y}-01-01`) && !String(m.RoleID).endsWith('Member'))
        .map((m) => `${committees.get(up(terms.get(up(m.TermID))?.CommitteeID))}: ${String(m.RoleID).split('=').pop()} — ${people.get(up(m.PersonID))}`)
        .sort();
    return { meetings: meetings.filter((m) => day(m.StartDateTime).startsWith(y)).length, officers };
}

function year(y) {
    const evs = calendar.filter((e) => e.EventDate.startsWith(String(y))).map((e) => eventSummary(e.EventKey));
    const comp = competition.filter((c) => Number(c.EntryYear) === y);
    const adv = advocacy.filter((a) => day(a.ActionDate).startsWith(String(y)));
    return {
        year: y,
        membership: membershipYear(y),
        events: evs,
        revenue: revenueYear(y),
        education: educationYear(y),
        competition: {
            entries: comp.length,
            byCategory: tally(comp, (c) => c.Category),
            medals: comp.filter((c) => c.Result && c.Result !== 'None').map((c) => `${c.Category} ${c.Result}: ${c.ProductName} — ${organizations.get(up(c.OrganizationID)) ?? '?'} (${people.get(up(c.PersonID)) ?? '?'})`),
        },
        advocacy: { total: adv.length, byKind: tally(adv, (a) => a.Kind), byTopic: tally(adv, (a) => a.Topic) },
        governance: governanceYear(y),
    };
}

function week(monday) {
    if (new Date(monday + 'T00:00:00Z').getUTCDay() !== 1) throw new Error(`${monday} is not a Monday`);
    const A = monday, B = addDays(monday, 6);
    const inWeek = (v) => day(v) >= A && day(v) <= B;
    const wkOrders = orders.filter((o) => inWeek(o.OrderDate) && o.Status === 'Confirmed');
    const wkMembership = membershipPurchases.filter((p) => inWeek(p.date));
    const regs = registrations.filter((r) => inWeek(r.date));
    return {
        window: { start: A, end: B },
        era: eraFor(Number(A.slice(0, 4))),
        currentMembersAtWeekEnd: currentMembers(B).length,
        membershipPurchases: {
            total: wkMembership.length,
            firstTime: wkMembership.filter((p) => firstPurchase.get(p.person) === p.date).length,
            byTier: tally(wkMembership, (p) => p.tier),
            gross: sum(wkMembership, (p) => p.gross),
        },
        orders: { confirmed: wkOrders.length, gross: sum(wkOrders, (o) => o.TotalGross), cancellations: wkOrders.filter((o) => o.OrderType === 'Cancellation').length },
        cashCaptured: sum(payments.filter((p) => inWeek(p.PaymentDate) && p.Status === 'Captured'), (p) => p.Amount),
        eventRegistrationsTaken: tally(regs, (r) => `${r.key} ${eventByKey.get(r.key)?.Name ?? ''}`.trim()),
        eventsThisWeek: calendar.filter((e) => inWeek(e.EventDate)).map((e) => eventSummary(e.EventKey)),
        eventsNextEightWeeks: calendar.filter((e) => e.EventDate > B && e.EventDate <= addDays(B, 56)).map((e) => `${e.EventDate} ${e.EventKey} ${e.Name}${e.City ? ` (${e.City})` : ''}`),
        courseEnrollmentsTaken: enrollments.filter((e) => inWeek(e.EnrolledOn)).length,
        courseCompletions: enrollments.filter((e) => inWeek(e.CompletedOn)).length,
        coursesStartingWithinEightWeeks: courses.filter((c) => day(c.StartDate) >= A && day(c.StartDate) <= addDays(B, 56)).map((c) => `${day(c.StartDate)} ${c.Name}`),
        certifications: { enrolled: memberCerts.filter((m) => inWeek(m.EnrolledOn)).length, awarded: memberCerts.filter((m) => inWeek(m.AwardedOn)).map((m) => `${certName.get(up(m.CertificationID))} — ${people.get(up(m.PersonID))}`) },
        advocacyActions: tally(advocacy.filter((a) => inWeek(a.ActionDate)), (a) => `${a.Kind} / ${a.Topic}`),
        committeeMeetings: meetings.filter((m) => inWeek(m.StartDateTime)).map((m) => `${day(m.StartDateTime)} ${m.Name} (${m.Status})`),
        dataEnds: dataEnd(),
    };
}

function eraFor(y) {
    const eras = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'ruleset', 'eras.json'), 'utf8')).eras;
    return eras.find((e) => e.cycles.includes(y))?.eraKey ?? null;
}

function dataEnd() {
    return orders.reduce((m, o) => (o.Status === 'Confirmed' && o.OrderDate > m ? o.OrderDate : m), '');
}

function series() {
    const out = {};
    const last = Number(dataEnd().slice(0, 4));
    for (let y = 2019; y <= last; y++) out[y] = currentMembers(y === last ? dataEnd() : `${y}-12-31`).length;
    return { currentMembersOnDec31: out, note: `the final year is measured at the last confirmed order date (${dataEnd()}), not Dec 31` };
}

// ---------- CLI ----------
const args = process.argv.slice(2);
const json = args.includes('--json');
const [cmd, arg] = args.filter((a) => !a.startsWith('--'));
let result;
switch (cmd) {
    case 'week': result = week(arg); break;
    case 'year': result = year(Number(arg)); break;
    case 'event': result = eventSummary(arg); break;
    case 'series': result = series(); break;
    case 'prices': result = products.map((p) => ({ sku: p.SKU, name: p.Name, price: p.StandaloneSellingPrice })); break;
    default:
        console.error('usage: node scripts/vault-facts.mjs week <Monday> | year <YYYY> | event <EventKey> | series | prices [--json]');
        process.exit(2);
}
console.log(json ? JSON.stringify(result, null, 2) : JSON.stringify(result, null, 2).replace(/^\{\n|\n\}$/g, '').replace(/^ {2}/gm, ''));
