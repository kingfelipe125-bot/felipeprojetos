import Link from "next/link";
import { Building2 } from "lucide-react";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
        <Link href="/" className="flex items-center gap-2 font-semibold text-foreground">
          <span className="flex h-9 w-9 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <Building2 className="h-5 w-5" />
          </span>
          <span className="flex flex-col leading-tight">
            <span className="text-sm sm:text-base">Gerenciador de Versões</span>
            <span className="text-xs font-normal text-muted-foreground">CAD/BIM · Construção Civil</span>
          </span>
        </Link>
      </div>
    </header>
  );
}
