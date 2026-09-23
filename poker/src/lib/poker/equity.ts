import { sameCard, type Card } from "./cards";
import { createDeck, defaultRng, type Rng } from "./deck";
import { evaluateHand } from "./handEvaluator";

/**
 * Estima por simulação (Monte Carlo) a fração do pote que `hole` ganha contra
 * `opponents` mãos aleatórias, completando o board. Empates contam parcialmente.
 */
export function estimateEquity(
  hole: Card[],
  community: Card[],
  opponents: number,
  iterations = 300,
  rng: Rng = defaultRng,
): number {
  if (opponents <= 0) return 1;
  const known = [...hole, ...community];
  const pool = createDeck().filter((c) => !known.some((k) => sameCard(k, c)));
  const boardMissing = 5 - community.length;
  const needed = boardMissing + opponents * 2;

  let total = 0;
  for (let it = 0; it < iterations; it++) {
    // Fisher–Yates parcial: só embaralha as primeiras `needed` posições.
    for (let i = 0; i < needed; i++) {
      const j = i + Math.floor(rng() * (pool.length - i));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    const board = community.concat(pool.slice(0, boardMissing));
    const hero = evaluateHand([...hole, ...board]).score;
    let best = true;
    let ties = 0;
    for (let o = 0; o < opponents; o++) {
      const base = boardMissing + o * 2;
      const s = evaluateHand([pool[base], pool[base + 1], ...board]).score;
      if (s > hero) { best = false; break; }
      if (s === hero) ties++;
    }
    if (best) total += 1 / (ties + 1);
  }
  return total / iterations;
}

/**
 * Fórmula de Chen (Bill Chen) para força pré-flop. Retorna aprox. -1 a 20
 * (AA = 20, 72o ≈ -1).
 */
export function chenScore(hole: Card[]): number {
  const [a, b] = hole[0].rank >= hole[1].rank ? hole : [hole[1], hole[0]];
  const points = (r: number) => (r === 14 ? 10 : r === 13 ? 8 : r === 12 ? 7 : r === 11 ? 6 : r / 2);
  let score = points(a.rank);
  if (a.rank === b.rank) return Math.max(5, score * 2);
  if (a.suit === b.suit) score += 2;
  const gap = a.rank - b.rank - 1;
  score -= gap === 0 ? 0 : gap === 1 ? 1 : gap === 2 ? 2 : gap === 3 ? 4 : 5;
  if (gap <= 1 && a.rank < 12) score += 1;
  return Math.ceil(score);
}
