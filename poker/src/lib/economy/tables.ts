export interface TableDef {
  id: string;
  name: string;
  smallBlind: number;
  bigBlind: number;
  /** Buy-in máximo (100 big blinds). */
  maxBuyIn: number;
  /** Buy-in mínimo (20 big blinds). */
  minBuyIn: number;
  accent: string;
}

export const TABLES: TableDef[] = [
  { id: "iniciante", name: "Mesa Iniciante", smallBlind: 10, bigBlind: 20, maxBuyIn: 2_000, minBuyIn: 400, accent: "emerald" },
  { id: "classica", name: "Mesa Clássica", smallBlind: 50, bigBlind: 100, maxBuyIn: 10_000, minBuyIn: 2_000, accent: "sky" },
  { id: "high-roller", name: "High Roller", smallBlind: 250, bigBlind: 500, maxBuyIn: 50_000, minBuyIn: 10_000, accent: "amber" },
];

export function findTable(id: string): TableDef | undefined {
  return TABLES.find((t) => t.id === id);
}
