<?php
/**
 * Template for the "events" page (/events/).
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
      <p class="text-xs font-bold uppercase tracking-[.14em] text-brick">Events</p>
      <h1 class="font-display font-display-tight m-0 mb-4 mt-2 max-w-[18ch] text-[clamp(38px,5.4vw,68px)] font-extrabold leading-[0.94] tracking-tight text-pasture">The notice board.</h1>
      <p class="m-0 max-w-[58ch] text-[17px] text-[#3A403C]">Everything with a date on it: webinars, workshops, deadlines and comment periods. Times are Eastern. Members book at member rates; a few sessions are open to anyone.</p>
    </div>
  </section>

  <section class="mx-auto max-w-6xl px-5 py-12 md:px-10" aria-labelledby="dates-h">
    <h2 id="dates-h" class="font-display m-0 mb-5 text-[34px] font-extrabold tracking-tight">Upcoming dates</h2>
    <div class="table-wrap rounded-2xl border-[1.5px] border-charcoal">
      <table class="w-full border-collapse text-left text-[15px]">
        <caption class="sr-only">Upcoming International Cheese Federation dates and their registration status</caption>
        <thead>
          <tr class="bg-clover">
            <th scope="col" class="whitespace-nowrap px-4 py-3 font-display text-[13px] font-bold uppercase tracking-[.12em] text-pasture">Date</th>
            <th scope="col" class="px-4 py-3 font-display text-[13px] font-bold uppercase tracking-[.12em] text-pasture">What</th>
            <th scope="col" class="px-4 py-3 font-display text-[13px] font-bold uppercase tracking-[.12em] text-pasture">Type</th>
            <th scope="col" class="whitespace-nowrap px-4 py-3 font-display text-[13px] font-bold uppercase tracking-[.12em] text-pasture">Status</th>
          </tr>
        </thead>
        <tbody>
          <tr class="border-t border-charcoal/20">
            <th scope="row" class="whitespace-nowrap px-4 py-4 text-left font-display font-bold">15 Sep</th>
            <td class="px-4 py-4"><b>Wholesale Negotiation webinar</b><br><span class="text-mid">Terms, pallet pricing and what a buyer can actually move on. Marcus Chen of Mongers' Row takes questions from the buyer's side of the table.</span></td>
            <td class="px-4 py-4 text-mid">Webinar</td>
            <td class="px-4 py-4"><span class="rounded-full bg-pasture px-3 py-1 text-xs font-bold text-white">Open</span></td>
          </tr>
          <tr class="border-t border-charcoal/20">
            <th scope="row" class="whitespace-nowrap px-4 py-4 text-left font-display font-bold">17 Sep</th>
            <td class="px-4 py-4"><b>Judging Standards: the six categories</b><br><span class="text-mid">How each category is scored, what counts as a fault, and how panels reconcile when they disagree. Useful before you enter in January.</span></td>
            <td class="px-4 py-4 text-mid">Session</td>
            <td class="px-4 py-4"><span class="rounded-full bg-pasture px-3 py-1 text-xs font-bold text-white">Open</span></td>
          </tr>
          <tr class="border-t border-charcoal/20">
            <th scope="row" class="whitespace-nowrap px-4 py-4 text-left font-display font-bold">19 Sep</th>
            <td class="px-4 py-4"><b>Clover pasta-filata workshop — registration closes</b><br><span class="text-mid">Two days on stretch, salt and the mozzarella nobody gets right the first time. Hands in curd, not slides.</span></td>
            <td class="px-4 py-4 text-mid">Workshop</td>
            <td class="px-4 py-4"><span class="rounded-full bg-brick px-3 py-1 text-xs font-bold text-white">3 seats</span></td>
          </tr>
          <tr class="border-t border-charcoal/20">
            <th scope="row" class="whitespace-nowrap px-4 py-4 text-left font-display font-bold">30 Sep</th>
            <td class="px-4 py-4"><b>Annual Conference — early-bird ends</b><br><span class="text-mid">Rates rise at midnight. Creamery and Retailer memberships can register staff under the one membership.</span></td>
            <td class="px-4 py-4 text-mid">Deadline</td>
            <td class="px-4 py-4"><span class="rounded-full border-[1.5px] border-charcoal px-3 py-1 text-xs font-bold">Early-bird</span></td>
          </tr>
          <tr class="border-t border-charcoal/20">
            <th scope="row" class="whitespace-nowrap px-4 py-4 text-left font-display font-bold">3 Oct</th>
            <td class="px-4 py-4"><b>Raw-milk labelling proposal — comment period closes</b><br><span class="text-mid">Send us your comment and it goes into the Federation's packet. The Advocacy Committee files on behalf of members who ask.</span></td>
            <td class="px-4 py-4 text-mid">Advocacy</td>
            <td class="px-4 py-4"><a href="<?php echo esc_url( home_url( '/advocacy/' ) ); ?>" class="rounded-full bg-clover px-3 py-1 text-xs font-bold text-pasture no-underline hover:bg-pasture hover:text-white">Comment</a></td>
          </tr>
        </tbody>
      </table>
    </div>
    <p class="mt-4 text-sm text-mid">Registration on this demonstration site is not live. <a href="<?php echo esc_url( home_url( '/contact/' ) ); ?>" class="text-brick underline underline-offset-2">Contact the Events team</a> for anything on this board.</p>
  </section>

  <section class="border-y-[1.5px] border-charcoal bg-milk">
    <div class="mx-auto grid max-w-6xl grid-cols-1 gap-10 px-5 py-12 md:px-10 nav:grid-cols-2">
      <div>
        <h2 class="font-display m-0 mb-4 text-[28px] font-extrabold tracking-tight">The Annual Conference</h2>
        <p class="m-0 mb-3 text-[15px] text-[#3A403C]">The Federation meets once a year, in October, and it is the only week when the whole membership is in one building. Three days: competition results announced with the score sheets on the tables, the six category standards reviewed in public, a floor of member organisations, and the sessions that are too hands-on to run over video — cave problems, case planning, the milk market year ahead.</p>
        <p class="m-0 mb-3 text-[15px] text-[#3A403C]">It is also where the governance happens. The annual election is announced, committee chairs report, and the membership votes on anything the board has put forward. Early-bird registration closes 30 September; Creamery and Retailer memberships can register their covered staff under the one membership.</p>
        <p class="m-0 text-[15px] text-[#3A403C]">Attendance has grown every year except 2020, and the room in October 2025 was noticeably more mixed than it used to be: more buyers, more affiliates, more people who came for a credential and stayed for the trade.</p>
      </div>
      <div>
        <div class="rounded-2xl bg-clover p-6">
          <h2 class="font-display m-0 mb-3 text-2xl font-bold tracking-tight">The virtual symposium</h2>
          <p class="m-0 mb-3 text-[15px] text-[#243027]">In 2021, with travel still unreliable, the Federation ran its first fully virtual symposium in place of the spring meeting. It was meant as a stopgap. It was not treated as one: 1,100 people attended, a third of them from countries that had never sent anyone to a conference, and the sessions were recorded and left open in the archive.</p>
          <p class="m-0 mb-3 text-[15px] text-[#243027]">The lesson stuck. The virtual format survived the year it was invented for, and today the webinar and session strand — Wholesale Negotiation, Judging Standards, apprenticeship — runs year-round alongside the in-person calendar. A member in Jura and a member in Wisconsin are in the same room for an hour, which is a thing the Federation could not do before 2021.</p>
          <p class="m-0 text-[15px] text-[#243027]">Recordings stay in the members' archive indefinitely.</p>
        </div>
      </div>
    </div>
  </section>
  <section class="mx-auto max-w-6xl px-5 py-12 md:px-10" aria-labelledby="regional-h">
    <h2 id="regional-h" class="font-display m-0 mb-2 text-[34px] font-extrabold tracking-tight">Regional meetups</h2>
    <p class="m-0 mb-6 max-w-[62ch] text-[15px] text-mid">Organised by members, for members, in whatever room somebody could get. Most are free or close to it, all of them are open to any member regardless of where you are based, and a member who is travelling is usually the most interesting person there.</p>
    <div class="grid grid-cols-1 gap-4 md:grid-cols-2 nav:grid-cols-3">
      <article class="rounded-2xl border-[1.5px] border-charcoal bg-milk p-5">
        <h3 class="font-display m-0 text-[19px] font-bold tracking-tight">Creamery tours</h3>
        <p class="m-0 mt-2 text-[14px] text-[#3A403C]">A member opens their make for an afternoon and answers the questions they would rather not answer in public. The most requested format and the hardest to schedule, because the host has to stop working.</p>
      </article>
      <article class="rounded-2xl border-[1.5px] border-charcoal bg-milk p-5">
        <h3 class="font-display m-0 text-[19px] font-bold tracking-tight">Tasting roundtables</h3>
        <p class="m-0 mt-2 text-[14px] text-[#3A403C]">Six to a dozen people, everyone brings a wheel, everyone says what they actually think. New members are told to come to one of these before anything else; it is where the vocabulary stops being theoretical.</p>
      </article>
      <article class="rounded-2xl border-[1.5px] border-charcoal bg-milk p-5">
        <h3 class="font-display m-0 text-[19px] font-bold tracking-tight">Problem clinics</h3>
        <p class="m-0 mt-2 text-[14px] text-[#3A403C]">One season, one problem &mdash; a cave running hot, a rind that keeps slipping, a buyer who has changed the terms. People bring the failure rather than the success, which is why these fill fastest.</p>
      </article>
      <article class="rounded-2xl bg-clover p-5">
        <h3 class="font-display m-0 text-[19px] font-bold tracking-tight">Regulatory briefings</h3>
        <p class="m-0 mt-2 text-[14px] text-[#243027]">When a rule moves in a region, the Advocacy Committee sends someone to explain what it means in practice before the comment period closes. <a href="<?php echo esc_url( home_url( '/advocacy/' ) ); ?>" class="text-pasture underline underline-offset-2">See the advocacy programme.</a></p>
      </article>
      <article class="rounded-2xl border-[1.5px] border-charcoal bg-milk p-5">
        <h3 class="font-display m-0 text-[19px] font-bold tracking-tight">New-member socials</h3>
        <p class="m-0 mt-2 text-[14px] text-[#3A403C]">No agenda and no talk. Members who joined in the last year, plus two or three who have been around long enough to be useful. Free, everywhere, always.</p>
      </article>
      <article class="rounded-2xl bg-brick p-5 text-white">
        <h3 class="font-display m-0 text-[19px] font-bold tracking-tight">Start one</h3>
        <p class="m-0 mt-2 text-[14px] opacity-95">Nothing near you? Put six people in a room with something to taste &mdash; that is the whole job. The Events team will find you the other members nearby.</p>
        <a href="<?php echo esc_url( home_url( '/careers/' ) ); ?>" class="mt-3 inline-block text-[13px] font-bold text-clover underline underline-offset-2">Volunteer roles &rarr;</a>
      </article>
    </div>
  </section>

  <section class="border-y-[1.5px] border-charcoal bg-milk">
    <div class="mx-auto grid max-w-6xl grid-cols-1 gap-10 px-5 py-12 md:px-10 nav:grid-cols-[1.1fr_1fr]">
      <div>
        <h2 class="font-display m-0 mb-4 text-[28px] font-extrabold tracking-tight">Proposing a session</h2>
        <p class="m-0 mb-3 text-[15px] text-[#3A403C]">The call for sessions opens about six months before the October conference and is announced in the Monday brief. Send the Events Committee a title, three or four sentences on what an attendee leaves knowing, the format you want, and how long you need. Members and non-members are read by the same committee against the same test.</p>
        <p class="m-0 mb-3 text-[15px] text-[#3A403C]">What gets accepted is a specific problem, solved, by somebody who has actually solved it &mdash; cave humidity in a hot summer, what a buyer can really move on, what went wrong with a make and what fixed it. What does not is a product pitch wearing a session title, and the committee can tell the difference from the abstract.</p>
        <p class="m-0 mb-3 text-[15px] text-[#3A403C]">Proposals for the year-round virtual strand are read continuously rather than in a window, which makes it the easier place to start if you have not presented before. A forty-minute webinar with fifteen minutes of questions is a real slot and it is how several of the conference regulars began.</p>
        <p class="m-0 text-[15px] text-[#3A403C]">Send proposals to <a href="mailto:events@morecheese.org" class="text-brick underline underline-offset-2">events@morecheese.org</a>, or ask first through <a href="<?php echo esc_url( home_url( '/contact/' ) ); ?>" class="text-brick underline underline-offset-2">the contact page</a> if you are not sure whether an idea fits.</p>
      </div>
      <div class="space-y-4">
        <div class="rounded-2xl border-[1.5px] border-charcoal p-6">
          <h3 class="font-display m-0 text-xl font-bold tracking-tight">Registration, changes and refunds</h3>
          <p class="m-0 mt-2 text-[15px] text-[#3A403C]">Substituting a colleague is free and can be done up to the doors opening. Refunds close 15 days out, when the room numbers are committed. Recordings of conference sessions go into the members&rsquo; archive and stay there.</p>
          <a href="<?php echo esc_url( home_url( '/faq/conferences-events/' ) ); ?>" class="mt-4 inline-block rounded-full border-[1.5px] border-charcoal px-5 py-2.5 text-sm font-semibold no-underline hover:bg-charcoal hover:text-milk">Events FAQ</a>
        </div>
        <div class="rounded-2xl bg-clover p-6">
          <h3 class="font-display m-0 text-xl font-bold tracking-tight">Continuing education</h3>
          <p class="m-0 mt-2 text-[15px] text-[#243027]">Most Federation sessions count towards reconfirming the Certified Cheese Professional credential; each listing says so. The Annual Conference on its own will usually get you most of the way through a cycle.</p>
          <a href="<?php echo esc_url( home_url( '/learn/' ) ); ?>" class="mt-4 inline-block rounded-full bg-pasture px-5 py-2.5 text-sm font-bold text-white no-underline hover:bg-[#0E4530]">The credential ladder</a>
        </div>
      </div>
    </div>
  </section>
</main>

<?php
get_footer();
