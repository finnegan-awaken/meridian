(function () {
  'use strict';

  var STARS = [
    {
      id: 'archive', name: 'АРХИВ', symbol: '🕮', num: 'I',
      sub: 'Capax infiniti',
      desc: 'Всяко ненаписано начало, всяка неизречена дума.',
      coords: 'α 0h 00m · δ +0° 00′',
      x: 50, y: 56, mag: 1, href: window.BASE + 'archive/'
    },
    {
      id: 'atlas', name: 'АТЛАС', symbol: '✵', num: 'II',
      sub: 'Experimentum Crucis',
      desc: 'Указател на неизследваните територии.',
      coords: 'α 5h 32m · δ +46° 01′',
      x: 24, y: 36, mag: 2, href: window.BASE + 'atlas/'
    },
    {
      id: 'codex', name: 'КОДЕКС', symbol: '☽', num: 'III',
      sub: 'Lasciate ogne speranza voi ch\'entrate',
      desc: 'Отвъд първия предел. Кои сме ние и какво търсим.',
      coords: 'α 18h 36m · δ +38° 47′',
      x: 76, y: 36, mag: 2, href: window.BASE + 'codex/'
    }
  ];

  /* Mobile-adjusted positions — more vertical spread */
  var MOBILE_STARS = {
    archive:   { x: 50, y: 65 },
    atlas:     { x: 30, y: 32 },
    codex: { x: 70, y: 32 }
  };

  var MOBILE_BREAKPOINT = 600;
  var resizeTimer;
  var isTouchDevice = false;
  var activeStarId = null;

  /* ══════════════════════════════════════
     HELPERS
     ══════════════════════════════════════ */
  function isMobile() {
    return window.innerWidth <= MOBILE_BREAKPOINT;
  }

  function pos(s) {
    var coords = s;
    if (isMobile() && MOBILE_STARS[s.id]) {
      coords = {
        x: MOBILE_STARS[s.id].x,
        y: MOBILE_STARS[s.id].y
      };
    }
    return {
      x: coords.x / 100 * window.innerWidth,
      y: coords.y / 100 * window.innerHeight
    };
  }

  function findStar(id) {
    for (var i = 0; i < STARS.length; i++) {
      if (STARS[i].id === id) return STARS[i];
    }
    return null;
  }

  /* ══════════════════════════════════════
     DETECT TOUCH
     ══════════════════════════════════════ */
  function detectTouch() {
    isTouchDevice = (
      'ontouchstart' in window ||
      navigator.maxTouchPoints > 0
    );
  }

  /* ══════════════════════════════════════
     BUILD STARS — Called once on init
     ══════════════════════════════════════ */
  function buildStars() {
    STARS.forEach(function (s, i) {
      var p = pos(s);

      var el = document.createElement('div');
      el.className = 'star mag-' + s.mag;
      el.dataset.id = s.id;
      el.setAttribute('role', 'button');
      el.setAttribute('tabindex', '0');
      el.setAttribute('aria-label', s.name + ' — ' + s.sub);
      el.setAttribute('aria-describedby', 'gloss-' + s.id);
      el.style.left = p.x + 'px';
      el.style.top = p.y + 'px';
      el.style.animationDelay = (0.2 + i * 0.25) + 's';
      el.innerHTML =
        '<div class="star-pulse" style="animation-delay:' + (i * 1.1) + 's"></div>' +
        '<div class="star-glow" style="animation-delay:' + (i * 0.7) + 's"></div>' +
        '<div class="star-core"></div>' +
        '<span class="star-label" aria-hidden="true">' + s.name + '</span>';
      document.body.appendChild(el);

      var g = document.createElement('div');
      g.className = 'gloss';
      g.id = 'gloss-' + s.id;
      g.dataset.for = s.id;
      g.setAttribute('role', 'tooltip');

      var right = s.x > 50, gw = 250, offset = 40;

      /* On mobile, position gloss below the star */
      if (isMobile()) {
        gw = Math.min(220, window.innerWidth - 32);
        g.style.width = gw + 'px';
        var gl = p.x - gw / 2;
        var gt = p.y + 50;
        gl = Math.max(16, Math.min(window.innerWidth - gw - 16, gl));
        gt = Math.min(window.innerHeight - 200, gt);
        g.style.left = gl + 'px';
        g.style.top = gt + 'px';
        right = false;
      } else {
        var gl = right ? p.x - offset - gw : p.x + offset;
        var gt = p.y - 35;
        gl = Math.max(16, Math.min(window.innerWidth - gw - 16, gl));
        gt = Math.max(16, Math.min(window.innerHeight - 180, gt));
        g.style.left = gl + 'px';
        g.style.top = gt + 'px';
      }

      g.innerHTML =
        '<div class="gloss-inner' + (right ? ' align-right' : '') + '">' +
          '<div class="gloss-numeral">' + s.num + ' · ' + s.symbol + '</div>' +
          '<div class="gloss-title">' + s.name + '</div>' +
          '<div class="gloss-subtitle">' + s.sub + '</div>' +
          '<span class="gloss-sep">· · ·</span>' +
          '<div class="gloss-desc">' + s.desc + '</div>' +
          '<div class="gloss-coords">' + s.coords + '</div>' +
        '</div>';
      document.body.appendChild(g);
    });
  }

  /* ══════════════════════════════════════
     UPDATE — Called on resize (debounced)
     ══════════════════════════════════════ */
  function updatePositions() {
    STARS.forEach(function (s) {
      var p = pos(s);

      var el = document.querySelector('.star[data-id="' + s.id + '"]');
      if (el) {
        el.style.left = p.x + 'px';
        el.style.top = p.y + 'px';
      }

      var g = document.querySelector('.gloss[data-for="' + s.id + '"]');
      if (g) {
        var right = s.x > 50, gw = 250, offset = 40;

        if (isMobile()) {
          gw = Math.min(220, window.innerWidth - 32);
          g.style.width = gw + 'px';
          var gl = p.x - gw / 2;
          var gt = p.y + 50;
          gl = Math.max(16, Math.min(window.innerWidth - gw - 16, gl));
          gt = Math.min(window.innerHeight - 200, gt);
          g.style.left = gl + 'px';
          g.style.top = gt + 'px';
        } else {
          g.style.width = '';
          var gl = right ? p.x - offset - gw : p.x + offset;
          var gt = p.y - 35;
          gl = Math.max(16, Math.min(window.innerWidth - gw - 16, gl));
          gt = Math.max(16, Math.min(window.innerHeight - 180, gt));
          g.style.left = gl + 'px';
          g.style.top = gt + 'px';
        }
      }
    });
  }

  /* ══════════════════════════════════════
     INTERACTION HANDLERS
     ══════════════════════════════════════ */
  function handleEnter(el) {
    var id = el.dataset.id;
    document.body.classList.add('constellation-hover');
    el.classList.add('hovered');

    var g = document.querySelector('.gloss[data-for="' + id + '"]');
    if (g) g.classList.add('visible');
  }

  function handleLeave(el) {
    var id = el.dataset.id;
    document.body.classList.remove('constellation-hover');
    el.classList.remove('hovered');

    var g = document.querySelector('.gloss[data-for="' + id + '"]');
    if (g) g.classList.remove('visible');
  }

  function clearAllActive() {
    document.body.classList.remove('constellation-hover');
    document.querySelectorAll('.star.hovered').forEach(function (s) {
      s.classList.remove('hovered');
    });
    document.querySelectorAll('.gloss.visible').forEach(function (g) {
      g.classList.remove('visible');
    });
    activeStarId = null;
  }

  function handleTouchActivate(el) {
    var id = el.dataset.id;

    /* Second tap on same star — navigate */
    if (activeStarId === id) {
      var star = findStar(id);
      if (star) {
        handleNavigate(el, star, null);
      }
      return;
    }

    /* First tap — show gloss */
    clearAllActive();
    activeStarId = id;
    handleEnter(el);
  }

  function handleNavigate(el, star, e) {
    var rect = el.getBoundingClientRect();
    var cx = (e && e.clientX) ? e.clientX : rect.left + rect.width / 2;
    var cy = (e && e.clientY) ? e.clientY : rect.top + rect.height / 2;

    for (var i = 0; i < 3; i++) {
      (function (delay) {
        setTimeout(function () {
          var r = document.createElement('div');
          r.className = 'ripple';
          r.style.left = cx + 'px';
          r.style.top = cy + 'px';
          document.body.appendChild(r);
          setTimeout(function () { r.remove(); }, 1700);
        }, delay);
      })(i * 140);
    }

    setTimeout(function () {
      window.meridianTransition(star.href, star.name, star.symbol);
    }, 400);
  }

  /* ══════════════════════════════════════
     BIND EVENTS — Called once after build
     ══════════════════════════════════════ */
  function bindEvents() {
    var stars = document.querySelectorAll('.star');
    for (var i = 0; i < stars.length; i++) {
      (function (el) {
        if (isTouchDevice) {
          /* Touch: first tap shows gloss, second tap navigates */
          el.addEventListener('click', function (e) {
            e.preventDefault();
            handleTouchActivate(el);
          });
        } else {
          /* Mouse */
          el.addEventListener('mouseenter', function () { handleEnter(el); });
          el.addEventListener('mouseleave', function () { handleLeave(el); });
          el.addEventListener('click', function (e) {
            var star = findStar(el.dataset.id);
            if (star) handleNavigate(el, star, e);
          });
        }

        /* Keyboard — works on both touch and desktop */
        el.addEventListener('focus', function () { handleEnter(el); });
        el.addEventListener('blur', function () { handleLeave(el); });
        el.addEventListener('keydown', function (e) {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            var star = findStar(el.dataset.id);
            if (star) handleNavigate(el, star, e);
          }
        });
      })(stars[i]);
    }

    /* Tap anywhere else to dismiss gloss on touch */
    if (isTouchDevice) {
      document.addEventListener('click', function (e) {
        if (!e.target.closest('.star')) {
          clearAllActive();
        }
      });
    }
  }

  /* ══════════════════════════════════════
     INIT
     ══════════════════════════════════════ */
  detectTouch();
  buildStars();
  bindEvents();

  window.addEventListener('resize', function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(updatePositions, 150);
  });
})();