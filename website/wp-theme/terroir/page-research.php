<?php
/**
 * Template for the "research" page (/research/).
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
      <p class="text-xs font-bold uppercase tracking-[.14em] text-brick">Research &amp; publications</p>
      <h1 class="font-display font-display-tight m-0 mb-4 mt-2 max-w-[19ch] text-[clamp(38px,5.4vw,68px)] font-extrabold leading-[0.94] tracking-tight text-pasture">Arguments settled with data.</h1>
      <p class="m-0 max-w-[58ch] text-[17px] text-[#3A403C]">The Federation publishes for one reason: members kept having the same arguments with no numbers to hand. Four standing reports a year, the journal articles the committees commission, and the Monday brief that carries the week.</p>
      <dl class="mt-8 grid max-w-3xl grid-cols-2 gap-6 nav:grid-cols-4">
        <div><dt class="text-xs font-bold uppercase tracking-[.14em] text-brick">Produced globally</dt><dd class="font-display m-0 text-[32px] font-extrabold leading-none tracking-tight">22.6M<span class="block text-xs font-semibold text-mid">tonnes a year</span></dd></div>
        <div><dt class="text-xs font-bold uppercase tracking-[.14em] text-brick">Market value</dt><dd class="font-display m-0 text-[32px] font-extrabold leading-none tracking-tight">$98B<span class="block text-xs font-semibold text-mid">at wholesale</span></dd></div>
        <div><dt class="text-xs font-bold uppercase tracking-[.14em] text-brick">Annual growth</dt><dd class="font-display m-0 text-[32px] font-extrabold leading-none tracking-tight">3.2%<span class="block text-xs font-semibold text-mid">five-year mean</span></dd></div>
        <div><dt class="text-xs font-bold uppercase tracking-[.14em] text-brick">Crosses a border</dt><dd class="font-display m-0 text-[32px] font-extrabold leading-none tracking-tight">1 in 4<span class="block text-xs font-semibold text-mid">wheels made</span></dd></div>
      </dl>
      <p class="m-0 mt-4 max-w-[58ch] text-sm text-mid">Figures from the Federation&rsquo;s own annual assessment. Methodology notes are published with every report and are open to non-members.</p>
    </div>
  </section>

  <section class="mx-auto max-w-6xl px-5 py-12 md:px-10" aria-labelledby="reports-h">
    <h2 id="reports-h" class="font-display m-0 mb-2 text-[34px] font-extrabold tracking-tight">The standing reports</h2>
    <p class="m-0 mb-6 max-w-[62ch] text-[15px] text-mid">Four reports, published on the same cycle every year so that a member planning a season knows when the numbers land. Members get all four as they publish; non-members can buy them individually.</p>
    <div class="grid grid-cols-1 gap-4 md:grid-cols-2">

      <article class="flex flex-col rounded-2xl bg-pasture p-6 text-white">
        <p class="m-0 text-[11px] font-bold uppercase tracking-[.14em] text-clover">Market &middot; published January</p>
        <h3 class="font-display m-0 mt-1 text-[24px] font-bold leading-tight tracking-tight">Global production and consumption</h3>
        <p class="m-0 mt-3 flex-1 text-[15px] opacity-95">Where the 22.6 million tonnes are made and where they are eaten, by category and by region, with a ten-year projection. The section members read first is the one on which styles are growing in markets that did not previously buy them &mdash; the answer has changed three years running.</p>
        <p class="m-0 mt-4 text-[13px] text-clover">Members: in the archive on publication. Non-members: <a href="<?php echo esc_url( home_url( '/contact/' ) ); ?>" class="text-white underline underline-offset-2">request a copy</a>.</p>
      </article>

      <article class="flex flex-col rounded-2xl border-[1.5px] border-charcoal bg-milk p-6">
        <p class="m-0 text-[11px] font-bold uppercase tracking-[.14em] text-brick">Trade &middot; published April</p>
        <h3 class="font-display m-0 mt-1 text-[24px] font-bold leading-tight tracking-tight">Export and trade barriers</h3>
        <p class="m-0 mt-3 flex-1 text-[15px] text-[#3A403C]">Tariff structures, the non-tariff barriers that cost more than tariffs, sanitary requirements, and what trade agreements have actually done to member shipments as opposed to what they were said they would do. Written for a maker deciding whether an export line is worth the paperwork.</p>
        <p class="m-0 mt-4 text-[13px] text-mid">Feeds the <a href="<?php echo esc_url( home_url( '/advocacy/' ) ); ?>" class="text-brick underline underline-offset-2">advocacy programme</a> directly.</p>
      </article>

      <article class="flex flex-col rounded-2xl border-[1.5px] border-charcoal bg-milk p-6">
        <p class="m-0 text-[11px] font-bold uppercase tracking-[.14em] text-brick">Regulatory &middot; published July</p>
        <h3 class="font-display m-0 mt-1 text-[24px] font-bold leading-tight tracking-tight">Regulatory frameworks by region</h3>
        <p class="m-0 mt-3 flex-1 text-[15px] text-[#3A403C]">A comparative read of food safety rules, labelling requirements and certification standards across the regions members work in, with the divergences called out rather than averaged away. Raw-milk rules get their own chapter because they generate more member questions than everything else combined.</p>
        <p class="m-0 mt-4 text-[13px] text-mid">Maintained with the Food Safety and Advocacy committees.</p>
      </article>

      <article class="flex flex-col rounded-2xl bg-clover p-6">
        <p class="m-0 text-[11px] font-bold uppercase tracking-[.14em] text-pasture">Consumer &middot; published October</p>
        <h3 class="font-display m-0 mt-1 text-[24px] font-bold leading-tight tracking-tight">Preference shifts, specialty against commodity</h3>
        <p class="m-0 mt-3 flex-1 text-[15px] text-[#243027]">What buyers say they want, what they actually put in a basket, and the gap between the two. Tracks health framing, sustainability claims, price sensitivity by format, and the slow drift of specialty styles into ordinary weekly shopping.</p>
        <p class="m-0 mt-4 text-[13px] text-[#41503F]">Presented at the October conference before it is published.</p>
      </article>
    </div>
  </section>

  <section class="border-y-[1.5px] border-charcoal bg-milk">
    <div class="mx-auto max-w-6xl px-5 py-12 md:px-10" aria-labelledby="journal-h">
      <h2 id="journal-h" class="font-display m-0 mb-2 text-[34px] font-extrabold tracking-tight">Journal articles</h2>
      <p class="m-0 mb-6 max-w-[62ch] text-[15px] text-mid">Longer pieces, reviewed by members who know the subject, published when they are ready rather than to a schedule. Four from the current volume.</p>
      <div class="space-y-3">
        <article class="rounded-2xl border-[1.5px] border-charcoal p-5">
          <h3 class="font-display m-0 text-[20px] font-bold tracking-tight">The ecology of uncertainty: managing systemic risk in a small make</h3>
          <p class="m-0 mt-2 text-[15px] text-[#3A403C]">Biological, economic and regulatory uncertainty arrive at a creamery through the same door, and the paper&rsquo;s argument is that treating them as three problems is why small makes fail at the third one. Includes the failure taxonomy the Food Safety Committee has since adopted in the HACCP curriculum.</p>
        </article>
        <article class="rounded-2xl border-[1.5px] border-charcoal p-5">
          <h3 class="font-display m-0 text-[20px] font-bold tracking-tight">Balancing tradition and innovation in artisan cheese</h3>
          <p class="m-0 mt-2 text-[15px] text-[#3A403C]">How craft producers absorb modern food science without losing what makes the make theirs. The interesting finding is negative: the producers who described the two as opposed were markedly more likely to have had a serious quality failure in the previous three years.</p>
        </article>
        <article class="rounded-2xl border-[1.5px] border-charcoal p-5">
          <h3 class="font-display m-0 text-[20px] font-bold tracking-tight">Knowledge preservation in craft cheesemaking</h3>
          <p class="m-0 mt-2 text-[15px] text-[#3A403C]">Succession is the quiet crisis in the trade: what a maker knows is mostly undocumented, and it leaves when they do. The article sets out what can realistically be written down, what can only be transferred by standing next to someone, and why the apprenticeship strand is built the way it is.</p>
        </article>
        <article class="rounded-2xl border-[1.5px] border-charcoal p-5">
          <h3 class="font-display m-0 text-[20px] font-bold tracking-tight">Climate pressure on dairy-based cheesemaking</h3>
          <p class="m-0 mt-2 text-[15px] text-[#3A403C]">Hotter summers change the cave before they change the herd. A strategic read of what members are already adapting &mdash; ripening schedules, cave engineering, seasonal make plans &mdash; and what the trade has not begun to address.</p>
        </article>
      </div>
      <p class="m-0 mt-6 text-[15px] text-[#3A403C]">Members read the full text in the archive. Non-members can <a href="<?php echo esc_url( home_url( '/contact/' ) ); ?>" class="text-brick underline underline-offset-2">request an individual article</a>; abstracts are open to everyone.</p>
    </div>
  </section>

  <section class="mx-auto grid max-w-6xl grid-cols-1 gap-10 px-5 py-12 md:px-10 nav:grid-cols-[1.1fr_1fr]">
    <div>
      <h2 class="font-display m-0 mb-4 text-[28px] font-extrabold tracking-tight">The Monday brief</h2>
      <p class="m-0 mb-3 text-[15px] text-[#3A403C]">One email a week to every member: what prices did, what moved in policy, what other members are doing, and what closes this fortnight. Written to be read in five minutes by somebody who has already been up for four hours.</p>
      <p class="m-0 mb-3 text-[15px] text-[#3A403C]">Behind it sits the archive &mdash; every issue since the Federation started publishing, searchable, alongside the competition score sheets, the comment filings and every recorded session. It is the most under-used thing in the membership, and members who find it tend to find it eighteen months in, by accident.</p>
      <p class="m-0 text-[15px] text-[#3A403C]">The <a href="<?php echo esc_url( home_url( '/blog/' ) ); ?>" class="text-brick underline underline-offset-2">blog</a> is the open half of the same work and needs no membership at all.</p>
    </div>
    <div class="space-y-4">
      <div class="rounded-2xl bg-clover p-6">
        <h3 class="font-display m-0 text-xl font-bold tracking-tight">Open to everyone</h3>
        <p class="m-0 mt-2 text-[15px] text-[#243027]">The blog, the six competition category standards, the <a href="<?php echo esc_url( home_url( '/library/' ) ); ?>" class="text-brick underline underline-offset-2">Cheese Library</a>, report summaries and every methodology note. A standard nobody can read is not a standard.</p>
      </div>
      <div class="rounded-2xl border-[1.5px] border-charcoal p-6">
        <h3 class="font-display m-0 text-xl font-bold tracking-tight">Members only</h3>
        <p class="m-0 mt-2 text-[15px] text-[#3A403C]">The brief archive, full report text, competition score sheets and session recordings. <a href="<?php echo esc_url( home_url( '/join/' ) ); ?>" class="text-brick underline underline-offset-2">Dues start at $170</a> and every tier gets the same access.</p>
      </div>
      <div class="rounded-2xl border-[1.5px] border-brick p-6">
        <h3 class="font-display m-0 text-xl font-bold tracking-tight text-brick">Propose research</h3>
        <p class="m-0 mt-2 text-[15px] text-[#3A403C]">Committees commission work when an argument needs settling. If you have the question, or the data, write to the Standards or Food Safety committee through the contact page.</p>
        <a href="<?php echo esc_url( home_url( '/contact/' ) ); ?>" class="mt-4 inline-block rounded-full bg-brick px-5 py-2.5 text-sm font-bold text-white no-underline hover:brightness-110">Put a question forward</a>
      </div>
    </div>
  </section>

  <section class="mx-auto max-w-6xl px-5 pb-14 md:px-10">
    <div class="rounded-2xl border-[1.5px] border-charcoal bg-milk p-6 md:p-8">
      <h2 class="font-display m-0 mb-3 text-2xl font-bold tracking-tight">Using and citing this work</h2>
      <p class="m-0 mb-3 text-[15px] text-[#3A403C]">Quote it with attribution &mdash; that is what it is for, and a member reprinting a brief item in their own newsletter is a compliment rather than a problem. Reproducing a whole report or a full set of score sheets needs a word with Communications first, mainly so that we can point you at the current version. The competition category standards may be reproduced in full by anyone, member or not.</p>
      <p class="m-0 text-[15px] text-[#3A403C]">Questions about a figure, a method or a citation go to <a href="mailto:research@morecheese.org" class="text-brick underline underline-offset-2">research@morecheese.org</a>. Advertising and sponsorship go to <a href="mailto:advertising@morecheese.org" class="text-brick underline underline-offset-2">advertising@morecheese.org</a>, and the answer to &ldquo;can I have the member list&rdquo; is on the <a href="<?php echo esc_url( home_url( '/faq/organization-directory/' ) ); ?>" class="text-brick underline underline-offset-2">directory FAQ</a>.</p>
    </div>
  </section>
</main>

<?php
get_footer();
