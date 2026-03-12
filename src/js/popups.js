(function () {
  'use strict';

  /* ── Detect path prefix from <base> tag or meta ── */
  var base = document.querySelector('base');
  var prefix = base ? base.getAttribute('href').replace(/\/$/, '') : '';

  function assetPath(path) {
    return prefix + path;
  }

  var popups = [
    {
      id: 'light-mode-announce',
      pages: ['page-nav'],
      image: assetPath('/img/news/3.jpg'),
      title: 'НОВО В МЕРИДИАН!',
      body: 'Както Луната не може без блясъка на Слънцето, така и Меридиан не може без режим за четене. Вече в долния ляв ъгъл на сайта, ще откриете бутон за превключване към новия ни светъл режим, така че да не тормозите излишно очите си и да продължавате да ни четете.',
      link: '/hronika/rejim-za-chetene/',
      linkText: 'Прочети повече'
    }
    // Add more popups here:
    // {
    //   id: 'new-issue-announce',
    //   pages: ['page-home', 'page-dest'],
    //   symbol: '✦',
    //   title: 'НОВ БРОЙ',
    //   body: 'Брой 5 вече е тук.',
    //   button: 'Към броя'
    // }
    //pages: ['page-nav']              // homepage only
    //pages: ['page-dest']              // all destination pages
    //pages: ['page-home', 'page-dest'] // both
    //pages: ['*']                      // every page
    //localStorage.removeItem('popup-light-mode-announce');
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
      html += '<div class="site-popup-image"><img src="' + cfg.image + '" alt=""></div>';
    }

    html +=
      '<div class="site-popup-content">' +
        '<h3 class="site-popup-title">' + cfg.title + '</h3>' +
        '<div class="site-popup-body">' + cfg.body + '</div>';

    if (cfg.link) {
      html += '<a href="' + cfg.link + '" class="site-popup-btn site-popup-link">' + cfg.linkText + '</a>';
    } else {
      html += '<button class="site-popup-btn">' + (cfg.button || 'Добре') + '</button>';
    }

    html += '</div>';

    dialog.innerHTML = html;
    overlay.appendChild(dialog);
    document.body.appendChild(overlay);

    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        overlay.classList.add('visible');
      });
    });

    function close() {
      overlay.classList.remove('visible');
      overlay.addEventListener('transitionend', function () {
        if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
      });
      dismiss(cfg.id);
    }

    dialog.querySelector('.site-popup-close').addEventListener('click', close);

    if (cfg.link) {
      dialog.querySelector('.site-popup-link').addEventListener('click', function () {
        dismiss(cfg.id);
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