<?php
/**
 * The footer. The fiction disclaimer is verbatim and must stay that way.
 *
 * @package Terroir
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}
?>
<footer class="bg-charcoal text-[#D9DBD4]">
  <div class="mx-auto max-w-6xl px-5 py-12 md:px-10">
    <div class="flex flex-wrap justify-between gap-10">
      <div class="max-w-sm">
        <div class="font-display flex items-center gap-2.5 text-[20px] font-extrabold tracking-tight text-milk">
          <span class="logo-dot logo-dot--light" aria-hidden="true"></span><?php echo esc_html__( 'More Cheese', 'terroir' ); ?>
        </div>
        <p class="mt-3 text-sm leading-relaxed text-[#B9BEB7]"><?php esc_html_e( 'The International Cheese Federation', 'terroir' ); ?> &middot; <?php esc_html_e( '1 Rind Lane, Lancaster, PA', 'terroir' ); ?> &middot; <a href="mailto:info@morecheese.org" class="text-clover underline underline-offset-2">info@morecheese.org</a></p>
        <p class="mt-2 text-sm text-[#B9BEB7]"><?php esc_html_e( 'Member Services:', 'terroir' ); ?> <a href="mailto:memberservices@morecheese.org" class="text-clover underline underline-offset-2">memberservices@morecheese.org</a></p>
      </div>
      <nav class="flex flex-wrap gap-10 text-sm" aria-label="<?php esc_attr_e( 'Footer', 'terroir' ); ?>">
        <div>
          <h2 class="font-display mb-2 text-xs font-bold uppercase tracking-[.14em] text-[#8E948C]"><?php esc_html_e( 'Membership', 'terroir' ); ?></h2>
          <ul class="space-y-1.5">
            <li><a href="<?php echo esc_url( home_url( '/join/' ) ); ?>" class="text-[#D9DBD4] no-underline hover:text-clover"><?php esc_html_e( 'Join', 'terroir' ); ?></a></li>
            <li><a href="<?php echo esc_url( home_url( '/about/' ) ); ?>" class="text-[#D9DBD4] no-underline hover:text-clover"><?php esc_html_e( 'About the ICF', 'terroir' ); ?></a></li>
            <li><a href="<?php echo esc_url( home_url( '/faq/' ) ); ?>" class="text-[#D9DBD4] no-underline hover:text-clover"><?php esc_html_e( 'FAQ', 'terroir' ); ?></a></li>
            <li><a href="<?php echo esc_url( home_url( '/contact/' ) ); ?>" class="text-[#D9DBD4] no-underline hover:text-clover"><?php esc_html_e( 'Contact', 'terroir' ); ?></a></li>
          </ul>
        </div>
        <div>
          <h2 class="font-display mb-2 text-xs font-bold uppercase tracking-[.14em] text-[#8E948C]"><?php esc_html_e( 'Programs', 'terroir' ); ?></h2>
          <ul class="space-y-1.5">
            <li><a href="<?php echo esc_url( home_url( '/learn/' ) ); ?>" class="text-[#D9DBD4] no-underline hover:text-clover"><?php esc_html_e( 'Learn', 'terroir' ); ?></a></li>
            <li><a href="<?php echo esc_url( home_url( '/compete/' ) ); ?>" class="text-[#D9DBD4] no-underline hover:text-clover"><?php esc_html_e( 'Compete', 'terroir' ); ?></a></li>
            <li><a href="<?php echo esc_url( home_url( '/events/' ) ); ?>" class="text-[#D9DBD4] no-underline hover:text-clover"><?php esc_html_e( 'Events', 'terroir' ); ?></a></li>
            <li><a href="<?php echo esc_url( home_url( '/advocacy/' ) ); ?>" class="text-[#D9DBD4] no-underline hover:text-clover"><?php esc_html_e( 'Advocacy', 'terroir' ); ?></a></li>
          </ul>
        </div>
        <div>
          <h2 class="font-display mb-2 text-xs font-bold uppercase tracking-[.14em] text-[#8E948C]"><?php esc_html_e( 'Resources', 'terroir' ); ?></h2>
          <ul class="space-y-1.5">
            <li><a href="<?php echo esc_url( home_url( '/library/' ) ); ?>" class="text-[#D9DBD4] no-underline hover:text-clover"><?php esc_html_e( 'Cheese Library', 'terroir' ); ?></a></li>
            <li><a href="<?php echo esc_url( home_url( '/research/' ) ); ?>" class="text-[#D9DBD4] no-underline hover:text-clover"><?php esc_html_e( 'Research &amp; publications', 'terroir' ); ?></a></li>
            <li><a href="<?php echo esc_url( home_url( '/careers/' ) ); ?>" class="text-[#D9DBD4] no-underline hover:text-clover"><?php esc_html_e( 'Careers &amp; volunteering', 'terroir' ); ?></a></li>
          </ul>
        </div>
        <div>
          <h2 class="font-display mb-2 text-xs font-bold uppercase tracking-[.14em] text-[#8E948C]"><?php esc_html_e( 'Read', 'terroir' ); ?></h2>
          <ul class="space-y-1.5">
            <li><a href="<?php echo esc_url( home_url( '/blog/' ) ); ?>" class="text-[#D9DBD4] no-underline hover:text-clover"><?php esc_html_e( 'Blog', 'terroir' ); ?></a></li>
            <li><a href="<?php echo esc_url( home_url( '/faq/' ) ); ?>" class="text-[#D9DBD4] no-underline hover:text-clover"><?php esc_html_e( 'FAQ', 'terroir' ); ?></a></li>
          </ul>
        </div>
      </nav>
    </div>
    <p class="mt-10 border-t border-white/15 pt-6 text-xs leading-relaxed text-[#A7ADA6]">The International Cheese Federation (ICF) and More Cheese are entirely fictional. This site is demonstration content created for MemberJunction. All people, organizations, events, courses, certifications, figures, and quotations are invented.</p>
    <p class="mt-3 text-xs text-[#8E948C]">&copy; <span class="js-year"><?php echo esc_html( gmdate( 'Y' ) ); ?></span> <?php esc_html_e( 'International Cheese Federation (fictional).', 'terroir' ); ?></p>
  </div>
</footer>

<?php wp_footer(); ?>
</body>
</html>
