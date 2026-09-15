<?php
/**
 * Template for the "membership-dues" page (/faq/membership-dues/).
 *
 * Body copy is the static page's <main> verbatim; only the links are rewritten.
 * Selected automatically by slug, so no template assignment is needed.
 *
 * @package Terroir
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

get_header();
?>

<main id="main">

  <section class="border-b border-charcoal/15 bg-milk">
    <div class="mx-auto max-w-6xl px-5 py-12 md:px-10 md:py-14">
      <p class="m-0 text-sm"><a href="<?php echo esc_url( home_url( '/faq/' ) ); ?>" class="text-brick underline underline-offset-2">&larr; All FAQ topics</a></p>
      <p class="mt-4 text-xs font-bold uppercase tracking-[.14em] text-brick">FAQ &middot; Membership &amp; dues</p>
      <h1 class="font-display font-display-tight m-0 mb-4 mt-2 max-w-[20ch] text-[clamp(34px,4.8vw,60px)] font-extrabold leading-[0.96] tracking-tight text-pasture">What it costs, and which tier fits.</h1>
      <p class="m-0 max-w-[58ch] text-[17px] text-[#3A403C]">Four tiers, one federation, and a billing model with no small print. If your question is about renewals rather than joining, it is on the <a href="<?php echo esc_url( home_url( '/faq/renewals-account/' ) ); ?>" class="text-brick underline underline-offset-2">renewals and account page</a>.</p>
    </div>
  </section>

  <section class="mx-auto max-w-[78ch] px-5 py-10">
    <div class="rounded-2xl border-[1.5px] border-charcoal bg-milk p-5">
      <label for="faq-filter" class="font-display mb-1 block text-sm font-bold">Filter these questions</label>
      <input id="faq-filter" type="search" autocomplete="off" placeholder="dues, renewal, exam, directory&hellip;"
             class="w-full rounded-xl border-[1.5px] border-charcoal bg-milk px-4 py-2.5 text-[15px]">
      <div class="mt-3 flex flex-wrap items-center justify-between gap-3">
        <p id="faq-filter-count" class="m-0 text-sm font-semibold text-mid" role="status" aria-live="polite">10 questions on this page.</p>
        <button id="faq-filter-clear" type="button" class="rounded-full border-[1.5px] border-charcoal px-5 py-2 text-sm font-semibold hover:bg-charcoal hover:text-milk">Clear</button>
      </div>
      <noscript>
        <p class="m-0 mt-3 rounded-xl border-[1.5px] border-brick px-4 py-2 text-sm text-brick">Filtering needs JavaScript. Every question is listed below.</p>
      </noscript>
    </div>

    <section class="js-faq-group mb-8" aria-labelledby="g-cost">
      <h2 id="g-cost" class="font-display m-0 mb-4 text-[26px] font-extrabold tracking-tight text-pasture">Cost and tiers</h2>
      <div class="space-y-3">
      <details class="js-faq-item rounded-2xl border-[1.5px] border-charcoal bg-milk p-5">
        <summary class="font-display cursor-pointer text-lg font-bold tracking-tight">What do membership dues cost?</summary>
        <div class="mt-3 text-[15px] text-[#3A403C]">
          <p class="m-0 mb-2">Four tiers, all annual. <b>Individual</b> is $170 a year, <b>Creamery</b> $480, <b>Retailer</b> $390 and <b>Affiliate</b> $260. There is no joining fee and no monthly plan &mdash; one payment covers twelve months.</p>
          <p class="m-0">Every tier carries the same vote, the same weekly brief, the same archive and the same discount on credential exams. What changes between tiers is how many people at your organization the membership covers and which extras come with it. The full rate card is on the <a href="<?php echo esc_url( home_url( '/join/' ) ); ?>" class="text-brick underline underline-offset-2">Join page</a>.</p>
        </div>
      </details>
      <details class="js-faq-item rounded-2xl border-[1.5px] border-charcoal bg-milk p-5">
        <summary class="font-display cursor-pointer text-lg font-bold tracking-tight">Which tier am I?</summary>
        <div class="mt-3 text-[15px] text-[#3A403C]">
          <p class="m-0 mb-2">The tier follows what your organization does, not how big it is. <b>Creamery</b> if you make cheese, from a two-vat farmstead to a regional plant. <b>Retailer</b> if you sell it, at a counter or into wholesale. <b>Affiliate</b> if you supply the trade &mdash; suppliers, laboratories, distributors, consultants. <b>Individual</b> if the membership is yours rather than an employer&rsquo;s.</p>
          <p class="m-0">A farmstead creamery with a shop attached should join as a Creamery: the cheaper of two applicable tiers is not the rule, the primary activity is. If you genuinely cannot tell, say what you do in an email to <a href="mailto:memberservices@morecheese.org" class="text-brick underline underline-offset-2">memberservices@morecheese.org</a> and someone will place you.</p>
        </div>
      </details>
      <details class="js-faq-item rounded-2xl border-[1.5px] border-charcoal bg-milk p-5">
        <summary class="font-display cursor-pointer text-lg font-bold tracking-tight">Is there a student or early-career rate?</summary>
        <div class="mt-3 text-[15px] text-[#3A403C]">
          <p class="m-0 mb-2">There is no separate student tier. The Individual tier is set at $170 partly so that it works for someone still training, and it is the tier most students, apprentices and people between jobs join on.</p>
          <p class="m-0">It carries the same credential discount as every other tier, which is the part that matters if you are working up the ladder. Education Programs also holds a small number of course places each year for members in their first two years in the trade; ask, because they are not advertised.</p>
        </div>
      </details>
      <details class="js-faq-item rounded-2xl border-[1.5px] border-charcoal bg-milk p-5">
        <summary class="font-display cursor-pointer text-lg font-bold tracking-tight">We are a team of five. Do we need five memberships?</summary>
        <div class="mt-3 text-[15px] text-[#3A403C]">
          <p class="m-0 mb-2">No. A <b>Creamery</b> membership covers up to six staff and a <b>Retailer</b> membership up to four, under the one payment. Each covered person gets their own account, their own copy of the brief and their own member rate on courses and events. The organization gets one vote.</p>
          <p class="m-0">Adding or swapping a name is a note to Membership Operations, not a new invoice. If you need to cover more people than the tier allows, write to <a href="mailto:memberservices@morecheese.org" class="text-brick underline underline-offset-2">memberservices@morecheese.org</a> &mdash; the answer is usually a second membership at the same rate rather than a bespoke deal.</p>
        </div>
      </details>
      </div>
    </section>

    <section class="js-faq-group mb-8" aria-labelledby="g-billing">
      <h2 id="g-billing" class="font-display m-0 mb-4 text-[26px] font-extrabold tracking-tight text-pasture">Billing, refunds and hardship</h2>
      <div class="space-y-3">
      <details class="js-faq-item rounded-2xl border-[1.5px] border-charcoal bg-milk p-5">
        <summary class="font-display cursor-pointer text-lg font-bold tracking-tight">If we join in August, do we pay a full year?</summary>
        <div class="mt-3 text-[15px] text-[#3A403C]">
          <p class="m-0 mb-2">Yes, and you get a full year. Dues are billed on your join date and your membership year runs from that day, not from January. Join in August and you renew in August.</p>
          <p class="m-0">That is deliberate: it means nobody buys a part-year, and nobody has to work out a proration. It also means the renewal reminders land at the same point in your year every year.</p>
        </div>
      </details>
      <details class="js-faq-item rounded-2xl border-[1.5px] border-charcoal bg-milk p-5">
        <summary class="font-display cursor-pointer text-lg font-bold tracking-tight">Is there a joining fee, and what if I am rejoining?</summary>
        <div class="mt-3 text-[15px] text-[#3A403C]">
          <p class="m-0 mb-2">No joining fee, and no reinstatement fee for coming back. Former members rejoin at the current rate for their tier.</p>
          <p class="m-0">Your record comes back with you &mdash; credentials held, courses completed, cohort, competition entries and the years you were a member. If it does not appear within a day or two of rejoining, tell <a href="mailto:memberservices@morecheese.org" class="text-brick underline underline-offset-2">memberservices@morecheese.org</a> and they will reattach it.</p>
        </div>
      </details>
      <details class="js-faq-item rounded-2xl border-[1.5px] border-charcoal bg-milk p-5">
        <summary class="font-display cursor-pointer text-lg font-bold tracking-tight">Can I get a refund if it turns out not to be a fit?</summary>
        <div class="mt-3 text-[15px] text-[#3A403C]">
          <p class="m-0 mb-2">Dues are not refundable once a membership is active, because the brief, the archive and the member rates are available from the first day. That is the plain answer and it is worth knowing before you join.</p>
          <p class="m-0">The exception is circumstance rather than second thoughts: if something has happened &mdash; a closure, an illness, a business that folded three weeks after joining &mdash; write to <a href="mailto:memberservices@morecheese.org" class="text-brick underline underline-offset-2">memberservices@morecheese.org</a>. Those are read by a person, not a policy, and they are usually resolved in the member&rsquo;s favor.</p>
        </div>
      </details>
      <details class="js-faq-item rounded-2xl border-[1.5px] border-charcoal bg-milk p-5">
        <summary class="font-display cursor-pointer text-lg font-bold tracking-tight">How do we pay, and can we be invoiced?</summary>
        <div class="mt-3 text-[15px] text-[#3A403C]">
          <p class="m-0 mb-2">Card or bank transfer. If your organization needs a purchase order, a formal invoice or payment in a currency other than US dollars, ask <a href="mailto:finance@morecheese.org" class="text-brick underline underline-offset-2">finance@morecheese.org</a> and they will set it up before the membership starts rather than after.</p>
          <p class="m-0">Members outside the United States pay the same dues in the same currency; there is no international surcharge and no separate international tier. A third of the membership is outside North America.</p>
        </div>
      </details>
      <details class="js-faq-item rounded-2xl border-[1.5px] border-charcoal bg-milk p-5">
        <summary class="font-display cursor-pointer text-lg font-bold tracking-tight">What if the business cannot afford dues this year?</summary>
        <div class="mt-3 text-[15px] text-[#3A403C]">
          <p class="m-0 mb-2">Ask. Since 2025 the board has offered hardship dues for members whose creamery has closed, is close to closing, or has had a year that makes $480 an unreasonable ask.</p>
          <p class="m-0">Write to Membership Operations at <a href="mailto:memberservices@morecheese.org" class="text-brick underline underline-offset-2">memberservices@morecheese.org</a>. The conversation is confidential, it does not go to a committee, it does not affect your standing or your credentials, and the answer is usually yes. A member who drops out stops getting the brief and the archive, which is the opposite of what someone in that position needs.</p>
        </div>
      </details>
      <details class="js-faq-item rounded-2xl border-[1.5px] border-charcoal bg-milk p-5">
        <summary class="font-display cursor-pointer text-lg font-bold tracking-tight">Are dues a deductible business expense?</summary>
        <div class="mt-3 text-[15px] text-[#3A403C]">
          <p class="m-0 mb-2">In most places professional association dues are an ordinary business expense, but we are not in a position to advise on your tax position and we will not pretend otherwise &mdash; ask your own accountant.</p>
          <p class="m-0">What we can give you is the paperwork: a dated receipt for every payment, an invoice in your organization&rsquo;s name if you need one for a purchase ledger, and a letter confirming the membership term and standing. All three come from <a href="mailto:finance@morecheese.org" class="text-brick underline underline-offset-2">finance@morecheese.org</a>.</p>
        </div>
      </details>
      </div>
    </section>

    <p id="faq-filter-empty" hidden class="rounded-2xl border-[1.5px] border-brick bg-milk p-6 text-center text-[15px] text-brick">
      No question on this page matches that. Try a shorter word, check the <a href="<?php echo esc_url( home_url( '/faq/' ) ); ?>" class="underline underline-offset-2">other FAQ topics</a>, or <a href="<?php echo esc_url( home_url( '/contact/' ) ); ?>" class="underline underline-offset-2">write to Member Services</a>.
    </p>
  </section>

  <section class="border-t-[1.5px] border-charcoal bg-milk">
    <div class="mx-auto max-w-6xl px-5 py-12 md:px-10">
      <h2 class="font-display m-0 mb-5 text-[28px] font-extrabold tracking-tight">Other FAQ topics</h2>
      <div class="grid grid-cols-1 gap-3 md:grid-cols-2 nav:grid-cols-4">
        <a href="<?php echo esc_url( home_url( '/faq/membership-benefits/' ) ); ?>" class="rounded-2xl border-[1.5px] border-charcoal bg-milk p-4 no-underline transition hover:bg-clover">
          <h3 class="font-display m-0 text-[17px] font-bold leading-tight tracking-tight text-charcoal">Benefits &amp; services</h3>
          <p class="m-0 mt-1 text-[13px] text-mid">What a membership actually gets you &mdash; and what it does not.</p>
        </a>
        <a href="<?php echo esc_url( home_url( '/faq/renewals-account/' ) ); ?>" class="rounded-2xl border-[1.5px] border-charcoal bg-milk p-4 no-underline transition hover:bg-clover">
          <h3 class="font-display m-0 text-[17px] font-bold leading-tight tracking-tight text-charcoal">Renewals &amp; your account</h3>
          <p class="m-0 mt-1 text-[13px] text-mid">Renewal dates, covered staff, receipts and directory entries.</p>
        </a>
        <a href="<?php echo esc_url( home_url( '/faq/certifications/' ) ); ?>" class="rounded-2xl border-[1.5px] border-charcoal bg-milk p-4 no-underline transition hover:bg-clover">
          <h3 class="font-display m-0 text-[17px] font-bold leading-tight tracking-tight text-charcoal">Certifications</h3>
          <p class="m-0 mt-1 text-[13px] text-mid">The four rungs, the exam, reconfirmation and continuing education.</p>
        </a>
        <a href="<?php echo esc_url( home_url( '/faq/conferences-events/' ) ); ?>" class="rounded-2xl border-[1.5px] border-charcoal bg-milk p-4 no-underline transition hover:bg-clover">
          <h3 class="font-display m-0 text-[17px] font-bold leading-tight tracking-tight text-charcoal">Conferences &amp; events</h3>
          <p class="m-0 mt-1 text-[13px] text-mid">The October conference, the virtual strand and regional meetups.</p>
        </a>
        <a href="<?php echo esc_url( home_url( '/faq/publications-resources/' ) ); ?>" class="rounded-2xl border-[1.5px] border-charcoal bg-milk p-4 no-underline transition hover:bg-clover">
          <h3 class="font-display m-0 text-[17px] font-bold leading-tight tracking-tight text-charcoal">Publications &amp; resources</h3>
          <p class="m-0 mt-1 text-[13px] text-mid">The Monday brief, the archive, research and sponsorship.</p>
        </a>
        <a href="<?php echo esc_url( home_url( '/faq/career-governance/' ) ); ?>" class="rounded-2xl border-[1.5px] border-charcoal bg-milk p-4 no-underline transition hover:bg-clover">
          <h3 class="font-display m-0 text-[17px] font-bold leading-tight tracking-tight text-charcoal">Careers, committees &amp; governance</h3>
          <p class="m-0 mt-1 text-[13px] text-mid">Vacancies, committee seats, the election, ethics and advocacy.</p>
        </a>
        <a href="<?php echo esc_url( home_url( '/faq/organization-directory/' ) ); ?>" class="rounded-2xl border-[1.5px] border-charcoal bg-milk p-4 no-underline transition hover:bg-clover">
          <h3 class="font-display m-0 text-[17px] font-bold leading-tight tracking-tight text-charcoal">Directory &amp; who to contact</h3>
          <p class="m-0 mt-1 text-[13px] text-mid">The organization directory, your entry, and which inbox to use.</p>
        </a>
      </div>
      <div class="mt-8 rounded-2xl bg-pasture px-6 py-8 text-white md:px-10">
        <h2 class="font-display m-0 text-[26px] font-extrabold tracking-tight">Still stuck?</h2>
        <p class="m-0 mt-2 max-w-[58ch] text-[15px] opacity-95">Member Services reads everything and answers most things within two business days. Write to <a href="mailto:memberservices@morecheese.org" class="text-clover underline underline-offset-2">memberservices@morecheese.org</a>, or use the inquiry page if you would rather fill in a form.</p>
        <a href="<?php echo esc_url( home_url( '/contact/' ) ); ?>" class="mt-5 inline-block rounded-full bg-milk px-6 py-3 text-sm font-bold text-pasture no-underline hover:bg-clover">Contact the Federation</a>
      </div>
    </div>
  </section>
</main>

<?php
get_footer();
