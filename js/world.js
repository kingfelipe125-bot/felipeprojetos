// ===================================================================
//  world.js — as cinco salas do arquivo Stark, corredores e luzes
// ===================================================================
import * as THREE from 'three';
import { buildSuit } from './suit.js';
import { buildReactor } from './reactor.js';

const CYAN = 0x3ee6df;
const GOLDW = 0xf0a500;
const RED = 0xc1121f;

const wallMat = new THREE.MeshStandardMaterial({ color: 0x0c0c10, roughness: 0.92, metalness: 0.08 });
const floorMat = new THREE.MeshStandardMaterial({ color: 0x0a0a0d, roughness: 0.18, metalness: 0.75, envMapIntensity: 0.9 });

function glowMat(color = CYAN, intensity = 1.4) {
  return new THREE.MeshStandardMaterial({ color: 0x000000, emissive: color, emissiveIntensity: intensity });
}

function lightCone(r1, r2, h, opacity = 0.05, color = 0xd9fbff) {
  return new THREE.Mesh(
    new THREE.CylinderGeometry(r1, r2, h, 26, 1, true),
    new THREE.MeshBasicMaterial({
      color, transparent: true, opacity,
      blending: THREE.AdditiveBlending, side: THREE.DoubleSide, depthWrite: false,
    })
  );
}

function textPanel(main, sub, w = 3.4, h = 2.1, opts = {}) {
  const cv = document.createElement('canvas');
  cv.width = 1024; cv.height = Math.round(1024 * h / w);
  const c = cv.getContext('2d');
  c.fillStyle = 'rgba(7,9,12,0.9)';
  c.fillRect(0, 0, cv.width, cv.height);
  c.strokeStyle = 'rgba(62,230,223,0.8)';
  c.lineWidth = 4;
  c.strokeRect(26, 26, cv.width - 52, cv.height - 52);
  // cantos "HUD"
  c.strokeStyle = 'rgba(240,165,0,0.9)';
  c.lineWidth = 7;
  for (const [x, y, dx, dy] of [[26, 26, 1, 1], [cv.width - 26, 26, -1, 1], [26, cv.height - 26, 1, -1], [cv.width - 26, cv.height - 26, -1, -1]]) {
    c.beginPath();
    c.moveTo(x, y + dy * 70); c.lineTo(x, y); c.lineTo(x + dx * 70, y);
    c.stroke();
  }
  c.fillStyle = '#3ee6df';
  c.font = `700 ${opts.mainSize || 190}px Arial, sans-serif`;
  c.textAlign = 'center'; c.textBaseline = 'middle';
  c.fillText(main, cv.width / 2, cv.height / 2 - (sub ? 45 : 0));
  if (sub) {
    c.fillStyle = 'rgba(233,233,238,0.82)';
    c.font = `400 ${opts.subSize || 50}px Arial, sans-serif`;
    c.fillText(sub, cv.width / 2, cv.height / 2 + 125);
  }
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return new THREE.Mesh(
    new THREE.PlaneGeometry(w, h),
    new THREE.MeshStandardMaterial({
      map: tex, emissive: 0xffffff, emissiveMap: tex, emissiveIntensity: 0.8,
      roughness: 0.4, transparent: true,
    })
  );
}

function makeRoom(scene, zc, { W = 26, L = 30, H = 10, door = 7 } = {}) {
  const g = new THREE.Group();
  for (const sx of [1, -1]) {
    const side = new THREE.Mesh(new THREE.BoxGeometry(0.4, H, L), wallMat);
    side.position.set(sx * W / 2, H / 2, zc);
    g.add(side);
  }
  const ceil = new THREE.Mesh(new THREE.BoxGeometry(W, 0.4, L), wallMat);
  ceil.position.set(0, H, zc);
  g.add(ceil);

  for (const z of [zc + L / 2, zc - L / 2]) {
    const segW = (W - door) / 2;
    for (const sx of [1, -1]) {
      const wallSeg = new THREE.Mesh(new THREE.BoxGeometry(segW, H, 0.4), wallMat);
      wallSeg.position.set(sx * (door / 2 + segW / 2), H / 2, z);
      g.add(wallSeg);
    }
    const lintel = new THREE.Mesh(new THREE.BoxGeometry(door, H - 4.6, 0.4), wallMat);
    lintel.position.set(0, 4.6 + (H - 4.6) / 2, z);
    g.add(lintel);
    const frame = new THREE.Mesh(new THREE.BoxGeometry(door + 0.24, 0.09, 0.12), glowMat(CYAN, 1.1));
    frame.position.set(0, 4.6, z);
    g.add(frame);
    for (const sx of [1, -1]) {
      const post = new THREE.Mesh(new THREE.BoxGeometry(0.09, 4.6, 0.12), glowMat(CYAN, 1.1));
      post.position.set(sx * (door / 2 + 0.08), 2.3, z);
      g.add(post);
    }
  }
  scene.add(g);
  return g;
}

