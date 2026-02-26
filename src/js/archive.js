(function () {
  'use strict';

  /* ══════════════════════════════════════
     CONFIG
     ══════════════════════════════════════ */
  var ITEMS_PER_PAGE = 9;
  var currentView = 'grid';
  var currentPage = 1;
  var isAnimating = false;

  /* ══════════════════════════════════════
     DOM REFS
     ══════════════════════════════════════ */
  var tabs = document.querySelectorAll('.archive-tab');
  var views = document.querySelectorAll('.archive-view');
  var paginationContainer = document.querySelector('.archive-pagination');
  var genreBtns = document.querySelectorAll('.genre-filter-btn');
  var genreLists = document.querySelectorAll('.genre-article-list');

  /* Exit if not on archive page */
  if (!tabs.length) return;

  /* ══════════════════════════════════════
     STAGGER ANIMATION
     Cascades items in one by one
     ══════════════════════════════════════ */
  function staggerItems(container, callback) {
    if (!container) {
      if (callback) callback();
      return;
    }

    var items = container.querySelectorAll('.archive-stagger-item');
    var visibleItems = [];

    for (var i = 0; i < items.length; i++) {
      if (items[i].style.display !== 'none') {
        visibleItems.push(items[i]);
        items[i].classList.remove('visible');
      }
    }

    if (visibleItems.length === 0) {
      if (callback) callback();
      return;
    }

    var completed = 0;
    for (var k = 0; k < visibleItems.length; k++) {
      (function (item, index) {
        setTimeout(function () {
          item.classList.add('visible');
          completed++;
          if (completed === visibleItems.length && callback) {
            callback();
          }
        }, 50 + index * 40);
      })(visibleItems[k], k);
    }
  }

  /* ══════════════════════════════════════
     VIEW SWITCHING
     ══════════════════════════════════════ */
  function switchView(target) {
    if (target === currentView || isAnimating) return;
    isAnimating = true;

    var currentViewEl = document.querySelector('.archive-view.active');
    var targetViewEl = document.querySelector('.archive-view[data-view="' + target + '"]');

    if (!targetViewEl) {
      isAnimating = false;
      return;
    }

    /* Update tab states */
    for (var i = 0; i < tabs.length; i++) {
      if (tabs[i].dataset.view === target) {
        tabs[i].classList.add('active');
      } else {
        tabs[i].classList.remove('active');
      }
    }

    /* Fade out current */
    if (currentViewEl) {
      currentViewEl.classList.add('leaving');
      var oldItems = currentViewEl.querySelectorAll('.archive-stagger-item');
      for (var j = 0; j < oldItems.length; j++) {
        oldItems[j].classList.remove('visible');
      }
    }

    /* After fade out, show new */
    setTimeout(function () {
      if (currentViewEl) {
        currentViewEl.classList.remove('active', 'leaving');
      }

      currentView = target;
      targetViewEl.classList.add('active', 'entering');

      /* Set up pagination for grid */
      if (target === 'grid') {
        currentPage = 1;
        applyGridPage();
      }

      /* Stagger in new items */
      staggerItems(targetViewEl, function () {
        targetViewEl.classList.remove('entering');
        isAnimating = false;
      });
    }, 250);
  }

  /* Bind tab clicks */
  for (var t = 0; t < tabs.length; t++) {
    (function (tab) {
      tab.addEventListener('click', function () {
        switchView(tab.dataset.view);
      });
    })(tabs[t]);
  }

  /* ══════════════════════════════════════
     GRID PAGINATION
     ══════════════════════════════════════ */
  function applyGridPage() {
    var cards = document.querySelectorAll('.issue-grid-card');
    if (!cards.length) return;

    var totalPages = Math.ceil(cards.length / ITEMS_PER_PAGE);

    for (var i = 0; i < cards.length; i++) {
      var index = parseInt(cards[i].dataset.gridIndex, 10);
      var page = Math.floor(index / ITEMS_PER_PAGE) + 1;
      if (page === currentPage) {
        cards[i].style.display = '';
      } else {
        cards[i].style.display = 'none';
        cards[i].classList.remove('visible');
      }
    }

    buildPagination(totalPages);
  }

  function buildPagination(totalPages) {
    if (!paginationContainer) return;

    if (totalPages <= 1) {
      paginationContainer.innerHTML = '';
      return;
    }

    var html = '';

    html += '<button class="archive-page-btn archive-page-arrow"' +
      (currentPage <= 1 ? ' disabled' : '') +
      ' data-dir="prev">‹</button>';

    for (var i = 1; i <= totalPages; i++) {
      if (i > 1) html += '<span class="archive-page-dot">·</span>';
      html += '<button class="archive-page-btn archive-page-num' +
        (i === currentPage ? ' active' : '') +
        '" data-page="' + i + '">' + i + '</button>';
    }

    html += '<button class="archive-page-btn archive-page-arrow"' +
      (currentPage >= totalPages ? ' disabled' : '') +
      ' data-dir="next">›</button>';

    paginationContainer.innerHTML = html;

    /* Bind page buttons */
    var pageBtns = paginationContainer.querySelectorAll('.archive-page-num');
    for (var j = 0; j < pageBtns.length; j++) {
      (function (btn) {
        btn.addEventListener('click', function () {
          goToPage(parseInt(btn.dataset.page, 10));
        });
      })(pageBtns[j]);
    }

    /* Bind arrows */
    var arrows = paginationContainer.querySelectorAll('.archive-page-arrow');
    for (var k = 0; k < arrows.length; k++) {
      (function (btn) {
        btn.addEventListener('click', function () {
          if (btn.disabled) return;
          var total = Math.ceil(
            document.querySelectorAll('.issue-grid-card').length / ITEMS_PER_PAGE
          );
          if (btn.dataset.dir === 'prev' && currentPage > 1) {
            goToPage(currentPage - 1);
          } else if (btn.dataset.dir === 'next' && currentPage < total) {
            goToPage(currentPage + 1);
          }
        });
      })(arrows[k]);
    }
  }

  function goToPage(page) {
    if (page === currentPage || isAnimating) return;
    isAnimating = true;

    var cards = document.querySelectorAll('.issue-grid-card');
    for (var i = 0; i < cards.length; i++) {
      cards[i].classList.remove('visible');
    }

    setTimeout(function () {
      currentPage = page;
      applyGridPage();
      var gridView = document.querySelector('.archive-view[data-view="grid"]');
      staggerItems(gridView, function () {
        isAnimating = false;
      });
    }, 200);
  }

  /* ══════════════════════════════════════
     GENRE FILTERING
     ══════════════════════════════════════ */
  for (var g = 0; g < genreBtns.length; g++) {
    (function (btn) {
      btn.addEventListener('click', function () {
        if (btn.classList.contains('active') || isAnimating) return;
        isAnimating = true;

        var genre = btn.dataset.genre;

        for (var i = 0; i < genreBtns.length; i++) {
          genreBtns[i].classList.remove('active');
        }
        btn.classList.add('active');

        var currentList = document.querySelector('.genre-article-list.active');
        if (currentList) {
          var oldItems = currentList.querySelectorAll('.archive-stagger-item');
          for (var j = 0; j < oldItems.length; j++) {
            oldItems[j].classList.remove('visible');
          }
        }

        setTimeout(function () {
          for (var k = 0; k < genreLists.length; k++) {
            genreLists[k].classList.remove('active');
          }
          var targetList = document.querySelector(
            '.genre-article-list[data-genre-list="' + genre + '"]'
          );
          if (targetList) {
            targetList.classList.add('active');
            staggerItems(targetList, function () {
              isAnimating = false;
            });
          } else {
            isAnimating = false;
          }
        }, 200);
      });
    })(genreBtns[g]);
  }

  /* ══════════════════════════════════════
     INIT
     ══════════════════════════════════════ */

  /* Apply grid pagination on load */
  applyGridPage();

  /* Stagger in the default active view */
  var activeView = document.querySelector('.archive-view.active');
  if (activeView) {
    staggerItems(activeView);
  }

  /* Pre-mark genre items as visible so they don't
     need to animate when switching to genre view */
  var activeGenreList = document.querySelector('.genre-article-list.active');
  if (activeGenreList) {
    var genreItems = activeGenreList.querySelectorAll('.archive-stagger-item');
    for (var gi = 0; gi < genreItems.length; gi++) {
      genreItems[gi].classList.add('visible');
    }
  }

})();