// ===================================================================
//  world.js — as cinco salas do filme, corredores, luzes e cenografia
// ===================================================================
import * as THREE from 'three';
import { buildCar } from './cars.js';
import { buildFlatSix } from './engine.js';

const GOLD = 0xc9a227;

const wallMat = new THREE.MeshStandardMaterial({ color: 0x0c0c10, roughness: 0.92, metalness: 0.08 });
const floorMat = new THREE.MeshStandardMaterial({ color: 0x0a0a0d, roughness: 0.18, metalness: 0.75, envMapIntensity: 0.9 });

function glowMat(color = GOLD, intensity = 2.2) {
  return new THREE.MeshStandardMaterial({ color: 0x000000, emissive: color, emissiveIntensity: intensity });
}

// cone de luz "volumétrico" fake
function lightCone(r1, r2, h, opacity = 0.06) {
  return new THREE.Mesh(
    new THREE.CylinderGeometry(r1, r2, h, 26, 1, true),
    new THREE.MeshBasicMaterial({
      color: 0xfff2cf, transparent: true, opacity,
      blending: THREE.AdditiveBlending, side: THREE.DoubleSide, depthWrite: false,
    })
  );
}

function textPanel(main, sub, w = 3.4, h = 2.1, opts = {}) {
  const cv = document.createElement('canvas');
  cv.width = 1024; cv.height = Math.round(1024 * h / w);
  const c = cv.getContext('2d');
  c.fillStyle = 'rgba(8,8,11,0.88)';
  c.fillRect(0, 0, cv.width, cv.height);
  c.strokeStyle = 'rgba(201,162,39,0.85)';
  c.lineWidth = 4;
  c.strokeRect(26, 26, cv.width - 52, cv.height - 52);
  c.fillStyle = '#c9a227';
  c.font = `700 ${opts.mainSize || 200}px Georgia, serif`;
  c.textAlign = 'center'; c.textBaseline = 'middle';
  c.fillText(main, cv.width / 2, cv.height / 2 - (sub ? 45 : 0));
  if (sub) {
    c.fillStyle = 'rgba(242,239,232,0.8)';
    c.font = `400 ${opts.subSize || 52}px Georgia, serif`;
    c.fillText(sub, cv.width / 2, cv.height / 2 + 125);
  }
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return new THREE.Mesh(
    new THREE.PlaneGeometry(w, h),
    new THREE.MeshStandardMaterial({
      map: tex, emissive: 0xffffff, emissiveMap: tex, emissiveIntensity: 0.85,
      roughness: 0.4, transparent: true,
    })
  );
}

// sala retangular com portais nas duas pontas
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
    // moldura luminosa do portal
    const frame = new THREE.Mesh(new THREE.BoxGeometry(door + 0.24, 0.09, 0.12), glowMat(GOLD, 1.15));
    frame.position.set(0, 4.6, z);
    g.add(frame);
    for (const sx of [1, -1]) {
      const post = new THREE.Mesh(new THREE.BoxGeometry(0.09, 4.6, 0.12), glowMat(GOLD, 1.15));
      post.position.set(sx * (door / 2 + 0.08), 2.3, z);
      g.add(post);
    }
  }
  scene.add(g);
  return g;
}

// corredor entre salas (túnel de transição)
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
      const strip = new THREE.Mesh(new THREE.BoxGeometry(0.06, 3.6, 0.1), glowMat(GOLD, 0.95));
      strip.position.set(sx * 3.32, 1.9, zPos);
      g.add(strip);
    }
    const topStrip = new THREE.Mesh(new THREE.BoxGeometry(6.4, 0.06, 0.1), glowMat(GOLD, 0.95));
    topStrip.position.set(0, 4.35, zPos);
    g.add(topStrip);
  }
  scene.add(g);
  return g;
}

