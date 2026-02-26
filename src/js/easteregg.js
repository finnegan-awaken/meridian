(function () {
  'use strict';

  if (sessionStorage.getItem('purple-pine-triggered')) return;

  var TRIGGER_DELAY = 5000;
  var SOUND_ONLY_DURATION = 5000;
  var BLACKOUT_DURATION = 5000;
  var STAR_APPEAR_TIME = 7000;
  var AUDIO_PATH = window.BASE + 'img/supernova.mp3';
  var VIDEO_PATH = window.BASE + 'img/supernova.mp4';

  var triggered = false;
  var audio = null;
  var blackout = null;
  var videoOverlay = null;
  var videoEl = null;
  var starEl = null;

  /* ══════════════════════════════════════
     CLEANUP ON PAGE HIDE
     ══════════════════════════════════════ */
  window.addEventListener('pagehide', function () {
    if (audio) {
      audio.pause();
      audio = null;
    }
  });

  /* ══════════════════════════════════════
     LOCK NAVIGATION
     Prevents user from leaving during event
     ══════════════════════════════════════ */
  function lockNavigation() {
    /* Block all clicks on links and transitions */
    document.addEventListener('click', blockNav, true);

    /* Block keyboard navigation */
    document.addEventListener('keydown', blockKeys, true);

    /* Block back/forward */
    history.pushState(null, '', window.location.href);
    window.addEventListener('popstate', blockPopstate);
  }

  function blockNav(e) {
    var link = e.target.closest('a, [data-transition], button');
    if (link && !link.closest('.pp-star')) {
      e.preventDefault();
      e.stopPropagation();
    }
  }

  function blockKeys(e) {
    /* Allow only Tab for accessibility within the star */
    if (e.key === 'Escape' || e.key === 'Backspace') {
      e.preventDefault();
      e.stopPropagation();
    }
  }

  function blockPopstate() {
    history.pushState(null, '', window.location.href);
  }

  function unlockNavigation() {
    document.removeEventListener('click', blockNav, true);
    document.removeEventListener('keydown', blockKeys, true);
    window.removeEventListener('popstate', blockPopstate);
  }

  /* ══════════════════════════════════════
     TIMER
     ══════════════════════════════════════ */
  setTimeout(function () {
    if (!triggered) triggerEvent();
  }, TRIGGER_DELAY);

  /* ══════════════════════════════════════
     AUDIO HELPER
     ══════════════════════════════════════ */
  function fadeAudioTo(audioObj, target, duration, callback) {
    if (!audioObj) {
      if (callback) callback();
      return;
    }
    var start = audioObj.volume;
    var diff = target - start;
    var steps = Math.max(1, Math.floor(duration / 30));
    var step = 0;
    var interval = setInterval(function () {
      step++;
      if (!audioObj) {
        clearInterval(interval);
        if (callback) callback();
        return;
      }
      audioObj.volume = Math.max(0, Math.min(1, start + diff * (step / steps)));
      if (step >= steps) {
        clearInterval(interval);
        if (callback) callback();
      }
    }, 30);
  }

  /* ══════════════════════════════════════
     PHASE 1: SOUND ONLY
     ══════════════════════════════════════ */
  function triggerEvent() {
    triggered = true;
    sessionStorage.setItem('purple-pine-triggered', 'true');
    lockNavigation();

    // Create audio but don't play yet
    audio = new Audio(AUDIO_PATH);
    audio.volume = 0;
    audio.loop = true;

    // Use existing user interaction context from page load
    var playPromise = audio.play();
    if (playPromise !== undefined) {
      playPromise.catch(function () {
        // Autoplay blocked — wait for ANY user interaction
        function resumeAudio() {
          audio.play().catch(function () {});
          document.removeEventListener('click', resumeAudio);
          document.removeEventListener('touchstart', resumeAudio);
          document.removeEventListener('keydown', resumeAudio);
        }
        document.addEventListener('click', resumeAudio);
        document.addEventListener('touchstart', resumeAudio);
        document.addEventListener('keydown', resumeAudio);
      });
    }
    fadeAudioTo(audio, 0.3, 500);

    setTimeout(function () {
      fadeToBlack();
    }, SOUND_ONLY_DURATION);
  }

  /* ══════════════════════════════════════
     PHASE 2: FADE TO BLACK
     ══════════════════════════════════════ */
  function fadeToBlack() {
    fadeAudioTo(audio, 0.4, BLACKOUT_DURATION);

    blackout = document.createElement('div');
    blackout.className = 'pp-blackout';
    document.body.appendChild(blackout);

    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        blackout.classList.add('pp-blackout-active');
      });
    });

    setTimeout(function () {
      startVideo();
    }, BLACKOUT_DURATION);
  }

  /* ══════════════════════════════════════
     PHASE 3: VIDEO
     Video plays once then freezes on
     last frame while music continues
     ══════════════════════════════════════ */
  function startVideo() {
    videoOverlay = document.createElement('div');
    videoOverlay.className = 'pp-video-overlay';

    videoEl = document.createElement('video');
    videoEl.className = 'pp-video';
    videoEl.src = VIDEO_PATH;
    videoEl.muted = true;
    videoEl.loop = false;
    videoEl.playsInline = true;
    videoEl.setAttribute('playsinline', '');
    videoEl.setAttribute('webkit-playsinline', '');

    /* Freeze on last frame when video ends */
    videoEl.addEventListener('ended', function () {
      videoEl.currentTime = Math.max(0, videoEl.duration - 0.01);
      videoEl.pause();
    });

    videoOverlay.appendChild(videoEl);
    document.body.appendChild(videoOverlay);

    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        videoOverlay.classList.add('pp-video-visible');
      });
    });

    videoEl.play().catch(function () {});

    setTimeout(function () {
      showStar();
    }, STAR_APPEAR_TIME);
  }

  /* ══════════════════════════════════════
     PHASE 4: STAR
     Star appears, then label auto-shows
     after 5 seconds
     ══════════════════════════════════════ */
  function showStar() {
    starEl = document.createElement('div');
    starEl.className = 'pp-star';
    starEl.setAttribute('role', 'button');
    starEl.setAttribute('tabindex', '0');
    starEl.innerHTML =
      '<div class="pp-star-text" aria-hidden="true">Разкрий истината</div>' +
      '<div class="pp-star-pulse"></div>' +
      '<div class="pp-star-glow"></div>' +
      '<div class="pp-star-core"></div>';

    videoOverlay.appendChild(starEl);

    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        starEl.classList.add('pp-star-visible');
      });
    });

    /* Click — mouse and touch */
    starEl.addEventListener('click', handleStarActivate);

    /* Touch support */
    starEl.addEventListener('touchend', function (e) {
      e.preventDefault();
      handleStarActivate();
    });

    /* Keyboard */
    starEl.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleStarActivate();
      }
    });
  }

  function handleStarActivate() {
    if (!starEl || starEl.classList.contains('pp-star-clicked')) return;

    starEl.classList.add('pp-star-clicked');
    unlockNavigation();

    fadeAudioTo(audio, 0, 1500, function () {
      if (audio) {
        audio.pause();
        audio = null;
      }
    });

    setTimeout(function () {
      if (typeof window.meridianTransition === 'function') {
        window.meridianTransition(window.BASE + 'book-of-secrets/', 'КНИГА НА ЗАГАДКИТЕ', '⍟');
      } else {
        window.location.href = window.BASE + 'book-of-secrets/';
      }
    }, 500);
  }

})();