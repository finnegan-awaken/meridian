(function () {
  'use strict';

  /* ══════════════════════════════════════
     CONFIGURATION
     ══════════════════════════════════════ */
  var STORAGE_KEY = 'meridian-theme';
  var DEFAULT_THEME = 'dark';
  var THEMES = [
    {
      key: 'dark',
      label: 'Нощ',
      icon: '<svg viewBox="0 0 20 20"><path d="M15.5 11.5a7 7 0 0 1-7-7c0-.8.1-1.6.4-2.3A8 8 0 1 0 17.8 11a7 7 0 0 1-2.3.5z"/></svg>'
    },
    {
      key: 'light',
      label: 'Зора',
      icon: '<svg viewBox="0 0 20 20"><circle cx="10" cy="10" r="3.5"/><line x1="10" y1="2" x2="10" y2="4.5"/><line x1="10" y1="15.5" x2="10" y2="18"/><line x1="2" y1="10" x2="4.5" y2="10"/><line x1="15.5" y1="10" x2="18" y2="10"/><line x1="4.34" y1="4.34" x2="6.11" y2="6.11"/><line x1="13.89" y1="13.89" x2="15.66" y2="15.66"/><line x1="4.34" y1="15.66" x2="6.11" y2="13.89"/><line x1="13.89" y1="6.11" x2="15.66" y2="4.34"/></svg>'
    },
    {
      key: 'reading',
      label: 'Четене',
      icon: '<svg viewBox="0 0 20 20"><path d="M2 4c2-1.5 4.5-1.5 8-1v14c-3.5-.5-6-.5-8 1V4z"/><path d="M18 4c-2-1.5-4.5-1.5-8-1v14c3.5-.5 6-.5 8 1V4z"/></svg>'
    }
  ];

  /* ══════════════════════════════════════
     STATE
     ══════════════════════════════════════ */
  var currentTheme = DEFAULT_THEME;
  var isOpen = false;
  var container, btnEl, menuEl;

  /* ══════════════════════════════════════
     THEME APPLICATION
     ══════════════════════════════════════ */
  function applyTheme(theme) {
    currentTheme = theme;
    document.documentElement.setAttribute('data-theme', theme);

    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch (e) {
      /* localStorage unavailable */
    }

    updateButton();
    updateMenuActive();
  }

  function getThemeConfig(key) {
    for (var i = 0; i < THEMES.length; i++) {
      if (THEMES[i].key === key) return THEMES[i];
    }
    return THEMES[0];
  }

  /* ══════════════════════════════════════
     UI UPDATES
     ══════════════════════════════════════ */
  function updateButton() {
    if (!btnEl) return;
    var config = getThemeConfig(currentTheme);
    var iconEl = btnEl.querySelector('.theme-switcher-icon');
    if (iconEl) iconEl.innerHTML = config.icon;
    btnEl.setAttribute('aria-label', 'Тема: ' + config.label);
  }

  function updateMenuActive() {
    if (!menuEl) return;
    var options = menuEl.querySelectorAll('.theme-switcher-option');
    for (var i = 0; i < options.length; i++) {
      if (options[i].dataset.theme === currentTheme) {
        options[i].classList.add('active');
        options[i].setAttribute('aria-current', 'true');
      } else {
        options[i].classList.remove('active');
        options[i].removeAttribute('aria-current');
      }
    }
  }

  /* ══════════════════════════════════════
     DROPDOWN
     ══════════════════════════════════════ */
  function openMenu() {
    if (isOpen) return;
    isOpen = true;
    container.classList.add('open');
    btnEl.setAttribute('aria-expanded', 'true');

    /* Focus first option */
    var firstOption = menuEl.querySelector('.theme-switcher-option');
    if (firstOption) {
      setTimeout(function () { firstOption.focus(); }, 50);
    }
  }

  function closeMenu() {
    if (!isOpen) return;
    isOpen = false;
    container.classList.remove('open');
    btnEl.setAttribute('aria-expanded', 'false');
  }

  function toggleMenu() {
    if (isOpen) {
      closeMenu();
    } else {
      openMenu();
    }
  }

  /* ══════════════════════════════════════
     BUILD UI
     ══════════════════════════════════════ */
  function build() {
    container = document.createElement('div');
    container.className = 'theme-switcher';

    /* ── Button ── */
    btnEl = document.createElement('button');
    btnEl.type = 'button';
    btnEl.className = 'theme-switcher-btn';
    btnEl.setAttribute('aria-haspopup', 'true');
    btnEl.setAttribute('aria-expanded', 'false');
    btnEl.innerHTML = '<span class="theme-switcher-icon"></span>';

    /* ── Menu ── */
    menuEl = document.createElement('div');
    menuEl.className = 'theme-switcher-menu';
    menuEl.setAttribute('role', 'menu');

    for (var i = 0; i < THEMES.length; i++) {
      var opt = document.createElement('button');
      opt.type = 'button';
      opt.className = 'theme-switcher-option';
      opt.dataset.theme = THEMES[i].key;
      opt.setAttribute('role', 'menuitem');
      opt.innerHTML =
        '<span class="theme-switcher-option-icon">' + THEMES[i].icon + '</span>' +
        '<span>' + THEMES[i].label + '</span>';
      menuEl.appendChild(opt);
    }

    container.appendChild(menuEl);
    container.appendChild(btnEl);
    document.body.appendChild(container);

    updateButton();
    updateMenuActive();

    /* ── Events ── */
    btnEl.addEventListener('click', function (e) {
      e.stopPropagation();
      toggleMenu();
    });

    menuEl.addEventListener('click', function (e) {
      var option = e.target.closest('.theme-switcher-option');
      if (!option) return;
      e.stopPropagation();

      var theme = option.dataset.theme;
      if (theme && theme !== currentTheme) {
        applyTheme(theme);
      }
      closeMenu();
      btnEl.focus();
    });

    /* Close on outside click */
    document.addEventListener('click', function (e) {
      if (isOpen && !container.contains(e.target)) {
        closeMenu();
      }
    });

    /* Close on Escape */
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && isOpen) {
        closeMenu();
        btnEl.focus();
      }
    });

    /* Keyboard navigation within menu */
    menuEl.addEventListener('keydown', function (e) {
      var options = menuEl.querySelectorAll('.theme-switcher-option');
      var idx = -1;
      for (var j = 0; j < options.length; j++) {
        if (options[j] === document.activeElement) { idx = j; break; }
      }

      if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
        e.preventDefault();
        var prev = idx > 0 ? idx - 1 : options.length - 1;
        options[prev].focus();
      } else if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
        e.preventDefault();
        var next = idx < options.length - 1 ? idx + 1 : 0;
        options[next].focus();
      }
    });
  }

  /* ══════════════════════════════════════
     INIT
     ══════════════════════════════════════ */

  /* Read saved theme */
  try {
    var saved = localStorage.getItem(STORAGE_KEY);
    if (saved && (saved === 'dark' || saved === 'light' || saved === 'reading')) {
      currentTheme = saved;
    }
  } catch (e) {}

  /* Apply immediately (data-theme may already be set by inline script) */
  applyTheme(currentTheme);

  /* Build UI when DOM is ready */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', build);
  } else {
    build();
  }

})();