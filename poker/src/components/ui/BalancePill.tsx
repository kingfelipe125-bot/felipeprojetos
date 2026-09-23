"use client";

import clsx from "clsx";
import { formatCoins } from "@/lib/format";
import { totalCoins } from "@/lib/economy/wallet";
import { useEconomy } from "@/state/EconomyContext";
import { CoinIcon } from "./CoinIcon";

export function BalancePill({ className, includeSeat = false }: { className?: string; includeSeat?: boolean }) {
  const { wallet, ready } = useEconomy();
  const value = includeSeat ? totalCoins(wallet) : wallet.balance;
  return (
    <div
      className={clsx("flex items-center gap-2 rounded-full border border-gold-400/25 bg-black/40 py-1 pl-1.5 pr-3", className)}
      title="Moedas virtuais — sem valor real"
    >
      <CoinIcon className="h-5 w-5" />
      <span className="font-display text-sm font-semibold tabular-nums text-gold-300">
        {ready ? formatCoins(value) : "—"}
      </span>
      <span className="hidden text-[10px] uppercase tracking-wider text-white/50 sm:inline">moedas virtuais</span>
    </div>
  );
}
