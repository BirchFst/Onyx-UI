/*! Onyx UI · toast extension · v1.8.0 · MIT Licensed
 * -----------------------------------------------------------------------------
 * Optional. Registers `OnyxUI.toast(...)` on the core object — stacked
 * notifications with a timer that pauses on hover and focus, action buttons, a
 * progress bar, and dedupe by id.
 * Needs onyx-ui.js loaded FIRST, plus extensions/onyx-toast.css.
 *
 *   <script src="onyx-ui.js" defer></script>
 *   <script src="extensions/onyx-toast.js" defer></script>
 *
 * Public API
 *   OnyxUI.toast(options | string)                 → returns the toast element
 *   OnyxUI.toast.success | danger | warning | info | neutral(...)
 *   OnyxUI.toast.dismiss(element | id)             close one
 *   OnyxUI.toast.clear(position?)                  close all (or one corner)
 *   OnyxUI.toast.update(id, options)               update a toast created with an id
 *
 * Toast options
 *   title, description, variant: 'neutral|success|warning|danger|info',
 *   position: 'top-left|top-center|top-right|bottom-left|bottom-center|bottom-right',
 *   duration: ms (0 = sticky), dismissible, icon: false, max: 4, id,
 *   action: { label, onClick, closeOnClick: true, variant: 'link' }, onClose
 * ========================================================================== */


