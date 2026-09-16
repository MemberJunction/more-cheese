<?php
/**
 * A single post, in post.html's article typography.
 *
 * The fiction disclaimer is already the final paragraph of every post's content
 * in the corpus, so this template deliberately does not add a second one. The
 * footer's copy is the one that is guaranteed on every page.
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
  <article class="mx-auto max-w-[72ch] px-5 py-12 md:py-16">
    <nav aria-label="<?php esc_attr_e( 'Breadcrumb', 'terroir' ); ?>" class="mb-6 text-sm">
      <a href="<?php echo esc_url( home_url( '/blog/' ) ); ?>" class="text-brick no-underline hover:underline">&larr; <?php esc_html_e( 'ICF Blog', 'terroir' ); ?></a>
    </nav>

    <p class="m-0 text-[11px] font-bold uppercase tracking-[.14em] text-brick"><?php echo esc_html( terroir_category_label() ); ?></p>
    <h1 class="font-display font-display-tight m-0 mb-4 mt-3 text-[clamp(34px,4.6vw,56px)] font-extrabold leading-[0.96] tracking-tight text-pasture"><?php the_title(); ?></h1>
    <p class="m-0 mb-8 border-b border-charcoal/20 pb-6 text-sm text-mid">
      <time datetime="<?php echo esc_attr( get_the_date( DATE_W3C ) ); ?>"><?php echo esc_html( get_the_date( 'j F Y' ) ); ?></time>
      &middot; <?php esc_html_e( 'International Cheese Federation', 'terroir' ); ?>
    </p>

	<?php if ( has_post_thumbnail() ) : ?>
    <div class="mb-8 overflow-hidden rounded-2xl border-[1.5px] border-charcoal">
		<?php the_post_thumbnail( 'large', array( 'class' => 'block h-auto w-full' ) ); ?>
    </div>
	<?php endif; ?>

    <div class="prose-mc">
		<?php the_content(); ?>
    </div>

    <aside class="mt-10 rounded-2xl bg-clover p-6">
      <h2 class="font-display m-0 text-xl font-bold tracking-tight"><?php esc_html_e( 'Start on the ladder', 'terroir' ); ?></h2>
      <p class="m-0 mt-2 text-[15px] text-[#243027]"><?php esc_html_e( 'Four rungs, 63 courses this year, cohorts named Brook, Meadow, Alpine and Birch.', 'terroir' ); ?></p>
      <div class="mt-4 flex flex-wrap gap-2.5">
        <a href="<?php echo esc_url( home_url( '/learn/' ) ); ?>" class="rounded-full bg-pasture px-5 py-2.5 text-sm font-bold text-white no-underline hover:bg-[#0E4530]"><?php esc_html_e( 'See the credential ladder', 'terroir' ); ?></a>
        <a href="<?php echo esc_url( home_url( '/join/' ) ); ?>" class="rounded-full border-[1.5px] border-charcoal px-5 py-2.5 text-sm font-semibold text-charcoal no-underline hover:bg-charcoal hover:text-milk"><?php esc_html_e( 'Compare membership tiers', 'terroir' ); ?></a>
      </div>
    </aside>

	<?php
	$terroir_prev = get_previous_post();
	$terroir_next = get_next_post();
	if ( $terroir_prev || $terroir_next ) :
		?>
    <nav class="mt-10 grid grid-cols-1 gap-3 border-t-[1.5px] border-charcoal pt-6 md:grid-cols-2" aria-label="<?php esc_attr_e( 'More posts', 'terroir' ); ?>">
		<?php if ( $terroir_prev ) : ?>
      <a href="<?php echo esc_url( get_permalink( $terroir_prev ) ); ?>" class="rounded-2xl border-[1.5px] border-charcoal p-4 no-underline transition hover:bg-clover">
        <span class="block text-[11px] font-bold uppercase tracking-[.14em] text-brick"><?php esc_html_e( 'Previous', 'terroir' ); ?></span>
        <span class="font-display mt-1 block text-[17px] font-bold leading-tight tracking-tight text-charcoal"><?php echo esc_html( get_the_title( $terroir_prev ) ); ?></span>
      </a>
		<?php endif; ?>
		<?php if ( $terroir_next ) : ?>
      <a href="<?php echo esc_url( get_permalink( $terroir_next ) ); ?>" class="rounded-2xl border-[1.5px] border-charcoal p-4 no-underline transition hover:bg-clover md:text-right">
        <span class="block text-[11px] font-bold uppercase tracking-[.14em] text-brick"><?php esc_html_e( 'Next', 'terroir' ); ?></span>
        <span class="font-display mt-1 block text-[17px] font-bold leading-tight tracking-tight text-charcoal"><?php echo esc_html( get_the_title( $terroir_next ) ); ?></span>
      </a>
		<?php endif; ?>
    </nav>
		<?php
	endif;
	?>
  </article>
	<?php
endwhile;
?>
</main>

<?php
get_footer();
