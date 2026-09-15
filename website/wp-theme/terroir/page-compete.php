<?php
/**
 * Template for the "compete" page (/compete/).
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

  <section class="border-b border-charcoal/15 bg-brick text-white">
    <div class="mx-auto max-w-6xl px-5 py-12 md:px-10 md:py-14">
      <p class="text-xs font-bold uppercase tracking-[.14em] text-clover">Competition</p>
      <h1 class="font-display font-display-tight m-0 mb-4 mt-2 max-w-[17ch] text-[clamp(38px,5.4vw,68px)] font-extrabold leading-[0.94] tracking-tight">Judged blind. Scored on paper.</h1>
      <p class="m-0 max-w-[58ch] text-[17px] opacity-95">The annual competition runs in six categories. Judges never see a label, results are published with the score sheets, and entries open in January. Creamery-tier membership includes entry.</p>
      <div class="mt-6 flex flex-wrap gap-2.5">
        <a href="<?php echo esc_url( home_url( '/join/' ) ); ?>" class="rounded-full bg-milk px-[18px] py-3 text-sm font-bold text-brick no-underline hover:bg-clover hover:text-charcoal">Creamery membership includes entry</a>
        <a href="<?php echo esc_url( home_url( '/events/' ) ); ?>" class="rounded-full border-[1.5px] border-white px-[18px] py-3 text-sm font-semibold text-white no-underline hover:bg-white hover:text-brick">See the calendar</a>
      </div>
    </div>
  </section>

  <section class="mx-auto max-w-6xl px-5 py-12 md:px-10" aria-labelledby="cats-h">
    <h2 id="cats-h" class="font-display m-0 mb-2 text-[34px] font-extrabold tracking-tight">The six categories</h2>
    <p class="m-0 mb-6 max-w-[60ch] text-[15px] text-[#3A403C]">Enter as many as you like; each wheel is entered in one category only, and the category you choose is the standard you are judged against.</p>
    <div class="grid grid-cols-1 gap-4 md:grid-cols-2 nav:grid-cols-3">
      <article class="rounded-2xl border-[1.5px] border-charcoal bg-milk p-6">
        <h3 class="font-display m-0 text-[22px] font-bold tracking-tight">Soft-Ripened</h3>
        <p class="m-0 mt-2 text-sm text-[#3A403C]">Bloomy rinds, judged on the state of the paste at the moment it reaches the table — not on how impressive it looked a week early.</p>
      </article>
      <article class="rounded-2xl bg-clover p-6">
        <h3 class="font-display m-0 text-[22px] font-bold tracking-tight">Alpine Styles</h3>
        <p class="m-0 mt-2 text-sm text-[#243027]">Mountain-style wheels, large formats included. Eyes, body and the long sweet finish that separates a good one from a correct one.</p>
      </article>
      <article class="rounded-2xl border-[1.5px] border-charcoal bg-milk p-6">
        <h3 class="font-display m-0 text-[22px] font-bold tracking-tight">Aged Cheddar &amp; Territorials</h3>
        <p class="m-0 mt-2 text-sm text-[#3A403C]">Cheddars over twelve months and the regional territorials alongside them. Texture and crystal development count as much as flavour.</p>
      </article>
      <article class="rounded-2xl bg-pasture p-6 text-white">
        <h3 class="font-display m-0 text-[22px] font-bold tracking-tight">Blue</h3>
        <p class="m-0 mt-2 text-sm opacity-95">Veining, salt balance and whether the blue is in service of the cheese or has simply taken it over.</p>
      </article>
      <article class="rounded-2xl border-[1.5px] border-charcoal bg-milk p-6">
        <h3 class="font-display m-0 text-[22px] font-bold tracking-tight">Washed-Rind</h3>
        <p class="m-0 mt-2 text-sm text-[#3A403C]">The category that punishes a careless cave. Rind condition, aroma and the gap between what the nose promises and the paste delivers.</p>
      </article>
      <article class="rounded-2xl border-[1.5px] border-charcoal bg-milk p-6">
        <h3 class="font-display m-0 text-[22px] font-bold tracking-tight">Fresh</h3>
        <p class="m-0 mt-2 text-sm text-[#3A403C]">Chèvre, pasta filata, quark and the rest — where there is nowhere to hide, because age cannot fix anything.</p>
      </article>
    </div>
  </section>

  <section class="border-y-[1.5px] border-charcoal bg-milk">
    <div class="mx-auto grid max-w-6xl grid-cols-1 gap-10 px-5 py-12 md:px-10 nav:grid-cols-[1.1fr_1fr]">
      <div>
        <h2 class="font-display m-0 mb-4 text-[28px] font-extrabold tracking-tight">How judging works</h2>
        <ol class="space-y-3 text-[15px] text-[#3A403C]">
          <li><b class="font-display text-charcoal">1 · Entries are stripped.</b> Every wheel is re-labelled with a number when it arrives. Judges see the number and the category, nothing else — no creamery, no region, no story.</li>
          <li><b class="font-display text-charcoal">2 · Panels of three.</b> Each category is judged by a panel of three, drawn from makers, affineurs and buyers so that no single point of view sets the standard.</li>
          <li><b class="font-display text-charcoal">3 · A score sheet per wheel.</b> Appearance and rind, aroma, texture, flavour, and finish, each scored against the category standard, with written comments required for any score at either extreme.</li>
          <li><b class="font-display text-charcoal">4 · Faults are named.</b> A wheel that is downscored is told why: the specific fault, not a number alone. This is the part entrants say they come back for.</li>
          <li><b class="font-display text-charcoal">5 · Panels reconcile.</b> Where the three sheets disagree sharply, the panel re-tastes together and records the disagreement rather than averaging it away.</li>
          <li><b class="font-display text-charcoal">6 · Results are published with the sheets.</b> Every entrant receives their own sheets; placings and the full category sheets go up on the site after the Annual Conference.</li>
        </ol>
      </div>
      <div>
        <div class="rounded-2xl bg-clover p-6">
          <h2 class="font-display m-0 text-2xl font-bold tracking-tight">Entering</h2>
          <dl class="mt-4 space-y-3 text-[15px] text-[#243027]">
            <div><dt class="font-display font-bold text-charcoal">Entries open</dt><dd class="m-0">January, and close when the category fills.</dd></div>
            <div><dt class="font-display font-bold text-charcoal">Who can enter</dt><dd class="m-0">Any member creamery. Creamery-tier membership includes entry at no extra fee; other tiers pay a per-wheel fee.</dd></div>
            <div><dt class="font-display font-bold text-charcoal">What you send</dt><dd class="m-0">A whole wheel or a cut of the published minimum weight, shipped cold, with the make date and the milk declared.</dd></div>
            <div><dt class="font-display font-bold text-charcoal">Results</dt><dd class="m-0">Announced at the Annual Conference in October and published with the score sheets the same week.</dd></div>
          </dl>
          <a href="<?php echo esc_url( home_url( '/join/' ) ); ?>" class="mt-5 inline-block rounded-full bg-pasture px-5 py-3 text-sm font-bold text-white no-underline hover:bg-[#0E4530]">See Creamery membership</a>
        </div>
        <p class="mt-5 text-[15px] text-mid">Standards for each category are maintained by the Standards Committee and reviewed every year after judging. The <a href="<?php echo esc_url( home_url( '/events/' ) ); ?>" class="text-brick underline underline-offset-2">Judging Standards session</a> on 17 September walks through all six.</p>
      </div>
    </div>
  </section>
</main>

<?php
get_footer();
