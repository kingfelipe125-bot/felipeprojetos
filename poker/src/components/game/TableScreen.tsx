"use client";

import clsx from "clsx";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, Gauge, LogOut, ScrollText, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { CoinIcon } from "@/components/ui/CoinIcon";
import { FreeCoinsButton } from "@/components/ui/FreeCoinsButton";
import { VirtualNotice } from "@/components/ui/VirtualNotice";
import { formatCoins } from "@/lib/format";
import { findTable, TABLES } from "@/lib/economy/tables";
import { getLegalActions, potTotal } from "@/lib/poker/engine";
import { useEconomy } from "@/state/EconomyContext";
import { useSettings } from "@/state/settings";
import { HUMAN_SEAT, usePokerTable } from "@/state/usePokerTable";
import { ActionBar } from "./ActionBar";
import { describeCurrentHand } from "./handLabel";
import { HandLog } from "./HandLog";
import { PokerTable } from "./PokerTable";

export function TableScreen({ tableId }: { tableId: string }) {
  const table = findTable(tableId) ?? TABLES[0];
  const router = useRouter();
  const economy = useEconomy();
  const [settings, updateSettings] = useSettings();
  const [seated, setSeated] = useState(false);
  const [showLog, setShowLog] = useState(false);

  const { game, thinking, actionError, sitDown, dealNext, act, rebuyHuman } = usePokerTable(table, {
    speed: settings.speed,
    autoDeal: settings.autoDeal,
    onHandComplete: (s) => economy.recordHand(s.record, s.note),
    onHumanStackChange: economy.updateSeatStack,
  });

  // Sair da mesa: fichas voltam para a carteira. Uma mão em andamento conta como desistência.
  const gameRef = useRef(game);
  gameRef.current = game;
  const economyRef = useRef(economy);
  economyRef.current = economy;
  const seatedRef = useRef(seated);
  seatedRef.current = seated;

  const leave = useCallback(() => {
    if (!seatedRef.current) return;
    seatedRef.current = false;
    const g = gameRef.current;
    const me = g?.players[HUMAN_SEAT];
    if (g && me && me.inHand && g.stage !== "handOver" && g.stage !== "idle") {
      const net = me.stack - me.startStack;
      economyRef.current.recordHand(
        { net, received: 0, wentToShowdown: false, category: null },
        `Mão #${g.handNumber}: saiu da mesa`,
      );
    }
    economyRef.current.leaveTable();
    setSeated(false);
  }, []);

  useEffect(() => () => leave(), [leave]);

  const onLeaveClick = () => {
    leave();
    router.push("/jogar/");
  };

  const me = game?.players[HUMAN_SEAT];
  const legal = game && game.currentPlayer === HUMAN_SEAT ? getLegalActions(game, HUMAN_SEAT) : null;
  const myHand = me && me.inHand ? describeCurrentHand(me.hole, game!.community) : null;
  const handInProgress = !!game && game.stage !== "handOver" && game.stage !== "idle";
  const busted = !!game && !!me && me.stack === 0 && !handInProgress;

  const waitingText = useMemo(() => {
    if (!game) return null;
    if (game.stage === "betting" && game.currentPlayer !== HUMAN_SEAT) {
      return `${game.players[game.currentPlayer].name} está pensando…`;
    }
    if (game.stage === "streetEnd") return "Recolhendo apostas…";
    if (me?.folded && handInProgress) return "Você desistiu desta mão.";
    return null;
  }, [game, me, handInProgress]);

  if (!economy.ready) return <div className="grid h-dvh place-items-center text-white/50">Carregando…</div>;

  return (
    <div className="flex h-dvh flex-col overflow-hidden">
      {/* Barra superior */}
      <header className="flex h-12 shrink-0 items-center justify-between gap-2 border-b border-white/5 bg-ink-950/70 px-3 backdrop-blur">
        <div className="flex min-w-0 items-center gap-2">
          <button onClick={onLeaveClick} className="grid h-8 w-8 place-items-center rounded-lg text-white/70 hover:bg-white/10 hover:text-white" aria-label="Sair da mesa">
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold text-white">{table.name}</div>
            <div className="text-[11px] tabular-nums text-white/50">
              Blinds {formatCoins(table.smallBlind)}/{formatCoins(table.bigBlind)}
              {game && game.handNumber > 0 && ` · Mão #${game.handNumber}`}
            </div>
          </div>
        </div>
        <VirtualNotice compact className="hidden sm:inline-flex" />
        <div className="flex items-center gap-1">
          <div className="mr-1 hidden items-center gap-1.5 rounded-full bg-black/40 px-2.5 py-1 text-xs md:flex" title="Saldo da carteira fora da mesa">
            <CoinIcon className="h-4 w-4" />
            <span className="text-white/50">Carteira</span>
            <span className="font-display font-semibold tabular-nums text-gold-300">{formatCoins(economy.wallet.balance)}</span>
          </div>
          <button
            onClick={() => updateSettings({ speed: settings.speed === "normal" ? "fast" : "normal" })}
            className="flex h-8 items-center gap-1 rounded-lg px-2 text-xs text-white/70 hover:bg-white/10 hover:text-white"
            title="Velocidade dos bots"
          >
            <Gauge className="h-4 w-4" />
            <span className="hidden sm:inline">{settings.speed === "normal" ? "Normal" : "Rápido"}</span>
          </button>
          <button
            onClick={() => setShowLog((v) => !v)}
            className={clsx("grid h-8 w-8 place-items-center rounded-lg hover:bg-white/10 xl:hidden", showLog ? "text-gold-300" : "text-white/70")}
            aria-label="Histórico da mão"
          >
            <ScrollText className="h-4 w-4" />
          </button>
          <button onClick={onLeaveClick} className="flex h-8 items-center gap-1 rounded-lg px-2 text-xs text-white/70 hover:bg-white/10 hover:text-white">
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Sair</span>
          </button>
        </div>
      </header>

      <div className="relative flex min-h-0 flex-1">
        {/* Mesa */}
        <main className="flex min-w-0 flex-1 items-center justify-center px-2 pb-1 pt-10 sm:px-6 sm:pt-12">
          {game ? (
            <PokerTable game={game} thinking={thinking} />
          ) : (
            <div className="table-wrap">
              <div className="table-rail"><div className="table-felt" /></div>
            </div>
          )}
        </main>

        {/* Histórico de ações */}
        <aside
          className={clsx(
            "panel absolute inset-y-2 right-2 z-50 w-72 flex-col rounded-xl p-3 xl:static xl:m-2 xl:flex",
            showLog ? "flex" : "hidden",
          )}
        >
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-white">Histórico da mesa</h2>
            <button onClick={() => setShowLog(false)} className="text-white/50 hover:text-white xl:hidden" aria-label="Fechar">
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="min-h-0 flex-1">
            <HandLog entries={game?.log ?? []} />
          </div>
        </aside>
      </div>

      {/* Ações do jogador */}
      <footer className="shrink-0 border-t border-white/5 bg-ink-950/80 px-3 pb-[max(12px,env(safe-area-inset-bottom))] pt-2 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-2 pb-2 text-xs sm:text-sm">
          <div className="min-w-0 truncate text-white/70">
            {myHand ? (
              <>Sua mão: <span className="font-semibold text-white">{myHand}</span></>
            ) : (
              <span className="text-white/40">Texas Hold&apos;em No-Limit</span>
            )}
          </div>
          {me && (
            <div className="shrink-0 tabular-nums text-white/60">
              Na mesa: <span className="font-display font-semibold text-gold-300">{formatCoins(me.stack)}</span>
            </div>
          )}
        </div>
        {actionError && <div className="mb-2 text-center text-xs text-rose-300">{actionError}</div>}

        {game?.stage === "handOver" && !busted ? (
          <div className="mx-auto flex max-w-3xl items-center justify-center gap-3">
            <Button variant="gold" onClick={dealNext} className="min-w-[180px]">
              Próxima mão
            </Button>
            <label className="flex cursor-pointer items-center gap-2 text-xs text-white/60">
              <input
                type="checkbox"
                checked={settings.autoDeal}
                onChange={(e) => updateSettings({ autoDeal: e.target.checked })}
                className="accent-amber-400"
              />
              Automático
            </label>
          </div>
        ) : (
          <ActionBar
            legal={legal}
            pot={game ? potTotal(game) : 0}
            currentBet={game?.currentBet ?? 0}
            myBet={me?.bet ?? 0}
            stack={me?.stack ?? 0}
            bigBlind={table.bigBlind}
            onAct={act}
            waitingText={waitingText}
          />
        )}
      </footer>

      {!seated && (
        <BuyInDialog
          tableId={table.id}
          onConfirm={(amount) => {
            economy.buyIn(table.id, amount);
            sitDown(amount);
            setSeated(true);
          }}
        />
      )}
      {seated && busted && (
        <RebuyDialog
          tableId={table.id}
          onRebuy={(amount) => {
            economy.addToSeat(amount);
            rebuyHuman(amount);
          }}
          onLeave={onLeaveClick}
        />
      )}
    </div>
  );
}

