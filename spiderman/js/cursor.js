(function () {
  "use strict";

  var mq = window.matchMedia("(hover: hover) and (pointer: fine)");
  if (!mq.matches) return;

  var root = document.documentElement;
  root.classList.add("has-web-cursor");

  var cursor = document.getElementById("custom-cursor");
  if (!cursor) return;

  var strandEls = Array.prototype.slice.call(cursor.querySelectorAll(".cc-strand"));
  var strands = strandEls.map(function (el, i) {
    return {
      el: el,
      angle: 0,
      angVel: 0,
      spring: 90 + i * 14,
      damping: 7 + i * 0.8,
      idleAmp: 4 + i * 1.6,
      idleFreq: 0.9 + i * 0.35,
      phase: i * 2.1,
    };
  });

  var mouseX = 0;
  var mouseY = 0;
  var lastX = 0;
  var lastY = 0;
  var lastT = performance.now();
  var rawVelX = 0;
  var rawVelY = 0;
  var smoothVelX = 0;
  var smoothVelY = 0;
  var seen = false;

  function onMove(e) {
    mouseX = e.clientX;
    mouseY = e.clientY;
    if (!seen) {
      seen = true;
      lastX = mouseX;
      lastY = mouseY;
      cursor.classList.add("visible");
    }
  }

  document.addEventListener("mousemove", onMove, { passive: true });
  document.addEventListener("mouseleave", function () {
    cursor.classList.remove("visible");
  });
  document.addEventListener("mouseenter", function () {
    if (seen) cursor.classList.add("visible");
  });

  function tick(now) {
    var dt = Math.min((now - lastT) / 1000, 0.05);
    lastT = now;

    var dx = mouseX - lastX;
    var dy = mouseY - lastY;
    lastX = mouseX;
    lastY = mouseY;

    if (dt > 0) {
      rawVelX = dx / dt;
      rawVelY = dy / dt;
    }
    rawVelX *= 0.85;
    rawVelY *= 0.85;

    smoothVelX += (rawVelX - smoothVelX) * 0.25;
    smoothVelY += (rawVelY - smoothVelY) * 0.25;

    cursor.style.transform = "translate3d(" + mouseX + "px," + mouseY + "px,0)";

    var leanX = Math.max(-38, Math.min(38, -smoothVelX * 0.045));
    var speed = Math.min(1, Math.sqrt(smoothVelX * smoothVelX + smoothVelY * smoothVelY) / 900);
    var t = now / 1000;

    strands.forEach(function (s) {
      var idle = Math.sin(t * s.idleFreq + s.phase) * s.idleAmp * (0.4 + speed * 0.6);
      var target = leanX + idle;
      var accel = (target - s.angle) * s.spring - s.angVel * s.damping;
      s.angVel += accel * dt;
      s.angle += s.angVel * dt;
      s.el.style.transform = "rotate(" + s.angle.toFixed(2) + "deg)";
    });

    requestAnimationFrame(tick);
  }

  requestAnimationFrame(tick);
})();
