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

import { derivedTransaction } from '../../core/patterns.mjs';
import { iso, addDays, parseDate } from '../../core/dates.mjs';

export function buildMoney(cfg, people, periods, events, registrations) {
  const { R, seed, release } = cfg;
  const O = R.orders;
  const P = O.paymentProfiles;

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
      return netTermsTiers.has(per.MembershipTier) ? P.netTerms : per.AutoRenew ? P.autopay : P.manual;
    },
    emit: (per, t) => {
      const start = parseDate(per.StartDate);
      const orderDate = start; // the bill posts at period start
      const dueDate = addDays(start, t.termsDays);
      const paymentDate = addDays(dueDate, t.offsetDays);
      pushOrder(`ORD-D-${per.PeriodKey}`, per.MemberNumber, `PROD-MEM-${per.MembershipTier.toUpperCase()}`, per.DuesAmount, orderDate, dueDate, paymentDate, t.method);

      // PendingRenewal: the NEXT cycle's renewal order is already open and unpaid —
      // the renewal-outreach queue, visible in the money data
      if (per.Status === 'PendingRenewal') {
        const nextDue = addDays(parseDate(per.EndDate), 1);
        pushOrder(`ORD-R-${per.MemberNumber}`, per.MemberNumber, `PROD-MEM-${per.MembershipTier.toUpperCase()}`, per.DuesAmount, addDays(nextDue, -O.renewalBilledDaysAhead), nextDue, null, null);
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
      pushOrder(`ORD-E-${reg.RegKey}`, reg.MemberNumber, `PROD-EVT-${ev.EventType.toUpperCase()}`, O.eventPrices[ev.EventType], d, addDays(d, t.offsetDays), addDays(d, t.offsetDays), t.method);
    },
  });

  return { products, orders, orderLines, payments };
}
