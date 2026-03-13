(function () {
  'use strict';

  /* ── Detect path prefix from this script's own src ── */
  var prefix = '';
  var thisScript = document.querySelector('script[src*="popups"]');
  if (thisScript) {
    var src = thisScript.getAttribute('src');
    var idx = src.indexOf('/js/popups');
    if (idx > 0) prefix = src.substring(0, idx);
  }

  function assetPath(path) {
    return prefix + path;
  }

  //CLEAR STORAGE: localStorage.removeItem('popup-light-mode-announce');

  var popups = [
    {
      id: 'light-mode-announce',
      pages: ['page-dest'],
      image: assetPath('/img/news/3.jpg'),
      title: 'НОВО В МЕРИДИАН!',
      body: 'Както Луната не може без блясъка на Слънцето, така и Меридиан не може без режим за четене. Вече в долния ляв ъгъл на сайта, ще откриете бутон за превключване към новия ни светъл режим, така че да не тормозите излишно очите си и да продължавате да ни четете.',
      link: assetPath('/hronika/rejim-za-chetene/'),
      linkText: 'Прочети повече',
      linkLabel: 'Режим за четене в Меридиан!',
      linkSymbol: '✧'
    }
  ];

  var bodyClass = document.body.className;

  function matchesPage(pageList) {
    if (pageList.indexOf('*') !== -1) return true;
    for (var i = 0; i < pageList.length; i++) {
      if (bodyClass.indexOf(pageList[i]) !== -1) return true;
    }
    return false;
  }

  function isDismissed(id) {
    try {
      return localStorage.getItem('popup-' + id) === '1';
    } catch (e) {
      return false;
    }
  }

  function dismiss(id) {
    try {
      localStorage.setItem('popup-' + id, '1');
    } catch (e) { /* silent */ }
  }

  function lockScroll() {
    document.body.dataset.popupScrollY = window.scrollY;
    document.body.style.top = '-' + window.scrollY + 'px';
    document.body.style.position = 'fixed';
    document.body.style.width = '100%';
    document.body.style.overflow = 'hidden';
  }

  function unlockScroll() {
    var scrollY = parseInt(document.body.dataset.popupScrollY || '0', 10);
    document.body.style.position = '';
    document.body.style.top = '';
    document.body.style.width = '';
    document.body.style.overflow = '';
    window.scrollTo(0, scrollY);
  }

  function showPopup(cfg) {
    var overlay = document.createElement('div');
    overlay.className = 'site-popup-overlay';

    var dialog = document.createElement('div');
    dialog.className = 'site-popup';
    dialog.setAttribute('role', 'dialog');
    dialog.setAttribute('aria-modal', 'true');
    dialog.setAttribute('aria-label', cfg.title);

    var html =
      '<button class="site-popup-close" aria-label="Затвори"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><line x1="6" y1="6" x2="18" y2="18"/><line x1="18" y1="6" x2="6" y2="18"/></svg></button>';

    if (cfg.image) {
      html += '<div class="site-popup-image"><img src="' + cfg.image + '" alt="" onerror="this.parentNode.style.display=\'none\'"></div>';
    }

    html +=
      '<div class="site-popup-content">' +
        '<h3 class="site-popup-title">' + cfg.title + '</h3>' +
        '<div class="site-popup-body">' + cfg.body + '</div>';

    if (cfg.link) {
      html += '<a href="' + cfg.link + '" class="site-popup-btn site-popup-link"' +
        ' data-transition' +
        ' data-label="' + (cfg.linkLabel || cfg.title) + '"' +
        ' data-symbol="' + (cfg.linkSymbol || '✦') + '"' +
        '>' + cfg.linkText + '</a>';
    } else {
      html += '<button class="site-popup-btn">' + (cfg.button || 'Добре') + '</button>';
    }

    html += '</div>';

    dialog.innerHTML = html;
    overlay.appendChild(dialog);
    document.body.appendChild(overlay);

    lockScroll();

    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        overlay.classList.add('visible');
      });
    });

    function close() {
      overlay.classList.remove('visible');
      unlockScroll();
      overlay.addEventListener('transitionend', function () {
        if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
      });
      dismiss(cfg.id);
    }

    function killInstantly() {
      overlay.style.transition = 'none';
      overlay.style.opacity = '0';
      overlay.style.pointerEvents = 'none';
      unlockScroll();
      dismiss(cfg.id);
      setTimeout(function () {
        if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
      }, 50);
    }

    dialog.querySelector('.site-popup-close').addEventListener('click', close);

    if (cfg.link) {
      dialog.querySelector('.site-popup-link').addEventListener('click', function (e) {
        e.preventDefault();
        var href = this.getAttribute('href');
        var label = this.getAttribute('data-label');
        var symbol = this.getAttribute('data-symbol');

        killInstantly();

        var fakeLink = document.createElement('a');
        fakeLink.href = href;
        fakeLink.setAttribute('data-transition', '');
        fakeLink.setAttribute('data-label', label);
        fakeLink.setAttribute('data-symbol', symbol);
        fakeLink.style.display = 'none';
        document.body.appendChild(fakeLink);
        fakeLink.click();
        setTimeout(function () {
          if (fakeLink.parentNode) fakeLink.parentNode.removeChild(fakeLink);
        }, 100);
      });
    } else {
      dialog.querySelector('.site-popup-btn').addEventListener('click', close);
    }

    overlay.addEventListener('click', function (e) {
      if (e.target === overlay) close();
    });

    document.addEventListener('keydown', function handler(e) {
      if (e.key === 'Escape') {
        close();
        document.removeEventListener('keydown', handler);
      }
    });
  }

  function init() {
    for (var i = 0; i < popups.length; i++) {
      var p = popups[i];
      if (matchesPage(p.pages) && !isDismissed(p.id)) {
        showPopup(p);
        break;
      }
    }
  }

  if (document.readyState === 'complete') {
    setTimeout(init, 500);
  } else {
    window.addEventListener('load', function () {
      setTimeout(init, 500);
    });
  }
})();