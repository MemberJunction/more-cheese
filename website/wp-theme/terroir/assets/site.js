/* More Cheese — shared behaviour. Vanilla JS, no dependencies.
   1. mobile nav toggle (the nav collapses under 900px)
   2. current-page marking in the nav
   3. the hero "Emmental holes" canvas (seeded, so it draws the same field every time)
   4. the footer year
   5. the Cheese Library filter/search bar (library.html)
   6. the in-page question filter on the FAQ pages
   7. suppressing submit on the two deliberately inert forms
   8. the first-visit "this site is fiction" notice (once per browser)
   Every block is defensive: a page without the element simply skips it. */
(function () {
  'use strict';

  /* ---- 1. Mobile nav --------------------------------------------------- */
  function initNav() {
    var btn = document.getElementById('nav-toggle');
    var menu = document.getElementById('nav-menu');
    if (!btn || !menu) return;

    btn.addEventListener('click', function () {
      var open = menu.classList.toggle('is-open');
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
      btn.querySelector('.nav-toggle-label').textContent = open ? 'Close' : 'Menu';
    });

    // Closing on Escape keeps keyboard users from being trapped in the panel.
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && menu.classList.contains('is-open')) {
        menu.classList.remove('is-open');
        btn.setAttribute('aria-expanded', 'false');
        btn.querySelector('.nav-toggle-label').textContent = 'Menu';
        btn.focus();
      }
    });

    // If the window grows past the breakpoint, drop the open state.
    window.addEventListener('resize', function () {
      if (window.innerWidth >= 900 && menu.classList.contains('is-open')) {
        menu.classList.remove('is-open');
        btn.setAttribute('aria-expanded', 'false');
        btn.querySelector('.nav-toggle-label').textContent = 'Menu';
      }
    });
  }

  /* ---- 2. Current page ------------------------------------------------- */
  // Works for both shapes this markup ships in: flat static files
  // (".../website/join.html") and WordPress permalinks (".../join/",
  // ".../faq/membership-dues/"). Both are reduced to a list of path segments
  // with any ".html" and any trailing "index" removed, and a nav link is
  // current when its segments are a leading run of the page's segments --
  // so /blog/ stays marked on /blog/page/2/.
  function initCurrent() {
    function segments(url) {
      var a = document.createElement('a');
      a.href = url;
      var path = a.pathname || '';
      path = path.replace(/\.html$/i, '');
      path = path.replace(/\/index$/i, '/');
      var out = [];
      var parts = path.split('/');
      for (var i = 0; i < parts.length; i++) {
        if (parts[i]) out.push(parts[i]);
      }
      return out;
    }

    function startsWith(haystack, needle) {
      if (!needle.length || needle.length > haystack.length) return false;
      for (var i = 0; i < needle.length; i++) {
        if (haystack[i] !== needle[i]) return false;
      }
      return true;
    }

    var here = segments(window.location.href);
    var links = document.querySelectorAll('#nav-menu a');
    for (var i = 0; i < links.length; i++) {
      var href = links[i].getAttribute('href');
      if (!href) continue;
      if (startsWith(here, segments(links[i].href))) {
        links[i].setAttribute('aria-current', 'page');
      } else {
        links[i].removeAttribute('aria-current');
      }
    }
  }

  /* ---- 3. Hero canvas: the eyes in an Emmental wheel -------------------- */
  function initHoles() {
    var c = document.getElementById('holes');
    if (!c || !c.getContext) return;
    var ctx = c.getContext('2d');

    function draw() {
      var w = c.clientWidth || 600;
      var h = c.clientHeight || 420;
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      c.width = w * dpr;
      c.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      ctx.fillStyle = '#C8E3A0';
      ctx.fillRect(0, 0, w, h);

      // Deterministic LCG: the same panel size always yields the same holes.
      var seed = 7;
      function rnd() { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; }

      var holes = [];
      var tries = 0;
      while (holes.length < 26 && tries < 4000) {
        tries++;
        var r = 8 + rnd() * 34;
        var x = r + rnd() * (w - 2 * r);
        var y = r + rnd() * (h - 2 * r);
        var ok = true;
        for (var i = 0; i < holes.length; i++) {
          var o = holes[i], dx = o.x - x, dy = o.y - y;
          if (Math.sqrt(dx * dx + dy * dy) < o.r + r + 10) { ok = false; break; }
        }
        if (ok) holes.push({ x: x, y: y, r: r });
      }

      holes.forEach(function (o) {
        var g = ctx.createRadialGradient(o.x - o.r * 0.3, o.y - o.r * 0.3, o.r * 0.1, o.x, o.y, o.r);
        g.addColorStop(0, '#145C3D');
        g.addColorStop(1, '#0E4530');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(o.x, o.y, o.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = 'rgba(252,251,247,.55)';
        ctx.beginPath();
        ctx.arc(o.x - o.r * 0.35, o.y - o.r * 0.4, o.r * 0.14, 0, Math.PI * 2);
        ctx.fill();
      });
    }

    var pending = false;
    function onResize() {
      if (pending) return;
      pending = true;
      window.requestAnimationFrame(function () { pending = false; draw(); });
    }

    draw();
    window.addEventListener('resize', onResize);
  }

  /* ---- 4. Footer year -------------------------------------------------- */
  function initYear() {
    var nodes = document.querySelectorAll('.js-year');
    for (var i = 0; i < nodes.length; i++) {
      nodes[i].textContent = String(new Date().getFullYear());
    }
  }

  /* ---- 5. Cheese Library filter ---------------------------------------- */
  // Three selects plus a free-text search over a pre-rendered grid. No data
  // lives in JS: every card carries data-family / data-milk / data-texture and
  // a data-search haystack, so the page is complete and correct without script.
  function initLibrary() {
    var grid = document.getElementById('lib-grid');
    if (!grid) return;

    var q = document.getElementById('lib-search');
    var fam = document.getElementById('lib-family');
    var milk = document.getElementById('lib-milk');
    var tex = document.getElementById('lib-texture');
    var count = document.getElementById('lib-count');
    var empty = document.getElementById('lib-empty');
    var reset = document.getElementById('lib-reset');
    var items = grid.querySelectorAll('.js-lib-item');
    var total = items.length;

    function apply() {
      var term = (q && q.value || '').trim().toLowerCase();
      var f = fam && fam.value || '';
      var m = milk && milk.value || '';
      var t = tex && tex.value || '';
      var shown = 0;

      for (var i = 0; i < items.length; i++) {
        var el = items[i];
        var ok = (!f || el.getAttribute('data-family') === f) &&
                 (!m || el.getAttribute('data-milk') === m) &&
                 (!t || el.getAttribute('data-texture') === t) &&
                 (!term || (el.getAttribute('data-search') || '').indexOf(term) !== -1);
        el.hidden = !ok;
        if (ok) shown++;
      }

      if (empty) empty.hidden = shown !== 0;
      if (count) {
        count.textContent = shown === total
          ? 'Showing all ' + total + ' styles.'
          : 'Showing ' + shown + ' of ' + total + ' styles.';
      }
    }

    if (q) q.addEventListener('input', apply);
    [fam, milk, tex].forEach(function (el) { if (el) el.addEventListener('change', apply); });
    if (reset) {
      reset.addEventListener('click', function () {
        if (q) q.value = '';
        if (fam) fam.value = '';
        if (milk) milk.value = '';
        if (tex) tex.value = '';
        apply();
        if (q) q.focus();
      });
    }
    apply();
  }

  /* ---- 6. FAQ question filter ------------------------------------------ */
  // Filters <details> question blocks in place. Matching questions are opened
  // so the answer is visible; clearing the box closes them again.
  function initFaqFilter() {
    var box = document.getElementById('faq-filter');
    if (!box) return;

    var items = document.querySelectorAll('.js-faq-item');
    var groups = document.querySelectorAll('.js-faq-group');
    var count = document.getElementById('faq-filter-count');
    var empty = document.getElementById('faq-filter-empty');
    var clear = document.getElementById('faq-filter-clear');
    var total = items.length;

    function apply() {
      var term = box.value.trim().toLowerCase();
      var shown = 0;
      var i;

      for (i = 0; i < items.length; i++) {
        var el = items[i];
        var hay = (el.textContent || '').toLowerCase();
        var ok = !term || hay.indexOf(term) !== -1;
        el.hidden = !ok;
        if (ok) {
          shown++;
          if (term) el.open = true;
        } else {
          el.open = false;
        }
      }
      if (!term) {
        for (i = 0; i < items.length; i++) items[i].open = false;
      }

      // A topic heading with nothing left under it is noise, so hide it too.
      for (i = 0; i < groups.length; i++) {
        var g = groups[i];
        var kids = g.querySelectorAll('.js-faq-item');
        var any = false;
        for (var k = 0; k < kids.length; k++) { if (!kids[k].hidden) { any = true; break; } }
        g.hidden = !any;
      }

      if (empty) empty.hidden = shown !== 0;
      if (count) {
        count.textContent = shown === total
          ? total + ' questions on this page.'
          : shown + ' of ' + total + ' questions match.';
      }
    }

    box.addEventListener('input', apply);
    if (clear) {
      clear.addEventListener('click', function () {
        box.value = '';
        apply();
        box.focus();
      });
    }
    apply();
  }

  /* ---- 7. Inert forms -------------------------------------------------- */
  // Two forms on this site exist to be looked at, not submitted: the contact
  // inquiry form (this is a demonstration build) and the library filter bar
  // (which filters live, so a submit would only reload the page). Both carry
  // data-inert rather than an inline handler, to keep all script in this file.
  function initInertForms() {
    var forms = document.querySelectorAll('form[data-inert]');
    for (var i = 0; i < forms.length; i++) {
      forms[i].addEventListener('submit', function (e) { e.preventDefault(); });
    }
  }

  /* ---- 8. First-visit fiction notice ----------------------------------- */
  // A visitor arriving for the first time gets one quiet bottom sheet saying
  // the association is invented, and then never sees it again. The flag lives
  // in localStorage, which throws in some privacy modes, so every access is
  // wrapped: if the store is unavailable the notice simply shows each visit
  // rather than breaking the page. The panel is built here rather than copied
  // into twenty-two HTML files, and its "Read more" target is taken from the
  // header badge so this file stays byte-identical between the static build
  // and the WordPress theme (where the link is /about/#fiction).
  var NOTICE_KEY = 'mc-fiction-notice-v1';

  function noticeSeen() {
    try {
      return window.localStorage && window.localStorage.getItem(NOTICE_KEY) === 'dismissed';
    } catch (e) {
      return false;
    }
  }

  function markNoticeSeen() {
    try {
      if (window.localStorage) window.localStorage.setItem(NOTICE_KEY, 'dismissed');
    } catch (e) {
      /* private mode, quota, disabled storage — nothing to do */
    }
  }

  function initFictionNotice() {
    if (document.getElementById('mc-fiction-notice')) return;
    if (noticeSeen()) return;

    var badge = document.querySelector('.js-fiction-link');
    var moreHref = badge ? badge.getAttribute('href') : './about.html#fiction';
    var returnTo = document.activeElement;

    var wrap = document.createElement('div');
    wrap.className = 'mc-notice';
    wrap.id = 'mc-fiction-notice';

    var panel = document.createElement('div');
    panel.className = 'mc-notice__panel';
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-modal', 'false');
    panel.setAttribute('aria-labelledby', 'mc-fiction-title');
    panel.setAttribute('aria-describedby', 'mc-fiction-body');
    panel.tabIndex = -1;

    var eyebrow = document.createElement('p');
    eyebrow.className = 'mc-notice__eyebrow';
    eyebrow.textContent = 'Before you read on';

    var title = document.createElement('h2');
    title.className = 'mc-notice__title';
    title.id = 'mc-fiction-title';
    title.textContent = 'None of this is real.';

    var body = document.createElement('p');
    body.className = 'mc-notice__body';
    body.id = 'mc-fiction-body';
    body.textContent = 'The International Cheese Federation and More Cheese do not exist: every member, ' +
      'course, event, figure and quotation on this site is invented. It is demonstration content built ' +
      'to show what an association\u2019s public website looks like when it runs on MemberJunction.';

    var actions = document.createElement('div');
    actions.className = 'mc-notice__actions';

    var ok = document.createElement('button');
    ok.type = 'button';
    ok.className = 'mc-notice__ok';
    ok.textContent = 'Got it';

    var more = document.createElement('a');
    more.className = 'mc-notice__more';
    more.href = moreHref;
    more.textContent = 'Read more';

    var close = document.createElement('button');
    close.type = 'button';
    close.className = 'mc-notice__close';
    close.setAttribute('aria-label', 'Dismiss this notice');
    close.innerHTML = '&times;';

    actions.appendChild(ok);
    actions.appendChild(more);
    panel.appendChild(close);
    panel.appendChild(eyebrow);
    panel.appendChild(title);
    panel.appendChild(body);
    panel.appendChild(actions);
    wrap.appendChild(panel);

    function onKey(e) {
      if (e.key === 'Escape' || e.key === 'Esc') dismiss();
    }

    function dismiss() {
      document.removeEventListener('keydown', onKey);
      markNoticeSeen();
      if (wrap.parentNode) wrap.parentNode.removeChild(wrap);
      // Hand focus back where it was, or to the permanent nav badge, which says
      // the same thing in three words and stays available on every page.
      var target = (returnTo && document.contains(returnTo) && returnTo !== document.body)
        ? returnTo
        : badge;
      if (target && target.focus) target.focus();
    }

    ok.addEventListener('click', dismiss);
    close.addEventListener('click', dismiss);
    // Following "Read more" is itself an acknowledgement; do not ask twice.
    more.addEventListener('click', function () { markNoticeSeen(); });
    document.addEventListener('keydown', onKey);

    document.body.appendChild(wrap);
    panel.focus();
  }

  function ready(fn) {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn);
    else fn();
  }

  ready(function () {
    initNav(); initCurrent(); initHoles(); initYear(); initLibrary(); initFaqFilter(); initInertForms();
    initFictionNotice();
  });
})();
