import Link from "next/link";

export default function NotFound() {
  return (
    <main className="grid min-h-dvh place-items-center px-4 text-center">
      <div>
        <div className="font-display text-6xl font-bold text-gold-grad">404</div>
        <p className="mt-2 text-white/60">Esta página não está na mesa.</p>
        <Link href="/" className="mt-6 inline-block rounded-xl bg-white/10 px-5 py-2.5 font-semibold text-white hover:bg-white/15">
          Voltar ao início
        </Link>
      </div>
    </main>
  );
}
