(function() {
  'use strict';

  if (window.innerWidth > 600) return;

  var backLeft = document.querySelector('.back-link');
  var backRight = document.querySelector('.back-link-right');

  if (!backLeft && !backRight) return;

  var header = document.createElement('header');
  header.className = 'mobile-header';

  if (backLeft) header.appendChild(backLeft);
  if (backRight) header.appendChild(backRight);

  document.body.insertBefore(header, document.body.firstChild);

  var lastScrollY = window.scrollY;
  var ticking = false;

  function update() {
    var y = window.scrollY;

    if (y < 50) {
      header.classList.remove('hidden');
    } else if (y > lastScrollY + 5) {
      header.classList.add('hidden');
    } else if (y < lastScrollY - 5) {
      header.classList.remove('hidden');
    }

    lastScrollY = y;
    ticking = false;
  }

  window.addEventListener('scroll', function() {
    if (!ticking) {
      requestAnimationFrame(update);
      ticking = true;
    }
  });
})();