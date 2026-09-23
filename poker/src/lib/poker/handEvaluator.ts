import { rankLabel, type Card } from "./cards";

export enum HandCategory {
  HighCard = 0,
  OnePair = 1,
  TwoPair = 2,
  ThreeOfAKind = 3,
  Straight = 4,
  Flush = 5,
  FullHouse = 6,
  FourOfAKind = 7,
  StraightFlush = 8,
  RoyalFlush = 9,
}

export const CATEGORY_NAME: Record<HandCategory, string> = {
  [HandCategory.HighCard]: "Carta Alta",
  [HandCategory.OnePair]: "Um Par",
  [HandCategory.TwoPair]: "Dois Pares",
  [HandCategory.ThreeOfAKind]: "Trinca",
  [HandCategory.Straight]: "Sequência",
  [HandCategory.Flush]: "Flush",
  [HandCategory.FullHouse]: "Full House",
  [HandCategory.FourOfAKind]: "Quadra",
  [HandCategory.StraightFlush]: "Straight Flush",
  [HandCategory.RoyalFlush]: "Royal Flush",
};

export interface HandResult {
  category: HandCategory;
  /** Valores de desempate em ordem de importância (ex.: [par, kicker1, kicker2, kicker3]). */
  tiebreak: number[];
  /** Número único e comparável: maior = mão melhor. Mãos iguais têm o mesmo score. */
  score: number;
  /** As 5 cartas que formam a mão. */
  cards: Card[];
  name: string;
  description: string;
}

const PLURAL: Record<number, string> = {
  14: "Ases", 13: "Reis", 12: "Damas", 11: "Valetes", 10: "Dez", 9: "Noves", 8: "Oitos",
  7: "Setes", 6: "Seis", 5: "Cincos", 4: "Quatros", 3: "Três", 2: "Dois",
};

export function pluralRank(rank: number): string {
  return PLURAL[rank];
}

function makeScore(category: HandCategory, tiebreak: number[]): number {
  // Base 15 garante que qualquer desempate nunca ultrapasse a categoria seguinte.
  let score = category;
  for (let i = 0; i < 5; i++) score = score * 15 + (tiebreak[i] ?? 0);
  return score;
}

/** Procura a maior sequência; o Ás também vale 1 (A-2-3-4-5, a "roda"). */
function findStraight(cards: Card[]): Card[] | null {
  const byRank = new Map<number, Card>();
  for (const c of cards) if (!byRank.has(c.rank)) byRank.set(c.rank, c);
  const ace = byRank.get(14);
  if (ace) byRank.set(1, ace);
  for (let high = 14; high >= 5; high--) {
    const run: Card[] = [];
    for (let r = high; r > high - 5; r--) {
      const c = byRank.get(r);
      if (!c) break;
      run.push(c);
    }
    if (run.length === 5) return run;
  }
  return null;
}

/** A sequência vem ordenada do topo; na roda (5-4-3-2-A) o topo é o 5. */
function straightHigh(run: Card[]): number {
  return run[0].rank;
}

function describe(category: HandCategory, tb: number[]): string {
  const P = (r: number) => PLURAL[r];
  switch (category) {
    case HandCategory.RoyalFlush: return "Royal Flush";
    case HandCategory.StraightFlush: return `Straight Flush até o ${rankLabel(tb[0])}`;
    case HandCategory.FourOfAKind: return `Quadra de ${P(tb[0])}`;
    case HandCategory.FullHouse: return `Full House: ${P(tb[0])} com ${P(tb[1])}`;
    case HandCategory.Flush: return `Flush com ${rankLabel(tb[0])} alto`;
    case HandCategory.Straight: return `Sequência até o ${rankLabel(tb[0])}`;
    case HandCategory.ThreeOfAKind: return `Trinca de ${P(tb[0])}`;
    case HandCategory.TwoPair: return `Dois Pares: ${P(tb[0])} e ${P(tb[1])}`;
    case HandCategory.OnePair: return `Par de ${P(tb[0])}`;
    default: return `Carta Alta: ${rankLabel(tb[0])}`;
  }
}

