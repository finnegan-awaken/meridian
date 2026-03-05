(function () {
  'use strict';

  /* ══════════════════════════════════════
     SVG SYMBOL HANDLING
     ══════════════════════════════════════ */
  var SVG_SYMBOLS = ['book', 'pen', 'moon', 'compass','scroll', 'candle'];

  function isSvgSymbol(symbol) {
    return SVG_SYMBOLS.indexOf(symbol) !== -1;
  }

  function renderSymbol(symbol) {
    if (isSvgSymbol(symbol)) {
      return '<img src="' + window.BASE + 'img/svg/' + symbol + '.svg" alt="">';
    }
    return symbol;
  }

  function setSymbol(el, symbol) {
    if (!el) return;
    if (isSvgSymbol(symbol)) {
      el.innerHTML = '<img src="' + window.BASE + 'img/svg/' + symbol + '.svg" alt="">';
    } else {
      el.textContent = symbol;
    }
  }

  /* ══════════════════════════════════════
     TRANSITION — Outbound
     ══════════════════════════════════════ */
  window.meridianTransition = function (href, label, symbol) {
    sessionStorage.setItem('meridian-transit', JSON.stringify({
      label: label || '',
      symbol: symbol || '✦'
    }));

    document.body.classList.add('is-leaving');

    var overlay = document.getElementById('transition');
    var symEl  = document.getElementById('transition-symbol');
    var textEl = document.getElementById('transition-text');

    setSymbol(symEl, symbol || '✦');
    if (textEl) textEl.textContent = label || '';
    if (overlay) overlay.classList.add('active');

    setTimeout(function () {
      window.location.href = href;
    }, 1100);
  };

  /* ══════════════════════════════════════
     LINK INTERCEPTION
     Any element with [data-transition]
     ══════════════════════════════════════ */
  document.addEventListener('click', function (e) {
    var link = e.target.closest('[data-transition]');
    if (!link) return;
    e.preventDefault();
    var href   = link.getAttribute('href') || link.dataset.href;
    var label  = link.getAttribute('data-label')  || '';
    var symbol = link.getAttribute('data-symbol') || '✦';
    var from   = link.getAttribute('data-from');
    if (from) {
      sessionStorage.setItem('meridian-from', from);
    } else {
      sessionStorage.removeItem('meridian-from');
    }
    window.meridianTransition(href, label, symbol);
  });

  /* ══════════════════════════════════════
     TRANSITION — Force-clear overlay
     Used by bfcache restore & safety net
     ══════════════════════════════════════ */
  function clearTransition() {
    var overlay = document.getElementById('transition');
    if (overlay) {
      /* Suppress the fade animation — just kill it instantly */
      overlay.classList.add('no-transition');
      overlay.classList.remove('active');
      /* Re-enable transitions next frame */
      requestAnimationFrame(function () {
        requestAnimationFrame(function () {
          overlay.classList.remove('no-transition');
        });
      });
    }
    document.body.classList.remove('is-leaving');
  }

  /* ══════════════════════════════════════
     TRANSITION — Arrival (normal navigation)
     ══════════════════════════════════════ */
  function handleArrival() {
    var overlay = document.getElementById('transition');
    if (!overlay) return;

    var raw = sessionStorage.getItem('meridian-transit');

    if (raw) {
      sessionStorage.removeItem('meridian-transit');
      var data   = JSON.parse(raw);
      var symEl  = document.getElementById('transition-symbol');
      var textEl = document.getElementById('transition-text');

      setSymbol(symEl, data.symbol);
      if (textEl) textEl.textContent = data.label;

      overlay.classList.add('active');
      overlay.classList.add('no-transition');

      function fadeOut() {
        requestAnimationFrame(function () {
          requestAnimationFrame(function () {
            overlay.classList.remove('no-transition');
            overlay.classList.remove('active');
            document.body.classList.remove('is-leaving');
          });
        });
      }

      if (document.readyState === 'complete') {
        fadeOut();
      } else {
        window.addEventListener('load', fadeOut);
      }
    } else {
      /* No transit data — make sure overlay is hidden */
      clearTransition();
    }
  }

  /* ══════════════════════════════════════
     BFCACHE — Browser back / forward
     When the browser restores a cached page
     the overlay may still be in its "active"
     state. pageshow fires in that case.
     ══════════════════════════════════════ */
  window.addEventListener('pageshow', function (e) {
    if (e.persisted) {
      /* Page was restored from bfcache */
      clearTransition();
    }
  });

  /* ══════════════════════════════════════
     SAFETY NET
     If the overlay is somehow stuck after
     3 seconds, force-remove it.
     ══════════════════════════════════════ */
  setTimeout(function () {
    var overlay = document.getElementById('transition');
    if (overlay && overlay.classList.contains('active')) {
      clearTransition();
    }
  }, 3000);

  /* ══════════════════════════════════════
     INIT
     ══════════════════════════════════════ */
  handleArrival();

})();