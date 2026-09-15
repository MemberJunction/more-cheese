<?php
/**
 * Template for the "career-governance" page (/faq/career-governance/).
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
      <p class="mt-4 text-xs font-bold uppercase tracking-[.14em] text-brick">FAQ &middot; Careers &amp; governance</p>
      <h1 class="font-display font-display-tight m-0 mb-4 mt-2 max-w-[20ch] text-[clamp(34px,4.8vw,60px)] font-extrabold leading-[0.96] tracking-tight text-pasture">Vacancies, committees, the vote.</h1>
      <p class="m-0 max-w-[58ch] text-[17px] text-[#3A403C]">Getting into the trade, getting onto a committee, and how a member-governed federation actually decides things. Roles and volunteering are set out in full on the <a href="<?php echo esc_url( home_url( '/careers/' ) ); ?>" class="text-brick underline underline-offset-2">careers page</a>.</p>
    </div>
  </section>

  <section class="mx-auto max-w-[78ch] px-5 py-10">
    <div class="rounded-2xl border-[1.5px] border-charcoal bg-milk p-5">
      <label for="faq-filter" class="font-display mb-1 block text-sm font-bold">Filter these questions</label>
      <input id="faq-filter" type="search" autocomplete="off" placeholder="dues, renewal, exam, directory&hellip;"
             class="w-full rounded-xl border-[1.5px] border-charcoal bg-milk px-4 py-2.5 text-[15px]">
      <div class="mt-3 flex flex-wrap items-center justify-between gap-3">
        <p id="faq-filter-count" class="m-0 text-sm font-semibold text-mid" role="status" aria-live="polite">12 questions on this page.</p>
        <button id="faq-filter-clear" type="button" class="rounded-full border-[1.5px] border-charcoal px-5 py-2 text-sm font-semibold hover:bg-charcoal hover:text-milk">Clear</button>
      </div>
      <noscript>
        <p class="m-0 mt-3 rounded-xl border-[1.5px] border-brick px-4 py-2 text-sm text-brick">Filtering needs JavaScript. Every question is listed below.</p>
      </noscript>
    </div>

    <section class="js-faq-group mb-8" aria-labelledby="g-car">
      <h2 id="g-car" class="font-display m-0 mb-4 text-[26px] font-extrabold tracking-tight text-pasture">Careers and vacancies</h2>
      <div class="space-y-3">
      <details class="js-faq-item rounded-2xl border-[1.5px] border-charcoal bg-milk p-5">
        <summary class="font-display cursor-pointer text-lg font-bold tracking-tight">Do you have a job board?</summary>
        <div class="mt-3 text-[15px] text-[#3A403C]">
          <p class="m-0 mb-2">Vacancies from member organisations go out in the Monday brief and are collected on the <a href="<?php echo esc_url( home_url( '/careers/' ) ); ?>" class="text-brick underline underline-offset-2">careers page</a>, which is open to anyone &mdash; a vacancy nobody outside the membership can see is a vacancy that will not be filled.</p>
          <p class="m-0">Postings are free for member organisations. Non-members can post too, at a modest charge that exists mainly to keep the board free of recruitment-agency volume. Send the role to <a href="mailto:careers@morecheese.org" class="text-brick underline underline-offset-2">careers@morecheese.org</a>.</p>
        </div>
      </details>
      <details class="js-faq-item rounded-2xl border-[1.5px] border-charcoal bg-milk p-5">
        <summary class="font-display cursor-pointer text-lg font-bold tracking-tight">I am trying to get into the trade. Where do I start?</summary>
        <div class="mt-3 text-[15px] text-[#3A403C]">
          <p class="m-0 mb-2">Honestly: the credential ladder and somebody else&rsquo;s cave. The Cheese Foundations Certificate is six weeks and gives you the vocabulary to be useful on day one, which matters more than it sounds &mdash; most entry roles are lost at the point where the candidate cannot describe what they are looking at.</p>
          <p class="m-0">Then the apprenticeship strand, which exists because creameries training their next maker asked for it. The <a href="<?php echo esc_url( home_url( '/careers/' ) ); ?>" class="text-brick underline underline-offset-2">careers page</a> sets out both routes and who to talk to.</p>
        </div>
      </details>
      </div>
    </section>

    <section class="js-faq-group mb-8" aria-labelledby="g-com">
      <h2 id="g-com" class="font-display m-0 mb-4 text-[26px] font-extrabold tracking-tight text-pasture">Committees and volunteering</h2>
      <div class="space-y-3">
      <details class="js-faq-item rounded-2xl border-[1.5px] border-charcoal bg-milk p-5">
        <summary class="font-display cursor-pointer text-lg font-bold tracking-tight">How do I get onto a committee?</summary>
        <div class="mt-3 text-[15px] text-[#3A403C]">
          <p class="m-0 mb-2">Ask. Six committees do most of the Federation&rsquo;s work &mdash; Standards, Food Safety, Education, Events, Membership and Advocacy &mdash; and seats are open to members rather than reserved for the board. An Individual membership includes one.</p>
          <p class="m-0">Write to <a href="mailto:memberservices@morecheese.org" class="text-brick underline underline-offset-2">memberservices@morecheese.org</a> saying which committee and roughly what you would bring. The committees that need people are almost always the ones nobody thinks to ask about; if the one you want is full, they will tell you which one is not and why it might suit you better.</p>
        </div>
      </details>
      <details class="js-faq-item rounded-2xl border-[1.5px] border-charcoal bg-milk p-5">
        <summary class="font-display cursor-pointer text-lg font-bold tracking-tight">What do the six committees actually do?</summary>
        <div class="mt-3 text-[15px] text-[#3A403C]">
          <p class="m-0 mb-2"><b>Standards</b> maintains the six competition category standards and reviews them in public every year after judging. <b>Food Safety</b> owns the HACCP curriculum and the Federation&rsquo;s position on testing regimes. <b>Education</b> owns the credential ladder, the 63-course catalogue and the cohorts.</p>
          <p class="m-0"><b>Events</b> runs the Annual Conference, the workshops and the year-round virtual strand. <b>Membership</b> owns tiers, dues, hardship dues and the organisation directory. <b>Advocacy</b> handles raw-milk rules, labelling, tariffs and import lines, and assembles the comment packets members contribute to.</p>
        </div>
      </details>
      <details class="js-faq-item rounded-2xl border-[1.5px] border-charcoal bg-milk p-5">
        <summary class="font-display cursor-pointer text-lg font-bold tracking-tight">What does committee service involve?</summary>
        <div class="mt-3 text-[15px] text-[#3A403C]">
          <p class="m-0 mb-2">Most committees meet remotely four to six times a year, with work between meetings that is measured in hours rather than days. Terms run three years and start after the October conference.</p>
          <p class="m-0">It counts towards continuing education for members holding a credential, which is worth knowing if you are working towards a reconfirmation date anyway. It is also, by a distance, the fastest way to meet the people who know things.</p>
        </div>
      </details>
      </div>
    </section>

    <section class="js-faq-group mb-8" aria-labelledby="g-gov">
      <h2 id="g-gov" class="font-display m-0 mb-4 text-[26px] font-extrabold tracking-tight text-pasture">Governance, ethics and the vote</h2>
      <div class="space-y-3">
      <details class="js-faq-item rounded-2xl border-[1.5px] border-charcoal bg-milk p-5">
        <summary class="font-display cursor-pointer text-lg font-bold tracking-tight">How does voting work?</summary>
        <div class="mt-3 text-[15px] text-[#3A403C]">
          <p class="m-0 mb-2">Every membership carries one vote, whatever it cost. A $170 Individual membership and a $480 Creamery membership have exactly the same weight, and an organisational membership has one vote rather than one per covered person.</p>
          <p class="m-0">The annual election is announced at the October conference. Members vote on board seats and on anything the board puts forward; results are published with the counts.</p>
        </div>
      </details>
      <details class="js-faq-item rounded-2xl border-[1.5px] border-charcoal bg-milk p-5">
        <summary class="font-display cursor-pointer text-lg font-bold tracking-tight">Who can stand for the board?</summary>
        <div class="mt-3 text-[15px] text-[#3A403C]">
          <p class="m-0 mb-2">Any member in good standing with a few years of membership behind them and some track record of doing the work &mdash; a committee, a chapter, running a session, grading an exam. There is no seniority requirement and no requirement that you run anything large.</p>
          <p class="m-0">The Nominating Committee also looks at the shape of the board as a whole: which regions are represented, which parts of the trade, and what skills the next three years need. If you are considering it, write to <a href="mailto:nominations@morecheese.org" class="text-brick underline underline-offset-2">nominations@morecheese.org</a> early rather than in nomination week.</p>
        </div>
      </details>
      <details class="js-faq-item rounded-2xl border-[1.5px] border-charcoal bg-milk p-5">
        <summary class="font-display cursor-pointer text-lg font-bold tracking-tight">How do I raise an ethics concern?</summary>
        <div class="mt-3 text-[15px] text-[#3A403C]">
          <p class="m-0 mb-2">Write to <a href="mailto:ethics@morecheese.org" class="text-brick underline underline-offset-2">ethics@morecheese.org</a>. The Ethics Committee acknowledges within two working days, decides within about ten whether there is something to look at, and tells both parties if there is. Most matters conclude inside two months.</p>
          <p class="m-0">Outcomes run from no finding through to a written warning, suspension or termination of membership. Raising a concern in good faith is protected: retaliation against a member who does so is itself a matter for the committee.</p>
        </div>
      </details>
      <details class="js-faq-item rounded-2xl border-[1.5px] border-charcoal bg-milk p-5">
        <summary class="font-display cursor-pointer text-lg font-bold tracking-tight">What about a conflict of interest?</summary>
        <div class="mt-3 text-[15px] text-[#3A403C]">
          <p class="m-0 mb-2">Board members and committee volunteers declare interests annually, recuse themselves where a conflict exists, and do not vote on matters that benefit their own businesses. Exam material is written under confidentiality and by rotating panels, so that no single organisation shapes what gets tested.</p>
          <p class="m-0">If you think something was not managed properly, write to <a href="mailto:governance@morecheese.org" class="text-brick underline underline-offset-2">governance@morecheese.org</a> with the names, the decision affected and how you came to know. It is a different inbox from ethics on purpose.</p>
        </div>
      </details>
      <details class="js-faq-item rounded-2xl border-[1.5px] border-charcoal bg-milk p-5">
        <summary class="font-display cursor-pointer text-lg font-bold tracking-tight">Are there awards, and who nominates?</summary>
        <div class="mt-3 text-[15px] text-[#3A403C]">
          <p class="m-0 mb-2">Members nominate members. The awards recognise long service, someone early in their career who has already changed how a room thinks, and work that advanced what the trade knows. They are presented at the October conference.</p>
          <p class="m-0">Nominations open in the spring and are announced in the brief. Self-nomination is allowed and is not held against anyone.</p>
        </div>
      </details>
      <details class="js-faq-item rounded-2xl border-[1.5px] border-charcoal bg-milk p-5">
        <summary class="font-display cursor-pointer text-lg font-bold tracking-tight">Does the Federation lobby?</summary>
        <div class="mt-3 text-[15px] text-[#3A403C]">
          <p class="m-0 mb-2">We file, we explain, and we appear when asked. We do not fund campaigns or take positions on anything beyond the rules that decide what a member can legally make, label and ship.</p>
          <p class="m-0">When a rule is proposed, the Advocacy Committee assembles a comment packet and any member&rsquo;s comment goes into it. That is the mechanism, and it is described in full on the <a href="<?php echo esc_url( home_url( '/advocacy/' ) ); ?>" class="text-brick underline underline-offset-2">advocacy page</a>. Members who want something more forceful than that are usually better served by a body whose stated purpose is campaigning.</p>
        </div>
      </details>
      <details class="js-faq-item rounded-2xl border-[1.5px] border-charcoal bg-milk p-5">
        <summary class="font-display cursor-pointer text-lg font-bold tracking-tight">Why did dues go up?</summary>
        <div class="mt-3 text-[15px] text-[#3A403C]">
          <p class="m-0 mb-2">Dues have moved rarely and by small amounts, and each time the reason is presented to the membership at the October conference with the budget behind it rather than announced in an email.</p>
          <p class="m-0">The recurring drivers are the same three: the course catalogue getting bigger, exam development, and keeping hardship dues funded so that a bad year for a member does not end the membership. If you want the detail, the papers are in the members&rsquo; archive under governance.</p>
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
