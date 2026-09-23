import { test } from "node:test";
import assert from "node:assert/strict";
import { parseCards, type Card } from "../src/lib/poker/cards";
import { createDeck, seededRng, shuffle } from "../src/lib/poker/deck";
import { evaluateHand, HandCategory } from "../src/lib/poker/handEvaluator";

const ev = (s: string) => evaluateHand(parseCards(s));

test("reconhece as 10 categorias", () => {
  const cases: [string, HandCategory][] = [
    ["As Ks Qs Js Ts 2d 3c", HandCategory.RoyalFlush],
    ["9h 8h 7h 6h 5h Ad Kd", HandCategory.StraightFlush],
    ["7c 7d 7h 7s Kd 2c 3h", HandCategory.FourOfAKind],
    ["Qc Qd Qh 4s 4d 2c 9h", HandCategory.FullHouse],
    ["Ad 9d 7d 4d 2d Kc Qh", HandCategory.Flush],
    ["9c 8d 7h 6s 5d Kc 2h", HandCategory.Straight],
    ["8c 8d 8h Ks 3d 2c 9h", HandCategory.ThreeOfAKind],
    ["Jc Jd 4h 4s Ad 2c 9h", HandCategory.TwoPair],
    ["Tc Td 4h 7s Ad 2c 9h", HandCategory.OnePair],
    ["Ac Qd 4h 7s 9d 2c Jh", HandCategory.HighCard],
  ];
  for (const [cards, cat] of cases) assert.equal(ev(cards).category, cat, cards);
});

test("roda A-2-3-4-5 é a menor sequência", () => {
  const wheel = ev("Ac 2d 3h 4s 5d Kc 9h");
  assert.equal(wheel.category, HandCategory.Straight);
  assert.deepEqual(wheel.tiebreak.slice(0, 1), [5]);
  assert.ok(ev("2c 3d 4h 5s 6d Kc 9h").score > wheel.score);
  // Ás alto e Ás baixo não "dão a volta" (Q-K-A-2-3 não é sequência).
  assert.notEqual(ev("Qc Kd Ah 2s 3d 8c 9h").category, HandCategory.Straight);
});

test("straight flush na roda e sequência maior preferida", () => {
  const sf = ev("Ah 2h 3h 4h 5h Kd Qc");
  assert.equal(sf.category, HandCategory.StraightFlush);
  assert.equal(sf.tiebreak[0], 5);
  assert.equal(ev("5c 6d 7h 8s 9d Tc Jh").tiebreak[0], 11);
});

test("flush + sequência separados não formam straight flush", () => {
  const h = ev("2h 5h 9h Jh Kh 3c 4d");
  assert.equal(h.category, HandCategory.Flush);
  const mixed = ev("5h 6h 7h 8h 9c Ah 2d");
  assert.equal(mixed.category, HandCategory.Flush, "sequência 5-9 não é toda de copas");
});

test("desempates por kicker", () => {
  assert.ok(ev("Ac Ad Kh 7s 5d 3c 2h").score > ev("As Ah Qh 7c 5s 3d 2d").score);
  assert.ok(ev("Kc Kd 9h 9s 8d 3c 2h").score > ev("Kh Ks 9c 9d 7d 3s 2d").score);
  assert.ok(ev("Ac Kd 9h 7s 5d 3c 2h").score > ev("As Kh 9c 7c 4s 3d 2d").score);
  assert.ok(ev("7c 7d 7h 7s Ad 2c 3h").score > ev("7c 7d 7h 7s Kd Qc Jh").score);
  assert.ok(ev("Qc Qd Qh 4s 4d").score < ev("Qc Qd Qh 5s 5d").score);
});

test("full house com duas trincas usa a maior trinca e par da menor", () => {
  const h = ev("9c 9d 9h 4s 4d 4c Ah");
  assert.equal(h.category, HandCategory.FullHouse);
  assert.deepEqual(h.tiebreak.slice(0, 2), [9, 4]);
});

test("três pares: usa os dois maiores e o melhor kicker restante", () => {
  const h = ev("Ac Ad 8h 8s 5d 5c 7h");
  assert.equal(h.category, HandCategory.TwoPair);
  assert.deepEqual(h.tiebreak.slice(0, 3), [14, 8, 7]);
  const h2 = ev("Ac Ad 8h 8s Kd Kc 2h");
  assert.deepEqual(h2.tiebreak.slice(0, 3), [14, 13, 8]);
});

test("empate exato quando o board joga", () => {
  const board = "As Ks Qd Jc Th";
  assert.equal(ev(`2c 3d ${board}`).score, ev(`4h 5h ${board}`).score);
  assert.equal(ev(`2c 3d ${board}`).category, HandCategory.Straight);
});

test("melhor mão sempre tem 5 cartas distintas do conjunto", () => {
  const rng = seededRng(7);
  for (let i = 0; i < 2000; i++) {
    const cards = shuffle(createDeck(), rng).slice(0, 7);
    const h = evaluateHand(cards);
    assert.equal(h.cards.length, 5);
    assert.equal(new Set(h.cards).size, 5);
    for (const c of h.cards) assert.ok(cards.includes(c));
    // A mão escolhida, avaliada sozinha, deve dar o mesmo score.
    assert.equal(evaluateHand(h.cards).score, h.score);
  }
});

/** Referência: força bruta nas 21 combinações de 5 cartas. */
function bruteBest(cards: Card[]): number {
  let best = -1;
  for (let a = 0; a < 7; a++)
    for (let b = a + 1; b < 7; b++) {
      const five = cards.filter((_, i) => i !== a && i !== b);
      best = Math.max(best, evaluateHand(five).score);
    }
  return best;
}

test("avaliação de 7 cartas = melhor das 21 combinações (10.000 mãos)", () => {
  const rng = seededRng(42);
  for (let i = 0; i < 10000; i++) {
    const cards = shuffle(createDeck(), rng).slice(0, 7);
    assert.equal(evaluateHand(cards).score, bruteBest(cards), cards.map((c) => `${c.rank}${c.suit}`).join(" "));
  }
});

test("frequências de categorias em 7 cartas batem com as probabilidades conhecidas", () => {
  // Probabilidades teóricas (7 cartas): par 43.8%, dois pares 23.5%, carta alta 17.4%, trinca 4.83%,
  // sequência 4.62%, flush 3.03%, full house 2.60%.
  const rng = seededRng(1234);
  const N = 60000;
  const counts = new Array(10).fill(0);
  for (let i = 0; i < N; i++) counts[evaluateHand(shuffle(createDeck(), rng).slice(0, 7)).category]++;
  const pct = (c: HandCategory) => (counts[c] / N) * 100;
  const near = (v: number, target: number, tol: number) => assert.ok(Math.abs(v - target) < tol, `${v} vs ${target}`);
  near(pct(HandCategory.OnePair), 43.8, 1);
  near(pct(HandCategory.TwoPair), 23.5, 1);
  near(pct(HandCategory.HighCard), 17.4, 1);
  near(pct(HandCategory.ThreeOfAKind), 4.83, 0.5);
  near(pct(HandCategory.Straight), 4.62, 0.5);
  near(pct(HandCategory.Flush), 3.03, 0.4);
  near(pct(HandCategory.FullHouse), 2.6, 0.4);
});
