import { test } from "node:test";
import assert from "node:assert/strict";
import { cardId, parseCards, type Card } from "../src/lib/poker/cards";
import { seededRng } from "../src/lib/poker/deck";
import {
  advance, applyAction, createGame, getLegalActions, potTotal, startHand, winningsById, type SeatSetup,
} from "../src/lib/poker/engine";
import { computePots } from "../src/lib/poker/pots";
import type { GameState } from "../src/lib/poker/types";

const cfg = { smallBlind: 50, bigBlind: 100 };

function seats(stacks: number[]): SeatSetup[] {
  return stacks.map((stack, i) => ({ id: `p${i}`, name: `P${i}`, isHuman: i === 0, stack }));
}

/** Força o próximo botão num assento: startHand move o botão uma posição. */
function gameWithDealer(stacks: number[], dealer: number): GameState {
  const g = createGame(cfg, seats(stacks));
  g.dealer = (dealer - 1 + stacks.length) % stacks.length;
  return g;
}

/** Substitui cartas privadas e o board que será distribuído (com queimas). */
function rig(state: GameState, holes: Record<number, string>, board: string) {
  const b = parseCards(board);
  const used = [...Object.values(holes).flatMap((h) => parseCards(h)), ...b].map(cardId);
  for (const [seat, h] of Object.entries(holes)) state.players[Number(seat)].hole = parseCards(h);
  const filler = state.deck.filter((c) => !used.includes(cardId(c)));
  // draw() usa pop(): ordem de saída = burn, flop x3, burn, turn, burn, river.
  const order: Card[] = [filler[0], b[0], b[1], b[2], filler[1], b[3], filler[2], b[4]];
  state.deck = [...filler.slice(3), ...order.reverse()];
}

function runToEnd(s: GameState, act: (s: GameState) => GameState = (x) => {
  const l = getLegalActions(x);
  return applyAction(x, l.canCheck ? { type: "check" } : { type: "call" });
}): GameState {
  let guard = 0;
  while (s.stage !== "handOver") {
    s = s.stage === "betting" ? act(s) : advance(s);
    if (++guard > 500) throw new Error("loop infinito");
  }
  return s;
}

const total = (s: GameState) => s.players.reduce((a, p) => a + p.stack, 0);

test("6 jogadores: blinds, primeiro a agir e opção do big blind", () => {
  let s = startHand(gameWithDealer([1000, 1000, 1000, 1000, 1000, 1000], 0), seededRng(1));
  assert.equal(s.dealer, 0);
  assert.equal(s.sbIndex, 1);
  assert.equal(s.bbIndex, 2);
  assert.equal(s.players[1].bet, 50);
  assert.equal(s.players[2].bet, 100);
  assert.equal(s.currentPlayer, 3, "UTG age primeiro");
  for (const seat of [3, 4, 5, 0, 1]) {
    assert.equal(s.currentPlayer, seat);
    s = applyAction(s, { type: "call" });
  }
  assert.equal(s.stage, "betting");
  assert.equal(s.currentPlayer, 2, "BB tem a opção");
  assert.ok(getLegalActions(s).canCheck);
  s = applyAction(s, { type: "check" });
  assert.equal(s.stage, "streetEnd");
  s = advance(s);
  assert.equal(s.street, "flop");
  assert.equal(s.community.length, 3);
  assert.equal(s.currentPlayer, 1, "pós-flop começa pelo small blind");
  assert.equal(potTotal(s), 600);
});

test("heads-up: botão paga SB e age primeiro no pré-flop; BB age primeiro depois", () => {
  let s = startHand(gameWithDealer([1000, 1000], 0), seededRng(2));
  assert.equal(s.sbIndex, 0);
  assert.equal(s.bbIndex, 1);
  assert.equal(s.currentPlayer, 0);
  s = applyAction(s, { type: "call" });
  assert.equal(s.currentPlayer, 1);
  s = applyAction(s, { type: "check" });
  s = advance(s);
  assert.equal(s.currentPlayer, 1);
});

test("botão gira entre as mãos e pula quem está sem fichas", () => {
  let s = gameWithDealer([1000, 0, 1000, 1000], 0);
  s = startHand(s, seededRng(3));
  assert.equal(s.dealer, 0);
  assert.equal(s.sbIndex, 2, "assento 1 sem fichas é pulado");
  assert.equal(s.players[1].hole.length, 0);
  s = runToEnd(s);
  s = startHand(s, seededRng(4));
  assert.equal(s.dealer, 2);
});

test("distribuição: 52 cartas únicas, 2 por jogador, 5 no board", () => {
  for (let seed = 0; seed < 200; seed++) {
    let s = startHand(gameWithDealer([1000, 1000, 1000, 1000, 1000, 1000], 0), seededRng(seed));
    s = runToEnd(s);
    const all = [...s.players.flatMap((p) => p.hole), ...s.community, ...s.deck].map(cardId);
    assert.equal(s.community.length, 5);
    for (const p of s.players) assert.equal(p.hole.length, 2);
    // 12 privadas + 5 board + 3 queimadas + 32 restantes = 52
    assert.equal(all.length + 3, 52);
    assert.equal(new Set(all).size, all.length);
  }
});

test("todos desistem: big blind leva e aposta não paga volta", () => {
  let s = startHand(gameWithDealer([1000, 1000, 1000], 0), seededRng(5));
  s = applyAction(s, { type: "raise", to: 300 }); // botão
  s = applyAction(s, { type: "fold" }); // SB
  s = applyAction(s, { type: "fold" }); // BB
  assert.equal(s.stage, "streetEnd");
  s = advance(s);
  assert.equal(s.stage, "handOver");
  assert.equal(s.outcome?.showdown, false);
  assert.deepEqual(s.players.map((p) => p.stack), [1150, 950, 900]);
});

