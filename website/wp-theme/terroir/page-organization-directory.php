<?php
/**
 * Template for the "organization-directory" page (/faq/organization-directory/).
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
      <p class="mt-4 text-xs font-bold uppercase tracking-[.14em] text-brick">FAQ &middot; Directory &amp; contacts</p>
      <h1 class="font-display font-display-tight m-0 mb-4 mt-2 max-w-[20ch] text-[clamp(34px,4.8vw,60px)] font-extrabold leading-[0.96] tracking-tight text-pasture">The directory, and who to write to.</h1>
      <p class="m-0 max-w-[58ch] text-[17px] text-[#3A403C]">How the organisation directory works, what it shows about you, and which inbox answers which question fastest.</p>
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

    <section class="js-faq-group mb-8" aria-labelledby="g-dir">
      <h2 id="g-dir" class="font-display m-0 mb-4 text-[26px] font-extrabold tracking-tight text-pasture">The organisation directory</h2>
      <div class="space-y-3">
      <details class="js-faq-item rounded-2xl border-[1.5px] border-charcoal bg-milk p-5">
        <summary class="font-display cursor-pointer text-lg font-bold tracking-tight">What is the organisation directory?</summary>
        <div class="mt-3 text-[15px] text-[#3A403C]">
          <p class="m-0 mb-2">A searchable listing of all 641 member organisations across 41 countries &mdash; creameries, shops, wholesale buyers, laboratories, distributors and suppliers &mdash; filterable by what an organisation does and where it is.</p>
          <p class="m-0">Creamery members also appear in the buyers&rsquo; directory, which is the listing buyers actually shop from. It is the most under-used benefit in the membership and the one buyers use most.</p>
        </div>
      </details>
      <details class="js-faq-item rounded-2xl border-[1.5px] border-charcoal bg-milk p-5">
        <summary class="font-display cursor-pointer text-lg font-bold tracking-tight">What is visible about me?</summary>
        <div class="mt-3 text-[15px] text-[#3A403C]">
          <p class="m-0 mb-2">To other members: your name and role, your organisation, the city and country you work in, a professional contact address, any credentials you hold and the year you joined.</p>
          <p class="m-0">Never shown, to anyone: home address, personal contact details, what you pay, your course and exam records, and anything in your correspondence with staff. Non-members see organisations, not individuals.</p>
        </div>
      </details>
      <details class="js-faq-item rounded-2xl border-[1.5px] border-charcoal bg-milk p-5">
        <summary class="font-display cursor-pointer text-lg font-bold tracking-tight">Can I opt out, or list less?</summary>
        <div class="mt-3 text-[15px] text-[#3A403C]">
          <p class="m-0 mb-2">Both. You can leave the directory entirely, or stay listed with less &mdash; the organisation and what it does, without the contact detail.</p>
          <p class="m-0">It is worth being honest about the trade-off: a member who is listed but unreachable gets fewer useful enquiries and the same amount of nothing else. Ask <a href="mailto:memberservices@morecheese.org" class="text-brick underline underline-offset-2">memberservices@morecheese.org</a> for either.</p>
        </div>
      </details>
      <details class="js-faq-item rounded-2xl border-[1.5px] border-charcoal bg-milk p-5">
        <summary class="font-display cursor-pointer text-lg font-bold tracking-tight">How do I correct our entry?</summary>
        <div class="mt-3 text-[15px] text-[#3A403C]">
          <p class="m-0 mb-2">Tell Membership Operations what is wrong and it changes within a day. You control your own entry; there is no approval queue and nobody edits it but you.</p>
          <p class="m-0">The commonest correction is a description written when the business was doing something else three years ago. It is worth a read once a year.</p>
        </div>
      </details>
      <details class="js-faq-item rounded-2xl border-[1.5px] border-charcoal bg-milk p-5">
        <summary class="font-display cursor-pointer text-lg font-bold tracking-tight">Can I download the directory or use it for a mailing?</summary>
        <div class="mt-3 text-[15px] text-[#3A403C]">
          <p class="m-0 mb-2">No. The directory is for professional contact, one enquiry at a time. Bulk export, scraping and using it to build a marketing list all breach the terms every member agrees to, and they are the most reliable way to lose a membership.</p>
          <p class="m-0">If you want to reach the membership, there are three proper routes: sponsor an event, take space in the publications, or take part in the organisation floor at the conference. The <a href="<?php echo esc_url( home_url( '/faq/publications-resources/' ) ); ?>" class="text-brick underline underline-offset-2">publications page</a> has the detail.</p>
        </div>
      </details>
      </div>
    </section>

    <section class="js-faq-group mb-8" aria-labelledby="g-who">
      <h2 id="g-who" class="font-display m-0 mb-4 text-[26px] font-extrabold tracking-tight text-pasture">Who to contact</h2>
      <div class="space-y-3">
      <details class="js-faq-item rounded-2xl border-[1.5px] border-charcoal bg-milk p-5">
        <summary class="font-display cursor-pointer text-lg font-bold tracking-tight">Which inbox should I use?</summary>
        <div class="mt-3 text-[15px] text-[#3A403C]">
          <p class="m-0 mb-2"><b>Joining, tiers, dues, renewals, hardship dues, the directory</b> &rarr; <a href="mailto:membership@morecheese.org" class="text-brick underline underline-offset-2">membership@morecheese.org</a>. <b>The credential ladder, exam sittings, continuing education</b> &rarr; <a href="mailto:certifications@morecheese.org" class="text-brick underline underline-offset-2">certifications@morecheese.org</a>. <b>Courses, cohorts, the catalogue</b> &rarr; <a href="mailto:education@morecheese.org" class="text-brick underline underline-offset-2">education@morecheese.org</a>. <b>The conference, workshops, webinars, competition entries</b> &rarr; <a href="mailto:events@morecheese.org" class="text-brick underline underline-offset-2">events@morecheese.org</a>.</p>
          <p class="m-0"><b>Invoices, purchase orders, payment</b> &rarr; <a href="mailto:finance@morecheese.org" class="text-brick underline underline-offset-2">finance@morecheese.org</a>. <b>Standards and technical questions</b> &rarr; <a href="mailto:research@morecheese.org" class="text-brick underline underline-offset-2">research@morecheese.org</a>. <b>Vacancies and volunteering</b> &rarr; <a href="mailto:careers@morecheese.org" class="text-brick underline underline-offset-2">careers@morecheese.org</a>. <b>Anything else at all</b> &rarr; <a href="mailto:memberservices@morecheese.org" class="text-brick underline underline-offset-2">memberservices@morecheese.org</a>, which is read by a person and forwarded, so it is never the wrong answer.</p>
        </div>
      </details>
      <details class="js-faq-item rounded-2xl border-[1.5px] border-charcoal bg-milk p-5">
        <summary class="font-display cursor-pointer text-lg font-bold tracking-tight">Who works there, and can I speak to one of them by name?</summary>
        <div class="mt-3 text-[15px] text-[#3A403C]">
          <p class="m-0 mb-2">Five roles carry the day-to-day work: Executive Director, Membership Operations, Communications, Education Programmes and Events. They are listed by role on the <a href="<?php echo esc_url( home_url( '/about/' ) ); ?>" class="text-brick underline underline-offset-2">about page</a> rather than by name, because this is a demonstration site and inventing people to fill them would help nobody.</p>
          <p class="m-0">In practice, write to the departmental address rather than hunting for an individual. It is read the same day, and it does not fall over when somebody is on leave.</p>
        </div>
      </details>
      <details class="js-faq-item rounded-2xl border-[1.5px] border-charcoal bg-milk p-5">
        <summary class="font-display cursor-pointer text-lg font-bold tracking-tight">Where are you based?</summary>
        <div class="mt-3 text-[15px] text-[#3A403C]">
          <p class="m-0 mb-2">One address: 1 Rind Lane, Lancaster, PA. The staff are small by design &mdash; most of the Federation&rsquo;s work is done by members on committees, not by employees in an office.</p>
          <p class="m-0">There are no regional offices. Regional presence is the meetups, the chapters and the members who run them, which is a different model and an honest one for a body of this size.</p>
        </div>
      </details>
      <details class="js-faq-item rounded-2xl border-[1.5px] border-charcoal bg-milk p-5">
        <summary class="font-display cursor-pointer text-lg font-bold tracking-tight">Are you hiring?</summary>
        <div class="mt-3 text-[15px] text-[#3A403C]">
          <p class="m-0 mb-2">Sometimes. Federation roles, when there are any, are posted on the <a href="<?php echo esc_url( home_url( '/careers/' ) ); ?>" class="text-brick underline underline-offset-2">careers page</a> alongside member vacancies rather than in a separate careers portal.</p>
          <p class="m-0">Speculative applications are read. Send them to <a href="mailto:careers@morecheese.org" class="text-brick underline underline-offset-2">careers@morecheese.org</a> with a note about what you would want to do; roles here tend to be created around people rather than the other way round.</p>
        </div>
      </details>
      <details class="js-faq-item rounded-2xl border-[1.5px] border-charcoal bg-milk p-5">
        <summary class="font-display cursor-pointer text-lg font-bold tracking-tight">Something on this site is wrong or a link is broken.</summary>
        <div class="mt-3 text-[15px] text-[#3A403C]">
          <p class="m-0 mb-2">Tell us: <a href="mailto:info@morecheese.org" class="text-brick underline underline-offset-2">info@morecheese.org</a>, or the <a href="<?php echo esc_url( home_url( '/contact/' ) ); ?>" class="text-brick underline underline-offset-2">contact page</a>. Broken links get fixed the same week.</p>
          <p class="m-0">Bear in mind that this is a demonstration build. Nothing here takes a payment, sends a message or holds a place, and the forms are deliberately inert.</p>
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
        <a href="<?php echo esc_url( home_url( '/faq/publications-resources/' ) ); ?>" class="rounded-2xl border-[1.5px] border-charcoal bg-milk p-4 no-underline transition hover:bg-clover">
          <h3 class="font-display m-0 text-[17px] font-bold leading-tight tracking-tight text-charcoal">Publications &amp; resources</h3>
          <p class="m-0 mt-1 text-[13px] text-mid">The Monday brief, the archive, research and sponsorship.</p>
        </a>
        <a href="<?php echo esc_url( home_url( '/faq/career-governance/' ) ); ?>" class="rounded-2xl border-[1.5px] border-charcoal bg-milk p-4 no-underline transition hover:bg-clover">
          <h3 class="font-display m-0 text-[17px] font-bold leading-tight tracking-tight text-charcoal">Careers, committees &amp; governance</h3>
          <p class="m-0 mt-1 text-[13px] text-mid">Vacancies, committee seats, the election, ethics and advocacy.</p>
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
