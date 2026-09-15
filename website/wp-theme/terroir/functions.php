<?php
/**
 * Terroir — More Cheese
 *
 * Static-first theme: Tailwind from the play CDN with an inline config, a small
 * custom CSS layer, and vanilla JavaScript. No build step and no bundler, which
 * is why the config lives in PHP here rather than in a tailwind.config.js.
 *
 * @package Terroir
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

define( 'TERROIR_VERSION', '1.0.0' );

/**
 * Theme supports.
 */
function terroir_setup() {
	add_theme_support( 'title-tag' );
	add_theme_support( 'post-thumbnails' );
	add_theme_support( 'automatic-feed-links' );
	add_theme_support(
		'html5',
		array( 'search-form', 'comment-form', 'comment-list', 'gallery', 'caption', 'style', 'script', 'navigation-widgets' )
	);
	add_theme_support( 'responsive-embeds' );
	register_nav_menus(
		array(
			'primary' => __( 'Primary navigation (unused: the header nav is hard-coded to slugs)', 'terroir' ),
		)
	);
}
add_action( 'after_setup_theme', 'terroir_setup' );

/**
 * The palette and font stacks, as the play CDN expects them.
 *
 * One place to change the palette. A yellower variant is a change to these six
 * values (plus `butter`, which is defined and deliberately unused today).
 * assets/site.css repeats a handful of the hex values where a utility class
 * cannot reach; assets/site.js draws the hero canvas with the same greens.
 *
 * @return string JavaScript source, no <script> wrapper.
 */
function terroir_tailwind_config() {
	return <<<'JS'
tailwind.config = {
  theme: {
    extend: {
      colors: {
        milk:     '#FCFBF7',
        pasture:  '#145C3D',
        clover:   '#C8E3A0',
        brick:    '#A23C2C',
        charcoal: '#242424',
        mid:      '#5E6560',
        butter:   '#EFC24A'
      },
      fontFamily: {
        display: ['"Bricolage Grotesque"', '"Trebuchet MS"', 'system-ui', 'sans-serif'],
        sans:    ['"Public Sans"', 'system-ui', '-apple-system', '"Segoe UI"', 'Helvetica', 'Arial', 'sans-serif']
      },
      screens: { nav: '900px' }
    }
  }
};
JS;
}

/**
 * Styles and scripts.
 */
function terroir_assets() {
	$dir = get_template_directory();
	$uri = get_template_directory_uri();

	// Google Fonts. Two families, one request, display=swap.
	wp_enqueue_style(
		'terroir-fonts',
		'https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wdth,wght@12..96,75..100,300..800&family=Public+Sans:wght@400;500;600;700&display=swap',
		array(),
		null // phpcs:ignore WordPress.WP.EnqueuedResourceParameters.MissingVersion -- remote font CSS, versioning is the URL's job.
	);

	// Tailwind, from the play CDN, in the head, with the config immediately after
	// it — the same order the static pages use. The CDN watches for the
	// assignment and re-processes, so "after" is correct.
	wp_enqueue_script(
		'terroir-tailwind',
		'https://cdn.tailwindcss.com',
		array(),
		null, // phpcs:ignore WordPress.WP.EnqueuedResourceParameters.MissingVersion -- remote CDN.
		false
	);
	wp_add_inline_script( 'terroir-tailwind', terroir_tailwind_config(), 'after' );

	$css = $dir . '/assets/site.css';
	wp_enqueue_style(
		'terroir-site',
		$uri . '/assets/site.css',
		array( 'terroir-fonts' ),
		file_exists( $css ) ? (string) filemtime( $css ) : TERROIR_VERSION
	);

	$js = $dir . '/assets/site.js';
	wp_enqueue_script(
		'terroir-site',
		$uri . '/assets/site.js',
		array(),
		file_exists( $js ) ? (string) filemtime( $js ) : TERROIR_VERSION,
		true
	);
}
add_action( 'wp_enqueue_scripts', 'terroir_assets' );

/**
 * Preconnect to the font hosts, the way the static pages do.
 *
 * @param array  $urls           URLs for the hint.
 * @param string $relation_type  Hint type.
 * @return array
 */