function Modal({ children }: { children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-[60] grid place-items-center bg-black/65 p-4 backdrop-blur-sm">
      <div className="panel pop-in w-full max-w-sm rounded-2xl bg-ink-900/95 p-6 shadow-2xl">{children}</div>
    </div>
  );
}

function BuyInPicker({ min, max, value, onChange }: { min: number; max: number; value: number; onChange: (v: number) => void }) {
  const pct = max > min ? ((value - min) / (max - min)) * 100 : 100;
  return (
    <div className="mt-4">
      <div className="flex items-center justify-center gap-2 font-display text-3xl font-bold tabular-nums text-white">
        <CoinIcon className="h-7 w-7" /> {formatCoins(value)}
      </div>
      {max > min && (
        <>
          <input
            type="range"
            className="raise-slider mt-4 w-full"
            min={min}
            max={max}
            step={min / 4}
            value={value}
            onChange={(e) => onChange(Number(e.target.value))}
            style={{ ["--pct" as string]: `${pct}%` }}
            aria-label="Valor do buy-in"
          />
          <div className="mt-1 flex justify-between text-[11px] text-white/45">
            <span>{formatCoins(min)}</span>
            <span>{formatCoins(max)}</span>
          </div>
        </>
      )}
    </div>
  );
}

function BuyInDialog({ tableId, onConfirm }: { tableId: string; onConfirm: (amount: number) => void }) {
  const table = findTable(tableId)!;
  const { wallet } = useEconomy();
  const max = Math.min(table.maxBuyIn, wallet.balance);
  const [amount, setAmount] = useState(max);
  useEffect(() => setAmount(Math.min(table.maxBuyIn, wallet.balance)), [table.maxBuyIn, wallet.balance]);
  const canAfford = wallet.balance >= table.minBuyIn;

  return (
    <Modal>
      <h2 className="font-display text-xl font-semibold text-white">Sentar em {table.name}</h2>
      <p className="mt-1 text-sm text-white/60">Quantas moedas virtuais levar para a mesa?</p>
      {canAfford ? (
        <>
          <BuyInPicker min={table.minBuyIn} max={max} value={amount} onChange={setAmount} />
          <Button variant="gold" className="mt-5 w-full" onClick={() => onConfirm(amount)}>
            Sentar e jogar
          </Button>
        </>
      ) : (
        <>
          <p className="mt-4 rounded-lg bg-rose-500/10 p-3 text-sm text-rose-200">
            Você precisa de pelo menos {formatCoins(table.minBuyIn)} moedas para esta mesa (saldo: {formatCoins(wallet.balance)}).
          </p>
          <FreeCoinsButton className="mt-4" />
        </>
      )}
      <div className="mt-4 flex items-center justify-between">
        <Link href="/jogar/" className="text-sm text-white/60 hover:text-white">
          Voltar ao lobby
        </Link>
        <VirtualNotice compact />
      </div>
    </Modal>
  );
}

