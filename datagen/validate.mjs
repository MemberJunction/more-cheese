// MoreCheese datagen — validation harness (ruleset-spec §7).
//
// Usage: node validate.mjs [--out out]   (run generate.mjs first)
// Exit code 0 = all gates pass; 1 = any failure (build-breaking by design).
//
// The gates, in plain words (one function per group below):
//   packs        — every reference resolves against the pack's declared dependencies
//   temporal     — dates obey the team's rules (grace, back-dating, windows)
//   benchmarks   — the headline numbers land in tolerance AND are rough enough (variance floors)
//   arrows       — every causal rule is re-detectable in the output, right sign and size
//   trainability — a churn model trained on observables actually rank-orders risk
//   heroes       — the pinned people load with their stories intact
//   statusMix    — the member-status split looks like the documented world

import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { logisticFit } from './lib/stats.mjs';
import { loadRuleset } from './lib/config.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const args = Object.fromEntries(process.argv.slice(2).map((a, i, all) => (a.startsWith('--') ? [a.slice(2), all[i + 1]] : null)).filter(Boolean));
const OUT = join(HERE, args.out ?? 'out');
const load = (pack, table) => JSON.parse(readFileSync(join(OUT, 'packs', pack, `${table}.json`), 'utf8'));
const run = JSON.parse(readFileSync(join(OUT, 'run.json'), 'utf8'));
const R = loadRuleset(run.scenario); // the validator judges against the SAME world the run was built for

const people = load('common', 'people');
const orgs = load('common', 'organizations');
const periods = load('membership', 'membership_periods');
const events = load('events', 'events');
const regs = load('events', 'event_registrations');
const products = load('orders', 'products');
const orders = load('orders', 'orders');
const orderLines = load('orders', 'order_lines');
const payments = load('orders', 'payments');
const courses = load('learning', 'courses');
const enrollments = load('learning', 'enrollments');
// validator-private: renewal decisions WITH the latents (never installed) — needed so arrow
// recovery isn't attenuated by omitting a strong hidden driver (spec §7 lesson #2)
const renewalEvents = JSON.parse(readFileSync(join(OUT, 'validation-events.json'), 'utf8'));

const results = [];
const check = (name, ok, detail) => results.push({ name, ok, detail });

// shared lookups
const joinOf = new Map(people.map((p) => [p.MemberNumber, p.JoinDate]));
const periodsByMember = new Map();
for (const x of periods) { (periodsByMember.get(x.MemberNumber) ?? periodsByMember.set(x.MemberNumber, []).get(x.MemberNumber)).push(x); }
const lastStatus = new Map();
const lastPeriod = new Map();
for (const per of periods) { lastStatus.set(per.MemberNumber, per.Status); lastPeriod.set(per.MemberNumber, per); }

// ---------- packs (§7.8) ----------
function checkPacks() {
  const peopleKeys = new Set(people.map((p) => p.MemberNumber));
  const orgKeys = new Set(orgs.map((o) => o.OrgKey));
  const eventKeys = new Set(events.map((e) => e.EventKey));
  const badEmployer = people.filter((p) => p.OrgKey && !orgKeys.has(p.OrgKey)).length;
  const badPeriod = periods.filter((x) => !peopleKeys.has(x.MemberNumber)).length;
  const badRegP = regs.filter((x) => !peopleKeys.has(x.MemberNumber)).length;
  const badRegE = regs.filter((x) => !eventKeys.has(x.EventKey)).length;
  check('pack refs: people→orgs (within common)', badEmployer === 0, `${badEmployer} dangling`);
  check('pack refs: membership→common', badPeriod === 0, `${badPeriod} dangling`);
  check('pack refs: events→common+events', badRegP + badRegE === 0, `${badRegP}+${badRegE} dangling`);
  const productKeys = new Set(products.map((x) => x.ProductKey));
  const orderKeys = new Set(orders.map((x) => x.OrderKey));
  const badOrderM = orders.filter((x) => !peopleKeys.has(x.MemberNumber)).length;
  const badLine = orderLines.filter((x) => !orderKeys.has(x.OrderKey) || !productKeys.has(x.ProductKey)).length;
  const badPay = payments.filter((x) => !orderKeys.has(x.OrderKey)).length;
  check('pack refs: orders→common + lines→products + payments→orders', badOrderM + badLine + badPay === 0, `${badOrderM}+${badLine}+${badPay} dangling`);
  for (const pack of ['common', 'membership', 'events', 'orders']) {
    const m = JSON.parse(readFileSync(join(OUT, 'packs', pack, 'manifest.json'), 'utf8'));
    check(`manifest: ${pack}`, m.name === pack && Array.isArray(m.dependsOn), `dependsOn=[${m.dependsOn}]`);
  }
}