function terroir_resource_hints( $urls, $relation_type ) {
	if ( 'preconnect' === $relation_type ) {
		$urls[] = array( 'href' => 'https://fonts.googleapis.com' );
		$urls[] = array(
			'href'        => 'https://fonts.gstatic.com',
			'crossorigin' => 'anonymous',
		);
	}
	return $urls;
}
add_filter( 'wp_resource_hints', 'terroir_resource_hints', 10, 2 );

/**
 * Head bloat this theme has no use for.
 *
 * Deliberately conservative: nothing here changes how content is stored or
 * how any plugin behaves, and every removal is reversible by deleting a line.
 */
function terroir_clean_head() {
	remove_action( 'wp_head', 'rsd_link' );
	remove_action( 'wp_head', 'wlwmanifest_link' );
	remove_action( 'wp_head', 'wp_generator' );
	remove_action( 'wp_head', 'wp_shortlink_wp_head' );
	remove_action( 'wp_head', 'adjacent_posts_rel_link_wp_head', 10 );

	// Emoji: a script, a stylesheet and two filters, none of which this site uses.
	remove_action( 'wp_head', 'print_emoji_detection_script', 7 );
	remove_action( 'admin_print_scripts', 'print_emoji_detection_script' );
	remove_action( 'wp_print_styles', 'print_emoji_styles' );
	remove_action( 'admin_print_styles', 'print_emoji_styles' );
	remove_filter( 'the_content_feed', 'wp_staticize_emoji' );
	remove_filter( 'comment_text_rss', 'wp_staticize_emoji' );
	remove_filter( 'wp_mail', 'wp_staticize_emoji_for_email' );
}
add_action( 'init', 'terroir_clean_head' );

/**
 * Drop the emoji plugin from TinyMCE too.
 *
 * @param array $plugins TinyMCE plugins.
 * @return array
 */
function terroir_disable_emoji_tinymce( $plugins ) {
	return is_array( $plugins ) ? array_diff( $plugins, array( 'wpemoji' ) ) : array();
}
add_filter( 'tiny_mce_plugins', 'terroir_disable_emoji_tinymce' );

/**
 * The block library's front-end CSS is unused: every hand-written template is
 * plain markup with Tailwind utilities on it.
 *
 * Global styles (the block preset custom properties) are deliberately left
 * alone. page.php and single.php render whatever the editor produced, and a
 * page added later in wp-admin using a preset colour would lose it.
 */
function terroir_dequeue_block_css() {
	wp_dequeue_style( 'wp-block-library' );
	wp_dequeue_style( 'wp-block-library-theme' );
	wp_dequeue_style( 'classic-theme-styles' );
}
add_action( 'wp_enqueue_scripts', 'terroir_dequeue_block_css', 100 );

/**
 * Titles read "Join · More Cheese", the way the static pages do, rather than
 * with WordPress's default en dash.
 *
 * @return string
 */
function terroir_title_separator() {
	return '·';
}
add_filter( 'document_title_separator', 'terroir_title_separator' );

/**
 * Twelve posts to a page on the blog index only.
 *
 * @param WP_Query $query The query.
 */
function terroir_posts_per_page( $query ) {
	if ( is_admin() || ! $query->is_main_query() ) {
		return;
	}
	if ( $query->is_home() ) {
		$query->set( 'posts_per_page', 12 );
	}
}
add_action( 'pre_get_posts', 'terroir_posts_per_page' );

/**
 * Retired slugs from the previous site, redirected once and permanently.
 *
 * /faq/cheese-education/ was already a 404 that /faq/ linked to; its
 * consumer-facing material is now the open Cheese Library. /programs/ is folded
 * into /learn/ and /about-page/ into /about/.
 */
