/*! Onyx UI v1.8.0 — core behaviour layer (optional) · MIT Licensed
 * -----------------------------------------------------------------------------
 * CSS alone handles every visual state. This file adds only what CSS cannot,
 * and only what *every* page needs:
 *
 *   1 · Dropdown — outside-click dismissal, Esc, arrow-key navigation, item
 *                  selection toggle, auto flip near viewport edges.
 *   2 · Touch    — `.is-pressed` / `.is-tapped` press feedback. iOS Safari only
 *                  fires :active when a touchstart listener exists, and hover is
 *                  off on touch, so without this a tap shows nothing at all.
 *
 * Everything heavier lives in extensions/ and is opt-in:
 *
 *   extensions/onyx-code.js     code container + copy    (+ onyx-code.css)
 *   extensions/onyx-drawer.js   mobile drawer            (+ onyx-drawer.css)
 *   extensions/onyx-toast.js    OnyxUI.toast()           (+ onyx-toast.css)
 *
 * Extensions load after this file and hook themselves in via OnyxUI.onInit();
 * the core never references them by name. Skip all of them and dropdown menus
 * simply stay open until you click the summary again — nothing breaks.
 *
 *   <script src="onyx-ui.js" defer></script>
 *
 * Public API
 *   OnyxUI.init(root?)      re-scan after injecting markup
 *   OnyxUI.onInit(fn)       used by extensions; fn(root) runs on every init
 *   OnyxUI.dropdown         { close, flip }
 *   OnyxUI.util             { closest, on, visible } — shared by extensions
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) { module.exports = factory(); }
  else { root.OnyxUI = factory(); }
})(typeof window !== 'undefined' ? window : this, function () {
  'use strict';

  var doc = document;
  var VERSION = '1.8.0';

  /* ────────────────────────────────────────────────────────────── utils ── */

  function closest(node, selector) {
    while (node && node.nodeType === 1) {
      if (node.matches && node.matches(selector)) return node;
      node = node.parentElement;
    }
    return null;
  }

  function on(target, type, handler, opts) {
    target.addEventListener(type, handler, opts || false);
  }

  function visible(node) {
    return node.offsetWidth > 0 || node.offsetHeight > 0 || node.getClientRects().length > 0;
  }

  /* ───────────────────────────────────────────────────────── 1 · dropdown ── */

  var OPEN = 'details.ox-dropdown[open]';

  function menuOf(details) {
    for (var i = 0; i < details.children.length; i++) {
      if (details.children[i].classList.contains('ox-dropdown__menu')) return details.children[i];
    }
    return null;
  }

  function itemsOf(details) {
    var nodes = details.querySelectorAll('.ox-dropdown__item');
    return Array.prototype.filter.call(nodes, function (node) {
      return !node.disabled && visible(node);
    });
  }

  function close(details, refocus) {
    if (!details.hasAttribute('open')) return;
    details.removeAttribute('open');
    details.removeAttribute('data-flip');
    var menu = menuOf(details);
    if (menu) {
      menu.style.left = '';
      menu.style.right = '';
    }
    if (refocus) {
      var summary = details.querySelector('summary');
      if (summary) summary.focus();
    }
  }

  /**
   * Keep the menu on screen: flip up when there is more room above, and slide
   * horizontally so it never leaves the viewport. Flipping alone is not enough
   * on narrow screens — a menu can be wider than the gap on either side of its
   * trigger, so the last resort is a measured offset.
   */
  function flip(details) {
    var menu = menuOf(details);
    if (!menu) return;

    // start from the authored position
    details.removeAttribute('data-flip');
    menu.style.left = '';
    menu.style.right = '';

    var anchor = details.getBoundingClientRect();
    var box = menu.getBoundingClientRect();
    var vw = doc.documentElement.clientWidth;
    var vh = doc.documentElement.clientHeight;
    var pad = 8;

    if (box.bottom > vh - pad && anchor.top > vh - anchor.bottom) {
      details.setAttribute('data-flip', 'up');
      box = menu.getBoundingClientRect();
    }

    var left = box.left;
    if (box.right > vw - pad) left = Math.min(box.left, vw - pad - box.width);
    if (left < pad) left = pad;

    if (Math.abs(left - box.left) > 0.5) {
      menu.style.left = (left - anchor.left) + 'px';
      menu.style.right = 'auto';
    }
  }

  function focusItem(details, index) {
    var list = itemsOf(details);
    if (!list.length) return;
    if (index === 'last') index = list.length - 1;
    if (index === 'first') index = 0;
    list[Math.max(0, Math.min(list.length - 1, index))].focus();
  }

  function initDropdowns(root) {
    var scope = root || doc;
    Array.prototype.forEach.call(scope.querySelectorAll('details.ox-dropdown'), function (details) {
      if (details.getAttribute('data-ox-ready') === '1') return;
      details.setAttribute('data-ox-ready', '1');
      // `toggle` does not bubble, so it must be bound per element
      on(details, 'toggle', function () {
        if (details.open) flip(details);
        else details.removeAttribute('data-flip');
      });
    });
  }

  function dropdownEvents() {
    // outside click → dismiss
    on(doc, 'click', function (event) {
      var inside = closest(event.target, 'details.ox-dropdown');
      Array.prototype.forEach.call(doc.querySelectorAll(OPEN), function (details) {
        if (details !== inside) close(details, false);
      });
    });

    // selecting an item
    on(doc, 'click', function (event) {
      var item = closest(event.target, '.ox-dropdown__item');
      if (!item) return;
      var details = closest(item, 'details.ox-dropdown');
      if (!details) return;

      if (item.hasAttribute('data-ox-check')) {
        var checked = item.getAttribute('aria-checked') === 'true';
        item.setAttribute('aria-checked', String(!checked));
        item.classList.toggle('is-checked', !checked);
        return;
      }
      if (item.hasAttribute('data-ox-close')) close(details, false);
    });

    // keyboard
    on(doc, 'keydown', function (event) {
      var details = closest(event.target, 'details.ox-dropdown');
      if (!details) return;
      var isSummary = event.target.tagName === 'SUMMARY';
      var key = event.key;

      if (key === 'Escape') {
        if (!details.open) return;
        event.preventDefault();
        close(details, true);
        return;
      }

      if (key === 'Tab') { close(details, false); return; }

      if (key === 'ArrowDown' || key === 'ArrowUp' || key === 'Home' || key === 'End') {
        if (!isSummary && !details.open) return;
        event.preventDefault();

        if (!details.open) {
          details.setAttribute('open', '');
          flip(details);
          focusItem(details, key === 'ArrowUp' ? 'last' : 'first');
          return;
        }
        if (isSummary) {
          focusItem(details, key === 'ArrowUp' || key === 'End' ? 'last' : 'first');
          return;
        }

        if (key === 'Home') return focusItem(details, 'first');
        if (key === 'End') return focusItem(details, 'last');

        var list = itemsOf(details);
        var current = list.indexOf(doc.activeElement);
        var next = key === 'ArrowDown'
          ? (current + 1) % list.length
          : (current <= 0 ? list.length - 1 : current - 1);
        list[next].focus();
      }
    });
  }

  /* ───────────────────────────────────────────────── touch press feedback ── */

  /**
   * iOS Safari only applies :active to an element when a touchstart listener
   * exists in the document. Hover is disabled on touch devices, so without this
   * a tap on iPhone gives no visual feedback whatsoever.
   */
  function touchFeedback() {
    // iOS Safari only applies :active when a touchstart listener exists. We do
    // not rely on :active anyway — this also keeps the press alive for the whole
    // gesture, which a long press would otherwise cancel.
    on(doc, 'touchstart', function () {}, { passive: true });

    // buttons and tooltip wrappers are looked up separately: a tooltip usually
    // wraps a button, so a single closest() would only ever find the button
    var pressedNodes = [];

    var mark = function (node) {
      if (!node || pressedNodes.indexOf(node) !== -1) return;
      node.classList.add('is-pressed');
      pressedNodes.push(node);
    };

    on(doc, 'pointerdown', function (event) {
      if (event.pointerType === 'mouse') return;
      pressedNodes = [];
      mark(closest(event.target, '.ox-btn'));
      mark(closest(event.target, '.ox-tooltip'));
    });

    var release = function (event) {
      if (event && event.pointerType === 'mouse') return;
      var nodes = pressedNodes;
      pressedNodes = [];
      nodes.forEach(function (node) {
        node.classList.remove('is-pressed');
        // replay the press as a spring-back: a tap is too short to see otherwise
        if (!node.classList.contains('ox-btn') || node.disabled) return;
        node.classList.remove('is-tapped');
        void node.offsetWidth; /* restart the animation */
        node.classList.add('is-tapped');
        clearTimeout(node.__oxTap);
        node.__oxTap = setTimeout(function () { node.classList.remove('is-tapped'); }, 400);
      });
    };

    on(doc, 'pointerup', release);
    on(doc, 'pointercancel', release);
  }

  /* ──────────────────────────────────────────────────────────── bootstrap ─ */

  /* Extensions (toast / drawer / code) hook in here rather than being called
     by name, so the core does not need to know which of them are loaded.
     Each extension boots itself when its script runs. */
  var hooks = [];

  function onInit(fn) {
    hooks.push(fn);
    if (started) fn(doc);   /* extension arrived after the core already booted */
  }

  var started = false;

  function init(root) {
    var scope = root || doc;
    var i;
    initDropdowns(scope);
    for (i = 0; i < hooks.length; i++) hooks[i](scope);
    if (started) return;
    started = true;
    dropdownEvents();
    touchFeedback();
  }

  if (doc.readyState === 'loading') on(doc, 'DOMContentLoaded', function () { init(); });
  else init();

  return {
    version: VERSION,
    init: init,
    onInit: onInit,
    /** exposed for tests / custom integrations */
    dropdown: { close: close, flip: flip },
    /** shared helpers — extensions load after this file and reuse them */
    util: { closest: closest, on: on, visible: visible }
  };
});
