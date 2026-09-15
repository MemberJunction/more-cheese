<?php
/**
 * Template for the "join" page (/join/).
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
      <p class="text-xs font-bold uppercase tracking-[.14em] text-pasture">Membership</p>
      <h1 class="font-display font-display-tight m-0 mb-4 mt-2 max-w-[18ch] text-[clamp(38px,5.4vw,68px)] font-extrabold leading-[0.94] tracking-tight text-pasture">Four tiers, one federation.</h1>
      <p class="m-0 max-w-[56ch] text-[17px] text-[#243027]">Dues start at $170 a year. Every tier carries the same vote, the same weekly brief and the same discount on credential exams — the difference is how many people at your organisation the membership covers, and what your organisation needs from us.</p>
    </div>
  </section>

  <section class="mx-auto max-w-6xl px-5 py-12 md:px-10" aria-labelledby="tiers-h">
    <h2 id="tiers-h" class="font-display m-0 mb-6 text-[34px] font-extrabold tracking-tight">The rate card</h2>
    <div class="grid grid-cols-1 gap-4 md:grid-cols-2 nav:grid-cols-4">

      <article class="flex flex-col rounded-2xl bg-pasture p-6 text-white">
        <h3 class="font-display m-0 text-2xl font-bold tracking-tight">Individual</h3>
        <p class="font-display m-0 mt-1 text-[40px] font-extrabold leading-none tracking-tight">$170<span class="text-base font-semibold opacity-80">/yr</span></p>
        <p class="mt-3 text-sm opacity-95">For one person: a monger behind a counter, a maker between jobs, a student on the ladder.</p>
        <ul class="mt-4 flex-1 space-y-2 text-sm">
          <li>Credential exam discounts on every rung of the ladder</li>
          <li>The weekly brief, plus the full archive</li>
          <li>One committee seat of your choosing</li>
        </ul>
        <a href="<?php echo esc_url( home_url( '/contact/' ) ); ?>" class="mt-5 rounded-full bg-milk px-5 py-3 text-center text-sm font-bold text-pasture no-underline hover:bg-clover">Join as an Individual</a>
      </article>

      <article class="flex flex-col rounded-2xl border-[1.5px] border-charcoal bg-milk p-6">
        <h3 class="font-display m-0 text-2xl font-bold tracking-tight">Creamery</h3>
        <p class="font-display m-0 mt-1 text-[40px] font-extrabold leading-none tracking-tight text-pasture">$480<span class="text-base font-semibold text-mid">/yr</span></p>
        <p class="mt-3 text-sm text-[#3A403C]">For the people who make the cheese, from a two-vat farmstead to a regional plant.</p>
        <ul class="mt-4 flex-1 space-y-2 text-sm text-[#3A403C]">
          <li>Covers up to 6 staff under one membership</li>
          <li>Competition entry included — no per-wheel fee</li>
          <li>Listing in the buyers' directory</li>
        </ul>
        <a href="<?php echo esc_url( home_url( '/contact/' ) ); ?>" class="mt-5 rounded-full bg-pasture px-5 py-3 text-center text-sm font-bold text-white no-underline hover:bg-[#0E4530]">Join as a Creamery</a>
      </article>

      <article class="flex flex-col rounded-2xl border-[1.5px] border-charcoal bg-milk p-6">
        <h3 class="font-display m-0 text-2xl font-bold tracking-tight">Retailer</h3>
        <p class="font-display m-0 mt-1 text-[40px] font-extrabold leading-none tracking-tight text-pasture">$390<span class="text-base font-semibold text-mid">/yr</span></p>
        <p class="mt-3 text-sm text-[#3A403C]">For shops, counters and wholesale buyers who have to make the case in front of a customer.</p>
        <ul class="mt-4 flex-1 space-y-2 text-sm text-[#3A403C]">
          <li>Covers up to 4 staff under one membership</li>
          <li>Priority in Certified Cheese Professional cohorts</li>
          <li>Case-planning resources: rotation, margin and shrink</li>
        </ul>
        <a href="<?php echo esc_url( home_url( '/contact/' ) ); ?>" class="mt-5 rounded-full bg-pasture px-5 py-3 text-center text-sm font-bold text-white no-underline hover:bg-[#0E4530]">Join as a Retailer</a>
      </article>

      <article class="flex flex-col rounded-2xl bg-clover p-6">
        <h3 class="font-display m-0 text-2xl font-bold tracking-tight">Affiliate</h3>
        <p class="font-display m-0 mt-1 text-[40px] font-extrabold leading-none tracking-tight text-pasture">$260<span class="text-base font-semibold text-[#41503F]">/yr</span></p>
        <p class="mt-3 text-sm text-[#243027]">For suppliers, laboratories and distributors — the businesses the rest of the trade runs on.</p>
        <ul class="mt-4 flex-1 space-y-2 text-sm text-[#243027]">
          <li>For suppliers, labs and distributors</li>
          <li>First refusal on event sponsorship</li>
          <li>Listing in the organisation directory</li>
        </ul>
        <a href="<?php echo esc_url( home_url( '/contact/' ) ); ?>" class="mt-5 rounded-full bg-pasture px-5 py-3 text-center text-sm font-bold text-white no-underline hover:bg-[#0E4530]">Join as an Affiliate</a>
      </article>
    </div>
  </section>

  <section class="border-y-[1.5px] border-charcoal bg-milk">
    <div class="mx-auto grid max-w-6xl grid-cols-1 gap-10 px-5 py-12 md:px-10 nav:grid-cols-2">
      <div>
        <h2 class="font-display m-0 mb-4 text-[28px] font-extrabold tracking-tight">What every tier includes</h2>
        <ul class="space-y-3 text-[15px] text-[#3A403C]">
          <li><b class="font-display text-charcoal">The Monday brief.</b> One email a week on prices, policy and what other members are doing, with the whole archive open to you.</li>
          <li><b class="font-display text-charcoal">A vote.</b> Every membership carries one vote in the annual election, whatever it costs.</li>
          <li><b class="font-display text-charcoal">Committee access.</b> Standards, Food Safety, Education, Events, Membership and Advocacy all seat members, not just board members.</li>
          <li><b class="font-display text-charcoal">Member rates on everything.</b> Courses, workshops, the Annual Conference and the competition.</li>
          <li><b class="font-display text-charcoal">Comment standing.</b> When we file on a proposed rule, your comment goes in the packet.</li>
          <li><b class="font-display text-charcoal">The directory.</b> Find a lab, a distributor, a cave or a buyer among 641 member organisations in 41 countries.</li>
        </ul>
      </div>
      <div>
        <h2 class="font-display m-0 mb-4 text-[28px] font-extrabold tracking-tight">How dues billing works</h2>
        <dl class="space-y-4 text-[15px] text-[#3A403C]">
          <div class="rounded-2xl bg-clover p-5">
            <dt class="font-display font-bold text-charcoal">Dues are annual.</dt>
            <dd class="m-0 mt-1 text-[#243027]">One payment covers twelve months. There is no monthly plan and no joining fee.</dd>
          </div>
          <div class="rounded-2xl border-[1.5px] border-charcoal p-5">
            <dt class="font-display font-bold text-charcoal">Billed on your join date.</dt>
            <dd class="m-0 mt-1">Your year runs from the day you join, not from January. Join in August and you renew in August.</dd>
          </div>
          <div class="rounded-2xl border-[1.5px] border-charcoal p-5">
            <dt class="font-display font-bold text-charcoal">Auto-renew is optional.</dt>
            <dd class="m-0 mt-1">Turn it on and we take the dues on the anniversary. Leave it off and we send a renewal notice 30 days out and a reminder at 7. Either way you can switch it in your account.</dd>
          </div>
          <div class="rounded-2xl border-[1.5px] border-charcoal p-5">
            <dt class="font-display font-bold text-charcoal">Changing tier mid-year.</dt>
            <dd class="m-0 mt-1">Move up and we bill the difference, prorated to your renewal date. Move down at renewal. A creamery that closes can ask Membership about hardship dues.</dd>
          </div>
        </dl>
      </div>
    </div>
  </section>

  <section class="mx-auto max-w-6xl px-5 py-14 md:px-10">
    <div class="rounded-2xl bg-pasture px-6 py-10 text-center text-white md:px-12">
      <h2 class="font-display m-0 text-[clamp(28px,4vw,44px)] font-extrabold leading-[1] tracking-tight">Join the Federation</h2>
      <p class="mx-auto mt-3 max-w-[52ch] text-[17px] opacity-95">Tell us which tier fits and we will set up the membership. Applications are reviewed by Membership Operations, usually within two business days.</p>
      <a href="<?php echo esc_url( home_url( '/contact/' ) ); ?>" class="mt-6 inline-block rounded-full bg-milk px-7 py-3.5 text-sm font-bold text-pasture no-underline hover:bg-clover">Start your application</a>
      <p class="mt-4 text-xs text-clover">This is a demonstration site: the application goes to a contact page, not to a payment processor.</p>
    </div>
  </section>
</main>

<?php
get_footer();
