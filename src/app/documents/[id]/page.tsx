import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, Download, ExternalLink, User, Calendar, FileText, History } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { prisma } from "@/lib/prisma";
import { SiteHeader } from "@/components/site-header";
import { StatusBadge } from "@/components/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UploadVersionDialog } from "@/components/upload-version-dialog";
import { VersionStatusForm } from "@/components/version-status-form";
import { generateQrDataUrl, getVerificationUrl } from "@/lib/qrcode";
import { formatRevisionLabel } from "@/lib/revision";
import {
  DISCIPLINE_LABELS,
  STATUS_TRANSITIONS,
  type Discipline,
  type DocumentStatus,
} from "@/lib/constants";

export const dynamic = "force-dynamic";

function formatDate(d: Date) {
  return format(d, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default async function DocumentPage({ params }: { params: { id: string } }) {
  const document = await prisma.document.findUnique({
    where: { id: params.id },
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

  if (!document) notFound();

  const users = await prisma.user.findMany({ orderBy: { name: "asc" } });

  const nextRevisionLabel = formatRevisionLabel((document.versions[0]?.revisionNumber ?? -1) + 1);

  const qrByVersion = new Map<string, string>();
  await Promise.all(
    document.versions.map(async (v) => {
      qrByVersion.set(v.id, await generateQrDataUrl(v.qrCode));
    })
  );

  const changelog = document.versions
    .flatMap((v) => v.auditLogs.map((log) => ({ ...log, revisionLabel: v.revisionLabel })))
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  return (
    <div>
      <SiteHeader />
      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        <Link
          href={`/projects/${document.project.id}`}
          className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="h-4 w-4" />
          {document.project.name}
        </Link>

        <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {DISCIPLINE_LABELS[document.discipline as Discipline]} · {document.code}
            </p>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">{document.title}</h1>
          </div>
          <UploadVersionDialog documentId={document.id} nextRevisionLabel={nextRevisionLabel} users={users} />
        </div>

        <Card className="mb-6 border-2 border-primary/20 bg-primary/5">
          <CardContent className="flex flex-wrap items-center justify-between gap-4 py-5">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Versão Ativa</p>
              {document.activeVersion ? (
                <div className="mt-1 flex items-center gap-3">
                  <span className="text-2xl font-bold text-foreground">{document.activeVersion.revisionLabel}</span>
                  <StatusBadge status={document.activeVersion.status as DocumentStatus} />
                </div>
              ) : (
                <p className="mt-1 text-sm text-muted-foreground">
                  Nenhuma versão foi aprovada para obra ainda.
                </p>
              )}
            </div>
            {document.activeVersion && (
              <Link
                href={`/v/${document.activeVersion.qrCode}`}
                target="_blank"
                className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
              >
                Ver página pública de validação
                <ExternalLink className="h-3.5 w-3.5" />
              </Link>
            )}
          </CardContent>
        </Card>

        <div className="mb-8">
          <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold text-foreground">
            <FileText className="h-5 w-5" />
            Histórico de Revisões
          </h2>
          <div className="flex flex-col gap-3">
            {document.versions.map((version) => {
              const isActive = document.activeVersionId === version.id;
              const allowed = STATUS_TRANSITIONS[version.status as DocumentStatus] ?? [];
              return (
                <Card key={version.id} className={isActive ? "border-emerald-300" : undefined}>
                  <CardContent className="flex flex-col gap-4 py-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex gap-4">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={qrByVersion.get(version.id)!}
                        alt={`QR Code ${version.revisionLabel}`}
                        width={88}
                        height={88}
                        className="h-[88px] w-[88px] shrink-0 rounded-md border border-border"
                      />
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <span className="text-lg font-bold text-foreground">{version.revisionLabel}</span>
                          <StatusBadge status={version.status as DocumentStatus} />
                          {isActive && (
                            <span className="text-xs font-semibold text-emerald-700">Versão Ativa</span>
                          )}
                        </div>
                        <p className="flex items-center gap-1 text-xs text-muted-foreground">
                          <User className="h-3 w-3" /> {version.author.name}
                          <span className="mx-1">·</span>
                          <Calendar className="h-3 w-3" /> {formatDate(version.createdAt)}
                        </p>
                        {version.changeReason && (
                          <p className="text-sm text-foreground">{version.changeReason}</p>
                        )}
                        <div className="flex items-center gap-3 text-xs">
                          <a href={version.fileUrl} download={version.fileName} className="inline-flex items-center gap-1 text-primary hover:underline">
                            <Download className="h-3 w-3" /> {version.fileName} ({formatBytes(version.fileSize)})
                          </a>
                          <a
                            href={`/api/versions/${version.id}/qrcode`}
                            className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground"
                          >
                            <Download className="h-3 w-3" /> QR Code (PNG)
                          </a>
                        </div>
                        <p className="truncate text-[11px] text-muted-foreground">{getVerificationUrl(version.qrCode)}</p>
                      </div>
                    </div>
                    <div className="sm:w-72 sm:shrink-0">
                      <VersionStatusForm versionId={version.id} allowedTransitions={allowed} users={users} />
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        <div>
          <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold text-foreground">
            <History className="h-5 w-5" />
            Log de Auditoria
          </h2>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm text-muted-foreground">Changelog completo do documento</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              {changelog.length === 0 && <p className="text-sm text-muted-foreground">Sem eventos registrados.</p>}
              {changelog.map((log) => (
                <div key={log.id} className="flex gap-3 border-b border-border pb-3 last:border-0 last:pb-0">
                  <span className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-primary" />
                  <div className="flex flex-col">
                    <p className="text-sm text-foreground">
                      <span className="font-semibold">{log.revisionLabel}</span> — {log.detail}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {log.user.name} · {formatDate(log.createdAt)}
                    </p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
