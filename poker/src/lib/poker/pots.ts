import type { Player, Pot } from "./types";

/**
 * Divide o total apostado em pote principal + potes laterais.
 * Cada nível de contribuição de um jogador ainda na mão (normalmente um all-in)
 * fecha um pote; só concorre a ele quem contribuiu pelo menos aquele nível.
 * Fichas de quem desistiu entram nos potes, mas essa pessoa não concorre.
 */
export function computePots(players: Player[]): Pot[] {
  const live = players.filter((p) => p.inHand && !p.folded);
  const levels = [...new Set(live.map((p) => p.contributed))].filter((v) => v > 0).sort((a, b) => a - b);

  const pots: Pot[] = [];
  let prev = 0;
  for (const level of levels) {
    let amount = 0;
    for (const p of players) amount += Math.max(0, Math.min(p.contributed, level) - prev);
    const eligible = live.filter((p) => p.contributed >= level).map((p) => p.id);
    if (amount > 0) pots.push({ amount, eligible });
    prev = level;
  }

  // Defensivo: fichas de desistentes acima do maior nível ativo (não deveria ocorrer
  // porque apostas não pagas são devolvidas antes) vão para o último pote.
  let leftover = 0;
  for (const p of players) leftover += Math.max(0, p.contributed - prev);
  if (leftover > 0) {
    if (pots.length) pots[pots.length - 1].amount += leftover;
    else pots.push({ amount: leftover, eligible: live.map((p) => p.id) });
  }
  return pots;
}

/**
 * Divide `amount` entre vencedores. Fichas ímpares vão, uma a uma, para os
 * vencedores mais próximos à esquerda do botão (regra usual de cassino).
 */
export function splitAmount(amount: number, winnerSeats: number[], dealer: number, seatCount: number): Map<number, number> {
  const ordered = winnerSeats.slice().sort(
    (a, b) => ((a - dealer - 1 + seatCount) % seatCount) - ((b - dealer - 1 + seatCount) % seatCount),
  );
  const share = Math.floor(amount / ordered.length);
  let remainder = amount - share * ordered.length;
  const result = new Map<number, number>();
  for (const seat of ordered) {
    result.set(seat, share + (remainder > 0 ? 1 : 0));
    if (remainder > 0) remainder--;
  }
  return result;
}
