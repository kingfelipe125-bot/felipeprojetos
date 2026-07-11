// ===================================================================
//  suit.js — armaduras estilizadas 100% procedurais (nenhum modelo
//  oficial é utilizado; figuras originais desenhadas em código)
// ===================================================================
import * as THREE from 'three';

export function armorMaterials(primary = 0x9e1017, secondary = 0xc79b3a) {
  return {
    red: new THREE.MeshPhysicalMaterial({
      color: primary, metalness: 0.75, roughness: 0.28,
      clearcoat: 1, clearcoatRoughness: 0.12, envMapIntensity: 1.3,
    }),
    gold: new THREE.MeshPhysicalMaterial({
      color: secondary, metalness: 1.0, roughness: 0.24,
      clearcoat: 0.6, clearcoatRoughness: 0.15, envMapIntensity: 1.5,
    }),
    dark: new THREE.MeshStandardMaterial({ color: 0x15161a, roughness: 0.5, metalness: 0.8 }),
    glow: new THREE.MeshStandardMaterial({ color: 0x0b2b2a, emissive: 0x3ee6df, emissiveIntensity: 2.6 }),
  };
}

const box = (w, h, d, m) => new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m);
const cyl = (r1, r2, h, m, seg = 18) => new THREE.Mesh(new THREE.CylinderGeometry(r1, r2, h, seg), m);
const sph = (r, m, w = 18, hh = 14, ps = 0, pl = Math.PI * 2) =>
  new THREE.Mesh(new THREE.SphereGeometry(r, w, hh, ps, pl), m);

