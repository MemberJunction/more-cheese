<?php
/**
 * Template for the "contact" page (/contact/).
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
      <p class="text-xs font-bold uppercase tracking-[.14em] text-brick">Contact</p>
      <h1 class="font-display font-display-tight m-0 mb-4 mt-2 text-[clamp(38px,5.4vw,68px)] font-extrabold leading-[0.94] tracking-tight text-pasture">Talk to the Federation.</h1>
      <p class="m-0 max-w-[58ch] text-[17px] text-[#3A403C]">One address, one inbox, five people. Membership questions are answered by Membership Operations, usually within two business days.</p>
    </div>
  </section>

  <section class="mx-auto grid max-w-6xl grid-cols-1 gap-10 px-5 py-12 md:px-10 nav:grid-cols-[1fr_1.1fr]">

    <div>
      <h2 class="font-display m-0 mb-4 text-[28px] font-extrabold tracking-tight">Where we are</h2>
      <address class="not-italic text-[15px] leading-relaxed text-[#3A403C]">
        <b class="font-display text-charcoal">International Cheese Federation</b><br>
        1 Rind Lane<br>
        Lancaster, PA<br>
        <a href="mailto:info@morecheese.org" class="text-brick underline underline-offset-2">info@morecheese.org</a>
      </address>

      <h3 class="font-display mb-3 mt-8 text-xl font-bold tracking-tight">Who handles what</h3>
      <ul class="space-y-2 text-[15px] text-[#3A403C]">
        <li><b class="font-display text-charcoal">Membership Operations</b> — joining, tiers, dues, renewals, hardship dues, the directory. <a href="mailto:memberservices@morecheese.org" class="text-brick underline underline-offset-2">memberservices@morecheese.org</a></li>
        <li><b class="font-display text-charcoal">Education Programmes</b> — the credential ladder, exam sittings, cohorts, the course catalogue. <a href="mailto:education@morecheese.org" class="text-brick underline underline-offset-2">education@morecheese.org</a></li>
        <li><b class="font-display text-charcoal">Events</b> — the Annual Conference, workshops, webinars, competition entries. <a href="mailto:events@morecheese.org" class="text-brick underline underline-offset-2">events@morecheese.org</a></li>
        <li><b class="font-display text-charcoal">Communications</b> — the Monday brief, the blog, press. <a href="mailto:info@morecheese.org" class="text-brick underline underline-offset-2">info@morecheese.org</a></li>
        <li><b class="font-display text-charcoal">Advocacy Committee</b> — comments on proposed rules; see the <a href="<?php echo esc_url( home_url( '/advocacy/' ) ); ?>" class="text-brick underline underline-offset-2">advocacy page</a>.</li>
      </ul>

      <div class="mt-8 rounded-2xl bg-clover p-6">
        <h3 class="font-display m-0 text-xl font-bold tracking-tight">Joining?</h3>
        <p class="m-0 mt-2 text-[15px] text-[#243027]">Tell us the tier in the message and we will set the membership up. The rate card is on the Join page.</p>
        <a href="<?php echo esc_url( home_url( '/join/' ) ); ?>" class="mt-4 inline-block rounded-full bg-pasture px-5 py-2.5 text-sm font-bold text-white no-underline hover:bg-[#0E4530]">See membership tiers</a>
      </div>
    </div>

    <div>
      <h2 class="font-display m-0 mb-2 text-[28px] font-extrabold tracking-tight">Send an enquiry</h2>
      <p class="m-0 mb-5 rounded-2xl border-[1.5px] border-brick px-4 py-3 text-[15px] text-brick">
        <b>This demonstration site does not send messages.</b> The form below is static: nothing is submitted, stored or emailed anywhere.
      </p>

      <form data-inert class="space-y-4" aria-describedby="form-note">
        <div>
          <label for="f-name" class="font-display mb-1 block text-sm font-bold">Your name</label>
          <input id="f-name" name="name" type="text" autocomplete="name" class="w-full rounded-xl border-[1.5px] border-charcoal bg-milk px-4 py-3 text-[15px]" placeholder="First and last name">
        </div>
        <div>
          <label for="f-email" class="font-display mb-1 block text-sm font-bold">Email</label>
          <input id="f-email" name="email" type="email" autocomplete="email" class="w-full rounded-xl border-[1.5px] border-charcoal bg-milk px-4 py-3 text-[15px]" placeholder="you@example.com">
        </div>
        <div>
          <label for="f-org" class="font-display mb-1 block text-sm font-bold">Organisation <span class="font-normal text-mid">(optional)</span></label>
          <input id="f-org" name="organisation" type="text" autocomplete="organization" class="w-full rounded-xl border-[1.5px] border-charcoal bg-milk px-4 py-3 text-[15px]" placeholder="Creamery, shop, lab or distributor">
        </div>
        <div>
          <label for="f-topic" class="font-display mb-1 block text-sm font-bold">What is this about?</label>
          <select id="f-topic" name="topic" class="w-full rounded-xl border-[1.5px] border-charcoal bg-milk px-4 py-3 text-[15px]">
            <option>Joining the Federation</option>
            <option>Dues, renewals or my account</option>
            <option>Certifications and courses</option>
            <option>Events and the Annual Conference</option>
            <option>Competition entries</option>
            <option>Advocacy and comment periods</option>
            <option>Press and publications</option>
            <option>Something else</option>
          </select>
        </div>
        <div>
          <label for="f-message" class="font-display mb-1 block text-sm font-bold">Message</label>
          <textarea id="f-message" name="message" rows="6" class="w-full rounded-xl border-[1.5px] border-charcoal bg-milk px-4 py-3 text-[15px]" placeholder="Tell us which tier fits, or what you are trying to work out."></textarea>
        </div>
        <p id="form-note" class="m-0 text-sm text-mid">No data leaves this page. In the live product this form writes straight to the association's membership records.</p>
        <button type="submit" class="rounded-full bg-pasture px-7 py-3.5 text-sm font-bold text-white hover:bg-[#0E4530]">Send enquiry</button>
        <p class="m-0 text-sm text-mid">Prefer email? Write to <a href="mailto:memberservices@morecheese.org" class="text-brick underline underline-offset-2">memberservices@morecheese.org</a> and it reaches the same people.</p>
      </form>

      <!-- Betty assistant widget mounts here. Left empty and clearly labelled on purpose. -->
      <div class="mt-10">
        <h2 class="font-display m-0 mb-2 text-[28px] font-extrabold tracking-tight">Ask Betty</h2>
        <p class="m-0 mb-4 text-[15px] text-[#3A403C]">Betty is the Federation's assistant: dues, cohort dates, which rung to start on, what closed last week. The widget is embedded below.</p>
        <div id="betty-widget" class="flex min-h-[220px] items-center justify-center rounded-2xl border-2 border-dashed border-pasture bg-clover/40 p-6 text-center" role="region" aria-label="Betty assistant widget placeholder">
          <div>
            <p class="font-display m-0 text-lg font-bold tracking-tight text-pasture">Betty assistant widget</p>
            <p class="m-0 mt-1 text-sm text-[#3A403C]">Placeholder. The embed script mounts into <code class="rounded bg-milk px-1.5 py-0.5 text-[13px]">#betty-widget</code>; nothing is loaded on this static page.</p>
          </div>
        </div>
      </div>
    </div>
  </section>
  <section class="border-t-[1.5px] border-charcoal bg-milk">
    <div class="mx-auto max-w-6xl px-5 py-12 md:px-10" aria-labelledby="faster-h">
      <h2 id="faster-h" class="font-display m-0 mb-2 text-[34px] font-extrabold tracking-tight">Faster than an email</h2>
      <p class="m-0 mb-6 max-w-[62ch] text-[15px] text-mid">Four of every five enquiries we get are already answered somewhere on this site, and reading it takes less time than waiting two business days for us to send you the link.</p>
      <div class="grid grid-cols-1 gap-3 md:grid-cols-2 nav:grid-cols-4">
        <a href="<?php echo esc_url( home_url( '/faq/' ) ); ?>" class="flex flex-col rounded-2xl border-[1.5px] border-charcoal bg-milk p-5 no-underline transition hover:bg-clover">
          <h3 class="font-display m-0 text-[19px] font-bold leading-tight tracking-tight text-charcoal">The FAQ</h3>
          <p class="m-0 mt-2 flex-1 text-[14px] text-[#3A403C]">Eight topics with a filter box on each: dues, benefits, renewals, certifications, events, publications, careers and the directory.</p>
          <span class="mt-3 text-[13px] font-bold text-pasture">Browse topics &rarr;</span>
        </a>
        <a href="<?php echo esc_url( home_url( '/join/' ) ); ?>" class="flex flex-col rounded-2xl border-[1.5px] border-charcoal bg-milk p-5 no-underline transition hover:bg-clover">
          <h3 class="font-display m-0 text-[19px] font-bold leading-tight tracking-tight text-charcoal">The rate card</h3>
          <p class="m-0 mt-2 flex-1 text-[14px] text-[#3A403C]">Four tiers, what each covers, and how dues billing works. The single most common thing people write in to ask.</p>
          <span class="mt-3 text-[13px] font-bold text-pasture">Compare tiers &rarr;</span>
        </a>
        <a href="<?php echo esc_url( home_url( '/library/' ) ); ?>" class="flex flex-col rounded-2xl border-[1.5px] border-charcoal bg-milk p-5 no-underline transition hover:bg-clover">
          <h3 class="font-display m-0 text-[19px] font-bold leading-tight tracking-tight text-charcoal">The Cheese Library</h3>
          <p class="m-0 mt-2 flex-1 text-[14px] text-[#3A403C]">Eight families and 25 reference styles with milk, ageing, texture and what to look for. Open reference, no login.</p>
          <span class="mt-3 text-[13px] font-bold text-pasture">Browse styles &rarr;</span>
        </a>
        <a href="<?php echo esc_url( home_url( '/careers/' ) ); ?>" class="flex flex-col rounded-2xl border-[1.5px] border-charcoal bg-milk p-5 no-underline transition hover:bg-clover">
          <h3 class="font-display m-0 text-[19px] font-bold leading-tight tracking-tight text-charcoal">Careers &amp; volunteering</h3>
          <p class="m-0 mt-2 flex-1 text-[14px] text-[#3A403C]">Member vacancies, routes into the trade, the apprenticeship strand and every volunteer role the Federation runs on.</p>
          <span class="mt-3 text-[13px] font-bold text-pasture">See the roles &rarr;</span>
        </a>
      </div>
    </div>
  </section>
</main>

<?php
get_footer();
