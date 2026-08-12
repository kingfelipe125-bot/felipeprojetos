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
const CANVAS_H = 420;
const PPM = CANVAS_W / (COURT_LENGTH + MARGIN_X * 2);

const GRAVITY = 13.5;
const BALL_RADIUS = 0.09;
const REACH_RADIUS = 1.35;
const HIT_MAX_HEIGHT = 2.4;

const PLAYER_BOUNDS = { xMin: -MARGIN_X + 0.3, xMax: NET_X - 0.35, yMin: -MARGIN_Y + 0.3, yMax: COURT_WIDTH + MARGIN_Y - 0.3 };
const CPU_BOUNDS = { xMin: NET_X + 0.35, xMax: COURT_LENGTH + MARGIN_X - 0.3, yMin: -MARGIN_Y + 0.3, yMax: COURT_WIDTH + MARGIN_Y - 0.3 };

function courtToPx(xm, ym) { return { x: (MARGIN_X + xm) * PPM, y: (MARGIN_Y + ym) * PPM }; }
function pxToCourt(px, py) { return { x: px / PPM - MARGIN_X, y: py / PPM - MARGIN_Y }; }
function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
function rand(lo, hi) { return lo + Math.random() * (hi - lo); }
function dist2(ax, ay, bx, by) { const dx = ax - bx, dy = ay - by; return dx * dx + dy * dy; }

