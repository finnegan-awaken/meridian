(function () {
  'use strict';
  var canvas = document.getElementById('cosmos');
  if (!canvas) return;
  var ctx = canvas.getContext('2d');
  var field = [];
  var mx = window.innerWidth / 2;
  var my = window.innerHeight / 2;
  var isTouch = window.matchMedia('(hover: none)').matches;

  function seedField() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    var n = Math.floor((canvas.width * canvas.height) / 1600);
    field = [];
    for (var i = 0; i < n; i++) {
      field.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        r: Math.random() * 1.3 + 0.2,
        o: Math.random() * 0.5 + 0.08,
        sp: Math.random() * 0.015 + 0.003,
        ph: Math.random() * Math.PI * 2,
        d: isTouch ? 0 : Math.random() * 2.5 + 0.5
      });
    }
  }

  function drawField(t) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
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

  if (!isTouch) {
    document.addEventListener('mousemove', function (e) {
      mx = e.clientX;
      my = e.clientY;
    });
  }

  seedField();
  requestAnimationFrame(loop);
  window.addEventListener('resize', seedField);
})();