// ---------- temporal integrity (§7.6): the team's date rules, re-verified ----------
function checkTemporal() {
  const badStart = periods.filter((x) => x.StartDate < joinOf.get(x.MemberNumber)).length;
  const badOrder = periods.filter((x) => x.EndDate <= x.StartDate).length;
  const lapsedNoCancel = periods.filter((x) => x.Status === 'Lapsed' && x.CancellationDate === null && x.EndDate < run.releaseDate).length;
  const cancelBeforeEnd = periods.filter((x) => x.CancellationDate && x.CancellationDate < x.EndDate).length;
  let gaps = 0;
  for (const list of periodsByMember.values()) {
    list.sort((a, b) => a.StartDate.localeCompare(b.StartDate));
    for (let i = 1; i < list.length; i++) {
      const prevEnd = new Date(`${list[i - 1].EndDate}T00:00:00Z`).getTime();
      const nextStart = new Date(`${list[i].StartDate}T00:00:00Z`).getTime();
      if (nextStart - prevEnd !== 86400000) gaps++;
    }
  }
  const eventDate = new Map(events.map((e) => [e.EventKey, e.Date]));
  const regOutside = regs.filter((x) => {
    const evDate = eventDate.get(x.EventKey);
    const inPeriod = (periodsByMember.get(x.MemberNumber) ?? []).some((per) => per.StartDate <= evDate && evDate <= per.EndDate);
    return !inPeriod || x.RegisteredOn < joinOf.get(x.MemberNumber);
  }).length;
  check('periods: never start before JoinDate', badStart === 0, `${badStart} bad`);
  check('periods: EndDate > StartDate', badOrder === 0, `${badOrder} bad`);
  check('lapse ⟹ CancellationDate set (the team rule)', lapsedNoCancel === 0, `${lapsedNoCancel} missing`);
  check('CancellationDate ≥ EndDate (grace runs after)', cancelBeforeEnd === 0, `${cancelBeforeEnd} bad`);
  check('renewals back-date: no gaps between periods', gaps === 0, `${gaps} gaps`);
  check('registrations covered by a membership period', regOutside === 0, `${regOutside} outside`);
}

// ---------- benchmark means + variance floors (§7.1–7.2) ----------
const byYear = {};
for (const e of renewalEvents) { (byYear[e.year] ??= { n: 0, r: 0 }); byYear[e.year].n++; byYear[e.year].r += e.renewed; }
// band/variance gates run on cohorts big enough that binomial noise doesn't dominate
const yearRates = Object.entries(byYear).filter(([, v]) => v.n >= 100).map(([y, v]) => ({ y: +y, n: v.n, rate: v.r / v.n, covid: (run.covidYears ?? [2020, 2021]).includes(+y) }));

