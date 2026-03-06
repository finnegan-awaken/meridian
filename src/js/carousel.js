(function () {
  'use strict';

  var carousel = document.querySelector('.lavitsa-carousel');
  if (!carousel) return;

  var stage = carousel.querySelector('.carousel-stage');
  var cards = carousel.querySelectorAll('.carousel-card');
  var prevBtn = carousel.querySelector('.carousel-prev');
  var nextBtn = carousel.querySelector('.carousel-next');
  var indicator = document.querySelector('.carousel-indicator');

  var total = cards.length;
  if (total === 0) return;

  var current = 0;
  var isAnimating = false;
  var flippedCard = null;

  if (total <= 1) {
    if (prevBtn) prevBtn.style.display = 'none';
    if (nextBtn) nextBtn.style.display = 'none';
  }

  function mod(n, m) {
    return ((n % m) + m) % m;
  }

  function update() {
    if (flippedCard) {
      var fi = flippedCard.querySelector('.carousel-card-inner');
      if (fi) fi.classList.remove('flipped');
      flippedCard = null;
    }

    for (var i = 0; i < total; i++) {
      var card = cards[i];
      var offset = i - current;

      if (total > 2) {
        if (offset > Math.floor(total / 2)) offset -= total;
        if (offset < -Math.floor(total / 2)) offset += total;
      }

      card.className = 'carousel-card';
      card.style.pointerEvents = 'none';

      if (offset === 0) {
        card.classList.add('is-active');
        card.style.pointerEvents = 'auto';
      } else if (offset === -1) {
        card.classList.add('is-left');
      } else if (offset === 1) {
        card.classList.add('is-right');
      } else if (offset < -1) {
        card.classList.add('is-hidden-left');
      } else {
        card.classList.add('is-hidden-right');
      }
    }

    if (indicator) {
      var dots = indicator.querySelectorAll('.carousel-dot');
      for (var d = 0; d < dots.length; d++) {
        dots[d].classList.toggle('active', d === current);
      }
    }
  }

  function goNext() {
    if (isAnimating || total <= 1) return;
    isAnimating = true;
    current = mod(current + 1, total);
    update();
    setTimeout(function () { isAnimating = false; }, 700);
  }

  function goPrev() {
    if (isAnimating || total <= 1) return;
    isAnimating = true;
    current = mod(current - 1, total);
    update();
    setTimeout(function () { isAnimating = false; }, 700);
  }

  function flipCard(card) {
    var inner = card.querySelector('.carousel-card-inner');
    if (!inner) return;

    if (flippedCard === card) {
      inner.classList.remove('flipped');
      flippedCard = null;
    } else {
      if (flippedCard) {
        var prev = flippedCard.querySelector('.carousel-card-inner');
        if (prev) prev.classList.remove('flipped');
      }
      inner.classList.add('flipped');
      flippedCard = card;
    }

    card.classList.add('hint-hidden');
  }

  if (prevBtn) prevBtn.addEventListener('click', goPrev);
  if (nextBtn) nextBtn.addEventListener('click', goNext);

  for (var i = 0; i < total; i++) {
    (function (card) {
      card.addEventListener('click', function (e) {
        if (!card.classList.contains('is-active')) return;
        e.preventDefault();
        flipCard(card);
      });
    })(cards[i]);
  }

  if (stage) {
    var touchStartX = 0;
    var touchStartY = 0;

    stage.addEventListener('touchstart', function (e) {
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
    }, { passive: true });

    stage.addEventListener('touchend', function (e) {
      var dx = e.changedTouches[0].clientX - touchStartX;
      var dy = e.changedTouches[0].clientY - touchStartY;
      if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) {
        if (dx > 0) goPrev();
        else goNext();
      }
    }, { passive: true });
  }

  carousel.setAttribute('tabindex', '0');
  carousel.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowLeft') { e.preventDefault(); goPrev(); }
    else if (e.key === 'ArrowRight') { e.preventDefault(); goNext(); }
  });

  update();
})();