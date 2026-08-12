'use strict';

/* =========================================================
   CONSTANTES DA QUADRA (medidas oficiais de simples, em metros)
   ========================================================= */
const COURT_LENGTH = 23.77;
const COURT_WIDTH = 8.23;
const SERVICE_LINE_DIST = 6.40;
const NET_X = COURT_LENGTH / 2;
const MID_Y = COURT_WIDTH / 2;
const PLAYER_SERVICE_X = NET_X - SERVICE_LINE_DIST;
const CPU_SERVICE_X = NET_X + SERVICE_LINE_DIST;
const NET_HEIGHT_CENTER = 0.914;
const NET_HEIGHT_POST = 1.07;

const MARGIN_X = 2.2;
const MARGIN_Y = 1.8;
const CANVAS_W = 1000;
const CANVAS_H = 620;

const GRAVITY = 13.5;
const BALL_RADIUS = 0.09;
const REACH_RADIUS = 1.35;
const HIT_MAX_HEIGHT = 2.4;

const PLAYER_BOUNDS = { xMin: -MARGIN_X + 0.3, xMax: NET_X - 0.35, yMin: -MARGIN_Y + 0.3, yMax: COURT_WIDTH + MARGIN_Y - 0.3 };
const CPU_BOUNDS = { xMin: NET_X + 0.35, xMax: COURT_LENGTH + MARGIN_X - 0.3, yMin: -MARGIN_Y + 0.3, yMax: COURT_WIDTH + MARGIN_Y - 0.3 };

function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
function rand(lo, hi) { return lo + Math.random() * (hi - lo); }
function dist2(ax, ay, bx, by) { const dx = ax - bx, dy = ay - by; return dx * dx + dy * dy; }

function netHeightAt(y) {
  const t = Math.min(1, Math.abs(y - MID_Y) / MID_Y);
  return NET_HEIGHT_CENTER + (NET_HEIGHT_POST - NET_HEIGHT_CENTER) * t;
}

/* =========================================================
   CÂMERA — visão de frente, de pé atrás da linha de fundo do
   jogador, olhando para o fundo adversário (perspectiva real,
   não vista de cima/de lado).
   ========================================================= */
const WORLD_X_MIN = -MARGIN_X;
const WORLD_X_MAX = COURT_LENGTH + MARGIN_X;
const WORLD_Y_MIN = -MARGIN_Y;
const WORLD_Y_MAX = COURT_WIDTH + MARGIN_Y;

const CAM_X = -(MARGIN_X + 15.5);
const CAM_Z = 8.4;
const HORIZON_Y = 108;
const GROUND_Y = CANVAS_H - 10;

function depthOf(x) { return x - CAM_X; }
function vOffsetOf(x, z) { return (CAM_Z - z) / depthOf(x); }
const V_NEAR = vOffsetOf(WORLD_X_MIN, 0);
const V_FAR = vOffsetOf(WORLD_X_MAX, 0);
const D_NEAR = depthOf(WORLD_X_MIN);
const HALF_WIDTH_WORLD = WORLD_Y_MAX - MID_Y;
const FOCAL_X = (CANVAS_W / 2 * 0.95) * D_NEAR / HALF_WIDTH_WORLD;

function project(x, y, z) {
  const depth = depthOf(x);
  const vOff = vOffsetOf(x, z);
  const t = (vOff - V_FAR) / (V_NEAR - V_FAR);
  const sy = HORIZON_Y + t * (GROUND_Y - HORIZON_Y);
  const sx = CANVAS_W / 2 + (FOCAL_X * (y - MID_Y)) / depth;
  return { x: sx, y: sy, scale: D_NEAR / depth, depth };
}

function courtToPx(xm, ym, zm) { const p = project(xm, ym, zm || 0); return { x: p.x, y: p.y }; }

function pxToCourt(px, py) {
  const t = (py - HORIZON_Y) / (GROUND_Y - HORIZON_Y);
  const vOff = V_FAR + t * (V_NEAR - V_FAR);
  const depth = CAM_Z / Math.max(vOff, 0.001);
  const x = CAM_X + depth;
  const y = MID_Y + ((px - CANVAS_W / 2) * depth) / FOCAL_X;
  return { x, y };
}

/* =========================================================
   CONFIGURAÇÕES DE DIFICULDADE E QUADRA
   ========================================================= */
const DIFFICULTIES = {
  facil: {
    label: 'Fácil', cpuName: 'CPU Iniciante',
    cpuSpeed: 3.0, cpuAccuracy: 0.45, reaction: 0.22,
    serve1Speed: [9, 10.5], serve2Speed: [7, 8], serveAccuracy: 0.55,
    errorChance: 0.24, aceChance: 0.03,
  },
  medio: {
    label: 'Médio', cpuName: 'CPU Regular',
    cpuSpeed: 4.2, cpuAccuracy: 0.65, reaction: 0.14,
    serve1Speed: [12, 14], serve2Speed: [9, 10.5], serveAccuracy: 0.72,
    errorChance: 0.14, aceChance: 0.07,
  },
  dificil: {
    label: 'Difícil', cpuName: 'CPU Avançada',
    cpuSpeed: 5.4, cpuAccuracy: 0.83, reaction: 0.08,
    serve1Speed: [15.5, 17.5], serve2Speed: [11, 12.5], serveAccuracy: 0.85,
    errorChance: 0.07, aceChance: 0.12,
  },
  chefao: {
    label: 'Chefão', cpuName: '👑 O Chefão',
    cpuSpeed: 7.0, cpuAccuracy: 0.96, reaction: 0.03,
    serve1Speed: [19, 23], serve2Speed: [13.5, 15], serveAccuracy: 0.94,
    errorChance: 0.02, aceChance: 0.2,
  },
};

