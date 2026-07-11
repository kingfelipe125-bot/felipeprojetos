// ===================================================================
//  engine.js — motor boxer seis cilindros procedural, com animação
//  de explosão (desacoplar) e remontagem (acoplar).
//  Eixo local do virabrequim: Z. Cilindros deitados em ±X.
// ===================================================================
import * as THREE from 'three';

const caseMat = new THREE.MeshStandardMaterial({ color: 0x2b2e34, roughness: 0.38, metalness: 0.92, envMapIntensity: 1.2 });
const finMat  = new THREE.MeshStandardMaterial({ color: 0x3d4148, roughness: 0.45, metalness: 0.9 });
const steelMat = new THREE.MeshStandardMaterial({ color: 0xb9bec6, roughness: 0.25, metalness: 1.0, envMapIntensity: 1.5 });
const goldMat = new THREE.MeshStandardMaterial({ color: 0xc9a227, roughness: 0.3, metalness: 1.0, envMapIntensity: 1.6 });
const blackMat = new THREE.MeshStandardMaterial({ color: 0x101114, roughness: 0.6, metalness: 0.5 });

function part(group, explodeDir, stagger = 0) {
  group.userData.explode = explodeDir;
  group.userData.stagger = stagger;
  group.userData.basePos = group.position.clone();
  return group;
}

