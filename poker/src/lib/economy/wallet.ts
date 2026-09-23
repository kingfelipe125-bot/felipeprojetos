/**
 * Carteira de MOEDAS VIRTUAIS. Não existe (e não deve existir) nenhuma forma de
 * comprar, depositar, sacar ou converter estas moedas em dinheiro.
 */

export const STARTING_COINS = 10_000;
export const FREE_COINS_AMOUNT = 10_000;
/** Moedas grátis ficam disponíveis quando o total (carteira + mesa) cai abaixo disso. */
export const FREE_COINS_THRESHOLD = 2_000;
const MAX_HISTORY = 100;

export type HistoryKind = "welcome" | "bonus" | "hand";

export interface HistoryEntry {
  id: string;
  at: number;
  kind: HistoryKind;
  amount: number;
  note: string;
}

export interface Seat {
  tableId: string;
  stack: number;
}

export interface WalletState {
  version: 1;
  balance: number;
  /** Fichas atualmente na mesa (fora da carteira). */
  seat: Seat | null;
  history: HistoryEntry[];
  freeClaims: number;
}

function entry(kind: HistoryKind, amount: number, note: string): HistoryEntry {
  return { id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`, at: Date.now(), kind, amount, note };
}

function pushHistory(w: WalletState, e: HistoryEntry): WalletState {
  return { ...w, history: [e, ...w.history].slice(0, MAX_HISTORY) };
}

export function initialWallet(): WalletState {
  return {
    version: 1,
    balance: STARTING_COINS,
    seat: null,
    history: [entry("welcome", STARTING_COINS, "Moedas de boas-vindas")],
    freeClaims: 0,
  };
}

/** Garante um objeto válido mesmo com dados corrompidos/antigos no navegador. */
export function sanitizeWallet(raw: unknown): WalletState {
  const w = raw as Partial<WalletState> | null;
  if (!w || w.version !== 1 || typeof w.balance !== "number" || !Number.isFinite(w.balance)) return initialWallet();
  const seat = w.seat && typeof w.seat.stack === "number" && w.seat.stack >= 0 ? w.seat : null;
  return {
    version: 1,
    balance: Math.max(0, Math.floor(w.balance)),
    seat,
    history: Array.isArray(w.history) ? w.history.slice(0, MAX_HISTORY) : [],
    freeClaims: typeof w.freeClaims === "number" ? w.freeClaims : 0,
  };
}

/**
 * Se o navegador foi fechado com fichas na mesa, elas voltam para a carteira.
 * Fichas que já estavam no pote de uma mão em andamento são perdidas
 * (equivale a desistir da mão).
 */
export function recoverSeat(w: WalletState): WalletState {
  if (!w.seat) return w;
  return { ...w, balance: w.balance + w.seat.stack, seat: null };
}

export function totalCoins(w: WalletState): number {
  return w.balance + (w.seat?.stack ?? 0);
}

export function canClaimFree(w: WalletState): boolean {
  return totalCoins(w) < FREE_COINS_THRESHOLD;
}

export function claimFree(w: WalletState): WalletState {
  if (!canClaimFree(w)) return w;
  return pushHistory(
    { ...w, balance: w.balance + FREE_COINS_AMOUNT, freeClaims: w.freeClaims + 1 },
    entry("bonus", FREE_COINS_AMOUNT, "Moedas grátis"),
  );
}

export function buyIn(w: WalletState, tableId: string, amount: number): WalletState {
  const value = Math.floor(amount);
  if (w.seat || value <= 0 || value > w.balance) return w;
  return { ...w, balance: w.balance - value, seat: { tableId, stack: value } };
}

/** Recompra na mesma mesa (quando o jogador perdeu todas as fichas). */
export function addToSeat(w: WalletState, amount: number): WalletState {
  const value = Math.floor(amount);
  if (!w.seat || value <= 0 || value > w.balance) return w;
  return { ...w, balance: w.balance - value, seat: { ...w.seat, stack: w.seat.stack + value } };
}

export function updateSeatStack(w: WalletState, stack: number): WalletState {
  if (!w.seat || w.seat.stack === stack) return w;
  return { ...w, seat: { ...w.seat, stack: Math.max(0, Math.floor(stack)) } };
}

export function leaveTable(w: WalletState): WalletState {
  return recoverSeat(w);
}

export function recordHandResult(w: WalletState, net: number, note: string): WalletState {
  if (net === 0) return w;
  return pushHistory(w, entry("hand", net, note));
}
