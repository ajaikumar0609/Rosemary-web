/* Rosemary School — shared interactions (v3) */
(function () {
  'use strict';

  var reduceMotion = matchMedia('(prefers-reduced-motion:reduce)').matches;
  var finePointer = matchMedia('(hover:hover) and (pointer:fine)').matches;

  /* ---- Page veil: fade in on load, fade out on internal navigation ---- */
  var veil = document.createElement('div');
  veil.className = 'pt-veil';
  document.body.appendChild(veil);
  if (!reduceMotion) {
    veil.classList.add('on');
    requestAnimationFrame(function () {
      requestAnimationFrame(function () { veil.classList.remove('on'); });
    });
    document.addEventListener('click', function (e) {
      var a = e.target.closest('a[href]');
      if (!a || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      if (a.target === '_blank' || a.hasAttribute('download')) return;
      var href = a.getAttribute('href');
      if (!href || href.charAt(0) === '#' || /^(https?:|mailto:|tel:|javascript:)/i.test(href)) return;
      e.preventDefault();
      veil.classList.add('on');
      setTimeout(function () { location.href = href; }, 260);
    });
    /* restore when returning via bfcache */
    addEventListener('pageshow', function (e) { if (e.persisted) veil.classList.remove('on'); });
  }

  /* ---- Header: quiet until scrolled ---- */
  var header = document.querySelector('.site-header');
  if (header) {
    var onScrollHdr = function () {
      header.classList.toggle('scrolled', window.scrollY > 10);
    };
    addEventListener('scroll', onScrollHdr, { passive: true });
    onScrollHdr();
  }

  /* ---- Mobile nav ---- */
  var toggle = document.querySelector('.nav-toggle');
  if (toggle && header) {
    toggle.addEventListener('click', function () {
      header.classList.toggle('nav-open');
      var open = header.classList.contains('nav-open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    header.querySelectorAll('.nav-menu a').forEach(function (a) {
      a.addEventListener('click', function () { header.classList.remove('nav-open'); });
    });
  }

  /* ---- Nav underline: morphs between items on desktop ---- */
  var menu = document.querySelector('.nav-menu');
  if (menu && finePointer && !reduceMotion) {
    var ink = document.createElement('span');
    ink.className = 'nav-ink';
    var links = Array.prototype.filter.call(menu.querySelectorAll('a'), function (a) {
      return !a.classList.contains('nav-pill');
    });
    var active = menu.querySelector('a.active');
    function moveInk(el, show) {
      if (!el) { ink.style.opacity = '0'; return; }
      ink.style.opacity = '1';
      ink.style.left = (el.offsetLeft + 12) + 'px';
      ink.style.width = Math.max(0, el.offsetWidth - 24) + 'px';
    }
    function engage() {
      if (menu.offsetParent === null || getComputedStyle(toggle || menu).display === 'flex' && toggle && getComputedStyle(toggle).display !== 'none') return false;
      return true;
    }
    if (links.length) {
      menu.appendChild(ink);
      menu.classList.add('has-ink');
      moveInk(active);
      if (!active) ink.style.opacity = '0';
      links.forEach(function (a) {
        a.addEventListener('mouseenter', function () { moveInk(a); });
      });
      menu.addEventListener('mouseleave', function () { active ? moveInk(active) : ink.style.opacity = '0'; });
      addEventListener('resize', function () { if (active) moveInk(active); });
    }
  }

  /* ---- Scroll progress bar (all pages) ---- */
  var bar = document.getElementById('progress');
  if (!bar) {
    bar = document.createElement('div');
    bar.className = 'scroll-progress';
    bar.id = 'progress';
    document.body.appendChild(bar);
  }
  function updBar() {
    var h = document.documentElement.scrollHeight - innerHeight;
    bar.style.width = (h > 0 ? Math.min(100, Math.max(0, window.scrollY / h * 100)) : 0) + '%';
  }
  addEventListener('scroll', updBar, { passive: true });
  addEventListener('resize', updBar);
  updBar();

  /* ---- Scroll reveal (+ mask reveals + staggered groups) ---- */
  var reveals = document.querySelectorAll('.reveal,.mask-rv,[data-stagger]');
  /* landing on a #fragment pre-scrolls the page past the observer — reveal instantly */
  try {
    if (location.hash && document.getElementById(location.hash.slice(1))) {
      reveals.forEach(function (el) { el.classList.add('in'); });
      reveals = [];
    }
  } catch (e) {}
  if (reveals.length && 'IntersectionObserver' in window && !reduceMotion) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    reveals.forEach(function (el, i) {
      if (el.classList.contains('reveal')) el.style.transitionDelay = ((i % 4) * 0.06) + 's';
      io.observe(el);
    });
  } else {
    reveals.forEach(function (el) { el.classList.add('in'); });
  }

  /* ---- Animated counters ---- */
  var counters = document.querySelectorAll('[data-count]');
  if (counters.length && 'IntersectionObserver' in window) {
    var co = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        var el = en.target;
        var end = parseFloat(el.getAttribute('data-count'));
        var suffix = el.getAttribute('data-suffix') || '';
        var dur = 1400, start = null;
        function tick(ts) {
          if (!start) start = ts;
          var p = Math.min((ts - start) / dur, 1);
          var eased = 1 - Math.pow(1 - p, 3);
          el.textContent = Math.floor(eased * end).toLocaleString('en-IN') + (p === 1 ? suffix : '');
          if (p < 1) requestAnimationFrame(tick);
        }
        requestAnimationFrame(tick);
        co.unobserve(el);
      });
    }, { threshold: 0.5 });
    counters.forEach(function (el) { co.observe(el); });
  }

  /* ---- Lazy image fade-in ---- */
  document.querySelectorAll('img[loading="lazy"]').forEach(function (img) {
    if (img.complete && img.naturalWidth) return;
    img.classList.add('lz');
    img.addEventListener('load', function () { img.classList.add('ld'); }, { once: true });
    img.addEventListener('error', function () { img.classList.add('ld'); }, { once: true });
  });

  /* ---- Gentle parallax on [data-plx] ---- */
  var plx = Array.prototype.slice.call(document.querySelectorAll('[data-plx]'));
  if (plx.length && !reduceMotion && innerWidth > 900) {
    var ticking = false;
    function doPlx() {
      ticking = false;
      var vh = innerHeight;
      plx.forEach(function (el) {
        var r = el.getBoundingClientRect();
        if (r.bottom < -80 || r.top > vh + 80) return;
        var speed = parseFloat(el.getAttribute('data-plx')) || 0.06;
        var off = (r.top + r.height / 2 - vh / 2) * -speed;
        el.style.transform = 'translateY(' + off.toFixed(1) + 'px)';
      });
    }
    addEventListener('scroll', function () {
      if (!ticking) { ticking = true; requestAnimationFrame(doPlx); }
    }, { passive: true });
    doPlx();
  }

  /* ---- Custom cursor (desktop, fine pointer) ---- */
  if (finePointer && !reduceMotion) {
    var dot = document.createElement('div'); dot.className = 'cur-dot';
    var ring = document.createElement('div'); ring.className = 'cur-ring';
    document.body.appendChild(dot); document.body.appendChild(ring);
    document.documentElement.classList.add('has-cursor');
    var mx = innerWidth / 2, my = innerHeight / 2, rx = mx, ry = my, shown = false;
    addEventListener('mousemove', function (e) {
      mx = e.clientX; my = e.clientY;
      if (!shown) { shown = true; rx = mx; ry = my; }
      dot.style.transform = 'translate(' + mx + 'px,' + my + 'px)';
      var t = e.target.closest && e.target.closest('a,button,[role="button"],summary,input,select,textarea,label,.gi,.mi');
      ring.classList.toggle('big', !!t);
    }, { passive: true });
    (function loop() {
      rx += (mx - rx) * 0.16; ry += (my - ry) * 0.16;
      ring.style.transform = 'translate(' + rx + 'px,' + ry + 'px)';
      requestAnimationFrame(loop);
    })();
  }

  /* ---- Quick-contact FAB dock ---- */
  if (!document.querySelector('.fab') && !document.body.hasAttribute('data-no-fab')) {
    var fab = document.createElement('div');
    fab.className = 'fab';
    fab.innerHTML =
      '<div class="fab-item"><span class="fab-tip">WhatsApp us</span><a class="fab-btn g" target="_blank" rel="noopener" aria-label="Chat on WhatsApp" href="https://wa.me/914622530837?text=Hello%2C%20I%27d%20like%20to%20enquire%20about%20admissions."><svg viewBox="0 0 24 24" fill="currentColor"><path d="M17.5 14.4c-.3-.2-1.7-.9-2-1-.3-.1-.5-.2-.6.1l-.9 1.1c-.2.2-.3.2-.6.1-1.8-.7-3-2.4-3.1-2.6-.1-.3 0-.4.1-.5l.4-.5c.2-.2.2-.3.3-.5.1-.2 0-.4 0-.5l-1-2.3c-.2-.5-.4-.5-.6-.5h-.5c-.2 0-.5.1-.7.3-.3.3-1 1-1 2.5s1 2.8 1.2 3c.1.2 2 3.1 5 4.3 1.7.7 2.3.8 3.1.6.5-.1 1.7-.7 1.9-1.4.2-.6.2-1.2.2-1.3-.1-.1-.3-.2-.6-.3M12 2a10 10 0 0 0-8.5 15.3L2 22l4.8-1.5A10 10 0 1 0 12 2Z"/></svg></a></div>' +
      '<div class="fab-item"><span class="fab-tip">Call the office</span><a class="fab-btn" href="tel:+914622530837" aria-label="Call the school office"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3 19.5 19.5 0 0 1-6-6 19.8 19.8 0 0 1-3-8.6A2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8.1 9.8a16 16 0 0 0 6 6l1.3-1.2a2 2 0 0 1 2.1-.5c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2Z"/></svg></a></div>' +
      '<div class="fab-item"><span class="fab-tip">Admission enquiry</span><a class="fab-btn" href="admissions.html#portal" aria-label="Open the admission portal"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg></a></div>' +
      '<button class="fab-main" aria-label="Quick contact" aria-expanded="false"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg></button>';
    document.body.appendChild(fab);
    var fabMain = fab.querySelector('.fab-main');
    fabMain.addEventListener('click', function () {
      fab.classList.toggle('open');
      fabMain.setAttribute('aria-expanded', fab.classList.contains('open') ? 'true' : 'false');
    });
    document.addEventListener('click', function (e) {
      if (!fab.contains(e.target)) fab.classList.remove('open');
    });
  }

  /* ---- Current year ---- */
  document.querySelectorAll('[data-year]').forEach(function (el) { el.textContent = new Date().getFullYear(); });

  /* =====================================================================
     GALLERY: filter + lightbox (masonry or grid), slideshow, fullscreen
     ===================================================================== */
  var galleryEl = document.querySelector('[data-gallery]') || document.getElementById('edGallery');
  var filterBar = document.querySelector('.g-filter');
  var ITEM_SEL = '.mi,.gi';

  if (filterBar && galleryEl) {
    var items = Array.prototype.slice.call(galleryEl.querySelectorAll(ITEM_SEL));
    filterBar.addEventListener('click', function (e) {
      var btn = e.target.closest('button');
      if (!btn) return;
      filterBar.querySelectorAll('button').forEach(function (b) { b.classList.remove('on'); });
      btn.classList.add('on');
      var cat = btn.getAttribute('data-cat');
      items.forEach(function (it) {
        var show = cat === 'all' || it.getAttribute('data-cat') === cat;
        if (show) {
          it.classList.remove('hidden');
          it.style.opacity = '0';
          requestAnimationFrame(function () {
            it.style.transition = 'opacity .45s cubic-bezier(.22,1,.36,1)';
            it.style.opacity = '1';
          });
        } else {
          it.classList.add('hidden');
        }
      });
    });
  }

  var lb = document.getElementById('lightbox');
  if (lb && galleryEl) {
    var lbImg = document.getElementById('lbImg');
    var lbCount = document.getElementById('lbCount');
    var lbMetaT = document.getElementById('lbMetaT');
    var lbMetaD = document.getElementById('lbMetaD');
    var lbCapLegacy = document.getElementById('lbCap');
    var lbPlay = document.getElementById('lbPlay');
    var lbFull = document.getElementById('lbFull');
    var current = 0, lastFocus = null, timer = null;

    function visibleItems() {
      return Array.prototype.slice.call(galleryEl.querySelectorAll(ITEM_SEL)).filter(function (el) {
        return !el.classList.contains('hidden');
      });
    }
    function show(i) {
      var vis = visibleItems();
      if (!vis.length) return;
      current = (i + vis.length) % vis.length;
      var fig = vis[current];
      var img = fig.querySelector('img');
      lbImg.src = img.currentSrc || img.src;
      lbImg.alt = img.alt || '';
      lbCount.textContent = (current + 1) + ' / ' + vis.length;
      var title = fig.getAttribute('data-title') || (fig.querySelector('.meta .t, figcaption') || {}).textContent || '';
      if (lbMetaT) lbMetaT.textContent = title;
      if (lbMetaD) {
        var bits = [];
        if (fig.getAttribute('data-loc')) bits.push(fig.getAttribute('data-loc'));
        if (fig.getAttribute('data-yr')) bits.push(fig.getAttribute('data-yr'));
        if (fig.getAttribute('data-cat')) bits.push(fig.getAttribute('data-cat').replace(/^\w/, function (c) { return c.toUpperCase(); }));
        if (fig.getAttribute('data-ph')) bits.push('Photo · ' + fig.getAttribute('data-ph'));
        lbMetaD.textContent = bits.join('  ·  ');
      }
      if (lbCapLegacy && !lbMetaT) lbCapLegacy.textContent = title;
    }
    function stopShow() {
      if (timer) { clearInterval(timer); timer = null; }
      lb.classList.remove('playing');
      if (lbPlay) { lbPlay.classList.remove('on'); lbPlay.setAttribute('aria-pressed', 'false'); }
    }
    function open(i) {
      lastFocus = document.activeElement;
      lb.classList.add('open');
      document.body.style.overflow = 'hidden';
      show(i);
      document.getElementById('lbClose').focus();
    }
    function close() {
      stopShow();
      if (document.fullscreenElement) document.exitFullscreen().catch(function () {});
      lb.classList.remove('open');
      document.body.style.overflow = '';
      if (lastFocus) lastFocus.focus();
    }

    galleryEl.addEventListener('click', function (e) {
      var fig = e.target.closest(ITEM_SEL);
      if (!fig) return;
      open(visibleItems().indexOf(fig));
    });
    document.getElementById('lbClose').addEventListener('click', close);
    document.getElementById('lbPrev').addEventListener('click', function () { stopShow(); show(current - 1); });
    document.getElementById('lbNext').addEventListener('click', function () { stopShow(); show(current + 1); });
    if (lbPlay) lbPlay.addEventListener('click', function () {
      if (timer) { stopShow(); return; }
      lb.classList.add('playing');
      lbPlay.classList.add('on');
      lbPlay.setAttribute('aria-pressed', 'true');
      timer = setInterval(function () { show(current + 1); }, 4200);
    });
    if (lbFull) lbFull.addEventListener('click', function () {
      if (document.fullscreenElement) document.exitFullscreen().catch(function () {});
      else lb.requestFullscreen && lb.requestFullscreen().catch(function () {});
    });
    lb.addEventListener('click', function (e) { if (e.target === lb) close(); });
    document.addEventListener('keydown', function (e) {
      if (!lb.classList.contains('open')) return;
      if (e.key === 'Escape') close();
      else if (e.key === 'ArrowLeft') { stopShow(); show(current - 1); }
      else if (e.key === 'ArrowRight') { stopShow(); show(current + 1); }
      else if (e.key === ' ') { e.preventDefault(); lbPlay && lbPlay.click(); }
      else if (e.key.toLowerCase() === 'f') { lbFull && lbFull.click(); }
    });

    var touchX = null;
    lb.addEventListener('touchstart', function (e) { touchX = e.touches[0].clientX; }, { passive: true });
    lb.addEventListener('touchend', function (e) {
      if (touchX === null) return;
      var dx = e.changedTouches[0].clientX - touchX;
      if (Math.abs(dx) > 48) { stopShow(); dx > 0 ? show(current - 1) : show(current + 1); }
      touchX = null;
    }, { passive: true });
  }
})();
