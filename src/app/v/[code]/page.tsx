import { CheckCircle2, AlertTriangle, Clock3, HelpCircle } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { getVerificationStatus } from "@/lib/verification";
import { DISCIPLINE_LABELS, type Discipline } from "@/lib/constants";

export const dynamic = "force-dynamic";

function Shell({
  tone,
  icon,
  title,
  subtitle,
  children,
}: {
  tone: "green" | "red" | "amber" | "gray";
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  children?: React.ReactNode;
}) {
  const toneClasses: Record<typeof tone, string> = {
    green: "bg-emerald-600",
    red: "bg-red-600",
    amber: "bg-amber-500",
    gray: "bg-slate-600",
  };

  return (
    <div className={`flex min-h-screen flex-col items-center justify-center px-6 py-10 text-center text-white ${toneClasses[tone]}`}>
      <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-white/15">{icon}</div>
      <h1 className="mb-2 text-2xl font-extrabold leading-tight sm:text-3xl">{title}</h1>
      <p className="mb-6 max-w-sm text-sm text-white/90 sm:text-base">{subtitle}</p>
      {children}
      <p className="mt-10 text-xs text-white/70">
        Verificado em {format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
      </p>
    </div>
  );
}

function InfoCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="w-full max-w-sm rounded-xl bg-white/15 p-4 text-left text-sm backdrop-blur-sm">{children}</div>
  );
}

export default async function VerifyPage({ params }: { params: { code: string } }) {
  const result = await getVerificationStatus(params.code);

  if (!result) {
    return (
      <Shell
        tone="gray"
        icon={<HelpCircle className="h-12 w-12" />}
        title="QR Code não reconhecido"
        subtitle="Este código não corresponde a nenhum documento cadastrado no sistema. Verifique se a planta é original e não foi adulterada."
      />
    );
  }

  const { version, document, project, activeVersion, isCurrent, isPending } = result;
  const disciplineLabel = DISCIPLINE_LABELS[document.discipline as Discipline];

  const docInfo = (
    <InfoCard>
      <p className="text-xs uppercase tracking-wide text-white/70">{disciplineLabel} · {document.code}</p>
      <p className="text-base font-semibold">{document.title}</p>
      <p className="mt-1 text-xs text-white/80">Projeto: {project.name}</p>
    </InfoCard>
  );

  if (isCurrent) {
    return (
      <Shell
        tone="green"
        icon={<CheckCircle2 className="h-12 w-12" />}
        title={`Esta planta é a versão mais recente (${version.revisionLabel} — Aprovada)`}
        subtitle="Pode ser utilizada em obra com segurança. Nenhuma revisão mais recente foi publicada."
      >
        {docInfo}
      </Shell>
    );
  }

  if (isPending) {
    return (
      <Shell
        tone="amber"
        icon={<Clock3 className="h-12 w-12" />}
        title={`Atenção: revisão ${version.revisionLabel} ainda não foi aprovada para obra`}
        subtitle="Este documento está em elaboração ou em revisão interna. Não utilize esta folha em obra antes da aprovação formal."
      >
        {docInfo}
      </Shell>
    );
  }

  return (
    <Shell
      tone="red"
      icon={<AlertTriangle className="h-12 w-12" />}
      title="ALERTA: Esta planta está obsoleta!"
      subtitle={
        activeVersion
          ? `A versão atual aprovada é a ${activeVersion.revisionLabel}. Não utilize a revisão ${version.revisionLabel} em obra.`
          : `A revisão ${version.revisionLabel} foi substituída e não deve mais ser utilizada em obra.`
      }
    >
      {docInfo}
    </Shell>
  );
}
