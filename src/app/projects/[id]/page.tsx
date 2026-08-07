import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, FileText } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { SiteHeader } from "@/components/site-header";
import { NewDocumentDialog } from "@/components/new-document-dialog";
import { StatusBadge } from "@/components/status-badge";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { DISCIPLINES, DISCIPLINE_LABELS, type Discipline, type DocumentStatus } from "@/lib/constants";

export const dynamic = "force-dynamic";

export default async function ProjectPage({ params }: { params: { id: string } }) {
  const project = await prisma.project.findUnique({
    where: { id: params.id },
    include: {
      documents: {
        include: {
          activeVersion: true,
          versions: { orderBy: { revisionNumber: "desc" }, take: 1 },
        },
        orderBy: { code: "asc" },
      },
    },
  });

  if (!project) notFound();

  const users = await prisma.user.findMany({ orderBy: { name: "asc" } });

  const documentsByDiscipline = DISCIPLINES.reduce<Record<Discipline, typeof project.documents>>(
    (acc, d) => {
      acc[d] = project.documents.filter((doc) => doc.discipline === d);
      return acc;
    },
    {} as Record<Discipline, typeof project.documents>
  );

  return (
    <div>
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <Link href="/" className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ChevronLeft className="h-4 w-4" />
          Todos os projetos
        </Link>

        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">{project.name}</h1>
            <p className="text-sm text-muted-foreground">
              {[project.client, project.location].filter(Boolean).join(" · ") || "Sem detalhes adicionais"}
            </p>
          </div>
          <NewDocumentDialog projectId={project.id} users={users} />
        </div>

        <Tabs defaultValue="TODOS">
          <TabsList className="mb-4 flex-wrap">
            <TabsTrigger value="TODOS">Todos ({project.documents.length})</TabsTrigger>
            {DISCIPLINES.map((d) => (
              <TabsTrigger key={d} value={d}>
                {DISCIPLINE_LABELS[d]} ({documentsByDiscipline[d].length})
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="TODOS">
            <DocumentList documents={project.documents} />
          </TabsContent>
          {DISCIPLINES.map((d) => (
            <TabsContent key={d} value={d}>
              <DocumentList documents={documentsByDiscipline[d]} />
            </TabsContent>
          ))}
        </Tabs>
      </main>
    </div>
  );
}

function DocumentList({
  documents,
}: {
  documents: {
    id: string;
    code: string;
    title: string;
    discipline: string;
    activeVersion: { revisionLabel: string } | null;
    versions: { revisionLabel: string; status: string; createdAt: Date }[];
  }[];
}) {
  if (documents.length === 0) {
    return (
      <Card className="flex flex-col items-center gap-2 py-12 text-center text-muted-foreground">
        <FileText className="h-8 w-8" />
        <p className="text-sm">Nenhum documento nesta categoria.</p>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {documents.map((doc) => {
        const latest = doc.versions[0];
        return (
          <Link key={doc.id} href={`/documents/${doc.id}`}>
            <Card className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 transition-shadow hover:shadow-md">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
                  <FileText className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    {doc.code} <span className="font-normal text-muted-foreground">· {doc.title}</span>
                  </p>
                  <p className="text-xs text-muted-foreground">{DISCIPLINE_LABELS[doc.discipline as Discipline]}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right text-xs">
                  <p className="font-medium text-foreground">Última rev.: {latest?.revisionLabel}</p>
                  <p className="text-muted-foreground">
                    {doc.activeVersion ? `Ativa: ${doc.activeVersion.revisionLabel}` : "Sem versão ativa"}
                  </p>
                </div>
                {latest && <StatusBadge status={latest.status as DocumentStatus} />}
              </div>
            </Card>
          </Link>
        );
      })}
    </div>
  );
}