function RebuyDialog({ tableId, onRebuy, onLeave }: { tableId: string; onRebuy: (amount: number) => void; onLeave: () => void }) {
  const table = findTable(tableId)!;
  const { wallet } = useEconomy();
  const max = Math.min(table.maxBuyIn, wallet.balance);
  const [amount, setAmount] = useState(max);
  useEffect(() => setAmount(Math.min(table.maxBuyIn, wallet.balance)), [table.maxBuyIn, wallet.balance]);
  const canAfford = wallet.balance >= table.minBuyIn;

  return (
    <Modal>
      <h2 className="font-display text-xl font-semibold text-white">Suas fichas acabaram</h2>
      <p className="mt-1 text-sm text-white/60">Faça uma recompra com moedas virtuais da carteira ou volte ao lobby.</p>
      {canAfford ? (
        <>
          <BuyInPicker min={table.minBuyIn} max={max} value={amount} onChange={setAmount} />
          <Button variant="gold" className="mt-5 w-full" onClick={() => onRebuy(amount)}>
            Recomprar
          </Button>
        </>
      ) : (
        <>
          <p className="mt-4 text-sm text-white/60">Saldo na carteira: {formatCoins(wallet.balance)} moedas.</p>
          <FreeCoinsButton className="mt-4" />
        </>
      )}
      <Button variant="ghost" className="mt-3 w-full" onClick={onLeave}>
        Sair da mesa
      </Button>
    </Modal>
  );
}