const COURTS = {
  dura: {
    label: 'Dura (Azul)', lineColor: '#f5f8ff', netColor: '#0d1117', glow: false,
    surface: ['#153f7a', '#2a72c4'], out: '#0c2450', bounceMul: 1.0,
    sky: ['#0e1a33', '#2c4b78'],
  },
  cyber: {
    label: 'Cyber', lineColor: '#4dfaff', netColor: '#ff2fd1', glow: true,
    surface: ['#0c0620', '#241049'], out: '#050110', bounceMul: 1.08,
    sky: ['#05010f', '#20063f'],
  },
  grama: {
    label: 'Grama', lineColor: '#f5f8ff', netColor: '#3a2a1a', glow: false,
    surface: ['#1c5c26', '#3aa14a'], out: '#123a19', bounceMul: 0.88,
    sky: ['#0d2a1c', '#2f6e4a'],
  },
};

/* =========================================================
   ESTADO GLOBAL
   ========================================================= */
const state = {
  screen: 'menu',
  difficulty: 'medio',
  court: 'dura',
  phase: 'idle', // idle | serve-ready | serve-flight | rally | point-over
  paused: false,
  serverSide: 'right', // 'right' = deuce, 'left' = ad
  serveNumber: 1,
  letServe: false,
  match: null,
  ball: null,
  player: { x: 3, y: MID_Y, targetX: 3, targetY: MID_Y, vy: 0, vx: 0, swingElapsed: 99 },
  cpu: { x: COURT_LENGTH - 3, y: MID_Y, reactTimer: 0, aimTarget: null, swingElapsed: 99 },
  pointClockAfterHit: 0,
  lastHitter: null,
  effects: [],
};

function freshMatch() {
  return {
    sets: [],               // [{player,cpu}]
    games: { player: 0, cpu: 0 },
    points: { player: 0, cpu: 0 },
    tiebreak: false,
    tbPoints: { player: 0, cpu: 0 },
    setsWon: { player: 0, cpu: 0 },
    matchOver: false,
    winner: null,
  };
}

/* =========================================================
   DOM
   ========================================================= */
const el = (id) => document.getElementById(id);
const screenMenu = el('screen-menu');
const screenGame = el('screen-game');
const canvas = el('court');
const ctx = canvas.getContext('2d');
const messageOverlay = el('message-overlay');
const pauseOverlay = el('pause-overlay');
const endOverlay = el('end-overlay');

let messageTimer = null;
function showMessage(text, duration = 1100) {
  messageOverlay.textContent = text;
  messageOverlay.classList.add('show');
  clearTimeout(messageTimer);
  messageTimer = setTimeout(() => messageOverlay.classList.remove('show'), duration);
}

/* =========================================================
   MENU
   ========================================================= */
document.querySelectorAll('#difficulty-grid .option-card').forEach((btn) => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('#difficulty-grid .option-card').forEach((b) => b.classList.remove('selected'));
    btn.classList.add('selected');
    state.difficulty = btn.dataset.difficulty;
  });
});
document.querySelectorAll('#court-grid .option-card').forEach((btn) => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('#court-grid .option-card').forEach((b) => b.classList.remove('selected'));
    btn.classList.add('selected');
    state.court = btn.dataset.court;
  });
});
document.querySelector('[data-difficulty="medio"]').classList.add('selected');
document.querySelector('[data-court="dura"]').classList.add('selected');

el('btn-play').addEventListener('click', () => {
  startMatch();
  switchScreen('game');
});

function switchScreen(name) {
  state.screen = name;
  screenMenu.classList.toggle('active', name === 'menu');
  screenGame.classList.toggle('active', name === 'game');
}

/* =========================================================
   INPUT (mouse / touch vira a raquete)
   ========================================================= */
function pointerToCourt(clientX, clientY) {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  const px = (clientX - rect.left) * scaleX;
  const py = (clientY - rect.top) * scaleY;
  return pxToCourt(px, py);
}

canvas.addEventListener('pointermove', (e) => {
  if (state.paused || state.screen !== 'game') return;
  const p = pointerToCourt(e.clientX, e.clientY);
  const b = PLAYER_BOUNDS;
  state.player.targetX = clamp(p.x, b.xMin, b.xMax);
  state.player.targetY = clamp(p.y, b.yMin, b.yMax);
});

/* =========================================================
   BOTÕES DE JOGO
   ========================================================= */