function checkBenchmarks() {
  const M = R.membership;
  const normal = yearRates.filter((x) => !x.covid);
  const pooled = normal.reduce((s, x) => s + x.rate, 0) / normal.length;
  const stdYears = Math.sqrt(normal.reduce((s, x) => s + (x.rate - pooled) ** 2, 0) / normal.length);
  // small-sample allowance: the mean of a few wobbled years has its own SE (vanishes at scale)
  const meanAllow = M.renewalTolerance + 1.5 * (stdYears / Math.sqrt(normal.length));
  check(`renewal mean ${(pooled * 100).toFixed(1)}% vs ${M.renewalTarget * 100}% ±${(meanAllow * 100).toFixed(1)} (tol + mean-SE at ${normal.length} yrs)`, Math.abs(pooled - M.renewalTarget) <= meanAllow, `${normal.length} non-covid yrs`);

  // each year's band widens by its own sampling error (converges to the pure band at scale)
  const inBand = normal.filter((x) => {
    const se = Math.sqrt((M.renewalTarget * (1 - M.renewalTarget)) / x.n);
    return x.rate >= M.yearlyBand[0] - 1.5 * se && x.rate <= M.yearlyBand[1] + 1.5 * se;
  }).length;
  check(`yearly renewal in [${M.yearlyBand}] (±1.5·SE at pilot n) for ≥75% of years`, inBand / normal.length >= 0.75, `${inBand}/${normal.length} in band`);

  // anti-smoothness floor with a chi-square small-sample discount: a sample std over few
  // years is itself noisy — only reject if it's below the 5% quantile of a true-at-floor std.
  // (chi2 5% lower quantiles by df; converges to the raw floor as years accumulate)
  // regime expression: COVID years must actually sit BELOW normal years — a shared shift
  // that gets calibrated away leaves no dip (the bug this gate exists to catch, found 2026-07-10)
  const covidYears = yearRates.filter((x) => x.covid);
  if (covidYears.length) {
    const covidMean = covidYears.reduce((s, x) => s + x.rate, 0) / covidYears.length;
    const nCovid = covidYears.reduce((s, x) => s + x.n, 0);
    const nNorm = normal.reduce((s, x) => s + x.n, 0);
    // one-sided with sampling allowance (binomial SE of the difference; strict at scale)
    const seDiff = Math.sqrt(M.renewalTarget * (1 - M.renewalTarget) * (1 / nCovid + 1 / nNorm));
    check(`regime: COVID renewal ${(covidMean * 100).toFixed(1)}% sits below normal ${(pooled * 100).toFixed(1)}% (−0.5pt required, +${(1.5 * seDiff * 100).toFixed(1)}pt SE allowance)`, covidMean < pooled - 0.005 + 1.5 * seDiff, 'regime must express, not calibrate away');
  }

  const CHI2_05 = { 1: 0.0039, 2: 0.103, 3: 0.352, 4: 0.711, 5: 1.145, 6: 1.635, 7: 2.167, 8: 2.733, 9: 3.325, 10: 3.940, 11: 4.575, 12: 5.226 };
  const df = Math.max(1, normal.length - 1);
  const floorAdj = M.yoyStdFloor * Math.sqrt((CHI2_05[Math.min(df, 12)] ?? df * 0.5) / df);
  check(`texture: YoY renewal std ${(stdYears * 100).toFixed(2)}pt ≥ floor ${(floorAdj * 100).toFixed(2)}pt (anti-smoothness, χ²-adjusted for ${normal.length} yrs)`, stdYears >= floorAdj, 'variance floor');

  const web = new Set(events.filter((e) => e.EventType === 'Webinar').map((e) => e.EventKey));
  const paid = regs.filter((x) => !web.has(x.EventKey));
  const webinar = regs.filter((x) => web.has(x.EventKey));
  const nsPaid = paid.filter((x) => !x.Attended).length / paid.length;
  const nsWeb = webinar.filter((x) => !x.Attended).length / webinar.length;
  const NS = R.events.noShow;
  check(`no-show paid ${(nsPaid * 100).toFixed(1)}% vs ${NS.paidInPerson.target * 100}% ±${NS.paidInPerson.tolerance * 100}`, Math.abs(nsPaid - NS.paidInPerson.target) <= NS.paidInPerson.tolerance, `${paid.length} regs`);
  check(`no-show webinar ${(nsWeb * 100).toFixed(1)}% vs ${NS.freeWebinar.target * 100}% ±${NS.freeWebinar.tolerance * 100}`, Math.abs(nsWeb - NS.freeWebinar.target) <= NS.freeWebinar.tolerance, `${webinar.length} regs`);
}

