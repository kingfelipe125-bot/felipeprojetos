"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { decideBotAction } from "@/lib/poker/ai";
import {
  advance, applyAction, createGame, IllegalActionError, isRoundOver, startHand, winningsById, type SeatSetup,
} from "@/lib/poker/engine";
import { BOT_ROSTER } from "@/lib/poker/personalities";
import type { GameState, PlayerAction } from "@/lib/poker/types";
import type { TableDef } from "@/lib/economy/tables";
import type { HandRecord } from "@/lib/economy/stats";
import type { Speed } from "./settings";

export const HUMAN_SEAT = 0;

const TIMINGS = {
  normal: { think: [800, 1500], collect: 700, quiet: 350, runout: 1300, afterShowdown: 5200, afterFold: 2800 },
  fast: { think: [300, 550], collect: 450, quiet: 200, runout: 750, afterShowdown: 3200, afterFold: 1600 },
} as const;

function makeSeats(table: TableDef, humanStack: number): SeatSetup[] {
  return [
    { id: "you", name: "Você", isHuman: true, stack: humanStack },
    ...BOT_ROSTER.map((b, i) => ({
      id: `bot-${i}`, name: b.name, isHuman: false, personality: b.personality, stack: table.maxBuyIn,
    })),
  ];
}

/** Bots sem fichas recompram automaticamente para manter a mesa cheia. */
function rebuyBots(g: GameState, amount: number): GameState {
  if (!g.players.some((p) => !p.isHuman && p.stack === 0)) return g;
  const next = structuredClone(g);
  for (const p of next.players) {
    if (!p.isHuman && p.stack === 0) {
      p.stack = amount;
      next.logSeq += 1;
      next.log.push({ id: next.logSeq, text: `${p.name} recompra ${amount.toLocaleString("pt-BR")} fichas` });
    }
  }
  return next;
}

export interface HandSummary {
  record: HandRecord;
  note: string;
}

export function summarizeHumanHand(g: GameState): HandSummary | null {
  const me = g.players[HUMAN_SEAT];
  if (!me.inHand || !g.outcome) return null;
  const received = winningsById(g)[me.id] ?? 0;
  const net = me.stack - me.startStack;
  const hand = g.outcome.hands[me.id];
  const note = received > 0
    ? `Mão #${g.handNumber}: venceu${hand ? ` com ${hand.description}` : ""}`
    : `Mão #${g.handNumber}: ${me.folded ? "desistiu" : `perdeu${hand ? ` com ${hand.description}` : ""}`}`;
  return {
    record: { net, received, wentToShowdown: g.outcome.showdown && !me.folded, category: hand?.category ?? null },
    note,
  };
}

interface Options {
  speed: Speed;
  autoDeal: boolean;
  onHandComplete: (summary: HandSummary) => void;
  onHumanStackChange: (stack: number) => void;
}

export function usePokerTable(table: TableDef, options: Options) {
  const [game, setGame] = useState<GameState | null>(null);
  const [thinking, setThinking] = useState<{ seat: number; ms: number; key: string } | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const gameRef = useRef(game);
  gameRef.current = game;
  const optsRef = useRef(options);
  optsRef.current = options;
  const recordedHand = useRef(0);

  const sitDown = useCallback((stack: number) => {
    recordedHand.current = 0;
    setGame(createGame({ smallBlind: table.smallBlind, bigBlind: table.bigBlind }, makeSeats(table, stack)));
  }, [table]);

  const dealNext = useCallback(() => {
    setGame((g) => {
      if (!g || (g.stage !== "idle" && g.stage !== "handOver")) return g;
      if (g.players[HUMAN_SEAT].stack <= 0) return g;
      return startHand(rebuyBots(g, table.maxBuyIn));
    });
  }, [table]);

  const act = useCallback((action: PlayerAction) => {
    const g = gameRef.current;
    if (!g || g.stage !== "betting" || g.currentPlayer !== HUMAN_SEAT) return;
    try {
      setGame(applyAction(g, action));
      setActionError(null);
    } catch (e) {
      if (e instanceof IllegalActionError) setActionError(e.message);
      else throw e;
    }
  }, []);

  const rebuyHuman = useCallback((amount: number) => {
    setGame((g) => {
      if (!g || amount <= 0) return g;
      const next = structuredClone(g);
      next.players[HUMAN_SEAT].stack += amount;
      next.logSeq += 1;
      next.log.push({ id: next.logSeq, text: `Você recompra ${amount.toLocaleString("pt-BR")} fichas` });
      return next;
    });
  }, []);

  // Motor da partida: agenda a próxima etapa conforme o estágio atual.
  useEffect(() => {
    if (!game) return;
    const t = TIMINGS[optsRef.current.speed];
    let timer: ReturnType<typeof setTimeout> | undefined;
    const snapshot = game;

    if (game.stage === "idle") {
      timer = setTimeout(dealNext, 500);
    } else if (game.stage === "betting" && game.currentPlayer !== HUMAN_SEAT) {
      const seat = game.currentPlayer;
      const ms = t.think[0] + Math.random() * (t.think[1] - t.think[0]);
      setThinking({ seat, ms, key: `${game.handNumber}-${game.logSeq}` });
      timer = setTimeout(() => {
        const current = gameRef.current;
        if (current !== snapshot) return;
        setGame(applyAction(current, decideBotAction(current, seat)));
      }, ms);
    } else if (game.stage === "streetEnd") {
      const hadBets = game.players.some((p) => p.bet > 0);
      const actors = game.players.filter((p) => p.inHand && !p.folded && !p.allIn).length;
      const live = game.players.filter((p) => p.inHand && !p.folded).length;
      const runout = live > 1 && actors <= 1 && isRoundOver(game) && game.street !== "river";
      const ms = runout ? t.runout : hadBets ? t.collect : t.quiet;
      timer = setTimeout(() => setGame((g) => (g === snapshot ? advance(g) : g)), ms);
    } else if (game.stage === "handOver") {
      if (recordedHand.current !== game.handNumber) {
        recordedHand.current = game.handNumber;
        const summary = summarizeHumanHand(game);
        if (summary) optsRef.current.onHandComplete(summary);
      }
      if (optsRef.current.autoDeal && game.players[HUMAN_SEAT].stack > 0) {
        timer = setTimeout(dealNext, game.outcome?.showdown ? t.afterShowdown : t.afterFold);
      }
    }
    if (game.stage !== "betting" || game.currentPlayer === HUMAN_SEAT) setThinking(null);
    return () => clearTimeout(timer);
  }, [game, dealNext, options.autoDeal]);

  const humanStack = game?.players[HUMAN_SEAT].stack;
  useEffect(() => {
    if (humanStack !== undefined) optsRef.current.onHumanStackChange(humanStack);
  }, [humanStack]);

  return { game, thinking, actionError, sitDown, dealNext, act, rebuyHuman };
}
