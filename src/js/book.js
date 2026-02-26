(function () {
  'use strict';

  /* ══════════════════════════════════════
     DOM REFERENCES & STATE
     ══════════════════════════════════════ */
  var bookContainer = document.querySelector('.book-container');
  var book = document.querySelector('.book');
  if (!book || !bookContainer) return;

  var allSheets = book.querySelectorAll('.book-page');
  var totalSheets = allSheets.length;
  var currentSheet = 0;
  var isAnimating = false;

  var FLIP_DURATION = 900;
  var SNAP_DURATION = 700;
  var FLIP_EASING = 'cubic-bezier(0.645, 0.045, 0.355, 1)';

  var dragging = false;
  var dragSheet = null;
  var dragDirection = null;
  var dragStartX = 0;
  var dragStartTime = 0;
  var pageWidth = 0;
  var dragProgress = 0;

  var CLICK_DISTANCE = 10;
  var CLICK_TIME = 300;
  var FLIP_codex = 0.25;

  /* ══════════════════════════════════════
     BOOK AMBIENT AUDIO
     Starts only after first user interaction
     ══════════════════════════════════════ */
  var BOOK_AUDIO_PATH = window.BASE + 'img/book.mp3';
  var bookAudio = null;
  var audioStarted = false;

  function fadeAudioTo(audioObj, target, duration, callback) {
    if (!audioObj) { if (callback) callback(); return; }
    var start = audioObj.volume;
    var diff = target - start;
    var steps = Math.max(1, Math.floor(duration / 30));
    var step = 0;
    var interval = setInterval(function () {
      step++;
      if (!audioObj) { clearInterval(interval); if (callback) callback(); return; }
      audioObj.volume = Math.max(0, Math.min(1, start + diff * (step / steps)));
      if (step >= steps) {
        clearInterval(interval);
        if (callback) callback();
      }
    }, 30);
  }

  function startBookAudio() {
    if (audioStarted) return;
    audioStarted = true;
    bookAudio = new Audio(BOOK_AUDIO_PATH);
    bookAudio.volume = 0;
    bookAudio.loop = true;
    bookAudio.play().catch(function () {});
    setTimeout(function () {
      fadeAudioTo(bookAudio, 0.25, 3000);
    }, 2000);
  }

  function cleanupAudio() {
    if (bookAudio) {
      bookAudio.pause();
      bookAudio = null;
    }
  }

  window.addEventListener('beforeunload', cleanupAudio);
  window.addEventListener('pagehide', cleanupAudio);

  /* ══════════════════════════════════════
     CLASSIFY SHEETS & SET GRADUATED WIDTHS
     ══════════════════════════════════════ */
  function classifySheets() {
    allSheets[0].classList.add('book-page-cover');
    allSheets[totalSheets - 1].classList.add('book-page-cover');

    var contentSheets = [];
    for (var i = 1; i < totalSheets - 1; i++) {
      allSheets[i].classList.add('book-page-content');
      contentSheets.push(allSheets[i]);
    }

    var contentCount = contentSheets.length;
    if (contentCount <= 1) {
      if (contentCount === 1) {
        contentSheets[0].style.setProperty('--page-inset', '6px');
      }
      return;
    }

    var minInset = 4;
    var maxInset = 14;
    var step = (maxInset - minInset) / (contentCount - 1);

    for (var j = 0; j < contentCount; j++) {
      var inset = maxInset - step * j;
      contentSheets[j].style.setProperty('--page-inset', inset.toFixed(1) + 'px');
    }
  }

  /* ══════════════════════════════════════
     BUILD SPINE
     ══════════════════════════════════════ */
  function buildSpine() {
    var spine = document.createElement('div');
    spine.className = 'book-spine';
    bookContainer.insertBefore(spine, bookContainer.firstChild);
  }

  /* ══════════════════════════════════════
     Z-INDEX & STATE MANAGEMENT
     ══════════════════════════════════════ */
  function updateZIndices() {
    for (var i = 0; i < totalSheets; i++) {
      if (allSheets[i].classList.contains('flipped')) {
        allSheets[i].style.zIndex = (i + 1) * 2;
      } else {
        allSheets[i].style.zIndex = ((totalSheets * 2) - i) * 2;
      }
    }
  }

  function updateThicknessVisibility() {
    var coverFlipped = allSheets[0].classList.contains('flipped');
    for (var i = 1; i < totalSheets - 1; i++) {
      allSheets[i].style.setProperty('--thickness-opacity', coverFlipped ? '1' : '0');
    }
  }

  function updateState() {
    bookContainer.classList.toggle('book-cover-open', currentSheet > 0);
    updateZIndices();
    updateThicknessVisibility();
  }

  /* ══════════════════════════════════════
     ANIMATION HELPERS
     ══════════════════════════════════════ */
  function animateSheet(sheet, duration) {
    sheet.style.transition = 'transform ' + duration + 'ms ' + FLIP_EASING;
    sheet.offsetHeight;
  }

  function remainingDuration(progress, fullDuration) {
    var remaining = (1 - progress) * fullDuration;
    return Math.max(200, Math.min(remaining, fullDuration));
  }

  /* ══════════════════════════════════════
     FLIP OPERATIONS
     ══════════════════════════════════════ */
  function flipForward(fromDrag) {
    if (currentSheet >= totalSheets || isAnimating) return;
    isAnimating = true;

    /* Start audio on first interaction */
    startBookAudio();

    var sheet = allSheets[currentSheet];
    sheet.style.zIndex = totalSheets * 6;

    var duration;
    if (fromDrag) {
      duration = remainingDuration(dragProgress, FLIP_DURATION);
      animateSheet(sheet, duration);
      sheet.style.transform = '';
    } else {
      duration = FLIP_DURATION;
      animateSheet(sheet, duration);
    }

    sheet.classList.add('flipped');
    currentSheet++;

    setTimeout(function () {
      sheet.style.transition = '';
      updateState();
      isAnimating = false;
    }, duration);
  }

  function flipBackward(fromDrag) {
    if (currentSheet <= 0 || isAnimating) return;
    isAnimating = true;

    startBookAudio();

    currentSheet--;
    var sheet = allSheets[currentSheet];
    sheet.style.zIndex = totalSheets * 6;

    if (currentSheet === 0) {
      for (var i = 1; i < totalSheets - 1; i++) {
        allSheets[i].style.setProperty('--thickness-opacity', '0');
      }
    }

    var duration;
    if (fromDrag) {
      duration = remainingDuration(1 - dragProgress, FLIP_DURATION);
      animateSheet(sheet, duration);
      sheet.style.transform = '';
    } else {
      duration = FLIP_DURATION;
      animateSheet(sheet, duration);
    }

    sheet.classList.remove('flipped');

    setTimeout(function () {
      sheet.style.transition = '';
      updateState();
      isAnimating = false;
    }, duration);
  }

  /* ══════════════════════════════════════
     CLICK HANDLER
     ══════════════════════════════════════ */
  function flipByPosition(clientX) {
    if (isAnimating) return;
    var rect = bookContainer.getBoundingClientRect();
    if (clientX - rect.left > rect.width / 2) {
      flipForward();
    } else {
      flipBackward();
    }
  }

  /* ══════════════════════════════════════
     DRAG LOGIC
     ══════════════════════════════════════ */
  function getDragTarget(pointerX) {
    var rect = bookContainer.getBoundingClientRect();
    var x = pointerX - rect.left;
    var midX = rect.width / 2;

    if (x > midX && currentSheet < totalSheets) {
      return { sheet: allSheets[currentSheet], direction: 'forward' };
    }
    if (x < midX && currentSheet > 0) {
      return { sheet: allSheets[currentSheet - 1], direction: 'back' };
    }
    return null;
  }

  function startDrag(clientX) {
    if (isAnimating) return false;
    var target = getDragTarget(clientX);
    if (!target) return false;

    dragging = true;
    dragSheet = target.sheet;
    dragDirection = target.direction;
    dragStartX = clientX;
    dragStartTime = Date.now();
    dragProgress = 0;
    pageWidth = bookContainer.getBoundingClientRect().width / 2;

    dragSheet.style.transition = 'none';
    dragSheet.style.zIndex = totalSheets * 6;
    return true;
  }

  function updateDragPosition(clientX) {
    if (!dragging || !dragSheet) return;
    var deltaX = clientX - dragStartX;

    if (dragDirection === 'forward') {
      dragProgress = clamp(-deltaX / pageWidth);
      dragSheet.style.transform = 'rotateY(' + (-dragProgress * 180) + 'deg)';
    } else {
      dragProgress = clamp(deltaX / pageWidth);
      dragSheet.style.transform = 'rotateY(' + (-180 + dragProgress * 180) + 'deg)';
    }
  }

  function endDrag(clientX) {
    if (!dragging || !dragSheet) return null;

    var deltaX = clientX - dragStartX;
    var elapsed = Date.now() - dragStartTime;
    var wasClick = Math.abs(deltaX) < CLICK_DISTANCE && elapsed < CLICK_TIME;

    if (wasClick) {
      dragSheet.style.transition = '';
      dragSheet.style.transform = '';
      dragSheet.style.zIndex = '';
      updateState();
      resetDrag();
      return 'click';
    }

    var shouldFlip = dragProgress > FLIP_codex;
    dragSheet.style.transition = '';

    if (shouldFlip) {
      if (dragDirection === 'forward') {
        flipForward(true);
      } else {
        flipBackward(true);
      }
    } else {
      snapBack();
    }

    resetDrag();
    return 'drag';
  }

  function snapBack() {
    if (!dragSheet) return;
    var duration = remainingDuration(1 - dragProgress, SNAP_DURATION);
    var sheet = dragSheet;
    isAnimating = true;

    animateSheet(sheet, duration);
    sheet.style.transform = '';
    if (dragDirection === 'forward') {
      sheet.classList.remove('flipped');
    } else {
      sheet.classList.add('flipped');
    }

    setTimeout(function () {
      sheet.style.transition = '';
      sheet.style.zIndex = '';
      updateState();
      isAnimating = false;
    }, duration);
  }

  function resetDrag() {
    dragging = false;
    dragSheet = null;
    dragDirection = null;
    dragProgress = 0;
  }

  function clamp(value) {
    return Math.max(0, Math.min(1, value));
  }

  /* ══════════════════════════════════════
     MOUSE EVENTS
     ══════════════════════════════════════ */
  bookContainer.addEventListener('mousedown', function (e) {
    if (!startDrag(e.clientX)) return;
    e.preventDefault();
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  });

  function onMouseMove(e) {
    updateDragPosition(e.clientX);
  }

  function onMouseUp(e) {
    document.removeEventListener('mousemove', onMouseMove);
    document.removeEventListener('mouseup', onMouseUp);
    var result = endDrag(e.clientX);
    if (result === 'click') flipByPosition(e.clientX);
  }

  /* ══════════════════════════════════════
     TOUCH EVENTS
     ══════════════════════════════════════ */
  bookContainer.addEventListener('touchstart', function (e) {
    if (!startDrag(e.touches[0].clientX)) return;
    document.addEventListener('touchmove', onTouchMove, { passive: false });
    document.addEventListener('touchend', onTouchEnd);
  }, { passive: true });

  function onTouchMove(e) {
    if (!dragging) return;
    e.preventDefault();
    updateDragPosition(e.touches[0].clientX);
  }

  function onTouchEnd(e) {
    document.removeEventListener('touchmove', onTouchMove);
    document.removeEventListener('touchend', onTouchEnd);
    var touch = e.changedTouches[0];
    var result = endDrag(touch.clientX);
    if (result === 'click') flipByPosition(touch.clientX);
  }

  /* ══════════════════════════════════════
     KEYBOARD NAVIGATION
     ══════════════════════════════════════ */
  document.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowRight') flipForward();
    else if (e.key === 'ArrowLeft') flipBackward();
  });

  /* ══════════════════════════════════════
     HOVER TRACKING
     ══════════════════════════════════════ */
  bookContainer.addEventListener('mousemove', function (e) {
    var rect = bookContainer.getBoundingClientRect();
    var isRight = (e.clientX - rect.left) > rect.width / 2;
    bookContainer.classList.toggle('book-hover-right', isRight);
    bookContainer.classList.toggle('book-hover-left', !isRight);
  });

  bookContainer.addEventListener('mouseleave', function () {
    bookContainer.classList.remove('book-hover-left', 'book-hover-right');
  });

  /* ══════════════════════════════════════
     EDGE HIGHLIGHT INJECTION — COVERS ONLY
     ══════════════════════════════════════ */
  function injectEdgeHighlights() {
    var firstFront = allSheets[0].querySelector('.book-cover-front');
    if (firstFront) {
      var el0 = document.createElement('div');
      el0.className = 'page-edge-right';
      firstFront.appendChild(el0);
    }

    var firstBack = allSheets[0].querySelector('.book-page-back');
    if (firstBack) {
      var el1 = document.createElement('div');
      el1.className = 'page-edge-left';
      firstBack.appendChild(el1);
    }

    var lastFront = allSheets[totalSheets - 1].querySelector('.book-page-front');
    if (lastFront) {
      var el2 = document.createElement('div');
      el2.className = 'page-edge-right';
      lastFront.appendChild(el2);
    }

    var lastBack = allSheets[totalSheets - 1].querySelector('.book-page-back');
    if (lastBack) {
      var el3 = document.createElement('div');
      el3.className = 'page-edge-left';
      lastBack.appendChild(el3);
    }
  }

  /* ══════════════════════════════════════
     INITIALIZATION
     ══════════════════════════════════════ */
  classifySheets();
  injectEdgeHighlights();
  buildSpine();
  updateState();
})();