import QRCode from "qrcode";

export function getAppUrl() {
  if (process.env.NEXT_PUBLIC_APP_URL) return process.env.NEXT_PUBLIC_APP_URL;
  // Fallbacks automáticos da Vercel: domínio de produção, senão a URL do deployment atual.
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3000";
}

export function getVerificationUrl(code: string) {
  return `${getAppUrl()}/v/${code}`;
}

export async function generateQrDataUrl(code: string) {
  const url = getVerificationUrl(code);
  return QRCode.toDataURL(url, {
    margin: 1,
    width: 320,
    color: { dark: "#0f172a", light: "#ffffff" },
  });
}
