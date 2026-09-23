"use client";

import clsx from "clsx";
import { formatSigned } from "@/lib/format";
import type { HistoryEntry } from "@/lib/economy/wallet";

const dateFmt = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });

export function HistoryList({ entries, limit }: { entries: HistoryEntry[]; limit?: number }) {
  const list = limit ? entries.slice(0, limit) : entries;
  if (list.length === 0) return <p className="py-4 text-center text-sm text-white/40">Nenhum registro ainda.</p>;
  return (
    <ul className="divide-y divide-white/5">
      {list.map((e) => (
        <li key={e.id} className="flex items-center justify-between gap-3 py-2 text-sm">
          <div className="min-w-0">
            <div className="truncate text-white/85">{e.note}</div>
            <div className="text-[11px] text-white/40">{dateFmt.format(e.at)}</div>
          </div>
          <span
            className={clsx(
              "shrink-0 font-display font-semibold tabular-nums",
              e.amount > 0 ? "text-emerald-300" : "text-rose-300",
            )}
          >
            {formatSigned(e.amount)}
          </span>
        </li>
      ))}
    </ul>
  );
}
