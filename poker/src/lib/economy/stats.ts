import { HandCategory } from "../poker/handEvaluator";

export interface Stats {
  version: 1;
  handsPlayed: number;
  handsWon: number;
  /** Soma dos lucros das mãos com resultado positivo. */
  chipsWon: number;
  /** Soma das perdas (valor positivo) das mãos com resultado negativo. */
  chipsLost: number;
  /** Maior pote recebido numa única mão. */
  biggestPot: number;
  currentStreak: number;
  bestStreak: number;
  showdownsWon: number;
  bestHand: HandCategory | null;
}

export interface HandRecord {
  net: number;
  /** Quanto o jogador recebeu dos potes nesta mão. */
  received: number;
  wentToShowdown: boolean;
  category: HandCategory | null;
}

export function initialStats(): Stats {
  return {
    version: 1, handsPlayed: 0, handsWon: 0, chipsWon: 0, chipsLost: 0, biggestPot: 0,
    currentStreak: 0, bestStreak: 0, showdownsWon: 0, bestHand: null,
  };
}

export function sanitizeStats(raw: unknown): Stats {
  const s = raw as Partial<Stats> | null;
  if (!s || s.version !== 1) return initialStats();
  const base = initialStats();
  const num = (v: unknown, d: number) => (typeof v === "number" && Number.isFinite(v) ? v : d);
  return {
    version: 1,
    handsPlayed: num(s.handsPlayed, base.handsPlayed),
    handsWon: num(s.handsWon, base.handsWon),
    chipsWon: num(s.chipsWon, base.chipsWon),
    chipsLost: num(s.chipsLost, base.chipsLost),
    biggestPot: num(s.biggestPot, base.biggestPot),
    currentStreak: num(s.currentStreak, base.currentStreak),
    bestStreak: num(s.bestStreak, base.bestStreak),
    showdownsWon: num(s.showdownsWon, base.showdownsWon),
    bestHand: typeof s.bestHand === "number" ? s.bestHand : null,
  };
}

/** Uma mão conta como vencida quando o jogador recebe fichas de algum pote. */
export function recordHand(s: Stats, r: HandRecord): Stats {
  const won = r.received > 0;
  const currentStreak = won ? s.currentStreak + 1 : 0;
  return {
    ...s,
    handsPlayed: s.handsPlayed + 1,
    handsWon: s.handsWon + (won ? 1 : 0),
    chipsWon: s.chipsWon + Math.max(0, r.net),
    chipsLost: s.chipsLost + Math.max(0, -r.net),
    biggestPot: Math.max(s.biggestPot, r.received),
    currentStreak,
    bestStreak: Math.max(s.bestStreak, currentStreak),
    showdownsWon: s.showdownsWon + (won && r.wentToShowdown ? 1 : 0),
    bestHand: r.category !== null && won && (s.bestHand === null || r.category > s.bestHand) ? r.category : s.bestHand,
  };
}
