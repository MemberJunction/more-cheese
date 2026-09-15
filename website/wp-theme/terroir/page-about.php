<?php
/**
 * Template for the "about" page (/about/).
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
      <p class="text-xs font-bold uppercase tracking-[.14em] text-pasture">About</p>
      <h1 class="font-display font-display-tight m-0 mb-4 mt-2 max-w-[20ch] text-[clamp(38px,5.4vw,68px)] font-extrabold leading-[0.94] tracking-tight text-pasture">The International Cheese Federation.</h1>
      <p class="m-0 max-w-[58ch] text-[17px] text-[#243027]">Founded in 2014 by a handful of creameries and the buyers who sold for them, on the premise that the people who make cheese and the people who sell it should be in the same room more than once a year.</p>
      <dl class="mt-8 grid max-w-2xl grid-cols-2 gap-6 nav:grid-cols-4">
        <div><dt class="text-xs font-bold uppercase tracking-[.14em] text-pasture">Founded</dt><dd class="font-display m-0 text-[32px] font-extrabold leading-none tracking-tight">2014</dd></div>
        <div><dt class="text-xs font-bold uppercase tracking-[.14em] text-pasture">Members</dt><dd class="font-display m-0 text-[32px] font-extrabold leading-none tracking-tight">3,058</dd></div>
        <div><dt class="text-xs font-bold uppercase tracking-[.14em] text-pasture">Organizations</dt><dd class="font-display m-0 text-[32px] font-extrabold leading-none tracking-tight">641</dd></div>
        <div><dt class="text-xs font-bold uppercase tracking-[.14em] text-pasture">Countries</dt><dd class="font-display m-0 text-[32px] font-extrabold leading-none tracking-tight">41</dd></div>
      </dl>
    </div>
  </section>

  <section class="mx-auto grid max-w-6xl grid-cols-1 gap-10 px-5 py-12 md:px-10 nav:grid-cols-[1.15fr_1fr]" aria-labelledby="who-h">
    <div>
      <h2 id="who-h" class="font-display m-0 mb-4 text-[34px] font-extrabold tracking-tight">What we are</h2>
      <p class="m-0 mb-3 text-[15px] text-[#3A403C]">The Federation is a trade association for cheesemakers, affineurs, mongers and buyers. We do four things: we run a credential ladder that means something on a résumé; we run a competition judged blind and published with the score sheets; we file on the rules that decide what a member can legally make, label and ship; and we publish a weekly brief so that a maker in one country knows what happened to the price in another.</p>
      <p class="m-0 mb-3 text-[15px] text-[#3A403C]">We are member-governed. Every membership carries one vote whatever it costs, committee seats are open to members rather than reserved for the board, and the annual election is announced at the October conference. The staff are small by design; most of the work is done by members on committees.</p>
      <p class="m-0 text-[15px] text-[#3A403C]">Three thousand and fifty-eight people belong, across 641 member organizations in 41 countries — farmstead creameries with two vats, regional plants, shop counters, wholesale buyers, laboratories, distributors and a good number of individual members between jobs or on the way up the ladder.</p>
    </div>
    <div class="rounded-2xl border-[1.5px] border-charcoal p-6">
      <h2 class="font-display m-0 mb-3 text-2xl font-bold tracking-tight">The six committees</h2>
      <ul class="space-y-3 text-[15px] text-[#3A403C]">
        <li><b class="font-display text-charcoal">Standards</b> — maintains the six competition category standards and reviews them every year after judging.</li>
        <li><b class="font-display text-charcoal">Food Safety</b> — owns the HACCP curriculum and the Federation's position on testing regimes.</li>
        <li><b class="font-display text-charcoal">Education</b> — the credential ladder, the 63-course catalog and the cohorts.</li>
        <li><b class="font-display text-charcoal">Events</b> — the Annual Conference, the workshops and the year-round webinar strand.</li>
        <li><b class="font-display text-charcoal">Membership</b> — tiers, dues, hardship dues and the organization directory.</li>
        <li><b class="font-display text-charcoal">Advocacy</b> — raw-milk rules, labeling, tariffs, import lines, and the comment packets members contribute to.</li>
      </ul>
      <p class="m-0 mt-4 text-sm text-mid">Any member may ask for a committee seat; Individual membership includes one.</p>
    </div>
  </section>

  <section class="border-y-[1.5px] border-charcoal bg-milk">
    <div class="mx-auto max-w-6xl px-5 py-12 md:px-10" aria-labelledby="staff-h">
      <h2 id="staff-h" class="font-display m-0 mb-2 text-[34px] font-extrabold tracking-tight">The staff</h2>
      <p class="m-0 mb-6 max-w-[60ch] text-[15px] text-mid">Five roles carry the day-to-day work. We list them by role: this is a demonstration site, and inventing people to fill them would not help anyone.</p>
      <div class="grid grid-cols-1 gap-4 md:grid-cols-2 nav:grid-cols-3">
        <div class="rounded-2xl bg-pasture p-6 text-white">
          <h3 class="font-display m-0 text-xl font-bold tracking-tight">Executive Director</h3>
          <p class="m-0 mt-2 text-sm opacity-95">Answers to the board, carries the Federation's position into rooms members cannot all be in, and owns the budget.</p>
        </div>
        <div class="rounded-2xl border-[1.5px] border-charcoal p-6">
          <h3 class="font-display m-0 text-xl font-bold tracking-tight">Membership Operations</h3>
          <p class="m-0 mt-2 text-sm text-[#3A403C]">Applications, tiers, dues, renewals, hardship dues and the organization directory. Most member email starts here.</p>
        </div>
        <div class="rounded-2xl border-[1.5px] border-charcoal p-6">
          <h3 class="font-display m-0 text-xl font-bold tracking-tight">Communications</h3>
          <p class="m-0 mt-2 text-sm text-[#3A403C]">The Monday brief, the blog, the archive, and telling members when a tariff line or a labeling rule has moved.</p>
        </div>
        <div class="rounded-2xl bg-clover p-6">
          <h3 class="font-display m-0 text-xl font-bold tracking-tight">Education Programs</h3>
          <p class="m-0 mt-2 text-sm text-[#243027]">The four rungs, the 63 courses, the exam sittings and the Brook, Meadow, Alpine and Birch cohorts.</p>
        </div>
        <div class="rounded-2xl border-[1.5px] border-charcoal p-6">
          <h3 class="font-display m-0 text-xl font-bold tracking-tight">Events</h3>
          <p class="m-0 mt-2 text-sm text-[#3A403C]">The October conference, the workshops, the webinars, and the logistics of getting several hundred wheels judged blind.</p>
        </div>
        <div class="rounded-2xl bg-brick p-6 text-white">
          <h3 class="font-display m-0 text-xl font-bold tracking-tight">Talk to us</h3>
          <p class="m-0 mt-2 text-sm opacity-95">One address, 1 Rind Lane in Lancaster, PA, and one inbox.</p>
          <a href="<?php echo esc_url( home_url( '/contact/' ) ); ?>" class="mt-4 inline-block rounded-full bg-milk px-5 py-2.5 text-sm font-bold text-brick no-underline hover:bg-clover hover:text-charcoal">Contact the Federation</a>
        </div>
      </div>
    </div>
  </section>

  <section class="mx-auto max-w-6xl px-5 py-12 md:px-10" aria-labelledby="mission-h">
    <h2 id="mission-h" class="font-display m-0 mb-2 text-[34px] font-extrabold tracking-tight">What we are for</h2>
    <p class="m-0 mb-6 max-w-[62ch] text-[15px] text-mid">Three commitments, written into the constitution in 2014 and read out at every annual general session since, mostly so that somebody can object to them if they have stopped being true.</p>
    <div class="grid grid-cols-1 gap-4 nav:grid-cols-3">
      <article class="rounded-2xl bg-pasture p-6 text-white">
        <h3 class="font-display m-0 text-xl font-bold tracking-tight">Evidence before opinion</h3>
        <p class="m-0 mt-2 text-sm opacity-95">Quality and safety questions get settled with data, published with the method, and reopened when better data arrives. The competition is judged blind to a public standard for the same reason: a result nobody can check is not a result.</p>
      </article>
      <article class="rounded-2xl border-[1.5px] border-charcoal p-6">
        <h3 class="font-display m-0 text-xl font-bold tracking-tight">Trade that works both ways</h3>
        <p class="m-0 mt-2 text-sm text-[#3A403C]">A two-vat farmstead and a regional plant have the same vote and the same standing in a comment packet. When we file on a rule, the test is whether a member can still make, label and ship &mdash; not whether the largest members can.</p>
      </article>
      <article class="rounded-2xl bg-clover p-6">
        <h3 class="font-display m-0 text-xl font-bold tracking-tight">Knowledge that outlives a maker</h3>
        <p class="m-0 mt-2 text-sm text-[#243027]">Most of what a maker knows is undocumented, and it leaves when they do. The credential ladder, the apprenticeship strand and the endangered styles registry all exist to slow that down. It is the quiet crisis in the trade and the least dramatic thing we do.</p>
      </article>
    </div>
  </section>

  <section class="border-y-[1.5px] border-charcoal bg-milk">
    <div class="mx-auto max-w-6xl px-5 py-12 md:px-10" aria-labelledby="reach-h">
      <h2 id="reach-h" class="font-display m-0 mb-2 text-[34px] font-extrabold tracking-tight">Where the membership is</h2>
      <p class="m-0 mb-6 max-w-[62ch] text-[15px] text-mid">641 organizations in 41 countries, unevenly. Being honest about the unevenness is more useful than a map with a dot on every continent.</p>
      <div class="grid grid-cols-1 gap-4 md:grid-cols-2 nav:grid-cols-3">
        <div class="rounded-2xl border-[1.5px] border-charcoal p-5">
          <h3 class="font-display m-0 text-[19px] font-bold tracking-tight">North America</h3>
          <p class="m-0 mt-2 text-[14px] text-[#3A403C]">The largest share of the membership and where the office is. Farmstead creameries, regional plants, shop counters and the wholesale buyers who move most of it.</p>
        </div>
        <div class="rounded-2xl border-[1.5px] border-charcoal p-5">
          <h3 class="font-display m-0 text-[19px] font-bold tracking-tight">Europe</h3>
          <p class="m-0 mt-2 text-[14px] text-[#3A403C]">The deepest bench on affinage and the most engaged on labeling and geographic protection. Most of the Advanced Affinage cohort&rsquo;s cave visits happen here.</p>
        </div>
        <div class="rounded-2xl border-[1.5px] border-charcoal p-5">
          <h3 class="font-display m-0 text-[19px] font-bold tracking-tight">Latin America</h3>
          <p class="m-0 mt-2 text-[14px] text-[#3A403C]">Long fresh-cheese and pasta filata traditions, and a fast-growing specialty sector. The membership here has roughly doubled since the virtual strand started.</p>
        </div>
        <div class="rounded-2xl border-[1.5px] border-charcoal p-5">
          <h3 class="font-display m-0 text-[19px] font-bold tracking-tight">Asia-Pacific</h3>
          <p class="m-0 mt-2 text-[14px] text-[#3A403C]">The fastest-growing region and the one with the most new makes. Members here ask the hardest questions about adapting a style to a market that has no memory of it.</p>
        </div>
        <div class="rounded-2xl border-[1.5px] border-charcoal p-5">
          <h3 class="font-display m-0 text-[19px] font-bold tracking-tight">Africa</h3>
          <p class="m-0 mt-2 text-[14px] text-[#3A403C]">Established northern traditions alongside newer makes further south. The emerging-regions initiative does most of its work here, and the membership is smaller than it should be.</p>
        </div>
        <div class="rounded-2xl bg-clover p-5">
          <h3 class="font-display m-0 text-[19px] font-bold tracking-tight">Middle East</h3>
          <p class="m-0 mt-2 text-[14px] text-[#243027]">Some of the oldest continuous cheesemaking anywhere, and a standing reminder to the Standards Committee that a definition written around one continent is not a definition.</p>
        </div>
      </div>
      <p class="m-0 mt-6 text-[15px] text-[#3A403C]">Find any of them in the organization directory &mdash; how it works is on the <a href="<?php echo esc_url( home_url( '/faq/organization-directory/' ) ); ?>" class="text-brick underline underline-offset-2">directory FAQ</a>.</p>
    </div>
  </section>

  <section id="fiction" class="mx-auto max-w-6xl scroll-mt-6 px-5 py-12 md:px-10" aria-labelledby="fiction-h">
    <div class="rounded-2xl border-[1.5px] border-brick bg-milk p-6 md:p-8">
      <p class="m-0 mb-1 text-[11px] font-bold uppercase tracking-[.14em] text-brick">Fictional demonstration</p>
      <h2 id="fiction-h" class="font-display m-0 mb-3 text-2xl font-bold tracking-tight text-brick">A note on the fiction</h2>
      <p class="m-0 text-[15px] text-[#3A403C]">Everything on this site is invented. There is no International Cheese Federation, no More Cheese, no competition, no credential ladder and no member at 1 Rind Lane. The site exists to show what an association's public web presence looks like when it is built on MemberJunction: membership tiers and dues, an education catalog, an events board, an advocacy program and a publication, all of which map onto real records behind the scenes. The names, the numbers, the quotations and the history are there to make the demonstration legible, not to describe anything that exists.</p>
    </div>
  </section>
</main>

<?php
get_footer();
