import clsx from "clsx";

/** Moeda estilizada (SVG próprio). */
export function CoinIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={clsx("inline-block", className)} aria-hidden>
      <defs>
        <linearGradient id="coin-g" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#f8e3a6" />
          <stop offset="0.6" stopColor="#d4a64a" />
          <stop offset="1" stopColor="#a97f2f" />
        </linearGradient>
      </defs>
      <circle cx="12" cy="12" r="10.5" fill="url(#coin-g)" stroke="#8a6524" strokeWidth="1" />
      <circle cx="12" cy="12" r="7.5" fill="none" stroke="#8a6524" strokeOpacity="0.55" strokeDasharray="2 1.6" />
      <path d="M12 7.2c1.6 2.1 4 3.4 4 5.4a2.3 2.3 0 0 1-3.6 1.9l.6 2.3h-2l.6-2.3A2.3 2.3 0 0 1 8 12.6c0-2 2.4-3.3 4-5.4z" fill="#7a5a1d" />
    </svg>
  );
}
