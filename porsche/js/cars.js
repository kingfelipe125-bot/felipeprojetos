// ===================================================================
//  cars.js — carros estilizados 100% procedurais (nenhum modelo
//  oficial é utilizado; as formas são desenhadas em código)
// ===================================================================
import * as THREE from 'three';

// ---------- materiais ----------
export function paintMaterial(color, opts = {}) {
  return new THREE.MeshPhysicalMaterial({
    color,
    metalness: opts.metalness ?? 0.55,
    roughness: opts.roughness ?? 0.28,
    clearcoat: 1.0,
    clearcoatRoughness: 0.08,
    envMapIntensity: opts.env ?? 1.4,
  });
}

const glassMat = new THREE.MeshPhysicalMaterial({
  color: 0x0a0e14, metalness: 0.1, roughness: 0.05,
  clearcoat: 1, clearcoatRoughness: 0.03, envMapIntensity: 2.2,
});
const tireMat   = new THREE.MeshStandardMaterial({ color: 0x0a0a0c, roughness: 0.92, metalness: 0 });
const rimMat    = new THREE.MeshStandardMaterial({ color: 0xc8ccd2, roughness: 0.22, metalness: 1.0, envMapIntensity: 1.4 });
const darkMat   = new THREE.MeshStandardMaterial({ color: 0x08080a, roughness: 0.85, metalness: 0.2 });
const chromeMat = new THREE.MeshStandardMaterial({ color: 0xe8e8ec, roughness: 0.12, metalness: 1.0, envMapIntensity: 1.6 });

// ---------- roda ----------
export function buildWheel(r = 0.435) {
  const g = new THREE.Group();
  const tire = new THREE.Mesh(new THREE.TorusGeometry(r * 0.75, r * 0.26, 18, 36), tireMat);
  g.add(tire);
  const rim = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.52, r * 0.52, 0.14, 24), rimMat);
  rim.rotation.x = Math.PI / 2;
  g.add(rim);
  for (let i = 0; i < 5; i++) {
    const spoke = new THREE.Mesh(new THREE.BoxGeometry(0.055, r * 0.95, 0.05), rimMat);
    spoke.rotation.z = (i / 5) * Math.PI * 2;
    spoke.position.z = 0.055;
    g.add(spoke);
  }
  const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.2, 12), chromeMat);
  hub.rotation.x = Math.PI / 2;
  g.add(hub);
  const disc = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.42, r * 0.42, 0.04, 20), chromeMat);
  disc.rotation.x = Math.PI / 2;
  disc.position.z = -0.06;
  g.add(disc);
  return g;
}

// ---------- silhueta paramétrica ----------
// Perfil lateral desenhado com curvas: a "flyline" clássica.
function bodyShape(p) {
  const s = new THREE.Shape();
  const L = p.len;                       // meia-distância do comprimento
  const wf = p.wheelF, wr = -p.wheelR;   // centros dos arcos de roda
  const AR = p.archR;
  const bottom = 0.34;

  s.moveTo(-L, 0.44);
  s.quadraticCurveTo(-L - 0.08, p.tailY * 0.82, -L + 0.12, p.tailY);           // traseira
  s.quadraticCurveTo(-L / 2, p.tailY + 0.1, p.windX - 0.2, p.hoodY + 0.06);    // linha de cintura
  s.quadraticCurveTo(p.windX + 0.35, p.hoodY + 0.02, L - 0.5, p.hoodY - 0.03); // capô
  s.quadraticCurveTo(L + 0.05, p.noseY + 0.12, L + 0.1, p.noseY);              // nariz
  s.quadraticCurveTo(L + 0.12, 0.4, L - 0.12, bottom);                          // para-choque
  // parte de baixo (voltando), com os arcos das rodas
  s.lineTo(wf + AR, bottom);
  s.absarc(wf, bottom, AR, 0, Math.PI, false);
  s.lineTo(wr + AR, bottom);
  s.absarc(wr, bottom, AR, 0, Math.PI, false);
  s.lineTo(-L, 0.44);
  return s;
}

function canopyShape(p) {
  const s = new THREE.Shape();
  const L = p.len;
  s.moveTo(-L + 0.35, p.tailY - 0.06);
  s.quadraticCurveTo(-L + 0.95, p.tailY + (p.roofY - p.tailY) * 0.44,
                     p.roofX - 0.82, p.roofY - 0.1);
  s.quadraticCurveTo(p.roofX - 0.33, p.roofY - 0.055, p.roofX + 0.22, p.roofY - 0.055);
  s.quadraticCurveTo(p.roofX + 0.75, p.roofY - 0.11, p.windX - 0.05, p.hoodY + 0.1);
  s.lineTo(p.windX - 0.05, p.hoodY - 0.05);
  s.lineTo(-L + 0.35, p.tailY - 0.28);
  s.closePath();
  return s;
}

