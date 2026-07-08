(function(){
  'use strict';

  var shell = document.querySelector('.trophy-room-shell');
  var canvasEl = document.getElementById('trophy-canvas');
  var loadingEl = document.getElementById('troom-loading');
  var hintEl = document.getElementById('troom-hint');
  var roomLabelEl = document.getElementById('troom-room-label');
  var dotsEl = document.getElementById('troom-dots');
  var prevBtn = document.getElementById('troom-prev');
  var nextBtn = document.getElementById('troom-next');

  if(!shell || !canvasEl) return;

  if(typeof THREE === 'undefined' || window.__threeLoadFailed){
    loadingEl.innerHTML = '<span class="mono" style="max-width:340px;text-align:center;line-height:1.6;">Não foi possível carregar o motor 3D (conexão bloqueada ou offline). O resto do site funciona normalmente.</span>';
    return;
  }

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Real, publicly documented facts about Senna's career — the pedestals
     describe real achievements. The cup shapes are a generic sculptural
     abstraction (not a depiction of any specific real trophy), and each
     pedestal also carries a photo-card placeholder for the REAL trophy
     photo to be added by the site owner (see images/MANIFEST.md). */
  var ROOMS = [
    {
      name:'SALA 1 · ASCENSÃO — KART E FÓRMULA 3',
      accent: 0x3ee6df,
      trophies:[
        {label:'Campeão Sul-Americano de Kart', sub:'1977', photo:'trofeus/kart-sul-americano-1977.jpg'},
        {label:'Campeão Britânico de F. Ford 1600', sub:'1981', photo:'trofeus/formula-ford-1981.jpg'},
        {label:'Campeão Britânico de Fórmula 3', sub:'1983', photo:'trofeus/formula-3-1983.jpg'}
      ]
    },
    {
      name:'SALA 2 · LOTUS — AS PRIMEIRAS VITÓRIAS',
      accent: 0xf0a500,
      trophies:[
        {label:'Primeira Vitória na F1', sub:'GP de Portugal, Estoril 1985', photo:'trofeus/vitoria-estoril-1985.jpg'},
        {label:'6 Vitórias pela Lotus', sub:'1985 – 1987', photo:'trofeus/vitorias-lotus.jpg'},
        {label:'Mestre do Qualifying', sub:'Múltiplas pole positions, 1985–1987', photo:'trofeus/poles-lotus.jpg'}
      ]
    },
    {
      name:'SALA 3 · MCLAREN — TRÊS TÍTULOS MUNDIAIS',
      accent: 0xd1131f,
      trophies:[
        {label:'Campeão Mundial de F1', sub:'1988', photo:'trofeus/campeao-mundial-1988.jpg'},
        {label:'Campeão Mundial de F1', sub:'1990', photo:'trofeus/campeao-mundial-1990.jpg'},
        {label:'Campeão Mundial de F1', sub:'1991', photo:'trofeus/campeao-mundial-1991.jpg'},
        {label:'6 Vitórias no GP de Mônaco', sub:'1987–1993 (recorde à época)', photo:'trofeus/monaco-6-vitorias.jpg'}
      ]
    },
    {
      name:'SALA 4 · WILLIAMS & LEGADO',
      accent: 0x049c3b,
      trophies:[
        {label:'41 Vitórias na Fórmula 1', sub:'carreira completa', photo:'trofeus/41-vitorias.jpg'},
        {label:'65 Pole Positions', sub:'recorde à época', photo:'trofeus/65-poles.jpg'},
        {label:'Instituto Ayrton Senna', sub:'fundado em 1994', photo:'trofeus/instituto-ayrton-senna.jpg'}
      ]
    }
  ];

  var ROOM_LENGTH = 20;
  var HALL_WIDTH = 11;
  var HALL_HEIGHT = 6.4;

  var renderer, scene, camera;
  var currentRoom = 0;
  var yaw = 0, pitch = 0, targetYaw = 0, targetPitch = 0;
  var dragging = false, lastX = 0, lastY = 0, hasInteracted = false;
  var camZ = roomCenterZ(0);
  var travelling = false, travelStart = 0, travelDuration = 1500, travelFromZ = 0, travelToZ = 0;
  var spinningMeshes = [];
  var dustPoints = null;
  var firstFrame = true;
  var baseFov = 62;

  function roomCenterZ(i){ return -(i * ROOM_LENGTH + ROOM_LENGTH / 2); }

  function shellSize(){ return shell.getBoundingClientRect(); }

  function makePlaceholderTexture(label, desc, w, h){
    var c = document.createElement('canvas');
    c.width = w; c.height = h;
    var ctx = c.getContext('2d');
    ctx.fillStyle = '#14171b'; ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = '#e8b13a'; ctx.setLineDash([w*0.02, w*0.015]); ctx.lineWidth = Math.max(2, w*0.006);
    ctx.strokeRect(w*0.04, h*0.06, w*0.92, h*0.88);
    ctx.fillStyle = '#9aa0a8'; ctx.font = (h*0.16) + 'px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText('📷', w/2, h*0.38);
    ctx.font = (h*0.075) + 'px monospace';
    ctx.fillStyle = '#9aa0a8';
    wrapText(ctx, desc, w/2, h*0.56, w*0.82, h*0.1);
    ctx.fillStyle = '#5c6169'; ctx.font = (h*0.06) + 'px monospace';
    ctx.fillText('images/' + label, w/2, h*0.92);
    return c;
  }
  function wrapText(ctx, text, x, y, maxWidth, lineHeight){
    var words = String(text).split(' '), line = '', yy = y;
    for(var n=0; n<words.length; n++){
      var test = line + words[n] + ' ';
      if(ctx.measureText(test).width > maxWidth && n > 0){
        ctx.fillText(line, x, yy); line = words[n] + ' '; yy += lineHeight;
      } else { line = test; }
    }
    ctx.fillText(line, x, yy);
  }

  function makePlaqueCanvas(label, sub){
    var w = 640, h = 220;
    var c = document.createElement('canvas'); c.width = w; c.height = h;
    var ctx = c.getContext('2d');
    ctx.fillStyle = 'rgba(10,11,13,0.92)'; ctx.fillRect(0,0,w,h);
    ctx.strokeStyle = '#e8b13a'; ctx.lineWidth = 4;
    ctx.strokeRect(6,6,w-12,h-12);
    ctx.fillStyle = '#ffd166'; ctx.textAlign = 'center';
    ctx.font = '600 40px sans-serif';
    wrapText(ctx, label, w/2, 82, w*0.86, 46);
    ctx.fillStyle = '#9aa0a8'; ctx.font = '30px monospace';
    ctx.fillText(sub, w/2, h - 30);
    return c;
  }

  function loadFramedPlane(photoPath, desc, width, height){
    var geo = new THREE.PlaneGeometry(width, height);
    var canvasW = 512, canvasH = Math.round(512 * (height/width));
    var placeholder = makePlaceholderTexture(photoPath, desc, canvasW, canvasH);
    var tex = new THREE.CanvasTexture(placeholder);
    if(THREE.SRGBColorSpace) tex.colorSpace = THREE.SRGBColorSpace;
    var mat = new THREE.MeshBasicMaterial({map: tex, side: THREE.DoubleSide});
    var mesh = new THREE.Mesh(geo, mat);
    var img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = function(){
      var realTex = new THREE.Texture(img);
      if(THREE.SRGBColorSpace) realTex.colorSpace = THREE.SRGBColorSpace;
      realTex.needsUpdate = true;
      mat.map = realTex; mat.needsUpdate = true;
    };
    img.onerror = function(){ /* keep honest placeholder */ };
    img.src = 'images/' + photoPath;
    return mesh;
  }

  function buildTrophyMesh(){
    var pts = [
      new THREE.Vector2(0.00, 0.00),
      new THREE.Vector2(0.28, 0.00),
      new THREE.Vector2(0.30, 0.05),
      new THREE.Vector2(0.12, 0.10),
      new THREE.Vector2(0.10, 0.42),
      new THREE.Vector2(0.24, 0.50),
      new THREE.Vector2(0.30, 0.66),
      new THREE.Vector2(0.20, 0.74),
      new THREE.Vector2(0.06, 0.70),
      new THREE.Vector2(0.00, 0.72)
    ];
    var geo = new THREE.LatheGeometry(pts, 28);
    var mat = new THREE.MeshStandardMaterial({color:0xE8B13A, metalness:0.85, roughness:0.22, emissive:0x6b3f00, emissiveIntensity:0.55});
    return new THREE.Mesh(geo, mat);
  }

  function buildPedestal(){
    var group = new THREE.Group();
    var base = new THREE.Mesh(
      new THREE.CylinderGeometry(0.55, 0.62, 1.1, 24),
      new THREE.MeshStandardMaterial({color:0x15171b, metalness:0.4, roughness:0.55})
    );
    base.position.y = 0.55;
    group.add(base);
    var ring = new THREE.Mesh(
      new THREE.TorusGeometry(0.56, 0.03, 12, 32),
      new THREE.MeshStandardMaterial({color:0xE8B13A, metalness:0.9, roughness:0.2})
    );
    ring.rotation.x = Math.PI/2;
    ring.position.y = 1.08;
    group.add(ring);
    return group;
  }

  function makeDotSprite(){
    var c = document.createElement('canvas'); c.width = 32; c.height = 32;
    var ctx = c.getContext('2d');
    var grad = ctx.createRadialGradient(16,16,0,16,16,16);
    grad.addColorStop(0, 'rgba(255,255,255,1)'); grad.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = grad; ctx.fillRect(0,0,32,32);
    return new THREE.CanvasTexture(c);
  }

  function buildRoomSegment(room, index){
    var group = new THREE.Group();
    var centerZ = roomCenterZ(index);
    var startZ = -index * ROOM_LENGTH;
    var endZ = -(index + 1) * ROOM_LENGTH;

    var floor = new THREE.Mesh(
      new THREE.PlaneGeometry(HALL_WIDTH, ROOM_LENGTH),
      new THREE.MeshStandardMaterial({color:0x0c0d10, roughness:0.85, metalness:0.05})
    );
    floor.rotation.x = -Math.PI/2;
    floor.position.set(0, 0, centerZ);
    group.add(floor);

    var ceil = new THREE.Mesh(
      new THREE.PlaneGeometry(HALL_WIDTH, ROOM_LENGTH),
      new THREE.MeshStandardMaterial({color:0x08090b, roughness:0.9})
    );
    ceil.rotation.x = Math.PI/2;
    ceil.position.set(0, HALL_HEIGHT, centerZ);
    group.add(ceil);

    var wallMat = new THREE.MeshStandardMaterial({color:0x101216, roughness:0.8});
    var wallL = new THREE.Mesh(new THREE.PlaneGeometry(ROOM_LENGTH, HALL_HEIGHT), wallMat);
    wallL.rotation.y = Math.PI/2;
    wallL.position.set(-HALL_WIDTH/2, HALL_HEIGHT/2, centerZ);
    group.add(wallL);

    var wallR = new THREE.Mesh(new THREE.PlaneGeometry(ROOM_LENGTH, HALL_HEIGHT), wallMat.clone());
    wallR.rotation.y = -Math.PI/2;
    wallR.position.set(HALL_WIDTH/2, HALL_HEIGHT/2, centerZ);
    group.add(wallR);

    var strip = new THREE.Mesh(
      new THREE.PlaneGeometry(HALL_WIDTH*0.5, ROOM_LENGTH*0.7),
      new THREE.MeshBasicMaterial({color: room.accent, transparent:true, opacity:0.07})
    );
    strip.rotation.x = Math.PI/2;
    strip.position.set(0, HALL_HEIGHT - 0.02, centerZ);
    group.add(strip);

    var roomLight = new THREE.PointLight(room.accent, 8, 24, 2);
    roomLight.position.set(0, HALL_HEIGHT - 0.6, centerZ);
    group.add(roomLight);

    var arch = new THREE.Mesh(
      new THREE.BoxGeometry(HALL_WIDTH + 0.4, 0.16, 0.16),
      new THREE.MeshStandardMaterial({color:0xE8B13A, metalness:0.7, roughness:0.3})
    );
    arch.position.set(0, HALL_HEIGHT, endZ);
    group.add(arch);

    var n = room.trophies.length;
    var spacing = ROOM_LENGTH / (n + 1);
    room.trophies.forEach(function(t, i){
      var z = startZ - spacing * (i + 1);
      var xOff = (i % 2 === 0) ? -2.2 : 2.2;

      var pedestal = buildPedestal();
      pedestal.position.set(xOff, 0, z);
      group.add(pedestal);

      var trophyMesh = buildTrophyMesh();
      trophyMesh.scale.set(1.5, 1.5, 1.5);
      trophyMesh.position.set(xOff, 1.1, z);
      group.add(trophyMesh);
      spinningMeshes.push(trophyMesh);

      var plaqueTex = new THREE.CanvasTexture(makePlaqueCanvas(t.label, t.sub));
      var plaque = new THREE.Mesh(
        new THREE.PlaneGeometry(1.7, 0.58),
        new THREE.MeshBasicMaterial({map: plaqueTex, transparent:true, side:THREE.DoubleSide})
      );
      plaque.position.set(xOff, 0.34, z + 0.66);
      group.add(plaque);

      var photoCard = loadFramedPlane(t.photo, t.label + ' — foto real do troféu', 1.0, 0.66);
      photoCard.position.set(xOff, 2.05, z - 0.05);
      group.add(photoCard);
    });

    return group;
  }

  function buildParticles(totalLength){
    if(reduceMotion) return;
    var count = 260;
    var positions = new Float32Array(count * 3);
    for(var i=0;i<count;i++){
      positions[i*3]   = (Math.random()-0.5) * HALL_WIDTH;
      positions[i*3+1] = Math.random() * HALL_HEIGHT;
      positions[i*3+2] = -Math.random() * totalLength;
    }
    var geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    var mat = new THREE.PointsMaterial({
      size:0.05, map: makeDotSprite(), transparent:true, opacity:0.35,
      depthWrite:false, blending:THREE.AdditiveBlending, color:0xfff2d0
    });
    dustPoints = new THREE.Points(geo, mat);
    scene.add(dustPoints);
  }

  function buildHall(){
    ROOMS.forEach(function(room, i){ scene.add(buildRoomSegment(room, i)); });
    scene.add(new THREE.AmbientLight(0x404050, 0.9));
    var farZ = -ROOM_LENGTH * ROOMS.length;
    var cap = new THREE.Mesh(
      new THREE.PlaneGeometry(HALL_WIDTH, HALL_HEIGHT),
      new THREE.MeshStandardMaterial({color:0x0a0b0d})
    );
    cap.position.set(0, HALL_HEIGHT/2, farZ);
    scene.add(cap);
    buildParticles(ROOM_LENGTH * ROOMS.length);
  }

  function resize(){
    var r = shellSize();
    if(r.width < 2 || r.height < 2) return;
    renderer.setSize(r.width, r.height, false);
    camera.aspect = r.width / r.height;
    camera.updateProjectionMatrix();
  }

  function startDrag(x, y){ dragging = true; lastX = x; lastY = y; }
  function moveDrag(x, y){
    if(!dragging) return;
    if(!hasInteracted){ hasInteracted = true; hintEl.classList.add('hidden'); }
    var dx = x - lastX, dy = y - lastY;
    lastX = x; lastY = y;
    targetYaw -= dx * 0.0032;
    targetPitch -= dy * 0.0032;
    targetPitch = Math.max(-0.5, Math.min(0.5, targetPitch));
  }
  function endDrag(){ dragging = false; }

  function bindInteraction(){
    shell.addEventListener('mousedown', function(e){ startDrag(e.clientX, e.clientY); });
    window.addEventListener('mousemove', function(e){ moveDrag(e.clientX, e.clientY); });
    window.addEventListener('mouseup', endDrag);
    shell.addEventListener('touchstart', function(e){ startDrag(e.touches[0].clientX, e.touches[0].clientY); }, {passive:true});
    shell.addEventListener('touchmove', function(e){ moveDrag(e.touches[0].clientX, e.touches[0].clientY); }, {passive:true});
    shell.addEventListener('touchend', endDrag);
  }

  function updateRoomUI(){
    roomLabelEl.textContent = ROOMS[currentRoom].name;
    Array.prototype.forEach.call(dotsEl.children, function(d, idx){
      d.classList.toggle('active', idx === currentRoom);
    });
  }

  function goToRoom(i){
    i = Math.max(0, Math.min(ROOMS.length - 1, i));
    if(i === currentRoom || travelling) return;
    travelling = true;
    currentRoom = i;
    travelFromZ = camZ;
    travelToZ = roomCenterZ(i);
    travelStart = performance.now();
    updateRoomUI();
  }

  function bindNav(){
    ROOMS.forEach(function(_, i){
      var dot = document.createElement('div');
      dot.className = 'troom-dot' + (i === 0 ? ' active' : '');
      dot.addEventListener('click', function(){ goToRoom(i); });
      dotsEl.appendChild(dot);
    });
    prevBtn.addEventListener('click', function(){ goToRoom(currentRoom - 1); });
    nextBtn.addEventListener('click', function(){ goToRoom(currentRoom + 1); });
  }

  function easeInOutCubic(t){ return t < 0.5 ? 4*t*t*t : 1 - Math.pow(-2*t+2, 3)/2; }

  function loop(now){
    requestAnimationFrame(loop);

    yaw += (targetYaw - yaw) * 0.12;
    pitch += (targetPitch - pitch) * 0.12;
    camera.rotation.order = 'YXZ';
    camera.rotation.set(pitch, yaw, 0);

    if(travelling){
      var t = (now - travelStart) / travelDuration;
      if(t >= 1){ t = 1; travelling = false; }
      var e = easeInOutCubic(t);
      camZ = travelFromZ + (travelToZ - travelFromZ) * e;
      camera.fov = baseFov + Math.sin(Math.PI * e) * 9;
      camera.updateProjectionMatrix();
    }
    camera.position.set(0, 1.6, camZ);

    spinningMeshes.forEach(function(m){ m.rotation.y += 0.006; });

    if(dustPoints){
      var pos = dustPoints.geometry.attributes.position;
      for(var i=0;i<pos.count;i++){
        var y = pos.getY(i) + 0.0025;
        if(y > HALL_HEIGHT) y = 0;
        pos.setY(i, y);
      }
      pos.needsUpdate = true;
    }

    renderer.render(scene, camera);

    if(firstFrame){ firstFrame = false; loadingEl.classList.add('hidden'); }
  }

  function init(){
    renderer = new THREE.WebGLRenderer({canvas: canvasEl, antialias:true});
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x020203);
    scene.fog = new THREE.Fog(0x020203, 8, 34);

    var r = shellSize();
    camera = new THREE.PerspectiveCamera(baseFov, r.width / Math.max(r.height,1), 0.1, 200);
    camera.position.set(0, 1.6, camZ);

    buildHall();
    resize();

    window.addEventListener('resize', resize);
    bindInteraction();
    bindNav();

    requestAnimationFrame(loop);
  }

  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
