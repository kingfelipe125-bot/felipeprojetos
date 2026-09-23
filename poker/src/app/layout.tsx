import type { Metadata, Viewport } from "next";
import "@fontsource-variable/inter";
import "@fontsource-variable/outfit";
import "./globals.css";
import { EconomyProvider } from "@/state/EconomyContext";

export const metadata: Metadata = {
  title: "Poker Night — Texas Hold'em com moedas virtuais",
  description:
    "Texas Hold'em gratuito contra 5 bots com estilos diferentes. Apenas entretenimento: moedas virtuais, sem valor real, sem compras.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#07090d",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className="font-sans antialiased">
        <EconomyProvider>{children}</EconomyProvider>
      </body>
    </html>
  );
}
