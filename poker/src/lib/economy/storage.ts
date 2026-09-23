/**
 * Leitura/escrita segura no localStorage. Falha silenciosamente (modo privado,
 * armazenamento bloqueado, SSR) e devolve o valor padrão.
 */
export function loadJSON<T>(key: string, fallback: T): T {
  try {
    if (typeof window === "undefined") return fallback;
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function saveJSON(key: string, value: unknown): void {
  try {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* armazenamento indisponível: o jogo continua sem persistir */
  }
}
