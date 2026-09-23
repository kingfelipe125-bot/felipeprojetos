import { rankLabel, type Card } from "@/lib/poker/cards";
import { evaluateHand, pluralRank } from "@/lib/poker/handEvaluator";

/** Descrição da mão atual do jogador (antes do flop, descreve as duas cartas). */
export function describeCurrentHand(hole: Card[], community: Card[]): string | null {
  if (hole.length < 2) return null;
  if (community.length >= 3) return evaluateHand([...hole, ...community]).description;
  const [a, b] = hole[0].rank >= hole[1].rank ? hole : [hole[1], hole[0]];
  if (a.rank === b.rank) return `Par de ${pluralRank(a.rank)}`;
  return `${rankLabel(a.rank)}-${rankLabel(b.rank)}${a.suit === b.suit ? " do mesmo naipe" : ""}`;
}
