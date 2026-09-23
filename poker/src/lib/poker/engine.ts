import { cardId, type Card } from "./cards";
import { shuffledDeck, type Rng, defaultRng } from "./deck";
import { evaluateHand, type HandResult } from "./handEvaluator";
import { computePots, splitAmount } from "./pots";
import type {
  ActionKind, Award, GameState, LegalActions, Player, PlayerAction, Street, TableConfig,
} from "./types";

export interface SeatSetup {
  id: string;
  name: string;
  isHuman: boolean;
  personality?: Player["personality"];
  stack: number;
}

const MAX_LOG = 80;

export function createGame(config: TableConfig, seats: SeatSetup[]): GameState {
  return {
    config,
    players: seats.map((s) => ({
      ...s,
      startStack: s.stack,
      hole: [],
      bet: 0,
      contributed: 0,
      folded: false,
      allIn: false,
      inHand: false,
      hasActed: false,
      raiseLocked: false,
      lastAction: null,
    })),
    handNumber: 0,
    dealer: -1,
    sbIndex: -1,
    bbIndex: -1,
    street: "preflop",
    stage: "idle",
    deck: [],
    community: [],
    currentPlayer: -1,
    currentBet: 0,
    minRaise: config.bigBlind,
    outcome: null,
    log: [],
    logSeq: 0,
  };
}

function clone(state: GameState): GameState {
  return structuredClone(state);
}

function log(state: GameState, text: string, tone?: "info" | "win" | "street") {
  state.logSeq += 1;
  state.log.push({ id: state.logSeq, text, tone });
  if (state.log.length > MAX_LOG) state.log.splice(0, state.log.length - MAX_LOG);
}

const n = (v: number) => v.toLocaleString("pt-BR");

/** Próximo assento (após `from`, circular) que satisfaz `pred`. -1 se nenhum. */
function nextSeat(players: Player[], from: number, pred: (p: Player) => boolean): number {
  const len = players.length;
  for (let step = 1; step <= len; step++) {
    const i = (((from + step) % len) + len) % len;
    if (pred(players[i])) return i;
  }
  return -1;
}

const isLive = (p: Player) => p.inHand && !p.folded;
const canAct = (p: Player) => isLive(p) && !p.allIn;

export function livePlayers(state: GameState): Player[] {
  return state.players.filter(isLive);
}

export function potTotal(state: GameState): number {
  return state.players.reduce((sum, p) => sum + p.contributed, 0);
}

/** Pote já recolhido ao centro (sem as apostas da rodada atual). */
export function collectedPot(state: GameState): number {
  return state.players.reduce((sum, p) => sum + p.contributed - p.bet, 0);
}

function putChips(p: Player, amount: number) {
  const a = Math.min(amount, p.stack);
  p.stack -= a;
  p.bet += a;
  p.contributed += a;
  if (p.stack === 0) p.allIn = true;
  return a;
}

function draw(state: GameState): Card {
  const c = state.deck.pop();
  if (!c) throw new Error("Baralho vazio");
  return c;
}

export function canStartHand(state: GameState): boolean {
  return state.players.filter((p) => p.stack > 0).length >= 2;
}