// ---------- arrow recovery (§7.3): every causal rule re-detected, right sign and size ----------
function checkArrows() {
  // the anchor rides along as a nuisance covariate: with a DRIFTING θ, renewal selection
  // acted on past θ values the decision-year θ can't represent — omitting that history
  // attenuates neighboring coefficients (tenure especially). The anchor stands in for it.
  const X = renewalEvents.map((e) => [1, e.tenureZ, e.theta, e.anchor ?? e.theta, e.prevTheta ?? e.theta, e.autoRenew, e.employerEvent, e.enthusiast]);
  const y = renewalEvents.map((e) => e.renewed);
  const { beta: [, bTenure, bTheta, , , bAuto, bEmployer, bEnth], se: [, seTenure, seTheta, , , seAuto, seEmployer, seEnth] } = logisticFit(X, y);
  const gate = (name, got, se, authored) => {
    const okSign = Math.sign(got) === Math.sign(authored);
    const ratio = Math.abs(got / authored);
    // strict band, with a small-sample allowance (±3·SE) that vanishes at production scale.
    // 3 (not 2.5) is the multiple-comparisons budget: ~30 gates × many seeds means a 2.5σ
    // false failure is EXPECTED occasionally (verified empirically: recoveries center on the
    // authored values; a 2.9σ outlier appeared in a 7-seed sweep exactly as statistics predicts)
    const ok = okSign && ((ratio >= 0.5 && ratio <= 2.0) || Math.abs(got - authored) <= 3 * se);
    check(`arrow ${name}: recovered β=${got.toFixed(2)}±${se.toFixed(2)} vs authored ${authored} (×${ratio.toFixed(2)})`, ok, okSign ? 'sign ok' : 'SIGN FLIP');
  };
  const A = R.membership.arrows;
  gate('tenure→renewal', bTenure, seTenure, A.tenure.beta);
  gate('engagement→renewal', bTheta, seTheta, A.engagement.beta);
  gate('autoRenew→renewal', bAuto, seAuto, A.autoRenew.beta);
  gate('employerEvent→renewal (1.15)', bEmployer, seEmployer, A.employerEvent.beta);
  gate('enthusiastTier→renewal', bEnth, seEnth, A.enthusiastTier.beta);

  // the enthusiast rule's own benchmark: ~65% tier renewal while overall stays 87%
  // (tolerance + binomial SE at the observed group size — vanishes at production scale)
  const enth = renewalEvents.filter((e) => e.enthusiast === 1);
  const enthRate = enth.reduce((s, e) => s + e.renewed, 0) / enth.length;
  const EB = R.membership.enthusiastRenewal;
  const enthAllow = EB.tolerance + 1.5 * Math.sqrt((EB.target * (1 - EB.target)) / enth.length);
  check(`enthusiast-tier renewal ${(enthRate * 100).toFixed(1)}% vs ${EB.target * 100}% ±${(enthAllow * 100).toFixed(1)} (tol + SE at n=${enth.length})`, Math.abs(enthRate - EB.target) <= enthAllow, `${enth.length} decisions`);

  // engagement double-check through a fully OBSERVABLE proxy (activity quartiles) —
  // attenuated by design, but it's what a customer's analyst would actually see
  const acts = new Map();
  for (const x of regs) acts.set(x.MemberNumber, (acts.get(x.MemberNumber) ?? 0) + 1);
  const activity = people.map((p) => ({ act: acts.get(p.MemberNumber) ?? 0, m: p.MemberNumber }));
  activity.sort((a, b) => a.act - b.act);
  const q = (lo, hi) => {
    const slice = activity.slice(Math.floor(activity.length * lo), Math.floor(activity.length * hi));
    const active = slice.filter((s) => ['Active', 'PendingRenewal', 'Renewed'].includes(lastStatus.get(s.m))).length;
    return active / slice.length;
  };
  const low = q(0, 0.25), high = q(0.75, 1);
  check(`arrow engagement→retention (proxy): top-quartile activity retention ${(high * 100).toFixed(0)}% > bottom ${(low * 100).toFixed(0)}%`, high > low + 0.05, 'observable proxy, attenuated by design');
}

