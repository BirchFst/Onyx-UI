/*! Onyx UI · drawer extension · v1.8.0 · MIT Licensed
 * -----------------------------------------------------------------------------
 * Optional. Drives `.ox-sidebar--drawer` below 1024px: opening from
 * `[data-ox-drawer-open="#id"]`, closing from `[data-ox-drawer-close]`, the
 * scrim, Esc, click-through, focus trap + restore, scroll lock, and an
 * automatic close when the viewport leaves the small-screen range.
 * Needs onyx-ui.js loaded FIRST, plus extensions/onyx-drawer.css.
 *
 *   <script src="onyx-ui.js" defer></script>
 *   <script src="extensions/onyx-drawer.js" defer></script>
 *
 * Public API
 *   OnyxUI.drawer.open(element, trigger?)   OnyxUI.drawer.close(element?)
 *   OnyxUI.drawer.toggle(element, trigger?)
 * ========================================================================== */


(function (root, factory) {
  if (typeof module === 'object' && module.exports) { module.exports = factory; }
  else { factory(root.OnyxUI); }
})(typeof window !== 'undefined' ? window : this, function (OnyxUI) {
  'use strict';

  if (!OnyxUI || !OnyxUI.util) {
    if (typeof console !== 'undefined' && console.warn) {
      console.warn('[OnyxUI] extensions/onyx-drawer.js must be loaded after onyx-ui.js');
    }
    return;
  }

  var doc = document;
  var closest = OnyxUI.util.closest;
  var on = OnyxUI.util.on;

  /* ──────────────────────────────────────────────── 3 · drawer (off-canvas) ── */

  var DRAWER_BREAKPOINT = '(max-width: 1024px)';
  var drawer = { current: null, trigger: null };

  function scrim() {
    var node = doc.querySelector('.ox-scrim');
    if (!node) {
      node = doc.createElement('div');
      node.className = 'ox-scrim';
      node.setAttribute('aria-hidden', 'true');
      doc.body.appendChild(node);
    }
    return node;
  }

  function focusables(host) {
    var selector = 'a[href], button:not([disabled]), input:not([disabled]),' +
      ' select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
    return Array.prototype.filter.call(host.querySelectorAll(selector), visible);
  }

  function openDrawer(target, trigger) {
    if (!target || target.classList.contains('is-open')) return;
    clearTimeout(target.__oxHideTimer);
    target.style.visibility = '';
    target.classList.add('is-open');
    scrim().classList.add('is-open');
    doc.body.classList.add('ox-no-scroll');
    drawer.current = target;
    drawer.trigger = trigger || null;
    if (drawer.trigger) drawer.trigger.setAttribute('aria-expanded', 'true');
    if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
    target.focus();
  }

  /** Hand visibility back to the stylesheet once the slide-out has finished. */
  function releaseVisibility(target) {
    var done = function () {
      clearTimeout(target.__oxHideTimer);
      target.removeEventListener('transitionend', onEnd);
      target.style.visibility = '';
    };
    var onEnd = function (event) {
      if (event.target === target && event.propertyName === 'transform') done();
    };
    target.addEventListener('transitionend', onEnd);
    // fallback for reduced motion / interrupted transitions
    target.__oxHideTimer = setTimeout(done, 400);
  }

  function closeDrawer(target, refocus) {
    var node = target || drawer.current;
    if (!node || !node.classList.contains('is-open')) return;
    // keep it painted so the drawer can slide back out before becoming hidden
    node.style.visibility = 'visible';
    node.classList.remove('is-open');
    releaseVisibility(node);
    var shade = doc.querySelector('.ox-scrim');
    if (shade) shade.classList.remove('is-open');
    doc.body.classList.remove('ox-no-scroll');
    if (drawer.trigger) {
      drawer.trigger.setAttribute('aria-expanded', 'false');
      if (refocus !== false) drawer.trigger.focus();
    }
    drawer.current = null;
    drawer.trigger = null;
  }

  function toggleDrawer(target, trigger) {
    if (!target) return;
    if (target.classList.contains('is-open')) closeDrawer(target, true);
    else openDrawer(target, trigger);
  }

  function drawerEvents() {
    on(doc, 'click', function (event) {
      var opener = closest(event.target, '[data-ox-drawer-open]');
      if (opener) {
        var target = doc.querySelector(opener.getAttribute('data-ox-drawer-open'));
        if (target) {
          event.preventDefault();
          toggleDrawer(target, opener);
        }
        return;
      }

      if (closest(event.target, '[data-ox-drawer-close]')) { closeDrawer(null, true); return; }

      if (event.target.classList && event.target.classList.contains('ox-scrim')) {
        closeDrawer(null, true);
        return;
      }

      // following a link inside the drawer should dismiss it (mobile pattern)
      if (closest(event.target, '.ox-sidebar--drawer a[href]')) closeDrawer(null, false);
    });

    on(doc, 'keydown', function (event) {
      var target = drawer.current;
      if (!target) return;

      if (event.key === 'Escape') {
        event.preventDefault();
        closeDrawer(target, true);
        return;
      }

      if (event.key !== 'Tab') return;

      var list = focusables(target);
      if (!list.length) {
        event.preventDefault();
        target.focus();
        return;
      }
      var first = list[0];
      var last = list[list.length - 1];
      if (event.shiftKey && (doc.activeElement === first || doc.activeElement === target)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && doc.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    });

    // leaving the small-screen range must not leave a stuck overlay behind
    var media = window.matchMedia(DRAWER_BREAKPOINT);
    var onChange = function (event) { if (!event.matches) closeDrawer(null, false); };
    if (media.addEventListener) media.addEventListener('change', onChange);
    else if (media.addListener) media.addListener(onChange);
  }

  /* ── bootstrap ───────────────────────────────────────────────────────── */

  var bound = false;

  function setup(target) {
    if (bound) return;
    bound = true;
    drawerEvents();
    void target;
  }

  OnyxUI.onInit(setup);
  OnyxUI.drawer = { open: openDrawer, close: closeDrawer, toggle: toggleDrawer };
});