export function startHand(prev: GameState, rng: Rng = defaultRng): GameState {
  if (!canStartHand(prev)) throw new Error("São necessários pelo menos 2 jogadores com fichas");
  const state = clone(prev);
  const { players, config } = state;

  state.handNumber += 1;
  state.deck = shuffledDeck(rng);
  state.community = [];
  state.street = "preflop";
  state.outcome = null;
  state.currentBet = 0;
  state.minRaise = config.bigBlind;

  for (const p of players) {
    p.startStack = p.stack;
    p.hole = [];
    p.bet = 0;
    p.contributed = 0;
    p.folded = false;
    p.allIn = false;
    p.inHand = p.stack > 0;
    p.hasActed = false;
    p.raiseLocked = false;
    p.lastAction = null;
  }

  const seated = (p: Player) => p.inHand;
  state.dealer = state.dealer < 0
    ? nextSeat(players, Math.floor(rng() * players.length) - 1, seated)
    : nextSeat(players, state.dealer, seated);

  const headsUp = players.filter(seated).length === 2;
  // No heads-up o botão paga o small blind e age primeiro no pré-flop.
  state.sbIndex = headsUp ? state.dealer : nextSeat(players, state.dealer, seated);
  state.bbIndex = nextSeat(players, state.sbIndex, seated);

  log(state, `— Mão #${state.handNumber} · botão: ${players[state.dealer].name} —`, "street");

  const sb = players[state.sbIndex];
  const sbPaid = putChips(sb, config.smallBlind);
  sb.lastAction = { kind: "sb", amount: sbPaid };
  log(state, `${sb.name} paga small blind ${n(sbPaid)}`);

  const bb = players[state.bbIndex];
  const bbPaid = putChips(bb, config.bigBlind);
  bb.lastAction = { kind: "bb", amount: bbPaid };
  log(state, `${bb.name} paga big blind ${n(bbPaid)}`);

  // Mesmo que o BB esteja all-in com menos, os demais precisam pagar o big blind cheio.
  state.currentBet = Math.max(config.bigBlind, sb.bet);

  // Duas voltas, uma carta por vez, começando à esquerda do botão.
  for (let round = 0; round < 2; round++) {
    let seat = state.sbIndex;
    for (let k = 0; k < players.filter(seated).length; k++) {
      players[seat].hole.push(draw(state));
      seat = nextSeat(players, seat, seated);
    }
  }

  beginBettingOrEnd(state, nextSeat(players, state.bbIndex, canAct));
  return state;
}

/** Define o primeiro a agir ou, se ninguém pode apostar, encerra a rodada. */
function beginBettingOrEnd(state: GameState, firstSeat: number) {
  if (isRoundOver(state)) {
    state.stage = "streetEnd";
    state.currentPlayer = -1;
    return;
  }
  let seat = firstSeat;
  if (seat < 0 || !needsToAct(state, state.players[seat])) {
    seat = nextSeat(state.players, seat, (p) => needsToAct(state, p));
  }
  state.stage = "betting";
  state.currentPlayer = seat;
}

function needsToAct(state: GameState, p: Player): boolean {
  return canAct(p) && (!p.hasActed || p.bet < state.currentBet);
}

export function isRoundOver(state: GameState): boolean {
  const live = state.players.filter(isLive);
  if (live.length <= 1) return true;
  const actors = live.filter((p) => !p.allIn);
  if (actors.length === 0) return true;
  // Um único jogador com fichas, já cobrindo a maior aposta: não há contra quem apostar.
  if (actors.length === 1 && actors[0].bet >= state.currentBet) return true;
  return actors.every((p) => p.hasActed && p.bet === state.currentBet);
}

export function getLegalActions(state: GameState, seat: number = state.currentPlayer): LegalActions {
  const p = state.players[seat];
  const none: LegalActions = {
    canFold: false, canCheck: false, canCall: false, callAmount: 0, canRaise: false,
    minRaiseTo: 0, maxRaiseTo: 0, canAllIn: false, isBet: state.currentBet === 0,
  };
  if (!p || state.stage !== "betting" || seat !== state.currentPlayer || !canAct(p)) return none;

  const owed = Math.max(0, state.currentBet - p.bet);
  const callAmount = Math.min(owed, p.stack);
  const maxRaiseTo = p.bet + p.stack;
  const othersCanRespond = state.players.some((o, i) => i !== seat && canAct(o));
  const canRaise = !p.raiseLocked && othersCanRespond && p.stack > owed;
  const fullMin = state.currentBet + state.minRaise;

  return {
    canFold: true,
    canCheck: owed === 0,
    canCall: owed > 0,
    callAmount,
    canRaise,
    minRaiseTo: canRaise ? Math.min(fullMin, maxRaiseTo) : 0,
    maxRaiseTo: canRaise ? maxRaiseTo : 0,
    // All-in é permitido como aumento, ou como "pagar com tudo" quando não cobre a aposta.
    canAllIn: p.stack > 0 && (canRaise || p.stack <= owed),
    isBet: state.currentBet === 0,
  };
}