el('btn-pause').addEventListener('click', () => setPaused(true));
el('btn-resume').addEventListener('click', () => setPaused(false));
el('btn-quit').addEventListener('click', () => { setPaused(false); switchScreen('menu'); });
el('btn-menu').addEventListener('click', () => setPaused(true));
el('btn-rematch').addEventListener('click', () => { endOverlay.classList.add('hidden'); startMatch(); });
el('btn-back-menu').addEventListener('click', () => { endOverlay.classList.add('hidden'); switchScreen('menu'); });

function setPaused(v) {
  state.paused = v;
  pauseOverlay.classList.toggle('hidden', !v);
}

/* =========================================================
   INÍCIO DE PARTIDA / PONTO
   ========================================================= */
function startMatch() {
  state.match = freshMatch();
  state.player.x = 3; state.player.y = MID_Y; state.player.targetX = 3; state.player.targetY = MID_Y;
  state.cpu.x = COURT_LENGTH - 3; state.cpu.y = MID_Y;
  el('cpu-name').textContent = DIFFICULTIES[state.difficulty].cpuName;
  updateScoreboard();
  startPoint();
}

function startPoint() {
  state.phase = 'serve-ready';
  state.serveNumber = 1;
  state.letServe = false;
  state.lastHitter = null;
  const totalPts = state.match.tiebreak
    ? state.match.tbPoints.player + state.match.tbPoints.cpu
    : state.match.points.player + state.match.points.cpu;
  state.serverSide = (totalPts % 2 === 0) ? 'right' : 'left';

  const serverY = state.serverSide === 'right' ? COURT_WIDTH * 0.20 : COURT_WIDTH * 0.80;
  state.cpu.x = COURT_LENGTH - 0.4;
  state.cpu.y = serverY;

  state.ball = {
    x: COURT_LENGTH - 0.4, y: serverY, z: 2.4,
    vx: 0, vy: 0, vz: 0,
    inPlay: false, bounces: 0, side: 'cpu',
  };

  setTimeout(() => { if (!state.paused && state.phase === 'serve-ready') doServe(); }, 650);
}

function doServe() {
  if (state.phase !== 'serve-ready') return;
  const diff = DIFFICULTIES[state.difficulty];
  state.phase = 'serve-flight';
  state.lastHitter = 'cpu';
  state.letServe = false;

  const half = state.serverSide === 'right' ? [0, MID_Y] : [MID_Y, COURT_WIDTH];
  const accuracy = diff.serveAccuracy * (state.serveNumber === 1 ? 1 : 1.25);
  const margin = (1 - Math.min(accuracy, 0.97)) * 1.8 + 0.25;
  const targetY = clamp(rand(half[0] + margin, half[1] - margin), half[0] + 0.15, half[1] - 0.15);
  // fica longe da fita da rede: mira na metade de trás da caixa de saque
  const targetX = clamp(rand(PLAYER_SERVICE_X + 0.6, NET_X - 1.1), PLAYER_SERVICE_X + 0.3, NET_X - 0.6);

  const speedRange = state.serveNumber === 1 ? diff.serve1Speed : diff.serve2Speed;
  const speed = rand(speedRange[0], speedRange[1]);

  launchBallCleared(state.ball, targetX, targetY, 0, speed);
  state.ball.inPlay = true;
  state.ball.bounces = 0;
  state.ball.serveTarget = { x: targetX, y: targetY, half };
  state.ball.isServe = true;
}

function launchBall(ball, tx, ty, tz, t) {
  ball.vx = (tx - ball.x) / t;
  ball.vy = (ty - ball.y) / t;
  ball.vz = (tz - ball.z) / t + 0.5 * GRAVITY * t;
}

/* Lança a bola mirando (tx,ty,tz) a uma velocidade média alvo, mas
   ajusta o tempo de voo (arco) até garantir folga sobre a rede —
   evita que o físico gere trajetórias baixas demais que tocam a fita. */
function launchBallCleared(ball, tx, ty, tz, speed, clearance) {
  clearance = clearance == null ? 0.28 : clearance;
  let t = Math.max(0.22, Math.hypot(tx - ball.x, ty - ball.y) / speed);
  for (let i = 0; i < 7; i++) {
    const vx = (tx - ball.x) / t;
    const vy = (ty - ball.y) / t;
    const vz = (tz - ball.z) / t + 0.5 * GRAVITY * t;
    if (vx === 0) { ball.vx = vx; ball.vy = vy; ball.vz = vz; return; }
    const tNet = (NET_X - ball.x) / vx;
    if (tNet <= 0 || tNet >= t) { ball.vx = vx; ball.vy = vy; ball.vz = vz; return; }
    const yNet = ball.y + vy * tNet;
    const zNet = ball.z + vz * tNet - 0.5 * GRAVITY * tNet * tNet;
    if (zNet >= netHeightAt(clamp(yNet, 0, COURT_WIDTH)) + clearance) {
      ball.vx = vx; ball.vy = vy; ball.vz = vz;
      return;
    }
    t *= 1.14; // aumenta o tempo de voo -> arco mais alto, mais folga na rede
  }
  const vx = (tx - ball.x) / t, vy = (ty - ball.y) / t;
  ball.vx = vx; ball.vy = vy; ball.vz = (tz - ball.z) / t + 0.5 * GRAVITY * t;
}

