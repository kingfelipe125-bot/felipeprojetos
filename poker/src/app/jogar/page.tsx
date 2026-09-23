"use client";

import Link from "next/link";
import clsx from "clsx";
import { Users } from "lucide-react";
import { CoinIcon } from "@/components/ui/CoinIcon";
import { FreeCoinsButton } from "@/components/ui/FreeCoinsButton";
import { SiteFooter } from "@/components/ui/SiteFooter";
import { SiteHeader } from "@/components/ui/SiteHeader";
import { VirtualNotice } from "@/components/ui/VirtualNotice";
import { formatCoins } from "@/lib/format";
import { TABLES } from "@/lib/economy/tables";
import { BOT_ROSTER, PERSONALITIES } from "@/lib/poker/personalities";
import { PERSONALITY_STYLE } from "@/components/game/personalityStyle";
import { useEconomy } from "@/state/EconomyContext";

const ACCENTS: Record<string, string> = {
  emerald: "from-emerald-500/25 to-transparent border-emerald-400/20",
  sky: "from-sky-500/25 to-transparent border-sky-400/20",
  amber: "from-amber-500/25 to-transparent border-amber-400/25",
};

export default function LobbyPage() {
  const { wallet, ready } = useEconomy();

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-4 pt-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-bold text-white">Escolha sua mesa</h1>
            <p className="mt-1 text-white/60">Texas Hold&apos;em No-Limit · 6 jogadores · você + 5 bots</p>
          </div>
          <VirtualNotice />
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {TABLES.map((t) => {
            const affordable = ready && wallet.balance >= t.minBuyIn;
            return (
              <div key={t.id} className={clsx("panel fade-up flex flex-col rounded-2xl border bg-gradient-to-b p-5", ACCENTS[t.accent])}>
                <h2 className="font-display text-xl font-semibold text-white">{t.name}</h2>
                <dl className="mt-3 space-y-1.5 text-sm">
                  <div className="flex justify-between"><dt className="text-white/55">Blinds</dt><dd className="font-display tabular-nums">{formatCoins(t.smallBlind)} / {formatCoins(t.bigBlind)}</dd></div>
                  <div className="flex justify-between"><dt className="text-white/55">Buy-in</dt><dd className="font-display tabular-nums">{formatCoins(t.minBuyIn)} – {formatCoins(t.maxBuyIn)}</dd></div>
                  <div className="flex justify-between"><dt className="text-white/55">Jogadores</dt><dd className="flex items-center gap-1"><Users className="h-3.5 w-3.5" /> 6</dd></div>
                </dl>
                <div className="mt-5 flex-1" />
                {affordable ? (
                  <Link
                    href={`/mesa/${t.id}/`}
                    className="rounded-xl bg-gradient-to-b from-gold-300 to-gold-600 py-2.5 text-center font-semibold text-ink-950 transition hover:brightness-110"
                  >
                    Sentar na mesa
                  </Link>
                ) : (
                  <div className="rounded-xl border border-white/10 py-2.5 text-center text-sm text-white/50">
                    {ready ? `Precisa de ${formatCoins(t.minBuyIn)} moedas` : "…"}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-[1fr_320px]">
          <div className="panel rounded-2xl p-5">
            <h2 className="font-display font-semibold text-white">Seus adversários</h2>
            <ul className="mt-3 grid gap-3 sm:grid-cols-2">
              {BOT_ROSTER.map((b) => {
                const look = PERSONALITY_STYLE[b.personality];
                const Icon = look.icon;
                const p = PERSONALITIES[b.personality];
                return (
                  <li key={b.name} className="flex items-start gap-3">
                    <span className={clsx("grid h-10 w-10 shrink-0 place-items-center rounded-full bg-gradient-to-br text-white", look.gradient)}>
                      <Icon className="h-5 w-5" aria-hidden />
                    </span>
                    <span>
                      <span className="block font-semibold text-white">{b.name} <span className={clsx("text-xs font-medium", look.tag)}>· {p.label}</span></span>
                      <span className="text-sm text-white/55">{p.description}</span>
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
          <div className="panel rounded-2xl p-5">
            <div className="text-sm text-white/60">Saldo disponível</div>
            <div className="mt-1 flex items-center gap-2 font-display text-3xl font-bold tabular-nums">
              <CoinIcon className="h-7 w-7" /> {ready ? formatCoins(wallet.balance) : "—"}
            </div>
            <FreeCoinsButton className="mt-4" />
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
