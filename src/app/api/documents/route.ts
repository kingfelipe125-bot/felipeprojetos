import { NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { prisma } from "@/lib/prisma";
import { saveUploadedFile } from "@/lib/storage";
import { DISCIPLINES } from "@/lib/constants";
import { formatRevisionLabel } from "@/lib/revision";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get("projectId");

  const documents = await prisma.document.findMany({
    where: projectId ? { projectId } : undefined,
    include: {
      activeVersion: true,
      versions: { orderBy: { revisionNumber: "desc" }, take: 1 },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ documents });
}

export async function POST(req: Request) {
  const formData = await req.formData();

  const projectId = formData.get("projectId");
  const discipline = formData.get("discipline");
  const code = formData.get("code");
  const title = formData.get("title");
  const authorId = formData.get("authorId");
  const changeReason = formData.get("changeReason");
  const file = formData.get("file");

  if (
    typeof projectId !== "string" ||
    typeof discipline !== "string" ||
    typeof code !== "string" ||
    typeof title !== "string" ||
    typeof authorId !== "string" ||
    !(file instanceof File)
  ) {
    return NextResponse.json({ error: "Campos obrigatórios ausentes." }, { status: 400 });
  }

  if (!DISCIPLINES.includes(discipline as (typeof DISCIPLINES)[number])) {
    return NextResponse.json({ error: "Disciplina inválida." }, { status: 400 });
  }

  const existing = await prisma.document.findUnique({
    where: { projectId_code: { projectId, code } },
  });
  if (existing) {
    return NextResponse.json({ error: `Já existe um documento com o código "${code}" neste projeto.` }, { status: 409 });
  }

  const { fileName, fileUrl, fileSize } = await saveUploadedFile(file);

  const document = await prisma.$transaction(async (tx) => {
    const doc = await tx.document.create({
      data: { projectId, discipline, code, title },
    });

    const version = await tx.documentVersion.create({
      data: {
        documentId: doc.id,
        revisionNumber: 0,
        revisionLabel: formatRevisionLabel(0),
        status: "RASCUNHO",
        fileName,
        fileUrl,
        fileSize,
        changeReason: typeof changeReason === "string" && changeReason ? changeReason : "Upload inicial do documento.",
        qrCode: nanoid(10),
        authorId,
      },
    });

    await tx.auditLog.create({
      data: {
        documentVersionId: version.id,
        userId: authorId,
        action: "UPLOAD",
        detail: `Documento criado com a revisão ${version.revisionLabel}.`,
      },
    });

    return tx.document.findUnique({
      where: { id: doc.id },
      include: { versions: true, activeVersion: true },
    });
  });

  return NextResponse.json({ document }, { status: 201 });
}
