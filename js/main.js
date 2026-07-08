(function(){
  'use strict';

  /* ---------------- nav ---------------- */
  var nav = document.getElementById('main-nav');
  var navToggle = document.getElementById('nav-toggle');
  var navLinks = document.querySelector('.navlinks');
  window.addEventListener('scroll', function(){
    nav.classList.toggle('scrolled', window.scrollY > 20);
  }, {passive:true});
  navToggle.addEventListener('click', function(){
    navLinks.classList.toggle('open');
  });
  navLinks.querySelectorAll('a').forEach(function(a){
    a.addEventListener('click', function(){ navLinks.classList.remove('open'); });
  });

  /* ---------------- hero typewriter ---------------- */
  var phrases = [
    'TRICAMPEÃO MUNDIAL DE F1',
    '41 VITÓRIAS. 65 POLE POSITIONS.',
    '6 VEZES CAMPEÃO EM MÔNACO',
    'O MAIOR ÍDOLO DO BRASIL NAS PISTAS',
    'SEMPRE 12. SEMPRE SENNA.'
  ];
  var twEl = document.getElementById('typewriter-text');
  var pIdx = 0, cIdx = 0, deleting = false;
  function typeTick(){
    var current = phrases[pIdx];
    if(!deleting){
      cIdx++;
      twEl.textContent = current.slice(0, cIdx);
      if(cIdx === current.length){ deleting = true; setTimeout(typeTick, 1800); return; }
    } else {
      cIdx--;
      twEl.textContent = current.slice(0, cIdx);
      if(cIdx === 0){ deleting = false; pIdx = (pIdx+1) % phrases.length; }
    }
    setTimeout(typeTick, deleting ? 28 : 55);
  }
  typeTick();

  /* ---------------- timeline reveal + progress fill ---------------- */
  var tlItems = document.querySelectorAll('.tl-item');
  var timelineEl = document.getElementById('timeline');
  var timelineFill = document.getElementById('timeline-fill');

  var io = new IntersectionObserver(function(entries){
    entries.forEach(function(entry){
      if(entry.isIntersecting) entry.target.classList.add('in-view');
    });
  }, {threshold:.28});
  tlItems.forEach(function(item){ io.observe(item); });

  function updateTimelineFill(){
    var rect = timelineEl.getBoundingClientRect();
    var vh = window.innerHeight;
    var total = rect.height;
    var visible = Math.min(total, Math.max(0, vh * 0.6 - rect.top));
    var pct = total > 0 ? Math.min(100, (visible/total) * 100) : 0;
    timelineFill.style.height = pct + '%';
  }
  window.addEventListener('scroll', updateTimelineFill, {passive:true});
  window.addEventListener('resize', updateTimelineFill);
  updateTimelineFill();

  /* ---------------- car tech: ficha técnica toggle ---------------- */
  document.querySelectorAll('.tech-toggle').forEach(function(btn){
    btn.addEventListener('click', function(){
      var detail = btn.nextElementSibling;
      var open = detail.classList.toggle('open');
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  });

  /* ---------------- car tech: animated stat counters ---------------- */
  var reduceMotionStats = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function animateCount(el){
    var target = parseFloat(el.getAttribute('data-count'));
    if(isNaN(target)) return;
    if(reduceMotionStats){ el.textContent = target; return; }
    var start = performance.now();
    var duration = 1300;
    function tick(now){
      var t = Math.min(1, (now - start) / duration);
      var eased = 1 - Math.pow(1 - t, 3);
      el.textContent = Math.round(target * eased);
      if(t < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }
  var statIo = new IntersectionObserver(function(entries){
    entries.forEach(function(entry){
      if(entry.isIntersecting){
        animateCount(entry.target);
        statIo.unobserve(entry.target);
      }
    });
  }, {threshold:.6});
  document.querySelectorAll('.stat-num').forEach(function(el){ statIo.observe(el); });

  /* ---------------- technology era timeline: reveal + fill ---------------- */
  var techItems = document.querySelectorAll('.tech-era-item');
  var techTrack = document.querySelector('.tech-era-track');
  var techFill = document.getElementById('tech-era-fill');
  var techIo = new IntersectionObserver(function(entries){
    entries.forEach(function(entry){
      if(entry.isIntersecting) entry.target.classList.add('in-view');
    });
  }, {threshold:.4});
  techItems.forEach(function(item){ techIo.observe(item); });

  function updateTechFill(){
    if(!techTrack) return;
    var rect = techTrack.getBoundingClientRect();
    var vh = window.innerHeight;
    var isVertical = window.innerWidth <= 900;
    var total = isVertical ? rect.height : rect.width;
    var visible = Math.min(total, Math.max(0, vh * 0.65 - rect.top));
    var pct = total > 0 ? Math.min(100, (visible/total) * 100) : 0;
    if(isVertical){ techFill.style.height = pct + '%'; techFill.style.width = '100%'; }
    else { techFill.style.width = pct + '%'; techFill.style.height = '100%'; }
  }
  window.addEventListener('scroll', updateTechFill, {passive:true});
  window.addEventListener('resize', updateTechFill);
  updateTechFill();

  /* ---------------- rain canvas (atmosphere, generative — not a photo) ---------------- */
  var canvas = document.getElementById('rain-canvas');
  var ctx = canvas.getContext('2d');
  var drops = [];
  var DPR = Math.min(window.devicePixelRatio||1, 2);

  function resizeRain(){
    canvas.width = window.innerWidth * DPR;
    canvas.height = window.innerHeight * 1.2 * DPR;
    canvas.style.height = (window.innerHeight*1.2) + 'px';
    var count = Math.floor((window.innerWidth * window.innerHeight) / 9000);
    drops = [];
    for(var i=0;i<count;i++){
      drops.push({
        x: Math.random()*canvas.width,
        y: Math.random()*canvas.height,
        len: (10 + Math.random()*18) * DPR,
        speed: (4 + Math.random()*7) * DPR,
        drift: (Math.random()-0.5) * 1.2 * DPR,
        alpha: 0.08 + Math.random()*0.18
      });
    }
  }
  function drawRain(){
    ctx.clearRect(0,0,canvas.width, canvas.height);
    ctx.lineWidth = 1 * DPR;
    ctx.strokeStyle = '#8fb8d6';
    for(var i=0;i<drops.length;i++){
      var d = drops[i];
      ctx.globalAlpha = d.alpha;
      ctx.beginPath();
      ctx.moveTo(d.x, d.y);
      ctx.lineTo(d.x + d.drift*2, d.y + d.len);
      ctx.stroke();
      d.y += d.speed;
      d.x += d.drift;
      if(d.y > canvas.height){ d.y = -d.len; d.x = Math.random()*canvas.width; }
    }
    ctx.globalAlpha = 1;
    requestAnimationFrame(drawRain);
  }
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  resizeRain();
  window.addEventListener('resize', resizeRain);
  if(!reduceMotion) requestAnimationFrame(drawRain);

  /* ---------------- 360 product viewer (drag to spin through real frames) ---------------- */
  var viewer = document.getElementById('viewer-360');
  if(viewer){
    var stage = document.getElementById('viewer-360-stage');
    var imgEl = document.getElementById('viewer-360-img');
    var progressEl = document.getElementById('viewer-360-progress');
    var framesPath = viewer.getAttribute('data-frames-path');
    var frameCount = parseInt(viewer.getAttribute('data-frame-count'), 10) || 36;
    var prefix = viewer.getAttribute('data-frame-prefix') || 'frame-';
    var ext = viewer.getAttribute('data-frame-ext') || '.jpg';
    var currentFrame = 0;
    var framesReady = false;
    var loadedFlags = new Array(frameCount).fill(false);

    function pad(n){ return String(n+1).padStart(2,'0'); }
    function frameSrc(i){ return framesPath + prefix + pad(i) + ext; }

    // Probe whether real frame images exist. If not, show a friendly notice once.
    var probe = new Image();
    probe.onload = function(){ framesReady = true; showFrame(0); };
    probe.onerror = function(){
      imgEl.replaceWith(Object.assign(document.createElement('div'), {
        className: 'viewer-360-missing mono',
        style: 'position:absolute;inset:0;display:flex;align-items:center;justify-content:center;text-align:center;padding:30px;color:#5c6169;font-size:12.5px;line-height:1.6;',
        textContent: 'Sequência de 360° ainda não adicionada. Coloque ' + frameCount + ' fotos reais (giro de 360° do carro) em images/360/mclaren-mp4-4/, nomeadas ' + prefix + '01' + ext + ' … ' + prefix + pad(frameCount-1) + ext + '. Veja images/MANIFEST.md.'
      }));
    };
    probe.src = frameSrc(0);

    function showFrame(i){
      currentFrame = ((i % frameCount) + frameCount) % frameCount;
      imgEl.src = frameSrc(currentFrame);
      progressEl.textContent = pad(currentFrame) + ' / ' + frameCount;
    }

    var dragging = false, lastX = 0, accum = 0;
    var SENS = 6; // px per frame step

    function dragStart(x){ dragging = true; lastX = x; viewer.style.cursor='grabbing'; }
    function dragMove(x){
      if(!dragging || !framesReady) return;
      var dx = x - lastX;
      lastX = x;
      accum += dx;
      while(accum > SENS){ showFrame(currentFrame - 1); accum -= SENS; }
      while(accum < -SENS){ showFrame(currentFrame + 1); accum += SENS; }
    }
    function dragEnd(){ dragging = false; viewer.style.cursor='grab'; }

    viewer.addEventListener('mousedown', function(e){ dragStart(e.clientX); });
    window.addEventListener('mousemove', function(e){ dragMove(e.clientX); });
    window.addEventListener('mouseup', dragEnd);
    viewer.addEventListener('touchstart', function(e){ dragStart(e.touches[0].clientX); }, {passive:true});
    viewer.addEventListener('touchmove', function(e){ dragMove(e.touches[0].clientX); }, {passive:true});
    viewer.addEventListener('touchend', dragEnd);

    // gentle idle spin to invite interaction, stops on first user drag
    var idleSpin = setInterval(function(){
      if(framesReady && !dragging) showFrame(currentFrame + 1);
    }, 700);
    viewer.addEventListener('mousedown', function(){ clearInterval(idleSpin); }, {once:true});
    viewer.addEventListener('touchstart', function(){ clearInterval(idleSpin); }, {once:true});
  }

})();