function spot(scene, x, y, z, tx, ty, tz, { color = 0xfff1d0, intensity = 260, angle = 0.5, penumbra = 0.55, shadow = false, dist = 60 } = {}) {
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

  // piso contínuo, polido
  const floor = new THREE.Mesh(new THREE.BoxGeometry(90, 0.4, 320), floorMat);
  floor.position.set(0, -0.2, -105);
  floor.receiveShadow = true;
  scene.add(floor);

  scene.add(new THREE.AmbientLight(0x232838, 0.85));

  // ================= SALA 01 — O SALÃO (z 0) =================
  makeRoom(scene, 0, { W: 30, L: 32 });
  makeCorridor(scene, -16, -30);

  // plataforma giratória
  const turntable = new THREE.Group();
  const disc = new THREE.Mesh(new THREE.CylinderGeometry(4.1, 4.35, 0.22, 48),
    new THREE.MeshStandardMaterial({ color: 0x121216, roughness: 0.3, metalness: 0.85 }));
  disc.position.y = 0.11;
  disc.receiveShadow = true;
  turntable.add(disc);
  const rim = new THREE.Mesh(new THREE.TorusGeometry(4.22, 0.035, 10, 72), glowMat(GOLD, 2.4));
  rim.rotation.x = Math.PI / 2;
  rim.position.y = 0.23;
  turntable.add(rim);

  const hero = buildCar('hero911');
  hero.group.position.y = 0.22;
  turntable.add(hero.group);
  scene.add(turntable);

  // anel de luz no teto + cone volumétrico
  const halo = new THREE.Mesh(new THREE.TorusGeometry(3.4, 0.09, 12, 64), glowMat(0xfff3d6, 1.9));
  halo.rotation.x = Math.PI / 2;
  halo.position.y = 8.6;
  scene.add(halo);
  const cone = lightCone(3.2, 4.6, 8.4, 0.022);
  cone.position.y = 4.4;
  scene.add(cone);

  spot(scene, 0, 9, 4, 0, 0.6, 0, { intensity: 420, angle: 0.62, shadow: true });
  spot(scene, -8, 5, -8, 0, 0.8, 0, { color: 0x8fb7ff, intensity: 35, angle: 0.4 });
  spot(scene, 9, 4.5, 6, 0, 0.9, 0, { color: 0xffd9a0, intensity: 80, angle: 0.45 });

  // colunas
  for (const [cx, cz] of [[-11, 10], [11, 10], [-11, -10], [11, -10]]) {
    const col = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.6, 10, 18), wallMat);
    col.position.set(cx, 5, cz);
    scene.add(col);
    const colGlow = new THREE.Mesh(new THREE.BoxGeometry(0.07, 8.6, 0.07), glowMat(GOLD, 1.1));
    colGlow.position.set(cx - Math.sign(cx) * 0.62, 4.3, cz);
    scene.add(colGlow);
  }

  world.updates.push((dt) => { turntable.rotation.y += dt * 0.14; });

  // ================= SALA 02 — HISTÓRIA (z -46) =================
  makeRoom(scene, -46, { W: 26, L: 32 });
  makeCorridor(scene, -62, -76);

  const panels = [
    ['1931', 'O escritório de Stuttgart', -8, -36],
    ['1948', 'Nasce o 356', 8, -41.5],
    ['1963', 'O 911 é apresentado', -8, -47],
    ['1970', 'A glória em Le Mans', 8, -52.5],
    ['HOJE', 'Híbridos e elétricos', -8, -58],
  ];
  for (const [year, sub, px, pz] of panels) {
    const panel = textPanel(year, sub, 4.2, 2.6);
    panel.position.set(px, 3.1, pz);
    panel.rotation.y = px > 0 ? -Math.PI / 2.6 : Math.PI / 2.6;
    scene.add(panel);
    const under = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.06, 3.4), glowMat(GOLD, 1.5));
    under.position.set(px, 1.6, pz);
    scene.add(under);
  }

  // "a ideia" — carro em wireframe dourado girando num pedestal
  const sketchPed = new THREE.Mesh(new THREE.CylinderGeometry(2.5, 2.7, 0.5, 36),
    new THREE.MeshStandardMaterial({ color: 0x111116, roughness: 0.35, metalness: 0.8 }));
  sketchPed.position.set(0, 0.25, -47);
  scene.add(sketchPed);
  const sketch = buildCar('classic911');
  const sketchGroup = new THREE.Group();
  sketch.group.traverse(o => {
    if (o.isMesh) {
      // esconde caixas internas (caixas de roda etc.) que poluem o wireframe
      if (o.geometry.type === 'BoxGeometry' && (o.geometry.parameters?.width || 0) > 0.6) {
        o.visible = false;
        return;
      }
      o.material = new THREE.MeshBasicMaterial({
        color: GOLD, wireframe: true, transparent: true, opacity: 0.22,
      });
      o.castShadow = false;
    }
  });
  sketchGroup.add(sketch.group);
  sketchGroup.position.set(0, 0.5, -47);
  sketchGroup.scale.setScalar(0.85);
  scene.add(sketchGroup);
  world.updates.push((dt) => { sketchGroup.rotation.y += dt * 0.25; });

  spot(scene, 0, 9, -46, 0, 1, -47, { intensity: 220, angle: 0.55, shadow: true });
  spot(scene, 0, 7, -38, 0, 3, -46, { color: 0x9db4e8, intensity: 90, angle: 0.8 });
  for (const [lx, lz] of [[-5, -40], [5, -50], [0, -57]]) {
    const pl = new THREE.PointLight(0xffd9a0, 14, 16, 1.8);
    pl.position.set(lx, 4.2, lz);
    scene.add(pl);
  }

  // ================= SALA 03 — TECNOLOGIA (z -92) =================
  makeRoom(scene, -92, { W: 26, L: 32 });
  makeCorridor(scene, -108, -122);

  // plataforma hexagonal de laboratório
  const hex = new THREE.Mesh(new THREE.CylinderGeometry(5, 5.25, 0.3, 6),
    new THREE.MeshStandardMaterial({ color: 0x101318, roughness: 0.25, metalness: 0.9 }));
  hex.position.set(0, 0.15, -92);
  hex.receiveShadow = true;
  scene.add(hex);
  const hexEdge = new THREE.Mesh(new THREE.TorusGeometry(5.05, 0.03, 8, 6), glowMat(0x66c7ff, 1.5));
  hexEdge.rotation.x = Math.PI / 2;
  hexEdge.position.set(0, 0.32, -92);
  scene.add(hexEdge);

  const techCar = buildCar('techSilver', { withChassis: true });
  techCar.group.position.set(0, 0.3, -92);
  scene.add(techCar.group);

  const engine = buildFlatSix();
  // motor montado na traseira do carro (traseira = -X local do carro)
  const engineHome = new THREE.Vector3(-1.35, 0.95, 0);
  engine.group.position.copy(engineHome);
  engine.group.scale.setScalar(0.62);
  engine.group.rotation.y = Math.PI / 2; // virabrequim alinhado ao comprimento do carro
  techCar.group.add(engine.group);

  spot(scene, 0, 9, -88, 0, 1, -92, { intensity: 210, angle: 0.6, shadow: true });
  spot(scene, -8, 4, -96, 0, 1, -92, { color: 0x5fa8ff, intensity: 45, angle: 0.5 });
  spot(scene, 8, 4, -88, 0, 1.2, -92, { color: 0xffb35c, intensity: 55, angle: 0.55 });

  // painéis técnicos nas paredes
  const specPanel = textPanel('BOXER 6', 'Cilindros contrapostos · refrigeração a ar', 5.4, 2.2, { mainSize: 150, subSize: 44 });
  specPanel.position.set(-12.6, 4.6, -92);
  specPanel.rotation.y = Math.PI / 2;
  scene.add(specPanel);
  const specPanel2 = textPanel('PDK', 'Dupla embreagem · 8 marchas', 5.4, 2.2, { mainSize: 150, subSize: 44 });
  specPanel2.position.set(12.6, 4.6, -92);
  specPanel2.rotation.y = -Math.PI / 2;
  scene.add(specPanel2);

  // explosão do CARRO + do MOTOR num único parâmetro t ∈ [0,1]
  // 0 → tudo acoplado · 1 → carroceria erguida, rodas afastadas, motor aberto
  const techParts = techCar.parts;
  function setCarExplode(t) {
    const e = t * t * (3 - 2 * t);
    techParts.body.position.copy(techParts.body.userData.basePos)
      .addScaledVector(techParts.body.userData.explode, e);
    for (const w of techParts.wheels) {
      w.position.copy(w.userData.basePos).addScaledVector(w.userData.explode, e);
    }
    // o motor desliza para fora e sobe, depois abre as próprias peças
    const slide = Math.min(1, t * 1.8);
    const se = slide * slide * (3 - 2 * slide);
    engine.group.position.copy(engineHome).add(new THREE.Vector3(-1.7 * se, 1.05 * se, 0));
    const inner = THREE.MathUtils.clamp((t - 0.45) / 0.55, 0, 1);
    engine.setExplode(inner);
  }
  setCarExplode(0);
  world.updates.push((dt) => engine.update(dt));

  world.tech = { car: techCar, engine, setCarExplode, carGroup: techCar.group };

  // ================= SALA 04 — LENDAS (z -138) =================
  makeRoom(scene, -138, { W: 30, L: 34 });
  makeCorridor(scene, -155, -167);

  const legends = [
    { preset: 'p356', name: '356', year: '1948', x: -10.5 },
    { preset: 'classic911', name: '911', year: '1963', x: -3.5 },
    { preset: 'p917', name: '917', year: '1970', x: 3.5 },
    { preset: 'p918', name: '918', year: '2013', x: 10.5 },
  ];
  world.gallery = [];
  for (const l of legends) {
    const ped = new THREE.Mesh(new THREE.CylinderGeometry(2.55, 2.75, 0.5, 40),
      new THREE.MeshStandardMaterial({ color: 0x111116, roughness: 0.3, metalness: 0.85 }));
    ped.position.set(l.x, 0.25, -138);
    ped.receiveShadow = true;
    scene.add(ped);
    const pRim = new THREE.Mesh(new THREE.TorusGeometry(2.62, 0.03, 8, 48), glowMat(GOLD, 2.0));
    pRim.rotation.x = Math.PI / 2;
    pRim.position.set(l.x, 0.52, -138);
    scene.add(pRim);

    const car = buildCar(l.preset);
    const spin = new THREE.Group();
    spin.add(car.group);
    spin.position.set(l.x, 0.5, -138);
    spin.scale.setScalar(0.78);
    spin.rotation.y = -0.5;
    scene.add(spin);
    world.gallery.push(spin);

    const cone2 = lightCone(1.6, 2.7, 7.6, 0.013);
    cone2.position.set(l.x, 4.4, -138);
    scene.add(cone2);
    spot(scene, l.x, 8.6, -136, l.x, 0.8, -138, { intensity: 150, angle: 0.48, shadow: l.x < 0 });

    const plate = textPanel(l.name, l.year, 1.35, 0.8, { mainSize: 165, subSize: 60 });
    plate.position.set(l.x, 0.5, -135.35);
    plate.rotation.x = -0.12;
    scene.add(plate);
  }
  world.updates.push((dt) => { for (const s of world.gallery) s.rotation.y += dt * 0.18; });

  // ================= SALA 05 — A ESTRADA (z -184, céu aberto) =================
  // estrada
  const roadMat = new THREE.MeshStandardMaterial({ color: 0x08080a, roughness: 0.85, metalness: 0.15 });
  const road = new THREE.Mesh(new THREE.BoxGeometry(9, 0.42, 130), roadMat);
  road.position.set(0, -0.18, -225);
  scene.add(road);

  // faixas centrais animadas (a ilusão de velocidade)
  const dashes = new THREE.Group();
  const dashMat = glowMat(0xfff3d6, 1.3);
  for (let i = 0; i < 26; i++) {
    const d = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.02, 2.2), dashMat);
    d.position.set(0, 0.06, -168 - i * 5);
    dashes.add(d);
  }
  scene.add(dashes);

  // postes de luz da estrada
  const posts = new THREE.Group();
  for (let i = 0; i < 14; i++) {
    for (const sx of [1, -1]) {
      const pole = new THREE.Mesh(new THREE.BoxGeometry(0.12, 3.4, 0.12), wallMat);
      pole.position.set(sx * 5.6, 1.7, -170 - i * 9);
      posts.add(pole);
      const lamp = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.08, 0.14), glowMat(0xffd9a0, 2.4));
      lamp.position.set(sx * 5.25, 3.36, -170 - i * 9);
      posts.add(lamp);
    }
  }
  scene.add(posts);

  // colinas distantes + estrelas + lua
  for (let i = 0; i < 9; i++) {
    const hill = new THREE.Mesh(new THREE.ConeGeometry(14 + Math.random() * 12, 7 + Math.random() * 7, 5),
      new THREE.MeshStandardMaterial({ color: 0x07070a, roughness: 1 }));
    hill.position.set((Math.random() - 0.5) * 130, 0, -235 - Math.random() * 45);
    scene.add(hill);
  }
  const starGeo = new THREE.BufferGeometry();
  const starPos = [];
  for (let i = 0; i < 900; i++) {
    const th = Math.random() * Math.PI * 2, ph = Math.random() * Math.PI * 0.48;
    const r = 130 + Math.random() * 40;
    starPos.push(r * Math.sin(ph) * Math.cos(th), r * Math.cos(ph) + 2, -195 + r * Math.sin(ph) * Math.sin(th) * 0.9);
  }
  starGeo.setAttribute('position', new THREE.Float32BufferAttribute(starPos, 3));
  const stars = new THREE.Points(starGeo, new THREE.PointsMaterial({ color: 0xcdd8ff, size: 0.35, sizeAttenuation: true, transparent: true, opacity: 0.85 }));
  scene.add(stars);
  const moon = new THREE.Mesh(new THREE.SphereGeometry(4.2, 24, 18), glowMat(0xdfe6ff, 1.1));
  moon.position.set(-38, 34, -280);
  scene.add(moon);
  scene.add(new THREE.HemisphereLight(0x2a3350, 0x05050a, 0.6));

  // o carro em movimento
  const finaleCar = buildCar('hero911', { lightsOn: true });
  const finaleGroup = new THREE.Group();
  finaleGroup.add(finaleCar.group);
  finaleCar.group.rotation.y = Math.PI / 2; // frente (+X local) aponta para -Z
  finaleGroup.position.set(0, 0, -186);
  scene.add(finaleGroup);

  // fachos dos faróis
  for (const sx of [0.55, -0.55]) {
    const beam = lightCone(0.14, 1.5, 9, 0.075);
    beam.rotation.x = Math.PI / 2;
    beam.position.set(sx, 0.72, -195.5);
    finaleGroup.add(beam);
  }
  const headBeam = new THREE.SpotLight(0xfff2cf, 120, 40, 0.5, 0.7, 1.4);
  headBeam.position.set(0, 1, -188);
  headBeam.target.position.set(0, 0.3, -215);
  scene.add(headBeam, headBeam.target);

  spot(scene, 4, 6, -181, 0, 0.8, -186, { color: 0x8fb7ff, intensity: 130, angle: 0.7 });

  world.updates.push((dt, time) => {
    // faixas e postes correndo para trás = carro avançando
    const v = 26 * dt;
    dashes.children.forEach(d => {
      d.position.z += v;
      if (d.position.z > -166) d.position.z -= 130;
    });
    posts.children.forEach(p => {
      p.position.z += v;
      if (p.position.z > -166) p.position.z -= 126;
    });
    // balanço sutil da carroceria + rodas girando
    finaleCar.parts.body.position.y = 0.012 * Math.sin(time * 7) + 0.006 * Math.sin(time * 13);
    for (const w of finaleCar.parts.wheels) w.rotation.z -= dt * 18;
    finaleGroup.position.x = Math.sin(time * 0.4) * 0.35;
  });

  world.finaleGroup = finaleGroup;
  return world;
}