/* =========================================================
   PONTUAÇÃO OFICIAL DE TÊNIS
   ========================================================= */
function pointLabel(n) {
  return n === 0 ? '0' : n === 1 ? '15' : n === 2 ? '30' : n === 3 ? '40' : String(n);
}

function awardPoint(winner) {
  const m = state.match;
  const other = winner === 'player' ? 'cpu' : 'player';

  if (m.tiebreak) {
    m.tbPoints[winner]++;
    updateScoreboard();
    if (m.tbPoints[winner] >= 7 && m.tbPoints[winner] - m.tbPoints[other] >= 2) {
      m.games[winner]++; // fecha 7-6
      finishSet(winner);
    } else {
      afterPointContinue();
    }
    return;
  }

  m.points[winner]++;
  updateScoreboard();

  if (m.points[winner] >= 4 && m.points[winner] - m.points[other] >= 2) {
    winGame(winner);
  } else {
    afterPointContinue();
  }
}

function winGame(winner) {
  const m = state.match;
  m.games[winner]++;
  m.points = { player: 0, cpu: 0 };
  showMessage(winner === 'player' ? 'GAME — Você' : 'GAME — ' + DIFFICULTIES[state.difficulty].cpuName, 1300);

  const other = winner === 'player' ? 'cpu' : 'player';
  if (m.games[winner] >= 6 && m.games[winner] - m.games[other] >= 2) {
    finishSet(winner);
    return;
  }
  if (m.games.player === 6 && m.games.cpu === 6) {
    m.tiebreak = true;
    m.tbPoints = { player: 0, cpu: 0 };
  }
  updateScoreboard();
  afterPointContinue(1400);
}

function finishSet(winner) {
  const m = state.match;
  m.sets.push({ player: m.games.player, cpu: m.games.cpu });
  m.setsWon[winner]++;
  m.games = { player: 0, cpu: 0 };
  m.points = { player: 0, cpu: 0 };
  m.tiebreak = false;
  m.tbPoints = { player: 0, cpu: 0 };
  updateScoreboard();

  if (m.setsWon[winner] >= 2) {
    m.matchOver = true;
    m.winner = winner;
    showMessage(winner === 'player' ? '🏆 VOCÊ VENCEU A PARTIDA!' : '💀 ' + DIFFICULTIES[state.difficulty].cpuName + ' VENCEU', 2200);
    setTimeout(showEndScreen, 1500);
  } else {
    showMessage('SET — ' + (winner === 'player' ? 'Você' : DIFFICULTIES[state.difficulty].cpuName), 1700);
    afterPointContinue(1900);
  }
}

function afterPointContinue(delay = 1100) {
  state.phase = 'point-over';
  setTimeout(() => { if (!state.match.matchOver && !state.paused) startPoint(); }, delay);
}

function showEndScreen() {
  clearTimeout(messageTimer);
  messageOverlay.classList.remove('show');
  const m = state.match;
  const setsStr = m.sets.map((s) => `${s.player}-${s.cpu}`).join('  ');
  el('end-title').textContent = m.winner === 'player' ? '🏆 Você venceu!' : '💀 Você perdeu';
  el('end-detail').textContent =
    `Sets: ${m.setsWon.player} x ${m.setsWon.cpu}\nParciais: ${setsStr}`;
  endOverlay.classList.remove('hidden');
}

function updateScoreboard() {
  const m = state.match;
  const setsPlayerEl = el('sets-player');
  const setsCpuEl = el('sets-cpu');
  setsPlayerEl.innerHTML = '';
  setsCpuEl.innerHTML = '';
  m.sets.forEach((s) => {
    setsPlayerEl.innerHTML += `<span class="set-pill ${s.player > s.cpu ? 'won' : ''}">${s.player}</span>`;
    setsCpuEl.innerHTML += `<span class="set-pill ${s.cpu > s.player ? 'won' : ''}">${s.cpu}</span>`;
  });

  el('games-player').textContent = m.games.player;
  el('games-cpu').textContent = m.games.cpu;

  if (m.tiebreak) {
    el('points-player').textContent = m.tbPoints.player;
    el('points-cpu').textContent = m.tbPoints.cpu;
  } else {
    const p = m.points.player, c = m.points.cpu;
    if (p >= 3 && c >= 3) {
      if (p === c) { el('points-player').textContent = '40'; el('points-cpu').textContent = '40'; }
      else if (p > c) { el('points-player').textContent = 'AD'; el('points-cpu').textContent = ''; }
      else { el('points-player').textContent = ''; el('points-cpu').textContent = 'AD'; }
    } else {
      el('points-player').textContent = pointLabel(p);
      el('points-cpu').textContent = pointLabel(c);
    }
  }

  el('row-player').classList.remove('serving');
  el('row-cpu').classList.add('serving');
}

/* =========================================================
   FÍSICA DA BOLA / REDE / QUIQUE
   ========================================================= */
