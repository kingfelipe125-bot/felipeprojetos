import clsx from "clsx";
import { formatCompact } from "@/lib/format";

const DENOMS: { value: number; color: string }[] = [
  { value: 10_000, color: "#7c3aed" },
  { value: 1_000, color: "#111827" },
  { value: 500, color: "#d97706" },
  { value: 100, color: "#0f766e" },
  { value: 25, color: "#1d4ed8" },
  { value: 5, color: "#b91c1c" },
  { value: 1, color: "#9ca3af" },
];

/** Escolhe até 5 fichas representando o valor (só visual). */
function chipsFor(amount: number): string[] {
  const out: string[] = [];
  let rest = amount;
  for (const d of DENOMS) {
    while (rest >= d.value && out.length < 5) {
      out.push(d.color);
      rest -= d.value;
    }
  }
  return out.length ? out : [DENOMS[DENOMS.length - 1].color];
}

export function ChipStack({ amount, className, label = true }: { amount: number; className?: string; label?: boolean }) {
  const chips = chipsFor(amount);
  return (
    <div className={clsx("flex items-center gap-1.5", className)}>
      <div className="relative h-[26px] w-[18px]">
        {chips.map((color, i) => (
          <div
            key={i}
            className="chip absolute left-0"
            style={{ ["--chip" as string]: color, bottom: i * 3 }}
          />
        ))}
      </div>
      {label && (
        <span className="rounded-full bg-black/55 px-2 py-0.5 font-display text-[11px] font-semibold tabular-nums text-white shadow sm:text-xs">
          {formatCompact(amount)}
        </span>
      )}
    </div>
  );
}
