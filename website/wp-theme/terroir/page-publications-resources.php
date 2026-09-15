<?php
/**
 * Template for the "publications-resources" page (/faq/publications-resources/).
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
      <p class="mt-4 text-xs font-bold uppercase tracking-[.14em] text-brick">FAQ &middot; Publications &amp; resources</p>
      <h1 class="font-display font-display-tight m-0 mb-4 mt-2 max-w-[20ch] text-[clamp(34px,4.8vw,60px)] font-extrabold leading-[0.96] tracking-tight text-pasture">The brief, the archive and the research.</h1>
      <p class="m-0 max-w-[58ch] text-[17px] text-[#3A403C]">What the Federation publishes, who can read it, and how to reach the membership without misusing the directory. The reports themselves are on the <a href="<?php echo esc_url( home_url( '/research/' ) ); ?>" class="text-brick underline underline-offset-2">research page</a>.</p>
    </div>
  </section>

  <section class="mx-auto max-w-[78ch] px-5 py-10">
    <div class="rounded-2xl border-[1.5px] border-charcoal bg-milk p-5">
      <label for="faq-filter" class="font-display mb-1 block text-sm font-bold">Filter these questions</label>
      <input id="faq-filter" type="search" autocomplete="off" placeholder="dues, renewal, exam, directory&hellip;"
             class="w-full rounded-xl border-[1.5px] border-charcoal bg-milk px-4 py-2.5 text-[15px]">
      <div class="mt-3 flex flex-wrap items-center justify-between gap-3">
        <p id="faq-filter-count" class="m-0 text-sm font-semibold text-mid" role="status" aria-live="polite">9 questions on this page.</p>
        <button id="faq-filter-clear" type="button" class="rounded-full border-[1.5px] border-charcoal px-5 py-2 text-sm font-semibold hover:bg-charcoal hover:text-milk">Clear</button>
      </div>
      <noscript>
        <p class="m-0 mt-3 rounded-xl border-[1.5px] border-brick px-4 py-2 text-sm text-brick">Filtering needs JavaScript. Every question is listed below.</p>
      </noscript>
    </div>

    <section class="js-faq-group mb-8" aria-labelledby="g-brief">
      <h2 id="g-brief" class="font-display m-0 mb-4 text-[26px] font-extrabold tracking-tight text-pasture">The brief and the archive</h2>
      <div class="space-y-3">
      <details class="js-faq-item rounded-2xl border-[1.5px] border-charcoal bg-milk p-5">
        <summary class="font-display cursor-pointer text-lg font-bold tracking-tight">What is the Monday brief?</summary>
        <div class="mt-3 text-[15px] text-[#3A403C]">
          <p class="m-0 mb-2">One email a week, sent to every member: what prices did, what moved in policy, what other members are doing, and what closes this fortnight. It is written to be read in five minutes on a Monday morning by somebody who has already been up for four hours.</p>
          <p class="m-0">It is the thing members mention second, after the credential ladder, when asked what they would miss. The whole archive sits behind it and is open to members from the first day.</p>
        </div>
      </details>
      <details class="js-faq-item rounded-2xl border-[1.5px] border-charcoal bg-milk p-5">
        <summary class="font-display cursor-pointer text-lg font-bold tracking-tight">This week&rsquo;s brief did not arrive.</summary>
        <div class="mt-3 text-[15px] text-[#3A403C]">
          <p class="m-0 mb-2">Check the junk folder first &mdash; that is the answer nine times in ten, and adding the sender to your address book fixes it permanently. Then check that the address on your account is the one you still use; a change of employer is the second commonest cause.</p>
          <p class="m-0">The issue is in the archive within a few hours of sending either way, so you have not missed it. If two in a row have gone astray, tell <a href="mailto:memberservices@morecheese.org" class="text-brick underline underline-offset-2">memberservices@morecheese.org</a> and they will look at the delivery log rather than guess.</p>
        </div>
      </details>
      <details class="js-faq-item rounded-2xl border-[1.5px] border-charcoal bg-milk p-5">
        <summary class="font-display cursor-pointer text-lg font-bold tracking-tight">What is in the members&rsquo; archive?</summary>
        <div class="mt-3 text-[15px] text-[#3A403C]">
          <p class="m-0 mb-2">Every issue of the brief since the Federation started publishing it. Every competition score sheet, by category and by year. Everything the Federation has filed in a comment period, with the member comments that went into the packet. And every recorded session and webinar, kept indefinitely rather than expiring after 90 days.</p>
          <p class="m-0">It is searchable, and it is the single most under-used member benefit. Members who find it tend to find it eighteen months in, by accident.</p>
        </div>
      </details>
      <details class="js-faq-item rounded-2xl border-[1.5px] border-charcoal bg-milk p-5">
        <summary class="font-display cursor-pointer text-lg font-bold tracking-tight">What can a non-member read?</summary>
        <div class="mt-3 text-[15px] text-[#3A403C]">
          <p class="m-0 mb-2">The blog, all of it, with no login. The six competition category standards, because a standard nobody can read is not a standard. The <a href="<?php echo esc_url( home_url( '/library/' ) ); ?>" class="text-brick underline underline-offset-2">Cheese Library</a>. And the summary of anything the Federation has filed publicly.</p>
          <p class="m-0">The brief archive, the score sheets and the session recordings are for members.</p>
        </div>
      </details>
      </div>
    </section>

    <section class="js-faq-group mb-8" aria-labelledby="g-res">
      <h2 id="g-res" class="font-display m-0 mb-4 text-[26px] font-extrabold tracking-tight text-pasture">Research, reuse and reaching members</h2>
      <div class="space-y-3">
      <details class="js-faq-item rounded-2xl border-[1.5px] border-charcoal bg-milk p-5">
        <summary class="font-display cursor-pointer text-lg font-bold tracking-tight">Do you publish research?</summary>
        <div class="mt-3 text-[15px] text-[#3A403C]">
          <p class="m-0 mb-2">Yes, and it is gathered on the <a href="<?php echo esc_url( home_url( '/research/' ) ); ?>" class="text-brick underline underline-offset-2">research and publications page</a>: the annual production and consumption assessment, the trade and regulatory reviews, the consumer preference work, and the longer analytical pieces the committees commission when an argument needs settling with data.</p>
          <p class="m-0">Members get everything as it is published. Non-members can buy the individual reports; the summaries and the methodology notes are open to everyone.</p>
        </div>
      </details>
      <details class="js-faq-item rounded-2xl border-[1.5px] border-charcoal bg-milk p-5">
        <summary class="font-display cursor-pointer text-lg font-bold tracking-tight">Can I advertise, sponsor, or reach the membership?</summary>
        <div class="mt-3 text-[15px] text-[#3A403C]">
          <p class="m-0 mb-2">There are three legitimate routes: sponsor an event, take space in the publications, or take part in the organisation floor at the Annual Conference. Affiliate members get first refusal on event sponsorship, which is one of the reasons that tier exists.</p>
          <p class="m-0">Rates and the media pack come from <a href="mailto:advertising@morecheese.org" class="text-brick underline underline-offset-2">advertising@morecheese.org</a>. What is not a route is the organisation directory: it is for professional contact, and using it as a marketing list breaches the terms every member agrees to.</p>
        </div>
      </details>
      <details class="js-faq-item rounded-2xl border-[1.5px] border-charcoal bg-milk p-5">
        <summary class="font-display cursor-pointer text-lg font-bold tracking-tight">Can I quote or reuse something you published?</summary>
        <div class="mt-3 text-[15px] text-[#3A403C]">
          <p class="m-0 mb-2">Quote it freely with attribution &mdash; that is what it is for, and members reprinting a brief item in their own newsletter is a compliment rather than a problem. Reproducing a whole report or a score sheet set needs a note to Communications first, mostly so that we can point you at the current version.</p>
          <p class="m-0">The competition category standards may be reproduced in full by anyone, including non-members. A standard that cannot be circulated does not do its job.</p>
        </div>
      </details>
      <details class="js-faq-item rounded-2xl border-[1.5px] border-charcoal bg-milk p-5">
        <summary class="font-display cursor-pointer text-lg font-bold tracking-tight">Do you keep a list of approved suppliers?</summary>
        <div class="mt-3 text-[15px] text-[#3A403C]">
          <p class="m-0 mb-2">No, deliberately. We do not endorse products, approve vendors or guarantee anyone&rsquo;s work, because the moment we did, the list would be worth gaming.</p>
          <p class="m-0">What we have instead is the organisation directory, where the laboratories, distributors and suppliers in membership list what they do and where they are. Filter it by activity and region, then do your own diligence. The <a href="<?php echo esc_url( home_url( '/faq/organization-directory/' ) ); ?>" class="text-brick underline underline-offset-2">directory page</a> explains how it works.</p>
        </div>
      </details>
      <details class="js-faq-item rounded-2xl border-[1.5px] border-charcoal bg-milk p-5">
        <summary class="font-display cursor-pointer text-lg font-bold tracking-tight">Where are the competition score sheets?</summary>
        <div class="mt-3 text-[15px] text-[#3A403C]">
          <p class="m-0 mb-2">In the members&rsquo; archive, filed by year and by category, from the first competition onwards. Entrants get their own sheets whether or not they placed, which is the point of judging to a published standard rather than to a taste.</p>
          <p class="m-0">The category standards themselves are public, on the <a href="<?php echo esc_url( home_url( '/compete/' ) ); ?>" class="text-brick underline underline-offset-2">compete page</a>.</p>
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
        <a href="<?php echo esc_url( home_url( '/faq/membership-dues/' ) ); ?>" class="rounded-2xl border-[1.5px] border-charcoal bg-milk p-4 no-underline transition hover:bg-clover">
          <h3 class="font-display m-0 text-[17px] font-bold leading-tight tracking-tight text-charcoal">Membership &amp; dues</h3>
          <p class="m-0 mt-1 text-[13px] text-mid">What a membership costs, which tier fits, and how billing works.</p>
        </a>
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
        <a href="<?php echo esc_url( home_url( '/faq/career-governance/' ) ); ?>" class="rounded-2xl border-[1.5px] border-charcoal bg-milk p-4 no-underline transition hover:bg-clover">
          <h3 class="font-display m-0 text-[17px] font-bold leading-tight tracking-tight text-charcoal">Careers, committees &amp; governance</h3>
          <p class="m-0 mt-1 text-[13px] text-mid">Vacancies, committee seats, the election, ethics and advocacy.</p>
        </a>
        <a href="<?php echo esc_url( home_url( '/faq/organization-directory/' ) ); ?>" class="rounded-2xl border-[1.5px] border-charcoal bg-milk p-4 no-underline transition hover:bg-clover">
          <h3 class="font-display m-0 text-[17px] font-bold leading-tight tracking-tight text-charcoal">Directory &amp; who to contact</h3>
          <p class="m-0 mt-1 text-[13px] text-mid">The organisation directory, your entry, and which inbox to use.</p>
        </a>
      </div>
      <div class="mt-8 rounded-2xl bg-pasture px-6 py-8 text-white md:px-10">
        <h2 class="font-display m-0 text-[26px] font-extrabold tracking-tight">Still stuck?</h2>
        <p class="m-0 mt-2 max-w-[58ch] text-[15px] opacity-95">Member Services reads everything and answers most things within two business days. Write to <a href="mailto:memberservices@morecheese.org" class="text-clover underline underline-offset-2">memberservices@morecheese.org</a>, or use the enquiry page if you would rather fill in a form.</p>
        <a href="<?php echo esc_url( home_url( '/contact/' ) ); ?>" class="mt-5 inline-block rounded-full bg-milk px-6 py-3 text-sm font-bold text-pasture no-underline hover:bg-clover">Contact the Federation</a>
      </div>
    </div>
  </section>
</main>

<?php
get_footer();
