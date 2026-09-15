<?php
/**
 * Template for the "advocacy" page (/advocacy/).
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

  <section class="border-b border-charcoal/15 bg-pasture text-white">
    <div class="mx-auto max-w-6xl px-5 py-12 md:px-10 md:py-14">
      <p class="text-xs font-bold uppercase tracking-[.14em] text-clover">Advocacy</p>
      <h1 class="font-display font-display-tight m-0 mb-4 mt-2 max-w-[19ch] text-[clamp(38px,5.4vw,68px)] font-extrabold leading-[0.94] tracking-tight">Somebody has to read the rule.</h1>
      <p class="m-0 max-w-[58ch] text-[17px] opacity-95">Most members do not have time to track a proposed rule through a comment period. The Federation does it for them, and files with the members' own words in the packet.</p>
    </div>
  </section>

  <section class="mx-auto max-w-6xl px-5 py-12 md:px-10" aria-labelledby="work-h">
    <h2 id="work-h" class="font-display m-0 mb-6 text-[34px] font-extrabold tracking-tight">What the Federation works on</h2>
    <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
      <article class="rounded-2xl border-[1.5px] border-charcoal bg-milk p-6">
        <h3 class="font-display m-0 text-[22px] font-bold tracking-tight">Raw-milk rules</h3>
        <p class="m-0 mt-2 text-[15px] text-[#3A403C]">The ageing thresholds, the testing regimes and the interstate rules that decide whether a cheese can legally exist. Our position has been consistent: rules should be written around measured outcomes, and a small maker should be able to meet them without a laboratory on site. We file on every proposal that touches ageing periods, and we publish what we filed.</p>
      </article>
      <article class="rounded-2xl bg-clover p-6">
        <h3 class="font-display m-0 text-[22px] font-bold tracking-tight">Labelling</h3>
        <p class="m-0 mt-2 text-[15px] text-[#243027]">What a label must say, what it may say, and what it must not. Milk type and treatment, ageing claims, the words "artisan" and "farmstead", and the recurring question of whether a style name belongs to a place. A labelling change looks small on paper and costs a creamery a print run, so we argue for long lead-in periods as hard as we argue for the substance.</p>
      </article>
      <article class="rounded-2xl bg-brick p-6 text-white">
        <h3 class="font-display m-0 text-[22px] font-bold tracking-tight">Tariffs</h3>
        <p class="m-0 mt-2 text-[15px] opacity-95">Cheese is a reliable retaliation target, which means our export-active members live with rates that change for reasons that have nothing to do with cheese. We track the lines that matter, tell members when one moves, and make the case that a tariff aimed at a trade dispute lands on a creamery with six employees.</p>
      </article>
      <article class="rounded-2xl border-[1.5px] border-charcoal bg-milk p-6">
        <h3 class="font-display m-0 text-[22px] font-bold tracking-tight">Import lines</h3>
        <p class="m-0 mt-2 text-[15px] text-[#3A403C]">Quotas, licences, inspection holds and the practical business of getting a wheel across a border in the condition it left in. Importers and buyers bring us the cases where a consignment sat too long or a line was reclassified; we take those cases in, anonymised, and use them as evidence.</p>
      </article>
    </div>
  </section>

  <section class="border-y-[1.5px] border-charcoal bg-milk">
    <div class="mx-auto grid max-w-6xl grid-cols-1 gap-10 px-5 py-12 md:px-10 nav:grid-cols-[1fr_1fr]">
      <div>
        <h2 class="font-display m-0 mb-4 text-[28px] font-extrabold tracking-tight">How members comment on proposals</h2>
        <ol class="space-y-3 text-[15px] text-[#3A403C]">
          <li><b class="font-display text-charcoal">1 · We post the proposal.</b> When a rule opens for comment it goes on the <a href="<?php echo esc_url( home_url( '/events/' ) ); ?>" class="text-brick underline underline-offset-2">notice board</a> with the closing date and a plain summary of what would change.</li>
          <li><b class="font-display text-charcoal">2 · You send us your experience.</b> Not a legal argument — what the rule would do to your cave, your label, your route to market. Specific beats eloquent every time.</li>
          <li><b class="font-display text-charcoal">3 · The Advocacy Committee drafts.</b> Members of the committee draft the Federation's position and circulate it to affected members before it is final.</li>
          <li><b class="font-display text-charcoal">4 · Your comment goes in the packet.</b> We file the Federation position with member comments attached, named or anonymised as you prefer.</li>
          <li><b class="font-display text-charcoal">5 · We publish what we filed.</b> Every filing goes into the archive, so a member can see exactly what was said in their name.</li>
        </ol>
        <p class="mt-5 text-[15px] text-mid">The raw-milk labelling proposal closes <b class="text-charcoal">3 October</b>. <a href="<?php echo esc_url( home_url( '/contact/' ) ); ?>" class="text-brick underline underline-offset-2">Send the Advocacy Committee your comment.</a></p>
      </div>
      <div>
        <h2 class="font-display m-0 mb-4 text-[28px] font-extrabold tracking-tight">Themes, 2019–2025</h2>
        <ol class="space-y-3">
          <li class="rounded-2xl border-[1.5px] border-charcoal p-5">
            <b class="font-display text-lg">2019 · Baseline growth</b>
            <p class="m-0 mt-1 text-[15px] text-[#3A403C]">A steady year. Membership grew, tariff lines opened and closed, and the credential ladder took its current four-rung shape.</p>
          </li>
          <li class="rounded-2xl border-[1.5px] border-charcoal p-5">
            <b class="font-display text-lg">2020 · Pandemic support</b>
            <p class="m-0 mt-1 text-[15px] text-[#3A403C]">Food service stopped. The Federation worked on safety-net payments, on getting wholesale-dependent creameries into retail, and on keeping members' memberships alive through a year nobody had budgeted for.</p>
          </li>
          <li class="rounded-2xl bg-clover p-5">
            <b class="font-display text-lg">2021 · Virtual pivot</b>
            <p class="m-0 mt-1 text-[15px] text-[#243027]">The first virtual symposium, meant as a stopgap, reached members who had never travelled to a conference. Online sessions became permanent.</p>
          </li>
          <li class="rounded-2xl border-[1.5px] border-charcoal p-5">
            <b class="font-display text-lg">2022–24 · Artisan boom</b>
            <p class="m-0 mt-1 text-[15px] text-[#3A403C]">Three years of expansion: new creameries, new counters, full cohorts, and a competition that had to cap entries for the first time. Advocacy work shifted to labelling and to defending the ageing thresholds new makers depend on.</p>
          </li>
          <li class="rounded-2xl bg-brick p-5 text-white">
            <b class="font-display text-lg">2025 · Creamery closures and hardship dues</b>
            <p class="m-0 mt-1 text-[15px] opacity-95">Input costs and a firmer milk price closed creameries that had survived 2020. The board introduced hardship dues so that losing the business does not also mean losing the trade, and Advocacy turned to transition support.</p>
          </li>
        </ol>
      </div>
    </div>
  </section>
</main>

<?php
get_footer();
