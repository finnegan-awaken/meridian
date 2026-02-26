(function () {
  'use strict';

  /* ══════════════════════════════════════
     ASSET PATH HELPER
     ══════════════════════════════════════ */
  function assetUrl(path) {
    if (!path) return '';
    return path.charAt(0) === '/' ? window.BASE + path.slice(1) : path;
  }

  /* ══════════════════════════════════════
     DATA
     ══════════════════════════════════════ */
  var cardDataEl = document.getElementById('tarot-card-data');
  var articleDataEl = document.getElementById('tarot-article-data');
  if (!cardDataEl) return;

  var ALL_CARDS = JSON.parse(cardDataEl.textContent);
  var ALL_ARTICLES = [];
  try { ALL_ARTICLES = JSON.parse(articleDataEl.textContent); } catch (e) {}

  var articlesByTarot = {};
  for (var a = 0; a < ALL_ARTICLES.length; a++) {
    var art = ALL_ARTICLES[a];
    var tags = art.tarot;
    if (typeof tags === 'string') tags = [tags];
    if (tags && tags.length) {
      for (var t = 0; t < tags.length; t++) {
        if (!articlesByTarot[tags[t]]) articlesByTarot[tags[t]] = [];
        articlesByTarot[tags[t]].push(art);
      }
    }
  }

  var POSITION_LABELS = ['Минало', 'Бъдеще', 'Настояще'];

  /* ══════════════════════════════════════
     STATE
     ══════════════════════════════════════ */
  var state = 'idle';
  var drawnCards = [];
  var usedArticleUrls = [];
  var previousFocus = null;

  /* ══════════════════════════════════════
     DOM REFS
     ══════════════════════════════════════ */
  var trigger, overlay, closeBtn;
  var revealedContainer, spreadLabel, spreadContainer;

  /* ══════════════════════════════════════
     HELPERS
     ══════════════════════════════════════ */
  function shuffle(arr) {
    var copy = arr.slice();
    for (var i = copy.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = copy[i];
      copy[i] = copy[j];
      copy[j] = tmp;
    }
    return copy;
  }

  function esc(str) {
    var div = document.createElement('div');
    div.appendChild(document.createTextNode(str));
    return div.innerHTML;
  }

  function getArticleForCard(cardKey) {
    var pool = articlesByTarot[cardKey];
    if (!pool || !pool.length) return null;

    var available = [];
    for (var i = 0; i < pool.length; i++) {
      var alreadyUsed = false;
      for (var j = 0; j < usedArticleUrls.length; j++) {
        if (pool[i].url === usedArticleUrls[j]) {
          alreadyUsed = true;
          break;
        }
      }
      if (!alreadyUsed) available.push(pool[i]);
    }

    if (!available.length) return null;
    var selected = available[Math.floor(Math.random() * available.length)];
    usedArticleUrls.push(selected.url);
    return selected;
  }

  /* ══════════════════════════════════════
     FOCUS TRAP
     ══════════════════════════════════════ */
  function getFocusable() {
    if (!overlay) return [];
    return overlay.querySelectorAll(
      'button, [href], [tabindex]:not([tabindex="-1"])'
    );
  }

  function handleTrapKeydown(e) {
    if (e.key !== 'Tab') return;
    var focusable = getFocusable();
    if (!focusable.length) return;

    var first = focusable[0];
    var last = focusable[focusable.length - 1];

    if (e.shiftKey) {
      if (document.activeElement === first) {
        e.preventDefault();
        last.focus();
      }
    } else {
      if (document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  }

  /* ══════════════════════════════════════
     BUILD TRIGGER
     ══════════════════════════════════════ */
  function buildTrigger() {
    trigger = document.createElement('button');
    trigger.type = 'button';
    trigger.className = 'tarot-trigger';
    trigger.setAttribute('aria-label', 'Питай съдбата — отвори таро');
    trigger.innerHTML =
      '<div class="tarot-trigger-glow"></div>' +
      '<div class="tarot-trigger-stack">' +
        '<div class="tarot-trigger-card tarot-trigger-card-back-2">' +
          triggerCardInner() +
        '</div>' +
        '<div class="tarot-trigger-card tarot-trigger-card-back-1">' +
          triggerCardInner() +
        '</div>' +
        '<div class="tarot-trigger-card tarot-trigger-card-top">' +
          triggerCardInner() +
        '</div>' +
      '</div>' +
      '<div class="tarot-trigger-text" aria-hidden="true">Питай съдбата</div>';
    document.body.appendChild(trigger);
    trigger.addEventListener('click', openTarot);

    setTimeout(function () {
      trigger.classList.add('visible');
    }, 3500);
  }

  function triggerCardInner() {
    return (
      '<img src="' + assetUrl('/img/tarot/card-back.png') + '" alt=""' +
        ' onerror="this.style.display=\'none\';this.nextElementSibling.style.display=\'flex\'">' +
      '<div class="tarot-trigger-fallback">' +
        '<div class="tarot-trigger-fb-symbol">✦</div>' +
        '<div class="tarot-trigger-fb-ornament">· · ·</div>' +
      '</div>'
    );
  }

  /* ══════════════════════════════════════
     BUILD OVERLAY
     ══════════════════════════════════════ */
  function buildOverlay() {
    overlay = document.createElement('div');
    overlay.className = 'tarot-overlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-label', 'Таро — Избери три карти');
    overlay.setAttribute('aria-hidden', 'true');
    overlay.innerHTML =
      '<button class="tarot-close" aria-label="Затвори таро">✕</button>' +
      '<div class="tarot-revealed" aria-live="polite"></div>' +
      '<div class="tarot-spread-section">' +
        '<div class="tarot-spread-label">Избери карта</div>' +
        '<div class="tarot-spread" role="group" aria-label="Разпръснати карти"></div>' +
      '</div>';
    document.body.appendChild(overlay);

    closeBtn = overlay.querySelector('.tarot-close');
    revealedContainer = overlay.querySelector('.tarot-revealed');
    spreadLabel = overlay.querySelector('.tarot-spread-label');
    spreadContainer = overlay.querySelector('.tarot-spread');

    closeBtn.addEventListener('click', closeTarot);
    overlay.addEventListener('click', function (e) {
      if (e.target === overlay) closeTarot();
    });
    overlay.addEventListener('keydown', handleTrapKeydown);
  }

  /* ══════════════════════════════════════
     OPEN TAROT
     ══════════════════════════════════════ */
  function openTarot() {
    if (state !== 'idle') return;
    state = 'spread';
    drawnCards = [];
    usedArticleUrls = [];
    previousFocus = document.activeElement;

    var spreadCards = shuffle(ALL_CARDS).slice(0, 12);

    spreadContainer.innerHTML = '';
    revealedContainer.innerHTML = '';
    spreadLabel.textContent = 'Избери карта';
    spreadLabel.classList.remove('tarot-hidden');
    spreadContainer.classList.remove('exhausted');
    revealedContainer.className = 'tarot-revealed';

    for (var i = 0; i < spreadCards.length; i++) {
      spreadContainer.appendChild(
        createSpreadCard(spreadCards[i], i, spreadCards.length)
      );
    }

    overlay.classList.remove('closing');
    overlay.classList.add('active');
    overlay.setAttribute('aria-hidden', 'false');
    trigger.classList.add('hidden');
    document.body.classList.add('tarot-active');

    var els = spreadContainer.querySelectorAll('.tarot-spread-card');
    for (var j = 0; j < els.length; j++) {
      (function (el, delay) {
        setTimeout(function () { el.classList.add('dealt'); }, 300 + delay);
      })(els[j], j * 100);
    }

    setTimeout(function () {
      closeBtn.focus();
    }, 500);
  }

  /* ══════════════════════════════════════
     CLOSE TAROT
     ══════════════════════════════════════ */
  function closeTarot() {
    document.body.classList.remove('tarot-active');
    overlay.classList.add('closing');
    overlay.setAttribute('aria-hidden', 'true');

    setTimeout(function () {
      overlay.classList.remove('active');
      overlay.classList.remove('closing');
      state = 'idle';
      drawnCards = [];
      usedArticleUrls = [];
      trigger.classList.remove('hidden');

      if (previousFocus && previousFocus.focus) {
        previousFocus.focus();
      } else {
        trigger.focus();
      }
      previousFocus = null;
    }, 700);
  }

  /* ══════════════════════════════════════
     CREATE SPREAD CARD
     ══════════════════════════════════════ */
  function createSpreadCard(card, index, total) {
    var el = document.createElement('div');
    el.className = 'tarot-spread-card';
    el.dataset.key = card.key;
    el.setAttribute('role', 'button');
    el.setAttribute('tabindex', '0');
    el.setAttribute('aria-label', 'Карта ' + (index + 1) + ' от ' + total);

    var center = (total - 1) / 2;
    var rotation = (index - center) * 3.5;
    var yOffset = Math.abs(index - center) * 3;

    el.style.setProperty('--spread-index', index);
    el.style.setProperty('--spread-rotation', rotation + 'deg');
    el.style.setProperty('--spread-y-offset', yOffset + 'px');

    el.innerHTML =
      '<div class="tarot-card">' +
        '<div class="tarot-card-inner">' +
          cardFaceBack() +
          cardFaceFront(card) +
        '</div>' +
      '</div>';

    (function (c, e) {
      e.addEventListener('click', function () { drawCard(c, e); });
      e.addEventListener('keydown', function (ev) {
        if (ev.key === 'Enter' || ev.key === ' ') {
          ev.preventDefault();
          drawCard(c, e);
        }
      });
    })(card, el);

    return el;
  }

  function cardFaceBack() {
    return (
      '<div class="tarot-card-face tarot-card-back">' +
        '<img src="' + assetUrl('/img/tarot/card-back.png') + '" alt=""' +
          ' onerror="this.style.display=\'none\';this.nextElementSibling.style.display=\'flex\'">' +
        '<div class="tarot-card-fallback-back">' +
          '<div class="tarot-fb-border"></div>' +
          '<div class="tarot-fb-symbol">✦</div>' +
          '<div class="tarot-fb-ornament">· · ·</div>' +
        '</div>' +
      '</div>'
    );
  }

  function cardFaceFront(card) {
    return (
      '<div class="tarot-card-face tarot-card-front">' +
        '<img src="' + assetUrl(card.image) + '" alt="' + esc(card.name) + '"' +
          ' onerror="this.style.display=\'none\';this.nextElementSibling.style.display=\'flex\'">' +
        '<div class="tarot-card-fallback-front">' +
          '<div class="tarot-fb-numeral">' + card.numeral + '</div>' +
          '<div class="tarot-fb-name">' + esc(card.name).toUpperCase() + '</div>' +
          '<div class="tarot-fb-meaning">' + esc(card.meaning) + '</div>' +
        '</div>' +
      '</div>'
    );
  }

  /* ══════════════════════════════════════
     DRAW CARD
     ══════════════════════════════════════ */
  function drawCard(card, spreadEl) {
    if (drawnCards.length >= 3) return;
    if (spreadEl.classList.contains('drawn')) return;

    spreadEl.classList.add('drawn');
    spreadEl.setAttribute('tabindex', '-1');
    spreadEl.setAttribute('aria-hidden', 'true');
    drawnCards.push({ card: card });

    setTimeout(function () {
      createRevealedCard(card, drawnCards.length);
      rearrangeRevealed();
      updateSpreadLabel();

      if (drawnCards.length >= 3) {
        spreadContainer.classList.add('exhausted');
        spreadLabel.classList.add('tarot-hidden');
      }
    }, 300);
  }

  /* ══════════════════════════════════════
     CREATE REVEALED CARD
     ══════════════════════════════════════ */
  function createRevealedCard(card, drawNumber) {
    var article = getArticleForCard(card.key);

    var el = document.createElement('div');
    el.className = 'tarot-revealed-card';
    el.dataset.draw = drawNumber;

    var posLabel = POSITION_LABELS[drawNumber - 1];

    var articleHTML = '';
    if (article) {
      articleHTML =
        '<a href="' + window.BASE + article.url.replace(/^\//, '') + '" class="tarot-article-link"' +
          ' data-transition data-label="' + esc(article.title) +
          '" data-symbol="✦">' +
          '<span class="tarot-article-arrow">→</span>' +
          '<span class="tarot-article-title">' + esc(article.title) + '</span>' +
        '</a>';
    }
    
    el.innerHTML =
      '<div class="tarot-revealed-position">' + posLabel + '</div>' +
      '<div class="tarot-card tarot-card-large">' +
        '<div class="tarot-card-inner">' +
          cardFaceBack() +
          cardFaceFront(card) +
        '</div>' +
      '</div>' +
      '<div class="tarot-revealed-info">' +
        '<div class="tarot-revealed-meaning">' + esc(card.meaning) + '</div>' +
        '<div class="tarot-revealed-desc">' + esc(card.description) + '</div>' +
        articleHTML +
      '</div>';

    revealedContainer.appendChild(el);

    setTimeout(function () {
      el.classList.add('entered');
    }, 50);

    setTimeout(function () {
      el.classList.add('flipped');
    }, 600);

    setTimeout(function () {
      el.classList.add('info-visible');
    }, 1200);
  }

  /* ══════════════════════════════════════
     REARRANGE REVEALED CARDS
     ══════════════════════════════════════ */
  function rearrangeRevealed() {
    var cards = revealedContainer.querySelectorAll('.tarot-revealed-card');
    var count = cards.length;

    for (var i = 0; i < cards.length; i++) {
      cards[i].classList.remove('pos-left', 'pos-center', 'pos-right');
    }

    revealedContainer.className = 'tarot-revealed count-' + count;

    if (count === 1) {
      cards[0].classList.add('pos-center');
    } else if (count === 2) {
      cards[0].classList.add('pos-left');
      cards[1].classList.add('pos-center');
    } else if (count === 3) {
      cards[0].classList.add('pos-left');
      cards[1].classList.add('pos-right');
      cards[2].classList.add('pos-center');
    }
  }

  /* ══════════════════════════════════════
     UPDATE SPREAD LABEL
     ══════════════════════════════════════ */
  function updateSpreadLabel() {
    var remaining = 3 - drawnCards.length;
    if (remaining <= 0) {
      spreadLabel.classList.add('tarot-hidden');
    } else if (remaining === 1) {
      spreadLabel.textContent = 'Избери още 1 карта';
    } else {
      spreadLabel.textContent = 'Избери още ' + remaining + ' карти';
    }
  }

  /* ══════════════════════════════════════
     KEYBOARD
     ══════════════════════════════════════ */
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && overlay && overlay.classList.contains('active')) {
      closeTarot();
    }
  });

  /* ══════════════════════════════════════
     INIT
     ══════════════════════════════════════ */
  buildOverlay();
  buildTrigger();

})();