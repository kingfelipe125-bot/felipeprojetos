import { NextResponse } from "next/server";
import { getVerificationStatus } from "@/lib/verification";

export async function GET(_req: Request, { params }: { params: { code: string } }) {
  const result = await getVerificationStatus(params.code);

  if (!result) {
    return NextResponse.json({ found: false }, { status: 404 });
  }

  return NextResponse.json({
    found: true,
    isCurrent: result.isCurrent,
    isPending: result.isPending,
    version: {
      id: result.version.id,
      revisionLabel: result.version.revisionLabel,
      status: result.version.status,
      createdAt: result.version.createdAt,
    },
    activeVersion: result.activeVersion
      ? { revisionLabel: result.activeVersion.revisionLabel, status: result.activeVersion.status }
      : null,
    document: {
      code: result.document.code,
      title: result.document.title,
      discipline: result.document.discipline,
    },
    project: { name: result.project.name },
  });
}