test("aumento mínimo e aposta mínima", () => {
  let s = startHand(gameWithDealer([5000, 5000, 5000], 0), seededRng(6));
  let l = getLegalActions(s);
  assert.equal(l.minRaiseTo, 200);
  assert.throws(() => applyAction(s, { type: "raise", to: 150 }));
  s = applyAction(s, { type: "raise", to: 400 }); // aumento de 300
  l = getLegalActions(s);
  assert.equal(l.minRaiseTo, 700, "próximo aumento precisa ser de pelo menos 300");
  s = applyAction(s, { type: "call" });
  s = applyAction(s, { type: "call" });
  s = advance(s);
  l = getLegalActions(s);
  assert.ok(l.isBet);
  assert.equal(l.minRaiseTo, 100, "aposta mínima pós-flop = big blind");
});

test("all-in menor que o aumento mínimo não reabre a ação para quem já agiu", () => {
  // P0 botão, P1 SB, P2 BB (stack curto)
  let s = startHand(gameWithDealer([5000, 5000, 5000], 0), seededRng(7));
  s = applyAction(s, { type: "call" });
  s = applyAction(s, { type: "call" });
  s = applyAction(s, { type: "check" });
  s = advance(s);
  // Flop: SB aposta 1000; BB (stack ajustado) vai all-in para 1100, aumento de só 100.
  s.players[2].stack = 1100;
  s = applyAction(s, { type: "raise", to: 1000 }); // SB aposta
  s = applyAction(s, { type: "allin" }); // BB all-in para 1100 (aumento de só 100)
  assert.equal(s.currentBet, 1100);
  assert.equal(s.currentPlayer, 0);
  const l0 = getLegalActions(s);
  assert.ok(l0.canRaise, "botão ainda não agiu e pode aumentar");
  s = applyAction(s, { type: "call" });
  assert.equal(s.currentPlayer, 1);
  const l1 = getLegalActions(s);
  assert.ok(!l1.canRaise, "SB já agiu: só pode pagar ou desistir");
  assert.ok(l1.canCall);
  assert.equal(l1.callAmount, 100);
});

test("potes laterais com três all-ins de tamanhos diferentes", () => {
  // P0 botão 1000, P1 SB 300, P2 BB 100 — todos all-in
  let s = startHand(gameWithDealer([1000, 300, 100], 0), seededRng(8));
  // P2 (100) tem a melhor mão, P1 a segunda, P0 a pior
  rig(s, { 0: "2c 7d", 1: "Kh Kd", 2: "Ac As" }, "Ad 9s 5h 3c Jd");
  s = applyAction(s, { type: "allin" });
  s = applyAction(s, { type: "allin" });
  assert.equal(s.stage, "streetEnd", "BB já está all-in com o blind");
  s = runToEnd(s);
  const pots = s.outcome!.pots;
  assert.deepEqual(pots.map((p) => p.amount), [300, 400]);
  assert.deepEqual(pots[0].eligible.sort(), ["p0", "p1", "p2"]);
  assert.deepEqual(pots[1].eligible.sort(), ["p0", "p1"]);
  // P0 recebe 700 de volta (aposta não paga), P2 leva principal, P1 lateral.
  assert.deepEqual(s.players.map((p) => p.stack), [700, 400, 300]);
  assert.equal(total(s), 1400);
});

test("pote dividido com ficha ímpar vai para o primeiro à esquerda do botão", () => {
  let s = startHand(gameWithDealer([1000, 1000, 1000], 0), seededRng(9));
  rig(s, { 0: "2c 3d", 1: "4h 5h", 2: "6c 7c" }, "As Ks Qd Jc Th");
  s = applyAction(s, { type: "raise", to: 201 }); // botão
  s = applyAction(s, { type: "call" }); // SB
  s = applyAction(s, { type: "fold" }); // BB desiste (100 mortos)
  s = runToEnd(s);
  // Pote: 201 + 201 + 100 = 502 dividido entre P0 e P1: 251 cada
  assert.equal(s.outcome!.totalPot, 502);
  const w = winningsById(s);
  assert.equal(w.p0, 251);
  assert.equal(w.p1, 251);
  // Pote ímpar (603) dividido entre dois: o SB, primeiro à esquerda do botão, fica com a ficha extra.
  let t = startHand(gameWithDealer([1000, 1000, 1000], 0), seededRng(10));
  rig(t, { 0: "Th 3d", 1: "Tc 5h", 2: "6c 7c" }, "As Ks Qd Jc 2h");
  t = applyAction(t, { type: "raise", to: 201 });
  t = applyAction(t, { type: "call" });
  t = applyAction(t, { type: "call" });
  t = runToEnd(t);
  const w2 = winningsById(t);
  assert.equal(w2.p1, 302);
  assert.equal(w2.p0, 301);
  assert.equal(w2.p2, undefined);
});

test("computePots ignora jogadores fora da mão e soma fichas de quem desistiu", () => {
  const base = { hole: [], bet: 0, allIn: false, hasActed: false, raiseLocked: false, lastAction: null, isHuman: false, startStack: 0, stack: 0 };
  const pots = computePots([
    { ...base, id: "a", name: "a", contributed: 500, folded: true, inHand: true },
    { ...base, id: "b", name: "b", contributed: 200, folded: false, inHand: true },
    { ...base, id: "c", name: "c", contributed: 800, folded: false, inHand: true },
    { ...base, id: "d", name: "d", contributed: 0, folded: false, inHand: false },
  ]);
  assert.deepEqual(pots, [
    { amount: 600, eligible: ["b", "c"] },
    { amount: 900, eligible: ["c"] },
  ]);
});
