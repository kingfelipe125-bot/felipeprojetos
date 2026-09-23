import clsx from "clsx";
import { ShieldCheck } from "lucide-react";

/** Aviso obrigatório: as moedas do jogo não têm valor real. */
export function VirtualNotice({ className, compact }: { className?: string; compact?: boolean }) {
  return (
    <div
      className={clsx(
        "inline-flex items-center gap-1.5 rounded-full border border-emerald-400/25 bg-emerald-400/10 font-medium text-emerald-200",
        compact ? "px-2 py-0.5 text-[10px] sm:text-[11px]" : "px-3 py-1 text-xs sm:text-sm",
        className,
      )}
    >
      <ShieldCheck className={compact ? "h-3 w-3" : "h-4 w-4"} aria-hidden />
      Moedas virtuais — sem valor real
    </div>
  );
}
