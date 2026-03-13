(function () {
  'use strict';

  if (window.innerWidth < 1000) return;

  var HOVER_SPACING = '3px'; /* ← must match your CSS hover value */

  function preserveLineBreaks() {
    var titles = document.querySelectorAll('.lavitsa-book-title');
    if (!titles.length) return;

    titles.forEach(function (el) {
      var raw = el.getAttribute('data-text');
      if (!raw) {
        raw = el.textContent.trim().replace(/\s+/g, ' ');
        el.setAttribute('data-text', raw);
      }

      var words = raw.split(' ');
      if (words.length < 2) return;

      el.innerHTML = words
        .map(function (w) { return '<span>' + w + '</span>'; })
        .join(' ');

      var oldTransition = el.style.transition;
      var oldWebkit = el.style.webkitTransition;
      el.style.transition = 'none';
      el.style.webkitTransition = 'none';
      el.style.letterSpacing = HOVER_SPACING;
      void el.offsetHeight;

      var spans = el.querySelectorAll('span');
      var lines = [];
      var curLine = [spans[0].textContent];
      var lastTop = spans[0].getBoundingClientRect().top;

      for (var i = 1; i < spans.length; i++) {
        var top = spans[i].getBoundingClientRect().top;
        if (Math.abs(top - lastTop) > 2) {
          lines.push(curLine.join(' '));
          curLine = [];
          lastTop = top;
        }
        curLine.push(spans[i].textContent);
      }
      lines.push(curLine.join(' '));

      el.style.letterSpacing = '';
      el.style.transition = oldTransition;
      el.style.webkitTransition = oldWebkit;
      el.innerHTML = lines.join('<br>');
    });
  }

  /* Wait for fonts before measuring */
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(function () {
      setTimeout(preserveLineBreaks, 150);
    });
  } else {
    window.addEventListener('load', function () {
      setTimeout(preserveLineBreaks, 300);
    });
  }

  var rid;
  window.addEventListener('resize', function () {
    clearTimeout(rid);
    rid = setTimeout(preserveLineBreaks, 200);
  });
})();