function terroir_legacy_redirects() {
	if ( is_admin() || wp_doing_ajax() || ( defined( 'REST_REQUEST' ) && REST_REQUEST ) ) {
		return;
	}

	$request = isset( $_SERVER['REQUEST_URI'] ) ? esc_url_raw( wp_unslash( $_SERVER['REQUEST_URI'] ) ) : '';
	if ( '' === $request ) {
		return;
	}

	$path = wp_parse_url( $request, PHP_URL_PATH );
	if ( ! is_string( $path ) || '' === $path ) {
		return;
	}

	// Tolerate a subdirectory install.
	$home_path = (string) wp_parse_url( home_url( '/' ), PHP_URL_PATH );
	if ( '' !== $home_path && '/' !== $home_path && 0 === strpos( $path, $home_path ) ) {
		$path = '/' . substr( $path, strlen( $home_path ) );
	}

	$path = trim( $path, '/' );
	if ( '' === $path ) {
		return;
	}
	$path = '/' . $path . '/';

	$map = array(
		'/faq/cheese-education/' => '/library/',
		'/programs/'             => '/learn/',
		'/about-page/'           => '/about/',
	);

	if ( isset( $map[ $path ] ) ) {
		wp_safe_redirect( home_url( $map[ $path ] ), 301 );
		exit;
	}
}
add_action( 'template_redirect', 'terroir_legacy_redirects', 1 );

/**
 * The first category of a post, as a plain label. Falls back to a kicker that
 * reads correctly rather than to an empty string.
 *
 * @param int|null $post_id Post ID.
 * @return string
 */
function terroir_category_label( $post_id = null ) {
	$cats = get_the_category( $post_id );
	if ( ! empty( $cats ) && ! is_wp_error( $cats ) ) {
		return $cats[0]->name;
	}
	return __( 'From the Federation', 'terroir' );
}

/**
 * Excerpt, trimmed to a card-sized length, with no "[...]" tail.
 *
 * @param int $words Word count.
 * @return string
 */
function terroir_card_excerpt( $words = 28 ) {
	$text = has_excerpt() ? get_the_excerpt() : wp_strip_all_tags( strip_shortcodes( get_the_content() ) );
	$text = str_replace( array( "\r", "\n" ), ' ', (string) $text );
	return wp_trim_words( $text, $words, '…' );
}

/**
 * The card colourway for position $i in a grid, reproducing the rhythm of the
 * hand-built blog index: mostly outlined, with a clover, a pasture and a brick
 * card breaking it up.
 *
 * @param int $i Zero-based index within the page.
 * @return array{card:string,kicker:string,meta:string,body:string,link:string}
 */
function terroir_card_style( $i ) {
	$slot = $i % 12;

	if ( 2 === $slot || 8 === $slot ) {
		return array(
			'card'   => 'flex flex-col rounded-2xl bg-clover p-6',
			'kicker' => 'm-0 text-[11px] font-bold uppercase tracking-[.14em] text-pasture',
			'meta'   => 'm-0 text-sm text-[#41503F]',
			'body'   => 'm-0 mt-3 text-[15px] text-[#243027]',
			'link'   => 'text-charcoal no-underline hover:text-pasture',
		);
	}
	if ( 5 === $slot ) {
		return array(
			'card'   => 'flex flex-col rounded-2xl bg-pasture p-6 text-white',
			'kicker' => 'm-0 text-[11px] font-bold uppercase tracking-[.14em] text-clover',
			'meta'   => 'm-0 text-sm text-clover',
			'body'   => 'm-0 mt-3 text-[15px] opacity-95',
			'link'   => 'text-white no-underline hover:text-clover',
		);
	}
	if ( 10 === $slot ) {
		return array(
			'card'   => 'flex flex-col rounded-2xl bg-brick p-6 text-white',
			'kicker' => 'm-0 text-[11px] font-bold uppercase tracking-[.14em] text-clover',
			'meta'   => 'm-0 text-sm text-clover',
			'body'   => 'm-0 mt-3 text-[15px] opacity-95',
			'link'   => 'text-white no-underline hover:text-clover',
		);
	}
	return array(
		'card'   => 'flex flex-col rounded-2xl border-[1.5px] border-charcoal bg-milk p-6',
		'kicker' => 'm-0 text-[11px] font-bold uppercase tracking-[.14em] text-brick',
		'meta'   => 'm-0 text-sm text-mid',
		'body'   => 'm-0 mt-3 text-[15px] text-[#3A403C]',
		'link'   => 'text-charcoal no-underline hover:text-pasture',
	);
}
