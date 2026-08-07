import Link from "next/link";
import { FolderKanban, FileStack, CheckCircle2, Clock3 } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { SiteHeader } from "@/components/site-header";
import { NewProjectDialog } from "@/components/new-project-dialog";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DISCIPLINE_LABELS, type Discipline } from "@/lib/constants";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const projects = await prisma.project.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      documents: {
        include: {
          activeVersion: true,
          versions: { orderBy: { revisionNumber: "desc" }, take: 1 },
        },
      },
    },
  });

  return (
    <div>
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Projetos</h1>
            <p className="text-sm text-muted-foreground">
              Acompanhe as plantas de arquitetura e engenharia de cada obra em um só lugar.
            </p>
          </div>
          <NewProjectDialog />
        </div>

        {projects.length === 0 ? (
          <Card className="flex flex-col items-center justify-center gap-2 py-16 text-center">
            <FolderKanban className="h-10 w-10 text-muted-foreground" />
            <p className="font-medium">Nenhum projeto cadastrado ainda</p>
            <p className="text-sm text-muted-foreground">Crie o primeiro projeto para começar a versionar documentos.</p>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((project) => {
              const totalDocs = project.documents.length;
              const approved = project.documents.filter((d) => d.activeVersionId).length;
              const pending = project.documents.filter((d) => {
                const latest = d.versions[0];
                return !d.activeVersionId && latest && latest.status !== "OBSOLETO";
              }).length;
              const disciplines = Array.from(new Set(project.documents.map((d) => d.discipline as Discipline)));

              return (
                <Link key={project.id} href={`/projects/${project.id}`} className="group">
                  <Card className="h-full transition-shadow group-hover:shadow-md">
                    <CardHeader>
                      <CardTitle className="line-clamp-1">{project.name}</CardTitle>
                      <CardDescription className="line-clamp-2">
                        {project.client ? `${project.client} · ` : ""}
                        {project.location || "Local não informado"}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-col gap-4">
                      <div className="flex flex-wrap gap-1.5">
                        {disciplines.length === 0 && (
                          <span className="text-xs text-muted-foreground">Sem documentos ainda</span>
                        )}
                        {disciplines.map((d) => (
                          <Badge key={d} variant="outline" className="font-normal">
                            {DISCIPLINE_LABELS[d]}
                          </Badge>
                        ))}
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-center text-xs">
                        <div className="flex flex-col items-center gap-1 rounded-md bg-muted p-2">
                          <FileStack className="h-4 w-4 text-muted-foreground" />
                          <span className="font-semibold text-foreground">{totalDocs}</span>
                          <span className="text-muted-foreground">Documentos</span>
                        </div>
                        <div className="flex flex-col items-center gap-1 rounded-md bg-emerald-50 p-2">
                          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                          <span className="font-semibold text-emerald-700">{approved}</span>
                          <span className="text-emerald-700/80">Aprovados</span>
                        </div>
                        <div className="flex flex-col items-center gap-1 rounded-md bg-amber-50 p-2">
                          <Clock3 className="h-4 w-4 text-amber-600" />
                          <span className="font-semibold text-amber-700">{pending}</span>
                          <span className="text-amber-700/80">Pendentes</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