export function buildFlatSix() {
  const engine = new THREE.Group();
  const exploders = [];
  const add = (g) => { engine.add(g); exploders.push(g); return g; };

  // ---------- bloco / cárter ----------
  const block = new THREE.Group();
  const crankcase = new THREE.Mesh(new THREE.BoxGeometry(0.78, 0.72, 1.62), caseMat);
  block.add(crankcase);
  for (let i = 0; i < 6; i++) {
    const rib = new THREE.Mesh(new THREE.BoxGeometry(0.82, 0.76, 0.045), finMat);
    rib.position.z = -0.62 + i * 0.25;
    block.add(rib);
  }
  const sump = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.22, 1.3), caseMat);
  sump.position.y = -0.45;
  block.add(sump);
  add(part(block, new THREE.Vector3(0, 0, 0)));

  // ---------- virabrequim ----------
  const crank = new THREE.Group();
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.055, 1.9, 14), steelMat);
  shaft.rotation.x = Math.PI / 2;
  crank.add(shaft);
  for (let i = 0; i < 6; i++) {
    const w = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.05, 18), steelMat);
    w.rotation.x = Math.PI / 2;
    w.position.z = -0.6 + i * 0.24;
    w.position.y = (i % 2 ? 0.05 : -0.05);
    crank.add(w);
  }
  const pulley = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.07, 20), goldMat);
  pulley.rotation.x = Math.PI / 2;
  pulley.position.z = 0.98;
  crank.add(pulley);
  add(part(crank, new THREE.Vector3(0, -0.35, 1.9), 0.25));

  // ---------- cilindros aletados + cabeçotes + pistões ----------
  const cylinders = { left: [], right: [] };
  const pistons = [];
  for (const side of [1, -1]) {
    for (let i = 0; i < 3; i++) {
      const z = -0.5 + i * 0.5;

      const cyl = new THREE.Group();
      for (let f = 0; f < 7; f++) {
        const fin = new THREE.Mesh(new THREE.CylinderGeometry(0.205, 0.205, 0.032, 20), finMat);
        fin.rotation.z = Math.PI / 2;
        fin.position.x = f * 0.062;
        cyl.add(fin);
      }
      const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.48, 16), caseMat);
      barrel.rotation.z = Math.PI / 2;
      barrel.position.x = 0.19;
      cyl.add(barrel);
      cyl.position.set(side * 0.42, 0.02, z);
      if (side < 0) cyl.rotation.y = Math.PI;
      add(part(cyl, new THREE.Vector3(side * 1.15, 0.12, 0), 0.12 + i * 0.05));
      cylinders[side > 0 ? 'left' : 'right'].push(cyl);

      // cabeçote / tampa de válvulas
      const head = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.32, 0.4), blackMat);
      head.position.set(side * 0.98, 0.02, z);
      const hg = new THREE.Group(); hg.add(head); hg.position.set(0, 0, 0);
      add(part(hg, new THREE.Vector3(side * 1.9, 0.2, 0), 0.2 + i * 0.05));

      // pistão + biela (animados)
      const pg = new THREE.Group();
      const piston = new THREE.Mesh(new THREE.CylinderGeometry(0.115, 0.115, 0.16, 16), steelMat);
      piston.rotation.z = Math.PI / 2;
      piston.position.x = side * 0.36;
      pg.add(piston);
      const rod = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.05, 0.04), steelMat);
      rod.position.x = side * 0.16;
      pg.add(rod);
      pg.position.set(0, 0, z);
      add(part(pg, new THREE.Vector3(side * 0.62, -0.28, 0), 0.32 + i * 0.04));
      pistons.push({ g: pg, piston, side, phase: (i * 2 + (side > 0 ? 0 : 1)) * (Math.PI * 2 / 6) });
    }
  }

  // ---------- ventoinha vertical + carcaça (ícone do 911 a ar) ----------
  const fanGroup = new THREE.Group();
  const shroud = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 0.16, 28, 1, true), caseMat);
  shroud.rotation.x = Math.PI / 2;
  fanGroup.add(shroud);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.4, 0.028, 12, 40), goldMat);
  fanGroup.add(ring);
  const fan = new THREE.Group();
  for (let b = 0; b < 11; b++) {
    const blade = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.3, 0.03), steelMat);
    blade.position.y = 0.2;
    blade.rotation.x = 0.5;
    const holder = new THREE.Group();
    holder.add(blade);
    holder.rotation.z = (b / 11) * Math.PI * 2;
    fan.add(holder);
  }
  const fanHub = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.1, 16), goldMat);
  fanHub.rotation.x = Math.PI / 2;
  fan.add(fanHub);
  fanGroup.add(fan);
  fanGroup.position.set(0, 0.62, 0.1);
  add(part(fanGroup, new THREE.Vector3(0, 1.5, 0), 0.05));

  // ---------- cornetas de admissão ----------
  const intakes = new THREE.Group();
  for (const side of [1, -1]) {
    for (let i = 0; i < 3; i++) {
      const tr = new THREE.Mesh(new THREE.CylinderGeometry(0.085, 0.055, 0.2, 14, 1, true), goldMat);
      tr.position.set(side * 0.55, 0.42, -0.5 + i * 0.5);
      tr.rotation.z = side * -0.35;
      intakes.add(tr);
    }
  }
  add(part(intakes, new THREE.Vector3(0, 0.9, -0.7), 0.18));

  // ---------- escapamento ----------
  const exhaust = new THREE.Group();
  for (const side of [1, -1]) {
    for (let i = 0; i < 3; i++) {
      const pipe = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.34, 10), steelMat);
      pipe.position.set(side * 0.72, -0.28, -0.5 + i * 0.5);
      pipe.rotation.z = side * 1.1;
      exhaust.add(pipe);
    }
    const collector = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 1.15, 10), steelMat);
    collector.rotation.x = Math.PI / 2;
    collector.position.set(side * 0.85, -0.42, 0);
    exhaust.add(collector);
    const tip = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.075, 0.3, 12), blackMat);
    tip.rotation.x = Math.PI / 2;
    tip.position.set(side * 0.85, -0.42, -0.72);
    exhaust.add(tip);
  }
  add(part(exhaust, new THREE.Vector3(0, -0.85, -0.6), 0.28));

  engine.traverse(o => { if (o.isMesh) { o.castShadow = true; } });

  // âncoras para os rótulos DOM
  const anchors = {
    fan: fanGroup, cyl: cylinders.left[1], crank: crank, exh: exhaust,
  };

  // ------------------------------------------------------------------
  const state = { t: 0, crankAngle: 0, rpm: 3.2 };

  function setExplode(t) {
    state.t = t;
    for (const g of exploders) {
      const st = g.userData.stagger || 0;
      let k = THREE.MathUtils.clamp((t * 1.35 - st), 0, 1);
      k = k * k * (3 - 2 * k); // smoothstep
      g.position.copy(g.userData.basePos).addScaledVector(g.userData.explode, k);
    }
  }

  function update(dt) {
    const running = state.t < 0.15;
    const targetRpm = running ? 3.2 : 0;
    state.rpm += (targetRpm - state.rpm) * Math.min(1, dt * 2);
    state.crankAngle += state.rpm * dt * 2.2;
    crank.rotation.z = state.crankAngle;
    fan.rotation.z = -state.crankAngle * 1.6;
    for (const pd of pistons) {
      const stroke = 0.055 * Math.cos(state.crankAngle + pd.phase);
      pd.piston.position.x = pd.side * (0.36 + stroke);
    }
  }

  return { group: engine, setExplode, update, anchors, state };
}