function netHeightAt(y) {
  const t = Math.min(1, Math.abs(y - MID_Y) / MID_Y);
  return NET_HEIGHT_CENTER + (NET_HEIGHT_POST - NET_HEIGHT_CENTER) * t;
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
    surface: ['#1f63b0', '#1857a0'], out: '#123a70', bounceMul: 1.0,
  },
  cyber: {
    label: 'Cyber', lineColor: '#4dfaff', netColor: '#ff2fd1', glow: true,
    surface: ['#170a33', '#0c0620'], out: '#08041a', bounceMul: 1.08,
  },
  grama: {
    label: 'Grama', lineColor: '#f5f8ff', netColor: '#3a2a1a', glow: false,
    surface: ['#2f9142', '#237334'], out: '#194f23', bounceMul: 0.88,
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
  player: { x: 3, y: MID_Y, targetX: 3, targetY: MID_Y, vy: 0 },
  cpu: { x: COURT_LENGTH - 3, y: MID_Y, reactTimer: 0, aimTarget: null },
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
  const targetX = clamp(rand(PLAYER_SERVICE_X + 0.3, NET_X - 0.3), PLAYER_SERVICE_X + 0.15, NET_X - 0.15);

  const speedRange = state.serveNumber === 1 ? diff.serve1Speed : diff.serve2Speed;
  const speed = rand(speedRange[0], speedRange[1]);
  const dx = targetX - state.ball.x, dy = targetY - state.ball.y;
  const dist = Math.hypot(dx, dy);
  const flightTime = Math.max(0.25, dist / speed);

  launchBall(state.ball, targetX, targetY, 0, flightTime);
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
    if (state.letServe) {
      state.letServe = false;
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
function updatePlayer(dt) {
  const p = state.player;
  const followSpeed = 22;
  const dx = p.targetX - p.x, dy = p.targetY - p.y;
  p.vy = dy;
  p.x += clamp(dx * followSpeed * dt, -30 * dt, 30 * dt);
  p.y += clamp(dy * followSpeed * dt, -30 * dt, 30 * dt);
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
  const dist = Math.hypot(targetX - ball.x, targetY - ball.y);
  const flightTime = Math.max(0.28, dist / speed);
  launchBall(ball, targetX, targetY, 0, flightTime);
  spawnHitFlash(ball.x, ball.y);
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
  const dist = Math.hypot(targetX - ball.x, targetY - ball.y);
  const flightTime = Math.max(0.28, dist / speed);
  launchBall(ball, targetX, targetY, 0, flightTime);
  spawnHitFlash(ball.x, ball.y);
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
   RENDERIZAÇÃO
   ========================================================= */
function drawCourt() {
  const c = COURTS[state.court];
  ctx.fillStyle = c.out;
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

  const tl = courtToPx(0, 0);
  const br = courtToPx(COURT_LENGTH, COURT_WIDTH);
  const grad = ctx.createLinearGradient(0, tl.y, 0, br.y);
  grad.addColorStop(0, c.surface[0]);
  grad.addColorStop(1, c.surface[1]);
  ctx.fillStyle = grad;
  ctx.fillRect(tl.x, tl.y, br.x - tl.x, br.y - tl.y);

  ctx.save();
  ctx.strokeStyle = c.lineColor;
  ctx.lineWidth = 2.4;
  if (c.glow) { ctx.shadowColor = c.lineColor; ctx.shadowBlur = 8; }

  line(0, 0, 0, COURT_WIDTH);
  line(COURT_LENGTH, 0, COURT_LENGTH, COURT_WIDTH);
  line(0, 0, COURT_LENGTH, 0);
  line(0, COURT_WIDTH, COURT_LENGTH, COURT_WIDTH);
  line(PLAYER_SERVICE_X, 0, PLAYER_SERVICE_X, COURT_WIDTH);
  line(CPU_SERVICE_X, 0, CPU_SERVICE_X, COURT_WIDTH);
  line(PLAYER_SERVICE_X, MID_Y, CPU_SERVICE_X, MID_Y);
  line(0, MID_Y, 0.15, MID_Y);
  line(COURT_LENGTH - 0.15, MID_Y, COURT_LENGTH, MID_Y);
  ctx.restore();

  const n1 = courtToPx(NET_X, -0.15);
  const n2 = courtToPx(NET_X, COURT_WIDTH + 0.15);
  ctx.save();
  ctx.strokeStyle = c.netColor;
  ctx.lineWidth = 5;
  if (c.glow) { ctx.shadowColor = c.netColor; ctx.shadowBlur = 10; }
  ctx.beginPath(); ctx.moveTo(n1.x, n1.y); ctx.lineTo(n2.x, n2.y); ctx.stroke();
  ctx.setLineDash([3, 4]);
  ctx.lineWidth = 1;
  ctx.strokeStyle = 'rgba(255,255,255,.35)';
  for (let i = 0; i <= 10; i++) {
    const y0 = n1.y + (n2.y - n1.y) * (i / 10);
    ctx.beginPath(); ctx.moveTo(n1.x - 3, y0); ctx.lineTo(n1.x + 3, y0); ctx.stroke();
  }
  ctx.setLineDash([]);
  ctx.restore();

  function line(x1, y1, x2, y2) {
    const a = courtToPx(x1, y1), b = courtToPx(x2, y2);
    ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
  }
}

function drawRacket(xm, ym, color, facingRight) {
  const p = courtToPx(xm, ym);
  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.beginPath();
  ctx.ellipse(0, 6, 13, 5, 0, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(0,0,0,.35)';
  ctx.fill();

  const handleDir = facingRight ? -1 : 1;
  ctx.strokeStyle = '#2a2f38';
  ctx.lineWidth = 4;
  ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(handleDir * 16, 0); ctx.stroke();

  ctx.beginPath();
  ctx.ellipse(handleDir * -8, 0, 12, 15, 0, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.globalAlpha = 0.85;
  ctx.fill();
  ctx.lineWidth = 2.5;
  ctx.strokeStyle = '#fff';
  ctx.globalAlpha = 1;
  ctx.stroke();
  ctx.restore();
}

function drawBall() {
  const ball = state.ball;
  if (!ball) return;
  const shadowP = courtToPx(ball.x, ball.y);
  const shadowScale = clamp(1 - ball.z / 6, 0.25, 1);
  ctx.beginPath();
  ctx.ellipse(shadowP.x, shadowP.y, 9 * shadowScale, 4 * shadowScale, 0, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(0,0,0,.4)';
  ctx.fill();

  const ballPx = shadowP.y - ball.z * PPM * 0.9;
  ctx.beginPath();
  ctx.arc(shadowP.x, ballPx, 7, 0, Math.PI * 2);
  ctx.fillStyle = '#d8ff3e';
  ctx.fill();
  ctx.lineWidth = 1;
  ctx.strokeStyle = '#8fae1f';
  ctx.stroke();
}

function drawEffects() {
  for (const e of state.effects) {
    const p = courtToPx(e.x, e.y);
    const t = e.life / e.max;
    ctx.beginPath();
    if (e.type === 'bounce') {
      ctx.ellipse(p.x, p.y, 14 * (1.4 - t), 5 * (1.4 - t), 0, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(255,255,255,${t * 0.6})`;
      ctx.lineWidth = 2;
      ctx.stroke();
    } else {
      ctx.arc(p.x, p.y, 16 * (1 - t) + 4, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(255,255,255,${t * 0.5})`;
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  }
}

function render() {
  drawCourt();
  drawEffects();
  drawRacket(state.player.x, state.player.y, '#3ee68f', true);
  drawRacket(state.cpu.x, state.cpu.y, '#ff5d73', false);
  drawBall();
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
