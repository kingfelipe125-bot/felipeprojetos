import type { Metadata } from "next";
import Link from "next/link";
import { PlayingCard } from "@/components/game/PlayingCard";
import { SiteFooter } from "@/components/ui/SiteFooter";
import { SiteHeader } from "@/components/ui/SiteHeader";
import { VirtualNotice } from "@/components/ui/VirtualNotice";
import { parseCards } from "@/lib/poker/cards";

export const metadata: Metadata = { title: "Como jogar — Poker Night" };

const RANKING: { name: string; desc: string; cards: string }[] = [
  { name: "Royal Flush", desc: "A, K, Q, J e 10 do mesmo naipe.", cards: "As Ks Qs Js Ts" },
  { name: "Straight Flush", desc: "Cinco cartas em sequência do mesmo naipe.", cards: "9h 8h 7h 6h 5h" },
  { name: "Quadra (Four of a Kind)", desc: "Quatro cartas do mesmo valor.", cards: "Qc Qd Qh Qs 7d" },
  { name: "Full House", desc: "Uma trinca e um par.", cards: "Kc Kd Kh 4s 4d" },
  { name: "Flush", desc: "Cinco cartas do mesmo naipe, fora de sequência.", cards: "Ad Jd 8d 5d 2d" },
  { name: "Sequência (Straight)", desc: "Cinco cartas em sequência de naipes variados. O Ás pode ser baixo (A-2-3-4-5).", cards: "Tc 9d 8h 7s 6c" },
  { name: "Trinca (Three of a Kind)", desc: "Três cartas do mesmo valor.", cards: "8c 8d 8h Ks 3d" },
  { name: "Dois Pares (Two Pair)", desc: "Dois pares diferentes.", cards: "Jc Jd 5h 5s Ad" },
  { name: "Um Par (One Pair)", desc: "Duas cartas do mesmo valor.", cards: "Tc Th Ks 7d 2c" },
  { name: "Carta Alta (High Card)", desc: "Nenhuma combinação: vale a carta mais alta.", cards: "Ac Qd 9h 6s 3c" },
];

const ACTIONS = [
  { name: "Fold", desc: "Desistir da mão. Você perde o que já apostou nela." },
  { name: "Check", desc: "Passar a vez sem apostar — só quando ninguém apostou na rodada." },
  { name: "Call", desc: "Pagar a aposta atual para continuar na mão." },
  { name: "Bet / Raise", desc: "Apostar ou aumentar. O aumento mínimo é o tamanho do último aumento (ou o big blind)." },
  { name: "All-in", desc: "Apostar todas as suas fichas. Se outros tiverem mais, forma-se um pote lateral." },
];

const STEPS = [
  { name: "Blinds", desc: "Os dois jogadores à esquerda do botão (D) pagam as apostas obrigatórias: small blind e big blind." },
  { name: "Pré-flop", desc: "Cada jogador recebe 2 cartas privadas. A ação começa à esquerda do big blind." },
  { name: "Flop", desc: "Três cartas comunitárias são abertas. Nova rodada de apostas, começando à esquerda do botão." },
  { name: "Turn", desc: "A quarta carta comunitária é aberta, seguida de apostas." },
  { name: "River", desc: "A quinta e última carta comunitária, e a última rodada de apostas." },
  { name: "Showdown", desc: "Quem sobrou mostra as cartas. Vence a melhor combinação de 5 cartas entre as 7 disponíveis (2 suas + 5 da mesa)." },
];

export default function HowToPage() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-4xl px-4 pt-8">
        <h1 className="font-display text-3xl font-bold text-white">Como jogar Texas Hold&apos;em</h1>
        <p className="mt-2 text-white/60">
          O objetivo é ganhar fichas formando a melhor mão de 5 cartas — ou fazendo todos os outros desistirem.
        </p>
        <VirtualNotice className="mt-4" />

        <section className="mt-8">
          <h2 className="font-display text-xl font-semibold text-white">Uma mão, passo a passo</h2>
          <ol className="mt-4 grid gap-3 sm:grid-cols-2">
            {STEPS.map((s, i) => (
              <li key={s.name} className="panel flex gap-3 rounded-xl p-4">
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-gold-400/15 font-display text-sm font-bold text-gold-300">{i + 1}</span>
                <div>
                  <div className="font-semibold text-white">{s.name}</div>
                  <p className="text-sm text-white/60">{s.desc}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <section className="mt-10">
          <h2 className="font-display text-xl font-semibold text-white">Suas ações</h2>
          <dl className="mt-4 grid gap-3 sm:grid-cols-2">
            {ACTIONS.map((a) => (
              <div key={a.name} className="panel rounded-xl p-4">
                <dt className="font-semibold text-gold-300">{a.name}</dt>
                <dd className="text-sm text-white/60">{a.desc}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-3 text-sm text-white/45">Atalhos no computador: F = Fold, C = Check/Call, R = Raise.</p>
        </section>

        <section className="mt-10">
          <h2 className="font-display text-xl font-semibold text-white">Ranking das mãos (da maior para a menor)</h2>
          <ol className="mt-4 space-y-2">
            {RANKING.map((r, i) => (
              <li key={r.name} className="panel flex flex-col gap-3 rounded-xl p-3 sm:flex-row sm:items-center">
                <div className="flex items-center gap-3 sm:w-64">
                  <span className="w-6 text-right font-display font-bold text-white/40">{i + 1}</span>
                  <div>
                    <div className="font-semibold text-white">{r.name}</div>
                    <p className="text-xs text-white/55">{r.desc}</p>
                  </div>
                </div>
                <div className="flex gap-1 pl-9 sm:pl-0" style={{ ["--card-w" as string]: "38px" }}>
                  {parseCards(r.cards).map((c, j) => (
                    <PlayingCard key={j} card={c} />
                  ))}
                </div>
              </li>
            ))}
          </ol>
        </section>

        <section className="mt-10 grid gap-3 sm:grid-cols-2">
          <div className="panel rounded-xl p-4">
            <h3 className="font-semibold text-white">Empates e kickers</h3>
            <p className="mt-1 text-sm text-white/60">
              Com a mesma combinação, vence quem tiver cartas mais altas nela e, depois, as maiores cartas restantes
              (kickers). Se as 5 cartas forem equivalentes, o pote é dividido. Naipes nunca desempatam.
            </p>
          </div>
          <div className="panel rounded-xl p-4">
            <h3 className="font-semibold text-white">Potes laterais</h3>
            <p className="mt-1 text-sm text-white/60">
              Quem vai all-in só concorre ao valor que conseguiu cobrir. O restante apostado pelos demais forma potes
              laterais disputados apenas entre eles.
            </p>
          </div>
        </section>

        <div className="mt-10 text-center">
          <Link href="/jogar/" className="inline-block rounded-xl bg-gradient-to-b from-gold-300 to-gold-600 px-6 py-3 font-semibold text-ink-950 hover:brightness-110">
            Ir para as mesas
          </Link>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
