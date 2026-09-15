<?php
/**
 * Template for the "faq" page (/faq/).
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
      <p class="text-xs font-bold uppercase tracking-[.14em] text-brick">Help</p>
      <h1 class="font-display font-display-tight m-0 mb-4 mt-2 text-[clamp(38px,5.4vw,68px)] font-extrabold leading-[0.94] tracking-tight text-pasture">Questions we get weekly.</h1>
      <p class="m-0 max-w-[58ch] text-[17px] text-[#3A403C]">Eighty-one answers across eight topics, plus the ten we are asked most. Start with a topic, or filter the quick answers below. If yours is not here, <a href="<?php echo esc_url( home_url( '/contact/' ) ); ?>" class="text-brick underline underline-offset-2">ask us</a>.</p>
    </div>
  </section>

  <section class="mx-auto max-w-6xl px-5 py-12 md:px-10" aria-labelledby="topics-h">
    <h2 id="topics-h" class="font-display m-0 mb-2 text-[34px] font-extrabold tracking-tight">Browse by topic</h2>
    <p class="m-0 mb-6 max-w-[62ch] text-[15px] text-mid">Each topic page carries its own filter box, so you can search inside it without scrolling.</p>
    <div class="grid grid-cols-1 gap-3 md:grid-cols-2 nav:grid-cols-4">
        <a href="<?php echo esc_url( home_url( '/faq/membership-dues/' ) ); ?>" class="flex flex-col rounded-2xl border-[1.5px] border-charcoal bg-milk p-5 no-underline transition hover:bg-clover">
          <span aria-hidden="true" class="font-display text-[20px] font-bold text-brick">&#36;</span>
          <h3 class="font-display m-0 mt-1 text-[19px] font-bold leading-tight tracking-tight text-charcoal">Membership &amp; dues</h3>
          <p class="m-0 mt-2 flex-1 text-[14px] text-[#3A403C]">What a membership costs, which tier fits, and how billing works.</p>
          <span class="mt-3 text-[13px] font-bold text-pasture">Open topic &rarr;</span>
        </a>
        <a href="<?php echo esc_url( home_url( '/faq/membership-benefits/' ) ); ?>" class="flex flex-col rounded-2xl border-[1.5px] border-charcoal bg-milk p-5 no-underline transition hover:bg-clover">
          <span aria-hidden="true" class="font-display text-[20px] font-bold text-brick">&#10003;</span>
          <h3 class="font-display m-0 mt-1 text-[19px] font-bold leading-tight tracking-tight text-charcoal">Benefits &amp; services</h3>
          <p class="m-0 mt-2 flex-1 text-[14px] text-[#3A403C]">What a membership actually gets you &mdash; and what it does not.</p>
          <span class="mt-3 text-[13px] font-bold text-pasture">Open topic &rarr;</span>
        </a>
        <a href="<?php echo esc_url( home_url( '/faq/renewals-account/' ) ); ?>" class="flex flex-col rounded-2xl border-[1.5px] border-charcoal bg-milk p-5 no-underline transition hover:bg-clover">
          <span aria-hidden="true" class="font-display text-[20px] font-bold text-brick">&#8635;</span>
          <h3 class="font-display m-0 mt-1 text-[19px] font-bold leading-tight tracking-tight text-charcoal">Renewals &amp; your account</h3>
          <p class="m-0 mt-2 flex-1 text-[14px] text-[#3A403C]">Renewal dates, covered staff, receipts and directory entries.</p>
          <span class="mt-3 text-[13px] font-bold text-pasture">Open topic &rarr;</span>
        </a>
        <a href="<?php echo esc_url( home_url( '/faq/certifications/' ) ); ?>" class="flex flex-col rounded-2xl border-[1.5px] border-charcoal bg-milk p-5 no-underline transition hover:bg-clover">
          <span aria-hidden="true" class="font-display text-[20px] font-bold text-brick">&#9733;</span>
          <h3 class="font-display m-0 mt-1 text-[19px] font-bold leading-tight tracking-tight text-charcoal">Certifications</h3>
          <p class="m-0 mt-2 flex-1 text-[14px] text-[#3A403C]">The four rungs, the exam, reconfirmation and continuing education.</p>
          <span class="mt-3 text-[13px] font-bold text-pasture">Open topic &rarr;</span>
        </a>
        <a href="<?php echo esc_url( home_url( '/faq/conferences-events/' ) ); ?>" class="flex flex-col rounded-2xl border-[1.5px] border-charcoal bg-milk p-5 no-underline transition hover:bg-clover">
          <span aria-hidden="true" class="font-display text-[20px] font-bold text-brick">&#9634;</span>
          <h3 class="font-display m-0 mt-1 text-[19px] font-bold leading-tight tracking-tight text-charcoal">Conferences &amp; events</h3>
          <p class="m-0 mt-2 flex-1 text-[14px] text-[#3A403C]">The October conference, the virtual strand and regional meetups.</p>
          <span class="mt-3 text-[13px] font-bold text-pasture">Open topic &rarr;</span>
        </a>
        <a href="<?php echo esc_url( home_url( '/faq/publications-resources/' ) ); ?>" class="flex flex-col rounded-2xl border-[1.5px] border-charcoal bg-milk p-5 no-underline transition hover:bg-clover">
          <span aria-hidden="true" class="font-display text-[20px] font-bold text-brick">&#9776;</span>
          <h3 class="font-display m-0 mt-1 text-[19px] font-bold leading-tight tracking-tight text-charcoal">Publications &amp; resources</h3>
          <p class="m-0 mt-2 flex-1 text-[14px] text-[#3A403C]">The Monday brief, the archive, research and sponsorship.</p>
          <span class="mt-3 text-[13px] font-bold text-pasture">Open topic &rarr;</span>
        </a>
        <a href="<?php echo esc_url( home_url( '/faq/career-governance/' ) ); ?>" class="flex flex-col rounded-2xl border-[1.5px] border-charcoal bg-milk p-5 no-underline transition hover:bg-clover">
          <span aria-hidden="true" class="font-display text-[20px] font-bold text-brick">&#9679;</span>
          <h3 class="font-display m-0 mt-1 text-[19px] font-bold leading-tight tracking-tight text-charcoal">Careers, committees &amp; governance</h3>
          <p class="m-0 mt-2 flex-1 text-[14px] text-[#3A403C]">Vacancies, committee seats, the election, ethics and advocacy.</p>
          <span class="mt-3 text-[13px] font-bold text-pasture">Open topic &rarr;</span>
        </a>
        <a href="<?php echo esc_url( home_url( '/faq/organization-directory/' ) ); ?>" class="flex flex-col rounded-2xl border-[1.5px] border-charcoal bg-milk p-5 no-underline transition hover:bg-clover">
          <span aria-hidden="true" class="font-display text-[20px] font-bold text-brick">&#9678;</span>
          <h3 class="font-display m-0 mt-1 text-[19px] font-bold leading-tight tracking-tight text-charcoal">Directory &amp; who to contact</h3>
          <p class="m-0 mt-2 flex-1 text-[14px] text-[#3A403C]">The organisation directory, your entry, and which inbox to use.</p>
          <span class="mt-3 text-[13px] font-bold text-pasture">Open topic &rarr;</span>
        </a>
    </div>
  </section>

  <section class="border-y-[1.5px] border-charcoal bg-milk">
    <div class="mx-auto max-w-[78ch] px-5 py-12" aria-labelledby="quick-h">
      <h2 id="quick-h" class="font-display m-0 mb-2 text-[34px] font-extrabold tracking-tight">Quick answers</h2>
      <p class="m-0 mb-6 text-[15px] text-mid">The ten we are asked most, each pointing on to the topic that covers it properly.</p>

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

      <div class="mt-6 space-y-3">
      <details class="js-faq-item rounded-2xl border-[1.5px] border-charcoal bg-milk p-5">
        <summary class="font-display cursor-pointer text-lg font-bold tracking-tight">What do membership dues cost, and what decides my tier?</summary>
        <div class="mt-3 text-[15px] text-[#3A403C]">
          <p class="m-0 mb-2">Individual is $170 a year, Creamery $480, Retailer $390 and Affiliate $260. The tier is decided by what your organisation does, not by its size: Creamery if you make cheese, Retailer if you sell it at counter or wholesale, Affiliate if you supply the trade as a supplier, laboratory or distributor, and Individual if the membership is yours rather than an employer&rsquo;s.</p>
          <p class="m-0">Creamery covers up to 6 staff and Retailer up to 4 under the one membership. <a href="<?php echo esc_url( home_url( '/join/' ) ); ?>" class="text-brick underline underline-offset-2">The full rate card is on the Join page</a>, and the detail is in <a href="<?php echo esc_url( home_url( '/faq/membership-dues/' ) ); ?>" class="text-brick underline underline-offset-2">Membership &amp; dues</a>.</p>
        </div>
      </details>
      <details class="js-faq-item rounded-2xl border-[1.5px] border-charcoal bg-milk p-5">
        <summary class="font-display cursor-pointer text-lg font-bold tracking-tight">When am I billed, and how does renewal work?</summary>
        <div class="mt-3 text-[15px] text-[#3A403C]">
          <p class="m-0 mb-2">Dues are annual and billed on your join date, so your membership year runs from the day you joined rather than from January. Auto-renew is optional. With it on, we take the dues on the anniversary; with it off, we send a renewal notice 30 days before and a reminder at 7 days.</p>
          <p class="m-0">You can switch auto-renew, change the card and download receipts from your account at any time. More in <a href="<?php echo esc_url( home_url( '/faq/renewals-account/' ) ); ?>" class="text-brick underline underline-offset-2">Renewals &amp; your account</a>.</p>
        </div>
      </details>
      <details class="js-faq-item rounded-2xl border-[1.5px] border-charcoal bg-milk p-5">
        <summary class="font-display cursor-pointer text-lg font-bold tracking-tight">Can I change tier, pause, or get help if the business is struggling?</summary>
        <div class="mt-3 text-[15px] text-[#3A403C]">
          <p class="m-0 mb-2">Move up at any time and we bill the difference, prorated to your renewal date. Move down at renewal. We do not pause memberships, because a paused member stops receiving the brief and the archive, which is usually the opposite of what they need.</p>
          <p class="m-0">Since 2025 the board has offered hardship dues for members whose creamery has closed or is close to it. Write to Membership Operations; the conversation is confidential and the answer is usually yes.</p>
        </div>
      </details>
      <details class="js-faq-item rounded-2xl border-[1.5px] border-charcoal bg-milk p-5">
        <summary class="font-display cursor-pointer text-lg font-bold tracking-tight">Who can use my organisation&rsquo;s membership?</summary>
        <div class="mt-3 text-[15px] text-[#3A403C]">
          <p class="m-0">A Creamery membership covers up to 6 staff and a Retailer membership up to 4. Each covered person gets their own account, their own brief and their own member rate on courses and events; the organisation gets one vote. Adding or swapping a name is a note to Membership Operations, not a new invoice. Affiliate and Individual memberships cover one person each.</p>
        </div>
      </details>
      <details class="js-faq-item rounded-2xl border-[1.5px] border-charcoal bg-milk p-5">
        <summary class="font-display cursor-pointer text-lg font-bold tracking-tight">Which certification should I start with?</summary>
        <div class="mt-3 text-[15px] text-[#3A403C]">
          <p class="m-0 mb-2">The ladder runs Cheese Foundations Certificate &rarr; Certified Cheese Professional &rarr; Food Safety &amp; HACCP Certificate &rarr; Advanced Affinage, and each rung assumes the one below it. Under two years in the trade, start with Foundations: six weeks on milk composition, the cheese families, sanitation and the vocabulary of affinage.</p>
          <p class="m-0">If you are behind a counter and already fluent, go straight to the Certified Cheese Professional exam &mdash; most candidates prepare for six to nine months. <a href="<?php echo esc_url( home_url( '/learn/' ) ); ?>" class="text-brick underline underline-offset-2">See the whole ladder</a>, or read <a href="<?php echo esc_url( home_url( '/faq/certifications/' ) ); ?>" class="text-brick underline underline-offset-2">Certifications</a>.</p>
        </div>
      </details>
      <details class="js-faq-item rounded-2xl border-[1.5px] border-charcoal bg-milk p-5">
        <summary class="font-display cursor-pointer text-lg font-bold tracking-tight">Do certifications expire, and do members pay less?</summary>
        <div class="mt-3 text-[15px] text-[#3A403C]">
          <p class="m-0 mb-2">The certificates do not expire. The Certified Cheese Professional credential is reconfirmed every five years, either by sitting the current exam or by logging continuing education from the course catalogue &mdash; most people choose the second.</p>
          <p class="m-0">Every membership tier carries a discount on credential exams from the day you join, and members pay member rates on all 63 courses this year.</p>
        </div>
      </details>
      <details class="js-faq-item rounded-2xl border-[1.5px] border-charcoal bg-milk p-5">
        <summary class="font-display cursor-pointer text-lg font-bold tracking-tight">What happens at the Annual Conference, and is anything online?</summary>
        <div class="mt-3 text-[15px] text-[#3A403C]">
          <p class="m-0 mb-2">The conference runs for three days in October: competition results with the score sheets on the tables, a public review of the six category standards, the member organisation floor, the hands-on sessions, and the governance &mdash; the annual election and the committee reports. Early-bird registration closes 30 September.</p>
          <p class="m-0">Plenty is online. The virtual symposium began in 2021 as a stopgap and stayed; webinars and sessions run year-round and recordings live in the members&rsquo; archive. <a href="<?php echo esc_url( home_url( '/events/' ) ); ?>" class="text-brick underline underline-offset-2">See the notice board.</a></p>
        </div>
      </details>
      <details class="js-faq-item rounded-2xl border-[1.5px] border-charcoal bg-milk p-5">
        <summary class="font-display cursor-pointer text-lg font-bold tracking-tight">What do you publish, and can non-members read it?</summary>
        <div class="mt-3 text-[15px] text-[#3A403C]">
          <p class="m-0 mb-2">The Monday brief goes to every member each week: prices, policy movement, and what other members are doing. Members also get the full brief archive, the competition score sheets, everything the Federation has filed in a comment period, and the session recordings.</p>
          <p class="m-0">The blog is open to anyone, and so is the <a href="<?php echo esc_url( home_url( '/library/' ) ); ?>" class="text-brick underline underline-offset-2">Cheese Library</a>. The archive, the score sheets and the recordings are for members. Reports are on the <a href="<?php echo esc_url( home_url( '/research/' ) ); ?>" class="text-brick underline underline-offset-2">research page</a>.</p>
        </div>
      </details>
      <details class="js-faq-item rounded-2xl border-[1.5px] border-charcoal bg-milk p-5">
        <summary class="font-display cursor-pointer text-lg font-bold tracking-tight">How does the organisation directory work?</summary>
        <div class="mt-3 text-[15px] text-[#3A403C]">
          <p class="m-0 mb-2">All 641 member organisations across 41 countries are listed and searchable by what they do and where they are &mdash; creameries, shops and wholesale buyers, laboratories and distributors. Creamery members also appear in the buyers&rsquo; directory, which is the listing buyers actually shop from.</p>
          <p class="m-0">You control your own entry. Ask Membership Operations to correct it, expand it, or take it down.</p>
        </div>
      </details>
      <details class="js-faq-item rounded-2xl border-[1.5px] border-charcoal bg-milk p-5">
        <summary class="font-display cursor-pointer text-lg font-bold tracking-tight">How is the Federation governed, and how do I get involved?</summary>
        <div class="mt-3 text-[15px] text-[#3A403C]">
          <p class="m-0 mb-2">Every membership carries one vote, whatever it costs, and the annual election is announced at the October conference. Six committees do most of the work: Standards, Food Safety, Education, Events, Membership and Advocacy. Seats are open to members, not reserved for the board, and an Individual membership includes one.</p>
          <p class="m-0">For careers, the <a href="<?php echo esc_url( home_url( '/careers/' ) ); ?>" class="text-brick underline underline-offset-2">careers page</a> collects member vacancies, the apprenticeship strand and every volunteer role. Ask Membership Operations for a committee seat &mdash; the committees that need people are usually the ones nobody thinks to ask about.</p>
        </div>
      </details>
      </div>

      <p id="faq-filter-empty" hidden class="mt-6 rounded-2xl border-[1.5px] border-brick bg-milk p-6 text-center text-[15px] text-brick">
        None of the quick answers match that. Try one of the eight topic pages above, or <a href="<?php echo esc_url( home_url( '/contact/' ) ); ?>" class="underline underline-offset-2">write to Member Services</a>.
      </p>
    </div>
  </section>

  <section class="mx-auto max-w-6xl px-5 py-14 md:px-10">
    <div class="rounded-2xl bg-pasture px-6 py-10 text-center text-white md:px-12">
      <h2 class="font-display m-0 text-[clamp(26px,4vw,40px)] font-extrabold leading-[1] tracking-tight">Still not answered?</h2>
      <p class="mx-auto mt-3 max-w-[54ch] text-[17px] opacity-95">Member Services reads everything and answers most things within two business days. Write to <a href="mailto:memberservices@morecheese.org" class="text-clover underline underline-offset-2">memberservices@morecheese.org</a>, or use the enquiry page.</p>
      <a href="<?php echo esc_url( home_url( '/contact/' ) ); ?>" class="mt-6 inline-block rounded-full bg-milk px-7 py-3.5 text-sm font-bold text-pasture no-underline hover:bg-clover">Contact the Federation</a>
    </div>
  </section>
</main>

<?php
get_footer();
