export type Suit = "s" | "h" | "d" | "c";
/** 2..14, onde 11=J, 12=Q, 13=K, 14=A. */
export type Rank = 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14;

export interface Card {
  rank: Rank;
  suit: Suit;
}

export const SUITS: Suit[] = ["s", "h", "d", "c"];
export const RANKS: Rank[] = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14];

export const SUIT_SYMBOL: Record<Suit, string> = { s: "♠", h: "♥", d: "♦", c: "♣" };
export const SUIT_NAME: Record<Suit, string> = { s: "Espadas", h: "Copas", d: "Ouros", c: "Paus" };

const RANK_LABEL: Record<number, string> = { 10: "10", 11: "J", 12: "Q", 13: "K", 14: "A" };

export function rankLabel(rank: number): string {
  return RANK_LABEL[rank] ?? String(rank);
}

export function isRed(suit: Suit): boolean {
  return suit === "h" || suit === "d";
}

export function cardId(card: Card): string {
  return `${rankLabel(card.rank)}${card.suit}`;
}

export function sameCard(a: Card, b: Card): boolean {
  return a.rank === b.rank && a.suit === b.suit;
}

/** Converte "As", "Td", "10h", "9c"... em carta. Útil em testes. */
export function parseCard(text: string): Card {
  const suit = text.slice(-1) as Suit;
  const r = text.slice(0, -1).toUpperCase();
  const map: Record<string, Rank> = { A: 14, K: 13, Q: 12, J: 11, T: 10, "10": 10 };
  const rank = (map[r] ?? Number(r)) as Rank;
  if (!SUITS.includes(suit) || !RANKS.includes(rank)) throw new Error(`Carta inválida: ${text}`);
  return { rank, suit };
}

export function parseCards(text: string): Card[] {
  return text.trim().split(/\s+/).filter(Boolean).map(parseCard);
}
