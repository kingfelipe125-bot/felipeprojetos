import { NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { prisma } from "@/lib/prisma";
import { saveUploadedFile } from "@/lib/storage";
import { formatRevisionLabel } from "@/lib/revision";

export async function POST(req: Request, { params }: { params: { documentId: string } }) {
  const { documentId } = params;

  const document = await prisma.document.findUnique({ where: { id: documentId } });
  if (!document) {
    return NextResponse.json({ error: "Documento não encontrado." }, { status: 404 });
  }

  const formData = await req.formData();
  const authorId = formData.get("authorId");
  const changeReason = formData.get("changeReason");
  const file = formData.get("file");

  if (typeof authorId !== "string" || !authorId) {
    return NextResponse.json({ error: "Autor é obrigatório." }, { status: 400 });
  }
  if (typeof changeReason !== "string" || !changeReason.trim()) {
    return NextResponse.json({ error: "Motivo da alteração é obrigatório." }, { status: 400 });
  }
  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ error: "Arquivo é obrigatório." }, { status: 400 });
  }

  const lastVersion = await prisma.documentVersion.findFirst({
    where: { documentId },
    orderBy: { revisionNumber: "desc" },
  });
  const nextRevisionNumber = (lastVersion?.revisionNumber ?? -1) + 1;

  const { fileName, fileUrl, fileSize } = await saveUploadedFile(file);

  const version = await prisma.$transaction(async (tx) => {
    const created = await tx.documentVersion.create({
      data: {
        documentId,
        revisionNumber: nextRevisionNumber,
        revisionLabel: formatRevisionLabel(nextRevisionNumber),
        status: "RASCUNHO",
        fileName,
        fileUrl,
        fileSize,
        changeReason,
        qrCode: nanoid(10),
        authorId,
      },
      include: { author: true },
    });

    await tx.auditLog.create({
      data: {
        documentVersionId: created.id,
        userId: authorId,
        action: "UPLOAD",
        detail: `Nova revisão ${created.revisionLabel} enviada: ${changeReason}`,
      },
    });

    return created;
  });

  return NextResponse.json({ version }, { status: 201 });
}