function makeCorridor(scene, zStart, zEnd) {
  const g = new THREE.Group();
  const len = Math.abs(zEnd - zStart);
  const zc = (zStart + zEnd) / 2;
  for (const sx of [1, -1]) {
    const w = new THREE.Mesh(new THREE.BoxGeometry(0.4, 4.6, len), wallMat);
    w.position.set(sx * 3.55, 2.3, zc);
    g.add(w);
  }
  const top = new THREE.Mesh(new THREE.BoxGeometry(7.5, 0.4, len), wallMat);
  top.position.set(0, 4.6, zc);
  g.add(top);
  const nRings = Math.max(2, Math.floor(len / 4));
  for (let i = 1; i <= nRings; i++) {
    const zPos = zStart + (zEnd - zStart) * (i / (nRings + 1));
    for (const sx of [1, -1]) {
      const strip = new THREE.Mesh(new THREE.BoxGeometry(0.06, 3.6, 0.1), glowMat(CYAN, 0.85));
      strip.position.set(sx * 3.32, 1.9, zPos);
      g.add(strip);
    }
    const topStrip = new THREE.Mesh(new THREE.BoxGeometry(6.4, 0.06, 0.1), glowMat(GOLDW, 0.7));
    topStrip.position.set(0, 4.35, zPos);
    g.add(topStrip);
  }
  scene.add(g);
  return g;
}

function spot(scene, x, y, z, tx, ty, tz, { color = 0xeaf6ff, intensity = 220, angle = 0.5, penumbra = 0.55, shadow = false, dist = 60 } = {}) {
  const s = new THREE.SpotLight(color, intensity, dist, angle, penumbra, 1.6);
  s.position.set(x, y, z);
  s.target.position.set(tx, ty, tz);
  if (shadow) {
    s.castShadow = true;
    s.shadow.mapSize.set(1024, 1024);
    s.shadow.bias = -0.0004;
  }
  scene.add(s, s.target);
  return s;
}