// presets ---------------------------------------------------------------
export const CAR_PRESETS = {
  hero911: {
    len: 2.3, roofY: 1.32, roofX: 0.05, windX: 1.02, hoodY: 0.78,
    noseY: 0.52, tailY: 0.68, wheelF: 1.42, wheelR: 1.42, archR: 0.52,
    width: 1.52, color: 0x1c2340, spoiler: false,
  },
  classic911: {
    len: 2.25, roofY: 1.34, roofX: 0.0, windX: 0.98, hoodY: 0.76,
    noseY: 0.5, tailY: 0.66, wheelF: 1.4, wheelR: 1.4, archR: 0.52,
    width: 1.48, color: 0xb01e23, spoiler: false,
  },
  p356: {
    len: 2.0, roofY: 1.3, roofX: -0.12, windX: 0.72, hoodY: 0.82,
    noseY: 0.6, tailY: 0.78, wheelF: 1.22, wheelR: 1.22, archR: 0.5,
    width: 1.5, color: 0xc4c9cf, spoiler: false,
  },
  p917: {
    len: 2.55, roofY: 1.02, roofX: 0.35, windX: 1.15, hoodY: 0.58,
    noseY: 0.32, tailY: 0.82, wheelF: 1.55, wheelR: 1.5, archR: 0.5,
    width: 1.85, color: 0xcfccc2, spoiler: false, tailFins: true, race: true,
  },
  p918: {
    len: 2.35, roofY: 1.12, roofX: 0.15, windX: 1.05, hoodY: 0.6,
    noseY: 0.4, tailY: 0.7, wheelF: 1.45, wheelR: 1.45, archR: 0.52,
    width: 1.7, color: 0x565e68, spoiler: true, hybrid: true,
  },
  techSilver: {
    len: 2.3, roofY: 1.32, roofX: 0.05, windX: 1.02, hoodY: 0.78,
    noseY: 0.52, tailY: 0.68, wheelF: 1.42, wheelR: 1.42, archR: 0.52,
    width: 1.52, color: 0xaab0b8, spoiler: false,
  },
};