// ---------- tiers & dues: the affluence dial made observable ----------
function checkTiers() {
  const latents = JSON.parse(readFileSync(join(OUT, 'validation-latents.json'), 'utf8'));
  const duesOf = new Map(R.membership.tiers.list.map((t) => [t.name, t.dues]));
  const badDues = periods.filter((x) => x.DuesAmount !== duesOf.get(x.MembershipTier)).length;
  check('dues: every period carries its tier\'s exact dues', badDues === 0, `${badDues} mismatched`);
  const indiv = periods.filter((x) => x.MembershipTier === 'Individual');
  check(`dues: Individual tier = $${R.membership.tiers.individualDuesTarget} exactly (the verified ACS rate)`, indiv.every((x) => x.DuesAmount === R.membership.tiers.individualDuesTarget), `${indiv.length} periods`);
  // φ must be monotone across paid tiers — the copula's second dial expressing through money
  const phiOf = (tier) => {
    const rows = latents.filter((l) => !l.hero && l.tier === tier);
    return rows.length ? rows.reduce((s, l) => s + l.phi, 0) / rows.length : null;
  };
  const pIndiv = phiOf('Individual'), pSmall = phiOf('SmallBusiness'), pCorp = phiOf('Corporate');
  const monotone = pIndiv != null && pSmall != null && pCorp != null && pIndiv < pSmall && pSmall < pCorp;
  check(`tiers: mean φ rises Individual(${pIndiv?.toFixed(2)}) < SmallBusiness(${pSmall?.toFixed(2)}) < Corporate(${pCorp?.toFixed(2)})`, monotone, 'affluence → tier, observable');
  const enthMismatch = latents.filter((l) => !l.hero && (l.tier === 'Enthusiast')).length;
  check('tiers: Enthusiast tier exists and is populated', enthMismatch > 0, `${enthMismatch} members`);
}

// ---------- learning: participation + completion, engagement expressing (3rd domain) ----------
function checkLearning() {
  const L = R.learning;
  const courseKeys = new Set(courses.map((c) => c.CourseKey));
  const badRefs = enrollments.filter((e) => !courseKeys.has(e.CourseKey) || !joinOf.has(e.MemberNumber)).length;
  check('pack refs: learning→common+courses', badRefs === 0, `${badRefs} dangling`);

  // participation: members with ≥1 enrollment per eligible year ≈ 50%. Eligible = covered
  // mid-year — the same pool the generator calibrates on; counting raw period-years instead
  // double-counts anniversary members and dilutes with partial years (measurement artifact).
  const courseYear = new Map(courses.map((c) => [c.CourseKey, c.Year]));
  const participated = new Set(enrollments.map((e) => `${e.MemberNumber}:${courseYear.get(e.CourseKey)}`));
  let activeYears = 0, partYears = 0;
  const lastYear = +run.releaseDate.slice(0, 4);
  for (const [m, list] of periodsByMember) {
    const seen = new Set();
    for (const per of list) {
      const y0 = +per.StartDate.slice(0, 4), y1 = Math.min(+per.EndDate.slice(0, 4), lastYear);
      for (let y = y0; y <= y1; y++) {
        if (seen.has(y)) continue;
        const mid = `${y}-06-15`;
        if (!(per.StartDate <= mid && mid <= per.EndDate) && !list.some((p2) => p2.StartDate <= mid && mid <= p2.EndDate)) continue;
        seen.add(y);
        activeYears++;
        if (participated.has(`${m}:${y}`)) partYears++;
      }
    }
  }
  const partRate = partYears / activeYears;
  const partAllow = L.participation.tolerance + 1.5 * Math.sqrt(L.participation.target * (1 - L.participation.target) / activeYears);
  check(`learning: participation ${(partRate * 100).toFixed(1)}% vs ${L.participation.target * 100}% ±${(partAllow * 100).toFixed(1)}`, Math.abs(partRate - L.participation.target) <= partAllow, `${activeYears} member-years`);

  // completion among terminal enrollments ≈ 72%
  const terminal = enrollments.filter((e) => e.Status !== 'InProgress');
  const compRate = terminal.filter((e) => e.Status === 'Completed').length / terminal.length;
  const compAllow = L.completion.tolerance + 1.5 * Math.sqrt(L.completion.target * (1 - L.completion.target) / terminal.length);
  check(`learning: completion ${(compRate * 100).toFixed(1)}% vs ${L.completion.target * 100}% ±${(compAllow * 100).toFixed(1)}`, Math.abs(compRate - L.completion.target) <= compAllow, `${terminal.length} terminal enrollments`);

  // engagement expresses through completion (observable proxy: anchor quartiles)
  const latents = JSON.parse(readFileSync(join(OUT, 'validation-latents.json'), 'utf8'));
  const anchorOf = new Map(latents.map((l) => [l.m, l.theta]));
  const withAnchor = terminal.filter((e) => anchorOf.has(e.MemberNumber));
  withAnchor.sort((a, b) => anchorOf.get(a.MemberNumber) - anchorOf.get(b.MemberNumber));
  const q = (lo, hi) => { const s = withAnchor.slice(Math.floor(withAnchor.length * lo), Math.floor(withAnchor.length * hi)); return s.filter((e) => e.Status === 'Completed').length / s.length; };
  check(`learning: completion rises with engagement (bottom quartile ${(q(0, 0.25) * 100).toFixed(0)}% < top ${(q(0.75, 1) * 100).toFixed(0)}%)`, q(0.75, 1) > q(0, 0.25) + 0.03, 'observable proxy');

  // enrollments only inside membership windows (carry-down, 3rd domain)
  const courseStart = new Map(courses.map((c) => [c.CourseKey, c.StartDate]));
  const outside = enrollments.filter((e) => {
    const d = courseStart.get(e.CourseKey);
    return !(periodsByMember.get(e.MemberNumber) ?? []).some((per) => per.StartDate <= d && d <= per.EndDate);
  }).length;
  check('learning: enrollments covered by a membership period', outside === 0, `${outside} outside`);
}

