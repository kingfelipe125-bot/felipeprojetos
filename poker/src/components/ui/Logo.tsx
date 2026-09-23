import Link from "next/link";

export function Logo() {
  return (
    <Link href="/" className="group flex items-center gap-2">
      <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-felt-600 to-felt-900 text-lg text-gold-300 shadow-inner ring-1 ring-gold-400/30 transition group-hover:ring-gold-400/60">
        ♠
      </span>
      <span className="font-display text-lg font-semibold tracking-tight text-white">
        Poker <span className="text-gold-grad">Night</span>
      </span>
    </Link>
  );
}