// -----------------------------------------------------------------------
// buildSuit — figura estilizada ~2.1 de altura, pé no y=0, de frente p/ +Z.
// Cada peça guarda basePos + vetor de explosão p/ a animação de desacoplar.
// presets: mk1 (ferro bruto) · mk3 (vermelho/ouro) · gold · hulkbuster
// -----------------------------------------------------------------------
export function buildSuit(preset = 'mk3') {
  const P = {
    mk1:  { primary: 0x5a5e63, secondary: 0x3c4046, bulk: 1.12, eyes: 0xcfd6dd, rough: true },
    mk3:  { primary: 0x9e1017, secondary: 0xc79b3a, bulk: 1.0,  eyes: 0x3ee6df },
    gold: { primary: 0xc79b3a, secondary: 0x8c6a1d, bulk: 0.97, eyes: 0x3ee6df },
    hulkbuster: { primary: 0x9e1017, secondary: 0xc79b3a, bulk: 1.55, eyes: 0x3ee6df },
  }[preset];

  const M = armorMaterials(P.primary, P.secondary);
  if (P.rough) {
    M.red.metalness = 0.9; M.red.roughness = 0.55; M.red.clearcoat = 0.1;
    M.gold.roughness = 0.6;
  }
  const eyeMat = new THREE.MeshStandardMaterial({ color: 0x0a0d10, emissive: P.eyes, emissiveIntensity: 3 });

  const suit = new THREE.Group();
  const parts = [];
  const B = P.bulk;

  function part(g, x, y, z, explode, stagger = 0) {
    g.position.set(x, y, z);
    g.userData.basePos = g.position.clone();
    g.userData.explode = explode;
    g.userData.stagger = stagger;
    suit.add(g);
    parts.push(g);
    return g;
  }

  // ---- capacete ----
  const helmet = new THREE.Group();
  const skull = sph(0.155 * B, M.red); skull.scale.set(1, 1.15, 1.05);
  helmet.add(skull);
  const face = sph(0.148 * B, M.gold); // placa facial (calota frontal)
  face.scale.set(0.92, 1.08, 0.5);
  face.position.z = 0.075 * B;
  helmet.add(face);
  for (const sx of [1, -1]) {
    const eye = box(0.052 * B, 0.016 * B, 0.02, eyeMat);
    eye.position.set(sx * 0.055 * B, 0.028 * B, 0.15 * B);
    helmet.add(eye);
  }
  const jaw = box(0.16 * B, 0.05 * B, 0.1 * B, M.red);
  jaw.position.set(0, -0.13 * B, 0.06 * B);
  helmet.add(jaw);
  part(helmet, 0, 1.86 * B, 0, new THREE.Vector3(0, 0.85, 0), 0.0);

  // ---- torso ----
  const torso = new THREE.Group();
  const chest = box(0.46 * B, 0.42 * B, 0.28 * B, M.red);
  chest.position.y = 0.1;
  torso.add(chest);
  const chestPlateU = box(0.34 * B, 0.18 * B, 0.05 * B, M.gold);
  chestPlateU.position.set(0, 0.2 * B, 0.15 * B);
  torso.add(chestPlateU);
  const abdomen = box(0.34 * B, 0.24 * B, 0.24 * B, M.dark);
  abdomen.position.y = -0.24 * B;
  torso.add(abdomen);
  // reator no peito
  const chestRing = new THREE.Mesh(new THREE.TorusGeometry(0.075 * B, 0.02 * B, 10, 24), M.gold);
  chestRing.position.set(0, 0.12 * B, 0.155 * B);
  torso.add(chestRing);
  const chestCore = cyl(0.055 * B, 0.055 * B, 0.03, M.glow, 20);
  chestCore.rotation.x = Math.PI / 2;
  chestCore.position.set(0, 0.12 * B, 0.155 * B);
  torso.add(chestCore);
  torso.userData.coreAnchor = chestCore;
  part(torso, 0, 1.42 * B, 0, new THREE.Vector3(0, 0.12, 1.5), 0.08);

  // ---- quadril ----
  const hips = new THREE.Group();
  hips.add(box(0.36 * B, 0.18 * B, 0.26 * B, M.red));
  const belt = box(0.38 * B, 0.06 * B, 0.28 * B, M.gold);
  belt.position.y = 0.06 * B;
  hips.add(belt);
  part(hips, 0, 1.06 * B, 0, new THREE.Vector3(0, -0.2, 0.9), 0.16);

  // ---- braços e pernas ----
  for (const sx of [1, -1]) {
    // ombro
    const shoulder = new THREE.Group();
    const pad = sph(0.12 * B, M.gold); pad.scale.set(1.15, 0.85, 1);
    shoulder.add(pad);
    part(shoulder, sx * 0.31 * B, 1.68 * B, 0, new THREE.Vector3(sx * 1.1, 0.45, 0), 0.1);

    // braço superior
    const upperArm = cyl(0.07 * B, 0.062 * B, 0.3 * B, M.red);
    part(upperArm, sx * 0.33 * B, 1.46 * B, 0, new THREE.Vector3(sx * 1.35, 0.15, 0), 0.16);

    // antebraço
    const forearm = cyl(0.062 * B, 0.075 * B, 0.3 * B, M.gold);
    part(forearm, sx * 0.34 * B, 1.16 * B, 0.015, new THREE.Vector3(sx * 1.6, -0.08, 0.15), 0.22);

    // mão + repulsor
    const hand = new THREE.Group();
    const palm = box(0.09 * B, 0.11 * B, 0.09 * B, M.red);
    hand.add(palm);
    const repulsor = cyl(0.03 * B, 0.03 * B, 0.02, M.glow, 14);
    repulsor.position.y = -0.06 * B;
    hand.add(repulsor);
    hand.userData.repulsor = repulsor;
    part(hand, sx * 0.345 * B, 0.96 * B, 0.02, new THREE.Vector3(sx * 1.85, -0.25, 0.3), 0.28);

    // coxa
    const thigh = cyl(0.095 * B, 0.082 * B, 0.4 * B, M.red);
    part(thigh, sx * 0.13 * B, 0.82 * B, 0, new THREE.Vector3(sx * 0.75, -0.35, 0.5), 0.2);

    // canela
    const shin = cyl(0.078 * B, 0.095 * B, 0.42 * B, M.gold);
    part(shin, sx * 0.14 * B, 0.4 * B, 0.01, new THREE.Vector3(sx * 0.95, -0.65, 0.75), 0.26);

    // bota + propulsor
    const bootG = new THREE.Group();
    const boot = box(0.13 * B, 0.12 * B, 0.24 * B, M.red);
    boot.position.z = 0.04 * B;
    bootG.add(boot);
    const jet = cyl(0.035 * B, 0.05 * B, 0.03, M.glow, 14);
    jet.position.y = -0.065 * B;
    bootG.add(jet);
    bootG.userData.jet = jet;
    part(bootG, sx * 0.145 * B, 0.09 * B, 0.02, new THREE.Vector3(sx * 1.15, -0.95, 1.0), 0.32);
  }

  if (preset === 'hulkbuster') {
    // massa extra: placas de ombro e punhos gigantes
    for (const sx of [1, -1]) {
      const megaFist = box(0.24 * B, 0.26 * B, 0.24 * B, M.red);
      megaFist.position.set(sx * 0.36 * B, 0.9 * B, 0.03);
      suit.add(megaFist);
    }
    const backPack = box(0.42 * B, 0.5 * B, 0.18 * B, M.dark);
    backPack.position.set(0, 1.5 * B, -0.26 * B);
    suit.add(backPack);
  }

  suit.traverse(o => { if (o.isMesh) o.castShadow = true; });

  // desacoplar/acoplar — t ∈ [0,1]
  function setExplode(t) {
    for (const g of parts) {
      let k = THREE.MathUtils.clamp(t * 1.4 - g.userData.stagger, 0, 1);
      k = k * k * (3 - 2 * k);
      g.position.copy(g.userData.basePos).addScaledVector(g.userData.explode, k * 1.15);
    }
  }

  return { group: suit, setExplode, parts, materials: M, height: 2.05 * B };
}
