/* ══════════════════════════════════════════════════════════════════════
   boot.js — runs before the page renders.

   Loaded WITHOUT `defer` on purpose: it has to set the hashboot flag
   before any content is painted, or a deep link would flash the About
   section before the router corrects it. Keep it tiny for that reason.
   ══════════════════════════════════════════════════════════════════════ */

// ── First-paint routing hint ──
// Runs before any content is parsed. If the visitor deep-linked to a
// specific page we flag it, so CSS suppresses the default About view and
// lets the router below pick the right section. On a plain visit no flag is
// set, so About paints as soon as the HTML arrives — no JavaScript needed.
(function(){
  var h = (window.location.hash || '').toLowerCase();
  if (h && h !== '#about' && h !== '#main') {
    document.documentElement.className += ' hashboot';
  }
})();