function updateBall(dt) {
  const ball = state.ball;
  if (!ball || !ball.inPlay) return;

  const prevX = ball.x;
  ball.vz -= GRAVITY * dt;
  ball.x += ball.vx * dt;
  ball.y += ball.vy * dt;
  ball.z += ball.vz * dt;

  // checa passagem pela rede
  if ((prevX - NET_X) * (ball.x - NET_X) < 0) {
    const h = netHeightAt(ball.y);
    if (ball.z <= h) {
      if (ball.isServe) {
        state.letServe = true;
        ball.vx *= 0.15;
        ball.vy *= 0.15;
        ball.vz = Math.min(ball.vz, -1.5);
      } else {
        netFault();
        return;
      }
    }
  }

  if (ball.z <= 0) {
    ball.z = 0;
    handleBounce();
  }
}

function netFault() {
  const hitter = state.lastHitter;
  state.ball.inPlay = false;
  showMessage('REDE!', 900);
  awardPoint(hitter === 'player' ? 'cpu' : 'player');
}

function handleBounce() {
  const ball = state.ball;
  ball.bounces++;
  const court = COURTS[state.court];
  ball.vz = -ball.vz * (0.42 * court.bounceMul);
  ball.vx *= 0.88;
  ball.vy *= 0.88;
  spawnBounceMark(ball.x, ball.y);

  const inSinglesCourt = ball.x >= -0.02 && ball.x <= COURT_LENGTH + 0.02 && ball.y >= -0.02 && ball.y <= COURT_WIDTH + 0.02;

  if (ball.isServe && ball.bounces === 1) {
    const t = ball.serveTarget;
    const inBox = ball.x >= PLAYER_SERVICE_X - 0.02 && ball.x <= NET_X + 0.02 && ball.y >= t.half[0] - 0.02 && ball.y <= t.half[1] + 0.02;
    const wasLet = state.letServe;
    state.letServe = false;
    if (wasLet && inBox) {
      ball.inPlay = false;
      showMessage('LET — repete o saque', 1000);
      setTimeout(() => { state.phase = 'serve-ready'; doServe(); }, 900);
      return;
    }
    if (!inBox) {
      ball.inPlay = false;
      if (state.serveNumber === 1) {
        showMessage('FALTA — 2º saque', 900);
        state.serveNumber = 2;
        setTimeout(() => { if (!state.paused) { state.phase = 'serve-ready'; doServe(); } }, 800);
      } else {
        showMessage('DUPLA FALTA!', 1200);
        awardPoint('player');
      }
      return;
    }
    // saque bom, vira rally
    ball.isServe = false;
    ball.side = 'player';
    checkAce();
    return;
  }

  ball.side = ball.x < NET_X ? 'player' : 'cpu';

  if (ball.bounces === 1 && !ball.isServe) {
    if (!inSinglesCourt) {
      ball.inPlay = false;
      showMessage('FORA!', 900);
      awardPoint(state.lastHitter);
      return;
    }
  }

  if (ball.bounces >= 2) {
    ball.inPlay = false;
    awardPoint(state.lastHitter);
  }
}

function checkAce() {
  // marca quem deve alcançar a bola; se ela passar longe demais do jogador, tende a virar ace naturalmente pela física
}

/* =========================================================
   RAQUETES
   ========================================================= */
const SWING_DUR = 0.24;

function updatePlayer(dt) {
  const p = state.player;
  const followSpeed = 22;
  const dx = p.targetX - p.x, dy = p.targetY - p.y;
  p.vx = dx; p.vy = dy;
  p.x += clamp(dx * followSpeed * dt, -30 * dt, 30 * dt);
  p.y += clamp(dy * followSpeed * dt, -30 * dt, 30 * dt);
  if (p.swingElapsed < SWING_DUR) p.swingElapsed += dt;
}

function predictLanding(ball) {
  if (ball.vz >= 0 && ball.z < 3) {
    // ainda subindo perto do chão, usa posição atual como aproximação
  }
  let z = ball.z, vz = ball.vz, t = 0;
  const dt = 0.02;
  let x = ball.x, y = ball.y, vx = ball.vx, vy = ball.vy;
  for (let i = 0; i < 300; i++) {
    vz -= GRAVITY * dt;
    x += vx * dt; y += vy * dt; z += vz * dt; t += dt;
    if (z <= 0) break;
  }
  return { x, y, t };
}

function updateCPU(dt) {
  const diff = DIFFICULTIES[state.difficulty];
  const c = state.cpu;
  const ball = state.ball;
  if (!ball) return;

  let targetX = COURT_LENGTH - 2.2, targetY = MID_Y;

  if (ball.inPlay && (ball.side === 'cpu' || ball.x > NET_X - 1.5) && ball.vx >= 0) {
    const land = predictLanding(ball);
    targetX = clamp(land.x, CPU_BOUNDS.xMin, CPU_BOUNDS.xMax - 0.5);
    targetY = clamp(land.y, CPU_BOUNDS.yMin, CPU_BOUNDS.yMax);
  } else if (ball.inPlay) {
    targetX = clamp(NET_X + 2.5, CPU_BOUNDS.xMin, CPU_BOUNDS.xMax);
    targetY = clamp(ball.y, CPU_BOUNDS.yMin, CPU_BOUNDS.yMax);
  }

  const noise = (1 - diff.cpuAccuracy) * 1.6;
  targetY += Math.sin(performance.now() / 500 + c.x) * noise * 0.3;

  const dx = targetX - c.x, dy = targetY - c.y;
  const d = Math.hypot(dx, dy) || 1;
  const step = diff.cpuSpeed * dt;
  c.x += (dx / d) * Math.min(step, Math.abs(dx));
  c.y += (dy / d) * Math.min(step, Math.abs(dy));
  c.x = clamp(c.x, CPU_BOUNDS.xMin, CPU_BOUNDS.xMax);
  c.y = clamp(c.y, CPU_BOUNDS.yMin, CPU_BOUNDS.yMax);
  if (c.swingElapsed < SWING_DUR) c.swingElapsed += dt;
}

