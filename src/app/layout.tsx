import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Gerenciador de Versões CAD/BIM",
  description: "Controle de revisões e validação de plantas de arquitetura e engenharia por QR Code.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className="min-h-screen bg-secondary/40 font-sans antialiased">{children}</body>
    </html>
  );
}
