<?php
/**
 * Template for the "careers" page (/careers/).
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

  <section class="border-b border-charcoal/15 bg-clover">
    <div class="mx-auto max-w-6xl px-5 py-12 md:px-10 md:py-14">
      <p class="text-xs font-bold uppercase tracking-[.14em] text-pasture">Careers &amp; volunteering</p>
      <h1 class="font-display font-display-tight m-0 mb-4 mt-2 max-w-[18ch] text-[clamp(38px,5.4vw,68px)] font-extrabold leading-[0.94] tracking-tight text-pasture">Ways into the trade, and ways further in.</h1>
      <p class="m-0 max-w-[58ch] text-[17px] text-[#243027]">Member vacancies, the apprenticeship strand, the volunteer roles that run the Federation, and the honest version of how people actually get hired in cheese.</p>
      <div class="mt-6 flex flex-wrap gap-2.5">
        <a href="#vacancies" class="rounded-full bg-pasture px-[18px] py-3 text-sm font-bold text-white no-underline hover:bg-[#0E4530]">Member vacancies</a>
        <a href="#volunteer" class="rounded-full border-[1.5px] border-charcoal px-[18px] py-3 text-sm font-semibold text-charcoal no-underline hover:bg-charcoal hover:text-milk">Volunteer roles</a>
      </div>
    </div>
  </section>

  <section class="mx-auto max-w-6xl px-5 py-12 md:px-10" aria-labelledby="routes-h">
    <h2 id="routes-h" class="font-display m-0 mb-2 text-[34px] font-extrabold tracking-tight">Four routes in</h2>
    <p class="m-0 mb-6 max-w-[62ch] text-[15px] text-mid">Nobody in this trade took a straight path and the ones who claim otherwise are rounding. These are the four that come up over and over when members are asked how they started.</p>
    <div class="grid grid-cols-1 gap-4 md:grid-cols-2 nav:grid-cols-4">
      <article class="rounded-2xl border-[1.5px] border-charcoal bg-milk p-5">
        <p class="m-0 text-[11px] font-bold uppercase tracking-[.14em] text-brick">Route one</p>
        <h3 class="font-display m-0 mt-1 text-[20px] font-bold leading-tight tracking-tight">Behind a counter</h3>
        <p class="m-0 mt-2 text-[14px] text-[#3A403C]">The commonest start and the most underrated. A year on a good counter teaches you more about how cheese behaves than a year of reading, and it is the only entry role that regularly hires people with no experience at all.</p>
      </article>
      <article class="rounded-2xl border-[1.5px] border-charcoal bg-milk p-5">
        <p class="m-0 text-[11px] font-bold uppercase tracking-[.14em] text-brick">Route two</p>
        <h3 class="font-display m-0 mt-1 text-[20px] font-bold leading-tight tracking-tight">Into somebody&rsquo;s make</h3>
        <p class="m-0 mt-2 text-[14px] text-[#3A403C]">Early mornings, heavy work, and the fastest possible education. Creameries hire for reliability before knowledge; the people who last are the ones who turn up at five for a year without being interesting about it.</p>
      </article>
      <article class="rounded-2xl border-[1.5px] border-charcoal bg-milk p-5">
        <p class="m-0 text-[11px] font-bold uppercase tracking-[.14em] text-brick">Route three</p>
        <h3 class="font-display m-0 mt-1 text-[20px] font-bold leading-tight tracking-tight">Sideways from food science</h3>
        <p class="m-0 mt-2 text-[14px] text-[#3A403C]">Quality, laboratory and technical roles take people from dairy and food science programs directly. The gap to close is sensory: a lab result and a tasting note have to agree, and only one of them is taught at university.</p>
      </article>
      <article class="rounded-2xl bg-pasture p-5 text-white">
        <p class="m-0 text-[11px] font-bold uppercase tracking-[.14em] text-clover">Route four</p>
        <h3 class="font-display m-0 mt-1 text-[20px] font-bold leading-tight tracking-tight">Credential first</h3>
        <p class="m-0 mt-2 text-[14px] opacity-95">The Cheese Foundations Certificate is six weeks and gives you the vocabulary to be useful on day one. Most entry interviews are lost at the point where a candidate cannot describe what they are holding.</p>
        <a href="<?php echo esc_url( home_url( '/learn/' ) ); ?>" class="mt-3 inline-block text-[13px] font-bold text-clover underline underline-offset-2">See the ladder &rarr;</a>
      </article>
    </div>
  </section>

  <section id="vacancies" class="border-y-[1.5px] border-charcoal bg-milk scroll-mt-4">
    <div class="mx-auto grid max-w-6xl grid-cols-1 gap-10 px-5 py-12 md:px-10 nav:grid-cols-[1.15fr_1fr]">
      <div>
        <h2 class="font-display m-0 mb-4 text-[34px] font-extrabold tracking-tight">Member vacancies</h2>
        <p class="m-0 mb-3 text-[15px] text-[#3A403C]">Roles at member organizations go out in the Monday brief and are collected here. The board is open to anyone, member or not &mdash; a vacancy that only members can see is a vacancy that will not be filled, and the point is to get people into the trade rather than to reward being in it already.</p>
        <p class="m-0 mb-3 text-[15px] text-[#3A403C]">What gets posted, in rough order of volume: counter and shop-floor roles, assistant makers, affineurs, quality and laboratory positions, wholesale and account roles, and every so often a creamery looking for the person who will eventually take it over.</p>
        <p class="m-0 mb-3 text-[15px] text-[#3A403C]">What does not: anything without a stated pay range. The Membership Committee took that decision in 2024 after members asked for it, and it removed about a fifth of submissions in the first month. None of them came back to complain.</p>
        <p class="m-0 text-[15px] text-[#3A403C]">Registration and applications are not live on this demonstration site. <a href="<?php echo esc_url( home_url( '/contact/' ) ); ?>" class="text-brick underline underline-offset-2">Ask about anything on the board</a> and it will be routed to the right member organization.</p>
      </div>
      <div class="space-y-4">
        <div class="rounded-2xl bg-clover p-6">
          <h3 class="font-display m-0 text-xl font-bold tracking-tight">Posting a vacancy</h3>
          <p class="m-0 mt-2 text-[15px] text-[#243027]">Free for member organizations, on every tier, with no limit on how many. Non-members pay a modest fee that exists to keep recruitment-agency volume off the board rather than to make money.</p>
          <p class="m-0 mt-2 text-[15px] text-[#243027]">Send the role, the location, the pay range and a contact to <a href="mailto:careers@morecheese.org" class="text-pasture underline underline-offset-2">careers@morecheese.org</a>. It goes into the next brief.</p>
        </div>
        <div class="rounded-2xl border-[1.5px] border-charcoal p-6">
          <h3 class="font-display m-0 text-xl font-bold tracking-tight">The apprenticeship strand</h3>
          <p class="m-0 mt-2 text-[15px] text-[#3A403C]">Built because creameries training their next maker asked for it. A webinar series on how to structure an apprenticeship, what to teach in what order, and what the trainee should be able to do by month six &mdash; plus a small fund that helps a member creamery carry an apprentice through a first season.</p>
          <p class="m-0 mt-2 text-[15px] text-[#3A403C]">Both sides are welcome: creameries who want to train, and people who want to be trained. <a href="<?php echo esc_url( home_url( '/events/' ) ); ?>" class="text-brick underline underline-offset-2">Dates are on the notice board.</a></p>
        </div>
      </div>
    </div>
  </section>

  <section id="volunteer" class="mx-auto max-w-6xl px-5 py-12 md:px-10 scroll-mt-4" aria-labelledby="vol-h">
    <h2 id="vol-h" class="font-display m-0 mb-2 text-[34px] font-extrabold tracking-tight">Volunteer roles</h2>
    <p class="m-0 mb-6 max-w-[62ch] text-[15px] text-mid">The staff are small by design; most of the Federation&rsquo;s work is done by members. Every role here is open to any member in good standing, and service counts toward reconfirming a credential.</p>
    <div class="grid grid-cols-1 gap-4 md:grid-cols-2 nav:grid-cols-3">
      <article class="rounded-2xl border-[1.5px] border-charcoal bg-milk p-5">
        <h3 class="font-display m-0 text-[19px] font-bold tracking-tight">Committee seat</h3>
        <p class="m-0 mt-2 text-[14px] text-[#3A403C]">Standards, Food Safety, Education, Events, Membership or Advocacy. Four to six remote meetings a year, three-year terms starting after the October conference, and real decisions rather than advisory ones.</p>
        <p class="m-0 mt-2 text-[13px] text-mid">Individual membership includes a seat.</p>
      </article>
      <article class="rounded-2xl border-[1.5px] border-charcoal bg-milk p-5">
        <h3 class="font-display m-0 text-[19px] font-bold tracking-tight">Session moderator</h3>
        <p class="m-0 mt-2 text-[14px] text-[#3A403C]">Keep a conference session to time, keep the questions honest, and make sure the quiet person at the back gets asked. No preparation beyond reading the abstract; apply when the call for sessions opens.</p>
        <p class="m-0 mt-2 text-[13px] text-mid">Good first volunteer role.</p>
      </article>
      <article class="rounded-2xl border-[1.5px] border-charcoal bg-milk p-5">
        <h3 class="font-display m-0 text-[19px] font-bold tracking-tight">Exam grader</h3>
        <p class="m-0 mt-2 text-[14px] text-[#3A403C]">Grade the written and sensory components of the Certified Cheese Professional exam. Needs the credential yourself and several years in the trade, and it is the role that most changes how people think about their own palate.</p>
        <p class="m-0 mt-2 text-[13px] text-mid">Panels rotate; nobody grades every sitting.</p>
      </article>
      <article class="rounded-2xl bg-clover p-5">
        <h3 class="font-display m-0 text-[19px] font-bold tracking-tight">Competition judge</h3>
        <p class="m-0 mt-2 text-[14px] text-[#243027]">Judge blind, to the published category standard, on a panel that has to reconcile when it disagrees. Training is provided and required, and first-year judges sit alongside experienced ones rather than alone.</p>
        <p class="m-0 mt-2 text-[13px] text-[#41503F]">See the <a href="<?php echo esc_url( home_url( '/compete/' ) ); ?>" class="text-pasture underline underline-offset-2">six categories</a>.</p>
      </article>
      <article class="rounded-2xl border-[1.5px] border-charcoal bg-milk p-5">
        <h3 class="font-display m-0 text-[19px] font-bold tracking-tight">Meetup host</h3>
        <p class="m-0 mt-2 text-[14px] text-[#3A403C]">Put six people in a room with something to taste. That is genuinely the whole job, and the regional calendar exists entirely because members do it. The Events team will find you the other members nearby.</p>
        <p class="m-0 mt-2 text-[13px] text-mid">No committee, no term, no paperwork.</p>
      </article>
      <article class="rounded-2xl border-[1.5px] border-charcoal bg-milk p-5">
        <h3 class="font-display m-0 text-[19px] font-bold tracking-tight">Mentor an apprentice</h3>
        <p class="m-0 mt-2 text-[14px] text-[#3A403C]">Take one person through a season in your own make. What a maker knows is mostly undocumented and it leaves when they do, which is the quiet crisis in this trade and the reason the strand exists.</p>
        <p class="m-0 mt-2 text-[13px] text-mid">Support and structure provided.</p>
      </article>
    </div>
    <p class="m-0 mt-6 text-[15px] text-[#3A403C]">Ask for any of these through <a href="<?php echo esc_url( home_url( '/contact/' ) ); ?>" class="text-brick underline underline-offset-2">the contact page</a> or at <a href="mailto:memberservices@morecheese.org" class="text-brick underline underline-offset-2">memberservices@morecheese.org</a>. The committees that need people are almost always the ones nobody thinks to ask about; if the one you want is full, someone will tell you which is not and why it might suit you better. Governance, terms and the annual election are covered in the <a href="<?php echo esc_url( home_url( '/faq/career-governance/' ) ); ?>" class="text-brick underline underline-offset-2">careers and governance FAQ</a>.</p>
  </section>

  <section class="border-t-[1.5px] border-charcoal bg-milk">
    <div class="mx-auto grid max-w-6xl grid-cols-1 gap-10 px-5 py-12 md:px-10 nav:grid-cols-2">
      <div>
        <h2 class="font-display m-0 mb-4 text-[28px] font-extrabold tracking-tight">Working for the Federation</h2>
        <p class="m-0 mb-3 text-[15px] text-[#3A403C]">Five roles carry the day-to-day work: Executive Director, Membership Operations, Communications, Education Programs and Events. That is the whole staff, and it is deliberate &mdash; a larger office would do worse work than several hundred members on committees.</p>
        <p class="m-0 mb-3 text-[15px] text-[#3A403C]">Vacancies here are rare and are posted on this page alongside member roles rather than in a separate portal. Speculative approaches are read; roles in a body this size tend to get built around the person rather than the other way round.</p>
        <p class="m-0 text-[15px] text-[#3A403C]">Write to <a href="mailto:careers@morecheese.org" class="text-brick underline underline-offset-2">careers@morecheese.org</a> with what you would want to do. The <a href="<?php echo esc_url( home_url( '/about/' ) ); ?>" class="text-brick underline underline-offset-2">about page</a> describes what each role actually covers.</p>
      </div>
      <div class="rounded-2xl bg-pasture p-6 text-white md:p-8">
        <h2 class="font-display m-0 text-[26px] font-extrabold tracking-tight">The thing members say moved their career</h2>
        <p class="m-0 mt-3 text-[15px] opacity-95">Asked what changed things for them, members name the credential ladder first and the cohort they came up with second &mdash; Brook, Meadow, Alpine or Birch, eighteen to twenty-four people who started and finished together and mostly still talk.</p>
        <p class="m-0 mt-3 text-[15px] opacity-95">Nobody names a job advert. That is worth knowing if you are deciding where to put your first $170.</p>
        <a href="<?php echo esc_url( home_url( '/join/' ) ); ?>" class="mt-5 inline-block rounded-full bg-milk px-6 py-3 text-sm font-bold text-pasture no-underline hover:bg-clover">See the membership tiers</a>
      </div>
    </div>
  </section>
</main>

<?php
get_footer();
