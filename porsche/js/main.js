// ===================================================================
//  main.js — PORSCHE, um filme interativo
//  O scroll avança a linha do tempo; arrastar olha ao redor.
// ===================================================================
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { buildWorld } from './world.js';

// ---------- renderer ----------
const canvas = document.getElementById('scene');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setSize(innerWidth, innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.15;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x050507);
const baseFog = 0.03;
scene.fog = new THREE.FogExp2(0x050507, baseFog);

const camera = new THREE.PerspectiveCamera(58, innerWidth / innerHeight, 0.1, 400);

// reflexos de estúdio (ambiente procedural, licença MIT do three.js)
const pmrem = new THREE.PMREMGenerator(renderer);
scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.05).texture;

// ---------- pós-processamento ----------
const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
const bloom = new UnrealBloomPass(new THREE.Vector2(innerWidth, innerHeight), 0.38, 0.55, 0.88);
composer.addPass(bloom);
composer.addPass(new OutputPass());

// ---------- mundo ----------
const world = buildWorld(scene);

// ===================================================================
//  ROTEIRO DA CÂMERA — pontos de posição e de olhar, sincronizados
// ===================================================================
const camPts = [], lookPts = [];
const marks = {};
function K(px, py, pz, lx, ly, lz, mark) {
  if (mark) marks[mark] = camPts.length;
  camPts.push(new THREE.Vector3(px, py, pz));
  lookPts.push(new THREE.Vector3(lx, ly, lz));
}

// CAP 01 — O Salão (z 0)
K(0, 1.55, 11.5,   0, 0.95, 0, 'hero');
K(5.4, 1.35, 5.8,  0, 0.8, 0);
K(3.4, 0.95, -3.8, 0, 0.95, 0);
K(-4.8, 2.7, -6.2, 0, 0.8, 0);
K(-1.2, 1.8, -11,  0, 1.5, -22);
K(0, 1.9, -22,     0, 1.5, -34, 'toHist');

// CAP 02 — História (z -46)
K(0, 1.8, -32.5,  -5, 2.6, -37, 'hist');
K(1.6, 1.7, -39.5, 5, 2.6, -42.2, 'hist2');
K(-1.6, 1.7, -44.8, -5, 2.6, -47.6, 'hist3');
K(3.6, 1.5, -50.5,  0, 1.1, -47.5);
K(0, 1.9, -58,     0, 1.5, -70);
K(0, 1.9, -68,     0, 1.5, -80, 'toTech');

// CAP 03 — Tecnologia (z -92)
K(0, 1.7, -79.5,  0, 1, -92, 'tech');
K(6.2, 1.5, -87,  0, 1, -92);
K(5.4, 2.5, -97,  0, 1.3, -92, 'techExplode');
K(-6.4, 2.3, -96, -0.8, 1.2, -92);
K(-4.4, 1.6, -88.5, -1.6, 1.3, -92, 'techEngine');
K(0, 1.9, -105,   0, 1.5, -117, 'toGallery');
K(0, 1.9, -114,   0, 1.5, -126);

// CAP 04 — Lendas (z -138)
K(0, 1.7, -124.5, -10.5, 1.2, -138, 'gallery');
K(-8.3, 1.4, -132.2, -10.5, 1, -138.4, 'car0');
K(-5.6, 1.5, -142.2, -3.5, 1, -138, 'car1');
K(0.2, 1.5, -132.8,  3.5, 1, -138.2, 'car2');
K(6.6, 1.5, -142.6, 10.5, 1, -138, 'car3');
K(3.4, 1.8, -150,  0, 1.5, -160);
K(0, 1.9, -160,    0, 1.5, -172, 'toFinale');

// CAP 05 — A Estrada (z -184)
K(0, 1.6, -172,    0, 1, -184, 'finale');
K(4.7, 1.15, -179.5, 0, 0.85, -186.5);
K(-5.6, 2.5, -189,  0, 0.9, -185.5);
K(0, 3.3, -177,    0, 1.1, -193, 'finaleText');
K(0, 2.1, -172.5,  0, 1.6, -205, 'end');

const camCurve = new THREE.CatmullRomCurve3(camPts, false, 'catmullrom', 0.35);
const lookCurve = new THREE.CatmullRomCurve3(lookPts, false, 'catmullrom', 0.35);
const N = camPts.length - 1;
const mp = (name) => marks[name] / N; // progresso [0,1] de cada marco

// âncoras de capítulo
const chapterAnchors = [mp('hero'), mp('hist'), mp('tech'), mp('gallery'), mp('finale')];

