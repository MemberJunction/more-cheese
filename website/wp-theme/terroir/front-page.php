<?php
/**
 * The front page: hero, member marquee, three path cards, the Cheese Library band and the three most recent posts.
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

  <!-- Hero: copy left, Emmental-holes canvas right -->
  <section class="mx-auto grid max-w-6xl grid-cols-1 nav:grid-cols-2 nav:min-h-[460px]">
    <div class="px-5 py-12 md:px-10 md:py-14">
      <h1 class="font-display font-display-tight m-0 mb-5 text-[clamp(44px,6.2vw,80px)] font-extrabold leading-[0.94] tracking-tight text-pasture">
        Good cheese is a <span class="text-brick">community</span> project.
      </h1>
      <p class="m-0 mb-6 max-w-[46ch] text-[17px] text-[#3A403C]">
        The International Cheese Federation is 3,058 makers, agers, mongers and buyers who share standards,
        a competition and a Monday brief. Join for the credentials; stay for the people.
      </p>
      <div class="flex flex-wrap items-center gap-2.5">
        <a href="<?php echo esc_url( home_url( '/join/' ) ); ?>" class="rounded-full bg-pasture px-[18px] py-3 text-sm font-bold text-white no-underline hover:bg-[#0E4530]">See membership</a>
        <a href="<?php echo esc_url( home_url( '/learn/' ) ); ?>" class="rounded-full border-[1.5px] border-charcoal px-[18px] py-3 text-sm font-semibold text-charcoal no-underline hover:bg-charcoal hover:text-milk">Browse the credential ladder</a>
      </div>
      <dl class="mt-10 grid max-w-md grid-cols-3 gap-4 border-t-[1.5px] border-charcoal pt-4">
        <div><dt class="text-xs font-bold uppercase tracking-[.14em] text-mid">Members</dt><dd class="font-display m-0 text-2xl font-bold tracking-tight">3,058</dd></div>
        <div><dt class="text-xs font-bold uppercase tracking-[.14em] text-mid">Organisations</dt><dd class="font-display m-0 text-2xl font-bold tracking-tight">641</dd></div>
        <div><dt class="text-xs font-bold uppercase tracking-[.14em] text-mid">Countries</dt><dd class="font-display m-0 text-2xl font-bold tracking-tight">41</dd></div>
      </dl>
    </div>
    <div class="relative min-h-[260px] overflow-hidden bg-clover nav:min-h-full">
      <canvas id="holes" class="absolute inset-0 block h-full w-full" aria-hidden="true"></canvas>
      <p class="absolute bottom-[22px] left-6 right-6 m-0 max-w-[28ch] rounded bg-milk p-3.5 text-[13px] leading-snug">
        <b class="font-display block text-[15px] font-bold">Member spotlight</b>
        Aisha Bell is building a swab map of every surface at Quincewick Creamery. Her cave now has a data set.
      </p>
    </div>
  </section>

  <!-- Member organisations marquee -->
  <div class="marquee border-y-[1.5px] border-charcoal bg-milk" aria-label="Member organisations">
    <ul class="m-0 list-none p-0">
      <li class="font-display px-[26px] py-3 text-[15px] font-semibold tracking-tight">Quincewick Creamery <span aria-hidden="true" class="ml-[26px] text-brick">·</span></li>
      <li class="font-display px-[26px] py-3 text-[15px] font-semibold tracking-tight">Mongers' Row <span aria-hidden="true" class="ml-[26px] text-brick">·</span></li>
      <li class="font-display px-[26px] py-3 text-[15px] font-semibold tracking-tight">Damsonwick Fine Cheese <span aria-hidden="true" class="ml-[26px] text-brick">·</span></li>
      <li class="font-display px-[26px] py-3 text-[15px] font-semibold tracking-tight">Nornbrook Dairy Systems <span aria-hidden="true" class="ml-[26px] text-brick">·</span></li>
      <li class="font-display px-[26px] py-3 text-[15px] font-semibold tracking-tight">Sorrelgate Cheese Co. <span aria-hidden="true" class="ml-[26px] text-brick">·</span></li>
      <li class="font-display px-[26px] py-3 text-[15px] font-semibold tracking-tight">Bellows &amp; Brine Creamery <span aria-hidden="true" class="ml-[26px] text-brick">·</span></li>
      <li class="font-display px-[26px] py-3 text-[15px] font-semibold tracking-tight">Garnetmoor Dairy Systems <span aria-hidden="true" class="ml-[26px] text-brick">·</span></li>
      <li class="font-display px-[26px] py-3 text-[15px] font-semibold tracking-tight">Okonkwo &amp; Daughters Fine Cheese <span aria-hidden="true" class="ml-[26px] text-brick">·</span></li>
      <li aria-hidden="true" class="font-display px-[26px] py-3 text-[15px] font-semibold tracking-tight">Quincewick Creamery <span class="ml-[26px] text-brick">·</span></li>
      <li aria-hidden="true" class="font-display px-[26px] py-3 text-[15px] font-semibold tracking-tight">Mongers' Row <span class="ml-[26px] text-brick">·</span></li>
      <li aria-hidden="true" class="font-display px-[26px] py-3 text-[15px] font-semibold tracking-tight">Damsonwick Fine Cheese <span class="ml-[26px] text-brick">·</span></li>
      <li aria-hidden="true" class="font-display px-[26px] py-3 text-[15px] font-semibold tracking-tight">Nornbrook Dairy Systems <span class="ml-[26px] text-brick">·</span></li>
      <li aria-hidden="true" class="font-display px-[26px] py-3 text-[15px] font-semibold tracking-tight">Sorrelgate Cheese Co. <span class="ml-[26px] text-brick">·</span></li>
      <li aria-hidden="true" class="font-display px-[26px] py-3 text-[15px] font-semibold tracking-tight">Bellows &amp; Brine Creamery <span class="ml-[26px] text-brick">·</span></li>
      <li aria-hidden="true" class="font-display px-[26px] py-3 text-[15px] font-semibold tracking-tight">Garnetmoor Dairy Systems <span class="ml-[26px] text-brick">·</span></li>
      <li aria-hidden="true" class="font-display px-[26px] py-3 text-[15px] font-semibold tracking-tight">Okonkwo &amp; Daughters Fine Cheese <span class="ml-[26px] text-brick">·</span></li>
    </ul>
  </div>

  <!-- Three paths -->
  <section class="mx-auto max-w-6xl px-5 pb-8 pt-11 md:px-10" aria-labelledby="paths-h">
    <h2 id="paths-h" class="font-display m-0 mb-5 text-[34px] font-extrabold tracking-tight">Three ways in</h2>
    <div class="grid grid-cols-1 gap-4 nav:grid-cols-3">
      <a href="<?php echo esc_url( home_url( '/join/' ) ); ?>" class="flex min-h-[190px] flex-col justify-between rounded-2xl bg-pasture px-5 py-[22px] text-white no-underline transition hover:brightness-110">
        <div>
          <h3 class="font-display m-0 mb-2 text-2xl font-bold leading-[1.05] tracking-tight">Join</h3>
          <p class="m-0 text-sm opacity-95">Individual, Creamery, Retailer or Affiliate. Dues from $170 a year, billed on your join date, with a credential discount from day one.</p>
        </div>
        <div class="mt-4 text-[13px] font-bold">Compare tiers →</div>
      </a>
      <a href="<?php echo esc_url( home_url( '/learn/' ) ); ?>" class="flex min-h-[190px] flex-col justify-between rounded-2xl bg-clover px-5 py-[22px] text-charcoal no-underline transition hover:brightness-105">
        <div>
          <h3 class="font-display m-0 mb-2 text-2xl font-bold leading-[1.05] tracking-tight">Learn</h3>
          <p class="m-0 text-sm">Cheese Foundations → Certified Cheese Professional → Food Safety &amp; HACCP → Advanced Affinage. 63 courses this year, cohorts named for cheeses.</p>
        </div>
        <div class="mt-4 text-[13px] font-bold">See the ladder →</div>
      </a>
      <a href="<?php echo esc_url( home_url( '/compete/' ) ); ?>" class="flex min-h-[190px] flex-col justify-between rounded-2xl bg-brick px-5 py-[22px] text-white no-underline transition hover:brightness-110">
        <div>
          <h3 class="font-display m-0 mb-2 text-2xl font-bold leading-[1.05] tracking-tight">Compete</h3>
          <p class="m-0 text-sm opacity-95">Six categories, judged blind, results published with the score sheets. Entries for the 2026 competition open in January.</p>
        </div>
        <div class="mt-4 text-[13px] font-bold">See the categories →</div>
      </a>
    </div>
  </section>

  <!-- Cheese Library band -->
  <section class="border-y-[1.5px] border-charcoal bg-milk" aria-labelledby="lib-h">
    <div class="mx-auto grid max-w-6xl grid-cols-1 gap-8 px-5 py-12 md:px-10 nav:grid-cols-[1.2fr_1fr] nav:items-center">
      <div>
        <p class="m-0 text-xs font-bold uppercase tracking-[.14em] text-brick">New &middot; open to everyone</p>
        <h2 id="lib-h" class="font-display m-0 mb-3 mt-2 max-w-[18ch] text-[clamp(28px,3.6vw,44px)] font-extrabold leading-[1] tracking-tight text-pasture">The Cheese Library</h2>
        <p class="m-0 mb-4 max-w-[52ch] text-[17px] text-[#3A403C]">Eight families and twenty-five reference styles &mdash; milk, ageing, texture, producing region, and the one line a monger actually needs: what to look for, and what it means when you do not see it. Filter it by family, milk or texture. No login, no membership.</p>
        <div class="flex flex-wrap items-center gap-2.5">
          <a href="<?php echo esc_url( home_url( '/library/' ) ); ?>" class="rounded-full bg-pasture px-[18px] py-3 text-sm font-bold text-white no-underline hover:bg-[#0E4530]">Browse the library</a>
          <a href="<?php echo esc_url( home_url( '/faq/' ) ); ?>" class="rounded-full border-[1.5px] border-charcoal px-[18px] py-3 text-sm font-semibold text-charcoal no-underline hover:bg-charcoal hover:text-milk">Or start with the FAQ</a>
        </div>
      </div>
      <ul class="m-0 grid list-none grid-cols-2 gap-2 p-0 text-sm">
        <li class="rounded-xl border-[1.5px] border-charcoal px-3 py-2 font-semibold">Fresh</li>
        <li class="rounded-xl border-[1.5px] border-charcoal px-3 py-2 font-semibold">Bloomy-rind</li>
        <li class="rounded-xl border-[1.5px] border-charcoal px-3 py-2 font-semibold">Washed-rind</li>
        <li class="rounded-xl border-[1.5px] border-charcoal px-3 py-2 font-semibold">Blue</li>
        <li class="rounded-xl border-[1.5px] border-charcoal px-3 py-2 font-semibold">Semi-hard</li>
        <li class="rounded-xl border-[1.5px] border-charcoal px-3 py-2 font-semibold">Hard / alpine</li>
        <li class="rounded-xl bg-clover px-3 py-2 font-semibold">Pasta filata</li>
        <li class="rounded-xl bg-clover px-3 py-2 font-semibold">Natural-rind</li>
      </ul>
    </div>
  </section>

  <!-- This week: the three most recent posts, from the real loop -->
  <section class="mx-auto grid max-w-6xl grid-cols-1 items-start gap-[18px] px-5 pb-12 pt-2.5 md:px-10 nav:grid-cols-[1.1fr_1fr_1fr]" aria-labelledby="week-h">
    <h2 id="week-h" class="sr-only"><?php esc_html_e( 'This week on the blog', 'terroir' ); ?></h2>
<?php
$terroir_latest = new WP_Query(
	array(
		'posts_per_page'      => 3,
		'post_status'         => 'publish',
		'ignore_sticky_posts' => true,
		'no_found_rows'       => true,
	)
);

if ( $terroir_latest->have_posts() ) :
	$terroir_i = 0;
	while ( $terroir_latest->have_posts() ) :
		$terroir_latest->the_post();
		$terroir_lead = ( 0 === $terroir_i );
		?>
    <article class="border-t-[1.5px] border-charcoal pt-3">
      <div class="text-[11px] font-bold uppercase tracking-[.14em] text-brick"><?php echo esc_html( terroir_category_label() ); ?><?php echo $terroir_lead ? ' &middot; ' . esc_html__( 'this week', 'terroir' ) : ''; ?></div>
      <h3 class="font-display mb-1.5 mt-2 <?php echo $terroir_lead ? 'text-3xl' : 'text-[22px]'; ?> font-bold leading-[1.1] tracking-tight">
        <a href="<?php the_permalink(); ?>" class="text-charcoal no-underline hover:text-pasture"><?php the_title(); ?></a>
      </h3>
      <p class="m-0 text-sm text-[#3A403C]"><?php echo esc_html( terroir_card_excerpt( 26 ) ); ?></p>
    </article>
		<?php
		$terroir_i++;
	endwhile;
	wp_reset_postdata();
else :
	?>
    <p class="m-0 text-[15px] text-mid"><?php esc_html_e( 'The blog is warming up. Nothing published yet.', 'terroir' ); ?></p>
	<?php
endif;
?>
    <p class="nav:col-span-3"><a href="<?php echo esc_url( home_url( '/blog/' ) ); ?>" class="font-display text-sm font-bold text-pasture underline underline-offset-4"><?php esc_html_e( 'Read the whole blog', 'terroir' ); ?> &rarr;</a></p>
  </section>
</main>

<?php
get_footer();
