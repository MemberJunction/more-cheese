// Spec §5 step 5: the money chain — every billable fact becomes an order and (usually) a
// payment, shaped to bizapps-orders' published design:
//
//   · one renewal Order per membership cycle (the posted Order IS the bill — no invoices)
//   · product-typed order lines (Membership per tier, Event registration)
//   · payment timing per the approved 3-part mixture: card-at-checkout (event regs),
//     auto-pay ON the due date (plus a small failed-card retry tail), manual dues spread
//     early-to-grace, and business tiers on NET TERMS with the sourced B2B late curve
//   · a payment landing after release day HASN'T HAPPENED yet — the order sits Unpaid or
//     Overdue, which is what gives the A/R aging demo real rows
//   · PendingRenewal members carry an OPEN renewal order for the next cycle — the
//     renewal-outreach queue (Marcus) exists in the money data too

import { rng } from '../../engine/rng.mjs';
import { derivedTransaction } from '../../engine/patterns.mjs';
import { iso, addDays, parseDate } from '../../engine/dates.mjs';

export function buildMoney(cfg, people, periods, events, registrations, programs) {
  const { R, seed, release } = cfg;
  const O = R.orders;
  const P = O.paymentProfiles;

  // ---------- products: one Membership product per tier + the event products ----------
  const products = R.membership.catalog.tiers.map((t) => ({
    ProductKey: `PROD-MEM-${t.name.toUpperCase()}`, Name: `${t.name} Membership (annual)`,
    ProductType: 'Membership', UnitPrice: t.dues, IsSharedDemo: true,
  }));
  for (const [type, price] of Object.entries(O.eventPrices)) {
    products.push({ ProductKey: `PROD-EVT-${type.toUpperCase()}`, Name: `${type} Registration`, ProductType: 'Event', UnitPrice: price, IsSharedDemo: true });
  }
  // the rest of what an association actually sells — exam fees, competition entries,
  // publications, sponsorship, merchandise, the job board, donations
  for (const c of O.catalogue ?? []) {
    products.push({ ProductKey: c.key, Name: c.name, ProductType: c.type, UnitPrice: c.price, IsSharedDemo: true });
  }
  const priceOf = new Map(products.map((p) => [p.ProductKey, p.UnitPrice]));

  // Catalogue prices are CURRENT. A line is charged the price of ITS year, so a 2014 order
  // does not read at 2026 money and a revenue-by-year chart shows a price effect as well as
  // a volume effect.
  const infl = O.priceIndex?.annualInflation ?? 0;
  const releaseYear = release.getUTCFullYear();
  const atYear = (amount, year) => Math.round(amount / Math.pow(1 + infl, releaseYear - year));

  const personByKey = new Map(people.map((p) => [p.MemberNumber, p]));
  const eventByKey = new Map(events.map((e) => [e.EventKey, e]));
  const orders = [];
  const orderLines = [];
  const payments = [];

  // extraLines: [{ productKey, quantity }] — real orders bundle (a conference registration
  // that also picks up merchandise, a renewal that adds the journal or a donation)
  const pushOrder = (key, member, productKey, amount, orderDate, dueDate, paymentDate, method, extraLines = []) => {
    // a payment dated after release hasn't happened yet — the order ages instead
    const paid = paymentDate !== null && paymentDate <= release;
    orders.push({
      OrderKey: key, MemberNumber: member, OrderType: 'Sale', Status: 'Posted',
      OrderDate: iso(orderDate), DueDate: iso(dueDate), TotalGross: amount,
      PaymentStatus: paid ? 'Paid' : dueDate < release ? 'Overdue' : 'Unpaid',
      IsSharedDemo: true,
    });
    orderLines.push({ LineKey: `${key}-L1`, OrderKey: key, ProductKey: productKey, Quantity: 1, UnitPrice: amount, LineTotal: amount, IsSharedDemo: true });
    let total = amount;
    extraLines.forEach((x, i) => {
      const unit = atYear(priceOf.get(x.productKey) ?? 0, orderDate.getUTCFullYear());
      const qty = x.quantity ?? 1;
      orderLines.push({ LineKey: `${key}-L${i + 2}`, OrderKey: key, ProductKey: x.productKey, Quantity: qty, UnitPrice: unit, LineTotal: unit * qty, IsSharedDemo: true });
      total += unit * qty;
    });
    if (total !== amount) orders[orders.length - 1].TotalGross = total;
    if (paid) {
      payments.push({ PaymentKey: `PAY-${key}`, OrderKey: key, Amount: total, PaymentDate: iso(paymentDate), Method: method, Status: 'Captured', IsSharedDemo: true });
    }
  };

  // ---------- dues: one order per membership period (order-per-cycle, BO-D40 verbatim) ----------
  // Expressed through core's derivedTransaction: the timing mixture is DECLARED in the
  // ruleset (orders.paymentProfiles); this domain only picks the profile per period and
  // shapes the rows. Draw order (method pick → late bernoulli → offset) is the pattern's
  // contract — byte-identical to the previous hand-written branches.
  const netTermsTiers = new Set(P.netTerms.appliesToTiers);
  derivedTransaction({
    seed,
    parents: periods,
    streamKey: (per) => `pay:${per.PeriodKey}`,
    profileOf: (per) => {
      if (!personByKey.has(per.MemberNumber)) return null;
      const base = netTermsTiers.has(per.MembershipTier) ? P.netTerms : per.AutoRenew ? P.autopay : P.manual;
      // covid-year bills pay later (regime expression — lateShare scaled, capped)
      const covid = R.regimes.covid.years.includes(parseDate(per.StartDate).getUTCFullYear());
      return covid ? { ...base, lateShare: Math.min(0.95, base.lateShare * R.regimes.covid.paymentLateMultiplier) } : base;
    },
    emit: (per, t) => {
      const start = parseDate(per.StartDate);
      // renewal bills go out ahead of the cycle (the renewal notice); the FIRST period's
      // bill is part of joining, so it posts on the join date itself. Early payers pay
      // between bill arrival and the due date — never before the bill exists (the old
      // post-at-start version let the manual profile's early offsets produce 2,386
      // payments dated before their order).
      const isFirst = personByKey.get(per.MemberNumber)?.JoinDate === per.StartDate;
      const orderDate = isFirst ? start : addDays(start, -O.renewalBilledDaysAhead);
      const dueDate = addDays(start, t.termsDays);
      let paymentDate = addDays(dueDate, t.offsetDays);
      if (paymentDate < orderDate) paymentDate = orderDate; // early payers pay when the bill arrives
      // dues at the price of their own year, plus the odd journal subscription or donation
      const rAdd = rng(seed, `addon:${per.PeriodKey}`);
      const extras = [];
      if (rAdd.bernoulli(O.addOns?.journalShare ?? 0)) extras.push({ productKey: 'PROD-PUB-JOURNAL' });
      if (rAdd.bernoulli(O.addOns?.donationShare ?? 0)) extras.push({ productKey: 'PROD-DONATION' });
      pushOrder(`ORD-D-${per.PeriodKey}`, per.MemberNumber, `PROD-MEM-${per.MembershipTier.toUpperCase()}`, atYear(per.DuesAmount, start.getUTCFullYear()), orderDate, dueDate, paymentDate, t.method, extras);

      // PendingRenewal: the NEXT cycle's renewal order is already open and unpaid —
      // the renewal-outreach queue, visible in the money data
      if (per.Status === 'PendingRenewal') {
        const nextDue = addDays(parseDate(per.EndDate), 1);
        pushOrder(`ORD-R-${per.MemberNumber}`, per.MemberNumber, `PROD-MEM-${per.MembershipTier.toUpperCase()}`, atYear(per.DuesAmount, nextDue.getUTCFullYear()), addDays(nextDue, -O.renewalBilledDaysAhead), nextDue, null, null);
      }
    },
  });

  // ---------- event registrations: card-at-checkout (declared `checkout` profile) ----------
  derivedTransaction({
    seed,
    parents: registrations,
    streamKey: (reg) => `pay:${reg.RegKey}`,
    profileOf: (reg) => {
      const ev = eventByKey.get(reg.EventKey);
      return ev?.IsPaid && O.eventPrices[ev.EventType] ? P.checkout : null;
    },
    emit: (reg, t) => {
      const ev = eventByKey.get(reg.EventKey);
      const d = parseDate(reg.RegisteredOn);
      // conference registrations often pick up merchandise at the same checkout
      const rM = rng(seed, `addon:${reg.RegKey}`);
      const extras = ev.EventType === 'Conference' && rM.bernoulli(O.addOns?.conferenceMerchShare ?? 0)
        ? [{ productKey: rM.pick(['PROD-MERCH-APRON', 'PROD-MERCH-BOOK']) }] : [];
      pushOrder(`ORD-E-${reg.RegKey}`, reg.MemberNumber, `PROD-EVT-${ev.EventType.toUpperCase()}`, atYear(O.eventPrices[ev.EventType], d.getUTCFullYear()), d, addDays(d, t.offsetDays), addDays(d, t.offsetDays), t.method, extras);
    },
  });

  // ---------- certifications and competitions: real billable facts that used to be free ----------
  // 124 credentials and 445 competition entries generated no revenue at all.
  for (const mc of programs?.memberCertifications ?? []) {
    const rC = rng(seed, `certfee:${mc.MemberCertKey}`);
    if (!rC.bernoulli(O.certificationFees?.examShare ?? 0)) continue;
    const d = parseDate(mc.EnrolledOn);
    const yr = d.getUTCFullYear();
    pushOrder(`ORD-C-${mc.MemberCertKey}`, mc.MemberNumber, 'PROD-CERT-EXAM', atYear(priceOf.get('PROD-CERT-EXAM'), yr), d, addDays(d, 14), addDays(d, rC.int(0, 10)), 'CreditCard');
    // an expired credential that was renewed pays a recertification fee
    if (mc.Status === 'Expired' && rC.bernoulli(O.certificationFees?.recertShare ?? 0)) {
      const rd = parseDate(mc.ExpiresOn);
      if (rd <= release) pushOrder(`ORD-CR-${mc.MemberCertKey}`, mc.MemberNumber, 'PROD-CERT-RECERT', atYear(priceOf.get('PROD-CERT-RECERT'), rd.getUTCFullYear()), rd, addDays(rd, 14), addDays(rd, rC.int(0, 12)), 'CreditCard');
    }
  }
  for (const e of programs?.competitionEntries ?? []) {
    const rE = rng(seed, `compfee:${e.EntryKey}`);
    if (!rE.bernoulli(O.competitionFees?.share ?? 0)) continue;
    // entries are lodged ahead of the July judging
    const d = new Date(Date.UTC(e.EntryYear, 4, 1 + rE.int(0, 40)));
    if (d > release) continue;
    pushOrder(`ORD-X-${e.EntryKey}`, e.MemberNumber, 'PROD-COMP-ENTRY', atYear(priceOf.get('PROD-COMP-ENTRY'), e.EntryYear), d, addDays(d, 7), addDays(d, rE.int(0, 5)), 'CreditCard');
  }

  // ---------- payment lifecycle (feedback 2026-07-16): Failed/Denied attempts, retries,
  // in-flight payments. DELIBERATE causal-vs-noise mix: base failure rate is pure noise;
  // low-affluence members' cards fail MORE (the causal component an analyst can find).
  // A retry that would land after release hasn't happened — the order goes back to aging.
  const PO = O.paymentOutcomes;
  const failedAttempts = [];
  const dropCaptured = new Set();
  for (const pay of payments) {
    if (pay.Method !== 'CreditCard') continue; // card failures only — ACH/checks fail differently (not modeled)
    const person = personByKey.get(orders.find((o) => o.OrderKey === pay.OrderKey)?.MemberNumber);
    if (!person) continue;
    const r = rng(seed, `payfail:${pay.PaymentKey}`);
    const pFail = PO.noiseFailShare + (person._phi < PO.lowPhiCut ? PO.lowPhiFailBonus : 0);
    if (!r.bernoulli(pFail)) continue;
    const denied = r.bernoulli(PO.deniedShareOfFailed);
    failedAttempts.push({
      PaymentKey: `${pay.PaymentKey}-F1`, OrderKey: pay.OrderKey, Amount: pay.Amount,
      PaymentDate: pay.PaymentDate, Method: pay.Method, Status: denied ? 'Denied' : 'Failed', IsSharedDemo: true,
    });
    const retry = addDays(parseDate(pay.PaymentDate), 1 + r.int(0, PO.retryDaysMax - 1));
    if (retry > release) {
      // the retry hasn't happened yet — order returns to aging (the failed card IS the story)
      dropCaptured.add(pay.PaymentKey);
      const ord = orders.find((o) => o.OrderKey === pay.OrderKey);
      if (ord) ord.PaymentStatus = parseDate(ord.DueDate) < release ? 'Overdue' : 'Unpaid';
    } else {
      pay.PaymentDate = iso(retry); // captured on retry
    }
  }
  // REFUNDS: a share of paid no-shows actually get their money back. Recorded the way an
  // AMS records it — a NEGATIVE payment against the original order with Status 'Refunded'
  // (the status was already permitted by the schema and had never been used).
  const refunds = [];
  const orderByKey = new Map(orders.map((o) => [o.OrderKey, o]));
  for (const reg of registrations) {
    if (reg.Attended !== false) continue;
    const key = `ORD-E-${reg.RegKey}`;
    const ord = orderByKey.get(key);
    if (!ord || ord.PaymentStatus !== 'Paid') continue;
    const rR = rng(seed, `refund:${reg.RegKey}`);
    if (!rR.bernoulli(O.refunds?.shareOfPaidNoShows ?? 0)) continue;
    const paidOn = payments.find((x) => x.OrderKey === key)?.PaymentDate;
    if (!paidOn) continue;
    const when = addDays(parseDate(paidOn), rR.int(5, 45));
    if (when > release) continue;
    refunds.push({
      PaymentKey: `PAY-${key}-R`, OrderKey: key, Amount: -ord.TotalGross,
      PaymentDate: iso(when), Method: 'CreditCard', Status: 'Refunded', IsSharedDemo: true,
    });
    ord.OrderType = 'Sale';   // the sale stands; the refund is its own ledger line
  }

  const finalPayments = payments.filter((x) => !dropCaptured.has(x.PaymentKey)).concat(failedAttempts).concat(refunds);
  // in-flight: captures within the settlement window of release are still InProgress
  const inflightCut = iso(addDays(release, -PO.inProgressWindowDays));
  for (const pay of finalPayments) {
    if (pay.Status === 'Captured' && pay.PaymentDate >= inflightCut) pay.Status = 'InProgress';
  }

  return { products, orders, orderLines, payments: finalPayments };
}
