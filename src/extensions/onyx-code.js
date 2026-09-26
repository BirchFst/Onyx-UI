/*! Onyx UI · code extension · v1.7.0 · MIT Licensed
 * -----------------------------------------------------------------------------
 * Optional. Wraps every `<pre class="ox-code">` in an `.ox-codeblock` container
 * with a toolbar, and wires up the copy button.
 * Needs onyx-ui.js loaded FIRST, plus extensions/onyx-code.css.
 *
 *   <script src="onyx-ui.js" defer></script>
 *   <script src="extensions/onyx-code.js" defer></script>
 *
 * Highlighting is deliberately NOT bundled. Put `data-lang="html"` on the <pre>
 * and this extension hands the block to whichever engine it finds already on
 * the page (Prism or highlight.js). No engine means `data-lang` is ignored and
 * the block simply stays plain text — never broken, never guessed at.
 *
 *   <script src="vendor/prism/prism-core.min.js" defer></script>
 *   <script src="vendor/prism/prism-markup.min.js" defer></script>
 *   <script src="extensions/onyx-code.js" defer></script>
 *
 * Markup attributes (read from the <pre class="ox-code">)
 *   data-lang="html|css|js|json|…"  opt in to highlighting; omit for plain text
 *   data-title="index.html"         toolbar caption
 *   data-copy-label                 idle button label, follows <html lang>
 *   data-copied-label               success label
 *   data-failed-label               failure label
 *
 * Public API
 *   OnyxUI.copy(text)                → Promise, best available clipboard path
 *   OnyxUI.codeblock.init(root?)     wrap + fill after injecting markup
 *   OnyxUI.codeblock.highlight(pre)  re-run highlighting on a single block
 *   OnyxUI.codeblock.labels          button wording
 * ========================================================================== */