function tryHits() {
  const ball = state.ball;
  if (!ball || !ball.inPlay || ball.isServe) return;
  if (ball.z > HIT_MAX_HEIGHT) return;

  if (state.lastHitter !== 'player' && ball.vx < 0 && ball.bounces <= 1) {
    const p = state.player;
    if (dist2(p.x, p.y, ball.x, ball.y) <= REACH_RADIUS * REACH_RADIUS) {
      playerHit();
    }
  }
  if (state.lastHitter !== 'cpu' && ball.vx >= 0 && ball.bounces <= 1) {
    const c = state.cpu;
    if (dist2(c.x, c.y, ball.x, ball.y) <= REACH_RADIUS * REACH_RADIUS) {
      cpuHit();
    }
  }
}

function playerHit() {
  const ball = state.ball;
  const p = state.player;
  state.lastHitter = 'player';
  ball.bounces = 0;
  ball.side = 'cpu';

  const offsetY = clamp((ball.y - p.y) * -1.4 + p.vy * 4, -3, 3);
  let targetY = clamp(ball.y + offsetY, 0.4, COURT_WIDTH - 0.4);
  let targetX = clamp(NET_X + rand(1.2, COURT_LENGTH - NET_X - 0.6), NET_X + 0.5, COURT_LENGTH - 0.5);

  const speed = clamp(11 + Math.hypot(p.targetX - p.x, p.targetY - p.y) * 6, 10, 22);
  launchBallCleared(ball, targetX, targetY, 0, speed);
  spawnHitFlash(ball.x, ball.y);
  p.swingElapsed = 0;
}

function cpuHit() {
  const diff = DIFFICULTIES[state.difficulty];
  const ball = state.ball;
  const c = state.cpu;
  state.lastHitter = 'cpu';
  ball.bounces = 0;
  ball.side = 'player';

  const miss = Math.random() < diff.errorChance;
  let targetY, targetX;

  if (miss) {
    targetY = Math.random() < 0.5 ? -0.5 : COURT_WIDTH + 0.5;
    targetX = rand(1.5, PLAYER_SERVICE_X);
  } else {
    const awayFromPlayer = state.player.y < MID_Y ? COURT_WIDTH - rand(0.5, 1.6) : rand(0.5, 1.6);
    targetY = clamp(diff.cpuAccuracy > 0.8 ? awayFromPlayer : rand(0.6, COURT_WIDTH - 0.6), 0.4, COURT_WIDTH - 0.4);
    targetX = clamp(rand(0.8, NET_X - 0.8), 0.5, NET_X - 0.5);
  }

  const speed = clamp(10 + diff.cpuSpeed * 1.6, 10, 24);
  launchBallCleared(ball, targetX, targetY, 0, speed);
  spawnHitFlash(ball.x, ball.y);
  c.swingElapsed = 0;
}

/* =========================================================
   EFEITOS VISUAIS SIMPLES (marcas de quique / flash de tacada)
   ========================================================= */
function spawnBounceMark(x, y) { state.effects.push({ type: 'bounce', x, y, life: 0.5, max: 0.5 }); }
function spawnHitFlash(x, y) { state.effects.push({ type: 'hit', x, y, life: 0.22, max: 0.22 }); }
function updateEffects(dt) {
  for (let i = state.effects.length - 1; i >= 0; i--) {
    state.effects[i].life -= dt;
    if (state.effects[i].life <= 0) state.effects.splice(i, 1);
  }
}

/* =========================================================
   RENDERIZAÇÃO — câmera de frente, atrás da linha de fundo do
   jogador, olhando para o fundo do adversário.
   ========================================================= */
function drawSky() {
  const c = COURTS[state.court];
  const sky = ctx.createLinearGradient(0, 0, 0, HORIZON_Y + 30);
  sky.addColorStop(0, c.sky[0]);
  sky.addColorStop(1, c.sky[1]);
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, CANVAS_W, HORIZON_Y + 30);
}