// -----------------------------------------------------------------------
// buildCar: retorna { group, parts } — parts têm vetores de explosão
// para a animação de acoplar/desacoplar do capítulo de tecnologia.
// -----------------------------------------------------------------------
export function buildCar(presetName, opts = {}) {
  const p = { ...CAR_PRESETS[presetName], ...opts };
  const group = new THREE.Group();
  const paint = paintMaterial(p.color, p.race ? { metalness: 0.15, roughness: 0.52, env: 0.6 } : {});

  const parts = { body: null, wheels: [], engineMount: null, chassis: null };

  // ---- casco ----
  const body = new THREE.Group();
  const extrude = {
    depth: p.width, bevelEnabled: true, bevelThickness: 0.17,
    bevelSize: 0.15, bevelSegments: 5, curveSegments: 26,
  };
  const shell = new THREE.Mesh(new THREE.ExtrudeGeometry(bodyShape(p), extrude), paint);
  shell.geometry.translate(0, 0, -p.width / 2);
  shell.castShadow = true;
  body.add(shell);

  const canW = p.width * 0.66;
  const canopy = new THREE.Mesh(new THREE.ExtrudeGeometry(canopyShape(p), {
    depth: canW, bevelEnabled: true, bevelThickness: 0.09,
    bevelSize: 0.08, bevelSegments: 4, curveSegments: 22,
  }), glassMat);
  canopy.geometry.translate(0, 0.045, -canW / 2);
  body.add(canopy);

  // caixas de roda escuras (bloqueiam a visão através dos arcos)
  for (const wx of [p.wheelF, -p.wheelR]) {
    const wellBox = new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.62, p.width * 0.98), darkMat);
    wellBox.position.set(wx, 0.62, 0);
    body.add(wellBox);
  }

  // faróis
  const lightMat = new THREE.MeshStandardMaterial({
    color: 0xfff3d6, emissive: 0xffedb8, emissiveIntensity: opts.lightsOn ? 3.2 : 0.55,
    roughness: 0.2,
  });
  for (const sz of [1, -1]) {
    const hl = new THREE.Mesh(new THREE.SphereGeometry(0.115, 18, 14), lightMat);
    hl.position.set(p.len - 0.18, p.noseY + 0.22, sz * (p.width / 2 + 0.02));
    body.add(hl);
  }
  parts.headlightMat = lightMat;

  // barra de luz traseira
  const tail = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.075, p.width * 0.85),
    new THREE.MeshStandardMaterial({ color: 0x300204, emissive: 0xff1a22, emissiveIntensity: opts.lightsOn ? 3.4 : 1.1 }));
  tail.position.set(-p.len - 0.06, p.tailY - 0.1, 0);
  body.add(tail);

  // retrovisores + escapamentos
  for (const sz of [1, -1]) {
    const mir = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.07, 0.16), paint);
    mir.position.set(p.windX - 0.15, p.hoodY + 0.24, sz * (p.width / 2 + 0.2));
    body.add(mir);
    const ex = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.22, 12), chromeMat);
    ex.rotation.z = Math.PI / 2;
    ex.position.set(-p.len - 0.05, 0.26, sz * 0.26);
    body.add(ex);
  }

  if (p.spoiler) {
    const wing = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.05, p.width * 0.9), paint);
    wing.position.set(-p.len + 0.35, p.tailY + 0.3, 0);
    body.add(wing);
    for (const sz of [1, -1]) {
      const strut = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.26, 0.05), darkMat);
      strut.position.set(-p.len + 0.4, p.tailY + 0.14, sz * p.width * 0.32);
      body.add(strut);
    }
  }

  if (p.tailFins) {
    for (const sz of [1, -1]) {
      const fin = new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.42, 0.05), paint);
      fin.position.set(-p.len + 0.5, p.tailY + 0.14, sz * p.width * 0.42);
      body.add(fin);
    }
    const plane = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.04, p.width * 0.92), paint);
    plane.position.set(-p.len + 0.42, p.tailY + 0.33, 0);
    body.add(plane);
  }

  body.userData.basePos = new THREE.Vector3(0, 0, 0);
  body.userData.explode = new THREE.Vector3(0, 2.4, 0);
  group.add(body);
  parts.body = body;

  // ---- rodas ----
  const wheelR = 0.435;
  const zOut = p.width / 2 - 0.12;
  const wheelDefs = [
    [p.wheelF, zOut, 1], [p.wheelF, -zOut, -1],
    [-p.wheelR, zOut, 1], [-p.wheelR, -zOut, -1],
  ];
  for (const [wx, wz, sz] of wheelDefs) {
    const w = buildWheel(wheelR);
    w.position.set(wx, wheelR, wz);
    if (sz < 0) w.rotation.y = Math.PI;
    w.userData.basePos = w.position.clone();
    w.userData.explode = new THREE.Vector3(Math.sign(wx) * 0.7, 0.25, sz * 1.5);
    w.castShadow = true;
    group.add(w);
    parts.wheels.push(w);
  }

  // ---- chassi opcional (aparece quando a carroceria "desacopla") ----
  if (opts.withChassis) {
    const ch = new THREE.Group();
    const pan = new THREE.Mesh(new THREE.BoxGeometry(p.len * 1.75, 0.08, p.width * 0.82),
      new THREE.MeshStandardMaterial({ color: 0x16181c, roughness: 0.55, metalness: 0.8 }));
    pan.position.y = 0.36;
    ch.add(pan);
    for (const sz of [1, -1]) {
      const rail = new THREE.Mesh(new THREE.BoxGeometry(p.len * 1.75, 0.1, 0.09),
        new THREE.MeshStandardMaterial({ color: 0x24262c, roughness: 0.4, metalness: 0.9 }));
      rail.position.set(0, 0.44, sz * p.width * 0.3);
      ch.add(rail);
    }
    // bancos
    for (const sz of [1, -1]) {
      const seat = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.16, 0.46), darkMat);
      seat.position.set(0.15, 0.5, sz * 0.36);
      ch.add(seat);
      const back = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.5, 0.46), darkMat);
      back.position.set(-0.15, 0.68, sz * 0.36);
      back.rotation.z = -0.18;
      ch.add(back);
    }
    ch.userData.basePos = new THREE.Vector3(0, 0, 0);
    ch.userData.explode = new THREE.Vector3(0, 0, 0);
    group.add(ch);
    parts.chassis = ch;
  }

  group.userData.parts = parts;
  group.traverse(o => { if (o.isMesh) o.castShadow = true; });
  return { group, parts };
}
