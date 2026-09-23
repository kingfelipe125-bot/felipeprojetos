"use client";

import clsx from "clsx";
import type { CSSProperties } from "react";
import { formatCoins, formatSigned } from "@/lib/format";
import { sameCard, type Card } from "@/lib/poker/cards";
import { collectedPot, potTotal, winningsById } from "@/lib/poker/engine";
import type { GameState } from "@/lib/poker/types";
import { ChipStack } from "./Chips";
import { CardSlot, PlayingCard } from "./PlayingCard";
import { Seat } from "./Seat";

/** Assento k fica no ângulo 90° + k·60° (0 = embaixo, sentido horário). */
function seatVars(seat: number, count: number): CSSProperties {
  const angle = ((90 + (seat * 360) / count) * Math.PI) / 180;
  const cos = Math.cos(angle);
  return {
    ["--cos" as string]: cos.toFixed(4),
    ["--sin" as string]: Math.sin(angle).toFixed(4),
    // Assentos no eixo vertical (em cima/embaixo): a aposta é deslocada para o lado.
    ["--axis" as string]: Math.abs(cos) < 0.1 ? 1 : 0,
  };
}

/** Lado do avatar onde fica o botão do dealer: voltado para o centro da mesa. */
function seatDealerSide(seat: number, count: number): "left" | "right" {
  return Math.cos(((90 + (seat * 360) / count) * Math.PI) / 180) > 0.1 ? "left" : "right";
}

interface Props {
  game: GameState;
  thinking: { seat: number; ms: number; key: string } | null;
}

export function PokerTable({ game, thinking }: Props) {
  const outcome = game.stage === "handOver" ? game.outcome : null;
  const winnings = outcome ? winningsById(game) : {};
  const showdown = !!outcome?.showdown;
  const collecting = game.stage === "streetEnd";

  // Cartas vencedoras (do pote principal) para destacar no showdown.
  const mainWinner = showdown ? outcome!.awards.find((a) => a.potIndex === 0) : undefined;
  const winningCards: Card[] | null = mainWinner?.hand?.cards ?? null;

  const pot = outcome ? outcome.totalPot : collectedPot(game);
  const livePot = potTotal(game);
  const headline = outcome ? buildHeadline(game, winnings) : null;

  return (
    <div className="table-wrap select-none">
      <div className="table-rail">
        <div className="table-felt" />
      </div>

      {/* Pote */}
      <div className="absolute left-1/2 top-[var(--pot-y)] z-10 -translate-x-1/2 -translate-y-1/2 text-center">
        {(pot > 0 || livePot > 0) && (
          <div className="flex flex-col items-center gap-1">
            {pot > 0 && !outcome && <ChipStack amount={pot} label={false} />}
            <div className="rounded-full bg-black/45 px-3 py-1 font-display text-xs font-semibold tabular-nums text-white shadow-inner sm:text-sm">
              Pote: <span className="text-gold-300">{formatCoins(outcome ? pot : livePot)}</span>
            </div>
            {showdown && outcome!.pots.length > 1 && (
              <div className="text-[10px] text-white/70 sm:text-xs">
                {outcome!.pots.map((p, i) => `${i === 0 ? "Principal" : `Lateral ${i}`}: ${formatCoins(p.amount)}`).join(" · ")}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Cartas comunitárias */}
      <div className="absolute left-1/2 top-[var(--board-y)] z-10 flex -translate-x-1/2 -translate-y-1/2 gap-1 sm:gap-1.5">
        {Array.from({ length: 5 }, (_, i) => {
          const c = game.community[i];
          if (!c) return <CardSlot key={`slot-${i}`} />;
          const inWin = winningCards?.some((w) => sameCard(w, c));
          const flopDelay = i < 3 ? i * 140 : 0;
          return (
            <PlayingCard
              key={`${game.handNumber}-${i}`}
              card={c}
              className="flip-in"
              style={{ animationDelay: `${flopDelay}ms` }}
              highlight={!!winningCards && inWin}
              dim={!!winningCards && !inWin}
            />
          );
        })}
      </div>

      {/* Resultado da mão */}
      {headline && (
        // O wrapper centraliza; o filho anima (as duas coisas usam `transform`).
        <div className="hand-headline absolute left-1/2 z-30 w-max max-w-[92%] -translate-x-1/2">
          <div
            key={`headline-${game.handNumber}`}
            className="fade-up rounded-xl border border-gold-400/40 bg-ink-950/85 px-3 py-1.5 text-center text-xs font-semibold text-white shadow-2xl sm:px-4 sm:py-2 sm:text-sm"
          >
            {headline}
          </div>
        </div>
      )}

      {/* Apostas da rodada */}
      {game.players.map((p, i) =>
        p.bet > 0 ? (
          <div
            key={`bet-${game.handNumber}-${game.street}-${i}`}
            className={clsx("bet-spot", p.isHuman && "hero", collecting && "collecting")}
            style={seatVars(i, game.players.length)}
          >
            <ChipStack amount={p.bet} className="pop-in" />
          </div>
        ) : null,
      )}

      {/* Fichas do pote indo para os vencedores */}
      {outcome &&
        game.players.map((p, i) =>
          winnings[p.id] ? (
            <div key={`pay-${game.handNumber}-${i}`} className="payout" style={seatVars(i, game.players.length)}>
              <ChipStack amount={winnings[p.id]} label={false} />
            </div>
          ) : null,
        )}

      {/* Jogadores */}
      {game.players.map((p, i) => {
        const hand = outcome?.hands[p.id];
        return (
          <Seat
            key={p.id}
            player={p}
            seat={i}
            handNumber={game.handNumber}
            isDealer={i === game.dealer && game.handNumber > 0}
            dealerSide={seatDealerSide(i, game.players.length)}
            isActive={game.stage === "betting" && game.currentPlayer === i}
            thinkingMs={thinking?.seat === i ? thinking.ms : undefined}
            thinkingKey={thinking?.key}
            reveal={showdown && p.inHand && !p.folded}
            winnings={winnings[p.id] ?? 0}
            winningCards={winningCards}
            handLabel={hand?.name}
            style={seatVars(i, game.players.length)}
          />
        );
      })}
    </div>
  );
}

function buildHeadline(game: GameState, winnings: Record<string, number>): string | null {
  const outcome = game.outcome;
  if (!outcome) return null;
  const winners = game.players.filter((p) => winnings[p.id]);
  const me = game.players.find((p) => p.isHuman);
  const myNet = me && me.inHand ? me.stack - me.startStack : 0;
  if (winners.length === 0) return null;

  const names = winners.map((w) => (w.isHuman ? "Você" : w.name));
  const hand = outcome.showdown ? outcome.awards.find((a) => a.potIndex === 0)?.hand?.description : null;
  const iWon = me ? !!winnings[me.id] : false;

  if (winners.length > 1 && outcome.pots.length === 1) {
    return `Pote dividido: ${names.join(" e ")}${hand ? ` · ${hand}` : ""}`;
  }
  const main = outcome.awards.find((a) => a.potIndex === 0);
  const mainName = main ? (main.playerId === me?.id ? "Você" : game.players.find((p) => p.id === main.playerId)?.name) : names[0];
  const verb = mainName === "Você" ? "venceu" : "vence";
  const base = `${mainName} ${verb}${hand ? ` com ${hand}` : ""}`;
  return iWon || (me?.inHand && myNet !== 0) ? `${base} · você ${formatSigned(myNet)}` : base;
}
