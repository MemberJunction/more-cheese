<?php
/**
 * Template for the "learn" page (/learn/).
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
    <div class="mx-auto grid max-w-6xl grid-cols-1 items-center gap-10 px-5 py-12 md:px-10 md:py-14 nav:grid-cols-[1.15fr_1fr]">
      <div>
        <p class="text-xs font-bold uppercase tracking-[.14em] text-brick">Education</p>
        <h1 class="font-display font-display-tight m-0 mb-4 mt-2 max-w-[16ch] text-[clamp(38px,5.4vw,68px)] font-extrabold leading-[0.94] tracking-tight text-pasture">A ladder, not a shelf of courses.</h1>
        <p class="m-0 max-w-[54ch] text-[17px] text-[#3A403C]">Four rungs, in order. Each one assumes the one below it and each one means something specific on a résumé. Around them sit <b>63 courses this year</b> — single sessions, two-day workshops and cohort programs — that fill in the gaps between the rungs.</p>
        <p class="m-0 mt-4 max-w-[54ch] text-[15px] text-mid">Cohorts are named for cheeses, not numbers: <b class="text-charcoal">Brook</b>, <b class="text-charcoal">Meadow</b>, <b class="text-charcoal">Alpine</b> and <b class="text-charcoal">Birch</b> run through the year, and people tend to stay in touch with the cohort they came up with.</p>
      </div>
      <!-- Section graphic: the cheese wheel drawn for the Cave concept, retinted for the light ground -->
      <div class="relative mx-auto aspect-square w-full max-w-[380px]">
        <svg viewBox="0 0 400 400" class="block h-full w-full" role="img" aria-label="A cheese wheel drawn in outline with one wedge cut away, marked 'aged 14 months'">
          <defs>
            <radialGradient id="rind" cx="50%" cy="45%" r="60%">
              <stop offset="0" stop-color="#F1E3C4"/>
              <stop offset=".7" stop-color="#E7CFA0"/>
              <stop offset="1" stop-color="#C98F45"/>
            </radialGradient>
          </defs>
          <ellipse cx="200" cy="215" rx="170" ry="60" fill="#242424" opacity=".10"/>
          <path d="M200 200 L200 40 A160 160 0 1 1 61 120 Z" fill="url(#rind)" stroke="#A23C2C" stroke-width="3"/>
          <path d="M200 200 L61 120 A160 160 0 0 1 200 40 Z" fill="#145C3D" stroke="#A23C2C" stroke-width="3" stroke-dasharray="6 6"/>
          <path d="M200 200 L61 120" stroke="#FCFBF7" stroke-width="2"/>
          <path d="M200 200 L200 40" stroke="#FCFBF7" stroke-width="2"/>
          <circle cx="140" cy="230" r="9" fill="#C98F45"/>
          <circle cx="250" cy="260" r="6" fill="#C98F45"/>
          <circle cx="215" cy="140" r="5" fill="#C98F45"/>
          <circle cx="300" cy="200" r="8" fill="#C98F45"/>
          <text x="118" y="112" font-family="Public Sans, system-ui, sans-serif" font-size="12" font-weight="700" fill="#FCFBF7" letter-spacing="1.5">AGED 14 MO</text>
        </svg>
        <p class="m-0 mt-2 text-center text-[11px] font-semibold uppercase tracking-[.14em] text-mid">Soft-ripened · Alpine · Cheddar &amp; territorials · Blue · Washed-rind · Fresh</p>
      </div>
    </div>
  </section>

  <section class="mx-auto max-w-6xl px-5 py-12 md:px-10" aria-labelledby="ladder-h">
    <h2 id="ladder-h" class="font-display m-0 mb-6 text-[34px] font-extrabold tracking-tight">The credential ladder</h2>
    <ol class="space-y-4">

      <li class="rounded-2xl bg-clover p-6 md:p-8">
        <div class="flex flex-wrap items-baseline gap-x-4 gap-y-1">
          <span class="font-display text-[13px] font-bold uppercase tracking-[.14em] text-pasture">Rung one · entry · 6 weeks</span>
        </div>
        <h3 class="font-display m-0 mt-2 text-[28px] font-bold leading-tight tracking-tight">Cheese Foundations Certificate</h3>
        <p class="m-0 mt-3 max-w-[70ch] text-[15px] text-[#243027]">The entry credential, and the one we recommend to anyone who has been in the trade under two years. Six weeks covering milk composition — fat, protein, somatic cell counts and why the season changes all three — the cheese families and what separates them, sanitation as a daily practice rather than a document, and the vocabulary of affinage, so that when an affineur says the rind is slipping you know what has gone wrong and roughly when. It is deliberately broad. People finish it able to hold a conversation with a maker, a monger and an inspector.</p>
      </li>

      <li class="rounded-2xl bg-pasture p-6 text-white md:p-8">
        <span class="font-display text-[13px] font-bold uppercase tracking-[.14em] text-clover">Rung two · exam</span>
        <h3 class="font-display m-0 mt-2 text-[28px] font-bold leading-tight tracking-tight">Certified Cheese Professional</h3>
        <p class="m-0 mt-3 max-w-[70ch] text-[15px] opacity-95">The credential most members mean when they say "certified". It is an examination, not a course: you sit it when you are ready, and most candidates prepare for six to nine months. It tests retail and wholesale practice — ordering, rotation, margin, shrink, how to cut a wheel so the last sale is as good as the first — alongside sensory evaluation, where you are asked to taste blind and describe what you find in language another professional would recognize. Retailer-tier members get priority in the preparation cohorts.</p>
      </li>

      <li class="rounded-2xl border-[1.5px] border-charcoal bg-milk p-6 md:p-8">
        <span class="font-display text-[13px] font-bold uppercase tracking-[.14em] text-brick">Rung three · 8 weeks</span>
        <h3 class="font-display m-0 mt-2 text-[28px] font-bold leading-tight tracking-tight">Food Safety &amp; HACCP Certificate</h3>
        <p class="m-0 mt-3 max-w-[70ch] text-[15px] text-[#3A403C]">Eight weeks on hazards and the control points that catch them: where in your process a biological, chemical or physical hazard can enter, which steps are genuinely critical, what limits you set and what you do when a limit is missed. The final third of the course is the part people remember — defending the plan to an inspector. You present your own plan, someone plays the inspector, and you learn the difference between a plan that is correct and a plan you can explain under questioning.</p>
      </li>

      <li class="rounded-2xl bg-brick p-6 text-white md:p-8">
        <span class="font-display text-[13px] font-bold uppercase tracking-[.14em] text-clover">Rung four · cohort</span>
        <h3 class="font-display m-0 mt-2 text-[28px] font-bold leading-tight tracking-tight">Advanced Affinage</h3>
        <p class="m-0 mt-3 max-w-[70ch] text-[15px] opacity-95">The top rung, and the only one that runs strictly as a cohort, because it depends on people comparing caves. Cave management: airflow, shelving, turning schedules and what a cave can and cannot recover from. Humidity, held and lost, and the instruments that tell you the truth about it. Rind development across washed, bloomy and natural rinds, including the failures — the slip, the crack, the mite. Members bring their own wheels and their own problems; Henri Dubois, a Jura affineur, comes for one week a year and takes the cohort through his own caves.</p>
      </li>
    </ol>
  </section>

  <section class="border-y-[1.5px] border-charcoal bg-milk">
    <div class="mx-auto grid max-w-6xl grid-cols-1 gap-8 px-5 py-12 md:px-10 nav:grid-cols-3">
      <div>
        <h2 class="font-display m-0 mb-2 text-2xl font-bold tracking-tight">63 courses this year</h2>
        <p class="m-0 text-[15px] text-[#3A403C]">Between the rungs sit single sessions and workshops: pasta filata, wholesale negotiation, judging standards, apprenticeship, cave humidity in a hot summer. Members pay member rates; the catalog is published each January.</p>
      </div>
      <div>
        <h2 class="font-display m-0 mb-2 text-2xl font-bold tracking-tight">Cohorts named for cheeses</h2>
        <p class="m-0 text-[15px] text-[#3A403C]">Brook, Meadow, Alpine and Birch. A cohort is 18 to 24 people who start and finish together. Ask a member which cohort they were in and you will usually get a story rather than a date.</p>
      </div>
      <div>
        <h2 class="font-display m-0 mb-2 text-2xl font-bold tracking-tight">What it costs</h2>
        <p class="m-0 text-[15px] text-[#3A403C]">Every membership tier carries a discount on credential exams, from day one. <a href="<?php echo esc_url( home_url( '/join/' ) ); ?>" class="text-brick underline underline-offset-2">Compare the tiers</a> or <a href="<?php echo esc_url( home_url( '/contact/' ) ); ?>" class="text-brick underline underline-offset-2">ask Education Programs</a> which rung to start on.</p>
      </div>
    </div>
  </section>
  <section class="mx-auto max-w-6xl px-5 py-12 md:px-10" aria-labelledby="prog-h">
    <h2 id="prog-h" class="font-display m-0 mb-2 text-[34px] font-extrabold tracking-tight">Around the ladder: four program areas</h2>
    <p class="m-0 mb-6 max-w-[62ch] text-[15px] text-mid">The ladder is the part members see. It sits inside four programs that the committees run, and each one feeds the teaching: a standard has to be written before it can be taught, and a course is the fastest way to find out that a standard was written badly.</p>
    <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
      <article class="rounded-2xl border-[1.5px] border-charcoal bg-milk p-6">
        <p class="m-0 text-[11px] font-bold uppercase tracking-[.14em] text-brick">Standards</p>
        <h3 class="font-display m-0 mt-1 text-[22px] font-bold leading-tight tracking-tight">Classification and quality parameters</h3>
        <p class="m-0 mt-3 text-[15px] text-[#3A403C]">The family definitions, the analytical methods behind them, and the six competition category standards reviewed in public every year after judging. If you want to see the output rather than read about it, the <a href="<?php echo esc_url( home_url( '/library/' ) ); ?>" class="text-brick underline underline-offset-2">Cheese Library</a> and the <a href="<?php echo esc_url( home_url( '/compete/' ) ); ?>" class="text-brick underline underline-offset-2">category standards</a> are both open.</p>
      </article>
      <article class="rounded-2xl border-[1.5px] border-charcoal bg-milk p-6">
        <p class="m-0 text-[11px] font-bold uppercase tracking-[.14em] text-brick">Research</p>
        <h3 class="font-display m-0 mt-1 text-[22px] font-bold leading-tight tracking-tight">Work commissioned to settle arguments</h3>
        <p class="m-0 mt-3 text-[15px] text-[#3A403C]">Microbiology, flavor development, production efficiency and the four standing reports. Committees commission work when a question keeps coming back without an answer; the results end up in the curriculum within a year or two. <a href="<?php echo esc_url( home_url( '/research/' ) ); ?>" class="text-brick underline underline-offset-2">See what is published.</a></p>
      </article>
      <article class="rounded-2xl bg-clover p-6">
        <p class="m-0 text-[11px] font-bold uppercase tracking-[.14em] text-pasture">Capacity</p>
        <h3 class="font-display m-0 mt-1 text-[22px] font-bold leading-tight tracking-tight">Getting knowledge to where it is not</h3>
        <p class="m-0 mt-3 text-[15px] text-[#243027]">Workshops in regions with few members, expert exchanges, mentorship, and the apprenticeship strand and fund that help a creamery train its next maker. What a maker knows is mostly undocumented and it leaves when they do; this is the program aimed squarely at that. <a href="<?php echo esc_url( home_url( '/careers/' ) ); ?>" class="text-pasture underline underline-offset-2">Routes in and mentoring.</a></p>
      </article>
      <article class="rounded-2xl bg-pasture p-6 text-white">
        <p class="m-0 text-[11px] font-bold uppercase tracking-[.14em] text-clover">Advocacy</p>
        <h3 class="font-display m-0 mt-1 text-[22px] font-bold leading-tight tracking-tight">The rules that decide what you may make</h3>
        <p class="m-0 mt-3 text-[15px] opacity-95">Raw-milk rules, labeling, tariffs, import lines and geographic protections. The Food Safety &amp; HACCP rung exists because members kept meeting these in an inspection rather than in a document. <a href="<?php echo esc_url( home_url( '/advocacy/' ) ); ?>" class="text-clover underline underline-offset-2">See the advocacy program.</a></p>
      </article>
    </div>
  </section>

  <section class="border-y-[1.5px] border-charcoal bg-milk">
    <div class="mx-auto max-w-6xl px-5 py-12 md:px-10" aria-labelledby="init-h">
      <h2 id="init-h" class="font-display m-0 mb-2 text-[34px] font-extrabold tracking-tight">Current initiatives</h2>
      <p class="m-0 mb-6 max-w-[62ch] text-[15px] text-mid">Standing projects with a committee behind each one. Members can join any of them; three of the six started as a single member&rsquo;s complaint at a meetup.</p>
      <div class="grid grid-cols-1 gap-4 md:grid-cols-2 nav:grid-cols-3">
        <article class="rounded-2xl border-[1.5px] border-charcoal p-5">
          <h3 class="font-display m-0 text-[19px] font-bold tracking-tight">Alpine heritage</h3>
          <p class="m-0 mt-2 text-[14px] text-[#3A403C]">Documenting high-altitude practice before the people who hold it retire. Summer transhumance makes, cooked-curd technique, and the cellar arithmetic of a wheel meant to last a winter.</p>
        </article>
        <article class="rounded-2xl border-[1.5px] border-charcoal p-5">
          <h3 class="font-display m-0 text-[19px] font-bold tracking-tight">Endangered styles registry</h3>
          <p class="m-0 mt-2 text-[14px] text-[#3A403C]">A running list of styles down to a handful of makers, with what is needed to keep each one alive. Feeds straight into the <a href="<?php echo esc_url( home_url( '/library/' ) ); ?>" class="text-brick underline underline-offset-2">Cheese Library</a> as entries are verified.</p>
        </article>
        <article class="rounded-2xl border-[1.5px] border-charcoal p-5">
          <h3 class="font-display m-0 text-[19px] font-bold tracking-tight">Apprenticeship fund</h3>
          <p class="m-0 mt-2 text-[14px] text-[#3A403C]">Helps a member creamery carry an apprentice through a first season, on the grounds that the barrier is rarely willingness and almost always cash flow in month four.</p>
        </article>
        <article class="rounded-2xl border-[1.5px] border-charcoal p-5">
          <h3 class="font-display m-0 text-[19px] font-bold tracking-tight">Raw-milk practice</h3>
          <p class="m-0 mt-2 text-[14px] text-[#3A403C]">Evidence on what makes a raw-milk make safe, assembled so that members and regulators are arguing about the same data. The single largest source of member questions.</p>
        </article>
        <article class="rounded-2xl border-[1.5px] border-charcoal p-5">
          <h3 class="font-display m-0 text-[19px] font-bold tracking-tight">Climate resilience</h3>
          <p class="m-0 mt-2 text-[14px] text-[#3A403C]">Hotter summers change the cave before they change the herd. Ripening schedules, cave engineering and seasonal make plans, gathered from members already adapting rather than modeled.</p>
        </article>
        <article class="rounded-2xl bg-clover p-5">
          <h3 class="font-display m-0 text-[19px] font-bold tracking-tight">Emerging regions</h3>
          <p class="m-0 mt-2 text-[14px] text-[#243027]">Technical help and training where a cheese trade is being built rather than inherited. Runs on the virtual strand, which is the only reason it works at all.</p>
        </article>
      </div>
      <p class="m-0 mt-6 text-[15px] text-[#3A403C]">To join one, ask for the committee that owns it through <a href="<?php echo esc_url( home_url( '/contact/' ) ); ?>" class="text-brick underline underline-offset-2">the contact page</a>. Certification questions are answered on the <a href="<?php echo esc_url( home_url( '/faq/certifications/' ) ); ?>" class="text-brick underline underline-offset-2">certifications FAQ</a>.</p>
    </div>
  </section>
</main>

<?php
get_footer();
