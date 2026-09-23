"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { loadJSON, saveJSON } from "@/lib/economy/storage";
import { initialStats, recordHand, sanitizeStats, type HandRecord, type Stats } from "@/lib/economy/stats";
import * as W from "@/lib/economy/wallet";

const WALLET_KEY = "poker-virtual.wallet.v1";
const STATS_KEY = "poker-virtual.stats.v1";

interface Economy {
  ready: boolean;
  wallet: W.WalletState;
  stats: Stats;
  canClaimFree: boolean;
  claimFree: () => void;
  buyIn: (tableId: string, amount: number) => void;
  addToSeat: (amount: number) => void;
  updateSeatStack: (stack: number) => void;
  leaveTable: () => void;
  recordHand: (record: HandRecord, note: string) => void;
  resetStats: () => void;
  resetEverything: () => void;
}

const EconomyContext = createContext<Economy | null>(null);

export function EconomyProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [wallet, setWallet] = useState<W.WalletState>(W.initialWallet);
  const [stats, setStats] = useState<Stats>(initialStats);

  useEffect(() => {
    // Ao abrir o site, fichas deixadas numa mesa (aba fechada) voltam para a carteira.
    setWallet(W.recoverSeat(W.sanitizeWallet(loadJSON(WALLET_KEY, null))));
    setStats(sanitizeStats(loadJSON(STATS_KEY, null)));
    setReady(true);
  }, []);

  // Só grava depois de carregar, para nunca sobrescrever os dados salvos com o estado inicial.
  useEffect(() => { if (ready) saveJSON(WALLET_KEY, wallet); }, [ready, wallet]);
  useEffect(() => { if (ready) saveJSON(STATS_KEY, stats); }, [ready, stats]);

  const claimFree = useCallback(() => setWallet(W.claimFree), []);
  const buyIn = useCallback((tableId: string, amount: number) => setWallet((w) => W.buyIn(w, tableId, amount)), []);
  const addToSeat = useCallback((amount: number) => setWallet((w) => W.addToSeat(w, amount)), []);
  const updateSeatStack = useCallback((stack: number) => setWallet((w) => W.updateSeatStack(w, stack)), []);
  const leaveTable = useCallback(() => setWallet(W.leaveTable), []);
  const record = useCallback((r: HandRecord, note: string) => {
    setStats((s) => recordHand(s, r));
    setWallet((w) => W.recordHandResult(w, r.net, note));
  }, []);
  const resetStats = useCallback(() => setStats(initialStats()), []);
  const resetEverything = useCallback(() => {
    setStats(initialStats());
    setWallet(W.initialWallet());
  }, []);

  const value = useMemo<Economy>(() => ({
    ready, wallet, stats,
    canClaimFree: W.canClaimFree(wallet),
    claimFree, buyIn, addToSeat, updateSeatStack, leaveTable,
    recordHand: record, resetStats, resetEverything,
  }), [ready, wallet, stats, claimFree, buyIn, addToSeat, updateSeatStack, leaveTable, record, resetStats, resetEverything]);

  return <EconomyContext.Provider value={value}>{children}</EconomyContext.Provider>;
}

export function useEconomy(): Economy {
  const ctx = useContext(EconomyContext);
  if (!ctx) throw new Error("useEconomy precisa estar dentro de <EconomyProvider>");
  return ctx;
}