export class IllegalActionError extends Error {}

export function applyAction(prev: GameState, action: PlayerAction): GameState {
  const seat = prev.currentPlayer;
  const legal = getLegalActions(prev, seat);
  const state = clone(prev);
  const p = state.players[seat];
  if (!p || state.stage !== "betting") throw new IllegalActionError("Não é a vez de ninguém agir");

  let kind: ActionKind;
  let raiseTo: number | null = null;

  switch (action.type) {
    case "fold":
      p.folded = true;
      kind = "fold";
      log(state, `${p.name} desiste`);
      break;
    case "check":
      if (!legal.canCheck) throw new IllegalActionError("Não é possível dar check");
      kind = "check";
      log(state, `${p.name} dá check`);
      break;
    case "call": {
      if (!legal.canCall) throw new IllegalActionError("Não há aposta para pagar");
      const paid = putChips(p, legal.callAmount);
      kind = p.allIn ? "allin" : "call";
      log(state, `${p.name} paga ${n(paid)}${p.allIn ? " (all-in)" : ""}`);
      break;
    }
    case "raise": {
      if (!legal.canRaise) throw new IllegalActionError("Aumento não permitido");
      const to = Math.floor(action.to);
      if (to < legal.minRaiseTo || to > legal.maxRaiseTo) {
        throw new IllegalActionError(`Aumento deve ficar entre ${legal.minRaiseTo} e ${legal.maxRaiseTo}`);
      }
      raiseTo = to;
      kind = state.currentBet === 0 ? "bet" : "raise";
      break;
    }
    case "allin": {
      if (!legal.canAllIn) throw new IllegalActionError("All-in não permitido");
      const total = p.bet + p.stack;
      if (total <= state.currentBet) {
        const paid = putChips(p, p.stack);
        kind = "allin";
        log(state, `${p.name} paga ${n(paid)} (all-in)`);
      } else {
        raiseTo = total;
        kind = "allin";
      }
      break;
    }
  }

  if (raiseTo !== null) {
    const raiseSize = raiseTo - state.currentBet;
    const wasBet = state.currentBet === 0;
    putChips(p, raiseTo - p.bet);
    if (p.allIn) kind = "allin";
    if (raiseSize >= state.minRaise) {
      // Aumento completo: reabre a ação para todos.
      state.minRaise = raiseSize;
      for (const o of state.players) {
        if (o !== p) { o.hasActed = false; o.raiseLocked = false; }
      }
    } else {
      // All-in menor que um aumento mínimo: quem já agiu só pode pagar ou desistir.
      for (const o of state.players) {
        if (o !== p && o.hasActed) { o.hasActed = false; o.raiseLocked = true; }
      }
    }
    state.currentBet = raiseTo;
    const verb = wasBet ? "aposta" : "aumenta para";
    log(state, `${p.name} ${verb} ${n(raiseTo)}${p.allIn ? " (all-in)" : ""}`);
  }

  p.hasActed = true;
  p.lastAction = { kind, amount: kind === "fold" || kind === "check" ? undefined : p.bet };

  if (isRoundOver(state)) {
    state.stage = "streetEnd";
    state.currentPlayer = -1;
  } else {
    state.currentPlayer = nextSeat(state.players, seat, (o) => needsToAct(state, o));
  }
  return state;
}

/** Devolve a parte de uma aposta que ninguém pagou. */
function returnUncalled(state: GameState) {
  const sorted = state.players.slice().sort((a, b) => b.bet - a.bet);
  const [top, second] = sorted;
  if (!top || top.bet === 0) return;
  const excess = top.bet - (second?.bet ?? 0);
  if (excess > 0) {
    top.bet -= excess;
    top.contributed -= excess;
    top.stack += excess;
    if (top.stack > 0) top.allIn = false;
    log(state, `${n(excess)} devolvidos a ${top.name} (aposta não paga)`);
  }
}

