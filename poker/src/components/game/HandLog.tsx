"use client";

import clsx from "clsx";
import { useEffect, useRef } from "react";
import type { LogEntry } from "@/lib/poker/types";

export function HandLog({ entries }: { entries: LogEntry[] }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    ref.current?.scrollTo({ top: ref.current.scrollHeight, behavior: "smooth" });
  }, [entries.length]);

  return (
    <div ref={ref} className="h-full space-y-1 overflow-y-auto pr-1 text-[13px] leading-snug">
      {entries.map((e) => (
        <div
          key={e.id}
          className={clsx(
            e.tone === "street" && "pt-1 font-semibold text-sky-200",
            e.tone === "win" && "font-semibold text-gold-300",
            !e.tone && "text-white/70",
          )}
        >
          {e.text}
        </div>
      ))}
      {entries.length === 0 && <div className="text-white/40">As ações da mesa aparecem aqui.</div>}
    </div>
  );
}
