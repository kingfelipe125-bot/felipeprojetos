import { VirtualNotice } from "./VirtualNotice";

export function SiteFooter() {
  return (
    <footer className="mx-auto mt-16 flex max-w-6xl flex-col items-center gap-3 px-4 pb-10 text-center text-xs text-white/40">
      <VirtualNotice />
      <p className="max-w-xl">
        Jogo exclusivamente para entretenimento. Não há compras, depósitos, saques nem qualquer forma de converter
        moedas virtuais em dinheiro ou prêmios. Seus dados ficam apenas neste navegador.
      </p>
    </footer>
  );
}
