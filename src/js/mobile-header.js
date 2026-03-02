(function() {
  'use strict';

  var header = document.querySelector('.mobile-header');
  if (!header) return;

  var lastScrollY = window.scrollY;
  var ticking = false;
  var scrollThreshold = 10;

  function updateHeader() {
    var currentScrollY = window.scrollY;
    
    if (currentScrollY < 50) {
      // Always show header near top of page
      header.classList.remove('hidden');
    } else if (currentScrollY > lastScrollY + scrollThreshold) {
      // Scrolling down - hide header
      header.classList.add('hidden');
    } else if (currentScrollY < lastScrollY - scrollThreshold) {
      // Scrolling up - show header
      header.classList.remove('hidden');
    }
    
    lastScrollY = currentScrollY;
    ticking = false;
  }

  window.addEventListener('scroll', function() {
    if (!ticking) {
      requestAnimationFrame(updateHeader);
      ticking = true;
    }
  });
})();