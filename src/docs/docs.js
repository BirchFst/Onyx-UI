/* ============================================================================
   docs.js · behaviour for the Onyx UI documentation page ONLY.
   ----------------------------------------------------------------------------
   1. Theme switch (light / dark / follow system) with persistence
   2. Toast demonstrations wired to OnyxUI.toast()
   3. Sidebar scrollspy
   Code containers / copy buttons (`.ox-codeblock`) and dropdown behaviour are
   owned by onyx-ui.js — this page does not reimplement either.
   ========================================================================== */
(function () {
  'use strict';

  /* ------------------------------------------------------------------ 1 · theme */
  var THEME_KEY = 'onyx-theme';
  var root = document.documentElement;
  var toggle = document.getElementById('themeToggle');
  var toggleLabel = document.getElementById('themeLabel');
  var toggleIcon = document.getElementById('themeIcon');

  var ICON = {
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M19.1 4.9l-1.4 1.4M6.3 17.7l-1.4 1.4"/>',
    moon: '<path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5z"/>'
  };

  function systemPrefersDark() {
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  }
  function isDarkNow() {
    var attr = root.getAttribute('data-theme');
    if (attr === 'dark') return true;
    if (attr === 'light') return false;
    return systemPrefersDark();
  }
  function applyTheme(theme) {
    if (theme === 'light' || theme === 'dark') root.setAttribute('data-theme', theme);
    else root.removeAttribute('data-theme');
    var dark = isDarkNow();
    if (toggleLabel) toggleLabel.textContent = dark ? '切换浅色' : '切换深色';
    if (toggleIcon) toggleIcon.innerHTML = dark ? ICON.sun : ICON.moon;
    try { localStorage.setItem(THEME_KEY, theme || 'system'); } catch (e) { /* private mode */ }
  }

  var stored = 'system';
  try { stored = localStorage.getItem(THEME_KEY) || 'system'; } catch (e) { /* ignore */ }
  applyTheme(stored === 'system' ? null : stored);

  if (toggle) {
    toggle.addEventListener('click', function () {
      applyTheme(isDarkNow() ? 'light' : 'dark');
    });
  }

  /* Code containers (wrap + toolbar + copy) are built by onyx-ui.js — the
     library owns that now, so this page does not reimplement it. */

  /* ------------------------------------------------- 2 · toast demonstrations */
  /* Dropdown behaviour (outside click, Esc, arrow keys, edge flipping) lives in
     onyx-ui.js — the library owns it now, the page does not reimplement it. */
  function notify() {
    return window.OnyxUI || null;
  }

  var demos = {
    success: function (ui) {
      ui.toast.success({ title: '部署完成', description: 'release/2.4 已上线 3 个区域。' });
    },
    info: function (ui) {
      ui.toast.info({ title: '正在同步', description: '从远端拉取最新的 128 条变更…' });
    },
    warning: function (ui) {
      ui.toast.warning({ title: '磁盘空间不足', description: '剩余 8%，建议清理构建缓存。' });
    },
    danger: function (ui) {
      ui.toast.danger({ title: '构建失败', description: '2 个用例未通过 · release/2.4' });
    },
    action: function (ui) {
      ui.toast({
        variant: 'neutral',
        title: '已删除 1 个项目',
        description: 'web-app 已移入回收站。',
        duration: 6000,
        action: {
          label: '撤销',
          onClick: function () { ui.toast.success('已恢复 web-app'); }
        }
      });
    },
    sticky: function (ui) {
      ui.toast.info({
        title: '正在导出 12,480 条记录',
        description: '完成后会通知你，这条不会自动消失。',
        duration: 0
      });
    },
    update: function (ui) {
      var id = 'upload-demo';
      var step = 0;
      ui.toast.info({ id: id, title: '正在上传 report.pdf', description: '0%', duration: 0 });
      var tick = window.setInterval(function () {
        step += 20;
        if (step >= 100) {
          window.clearInterval(tick);
          ui.toast.success({
            id: id,
            title: '上传完成',
            description: 'report.pdf 已保存到「项目文件」。',
            duration: 3200
          });
        } else {
          ui.toast.update(id, { description: step + '%' });
        }
      }, 420);
    },
    bottom: function (ui) {
      ui.toast.success({ position: 'bottom-right', title: '草稿已保存', description: '刚刚同步到云端。' });
    },
    clear: function (ui) {
      ui.toast.clear();
    }
  };

  Array.prototype.forEach.call(document.querySelectorAll('[data-demo-toast]'), function (button) {
    button.addEventListener('click', function () {
      var ui = notify();
      var handler = demos[button.getAttribute('data-demo-toast')];
      if (ui && handler) handler(ui);
    });
  });

  var notifyBtn = document.getElementById('notifyBtn');
  if (notifyBtn) {
    notifyBtn.addEventListener('click', function () {
      var ui = notify();
      if (!ui) return;
      ui.toast.info({
        title: '3 条新通知',
        description: 'web-app 部署完成 · infra 磁盘告警 · 2 条评审请求',
        duration: 6000,
        action: { label: '全部已读', onClick: function () {} }
      });
    });
  }

  var hint = document.getElementById('copyTokenHint');
  if (hint) {
    hint.addEventListener('click', function () {
      var ui = notify();
      if (!ui) return;
      ui.toast({
        title: 'onyx-ui.css + onyx-ui.js',
        description: '样式文件负责全部视觉与状态；脚本只负责菜单交互与 toast 通知，可以按需引入。'
      });
    });
  }

  /* --------------------------------------------------------- 3 · sidebar spy */
  var links = Array.prototype.slice.call(document.querySelectorAll('.doc-sidebar a[href^="#"]'));
  var sections = links
    .map(function (link) { return document.querySelector(link.getAttribute('href')); })
    .filter(Boolean);

  if (links.length && sections.length && 'IntersectionObserver' in window) {
    var visible = new Map();

    var setActive = function (id) {
      links.forEach(function (link) {
        var on = link.getAttribute('href') === '#' + id;
        link.classList.toggle('is-active', on);
        if (on) link.setAttribute('aria-current', 'true');
        else link.removeAttribute('aria-current');
      });
    };

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) visible.set(entry.target.id, entry.boundingClientRect.top);
        else visible.delete(entry.target.id);
      });

      if (!visible.size) return;
      var top = null;
      visible.forEach(function (offset, id) {
        if (top === null || offset < visible.get(top)) top = id;
      });
      if (top) setActive(top);
    }, { rootMargin: '-88px 0px -55% 0px', threshold: 0 });

    sections.forEach(function (section) { observer.observe(section); });
  }
})();
