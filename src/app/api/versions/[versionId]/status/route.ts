import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { STATUS_TRANSITIONS, STATUS_LABELS, STATUSES } from "@/lib/constants";

const bodySchema = z.object({
  status: z.enum(STATUSES),
  userId: z.string().min(1),
  note: z.string().optional(),
});

export async function PATCH(req: Request, { params }: { params: { versionId: string } }) {
  const { versionId } = params;
  const parsed = bodySchema.safeParse(await req.json());

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const { status: nextStatus, userId, note } = parsed.data;

  const version = await prisma.documentVersion.findUnique({
    where: { id: versionId },
    include: { document: { include: { activeVersion: true } } },
  });
  if (!version) {
    return NextResponse.json({ error: "Versão não encontrada." }, { status: 404 });
  }

  const currentStatus = version.status as (typeof STATUSES)[number];
  const allowed = STATUS_TRANSITIONS[currentStatus] ?? [];
  if (!allowed.includes(nextStatus)) {
    return NextResponse.json(
      { error: `Transição inválida: ${STATUS_LABELS[currentStatus]} → ${STATUS_LABELS[nextStatus]}.` },
      { status: 400 }
    );
  }

  const updated = await prisma.$transaction(async (tx) => {
    const document = version.document;
    const previousActive = document.activeVersion;

    if (nextStatus === "APROVADO_PARA_OBRA") {
      if (previousActive && previousActive.id !== version.id) {
        await tx.documentVersion.update({
          where: { id: previousActive.id },
          data: { status: "OBSOLETO" },
        });
        await tx.auditLog.create({
          data: {
            documentVersionId: previousActive.id,
            userId,
            action: "STATUS_CHANGE",
            detail: `Marcada como Obsoleta: substituída pela revisão ${version.revisionLabel}.`,
          },
        });
      }

      await tx.document.update({
        where: { id: document.id },
        data: { activeVersionId: version.id },
      });
    }

    if (nextStatus === "OBSOLETO" && previousActive?.id === version.id) {
      await tx.document.update({
        where: { id: document.id },
        data: { activeVersionId: null },
      });
    }

    const newVersion = await tx.documentVersion.update({
      where: { id: version.id },
      data: { status: nextStatus },
      include: { author: true },
    });

    await tx.auditLog.create({
      data: {
        documentVersionId: version.id,
        userId,
        action: "STATUS_CHANGE",
        detail:
          `Status alterado de "${STATUS_LABELS[currentStatus]}" para "${STATUS_LABELS[nextStatus]}".` +
          (note ? ` Observação: ${note}` : ""),
      },
    });

    return newVersion;
  });

  return NextResponse.json({ version: updated });
}