function drawCourt() {
  const c = COURTS[state.court];
  ctx.fillStyle = c.out;
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
  drawSky();

  // área jogável (com faixa de saída) como polígono em perspectiva
  const corners = [
    courtToPx(WORLD_X_MIN, WORLD_Y_MIN), courtToPx(WORLD_X_MAX, WORLD_Y_MIN),
    courtToPx(WORLD_X_MAX, WORLD_Y_MAX), courtToPx(WORLD_X_MIN, WORLD_Y_MAX),
  ];
  ctx.beginPath();
  ctx.moveTo(corners[0].x, corners[0].y);
  for (let i = 1; i < 4; i++) ctx.lineTo(corners[i].x, corners[i].y);
  ctx.closePath();
  const grad = ctx.createLinearGradient(0, HORIZON_Y, 0, GROUND_Y);
  grad.addColorStop(0, c.surface[0]);
  grad.addColorStop(1, c.surface[1]);
  ctx.fillStyle = grad;
  ctx.fill();

  ctx.save();
  ctx.strokeStyle = c.lineColor;
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  if (c.glow) { ctx.shadowColor = c.lineColor; ctx.shadowBlur = 10; }

  line(0, 0, 0, COURT_WIDTH);
  line(COURT_LENGTH, 0, COURT_LENGTH, COURT_WIDTH);
  line(0, 0, COURT_LENGTH, 0);
  line(0, COURT_WIDTH, COURT_LENGTH, COURT_WIDTH);
  line(PLAYER_SERVICE_X, 0, PLAYER_SERVICE_X, COURT_WIDTH);
  line(CPU_SERVICE_X, 0, CPU_SERVICE_X, COURT_WIDTH);
  line(PLAYER_SERVICE_X, MID_Y, CPU_SERVICE_X, MID_Y);
  line(0, MID_Y, 0.18, MID_Y);
  line(COURT_LENGTH - 0.18, MID_Y, COURT_LENGTH, MID_Y);
  ctx.restore();

  drawNet(c);

  function line(x1, y1, x2, y2) {
    const a = courtToPx(x1, y1), b = courtToPx(x2, y2);
    ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
  }
}

function drawNet(c) {
  const yLo = -0.06, yHi = COURT_WIDTH + 0.06;
  const cols = 26;
  ctx.save();
  if (c.glow) { ctx.shadowColor = c.netColor; ctx.shadowBlur = 8; }

  // sombra do fio no chão
  const b0 = courtToPx(NET_X, yLo, 0), b1 = courtToPx(NET_X, yHi, 0);
  ctx.strokeStyle = 'rgba(0,0,0,.25)';
  ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(b0.x, b0.y); ctx.lineTo(b1.x, b1.y); ctx.stroke();

  // malha vertical
  ctx.strokeStyle = c.glow ? c.netColor : 'rgba(255,255,255,.55)';
  ctx.lineWidth = 1;
  const tops = [];
  for (let i = 0; i <= cols; i++) {
    const y = yLo + (yHi - yLo) * (i / cols);
    const h = i === 0 || i === cols ? NET_HEIGHT_POST + 0.06 : netHeightAt(clamp(y, 0, COURT_WIDTH));
    const bottom = courtToPx(NET_X, y, 0);
    const top = courtToPx(NET_X, y, h);
    tops.push(top);
    ctx.beginPath(); ctx.moveTo(bottom.x, bottom.y); ctx.lineTo(top.x, top.y); ctx.stroke();
  }
  // fio superior
  ctx.strokeStyle = c.lineColor;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(tops[0].x, tops[0].y);
  for (let i = 1; i < tops.length; i++) ctx.lineTo(tops[i].x, tops[i].y);
  ctx.stroke();

  // postes
  ctx.fillStyle = '#20242e';
  [yLo, yHi].forEach((y) => {
    const bottom = courtToPx(NET_X, y, 0);
    const top = courtToPx(NET_X, y, NET_HEIGHT_POST + 0.08);
    ctx.fillRect(bottom.x - 2.5, top.y, 5, bottom.y - top.y);
  });
  ctx.restore();
}

/* Raquete com cabo, aro oval e cordas cruzadas — desenhada a partir
   da posição do jogador no chão, "erguida" até a altura da mão, com
   leve inclinação de preparo e uma animação de swing na tacada. */
