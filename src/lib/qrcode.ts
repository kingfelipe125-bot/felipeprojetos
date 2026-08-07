import QRCode from "qrcode";

export function getAppUrl() {
  return process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
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
