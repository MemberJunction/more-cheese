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

import { rng } from './rng.mjs';
import { iso, addDays, parseDate } from './dates.mjs';

export function buildMoney(cfg, people, periods, events, registrations) {
  const { R, seed, release } = cfg;
  const O = R.orders;
  const T = O.paymentTiming;

  // ---------- products: one Membership product per tier + the event products ----------
  const products = R.membership.tiers.list.map((t) => ({
    ProductKey: `PROD-MEM-${t.name.toUpperCase()}`, Name: `${t.name} Membership (annual)`,
    ProductType: 'Membership', UnitPrice: t.dues, IsSharedDemo: true,
  }));
  for (const [type, price] of Object.entries(O.eventPrices)) {
    products.push({ ProductKey: `PROD-EVT-${type.toUpperCase()}`, Name: `${type} Registration`, ProductType: 'Event', UnitPrice: price, IsSharedDemo: true });
  }

  const personByKey = new Map(people.map((p) => [p.MemberNumber, p]));
  const eventByKey = new Map(events.map((e) => [e.EventKey, e]));
  const orders = [];
  const orderLines = [];
  const payments = [];

  const pushOrder = (key, member, productKey, amount, orderDate, dueDate, paymentDate, method) => {
    // a payment dated after release hasn't happened yet — the order ages instead
    const paid = paymentDate !== null && paymentDate <= release;
    orders.push({
      OrderKey: key, MemberNumber: member, OrderType: 'Sale', Status: 'Posted',
      OrderDate: iso(orderDate), DueDate: iso(dueDate), TotalGross: amount,
      PaymentStatus: paid ? 'Paid' : dueDate < release ? 'Overdue' : 'Unpaid',
      IsSharedDemo: true,
    });
    orderLines.push({ LineKey: `${key}-L1`, OrderKey: key, ProductKey: productKey, Quantity: 1, UnitPrice: amount, LineTotal: amount, IsSharedDemo: true });
    if (paid) {
      payments.push({ PaymentKey: `PAY-${key}`, OrderKey: key, Amount: amount, PaymentDate: iso(paymentDate), Method: method, Status: 'Captured', IsSharedDemo: true });
    }
  };

  // ---------- dues: one order per membership period (order-per-cycle, BO-D40 verbatim) ----------
  const NET_TERMS_TIERS = new Set(['SmallBusiness', 'Corporate']);
  for (const per of periods) {
    const p = personByKey.get(per.MemberNumber);
    if (!p) continue;
    const r = rng(seed, `pay:${per.PeriodKey}`);
    const start = parseDate(per.StartDate);
    const netTerms = NET_TERMS_TIERS.has(per.MembershipTier);
    const orderDate = start; // the bill posts at period start
    const dueDate = netTerms ? addDays(start, T.netTerms.termsDays) : start;

    let paymentDate;
    let method;
    if (netTerms) {
      method = r.pick(['ACH', 'Check', 'Wire']);
      paymentDate = r.bernoulli(T.netTerms.lateShare)
        ? addDays(dueDate, Math.min(T.netTerms.capDays, Math.max(1, Math.round(r.lognormal(Math.log(T.netTerms.daysLateMedian), T.netTerms.daysLateSigma)))))
        : addDays(dueDate, -r.int(0, 5));
    } else if (per.AutoRenew) {
      method = 'CreditCard';
      paymentDate = r.bernoulli(T.autopayFailShare) ? addDays(dueDate, r.int(3, T.autopayRetryDaysMax)) : dueDate;
    } else {
      method = r.pick(['CreditCard', 'CreditCard', 'Check']);
      paymentDate = r.bernoulli(T.manualDues.lateShare)
        ? addDays(dueDate, r.int(1, T.manualDues.graceLateDaysMax))   // late, inside grace
        : addDays(dueDate, -r.int(0, T.manualDues.earlyDaysMax));     // early or on time
    }
    pushOrder(`ORD-D-${per.PeriodKey}`, per.MemberNumber, `PROD-MEM-${per.MembershipTier.toUpperCase()}`, per.DuesAmount, orderDate, dueDate, paymentDate, method);

    // PendingRenewal: the NEXT cycle's renewal order is already open and unpaid —
    // the renewal-outreach queue, visible in the money data
    if (per.Status === 'PendingRenewal') {
      const nextDue = addDays(parseDate(per.EndDate), 1);
      pushOrder(`ORD-R-${per.MemberNumber}`, per.MemberNumber, `PROD-MEM-${per.MembershipTier.toUpperCase()}`, per.DuesAmount, addDays(nextDue, -O.renewalBilledDaysAhead), nextDue, null, null);
    }
  }

  // ---------- event registrations: card-at-checkout, same day ----------
  for (const reg of registrations) {
    const ev = eventByKey.get(reg.EventKey);
    if (!ev?.IsPaid) continue;
    const price = O.eventPrices[ev.EventType];
    if (!price) continue;
    const d = parseDate(reg.RegisteredOn);
    pushOrder(`ORD-E-${reg.RegKey}`, reg.MemberNumber, `PROD-EVT-${ev.EventType.toUpperCase()}`, price, d, d, d, 'CreditCard');
  }

  return { products, orders, orderLines, payments };
}