const STREET_ORDER: Street[] = ["preflop", "flop", "turn", "river"];
const STREET_NAME: Record<Street, string> = { preflop: "Pré-flop", flop: "Flop", turn: "Turn", river: "River" };

/**
 * Recolhe as apostas e avança: próxima rua, runout automático (todos all-in)
 * ou resolução da mão.
 */
export function advance(prev: GameState): GameState {
  if (prev.stage !== "streetEnd") return prev;
  const state = clone(prev);
  returnUncalled(state);
  for (const p of state.players) {
    p.bet = 0;
    p.hasActed = false;
    p.raiseLocked = false;
    if (p.lastAction && p.lastAction.kind !== "fold" && p.lastAction.kind !== "allin") p.lastAction = null;
  }
  state.currentBet = 0;
  state.minRaise = state.config.bigBlind;

  const live = state.players.filter(isLive);
  if (live.length === 1) return awardUncontested(state, live[0]);

  const idx = STREET_ORDER.indexOf(state.street);
  if (idx === STREET_ORDER.length - 1) return resolveShowdown(state);

  const next = STREET_ORDER[idx + 1];
  state.street = next;
  draw(state); // carta queimada
  const count = next === "flop" ? 3 : 1;
  for (let i = 0; i < count; i++) state.community.push(draw(state));
  log(state, `${STREET_NAME[next]}: ${state.community.map(cardId).join(" ")}`, "street");

  beginBettingOrEnd(state, nextSeat(state.players, state.dealer, canAct));
  return state;
}

function awardUncontested(state: GameState, winner: Player): GameState {
  const total = potTotal(state);
  winner.stack += total;
  state.outcome = {
    showdown: false,
    pots: [{ amount: total, eligible: [winner.id] }],
    awards: [{ playerId: winner.id, amount: total, potIndex: 0 }],
    hands: {},
    totalPot: total,
  };
  log(state, `${winner.name} leva ${n(total)} (todos desistiram)`, "win");
  finish(state);
  return state;
}

function resolveShowdown(state: GameState): GameState {
  const live = state.players.filter(isLive);
  const hands: Record<string, HandResult> = {};
  for (const p of live) hands[p.id] = evaluateHand([...p.hole, ...state.community]);

  const pots = computePots(state.players);
  const awards: Award[] = [];
  pots.forEach((pot, potIndex) => {
    const contenders = pot.eligible;
    const best = Math.max(...contenders.map((id) => hands[id].score));
    const winnerSeats = state.players
      .map((p, i) => (contenders.includes(p.id) && hands[p.id].score === best ? i : -1))
      .filter((i) => i >= 0);
    const shares = splitAmount(pot.amount, winnerSeats, state.dealer, state.players.length);
    for (const [seat, amount] of shares) {
      const p = state.players[seat];
      p.stack += amount;
      awards.push({ playerId: p.id, amount, potIndex, hand: hands[p.id] });
    }
  });

  for (const p of live) log(state, `${p.name} mostra ${p.hole.map(cardId).join(" ")} — ${hands[p.id].description}`);
  for (const a of awards) {
    const p = state.players.find((x) => x.id === a.playerId)!;
    const potLabel = pots.length > 1 ? (a.potIndex === 0 ? " do pote principal" : ` do pote lateral ${a.potIndex}`) : "";
    log(state, `${p.name} ganha ${n(a.amount)}${potLabel} com ${a.hand?.description}`, "win");
  }

  state.outcome = { showdown: true, pots, awards, hands, totalPot: potTotal(state) };
  finish(state);
  return state;
}

function finish(state: GameState) {
  state.stage = "handOver";
  state.currentPlayer = -1;
  for (const p of state.players) {
    p.bet = 0;
    p.allIn = false;
  }
}

/** Soma do que cada jogador ganhou nesta mão (0 para quem não ganhou nada). */
export function winningsById(state: GameState): Record<string, number> {
  const out: Record<string, number> = {};
  for (const a of state.outcome?.awards ?? []) out[a.playerId] = (out[a.playerId] ?? 0) + a.amount;
  return out;
}