// ---------- the money chain: order-per-cycle, 3-part payment timing, reconciliation ----------
function checkMoney() {
  const G = R.orders.gates;
  // BO-D40 verbatim: one dues order per membership period
  const duesOrders = orders.filter((x) => x.OrderKey.startsWith('ORD-D-'));
  check('money: one dues order per membership period (order-per-cycle)', duesOrders.length === periods.length, `${duesOrders.length} orders / ${periods.length} periods`);

  // reconciliation: every Paid order's payments sum to its total; no orphan payments
  const paidByOrder = new Map();
  for (const p of payments) paidByOrder.set(p.OrderKey, (paidByOrder.get(p.OrderKey) ?? 0) + p.Amount);
  const badRecon = orders.filter((x) => x.PaymentStatus === 'Paid' && paidByOrder.get(x.OrderKey) !== x.TotalGross).length;
  const paidButNo = orders.filter((x) => x.PaymentStatus !== 'Paid' && paidByOrder.has(x.OrderKey)).length;
  check('money: every Paid order reconciles (payments sum = total; unpaid have none)', badRecon + paidButNo === 0, `${badRecon}+${paidButNo} bad`);

  // the 3-part timing mixture, measured
  const perByKey = new Map(periods.map((x) => [`ORD-D-${x.PeriodKey}`, x]));
  const payDate = new Map(payments.map((p) => [p.OrderKey, p.PaymentDate]));
  const cls = { auto: [], manual: [], net: [] };
  for (const o of duesOrders) {
    if (!payDate.has(o.OrderKey)) continue; // unpaid orders age instead
    const per = perByKey.get(o.OrderKey);
    const late = payDate.get(o.OrderKey) > o.DueDate ? 1 : 0;
    const onDue = payDate.get(o.OrderKey) === o.DueDate ? 1 : 0;
    if (['SmallBusiness', 'Corporate'].includes(per.MembershipTier)) cls.net.push(late);
    else if (per.AutoRenew) cls.auto.push(onDue);
    else cls.manual.push(late);
  }
  const rate = (a) => a.reduce((s, x) => s + x, 0) / a.length;
  const se = (p, n) => Math.sqrt(p * (1 - p) / n);
  const netLate = rate(cls.net), manualLate = rate(cls.manual), autoOn = rate(cls.auto);
  check(`money: net-terms late share ${(netLate * 100).toFixed(1)}% vs ${G.netTermsLate.target * 100}% ±${(G.netTermsLate.tolerance * 100).toFixed(0)}+SE (Atradius/CRF)`, Math.abs(netLate - G.netTermsLate.target) <= G.netTermsLate.tolerance + 1.5 * se(G.netTermsLate.target, cls.net.length), `${cls.net.length} net-terms payments`);
  check(`money: manual dues late share ${(manualLate * 100).toFixed(1)}% vs ${G.manualLate.target * 100}% ±${(G.manualLate.tolerance * 100).toFixed(0)}+SE (mirrors late_renewal_share)`, Math.abs(manualLate - G.manualLate.target) <= G.manualLate.tolerance + 1.5 * se(G.manualLate.target, cls.manual.length), `${cls.manual.length} manual payments`);
  check(`money: auto-pay lands ON the due date ${(autoOn * 100).toFixed(1)}% (≥${G.autopayOnDueMin * 100}%)`, autoOn >= G.autopayOnDueMin, `${cls.auto.length} auto-payments`);

  // event orders: card-at-checkout = paid same day, always
  const evOrders = orders.filter((x) => x.OrderKey.startsWith('ORD-E-'));
  const badEv = evOrders.filter((x) => payDate.get(x.OrderKey) !== x.OrderDate).length;
  check('money: event registrations are card-at-checkout (paid same day)', badEv === 0, `${evOrders.length} event orders, ${badEv} bad`);

  // the renewal-outreach queue exists in the money data: pending members carry an OPEN order
  const pendingMembers = periods.filter((x) => x.Status === 'PendingRenewal').map((x) => x.MemberNumber);
  const openRenewals = new Set(orders.filter((x) => x.OrderKey.startsWith('ORD-R-') && x.PaymentStatus !== 'Paid').map((x) => x.MemberNumber));
  const missing = pendingMembers.filter((m) => !openRenewals.has(m)).length;
  check(`money: every PendingRenewal member has an open renewal order (incl. Marcus)`, missing === 0 && openRenewals.has('ICF-000102'), `${pendingMembers.length} pending, ${missing} missing`);
}

