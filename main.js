/* ══════════════════════════════════════════════════════════════════════
   main.js — everything that runs after the page has parsed.

   Moved out of index.html so the Content-Security-Policy no longer needs
   'unsafe-inline' in script-src. Each section is a self-contained IIFE
   and they are order-independent.

   Loaded with `defer`, so it executes after the HTML is parsed but
   before DOMContentLoaded — no readiness check needed.
   ══════════════════════════════════════════════════════════════════════ */

// ── Email addresses ──
// Assembled from data-attributes at load. Simple HTML scrapers do not run
// JS, so the plain address never appears in the served source; everyone
// else — including keyboard and screen-reader users — gets a real, working
// mailto link with no interaction required.
(function(){
  Array.prototype.forEach.call(document.querySelectorAll('.email-link'), function(a){
    var addr = a.getAttribute('data-u') + '@' +
               a.getAttribute('data-d') + '.' +
               a.getAttribute('data-t');
    a.href = 'mailto:' + addr;
    a.textContent = addr;
    a.removeAttribute('rel');
  });
})();

// ── Router: hash-driven page switching ──
(function(){
  var PAGES  = ['about', 'experience', 'projects', 'media', 'recognition', 'contact', 'privacy'];
  // Entries that live inside a page, so #photography opens Recognition
  // and scrolls to it rather than silently doing nothing.
  var ENTRIES = {
    building: 'projects', history: 'projects', climate: 'projects',
    podcasts: 'media',
    fintech: 'recognition', photography: 'recognition'
  };
  var LABELS = {
    about: 'About', experience: 'Experience', projects: 'Projects',
    media: 'Media', recognition: 'Recognition', contact: 'Contact', privacy: 'Privacy'
  };
  var BASE_TITLE = 'C. Schuyler Neuhauser';

  // The router is now in charge of which section is visible, so the CSS
  // first-paint fallback for About can stand down.
  document.documentElement.classList.add('js-router');

  var pages = document.querySelectorAll('.page');
  var links = document.querySelectorAll('.nav-link');
  var initial = true;

  function show(name, scrollTo){
    if (PAGES.indexOf(name) === -1) name = 'about';

    Array.prototype.forEach.call(pages, function(p){
      p.classList.toggle('is-active', p.getAttribute('data-page') === name);
    });
    Array.prototype.forEach.call(links, function(l){
      var on = l.getAttribute('data-page') === name;
      l.classList.toggle('is-active', on);
      if (on) { l.setAttribute('aria-current', 'page'); }
      else { l.removeAttribute('aria-current'); }
    });

    // Each view is a distinct page as far as the reader is concerned, so give
    // it a distinct title — for the tab, for history and for bookmarks.
    document.title = BASE_TITLE + ' — ' + LABELS[name];

    // On a route change, move focus into the new section and reset scroll.
    // Without this a screen reader announces nothing and a keyboard user has
    // to tab back through the whole nav. Skipped on first paint so we don't
    // steal focus from someone who has just arrived.
    if (!initial) {
      var el = document.getElementById(name);
      if (el && el.focus) { el.focus({ preventScroll: true }); }
      window.scrollTo(0, 0);
    }
    initial = false;

    // Deep link to an entry: scroll to it now that its page is visible.
    if (scrollTo) {
      var target = document.getElementById(scrollTo);
      if (target) {
        if (target.scrollIntoView) { target.scrollIntoView(); }
        if (target.hasAttribute('tabindex') === false) { target.setAttribute('tabindex', '-1'); }
        if (target.focus) { target.focus({ preventScroll: true }); }
      }
    }
  }

  function fromHash(){
    return (window.location.hash || '').replace('#', '').toLowerCase();
  }

  function route(h){
    if (PAGES.indexOf(h) !== -1) { show(h); return; }
    // A deep link to an entry: open the page that contains it.
    if (Object.prototype.hasOwnProperty.call(ENTRIES, h)) { show(ENTRIES[h], h); return; }
    // Anything else (e.g. #main from the skip link) is not ours to handle.
    if (h) return;
    show('');
  }

  window.addEventListener('hashchange', function(){
    // First navigation: from here on page changes should animate, including
    // a return to About. The initial view deliberately does not.
    document.documentElement.classList.add('nav-ready');
    route(fromHash());
  });

  route(fromHash());
})();

// ── "Schuyler" → pronunciation: measure both states so the width can
//    be animated between two exact pixel values. ──
(function(){
  var els = Array.prototype.slice.call(document.querySelectorAll('.pron'));
  if (!els.length) return;

  function measure(){
    els.forEach(function(el){
      // Skip if the element's page is hidden — it would measure as 0px wide.
      if (!el.offsetParent) return;
      var word = el.querySelector('.pron-word');
      var ipa  = el.querySelector('.pron-ipa');
      if (!word || !ipa) return;
      var prev = el.style.transition;
      el.style.transition = 'none';
      el.style.width = 'auto';
      var w = word.getBoundingClientRect().width;
      var i = ipa.getBoundingClientRect().width;
      el.style.width = '';
      if (!w || !i) { el.style.transition = prev; return; }
      el.style.setProperty('--pron-w', w.toFixed(2) + 'px');
      el.style.setProperty('--pron-i', i.toFixed(2) + 'px');
      void el.offsetWidth;               // flush before restoring transition
      el.style.transition = prev;
    });
  }

  // Tap / click / Enter toggles the pronunciation open and closed. This is
  // what makes it dismissable on touch, where :hover never lets go.
  function setOpen(el, on){ el.classList.toggle('is-open', on); }
  function close(){ els.forEach(function(el){ setOpen(el, false); }); }

  els.forEach(function(el){
    el.addEventListener('click', function(e){
      e.stopPropagation();
      var open = el.classList.contains('is-open');
      close();
      if (!open) setOpen(el, true);
    });
    el.addEventListener('keydown', function(e){
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'Spacebar') {
        e.preventDefault();
        setOpen(el, !el.classList.contains('is-open'));
      } else if (e.key === 'Escape') {
        setOpen(el, false);
      }
    });
    el.addEventListener('blur', function(){ setOpen(el, false); });
  });

  // Tapping anywhere else closes it too.
  document.addEventListener('click', close);

  measure();
  if (document.fonts && document.fonts.ready) { document.fonts.ready.then(measure); }
  window.addEventListener('load', measure);

  // Measure when a page becomes visible — covers arriving at About via the
  // nav, or landing on the site with a non-About hash in the URL.
  window.addEventListener('hashchange', function(){
    requestAnimationFrame(measure);
  });

  var t;
  window.addEventListener('resize', function(){
    clearTimeout(t);
    t = setTimeout(measure, 150);
  });
})();