(function (root, factory) {
  if (typeof module === 'object' && module.exports) { module.exports = factory; }
  else { factory(root.OnyxUI); }
})(typeof window !== 'undefined' ? window : this, function (OnyxUI) {
  'use strict';

  if (!OnyxUI || !OnyxUI.util) {
    if (typeof console !== 'undefined' && console.warn) {
      console.warn('[OnyxUI] extensions/onyx-toast.js must be loaded after onyx-ui.js');
    }
    return;
  }

  var doc = document;
  var on = OnyxUI.util.on;

  var ICONS = {
    check: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M8.5 12.4l2.4 2.4 4.6-4.9"/></svg>',
    cross: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M15 9l-6 6M9 9l6 6"/></svg>',
    warning: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M10.3 3.9L2.6 17a1.9 1.9 0 0 0 1.7 2.9h15.4A1.9 1.9 0 0 0 21.4 17L13.7 3.9a1.9 1.9 0 0 0-3.4 0z"/><path d="M12 9v4M12 16.6v.2"/></svg>',
    info: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 7.8v.2"/></svg>',
    bell: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8a6 6 0 1 0-12 0c0 6-2 7-2 7h16s-2-1-2-7"/><path d="M13.7 20a2 2 0 0 1-3.4 0"/></svg>',
    close: '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>'
  };

  var VARIANT_ICON = { neutral: 'bell', info: 'info', success: 'check', warning: 'warning', danger: 'cross' };

  function icon(name, className) {
    var span = doc.createElement('span');
    span.innerHTML = ICONS[name] || ICONS.bell;
    var svg = span.firstChild;
    if (className) svg.setAttribute('class', className);
    return svg;
  }

  /* ──────────────────────────────────────────────────────────── 2 · toast ── */

  var POSITIONS = ['top-left', 'top-center', 'top-right', 'bottom-left', 'bottom-center', 'bottom-right'];

  var DEFAULTS = {
    title: '',
    description: '',
    variant: 'neutral',
    position: 'top-right',
    duration: 4200,
    dismissible: true,
    closeLabel: '关闭',
    icon: true,
    max: 4,
    id: null,
    action: null,
    onClose: null
  };

  function getToaster(position) {
    var found = doc.querySelector('.ox-toaster[data-position="' + position + '"]');
    if (found) return found;
    var toaster = doc.createElement('div');
    toaster.className = 'ox-toaster';
    toaster.setAttribute('data-position', position);
    toaster.setAttribute('role', 'region');
    toaster.setAttribute('aria-label', 'Notifications');
    toaster.setAttribute('aria-live', 'polite');
    doc.body.appendChild(toaster);
    return toaster;
  }

  function text(node, value) {
    node.textContent = value;
    return node;
  }

  function buildActions(host, options, close) {
    var body = host.querySelector('.ox-toast__body');
    var list = body.querySelector('.ox-toast__actions');
    if (list) list.parentNode.removeChild(list);
    var action = options.action;
    if (!action) return null;

    list = doc.createElement('div');
    list.className = 'ox-toast__actions';
    var button = doc.createElement('button');
    button.type = 'button';
    button.className = 'ox-btn ox-btn--link ox-btn--sm';
    text(button, action.label || 'View');
    on(button, 'click', function () {
      if (typeof action.onClick === 'function') action.onClick(button);
      if (action.closeOnClick !== false) close();
    });
    list.appendChild(button);
    body.appendChild(list);
    return list;
  }

  function fill(node, options) {
    var variant = options.variant;
    node.className = 'ox-toast ox-toast--' + variant;
    node.setAttribute('role', variant === 'danger' ? 'alert' : 'status');

    var slot = node.querySelector('.ox-toast__icon');
    if (options.icon === false) {
      if (slot) slot.parentNode.removeChild(slot);
    } else if (!slot) {
      slot = icon(VARIANT_ICON[variant] || 'bell', 'ox-toast__icon');
      node.insertBefore(slot, node.firstChild);
    } else {
      var fresh = icon(VARIANT_ICON[variant] || 'bell', 'ox-toast__icon');
      slot.parentNode.replaceChild(fresh, slot);
    }

    var body = node.querySelector('.ox-toast__body');
    var head = body.querySelector('.ox-toast__title');
    var desc = body.querySelector('.ox-toast__desc');
    var actions = body.querySelector('.ox-toast__actions');

    if (options.title) {
      if (!head) {
        head = doc.createElement('p');
        head.className = 'ox-toast__title';
        body.insertBefore(head, body.firstChild);
      }
      text(head, options.title);
    } else if (head) {
      head.parentNode.removeChild(head);
    }

    // keep the order title → description → actions whatever the update order is
    if (options.description) {
      if (!desc) {
        desc = doc.createElement('p');
        desc.className = 'ox-toast__desc';
        body.insertBefore(desc, actions || null);
      }
      text(desc, options.description);
    } else if (desc) {
      desc.parentNode.removeChild(desc);
    }
  }

  function oldestToast(toaster) {
    var nodes = Array.prototype.filter.call(toaster.children, function (node) {
      return node.getAttribute('data-ox-closing') !== '1';
    });
    if (!nodes.length) return null;
    return toaster.getAttribute('data-position').indexOf('bottom') === 0
      ? nodes[nodes.length - 1]
      : nodes[0];
  }

  function cleanup(toaster) {
    if (!toaster) return;
    if (toaster.children.length) return;
    if (toaster.parentNode) toaster.parentNode.removeChild(toaster);
  }

  function dismiss(node, immediate) {
    if (!node || node.getAttribute('data-ox-closing') === '1') return;
    node.setAttribute('data-ox-closing', '1');

    var state = node.__oxToast;
    if (state) {
      clearTimeout(state.timer);
      state.timer = null;
    }

    var finish = function () {
      var toaster = node.parentNode;
      if (toaster) toaster.removeChild(node);
      if (state && typeof state.onClose === 'function') state.onClose(node);
      cleanup(toaster);
    };

    if (immediate) { finish(); return; }

    node.setAttribute('data-state', 'exit');

    // wait for the slide-out to finish (--ox-dur-toast-out), with a safety net
    var done = false;
    var complete = function () {
      if (done) return;
      done = true;
      node.removeEventListener('animationend', onExit);
      finish();
    };
    var onExit = function (event) {
      if (event.target === node && event.animationName === 'ox-toast-out') complete();
    };
    node.addEventListener('animationend', onExit);
    // safety net, sized from the CSS duration so a custom --ox-dur-toast-out
    // never gets cut short (background tabs throttle both animations and timers)
    var exitMs = parseFloat(getComputedStyle(node).getPropertyValue('--ox-dur-toast-out')) || 260;
    setTimeout(complete, exitMs + 400);
  }

  function mount(node, state) {
    var timer = node.querySelector('.ox-toast__progress');
    if (timer) {
      timer.style.animation = 'none';
      void timer.offsetWidth; /* force restart */
      timer.style.animation = '';
      timer.style.animationDuration = state.duration + 'ms';
    }

    state.remaining = state.duration;
    state.timer = null;
    if (state.duration > 0) {
      state.startedAt = Date.now();
      state.timer = setTimeout(function () { dismiss(node, false); }, state.duration);
    }
  }

  function setBar(node, state) {
    var bar = node.querySelector('.ox-toast__progress');
    if (bar) bar.style.animationPlayState = state;
  }

  function pause(node) {
    if (node.getAttribute('data-ox-closing') === '1') return;
    var state = node.__oxToast;
    setBar(node, 'paused');
    if (!state || !state.timer) return;
    clearTimeout(state.timer);
    state.timer = null;
    state.remaining -= Date.now() - state.startedAt;
    if (state.remaining < 0) state.remaining = 0;
  }

  function resume(node) {
    if (node.getAttribute('data-ox-closing') === '1') return;
    var state = node.__oxToast;
    setBar(node, 'running');
    // sticky toasts have no countdown; nothing to resume
    if (!state || !state.duration || state.timer) return;
    if (state.remaining <= 0) { dismiss(node, false); return; }
    state.startedAt = Date.now();
    state.timer = setTimeout(function () { dismiss(node, false); }, state.remaining);
  }

  function toast(titleOrOptions) {
    var options = typeof titleOrOptions === 'string'
      ? { title: titleOrOptions }
      : Object.assign({}, titleOrOptions || {});

    var config = Object.assign({}, DEFAULTS, options);
    if (POSITIONS.indexOf(config.position) === -1) config.position = DEFAULTS.position;

    // update in place when an id is reused
    if (config.id) {
      var existing = doc.querySelector('.ox-toast[data-ox-id="' + config.id + '"]');
      if (existing) {
        var state = existing.__oxToast;
        var currentToaster = existing.parentNode;
        var targetToaster = getToaster(config.position);
        if (state) { clearTimeout(state.timer); Object.assign(state, config); }
        fill(existing, config);
        buildActions(existing, config, function () { dismiss(existing, false); });
        if (currentToaster !== targetToaster) {
          targetToaster.appendChild(existing);
          cleanup(currentToaster);
        }
        mount(existing, state);
        return existing;
      }
    }

    var toaster = getToaster(config.position);
    var isBottom = config.position.indexOf('bottom') === 0;
    var limit = config.max > 0 ? config.max : 0;
    while (limit && toaster.children.length >= limit) {
      var victim = oldestToast(toaster);
      if (!victim) break;
      dismiss(victim, true);
    }

    var node = doc.createElement('div');
    node.className = 'ox-toast ox-toast--' + config.variant;
    node.setAttribute('role', config.variant === 'danger' ? 'alert' : 'status');
    if (config.id) node.setAttribute('data-ox-id', config.id);

    var body = doc.createElement('div');
    body.className = 'ox-toast__body';
    node.appendChild(body);

    var close = function () { dismiss(node, false); };

    if (config.dismissible) {
      var button = doc.createElement('button');
      button.type = 'button';
      button.className = 'ox-toast__close';
      button.setAttribute('aria-label', config.closeLabel);
      button.appendChild(icon('close'));
      on(button, 'click', close);
      node.appendChild(button);
    }

    if (config.duration > 0) {
      var progress = doc.createElement('span');
      progress.className = 'ox-toast__progress';
      progress.setAttribute('aria-hidden', 'true');
      node.appendChild(progress);
    }

    var state = Object.assign({}, config, { timer: null, remaining: config.duration, startedAt: 0 });
    node.__oxToast = state;

    fill(node, config);
    buildActions(node, config, close);

    /* Pause on hover — but only for a real pointer. On a touch screen a tap
       fires mouseenter with no matching mouseleave, so the countdown would
       stop for good and the toast would never leave. */
    on(node, 'pointerenter', function (event) {
      if (event.pointerType === 'mouse') pause(node);
    });
    on(node, 'pointerleave', function (event) {
      if (event.pointerType === 'mouse') resume(node);
    });
    // keyboard focus also holds it open; :focus-visible keeps a tap out of this
    on(node, 'focusin', function (event) {
      var target = event.target;
      if (target && target.matches && target.matches(':focus-visible')) pause(node);
    });
    on(node, 'focusout', function () { resume(node); });

    if (isBottom) toaster.insertBefore(node, toaster.firstChild);
    else toaster.appendChild(node);

    mount(node, state);
    return node;
  }

  ['neutral', 'success', 'danger', 'warning', 'info'].forEach(function (variant) {
    toast[variant] = function (titleOrOptions) {
      var options = typeof titleOrOptions === 'string'
        ? { title: titleOrOptions }
        : Object.assign({}, titleOrOptions || {});
      options.variant = variant;
      return toast(options);
    };
  });

  toast.dismiss = function (node) {
    if (typeof node === 'string') node = doc.querySelector('.ox-toast[data-ox-id="' + node + '"]');
    dismiss(node, false);
  };

  toast.clear = function (position) {
    var selector = position ? '.ox-toaster[data-position="' + position + '"]' : '.ox-toaster';
    Array.prototype.forEach.call(doc.querySelectorAll(selector), function (toaster) {
      Array.prototype.slice.call(toaster.children).forEach(function (node) { dismiss(node, true); });
      cleanup(toaster);
    });
  };

  toast.update = function (id, options) {
    return toast(Object.assign({}, options || {}, { id: id }));
  };

  OnyxUI.toast = toast;
});
