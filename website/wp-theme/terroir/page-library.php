<?php
/**
 * Template for the "library" page (/library/).
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

  <section class="border-b border-charcoal/15 bg-clover">
    <div class="mx-auto grid max-w-6xl grid-cols-1 gap-8 px-5 py-12 md:px-10 md:py-14 nav:grid-cols-[1.3fr_1fr] nav:items-center">
      <div>
        <p class="text-xs font-bold uppercase tracking-[.14em] text-pasture">Reference</p>
        <h1 class="font-display font-display-tight m-0 mb-4 mt-2 max-w-[16ch] text-[clamp(38px,5.4vw,68px)] font-extrabold leading-[0.94] tracking-tight text-pasture">The Cheese Library.</h1>
        <p class="m-0 max-w-[56ch] text-[17px] text-[#243027]">Eight families, 25 reference styles, and the one question a monger is actually asked: what is this, and how do I know it is right? Filter by family, milk or texture, or search the lot.</p>
        <p class="m-0 mt-4 max-w-[56ch] text-[15px] text-[#243027]">Styles, not products. We describe families and generic producing regions rather than named cheeses, because the same style is made in a dozen places and the standards committee grades the make, not the postcode.</p>
      </div>
      <div class="mx-auto w-full max-w-[320px]">
        <svg viewBox="0 0 320 320" class="block h-full w-full" role="img" aria-label="Eight wedges arranged in a circle, one for each cheese family, shaded from soft to hard">
          <circle cx="160" cy="160" r="150" fill="#FCFBF7" stroke="#145C3D" stroke-width="3"/>
          <g stroke="#145C3D" stroke-width="2">
            <path d="M160 160 L160 10 A150 150 0 0 1 266 54 Z" fill="#FCFBF7"/>
            <path d="M160 160 L266 54 A150 150 0 0 1 310 160 Z" fill="#EDF5E0"/>
            <path d="M160 160 L310 160 A150 150 0 0 1 266 266 Z" fill="#DCEDC4"/>
            <path d="M160 160 L266 266 A150 150 0 0 1 160 310 Z" fill="#C8E3A0"/>
            <path d="M160 160 L160 310 A150 150 0 0 1 54 266 Z" fill="#A9CE7C"/>
            <path d="M160 160 L54 266 A150 150 0 0 1 10 160 Z" fill="#7FB55B"/>
            <path d="M160 160 L10 160 A150 150 0 0 1 54 54 Z" fill="#4E8B44"/>
            <path d="M160 160 L54 54 A150 150 0 0 1 160 10 Z" fill="#145C3D"/>
          </g>
          <circle cx="160" cy="160" r="34" fill="#A23C2C"/>
          <text x="160" y="166" text-anchor="middle" font-family="Public Sans, system-ui, sans-serif" font-size="13" font-weight="700" fill="#FCFBF7">25</text>
        </svg>
        <p class="m-0 mt-2 text-center text-[11px] font-semibold uppercase tracking-[.14em] text-pasture">Fresh &rarr; bloomy &rarr; washed &rarr; blue &rarr; semi-hard &rarr; alpine &rarr; filata &rarr; natural</p>
      </div>
    </div>
  </section>

  <section class="mx-auto max-w-6xl px-5 py-10 md:px-10" aria-labelledby="browse-h">
    <h2 id="browse-h" class="font-display m-0 mb-5 text-[34px] font-extrabold tracking-tight">Browse the styles</h2>

    <form id="lib-filters" data-inert class="rounded-2xl border-[1.5px] border-charcoal bg-milk p-5" role="search" aria-labelledby="browse-h">
      <div class="grid grid-cols-1 gap-4 md:grid-cols-2 nav:grid-cols-4">
        <div>
          <label for="lib-search" class="font-display mb-1 block text-sm font-bold">Search</label>
          <input id="lib-search" type="search" autocomplete="off" placeholder="rind, brine, crystals&hellip;"
                 class="w-full rounded-xl border-[1.5px] border-charcoal bg-milk px-4 py-2.5 text-[15px]">
        </div>
        <div>
          <label for="lib-family" class="font-display mb-1 block text-sm font-bold">Family</label>
          <select id="lib-family" class="w-full rounded-xl border-[1.5px] border-charcoal bg-milk px-4 py-2.5 text-[15px]">
            <option value="">All families</option>
            <option value="fresh">Fresh</option>
            <option value="bloomy">Bloomy-rind</option>
            <option value="washed">Washed-rind</option>
            <option value="blue">Blue</option>
            <option value="semi-hard">Semi-hard</option>
            <option value="alpine">Hard / alpine</option>
            <option value="pasta-filata">Pasta filata</option>
            <option value="natural">Natural-rind</option>
          </select>
        </div>
        <div>
          <label for="lib-milk" class="font-display mb-1 block text-sm font-bold">Milk</label>
          <select id="lib-milk" class="w-full rounded-xl border-[1.5px] border-charcoal bg-milk px-4 py-2.5 text-[15px]">
            <option value="">Any milk</option>
            <option value="cow">Cow</option>
            <option value="goat">Goat</option>
            <option value="sheep">Sheep</option>
            <option value="buffalo">Buffalo</option>
            <option value="mixed">Mixed herd</option>
          </select>
        </div>
        <div>
          <label for="lib-texture" class="font-display mb-1 block text-sm font-bold">Texture</label>
          <select id="lib-texture" class="w-full rounded-xl border-[1.5px] border-charcoal bg-milk px-4 py-2.5 text-[15px]">
            <option value="">Any texture</option>
            <option value="soft">Soft</option>
            <option value="semi-soft">Semi-soft</option>
            <option value="semi-hard">Semi-hard</option>
            <option value="hard">Hard</option>
            <option value="crumbly">Crumbly</option>
            <option value="elastic">Elastic</option>
          </select>
        </div>
      </div>
      <div class="mt-4 flex flex-wrap items-center justify-between gap-3">
        <p id="lib-count" class="m-0 text-sm font-semibold text-mid" role="status" aria-live="polite">Showing all 25 styles.</p>
        <button id="lib-reset" type="button" class="rounded-full border-[1.5px] border-charcoal px-5 py-2 text-sm font-semibold hover:bg-charcoal hover:text-milk">Clear filters</button>
      </div>
      <noscript>
        <p class="m-0 mt-3 rounded-xl border-[1.5px] border-brick px-4 py-2 text-sm text-brick">Filtering needs JavaScript. All 25 styles are listed below in family order.</p>
      </noscript>
    </form>

    <div id="lib-grid" class="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 nav:grid-cols-3">
      <article class="js-lib-item flex flex-col rounded-2xl border-[1.5px] border-charcoal bg-milk p-5" data-family="fresh" data-milk="cow" data-texture="soft" data-search="lactic curd fresh fresh cow soft lowland dairy valleys set slowly with very little rennet, drained in cloth and salted lightly. tastes of the milk it was made from and almost nothing else. clean acidity with no bitterness at the back. a weeping, slumped tub means it was drained hot. 0-7 days">
        <p class="m-0 text-[11px] font-bold uppercase tracking-[.14em] text-brick">Fresh</p>
        <h3 class="font-display m-0 mt-1 text-[22px] font-bold leading-tight tracking-tight">Lactic curd fresh</h3>
        <dl class="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 border-y border-charcoal/20 py-3 text-[13px]">
          <div><dt class="font-bold uppercase tracking-[.1em] text-mid">Milk</dt><dd class="m-0 mt-0.5">Cow</dd></div>
          <div><dt class="font-bold uppercase tracking-[.1em] text-mid">Ageing</dt><dd class="m-0 mt-0.5">0-7 days</dd></div>
          <div><dt class="font-bold uppercase tracking-[.1em] text-mid">Texture</dt><dd class="m-0 mt-0.5">Soft</dd></div>
          <div><dt class="font-bold uppercase tracking-[.1em] text-mid">Region</dt><dd class="m-0 mt-0.5">Lowland dairy valleys</dd></div>
        </dl>
        <p class="m-0 mt-3 flex-1 text-[14px] text-[#3A403C]">Set slowly with very little rennet, drained in cloth and salted lightly. Tastes of the milk it was made from and almost nothing else.</p>
        <p class="m-0 mt-3 rounded-xl bg-clover/50 px-3 py-2 text-[13px] text-[#243027]"><b class="font-display">What to look for.</b> Clean acidity with no bitterness at the back. A weeping, slumped tub means it was drained hot.</p>
      </article>
      <article class="js-lib-item flex flex-col rounded-2xl border-[1.5px] border-charcoal bg-milk p-5" data-family="fresh" data-milk="goat" data-texture="soft" data-search="drained goat log fresh goat soft dry limestone uplands a hand-ladled log, sometimes rolled in ash, that firms and sharpens across a fortnight. sold at three ages by shops that know their customers. a fine wrinkle starting at the ends. slick, wet skin means it sat in its own moisture. 3-14 days">
        <p class="m-0 text-[11px] font-bold uppercase tracking-[.14em] text-brick">Fresh</p>
        <h3 class="font-display m-0 mt-1 text-[22px] font-bold leading-tight tracking-tight">Drained goat log</h3>
        <dl class="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 border-y border-charcoal/20 py-3 text-[13px]">
          <div><dt class="font-bold uppercase tracking-[.1em] text-mid">Milk</dt><dd class="m-0 mt-0.5">Goat</dd></div>
          <div><dt class="font-bold uppercase tracking-[.1em] text-mid">Ageing</dt><dd class="m-0 mt-0.5">3-14 days</dd></div>
          <div><dt class="font-bold uppercase tracking-[.1em] text-mid">Texture</dt><dd class="m-0 mt-0.5">Soft</dd></div>
          <div><dt class="font-bold uppercase tracking-[.1em] text-mid">Region</dt><dd class="m-0 mt-0.5">Dry limestone uplands</dd></div>
        </dl>
        <p class="m-0 mt-3 flex-1 text-[14px] text-[#3A403C]">A hand-ladled log, sometimes rolled in ash, that firms and sharpens across a fortnight. Sold at three ages by shops that know their customers.</p>
        <p class="m-0 mt-3 rounded-xl bg-clover/50 px-3 py-2 text-[13px] text-[#243027]"><b class="font-display">What to look for.</b> A fine wrinkle starting at the ends. Slick, wet skin means it sat in its own moisture.</p>
      </article>
      <article class="js-lib-item flex flex-col rounded-2xl border-[1.5px] border-charcoal bg-milk p-5" data-family="fresh" data-milk="mixed" data-texture="soft" data-search="whey ricotta-style fresh mixed herd soft mediterranean coastal plains recooked from the whey of a harder make, so it exists because something else was made first. sweet, grainy and very perishable. loose grain that holds its shape on a spoon. rubbery means it was cooked too hard. 1-3 days">
        <p class="m-0 text-[11px] font-bold uppercase tracking-[.14em] text-brick">Fresh</p>
        <h3 class="font-display m-0 mt-1 text-[22px] font-bold leading-tight tracking-tight">Whey ricotta-style</h3>
        <dl class="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 border-y border-charcoal/20 py-3 text-[13px]">
          <div><dt class="font-bold uppercase tracking-[.1em] text-mid">Milk</dt><dd class="m-0 mt-0.5">Mixed herd</dd></div>
          <div><dt class="font-bold uppercase tracking-[.1em] text-mid">Ageing</dt><dd class="m-0 mt-0.5">1-3 days</dd></div>
          <div><dt class="font-bold uppercase tracking-[.1em] text-mid">Texture</dt><dd class="m-0 mt-0.5">Soft</dd></div>
          <div><dt class="font-bold uppercase tracking-[.1em] text-mid">Region</dt><dd class="m-0 mt-0.5">Mediterranean coastal plains</dd></div>
        </dl>
        <p class="m-0 mt-3 flex-1 text-[14px] text-[#3A403C]">Recooked from the whey of a harder make, so it exists because something else was made first. Sweet, grainy and very perishable.</p>
        <p class="m-0 mt-3 rounded-xl bg-clover/50 px-3 py-2 text-[13px] text-[#243027]"><b class="font-display">What to look for.</b> Loose grain that holds its shape on a spoon. Rubbery means it was cooked too hard.</p>
      </article>
      <article class="js-lib-item flex flex-col rounded-2xl border-[1.5px] border-charcoal bg-milk p-5" data-family="bloomy" data-milk="cow" data-texture="soft" data-search="bloomy disc bloomy-rind cow soft temperate river plains the classic white-coated disc: mould ripens it from the outside in, so a young one has a chalky line down the middle and an old one has none. an even, close coat with no grey. ammonia on the nose means it is past, not ripe. 3-6 weeks">
        <p class="m-0 text-[11px] font-bold uppercase tracking-[.14em] text-brick">Bloomy-rind</p>
        <h3 class="font-display m-0 mt-1 text-[22px] font-bold leading-tight tracking-tight">Bloomy disc</h3>
        <dl class="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 border-y border-charcoal/20 py-3 text-[13px]">
          <div><dt class="font-bold uppercase tracking-[.1em] text-mid">Milk</dt><dd class="m-0 mt-0.5">Cow</dd></div>
          <div><dt class="font-bold uppercase tracking-[.1em] text-mid">Ageing</dt><dd class="m-0 mt-0.5">3-6 weeks</dd></div>
          <div><dt class="font-bold uppercase tracking-[.1em] text-mid">Texture</dt><dd class="m-0 mt-0.5">Soft</dd></div>
          <div><dt class="font-bold uppercase tracking-[.1em] text-mid">Region</dt><dd class="m-0 mt-0.5">Temperate river plains</dd></div>
        </dl>
        <p class="m-0 mt-3 flex-1 text-[14px] text-[#3A403C]">The classic white-coated disc: mould ripens it from the outside in, so a young one has a chalky line down the middle and an old one has none.</p>
        <p class="m-0 mt-3 rounded-xl bg-clover/50 px-3 py-2 text-[13px] text-[#243027]"><b class="font-display">What to look for.</b> An even, close coat with no grey. Ammonia on the nose means it is past, not ripe.</p>
      </article>
      <article class="js-lib-item flex flex-col rounded-2xl border-[1.5px] border-charcoal bg-milk p-5" data-family="bloomy" data-milk="cow" data-texture="soft" data-search="triple-cream round bloomy-rind cow soft rich pasture lowlands cream added back to the milk before setting. rich enough that most people eat a third of what they intended to. a paste that slumps but does not run. a sunken top means the rind collapsed early. 4-8 weeks">
        <p class="m-0 text-[11px] font-bold uppercase tracking-[.14em] text-brick">Bloomy-rind</p>
        <h3 class="font-display m-0 mt-1 text-[22px] font-bold leading-tight tracking-tight">Triple-cream round</h3>
        <dl class="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 border-y border-charcoal/20 py-3 text-[13px]">
          <div><dt class="font-bold uppercase tracking-[.1em] text-mid">Milk</dt><dd class="m-0 mt-0.5">Cow</dd></div>
          <div><dt class="font-bold uppercase tracking-[.1em] text-mid">Ageing</dt><dd class="m-0 mt-0.5">4-8 weeks</dd></div>
          <div><dt class="font-bold uppercase tracking-[.1em] text-mid">Texture</dt><dd class="m-0 mt-0.5">Soft</dd></div>
          <div><dt class="font-bold uppercase tracking-[.1em] text-mid">Region</dt><dd class="m-0 mt-0.5">Rich pasture lowlands</dd></div>
        </dl>
        <p class="m-0 mt-3 flex-1 text-[14px] text-[#3A403C]">Cream added back to the milk before setting. Rich enough that most people eat a third of what they intended to.</p>
        <p class="m-0 mt-3 rounded-xl bg-clover/50 px-3 py-2 text-[13px] text-[#243027]"><b class="font-display">What to look for.</b> A paste that slumps but does not run. A sunken top means the rind collapsed early.</p>
      </article>
      <article class="js-lib-item flex flex-col rounded-2xl border-[1.5px] border-charcoal bg-milk p-5" data-family="bloomy" data-milk="goat" data-texture="soft" data-search="ash-lined goat pyramid bloomy-rind goat soft dry limestone uplands a truncated pyramid dusted with ash before the mould takes, which slows the rind and lets the paste catch up. grey-blue bloom over the ash, even on the corners. cracked corners mean it dried unevenly. 2-5 weeks">
        <p class="m-0 text-[11px] font-bold uppercase tracking-[.14em] text-brick">Bloomy-rind</p>
        <h3 class="font-display m-0 mt-1 text-[22px] font-bold leading-tight tracking-tight">Ash-lined goat pyramid</h3>
        <dl class="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 border-y border-charcoal/20 py-3 text-[13px]">
          <div><dt class="font-bold uppercase tracking-[.1em] text-mid">Milk</dt><dd class="m-0 mt-0.5">Goat</dd></div>
          <div><dt class="font-bold uppercase tracking-[.1em] text-mid">Ageing</dt><dd class="m-0 mt-0.5">2-5 weeks</dd></div>
          <div><dt class="font-bold uppercase tracking-[.1em] text-mid">Texture</dt><dd class="m-0 mt-0.5">Soft</dd></div>
          <div><dt class="font-bold uppercase tracking-[.1em] text-mid">Region</dt><dd class="m-0 mt-0.5">Dry limestone uplands</dd></div>
        </dl>
        <p class="m-0 mt-3 flex-1 text-[14px] text-[#3A403C]">A truncated pyramid dusted with ash before the mould takes, which slows the rind and lets the paste catch up.</p>
        <p class="m-0 mt-3 rounded-xl bg-clover/50 px-3 py-2 text-[13px] text-[#243027]"><b class="font-display">What to look for.</b> Grey-blue bloom over the ash, even on the corners. Cracked corners mean it dried unevenly.</p>
      </article>
      <article class="js-lib-item flex flex-col rounded-2xl border-[1.5px] border-charcoal bg-milk p-5" data-family="washed" data-milk="cow" data-texture="semi-soft" data-search="washed-rind square washed-rind cow semi-soft northern monastic valleys washed two or three times a week until the rind turns orange and tacky. smells far more assertive than it tastes. a supple, slightly sticky rind. a dry, cracked rind means the washing stopped early. 6-10 weeks">
        <p class="m-0 text-[11px] font-bold uppercase tracking-[.14em] text-brick">Washed-rind</p>
        <h3 class="font-display m-0 mt-1 text-[22px] font-bold leading-tight tracking-tight">Washed-rind square</h3>
        <dl class="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 border-y border-charcoal/20 py-3 text-[13px]">
          <div><dt class="font-bold uppercase tracking-[.1em] text-mid">Milk</dt><dd class="m-0 mt-0.5">Cow</dd></div>
          <div><dt class="font-bold uppercase tracking-[.1em] text-mid">Ageing</dt><dd class="m-0 mt-0.5">6-10 weeks</dd></div>
          <div><dt class="font-bold uppercase tracking-[.1em] text-mid">Texture</dt><dd class="m-0 mt-0.5">Semi-soft</dd></div>
          <div><dt class="font-bold uppercase tracking-[.1em] text-mid">Region</dt><dd class="m-0 mt-0.5">Northern monastic valleys</dd></div>
        </dl>
        <p class="m-0 mt-3 flex-1 text-[14px] text-[#3A403C]">Washed two or three times a week until the rind turns orange and tacky. Smells far more assertive than it tastes.</p>
        <p class="m-0 mt-3 rounded-xl bg-clover/50 px-3 py-2 text-[13px] text-[#243027]"><b class="font-display">What to look for.</b> A supple, slightly sticky rind. A dry, cracked rind means the washing stopped early.</p>
      </article>
      <article class="js-lib-item flex flex-col rounded-2xl border-[1.5px] border-charcoal bg-milk p-5" data-family="washed" data-milk="cow" data-texture="semi-soft" data-search="brine-washed wheel washed-rind cow semi-soft cool maritime hills a larger washed format that holds its shape for months. the paste goes translucent at the edge as it ages. even colour under the rind. a dark band more than a few millimetres deep means it was held too warm. 3-6 months">
        <p class="m-0 text-[11px] font-bold uppercase tracking-[.14em] text-brick">Washed-rind</p>
        <h3 class="font-display m-0 mt-1 text-[22px] font-bold leading-tight tracking-tight">Brine-washed wheel</h3>
        <dl class="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 border-y border-charcoal/20 py-3 text-[13px]">
          <div><dt class="font-bold uppercase tracking-[.1em] text-mid">Milk</dt><dd class="m-0 mt-0.5">Cow</dd></div>
          <div><dt class="font-bold uppercase tracking-[.1em] text-mid">Ageing</dt><dd class="m-0 mt-0.5">3-6 months</dd></div>
          <div><dt class="font-bold uppercase tracking-[.1em] text-mid">Texture</dt><dd class="m-0 mt-0.5">Semi-soft</dd></div>
          <div><dt class="font-bold uppercase tracking-[.1em] text-mid">Region</dt><dd class="m-0 mt-0.5">Cool maritime hills</dd></div>
        </dl>
        <p class="m-0 mt-3 flex-1 text-[14px] text-[#3A403C]">A larger washed format that holds its shape for months. The paste goes translucent at the edge as it ages.</p>
        <p class="m-0 mt-3 rounded-xl bg-clover/50 px-3 py-2 text-[13px] text-[#243027]"><b class="font-display">What to look for.</b> Even colour under the rind. A dark band more than a few millimetres deep means it was held too warm.</p>
      </article>
      <article class="js-lib-item flex flex-col rounded-2xl border-[1.5px] border-charcoal bg-milk p-5" data-family="washed" data-milk="sheep" data-texture="semi-soft" data-search="washed-rind sheep tomme washed-rind sheep semi-soft southern mountain foothills sheep milk under a washed rind: fattier paste, so the wash reads as savoury rather than barnyard. a close, fine paste with no mechanical openings. pinholes mean gas where none should be. 8-16 weeks">
        <p class="m-0 text-[11px] font-bold uppercase tracking-[.14em] text-brick">Washed-rind</p>
        <h3 class="font-display m-0 mt-1 text-[22px] font-bold leading-tight tracking-tight">Washed-rind sheep tomme</h3>
        <dl class="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 border-y border-charcoal/20 py-3 text-[13px]">
          <div><dt class="font-bold uppercase tracking-[.1em] text-mid">Milk</dt><dd class="m-0 mt-0.5">Sheep</dd></div>
          <div><dt class="font-bold uppercase tracking-[.1em] text-mid">Ageing</dt><dd class="m-0 mt-0.5">8-16 weeks</dd></div>
          <div><dt class="font-bold uppercase tracking-[.1em] text-mid">Texture</dt><dd class="m-0 mt-0.5">Semi-soft</dd></div>
          <div><dt class="font-bold uppercase tracking-[.1em] text-mid">Region</dt><dd class="m-0 mt-0.5">Southern mountain foothills</dd></div>
        </dl>
        <p class="m-0 mt-3 flex-1 text-[14px] text-[#3A403C]">Sheep milk under a washed rind: fattier paste, so the wash reads as savoury rather than barnyard.</p>
        <p class="m-0 mt-3 rounded-xl bg-clover/50 px-3 py-2 text-[13px] text-[#243027]"><b class="font-display">What to look for.</b> A close, fine paste with no mechanical openings. Pinholes mean gas where none should be.</p>
      </article>
      <article class="js-lib-item flex flex-col rounded-2xl border-[1.5px] border-charcoal bg-milk p-5" data-family="blue" data-milk="cow" data-texture="crumbly" data-search="natural-rind blue blue cow crumbly cave-rich limestone country pierced twice to let air to the mould, then left to grow its own rind. the blue runs in seams rather than spots. veining that follows the piercing lines. grey-brown mush at the veins means it over-ripened. 3-6 months">
        <p class="m-0 text-[11px] font-bold uppercase tracking-[.14em] text-brick">Blue</p>
        <h3 class="font-display m-0 mt-1 text-[22px] font-bold leading-tight tracking-tight">Natural-rind blue</h3>
        <dl class="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 border-y border-charcoal/20 py-3 text-[13px]">
          <div><dt class="font-bold uppercase tracking-[.1em] text-mid">Milk</dt><dd class="m-0 mt-0.5">Cow</dd></div>
          <div><dt class="font-bold uppercase tracking-[.1em] text-mid">Ageing</dt><dd class="m-0 mt-0.5">3-6 months</dd></div>
          <div><dt class="font-bold uppercase tracking-[.1em] text-mid">Texture</dt><dd class="m-0 mt-0.5">Crumbly</dd></div>
          <div><dt class="font-bold uppercase tracking-[.1em] text-mid">Region</dt><dd class="m-0 mt-0.5">Cave-rich limestone country</dd></div>
        </dl>
        <p class="m-0 mt-3 flex-1 text-[14px] text-[#3A403C]">Pierced twice to let air to the mould, then left to grow its own rind. The blue runs in seams rather than spots.</p>
        <p class="m-0 mt-3 rounded-xl bg-clover/50 px-3 py-2 text-[13px] text-[#243027]"><b class="font-display">What to look for.</b> Veining that follows the piercing lines. Grey-brown mush at the veins means it over-ripened.</p>
      </article>
      <article class="js-lib-item flex flex-col rounded-2xl border-[1.5px] border-charcoal bg-milk p-5" data-family="blue" data-milk="sheep" data-texture="crumbly" data-search="sheep's-milk blue blue sheep crumbly southern high plateaux higher fat and higher salt than a cow blue, which is why it reads sweet before it reads sharp. white paste, not yellow, with a clean salt finish. bitterness usually means young milk and old salt. 4-8 months">
        <p class="m-0 text-[11px] font-bold uppercase tracking-[.14em] text-brick">Blue</p>
        <h3 class="font-display m-0 mt-1 text-[22px] font-bold leading-tight tracking-tight">Sheep's-milk blue</h3>
        <dl class="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 border-y border-charcoal/20 py-3 text-[13px]">
          <div><dt class="font-bold uppercase tracking-[.1em] text-mid">Milk</dt><dd class="m-0 mt-0.5">Sheep</dd></div>
          <div><dt class="font-bold uppercase tracking-[.1em] text-mid">Ageing</dt><dd class="m-0 mt-0.5">4-8 months</dd></div>
          <div><dt class="font-bold uppercase tracking-[.1em] text-mid">Texture</dt><dd class="m-0 mt-0.5">Crumbly</dd></div>
          <div><dt class="font-bold uppercase tracking-[.1em] text-mid">Region</dt><dd class="m-0 mt-0.5">Southern high plateaux</dd></div>
        </dl>
        <p class="m-0 mt-3 flex-1 text-[14px] text-[#3A403C]">Higher fat and higher salt than a cow blue, which is why it reads sweet before it reads sharp.</p>
        <p class="m-0 mt-3 rounded-xl bg-clover/50 px-3 py-2 text-[13px] text-[#243027]"><b class="font-display">What to look for.</b> White paste, not yellow, with a clean salt finish. Bitterness usually means young milk and old salt.</p>
      </article>
      <article class="js-lib-item flex flex-col rounded-2xl border-[1.5px] border-charcoal bg-milk p-5" data-family="blue" data-milk="cow" data-texture="soft" data-search="creamy blue log blue cow soft lowland dairy valleys a soft blue made in a small format so it ripens fast. spreadable at the edge by six weeks. a soft edge and a firmer centre. uniformly runny means it has gone. 8-12 weeks">
        <p class="m-0 text-[11px] font-bold uppercase tracking-[.14em] text-brick">Blue</p>
        <h3 class="font-display m-0 mt-1 text-[22px] font-bold leading-tight tracking-tight">Creamy blue log</h3>
        <dl class="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 border-y border-charcoal/20 py-3 text-[13px]">
          <div><dt class="font-bold uppercase tracking-[.1em] text-mid">Milk</dt><dd class="m-0 mt-0.5">Cow</dd></div>
          <div><dt class="font-bold uppercase tracking-[.1em] text-mid">Ageing</dt><dd class="m-0 mt-0.5">8-12 weeks</dd></div>
          <div><dt class="font-bold uppercase tracking-[.1em] text-mid">Texture</dt><dd class="m-0 mt-0.5">Soft</dd></div>
          <div><dt class="font-bold uppercase tracking-[.1em] text-mid">Region</dt><dd class="m-0 mt-0.5">Lowland dairy valleys</dd></div>
        </dl>
        <p class="m-0 mt-3 flex-1 text-[14px] text-[#3A403C]">A soft blue made in a small format so it ripens fast. Spreadable at the edge by six weeks.</p>
        <p class="m-0 mt-3 rounded-xl bg-clover/50 px-3 py-2 text-[13px] text-[#243027]"><b class="font-display">What to look for.</b> A soft edge and a firmer centre. Uniformly runny means it has gone.</p>
      </article>
      <article class="js-lib-item flex flex-col rounded-2xl border-[1.5px] border-charcoal bg-milk p-5" data-family="semi-hard" data-milk="cow" data-texture="semi-hard" data-search="mountain tomme semi-hard cow semi-hard mid-altitude alpine slopes the everyday wheel of a mountain make: pressed, brined and turned, eaten young by the people who made it. a dry, dusty grey rind and an elastic paste. a greasy rind means it was wrapped too soon. 2-6 months">
        <p class="m-0 text-[11px] font-bold uppercase tracking-[.14em] text-brick">Semi-hard</p>
        <h3 class="font-display m-0 mt-1 text-[22px] font-bold leading-tight tracking-tight">Mountain tomme</h3>
        <dl class="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 border-y border-charcoal/20 py-3 text-[13px]">
          <div><dt class="font-bold uppercase tracking-[.1em] text-mid">Milk</dt><dd class="m-0 mt-0.5">Cow</dd></div>
          <div><dt class="font-bold uppercase tracking-[.1em] text-mid">Ageing</dt><dd class="m-0 mt-0.5">2-6 months</dd></div>
          <div><dt class="font-bold uppercase tracking-[.1em] text-mid">Texture</dt><dd class="m-0 mt-0.5">Semi-hard</dd></div>
          <div><dt class="font-bold uppercase tracking-[.1em] text-mid">Region</dt><dd class="m-0 mt-0.5">Mid-altitude alpine slopes</dd></div>
        </dl>
        <p class="m-0 mt-3 flex-1 text-[14px] text-[#3A403C]">The everyday wheel of a mountain make: pressed, brined and turned, eaten young by the people who made it.</p>
        <p class="m-0 mt-3 rounded-xl bg-clover/50 px-3 py-2 text-[13px] text-[#243027]"><b class="font-display">What to look for.</b> A dry, dusty grey rind and an elastic paste. A greasy rind means it was wrapped too soon.</p>
      </article>
      <article class="js-lib-item flex flex-col rounded-2xl border-[1.5px] border-charcoal bg-milk p-5" data-family="semi-hard" data-milk="cow" data-texture="semi-hard" data-search="farmhouse cloth-bound semi-hard cow semi-hard maritime grass country bound in cloth and larded, so the rind breathes and the paste dries slowly. ages into something brothy rather than sharp. cloth still bonded to the rind. lifting cloth means moisture got underneath. 6-18 months">
        <p class="m-0 text-[11px] font-bold uppercase tracking-[.14em] text-brick">Semi-hard</p>
        <h3 class="font-display m-0 mt-1 text-[22px] font-bold leading-tight tracking-tight">Farmhouse cloth-bound</h3>
        <dl class="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 border-y border-charcoal/20 py-3 text-[13px]">
          <div><dt class="font-bold uppercase tracking-[.1em] text-mid">Milk</dt><dd class="m-0 mt-0.5">Cow</dd></div>
          <div><dt class="font-bold uppercase tracking-[.1em] text-mid">Ageing</dt><dd class="m-0 mt-0.5">6-18 months</dd></div>
          <div><dt class="font-bold uppercase tracking-[.1em] text-mid">Texture</dt><dd class="m-0 mt-0.5">Semi-hard</dd></div>
          <div><dt class="font-bold uppercase tracking-[.1em] text-mid">Region</dt><dd class="m-0 mt-0.5">Maritime grass country</dd></div>
        </dl>
        <p class="m-0 mt-3 flex-1 text-[14px] text-[#3A403C]">Bound in cloth and larded, so the rind breathes and the paste dries slowly. Ages into something brothy rather than sharp.</p>
        <p class="m-0 mt-3 rounded-xl bg-clover/50 px-3 py-2 text-[13px] text-[#243027]"><b class="font-display">What to look for.</b> Cloth still bonded to the rind. Lifting cloth means moisture got underneath.</p>
      </article>
      <article class="js-lib-item flex flex-col rounded-2xl border-[1.5px] border-charcoal bg-milk p-5" data-family="semi-hard" data-milk="goat" data-texture="semi-hard" data-search="goat tomme semi-hard goat semi-hard dry limestone uplands a pressed goat wheel, which is rarer than it should be: most goat milk goes to fresh formats because it pays sooner. bright white paste with a firm break. yellowing under the rind means oxidation. 3-8 months">
        <p class="m-0 text-[11px] font-bold uppercase tracking-[.14em] text-brick">Semi-hard</p>
        <h3 class="font-display m-0 mt-1 text-[22px] font-bold leading-tight tracking-tight">Goat tomme</h3>
        <dl class="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 border-y border-charcoal/20 py-3 text-[13px]">
          <div><dt class="font-bold uppercase tracking-[.1em] text-mid">Milk</dt><dd class="m-0 mt-0.5">Goat</dd></div>
          <div><dt class="font-bold uppercase tracking-[.1em] text-mid">Ageing</dt><dd class="m-0 mt-0.5">3-8 months</dd></div>
          <div><dt class="font-bold uppercase tracking-[.1em] text-mid">Texture</dt><dd class="m-0 mt-0.5">Semi-hard</dd></div>
          <div><dt class="font-bold uppercase tracking-[.1em] text-mid">Region</dt><dd class="m-0 mt-0.5">Dry limestone uplands</dd></div>
        </dl>
        <p class="m-0 mt-3 flex-1 text-[14px] text-[#3A403C]">A pressed goat wheel, which is rarer than it should be: most goat milk goes to fresh formats because it pays sooner.</p>
        <p class="m-0 mt-3 rounded-xl bg-clover/50 px-3 py-2 text-[13px] text-[#243027]"><b class="font-display">What to look for.</b> Bright white paste with a firm break. Yellowing under the rind means oxidation.</p>
      </article>
      <article class="js-lib-item flex flex-col rounded-2xl border-[1.5px] border-charcoal bg-milk p-5" data-family="semi-hard" data-milk="sheep" data-texture="semi-hard" data-search="brined sheep wheel semi-hard sheep semi-hard eastern steppe pastures held in brine through its ageing rather than salted dry, which keeps the paste close and the flavour direct. firm, close paste with no rind to speak of. crumbling at the edge means the brine was too strong. 3-9 months">
        <p class="m-0 text-[11px] font-bold uppercase tracking-[.14em] text-brick">Semi-hard</p>
        <h3 class="font-display m-0 mt-1 text-[22px] font-bold leading-tight tracking-tight">Brined sheep wheel</h3>
        <dl class="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 border-y border-charcoal/20 py-3 text-[13px]">
          <div><dt class="font-bold uppercase tracking-[.1em] text-mid">Milk</dt><dd class="m-0 mt-0.5">Sheep</dd></div>
          <div><dt class="font-bold uppercase tracking-[.1em] text-mid">Ageing</dt><dd class="m-0 mt-0.5">3-9 months</dd></div>
          <div><dt class="font-bold uppercase tracking-[.1em] text-mid">Texture</dt><dd class="m-0 mt-0.5">Semi-hard</dd></div>
          <div><dt class="font-bold uppercase tracking-[.1em] text-mid">Region</dt><dd class="m-0 mt-0.5">Eastern steppe pastures</dd></div>
        </dl>
        <p class="m-0 mt-3 flex-1 text-[14px] text-[#3A403C]">Held in brine through its ageing rather than salted dry, which keeps the paste close and the flavour direct.</p>
        <p class="m-0 mt-3 rounded-xl bg-clover/50 px-3 py-2 text-[13px] text-[#243027]"><b class="font-display">What to look for.</b> Firm, close paste with no rind to speak of. Crumbling at the edge means the brine was too strong.</p>
      </article>
      <article class="js-lib-item flex flex-col rounded-2xl border-[1.5px] border-charcoal bg-milk p-5" data-family="alpine" data-milk="cow" data-texture="hard" data-search="alpine eye wheel hard / alpine cow hard high alpine valleys cooked curd pressed into a large wheel; a second fermentation opens round eyes as it warms in the cellar. round, shiny eyes and a slight sweetness. splits and cracks mean the eyes opened too fast. 6-14 months">
        <p class="m-0 text-[11px] font-bold uppercase tracking-[.14em] text-brick">Hard / alpine</p>
        <h3 class="font-display m-0 mt-1 text-[22px] font-bold leading-tight tracking-tight">Alpine eye wheel</h3>
        <dl class="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 border-y border-charcoal/20 py-3 text-[13px]">
          <div><dt class="font-bold uppercase tracking-[.1em] text-mid">Milk</dt><dd class="m-0 mt-0.5">Cow</dd></div>
          <div><dt class="font-bold uppercase tracking-[.1em] text-mid">Ageing</dt><dd class="m-0 mt-0.5">6-14 months</dd></div>
          <div><dt class="font-bold uppercase tracking-[.1em] text-mid">Texture</dt><dd class="m-0 mt-0.5">Hard</dd></div>
          <div><dt class="font-bold uppercase tracking-[.1em] text-mid">Region</dt><dd class="m-0 mt-0.5">High alpine valleys</dd></div>
        </dl>
        <p class="m-0 mt-3 flex-1 text-[14px] text-[#3A403C]">Cooked curd pressed into a large wheel; a second fermentation opens round eyes as it warms in the cellar.</p>
        <p class="m-0 mt-3 rounded-xl bg-clover/50 px-3 py-2 text-[13px] text-[#243027]"><b class="font-display">What to look for.</b> Round, shiny eyes and a slight sweetness. Splits and cracks mean the eyes opened too fast.</p>
      </article>
      <article class="js-lib-item flex flex-col rounded-2xl border-[1.5px] border-charcoal bg-milk p-5" data-family="alpine" data-milk="cow" data-texture="hard" data-search="alpine grating wheel hard / alpine cow hard high alpine valleys the long-aged end of the family. dry enough to grate, with the crystals that come of protein breaking down over years. crunch that dissolves, not grit that stays. a soapy finish means it was aged damp. 18-36 months">
        <p class="m-0 text-[11px] font-bold uppercase tracking-[.14em] text-brick">Hard / alpine</p>
        <h3 class="font-display m-0 mt-1 text-[22px] font-bold leading-tight tracking-tight">Alpine grating wheel</h3>
        <dl class="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 border-y border-charcoal/20 py-3 text-[13px]">
          <div><dt class="font-bold uppercase tracking-[.1em] text-mid">Milk</dt><dd class="m-0 mt-0.5">Cow</dd></div>
          <div><dt class="font-bold uppercase tracking-[.1em] text-mid">Ageing</dt><dd class="m-0 mt-0.5">18-36 months</dd></div>
          <div><dt class="font-bold uppercase tracking-[.1em] text-mid">Texture</dt><dd class="m-0 mt-0.5">Hard</dd></div>
          <div><dt class="font-bold uppercase tracking-[.1em] text-mid">Region</dt><dd class="m-0 mt-0.5">High alpine valleys</dd></div>
        </dl>
        <p class="m-0 mt-3 flex-1 text-[14px] text-[#3A403C]">The long-aged end of the family. Dry enough to grate, with the crystals that come of protein breaking down over years.</p>
        <p class="m-0 mt-3 rounded-xl bg-clover/50 px-3 py-2 text-[13px] text-[#243027]"><b class="font-display">What to look for.</b> Crunch that dissolves, not grit that stays. A soapy finish means it was aged damp.</p>
      </article>
      <article class="js-lib-item flex flex-col rounded-2xl border-[1.5px] border-charcoal bg-milk p-5" data-family="alpine" data-milk="sheep" data-texture="hard" data-search="aged sheep grating hard / alpine sheep hard southern high plateaux a hard sheep wheel made to be grated over food rather than eaten in a wedge. salt-forward by design. a clean, even break. ammonia at the rind means it was held too long in plastic. 10-24 months">
        <p class="m-0 text-[11px] font-bold uppercase tracking-[.14em] text-brick">Hard / alpine</p>
        <h3 class="font-display m-0 mt-1 text-[22px] font-bold leading-tight tracking-tight">Aged sheep grating</h3>
        <dl class="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 border-y border-charcoal/20 py-3 text-[13px]">
          <div><dt class="font-bold uppercase tracking-[.1em] text-mid">Milk</dt><dd class="m-0 mt-0.5">Sheep</dd></div>
          <div><dt class="font-bold uppercase tracking-[.1em] text-mid">Ageing</dt><dd class="m-0 mt-0.5">10-24 months</dd></div>
          <div><dt class="font-bold uppercase tracking-[.1em] text-mid">Texture</dt><dd class="m-0 mt-0.5">Hard</dd></div>
          <div><dt class="font-bold uppercase tracking-[.1em] text-mid">Region</dt><dd class="m-0 mt-0.5">Southern high plateaux</dd></div>
        </dl>
        <p class="m-0 mt-3 flex-1 text-[14px] text-[#3A403C]">A hard sheep wheel made to be grated over food rather than eaten in a wedge. Salt-forward by design.</p>
        <p class="m-0 mt-3 rounded-xl bg-clover/50 px-3 py-2 text-[13px] text-[#243027]"><b class="font-display">What to look for.</b> A clean, even break. Ammonia at the rind means it was held too long in plastic.</p>
      </article>
      <article class="js-lib-item flex flex-col rounded-2xl border-[1.5px] border-charcoal bg-milk p-5" data-family="pasta-filata" data-milk="buffalo" data-texture="elastic" data-search="fresh stretched curd pasta filata buffalo elastic warm coastal wetlands curd ripened to the right acidity, then stretched in hot water and torn into balls. the texture is decided in half a minute. a thin skin that tears to layers, and milky liquid when cut. squeaky and tight means it was stretched too cold. 1-3 days">
        <p class="m-0 text-[11px] font-bold uppercase tracking-[.14em] text-brick">Pasta filata</p>
        <h3 class="font-display m-0 mt-1 text-[22px] font-bold leading-tight tracking-tight">Fresh stretched curd</h3>
        <dl class="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 border-y border-charcoal/20 py-3 text-[13px]">
          <div><dt class="font-bold uppercase tracking-[.1em] text-mid">Milk</dt><dd class="m-0 mt-0.5">Buffalo</dd></div>
          <div><dt class="font-bold uppercase tracking-[.1em] text-mid">Ageing</dt><dd class="m-0 mt-0.5">1-3 days</dd></div>
          <div><dt class="font-bold uppercase tracking-[.1em] text-mid">Texture</dt><dd class="m-0 mt-0.5">Elastic</dd></div>
          <div><dt class="font-bold uppercase tracking-[.1em] text-mid">Region</dt><dd class="m-0 mt-0.5">Warm coastal wetlands</dd></div>
        </dl>
        <p class="m-0 mt-3 flex-1 text-[14px] text-[#3A403C]">Curd ripened to the right acidity, then stretched in hot water and torn into balls. The texture is decided in half a minute.</p>
        <p class="m-0 mt-3 rounded-xl bg-clover/50 px-3 py-2 text-[13px] text-[#243027]"><b class="font-display">What to look for.</b> A thin skin that tears to layers, and milky liquid when cut. Squeaky and tight means it was stretched too cold.</p>
      </article>
      <article class="js-lib-item flex flex-col rounded-2xl border-[1.5px] border-charcoal bg-milk p-5" data-family="pasta-filata" data-milk="cow" data-texture="semi-hard" data-search="aged stretched wheel pasta filata cow semi-hard southern lowland plains the same stretch, then shaped, brined and hung to dry for months. layers stay visible in the paste. visible grain when you break it along the stretch. a rubbery, uniform paste means it was over-worked. 4-12 months">
        <p class="m-0 text-[11px] font-bold uppercase tracking-[.14em] text-brick">Pasta filata</p>
        <h3 class="font-display m-0 mt-1 text-[22px] font-bold leading-tight tracking-tight">Aged stretched wheel</h3>
        <dl class="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 border-y border-charcoal/20 py-3 text-[13px]">
          <div><dt class="font-bold uppercase tracking-[.1em] text-mid">Milk</dt><dd class="m-0 mt-0.5">Cow</dd></div>
          <div><dt class="font-bold uppercase tracking-[.1em] text-mid">Ageing</dt><dd class="m-0 mt-0.5">4-12 months</dd></div>
          <div><dt class="font-bold uppercase tracking-[.1em] text-mid">Texture</dt><dd class="m-0 mt-0.5">Semi-hard</dd></div>
          <div><dt class="font-bold uppercase tracking-[.1em] text-mid">Region</dt><dd class="m-0 mt-0.5">Southern lowland plains</dd></div>
        </dl>
        <p class="m-0 mt-3 flex-1 text-[14px] text-[#3A403C]">The same stretch, then shaped, brined and hung to dry for months. Layers stay visible in the paste.</p>
        <p class="m-0 mt-3 rounded-xl bg-clover/50 px-3 py-2 text-[13px] text-[#243027]"><b class="font-display">What to look for.</b> Visible grain when you break it along the stretch. A rubbery, uniform paste means it was over-worked.</p>
      </article>
      <article class="js-lib-item flex flex-col rounded-2xl border-[1.5px] border-charcoal bg-milk p-5" data-family="pasta-filata" data-milk="cow" data-texture="elastic" data-search="smoked braided curd pasta filata cow elastic southern lowland plains braided while warm and cold-smoked. a format built for a market stall rather than a cellar. smoke on the outside only, in a thin band. smoke all the way through means heat, not time. 1-2 weeks">
        <p class="m-0 text-[11px] font-bold uppercase tracking-[.14em] text-brick">Pasta filata</p>
        <h3 class="font-display m-0 mt-1 text-[22px] font-bold leading-tight tracking-tight">Smoked braided curd</h3>
        <dl class="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 border-y border-charcoal/20 py-3 text-[13px]">
          <div><dt class="font-bold uppercase tracking-[.1em] text-mid">Milk</dt><dd class="m-0 mt-0.5">Cow</dd></div>
          <div><dt class="font-bold uppercase tracking-[.1em] text-mid">Ageing</dt><dd class="m-0 mt-0.5">1-2 weeks</dd></div>
          <div><dt class="font-bold uppercase tracking-[.1em] text-mid">Texture</dt><dd class="m-0 mt-0.5">Elastic</dd></div>
          <div><dt class="font-bold uppercase tracking-[.1em] text-mid">Region</dt><dd class="m-0 mt-0.5">Southern lowland plains</dd></div>
        </dl>
        <p class="m-0 mt-3 flex-1 text-[14px] text-[#3A403C]">Braided while warm and cold-smoked. A format built for a market stall rather than a cellar.</p>
        <p class="m-0 mt-3 rounded-xl bg-clover/50 px-3 py-2 text-[13px] text-[#243027]"><b class="font-display">What to look for.</b> Smoke on the outside only, in a thin band. Smoke all the way through means heat, not time.</p>
      </article>
      <article class="js-lib-item flex flex-col rounded-2xl border-[1.5px] border-charcoal bg-milk p-5" data-family="natural" data-milk="cow" data-texture="crumbly" data-search="cloth-bound territorial natural-rind cow crumbly maritime grass country the long-aged crumbling style: pressed hard, cloth-bound, and left until the paste breaks rather than bends. a break that flakes along a plane. bendy paste at eighteen months means it was pressed light. 9-24 months">
        <p class="m-0 text-[11px] font-bold uppercase tracking-[.14em] text-brick">Natural-rind</p>
        <h3 class="font-display m-0 mt-1 text-[22px] font-bold leading-tight tracking-tight">Cloth-bound territorial</h3>
        <dl class="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 border-y border-charcoal/20 py-3 text-[13px]">
          <div><dt class="font-bold uppercase tracking-[.1em] text-mid">Milk</dt><dd class="m-0 mt-0.5">Cow</dd></div>
          <div><dt class="font-bold uppercase tracking-[.1em] text-mid">Ageing</dt><dd class="m-0 mt-0.5">9-24 months</dd></div>
          <div><dt class="font-bold uppercase tracking-[.1em] text-mid">Texture</dt><dd class="m-0 mt-0.5">Crumbly</dd></div>
          <div><dt class="font-bold uppercase tracking-[.1em] text-mid">Region</dt><dd class="m-0 mt-0.5">Maritime grass country</dd></div>
        </dl>
        <p class="m-0 mt-3 flex-1 text-[14px] text-[#3A403C]">The long-aged crumbling style: pressed hard, cloth-bound, and left until the paste breaks rather than bends.</p>
        <p class="m-0 mt-3 rounded-xl bg-clover/50 px-3 py-2 text-[13px] text-[#243027]"><b class="font-display">What to look for.</b> A break that flakes along a plane. Bendy paste at eighteen months means it was pressed light.</p>
      </article>
      <article class="js-lib-item flex flex-col rounded-2xl border-[1.5px] border-charcoal bg-milk p-5" data-family="natural" data-milk="mixed" data-texture="semi-soft" data-search="leaf-wrapped natural rind natural-rind mixed herd semi-soft wooded upland valleys wrapped in leaves for the cellar, which is a handling decision that became a flavour one. leaves still pliable and bonded. dry, lifting leaves mean the cellar ran dry. 2-5 months">
        <p class="m-0 text-[11px] font-bold uppercase tracking-[.14em] text-brick">Natural-rind</p>
        <h3 class="font-display m-0 mt-1 text-[22px] font-bold leading-tight tracking-tight">Leaf-wrapped natural rind</h3>
        <dl class="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 border-y border-charcoal/20 py-3 text-[13px]">
          <div><dt class="font-bold uppercase tracking-[.1em] text-mid">Milk</dt><dd class="m-0 mt-0.5">Mixed herd</dd></div>
          <div><dt class="font-bold uppercase tracking-[.1em] text-mid">Ageing</dt><dd class="m-0 mt-0.5">2-5 months</dd></div>
          <div><dt class="font-bold uppercase tracking-[.1em] text-mid">Texture</dt><dd class="m-0 mt-0.5">Semi-soft</dd></div>
          <div><dt class="font-bold uppercase tracking-[.1em] text-mid">Region</dt><dd class="m-0 mt-0.5">Wooded upland valleys</dd></div>
        </dl>
        <p class="m-0 mt-3 flex-1 text-[14px] text-[#3A403C]">Wrapped in leaves for the cellar, which is a handling decision that became a flavour one.</p>
        <p class="m-0 mt-3 rounded-xl bg-clover/50 px-3 py-2 text-[13px] text-[#243027]"><b class="font-display">What to look for.</b> Leaves still pliable and bonded. Dry, lifting leaves mean the cellar ran dry.</p>
      </article>
      <article class="js-lib-item flex flex-col rounded-2xl border-[1.5px] border-charcoal bg-milk p-5" data-family="natural" data-milk="mixed" data-texture="semi-hard" data-search="cave-aged natural tomme natural-rind mixed herd semi-hard cave-rich limestone country brushed and turned in a cave, with whatever the cave grows allowed to form the rind. no two batches match. a mottled grey rind with no bald patches. orange slime means it turned into a washed rind by accident. 5-12 months">
        <p class="m-0 text-[11px] font-bold uppercase tracking-[.14em] text-brick">Natural-rind</p>
        <h3 class="font-display m-0 mt-1 text-[22px] font-bold leading-tight tracking-tight">Cave-aged natural tomme</h3>
        <dl class="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 border-y border-charcoal/20 py-3 text-[13px]">
          <div><dt class="font-bold uppercase tracking-[.1em] text-mid">Milk</dt><dd class="m-0 mt-0.5">Mixed herd</dd></div>
          <div><dt class="font-bold uppercase tracking-[.1em] text-mid">Ageing</dt><dd class="m-0 mt-0.5">5-12 months</dd></div>
          <div><dt class="font-bold uppercase tracking-[.1em] text-mid">Texture</dt><dd class="m-0 mt-0.5">Semi-hard</dd></div>
          <div><dt class="font-bold uppercase tracking-[.1em] text-mid">Region</dt><dd class="m-0 mt-0.5">Cave-rich limestone country</dd></div>
        </dl>
        <p class="m-0 mt-3 flex-1 text-[14px] text-[#3A403C]">Brushed and turned in a cave, with whatever the cave grows allowed to form the rind. No two batches match.</p>
        <p class="m-0 mt-3 rounded-xl bg-clover/50 px-3 py-2 text-[13px] text-[#243027]"><b class="font-display">What to look for.</b> A mottled grey rind with no bald patches. Orange slime means it turned into a washed rind by accident.</p>
      </article>
    </div>

    <p id="lib-empty" hidden class="mt-6 rounded-2xl border-[1.5px] border-brick bg-milk p-6 text-center text-[15px] text-brick">
      Nothing in the library matches that. Try clearing one filter, or <a href="<?php echo esc_url( home_url( '/contact/' ) ); ?>" class="underline underline-offset-2">ask the Standards Committee</a> &mdash; the library grows from member questions.
    </p>
  </section>

  <section class="border-y-[1.5px] border-charcoal bg-milk">
    <div class="mx-auto max-w-6xl px-5 py-12 md:px-10" aria-labelledby="fam-h">
      <h2 id="fam-h" class="font-display m-0 mb-2 text-[34px] font-extrabold tracking-tight">The eight families</h2>
      <p class="m-0 mb-6 max-w-[62ch] text-[15px] text-mid">A family is defined by what happens to the outside of the cheese and how much the curd was worked &mdash; not by the animal and not by the country. Two wheels from opposite ends of the world can belong to the same family and behave the same way in a case.</p>
      <div class="grid grid-cols-1 gap-4 md:grid-cols-2 nav:grid-cols-4">
        <div class="rounded-2xl border-[1.5px] border-charcoal p-5">
          <h3 class="font-display m-0 text-lg font-bold tracking-tight">Fresh</h3>
          <p class="m-0 mt-2 text-[14px] text-[#3A403C]">Unripened, eaten within days. Acid or a little rennet sets the curd; nothing lives on the outside.</p>
        </div>
        <div class="rounded-2xl border-[1.5px] border-charcoal p-5">
          <h3 class="font-display m-0 text-lg font-bold tracking-tight">Bloomy-rind</h3>
          <p class="m-0 mt-2 text-[14px] text-[#3A403C]">A white mould coat ripens the paste from the rind inwards, so the edge softens before the centre.</p>
        </div>
        <div class="rounded-2xl border-[1.5px] border-charcoal p-5">
          <h3 class="font-display m-0 text-lg font-bold tracking-tight">Washed-rind</h3>
          <p class="m-0 mt-2 text-[14px] text-[#3A403C]">Brine or a brine-and-culture wash on the outside every few days. Orange, tacky, and louder than it tastes.</p>
        </div>
        <div class="rounded-2xl border-[1.5px] border-charcoal p-5">
          <h3 class="font-display m-0 text-lg font-bold tracking-tight">Blue</h3>
          <p class="m-0 mt-2 text-[14px] text-[#3A403C]">Blue mould introduced to the curd, then air let in by piercing. Salt carries the whole balance.</p>
        </div>
        <div class="rounded-2xl border-[1.5px] border-charcoal p-5">
          <h3 class="font-display m-0 text-lg font-bold tracking-tight">Semi-hard</h3>
          <p class="m-0 mt-2 text-[14px] text-[#3A403C]">Pressed, salted and aged a few months. The broad middle of the trade and the hardest family to sell badly.</p>
        </div>
        <div class="rounded-2xl border-[1.5px] border-charcoal p-5">
          <h3 class="font-display m-0 text-lg font-bold tracking-tight">Hard / alpine</h3>
          <p class="m-0 mt-2 text-[14px] text-[#3A403C]">Cooked curd, heavily pressed, aged long. Made large because it was made to keep a valley through winter.</p>
        </div>
        <div class="rounded-2xl border-[1.5px] border-charcoal p-5">
          <h3 class="font-display m-0 text-lg font-bold tracking-tight">Pasta filata</h3>
          <p class="m-0 mt-2 text-[14px] text-[#3A403C]">Curd heated and stretched until it ropes. Texture is decided in thirty seconds of pulling.</p>
        </div>
        <div class="rounded-2xl border-[1.5px] border-charcoal p-5">
          <h3 class="font-display m-0 text-lg font-bold tracking-tight">Natural-rind</h3>
          <p class="m-0 mt-2 text-[14px] text-[#3A403C]">No wash, no mould coat: the rind is whatever the cave grows on it, brushed and turned.</p>
        </div>
      </div>
    </div>
  </section>

  <section class="mx-auto grid max-w-6xl grid-cols-1 gap-10 px-5 py-12 md:px-10 nav:grid-cols-[1.1fr_1fr]">
    <div>
      <h2 class="font-display m-0 mb-4 text-[28px] font-extrabold tracking-tight">How to use this</h2>
      <p class="m-0 mb-3 text-[15px] text-[#3A403C]">The library was built for three jobs. Behind a counter, it settles an argument about what a customer is holding. In a cave, it gives you the failure modes for a family before you meet them. In a classroom, it is the vocabulary sheet the Cheese Foundations Certificate assumes you already have by week two.</p>
      <p class="m-0 mb-3 text-[15px] text-[#3A403C]">Ageing ranges are the window a style is normally sold in, not a rule. A style with a three-to-six-month range will have members selling at ten weeks and members selling at a year, and both will be right about their own make.</p>
      <p class="m-0 text-[15px] text-[#3A403C]">The &ldquo;what to look for&rdquo; line on every card is the one the Standards Committee uses when it reviews category definitions after judging. If you disagree with one, that is a committee conversation and they would rather have it than not.</p>
    </div>
    <div class="space-y-4">
      <div class="rounded-2xl bg-clover p-6">
        <h3 class="font-display m-0 text-xl font-bold tracking-tight">Learn the families properly</h3>
        <p class="m-0 mt-2 text-[15px] text-[#243027]">The Cheese Foundations Certificate spends its second week on exactly this, with the cheeses in front of you instead of on a screen.</p>
        <a href="<?php echo esc_url( home_url( '/learn/' ) ); ?>" class="mt-4 inline-block rounded-full bg-pasture px-5 py-2.5 text-sm font-bold text-white no-underline hover:bg-[#0E4530]">See the credential ladder</a>
      </div>
      <div class="rounded-2xl border-[1.5px] border-charcoal p-6">
        <h3 class="font-display m-0 text-xl font-bold tracking-tight">Families and competition categories</h3>
        <p class="m-0 mt-2 text-[15px] text-[#3A403C]">The competition judges six categories, which map onto these families but are not identical to them &mdash; a category is a judging decision, a family is a make decision.</p>
        <a href="<?php echo esc_url( home_url( '/compete/' ) ); ?>" class="mt-4 inline-block rounded-full border-[1.5px] border-charcoal px-5 py-2.5 text-sm font-semibold no-underline hover:bg-charcoal hover:text-milk">See the six categories</a>
      </div>
      <div class="rounded-2xl border-[1.5px] border-brick p-6">
        <h3 class="font-display m-0 text-xl font-bold tracking-tight text-brick">Something missing?</h3>
        <p class="m-0 mt-2 text-[15px] text-[#3A403C]">The library is maintained by the Standards Committee and added to when members ask. Tell us what you could not find.</p>
        <a href="<?php echo esc_url( home_url( '/contact/' ) ); ?>" class="mt-4 inline-block rounded-full bg-brick px-5 py-2.5 text-sm font-bold text-white no-underline hover:brightness-110">Suggest a style</a>
      </div>
    </div>
  </section>
</main>

<?php
get_footer();
