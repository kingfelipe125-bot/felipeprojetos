"use client";

import { Gift } from "lucide-react";
import { formatCoins } from "@/lib/format";
import { FREE_COINS_AMOUNT, FREE_COINS_THRESHOLD } from "@/lib/economy/wallet";
import { useEconomy } from "@/state/EconomyContext";
import { Button } from "./Button";

export function FreeCoinsButton({ className }: { className?: string }) {
  const { canClaimFree, claimFree, ready } = useEconomy();
  return (
    <div className={className}>
      <Button variant={canClaimFree ? "gold" : "neutral"} disabled={!ready || !canClaimFree} onClick={claimFree} className="w-full">
        <Gift className="h-4 w-4" aria-hidden />
        Receber {formatCoins(FREE_COINS_AMOUNT)} moedas grátis
      </Button>
      {!canClaimFree && ready && (
        <p className="mt-1.5 text-center text-[11px] text-white/45">
          Disponível quando seu saldo ficar abaixo de {formatCoins(FREE_COINS_THRESHOLD)}.
        </p>
      )}
    </div>
  );
}