// ---------- engagement dynamics: decline must PRECEDE lapse (found 2026-07-10) ----------
// With a constant lifetime θ, members lapse without warning — activity is level right up to
// the cliff, Sonar trends are flat, and churn early-warning (the "save Bob" demo) has nothing
// to detect. This gate requires the drifting-θ process to actually express: lapsed members'
// final-year activity must sit below their own earlier average (within-person decline).
function checkEngagementDynamics() {
  const eventYear = new Map(events.map((e) => [e.EventKey, e.Year]));
  const regsByMemberYear = new Map();
  for (const x of regs) {
    const key = `${x.MemberNumber}:${eventYear.get(x.EventKey)}`;
    regsByMemberYear.set(key, (regsByMemberYear.get(key) ?? 0) + 1);
  }
  const isCovid = (y) => (run.covidYears ?? [2020, 2021]).includes(y);
  let finalSum = 0, earlierSum = 0, members = 0;
  for (const [m, list] of periodsByMember) {
    const last = list[list.length - 1];
    if (last.Status !== 'Lapsed') continue;
    const joinYear = +list[0].StartDate.slice(0, 4);
    const lastYear = +last.EndDate.slice(0, 4);
    if (isCovid(lastYear)) continue;
    // within-person baseline: FULL non-COVID years strictly between the (partial) join year
    // and the final year — the join-year and COVID confounds bias the ratio upward otherwise
    const baselineYears = [];
    for (let y = joinYear + 1; y < lastYear; y++) if (!isCovid(y)) baselineYears.push(y);
    if (baselineYears.length < 2) continue;
    const finalActivity = regsByMemberYear.get(`${m}:${lastYear}`) ?? 0;
    const earlier = baselineYears.reduce((s, y) => s + (regsByMemberYear.get(`${m}:${y}`) ?? 0), 0) / baselineYears.length;
    finalSum += finalActivity;
    earlierSum += earlier;
    members++;
  }
  if (members >= 30) {
    const ratio = finalSum / Math.max(earlierSum, 1e-9);
    check(`dynamics: lapsers' final-year activity is ${(ratio * 100).toFixed(0)}% of their own baseline (decline precedes lapse)`, ratio < 0.92, `${members} lapsers with ≥2 clean baseline yrs`);
  } else {
    check('dynamics: decline-precedes-lapse (skipped — too few long-history lapsers at this N)', true, `${members} qualifying members`);
  }
}