// ===================================================================
//  ESTADO DO FILME
// ===================================================================
const state = {
  p: 0, targetP: 0,
  yaw: 0, pitch: 0,
  dragging: false,
  started: false,
  engineManual: null, // null = automático pelo scroll · 0/1 = botão
};

// ---------- entradas ----------
addEventListener('wheel', (e) => {
  if (!state.started) return;
  state.targetP = THREE.MathUtils.clamp(state.targetP + e.deltaY * 0.000042, 0, 1);
  hideHintSoon();
}, { passive: true });

let px = 0, py = 0, touchMode = null;
canvas.addEventListener('pointerdown', (e) => {
  state.dragging = true; px = e.clientX; py = e.clientY; touchMode = null;
  canvas.classList.add('dragging');
  canvas.setPointerCapture(e.pointerId);
});
addEventListener('pointermove', (e) => {
  if (!state.dragging || !state.started) return;
  const dx = e.clientX - px, dy = e.clientY - py;
  if (e.pointerType === 'touch') {
    if (!touchMode && (Math.abs(dx) > 6 || Math.abs(dy) > 6)) {
      touchMode = Math.abs(dy) > Math.abs(dx) ? 'scroll' : 'look';
    }
    if (touchMode === 'scroll') {
      state.targetP = THREE.MathUtils.clamp(state.targetP - dy * 0.00055, 0, 1);
    } else if (touchMode === 'look') {
      state.yaw -= dx * 0.0034;
    }
  } else {
    state.yaw -= dx * 0.0032;
    state.pitch = THREE.MathUtils.clamp(state.pitch - dy * 0.0026, -0.7, 0.7);
  }
  px = e.clientX; py = e.clientY;
  hideHintSoon();
});
addEventListener('pointerup', () => { state.dragging = false; canvas.classList.remove('dragging'); });

addEventListener('keydown', (e) => {
  if (!state.started) return;
  const step = 0.02;
  if (e.key === 'ArrowDown' || e.key === 'PageDown' || e.key === ' ') state.targetP = Math.min(1, state.targetP + step);
  if (e.key === 'ArrowUp' || e.key === 'PageUp') state.targetP = Math.max(0, state.targetP - step);
});

// navegação por capítulos
const chapterBtns = [...document.querySelectorAll('.chapters button')];
chapterBtns.forEach(btn => btn.addEventListener('click', () => {
  state.targetP = chapterAnchors[+btn.dataset.ch];
  state.engineManual = null;
}));

// botão do motor
const engineBtn = document.getElementById('engineBtn');
engineBtn.addEventListener('click', () => {
  const current = state.engineManual !== null ? state.engineManual : autoExplodeT(state.p);
  state.engineManual = current > 0.5 ? 0 : 1;
});

let hintTimer = null;
function hideHintSoon() {
  if (hintTimer) return;
  hintTimer = setTimeout(() => document.getElementById('hudHint').classList.add('faded'), 4000);
}

// ---------- overlays ----------
const OV = {};
document.querySelectorAll('.ov').forEach(el => { OV[el.dataset.ov] = el; });
function windowOf(a, b, fadeIn = 0.012, fadeOut = 0.012) {
  return (p) => p > a - fadeIn && p < b + fadeOut;
}
const ovWindows = [
  ['hero',   0,               mp('hero') + 0.028],
  ['hist1',  mp('hist') - 0.01,  mp('hist') + 0.018],
  ['hist2',  mp('hist2') - 0.008, mp('hist2') + 0.018],
  ['hist3',  mp('hist3') - 0.008, mp('hist3') + 0.02],
  ['tech',   mp('tech') - 0.005, mp('techEngine') + 0.02],
  ['car0',   mp('car0') - 0.012, mp('car0') + 0.016],
  ['car1',   mp('car1') - 0.012, mp('car1') + 0.016],
  ['car2',   mp('car2') - 0.012, mp('car2') + 0.016],
  ['car3',   mp('car3') - 0.012, mp('car3') + 0.016],
  ['finale', mp('finaleText') - 0.015, 1.01],
].map(([k, a, b]) => [OV[k], windowOf(a, b)]);

// rótulos 3D do motor
const tags = {};
document.querySelectorAll('.tag3d').forEach(el => { tags[el.dataset.tag] = el; });
const tagWorld = new THREE.Vector3();

// ---------- explosão automática pelo progresso ----------
const techA = mp('tech'), techB = mp('toGallery');
function autoExplodeT(p) {
  const span = techB - techA;
  const local = (p - techA) / span;
  // sobe 0.22→0.42, platô, desce 0.78→0.95
  const up = THREE.MathUtils.clamp((local - 0.22) / 0.2, 0, 1);
  const down = THREE.MathUtils.clamp((0.95 - local) / 0.17, 0, 1);
  return Math.min(up, down);
}
let explodeT = 0;

