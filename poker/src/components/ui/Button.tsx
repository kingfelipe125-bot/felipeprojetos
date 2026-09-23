import clsx from "clsx";
import type { ButtonHTMLAttributes } from "react";

type Variant = "gold" | "ghost" | "danger" | "neutral" | "outline";

const styles: Record<Variant, string> = {
  gold: "bg-gradient-to-b from-gold-300 via-gold-400 to-gold-600 text-ink-950 shadow-[0_6px_24px_-6px_rgba(233,194,104,0.6)] hover:brightness-110",
  neutral: "bg-white/10 text-white hover:bg-white/15 border border-white/10",
  ghost: "text-white/80 hover:text-white hover:bg-white/5",
  danger: "bg-rose-500/15 text-rose-200 border border-rose-400/25 hover:bg-rose-500/25",
  outline: "border border-gold-400/50 text-gold-300 hover:bg-gold-400/10",
};

export function Button({ variant = "neutral", className, ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return (
    <button
      {...props}
      className={clsx(
        "inline-flex select-none items-center justify-center gap-2 rounded-xl px-4 py-2.5 font-semibold transition active:scale-[0.98] disabled:pointer-events-none disabled:opacity-40",
        styles[variant],
        className,
      )}
    />
  );
}
