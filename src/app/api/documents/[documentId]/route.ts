import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(_req: Request, { params }: { params: { documentId: string } }) {
  const document = await prisma.document.findUnique({
    where: { id: params.documentId },
    include: {
      project: true,
      activeVersion: true,
      versions: {
        orderBy: { revisionNumber: "desc" },
        include: {
          author: true,
          auditLogs: { orderBy: { createdAt: "desc" }, include: { user: true } },
        },
      },
    },
  });

  if (!document) {
    return NextResponse.json({ error: "Documento não encontrado." }, { status: 404 });
  }

  return NextResponse.json({ document });
}
