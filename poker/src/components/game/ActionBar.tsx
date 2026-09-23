"use client";

import clsx from "clsx";
import { useEffect, useMemo, useState } from "react";
import { formatCoins } from "@/lib/format";
import type { LegalActions, PlayerAction } from "@/lib/poker/types";

interface Props {
  legal: LegalActions | null;
  /** Pote total, incluindo as apostas da rodada. */
  pot: number;
  currentBet: number;
  myBet: number;
  stack: number;
  bigBlind: number;
  onAct: (action: PlayerAction) => void;
  waitingText: string | null;
}

export function ActionBar({ legal, pot, currentBet, myBet, stack, bigBlind, onAct, waitingText }: Props) {
  const myTurn = !!legal?.canFold;
  const [raiseTo, setRaiseTo] = useState(0);

  useEffect(() => {
    if (legal?.canRaise) setRaiseTo(legal.minRaiseTo);
  }, [legal?.canRaise, legal?.minRaiseTo]);

  const presets = useMemo(() => {
    if (!legal?.canRaise) return [];
    const toCall = currentBet - myBet;
    const potAfterCall = pot + toCall;
    const clamp = (v: number) => Math.max(legal.minRaiseTo, Math.min(legal.maxRaiseTo, Math.round(v / bigBlind * 2) * bigBlind / 2));
    const size = (f: number) => clamp(currentBet + potAfterCall * f);
    return [
      { label: "Mín", value: legal.minRaiseTo },
      { label: "½ Pote", value: size(0.5) },
      { label: "¾ Pote", value: size(0.75) },
      { label: "Pote", value: size(1) },
    ];
  }, [legal, pot, currentBet, myBet, bigBlind]);

  // Atalhos de teclado: F = fold, C = check/call, R = raise.
  useEffect(() => {
    if (!myTurn || !legal) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement && e.target.type === "number") return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const k = e.key.toLowerCase();
      if (k === "f") onAct({ type: "fold" });
      else if (k === "c") onAct(legal.canCheck ? { type: "check" } : { type: "call" });
      else if (k === "r" && legal.canRaise) onAct(raiseTo >= legal.maxRaiseTo ? { type: "allin" } : { type: "raise", to: raiseTo });
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [myTurn, legal, raiseTo, onAct]);

  if (!myTurn || !legal) {
    return (
      <div className="flex h-full min-h-[64px] items-center justify-center text-sm text-white/60">
        {waitingText}
      </div>
    );
  }

  const isAllInRaise = legal.canRaise && raiseTo >= legal.maxRaiseTo;
  const pct = legal.canRaise && legal.maxRaiseTo > legal.minRaiseTo
    ? ((raiseTo - legal.minRaiseTo) / (legal.maxRaiseTo - legal.minRaiseTo)) * 100
    : 100;
  const callIsAllIn = legal.canCall && legal.callAmount >= stack;

  return (
    <div className="fade-up mx-auto flex w-full max-w-3xl flex-col gap-2.5">
      {legal.canRaise && (
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex gap-1.5">
            {presets.map((p) => (
              <button
                key={p.label}
                onClick={() => setRaiseTo(p.value)}
                className={clsx(
                  "rounded-lg border px-2.5 py-1 text-xs font-semibold transition sm:text-[13px]",
                  raiseTo === p.value ? "border-gold-400 bg-gold-400/15 text-gold-300" : "border-white/10 bg-white/5 text-white/80 hover:bg-white/10",
                )}
              >
                {p.label}
              </button>
            ))}
          </div>
          <input
            type="range"
            className="raise-slider min-w-[120px] flex-1"
            min={legal.minRaiseTo}
            max={legal.maxRaiseTo}
            step={Math.max(1, Math.floor(bigBlind / 2))}
            value={raiseTo}
            onChange={(e) => setRaiseTo(Number(e.target.value))}
            style={{ ["--pct" as string]: `${pct}%` }}
            aria-label="Valor do aumento"
          />
          <input
            type="number"
            inputMode="numeric"
            className="hidden w-24 rounded-lg border border-white/10 bg-black/40 px-2 py-1 text-right sm:block font-display text-sm tabular-nums text-white outline-none focus:border-gold-400"
            min={legal.minRaiseTo}
            max={legal.maxRaiseTo}
            value={raiseTo}
            onChange={(e) => setRaiseTo(Number(e.target.value))}
            onBlur={() => setRaiseTo((v) => Math.max(legal.minRaiseTo, Math.min(legal.maxRaiseTo, Math.floor(v) || legal.minRaiseTo)))}
            aria-label="Aumentar para"
          />
        </div>
      )}

      <div className="grid grid-cols-4 gap-2">
        <ActionButton tone="fold" onClick={() => onAct({ type: "fold" })} label="Fold" hint="F" />
        {legal.canCheck ? (
          <ActionButton tone="check" onClick={() => onAct({ type: "check" })} label="Check" hint="C" />
        ) : (
          <ActionButton
            tone="check"
            onClick={() => onAct({ type: "call" })}
            label={callIsAllIn ? "Call all-in" : "Call"}
            amount={legal.callAmount}
            hint="C"
          />
        )}
        <ActionButton
          tone="raise"
          disabled={!legal.canRaise}
          onClick={() => onAct(isAllInRaise ? { type: "allin" } : { type: "raise", to: Math.max(legal.minRaiseTo, Math.min(legal.maxRaiseTo, raiseTo)) })}
          label={legal.isBet ? "Bet" : "Raise"}
          amount={legal.canRaise ? raiseTo : undefined}
          hint="R"
        />
        <ActionButton
          tone="allin"
          disabled={!legal.canAllIn}
          onClick={() => onAct({ type: "allin" })}
          label="All-in"
          amount={stack + myBet}
        />
      </div>
    </div>
  );
}

const TONES = {
  fold: "bg-zinc-800/90 hover:bg-zinc-700 text-zinc-100 border-zinc-600/40",
  check: "bg-sky-600/90 hover:bg-sky-500 text-white border-sky-300/30",
  raise: "bg-gradient-to-b from-gold-300 to-gold-600 hover:brightness-110 text-ink-950 border-gold-300/50",
  allin: "bg-rose-600/90 hover:bg-rose-500 text-white border-rose-300/30",
};

function ActionButton({ tone, label, amount, hint, onClick, disabled }: {
  tone: keyof typeof TONES; label: string; amount?: number; hint?: string; onClick: () => void; disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={clsx(
        "relative flex min-h-[52px] flex-col items-center justify-center rounded-xl border px-1 py-1.5 font-semibold shadow-lg transition active:scale-[0.97] disabled:opacity-30 disabled:pointer-events-none",
        TONES[tone],
      )}
    >
      <span className="text-sm leading-tight sm:text-base">{label}</span>
      {amount !== undefined && <span className="font-display text-[11px] tabular-nums opacity-90 sm:text-xs">{formatCoins(amount)}</span>}
      {hint && <kbd className="absolute right-1.5 top-1 hidden text-[9px] font-medium opacity-50 lg:block">{hint}</kbd>}
    </button>
  );
}
