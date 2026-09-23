import { test } from "node:test";
import assert from "node:assert/strict";
import { cardId } from "../src/lib/poker/cards";
import { seededRng, type Rng } from "../src/lib/poker/deck";
import { decideBotAction } from "../src/lib/poker/ai";
import {
  advance, applyAction, canStartHand, createGame, getLegalActions, startHand,
} from "../src/lib/poker/engine";
import { BOT_ROSTER } from "../src/lib/poker/personalities";
import type { GameState, PlayerAction } from "../src/lib/poker/types";

function randomAction(s: GameState, rng: Rng): PlayerAction {
  const l = getLegalActions(s);
  const r = rng();
  if (l.canAllIn && r < 0.08) return { type: "allin" };
  if (l.canRaise && r < 0.3) {
    const to = l.minRaiseTo + Math.floor(rng() * (l.maxRaiseTo - l.minRaiseTo + 1));
    return { type: "raise", to };
  }
  if (r < 0.45 && l.canCall) return { type: "fold" };
  return l.canCheck ? { type: "check" } : { type: "call" };
}

function checkInvariants(s: GameState, expectedTotal: number) {
  const chips = s.players.reduce((a, p) => a + p.stack + (s.stage === "handOver" ? 0 : p.contributed), 0);
  assert.equal(chips, expectedTotal, `conservação de fichas na mão ${s.handNumber}`);
  for (const p of s.players) {
    assert.ok(p.stack >= 0, "stack negativo");
    assert.ok(Number.isInteger(p.stack), "stack fracionado");
  }
  const cards = [...s.players.flatMap((p) => p.hole), ...s.community, ...s.deck].map(cardId);
  assert.equal(new Set(cards).size, cards.length, "carta duplicada");
  if (s.stage === "betting") {
    const p = s.players[s.currentPlayer];
    assert.ok(p.inHand && !p.folded && !p.allIn, "vez de um jogador que não pode agir");
  }
}

function play(hands: number, decide: (s: GameState, rng: Rng) => PlayerAction, seed: number, rebuy: boolean) {
  const rng = seededRng(seed);
  const stacks = [10000, 10000, 10000, 10000, 10000, 10000];
  let s = createGame({ smallBlind: 50, bigBlind: 100 }, stacks.map((stack, i) => ({
    id: `p${i}`, name: `P${i}`, isHuman: false, personality: BOT_ROSTER[i % 5].personality, stack,
  })));
  let bank = 60000;
  let played = 0;
  for (let h = 0; h < hands; h++) {
    if (rebuy) for (const p of s.players) if (p.stack === 0) { p.stack = 10000; bank += 10000; }
    if (!canStartHand(s)) break;
    s = startHand(s, rng);
    played++;
    let guard = 0;
    while (s.stage !== "handOver") {
      checkInvariants(s, bank);
      s = s.stage === "betting" ? applyAction(s, decide(s, rng)) : advance(s);
      assert.ok(++guard < 300, "mão não termina");
    }
    checkInvariants(s, bank);
    const awarded = s.outcome!.awards.reduce((a, w) => a + w.amount, 0);
    assert.equal(awarded, s.outcome!.totalPot, "todo o pote foi distribuído");
  }
  return { state: s, played };
}

test("3.000 mãos com ações aleatórias legais: fichas conservadas, sem cartas repetidas", () => {
  const { played } = play(3000, randomAction, 99, true);
  assert.equal(played, 3000);
});

test("sem recarga: o jogo segue até restar um jogador", () => {
  const { state } = play(5000, randomAction, 5, false);
  assert.equal(state.players.filter((p) => p.stack > 0).length, 1);
  assert.equal(state.players.reduce((a, p) => a + p.stack, 0), 60000);
});

test("300 mãos só com bots: decisões sempre legais", () => {
  const { played } = play(300, (s, rng) => decideBotAction(s, s.currentPlayer, rng), 2024, true);
  assert.equal(played, 300);
});
