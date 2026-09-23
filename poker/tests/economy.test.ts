import { test } from "node:test";
import assert from "node:assert/strict";
import {
  addToSeat, buyIn, canClaimFree, claimFree, initialWallet, leaveTable, recordHandResult, recoverSeat,
  sanitizeWallet, totalCoins, updateSeatStack, FREE_COINS_AMOUNT, STARTING_COINS,
} from "../src/lib/economy/wallet";
import { initialStats, recordHand, sanitizeStats } from "../src/lib/economy/stats";
import { HandCategory } from "../src/lib/poker/handEvaluator";

test("carteira começa com 10.000 moedas virtuais", () => {
  const w = initialWallet();
  assert.equal(w.balance, STARTING_COINS);
  assert.equal(w.history[0].kind, "welcome");
});

test("buy-in, atualização do stack e saída preservam o total", () => {
  let w = initialWallet();
  w = buyIn(w, "classica", 4000);
  assert.equal(w.balance, 6000);
  assert.equal(totalCoins(w), 10000);
  assert.equal(buyIn(w, "classica", 100), w, "não senta duas vezes");
  w = updateSeatStack(w, 5500);
  w = leaveTable(w);
  assert.equal(w.balance, 11500);
  assert.equal(w.seat, null);
});

test("buy-in maior que o saldo é recusado", () => {
  const w = initialWallet();
  assert.equal(buyIn(w, "x", 20000), w);
  assert.equal(buyIn(w, "x", -5), w);
});

test("recuperação após fechar o navegador devolve fichas da mesa", () => {
  let w = buyIn(initialWallet(), "classica", 10000);
  w = updateSeatStack(w, 7300);
  const restored = recoverSeat(sanitizeWallet(JSON.parse(JSON.stringify(w))));
  assert.equal(restored.balance, 7300);
  assert.equal(restored.seat, null);
});

test("moedas grátis só quando o saldo está baixo", () => {
  let w = initialWallet();
  assert.ok(!canClaimFree(w));
  assert.equal(claimFree(w), w);
  w = buyIn(w, "t", 10000);
  w = updateSeatStack(w, 1500);
  assert.ok(canClaimFree(w));
  w = claimFree(w);
  assert.equal(w.balance, FREE_COINS_AMOUNT);
  assert.equal(w.history[0].kind, "bonus");
  w = addToSeat(w, 500);
  assert.equal(w.seat?.stack, 2000);
});

test("dados corrompidos no localStorage viram carteira nova", () => {
  assert.equal(sanitizeWallet(null).balance, STARTING_COINS);
  assert.equal(sanitizeWallet({ version: 1, balance: "abc" }).balance, STARTING_COINS);
  assert.equal(sanitizeWallet({ version: 1, balance: 12.7, history: [] }).balance, 12);
});

test("histórico ignora mãos sem ganho nem perda", () => {
  const w = initialWallet();
  assert.equal(recordHandResult(w, 0, "x"), w);
  assert.equal(recordHandResult(w, -200, "x").history[0].amount, -200);
});

test("estatísticas: vitórias, sequência, maior pote", () => {
  let s = initialStats();
  s = recordHand(s, { net: 300, received: 500, wentToShowdown: true, category: HandCategory.OnePair });
  s = recordHand(s, { net: 900, received: 1200, wentToShowdown: false, category: null });
  s = recordHand(s, { net: -100, received: 0, wentToShowdown: false, category: null });
  s = recordHand(s, { net: 50, received: 150, wentToShowdown: true, category: HandCategory.Flush });
  assert.equal(s.handsPlayed, 4);
  assert.equal(s.handsWon, 3);
  assert.equal(s.chipsWon, 1250);
  assert.equal(s.chipsLost, 100);
  assert.equal(s.biggestPot, 1200);
  assert.equal(s.bestStreak, 2);
  assert.equal(s.currentStreak, 1);
  assert.equal(s.showdownsWon, 2);
  assert.equal(s.bestHand, HandCategory.Flush);
  assert.deepEqual(sanitizeStats(JSON.parse(JSON.stringify(s))), s);
});