function drawPlayerFigure(xm, ym, color, isPlayer, swingElapsed) {
  const ground = project(xm, ym, 0);
  const handHeight = 1.05;
  const hand = project(xm, ym, handHeight);
  const scale = ground.scale;

  // sombra
  ctx.beginPath();
  ctx.ellipse(ground.x, ground.y, 15 * scale, 5.5 * scale, 0, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(0,0,0,.35)';
  ctx.fill();

  // corpo (torso simplificado)
  ctx.save();
  ctx.translate(ground.x, ground.y);
  ctx.scale(scale, scale);
  ctx.beginPath();
  ctx.ellipse(0, -38, 12, 20, 0, 0, Math.PI * 2);
  const bodyGrad = ctx.createLinearGradient(0, -58, 0, -18);
  bodyGrad.addColorStop(0, shade(color, 18));
  bodyGrad.addColorStop(1, shade(color, -22));
  ctx.fillStyle = bodyGrad;
  ctx.fill();
  ctx.beginPath();
  ctx.arc(0, -66, 8, 0, Math.PI * 2);
  ctx.fillStyle = '#f0c8a0';
  ctx.fill();
  ctx.restore();

  // progresso do swing (0 = parado, 1 = tacada completa)
  const swinging = swingElapsed < SWING_DUR;
  const prog = swinging ? swingElapsed / SWING_DUR : 0;
  const swingAngle = Math.sin(clamp(prog, 0, 1) * Math.PI) * 1.55;
  const readyLean = clamp((isPlayer ? state.player.vy : (ym - state.cpu.y)) * 0.35, -0.3, 0.3);
  const facing = isPlayer ? 1 : -1;
  const angle = facing * (0.35 + swingAngle - readyLean);

  ctx.save();
  ctx.translate(hand.x, hand.y);
  ctx.scale(scale, scale);
  ctx.rotate(angle);

  // cabo
  const grip = 28;
  ctx.fillStyle = '#2a2f38';
  ctx.fillRect(-3, 0, 6, grip);
  ctx.strokeStyle = '#565f6e';
  ctx.lineWidth = 1;
  for (let i = 4; i < grip; i += 5) { ctx.beginPath(); ctx.moveTo(-3, i); ctx.lineTo(3, i); ctx.stroke(); }

  // haste até o aro
  ctx.strokeStyle = '#3a3f4a';
  ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -14); ctx.stroke();

  // aro oval
  const headCx = 0, headCy = -40, headRx = 15, headRy = 21;
  ctx.beginPath();
  ctx.ellipse(headCx, headCy, headRx, headRy, 0, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255,255,255,.14)';
  ctx.fill();
  ctx.lineWidth = 4;
  ctx.strokeStyle = color;
  ctx.stroke();

  // cordas cruzadas
  ctx.save();
  ctx.beginPath();
  ctx.ellipse(headCx, headCy, headRx - 2.5, headRy - 2.5, 0, 0, Math.PI * 2);
  ctx.clip();
  ctx.strokeStyle = 'rgba(255,255,255,.75)';
  ctx.lineWidth = 0.8;
  for (let i = -3; i <= 3; i++) {
    ctx.beginPath(); ctx.moveTo(headCx + i * 4.3, headCy - headRy); ctx.lineTo(headCx + i * 4.3, headCy + headRy); ctx.stroke();
  }
  for (let i = -4; i <= 4; i++) {
    ctx.beginPath(); ctx.moveTo(headCx - headRx, headCy + i * 4.3); ctx.lineTo(headCx + headRx, headCy + i * 4.3); ctx.stroke();
  }
  ctx.restore();

  ctx.restore();
}

function shade(hex, amt) {
  const n = parseInt(hex.slice(1), 16);
  const r = clamp(((n >> 16) & 255) + amt, 0, 255);
  const g = clamp(((n >> 8) & 255) + amt, 0, 255);
  const b = clamp((n & 255) + amt, 0, 255);
  return `rgb(${r},${g},${b})`;
}

function drawBall() {
  const ball = state.ball;
  if (!ball) return;
  const ground = project(ball.x, ball.y, 0);
  const shadowScale = clamp(1 - ball.z / 6, 0.2, 1) * ground.scale;
  ctx.beginPath();
  ctx.ellipse(ground.x, ground.y, 9 * shadowScale, 3.5 * shadowScale, 0, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(0,0,0,.38)';
  ctx.fill();

  const air = project(ball.x, ball.y, ball.z);
  ctx.beginPath();
  ctx.arc(air.x, air.y, 6.5 * air.scale, 0, Math.PI * 2);
  ctx.fillStyle = '#d8ff3e';
  ctx.fill();
  ctx.lineWidth = 1;
  ctx.strokeStyle = '#8fae1f';
  ctx.stroke();
}

function drawEffects() {
  for (const e of state.effects) {
    const p = courtToPx(e.x, e.y);
    const s = project(e.x, e.y, 0).scale;
    const t = e.life / e.max;
    ctx.beginPath();
    if (e.type === 'bounce') {
      ctx.ellipse(p.x, p.y, 14 * (1.4 - t) * s, 4.5 * (1.4 - t) * s, 0, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(255,255,255,${t * 0.6})`;
      ctx.lineWidth = 2;
      ctx.stroke();
    } else {
      ctx.arc(p.x, p.y, (16 * (1 - t) + 4) * s, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(255,255,255,${t * 0.5})`;
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  }
}

function render() {
  drawCourt();
  drawEffects();

  // ordena por profundidade: desenha o que está mais longe primeiro
  const items = [
    { depth: depthOf(state.cpu.x), draw: () => drawPlayerFigure(state.cpu.x, state.cpu.y, '#ff5d73', false, state.cpu.swingElapsed) },
    { depth: depthOf(state.ball ? state.ball.x : NET_X), draw: drawBall },
    { depth: depthOf(state.player.x), draw: () => drawPlayerFigure(state.player.x, state.player.y, '#3ee68f', true, state.player.swingElapsed) },
  ];
  items.sort((a, b) => b.depth - a.depth);
  items.forEach((it) => it.draw());
}

/* =========================================================
   LOOP PRINCIPAL
   ========================================================= */
let lastTime = performance.now();
function loop(now) {
  const dt = Math.min(0.033, (now - lastTime) / 1000);
  lastTime = now;

  if (state.screen === 'game' && !state.paused) {
    updatePlayer(dt);
    updateCPU(dt);
    updateBall(dt);
    tryHits();
    updateEffects(dt);
    render();
  }
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);
