import clsx from "clsx";
import type { CSSProperties } from "react";
import { formatCompact, formatSigned } from "@/lib/format";
import { sameCard, type Card } from "@/lib/poker/cards";
import { PERSONALITIES } from "@/lib/poker/personalities";
import type { LastAction, Player } from "@/lib/poker/types";
import { PlayingCard } from "./PlayingCard";
import { PERSONALITY_STYLE } from "./personalityStyle";

const ACTION_LABEL: Record<LastAction["kind"], string> = {
  fold: "Fold", check: "Check", call: "Call", bet: "Bet", raise: "Raise", allin: "All-in", sb: "SB", bb: "BB",
};

const ACTION_COLOR: Record<LastAction["kind"], string> = {
  fold: "bg-zinc-700 text-zinc-200",
  check: "bg-sky-600 text-white",
  call: "bg-emerald-600 text-white",
  bet: "bg-amber-500 text-ink-950",
  raise: "bg-amber-500 text-ink-950",
  allin: "bg-rose-600 text-white",
  sb: "bg-white/15 text-white",
  bb: "bg-white/15 text-white",
};

interface Props {
  player: Player;
  seat: number;
  handNumber: number;
  isDealer: boolean;
  dealerSide: "left" | "right";
  isActive: boolean;
  thinkingMs?: number;
  thinkingKey?: string;
  reveal: boolean;
  winnings: number;
  winningCards: Card[] | null;
  handLabel?: string;
  style: CSSProperties;
}

export function Seat({
  player, seat, handNumber, isDealer, dealerSide, isActive, thinkingMs, thinkingKey, reveal, winnings, winningCards, handLabel, style,
}: Props) {
  const look = PERSONALITY_STYLE[player.isHuman ? "human" : player.personality ?? "balanced"];
  const Icon = look.icon;
  const faceUp = player.isHuman || reveal;
  const showCards = player.inHand && player.hole.length > 0 && (!player.folded || player.isHuman);
  const isWinner = winnings > 0;
  const busted = !player.inHand && player.stack === 0;

  return (
    <div
      className={clsx("seat", isActive && "active", isWinner && "winner", player.folded && !player.isHuman && "folded")}
      style={style}
    >
      <div className="relative flex flex-col items-center">
        {/* Cartas */}
        {showCards && (
          <div
            className={clsx(
              "absolute left-1/2 z-0 flex -translate-x-1/2",
              player.isHuman ? "bottom-[calc(100%-18px)] gap-1" : faceUp ? "bottom-[calc(100%-22px)] gap-0.5" : "bottom-[calc(100%-26px)] -space-x-5",
              player.isHuman && player.folded && "opacity-40",
            )}
          >
            {player.hole.map((c, i) => {
              const inWin = winningCards?.some((w) => sameCard(w, c));
              const revealing = reveal && !player.isHuman;
              return (
                // A rotação fica no wrapper para não conflitar com o transform das animações.
                <div key={`${handNumber}-${i}-${revealing ? "up" : "down"}`} className={clsx(!faceUp && (i === 0 ? "-rotate-6" : "rotate-6"))}>
                  <PlayingCard
                    card={c}
                    faceDown={!faceUp}
                    size={player.isHuman ? "lg" : faceUp ? "md" : "sm"}
                    highlight={!!winningCards && inWin}
                    dim={!!winningCards && !inWin && reveal}
                    className={revealing ? "reveal" : "deal-in"}
                    style={{ animationDelay: revealing ? `${i * 80}ms` : `${(seat + i * 6) * 70}ms` }}
                  />
                </div>
              );
            })}
          </div>
        )}

        {/* Avatar */}
        <div
          className={clsx(
            "avatar-ring relative z-10 grid place-items-center rounded-full bg-gradient-to-br text-white ring-2 ring-black/40",
            look.gradient,
            player.isHuman ? "h-12 w-12 sm:h-14 sm:w-14" : "h-10 w-10 sm:h-12 sm:w-12",
          )}
        >
          <Icon className="h-5 w-5 drop-shadow sm:h-6 sm:w-6" aria-hidden />
          {isDealer && (
            <span
              className={clsx(
                "absolute top-1/2 grid h-5 w-5 -translate-y-1/2 place-items-center rounded-full bg-white text-[10px] font-black text-ink-950 shadow-md ring-1 ring-black/20 sm:h-6 sm:w-6 sm:text-[11px]",
                dealerSide === "left" ? "right-[calc(100%+4px)]" : "left-[calc(100%+4px)]",
              )}
              title="Botão do dealer"
            >
              D
            </span>
          )}
        </div>

        {/* Nome e fichas */}
        <div
          className={clsx(
            "panel relative z-10 -mt-2 min-w-[84px] overflow-hidden rounded-lg px-2.5 pb-1 pt-1.5 text-center shadow-lg sm:min-w-[108px]",
            isActive && "border-gold-400/60",
          )}
        >
          <div className="truncate text-[11px] font-semibold leading-tight text-white sm:text-[13px]">{player.name}</div>
          <div className="font-display text-[11px] font-semibold tabular-nums leading-tight text-gold-300 sm:text-[13px]">
            {busted ? "Sem fichas" : formatCompact(player.stack)}
          </div>
          {!player.isHuman && player.personality && (
            <div className={clsx("hidden whitespace-nowrap text-[9px] uppercase tracking-wide opacity-80 sm:block", look.tag)}>
              {PERSONALITIES[player.personality].label}
            </div>
          )}
          {isActive && thinkingMs !== undefined && (
            <div key={thinkingKey} className="think-bar absolute inset-x-0 bottom-0" style={{ ["--ms" as string]: `${thinkingMs}ms` }} />
          )}
        </div>

        {/* Última ação */}
        {player.lastAction && !isWinner && !reveal && (
          <div
            key={`${handNumber}-${player.lastAction.kind}-${player.lastAction.amount ?? ""}`}
            className={clsx(
              "pop-in absolute top-[calc(100%+3px)] z-20 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide shadow sm:text-[11px]",
              ACTION_COLOR[player.lastAction.kind],
            )}
          >
            {ACTION_LABEL[player.lastAction.kind]}
          </div>
        )}

        {/* Mão revelada / vitória */}
        {reveal && handLabel && (
          <div className="fade-up absolute top-[calc(100%+3px)] z-20 whitespace-nowrap rounded-md bg-black/70 px-2 py-0.5 text-[10px] font-semibold text-white sm:text-[11px]">
            {handLabel}
          </div>
        )}
        {isWinner && (
          <div key={`win-${handNumber}`} className="float-up pointer-events-none absolute -top-2 left-1/2 z-40 whitespace-nowrap rounded-full bg-ink-950/85 px-2.5 py-0.5 font-display text-base font-bold text-gold-300 shadow-lg ring-1 ring-gold-400/40 sm:text-lg">
            {formatSigned(winnings)}
          </div>
        )}
      </div>
    </div>
  );
}
