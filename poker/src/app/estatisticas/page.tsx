"use client";

import { useState } from "react";
import { Award, Coins, Flame, Hand, Trophy, TrendingDown, Target } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { HistoryList } from "@/components/ui/HistoryList";
import { SiteFooter } from "@/components/ui/SiteFooter";
import { SiteHeader } from "@/components/ui/SiteHeader";
import { VirtualNotice } from "@/components/ui/VirtualNotice";
import { formatCoins, formatSigned } from "@/lib/format";
import { CATEGORY_NAME } from "@/lib/poker/handEvaluator";
import { useEconomy } from "@/state/EconomyContext";

export default function StatsPage() {
  const { stats, wallet, ready, resetStats, resetEverything } = useEconomy();
  const [confirm, setConfirm] = useState<"stats" | "all" | null>(null);

  const winRate = stats.handsPlayed ? Math.round((stats.handsWon / stats.handsPlayed) * 100) : 0;
  const net = stats.chipsWon - stats.chipsLost;

  const cards = [
    { label: "Mãos jogadas", value: formatCoins(stats.handsPlayed), icon: Hand },
    { label: "Mãos vencidas", value: `${formatCoins(stats.handsWon)}`, sub: `${winRate}% das mãos`, icon: Trophy },
    { label: "Total de fichas ganhas", value: formatCoins(stats.chipsWon), sub: "lucro somado das mãos vencedoras", icon: Coins },
    { label: "Maior pote", value: formatCoins(stats.biggestPot), icon: Award },
    { label: "Maior sequência de vitórias", value: formatCoins(stats.bestStreak), sub: `atual: ${stats.currentStreak}`, icon: Flame },
    { label: "Resultado líquido", value: formatSigned(net), sub: `perdas: ${formatCoins(stats.chipsLost)}`, icon: TrendingDown },
    { label: "Showdowns vencidos", value: formatCoins(stats.showdownsWon), icon: Target },
    { label: "Melhor mão vencedora", value: stats.bestHand !== null ? CATEGORY_NAME[stats.bestHand] : "—", icon: Award },
  ];

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-5xl px-4 pt-8">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h1 className="font-display text-3xl font-bold text-white">Estatísticas</h1>
          <VirtualNotice />
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
          {cards.map(({ label, value, sub, icon: Icon }) => (
            <div key={label} className="panel fade-up rounded-2xl p-4">
              <Icon className="h-5 w-5 text-gold-300" aria-hidden />
              <div className="mt-3 font-display text-2xl font-bold tabular-nums text-white">{ready ? value : "—"}</div>
              <div className="text-xs text-white/60">{label}</div>
              {sub && ready && <div className="mt-0.5 text-[11px] text-white/35">{sub}</div>}
            </div>
          ))}
        </div>

        <section className="panel mt-6 rounded-2xl p-5">
          <h2 className="font-display font-semibold text-white">Histórico de ganhos e perdas</h2>
          <p className="text-xs text-white/45">Últimos {wallet.history.length} registros (máx. 100).</p>
          <div className="mt-2 max-h-[420px] overflow-y-auto pr-1">{ready && <HistoryList entries={wallet.history} />}</div>
        </section>

        <section className="mt-6 flex flex-wrap items-center gap-3">
          {confirm ? (
            <>
              <span className="text-sm text-white/70">
                {confirm === "stats" ? "Zerar as estatísticas?" : "Apagar tudo e recomeçar com 10.000 moedas?"}
              </span>
              <Button
                variant="danger"
                onClick={() => {
                  if (confirm === "stats") resetStats();
                  else resetEverything();
                  setConfirm(null);
                }}
              >
                Confirmar
              </Button>
              <Button variant="ghost" onClick={() => setConfirm(null)}>Cancelar</Button>
            </>
          ) : (
            <>
              <Button variant="neutral" onClick={() => setConfirm("stats")}>Zerar estatísticas</Button>
              <Button variant="ghost" onClick={() => setConfirm("all")}>Recomeçar do zero</Button>
            </>
          )}
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
