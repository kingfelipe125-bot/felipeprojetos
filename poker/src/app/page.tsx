"use client";

import Link from "next/link";
import { BarChart3, BookOpen, Play } from "lucide-react";
import { PlayingCard } from "@/components/game/PlayingCard";
import { CoinIcon } from "@/components/ui/CoinIcon";
import { FreeCoinsButton } from "@/components/ui/FreeCoinsButton";
import { HistoryList } from "@/components/ui/HistoryList";
import { SiteFooter } from "@/components/ui/SiteFooter";
import { SiteHeader } from "@/components/ui/SiteHeader";
import { VirtualNotice } from "@/components/ui/VirtualNotice";
import { formatCoins } from "@/lib/format";
import { useEconomy } from "@/state/EconomyContext";

const MENU = [
  { href: "/jogar/", label: "Jogar Poker", desc: "Escolha uma mesa e sente-se com 5 bots", icon: Play, primary: true },
  { href: "/como-jogar/", label: "Como jogar", desc: "Regras, ações e ranking das mãos", icon: BookOpen },
  { href: "/estatisticas/", label: "Estatísticas", desc: "Suas mãos, vitórias e recordes", icon: BarChart3 },
];

export default function HomePage() {
  const { wallet, stats, ready } = useEconomy();

  return (
    <>
      <SiteHeader />
      <main className="mx-auto grid max-w-6xl items-center gap-10 px-4 pt-10 md:grid-cols-[1.15fr_1fr] md:pt-16">
        <section className="fade-up">
          <VirtualNotice />
          <h1 className="mt-5 font-display text-4xl font-bold leading-[1.05] tracking-tight text-white sm:text-5xl lg:text-6xl">
            Texas Hold&apos;em,
            <br />
            <span className="text-gold-grad">só pela diversão.</span>
          </h1>
          <p className="mt-4 max-w-lg text-base text-white/65 sm:text-lg">
            Mesa de 6 lugares contra 5 bots com estilos diferentes. Regras completas, potes laterais e showdown — sem
            dinheiro real, sem compras.
          </p>

          <div className="mt-8 grid gap-3 sm:max-w-md">
            {MENU.map(({ href, label, desc, icon: Icon, primary }) => (
              <Link
                key={href}
                href={href}
                className={
                  primary
                    ? "group flex items-center gap-4 rounded-2xl bg-gradient-to-b from-gold-300 via-gold-400 to-gold-600 p-4 text-ink-950 shadow-[0_10px_40px_-10px_rgba(233,194,104,0.6)] transition hover:brightness-110"
                    : "panel group flex items-center gap-4 rounded-2xl p-4 transition hover:border-white/20 hover:bg-white/5"
                }
              >
                <span className={primary ? "grid h-11 w-11 place-items-center rounded-xl bg-ink-950/15" : "grid h-11 w-11 place-items-center rounded-xl bg-white/5 text-gold-300"}>
                  <Icon className="h-5 w-5" aria-hidden />
                </span>
                <span>
                  <span className="block font-display text-lg font-semibold">{label}</span>
                  <span className={primary ? "text-sm text-ink-950/70" : "text-sm text-white/55"}>{desc}</span>
                </span>
              </Link>
            ))}
          </div>
        </section>

        <aside className="fade-up space-y-4" style={{ animationDelay: "120ms" }}>
          <div className="relative mx-auto hidden h-36 w-64 md:block" aria-hidden>
            <div className="absolute left-14 top-2 -rotate-12"><PlayingCard card={{ rank: 14, suit: "s" }} size="lg" /></div>
            <div className="absolute left-28 top-0 rotate-6"><PlayingCard card={{ rank: 13, suit: "h" }} size="lg" /></div>
          </div>

          <div className="panel rounded-2xl p-5">
            <div className="flex items-center justify-between">
              <span className="text-sm text-white/60">Seu saldo</span>
              <VirtualNotice compact />
            </div>
            <div className="mt-2 flex items-center gap-3">
              <CoinIcon className="h-9 w-9" />
              <span className="font-display text-4xl font-bold tabular-nums text-white">
                {ready ? formatCoins(wallet.balance) : "—"}
              </span>
            </div>
            <p className="mt-1 text-xs text-white/45">
              {ready ? `${stats.handsPlayed} mãos jogadas · ${stats.handsWon} vencidas` : "Carregando…"}
            </p>
            <FreeCoinsButton className="mt-4" />
          </div>

          <div className="panel rounded-2xl p-5">
            <div className="mb-1 flex items-center justify-between">
              <h2 className="font-display font-semibold text-white">Últimos ganhos e perdas</h2>
              <Link href="/estatisticas/" className="text-xs text-gold-300 hover:underline">
                Ver tudo
              </Link>
            </div>
            {ready && <HistoryList entries={wallet.history} limit={4} />}
          </div>
        </aside>
      </main>
      <SiteFooter />
    </>
  );
}