// ---------- início ----------
const loader = document.getElementById('loader');
const startBtn = document.getElementById('startBtn');
const loaderFill = document.getElementById('loaderFill');
const progressFill = document.getElementById('progressFill');

// pré-compila os shaders renderizando alguns quadros fora da tela
let warmFrames = 0;
function warmup() {
  const spots = [0, 0.3, 0.55, 0.8, 1];
  const t = spots[warmFrames];
  camera.position.copy(camCurve.getPoint(t));
  camera.lookAt(lookCurve.getPoint(t));
  composer.render();
  warmFrames++;
  loaderFill.style.width = `${(warmFrames / spots.length) * 100}%`;
  if (warmFrames < spots.length) {
    requestAnimationFrame(warmup);
  } else {
    startBtn.disabled = false;
    startBtn.textContent = 'INICIAR EXPERIÊNCIA';
  }
}

startBtn.addEventListener('click', () => {
  state.started = true;
  document.body.classList.add('playing');
  loader.classList.add('hidden');
  hideHintSoon();
});

// ---------- laço principal ----------
const clock = new THREE.Clock();
const tmpDir = new THREE.Vector3();
const tmpTarget = new THREE.Vector3();
const sph = new THREE.Spherical();

function frame() {
  requestAnimationFrame(frame);
  const dt = Math.min(clock.getDelta(), 0.05);
  const time = clock.elapsedTime;

  // progresso com inércia (movimento de dolly, não de scroll)
  state.p += (state.targetP - state.p) * Math.min(1, dt * 2.1);

  // câmera na curva
  const p = THREE.MathUtils.clamp(state.p, 0, 1);
  camera.position.copy(camCurve.getPoint(p));
  const lookP = lookCurve.getPoint(p);

  // olhar livre (arrastar): desvio esférico sobre a direção do roteiro
  tmpDir.subVectors(lookP, camera.position).normalize();
  sph.setFromVector3(tmpDir);
  sph.theta += state.yaw;
  sph.phi = THREE.MathUtils.clamp(sph.phi - state.pitch, 0.25, Math.PI - 0.25);
  tmpDir.setFromSpherical(sph);
  tmpTarget.copy(camera.position).addScaledVector(tmpDir, 10);
  camera.lookAt(tmpTarget);

  // o desvio volta suavemente ao enquadramento do "diretor"
  const recenter = state.dragging ? 0 : dt * 0.55;
  state.yaw -= state.yaw * recenter;
  state.pitch -= state.pitch * recenter;

  // névoa abre na cena final (céu aberto)
  const openAir = THREE.MathUtils.smoothstep(p, mp('toFinale'), mp('finale'));
  scene.fog.density = THREE.MathUtils.lerp(baseFog, 0.0045, openAir);

  // explosão do carro/motor
  const targetT = state.engineManual !== null ? state.engineManual : autoExplodeT(p);
  explodeT += (targetT - explodeT) * Math.min(1, dt * 2.4);
  world.tech.setCarExplode(explodeT);
  engineBtn.textContent = (state.engineManual !== null ? state.engineManual : targetT) > 0.5
    ? 'ACOPLAR MOTOR' : 'DESACOPLAR MOTOR';

  // atualizações do mundo
  for (const u of world.updates) u(dt, time);

  // HUD: progresso + capítulo ativo
  progressFill.style.width = `${p * 100}%`;
  let ch = 0;
  for (let i = 0; i < chapterAnchors.length; i++) if (p >= chapterAnchors[i] - 0.02) ch = i;
  chapterBtns.forEach((b, i) => b.classList.toggle('active', i === ch));

  // overlays
  for (const [el, test] of ovWindows) el.classList.toggle('on', state.started && test(p));

  // rótulos 3D do motor (aparecem com o motor aberto)
  const showTags = explodeT > 0.55 && ch === 2;
  for (const [key, el] of Object.entries(tags)) {
    if (!showTags) { el.classList.remove('on'); continue; }
    const anchor = world.tech.engine.anchors[key];
    anchor.getWorldPosition(tagWorld);
    tagWorld.project(camera);
    if (tagWorld.z > 1) { el.classList.remove('on'); continue; }
    el.style.left = `${(tagWorld.x * 0.5 + 0.5) * innerWidth + 14}px`;
    el.style.top = `${(-tagWorld.y * 0.5 + 0.5) * innerHeight}px`;
    el.classList.add('on');
  }

  if (state.started) composer.render();
}

addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
  composer.setSize(innerWidth, innerHeight);
});

// gancho de depuração: salta direto para um ponto do filme
window.__setP = (v) => { state.targetP = v; state.p = v; };

warmup();
frame();
