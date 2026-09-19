<?php
/**
 * Template for the "certifications" page (/faq/certifications/).
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
      <p class="mt-4 text-xs font-bold uppercase tracking-[.14em] text-brick">FAQ &middot; Certifications</p>
      <h1 class="font-display font-display-tight m-0 mb-4 mt-2 max-w-[20ch] text-[clamp(34px,4.8vw,60px)] font-extrabold leading-[0.96] tracking-tight text-pasture">The ladder, the exam, and keeping a credential current.</h1>
      <p class="m-0 max-w-[58ch] text-[17px] text-[#3A403C]">Four rungs, in order, each assuming the one below it. The full description of each rung, the cohorts and the 63-course catalog are on the <a href="<?php echo esc_url( home_url( '/learn/' ) ); ?>" class="text-brick underline underline-offset-2">Learn page</a>.</p>
    </div>
  </section>

  <section class="mx-auto max-w-[78ch] px-5 py-10">
    <div class="rounded-2xl border-[1.5px] border-charcoal bg-milk p-5">
      <label for="faq-filter" class="font-display mb-1 block text-sm font-bold">Filter these questions</label>
      <input id="faq-filter" type="search" autocomplete="off" placeholder="dues, renewal, exam, directory&hellip;"
             class="w-full rounded-xl border-[1.5px] border-charcoal bg-milk px-4 py-2.5 text-[15px]">
      <div class="mt-3 flex flex-wrap items-center justify-between gap-3">
        <p id="faq-filter-count" class="m-0 text-sm font-semibold text-mid" role="status" aria-live="polite">11 questions on this page.</p>
        <button id="faq-filter-clear" type="button" class="rounded-full border-[1.5px] border-charcoal px-5 py-2 text-sm font-semibold hover:bg-charcoal hover:text-milk">Clear</button>
      </div>
      <noscript>
        <p class="m-0 mt-3 rounded-xl border-[1.5px] border-brick px-4 py-2 text-sm text-brick">Filtering needs JavaScript. Every question is listed below.</p>
      </noscript>
    </div>

    <section class="js-faq-group mb-8" aria-labelledby="g-start">
      <h2 id="g-start" class="font-display m-0 mb-4 text-[26px] font-extrabold tracking-tight text-pasture">Getting started</h2>
      <div class="space-y-3">
      <details class="js-faq-item rounded-2xl border-[1.5px] border-charcoal bg-milk p-5">
        <summary class="font-display cursor-pointer text-lg font-bold tracking-tight">Which certification should I start with?</summary>
        <div class="mt-3 text-[15px] text-[#3A403C]">
          <p class="m-0 mb-2">The ladder runs Cheese Foundations Certificate &rarr; Certified Cheese Professional &rarr; Food Safety &amp; HACCP Certificate &rarr; Advanced Affinage, and each rung assumes the one below it.</p>
          <p class="m-0">Under two years in the trade, start with Foundations: six weeks on milk composition, the cheese families, sanitation as a daily practice and the vocabulary of affinage. If you are already fluent behind a counter, skip it and prepare for the Certified Cheese Professional exam instead. The whole ladder is described on the <a href="<?php echo esc_url( home_url( '/learn/' ) ); ?>" class="text-brick underline underline-offset-2">Learn page</a>.</p>
        </div>
      </details>
      <details class="js-faq-item rounded-2xl border-[1.5px] border-charcoal bg-milk p-5">
        <summary class="font-display cursor-pointer text-lg font-bold tracking-tight">What are the four rungs, in short?</summary>
        <div class="mt-3 text-[15px] text-[#3A403C]">
          <p class="m-0 mb-2"><b>Cheese Foundations Certificate</b> &mdash; six weeks, entry level, deliberately broad. You finish able to hold a conversation with a maker, a monger and an inspector.</p>
          <p class="m-0"><b>Certified Cheese Professional</b> &mdash; an examination rather than a course. Retail and wholesale practice plus blind sensory evaluation. <b>Food Safety &amp; HACCP Certificate</b> &mdash; eight weeks on hazards and control points, ending with defending your own plan to someone playing the inspector. <b>Advanced Affinage</b> &mdash; a cohort, because it depends on people comparing caves.</p>
        </div>
      </details>
      <details class="js-faq-item rounded-2xl border-[1.5px] border-charcoal bg-milk p-5">
        <summary class="font-display cursor-pointer text-lg font-bold tracking-tight">What do I need before I can sit the Certified Cheese Professional exam?</summary>
        <div class="mt-3 text-[15px] text-[#3A403C]">
          <p class="m-0 mb-2">One of three things: two years of documented work in the trade, or the Cheese Foundations Certificate, or current enrollment on a dairy or food science program that covers cheese. Send the evidence with your application and Education Programs confirms eligibility, usually inside four weeks.</p>
          <p class="m-0">Most candidates then prepare for six to nine months. Retailer-tier members get priority in the preparation cohorts, which fill early.</p>
        </div>
      </details>
      <details class="js-faq-item rounded-2xl border-[1.5px] border-charcoal bg-milk p-5">
        <summary class="font-display cursor-pointer text-lg font-bold tracking-tight">Can I sit the exam online?</summary>
        <div class="mt-3 text-[15px] text-[#3A403C]">
          <p class="m-0 mb-2">No, and it is the one thing we are inflexible about. The exam has a blind sensory component &mdash; you taste, and you describe what you find in language another professional would recognize &mdash; and that cannot be invigilated over a video call.</p>
          <p class="m-0">Sittings run several times a year at member venues and at the Annual Conference in October. Dates go out with the brief and are on the <a href="<?php echo esc_url( home_url( '/events/' ) ); ?>" class="text-brick underline underline-offset-2">events page</a>.</p>
        </div>
      </details>
      </div>
    </section>

    <section class="js-faq-group mb-8" aria-labelledby="g-keep">
      <h2 id="g-keep" class="font-display m-0 mb-4 text-[26px] font-extrabold tracking-tight text-pasture">Keeping a credential</h2>
      <div class="space-y-3">
      <details class="js-faq-item rounded-2xl border-[1.5px] border-charcoal bg-milk p-5">
        <summary class="font-display cursor-pointer text-lg font-bold tracking-tight">Do the credentials expire?</summary>
        <div class="mt-3 text-[15px] text-[#3A403C]">
          <p class="m-0 mb-2">The certificates &mdash; Foundations, Food Safety &amp; HACCP, Advanced Affinage &mdash; do not expire. You did the work; it stays done.</p>
          <p class="m-0">The Certified Cheese Professional credential is reconfirmed every five years, either by sitting the current exam or by logging continuing education from the course catalog. Most people choose the second, and most of them have already done enough courses without planning to.</p>
        </div>
      </details>
      <details class="js-faq-item rounded-2xl border-[1.5px] border-charcoal bg-milk p-5">
        <summary class="font-display cursor-pointer text-lg font-bold tracking-tight">I hold a credential from another body. Will you recognize it?</summary>
        <div class="mt-3 text-[15px] text-[#3A403C]">
          <p class="m-0 mb-2">Not as a substitute for ours, and we would rather say that plainly than leave you to discover it. The ladder is our own and a credential from another organization does not map onto it.</p>
          <p class="m-0">It very often counts toward <em>eligibility</em>, though, which is the practical question. Two years of documented professional experience qualifies you for the exam, and training or work done elsewhere counts toward those two years. Send the detail to <a href="mailto:certifications@morecheese.org" class="text-brick underline underline-offset-2">certifications@morecheese.org</a> and they will tell you where you stand.</p>
        </div>
      </details>
      <details class="js-faq-item rounded-2xl border-[1.5px] border-charcoal bg-milk p-5">
        <summary class="font-display cursor-pointer text-lg font-bold tracking-tight">Do members pay less?</summary>
        <div class="mt-3 text-[15px] text-[#3A403C]">
          <p class="m-0 mb-2">Yes, on every rung, from the day the membership starts. Every tier carries the same discount &mdash; a $170 Individual membership and a $480 Creamery membership get the identical rate on exams and on all 63 courses.</p>
          <p class="m-0">For most people taking a credential in their first year, the discount covers a meaningful share of the dues. It is the single most common reason members give for joining when they did.</p>
        </div>
      </details>
      <details class="js-faq-item rounded-2xl border-[1.5px] border-charcoal bg-milk p-5">
        <summary class="font-display cursor-pointer text-lg font-bold tracking-tight">How do I log continuing education, and when does it appear?</summary>
        <div class="mt-3 text-[15px] text-[#3A403C]">
          <p class="m-0 mb-2">Courses and webinars run by the Federation are logged for you and normally appear on your record within ten working days. Anything done elsewhere you submit yourself, with evidence of attendance.</p>
          <p class="m-0">If a Federation session has not appeared after ten working days, send the session title, the date and your member number to <a href="mailto:certifications@morecheese.org" class="text-brick underline underline-offset-2">certifications@morecheese.org</a> and it will be posted manually within a couple of days.</p>
        </div>
      </details>
      <details class="js-faq-item rounded-2xl border-[1.5px] border-charcoal bg-milk p-5">
        <summary class="font-display cursor-pointer text-lg font-bold tracking-tight">My continuing education record is wrong, or a claim was rejected.</summary>
        <div class="mt-3 text-[15px] text-[#3A403C]">
          <p class="m-0 mb-2">Records are reviewed each year on a sample basis, and claims are occasionally rejected for want of evidence rather than want of merit. If yours was, you have 30 days to send better evidence to <a href="mailto:certifications@morecheese.org" class="text-brick underline underline-offset-2">certifications@morecheese.org</a> and the Education Committee looks at it again.</p>
          <p class="m-0">The commonest cause is a claim with no documentation attached at all. The second commonest is a session that was genuinely attended but under a different name; say so and it is usually resolved in one email.</p>
        </div>
      </details>
      </div>
    </section>

    <section class="js-faq-group mb-8" aria-labelledby="g-prob">
      <h2 id="g-prob" class="font-display m-0 mb-4 text-[26px] font-extrabold tracking-tight text-pasture">When something goes wrong</h2>
      <div class="space-y-3">
      <details class="js-faq-item rounded-2xl border-[1.5px] border-charcoal bg-milk p-5">
        <summary class="font-display cursor-pointer text-lg font-bold tracking-tight">What happens if I fail the exam?</summary>
        <div class="mt-3 text-[15px] text-[#3A403C]">
          <p class="m-0 mb-2">You get the breakdown by section, which is the useful part &mdash; most people who do not pass fail one component rather than the whole thing, and only that component needs re-sitting. There is no limit on attempts and no waiting period beyond the next available sitting.</p>
          <p class="m-0">Education Programs will also tell you which courses in the catalog address the section you dropped. Ask <a href="mailto:education@morecheese.org" class="text-brick underline underline-offset-2">education@morecheese.org</a> rather than guessing; it is a short conversation and it saves a lot of preparation aimed at the wrong thing.</p>
        </div>
      </details>
      <details class="js-faq-item rounded-2xl border-[1.5px] border-charcoal bg-milk p-5">
        <summary class="font-display cursor-pointer text-lg font-bold tracking-tight">Can a credential be suspended or withdrawn?</summary>
        <div class="mt-3 text-[15px] text-[#3A403C]">
          <p class="m-0 mb-2">Rarely, and only for cause: continuing education that cannot be evidenced after review, reconfirmation that has passed its date, or an upheld ethics finding. Non-payment of dues does not affect a credential you already hold.</p>
          <p class="m-0">If you have had a notice, reply to it. Almost everything at this stage is fixable inside the window, and the window is the thing people miss.</p>
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
