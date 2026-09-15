<?php
/**
 * Template for the "membership-benefits" page (/faq/membership-benefits/).
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
      <p class="mt-4 text-xs font-bold uppercase tracking-[.14em] text-brick">FAQ &middot; Benefits &amp; services</p>
      <h1 class="font-display font-display-tight m-0 mb-4 mt-2 max-w-[20ch] text-[clamp(34px,4.8vw,60px)] font-extrabold leading-[0.96] tracking-tight text-pasture">What you get for the dues.</h1>
      <p class="m-0 max-w-[58ch] text-[17px] text-[#3A403C]">What a membership includes, what it deliberately does not, and how it sits alongside a regional guild. Pricing is on the <a href="<?php echo esc_url( home_url( '/faq/membership-dues/' ) ); ?>" class="text-brick underline underline-offset-2">dues page</a>.</p>
    </div>
  </section>

  <section class="mx-auto max-w-[78ch] px-5 py-10">
    <div class="rounded-2xl border-[1.5px] border-charcoal bg-milk p-5">
      <label for="faq-filter" class="font-display mb-1 block text-sm font-bold">Filter these questions</label>
      <input id="faq-filter" type="search" autocomplete="off" placeholder="dues, renewal, exam, directory&hellip;"
             class="w-full rounded-xl border-[1.5px] border-charcoal bg-milk px-4 py-2.5 text-[15px]">
      <div class="mt-3 flex flex-wrap items-center justify-between gap-3">
        <p id="faq-filter-count" class="m-0 text-sm font-semibold text-mid" role="status" aria-live="polite">8 questions on this page.</p>
        <button id="faq-filter-clear" type="button" class="rounded-full border-[1.5px] border-charcoal px-5 py-2 text-sm font-semibold hover:bg-charcoal hover:text-milk">Clear</button>
      </div>
      <noscript>
        <p class="m-0 mt-3 rounded-xl border-[1.5px] border-brick px-4 py-2 text-sm text-brick">Filtering needs JavaScript. Every question is listed below.</p>
      </noscript>
    </div>

    <section class="js-faq-group mb-8" aria-labelledby="g-inc">
      <h2 id="g-inc" class="font-display m-0 mb-4 text-[26px] font-extrabold tracking-tight text-pasture">What is included</h2>
      <div class="space-y-3">
      <details class="js-faq-item rounded-2xl border-[1.5px] border-charcoal bg-milk p-5">
        <summary class="font-display cursor-pointer text-lg font-bold tracking-tight">What does every membership include, whatever the tier?</summary>
        <div class="mt-3 text-[15px] text-[#3A403C]">
          <p class="m-0 mb-2">The Monday brief every week, with the full archive behind it. One vote in the annual election. A committee seat if you want one. Member rates on all 63 courses this year, on credential exams, on workshops and on the Annual Conference. Comment standing, so that when the Federation files on a proposed rule your comment goes into the packet. And the organisation directory: 641 member organisations in 41 countries, searchable by what they do and where they are.</p>
          <p class="m-0">None of that is tiered. A $170 Individual membership and a $480 Creamery membership get the same vote and the same discount; the Creamery covers more people and adds competition entry and a buyers&rsquo; directory listing.</p>
        </div>
      </details>
      <details class="js-faq-item rounded-2xl border-[1.5px] border-charcoal bg-milk p-5">
        <summary class="font-display cursor-pointer text-lg font-bold tracking-tight">What is actually worth the money, if I am honest about it?</summary>
        <div class="mt-3 text-[15px] text-[#3A403C]">
          <p class="m-0 mb-2">Members say three things, in this order. The credential ladder, because it is the thing that moved their career and the member discount recovers a chunk of the dues on the first exam. The brief, because knowing what a price or a rule did last week is hard to get anywhere else. And the people &mdash; the cohort you came up with, the committee you sat on, the buyer you met on the conference floor.</p>
          <p class="m-0">What members rarely mention is the directory, which is odd, because buyers use it constantly. If you make cheese and you are not listed, you are invisible to the people shopping.</p>
        </div>
      </details>
      <details class="js-faq-item rounded-2xl border-[1.5px] border-charcoal bg-milk p-5">
        <summary class="font-display cursor-pointer text-lg font-bold tracking-tight">What does a membership <em>not</em> include?</summary>
        <div class="mt-3 text-[15px] text-[#3A403C]">
          <p class="m-0 mb-2">It is not a certification. Joining does not credential you; it discounts the exams. It is not a legal or regulatory service: we explain what a proposed rule would do and we file comments, but we do not represent individual members to a regulator. It is not an endorsement &mdash; we do not approve suppliers, guarantee products or vouch for anyone in the directory.</p>
          <p class="m-0">And it is not a sales channel. The directory is for professional contact, not for marketing lists. Using it to build a prospect list is the one thing that reliably ends a membership.</p>
        </div>
      </details>
      </div>
    </section>

    <section class="js-faq-group mb-8" aria-labelledby="g-fit">
      <h2 id="g-fit" class="font-display m-0 mb-4 text-[26px] font-extrabold tracking-tight text-pasture">Whether it fits you</h2>
      <div class="space-y-3">
      <details class="js-faq-item rounded-2xl border-[1.5px] border-charcoal bg-milk p-5">
        <summary class="font-display cursor-pointer text-lg font-bold tracking-tight">We already belong to a regional guild. Is this duplication?</summary>
        <div class="mt-3 text-[15px] text-[#3A403C]">
          <p class="m-0 mb-2">Mostly not, and the split is clean. A regional guild does local: the meet-ups, the state-level issues, the people you can drive to. The Federation does the things that only work at scale &mdash; a credential that means the same thing in 41 countries, a competition judged blind to one published standard, a comment packet with several hundred makers behind it, and a brief that tells a member in one country what happened to the price in another.</p>
          <p class="m-0">Plenty of members hold both and describe them as complementary. If your budget only stretches to one and your work is entirely local, keep the guild.</p>
        </div>
      </details>
      <details class="js-faq-item rounded-2xl border-[1.5px] border-charcoal bg-milk p-5">
        <summary class="font-display cursor-pointer text-lg font-bold tracking-tight">Can consultants, laboratories and suppliers join?</summary>
        <div class="mt-3 text-[15px] text-[#3A403C]">
          <p class="m-0 mb-2">Yes, on the Affiliate tier, which exists for exactly that: the suppliers, laboratories, distributors and independent consultants the rest of the trade runs on. Affiliate carries the same vote and the same credential discount, adds a directory listing, and gets first refusal on event sponsorship.</p>
          <p class="m-0">A consultant whose work is mostly cheese and who wants the membership in their own name rather than a firm&rsquo;s may prefer Individual. Both are legitimate; the difference is whose name is on it.</p>
        </div>
      </details>
      <details class="js-faq-item rounded-2xl border-[1.5px] border-charcoal bg-milk p-5">
        <summary class="font-display cursor-pointer text-lg font-bold tracking-tight">We make non-dairy and cultured alternatives. Are we eligible?</summary>
        <div class="mt-3 text-[15px] text-[#3A403C]">
          <p class="m-0 mb-2">Yes. Membership is open across the whole of what the trade now makes, including plant-based and cultured products, and several member creameries make both.</p>
          <p class="m-0">Be aware of the boundary: the credential ladder and the competition categories are written around dairy cheese and are not a good fit for a non-dairy make today. The Standards Committee has had that on its agenda since 2024 and would welcome members who want to help write it properly.</p>
        </div>
      </details>
      <details class="js-faq-item rounded-2xl border-[1.5px] border-charcoal bg-milk p-5">
        <summary class="font-display cursor-pointer text-lg font-bold tracking-tight">Does membership help if I am outside North America?</summary>
        <div class="mt-3 text-[15px] text-[#3A403C]">
          <p class="m-0 mb-2">It should, and that is the test we apply. The virtual strand exists because a member in one hemisphere should not have to fly to learn something. Recordings stay in the archive indefinitely, the brief is written for an international readership rather than one market, and the directory is the fastest way to find a lab or a distributor in a country you do not work in yet.</p>
          <p class="m-0">The honest limit is the in-person calendar: the Annual Conference and the hands-on workshops happen where the majority of the membership is, and that is a real cost for members who are not.</p>
        </div>
      </details>
      <details class="js-faq-item rounded-2xl border-[1.5px] border-charcoal bg-milk p-5">
        <summary class="font-display cursor-pointer text-lg font-bold tracking-tight">Can I see what it is like before joining?</summary>
        <div class="mt-3 text-[15px] text-[#3A403C]">
          <p class="m-0 mb-2">Some of it. The blog is open to anybody, the competition category standards are public, and the <a href="<?php echo esc_url( home_url( '/library/' ) ); ?>" class="text-brick underline underline-offset-2">Cheese Library</a> is open reference that needs no login. Occasional public webinars are announced on the <a href="<?php echo esc_url( home_url( '/events/' ) ); ?>" class="text-brick underline underline-offset-2">events page</a>.</p>
          <p class="m-0">The brief archive, the competition score sheets and the session recordings are for members. If you want a sense of the brief before committing, ask <a href="mailto:memberservices@morecheese.org" class="text-brick underline underline-offset-2">memberservices@morecheese.org</a> to send you a recent issue.</p>
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
