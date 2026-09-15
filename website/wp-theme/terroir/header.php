<?php
/**
 * The header: <head>, the skip link and the primary navigation.
 *
 * Nav links are built from slugs rather than from a menu, so that activating the
 * theme needs no menu assignment in wp-admin. Current-page marking is done in
 * assets/site.js, which compares path segments and therefore works for both
 * "/join/" and "/faq/membership-dues/".
 *
 * @package Terroir
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

$terroir_nav = array(
	'/join/'    => __( 'Join', 'terroir' ),
	'/learn/'   => __( 'Learn', 'terroir' ),
	'/library/' => __( 'Library', 'terroir' ),
	'/compete/' => __( 'Compete', 'terroir' ),
	'/events/'  => __( 'Events', 'terroir' ),
	'/blog/'    => __( 'Blog', 'terroir' ),
	'/about/'   => __( 'About', 'terroir' ),
);
?>
<!DOCTYPE html>
<html <?php language_attributes(); ?>>
<head>
<meta charset="<?php bloginfo( 'charset' ); ?>">
<meta name="viewport" content="width=device-width, initial-scale=1">
<?php wp_head(); ?>
</head>
<body <?php body_class( 'bg-milk text-charcoal text-[15px] leading-relaxed' ); ?>>
<?php wp_body_open(); ?>

<a class="skip-link" href="#main"><?php esc_html_e( 'Skip to main content', 'terroir' ); ?></a>

<header class="relative border-b border-charcoal/15 bg-milk">
  <nav class="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-4 md:px-10" aria-label="<?php esc_attr_e( 'Main', 'terroir' ); ?>">
    <a href="<?php echo esc_url( home_url( '/' ) ); ?>" class="font-display flex items-center gap-2.5 text-[22px] font-extrabold tracking-tight text-charcoal no-underline">
      <span class="logo-dot" aria-hidden="true"></span><?php echo esc_html__( 'More Cheese', 'terroir' ); ?>
    </a>
    <ul id="nav-menu" class="items-center gap-[22px] text-sm font-medium nav:flex">
<?php foreach ( $terroir_nav as $terroir_path => $terroir_label ) : ?>
      <li><a href="<?php echo esc_url( home_url( $terroir_path ) ); ?>" class="text-charcoal no-underline hover:text-pasture"><?php echo esc_html( $terroir_label ); ?></a></li>
<?php endforeach; ?>
    </ul>
    <div class="flex items-center gap-2">
      <a href="<?php echo esc_url( home_url( '/join/' ) ); ?>" class="rounded-full bg-pasture px-[18px] py-[11px] text-sm font-bold text-white no-underline hover:bg-[#0E4530]"><?php esc_html_e( 'Become a member', 'terroir' ); ?></a>
      <button id="nav-toggle" type="button" class="items-center gap-2 rounded-full border-[1.5px] border-charcoal px-4 py-2 text-sm font-semibold" aria-expanded="false" aria-controls="nav-menu">
        <span class="nav-toggle-label"><?php esc_html_e( 'Menu', 'terroir' ); ?></span>
        <span aria-hidden="true">&#9776;</span>
      </button>
    </div>
  </nav>
</header>
