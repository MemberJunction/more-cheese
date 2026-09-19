<?php
/**
 * 404. Routes to the four places a lost visitor most often wanted.
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
      <p class="text-xs font-bold uppercase tracking-[.14em] text-brick"><?php esc_html_e( '404', 'terroir' ); ?></p>
      <h1 class="font-display font-display-tight m-0 mb-4 mt-2 max-w-[18ch] text-[clamp(38px,5.4vw,68px)] font-extrabold leading-[0.94] tracking-tight text-pasture"><?php esc_html_e( 'That page is not here.', 'terroir' ); ?></h1>
      <p class="m-0 max-w-[58ch] text-[17px] text-[#3A403C]"><?php esc_html_e( 'Either it moved, or it never existed. Both happen. Here is where most people were actually going.', 'terroir' ); ?></p>
    </div>
  </section>

  <section class="mx-auto max-w-6xl px-5 py-12 md:px-10" aria-labelledby="lost-h">
    <h2 id="lost-h" class="font-display m-0 mb-5 text-[34px] font-extrabold tracking-tight"><?php esc_html_e( 'Try one of these', 'terroir' ); ?></h2>
    <div class="grid grid-cols-1 gap-3 md:grid-cols-2 nav:grid-cols-4">
      <a href="<?php echo esc_url( home_url( '/faq/' ) ); ?>" class="flex flex-col rounded-2xl border-[1.5px] border-charcoal bg-milk p-5 no-underline transition hover:bg-clover">
        <h3 class="font-display m-0 text-[19px] font-bold leading-tight tracking-tight text-charcoal"><?php esc_html_e( 'The FAQ', 'terroir' ); ?></h3>
        <p class="m-0 mt-2 flex-1 text-[14px] text-[#3A403C]"><?php esc_html_e( 'Eight topics with a filter box on each — dues, renewals, certifications, events, the directory.', 'terroir' ); ?></p>
        <span class="mt-3 text-[13px] font-bold text-pasture"><?php esc_html_e( 'Browse topics', 'terroir' ); ?> &rarr;</span>
      </a>
      <a href="<?php echo esc_url( home_url( '/join/' ) ); ?>" class="flex flex-col rounded-2xl border-[1.5px] border-charcoal bg-milk p-5 no-underline transition hover:bg-clover">
        <h3 class="font-display m-0 text-[19px] font-bold leading-tight tracking-tight text-charcoal"><?php esc_html_e( 'The rate card', 'terroir' ); ?></h3>
        <p class="m-0 mt-2 flex-1 text-[14px] text-[#3A403C]"><?php esc_html_e( 'Four tiers, what each covers, and how dues billing works.', 'terroir' ); ?></p>
        <span class="mt-3 text-[13px] font-bold text-pasture"><?php esc_html_e( 'Compare tiers', 'terroir' ); ?> &rarr;</span>
      </a>
      <a href="<?php echo esc_url( home_url( '/library/' ) ); ?>" class="flex flex-col rounded-2xl border-[1.5px] border-charcoal bg-milk p-5 no-underline transition hover:bg-clover">
        <h3 class="font-display m-0 text-[19px] font-bold leading-tight tracking-tight text-charcoal"><?php esc_html_e( 'The Cheese Library', 'terroir' ); ?></h3>
        <p class="m-0 mt-2 flex-1 text-[14px] text-[#3A403C]"><?php esc_html_e( 'Eight families and 25 reference styles. Open reference, no login.', 'terroir' ); ?></p>
        <span class="mt-3 text-[13px] font-bold text-pasture"><?php esc_html_e( 'Browse styles', 'terroir' ); ?> &rarr;</span>
      </a>
      <a href="<?php echo esc_url( home_url( '/blog/' ) ); ?>" class="flex flex-col rounded-2xl border-[1.5px] border-charcoal bg-milk p-5 no-underline transition hover:bg-clover">
        <h3 class="font-display m-0 text-[19px] font-bold leading-tight tracking-tight text-charcoal"><?php esc_html_e( 'The blog', 'terroir' ); ?></h3>
        <p class="m-0 mt-2 flex-1 text-[14px] text-[#3A403C]"><?php esc_html_e( 'Certification, education, advocacy, events and the members behind them.', 'terroir' ); ?></p>
        <span class="mt-3 text-[13px] font-bold text-pasture"><?php esc_html_e( 'Read the blog', 'terroir' ); ?> &rarr;</span>
      </a>
    </div>

    <div class="mt-8 rounded-2xl bg-pasture px-6 py-8 text-white md:px-10">
      <h2 class="font-display m-0 text-[26px] font-extrabold tracking-tight"><?php esc_html_e( 'Still lost?', 'terroir' ); ?></h2>
      <p class="m-0 mt-2 max-w-[58ch] text-[15px] opacity-95"><?php esc_html_e( 'Tell us what you were looking for and we will fix the link. Broken links get fixed the same week.', 'terroir' ); ?></p>
      <a href="<?php echo esc_url( home_url( '/contact/' ) ); ?>" class="mt-5 inline-block rounded-full bg-milk px-6 py-3 text-sm font-bold text-pasture no-underline hover:bg-clover"><?php esc_html_e( 'Contact the Federation', 'terroir' ); ?></a>
    </div>
  </section>
</main>

<?php
get_footer();
