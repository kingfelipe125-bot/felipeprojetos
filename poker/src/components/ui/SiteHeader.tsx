"use client";

import clsx from "clsx";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BalancePill } from "./BalancePill";
import { Logo } from "./Logo";

const LINKS = [
  { href: "/jogar/", label: "Jogar" },
  { href: "/como-jogar/", label: "Como jogar" },
  { href: "/estatisticas/", label: "Estatísticas" },
];

export function SiteHeader() {
  const path = usePathname();
  return (
    <header className="sticky top-0 z-40 border-b border-white/5 bg-ink-950/70 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-3 px-4">
        <Logo />
        <nav className="hidden items-center gap-1 md:flex">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={clsx(
                "rounded-lg px-3 py-1.5 text-sm font-medium transition",
                path?.startsWith(l.href.replace(/\/$/, "")) ? "bg-white/10 text-white" : "text-white/60 hover:text-white",
              )}
            >
              {l.label}
            </Link>
          ))}
        </nav>
        <BalancePill />
      </div>
      <nav className="flex justify-center gap-1 border-t border-white/5 px-2 py-1 md:hidden">
        {LINKS.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className={clsx(
              "rounded-md px-3 py-1 text-xs font-medium",
              path?.startsWith(l.href.replace(/\/$/, "")) ? "bg-white/10 text-white" : "text-white/60",
            )}
          >
            {l.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
