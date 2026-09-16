<?php
/**
 * The template WordPress requires every theme to have.
 *
 * Nothing on this site routes here in practice — front-page.php, home.php,
 * single.php, the per-slug page templates, page.php and 404.php cover every
 * request. It delegates to the blog-index markup so that an archive, a search
 * result or an unexpected post type still renders as the site rather than as
 * raw text.
 *
 * @package Terroir
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

get_template_part( 'home' );
