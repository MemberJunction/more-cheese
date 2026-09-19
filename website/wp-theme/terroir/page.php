<?php
/**
 * Generic page fallback.
 *
 * Every page in the sitemap has its own slug template; this catches anything
 * added later in wp-admin and renders it in the article typography so it still
 * looks like the site.
 *
 * @package Terroir
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

get_header();
?>

<main id="main">

<?php
while ( have_posts() ) :
	the_post();
	?>
  <section class="border-b border-charcoal/15 bg-milk">
    <div class="mx-auto max-w-6xl px-5 py-12 md:px-10 md:py-14">
      <h1 class="font-display font-display-tight m-0 text-[clamp(38px,5.4vw,68px)] font-extrabold leading-[0.94] tracking-tight text-pasture"><?php the_title(); ?></h1>
    </div>
  </section>

  <article class="mx-auto max-w-[72ch] px-5 py-12">
    <div class="prose-mc">
		<?php the_content(); ?>
    </div>
		<?php
		wp_link_pages(
			array(
				'before' => '<p class="mt-6 text-sm text-mid">' . esc_html__( 'Pages:', 'terroir' ) . ' ',
				'after'  => '</p>',
			)
		);
		?>
  </article>
	<?php
endwhile;
?>
</main>

<?php
get_footer();
