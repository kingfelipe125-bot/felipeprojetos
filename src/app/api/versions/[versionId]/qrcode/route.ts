import { NextResponse } from "next/server";
import QRCode from "qrcode";
import { prisma } from "@/lib/prisma";
import { getVerificationUrl } from "@/lib/qrcode";

export async function GET(_req: Request, { params }: { params: { versionId: string } }) {
  const version = await prisma.documentVersion.findUnique({ where: { id: params.versionId } });
  if (!version) {
    return NextResponse.json({ error: "Versão não encontrada." }, { status: 404 });
  }

  const buffer = await QRCode.toBuffer(getVerificationUrl(version.qrCode), {
    margin: 2,
    width: 512,
    color: { dark: "#0f172a", light: "#ffffff" },
  });

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "image/png",
      "Content-Disposition": `attachment; filename="qrcode-${version.revisionLabel}.png"`,
    },
  });
}