// ===================================================================
export function buildWorld(scene) {
  const world = { updates: [] };

  // o piso termina depois da galeria; a sala final é céu aberto sobre a cidade
  const floor = new THREE.Mesh(new THREE.BoxGeometry(90, 0.4, 180), floorMat);
  floor.position.set(0, -0.2, -78);
  floor.receiveShadow = true;
  scene.add(floor);

  scene.add(new THREE.AmbientLight(0x1d2733, 0.9));

  // ================= SALA 01 — O ARSENAL (z 0) =================
  makeRoom(scene, 0, { W: 30, L: 32 });
  makeCorridor(scene, -16, -30);

  const turntable = new THREE.Group();
  const disc = new THREE.Mesh(new THREE.CylinderGeometry(2.6, 2.85, 0.22, 48),
    new THREE.MeshStandardMaterial({ color: 0x121216, roughness: 0.3, metalness: 0.85 }));
  disc.position.y = 0.11;
  disc.receiveShadow = true;
  turntable.add(disc);
  const rim = new THREE.Mesh(new THREE.TorusGeometry(2.7, 0.035, 10, 72), glowMat(CYAN, 1.9));
  rim.rotation.x = Math.PI / 2;
  rim.position.y = 0.23;
  turntable.add(rim);

  const heroSuit = buildSuit('mk3');
  heroSuit.group.position.y = 0.22;
  heroSuit.group.scale.setScalar(1.4);
  turntable.add(heroSuit.group);
  scene.add(turntable);

  // anéis holográficos girando ao redor
  const holo = new THREE.Group();
  for (const [r, y, sp] of [[1.9, 1.1, 0.4], [1.6, 2.2, -0.55], [2.2, 3.1, 0.3]]) {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(r, 0.012, 8, 64),
      new THREE.MeshBasicMaterial({ color: CYAN, transparent: true, opacity: 0.35, blending: THREE.AdditiveBlending }));
    ring.rotation.x = Math.PI / 2;
    ring.position.y = y;
    ring.userData.sp = sp;
    holo.add(ring);
  }
  scene.add(holo);

  const halo = new THREE.Mesh(new THREE.TorusGeometry(3.2, 0.09, 12, 64), glowMat(0xdff6ff, 1.8));
  halo.rotation.x = Math.PI / 2;
  halo.position.y = 8.6;
  scene.add(halo);
  const cone = lightCone(3.0, 4.4, 8.4, 0.014);
  cone.position.y = 4.4;
  scene.add(cone);

  spot(scene, 0, 9, 4, 0, 1.2, 0, { intensity: 380, angle: 0.6, shadow: true });
  spot(scene, -8, 5, -8, 0, 1.4, 0, { color: 0x49e0e8, intensity: 45, angle: 0.42 });
  spot(scene, 9, 4.5, 6, 0, 1.4, 0, { color: 0xffb35c, intensity: 70, angle: 0.45 });

  for (const [cx, cz] of [[-11, 10], [11, 10], [-11, -10], [11, -10]]) {
    const col = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.6, 10, 18), wallMat);
    col.position.set(cx, 5, cz);
    scene.add(col);
    const colGlow = new THREE.Mesh(new THREE.BoxGeometry(0.07, 8.6, 0.07), glowMat(RED, 0.9));
    colGlow.position.set(cx - Math.sign(cx) * 0.62, 4.3, cz);
    scene.add(colGlow);
  }

  world.updates.push((dt, time) => {
    turntable.rotation.y += dt * 0.16;
    holo.children.forEach(r => { r.rotation.z += dt * r.userData.sp; });
    holo.position.y = 0.06 * Math.sin(time * 0.8);
  });

  // ================= SALA 02 — A ORIGEM (z -46) =================
  makeRoom(scene, -46, { W: 26, L: 32 });
  makeCorridor(scene, -62, -76);

  const panels = [
    ['MK I', 'Forjada no cativeiro', -8, -36],
    ['MK II', 'O primeiro voo', 8, -41.5],
    ['MK III', 'O ícone vermelho e ouro', -8, -47],
    ['MK 42', 'O enxame autônomo', 8, -52.5],
    ['MK 50', 'A era da nanotecnologia', -8, -58],
  ];
  for (const [mark, sub, px, pz] of panels) {
    const panel = textPanel(mark, sub, 4.2, 2.6);
    panel.position.set(px, 3.1, pz);
    panel.rotation.y = px > 0 ? -Math.PI / 2.6 : Math.PI / 2.6;
    scene.add(panel);
    const under = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.06, 3.4), glowMat(GOLDW, 1.1));
    under.position.set(px, 1.6, pz);
    scene.add(under);
  }
  for (const [lx, lz] of [[-5, -40], [5, -50], [0, -57]]) {
    const pl = new THREE.PointLight(0x9adfe8, 12, 16, 1.8);
    pl.position.set(lx, 4.2, lz);
    scene.add(pl);
  }

  // "o projeto" — armadura em wireframe ciano girando (holograma de bancada)
  const sketchPed = new THREE.Mesh(new THREE.CylinderGeometry(1.7, 1.9, 0.5, 36),
    new THREE.MeshStandardMaterial({ color: 0x111116, roughness: 0.35, metalness: 0.8 }));
  sketchPed.position.set(0, 0.25, -47);
  scene.add(sketchPed);
  const sketch = buildSuit('mk3');
  sketch.group.traverse(o => {
    if (o.isMesh) {
      o.material = new THREE.MeshBasicMaterial({
        color: CYAN, wireframe: true, transparent: true, opacity: 0.3,
      });
      o.castShadow = false;
    }
  });
  const sketchGroup = new THREE.Group();
  sketchGroup.add(sketch.group);
  sketchGroup.position.set(0, 0.52, -47);
  sketchGroup.scale.setScalar(1.05);
  scene.add(sketchGroup);
  world.updates.push((dt) => { sketchGroup.rotation.y += dt * 0.35; });

  spot(scene, 0, 9, -46, 0, 1.2, -47, { intensity: 180, angle: 0.55, shadow: true });

  // ================= SALA 03 — O REATOR ARC (z -92) =================
  makeRoom(scene, -92, { W: 26, L: 32 });
  makeCorridor(scene, -108, -122);

  const hex = new THREE.Mesh(new THREE.CylinderGeometry(5, 5.25, 0.3, 6),
    new THREE.MeshStandardMaterial({ color: 0x101318, roughness: 0.25, metalness: 0.9 }));
  hex.position.set(0, 0.15, -92);
  hex.receiveShadow = true;
  scene.add(hex);
  const hexEdge = new THREE.Mesh(new THREE.TorusGeometry(5.05, 0.03, 8, 6), glowMat(CYAN, 1.3));
  hexEdge.rotation.x = Math.PI / 2;
  hexEdge.position.set(0, 0.32, -92);
  scene.add(hexEdge);

  // a armadura de teste no centro
  const techSuit = buildSuit('mk3');
  techSuit.group.position.set(0.9, 0.3, -92);
  techSuit.group.rotation.y = -0.5;
  techSuit.group.scale.setScalar(1.15);
  scene.add(techSuit.group);

  // o reator gigante de bancada, que desliza para fora do peito
  const reactor = buildReactor();
  const reactorHome = new THREE.Vector3(0.9, 1.75, -92);
  reactor.group.position.copy(reactorHome);
  reactor.group.rotation.y = -0.5;
  reactor.group.scale.setScalar(0.32);
  scene.add(reactor.group);

  spot(scene, 0, 9, -88, 0, 1.2, -92, { intensity: 190, angle: 0.6, shadow: true });
  spot(scene, -8, 4, -96, 0, 1.2, -92, { color: 0x49e0e8, intensity: 40, angle: 0.5 });
  spot(scene, 8, 4, -88, 0, 1.4, -92, { color: 0xffb35c, intensity: 45, angle: 0.55 });

  const specPanel = textPanel('ARC', 'Fusão compacta · energia quase infinita', 5.4, 2.2, { mainSize: 150, subSize: 44 });
  specPanel.position.set(-12.6, 4.6, -92);
  specPanel.rotation.y = Math.PI / 2;
  scene.add(specPanel);
  const specPanel2 = textPanel('REPULSOR', 'Propulsão vetorial estabilizada', 5.4, 2.2, { mainSize: 120, subSize: 44 });
  specPanel2.position.set(12.6, 4.6, -92);
  specPanel2.rotation.y = -Math.PI / 2;
  scene.add(specPanel2);

  // t ∈ [0,1]: armadura desacopla peça a peça; o reator sai do peito,
  // cresce para o centro da sala e se abre em camadas
  const reactorOut = new THREE.Vector3(-1.6, 2.1, -89.5);
  function setCarExplode(t) {
    techSuit.setExplode(t);
    const slide = Math.min(1, t * 1.6);
    const se = slide * slide * (3 - 2 * slide);
    reactor.group.position.lerpVectors(reactorHome, reactorOut, se);
    reactor.group.scale.setScalar(0.32 + se * 0.75);
    reactor.group.rotation.y = -0.5 + se * 1.2;
    const inner = THREE.MathUtils.clamp((t - 0.4) / 0.6, 0, 1);
    reactor.setExplode(inner);
  }
  setCarExplode(0);
  world.updates.push((dt) => reactor.update(dt));

  world.tech = { engine: reactor, setCarExplode };

  // ================= SALA 04 — AS ARMADURAS (z -138) =================
  makeRoom(scene, -138, { W: 30, L: 34 });
  makeCorridor(scene, -155, -167);

  const legends = [
    { preset: 'mk1', name: 'MK I', year: '2008', x: -10.5 },
    { preset: 'mk3', name: 'MK III', year: '2008', x: -3.5 },
    { preset: 'gold', name: 'MK 21', year: '2013', x: 3.5 },
    { preset: 'hulkbuster', name: 'MK 44', year: '2015', x: 10.5 },
  ];
  world.gallery = [];
  for (const l of legends) {
    const ped = new THREE.Mesh(new THREE.CylinderGeometry(1.8, 2.0, 0.5, 40),
      new THREE.MeshStandardMaterial({ color: 0x111116, roughness: 0.3, metalness: 0.85 }));
    ped.position.set(l.x, 0.25, -138);
    ped.receiveShadow = true;
    scene.add(ped);
    const pRim = new THREE.Mesh(new THREE.TorusGeometry(1.88, 0.03, 8, 48), glowMat(CYAN, 1.5));
    pRim.rotation.x = Math.PI / 2;
    pRim.position.set(l.x, 0.52, -138);
    scene.add(pRim);

    const suit = buildSuit(l.preset);
    const spin = new THREE.Group();
    spin.add(suit.group);
    spin.position.set(l.x, 0.5, -138);
    spin.scale.setScalar(l.preset === 'hulkbuster' ? 0.78 : 0.95);
    spin.rotation.y = -0.4;
    scene.add(spin);
    world.gallery.push(spin);

    const cone2 = lightCone(1.2, 2.2, 7.6, 0.013);
    cone2.position.set(l.x, 4.4, -138);
    scene.add(cone2);
    spot(scene, l.x, 8.6, -136, l.x, 1.2, -138, { intensity: 130, angle: 0.45, shadow: l.x < 0 });

    const plate = textPanel(l.name, l.year, 1.35, 0.8, { mainSize: 150, subSize: 60 });
    plate.position.set(l.x, 0.5, -135.6);
    plate.rotation.x = -0.12;
    scene.add(plate);
  }
  world.updates.push((dt) => { for (const s of world.gallery) s.rotation.y += dt * 0.22; });

  // ================= SALA 05 — O VOO (z -184, céu aberto) =================
  // cidade à noite lá embaixo: grade de luzes
  const cityGeo = new THREE.BufferGeometry();
  const cityPos = [];
  const cityCol = [];
  const colA = new THREE.Color(0xffd9a0), colB = new THREE.Color(0x9adfe8);
  for (let i = 0; i < 2600; i++) {
    cityPos.push((Math.random() - 0.5) * 260, -26 + Math.random() * 3.5, -150 - Math.random() * 190);
    const c = Math.random() < 0.7 ? colA : colB;
    cityCol.push(c.r, c.g, c.b);
  }
  cityGeo.setAttribute('position', new THREE.Float32BufferAttribute(cityPos, 3));
  cityGeo.setAttribute('color', new THREE.Float32BufferAttribute(cityCol, 3));
  const city = new THREE.Points(cityGeo, new THREE.PointsMaterial({ size: 0.5, vertexColors: true, transparent: true, opacity: 0.9 }));
  scene.add(city);

  // estrelas + lua
  const starGeo = new THREE.BufferGeometry();
  const starPos = [];
  for (let i = 0; i < 900; i++) {
    const th = Math.random() * Math.PI * 2, ph = Math.random() * Math.PI * 0.48;
    const r = 130 + Math.random() * 40;
    starPos.push(r * Math.sin(ph) * Math.cos(th), r * Math.cos(ph) + 2, -195 + r * Math.sin(ph) * Math.sin(th) * 0.9);
  }
  starGeo.setAttribute('position', new THREE.Float32BufferAttribute(starPos, 3));
  scene.add(new THREE.Points(starGeo, new THREE.PointsMaterial({ color: 0xcdd8ff, size: 0.35, transparent: true, opacity: 0.85 })));
  const moon = new THREE.Mesh(new THREE.SphereGeometry(4.2, 24, 18), glowMat(0xdfe6ff, 1.0));
  moon.position.set(-38, 34, -280);
  scene.add(moon);
  scene.add(new THREE.HemisphereLight(0x25304a, 0x05050a, 0.55));

  // nuvens (planos aditivos passando)
  const clouds = new THREE.Group();
  for (let i = 0; i < 14; i++) {
    const cl = new THREE.Mesh(new THREE.PlaneGeometry(14 + Math.random() * 18, 4 + Math.random() * 3),
      new THREE.MeshBasicMaterial({ color: 0x2c3a52, transparent: true, opacity: 0.16, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, depthWrite: false }));
    cl.position.set((Math.random() - 0.5) * 90, -4 - Math.random() * 10, -165 - Math.random() * 90);
    cl.rotation.x = -Math.PI / 2 + (Math.random() - 0.5) * 0.3;
    clouds.add(cl);
  }
  scene.add(clouds);

  // a armadura em voo
  const flyer = buildSuit('mk3');
  const flyGroup = new THREE.Group();
  flyer.group.position.y = -1.0; // centraliza no grupo
  flyGroup.add(flyer.group);
  flyGroup.scale.setScalar(1.5);
  flyGroup.position.set(0, 3.2, -186);
  flyGroup.rotation.x = Math.PI / 2 - 0.35; // mergulhado para frente, voando para -Z
  scene.add(flyGroup);

  // rastros dos propulsores
  for (const sx of [0.17, -0.17]) {
    const trail = lightCone(0.05, 0.42, 4.2, 0.14, 0x9af2ff);
    trail.position.set(sx, -3.0, 0); // atrás das botas, no eixo do corpo
    flyGroup.add(trail);
  }
  const flyLight = new THREE.PointLight(0x3ee6df, 16, 14, 1.7);
  flyGroup.add(flyLight);
  spot(scene, 4, 8, -181, 0, 3, -186, { color: 0x8fb7ff, intensity: 90, angle: 0.6 });

  world.updates.push((dt, time) => {
    // nuvens e cidade correndo para trás = voo para frente
    const v = 30 * dt;
    clouds.children.forEach(cl => {
      cl.position.z += v;
      if (cl.position.z > -160) cl.position.z -= 95;
    });
    flyGroup.position.y = 3.2 + Math.sin(time * 1.1) * 0.25;
    flyGroup.position.x = Math.sin(time * 0.5) * 0.9;
    flyGroup.rotation.z = Math.sin(time * 0.5) * 0.12;
  });

  return world;
}
