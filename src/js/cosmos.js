(function () {
  'use strict';
  var canvas = document.getElementById('cosmos');
  if (!canvas) return;
  var ctx = canvas.getContext('2d');
  var field = [];
  var mx = window.innerWidth / 2;
  var my = window.innerHeight / 2;
  var dpr = 1;

  function seedField() {
    dpr = window.devicePixelRatio || 1;

    // Set the internal resolution to match physical pixels
    canvas.width = window.innerWidth * dpr;
    canvas.height = window.innerHeight * dpr;

    // Keep the CSS size at logical pixels
    canvas.style.width = window.innerWidth + 'px';
    canvas.style.height = window.innerHeight + 'px';

    // Scale all drawing operations so coordinates stay in logical pixels
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    var n = Math.floor((window.innerWidth * window.innerHeight) / 1600);
    field = [];
    for (var i = 0; i < n; i++) {
      field.push({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        r: Math.random() * 1.3 + 0.2,
        o: Math.random() * 0.5 + 0.08,
        sp: Math.random() * 0.015 + 0.003,
        ph: Math.random() * Math.PI * 2,
        d: Math.random() * 2.5 + 0.5
      });
    }
  }

  function drawField(t) {
    // Clear using logical dimensions — the transform handles the rest
    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

    var px = (mx - window.innerWidth / 2) * 0.01;
    var py = (my - window.innerHeight / 2) * 0.01;
    for (var i = 0; i < field.length; i++) {
      var s = field[i];
      var f = Math.sin(t * s.sp + s.ph);
      var op = Math.max(0.03, s.o + f * 0.2);
      var sx = s.x + px * s.d;
      var sy = s.y + py * s.d;
      ctx.beginPath();
      ctx.arc(sx, sy, s.r, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255,248,231,' + op + ')';
      ctx.fill();
      if (s.r > 1.05) {
        ctx.beginPath();
        ctx.arc(sx, sy, s.r * 3, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(201,168,76,' + (op * 0.06) + ')';
        ctx.fill();
      }
    }
  }

  function loop(t) {
    drawField(t);
    requestAnimationFrame(loop);
  }

  document.addEventListener('mousemove', function (e) {
    mx = e.clientX;
    my = e.clientY;
  });

  seedField();
  requestAnimationFrame(loop);
  window.addEventListener('resize', seedField);
})();