function result(category: HandCategory, tiebreak: number[], cards: Card[]): HandResult {
  return {
    category,
    tiebreak,
    score: makeScore(category, tiebreak),
    cards,
    name: CATEGORY_NAME[category],
    description: describe(category, tiebreak),
  };
}

/**
 * Avalia a melhor mão de 5 cartas possível entre 5 a 7 cartas
 * (2 cartas privadas + cartas comunitárias).
 */
export function evaluateHand(input: Card[]): HandResult {
  if (input.length < 5 || input.length > 7) {
    throw new Error(`evaluateHand espera 5 a 7 cartas, recebeu ${input.length}`);
  }
  const cards = input.slice().sort((a, b) => b.rank - a.rank);

  const bySuit = new Map<string, Card[]>();
  for (const c of cards) {
    const list = bySuit.get(c.suit) ?? [];
    list.push(c);
    bySuit.set(c.suit, list);
  }
  let flushCards: Card[] | null = null;
  for (const list of bySuit.values()) if (list.length >= 5) flushCards = list;

  if (flushCards) {
    const sf = findStraight(flushCards);
    if (sf) {
      const high = straightHigh(sf);
      return result(high === 14 ? HandCategory.RoyalFlush : HandCategory.StraightFlush, [high], sf);
    }
  }

  // Grupos por valor, ordenados por quantidade e depois por valor.
  const groupMap = new Map<number, Card[]>();
  for (const c of cards) {
    const g = groupMap.get(c.rank) ?? [];
    g.push(c);
    groupMap.set(c.rank, g);
  }
  const groups = [...groupMap.values()].sort((a, b) => b.length - a.length || b[0].rank - a[0].rank);
  const kickers = (exclude: Card[], n: number) => cards.filter((c) => !exclude.includes(c)).slice(0, n);

  if (groups[0].length === 4) {
    const quad = groups[0];
    const k = kickers(quad, 1);
    return result(HandCategory.FourOfAKind, [quad[0].rank, k[0].rank], [...quad, ...k]);
  }

  if (groups[0].length === 3) {
    const pairPart = groups.slice(1).find((g) => g.length >= 2);
    if (pairPart) {
      const trips = groups[0];
      return result(HandCategory.FullHouse, [trips[0].rank, pairPart[0].rank], [...trips, ...pairPart.slice(0, 2)]);
    }
  }

  if (flushCards) {
    const five = flushCards.slice(0, 5);
    return result(HandCategory.Flush, five.map((c) => c.rank), five);
  }

  const straight = findStraight(cards);
  if (straight) return result(HandCategory.Straight, [straightHigh(straight)], straight);

  if (groups[0].length === 3) {
    const trips = groups[0];
    const k = kickers(trips, 2);
    return result(HandCategory.ThreeOfAKind, [trips[0].rank, ...k.map((c) => c.rank)], [...trips, ...k]);
  }

  if (groups[0].length === 2 && groups[1]?.length === 2) {
    const used = [...groups[0], ...groups[1]];
    const k = kickers(used, 1);
    return result(HandCategory.TwoPair, [groups[0][0].rank, groups[1][0].rank, k[0].rank], [...used, ...k]);
  }

  if (groups[0].length === 2) {
    const pair = groups[0];
    const k = kickers(pair, 3);
    return result(HandCategory.OnePair, [pair[0].rank, ...k.map((c) => c.rank)], [...pair, ...k]);
  }

  const five = cards.slice(0, 5);
  return result(HandCategory.HighCard, five.map((c) => c.rank), five);
}

/** >0 se a for melhor, <0 se b for melhor, 0 em empate exato. */
export function compareHands(a: HandResult, b: HandResult): number {
  return a.score - b.score;
}