(function (root, factory) {
  if (typeof module === 'object' && module.exports) { module.exports = factory; }
  else { factory(root.OnyxUI); }
})(typeof window !== 'undefined' ? window : this, function (OnyxUI) {
  'use strict';

  if (!OnyxUI || !OnyxUI.util) {
    if (typeof console !== 'undefined' && console.warn) {
      console.warn('[OnyxUI] extensions/onyx-code.js must be loaded after onyx-ui.js');
    }
    return;
  }

  var doc = document;
  var closest = OnyxUI.util.closest;
  var on = OnyxUI.util.on;

  /* ──────────────────────────────────────────────────── code container ── */

  /* Button wording follows <html lang>, because nobody wants an English
     "Copy" inside a Chinese page. Override globally with
     `OnyxUI.codeblock.labels.copy = '…'` or per block with data-* attributes. */
  var COPY_LABELS = { copy: 'Copy', copied: 'Copied', failed: 'Copy manually' };
  if (/^zh/i.test(doc.documentElement.getAttribute('lang') || '')) {
    COPY_LABELS = { copy: '复制', copied: '已复制', failed: '手动复制' };
  }

  /* Secure contexts get the async clipboard; a LAN preview over http:// is not
     a secure context, so the textarea + execCommand path still earns its keep. */
  function copyText(value) {
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(value);
    }
    return new Promise(function (resolve, reject) {
      var probe = doc.createElement('textarea');
      probe.value = value;
      probe.setAttribute('readonly', '');
      probe.style.position = 'fixed';
      probe.style.top = '-1000px';
      probe.style.opacity = '0';
      doc.body.appendChild(probe);
      probe.select();
      probe.setSelectionRange(0, probe.value.length);
      var ok = false;
      try { ok = doc.execCommand('copy'); } catch (err) { ok = false; }
      doc.body.removeChild(probe);
      if (ok) resolve(); else reject(new Error('copy unavailable'));
    });
  }

  function preOf(block) {
    return block ? block.querySelector('.ox-code') : null;
  }

  /* Give a container its toolbar. Markup that already ships one keeps it. */
  function fillBar(block) {
    var pre = preOf(block);
    if (!pre) return null;

    var bar = block.querySelector('.ox-codeblock__bar');
    if (!bar) {
      bar = doc.createElement('div');
      bar.className = 'ox-codeblock__bar';
      block.insertBefore(bar, pre);
    }

    var title = pre.getAttribute('data-title');
    if (title && !bar.querySelector('.ox-codeblock__title')) {
      var caption = doc.createElement('span');
      caption.className = 'ox-codeblock__title';
      caption.textContent = title;
      bar.insertBefore(caption, bar.firstChild);
    }

    if (!bar.querySelector('.ox-codeblock__copy')) {
      var button = doc.createElement('button');
      button.type = 'button';
      button.className = 'ox-btn ox-btn--ghost ox-btn--xs ox-codeblock__copy';
      button.textContent = pre.getAttribute('data-copy-label') || COPY_LABELS.copy;
      bar.appendChild(button);
    }
    return bar;
  }

  /* ── highlighting (delegated) ────────────────────────────────────────── */

  /**
   * Hand one block to whichever engine is on the page. Returns false when
   * there is nothing to do, so callers can tell "plain on purpose" apart from
   * "engine missing" without any guessing of our own.
   *
   * The engine must already be loaded: this extension is deliberately
   * engine-agnostic and will not pull one in by itself.
   */
  function highlight(pre) {
    if (!pre) return false;
    var lang = pre.getAttribute('data-lang');
    if (!lang || pre.getAttribute('data-ox-highlighted') === '1') return false;

    var text = pre.textContent;
    var out = null;

    if (window.Prism && window.Prism.languages && window.Prism.languages[lang]) {
      out = window.Prism.highlight(text, window.Prism.languages[lang], lang);
    } else if (window.hljs && window.hljs.getLanguage && window.hljs.getLanguage(lang)) {
      out = window.hljs.highlight(text, { language: lang, ignoreIllegals: true }).value;
    }
    if (out === null) return false;

    pre.innerHTML = out;
    pre.setAttribute('data-ox-highlighted', '1');
    return true;
  }

  function initCodeblocks(root) {
    var scope = root || doc;
    var blocks = [];

    Array.prototype.forEach.call(scope.querySelectorAll('.ox-code'), function (pre) {
      var parent = pre.parentElement;
      if (parent && parent.classList.contains('ox-codeblock')) {
        if (blocks.indexOf(parent) === -1) blocks.push(parent);
        return;
      }
      var wrap = doc.createElement('div');
      wrap.className = 'ox-codeblock';
      pre.parentNode.insertBefore(wrap, pre);
      wrap.appendChild(pre);
      blocks.push(wrap);
    });

    blocks.forEach(function (block) {
      if (block.getAttribute('data-ox-ready') === '1') return;
      block.setAttribute('data-ox-ready', '1');
      fillBar(block);
      /* `data-lang` is the opt-in: no attribute, no highlighting */
      highlight(block.querySelector('.ox-code'));
    });
  }

  function codeblockEvents() {
    on(doc, 'click', function (event) {
      var button = closest(event.target, '.ox-codeblock__copy');
      if (!button) return;
      var pre = preOf(closest(button, '.ox-codeblock'));
      if (!pre) return;

      var idle = pre.getAttribute('data-copy-label') || COPY_LABELS.copy;
      var done = pre.getAttribute('data-copied-label') || COPY_LABELS.copied;
      var failed = pre.getAttribute('data-failed-label') || COPY_LABELS.failed;

      var flash = function (text, state) {
        button.textContent = text;
        button.classList.remove('is-copied', 'is-failed');
        button.classList.add(state);
        clearTimeout(button.__oxCopy);
        button.__oxCopy = setTimeout(function () {
          button.textContent = idle;
          button.classList.remove('is-copied', 'is-failed');
        }, 1600);
      };

      copyText(pre.textContent).then(function () {
        flash(done, 'is-copied');
      }, function () {
        flash(failed, 'is-failed');
      });
    });
  }

  /* ── bootstrap ───────────────────────────────────────────────────────── */

  var bound = false;

  function setup(target) {
    initCodeblocks(target);
    if (bound) return;
    bound = true;
    codeblockEvents();
  }

  OnyxUI.onInit(setup);
  OnyxUI.copy = copyText;
  OnyxUI.codeblock = { init: initCodeblocks, highlight: highlight, labels: COPY_LABELS };
});
