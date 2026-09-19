<?php
/**
 * The blog index (the page set as "Posts page").
 *
 * The card design is blog.html's, driven by the real loop. Twelve to a page,
 * set in functions.php via pre_get_posts on the home query only.
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
      <p class="text-xs font-bold uppercase tracking-[.14em] text-brick"><?php esc_html_e( 'Publications', 'terroir' ); ?></p>
      <h1 class="font-display font-display-tight m-0 mb-4 mt-2 text-[clamp(38px,5.4vw,68px)] font-extrabold leading-[0.94] tracking-tight text-pasture"><?php echo esc_html( get_the_title( (int) get_option( 'page_for_posts' ) ) ? get_the_title( (int) get_option( 'page_for_posts' ) ) : __( 'ICF Blog', 'terroir' ) ); ?></h1>
      <p class="m-0 max-w-[58ch] text-[17px] text-[#3A403C]"><?php esc_html_e( 'Certification, education, advocacy, events, industry news and the members behind them — written by the Federation, for the people who make, age, sell and buy the cheese.', 'terroir' ); ?></p>
    </div>
  </section>

  <section class="mx-auto max-w-6xl px-5 py-12 md:px-10" aria-labelledby="posts-h">
    <h2 id="posts-h" class="sr-only"><?php esc_html_e( 'Recent posts', 'terroir' ); ?></h2>

<?php if ( have_posts() ) : ?>
    <div class="grid grid-cols-1 gap-4 md:grid-cols-2 nav:grid-cols-3">
	<?php
	$terroir_i = 0;
	while ( have_posts() ) :
		the_post();
		$terroir_s = terroir_card_style( $terroir_i );
		?>
      <article class="<?php echo esc_attr( $terroir_s['card'] ); ?>">
        <p class="<?php echo esc_attr( $terroir_s['kicker'] ); ?>"><?php echo esc_html( terroir_category_label() ); ?></p>
        <h3 class="font-display mb-2 mt-2 text-[22px] font-bold leading-[1.15] tracking-tight">
          <a href="<?php the_permalink(); ?>" class="<?php echo esc_attr( $terroir_s['link'] ); ?>"><?php the_title(); ?></a>
        </h3>
        <p class="<?php echo esc_attr( $terroir_s['meta'] ); ?>"><time datetime="<?php echo esc_attr( get_the_date( DATE_W3C ) ); ?>"><?php echo esc_html( get_the_date( 'j F Y' ) ); ?></time></p>
        <p class="<?php echo esc_attr( $terroir_s['body'] ); ?>"><?php echo esc_html( terroir_card_excerpt() ); ?></p>
      </article>
		<?php
		$terroir_i++;
	endwhile;
	?>
    </div>

    <div class="mt-10 border-t-[1.5px] border-charcoal pt-6 text-[15px]">
	<?php
	the_posts_pagination(
		array(
			'mid_size'           => 2,
			'screen_reader_text' => __( 'Blog pages', 'terroir' ),
			'prev_text'          => '&larr; ' . __( 'Newer', 'terroir' ),
			'next_text'          => __( 'Older', 'terroir' ) . ' &rarr;',
		)
	);
	?>
    </div>

<?php else : ?>
    <p class="m-0 rounded-2xl border-[1.5px] border-brick bg-milk p-6 text-[15px] text-brick"><?php esc_html_e( 'Nothing published yet. The Monday brief goes out regardless.', 'terroir' ); ?></p>
<?php endif; ?>
  </section>
</main>

<?php
get_footer();
