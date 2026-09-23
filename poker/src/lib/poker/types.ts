import type { Card } from "./cards";
import type { HandResult } from "./handEvaluator";

export type PersonalityId = "conservative" | "aggressive" | "balanced" | "unpredictable" | "maniac";

export type PlayerAction =
  | { type: "fold" }
  | { type: "check" }
  | { type: "call" }
  | { type: "raise"; to: number }
  | { type: "allin" };

export type ActionKind = "fold" | "check" | "call" | "bet" | "raise" | "allin" | "sb" | "bb";

export interface LastAction {
  kind: ActionKind;
  amount?: number;
}

export interface Player {
  id: string;
  name: string;
  isHuman: boolean;
  personality?: PersonalityId;
  stack: number;
  /** Fichas no início da mão, para calcular o resultado líquido. */
  startStack: number;
  hole: Card[];
  /** Apostado na rodada de apostas atual (vai para o pote ao fim da rodada). */
  bet: number;
  /** Total colocado no pote nesta mão (inclui `bet`). */
  contributed: number;
  folded: boolean;
  allIn: boolean;
  /** Recebeu cartas nesta mão. */
  inHand: boolean;
  hasActed: boolean;
  /** Após um all-in que não completa um aumento mínimo, quem já agiu só pode pagar ou desistir. */
  raiseLocked: boolean;
  lastAction: LastAction | null;
}

export type Street = "preflop" | "flop" | "turn" | "river";

/**
 * betting   → aguardando `currentPlayer` agir
 * streetEnd → rodada encerrada; chamar `advance()` para recolher apostas e seguir
 * handOver  → mão resolvida; chamar `startHand()` para a próxima
 */
export type Stage = "idle" | "betting" | "streetEnd" | "handOver";

export interface TableConfig {
  smallBlind: number;
  bigBlind: number;
}

export interface Pot {
  amount: number;
  eligible: string[];
}

export interface Award {
  playerId: string;
  amount: number;
  potIndex: number;
  hand?: HandResult;
}

export interface HandOutcome {
  /** Houve comparação de cartas (mais de um jogador chegou ao fim). */
  showdown: boolean;
  pots: Pot[];
  awards: Award[];
  /** Mão avaliada de cada jogador que chegou ao showdown. */
  hands: Record<string, HandResult>;
  totalPot: number;
}

export interface LogEntry {
  id: number;
  text: string;
  tone?: "info" | "win" | "street";
}

export interface GameState {
  config: TableConfig;
  players: Player[];
  handNumber: number;
  dealer: number;
  sbIndex: number;
  bbIndex: number;
  street: Street;
  stage: Stage;
  deck: Card[];
  community: Card[];
  currentPlayer: number;
  /** Maior aposta da rodada atual. */
  currentBet: number;
  /** Tamanho do último aumento completo (mínimo para o próximo aumento). */
  minRaise: number;
  outcome: HandOutcome | null;
  log: LogEntry[];
  logSeq: number;
}

export interface LegalActions {
  canFold: boolean;
  canCheck: boolean;
  canCall: boolean;
  callAmount: number;
  canRaise: boolean;
  /** Valores "aumentar para" (total da aposta do jogador na rodada). */
  minRaiseTo: number;
  maxRaiseTo: number;
  canAllIn: boolean;
  /** Se ainda não há aposta na rodada, o aumento é uma "aposta". */
  isBet: boolean;
}
