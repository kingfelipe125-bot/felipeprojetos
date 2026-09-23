import { RANKS, SUITS, type Card } from "./cards";

/** Retorna um número em [0, 1). Injetável para testes determinísticos. */
export type Rng = () => number;

export function createDeck(): Card[] {
  const deck: Card[] = [];
  for (const suit of SUITS) for (const rank of RANKS) deck.push({ rank, suit });
  return deck;
}

/** RNG criptográfico quando disponível (navegador moderno / Node 19+). */
export const defaultRng: Rng = () => {
  const c = (globalThis as { crypto?: Crypto }).crypto;
  if (c?.getRandomValues) {
    const buf = new Uint32Array(1);
    c.getRandomValues(buf);
    return buf[0] / 0x100000000;
  }
  return Math.random();
};

/** Fisher–Yates: todas as permutações são igualmente prováveis. */
export function shuffle<T>(items: T[], rng: Rng = defaultRng): T[] {
  const arr = items.slice();
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function shuffledDeck(rng: Rng = defaultRng): Card[] {
  return shuffle(createDeck(), rng);
}

/** Gerador pseudoaleatório com semente (mulberry32), para testes reproduzíveis. */
export function seededRng(seed: number): Rng {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
