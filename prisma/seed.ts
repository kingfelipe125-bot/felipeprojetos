import { PrismaClient } from "@prisma/client";
import { nanoid } from "nanoid";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { formatRevisionLabel } from "../src/lib/revision";
import { STATUS_LABELS, type DocumentStatus } from "../src/lib/constants";

const prisma = new PrismaClient();

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");

async function writeDummyFile(label: string) {
  const fileName = `seed-${nanoid(10)}.pdf`;
  await mkdir(UPLOAD_DIR, { recursive: true });
  const content = `Arquivo de demonstração — ${label}\nGerenciador de Versões CAD/BIM\n`;
  await writeFile(path.join(UPLOAD_DIR, fileName), content, "utf-8");
  return { fileUrl: `/uploads/${fileName}`, fileSize: Buffer.byteLength(content) };
}

function daysAgo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

async function main() {
  console.log("Limpando dados existentes...");
  await prisma.auditLog.deleteMany();
  await prisma.documentVersion.deleteMany();
  await prisma.document.deleteMany();
  await prisma.project.deleteMany();
  await prisma.user.deleteMany();

  console.log("Criando usuários...");
  const [ana, carlos, beatriz, joao] = await Promise.all([
    prisma.user.create({ data: { name: "Ana Souza", email: "ana.souza@example.com", role: "COORDENADOR" } }),
    prisma.user.create({ data: { name: "Carlos Lima", email: "carlos.lima@example.com", role: "ENGENHEIRO" } }),
    prisma.user.create({ data: { name: "Beatriz Alves", email: "beatriz.alves@example.com", role: "ENGENHEIRO" } }),
    prisma.user.create({ data: { name: "João Pereira", email: "joao.pereira@example.com", role: "OBRA" } }),
  ]);

  console.log("Criando projetos...");
  const horizon = await prisma.project.create({
    data: {
      name: "Edifício Horizon",
      client: "Construtora Alfa",
      location: "São Paulo, SP",
      description: "Edifício residencial de 18 pavimentos com 2 torres e área de lazer completa.",
    },
  });

  const bosque = await prisma.project.create({
    data: {
      name: "Residencial Bosque Verde",
      client: "Incorporadora Beta",
      location: "Curitiba, PR",
      description: "Condomínio horizontal com 40 unidades e clube privativo.",
    },
  });

  // Helper: cria um Document já com sua primeira versão (R00) + log de upload.
  async function createDocument(opts: {
    projectId: string;
    discipline: string;
    code: string;
    title: string;
    authorId: string;
    createdAt: Date;
    changeReason: string;
  }) {
    const { fileUrl, fileSize } = await writeDummyFile(`${opts.code} - ${opts.title} - R00`);
    const document = await prisma.document.create({
      data: {
        projectId: opts.projectId,
        discipline: opts.discipline,
        code: opts.code,
        title: opts.title,
        createdAt: opts.createdAt,
        updatedAt: opts.createdAt,
      },
    });
    const version = await prisma.documentVersion.create({
      data: {
        documentId: document.id,
        revisionNumber: 0,
        revisionLabel: formatRevisionLabel(0),
        status: "RASCUNHO",
        fileName: `${opts.code}-R00.pdf`,
        fileUrl,
        fileSize,
        changeReason: opts.changeReason,
        qrCode: nanoid(10),
        authorId: opts.authorId,
        createdAt: opts.createdAt,
      },
    });
    await prisma.auditLog.create({
      data: {
        documentVersionId: version.id,
        userId: opts.authorId,
        action: "UPLOAD",
        detail: `Documento criado com a revisão ${version.revisionLabel}.`,
        createdAt: opts.createdAt,
      },
    });
    return { document, version };
  }

  // Helper: adiciona uma nova revisão a um documento existente.
  async function addVersion(opts: {
    documentId: string;
    code: string;
    title: string;
    authorId: string;
    createdAt: Date;
    changeReason: string;
    previousRevisionNumber: number;
  }) {
    const revisionNumber = opts.previousRevisionNumber + 1;
    const revisionLabel = formatRevisionLabel(revisionNumber);
    const { fileUrl, fileSize } = await writeDummyFile(`${opts.code} - ${opts.title} - ${revisionLabel}`);
    const version = await prisma.documentVersion.create({
      data: {
        documentId: opts.documentId,
        revisionNumber,
        revisionLabel,
        status: "RASCUNHO",
        fileName: `${opts.code}-${revisionLabel}.pdf`,
        fileUrl,
        fileSize,
        changeReason: opts.changeReason,
        qrCode: nanoid(10),
        authorId: opts.authorId,
        createdAt: opts.createdAt,
      },
    });
    await prisma.auditLog.create({
      data: {
        documentVersionId: version.id,
        userId: opts.authorId,
        action: "UPLOAD",
        detail: `Nova revisão ${revisionLabel} enviada: ${opts.changeReason}`,
        createdAt: opts.createdAt,
      },
    });
    return version;
  }

  // Helper: aplica uma transição de status (mesma lógica do endpoint PATCH /status).
  async function changeStatus(opts: {
    documentId: string;
    versionId: string;
    from: string;
    to: string;
    userId: string;
    createdAt: Date;
  }) {
    if (opts.to === "APROVADO_PARA_OBRA") {
      const doc = await prisma.document.findUnique({ where: { id: opts.documentId } });
      if (doc?.activeVersionId && doc.activeVersionId !== opts.versionId) {
        const approvingVersion = await prisma.documentVersion.findUnique({ where: { id: opts.versionId } });
        const prev = await prisma.documentVersion.update({
          where: { id: doc.activeVersionId },
          data: { status: "OBSOLETO" },
        });
        await prisma.auditLog.create({
          data: {
            documentVersionId: prev.id,
            userId: opts.userId,
            action: "STATUS_CHANGE",
            detail: `Marcada como Obsoleta: substituída pela revisão ${approvingVersion?.revisionLabel}.`,
            createdAt: opts.createdAt,
          },
        });
      }
      await prisma.document.update({ where: { id: opts.documentId }, data: { activeVersionId: opts.versionId } });
    }

    const version = await prisma.documentVersion.update({
      where: { id: opts.versionId },
      data: { status: opts.to },
    });

    await prisma.auditLog.create({
      data: {
        documentVersionId: opts.versionId,
        userId: opts.userId,
        action: "STATUS_CHANGE",
        detail: `Status alterado de "${STATUS_LABELS[opts.from as DocumentStatus]}" para "${STATUS_LABELS[opts.to as DocumentStatus]}".`,
        createdAt: opts.createdAt,
      },
    });

    return version;
  }

  console.log("Criando documentos e histórico de revisões...");

  // 1) Arquitetura — fluxo completo: R00 aprovada e depois substituída pela R01.
  const arq = await createDocument({
    projectId: horizon.id,
    discipline: "ARQUITETURA",
    code: "ARQ-001",
    title: "Planta Baixa - Pavimento Térreo",
    authorId: carlos.id,
    createdAt: daysAgo(25),
    changeReason: "Emissão inicial para revisão interna.",
  });
  await changeStatus({
    documentId: arq.document.id,
    versionId: arq.version.id,
    from: "RASCUNHO",
    to: "EM_REVISAO",
    userId: ana.id,
    createdAt: daysAgo(23),
  });
  await changeStatus({
    documentId: arq.document.id,
    versionId: arq.version.id,
    from: "EM_REVISAO",
    to: "APROVADO_PARA_OBRA",
    userId: ana.id,
    createdAt: daysAgo(20),
  });

  const arqR01 = await addVersion({
    documentId: arq.document.id,
    code: "ARQ-001",
    title: "Planta Baixa - Pavimento Térreo",
    authorId: carlos.id,
    createdAt: daysAgo(6),
    changeReason: "Ajuste de layout da recepção solicitado pelo cliente.",
    previousRevisionNumber: 0,
  });
  await changeStatus({
    documentId: arq.document.id,
    versionId: arqR01.id,
    from: "RASCUNHO",
    to: "EM_REVISAO",
    userId: ana.id,
    createdAt: daysAgo(4),
  });
  await changeStatus({
    documentId: arq.document.id,
    versionId: arqR01.id,
    from: "EM_REVISAO",
    to: "APROVADO_PARA_OBRA",
    userId: ana.id,
    createdAt: daysAgo(1),
  });

  // 2) Estruturas — ainda em revisão, nunca aprovada (estado "pendente").
  const est = await createDocument({
    projectId: horizon.id,
    discipline: "ESTRUTURAS",
    code: "EST-001",
    title: "Planta de Fundação",
    authorId: beatriz.id,
    createdAt: daysAgo(10),
    changeReason: "Emissão inicial para análise estrutural.",
  });
  await changeStatus({
    documentId: est.document.id,
    versionId: est.version.id,
    from: "RASCUNHO",
    to: "EM_REVISAO",
    userId: beatriz.id,
    createdAt: daysAgo(8),
  });

  // 3) Elétrica — aprovada diretamente, uma única revisão.
  const ele = await createDocument({
    projectId: horizon.id,
    discipline: "ELETRICA",
    code: "ELE-001",
    title: "Diagrama Unifilar",
    authorId: beatriz.id,
    createdAt: daysAgo(15),
    changeReason: "Emissão inicial do diagrama unifilar.",
  });
  await changeStatus({
    documentId: ele.document.id,
    versionId: ele.version.id,
    from: "RASCUNHO",
    to: "EM_REVISAO",
    userId: ana.id,
    createdAt: daysAgo(13),
  });
  await changeStatus({
    documentId: ele.document.id,
    versionId: ele.version.id,
    from: "EM_REVISAO",
    to: "APROVADO_PARA_OBRA",
    userId: ana.id,
    createdAt: daysAgo(12),
  });

  // 4) Hidráulica — recém enviada, ainda em rascunho.
  await createDocument({
    projectId: horizon.id,
    discipline: "HIDRAULICA",
    code: "HID-001",
    title: "Planta de Esgoto Sanitário",
    authorId: carlos.id,
    createdAt: daysAgo(2),
    changeReason: "Emissão inicial para revisão interna.",
  });

  // Segundo projeto, mais simples — apenas um documento em rascunho.
  await createDocument({
    projectId: bosque.id,
    discipline: "ARQUITETURA",
    code: "ARQ-001",
    title: "Planta Baixa - Unidade Tipo",
    authorId: carlos.id,
    createdAt: daysAgo(3),
    changeReason: "Emissão inicial para revisão interna.",
  });

  console.log("Seed concluído.");
  console.log(`- QR da revisão obsoleta (ARQ-001 R00): /v/${arq.version.qrCode}`);
  console.log(`- QR da revisão ativa (ARQ-001 R01): /v/${arqR01.qrCode}`);
  console.log(`- QR pendente (EST-001 R00): /v/${est.version.qrCode}`);
  console.log(`- QR aprovada direto (ELE-001 R00): /v/${ele.version.qrCode}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
