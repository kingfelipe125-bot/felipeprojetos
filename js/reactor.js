// ===================================================================
//  reactor.js — Reator Arc procedural com animação de desacoplar:
//  carcaça, anéis, bobinas e núcleo se abrem em camadas.
//  Eixo local: Z (o "vidro" do reator aponta para +Z).
// ===================================================================
import * as THREE from 'three';

const housingMat = new THREE.MeshStandardMaterial({ color: 0x2a2d33, roughness: 0.35, metalness: 0.95, envMapIntensity: 1.2 });
const steelMat = new THREE.MeshStandardMaterial({ color: 0xb9bec6, roughness: 0.22, metalness: 1.0, envMapIntensity: 1.5 });
const copperMat = new THREE.MeshStandardMaterial({ color: 0xc47a3a, roughness: 0.35, metalness: 1.0, envMapIntensity: 1.3 });
const coreMat = new THREE.MeshStandardMaterial({ color: 0x0d3331, emissive: 0x3ee6df, emissiveIntensity: 2.2 });
const glowSoft = new THREE.MeshStandardMaterial({ color: 0x0b2b2a, emissive: 0x3ee6df, emissiveIntensity: 1.0 });

export function buildReactor() {
  const reactor = new THREE.Group();
  const exploders = [];

  function part(g, explode, stagger = 0) {
    g.userData.basePos = g.position.clone();
    g.userData.explode = explode;
    g.userData.stagger = stagger;
    reactor.add(g);
    exploders.push(g);
    return g;
  }

  // carcaça traseira
  const back = new THREE.Group();
  const shell = new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.66, 0.22, 32), housingMat);
  shell.rotation.x = Math.PI / 2;
  back.add(shell);
  for (let i = 0; i < 8; i++) {
    const lug = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.06, 0.26), steelMat);
    const a = (i / 8) * Math.PI * 2;
    lug.position.set(Math.cos(a) * 0.62, Math.sin(a) * 0.62, 0);
    lug.rotation.z = a;
    back.add(lug);
  }
  back.position.z = -0.16;
  part(back, new THREE.Vector3(0, 0, -1.5), 0);

  // anel externo com bobinas de cobre
  const coilRing = new THREE.Group();
  const ringO = new THREE.Mesh(new THREE.TorusGeometry(0.5, 0.055, 14, 44), steelMat);
  coilRing.add(ringO);
  for (let i = 0; i < 10; i++) {
    const coil = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.075, 0.17, 12), copperMat);
    const a = (i / 10) * Math.PI * 2;
    coil.position.set(Math.cos(a) * 0.5, Math.sin(a) * 0.5, 0);
    coil.rotation.x = Math.PI / 2;
    coilRing.add(coil);
  }
  part(coilRing, new THREE.Vector3(0, 0, 0.0), 0.1).userData.radial = 0.55;

  // anel de luz intermediário
  const midRing = new THREE.Group();
  const ringGlow = new THREE.Mesh(new THREE.TorusGeometry(0.33, 0.028, 12, 40), glowSoft);
  midRing.add(ringGlow);
  const ringM = new THREE.Mesh(new THREE.TorusGeometry(0.38, 0.03, 12, 40), housingMat);
  midRing.add(ringM);
  midRing.position.z = 0.04;
  part(midRing, new THREE.Vector3(0, 0, 0.9), 0.2);

  // núcleo triangular + centro
  const core = new THREE.Group();
  const tri = new THREE.Mesh(new THREE.RingGeometry(0.1, 0.2, 3), coreMat.clone());
  tri.material.side = THREE.DoubleSide;
  core.add(tri);
  const centerDisc = new THREE.Mesh(new THREE.CylinderGeometry(0.115, 0.115, 0.05, 24), coreMat);
  centerDisc.rotation.x = Math.PI / 2;
  centerDisc.position.z = -0.02;
  core.add(centerDisc);
  core.position.z = 0.1;
  part(core, new THREE.Vector3(0, 0, 1.8), 0.32);
  const spinCore = core;

  // luz real do reator
  const light = new THREE.PointLight(0x3ee6df, 14, 10, 1.8);
  light.position.z = 0.4;
  reactor.add(light);

  reactor.traverse(o => { if (o.isMesh) o.castShadow = true; });

  const state = { t: 0 };

  function setExplode(t) {
    state.t = t;
    for (const g of exploders) {
      let k = THREE.MathUtils.clamp(t * 1.35 - g.userData.stagger, 0, 1);
      k = k * k * (3 - 2 * k);
      g.position.copy(g.userData.basePos).addScaledVector(g.userData.explode, k);
      // bobinas também se afastam radialmente
      if (g.userData.radial) g.scale.setScalar(1 + k * g.userData.radial * 0.5);
    }
    light.intensity = 14 + t * 16;
  }

  function update(dt) {
    spinCore.rotation.z += dt * (0.6 + state.t * 2.2);
  }

  const anchors = { core, coils: coilRing, housing: back, ring: midRing };
  return { group: reactor, setExplode, update, anchors, state };
}
