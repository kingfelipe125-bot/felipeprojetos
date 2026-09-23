export function formatCoins(value: number): string {
  return Math.round(value).toLocaleString("pt-BR");
}

/** Versão curta para espaços apertados: 125 mil, 1,2 mi. */
export function formatCompact(value: number): string {
  if (Math.abs(value) >= 1_000_000) return `${(value / 1_000_000).toLocaleString("pt-BR", { maximumFractionDigits: 1 })} mi`;
  if (Math.abs(value) >= 100_000) return `${Math.round(value / 1000).toLocaleString("pt-BR")} mil`;
  return formatCoins(value);
}

export function formatSigned(value: number): string {
  return `${value > 0 ? "+" : value < 0 ? "−" : ""}${formatCoins(Math.abs(value))}`;
}