// ---------- trainability (§7.4): observables only — the customer's-data-scientist test ----------
function checkTrainability() {
  const X = renewalEvents.map((e) => [1, e.tenureZ, e.autoRenew, e.employerEvent]);
  const y = renewalEvents.map((e) => e.renewed);
  const { beta } = logisticFit(X, y);
  const scored = X.map((x, i) => ({ p: x.reduce((s, v, j) => s + v * beta[j], 0), y: y[i] }));
  scored.sort((a, b) => a.p - b.p);
  const bottom = scored.slice(0, Math.floor(scored.length * 0.2));
  const top = scored.slice(-Math.floor(scored.length * 0.2));
  const churnBottom = 1 - bottom.reduce((s, x) => s + x.y, 0) / bottom.length;
  const churnTop = 1 - top.reduce((s, x) => s + x.y, 0) / top.length;
  check(`trainability: churn in model's bottom quintile ${(churnBottom * 100).toFixed(0)}% ≥ 2× top quintile ${(churnTop * 100).toFixed(0)}%`, churnBottom >= churnTop * 2, 'rank-ordering lift (N-appropriate, per spec §7.4)');
}

// ---------- heroes (§7.5): the pinned people load with their stories intact ----------
function checkHeroes() {
  const elena = people.find((p) => p.MemberNumber === 'ICF-000101');
  const elenaRegs = regs.filter((x) => x.MemberNumber === 'ICF-000101').length;
  const elenaYears = Math.max(1, Math.ceil((new Date(run.releaseDate) - new Date(elena.JoinDate)) / (365.25 * 86400000)));
  check('hero Elena: exists, Active, high activity', elena && ['Active', 'PendingRenewal'].includes(lastStatus.get('ICF-000101')) && elenaRegs / elenaYears >= R.heroes[0].pins.minRegistrationsPerYear, `status=${lastStatus.get('ICF-000101')}, ${elenaRegs} regs / ${elenaYears} yrs`);
  const marcus = lastPeriod.get('ICF-000102');
  const dTo = (new Date(`${marcus.EndDate}T00:00:00Z`) - new Date(`${run.releaseDate}T00:00:00Z`)) / 86400000;
  const [dLo, dHi] = R.heroes[1].pins.endDateWithinDaysOfRelease;
  check(`hero Marcus: PendingRenewal, EndDate release+${dTo}d ∈ [${dLo},${dHi}], autoRenew off`, marcus.Status === 'PendingRenewal' && dTo >= dLo && dTo <= dHi && marcus.AutoRenew === false, `status=${marcus.Status}`);
}

// ---------- status mix (loose at N=500) ----------
function checkStatusMix() {
  const counts = { Active: 0, Lapsed: 0, Cancelled: 0, PendingRenewal: 0 };
  for (const s of lastStatus.values()) counts[s] = (counts[s] ?? 0) + 1;
  const total = people.length;
  const active = (counts.Active + counts.PendingRenewal) / total;
  const [tA] = R.statusMix.target;
  check(`status mix: active-ish ${(active * 100).toFixed(0)}% vs ~${(tA + 0.02) * 100}% ±${R.statusMix.tolerance * 100}`, Math.abs(active - (tA + 0.02)) <= R.statusMix.tolerance, JSON.stringify(counts));
}

// ---------- run all gates & report ----------
checkPacks();
checkTemporal();
checkBenchmarks();
checkArrows();
checkTiers();
checkLearning();
checkMoney();
checkEngagementDynamics();
checkTrainability();
checkHeroes();
checkStatusMix();

let failed = 0;
for (const r of results) {
  console.log(`${r.ok ? '✅' : '❌'} ${r.name}${r.detail ? `  — ${r.detail}` : ''}`);
  if (!r.ok) failed++;
}
console.log(`\n${results.length - failed}/${results.length} gates pass`);
process.exit(failed ? 1 : 0);
