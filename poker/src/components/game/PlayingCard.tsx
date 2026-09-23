import clsx from "clsx";
import type { CSSProperties } from "react";
import { isRed, rankLabel, SUIT_NAME, SUIT_SYMBOL, type Card } from "@/lib/poker/cards";

interface Props {
  card?: Card | null;
  faceDown?: boolean;
  size?: "sm" | "md" | "lg";
  highlight?: boolean;
  dim?: boolean;
  className?: string;
  style?: CSSProperties;
}

export function PlayingCard({ card, faceDown, size = "md", highlight, dim, className, style }: Props) {
  const showFace = card && !faceDown;
  return (
    <div
      className={clsx(
        "card",
        size !== "md" && size,
        showFace && (isRed(card.suit) ? "red" : "black"),
        highlight && "win",
        dim && "dim",
        className,
      )}
      style={style}
      role="img"
      aria-label={showFace ? `${rankLabel(card.rank)} de ${SUIT_NAME[card.suit]}` : "Carta virada"}
    >
      {showFace ? (
        <div className="card-face">
          <div className="card-corner">
            <span>{rankLabel(card.rank)}</span>
            <span className="suit">{SUIT_SYMBOL[card.suit]}</span>
          </div>
          <div className="card-center">{SUIT_SYMBOL[card.suit]}</div>
        </div>
      ) : (
        <div className="card-back" />
      )}
    </div>
  );
}

/** Espaço vazio no board para cartas ainda não reveladas. */
export function CardSlot() {
  return (
    <div className="card">
      <div className="absolute inset-0 rounded-[inherit] border border-dashed border-white/15 bg-black/10" />
    </div>
  );
}
