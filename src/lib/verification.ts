import { prisma } from "@/lib/prisma";

export type VerificationResult = Awaited<ReturnType<typeof getVerificationStatus>>;

export async function getVerificationStatus(code: string) {
  const version = await prisma.documentVersion.findUnique({
    where: { qrCode: code },
    include: {
      author: true,
      document: {
        include: {
          project: true,
          activeVersion: true,
        },
      },
    },
  });

  if (!version) return null;

  const activeVersion = version.document.activeVersion;
  const isActiveVersion = !!activeVersion && activeVersion.id === version.id;
  const isCurrent = isActiveVersion && version.status === "APROVADO_PARA_OBRA";

  // "pending": documento nunca teve uma versão aprovada ainda.
  const isPending = !activeVersion && version.status !== "OBSOLETO";

  return {
    version,
    document: version.document,
    project: version.document.project,
    activeVersion,
    isCurrent,
    isPending,
  };
}
